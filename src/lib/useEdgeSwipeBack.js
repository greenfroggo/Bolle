import { useEffect, useRef } from "react";

/* Swipe verso destra dal bordo sinistro = «indietro».
   • Parte solo dai primi `edge` px dello schermo (come iOS/Android): non entra in conflitto con scroll orizzontali, slider e grafici.
   • Un indicatore di vetro segue il dito; oltre la soglia si «accende» e al rilascio chiama onBack.
   • Usa eventi touch (con preventDefault) perché i pointer event vengono annullati dal browser quando inizia il pan.
   • `enabled=false` quando non c'è nulla da chiudere (es. nella home): nessun listener, nessun costo. */
export function useEdgeSwipeBack(onBack, { enabled = true, edge = 26, threshold = 72 } = {}) {
  const cb = useRef(onBack);
  cb.current = onBack;

  useEffect(() => {
    if (!enabled || typeof document === "undefined") return undefined;
    const cue = document.createElement("div");
    cue.className = "bl-swipeback-cue";
    cue.setAttribute("aria-hidden", "true");
    cue.innerHTML = "<span>‹</span>";
    document.body.appendChild(cue);

    let s = null;
    const paint = (dx) => {
      cue.style.setProperty("--p", Math.min(1, dx / threshold).toFixed(3));
      cue.style.setProperty("--dx", `${Math.min(dx, threshold * 1.35).toFixed(1)}px`);
      cue.dataset.on = dx > 4 ? "1" : "0";
      cue.dataset.ready = dx >= threshold ? "1" : "0";
    };
    const start = (e) => {
      if (e.touches.length !== 1) { s = null; return; }
      const t = e.touches[0];
      if (t.clientX > edge) { s = null; return; }
      s = { x: t.clientX, y: t.clientY, t0: performance.now(), on: false, dx: 0 };
      cue.style.top = `${t.clientY}px`;
    };
    const move = (e) => {
      if (!s) return;
      const t = e.touches[0];
      const dx = t.clientX - s.x, dy = t.clientY - s.y;
      if (!s.on) {
        if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx) * 0.8) { s = null; return; }   // è uno scroll verticale
        if (dx < 8) return;
        s.on = true;
      }
      s.dx = dx;
      if (e.cancelable) e.preventDefault();
      cue.style.top = `${t.clientY}px`;
      paint(dx);
    };
    const end = () => {
      if (!s) return;
      const { on, dx, t0 } = s; s = null;
      paint(0);
      const v = dx / Math.max(1, performance.now() - t0);
      if (on && (dx >= threshold || (v > 0.6 && dx > 36))) cb.current?.();
    };
    const cancel = () => { s = null; paint(0); };

    document.addEventListener("touchstart", start, { passive: true });
    document.addEventListener("touchmove", move, { passive: false });
    document.addEventListener("touchend", end, { passive: true });
    document.addEventListener("touchcancel", cancel, { passive: true });
    return () => {
      document.removeEventListener("touchstart", start);
      document.removeEventListener("touchmove", move);
      document.removeEventListener("touchend", end);
      document.removeEventListener("touchcancel", cancel);
      cue.remove();
    };
  }, [enabled, edge, threshold]);
}