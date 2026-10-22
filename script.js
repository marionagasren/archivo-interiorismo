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
//    #/generador               → generador de paletas
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

function mezclar(lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

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
      if (!mapa.has(clave)) mapa.set(clave, { ...c, proyectos: [] });
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
    ? [item.tipo, item.acabado].filter(Boolean).join(" · ")
    : [item.autor, item.marca, item.año].filter(Boolean).join(" · ");
  // Sin imagen todavía: se muestra el nombre en una ficha lisa
  const imagen = item.imagen
    ? `<img src="${texto(item.imagen)}" alt="${texto(item.nombre)}" loading="lazy">`
    : `<span class="sin-imagen">${texto(item.nombre)}</span>`;
  return `
    <figure class="pieza">
      <div class="pieza-imagen">${imagen}</div>
      <figcaption><strong>${texto(item.nombre)}</strong>${detalle ? `<span>${texto(detalle)}</span>` : ""}</figcaption>
    </figure>`;
}

function piezaPendiente(etiqueta) {
  return `<div class="pieza pendiente"><span>${etiqueta}<br><small>pendiente</small></span></div>`;
}

function enlacesProyectos(lista) {
  return lista.map(p => `<a href="#/proyecto/${p.id}">${texto(p.nombre)}</a>`).join(", ");
}

function franjaColores(colores) {
  return `<div class="franja">${colores.map(c => `<span style="background:${c.hex}" title="${texto(c.nombre)}"></span>`).join("")}</div>`;
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

  // Mientras se ve la portada, la cabecera va sin fondo
  const portada = app.querySelector(".portada-estudio");
  new IntersectionObserver(([entrada]) => {
    document.body.classList.toggle("portada-visible", entrada.isIntersecting);
  }, { rootMargin: "-72px 0px 0px 0px" }).observe(portada);
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
          </div>
          ${franjaColores(p.colores)}
          <h2>${texto(p.nombre)}</h2>
          <p>${[p.autores, p.ubicacion, p.año].filter(Boolean).map(texto).join(" · ")}</p>
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
        <section class="galeria">
          ${galeria.map(f => `<img src="${f}" alt="" loading="lazy">`).join("")}
        </section>` : ""}

      ${p.planos.length ? `
        <section class="bloque">
          <h2 class="titulo-bloque">Planos</h2>
          <div class="planos">${p.planos.map(f => `<img src="${f}" alt="Plano" loading="lazy">`).join("")}</div>
        </section>` : ""}

      ${moodboard(p)}
    </article>`;

  colocarGaleria(app.querySelectorAll(".galeria img"));
  activarAmpliar(app.querySelectorAll(".portada, .galeria img, .planos img"));
}

// Fotos horizontales a todo el ancho y verticales de dos en dos.
// Si una vertical se queda sin pareja, se centra sola en su fila.
function colocarGaleria(imagenes) {
  const colocar = () => {
    let seguidas = [];
    const cerrarGrupo = () => {
      if (seguidas.length % 2) seguidas.at(-1).classList.add("sola");
      seguidas = [];
    };
    imagenes.forEach(img => {
      img.classList.remove("sola");
      const horizontal = img.naturalWidth > img.naturalHeight;
      img.classList.toggle("horizontal", horizontal);
      horizontal ? cerrarGrupo() : seguidas.push(img);
    });
    cerrarGrupo();
  };
  imagenes.forEach(img => img.complete || img.addEventListener("load", colocar));
  colocar();
}

function moodboard(p) {
  const [fondo, ...resto] = p.colores;
  const foto = p.fotos[1] || p.fotos[0];

  // En el moodboard solo van las piezas con imagen (máximo 4 de cada);
  // la lista completa aparece debajo, en "Materialidad y mobiliario"
  const conImagen = lista => lista.filter(item => item.imagen).slice(0, 4);
  const materiales = conImagen(p.materiales).length
    ? conImagen(p.materiales).map(m => fichaPieza(m, "materiales")).join("")
    : piezaPendiente("Material").repeat(4);
  const mobiliario = conImagen(p.mobiliario).length
    ? conImagen(p.mobiliario).map(m => fichaPieza(m, "mobiliario")).join("")
    : piezaPendiente("Mobiliario").repeat(2);

  return `
    <section class="bloque">
      <h2 class="titulo-bloque">Moodboard</h2>
      <div class="moodboard">
        <div class="mb-foto">${foto ? `<img src="${foto}" alt="">` : ""}</div>

        <div class="mb-colores">
          ${fondo ? fichaColor(fondo, true) : ""}
          ${resto.map(c => fichaColor(c)).join("")}
        </div>

        <div class="mb-piezas">
          <div class="mb-grupo"><h3>Materiales</h3><div class="mb-materiales">${materiales}</div></div>
          <div class="mb-grupo"><h3>Mobiliario</h3><div class="mb-mobiliario">${mobiliario}</div></div>
        </div>
      </div>

      <table class="leyenda">
        <thead><tr><th></th><th>Color</th><th>RAL Design</th><th>RAL Classic aprox.</th><th>Hex</th></tr></thead>
        <tbody>
          ${p.colores.map(c => `
            <tr>
              <td><span class="punto" style="background:${c.hex}"></span></td>
              <td>${texto(c.nombre)}${c.tipo === "acento" ? ' <em>acento</em>' : ""}</td>
              <td>${texto(c.codigo)}</td>
              <td>${texto(c.classic || "—")}</td>
              <td>${c.hex}</td>
            </tr>`).join("")}
        </tbody>
      </table>
      <p class="nota">Colores extraídos automáticamente de las fotografías y asociados al RAL más cercano.</p>
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

function vistaBiblioteca(tipo) {
  const pestañas = [["colores", "Colores"], ["materiales", "Materiales"], ["mobiliario", "Mobiliario"]];
  if (!pestañas.some(([clave]) => clave === tipo)) tipo = "colores";

  let contenido;
  if (tipo === "colores") {
    contenido = `<div class="rejilla-colores">
      ${bibliotecaColores().map(c => `
        <div class="item-biblioteca">
          ${fichaColor(c)}
          <p class="aparece">${enlacesProyectos(c.proyectos)}</p>
        </div>`).join("")}
    </div>`;
  } else {
    const items = bibliotecaPiezas(tipo);
    contenido = items.length
      ? `<div class="rejilla-piezas">${items.map(item => `
          <div class="item-biblioteca">
            ${fichaPieza(item, tipo)}
            <p class="aparece">${enlacesProyectos(item.proyectos)}</p>
          </div>`).join("")}</div>`
      : `<p class="vacio">Todavía no hay ${tipo} en la biblioteca. Se añaden en <code>data/biblioteca.js</code>.</p>`;
  }

  app.innerHTML = `
    <section class="intro">
      <h1>Biblioteca</h1>
      <nav class="pestañas">
        ${pestañas.map(([clave, nombre]) => `<a href="#/biblioteca/${clave}" class="${clave === tipo ? "activa" : ""}">${nombre}</a>`).join("")}
      </nav>
    </section>
    ${contenido}`;
}


// ---------------------------------------------------------------------
//  VISTA: GENERADOR DE PALETAS
//  Versión base: más adelante se le darán los diseños de Pinterest.
// ---------------------------------------------------------------------

const generador = { tipos: ["colores"], cantidad: 5, fijados: [], resultado: [] };

function elementosDisponibles() {
  const lista = [];
  if (generador.tipos.includes("colores"))
    bibliotecaColores().forEach(c => lista.push({ ...c, categoria: "colores", clave: c.codigo || c.hex }));
  for (const tipo of ["materiales", "mobiliario"])
    if (generador.tipos.includes(tipo))
      bibliotecaPiezas(tipo).forEach(item => lista.push({ ...item, categoria: tipo, clave: item.id }));
  return lista;
}

function generarPaleta() {
  const disponibles = elementosDisponibles();
  const fijados = generador.resultado.filter(e => generador.fijados.includes(e.clave));
  const nuevos = mezclar(disponibles.filter(e => !generador.fijados.includes(e.clave)))
    .slice(0, Math.max(0, generador.cantidad - fijados.length));
  generador.resultado = [...fijados, ...nuevos];
  pintarPaleta();
}

function pintarPaleta() {
  const zona = document.getElementById("paleta");
  if (!generador.resultado.length) {
    zona.innerHTML = `<p class="vacio">No hay elementos de este tipo en la biblioteca todavía.</p>`;
    return;
  }
  zona.innerHTML = generador.resultado.map(e => `
    <div class="paleta-item ${generador.fijados.includes(e.clave) ? "fijado" : ""}" data-clave="${texto(e.clave)}">
      ${e.categoria === "colores" ? fichaColor(e, true) : fichaPieza(e, e.categoria)}
      <button class="fijar" title="Fijar este elemento">${generador.fijados.includes(e.clave) ? "Fijado" : "Fijar"}</button>
    </div>`).join("");

  zona.querySelectorAll(".fijar").forEach(boton => boton.addEventListener("click", () => {
    const clave = boton.closest(".paleta-item").dataset.clave;
    generador.fijados = generador.fijados.includes(clave)
      ? generador.fijados.filter(c => c !== clave)
      : [...generador.fijados, clave];
    pintarPaleta();
  }));
}

function vistaGenerador() {
  const opciones = [["colores", "Colores"], ["materiales", "Materiales"], ["mobiliario", "Mobiliario"]];

  app.innerHTML = `
    <section class="intro">
      <h1>Generador</h1>
      <p>Combina colores, materiales y mobiliario de la biblioteca. Fija los que te gusten y vuelve a generar el resto. Pulsa la barra espaciadora para generar.</p>
    </section>

    <form class="controles" onsubmit="return false">
      <fieldset>
        <legend>Incluir</legend>
        ${opciones.map(([clave, nombre]) => `
          <label><input type="checkbox" name="tipo" value="${clave}" ${generador.tipos.includes(clave) ? "checked" : ""}> ${nombre}</label>`).join("")}
      </fieldset>
      <label class="cantidad">Elementos <input type="range" min="3" max="8" value="${generador.cantidad}" name="cantidad"> <output>${generador.cantidad}</output></label>
      <button type="button" id="generar" class="boton">Generar</button>
    </form>

    <section id="paleta" class="paleta"></section>`;

  app.querySelectorAll('input[name="tipo"]').forEach(casilla => casilla.addEventListener("change", () => {
    generador.tipos = [...app.querySelectorAll('input[name="tipo"]:checked')].map(c => c.value);
    generador.fijados = [];
    generarPaleta();
  }));
  const rango = app.querySelector('input[name="cantidad"]');
  rango.addEventListener("input", () => {
    generador.cantidad = Number(rango.value);
    app.querySelector(".cantidad output").textContent = rango.value;
    generarPaleta();
  });
  document.getElementById("generar").addEventListener("click", generarPaleta);

  generarPaleta();
}

document.addEventListener("keydown", evento => {
  if (evento.code === "Space" && location.hash === "#/generador" && evento.target === document.body) {
    evento.preventDefault();
    generarPaleta();
  }
});


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
  const [seccion, parametro] = location.hash.replace(/^#\/?/, "").split("/");

  if (!seccion) vistaInicio();
  else if (seccion === "proyectos") vistaProyectos(parametro);
  else if (seccion === "proyecto") vistaProyecto(parametro);
  else if (seccion === "biblioteca") vistaBiblioteca(parametro);
  else if (seccion === "generador") vistaGenerador();
  else vistaNoEncontrada();

  // Marca en el menú la sección activa
  const activa = seccion === "proyecto" ? "proyectos" : seccion;
  document.body.classList.toggle("en-portada", !seccion);
  if (seccion) document.body.classList.remove("portada-visible");
  document.querySelectorAll(".menu a").forEach(a => a.classList.toggle("activa", a.dataset.seccion === activa));
  window.scrollTo(0, 0);
}

window.addEventListener("hashchange", navegar);
navegar();
