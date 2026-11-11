import React, { useState, useMemo, useEffect } from "react";
import Sheet from "../../components/Sheet.jsx";
import { USER_CATEGORIES } from "../../lib/bolleCore.jsx";
import { ageFromBirthDate, MIN_AGE } from "../../lib/geo.js";
import { track } from "../../lib/tracking.js";
import { NationalityPicker, CityPicker, BirthDatePicker, SEX_OPTIONS } from "../../components/pickers/FormPickers.jsx";
import { validateProfile, pinProblem, friendlyError, normalizePhone, PRIVACY_CONTROLLER, PRIVACY_EMAIL } from "./authValidation.js";
import ReportProblemButton from "./ReportProblemButton.jsx";
import { businessNameProblem, cleanBusinessName } from "./identity.js";

/* Registrazione in 5 schermate (4 con Google/«data»: niente PIN):
   1 Chi sei · 2 Contatti · 3 Su di te · 4 Privacy e consensi · 5 Username e PIN.
   L'anonimato NON si sceglie qui: parte attivo e si cambia solo da Profilo → Impostazioni. */
const STEP_KEYS = {
  1: ["firstName", "lastName", "businessName"],
  2: ["email", "phone"],
  3: ["sex", "birthDate", "nationality", "city"],
  4: ["consent"],
};
const STEP_META = {
  1: { icon: "🫧", title: "Chi sei?", sub: "Iniziamo dal tuo nome." },
  2: { icon: "💌", title: "Come ti raggiungiamo?", sub: "Email e telefono restano privati." },
  3: { icon: "🌍", title: "Un po’ su di te", sub: "Ci aiuta a mostrarti bolle più vicine a te." },
  4: { icon: "🛡️", title: "Privacy e consensi", sub: "Chiarezza prima di tutto." },
  5: { icon: "🔑", title: "Il tuo accesso", sub: "Username e PIN di 4 cifre." },
};
const HINTS = {
  email: "Usa un indirizzo che controlli: serve per il recupero e le comunicazioni importanti.",
  phone: "Con prefisso internazionale, ad esempio +39 333 1234567.",
};

export default function RegistrationSheet({ mode = "full", username, initialEmail = "", initialData = null, onClose, onSubmit, onOpenLogin }) {
  const dataOnly = mode === "data" || mode === "google";
  const total = dataOnly ? 4 : 5;
  const prefilled = Boolean(initialData && (initialData.firstName || initialData.lastName || initialData.email || initialData.phone));

  const [f, setF] = useState(() => ({
    firstName: initialData?.firstName || "",
    lastName: initialData?.lastName || "",
    businessName: "",
    category: "utente",
    email: initialData?.email || initialEmail || "",
    phone: initialData?.phone || "",
    sex: "",
    birthDate: "",
    nationality: "",
    city: "",
    consent: false,
  }));
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState("fwd");
  const [errors, setErrors] = useState({});
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  /* Durante la registrazione niente top bar né footbar (vedi registration.css). */
  useEffect(() => {
    document.body.classList.add("bl-reg-open");
    return () => document.body.classList.remove("bl-reg-open");
  }, []);

  const allErrors = useMemo(() => {
    const base = validateProfile(f) || {};
    const bn = businessNameProblem(f.businessName);
    return bn ? { ...base, businessName: bn } : base;
  }, [f]);
  const errorsFor = (n) => Object.fromEntries((STEP_KEYS[n] || []).filter((k) => allErrors[k]).map((k) => [k, allErrors[k]]));

  const set = (k, v) => { setF((o) => ({ ...o, [k]: v })); setErrors((o) => ({ ...o, [k]: undefined })); setError(""); };
  const go = (n) => { setDir(n > step ? "fwd" : "back"); setStep(n); setError(""); track("register_step", { step: n }); };

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
    businessName: cleanBusinessName(f.businessName),
    isAnonymous: true, // default: si cambia da Impostazioni profilo
    consent: f.consent,
  });

  /* Messaggio leggibile + dettaglio tecnico, così sappiamo cosa rifiuta il server. */
  const describe = (err) => {
    const friendly = friendlyError(err);
    const raw = String(err?.message || err || "").slice(0, 160);
    return raw && !friendly.includes(raw) ? `${friendly} (${raw})` : friendly;
  };

  async function next(e) {
    e.preventDefault();
    setError("");
    const errs = errorsFor(step);
    if (Object.keys(errs).length) { setErrors((o) => ({ ...o, ...errs })); return; }
    if (step < 4) return go(step + 1);
    if (step === 4 && dataOnly) {
      setBusy(true);
      try { await onSubmit(payload(), null); } catch (err) { console.error("[registrazione]", err); setError(describe(err)); setBusy(false); }
      return;
    }
    if (step === 4) return go(5);
    const p = pinProblem(pin, pin2);
    if (p) return setError(p);
    setBusy(true);
    try { await onSubmit(payload(), pin); } catch (err) { console.error("[registrazione]", err); setError(describe(err)); setBusy(false); }
  }

  const field = (k, label, props) => (
    <label className="bl-field-label">
      {label}
      <input
        value={f[k]}
        onChange={(e) => set(k, e.target.value)}
        onBlur={() => { if (f[k]) setErrors((o) => ({ ...o, [k]: allErrors[k] })); }}
        aria-invalid={Boolean(errors[k])}
        {...props}
      />
      {errors[k] ? <small className="bl-err" role="alert">{errors[k]}</small>
        : HINTS[k] ? <small className="bl-muted">{HINTS[k]}</small> : null}
    </label>
  );

  const meta = STEP_META[step];
  const last = step === total;

  return (
    <Sheet
      label="Registrazione"
      title={meta.title}
      subtitle={`Passo ${step} di ${total} · ${meta.sub}`}
      z={24}
      onClose={() => !busy && onClose()}
      onBack={step > 1 && !busy ? () => go(step - 1) : null}
    >
      <div className="bl-reg-dots" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={step} aria-label="Avanzamento registrazione">
        {Array.from({ length: total }, (_, i) => <i key={i} className={i + 1 === step ? "now" : i + 1 < step ? "done" : ""} />)}
      </div>

      <form className="bl-account-form bl-reg-form" noValidate onSubmit={next}>
        <div key={step} className={`bl-reg-pane bl-reg-${dir}`}>
          <div className="bl-reg-orb" aria-hidden="true"><span>{meta.icon}</span></div>

          {step === 1 && (
            <>
              {prefilled && <p className="bl-reg-note">✨ Abbiamo precompilato i dati dal tuo account Google: controlla e continua.</p>}
              <div className="bl-two">
                {field("firstName", "Nome", { type: "text", autoComplete: "given-name", maxLength: 60 })}
                {field("lastName", "Cognome", { type: "text", autoComplete: "family-name", maxLength: 60 })}
              </div>
              {field("businessName", "Nome attività (facoltativo)", { type: "text", autoComplete: "organization", maxLength: 60, placeholder: "es. Bar Sole" })}
              <div className="bl-field-label" role="group" aria-labelledby="bl-reg-cat">
                <span id="bl-reg-cat">Tipo di profilo</span>
                <div className="bl-chips bl-reg-cats">
                  {USER_CATEGORIES.map((c) => (
                    <button type="button" key={c.id} className={f.category === c.id ? "on" : ""} aria-pressed={f.category === c.id} onClick={() => set("category", c.id)}>
                      {c.icon} {c.label}
                    </button>
                  ))}
                </div>
                <small className="bl-muted">L’icona apparirà sulle bolle che pubblichi.</small>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              {field("email", "Email", { type: "email", autoComplete: "email", inputMode: "email", maxLength: 254, placeholder: "nome@esempio.it" })}
              {field("phone", "Numero di telefono", { type: "tel", autoComplete: "tel", inputMode: "tel", maxLength: 20, placeholder: "+39 333 1234567" })}
            </>
          )}

          {step === 3 && (
            <>
              <div className="bl-field-label">
                Sesso
                <div className="bl-chips" role="group" aria-label="Sesso" data-invalid={Boolean(errors.sex)}>
                  {SEX_OPTIONS.map(([k, l]) => (
                    <button type="button" key={k} className={f.sex === k ? "on" : ""} aria-pressed={f.sex === k} onClick={() => set("sex", k)}>{l}</button>
                  ))}
                </div>
                {errors.sex && <small className="bl-err" role="alert">{errors.sex}</small>}
              </div>
              <BirthDatePicker value={f.birthDate} onChange={(v) => set("birthDate", v)} error={errors.birthDate} />
              <small className="bl-muted">Serve a verificare che tu abbia almeno {MIN_AGE} anni. Non è visibile agli altri.</small>
              <NationalityPicker value={f.nationality} onChange={(v) => set("nationality", v)} error={errors.nationality} />
              <CityPicker value={f.city} onChange={(v) => set("city", v)} error={errors.city} />
            </>
          )}

          {step === 4 && (
            <>
              <div className="bl-privacy bl-reg-privacy">
                <ul>
                  <li><strong>Titolare:</strong> {PRIVACY_CONTROLLER} · {PRIVACY_EMAIL}</li>
                  <li><strong>Dati raccolti:</strong> nome, cognome, email, telefono, sesso, data di nascita, nazionalità, città e, se lo indichi, il nome della tua attività. Il PIN è conservato solo come hash cifrato.</li>
                  <li><strong>Finalità:</strong> creare e gestire il tuo account, sicurezza e statistiche aggregate (art. 6.1 a-b GDPR).</li>
                  <li><strong>Visibilità:</strong> gli altri vedono solo il tuo username. Dal profilo potrai scegliere di mostrare il nome dell’attività o nome e cognome; email, telefono e data di nascita non sono mai visibili. I dati non sono venduti e vi accede solo l’amministratore, con accessi registrati.</li>
                  <li><strong>Conservazione e diritti:</strong> finché l’account è attivo; accesso, rettifica, portabilità e cancellazione da Profilo → Impostazioni o scrivendo al titolare.</li>
                </ul>
              </div>
              <label className="bl-check" data-invalid={Boolean(errors.consent)}>
                <input type="checkbox" checked={f.consent} onChange={(e) => set("consent", e.target.checked)} />
                <span>
                  <strong>Informativa e consenso</strong>
                  <small>Ho letto l’informativa, acconsento al trattamento dei miei dati personali e dichiaro di avere almeno {MIN_AGE} anni.</small>
                </span>
              </label>
              {errors.consent && <small className="bl-err" role="alert">{errors.consent}</small>}
            </>
          )}

          {step === 5 && (
            <>
              <div className="bl-account-ready" role="status">
                <strong>Il tuo username: @{username || "in preparazione"}</strong>
                <p>Ti serve insieme al PIN per accedere, anche da un altro dispositivo. Annotalo.</p>
              </div>
              <label className="bl-field-label">
                Scegli un PIN di 4 cifre
                <input type={showPin ? "text" : "password"} inputMode="numeric" autoComplete="new-password" maxLength={4} value={pin} placeholder="••••"
                  onChange={(e) => { setPin(e.target.value.replace(/\D/g, "").slice(0, 4)); setError(""); }} />
              </label>
              <label className="bl-field-label">
                Ripeti il PIN
                <input type={showPin ? "text" : "password"} inputMode="numeric" autoComplete="new-password" maxLength={4} value={pin2} placeholder="••••"
                  onChange={(e) => { setPin2(e.target.value.replace(/\D/g, "").slice(0, 4)); setError(""); }} />
              </label>
              <div className="bl-ob-pinrow">
                <button type="button" className="bl-link" onClick={() => setShowPin((v) => !v)}>{showPin ? "Nascondi PIN" : "Mostra PIN"}</button>
                {pin2.length === 4 && (pin === pin2 ? <small className="bl-ok">✓ I PIN coincidono</small> : <small className="bl-err">I PIN non coincidono</small>)}
              </div>
              <p className="bl-muted">Il PIN non si può recuperare: conservalo con cura.</p>
            </>
          )}

          {error && (
            <div className="bl-ob-errorbox" role="alert">
              <p className="bl-error">{error}</p>
              <ReportProblemButton context={`Registrazione passo ${step} (${mode}): ${error}`} label="Il problema continua? Segnalalo" />
            </div>
          )}
        </div>

        <button type="submit" className="bl-cta" disabled={busy}>
          {busy ? "Un attimo…" : last ? "Completa registrazione" : "Continua"}
        </button>
        {step === 1 && !dataOnly && onOpenLogin && (
          <button type="button" className="bl-link" onClick={onOpenLogin}>Hai già un account? Accedi</button>
        )}
      </form>
    </Sheet>
  );
}