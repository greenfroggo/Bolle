import React, { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { friendlyError } from "./authValidation.js";

/* Privacy: esporta ed elimina i dati */
export default function PrivacySection({ onExport, onDelete }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState("");

  async function run(fn) {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="bl-insights-section">
      <div className="bl-insights-heading">
        <h3><ShieldCheck size={21} aria-hidden="true" /> Privacy e dati personali</h3>
      </div>
      <p className="bl-muted">Puoi scaricare una copia dei tuoi dati o eliminare definitivamente il tuo account e tutti i contenuti collegati.</p>
      <div className="bl-row">
        <button type="button" className="bl-ghost" disabled={busy} onClick={() => run(onExport)}>Scarica i miei dati</button>
      </div>
      <label className="bl-field-label">
        Per eliminare l’account scrivi ELIMINA
        <input
          type="text"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="off"
          placeholder="ELIMINA"
        />
      </label>
      <button
        type="button"
        className="bl-ghost bl-danger"
        disabled={busy || confirm.trim() !== "ELIMINA"}
        onClick={() => run(onDelete)}
      >
        Elimina il mio account
      </button>
      {error && <p className="bl-error" role="alert">{error}</p>}
    </section>
  );
}
