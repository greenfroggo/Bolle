import React, { useState, useEffect, useCallback } from "react";

export const DELETE_REASONS = [
  ["not_using", "Non uso più l’app"],
  ["privacy", "Mi preoccupa la privacy"],
  ["notifications", "Ricevo troppe notifiche"],
  ["content", "Non trovo contenuti interessanti"],
  ["other_account", "Ho già un altro profilo"],
  ["other", "Altro"],
];
export const DELETE_CONFIRM_WORD = "ELIMINA";

/* Eliminazione del profilo: motivazione obbligatoria, poi conferma esplicita scrivendo ELIMINA. */
export default function DeleteAccountSection({ me, onDeleteAccount }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const needsDetails = reason === "other";
  const step1Ok = Boolean(reason) && (!needsDetails || details.trim().length >= 3);
  const confirmOk = typed.trim().toUpperCase() === DELETE_CONFIRM_WORD;

  const close = useCallback(() => {
    if (busy) return;
    setOpen(false);
    setStep(1);
    setReason("");
    setDetails("");
    setTyped("");
    setError("");
  }, [busy]);

  useEffect(() => {
    if (!open) return undefined;
    const esc = (e) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open, close]);

  const confirmDelete = async () => {
    if (!confirmOk || busy) return;
    setBusy(true);
    setError("");
    const reasonPayload = reason === "other" && details.trim() ? `other: ${details.trim()}` : reason;
    try {
      await onDeleteAccount?.(reasonPayload);
    } catch (err) {
      setError(err?.message || "Impossibile eliminare il profilo al momento. Riprova più tardi.");
      setBusy(false);
    }
  };

  return (
    <section className="bl-insights-section bl-delete-account-wrap">
      <div className="bl-insights-heading">
        <h3 className="danger">Zona pericolosa</h3>
      </div>
      <p className="bl-muted">Puoi eliminare definitivamente il tuo profilo e tutte le tue bolle.</p>
      <button type="button" className="bl-link danger" onClick={() => setOpen(true)}>Elimina il mio profilo</button>
      {open && (
        <div className="bl-confirm-backdrop" role="dialog" aria-modal="true" aria-labelledby="bl-delete-title">
          <div className="bl-confirm-box">
            {step === 1 ? (
              <>
                <h3 id="bl-delete-title">Perché vuoi eliminare il profilo?</h3>
                <p>Aiutaci a capire: la tua risposta è anonima e ci serve solo per migliorare l’app.</p>
                <div className="bl-delete-reasons" role="radiogroup" aria-label="Motivo dell'eliminazione">
                  {DELETE_REASONS.map(([val, label]) => (
                    <label key={val} className="bl-delete-reason-row">
                      <input
                        type="radio"
                        name="del_reason"
                        value={val}
                        checked={reason === val}
                        onChange={() => setReason(val)}
                        disabled={busy}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
                {needsDetails && (
                  <label className="bl-delete-details-field">
                    <span>Raccontaci cosa non ha funzionato (almeno 3 caratteri)</span>
                    <textarea
                      rows={2}
                      maxLength={300}
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      placeholder="La tua opinione è preziosa…"
                      disabled={busy}
                    />
                  </label>
                )}
                {error && <p className="bl-error" role="alert">{error}</p>}
                <div className="bl-confirm-actions">
                  <button type="button" disabled={busy} onClick={close}>Annulla</button>
                  <button type="button" className="danger" disabled={!step1Ok || busy} onClick={() => { setError(""); setStep(2); }}>Continua</button>
                </div>
              </>
            ) : (
              <>
                <h3 id="bl-delete-title">Eliminare definitivamente il profilo?</h3>
                <p>Verranno rimossi il tuo profilo <strong>@{me?.username || "–"}</strong> e le tue bolle. Statistiche, preferiti e traguardi andranno persi e non potranno essere recuperati. Questa azione è irreversibile.</p>
                <label className="bl-delete-type">
                  Per confermare scrivi <strong>{DELETE_CONFIRM_WORD}</strong>
                  <input
                    type="text"
                    autoComplete="off"
                    autoCapitalize="characters"
                    value={typed}
                    onChange={(e) => setTyped(e.target.value)}
                    placeholder={DELETE_CONFIRM_WORD}
                    disabled={busy}
                  />
                </label>
                {error && <p className="bl-error" role="alert">{error}</p>}
                <div className="bl-confirm-actions">
                  <button type="button" disabled={busy} onClick={() => { setStep(1); setTyped(""); setError(""); }}>Indietro</button>
                  <button type="button" className="danger" disabled={!confirmOk || busy} onClick={confirmDelete}>{busy ? "Eliminazione…" : "Elimina per sempre"}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
