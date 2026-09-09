const { useState, useMemo, useEffect } = React;

function useSystemStyles() {
  useEffect(() => {
    if (document.getElementById("bruno-os-ios-styles")) return;
    const style = document.createElement("style");
    style.id = "bruno-os-ios-styles";
    style.textContent = `
      @keyframes bruno-sheet-in {
        from { transform: translateY(100%); }
        to { transform: translateY(0); }
      }
      @keyframes bruno-backdrop-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes bruno-fade-scale-in {
        from { opacity: 0; transform: scale(0.96); }
        to { opacity: 1; transform: scale(1); }
      }
      .bruno-row {
        transition: background-color 0.15s ease;
        -webkit-tap-highlight-color: transparent;
      }
      .bruno-row:active {
        background-color: rgba(255,255,255,0.06);
      }
      .bruno-btn {
        transition: transform 0.12s ease, opacity 0.12s ease;
        -webkit-tap-highlight-color: transparent;
      }
      .bruno-btn:active {
        transform: scale(0.96);
        opacity: 0.75;
      }
      .bruno-checkbox {
        transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.15s ease;
      }
      .bruno-checkbox:active {
        transform: scale(0.85);
      }
      .bruno-tab {
        transition: opacity 0.15s ease;
        -webkit-tap-highlight-color: transparent;
      }
      .bruno-tab:active {
        opacity: 0.5;
      }
      * {
        -webkit-tap-highlight-color: transparent;
      }
      input, select, textarea {
        font: inherit;
      }
      .bruno-bg {
        position: fixed;
        inset: 0;
        z-index: 0;
        pointer-events: none;
        background:
          radial-gradient(ellipse 900px 600px at 20% -10%, rgba(90,80,60,0.16), transparent 60%),
          radial-gradient(ellipse 700px 500px at 100% 0%, rgba(50,60,90,0.14), transparent 55%),
          radial-gradient(ellipse 800px 800px at 50% 120%, rgba(70,50,80,0.10), transparent 60%),
          #050505;
      }
      .bruno-bg::after {
        content: "";
        position: absolute;
        inset: 0;
        opacity: 0.05;
        mix-blend-mode: overlay;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
      }
    `;
    document.head.appendChild(style);
  }, []);
}

const FONT_DISPLAY = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif";
const FONT_BODY = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif";

const AREAS = ["Personal", "ALEZZA", "Autos", "Sistemas", "Dinero", "Cuerpo", "Música"];
const CUENTAS = ["Personal", "ALEZZA", "Autos"];

const uid = () => Math.random().toString(36).slice(2, 10);

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function addDays(iso, n) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  const dias = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${dias[d.getDay()]} ${d.getDate()} ${meses[d.getMonth()]}`;
}
function fmtMoney(n) {
  return "$" + Math.round(n).toLocaleString("es-AR");
}

const DIAS_SEMANA = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

// ---------- SEED DATA ----------
const seedItems = [
  { id: uid(), tipo: "evento", titulo: "Entrenamiento", fecha: todayISO(), hora: "09:30", area: "Cuerpo", estado: "pendiente" },
  { id: uid(), tipo: "evento", titulo: "Ver vehículo", fecha: todayISO(), hora: "17:00", area: "Autos", estado: "pendiente" },
  { id: uid(), tipo: "evento", titulo: "Sesión DJ", fecha: todayISO(), hora: "20:00", area: "Música", estado: "pendiente" },
  { id: uid(), tipo: "tarea", titulo: "Llamar a Juan por verificación policial", fecha: todayISO(), area: "Autos", prioridad: 1, estado: "pendiente" },
  { id: uid(), tipo: "tarea", titulo: "Preparar vehículo para fotos", fecha: todayISO(), area: "ALEZZA", prioridad: 2, estado: "pendiente" },
  { id: uid(), tipo: "tarea", titulo: "Avanzar proyecto BRUNO OS", fecha: null, area: "Sistemas", prioridad: 3, estado: "pendiente" },
  { id: uid(), tipo: "tarea", titulo: "Revisar documentación de la Suran", fecha: addDays(todayISO(), 1), area: "Autos", prioridad: 4, estado: "pendiente" },
  { id: uid(), tipo: "tarea", titulo: "Actualizar publicación Marketplace", fecha: addDays(todayISO(), 2), area: "ALEZZA", prioridad: 5, estado: "completada" },
  { id: uid(), tipo: "idea", titulo: "Ofrecer preparación integral antes de publicar vehículos", area: "ALEZZA" },
  { id: uid(), tipo: "nota", titulo: "El comprador de la Corsa pidió factura A", area: "Autos" },
  { id: uid(), tipo: "movimiento", titulo: "Productos de limpieza", monto: -42000, cuenta: "ALEZZA", fecha: todayISO(), area: "ALEZZA" },
  { id: uid(), tipo: "movimiento", titulo: "Seña vehículo Corsa", monto: 150000, cuenta: "Autos", fecha: addDays(todayISO(), -1), area: "Autos" },
  { id: uid(), tipo: "movimiento", titulo: "Sesión DJ evento privado", monto: 60000, cuenta: "Personal", fecha: addDays(todayISO(), -2), area: "Música" },
];

const seedProyectos = [
  { id: uid(), nombre: "BRUNO OS", descripcion: "Beta funcional del sistema personal", area: "Sistemas", proximaAccion: "Definir parser de registro rápido", estado: "en curso" },
  { id: uid(), nombre: "ALEZZA — Captación de vehículos", descripcion: "Ampliar fuentes de compra de unidades", area: "ALEZZA", proximaAccion: "Contactar dos concesionarias", estado: "en curso" },
  { id: uid(), nombre: "Música — Identidad DJ", descripcion: "Construcción de marca e identidad como DJ", area: "Música", proximaAccion: "Grabar set de referencia", estado: "pendiente" },
];

// ---------- PARSER (reglas simples, sin IA) ----------
function parseInput(text) {
  const raw = text.trim();
  const lower = raw.toLowerCase();

  // Movimiento financiero
  const gastoMatch = lower.match(/gast[eé]\s+(\d+)/);
  const ingresoMatch = lower.match(/(?:cobr[eé]|ingres[eé]|recib[ií])\s+(\d+)/);
  if (gastoMatch || ingresoMatch) {
    const m = gastoMatch || ingresoMatch;
    const monto = parseInt(m[1], 10) * (gastoMatch ? -1 : 1);
    let cuenta = "Personal";
    let area = "Dinero";
    for (const c of CUENTAS) {
      if (lower.includes(c.toLowerCase())) { cuenta = c; area = c === "Personal" ? "Dinero" : c; }
    }
    const titulo = raw.replace(/^\S+\s+\d+\s*/, "").replace(/^en\s+/, "") || (gastoMatch ? "Gasto" : "Ingreso");
    return { tipo: "movimiento", titulo: titulo.charAt(0).toUpperCase() + titulo.slice(1), monto, cuenta, area, fecha: todayISO() };
  }

  // Idea
  if (lower.startsWith("idea:") || lower.startsWith("idea ")) {
    const titulo = raw.replace(/^idea:?\s*/i, "");
    return { tipo: "idea", titulo, area: detectArea(lower) };
  }

  // Nota / recordar
  if (lower.startsWith("recordar") || lower.startsWith("nota:") || lower.startsWith("nota ")) {
    const titulo = raw.replace(/^(recordar|nota:?)\s*/i, "");
    return { tipo: "nota", titulo, area: detectArea(lower) };
  }

  // Fecha / turno / evento
  let fecha = null;
  let hora = null;
  if (lower.includes("mañana")) fecha = addDays(todayISO(), 1);
  else if (lower.includes("hoy")) fecha = todayISO();
  else {
    for (let i = 0; i < DIAS_SEMANA.length; i++) {
      if (lower.includes(DIAS_SEMANA[i])) {
        const today = new Date(todayISO() + "T00:00:00");
        let diff = (i - today.getDay() + 7) % 7;
        if (diff === 0) diff = 7;
        fecha = addDays(todayISO(), diff);
      }
    }
  }
  const horaMatch = lower.match(/(\d{1,2})(?::(\d{2}))?\s*h?s?\b/);
  if (horaMatch && (lower.includes("a las") || lower.includes("turno") || lower.includes("hs"))) {
    hora = `${horaMatch[1].padStart(2, "0")}:${horaMatch[2] || "00"}`;
  }

  const esEvento = lower.includes("turno") || (hora && (lower.includes("a las") || lower.includes("tengo")));

  const titulo = raw;
  if (esEvento) {
    return { tipo: "evento", titulo, fecha: fecha || todayISO(), hora, area: detectArea(lower) };
  }
  return { tipo: "tarea", titulo, fecha, area: detectArea(lower), prioridad: null };
}

function detectArea(lower) {
  if (lower.includes("alezza")) return "ALEZZA";
  if (lower.includes("auto") || lower.includes("vehículo") || lower.includes("vehiculo") || lower.includes("suran") || lower.includes("corsa")) return "Autos";
  if (lower.includes("dj") || lower.includes("música") || lower.includes("musica")) return "Música";
  if (lower.includes("gimnasio") || lower.includes("entrenamiento") || lower.includes("médico") || lower.includes("dentista")) return "Cuerpo";
  if (lower.includes("bruno os") || lower.includes("sistema")) return "Sistemas";
  if (lower.includes("gast") || lower.includes("cobr") || lower.includes("plata") || lower.includes("dinero")) return "Dinero";
  return "Personal";
}

// ---------- UI PRIMITIVES ----------
const COLOR = {
  bg: "#050505",
  bgRaised: "rgba(255,255,255,0.045)",
  ink: "#ffffff",
  inkDim: "#9a9a95",
  inkFaint: "#5c5b56",
  line: "#2a2a26",
  lineStrong: "#403f39",
};

const styles = {
  app: {
    maxWidth: 420,
    margin: "0 auto",
    minHeight: "100vh",
    background: "transparent",
    color: COLOR.ink,
    fontFamily: FONT_BODY,
    display: "flex",
    flexDirection: "column",
    position: "relative",
    zIndex: 1,
  },
  main: { flex: 1, overflowY: "auto", padding: "20px 18px 100px" },
  nav: {
    position: "sticky",
    bottom: 0,
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
    background: "rgba(10,10,10,0.9)",
    borderTop: `1px solid ${COLOR.line}`,
    padding: "10px 4px 14px",
    backdropFilter: "blur(10px)",
  },
  navBtn: (active) => ({
    background: "none",
    border: "none",
    color: active ? COLOR.ink : COLOR.inkFaint,
    fontSize: 11,
    fontFamily: FONT_BODY,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    cursor: "pointer",
    padding: "4px 6px",
  }),
  fab: {
    width: 50,
    height: 50,
    borderRadius: "50%",
    background: COLOR.ink,
    color: COLOR.bg,
    border: "none",
    fontSize: 24,
    fontFamily: FONT_BODY,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    marginTop: -18,
  },
  card: {
    background: COLOR.bgRaised,
    border: `1px solid ${COLOR.line}`,
    borderRadius: 14,
    padding: "14px 16px",
    marginBottom: 10,
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
  },
  sectionTitle: {
    fontSize: 12,
    color: COLOR.inkDim,
    margin: "24px 0 8px",
    marginLeft: 4,
    fontFamily: FONT_BODY,
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "0.4px",
  },
  h1: { fontSize: 28, fontWeight: 700, margin: "2px 0 2px", fontFamily: FONT_DISPLAY, letterSpacing: "0.34px" },
  sub: { color: COLOR.inkDim, fontSize: 14, marginBottom: 4 },
  group: {
    background: COLOR.bgRaised,
    border: `1px solid ${COLOR.line}`,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 10,
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
  },
  groupRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "13px 16px",
    borderBottom: `1px solid ${COLOR.line}`,
  },
  groupRowLast: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "13px 16px",
  },
  chevron: { color: COLOR.inkFaint, fontSize: 15, marginLeft: "auto" },
  input: {
    width: "100%",
    background: COLOR.bg,
    border: `1px solid ${COLOR.lineStrong}`,
    borderRadius: 12,
    padding: "12px 14px",
    color: COLOR.ink,
    fontFamily: FONT_BODY,
    fontSize: 15,
    outline: "none",
    boxSizing: "border-box",
  },
  select: {
    background: COLOR.bgRaised,
    border: `1px solid ${COLOR.lineStrong}`,
    borderRadius: 10,
    padding: "8px 10px",
    color: COLOR.ink,
    fontFamily: FONT_BODY,
    fontSize: 13,
  },
  btn: (primary) => ({
    background: primary ? COLOR.ink : "transparent",
    color: primary ? COLOR.bg : COLOR.ink,
    border: primary ? "none" : `1px solid ${COLOR.lineStrong}`,
    borderRadius: 100,
    padding: "10px 16px",
    fontFamily: FONT_BODY,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  }),
  pill: (bg, color) => ({
    display: "inline-block",
    fontSize: 11,
    fontWeight: 500,
    fontFamily: FONT_BODY,
    padding: "3px 9px",
    borderRadius: 100,
    background: bg,
    color: color,
  }),
  checkbox: (done) => ({
    width: 20,
    height: 20,
    borderRadius: "50%",
    border: done ? "none" : `1.5px solid ${COLOR.lineStrong}`,
    background: done ? COLOR.ink : "transparent",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
    color: COLOR.bg,
    fontSize: 12,
  }),
  fieldInput: {
    background: "none",
    border: "none",
    outline: "none",
    color: COLOR.ink,
    fontFamily: FONT_BODY,
    fontSize: 15,
    textAlign: "right",
    width: "100%",
    padding: 0,
  },
  fieldInputNarrow: {
    background: "none",
    border: "none",
    outline: "none",
    color: COLOR.ink,
    fontFamily: FONT_BODY,
    fontSize: 15,
    textAlign: "right",
    padding: 0,
  },
};

const areaColor = {
  Personal: "#7f77dd",
  ALEZZA: "#d85a30",
  Autos: "#378add",
  Sistemas: "#888780",
  Dinero: "#639922",
  Cuerpo: "#d4537e",
  Música: "#ba7517",
};
const areaIcon = {
  Personal: "◆",
  ALEZZA: "▲",
  Autos: "▤",
  Sistemas: "▣",
  Dinero: "▮",
  Cuerpo: "✚",
  Música: "♪",
};
const tipoIcon = {
  evento: "📅",
  tarea: "○",
  idea: "✦",
  nota: "▤",
  movimiento: "$",
};
function AreaPill({ area }) {
  const c = areaColor[area] || "#888";
  return <span style={styles.pill(c + "22", c)}>{area}</span>;
}

// ---------- APP ----------
function BrunoOS() {
  useSystemStyles();
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem("brunoos_items");
      return raw ? JSON.parse(raw) : seedItems;
    } catch (e) {
      return seedItems;
    }
  });
  const [proyectos, setProyectos] = useState(() => {
    try {
      const raw = localStorage.getItem("brunoos_proyectos");
      return raw ? JSON.parse(raw) : seedProyectos;
    } catch (e) {
      return seedProyectos;
    }
  });

  useEffect(() => {
    try { localStorage.setItem("brunoos_items", JSON.stringify(items)); } catch (e) {}
  }, [items]);
  useEffect(() => {
    try { localStorage.setItem("brunoos_proyectos", JSON.stringify(proyectos)); } catch (e) {}
  }, [proyectos]);
  const [tab, setTab] = useState("inicio");
  const [registrarOpen, setRegistrarOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [filtroAreaTareas, setFiltroAreaTareas] = useState(null);
  const [quickMovimientoOpen, setQuickMovimientoOpen] = useState(false);

  const tareasPendientes = items.filter((i) => i.tipo === "tarea" && i.estado === "pendiente");
  const eventosHoy = items.filter((i) => i.tipo === "evento" && i.fecha === todayISO()).sort((a, b) => (a.hora || "").localeCompare(b.hora || ""));
  const prioridades = [...tareasPendientes].filter((t) => t.prioridad).sort((a, b) => a.prioridad - b.prioridad).slice(0, 3);
  const agendaSemana = items
    .filter((i) => (i.tipo === "evento" || i.tipo === "tarea") && i.fecha && i.fecha >= todayISO() && i.fecha <= addDays(todayISO(), 6))
    .sort((a, b) => (a.fecha + (a.hora || "23:59")).localeCompare(b.fecha + (b.hora || "23:59")))
    .slice(0, 5);

  const saldos = useMemo(() => {
    const s = { Personal: 0, ALEZZA: 0, Autos: 0 };
    items.filter((i) => i.tipo === "movimiento").forEach((m) => { s[m.cuenta] = (s[m.cuenta] || 0) + m.monto; });
    return s;
  }, [items]);

  function addItem(newItem) {
    setItems((prev) => [{ id: uid(), estado: "pendiente", ...newItem }, ...prev]);
  }
  function toggleTarea(id) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, estado: i.estado === "completada" ? "pendiente" : "completada" } : i)));
  }
  function deleteItem(id) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }
  function updateItem(id, patch) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  return (
    <div style={styles.app}>
      <div className="bruno-bg" />
      <div style={styles.main}>
        {tab === "inicio" && (
          <InicioView
            eventosHoy={eventosHoy}
            prioridades={prioridades}
            tareasPendientes={tareasPendientes}
            agendaSemana={agendaSemana}
            saldos={saldos}
            items={items}
            onOpenRegistrar={() => setRegistrarOpen(true)}
            onToggleTarea={toggleTarea}
            setTab={setTab}
            onEditItem={setEditando}
            onFiltrarArea={(a) => { setFiltroAreaTareas(a); setTab("tareas"); }}
            onQuickMovimiento={() => setQuickMovimientoOpen(true)}
          />
        )}
        {tab === "agenda" && <AgendaView items={items} onEditItem={setEditando} />}
        {tab === "tareas" && (
          <TareasView
            items={items}
            onToggle={toggleTarea}
            onDelete={deleteItem}
            onEditItem={setEditando}
            filtroInicial={filtroAreaTareas}
            onFiltroConsumido={() => setFiltroAreaTareas(null)}
          />
        )}
        {tab === "mas" && <MasView items={items} proyectos={proyectos} saldos={saldos} onAddMovimiento={addItem} onDeleteItem={deleteItem} onEditItem={setEditando} />}
      </div>

      <nav style={styles.nav}>
        <NavItem label="Inicio" icon="●" active={tab === "inicio"} onClick={() => setTab("inicio")} />
        <NavItem label="Agenda" icon="▤" active={tab === "agenda"} onClick={() => setTab("agenda")} />
        <button className="bruno-btn" style={styles.fab} onClick={() => setRegistrarOpen(true)} aria-label="Registrar">+</button>
        <NavItem label="Tareas" icon="✓" active={tab === "tareas"} onClick={() => setTab("tareas")} />
        <NavItem label="Más" icon="≡" active={tab === "mas"} onClick={() => setTab("mas")} />
      </nav>

      {registrarOpen && (
        <RegistrarModal onClose={() => setRegistrarOpen(false)} onSave={(item) => { addItem(item); setRegistrarOpen(false); }} />
      )}

      {editando && (
        <EditarModal
          item={editando}
          onClose={() => setEditando(null)}
          onSave={(patch) => { updateItem(editando.id, patch); setEditando(null); }}
          onDelete={() => { deleteItem(editando.id); setEditando(null); }}
        />
      )}

      {quickMovimientoOpen && (
        <QuickMovimientoSheet
          onClose={() => setQuickMovimientoOpen(false)}
          onSave={(mov) => { addItem(mov); setQuickMovimientoOpen(false); }}
        />
      )}
    </div>
  );
}

function NavItem({ label, icon, active, onClick }) {
  return (
    <button className="bruno-tab" style={styles.navBtn(active)} onClick={onClick}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      {label}
    </button>
  );
}

// ---------- INICIO ----------
function InicioView({ eventosHoy, prioridades, tareasPendientes, agendaSemana, saldos, items, onOpenRegistrar, onToggleTarea, setTab, onEditItem, onFiltrarArea, onQuickMovimiento }) {
  return (
    <div>
      <p style={styles.sub}>{fmtDate(todayISO())}</p>
      <h1 style={styles.h1}>Buen día, Bruno.</h1>

      <div style={styles.sectionTitle}>Próximos compromisos</div>
      {eventosHoy.length === 0 && <p style={{ color: "#5c5b56", fontSize: 14 }}>No hay compromisos cargados para hoy.</p>}
      {eventosHoy.map((e) => (
        <div key={e.id} className="bruno-row" style={{ ...styles.card, cursor: "pointer" }} onClick={() => onEditItem(e)}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{
                width: 34, height: 34, borderRadius: 10, background: (areaColor[e.area] || "#666") + "26",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0,
              }}>{tipoIcon.evento}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{e.titulo}</div>
                <div style={{ color: "#9a9a95", fontSize: 13, marginTop: 2 }}>{e.hora || "sin hora"}</div>
              </div>
            </div>
            <AreaPill area={e.area} />
          </div>
        </div>
      ))}

      <div style={styles.sectionTitle}>Prioridades</div>
      {prioridades.length === 0 && <p style={{ color: "#5c5b56", fontSize: 14 }}>No hay prioridades marcadas.</p>}
      {prioridades.map((t, idx) => (
        <div key={t.id} className="bruno-row" style={{ ...styles.card, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{
            width: 26, height: 26, borderRadius: "50%", background: "#e0912a", color: "#0a0a0a",
            fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>{idx + 1}</span>
          <span className="bruno-checkbox" style={styles.checkbox(false)} onClick={() => onToggleTarea(t.id)} />
          <span style={{ flex: 1, fontSize: 14, cursor: "pointer" }} onClick={() => onEditItem(t)}>{t.titulo}</span>
        </div>
      ))}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div style={styles.sectionTitle}>Agenda</div>
        <button className="bruno-btn" onClick={() => setTab("agenda")} style={{ background: "none", border: "none", color: "#9a9a95", fontSize: 13, fontFamily: FONT_BODY, cursor: "pointer", marginTop: 16 }}>
          Ver semana ›
        </button>
      </div>
      <div style={styles.group}>
        {agendaSemana.length === 0 && (
          <div style={styles.groupRowLast}><span style={{ fontSize: 14, color: "#5c5b56" }}>Nada agendado esta semana.</span></div>
        )}
        {agendaSemana.map((i, idx) => {
          const c = areaColor[i.area] || "#9a9a95";
          const esUltimo = idx === agendaSemana.length - 1;
          return (
            <div
              key={i.id}
              className="bruno-row"
              style={{ ...(esUltimo ? styles.groupRowLast : styles.groupRow), cursor: "pointer" }}
              onClick={() => onEditItem(i)}
            >
              <span style={{ fontSize: 13, color: "#9a9a95", width: 40, flexShrink: 0 }}>{i.hora || fmtDate(i.fecha).slice(0, 3)}</span>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: c, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 14 }}>{i.titulo}</span>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div style={styles.sectionTitle}>Resumen</div>
        <button
          className="bruno-btn"
          onClick={onQuickMovimiento}
          style={{
            width: 26, height: 26, borderRadius: "50%", background: COLOR.ink, color: COLOR.bg,
            border: "none", fontSize: 16, fontWeight: 600, cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center", marginTop: 14,
          }}
          aria-label="Agregar gasto o ingreso"
        >
          +
        </button>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {CUENTAS.map((c) => (
          <div key={c} style={{ ...styles.card, flex: 1, marginBottom: 0 }}>
            <div style={{ fontSize: 12, color: "#9a9a95" }}>Caja {c}</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4 }}>{fmtMoney(saldos[c] || 0)}</div>
          </div>
        ))}
      </div>

      <div style={styles.sectionTitle}>Áreas clave</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {AREAS.filter((a) => a !== "Sistemas" || items.some((i) => i.area === "Sistemas")).slice(0, 4).map((a) => {
          const c = areaColor[a];
          const abiertos = items.filter((i) => i.area === a && i.tipo === "tarea" && i.estado === "pendiente").length;
          return (
            <div
              key={a}
              className="bruno-row"
              style={{ background: c, borderRadius: 14, padding: "14px 14px", cursor: "pointer" }}
              onClick={() => onFiltrarArea(a)}
            >
              <span style={{
                fontSize: 15, color: "#fff", width: 30, height: 30, borderRadius: 8,
                background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center",
              }}>{areaIcon[a]}</span>
              <div style={{ fontWeight: 700, fontSize: 15, marginTop: 10, color: "#fff" }}>{a}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 2 }}>
                {abiertos > 0 ? `${abiertos} pendiente${abiertos > 1 ? "s" : ""}` : "al día"}
              </div>
            </div>
          );
        })}
      </div>

      <div style={styles.sectionTitle}>Tareas pendientes</div>
      {tareasPendientes.slice(0, 4).map((t) => (
        <div key={t.id} className="bruno-row" style={{ ...styles.card, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 13, color: "#5c5b56" }}>{tipoIcon.tarea}</span>
          <span className="bruno-checkbox" style={styles.checkbox(false)} onClick={() => onToggleTarea(t.id)} />
          <span style={{ flex: 1, fontSize: 14, cursor: "pointer" }} onClick={() => onEditItem(t)}>{t.titulo}</span>
          <AreaPill area={t.area} />
        </div>
      ))}
      <button style={{ ...styles.btn(false), width: "100%", marginTop: 4 }} onClick={() => setTab("tareas")}>Ver todas</button>

      <div style={styles.sectionTitle}>Capturar algo</div>
      <button style={{ ...styles.input, display: "flex", alignItems: "center", gap: 8, textAlign: "left", color: "#5c5b56", cursor: "pointer" }} onClick={onOpenRegistrar}>
        <span style={{ flex: 1 }}>Escribir una tarea, idea, fecha o gasto…</span>
        <span style={{ fontSize: 16, color: COLOR.inkDim, flexShrink: 0 }}>🎙️</span>
      </button>
    </div>
  );
}

// ---------- AGENDA ----------
function AgendaView({ items, onEditItem }) {
  const dias = Array.from({ length: 7 }, (_, i) => addDays(todayISO(), i));
  return (
    <div>
      <h1 style={styles.h1}>Agenda</h1>
      <p style={styles.sub}>Próximos 7 días</p>
      {dias.map((fecha) => {
        const delDia = items.filter((i) => (i.tipo === "evento" || i.tipo === "tarea") && i.fecha === fecha);
        return (
          <div key={fecha} style={{ marginTop: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#ffffff", marginBottom: 8, textTransform: "capitalize" }}>{fmtDate(fecha)}</div>
            {delDia.length === 0 && <p style={{ color: "#5c5b56", fontSize: 13 }}>Sin actividad.</p>}
            {delDia.sort((a, b) => (a.hora || "99").localeCompare(b.hora || "99")).map((i) => (
              <div key={i.id} className="bruno-row" style={{ ...styles.card, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={() => onEditItem(i)}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 14 }}>{tipoIcon[i.tipo]}</span>
                  <div>
                    <span style={styles.pill(i.tipo === "evento" ? "#378add22" : "#88878022", i.tipo === "evento" ? "#85b7eb" : "#b4b2a9")}>
                      {i.tipo === "evento" ? "evento" : "tarea"}
                    </span>
                    <div style={{ marginTop: 6, fontSize: 14 }}>{i.titulo}</div>
                    {i.hora && <div style={{ fontSize: 12, color: "#9a9a95", marginTop: 2 }}>{i.hora}</div>}
                  </div>
                </div>
                <AreaPill area={i.area} />
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ---------- TAREAS ----------
function TareasView({ items, onToggle, onDelete, onEditItem, filtroInicial, onFiltroConsumido }) {
  const [filtroArea, setFiltroArea] = useState(filtroInicial || "Todas");
  React.useEffect(() => {
    if (filtroInicial) { setFiltroArea(filtroInicial); onFiltroConsumido(); }
  }, [filtroInicial]);

  const pendientes = items.filter((i) => i.tipo === "tarea" && i.estado === "pendiente" && (filtroArea === "Todas" || i.area === filtroArea));
  const completadas = items.filter((i) => i.tipo === "tarea" && i.estado === "completada" && (filtroArea === "Todas" || i.area === filtroArea));
  const conFecha = pendientes.filter((t) => t.fecha);
  const sinFecha = pendientes.filter((t) => !t.fecha);

  return (
    <div>
      <h1 style={styles.h1}>Tareas</h1>
      <select style={{ ...styles.select, marginTop: 8, marginBottom: 4 }} value={filtroArea} onChange={(e) => setFiltroArea(e.target.value)}>
        <option>Todas</option>
        {AREAS.map((a) => <option key={a}>{a}</option>)}
      </select>

      <div style={styles.sectionTitle}>Con fecha</div>
      {conFecha.length === 0 && <p style={{ color: "#5c5b56", fontSize: 13 }}>Nada pendiente.</p>}
      {conFecha.map((t) => (
        <TareaRow key={t.id} t={t} onToggle={onToggle} onDelete={onDelete} onEdit={onEditItem} />
      ))}

      <div style={styles.sectionTitle}>Sin fecha</div>
      {sinFecha.length === 0 && <p style={{ color: "#5c5b56", fontSize: 13 }}>Nada pendiente.</p>}
      {sinFecha.map((t) => (
        <TareaRow key={t.id} t={t} onToggle={onToggle} onDelete={onDelete} onEdit={onEditItem} />
      ))}

      <div style={styles.sectionTitle}>Completadas ({completadas.length})</div>
      {completadas.map((t) => (
        <TareaRow key={t.id} t={t} onToggle={onToggle} onDelete={onDelete} onEdit={onEditItem} done />
      ))}
    </div>
  );
}
function TareaRow({ t, onToggle, onDelete, onEdit, done }) {
  return (
    <div className="bruno-row" style={{ ...styles.card, display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 12, color: "#5c5b56" }}>{tipoIcon.tarea}</span>
      <span className="bruno-checkbox" style={styles.checkbox(done)} onClick={() => onToggle(t.id)}>{done ? "✓" : ""}</span>
      <div style={{ flex: 1, cursor: "pointer" }} onClick={() => onEdit(t)}>
        <div style={{ fontSize: 14, textDecoration: done ? "line-through" : "none", color: done ? "#5c5b56" : "#f2f2f0" }}>{t.titulo}</div>
        {t.fecha && <div style={{ fontSize: 12, color: "#9a9a95", marginTop: 2 }}>{fmtDate(t.fecha)}</div>}
      </div>
      <AreaPill area={t.area} />
      <button onClick={() => onDelete(t.id)} style={{ background: "none", border: "none", color: "#5c5b56", fontSize: 16, cursor: "pointer" }}>×</button>
    </div>
  );
}

// ---------- MAS ----------
function MasView({ items, proyectos, saldos, onAddMovimiento, onDeleteItem, onEditItem }) {
  const [sub, setSub] = useState("menu");
  const menuItems = [
    { label: "Finanzas", key: "finanzas", icon: "$", color: "#3f9e57", desc: "Cajas, gastos e ingresos" },
    { label: "Proyectos", key: "proyectos", icon: "▣", color: "#3782d4", desc: "Iniciativas en curso" },
    { label: "Ideas", key: "ideas", icon: "✦", color: "#c98a2e", desc: "Ocurrencias para revisar después" },
    { label: "Notas", key: "notas", icon: "▤", color: "#8a8a86", desc: "Apuntes sueltos" },
    { label: "Áreas", key: "areas", icon: "◆", color: "#8064c9", desc: "Vista general por área de vida" },
  ];
  if (sub === "menu") {
    return (
      <div>
        <h1 style={styles.h1}>Más</h1>
        <div style={{ ...styles.group, marginTop: 8 }}>
          {menuItems.map((item, idx) => (
            <button
              key={item.key}
              className="bruno-row"
              style={{
                ...(idx === menuItems.length - 1 ? styles.groupRowLast : styles.groupRow),
                width: "100%", background: "none", border: "none", textAlign: "left", cursor: "pointer",
                borderBottom: idx === menuItems.length - 1 ? "none" : `1px solid ${COLOR.line}`,
              }}
              onClick={() => setSub(item.key)}
            >
              <span style={{
                width: 32, height: 32, borderRadius: 9, background: item.color + "26", color: item.color,
                fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>{item.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 500 }}>{item.label}</div>
                <div style={{ fontSize: 12, color: COLOR.inkDim, marginTop: 1 }}>{item.desc}</div>
              </div>
              <span style={styles.chevron}>›</span>
            </button>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div>
      <button onClick={() => setSub("menu")} style={{ background: "none", border: "none", color: "#9a9a95", fontSize: 14, padding: 0, marginBottom: 12, cursor: "pointer" }}>‹ Más</button>
      {sub === "finanzas" && <FinanzasView items={items} saldos={saldos} onAdd={onAddMovimiento} onDelete={onDeleteItem} onEditItem={onEditItem} />}
      {sub === "proyectos" && <ProyectosView proyectos={proyectos} />}
      {sub === "ideas" && <ListaSimple items={items} tipo="idea" titulo="Ideas" onDelete={onDeleteItem} onEditItem={onEditItem} />}
      {sub === "notas" && <ListaSimple items={items} tipo="nota" titulo="Notas" onDelete={onDeleteItem} onEditItem={onEditItem} />}
      {sub === "areas" && <AreasView items={items} proyectos={proyectos} />}
    </div>
  );
}

function FinanzasView({ items, saldos, onAdd, onDelete, onEditItem }) {
  const [form, setForm] = useState({ titulo: "", monto: "", cuenta: "Personal", tipoMov: "gasto", fecha: todayISO(), area: "Dinero" });
  const movimientos = items.filter((i) => i.tipo === "movimiento").sort((a, b) => b.fecha.localeCompare(a.fecha));

  function submit() {
    if (!form.titulo || !form.monto) return;
    const monto = Math.abs(parseInt(form.monto, 10)) * (form.tipoMov === "gasto" ? -1 : 1);
    onAdd({ tipo: "movimiento", titulo: form.titulo, monto, cuenta: form.cuenta, fecha: form.fecha, area: form.area });
    setForm({ ...form, titulo: "", monto: "" });
  }

  return (
    <div>
      <h1 style={styles.h1}>Finanzas</h1>
      <div style={{ display: "flex", gap: 8, margin: "10px 0 16px" }}>
        {CUENTAS.map((c) => (
          <div key={c} style={{ ...styles.card, flex: 1, marginBottom: 0 }}>
            <div style={{ fontSize: 12, color: "#9a9a95" }}>{c}</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginTop: 4 }}>{fmtMoney(saldos[c] || 0)}</div>
          </div>
        ))}
      </div>

      <div style={styles.card}>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <select style={styles.select} value={form.tipoMov} onChange={(e) => setForm({ ...form, tipoMov: e.target.value })}>
            <option value="gasto">Gasto</option>
            <option value="ingreso">Ingreso</option>
          </select>
          <select style={styles.select} value={form.cuenta} onChange={(e) => setForm({ ...form, cuenta: e.target.value })}>
            {CUENTAS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <input style={{ ...styles.input, marginBottom: 8 }} placeholder="Descripción" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
        <div style={{ display: "flex", gap: 8 }}>
          <input style={styles.input} type="number" placeholder="Monto" value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value })} />
          <button style={styles.btn(true)} onClick={submit}>Agregar</button>
        </div>
      </div>

      <div style={styles.sectionTitle}>Movimientos recientes</div>
      {movimientos.map((m) => (
        <div key={m.id} style={{ ...styles.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 10, cursor: "pointer" }} onClick={() => onEditItem(m)}>
            <span style={{ fontSize: 14 }}>{tipoIcon.movimiento}</span>
            <div>
              <div style={{ fontSize: 14 }}>{m.titulo}</div>
              <div style={{ fontSize: 12, color: "#9a9a95", marginTop: 2 }}>{m.cuenta} · {fmtDate(m.fecha)}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontWeight: 600, color: m.monto < 0 ? "#e05a5a" : "#5fbf82" }}>{m.monto < 0 ? "-" : "+"}{fmtMoney(Math.abs(m.monto))}</span>
            <button onClick={() => onDelete(m.id)} style={{ background: "none", border: "none", color: "#5c5b56", fontSize: 16, cursor: "pointer" }}>×</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProyectosView({ proyectos }) {
  return (
    <div>
      <h1 style={styles.h1}>Proyectos</h1>
      {proyectos.map((p) => (
        <div key={p.id} style={styles.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{p.nombre}</div>
            <AreaPill area={p.area} />
          </div>
          <div style={{ fontSize: 13, color: "#9a9a95", marginTop: 4 }}>{p.descripcion}</div>
          <div style={{ fontSize: 13, marginTop: 8 }}>
            <span style={{ color: "#9a9a95" }}>Próxima acción: </span>{p.proximaAccion}
          </div>
          <div style={{ marginTop: 8 }}>
            <span style={styles.pill("#2a2a26", "#ffffff")}>{p.estado}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ListaSimple({ items, tipo, titulo, onDelete, onEditItem }) {
  const lista = items.filter((i) => i.tipo === tipo);
  return (
    <div>
      <h1 style={styles.h1}>{titulo}</h1>
      {lista.length === 0 && <p style={{ color: "#5c5b56", fontSize: 13 }}>Nada guardado todavía.</p>}
      {lista.map((i) => (
        <div key={i.id} style={{ ...styles.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 10, cursor: "pointer" }} onClick={() => onEditItem(i)}>
            <span style={{ fontSize: 14 }}>{tipoIcon[tipo]}</span>
            <div>
              <div style={{ fontSize: 14 }}>{i.titulo}</div>
              <div style={{ marginTop: 6 }}><AreaPill area={i.area} /></div>
            </div>
          </div>
          <button onClick={() => onDelete(i.id)} style={{ background: "none", border: "none", color: "#5c5b56", fontSize: 16, cursor: "pointer" }}>×</button>
        </div>
      ))}
    </div>
  );
}

function AreasView({ items, proyectos }) {
  return (
    <div>
      <h1 style={styles.h1}>Áreas</h1>
      {AREAS.map((a) => {
        const count = items.filter((i) => i.area === a && i.tipo !== "movimiento").length;
        const proys = proyectos.filter((p) => p.area === a).length;
        return (
          <div key={a} style={{ ...styles.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <AreaPill area={a} />
            </div>
            <div style={{ fontSize: 12, color: "#9a9a95" }}>{count} ítems · {proys} proyectos</div>
          </div>
        );
      })}
    </div>
  );
}

// ---------- REGISTRAR MODAL ----------
// ---------- iOS SHEET ----------
function Sheet({ title, onClose, onPrimary, primaryLabel = "Guardar", primaryDisabled, children }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        background: "rgba(0,0,0,0.55)",
        animation: "bruno-backdrop-in 0.2s ease",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: COLOR.bgRaised,
          borderRadius: "16px 16px 0 0",
          width: "100%", maxWidth: 420,
          boxSizing: "border-box",
          maxHeight: "88vh",
          display: "flex", flexDirection: "column",
          animation: "bruno-sheet-in 0.32s cubic-bezier(0.32, 0.72, 0, 1)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 8 }}>
          <div style={{ width: 36, height: 5, borderRadius: 3, background: COLOR.lineStrong }} />
        </div>

        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 16px", borderBottom: `1px solid ${COLOR.line}`,
        }}>
          <button className="bruno-btn" onClick={onClose} style={{ background: "none", border: "none", color: COLOR.inkDim, fontSize: 16, fontFamily: FONT_BODY, cursor: "pointer", padding: "4px 2px" }}>
            Cancelar
          </button>
          <div style={{ fontWeight: 600, fontSize: 16, fontFamily: FONT_BODY }}>{title}</div>
          <button
            className="bruno-btn"
            onClick={onPrimary}
            disabled={primaryDisabled}
            style={{
              background: "none", border: "none", fontSize: 16, fontWeight: 600, fontFamily: FONT_BODY,
              color: primaryDisabled ? COLOR.inkFaint : COLOR.ink,
              cursor: primaryDisabled ? "default" : "pointer", padding: "4px 2px",
            }}
          >
            {primaryLabel}
          </button>
        </div>

        <div style={{ overflowY: "auto", padding: "16px 16px 24px" }}>{children}</div>
      </div>
    </div>
  );
}

function RegistrarModal({ onClose, onSave }) {
  const [texto, setTexto] = useState("");
  const [propuesta, setPropuesta] = useState(null);
  const [modoManual, setModoManual] = useState(false);
  const [hintDictado, setHintDictado] = useState(false);
  const textareaRef = React.useRef(null);

  function analizar() {
    if (!texto.trim()) return;
    setPropuesta(parseInput(texto));
  }

  if (propuesta) {
    return (
      <Sheet title="Confirmar" onClose={() => setPropuesta(null)} onPrimary={() => onSave(propuesta)} primaryLabel="Guardar">
        <PropuestaEditable propuesta={propuesta} setPropuesta={setPropuesta} />
      </Sheet>
    );
  }

  return (
    <Sheet
      title="Registrar"
      onClose={onClose}
      onPrimary={analizar}
      primaryLabel="Analizar"
      primaryDisabled={!texto.trim()}
    >
      <div style={{ position: "relative" }}>
        <textarea
          ref={textareaRef}
          autoFocus
          style={{ ...styles.input, minHeight: 76, paddingRight: 44, resize: "none" }}
          placeholder="Mañana llamar a Juan por verificación policial..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
        <button
          type="button"
          className="bruno-btn"
          onClick={() => { textareaRef.current?.focus(); setHintDictado(true); }}
          style={{
            position: "absolute", right: 8, bottom: 8, width: 32, height: 32, borderRadius: "50%",
            background: COLOR.lineStrong, border: "none", fontSize: 15, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          aria-label="Dictar por voz"
        >
          🎙️
        </button>
      </div>
      {hintDictado && (
        <p style={{ fontSize: 12, color: COLOR.inkDim, marginTop: 6 }}>
          Tocá el ícono de micrófono del teclado para dictar — el texto se completa solo.
        </p>
      )}
      <button
        className="bruno-btn"
        style={{ ...styles.btn(false), width: "100%", marginTop: 10 }}
        onClick={() => setModoManual((v) => !v)}
      >
        {modoManual ? "Ocultar carga manual" : "Cargar manualmente"}
      </button>
      {modoManual && <ManualForm onSave={onSave} />}
    </Sheet>
  );
}

function PropuestaEditable({ propuesta, setPropuesta }) {
  const p = propuesta;
  const set = (k, v) => setPropuesta({ ...p, [k]: v });
  return (
    <div style={styles.group}>
      <Field label="Tipo" last={false}>
        <select style={styles.select} value={p.tipo} onChange={(e) => set("tipo", e.target.value)}>
          {["tarea", "evento", "idea", "nota", "movimiento"].map((t) => <option key={t}>{t}</option>)}
        </select>
      </Field>
      <Field label="Título" last={false}>
        <input style={styles.fieldInput} value={p.titulo} onChange={(e) => set("titulo", e.target.value)} placeholder="Título" />
      </Field>
      <Field label="Área" last={!(p.tipo === "tarea" || p.tipo === "evento" || p.tipo === "movimiento")}>
        <select style={styles.select} value={p.area} onChange={(e) => set("area", e.target.value)}>
          {AREAS.map((a) => <option key={a}>{a}</option>)}
        </select>
      </Field>
      {(p.tipo === "tarea" || p.tipo === "evento") && (
        <Field label="Fecha" last={p.tipo === "tarea"}>
          <input style={styles.fieldInputNarrow} type="date" value={p.fecha || ""} onChange={(e) => set("fecha", e.target.value)} />
        </Field>
      )}
      {p.tipo === "evento" && (
        <Field label="Hora" last>
          <input style={styles.fieldInputNarrow} type="time" value={p.hora || ""} onChange={(e) => set("hora", e.target.value)} />
        </Field>
      )}
      {p.tipo === "movimiento" && (
        <>
          <Field label="Monto" last={false}>
            <input style={styles.fieldInputNarrow} type="number" value={p.monto} onChange={(e) => set("monto", parseInt(e.target.value || 0, 10))} />
          </Field>
          <Field label="Cuenta" last>
            <select style={styles.select} value={p.cuenta} onChange={(e) => set("cuenta", e.target.value)}>
              {CUENTAS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
        </>
      )}
    </div>
  );
}
function Field({ label, children, last }) {
  return (
    <div style={last ? styles.groupRowLast : styles.groupRow}>
      <span style={{ fontSize: 15, fontFamily: FONT_BODY, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>{children}</div>
    </div>
  );
}

function EditarModal({ item, onClose, onSave, onDelete }) {
  const [p, setP] = useState({ ...item });

  return (
    <Sheet title={`Editar ${p.tipo}`} onClose={onClose} onPrimary={() => onSave(p)} primaryLabel="Guardar">
      <PropuestaEditable propuesta={p} setPropuesta={setP} />
      <button
        className="bruno-row"
        onClick={onDelete}
        style={{
          width: "100%", marginTop: 16, background: COLOR.bgRaised, border: `1px solid ${COLOR.line}`,
          borderRadius: 14, padding: "13px 16px", color: "#e05a5a", fontSize: 15, fontFamily: FONT_BODY,
          fontWeight: 500, cursor: "pointer", textAlign: "center",
        }}
      >
        Eliminar
      </button>
    </Sheet>
  );
}

function QuickMovimientoSheet({ onClose, onSave }) {
  const [tipoMov, setTipoMov] = useState("gasto");
  const [monto, setMonto] = useState("");
  const [cuenta, setCuenta] = useState("Personal");
  const [titulo, setTitulo] = useState("");

  function submit() {
    if (!monto) return;
    const m = Math.abs(parseInt(monto, 10)) * (tipoMov === "gasto" ? -1 : 1);
    onSave({
      tipo: "movimiento",
      titulo: titulo.trim() || (tipoMov === "gasto" ? "Gasto" : "Ingreso"),
      monto: m,
      cuenta,
      area: cuenta === "Personal" ? "Dinero" : cuenta,
      fecha: todayISO(),
    });
  }

  return (
    <Sheet title="Gasto o ingreso" onClose={onClose} onPrimary={submit} primaryLabel="Guardar" primaryDisabled={!monto}>
      <div style={styles.group}>
        <Field label="Tipo" last={false}>
          <select style={styles.select} value={tipoMov} onChange={(e) => setTipoMov(e.target.value)}>
            <option value="gasto">Gasto</option>
            <option value="ingreso">Ingreso</option>
          </select>
        </Field>
        <Field label="Monto" last={false}>
          <input autoFocus style={styles.fieldInputNarrow} type="number" placeholder="0" value={monto} onChange={(e) => setMonto(e.target.value)} />
        </Field>
        <Field label="Cuenta" last={false}>
          <select style={styles.select} value={cuenta} onChange={(e) => setCuenta(e.target.value)}>
            {CUENTAS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Descripción" last>
          <input style={styles.fieldInput} placeholder="Opcional" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
        </Field>
      </div>
    </Sheet>
  );
}

function ManualForm({ onSave }) {
  const [tipo, setTipo] = useState("tarea");
  const [titulo, setTitulo] = useState("");
  const [area, setArea] = useState("Personal");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [monto, setMonto] = useState("");
  const [cuenta, setCuenta] = useState("Personal");

  function submit() {
    if (!titulo.trim()) return;
    const base = { tipo, titulo, area };
    if (tipo === "tarea" || tipo === "evento") base.fecha = fecha || null;
    if (tipo === "evento") base.hora = hora || null;
    if (tipo === "movimiento") { base.monto = parseInt(monto || 0, 10); base.cuenta = cuenta; base.fecha = todayISO(); }
    onSave(base);
  }

  return (
    <div style={{ marginTop: 12 }}>
      <div style={styles.group}>
        <Field label="Tipo" last={false}>
          <select style={styles.select} value={tipo} onChange={(e) => setTipo(e.target.value)}>
            {["tarea", "evento", "idea", "nota", "movimiento"].map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Título" last={false}>
          <input style={styles.fieldInput} placeholder="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
        </Field>
        <Field label="Área" last={!(tipo === "tarea" || tipo === "evento" || tipo === "movimiento")}>
          <select style={styles.select} value={area} onChange={(e) => setArea(e.target.value)}>
            {AREAS.map((a) => <option key={a}>{a}</option>)}
          </select>
        </Field>
        {(tipo === "tarea" || tipo === "evento") && (
          <Field label="Fecha" last={tipo === "tarea"}>
            <input style={styles.fieldInputNarrow} type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </Field>
        )}
        {tipo === "evento" && (
          <Field label="Hora" last>
            <input style={styles.fieldInputNarrow} type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
          </Field>
        )}
        {tipo === "movimiento" && (
          <>
            <Field label="Monto" last={false}>
              <input style={styles.fieldInputNarrow} type="number" value={monto} onChange={(e) => setMonto(e.target.value)} />
            </Field>
            <Field label="Cuenta" last>
              <select style={styles.select} value={cuenta} onChange={(e) => setCuenta(e.target.value)}>
                {CUENTAS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
          </>
        )}
      </div>
      <button className="bruno-btn" style={{ ...styles.btn(true), width: "100%", marginTop: 12 }} onClick={submit}>Guardar</button>
    </div>
  );
}


const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<BrunoOS />);
