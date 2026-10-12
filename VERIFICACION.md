# SURCO 1.1 · Verificación de implementación y movimiento

## Estado

La app local está implementada y verificada en los escenarios que siguen. No se certifica compatibilidad universal, conformidad WCAG completa ni funcionamiento de YouTube en vivo. La fuente original de reproducción y el formato de datos se conservaron.

Artefacto local: `index.html`, **1.870.908 bytes**.

SHA-256 local:

```
60583bc04ae8d58c7a0f078daaf592bb270658277e13a7d077224bc50f42ed2c
```

Si CI regenera los tres MP3 con otra versión de ffmpeg, el HTML remoto puede tener otro hash aun con las mismas fuentes. El hash de cada reconstrucción remota se registra por separado en `evidence/ci-integrity.json`; no se presenta la verificación del archivo local como identidad binaria con ese resultado.

## Entorno y ejecución

Cierre local: 11 de octubre de 2026, por la noche, Argentina (UTC−03). Chromium **144.0.7559.96**, Python 3.13, Node 22, Playwright, Linux/Xvfb y **SwiftShader, GPU por software**. Vistas de escritorio 1280×960 y 1280×1400; móvil 390×844 con emulación. No se probó hardware de iPhone.

Los documentos se cargaron en memoria (`page.set_content`). La navegación HTTP de este entorno fue rechazada por la política administrativa del navegador; no se eludió. Por lo tanto, estas comprobaciones no demuestran persistencia de IndexedDB tras recargar una URL real.

## Resultados ejecutados

**20 pruebas unitarias aprobadas y 61 comprobaciones de navegador aprobadas.** El log de la última ejecución integral está en `evidence/final-validation.log` dentro del paquete descargable. Los JSON individuales son la evidencia portable en el repositorio.

| Grupo | Resultado | Qué se observó |
|---|---:|---|
| Núcleo original | 9/9 | Validación de URLs, campos, tiempos, transiciones y paquetes de datos |
| Política de movimiento y regresiones de renderer | 11/11 | Resorte analítico, composición temporal, retarget, reposo, cancelación WAAPI, limpieza, arrastre reducido/suspendido |
| Media | 17/17 | Reproducción local offline, archivos reales, pausa/volumen/seek, exportación con bytes y restauración |
| Search | 9/9 | Contrato de API con fixtures controlados, paginación, errores, XSS y olvido de clave |
| Render | 5/5 | WebGL2, arrastre por puntero real, vínculo con audio y cámara |
| Mobile | 5/5 | Vista 390 px, sin overflow horizontal de página, reducción, diálogo y Escape |
| Motion original | 4/4 | Recorrido normal, cambio de píxeles, fallo GPU y continuidad del audio |
| Contratos nuevos | 15/15 | Interrupciones, veinte ciclos, foco/identidad, preferencias en ambas direcciones, resize, gesto cancelado y reposo |
| Inspección visual y ciclo GPU | 6/6 | Clon real inerte a mitad, cancelación, escena sonando, contexto perdido/restaurado, ocho listeners antes/después y limpieza |

Las capturas `shared-midpoint.png`, `extracted.png`, `playing.png` y `motion-mobile.png` fueron realmente abiertas e inspeccionadas durante el trabajo. El punto intermedio del shared element se obtuvo pausando su animación WAAPI real, no dibujando una imagen de concepto. La captura móvil conserva los controles alternativos DOM; la escena es una composición recortada de cerca en pantallas estrechas, no una certificación de encuadre de todos los elementos 3D en cada proporción.

### Integridad estática

99 identificadores HTML únicos; cuatro scripts con sintaxis válida y hashes CSP correctos; tres MP3 decodificados enteros mediante ffmpeg; cero scripts/hojas de estilo externos al arrancar; sin claves de prueba ni fixtures en el HTML de producción. La integración remota de YouTube sólo se solicita al usarla o cargar sus referencias.

### Medición antes/después

Misma máquina, navegador y viewport, sin reproducción ni transición activa. Instrumentación de requestAnimationFrame:

| Medición en aproximadamente 1,2 segundos de reposo | Antes | Después, última ejecución |
|---|---:|---:|
| Callbacks ejecutados | 288 | 0 |
| Solicitudes pendientes | 2 | 0 |
| Ventana de observación | 1,203 s | 1,208 s |

No equivale a una medición de FPS, potencia de GPU, latencia o batería. Durante reproducción/gesto hay trabajo legítimo; el objetivo es retirarlo cuando ya no es necesario. También se comprobó reposo después de la prueba de estrés y reproducción.

## Fallos corregidos, con regresión

La batería se escribió y ejecutó antes de las correcciones. Reprodujo el bloqueo por temporizadores de extracción/colocación, la pérdida del nodo/foco de tarjeta y la actividad rAF en reposo (`evidence/baseline.json`). Las pruebas del nuevo módulo fallaron antes de existir (`motion-red.txt` en el paquete). Más tarde, dos casos reprodujeron el disco desplazado al reducir/suspender un arrastre (`drag-red.txt`); la corrección fija su pose canónica y libera el gesto. Las pruebas finales pasan sin cambiar el resultado de dominio.

Se retiró el blur de fondo innecesario; se evitó superponer la antigua rotación/traslado de hover al nuevo énfasis. Los conectores de pasos reflejan ubicación real del disco, no progreso ficticio de red.

## Límites explícitos

**YouTube real:** no hubo clave válida ni validación de reproducción del servicio. Los resultados de Search son fixtures de prueba declarados. El sitio sigue necesitando conexión, autorización de inserción del video y una clave propia para buscar texto. El video permanece visible; no se extrae ni descarga audio.

**Persistencia HTTP y descarga al sistema operativo:** no verificadas en este entorno. Sí se verificaron datos del Blob exportado, bytes del audio y restauración en un documento nuevo, además del aviso de almacenamiento no disponible. La prueba de descarga no confirma que el navegador guardó un archivo físico.

**Compatibilidad:** no se ejecutó Safari, Firefox, un iPhone/Android físico ni una GPU real. No se certifican todos los códecs, lectores de pantalla, precisión táctil o ahorro energético. El diseño móvil y la interacción por puntero probados no sustituyen dichas pruebas.

**Publicación:** los resultados de GitHub Actions son independientes de las pruebas de navegador locales. El workflow ejecuta las 20 unitarias y las comprobaciones de integridad, no simula haber repetido la batería visual. Comprobar `index.html` en GitHub no implica que GitHub Pages haya sido activado; ese estado debe verificarse en la configuración del repositorio.

## Reproducir

```sh
python3 build.py
node --test tests/core.test.cjs tests/motion.test.cjs
python3 tests/static_checks.py
python3 -m pip install playwright
python3 -m playwright install chromium
# En Linux con Chromium en /usr/bin/chromium y Xvfb:
for suite in media search render mobile motion; do
  xvfb-run -a python3 tests/browser_checks.py --suite "$suite" --memory --browser /usr/bin/chromium
done
xvfb-run -a python3 tests/motion-contracts.py after
xvfb-run -a python3 tests/visual-motion.py
```

Para verificar persistencia desde un navegador que permita HTTP, iniciar `python3 -m http.server 8000` y ejecutar la suite `persistence --url http://localhost:8000/`. Esto sigue siendo una comprobación pendiente, no un resultado aprobado.
