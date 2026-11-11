import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  LayoutDashboard as AdIcDash,
  Map as AdIcMap,
  Layers as AdIcLayers,
  X as AdIcX,
  Sun as AdIcSun,
  Moon as AdIcMoon,
  ChevronLeft as AdIcPrev,
  ChevronRight as AdIcNext,
  Maximize2 as AdIcMax,
  Minimize2 as AdIcMin,
  Search as AdIcSearch,
  ArrowUpRight as AdIcUp,
  ArrowDownRight as AdIcDown,
  LockKeyhole,
  RefreshCw,
  Sprout,
  Activity,
  Users,
  Trophy,
  Gauge,
  Settings
} from "lucide-react";
import { supabase, BOLLE_THEMES } from "../../lib/bolleCore.jsx";
import { trackPerf } from "../../lib/tracking.js";
import { countryList, bolleCountryFromNationality } from "../../lib/geo.js";

const ERROR_MAP = [
  ["invalid_last_name", "Il cognome non è valido."],
  ["consent_required", "Serve il consenso al trattamento dei dati."],
  ["admin_locked", "Troppi tentativi. Riprova tra qualche minuto."],
  ["forbidden", "Accesso non autorizzato."],
];
function friendlyError(err) {
  const m = String(err?.message || err || "");
  const hit = ERROR_MAP.find(([k]) => m.includes(k));
  if (hit) return hit[1];
  if (m.startsWith("Profilo creato")) return m;
  return "Qualcosa non ha funzionato. Riprova.";
}

export const DELETE_REASONS = [
  ["not_using", "Non uso più l’app"],
  ["privacy", "Mi preoccupa la privacy"],
  ["notifications", "Ricevo troppe notifiche"],
  ["content", "Non trovo contenuti interessanti"],
  ["other_account", "Ho già un altro profilo"],
  ["other", "Altro"],
];

/* ====================== Portale Admin ====================== */
const EVENT_LABELS = { app_open: "Aperture app", pop: "Bolle scoppiate", publish: "Bolle pubblicate", react: "Reazioni", report: "Segnalazioni", gift_create: "Regali creati", gift_redeem: "Regali aperti", profile_view: "Visite al profilo", scope_change: "Cambio filtro feed", guest_start: "Ospiti iniziati", guest_prompt: "Inviti a registrarsi", register_start: "Registrazioni avviate", register_step: "Dati compilati", register_complete: "Registrazioni completate", login: "Accessi" };
const PERF_LABELS = { boot: "Avvio app", feed_load: "Caricamento feed", pop_rpc: "Scoppio bolla", upload: "Upload media", admin_dashboard: "Dashboard admin" };
const SEX_LABELS = { F: "Donna", M: "Uomo", X: "Altro", N: "Non specificato" };
const num = (v) => Number(v) || 0;
const fmtInt = (v) => new Intl.NumberFormat("it-IT").format(Math.round(num(v)));
const fmtDec = (v) => new Intl.NumberFormat("it-IT", { maximumFractionDigits: 1 }).format(num(v));
const adToday = () => new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Rome" });
const shiftDay = (iso, delta) => { const t = new Date(`${iso}T12:00:00`); t.setDate(t.getDate() + delta); return t.toLocaleDateString("en-CA"); };
const shortDate = (iso) => (iso ? new Date(`${iso}T12:00:00`).toLocaleDateString("it-IT", { day: "numeric", month: "short" }) : "–");
const longDate = (iso) => (iso ? new Date(`${iso}T12:00:00`).toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "long", year: "numeric" }) : "–");

// Colori semantici: ogni grandezza ha lo stesso colore in tutto il pannello.
const AD_COLORS = { dau: "#6d56d8", new_users: "#12b886", registrations: "#0e9aa7", pops: "#7c5cff", opens: "#2f9fd8", reactions: "#f0568f", publishes: "#f59e0b", gifts: "#8d7a5a", errors: "#e5484d" };
const AD_MAPS = [
  { kind: "pops", label: "Scoppi", unit: "scoppi", color: AD_COLORS.pops },
  { kind: "opens", label: "Aperture", unit: "aperture", color: AD_COLORS.opens },
  { kind: "reactions", label: "Interazioni", unit: "reazioni", color: AD_COLORS.reactions },
  { kind: "registrations", label: "Nuovi utenti", unit: "registrazioni", color: AD_COLORS.registrations },
];
const AD_VIEWS = [
  { id: "overview", label: "Panoramica", Icon: AdIcDash, hint: "Lo stato dell'app in un colpo d'occhio" },
  { id: "usage", label: "Utilizzo", Icon: Activity, hint: "Quanto e come viene usata" },
  { id: "maps", label: "Mappe", Icon: AdIcMap, hint: "Dove succedono scoppi, aperture, interazioni e iscrizioni" },
  { id: "audience", label: "Pubblico", Icon: Users, hint: "Chi sono gli utenti" },
  { id: "people", label: "Attività utenti", Icon: Trophy, hint: "Chi usa di più l'app e chi meno, utente per utente" },
  { id: "content", label: "Contenuti", Icon: AdIcLayers, hint: "Bolle, scoppi, reazioni e regali" },
  { id: "system", label: "Sistema", Icon: Gauge, hint: "Errori, prestazioni e segnalazioni" },
  { id: "settings", label: "Impostazioni", Icon: Settings, hint: "Tema dell'app, limiti e sessione" },
];
const METRIC_INFO = {
  dau: { title: "Utenti attivi nelle ultime 24 ore", description: "Utenti unici attivi nelle ultime 24 ore. Il grafico mostra invece il valore per giorno di calendario: il dato odierno può differire dalla finestra mobile di 24 ore." },
  wau: { title: "Utenti attivi negli ultimi 7 giorni", description: "Utenti unici attivi negli ultimi 7 giorni. Non è la somma dei valori giornalieri: una persona attiva più giorni conta una volta sola." },
  mau: { title: "Utenti attivi negli ultimi 30 giorni", description: "Utenti unici attivi negli ultimi 30 giorni. Non è la somma dei valori giornalieri o settimanali." },
  d1: { title: "Retention a 1 giorno", description: "Quota della coorte che torna il giorno successivo al primo evento rilevato. Le coorti recenti potrebbero non essere ancora mature." },
  d7: { title: "Retention a 7 giorni", description: "Quota della coorte che torna al settimo giorno. Il risultato dipende dagli eventi effettivamente tracciati." },
  d30: { title: "Retention a 30 giorni", description: "Quota della coorte che torna al trentesimo giorno. È significativa solo con almeno 30 giorni di osservazione." },
};

function niceScale(v) {
  const top = Math.max(1, v), raw = top / 4, p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p;
  const step = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p;
  return { step, max: step * Math.ceil(top / step) };
}
// Variazione degli ultimi 7 giorni completi rispetto ai 7 precedenti (il giorno in corso è parziale e viene escluso).
function weekDelta(series, key) {
  const rows = series.length && series[series.length - 1].date === adToday() ? series.slice(0, -1) : series;
  if (rows.length < 14) return null;
  const sum = (a) => a.reduce((s, d) => s + num(d[key]), 0);
  const prev = sum(rows.slice(-14, -7));
  return prev ? ((sum(rows.slice(-7)) - prev) / prev) * 100 : null;
}
function DeltaChip({ pct }) {
  if (pct == null) return null;
  const up = pct >= 0, Ic = up ? AdIcUp : AdIcDown;
  return <span className={`bl-ad-delta ${up ? "up" : "down"}`} title="Ultimi 7 giorni completi rispetto ai 7 precedenti"><Ic size={12} aria-hidden="true" />{Math.abs(pct).toFixed(0)}%<span className="bl-ad-sr">{up ? " in più" : " in meno"} rispetto ai 7 giorni precedenti</span></span>;
}
function Spark({ values, color }) {
  const W = 120, H = 28, max = Math.max(1, ...values);
  const pts = values.map((v, i) => `${values.length < 2 ? W / 2 : (i * W) / (values.length - 1)},${H - 3 - (v / max) * (H - 7)}`).join(" ");
  return <svg className="bl-ad-spark" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true"><polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" /></svg>;
}

/* Grafico temporale interattivo: passa il puntatore o usa le frecce della tastiera; la legenda attiva/disattiva le serie. */
function TrendChart({ data, series, type = "line", height = 210 }) {
  const [active, setActive] = useState(null);
  const [off, setOff] = useState(() => new Set());
  const n = data.length, W = 720, H = height, L = 40, R = 12, T = 12, B = 26;
  const live = series.filter((s) => !off.has(s.key));
  const { max, step } = niceScale(Math.max(1, ...data.flatMap((d) => live.map((s) => num(d[s.key])))));
  const iw = W - L - R, ih = H - T - B;
  const y = (v) => T + (1 - v / max) * ih;
  const x = (i) => (type === "bar" ? L + ((i + 0.5) * iw) / Math.max(n, 1) : n <= 1 ? L + iw / 2 : L + (i * iw) / (n - 1));
  const ticks = []; for (let t = 0; t <= max + 1e-9; t += step) ticks.push(t);
  const labelIdx = n ? [...new Set([0, Math.round((n - 1) / 4), Math.round((n - 1) / 2), Math.round((3 * (n - 1)) / 4), n - 1])] : [];
  const sel = active !== null && active < n ? active : null;
  const locate = (e) => {
    const r = e.currentTarget.getBoundingClientRect(), px = ((e.clientX - r.left) / r.width) * W;
    const i = type === "bar" ? Math.floor((px - L) / (iw / n)) : Math.round(((px - L) / iw) * (n - 1));
    setActive(Math.max(0, Math.min(n - 1, i)));
  };
  const onKey = (e) => {
    if (!n) return;
    if (e.key === "ArrowRight") { e.preventDefault(); setActive((a) => Math.min(n - 1, (a ?? -1) + 1)); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); setActive((a) => Math.max(0, (a ?? n) - 1)); }
    else if (e.key === "Home") setActive(0); else if (e.key === "End") setActive(n - 1); else if (e.key === "Escape") setActive(null);
  };
  const toggle = (key) => setOff((s) => { const nx = new Set(s); if (nx.has(key)) nx.delete(key); else if (nx.size < series.length - 1) nx.add(key); return nx; });
  const group = (iw / Math.max(n, 1)) * 0.72, bw = Math.max(2, group / Math.max(live.length, 1));
  return <div className="bl-ad-chart">
    <div className="bl-ad-legend" role="group" aria-label="Serie visibili">{series.map((s) => <button type="button" key={s.key} aria-pressed={!off.has(s.key)} onClick={() => toggle(s.key)}><i style={{ background: s.color }} />{s.name}</button>)}</div>
    <div className="bl-ad-chart-box" tabIndex={0} onKeyDown={onKey} onPointerLeave={() => setActive(null)} aria-label="Grafico. Usa le frecce sinistra e destra per leggere i valori di ogni giorno.">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={series.map((s) => s.name).join(", ")} onPointerMove={locate} onPointerDown={locate}>
        {ticks.map((t) => <g key={t}><line x1={L} x2={W - R} y1={y(t)} y2={y(t)} className="bl-ad-grid" /><text x={L - 7} y={y(t) + 4} textAnchor="end" className="bl-ad-axis">{fmtInt(t)}</text></g>)}
        {labelIdx.map((i) => <text key={i} x={x(i)} y={H - 7} textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"} className="bl-ad-axis">{shortDate(data[i]?.date)}</text>)}
        {type === "bar"
          ? data.map((d, i) => live.map((s, j) => <rect key={`${i}-${s.key}`} x={x(i) - group / 2 + j * bw} y={y(num(d[s.key]))} width={Math.max(1, bw - 1)} height={Math.max(0, y(0) - y(num(d[s.key])))} rx="2" fill={s.color} opacity={sel === null || sel === i ? 1 : 0.45} />))
          : live.map((s, k) => <g key={s.key}>
              {k === 0 && n > 1 && <polygon points={`${x(0)},${y(0)} ${data.map((d, i) => `${x(i)},${y(num(d[s.key]))}`).join(" ")} ${x(n - 1)},${y(0)}`} fill={s.color} opacity=".09" />}
              <polyline fill="none" stroke={s.color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" strokeDasharray={s.dash} points={data.map((d, i) => `${x(i)},${y(num(d[s.key]))}`).join(" ")} />
            </g>)}
        {sel !== null && <g pointerEvents="none"><line x1={x(sel)} x2={x(sel)} y1={T} y2={H - B} className="bl-ad-cross" />{type !== "bar" && live.map((s) => <circle key={s.key} cx={x(sel)} cy={y(num(data[sel][s.key]))} r="4.2" fill={s.color} className="bl-ad-dot" />)}</g>}
      </svg>
      {sel !== null && <div className="bl-ad-tip" role="status" style={{ left: `clamp(92px, ${(x(sel) / W) * 100}%, calc(100% - 92px))` }}>
        <strong>{longDate(data[sel].date)}</strong>
        {live.map((s) => {
          const v = num(data[sel][s.key]), p = sel > 0 ? num(data[sel - 1][s.key]) : null;
          const vr = p === null ? "" : p === 0 ? (v === 0 ? "" : "da 0") : `${v >= p ? "+" : ""}${(((v - p) / p) * 100).toFixed(0)}%`;
          return <span key={s.key}><i style={{ background: s.color }} />{s.name}<b>{fmtInt(v)}</b>{vr && <small>{vr}</small>}</span>;
        })}
      </div>}
    </div>
    {!n && <p className="bl-ad-empty">Ancora nessun dato per questo periodo.</p>}
  </div>;
}

function Distribution({ rows, color = AD_COLORS.dau, empty = "Ancora nessun dato." }) {
  const total = rows.reduce((s, r) => s + r.value, 0), max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.length) return <p className="bl-ad-empty">{empty}</p>;
  return <ul className="bl-ad-dist">{rows.map((r) => <li key={r.label}>
    <span className="bl-ad-dist-l">{r.label}{r.sub && <small>{r.sub}</small>}</span>
    <span className="bl-ad-track"><i style={{ width: `${(r.value / max) * 100}%`, background: color }} /></span>
    <b>{fmtInt(r.value)}</b><small>{total ? Math.round((r.value / total) * 100) : 0}%</small>
  </li>)}</ul>;
}
function Panel({ title, note, actions, children, className = "" }) {
  return <section className={`bl-ad-panel ${className}`}><header className="bl-ad-panel-h"><div><h3>{title}</h3>{note && <p>{note}</p>}</div>{actions && <div className="bl-ad-panel-a">{actions}</div>}</header>{children}</section>;
}
function Drilldown({ metric, c, onClose }) {
  if (!metric) return null;
  const info = METRIC_INFO[metric], isRet = ["d1", "d7", "d30"].includes(metric), r = c.ret[metric] || {};
  return <section className="bl-ad-drill" aria-live="polite">
    <header><h3>{info.title}</h3><button type="button" className="bl-ad-icon" onClick={onClose} aria-label="Chiudi dettaglio"><AdIcX size={16} /></button></header>
    <p>{info.description}</p>
    {isRet
      ? <div className="bl-ad-trio"><div><b>{fmtInt(r.retained)}</b><small>Utenti tornati</small></div><div><b>{fmtInt(r.cohort)}</b><small>Utenti nella coorte</small></div><div><b>{num(r.rate)}%</b><small>Tasso</small></div></div>
      : <div className="bl-ad-trio"><div><b>{fmtInt(c.K[metric])}</b><small>Utenti unici</small></div></div>}
    {metric === "dau" && <TrendChart data={c.series} series={[{ key: "dau", name: "Utenti attivi per giorno", color: AD_COLORS.dau }]} height={200} />}
    {(metric === "wau" || metric === "mau") && <p className="bl-ad-note">Il dettaglio storico di {metric.toUpperCase()} non è restituito dall'attuale funzione SQL: qui compare solo il totale verificato, senza stime.</p>}
    {isRet && <p className="bl-ad-note">Il server restituisce solo gli aggregati, non le singole coorti per data.</p>}
  </section>;
}

/* ---------------------------- Mappe ---------------------------- */
let leafletPromise = null;
function loadLeaflet() {
  if (window.L && window.L.heatLayer) return Promise.resolve(window.L);
  if (leafletPromise) return leafletPromise;
  const addScript = (src) => new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.async = true; s.onload = res; s.onerror = () => rej(new Error(src)); document.head.appendChild(s); });
  leafletPromise = (async () => {
    if (!document.querySelector("link[data-bolle-leaflet]")) { const l = document.createElement("link"); l.rel = "stylesheet"; l.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"; l.dataset.bolleLeaflet = "1"; document.head.appendChild(l); }
    if (!window.L) await addScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js");
    if (!window.L.heatLayer) await addScript("https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js");
    return window.L;
  })().catch((e) => { leafletPromise = null; throw e; });
  return leafletPromise;
}
const OSM_TILES = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const cleanPoints = (pts) => (pts || []).map((p) => ({ lat: +p.lat, lng: +p.lng, count: +p.count })).filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng) && Number.isFinite(p.count) && p.count > 0 && Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180);
function heatGradient(hex) {
  const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255, k = (m) => `rgb(${Math.round(r * m)},${Math.round(g * m)},${Math.round(b * m)})`;
  return { 0.15: `rgba(${r},${g},${b},0.18)`, 0.45: `rgba(${r},${g},${b},0.55)`, 0.75: hex, 1: k(0.62) };
}
function normHourly(h) {
  return Array.isArray(h) && h.length === 24 ? h : Array.from({ length: 24 }, (_, hour) => ({ hour, current: 0, week: 0, month: 0 }));
}

function AdminMap({ meta, points, mode, dark, bounds, fitSignal, register }) {
  const box = useRef(null), mapRef = useRef(null), tilesRef = useRef(null), layerRef = useRef(null), boundsRef = useRef(bounds);
  const [ready, setReady] = useState(false), [failed, setFailed] = useState(false);
  boundsRef.current = bounds;
  useEffect(() => {
    let dead = false, ro = null;
    loadLeaflet().then((L) => {
      if (dead || !box.current) return;
      const map = L.map(box.current, { scrollWheelZoom: false, minZoom: 2, maxZoom: 16, worldCopyJump: true, zoomSnap: 0.5 }).setView([42.5, 12.5], 5);
      map.attributionControl.setPrefix(false);
      const tiles = L.tileLayer(OSM_TILES, { maxZoom: 18, attribution: "© OpenStreetMap contributors" }).addTo(map);
      map.on("click", () => map.scrollWheelZoom.enable());
      map.on("mouseout", () => map.scrollWheelZoom.disable());
      mapRef.current = map; tilesRef.current = tiles;
      ro = new ResizeObserver(() => map.invalidateSize()); ro.observe(box.current);
      register?.(meta.kind, map);
      setReady(true);
    }).catch(() => { if (!dead) setFailed(true); });
    return () => { dead = true; ro?.disconnect(); if (mapRef.current) { register?.(meta.kind, null); mapRef.current.remove(); mapRef.current = null; } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const map = mapRef.current, L = window.L;
    if (!ready || !map) return;
    if (layerRef.current) { map.removeLayer(layerRef.current); layerRef.current = null; }
    const safe = cleanPoints(points);
    if (!safe.length) return;
    const top = Math.max(...safe.map((p) => p.count));
    layerRef.current = mode === "heat"
      ? L.heatLayer(safe.map((p) => [p.lat, p.lng, Math.max(0.22, Math.log1p(p.count) / Math.log1p(top))]), { radius: 28, blur: 22, maxZoom: 12, minOpacity: 0.35, gradient: heatGradient(meta.color) })
      : L.layerGroup(safe.map((p) => L.circleMarker([p.lat, p.lng], { radius: 4 + 10 * Math.sqrt(p.count / top), color: meta.color, weight: 1.5, fillColor: meta.color, fillOpacity: 0.38 }).bindTooltip(`${fmtInt(p.count)} ${meta.unit}`)));
    layerRef.current.addTo(map);
  }, [points, mode, ready, meta]);
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    const b = boundsRef.current;
    if (b) map.fitBounds(b, { padding: [32, 32], maxZoom: 11, animate: false }); else map.setView([42.5, 12.5], 5, { animate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitSignal, ready]);
  return <div className="bl-ad-map" ref={box} role="region" aria-label={`Mappa: ${meta.label}`}>{failed && <p className="bl-ad-map-note">Impossibile caricare la mappa. Controlla la connessione e riprova.</p>}</div>;
}

function HourStrip({ hourly, color }) {
  const v = normHourly(hourly), top = Math.max(1, ...v.map((h) => Math.max(num(h.current), num(h.week))));
  const W = 240, H = 44, bw = W / 24;
  const peak = v.reduce((a, h) => (num(h.current) > num(a.current) ? h : a), v[0]);
  return <div className="bl-ad-hours">
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="Attività per ora del giorno scelto, con la settimana precedente come linea">
      {v.map((h) => { const hh = (num(h.current) / top) * (H - 4); return <rect key={h.hour} x={h.hour * bw + 1} y={H - hh} width={bw - 2} height={hh} rx="1" fill={color}><title>{`${String(h.hour).padStart(2, "0")}:00 · ${fmtInt(h.current)} (una settimana prima: ${fmtInt(h.week)})`}</title></rect>; })}
      <polyline points={v.map((h) => `${h.hour * bw + bw / 2},${H - (num(h.week) / top) * (H - 4)}`).join(" ")} fill="none" stroke="currentColor" strokeOpacity=".5" strokeWidth="1.2" strokeDasharray="3 2" vectorEffect="non-scaling-stroke" />
    </svg>
    <div className="bl-ad-hours-x"><span>00</span><span>06</span><span>12</span><span>18</span><span>23</span></div>
    <small>{num(peak.current) ? `Picco alle ${String(peak.hour).padStart(2, "0")}:00 con ${fmtInt(peak.current)}` : "Nessuna attività in questa data"}. La linea tratteggiata è la settimana prima.</small>
  </div>;
}

function MapsView({ dark, refreshKey }) {
  const KINDS = AD_MAPS.map((m) => m.kind);
  const [date, setDate] = useState(adToday);
  const [slots, setSlots] = useState({});
  const [mode, setMode] = useState("heat");
  const [sync, setSync] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [bounds, setBounds] = useState(null);
  const [fitSignal, setFitSignal] = useState(0);
  const reqId = useRef(0), maps = useRef({}), lock = useRef(false), syncRef = useRef(true), lastStamp = useRef(refreshKey);
  syncRef.current = sync;
  const today = adToday();

  const register = useCallback((kind, map) => {
    if (!map) { delete maps.current[kind]; return; }
    maps.current[kind] = map;
    map.on("move", () => {
      if (lock.current || !syncRef.current) return;
      lock.current = true;
      const c = map.getCenter(), z = map.getZoom();
      Object.values(maps.current).forEach((m) => { if (m !== map) m.setView(c, z, { animate: false }); });
      lock.current = false;
    });
  }, []);

  const load = useCallback((fit) => {
    const id = ++reqId.current;
    setSlots((prev) => Object.fromEntries(KINDS.map((k) => [k, { ...(prev[k] || {}), loading: true }])));
    Promise.all(KINDS.map((k) => supabase.rpc("bolle_admin_geo_hourly", { p_day: date, p_kind: k }).then(({ data, error }) => ({ k, data, error })))).then((rows) => {
      if (id !== reqId.current) return;
      const next = {}; rows.forEach(({ k, data, error }) => { next[k] = error ? { error: error.message, loading: false } : { payload: data, loading: false }; });
      setSlots(next);
      if (fit) {
        const all = rows.flatMap((r) => cleanPoints(r.data?.points));
        setBounds(all.length ? [[Math.min(...all.map((p) => p.lat)), Math.min(...all.map((p) => p.lng))], [Math.max(...all.map((p) => p.lat)), Math.max(...all.map((p) => p.lng))]] : null);
        setFitSignal((s) => s + 1);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);
  useEffect(() => { load(true); }, [load]);
  useEffect(() => { if (lastStamp.current === refreshKey) return; lastStamp.current = refreshKey; if (date === today) load(false); }, [refreshKey, load, date, today]);

  return <div className="bl-ad-stack">
    <div className="bl-ad-toolbar">
      <div className="bl-ad-datebar" role="group" aria-label="Giorno">
        <button type="button" className="bl-ad-icon" onClick={() => setDate(shiftDay(date, -1))} aria-label="Giorno precedente"><AdIcPrev size={16} /></button>
        <input className="bl-ad-input" type="date" value={date} max={today} onChange={(e) => e.target.value && setDate(e.target.value)} aria-label="Data" />
        <button type="button" className="bl-ad-icon" disabled={date >= today} onClick={() => setDate(shiftDay(date, 1))} aria-label="Giorno successivo"><AdIcNext size={16} /></button>
        <button type="button" className="bl-ad-btn" disabled={date === today} onClick={() => setDate(today)}>Oggi</button>
        <button type="button" className="bl-ad-btn" disabled={date === shiftDay(today, -1)} onClick={() => setDate(shiftDay(today, -1))}>Ieri</button>
      </div>
      <div className="bl-ad-seg" role="group" aria-label="Tipo di vista">
        <button type="button" aria-pressed={mode === "heat"} onClick={() => setMode("heat")}>Densità</button>
        <button type="button" aria-pressed={mode === "dots"} onClick={() => setMode("dots")}>Punti</button>
      </div>
      <label className="bl-ad-switch"><input type="checkbox" checked={sync} onChange={(e) => setSync(e.target.checked)} /><span aria-hidden="true" />Muovi le mappe insieme</label>
      <button type="button" className="bl-ad-btn" onClick={() => setFitSignal((s) => s + 1)}>Inquadra i dati</button>
    </div>
    <p className="bl-ad-note">{longDate(date)}. Ogni mappa mostra la posizione degli eventi del giorno; il numero grande è il totale degli eventi, anche senza posizione. Clicca su una mappa per zoomare con la rotella.</p>
    <div className="bl-ad-maps">
      {AD_MAPS.map((m) => {
        const s = slots[m.kind] || { loading: true }, hourly = normHourly(s.payload?.hourly), pts = cleanPoints(s.payload?.points);
        const total = hourly.reduce((a, h) => a + num(h.current), 0), prev = hourly.reduce((a, h) => a + num(h.week), 0), located = pts.reduce((a, p) => a + p.count, 0);
        const big = expanded === m.kind;
        return <article key={m.kind} className={`bl-ad-mapcard ${big ? "big" : ""}`} style={{ "--k": m.color }}>
          <header>
            <div><h3><i />{m.label}</h3><p>{m.kind === "registrations" ? "Nuove registrazioni" : m.kind === "opens" ? "Aperture dell'app" : m.kind === "pops" ? "Bolle scoppiate" : "Reazioni alle bolle"}</p></div>
            <div className="bl-ad-mapcard-n"><strong>{s.loading && !s.payload ? "…" : fmtInt(total)}</strong>{prev > 0 && <DeltaChip pct={((total - prev) / prev) * 100} />}</div>
            <button type="button" className="bl-ad-icon" onClick={() => { setExpanded(big ? null : m.kind); setFitSignal((x) => x + 1); }} aria-label={big ? `Riduci la mappa ${m.label}` : `Ingrandisci la mappa ${m.label}`}>{big ? <AdIcMin size={16} /> : <AdIcMax size={16} />}</button>
          </header>
          <div className="bl-ad-mapwrap">
            <AdminMap meta={m} points={s.payload?.points} mode={mode} dark={dark} bounds={bounds} fitSignal={fitSignal} register={register} />
            {s.error && <p className="bl-ad-map-note err" role="alert">Dati non disponibili: {s.error}</p>}
            {!s.error && !s.loading && !pts.length && <p className="bl-ad-map-note">Nessun evento con posizione in questa data.</p>}
            {s.loading && <span className="bl-ad-map-busy">Aggiorno…</span>}
          </div>
          <footer>
            <HourStrip hourly={s.payload?.hourly} color={m.color} />
            <div className="bl-ad-mapcard-f"><span className="bl-ad-scale" aria-hidden="true"><small>meno</small><i /><small>più</small></span><small>{total ? `${fmtInt(located)} su ${fmtInt(total)} con posizione` : ""}</small></div>
          </footer>
        </article>;
      })}
    </div>
    <p className="bl-ad-note">I dati geografici sono aggregati per zona. Il confronto con la settimana precedente usa le stesse ore del giorno scelto.</p>
  </div>;
}

/* ---------------------------- Tabelle on demand ---------------------------- */
function Pager({ page, size, total, busy, onPage }) {
  return <div className="bl-ad-pager"><button type="button" className="bl-ad-icon" disabled={busy || page === 0} onClick={() => onPage(page - 1)} aria-label="Pagina precedente"><AdIcPrev size={16} /></button><span>{total ? `${page * size + 1}–${Math.min((page + 1) * size, total)} di ${fmtInt(total)}` : "Nessun risultato"}</span><button type="button" className="bl-ad-icon" disabled={busy || (page + 1) * size >= total} onClick={() => onPage(page + 1)} aria-label="Pagina successiva"><AdIcNext size={16} /></button></div>;
}
function UsersTable({ autoOpen = false }) {
  const SIZE = 25;
  const box = useRef(null);
  const [open, setOpen] = useState(!!autoOpen), [q, setQ] = useState(""), [term, setTerm] = useState(""), [page, setPage] = useState(0);
  const [res, setRes] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const load = useCallback(async (search, p) => {
    setBusy(true); setError("");
    const { data, error: err } = await supabase.rpc("bolle_admin_users", { p_search: search || null, p_limit: SIZE, p_offset: p * SIZE });
    setBusy(false);
    if (err) return setError(String(err.message).includes("forbidden") ? "Sessione admin scaduta: riapri il portale." : "Elenco non disponibile. Hai eseguito bolle_v3b_admin_utenti.sql?");
    setRes(data);
  }, []);
  useEffect(() => { if (open) load(term, page); }, [open, term, page, load]);
  // Arrivando dalla panoramica ("Registrazioni") l'elenco si apre già e viene portato in vista.
  useEffect(() => { if (autoOpen) box.current?.scrollIntoView({ behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" }); }, [autoOpen]);
  const fmt = (d) => (d ? new Date(d).toLocaleDateString("it-IT") : "–"), rows = res?.rows || [], total = num(res?.total);
  return <div ref={box} style={{ scrollMarginTop: 12 }}><Panel title="Utenti registrati" note="Contiene dati personali: ogni consultazione viene salvata nel log degli accessi admin." actions={open ? <button type="button" className="bl-ad-btn" onClick={() => { setOpen(false); setRes(null); setPage(0); setTerm(""); setQ(""); }}>Nascondi</button> : <button type="button" className="bl-ad-btn primary" onClick={() => setOpen(true)}>Mostra elenco</button>}>
    {open && <>
      <form className="bl-ad-search" onSubmit={(e) => { e.preventDefault(); setPage(0); setTerm(q.trim()); }}><AdIcSearch size={16} aria-hidden="true" /><input className="bl-ad-input" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca username, nome, email o telefono" aria-label="Cerca utenti" /><button className="bl-ad-btn" type="submit">Cerca</button></form>
      {error && <p className="bl-ad-error" role="alert">{error}</p>}
      <div className="bl-ad-scroll"><table className="bl-ad-table"><thead><tr><th>Username</th><th>Nome</th><th>Email</th><th>Telefono</th><th>Sesso</th><th className="r">Età</th><th>Iscritto</th><th>Ultimo accesso</th><th className="r">Bolle</th><th className="r">Scoppi</th></tr></thead>
        <tbody>{rows.map((u) => <tr key={u.username}><td><b>@{u.username}</b></td><td>{[u.first_name, u.last_name].filter(Boolean).join(" ") || "–"}</td><td>{u.email || "–"}</td><td>{u.phone || "–"}</td><td>{SEX_LABELS[u.sex] || "–"}</td><td className="r">{u.age ?? "–"}</td><td>{fmt(u.registered_at)}</td><td>{fmt(u.last_seen)}</td><td className="r">{fmtInt(u.bubbles)}</td><td className="r">{fmtInt(u.pops)}</td></tr>)}
          {!rows.length && <tr><td colSpan="10" className="bl-ad-empty">{busy ? "Carico…" : "Nessun utente trovato."}</td></tr>}</tbody></table></div>
      <Pager page={page} size={SIZE} total={total} busy={busy} onPage={setPage} />
      <p className="bl-ad-note">Gli utenti registrati prima della v3 non hanno ancora dati personali (“–”).</p>
    </>}
  </Panel></div>;
}
function BubblesTable() {
  const SIZE = 20;
  const [open, setOpen] = useState(false), [page, setPage] = useState(0), [res, setRes] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const load = useCallback(async (p) => {
    setBusy(true); setError("");
    const { data, error: err } = await supabase.rpc("bolle_admin_bubbles", { p_limit: SIZE, p_offset: p * SIZE });
    setBusy(false);
    if (err) { setError(`Elenco bolle non disponibile: ${err.message}`); return; }
    setRes(data);
  }, []);
  useEffect(() => { if (open) load(page); }, [open, page, load]);
  const rows = res?.rows || [], total = num(res?.total);
  return <Panel title="Bolle pubblicate" note="Elenco completo, caricato solo quando serve." actions={<>{open && <button type="button" className="bl-ad-btn" disabled={busy} onClick={() => load(page)}>Aggiorna</button>}<button type="button" className={`bl-ad-btn ${open ? "" : "primary"}`} onClick={() => { setOpen((v) => !v); setPage(0); }}>{open ? "Nascondi" : "Mostra elenco"}</button></>}>
    {open && <>
      {error && <p className="bl-ad-error" role="alert">{error}</p>}
      <div className="bl-ad-scroll"><table className="bl-ad-table"><thead><tr><th>Pubblicata</th><th>Autore</th><th>Descrizione</th><th>Tipo</th><th>Visibile</th></tr></thead>
        <tbody>{rows.map((b) => <tr key={b.id}><td>{new Date(b.created_at).toLocaleString("it-IT")}</td><td><b>@{b.username || "sconosciuto"}</b></td><td className="clip" title={b.caption || ""}>{b.caption || "–"}</td><td>{b.media_type || "–"}</td><td><span className={`bl-ad-chip ${b.hidden ? "off" : "on"}`}>{b.hidden ? "Nascosta" : "Visibile"}</span></td></tr>)}
          {!rows.length && <tr><td colSpan="5" className="bl-ad-empty">{busy ? "Carico…" : "Nessuna bolla trovata."}</td></tr>}</tbody></table></div>
      <Pager page={page} size={SIZE} total={total} busy={busy} onPage={setPage} />
    </>}
  </Panel>;
}

/* ---------------------------- Impostazioni e segnalazioni ---------------------------- */
function ThemeSetting({ onNotify }) {
  const [selected, setSelected] = useState("bolle"), [current, setCurrent] = useState("bolle"), [busy, setBusy] = useState(false), [error, setError] = useState("");
  useEffect(() => { supabase.rpc("bolle_get_active_theme").then(({ data, error: e }) => { if (!e && BOLLE_THEMES.some((t) => t.id === data)) { setSelected(data); setCurrent(data); } }); }, []);
  async function save() {
    setBusy(true); setError("");
    const { error: e } = await supabase.rpc("bolle_admin_set_active_theme", { p_theme: selected });
    setBusy(false);
    if (e) { setError(e.message); return; }
    setCurrent(selected); window.dispatchEvent(new Event("bolle:theme-updated")); onNotify("Tema globale aggiornato: " + selected);
  }
  return <Panel title="Tema dell'app" note={`Attivo ora: ${BOLLE_THEMES.find((t) => t.id === current)?.label || current}. È l'unico tema speciale visibile agli utenti; chi usa Chiaro, Dark o Automatico non vede cambiamenti.`}>
    <div className="bl-ad-themes">{BOLLE_THEMES.map((t) => <button type="button" key={t.id} aria-pressed={selected === t.id} onClick={() => setSelected(t.id)}>{t.label}</button>)}</div>
    {error && <p className="bl-ad-error" role="alert">{error}</p>}
    <div><button className="bl-ad-btn primary" type="button" disabled={busy || selected === current} onClick={save}>{busy ? "Salvo…" : "Attiva tema"}</button></div>
  </Panel>;
}
function LimitSetting({ onNotify }) {
  const [value, setValue] = useState(20), [busy, setBusy] = useState(false), [error, setError] = useState("");
  useEffect(() => { supabase.rpc("bolle_admin_get_bubble_limit").then(({ data, error: e }) => { if (e) setError(e.message); else setValue(Number(data) || 20); }); }, []);
  async function save(e) {
    e.preventDefault(); setBusy(true); setError("");
    const { error: err } = await supabase.rpc("bolle_admin_set_bubble_limit", { p_limit: Number(value) });
    setBusy(false);
    if (err) setError(err.message); else { window.dispatchEvent(new Event("bolle:daily-limit-updated")); onNotify("Limite aggiornato. I valori dell'app vengono riletti dal server."); }
  }
  return <Panel title="Limite di scoppi" note="Valore configurato dall'admin, da 5 a 60. Il numero di scoppi consentiti dipende comunque dal saldo verificato dal server: la funzione SQL pop_bubble deve leggere questo limite.">
    <form className="bl-ad-form" onSubmit={save}><label>Scoppi consentiti<input className="bl-ad-input" type="number" min="5" max="60" value={value} onChange={(e) => setValue(e.target.value)} /></label><button className="bl-ad-btn primary" disabled={busy}>{busy ? "Salvo…" : "Salva limite"}</button></form>
    {error && <p className="bl-ad-error" role="alert">{error}</p>}
  </Panel>;
}
function BugReports() {
  const [rows, setRows] = useState([]), [failure, setFailure] = useState(""), [loading, setLoading] = useState(false);
  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("bolle_admin_bug_reports");
    setLoading(false);
    if (error) setFailure("Segnalazioni non disponibili: " + error.message); else { setFailure(""); setRows(data || []); }
  };
  useEffect(() => { load(); }, []);
  return <Panel title="Segnalazioni degli utenti" note={rows.length ? `${rows.length} ricevute` : undefined} actions={<button type="button" className="bl-ad-btn" onClick={load} disabled={loading}>Aggiorna</button>}>
    {failure && <p className="bl-ad-error" role="alert">{failure}</p>}
    {!failure && !rows.length && <p className="bl-ad-empty">Nessuna segnalazione ricevuta.</p>}
    <ul className="bl-ad-reports">{rows.map((r) => <li key={r.id}><div><span className="bl-ad-chip">{r.status}</span><time>{new Date(r.created_at).toLocaleString("it-IT")}</time></div><p>{r.message}</p>{r.error_context && <small>Errore: {r.error_context}</small>}</li>)}</ul>
  </Panel>;
}

/* ---------------------------- Viste ---------------------------- */
function KpiBand({ items, onPick, picked }) {
  return <div className="bl-ad-kpis">{items.map((k) => {
    const st = k.accent ? { borderInlineStart: `4px solid ${k.accent}` } : undefined;
    const body = <><span className="bl-ad-kpi-l">{k.label}</span><span className="bl-ad-kpi-v"><b>{k.value}</b><DeltaChip pct={k.delta} /></span>{k.sub && <small>{k.sub}</small>}{k.spark && k.spark.length > 1 && <Spark values={k.spark} color={k.color} />}</>;
    if (k.onClick) return <button type="button" key={k.label} className="bl-ad-kpi action" style={st} title={k.hint} onClick={k.onClick}>{body}</button>;
    return k.drill
      ? <button type="button" key={k.label} className="bl-ad-kpi action" style={st} aria-expanded={picked === k.drill} onClick={() => onPick(k.drill)}>{body}</button>
      : <div key={k.label} className="bl-ad-kpi" style={st}>{body}</div>;
  })}</div>;
}
function OverviewView({ c }) {
  const { K, series, stick, guests, fq, days, errs, perf, go, ret, data } = c, by = (k) => series.map((d) => num(d[k]));
  const items = [
    { label: "Attivi nelle ultime 24 ore", value: fmtInt(K.dau), spark: by("dau"), color: AD_COLORS.dau, delta: weekDelta(series, "dau"), drill: "dau" },
    { label: "Attivi negli ultimi 7 giorni", value: fmtInt(K.wau), drill: "wau" },
    { label: "Attivi negli ultimi 30 giorni", value: fmtInt(K.mau), drill: "mau" },
    { label: "Coinvolgimento", value: `${stick}%`, sub: "Utenti del mese che tornano ogni giorno" },
    { label: "Nuovi utenti", value: fmtInt(K.new_users), sub: `Ultimi ${days} giorni`, spark: by("new_users"), color: AD_COLORS.new_users, delta: weekDelta(series, "new_users") },
    { label: "Registrazioni", value: fmtInt(K.new_registrations), sub: `Ultimi ${days} giorni · apri l'elenco`, spark: by("registrations"), color: AD_COLORS.registrations, delta: weekDelta(series, "registrations"), onClick: () => go("audience", "users"), hint: "Apri l'elenco degli utenti registrati" },
    { label: "Utenti totali", value: fmtInt(K.total_users), sub: `${fmtInt(K.registered_users)} registrati, ${fmtInt(guests)} ospiti` },
    { label: "Sessioni per utente", value: fmtDec(fq.avg_sessions), sub: `${fmtDec(fq.avg_active_days)} giorni attivi per utente` },
  ];
  const regs = Math.max(1, num(K.total_users)), regPct = Math.round((num(K.registered_users) / regs) * 100);
  const sum = (k) => series.reduce((t, d) => t + num(d[k]), 0), periodSub = `Ultimi ${days} giorni`;
  const activityItems = [
    { label: "Scoppi", value: fmtInt(sum("pops")), sub: periodSub, spark: by("pops"), color: AD_COLORS.pops, delta: weekDelta(series, "pops") },
    { label: "Bolle pubblicate", value: fmtInt(sum("publishes")), sub: periodSub, spark: by("publishes"), color: AD_COLORS.publishes, delta: weekDelta(series, "publishes") },
    { label: "Reazioni", value: fmtInt(sum("reactions")), sub: periodSub, spark: by("reactions"), color: AD_COLORS.reactions, delta: weekDelta(series, "reactions") },
    { label: "Aperture dell'app", value: fmtInt(sum("opens")), sub: periodSub, spark: by("opens"), color: AD_COLORS.opens, delta: weekDelta(series, "opens") },
  ];
  const stepUsers = (ev) => num((data.features || []).find((f) => f.event === ev)?.users), guestsStarted = stepUsers("guest_start"), completed = stepUsers("register_complete");
  const bootP95 = perf.find((p) => p.metric === "boot")?.p95_ms, d7 = ret.d7 || {};
  const healthItems = [
    { label: "Tasso di registrazione", value: `${regPct}%`, sub: `${fmtInt(K.registered_users)} registrati su ${fmtInt(K.total_users)} utenti`, onClick: () => go("audience", "users"), hint: "Apri l'elenco degli utenti registrati" },
    { label: "Ospiti che si iscrivono", value: guestsStarted ? `${Math.min(100, Math.round((completed / guestsStarted) * 100))}%` : "–", sub: guestsStarted ? `${fmtInt(completed)} su ${fmtInt(guestsStarted)} ospiti nel periodo` : "Ancora nessun ospite tracciato", onClick: () => go("usage"), hint: "Apri Utilizzo" },
    { label: "Fedeltà a 7 giorni", value: `${num(d7.rate)}%`, sub: `${fmtInt(d7.retained)} su ${fmtInt(d7.cohort)} utenti`, onClick: () => go("usage"), hint: "Apri Utilizzo" },
    { label: "Errori", value: fmtInt(errs.total), sub: num(errs.total) ? "Apri Sistema per i dettagli" : "Nessun errore nel periodo", spark: by("errors"), color: AD_COLORS.errors, accent: num(errs.total) ? AD_COLORS.errors : undefined, onClick: () => go("system"), hint: "Apri Sistema" },
    { label: "Avvio dell'app (p95)", value: bootP95 == null ? "–" : `${fmtInt(bootP95)} ms`, sub: "Tempo entro cui parte il 95% delle volte", accent: num(bootP95) > 2000 ? AD_COLORS.errors : undefined, onClick: () => go("system"), hint: "Apri Sistema" },
  ];
  const alerts = [];
  if (num(errs.total)) alerts.push(`${fmtInt(errs.total)} errori registrati nel periodo`);
  perf.filter((p) => num(p.p95_ms) > 2000).forEach((p) => alerts.push(`${PERF_LABELS[p.metric] || p.metric}: p95 a ${fmtInt(p.p95_ms)} ms`));
  const feats = c.feats.slice(0, 6);
  return <div className="bl-ad-stack">
    <div className={`bl-ad-status ${alerts.length ? "warn" : "ok"}`}>
      <span className="bl-ad-status-dot" aria-hidden="true" />
      <p>{alerts.length ? alerts.join(". ") + "." : "Nessuna anomalia nel periodo: nessun errore e tempi di risposta nella norma."}</p>
      {alerts.length > 0 && <button type="button" className="bl-ad-btn" onClick={() => go("system")}>Apri Sistema</button>}
    </div>
    <KpiBand items={items} onPick={c.pickMetric} picked={c.metricDetail} />
    {["dau", "wau", "mau"].includes(c.metricDetail) && <Drilldown metric={c.metricDetail} c={c} onClose={() => c.pickMetric(null)} />}
    <Panel title="Attività nel periodo" note={`Totali degli ultimi ${days} giorni, con la variazione sugli ultimi 7 giorni completi.`}><KpiBand items={activityItems} /></Panel>
    <Panel title="Salute e conversione" note="Quanti ospiti diventano iscritti, quanti tornano e come va l'app. Clicca un indicatore per aprire il dettaglio."><KpiBand items={healthItems} /></Panel>
    <Panel title="Utenti attivi e crescita" note="Per giorno. Clicca la legenda per nascondere una serie.">
      <TrendChart data={series} series={[{ key: "dau", name: "Utenti attivi", color: AD_COLORS.dau }, { key: "new_users", name: "Nuovi utenti", color: AD_COLORS.new_users }, { key: "registrations", name: "Registrazioni", color: AD_COLORS.registrations, dash: "5 4" }]} />
    </Panel>
    <div className="bl-ad-grid2">
      <Panel title="Cosa fanno gli utenti" note="Le funzionalità più usate nel periodo" actions={<button type="button" className="bl-ad-btn" onClick={() => go("usage")}>Vedi tutto</button>}><Distribution rows={feats} /></Panel>
      <Panel title="Chi usa l'app" note="Registrati contro ospiti" actions={<button type="button" className="bl-ad-btn" onClick={() => go("audience")}>Vedi il pubblico</button>}>
        <div className="bl-ad-split" role="img" aria-label={`${regPct}% registrati, ${100 - regPct}% ospiti`}><i style={{ width: `${regPct}%` }} /></div>
        <div className="bl-ad-split-l"><span><b>{fmtInt(K.registered_users)}</b> registrati ({regPct}%)</span><span><b>{fmtInt(guests)}</b> solo ospiti ({100 - regPct}%)</span></div>
        <p className="bl-ad-note">{fmtInt(K.users_with_data)} registrati hanno i dati completi.</p>
      </Panel>
    </div>
  </div>;
}
/* ---------------------------- Sessioni live e click sul link ---------------------------- */
const LIVE_REFRESH_MS = 5 * 60 * 1000; // la dashboard si aggiorna ogni 5 minuti
const APP_LINK = "https://bolle-beta.vercel.app";
const pctOf = (a, b) => (num(b) ? Math.round((num(a) / num(b)) * 1000) / 10 : 0);
const hhmm = (iso) => (iso ? new Date(iso).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }) : "–");
function LiveSessions({ days }) {
  const [s, setS] = useState(null), [links, setLinks] = useState(null), [err, setErr] = useState(""), [at, setAt] = useState(null), [busy, setBusy] = useState(false);
  const load = useCallback(async (retried = false) => {
    setBusy(true);
    const [a, b] = await Promise.all([supabase.rpc("bolle_admin_sessions", { p_days: days }), supabase.rpc("bolle_admin_link_clicks", { p_days: days })]);
    setBusy(false);
    if (a.error) {
      const m = String(a.error.message || "");
      if (/Load failed|Failed to fetch|NetworkError|aborted/i.test(m)) {
        setErr("Connessione interrotta durante il caricamento delle sessioni. Riprovo tra poco…");
        if (!retried) setTimeout(() => load(true), 3000);
      } else if (/forbidden/i.test(m)) setErr("Accesso negato: inserisci il controllo admin nello script SQL (bolle_admin_sessions).");
      else if (/could not find the function|does not exist/i.test(m)) setErr("Funzione non trovata: esegui lo script SQL allegato.");
      else setErr("Sessioni non disponibili: " + m.slice(0, 120));
    } else { setErr(""); setS(a.data); }
    if (!b.error) setLinks(b.data);
    setAt(new Date());
  }, [days]);
  useEffect(() => {
    load(false);
    const id = setInterval(() => { if (document.visibilityState !== "hidden") load(false); }, LIVE_REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  const live = s?.live || {}, T = s?.totals || {}, D = s?.devices || {}, series = s?.series || [], recent = s?.recent || [];
  const liveTotal = num(live.guests) + num(live.registered);
  const items = s ? [
    { label: "Online adesso", value: fmtInt(liveTotal), sub: `${fmtInt(live.guests)} ospiti · ${fmtInt(live.registered)} registrati`, accent: AD_COLORS.new_users },
    { label: "Sessioni nel periodo", value: fmtInt(T.sessions), sub: `durata media ${fmtDec(T.avg_minutes)} min` },
    { label: "Sessioni da ospite", value: fmtInt(T.guest_sessions), sub: `${pctOf(T.guest_sessions, T.sessions)}% del totale` },
    { label: "Sessioni da registrato", value: fmtInt(T.registered_sessions), sub: `${pctOf(T.registered_sessions, T.sessions)}% del totale` },
    { label: "Da ospite a iscritto", value: `${pctOf(D.converted_devices, D.guest_devices)}%`, sub: `${fmtInt(D.converted_devices)} su ${fmtInt(D.guest_devices)} dispositivi · nella stessa sessione: ${pctOf(T.converted_sessions, T.guest_sessions)}%`, accent: AD_COLORS.registrations },
  ] : [];
  const L = links?.totals || {};
  const srcRows = (links?.by_src || []).map((r) => ({ label: r.k, value: num(r.count) }));
  return <>
    <Panel title="Sessioni live" note={`Ospiti e registrati · aggiornamento automatico ogni 5 minuti${at ? ` · ultimo alle ${hhmm(at)}` : ""}`} actions={<button type="button" className="bl-ad-btn" onClick={() => load(false)} disabled={busy}>{busy ? "Aggiorno…" : "Aggiorna ora"}</button>}>
      {err && <p className="bl-ad-error" role="alert">{err}</p>}
      {!err && !s && <p className="bl-ad-empty">Carico le sessioni…</p>}
      {s && <>
        <KpiBand items={items} />
        <h4>Nuove sessioni per giorno</h4>
        <TrendChart type="bar" data={series} series={[{ key: "guests", name: "Iniziate da ospite", color: AD_COLORS.opens }, { key: "registered", name: "Iniziate da registrato", color: AD_COLORS.dau }, { key: "converted", name: "Ospiti diventati iscritti", color: AD_COLORS.new_users }]} height={200} />
        <p className="bl-ad-note">«Online adesso» = sessioni con attività negli ultimi 5 minuti. La conversione sui dispositivi conta chi è arrivato come ospite e in seguito ha usato l'app da registrato, anche in una sessione successiva.</p>
        <h4>Ultime 50 sessioni</h4>
        {recent.length ? <div className="bl-ad-scroll"><table className="bl-ad-table"><thead><tr><th>Sessione</th><th>Tipo</th><th>Inizio</th><th>Ultima attività</th><th>Sorgente</th></tr></thead><tbody>
          {recent.map((r) => <tr key={r.id}><td><code>{r.id}</code></td><td>{r.is_guest ? "Ospite" : (r.started_as_guest ? "Ospite → iscritto" : "Registrato")}</td><td>{new Date(r.started_at).toLocaleString("it-IT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td><td>{hhmm(r.last_seen)}</td><td>{r.src || "–"}</td></tr>)}
        </tbody></table></div> : <p className="bl-ad-empty">Ancora nessuna sessione registrata.</p>}
      </>}
    </Panel>
    <Panel title="Click sul link dell'app" note={`${APP_LINK} · quante persone arrivano dal link e da dove`}>
      {!links && <p className="bl-ad-empty">{err ? "Dati non disponibili." : "Carico i click…"}</p>}
      {links && <>
        <KpiBand items={[{ label: "Arrivi dal link", value: fmtInt(L.landings), sub: `${fmtInt(L.today)} oggi` }, { label: "Click su link nell'app", value: fmtInt(L.clicks) }]} />
        <h4>Per sorgente</h4>
        <Distribution color={AD_COLORS.opens} rows={srcRows} empty="Ancora nessun click." />
        <h4>Per giorno</h4>
        <TrendChart type="bar" data={links.series || []} series={[{ key: "count", name: "Click", color: AD_COLORS.opens }]} height={180} />
        <p className="bl-ad-note">Per distinguere dove viene pubblicato il link, usa una sorgente diversa per ogni posto: <code>{APP_LINK}/?src=instagram</code>, <code>?src=whatsapp</code>, <code>?src=newsletter</code>… Senza <code>?src=</code> l'arrivo risulta «diretto».</p>
      </>}
    </Panel>
  </>;
}
function UsageView({ c }) {
  const { ret, fq, stick, feats, data } = c;
  const steps = [["guest_start", "Ospiti iniziati"], ["register_start", "Registrazioni avviate"], ["register_step", "Dati compilati"], ["register_complete", "Registrazioni completate"]]
    .map(([ev, label]) => { const f = (data.features || []).find((x) => x.event === ev); return f ? { label, value: num(f.users) } : null; }).filter(Boolean);
  return <div className="bl-ad-stack">
    <LiveSessions days={c.days} />
    <Panel title="Fedeltà degli utenti" note="Quanti utenti tornano dopo N giorni dal primo evento. Clicca per i dettagli.">
      <div className="bl-ad-ret">{["d1", "d7", "d30"].map((k) => <button type="button" key={k} className="bl-ad-retcard" aria-expanded={c.metricDetail === k} onClick={() => c.pickMetric(k)}>
        <span>Dopo {k.slice(1)} {k === "d1" ? "giorno" : "giorni"}</span><b>{num(ret[k]?.rate)}%</b>
        <span className="bl-ad-track"><i style={{ width: `${Math.min(100, num(ret[k]?.rate))}%`, background: AD_COLORS.dau }} /></span>
        <small>{fmtInt(ret[k]?.retained)} su {fmtInt(ret[k]?.cohort)} utenti</small></button>)}</div>
      {["d1", "d7", "d30"].includes(c.metricDetail) && <Drilldown metric={c.metricDetail} c={c} onClose={() => c.pickMetric(null)} />}
      <p className="bl-ad-note">Calcolata dagli eventi registrati dal rilascio di questa versione: diventa affidabile dopo alcune settimane.</p>
    </Panel>
    <div className="bl-ad-grid2">
      <Panel title="Frequenza d'uso" note="Medie per utente nel periodo">
        <div className="bl-ad-trio"><div><b>{fmtDec(fq.avg_sessions)}</b><small>Sessioni</small></div><div><b>{fmtDec(fq.avg_active_days)}</b><small>Giorni attivi</small></div><div><b>{stick}%</b><small>Attivi ogni giorno sul mese</small></div></div>
      </Panel>
      <Panel title="Dall'ospite all'iscritto" note="Utenti unici a ogni passaggio">
        {steps.length ? <ul className="bl-ad-funnel">{steps.map((s, i) => <li key={s.label}><span>{s.label}</span><span className="bl-ad-track"><i style={{ width: `${(s.value / Math.max(1, steps[0].value)) * 100}%`, background: AD_COLORS.new_users }} /></span><b>{fmtInt(s.value)}</b><small>{i ? `${steps[i - 1].value ? Math.round((s.value / steps[i - 1].value) * 100) : 0}% dal passo prima` : ""}</small></li>)}</ul> : <p className="bl-ad-empty">Ancora nessun evento di registrazione.</p>}
      </Panel>
    </div>
    <Panel title="Funzionalità più usate" note="Numero di eventi e utenti coinvolti"><Distribution rows={feats} /></Panel>
  </div>;
}
/* Utenti che hanno eliminato il profilo, con le motivazioni (anonime: il server non conserva chi sia stato). */
function DeletedAccounts() {
  const [rows, setRows] = useState([]), [failure, setFailure] = useState(""), [loading, setLoading] = useState(false);
  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("bolle_admin_account_deletions", { p_limit: 200 });
    setLoading(false);
    if (error) setFailure("Eliminazioni non disponibili: " + error.message); else { setFailure(""); setRows(data || []); }
  };
  useEffect(() => { load(); }, []);
  const items = useMemo(() => rows.map((r) => {
    const text = String(r.reason || "").trim();
    const hit = DELETE_REASONS.find(([, label]) => text === label || text.startsWith(label + ": "));
    return { ...r, label: hit ? hit[1] : (text ? "Altro" : "Non indicato"), details: hit ? text.slice(hit[1].length).replace(/^:\s*/, "") : text };
  }), [rows]);
  const byReason = useMemo(() => {
    const map = new Map();
    items.forEach((r) => map.set(r.label, (map.get(r.label) || 0) + 1));
    return [...map.entries()].sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }));
  }, [items]);
  const total = Number(rows[0]?.total_count) || rows.length;
  const last30 = items.filter((r) => Date.now() - Date.parse(r.created_at) <= 30 * 864e5).length;
  return <Panel title="Profili eliminati" note={rows.length ? `${fmtInt(total)} in totale · ${fmtInt(last30)} negli ultimi 30 giorni` : undefined} actions={<button type="button" className="bl-ad-btn" onClick={load} disabled={loading}>Aggiorna</button>}>
    {failure && <p className="bl-ad-error" role="alert">{failure}</p>}
    {!failure && !rows.length && <p className="bl-ad-empty">{loading ? "Caricamento…" : "Nessun profilo eliminato finora."}</p>}
    {rows.length > 0 && <>
      <h4>Motivi indicati</h4>
      <Distribution color="#e5484d" rows={byReason} empty="Nessun motivo." />
      <h4>Ultime eliminazioni</h4>
      <ul className="bl-ad-reports">{items.slice(0, 50).map((r) => <li key={r.id}><div><span className="bl-ad-chip">{r.label}</span><time>{new Date(r.created_at).toLocaleString("it-IT")}</time></div>{r.details && <p>{r.details}</p>}</li>)}</ul>
      {rows.length >= 200 && <p className="bl-ad-note">Sono considerate le ultime 200 eliminazioni.</p>}
    </>}
  </Panel>;
}
function AudienceView({ c }) {
  const { K, guests, demo, demoExtra, natRows } = c;
  const items = [{ label: "Utenti totali", value: fmtInt(K.total_users) }, { label: "Registrati", value: fmtInt(K.registered_users), sub: `${fmtInt(K.users_with_data)} con dati completi` }, { label: "Solo ospiti", value: fmtInt(guests) }, { label: "Nuovi nel periodo", value: fmtInt(K.new_users) }];
  return <div className="bl-ad-stack">
    <KpiBand items={items} />
    <div className="bl-ad-grid2">
      <Panel title="Sesso" note="Dati aggregati"><Distribution color="#a855c7" rows={(demo.sex || []).map((s) => ({ label: SEX_LABELS[s.k] || s.k, value: num(s.count) }))} /></Panel>
      <Panel title="Età" note="Fasce d'età dei registrati"><Distribution color="#6d56d8" rows={((demoExtra?.age || demo.age) || []).map((s) => ({ label: s.k, value: num(s.count) }))} /></Panel>
    </div>
    {natRows && <Panel title="Nazionalità" note="Prime 8, le altre sono raggruppate"><Distribution color="#0e9aa7" rows={natRows} /></Panel>}
    <UsersTable autoOpen={c.focus === "users"} />
    <DeletedAccounts />
  </div>;
}
/* ---------------------------- Attività utenti ---------------------------- */
// Scala graduata: la posizione in classifica è divisa in cinque quinti, dal meno al più attivo. Il colore non è mai l'unico indicatore: c'è sempre anche il nome del livello.
const ACT_LEVELS = [
  { name: "Minima", color: "#e5484d" },
  { name: "Bassa", color: "#f08a3c" },
  { name: "Media", color: "#e9b72f" },
  { name: "Alta", color: "#7bc96f" },
  { name: "Altissima", color: "#12b886" },
];
const actScore = (u) => num(u.active_days) * 5 + num(u.sessions) + num(u.bubbles) * 3 + num(u.pops) + num(u.reactions);
const actDate = (d) => (d ? new Date(d).toLocaleDateString("it-IT") : "mai");
function UserActivityView({ c }) {
  const { days } = c, STEP = 25;
  const [rows, setRows] = useState(null), [total, setTotal] = useState(0), [mode, setMode] = useState("full");
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [shown, setShown] = useState(STEP), [q, setQ] = useState("");
  // Caricata solo quando si apre la sezione o si preme Aggiorna: non rientra nell'aggiornamento automatico, per non pesare sul backend.
  const load = useCallback(async () => {
    setBusy(true); setError("");
    let res = await supabase.rpc("bolle_admin_user_activity", { p_days: days }), m = "full";
    if (res.error) {
      if (String(res.error.message).includes("forbidden")) { setBusy(false); setError("Sessione admin scaduta: riapri il portale."); return; }
      res = await supabase.rpc("bolle_admin_users", { p_search: null, p_limit: 500, p_offset: 0 }); m = "basic";
    }
    setBusy(false);
    if (res.error) { setError("Classifica non disponibile: " + String(res.error.message).slice(0, 100)); return; }
    const list = Array.isArray(res.data) ? res.data : res.data?.rows || [];
    setRows(list); setTotal(Array.isArray(res.data) ? list.length : num(res.data?.total) || list.length); setMode(m); setShown(STEP);
  }, [days]);
  useEffect(() => { load(); }, [load]);

  const ranked = useMemo(() => {
    const list = (rows || []).filter((u) => u.username).map((u) => ({ ...u, score: actScore(u) }));
    list.sort((a, b) => b.score - a.score || String(b.last_seen || "").localeCompare(String(a.last_seen || "")));
    const n = list.length;
    return list.map((u, i) => ({ ...u, rank: i + 1, level: u.score <= 0 ? 0 : n < 2 ? 4 : Math.min(4, Math.floor(((n - 1 - i) / n) * 5)) }));
  }, [rows]);
  const top = ranked[0], low = ranked.length > 1 ? ranked[ranked.length - 1] : null, max = Math.max(1, top?.score || 1);
  const detail = (u) => [`${fmtInt(u.bubbles)} bolle`, `${fmtInt(u.pops)} scoppi`, ...(mode === "full" ? [`${fmtInt(u.reactions)} reazioni`, `${fmtInt(u.active_days)} giorni attivi`] : []), `ultimo accesso ${actDate(u.last_seen)}`].join(" · ");
  const term = q.trim().replace(/^@/, "").toLowerCase();
  const filtered = term ? ranked.filter((u) => String(u.username).toLowerCase().includes(term)) : ranked, visible = filtered.slice(0, shown);
  const items = top ? [
    { label: "Più attivo", value: `@${top.username}`, sub: detail(top), accent: ACT_LEVELS[4].color },
    ...(low ? [{ label: "Meno attivo", value: `@${low.username}`, sub: detail(low), accent: ACT_LEVELS[0].color }] : []),
    { label: "Utenti in classifica", value: fmtInt(ranked.length), sub: total > ranked.length ? `Primi ${fmtInt(ranked.length)} su ${fmtInt(total)}` : undefined },
    { label: "Senza attività", value: fmtInt(ranked.filter((u) => u.score <= 0).length), sub: "Punteggio zero" },
  ] : [];

  return <div className="bl-ad-stack">
    {error && <div className="bl-ad-unlock"><p className="bl-ad-error" role="alert">{error}</p><button type="button" className="bl-ad-btn" onClick={load}>Riprova</button></div>}
    {!error && !rows && <p className="bl-ad-empty">Carico la classifica…</p>}
    {rows && !ranked.length && !error && <p className="bl-ad-empty">Ancora nessun utente con attività.</p>}
    {top && <KpiBand items={items} />}
    {top && <Panel title="Classifica per utente" note={mode === "full" ? `Ultimi ${days} giorni. Punteggio = 5 × giorni attivi + sessioni + 3 × bolle pubblicate + scoppi + reazioni.` : "Conteggi complessivi dall'iscrizione. Punteggio = 3 × bolle pubblicate + scoppi. Per vedere anche giorni attivi, sessioni e reazioni nel periodo serve la funzione SQL bolle_admin_user_activity."} actions={<button type="button" className="bl-ad-btn" onClick={() => load(false)} disabled={busy}>{busy ? "Aggiorno…" : "Aggiorna"}</button>}>
      <div role="list" aria-label="Scala di attività" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px 16px", fontSize: 12 }}>
        <span>Dal più al meno attivo:</span>
        {[4, 3, 2, 1, 0].map((i) => <span role="listitem" key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><i aria-hidden="true" style={{ width: 12, height: 12, borderRadius: 3, background: ACT_LEVELS[i].color }} />{ACT_LEVELS[i].name}</span>)}
      </div>
      <form className="bl-ad-search" onSubmit={(e) => e.preventDefault()}><AdIcSearch size={16} aria-hidden="true" /><input className="bl-ad-input" type="search" value={q} onChange={(e) => { setQ(e.target.value); setShown(STEP); }} placeholder="Cerca un username" aria-label="Cerca un utente in classifica" /></form>
      <ul className="bl-ad-dist">{visible.map((u) => { const lv = ACT_LEVELS[u.level]; return <li key={u.username}>
        <span className="bl-ad-dist-l"><b>#{u.rank}</b> @{u.username}{u.rank === 1 && <> <span className="bl-ad-chip on">Più attivo</span></>}{low && u.rank === ranked.length && <> <span className="bl-ad-chip off">Meno attivo</span></>}<small>{detail(u)}</small></span>
        <span className="bl-ad-track"><i style={{ width: `${Math.max(2, (u.score / max) * 100)}%`, background: lv.color }} /></span>
        <b>{fmtInt(u.score)}</b><small>{lv.name}</small>
      </li>; })}</ul>
      {!filtered.length && <p className="bl-ad-empty">Nessun utente con questo username.</p>}
      {filtered.length > shown && <div><button type="button" className="bl-ad-btn" onClick={() => setShown((v) => v + STEP)}>Mostra altri {Math.min(STEP, filtered.length - shown)} di {fmtInt(filtered.length - shown)}</button></div>}
    </Panel>}
  </div>;
}
function ContentView({ c }) {
  const { C, series, activity, activityError } = c;
  const items = [["Bolle", C.bubbles], ["Scoppi", C.pops], ["Reazioni", C.reactions], ["Segnalazioni", C.reports], ["Regali", C.gifts], ["Regali aperti", C.gifts_redeemed]].map(([label, v]) => ({ label, value: fmtInt(v) }));
  return <div className="bl-ad-stack">
    <KpiBand items={items} />
    <Panel title="Attività della community" note={activity ? "Pubblicazioni, scoppi, reazioni e regali per giorno." : "Pubblicazioni e scoppi per giorno."}>
      {activityError && <p className="bl-ad-note">{activityError}</p>}
      {activity
        ? <TrendChart type="bar" data={activity} series={[{ key: "publishes", name: "Pubblicate", color: AD_COLORS.publishes }, { key: "pops", name: "Scoppiate", color: AD_COLORS.pops }, { key: "reactions", name: "Reazioni", color: AD_COLORS.reactions }, { key: "gifts", name: "Regali", color: AD_COLORS.gifts }]} />
        : <TrendChart type="bar" data={series} series={[{ key: "pops", name: "Scoppiate", color: AD_COLORS.pops }, { key: "publishes", name: "Pubblicate", color: AD_COLORS.publishes }]} />}
      <p className="bl-ad-note">I regali sono in attesa di una fonte dati verificata.</p>
    </Panel>
    <BubblesTable />
  </div>;
}
function SystemView({ c }) {
  const { errs, perf, series } = c, worst = Math.max(2000, ...perf.map((p) => num(p.p95_ms)));
  return <div className="bl-ad-stack">
    <Panel title="Errori" note={`${fmtInt(errs.total)} nel periodo`}>
      <TrendChart type="bar" height={170} data={series} series={[{ key: "errors", name: "Errori", color: AD_COLORS.errors }]} />
      <div className="bl-ad-grid2">
        <div><h4>Più frequenti</h4><Distribution color={AD_COLORS.errors} rows={(errs.top || []).map((e) => ({ label: e.code, value: num(e.count) }))} empty="Nessun errore registrato." /></div>
        <div><h4>Ultimi</h4><ul className="bl-ad-recent">{(errs.recent || []).slice(0, 6).map((e, i) => <li key={i}><time>{new Date(e.at).toLocaleString("it-IT")}</time><span>{e.where || "?"}</span><code>{e.code || "?"}</code></li>)}{!(errs.recent || []).length && <li className="bl-ad-empty">Nessun errore registrato.</li>}</ul></div>
      </div>
    </Panel>
    <Panel title="Prestazioni" note="Millisecondi. Il p95 è il tempo entro cui risponde il 95% delle richieste: sopra 2000 è lento.">
      <div className="bl-ad-scroll"><table className="bl-ad-table"><thead><tr><th>Metrica</th><th className="r">Medio</th><th className="r">p50</th><th>p95</th><th className="r">Campioni</th></tr></thead>
        <tbody>{perf.map((p) => { const v = num(p.p95_ms), st = v > 2000 ? "bad" : v > 1000 ? "mid" : "good"; return <tr key={p.metric}><td><b>{PERF_LABELS[p.metric] || p.metric}</b></td><td className="r">{fmtInt(p.avg_ms)}</td><td className="r">{fmtInt(p.p50_ms)}</td><td><span className="bl-ad-p95"><span className="bl-ad-track"><i className={st} style={{ width: `${Math.min(100, (v / worst) * 100)}%` }} /></span><b className={st}>{fmtInt(v)}</b></span></td><td className="r">{fmtInt(p.samples)}</td></tr>; })}
          {!perf.length && <tr><td colSpan="5" className="bl-ad-empty">Ancora nessun dato.</td></tr>}</tbody></table></div>
    </Panel>
    <BugReports />
  </div>;
}
function AdSettingsView({ c, auto, setAuto, onLock }) {
  return <div className="bl-ad-stack">
    <ThemeSetting onNotify={c.onNotify} />
    <LimitSetting onNotify={c.onNotify} />
    <Panel title="Sessione" note="Lo sblocco del portale dura 30 minuti.">
      <div className="bl-ad-form wrap">
        <label className="bl-ad-switch"><input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} /><span aria-hidden="true" />Aggiorna i dati ogni minuto</label>
        <button type="button" className="bl-ad-btn" onClick={onLock}><LockKeyhole size={15} aria-hidden="true" />Blocca il portale</button>
      </div>
    </Panel>
  </div>;
}

/* ---------------------------- Contenitore ---------------------------- */
function AdminPortal({ onNotify, onClose }) {
  const [days, setDays] = useState(30);
  const [view, setView] = useState("overview");
  const [metricDetail, setMetricDetail] = useState(null);
  const [focus, setFocus] = useState(null);
  const [activity, setActivity] = useState(null);
  const [activityError, setActivityError] = useState("");
  const [data, setData] = useState(null);
  const [demoExtra, setDemoExtra] = useState(null);
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [auto, setAuto] = useState(true);
  const [stamp, setStamp] = useState(null);
  const [code, setCode] = useState(""); const [codeError, setCodeError] = useState(""); const [busy, setBusy] = useState(false);
  const [pref, setPref] = useState(() => { try { return localStorage.getItem("bolle-admin-theme") || "auto"; } catch { return "auto"; } });
  const [sysDark, setSysDark] = useState(() => !!window.matchMedia?.("(prefers-color-scheme: dark)").matches);
  const dark = pref === "dark" || (pref === "auto" && sysDark);

  useEffect(() => {
    const m = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!m) return undefined;
    const h = (e) => setSysDark(e.matches); m.addEventListener("change", h);
    return () => m.removeEventListener("change", h);
  }, []);
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape" && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName || "")) onClose?.(); };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  function toggleTheme() { const next = dark ? "light" : "dark"; setPref(next); try { localStorage.setItem("bolle-admin-theme", next); } catch { /* preferenza non salvata */ } }

  const load = useCallback(async () => {
    const t0 = performance.now();
    const { data: d, error } = await supabase.rpc("bolle_admin_dashboard", { p_days: days });
    setLoading(false);
    if (error) {
      if (String(error.message).includes("forbidden")) { setLocked(true); setData(null); setLoadError(""); }
      else setLoadError("Dashboard non disponibile. Hai eseguito la query SQL? (" + String(error.message).slice(0, 80) + ")");
      return;
    }
    setLocked(false); setLoadError(""); setData(d); setStamp(new Date());
    // Fasce d'età complete (incluso <18) e nazionalità: funzione separata, la dashboard esistente resta invariata.
    supabase.rpc("bolle_admin_demographics_extra").then(({ data: extra, error: extraError }) => { if (!extraError && extra) setDemoExtra(extra); });
    const { data: activityRows, error: activityErr } = await supabase.rpc("bolle_admin_activity", { p_days: days });
    setActivity(activityErr ? null : (activityRows || []));
    setActivityError(activityErr ? "Grafico dettagliato non disponibile: applica lo script SQL allegato." : "");
    trackPerf("admin_dashboard", performance.now() - t0);
  }, [days]);
  useEffect(() => { setLoading(true); load(); }, [load]);
  useEffect(() => { if (!auto || locked) return undefined; const id = setInterval(load, 60000); return () => clearInterval(id); }, [auto, locked, load]);

  async function unlock(e) {
    e.preventDefault(); setBusy(true); setCodeError("");
    const { data: ok, error } = await supabase.rpc("bolle_admin_unlock", { p_code: code });
    setBusy(false); setCode("");
    if (error) return setCodeError(friendlyError(error));
    if (!ok) return setCodeError("Codice non valido.");
    setLoading(true); load();
  }
  async function lock() { await supabase.rpc("bolle_admin_lock"); setLocked(true); setData(null); onNotify("Portale admin bloccato."); }

  // Cambia sezione; "target" chiede alla sezione di aprire direttamente un elenco (es. "users").
  const go = useCallback((id, target = null) => { setView(id); setFocus(target); }, []);

  let c = null;
  if (data) {
    const K = data.kpi || {}, errs = data.errors || { top: [], recent: [] };
    const natRows = (() => {
      if (!Array.isArray(demoExtra?.nationality)) return null;
      const merged = new Map();
      demoExtra.nationality.forEach((r) => {
        const cc = bolleCountryFromNationality(r.k), country = cc && countryList().find((x) => x.code === cc);
        const label = country ? country.name : (r.k ? r.k.charAt(0).toUpperCase() + r.k.slice(1) : "n.d.");
        merged.set(label, (merged.get(label) || 0) + Number(r.count || 0));
      });
      const all = [...merged].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value), rest = all.slice(8).reduce((s, r) => s + r.value, 0);
      return rest ? [...all.slice(0, 8), { label: "Altre", value: rest }] : all.slice(0, 8);
    })();
    c = {
      data, K, errs, days, natRows, demoExtra, activity, activityError, onNotify, metricDetail, go, focus,
      fq: data.frequency || {}, ret: data.retention || {}, series: data.series || [], perf: data.performance || [], demo: data.demographics || {}, C: data.content || {},
      guests: Math.max(0, num(K.total_users) - num(K.registered_users)),
      stick: num(K.mau) ? Math.round((num(K.dau) / num(K.mau)) * 100) : 0,
      feats: (data.features || []).map((f) => ({ label: EVENT_LABELS[f.event] || f.event, value: num(f.count), sub: `${fmtInt(f.users)} utenti` })),
      pickMetric: (k) => setMetricDetail((v) => (v === k ? null : k)),
    };
  }
  const current = AD_VIEWS.find((v) => v.id === view) || AD_VIEWS[0];
  const periodView = ["overview", "usage", "audience", "people", "content", "system"].includes(view);

  return <div className="bl-ad" data-theme={dark ? "dark" : "light"} role="dialog" aria-modal="true" aria-label="Portale amministrazione">
    <aside className="bl-ad-side">
      <div className="bl-ad-brand"><span aria-hidden="true">🫧</span><div><strong>Bolle</strong><small>Portale admin</small></div></div>
      <nav aria-label="Sezioni">{AD_VIEWS.map(({ id, label, Icon }) => <button type="button" key={id} aria-current={view === id ? "page" : undefined} disabled={!c} onClick={() => go(id)}><Icon size={18} aria-hidden="true" /><span>{label}</span>{id === "system" && c && num(c.errs.total) > 0 && <em aria-label={`${c.errs.total} errori`}>{num(c.errs.total) > 99 ? "99+" : num(c.errs.total)}</em>}</button>)}</nav>
    </aside>
    <div className="bl-ad-main">
      <header className="bl-ad-top">
        <div className="bl-ad-title"><h2>{c ? current.label : "Portale admin"}</h2><p>{c ? current.hint : "Area riservata"}</p></div>
        <div className="bl-ad-tools">
          {c && periodView && <div className="bl-ad-seg" role="group" aria-label="Periodo">{[7, 30, 90].map((d) => <button type="button" key={d} aria-pressed={days === d} onClick={() => setDays(d)}>{d} giorni</button>)}</div>}
          {c && <span className={`bl-ad-live ${auto ? "on" : ""}`} title={auto ? "Aggiornamento automatico ogni minuto" : "Aggiornamento automatico spento"}><i aria-hidden="true" />{stamp ? `Aggiornato alle ${stamp.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}` : ""}</span>}
          {c && <button type="button" className="bl-ad-icon" onClick={() => { setLoading(true); load(); }} aria-label="Aggiorna i dati" title="Aggiorna i dati"><RefreshCw size={16} /></button>}
          <button type="button" className="bl-ad-icon" onClick={toggleTheme} aria-label={dark ? "Passa al tema chiaro" : "Passa al tema scuro"} title={dark ? "Tema chiaro" : "Tema scuro"}>{dark ? <AdIcSun size={16} /> : <AdIcMoon size={16} />}</button>
          {c && <button type="button" className="bl-ad-icon" onClick={lock} aria-label="Blocca il portale" title="Blocca il portale"><LockKeyhole size={16} /></button>}
          <button type="button" className="bl-ad-icon" onClick={onClose} aria-label="Chiudi il portale" title="Chiudi"><AdIcX size={18} /></button>
        </div>
      </header>
      <main className="bl-ad-content">
        {locked && <form className="bl-ad-unlock" onSubmit={unlock}><LockKeyhole size={22} aria-hidden="true" /><h3>Area riservata</h3><p>Inserisci il codice amministratore. Lo sblocco dura 30 minuti.</p><label>Codice amministratore<input className="bl-ad-input" type="password" autoComplete="off" value={code} onChange={(e) => setCode(e.target.value)} required autoFocus /></label>{codeError && <p className="bl-ad-error" role="alert">{codeError}</p>}<button className="bl-ad-btn primary" type="submit" disabled={busy || !code}>{busy ? "Verifico…" : "Sblocca"}</button></form>}
        {!locked && loading && !data && <p className="bl-ad-empty">Carico le statistiche…</p>}
        {!locked && loadError && <div className="bl-ad-unlock"><p className="bl-ad-error" role="alert">{loadError}</p><button type="button" className="bl-ad-btn" onClick={() => { setLoading(true); load(); }}>Riprova</button></div>}
        {c && !locked && !loadError && <>
          {view === "overview" && <OverviewView c={c} />}
          {view === "usage" && <UsageView c={c} />}
          {view === "maps" && <MapsView dark={dark} refreshKey={stamp?.getTime()} />}
          {view === "audience" && <AudienceView c={c} />}
          {view === "people" && <UserActivityView c={c} />}
          {view === "content" && <ContentView c={c} />}
          {view === "system" && <SystemView c={c} />}
          {view === "settings" && <AdSettingsView c={c} auto={auto} setAuto={setAuto} onLock={lock} />}
        </>}
      </main>
    </div>
  </div>;
}


export default AdminPortal;