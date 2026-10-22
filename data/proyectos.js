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
  {
    id: "piso-barceloneta",
    tipo: "referencia",
    nombre: "Piso Barceloneta",
    autores: "Isern Serra",
    ubicacion: "Barcelona",
    año: "",
    tipologia: "Vivienda",
    fotografo: "Salva López",
    fuente: "https://www.isernserra.com/es/projects/piso-barceloneta",
    descripcion: "Un piso en la Barceloneta pensado como una galería habitable de diseño coleccionable. Al eliminar las divisiones, la sala, la cocina y el comedor forman un único espacio abierto al balcón, y los dormitorios y baños se agrupan junto a la entrada. El microcemento continuo en suelos y paredes, la cocina de roble natural y un sofá de hormigón integrado crean una base mediterránea serena, en la que conviven piezas vintage y contemporáneas. Como contrapunto, el baño se reviste por completo de microcemento verde oscuro.",
    colores: [],
    materiales: ["microcemento-beige", "roble-natural", "hormigon", "lino-natural", "aluminio-encerado", "microcemento-verde-oscuro", "bloque-vidrio"],
    mobiliario: ["mesa-fusteria-vidal", "lampara-sisisi", "silla-markelius", "silla-quadra", "section-coffee-table", "silla-dr-sonderbar", "lampara-falkland", "fragile-lamp", "l4-stool", "lampara-j45", "lampara-vis-a-vis", "lampara-lotek", "taburetes-vintage-60"],
  },
];
