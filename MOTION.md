# SURCO 1.1 · Movimiento que explica la escucha

## Diagnóstico y alcance

Se trabajó sobre las fuentes efectivas de SURCO 1.0: JavaScript sin framework, WebGL2 procedural, audio HTML/Web Audio, biblioteca DOM, IndexedDB y reproductor oficial de YouTube. Se conserva su diseño crema, nogal y aluminio, su estructura y todos sus modos de escucha. No se reemplazó el renderer ni se añadió una biblioteca de animación.

La inspección y las regresiones reprodujeron tres fallos: la extracción/colocación bloqueaba otras acciones mediante tiempos de presentación; reconstruir toda la biblioteca destruía la identidad DOM y el foco; dos bucles requestAnimationFrame seguían trabajando en reposo. También se corrigió un caso de cancelación del arrastre que dejaba el disco desplazado al activar movimiento reducido.

**Estado de dominio:** selección, ubicación solicitada del disco, fuente, preparación, reproducción, colección y errores. **Estado de interfaz:** pestaña, diálogos, foco y vista. **Presentación:** posiciones interpoladas, velocidad visual, cámara y animaciones DOM. La presentación nunca confirma la carga de un audio ni decide que un guardado terminó.

## Mapa semántico

| Intención → acción | Cambio real inmediato | Respuesta perceptible → reposo | Siguiente acción |
|---|---|---|---|
| Escuchar una pieza → elegir funda | Cambia la selección; se detiene la fuente anterior | La misma carátula pasa de biblioteca a funda; título actualizado → disco en funda | Extraer |
| Manipular → extraer | Ubicación solicitada: extraído | El disco rígido sale de la funda → posición de mano | Arrastrar o colocar |
| Preparar → colocar | Ubicación: plato; preparación del medio comienza ahora | Traslado del mismo disco → plato; disponibilidad refleja la carga real | Bajar aguja cuando esté preparado |
| Escuchar → bajar aguja | Se solicita reproducir; el evento del medio confirma reproducción | Brazo/giro responden al medio; señal local auténtica → escucha | Pausar, buscar posición o expulsar |
| Cambiar de pieza → expulsar/elegir otra | Audio anterior detenido; época de carga invalidada | Retorno desde la posición actual o sustitución coherente → funda | Extraer otra pieza |
| Explorar → resultados/colección | Nueva lista de datos con claves estables | Sólo nuevas fundas entran; las existentes se recolocan → foco recuperable | Elegir |
| Configurar → abrir/cerrar diálogo | Apertura/cierre nativo y foco | Entrada breve del contenido → formulario legible | Confirmar o cerrar |
| Reducir movimiento/ocultar → preferencia/visibilidad | La lógica conserva su estado | Se cancelan efectos, se fijan destinos y se suspenden bucles no necesarios | Continuar sin animación |

Permanecen quietos el buscador, la jerarquía de títulos, las áreas de los botones y el plato. La cámara sólo cambia de vista mediante la intención explícita ya existente; no se añadió un tour, una ruta o una introducción automática. La pequeña respuesta de escena al puntero se conserva únicamente sin reducción de movimiento.

## Matriz obligatoria de las 16 técnicas

| Técnica | Decisión y ubicación | Necesidad / beneficio | Riesgo principal | Alternativa reducida | Verificación |
|---|---|---|---|---|---|
| Morph | Omitir | El disco y la funda son objetos rígidos; deformarlos confundiría su identidad | Estirar carátulas y atribuir una transformación inexistente | Cambio directo | Inspección de geometría y capturas |
| Stagger | Aplicar: tarjetas nuevas visibles | Comunicar que un grupo de resultados se incorporó, sin reintroducir toda la biblioteca | Esperas y foco en controles invisibles | Lista completa inmediata | Claves/foco conservados; 30 ms, máximo 150 ms; opacidad inicial 0,5 y cancelación al interactuar |
| Spring | Aplicar: cámara y retorno de arrastre inválido | Asentar una manipulación y conservar velocidad al cambiar destino | Oscilaciones persistentes o dependientes del refresco | Posición final directa | Solución analítica críticamente amortiguada, tests de composición/retarget/estabilidad y cancelación real de arrastre |
| Easing | Aplicar: traslados rígidos y respuestas DOM | Distinguir llegada de seguimiento directo | Retrasar acciones o falsear tiempos/medidas | Cambio inmediato | Extracción/colocación consecutivas sin bloqueo; RPM visual constante y seek real sin interpolar datos |
| Crossfade | Adaptar: entrada de título/etiqueta y diálogo | Señalar una sustitución dentro del mismo contexto | Doble lectura o estados interactivos superpuestos | Texto final inmediato | Entrada de opacidad 0,55→1, sin clon de texto; no es mezcla de dos capas ni crossfade de audio |
| Shared element | Aplicar: carátula de tarjeta → funda 3D | Reconocer qué disco fue elegido y conectar biblioteca con escena | Duplicación interactiva, origen fuera de vista, clon huérfano | Actualización directa | Clon real inerte y aria-hidden; cancelación al extraer/seleccionar/scroll/resize; captura intermedia y ausencia de clones al acabar |
| Magnification | Aplicar: arte dentro de tarjeta | Facilitar reconocimiento al señalar o enfocar sin mover el objetivo | Temblor y colisiones entre botones | Borde de foco/estado sin escala | Área del botón estable; escala máxima 1,035; hover sólo puntero fino, foco y respuesta táctil |
| Blur | Omitir; retirado del fondo de diálogo | Un fondo atenuado sólido separa suficientemente el contexto | Coste de superficie grande y pérdida de legibilidad | Misma atenuación sólida | Revisión CSS y apertura/cierre repetidos |
| Mask | Omitir | La oclusión física ya representa el disco dentro de la funda | Duplicar una explicación y ocultar contenido esencial | Contenido accesible completo | Sin máscara animada añadida; no se presenta la oclusión 3D como CSS mask |
| Variable font | Omitir | No existe una fuente variable autorizada en el proyecto que necesite animación | Variación ficticia, saltos de texto y distribución de fuentes no autorizadas | Tipografía estática original | Sin fuentes añadidas ni ejes inventados |
| Layout animation | Aplicar: biblioteca con claves kind:id | Mantener orientación al cambiar posiciones de entidades existentes | Geometría obsoleta y foco perdido | Layout final inmediato | FLIP sólo de traslación, cancela transformaciones antes de medir destino; conservación de nodo y foco |
| Clip path | Omitir | No hay una nueva región que requiera revelado geométrico | Recortar foco/controles y duplicar oclusión de la escena | Estado completo | Revisión de componentes y estilos |
| Path morph | Omitir | No hay dos geometrías de datos o trayectorias relacionadas que deban transformarse | Inventar correspondencias y mediciones intermedias | Actualización directa | Sin interpolación de curvas de señal ni datos |
| Stroke draw | Aplicar: conectores existentes Elegí/Extraé/Escuchá | Mostrar qué relación del recorrido acaba de completarse | Apariencia de progreso de carga ficticio | Trazo final + texto del estado | SVG pathLength=1; trazo deriva del estado de ubicación, no de un temporizador de carga |
| Perspective | Adaptar: renderer 3D y dos vistas existentes | Comunicar orientación del objeto manipulable | Mareo, cámara involuntaria y pérdida de interacción | Cámara directa sin transición; vista 2D ante ausencia/fallo de WebGL | Cambio/reversión de cámara, resize y context loss/restore; audio continúa |
| Particles | Omitir | La escucha no requiere representar un proceso colectivo | Fondo permanente, consumo y celebración ajena al producto | Estado/texto existentes | Sin emisor ni bucle de partículas |

En shared element el traslado DOM usa rectángulos proyectados de origen/destino: no es una deformación proyectiva exacta de la textura sobre el plano 3D. Si el origen o el destino no son visibles, se omite el vuelo; no se inventa una posición de partida.

## Gramática y tokens

`src/motion.js` es el único propietario de los tokens compartidos y las animaciones DOM. `src/render.js` posee las transformaciones de la escena. El dominio no espera a ninguno.

| Intención | Valor |
|---|---|
| Confirmación / control | 110 / 180 ms |
| Cambio cercano / carátula compartida | 280 / 380 ms |
| Extraer / colocar / devolver | 420 / 520 / 380 ms |
| Escalonamiento | 30 ms; tope acumulado 150 ms |
| Entrada de tarjetas | 10 px; sólo visibles y nuevas |
| Magnificación | 1,035; área interactiva estable |
| Curva DOM | cubic-bezier(.22,.68,.18,1) |
| Resorte | amortiguación crítica; omega=18 s⁻¹ |
| Reposo del resorte | error <0,0002 y velocidad <0,002 en unidades de la propiedad |
| Movimiento reducido | 0 ms para traslados/cámara; sin giro decorativo ni onda animada |

La solución del resorte es analítica: para desplazamiento d=x−objetivo, b=v+ωd y e=exp(−ωdt), x'=objetivo+(d+b·dt)e y v'=(v−ωb·dt)e. No se añade easing sobre ese resorte. El puntero sigue directamente el gesto; sólo su retorno/soltado se asienta. Al suspender una escena se cancela su gesto de forma coherente, sin integrar un salto temporal enorme al volver.

## Contratos de transición

### 1. Selección y carátula compartida

**Identidad/propósito:** clave kind:id del mismo disco desde tarjeta hasta funda. **Condiciones:** resultado válido, tarjeta/funda visibles, movimiento permitido; la selección de la misma pieza conserva reproducción. **Resultado:** la selección ya es la nueva antes del efecto; hay exactamente una entidad interactiva por tarjeta y ningún clon accesible. **Geometría:** rectángulo de imagen DOM a caja proyectada de la funda; la funda de destino se oculta sólo durante el clon visual. **Tiempo:** 380 ms, curva compartida. **Interrupción:** elegir otra, extraer, scroll, resize, reducir o suspender cancela y restaura la funda; última selección válida conserva el dominio. **Interacción:** botones existentes activos; clon inert, aria-hidden y sin punteros. **Adaptación:** sin origen visible o WAAPI, actualización inmediata. **Ciclo de vida:** Director posee la promesa y limpieza; resolve en final, cancelación o fallback. **Evidencia:** visual-motion.py captura WAAPI a mitad y luego extrae; verifica clon eliminado y funda restaurada.

### 2. Extraer, montar y devolver

**Identidad/propósito:** mismo disco rígido en tres ubicaciones. **Condiciones:** acción de dominio permitida por la ubicación solicitada actual; no por un booleano de animación. **Resultado:** estado y controles se actualizan ahora; montar inicia la preparación real; expulsar detiene el audio y descarta cargas anteriores. **Geometría:** posición/ángulo actuales a destino canónico, con recorrido de extracción/colocación y giro angular corto. **Tiempo:** 420/520/380 ms. **Interrupción:** reemplazo desde posición actual; al reproducir antes del asentamiento se finaliza la pose visual, sin retrasar el audio. **Interacción:** acción principal disponible según el dominio y carga real; foco estable. **Adaptación:** teclado/botones equivalentes; reducción fija destino inmediatamente. **Ciclo de vida:** un movimiento propiedad del renderer; la época del medio protege las operaciones asíncronas antiguas. **Evidencia:** prueba de comandos consecutivos, inversión y veinte ciclos; estado normal/reducido equivalente.

### 3. Arrastre y retorno

**Identidad/propósito:** disco extraído sigue la mano y reconoce el plato válido. **Condiciones:** puntero primario capturado sobre objeto manipulable; un único gesto. **Resultado:** soltar sobre plato monta; fuera de él permanece extraído. **Geometría:** plano de interacción de escena; retorno al destino canónico. **Tiempo:** seguimiento directo; resorte crítico sólo al volver. **Interrupción:** pointercancel, lostpointercapture, blur, cambio de cámara, suspensión o reducción liberan captura; no dejan un disco fuera de ubicación. **Interacción:** gesto directo y botones alternativos. **Adaptación:** reducción omite retorno animado, no la tarea. **Ciclo de vida:** gesto y resorte pertenecen al renderer; listeners con AbortController. **Evidencia:** arrastre con puntero real; prueba RED/GREEN del arrastre suspendido y cambio de preferencia a mitad.

### 4. Reproducción y pausa

**Identidad/propósito:** disco y brazo representan reproducción auténtica. **Condiciones:** medio preparado y permiso de reproducción del navegador; el evento del medio confirma playing. **Resultado:** audio, tiempo, brazo y señal coinciden; pausa/expulsión no esperan una animación. **Geometría:** giro en eje real del disco, brazo según progreso; curva de señal calculada del audio local. **Tiempo:** RPM visual constante, distinta del playbackRate; asentamientos finitos de giro/brazo. **Interrupción:** cambio/pausa/error actualizan dominio y visual; no se convierte el final del tween en evento de medio. **Interacción:** volumen/seek/pausa existentes; sin audio de interfaz añadido. **Adaptación:** reducción conserva audio y tiempo, con disco/onda estáticos y dB real; YouTube no tiene señal DSP simulada. **Ciclo de vida:** renderer y scope sólo solicitan frames cuando los necesitan; reloj de YouTube sólo mientras reproduce y es visible. **Evidencia:** suites media/render/motion; audio continúa durante pérdida deliberada de WebGL.

### 5. Biblioteca

**Identidad/propósito:** claves kind:id conservadas entre actualizaciones. **Condiciones:** lista de registros validada; no duplicación de claves. **Resultado:** tarjetas reutilizadas, selección y foco coherentes. **Geometría:** lecturas iniciales, actualización DOM, cancelación de transformaciones y medición final; FLIP sólo de traslación. **Tiempo:** 280 ms; incorporaciones 30 ms con máximo 150. **Interrupción:** nueva lista redirige; foco/puntero cancela entrada; borrar elemento limpia su animación. **Interacción:** tarjetas nunca completamente transparentes/invisibles; arte magnificado dentro de botón estable. **Adaptación:** tacto/foco; layout inmediato con reducción. **Ciclo de vida:** registro Director por clave, sin temporizadores dispersos. **Evidencia:** igualdad del nodo antes/después y foco conservado; resultados de búsqueda controlados y lista sin reintroducción innecesaria.

### 6. Cámara

**Identidad/propósito:** mismo equipo desde escucha/cenital. **Condiciones:** botón V o control existente; no cambio implícito de navegación. **Resultado:** cámara alcanza vista solicitada, dominio de audio intacto. **Geometría:** elevación/yaw limitados a las dos vistas originales. **Tiempo:** resorte crítico, criterio explícito de reposo. **Interrupción:** nueva vista conserva posición/velocidad; reducción finaliza destino y cancela gesto. **Interacción:** controles DOM quietos. **Adaptación:** reducción sin viaje; fallback 2D operativo. **Ciclo de vida:** un rAF del renderer, suspendido al reposar/ocultar. **Evidencia:** inversión rápida, preferencia a mitad, resize, pérdida/restauración de contexto sin duplicar los ocho listeners del canvas.

### 7. Diálogo, texto y conectores

**Identidad/propósito:** acceso a configuración/ayuda ya existentes; texto informa estado real. **Condiciones:** diálogo nativo; contenido de dominio calculado antes de presentarlo. **Resultado:** foco nativo recuperable y una sola copia interactiva. **Geometría:** opacidad local; fondo atenuado sólido; conectores SVG normalizados en su espacio original. **Tiempo:** entrada de contenido 180 ms, trazo 280 ms. **Interrupción:** cerrar cancela sin depender de animationend; actualizar texto reemplaza su entrada. **Interacción:** Escape y formularios nativos; no bloqueo por opacidad. **Adaptación:** misma información sin efectos. **Ciclo de vida:** close cancela Director; sin clones de texto. **Evidencia:** veinte aperturas/cierres y Escape; ningún proceso huérfano al reposo final.

## Orquestación, preferencias y limpieza

Se usan CSS para estados locales, WAAPI para efectos cancelables y el renderer existente para escena. No hay un framework nuevo. Cada ejecución Director resuelve su resultado incluso cuando animation.finished rechaza por cancelación. Cancelar un efecto nunca pierde una operación de colección.

La preferencia efectiva es sistema OR elección manual. Se escuchan cambios del sistema en ambas direcciones y se guarda sólo la elección manual, evitando convertir una preferencia temporal del sistema en un ajuste permanente. Scroll/resize eliminan clones geométricamente obsoletos. Al ocultar pestaña/escena se suspende el trabajo visual; al volver se solicita sólo el necesario. Al destruir el renderer se liberan observadores, listeners y recursos GPU.

## Presupuesto y evidencia

Objetivo verificable: cero callbacks requestAnimationFrame en reposo visual, sin reproducción ni transición. La referencia previa midió 288 callbacks y dos solicitudes pendientes en 1,203 s; la versión modificada midió cero y cero en 1,205 s. Esto mide trabajo programado en el entorno de prueba, **no FPS, latencia del audio ni ahorro energético en un teléfono**.

Entorno: Chromium 144.0.7559.96 con ventana, Xvfb y SwiftShader; documentos cargados en memoria. La batería incluye 20 pruebas unitarias y 61 comprobaciones de navegador, con detalle en VERIFICACION.md. No se declara certificación WCAG, compatibilidad física con iPhone ni validación de YouTube en vivo.

Archivos modificados: src/app.js, src/render.js, src/shell.html, src/style.css, build.py y pruebas. Nuevos: src/motion.js, tests/motion.test.cjs, tests/motion-contracts.py, tests/visual-motion.py y esta documentación. Se conservan datos/formato de backups y núcleo de validación. Cero dependencias de ejecución nuevas; ninguna fuente distribuida.
