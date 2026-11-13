/* Regole dell'area account in un solo file: validazione della registrazione, messaggi d'errore e identità pubblica.
   (Unisce i vecchi authValidation.js e identity.js. Le regole sull'identità sono allineate a quelle del server: sql/01_identity_geo.sql.) */
   import { SEX_OPTIONS } from "../../components/pickers/FormPickers.jsx";
   import { birthDateProblem, MIN_AGE } from "../../lib/geo.js";
   
   export const PRIVACY_CONTROLLER = "[Inserisci qui nome o ragione sociale del titolare]"; // DA COMPILARE
   export const PRIVACY_EMAIL = "privacy@tuodominio.it";                                    // DA COMPILARE
   
   export const NAME_RE = /^[\p{L}][\p{L}\p{M}'’ .-]{1,59}$/u;
   export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
   export const PHONE_RE = /^\+?[0-9]{7,15}$/;
   export const normalizePhone = (s) => String(s || "").replace(/[\s().-]/g, "");
   
   export function validateProfile(f) {
     const e = {};
     if (!NAME_RE.test(f.firstName.trim())) e.firstName = "Inserisci il tuo nome (almeno 2 lettere).";
     if (!NAME_RE.test(f.lastName.trim())) e.lastName = "Inserisci il tuo cognome (almeno 2 lettere).";
     const email = f.email.trim();
     if (email.length > 254 || !EMAIL_RE.test(email)) e.email = "Inserisci un indirizzo email valido.";
     if (!PHONE_RE.test(normalizePhone(f.phone))) e.phone = "Inserisci un numero valido, es. +39 333 1234567.";
     if (!SEX_OPTIONS.some(([k]) => k === f.sex)) e.sex = "Seleziona un’opzione.";
     const birthProblem = birthDateProblem(f.birthDate);
     if (birthProblem) e.birthDate = birthProblem;
     if (!f.nationality?.trim() || f.nationality.trim().length > 100) e.nationality = "Seleziona la tua nazionalità.";
     if (!f.city?.trim() || f.city.trim().length > 150) e.city = "Cerca e seleziona la tua città di residenza.";
     if (!f.consent) e.consent = "Il consenso è necessario per registrarti.";
     return e;
   }
   
   export function pinProblem(pin, pin2) {
     if (!/^\d{4}$/.test(pin)) return "Il PIN deve contenere esattamente 4 cifre.";
     if (/^(\d)\1{3}$/.test(pin) || "0123456789".includes(pin) || "9876543210".includes(pin)) return "PIN troppo semplice: evita cifre ripetute o sequenze (es. 1111, 1234).";
     if (pin !== pin2) return "I due PIN non coincidono.";
     return "";
   }
   
   export const ERROR_MAP = [
     ["email_taken", "Questa email è già registrata. Prova ad accedere."],
     ["invalid_email", "L’indirizzo email non è valido."],
     ["invalid_phone", "Il numero di telefono non è valido."],
     ["invalid_age", `Devi avere almeno ${MIN_AGE} anni per registrarti.`],
     ["invalid_sex", "Seleziona un’opzione per il sesso."],
     ["invalid_first_name", "Il nome non è valido."],
     ["invalid_last_name", "Il cognome non è valido."],
     ["consent_required", "Serve il consenso al trattamento dei dati."],
     ["admin_locked", "Troppi tentativi. Riprova tra qualche minuto."],
     ["forbidden", "Accesso non autorizzato."],
   ];
   
   export function friendlyError(err) {
     const m = String(err?.message || err || "");
     const hit = ERROR_MAP.find(([k]) => m.includes(k));
     if (hit) return hit[1];
     if (m.startsWith("Profilo creato")) return m;
     return "Qualcosa non ha funzionato. Riprova.";
   }
   
   /* ───────── Identità pubblica ───────── */
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