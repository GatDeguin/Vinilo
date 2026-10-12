# SURCO · Vinilo

Tocadiscos 3D interactivo en un HTML autocontenido. Conserva audio local, biblioteca, importación/exportación y la integración oficial de YouTube; el movimiento sigue las acciones reales, no controla la lógica de reproducción.

## Entrega

`index.html` es la aplicación completa. Las fuentes editables están en `src/`; `python3 build.py` vuelve a ensamblar el HTML con los hashes CSP correctos.

`MOTION.md` documenta la evaluación de las 16 técnicas, los contratos de transición y las alternativas reducidas. `VERIFICACION.md` distingue las pruebas ejecutadas de las pendientes.

## Uso

Elegí una funda → extraé el vinilo → colocalo en el plato → bajá la aguja. Hay controles de teclado y alternativas al arrastre. Las tres piezas de Estudio son originales locales, no resultados de YouTube.

La búsqueda textual de YouTube requiere una clave propia restringida a YouTube Data API v3 y al sitio autorizado. La clave se introduce en Ajustes y permanece en memoria, nunca en este repositorio. El reproductor oficial permanece visible; no se extrae ni descarga audio de YouTube.

## GitHub Pages

El sitio se puede publicar desde `main` y la carpeta raíz `/`, en Settings → Pages. La presencia del HTML en el repositorio no implica que Pages esté activado. Para ejecución local: `python3 -m http.server 8000`.

## Verificación

La versión 1.1 elimina bloqueos causados por animaciones, conserva las tarjetas y el foco, admite interrupciones y detiene los bucles de renderizado en reposo. Consultá el informe para el entorno y los resultados concretos. Safari/iPhone físicos, YouTube en vivo y persistencia HTTP siguen requiriendo comprobación en el destino.
