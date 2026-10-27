// =====================================================================
//  341 STUDIO · paleta.js
//  Generador → Paleta de colores. Una banda de columnas de color, como
//  un muestrario de pintura: se añaden, cambian, fijan, reordenan y quitan
//  colores, y se pueden generar combinaciones armónicas con la barra
//  espaciadora. Debajo, la carta completa para ir añadiendo colores.
//
//  La paleta se guarda en este navegador (localStorage).
// =====================================================================

const CLAVE_PALETA = "341-paleta-actual";
const MAX_COLORES = 10;

let paleta = null;            // { colores: [{ hex, fijado }] }
let columnaElegida = null;    // índice de la columna que se va a cambiar desde la carta

const guardarPaleta = () => escribir(CLAVE_PALETA, paleta);

// ---------------------------------------------------------------------
//  PALETAS GUARDADAS: una lista de paletas con nombre, en este navegador
// ---------------------------------------------------------------------

const CLAVE_GUARDADAS = "341-paletas-guardadas";
const paletasGuardadas = () => leer(CLAVE_GUARDADAS, []);

function guardarComoPaleta() {
  if (!paleta.colores.length) return aviso("La paleta está vacía");
  const nombre = prompt("Nombre de la paleta:", `Paleta ${paletasGuardadas().length + 1}`);
  if (!nombre) return;
  const nueva = { id: nuevoId("pal"), nombre: nombre.trim(), colores: paleta.colores.map(c => c.hex), fecha: new Date().toISOString().slice(0, 10) };
  escribir(CLAVE_GUARDADAS, [nueva, ...paletasGuardadas()]);
  aviso(`«${nueva.nombre}» guardada`);
  pintarGuardadas();
}

function pintarGuardadas() {
  const zona = document.getElementById("paletas-guardadas");
  if (!zona) return;
  const lista = paletasGuardadas();
  zona.innerHTML = lista.length ? `
    <h2 class="etiqueta">Paletas guardadas · ${lista.length}</h2>
    <div class="guardadas-rejilla">
      ${lista.map(p => `
        <article class="guardada" data-guardada="${p.id}">
          <button class="guardada-franja" data-accion-guardada="abrir" title="Abrir esta paleta">
            ${p.colores.map(hex => `<span style="background:${hex}"></span>`).join("")}
          </button>
          <div class="guardada-pie">
            <span class="guardada-nombre">${texto(p.nombre)}</span>
            <span class="guardada-datos">${p.colores.length} colores · ${p.fecha || ""}</span>
            <span class="guardada-acciones">
              <button data-accion-guardada="abrir">Abrir</button>
              <button data-accion-guardada="renombrar">Renombrar</button>
              <button data-accion-guardada="borrar">Borrar</button>
            </span>
          </div>
        </article>`).join("")}
    </div>` : "";
}

function accionGuardada(id, accion) {
  const lista = paletasGuardadas();
  const p = lista.find(x => x.id === id);
  if (!p) return;
  if (accion === "abrir") {
    paleta = { colores: p.colores.map(hex => ({ hex, fijado: false })) };
    columnaElegida = null;
    guardarPaleta();
    pintarPaleta();
    document.getElementById("paleta-banda").scrollIntoView({ behavior: "smooth", block: "center" });
    aviso(`«${p.nombre}» abierta`);
  }
  if (accion === "renombrar") {
    const nombre = prompt("Nuevo nombre:", p.nombre);
    if (!nombre) return;
    p.nombre = nombre.trim();
    escribir(CLAVE_GUARDADAS, lista);
  }
  if (accion === "borrar") {
    if (!confirm(`¿Borrar la paleta «${p.nombre}»?`)) return;
    escribir(CLAVE_GUARDADAS, lista.filter(x => x.id !== id));
  }
  pintarGuardadas();
}

function datosColor(hex) {
  return cartaColores().find(c => c.hex === hex) || { hex, nombre: "Color", codigo: "", lab: hexALab(hex) };
}

// Pestañas para cambiar entre los dos generadores
function pestañasGenerador(activo) {
  return `
    <nav class="pestañas pestañas-generador">
      <a href="#/generador" class="${activo === "moodboard" ? "activa" : ""}">Moodboard</a>
      <a href="#/generador/paleta" class="${activo === "paleta" ? "activa" : ""}">Paleta de colores</a>
    </nav>`;
}

// Añadir un color desde fuera del generador (p. ej. desde la Biblioteca)
function anadirAPaleta(hex) {
  const actual = leer(CLAVE_PALETA, null) || { colores: [] };
  if (actual.colores.some(c => c.hex === hex)) return aviso("Ese color ya está en la paleta");
  if (actual.colores.length >= MAX_COLORES) return aviso(`La paleta admite hasta ${MAX_COLORES} colores`);
  actual.colores.push({ hex, fijado: false });
  escribir(CLAVE_PALETA, actual);
  aviso(`${datosColor(hex).nombre} añadido a la paleta`);
}


// ---------------------------------------------------------------------
//  GENERAR COMBINACIONES ARMÓNICAS
//  Se parte de un color base (uno fijado, si lo hay) y se calculan tonos
//  objetivo según un esquema; después se busca el color RAL más parecido.
//  La saturación se contiene para que las paletas encajen en interiorismo.
// ---------------------------------------------------------------------

function aLch([L, a, b]) { return [L, Math.hypot(a, b), (Math.atan2(b, a) * 180 / Math.PI + 360) % 360]; }
function aLab([L, C, h]) { const r = h * Math.PI / 180; return [L, C * Math.cos(r), C * Math.sin(r)]; }
const azar = (min, max) => min + Math.random() * (max - min);

function generarPaleta(n = Math.max(paleta.colores.length, 5)) {
  const fijados = paleta.colores.filter(c => c.fijado);
  const base = fijados.length
    ? aLch(datosColor(fijados[Math.floor(Math.random() * fijados.length)].hex).lab)
    : aLch(cartaColores()[Math.floor(Math.random() * cartaColores().length)].lab);
  const [, C0, h0] = base;
  const croma = Math.min(Math.max(C0, 12), 42);

  const esquemas = ["tonal", "análogo", "neutros con acento", "complementario"];
  const esquema = esquemas[Math.floor(Math.random() * esquemas.length)];

  // Luminosidades repartidas de claro a oscuro, con un poco de azar
  const luces = Array.from({ length: n }, (_, i) => 92 - i * (66 / Math.max(n - 1, 1)) + azar(-4, 4));

  const objetivos = luces.map((L, i) => {
    if (esquema === "tonal") return [L, croma * azar(.25, 1), h0 + azar(-12, 12)];
    if (esquema === "análogo") return [L, croma * azar(.5, 1), h0 + (i - n / 2) * 18];
    if (esquema === "complementario") return i % 3 === 2 ? [L, croma * .8, h0 + 180] : [L, croma * azar(.2, .8), h0 + azar(-10, 10)];
    // neutros cálidos y un solo acento con color
    return i === Math.floor(n / 2) ? [L, croma, h0] : [L, azar(3, 12), azar(55, 85)];
  });

  const usados = new Set(fijados.map(c => c.hex));
  paleta.colores = Array.from({ length: n }, (_, i) => {
    const actual = paleta.colores[i];
    if (actual?.fijado) return actual;
    const c = colorMasCercano(aLab(objetivos[i]), usados);
    usados.add(c.hex);
    return { hex: c.hex, fijado: false };
  });
  guardarPaleta();
  pintarPaleta();
}


// ---------------------------------------------------------------------
//  VISTA
// ---------------------------------------------------------------------

function vistaPaleta() {
  paleta = leer(CLAVE_PALETA, null);
  columnaElegida = null;

  app.innerHTML = `
    <section class="intro">
      <h1>Generador</h1>
      ${pestañasGenerador("paleta")}
      <p class="intro-texto">Combina colores en una paleta. Pulsa la barra espaciadora para generar combinaciones, fija los colores que quieras conservar y arrastra las columnas para ordenarlas.</p>
    </section>

    <section class="paleta-editor">
      <div class="barra">
        <button data-paleta="generar" class="boton-oscuro">Generar <kbd>espacio</kbd></button>
        <button data-paleta="anadir">+ Color</button>
        <button data-paleta="vaciar">Vaciar</button>
        <span class="barra-separador"></span>
        <button data-paleta="guardar">Guardar paleta</button>
        <button data-paleta="copiar">Copiar códigos</button>
        <button data-paleta="descargar">Descargar PNG</button>
      </div>
      <div class="paleta-banda" id="paleta-banda"></div>
      <p class="aviso" id="aviso-paleta"></p>
    </section>

    <section class="paletas-guardadas" id="paletas-guardadas"></section>

    <section class="bloque paleta-carta">
      <h2 class="titulo-bloque">Carta de colores</h2>
      ${htmlCarta()}
    </section>`;

  if (!paleta || !paleta.colores.length) { paleta = { colores: [] }; generarPaleta(); }
  else pintarPaleta();
  pintarGuardadas();
  activarPaleta();
  activarCarta(app.querySelector(".paleta-carta"), {
    alAnadir: c => ponerColor(c.hex),
    alElegir: c => ponerColor(c.hex),
  });
}

function pintarPaleta() {
  const banda = document.getElementById("paleta-banda");
  if (!banda) return;
  banda.innerHTML = paleta.colores.length ? paleta.colores.map((c, i) => {
    const d = datosColor(c.hex);
    return `
      <div class="columna ${esOscuro(c.hex) ? "oscuro" : ""} ${columnaElegida === i ? "elegida" : ""} ${c.fijado ? "fijada" : ""}"
           style="background:${c.hex}" draggable="true" data-indice="${i}">
        <div class="columna-acciones">
          <button data-columna="fijar" title="${c.fijado ? "Soltar" : "Fijar (no cambia al generar)"}">${c.fijado ? "Fijado" : "Fijar"}</button>
          <button data-columna="elegir" title="Cambiar por un color de la carta">Cambiar</button>
          <button data-columna="copiar" title="Copiar ${c.hex}">Copiar</button>
          <button data-columna="quitar" title="Quitar de la paleta">Quitar</button>
        </div>
        <div class="columna-datos">
          <span class="columna-hex">${c.hex.replace("#", "")}</span>
          <span class="columna-nombre">${texto(d.nombre)}</span>
          <span class="columna-codigo">${texto(d.codigo)}</span>
        </div>
      </div>`;
  }).join("") : `<p class="vacio paleta-vacia">La paleta está vacía. Pulsa «Generar» o añade colores desde la carta.</p>`;

  document.getElementById("aviso-paleta").textContent = columnaElegida !== null
    ? "Elige en la carta el color que sustituirá a la columna marcada (Esc para cancelar)."
    : "";
  document.querySelectorAll(".carta-color").forEach(f => f.classList.toggle("en-paleta", paleta.colores.some(c => c.hex === f.dataset.hex)));
}

// Añade un color al final o, si hay una columna elegida, la sustituye
function ponerColor(hex) {
  if (columnaElegida !== null && paleta.colores[columnaElegida]) {
    paleta.colores[columnaElegida] = { hex, fijado: paleta.colores[columnaElegida].fijado };
    columnaElegida = null;
  } else {
    if (paleta.colores.some(c => c.hex === hex)) return aviso("Ese color ya está en la paleta");
    if (paleta.colores.length >= MAX_COLORES) return aviso(`La paleta admite hasta ${MAX_COLORES} colores`);
    paleta.colores.push({ hex, fijado: false });
  }
  guardarPaleta();
  pintarPaleta();
  document.getElementById("paleta-banda").scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function activarPaleta() {
  const banda = document.getElementById("paleta-banda");

  document.getElementById("paletas-guardadas").addEventListener("click", e => {
    const b = e.target.closest("[data-accion-guardada]");
    if (b) accionGuardada(b.closest("[data-guardada]").dataset.guardada, b.dataset.accionGuardada);
  });

  app.querySelector(".paleta-editor .barra").addEventListener("click", e => {
    const b = e.target.closest("[data-paleta]");
    if (!b) return;
    const accion = b.dataset.paleta;
    if (accion === "generar") generarPaleta();
    if (accion === "anadir") {
      if (paleta.colores.length >= MAX_COLORES) return aviso(`La paleta admite hasta ${MAX_COLORES} colores`);
      // un color nuevo que combine con los que hay: se fijan todos un momento
      // y se genera solo la columna nueva
      const fijadosAntes = paleta.colores.map(c => c.fijado);
      paleta.colores.forEach(c => c.fijado = true);
      paleta.colores.push({ hex: "#FFFFFF", fijado: false });
      generarPaleta(paleta.colores.length);
      paleta.colores.forEach((c, i) => c.fijado = fijadosAntes[i] ?? false);
    }
    if (accion === "vaciar" && confirm("¿Quitar todos los colores de la paleta?")) { paleta.colores = []; columnaElegida = null; }
    if (accion === "copiar") return copiarTexto(paleta.colores.map(c => `${c.hex} ${datosColor(c.hex).codigo}`).join("\n"));
    if (accion === "descargar") return descargarPaleta();
    if (accion === "guardar") return guardarComoPaleta();
    guardarPaleta();
    pintarPaleta();
  });

  banda.addEventListener("click", e => {
    const b = e.target.closest("[data-columna]");
    if (!b) return;
    const i = Number(b.closest(".columna").dataset.indice);
    const c = paleta.colores[i];
    if (b.dataset.columna === "fijar") c.fijado = !c.fijado;
    if (b.dataset.columna === "copiar") return copiarTexto(c.hex);
    if (b.dataset.columna === "quitar") { paleta.colores.splice(i, 1); columnaElegida = null; }
    if (b.dataset.columna === "elegir") {
      columnaElegida = columnaElegida === i ? null : i;
      if (columnaElegida !== null) app.querySelector(".paleta-carta").scrollIntoView({ behavior: "smooth" });
    }
    guardarPaleta();
    pintarPaleta();
  });

  // Reordenar arrastrando las columnas
  let origen = null;
  banda.addEventListener("dragstart", e => {
    const col = e.target.closest(".columna");
    if (!col) return;
    origen = Number(col.dataset.indice);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(origen));
    col.classList.add("arrastrando");
  });
  banda.addEventListener("dragover", e => {
    if (origen === null) return;
    e.preventDefault();
    banda.querySelectorAll(".columna").forEach(c => c.classList.toggle("destino", c === e.target.closest(".columna")));
  });
  banda.addEventListener("drop", e => {
    e.preventDefault();
    const col = e.target.closest(".columna");
    if (origen === null || !col) return;
    const destino = Number(col.dataset.indice);
    const [movido] = paleta.colores.splice(origen, 1);
    paleta.colores.splice(destino, 0, movido);
    origen = null;
    columnaElegida = null;
    guardarPaleta();
    pintarPaleta();
  });
  banda.addEventListener("dragend", () => { origen = null; pintarPaleta(); });

  document.addEventListener("keydown", teclaPaleta);
}

function teclaPaleta(e) {
  if (location.hash !== "#/generador/paleta") return document.removeEventListener("keydown", teclaPaleta);
  if (["INPUT", "SELECT", "TEXTAREA"].includes(e.target.tagName) || e.target.isContentEditable) return;
  if (e.code === "Space") { e.preventDefault(); generarPaleta(); }
  if (e.key === "Escape" && columnaElegida !== null) { columnaElegida = null; pintarPaleta(); }
}


// ---------------------------------------------------------------------
//  DESCARGAR LA PALETA COMO IMAGEN
// ---------------------------------------------------------------------

async function descargarPaleta() {
  if (!paleta.colores.length) return;
  await document.fonts.ready;
  const W = 2400, H = 1500, alto = 1180;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#F5F2EC";
  ctx.fillRect(0, 0, W, H);
  const ancho = W / paleta.colores.length;
  paleta.colores.forEach((c, i) => {
    const d = datosColor(c.hex);
    const x = i * ancho;
    ctx.fillStyle = c.hex;
    ctx.fillRect(x, 0, Math.ceil(ancho), alto);
    ctx.fillStyle = "#2A2622";
    ctx.font = `400 34px "Cormorant Garamond", serif`;
    ctx.fillText(d.nombre, x + 28, alto + 80, ancho - 40);
    ctx.font = `400 22px "IBM Plex Mono", monospace`;
    ctx.fillText(c.hex.toUpperCase(), x + 28, alto + 130, ancho - 40);
    ctx.fillStyle = "#7A7168";
    ctx.fillText(d.codigo, x + 28, alto + 168, ancho - 40);
  });
  ctx.fillStyle = "#2A2622";
  ctx.font = `500 22px "Manrope", sans-serif`;
  ctx.fillText("341 STUDIO", 28, H - 40);
  const blob = await new Promise(ok => canvas.toBlob(ok, "image/png"));
  const enlace = document.createElement("a");
  enlace.href = URL.createObjectURL(blob);
  enlace.download = `paleta-341-studio-${new Date().toISOString().slice(0, 10)}.png`;
  enlace.click();
  setTimeout(() => URL.revokeObjectURL(enlace.href), 2000);
}
