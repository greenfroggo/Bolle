/* Dati utili dall'account Google (Supabase user) per precompilare la registrazione.
   Uso in App.jsx:  <RegistrationSheet mode="google" initialData={googlePrefillFromUser(session?.user)} ... /> */
   export function googlePrefillFromUser(user) {
    if (!user) return {};
    const m = user.user_metadata || {};
    const full = String(m.full_name || m.name || "").trim();
    const parts = full.split(/\s+/).filter(Boolean);
    const firstName = String(m.given_name || parts[0] || "").trim();
    const lastName = String(m.family_name || parts.slice(1).join(" ") || "").trim();
    return {
      firstName,
      lastName,
      email: String(user.email || m.email || "").trim(),
      phone: String(user.phone || m.phone || "").trim(),
    };
  }