"""
Centra una pieza de mobiliario dentro de su recuadro.

Detecta el mueble separándolo del fondo liso (el color de las esquinas),
lo coloca en el centro de un lienzo cuadrado y deja el mismo margen
alrededor. El fondo se amplía con su propio color, así que no se nota.

Uso:
  python3 herramientas/centrar_mueble.py ENTRADA SALIDA [margen] [--colgante]
    margen: espacio libre alrededor del mueble, en tanto por uno (0.12 = 12 %)
    --colgante: para lámparas de suspensión. Centra el cuerpo de la lámpara
                sin contar los cables, que siguen subiendo hasta el borde.
    --degradado: para fotos de estudio con fondo en degradado (no blanco liso).
                Compara cada píxel con el fondo de su propia fila y, si hace
                falta ampliar, continúa el degradado de los bordes.
"""

import sys

import numpy as np
from PIL import Image

LADO = 900          # tamaño final, en píxeles (cuadrado)
UMBRAL = 28         # diferencia de color a partir de la cual algo "no es fondo"
UMBRAL_DEGRADADO = 90   # más alto con fondos en degradado o con viñeta


def color_fondo(a):
    esquinas = np.concatenate([a[:12, :12], a[:12, -12:], a[-12:, :12], a[-12:, -12:]]).reshape(-1, 3)
    return np.median(esquinas, axis=0)


def caja_mueble(a, fondo, colgante=False, degradado=False):
    if degradado:
        # el fondo de cada fila es el color de sus extremos (cambia de arriba abajo)
        bordes = np.concatenate([a[:, :20], a[:, -20:]], axis=1).astype(int)
        fondo = np.median(bordes, axis=1)[:, None, :]
    diferencia = np.abs(a.astype(int) - fondo).sum(axis=2) > (UMBRAL_DEGRADADO if degradado else UMBRAL)
    # se ignoran motas sueltas: una fila o columna cuenta si tiene varios píxeles.
    # En las colgantes, las filas con solo los cables (muy finos) tampoco cuentan.
    minimo = a.shape[1] * 0.03 if colgante else 3
    filas = np.where(diferencia.sum(axis=1) > minimo)[0]
    if colgante:
        diferencia = diferencia[filas.min():filas.max() + 1]
    cols = np.where(diferencia.sum(axis=0) > 3)[0]
    return cols.min(), filas.min(), cols.max(), filas.max()


def centrar(entrada, salida, margen=0.12, colgante=False, degradado=False):
    im = Image.open(entrada).convert("RGB")
    a = np.asarray(im)
    fondo = color_fondo(a)
    x0, y0, x1, y1 = caja_mueble(a, fondo, colgante, degradado)
    w, h = x1 - x0 + 1, y1 - y0 + 1
    lado = int(max(w, h) / (1 - 2 * margen))

    # Se recorta un cuadrado centrado en el mueble a partir de la foto original
    # (así los cables o las patas que sobresalen se conservan). Lo que queda
    # fuera de la foto se rellena con el color del fondo.
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    izq, arr = int(round(cx - lado / 2)), int(round(cy - lado / 2))
    if degradado:
        # se amplía repitiendo los píxeles del borde: el degradado continúa
        relleno = ((max(0, -arr), max(0, arr + lado - a.shape[0])), (max(0, -izq), max(0, izq + lado - a.shape[1])), (0, 0))
        ampliada = np.pad(a, relleno, mode="edge")
        y = arr + relleno[0][0]
        x = izq + relleno[1][0]
        lienzo = Image.fromarray(ampliada[y:y + lado, x:x + lado])
    else:
        lienzo = Image.new("RGB", (lado, lado), tuple(int(v) for v in fondo))
        lienzo.paste(im, (-izq, -arr))
    lienzo.resize((LADO, LADO), Image.LANCZOS).save(salida, quality=86, optimize=True, progressive=True)
    print(f"{entrada}: mueble {w}x{h}px centrado en {LADO}x{LADO} (margen {int(margen * 100)} %)")


if __name__ == "__main__":
    args = [x for x in sys.argv[1:] if not x.startswith("--")]
    centrar(args[0], args[1], float(args[2]) if len(args) > 2 else 0.12, "--colgante" in sys.argv, "--degradado" in sys.argv)
