// =====================================================================
//  BIBLIOTECA DE MATERIALES Y MOBILIARIO (compartida entre proyectos)
//
//  Cada material o mueble se escribe UNA sola vez aquí, aunque aparezca
//  en varios proyectos. Después, en data/proyectos.js, cada proyecto
//  indica qué "id" usa. Así en la biblioteca no salen repetidos.
//
//  Imágenes:  img/materiales/<id>.jpg   y   img/mobiliario/<id>.jpg
//  Si todavía no hay imagen, deja imagen: "" y se mostrará solo el nombre.
// =====================================================================

window.BIBLIOTECA = {

  materiales: [
    { id: "microcemento-beige", nombre: "Microcemento beige", tipo: "Revestimiento continuo", acabado: "Suelos y paredes en un mismo tono", imagen: "img/materiales/microcemento-beige.jpg" },
    { id: "microcemento-verde-oscuro", nombre: "Microcemento verde oscuro", tipo: "Revestimiento continuo", acabado: "Suelo, paredes y techo del baño", imagen: "" },
    { id: "roble-natural", nombre: "Roble natural", tipo: "Madera", acabado: "Mobiliario de cocina", imagen: "img/materiales/roble-natural.jpg" },
    { id: "hormigon", nombre: "Hormigón", tipo: "Obra", acabado: "Sofá integrado", imagen: "" },
    { id: "lino-natural", nombre: "Lino natural", tipo: "Textil", acabado: "Cortinas y cojines", imagen: "img/materiales/lino-natural.jpg" },
    { id: "aluminio-encerado", nombre: "Aluminio encerado", tipo: "Metal", acabado: "Encerado", imagen: "img/materiales/aluminio-encerado.jpg" },
    { id: "bloque-vidrio", nombre: "Bloque de vidrio translúcido", tipo: "Vidrio", acabado: "Pared del baño", imagen: "" },
  ],

  mobiliario: [
    { id: "mesa-fusteria-vidal", nombre: "Mesa de comedor artesanal", autor: "", marca: "Fusteria Vidal", imagen: "img/mobiliario/mesa-fusteria-vidal.jpg" },
    { id: "lampara-sisisi", nombre: "Lámpara Sísísí", autor: "", marca: "Santa & Cole", año: 1987, imagen: "img/mobiliario/lampara-sisisi.jpg" },
    { id: "silla-markelius", nombre: "Silla Markelius", autor: "", marca: "Vintage · Fenix Originals", imagen: "img/mobiliario/silla-markelius.jpg" },
    { id: "silla-quadra", nombre: "Silla Quadra", autor: "", marca: "Otra Objects", imagen: "img/mobiliario/silla-quadra.jpg" },
    { id: "section-coffee-table", nombre: "Section Coffee Table", autor: "Paul Coenen", marca: "Vasto Gallery", año: 2023, imagen: "img/mobiliario/section-coffee-table.jpg" },
    { id: "silla-dr-sonderbar", nombre: "Silla Dr. Sonderbar", autor: "Philippe Starck", marca: "Vintage · Polop Store", imagen: "img/mobiliario/silla-dr-sonderbar.jpg" },
    { id: "lampara-falkland", nombre: "Lámpara Falkland", autor: "", marca: "Artemide", imagen: "img/mobiliario/lampara-falkland.jpg" },
    { id: "fragile-lamp", nombre: "Fragile Lamp", autor: "Jaume Ramírez", marca: "Marset", imagen: "" },
    { id: "l4-stool", nombre: "L4 Stool", autor: "", marca: "Cambier Studio", imagen: "" },
    { id: "lampara-j45", nombre: "Lámpara J45", autor: "Andreu Jaumot", marca: "", imagen: "" },
    { id: "lampara-vis-a-vis", nombre: "Lámpara Vis a Vis", autor: "Davide Groppi", marca: "", imagen: "" },
    { id: "lampara-lotek", nombre: "Lámpara Lotek", autor: "", marca: "Materia", imagen: "" },
    { id: "taburetes-vintage-60", nombre: "Taburetes vintage años 60", autor: "", marca: "Madera y hierro", imagen: "" },
  ],

};
