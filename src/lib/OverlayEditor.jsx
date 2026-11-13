import { useEffect, useRef, useState } from "react";
import { makeBlurPreview } from "./SequentialFeed.jsx";

/* =====================================================================
   Testo in sovrimpressione (editor + visualizzazione) e tag utenti.
   Formato di ogni blocco = quello validato da bolle_set_text_overlays:
   { text, x, y, scale, rotation, style, color }
   x, y in % della cornice (centro del testo) · scale 0.4–4 · rotation −180…180
   ===================================================================== */
export const MAX_OVERLAYS = 3;
export const MAX_TAGS = 3;
const STYLES = [["classic", "Aa"], ["bold", "Aa"], ["shadow", "Aa"], ["bubble", "Aa"], ["neon", "Aa"]];
const COLORS = ["#ffffff", "#111111", "#ffd84d", "#ff6fa5", "#6ee0cf", "#8c7bdb"];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const round1 = (v) => Math.round(v * 10) / 10;

export function useWidth(ref) {
  const [w, setW] = useState(300);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const read = () => setW(el.getBoundingClientRect().width || 300);
    read();
    if (typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

function textStyle(o, w) {
  const base = {
    position: "absolute", left: `${o.x}%`, top: `${o.y}%`, margin: 0, padding: "2px 8px",
    transform: `translate(-50%,-50%) rotate(${o.rotation}deg) scale(${o.scale})`,
    transformOrigin: "center", fontSize: Math.max(12, w * 0.075), lineHeight: 1.15, fontWeight: 800,
    textAlign: "center", whiteSpace: "pre-wrap", overflowWrap: "anywhere", maxWidth: "86%", width: "max-content",
    color: o.color, fontFamily: "inherit", userSelect: "none", WebkitUserSelect: "none",
  };
  if (o.style === "bold") return { ...base, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".02em", textShadow: "0 2px 6px rgba(0,0,0,.65)" };
  if (o.style === "shadow") return { ...base, fontWeight: 700, textShadow: "3px 3px 0 rgba(0,0,0,.55)" };
  if (o.style === "bubble") return { ...base, padding: "4px 14px", borderRadius: 999, background: o.color === "#ffffff" ? "rgba(0,0,0,.55)" : "rgba(255,255,255,.88)", color: o.color === "#ffffff" ? "#fff" : o.color === "#111111" ? "#111" : o.color, backdropFilter: "none" };
  if (o.style === "neon") return { ...base, textShadow: `0 0 4px #fff, 0 0 12px ${o.color}, 0 0 24px ${o.color}` };
  return { ...base, textShadow: "0 1px 2px rgba(0,0,0,.8), 0 2px 14px rgba(0,0,0,.7)" };
}

/* Anteprima di uno stile, per i pulsanti della barra */
const stylePreview = (cur, k) => ({
  ...textStyle({ ...cur, style: k, x: 0, y: 0, scale: 1, rotation: 0 }, 150),
  position: "static", transform: "none", fontSize: 16, maxWidth: "none",
  background: k === "bubble" ? "rgba(0,0,0,.55)" : "rgba(0,0,0,.3)", borderRadius: 10, padding: "4px 10px",
});

/* ---------- Visualizzazione (dopo lo scoppio): sola lettura, stessa resa dell'editor ---------- */
export function OverlayLayer({ overlays }) {
  const ref = useRef(null);
  const w = useWidth(ref);
  if (!overlays?.length) return null;
  return (
    <div ref={ref} className="bl-ov-layer" aria-hidden="false" style={{ position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none", overflow: "hidden" }}>
      {overlays.map((o, i) => <p key={i} style={textStyle(o, w)}>{o.text}</p>)}
    </div>
  );
}

/* ---------- Editor: sposta con un dito, pizzica per zoom e rotazione, maniglia in basso a destra ---------- */
export function OverlayStage({ overlays, onChange, sel, setSel, disabled = false, hideEmptyHint = false, passThrough = false }) {
  const stageRef = useRef(null);
  const w = useWidth(stageRef);
  const ptrs = useRef(new Map());                 // pointerId → {x,y}
  const gesture = useRef(null);
  const items = overlays;
  const [editing, setEditing] = useState(null);   // indice del testo in digitazione diretta sulla foto

  // Un testo appena aggiunto (vuoto) si apre subito in digitazione.
  useEffect(() => { if (sel != null && items[sel] && !items[sel].text) setEditing(sel); }, [sel]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (sel == null) setEditing(null); }, [sel]);

  const patch = (i, p) => onChange(items.map((o, k) => (k === i ? { ...o, ...p } : o)));

  const add = () => addOverlay(items, onChange, setSel);

  const rect = () => stageRef.current.getBoundingClientRect();

  function down(e, i) {
    if (disabled) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    setSel(i);
    const o = items[i];
    const pts = [...ptrs.current.values()];
    if (pts.length === 1) {
      gesture.current = { type: "drag", i, sx: e.clientX, sy: e.clientY, ox: o.x, oy: o.y };
    } else if (pts.length >= 2) {
      const [a, b] = pts;
      gesture.current = { type: "pinch", i, d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, a0: Math.atan2(b.y - a.y, b.x - a.x), s0: o.scale, r0: o.rotation };
    }
  }
  function move(e) {
    const g = gesture.current;
    if (!g || !ptrs.current.has(e.pointerId)) return;
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const r = rect();
    if (g.type === "drag") {
      patch(g.i, { x: round1(clamp(g.ox + ((e.clientX - g.sx) / r.width) * 100, 4, 96)), y: round1(clamp(g.oy + ((e.clientY - g.sy) / r.height) * 100, 4, 96)) });
    } else if (g.type === "pinch") {
      const [a, b] = [...ptrs.current.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      let rot = g.r0 + ((Math.atan2(b.y - a.y, b.x - a.x) - g.a0) * 180) / Math.PI;
      rot = ((((rot + 180) % 360) + 360) % 360) - 180;
      patch(g.i, { scale: round1(clamp(g.s0 * (d / g.d0), 0.4, 4)), rotation: Math.round(rot) });
    } else if (g.type === "handle") {
      const dx = e.clientX - g.cx, dy = e.clientY - g.cy;
      const dist = Math.hypot(dx, dy);
      let rot = g.r0 + ((Math.atan2(dy, dx) - g.a0) * 180) / Math.PI;
      rot = ((((rot + 180) % 360) + 360) % 360) - 180;
      patch(g.i, { scale: round1(clamp(g.s0 * (dist / g.d0), 0.4, 4)), rotation: Math.round(rot) });
    }
  }
  function up(e) {
    const g = gesture.current;
    if (g?.type === "drag" && ptrs.current.size === 1 && Math.hypot(e.clientX - g.sx, e.clientY - g.sy) < 6 && !disabled) setEditing(g.i); // tocco semplice = scrivi
    ptrs.current.delete(e.pointerId);
    if (ptrs.current.size === 0) gesture.current = null;
    else if (ptrs.current.size === 1 && gesture.current?.type === "pinch") {
      const [p] = [...ptrs.current.values()]; const o = items[gesture.current.i];
      gesture.current = { type: "drag", i: gesture.current.i, sx: p.x, sy: p.y, ox: o.x, oy: o.y };
    }
  }
  function handleDown(e, i) {
    if (disabled) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const r = rect(), o = items[i];
    const cx = r.left + (o.x / 100) * r.width, cy = r.top + (o.y / 100) * r.height;
    const dx = e.clientX - cx, dy = e.clientY - cy;
    gesture.current = { type: "handle", i, cx, cy, d0: Math.hypot(dx, dy) || 1, a0: Math.atan2(dy, dx), s0: o.scale, r0: o.rotation };
  }

  return (
      <div ref={stageRef} className="bl-ov-stage" style={{ position: "absolute", inset: 0, zIndex: 3, touchAction: "none", overflow: "hidden", pointerEvents: passThrough ? "none" : undefined }}
        onPointerMove={move} onPointerUp={up} onPointerCancel={up} onPointerDown={() => { setSel(null); setEditing(null); }}>
        {items.map((o, i) => (
          <div key={i} onPointerDown={(e) => down(e, i)} style={{ ...textStyle(o, w), cursor: "grab", touchAction: "none", outline: sel === i ? "1.5px dashed rgba(255,255,255,.95)" : "none", outlineOffset: 4, pointerEvents: "auto" }}>
            {editing === i && !disabled ? (
              <span style={{ display: "grid", userSelect: "text", WebkitUserSelect: "text" }}>
                <span aria-hidden="true" style={{ gridArea: "1 / 1", visibility: "hidden", whiteSpace: "pre-wrap", overflowWrap: "anywhere", minWidth: "4ch" }}>{(o.text || "Scrivi…") + "\n"}</span>
                <textarea autoFocus value={o.text} maxLength={120} placeholder="Scrivi…" aria-label="Testo sopra la foto o il video" rows={1}
                  onChange={(e) => patch(i, { text: e.target.value })}
                  onPointerDown={(e) => e.stopPropagation()}
                  onBlur={() => { setEditing(null); if (!items[i]?.text.trim()) { onChange(items.filter((_, k) => k !== i)); setSel(null); } }}
                  style={{ gridArea: "1 / 1", width: "100%", margin: 0, padding: 0, border: 0, outline: 0, background: "transparent", resize: "none", overflow: "hidden", font: "inherit", color: "inherit", textAlign: "center", textShadow: "inherit", textTransform: "inherit", letterSpacing: "inherit", caretColor: o.color, userSelect: "text", WebkitUserSelect: "text", touchAction: "auto" }} />
              </span>
            ) : (o.text || <span style={{ opacity: .6 }}>Scrivi…</span>)}
            {sel === i && editing === i && <span aria-label="Sposta il testo" title="Trascina per spostare" style={{ position: "absolute", left: -16, top: -16, width: 26, height: 26, borderRadius: "50%", background: "#fff", color: "#4a3d8f", font: "700 14px/26px system-ui", textAlign: "center", boxShadow: "0 1px 6px rgba(0,0,0,.45)", cursor: "grab", touchAction: "none", transform: `scale(${1 / o.scale})`, transformOrigin: "center" }}>✥</span>}
            {sel === i && <span role="slider" aria-label="Ridimensiona e ruota il testo" aria-valuenow={Math.round(o.scale * 100)} tabIndex={0}
              onPointerDown={(e) => handleDown(e, i)} onPointerMove={move} onPointerUp={up}
              style={{ position: "absolute", right: -16, bottom: -16, width: 26, height: 26, borderRadius: "50%", background: "#fff", color: "#4a3d8f", font: "700 14px/26px system-ui", textAlign: "center", boxShadow: "0 1px 6px rgba(0,0,0,.45)", cursor: "nwse-resize", touchAction: "none", transform: `scale(${1 / o.scale})`, transformOrigin: "center" }}>⤡</span>}
          </div>
        ))}
        {items.length === 0 && !disabled && !hideEmptyHint && (
          <button type="button" className="bl-ov-empty" onPointerDown={(e) => e.stopPropagation()} onClick={add}
            style={{ position: "absolute", left: "50%", bottom: "9%", transform: "translateX(-50%)", pointerEvents: "auto", padding: "8px 16px", borderRadius: 999, border: "1px solid rgba(255,255,255,.9)", background: "rgba(0,0,0,.45)", color: "#fff", font: "700 14px system-ui" }}>
            Aa Aggiungi testo
          </button>
        )}
      </div>
  );
}

export function addOverlay(items, onChange, setSel) {
  if (items.length >= MAX_OVERLAYS) return;
  onChange([...items, { text: "", x: 50, y: 50, scale: 1, rotation: 0, style: "classic", color: "#ffffff" }]);
  setSel(items.length);
}

/* ---------- Barra a destra della foto, in trasparenza: aggiungi testo · stile · colore · elimina ----------
   Va messa DENTRO la cornice della foto (accanto a <OverlayStage>): è stretta e semi-trasparente,
   così non copre il contenuto. I selettori di stile e colore si aprono a sinistra solo quando servono. */
export function OverlayRail({ overlays: items, onChange, sel, setSel, disabled = false, onStickers = null, stickersOpen = false, children = null }) {
  const [panel, setPanel] = useState(null); // null | "style" | "color"
  const cur = sel != null ? items[sel] : null;
  const patch = (p) => onChange(items.map((o, k) => (k === sel ? { ...o, ...p } : o)));
  useEffect(() => { if (!cur) setPanel(null); }, [cur]);
  const add = () => { addOverlay(items, onChange, setSel); setPanel(null); };
  const remove = () => { onChange(items.filter((_, k) => k !== sel)); setSel(null); setPanel(null); };
  const stop = (e) => e.stopPropagation();
  const toggle = (name) => setPanel((p) => (p === name ? null : name));
  return (
    <div className="bl-ov-rail" role="toolbar" aria-label="Strumenti testo" aria-orientation="vertical" onPointerDown={stop} onPointerMove={stop} onPointerUp={stop}>
      <button type="button" className="bl-ov-rail-btn" disabled={disabled || items.length >= MAX_OVERLAYS} onClick={add} aria-label="Aggiungi un testo" title="Aggiungi un testo">
        <span>Aa</span><small>{items.length}/{MAX_OVERLAYS}</small>
      </button>
      {onStickers && <button type="button" className="bl-ov-rail-btn" disabled={disabled} onClick={onStickers} aria-label="Aggiungi uno sticker" title="Sticker" aria-pressed={stickersOpen}><span style={{ fontSize: 17, lineHeight: 1 }}>😊</span><small>Sticker</small></button>}
      {children}
      {cur && <>
        <div className="bl-ov-rail-item">
          <button type="button" className="bl-ov-rail-btn" aria-pressed={panel === "style"} aria-label="Stile del testo" title="Stile" onClick={() => toggle("style")}><span style={{ fontWeight: cur.style === "bold" ? 900 : 700, fontStyle: "normal" }}>Stile</span></button>
          {panel === "style" && <div className="bl-ov-rail-pop" role="group" aria-label="Scegli lo stile">
            {STYLES.map(([k, l]) => <button key={k} type="button" aria-label={`Stile ${k}`} aria-pressed={cur.style === k} onClick={() => { patch({ style: k }); setPanel(null); }} style={stylePreview(cur, k)}>{l}</button>)}
          </div>}
        </div>
        <div className="bl-ov-rail-item">
          <button type="button" className="bl-ov-rail-btn" aria-pressed={panel === "color"} aria-label="Colore del testo" title="Colore" onClick={() => toggle("color")}><span className="bl-ov-rail-dot" style={{ background: cur.color }} /></button>
          {panel === "color" && <div className="bl-ov-rail-pop" role="group" aria-label="Scegli il colore">
            {COLORS.map((c) => <button key={c} type="button" aria-label={`Colore ${c}`} aria-pressed={cur.color === c} className="bl-ov-rail-swatch" style={{ background: c }} onClick={() => { patch({ color: c }); setPanel(null); }} />)}
          </div>}
        </div>
        <button type="button" className="bl-ov-rail-btn" onClick={remove} aria-label="Elimina questo testo" title="Elimina">🗑</button>
      </>}
    </div>
  );
}

/* ---------- Campo di testo del blocco selezionato (sotto la foto, compatto) ---------- */
export function OverlayTextField({ overlays: items, onChange, sel, disabled = false }) {
  const cur = sel != null ? items[sel] : null;
  const patch = (p) => onChange(items.map((o, k) => (k === sel ? { ...o, ...p } : o)));
  if (!cur) return <p className="bl-muted bl-ov-hint">{items.length ? "Tocca un testo per modificarlo · trascina per spostarlo · pizzica per ingrandire e ruotare" : "Tocca «Aa» sulla destra della foto per aggiungere un testo"}</p>;
  return (
    <div className="bl-ov-tools">
      <input key={sel} className="bl-ov-text" maxLength={120} disabled={disabled} value={cur.text} autoFocus={!cur.text} onChange={(e) => patch({ text: e.target.value })} placeholder="Scrivi qui il testo" aria-label="Testo sopra la foto o il video" />
      <small className="bl-muted">Trascina per spostare · pizzica o usa ⤡ per ingrandire e ruotare</small>
    </div>
  );
}

/* ---------- Vecchi strumenti sotto la cornice (non più usati dal compositore, restano per compatibilità) ---------- */
export function OverlayTools({ overlays: items, onChange, sel, setSel, disabled = false }) {
  const patch = (i, p) => onChange(items.map((o, k) => (k === i ? { ...o, ...p } : o)));
  const remove = (i) => { onChange(items.filter((_, k) => k !== i)); setSel(null); };
  const add = () => addOverlay(items, onChange, setSel);
  const cur = sel != null ? items[sel] : null;
  return (
    <div className="bl-ov-tools">
        {cur && <>
          <input className="bl-ov-text" maxLength={120} value={cur.text} autoFocus={!cur.text} onChange={(e) => patch(sel, { text: e.target.value })} placeholder="Scrivi qui il testo" aria-label="Testo sopra la foto o il video" />
          <div className="bl-ov-row" role="group" aria-label="Stile del testo">
            {STYLES.map(([k, l]) => <button key={k} type="button" className={cur.style === k ? "on" : ""} aria-pressed={cur.style === k} onClick={() => patch(sel, { style: k })} style={stylePreview(cur, k)}>{l}</button>)}
          </div>
          <div className="bl-ov-row" role="group" aria-label="Colore del testo">
            {COLORS.map((c) => <button key={c} type="button" aria-label={`Colore ${c}`} aria-pressed={cur.color === c} className={cur.color === c ? "on" : ""} onClick={() => patch(sel, { color: c })} style={{ width: 30, height: 30, borderRadius: "50%", background: c, border: "2px solid rgba(255,255,255,.9)", padding: 0 }} />)}
            <button type="button" className="bl-ov-del" onClick={() => remove(sel)} aria-label="Elimina questo testo">🗑</button>
          </div>
        </>}
        <div className="bl-ov-row">
          <button type="button" className="bl-cmp-ghost" disabled={items.length >= MAX_OVERLAYS || disabled} onClick={add}>➕ Aggiungi testo ({items.length}/{MAX_OVERLAYS})</button>
          {!cur && items.length > 0 && <small className="bl-muted">Trascina per spostare · pizzica o usa ⤡ per ingrandire e ruotare</small>}
        </div>
      </div>
  );
}

/* ---------- Tag: massimo 3 username, con suggerimenti dei più frequentati ----------
   suggestions = [{ username, score }] già ordinati per frequenza (li calcola il compositore). */
export function TagPicker({ tags, onChange, disabled = false, suggestions = [], onSearch = null }) {
  const [val, setVal] = useState("");
  const [found, setFound] = useState([]); // risultati della ricerca per prefisso (server)
  const clean = (v) => String(v || "").trim().replace(/^@+/, "").toLowerCase();
  const add = (raw) => {
    const name = clean(raw);
    setVal("");
    if (!name || tags.includes(name) || tags.length >= MAX_TAGS) return;
    onChange([...tags, name]);
  };
  const q = clean(val);
  // Ricerca per prefisso mentre si digita (con piccola attesa per non fare una richiesta a ogni lettera).
  useEffect(() => {
    if (!onSearch || !q) { setFound([]); return undefined; }
    let alive = true;
    const t = setTimeout(async () => {
      try { const rows = await onSearch(q); if (alive) setFound(Array.isArray(rows) ? rows : []); }
      catch { if (alive) setFound([]); }
    }, 180);
    return () => { alive = false; clearTimeout(t); };
  }, [q, onSearch]);
  // Prima chi inizia con le lettere digitate (server), poi gli utenti con cui si interagisce di più che contengono le lettere.
  const merged = [];
  const seen = new Set();
  const push = (u) => { const name = clean(u?.username); if (name && !seen.has(name) && !tags.includes(name)) { seen.add(name); merged.push({ username: name }); } };
  if (q) found.filter((s) => clean(s.username).startsWith(q)).forEach(push);
  suggestions.filter((s) => !q || clean(s.username).includes(q)).forEach(push);
  const shown = merged.slice(0, 8);
  const full = tags.length >= MAX_TAGS;
  return (
    <div className="bl-ov-tags">
      <p className="bl-muted" style={{ margin: "6px 0 4px" }}>Tagga fino a {MAX_TAGS} persone. Vedranno il tag dopo la pubblicazione.</p>
      <div className="bl-ov-row">
        {tags.map((t) => <span key={t} className="bl-ov-chip">@{t}<button type="button" aria-label={`Togli @${t}`} onClick={() => onChange(tags.filter((x) => x !== t))}>×</button></span>)}
        {!full && <input className="bl-ov-tag-input" disabled={disabled} value={val} maxLength={30} placeholder="@username" aria-label="Username da taggare"
          onChange={(e) => setVal(e.target.value)} onBlur={() => add(val)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === "," || e.key === " ") { e.preventDefault(); add(val); } }} />}
      </div>
      {!full && shown.length > 0 && (
        <div className="bl-ov-suggest" role="group" aria-label="Persone suggerite">
          <span className="bl-ov-suggest-label">{q ? "Corrispondenze" : "Con chi interagisci di più"}</span>
          {shown.map((s) => (
            <button key={s.username} type="button" disabled={disabled}
              onPointerDown={(e) => e.preventDefault() /* non far perdere il focus al campo: il blur salverebbe il testo digitato */}
              onClick={() => add(s.username)}>@{s.username}</button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Anteprima sfocata (24×24) dal file pubblicato; mai bloccante ---------- */
export async function blurFromFile(file) {
  try {
    if (file.type?.startsWith("video/")) {
      const url = URL.createObjectURL(file);
      try {
        const v = document.createElement("video");
        v.muted = true; v.playsInline = true; v.preload = "auto"; v.src = url;
        await new Promise((res, rej) => { v.onloadeddata = res; v.onerror = rej; setTimeout(rej, 6000); });
        try { v.currentTime = Math.min(0.1, (v.duration || 1) / 2); await new Promise((r) => { v.onseeked = r; setTimeout(r, 1500); }); } catch { /* primo fotogramma */ }
        return await makeBlurPreview(v);
      } finally { URL.revokeObjectURL(url); }
    }
    return await makeBlurPreview(file);
  } catch { return null; }
}

export const OVERLAY_CSS = `
.bl-ov-tools{display:flex;flex-direction:column;gap:8px;margin-top:10px}
.bl-ov-row{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
.bl-ov-row button.on{outline:2px solid #6a5fb0;outline-offset:2px}
.bl-ov-text,.bl-ov-tag-input{min-height:40px;padding:0 12px;border-radius:12px;border:1px solid rgba(106,95,176,.35);background:rgba(255,255,255,.85);color:#2b2150;font:600 16px system-ui;outline:0;transition:border-color .15s ease,box-shadow .15s ease}
.bl-ov-text:focus,.bl-ov-text:focus-visible,.bl-ov-tag-input:focus,.bl-ov-tag-input:focus-visible{outline:0;border-color:#8f7dff;box-shadow:0 0 0 3px rgba(143,125,255,.35),0 0 14px rgba(143,125,255,.4)}
.bl-ov-text{width:100%;box-sizing:border-box}
.bl-ov-del{min-width:40px;min-height:40px;border-radius:50%;border:1px solid rgba(106,95,176,.35);background:rgba(255,255,255,.85)}
.bl-ov-chip{display:inline-flex;align-items:center;gap:4px;padding:6px 6px 6px 12px;border-radius:999px;background:#6a5fb0;color:#fff;font:700 13px system-ui}
.bl-ov-chip button{border:0;background:transparent;color:#fff;min-width:28px;min-height:28px;font-size:16px}
`;