import React, { useState, useEffect } from "react";
import { supabase, USER_CATEGORIES } from "../../lib/bolleCore.jsx";
import { bolleCountryFromNationality, countryList, ageFromBirthDate, birthDateProblem } from "../../lib/geo.js";
import { NationalityPicker, CityPicker, BirthDatePicker } from "../../components/pickers/FormPickers.jsx";

export default function PersonalDataView({ me, onNotify }) {
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [needsConsent, setNeedsConsent] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  const readStoredCategory = () => {
    try {
      return localStorage.getItem("bolle-my-category") || "";
    } catch {
      return "";
    }
  };

  const validCategory = v => USER_CATEGORIES.some(c => c.id === v) ? v : "";
  const initialCategory = validCategory(me?.category) || validCategory(readStoredCategory()) || "utente";
  const [category, setCategory] = useState(initialCategory);
  const [savedCategory, setSavedCategory] = useState(initialCategory);

  useEffect(() => {
    let alive = true;
    supabase.rpc("bolle_my_personal_data").then(async ({ data, error: err }) => {
      if (!alive) return;
      if (err) {
        setError(err.message);
        return;
      }
      const next = { ...(data || {}) };
      // Valori storici come "italiana" vengono ricondotti al paese corrispondente nell'elenco.
      const code = bolleCountryFromNationality(next.nationality);
      const country = code && countryList().find(c => c.code === code);
      if (country) next.nationality = country.name;
      try {
        const { data: birth } = await supabase.rpc("bolle_my_birth_date");
        if (birth) next.birth_date = String(birth).slice(0, 10);
      } catch {
        /* funzione non ancora creata */
      }
      // La categoria non è un dato personale: si gestisce a parte e non va inviata a bolle_update_personal_data.
      const serverCategory = validCategory(next.category);
      delete next.category;
      if (alive) {
        if (serverCategory) {
          setCategory(serverCategory);
          setSavedCategory(serverCategory);
        }
        setForm(next);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  const fields = [
    ["first_name", "Nome"],
    ["last_name", "Cognome"],
    ["sex", "Sesso"],
    ["birth_date", "Data di nascita (gg/mm/aaaa)"],
    ["email", "Email"],
    ["phone", "Cellulare"],
    ["nationality", "Nazionalità"],
    ["city", "Città di residenza"],
  ];

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (category !== savedCategory) {
        const { error: categoryError } = await supabase.rpc("bolle_set_my_category", { p_category: category });
        if (categoryError) throw new Error("Impossibile cambiare il tipo di profilo: " + categoryError.message);
        try {
          localStorage.setItem("bolle-my-category", category);
        } catch {
          /* storage non disponibile */
        }
        setSavedCategory(category);
      }
      if (form.birth_date) {
        const problem = birthDateProblem(form.birth_date);
        if (problem) throw new Error(problem);
      } else if (needsConsent) {
        throw new Error("Seleziona la tua data di nascita.");
      }
      if (needsConsent) {
        if (!privacyAccepted) throw new Error("Per inizializzare il profilo devi leggere e accettare l’informativa privacy.");
        const { error: initError } = await supabase.rpc("bolle_save_personal_data", {
          p_first_name: form.first_name,
          p_last_name: form.last_name,
          p_email: form.email,
          p_phone: form.phone,
          p_sex: form.sex,
          p_age: form.birth_date ? ageFromBirthDate(form.birth_date) : (form.age === "" || form.age == null ? null : Number(form.age)),
          p_privacy_accepted: true,
        });
        if (initError) throw initError;
      }
      const { birth_date: birthDate, ...personalPayload } = form;
      const { error: updateError } = await supabase.rpc("bolle_update_personal_data", { p_data: personalPayload });
      if (updateError) {
        if (updateError.message?.includes("personal_data_not_initialized")) {
          setNeedsConsent(true);
          throw new Error("Per completare il profilo devi prima confermare l’informativa privacy qui sotto, poi premere nuovamente Salva.");
        }
        throw updateError;
      }
      if (birthDate) {
        const { error: birthError } = await supabase.rpc("bolle_set_birth_date", { p_birth_date: birthDate });
        if (birthError) throw birthError;
      }
      setNeedsConsent(false);
      setPrivacyAccepted(false);
      onNotify("Dati aggiornati.");
    } catch (err) {
      setError(err?.message || "Salvataggio non riuscito.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bl-insights">
      <section className="bl-insights-section">
        <h3>Il tuo account</h3>
        <p><strong>Username:</strong> @{me?.username || "–"}</p>
        <p className="bl-muted">Per sicurezza la password/PIN non è recuperabile né visualizzabile: è conservata come hash. Potrai cambiarla tramite una procedura di reset verificata.</p>
      </section>
      {error && <p className="bl-error" role="alert">{error}</p>}
      {!form ? (
        <p className="bl-muted">Caricamento dati…</p>
      ) : (
        <form className="bl-account-form" onSubmit={save}>
          {fields.map(([key, label]) => {
            if (key === "birth_date") {
              return (
                <BirthDatePicker
                  key={key}
                  label={label}
                  value={form.birth_date || ""}
                  onChange={iso => setForm(f => ({ ...f, birth_date: iso, age: iso ? ageFromBirthDate(iso) : f.age }))}
                />
              );
            }
            if (key === "nationality") {
              return (
                <NationalityPicker
                  key={key}
                  value={form.nationality || ""}
                  onChange={v => setForm(f => ({ ...f, nationality: v }))}
                />
              );
            }
            if (key === "city") {
              return (
                <CityPicker
                  key={key}
                  value={form.city || ""}
                  onChange={v => setForm(f => ({ ...f, city: v }))}
                />
              );
            }
            return (
              <label className="bl-field-label" key={key}>
                {label}
                {key === "sex" ? (
                  <select value={form[key] ?? ""} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} required>
                    <option value="">Seleziona</option>
                    <option value="F">Femminile</option>
                    <option value="M">Maschile</option>
                    <option value="X">Altro</option>
                    <option value="N">Preferisco non indicarlo</option>
                  </select>
                ) : (
                  <input
                    type={key === "email" ? "email" : "text"}
                    maxLength={150}
                    value={form[key] ?? ""}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    required={needsConsent && ["first_name", "last_name", "email", "phone"].includes(key)}
                  />
                )}
              </label>
            );
          })}
          <div className="bl-field-label" role="group" aria-labelledby="bl-profile-type-label">
            <span id="bl-profile-type-label">Tipo di profilo</span>
            <div className="bl-chips bl-profile-type-chips">
              {USER_CATEGORIES.map(c => (
                <button
                  type="button"
                  key={c.id}
                  className={category === c.id ? "on" : ""}
                  aria-pressed={category === c.id}
                  onClick={() => setCategory(c.id)}
                >
                  {c.icon} {c.label}
                </button>
              ))}
            </div>
            <small className="bl-muted">Questa icona indicherà il tuo profilo sulle bolle che pubblicherai da ora in poi. Le bolle già pubblicate restano invariate.</small>
          </div>
          {needsConsent && (
            <section className="bl-insights-section" aria-label="Consenso privacy">
              <h3>Informativa privacy</h3>
              <p className="bl-muted">Per il tuo account non risulta ancora registrata un'accettazione dell'informativa nel nuovo archivio dei dati personali. Prima di continuare, consulta l'informativa privacy completa dell'app. L'accettazione viene registrata soltanto se la confermi ora.</p>
              <label className="bl-field-label" style={{ display: "flex", flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
                <input
                  type="checkbox"
                  checked={privacyAccepted}
                  onChange={e => setPrivacyAccepted(e.target.checked)}
                  required
                  style={{ width: 20, flexShrink: 0, marginTop: 3 }}
                />
                Ho letto l'informativa privacy dell'app e confermo di averne preso visione e di accettare il trattamento necessario per il servizio.
              </label>
            </section>
          )}
          <button className="bl-cta" disabled={busy || (needsConsent && !privacyAccepted)}>
            {busy ? "Salvataggio…" : needsConsent ? "Conferma e salva dati" : "Salva modifiche"}
          </button>
        </form>
      )}
    </div>
  );
}
