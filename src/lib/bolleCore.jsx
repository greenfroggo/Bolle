import { createClient } from "@supabase/supabase-js";
import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";
import { Heart, Smile, HeartHandshake, Frown } from "lucide-react";

/* BOLLE V2 — home immersiva, aperture con bonus, username anonimi, classifiche, profilo come hub. */
export const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
const BUCKET = "bubbles";
const MAX_UPLOAD_MB = 50;
const RADII = [0.1, 0.5, 1, 5, 25, 100];
const BOLLE_COUNTRIES = [{code:"IT",name:"Italia"},{code:"FR",name:"Francia"},{code:"DE",name:"Germania"},{code:"ES",name:"Spagna"},{code:"GB",name:"Regno Unito"},{code:"CH",name:"Svizzera"},{code:"AT",name:"Austria"},{code:"US",name:"Stati Uniti"},{code:"PT",name:"Portogallo"},{code:"BE",name:"Belgio"},{code:"NL",name:"Paesi Bassi"}];
function countryFlag(code) { if(!/^[A-Z]{2}$/.test(code || "")) return null; return String.fromCodePoint(...[...code].map(c=>127397+c.charCodeAt(0))); }
const STARTER_COUNT = 100;
const MINI_THRESHOLD = 5; // mostra le mini bolle soltanto quando il saldo è basso
const miniStyle = (i) => ({ "--c1": PALETTES[i % PALETTES.length][0], "--c2": PALETTES[i % PALETTES.length][1] });
const AVATARS = ["🐵", "🤖", "🦊", "🐱", "🐼", "🐸", "🐲", "🦄", "👾", "🐙", "🦋", "🐨", "🐧", "🦖", "🐰", "🛸"];
function avatarFor(username, avatarMap) { return avatarMap[String(username || "").toLowerCase()] || "🫧"; }
// Il link porta al feed: NON rende accessibile il media effimero senza autorizzazione.
function bubbleShareUrl(id) {
  const url = new URL(window.location.origin + window.location.pathname);
  url.searchParams.set("bubble", id);
  return url.toString();
}
function shareBubbleWhatsApp(id) {
  window.open(`https://wa.me/?text=${encodeURIComponent("Guarda questa bolla su Bolle 🫧 " + bubbleShareUrl(id))}`, "_blank", "noopener,noreferrer");
}
function WowFace({ size = 24, color = "currentColor", strokeWidth = 2, ...props }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M7.6 9.2v.1M16.4 9.2v.1" strokeWidth="3.3" />
    <ellipse cx="12" cy="15.4" rx="2.5" ry="3.3" />
    <path d="M5.3 6.7 7.8 5M16.2 5l2.5 1.7" strokeWidth="1.4" />
  </svg>;
}
const REACTIONS = [{ key: "love", Icon: Heart, label: "Mi piace", color: "#f06493" }, { key: "laugh", Icon: Smile, label: "Haha", color: "#e6a342" }, { key: "wow", Icon: WowFace, label: "Wow", color: "#8c7bdb" }, { key: "warm", Icon: HeartHandshake, label: "Nooo", color: "#d47fc0" }, { key: "sad", Icon: Frown, label: "Sono triste", color: "#6e9acb" }];
function ReactionIcon({ reaction, size = 24 }) {
  const faces = { laugh: "😆", wow: "😮", warm: "😭", sad: "🙁", love: "❤️" };
  return <span aria-hidden="true" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: size, lineHeight: 1, width: size + 2, height: size + 2, verticalAlign: "middle", flexShrink: 0, fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif' }}>{reaction.emoji || faces[reaction.key] || "🫧"}</span>;
}
// Palette coerente con l'identità BOLLE. Lo stile dipende SOLO dall'id (mai dal contenuto).
const PALETTES = [
  ["125 200 255", "167 139 250", "205 190 255"], // azzurro + viola
  ["255 150 190", "255 176 110", "255 214 170"], // rosa + arancione
  ["110 225 205", "90 150 240", "170 215 255"],  // verde acqua + blu
  ["200 160 250", "250 150 210", "255 200 235"], // lilla + rosa
  ["70 215 225", "150 205 255", "190 245 250"],  // turchese + celeste
  ["255 190 150", "190 160 250", "250 210 235"], // pesca + lilla
  ["150 230 190", "130 200 245", "200 245 225"], // menta + celeste
  ["255 140 150", "160 130 245", "255 195 215"], // corallo + viola
];
// Il testo scritto sopra foto e video è la didascalia della bolla. Un marcatore iniziale [[pos:top|mid|bot]] ne ricorda la posizione.
const CAPTION_TAGS = /^(?:\s*\[\[(?:bolle:(?:acqua|fuoco|ghiaccio|cemento|natura|luce)|pos:(?:top|mid|bot))\]\]\s*)+/;
function cleanCaption(caption) { return String(caption || "").replace(CAPTION_TAGS, ""); }
function captionPosition(caption) { const m = String(caption || "").match(/^(?:\s*\[\[bolle:[a-z]+\]\])?\s*\[\[pos:(top|mid|bot)\]\]/); return m ? m[1] : "bot"; }
const SURPRISES = [
  "Oggi potrebbe succedere qualcosa di bellissimo. Tieni gli occhi aperti. ✨",
  "Una piccola missione: fai sorridere qualcuno oggi. 💛",
  "Curiosità: i polpi hanno tre cuori. 🐙",
  "Sorpresa! Hai appena trovato un minuto tutto per te. 🌷",
  "Scrivi a una persona che non senti da tempo. 💌",
  "La luce del Sole impiega circa 8 minuti per raggiungere la Terra. ☀️",
  "Fai un desiderio. Non devi raccontarlo a nessuno. 🌠",
  "Un complimento sincero può cambiare una giornata. 🌈",
  "Le lontre marine a volte si tengono per zampa mentre riposano. 🦦",
  "Oggi prova una strada diversa, anche solo per cinque minuti. 🗺️",
  "Hai trovato un promemoria: meriti anche momenti leggeri. 🫧",
  "Una canzone che ami può trasformare questo momento. 🎵",
  "Le api comunicano anche attraverso una danza. 🐝",
  "Piccola sfida: nota tre cose belle intorno a te. 🌼",
  "Le stelle che guardi sono luce arrivata dal passato. ⭐",
  "Sorridi: hai appena scoperto un piccolo segreto dell'universo. 💫",
  "Prova a inventare una parola nuova e darle un significato. 🎨",
  "Un respiro profondo. Poi riparti quando vuoi. 🍃",
  "Le farfalle assaggiano il mondo con le zampe. 🦋",
  "Una sorpresa per te: oggi scegli qualcosa che ti incuriosisce. 🎁",
];
const STARTERS = Array.from({ length: STARTER_COUNT }, (_, i) => ({
  id: `starter-${i}`, starter: true, message: SURPRISES[i % SURPRISES.length], distance_km: null,
}));
function readStarterPops() {
  try { return new Set(JSON.parse(sessionStorage.getItem("bolle-starter-pops") || "[]")); }
  catch { return new Set(); }
}

/* Effetti sonori sintetizzati con Web Audio (nessun file audio da caricare). */
let audioCtx = null;
let soundOn = (() => { try { return localStorage.getItem("bolle-sound") !== "off"; } catch { return true; } })();
function setSoundOn(v) { soundOn = v; try { localStorage.setItem("bolle-sound", v ? "on" : "off"); } catch { /* Archiviazione locale non disponibile: prosegui senza salvare. */ } }
function getCtx() {
  if (!soundOn) return null;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!audioCtx) audioCtx = new AC({ latencyHint: "interactive" });
    if (audioCtx.state === "suspended") audioCtx.resume(); // serve un tocco dell'utente (iOS/Safari)
    return audioCtx;
  } catch { return null; }
}
function warmAudio() {
  // Richiamata durante pointerdown: sblocca Web Audio nel gesto utente, prima del click.
  const ctx = getCtx();
  if (ctx) preparePop(ctx);
}
function noiseBuffer(ctx, dur) {
  const n = Math.floor(ctx.sampleRate * dur), buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}
// POP precalcolato: il tocco deve soltanto avviare un buffer gia pronto.
let popBuffer = null;
function preparePop(ctx) {
  if (popBuffer && popBuffer.sampleRate === ctx.sampleRate) return popBuffer;
  const rate = ctx.sampleRate;
  const length = Math.ceil(rate * 0.19);
  const buffer = ctx.createBuffer(1, length, rate);
  const samples = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    const t = i / rate;
    const envelope1 = Math.min(1, t / 0.005) * Math.exp(-t * 28);
    const envelope2 = Math.min(1, t / 0.005) * Math.exp(-t * 38);
    // Frequenza che sale da 380 a 980 Hz in 70 ms, poi resta stabile.
    const phase1 = t < 0.07 ? 2 * Math.PI * (380 * t + 600 * t * t / 0.14) : 2 * Math.PI * (380 * 0.07 + 600 * 0.07 / 2 + 980 * (t - 0.07));
    const phase2 = t < 0.07 ? 2 * Math.PI * (190 * t + 300 * t * t / 0.14) : 2 * Math.PI * (190 * 0.07 + 300 * 0.07 / 2 + 490 * (t - 0.07));
    samples[i] = 0.52 * envelope1 * Math.sin(phase1) + 0.19 * envelope2 * Math.sin(phase2);
  }
  popBuffer = buffer;
  return buffer;
}
function playPop() {
  const ctx = getCtx();
  if (!ctx) return;
  const src = ctx.createBufferSource();
  src.buffer = preparePop(ctx);
  src.playbackRate.value = 0.95 + Math.random() * 0.1;
  src.connect(ctx.destination);
  src.start(0);
}
function playDust() { // Swoosh morbido e breve, senza scintille acute.
  const ctx = getCtx();
  if (!ctx) return;
  const start = ctx.currentTime;
  const duration = 0.34;
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer(ctx, duration + 0.03);
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1800, start);
  filter.frequency.exponentialRampToValueAtTime(420, start + duration);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.085, start + 0.055);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start(start);
  source.stop(start + duration + 0.02);
}

let authPromise = null;
function setAuthSession(session) {
  authPromise = session ? Promise.resolve(session) : null;
}
function ensureSession() {
  if (!authPromise) {
    authPromise = (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) return data.session;
      const { data: created, error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      return created.session;
    })().catch((e) => { authPromise = null; throw e; });
  }
  return authPromise;
}
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function bubbleLook(h) {
  const p = PALETTES[h % PALETTES.length];
  return {
    "--c1": p[0], "--c2": p[1], "--c3": p[2],
    "--gx": `${24 + ((h >>> 4) % 12)}%`, "--gy": `${15 + ((h >>> 8) % 10)}%`,
    "--rot": `${(h >>> 12) % 360}deg`, "--op": 0.88 + ((h >>> 16) % 12) / 100,
  };
}
async function getPosition() {
  if (Capacitor.isNativePlatform()) {
    // Su iOS/Android usa i permessi e il GPS nativi di Capacitor.
    const permission = await Geolocation.checkPermissions();
    if (permission.location !== "granted" && permission.coarseLocation !== "granted") {
      const requested = await Geolocation.requestPermissions();
      if (requested.location !== "granted" && requested.coarseLocation !== "granted") {
        throw new Error("location_denied");
      }
    }
    const p = await Geolocation.getCurrentPosition({
      enableHighAccuracy: false,
      timeout: 15000,
      maximumAge: 60000,
    });
    return { lat: p.coords.latitude, lng: p.coords.longitude };
  }
  // Sul sito web continua a funzionare la Geolocation API del browser.
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("no_geolocation"));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      reject,
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
    );
  });
}
function positionErrorText(err) {
  const message = String(err?.message || err || "").toLowerCase();
  if (message.includes("denied") || message.includes("permission") || err?.code === 1) {
    return "Posizione non autorizzata. Abilitala nelle Impostazioni dell’iPhone per usare «Vicino a me».";
  }
  if (message.includes("timeout") || err?.code === 3) {
    return "La posizione non è arrivata in tempo. Controlla la posizione del simulatore e riprova.";
  }
  if (message.includes("unavailable") || err?.code === 2) {
    return "Posizione non disponibile. Controlla che la localizzazione sia attiva e riprova.";
  }
  return `Impossibile ottenere la posizione: ${String(err?.message || "errore sconosciuto")}`;
}
function errorText(err) {
  const m = String(err?.message || err || "");
  if (m.includes("no_pops_left") || m.includes("daily_limit_reached")) return "Hai finito le bolle da scoppiare. Pubblica una bolla per ottenerne altre.";
  if (m.includes("already_popped")) return "Questa bolla è già scoppiata e non si riapre.";
  if (m.includes("bubble_not_found")) return "Questa bolla non c’è più.";
  if (m.includes("own_bubble")) return "Non puoi scoppiare una tua bolla.";
  if (m.includes("post_limit_reached")) return "Hai pubblicato 20 bolle nelle ultime 24 ore. Riprova più tardi.";
  if (m.includes("media_not_uploaded")) return "Il file non è stato caricato correttamente. Riprova.";
  if (m.includes("already_published")) return "Questa bolla è già stata pubblicata.";
  if (m.includes("username_immutable")) return "Lo username anonimo non si può modificare.";
  if (m.includes("favorites_disabled")) return "Questo utente non accetta di essere aggiunto ai preferiti.";
  if (m.includes("author_not_found")) return "Questo autore non è disponibile: ha nascosto il suo username.";
  if (m.includes("registration_required")) return "Per usare i preferiti serve un account registrato.";
  if (m.includes("favorite_blocked")) return "Non puoi aggiungere questo utente ai preferiti.";
  if (m.includes("cannot_favorite_self")) return "Non puoi aggiungere te stesso ai preferiti.";
  if (m.includes("user_not_found")) return "Utente non trovato.";
  if (m.includes("not_an_admirer")) return "Questo utente non ti ha più tra i suoi preferiti.";
  if (m.includes("invalid_opens_at")) return "Orario di apertura non valido.";
  if (m.includes("already_guessed")) return "Hai già risposto a questo gioco.";
  if (m.includes("already_rated")) return "Hai già votato questa bolla.";
  if (m.includes("not_popped")) return "Devi prima scoppiare la bolla.";
  if (m.includes("invalid_truth")) return "Scrivi tre frasi diverse e scegli quale è la bugia.";
  if (m.includes("invalid_rating")) return "Il voto deve essere da 1 a 10.";
  if (m.includes("Payload too large") || m.includes("exceeded")) return `Il file supera ${MAX_UPLOAD_MB} MB.`;
  return "Qualcosa non ha funzionato. Riprova.";
}
function formatDistance(km) {
  if (km == null) return null;
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(km < 10 ? 1 : 0).replace(".", ",")} km`;
}

/* Un solo requestAnimationFrame condiviso da tutte le bolle (molto più leggero di uno per bolla). */
const tickers = new Set();
let rafId = 0;
let lastFrame = 0;
function loop(t) {
  // 30 FPS: meno lavoro grafico e meno consumo di batteria su iPhone.
  if (t - lastFrame >= 32) {
    lastFrame = t;
    if (!document.hidden) tickers.forEach((fn) => fn(t));
  }
  rafId = tickers.size ? requestAnimationFrame(loop) : 0;
}
function subscribeFrame(fn) {
  tickers.add(fn);
  if (!rafId) rafId = requestAnimationFrame(loop);
  return () => tickers.delete(fn);
}

/* =====================================================================
   NUOVE AGGIUNTE: CATEGORIE, INVECCHIAMENTO (6H/48H), KLIPY
   ===================================================================== */

export const USER_CATEGORIES = [
  { id: "utente", label: "Utente", icon: "👤" },
  { id: "bar", label: "Bar", icon: "☕" },
  { id: "ristorante", label: "Ristorante", icon: "🍽️" },
  { id: "cantante", label: "Cantante", icon: "🎤" },
  { id: "dj", label: "DJ", icon: "🎧" },
  { id: "negozio", label: "Negozio", icon: "🛍️" },
  { id: "giornalista", label: "Giornalista", icon: "📰" },
  { id: "influencer", label: "Influencer", icon: "⭐" },
  { id: "videomaker", label: "Videomaker", icon: "🎥" },
  { id: "divulgatore_scientifico", label: "Divulgatore Scientifico", icon: "🔬" },
  { id: "professore", label: "Professore", icon: "👨‍🏫" },
  { id: "atleta", label: "Atleta", icon: "🏃" },
  { id: "boomer", label: "Boomer >50 anni", icon: "👴" },
  { id: "vecchietto", label: "Vecchietto >75 anni", icon: "🧓" }
];

export function categoryIcon(catId) {
  const c = USER_CATEGORIES.find(x => x.id === catId);
  return c ? c.icon : "👤";
}

export function categoryLabel(catId) {
  const c = USER_CATEGORIES.find(x => x.id === catId);
  return c ? c.label : "Utente";
}

export function getBubbleAgeStage(createdAt) {
  if (!createdAt) return 0;
  const ms = Date.now() - new Date(createdAt).getTime();
  const hours = ms / (1000 * 60 * 60);
  if (hours >= 48) return 8; // Scaduta / morta dopo 48 ore
  return Math.min(7, Math.floor(hours / 6)); // 8 stadi da 6 ore (0 a 7)
}

export function getBubbleRemainingHours(createdAt) {
  if (!createdAt) return 48;
  const ms = Date.now() - new Date(createdAt).getTime();
  const hours = ms / (1000 * 60 * 60);
  return Math.max(0, Math.round(48 - hours));
}

export const KLIPY_API_KEY = import.meta.env.VITE_KLIPY_API_KEY || "";
export const GIPHY_API_KEY = import.meta.env.VITE_GIPHY_API_KEY || "u6Z3iuUoSGTPbFAfPkFulENlurgQEADu";

export { getCtx, warmAudio, soundOn, BUCKET, MAX_UPLOAD_MB, RADII, BOLLE_COUNTRIES, countryFlag, STARTER_COUNT, MINI_THRESHOLD, miniStyle, AVATARS, avatarFor, shareBubbleWhatsApp, bubbleShareUrl, REACTIONS, ReactionIcon, PALETTES, cleanCaption, captionPosition, SURPRISES, STARTERS, readStarterPops, setSoundOn, playPop, playDust, ensureSession, setAuthSession, hash, bubbleLook, getPosition, positionErrorText, errorText, formatDistance, subscribeFrame };