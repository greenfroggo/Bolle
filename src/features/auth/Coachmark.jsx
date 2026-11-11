import React from "react";
import { X } from "lucide-react";

/* Fumetto in linea: indica cosa fare / perché serve un dato.
   tone: "info" | "need" (obbligatorio) | "ok" | "warn". `arrow`: up | down | none. */
export default function Coachmark({ children, icon = "💡", tone = "info", arrow = "up", onDismiss, className = "" }) {
  return (
    <div className={`bl-coach bl-coach-${tone} bl-coach-arrow-${arrow} ${className}`} role="note">
      <span className="bl-coach-icon" aria-hidden="true">{icon}</span>
      <div className="bl-coach-text">{children}</div>
      {onDismiss && (
        <button type="button" className="bl-coach-x" aria-label="Nascondi suggerimento" onClick={onDismiss}><X size={14} strokeWidth={2.5} aria-hidden="true" /></button>
      )}
    </div>
  );
}
