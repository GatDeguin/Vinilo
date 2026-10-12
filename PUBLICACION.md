# Publicación verificada · SURCO 1.1

Repositorio: [GatDeguin/Vinilo](https://github.com/GatDeguin/Vinilo), rama `main`.

## Aplicación subida

Commit de aplicación: [`ee29d1191431b8a2242e93dc7766ccdcf1bf5b35`](https://github.com/GatDeguin/Vinilo/commit/ee29d1191431b8a2242e93dc7766ccdcf1bf5b35).

La ejecución [Build and verify SURCO #2](https://github.com/GatDeguin/Vinilo/actions/runs/38194752492) terminó correctamente: recuperó las fuentes verificadas, generó los tres MP3 originales, ejecutó las 20 pruebas unitarias y las comprobaciones de integridad, ensambló `index.html` y lo guardó junto con las fuentes en `main`.

HTML remoto: **1.870.912 bytes**.

SHA-256 remoto:

```
80b17fe4781335d98e3756df3c3a73a9eff0aed333d5a8c65e12e8ea0528a858
```

El árbol remoto y el contenido del HTML se consultaron después de la ejecución. Los archivos editables se encuentran en `src/`. Los bloques de transferencia usados para subir las fuentes ya no están en el árbol actual del repositorio.

La batería local adicional aprobó 61 comprobaciones de navegador. No se presenta la ejecución de CI como repetición de esas pruebas visuales: CI ejecutó las unitarias y la integridad estática. Ver [VERIFICACION.md](VERIFICACION.md) y [MOTION.md](MOTION.md).

## GitHub Pages: activación pendiente

En la consulta final de configuración, el repositorio devolvió `has_pages: false`. Subir la aplicación no activó un sitio público de GitHub Pages. El workflow incluido construye y verifica; no se presenta como despliegue de Pages.

Para publicar, abrir [Settings → Pages](https://github.com/GatDeguin/Vinilo/settings/pages), elegir **Deploy from a branch → main → / (root)** y guardar. El archivo `.nojekyll` deja preparada la publicación estática. La URL de uso será la que GitHub muestre después del despliegue; no se verificó una URL de sitio activo durante esta entrega.

No hace falta crear una clave ni un servidor para los audios locales. La búsqueda por texto de YouTube sí necesita una clave propia autorizada y conectividad; no hay credenciales incluidas en el repositorio.

## Reconstrucción y límites

`python3 build.py` reconstruye el HTML a partir de `src/` y de los MP3 en `assets/`. Los cambios de fuente activan la verificación de Actions. El archivo descargable local y la reconstrucción remota tienen hashes distintos por la regeneración de audios en CI; el informe identifica cada artefacto por separado.

La persistencia tras recargar un origen HTTP, la descarga efectiva al sistema operativo, YouTube en vivo y Safari/iPhone físicos siguen pendientes de validación en destino. No se certifica producción ni compatibilidad universal.
