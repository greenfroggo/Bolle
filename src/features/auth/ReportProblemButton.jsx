import React from "react";
import { LifeBuoy } from "lucide-react";

/* Apre il banner di segnalazione già presente in App.jsx (evento "bolle:reportable-error").
   `context` descrive DOVE si trova l'utente: mai includere dati personali, PIN o email. */
export function reportProblem(context) {
  window.dispatchEvent(new CustomEvent("bolle:reportable-error", { detail: { message: String(context || "Segnalazione manuale").slice(0, 300) } }));
}

export default function ReportProblemButton({ context, label = "Hai un problema? Segnalalo", className = "" }) {
  return (
    <button type="button" className={`bl-ob-report ${className}`} onClick={() => reportProblem(context)}>
      <LifeBuoy size={14} aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}
