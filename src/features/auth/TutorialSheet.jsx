import React, { useState, useRef, useLayoutEffect, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import useEscape from "../../hooks/useEscape.js";

/* Tutorial leggero: fumetto in vetro ancorato alla bolla centrale del feed. */
const TUTORIAL_STEPS = [
  { icon: "🫧", target: ".bl-slot", title: "Benvenuto in Bolle", text: "Ogni bolla nasconde un momento, una storia o una sorpresa. Ti mostro dove toccare." },
  { icon: "🔢", target: ".bl-counter", title: "I tuoi scoppi", text: "Qui controlli quanti scoppi hai a disposizione. Quando finiscono, puoi pubblicare una bolla per ottenerne altri." },
  { icon: "👆", target: ".bl-slot", title: "Tocca e scopri", text: "Tocca una bolla per aprirla. Puoi anche trascinarla e chiuderla con un gesto." },
  { icon: "📍", target: '[data-foot="near"]', title: "Vicino a te", text: "Tocca «Vicino a me» nella barra in basso per esplorare le bolle nei dintorni. La tua posizione esatta non viene mostrata." },
  { icon: "✨", target: ".bl-fab", title: "Crea la tua bolla", text: "Con il pulsante + condividi pensieri, immagini, GIF, domande e sondaggi. Tieni premuto e scorri tra le bolle per selezionare più velocemente la tua scelta." },
  { icon: "🏆", target: '[data-foot="rank"]', title: "Classifiche", text: "Apri Classifiche dalla barra in basso per scoprire le posizioni e confrontare i risultati della community." },
  { icon: "🌟", target: ".bl-profile-achievements", title: "I tuoi traguardi", text: "Apri il tuo profilo e visita la sezione Traguardi. Completando alcuni obiettivi puoi sbloccare funzioni e ricompense dell'app." },
  { icon: "💜", title: "Tutto pronto!", text: "Reagisci, rispondi e segui i tuoi autori preferiti. Puoi riaprire questa guida da «Come funziona»." },
];

function findTarget(selector) {
  if (!selector) return null;
  const candidates = [...document.querySelectorAll(selector)];
  const visible = candidates.filter((el) => {
    const r = el.getBoundingClientRect();
    const css = window.getComputedStyle(el);
    return r.width > 8 && r.height > 8 && r.bottom > 0 && r.top < window.innerHeight && css.display !== "none" && css.visibility !== "hidden";
  });
  if (!visible.length) return null;
  // Per le bolle scegli quella più vicina al centro della schermata, non un elemento fuori vista.
  const cy = window.innerHeight / 2;
  const cx = window.innerWidth / 2;
  return visible.sort((a, b) => {
    const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
    const da = Math.hypot(ra.top + ra.height / 2 - cy, ra.left + ra.width / 2 - cx);
    const db = Math.hypot(rb.top + rb.height / 2 - cy, rb.left + rb.width / 2 - cx);
    return da - db;
  })[0];
}

export default function TutorialSheet({ onClose, onStepChange }) {
  const [step, setStep] = useState(0);
  const [anchor, setAnchor] = useState(null);
  const [placement, setPlacement] = useState(null);
  const cardRef = useRef(null);
  const touchStart = useRef(null);
  const current = TUTORIAL_STEPS[step];
  const last = step === TUTORIAL_STEPS.length - 1;

  useEffect(() => { onStepChange?.(step, current); }, [step, current, onStepChange]);

  const measure = useCallback(() => {
    const el = findTarget(current.target);
    if (!el) { setAnchor(null); return; }
    const r = el.getBoundingClientRect();
    setAnchor({ x: r.left + r.width / 2, y: r.top + r.height / 2, left: r.left, top: r.top, width: r.width, height: r.height });
  }, [current]);

  useLayoutEffect(() => {
    // Aspetta un frame perché il feed abbia completato il layout dopo l'apertura del tutorial.
    const raf = requestAnimationFrame(measure);
    const timer = window.setTimeout(measure, 180);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [measure]);

  useEscape(onClose);
  const go = (n) => setStep(Math.max(0, Math.min(TUTORIAL_STEPS.length - 1, n)));
  const onTouchStart = (e) => { touchStart.current = e.touches[0]?.clientX ?? null; };
  const onTouchEnd = (e) => {
    if (touchStart.current == null) return;
    const dx = (e.changedTouches[0]?.clientX ?? touchStart.current) - touchStart.current;
    touchStart.current = null;
    if (Math.abs(dx) > 55) go(step + (dx < 0 ? 1 : -1));
  };

  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const vw = typeof window !== "undefined" ? window.innerWidth : 400;
  const appFont = typeof document !== "undefined" ? window.getComputedStyle(document.querySelector(".bl-root") || document.body).fontFamily : "inherit";

  // Misura il fumetto e lo colloca sempre fuori dall'area dell'elemento spiegato.
  useLayoutEffect(() => {
    if (!anchor || !cardRef.current) { setPlacement(null); return; }
    const card = cardRef.current.getBoundingClientRect();
    const margin = 18;
    const gap = 26;
    const safeTop = 64;
    const safeBottom = 76;
    const spaceAbove = anchor.top - safeTop;
    const spaceBelow = vh - safeBottom - (anchor.top + anchor.height);
    const putAbove = spaceAbove >= card.height + gap || spaceAbove >= spaceBelow;
    const top = putAbove
      ? Math.max(safeTop, anchor.top - card.height - gap)
      : Math.min(vh - safeBottom - card.height, anchor.top + anchor.height + gap);
    const left = Math.max(margin + card.width / 2, Math.min(vw - margin - card.width / 2, anchor.x));
    const startY = putAbove ? top + card.height : top;
    const endY = putAbove ? anchor.top - 5 : anchor.top + anchor.height + 5;
    const startX = Math.max(left - card.width / 2 + 30, Math.min(left + card.width / 2 - 30, anchor.x));
    const bend = Math.max(-70, Math.min(70, (anchor.x - startX) * .35));
    const controlX = startX + bend;
    const controlY = (startY + endY) / 2;
    const path = `M ${startX} ${startY} Q ${controlX} ${controlY} ${anchor.x} ${endY}`;
    setPlacement({ top, left, path, putAbove });
  }, [anchor, step, vh, vw]);

  const content = (
    <div className="bl-tour" role="dialog" aria-modal="false" aria-label="Tutorial Bolle" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {anchor && <div className="bl-tour-spot" aria-hidden="true" style={{ left: anchor.left - 7, top: anchor.top - 7, width: anchor.width + 14, height: anchor.height + 14 }} />}
      {anchor && placement && (
        <svg className="bl-tour-arrow" viewBox={`0 0 ${vw} ${vh}`} aria-hidden="true">
          <defs>
            <linearGradient id="bl-tour-arrow-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,.30)" />
              <stop offset="55%" stopColor="rgba(220,205,255,.92)" />
              <stop offset="100%" stopColor="rgba(255,255,255,.72)" />
            </linearGradient>
          </defs>
          <path d={placement.path} className="bl-tour-arrow-shadow" />
          <path d={placement.path} className="bl-tour-arrow-line" />
          <path d={placement.path} className="bl-tour-arrow-highlight" />
          <circle cx={anchor.x} cy={placement.putAbove ? anchor.top - 5 : anchor.top + anchor.height + 5} r="4" className="bl-tour-arrow-tip" />
        </svg>
      )}
      <section ref={cardRef} key={step} className="bl-tour-card" style={{ top: `${placement?.top ?? Math.max(88, vh * .35)}px`, left: `${placement?.left ?? vw / 2}px`, fontFamily: appFont }} aria-live="polite">
        <span className="bl-tour-count">PASSO {step + 1} DI {TUTORIAL_STEPS.length}</span>
        <div className="bl-tour-icon" aria-hidden="true">{current.icon}</div>
        <h3>{current.title}</h3>
        <p>{current.text}</p>
        <div className="bl-tutorial-dots" role="group" aria-label="Passaggi del tutorial">
          {TUTORIAL_STEPS.map((_, i) => <button type="button" key={i} className={i === step ? "active" : ""} aria-label={`Vai al passo ${i + 1}`} aria-current={i === step ? "step" : undefined} onClick={() => go(i)} />)}
        </div>
        <div className="bl-tour-actions">
          <button type="button" className="bl-tour-ghost" onClick={step > 0 ? () => go(step - 1) : onClose}>{step > 0 ? "‹ Indietro" : "Salta"}</button>
          <button type="button" className="bl-tour-next" onClick={last ? onClose : () => go(step + 1)}>{last ? "Inizia a esplorare 🫧" : "Avanti ›"}</button>
        </div>
      </section>
    </div>
  );
  return typeof document !== "undefined" ? createPortal(content, document.body) : null;
}