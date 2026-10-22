// =====================================================================
//  PROYECTOS
//  Un bloque { ... } por proyecto. Para añadir uno nuevo, copia el
//  bloque de ejemplo, cambia los datos y separa los bloques con comas.
//
//  - id: tiene que ser EXACTAMENTE el nombre de la carpeta en img/proyectos/
//  - tipo: "referencia" (proyectos de otros que me inspiran)
//          o "propio" (proyectos de 341 Studio, para el porfolio)
//  - Las fotos (foto-01.jpg...), los planos (plano-01.png...) y los colores
//    se detectan solos desde la carpeta: no hace falta escribirlos aquí.
//  - materiales y mobiliario: los "id" de data/biblioteca.js
//  - colores: opcional, para AÑADIR colores a mano además de los automáticos
//      { nombre: "Terracota", hex: "#B5654A", ral: "RAL 8023" }
//  - Si un dato no se conoce, déjalo vacío ("") y no aparecerá en la web.
// =====================================================================

window.PROYECTOS = [
  {
    id: "bori-fontesta",
    tipo: "referencia",
    nombre: "Bori i Fontestà",
    autores: "Meritxell Ribé i Josep Puigdomènech",
    ubicacion: "Barcelona",
    año: 2024,
    tipologia: "Vivienda",
    fotografo: "",
    fuente: "",
    descripcion: "",
    colores: [],
    materiales: [],
    mobiliario: [],
  },
];
