import React, { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { supabase } from "./bolleCore.jsx";

/* Schermata intera che si apre quando tocchi una Bolla a catena (prima dello scoppio).
   La catena si compone una bolla alla volta (una per ogni utente che ha già contribuito); alla fine compare
   «Vuoi contribuire anche tu?». I partecipanti restano anonimi: ogni bolla è solo un colore.
   Props:
     bubble        la bolla toccata ({ id, chainCount? })
     onContribute  (rootId) => apri il pannello «Cosa vuoi pubblicare?» collegato alla catena
     onOpen        () => non contribuisco ora: scoppia/apri la bolla come al solito
     onClose       () => torna al feed senza fare nulla */

const MAX_ORBS = 10;   // oltre questo numero l'ultima bolla diventa «+N»
const STEP_MS = 520;   // una bolla ogni STEP_MS

const CSS = `
.bl-ci{position:fixed;inset:0;z-index:90;display:flex;flex-direction:column;align-items:center;padding:calc(18px + env(safe-area-inset-top)) 18px calc(22px + env(safe-area-inset-bottom));color:#fff;background:radial-gradient(120% 80% at 50% 0%,#3a2a8f 0%,#1c1550 45%,#0b0824 100%);overflow:hidden;animation:bl-ci-in .35s ease both}
.bl-ci-close{position:absolute;top:calc(12px + env(safe-area-inset-top));right:14px;display:grid;place-items:center;width:44px;height:44px;border:1px solid rgba(255,255,255,.28);border-radius:50%;background:rgba(255,255,255,.1);color:#fff;cursor:pointer}
.bl-ci-head{margin-top:34px;text-align:center;display:grid;gap:4px}
.bl-ci-head h2{margin:0;font-size:1.25rem}
.bl-ci-head p{margin:0;font-size:.95rem;color:#d9cffa}
.bl-ci-stage{position:relative;flex:1 1 auto;width:min(92vw,420px);min-height:0;margin:10px 0}
.bl-ci-lines{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.bl-ci-lines line{stroke:rgba(255,255,255,.6);stroke-width:2;stroke-linecap:round;vector-effect:non-scaling-stroke;animation:bl-ci-fade .5s ease both}
.bl-ci-orb{position:absolute;left:var(--x);top:var(--y);width:var(--s);height:var(--s);margin:calc(var(--s) / -2) 0 0 calc(var(--s) / -2);display:grid;place-items:center;border-radius:50%;font-weight:800;font-size:calc(var(--s) * .3);color:#fff;border:1.5px solid rgba(255,255,255,.6);background:radial-gradient(circle at 30% 26%,rgba(255,255,255,.95) 0 6%,transparent 17%),radial-gradient(circle at 50% 58%,hsl(var(--oh) 90% 70% / .35),hsl(var(--oh) 85% 55% / .6) 68%,hsl(calc(var(--oh) + 40) 90% 76% / .85));box-shadow:inset 0 0 18px rgba(255,255,255,.35),0 0 24px hsl(var(--oh) 90% 65% / .55);animation:bl-ci-pop .6s cubic-bezier(.3,1.6,.5,1) both,bl-ci-bob 4.2s ease-in-out .6s infinite}
.bl-ci-ask{width:min(100%,420px);display:grid;gap:10px;text-align:center;animation:bl-ci-up .5s ease both}
.bl-ci-ask h3{margin:0 0 2px;font-size:1.3rem}
.bl-ci-ask button{min-height:48px;padding:12px 16px;border-radius:16px;font:inherit;font-weight:800;cursor:pointer}
.bl-ci-yes{border:0;background:linear-gradient(105deg,#f5a34e,#c28be9);color:#26183d}
.bl-ci-yes:disabled{opacity:.5;cursor:default}
.bl-ci-no{border:1px solid rgba(255,255,255,.35);background:rgba(255,255,255,.08);color:#fff}
.bl-ci-skip{position:absolute;inset:0;border:0;background:transparent;cursor:pointer}
@keyframes bl-ci-in{from{opacity:0}to{opacity:1}}
@keyframes bl-ci-pop{0%{transform:scale(0);opacity:0}70%{transform:scale(1.18);opacity:1}100%{transform:scale(1)}}
@keyframes bl-ci-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes bl-ci-fade{from{opacity:0}to{opacity:1}}
@keyframes bl-ci-up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.bl-ci,.bl-ci-orb,.bl-ci-lines line,.bl-ci-ask{animation:none}}
`;

export default function ChainIntro({ bubble, onContribute, onOpen, onClose }) {
  const [info, setInfo] = useState({ root: null, count: Math.max(1, Number(bubble?.chainCount) || 1), loaded: false });
  const [shown, setShown] = useState(0);
  const [asked, setAsked] = useState(false);
  const yesRef = useRef(null);

  useEffect(() => {
    let alive = true;
    supabase.rpc("bolle_chain_get", { p_bubble_id: String(bubble.id) }).then(({ data, error }) => {
      if (!alive) return;
      const row = !error && data && !Array.isArray(data) ? data : Array.isArray(data) ? data[0] : null;
      setInfo((p) => ({ root: row?.root_bubble_id || null, count: Math.max(1, Number(row?.participant_count) || p.count), loaded: true }));
    }, () => alive && setInfo((p) => ({ ...p, loaded: true })));
    return () => { alive = false; };
  }, [bubble.id]);

  const n = info.count;
  const total = Math.min(n, MAX_ORBS);
  const extra = n > MAX_ORBS ? n - (MAX_ORBS - 1) : 0;
  const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  // La catena si compone una bolla alla volta, appena sappiamo quante sono.
  useEffect(() => {
    if (!info.loaded) return undefined;
    if (reduced) { setShown(total); setAsked(true); return undefined; }
    setShown(0); setAsked(false);
    let i = 0;
    const t = setInterval(() => {
      i += 1; setShown(i);
      if (i >= total) { clearInterval(t); setTimeout(() => setAsked(true), 700); }
    }, STEP_MS);
    return () => clearInterval(t);
  }, [info.loaded, total, reduced]);

  useEffect(() => { if (asked) yesRef.current?.focus({ preventScroll: true }); }, [asked]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const pts = useMemo(() => Array.from({ length: total }, (_, i) => {
    const t = total === 1 ? 0.5 : i / (total - 1);
    return { x: total === 1 ? 50 : 50 + 30 * Math.sin(i * 1.25), y: total === 1 ? 50 : 8 + t * 84 };
  }), [total]);
  const size = Math.max(46, Math.min(84, Math.round(420 / total)));
  const skip = () => { if (!asked && info.loaded) { setShown(total); setAsked(true); } };

  return (
    <div className="bl-ci" role="dialog" aria-modal="true" aria-label="Bolla a catena">
      <style>{CSS}</style>
      <button type="button" className="bl-ci-close" onClick={onClose} aria-label="Chiudi"><X size={22} aria-hidden="true" /></button>
      <div className="bl-ci-head">
        <h2>Una Bolla a catena</h2>
        <p aria-live="polite">{info.loaded ? `${Math.min(shown, n)} ${Math.min(shown, n) === 1 ? "partecipante" : "partecipanti"} finora` : "Carico la catena…"}</p>
      </div>
      <div className="bl-ci-stage" aria-hidden="true">
        <svg className="bl-ci-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
          {pts.slice(1).map((p, i) => i + 1 < shown && <line key={i} x1={pts[i].x} y1={pts[i].y} x2={p.x} y2={p.y} />)}
        </svg>
        {pts.map((p, i) => i < shown && (
          <span key={i} className="bl-ci-orb" style={{ "--x": `${p.x}%`, "--y": `${p.y}%`, "--s": `${size}px`, "--oh": (270 + i * 31) % 360 }}>
            {extra > 0 && i === total - 1 ? `+${extra}` : null}
          </span>
        ))}
        {!asked && <button type="button" className="bl-ci-skip" tabIndex={-1} onClick={skip} />}
      </div>
      {asked ? (
        <div className="bl-ci-ask">
          <h3>Vuoi contribuire anche tu?</h3>
          <button type="button" ref={yesRef} className="bl-ci-yes" disabled={!info.root} onClick={() => onContribute?.(info.root)}>Sì, aggiungo la mia bolla</button>
          <button type="button" className="bl-ci-no" onClick={onOpen}>Prima guardo la catena</button>
        </div>
      ) : <div style={{ minHeight: 120 }} />}
    </div>
  );
}
