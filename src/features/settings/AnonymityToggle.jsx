import React, { useEffect, useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { supabase } from "../../lib/bolleCore.jsx";

/* Anonimato: interruttore unico, disponibile SOLO nelle impostazioni del profilo (non in registrazione).
   Cambia soltanto la visibilità: nome e cognome / nome attività restano salvati e non vengono mai modificati.

   Identità mostrata: se l'utente ha un nome attività e NON è anonimo, può scegliere se gli altri vedono
   il nome attività ("business_name") oppure nome e cognome ("personal_name").
   Default: "business_name" (comportamento precedente, quindi nessun cambiamento per chi non sceglie).

   RPC usate:
   - bolle_my_profile_privacy  (lettura)  → deve restituire anche display_identity
   - bolle_set_profile_privacy (scrittura) → deve accettare anche p_display_identity */

const toast = (message) => { try { window.dispatchEvent(new CustomEvent("bolle:toast", { detail: message })); } catch { /* ignora */ } };
const settle = (builder) => Promise.resolve(builder).then((r) => r, () => ({ data: null, error: true }));

const IDENTITY = { business: "business_name", person: "personal_name" };
const normalizeIdentity = (v) => (v === IDENTITY.person ? IDENTITY.person : IDENTITY.business);

export default function AnonymityToggle({ username }) {
  const [priv, setPriv] = useState(null);
  const [names, setNames] = useState({ person: "", business: "" });
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let live = true;
    (async () => {
      const [p, d] = await Promise.all([settle(supabase.rpc("bolle_my_profile_privacy")), settle(supabase.rpc("bolle_my_personal_data"))]);
      if (!live) return;
      if (p.error || !p.data) { setStatus("error"); return; }
      const row = Array.isArray(d.data) ? d.data[0] : d.data;
      setNames({
        person: [row?.first_name, row?.last_name].filter(Boolean).join(" ").trim(),
        business: String(row?.business_name || "").trim(),
      });
      setPriv({
        show_name: p.data.show_name === true,
        birth_mode: p.data.birth_mode || "nobody",
        show_bubbles: p.data.show_bubbles === true,
        display_identity: normalizeIdentity(p.data.display_identity),
      });
      setStatus("ready");
    })();
    return () => { live = false; };
  }, []);

  const anonymous = !priv?.show_name;
  const hasBusiness = Boolean(names.business);

  // Se il nome attività è stato rimosso, si ricade su nome e cognome senza toccare la preferenza salvata.
  const identity = hasBusiness && priv?.display_identity === IDENTITY.business ? IDENTITY.business : IDENTITY.person;
  const showingBusiness = identity === IDENTITY.business;
  const shownName = (showingBusiness ? names.business : names.person) || "Il tuo nome";
  const shownLabel = showingBusiness ? "nome attività" : "nome e cognome";
  const hiddenLabel = hasBusiness ? "Nome e cognome / nome attività" : "Nome e cognome";

  // Salva con aggiornamento ottimistico; se fallisce torna al valore precedente.
  async function persist(next, successMessage) {
    if (!priv || saving) return;
    const old = priv;
    setPriv(next);
    setSaving(true);
    const { error } = await settle(supabase.rpc("bolle_set_profile_privacy", {
      p_show_name: next.show_name,
      p_birth_mode: next.birth_mode,
      p_show_bubbles: next.show_bubbles,
      p_display_identity: next.display_identity,
    }));
    setSaving(false);
    if (error) { setPriv(old); toast("Impostazione non salvata. Riprova."); return; }
    toast(successMessage);
  }

  function toggle() {
    if (!priv) return;
    const next = { ...priv, show_name: anonymous }; // anonimo → mostra il nome; visibile → torna anonimo
    const nextShown = next.display_identity === IDENTITY.business && hasBusiness ? "nome attività" : "nome e cognome";
    persist(next, next.show_name ? `Ora gli altri vedono il tuo ${nextShown}` : "Ora sei anonimo: gli altri vedono solo il tuo @username");
  }

  function chooseIdentity(value) {
    if (!priv || value === identity) return;
    persist(
      { ...priv, display_identity: value },
      value === IDENTITY.business ? "Ora gli altri vedono il nome della tua attività" : "Ora gli altri vedono il tuo nome e cognome",
    );
  }

  if (status === "loading") return <p className="bl-muted" role="status">Carico le tue impostazioni…</p>;
  if (status === "error") return <p className="bl-error" role="alert">Non riesco a leggere l’impostazione di anonimato. Riprova più tardi.</p>;

  return (
    <div className={`bl-anon ${anonymous ? "is-anon" : "is-open"}`}>
      <button type="button" role="switch" aria-checked={anonymous} className="bl-anon-switch" onClick={toggle} disabled={saving}>
        <span className="bl-anon-ico" aria-hidden="true">{anonymous ? <Lock size={22} /> : <Eye size={22} />}</span>
        <span className="bl-anon-copy">
          <strong>Anonimato {anonymous ? "attivo" : "disattivato"}</strong>
          <small>
            {anonymous
              ? `Gli altri non vedono il tuo ${hasBusiness ? "nome attività né il tuo nome e cognome" : "nome e cognome"}.`
              : `Gli altri vedono il tuo ${shownLabel}.`}
          </small>
        </span>
        <span className="bl-anon-track" aria-hidden="true"><i /></span>
      </button>

      {/* La scelta compare solo per chi ha un nome attività e non è anonimo. */}
      {hasBusiness && !anonymous && (
        <div className="bl-anon-identity">
          <p className="bl-anon-cap" id="bl-anon-identity-label">Cosa mostrare agli altri</p>
          <div className="bl-segment" role="group" aria-labelledby="bl-anon-identity-label">
            <button
              type="button"
              className={showingBusiness ? "on" : ""}
              aria-pressed={showingBusiness}
              disabled={saving}
              onClick={() => chooseIdentity(IDENTITY.business)}
            >
              Nome attività
            </button>
            <button
              type="button"
              className={!showingBusiness ? "on" : ""}
              aria-pressed={!showingBusiness}
              disabled={saving}
              onClick={() => chooseIdentity(IDENTITY.person)}
            >
              Nome e cognome
            </button>
          </div>
        </div>
      )}

      <div className="bl-anon-preview" aria-live="polite">
        <p className="bl-anon-cap">Così ti vedono gli altri</p>
        <div className="bl-anon-card" key={anonymous ? "a" : identity}>
          <span className="bl-anon-ava" aria-hidden="true">{anonymous ? "🫧" : (shownName.trim()[0] || "🫧").toUpperCase()}</span>
          <div className="bl-anon-lines">
            <b>@{username || "…"}</b>
            {anonymous
              ? <span className="bl-anon-hidden"><EyeOff size={15} aria-hidden="true" /> {hiddenLabel} nascosto</span>
              : <span className="bl-anon-name">{shownName}</span>}
          </div>
        </div>
      </div>

      <p className="bl-anon-note">Attivare o disattivare non modifica i tuoi dati: cambia solo cosa possono vedere gli altri utenti. Se hai meno di 18 anni il cognome non viene mai mostrato.</p>
    </div>
  );
}