// =====================================================================
//  341 STUDIO · carta.js
//  Carta de colores completa (RAL Classic + RAL Design) con buscador y
//  filtro por familias de tono. Se usa en la Biblioteca → Colores y en el
//  Generador → Paleta de colores.
// =====================================================================

let cacheCarta = null;

// Todos los colores de la carta, con su familia y su posición en el espacio
// de color (Lab), ordenados de claro a oscuro dentro de cada familia
function cartaColores() {
  if (cacheCarta) return cacheCarta;
  const enProyectos = new Map(bibliotecaColores().map(c => [c.codigo, c.proyectos]));
  cacheCarta = window.CARTA_COLORES.map(([codigo, nombre, hex]) => {
    const lab = hexALab(hex);
    return {
      codigo, nombre, hex, lab,
      sistema: /^RAL \d{4}$/.test(codigo) ? "RAL Classic" : "RAL Design",
      familia: familiaColor(hex),
      proyectos: enProyectos.get(codigo) || [],
      busqueda: normalizar(`${nombre} ${codigo} ${hex} ${familiaColor(hex)}`),
    };
  });
  const orden = Object.fromEntries(FAMILIAS_COLOR.map((f, i) => [f, i]));
  cacheCarta.sort((a, b) => orden[a.familia] - orden[b.familia] || b.lab[0] - a.lab[0]);
  return cacheCarta;
}

function normalizar(textoLibre) {
  return textoLibre.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

// Color de la carta más parecido a un Lab dado (para los colores de los
// proyectos que no tienen código, y para el generador de paletas)
function colorMasCercano(lab, excluir = new Set()) {
  let mejor = null, distancia = Infinity;
  for (const c of cartaColores()) {
    if (excluir.has(c.hex)) continue;
    const d = (c.lab[0] - lab[0]) ** 2 + (c.lab[1] - lab[1]) ** 2 + (c.lab[2] - lab[2]) ** 2;
    if (d < distancia) { distancia = d; mejor = c; }
  }
  return mejor;
}

// ---------------------------------------------------------------------
//  HTML de la carta: buscador, familias y rejilla de muestras
// ---------------------------------------------------------------------

function htmlCarta({ accion = "Añadir a la paleta" } = {}) {
  const colores = cartaColores();
  const hayProyectos = colores.some(c => c.proyectos.length);
  return `
    <div class="carta">
      <div class="carta-herramientas">
        <label class="buscador">
          <span class="buscador-icono" aria-hidden="true">⌕</span>
          <input type="search" placeholder="Buscar por nombre, código o hex — p. ej. sand, 7044, #E1DACE" aria-label="Buscar color">
        </label>
        <span class="carta-contador"></span>
      </div>
      <nav class="filtros carta-familias">
        <button data-familia="" class="activa">Todos</button>
        ${hayProyectos ? `<button data-familia="proyectos">De los proyectos</button>` : ""}
        ${FAMILIAS_COLOR.map(f => `<button data-familia="${f}">${f}</button>`).join("")}
      </nav>
      <div class="carta-rejilla">
        ${colores.map(c => `
          <figure class="carta-color" data-hex="${c.hex}" data-familia="${c.familia}" data-proyectos="${c.proyectos.length ? 1 : 0}" data-busqueda="${c.busqueda}">
            <button class="carta-muestra ${esOscuro(c.hex) ? "oscuro" : ""}" style="background:${c.hex}" title="Copiar ${c.hex}">
              <span class="carta-mas" data-anadir title="${accion}">+</span>
            </button>
            <figcaption>
              <span class="carta-nombre">${texto(c.nombre)}</span>
              <span class="carta-codigo">${texto(c.codigo)} · ${c.hex}</span>
              ${c.proyectos.length ? `<span class="carta-proyectos">${c.proyectos.map(p => texto(p.nombre)).join(", ")}</span>` : ""}
            </figcaption>
          </figure>`).join("")}
      </div>
      <p class="vacio carta-sin-resultados" hidden>No hay colores que coincidan con la búsqueda.</p>
    </div>`;
}

// Filtra la carta sin volver a dibujarla (más rápido con 2.000 colores).
// alAnadir(color) se llama al pulsar «+»; al pulsar la muestra se copia el hex.
function activarCarta(contenedor, { alAnadir, alElegir } = {}) {
  const input = contenedor.querySelector(".carta input");
  const fichas = [...contenedor.querySelectorAll(".carta-color")];
  const contador = contenedor.querySelector(".carta-contador");
  const sinResultados = contenedor.querySelector(".carta-sin-resultados");
  let familia = "";

  const filtrar = () => {
    const palabras = normalizar(input.value).split(" ").filter(Boolean);
    let visibles = 0;
    for (const f of fichas) {
      const okFamilia = !familia || (familia === "proyectos" ? f.dataset.proyectos === "1" : f.dataset.familia === familia);
      const okTexto = palabras.every(p => f.dataset.busqueda.includes(p));
      f.hidden = !(okFamilia && okTexto);
      if (!f.hidden) visibles++;
    }
    contador.textContent = `${visibles} ${visibles === 1 ? "color" : "colores"}`;
    sinResultados.hidden = visibles > 0;
  };

  input.addEventListener("input", filtrar);
  contenedor.querySelector(".carta-familias").addEventListener("click", e => {
    const b = e.target.closest("button");
    if (!b) return;
    familia = b.dataset.familia;
    contenedor.querySelectorAll(".carta-familias button").forEach(x => x.classList.toggle("activa", x === b));
    filtrar();
  });
  contenedor.querySelector(".carta-rejilla").addEventListener("click", e => {
    const ficha = e.target.closest(".carta-color");
    if (!ficha) return;
    const color = cartaColores().find(c => c.hex === ficha.dataset.hex);
    if (e.target.closest("[data-anadir]")) { alAnadir?.(color); return; }
    if (alElegir) { alElegir(color); return; }
    copiarTexto(color.hex);
  });
  filtrar();
}

// ---------------------------------------------------------------------
//  Pequeñas utilidades: copiar al portapapeles y avisos
// ---------------------------------------------------------------------

function copiarTexto(valor) {
  navigator.clipboard?.writeText(valor).then(() => aviso(`Copiado ${valor}`), () => aviso(valor));
}

function aviso(mensaje) {
  let caja = document.querySelector(".aviso-flotante");
  if (!caja) { caja = document.createElement("div"); caja.className = "aviso-flotante"; document.body.append(caja); }
  caja.textContent = mensaje;
  caja.classList.add("visible");
  clearTimeout(caja.temporizador);
  caja.temporizador = setTimeout(() => caja.classList.remove("visible"), 1800);
}
