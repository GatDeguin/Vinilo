# SURCO — El arte de escuchar

**Versión 1.1 · HTML único · GitHub Pages · audio local + YouTube**

Una sala de escucha con tocadiscos WebGL2, funda y disco tridimensionales. El gesto principal es elegir una funda, extraer el vinilo, arrastrarlo al plato y bajar la aguja. No es una imagen pre-renderizada. El audio proviene de archivos reales o del reproductor oficial de YouTube.

## Empezar ahora

El archivo `index.html` ya está construido. No necesita npm, compilación, frameworks, CDN ni un servidor de aplicación. Las tres piezas instrumentales de la pestaña **Estudio** están incluidas; no son resultados de YouTube. También podés importar tus propios audios desde **Tus archivos**.

En un navegador de escritorio, abrí el HTML para la experiencia local. Los visores de adjuntos y de la app Archivos de iOS no equivalen a ejecutar un sitio en Safari: para móvil, publicá la página y abrila en el navegador. YouTube requiere conexión y un origen web; no se habilita su reproductor desde `file://`.

**Prueba rápida:** elegí Luz de tarde → Extraer vinilo → arrastrar al plato, o Colocar en el plato → Bajar la aguja. Para devolverlo, usá el botón de expulsión. La escucha empieza por una acción explícita, no al abrir la página.

## Publicación en GitHub Pages

1. Creá o elegí un repositorio para esta app.
2. Subí **solo `index.html` a la raíz**. El resto del ZIP es para desarrollo y auditoría, no es necesario para ejecutar.
3. En **Settings → Pages**, elegí publicación desde una rama, la rama donde subiste el archivo (habitualmente `main`) y la carpeta raíz `/`.
4. Guardá y esperá a que GitHub termine el despliegue. Abrí la dirección HTTPS que indique Pages.

Repositorio de destino: https://github.com/GatDeguin/Vinilo. La publicación del HTML y la activación de GitHub Pages son pasos distintos; verificá el estado de Pages en Settings. El archivo no contiene ninguna clave de YouTube.

Para probar en un servidor local de desarrollo:

```sh
python3 -m http.server 8000
```

Abrí `http://localhost:8000/`. En Windows puede usarse `py -m http.server 8000`.

## YouTube: dos entradas diferentes

### A. Pegar un enlace, sin clave de búsqueda

Usá **Pegar enlace** o pegá un enlace de video en el buscador. Se crea una referencia a ese video, no se descarga su contenido. El título puede completarse cuando el reproductor responda. Se admiten enlaces de videos normales, youtu.be, shorts y live; no se importan canales ni listas completas.

El video debe permitir inserción en otros sitios. Restricciones del propietario, región, edad, anuncios, bloqueadores y políticas del navegador pueden impedir reproducirlo. El reproductor ofrece un enlace para abrirlo en YouTube. La integración real del iframe no pudo comprobarse contra YouTube en el entorno de construcción.

### B. Buscar por artista, álbum o canción

La búsqueda usa **YouTube Data API v3 / search.list**. Necesita una clave de tu propio proyecto:

1. En Google Cloud, creá un proyecto y habilitá **YouTube Data API v3**.
2. Creá una clave API y restringila a **Websites / HTTP referrers**. Para Pages, agregá el origen de tu cuenta, por ejemplo `https://TU-USUARIO.github.io/*`. Si usás dominio propio, autorizá ese dominio. Agregá el origen localhost solo si lo necesitás para desarrollo.
3. Restringí también la clave exclusivamente a **YouTube Data API v3**. Revisá los límites y el uso en la consola de tu proyecto.
4. En SURCO, abrí **Ajustes**, pegá la clave y pulsá **Conectar**. Buscá desde el campo superior.

La clave permanece **solo en la memoria de esa página**. Después de recargar, hay que volver a ingresarla. No se guarda en IndexedDB, localStorage ni backups, ni debe pegarse en el código publicado. No se muestra como validada hasta que una consulta obtenga respuesta.

Las consultas son reales, con paginación, cancelación y errores visibles. Cada resultado crea una funda con la miniatura del video; no se presenta esa miniatura como arte oficial de una edición física. Las tres piezas de Estudio están separadas de los resultados YouTube.

**Para visitantes sin configuración:** esta versión no ofrece búsqueda textual anónima usando una clave secreta del dueño. Una página estática pública no puede ocultar un secreto. Una búsqueda centralizada para todos los visitantes requeriría un backend propio con controles de uso, fuera del requisito de HTML único. No hay scraping ni proxy público no oficial.

## El monitor de YouTube es deliberadamente visible

YouTube se reproduce en su iframe oficial, con controles, marcas, anuncios y restricciones propios. No se oculta el video, no se extrae su audio, no se aplican filtros DSP sobre él y no se ofrecen descargas.

La app pausa YouTube al ocultar la pestaña, abrir un diálogo o dejar el monitor fuera de vista. En pantallas pequeñas puede desplazarse hasta el monitor al empezar. Si el navegador exige otro gesto, pulsá reproducir dentro del propio video.

La experiencia puramente instrumental y sin monitor corresponde a los audios locales. YouTube no está disponible offline. Esta implementación incorpora medidas compatibles con las reglas consultadas, pero no es una auditoría ni certificación oficial de YouTube.

## Controles

- **Escena:** tocar/clicar la funda para extraer; arrastrar el disco desde la posición de extracción al plato; pulsar Start o el brazo para reproducir/pausar cuando está montado.
- **Alternativa accesible:** Extraer → Colocar → Bajar/Levantar la aguja; anterior/siguiente; expulsar; posición, volumen y silencio.
- **Teclado:** Espacio, acción principal; E, devolver a la funda; V, alternar vista; /, buscar. No intercepta escritura en formularios ni diálogos. Los controles también funcionan con Tab y Enter/Espacio.
- **Cámara:** vista de escucha o cenital.
- **33⅓ / 45:** cambia exclusivamente la velocidad visual del plato. No cambia la afinación ni la velocidad de reproducción.
- **Ajustes:** calidad equilibrada, alta o ahorro; movimiento reducido. La preferencia de movimiento reducido del sistema se respeta.

El brazo sigue el progreso y el giro responde al estado real de reproducción. El osciloscopio y medidor dBFS muestran la señal de los archivos locales; no simulan una medición de YouTube.

## Colección y copias

El botón de marcador guarda una referencia o la pieza seleccionada en **Mi colección**. Importar un audio lo incorpora a la colección. IndexedDB almacena los registros y los bytes de archivos locales; localStorage guarda preferencias, nunca la clave.

El almacenamiento del navegador no es una garantía de archivo permanente. Puede estar deshabilitado, llenarse o borrarse. Ante un fallo, SURCO conserva lo posible durante la sesión y lo advierte. Exportá antes de cerrar.

**Exportar colección** genera un `.surco.json` con esquema versionado, referencias a YouTube y bytes base64 de los audios locales. No exporta audio/video de YouTube ni credenciales. **Importar una copia** valida el paquete y combina sus registros con los existentes. Si IndexedDB está disponible, la escritura se realiza en una transacción; sin almacenamiento, restaura en memoria y avisa que dura solo esa sesión.

Límites: 150 registros; 30 MiB por audio; 100 MiB de audio total por backup (aproximadamente 133 MiB al codificar base64, más metadatos). El importador limita el archivo codificado a 135 MiB. Formatos como MP3/WAV/M4A/OGG/FLAC/AAC dependen de los decodificadores del navegador. Se muestra un error si el audio no puede reproducirse.

Los metadatos guardados de YouTube se invalidan tras 28 días al reabrir el almacenamiento; se conserva la referencia al video. No se guardan copias offline de los videos o sus miniaturas.

## Arquitectura y fuentes

```text
index.html                 Entrega autocontenida, ya construida
build.py                   Ensamble y cálculo de hashes CSP
src/shell.html             Estructura semántica y diálogos
src/style.css              Diseño responsive, estados, reducción de movimiento
src/core.js                Validación, contratos y transiciones puras
src/render.js              WebGL2, geometría, materiales, sombras, interacción
src/app.js                 Estado, audio, YouTube, biblioteca y almacenamiento
assets/*.mp3               Tres estudios originales incluidos
assets/generate_audio.py   Generador reproducible de las piezas
VERIFICACION.md            Qué se probó y qué queda por comprobar
tests/                     Pruebas y evidencia
```

El motor 3D utiliza geometría procedural, superficies metálicas y de nogal, surcos del disco, sombreado físicamente inspirado y mapas de sombra. No utiliza fotografías, ray tracing, modelos GLB externos ni una biblioteca remota. No se afirma fotorealismo de referencia cinematográfica ni se prometen 60 FPS en cualquier dispositivo. Hay una vista compatible 2D ante falta de WebGL2 o pérdida de contexto; los controles y la escucha local permanecen disponibles.

No se añadió Rust/WASM: no hay aquí un cálculo masivo que justifique su complejidad. No hay backend, autenticación, sincronización cloud, IA ni PWA instalable. Abrir un HTML no garantiza caché offline del sitio publicado; el archivo autocontenido permite disponer de sus recursos locales sin red cuando se ejecuta en un navegador compatible.

## Modificar y reconstruir

Editá `src/`, no el HTML ensamblado. Ejecutá:

```sh
python3 build.py
```

El build solo necesita la biblioteca estándar de Python y los MP3 ya incluidos. Recalcula los hashes CSP de los cuatro scripts. **Editar un script dentro del HTML final sin actualizar sus hashes hará que el navegador lo bloquee.**

Para regenerar opcionalmente los audios se necesitan NumPy y ffmpeg con codificador libmp3lame:

```sh
python3 assets/generate_audio.py
python3 build.py
```

Las composiciones son instrumentales algorítmicas originales para esta app, sin muestras de terceros. Las duraciones son aproximadamente 36,36 s (Luz de tarde), 39,97 s (La hora azul) y 32,05 s (Órbita).

## Pruebas reproducibles

```sh
node --test tests/core.test.cjs tests/motion.test.cjs
python3 tests/static_checks.py
python3 -m pip install playwright
python3 -m playwright install chromium
python3 tests/browser_checks.py --suite media --memory
python3 tests/browser_checks.py --suite search --memory
python3 tests/browser_checks.py --suite render --memory
python3 tests/browser_checks.py --suite motion --memory
python3 tests/browser_checks.py --suite mobile --memory
```

`static_checks.py` también utiliza Node y ffmpeg. Las suites de render, motion y mobile abren Chromium con ventana y necesitan un escritorio o Xvfb en Linux; usan SwiftShader como GPU de software. `--browser /ruta/al/chromium` permite elegir el ejecutable. La suite de búsqueda introduce respuestas de prueba controladas; no valida una consulta real a YouTube.

Para comprobar persistencia desde un origen HTTP real, iniciá el servidor local y ejecutá:

```sh
python3 tests/browser_checks.py --suite persistence --url http://localhost:8000/
```

La prueba de exportación intercepta el Blob JSON y verifica sus bytes, suprimiendo el clic de descarga al sistema operativo. La descarga efectiva y el comportamiento del selector de archivos deben verificarse también en el navegador y dispositivo de destino.

## Referencias oficiales consultadas

- YouTube Data API: https://developers.google.com/youtube/v3/getting-started
- Búsqueda: https://developers.google.com/youtube/v3/docs/search/list
- Reproductor: https://developers.google.com/youtube/iframe_api_reference
- Políticas: https://developers.google.com/youtube/terms/developer-policies
- Funcionalidad mínima: https://developers.google.com/youtube/terms/required-minimum-functionality
- Claves API: https://docs.cloud.google.com/docs/authentication/api-keys-best-practices
- Publicación: https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site

YouTube y los contenidos de terceros pertenecen a sus respectivos titulares. SURCO no está afiliado con YouTube, Google ni GitHub.

## Movimiento semántico 1.1

Leé [MOTION.md](MOTION.md) para la matriz de 16 técnicas, contratos, tokens, interrupciones y reducción. Las fuentes siguen ensamblándose en un solo HTML. Las acciones no esperan al efecto; la biblioteca conserva identidad y foco; el renderer y la señal dejan de solicitar frames cuando no son necesarios.

Pruebas adicionales (Linux con Xvfb, Playwright y Chromium):

```sh
xvfb-run -a python3 tests/motion-contracts.py after
xvfb-run -a python3 tests/visual-motion.py
```

Estas pruebas usan un documento en memoria por las restricciones del entorno original; no verifican IndexedDB entre recargas HTTP. Los resultados remotos de reconstrucción en CI, cuando estén presentes, se identifican aparte de la evidencia local.
