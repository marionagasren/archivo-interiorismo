// =====================================================================
//  341 STUDIO · publicar.js
//  #/publicar → formulario «Nuevo proyecto»; #/editar/<id> → el mismo
//  formulario con los datos de un proyecto ya publicado. Prepara las fotos y los
//  planos en el navegador y lo publica todo en el repositorio de GitHub
//  en un solo cambio (commit): las imágenes en img/proyectos/<id>/ y la
//  ficha en data/proyectos.js. Después GitHub extrae los colores solo
//  (.github/workflows/extraer-colores.yml) y la web se actualiza.
//
//  Para publicar hace falta una clave de GitHub (token) con permiso de
//  escritura en el repositorio. Se pide una vez y se guarda solo en este
//  navegador; sin ella, nadie puede publicar aunque vea el formulario.
// =====================================================================

const REPOSITORIO = "marionagasren/archivo-interiorismo";
const RAMA = "main";
const CLAVE_TOKEN = "341-github-token";
const LADO_MAXIMO_FOTO = 2400;    // px del lado largo: suficiente para la web y ligero
const TIPOLOGIAS = ["Vivienda", "Local comercial", "Restaurante", "Oficina", "Hotel", "Espacio cultural"];

// Lo que se va rellenando en el formulario (se pierde al salir de la página)
let borrador = null;

function nuevoBorrador() {
  return { fotos: [], planos: [], portada: 0, materiales: [], mobiliario: [] };
}

function leerToken() {
  try { return localStorage.getItem(CLAVE_TOKEN) || ""; } catch { return ""; }
}
function guardarToken(valor) {
  try { valor ? localStorage.setItem(CLAVE_TOKEN, valor) : localStorage.removeItem(CLAVE_TOKEN); } catch {}
}


// ---------------------------------------------------------------------
//  VISTA
// ---------------------------------------------------------------------

function vistaPublicar(idEditar) {
  const original = idEditar ? PROYECTOS.find(p => p.id === idEditar) : null;
  if (idEditar && !original) return vistaNoEncontrada();
  borrador = nuevoBorrador();
  if (original) {
    // Al editar se parte de lo que ya está publicado
    const auto = AUTO[original.id] || { fotos: [], planos: [] };
    const existente = ruta => ({ existente: ruta.split("/").pop(), url: ruta });
    borrador.editando = original.id;
    borrador.fotos = auto.fotos.map(existente);
    borrador.planos = auto.planos.map(existente);
    borrador.materiales = [...(original.materiales || [])];
    borrador.mobiliario = [...(original.mobiliario || [])];
  }
  const valor = campo => texto(original?.[campo] ?? "");
  const tipo = original?.tipo || "propio";
  const token = leerToken();
  app.innerHTML = `
    <section class="intro">
      <p class="volver"><a href="${original ? `#/proyecto/${original.id}` : "#/proyectos"}">← ${original ? texto(original.nombre) : "Proyectos"}</a></p>
      <h1>${original ? "Editar proyecto" : "Nuevo proyecto"}</h1>
      <p class="intro-texto">${original
        ? "Cambia la información, añade o quita fotos y elige la portada. Al guardar, los cambios aparecen en la web en unos minutos."
        : "Solo el nombre es obligatorio: las fotos y el resto de datos se pueden añadir más adelante editando el proyecto. Al publicar, aparece en Proyectos en unos minutos con sus colores extraídos automáticamente."}</p>
    </section>

    <form class="publicar" id="publicar" novalidate>
      <section class="publicar-bloque">
        <h2 class="publicar-titulo"><span>01</span> Información</h2>
        <div class="publicar-campos">
          <label class="campo campo-ancho">
            <span>Nombre del proyecto *</span>
            <input name="nombre" required placeholder="p. ej. Casa Tamariu" value="${valor("nombre")}">
            <small class="campo-ayuda" id="ayuda-id">${original ? `Dirección: #/proyecto/${original.id} (no cambia)` : ""}</small>
          </label>
          <fieldset class="campo campo-ancho">
            <span>Tipo</span>
            <div class="opciones">
              <label><input type="radio" name="tipo" value="propio" ${tipo === "propio" ? "checked" : ""}> Proyecto de 341 Studio</label>
              <label><input type="radio" name="tipo" value="referencia" ${tipo === "referencia" ? "checked" : ""}> Referencia</label>
            </div>
          </fieldset>
          <label class="campo"><span>Autores / estudio</span><input name="autores" placeholder="341 Studio" value="${valor("autores")}"></label>
          <label class="campo"><span>Ubicación</span><input name="ubicacion" placeholder="Barcelona" value="${valor("ubicacion")}"></label>
          <label class="campo"><span>Año</span><input name="año" inputmode="numeric" placeholder="2026" value="${valor("año")}"></label>
          <label class="campo"><span>Tipología</span>
            <input name="tipologia" list="tipologias" placeholder="Vivienda" value="${valor("tipologia")}">
            <datalist id="tipologias">${TIPOLOGIAS.map(t => `<option value="${t}">`).join("")}</datalist>
          </label>
          <label class="campo"><span>Fotografía</span><input name="fotografo" placeholder="Nombre del fotógrafo" value="${valor("fotografo")}"></label>
          <label class="campo"><span>Web / fuente</span><input name="fuente" type="url" placeholder="https://" value="${valor("fuente")}"></label>
          <label class="campo campo-ancho"><span>Descripción</span><textarea name="descripcion" rows="5" placeholder="Cómo es el espacio, qué se buscaba, materiales protagonistas…">${valor("descripcion")}</textarea></label>
        </div>
      </section>

      <section class="publicar-bloque">
        <h2 class="publicar-titulo"><span>02</span> Fotos <em>opcional</em></h2>
        <p class="publicar-nota">Arrastra las fotos o elígelas desde tu ordenador. Pulsa <strong>Portada</strong> en la que quieras de imagen principal y usa las flechas para ordenarlas. Si aún no las tienes, el proyecto se muestra con una imagen provisional hasta que las añadas.</p>
        <label class="soltar" data-zona="fotos">
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden>
          <span>Soltar fotos aquí o <u>elegir archivos</u></span>
        </label>
        <div class="miniaturas" id="miniaturas-fotos"></div>
      </section>

      <section class="publicar-bloque">
        <h2 class="publicar-titulo"><span>03</span> Planos <em>opcional</em></h2>
        <label class="soltar" data-zona="planos">
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden>
          <span>Soltar planos aquí o <u>elegir archivos</u></span>
        </label>
        <div class="miniaturas" id="miniaturas-planos"></div>
      </section>

      <section class="publicar-bloque">
        <h2 class="publicar-titulo"><span>04</span> Materiales y mobiliario <em>opcional</em></h2>
        <p class="publicar-nota">Marca los materiales y las piezas de la biblioteca que aparecen en el proyecto. Los colores se extraen solos de las fotos.</p>
        <div class="publicar-elegir">
          <div>
            <h3 class="publicar-subtitulo">Texturas y materiales</h3>
            <div class="chips" data-lista="materiales">
              ${BIBLIOTECA.materiales.map(m => chipBiblioteca("materiales", m, borrador.materiales.includes(m.id))).join("")}
            </div>
          </div>
          <div>
            <h3 class="publicar-subtitulo">Mobiliario</h3>
            <div class="chips" data-lista="mobiliario">
              ${BIBLIOTECA.mobiliario.map(m => chipBiblioteca("mobiliario", m, borrador.mobiliario.includes(m.id))).join("")}
            </div>
          </div>
        </div>
      </section>

      <section class="publicar-bloque">
        <h2 class="publicar-titulo"><span>05</span> Publicar</h2>
        <details class="conexion" ${token ? "" : "open"}>
          <summary>${token ? "✓ Conectado con GitHub" : "Conectar con GitHub (solo la primera vez)"}</summary>
          <div class="conexion-cuerpo">
            <p>Para publicar desde la web hace falta una clave de acceso de GitHub. Se guarda solo en este navegador.</p>
            <ol>
              <li>Entra en <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">GitHub → Settings → Fine-grained tokens → Generate new token</a>.</li>
              <li>En <em>Repository access</em> elige <em>Only select repositories</em> → <strong>${REPOSITORIO.split("/")[1]}</strong>.</li>
              <li>En <em>Permissions</em> pulsa <strong>+ Add permissions</strong>, marca <strong>Contents</strong> y cambia su acceso a <strong>Read and write</strong>. Pulsa <em>Generate token</em>.</li>
              <li>Cópiala y pégala aquí:</li>
            </ol>
            <div class="conexion-fila">
              <input type="password" id="token" placeholder="github_pat_…" value="${texto(token)}" autocomplete="off">
              <button type="button" class="boton-linea" data-comprobar>Guardar y comprobar</button>
              ${token ? `<button type="button" class="boton-linea" data-olvidar>Olvidar clave</button>` : ""}
            </div>
            <p class="conexion-estado" id="estado-conexion" aria-live="polite"></p>
          </div>
        </details>
        <div class="publicar-final">
          ${original ? `<button type="button" class="boton-eliminar" data-eliminar>Eliminar proyecto</button>` : ""}
          <p class="publicar-estado" id="estado-publicar" aria-live="polite"></p>
          <button type="submit" class="boton-publicar">${original ? "Guardar cambios" : "Publicar proyecto"}</button>
        </div>
      </section>
    </form>`;

  activarPublicar();
  pintarMiniaturas("fotos");
  pintarMiniaturas("planos");
}

function chipBiblioteca(tipo, item, elegido = false) {
  return `<button type="button" class="chip ${elegido ? "elegido" : ""}" data-tipo="${tipo}" data-id="${texto(item.id)}" aria-pressed="${elegido}">
    ${item.imagen ? `<img src="${texto(item.imagen)}" alt="" loading="lazy">` : ""}<span>${texto(item.nombre)}</span>
  </button>`;
}


// ---------------------------------------------------------------------
//  INTERACCIÓN DEL FORMULARIO
// ---------------------------------------------------------------------

function activarPublicar() {
  const form = document.getElementById("publicar");

  // Vista previa de la dirección del proyecto (su id)
  const nombre = form.elements.nombre;
  const ayudaId = document.getElementById("ayuda-id");
  nombre.addEventListener("input", () => {
    if (borrador.editando) return;   // al editar, la dirección no cambia
    const id = slug(nombre.value);
    ayudaId.textContent = id ? `Dirección: #/proyecto/${idLibre(id)}` : "";
  });

  // Zonas para soltar o elegir imágenes
  form.querySelectorAll(".soltar").forEach(zona => {
    const lista = zona.dataset.zona;
    const input = zona.querySelector("input");
    input.addEventListener("change", () => { añadirImagenes(lista, input.files); input.value = ""; });
    zona.addEventListener("dragover", e => { e.preventDefault(); zona.classList.add("encima"); });
    zona.addEventListener("dragleave", () => zona.classList.remove("encima"));
    zona.addEventListener("drop", e => { e.preventDefault(); zona.classList.remove("encima"); añadirImagenes(lista, e.dataTransfer.files); });
  });

  // Portada, ordenar y quitar
  form.querySelectorAll(".miniaturas").forEach(caja => caja.addEventListener("click", e => {
    const b = e.target.closest("button[data-accion]");
    if (!b) return;
    const lista = caja.id === "miniaturas-fotos" ? "fotos" : "planos";
    const i = Number(b.dataset.i);
    const imagenes = borrador[lista];
    const accion = b.dataset.accion;
    if (accion === "portada") borrador.portada = i;
    if (accion === "quitar") {
      if (imagenes[i].archivo) URL.revokeObjectURL(imagenes[i].url);
      imagenes.splice(i, 1);
      if (lista === "fotos") borrador.portada = i === borrador.portada ? 0 : borrador.portada - (i < borrador.portada ? 1 : 0);
    }
    if (accion === "izquierda" || accion === "derecha") {
      const j = accion === "izquierda" ? i - 1 : i + 1;
      if (j < 0 || j >= imagenes.length) return;
      [imagenes[i], imagenes[j]] = [imagenes[j], imagenes[i]];
      if (lista === "fotos") borrador.portada = borrador.portada === i ? j : borrador.portada === j ? i : borrador.portada;
    }
    pintarMiniaturas(lista);
  }));

  // Materiales y mobiliario
  form.querySelectorAll(".chips").forEach(caja => caja.addEventListener("click", e => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    const lista = borrador[chip.dataset.tipo];
    const id = chip.dataset.id;
    const elegido = !lista.includes(id);
    elegido ? lista.push(id) : lista.splice(lista.indexOf(id), 1);
    chip.classList.toggle("elegido", elegido);
    chip.setAttribute("aria-pressed", elegido);
  }));

  // Clave de GitHub
  form.querySelector("[data-olvidar]")?.addEventListener("click", () => {
    guardarToken("");
    document.getElementById("token").value = "";
    aviso("Clave olvidada en este navegador");
  });

  // Comprueba la clave sin publicar nada: lee data/proyectos.js del repositorio
  form.querySelector("[data-comprobar]").addEventListener("click", async () => {
    const estado = document.getElementById("estado-conexion");
    const token = document.getElementById("token").value.trim();
    estado.classList.remove("error", "bien");
    if (!token) { estado.textContent = "Pega primero la clave."; estado.classList.add("error"); return; }
    estado.textContent = "Comprobando…";
    try {
      const r = await fetch(`https://api.github.com/repos/${REPOSITORIO}/contents/data/proyectos.js?ref=${RAMA}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
      });
      if (r.status === 401) throw new Error("La clave no es válida o ha caducado.");
      if (!r.ok) throw new Error("La clave no tiene acceso al repositorio. Revisa que esté elegido «archivo-interiorismo» y el permiso Contents.");
      guardarToken(token);
      estado.textContent = "✓ Clave correcta y guardada en este navegador. Ya puedes publicar proyectos.";
      estado.classList.add("bien");
      form.querySelector(".conexion summary").textContent = "✓ Conectado con GitHub";
    } catch (error) {
      estado.textContent = error.message.startsWith("La clave") ? error.message : "No se ha podido conectar con GitHub. Revisa la conexión a internet.";
      estado.classList.add("error");
    }
  });

  form.querySelector("[data-eliminar]")?.addEventListener("click", () => eliminarProyecto(form));
  form.addEventListener("submit", e => { e.preventDefault(); publicarProyecto(form); });
}

function añadirImagenes(lista, archivos) {
  const validos = [...archivos].filter(f => /^image\/(jpeg|png|webp)$/.test(f.type));
  if (validos.length < archivos.length) aviso("Algunos archivos no son JPG, PNG o WEBP y no se han añadido");
  for (const archivo of validos) borrador[lista].push({ archivo, url: URL.createObjectURL(archivo) });
  pintarMiniaturas(lista);
}

function pintarMiniaturas(lista) {
  const imagenes = borrador[lista];
  const fotos = lista === "fotos";
  document.getElementById(`miniaturas-${lista}`).innerHTML = imagenes.map((img, i) => `
    <figure class="miniatura-subida ${fotos && i === borrador.portada ? "es-portada" : ""}">
      <img src="${img.url}" alt="">
      ${fotos && i === borrador.portada ? `<span class="etiqueta-portada">Portada</span>` : ""}
      <figcaption>
        <button type="button" data-accion="izquierda" data-i="${i}" title="Mover a la izquierda" ${i === 0 ? "disabled" : ""}>←</button>
        ${fotos ? `<button type="button" data-accion="portada" data-i="${i}" ${i === borrador.portada ? "disabled" : ""}>Portada</button>` : ""}
        <button type="button" data-accion="derecha" data-i="${i}" title="Mover a la derecha" ${i === imagenes.length - 1 ? "disabled" : ""}>→</button>
        <button type="button" data-accion="quitar" data-i="${i}" title="Quitar">×</button>
      </figcaption>
    </figure>`).join("");
}

// Un id que no exista ya (si «casa-tamariu» existe → «casa-tamariu-2»)
function idLibre(id, existentes = PROYECTOS.map(p => p.id)) {
  let libre = id, n = 2;
  while (existentes.includes(libre)) libre = `${id}-${n++}`;
  return libre;
}


// ---------------------------------------------------------------------
//  PREPARAR LOS DATOS
// ---------------------------------------------------------------------

// Reduce la imagen (lado largo máximo) y la devuelve en base64.
// Las fotos se guardan en JPG; los planos PNG se mantienen en PNG (líneas nítidas).
async function prepararImagen(archivo, formato) {
  const bitmap = await createImageBitmap(archivo);
  const escala = Math.min(1, LADO_MAXIMO_FOTO / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * escala);
  canvas.height = Math.round(bitmap.height * escala);
  const ctx = canvas.getContext("2d");
  if (formato === "image/jpeg") { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height); }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  const blob = await new Promise(ok => canvas.toBlob(ok, formato, .86));
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binario = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binario += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binario);
}

// El bloque del proyecto con el mismo formato que los de data/proyectos.js
function bloqueProyecto(datos) {
  const valor = v => JSON.stringify(v);
  const lista = l => `[${l.map(valor).join(", ")}]`;
  return `  {
    id: ${valor(datos.id)},
    tipo: ${valor(datos.tipo)},
    nombre: ${valor(datos.nombre)},
    autores: ${valor(datos.autores)},
    ubicacion: ${valor(datos.ubicacion)},
    año: ${/^\d{4}$/.test(datos.año) ? datos.año : valor(datos.año)},
    tipologia: ${valor(datos.tipologia)},
    fotografo: ${valor(datos.fotografo)},
    fuente: ${valor(datos.fuente)},
    descripcion: ${valor(datos.descripcion)},
    colores: [${(datos.colores || []).map(c => `{ nombre: ${valor(c.nombre ?? "")}, hex: ${valor(c.hex ?? "")}${c.ral ? `, ral: ${valor(c.ral)}` : ""} }`).join(", ")}],
    materiales: ${lista(datos.materiales)},
    mobiliario: ${lista(datos.mobiliario)},
  },
`;
}

// Añade el bloque al final de la lista window.PROYECTOS = [ ... ];
function añadirAlArchivo(contenido, bloque) {
  const fin = contenido.lastIndexOf("];");
  if (fin < 0) throw new Error("No se ha encontrado el final de la lista en data/proyectos.js");
  let antes = contenido.slice(0, fin).replace(/\s*$/, "");
  if (!antes.endsWith(",") && !antes.endsWith("[")) antes += ",";
  return `${antes}\n${bloque}${contenido.slice(fin)}`;
}

// Sustituye el bloque { ... } del proyecto con ese id por el nuevo.
// Recorre las llaves teniendo en cuenta los textos entre comillas.
function reemplazarBloque(contenido, id, bloque) {
  const marca = contenido.indexOf(`id: ${JSON.stringify(id)}`);
  if (marca < 0) throw new Error("No se ha encontrado el proyecto en data/proyectos.js");
  const inicio = contenido.lastIndexOf("{", marca);
  const inicioLinea = contenido.lastIndexOf("\n", inicio) + 1;
  let nivel = 0, comilla = null, fin = -1;
  for (let i = inicio; i < contenido.length && fin < 0; i++) {
    const c = contenido[i];
    if (comilla) { if (c === "\\") i++; else if (c === comilla) comilla = null; continue; }
    if (c === '"' || c === "'" || c === "`") comilla = c;
    else if (c === "{") nivel++;
    else if (c === "}" && --nivel === 0) fin = i;
  }
  if (fin < 0) throw new Error("data/proyectos.js no tiene el formato esperado");
  let resto = fin + 1;
  if (contenido[resto] === ",") resto++;
  const finLinea = contenido.indexOf("\n", resto);
  return contenido.slice(0, inicioLinea) + bloque + contenido.slice(finLinea < 0 ? contenido.length : finLinea + 1);
}

function textoABase64(textoPlano) {
  const bytes = new TextEncoder().encode(textoPlano);
  let binario = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binario += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binario);
}
function base64ATexto(b64) {
  const binario = atob(b64.replace(/\s/g, ""));
  return new TextDecoder().decode(Uint8Array.from(binario, c => c.charCodeAt(0)));
}


// ---------------------------------------------------------------------
//  PUBLICAR EN GITHUB (un solo commit con todo)
// ---------------------------------------------------------------------

// Llamadas a la API de GitHub con la clave guardada
function clienteGitHub(token) {
  return async (ruta, opciones = {}, { permitirNoExiste = false } = {}) => {
    const r = await fetch(`https://api.github.com/repos/${REPOSITORIO}${ruta}`, {
      ...opciones,
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "Content-Type": "application/json" },
    });
    if (r.status === 404 && permitirNoExiste) return null;
    if (r.status === 401) throw new Error("La clave de GitHub no es válida o ha caducado.");
    if (r.status === 403 || r.status === 404) throw new Error("La clave de GitHub no tiene permiso de escritura en el repositorio (Contents: Read and write).");
    if (!r.ok) throw new Error(`GitHub ha respondido con un error (${r.status}).`);
    return r.json();
  };
}

// Elimina el proyecto que se está editando: su ficha en data/proyectos.js
// y todos los archivos de su carpeta, en un solo commit
async function eliminarProyecto(form) {
  const id = borrador.editando;
  const nombre = PROYECTOS.find(p => p.id === id)?.nombre || id;
  const estado = document.getElementById("estado-publicar");
  const decir = (mensaje, error = false) => { estado.textContent = mensaje; estado.classList.toggle("error", error); };
  const token = document.getElementById("token").value.trim();
  if (!token) { decir("Falta la clave de GitHub (apartado «Conectar con GitHub»).", true); form.querySelector(".conexion").open = true; return; }
  if (!confirm(`¿Eliminar el proyecto «${nombre}»?\n\nSe borrarán su ficha, sus fotos y sus planos de la web. No se puede deshacer desde aquí.`)) return;

  const botones = form.querySelectorAll(".boton-publicar, .boton-eliminar");
  botones.forEach(b => b.disabled = true);
  try {
    const api = clienteGitHub(token);
    decir("Conectando con GitHub…");
    const ref = await api(`/git/ref/heads/${RAMA}`);
    const commitActual = await api(`/git/commits/${ref.object.sha}`);
    const archivo = await api(`/contents/data/proyectos.js?ref=${ref.object.sha}`);
    guardarToken(token);

    decir("Eliminando…");
    const carpeta = `img/proyectos/${id}`;
    const lista = await api(`/contents/${carpeta}?ref=${ref.object.sha}`, {}, { permitirNoExiste: true });
    const arbol = (Array.isArray(lista) ? lista : []).filter(f => f.type === "file")
      .map(f => ({ path: `${carpeta}/${f.name}`, mode: "100644", type: "blob", sha: null }));
    const blob = await api("/git/blobs", { method: "POST", body: JSON.stringify({
      content: textoABase64(reemplazarBloque(base64ATexto(archivo.content), id, "")), encoding: "base64" }) });
    arbol.push({ path: "data/proyectos.js", mode: "100644", type: "blob", sha: blob.sha });

    const nuevoArbol = await api("/git/trees", { method: "POST", body: JSON.stringify({ base_tree: commitActual.tree.sha, tree: arbol }) });
    const nuevoCommit = await api("/git/commits", { method: "POST", body: JSON.stringify({
      message: `Elimina el proyecto: ${nombre} (desde la web)`, tree: nuevoArbol.sha, parents: [ref.object.sha],
    }) });
    await api(`/git/refs/heads/${RAMA}`, { method: "PATCH", body: JSON.stringify({ sha: nuevoCommit.sha }) });

    form.outerHTML = `
      <section class="publicado">
        <h2>«${texto(nombre)}» se ha eliminado</h2>
        <p>En unos <strong>2–3 minutos</strong> dejará de aparecer en Proyectos; si aún lo ves, recarga la página.</p>
        <p class="publicado-acciones"><a class="boton-publicar" href="#/proyectos">Ir a Proyectos</a></p>
      </section>`;
  } catch (error) {
    console.error(error);
    decir(`No se ha podido eliminar: ${error.message}`, true);
    botones.forEach(b => b.disabled = false);
  }
}

async function publicarProyecto(form) {
  const estado = document.getElementById("estado-publicar");
  const boton = form.querySelector(".boton-publicar");
  const decir = (mensaje, error = false) => { estado.textContent = mensaje; estado.classList.toggle("error", error); };

  const datos = Object.fromEntries(["nombre", "autores", "ubicacion", "año", "tipologia", "fotografo", "fuente", "descripcion"]
    .map(campo => [campo, form.elements[campo].value.trim()]));
  datos.tipo = form.elements.tipo.value;
  datos.materiales = [...borrador.materiales];
  datos.mobiliario = [...borrador.mobiliario];
  const token = document.getElementById("token").value.trim();

  if (!datos.nombre) { decir("Falta el nombre del proyecto.", true); form.elements.nombre.focus(); return; }
  if (!token) { decir("Falta la clave de GitHub (apartado «Conectar con GitHub»).", true); form.querySelector(".conexion").open = true; return; }

  boton.disabled = true;
  try {
    const api = clienteGitHub(token);

    decir("Conectando con GitHub…");
    const ref = await api(`/git/ref/heads/${RAMA}`);
    const commitActual = await api(`/git/commits/${ref.object.sha}`);
    const archivo = await api(`/contents/data/proyectos.js?ref=${ref.object.sha}`);
    const contenido = base64ATexto(archivo.content);
    guardarToken(token);

    const editando = borrador.editando;
    const publicados = [...contenido.matchAll(/^\s*id:\s*"([^"]+)"/gm)].map(m => m[1]);
    if (editando) {
      if (!publicados.includes(editando)) throw new Error("Este proyecto no está en GitHub; recarga la página.");
      datos.id = editando;
      datos.colores = PROYECTOS.find(p => p.id === editando)?.colores || [];   // colores añadidos a mano: se conservan
    } else {
      // id libre también frente a lo que ya esté publicado en GitHub
      datos.id = idLibre(slug(datos.nombre) || "proyecto", [...publicados, ...PROYECTOS.map(p => p.id)]);
    }
    const carpeta = `img/proyectos/${datos.id}`;

    // Lo que ya hay en la carpeta del proyecto (al editar): nombre → sha
    const enCarpeta = {};
    if (editando) {
      const lista = await api(`/contents/${carpeta}?ref=${ref.object.sha}`, {}, { permitirNoExiste: true });
      for (const f of Array.isArray(lista) ? lista : []) enCarpeta[f.name] = f.sha;
    }

    const arbol = [];
    const subir = async (ruta, base64) => {
      const blob = await api("/git/blobs", { method: "POST", body: JSON.stringify({ content: base64, encoding: "base64" }) });
      arbol.push({ path: ruta, mode: "100644", type: "blob", sha: blob.sha });
    };
    // Cada imagen acaba como foto-01, foto-02… (o plano-01…). Las que ya
    // estaban se reaprovechan sin volver a subirlas; las nuevas se preparan.
    const colocar = async (imagenes, prefijo, etiqueta) => {
      for (const [i, img] of imagenes.entries()) {
        const numero = String(i + 1).padStart(2, "0");
        if (img.existente) {
          const sha = enCarpeta[img.existente];
          if (!sha) throw new Error(`«${img.existente}» ya no está en GitHub; recarga la página.`);
          arbol.push({ path: `${carpeta}/${prefijo}-${numero}.${img.existente.split(".").pop().toLowerCase()}`, mode: "100644", type: "blob", sha });
        } else {
          decir(`Preparando y subiendo ${etiqueta} ${i + 1} de ${imagenes.length}…`);
          const png = prefijo === "plano" && img.archivo.type === "image/png";
          await subir(`${carpeta}/${prefijo}-${numero}.${png ? "png" : "jpg"}`, await prepararImagen(img.archivo, png ? "image/png" : "image/jpeg"));
        }
      }
    };
    // Portada primero: será foto-01
    const fotos = borrador.fotos.length ? [borrador.fotos[borrador.portada], ...borrador.fotos.filter((_, i) => i !== borrador.portada)] : [];
    await colocar(fotos, "foto", "foto");
    await colocar(borrador.planos, "plano", "plano");
    // Las fotos y planos antiguos que ya no se usan se borran
    const finales = new Set(arbol.map(a => a.path));
    for (const nombre of Object.keys(enCarpeta)) {
      const ruta = `${carpeta}/${nombre}`;
      if (/^(foto|plano)/i.test(nombre) && !finales.has(ruta)) arbol.push({ path: ruta, mode: "100644", type: "blob", sha: null });
    }

    decir("Guardando la ficha…");
    const bloque = bloqueProyecto(datos);
    await subir("data/proyectos.js", textoABase64(editando ? reemplazarBloque(contenido, editando, bloque) : añadirAlArchivo(contenido, bloque)));

    decir("Publicando…");
    const nuevoArbol = await api("/git/trees", { method: "POST", body: JSON.stringify({ base_tree: commitActual.tree.sha, tree: arbol }) });
    const nuevoCommit = await api("/git/commits", { method: "POST", body: JSON.stringify({
      message: editando ? `Edita el proyecto: ${datos.nombre} (desde la web)` : `Nuevo proyecto: ${datos.nombre} (publicado desde la web)`,
      tree: nuevoArbol.sha, parents: [ref.object.sha],
    }) });
    await api(`/git/refs/heads/${RAMA}`, { method: "PATCH", body: JSON.stringify({ sha: nuevoCommit.sha }) });

    form.outerHTML = editando ? `
      <section class="publicado">
        <h2>Cambios guardados en «${texto(datos.nombre)}»</h2>
        <p>La web se está actualizando${fotos.some(f => !f.existente) ? " y GitHub está extrayendo los colores de las fotos nuevas" : ""}. En unos <strong>2–3 minutos</strong> verás los cambios; si no, recarga la página.</p>
        <p class="publicado-acciones">
          <a class="boton-publicar" href="#/proyecto/${datos.id}">Ver el proyecto</a>
          <a class="boton-linea" href="#/proyectos">Ir a Proyectos</a>
        </p>
      </section>` : `
      <section class="publicado">
        <h2>«${texto(datos.nombre)}» se ha publicado</h2>
        <p>${fotos.length ? "GitHub está extrayendo los colores de las fotos y actualizando la web." : "Se mostrará con una imagen provisional hasta que añadas las fotos con «Editar proyecto»."} En unos <strong>2–3 minutos</strong> aparecerá en Proyectos; si no lo ves, recarga la página.</p>
        <p class="publicado-acciones">
          <a class="boton-publicar" href="#/proyectos">Ir a Proyectos</a>
          <a class="boton-linea" href="#/publicar" onclick="setTimeout(vistaPublicar)">Publicar otro proyecto</a>
        </p>
      </section>`;
  } catch (error) {
    console.error(error);
    decir(`No se ha podido publicar: ${error.message}`, true);
    boton.disabled = false;
  }
}
