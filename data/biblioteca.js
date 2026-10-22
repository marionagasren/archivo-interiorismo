// =====================================================================
//  BIBLIOTECA DE MATERIALES Y MOBILIARIO (compartida entre proyectos)
//
//  Cada material o mueble se escribe UNA sola vez aquí, aunque aparezca
//  en varios proyectos. Después, en data/proyectos.js, cada proyecto
//  indica qué "id" usa. Así en la biblioteca no salen repetidos.
//
//  Imágenes:  img/materiales/<id>.jpg   y   img/mobiliario/<id>.jpg
// =====================================================================

window.BIBLIOTECA = {

  materiales: [
    // Ejemplo (quita las // del principio para activarlo):
    // { id: "roble-natural", nombre: "Roble natural", tipo: "Madera", acabado: "Barnizado mate", imagen: "img/materiales/roble-natural.jpg" },
  ],

  mobiliario: [
    // Ejemplo:
    // { id: "ch24-wishbone", nombre: "CH24 Wishbone", autor: "Hans J. Wegner", marca: "Carl Hansen & Søn", imagen: "img/mobiliario/ch24-wishbone.jpg" },
  ],

};
