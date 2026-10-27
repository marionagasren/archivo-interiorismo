// =====================================================================
//  BIBLIOTECA DE MATERIALES Y MOBILIARIO (compartida entre proyectos)
//
//  Cada material o mueble se escribe UNA sola vez aquí, aunque aparezca
//  en varios proyectos. Después, en data/proyectos.js, cada proyecto
//  indica qué "id" usa. Así en la biblioteca no salen repetidos.
//
//  Imágenes:  img/materiales/<id>.jpg   y   img/mobiliario/<id>.jpg
//    - Materiales: una TEXTURA del material (no un recorte del proyecto)
//    - Mobiliario: foto de la pieza sobre fondo liso. Opcional: detalle: "img/mobiliario/<id>-detalle.jpg"
//      (un primer plano que aparece al pasar el ratón por encima)
//  Si todavía no hay imagen, deja imagen: "" y se mostrará solo el nombre.
//
//  Subcategorías (escribe exactamente uno de estos nombres):
//    materiales → categoria: Maderas · Piedras naturales · Revestimientos continuos ·
//                 Hormigón y cemento · Metales · Textiles · Vidrio · Cerámica
//    mobiliario → categoria: Sillas · Taburetes · Butacas y sofás · Mesas ·
//                 Almacenaje · Camas · Iluminación
//                 y solo en Iluminación, subcategoria: Suspensión · Sobremesa · Pie · Pared
//  Los colores se clasifican solos por familia de tono.
// =====================================================================

window.BIBLIOTECA = {

  materiales: [
    { id: "microcemento-beige", nombre: "Microcemento beige", categoria: "Revestimientos continuos", acabado: "Suelos y paredes en un mismo tono", imagen: "img/materiales/microcemento-beige.jpg" },
    { id: "microcemento-verde-oscuro", nombre: "Microcemento verde oscuro", categoria: "Revestimientos continuos", acabado: "Suelo, paredes y techo del baño", imagen: "img/materiales/microcemento-verde-oscuro.jpg" },
    { id: "roble-natural", nombre: "Roble natural", categoria: "Maderas", acabado: "Suelos, carpintería y mobiliario", imagen: "img/materiales/roble-natural.jpg" },
    { id: "hormigon", nombre: "Hormigón", categoria: "Hormigón y cemento", acabado: "Sofá integrado", imagen: "img/materiales/hormigon.jpg" },
    { id: "lino-natural", nombre: "Lino natural", categoria: "Textiles", acabado: "Cortinas y tapicerías", imagen: "img/materiales/lino-natural.jpg" },
    { id: "aluminio-encerado", nombre: "Aluminio cepillado", categoria: "Metales", acabado: "Acabado encerado", imagen: "img/materiales/aluminio-encerado.jpg" },
    { id: "bloque-vidrio", nombre: "Bloque de vidrio ondulado", categoria: "Vidrio", acabado: "Pared translúcida del baño", imagen: "img/materiales/bloque-vidrio.jpg" },
    { id: "roble-tenido-oscuro", nombre: "Roble teñido oscuro", categoria: "Maderas", acabado: "Muebles empotrados y mesa de comedor", imagen: "img/materiales/roble-tenido-oscuro.jpg" },
    { id: "ceramica-terracota-esmaltada", nombre: "Cerámica de terracota esmaltada", categoria: "Cerámica", acabado: "Revestimiento de chimenea · California", imagen: "img/materiales/ceramica-terracota-esmaltada.jpg" },
    { id: "ceramica-opus-incertum", nombre: "Cuarcita en opus incertum", categoria: "Piedras naturales", acabado: "Suelo en piezas irregulares", imagen: "img/materiales/ceramica-opus-incertum.jpg" },
    { id: "piedra-veteada-clara", nombre: "Piedra natural veteada clara", categoria: "Piedras naturales", acabado: "Isla de cocina", imagen: "img/materiales/piedra-veteada-clara.jpg" },
    { id: "piedra-gris-tipo-ceppo", nombre: "Piedra clara tipo Ceppo", categoria: "Piedras naturales", acabado: "Encimera de baño", imagen: "img/materiales/piedra-gris-tipo-ceppo.jpg" },
    { id: "lana-pelo-largo", nombre: "Lana bouclé", categoria: "Textiles", acabado: "Alfombra", imagen: "img/materiales/lana-pelo-largo.jpg" },
  ],

  mobiliario: [
    { id: "mesa-fusteria-vidal", nombre: "Mesa de comedor artesanal", categoria: "Mesas", autor: "", marca: "Fusteria Vidal", imagen: "img/mobiliario/mesa-fusteria-vidal.jpg" },
    { id: "lampara-sisisi", nombre: "Lámpara Sísísí Cónicas Planas", categoria: "Iluminación", subcategoria: "Suspensión", autor: "Gabriel Ordeig", marca: "Santa & Cole", año: 1987, imagen: "img/mobiliario/lampara-sisisi.jpg" },
    { id: "silla-markelius", nombre: "Silla Markelius", categoria: "Sillas", autor: "", marca: "Vintage · Fenix Originals", imagen: "img/mobiliario/silla-markelius.jpg", detalle: "img/mobiliario/silla-markelius-detalle.jpg" },
    { id: "silla-quadra", nombre: "Silla Quadra", categoria: "Sillas", autor: "", marca: "Otra Objects", imagen: "img/mobiliario/silla-quadra.jpg" },
    { id: "section-coffee-table", nombre: "Section Coffee Table", categoria: "Mesas", autor: "Paul Coenen", marca: "Vasto Gallery", año: 2023, imagen: "img/mobiliario/section-coffee-table.jpg" },
    { id: "silla-dr-sonderbar", nombre: "Silla Dr. Sonderbar", categoria: "Sillas", autor: "Philippe Starck", marca: "XO · Vintage, Polop Store", año: 1983, imagen: "img/mobiliario/silla-dr-sonderbar.jpg" },
    { id: "lampara-falkland", nombre: "Lámpara Falkland", categoria: "Iluminación", subcategoria: "Suspensión", autor: "Bruno Munari", marca: "Artemide", año: 1964, imagen: "img/mobiliario/lampara-falkland.jpg" },
    { id: "fragile-lamp", nombre: "Fragile Lamp", categoria: "Iluminación", subcategoria: "Sobremesa", autor: "Jaume Ramírez", marca: "Marset", año: 2023, imagen: "img/mobiliario/fragile-lamp.jpg" },
    { id: "l4-stool", nombre: "L4 Stool", categoria: "Taburetes", autor: "Lucas Cambier", marca: "Cambier Studio", imagen: "img/mobiliario/l4-stool.jpg" },
    { id: "lampara-j45", nombre: "Lámpara J45", categoria: "Iluminación", autor: "Andreu Jaumot", marca: "", imagen: "" },
    { id: "lampara-vis-a-vis", nombre: "Lámpara Vis à Vis", categoria: "Iluminación", subcategoria: "Sobremesa", autor: "Michele Groppi", marca: "Davide Groppi", año: 2023, imagen: "img/mobiliario/lampara-vis-a-vis.jpg" },
    { id: "lampara-lotek", nombre: "Lámpara Lotek", categoria: "Iluminación", subcategoria: "Pie", autor: "Benno Premsela", marca: "Hollands Licht · Prestada por Materia", año: 1982, imagen: "img/mobiliario/lampara-lotek.jpg" },
    { id: "taburetes-vintage-60", nombre: "Taburetes vintage años 60", categoria: "Taburetes", autor: "", marca: "Madera y hierro", imagen: "" },
    { id: "tekio-circular", nombre: "Lámpara Tekio Circular", categoria: "Iluminación", subcategoria: "Suspensión", autor: "Anthony Dickens", marca: "Santa & Cole", imagen: "img/mobiliario/tekio-circular.jpg" },
    { id: "tekio-horizontal", nombre: "Lámpara Tekio Horizontal", categoria: "Iluminación", subcategoria: "Suspensión", autor: "Anthony Dickens", marca: "Santa & Cole", imagen: "img/mobiliario/tekio-horizontal.jpg" },
    { id: "mesa-essai-mobilier", nombre: "Mesa de comedor a medida", categoria: "Mesas", autor: "", marca: "Essai Mobilier", imagen: "" },
  ],

};
