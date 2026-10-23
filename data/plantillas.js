// =====================================================================
//  PLANTILLAS DEL GENERADOR DE MOODBOARDS
//
//  Cada plantilla tiene una proporción (ancho:alto) y una lista de recuadros.
//  Las posiciones y medidas van en % del lienzo:
//    x, y   → esquina superior izquierda (x en % del ancho, y en % del alto)
//    w, h   → ancho (% del ancho) y alto (% del alto)
//    forma  → "rect", "circulo" (solo usa w) o "piedra" (contorno irregular)
//    z      → capa: los números altos quedan encima
//    pide   → qué suele ir dentro: "material", "color" o "mueble"
//             (sirve para "Rellenar al azar"; puedes poner lo que quieras)
//  textos (opcional): títulos y notas que se pueden editar con doble clic.
// =====================================================================

window.PLANTILLAS = [

  {
    id: "muestrario",
    nombre: "Muestrario",
    proporcion: [2, 3],
    recuadros: [
      { x: 9,  y: 7,  w: 23, h: 10, z: 2, pide: "material" },
      { x: 9,  y: 17.5, w: 23, h: 9.5, z: 2, pide: "material" },
      { x: 9,  y: 27.5, w: 23, h: 10.5, z: 2, pide: "material" },
      { x: 36.5, y: 12.5, w: 25, h: 28.5, z: 2, pide: "material" },
      { x: 61, y: 9.5, w: 35.5, h: 24, z: 1, pide: "material" },
      { x: 64, y: 38, w: 26, h: 23, z: 1, pide: "material" },
      { x: 59.5, y: 27, w: 17, forma: "circulo", z: 4, pide: "color" },
      { x: 68, y: 38.5, w: 17, forma: "circulo", z: 4, pide: "color" },
      { x: 9.5, y: 41, w: 23.5, h: 15, z: 3, pide: "material" },
      { x: 33.5, y: 41.5, w: 34, h: 48, z: 1, pide: "material" },
      { x: 6.5, y: 60.5, w: 27, h: 24.5, z: 2, pide: "material" },
      { x: 23, y: 72, w: 26, h: 15, z: 4, pide: "material" },
      { x: 67.5, y: 61.5, w: 27, h: 5.5, z: 3, pide: "color" },
      { x: 67.5, y: 67, w: 27, h: 5.5, z: 3, pide: "color" },
      { x: 67.5, y: 72.5, w: 27, h: 19.5, z: 3, pide: "color" },
    ],
  },

  {
    id: "ambiente",
    nombre: "Ambiente",
    proporcion: [2, 3],
    recuadros: [
      { x: 30, y: 15, w: 23, h: 31, z: 1, pide: "material" },
      { x: 54.5, y: 11.5, w: 25.5, h: 29, z: 1, pide: "color" },
      { x: 60, y: 5.5, w: 7.5, h: 8, z: 2, pide: "color" },
      { x: 58.5, y: 22.5, w: 27.5, h: 23.5, z: 3, pide: "material" },
      { x: 36, y: 0, w: 29, h: 25, z: 4, pide: "mueble" },
      { x: 2, y: 63, w: 84, h: 18, z: 2, pide: "material" },
      { x: 5, y: 44, w: 84, h: 19, z: 5, pide: "mueble" },
      { x: 2, y: 59, w: 34, h: 21, z: 6, pide: "mueble" },
      { x: 38, y: 58, w: 42, h: 17, z: 6, pide: "mueble" },
      { x: 8,  y: 87, w: 11, forma: "circulo", z: 2, pide: "material" },
      { x: 20.5, y: 87, w: 11, forma: "circulo", z: 2, pide: "color" },
      { x: 33, y: 87, w: 11, forma: "circulo", z: 2, pide: "material" },
      { x: 45.5, y: 87, w: 11, forma: "circulo", z: 2, pide: "color" },
      { x: 58, y: 87, w: 11, forma: "circulo", z: 2, pide: "color" },
    ],
    textos: [
      { x: 5, y: 4, w: 30, texto: "Sala de estar", estilo: "titulo" },
      { x: 5, y: 15, w: 24, texto: "Equilibrio entre confort y sofisticación", estilo: "subtitulo" },
      { x: 81, y: 4, w: 17, texto: "Iluminación · Lámpara de suspensión que difunde una luz suave.", estilo: "nota" },
      { x: 88, y: 50, w: 11, texto: "Confort · Líneas curvas y volúmenes amables.", estilo: "nota" },
      { x: 5, y: 82.5, w: 50, texto: "Materiales que inspiran", estilo: "subtitulo" },
    ],
  },

  {
    id: "capas",
    nombre: "Capas",
    proporcion: [3, 4],
    recuadros: [
      { x: 28, y: 16, w: 58, h: 10, z: 0, pide: "material" },
      { x: 11.5, y: 24.5, w: 17, h: 35, z: 0, pide: "material" },
      { x: 49, y: 22.5, w: 40, h: 59.5, z: 1, pide: "material" },
      { x: 25, y: 30, w: 45, h: 41.5, z: 2, pide: "material" },
      { x: 14, y: 37, w: 67, h: 7, z: 3, pide: "material" },
      { x: 12.5, y: 47, w: 37, h: 39, forma: "piedra", z: 4, pide: "material" },
      { x: 62.5, y: 56.5, w: 15, forma: "circulo", z: 4, pide: "material" },
    ],
  },

  {
    id: "collage",
    nombre: "Collage",
    proporcion: [3, 5],
    recuadros: [
      { x: 6,  y: 4,  w: 40, h: 33, z: 2, pide: "material" },
      { x: 52, y: 5,  w: 42, h: 26, z: 1, pide: "color" },
      { x: 9,  y: 37, w: 28, h: 47, z: 1, pide: "material" },
      { x: 35, y: 31, w: 38, h: 46, z: 0, pide: "color" },
      { x: 63, y: 37, w: 31, h: 19, z: 2, pide: "material" },
      { x: 12, y: 63, w: 32, h: 29, z: 3, pide: "material" },
      { x: 62, y: 59, w: 29, h: 35, z: 2, pide: "material" },
      { x: 39, y: 71, w: 19, h: 15, z: 4, pide: "color" },
      { x: 46, y: 21, w: 13, h: 9,  z: 3, pide: "color" },
    ],
  },

];
