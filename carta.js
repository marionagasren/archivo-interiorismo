// =====================================================================
//  341 STUDIO · carta.js
//  Carta de colores completa (RAL Classic + RAL Design) con buscador y
//  filtro por familias de tono. Se usa en la Biblioteca → Colores y en el
//  Generador → Paleta de colores.
// =====================================================================

let cacheCarta = null;
const MUESTRA_FAMILIA = 18;   // colores que se ven de cada familia antes de desplegarla

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
      <div class="carta-grupos">
        ${FAMILIAS_COLOR.map(familia => {
          const grupo = colores.filter(c => c.familia === familia);
          if (!grupo.length) return "";
          // Muestra resumida: colores repartidos de claro a oscuro por toda la familia
          const paso = grupo.length / Math.min(MUESTRA_FAMILIA, grupo.length);
          const muestra = new Set(Array.from({ length: Math.min(MUESTRA_FAMILIA, grupo.length) }, (_, i) => Math.floor(i * paso)));
          return `
            <section class="carta-grupo" data-grupo="${familia}">
              <header class="carta-grupo-cabecera">
                <h3>${familia}</h3>
                <span class="carta-grupo-franja">${muestra.size ? [...muestra].filter((_, i) => i % 2 === 0).map(i => `<span style="background:${grupo[i].hex}"></span>`).join("") : ""}</span>
                <span class="carta-grupo-total">${grupo.length} colores</span>
              </header>
              <div class="carta-rejilla">
                ${grupo.map((c, i) => `
                  <figure class="carta-color ${muestra.has(i) ? "" : "extra"}" data-hex="${c.hex}" data-familia="${c.familia}" data-proyectos="${c.proyectos.length ? 1 : 0}" data-busqueda="${c.busqueda}">
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
              <button class="carta-desplegar" data-desplegar>Ver los ${grupo.length} ${familia.toLowerCase()}</button>
            </section>`;
        }).join("")}
      </div>
      <p class="vacio carta-sin-resultados" hidden>No hay colores que coincidan con la búsqueda.</p>
    </div>`;
}

// Filtra la carta sin volver a dibujarla (más rápido con 2.000 colores).
// alAnadir(color) se llama al pulsar «+»; al pulsar la muestra se copia el hex.
function activarCarta(contenedor, { alAnadir, alElegir } = {}) {
  const input = contenedor.querySelector(".carta input");
  const fichas = [...contenedor.querySelectorAll(".carta-color")];
  const grupos = [...contenedor.querySelectorAll(".carta-grupo")];
  const contador = contenedor.querySelector(".carta-contador");
  const sinResultados = contenedor.querySelector(".carta-sin-resultados");
  const desplegados = new Set();   // familias abiertas con «Ver todos»
  let familia = "";

  // Vista «Todos» sin búsqueda: cada familia muestra un resumen y se despliega.
  // Con una familia elegida, «De los proyectos» o una búsqueda: se ve todo lo que coincide.
  const filtrar = () => {
    const palabras = normalizar(input.value).split(" ").filter(Boolean);
    const resumen = !familia && !palabras.length;
    let visibles = 0;
    for (const f of fichas) {
      const okFamilia = !familia || (familia === "proyectos" ? f.dataset.proyectos === "1" : f.dataset.familia === familia);
      const okTexto = palabras.every(p => f.dataset.busqueda.includes(p));
      const plegada = resumen && f.classList.contains("extra") && !desplegados.has(f.dataset.familia);
      f.hidden = !(okFamilia && okTexto) || plegada;
      if (okFamilia && okTexto) visibles++;
    }
    for (const g of grupos) {
      const abierto = desplegados.has(g.dataset.grupo);
      g.hidden = !g.querySelector(".carta-color:not([hidden])");
      g.classList.toggle("abierto", abierto);
      const boton = g.querySelector("[data-desplegar]");
      boton.hidden = !resumen;
      const total = g.querySelectorAll(".carta-color").length;
      boton.textContent = abierto ? "Ver menos" : `Ver los ${total} colores`;
    }
    contador.textContent = `${visibles} ${visibles === 1 ? "color" : "colores"}`;
    sinResultados.hidden = visibles > 0;
  };

  contenedor.querySelector(".carta-grupos").addEventListener("click", e => {
    const boton = e.target.closest("[data-desplegar]");
    if (!boton) return;
    const g = boton.closest(".carta-grupo");
    const nombre = g.dataset.grupo;
    desplegados.has(nombre) ? desplegados.delete(nombre) : desplegados.add(nombre);
    filtrar();
    if (!desplegados.has(nombre)) g.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  input.addEventListener("input", filtrar);
  contenedor.querySelector(".carta-familias").addEventListener("click", e => {
    const b = e.target.closest("button");
    if (!b) return;
    familia = b.dataset.familia;
    contenedor.querySelectorAll(".carta-familias button").forEach(x => x.classList.toggle("activa", x === b));
    filtrar();
  });
  contenedor.querySelector(".carta-grupos").addEventListener("click", e => {
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
