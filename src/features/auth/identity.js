/* Identità pubblica: Nome Attività + anonimato. Regole allineate a quelle del server (vedi sql/01_identity_geo.sql). */
export const BUSINESS_NAME_MIN = 2;
export const BUSINESS_NAME_MAX = 60;

export function cleanBusinessName(v) {
  return String(v || "").replace(/\s+/g, " ").trim();
}

/* Restituisce un messaggio d'errore, oppure "" se il valore è valido (il campo è facoltativo). */
export function businessNameProblem(value) {
  const v = cleanBusinessName(value);
  if (!v) return "";
  if (v.length < BUSINESS_NAME_MIN || v.length > BUSINESS_NAME_MAX) return `Il nome deve avere da ${BUSINESS_NAME_MIN} a ${BUSINESS_NAME_MAX} caratteri.`;
  if (/(https?:\/\/|www\.|@)/i.test(v)) return "Non inserire link o indirizzi email.";
  if (/\d[\d\s().\/-]{6,}/.test(v)) return "Non inserire numeri di telefono.";
  return "";
}

/* Come ti vedono gli altri, con la stessa regola del server:
   anonimo → @username · altrimenti nome attività · altrimenti nome e cognome. */
export function publicNamePreview({ username, isAnonymous, businessName, firstName, lastName }) {
  const handle = `@${username || "il-tuo-username"}`;
  if (isAnonymous) return handle;
  const biz = cleanBusinessName(businessName);
  if (biz) return biz;
  const full = `${String(firstName || "").trim()} ${String(lastName || "").trim()}`.trim();
  return full || "il tuo nome e cognome";
}