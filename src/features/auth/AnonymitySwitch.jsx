import React from "react";

/* Interruttore «Anonimato» per Profilo → Impostazioni → Identità e anonimato.
   Attivo  = gli altri vedono solo lo username.
   Spento  = gli altri vedono il nome attività (se indicato) oppure nome e cognome.
   Usa un <button role="switch">: non dipende da stili esterni e funziona al tocco. */
export default function AnonymitySwitch({ checked, onChange, hasBusiness = false, preview = "" }) {
  const hint = checked
    ? "Gli altri vedono solo il tuo username."
    : hasBusiness
      ? "Gli altri vedono il nome della tua attività."
      : "Gli altri vedono il tuo nome e cognome.";

  return (
    <div className="bl-anon">
      <div className="bl-anon-row">
        <div className="bl-anon-copy">
          <span id="bl-anon-label" className="bl-anon-title">Anonimato</span>
          <small id="bl-anon-desc" className="bl-anon-desc">
            Nascondi agli altri il tuo nome e cognome{hasBusiness ? " o il nome della tua attività" : ""}.
          </small>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-labelledby="bl-anon-label"
          aria-describedby="bl-anon-desc"
          className={`bl-anon-switch ${checked ? "on" : ""}`}
          onClick={() => onChange(!checked)}
        >
          <span className="bl-anon-track" aria-hidden="true"><i /></span>
          <span className="bl-anon-state" aria-hidden="true">{checked ? "Attivo" : "Spento"}</span>
        </button>
      </div>
      <p className="bl-anon-preview" role="status" aria-live="polite">
        Così ti vedono gli altri: <strong>{preview}</strong>
      </p>
      <small className="bl-muted">{hint}</small>
    </div>
  );
}
