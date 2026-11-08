import React, { useState } from "react";
import Sheet from "../../components/Sheet.jsx";

export default function LoginSheet({ onClose, onLogin, onGoogle }) {
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    const username = name.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(username) || !/^\d{4}$/.test(pin)) {
      setError("Inserisci uno username valido e un PIN di quattro cifre.");
      return;
    }
    setBusy(true);
    try {
      await onLogin(username, pin);
      setPin("");
    } catch (err) {
      setError(err?.message || "Accesso non riuscito.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet label="Accedi a BOLLE" onClose={onClose} title="Accedi a BOLLE" subtitle="Ritrova le tue bolle da qualsiasi dispositivo." z={10000}>
      <form className="bl-account-form" onSubmit={submit}>
        <label className="bl-field-label">
          Username
          <input
            type="text"
            autoComplete="username"
            minLength={3}
            maxLength={20}
            value={name}
            onChange={(e) => setName(e.target.value.toLowerCase())}
            placeholder="es. bubblefox27"
            required
          />
        </label>
        <label className="bl-field-label">
          PIN di 4 cifre
          <input
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            pattern="[0-9]{4}"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            required
          />
        </label>
        {error && <p className="bl-error" role="alert">{error}</p>}
        <button className="bl-cta" type="submit" disabled={busy}>
          {busy ? "Accesso in corso…" : "Accedi"}
        </button>
        <p className="bl-muted">Hai dimenticato il PIN? Non è previsto un recupero automatico.</p>
        <button type="button" className="bl-google-button" onClick={onGoogle}>
          Continua con Google
        </button>
      </form>
    </Sheet>
  );
}
