# 341 Studio

Web de 341 Studio: archivo de proyectos de interiorismo de referencia y, más adelante, porfolio de los proyectos del estudio. Cada proyecto se presenta con sus fotos, sus planos y un moodboard de colores, materiales y mobiliario. A partir de ellos se forma una biblioteca compartida y un generador de paletas.

Para ver la web, abre `index.html` en el navegador. El logo del estudio se pone en `img/logo.svg` (o `img/logo.png`); mientras no exista, la portada muestra un logo provisional de texto.

## Estructura

```
index.html            contenido y estructura
style.css             diseño
script.js             comportamiento (vistas, moodboard, biblioteca)
generador.js          generador de moodboards (editor con plantillas)
publicar.js           formulario «Nuevo proyecto» para publicar desde la web
data/
  proyectos.js        información de cada proyecto (se edita a mano)
  biblioteca.js       materiales y mobiliario (se edita a mano)
  plantillas.js       plantillas del generador de moodboards
  auto.js             fotos, planos y colores (GENERADO automáticamente)
img/
  proyectos/<id>/     foto-01.jpg, foto-02.jpg... plano-01.png... info.txt
  materiales/         texturas de la biblioteca de materiales
  mobiliario/         imágenes de la biblioteca de mobiliario
herramientas/
  extraer_colores.py  extrae los colores de las fotos y busca el RAL más cercano
  colores-ral.json    referencia de colores RAL Classic y RAL Design
```

## Añadir un proyecto

**Desde la web:** en Proyectos, pulsa **Publicar proyecto**, rellena la información, añade las fotos, elige la portada y pulsa Publicar. La primera vez pide una clave de GitHub (*fine-grained token* con acceso solo a este repositorio y permiso *Contents: Read and write*), que se guarda únicamente en ese navegador. Solo el nombre es obligatorio: sin fotos, el proyecto se muestra con una imagen provisional (fondo liso con el logo). Para añadir las fotos o cambiar datos más tarde, abre el proyecto y pulsa **Editar proyecto**. El formulario (`publicar.js`) sube las fotos a `img/proyectos/<id>/`, añade el proyecto a `data/proyectos.js` y, en unos minutos, GitHub extrae los colores y actualiza la web.

**Orden y encuadre:** en Proyectos, **Editar cuadrícula** permite arrastrar las tarjetas para cambiar el orden y hacer clic en cada foto para elegir qué parte se ve. Al guardar se reordena `data/proyectos.js` y se añade `encuadre: "x% y%"` a los proyectos cuyo encuadre no es el centro.

**A mano:**

1. Crea la carpeta `img/proyectos/<id>/` y sube las fotos como `foto-01.jpg`, `foto-02.jpg`... (la 01 es la portada) y, si los hay, los planos como `plano-01.png`.
2. Añade el proyecto en `data/proyectos.js` con el mismo `id` que la carpeta y `tipo: "referencia"` o `tipo: "propio"`.
3. Los colores se extraen solos: al subir fotos, GitHub ejecuta `herramientas/extraer_colores.py` y actualiza `data/auto.js` (ver la pestaña *Actions*). También se puede ejecutar a mano con `python3 herramientas/extraer_colores.py`.

## Créditos

Lista de colores RAL de [ral-colors](https://github.com/ieskudero/ral-colors) (licencia MIT, ver `herramientas/colores-ral-LICENSE.txt`). Los valores hex de los colores RAL son aproximaciones de pantalla. Las imágenes de los proyectos pertenecen a sus autores.
