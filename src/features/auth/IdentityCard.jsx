import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/bolleCore.jsx";
import { businessNameProblem, cleanBusinessName, publicNamePreview, friendlyError } from "./authRules.js";

/* Interruttore «Anonimato» per Profilo → Impostazioni → Identità e anonimato.
   Attivo  = gli altri vedono solo lo username.
   Spento  = gli altri vedono il nome attività oppure nome e cognome, secondo la scelta fatta (showBusiness).
   Usa un <button role="switch">. Gli stili del layout sono qui dentro (classi bl-asw-*) per non
   ereditare quelli del vecchio interruttore (.bl-anon-switch), che copriva il testo. */

const CSS = `
.bl-asw-row{display:flex;align-items:center;justify-content:space-between;gap:16px;margin:0 0 12px}
.bl-asw-copy{flex:1 1 0;min-width:0;display:flex;flex-direction:column;gap:4px}
.bl-asw-copy .bl-anon-title{display:block;font-weight:700}
.bl-asw-copy .bl-anon-desc{display:block;line-height:1.4;opacity:.8;overflow-wrap:anywhere}
.bl-asw-btn{flex:none;display:inline-flex;align-items:center;gap:10px;margin:0;padding:6px 4px;border:0;border-radius:999px;background:transparent;color:inherit;font:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}
.bl-asw-btn:focus-visible{outline:2px solid #b9a7ff;outline-offset:3px}
.bl-asw-track{position:relative;display:block;width:52px;height:30px;border-radius:999px;background:rgba(150,150,180,.45);transition:background .2s ease}
.bl-asw-track i{position:absolute;top:3px;left:3px;width:24px;height:24px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.35);transition:transform .2s ease}
.bl-asw-btn.on .bl-asw-track{background:#8f7dff}
.bl-asw-btn.on .bl-asw-track i{transform:translateX(22px)}
.bl-asw-state{min-width:3.6em;font-size:.9em;font-weight:600}
@media (prefers-reduced-motion:reduce){.bl-asw-track,.bl-asw-track i{transition:none}}
`;

function AnonymitySwitch({ checked, onChange, hasBusiness = false, showBusiness = hasBusiness, preview = "" }) {
  const hint = checked
    ? "Gli altri vedono solo il tuo username."
    : showBusiness
      ? "Gli altri vedono il nome della tua attività."
      : "Gli altri vedono il tuo nome e cognome.";

  return (
    <div className="bl-anon">
      <style>{CSS}</style>
      <div className="bl-asw-row">
        <div className="bl-asw-copy">
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
          className={`bl-asw-btn ${checked ? "on" : ""}`}
          onClick={() => onChange(!checked)}
        >
          <span className="bl-asw-track" aria-hidden="true"><i /></span>
          <span className="bl-asw-state" aria-hidden="true">{checked ? "Attivo" : "Spento"}</span>
        </button>
      </div>
      <p className="bl-anon-preview" role="status" aria-live="polite">
        Così ti vedono gli altri: <strong>{preview}</strong>
      </p>
      <small className="bl-muted">{hint}</small>
    </div>
  );
}

/* Scheda «Identità»: Nome attività + interruttore Anonimato + scelta di cosa mostrare.
   Fonte unica dei dati: bolle_user_identity, tramite le RPC bolle_get_my_identity / bolle_set_my_identity.

   Con anonimato spento e nome attività presente, l'utente sceglie cosa vedono gli altri:
   - "business_name": il nome attività
   - "personal_name": nome e cognome
   La scelta compare solo se il database la supporta (colonna display_identity). */
const BUSINESS = "business_name";
const PERSON = "personal_name";

export default function IdentityCard({ username, firstName, lastName, onNotify }) {
  const [state, setState] = useState("loading"); // loading | ready | unavailable
  const [anon, setAnon] = useState(true);
  const [savedBiz, setSavedBiz] = useState("");
  const [biz, setBiz] = useState("");
  const [identity, setIdentity] = useState(BUSINESS);
  const [canChoose, setCanChoose] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [names, setNames] = useState({ first: firstName || "", last: lastName || "" });

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data, error: err } = await supabase.rpc("bolle_get_my_identity");
      if (!alive) return;
      if (err) { setState("unavailable"); return; }
      const row = Array.isArray(data) ? data[0] : data;
      setAnon(row?.is_anonymous !== false);
      setSavedBiz(row?.business_name || "");
      setBiz(row?.business_name || "");
      setCanChoose(Boolean(row) && "display_identity" in row);
      setIdentity(row?.display_identity === PERSON ? PERSON : BUSINESS);
      setState("ready");
      if (!firstName && !lastName) {
        try {
          const { data: pd } = await supabase.rpc("bolle_my_personal_data");
          if (alive && pd) setNames({ first: pd.first_name || "", last: pd.last_name || "" });
        } catch { /* l'anteprima userà il testo di riserva */ }
      }
    })();
    return () => { alive = false; };
  }, []);

  // p_display_identity viene inviato solo quando l'utente lo cambia davvero:
  // così interruttore e nome attività continuano a funzionare in ogni caso.
  async function save(nextBiz, nextAnon, nextIdentity) {
    const params = { p_business_name: nextBiz || null, p_is_anonymous: nextAnon };
    if (nextIdentity) params.p_display_identity = nextIdentity;
    const { error: err } = await supabase.rpc("bolle_set_my_identity", params);
    if (err) throw err;
  }

  async function toggleAnon(next) {
    const old = anon;
    setAnon(next); setError("");
    try { await save(savedBiz, next); onNotify?.(next ? "Anonimato attivo" : "Anonimato disattivato"); }
    catch (e) { setAnon(old); setError(friendlyError(e)); }
  }

  async function chooseIdentity(next) {
    if (next === identity) return;
    const old = identity;
    setIdentity(next); setError("");
    try { await save(savedBiz, anon, next); onNotify?.(next === BUSINESS ? "Ora gli altri vedono il nome attività" : "Ora gli altri vedono il tuo nome e cognome"); }
    catch (e) { setIdentity(old); setError(friendlyError(e)); }
  }

  async function saveBusiness(e) {
    e.preventDefault();
    const clean = cleanBusinessName(biz);
    const problem = businessNameProblem(clean);
    if (problem) { setError(problem); return; }
    setBusy(true); setError("");
    try { await save(clean, anon); setSavedBiz(clean); setBiz(clean); onNotify?.(clean ? "Nome attività salvato" : "Nome attività rimosso"); }
    catch (err) {
      // Il limite dei 7 giorni arriva dal database con un messaggio già chiaro: lo mostriamo così com'è.
      const msg = String(err?.message || "");
      setError(msg.includes("7 giorni") ? msg : friendlyError(err));
    }
    finally { setBusy(false); }
  }

  if (state === "loading") return null;
  if (state === "unavailable") return <p className="bl-muted">Le impostazioni di identità non sono disponibili al momento.</p>;

  const dirty = cleanBusinessName(biz) !== cleanBusinessName(savedBiz);
  const hasBiz = Boolean(savedBiz);
  // Se il database non supporta ancora la scelta, vale il comportamento storico: nome attività se presente.
  const showBiz = hasBiz && (!canChoose || identity === BUSINESS);

  return (
    <section className="bl-id-card" aria-label="Identità pubblica">
      <AnonymitySwitch
        checked={anon}
        onChange={toggleAnon}
        hasBusiness={hasBiz}
        showBusiness={showBiz}
        preview={publicNamePreview({ username, isAnonymous: anon, businessName: showBiz ? savedBiz : "", firstName: firstName || names.first, lastName: lastName || names.last })}
      />

      {canChoose && hasBiz && !anon && (
        <div className="bl-id-choice">
          <span id="bl-id-choice-label" className="bl-anon-title">Cosa mostrare agli altri</span>
          <div className="bl-segment" role="group" aria-labelledby="bl-id-choice-label">
            <button type="button" className={identity === BUSINESS ? "on" : ""} aria-pressed={identity === BUSINESS} onClick={() => chooseIdentity(BUSINESS)}>
              Nome attività
            </button>
            <button type="button" className={identity === PERSON ? "on" : ""} aria-pressed={identity === PERSON} onClick={() => chooseIdentity(PERSON)}>
              Nome e cognome
            </button>
          </div>
        </div>
      )}

      <form className="bl-id-biz" onSubmit={saveBusiness} noValidate>
        <label className="bl-field-label">
          Nome attività (facoltativo)
          <input type="text" value={biz} maxLength={60} autoComplete="organization" placeholder="es. Bar Sole" onChange={(e) => { setBiz(e.target.value); setError(""); }} aria-invalid={Boolean(error)} />
        </label>
        <small className="bl-muted">Hai un bar, un ristorante, un negozio? Con l’anonimato disattivato potrai scegliere se gli altri vedono questo nome oppure il tuo nome e cognome.</small>
        {error && <p className="bl-error" role="alert">{error}</p>}
        <button type="submit" className="bl-ghost" disabled={busy || !dirty}>{busy ? "Salvataggio…" : "Salva nome attività"}</button>
      </form>
    </section>
  );
}