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
      ${miniatura ? "" : `<span class="tirador" title="Cambiar tamaño"></span>`}
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
    </div>`;
}

function pintarLienzo() {
  document.getElementById("zona-lienzo").innerHTML = htmlLienzo(tablero);
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
          <button data-accion="recuadro">+ Recuadro</button>
          <button data-accion="circulo">+ Círculo</button>
          <button data-accion="texto">+ Texto</button>
          <span class="barra-separador"></span>
          <button data-accion="azar">Rellenar al azar</button>
          <button data-accion="vaciar">Vaciar</button>
          <button data-accion="guardar">Guardar como plantilla</button>
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
  const piezas = piezasBiblioteca(pestañaBiblioteca);
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
    const elemento = e.target.closest(".recuadro, .texto-lienzo");
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
      tipo: e.target.classList.contains("tirador") ? "tamaño" : "mover",
      movido: false,
    };
    if (seleccion !== id) { seleccion = id; zona.querySelectorAll(".seleccionado").forEach(x => x.classList.remove("seleccionado")); elemento.classList.add("seleccionado"); pintarHerramientas(); }
    elemento.setPointerCapture(e.pointerId);
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
    const el = zona.querySelector(`[data-id="${item.id}"]`);
    el.style.left = item.x + "%"; el.style.top = item.y + "%"; el.style.width = item.w + "%";
    if (item.h !== undefined) el.style.height = altoRecuadro(item, tablero.proporcion) + "%";
  });
  const terminar = () => { if (gesto) { const movido = gesto.movido; gesto = null; if (movido) guardarTablero(); } };
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
