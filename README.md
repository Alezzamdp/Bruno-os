# BRUNO OS

Un solo lugar para anotar. Escribís (o dictás con el micrófono del teclado) una línea y se guarda sola donde corresponde: **agenda** si tiene fecha u hora, **idea** o **nota** por prefijo (`idea: …`, `nota: …`); si no, **tarea**. Un aviso muestra dónde fue, con **Cambiar** por si se equivocó.

Vive en el teléfono: https://alezzamdp.github.io/Bruno-os/ agregada a la pantalla de inicio.

## Pantallas (v8 · fondo blanco, sin adornos)

- **Hoy**: la caja para anotar, lo agendado para hoy y el checklist de pendientes (prioridad y vencidas primero). Todo a mano, sin bajar. Buscar y Ajustes arriba a la derecha.
- **Agenda**: compromisos por día. Los pasados quedan abajo.
- **Ideas**: ideas y notas.
- **Ajustes**: copia de seguridad (un archivo `.json`), restaurar, borrar todo.

Tocar una fila abre la ficha para editar o eliminar. Tildar el círculo la marca hecha.

Ejemplos que entiende: `turno en el gestor el lunes a las 10` · `entrego la Suran el 20/9 a las 11` · `idea: reel sobre el olor del auto` · `nota: el comprador pidió factura A` · `llamar a Juan por la transferencia`.

## Datos

Todo se guarda en el navegador del teléfono (`localStorage`, clave `brunoos.v4`). No hay servidor ni nube. Si se pierde el teléfono se pierden los datos: **hacer la copia de seguridad cada tanto** (Ajustes → Guardar) y dejarla en Archivos o Drive. Los movimientos de plata de versiones anteriores siguen en los datos y en la copia, pero ya no se muestran.

## Técnico

HTML + CSS + JS sin dependencias ni compilación (`index.html`, `app.css`, `app.js`). Tipografía del sistema. `sw.js` la deja funcionar sin señal; al cambiar de versión, subir el número en `sw.js` (`VERSION`) y en `index.html` (`?v=`).

Para probar en la PC: `python -m http.server 8765` en la carpeta.
