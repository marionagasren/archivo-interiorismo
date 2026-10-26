// =====================================================================
//  341 STUDIO · generador.js
//  Generador de moodboards: se elige una plantilla y se rellenan sus
//  recuadros arrastrando texturas, colores y mobiliario de la biblioteca.
//
//  Lo que se va haciendo se guarda en este navegador (localStorage), así
//  que al volver a la página el moodboard sigue ahí. Las plantillas propias
//  también se guardan aquí.
// =====================================================================

const PROPORCIONES = { "2:3": [2, 3], "3:4": [3, 4], "1:1": [1, 1], "4:3": [4, 3], "3:2": [3, 2] };
const CLAVE_ACTUAL = "341-moodboard-actual";
const CLAVE_PLANTILLAS = "341-mis-plantillas";

let tablero = null;       // el moodboard en el que se está trabajando
let seleccion = null;     // id del recuadro o texto seleccionado
let enMano = null;        // pieza de la biblioteca elegida con un toque (móvil)
let pestañaBiblioteca = "material";
let filtroBiblioteca = "";     // subcategoría elegida en la biblioteca del editor


// ---------------------------------------------------------------------
//  GUARDAR Y RECUPERAR
// ---------------------------------------------------------------------

function leer(clave, porDefecto) {
  try { return JSON.parse(localStorage.getItem(clave)) ?? porDefecto; } catch { return porDefecto; }
}
function escribir(clave, valor) {
  try { localStorage.setItem(clave, JSON.stringify(valor)); } catch { /* sin almacenamiento: no pasa nada */ }
}
const guardarTablero = () => escribir(CLAVE_ACTUAL, tablero);
const misPlantillas = () => leer(CLAVE_PLANTILLAS, []);

let contadorIds = 0;
const nuevoId = prefijo => `${prefijo}${Date.now().toString(36)}${(contadorIds++).toString(36)}`;

// Crea un tablero vacío a partir de una plantilla
function tableroDesde(plantilla) {
  return {
    plantilla: plantilla.id,
    nombre: plantilla.nombre,
    proporcion: [...plantilla.proporcion],
    recuadros: plantilla.recuadros.map(r => ({ forma: "rect", ...r, id: nuevoId("r"), contenido: null })),
    textos: (plantilla.textos || []).map(t => ({ ...t, id: nuevoId("t") })),
  };
}

function todasLasPlantillas() {
  return [...window.PLANTILLAS, ...misPlantillas().map(p => ({ ...p, propia: true }))];
}


// ---------------------------------------------------------------------
//  PIEZAS DE LA BIBLIOTECA
// ---------------------------------------------------------------------

function piezasBiblioteca(tipo) {
  if (tipo === "color") return bibliotecaColores().map(c => ({ tipo, id: c.hex, nombre: c.nombre, hex: c.hex, categoria: c.categoria }));
  const lista = tipo === "material" ? BIBLIOTECA.materiales : BIBLIOTECA.mobiliario;
  return lista.filter(p => p.imagen).map(p => ({ tipo, id: p.id, nombre: p.nombre, imagen: p.imagen, categoria: p.categoria }));
}

function buscarPieza(contenido) {
  return contenido && piezasBiblioteca(contenido.tipo).find(p => p.id === contenido.id);
}


// ---------------------------------------------------------------------
//  DIBUJO DEL LIENZO
// ---------------------------------------------------------------------

// Alto en % de un círculo, para que sea redondo en cualquier proporción
function altoRecuadro(r, proporcion) {
  return r.forma === "circulo" ? r.w * proporcion[0] / proporcion[1] : r.h;
}

function htmlRecuadro(r, proporcion, miniatura = false) {
  const pieza = !miniatura && buscarPieza(r.contenido);
  let relleno = "";
  if (pieza?.tipo === "material") relleno = `<div class="relleno" style="background-image:url('${pieza.imagen}')"></div>`;
  if (pieza?.tipo === "color") relleno = `<div class="relleno relleno-color" style="background-color:${pieza.hex}"></div>`;
  if (pieza?.tipo === "mueble") relleno = `<img class="relleno relleno-mueble" src="${pieza.imagen}" alt="" draggable="false">`;
  const clases = ["recuadro", `forma-${r.forma}`, pieza ? `lleno lleno-${pieza.tipo}` : "sin-relleno",
                  seleccion === r.id && !miniatura ? "seleccionado" : ""].join(" ");
  return `
    <div class="${clases}" data-id="${r.id || ""}" data-pide="${r.pide || ""}"
         style="left:${r.x}%; top:${r.y}%; width:${r.w}%; height:${altoRecuadro(r, proporcion)}%; z-index:${r.z ?? 1}"
         title="${pieza ? texto(pieza.nombre) : ""}">
      <div class="recuadro-forma">${relleno}</div>
    </div>`;
}

function htmlTexto(t, miniatura = false) {
  return `
    <div class="texto-lienzo texto-${t.estilo || "nota"} ${seleccion === t.id && !miniatura ? "seleccionado" : ""}"
         data-id="${t.id || ""}" style="left:${t.x}%; top:${t.y}%; width:${t.w}%">${texto(t.texto)}</div>`;
}

function htmlLienzo(datos, miniatura = false) {
  const [ancho, alto] = datos.proporcion;
  return `
    <div class="lienzo ${miniatura ? "lienzo-mini" : ""}" style="aspect-ratio:${ancho} / ${alto}; --prop:${ancho / alto}">
      ${datos.recuadros.map(r => htmlRecuadro(r, datos.proporcion, miniatura)).join("")}
      ${(datos.textos || []).map(t => htmlTexto(t, miniatura)).join("")}
      ${miniatura ? "" : `<div class="marco-seleccion" hidden><span class="tirador" title="Cambiar tamaño"></span></div>`}
    </div>`;
}

// Marco de la selección: va en una capa propia por encima de todo, para que
// la esquina de estirar se vea aunque el recuadro tenga otros encima
function actualizarMarco() {
  const marco = document.querySelector("#zona-lienzo .marco-seleccion");
  if (!marco) return;
  const r = tablero.recuadros.find(x => x.id === seleccion);
  marco.hidden = !r;
  if (!r) return;
  Object.assign(marco.style, { left: r.x + "%", top: r.y + "%", width: r.w + "%", height: altoRecuadro(r, tablero.proporcion) + "%" });
  marco.classList.toggle("marco-circulo", r.forma === "circulo");
}

function pintarLienzo() {
  document.getElementById("zona-lienzo").innerHTML = htmlLienzo(tablero);
  actualizarMarco();
  const [a, b] = tablero.proporcion;
  document.getElementById("orientacion").innerHTML = `
    <button data-orientacion="vertical" class="${a <= b ? "activa" : ""}" title="Lienzo vertical">▯ Vertical</button>
    <button data-orientacion="horizontal" class="${a > b ? "activa" : ""}" title="Lienzo horizontal">▭ Horizontal</button>`;
  pintarHerramientas();
  guardarTablero();
}


// ---------------------------------------------------------------------
//  VISTA
// ---------------------------------------------------------------------

function vistaGenerador() {
  tablero = leer(CLAVE_ACTUAL, null) || tableroDesde(window.PLANTILLAS[0]);
  seleccion = null;
  enMano = null;

  app.innerHTML = `
    <section class="intro">
      <h1>Generador</h1>
      <p>Elige una plantilla y arrastra texturas, colores y mobiliario de la biblioteca a cada recuadro. Puedes mover, redimensionar y eliminar los recuadros, o crear tu propia plantilla.</p>
    </section>

    <section class="plantillas">
      <h2 class="etiqueta">Plantillas</h2>
      <div class="plantillas-fila" id="plantillas-fila"></div>
    </section>

    <section class="editor">
      <div class="editor-lienzo">
        <div class="barra">
          <span class="orientacion" id="orientacion"></span>
          <span class="barra-separador"></span>
          <button data-accion="recuadro">+ Recuadro</button>
          <button data-accion="circulo">+ Círculo</button>
          <button data-accion="texto">+ Texto</button>
          <span class="barra-separador"></span>
          <button data-accion="azar">Rellenar al azar</button>
          <button data-accion="vaciar">Vaciar</button>
          <button data-accion="guardar">Guardar como plantilla</button>
          <button data-accion="descargar" class="boton-oscuro">Descargar PNG</button>
        </div>
        <div class="barra barra-seleccion" id="barra-seleccion"></div>
        <div id="zona-lienzo"></div>
        <p class="aviso" id="aviso"></p>
      </div>

      <aside class="editor-biblioteca">
        <nav class="pestañas-biblioteca">
          <button data-tipo="material">Añadir textura</button>
          <button data-tipo="color">Añadir color</button>
          <button data-tipo="mueble">Añadir mobiliario</button>
        </nav>
        <nav class="filtros filtros-editor" id="filtros-editor"></nav>
        <div class="piezas" id="piezas"></div>
      </aside>
    </section>`;

  pintarPlantillas();
  pintarBibliotecaEditor();
  pintarLienzo();
  activarEditor();
}

function pintarPlantillas() {
  document.getElementById("plantillas-fila").innerHTML = `
    ${todasLasPlantillas().map(p => `
      <div class="plantilla ${tablero.plantilla === p.id ? "activa" : ""}" data-plantilla="${p.id}" role="button" tabindex="0">
        ${htmlLienzo(p, true)}
        <span>${texto(p.nombre)}</span>
        ${p.propia ? `<span class="borrar-plantilla" data-borrar="${p.id}" title="Borrar plantilla">×</span>` : ""}
      </div>`).join("")}
    <div class="plantilla plantilla-nueva">
      <span class="plantilla-mas">+</span>
      <span>Crear plantilla</span>
      <select id="proporcion-nueva" aria-label="Proporción">
        ${Object.keys(PROPORCIONES).map(k => `<option value="${k}">${k}</option>`).join("")}
      </select>
      <button data-crear>Lienzo en blanco</button>
    </div>`;
}

function pintarBibliotecaEditor() {
  document.querySelectorAll(".pestañas-biblioteca button").forEach(b => b.classList.toggle("activa", b.dataset.tipo === pestañaBiblioteca));
  const todas = piezasBiblioteca(pestañaBiblioteca);
  // Subcategorías, en el mismo orden que en la Biblioteca
  const orden = { material: CATEGORIAS.materiales, mueble: CATEGORIAS.mobiliario, color: FAMILIAS_COLOR }[pestañaBiblioteca];
  const presentes = orden.filter(cat => todas.some(p => p.categoria === cat));
  if (!presentes.includes(filtroBiblioteca)) filtroBiblioteca = "";
  document.getElementById("filtros-editor").innerHTML = presentes.length > 1 ? `
    <button data-filtro="" class="${filtroBiblioteca ? "" : "activa"}">Todos</button>
    ${presentes.map(cat => `<button data-filtro="${cat}" class="${cat === filtroBiblioteca ? "activa" : ""}">${cat}</button>`).join("")}` : "";
  const piezas = filtroBiblioteca ? todas.filter(p => p.categoria === filtroBiblioteca) : todas;
  document.getElementById("piezas").innerHTML = piezas.length ? piezas.map(p => `
    <button class="pieza-editor ${enMano?.tipo === p.tipo && enMano?.id === p.id ? "en-mano" : ""}"
            draggable="true" data-tipo="${p.tipo}" data-id="${texto(p.id)}" title="${texto(p.nombre)}">
      <span class="pieza-muestra ${p.tipo === "mueble" ? "pieza-mueble" : ""}"
            style="${p.hex ? `background-color:${p.hex}` : `background-image:url('${p.imagen}')`}"></span>
      <span class="pieza-nombre">${texto(p.nombre)}</span>
    </button>`).join("") : `<p class="vacio">No hay piezas con imagen todavía.</p>`;
}

function pintarHerramientas() {
  const barra = document.getElementById("barra-seleccion");
  const r = tablero.recuadros.find(x => x.id === seleccion);
  const t = tablero.textos.find(x => x.id === seleccion);
  if (r) {
    barra.innerHTML = `
      <span class="barra-titulo">Recuadro</span>
      <button data-forma="rect" class="${r.forma === "rect" ? "activa" : ""}">Rectángulo</button>
      <button data-forma="circulo" class="${r.forma === "circulo" ? "activa" : ""}">Círculo</button>
      <button data-forma="piedra" class="${r.forma === "piedra" ? "activa" : ""}">Piedra</button>
      <span class="barra-separador"></span>
      <button data-accion="delante">Al frente</button>
      <button data-accion="detras">Atrás</button>
      ${r.contenido ? `<button data-accion="quitar">Vaciar recuadro</button>` : ""}
      <button data-accion="eliminar">Eliminar</button>`;
  } else if (t) {
    barra.innerHTML = `
      <span class="barra-titulo">Texto · doble clic para escribir</span>
      ${["titulo", "subtitulo", "nota"].map(e => `<button data-estilo="${e}" class="${t.estilo === e ? "activa" : ""}">${{ titulo: "Título", subtitulo: "Subtítulo", nota: "Nota" }[e]}</button>`).join("")}
      <span class="barra-separador"></span>
      <button data-accion="eliminar">Eliminar</button>`;
  } else {
    barra.innerHTML = `<span class="barra-titulo">Selecciona un recuadro para cambiarlo</span>`;
  }
  document.getElementById("aviso").textContent = enMano
    ? `Toca un recuadro para colocar «${buscarPieza(enMano)?.nombre}», o una zona libre para crear uno nuevo.`
    : "";
}


// ---------------------------------------------------------------------
//  ACCIONES
// ---------------------------------------------------------------------

function elegirPlantilla(id) {
  const plantilla = todasLasPlantillas().find(p => p.id === id);
  if (!plantilla) return;
  const hayContenido = tablero.recuadros.some(r => r.contenido);
  if (hayContenido && !confirm("Se empezará un moodboard nuevo con esta plantilla. ¿Continuar?")) return;
  tablero = tableroDesde(plantilla);
  seleccion = null;
  pintarPlantillas();
  pintarLienzo();
}

function crearLienzoEnBlanco() {
  const proporcion = PROPORCIONES[document.getElementById("proporcion-nueva").value] || [2, 3];
  const hayContenido = tablero.recuadros.some(r => r.contenido);
  if (hayContenido && !confirm("Se empezará un lienzo en blanco. ¿Continuar?")) return;
  tablero = { plantilla: null, nombre: "Mi plantilla", proporcion, recuadros: [], textos: [] };
  seleccion = null;
  pintarPlantillas();
  pintarLienzo();
}

function añadirRecuadro(forma, x = 35, y = 35, contenido = null) {
  const z = Math.max(0, ...tablero.recuadros.map(r => r.z ?? 0)) + 1;
  const r = { id: nuevoId("r"), x, y, w: 28, h: forma === "circulo" ? 0 : 20, forma, z, contenido };
  tablero.recuadros.push(r);
  seleccion = r.id;
  pintarLienzo();
}

function añadirTexto() {
  const t = { id: nuevoId("t"), x: 10, y: 10, w: 40, texto: "Escribe aquí", estilo: "subtitulo" };
  tablero.textos.push(t);
  seleccion = t.id;
  pintarLienzo();
}

function rellenarAlAzar() {
  const mezclarLista = lista => [...lista].sort(() => Math.random() - .5);
  const fondos = { material: mezclarLista(piezasBiblioteca("material")), color: mezclarLista(piezasBiblioteca("color")), mueble: mezclarLista(piezasBiblioteca("mueble")) };
  tablero.recuadros.filter(r => !r.contenido).forEach(r => {
    const tipo = r.pide && fondos[r.pide].length ? r.pide : (fondos.material.length ? "material" : "color");
    const pieza = fondos[tipo].shift();
    if (pieza) r.contenido = { tipo, id: pieza.id };
  });
  pintarLienzo();
}

function guardarComoPlantilla() {
  const nombre = prompt("Nombre de la plantilla:", tablero.plantilla ? `${tablero.nombre} (mía)` : "Mi plantilla");
  if (!nombre) return;
  const nueva = {
    id: nuevoId("p"),
    nombre,
    proporcion: tablero.proporcion,
    recuadros: tablero.recuadros.map(({ id, contenido, ...resto }) => resto),
    textos: tablero.textos.map(({ id, ...resto }) => resto),
  };
  escribir(CLAVE_PLANTILLAS, [...misPlantillas(), nueva]);
  tablero.plantilla = nueva.id;
  tablero.nombre = nombre;
  pintarPlantillas();
  pintarLienzo();
}

function borrarPlantilla(id) {
  if (!confirm("¿Borrar esta plantilla?")) return;
  escribir(CLAVE_PLANTILLAS, misPlantillas().filter(p => p.id !== id));
  pintarPlantillas();
}

function colocar(idRecuadro, pieza) {
  const r = tablero.recuadros.find(x => x.id === idRecuadro);
  if (!r) return;
  r.contenido = { tipo: pieza.tipo, id: pieza.id };
  seleccion = r.id;
  pintarLienzo();
}

// Punto del lienzo (en %) donde está el cursor
function puntoEnLienzo(evento) {
  const caja = document.querySelector("#zona-lienzo .lienzo").getBoundingClientRect();
  return { x: (evento.clientX - caja.left) / caja.width * 100, y: (evento.clientY - caja.top) / caja.height * 100, caja };
}


// ---------------------------------------------------------------------
//  GUÍAS DE ALINEACIÓN
//  Al mover o estirar un recuadro, si uno de sus bordes o su centro queda
//  cerca del borde o del centro de otro recuadro (o del lienzo), se
//  "imanta" a esa línea y se dibuja una guía fina para marcar el eje.
// ---------------------------------------------------------------------

const IMAN_PX = 6;   // distancia, en píxeles de pantalla, a la que se imanta

function ejes(r, proporcion) {
  const h = r.h === undefined ? 0 : altoRecuadro(r, proporcion);
  return { x: [r.x, r.x + r.w / 2, r.x + r.w], y: h ? [r.y, r.y + h / 2, r.y + h] : [r.y] };
}

function alinear(item, tipo, caja) {
  const proporcion = tablero.proporcion;
  const otros = [...tablero.recuadros, ...tablero.textos].filter(o => o.id !== item.id);
  const lineasX = [0, 50, 100, ...otros.flatMap(o => ejes(o, proporcion).x)];
  const lineasY = [0, 50, 100, ...otros.flatMap(o => ejes(o, proporcion).y)];
  const imanX = IMAN_PX / caja.width * 100, imanY = IMAN_PX / caja.height * 100;

  // Busca la línea más cercana a alguno de los ejes propios
  const cercana = (propios, lineas, iman) => {
    let mejor = null;
    for (const p of propios) for (const l of lineas) {
      const d = l - p;
      if (Math.abs(d) <= iman && (!mejor || Math.abs(d) < Math.abs(mejor.d))) mejor = { d, linea: l };
    }
    return mejor;
  };

  const propios = ejes(item, proporcion);
  const alto = item.h === undefined ? 0 : altoRecuadro(item, proporcion);
  let guiaX = null, guiaY = null;

  if (tipo === "mover") {
    const mx = cercana(propios.x, lineasX, imanX);
    if (mx) { item.x = Math.round((item.x + mx.d) * 100) / 100; guiaX = mx.linea; }
    const my = cercana(propios.y, lineasY, imanY);
    if (my) { item.y = Math.round((item.y + my.d) * 100) / 100; guiaY = my.linea; }
  } else {
    // Al estirar solo se mueven el borde derecho y el inferior
    const mx = cercana([item.x + item.w], lineasX, imanX);
    if (mx) { item.w = Math.round((item.w + mx.d) * 100) / 100; guiaX = mx.linea; }
    if (item.forma !== "circulo" && alto) {
      const my = cercana([item.y + alto], lineasY, imanY);
      if (my) { item.h = Math.round((item.h + my.d) * 100) / 100; guiaY = my.linea; }
    }
  }

  const lienzo = document.querySelector("#zona-lienzo .lienzo");
  lienzo.querySelectorAll(".guia").forEach(g => g.remove());
  if (guiaX !== null) lienzo.insertAdjacentHTML("beforeend", `<div class="guia guia-v" style="left:${guiaX}%"></div>`);
  if (guiaY !== null) lienzo.insertAdjacentHTML("beforeend", `<div class="guia guia-h" style="top:${guiaY}%"></div>`);
}


// ---------------------------------------------------------------------
//  EVENTOS: clics, arrastrar desde la biblioteca, mover y redimensionar
// ---------------------------------------------------------------------

function activarEditor() {
  const editor = app.querySelector(".editor");
  const zona = document.getElementById("zona-lienzo");

  // Plantillas
  document.getElementById("plantillas-fila").addEventListener("click", e => {
    const borrar = e.target.closest("[data-borrar]");
    if (borrar) { e.stopPropagation(); return borrarPlantilla(borrar.dataset.borrar); }
    if (e.target.closest("[data-crear]")) return crearLienzoEnBlanco();
    const boton = e.target.closest("[data-plantilla]");
    if (boton) elegirPlantilla(boton.dataset.plantilla);
  });
  document.getElementById("plantillas-fila").addEventListener("keydown", e => {
    const boton = e.target.closest("[data-plantilla]");
    if (boton && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); elegirPlantilla(boton.dataset.plantilla); }
  });

  // Pestañas y piezas de la biblioteca
  editor.querySelector(".pestañas-biblioteca").addEventListener("click", e => {
    const b = e.target.closest("button");
    if (!b) return;
    pestañaBiblioteca = b.dataset.tipo;
    filtroBiblioteca = "";
    pintarBibliotecaEditor();
  });
  document.getElementById("filtros-editor").addEventListener("click", e => {
    const b = e.target.closest("button");
    if (!b) return;
    filtroBiblioteca = b.dataset.filtro;
    pintarBibliotecaEditor();
  });
  const piezas = document.getElementById("piezas");
  piezas.addEventListener("click", e => {
    const b = e.target.closest(".pieza-editor");
    if (!b) return;
    const pieza = { tipo: b.dataset.tipo, id: b.dataset.id };
    enMano = enMano?.tipo === pieza.tipo && enMano?.id === pieza.id ? null : pieza;
    // Si hay un recuadro seleccionado, la pieza va directamente a él
    if (enMano && tablero.recuadros.some(r => r.id === seleccion)) { colocar(seleccion, enMano); enMano = null; }
    pintarBibliotecaEditor();
    pintarHerramientas();
  });
  piezas.addEventListener("dragstart", e => {
    const b = e.target.closest(".pieza-editor");
    if (!b) return;
    e.dataTransfer.setData("text/plain", JSON.stringify({ tipo: b.dataset.tipo, id: b.dataset.id }));
    e.dataTransfer.effectAllowed = "copy";
  });

  // Soltar una pieza sobre un recuadro o sobre una zona libre del lienzo
  zona.addEventListener("dragover", e => {
    e.preventDefault();
    zona.querySelectorAll(".recuadro.destino").forEach(r => r.classList.remove("destino"));
    e.target.closest(".recuadro")?.classList.add("destino");
  });
  zona.addEventListener("dragleave", e => { if (!zona.contains(e.relatedTarget)) zona.querySelectorAll(".destino").forEach(r => r.classList.remove("destino")); });
  zona.addEventListener("drop", e => {
    e.preventDefault();
    let pieza;
    try { pieza = JSON.parse(e.dataTransfer.getData("text/plain")); } catch { return; }
    const destino = e.target.closest(".recuadro");
    if (destino) return colocar(destino.dataset.id, pieza);
    const { x, y } = puntoEnLienzo(e);
    añadirRecuadro("rect", Math.max(0, x - 14), Math.max(0, y - 10), pieza);
  });

  // Orientación del lienzo: se intercambian ancho y alto. Las posiciones van
  // en %, así que la composición se adapta sola al nuevo formato.
  document.getElementById("orientacion").addEventListener("click", e => {
    const b = e.target.closest("[data-orientacion]");
    if (!b) return;
    const [ancho, alto] = tablero.proporcion;
    const vertical = ancho <= alto;
    if ((b.dataset.orientacion === "vertical") === vertical) return;
    tablero.proporcion = [alto, ancho];
    pintarLienzo();
  });

  // Barra de herramientas
  editor.addEventListener("click", e => {
    const b = e.target.closest("button[data-accion], button[data-forma], button[data-estilo]");
    if (!b) return;
    const r = tablero.recuadros.find(x => x.id === seleccion);
    const t = tablero.textos.find(x => x.id === seleccion);
    const accion = b.dataset.accion;
    if (accion === "recuadro") return añadirRecuadro("rect");
    if (accion === "circulo") return añadirRecuadro("circulo");
    if (accion === "texto") return añadirTexto();
    if (accion === "azar") return rellenarAlAzar();
    if (accion === "guardar") return guardarComoPlantilla();
    if (accion === "descargar") return descargarPNG();
    if (accion === "vaciar") {
      if (confirm("¿Quitar todas las texturas, colores y muebles del moodboard?")) { tablero.recuadros.forEach(x => x.contenido = null); pintarLienzo(); }
      return;
    }
    if (b.dataset.forma && r) { r.forma = b.dataset.forma; if (r.forma !== "circulo" && !r.h) r.h = r.w; }
    if (b.dataset.estilo && t) t.estilo = b.dataset.estilo;
    const zs = tablero.recuadros.map(x => x.z ?? 0);
    if (accion === "delante" && r) r.z = Math.max(...zs) + 1;
    if (accion === "detras" && r) r.z = Math.min(...zs) - 1;
    if (accion === "quitar" && r) r.contenido = null;
    if (accion === "eliminar") {
      tablero.recuadros = tablero.recuadros.filter(x => x.id !== seleccion);
      tablero.textos = tablero.textos.filter(x => x.id !== seleccion);
      seleccion = null;
    }
    pintarLienzo();
  });

  // Mover y redimensionar con el ratón o el dedo
  let gesto = null;
  zona.addEventListener("pointerdown", e => {
    const tirador = e.target.classList.contains("tirador");
    const elemento = tirador
      ? zona.querySelector(`.recuadro[data-id="${seleccion}"]`)
      : e.target.closest(".recuadro, .texto-lienzo");
    if (e.target.isContentEditable) return;
    if (!elemento) {
      // Zona libre: si hay una pieza en la mano, se crea un recuadro con ella
      if (enMano && e.target.closest(".lienzo")) {
        const { x, y } = puntoEnLienzo(e);
        const pieza = enMano; enMano = null;
        añadirRecuadro("rect", Math.max(0, x - 14), Math.max(0, y - 10), pieza);
        pintarBibliotecaEditor();
      } else if (seleccion) { seleccion = null; pintarLienzo(); }
      return;
    }
    const id = elemento.dataset.id;
    if (enMano && elemento.classList.contains("recuadro")) {
      colocar(id, enMano); enMano = null; pintarBibliotecaEditor(); return;
    }
    const item = tablero.recuadros.find(x => x.id === id) || tablero.textos.find(x => x.id === id);
    const { caja } = puntoEnLienzo(e);
    gesto = {
      item, caja, inicioX: e.clientX, inicioY: e.clientY,
      original: { ...item },
      tipo: tirador ? "tamaño" : "mover",
      movido: false,
    };
    if (seleccion !== id) { seleccion = id; zona.querySelectorAll(".seleccionado").forEach(x => x.classList.remove("seleccionado")); elemento.classList.add("seleccionado"); pintarHerramientas(); actualizarMarco(); }
    e.target.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  zona.addEventListener("pointermove", e => {
    if (!gesto) return;
    const dx = (e.clientX - gesto.inicioX) / gesto.caja.width * 100;
    const dy = (e.clientY - gesto.inicioY) / gesto.caja.height * 100;
    if (Math.abs(dx) + Math.abs(dy) > .3) gesto.movido = true;
    const { item, original } = gesto;
    if (gesto.tipo === "mover") {
      item.x = Math.round((original.x + dx) * 10) / 10;
      item.y = Math.round((original.y + dy) * 10) / 10;
    } else {
      item.w = Math.max(4, Math.round((original.w + dx) * 10) / 10);
      if (item.forma !== "circulo" && item.h !== undefined) item.h = Math.max(3, Math.round((original.h + dy) * 10) / 10);
    }
    alinear(item, gesto.tipo, gesto.caja);
    const el = zona.querySelector(`[data-id="${item.id}"]`);
    el.style.left = item.x + "%"; el.style.top = item.y + "%"; el.style.width = item.w + "%";
    if (item.h !== undefined) el.style.height = altoRecuadro(item, tablero.proporcion) + "%";
    actualizarMarco();
  });
  const terminar = () => {
    if (!gesto) return;
    const movido = gesto.movido;
    gesto = null;
    zona.querySelectorAll(".guia").forEach(g => g.remove());
    if (movido) guardarTablero();
  };
  zona.addEventListener("pointerup", terminar);
  zona.addEventListener("pointercancel", terminar);

  // Textos: doble clic para escribir
  zona.addEventListener("dblclick", e => {
    const el = e.target.closest(".texto-lienzo");
    if (!el) return;
    el.contentEditable = "true";
    el.focus();
    document.getSelection().selectAllChildren(el);
    el.addEventListener("blur", () => {
      const t = tablero.textos.find(x => x.id === el.dataset.id);
      if (t) t.texto = el.textContent.trim() || "Texto";
      el.contentEditable = "false";
      guardarTablero();
    }, { once: true });
  });

  // Tecla Suprimir para eliminar lo seleccionado
  document.addEventListener("keydown", teclaEditor);
}

function teclaEditor(e) {
  if (location.hash !== "#/generador") return document.removeEventListener("keydown", teclaEditor);
  if (e.target.isContentEditable || ["INPUT", "SELECT", "TEXTAREA"].includes(e.target.tagName)) return;
  if ((e.key === "Delete" || e.key === "Backspace") && seleccion) {
    tablero.recuadros = tablero.recuadros.filter(x => x.id !== seleccion);
    tablero.textos = tablero.textos.filter(x => x.id !== seleccion);
    seleccion = null;
    pintarLienzo();
  }
  if (e.key === "Escape") { enMano = null; seleccion = null; pintarBibliotecaEditor(); pintarLienzo(); }
}


// ---------------------------------------------------------------------
//  DESCARGAR EL MOODBOARD COMO IMAGEN (PNG)
//  Se vuelve a dibujar el tablero en un <canvas> a alta resolución.
// ---------------------------------------------------------------------

const PIEDRA = [[8, 14], [30, 2], [62, 6], [88, 0], [100, 30], [94, 62], [100, 88], [70, 100], [38, 95], [12, 100], [0, 74], [4, 42]];

function cargarImagen(src) {
  return new Promise((ok, mal) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = mal;
    img.src = src;
  });
}

function trazarForma(ctx, forma, x, y, w, h) {
  ctx.beginPath();
  if (forma === "circulo") ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  else if (forma === "piedra") PIEDRA.forEach(([px, py], i) => ctx[i ? "lineTo" : "moveTo"](x + px / 100 * w, y + py / 100 * h));
  else ctx.rect(x, y, w, h);
  ctx.closePath();
}

// Dibuja la imagen cubriendo el hueco (como background-size: cover) o entera (contain)
function dibujarImagen(ctx, img, x, y, w, h, modo) {
  const escala = (modo === "contain" ? Math.min : Math.max)(w / img.width, h / img.height);
  const iw = img.width * escala, ih = img.height * escala;
  ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
}

async function descargarPNG() {
  const boton = document.querySelector('[data-accion="descargar"]');
  boton.textContent = "Preparando…";
  try {
    const ANCHO = 2000;
    const [pa, pb] = tablero.proporcion;
    const W = ANCHO, H = Math.round(ANCHO * pb / pa);
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ECE9E3";
    ctx.fillRect(0, 0, W, H);

    const recuadros = tablero.recuadros.filter(r => r.contenido).sort((a, b) => (a.z ?? 0) - (b.z ?? 0));
    const imagenes = {};
    await Promise.all(recuadros.map(async r => {
      const pieza = buscarPieza(r.contenido);
      if (pieza?.imagen) imagenes[r.id] = await cargarImagen(pieza.imagen);
    }));

    for (const r of recuadros) {
      const pieza = buscarPieza(r.contenido);
      if (!pieza) continue;
      const x = r.x / 100 * W, y = r.y / 100 * H, w = r.w / 100 * W, h = altoRecuadro(r, tablero.proporcion) / 100 * H;
      ctx.save();
      if (pieza.tipo === "mueble") {
        // los muebles van sin sombra y su fondo blanco se funde con el lienzo
        ctx.globalCompositeOperation = "multiply";
        trazarForma(ctx, r.forma, x, y, w, h); ctx.clip();
        dibujarImagen(ctx, imagenes[r.id], x, y, w, h, "contain");
      } else {
        // sombra suave, como una muestra apoyada sobre la mesa
        ctx.shadowColor = "rgba(40, 30, 20, .28)";
        ctx.shadowBlur = W * .018; ctx.shadowOffsetY = W * .006;
        trazarForma(ctx, r.forma, x, y, w, h);
        ctx.fillStyle = pieza.hex || "#ddd"; ctx.fill();
        ctx.shadowColor = "transparent";
        if (pieza.imagen) { trazarForma(ctx, r.forma, x, y, w, h); ctx.clip(); dibujarImagen(ctx, imagenes[r.id], x, y, w, h, "cover"); }
      }
      ctx.restore();
    }

    // Textos
    await document.fonts.ready;
    const estilos = {
      titulo: { fuente: `400 ${W * .07}px "Cormorant Garamond", serif`, alto: W * .067, mayus: true, espacio: 0 },
      subtitulo: { fuente: `400 ${W * .017}px "Inter", sans-serif`, alto: W * .026, mayus: true, espacio: W * .003 },
      nota: { fuente: `400 ${W * .021}px "Cormorant Garamond", serif`, alto: W * .028, mayus: false, espacio: 0 },
    };
    ctx.fillStyle = "#2A2622"; ctx.textBaseline = "top";
    for (const t of tablero.textos) {
      const e = estilos[t.estilo] || estilos.nota;
      ctx.font = e.fuente;
      if ("letterSpacing" in ctx) ctx.letterSpacing = e.espacio + "px";
      const palabras = (e.mayus ? t.texto.toUpperCase() : t.texto).split(/\s+/);
      const maximo = t.w / 100 * W;
      let linea = "", y = t.y / 100 * H;
      for (const palabra of palabras) {
        const prueba = linea ? linea + " " + palabra : palabra;
        if (ctx.measureText(prueba).width > maximo && linea) { ctx.fillText(linea, t.x / 100 * W, y); linea = palabra; y += e.alto; }
        else linea = prueba;
      }
      ctx.fillText(linea, t.x / 100 * W, y);
    }

    const blob = await new Promise(ok => canvas.toBlob(ok, "image/png"));
    const enlace = document.createElement("a");
    enlace.href = URL.createObjectURL(blob);
    enlace.download = `moodboard-341-studio-${new Date().toISOString().slice(0, 10)}.png`;
    enlace.click();
    setTimeout(() => URL.revokeObjectURL(enlace.href), 2000);
  } catch (error) {
    // Al abrir index.html con doble clic (file://), el navegador no deja exportar
    // un dibujo hecho con imágenes locales. Publicada en internet funciona.
    alert("No se ha podido crear la imagen. Si has abierto la web con doble clic en index.html, " +
          "el navegador lo bloquea por seguridad: funciona con la web publicada (GitHub Pages).");
    console.error(error);
  } finally {
    boton.textContent = "Descargar PNG";
  }
}
