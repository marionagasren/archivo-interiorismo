"""
Extrae automáticamente los colores de cada proyecto.

Recorre img/proyectos/<proyecto>/, analiza las fotos (foto-*.jpg),
encuentra los colores principales y los acentos, y busca el color RAL
más parecido de la lista herramientas/colores-ral.json.

El resultado se guarda en data/auto.js, que la web lee directamente.
También lista las fotos y los planos de cada carpeta, así que al subir
imágenes nuevas no hace falta tocar nada más.

Uso:  python3 herramientas/extraer_colores.py
"""

import json
from pathlib import Path

import numpy as np
from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
CARPETA_PROYECTOS = RAIZ / "img" / "proyectos"
LISTA_RAL = RAIZ / "herramientas" / "colores-ral.json"
SALIDA = RAIZ / "data" / "auto.js"

EXTENSIONES = {".jpg", ".jpeg", ".png", ".webp"}
NUM_PRINCIPALES = 4    # colores dominantes (paredes, suelos, madera...)
NUM_ACENTOS = 2        # colores con más saturación (lámparas, textiles...)
PIXELES_POR_FOTO = 6000


# ---------- Conversión de color (sRGB → CIELAB) ----------

def rgb_a_lab(rgb):
    rgb = np.asarray(rgb, dtype=float) / 255.0
    rgb = np.where(rgb > 0.04045, ((rgb + 0.055) / 1.055) ** 2.4, rgb / 12.92)
    m = np.array([[0.4124, 0.3576, 0.1805],
                  [0.2126, 0.7152, 0.0722],
                  [0.0193, 0.1192, 0.9505]])
    xyz = rgb @ m.T / np.array([0.95047, 1.0, 1.08883])
    f = np.where(xyz > 0.008856, np.cbrt(xyz), 7.787 * xyz + 16 / 116)
    L = 116 * f[..., 1] - 16
    a = 500 * (f[..., 0] - f[..., 1])
    b = 200 * (f[..., 1] - f[..., 2])
    return np.stack([L, a, b], axis=-1)


def lab_a_rgb(lab):
    L, a, b = lab
    fy = (L + 16) / 116
    f = np.array([fy + a / 500, fy, fy - b / 200])
    xyz = np.where(f ** 3 > 0.008856, f ** 3, (f - 16 / 116) / 7.787)
    xyz *= np.array([0.95047, 1.0, 1.08883])
    m = np.array([[3.2406, -1.5372, -0.4986],
                  [-0.9689, 1.8758, 0.0415],
                  [0.0557, -0.2040, 1.0570]])
    rgb = m @ xyz
    rgb = np.where(rgb > 0.0031308, 1.055 * np.clip(rgb, 0, None) ** (1 / 2.4) - 0.055, 12.92 * rgb)
    return np.clip(np.round(rgb * 255), 0, 255).astype(int)


def a_hex(rgb):
    return "#" + "".join(f"{int(v):02X}" for v in rgb)


def de_hex(h):
    return [int(h[i:i + 2], 16) for i in (1, 3, 5)]


def distancia(lab1, lab2):
    """Diferencia de color CIE94: más fiel a la percepción que la distancia simple."""
    dL = lab1[..., 0] - lab2[..., 0]
    c1 = np.hypot(lab1[..., 1], lab1[..., 2])
    c2 = np.hypot(lab2[..., 1], lab2[..., 2])
    dC = c1 - c2
    dH2 = np.maximum((lab1[..., 1] - lab2[..., 1]) ** 2 + (lab1[..., 2] - lab2[..., 2]) ** 2 - dC ** 2, 0)
    return np.sqrt(dL ** 2 + (dC / (1 + 0.045 * c1)) ** 2 + dH2 / (1 + 0.015 * c1) ** 2)


# ---------- Extracción ----------

def muestrear(foto, rng):
    img = Image.open(foto).convert("RGB")
    img.thumbnail((240, 240))
    px = np.asarray(img).reshape(-1, 3)
    if len(px) > PIXELES_POR_FOTO:
        px = px[rng.choice(len(px), PIXELES_POR_FOTO, replace=False)]
    lab = rgb_a_lab(px)
    # Corrige la exposición: en las fotos las paredes blancas salen grisáceas
    # por la sombra, aunque el ojo las ve blancas. Aclaramos cada foto para
    # que sus zonas más claras lleguen casi al blanco.
    claro = np.percentile(lab[:, 0], 97)
    lab[:, 0] = np.minimum(lab[:, 0] * 96 / claro, 100)
    return lab


def kmeans(datos, k, rng, iteraciones=25):
    centros = [datos[rng.integers(len(datos))]]
    for _ in range(k - 1):  # inicialización k-means++
        d = np.min([np.sum((datos - c) ** 2, axis=1) for c in centros], axis=0)
        centros.append(datos[rng.choice(len(datos), p=d / d.sum())])
    centros = np.array(centros)
    for _ in range(iteraciones):
        etiquetas = np.argmin(((datos[:, None] - centros[None]) ** 2).sum(-1), axis=1)
        for i in range(k):
            if np.any(etiquetas == i):
                centros[i] = datos[etiquetas == i].mean(axis=0)
    pesos = np.bincount(etiquetas, minlength=k) / len(datos)
    return centros, pesos, etiquetas


def color_limpio(pixeles, centro):
    """El promedio de un grupo sale apagado; usamos su parte más clara y viva."""
    croma = np.hypot(pixeles[:, 1], pixeles[:, 2])
    sel = (pixeles[:, 0] >= np.percentile(pixeles[:, 0], 40)) & (croma >= np.percentile(croma, 40))
    return pixeles[sel].mean(axis=0) if sel.sum() > 10 else centro


def elegir_colores(colores, pesos):
    croma = np.hypot(colores[:, 1], colores[:, 2])
    # "Presencia" de cada color: su peso más el de los colores muy parecidos
    presencia = np.array([pesos[distancia(np.broadcast_to(c, colores.shape), colores) < 12].sum() for c in colores])
    elegidos = []

    def distinto(i, umbral):
        return all(distancia(colores[i], colores[j]) > umbral for j in elegidos)

    # 1. El fondo: el color claro más presente (paredes, techos)
    claros = [i for i in np.argsort(-presencia) if 80 < colores[i, 0] < 96]
    if claros:
        elegidos.append(claros[0])

    # 2. Principales: presentes, favoreciendo un poco los que tienen color
    for i in np.argsort(-(presencia * (1 + croma / 30))):
        if len(elegidos) >= NUM_PRINCIPALES:
            break
        if colores[i, 0] < 96 and distinto(i, 14):
            elegidos.append(i)

    # 3. Acentos: colores que ocupan poco pero destacan (madera de cerezo,
    #    una silla negra, un sofá azul...). Se elige el más diferente de los
    #    que ya hay, favoreciendo los saturados y un poco los más presentes.
    principales = len(elegidos)
    while len(elegidos) < principales + NUM_ACENTOS:
        candidatos = [i for i in range(len(colores))
                      if i not in elegidos and 12 < colores[i, 0] < 88 and pesos[i] > 0.004
                      # dos acentos no pueden ser casi iguales
                      and all(np.linalg.norm(colores[i] - colores[j]) > 20 for j in elegidos[principales:])]
        if not candidatos:
            break
        diferencia = lambda i: min(np.linalg.norm(colores[i] - colores[j]) for j in elegidos)
        mejor = max(candidatos, key=lambda i: diferencia(i) * pesos[i] ** 0.25 * (1 + croma[i] / 40))
        if diferencia(mejor) < 12:
            break
        elegidos.append(mejor)

    return [(i, presencia[i], "principal" if n < principales else "acento") for n, i in enumerate(elegidos)]


def cargar_ral():
    lista = json.loads(LISTA_RAL.read_text(encoding="utf-8"))
    lab = rgb_a_lab(np.array([de_hex(c["hex"]) for c in lista]))
    return lista, lab


def ral_mas_cercano(lab, lista, lab_ral, sistema):
    indices = [i for i, c in enumerate(lista) if c["sistema"] == sistema]
    d = distancia(np.broadcast_to(lab, (len(indices), 3)), lab_ral[indices])
    mejor = indices[int(np.argmin(d))]
    return {**lista[mejor], "diferencia": round(float(d.min()), 1)}


def analizar_proyecto(carpeta, lista, lab_ral):
    archivos = sorted(f for f in carpeta.iterdir() if f.suffix.lower() in EXTENSIONES)
    fotos = [f for f in archivos if f.name.lower().startswith("foto")]
    planos = [f for f in archivos if f.name.lower().startswith("plano")]
    ruta = lambda f: f.relative_to(RAIZ).as_posix()

    colores = []
    if fotos:
        rng = np.random.default_rng(42)  # semilla fija: mismo resultado cada vez
        datos = np.concatenate([muestrear(f, rng) for f in fotos])
        centros, pesos, etiquetas = kmeans(datos, 24, rng)
        limpios = np.array([color_limpio(datos[etiquetas == i], centros[i]) for i in range(len(centros))])
        for i, presencia, tipo in elegir_colores(limpios, pesos):
            colores.append({
                "hex": a_hex(lab_a_rgb(limpios[i])),
                "tipo": tipo,
                "presencia": round(float(presencia) * 100, 1),
                "ral": ral_mas_cercano(limpios[i], lista, lab_ral, "RAL Design"),
                "ralClassic": ral_mas_cercano(limpios[i], lista, lab_ral, "RAL Classic"),
            })

    return {"fotos": [ruta(f) for f in fotos], "planos": [ruta(f) for f in planos], "colores": colores}


def main():
    lista, lab_ral = cargar_ral()
    resultado = {}
    for carpeta in sorted(p for p in CARPETA_PROYECTOS.iterdir() if p.is_dir()):
        resultado[carpeta.name] = analizar_proyecto(carpeta, lista, lab_ral)
        nombres = ", ".join(f'{c["hex"]} ({c["ral"]["codigo"]})' for c in resultado[carpeta.name]["colores"])
        print(f"{carpeta.name}: {nombres}")

    SALIDA.parent.mkdir(exist_ok=True)
    SALIDA.write_text(
        "// ARCHIVO GENERADO AUTOMÁTICAMENTE por herramientas/extraer_colores.py\n"
        "// No lo edites a mano: se vuelve a crear cada vez que se suben fotos.\n"
        "window.AUTO = " + json.dumps(resultado, ensure_ascii=False, indent=2) + ";\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
