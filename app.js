/* BRUNO OS · v8
   Un solo lugar para anotar: la app entiende qué es (agenda, tarea, idea, nota) y lo guarda.
   Todo vive en este teléfono (localStorage). Sin servidor, sin dependencias, sin nube. */
(function () {
  'use strict';

  // ---------- Constantes ----------
  const CLAVE = 'brunoos.v4';
  const AREAS = ['Personal', 'ALEZZA', 'Autos', 'Sistemas', 'Cuerpo', 'Música'];
  const TIPOS = { evento: 'Agenda', tarea: 'Tarea', idea: 'Idea', nota: 'Nota' };
  const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const MESES_CORTO = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  // ---------- Utilidades ----------
  const $ = (sel, el) => (el || document).querySelector(sel);
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const hoy = () => iso(new Date());
  const deIso = (s) => new Date(s + 'T12:00:00');
  const addDias = (s, n) => { const d = deIso(s); d.setDate(d.getDate() + n); return iso(d); };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const sinAcentos = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
  const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  const fechaCorta = (s) => { if (!s) return ''; const d = deIso(s); return d.getDate() + ' ' + MESES_CORTO[d.getMonth()]; };
  const relativo = (s) => { if (!s) return ''; const h = hoy(); if (s === h) return 'hoy'; if (s === addDias(h, 1)) return 'mañana'; if (s === addDias(h, -1)) return 'ayer'; return fechaCorta(s); };
  const diaLargo = (s) => { const d = deIso(s); return DIAS[d.getDay()] + ' ' + d.getDate() + ' de ' + MESES[d.getMonth()]; };

  // ---------- Datos ----------
  let datos = { version: 4, items: [] };
  function cargar() {
    try {
      const raw = localStorage.getItem(CLAVE);
      if (raw) { const d = JSON.parse(raw); if (d && Array.isArray(d.items)) datos = d; }
    } catch (e) { /* arranca vacío */ }
  }
  function guardar() {
    try { localStorage.setItem(CLAVE, JSON.stringify(datos)); }
    catch (e) { aviso('No se pudo guardar. ¿Sin espacio?'); }
  }
  // Los movimientos de plata de versiones anteriores quedan guardados (y en la copia) pero no se muestran.
  const items = () => datos.items.filter((x) => TIPOS[x.tipo]);
  function agregar(item) {
    const it = Object.assign({ id: uid(), creado: new Date().toISOString(), estado: 'pendiente' }, item);
    datos.items.unshift(it);
    guardar();
    return it;
  }
  function actualizar(id, cambios) {
    const it = datos.items.find((x) => x.id === id);
    if (!it) return;
    Object.assign(it, cambios);
    guardar();
  }
  function borrar(id) {
    const i = datos.items.findIndex((x) => x.id === id);
    if (i < 0) return null;
    const [it] = datos.items.splice(i, 1);
    guardar();
    return { item: it, indice: i };
  }
  function restaurar(guardado) {
    datos.items.splice(guardado.indice, 0, guardado.item);
    guardar();
  }

  // ---------- Interpretar una línea ----------
  function interpretar(texto) {
    const raw = texto.trim().replace(/\s+/g, ' ');
    const low = sinAcentos(raw.toLowerCase());
    const h = hoy();
    let titulo = raw;

    let m;
    if ((m = raw.match(/^(idea|se me ocurrio|se me ocurrió|podria|podría)[:\s]+/i))) {
      return { tipo: 'idea', titulo: cap(raw.slice(m[0].length).trim()), area: detectarArea(low) };
    }
    if ((m = raw.match(/^(nota|recordar|dato|anotar|acordarme)[:\s]+/i))) {
      return { tipo: 'nota', titulo: cap(raw.slice(m[0].length).trim()), area: detectarArea(low) };
    }

    // Fecha
    let fecha = null;
    let restoTitulo = raw;
    const quitar = (re) => { restoTitulo = restoTitulo.replace(re, ' '); };
    if (/\bpasado manana\b/.test(low)) { fecha = addDias(h, 2); quitar(/pasado mañana/i); }
    else if (/\bmanana\b/.test(low)) { fecha = addDias(h, 1); quitar(/\bmañana\b/i); }
    else if (/\bhoy\b/.test(low)) { fecha = h; quitar(/\bhoy\b/i); }
    if (!fecha && (m = low.match(/\b(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?\b/))) {
      const d = new Date(m[3] ? (m[3].length === 2 ? 2000 + +m[3] : +m[3]) : deIso(h).getFullYear(), +m[2] - 1, +m[1], 12);
      if (!m[3] && iso(d) < h) d.setFullYear(d.getFullYear() + 1);
      fecha = iso(d); quitar(new RegExp(m[0].replace(/[\/]/g, '\\/')));
    }
    if (!fecha && (m = low.match(/\b(?:el\s+)?(\d{1,2})\s+de\s+([a-z]+)\b/))) {
      const mi = MESES.map(sinAcentos).indexOf(m[2]);
      if (mi >= 0) {
        const d = new Date(deIso(h).getFullYear(), mi, +m[1], 12);
        if (iso(d) < h) d.setFullYear(d.getFullYear() + 1);
        fecha = iso(d); quitar(new RegExp('(\\bel\\s+)?' + m[1] + '\\s+de\\s+' + MESES[mi], 'i'));
      }
    }
    if (!fecha) {
      const diasSin = DIAS.map(sinAcentos);
      for (let i = 0; i < 7; i++) {
        const re = new RegExp('\\b(el\\s+)?' + diasSin[i] + '(\\s+que\\s+viene|\\s+proximo)?\\b');
        const mm = low.match(re);
        if (mm) {
          const d = deIso(h); let diff = (i - d.getDay() + 7) % 7;
          if (diff === 0) diff = 7;
          if (mm[2]) diff += diff < 7 ? 7 : 0;
          fecha = addDias(h, diff);
          quitar(new RegExp('(\\bel\\s+)?' + DIAS[i] + '(\\s+que\\s+viene|\\s+pr[oó]ximo)?', 'i'));
          break;
        }
      }
    }
    if (!fecha && (m = low.match(/\bel\s+(\d{1,2})\b(?!\s*(:|hs|h\b|de))/))) {
      const d = deIso(h); d.setDate(+m[1]); if (iso(d) < h) d.setMonth(d.getMonth() + 1);
      fecha = iso(d); quitar(new RegExp('\\bel\\s+' + m[1] + '\\b', 'i'));
    }

    // Hora (sobre el texto ya sin la fecha, para que "20/9" no se lea como hora)
    let hora = null;
    const low2 = sinAcentos(restoTitulo.toLowerCase());
    if ((m = low2.match(/\b(?:a\s+las?\s+)?(\d{1,2})(?:[:.](\d{2}))?\s*(hs|h|horas)?\b/))) {
      const tieneMarca = /a\s+las?\s+/.test(m[0]) || m[3];
      const n = +m[1];
      if (tieneMarca && n >= 0 && n <= 23) {
        hora = pad(n) + ':' + (m[2] || '00');
        quitar(new RegExp(m[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
      }
    }

    const esEvento = !!hora || /\b(turno|reunion|cita|junta|entrega|entrego|viaje|vuelo|cumple|cumpleanos|visita|voy a ver|ver el auto|ver la|muestro|mostrar el)\b/.test(low);
    titulo = cap(restoTitulo.replace(/\s{2,}/g, ' ').replace(/^\s*(el|la|a)\s+/i, '').replace(/(\s+(el|la|los|las|a|en|de|del|para|por|antes|hasta))+\s*$/i, '').trim()) || raw;

    if (esEvento) return { tipo: 'evento', titulo, fecha: fecha || h, hora, area: detectarArea(low) };
    return { tipo: 'tarea', titulo, fecha, area: detectarArea(low) };
  }
  function detectarArea(low) {
    if (/\balezza\b|\btaller\b|\bcliente\b|\binstagram\b|\bpublicar\b|\breel\b/.test(low)) return 'ALEZZA';
    if (/\bautos?\b|\bsuran\b|\bgol\b|\bcorsa\b|\bclio\b|\bpartner\b|\bvehiculo\b|\bcamioneta\b|\bmecanic|\bverificaci|\bregistro\b|\bvtv\b|\btransferencia\b|\bgestor\b|\bpatente|\bcubiertas?\b|\bgnc\b|\bnafta\b/.test(low)) return 'Autos';
    if (/\bentren|\bgym\b|\bgimnasio\b|\bcorrer\b|\bdormir\b|\bmedico\b|\bdentista\b/.test(low)) return 'Cuerpo';
    if (/\bdj\b|\bset\b|\bmusica\b|\bmezcla\b|\bableton\b|\btema\b/.test(low)) return 'Música';
    if (/\bbruno os\b|\bapp\b|\bsistema\b|\bclaude\b|\bautomatiz|\bcodigo\b/.test(low)) return 'Sistemas';
    return 'Personal';
  }

  // ---------- Consultas ----------
  const pendientes = () => items().filter((x) => x.tipo === 'tarea' && x.estado !== 'hecha');
  const hechas = () => items().filter((x) => x.tipo === 'tarea' && x.estado === 'hecha').sort((a, b) => (b.hecho || '').localeCompare(a.hecho || ''));
  const eventosDe = (f) => items().filter((x) => x.tipo === 'evento' && x.fecha === f && x.estado !== 'hecha').sort((a, b) => (a.hora || '99').localeCompare(b.hora || '99'));
  function prioridades() {
    const h = hoy();
    return pendientes()
      .map((t) => ({ t, peso: (t.prioridad ? 0 : 10) + (t.fecha ? (t.fecha < h ? 1 : t.fecha === h ? 2 : 3) : 5) }))
      .sort((a, b) => a.peso - b.peso || (a.t.fecha || '9').localeCompare(b.t.fecha || '9'))
      .map((x) => x.t);
  }

  // ---------- Estado de la interfaz ----------
  let vista = 'inicio';
  let busqueda = '';
  let verHechas = false;
  let toastTimer = null;
  let tipoElegido = null; // chip tocado debajo de la caja de Inicio; se limpia al anotar

  // ---------- Render ----------
  const app = $('#app');
  const nav = $('#nav');

  let vistaPintada = null;
  function render() {
    const vistas = { inicio, agenda, ideas, buscar, ajustes };
    const cambioSeccion = vista !== vistaPintada;
    const y = window.scrollY;
    app.innerHTML = (vistas[vista] || inicio)();
    renderNav();
    if (vista === 'buscar') { const i = $('#q'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }
    // Solo sube al cambiar de sección; al tildar o anotar se queda donde estabas.
    if (cambioSeccion) window.scrollTo(0, 0); else window.scrollTo(0, y);
    vistaPintada = vista;
  }
  function renderNav() {
    const tabs = [['inicio', 'Hoy'], ['agenda', 'Agenda'], ['ideas', 'Ideas']];
    nav.innerHTML = tabs.map(([v, l]) => '<button type="button" data-ir="' + v + '" class="' + (vista === v ? 'on' : '') + '">' + l + '</button>').join('');
  }
  const svgCheck = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5l3 3 7-7"/></svg>';

  function filaTarea(t) {
    const h = hoy();
    const vencida = t.fecha && t.fecha < h && t.estado !== 'hecha';
    const meta = [t.fecha ? relativo(t.fecha) : '', t.prioridad ? 'prioridad' : ''].filter(Boolean).join(' · ');
    return '<div class="fila' + (t.estado === 'hecha' ? ' hecha' : '') + '" data-abrir="' + t.id + '">' +
      '<button type="button" class="check' + (t.estado === 'hecha' ? ' on' : '') + '" data-hecha="' + t.id + '" aria-label="Completar">' + (t.estado === 'hecha' ? svgCheck : '') + '</button>' +
      '<div><div class="titulo">' + esc(t.titulo) + '</div>' + (meta ? '<div class="meta' + (vencida ? ' roja' : '') + '">' + meta + '</div>' : '') + '</div></div>';
  }
  function filaEvento(e, conFecha) {
    return '<div class="fila" data-abrir="' + e.id + '">' +
      '<div class="cuando' + (e.hora ? '' : ' gris') + '">' + (e.hora || '—') + '</div>' +
      '<div><div class="titulo">' + esc(e.titulo) + '</div>' + (conFecha ? '<div class="meta">' + relativo(e.fecha) + '</div>' : '') + '</div></div>';
  }
  function filaIdea(x) {
    return '<div class="fila sola" data-abrir="' + x.id + '">' +
      '<div><div class="titulo">' + esc(x.titulo) + '</div><div class="meta">' + relativo(iso(new Date(x.creado))) + '</div></div></div>';
  }
  // Caja de cada sección: lo que se escribe acá va derecho a ese tipo. En Inicio la app decide.
  function caja(tipo, placeholder) {
    return '<form class="caja" data-rapida="' + (tipo || '') + '"><input type="text" name="texto" placeholder="' + placeholder + '" autocomplete="off" autocapitalize="sentences" enterkeyhint="send"><button type="submit" aria-label="Anotar">↑</button></form>';
  }
  const cabecera = (t, sub, extra) => '<header class="cab"><div class="cab-fila"><h1>' + t + '</h1>' + (extra || '') + '</div>' + (sub ? '<div class="sub">' + sub + '</div>' : '') + '</header>';
  const seccion = (t, cuerpo) => '<section class="seccion"><h2>' + t + '</h2><div class="lista">' + cuerpo + '</div></section>';

  // ----- Inicio: todo lo del día a mano, sin bajar -----
  function inicio() {
    const h = hoy();
    const evs = eventosDe(h);
    const tareas = verHechas ? hechas().slice(0, 30) : prioridades();
    let proximo = '';
    for (let i = 1; i <= 7 && !proximo; i++) { const e = eventosDe(addDias(h, i))[0]; if (e) proximo = esc(e.titulo) + ' · ' + relativo(e.fecha) + (e.hora ? ' ' + e.hora : ''); }
    return cabecera('Hoy', cap(diaLargo(h)), '<span class="acciones"><button type="button" data-ir="buscar">Buscar</button><button type="button" data-ir="ajustes">Ajustes</button></span>') +
      caja('', 'Anotar…') +
      '<div class="chips">' + ['evento', 'tarea', 'idea'].map((k) => '<button type="button" class="chip' + (tipoElegido === k ? ' on' : '') + '" data-elegir="' + k + '">' + TIPOS[k] + '</button>').join('') + '</div>' +
      (evs.length ? seccion('Agenda', evs.map((e) => filaEvento(e, false)).join('')) : (proximo ? '<div class="vacio">Nada hoy. Lo próximo: ' + proximo + '.</div>' : '')) +
      seccion(verHechas ? 'Hechas' : 'Pendientes',
        (tareas.length ? tareas.map(filaTarea).join('') : '<div class="vacio">' + (verHechas ? 'Nada terminado todavía.' : 'Nada pendiente.') + '</div>') +
        '<button type="button" class="ver" data-hechas>' + (verHechas ? 'Ver pendientes' : 'Ver hechas') + '</button>');
  }

  // ----- Agenda -----
  function agenda() {
    const h = hoy();
    const evs = items().filter((x) => x.tipo === 'evento').sort((a, b) => (a.fecha + (a.hora || '99')).localeCompare(b.fecha + (b.hora || '99')));
    const futuros = evs.filter((e) => e.fecha >= h);
    const pasados = evs.filter((e) => e.fecha < h).reverse().slice(0, 15);
    const grupos = {}; futuros.forEach((e) => { (grupos[e.fecha] = grupos[e.fecha] || []).push(e); });
    const fechas = Object.keys(grupos).sort();
    let html = cabecera('Agenda') + caja('evento', 'Qué y cuándo. Ej.: gestor el jueves a las 10');
    if (!fechas.length) html += '<div class="vacio">Nada agendado.</div>';
    fechas.forEach((f) => {
      const pref = f === h ? 'Hoy, ' : f === addDias(h, 1) ? 'Mañana, ' : '';
      html += seccion(pref + diaLargo(f), grupos[f].map((e) => filaEvento(e, false)).join(''));
    });
    if (pasados.length) html += seccion('Pasados', pasados.map((e) => filaEvento(e, true)).join(''));
    return html;
  }

  // ----- Ideas -----
  function ideas() {
    const lista = items().filter((x) => x.tipo === 'idea' || x.tipo === 'nota');
    return cabecera('Ideas') + caja('idea', 'Una idea, tal cual venga') +
      '<div class="lista">' + (lista.length ? lista.map(filaIdea).join('') : '<div class="vacio">Nada todavía.</div>') + '</div>';
  }

  // ----- Buscar -----
  function buscar() {
    const q = sinAcentos(busqueda.trim().toLowerCase());
    const res = q ? items().filter((x) => sinAcentos((x.titulo + ' ' + (x.area || '')).toLowerCase()).includes(q)).slice(0, 60) : [];
    return cabecera('Buscar', '', '<span class="acciones"><button type="button" data-ir="inicio">Listo</button></span>') +
      '<div class="caja"><input id="q" type="search" placeholder="Palabra, auto, persona…" value="' + esc(busqueda) + '" autocomplete="off"></div>' +
      '<div class="lista">' + (q ? (res.length ? res.map(filaGenerica).join('') : '<div class="vacio">Nada con “' + esc(busqueda) + '”.</div>') : '') + '</div>';
  }
  function filaGenerica(x) {
    const cuando = x.tipo === 'evento' ? (relativo(x.fecha) + (x.hora ? ' ' + x.hora : '')) : x.fecha ? relativo(x.fecha) : relativo(iso(new Date(x.creado)));
    return '<div class="fila sola' + (x.estado === 'hecha' ? ' hecha' : '') + '" data-abrir="' + x.id + '"><div><div class="titulo">' + esc(x.titulo) + '</div><div class="meta">' + TIPOS[x.tipo] + ' · ' + cuando + '</div></div></div>';
  }

  // ----- Ajustes -----
  function ajustes() {
    const n = datos.items.length;
    return cabecera('Ajustes', '', '<span class="acciones"><button type="button" data-ir="inicio">Listo</button></span>') +
      '<div class="lista">' +
      '<div class="ajuste"><div>Copia de seguridad<div class="meta">' + n + ' registros. Guardala en Archivos o Drive cada tanto.</div></div><button type="button" class="btn" data-exportar>Guardar</button></div>' +
      '<div class="ajuste"><div>Restaurar copia<div class="meta">Reemplaza todo por el archivo que elijas.</div></div><label class="btn" for="importar">Elegir</label><input id="importar" type="file" accept="application/json,.json" hidden></div>' +
      '<div class="ajuste"><div>Borrar todo<div class="meta">Sin vuelta atrás.</div></div><button type="button" class="btn rojo" data-borrar-todo>Borrar</button></div>' +
      '<div class="ajuste"><div class="meta">BRUNO OS v8 · datos en este teléfono · sin servidor</div></div>' +
      '</div>';
  }

  // ---------- Sheets ----------
  const sheetRoot = $('#sheet-root');
  function abrirSheet(html) { sheetRoot.innerHTML = '<div class="backdrop" data-cerrar></div><div class="sheet" role="dialog"><div class="asa"></div>' + html + '</div>'; }
  function cerrarSheet() { sheetRoot.innerHTML = ''; }

  function formulario(p) {
    const areaSel = '<select name="area">' + AREAS.map((a) => '<option' + (p.area === a ? ' selected' : '') + '>' + a + '</option>').join('') + '</select>';
    let campos = '<div class="campo"><label>Qué es</label><div class="chips">' + Object.keys(TIPOS).map((k) => '<button type="button" class="chip' + (p.tipo === k ? ' on' : '') + '" data-tipo="' + k + '">' + TIPOS[k] + '</button>').join('') + '</div></div>' +
      '<div class="campo"><label>Título</label><input name="titulo" value="' + esc(p.titulo) + '" autocomplete="off"></div>';
    if (p.tipo === 'evento') campos += '<div class="campo dos"><div><label>Fecha</label><input name="fecha" type="date" value="' + (p.fecha || hoy()) + '"></div><div><label>Hora</label><input name="hora" type="time" value="' + (p.hora || '') + '"></div></div>';
    if (p.tipo === 'tarea') campos += '<div class="campo dos"><div><label>Para cuándo</label><input name="fecha" type="date" value="' + (p.fecha || '') + '"></div><div><label>Prioridad</label><label class="switch"><input type="checkbox" name="prioridad"' + (p.prioridad ? ' checked' : '') + '><span></span></label></div></div>';
    campos += '<div class="campo"><label>Área</label>' + areaSel + '</div>';
    return campos;
  }
  let propuesta = null;
  function sheetConfirmar(p, esEdicion) {
    propuesta = p;
    abrirSheet('<form id="form-item"><div class="sheet-cab"><button type="button" data-cerrar>Cancelar</button><h2>' + (esEdicion ? 'Editar' : 'Nuevo') + '</h2><button type="submit" class="fuerte">Guardar</button></div>' +
      formulario(p) +
      (esEdicion ? '<button type="button" class="eliminar" data-eliminar="' + p.id + '">Eliminar</button>' : '') + '</form>');
  }
  function leerFormulario(form) {
    const fd = new FormData(form);
    const p = Object.assign({}, propuesta);
    p.titulo = (fd.get('titulo') || '').toString().trim();
    if (fd.has('fecha')) p.fecha = fd.get('fecha') || null;
    if (fd.has('hora')) p.hora = fd.get('hora') || null;
    if (fd.has('area')) p.area = fd.get('area');
    if (p.tipo === 'tarea') p.prioridad = fd.get('prioridad') === 'on'; else delete p.prioridad;
    if (p.tipo === 'evento' && !p.fecha) p.fecha = hoy();
    if (p.tipo !== 'evento') delete p.hora;
    if (p.tipo !== 'evento' && p.tipo !== 'tarea') delete p.fecha;
    return p;
  }

  // ---------- Aviso ----------
  let deshacerFn = null;
  function aviso(texto, deshacer, etiqueta) {
    clearTimeout(toastTimer);
    const viejo = $('.toast'); if (viejo) viejo.remove();
    deshacerFn = deshacer || null;
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = '<span>' + esc(texto) + '</span>' + (deshacer ? '<button type="button" data-deshacer>' + (etiqueta || 'Deshacer') + '</button>' : '');
    document.body.appendChild(el);
    toastTimer = setTimeout(() => el.remove(), deshacer ? 4500 : 1800);
    // Se saca con un toque (fuera del botón) o deslizándolo hacia arriba.
    let y0 = null;
    el.addEventListener('click', (e) => { if (!e.target.closest('[data-deshacer]')) el.remove(); });
    el.addEventListener('touchstart', (e) => { y0 = e.touches[0].clientY; }, { passive: true });
    el.addEventListener('touchmove', (e) => { if (y0 == null) return; const dy = e.touches[0].clientY - y0; if (dy < 0) el.style.transform = 'translateY(' + dy + 'px)'; if (dy < -30) { el.remove(); y0 = null; } }, { passive: true });
    el.addEventListener('touchend', () => { el.style.transform = ''; y0 = null; });
  }
  // Anota directo, sin confirmar. Si viene de la caja de una sección, se acomoda a ese tipo.
  function anotarDirecto(texto, tipoForzado) {
    const p = interpretar(texto);
    if (tipoForzado && p.tipo !== tipoForzado) {
      const fecha = p.fecha || null; const hora = p.hora || null;
      Object.keys(p).forEach((k) => { if (k !== 'titulo' && k !== 'area') delete p[k]; });
      p.tipo = tipoForzado;
      if (tipoForzado === 'evento') { p.fecha = fecha || hoy(); p.hora = hora; }
      if (tipoForzado === 'tarea') p.fecha = fecha;
    }
    const it = agregar(p);
    render();
    const donde = it.tipo === 'evento' ? [relativo(it.fecha), it.hora].filter(Boolean).join(' ') : (it.tipo === 'tarea' && it.fecha) ? relativo(it.fecha) : '';
    aviso(TIPOS[it.tipo] + (donde ? ' · ' + donde : '') + ' · ' + it.titulo, () => sheetConfirmar(Object.assign({}, it), true), 'Cambiar');
    return it;
  }

  // ---------- Copia de seguridad ----------
  async function exportar() {
    const nombre = 'bruno-os-' + hoy() + '.json';
    const json = JSON.stringify(datos, null, 1);
    const archivo = new File([json], nombre, { type: 'application/json' });
    if (navigator.canShare && navigator.canShare({ files: [archivo] })) {
      try { await navigator.share({ files: [archivo], title: 'BRUNO OS · copia' }); return; } catch (e) { if (e.name === 'AbortError') return; }
    }
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' })); a.download = nombre; document.body.appendChild(a); a.click(); a.remove();
  }
  function importar(file) {
    const r = new FileReader();
    r.onload = () => {
      try {
        const d = JSON.parse(r.result);
        if (!d || !Array.isArray(d.items)) throw new Error('formato');
        if (!confirm('Se reemplazan ' + datos.items.length + ' registros por ' + d.items.length + ' del archivo. ¿Seguimos?')) return;
        datos = { version: 4, items: d.items }; guardar(); vista = 'inicio'; render(); aviso('Copia restaurada');
      } catch (e) { aviso('Ese archivo no es una copia de BRUNO OS'); }
    };
    r.readAsText(file);
  }

  // ---------- Eventos (delegados) ----------
  document.addEventListener('click', (ev) => {
    const t = ev.target.closest('[data-ir],[data-hecha],[data-hechas],[data-abrir],[data-tipo],[data-cerrar],[data-eliminar],[data-deshacer],[data-exportar],[data-borrar-todo],[data-elegir]');
    if (!t) return;
    if (t.dataset.elegir) { tipoElegido = tipoElegido === t.dataset.elegir ? null : t.dataset.elegir; document.querySelectorAll('[data-elegir]').forEach((c) => c.classList.toggle('on', c.dataset.elegir === tipoElegido)); const i = $('.caja [name=texto]'); if (i) i.focus(); return; }
    if (t.dataset.ir != null) { vista = t.dataset.ir; if (vista === 'buscar') busqueda = ''; render(); return; }
    if (t.dataset.hechas != null) { verHechas = !verHechas; render(); return; }
    if (t.dataset.hecha) {
      ev.stopPropagation();
      const it = items().find((x) => x.id === t.dataset.hecha); if (!it) return;
      const hecha = it.estado !== 'hecha';
      actualizar(it.id, { estado: hecha ? 'hecha' : 'pendiente', hecho: hecha ? new Date().toISOString() : null });
      render();
      if (hecha) aviso('Hecha', () => { actualizar(it.id, { estado: 'pendiente', hecho: null }); render(); });
      return;
    }
    if (t.dataset.abrir) { const it = items().find((x) => x.id === t.dataset.abrir); if (it) sheetConfirmar(Object.assign({}, it), true); return; }
    if (t.dataset.tipo) { const p = leerFormulario($('#form-item')); p.tipo = t.dataset.tipo; sheetConfirmar(p, !!p.id); return; }
    if (t.dataset.cerrar != null) { cerrarSheet(); return; }
    if (t.dataset.eliminar) {
      const g = borrar(t.dataset.eliminar); cerrarSheet(); render();
      if (g) aviso('Eliminado', () => { restaurar(g); render(); });
      return;
    }
    if (t.dataset.deshacer != null) { const fn = deshacerFn; deshacerFn = null; const el = $('.toast'); if (el) el.remove(); if (fn) fn(); return; }
    if (t.dataset.exportar != null) { exportar(); return; }
    if (t.dataset.borrarTodo != null) { if (confirm('¿Borrar todos los registros? No hay vuelta atrás.')) { datos = { version: 4, items: [] }; guardar(); vista = 'inicio'; render(); aviso('Todo borrado'); } return; }
  });

  document.addEventListener('submit', (ev) => {
    ev.preventDefault();
    if (ev.target.matches('[data-rapida]')) {
      const f = ev.target; const texto = (f.texto.value || '').trim();
      if (!texto) { f.texto.focus(); return; }
      const tipo = f.dataset.rapida || tipoElegido; tipoElegido = null;
      anotarDirecto(texto, tipo || null);
      const i = $('.caja [name=texto]'); if (i) i.focus();
      return;
    }
    if (!ev.target.matches('#form-item')) return;
    const p = leerFormulario(ev.target);
    if (!p.titulo) { $('input[name=titulo]').focus(); return; }
    if (p.id) { actualizar(p.id, p); aviso('Guardado'); }
    else { agregar(p); aviso(TIPOS[p.tipo] + ' anotada'); }
    cerrarSheet();
    render();
  });

  document.addEventListener('input', (ev) => {
    if (ev.target.matches('#q')) { busqueda = ev.target.value; const lista = $('.lista'); if (lista) { const tmp = document.createElement('div'); tmp.innerHTML = buscar(); lista.replaceWith(tmp.querySelector('.lista')); } }
  });
  document.addEventListener('change', (ev) => {
    if (ev.target.matches('#importar') && ev.target.files[0]) importar(ev.target.files[0]);
  });
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') cerrarSheet();
    if (ev.key === 'Enter' && ev.target.matches('.caja input[name=texto]')) { ev.preventDefault(); ev.target.form.requestSubmit(); }
  });

  // ---------- Arranque ----------
  cargar();
  render();
  // Sin señal sigue andando. Cuando hay versión nueva, la app se recarga sola una vez.
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').then((reg) => {
      document.addEventListener('visibilitychange', () => { if (!document.hidden) reg.update().catch(() => {}); });
    }).catch(() => {});
    let teniaControl = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (teniaControl) location.reload(); teniaControl = true; });
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && vista === 'inicio') render(); });
})();
