import React, { useState } from "react";
import Sheet from "../../components/Sheet.jsx";
import { USER_CATEGORIES } from "../../lib/bolleCore.jsx";
import { ageFromBirthDate, MIN_AGE } from "../../lib/geo.js";
import { track } from "../../lib/tracking.js";
import { NationalityPicker, CityPicker, BirthDatePicker, SEX_OPTIONS } from "../../components/pickers/FormPickers.jsx";
import {
  validateProfile,
  pinProblem,
  friendlyError,
  normalizePhone,
  PRIVACY_CONTROLLER,
  PRIVACY_EMAIL
} from "./authValidation.js";

/* Registrazione completa */
export default function RegistrationSheet({ mode = "full", username, initialEmail = "", onClose, onSubmit, onOpenLogin }) {
  const dataOnly = mode === "data" || mode === "google";
  const [step, setStep] = useState(1);
  const [f, setF] = useState({
    firstName: "",
    lastName: "",
    email: initialEmail,
    phone: "",
    sex: "",
    birthDate: "",
    nationality: "",
    city: "",
    category: "utente",
    consent: false
  });
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => {
    setF((o) => ({ ...o, [k]: v }));
    setErrors((o) => ({ ...o, [k]: undefined }));
  };

  const payload = () => ({
    firstName: f.firstName.trim(),
    lastName: f.lastName.trim(),
    email: f.email.trim().toLowerCase(),
    phone: normalizePhone(f.phone),
    sex: f.sex,
    age: ageFromBirthDate(f.birthDate),
    birthDate: f.birthDate,
    nationality: f.nationality.trim(),
    city: f.city.trim(),
    category: f.category || "utente",
    consent: f.consent
  });

  async function submitData(e) {
    e.preventDefault();
    setError("");
    const errs = validateProfile(f);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    if (!dataOnly) {
      track("register_step", { step: 2 });
      setStep(2);
      return;
    }
    setBusy(true);
    try {
      await onSubmit(payload(), null);
    } catch (err) {
      setError(friendlyError(err));
      setBusy(false);
    }
  }

  async function submitPin(e) {
    e.preventDefault();
    setError("");
    const p = pinProblem(pin, pin2);
    if (p) return setError(p);
    setBusy(true);
    try {
      await onSubmit(payload(), pin);
    } catch (err) {
      setError(friendlyError(err));
      setBusy(false);
    }
  }

  const input = (k, label, props) => (
    <label className="bl-field-label">
      {label}
      <input value={f[k]} onChange={(e) => set(k, e.target.value)} aria-invalid={Boolean(errors[k])} {...props} />
      {errors[k] && <small className="bl-err" role="alert">{errors[k]}</small>}
    </label>
  );

  const title = dataOnly ? "Completa il tuo profilo" : step === 1 ? "Crea il tuo account" : "Crea il tuo PIN";
  const subtitle = mode === "google"
    ? "Accesso Google attivo · completa i dati e accetta l’informativa. Non serve un PIN."
    : dataOnly
    ? "Per continuare ci servono ancora alcuni dati."
    : step === 1
    ? "Passo 1 di 2 · I tuoi dati"
    : "Passo 2 di 2 · Il PIN di 4 cifre ti serve per accedere.";

  return (
    <Sheet
      label="Registrazione"
      title={title}
      subtitle={subtitle}
      z={24}
      onClose={() => !busy && onClose()}
      onBack={step === 2 && !busy ? () => setStep(1) : null}
    >
      {!dataOnly && (
        <div className="bl-steps" aria-hidden="true">
          <i className="on" />
          <i className={step === 2 ? "on" : ""} />
        </div>
      )}
      {step === 1 && (
        <form className="bl-account-form" noValidate onSubmit={submitData}>
          <div className="bl-two">
            {input("firstName", "Nome", { type: "text", autoComplete: "given-name", maxLength: 60 })}
            {input("lastName", "Cognome", { type: "text", autoComplete: "family-name", maxLength: 60 })}
          </div>
          {input("email", "Email", { type: "email", autoComplete: "email", inputMode: "email", maxLength: 254, placeholder: "nome@esempio.it" })}
          {input("phone", "Numero di telefono", { type: "tel", autoComplete: "tel", inputMode: "tel", maxLength: 20, placeholder: "+39 333 1234567" })}
          <div className="bl-field-label">
            Sesso
            <div className="bl-chips" role="group" aria-label="Sesso">
              {SEX_OPTIONS.map(([k, l]) => (
                <button
                  type="button"
                  key={k}
                  className={f.sex === k ? "on" : ""}
                  aria-pressed={f.sex === k}
                  onClick={() => set("sex", k)}
                >
                  {l}
                </button>
              ))}
            </div>
            {errors.sex && <small className="bl-err" role="alert">{errors.sex}</small>}
          </div>
          <BirthDatePicker value={f.birthDate} onChange={(v) => set("birthDate", v)} error={errors.birthDate} />
          <NationalityPicker value={f.nationality} onChange={(v) => set("nationality", v)} error={errors.nationality} />
          <CityPicker value={f.city} onChange={(v) => set("city", v)} error={errors.city} />
          <div className="bl-field-label">
            Tipo di profilo / Categoria
            <select
              value={f.category || "utente"}
              onChange={(e) => set("category", e.target.value)}
              style={{ width: "100%", padding: "11px", borderRadius: 12, background: "#29243d", color: "#fff", border: "1px solid #8e80af", marginTop: 4, fontSize: 15 }}
            >
              {USER_CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
              ))}
            </select>
            <small className="bl-muted" style={{ display: "block", marginTop: 4 }}>Questa icona indicherà la tua categoria sulle bolle nel feed.</small>
          </div>
          <details className="bl-privacy">
            <summary>Come proteggiamo i tuoi dati</summary>
            <ul>
              <li><strong>Titolare:</strong> {PRIVACY_CONTROLLER} · {PRIVACY_EMAIL}</li>
              <li><strong>Dati raccolti:</strong> nome, cognome, email, telefono, sesso, data di nascita, nazionalità e città di residenza. Se scegli l’accesso con PIN, viene conservato solo come hash cifrato, mai in chiaro.</li>
              <li><strong>Finalità e base giuridica:</strong> creare e gestire il tuo account, sicurezza e statistiche aggregate (art. 6.1 a-b GDPR).</li>
              <li><strong>Visibilità:</strong> gli altri utenti vedono solo il tuo username anonimo. I tuoi dati non sono venduti né pubblicati; vi accede solo l’amministratore del servizio, con accessi registrati.</li>
              <li><strong>Conservazione:</strong> finché l’account è attivo; vengono eliminati con l’account.</li>
              <li><strong>Diritti:</strong> accesso, rettifica, portabilità e cancellazione, direttamente da Profilo → Impostazioni o scrivendo al titolare.</li>
            </ul>
          </details>
          <label className="bl-check">
            <input type="checkbox" checked={f.consent} onChange={(e) => set("consent", e.target.checked)} />
            <span>
              <strong>Informativa e consenso</strong>
              <small>Ho letto l’informativa, acconsento al trattamento dei miei dati personali e dichiaro di avere almeno {MIN_AGE} anni.</small>
            </span>
          </label>
          {errors.consent && <small className="bl-err" role="alert">{errors.consent}</small>}
          {error && <p className="bl-error" role="alert">{error}</p>}
          <button type="submit" className="bl-cta" disabled={busy}>
            {dataOnly ? (busy ? "Salvataggio…" : "Completa la registrazione") : "Continua"}
          </button>
          {!dataOnly && onOpenLogin && (
            <button type="button" className="bl-link" onClick={onOpenLogin}>
              Hai già un account? Accedi
            </button>
          )}
        </form>
      )}
      {step === 2 && (
        <form className="bl-account-form" onSubmit={submitPin}>
          <div className="bl-account-ready" role="status">
            <strong>Il tuo username: @{username || "in preparazione"}</strong>
            <p>Conserva questo username: ti servirà insieme al PIN di 4 cifre per accedere a Bolle in futuro, anche da un altro dispositivo.</p>
          </div>
          <label className="bl-field-label">
            PIN di 4 cifre
            <input
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="••••"
            />
          </label>
          <label className="bl-field-label">
            Ripeti il PIN
            <input
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              maxLength={4}
              value={pin2}
              onChange={(e) => setPin2(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="••••"
            />
          </label>
          {error && <p className="bl-error" role="alert">{error}</p>}
          <button type="submit" className="bl-cta" disabled={busy}>
            {busy ? "Registrazione…" : "Completa la registrazione"}
          </button>
          <p className="bl-muted">Con username e PIN ritrovi le tue bolle da qualsiasi dispositivo. Il PIN non si può recuperare: conservalo con cura.</p>
        </form>
      )}
    </Sheet>
  );
}
