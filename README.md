# BRUNO OS

Un solo lugar para anotar. Escribís (o dictás) una línea; la app propone si es **agenda**, **tarea**, **plata**, **idea** o **nota**; confirmás; después lo encontrás con **Buscar**.

Vive en el teléfono: https://alezzamdp.github.io/Bruno-os/ agregada a la pantalla de inicio.

## Cómo funciona

- **Inicio**: la caja para anotar, lo de hoy, prioridades, saldos por cuenta, últimas ideas.
- **Agenda**: compromisos con fecha, agrupados por día. Los pasados quedan abajo.
- **Tareas**: pendientes (vencidas y con prioridad primero) y hechas.
- **Cuentas**: Personal · ALEZZA · Autos. Saldos, lo que entró y salió en el mes, movimientos.
- **Ideas**: ideas y notas.
- **Ajustes**: copia de seguridad (un archivo `.json`), restaurar, borrar todo.

Ejemplos que entiende: `turno en el gestor el lunes a las 10` · `entrego la Suran el 20/9 a las 11` · `gasté $42.000 en cubiertas` · `cobré 150 mil seña del Corsa` · `me pagaron 1,2 millones por el Gol` · `idea: reel sobre el olor del auto` · `nota: el comprador pidió factura A` · `llamar a Juan por la transferencia`.

## Datos

Todo se guarda en el navegador del teléfono (`localStorage`, clave `brunoos.v4`). No hay servidor ni nube. Si se pierde el teléfono se pierden los datos: **hacer la copia de seguridad cada tanto** (Ajustes → Guardar) y dejarla en Archivos o Drive.

## Técnico

HTML + CSS + JS sin dependencias ni compilación (`index.html`, `app.css`, `app.js`). Tipografía Archivo (`fonts/`). `sw.js` la deja funcionar sin señal; al cambiar de versión, subir el número en `sw.js` (`VERSION`) y en `index.html` (`?v=`).

Para probar en la PC: cualquier servidor estático en la carpeta (por ejemplo `npx serve .` o `python -m http.server`).
