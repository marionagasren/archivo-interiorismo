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
  {
    id: "mimoses",
    tipo: "propio",
    nombre: "Mimoses",
    autores: "341 Studio",
    ubicacion: "Sant Vicenç de Montalt",
    año: 2026,
    tipologia: "",
    fotografo: "",
    fuente: "",
    descripcion: "",
    colores: [],
    materiales: ["microcemento-beige", "azulejo-verde-esmaltado"],
    mobiliario: [],
  },
  {
    id: "montpellier-ii",
    encuadre: "59% 53%",
    tipo: "referencia",
    nombre: "Montpellier II",
    autores: "Vives St-Laurent · ATA Architecture",
    ubicacion: "Saint-Bruno, Quebec (Canadá)",
    año: 2024,
    tipologia: "Vivienda",
    fotografo: "Alex Lesage",
    fuente: "https://vivesstlaurent.com/en/montpellier2/",
    descripcion: "Una casa de tres plantas al pie del monte Saint-Bruno, en las afueras de Montreal, rodeada de bosque y pensada como un lugar de refugio y contemplación. La planta jardín se encaja en la pendiente del terreno y, frente a las casas de los años sesenta del barrio, el proyecto se adapta al desnivel del lugar. El interior se organiza alrededor de un patio, con recorridos fluidos y mucha luz natural, y la fachada trasera, completamente acristalada, abre la zona de día hacia el bosque.",
    colores: [],
    materiales: ["roble-natural", "roble-tenido-oscuro", "ceramica-terracota-esmaltada", "ceramica-opus-incertum", "piedra-veteada-clara", "piedra-gris-tipo-ceppo", "lino-natural", "lana-pelo-largo"],
    mobiliario: ["tekio-circular", "tekio-horizontal", "mesa-essai-mobilier"],
  },
  {
    id: "bori-fontesta",
    encuadre: "39% 54%",
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
