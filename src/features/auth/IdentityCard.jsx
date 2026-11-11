import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/bolleCore.jsx";
import AnonymitySwitch from "./AnonymitySwitch.jsx";
import { businessNameProblem, cleanBusinessName, publicNamePreview } from "./identity.js";
import { friendlyError } from "./authValidation.js";

/* Scheda «Identità» per Profilo → Dati personali: Nome Attività + interruttore Anonimato.
   Si carica e si salva da sola con le RPC bolle_get_my_identity / bolle_set_my_identity. */
export default function IdentityCard({ username, firstName, lastName, onNotify }) {
  const [state, setState] = useState("loading"); // loading | ready | unavailable
  const [anon, setAnon] = useState(true);
  const [savedBiz, setSavedBiz] = useState("");
  const [biz, setBiz] = useState("");
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

  async function save(nextBiz, nextAnon) {
    const { error: err } = await supabase.rpc("bolle_set_my_identity", { p_business_name: nextBiz || null, p_is_anonymous: nextAnon });
    if (err) throw err;
  }

  async function toggleAnon(next) {
    const old = anon;
    setAnon(next); setError("");
    try { await save(savedBiz, next); onNotify?.(next ? "Anonimato attivo" : "Anonimato disattivato"); }
    catch (e) { setAnon(old); setError(friendlyError(e)); }
  }

  async function saveBusiness(e) {
    e.preventDefault();
    const clean = cleanBusinessName(biz);
    const problem = businessNameProblem(clean);
    if (problem) { setError(problem); return; }
    setBusy(true); setError("");
    try { await save(clean, anon); setSavedBiz(clean); setBiz(clean); onNotify?.(clean ? "Nome attività salvato" : "Nome attività rimosso"); }
    catch (err) { setError(friendlyError(err)); }
    finally { setBusy(false); }
  }

  if (state === "loading") return null;
  if (state === "unavailable") return <p className="bl-muted">Le impostazioni di identità non sono disponibili al momento.</p>;

  const dirty = cleanBusinessName(biz) !== cleanBusinessName(savedBiz);
  return (
    <section className="bl-id-card" aria-label="Identità pubblica">
      <AnonymitySwitch
        checked={anon}
        onChange={toggleAnon}
        hasBusiness={Boolean(savedBiz)}
        preview={publicNamePreview({ username, isAnonymous: anon, businessName: savedBiz, firstName: firstName || names.first, lastName: lastName || names.last })}
      />
      <form className="bl-id-biz" onSubmit={saveBusiness} noValidate>
        <label className="bl-field-label">
          Nome attività (facoltativo)
          <input type="text" value={biz} maxLength={60} autoComplete="organization" placeholder="es. Bar Sole" onChange={(e) => { setBiz(e.target.value); setError(""); }} aria-invalid={Boolean(error)} />
        </label>
        <small className="bl-muted">Hai un bar, un ristorante, un negozio? Con l’anonimato disattivato gli altri vedranno questo nome al posto del tuo.</small>
        {error && <p className="bl-error" role="alert">{error}</p>}
        <button type="submit" className="bl-ghost" disabled={busy || !dirty}>{busy ? "Salvataggio…" : "Salva nome attività"}</button>
      </form>
    </section>
  );
}
