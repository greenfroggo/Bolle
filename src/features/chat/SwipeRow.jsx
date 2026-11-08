import React, { useState, useRef, useEffect } from "react";

/* Riga scorrevole: trascinando verso sinistra (dito o mouse) compaiono le azioni a destra;
   tenendo premuto (o col tasto destro) si apre il menu rapido tramite onLongPress. */
export const SWIPE_W = 176;

export default function SwipeRow({ open, onOpenChange, actions, children, label, onLongPress }) {
  const [off, setOff] = useState(null); // offset durante il trascinamento (null = a riposo)
  const [pressing, setPressing] = useState(false);
  const offRef = useRef(null);
  const st = useRef(null);
  const moved = useRef(false);
  const lp = useRef(null);
  const lastLong = useRef(0);
  const rootRef = useRef(null);

  useEffect(() => () => clearTimeout(lp.current), []);

  const base = open ? -SWIPE_W : 0;
  const x = off ?? base;
  const inActions = (e) => Boolean(e.target?.closest?.(".bl-swipe-actions"));

  function fireLong() {
    const s = st.current;
    if (!s || s.lock !== null) return;
    s.lock = "lp";
    moved.current = true;
    lastLong.current = Date.now();
    setPressing(false);
    try {
      navigator.vibrate?.(14);
    } catch {
      /* vibrazione non disponibile */
    }
    onLongPress?.(rootRef.current?.getBoundingClientRect());
  }

  function onPointerDown(e) {
    if (inActions(e)) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    st.current = { x: e.clientX, y: e.clientY, lock: null, id: e.pointerId };
    moved.current = false;
    clearTimeout(lp.current);
    if (onLongPress && !open) {
      setPressing(true);
      lp.current = setTimeout(fireLong, 430);
    }
  }

  function onPointerMove(e) {
    const s = st.current;
    if (!s || s.id !== e.pointerId || s.lock === "lp") return;
    const dx = e.clientX - s.x, dy = e.clientY - s.y;
    if (s.lock === null) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      clearTimeout(lp.current);
      setPressing(false);
      s.lock = Math.abs(dx) > Math.abs(dy) * 1.2 ? "x" : "y";
      if (s.lock === "x") {
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* cattura non disponibile */
        }
      }
    }
    if (s.lock !== "x") return;
    moved.current = true;
    const next = Math.max(-SWIPE_W - 18, Math.min(0, base + dx));
    offRef.current = next;
    setOff(next);
  }

  function finish(cancelled) {
    clearTimeout(lp.current);
    setPressing(false);
    const s = st.current;
    st.current = null;
    if (!s || s.lock !== "x") return;
    const cur = offRef.current ?? base;
    offRef.current = null;
    setOff(null);
    onOpenChange(cancelled ? open : cur < -SWIPE_W / 2);
  }

  // I tocchi sui pulsanti delle azioni NON vanno intercettati: prima venivano bloccati qui e non succedeva nulla.
  function onClickCapture(e) {
    if (inActions(e)) return;
    if (moved.current) {
      e.preventDefault();
      e.stopPropagation();
      moved.current = false;
      return;
    }
    if (open) {
      e.preventDefault();
      e.stopPropagation();
      onOpenChange(false);
    }
  }

  function onContextMenu(e) {
    e.preventDefault();
    if (!onLongPress || inActions(e) || Date.now() - lastLong.current < 900) return;
    clearTimeout(lp.current);
    setPressing(false);
    moved.current = true;
    lastLong.current = Date.now();
    onLongPress(rootRef.current?.getBoundingClientRect());
  }

  function onKeyDown(e) {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      onOpenChange(true);
    } else if ((e.key === "ArrowRight" || e.key === "Escape") && open) {
      e.preventDefault();
      onOpenChange(false);
    }
  }

  return (
    <div
      ref={rootRef}
      className={`bl-swipe ${open ? "is-open" : ""} ${off !== null ? "is-dragging" : ""} ${pressing ? "is-pressing" : ""}`}
    >
      <div
        className="bl-swipe-track"
        style={{ transform: `translateX(${x}px)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => finish(false)}
        onPointerCancel={() => finish(true)}
        onClickCapture={onClickCapture}
        onKeyDown={onKeyDown}
        onContextMenu={onContextMenu}
      >
        <div className="bl-swipe-front">{children}</div>
        <div className="bl-swipe-actions" role="group" aria-label={label || "Azioni"} aria-hidden={!open}>
          {actions.map(a => (
            <button
              key={a.key}
              type="button"
              className={`bl-swipe-btn ${a.className || ""}`}
              tabIndex={open ? 0 : -1}
              onClick={a.onClick}
              disabled={a.disabled}
            >
              {a.icon}
              <span>{a.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
