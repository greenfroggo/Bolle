import React, { useState, useRef } from "react";
import Sheet from "../../components/Sheet.jsx";
import useEscape from "../../hooks/useEscape.js";

export const TUTORIAL_STEPS = [
  { icon: "🫧", title: "Benvenuto in Bolle", text: "Ogni bolla nasconde un momento, una storia o una sorpresa. Esplora liberamente e lasciati incuriosire." },
  { icon: "👆", title: "Tocca e scopri", text: "Scegli una bolla per aprirla. Puoi trascinarla e chiuderla con un gesto. Hai un numero di scoppi disponibili ogni giorno." },
  { icon: "✨", title: "Crea la tua bolla", text: "Con il pulsante + puoi condividere pensieri, immagini, GIF, domande e sondaggi. Pubblicare ti regala anche scoppi extra." },
  { icon: "📍", title: "Segui il magnetismo", text: "Passa da Tutte a Vicino a me per scoprire bolle nei dintorni. Scegli la distanza: la tua posizione esatta non viene mostrata." },
  { icon: "💬", title: "Partecipa alla conversazione", text: "Rispondi alle domande, vota nei sondaggi e lascia reazioni. Le notifiche ti aiutano a seguire le interazioni." },
  { icon: "💜", title: "Trova la tua community", text: "Segui i tuoi autori preferiti e scopri le classifiche. Il tuo username resta anonimo. Puoi riaprire questa guida dalle Informazioni." },
];

export default function TutorialSheet({ onClose }) {
  const [step, setStep] = useState(0);
  const touchStart = useRef(null);
  const current = TUTORIAL_STEPS[step];

  function onTouchStart(e) {
    touchStart.current = { x: e.touches[0]?.clientX, y: e.touches[0]?.clientY };
  }

  function onTouchEnd(e) {
    if (!touchStart.current) return;
    const dx = (e.changedTouches[0]?.clientX ?? touchStart.current.x) - touchStart.current.x;
    const dy = (e.changedTouches[0]?.clientY ?? touchStart.current.y) - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy) * 1.3) return;
    setStep(n => Math.max(0, Math.min(TUTORIAL_STEPS.length - 1, n + (dx < 0 ? 1 : -1))));
  }

  useEscape(onClose);

  return (
    <Sheet label="Tutorial Bolle" title="Scopri Bolle" subtitle="Il tuo universo, in sei piccoli passi." onClose={onClose}>
      <div className="bl-tutorial" aria-live="polite" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="bl-tutorial-art" aria-hidden="true">
          <span>{current.icon}</span>
          <i />
          <i />
          <i />
        </div>
        <span className="bl-tutorial-count">PASSO {step + 1} DI {TUTORIAL_STEPS.length}</span>
        <h3>{current.title}</h3>
        <p>{current.text}</p>
        <div className="bl-tutorial-dots" role="group" aria-label="Passaggi del tutorial">
          {TUTORIAL_STEPS.map((_, i) => (
            <button
              type="button"
              key={i}
              className={i === step ? "active" : ""}
              aria-label={`Vai al passo ${i + 1}`}
              aria-current={i === step ? "step" : undefined}
              onClick={() => setStep(i)}
            />
          ))}
        </div>
        <div className="bl-tutorial-actions">
          {step > 0 ? (
            <button type="button" className="bl-tutorial-back" onClick={() => setStep(s => s - 1)}>
              ‹ Indietro
            </button>
          ) : (
            <button type="button" className="bl-tutorial-back" onClick={onClose}>
              Salta
            </button>
          )}
          {step === TUTORIAL_STEPS.length - 1 ? (
            <button type="button" className="bl-cta" onClick={onClose}>
              Inizia a esplorare 🫧
            </button>
          ) : (
            <span className="bl-tutorial-swipe-hint">Scorri per continuare →</span>
          )}
        </div>
      </div>
    </Sheet>
  );
}
