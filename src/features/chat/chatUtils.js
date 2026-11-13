/* Risposte e inoltri partono dalla schermata della bolla come normali messaggi di chat, riconoscibili da un marcatore iniziale.
   - Risposta a una bolla:     [[bolla:reply|<id bolla>|<tipo>|<anteprima>]] testo   → in chat compare il riferimento alla bolla
   - Risposta a un messaggio:  [[quote|<id messaggio>|<autore>|<anteprima>]] testo   → citazione, come su WhatsApp/Instagram
   Tutto viaggia nel testo del messaggio: nessuna migrazione SQL. I messaggi vecchi (senza riferimento) restano validi. */
   export const CHAT_MARK_SHARE = "[[bolla:share]]";
   export const CHAT_MAX_BODY = 1000;
   export const CHAT_REPLY_RE = /^\[\[bolla:reply(?:\|([^\]]*))?\]\]\s*/;
   export const CHAT_QUOTE_RE = /^\[\[quote\|([^\]]*)\]\]\s*/;
   
   /* Sticker rimossi dalla chat. Questi simboli restano solo per non rompere import vecchi (es. ChatMessage.jsx):
      i messaggi sticker già inviati vengono mostrati come semplice testo segnaposto. */
   export const CHAT_STICKER_RE = /^\[\[sticker\|([^\]]*)\]\]\s*$/;
   export const STICKER_PATH_RE = /^[0-9a-f-]{36}\/st-[a-zA-Z0-9._-]+$/;
   export const MAX_STICKERS_LIBRARY = 0;
   export const stickerUrl = () => null;
   
   export const chatField = (value, max = 60) =>
     String(value ?? "").replace(/[[\]|\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
   
   export function makeBubbleReplyMark(bubble) {
     const id = chatField(bubble?.id, 64);
     if (!id) return "[[bolla:reply]]";
     const type = bubble?.type === "video" ? "video" : bubble?.type === "image" ? "image" : "other";
     const label = type === "video" ? "Video" : type === "image" ? "Foto" : "Bolla";
     return `[[bolla:reply|${id}|${type}|${chatField(bubble?.caption, 50) || label}]]`;
   }
   
   export function makeQuoteMark(ref) {
     return `[[quote|${chatField(ref?.id, 20)}|${chatField(ref?.from, 32)}|${chatField(ref?.snippet, 60)}]] `;
   }
   
   export function parseChatBody(body) {
     let raw = String(body || "");
     let quote = null;
     if (CHAT_STICKER_RE.test(raw)) return { kind: "plain", text: "🎟️ Sticker non più disponibile", quote: null, bubble: null };
     const q = raw.match(CHAT_QUOTE_RE);
     if (q) {
       const [id = "", from = "", ...rest] = q[1].split("|");
       quote = { id, from, snippet: rest.join("|") };
       raw = raw.slice(q[0].length);
     }
     const r = raw.match(CHAT_REPLY_RE);
     if (r) {
       const [id = "", type = "other", ...rest] = String(r[1] || "").split("|");
       return { kind: "reply", text: raw.slice(r[0].length).trim(), quote, bubble: id ? { id, type, snippet: rest.join("|") } : null };
     }
     if (raw.startsWith(CHAT_MARK_SHARE)) return { kind: "share", text: raw.slice(CHAT_MARK_SHARE.length).trim(), quote, bubble: null };
     return { kind: "plain", text: raw, quote, bubble: null };
   }
   
   export function chatPreview(body) {
     const { kind, text, quote } = parseChatBody(body);
     return kind === "reply" ? `↩ ${text}` : kind === "share" ? "🫧 Bolla inoltrata" : quote ? `↩ ${text}` : text;
   }
   
   export function chatQuoteSnippet(body) {
     const { kind, text } = parseChatBody(body);
     return kind === "share" ? "🫧 Bolla inoltrata" : (text || "Messaggio").slice(0, 60);
   }
   
   /* Colore stabile per ogni utente (lo stesso in ogni chat e su ogni dispositivo). */
   export function chatUserHue(name) {
     const str = String(name || "").toLowerCase();
     let h = 5381;
     for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
     return Math.abs(h * 137) % 360;
   }
   
   /* Chat nascoste: solo su questo dispositivo. Una chat nascosta ricompare da sola quando arriva un nuovo messaggio. */
   export function readHiddenChats(k) {
     try {
       const o = JSON.parse(localStorage.getItem(k) || "{}");
       return o && typeof o === "object" && !Array.isArray(o) ? o : {};
     } catch {
       return {};
     }
   }
   
   export function writeHiddenChats(k, o) {
     try {
       localStorage.setItem(k, JSON.stringify(o));
     } catch {
       /* storage non disponibile */
     }
   }
   
   export const achievementOwner = (me) => me?.user_id || me?.id || null;
   
   export function readChatNotifLog(me) {
     const id = achievementOwner(me);
     if (!id) return [];
     try {
       const rows = JSON.parse(localStorage.getItem(`bolle-chat-notif-log-v1-${id}`) || "[]");
       return Array.isArray(rows) ? rows : [];
     } catch {
       return [];
     }
   }
   
   export function appendChatNotifLog(me, items) {
     const id = achievementOwner(me);
     if (!id || !items.length) return;
     try {
       localStorage.setItem(`bolle-chat-notif-log-v1-${id}`, JSON.stringify([...items, ...readChatNotifLog(me)].slice(0, 40)));
     } catch {
       /* storage non disponibile */
     }
   }
   
   /* Intervalli di polling (ms) per chat, notifiche e tema */
   export const POLL = { chatBadge: 15000, chatOpen: 4000, chatList: 15000, notifications: 30000, theme: 600000 };
   
   /* Gestione della chat attualmente aperta */
   let ACTIVE_CHAT_KEY = null;
   
   export function getActiveChatKey() {
     return ACTIVE_CHAT_KEY;
   }
   
   export function setActiveChatKey(key) {
     ACTIVE_CHAT_KEY = key;
   }
   
   /* ================= Gruppi ================= */
   export const CHAT_GROUP_PREFIX = "[[bolle:group|";
   
   export function parseGroupMsgBody(body) {
     if (typeof body !== "string" || !body.startsWith(CHAT_GROUP_PREFIX)) return null;
     const end = body.indexOf("]] ");
     if (end === -1) return null;
     const meta = body.slice(CHAT_GROUP_PREFIX.length, end);
     const text = body.slice(end + 3);
     const [groupId = "", groupName = "", sender = "", admin = ""] = meta.split("|");
     return { groupId, groupName, sender, admin, text };
   }
   
   /* Gruppi sul server: righe di bolle_group_list / bolle_group_thread -> oggetti usati dalla UI. */
   export function mapGroupRow(r) {
     return {
       id: r.id,
       name: r.name || "Gruppo",
       isGroup: true,
       admin: r.admin || "",
       createdBy: r.admin || "",
       members: Array.isArray(r.members) ? r.members.filter(Boolean) : [],
       createdAt: r.created_at || r.last_at,
       lastBody: r.last_body || "",
       lastAt: r.last_at,
       lastMine: Boolean(r.last_mine),
       unread: Number(r.unread) || 0,
     };
   }
   
   export function mapGroupMsg(m) {
     return {
       id: m.id,
       sender: m.sender || "Sistema",
       body: m.body,
       created_at: m.created_at,
       mine: Boolean(m.mine),
       isSystem: Boolean(m.is_system),
     };
   }
   
   export function groupErrorText(err) {
     const m = String(err?.message || "");
     if (m.includes("group_not_admin")) return "Solo l'amministratore può aggiungere o rimuovere membri.";
     if (m.includes("group_not_member")) return "Non fai più parte di questo gruppo.";
     if (m.includes("group_already_member")) return "Questo utente fa già parte del gruppo.";
     if (m.includes("group_full")) return "Il gruppo ha raggiunto il massimo di 50 membri.";
     if (m.includes("group_no_members")) return "Nessuno degli utenti indicati può essere aggiunto (non esistono o ti hanno bloccato).";
     if (m.includes("group_invalid_name")) return "Il nome del gruppo deve avere da 1 a 40 caratteri.";
     if (m.includes("group_cannot_remove_admin")) return "Non puoi rimuovere l'amministratore.";
     if (m.includes("chat_blocked")) return "Non puoi aggiungere questo utente: uno dei due ha bloccato l'altro.";
     if (m.includes("user_not_found")) return "Utente non trovato.";
     if (m.includes("chat_rate_limited")) return "Troppe azioni ravvicinate: attendi un minuto.";
     if (/bolle_group_|does not exist|schema cache/i.test(m)) return "I gruppi non sono ancora attivi sul server (manca la migrazione bolle_groups.sql).";
     return "Operazione non riuscita. Riprova.";
   }

/* ================= Date in stile WhatsApp ================= */
const _d = (v) => { const d = new Date(v); return Number.isNaN(d.getTime()) ? null : d; };
export const dayKey = (v) => { const d = _d(v); return d ? `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` : ""; };
const _startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
const _daysAgo = (d) => Math.round((_startOfDay(new Date()) - _startOfDay(d)) / 86400000);

/* Orario dentro la bolla: 14:59 */
export function formatClock(v) {
  const d = _d(v);
  return d ? d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }) : "";
}

/* Elenco chat: oggi -> 14:59, ieri -> "Ieri", ultima settimana -> "venerdì", oltre -> 11/11/2026 */
export function formatThreadTime(v) {
  const d = _d(v);
  if (!d) return "";
  const n = _daysAgo(d);
  if (n <= 0) return formatClock(d);
  if (n === 1) return "Ieri";
  if (n < 7) return d.toLocaleDateString("it-IT", { weekday: "long" });
  return d.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/* Separatore di giorno dentro la conversazione */
export function formatDayLabel(v) {
  const d = _d(v);
  if (!d) return "";
  const n = _daysAgo(d);
  if (n <= 0) return "Oggi";
  if (n === 1) return "Ieri";
  if (n < 7) { const w = d.toLocaleDateString("it-IT", { weekday: "long" }); return w.charAt(0).toUpperCase() + w.slice(1); }
  return d.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
}