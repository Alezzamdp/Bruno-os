// Chequeo del intérprete: node test-interpretar.js
const fs = require('fs'); const src = fs.readFileSync(__dirname + '/app.js', 'utf8');
const body = src.slice(src.indexOf("  'use strict';") + 16, src.indexOf('  // ---------- Consultas'));
const interpretar = new Function(body + '; return interpretar;')();
const casos = [
  ['lunes 21 agenda turno de DNI', 'evento', 'Turno de DNI'],
  ['turno de DNI el 21', 'evento', 'Turno de DNI'],
  ['gestor el jueves', 'evento', 'Gestor'],
  ['pagar la VTV el jueves', 'tarea', 'Pagar la VTV'],
  ['llamar a Juan', 'tarea', 'Llamar a Juan'],
  ['reunion con el contador mañana a las 10', 'evento', 'Reunion con el contador'],
  ['tarea: cargar dos filas en medición el lunes', 'tarea', 'Cargar dos filas en medición'],
  ['agenda muestro la Suran sabado 26 a las 16', 'evento', 'Muestro la Suran'],
  ['idea: reel sobre el olor', 'idea', 'Reel sobre el olor'],
  ['lavar el Corsa', 'tarea', 'Lavar el Corsa'],
  ['dentista martes 10 hs', 'evento', 'Dentista'],
  ['martes 22 dentista', 'evento', 'Dentista'],
];
let mal = 0;
for (const [t, tipo, titulo] of casos) { const r = interpretar(t); const ok = r.tipo === tipo && r.titulo === titulo; if (!ok) mal++; console.log((ok ? 'ok ' : 'MAL') + '  ' + t + '  →  ' + r.tipo + ' | ' + r.titulo + ' | ' + (r.fecha || '') + ' ' + (r.hora || '')); }
process.exit(mal ? 1 : 0);
