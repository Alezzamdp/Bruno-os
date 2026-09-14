/* BRUNO OS · v4
   Un solo lugar para anotar: la app entiende qué es (agenda, tarea, plata, idea, nota),
   vos confirmás, y después lo encontrás. Todo vive en este teléfono (localStorage).
   Sin servidor, sin dependencias, sin nube. Copia de seguridad en Ajustes. */
(function () {
  'use strict';

  // ---------- Constantes ----------
  const CLAVE = 'brunoos.v4';
  const AREAS = ['Personal', 'ALEZZA', 'Autos', 'Sistemas', 'Cuerpo', 'Música'];
  const CUENTAS = ['Personal', 'ALEZZA', 'Autos'];
  const TIPOS = { evento: 'Agenda', tarea: 'Tarea', movimiento: 'Plata', idea: 'Idea', nota: 'Nota' };
  const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const DIAS_CORTO = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
  const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const MESES_CORTO = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const FRASES = [
    'Primero se mira. Después se decide.',
    'Lo que no está anotado no existe.',
    'Un paso visible por proyecto.',
    'Consistencia antes que intensidad.',
    'Pensar en frío.',
    'Actividad no es progreso.',
    'Terminar ciclos chicos.',
  ];

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
  const plata = (n) => (n < 0 ? '−' : '') + '$' + Math.abs(Math.round(n)).toLocaleString('es-AR');
  const fechaLarga = (s) => { const d = deIso(s); return DIAS[d.getDay()] + ' ' + d.getDate() + ' de ' + MESES[d.getMonth()]; };
  const fechaCorta = (s) => { if (!s) return ''; const d = deIso(s); return DIAS_CORTO[d.getDay()] + ' ' + d.getDate() + ' ' + MESES_CORTO[d.getMonth()]; };
  const relativo = (s) => { if (!s) return ''; const h = hoy(); if (s === h) return 'hoy'; if (s === addDias(h, 1)) return 'mañana'; if (s === addDias(h, -1)) return 'ayer'; return fechaCorta(s); };

  // ---------- Datos ----------
  let datos = { version: 4, items: [] };
  function cargar() {
    try {
      const raw = localStorage.getItem(CLAVE);
      if (raw) { const d = JSON.parse(raw); if (d && Array.isArray(d.items)) datos = d; }
    } catch (e) { /* arranca vacío */ }
    // Versiones anteriores (datos de ejemplo): se limpian una sola vez.
    try { localStorage.removeItem('brunoos_items'); localStorage.removeItem('brunoos_proyectos'); } catch (e) {}
  }
  function guardar() {
    try { localStorage.setItem(CLAVE, JSON.stringify(datos)); }
    catch (e) { aviso('No se pudo guardar. ¿Sin espacio?'); }
  }
  const items = () => datos.items;
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
  // Devuelve una propuesta editable. Nunca guarda sola: Bruno confirma.
  function interpretar(texto) {
    const raw = texto.trim().replace(/\s+/g, ' ');
    const low = sinAcentos(raw.toLowerCase());
    const h = hoy();
    let titulo = raw;

    // Idea / nota (por prefijo)
    let m;
    if ((m = raw.match(/^(idea|se me ocurrio|se me ocurrió|podria|podría)[:\s]+/i))) {
      return { tipo: 'idea', titulo: cap(raw.slice(m[0].length).trim()), area: detectarArea(low) };
    }
    if ((m = raw.match(/^(nota|recordar|dato|anotar|acordarme)[:\s]+/i))) {
      return { tipo: 'nota', titulo: cap(raw.slice(m[0].length).trim()), area: detectarArea(low) };
    }

    // Plata
    const monto = detectarMonto(low);
    const gasto = /\b(gaste|pague|compre|puse|saque|pago|gasto|compra|abone|transferi|deposite)\b/.test(low);
    const ingreso = /\b(cobre|vendi|me pagaron|ingreso|entro|sena|senaron|recibi|cobro|venta|me transfirieron|me depositaron)\b/.test(low);
    if (monto != null && (gasto || ingreso || /\$/.test(raw))) {
      const signo = ingreso && !gasto ? 1 : -1;
      let t = raw
        .replace(/\$\s?[\d.,]+(\s?(mil|k|lucas|millones|palos|m))?/i, '')
        .replace(/\b\d+(?:[.,]\d+)*\s?(mil|k|lucas|millones|palos|m)?\b/i, '')
        .replace(/(^|\s)(gaste|gasté|pague|pagué|compre|compré|puse|saque|saqué|cobre|cobré|vendi|vendí|recibi|recibí|ingreso|ingresó|entro|entró|abone|aboné|me pagaron|me transfirieron)(?=\s|$)/i, ' ')
        .replace(/\s{2,}/g, ' ').trim();
      t = t.replace(/^(\s*(en|de|por|del|la|el|los|las|para|a)\b)+\s*/i, '').replace(/(\s+(el|la|los|las|a|en|de|del|para|por))+\s*$/i, '');
      return { tipo: 'movimiento', titulo: cap(t) || (signo < 0 ? 'Gasto' : 'Ingreso'), monto: monto * signo, cuenta: detectarCuenta(low), fecha: h };
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
  function detectarMonto(low) {
    let m = low.match(/\$\s?(\d[\d.,]*)\s?(mil|k|lucas|millones|palos|m)?\b/);
    if (!m) m = low.match(/\b(\d[\d.,]*)\s?(mil|k|lucas|millones|palos|m)\b/);
    if (!m) m = low.match(/\b(gaste|pague|compre|cobre|vendi|recibi|puse|saque)\b[^\d$]{0,20}(\d[\d.,]*)/);
    if (!m) return null;
    const numStr = m[2] && /^\d/.test(m[2]) ? m[2] : m[1];
    const suf = m[2] && !/^\d/.test(m[2]) ? m[2] : '';
    let n;
    if (/,\d{1,2}$/.test(numStr) && !/\.\d{3}/.test(numStr)) n = parseFloat(numStr.replace(/\./g, '').replace(',', '.'));
    else n = parseFloat(numStr.replace(/\./g, '').replace(',', '.'));
    if (isNaN(n)) return null;
    if (/^(mil|k|lucas)$/.test(suf)) n *= 1000;
    if (/^(millones|palos|m)$/.test(suf)) n *= 1000000;
    return Math.round(n);
  }
  function detectarCuenta(low) {
    if (/\balezza\b|\btaller\b/.test(low)) return 'ALEZZA';
    if (/\bautos?\b|\bsuran\b|\bgol\b|\bcorsa\b|\bclio\b|\bpartner\b|\bvehiculo\b|\bcamioneta\b|\bmoto\b|\bvtv\b|\bpatente|\bverificaci|\btransferencia\b|\bformulario\b|\bgestor\b|\bmecanic|\brepuesto|\bcubiertas?\b|\bnafta\b|\bgnc\b/.test(low)) return 'Autos';
    return 'Personal';
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
  const eventosDe = (f) => items().filter((x) => x.tipo === 'evento' && x.fecha === f && x.estado !== 'hecha').sort((a, b) => (a.hora || '99').localeCompare(b.hora || '99'));
  function saldos() {
    const s = {}; CUENTAS.forEach((c) => (s[c] = 0));
    items().forEach((x) => { if (x.tipo === 'movimiento' && s[x.cuenta] != null) s[x.cuenta] += x.monto || 0; });
    return s;
  }
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
  let filtroTareas = 'pendientes';
  let filtroCuenta = null;
  let toastTimer = null;
  let animar = true;
  let tipoElegido = null; // chip tocado debajo de la caja de Inicio; se limpia al anotar // la aparición escalonada solo al abrir o cambiar de sección

  // ---------- Render ----------
  const app = $('#app');
  const nav = $('#nav');

  let vistaPintada = null;
  function render() {
    const vistas = { inicio, agenda, tareas, cuentas, ideas, buscar, ajustes };
    const cambioSeccion = vista !== vistaPintada;
    const y = window.scrollY;
    app.classList.toggle('sin-anim', !animar); animar = false;
    app.innerHTML = (vistas[vista] || inicio)();
    renderNav();
    if (vista === 'inicio') { const ta = $('#entrada'); if (ta) ajustarAlto(ta); }
    if (vista === 'buscar') { const i = $('#q'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }
    // Solo sube al cambiar de sección; al tildar o anotar se queda donde estabas.
    if (cambioSeccion) window.scrollTo(0, 0); else window.scrollTo(0, y);
    vistaPintada = vista;
  }
  function renderNav() {
    const tabs = [['inicio', 'Inicio'], ['agenda', 'Agenda'], ['tareas', 'Tareas'], ['cuentas', 'Cuentas'], ['ideas', 'Ideas']];
    nav.innerHTML = tabs.map(([v, l]) => '<button type="button" data-ir="' + v + '" class="' + (vista === v ? 'on' : '') + '"><span class="marca"></span>' + l + '</button>').join('');
  }
  const svgCheck = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5l3 3 7-7"/></svg>';

  function filaTarea(t) {
    const h = hoy();
    const vencida = t.fecha && t.fecha < h && t.estado !== 'hecha';
    return '<div class="fila' + (t.estado === 'hecha' ? ' hecha' : '') + '" data-abrir="' + t.id + '">' +
      '<button type="button" class="check' + (t.estado === 'hecha' ? ' on' : '') + '" data-hecha="' + t.id + '" aria-label="Completar">' + (t.estado === 'hecha' ? svgCheck : '') + '</button>' +
      '<div><div class="titulo">' + esc(t.titulo) + '</div><div class="meta">' + [t.fecha ? (vencida ? 'venció ' : '') + relativo(t.fecha) : '', t.area, t.prioridad ? 'prioridad' : ''].filter(Boolean).join(' · ') + '</div></div>' +
      '<div></div></div>';
  }
  function filaEvento(e, conFecha) {
    return '<div class="fila" data-abrir="' + e.id + '">' +
      '<div class="cuando' + (e.hora ? '' : ' gris') + '">' + (e.hora || (conFecha ? fechaCorta(e.fecha).split(' ')[0] : '—')) + '</div>' +
      '<div><div class="titulo">' + esc(e.titulo) + '</div><div class="meta">' + [conFecha ? relativo(e.fecha) : '', e.area].filter(Boolean).join(' · ') + '</div></div><div></div></div>';
  }
  function filaMov(mv) {
    return '<div class="fila" data-abrir="' + mv.id + '">' +
      '<div class="cuando gris">' + fechaCorta(mv.fecha).replace(/^\S+\s/, '') + '</div>' +
      '<div><div class="titulo">' + esc(mv.titulo) + '</div><div class="meta">' + esc(mv.cuenta) + '</div></div>' +
      '<div class="monto ' + (mv.monto < 0 ? 'neg' : 'pos') + '">' + plata(mv.monto) + '</div></div>';
  }
  function filaIdea(x) {
    return '<div class="fila" data-abrir="' + x.id + '">' +
      '<div class="cuando gris">' + (x.tipo === 'idea' ? 'IDEA' : 'NOTA') + '</div>' +
      '<div><div class="titulo">' + esc(x.titulo) + '</div><div class="meta">' + [x.area, relativo(iso(new Date(x.creado)))].filter(Boolean).join(' · ') + '</div></div><div></div></div>';
  }

  // ----- Inicio -----
  function inicio() {
    const h = hoy(); const d = deIso(h);
    const evs = eventosDe(h);
    const pri = prioridades().slice(0, 4);
    const s = saldos();
    const semana = []; for (let i = 1; i <= 7; i++) { const f = addDias(h, i); const e = eventosDe(f); if (e.length) semana.push(...e.map((x) => Object.assign({}, x))); }
    const ideasRec = items().filter((x) => x.tipo === 'idea' || x.tipo === 'nota').slice(0, 3);
    const frase = FRASES[d.getDate() % FRASES.length];
    const vencidas = pendientes().filter((t) => t.fecha && t.fecha < h).length;
    return '' +
      '<header class="cabecera aparece">' +
        '<div style="display:flex;justify-content:space-between;align-items:center"><span class="rotulo mostaza">Bruno OS</span>' +
        '<span><button type="button" class="btn chico" data-ir="buscar">Buscar</button> <button type="button" class="btn chico" data-ir="ajustes">Ajustes</button></span></div>' +
        '<h1 class="fecha-grande"><span class="dia">' + DIAS[d.getDay()] + ' ' + d.getDate() + '</span><span class="resto">' + MESES[d.getMonth()] + ' · ' + d.getFullYear() + '</span></h1>' +
        '<div class="linea"></div><div class="frase">' + frase + '</div>' +
      '</header>' +
      '<section class="entrada aparece">' +
        '<div class="caja"><textarea id="entrada" rows="2" placeholder="Anotá lo que aparezca…" enterkeyhint="send"></textarea>' +
        '<div class="acciones"><button type="button" class="btn primario" id="interpretar">Anotar</button></div></div>' +
        '<div class="chips tipos">' + Object.keys(TIPOS).map((k) => '<button type="button" class="chip' + (tipoElegido === k ? ' on' : '') + '" data-elegir="' + k + '">' + TIPOS[k] + '</button>').join('') + '</div>' +
        '<div class="ayuda">Se guarda solo donde corresponde: <b>agenda</b> si tiene fecha u hora, <b>plata</b> si tiene monto, <b>idea:</b> o <b>nota:</b> por prefijo; si no, <b>tarea</b>. Para dictar, el micrófono del teclado.</div>' +
      '</section>' +
      '<section class="pulso aparece">' +
        '<div><div class="num n">' + evs.length + '</div><div class="rotulo">hoy</div></div>' +
        '<div><div class="num n">' + pendientes().length + '</div><div class="rotulo">pendientes</div></div>' +
        '<div><div class="num n" style="' + (vencidas ? 'color:var(--rojo)' : '') + '">' + vencidas + '</div><div class="rotulo">vencidas</div></div>' +
      '</section>' +
      '<section class="seccion aparece"><div class="seccion-cab"><h2>Hoy</h2><button type="button" class="ver" data-ir="agenda">Agenda</button></div><div class="lista">' +
        (evs.length ? evs.map((e) => filaEvento(e, false)).join('') : '<div class="vacio">Nada agendado para hoy.' + (semana.length ? ' Lo próximo: <b>' + esc(semana[0].titulo) + '</b>, ' + relativo(semana[0].fecha) + (semana[0].hora ? ' ' + semana[0].hora : '') + '.' : '') + '</div>') +
      '</div></section>' +
      '<section class="seccion aparece"><div class="seccion-cab"><h2>Prioridades</h2><button type="button" class="ver" data-ir="tareas">Tareas</button></div><div class="lista">' +
        (pri.length ? pri.map(filaTarea).join('') : '<div class="vacio">Sin pendientes. Anotá el próximo paso de algo.</div>') +
      '</div></section>' +
      '<section class="seccion aparece"><div class="seccion-cab"><h2>Cuentas</h2><button type="button" class="ver" data-ir="cuentas">Movimientos</button></div><div class="cuentas">' +
        CUENTAS.map((c) => '<button type="button" class="cuenta" data-cuenta="' + c + '"><div class="rotulo">' + c + '</div><div class="saldo' + (s[c] < 0 ? ' neg' : '') + '">' + plata(s[c]) + '</div></button>').join('') +
      '</div></section>' +
      (ideasRec.length ? '<section class="seccion aparece"><div class="seccion-cab"><h2>Últimas ideas</h2><button type="button" class="ver" data-ir="ideas">Todas</button></div><div class="lista">' + ideasRec.map(filaIdea).join('') + '</div></section>' : '') +
      fab();
  }
  const fab = () => '<button type="button" class="fab" data-nuevo aria-label="Anotar">+</button>';
  // Caja rápida de cada sección: lo que se escribe acá va derecho a ese tipo, sin confirmar.
  function cajaRapida(tipo, placeholder) {
    return '<form class="rapida aparece" data-rapida="' + tipo + '"><input type="text" name="texto" placeholder="' + placeholder + '" autocomplete="off" autocapitalize="sentences" enterkeyhint="send"><button type="submit" class="btn primario">Anotar</button></form>';
  }
  function cajaPlata() {
    const cuentaIni = filtroCuenta || 'Personal';
    return '<form class="rapida plata aparece" data-rapida="movimiento">' +
      '<div class="fila-plata"><div class="monto-caja"><span class="peso">$</span><input type="text" name="monto" inputmode="decimal" placeholder="0" autocomplete="off"></div>' +
      '<input type="text" name="texto" placeholder="Qué fue (ej. cubiertas Suran)" autocomplete="off" autocapitalize="sentences" enterkeyhint="send"></div>' +
      '<div class="chips" style="margin-top:10px">' + [['-1', 'Gasto'], ['1', 'Ingreso']].map(([v, l], i) => '<label class="chip radio' + (i === 0 ? ' on' : '') + '"><input type="radio" name="signo" value="' + v + '"' + (i === 0 ? ' checked' : '') + '>' + l + '</label>').join('') +
      '<span style="flex:1"></span>' + CUENTAS.map((c) => '<label class="chip radio' + (c === cuentaIni ? ' on' : '') + '"><input type="radio" name="cuenta" value="' + c + '"' + (c === cuentaIni ? ' checked' : '') + '>' + c + '</label>').join('') + '</div>' +
      '<button type="submit" class="btn primario" style="width:100%;margin-top:10px;padding:14px">Anotar</button></form>';
  }
  const cabSecc = (t, extra) => '<div class="cab-secc aparece"><h1>' + t + '</h1>' + (extra || '') + '</div>';

  // ----- Agenda -----
  function agenda() {
    const h = hoy();
    const evs = items().filter((x) => x.tipo === 'evento').sort((a, b) => (a.fecha + (a.hora || '99')).localeCompare(b.fecha + (b.hora || '99')));
    const futuros = evs.filter((e) => e.fecha >= h);
    const pasados = evs.filter((e) => e.fecha < h).reverse().slice(0, 15);
    const grupos = {}; futuros.forEach((e) => { (grupos[e.fecha] = grupos[e.fecha] || []).push(e); });
    const fechas = Object.keys(grupos).sort();
    let html = cabSecc('Agenda', '<span class="rotulo">' + futuros.length + ' próximos</span>') + cajaRapida('evento', 'Qué y cuándo. Ej.: gestor el jueves a las 10');
    if (!fechas.length) html += '<div class="vacio aparece">Nada agendado. Escribí algo como <b>“turno en la verificadora el jueves a las 9”</b>.</div>';
    fechas.forEach((f) => {
      const d = deIso(f);
      html += '<div class="dia-grupo aparece' + (f === h ? ' hoy' : '') + '"><div class="dia-cab"><span class="num n">' + d.getDate() + '</span><span class="t">' + (f === h ? 'Hoy · ' : f === addDias(h, 1) ? 'Mañana · ' : '') + DIAS[d.getDay()] + ' ' + MESES_CORTO[d.getMonth()] + '</span></div><div class="lista">' + grupos[f].map((e) => filaEvento(e, false)).join('') + '</div></div>';
    });
    if (pasados.length) html += '<section class="seccion aparece"><div class="seccion-cab"><h2 class="muted">Pasados</h2></div><div class="lista">' + pasados.map((e) => filaEvento(e, true)).join('') + '</div></section>';
    return html + fab();
  }

  // ----- Tareas -----
  function tareas() {
    const todas = items().filter((x) => x.tipo === 'tarea');
    const lista = filtroTareas === 'hechas' ? todas.filter((t) => t.estado === 'hecha').sort((a, b) => (b.hecho || '').localeCompare(a.hecho || '')) : prioridades();
    return cabSecc('Tareas', '<span class="rotulo">' + pendientes().length + ' pendientes</span>') +
      cajaRapida('tarea', 'Qué hay que hacer. Ej.: llamar a Juan') +
      '<div class="chips aparece" style="margin:10px 0 16px">' + [['pendientes', 'Pendientes'], ['hechas', 'Hechas']].map(([k, l]) => '<button type="button" class="chip' + (filtroTareas === k ? ' on' : '') + '" data-filtro-tareas="' + k + '">' + l + '</button>').join('') + '</div>' +
      '<div class="lista aparece">' + (lista.length ? lista.map(filaTarea).join('') : '<div class="vacio">' + (filtroTareas === 'hechas' ? 'Todavía nada terminado.' : 'Sin pendientes. Anotá el próximo paso de algo.') + '</div>') + '</div>' + fab();
  }

  // ----- Cuentas -----
  function cuentas() {
    const s = saldos();
    const movs = items().filter((x) => x.tipo === 'movimiento' && (!filtroCuenta || x.cuenta === filtroCuenta)).sort((a, b) => (b.fecha + b.creado).localeCompare(a.fecha + a.creado));
    const mes = hoy().slice(0, 7);
    const delMes = movs.filter((m) => (m.fecha || '').startsWith(mes));
    const ing = delMes.filter((m) => m.monto > 0).reduce((a, m) => a + m.monto, 0);
    const gas = delMes.filter((m) => m.monto < 0).reduce((a, m) => a + m.monto, 0);
    return cabSecc('Cuentas') + cajaPlata() +
      '<div class="cuentas aparece">' + CUENTAS.map((c) => '<button type="button" class="cuenta" data-filtro-cuenta="' + c + '" style="' + (filtroCuenta === c ? 'outline:1px solid var(--mostaza);outline-offset:-1px' : '') + '"><div class="rotulo">' + c + '</div><div class="saldo' + (s[c] < 0 ? ' neg' : '') + '">' + plata(s[c]) + '</div></button>').join('') + '</div>' +
      '<div class="pulso aparece"><div><div class="num n" style="font-size:22px;color:var(--mostaza)">' + plata(ing) + '</div><div class="rotulo">entró este mes</div></div><div><div class="num n" style="font-size:22px;color:var(--blanco)">' + plata(gas) + '</div><div class="rotulo">salió este mes</div></div></div>' +
      '<section class="seccion aparece"><div class="seccion-cab"><h2>' + (filtroCuenta || 'Movimientos') + '</h2>' + (filtroCuenta ? '<button type="button" class="ver" data-filtro-cuenta="">Todas</button>' : '') + '</div><div class="lista">' +
      (movs.length ? movs.map(filaMov).join('') : '<div class="vacio">Sin movimientos. Escribí <b>“cobré 150 mil seña del Corsa”</b> o <b>“gasté $42.000 en cubiertas”</b>.</div>') + '</div></section>' + fab();
  }

  // ----- Ideas -----
  function ideas() {
    const lista = items().filter((x) => x.tipo === 'idea' || x.tipo === 'nota');
    return cabSecc('Ideas', '<span class="rotulo">' + lista.length + '</span>') + cajaRapida('idea', 'Una idea, tal cual venga') +
      '<div class="lista aparece" style="margin-top:14px">' + (lista.length ? lista.map(filaIdea).join('') : '<div class="vacio">Nada todavía. Empezá con <b>“idea: …”</b> o <b>“nota: …”</b>.</div>') + '</div>' + fab();
  }

  // ----- Buscar -----
  function buscar() {
    const q = sinAcentos(busqueda.trim().toLowerCase());
    const res = q ? items().filter((x) => sinAcentos((x.titulo + ' ' + (x.area || '') + ' ' + (x.cuenta || '')).toLowerCase()).includes(q)).slice(0, 60) : [];
    return cabSecc('Buscar', '<button type="button" class="btn chico" data-ir="inicio">Cerrar</button>') +
      '<div class="buscar aparece" style="margin-top:12px"><input id="q" type="search" placeholder="Palabra, auto, persona, monto…" value="' + esc(busqueda) + '" autocomplete="off"></div>' +
      '<div class="lista aparece" style="margin-top:16px">' + (q ? (res.length ? res.map(filaGenerica).join('') : '<div class="vacio">Nada con “' + esc(busqueda) + '”.</div>') : '<div class="vacio">Busca en todo: agenda, tareas, plata, ideas y notas.</div>') + '</div>';
  }
  function filaGenerica(x) {
    const cuando = x.tipo === 'movimiento' ? plata(x.monto) : x.tipo === 'evento' ? (relativo(x.fecha) + (x.hora ? ' ' + x.hora : '')) : x.fecha ? relativo(x.fecha) : relativo(iso(new Date(x.creado)));
    return '<div class="fila' + (x.estado === 'hecha' ? ' hecha' : '') + '" data-abrir="' + x.id + '"><span class="resultado-tipo">' + TIPOS[x.tipo] + '</span><div><div class="titulo">' + esc(x.titulo) + '</div><div class="meta">' + [cuando, x.area || x.cuenta].filter(Boolean).join(' · ') + '</div></div><div></div></div>';
  }

  // ----- Ajustes -----
  function ajustes() {
    const n = items().length;
    return cabSecc('Ajustes', '<button type="button" class="btn chico" data-ir="inicio">Volver</button>') +
      '<div class="aparece" style="margin-top:12px">' +
      '<div class="ajuste"><div class="texto">Copia de seguridad<div class="small muted">' + n + ' registros. Guardá el archivo en Archivos o Drive cada tanto: si perdés el teléfono, esto es lo único que queda.</div></div><button type="button" class="btn" data-exportar>Guardar</button></div>' +
      '<div class="ajuste"><div class="texto">Restaurar copia<div class="small muted">Reemplaza todo lo que hay por el archivo que elijas.</div></div><label class="btn" for="importar" style="display:inline-block">Elegir</label><input id="importar" type="file" accept="application/json,.json" style="display:none"></div>' +
      '<div class="ajuste"><div class="texto">Borrar todo<div class="small muted">Sin vuelta atrás. Hacé una copia antes.</div></div><button type="button" class="btn peligro" data-borrar-todo>Borrar</button></div>' +
      '<div class="ajuste"><div class="texto">Versión<div class="small muted">BRUNO OS v4 · datos en este teléfono · sin servidor</div></div></div>' +
      '</div>';
  }

  // ---------- Sheets ----------
  const sheetRoot = $('#sheet-root');
  function abrirSheet(html) { sheetRoot.innerHTML = '<div class="backdrop" data-cerrar></div><div class="sheet" role="dialog"><div class="asa"></div>' + html + '</div>'; }
  function cerrarSheet() { sheetRoot.innerHTML = ''; }

  function campoTipo(tipo) {
    return '<div class="campo"><label>Qué es</label><div class="chips">' + Object.keys(TIPOS).map((k) => '<button type="button" class="chip' + (tipo === k ? ' on' : '') + '" data-tipo="' + k + '">' + TIPOS[k] + '</button>').join('') + '</div></div>';
  }
  function formulario(p) {
    const areaSel = '<select name="area">' + AREAS.map((a) => '<option' + (p.area === a ? ' selected' : '') + '>' + a + '</option>').join('') + '</select>';
    let campos = '<div class="campo"><label>Título</label><input name="titulo" value="' + esc(p.titulo) + '" autocomplete="off"></div>';
    if (p.tipo === 'evento') campos += '<div class="campo"><div class="dos"><div><label>Fecha</label><input name="fecha" type="date" value="' + (p.fecha || hoy()) + '"></div><div><label>Hora</label><input name="hora" type="time" value="' + (p.hora || '') + '"></div></div></div><div class="campo"><label>Área</label>' + areaSel + '</div>';
    if (p.tipo === 'tarea') campos += '<div class="campo"><div class="dos"><div><label>Para cuándo (opcional)</label><input name="fecha" type="date" value="' + (p.fecha || '') + '"></div><div><label>Área</label>' + areaSel + '</div></div></div><div class="campo"><label class="chips" style="display:flex;align-items:center;gap:10px;text-transform:none;letter-spacing:0;font-size:15px;color:var(--blanco)"><input type="checkbox" name="prioridad" style="width:20px;height:20px;padding:0"' + (p.prioridad ? ' checked' : '') + '> Prioridad</label></div>';
    if (p.tipo === 'movimiento') campos += '<div class="campo"><div class="chips">' + [['-1', 'Gasto'], ['1', 'Ingreso']].map(([v, l]) => '<button type="button" class="chip' + (String(p.signo || -1) === v ? ' on' : '') + '" data-signo="' + v + '">' + l + '</button>').join('') + '</div></div><div class="campo"><div class="dos"><div><label>Monto</label><input name="monto" type="text" inputmode="decimal" value="' + (Math.abs(p.monto || 0) || '') + '" placeholder="0"></div><div><label>Cuenta</label><select name="cuenta">' + CUENTAS.map((c) => '<option' + (p.cuenta === c ? ' selected' : '') + '>' + c + '</option>').join('') + '</select></div></div></div><div class="campo"><label>Fecha</label><input name="fecha" type="date" value="' + (p.fecha || hoy()) + '"></div>';
    if (p.tipo === 'idea' || p.tipo === 'nota') campos += '<div class="campo"><label>Área</label>' + areaSel + '</div>';
    return campos;
  }
  let propuesta = null;
  function sheetConfirmar(p, esEdicion) {
    if (p.tipo === 'movimiento' && !p.signo) p.signo = p.monto < 0 ? -1 : (p.monto > 0 ? 1 : -1);
    propuesta = p;
    abrirSheet('<div class="sheet-cab"><h2>' + (esEdicion ? 'Editar' : 'Confirmar') + '</h2><span class="rotulo">' + TIPOS[p.tipo] + '</span></div>' +
      '<form id="form-item">' + campoTipo(p.tipo) + formulario(p) +
      '<div class="pie">' + (esEdicion ? '<button type="button" class="btn peligro" data-eliminar="' + p.id + '">Eliminar</button>' : '<button type="button" class="btn" data-cerrar>Cancelar</button>') + '<button type="submit" class="btn primario">Guardar</button></div></form>');
  }
  function leerFormulario(form) {
    const fd = new FormData(form);
    const p = Object.assign({}, propuesta);
    p.titulo = (fd.get('titulo') || '').toString().trim();
    if (fd.has('fecha')) p.fecha = fd.get('fecha') || null;
    if (fd.has('hora')) p.hora = fd.get('hora') || null;
    if (fd.has('area')) p.area = fd.get('area');
    if (fd.has('cuenta')) p.cuenta = fd.get('cuenta');
    if (fd.has('monto')) { const n = Math.abs(parseFloat(String(fd.get('monto')).replace(/\./g, '').replace(',', '.')) || 0); p.monto = (p.signo || -1) * n; }
    if (p.tipo === 'tarea') p.prioridad = fd.get('prioridad') === 'on'; else delete p.prioridad;
    if (p.tipo === 'evento' && !p.fecha) p.fecha = hoy();
    if (p.tipo === 'movimiento' && !p.fecha) p.fecha = hoy();
    if (p.tipo !== 'evento') delete p.hora;
    if (p.tipo !== 'movimiento') { delete p.monto; delete p.cuenta; delete p.signo; }
    if (p.tipo === 'movimiento') { p.cuenta = p.cuenta || 'Personal'; delete p.area; }
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
    el.innerHTML = '<span>' + esc(texto) + '</span>' + (deshacer ? '<button type="button" class="deshacer" data-deshacer>' + (etiqueta || 'Deshacer') + '</button>' : '');
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
      if (tipoForzado === 'movimiento') { sheetConfirmar({ tipo: 'movimiento', titulo: p.titulo, monto: 0, cuenta: detectarCuenta(sinAcentos(texto.toLowerCase())), fecha: hoy() }, false); return null; }
      const fecha = p.fecha || null; const hora = p.hora || null;
      Object.keys(p).forEach((k) => { if (k !== 'titulo' && k !== 'area') delete p[k]; });
      p.tipo = tipoForzado;
      if (tipoForzado === 'evento') { p.fecha = fecha || hoy(); p.hora = hora; }
      if (tipoForzado === 'tarea') p.fecha = fecha;
    }
    const it = agregar(p);
    render();
    const donde = it.tipo === 'evento' ? [relativo(it.fecha), it.hora].filter(Boolean).join(' ') : it.tipo === 'movimiento' ? plata(it.monto) + ' · ' + it.cuenta : (it.tipo === 'tarea' && it.fecha) ? relativo(it.fecha) : '';
    aviso(TIPOS[it.tipo] + (donde ? ' · ' + donde : '') + ' · ' + it.titulo, () => sheetConfirmar(Object.assign({}, it), true), 'Cambiar');
    return it;
  }

  function ajustarAlto(ta) { ta.style.height = 'auto'; ta.style.height = Math.max(96, ta.scrollHeight) + 'px'; }

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
        if (!confirm('Se reemplazan ' + items().length + ' registros por ' + d.items.length + ' del archivo. ¿Seguimos?')) return;
        datos = { version: 4, items: d.items }; guardar(); vista = 'inicio'; render(); aviso('Copia restaurada');
      } catch (e) { aviso('Ese archivo no es una copia de BRUNO OS'); }
    };
    r.readAsText(file);
  }

  // ---------- Eventos (delegados) ----------
  document.addEventListener('click', (ev) => {
    const t = ev.target.closest('[data-ir],[data-nuevo],[data-hecha],[data-abrir],[data-cuenta],[data-filtro-tareas],[data-filtro-cuenta],[data-tipo],[data-signo],[data-cerrar],[data-eliminar],[data-deshacer],[data-exportar],[data-borrar-todo],[data-elegir],#interpretar');
    if (!t) return;
    if (t.matches('#interpretar')) { const ta = $('#entrada'); const v = ta.value.trim(); if (!v) { ta.focus(); return; } ta.value = ''; const f = tipoElegido; tipoElegido = null; anotarDirecto(v, f); return; }
    if (t.dataset.elegir) { tipoElegido = tipoElegido === t.dataset.elegir ? null : t.dataset.elegir; $('.chips.tipos').querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', c.dataset.elegir === tipoElegido)); const ta = $('#entrada'); if (ta) ta.focus(); return; }
    if (t.dataset.ir != null) { vista = t.dataset.ir; if (vista === 'buscar') busqueda = ''; animar = true; render(); return; }
    if (t.dataset.nuevo != null) { const tipo = vista === 'agenda' ? 'evento' : vista === 'cuentas' ? 'movimiento' : vista === 'ideas' ? 'idea' : 'tarea'; sheetConfirmar({ tipo, titulo: '', area: 'Personal', fecha: tipo === 'evento' ? hoy() : null, monto: 0, cuenta: 'Personal' }, false); const i = $('input[name=titulo]'); if (i) i.focus(); return; }
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
    if (t.dataset.cuenta) { filtroCuenta = t.dataset.cuenta; vista = 'cuentas'; render(); return; }
    if (t.dataset.filtroTareas) { filtroTareas = t.dataset.filtroTareas; render(); return; }
    if (t.dataset.filtroCuenta != null) { filtroCuenta = t.dataset.filtroCuenta || null; render(); return; }
    if (t.dataset.tipo) { const form = $('#form-item'); const p = leerFormulario(form); p.tipo = t.dataset.tipo; if (p.tipo === 'movimiento') { p.signo = p.signo || -1; p.cuenta = p.cuenta || 'Personal'; } sheetConfirmar(p, !!p.id); return; }
    if (t.dataset.signo) { const form = $('#form-item'); const p = leerFormulario(form); p.signo = +t.dataset.signo; p.monto = Math.abs(p.monto || 0) * p.signo; sheetConfirmar(p, !!p.id); return; }
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
    if (ev.target.matches('[data-rapida]')) {
      ev.preventDefault();
      const f = ev.target; const tipo = f.dataset.rapida; const texto = (f.texto.value || '').trim();
      if (tipo === 'movimiento') {
        const n = Math.round(parseFloat((f.monto.value || '').replace(/\./g, '').replace(',', '.')) || 0);
        if (!n) { f.monto.focus(); return; }
        if (!texto) { f.texto.focus(); return; }
        const signo = +((f.querySelector('[name=signo]:checked') || {}).value || -1);
        const cuenta = (f.querySelector('[name=cuenta]:checked') || {}).value || 'Personal';
        const it = agregar({ tipo: 'movimiento', titulo: cap(texto), monto: n * signo, cuenta, fecha: hoy() });
        render();
        aviso(plata(it.monto) + ' · ' + it.cuenta + ' · ' + it.titulo, () => sheetConfirmar(Object.assign({}, it), true), 'Cambiar');
        const m = $('.rapida.plata [name=monto]'); if (m) m.focus();
        return;
      }
      if (!texto) { f.texto.focus(); return; }
      anotarDirecto(texto, tipo);
      const i = $('.rapida [name=texto]'); if (i) i.focus();
      return;
    }
    if (!ev.target.matches('#form-item')) return;
    ev.preventDefault();
    const p = leerFormulario(ev.target);
    if (!p.titulo) { $('input[name=titulo]').focus(); return; }
    if (p.tipo === 'movimiento' && !p.monto) { $('input[name=monto]').focus(); return; }
    delete p.signo;
    if (p.id) { actualizar(p.id, p); aviso('Guardado'); }
    else { agregar(p); aviso(TIPOS[p.tipo] + ' anotada'); }
    cerrarSheet();
    const ta = $('#entrada'); if (ta) { ta.value = ''; }
    render();
  });

  document.addEventListener('input', (ev) => {
    if (ev.target.matches('#entrada')) ajustarAlto(ev.target);
    if (ev.target.matches('#q')) { busqueda = ev.target.value; const lista = $('.lista'); if (lista) { const tmp = document.createElement('div'); tmp.innerHTML = buscar(); lista.replaceWith(tmp.querySelector('.lista')); } }
  });
  document.addEventListener('change', (ev) => {
    if (ev.target.matches('#importar') && ev.target.files[0]) importar(ev.target.files[0]);
    if (ev.target.matches('.chip.radio input')) ev.target.closest('form').querySelectorAll('input[name="' + ev.target.name + '"]').forEach((r) => r.closest('.chip').classList.toggle('on', r.checked));
  });
  document.addEventListener('keydown', (ev) => {
    if (ev.target.matches('#entrada') && ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); $('#interpretar').click(); }
    if (ev.key === 'Escape') cerrarSheet();
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
  document.addEventListener('visibilitychange', () => { if (!document.hidden && vista === 'inicio') { animar = true; render(); } });
})();
