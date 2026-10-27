// =====================================================================
//  341 STUDIO · favoritos.js
//  Botón «guardar» en colores, materiales y mobiliario, y la página
//  #/favoritos donde se reúne todo lo guardado. Se guarda en el
//  navegador (localStorage), así que no hace falta iniciar sesión.
// =====================================================================

const CLAVE_FAVORITOS = "341-favoritos";
const TIPOS_FAVORITOS = [["colores", "Colores"], ["materiales", "Materiales"], ["mobiliario", "Mobiliario"]];

function leerFavoritos() {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE_FAVORITOS)) || {};
    return Object.fromEntries(TIPOS_FAVORITOS.map(([tipo]) => [tipo, Array.isArray(guardado[tipo]) ? guardado[tipo] : []]));
  } catch {
    return { colores: [], materiales: [], mobiliario: [] };
  }
}

function esFavorito(tipo, id) {
  return leerFavoritos()[tipo].includes(id);
}

// Guarda o quita; lo último guardado sale primero en Favoritos
function alternarFavorito(tipo, id) {
  const favoritos = leerFavoritos();
  const ya = favoritos[tipo].includes(id);
  favoritos[tipo] = ya ? favoritos[tipo].filter(x => x !== id) : [id, ...favoritos[tipo]];
  try { localStorage.setItem(CLAVE_FAVORITOS, JSON.stringify(favoritos)); } catch {}
  return !ya;
}

// El icono se dibuja una sola vez (un <symbol>) y cada botón lo reutiliza,
// así las 2.000 muestras de la carta no cargan 2.000 dibujos
document.body.insertAdjacentHTML("afterbegin", `
  <svg width="0" height="0" style="position:absolute" aria-hidden="true">
    <symbol id="icono-guardar" viewBox="0 0 16 20">
      <path d="M2.5 1.5h11a1 1 0 0 1 1 1v15.2a.4.4 0 0 1-.58.36L8 15.2l-5.92 2.86a.4.4 0 0 1-.58-.36V2.5a1 1 0 0 1 1-1z"/>
    </symbol>
  </svg>`);

function botonGuardar(tipo, id, nombre) {
  const guardado = esFavorito(tipo, id);
  return `<button class="guardar ${guardado ? "guardado" : ""}" data-guardar="${tipo}" data-id="${texto(id)}"
    aria-pressed="${guardado}" title="${guardado ? "Quitar de favoritos" : "Guardar en favoritos"}" aria-label="Guardar ${texto(nombre)}">
    <svg viewBox="0 0 16 20" aria-hidden="true"><use href="#icono-guardar"/></svg>
  </button>`;
}

document.addEventListener("click", e => {
  const boton = e.target.closest("[data-guardar]");
  if (!boton) return;
  e.preventDefault();
  const { guardar: tipo, id } = boton.dataset;
  const guardado = alternarFavorito(tipo, id);
  document.querySelectorAll(`[data-guardar="${tipo}"]`).forEach(b => {
    if (b.dataset.id !== id) return;
    b.classList.toggle("guardado", guardado);
    b.setAttribute("aria-pressed", guardado);
    b.title = guardado ? "Quitar de favoritos" : "Guardar en favoritos";
  });
  aviso(guardado ? "Guardado en favoritos" : "Quitado de favoritos");
  // En la propia página de favoritos, lo que se quita desaparece
  if (!guardado && location.hash.startsWith("#/favoritos")) vistaFavoritos();
});


// ---------------------------------------------------------------------
//  VISTA: FAVORITOS
// ---------------------------------------------------------------------

function vistaFavoritos() {
  const favoritos = leerFavoritos();
  const ordenar = (lista, clave, ids) => ids.map(id => lista.find(x => x[clave] === id)).filter(Boolean);
  const grupos = {
    colores: ordenar(cartaColores(), "codigo", favoritos.colores),
    materiales: ordenar(bibliotecaPiezas("materiales"), "id", favoritos.materiales),
    mobiliario: ordenar(bibliotecaPiezas("mobiliario"), "id", favoritos.mobiliario),
  };
  const total = Object.values(grupos).reduce((n, g) => n + g.length, 0);

  const contenido = {
    colores: items => `<div class="carta-rejilla">${items.map(c => fichaCarta(c)).join("")}</div>`,
    materiales: items => catalogoMateriales(items),
    mobiliario: items => `<div class="rejilla-piezas">${items.map(item => `
      <div class="item-biblioteca">
        ${fichaPieza(item, "mobiliario")}
        <p class="aparece">${enlacesProyectos(item.proyectos)}</p>
      </div>`).join("")}</div>`,
  };

  app.innerHTML = `
    <section class="intro">
      <h1>Favoritos</h1>
      <p class="intro-texto">${total
        ? `${total} ${total === 1 ? "elemento guardado" : "elementos guardados"}. Pulsa el marcador de cualquier color, material o pieza de la biblioteca para añadirlo aquí.`
        : `Todavía no has guardado nada. Pulsa el marcador <svg class="icono-en-texto" viewBox="0 0 16 20" aria-hidden="true"><use href="#icono-guardar"/></svg> de cualquier color, material o pieza de la <a href="#/biblioteca/colores">biblioteca</a> y aparecerá aquí.`}</p>
    </section>
    <div class="favoritos">
      ${TIPOS_FAVORITOS.filter(([tipo]) => grupos[tipo].length).map(([tipo, nombre]) => `
        <section class="carta-grupo favoritos-grupo">
          <header class="carta-grupo-cabecera">
            <h3>${nombre}</h3>
            <span class="carta-grupo-total">${grupos[tipo].length}</span>
          </header>
          ${contenido[tipo](grupos[tipo])}
        </section>`).join("")}
    </div>`;

  // En los colores guardados, la muestra copia el código y «+» la añade a la paleta
  app.querySelector(".favoritos").addEventListener("click", e => {
    const ficha = e.target.closest(".carta-color");
    if (!ficha || e.target.closest("[data-guardar]")) return;
    if (e.target.closest("[data-anadir]")) { anadirAPaleta(ficha.dataset.hex); return; }
    copiarTexto(ficha.dataset.hex);
  });
}
