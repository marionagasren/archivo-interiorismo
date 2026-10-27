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
//  Las plantillas no llevan textos: se añaden a mano en el editor (+ Texto).
// =====================================================================

window.PLANTILLAS = [

  {
    id: "travertino",
    nombre: "Travertino",
    proporcion: [4, 5],
    recuadros: [
      { x: 39.9, y: 22,   w: 39.4, h: 47.2, z: 1, pide: "material" },
      { x: 22.4, y: 17.4, w: 40.4, h: 32.6, z: 4, pide: "material" },
      { x: 18.1, y: 48,   w: 20.7, h: 34.5, z: 2, pide: "material" },
      { x: 51.4, y: 55.3, w: 30.3, h: 24.6, z: 2, pide: "material" },
      { x: 26.8, y: 56.5, w: 20.9, h: 21.2, z: 3, pide: "material" },
    ],
  },

  {
    id: "onix",
    nombre: "Ónix",
    proporcion: [4, 5],
    recuadros: [
      { x: 19.5, y: 22.5, w: 51.7, h: 54.1, z: 1, pide: "material" },
      { x: 50.9, y: 17.1, w: 34.2, h: 49,   z: 2, pide: "material" },
      { x: 11.4, y: 55.3, w: 17.5, h: 14.1, z: 3, pide: "color" },
      { x: 28.9, y: 69.4, w: 17.7, h: 14.5, z: 3, pide: "color" },
    ],
  },

  {
    id: "tierras",
    nombre: "Tierras",
    proporcion: [4, 5],
    recuadros: [
      { x: 19.9, y: 20,   w: 36.4, h: 29.1, z: 1, pide: "material" },
      { x: 19.9, y: 51.2, w: 36.4, h: 29.1, z: 1, pide: "material" },
      { x: 58.4, y: 28.5, w: 22.1, h: 43.8, z: 2, pide: "material" },
      { x: 34.6, y: 32.6, w: 25.6, h: 35.7, z: 3, pide: "material" },
    ],
  },

  {
    id: "ficha-materiales",
    nombre: "Ficha de materiales",
    proporcion: [6, 7],
    recuadros: [
      { x: 6.5,  y: 38.5, w: 18.9, h: 23.1, z: 1, pide: "material" },
      { x: 26.4, y: 38.5, w: 14.4, h: 23.1, z: 1, pide: "color" },
      { x: 41.8, y: 38.5, w: 10.1, h: 23.1, z: 1, pide: "material" },
      { x: 52.9, y: 38.5, w: 14.3, h: 23.1, z: 1, pide: "material" },
      { x: 68.1, y: 38.5, w: 10.3, h: 23.1, z: 1, pide: "color" },
      { x: 79.3, y: 38.5, w: 14.3, h: 23.1, z: 1, pide: "material" },
    ],
  },

  {
    id: "paleta-materiales",
    nombre: "Paleta de materiales",
    proporcion: [2, 3],
    recuadros: [
      { x: 20.1, y: 14.5, w: 59.9, h: 17.5, z: 1, pide: "material" },
      { x: 20.1, y: 31.9, w: 59.9, h: 18.1, z: 1, pide: "material" },
      { x: 20.1, y: 49.9, w: 59.9, h: 18,   z: 1, pide: "material" },
      { x: 20.1, y: 67.8, w: 59.9, h: 17.7, z: 1, pide: "material" },
    ],
  },

];
