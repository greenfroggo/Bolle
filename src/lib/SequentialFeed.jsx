import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import ChainOrbs, { useChainSummary } from "./ChainOrbs.jsx";

/* =====================================================================
   SequentialFeed — la home "una bolla alla volta" di Bolle.

   • Una sola bolla grande al centro; dietro, una seconda più piccola che si
     avvicina mentre trascini quella davanti (anticipazione).
   • Tocca = scoppia  ·  Scorri via (qualsiasi direzione) = respingi gratis,
     la bolla si allontana lentamente e non torna più.
   • Anteprima "sfera di sapone": miniatura minuscola ingrandita via CSS (niente
     filter:blur / backdrop-filter → leggero su smartphone), forma organica,
     colore + icona + etichetta per ogni tipo di bolla.
   • Le bolle in cui sei taggato hanno un anello luminoso, passano per prime e
     lo swipe chiede conferma.
   • Fisica a molla: la bolla segue il dito con un leggero ritardo elastico, si allunga
     nel verso del movimento e, al rilascio, rimbalza al suo posto oppure scivola via
     con la velocità del gesto. Tutto in un solo ciclo requestAnimationFrame.
   • Prestazioni: durante il trascinamento nessun setState (si scrive direttamente
     sullo stile), solo 2 bolle nel DOM, solo transform/opacity animati.

   Il componente NON parla con Supabase: usa callback. In fondo trovi
   feedApi(supabase) con le chiamate alle RPC del file SQL.
   ===================================================================== */

/* ------------------------------ costanti ------------------------------ */
const DRAG_START_PX   = 14;    // sotto questa distanza non è ancora uno swipe
const TAP_MAX_MOVE_PX = 4;     // un tap vero si muove meno di così
const TAP_MAX_MS      = 600;
const SWIPE_RATIO     = 0.28;  // distanza minima = 28% del diametro della bolla
const SWIPE_SPEED     = 0.5;   // px/ms: un flick veloce vale come swipe
const SKIP_LOCK_MS    = 400;   // pausa anti-frenesia dopo ogni azione
const LEAVE_MS        = 1000;  // durata dell'allontanamento lento
const NUDGE_EVERY     = 15;    // dopo N swipe di fila senza scoppiare, suggerimento
const MAX_HOOK_CHARS  = 80;
const HINT_KEY        = "bl_seq_hint_done";

/* Tipi di bolla: colore + icona + etichetta (mai solo il colore, per l'accessibilità).
   `hook: true` = il testo della domanda è visibile come gancio prima dello scoppio. */
const KINDS = {
  photo:      { label: "Foto",             icon: "📷", hue: 200 },
  video:      { label: "Video",            icon: "▶️", hue: 265 },
  question:   { label: "Domanda",          icon: "❓", hue: 190, hook: true },
  poll:       { label: "Questo o quello",  icon: "⚖️", hue: 330, hook: true, split: true },
  meme:       { label: "Meme",             icon: "😂", hue: 45 },
  gif:        { label: "GIF",              icon: "🎞️", hue: 20 },
  truth:      { label: "2 verità, 1 bugia",icon: "🕵️", hue: 150 },
  rating:     { label: "Dai un voto",      icon: "⭐", hue: 52 },
  thought:    { label: "Pensiero",         icon: "💭", hue: 285 },
  confession: { label: "Confessione",      icon: "🤫", hue: 350 },
  capsule:    { label: "Capsula del tempo",icon: "⏳", hue: 30 },
  system:     { label: "Dal sistema",      icon: "✨", hue: 170 },
};
const FALLBACK_KIND = { label: "Bolla", icon: "🫧", hue: 215 };

/* ------------------------------ utilità ------------------------------ */
function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/* Bordo organico leggermente diverso per ogni bolla: "deformata", ma statica. */
function organicRadius(id) {
  const h = hashStr(String(id));
  const p = (n) => 46 + ((h >>> n) & 7);               // 46..53
  return `${p(0)}% ${100 - p(3)}% ${p(6)}% ${100 - p(9)}% / ${p(12)}% ${p(15)}% ${100 - p(18)}% ${100 - p(21)}%`;
}

function trimHook(text) {
  const t = String(text || "").replace(/\s+/g, " ").trim();
  return t.length > MAX_HOOK_CHARS ? t.slice(0, MAX_HOOK_CHARS - 1).trimEnd() + "…" : t;
}

function defaultGetKind(item) {
  const k = String(item?.kind || "").toLowerCase();
  return KINDS[k] || FALLBACK_KIND;
}

const isCalm = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/* Trasformazione «gelatina»: posizione + inclinazione + allungamento nel verso della velocità. */
function jellyTransform(x, y, vx, vy, calm, extraScale = 1) {
  const sp = Math.hypot(vx, vy);
  const st = calm ? 0 : Math.min(0.24, sp / 3000);
  const ang = Math.atan2(vy, vx);
  return `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) rotate(${(x * 0.04).toFixed(2)}deg) `
       + `rotate(${ang.toFixed(3)}rad) scale(${((1 + st) * extraScale).toFixed(3)},${((1 - st * 0.7) * extraScale).toFixed(3)}) rotate(${(-ang).toFixed(3)}rad)`;
}

/* ------------------------------ la bolla ------------------------------ */
function BubbleFace({ item, kind, small }) {
  const label = item.label || kind.label;
  const icon = item.icon || kind.icon;
  const showHook = !small && kind.hook && item.hook;
  // Stesse classi e variabili delle bolle sparse (bolle.css): colori, riflessi, pellicola liquida.
  const cls = item.faceClass || `bl-bubble--user bl-bubble--kind-${item.kind || "photo"}`;
  return (
    <div className={`bl-bubble bl-seq-face ${cls}`} style={{ ...(item.look || {}), "--h": kind.hue }}>
      {item.preview && !item.sealed ? (
        <>
          <span className="bl-seq-img" style={{ backgroundImage: `url("${item.preview}")` }} aria-hidden="true" />
          <span className="bl-seq-img bl-seq-img--b" style={{ backgroundImage: `url("${item.preview}")` }} aria-hidden="true" />
          <span className="bl-seq-veil" aria-hidden="true"><i /></span>
        </>
      ) : (
        <span className="bl-seq-blobs" style={{ "--r": `${hashStr(String(item.id)) % 360}deg` }} aria-hidden="true"><i /><i /><i /></span>
      )}
      <span className="bl-liquid-film" aria-hidden="true" />
      <span className="bl-bubble-glint" aria-hidden="true" />
      <span className="bl-bubble-reflection" aria-hidden="true" />
      <span className={`bl-kind-fx bl-kind-fx--${item.kind || "photo"}`} aria-hidden="true"><i /></span>
      <span className="bl-seq-tint" aria-hidden="true" />
      {kind.split && <span className="bl-seq-split" aria-hidden="true" />}
      {showHook && <p className="bl-seq-hook" dir="auto">{trimHook(item.hook)}</p>}
      {!small && <span className="bl-seq-pill">{icon} {label}</span>}
      {!small && item.tagCount > 0 && !item.taggedForMe && (
        <span className="bl-seq-badge">👥 con {item.tagCount} {item.tagCount === 1 ? "persona" : "persone"}</span>
      )}
      {!small && item.taggedForMe && <span className="bl-seq-badge bl-seq-badge--me">💌 Per te</span>}
    </div>
  );
}

/* ------------------------------ componente ------------------------------ */
export default function SequentialFeed({
  items = [],                 // [{ id, kind, hook, preview, taggedForMe, tagCount, rare, sealed }]
  rankIds,                    // opzionale: id in ordine di ranking (da bolle_feed_sequence)
  popsLeft = Infinity,        // scoppi rimasti oggi (solo per etichetta e messaggio finale)
  canPop = () => true,        // (item) => false se questa bolla non si può scoppiare ora
  paused = false,             // true mentre il viewer è aperto
  getKind = defaultGetKind,   // adatta qui il tuo bubbleKind(item)
  onPop,                      // (item) => apri il viewer, registra lo scoppio
  onSkip,                     // (item) => es. api.skip(item.id)
  onLimit,                    // (item) => scoppi giornalieri finiti
  onRequestMore,              // () => carica altre bolle quando ne restano ≤ 3
  onNudgeNearby,              // () => passa a «Vicino a me»
  renderEnd,                  // ({ popsLeft }) => fine feed personalizzata
}) {
  const [handled, setHandled]   = useState(() => new Set());
  const [leaving, setLeaving]   = useState(null);
  const [popping, setPopping]   = useState(false);
  const [shaking, setShaking]   = useState(false);
  const [confirm, setConfirm]   = useState(null);
  const [nudge, setNudge]       = useState(false);
  const [, setHint]            = useState(() => {
    try { return !localStorage.getItem(HINT_KEY); } catch { return true; }
  });

  const stageRef = useRef(null);
  const bubbleRef = useRef(null);
  const dragRef = useRef(null);
  const lockUntil = useRef(0);
  const streak = useRef(0);
  const timers = useRef({});
  const lastRequested = useRef(-1);
  const leaveRef = useRef(null);     // elemento della bolla che si allontana
  const sim = useRef({ x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, k: 420, c: 30, size: 300, raf: 0, last: 0 });

  /* ---- coda: ordine di ranking, meno le bolle già gestite ---- */
  const ordered = useMemo(() => {
    if (!rankIds?.length) return items;
    const pos = new Map(rankIds.map((id, i) => [String(id), i]));
    const at = (i) => (pos.has(String(i.id)) ? pos.get(String(i.id)) : 1e9);
    return [...items].sort((a, b) => at(a) - at(b));
  }, [items, rankIds]);

  const queue = useMemo(() => ordered.filter((i) => !handled.has(String(i.id))), [ordered, handled]);
  const current = queue[0] || null;
  const next = queue[1] || null;

  // Bolla a catena: una bolla per ogni partecipante, aggiornata mentre la bolla è sulla scena.
  const chain = useChainSummary(current?.id, { enabled: Boolean(current && current.chainable && !current.sealed), initial: current?.chainCount || 0 });

  const currentKind = current ? getKind(current) : null;
  const nextKind = next ? getKind(next) : null;

  const markHandled = useCallback((id) => {
    setHandled((prev) => { const n = new Set(prev); n.add(String(id)); return n; });
  }, []);

  const resetStage = () => stageRef.current?.style.setProperty("--p", "0");

  const finishHint = useCallback(() => {
    setHint(false);
    try { localStorage.setItem(HINT_KEY, "1"); } catch { /* ignora */ }
  }, []);

  /* ---- carica altre bolle quando la coda si sta svuotando ---- */
  useEffect(() => {
    if (queue.length <= 3 && lastRequested.current !== items.length) {
      lastRequested.current = items.length;
      onRequestMore?.();
    }
  }, [queue.length, items.length, onRequestMore]);

  useEffect(() => {
    setConfirm(null); setPopping(false);
    const S = sim.current;                       // nuova bolla: la molla riparte da ferma
    cancelAnimationFrame(S.raf); S.raf = 0; S.x = S.y = S.vx = S.vy = S.tx = S.ty = 0;
  }, [current?.id]);
  useEffect(() => {
    if (!nudge) return undefined;
    const t = setTimeout(() => setNudge(false), 6000);
    return () => clearTimeout(t);
  }, [nudge]);
  useEffect(() => () => { Object.values(timers.current).forEach(clearTimeout); cancelAnimationFrame(sim.current.raf); }, []);

  /* ---- azioni ---- */
  /* Un solo ciclo di animazione per la bolla corrente: integra una molla verso (tx,ty).
     Durante il trascinamento il bersaglio è il dito (molla rigida, poco ritardo);
     al rilascio il bersaglio diventa il centro (molla morbida: supera e rimbalza). */
  const stepSim = useCallback((t) => {
    const S = sim.current;
    const dt = Math.min(0.033, Math.max(0.001, (t - S.last) / 1000)); S.last = t;
    S.vx += (S.k * (S.tx - S.x) - S.c * S.vx) * dt; S.x += S.vx * dt;
    S.vy += (S.k * (S.ty - S.y) - S.c * S.vy) * dt; S.y += S.vy * dt;
    const el = bubbleRef.current;
    if (el) {
      el.style.transform = jellyTransform(S.x, S.y, S.vx, S.vy, isCalm());
      stageRef.current?.style.setProperty("--p", String(Math.min(1, Math.hypot(S.x, S.y) / (S.size * 0.5))));
    }
    const rest = !dragRef.current && Math.hypot(S.tx - S.x, S.ty - S.y) < 0.4 && Math.hypot(S.vx, S.vy) < 6;
    if (rest) {
      S.x = S.tx; S.y = S.ty; S.vx = S.vy = 0; S.raf = 0;
      if (el) el.style.transform = "";
      resetStage();
      return;
    }
    S.raf = requestAnimationFrame(stepSim);
  }, []);
  const runSim = () => { const S = sim.current; if (!S.raf) { S.last = performance.now(); S.raf = requestAnimationFrame(stepSim); } };
  const unpress = () => bubbleRef.current?.classList.remove("is-pressed");

  const springBack = useCallback(() => {
    const S = sim.current, calm = isCalm();
    S.tx = 0; S.ty = 0; S.k = calm ? 900 : 170; S.c = calm ? 60 : 12;
    unpress();
    runSim();
  }, [stepSim]);

  const doSkip = useCallback((item, dx = 0, dy = -1) => {
    const len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
    // la bolla parte dalla posizione e dalla velocità che aveva sotto il dito (almeno una spinta minima)
    const S = sim.current;
    const along = S.vx * ux + S.vy * uy;
    const push = Math.max(1100, Math.min(3200, along));
    const from = { x: S.x, y: S.y, vx: ux * push, vy: uy * push };
    cancelAnimationFrame(S.raf); S.raf = 0; S.x = S.y = S.vx = S.vy = S.tx = S.ty = 0;
    setLeaving({ item, key: `${item.id}-${Date.now()}`, from });
    clearTimeout(timers.current.leave);
    timers.current.leave = setTimeout(() => setLeaving(null), LEAVE_MS);
    lockUntil.current = performance.now() + SKIP_LOCK_MS;
    markHandled(item.id);
    resetStage();
    finishHint();
    onSkip?.(item);
    streak.current += 1;
    if (streak.current % NUDGE_EVERY === 0 && onNudgeNearby) setNudge(true);
  }, [markHandled, onSkip, onNudgeNearby, finishHint]);

  /* La bolla respinta scivola via con la velocità del gesto, rallentando come in un liquido,
     mentre si allunga, si restringe e svanisce. */
  useLayoutEffect(() => {
    if (!leaving) return undefined;
    const el = leaveRef.current;
    if (!el) return undefined;
    const calm = isCalm();
    let { x, y, vx, vy } = leaving.from;
    const t0 = performance.now();
    let last = t0, id = 0;
    const paint = (u) => {
      const e = u * u * (3 - 2 * u);
      el.style.transform = jellyTransform(x, y, vx, vy, calm, 1 - 0.42 * e);
      el.style.opacity = String(Math.max(0, 1 - Math.max(0, (u - 0.3) / 0.7)));
    };
    paint(0);                                    // primo fotogramma già nella posizione giusta: nessun salto
    const step = (t) => {
      const dt = Math.min(0.033, Math.max(0.001, (t - last) / 1000)); last = t;
      const damp = Math.exp(-dt * 2.4);
      vx *= damp; vy *= damp; x += vx * dt; y += vy * dt;
      const u = Math.min(1, (t - t0) / LEAVE_MS);
      paint(u);
      if (u < 1) id = requestAnimationFrame(step);
    };
    id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [leaving?.key]);   // eslint-disable-line react-hooks/exhaustive-deps

  /* Le bolle "per te" non si perdono per sbaglio: lo swipe chiede conferma. */
  const requestSkip = useCallback((item, dx, dy) => {
    if (item.taggedForMe) { springBack(); setConfirm(item); return; }
    doSkip(item, dx, dy);
  }, [doSkip, springBack]);

  const doPop = useCallback((item) => {
    if (performance.now() < lockUntil.current) return;
    if (!canPop(item)) {
      setShaking(true);
      clearTimeout(timers.current.shake);
      timers.current.shake = setTimeout(() => setShaking(false), 420);
      onLimit?.(item);
      return;
    }
    lockUntil.current = performance.now() + SKIP_LOCK_MS;
    setPopping(true);
    // La bolla esce dal feed quando il genitore la rimuove (scoppio riuscito). Se lo scoppio
    // fallisce (scoppi finiti, errore di rete) la bolla torna visibile dopo un istante.
    clearTimeout(timers.current.popReset);
    timers.current.popReset = setTimeout(() => setPopping(false), 1800);
    clearTimeout(timers.current.pop);
    timers.current.pop = setTimeout(() => {
      streak.current = 0;
      setNudge(false);
      finishHint();
      onPop?.(item);
      if (item.sealed) markHandled(item.id);   // le capsule chiuse non si consumano: non restano in cima
    }, 180);
  }, [canPop, onPop, onLimit, markHandled, finishHint]);

  /* ---- gesti (nessun setState durante il trascinamento) ---- */
  const onPointerDown = (e) => {
    if (!current || paused || performance.now() < lockUntil.current) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (e.target.closest?.("button, a, input, textarea")) return;   // toast e conferma restano cliccabili
    e.currentTarget.setPointerCapture?.(e.pointerId);
    dragRef.current = {
      id: e.pointerId, x0: e.clientX, y0: e.clientY, t0: performance.now(),
      dx: 0, dy: 0, max: 0, moved: false, size: bubbleRef.current?.offsetWidth || 300,
      onBubble: Boolean(e.target.closest?.(".bl-seq-bubble")),    // il tocco scoppia solo se è sulla bolla
    };
    sim.current.size = dragRef.current.size;
    if (dragRef.current.onBubble) bubbleRef.current?.classList.add("is-pressed");   // si schiaccia sotto il dito
  };

  const onPointerMove = (e) => {
    const d = dragRef.current;
    if (!d || d.id !== e.pointerId) return;
    d.dx = e.clientX - d.x0;
    d.dy = e.clientY - d.y0;
    const dist = Math.hypot(d.dx, d.dy);
    d.max = Math.max(d.max, dist);
    if (!d.moved) {
      if (dist < DRAG_START_PX) return;
      d.moved = true;
      unpress();                                  // la pressione si rilascia con un rimbalzo e inizia il trascinamento
    }
    const S = sim.current, calm = isCalm();
    S.tx = d.dx; S.ty = d.dy; S.k = calm ? 900 : 420; S.c = calm ? 60 : 30;   // il dito tira la bolla con una molla
    runSim();
  };

  const onPointerUp = (e) => {
    const d = dragRef.current;
    if (!d || d.id !== e.pointerId || !current) return;
    dragRef.current = null;
    const dur = Math.max(1, performance.now() - d.t0);
    const dist = Math.hypot(d.dx, d.dy);

    if (!d.moved) {
      // tra 4 e 14 px il gesto è ambiguo: non scoppia e non respinge
      unpress();
      if (d.max < TAP_MAX_MOVE_PX && dur < TAP_MAX_MS) { if (d.onBubble) doPop(current); }
      return;
    }
    const isSwipe = dist > d.size * SWIPE_RATIO || (dist / dur > SWIPE_SPEED && dist > 40);
    if (isSwipe) requestSkip(current, d.dx, d.dy);
    else springBack();
  };

  const onPointerCancel = () => { dragRef.current = null; unpress(); springBack(); };

  const onKeyDown = (e) => {
    if (!current) return;
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); doPop(current); return; }
    const dir = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (dir) { e.preventDefault(); requestSkip(current, dir[0], dir[1]); }
  };

  /* ---- render ---- */
  const exhausted = !current;
  const announce = current
    ? `Bolla: ${currentKind.label}${currentKind.hook && current.hook ? ", " + trimHook(current.hook) : ""}`
    : "Nessuna bolla da mostrare";

  return (
    <section ref={stageRef} className={`bl-seq ${paused ? "is-paused" : ""}`} aria-label="Bolle da scoprire"
      onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerCancel}>
      <style>{CSS}</style>
      <p className="bl-seq-sr" aria-live="polite">{announce}</p>
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" focusable="false">
        <filter id="bl-seq-warp" x="-10%" y="-10%" width="120%" height="120%">
          {/* ondulazione lenta e morbida (poche onde larghe, spostamento piccolo): la superficie si piega, l'immagine non si «rompe» */}
          <feTurbulence type="fractalNoise" baseFrequency="0.005 0.007" numOctaves="1" seed="11" result="n" />
          <feGaussianBlur in="n" stdDeviation="2" result="ns" />
          <feDisplacementMap in="SourceGraphic" in2="ns" scale="9" xChannelSelector="R" yChannelSelector="B" />
        </filter>
      </svg>

      {/* seconda bolla: più piccola e lontana, si avvicina mentre trascini */}
      {next && (
        <div key={next.id} className="bl-seq-slot bl-seq-slot--next" aria-hidden="true">
          <BubbleFace item={next} kind={nextKind} small />
        </div>
      )}

      {/* bolla respinta che si allontana lentamente */}
      {leaving && (
        <div className="bl-seq-slot" aria-hidden="true">
          <div
            key={leaving.key}
            ref={leaveRef}
            className="bl-seq-leaving"
            style={{ transform: `translate3d(${leaving.from.x}px,${leaving.from.y}px,0)` }}
          >
            <BubbleFace item={leaving.item} kind={getKind(leaving.item)} />
          </div>
        </div>
      )}

      {/* bolla corrente */}
      {current && (
        <div className="bl-seq-slot">
          <div
            key={current.id}
            ref={bubbleRef}
            role="button"
            tabIndex={0}
            aria-label={announce}
            className={[
              "bl-seq-bubble",
              popping ? "is-popping" : "",
              shaking ? "is-shaking" : "",
              current.rare ? "is-rare" : "",
              current.taggedForMe ? "is-tagged" : "",
            ].join(" ")}
            style={{ "--h": currentKind.hue }}
            onKeyDown={onKeyDown}
            onContextMenu={(e) => e.preventDefault()}
          >
            <div className="bl-seq-float">
              {current.taggedForMe && <span className="bl-seq-ring" aria-hidden="true" />}
              <BubbleFace item={current} kind={currentKind} />
              {popping && <span className="bl-seq-burst-ring" aria-hidden="true" />}
            </div>
          </div>
          {chain && !popping && (
            <div className="bl-seq-chain" key={`chain-${current.id}`} style={{ "--h": currentKind.hue }}>
              <ChainOrbs count={chain.count} hue={currentKind.hue} />
            </div>
          )}
        </div>
      )}

      {/* fine feed */}
      {exhausted && !leaving && (
        <div className="bl-seq-end">
          <span className="bl-seq-end-orb" aria-hidden="true">🫧</span>
          {renderEnd ? renderEnd({ popsLeft }) : (
            <>
              <strong>{popsLeft <= 0 ? "Per oggi hai finito gli scoppi" : "Hai visto tutte le bolle"}</strong>
              <span>{popsLeft <= 0 ? "Domani torni con nuovi scoppi." : "Torna tra poco: ne arrivano di nuove."}</span>
            </>
          )}
        </div>
      )}

      {/* cosa si può fare: sempre visibile, discreto */}
      {current && !confirm && (
        <p className="bl-seq-hint">
          {Number.isFinite(popsLeft) && popsLeft <= 0
            ? "Scoppi finiti per oggi · scorri per vedere le altre bolle"
            : "Tocca la bolla per scoppiarla · scorri in qualsiasi direzione per passare"}
        </p>
      )}

      {/* suggerimento dopo molti swipe di fila */}
      {nudge && (
        <div className="bl-seq-toast" role="status">
          <span>Niente ti ispira? Prova le bolle vicino a te.</span>
          <button type="button" onClick={() => { setNudge(false); onNudgeNearby?.(); }}>Vicino a me</button>
        </div>
      )}

      {/* conferma per le bolle in cui sei taggato */}
      {confirm && (
        <div className="bl-seq-confirm" role="alertdialog" aria-label="Bolla per te">
          <p>💌 Questa bolla è per te. Vuoi davvero passare?</p>
          <div>
            <button type="button" className="is-primary" onClick={() => { const it = confirm; setConfirm(null); doPop(it); }}>Scoppia</button>
            <button type="button" onClick={() => { const it = confirm; setConfirm(null); doSkip(it); }}>Passa comunque</button>
          </div>
        </div>
      )}

    </section>
  );
}

/* =====================================================================
   Chiamate alle RPC del file bolle_feed_redesign.sql
   const api = feedApi(supabase);
   ===================================================================== */
export function feedApi(supabase) {
  const quiet = (p) => Promise.resolve(p).then(() => {}, () => {});
  return {
    /** Ordine di ranking: restituisce [{ bubble_id, rank_score, preview_blur, tag_count, tagged_for_me }] */
    async sequence(limit = 30) {
      const { data, error } = await supabase.rpc("bolle_feed_sequence", { p_limit: limit });
      if (error) throw error;
      return data || [];
    },
    skip: (bubbleId) => quiet(supabase.rpc("bolle_feed_skip", { p_bubble_id: bubbleId })),
    /** Da chiamare allo scoppio: restituisce l'id sessione (null se sei l'autore) */
    async startSession(bubbleId, source = "home") {
      const { data } = await supabase.rpc("bolle_open_session_start", { p_bubble_id: bubbleId, p_source: source });
      return data || null;
    },
    /** Reazione, voto, risposta, condivisione */
    interact: (sessionId) => (sessionId ? quiet(supabase.rpc("bolle_open_session_interact", { p_session: sessionId })) : null),
    /** Alla chiusura del viewer: millisecondi trascorsi dentro la bolla */
    endSession: (sessionId, dwellMs) =>
      (sessionId ? quiet(supabase.rpc("bolle_open_session_end", { p_session: sessionId, p_dwell_ms: Math.round(dwellMs) })) : null),
    /** Testo in sovrimpressione: visibile solo dopo lo scoppio */
    async overlays(bubbleId) {
      const { data } = await supabase.rpc("bolle_bubble_overlays", { p_bubble_id: bubbleId });
      return Array.isArray(data) ? data : [];
    },
    setPreview: (bubbleId, dataUri) => supabase.rpc("bolle_set_preview_blur", { p_bubble_id: bubbleId, p_data_uri: dataUri }),
  };
}

/* =====================================================================
   Genera la miniatura sfocata (24×24 JPEG, ~1 KB) al momento della pubblicazione.
   source: File/Blob immagine, <img> o <video> (primo fotogramma).
   Normalizza la luminosità, così foto molto scure o molto chiare restano leggibili.
   ===================================================================== */
export async function makeBlurPreview(source, size = 24) {
  let drawable = source, sw, sh, bitmap = null;
  if (source instanceof Blob) {
    bitmap = await createImageBitmap(source);
    drawable = bitmap; sw = bitmap.width; sh = bitmap.height;
  } else {
    sw = source.videoWidth || source.naturalWidth || source.width;
    sh = source.videoHeight || source.naturalHeight || source.height;
  }
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const side = Math.min(sw, sh);                       // ritaglio quadrato centrato
  ctx.drawImage(drawable, (sw - side) / 2, (sh - side) / 2, side, side, 0, 0, size, size);
  bitmap?.close?.();

  const img = ctx.getImageData(0, 0, size, size);
  const px = img.data;
  let sum = 0;
  for (let i = 0; i < px.length; i += 4) sum += 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
  const mean = sum / (px.length / 4);
  const shift = (128 - mean) * 0.5;                    // correzione a metà strada
  for (let i = 0; i < px.length; i += 4) {
    px[i]     = Math.max(0, Math.min(255, px[i] + shift));
    px[i + 1] = Math.max(0, Math.min(255, px[i + 1] + shift));
    px[i + 2] = Math.max(0, Math.min(255, px[i + 2] + shift));
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL("image/jpeg", 0.55);
}

/* ------------------------------ stili ------------------------------ */
/* Prefisso bl-seq-: nessun conflitto con bolle.css. Niente blur/backdrop-filter. */
const CSS = `
.bl-seq{position:relative;width:100%;height:100%;min-height:360px;overflow:hidden;
  touch-action:none;user-select:none;-webkit-user-select:none;--p:0;
  --size:min(60vw,32svh,320px);font-family:inherit}
.bl-seq.is-paused{visibility:hidden}
.bl-seq-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}

.bl-seq-slot{position:absolute;left:50%;top:41%;width:var(--size);aspect-ratio:1;translate:-50% -50%}
.bl-seq-slot--next{translate:-50% calc(-50% - 24%);
  scale:calc(.46 + .44 * var(--p));opacity:calc(.4 + .45 * var(--p));
  animation:bl-seq-next-in .7s var(--bl-spring-soft,cubic-bezier(.3,1.25,.6,1)) .1s backwards;pointer-events:none}
/* la bolla che arriva dietro si gonfia da piccola, con un leggero rimbalzo */
@keyframes bl-seq-next-in{from{scale:.2;opacity:0}}

.bl-seq-bubble{position:absolute;inset:0;cursor:grab;touch-action:none;will-change:transform;
  animation:bl-seq-in .78s var(--bl-spring-soft,cubic-bezier(.3,1.25,.6,1)) both}
.bl-seq-bubble:active{cursor:grabbing}
.bl-seq-bubble:focus-visible{outline:3px solid #6a5fb0;outline-offset:8px;border-radius:50%}
/* la bolla successiva «passa avanti» dalla posizione in cui stava dietro, e si assesta con un rimbalzo */
@keyframes bl-seq-in{from{scale:.82 .78;translate:0 -24%;opacity:.5}30%{opacity:1}to{scale:1 1;translate:0 0;opacity:1}}

.bl-seq-float{position:absolute;inset:0;animation:bl-seq-float 6s ease-in-out infinite}
@keyframes bl-seq-float{0%,100%{translate:0 0;scale:1 1}50%{translate:0 -9px;scale:1.018 .982}}
.bl-seq-slot--next .bl-seq-float{animation-duration:8s;animation-delay:-2s}

/* La faccia riusa .bl-bubble di bolle.css (colori, pellicola liquida, riflessi): qui solo geometria e contenuto */
.bl-seq-face{position:absolute;inset:0;width:100%;height:100%;cursor:inherit;display:grid;place-items:center;overflow:hidden}
.bl-seq-face:hover,.bl-seq-face:active{scale:1}
/* pressione: la bolla si schiaccia come gelatina e, al rilascio, torna con un rimbalzo */
.bl-seq-bubble .bl-seq-face{transition:scale .55s var(--bl-spring,cubic-bezier(.34,1.56,.64,1))}
.bl-seq-bubble.is-pressed .bl-seq-face{scale:.92 .89;transition:scale .14s ease-out}
.bl-seq-img{position:absolute;inset:-6%;z-index:0;border-radius:50%;background-size:cover;background-position:center;
  opacity:.94;filter:saturate(1.1) brightness(1.06);transform:scale(1.14) rotate(4deg);
  animation:bl-seq-drift 16s ease-in-out infinite alternate}
@supports (filter:url(#a)){.bl-seq-img{filter:url(#bl-seq-warp) saturate(1.1) brightness(1.06)}}
.bl-seq-img--b{opacity:.32;mix-blend-mode:soft-light;transform:scale(1.3) rotate(-20deg) scaleX(-1);filter:saturate(1.3);animation-duration:22s;animation-direction:alternate-reverse}
@supports (filter:url(#a)){.bl-seq-img--b{filter:saturate(1.3)}}
@keyframes bl-seq-drift{from{transform:scale(1.14) rotate(4deg) translate(-1.5%,-1%)}to{transform:scale(1.2) rotate(-3deg) translate(1.5%,1.2%)}}
/* Pellicola: una membrana lattiginosa e semitrasparente sopra il contenuto. Opacizza senza sfocare (niente backdrop-filter),
   ha riflessi iridescenti che scorrono piano e un respiro elastico: il contenuto sta «sotto», non è rovinato. */
.bl-seq-veil{position:absolute;inset:0;z-index:1;border-radius:50%;pointer-events:none;overflow:hidden;
  background:
    radial-gradient(110% 80% at 28% 18%,rgba(255,255,255,.62),rgba(255,255,255,0) 56%),
    radial-gradient(90% 70% at 76% 86%,hsla(var(--h),90%,90%,.42),rgba(255,255,255,0) 62%),
    rgba(255,255,255,.34);
  box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.6),inset 0 -20px 38px hsla(var(--h),90%,82%,.38),inset 0 16px 30px rgba(255,255,255,.42);
  animation:bl-seq-veil-breath 7.5s ease-in-out infinite}
.bl-seq-veil::before{content:"";position:absolute;inset:-25%;border-radius:50%;mix-blend-mode:soft-light;opacity:.8;
  background:conic-gradient(from 0deg,hsla(var(--h),95%,84%,0),hsla(calc(var(--h) + 70),95%,84%,.5),hsla(calc(var(--h) + 150),95%,88%,0),hsla(calc(var(--h) + 230),95%,84%,.42),hsla(var(--h),95%,84%,0));
  animation:bl-seq-veil-spin 20s linear infinite}
.bl-seq-veil i{position:absolute;inset:0;border-radius:inherit;
  background:linear-gradient(112deg,rgba(255,255,255,0) 34%,rgba(255,255,255,.5) 50%,rgba(255,255,255,0) 66%);background-size:260% 100%;
  animation:bl-seq-veil-sheen 6.5s ease-in-out infinite}
@keyframes bl-seq-veil-breath{0%,100%{scale:1 1;border-radius:50%}33%{scale:1.012 .988;border-radius:49% 51% 52% 48% / 51% 48% 52% 49%}66%{scale:.99 1.01;border-radius:52% 48% 49% 51% / 48% 52% 49% 51%}}
@keyframes bl-seq-veil-spin{to{rotate:360deg}}
@keyframes bl-seq-veil-sheen{0%{background-position:130% 0}60%,100%{background-position:-30% 0}}
/* al tocco la membrana si avvalla e poi rimbalza insieme alla bolla */
.bl-seq-bubble .bl-seq-veil{transition:scale .5s var(--bl-spring,cubic-bezier(.34,1.56,.64,1))}
.bl-seq-bubble.is-pressed .bl-seq-veil{animation:none;scale:1.05 .95;transition:scale .14s ease-out}
.bl-seq-bubble.is-popping .bl-seq-veil{animation:none;opacity:0;scale:1.25;transition:scale .3s ease-out,opacity .28s ease-out}
/* senza anteprima (testi, bolle vecchie): macchie di colore fluide, non un'icona */
.bl-seq-blobs{position:absolute;inset:0;z-index:0;border-radius:50%;overflow:hidden;rotate:var(--r)}
.bl-seq-blobs i{position:absolute;border-radius:50%;opacity:.85;animation:bl-seq-blob 9s ease-in-out infinite alternate}
.bl-seq-blobs i:nth-child(1){width:70%;height:70%;left:-10%;top:-8%;background:radial-gradient(circle,hsla(var(--h),95%,72%,.95),transparent 70%)}
.bl-seq-blobs i:nth-child(2){width:65%;height:65%;right:-12%;bottom:-6%;background:radial-gradient(circle,hsla(calc(var(--h) + 55),95%,74%,.9),transparent 70%);animation-delay:-3s}
.bl-seq-blobs i:nth-child(3){width:50%;height:50%;left:30%;top:35%;background:radial-gradient(circle,hsla(calc(var(--h) - 45),95%,80%,.8),transparent 70%);animation-delay:-6s}
@keyframes bl-seq-blob{from{transform:translate(-6%,-4%) scale(.95)}to{transform:translate(8%,6%) scale(1.12)}}
.bl-seq-tint{position:absolute;inset:0;z-index:1;border-radius:50%;pointer-events:none;
  background:radial-gradient(circle at 50% 55%,hsla(var(--h),90%,78%,0),hsla(var(--h),90%,70%,.28))}
.bl-seq-glyph{position:relative;z-index:2;font-size:calc(var(--size) * .34);opacity:.38;line-height:1;filter:drop-shadow(0 2px 8px rgba(255,255,255,.6))}
.bl-seq-split{position:absolute;z-index:3;top:8%;bottom:8%;left:50%;width:2px;background:rgba(255,255,255,.85)}

.bl-seq-hook{position:relative;z-index:6;margin:0;padding:0 14%;text-align:center;color:#2b2150;
  font:700 clamp(17px,5.2vw,26px)/1.2 system-ui,-apple-system,"Segoe UI",sans-serif;
  text-shadow:0 0 10px rgba(255,255,255,.95),0 0 3px rgba(255,255,255,.9);
  display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere}
.bl-seq-pill{position:absolute;z-index:6;bottom:14%;left:50%;translate:-50% 0;padding:6px 12px;border-radius:999px;
  background:rgba(255,255,255,.88);color:#3b2f73;font:700 12px/1 system-ui,-apple-system,sans-serif;white-space:nowrap}
.bl-seq-badge{position:absolute;z-index:6;top:15%;left:50%;translate:-50% 0;padding:5px 10px;border-radius:999px;
  background:rgba(255,255,255,.88);color:#3b2f73;font:700 11px/1 system-ui,-apple-system,sans-serif;white-space:nowrap}
.bl-seq-badge--me{background:#fff;color:#8a2f6b}

.bl-seq-ring{position:absolute;inset:-7px;border-radius:50%;border:3px solid #fff;pointer-events:none;
  box-shadow:0 0 26px 6px rgba(255,255,255,.9),0 0 22px 4px hsla(var(--h),90%,62%,.85);
  animation:bl-seq-pulse 2.2s ease-in-out infinite}
@keyframes bl-seq-pulse{0%,100%{opacity:.55}50%{opacity:1}}

.bl-seq-bubble.is-rare .bl-seq-face{
  box-shadow:inset 0 0 0 3px #f4c542,inset 0 -22px 44px rgba(244,197,66,.55),
             inset 0 18px 34px rgba(255,255,255,.55),0 0 42px rgba(244,197,66,.6)}
.bl-seq-bubble.is-popping .bl-seq-face{animation:bl-seq-burst .36s cubic-bezier(.3,0,.3,1) forwards}
@keyframes bl-seq-burst{0%{scale:.92 .89;opacity:1}32%{scale:1.2 1.08;opacity:1}62%{scale:1.1 1.2;opacity:.85}to{scale:1.4 1.4;opacity:0}}
.bl-seq-burst-ring{position:absolute;inset:-2%;border-radius:50%;border:3px solid rgba(255,255,255,.95);pointer-events:none;animation:bl-seq-ring .45s ease-out forwards}
@keyframes bl-seq-ring{from{transform:scale(.9);opacity:.95}to{transform:scale(1.55);opacity:0}}
.bl-seq-bubble.is-shaking{animation:bl-seq-shake .42s ease both}
@keyframes bl-seq-shake{0%,100%{translate:0}20%{translate:-9px}40%{translate:9px}60%{translate:-6px}80%{translate:6px}}

/* movimento e dissolvenza della bolla respinta sono calcolati in JS (velocità del gesto) */
.bl-seq-leaving{position:absolute;inset:0;pointer-events:none;will-change:transform,opacity}

.bl-seq-confirm button,.bl-seq-toast button{min-width:44px;min-height:44px;padding:0 22px;
  border:1px solid rgba(255,255,255,.9);border-radius:999px;background:rgba(255,255,255,.85);color:#4a3d8f;
  font:700 15px/1 system-ui,-apple-system,sans-serif;cursor:pointer}
.bl-seq-confirm button.is-primary{background:#6a5fb0;color:#fff;border-color:#6a5fb0}
.bl-seq button:focus-visible{outline:3px solid #6a5fb0;outline-offset:3px}

.bl-seq-hint{position:absolute;left:50%;bottom:calc(52px + env(safe-area-inset-bottom));translate:-50% 0;margin:0;
  width:min(86%,320px);text-align:center;color:var(--cosmos-text,#fff);opacity:.62;
  font:500 12px/1.4 system-ui,-apple-system,sans-serif;text-shadow:0 1px 6px rgba(0,0,0,.35);pointer-events:none}
.bl-seq-toast,.bl-seq-confirm{position:absolute;left:50%;translate:-50% 0;width:min(92%,380px);
  display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:20px;
  background:rgba(37,37,68,.94);color:#fff;font:600 14px/1.3 system-ui,-apple-system,sans-serif}
.bl-seq-toast{bottom:calc(66px + env(safe-area-inset-bottom));justify-content:space-between}
.bl-seq-confirm{bottom:calc(14px + env(safe-area-inset-bottom));flex-direction:column;text-align:center}
.bl-seq-confirm p{margin:0}
.bl-seq-confirm div{display:flex;gap:10px}

.bl-seq-end{position:absolute;left:50%;top:44%;translate:-50% -50%;width:min(88%,360px);box-sizing:border-box;
  display:flex;flex-direction:column;align-items:center;gap:10px;padding:30px 22px 24px;text-align:center;color:#fff;
  font-family:system-ui,-apple-system,sans-serif;border-radius:32px;
  background:linear-gradient(160deg,rgba(104,84,196,.82),rgba(150,92,200,.78));
  border:1px solid rgba(255,255,255,.55);box-shadow:0 18px 44px rgba(60,40,140,.45),inset 0 1px 0 rgba(255,255,255,.5);
  animation:bl-seq-end-in .7s var(--bl-spring-soft,cubic-bezier(.3,1.25,.6,1)) both}
/* solo scala e dissolvenza: il banner è centrato con translate, che qui non va toccato */
@keyframes bl-seq-end-in{from{scale:.82;opacity:0}30%{opacity:1}to{scale:1;opacity:1}}
.bl-seq-end-orb{font-size:46px;line-height:1;animation:bl-seq-float 4.5s ease-in-out infinite;filter:drop-shadow(0 6px 14px rgba(255,255,255,.45))}
.bl-seq-end strong{font-size:21px;line-height:1.2;text-shadow:0 1px 8px rgba(40,20,100,.45)}
.bl-seq-end span{color:#f3ecff;opacity:1;font-size:15px;line-height:1.35}
.bl-seq-end .bl-seq-end-orb{font-size:46px}
.bl-seq-end button{max-width:100%}

@media (prefers-reduced-motion:reduce){
  .bl-seq-blobs i,.bl-seq-img,.bl-seq-veil,.bl-seq-veil::before,.bl-seq-veil i,.bl-seq-float,.bl-seq-ring,.bl-seq-bubble,.bl-seq-end-orb,.bl-seq-end,.bl-seq-slot--next{animation:none!important}
  .bl-seq-bubble .bl-seq-face{transition:none}
}
`;