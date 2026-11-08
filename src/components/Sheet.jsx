import React from "react";

export default function Sheet({ label, title, subtitle, onClose, onBack, wide, z, className = "", headerRight, children }) {
  return (
    <div className="bl-sheet-wrap" style={z ? { zIndex: z } : undefined} onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={`bl-sheet ${wide ? "bl-sheet-wide" : ""} ${className}`} role="dialog" aria-modal="true" aria-label={label}>
        <div className="bl-sheet-heading">
          {onBack && <button type="button" className="bl-sheet-x" onClick={onBack} aria-label="Indietro">‹</button>}
          <div className="bl-sheet-heading-main">
            {typeof title === "string" ? <h2>{title}</h2> : title}
            {subtitle && <p>{subtitle}</p>}
          </div>
          {headerRight}
          <button type="button" className="bl-sheet-x" onClick={onClose} aria-label="Chiudi">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
