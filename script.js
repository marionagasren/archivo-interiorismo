// =====================================================================
//  341 STUDIO · script.js
//  Lee los datos (data/*.js) y construye cada página de la web.
//
//  La web es de una sola página: según lo que hay después de "#" en la
//  dirección, se muestra una vista u otra:
//    #/                        → portada con el nombre del estudio + proyectos
//    #/proyectos               → listado de proyectos
//    #/proyecto/bori-fontesta  → ficha de un proyecto + moodboard
//    #/biblioteca/colores      → biblioteca (colores, materiales, mobiliario)
//    #/generador               → generador de moodboards (generador.js)
//    #/generador/paleta        → generador de paletas de colores (paleta.js)
//    #/favoritos               → colores, materiales y mobiliario guardados (favoritos.js)
// =====================================================================

const AUTO = window.AUTO || {};
const PROYECTOS = window.PROYECTOS || [];
const BIBLIOTECA = window.BIBLIOTECA || { materiales: [], mobiliario: [] };

const app = document.getElementById("app");

const TIPOS_PROYECTO = { propio: "Proyectos propios", referencia: "Referencias" };


// ---------------------------------------------------------------------
//  UTILIDADES
// ---------------------------------------------------------------------

// Evita que un texto con símbolos raros rompa el HTML
function texto(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ¿El color es oscuro? Sirve para escribir encima en blanco o en negro
function esOscuro(hex) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  return 0.299 * r + 0.587 * g + 0.114 * b < 140;
}

// Convierte un nombre en un trozo de dirección: "Hormigón y cemento" → "hormigon-y-cemento"
function slug(nombre) {
  return nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function hexALab(hex) {
  const lineal = v => (v /= 255) > 0.04045 ? ((v + 0.055) / 1.055) ** 2.4 : v / 12.92;
  const [r, g, b] = [1, 3, 5].map(i => lineal(parseInt(hex.slice(i, i + 2), 16)));
  const x = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047;
  const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883;
  const f = t => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

// Clasifica un color en su familia de tono a partir de su luminosidad (L),
// su intensidad (croma) y su tono (ángulo en el círculo cromático)
const FAMILIAS_COLOR = ["Blancos y crudos", "Beiges y arenas", "Tierras y terracotas", "Marrones",
                        "Grises", "Verdes", "Azules", "Negros y oscuros"];

function familiaColor(hex) {
  const [L, a, b] = hexALab(hex);
  const croma = Math.hypot(a, b);
  const tono = (Math.atan2(b, a) * 180 / Math.PI + 360) % 360;
  if (croma >= 3.5 && tono >= 200 && tono < 300) return "Azules";
  if (croma >= 8 && tono >= 100 && tono < 200) return "Verdes";
  if (L < 25 && croma < 15) return "Negros y oscuros";
  if (L >= 82 && croma < 14) return "Blancos y crudos";
  if (croma < 6) return L >= 82 ? "Blancos y crudos" : "Grises";
  if (croma >= 22 && L >= 40) return "Tierras y terracotas";
  if (L >= 58) return "Beiges y arenas";
  return "Marrones";
}

const CATEGORIAS = {
  materiales: ["Maderas", "Piedras naturales", "Revestimientos continuos", "Hormigón y cemento",
               "Metales", "Textiles", "Vidrio", "Cerámica"],
  mobiliario: ["Sillas", "Taburetes", "Butacas y sofás", "Mesas", "Almacenaje", "Camas", "Iluminación"],
};
const TIPOS_ILUMINACION = ["Suspensión", "Sobremesa", "Pie", "Pared"];

function buscarEnBiblioteca(tipo, id) {
  return BIBLIOTECA[tipo].find(item => item.id === id);
}


// ---------------------------------------------------------------------
//  DATOS: junta la información escrita a mano con la automática
// ---------------------------------------------------------------------

function datosProyecto(p) {
  const auto = AUTO[p.id] || { fotos: [], planos: [], colores: [] };

  const coloresAuto = auto.colores.map(c => ({
    hex: c.hex,
    nombre: c.ral.nombre,
    codigo: c.ral.codigo,
    classic: `${c.ralClassic.codigo} · ${c.ralClassic.nombre}`,
    tipo: c.tipo,
  }));
  const coloresManuales = (p.colores || []).map(c => ({
    hex: c.hex, nombre: c.nombre, codigo: c.ral || "", tipo: "manual",
  }));

  return {
    ...p,
    fotos: auto.fotos,
    planos: auto.planos,
    colores: [...coloresManuales, ...coloresAuto],
    materiales: (p.materiales || []).map(id => buscarEnBiblioteca("materiales", id)).filter(Boolean),
    mobiliario: (p.mobiliario || []).map(id => buscarEnBiblioteca("mobiliario", id)).filter(Boolean),
  };
}

const proyectos = PROYECTOS.map(datosProyecto);

// Todos los colores de todos los proyectos, sin repetir (mismo código RAL = mismo color)
function bibliotecaColores() {
  const mapa = new Map();
  for (const p of proyectos) {
    for (const c of p.colores) {
      const clave = c.codigo || c.hex;
      if (!mapa.has(clave)) mapa.set(clave, { ...c, categoria: familiaColor(c.hex), proyectos: [] });
      mapa.get(clave).proyectos.push(p);
    }
  }
  return [...mapa.values()];
}

// Materiales o mobiliario de la biblioteca, con los proyectos donde aparecen
function bibliotecaPiezas(tipo) {
  return BIBLIOTECA[tipo].map(item => ({
    ...item,
    proyectos: proyectos.filter(p => p[tipo].some(x => x.id === item.id)),
  }));
}


// ---------------------------------------------------------------------
//  PIEZAS REUTILIZABLES (trozos de HTML)
// ---------------------------------------------------------------------

function fichaColor(c, grande = false) {
  return `
    <div class="muestra-color ${grande ? "grande" : ""} ${esOscuro(c.hex) ? "oscuro" : ""}" style="background:${c.hex}">
      <span class="muestra-nombre">${texto(c.nombre)}</span>
      <span class="muestra-codigo">${texto(c.codigo)}<br>${c.hex}</span>
    </div>`;
}

function fichaPieza(item, tipo) {
  const detalle = tipo === "materiales"
    ? [item.categoria, item.acabado].filter(Boolean).join(" · ")
    : [item.autor, item.marca, item.año].filter(Boolean).join(" · ");
  // Sin imagen todavía: se muestra el nombre en una ficha lisa
  // Si hay foto de detalle, aparece al pasar el ratón por encima
  const imagen = item.imagen
    ? `<img src="${texto(item.imagen)}" alt="${texto(item.nombre)}" loading="lazy">${item.detalle
        ? `<img class="pieza-detalle" src="${texto(item.detalle)}" alt="${texto(item.nombre)} · detalle" loading="lazy">` : ""}`
    : `<span class="sin-imagen">${texto(item.nombre)}</span>`;
  return `
    <figure class="pieza ${item.detalle ? "con-detalle" : ""}">
      <div class="pieza-imagen">${imagen}</div>
      <figcaption><strong>${texto(item.nombre)}</strong>${detalle ? `<span>${texto(detalle)}</span>` : ""}${botonGuardar(tipo, item.id, item.nombre)}</figcaption>
    </figure>`;
}

function enlacesProyectos(lista) {
  return lista.map(p => `<a href="#/proyecto/${p.id}">${texto(p.nombre)}</a>`).join(", ");
}

// ---------------------------------------------------------------------
//  VISTA: INICIO
//  Primero una portada a pantalla completa con el nombre del estudio;
//  al deslizar hacia abajo aparecen los proyectos.
// ---------------------------------------------------------------------

function vistaInicio() {
  app.innerHTML = `
    <section class="portada-estudio">
      <h1 class="nombre-estudio"><span>341</span> <span>Studio</span></h1>
      <img class="portada-foto" src="img/portada.jpg" alt="">
    </section>
    <div class="contenedor">${htmlProyectos("")}</div>`;
}


// ---------------------------------------------------------------------
//  VISTA: LISTADO DE PROYECTOS
//  #/proyectos            → todos
//  #/proyectos/propio     → solo los de 341 Studio
//  #/proyectos/referencia → solo las referencias
// ---------------------------------------------------------------------

function vistaProyectos(filtro) {
  app.innerHTML = htmlProyectos(filtro);
}

function htmlProyectos(filtro) {
  const tiposPresentes = Object.keys(TIPOS_PROYECTO).filter(t => proyectos.some(p => p.tipo === t));
  if (!tiposPresentes.includes(filtro)) filtro = "";
  const lista = filtro ? proyectos.filter(p => p.tipo === filtro) : proyectos;

  // El filtro solo aparece cuando ya hay proyectos de los dos tipos
  const filtros = tiposPresentes.length > 1 ? `
    <nav class="pestañas">
      <a href="#/proyectos" class="${filtro ? "" : "activa"}">Todos</a>
      ${tiposPresentes.map(t => `<a href="#/proyectos/${t}" class="${filtro === t ? "activa" : ""}">${TIPOS_PROYECTO[t]}</a>`).join("")}
    </nav>` : "";

  return `
    <section class="intro">
      <h1>Proyectos</h1>
      <p>Interiores de referencia y proyectos del estudio. Cada uno se descompone en su paleta de colores, materiales y mobiliario.</p>
      ${filtros}
    </section>

    <section class="rejilla-proyectos">
      ${lista.map(p => `
        <a class="tarjeta" href="#/proyecto/${p.id}">
          <div class="tarjeta-imagen">
            ${p.fotos[0] ? `<img src="${p.fotos[0]}" alt="${texto(p.nombre)}" loading="lazy">` : ""}
            <h2 class="tarjeta-nombre">${texto(p.nombre)}</h2>
          </div>
        </a>`).join("")}
    </section>`;
}


// ---------------------------------------------------------------------
//  VISTA: FICHA DE PROYECTO
// ---------------------------------------------------------------------

function vistaProyecto(id) {
  const p = proyectos.find(x => x.id === id);
  if (!p) return vistaNoEncontrada();

  const datos = [
    ["Proyecto", p.tipo === "propio" ? "341 Studio" : p.tipo === "referencia" ? "Referencia" : ""],
    ["Autores", p.autores], ["Ubicación", p.ubicacion], ["Año", p.año],
    ["Tipología", p.tipologia], ["Fotografía", p.fotografo],
  ].filter(([, valor]) => valor);

  const [portada, ...galeria] = p.fotos;

  app.innerHTML = `
    <article class="proyecto">
      ${portada ? `<img class="portada" src="${portada}" alt="${texto(p.nombre)}">` : ""}

      <header class="proyecto-cabecera">
        <h1>${texto(p.nombre)}</h1>
        <dl class="ficha">
          ${datos.map(([etiqueta, valor]) => `<div><dt>${etiqueta}</dt><dd>${texto(valor)}</dd></div>`).join("")}
          ${p.fuente ? `<div><dt>Fuente</dt><dd><a href="${texto(p.fuente)}" target="_blank" rel="noopener">Ver original ↗</a></dd></div>` : ""}
        </dl>
        ${p.descripcion ? `<p class="descripcion">${texto(p.descripcion)}</p>` : ""}
      </header>

      ${galeria.length ? `
        <section class="bloque bloque-carrusel">
          ${carrusel(galeria, "Fotografía")}
        </section>` : ""}

      ${p.planos.length ? `
        <section class="bloque bloque-carrusel">
          <h2 class="titulo-bloque">Planos</h2>
          ${carrusel(p.planos, "Plano", "carrusel-planos")}
        </section>` : ""}

      ${moodboard(p)}
    </article>`;

  app.querySelectorAll(".carrusel").forEach(activarCarrusel);
  activarAmpliar(app.querySelectorAll(".portada, .carrusel img"));
}

// Fila de imágenes que se desplaza hacia los lados
function carrusel(imagenes, alt, clase = "") {
  return `
    <div class="carrusel ${clase}">
      <div class="carrusel-pista">
        ${imagenes.map((f, i) => `<img src="${f}" alt="${alt} ${i + 1}" loading="lazy" draggable="false">`).join("")}
      </div>
      <div class="carrusel-controles">
        <button class="carrusel-anterior" aria-label="Anterior">←</button>
        <span class="carrusel-contador">1 / ${imagenes.length}</span>
        <button class="carrusel-siguiente" aria-label="Siguiente">→</button>
      </div>
    </div>`;
}

// Con el ratón se arrastra; en el móvil se desliza con el dedo
function activarCarrusel(carrusel) {
  const pista = carrusel.querySelector(".carrusel-pista");
  const imagenes = [...pista.querySelectorAll("img")];
  const contador = carrusel.querySelector(".carrusel-contador");
  let inicioX = 0, inicioScroll = 0, arrastrando = false, movido = false;

  pista.addEventListener("pointerdown", e => {
    if (e.pointerType !== "mouse") return;
    arrastrando = true; movido = false;
    inicioX = e.clientX; inicioScroll = pista.scrollLeft;
    pista.classList.add("arrastrando");
  });
  window.addEventListener("pointermove", e => {
    if (!arrastrando) return;
    const dx = e.clientX - inicioX;
    if (Math.abs(dx) > 5) movido = true;
    pista.scrollLeft = inicioScroll - dx;
  });
  window.addEventListener("pointerup", () => {
    if (!arrastrando) return;
    arrastrando = false;
    pista.classList.remove("arrastrando");
  });
  // Si se ha arrastrado, el clic no abre la imagen ampliada
  pista.addEventListener("click", e => { if (movido) { e.stopPropagation(); movido = false; } }, true);

  const actual = () => {
    const centro = pista.scrollLeft + pista.clientWidth / 2;
    let indice = 0;
    imagenes.forEach((img, i) => { if (img.offsetLeft <= centro) indice = i; });
    return indice;
  };
  const ir = i => {
    const img = imagenes[Math.max(0, Math.min(imagenes.length - 1, i))];
    pista.scrollTo({ left: img.offsetLeft - (pista.clientWidth - img.clientWidth) / 2, behavior: "smooth" });
  };
  carrusel.querySelector(".carrusel-anterior").addEventListener("click", () => ir(actual() - 1));
  carrusel.querySelector(".carrusel-siguiente").addEventListener("click", () => ir(actual() + 1));
  pista.addEventListener("scroll", () => {
    const fin = pista.scrollLeft + pista.clientWidth >= pista.scrollWidth - 4;
    contador.textContent = `${fin ? imagenes.length : actual() + 1} / ${imagenes.length}`;
  }, { passive: true });
}

// Huecos de la composición del moodboard, en % del lienzo: x, y, ancho, alto,
// capa y lo que prefiere llevar (textura de material o color liso).
// Si un proyecto tiene pocos materiales, sus huecos se rellenan con colores.
const HUECOS_MOODBOARD = [
  { x: 6,  y: 4,  w: 40, h: 33, z: 2, tipo: "material" },
  { x: 52, y: 5,  w: 42, h: 26, z: 1, tipo: "color" },
  { x: 9,  y: 37, w: 28, h: 47, z: 1, tipo: "material" },
  { x: 35, y: 31, w: 38, h: 46, z: 0, tipo: "color" },
  { x: 63, y: 37, w: 31, h: 19, z: 2, tipo: "material" },
  { x: 12, y: 63, w: 32, h: 29, z: 3, tipo: "material" },
  { x: 62, y: 59, w: 29, h: 35, z: 2, tipo: "material" },
  { x: 39, y: 71, w: 19, h: 15, z: 4, tipo: "color" },
  { x: 46, y: 21, w: 13, h: 9,  z: 3, tipo: "color" },
];

function composicionMoodboard(p) {
  const materiales = p.materiales.filter(m => m.imagen);
  const colores = [...p.colores];
  // primero el color de fondo y los acentos, que son los más característicos
  const muestras = HUECOS_MOODBOARD.map(hueco => {
    if (hueco.tipo === "material" && materiales.length) return { hueco, material: materiales.shift() };
    if (colores.length) return { hueco, color: colores.shift() };
    if (materiales.length) return { hueco, material: materiales.shift() };
    return null;
  }).filter(Boolean);

  return `
    <div class="composicion" role="img" aria-label="Moodboard de ${texto(p.nombre)}">
      ${muestras.map(({ hueco, material, color }) => `
        <div class="muestra ${color ? "muestra-pintura" : ""}"
             style="left:${hueco.x}%; top:${hueco.y}%; width:${hueco.w}%; height:${hueco.h}%; z-index:${hueco.z};
                    ${material ? `background-image:url('${material.imagen}')` : `background-color:${color.hex}`}"
             title="${texto(material ? material.nombre : color.nombre)}"></div>`).join("")}
    </div>`;
}

function moodboard(p) {
  if (!p.colores.length && !p.materiales.length) return "";
  return `
    <section class="bloque">
      <h2 class="titulo-bloque">Moodboard</h2>
      <div class="moodboard">
        ${composicionMoodboard(p)}

        <div class="mb-leyenda">
          <h3>Paleta</h3>
          <ul class="paleta-lista">
            ${p.colores.map(c => `
              <li>
                <span class="punto" style="background:${c.hex}"></span>
                <span>${texto(c.nombre)}${c.tipo === "acento" ? ' <em>acento</em>' : ""}</span>
                <span>${texto(c.codigo)}<br><small>${texto(c.classic || "")}</small></span>
                <span>${c.hex}</span>
              </li>`).join("")}
          </ul>
          <p class="nota">Colores extraídos automáticamente de las fotografías y asociados al RAL más cercano.</p>

          ${p.materiales.length ? `
            <h3>Materiales</h3>
            <ul class="materiales-lista">
              ${p.materiales.map(m => `
                <li>
                  <span class="miniatura" style="${m.imagen ? `background-image:url('${m.imagen}')` : ""}"></span>
                  <span>${texto(m.nombre)}</span>
                </li>`).join("")}
            </ul>` : ""}
        </div>
      </div>
    </section>

    ${listaPiezas(p)}`;
}

// Lista completa de materiales y mobiliario del proyecto
function listaPiezas(p) {
  if (!p.materiales.length && !p.mobiliario.length) return "";
  const columna = (titulo, lista, tipo) => lista.length ? `
    <div>
      <h3>${titulo}</h3>
      <ul>
        ${lista.map(item => {
          const detalle = tipo === "materiales"
            ? item.acabado
            : [item.autor, item.marca, item.año].filter(Boolean).join(" · ");
          return `<li><span>${texto(item.nombre)}</span><span>${texto(detalle || "")}</span></li>`;
        }).join("")}
      </ul>
    </div>` : "";
  return `
    <section class="bloque">
      <h2 class="titulo-bloque">Materialidad y mobiliario</h2>
      <div class="lista-piezas">
        ${columna("Materiales", p.materiales, "materiales")}
        ${columna("Mobiliario e iluminación", p.mobiliario, "mobiliario")}
      </div>
    </section>`;
}


// ---------------------------------------------------------------------
//  VISTA: BIBLIOTECA
// ---------------------------------------------------------------------

// Materiales presentados como una hoja de catálogo: cada uno con su
// número fijo (CAT. 341-001...), según su orden en data/biblioteca.js
function codigoCatalogo(id) {
  const n = BIBLIOTECA.materiales.findIndex(m => m.id === id) + 1;
  return `CAT. 341-${String(n).padStart(3, "0")}`;
}

function catalogoMateriales(items) {
  return `
    <section class="catalogo">
      <div class="catalogo-rejilla">
        ${items.map(m => `
          <figure class="catalogo-item">
            <div class="catalogo-imagen">
              ${m.imagen ? `<img src="${texto(m.imagen)}" alt="${texto(m.nombre)}" loading="lazy">` : `<span class="sin-imagen">${texto(m.nombre)}</span>`}
            </div>
            <figcaption>
              <span class="catalogo-nombre">${texto(m.nombre)}</span>
              <span class="catalogo-codigo">${codigoCatalogo(m.id)} · ${texto(m.categoria || "")}</span>
              <span class="catalogo-proyectos">${enlacesProyectos(m.proyectos)}</span>
              ${botonGuardar("materiales", m.id, m.nombre)}
            </figcaption>
          </figure>`).join("")}
      </div>
    </section>`;
}

// #/biblioteca/<tipo>/<subcategoría>/<tipo de iluminación>
// p. ej. #/biblioteca/materiales/maderas   o   #/biblioteca/mobiliario/iluminacion/suspension
function vistaBiblioteca(tipo, filtro, subfiltro) {
  const pestañas = [["colores", "Colores"], ["materiales", "Texturas y materiales"], ["mobiliario", "Mobiliario"]];
  if (!pestañas.some(([clave]) => clave === tipo)) tipo = "colores";
  const navPestañas = `
      <nav class="pestañas">
        ${pestañas.map(([clave, nombre]) => `<a href="#/biblioteca/${clave}" class="${clave === tipo ? "activa" : ""}">${nombre}</a>`).join("")}
      </nav>`;

  // Colores: la carta completa (RAL Classic + RAL Design) con buscador
  if (tipo === "colores") {
    app.innerHTML = `
      <section class="intro">
        <h1>Biblioteca</h1>
        ${navPestañas}
        <p class="intro-texto">Carta completa de ${window.CARTA_COLORES.length.toLocaleString("es")} colores RAL, ordenada por familias de tono. Pulsa una muestra para copiar su código o «+» para añadirla a tu paleta.</p>
      </section>
      <section class="biblioteca-carta">${htmlCarta()}</section>`;
    activarCarta(app.querySelector(".biblioteca-carta"), { alAnadir: c => anadirAPaleta(c.hex) });
    return;
  }

  const todos = tipo === "colores" ? bibliotecaColores() : bibliotecaPiezas(tipo);
  const orden = tipo === "colores" ? FAMILIAS_COLOR : CATEGORIAS[tipo];

  // Solo se muestran las subcategorías que tienen algún elemento
  const presentes = orden.filter(cat => todos.some(item => item.categoria === cat));
  const activa = presentes.find(cat => slug(cat) === filtro);
  let items = activa ? todos.filter(item => item.categoria === activa) : todos;

  // Segundo nivel, solo para Iluminación
  let segundoNivel = "";
  if (activa === "Iluminación") {
    const tiposPresentes = TIPOS_ILUMINACION.filter(t => items.some(item => item.subcategoria === t));
    const tipoActivo = tiposPresentes.find(t => slug(t) === subfiltro);
    if (tipoActivo) items = items.filter(item => item.subcategoria === tipoActivo);
    const base = `#/biblioteca/${tipo}/${slug(activa)}`;
    segundoNivel = `
      <nav class="filtros filtros-segundo">
        <a href="${base}" class="${tipoActivo ? "" : "activa"}">Toda la iluminación</a>
        ${tiposPresentes.map(t => `<a href="${base}/${slug(t)}" class="${t === tipoActivo ? "activa" : ""}">${t}</a>`).join("")}
      </nav>`;
  }

  const filtros = presentes.length > 1 ? `
    <nav class="filtros">
      <a href="#/biblioteca/${tipo}" class="${activa ? "" : "activa"}">Todos</a>
      ${presentes.map(cat => `<a href="#/biblioteca/${tipo}/${slug(cat)}" class="${cat === activa ? "activa" : ""}">${cat}</a>`).join("")}
    </nav>${segundoNivel}` : "";

  let contenido;
  if (!todos.length) {
    contenido = `<p class="vacio">Todavía no hay ${tipo} en la biblioteca. Se añaden en <code>data/biblioteca.js</code>.</p>`;
  } else if (tipo === "colores") {
    contenido = `<div class="rejilla-colores">
      ${items.map(c => `
        <div class="item-biblioteca">
          ${fichaColor(c)}
          <p class="aparece">${enlacesProyectos(c.proyectos)}</p>
        </div>`).join("")}
    </div>`;
  } else if (tipo === "materiales") {
    contenido = catalogoMateriales(items);
  } else {
    contenido = `<div class="rejilla-piezas">${items.map(item => `
      <div class="item-biblioteca">
        ${fichaPieza(item, tipo)}
        <p class="aparece">${enlacesProyectos(item.proyectos)}</p>
      </div>`).join("")}</div>`;
  }

  app.innerHTML = `
    <section class="intro">
      <h1>Biblioteca</h1>
      <nav class="pestañas">
        ${pestañas.map(([clave, nombre]) => `<a href="#/biblioteca/${clave}" class="${clave === tipo ? "activa" : ""}">${nombre}</a>`).join("")}
      </nav>
      ${filtros}
      <div class="carta-herramientas biblioteca-buscador">
        <label class="buscador">
          <span class="buscador-icono" aria-hidden="true">⌕</span>
          <input type="search" placeholder="${tipo === "materiales" ? "Buscar material — p. ej. roble, piedra, 341-004" : "Buscar pieza — p. ej. lámpara, Santa & Cole, Starck"}" aria-label="Buscar en la biblioteca">
        </label>
        <span class="carta-contador"></span>
      </div>
    </section>
    ${contenido}
    <p class="vacio biblioteca-sin-resultados" hidden>No hay nada que coincida con la búsqueda.</p>`;

  // Buscador: filtra las fichas por todo lo que muestran (nombre, código,
  // categoría, diseñador, marca, proyectos...) sin volver a dibujar la página
  const fichas = [...app.querySelectorAll(".catalogo-item, .rejilla-piezas .item-biblioteca")];
  const textos = fichas.map(f => normalizar(f.textContent));
  const contador = app.querySelector(".biblioteca-buscador .carta-contador");
  const filtrar = valor => {
    const palabras = normalizar(valor).split(" ").filter(Boolean);
    let visibles = 0;
    fichas.forEach((f, i) => {
      f.hidden = !palabras.every(p => textos[i].includes(p));
      if (!f.hidden) visibles++;
    });
    contador.textContent = `${visibles} ${tipo === "materiales" ? (visibles === 1 ? "material" : "materiales") : (visibles === 1 ? "pieza" : "piezas")}`;
    app.querySelector(".biblioteca-sin-resultados").hidden = visibles > 0 || !fichas.length;
  };
  app.querySelector(".biblioteca-buscador input").addEventListener("input", e => filtrar(e.target.value));
  filtrar("");
}


// ---------------------------------------------------------------------
//  VISTA: GENERADOR DE MOODBOARDS → está en generador.js
// ---------------------------------------------------------------------


// ---------------------------------------------------------------------
//  AMPLIAR IMÁGENES (clic en una foto → pantalla completa)
// ---------------------------------------------------------------------

function activarAmpliar(imagenes) {
  imagenes.forEach(img => img.addEventListener("click", () => {
    const capa = document.createElement("div");
    capa.className = "ampliada";
    capa.innerHTML = `<img src="${img.src}" alt="">`;
    capa.addEventListener("click", () => capa.remove());
    document.body.append(capa);
  }));
}

document.addEventListener("keydown", evento => {
  if (evento.key === "Escape") document.querySelector(".ampliada")?.remove();
});


// ---------------------------------------------------------------------
//  NAVEGACIÓN
// ---------------------------------------------------------------------

function vistaNoEncontrada() {
  app.innerHTML = `<section class="intro"><h1>No encontrado</h1><p><a href="#/proyectos">Volver a los proyectos</a></p></section>`;
}

function navegar() {
  const [seccion, parametro, filtro, subfiltro] = location.hash.replace(/^#\/?/, "").split("/");

  if (!seccion) vistaInicio();
  else if (seccion === "proyectos") vistaProyectos(parametro);
  else if (seccion === "proyecto") vistaProyecto(parametro);
  else if (seccion === "biblioteca") vistaBiblioteca(parametro, filtro, subfiltro);
  else if (seccion === "generador") vistaGenerador(parametro);
  else if (seccion === "favoritos") vistaFavoritos();
  else vistaNoEncontrada();

  // Marca en el menú la sección activa
  const activa = seccion === "proyecto" ? "proyectos" : seccion;
  document.querySelectorAll(".menu a").forEach(a => a.classList.toggle("activa", a.dataset.seccion === activa));
  document.body.classList.toggle("en-portada", !seccion);
  window.scrollTo(0, 0);
  mostrarMenu();
}

// En la portada, el menú solo aparece cuando se empieza a bajar
function mostrarMenu() {
  const enLaPortada = document.body.classList.contains("en-portada") && window.scrollY < 60;
  document.body.classList.toggle("portada-visible", enLaPortada);
}
window.addEventListener("scroll", mostrarMenu, { passive: true });

window.addEventListener("hashchange", navegar);
navegar();
