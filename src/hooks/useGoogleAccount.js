import React, { useState, useEffect } from "react";
import { supabase } from "../lib/bolleCore.jsx";

/* Account Google collegato al profilo (letto dalla sessione di autenticazione, nessun dato salvato). */
export function useGoogleAccount() {
  const [google, setGoogle] = useState(undefined); // undefined = in caricamento, null = non collegato
  useEffect(() => {
    let alive = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!alive) return;
      const user = data?.user;
      const identity = (user?.identities || []).find(i => i.provider === "google");
      setGoogle(identity ? { email: identity.identity_data?.email || user?.email || "" } : null);
    }).catch(() => {
      if (alive) setGoogle(null);
    });
    return () => {
      alive = false;
    };
  }, []);
  return google;
}

export function GoogleAccountBadge() {
  const google = useGoogleAccount();
  if (!google) return null;
  return (
    <div className="bl-google-account" role="status">
      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
        <small>Accesso effettuato con Google</small>
        <strong>{google.email || "Account Google"}</strong>
      </div>
    </div>
  );
}

export default useGoogleAccount;
