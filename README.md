# Archivo de interiorismo

Archivo personal de proyectos de interiorismo. Cada proyecto se presenta con sus fotos, sus planos y un moodboard de colores, materiales y mobiliario. A partir de ellos se forma una biblioteca compartida y un generador de paletas.

Para ver la web, abre `index.html` en el navegador.

## Estructura

```
index.html            contenido y estructura
style.css             diseño
script.js             comportamiento (vistas, moodboard, biblioteca, generador)
data/
  proyectos.js        información de cada proyecto (se edita a mano)
  biblioteca.js       materiales y mobiliario (se edita a mano)
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

1. Crea la carpeta `img/proyectos/<id>/` y sube las fotos como `foto-01.jpg`, `foto-02.jpg`... (la 01 es la portada) y, si los hay, los planos como `plano-01.png`.
2. Añade el proyecto en `data/proyectos.js` con el mismo `id` que la carpeta.
3. Los colores se extraen solos: al subir fotos, GitHub ejecuta `herramientas/extraer_colores.py` y actualiza `data/auto.js` (ver la pestaña *Actions*). También se puede ejecutar a mano con `python3 herramientas/extraer_colores.py`.

## Créditos

Lista de colores RAL de [ral-colors](https://github.com/ieskudero/ral-colors) (licencia MIT, ver `herramientas/colores-ral-LICENSE.txt`). Los valores hex de los colores RAL son aproximaciones de pantalla. Las imágenes de los proyectos pertenecen a sus autores.
