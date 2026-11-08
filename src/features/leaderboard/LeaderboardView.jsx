import React, { useState, useEffect, useMemo } from "react";
import { Trophy, Medal, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { supabase, errorText } from "../../lib/bolleCore.jsx";
import { bubbleKind, KIND_META } from "../../lib/bubbleTypes.js";
import { cachedSignedUrl } from "../../lib/storage.js";
import { romeToday, isoDay } from "../../lib/geo.js";

function openUserProfile(username) {
  window.dispatchEvent(new CustomEvent("bolle:open-profile", { detail: { username } }));
}

/* Albo d'oro: i primi classificati di settimane e mesi conclusi, fino a un anno indietro. */
const HALL_TOP = 3;

function hallPeriods(kind) {
  const today = romeToday(), out = [];
  const short = new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short", timeZone: "UTC" });
  const long = new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  if (kind === "week") {
    const monday = new Date(today);
    monday.setUTCDate(today.getUTCDate() - ((today.getUTCDay() + 6) % 7));
    for (let k = 1; k <= 52; k++) { // 52 settimane concluse = massimo un anno indietro
      const start = new Date(monday);
      start.setUTCDate(monday.getUTCDate() - 7 * k);
      const end = new Date(start);
      end.setUTCDate(start.getUTCDate() + 6);
      out.push({ value: isoDay(start), label: `${short.format(start)} – ${long.format(end)}` });
    }
  } else {
    const fmt = new Intl.DateTimeFormat("it-IT", { month: "long", year: "numeric", timeZone: "UTC" });
    for (let k = 1; k <= 12; k++) {
      const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - k, 1));
      const label = fmt.format(start);
      out.push({ value: isoDay(start), label: label.charAt(0).toUpperCase() + label.slice(1) });
    }
  }
  return out;
}

export function HallOfFameView({ medalColors, onNotify }) {
  const [kind, setKind] = useState("week");
  const periods = useMemo(() => hallPeriods(kind), [kind]);
  const [start, setStart] = useState(() => hallPeriods("week")[0].value);
  const [rows, setRows] = useState(null);

  useEffect(() => {
    setStart(periods[0].value);
  }, [periods]);

  useEffect(() => {
    if (!periods.some(p => p.value === start)) return; // attende l'allineamento tra tipo e periodo
    let alive = true;
    setRows(null);
    supabase.rpc("bolle_leaderboard_hall", { p_kind: kind, p_period_start: start, p_limit: HALL_TOP }).then(({ data, error }) => {
      if (!alive) return;
      if (error) { setRows([]); onNotify?.(errorText(error)); return; }
      setRows(data || []);
    });
    return () => { alive = false; };
  }, [kind, start, periods, onNotify]);

  const current = periods.find(p => p.value === start);

  return (
    <div className="bl-hall">
      <h3 className="bl-lb-title"><Trophy size={22} strokeWidth={2} aria-hidden="true" /> ALBO D’ORO</h3>
      <p className="bl-lb-metric">Podio per <strong>aperture ricevute</strong> dalle bolle pubblicate.</p>
      <div className="bl-segment bl-hall-kind" role="group" aria-label="Tipo di periodo">
        <button className={kind === "week" ? "on" : ""} aria-pressed={kind === "week"} onClick={() => setKind("week")}>Settimane</button>
        <button className={kind === "month" ? "on" : ""} aria-pressed={kind === "month"} onClick={() => setKind("month")}>Mesi</button>
      </div>
      <label className="bl-hall-select"><span>{kind === "week" ? "Scegli la settimana" : "Scegli il mese"}</span>
        <select value={start} onChange={e => setStart(e.target.value)} aria-label={kind === "week" ? "Settimana passata" : "Mese passato"}>
          {periods.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </label>
      {current && <p className="bl-hall-period">{current.label}</p>}
      {rows === null && <p className="bl-muted">Carico l’albo d’oro…</p>}
      {rows && rows.length === 0 && <div className="bl-insights-empty"><span><Trophy size={54} strokeWidth={1.7} aria-hidden="true" /></span><h3>Nessun vincitore</h3><p>In questo periodo nessuna bolla è stata scoppiata.</p></div>}
      {rows && rows.length > 0 && <ol className="bl-lb">{rows.map(r => (
        <li key={r.pos} className={r.is_me ? "me" : ""}>
          <span className="bl-lb-pos"><Medal size={25} strokeWidth={2} color={medalColors[Math.min(Number(r.pos), 3) - 1] || medalColors[2]} aria-label={`Posizione ${r.pos}`} /></span>
          <span className="bl-lb-name"><button type="button" className="bl-user-link" onClick={(e) => { e.stopPropagation(); openUserProfile(r.username); }} onKeyDown={(e) => e.stopPropagation()}>{r.username}</button>{r.is_me && <em> (tu)</em>}</span>
          <strong>{r.opens} {Number(r.opens) === 1 ? "apertura" : "aperture"}</strong>
        </li>
      ))}</ol>}
      <small className="bl-muted">Si possono rivedere i podi delle settimane (da lunedì a domenica) e dei mesi conclusi, fino a un anno indietro. Ora italiana. A parità di aperture, ordine alfabetico.</small>
    </div>
  );
}

export function LeaderboardUserDetail({ row, period, onBack }) {
  const [state, setState] = useState({ loading: true, bubbles: [], error: "" });

  useEffect(() => {
    let alive = true;
    setState({ loading: true, bubbles: [], error: "" });
    supabase.rpc("bolle_leaderboard_user_bubbles", { p_username: row.username, p_period: period }).then(async ({ data, error }) => {
      if (!alive) return;
      if (error) { setState({ loading: false, bubbles: [], error: "Bolle non disponibili al momento." }); return; }
      const rows = Array.isArray(data) ? data : [];
      // Miniatura reale solo per foto e video; sondaggi, domande, GIF, meme… mostrano l'icona del tipo.
      const withThumbs = await Promise.all(rows.map(async (b) => {
        const kind = bubbleKind({ kind: b.kind });
        if (!b.media_path || kind !== "photo") return { ...b, previewUrl: null }; // i video mostrano l'icona: niente download del file
        try { return { ...b, previewUrl: await cachedSignedUrl(b.media_path, 3600) }; }
        catch { return { ...b, previewUrl: null }; }
      }));
      if (alive) setState({ loading: false, bubbles: withThumbs, error: "" });
    });
    return () => { alive = false; };
  }, [row.username, period]);

  return (
    <div className="bl-insights bl-lb-detail">
      <button type="button" className="bl-ghost bl-lb-back" onClick={onBack}>‹ Torna alla classifica</button>
      <div className="bl-lb-detail-head">
        <span className="bl-lb-detail-pos">{row.pos}°</span>
        <div>
          <strong><button type="button" className="bl-user-link" onClick={() => openUserProfile(row.username)}>@{row.username}</button>{row.is_me && <em> (tu)</em>}</strong>
          <small>{row.opens} {Number(row.opens) === 1 ? "apertura" : "aperture"} {period === "week" ? "questa settimana" : "questo mese"}</small>
        </div>
      </div>
      {state.loading && <p className="bl-muted">Carico le bolle…</p>}
      {state.error && <p className="bl-muted" role="alert">{state.error}</p>}
      {!state.loading && !state.error && (
        <section className="bl-insights-section">
          <div className="bl-insights-heading"><h3>🫧 Bolle pubblicate</h3><small>{state.bubbles.length}</small></div>
          {state.bubbles.length === 0 ? <p className="bl-muted">Nessuna bolla pubblicata.</p> : (
            <div className="bl-lb-bubble-grid">
              {state.bubbles.map(b => {
                const k = bubbleKind({ kind: b.kind });
                const pops = Number(b.opens_total) || 0;
                return (
                  <div key={b.bubble_id} className={`bl-lb-tile bl-mini-${k}`} aria-label={`${KIND_META[k].label}, ${pops} aperture`}>
                    {b.previewUrl ? (k === "video" ? <video src={b.previewUrl} muted playsInline preload="metadata" /> : <img src={b.previewUrl} alt="" loading="lazy" draggable={false} />) : <span className="bl-lb-tile-icon" aria-hidden="true">{KIND_META[k].icon}</span>}
                    <b className="bl-lb-tile-count">👁 {pops}</b>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default function LeaderboardView({ onNotify }) {
  const [period, setPeriod] = useState("week");
  const [rows, setRows] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);

  useEffect(() => {
    if (period === "hall") { setRows([]); return; }
    let alive = true;
    setRows(null);
    supabase.rpc("bolle_leaderboard_v2", { p_period: period, p_limit: 20 }).then(({ data, error }) => {
      if (!alive) return;
      if (error) { setRows([]); onNotify(errorText(error)); return; }
      setRows(data || []);
    });
    return () => { alive = false; };
  }, [period, onNotify]);

  const medalColors = ["#c79a2b", "#8b94a6", "#b67b58"];
  if (selectedRow) return <LeaderboardUserDetail row={selectedRow} period={period} onBack={() => setSelectedRow(null)} />;

  return (
    <div className="bl-insights">
      <div className="bl-segment bl-lb-segment" role="group" aria-label="Periodo">
        <button className={period === "week" ? "on" : ""} aria-pressed={period === "week"} onClick={() => setPeriod("week")}>Settimanale</button>
        <button className={period === "month" ? "on" : ""} aria-pressed={period === "month"} onClick={() => setPeriod("month")}>Mensile</button>
        <button className={period === "hall" ? "on" : ""} aria-pressed={period === "hall"} onClick={() => setPeriod("hall")}>Albo d’oro</button>
      </div>
      {period === "hall" ? <HallOfFameView medalColors={medalColors} onNotify={onNotify} /> : (
        <>
          <h3 className="bl-lb-title"><Trophy size={22} strokeWidth={2} aria-hidden="true" /> CLASSIFICA {period === "week" ? "SETTIMANALE" : "MENSILE"}</h3>
          <p className="bl-lb-metric">Conta le <strong>aperture ricevute</strong> dalle bolle che ogni utente ha pubblicato. Non sono gli scoppi che effettui tu.</p>
          {rows === null && <p className="bl-muted">Carico la classifica…</p>}
          {rows && rows.length === 0 && (
            <div className="bl-insights-empty"><span><Trophy size={54} strokeWidth={1.7} aria-hidden="true" /></span><h3>Ancora nessuna apertura</h3><p>{period === "week" ? "Questa settimana" : "Questo mese"} nessuna bolla è stata scoppiata. Pubblica una bolla e sarai tra i primi!</p></div>
          )}
          {rows && rows.length > 0 && (
            <ol className="bl-lb">
              {rows.map((r) => (
                <li key={r.pos} className={`bl-lb-clickable ${r.is_me ? "me" : ""}`} role="button" tabIndex={0} aria-label={`Vedi bolle e aperture di ${r.username}`} onClick={() => setSelectedRow(r)} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedRow(r); } }}>
                  <span className="bl-lb-pos">{r.pos >= 1 && r.pos <= 3 ? <Medal size={25} strokeWidth={2} color={medalColors[r.pos - 1]} aria-label={`Posizione ${r.pos}`} /> : `${r.pos}.`}</span>
                  <span className="bl-lb-name"><button type="button" className="bl-user-link" onClick={(e) => { e.stopPropagation(); openUserProfile(r.username); }} onKeyDown={(e) => e.stopPropagation()}>{r.username}</button>{r.is_me && <em> (tu)</em>}
                    <span className="bl-lb-badges">
                      {r.trend === "up" ? <span className="bl-lb-trend up" title="Posizione in salita"><TrendingUp size={13} /> In salita</span> : r.trend === "down" ? <span className="bl-lb-trend down" title="Posizione in discesa"><TrendingDown size={13} /> In discesa</span> : r.trend === "stable" ? <span className="bl-lb-trend stable" title="Posizione stabile"><Minus size={13} /> Stabile</span> : null}
                      {r.activity_level && <span className="bl-lb-activity" title="Attività negli ultimi 7 giorni">{{ hyper: "🔥 Iper attivo", very: "⚡ Molto attivo", active: "✅ Attivo", low: "💤 Poco attivo", absent: "⚪ Assente" }[r.activity_level] || ""}</span>}
                    </span>
                  </span>
                  <strong>{r.opens} {Number(r.opens) === 1 ? "apertura" : "aperture"}</strong>
                  <i className="bl-lb-chevron" aria-hidden="true">›</i>
                </li>
              ))}
            </ol>
          )}
          <small className="bl-muted">Tocca un utente per vedere le sue bolle e le aperture che contano per la sua posizione. La classifica conta le aperture ricevute dalle bolle pubblicate, non gli scoppi effettuati. {period === "week" ? "Da lunedì a domenica" : "Mese di calendario"}, ora italiana. A parità di aperture, ordine alfabetico. Trend rispetto al periodo precedente (— se non classificato). Attività: scoppi effettuati negli ultimi 7 giorni, non aperture ricevute.</small>
        </>
      )}
    </div>
  );
}
