import { useState, useEffect } from "react";
import {
  Calendar as CalIcon,
  Bell,
  User,
  ChevronLeft,
  ChevronRight,
  Check,
  LogOut,
  Clock,
  Moon,
  SlidersHorizontal,
  Plus,
  Trash2,
  Lock,
  Users,
} from "lucide-react";

/* ---------- Paleta (de la guía, §8 — código cromático estricto) ---------- */
const C = {
  bg: "#F5F5F7",
  card: "#FFFFFF",
  husm: "#1976D2", // Hospital Santa María · Planta
  huav: "#D32F2F", // Arnau de Vilanova · Urgencias
  adjunto: "#212121",
  residente: "#757575",
  ink: "#1C1C1E",
  sub: "#6B7280",
  line: "#E6E6EA",
  ok: "#2E7D32",
};

const HOSP = {
  HUSM: { short: "Santa María", area: "Planta", color: C.husm },
  HUAV: { short: "Arnau de Vilanova", area: "Urgencias", color: C.huav },
};

/* ---------- Equipo (usuarios_publicos) ---------- */
const USERS = [
  { uid: "adj_001", nombre: "Dr. de Miguel", rol: "adjunto", nivel: null, orden: 1 },
  { uid: "adj_002", nombre: "Dr. Arias", rol: "adjunto", nivel: null, orden: 2 },
  { uid: "adj_003", nombre: "Dra. Blasco", rol: "adjunto", nivel: null, orden: 3 },
  { uid: "res_001", nombre: "Adniel García Cruz", rol: "residente", nivel: "R3", orden: 4 },
  { uid: "res_002", nombre: "Toni", rol: "residente", nivel: "R3", orden: 5 },
  { uid: "res_003", nombre: "Andrea", rol: "residente", nivel: "R4", orden: 6 },
  { uid: "res_004", nombre: "Lucero", rol: "residente", nivel: "R4", orden: 7 },
  { uid: "res_005", nombre: "Cata", rol: "residente", nivel: "R2", orden: 8 },
  { uid: "res_006", nombre: "Lino", rol: "residente", nivel: "R2", orden: 9 },
];
const userByUid = Object.fromEntries(USERS.map((u) => [u.uid, u]));

/* ---------- Cuadrante de prueba inicial (se siembra la 1.ª vez) ---------- */
const SEED = [
  { dayId: "2026-10-01", uid: "adj_001", hospital: "HUSM", horario: "15:00 – 08:00", overnight: true },
  { dayId: "2026-10-01", uid: "res_001", hospital: "HUAV", horario: "15:00 – 08:00", overnight: true },
  { dayId: "2026-10-02", uid: "adj_002", hospital: "HUSM", horario: "15:00 – 09:00", overnight: true },
  { dayId: "2026-10-03", uid: "res_003", hospital: "HUSM", horario: "09:00 – 09:00", overnight: true },
  { dayId: "2026-10-04", uid: "res_005", hospital: "HUAV", horario: "09:00 – 08:00", overnight: true },
];

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const DOW = ["L", "M", "X", "J", "V", "S", "D"];
const STORE_KEY = "gerishift:cuadrante:v1";

const pad = (n) => String(n).padStart(2, "0");
const dayKey = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
const genId = () => (window.crypto?.randomUUID?.() ?? String(Date.now()) + Math.random().toString(36).slice(2));
const isOvernight = (ini, fin) => fin <= ini;
const parseHorario = (h) => {
  const m = String(h || "").split(/[–-]/).map((x) => x.trim());
  return { ini: m[0] || "15:00", fin: m[1] || "08:00" };
};

/* Regla de visibilidad: residente en Urgencias del Arnau = privada (solo su dueño) */
const isPrivate = (s) => userByUid[s.uid]?.rol === "residente" && s.hospital === "HUAV";
const canView = (s, viewerUid) => !isPrivate(s) || s.uid === viewerUid;

const roleLabel = (u) => (u.rol === "adjunto" ? "Adjunto" : u.nivel);
const roleColor = (u) => (u.rol === "adjunto" ? C.adjunto : C.residente);
const initials = (name) =>
  name.replace(/^(Dr|Dra)\.\s*/, "").trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

/* ===================================================================== */
export default function GeriShift() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [viewerUid, setViewerUid] = useState("res_001");
  const [tab, setTab] = useState("calendar");

  const [email, setEmail] = useState("adniel.geriatria@salut.cat");
  const [pass, setPass] = useState("");
  const [authError, setAuthError] = useState("");

  const [view, setView] = useState({ y: 2026, m: 9 });
  const [mias, setMias] = useState(false);

  const [selDay, setSelDay] = useState(null);
  const [sheetIn, setSheetIn] = useState(false);

  const [editor, setEditor] = useState(null); // { initial }
  const [editorIn, setEditorIn] = useState(false);

  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [prefs, setPrefs] = useState({
    nuevoCalendario: true,
    cambiosGuardia: true,
    recordatorio24h: true,
    recordatorio2h: false,
  });

  /* Carga del cuadrante (persistente y compartido) */
  useEffect(() => {
    let active = true;
    (async () => {
      let data = null;
      try {
        if (window?.storage) {
          const r = await window.storage.get(STORE_KEY, true);
          if (r && r.value) data = JSON.parse(r.value);
        }
      } catch (e) { data = null; }
      if (!data) {
        data = SEED.map((s) => ({ ...s, id: genId() }));
        try { if (window?.storage) await window.storage.set(STORE_KEY, JSON.stringify(data), true); } catch (e) {}
      }
      if (active) { setShifts(data); setLoading(false); }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (selDay) { const r = requestAnimationFrame(() => setSheetIn(true)); return () => cancelAnimationFrame(r); }
  }, [selDay]);
  useEffect(() => {
    if (editor) { const r = requestAnimationFrame(() => setEditorIn(true)); return () => cancelAnimationFrame(r); }
  }, [editor]);

  const showToast = (msg) => { setToast(msg); window.clearTimeout(showToast._t); showToast._t = window.setTimeout(() => setToast(null), 2800); };

  const persist = async (arr) => {
    setShifts(arr);
    try { if (window?.storage) await window.storage.set(STORE_KEY, JSON.stringify(arr), true); } catch (e) { console.error(e); }
  };

  const openDay = (id) => setSelDay(id);
  const closeSheet = () => { setSheetIn(false); setTimeout(() => setSelDay(null), 260); };
  const closeEditor = () => { setEditorIn(false); setTimeout(() => setEditor(null), 260); };

  const openAdd = (dayId) => setEditor({ initial: { dayId, ini: "15:00", fin: "08:00" } });
  const openEdit = (s) => setEditor({ initial: { id: s.id, dayId: s.dayId, uid: s.uid, hospital: s.hospital, ...parseHorario(s.horario) } });

  const saveShift = (data) => {
    const exists = data.id && shifts.some((s) => s.id === data.id);
    const next = exists ? shifts.map((s) => (s.id === data.id ? data : s)) : [...shifts, { ...data, id: genId() }];
    persist(next);
    closeEditor();
    if (isPrivate(data) && data.uid !== viewerUid) {
      showToast(`Guardada · privada, solo la verá ${userByUid[data.uid].nombre}`);
    } else {
      showToast(exists ? "Cambios guardados" : "Guardia añadida");
    }
  };

  const deleteShift = (id) => { persist(shifts.filter((s) => s.id !== id)); closeEditor(); showToast("Guardia eliminada"); };

  const resetDemo = () => { persist(SEED.map((s) => ({ ...s, id: genId() }))); showToast("Cuadrante de demo restablecido"); };

  const tryLogin = () => {
    const okMail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!okMail) return setAuthError("Introduce un correo con formato válido.");
    if (!pass.trim()) return setAuthError("La contraseña no puede estar vacía.");
    setAuthError("");
    setLoggedIn(true);
  };

  /* ---------------- LOGIN ---------------- */
  if (!loggedIn) {
    return (
      <Shell>
        <div className="flex flex-col h-full" style={{ background: C.bg }}>
          <div className="h-1 flex">
            <div className="flex-1" style={{ background: C.husm }} />
            <div className="flex-1" style={{ background: C.huav }} />
          </div>
          <div className="flex-1 flex flex-col justify-center px-7">
            <div className="flex items-center gap-3 mb-8">
              <Logo />
              <div>
                <div className="text-2xl font-bold tracking-tight" style={{ color: C.ink }}>GeriShift</div>
                <div className="text-xs" style={{ color: C.sub }}>Guardias · Geriatría Lleida</div>
              </div>
            </div>
            <label className="text-xs font-medium mb-1" style={{ color: C.sub }}>Correo</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && tryLogin()}
              className="w-full rounded-xl px-4 py-3 text-[15px] outline-none mb-4 transition focus:ring-2"
              style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} placeholder="nombre@salut.cat" />
            <label className="text-xs font-medium mb-1" style={{ color: C.sub }}>Contraseña</label>
            <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} onKeyDown={(e) => e.key === "Enter" && tryLogin()}
              className="w-full rounded-xl px-4 py-3 text-[15px] outline-none mb-2 transition focus:ring-2"
              style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} placeholder="••••••••" />
            <div className="h-5 mb-1">{authError && <span className="text-xs font-medium" style={{ color: C.huav }}>{authError}</span>}</div>
            <button onClick={tryLogin} className="w-full rounded-xl py-3 text-[15px] font-semibold text-white transition active:scale-[0.99]" style={{ background: C.ink }}>Entrar</button>
            <p className="text-[11px] leading-relaxed mt-5" style={{ color: C.sub }}>
              Demo de UX. Cualquier correo válido y una contraseña te permiten entrar como
              <span className="font-medium" style={{ color: C.ink }}> Adniel (res_001)</span>. Puedes cambiar de identidad en el perfil.
            </p>
          </div>
        </div>
      </Shell>
    );
  }

  /* ---------------- APP ---------------- */
  const viewer = userByUid[viewerUid];

  return (
    <Shell>
      <div className="flex flex-col h-full relative" style={{ background: C.bg }}>
        {/* Header */}
        <div className="px-5 pt-5 pb-3" style={{ background: C.card, borderBottom: `1px solid ${C.line}` }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Logo sm />
              <span className="text-lg font-bold tracking-tight" style={{ color: C.ink }}>GeriShift</span>
            </div>
            {tab === "calendar" && (
              <button onClick={() => setMias((v) => !v)}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition active:scale-95"
                style={mias ? { background: C.ink, color: "#fff" } : { background: C.bg, color: C.ink, border: `1px solid ${C.line}` }}>
                <SlidersHorizontal size={13} /> Mis guardias
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="h-full flex items-center justify-center text-[13px]" style={{ color: C.sub }}>Cargando cuadrante…</div>
          ) : tab === "calendar" ? (
            <CalendarView view={view} setView={setView} mias={mias} viewerUid={viewerUid} shifts={shifts} onDay={openDay} />
          ) : tab === "alerts" ? (
            <AlertsView prefs={prefs} setPrefs={setPrefs} />
          ) : (
            <ProfileView viewer={viewer} viewerUid={viewerUid} setViewerUid={setViewerUid}
              onReset={resetDemo}
              onLogout={() => { setLoggedIn(false); setPass(""); setTab("calendar"); setMias(false); }} />
          )}
        </div>

        {/* Bottom nav */}
        <div className="flex" style={{ background: C.card, borderTop: `1px solid ${C.line}` }}>
          {[
            { id: "calendar", icon: CalIcon, label: "Calendario" },
            { id: "alerts", icon: Bell, label: "Alertas" },
            { id: "profile", icon: User, label: "Perfil" },
          ].map((t) => {
            const active = tab === t.id; const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} className="flex-1 flex flex-col items-center gap-1 py-2.5 transition" style={{ color: active ? C.ink : C.sub }}>
                <Icon size={21} strokeWidth={active ? 2.4 : 1.9} />
                <span className="text-[10px]" style={{ fontWeight: active ? 600 : 400 }}>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Day sheet */}
        {selDay && (
          <div className="absolute inset-0 z-20 flex items-end">
            <div onClick={closeSheet} className="absolute inset-0 transition-opacity duration-250 motion-reduce:transition-none" style={{ background: "rgba(0,0,0,0.4)", opacity: sheetIn ? 1 : 0 }} />
            <div className="relative w-full rounded-t-3xl transition-transform duration-250 ease-out motion-reduce:transition-none" style={{ background: C.bg, transform: sheetIn ? "translateY(0)" : "translateY(100%)", maxHeight: "80%" }}>
              <DaySheet dayId={selDay} shifts={shifts} viewerUid={viewerUid} onClose={closeSheet} onAdd={openAdd} onEdit={openEdit} />
            </div>
          </div>
        )}

        {/* Editor sheet */}
        {editor && (
          <div className="absolute inset-0 z-30 flex items-end">
            <div onClick={closeEditor} className="absolute inset-0 transition-opacity duration-250 motion-reduce:transition-none" style={{ background: "rgba(0,0,0,0.45)", opacity: editorIn ? 1 : 0 }} />
            <div className="relative w-full rounded-t-3xl transition-transform duration-250 ease-out motion-reduce:transition-none" style={{ background: C.bg, transform: editorIn ? "translateY(0)" : "translateY(100%)", maxHeight: "92%" }}>
              <EditorSheet initial={editor.initial} onSave={saveShift} onDelete={deleteShift} onClose={closeEditor} />
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div className="absolute left-0 right-0 z-40 flex justify-center pointer-events-none" style={{ bottom: 72 }}>
            <div className="px-4 py-2 rounded-full text-[12.5px] font-medium text-white shadow-lg" style={{ background: C.ink }}>{toast}</div>
          </div>
        )}
      </div>
    </Shell>
  );
}

/* ---------------- Vista Calendario ---------------- */
function CalendarView({ view, setView, mias, viewerUid, shifts, onDay }) {
  const { y, m } = view;
  const first = new Date(y, m, 1);
  const startCol = (first.getDay() + 6) % 7;
  const days = new Date(y, m + 1, 0).getDate();
  const cells = [...Array(startCol).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const today = new Date();
  const isToday = (d) => d && today.getFullYear() === y && today.getMonth() === m && today.getDate() === d;

  const onDayShifts = (id) => shifts.filter((s) => s.dayId === id && canView(s, viewerUid));

  const shift = (delta) => {
    let nm = m + delta, ny = y;
    if (nm < 0) { nm = 11; ny--; } else if (nm > 11) { nm = 0; ny++; }
    setView({ y: ny, m: nm });
  };

  return (
    <div className="px-4 pt-4 pb-6">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => shift(-1)} className="p-2 rounded-full active:bg-black/5" style={{ color: C.sub }} aria-label="Mes anterior"><ChevronLeft size={20} /></button>
        <div className="text-center">
          <div className="text-base font-bold" style={{ color: C.ink }}>{MESES[m]} {y}</div>
          <div className="text-[10px]" style={{ color: C.sub }}>Toca un día para ver o añadir guardias</div>
        </div>
        <button onClick={() => shift(1)} className="p-2 rounded-full active:bg-black/5" style={{ color: C.sub }} aria-label="Mes siguiente"><ChevronRight size={20} /></button>
      </div>

      <div className="grid grid-cols-7 mb-1.5">
        {DOW.map((d) => <div key={d} className="text-center text-[11px] font-semibold" style={{ color: C.sub }}>{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((d, i) => {
          if (!d) return <div key={i} className="aspect-square" />;
          const id = dayKey(y, m, d);
          const ss = onDayShifts(id);
          const isMine = ss.some((s) => s.uid === viewerUid);
          const dim = mias && !isMine ? 0.15 : 1;
          return (
            <button key={i} onClick={() => onDay(id)}
              className="aspect-square rounded-xl flex flex-col items-center justify-start pt-1.5 transition active:scale-95 motion-reduce:transition-none"
              style={{ background: C.card, border: `1px solid ${isToday(d) ? C.ink : C.line}`, opacity: dim }}>
              <span className="text-[13px] font-semibold" style={{ color: C.ink }}>{d}</span>
              <div className="flex gap-1 mt-1 h-1.5">
                {ss.slice(0, 3).map((s, k) => <span key={k} className="w-1.5 h-1.5 rounded-full" style={{ background: HOSP[s.hospital].color }} />)}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-5 rounded-2xl px-4 py-3 flex flex-col gap-2" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        <LegendRow color={C.husm} title="Santa María" sub="Planta" />
        <LegendRow color={C.huav} title="Arnau de Vilanova" sub="Urgencias" />
      </div>
    </div>
  );
}

function LegendRow({ color, title, sub }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
      <span className="text-[13px] font-semibold" style={{ color: C.ink }}>{title}</span>
      <span className="text-[12px]" style={{ color: C.sub }}>· {sub}</span>
    </div>
  );
}

/* ---------------- Day sheet ---------------- */
function DaySheet({ dayId, shifts, viewerUid, onClose, onAdd, onEdit }) {
  const ss = shifts.filter((s) => s.dayId === dayId && canView(s, viewerUid));
  const [yy, mm, dd] = dayId.split("-").map(Number);
  const fecha = `${dd} de ${MESES[mm - 1]} de ${yy}`;
  const blocks = ["HUSM", "HUAV"]
    .map((h) => ({ hospital: h, items: ss.filter((s) => s.hospital === h).sort((a, b) => userByUid[a.uid].orden - userByUid[b.uid].orden) }))
    .filter((b) => b.items.length);

  return (
    <div className="overflow-y-auto" style={{ maxHeight: "100%" }}>
      <div className="flex justify-center pt-2.5 pb-1"><div className="w-10 h-1 rounded-full" style={{ background: C.line }} /></div>
      <div className="px-5 pt-2 pb-6">
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wide" style={{ color: C.sub }}>Guardias del día</div>
            <div className="text-lg font-bold" style={{ color: C.ink }}>{fecha}</div>
          </div>
          <button onClick={onClose} className="text-[13px] font-semibold px-1" style={{ color: C.sub }}>Cerrar</button>
        </div>

        {blocks.length === 0 && (
          <div className="rounded-2xl px-4 py-7 text-center text-[13px] mb-4" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.sub }}>
            No hay guardias este día. Añade la primera abajo.
          </div>
        )}

        {blocks.map((b) => {
          const meta = HOSP[b.hospital];
          return (
            <div key={b.hospital} className="mb-4 rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
              <div className="px-4 py-2.5" style={{ background: meta.color }}>
                <div className="text-[14px] font-bold text-white leading-tight">{meta.short}</div>
                <div className="text-[11px] text-white" style={{ opacity: 0.85 }}>{meta.area}</div>
              </div>
              <div style={{ background: C.card }}>
                {b.items.map((s, i) => {
                  const u = userByUid[s.uid];
                  return (
                    <button key={s.id} onClick={() => onEdit(s)} className="w-full flex items-center gap-3 px-4 py-3 text-left transition active:bg-black/5" style={{ borderTop: i ? `1px solid ${C.line}` : "none" }}>
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0" style={{ background: roleColor(u) }}>{initials(u.nombre)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[14px] font-semibold truncate" style={{ color: C.ink }}>{u.nombre}</span>
                          {isPrivate(s) && <Lock size={11} style={{ color: C.sub }} />}
                        </div>
                        <div className="flex items-center gap-1.5 text-[12px]" style={{ color: C.sub }}>
                          {s.overnight && <Moon size={12} />}<Clock size={12} />{s.horario}
                        </div>
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md shrink-0" style={{ background: C.bg, color: roleColor(u) }}>{roleLabel(u)}</span>
                      <ChevronRight size={15} style={{ color: C.line }} />
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        <button onClick={() => onAdd(dayId)} className="w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 text-[14px] font-semibold transition active:scale-[0.99]" style={{ background: C.ink, color: "#fff" }}>
          <Plus size={18} /> Añadir guardia
        </button>
      </div>
    </div>
  );
}

/* ---------------- Editor de guardia (crear / editar / borrar) ---------------- */
function EditorSheet({ initial, onSave, onDelete, onClose }) {
  const editing = !!initial.id;
  const initUid = initial.uid || "res_001";
  const [uid, setUid] = useState(initUid);
  const [date, setDate] = useState(initial.dayId);
  const [hospital, setHospital] = useState(initial.hospital || (userByUid[initUid].rol === "adjunto" ? "HUSM" : "HUAV"));
  const [ini, setIni] = useState(initial.ini || "15:00");
  const [fin, setFin] = useState(initial.fin || "08:00");
  const [confirmDel, setConfirmDel] = useState(false);

  const sel = userByUid[uid];
  const isAdj = sel.rol === "adjunto";
  const effHospital = isAdj ? "HUSM" : hospital;
  const priv = !isAdj && effHospital === "HUAV";
  const overnight = isOvernight(ini, fin);

  const onPerson = (val) => {
    setUid(val);
    const u = userByUid[val];
    if (u.rol === "adjunto") setHospital("HUSM");
  };

  const save = () => {
    onSave({ id: initial.id, dayId: date, uid, hospital: effHospital, horario: `${ini} – ${fin}`, overnight });
  };

  const LocBtn = ({ code, label, sub }) => {
    const meta = HOSP[code]; const active = effHospital === code;
    return (
      <button onClick={() => setHospital(code)} className="flex-1 rounded-xl px-3 py-2.5 text-left transition" style={{ background: active ? meta.color : C.card, border: `1px solid ${active ? meta.color : C.line}` }}>
        <div className="text-[13px] font-semibold" style={{ color: active ? "#fff" : C.ink }}>{label}</div>
        <div className="text-[11px]" style={{ color: active ? "rgba(255,255,255,0.85)" : C.sub }}>{sub}</div>
      </button>
    );
  };

  return (
    <div className="overflow-y-auto" style={{ maxHeight: "100%" }}>
      <div className="flex justify-center pt-2.5 pb-1"><div className="w-10 h-1 rounded-full" style={{ background: C.line }} /></div>
      <div className="px-5 pt-2 pb-7">
        <div className="flex items-center justify-between mb-5">
          <div className="text-lg font-bold" style={{ color: C.ink }}>{editing ? "Editar guardia" : "Nueva guardia"}</div>
          <button onClick={onClose} className="text-[13px] font-semibold px-1" style={{ color: C.sub }}>Cancelar</button>
        </div>

        <Field label="Fecha">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-xl px-3 py-2.5 text-[15px] outline-none focus:ring-2" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />
        </Field>

        <Field label="Persona">
          <select value={uid} onChange={(e) => onPerson(e.target.value)} className="w-full rounded-xl px-3 py-2.5 text-[15px] outline-none focus:ring-2 appearance-none" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }}>
            <optgroup label="Adjuntos">
              {USERS.filter((u) => u.rol === "adjunto").map((u) => <option key={u.uid} value={u.uid}>{u.nombre}</option>)}
            </optgroup>
            <optgroup label="Residentes">
              {USERS.filter((u) => u.rol === "residente").map((u) => <option key={u.uid} value={u.uid}>{u.nombre} · {u.nivel}</option>)}
            </optgroup>
          </select>
        </Field>

        <Field label="Lugar">
          {isAdj ? (
            <div className="rounded-xl px-3 py-2.5" style={{ background: C.card, border: `1px solid ${C.line}` }}>
              <div className="text-[13px] font-semibold" style={{ color: C.ink }}>Santa María</div>
              <div className="text-[11px]" style={{ color: C.sub }}>Planta · los adjuntos solo hacen guardia aquí</div>
            </div>
          ) : (
            <div className="flex gap-2">
              <LocBtn code="HUAV" label="Arnau" sub="Urgencias" />
              <LocBtn code="HUSM" label="Santa María" sub="Planta" />
            </div>
          )}
        </Field>

        <Field label="Horario">
          <div className="flex items-center gap-2">
            <input type="time" value={ini} onChange={(e) => setIni(e.target.value)} className="flex-1 rounded-xl px-3 py-2.5 text-[15px] outline-none focus:ring-2" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />
            <span style={{ color: C.sub }}>–</span>
            <input type="time" value={fin} onChange={(e) => setFin(e.target.value)} className="flex-1 rounded-xl px-3 py-2.5 text-[15px] outline-none focus:ring-2" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />
          </div>
          {overnight && <div className="text-[11px] mt-1.5 flex items-center gap-1" style={{ color: C.sub }}><Moon size={11} /> Termina al día siguiente (+1)</div>}
        </Field>

        <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 mb-5" style={{ background: priv ? "#FDECEC" : "#EAF2FB" }}>
          {priv ? <Lock size={14} style={{ color: C.huav }} /> : <Users size={14} style={{ color: C.husm }} />}
          <span className="text-[12px]" style={{ color: priv ? C.huav : C.husm }}>
            {priv ? `Privada · solo la verá ${sel.nombre}` : "Pública · la verá todo el equipo"}
          </span>
        </div>

        <button onClick={save} className="w-full rounded-2xl py-3.5 text-[14px] font-semibold text-white transition active:scale-[0.99] mb-3" style={{ background: C.ink }}>
          {editing ? "Guardar cambios" : "Añadir guardia"}
        </button>

        {editing && (
          confirmDel ? (
            <button onClick={() => onDelete(initial.id)} className="w-full flex items-center justify-center gap-2 rounded-2xl py-3 text-[14px] font-semibold text-white transition" style={{ background: C.huav }}>
              <Trash2 size={16} /> Tocar de nuevo para eliminar
            </button>
          ) : (
            <button onClick={() => setConfirmDel(true)} className="w-full flex items-center justify-center gap-2 rounded-2xl py-3 text-[14px] font-semibold transition" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.huav }}>
              <Trash2 size={16} /> Eliminar guardia
            </button>
          )
        )}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="mb-4">
      <div className="text-[11px] font-medium uppercase tracking-wide mb-1.5 px-1" style={{ color: C.sub }}>{label}</div>
      {children}
    </div>
  );
}

/* ---------------- Alertas ---------------- */
function AlertsView({ prefs, setPrefs }) {
  const items = [
    { k: "nuevoCalendario", t: "Nuevo cuadrante publicado", d: "Aviso cuando se publica el mes." },
    { k: "cambiosGuardia", t: "Cambios en mi guardia", d: "Si modifican una guardia tuya." },
    { k: "recordatorio24h", t: "Recordatorio 24 h antes", d: "El día previo a tu guardia." },
    { k: "recordatorio2h", t: "Recordatorio 2 h antes", d: "Justo antes de empezar." },
  ];
  return (
    <div className="px-4 pt-5 pb-6">
      <div className="text-lg font-bold mb-1" style={{ color: C.ink }}>Alertas</div>
      <p className="text-[12px] mb-4" style={{ color: C.sub }}>Elige qué avisos quieres recibir.</p>
      <div className="rounded-2xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        {items.map((it, i) => (
          <div key={it.k} className="flex items-center gap-3 px-4 py-3.5" style={{ borderTop: i ? `1px solid ${C.line}` : "none" }}>
            <div className="flex-1">
              <div className="text-[14px] font-semibold" style={{ color: C.ink }}>{it.t}</div>
              <div className="text-[12px]" style={{ color: C.sub }}>{it.d}</div>
            </div>
            <Toggle on={prefs[it.k]} onClick={() => setPrefs((p) => ({ ...p, [it.k]: !p[it.k] }))} />
          </div>
        ))}
      </div>
      <p className="text-[11px] mt-4 leading-relaxed" style={{ color: C.sub }}>El envío de notificaciones push se activará en una fase posterior.</p>
    </div>
  );
}

function Toggle({ on, onClick }) {
  return (
    <button onClick={onClick} className="w-11 h-6 rounded-full p-0.5 transition-colors motion-reduce:transition-none shrink-0" style={{ background: on ? C.husm : "#D1D1D6" }} aria-pressed={on}>
      <div className="w-5 h-5 rounded-full bg-white transition-transform motion-reduce:transition-none" style={{ transform: on ? "translateX(20px)" : "translateX(0)" }} />
    </button>
  );
}

/* ---------------- Perfil ---------------- */
function ProfileView({ viewer, viewerUid, setViewerUid, onReset, onLogout }) {
  const [confirmReset, setConfirmReset] = useState(false);
  return (
    <div className="px-4 pt-5 pb-6">
      <div className="rounded-2xl px-5 py-5 flex items-center gap-4 mb-5" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-base font-bold text-white" style={{ background: roleColor(viewer) }}>{initials(viewer.nombre)}</div>
        <div>
          <div className="text-[16px] font-bold" style={{ color: C.ink }}>{viewer.nombre}</div>
          <div className="text-[13px]" style={{ color: C.sub }}>{viewer.rol === "adjunto" ? "Adjunto · Geriatría" : `Residente ${viewer.nivel} · Geriatría`}</div>
        </div>
      </div>

      <div className="text-[11px] font-medium uppercase tracking-wide mb-2 px-1" style={{ color: C.sub }}>Ver el calendario como</div>
      <div className="rounded-2xl overflow-hidden mb-5" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        {USERS.map((u, i) => (
          <button key={u.uid} onClick={() => setViewerUid(u.uid)} className="w-full flex items-center gap-3 px-4 py-3 text-left" style={{ borderTop: i ? `1px solid ${C.line}` : "none" }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0" style={{ background: roleColor(u) }}>{initials(u.nombre)}</div>
            <div className="flex-1">
              <div className="text-[14px] font-medium" style={{ color: C.ink }}>{u.nombre}</div>
              <div className="text-[11px]" style={{ color: C.sub }}>{u.rol === "adjunto" ? "Adjunto" : u.nivel}</div>
            </div>
            {u.uid === viewerUid && <Check size={18} style={{ color: C.husm }} />}
          </button>
        ))}
      </div>

      <div className="text-[11px] font-medium uppercase tracking-wide mb-2 px-1" style={{ color: C.sub }}>Cuadrante</div>
      <button onClick={() => (confirmReset ? (onReset(), setConfirmReset(false)) : setConfirmReset(true))}
        className="w-full rounded-2xl py-3 text-[13px] font-semibold mb-5" style={{ background: C.card, border: `1px solid ${C.line}`, color: confirmReset ? C.huav : C.sub }}>
        {confirmReset ? "Tocar de nuevo para borrar todo y restablecer la demo" : "Restablecer cuadrante de demo"}
      </button>

      <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 text-[14px] font-semibold" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.huav }}>
        <LogOut size={17} /> Cerrar sesión
      </button>
    </div>
  );
}

/* ---------------- Marco de móvil + logo ---------------- */
function Shell({ children }) {
  return (
    <div className="w-full min-h-screen flex items-center justify-center p-0 sm:p-6" style={{ background: "#E4E4E9", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <div className="w-full sm:max-w-[400px] sm:rounded-[2rem] overflow-hidden sm:shadow-2xl" style={{ height: "100dvh", maxHeight: "880px", background: C.bg }}>
        {children}
      </div>
    </div>
  );
}

function Logo({ sm }) {
  const s = sm ? 24 : 40;
  return (
    <div className="rounded-xl overflow-hidden flex shrink-0" style={{ width: s, height: s, boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }}>
      <div className="flex-1" style={{ background: C.husm }} />
      <div className="flex-1" style={{ background: C.huav }} />
    </div>
  );
}
