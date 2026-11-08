import { SYSTEM_CATEGORIES, systemDayKey, buildDailySystemBubbles, readSystemPops, saveSystemPops, readCachedNews, loadDailyNews } from "./lib/systemBubbles.js";
import { rankDiscoveryBubbles, readDiscoverySignals, recordDiscoverySignal, discoveryEnabled } from "./lib/bolleDiscovery.js";
import SequentialFeed, { feedApi, makeBlurPreview } from "./lib/SequentialFeed.jsx";
import { OverlayStage, OverlayRail, OverlayTextField, OverlayLayer, TagPicker, blurFromFile } from "./lib/OverlayEditor.jsx";
import MediaEditor, { defaultEdit, bakeImage, hasPhotoEdits, videoEditPayload, sanitizeVideoEdit, isEditableImage, EditedVideo } from "./lib/MediaEditor.jsx";
import PublicProfile from "./lib/PublicProfile.jsx";
import AdminPortal from "./features/admin/AdminPortal.jsx";
import LeaderboardView from "./features/leaderboard/LeaderboardView.jsx";
import SettingsView from "./features/settings/SettingsView.jsx";
import LegalInfoView from "./features/settings/LegalInfoView.jsx";
import PersonalDataView from "./features/settings/PersonalDataView.jsx";
import { GoogleAccountBadge } from "./hooks/useGoogleAccount.js";
import { romeToday } from "./lib/geo.js";
import { layoutConstellation } from "./lib/constellationLayout.js";
import "./styles/bolle.css";
import "./styles/bolle-polish.css";
import { nearbyPairs } from "./lib/spatialPairs.js";
import { applyMagneticAttraction } from "./lib/magneticForces.js";
import { magneticPriority, applyDiscoveryDrift } from "./lib/discoveryMotion.js";
import { neighborhoodMagnetism } from "./lib/localMagnetism.js";
import { getCtx, warmAudio, soundOn, supabase, BUCKET, MAX_UPLOAD_MB, RADII, BOLLE_COUNTRIES, countryFlag, STARTER_COUNT, MINI_THRESHOLD, miniStyle, AVATARS, avatarFor, shareBubbleWhatsApp, bubbleShareUrl, REACTIONS, ReactionIcon, PALETTES, cleanCaption, captionPosition, SURPRISES, setSoundOn, playPop, playDust, ensureSession, setAuthSession, hash, bubbleLook, getPosition, positionErrorText, errorText, formatDistance, subscribeFrame, USER_CATEGORIES, categoryIcon, categoryLabel, getBubbleAgeStage, getBubbleRemainingHours, KLIPY_API_KEY, GIPHY_API_KEY } from "./lib/bolleCore.jsx";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Trash2, CircleUserRound, Circle, ChartColumn, Gift, Trophy, Settings, Hand, Droplets, Plus, VenetianMask, Heart, Smile, Eye, Sparkles, Frown, CalendarDays, CalendarRange, LockKeyhole, Award, Rocket, HeartHandshake, Waves, Zap, Medal, TrendingUp, TrendingDown, Minus, Orbit, Sprout, Volume2, KeyRound, Users, UserPlus, Activity, Gauge, RefreshCw, ShieldCheck, Bell, Share2, Camera, MessageCircle, Send as SendIcon, X as CloseIcon, MoreHorizontal as MoreIcon, EyeOff, Archive, ArchiveRestore, Star as StarIcon, Link2 as LinkIcon, ChevronsUpDown as ScrollIcon } from "lucide-react";


const BOLLE_THEME_DECOR = {"halloween": ["🦇", "🎃", "👻", "🕸️", "🧙\u200d♀️", "🕷️", "🌙", "💀"], "natale": ["🎄", "❄️", "🎁", "⭐", "🔔", "🦌", "🧣", "🍬"], "pasqua": ["🐣", "🥚", "🐰", "🌷", "🌼", "🦋", "🐇", "🌸"], "capodanno": ["🎆", "🎇", "✨", "🥂", "🎉", "⭐", "🎊", "🪩"], "estate": ["☀️", "🌴", "🍉", "🏖️", "🐚", "🌊", "🕶️", "🍍"], "primavera": ["🌸", "🌷", "🦋", "🌼", "🐝", "🌱", "🌺", "🍃"], "autunno": ["🍂", "🍁", "🌰", "🍄", "🦔", "🌾", "☕", "🍃"], "inverno": ["❄️", "☃️", "🌨️", "🧤", "⛸️", "🏔️", "🧣", "❄️"], "caldo": ["☀️", "🔥", "🌞", "🌵", "🍊", "🌅", "✨", "🌶️"], "freddo": ["🧊", "❄️", "💎", "🌬️", "🧣", "🌨️", "🧤", "🧊"], "orientale": ["🏮", "🌸", "🎋", "🪭", "⛩️", "🐉", "🍵", "🌙"], "universo": ["🪐", "🌟", "🌙", "☄️", "✨", "🚀", "🌌", "⭐"], "bolle": ["🫧", "🫧", "✨", "💧", "🫧", "💠", "🫧", "✨"], "natura": ["🌿", "🍀", "🌳", "🦋", "🌱", "🌻", "🍃", "🌼"]};
const BOLLE_THEMES = [{"id": "halloween", "label": "🎃 Halloween"}, {"id": "natale", "label": "🎄 Natale"}, {"id": "pasqua", "label": "🐣 Pasqua"}, {"id": "capodanno", "label": "🎆 Capodanno"}, {"id": "estate", "label": "☀️ Estate"}, {"id": "primavera", "label": "🌷 Primavera"}, {"id": "autunno", "label": "🍂 Autunno"}, {"id": "inverno", "label": "❄️ Inverno"}, {"id": "caldo", "label": "🔥 Caldo"}, {"id": "freddo", "label": "🧊 Freddo"}, {"id": "orientale", "label": "🏮 Orientale"}, {"id": "universo", "label": "🌌 Universo"}, {"id": "bolle", "label": "🫧 Bolle"}, {"id": "natura", "label": "🌿 Natura"}];
const NOTIFICATION_CATEGORIES = [
  { key: "reactions", label: "Mi piace e reazioni", kinds: ["reaction"] },
  { key: "messages", label: "Messaggi e inoltri", kinds: ["bubble_reply", "bubble_share", "group_added", "chat_message", "group_message"] },
  { key: "new_bubbles", label: "Nuove bolle", kinds: ["favorite_post"] },
  { key: "polls", label: "Sondaggi", kinds: ["poll_vote"] },
  { key: "answers", label: "Risposte", kinds: ["question_answer"] },
  { key: "favorites", label: "Preferiti", kinds: ["favorite_added", "favorite_removed", "favorite_rejected", "favorite_added_decided", "favorite_accepted"] },
  { key: "tags", label: "Tag", kinds: ["bubble_tag", "bubble_tag_removed"] },
  { key: "gifts", label: "Regali", kinds: ["gift_opened"] },
  { key: "achievements", label: "Traguardi", kinds: ["achievement"] },
];
const DEFAULT_NOTIFICATION_PREFS = Object.fromEntries(NOTIFICATION_CATEGORIES.map(c => [c.key, true]));
function notificationCategory(kind) { return NOTIFICATION_CATEGORIES.find(c => c.kinds.includes(kind))?.key || "other"; }
// Un evento di tag (RPC bolle_my_tag_notifications) diventa una notifica. Solo "tagged" porta alla bolla.
function tagNotificationItem(t) {
  const tagged = t.kind === "tagged";
  return {
    id: `tag-${t.bubble_id}-${t.event_at}`, // stabile fra un controllo e l'altro: serve a non ripetere il banner
    kind: tagged ? "bubble_tag" : "bubble_tag_removed",
    title: tagged ? `@${t.other_username} ti ha taggato in una bolla` : `@${t.other_username} ha rimosso il tag dalla tua bolla`,
    body: tagged ? "Tocca per aprire la bolla" : "",
    created_at: t.event_at,
    is_read: Boolean(t.seen),
    bubble_id: tagged ? t.bubble_id : null,
    tag_username: t.other_username,
  };
}
/* Notifiche di gruppo: il gruppo può arrivare in campi diversi a seconda della funzione SQL; la riga è sempre apribile. */
function notifGroupId(n) {
  const direct = n?.group_id ?? n?.data?.group_id ?? n?.payload?.group_id ?? n?.metadata?.group_id;
  if (direct != null && direct !== "") return direct;
  if (n?.kind === "group_added") return n?.ref_id ?? null;
  return null;
}
const notifOpenable = (n) => Boolean(n && (n.bubble_id || n.chat_username || n.kind === "group_added" || n.kind === "group_message" || notifGroupId(n)));
function readNotificationPrefs(uid) {
  try { return { ...DEFAULT_NOTIFICATION_PREFS, ...JSON.parse(localStorage.getItem(`bolle-notification-prefs-v1-${uid || "guest"}`) || "{}") }; }
  catch { return { ...DEFAULT_NOTIFICATION_PREFS }; }
}
/* Traguardi: baseline locale per utente. Il primo controllo registra i traguardi già raggiunti senza notificarli. */
const achievementOwner = (me) => me?.user_id || me?.id || null;
function readAchievementLog(me) {
  const id = achievementOwner(me);
  if (!id) return [];
  try { const rows = JSON.parse(localStorage.getItem(`bolle-achievement-log-v1-${id}`) || "[]"); return Array.isArray(rows) ? rows : []; } catch { return []; }
}
function appendAchievementLog(me, items) {
  const id = achievementOwner(me);
  if (!id || !items.length) return;
  try { localStorage.setItem(`bolle-achievement-log-v1-${id}`, JSON.stringify([...items, ...readAchievementLog(me)].slice(0, 40))); } catch { /* storage non disponibile */ }
}
/* Risposte e inoltri partono dalla schermata della bolla come normali messaggi di chat, riconoscibili da un marcatore iniziale.
   - Risposta a una bolla:     [[bolla:reply|<id bolla>|<tipo>|<anteprima>]] testo   → in chat compare il riferimento alla bolla
   - Risposta a un messaggio:  [[quote|<id messaggio>|<autore>|<anteprima>]] testo   → citazione, come su WhatsApp/Instagram
   Tutto viaggia nel testo del messaggio: nessuna migrazione SQL. I messaggi vecchi (senza riferimento) restano validi. */
const CHAT_MARK_SHARE = "[[bolla:share]]";
const CHAT_MAX_BODY = 1000;
const CHAT_REPLY_RE = /^\[\[bolla:reply(?:\|([^\]]*))?\]\]\s*/;
const CHAT_QUOTE_RE = /^\[\[quote\|([^\]]*)\]\]\s*/;
/* Sticker: immagini (WebP/PNG, come quelli di WhatsApp) importate nella propria libreria e inviate come [[sticker|<percorso>]]. */
const CHAT_STICKER_RE = /^\[\[sticker\|([^\]]*)\]\]\s*$/;
const STICKER_PATH_RE = /^[0-9a-f-]{36}\/st-[a-zA-Z0-9._-]+$/;
const MAX_STICKERS_LIBRARY = 60;
const stickerUrl = (path) => (STICKER_PATH_RE.test(path || "") ? supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl : null);
const chatField = (value, max = 60) => String(value ?? "").replace(/[\[\]|\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
function makeBubbleReplyMark(bubble) {
  const id = chatField(bubble?.id, 64);
  if (!id) return "[[bolla:reply]]";
  const type = bubble?.type === "video" ? "video" : bubble?.type === "image" ? "image" : "other";
  const label = type === "video" ? "Video" : type === "image" ? "Foto" : "Bolla";
  return `[[bolla:reply|${id}|${type}|${chatField(bubble?.caption, 50) || label}]]`;
}
function makeQuoteMark(ref) {
  return `[[quote|${chatField(ref?.id, 20)}|${chatField(ref?.from, 32)}|${chatField(ref?.snippet, 60)}]] `;
}
function parseChatBody(body) {
  let raw = String(body || "");
  let quote = null;
  const st = raw.match(CHAT_STICKER_RE);
  if (st) return { kind: "sticker", text: "", quote: null, bubble: null, sticker: st[1] };
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
function chatPreview(body) {
  const { kind, text, quote } = parseChatBody(body);
  if (kind === "sticker") return "🎟️ Sticker";
  return kind === "reply" ? `↩ ${text}` : kind === "share" ? "🫧 Bolla inoltrata" : quote ? `↩ ${text}` : text;
}
function chatQuoteSnippet(body) {
  const { kind, text } = parseChatBody(body);
  return kind === "share" ? "🫧 Bolla inoltrata" : kind === "sticker" ? "🎟️ Sticker" : (text || "Messaggio").slice(0, 60);
}
function openUserProfile(username) {
  const u = String(username || "").replace(/^@/, "");
  if (u) window.dispatchEvent(new CustomEvent("bolle:open-profile", { detail: { username: u } }));
}
/* Testo con gli @username trasformati in link al profilo */
function UserLinkText({ text }) {
  const parts = String(text ?? "").split(/(@[A-Za-z0-9_]{3,20})/g);
  return <>{parts.map((p, i) => /^@[A-Za-z0-9_]{3,20}$/.test(p)
    ? <button key={i} type="button" className="bl-user-link" onClick={(e) => { e.stopPropagation(); openUserProfile(p); }} onKeyDown={(e) => e.stopPropagation()}>{p}</button>
    : <span key={i}>{p}</span>)}</>;
}
function ChatBody({ body, mine, meName, peerName, onOpenBubble, onJumpTo }) {
  const { kind, text, quote, bubble, sticker } = parseChatBody(body);
  if (kind === "sticker") {
    const src = stickerUrl(sticker);
    return src ? <img className="bl-chat-sticker" src={src} alt="Sticker" loading="lazy" draggable="false" /> : <p>🎟️ Sticker</p>;
  }
  const who =(name) => (String(name || "").toLowerCase() === String(meName || "").toLowerCase() ? "Tu" : `@${name}`);
  const quoteEl = quote ? <button type="button" className="bl-chat-ref bl-chat-quote" onClick={() => onJumpTo?.(quote.id)} aria-label={`Vai al messaggio originale di ${who(quote.from)}`}><span className="bl-chat-ref-copy"><b>{who(quote.from)}</b><small>{quote.snippet || "Messaggio"}</small></span></button> : null;
  if (kind === "plain") return <>{quoteEl}<p>{text}</p></>;
  if (kind === "reply") {
    if (!bubble) return <>{quoteEl}<span className="bl-chat-tag">{mine ? "↩ Risposta a una bolla" : "↩ Risposta alla tua bolla"}</span><p>{text}</p></>;
    const icon = bubble.type === "video" ? "🎬" : bubble.type === "image" ? "📷" : "🫧";
    const canOpen = !mine; // la bolla è mia solo quando è l'altro a rispondere
    return <>
      <button type="button" className="bl-chat-ref bl-chat-bubble-ref" disabled={!canOpen} onClick={() => canOpen && onOpenBubble?.(bubble)} aria-label={canOpen ? "Apri la bolla a cui ha risposto" : "Bolla a cui hai risposto"}>
        <span className="bl-chat-ref-ico" aria-hidden="true">{icon}</span>
        <span className="bl-chat-ref-copy"><b>{mine ? `Risposta alla bolla di @${peerName}` : "Risposta alla tua bolla"}</b><small>{bubble.snippet}</small></span>
        {canOpen && <em aria-hidden="true">Apri</em>}
      </button>
      {quoteEl}<p>{text}</p>
    </>;
  }
  const link = text.match(/https?:\/\/\S+/)?.[0];
  const note = text.replace(/https?:\/\/\S+/, "").trim();
  return <>{quoteEl}<span className="bl-chat-tag">🫧 Bolla inoltrata</span><p>{note} {link && <a href={link} target="_blank" rel="noopener noreferrer">Apri su Bolle</a>}</p></>;
}
/* Singolo messaggio: scorrimento verso destra (touch) o tasto ↩ (desktop) per rispondere citando il messaggio. */
/* Colore stabile per ogni utente (lo stesso in ogni chat e su ogni dispositivo). */
function chatUserHue(name) {
  const str = String(name || "").toLowerCase();
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return Math.abs(h * 137) % 360;
}
/* Riga scorrevole: trascinando verso sinistra (dito o mouse) compaiono le azioni a destra;
   tenendo premuto (o col tasto destro) si apre il menu rapido tramite onLongPress. */
const SWIPE_W = 176;
function SwipeRow({ open, onOpenChange, actions, children, label, onLongPress }) {
  const [off, setOff] = useState(null); // offset durante il trascinamento (null = a riposo)
  const [pressing, setPressing] = useState(false);
  const offRef = useRef(null);
  const st = useRef(null);
  const moved = useRef(false);
  const lp = useRef(null);
  const lastLong = useRef(0);
  const rootRef = useRef(null);
  useEffect(() => () => clearTimeout(lp.current), []);
  const base = open ? -SWIPE_W : 0;
  const x = off ?? base;
  const inActions = (e) => Boolean(e.target?.closest?.(".bl-swipe-actions"));
  function fireLong() {
    const s = st.current;
    if (!s || s.lock !== null) return;
    s.lock = "lp"; moved.current = true; lastLong.current = Date.now();
    setPressing(false);
    try { navigator.vibrate?.(14); } catch { /* vibrazione non disponibile */ }
    onLongPress?.(rootRef.current?.getBoundingClientRect());
  }
  function onPointerDown(e) {
    if (inActions(e)) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    st.current = { x: e.clientX, y: e.clientY, lock: null, id: e.pointerId };
    moved.current = false;
    clearTimeout(lp.current);
    if (onLongPress && !open) { setPressing(true); lp.current = setTimeout(fireLong, 430); }
  }
  function onPointerMove(e) {
    const s = st.current;
    if (!s || s.id !== e.pointerId || s.lock === "lp") return;
    const dx = e.clientX - s.x, dy = e.clientY - s.y;
    if (s.lock === null) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      clearTimeout(lp.current); setPressing(false);
      s.lock = Math.abs(dx) > Math.abs(dy) * 1.2 ? "x" : "y";
      if (s.lock === "x") { try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* cattura non disponibile */ } }
    }
    if (s.lock !== "x") return;
    moved.current = true;
    const next = Math.max(-SWIPE_W - 18, Math.min(0, base + dx));
    offRef.current = next;
    setOff(next);
  }
  function finish(cancelled) {
    clearTimeout(lp.current); setPressing(false);
    const s = st.current; st.current = null;
    if (!s || s.lock !== "x") return;
    const cur = offRef.current ?? base;
    offRef.current = null;
    setOff(null);
    onOpenChange(cancelled ? open : cur < -SWIPE_W / 2);
  }
  // I tocchi sui pulsanti delle azioni NON vanno intercettati: prima venivano bloccati qui e non succedeva nulla.
  function onClickCapture(e) {
    if (inActions(e)) return;
    if (moved.current) { e.preventDefault(); e.stopPropagation(); moved.current = false; return; }
    if (open) { e.preventDefault(); e.stopPropagation(); onOpenChange(false); }
  }
  function onContextMenu(e) {
    e.preventDefault();
    if (!onLongPress || inActions(e) || Date.now() - lastLong.current < 900) return;
    clearTimeout(lp.current); setPressing(false);
    moved.current = true; lastLong.current = Date.now();
    onLongPress(rootRef.current?.getBoundingClientRect());
  }
  function onKeyDown(e) {
    if (e.key === "ArrowLeft") { e.preventDefault(); onOpenChange(true); }
    else if ((e.key === "ArrowRight" || e.key === "Escape") && open) { e.preventDefault(); onOpenChange(false); }
  }
  return <div ref={rootRef} className={`bl-swipe ${open ? "is-open" : ""} ${off !== null ? "is-dragging" : ""} ${pressing ? "is-pressing" : ""}`}>
    <div className="bl-swipe-track" style={{ transform: `translateX(${x}px)` }}
      onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={() => finish(false)} onPointerCancel={() => finish(true)}
      onClickCapture={onClickCapture} onKeyDown={onKeyDown} onContextMenu={onContextMenu}>
      <div className="bl-swipe-front">{children}</div>
      <div className="bl-swipe-actions" role="group" aria-label={label || "Azioni"} aria-hidden={!open}>
        {actions.map(a => <button key={a.key} type="button" className={`bl-swipe-btn ${a.className || ""}`} tabIndex={open ? 0 : -1} onClick={a.onClick} disabled={a.disabled}>{a.icon}<span>{a.label}</span></button>)}
      </div>
    </div>
  </div>;
}

/* Chat nascoste: solo su questo dispositivo. Una chat nascosta ricompare da sola quando arriva un nuovo messaggio. */
function readHiddenChats(k) { try { const o = JSON.parse(localStorage.getItem(k) || "{}"); return o && typeof o === "object" && !Array.isArray(o) ? o : {}; } catch { return {}; } }
function writeHiddenChats(k, o) { try { localStorage.setItem(k, JSON.stringify(o)); } catch { /* storage non disponibile */ } }

function ChatMessage({ m, highlighted, meName, peerName, onReply, onOpenBubble, onJumpTo, isGroup, avatar }) {
  const [dx, setDx] = useState(0);
  const drag = useRef(null);
  const TRIGGER = 52, MAX = 78;
  function onTouchStart(e) { const t = e.touches[0]; drag.current = { x: t.clientX, y: t.clientY, lock: null, fired: false }; }
  function onTouchMove(e) {
    const d = drag.current; if (!d) return;
    const t = e.touches[0], ddx = t.clientX - d.x, ddy = t.clientY - d.y;
    if (d.lock === null) {
      if (Math.abs(ddx) < 8 && Math.abs(ddy) < 8) return;
      d.lock = ddx > 0 && Math.abs(ddx) > Math.abs(ddy) * 1.4 ? "x" : "y";
    }
    if (d.lock !== "x") return;
    e.stopPropagation();
    const next = Math.min(MAX, Math.max(0, ddx) * 0.7);
    setDx(next);
    if (next >= TRIGGER && !d.fired) { d.fired = true; try { navigator.vibrate?.(12); } catch { /* vibrazione non disponibile */ } }
  }
  function onTouchEnd() {
    const d = drag.current; drag.current = null;
    if (d?.lock === "x" && d.fired) onReply(m);
    setDx(0);
  }
  const senderDisplay = m.sender || m.from || peerName;
  if (m.isSystem) return <div className="bl-msg-system" data-mid={String(m.id)}>{m.body}</div>;
  const authorName = m.mine ? (meName || "") : senderDisplay;
  const hue = chatUserHue(authorName);
  return <div className={`bl-msg-row bl-msg-colored ${m.mine ? "mine" : ""} ${highlighted ? "hl" : ""}`} style={{ "--bl-msg-h": hue }} data-mid={String(m.id)} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} onTouchCancel={onTouchEnd}>
    <span className="bl-msg-swipe-hint" aria-hidden="true" style={{ opacity: Math.min(1, dx / TRIGGER), transform: `scale(${0.6 + Math.min(0.4, dx / 130)})` }}>↩</span>
    {!m.mine && <span className="bl-msg-avatar" title={`@${authorName}`} aria-hidden="true"><AvatarImage avatar={avatar} /></span>}
    <div className={`bl-message-bubble ${m.mine ? "mine" : ""} ${String(m.body || "").startsWith("[[sticker|") ? "is-sticker" : ""}`} style={dx ? { transform: `translateX(${dx}px)`, transition: "none" } : undefined}>
      {isGroup && !m.mine && senderDisplay && <span className="bl-msg-sender-name">@{senderDisplay}</span>}
      <ChatBody body={m.body} mine={m.mine} meName={meName} peerName={senderDisplay} onOpenBubble={onOpenBubble} onJumpTo={onJumpTo} />
      <small>{new Date(m.created_at).toLocaleString("it-IT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</small>
    </div>
    {m.mine && <span className="bl-msg-avatar bl-msg-avatar--mine" title="Tu" aria-hidden="true"><AvatarImage avatar={avatar} /></span>}
    <button type="button" className="bl-msg-reply-btn" onClick={() => onReply(m)} aria-label="Rispondi a questo messaggio" title="Rispondi">↩</button>
  </div>;
}
/* Notifiche di messaggio: sul dispositivo, accanto a quelle dei traguardi. La chat resta la fonte (nessuna migrazione SQL necessaria). */
function readChatNotifLog(me) {
  const id = achievementOwner(me);
  if (!id) return [];
  try { const rows = JSON.parse(localStorage.getItem(`bolle-chat-notif-log-v1-${id}`) || "[]"); return Array.isArray(rows) ? rows : []; } catch { return []; }
}
function appendChatNotifLog(me, items) {
  const id = achievementOwner(me);
  if (!id || !items.length) return;
  try { localStorage.setItem(`bolle-chat-notif-log-v1-${id}`, JSON.stringify([...items, ...readChatNotifLog(me)].slice(0, 40))); } catch { /* storage non disponibile */ }
}
/* Chat attualmente aperta (impostata da MessagesView): niente banner per i messaggi di una chat che sto già guardando. */
let ACTIVE_CHAT_KEY = null;
const GUEST_POPS_PER_KIND = 3;
/* ---------- Capsula del tempo: conto alla rovescia visibile a tutti ---------- */
// Scarto tra orologio del dispositivo e orologio del server (aggiornato a ogni caricamento del feed).
let capsuleClockSkewMs = 0;
const capsuleNow = () => Date.now() + capsuleClockSkewMs;
function capsuleRemainingMs(bubble) {
  const t = Date.parse(bubble?.opens_at || "");
  return Number.isFinite(t) ? Math.max(0, t - capsuleNow()) : 0;
}
/* Recupera la categoria (bar, dj, ristorante…) delle bolle del feed quando il feed non la include già. */
async function fetchBubbleCategories(ids) {
  const out = {};
  const unique = [...new Set((ids || []).filter(id => id && !String(id).startsWith("starter-")))];
  for (let i = 0; i < unique.length; i += 200) {
    const chunk = unique.slice(i, i + 200);
    try {
      const { data, error } = await supabase.rpc("bolle_feed_categories", { p_ids: chunk });
      if (!error && Array.isArray(data)) { data.forEach(r => { if (r?.category) out[r.bubble_id] = r.category; }); continue; }
      if (error) console.warn("[Bolle] bolle_feed_categories:", error.message);
    } catch { /* funzione non ancora creata: si prova la lettura diretta */ }
    try {
      const { data, error } = await supabase.from("bubbles").select("id,category").in("id", chunk);
      if (error) console.warn("[Bolle] Categorie non leggibili dalla tabella bubbles:", error.message);
      else if (Array.isArray(data)) data.forEach(r => { if (r?.category) out[r.id] = r.category; });
    } catch { /* nessuna fonte disponibile: le bolle restano senza tema */ }
  }
  return out;
}
// Le capsule "nascono" quando si aprono: l'invecchiamento (6h/48h) parte da lì, non dalla creazione.
const bubbleAgeFrom = (b) => b?.opens_at || b?.created_at;
function formatCountdown(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return [Math.floor(total / 3600), Math.floor((total % 3600) / 60), total % 60].map(n => String(n).padStart(2, "0")).join(":");
}
// Un solo setInterval condiviso da tutte le bolle con capsula.
const secondListeners = new Set();
let secondTimer = 0;
function subscribeSecond(fn) {
  secondListeners.add(fn);
  if (!secondTimer) secondTimer = setInterval(() => secondListeners.forEach(f => f()), 1000);
  return () => {
    secondListeners.delete(fn);
    if (!secondListeners.size && secondTimer) { clearInterval(secondTimer); secondTimer = 0; }
  };
}
function useCapsuleRemaining(bubble) {
  const opensAt = bubble?.opens_at;
  const [ms, setMs] = useState(() => capsuleRemainingMs(bubble));
  useEffect(() => {
    const first = capsuleRemainingMs({ opens_at: opensAt });
    setMs(first);
    if (first <= 0) return undefined;
    const unsubscribe = subscribeSecond(() => {
      const left = capsuleRemainingMs({ opens_at: opensAt });
      setMs(left);
      if (left <= 0) unsubscribe();
    });
    return unsubscribe;
  }, [opensAt]);
  return ms;
}
// Durate possibili della capsula, in minuti (devono coincidere con le opzioni del menu di creazione).
const CAPSULE_DURATIONS_MIN = [10, 30, 60, 360, 1440, 2880];
// Durata totale della capsula: apertura meno creazione; se manca la data di creazione si usa la durata standard più vicina.
function capsuleTotalMs(bubble, remainingMs) {
  const opens = Date.parse(bubble?.opens_at || ""), created = Date.parse(bubble?.created_at || "");
  const measured = Number.isFinite(opens) && Number.isFinite(created) ? opens - created : 0;
  const snapped = CAPSULE_DURATIONS_MIN.map(m => m * 60000).find(ms => ms >= remainingMs - 5000) || remainingMs;
  if (measured > 0) {
    // Tollerance: la creazione e l'impostazione della capsula distano pochi secondi.
    const near = CAPSULE_DURATIONS_MIN.map(m => m * 60000).find(ms => Math.abs(ms - measured) <= 90000);
    return Math.max(near || measured, remainingMs, 1);
  }
  return Math.max(snapped, remainingMs, 1);
}
// Anello attorno alla bolla: parte completo e si accorcia man mano che il tempo passa.
function CapsuleRing({ fraction }) {
  const f = Math.max(0, Math.min(1, fraction));
  return <svg className="bl-capsule-ring" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
    <circle className="bl-capsule-ring-track" cx="50" cy="50" r="47" />
    <circle className="bl-capsule-ring-line" cx="50" cy="50" r="47" pathLength="100" strokeDasharray={`${(f * 100).toFixed(2)} 100`} transform="rotate(-90 50 50)" />
  </svg>;
}
function CapsuleCountdown({ opensAt, username }) {
  const ms = useCapsuleRemaining({ opens_at: opensAt });
  return <div className="bl-capsule-view" role="timer" aria-live="off">
    <span className="bl-capsule-view-icon" aria-hidden="true">⏳</span>
    <small>Capsula del tempo{username ? ` di @${username}` : ""}</small>
    {ms > 0 ? <strong>{formatCountdown(ms)}</strong> : <strong className="open">Si è aperta!</strong>}
    <small>{ms > 0 ? "ore : minuti : secondi" : "Chiudi e scoppiala dal feed"}</small>
  </div>;
}
const AVATAR_BUCKET = "avatars";
function AvatarImage({ avatar, className = "" }) {
  const photo = typeof avatar === "string" && avatar.startsWith("photo:");
  const path = photo ? avatar.slice(6) : "";
  const url = photo && /^[0-9a-f-]{36}\/[a-zA-Z0-9._-]+$/.test(path)
    ? supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path).data.publicUrl : null;
  return url ? <img className={`bl-avatar-photo ${className}`} src={url} alt="Avatar" referrerPolicy="no-referrer" /> : <span aria-hidden="true">{photo ? "🫧" : (avatar || "🫧")}</span>;
}

// Telefono / schermo touch: meno bolle, meno particelle, meno frame.
/* Intervalli di polling (ms): più alti = meno egress. I controlli si fermano quando l'app è in background. */
const POLL = { chatBadge: 15000, chatOpen: 4000, chatList: 15000, notifications: 30000, theme: 600000 };
/* Cache degli URL firmati: lo stesso URL riusato permette al browser di servire le miniature dalla cache HTTP. */
const signedUrlCache = new Map();
async function cachedSignedUrl(path, ttl = 3600) {
  const hit = signedUrlCache.get(path);
  if (hit && hit.exp > Date.now()) return hit.url;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, ttl);
  if (error || !data?.signedUrl) return null;
  signedUrlCache.set(path, { url: data.signedUrl, exp: Date.now() + Math.max(60, ttl - 300) * 1000 });
  return data.signedUrl;
}
const IS_COARSE = typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches;
const INITIAL_FEED = IS_COARSE ? 9 : 12;
// Home a feed sequenziale (una bolla alla volta). Per tornare subito al vecchio campo di bolle: aggiungi ?feed=field all'indirizzo.
const SEQ_HOME_DEFAULT = !/[?&]feed=field\b/.test(window.location.search);
const seqApi = feedApi(supabase);

export default function App() {
  const [appearance, setAppearance] = useState(() => { try { return localStorage.getItem("bolle-appearance-v1") || "dark"; } catch { return "dark"; } });
  const [activeTheme, setActiveTheme] = useState("bolle");
  const [themeChoice, setThemeChoice] = useState(() => { try { return localStorage.getItem("bolle-theme-choice-v2") || "standard"; } catch { return "standard"; } });
  function updateThemeChoice(value) { setThemeChoice(value); try { localStorage.setItem("bolle-theme-choice-v2", value); } catch {} }
  function updateAppearance(value) { setAppearance(value); updateThemeChoice("standard"); try { localStorage.setItem("bolle-appearance-v1", value); } catch {} }
  const refreshTheme = useCallback(async () => {
    const { data, error } = await supabase.rpc("bolle_get_active_theme");
    if (!error && BOLLE_THEMES.some(t => t.id === data)) setActiveTheme(data);
  }, []);
  useEffect(() => { refreshTheme(); const id = setInterval(() => { if (!document.hidden) refreshTheme(); }, POLL.theme); const onFocus = () => refreshTheme(); const onChanged = () => refreshTheme(); window.addEventListener("focus", onFocus); window.addEventListener("bolle:theme-updated", onChanged); return () => {clearInterval(id);window.removeEventListener("focus",onFocus);window.removeEventListener("bolle:theme-updated",onChanged);}; }, [refreshTheme]);
  const themeClass = themeChoice === "special" ? `bl-special-theme bl-theme-${activeTheme}` : `bl-appearance-${appearance}`;
  const galaxyOn = true; // sfondo galattico in ogni aspetto: scuro, chiaro e temi speciali (ognuno con la sua tinta)
  const galaxyPalette = themeChoice === "special" ? activeTheme : appearance === "light" ? "light" : "standard";
  const [welcome, setWelcome] = useState(() => {
    try { return localStorage.getItem("bolle-onboarding-v1") !== "done"; } catch { return true; }
  });
  const [guestMode, setGuestMode] = useState(() => {
    try { return localStorage.getItem("bolle-guest-v1") === "yes"; } catch { return false; }
  });
  const [authPrompt, setAuthPrompt] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [googleRegistration, setGoogleRegistration] = useState(false);
  const [googleEmail, setGoogleEmail] = useState("");
  const [adminOpen, setAdminOpen] = useState(false);
  const [errorReport, setErrorReport] = useState(null);
  const [reportDetails, setReportDetails] = useState("");
  const [reportBusy, setReportBusy] = useState(false);
  const [reportThanks, setReportThanks] = useState(false);
  const [ready, setReady] = useState(false);
  const [fatal, setFatal] = useState(null);
  const [uid, setUid] = useState(null);
  const [me, setMe] = useState(null); // stato server: username, saldo, statistiche periodo
  const [scope, setScope] = useState("global");
  const [radius, setRadius] = useState(25);
  // Banner delle distanze: chiuso di default; si apre tenendo premuto su «Vicino a me»
  const [radiusOpen, setRadiusOpen] = useState(false);
  const [radiusAct, setRadiusAct] = useState(null); // distanza sotto il dito durante lo scorrimento
  const nearBtnRef = useRef(null), nearTimer = useRef(0), nearIgnore = useRef(false), nearDown = useRef(false);
  const [coords, setCoords] = useState(null);
  const [bubbles, setBubbles] = useState([]);
  const [feedVisibleLimit, setFeedVisibleLimit] = useState(INITIAL_FEED);
  const [bubbleCountries, setBubbleCountries] = useState({});
  const [bubblePrivacy, setBubblePrivacy] = useState({});
  const [favoriteAuthors, setFavoriteAuthors] = useState(() => new Set());
  const [authorFilter, setAuthorFilter] = useState("all"); // all | favorites | username
  const [authorMenuOpen, setAuthorMenuOpen] = useState(false);
  const [authorSearchQuery, setAuthorSearchQuery] = useState("");
  const [blockedUsers, setBlockedUsers] = useState(() => new Set());
  // Bolle di sistema (curiosità, aforismi, motivazione, notizie): cambiano ogni giorno e non consumano scoppi.
  const [dayKey, setDayKey] = useState(() => systemDayKey());
  const [systemNews, setSystemNews] = useState(() => readCachedNews().items);
  const [systemPops, setSystemPops] = useState(() => readSystemPops(systemDayKey()));
  const systemBubbles = useMemo(() => buildDailySystemBubbles(dayKey, systemNews), [dayKey, systemNews]);
  useEffect(() => {
    const check = () => setDayKey(prev => { const now = systemDayKey(); return now === prev ? prev : now; });
    const id = setInterval(check, 60000);
    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", check); window.removeEventListener("focus", check); };
  }, []);
  useEffect(() => {
    setSystemPops(readSystemPops(dayKey)); // a mezzanotte le bolle di ieri spariscono e arrivano quelle nuove
    let alive = true;
    loadDailyNews().then(items => { if (alive) setSystemNews(items); });
    return () => { alive = false; };
  }, [dayKey]);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [discoveryRevision, setDiscoveryRevision] = useState(0);
  const seqSession = useRef({ id: null }); // sessione di apertura corrente (ranking: cosa succede DOPO lo scoppio)
  const rememberDiscovery = useCallback((author, action) => {
    if (action !== "pop" && seqSession.current?.id) seqApi.interact(seqSession.current.id);
    if (!guestMode && uid && recordDiscoverySignal(uid, author, action)) setDiscoveryRevision(n => n + 1);
  }, [guestMode, uid]);
  const [pullDistance, setPullDistance] = useState(0);
  const [pullRefreshing, setPullRefreshing] = useState(false);
  const pullStart = useRef(null);
  const [avatarMap, setAvatarMap] = useState({});
  const [myAvatar, setMyAvatar] = useState("🫧");
  const [notificationPrefs, setNotificationPrefs] = useState(() => readNotificationPrefs(null));
  const [profileUser, setProfileUser] = useState(null); // profilo pubblico aperto: { username }
  useEffect(() => {
    const onOpen = (e) => {
      const u = String(e.detail?.username || "").replace(/^@/, "");
      if (!u) return;
      setViewer(null); // il viewer si chiude: tornando indietro si resta nel feed, alla stessa bolla
      setProfileUser({ username: u });
    };
    window.addEventListener("bolle:open-profile", onOpen);
    return () => window.removeEventListener("bolle:open-profile", onOpen);
  }, []);
  const [privacyPrefs, setPrivacyPrefs] = useState({show_username:true,show_nationality:true,allow_favorites:true});
  useEffect(() => { if (!uid || guestMode || !me?.registered) return; let live=true; supabase.rpc("bolle_get_my_privacy").then(({data,error})=>{if(live && !error && data) setPrivacyPrefs(data);}); return ()=>{live=false}; },[uid,guestMode,me?.registered]);
  async function changePrivacyPref(key, value) { const old=privacyPrefs; const next={...old,[key]:value}; setPrivacyPrefs(next); const {error}=await supabase.rpc("bolle_set_my_privacy",{p_show_username:next.show_username,p_show_nationality:next.show_nationality,p_allow_favorites:next.allow_favorites}); if(error){setPrivacyPrefs(old);notify(errorText(error));}else setRefreshKey(k=>k+1); }
  useEffect(() => { setNotificationPrefs(readNotificationPrefs(uid)); }, [uid]);
  function changeNotificationPref(key, enabled) {
    setNotificationPrefs(prev => {
      const next = { ...prev, [key]: enabled };
      try { localStorage.setItem(`bolle-notification-prefs-v1-${uid || "guest"}`, JSON.stringify(next)); } catch {}
      return next;
    });
  }
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const onChatRowsRef = useRef(null); // rilevatore di risposte/inoltri, definito più sotto
  const meRef = useRef(null); meRef.current = me;
  const notificationPrefsRef = useRef(notificationPrefs); notificationPrefsRef.current = notificationPrefs;
  // Il badge dei messaggi viene aggiornato a livello App, non dentro MessagesView:
  // così resta attivo anche quando la sezione Messaggi è chiusa e include le chat esistenti.
  useEffect(() => {
    if (!ready || !uid || guestMode || !me?.registered) {
      setUnreadChatCount(0);
      return undefined;
    }
    let cancelled = false;
    let running = false;
    let again = false; // un evento arrivato mentre un aggiornamento è in corso: si ripete subito dopo
    const refreshUnreadChats = async () => {
      if (cancelled || document.hidden) return;
      if (running) { again = true; return; }
      running = true;
      try {
        const { data, error } = await supabase.rpc("bolle_chat_conversations");
        if (!cancelled && !error && Array.isArray(data)) {
          let total = data.reduce((sum, row) => sum + Math.max(0, Number(row?.unread) || 0), 0);
          let groupRows = [];
          try {
            const { data: gRows, error: gErr } = await supabase.rpc("bolle_group_list");
            if (!gErr && Array.isArray(gRows)) { groupRows = gRows; total += gRows.reduce((sum, row) => sum + Math.max(0, Number(row?.unread) || 0), 0); }
          } catch { /* gruppi non ancora installati */ }
          setUnreadChatCount(total);
          onChatRowsRef.current?.(data, groupRows);
        }
      } catch (error) {
        console.warn("[Bolle] Aggiornamento contatore messaggi:", error);
      } finally {
        running = false;
        if (again && !cancelled) { again = false; void refreshUnreadChats(); }
      }
    };
    void refreshUnreadChats();
    const timer = window.setInterval(refreshUnreadChats, POLL.chatBadge);
    // Tempo reale: ogni messaggio in arrivo (1:1 o di gruppo) genera un evento per me (bolle_realtime.sql).
    // L'evento non contiene testo: avvisa soltanto la chat aperta e il contatore di rileggere.
    let eventTimer = null;
    let realtimeLive = false;
    const channel = supabase.channel(`bolle-chat-events-${uid}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "bolle_chat_events", filter: `recipient_id=eq.${uid}` }, (payload) => {
        window.clearTimeout(eventTimer);
        eventTimer = window.setTimeout(() => {
          void refreshUnreadChats();
          window.dispatchEvent(new CustomEvent("bolle:chat-event", { detail: payload?.new || null }));
        }, 100);
      })
      .subscribe((status, err) => {
        realtimeLive = status === "SUBSCRIBED";
        if (!realtimeLive && status !== "CLOSED") console.warn("[Bolle] Chat in tempo reale non attiva:", status, err?.message || "");
      });
    // Se il canale non si collega (SQL non eseguita, rete, ecc.) si controlla ogni 4 secondi invece che ogni 15.
    const fastTimer = window.setInterval(() => {
      if (realtimeLive || document.hidden) return;
      void refreshUnreadChats();
      window.dispatchEvent(new CustomEvent("bolle:chat-event", { detail: null }));
    }, 4000);
    const onFocus = () => void refreshUnreadChats();
    const onVisibility = () => { if (document.visibilityState === "visible") void refreshUnreadChats(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.clearTimeout(eventTimer);
      window.clearInterval(fastTimer);
      try { supabase.removeChannel(channel); } catch { /* canale già chiuso */ }
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [ready, uid, guestMode, me?.registered]);
  const [liveNotification, setLiveNotification] = useState(null);
  const notificationTimer = useRef(null);
  const notificationQueue = useRef([]);
  const seenNotificationIds = useRef(new Set());
  const notificationsInitialized = useRef(false);
  // Poll the existing authenticated notifications RPC while the app is foregrounded.
  // First response seeds the baseline: historical unread items must not trigger banners.
  useEffect(() => {
    seenNotificationIds.current.clear();
    notificationsInitialized.current = false;
    setLiveNotification(null);
    notificationQueue.current = [];
    if (!ready || !uid || guestMode) return;
    let cancelled = false;
    let running = false;
    const check = async () => {
      if (running || document.visibilityState !== "visible") return;
      running = true;
      try {
        const { data, error } = await supabase.rpc("bolle_my_notifications_v4");
        if (cancelled || error || !Array.isArray(data)) return;
        // I tag arrivano da un'RPC a parte: si uniscono qui per avere banner e contatore.
        let unseenTags = [];
        try {
          const { data: tg, error: tgError } = await supabase.rpc("bolle_my_tag_notifications");
          if (!tgError && Array.isArray(tg)) unseenTags = tg.filter(t => t?.kind === "tagged" && t.bubble_id && !t.seen).map(tagNotificationItem);
        } catch { /* SQL dei tag non ancora applicato */ }
        if (cancelled) return;
        const recent = [...data.filter(n => n?.id != null), ...unseenTags].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
        if (!notificationsInitialized.current) {
          recent.forEach(n => seenNotificationIds.current.add(String(n.id)));
          notificationsInitialized.current = true;
          return;
        }
        const fresh = recent.filter(n => !seenNotificationIds.current.has(String(n.id)) && notificationPrefs[notificationCategory(n.kind)] !== false);
        recent.forEach(n => seenNotificationIds.current.add(String(n.id)));
        if (fresh.length) {
          setUnreadNotifications(n => n + fresh.length);
          notificationQueue.current.push(...fresh.slice().reverse());
          setLiveNotification(current => current || notificationQueue.current.shift() || null);
        }
      } catch { /* La connessione può essere assente: ritentiamo al prossimo controllo. */ } finally { running = false; }
    };
    void check();
    const interval = setInterval(() => void check(), POLL.notifications);
    document.addEventListener("visibilitychange", check);
    return () => { cancelled = true; clearInterval(interval); document.removeEventListener("visibilitychange", check); };
  }, [ready, uid, guestMode, notificationPrefs]);
  useEffect(() => {
    clearTimeout(notificationTimer.current);
    if (liveNotification) notificationTimer.current = setTimeout(() => setLiveNotification(notificationQueue.current.shift() || null), 3000);
    return () => clearTimeout(notificationTimer.current);
  }, [liveNotification]);
  const dismissLiveNotification = useCallback(() => {
    setLiveNotification(notificationQueue.current.shift() || null);
  }, []);
  // Risposte e inoltri di bolle arrivano come messaggi: qui diventano notifiche (banner + elenco "Messaggi e inoltri").
  const seenChatEvents = useRef(null); // null = primo controllo: registra lo stato attuale senza notificare
  useEffect(() => { seenChatEvents.current = null; }, [uid]);
  useEffect(() => {
    onChatRowsRef.current = (rows, groupRows = []) => {
      const found = [];
      for (const row of rows) {
        if (!row || row.last_mine || !(Number(row.unread) > 0)) continue;
        if (parseGroupMsgBody(row.last_body)) continue; // vecchi segnali di gruppo
        if (ACTIVE_CHAT_KEY === `u:${String(row.username || "").toLowerCase()}`) continue; // chat già aperta
        found.push({ key: `${row.conversation_id || row.username}|${row.last_at}`, row, parsed: parseChatBody(row.last_body) });
      }
      for (const g of groupRows) {
        if (!g || g.last_mine || !(Number(g.unread) > 0)) continue;
        if (ACTIVE_CHAT_KEY === `g:${g.id}`) continue;
        found.push({ key: `g|${g.id}|${g.last_at}`, group: g });
      }
      if (seenChatEvents.current === null) { seenChatEvents.current = new Set(found.map(f => f.key)); return; }
      const fresh = found.filter(f => !seenChatEvents.current.has(f.key));
      fresh.forEach(f => seenChatEvents.current.add(f.key));
      if (!fresh.length) return;
      const items = fresh.map(({ key, row, parsed, group }) => {
        if (group) {
          const who = group.last_sender ? `@${group.last_sender}: ` : "";
          return { id: `chat-${key}`, kind: "group_message", group_id: group.id, group_name: group.name,
            title: `💬 ${group.name}`, body: `${who}${chatPreview(group.last_body)}`, created_at: group.last_at || new Date().toISOString(), is_read: true };
        }
        if (parsed.kind === "plain") {
          return { id: `chat-${key}`, kind: "chat_message", chat_username: row.username,
            title: `@${row.username} ti ha scritto`, body: chatPreview(row.last_body), created_at: row.last_at || new Date().toISOString(), is_read: true };
        }
        return {
          id: `chat-${key}`, kind: parsed.kind === "reply" ? "bubble_reply" : "bubble_share", chat_username: row.username,
          title: parsed.kind === "reply" ? `@${row.username} ha risposto alla tua bolla` : `@${row.username} ti ha inoltrato una bolla`,
          body: parsed.kind === "reply" ? (parsed.bubble?.snippet ? `🫧 «${parsed.bubble.snippet}» — ${parsed.text}` : parsed.text) : "Tocca per aprire la chat",
          created_at: row.last_at || new Date().toISOString(), is_read: true,
        };
      });
      appendChatNotifLog(meRef.current, items);
      if (notificationPrefsRef.current.messages === false) return;
      notificationQueue.current.push(...items);
      setLiveNotification(current => current || notificationQueue.current.shift() || null);
    };
  });
  // Traguardi sbloccati: controllo globale (non solo quando "Le mie statistiche" è aperta).
  // Si rilancia quando cambiano i contatori del profilo, quando arrivano nuove notifiche e al rientro nell'app.
  useEffect(() => {
    if (!ready || !uid || guestMode || !me?.registered) return;
    const owner = achievementOwner(me);
    if (!owner) return;
    const storeKey = `bolle-achievements-v1-${owner}`;
    (async () => {
      const { data, error } = await supabase.rpc("my_bubbles_media_dashboard");
      if (error || !Array.isArray(data)) return;
      const unlocked = buildMilestones(decorateEntries(data), me).filter(m => m.value >= m.target).map(m => m.name);
      let previous = null;
      try { const raw = localStorage.getItem(storeKey); previous = raw === null ? null : JSON.parse(raw); } catch { previous = null; }
      if (!Array.isArray(previous)) { try { localStorage.setItem(storeKey, JSON.stringify(unlocked)); } catch { /* ignora */ } return; }
      const fresh = unlocked.filter(name => !previous.includes(name));
      if (!fresh.length) return;
      // Lettura e scrittura sono sincrone: due controlli concorrenti non possono notificare due volte.
      try { localStorage.setItem(storeKey, JSON.stringify([...new Set([...previous, ...unlocked])])); } catch { /* ignora */ }
      const now = new Date().toISOString();
      const items = fresh.map(name => ({ id: `achievement-${name}-${now}`, kind: "achievement", achievement: true, title: "Traguardo sbloccato!", body: name, created_at: now, is_read: true }));
      appendAchievementLog(me, items);
      if (notificationPrefs.achievements === false) return;
      notificationQueue.current.push(...items);
      setLiveNotification(current => current || notificationQueue.current.shift() || null);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, uid, guestMode, me?.registered, me?.opens_total, me?.bubbles_count, me?.gifts_sent, unreadNotifications, refreshKey]);
  const [daily, setDaily] = useState(null);
  const [secretIds, setSecretIds] = useState(() => new Set());
  const [allSecretIds, setAllSecretIds] = useState(() => new Set());

  const [travelToken, setTravelToken] = useState(() => new URLSearchParams(window.location.search).get("travel"));
  const [travelOpen, setTravelOpen] = useState(false); // solo compatibilità con link ricevuti
  const [secretOnly, setSecretOnly] = useState(false);
  const [bursting, setBursting] = useState(() => new Set());
  const busy = useRef(false);
  const [viewer, setViewer] = useState(null);
  const [giftToken, setGiftToken] = useState(() => new URLSearchParams(window.location.search).get("gift"));
  const [giftState, setGiftState] = useState("ready");
  const [giftError, setGiftError] = useState("");
  const [reactionBusy, setReactionBusy] = useState(false);
  const [composing, setComposing] = useState(false); // true, oppure {mode, file?} se arriva dal ventaglio
  const fanFileRef = useRef(null);
  useEffect(() => installBollePhysics(), []); // fisica a molla e aptico leggero su tutti i pulsanti
  const fanPick = (id) => { setComposing({ mode: id }); /* la foto si sceglie nell'editor */ };
  const onFanFile = (e) => {
    const f = e.target.files?.[0]; e.target.value = "";
    if (!f) return;
    if (!/^(image|video)\//.test(f.type)) { notify("Scegli una foto o un video."); return; }
    if (f.size > MAX_UPLOAD_MB * 1024 * 1024) { notify(`Il file supera ${MAX_UPLOAD_MB} MB.`); return; }
    setComposing({ mode: "photo", file: f });
  };
  const [chainRootId, setChainRootId] = useState(null);
  const [chainInvite, setChainInvite] = useState(() => new URLSearchParams(window.location.search).get("chain") || null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [countPop, setCountPop] = useState(false); // fumetto vicino al contatore
  useEffect(() => { if (!countPop) return undefined; const t = setTimeout(() => setCountPop(false), 2800); const off = () => setCountPop(false); document.addEventListener("pointerdown", off); return () => { clearTimeout(t); document.removeEventListener("pointerdown", off); }; }, [countPop]);
  const [loginOpen, setLoginOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  // Il tutorial si avvia esclusivamente al completamento di una nuova registrazione.
  // Non viene avviato durante login, refresh, accesso ospite o cambio dispositivo.
  const closeTutorial = () => {
    try { localStorage.setItem(`bolle-tutorial-v1-${uid || "guest"}`, "done"); } catch { /* Private mode */ }
    setTutorialOpen(false);
  };
  const returnToProfileView = useRef(null);
  const viewerSeenForReturn = useRef(false);
  const [profileView, setProfileView] = useState(null); // null | menu | bubbles | stats | gift | leaderboard | settings | messages
  const [initialChat, setInitialChat] = useState(null);
  const profileViewRef = useRef(null); profileViewRef.current = profileView;
  const messagesOrigin = useRef(null); // da dove si è aperta la chat: { view, profile }
  function openMessages(initial = null, origin) {
    const current = profileViewRef.current;
    messagesOrigin.current = origin || { view: current && current !== "messages" ? current : null, profile: null };
    setInitialChat(initial);
    setProfileView("messages");
  }
  function leaveMessages() {
    const o = messagesOrigin.current; messagesOrigin.current = null;
    setInitialChat(null);
    if (o?.profile) { setProfileView(null); setProfileUser({ username: o.profile }); }
    else setProfileView(o?.view && o.view !== "messages" ? o.view : null);
  }
  const [outDismissed, setOutDismissed] = useState(false);
  const [notice, setNotice] = useState("");
  const noticeTimer = useRef(null);

  const completeWelcome = (asGuest) => {
    try { localStorage.setItem("bolle-onboarding-v1", "done"); localStorage.setItem("bolle-guest-v1", asGuest ? "yes" : "no"); } catch { /* Archiviazione locale non disponibile: prosegui senza salvare. */ }
    setGuestMode(asGuest);
    if (asGuest) track("guest_start");
    setWelcome(false);
  };
  const requestAccount = () => { track("guest_prompt"); setAuthPrompt(true); };
  const beginRegistration = () => { setWelcome(false); setAuthPrompt(false); setProfileView(null); setRegistrationOpen(true); track("register_start"); };
  const beginLogin = () => { setWelcome(false); setAuthPrompt(false); setRegistrationOpen(false); setLoginOpen(true); };
  const available = me?.available ?? 0;
  const bonusPerPost = me?.bonus_per_post ?? 2;
  const dailyLimit = Math.max(1, Number(me?.daily_limit) || 25);
  const out = ready && me !== null && available <= 0;

  const notify = useCallback((text) => {
    setNotice(text);
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(""), 4500);
  }, []);
  useEffect(() => {
    const onSkipped = (e) => notify(`Tag non inviato a: ${(e.detail || []).map(n => "@" + n).join(", ")} (non esiste, non accetta tag o già taggato)`);
    window.addEventListener("bolle:tag-skipped", onSkipped);
    return () => window.removeEventListener("bolle:tag-skipped", onSkipped);
  }, [notify]);

  const openNotification = useCallback(async (item) => {
    dismissLiveNotification();
    if (item?.achievement) { setProfileView("stats"); return; }
    if (item?.kind === "group_added" || item?.kind === "group_message" || notifGroupId(item)) {
      const gid = notifGroupId(item);
      const quoted = String(item?.title || item?.body || "").match(/["«“]([^"»”]+)["»”]/);
      const wantedName = item?.group_name || (quoted ? quoted[1] : "");
      if (gid != null) { openMessages({ id: gid, isGroup: true, name: wantedName || "Gruppo" }); return; }
      // Nessun id nella notifica: si cerca il gruppo per nome, altrimenti il più recente.
      try {
        const { data: gl } = await supabase.rpc("bolle_group_list");
        const rows = Array.isArray(gl) ? gl : [];
        const stamp = (r) => Date.parse(r.created_at || r.last_at || 0) || 0;
        const g = rows.find(r => wantedName && String(r.name || "").toLowerCase() === wantedName.toLowerCase()) || [...rows].sort((a, b) => stamp(b) - stamp(a))[0];
        if (g) { openMessages({ id: g.id, isGroup: true, name: g.name || wantedName || "Gruppo" }); return; }
      } catch { /* gruppi non disponibili: si apre l'elenco messaggi */ }
      openMessages(null);
      return;
    }
    if (item?.chat_username) { openMessages({ username: item.chat_username, avatar: avatarFor(item.chat_username, avatarMap) }); return; }
    if (item?.kind === "bubble_tag" && item.bubble_id) {
      if (guestMode || !me?.registered) { notify("Accedi per aprire questa bolla"); return; }
      const sealedTagged = await findCapsule(item.bubble_id);
      if (sealedTagged) { setProfileView(null); openCapsuleViewer(sealedTagged); return; }
      // Già scoppiata: si rivede gratis. Altrimenti la si scoppia adesso, come dal feed.
      const { data: reopened, error: reopenError } = await supabase.rpc("bolle_reopen_popped", { p_bubble_id: item.bubble_id });
      const reopenedRow = Array.isArray(reopened) ? reopened[0] : reopened;
      if (!reopenError && reopenedRow?.o_path) {
        setProfileView(null);
        await openViewer(item.bubble_id, reopenedRow, { username: item.tag_username }, { reopen: true });
        return;
      }
      if (String(reopenError?.message || "").includes("not_popped")) {
        setProfileView(null);
        await pop({ id: item.bubble_id, username: item.tag_username });
        return;
      }
      notify(errorText(reopenError));
      return;
    }
    if (!item?.bubble_id) { setProfileView("notifications"); return; }
    if (guestMode || !me?.registered) { notify("Accedi per aprire questa bolla"); return; }
    const sealedCapsule = await findCapsule(item.bubble_id);
    if (sealedCapsule) { setProfileView(null); openCapsuleViewer(sealedCapsule); return; }
    const { data, error } = await supabase.rpc("bolle_notification_bubble_v4", { p_notification_id: item.id });
    if (error || !data) { notify(error ? `Apertura notifica: ${error.message}` : "Questa bolla non è più disponibile."); return; }
    if (data.can_reopen) {
      setProfileView(null);
      await openViewer(data.id, { o_type: data.media_type, o_caption: data.caption, o_path: data.media_path }, { username: data.username, user_id: data.user_id || data.author_id, isAuthor: Boolean(data.is_author) });
      return;
    }
    if (data.already_popped) { notify("Hai già scoppiato questa bolla: il contenuto non può più essere riaperto."); return; }
    if (data.is_author) { notify("Questa bolla non è più disponibile."); return; }
    if (data.can_pop) {
      setProfileView(null);
      await pop({ id: data.id, username: data.username });
      return;
    }
    notify("Bolla scaduta o non più disponibile.");
  // openViewer e pop sono funzioni del componente, aggiornate a ogni render.
  }, [dismissLiveNotification, guestMode, me, notify, available, bubbles, avatarMap]);

  const refreshMe = useCallback(async () => {
    const { data, error } = await supabase.rpc("bolle_my_state");
    if (!error && data) setMe(data);
    return error ? null : data;
  }, []);

  useEffect(() => { if (!out) setOutDismissed(false); }, [out]);
  // Ricarica i valori ufficiali del server quando l’Admin cambia il limite
  // oppure quando si torna all’app da un’altra scheda/dispositivo.
  useEffect(() => {
    const onLimitChange = () => { void refreshMe(); };
    const onVisible = () => { if (document.visibilityState === "visible" && ready) void refreshMe(); };
    window.addEventListener("bolle:daily-limit-updated", onLimitChange);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("bolle:daily-limit-updated", onLimitChange);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refreshMe, ready]);
  const refreshEverything = useCallback(async () => {
    setPullRefreshing(true);
    setRefreshKey(k => k + 1);
    await refreshMe();
    setTimeout(() => setPullRefreshing(false), 750);
  }, [refreshMe]);
  function pullTouchStart(e) {
    if (window.scrollY > 4 || document.querySelector("[role=dialog]")) return;
    pullStart.current = e.touches[0]?.clientY ?? null;
  }
  function pullTouchMove(e) {
    if (pullStart.current === null) return;
    const delta = (e.touches[0]?.clientY ?? 0) - pullStart.current;
    if (delta < 0) { setPullDistance(0); return; }
    setPullDistance(Math.min(95, delta * 0.42));
  }
  function pullTouchEnd() {
    if (pullDistance >= 65 && !pullRefreshing) refreshEverything();
    pullStart.current = null;
    setPullDistance(0);
  }
  useEffect(() => {
    if (!ready || !uid) return;
    let active = true;
    const load = async () => {
      const [{ data: av }, { data: count }, { data: tagRows }] = await Promise.all([
        supabase.rpc("bolle_feed_avatars"), supabase.rpc("bolle_unread_notification_count"),
        supabase.rpc("bolle_my_tag_notifications").then(r => r, () => ({ data: null }))
      ]);
      if (!active) return;
      if (Array.isArray(av)) {
        setAvatarMap(Object.fromEntries(av.map(x => [String(x.username).toLowerCase(), x.avatar])));
        const mine = av.find(x => String(x.username).toLowerCase() === String(me?.username || "").toLowerCase());
        if (mine) setMyAvatar(mine.avatar);
      }
      if (typeof count === "number") setUnreadNotifications(count + (Array.isArray(tagRows) ? tagRows.filter(t => t?.kind === "tagged" && !t.seen).length : 0));
    };
    load();
    return () => { active = false; };
  }, [ready, uid, me?.username, refreshKey]);
  useEffect(() => {
    if (!ready) return;
    supabase.rpc("bolle_daily_prompt").then(({data}) => setDaily(data?.[0] || null));

    supabase.rpc("bolle_secret_ids").then(({data}) => setAllSecretIds(new Set((data || []).map(x=>x.bubble_id))));
  }, [ready, refreshKey]);
  useEffect(() => {
    if (!ready || !coords) return;
    supabase.rpc("bolle_nearby_secrets", {p_lat:coords.lat,p_lng:coords.lng}).then(({data}) =>
      setSecretIds(new Set((data || []).map(x=>x.bubble_id))));
  }, [ready,coords,refreshKey]);
  async function startTravel(message) {
    const {data,error}=await supabase.rpc("bolle_start_travel",{p_message:message});
    if(error) throw error;
    setTravelToken(data); setTravelOpen(true);
    const url=new URL(window.location.href);url.search="";url.searchParams.set("travel",data);
    const text=`🫧 Ti passo una Bolla Viaggiatrice! Aggiungi un pensiero e falla viaggiare: ${url.toString()}`;
    if(navigator.share) {try {await navigator.share({text});return;} catch(e){if(e.name==="AbortError") return;}}
    try {await navigator.clipboard.writeText(text);notify("Link della bolla viaggiatrice copiato 🫧");}
    catch {window.prompt("Copia questo link",url.toString());}
  }
  async function createTravel() {
    if(guestMode || !me?.registered) return requestAccount();
    const message=window.prompt("Scrivi il primo pensiero della Bolla Viaggiatrice (max 140 caratteri)");
    if(!message?.trim()) return;
    try {await startTravel(message.trim().slice(0,140));}catch(e){notify(errorText(e));}
  }
  async function enableSecretFilter() {
    if(secretOnly) {setSecretOnly(false);return;}
    try {if(!coords) setCoords(await getPosition());setSecretOnly(true);setScope("nearby");}
    catch(e){notify(positionErrorText(e));}
  }
  async function uploadAvatar(file) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return notify("Usa una foto JPG, PNG o WebP.");
    if (file.size > 2 * 1024 * 1024) return notify("La foto deve pesare al massimo 2 MB.");
    const { data: sessionData } = await supabase.auth.getUser();
    const userId = sessionData?.user?.id;
    if (!userId) return notify("Accedi per modificare l'avatar.");
    const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[file.type];
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) return notify(errorText(uploadError));
    const previous = myAvatar;
    const { error: saveError } = await supabase.rpc("bolle_set_my_avatar", { p_avatar: `photo:${path}` });
    if (saveError) {
      await supabase.storage.from(AVATAR_BUCKET).remove([path]);
      return notify(errorText(saveError));
    }
    setMyAvatar(`photo:${path}`);
    setAvatarMap(prev => ({ ...prev, [String(me?.username || "").toLowerCase()]: `photo:${path}` }));
    if (previous?.startsWith("photo:")) await supabase.storage.from(AVATAR_BUCKET).remove([previous.slice(6)]);
    notify("Foto profilo aggiornata ✨");
  }
  async function changeAvatar(avatar) {
    const previous = myAvatar;
    const { error } = await supabase.rpc("bolle_set_my_avatar", { p_avatar: avatar });
    if (error) return notify(errorText(error));
    setMyAvatar(avatar);
    setAvatarMap(prev => ({ ...prev, [String(me?.username || "").toLowerCase()]: avatar }));
    if (previous?.startsWith("photo:")) await supabase.storage.from(AVATAR_BUCKET).remove([previous.slice(6)]);
    notify(avatar === "🫧" ? "Avatar rimosso" : "Avatar aggiornato ✨");
  }
  useEffect(() => {
    const showReport = (e) => {
      const detail = String(e.detail?.message || "Errore imprevisto").slice(0, 300);
      setErrorReport(detail);
      setReportThanks(false);
    };
    window.addEventListener("bolle:reportable-error", showReport);
    const cleanup = installGlobalErrorTracking();
    return () => { cleanup(); window.removeEventListener("bolle:reportable-error", showReport); };
  }, []);
  async function sendErrorReport(e) {
    e.preventDefault();
    if (reportBusy) return;
    setReportBusy(true);
    const { error } = await supabase.rpc("bolle_submit_bug_report", {
      p_message: reportDetails.trim().slice(0, 2000) || "Errore riscontrato durante l'utilizzo",
      p_error_context: String(errorReport || "").slice(0, 300),
      p_page: window.location.pathname.slice(0, 200)
    });
    setReportBusy(false);
    if (error) { notify("Impossibile inviare la segnalazione. Riprova più tardi."); return; }
    setReportThanks(true); setReportDetails(""); setErrorReport(null);
  }
  useEffect(() => { track("app_open"); }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const session = await ensureSession();
        if (!alive) return;
        setUid(session.user.id);
        const profile = await refreshMe();
        if (!alive) return;
        // Il server è la fonte di verità: non usare il flag locale per decidere se l'utente è ospite.
        if (profile?.registered) {
          setGuestMode(false);
          setWelcome(false);
          try { localStorage.setItem("bolle-guest-v1", "no"); localStorage.setItem("bolle-onboarding-v1", "done"); } catch {}
        } else if (profile) {
          setGuestMode(true);
          // Se Google ha autenticato un nuovo utente, chiedi i dati mancanti.
          // Registrazione Google: dati e consenso, senza PIN.
          if (!session.user.is_anonymous && (session.user.identities || []).some(i => i.provider === "google")) {
            setGoogleRegistration(true);
            setGoogleEmail(session.user.email || "");
            setWelcome(false);
            setRegistrationOpen(true);
          }
        }
        setReady(true);
      } catch {
        if (alive) setFatal("Non riusciamo a collegarci. Controlla la connessione e ricarica la pagina.");
      }
    })();
    return () => { alive = false; };
  }, [refreshMe]);

  useEffect(() => {
    if (!ready) return;
    if (scope === "nearby" && !coords) return;
    let alive = true;
    (async () => {
      setLoading(true);
      const nearby = scope === "nearby";
      const { data, error } = await supabase.rpc("get_feed_with_authors", {
        p_lat: nearby ? coords.lat : null, p_lng: nearby ? coords.lng : null,
        p_radius_km: nearby ? radius : null, p_limit: 180,
      });
      if (!alive) return;
      setLoading(false);
      if (error) return notify(errorText(error));
      // Capsule del tempo ancora chiuse: compaiono nel feed di tutti con il conto alla rovescia.
      // Se la funzione non esiste ancora sul server, il feed funziona come prima.
      let feedRows = data || [];
      try {
        const { data: capsules, error: capsuleFeedError } = await supabase.rpc("bolle_capsule_feed", {
          p_lat: nearby ? coords.lat : null, p_lng: nearby ? coords.lng : null,
          p_radius_km: nearby ? radius : null, p_limit: 60,
        });
        if (capsuleFeedError) console.warn("[Bolle] bolle_capsule_feed non disponibile: le capsule degli altri non compaiono nel feed.", capsuleFeedError.message);
        if (!capsuleFeedError && Array.isArray(capsules) && capsules.length) {
          const serverNow = Date.parse(capsules[0].server_now || "");
          if (Number.isFinite(serverNow)) capsuleClockSkewMs = serverNow - Date.now();
          const known = new Set(feedRows.map(b => b.id));
          feedRows = [...feedRows, ...capsules.filter(c => c?.id && !known.has(c.id) && Date.parse(c.opens_at) > capsuleNow())];
        }
      } catch (capsuleErr) { console.warn("[Bolle] Capsule non caricate:", capsuleErr); /* nessun blocco del feed */ }
      if (!alive) return;
      setBubbles(feedRows);
      const missingCategory = feedRows.filter(b => !b.starter && !b.category).map(b => b.id);
      if (missingCategory.length) {
        fetchBubbleCategories(missingCategory).then(cats => {
          if (!alive || !Object.keys(cats).length) return;
          setBubbles(prev => prev.map(b => cats[b.id] ? { ...b, category: cats[b.id] } : b));
        });
      }
      const {data: privacyRows, error: privacyError} = await supabase.rpc("bolle_feed_privacy", {p_ids:feedRows.filter(b=>!b.starter).map(b=>b.id)});
      if (!privacyError && alive) setBubblePrivacy(Object.fromEntries((privacyRows || []).map(r=>[r.bubble_id,r])));
      const ids = feedRows.filter(b => !b.starter).map(b => b.id);
      if (ids.length) {
        const {data:flags,error:flagError} = await supabase.rpc("bolle_countries_for_feed", {p_ids:ids});
        if (!flagError && alive) setBubbleCountries(Object.fromEntries((flags || []).map(row => [row.bubble_id,row.country_code])));
      }
    })();
    return () => { alive = false; };
  }, [ready, scope, radius, coords, refreshKey, notify]);

  // Preferiti persistenti per account: caricati da Supabase, mai da un elenco globale.
  useEffect(() => {
    if (!ready || !uid || guestMode) { setFavoriteAuthors(new Set()); return; }
    let active = true;
    supabase.rpc("bolle_my_favorite_authors").then(({ data, error }) => {
      if (!active) return;
      if (error) { console.warn("Preferiti non disponibili:", error.message); return; }
      setFavoriteAuthors(new Set((data || []).map(x => String(x.username).toLowerCase())));
    });
    supabase.rpc("bolle_my_blocked_users").then(({ data, error }) => {
      if (!active) return;
      if (!error && Array.isArray(data)) {
        setBlockedUsers(new Set(data.map(d => String(d.blocked_username).toLowerCase())));
      }
    });
    return () => { active = false; };
  }, [ready, uid, guestMode]);

  useEffect(() => {
    // Dopo 4 minuti di uso continuo passa alla modalità eco per non scaldare il telefono; si riarma al ritorno in primo piano.
    let timer = 0;
    const arm = () => { clearTimeout(timer); applyEco(ecoForced()); timer = setTimeout(() => applyEco(true), 4 * 60 * 1000); };
    arm();
    const onVisible = () => { if (!document.hidden) arm(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { clearTimeout(timer); document.removeEventListener("visibilitychange", onVisible); applyEco(false); };
  }, []);
  const favoriteBusyRef = useRef(false);
  async function refreshFavorites() {
    const { data, error } = await supabase.rpc("bolle_my_favorite_authors");
    if (error) return null;
    const next = new Set((data || []).map(x => String(x.username).toLowerCase()));
    setFavoriteAuthors(next);
    return next;
  }
  async function toggleFavorite(username) {
    if (guestMode || !me?.registered) { requestAccount(); return; }
    const name = String(username || "").trim().replace(/^@/, "").toLowerCase();
    if (!name) { notify("Autore non disponibile: non riesco ad aggiornare i preferiti."); return; }
    if (favoriteBusyRef.current) return; // evita il doppio tocco: il toggle sul server inverterebbe due volte
    favoriteBusyRef.current = true;
    try {
      const { data, error } = await supabase.rpc("bolle_toggle_favorite_author", { p_username: name });
      if (error) return notify(errorText(error));
      // Il toggle restituisce true (aggiunto) o false (rimosso); poi riallineo l'elenco con il server.
      const isFavorite = data === true;
      setFavoriteAuthors(prev => { const s = new Set(prev); if (isFavorite) s.add(name); else s.delete(name); return s; });
      refreshFavorites();
      notify(isFavorite ? `⭐ @${name} aggiunto ai preferiti` : `@${name} rimosso dai preferiti`);
    } finally { favoriteBusyRef.current = false; }
  }

  async function blockUser(username) {
    if (guestMode || !me?.registered) { requestAccount(); return; }
    const name = String(username || "").trim().replace(/^@/, "").toLowerCase();
    if (!name) return;
    const { error } = await supabase.rpc("bolle_block_user", { p_username: name });
    if (error) return notify(errorText(error));
    setBlockedUsers(prev => new Set([...prev, name]));
    notify(`🚫 @${name} è stato bloccato.`);
  }

  async function unblockUser(username) {
    const name = String(username || "").trim().replace(/^@/, "").toLowerCase();
    if (!name) return;
    const { error } = await supabase.rpc("bolle_unblock_user", { p_username: name });
    if (error) return notify(errorText(error));
    setBlockedUsers(prev => {
      const next = new Set(prev);
      next.delete(name);
      return next;
    });
    notify(`@${name} sbloccato.`);
  }

  /* «Vicino a me»: tocco = attiva · pressione prolungata = apre le distanze (si può scorrere e rilasciare su una voce) */
  const nearPointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    nearIgnore.current = false; nearDown.current = true; setRadiusAct(null);
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignora */ }
    clearTimeout(nearTimer.current);
    nearTimer.current = setTimeout(async () => {
      nearIgnore.current = true; haptic("select");
      if (scope !== "nearby") await chooseScope("nearby");
      setRadiusOpen(true);
    }, 320);
  };
  const nearPointerMove = (e) => {
    if (!nearDown.current || !radiusOpen) return;
    const el = document.elementFromPoint(e.clientX, e.clientY)?.closest?.("[data-radius]");
    const v = el ? Number(el.dataset.radius) : null;
    setRadiusAct((cur) => (cur === v ? cur : v));
  };
  const nearPointerEnd = (e) => {
    clearTimeout(nearTimer.current); nearDown.current = false;
    if (nearIgnore.current && radiusOpen && radiusAct !== null && e.type !== "pointercancel") pickRadius(radiusAct);
    setRadiusAct(null);
  };
  const pickRadius = (r) => { haptic("select"); try { playPop(); } catch { /* audio non disponibile */ } setRadius(r); setRadiusOpen(false); };
  const nearClick = () => {
    if (nearIgnore.current) { nearIgnore.current = false; return; }
    if (radiusOpen) { setRadiusOpen(false); return; }
    chooseScope("nearby");
  };
  useEffect(() => { if (scope !== "nearby") setRadiusOpen(false); }, [scope]);
  useEffect(() => {
    if (!radiusOpen) return undefined;
    const off = (e) => { if (!e.target.closest?.(".bl-radius-fan, .bl-near-btn")) setRadiusOpen(false); };
    const key = (e) => { if (e.key === "Escape") setRadiusOpen(false); };
    document.addEventListener("pointerdown", off, true); window.addEventListener("keydown", key);
    return () => { document.removeEventListener("pointerdown", off, true); window.removeEventListener("keydown", key); clearTimeout(nearTimer.current); };
  }, [radiusOpen]);

  async function chooseScope(next) {
    if (next === scope) return setRefreshKey((k) => k + 1);
    if (next === "nearby" && !coords) {
      try { setCoords(await getPosition()); }
      catch (err) { console.error("Bolle: errore geolocalizzazione", err); return notify(positionErrorText(err)); }
    }
    setScope(next);
  }

  /* ---------- Account (username anonimo + PIN per accedere da altri dispositivi) ---------- */
  async function registerAccount(pin) {
    const { error } = await supabase.rpc("bolle_register_profile", { p_username: me.username, p_pin: pin });
    if (error) throw error;
    const { error: upgradeError } = await supabase.functions.invoke("bolle-auth", { body: { action: "upgrade" } });
    await refreshMe();
    if (upgradeError) throw new Error("Profilo creato, ma accesso da altri dispositivi non ancora attivo: " + upgradeError.message);
    notify("PIN registrato: ora puoi accedere da altri dispositivi.");
  }
  async function registerComplete(profile, pin) {
    // Richiede la RPC transazionale bolle_register_complete sul backend.
    // Non inviare mai il PIN a tabelle pubbliche o analytics.
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    const viaGoogle = !authUser?.is_anonymous && (authUser?.identities || []).some(i => i.provider === "google");
    const { error } = await supabase.rpc(viaGoogle ? "bolle_register_google" : "bolle_register_complete_v2", {
      p_first_name: profile.firstName, p_last_name: profile.lastName,
      p_email: profile.email, p_phone: profile.phone,
      p_sex: profile.sex, p_age: profile.age,
      p_nationality: profile.nationality, p_city: profile.city,
      p_consent: profile.consent, ...(viaGoogle ? {} : { p_pin: pin }),
    });
    if (error) throw error;
    if (profile.birthDate) {
      const { error: birthError } = await supabase.rpc("bolle_set_birth_date", { p_birth_date: profile.birthDate });
      if (birthError) console.warn("Data di nascita non salvata:", birthError.message);
    }
    if (profile.category) {
      try {
        localStorage.setItem("bolle-my-category", profile.category);
        await supabase.rpc("bolle_set_my_category", { p_category: profile.category });
      } catch (catErr) {
        console.warn("Categoria non salvata:", catErr);
      }
    }
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser?.is_anonymous) {
      const { data, error: upgradeError } = await supabase.functions.invoke("bolle-auth", { body: { action: "upgrade" } });
      if (upgradeError || !data?.ok) throw new Error("Profilo salvato, ma attivazione dell'accesso non riuscita: " + (upgradeError?.message || data?.error || "riprova"));
    }
    await refreshMe();
    setGuestMode(false);
    try { localStorage.setItem("bolle-guest-v1", "no"); localStorage.setItem("bolle-onboarding-v1", "done"); } catch { /* Archiviazione locale non disponibile: prosegui senza salvare. */ }
    setRegistrationOpen(false);
    setGoogleRegistration(false);
    // Memorizza subito la visualizzazione, anche se l'utente ricarica senza chiuderlo.
    try { localStorage.setItem(`bolle-tutorial-v1-${uid || "guest"}`, "done"); } catch { /* Private mode */ }
    setTutorialOpen(true);
    track("register_complete");
    notify("Registrazione completata!");
  }
  async function googleAuth(mode = "login") {
    // OAuth usa il redirect sulla stessa origine. Non salvare mai token Google nel client.
    const redirectTo = `${window.location.origin}${window.location.pathname}`;
    try {
      if (mode === "link") {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user || user.is_anonymous || !me?.registered) {
          throw new Error("Accedi prima con username e PIN per collegare Google al tuo profilo.");
        }
        const { error } = await supabase.auth.linkIdentity({ provider: "google", options: { redirectTo } });
        if (error) throw error;
      } else {
        // Non collegare automaticamente una nuova identità a un profilo anonimo:
        // potrebbe sostituire l'utente e perdere l'associazione con le bolle.
        const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
        if (error) throw error;
      }
    } catch (err) { notify(err?.message || "Accesso Google non disponibile."); }
  }

  async function loginAccount(username, pin) {
    const { data, error } = await supabase.functions.invoke("bolle-auth", { body: { action: "login", username, pin } });
    if (error || !data?.token_hash) throw new Error(data?.error || "Accesso non riuscito. Verifica le credenziali o riprova più tardi.");
    const { data: sessionData, error: sessionError } = await supabase.auth.verifyOtp({ token_hash: data.token_hash, type: "magiclink" });
    if (sessionError) throw sessionError;
    setAuthSession(sessionData.session);
    setUid(sessionData.user.id);
    setViewer(null);
    await refreshMe();
    setRefreshKey((n) => n + 1);
    setLoginOpen(false); setProfileView(null);
    try { localStorage.setItem("bolle-guest-v1", "no"); } catch { /* Archiviazione locale non disponibile: prosegui senza salvare. */ }
    setGuestMode(false);
    notify(`Bentornato, @${username}!`);
  }
  async function enableMultiDevice() {
    const { data, error } = await supabase.functions.invoke("bolle-auth", { body: { action: "upgrade" } });
    if (error || !data?.ok) throw new Error(data?.error || error?.message || "Attivazione non riuscita");
    notify("Accesso da altri dispositivi attivato!");
  }
  async function logoutAccount() {
    await supabase.auth.signOut(); setAuthSession(null); signedUrlCache.clear();
    setMe(null); setUid(null); setProfileView(null); setViewer(null);
    try {
      const session = await ensureSession();
      setUid(session.user.id);
      await refreshMe();
      setRefreshKey((n) => n + 1);
      notify("Sei uscito dal profilo.");
    } catch { setFatal("Impossibile inizializzare la sessione anonima."); }
  }

  // Eliminazione definitiva del profilo: il server cancella i dati, poi si torna a una sessione anonima pulita.
  async function deleteAccount(reason) {
    // Elenco dei file dell'utente (foto, video, avatar) raccolto PRIMA: dopo l'eliminazione le righe del database non esistono più.
    const ownFiles = [];
    for (const bucket of [BUCKET, AVATAR_BUCKET]) {
      try {
        for (let offset = 0; offset < 5000; offset += 1000) {
          const { data: files, error: listError } = await supabase.storage.from(bucket).list(uid, { limit: 1000, offset });
          if (listError || !Array.isArray(files) || !files.length) break;
          files.filter(f => f?.name && f.id).forEach(f => ownFiles.push({ bucket, path: `${uid}/${f.name}` }));
          if (files.length < 1000) break;
        }
      } catch { /* elenco non disponibile: si elimina comunque il profilo */ }
    }
    const { error } = await supabase.rpc("bolle_delete_my_account", { p_reason: String(reason || "").slice(0, 500) });
    if (error) throw new Error(error.message || "Eliminazione non riuscita.");
    // Pulizia dei file: tentativo a buon fine se possibile, non blocca l'uscita dal profilo.
    for (const bucket of [BUCKET, AVATAR_BUCKET]) {
      const paths = ownFiles.filter(f => f.bucket === bucket).map(f => f.path);
      for (let i = 0; i < paths.length; i += 100) {
        try { await supabase.storage.from(bucket).remove(paths.slice(i, i + 100)); } catch { /* resta al processo di pulizia */ }
      }
    }
    try { localStorage.removeItem("bolle-my-category"); } catch { /* storage non disponibile */ }
    try { await supabase.auth.signOut({ scope: "local" }); } catch { /* l'utente non esiste più sul server: basta chiudere la sessione locale */ }
    setAuthSession(null);
    setMe(null); setUid(null); setProfileView(null); setViewer(null);
    try {
      const session = await ensureSession();
      setUid(session.user.id);
      await refreshMe();
      setRefreshKey((n) => n + 1);
      notify("Il tuo profilo è stato eliminato.");
    } catch { setFatal("Impossibile inizializzare la sessione anonima."); }
  }

  /* ---------- Bolle ---------- */
  /* ---------- Modalità scorrimento ----------
     Dentro una bolla scoppiata, l'icona ⇅ attiva lo scorrimento verticale: su = bolla successiva, giù = precedente.
     Il timer dei 6 secondi si ferma. Un tocco sull'immagine chiude la bolla ed esce dalla modalità. */
  const [scrollMode, setScrollMode] = useState(false);
  const [scrollDir, setScrollDir] = useState("up");
  const scrollModeRef = useRef(false); scrollModeRef.current = scrollMode;
  const scrollHist = useRef({ list: [], idx: -1 });
  const scrollNavBusy = useRef(false);
  // Uscita automatica quando la bolla viene chiusa.
  useEffect(() => {
    if (!viewer && scrollMode) { scrollHist.current = { list: [], idx: -1 }; setScrollMode(false); }
  }, [viewer, scrollMode]);
  // Cronologia: ogni bolla aperta durante lo scorrimento viene ricordata (stato incluso) per poter tornare indietro.
  useEffect(() => {
    if (!scrollMode || !viewer) return;
    const h = scrollHist.current, cur = h.list[h.idx];
    if (cur && cur.id === viewer.id) { h.list[h.idx] = viewer; return; }
    h.list = [...h.list.slice(0, h.idx + 1), viewer].slice(-40);
    h.idx = h.list.length - 1;
  }, [viewer, scrollMode]);
  function toggleScrollMode() {
    if (!viewer?.fromFeed) return;
    if (scrollModeRef.current) { scrollHist.current = { list: [], idx: -1 }; setScrollMode(false); return; }
    scrollHist.current = { list: [viewer], idx: 0 };
    setScrollMode(true);
  }
  // Prossima bolla da aprire: prima quelle degli utenti (se hai ancora scoppi), poi le bolle di sistema di oggi.
  function findNextBubble() {
    const used = new Set(scrollHist.current.list.map(v => v.id));
    if (viewer) used.add(viewer.id);
    const free = (b) => !used.has(b.id) && !bursting.has(b.id);
    const canOpenUser = (b) => !b.starter && capsuleRemainingMs(b) <= 0 && (guestMode ? guestLeftFor(b) > 0 : !out);
    const user = filteredBubbles.find(b => free(b) && canOpenUser(b));
    if (user) return user;
    if (authorFilter !== "all" || secretOnly) return null;
    return systemBubbles.find(b => free(b) && !systemPops.has(b.id)) || null;
  }
  async function showHistoryEntry(entry) {
    if (!entry) return;
    // I link firmati scadono: per foto e video se ne chiede uno nuovo prima di rivedere la bolla.
    if (entry.mediaPath && (entry.type === "image" || entry.type === "video")) {
      try {
        const signedUrl = await cachedSignedUrl(entry.mediaPath, 3600);
        if (signedUrl) { setViewer({ ...entry, url: signedUrl, status: "ready" }); return; }
      } catch { /* si usa il link già in memoria */ }
    }
    setViewer(entry);
  }
  async function scrollNext() {
    if (!scrollModeRef.current || scrollNavBusy.current) return;
    scrollNavBusy.current = true;
    try {
      const h = scrollHist.current;
      setScrollDir("up");
      if (h.idx < h.list.length - 1) { h.idx += 1; await showHistoryEntry(h.list[h.idx]); return; }
      const next = findNextBubble();
      if (!next) { notify("Hai visto tutte le bolle disponibili per ora 🫧 Domani ne arriveranno di nuove ✨"); return; }
      await pop(next);
    } finally { scrollNavBusy.current = false; }
  }
  async function scrollPrev() {
    const h = scrollHist.current;
    if (!scrollModeRef.current || scrollNavBusy.current || h.idx <= 0) return;
    scrollNavBusy.current = true;
    try { setScrollDir("down"); h.idx -= 1; await showHistoryEntry(h.list[h.idx]); }
    finally { scrollNavBusy.current = false; }
  }

  function popStarter(bubble) {
    if (bursting.has(bubble.id)) return;
    setBursting((old) => new Set(old).add(bubble.id));
    playPop();
    setViewer({ id: bubble.id, type: "surprise", caption: bubble.message, status: "ready", fromFeed: true, // subito
      system: Boolean(bubble.system), systemCategory: bubble.systemCategory || null, emoji: bubble.emoji || "",
      attribution: bubble.attribution || "", source: bubble.source || "", link: bubble.link || "" });
    setTimeout(() => {
      setSystemPops((old) => { const next = new Set(old).add(bubble.id); saveSystemPops(next, dayKey); return next; });
      setBursting((old) => { const next = new Set(old); next.delete(bubble.id); return next; });
    }, 700);
  }

  function openCapsuleViewer(bubble) {
    setViewer({ id: bubble.id, type: "capsule", opensAt: bubble.opens_at, username: bubble.username || bubble.author_username || "", status: "ready", caption: "" });
  }
  async function findCapsule(bubbleId) {
    const local = bubbles.find(b => b.id === bubbleId && capsuleRemainingMs(b) > 0);
    if (local) return local;
    try {
      const { data } = await supabase.rpc("bolle_capsule_feed", { p_lat: null, p_lng: null, p_radius_km: null, p_limit: 100 });
      if (Array.isArray(data)) {
        const serverNow = Date.parse(data[0]?.server_now || "");
        if (Number.isFinite(serverNow)) capsuleClockSkewMs = serverNow - Date.now();
        return data.find(c => c?.id === bubbleId && capsuleRemainingMs(c) > 0) || null;
      }
    } catch { /* ignora */ }
    return null;
  }

  async function pop(bubble) {
    if (bubble.starter) return popStarter(bubble);
    const capsuleLeft = capsuleRemainingMs(bubble);
    if (capsuleLeft > 0) { openCapsuleViewer(bubble); return; }
    if (guestMode && guestLeftFor(bubble) <= 0) { notify(`Hai già provato ${GUEST_POPS_PER_KIND} bolle di questo tipo: registrati per continuare 🫧`); return requestAccount(); }
    if (busy.current || bursting.has(bubble.id)) return;
    if (!guestMode && available <= 0) { setOutDismissed(false); return; }
    busy.current = true;
    setBursting((s) => new Set(s).add(bubble.id)); // lo scoppio parte al tocco, senza aspettare il server
    playPop();
    const { data, error } = await supabase.rpc("pop_bubble", { p_bubble_id: bubble.id });
    busy.current = false;
    if (error) {
      setBursting((s) => { const n = new Set(s); n.delete(bubble.id); return n; });
      const m = String(error.message);
      if (guestMode && !m.includes("already_popped") && !m.includes("bubble_not_found")) requestAccount(); // il server può richiedere la registrazione
      else if (m.includes("no_pops_left")) { setMe((s) => (s ? { ...s, available: 0 } : s)); setOutDismissed(false); }
      if (m.includes("already_popped") || m.includes("bubble_not_found")) setBubbles((list) => list.filter((b) => b.id !== bubble.id));
      if (/not_open|opens_at|capsule|locked/i.test(m)) setRefreshKey((k) => k + 1); // orologio fuori sincrono: riallinea il feed
      return notify(`Apertura bolla: ${error.message || errorText(error)}`);
    }
    const row = Array.isArray(data) ? data[0] : data;
    if (guestMode) {
      const key = guestKindKey(bubble);
      setGuestPops((prev) => { const next = { ...prev, [key]: (prev[key] || 0) + 1 }; try { localStorage.setItem("bolle-guest-pops-v1", JSON.stringify(next)); } catch { /* ignora */ } return next; });
    } else setMe((s) => (s ? { ...s, pops_today: row.o_pops_today, available: row.o_available } : s));
    rememberDiscovery(bubble.username || bubble.author_username, "pop");
    openViewer(bubble.id, row, bubble, { fromFeed: true }); // il contenuto si apre subito
    if (!guestMode && isRareBubble(bubble.id)) setTimeout(() => notify("🌟 Bolla rara! Hai ricevuto scoppi bonus ✨"), 900);
    setTimeout(() => {
      setBubbles((list) => list.filter((b) => b.id !== bubble.id));
      setBursting((s) => { const n = new Set(s); n.delete(bubble.id); return n; });
    }, 700);
    if (!guestMode && row.o_available === 0) setTimeout(() => notify("Hai finito le bolle da scoppiare! 🫧"), 1200);
  }

  // Dal profilo: rivede gratis una bolla già scoppiata (nessuno scoppio consumato).
  async function reopenPopped(t, username) {
    const { data, error } = await supabase.rpc("bolle_reopen_popped", { p_bubble_id: t.bubble_id });
    if (error) return notify(errorText(error));
    const row = Array.isArray(data) ? data[0] : data;
    if (!row?.o_path) return notify("Questa bolla non è più disponibile.");
    openViewer(t.bubble_id, row, { username, isAuthor: t.state === "mine" }, { reopen: true });
  }

  async function openViewer(id, row, bubble, opts = {}) {
    const username = bubble?.username || bubble?.author_username || "";
    setViewer({ id, username, authorId: bubble?.user_id || bubble?.author_id || bubble?.author_user_id || null, isAuthor: Boolean(bubble?.isAuthor) || (Boolean(me?.username) && String(username).toLowerCase() === String(me.username).toLowerCase()), avatar: avatarFor(username, avatarMap), type: row.o_type, caption: cleanCaption(row.o_caption), captionPos: captionPosition(row.o_caption), url: null, status: "loading", kindHint: bubbleKinds?.[id], chain: null, mediaPath: row.o_path || null, fromFeed: Boolean(opts.fromFeed), noSession: Boolean(opts.reopen) });
    // Le informazioni della catena sono opzionali: se la migrazione non è ancora stata applicata, la bolla continua ad aprirsi normalmente.
    supabase.rpc("bolle_chain_get", { p_bubble_id: id }).then(({ data: chainData, error: chainError }) => {
      if (!chainError && chainData?.root_bubble_id) setViewer(v => v?.id === id ? { ...v, chain: chainData } : v);
    }).catch(() => {});
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(row.o_path, scrollModeRef.current ? 3600 : 120);
    setViewer((v) => {
      if (!v || v.id !== id) return v;
      return error ? { ...v, status: "error", loadError: error.message, gone: /not.?found|404/i.test(`${error.message || ""} ${error.statusCode || ""} ${error.status || ""}`) } : { ...v, url: data.signedUrl, status: "ready" };
    });
    // Evento distinto dallo scoppio: registrato soltanto se il contenuto è accessibile.
    // Non blocca la visualizzazione se il tracciamento non è disponibile.
    if (!error && data?.signedUrl && !opts.reopen) {
      supabase.rpc("bolle_record_open", { p_bubble_id: id }).then(() => {}, () => {});
    }
  }

  async function react(key) {
    if (!viewer || viewer.isAuthor || viewer.type === "surprise" || viewer.reacted || reactionBusy) return;
    setReactionBusy(true);
    const targetId = viewer.id;
    const { error } = await supabase.rpc("bolle_react_and_notify", { p_bubble_id: targetId, p_reaction: key });
    setReactionBusy(false);
    if (error) return notify(errorText(error));
    setViewer((current) => (current?.id === targetId ? { ...current, reacted: key } : current));
    rememberDiscovery(viewer.username, "react");
    notify("Reazione anonima inviata ✨");
  }

  // Risposte e inoltri dalla schermata della bolla: normali messaggi di chat con un marcatore iniziale.
  async function chatFromBubble(kind, username, text, bubble) {
    if (!username) return { ok: false, error: "Autore non disponibile." };
    if (guestMode || !me?.registered) { setViewer(null); requestAccount(); return { ok: false, error: "" }; }
    const mark = kind === "share" ? CHAT_MARK_SHARE : makeBubbleReplyMark(bubble);
    const body = `${mark} ${String(text).slice(0, Math.max(0, CHAT_MAX_BODY - mark.length - 1))}`;
    const { error } = await supabase.rpc("bolle_chat_send", { p_username: username, p_body: body });
    if (!error) { if (seqSession.current?.id) seqApi.interact(seqSession.current.id); return { ok: true }; }
    const m = error.message || "";
    return { ok: false, error: m.includes("chat_blocked") ? "Non puoi scrivere a questo utente." : m.includes("chat_rate_limited") ? "Troppi messaggi: attendi un minuto." : m.includes("user_not_found") ? "Utente non trovato." : "Messaggio non inviato. Riprova." };
  }

  async function report() {
    if (!viewer) return;
    const { error } = await supabase.rpc("report_bubble", { p_bubble_id: viewer.id, p_reason: "segnalata dall’utente" });
    setViewer(null);
    notify(error ? errorText(error) : "Segnalazione inviata. Grazie.");
  }

  async function redeemGift() {
    if (!giftToken || giftState === "opening" || giftState === "opened") return;
    setGiftState("opening"); setGiftError(""); getCtx(); // sblocca l'audio col tocco
    try {
      await ensureSession();
      const { data, error } = await supabase.rpc("bolle_redeem_gift", { p_token: giftToken });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      if (!row?.media_path) throw new Error("Regalo non disponibile.");
      const { data: signed, error: signError } = await supabase.storage.from(BUCKET).createSignedUrl(row.media_path, 120);
      if (signError) throw signError;
      setGiftState("opened");
      setViewer({ id: row.bubble_id, type: row.media_type, caption: cleanCaption(row.caption), url: signed.signedUrl, status: "ready", gift: true });
    } catch (e) {
      const raw = String(e?.message || "Regalo non disponibile.");
      // Gli errori del database (vincoli, colonne, funzioni) non vanno mostrati a chi riceve il regalo.
      const technical = /constraint|violates|relation|column|function|syntax|row-level|schema/i.test(raw);
      setGiftState("error");
      setGiftError(technical ? "Non siamo riusciti ad aprire questo regalo. Riprova tra poco: se il problema continua, puoi segnalarlo agli sviluppatori." : raw);
      window.dispatchEvent(new CustomEvent("bolle:reportable-error", { detail: { message: `Riscatto regalo: ${raw}` } }));
    }
  }

  async function onPublished() {
    const before = me?.bonus_credits ?? 0;
    setComposing(false);
    setChainRootId(null); setChainInvite(null);
    if (new URLSearchParams(window.location.search).has("chain")) { const u=new URL(window.location.href);u.searchParams.delete("chain");window.history.replaceState({}, "", u); }
    setRefreshKey((k) => k + 1);
    const fresh = await refreshMe(); // il saldo arriva dal server: nessun bonus "finto" lato client
    const gained = fresh ? fresh.bonus_credits - before : bonusPerPost;
    notify(gained > 0 ? `Bolla pubblicata! +${gained} scoppi extra 🫧✨` : "Bolla pubblicata. Ora galleggia nel feed di tutti.");
  }

  // Il filtro e solo visivo: non modifica il limite degli scoppi.
  const filteredBubbles = useMemo(() => {
    const eligible = bubbles.filter(b => {
      if(secretOnly && !secretIds.has(b.id)) return false;
      if (!secretOnly && allSecretIds.has(b.id)) return false;
      const name = String(b.username || b.author_username || "").toLowerCase();
      if (blockedUsers.has(name)) return false;
      if (!b.starter && getBubbleAgeStage(bubbleAgeFrom(b)) >= 8) return false;
      if (authorFilter === "all") return true;
      return authorFilter === "favorites" ? favoriteAuthors.has(name) : name === authorFilter;
    });
    return authorFilter === "all" && !secretOnly && discoveryEnabled()
      ? rankDiscoveryBubbles(eligible, { favorites: favoriteAuthors, signals: guestMode ? {} : readDiscoverySignals(uid), scope, seed: uid || "guest" })
      : eligible;
  }, [bubbles, authorFilter, favoriteAuthors, secretOnly, secretIds, allSecretIds, uid, guestMode, scope, discoveryRevision, blockedUsers]);

  const availableAuthors = useMemo(() => {
    const map = new Map();
    favoriteAuthors.forEach(a => {
      const c = String(a || "").trim().toLowerCase();
      if (c) map.set(c, true);
    });
    bubbles.forEach(b => {
      const name = String(b.username || b.author_username || "").trim().toLowerCase();
      if (name && name !== "starter" && name !== "bolle" && !b.starter && !map.has(name)) {
        map.set(name, false);
      }
    });
    return [...map.entries()].map(([username, isFav]) => ({ username, isFav })).sort((a, b) => {
      if (a.isFav && !b.isFav) return -1;
      if (!a.isFav && b.isFav) return 1;
      return a.username.localeCompare(b.username);
    });
  }, [favoriteAuthors, bubbles]);

  // Le bolle restano disponibili: mostriamo un gruppo alla volta per non
  // sovraccaricare Safari e la simulazione fisica con troppi elementi DOM.
  // Il saldo degli scoppi resta gestito esclusivamente dal server.
  useEffect(() => { setFeedVisibleLimit(INITIAL_FEED); }, [scope, radius, authorFilter, secretOnly]);
  const magneticVisuals = authorFilter === "all" && !secretOnly && discoveryEnabled();
  const fieldRef = useRef(null);
  // Ospiti: possono scoppiare fino a GUEST_POPS_PER_KIND bolle per ogni tipologia, poi serve registrarsi.
  const [guestPops, setGuestPops] = useState(() => { try { return JSON.parse(localStorage.getItem("bolle-guest-pops-v1") || "{}") || {}; } catch { return {}; } });
  // Chiudendo una bolla aperta da "Le mie bolle" si torna lì, non alla home.
  useEffect(() => {
    if (viewer) { viewerSeenForReturn.current = true; return; }
    if (returnToProfileView.current && viewerSeenForReturn.current) {
      setProfileView(returnToProfileView.current);
      returnToProfileView.current = null;
      viewerSeenForReturn.current = false;
    }
  }, [viewer]);
  // Tipo di ogni bolla del feed (sondaggio, domanda, GIF…), letto dal server a blocchi e messo in cache.
  const [bubbleKinds, setBubbleKinds] = useState({});
  useEffect(() => {
    const missing = bubbles.map(b => b.id).filter(id => id && !(id in bubbleKinds));
    if (!missing.length) return;
    let alive = true;
    fetchBubbleKinds(missing).then(found => {
      if (!alive) return;
      setBubbleKinds(prev => { const next = { ...prev }; missing.forEach(id => { next[id] = found[id] || null; }); return next; });
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bubbles]);
  const guestKindKey = (b) => { const k = bubbleKinds[b.id] || bubbleKind(b); return k === "video" ? "photo" : k; };
  const guestLeftFor = (b) => Math.max(0, GUEST_POPS_PER_KIND - (guestPops[guestKindKey(b)] || 0));
  const showSystemBubbles = authorFilter === "all" && !secretOnly;
  const systemLeft = systemBubbles.filter(b => !systemPops.has(b.id)).length;
  const visibleBubbles = useMemo(() => {
    const fillers = systemBubbles.filter((b) => !systemPops.has(b.id));
    // Finiti gli scoppi, le bolle di sistema passano davanti: l'utente ha sempre qualcosa da scoprire.
    const pool = showSystemBubbles ? (out && !guestMode ? [...fillers, ...filteredBubbles] : [...filteredBubbles, ...fillers]) : filteredBubbles;
    return pool.slice(0, feedVisibleLimit);
  }, [filteredBubbles, systemBubbles, systemPops, showSystemBubbles, feedVisibleLimit, out, guestMode]);
  const totalAvailableBubbles = filteredBubbles.length + (showSystemBubbles ? systemLeft : 0);

  /* ---------- Home sequenziale: una bolla alla volta (la sezione «Vicino a me» resta con le bolle sparse) ---------- */
  const sequentialHome = SEQ_HOME_DEFAULT && scope === "global";
  const [seqRank, setSeqRank] = useState(null); // null = ranking non disponibile (es. SQL non ancora applicato): nessun filtro
  const [seqHooks, setSeqHooks] = useState({});
  const seqHookAsked = useRef(new Set());
  const bubblesLoaded = bubbles.length > 0;
  useEffect(() => {
    if (!sequentialHome || !ready || !bubblesLoaded) return undefined;
    let alive = true;
    seqApi.sequence(100).then((rows) => { if (alive) setSeqRank(rows); }).catch(() => { if (alive) setSeqRank(null); });
    return () => { alive = false; };
  }, [sequentialHome, ready, bubblesLoaded, refreshKey]);
  const seqMeta = useMemo(() => new Map((seqRank || []).map((r) => [String(r.bubble_id), r])), [seqRank]);
  const seqItems = useMemo(() => {
    if (!sequentialHome) return [];
    const ranked = Array.isArray(seqRank);
    // Se il ranking è disponibile restano solo le bolle che non ho già scoppiato né respinto, ordinate per punteggio.
    const users = filteredBubbles
      .filter((b) => b.starter || !ranked || seqMeta.has(String(b.id)))
      .map((b, i) => ({ b, i, r: seqMeta.get(String(b.id))?.rank_score ?? -1 }));
    if (ranked) users.sort((x, y) => (y.r - x.r) || (x.i - y.i));
    const fillers = showSystemBubbles ? systemBubbles.filter((b) => !systemPops.has(b.id)) : [];
    const pool = out && !guestMode ? [...fillers, ...users.map((u) => u.b)] : [...users.map((u) => u.b), ...fillers];
    return pool.map((b) => {
      const meta = seqMeta.get(String(b.id));
      const sealed = !b.starter && capsuleRemainingMs(b) > 0;
      const sysCat = b.system ? (SYSTEM_CATEGORIES[b.systemCategory] || null) : null;
      return {
        id: b.id,
        kind: b.starter ? "system" : sealed ? "capsule" : (bubbleKinds[b.id] || bubbleKind(b)),
        sealed,
        label: sysCat?.label,
        icon: sysCat?.icon || sysCat?.emoji || undefined,
        hook: seqHooks[b.id] || "",
        preview: sealed ? null : (meta?.preview_blur || null),
        taggedForMe: Boolean(meta?.tagged_for_me),
        tagCount: Number(meta?.tag_count) || 0,
        rare: !b.starter && isRareBubble(b.id),
        look: bubbleLook(hash(String(b.id))),
        faceClass: `${b.starter ? "" : "bl-bubble--user"} ${sysCat ? `bl-bubble--system bl-bubble--sys-${sysCat.id}` : ""} bl-bubble--kind-${b.starter ? "system" : sealed ? "capsule" : (bubbleKinds[b.id] || bubbleKind(b))} ${sealed ? "bl-bubble--capsule" : ""}`,
        _b: b,
      };
    });
  }, [sequentialHome, filteredBubbles, seqRank, seqMeta, systemBubbles, systemPops, showSystemBubbles, out, guestMode, bubbleKinds, seqHooks]);
  // Gancio di domande e «questo o quello»: il testo si legge prima dello scoppio. Si carica solo per le prime 3 bolle della coda.
  useEffect(() => {
    if (!sequentialHome) return;
    seqItems.slice(0, 3).forEach((it) => {
      if ((it.kind !== "question" && it.kind !== "poll") || it.hook || seqHookAsked.current.has(it.id)) return;
      seqHookAsked.current.add(it.id);
      const call = it.kind === "poll"
        ? supabase.rpc("bolle_poll_result", { p_bubble_id: it.id })
        : supabase.rpc("bolle_question_public_v4", { p_bubble_id: it.id });
      Promise.resolve(call).then(({ data, error }) => {
        const row = Array.isArray(data) ? data[0] : data;
        if (error || !row) return;
        const text = it.kind === "poll" ? (row.question || (row.a && row.b ? `${row.a}  o  ${row.b}` : "")) : row.question;
        if (text) setSeqHooks((prev) => ({ ...prev, [it.id]: String(text) }));
      }).catch(() => {});
    });
  }, [sequentialHome, seqItems]);
  // Sessione di apertura: tempo trascorso dentro la bolla e interazioni (base del nuovo ranking). Per le tue bolle non conta.
  useEffect(() => {
    const v = viewer;
    if (!v?.id || v.gift || v.system || v.noSession || v.type === "surprise" || v.type === "capsule") return undefined;
    const rec = { id: null, closed: false, t0: performance.now(), dwell: 0 };
    seqSession.current = rec;
    seqApi.startSession(v.id, v.fromFeed ? (scope === "nearby" ? "nearby" : "home") : "chat").then((sid) => {
      rec.id = sid;
      if (rec.closed && sid) seqApi.endSession(sid, rec.dwell);
    }).catch(() => {});
    return () => {
      rec.closed = true;
      rec.dwell = performance.now() - rec.t0;
      if (rec.id) seqApi.endSession(rec.id, rec.dwell);
      if (seqSession.current === rec) seqSession.current = { id: null };
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewer?.id]);

  // Moto fisico delle bolle interattive: posizioni libere, urti e rimbalzi.
  useEffect(() => {
    const field = fieldRef.current;
    if (!field || !visibleBubbles.length) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    let raf = 0, last = 0, lastRun = 0, tick = 0, overlayOpen = false, nodes = [], bodies = [];
    const localInfluence = neighborhoodMagnetism(visibleBubbles, { enabled: magneticVisuals && scope === "nearby" });
    const rnd = (seed) => { const n = Math.sin(seed * 127.1 + 18.7) * 43758.5453; return n - Math.floor(n); };
    function layout() {
      nodes = [...field.querySelectorAll(':scope > .bl-slot')];
      const width = field.clientWidth;
      if (!width || !nodes.length) return;
      const minR = 25;
      const area = nodes.reduce((a, el) => { const sz = Math.min(parseFloat(getComputedStyle(el).getPropertyValue('--s')) || 70, width * .34); return a + Math.PI * Math.pow(sz / 2 + 10, 2); }, 0);
      const height = Math.max(window.innerHeight * 1.35, Math.ceil(area / Math.max(1, width * .37)), 500);
      field.style.height = `${height}px`;
      const old = new Map(bodies.map(b => [b.id, b]));
      const nextBodies = [];
      nodes.forEach((el, i) => {
        const id = visibleBubbles[i]?.id || i;
        const sz = Math.min(parseFloat(getComputedStyle(el).getPropertyValue('--s')) || 70, width * .34);
        const r0 = Math.max(minR, sz / 2);
        const layer = depthLayer(id, visibleBubbles[i]?.starter);
        const r = r0 * layer.s; // raggio fisico = raggio visibile (dopo la scala di profondità)
        // L'elemento resta alla dimensione piena (testo nitido) e viene rimpicciolito solo via transform.
        el.style.setProperty('width', `${2 * r0}px`, 'important'); el.style.setProperty('height', `${2 * r0}px`, 'important'); el.style.setProperty('--d', `${2 * r0}px`);
        el.style.setProperty('--depth-o', layer.o); el.style.zIndex = 3 - layer.i; el.dataset.depth = layer.i;
        const basePriority = visibleBubbles[i]?.starter ? 0 : magneticPriority(i, filteredBubbles.length, magneticVisuals);
        const density = localInfluence[i] || 0;
        const priority = Math.min(1, basePriority * .7 + density * .3);
        el.classList.toggle("bl-slot--magnetic", priority > 0.35);
        el.style.left = "0px";
        el.style.top = "0px";
        const prev = old.get(id);
        // Distribuzione a righe sfalsate: evita l'ammasso al primo accesso.
        // La precedente map controllava `bodies` (ancora vuoto), quindi non
        // verificava mai le collisioni durante il posizionamento iniziale.
        const columns = Math.max(1, Math.floor(width / Math.max(80, 2*r+12)));
        const row = Math.floor(i / columns);
        const col = i % columns;
        const spacingX = width / columns;
        const xBase = Math.max(r, Math.min(width-r, (col + .5) * spacingX + (row % 2 ? spacingX * .12 : 0)));
        const yBase = Math.max(r, Math.min(height-r, r + 16 + row * (2*r+24)));
        let x = prev ? Math.min(width-r, Math.max(r,prev.x)) : xBase;
        let y = prev ? Math.min(height-r,Math.max(r,prev.y)) : yBase;
        if (!prev) {
          let placed = false;
          for (let attempt=0; attempt<220; attempt++) {
            if (nextBodies.every(b => Math.hypot(x-b.x,y-b.y) >= r+b.r+14)) { placed=true; break; }
            x = r + rnd(i*197+attempt*17+1) * Math.max(0,width-2*r);
            y = r + rnd(i*349+attempt*29+1) * Math.max(0,height-2*r);
          }
          if (!placed) {
            // Preferisci spazio aggiuntivo in verticale anziché sovrapposizioni.
            y = height + r + 16;
            while (nextBodies.some(b => Math.hypot(x-b.x,y-b.y) < r+b.r+14)) y += 2*r+16;
          }
        }
        const angle = rnd(i+61)*Math.PI*2;
        nextBodies.push({id,el,x,y,r,r0,sc:layer.s,priority,vx:prev?.vx ?? Math.cos(angle)*(22+rnd(i+3)*25),vy:prev?.vy ?? Math.sin(angle)*(22+rnd(i+9)*25),phase:i*.79,squash:0});
      });
      bodies = nextBodies;
      const bottom = Math.max(height, ...bodies.map(b => b.y+b.r+20));
      if (bottom > height) field.style.height = `${Math.ceil(bottom)}px`;
      draw();
    }
    function draw() {
      // Parallasse: le bolle lontane scorrono un po' più lente di quelle vicine, dando profondità allo scroll.
      const rect = field.getBoundingClientRect();
      const shift = (rect.top + rect.height / 2 - window.innerHeight / 2) * .09;
      for (const b of bodies) {
        const par = (1 - b.sc) * shift; // vicine (sc=1) ferme, lontane in controtendenza
        // Solo transform (compositor): left/top forzavano layout e paint a ogni frame e causavano gli scatti.
        b.el.style.transform = `translate3d(${(b.x-b.r0).toFixed(1)}px,${(b.y-b.r0+par).toFixed(1)}px,0) scale(${(b.sc*(1+b.squash*.06)).toFixed(3)},${(b.sc*(1-b.squash*.06)).toFixed(3)})`;
      }
    }
    function frame(t) {
      raf = requestAnimationFrame(frame);
      // 30 FPS (15 in modalità eco): a 120 Hz il vecchio ciclo faceva 4 volte il lavoro e il telefono scaldava.
      if (t - lastRun < (document.documentElement.classList.contains("bl-eco") ? 66 : IS_COARSE ? 42 : 32)) return;
      lastRun = t;
      if (++tick % 12 === 0) overlayOpen = Boolean(document.querySelector(".bl-viewer, .bl-sheet-wrap, .bl-gift-overlay"));
      if (overlayOpen) { last = 0; return; } // niente fisica sotto una finestra aperta: non si vede
      if (!last) last=t;
      const dt = Math.min((t-last)/1000,.05); last=t;
      const w=field.clientWidth, h=field.clientHeight;
      if (!reduce.matches && !document.hidden) {
        for (const b of bodies) {
          b.vx += Math.sin(t*.00043+b.phase)*8*dt;
          b.vy += Math.cos(t*.00051+b.phase)*8*dt;
          const speed=Math.hypot(b.vx,b.vy);
          if(speed>58){b.vx*=58/speed;b.vy*=58/speed;}
          b.x+=b.vx*dt;b.y+=b.vy*dt;
          if(b.x<b.r){b.x=b.r;b.vx=Math.abs(b.vx);}
          if(b.x>w-b.r){b.x=w-b.r;b.vx=-Math.abs(b.vx);}
          if(b.y<b.r){b.y=b.r;b.vy=Math.abs(b.vy);}
          if(b.y>h-b.r){b.y=h-b.r;b.vy=-Math.abs(b.vy);}
          b.squash*=Math.pow(.88, dt*30);
        }
        applyMagneticAttraction(bodies, dt, { strength: 16, maxAcceleration: 26 });
        applyDiscoveryDrift(bodies, dt, w, h);
        for (const [i,j] of nearbyPairs(bodies, 3)) {
          const a=bodies[i],b=bodies[j],dx=b.x-a.x,dy=b.y-a.y;
          const d=Math.hypot(dx,dy)||.001, target=a.r+b.r+8;
          if(d>=target)continue;
          const nx=dx/d,ny=dy/d, overlap=target-d;
          a.x-=nx*overlap*.5;b.x+=nx*overlap*.5;
          a.y-=ny*overlap*.5;b.y+=ny*overlap*.5;
          const rel=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;
          if(rel<0){a.vx+=rel*nx*.92;a.vy+=rel*ny*.92;b.vx-=rel*nx*.92;b.vy-=rel*ny*.92;}
          a.squash=b.squash=Math.min(1,overlap/12+.25);
        }
        draw();
      }
    }
    const onScroll = () => { if (!reduce.matches) draw(); };
    window.addEventListener('scroll', onScroll, { passive: true });
    // Culling: le animazioni decorative girano solo sulle (max 14) bolle visibili più vicine al centro dello schermo.
    const onscreen = new Set();
    const MAX_LIVE = IS_COARSE ? 8 : 14;
    const refreshLive = () => {
      const mid = window.innerHeight / 2;
      const ranked = [...onscreen].map(el => { const r = el.getBoundingClientRect(); return [el, Math.abs(r.top + r.height / 2 - mid)]; }).sort((a, b) => a[1] - b[1]);
      const live = new Set(ranked.slice(0, MAX_LIVE).map(x => x[0]));
      nodes.forEach(el => el.classList.toggle('bl-slot--live', live.has(el)));
    };
    const io = typeof IntersectionObserver === 'function' ? new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) onscreen.add(e.target); else onscreen.delete(e.target); });
      refreshLive();
    }, { rootMargin: '80px 0px' }) : null;
    layout();
    nodes.forEach(el => io?.observe(el));
    // Ricalcola solo quando cambia la larghezza: l'altezza viene impostata
    // dal layout stesso e non deve innescare riposizionamenti ripetuti.
    let observedWidth = field.clientWidth;
    const observer = new ResizeObserver(() => {
      const width = field.clientWidth;
      if (width && Math.abs(width-observedWidth) > 1) {
        observedWidth = width;
        layout();
      }
    });
    observer.observe(field);
    const onVisibility = () => {
      cancelAnimationFrame(raf);
      last = 0;
      if (!document.hidden) raf = requestAnimationFrame(frame);
    };
    document.addEventListener("visibilitychange", onVisibility);
    if (!document.hidden) raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      io?.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener('scroll', onScroll);
    };
  }, [visibleBubbles, filteredBubbles.length, magneticVisuals, scope, welcome, ready, giftToken]);

  // Banner di segnalazione condiviso: serve anche nella landing del regalo, che esce prima del render principale.
  const bugBanner = (errorReport || reportThanks) && <div className="bl-bug-banner" role="alert">
        {reportThanks ? <><p>grazie per la tua segnalazione, faremo del nostro meglio per sistemare il problema che hai segnalato al più presto</p><button type="button" onClick={() => setReportThanks(false)}>Chiudi</button></> :
        <form onSubmit={sendErrorReport}><strong>Hai riscontrato un problema?</strong><p>Puoi segnalarlo agli sviluppatori di Bolle.</p><textarea aria-label="Descrivi il problema" placeholder="Descrivi cosa stavi facendo (facoltativo)" value={reportDetails} maxLength={2000} onChange={e => setReportDetails(e.target.value)} /><div><button type="submit" disabled={reportBusy}>{reportBusy ? "Invio…" : "Invia segnalazione"}</button><button type="button" onClick={() => setErrorReport(null)}>Non ora</button></div></form>}
  </div>;
  // Un link regalo è un'esperienza autonoma: nessuna home, login o navigazione prima dell'apertura.
  if (giftToken) return (
    <main className={`bl-root bl-special-theme bl-theme-${activeTheme} bl-gift-landing`}>
      <div className="bl-ambient bl-ambient-a" aria-hidden="true" />
      <div className="bl-ambient bl-ambient-b" aria-hidden="true" />
      <div className={`bl-theme-scene bl-theme-scene--${activeTheme}`} aria-hidden="true">
        {(BOLLE_THEME_DECOR[activeTheme] || []).map((symbol, i) => <span key={i} className={`bl-theme-ornament bl-theme-ornament--${i + 1}`}>{symbol}</span>)}
      </div>
      {giftState !== "opened" && <div className="bl-gift-alone" role="region" aria-label="La tua bolla regalo">
        <button type="button" className={`bl-gift-floating ${giftState === "opening" ? "bl-gift-popping" : ""}`} onClick={redeemGift} disabled={!ready || giftState === "opening"} aria-label="Scoppia la tua bolla regalo">
          <span className="bl-gift-floating-shine" aria-hidden="true" />
          <span className="bl-gift-floating-icon" aria-hidden="true">🫧</span>
        </button>
        <p className="bl-gift-hint">{!ready ? "Prepariamo la tua sorpresa…" : giftState === "opening" ? "La sorpresa si apre…" : "Tocca la bolla per scoprire"}</p>
        {giftError && <div className="bl-gift-failure" role="alert"><p>{giftError}</p><button type="button" onClick={() => { setGiftError(""); setGiftState("ready"); }}>Riprova</button></div>}
      </div>}
      {giftState === "opened" && !viewer && <div className="bl-gift-finish"><p>Ti è piaciuta questa sorpresa?</p><h2>Entra nel mondo di Bolle 🫧</h2><button type="button" className="bl-cta" onClick={() => { setGiftToken(null); window.history.replaceState({}, "", window.location.pathname); if (guestMode) requestAccount(); }}>Scopri Bolle</button><button type="button" className="bl-gift-later" onClick={() => { setGiftToken(null); window.history.replaceState({}, "", window.location.pathname); }}>Non ora</button></div>}
      {viewer?.gift && <Viewer viewer={viewer} onGiftBack={() => { setViewer(null); }} onClose={() => setViewer(null)} onReport={report} onReact={react} reactionBusy={reactionBusy} isFavorite={false} onToggleFavorite={() => {}} onShare={() => {}} onDiscoveryInteraction={() => {}} />}
      {bugBanner}
      <p className="bl-toast" role="status" aria-live="polite">{notice}</p>
    </main>
  );
  if (!ready && !fatal) return <main className={`bl-root ${themeClass}`}><p className="bl-loading">🫧 Ripristino della sessione...</p></main>;
  if (welcome && !giftToken) return <main className={`bl-root ${themeClass}`}><WelcomeScreen onExplore={() => completeWelcome(true)} onRegister={beginRegistration} onLogin={beginLogin} onGoogle={() => googleAuth("login")} /></main>;
  if (fatal) return <main className={`bl-root ${themeClass}`}><p className="bl-fatal">{fatal}</p></main>;

  return (
    <main className={`bl-root ${themeClass} ${galaxyOn ? "bl-has-galaxy" : ""} ${profileView ? "bl-profile-open" : ""}`} onTouchStart={pullTouchStart} onTouchMove={pullTouchMove} onTouchEnd={pullTouchEnd} onTouchCancel={pullTouchEnd}>
      
      
      {galaxyOn && <GalaxyBackdrop palette={galaxyPalette} />}
      <div className="bl-ambient bl-ambient-a" aria-hidden="true" />
      <div className="bl-ambient bl-ambient-b" aria-hidden="true" />
      <div className="bl-ambient bl-ambient-c" aria-hidden="true" />
      {themeChoice === "special" && <div key={activeTheme} className={`bl-theme-scene bl-theme-scene--${activeTheme}`} aria-hidden="true">
        {(BOLLE_THEME_DECOR[activeTheme] || []).map((symbol, i) => <span key={`${activeTheme}-${i}`} className={`bl-theme-ornament bl-theme-ornament--${i + 1}`}>{symbol}</span>)}
      </div>}

      {(pullDistance > 0 || pullRefreshing) && <div className="bl-pull-status" aria-live="polite" style={{ transform: `translateX(-50%) translateY(${Math.min(65, pullDistance)}px)` }}><RefreshCw size={18} className={pullRefreshing ? "bl-spinning" : ""} /> {pullRefreshing ? "Aggiornamento…" : pullDistance >= 65 ? "Rilascia per aggiornare" : "Trascina per aggiornare"}</div>}
      <header className="bl-top">
        <button type="button" className="bl-round bl-brand-home" onClick={() => setInfoOpen(true)} aria-label="Come funziona BOLLE"><img src="/bolle-logo.png" alt="" aria-hidden="true" /></button>
        <div className="bl-counter-wrap">
          <button type="button" className={`bl-counter bl-counter-ring ${me && available <= 3 ? "is-red" : me && available <= 5 ? "is-orange" : ""}`} onPointerDown={(e) => e.stopPropagation()} onClick={() => setCountPop((v) => !v)} aria-label={me ? `Hai a disposizione ${available} bolle` : "Bolle disponibili"} aria-expanded={countPop} title="Bolle rimaste">
            <svg viewBox="0 0 44 44" aria-hidden="true"><circle className="bl-ring-bg" cx="22" cy="22" r="19" /><circle className="bl-ring-fg" cx="22" cy="22" r="19" pathLength="100" strokeDasharray={`${Math.min(100, Math.max(0, dailyLimit ? (available / dailyLimit) * 100 : 0))} 100`} /></svg>
            <strong key={available} className="bl-counter-num">{me ? available : "–"}</strong>
          </button>
          {countPop && <div className="bl-counter-pop" role="status">{me ? `Hai a disposizione ${available} ${available === 1 ? "bolla" : "bolle"}` : "Accedi per scoppiare le bolle"}</div>}
        </div>
        <div className="bl-home-actions">
          <button type="button" className={`bl-round bl-trophy ${profileView === "leaderboard" ? "bl-on" : ""}`} onClick={() => setProfileView("leaderboard")} aria-label="Apri classifiche" aria-pressed={profileView === "leaderboard"} title="Classifiche"><Trophy size={21} /></button>
          <button type="button" className={`bl-round bl-bell ${profileView === "notifications" ? "bl-on" : ""}`} onClick={() => setProfileView("notifications")} aria-label="Apri notifiche" aria-pressed={profileView === "notifications"}><Bell size={21} />{unreadNotifications > 0 && <span className="bl-notification-dot">{Math.min(99, unreadNotifications)}</span>}</button>
          <button type="button" className={`bl-round bl-messages-btn ${profileView === "messages" ? "bl-on" : ""}`} onClick={() => { if (guestMode || !me?.registered) { requestAccount(); return; } openMessages(null); }} aria-label="Apri messaggi" aria-pressed={profileView === "messages"} title="Messaggi"><MessageCircle size={21} />{unreadChatCount > 0 && <span className="bl-notification-dot">{Math.min(99, unreadChatCount)}</span>}</button>
        </div>
        <button type="button" className={`bl-round bl-profile-btn ${profileView && profileView !== "leaderboard" && profileView !== "notifications" ? "bl-on" : ""}`} onClick={() => guestMode ? requestAccount() : setProfileView("menu")} aria-label="Apri il tuo profilo" aria-pressed={!!profileView && profileView !== "leaderboard" && profileView !== "notifications"}>{(!guestMode && me?.registered && myAvatar && myAvatar !== "🫧") ? <span className="bl-profile-btn-avatar"><AvatarImage avatar={myAvatar} /></span> : <CircleUserRound size={23} strokeWidth={1.9} aria-hidden="true" />}</button>
      </header>

      <div className="bl-filter">
        <div className="bl-filter-row">
        <div className="bl-segment" role="group" aria-label="Quali bolle vedere">
          <button className={scope === "global" ? "on" : ""} onClick={() => chooseScope("global")} aria-pressed={scope === "global"}>✧ Tutte</button>
          <button ref={nearBtnRef} type="button" className={`bl-near-btn ${scope === "nearby" ? "on" : ""}`} style={{ touchAction: "none", userSelect: "none", WebkitTouchCallout: "none" }}
            onPointerDown={nearPointerDown} onPointerMove={nearPointerMove} onPointerUp={nearPointerEnd} onPointerCancel={nearPointerEnd} onClick={nearClick} onContextMenu={(e) => e.preventDefault()}
            aria-pressed={scope === "nearby"} aria-haspopup="menu" aria-expanded={radiusOpen} title="Tocca per attivare · tieni premuto per cambiare la distanza">⌖ Vicino a me{scope === "nearby" && <small className="bl-near-radius">{radiusLabel(radius)}</small>}</button>
        </div>
        <div className="bl-author-filter-compact">
          <button 
            type="button" 
            className={`bl-author-star-btn ${authorFilter !== "all" ? "active" : ""}`} 
            onClick={() => setAuthorMenuOpen(o => !o)} 
            aria-label="Filtra per autore" 
            title="Filtra per autore"
          >
            ⭐
          </button>
          {authorMenuOpen && (
            <>
              <div 
                className="bl-author-popover-backdrop" 
                onClick={() => setAuthorMenuOpen(false)}
                onTouchStart={e => { e.stopPropagation(); setAuthorMenuOpen(false); }}
              />
              <div 
                className="bl-author-popover" 
                role="dialog" 
                aria-label="Seleziona autore"
                onPointerDown={e => e.stopPropagation()}
                onTouchStart={e => e.stopPropagation()}
                onClick={e => e.stopPropagation()}
              >
                <div className="bl-author-popover-header">
                  <strong>Filtra per Autore</strong>
                  <button type="button" onClick={() => setAuthorMenuOpen(false)} aria-label="Chiudi filtro autore">×</button>
                </div>
                <input 
                  type="search" 
                  className="bl-author-search-box" 
                  placeholder="Cerca autore…" 
                  value={authorSearchQuery} 
                  onChange={e => setAuthorSearchQuery(e.target.value)}
                />
                <div className="bl-author-popover-list">
                  <button 
                    type="button" 
                    className={`bl-author-item-btn ${authorFilter === "all" ? "active" : ""}`} 
                    onClick={() => { setAuthorFilter("all"); setAuthorMenuOpen(false); }}
                  >
                    <span>✧</span> Tutti gli utenti
                  </button>
                  <button 
                    type="button" 
                    className={`bl-author-item-btn ${authorFilter === "favorites" ? "active" : ""}`} 
                    onClick={() => { setAuthorFilter("favorites"); setAuthorMenuOpen(false); }}
                  >
                    <span>⭐</span> Solo i miei preferiti ({favoriteAuthors.size})
                  </button>
                  {availableAuthors
                    .filter(a => !authorSearchQuery || a.username.includes(authorSearchQuery.toLowerCase()))
                    .map(({ username, isFav }) => (
                      <div key={username} className="bl-author-item-row">
                        <button 
                          type="button" 
                          className={`bl-author-item-btn ${authorFilter === username ? "active" : ""}`} 
                          onClick={() => { setAuthorFilter(username); setAuthorMenuOpen(false); }}
                        >
                          <span>{isFav ? "⭐" : "👤"}</span> @{username}
                        </button>
                        <button
                          type="button"
                          className={`bl-author-fav-toggle ${isFav ? "is-fav" : ""}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(username);
                          }}
                          title={isFav ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
                          aria-label={isFav ? `Rimuovi @${username} dai preferiti` : `Aggiungi @${username} ai preferiti`}
                        >
                          {isFav ? "★" : "☆"}
                        </button>
                      </div>
                    ))}
                  {availableAuthors.filter(a => !authorSearchQuery || a.username.includes(authorSearchQuery.toLowerCase())).length === 0 && (
                    <p className="bl-muted" style={{ padding: "8px", fontSize: "12px", textAlign: "center" }}>Nessun autore trovato</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
        </div>
        <RadiusFan open={radiusOpen && scope === "nearby"} radii={RADII} value={radius} active={radiusAct} originRef={nearBtnRef} onPick={pickRadius} />
      </div>

      {!sequentialHome && <ChaoticBubbleBackground />}
      {sequentialHome && (
        <div
          className="bl-seq-wrap"
          style={{ position: "relative", zIndex: 1, height: "100dvh", boxSizing: "border-box", padding: "calc(140px + env(safe-area-inset-top)) 0 calc(112px + env(safe-area-inset-bottom))" }}
          onTouchStart={(e) => e.stopPropagation()} onTouchMove={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()} onTouchCancel={(e) => e.stopPropagation()}
        >
          <SequentialFeed
            items={seqItems}
            popsLeft={guestMode ? Infinity : available}
            paused={!!viewer || !!profileUser}
            canPop={(it) => Boolean(it.sealed || it._b.starter || guestMode || available > 0)}
            onPop={(it) => pop(it._b)}
            onLimit={() => setOutDismissed(false)}
            onSkip={(it) => { if (!it._b.starter && !it._b.system) seqApi.skip(it.id); }}
            onNudgeNearby={() => chooseScope("nearby")}
            renderEnd={() => (
              <>
                <strong>{loading && bubbles.length === 0 ? "Le bolle stanno arrivando…" : out && !guestMode ? "Per oggi hai finito gli scoppi" : "Hai visto tutte le bolle"}</strong>
                <span>{loading && bubbles.length === 0 ? "Un attimo di pazienza 🫧" : out && !guestMode ? "Domani torni con nuovi scoppi. Intanto pubblica la tua bolla!" : "Torna tra poco: ne arrivano di nuove."}</span>
                {!(loading && bubbles.length === 0) && <button type="button" className="bl-cta" onClick={() => guestMode ? requestAccount() : setComposing(true)}>Pubblica la tua bolla{out && !guestMode ? ` (+${bonusPerPost} scoppi)` : ""}</button>}
                {!(loading && bubbles.length === 0) && <button type="button" className="bl-ghost" onClick={() => chooseScope("nearby")}>Prova «Vicino a me»</button>}
              </>
            )}
          />
        </div>
      )}
      {!sequentialHome && <section ref={fieldRef} className="bl-field bl-field--physics" aria-busy={loading} aria-label="Bolle da scoprire">
        {visibleBubbles.map((b) => (
          <BubbleView key={b.id} bubble={b} bursting={bursting.has(b.id)} locked={!b.starter && (guestMode ? guestLeftFor(b) <= 0 : out)} showDistance={scope === "nearby"} onPop={() => pop(b)} isFavorite={favoriteAuthors.has(String(b.username || b.author_username || "").toLowerCase())} onToggleFavorite={() => toggleFavorite(b.username || b.author_username)} avatar={avatarFor(b.username || b.author_username, avatarMap)} countryCode={bubblePrivacy[b.id]?.show_nationality === false ? null : bubbleCountries[b.id]} onShare={() => shareBubbleWhatsApp(b.id)} isRare={!b.starter && isRareBubble(b.id)} isSecret={secretIds.has(b.id)} kindHint={bubbleKinds[b.id]} />
        ))}
        {loading && bubbles.length === 0 && <div className="bl-loading"><span className="bl-loading-orb" aria-hidden="true" /><p>Le bolle stanno arrivando…</p></div>}
        {!loading && ready && authorFilter !== "all" && filteredBubbles.length === 0 && (
          <p className="bl-note">{favoriteAuthors.size === 0 ? "Non hai ancora autori preferiti. Tocca ☆ su una bolla per aggiungerne uno." : "Nessuna bolla disponibile per questo filtro."}</p>
        )}
        {ready && showSystemBubbles && systemBubbles.length > 0 && systemLeft === 0 && (out || filteredBubbles.length === 0) && <p className="bl-note">Hai scoperto tutte le bolle di oggi ✨ Domani ne arriveranno di nuove.</p>}
        {!loading && ready && scope === "nearby" && bubbles.length === 0 && <p className="bl-note">Nessuna bolla di utenti entro {radius < 1 ? `${Math.round(radius * 1000)} m` : `${radius} km`}.</p>}
      </section>}

      {!sequentialHome && visibleBubbles.length < totalAvailableBubbles && (
        <div className="bl-feed-more">
          <button type="button" className="bl-cta" onClick={() => setFeedVisibleLimit(n => n + 12)}>
            Scopri altre bolle 🫧
          </button>
          <p className="bl-muted">{visibleBubbles.length} di {totalAvailableBubbles} bolle disponibili</p>
        </div>
      )}

      {out && !guestMode && !outDismissed && (
        <div className="bl-out" role="alert">
          <button className="bl-out-x" onClick={() => setOutDismissed(true)} aria-label="Chiudi">×</button>
          <strong>Hai finito le bolle da scoppiare! 🫧</strong>
          <p>Pubblica una tua bolla e ottieni {bonusPerPost} scoppi extra.</p>
          {systemLeft > 0 && <p>Intanto scopri le {systemLeft} bolle di oggi: curiosità, aforismi, motivazione e notizie.</p>}
          <button className="bl-cta" onClick={() => guestMode ? requestAccount() : setComposing(true)}>Crea una bolla (+{bonusPerPost} scoppi)</button>
        </div>
      )}

      <div className="bl-bottom-actions">
        <BubbleFan out={out} bonus={bonusPerPost} locked={guestMode} onTap={() => guestMode ? requestAccount() : setComposing(true)} onPick={fanPick} />
      </div>

      {liveNotification && <div className="bl-live-notification" role="status" aria-live="polite">
        <button type="button" className="bl-live-notification-main" onClick={() => openNotification(liveNotification)}>
          <span aria-hidden="true">{liveNotification.achievement ? "🏆" : liveNotification.kind === "bubble_reply" ? "✉️" : (liveNotification.kind === "chat_message" || liveNotification.kind === "group_message") ? "💬" : liveNotification.kind === "bubble_share" ? "📨" : liveNotification.kind === "bubble_tag" ? "🏷️" : liveNotification.kind === "reaction" ? "💖" : "🫧"}</span><span><strong>{liveNotification.title || "Nuova notifica"}</strong><small>{liveNotification.body || "Apri le notifiche"}</small></span>
        </button>
        <button type="button" className="bl-live-notification-close" onClick={dismissLiveNotification} aria-label="Chiudi notifica">×</button>
      </div>}
      {bugBanner}
      {new URLSearchParams(window.location.search).has("perf") && <FpsProbe />}
      {guestMode && <div className="bl-guest-banner">Ospite: puoi scoppiare {GUEST_POPS_PER_KIND} bolle per tipo <button onClick={requestAccount}>Registrati o accedi</button></div>}
      {authPrompt && <Sheet label="Entra in Bolle" onClose={() => setAuthPrompt(false)} title="Lascia il tuo segno" subtitle="Puoi esplorare liberamente. Per pubblicare e reagire, crea il tuo profilo anonimo.">
        <GuestPermissions />
        <button className="bl-cta" onClick={beginRegistration}>Crea un account</button>
        <button className="bl-google-button" onClick={() => googleAuth("login")}>Continua con Google</button>
        <button className="bl-ghost" onClick={beginLogin}>Ho già un account: accedi</button>
        <button className="bl-link" onClick={() => setAuthPrompt(false)}>Continua a esplorare</button>
      </Sheet>}
      {registrationOpen && <RegistrationSheet username={me?.username} mode={googleRegistration ? "google" : "full"} initialEmail={googleEmail} onClose={() => { setRegistrationOpen(false); if (!guestMode && !me?.registered) setWelcome(true); }} onSubmit={registerComplete} onOpenLogin={() => { setRegistrationOpen(false); beginLogin(); }} />}
      {profileUser && <PublicProfile supabase={supabase} bucket={BUCKET} username={profileUser.username}
  avatarNode={<AvatarImage avatar={avatarFor(profileUser.username, avatarMap)} />}
  viewerOpen={!!viewer} notify={notify} onClose={() => setProfileUser(null)}
  onPop={(t) => pop({ id: t.bubble_id, username: profileUser.username, starter: false })}
  onReopen={(t) => reopenPopped(t, profileUser.username)}
  isFavorite={favoriteAuthors.has(String(profileUser.username).toLowerCase())}
  onToggleFavorite={(u) => toggleFavorite(u)}
  onMessage={(u) => {
    if (guestMode || !me?.registered) { setProfileUser(null); requestAccount(); return; }
    openMessages({ username: u, avatar: avatarFor(u, avatarMap) }, { view: null, profile: profileUser.username });
    setProfileUser(null);
  }} />}
      {adminOpen && <AdminPortal onNotify={notify} onClose={() => setAdminOpen(false)} />}
      {infoOpen && <InfoSheet me={me} onClose={() => setInfoOpen(false)} onTutorial={() => { setInfoOpen(false); setTutorialOpen(true); }} />}
      {tutorialOpen && <TutorialSheet onClose={closeTutorial} />}
      {profileView && (
        <ProfileSheet
          view={profileView} setView={setProfileView} onClose={() => { setProfileView(null); setInitialChat(null); }} me={me} onNotify={notify} initialChat={initialChat} onMessagesBack={leaveMessages}
          onCreate={() => { setProfileView(null); setComposing(true); }}
          onRegister={() => beginRegistration()} onUpgrade={enableMultiDevice} onGoogleLink={() => googleAuth("link")} onLogout={logoutAccount} onDeleteAccount={deleteAccount} onOpenLogin={beginLogin} appearance={appearance} onAppearanceChange={updateAppearance} activeTheme={activeTheme} themeChoice={themeChoice} onThemeChoiceChange={updateThemeChoice} notificationPrefs={notificationPrefs} onNotificationPrefChange={changeNotificationPref} privacyPrefs={privacyPrefs} onPrivacyPrefChange={changePrivacyPref} myAvatar={myAvatar} onSaveAvatar={changeAvatar} onUploadAvatar={uploadAvatar} onNotificationsRead={() => setUnreadNotifications(0)} onUnreadChatsChange={setUnreadChatCount} onOpenNotification={openNotification} onOpenOwnBubble={async (item) => { if (!item?.bubble_id || !item?.media_path) { notify("Contenuto non disponibile"); return; } if (item.chat_username) setInitialChat({ username: item.chat_username, avatar: item.chat_avatar || avatarFor(item.chat_username, avatarMap) }); returnToProfileView.current = profileView || "bubbles"; viewerSeenForReturn.current = false; setProfileView(null); setTimeout(() => { if (!viewerSeenForReturn.current) returnToProfileView.current = null; }, 2500); await openViewer(item.bubble_id, { o_type: item.media_type, o_caption: item.caption, o_path: item.media_path }, { username: me?.username || "", isAuthor: true }); }}
          blockedUsers={blockedUsers} onUnblockUser={unblockUser} avatarMap={avatarMap}
        />
      )}
      {loginOpen && createPortal(
        <LoginSheet onClose={() => setLoginOpen(false)} onLogin={loginAccount} onGoogle={() => googleAuth("login")} />,
        document.body
      )}
      {!guestMode && !registrationOpen && <button type="button" onClick={() => setAdminOpen(true)} aria-label="Portale amministrazione" title="Portale amministrazione" style={{position:"fixed",bottom:12,right:12,zIndex:2,opacity:.35,fontSize:10,border:0,background:"transparent",color:"#665c9a"}}>Admin</button>}

      {(travelToken || travelOpen) && <TravelSheet token={travelToken} onClose={() => {setTravelToken(null);setTravelOpen(false);window.history.replaceState({},"",window.location.pathname);}} onStart={createTravel} onNotify={notify} />}
      {giftToken && giftState !== "opened" && (
        <div className="bl-gift-overlay" role="dialog" aria-modal="true" aria-label="Una bolla per te">
          <div className="bl-gift-card">
            <span className="bl-gift-orb"><Gift size={82} strokeWidth={1.5} aria-hidden="true" /></span>
            <h2>Una bolla per te 💌</h2>
            <p>Qualcuno ti ha lasciato una sorpresa. Tocca per scoprirla!</p>
            {giftError && <p role="alert" className="bl-error">{giftError}</p>}
            <button className="bl-cta" disabled={giftState === "opening" || giftState === "error"} onClick={redeemGift}>{giftState === "opening" ? "La bolla sta scoppiando…" : "💥 Scoppia la tua bolla"}</button>
            <button className="bl-link" onClick={() => { setGiftToken(null); window.history.replaceState({}, "", window.location.pathname); }}>Torna a BOLLE</button>
          </div>
        </div>
      )}
      {viewer && (
        <Viewer viewer={{...viewer, allowFavorites: bubblePrivacy[viewer.id]?.allow_favorites !== false}} onGiftBack={() => { setViewer(null); setGiftToken(null); setProfileView("gift"); }}
          onClose={() => { setViewer(null); if (viewer.gift) setGiftToken(null); }} onReport={report} onReact={react} reactionBusy={reactionBusy}
          isFavorite={favoriteAuthors.has(String(viewer.username || "").toLowerCase())}
          onToggleFavorite={() => toggleFavorite(viewer.username)} onShare={() => shareBubbleWhatsApp(viewer.id)} onDiscoveryInteraction={(action) => rememberDiscovery(viewer.username, action)}
          onSendReply={(text) => chatFromBubble("reply", viewer.username, text, viewer)}
          onShareToUser={(username) => chatFromBubble("share", username, `🫧 Guarda questa bolla su Bolle: ${bubbleShareUrl(viewer.id)}`)}
          favoriteList={[...favoriteAuthors]}
          onBlockUser={blockUser}
          scrollMode={scrollMode} scrollDir={scrollDir} onToggleScroll={viewer.fromFeed ? toggleScrollMode : null} onScrollNav={(dir) => (dir > 0 ? scrollNext() : scrollPrev())}
          onContinueChain={() => {
            const rootId = viewer.chain?.root_bubble_id;
            if (!rootId) return;
            if (guestMode || !me?.registered) { setViewer(null); requestAccount(); return; }
            setViewer(null); setChainRootId(rootId); setComposing(true);
          }}
          onMessage={() => {
            if (guestMode || !me?.registered) { setViewer(null); requestAccount(); return; }
            if (!viewer.username) { notify("Non è possibile avviare la chat: username dell’autore non disponibile."); return; }
            openMessages({ username: viewer.username, avatar: viewer.avatar });
            setViewer(null);
          }} />
      )}
      {chainInvite && !composing && (
        <div className="bl-chain-invite" role="region" aria-label="Invito a una catena di bolle">
          <span>🫧</span><div><strong>Ti hanno passato una Bolla a catena!</strong><small>Aggiungi il tuo contributo e falla arrivare più lontano.</small></div>
          <button type="button" onClick={() => { setChainRootId(chainInvite); if (guestMode || !me?.registered) { requestAccount(); return; } setComposing(true); }}>Partecipa</button>
          <button type="button" className="bl-chain-dismiss" aria-label="Chiudi invito" onClick={() => { setChainInvite(null); setChainRootId(null); const u=new URL(window.location.href);u.searchParams.delete("chain");window.history.replaceState({}, "", u); }}>×</button>
        </div>
      )}
      <input ref={fanFileRef} type="file" accept="image/*,video/*" onChange={onFanFile} aria-hidden="true" tabIndex={-1} style={{ position: "fixed", left: -9999, top: 0, width: 1, height: 1, opacity: 0 }} />
      {composing && !guestMode && <Composer initial={typeof composing === "object" ? composing : null} uid={uid} bonus={bonusPerPost} chainRootId={chainRootId} onClose={() => {setComposing(false);setChainRootId(null);}} onDone={onPublished} daily={daily} />}
      <p className="bl-toast" role="status" aria-live="polite">{notice}</p>
    </main>
  );
}

/* Sonda FPS (apri l'app con ?perf=1): mostra FPS, FPS minimi e bolle animate, e li scrive in console. */
function FpsProbe() {
  const [s, setS] = useState({ fps: 0, min: 0, live: 0 });
  useEffect(() => {
    let raf = 0, frames = 0, last = performance.now(), min = Infinity;
    const tick = (t) => {
      frames++;
      if (t - last >= 1000) {
        const fps = Math.round(frames * 1000 / (t - last)); min = Math.min(min, fps);
        const live = document.querySelectorAll(".bl-slot--live").length;
        setS({ fps, min, live }); console.info(`[bolle perf] ${fps} fps (min ${min}) · bolle animate: ${live}`);
        frames = 0; last = t;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <div className="bl-fps-probe" role="status">{s.fps} fps · min {s.min === Infinity ? "–" : s.min} · animate {s.live}</div>;
}

/* Benvenuto al primo accesso: il profilo esistente usa username anonimo e PIN. */
function WelcomeScreen({ onExplore, onRegister, onLogin, onGoogle }) {
  return <section className="bl-welcome" aria-label="Benvenuto in Bolle">
    <div className="bl-welcome-glow" aria-hidden="true" />
    <div className="bl-welcome-wordmark" aria-label="Bolle"><span>B</span><span className="bl-wordmark-bubble" aria-hidden="true" /><span>lle</span></div>
    <div className="bl-welcome-copy"><span className="bl-welcome-eyebrow">UN UNIVERSO DI PICCOLE SORPRESE</span>
      <p>Un piccolo pensiero può arrivare lontano.</p>
      <small>Scopri storie, emozioni e sorprese lasciate da persone come te.</small></div>
    <div className="bl-welcome-actions">
      <button type="button" className="bl-welcome-primary" onClick={onExplore}>Esplora Bolle <span aria-hidden="true">→</span></button>
      <button type="button" className="bl-welcome-secondary" onClick={onRegister}>Crea un account</button>
      <button type="button" className="bl-google-button" onClick={onGoogle}>Continua con Google</button>
      <button type="button" className="bl-welcome-link" onClick={onLogin}>Hai già un account? <strong>Accedi</strong></button>
      <span className="bl-welcome-privacy">Puoi esplorare senza registrarti.</span>
    </div>
  </section>;
}

const TUTORIAL_STEPS = [
  { icon: "🫧", title: "Benvenuto in Bolle", text: "Ogni bolla nasconde un momento, una storia o una sorpresa. Esplora liberamente e lasciati incuriosire." },
  { icon: "👆", title: "Tocca e scopri", text: "Scegli una bolla per aprirla. Puoi trascinarla e chiuderla con un gesto. Hai un numero di scoppi disponibili ogni giorno." },
  { icon: "✨", title: "Crea la tua bolla", text: "Con il pulsante + puoi condividere pensieri, immagini, GIF, domande e sondaggi. Pubblicare ti regala anche scoppi extra." },
  { icon: "📍", title: "Segui il magnetismo", text: "Passa da Tutte a Vicino a me per scoprire bolle nei dintorni. Scegli la distanza: la tua posizione esatta non viene mostrata." },
  { icon: "💬", title: "Partecipa alla conversazione", text: "Rispondi alle domande, vota nei sondaggi e lascia reazioni. Le notifiche ti aiutano a seguire le interazioni." },
  { icon: "💜", title: "Trova la tua community", text: "Segui i tuoi autori preferiti e scopri le classifiche. Il tuo username resta anonimo. Puoi riaprire questa guida dalle Informazioni." },
];
function TutorialSheet({ onClose }) {
  const [step, setStep] = useState(0);
  const touchStart = useRef(null);
  const current = TUTORIAL_STEPS[step];
  function onTouchStart(e) { touchStart.current = { x: e.touches[0]?.clientX, y: e.touches[0]?.clientY }; }
  function onTouchEnd(e) {
    if (!touchStart.current) return;
    const dx = (e.changedTouches[0]?.clientX ?? touchStart.current.x) - touchStart.current.x;
    const dy = (e.changedTouches[0]?.clientY ?? touchStart.current.y) - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy) * 1.3) return;
    setStep(n => Math.max(0, Math.min(TUTORIAL_STEPS.length - 1, n + (dx < 0 ? 1 : -1))));
  }
  useEscape(onClose);
  return <Sheet label="Tutorial Bolle" title="Scopri Bolle" subtitle="Il tuo universo, in sei piccoli passi." onClose={onClose}>
    <div className="bl-tutorial" aria-live="polite" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="bl-tutorial-art" aria-hidden="true"><span>{current.icon}</span><i /><i /><i /></div>
      <span className="bl-tutorial-count">PASSO {step + 1} DI {TUTORIAL_STEPS.length}</span>
      <h3>{current.title}</h3><p>{current.text}</p>
      <div className="bl-tutorial-dots" role="group" aria-label="Passaggi del tutorial">{TUTORIAL_STEPS.map((_, i) => <button type="button" key={i} className={i === step ? "active" : ""} aria-label={`Vai al passo ${i + 1}`} aria-current={i === step ? "step" : undefined} onClick={() => setStep(i)} />)}</div>
      <div className="bl-tutorial-actions">
        {step > 0 ? <button type="button" className="bl-tutorial-back" onClick={() => setStep(s => s - 1)}>‹ Indietro</button> : <button type="button" className="bl-tutorial-back" onClick={onClose}>Salta</button>}
        {step === TUTORIAL_STEPS.length - 1 ? <button type="button" className="bl-cta" onClick={onClose}>Inizia a esplorare 🫧</button> : <span className="bl-tutorial-swipe-hint">Scorri per continuare →</span>}
      </div>
    </div>
  </Sheet>;
}

/* ====================== Finestra "Come funziona" ====================== */
function InfoSheet({ me, onClose, onTutorial }) {
  useEscape(onClose);
  const daily = me?.daily_limit ?? "–", bonus = me?.bonus_per_post ?? 2;
  const rows = [
    [<Hand />, "Tocca per scoppiare", "Scegli una bolla e toccala per scoprire cosa nasconde. Puoi anche trascinarla."],
    [<Orbit />, "Magnetismo delle Bolle", "Le bolle si muovono e si attraggono come piccoli corpi magnetici. Attiva «Vicino a me» per esplorare quelle pubblicate nei tuoi dintorni: più bolle ci sono nella zona, più incontri e sorprese puoi scoprire. La posizione esatta non viene mostrata agli altri."],
    [<Circle />, `${daily} scoppi al giorno`, "Ogni giorno hai a disposizione un numero di bolle da aprire. Una bolla scoppiata non si riapre."],
    [<Plus />, `Pubblica e ottieni +${bonus}`, `Quando finiscono, crea una tua bolla: ogni pubblicazione ti regala ${bonus} scoppi extra.`],
    [<VenetianMask />, "Tutto anonimo", "Gli altri vedono solo il tuo username generato automaticamente, mai i tuoi dati."],
    [<Trophy />, "Classifiche", "Più aperture ricevono le tue bolle, più sali in classifica. Le trovi nella home."],
    [<span>💜</span>, "Reazioni Segrete", "Puoi reagire alle bolle con un'emozione. L'autore riceve una notifica senza conoscere l'identità di chi ha reagito."],
    [<span>📍</span>, "Vicino a me", "Scegli una distanza per scoprire le bolle disponibili nei dintorni. La posizione non è mostrata agli altri."],
    [<span>🌟</span>, "Bolle rare", "Circa una bolla su venti è rara: la riconosci dal bordo dorato e dall'etichetta RARA. La rarità è assegnata dal sistema in modo casuale, in base all'identificativo della bolla: non si può scegliere né comprare. Se la scoppi ricevi scoppi bonus extra (di norma 3), che si sommano a quelli del giorno."],
    [<span>🎨</span>, "Il colore dice cosa c'è dentro", "Il bordo della bolla cambia colore in base al contenuto: azzurro foto e video, verde acqua GIF, ambra sondaggi, rosa domande, giallo meme, celeste pensieri, viola confessioni, turchese «2 verità e 1 bugia», arancio voti. Le capsule del tempo restano un mistero finché il timer non arriva a zero."],
    [<span>🎭</span>, "Tanti tipi di bolla", "Oltre a foto e video puoi pubblicare GIF e meme, pensieri, confessioni, sondaggi (anche tra due foto), domande, «2 verità e 1 bugia» e bolle da votare. Con la capsula del tempo scegli quando si apre la tua bolla."],
  ];
  return (
    <Sheet label="Come funziona BOLLE" onClose={onClose} title="Come funziona" subtitle="Piccoli momenti, grandi sorprese.">
      <button type="button" className="bl-tutorial-entry" onClick={onTutorial}><span aria-hidden="true">📖</span><span><strong>Scopri Bolle · Tutorial</strong><small>Una guida interattiva per iniziare, passo dopo passo</small></span><span aria-hidden="true">›</span></button>
      <ul className="bl-how">{rows.map(([i, t, d]) => <li key={t}><span aria-hidden="true">{i}</span><div><strong>{t}</strong><p>{d}</p></div></li>)}</ul>
      <button className="bl-cta" onClick={onClose}>Ho capito</button>
    </Sheet>
  );
}

/* ====================== Profilo (hub) ====================== */
const VIEW_TITLES = { bubbles: "Le mie bolle", stats: "Le mie statistiche", gift: "Regala una bolla", leaderboard: "Classifiche", settings: "Impostazioni", personal: "Dati personali", admirers: "Chi mi ha aggiunto ai preferiti", avatar: "Scegli il tuo avatar", notifications: "Notifiche", messages: "Messaggi", legal: "Privacy, termini e filosofia" };

function ProfileSheet({ view, setView, onClose, me, onNotify, initialChat, onMessagesBack, onCreate, onRegister, onUpgrade, onGoogleLink, onLogout, onDeleteAccount, onOpenLogin, appearance, onAppearanceChange, activeTheme, themeChoice, onThemeChoiceChange, notificationPrefs, onNotificationPrefChange, privacyPrefs, onPrivacyPrefChange, myAvatar, onSaveAvatar, onUploadAvatar, onNotificationsRead, onUnreadChatsChange, onOpenNotification, onOpenOwnBubble, blockedUsers, onUnblockUser, avatarMap = {} }) {
  const [items, setItems] = useState(null);
  const [deletedIds, setDeletedIds] = useState(() => new Set());
  const [deletingId, setDeletingId] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  async function deleteOwnBubble(id) {
    if (deletingId) return; // la conferma è chiesta da BubblesView prima di arrivare qui
    setDeletingId(id);
    try {
      const { data, error } = await supabase.rpc("bolle_delete_my_bubble", { p_bubble_id: id });
      if (error) throw error;
      if (!data) throw new Error("Bolla già eliminata o non disponibile.");
      setDeletedIds(prev => new Set([...prev, id]));
      setItems(prev => Array.isArray(prev) ? prev.filter(x => x.bubble_id !== id) : prev);
      onNotify("Bolla eliminata dalla pubblicazione 🫧");
    } catch (e) { onNotify(`Impossibile eliminare la bolla: ${e.message}`); }
    finally { setDeletingId(null); }
  }
  const [loading, setLoading] = useState(false);
  const needsData = view === "menu" || view === "bubbles" || view === "stats" || view === "gift";
  useEffect(() => {
    if (!needsData) return;
    let alive = true;
    setLoading(true);
    supabase.rpc("my_bubbles_media_dashboard").then(async ({ data, error }) => {
      if (!alive) return;
      setLoading(false);
      if (error) { console.error("Errore Le mie bolle:", error); onNotify(`Impossibile caricare i dati: ${error.message}`); setItems([]); return; }
      const kinds = await fetchBubbleKinds((data || []).map(r => r.bubble_id));
      if (!alive) return;
      const rows = (data || []).map(r => ({ ...r, kind: kinds[r.bubble_id] || r.kind }));
      // I file restano privati: gli URL temporanei vengono richiesti soltanto per il proprietario.
      const withPreviews = await Promise.all(rows.map(async (row) => {
        // Solo le foto hanno una miniatura reale: video e GIF scaricherebbero il file intero, quindi mostrano l'icona del tipo.
        if (!row.media_path || bubbleKind(row) !== "photo") return { ...row, previewUrl: null };
        try { return { ...row, previewUrl: await cachedSignedUrl(row.media_path, 3600) }; }
        catch { return { ...row, previewUrl: null }; }
      }));
      if (alive) setItems(withPreviews);
    });
    return () => { alive = false; };
  }, [needsData, view, onNotify]);

  const entries = useMemo(() => (Array.isArray(items) ? items : []).filter(item => !deletedIds.has(item.bubble_id)).map((item) => ({
    ...item,
    opensCount: Math.max(0, Number(item.opens) || 0),
    reactionsCount: REACTIONS.reduce((sum, r) => sum + Math.max(0, Number(item[r.key]) || 0), 0),
  })), [items, deletedIds]);

  const isMenu = view === "menu";
  const isMessages = view === "messages";
  const chatAvatar = activeChat ? (activeChat.avatar || avatarFor(activeChat.username, avatarMap) || "🫧") : null;
  const sheetTitle = isMenu
    ? "Profilo"
    : isMessages && activeChat
      ? (!activeChat.isGroup
          ? (
            <div className="bl-chat-header-user">
              <button
                type="button"
                className="bl-chat-header-user-btn"
                onClick={() => openUserProfile(activeChat.username)}
                aria-label={`Profilo di @${activeChat.username}`}
                title={`Apri profilo di @${activeChat.username}`}
              >
                <span className="bl-chat-header-avatar-wrap">
                  <AvatarImage avatar={chatAvatar} className="bl-chat-header-avatar" />
                </span>
                <span className="bl-chat-header-username">@{activeChat.username}</span>
              </button>
            </div>
          )
          : (
            <div className="bl-chat-header-group">
              <span className="bl-chat-header-group-avatar" aria-hidden="true">
                <Users size={19} />
              </span>
              <div className="bl-chat-header-group-info">
                <strong className="bl-chat-header-group-name">{activeChat.name || "Gruppo"}</strong>
                <small className="bl-chat-header-group-members">{activeChat.members?.length || 2} componenti</small>
              </div>
            </div>
          )
        )
      : VIEW_TITLES[view];

  const sheetHeaderRight = isMessages && activeChat
    ? (
      <button
        type="button"
        className="bl-sheet-x bl-chat-group-header-btn"
        onClick={() => setGroupModalOpen(true)}
        aria-label={activeChat.isGroup ? "Componenti del gruppo" : "Crea gruppo con questo utente"}
        title={activeChat.isGroup ? "Componenti del gruppo" : "Crea gruppo con questo utente"}
      >
        <Users size={19} />
      </button>
    )
    : null;

  const sheetBack = isMenu
    ? null
    : isMessages && activeChat
      ? () => { setActiveChat(null); setGroupModalOpen(false); }
      : isMessages && onMessagesBack
        ? onMessagesBack
        : () => setView("menu");

  const menu = [
    ["bubbles", <Circle />, "Le mie bolle", "Visualizza le bolle che hai pubblicato."],
    ["gift", <Gift />, "Regala una bolla", "Scegli una tua storia e sorprendi qualcuno."],
    ["admirers", <Users />, "Chi mi ha aggiunto ⭐", "Scopri chi ti ha inserito tra i preferiti."],
    ["settings", <Settings />, "Impostazioni", "Account, accesso e filtri."],
    ["legal", <ShieldCheck />, "Privacy, termini e filosofia", "Come funziona Bolle e come vengono trattati i dati."],
  ];
  return (
    <Sheet label="Il mio profilo" onClose={onClose} wide
      title={sheetTitle}
      subtitle={null}
      headerRight={sheetHeaderRight}
      onBack={sheetBack}>
      {isMenu && <div className="bl-profile-hub">
        <section className="bl-profile-identity" aria-label="La tua identità su Bolle">
          <button type="button" className="bl-profile-avatar bl-profile-avatar-button" onClick={() => setView("avatar")} aria-label="Modifica immagine del profilo"><AvatarImage avatar={myAvatar} /><span className="bl-avatar-edit-indicator" aria-hidden="true">✎</span></button>
          <div className="bl-profile-identity-copy">
            <h3>{me?.username ? <button type="button" className="bl-user-link" onClick={() => openUserProfile(me.username)}>@{me.username}</button> : "@ospite"}</h3>
            
            <div className="bl-profile-links"><button type="button" className="bl-profile-edit-link" onClick={() => setView("personal")}>Dati personali</button>
            </div>
          </div>
        </section>
        <section className="bl-profile-activity" aria-label="Riepilogo attività">
          <div className="bl-profile-section-heading"><span>Il tuo andamento</span><button type="button" onClick={() => setView("stats")}>Apri statistiche <span aria-hidden="true">›</span></button></div>
          <div className="bl-profile-metrics">
            <div><strong>{me?.available ?? "–"}</strong><span>Scoppi rimasti</span></div>
            <div><strong>{me?.opens_week ?? "–"}</strong><span>Aperture questa settimana</span></div>
            <div><strong>{me?.bubbles_count ?? "–"}</strong><span>Bolle pubblicate</span></div>
          </div>
        </section>
        {me?.registered && <GoogleAccountBadge />}
        <nav className="bl-menu bl-profile-menu" aria-label="Strumenti del profilo">
          <div className="bl-profile-section-heading"><span>Il tuo universo</span></div>
          <div className="bl-menu-group">
            {menu.filter(([key]) => ["bubbles", "stats", "gift"].includes(key)).map(([key, icon, name, desc]) => (
              <button key={key} onClick={() => setView(key)}><span aria-hidden="true">{icon}</span><div><strong>{name}</strong><small>{desc}</small></div><i aria-hidden="true">›</i></button>
            ))}
          </div>
          <div className="bl-profile-section-heading"><span>Account e preferenze</span></div>
          <div className="bl-menu-group">
            {menu.filter(([key]) => !["bubbles", "stats", "gift"].includes(key)).map(([key, icon, name, desc]) => (
              <button key={key} onClick={() => setView(key)}><span aria-hidden="true">{icon}</span><div><strong>{name}</strong><small>{desc}</small></div><i aria-hidden="true">›</i></button>
            ))}
          </div>
        </nav>
        <section className="bl-profile-achievements">
          {loading ? <p className="bl-muted">Prepariamo i tuoi badge…</p> : <ProfileBadges entries={entries} me={me} />}
        </section>
      </div>}
      {needsData && loading && <p className="bl-muted">Caricamento del tuo universo…</p>}
      {view === "bubbles" && !loading && <BubblesView entries={entries} onCreate={onCreate} onOpenBubble={onOpenOwnBubble} onDelete={deleteOwnBubble} deletingId={deletingId} />}
      {view === "stats" && !loading && <StatsView entries={entries} me={me} onCreate={onCreate} onNotify={onNotify} onOpenBubble={onOpenOwnBubble} />}
      {view === "gift" && !loading && <GiftView entries={entries} onCreate={onCreate} onNotify={onNotify} />}
      {view === "leaderboard" && <LeaderboardView onNotify={onNotify} />}
      {view === "avatar" && <div className="bl-avatar-picker"><p>Scegli un emoji o una fotografia: sarà visibile anche agli altri utenti.</p><label className="bl-avatar-upload">📷 Carica una fotografia<input type="file" accept="image/jpeg,image/png,image/webp" onChange={async e => { const file = e.target.files?.[0]; e.target.value = ""; if (file) await onUploadAvatar(file); }} /></label><small className="bl-muted">JPG, PNG o WebP · massimo 2 MB</small><div className="bl-avatar-grid">{AVATARS.map(a => <button type="button" key={a} aria-label={`Scegli avatar ${a}`} aria-pressed={myAvatar === a} className={myAvatar === a ? "selected" : ""} onClick={() => onSaveAvatar(a)}>{a}</button>)}</div><button type="button" className="bl-avatar-remove" onClick={() => onSaveAvatar("🫧")}>🗑️ Rimuovi avatar</button></div>}
      {view === "notifications" && <NotificationsView me={me} notificationPrefs={notificationPrefs} onRead={onNotificationsRead} onNotify={onNotify} onOpenNotification={onOpenNotification} />}
      {view === "messages" && <MessagesView me={me} initialChat={initialChat} onNotify={onNotify} onUnreadCountChange={onUnreadChatsChange} onOpenOwnBubble={onOpenOwnBubble} onExit={onMessagesBack} avatarMap={avatarMap} activeChat={activeChat} onActiveChatChange={setActiveChat} groupModalOpen={groupModalOpen} onGroupModalOpenChange={setGroupModalOpen} />}
      {view === "personal" && <PersonalDataView me={me} onNotify={onNotify} />}
      {view === "admirers" && <AdmirersView onNotify={onNotify} />}
      {view === "legal" && <LegalInfoView />}
      {view === "settings" && <SettingsView me={me}
        onRegister={onRegister} onUpgrade={onUpgrade} onGoogleLink={onGoogleLink} onLogout={onLogout} onDeleteAccount={onDeleteAccount} onOpenLogin={onOpenLogin} appearance={appearance} onAppearanceChange={onAppearanceChange} activeTheme={activeTheme} themeChoice={themeChoice} onThemeChoiceChange={onThemeChoiceChange} notificationPrefs={notificationPrefs} onNotificationPrefChange={onNotificationPrefChange} privacyPrefs={privacyPrefs} onPrivacyPrefChange={onPrivacyPrefChange}
        blockedUsers={blockedUsers} onUnblockUser={onUnblockUser} />}
    </Sheet>
  );
}

function NotificationsView({ me, notificationPrefs, onRead, onNotify, onOpenNotification }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(null);
  const [filter, setFilter] = useState("all");
  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error: err } = await supabase.rpc("bolle_my_notifications_v4");
      if (!active) return;
      setLoading(false);
      if (err) { setError("Impossibile caricare le notifiche. Esegui prima la migrazione SQL Fase 3."); return; }
      let tagItems = [];
      try {
        const { data: tg } = await supabase.rpc("bolle_my_tag_notifications");
        tagItems = (tg || []).map(tagNotificationItem);
      } catch { /* SQL dei tag non ancora applicato */ }
      setItems([...(data || []), ...tagItems]);
      await supabase.rpc("bolle_mark_notifications_read");
      try { await supabase.rpc("bolle_mark_tags_seen"); } catch { /* idem */ }
      onRead?.();
    })();
    return () => { active = false; };
  }, []);
  async function decide(n, accept) {
    if (busy !== null) return;
    setBusy(n.id);
    const { error: err } = await supabase.rpc("bolle_decide_favorite", { p_notification_id: n.id, p_accept: accept });
    setBusy(null);
    if (err) return onNotify?.(err.message || "Operazione non riuscita");
    setItems(prev => prev.map(item => item.id === n.id ? { ...item, kind: "favorite_added_decided" } : item));
    onNotify?.(accept ? "❤️ Preferito ricambiato" : "Richiesta rifiutata e utente bloccato dai preferiti");
  }
  if (loading) return <p className="bl-muted">Caricamento notifiche…</p>;
  if (error) return <p className="bl-error" role="alert">{error}</p>;
  // I traguardi vivono sul dispositivo: si fondono con le notifiche del server in ordine cronologico.
  const allItems = [...items, ...readAchievementLog(me), ...readChatNotifLog(me)].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  const visibleItems = allItems.filter(n => notificationPrefs?.[notificationCategory(n.kind)] !== false);
  const filterTabs = [{id:"all",label:"Tutte"},{id:"reactions",label:"💖 Mi piace"},{id:"messages",label:"✉️ Messaggi"},{id:"new_bubbles",label:"🫧 Nuove bolle"},{id:"polls",label:"📊 Sondaggi"},{id:"answers",label:"💬 Domande"},{id:"favorites",label:"⭐ Preferiti"},{id:"tags",label:"🏷️ Tag"},{id:"gifts",label:"🎁 Regali"},{id:"achievements",label:"🏆 Traguardi"}];
  const tabCount = id => id === "all" ? visibleItems.length : visibleItems.filter(n => notificationCategory(n.kind) === id).length;
  const filteredItems = visibleItems.filter(n => filter === "all" || notificationCategory(n.kind) === filter);
  return <div className="bl-notifications"><div className="bl-notification-filters" role="group" aria-label="Filtra notifiche">{filterTabs.map(tab => <button type="button" key={tab.id} className={filter === tab.id ? "active" : ""} aria-pressed={filter === tab.id} onClick={() => setFilter(tab.id)}>{tab.label}{tabCount(tab.id) > 0 && <em className="bl-filter-count">{tabCount(tab.id)}</em>}</button>)}</div>{filteredItems.length === 0 ? <p className="bl-muted">{filter === "all" ? "Non hai ancora notifiche 🫧" : "Nessuna notifica in questa categoria 🫧"}</p> : filteredItems.map(n => <article key={n.id} className={`bl-notification ${n.is_read ? "" : "unread"} ${notifOpenable(n) ? "bl-clickable" : ""}`} onClick={notifOpenable(n) ? () => onOpenNotification?.(n) : undefined} onKeyDown={notifOpenable(n) ? e => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onOpenNotification?.(n); } } : undefined} role={notifOpenable(n) ? "button" : undefined} tabIndex={notifOpenable(n) ? 0 : undefined} aria-label={notifOpenable(n) ? `${n.title}. Tocca per aprire` : undefined}><span>{n.kind === "favorite_removed" || n.kind === "favorite_rejected" ? "💔" : n.kind.startsWith("favorite") ? "⭐" : n.kind === "gift_opened" ? "🎁" : n.kind === "achievement" ? "🏆" : n.kind === "bubble_reply" ? "✉️" : n.kind === "bubble_share" ? "📨" : (n.kind === "group_added" || n.kind === "group_message") ? "👥" : n.kind === "reaction" ? "💖" : n.kind === "question_answer" ? "💬" : n.kind === "poll_vote" ? "⚡" : n.kind === "bubble_tag" ? "🏷️" : n.kind === "bubble_tag_removed" ? "🏷️" : "🫧"}</span><div><strong><UserLinkText text={n.title} /></strong><p><GifAnswer value={n.body}/></p><small>{new Date(n.created_at).toLocaleString("it-IT")}</small>{n.kind === "favorite_added" && <div className="bl-v4-notification-actions"><button disabled={busy !== null} onClick={e => { e.stopPropagation(); decide(n, true); }}>❤️ Ricambia</button><button disabled={busy !== null} onClick={e => { e.stopPropagation(); decide(n, false); }}>✕ Rifiuta</button></div>}{n.kind === "favorite_added_decided" && <small>Richiesta gestita</small>}</div></article>)}</div>;
}

function AdmirersView({ onNotify }) {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(null);
  const [busy, setBusy] = useState(null);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    supabase.rpc("bolle_my_admirers").then(({ data, error: rpcError }) => {
      if (!active) return;
      setLoading(false);
      if (rpcError) { setError(rpcError.message); return; }
      setPeople(data || []);
    });
    return () => { active = false; };
  }, []);
  async function removeAdmirer(person) {
    if (busy) return;
    if (confirming !== person.username) { setConfirming(person.username); return; }
    setBusy(person.username);
    const { error: rpcError } = await supabase.rpc("bolle_remove_admirer", { p_username: person.username });
    setBusy(null);
    setConfirming(null);
    if (rpcError) return onNotify?.(errorText(rpcError));
    setPeople(prev => prev.filter(p => p.username !== person.username));
    onNotify?.(`@${person.username} rimosso. Gli abbiamo inviato una notifica.`);
  }
  return <div className="bl-admirers" onClick={() => setConfirming(null)}>
    <div className="bl-admirers-intro"><span aria-hidden="true">⭐</span>
      <h3>Chi ti segue tra le bolle</h3>
      <p>Questi utenti hanno aggiunto il tuo username ai loro preferiti. L'elenco è visibile soltanto a te. Con «Rimuovi» togli il tuo username dai loro preferiti e li avvisiamo con una notifica.</p>
    </div>
    {loading ? <p className="bl-muted">Caricamento preferiti…</p> : error ?
      <p role="alert" className="bl-muted">Impossibile caricare l'elenco: {error}</p> :
      people.length === 0 ? <p className="bl-muted">Nessuno ti ha ancora aggiunto ai preferiti.</p> : <>
        <p className="bl-admirers-count">⭐ {people.length} {people.length === 1 ? "utente ti ha" : "utenti ti hanno"} aggiunto ai preferiti</p>
        <ul className="bl-admirers-list">{people.map(person =>
          <li key={person.username}><span aria-hidden="true">⭐</span><strong><button type="button" className="bl-user-link" onClick={(e) => { e.stopPropagation(); openUserProfile(person.username); }}>@{person.username}</button></strong>
            <button type="button" className={`bl-admirer-remove ${confirming === person.username ? "confirm" : ""}`} disabled={busy !== null} aria-label={`Rimuovi @${person.username} da chi ti ha aggiunto ai preferiti`} onClick={e => { e.stopPropagation(); removeAdmirer(person); }}>{busy === person.username ? "…" : confirming === person.username ? "Conferma" : "Rimuovi"}</button>
          </li>
        )}</ul>
      </>}
  </div>;
}

function EmptyMine({ onCreate }) {
  return <div className="bl-insights-empty"><span><Waves size={54} strokeWidth={1.7} aria-hidden="true" /></span><h3>Il tuo universo ti aspetta</h3><p>Pubblica la tua prima bolla e guarda crescere qui le sue scoperte.</p><button type="button" className="bl-cta" onClick={onCreate}>Crea la prima bolla</button></div>;
}

const KNOWN_KINDS = ["photo", "video", "gif", "poll", "question", "meme", "thought", "confession", "truth", "rating"];
function bubbleKind(item) {
  // 1) Tipo salvato alla pubblicazione (colonna bubbles.kind): è la fonte di verità.
  if (KNOWN_KINDS.includes(item?.kind)) return item.kind;
  // 2) Riserva per bolle senza tipo salvato.
  const raw = String(item?.media_type || item?.type || item?.bubble_type || item?.content_type || "").toLowerCase();
  if (raw.includes("truth") || raw.includes("bugia") || item?.lie_index != null || item?.truth_id || item?.statement_1 || item?.s1) return "truth";
  if (raw.includes("rating") || item?.rating_id || item?.rating_prompt) return "rating";
  if (raw.includes("poll") || raw.includes("sondag") || item?.poll_id || item?.option_a) return "poll";
  if (raw.includes("question") || raw.includes("domanda") || item?.question_id || item?.question) return "question";
  if (raw.includes("gif") || item?.gif_url || /\.gif$/i.test(String(item?.media_path || ""))) return "gif";
  if (raw.includes("quote") || raw.includes("citazione")) return "thought";
  if (raw.includes("video")) return "video";
  return "photo";
}
/* Recupera il tipo dal server per un elenco di bolle (a blocchi). Se la funzione non esiste ancora, torna {} e vale la riserva. */
async function fetchBubbleKinds(ids) {
  const out = {};
  const unique = [...new Set((ids || []).filter(id => id && !String(id).startsWith("starter-")))];
  for (let i = 0; i < unique.length; i += 200) {
    try {
      const { data, error } = await supabase.rpc("bolle_bubble_kinds", { p_ids: unique.slice(i, i + 200) });
      if (error || !Array.isArray(data)) return out;
      data.forEach(r => { out[r.bubble_id] = r.kind; });
    } catch { return out; }
  }
  return out;
}
/* GIF: disegna soltanto il primo fotogramma (nessuna animazione nelle anteprime). */
function StillFrame({ src }) {
  const ref = useRef(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true; setFailed(false);
    const img = new Image();
    img.onload = () => {
      const c = ref.current; if (!alive || !c) return;
      const w = img.naturalWidth || 1, h = img.naturalHeight || 1, s = Math.min(1, 180 / Math.max(w, h));
      c.width = Math.max(1, Math.round(w * s)); c.height = Math.max(1, Math.round(h * s));
      c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height);
    };
    img.onerror = () => { if (alive) setFailed(true); };
    img.src = src;
    return () => { alive = false; img.onload = img.onerror = null; };
  }, [src]);
  return failed ? <span aria-hidden="true">🎞️</span> : <canvas ref={ref} aria-hidden="true" />;
}
function BubbleMiniature({ item }) {
  const kind = bubbleKind(item);
  const hasPreview = (kind === "photo" || kind === "video" || kind === "gif") && item.previewUrl;
  return <span className={`bl-bubble-miniature bl-mini-${kind}`} aria-label={`Anteprima ${KIND_META[kind].label}`}>
    {hasPreview ? (kind === "gif" ? <StillFrame src={item.previewUrl} /> : kind === "video" ? <video src={item.previewUrl} muted playsInline preload="metadata" aria-hidden="true" /> : <img src={item.previewUrl} alt="" loading="lazy" />) : <span className="bl-bubble-miniature-fallback" aria-hidden="true">{KIND_META[kind].icon}</span>}
    {kind === "video" && hasPreview && <span className="bl-bubble-miniature-play" aria-hidden="true">▶</span>}
  </span>;
}
function bubbleDescription(item) {
  const caption = cleanCaption(item.caption);
  return caption || KIND_META[bubbleKind(item)].label;
}

const KIND_META = {
  photo: { label: "Foto", icon: "📷" }, video: { label: "Video", icon: "🎬" }, gif: { label: "GIF e meme", icon: "🎞️" },
  poll: { label: "Sondaggio", icon: "📊" }, question: { label: "Domanda", icon: "❓" },
  meme: { label: "Meme", icon: "😂" }, thought: { label: "Pensiero", icon: "💭" }, confession: { label: "Confessione", icon: "💜" },
  truth: { label: "2 verità e 1 bugia", icon: "🕵️" }, rating: { label: "Voto", icon: "⭐" },
};
/* Reazioni "su misura" per tipo di bolla: stesse 5 chiavi sul server, icone e nomi diversi. */
const REACTION_SKINS = {
  confession: { love: ["🤗", "Ti abbraccio"], laugh: ["😅", "Capita"], wow: ["😮", "Wow"], warm: ["🙋", "Anche io"], sad: ["🥺", "Coraggio"] },
  meme: { love: ["😍", "Adoro"], laugh: ["🤣", "Ahah"], wow: ["💀", "Morto"], warm: ["🔥", "Top"], sad: ["🙄", "Cringe"] },
};
function reactionsFor(kind) {
  const skin = REACTION_SKINS[kind];
  return skin ? REACTIONS.map(r => ({ ...r, emoji: skin[r.key][0], label: skin[r.key][1] })) : REACTIONS;
}
// Foto e video condividono lo stesso gruppo.
// Sondaggi e domande hanno risposte dedicate: nella sezione "Le mie bolle" non mostrano le reazioni.
const NO_REACTION_KINDS = ["poll", "question"];
const BUBBLE_GROUPS = [
  { id: "photo", label: "Foto e video", icon: "📷", kinds: ["photo", "video"] },
  { id: "gif", label: "GIF e meme", icon: "🎞️", kinds: ["gif", "meme"] },
  { id: "poll", label: "Sondaggi", icon: "📊", kinds: ["poll"] },
  { id: "question", label: "Domande", icon: "❓", kinds: ["question"] },
  { id: "thought", label: "Pensieri", icon: "💭", kinds: ["thought"] },
  { id: "confession", label: "Confessioni", icon: "💜", kinds: ["confession"] },
  { id: "truth", label: "2 verità e 1 bugia", icon: "🕵️", kinds: ["truth"] },
  { id: "rating", label: "Voti", icon: "⭐", kinds: ["rating"] },
];
function decorateEntries(rows) {
  return (Array.isArray(rows) ? rows : []).map(item => ({
    ...item,
    opensCount: Math.max(0, Number(item.opens) || 0),
    reactionsCount: REACTIONS.reduce((sum, r) => sum + Math.max(0, Number(item[r.key]) || 0), 0),
  }));
}
/* 15 traguardi. Unica fonte: usata dalla pagina statistiche e dal controllo globale che invia la notifica. */
function buildMilestones(entries, me) {
  const reactions = entries.reduce((sum, e) => sum + (e.reactionsCount || 0), 0);
  const opens = me?.opens_total ?? entries.reduce((s, e) => s + (e.opensCount || 0), 0);
  const count = me?.bubbles_count ?? entries.length;
  const ofKind = (...kinds) => entries.filter(e => kinds.includes(bubbleKind(e))).length;
  return [
    { icon: Sprout, name: "Primo soffio", target: 1, value: count, unit: "bolle" },
    { icon: Zap, name: "Scintilla", target: 10, value: opens, unit: "aperture" },
    { icon: Sparkles, name: "Costellazione", target: 10, value: count, unit: "bolle" },
    { icon: Heart, name: "Cuore pulsante", target: 25, value: reactions, unit: "reazioni" },
    { icon: Orbit, name: "Universo", target: 100, value: opens, unit: "aperture" },
    { icon: Camera, name: "Primo ricordo", target: 1, value: ofKind("photo", "video"), unit: "foto/video" },
    { icon: MessageCircle, name: "Voce curiosa", target: 5, value: ofKind("question"), unit: "domande" },
    { icon: ChartColumn, name: "Opinione conta", target: 5, value: ofKind("poll"), unit: "sondaggi" },
    { icon: Gift, name: "Un pensiero in dono", target: 1, value: Number(me?.gifts_sent || 0), unit: "regali" },
    { icon: Medal, name: "Piccola celebrità", target: 250, value: opens, unit: "aperture" },
    { icon: HeartHandshake, name: "Pioggia di affetto", target: 100, value: reactions, unit: "reazioni" },
    { icon: Waves, name: "Marea di bolle", target: 25, value: count, unit: "bolle" },
    { icon: Rocket, name: "Oltre l'orizzonte", target: 500, value: opens, unit: "aperture" },
    { icon: Orbit, name: "Galassia", target: 50, value: count, unit: "bolle" },
    { icon: Award, name: "Leggenda di Bolle", target: 1000, value: opens, unit: "aperture" },
  ];
}

function BubbleInteractionDetails({ bubbleId }) {
  const [state, setState] = useState({loading:true,poll:null,question:null,error:""});
  useEffect(()=>{let active=true;Promise.all([
    supabase.rpc("bolle_poll_result",{p_bubble_id:bubbleId}),
    supabase.rpc("bolle_question_details",{p_bubble_id:bubbleId})
  ]).then(([p,q])=>{if(active)setState({loading:false,poll:p.error?null:p.data,question:q.error?null:q.data,error:p.error?.message||q.error?.message||""});});return()=>{active=false}},[bubbleId]);
  if(state.loading)return null;
  const poll=state.poll,question=state.question;
  if(!poll&&!question)return null;
  return <div className="bl-owner-interactions">
    {poll&&<div><strong>⚡ Risultati del sondaggio</strong>{[[poll.a,poll.votes_a],[poll.b,poll.votes_b]].map(([label,n],i)=>{const total=Number(poll.votes_a)+Number(poll.votes_b),pct=total?Math.round(Number(n)*100/total):0;return <div className="bl-owner-result" key={i}><span>{label} · {pct}% ({n})</span><div><i style={{width:`${pct}%`}}/></div></div>})}<small>{Number(poll.votes_a)+Number(poll.votes_b)} voti totali</small></div>}
    {question&&<div><strong>🎲 Risposte alla domanda</strong><p className="bl-owner-question">{question.question}</p>{question.answers?.length?<div className="bl-owner-answers">{question.answers.map((answer,i)=><p key={i}><GifAnswer value={answer}/></p>)}</div>:<small>Nessuna risposta per ora.</small>}<small>{question.answers?.length||0} risposte ricevute</small></div>}
  </div>;
}

function TrashIcon({ size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#e5484d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v5M14 11v5" /></svg>;
}
function formatBubbleDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" })} · ${d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}`;
}
function StarFace({ item }) {
  const kind = bubbleKind(item);
  // Foto e video: miniatura reale. Sondaggi, domande, GIF e citazioni: icona del tipo.
  if (item.previewUrl && kind === "photo") return <span className="bl-star-face" aria-hidden="true"><img src={item.previewUrl} alt="" loading="lazy" draggable={false} /></span>;
  if (item.previewUrl && kind === "gif") return <span className="bl-star-face" aria-hidden="true"><StillFrame src={item.previewUrl} /></span>;
  if (item.previewUrl && kind === "video") return <span className="bl-star-face" aria-hidden="true"><video src={item.previewUrl} muted playsInline preload="metadata" /></span>;
  return <span className="bl-star-face bl-star-icon" aria-hidden="true">{KIND_META[kind].icon}</span>;
}

function BubblesView({ entries, onCreate, onOpenBubble, onDelete, deletingId }) {
  const [selected, setSelected] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [groupFilter, setGroupFilter] = useState("all");
  const [sort, setSort] = useState("recent");
  const constellation = useMemo(() => layoutConstellation(entries), [entries]);
  const groups = useMemo(() => {
    const sorters = {
      recent: (a, b) => Date.parse(b.created_at || 0) - Date.parse(a.created_at || 0),
      opens: (a, b) => b.opensCount - a.opensCount,
      reactions: (a, b) => b.reactionsCount - a.reactionsCount,
    };
    return BUBBLE_GROUPS.map(group => {
      const items = entries.filter(item => group.kinds.includes(bubbleKind(item))).sort(sorters[sort]);
      return { ...group, items, opens: items.reduce((n, i) => n + i.opensCount, 0), reactions: items.reduce((n, i) => n + i.reactionsCount, 0) };
    }).filter(group => group.items.length);
  }, [entries, sort]);
  if (!entries.length) return <EmptyMine onCreate={onCreate} />;
  const chosen = entries.find((e) => e.bubble_id === selected);
  const shownGroups = groupFilter === "all" ? groups : groups.filter(g => g.id === groupFilter);
  return <div className="bl-insights">
    <section className="bl-insights-section"><div className="bl-insights-heading"><h3>🌌 La tua costellazione</h3><small>Tocca una bolla per esplorarla</small></div>
      <div className="bl-constellation" aria-label="Costellazione delle tue bolle">
        <span className="bl-axis-label bl-axis-y">Reazioni ↑</span>
        <span className="bl-axis-label bl-axis-x">Aperture →</span>
        {constellation.map(({ item, i, left, top, size }) => (
          <button key={item.bubble_id || i} type="button" className={`bl-star bl-star-${bubbleKind(item)} ${selected === item.bubble_id ? "selected" : ""}`}
            style={{ left, top, width: size, height: size, fontSize: Math.max(13, Math.round((parseFloat(size) || 40) * 0.46)), animationDelay: `${(i % 7) * -0.4}s` }}
            onClick={() => setSelected(item.bubble_id)}
            aria-label={NO_REACTION_KINDS.includes(bubbleKind(item)) ? `${KIND_META[bubbleKind(item)].label}: ${item.opensCount} aperture` : `${KIND_META[bubbleKind(item)].label}: ${item.opensCount} aperture e ${item.reactionsCount} reazioni`}><StarFace item={item} /></button>
        ))}
      </div>
      <p className="bl-constellation-caption">Più una bolla va a destra, più è stata aperta; più sale, più ha emozionato. Le foto mostrano la loro miniatura, le altre il simbolo del loro tipo.</p>
      {entries.length > 24 && <small className="bl-muted">La costellazione mostra 24 delle tue {entries.length} bolle.</small>}
      {chosen && <div className="bl-constellation-detail bl-clickable" role="button" tabIndex={0} onClick={() => onOpenBubble?.(chosen)} onKeyDown={e => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onOpenBubble?.(chosen); } }}><button type="button" onClick={e => { e.stopPropagation(); setSelected(null); }} aria-label="Chiudi dettaglio">×</button><div className="bl-bubble-identity"><BubbleMiniature item={chosen} /><strong>{bubbleDescription(chosen)}</strong></div><span>{NO_REACTION_KINDS.includes(bubbleKind(chosen)) ? `${chosen.opensCount} aperture` : `${chosen.opensCount} aperture · ${chosen.reactionsCount} reazioni`}</span></div>}
    </section>
    <section className="bl-insights-section"><div className="bl-insights-heading"><h3><Waves size={20} /> Tutte le tue bolle</h3><small>{entries.length} pubblicate</small></div>
      <div className="bl-my-toolbar">
        <div className="bl-notification-filters" role="group" aria-label="Filtra per tipo">
          <button type="button" className={groupFilter === "all" ? "active" : ""} aria-pressed={groupFilter === "all"} onClick={() => setGroupFilter("all")}>Tutte<em className="bl-filter-count">{entries.length}</em></button>
          {groups.map(g => <button type="button" key={g.id} className={groupFilter === g.id ? "active" : ""} aria-pressed={groupFilter === g.id} onClick={() => setGroupFilter(g.id)}>{g.icon} {g.label}<em className="bl-filter-count">{g.items.length}</em></button>)}
        </div>
        <label className="bl-my-sort"><span>Ordina per</span><select value={sort} onChange={e => setSort(e.target.value)} aria-label="Ordina le bolle"><option value="recent">Più recenti</option><option value="opens">Più aperte</option><option value="reactions">Più amate</option></select></label>
      </div>
      <div className="bl-my-bubble-groups">{shownGroups.map(group => <section className="bl-my-bubble-group" key={group.id}><h4><span>{group.icon}</span>{group.label}<small>{group.items.length}</small></h4><p className="bl-my-group-summary">{group.kinds.every(k => NO_REACTION_KINDS.includes(k)) ? `${group.opens} aperture in totale` : `${group.opens} aperture · ${group.reactions} reazioni in totale`}</p><div className="bl-stats-list">{group.items.map((item, i) => (
        <article className="bl-stat bl-clickable" key={item.bubble_id || i} role="button" tabIndex={0} aria-label={`Visualizza ${KIND_META[bubbleKind(item)].label.toLowerCase()} ${i + 1}`} onClick={() => onOpenBubble?.(item)} onKeyDown={e => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onOpenBubble?.(item); } }}>
          <div className="bl-bubble-identity"><BubbleMiniature item={item} /><div className="bl-bubble-identity-text"><p>{bubbleDescription(item)}</p><small className="bl-stat-date">{formatBubbleDateTime(item.created_at)}</small></div></div>
          <strong className="bl-stat-opens">{item.opensCount} aperture</strong>
          {!NO_REACTION_KINDS.includes(bubbleKind(item)) && <div>{REACTIONS.map((r) => <span key={r.key} title={r.label}><ReactionIcon reaction={r} size={22} /> {Math.max(0, Number(item[r.key]) || 0)}</span>)}</div>}
          <BubbleInteractionDetails bubbleId={item.bubble_id} />
          <button type="button" className="bl-delete-own bl-delete-icon" aria-label="Elimina bolla" title="Elimina bolla" disabled={deletingId !== null} onClick={e => { e.stopPropagation(); setConfirmId(item.bubble_id); }} onKeyDown={e => e.stopPropagation()}>{deletingId === item.bubble_id ? "…" : <TrashIcon />}</button>
        </article>
      ))}</div></section>)}</div>
    </section>
    {confirmId && <div className="bl-confirm-backdrop" role="presentation" onClick={() => setConfirmId(null)}>
      <div className="bl-confirm" role="alertdialog" aria-modal="true" aria-labelledby="bl-confirm-title" aria-describedby="bl-confirm-text" onClick={e => e.stopPropagation()}>
        <h3 id="bl-confirm-title">Eliminare questa bolla?</h3>
        <p id="bl-confirm-text">Non sarà più visibile e i regali non ancora aperti diventeranno inutilizzabili. L’operazione non si può annullare.</p>
        <div className="bl-confirm-actions"><button type="button" onClick={() => setConfirmId(null)}>Annulla</button><button type="button" className="danger" autoFocus onClick={() => { const id = confirmId; setConfirmId(null); onDelete(id); }}>Elimina</button></div>
      </div>
    </div>}
  </div>;
}

function StatsTimeline() {
  const windows = [
    { id: "day", label: "Giorno" }, { id: "week", label: "Settimana" },
    { id: "month", label: "Mese" }, { id: "3m", label: "3 mesi" },
    { id: "6m", label: "6 mesi" }, { id: "12m", label: "12 mesi" },
  ];
  const [period, setPeriod] = useState("month");
  const [visible, setVisible] = useState({ opens: true, reactions: true, pops: true });
  const [state, setState] = useState({ loading: true, rows: [], error: null });
  const [selected, setSelected] = useState(null);
  useEffect(() => {
    let active = true;
    setState({ loading: true, rows: [], error: null });
    setSelected(null);
    supabase.rpc("bolle_my_impact_timeline_v2", { p_period: period }).then(({ data, error }) => {
      if (active) setState({ loading: false, rows: Array.isArray(data) ? data : [], error: error?.message || null });
    });
    return () => { active = false; };
  }, [period]);
  const points = state.rows.map(row => ({
    date: String(row.bucket || ""),
    opens: Math.max(0, Number(row.opens) || 0),
    reactions: Math.max(0, Number(row.reactions) || 0),
    pops: Math.max(0, Number(row.pops) || 0),
  })).filter(row => row.date);
  const totals = points.reduce((acc, row) => ({ opens: acc.opens + row.opens, reactions: acc.reactions + row.reactions, pops: acc.pops + row.pops }), { opens: 0, reactions: 0, pops: 0 });
  const activeKeys = Object.keys(visible).filter(key => visible[key]);
  const max = Math.max(1, ...points.flatMap(row => activeKeys.map(key => row[key])));
  const width = 620, height = 190, left = 28, right = 12, top = 14, bottom = 26;
  const px = i => left + i * (width - left - right) / Math.max(1, points.length - 1);
  const py = n => height - bottom - (n / max) * (height - top - bottom);
  const coords = key => points.map((row, i) => `${px(i)},${py(row[key])}`).join(" ");
  const formatDate = value => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    if (period === "day") return d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
    if (["3m", "6m", "12m"].includes(period)) return d.toLocaleDateString("it-IT", { month: "short", year: "numeric", timeZone: "UTC" });
    return d.toLocaleDateString("it-IT", { day: "numeric", month: "short", timeZone: "UTC" });
  };
  const colors = { opens: "#a68bff", reactions: "#f27db7", pops: "#38b9ad" };
  const labels = { opens: "Aperture ricevute", reactions: "Reazioni ricevute", pops: "Scoppi effettuati" };
  const detail = selected !== null ? points[selected] : null;
  return <section className="bl-insights-section bl-timeline">
    <div className="bl-insights-heading"><h3><Activity size={20} /> Il tuo impatto nel tempo</h3><small>Attività del tuo profilo</small></div>
    <div className="bl-timeline-periods" role="group" aria-label="Periodo del grafico" style={{ display: "flex", flexWrap: "wrap", gap: 7, margin: "12px 0" }}>
      {windows.map(w => <button type="button" key={w.id} onClick={() => setPeriod(w.id)} aria-pressed={period === w.id} style={{ padding: "7px 11px", borderRadius: 18, border: "1px solid var(--bl-border, #7775)", background: period === w.id ? "#7463c5" : "transparent", color: period === w.id ? "white" : "inherit", cursor: "pointer" }}>{w.label}</button>)}
    </div>
    <div className="bl-timeline-legend" style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
      {Object.keys(labels).map(key => <label key={key} style={{ display: "inline-flex", alignItems: "center", gap: 5, cursor: "pointer" }}><input type="checkbox" checked={visible[key]} onChange={e => setVisible(old => ({ ...old, [key]: e.target.checked }))} /><span style={{ color: colors[key] }}>●</span> {labels[key]} ({totals[key]})</label>)}
    </div>
    {state.loading ? <p className="bl-muted">Caricamento della timeline…</p>
      : state.error ? <p className="bl-muted">Statistiche non disponibili: {state.error}. Esegui prima lo script SQL incluso nell'aggiornamento.</p>
      : !points.length ? <p className="bl-muted">Nessun dato disponibile per questo periodo.</p>
      : <>
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Andamento di aperture ricevute, reazioni ricevute e scoppi effettuati; seleziona un punto per vedere i valori" style={{ width: "100%", height: "auto", minHeight: 140, touchAction: "pan-y" }}>
          {[0, 0.5, 1].map(frac => <g key={frac}><line x1={left} x2={width-right} y1={top + frac*(height-top-bottom)} y2={top + frac*(height-top-bottom)} stroke="currentColor" opacity=".15" /><text x={left-5} y={top + frac*(height-top-bottom)+4} textAnchor="end" fill="currentColor" fontSize="11">{Math.round(max*(1-frac))}</text></g>)}
          {activeKeys.map(key => <polyline key={key} fill="none" stroke={colors[key]} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" points={coords(key)} />)}
          {points.map((row, i) => <g key={row.date}>
            <rect x={px(i) - (width-left-right)/Math.max(1,points.length)/2} y={top} width={(width-left-right)/Math.max(1,points.length)} height={height-top-bottom} fill="transparent" onClick={() => setSelected(i)}><title>{formatDate(row.date)}: {labels.opens} {row.opens}, {labels.reactions} {row.reactions}, {labels.pops} {row.pops}</title></rect>
            {selected === i && <line x1={px(i)} x2={px(i)} y1={top} y2={height-bottom} stroke="currentColor" strokeDasharray="4 4" opacity=".5" />}
          </g>)}
        </svg>
        <div className="bl-timeline-dates"><span>{formatDate(points[0].date)}</span><span>{formatDate(points[points.length-1].date)}</span></div>
        {detail && <p className="bl-muted" aria-live="polite"><strong>{formatDate(detail.date)}</strong> · Aperture {detail.opens} · Reazioni {detail.reactions} · Scoppi effettuati {detail.pops}</p>}
        {!activeKeys.length && <p className="bl-muted">Seleziona almeno una serie per visualizzare il grafico.</p>}
        <div className="bl-timeline-scroll"><table><thead><tr><th>Periodo</th><th>Aperture</th><th>Reazioni</th><th>Scoppi effettuati</th></tr></thead><tbody>{points.map((row, i) => <tr key={row.date} onClick={() => setSelected(i)} style={{ cursor: "pointer" }}><td>{formatDate(row.date)}</td><td>{row.opens}</td><td>{row.reactions}</td><td>{row.pops}</td></tr>)}</tbody></table></div>
      </>}
  </section>;
}

function ProfileBadges({ entries, me }) {
  const milestones = buildMilestones(entries, me);
  const unlocked = milestones.filter(m => m.value >= m.target).length;
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [open, setOpen] = useState(false); // chiusa: una sola riga; aperta: tutti i badge, senza scorrimento laterale
  const badgeEmblems = ["🌱", "⚡", "✨", "💗", "🌌", "📸", "💬", "📊", "🎁", "🏅", "🤝", "🌊", "🚀", "🪐", "👑"];
  const explanations = {
    "Primo soffio": "Hai pubblicato la tua prima Bolla: è il primo passo per dare vita al tuo spazio su Bolle.",
    "Scintilla": "Le tue Bolle hanno raggiunto almeno 10 aperture. Qualcuno si è fermato a scoprirle!",
    "Costellazione": "Hai pubblicato 10 Bolle e stai creando una piccola costellazione di storie.",
    "Cuore pulsante": "Le tue Bolle hanno ricevuto almeno 25 reazioni. La community ha apprezzato ciò che condividi.",
    "Universo": "Le tue Bolle hanno totalizzato almeno 100 aperture: il tuo universo si sta allargando.",
    "Primo ricordo": "Hai condiviso almeno una foto o un video, trasformando un momento in un ricordo da scoprire.",
    "Voce curiosa": "Hai pubblicato almeno 5 domande e invitato gli altri a partecipare.",
    "Opinione conta": "Hai creato almeno 5 sondaggi e dato alla community la possibilità di esprimersi.",
    "Un pensiero in dono": "Hai regalato almeno una Bolla a qualcuno, condividendo un pensiero speciale.",
    "Piccola celebrità": "Le tue Bolle hanno raggiunto almeno 250 aperture: il tuo pubblico sta crescendo.",
    "Pioggia di affetto": "Hai ricevuto almeno 100 reazioni: un bel segnale di apprezzamento dalla community.",
    "Marea di bolle": "Hai pubblicato 25 Bolle e il tuo mare di contenuti continua a crescere.",
    "Oltre l'orizzonte": "Le tue Bolle hanno raggiunto almeno 500 aperture: la tua curiosità viaggia lontano.",
    "Galassia": "Hai pubblicato 50 Bolle: hai costruito una vera galassia di contenuti.",
    "Leggenda di Bolle": "Le tue Bolle hanno raggiunto almeno 1.000 aperture. Un traguardo da leggenda!"
  };
  return <section className="bl-profile-badges" aria-label="I tuoi badge">
    <button type="button" className="bl-profile-badges-heading bl-profile-badges-toggle" aria-expanded={open} onClick={() => setOpen(o => !o)}>
      <span className="bl-profile-badges-title"><span className="bl-profile-badges-name">Traguardi</span><span className="bl-profile-badges-bar" aria-hidden="true"><i style={{ width: `${Math.round(unlocked / milestones.length * 100)}%` }} /></span></span>
      <strong>{unlocked}<small>/{milestones.length}</small></strong>
      <i className="bl-profile-badges-chev" aria-hidden="true">{open ? "⌃" : "⌄"}</i>
    </button>
    {open && <div className="bl-profile-badges-grid">
      {milestones.map((m, i) => {
        const earned = m.value >= m.target;
        return <button type="button" key={m.name} className={`bl-profile-badge ${earned ? "earned" : "locked"}`} aria-label={`Dettagli badge ${m.name}`} aria-haspopup="dialog" onClick={() => setSelectedBadge({ ...m, earned, emblem: badgeEmblems[i], explanation: explanations[m.name] || "Continua a usare Bolle per conquistare questo traguardo." })}>
          <span className={`bl-badge-crest crest-${i % 5}`} aria-hidden="true">{earned ? badgeEmblems[i] : <LockKeyhole size={19}/>}</span>
          <strong>{m.name}</strong>
          <small>{earned ? "Sbloccato!" : `${Math.min(m.value,m.target)} / ${m.target} ${m.unit}`}</small>
          {!earned && <span className="bl-badge-progress"><i style={{width:`${Math.min(100,(m.value/m.target)*100)}%`}} /></span>}
        </button>;
      })}
    </div>}
    {selectedBadge && <div className="bl-badge-dialog-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setSelectedBadge(null); }}>
      <section className="bl-badge-dialog" role="dialog" aria-modal="true" aria-labelledby="bl-badge-dialog-title">
        <button type="button" className="bl-badge-dialog-close" aria-label="Chiudi dettagli badge" onClick={() => setSelectedBadge(null)}>×</button>
        <span className={`bl-badge-dialog-crest crest-${milestones.findIndex(m => m.name === selectedBadge.name) % 5}`} aria-hidden="true">{selectedBadge.earned ? selectedBadge.emblem : <LockKeyhole size={25}/>}</span>
        <span className="bl-profile-badges-kicker">{selectedBadge.earned ? "TRAGUARDO CONQUISTATO" : "PROSSIMO TRAGUARDO"}</span>
        <h4 id="bl-badge-dialog-title">{selectedBadge.name}</h4>
        <p>{selectedBadge.earned ? selectedBadge.explanation : `Non hai ancora sbloccato questo badge. ${selectedBadge.explanation}`}</p>
        <div className="bl-badge-dialog-progress-label"><strong>{Math.min(selectedBadge.value, selectedBadge.target)} / {selectedBadge.target} {selectedBadge.unit}</strong><span>{Math.min(100, Math.round(selectedBadge.value / selectedBadge.target * 100))}%</span></div>
        <div className="bl-badge-dialog-progress"><i style={{width:`${Math.min(100,(selectedBadge.value/selectedBadge.target)*100)}%`}} /></div>
        <button type="button" className="bl-badge-dialog-action" onClick={() => setSelectedBadge(null)}>Ho capito</button>
      </section>
    </div>}
  </section>;
}

function StatsView({ entries, me, onCreate, onNotify, onOpenBubble }) {
  const stats = useMemo(() => {
    const totals = REACTIONS.map((r) => ({ ...r, count: entries.reduce((s, e) => s + Math.max(0, Number(e[r.key]) || 0), 0) }));
    const reactions = totals.reduce((s, r) => s + r.count, 0);
    const top = [...entries].sort((a, b) => (b.opensCount + b.reactionsCount) - (a.opensCount + a.reactionsCount)).slice(0, 3);
    return { totals, reactions, top };
  }, [entries]);
  const opens = me?.opens_total ?? entries.reduce((s, e) => s + e.opensCount, 0);
  const count = me?.bubbles_count ?? entries.length;
  const milestones = buildMilestones(entries, me); // la notifica di sblocco parte dal controllo globale in App
  return <div className="bl-insights">
    <div className="bl-insights-hero"><h3>{opens === 0 ? "Il bello deve ancora cominciare." : `Hai acceso ${opens} ${opens === 1 ? "momento" : "momenti"} di curiosità.`}</h3><p>Ogni apertura è una persona che ha scelto di scoprire una tua storia.</p></div>
    <div className="bl-insights-metrics" aria-label="Le tue statistiche">
      <div><span><Waves size={27} /></span><strong>{count}</strong><small>Bolle pubblicate</small></div>
      <div><span><Zap size={27} /></span><strong>{opens}</strong><small>Aperture totali</small></div>
      <div><span><CalendarDays size={27} /></span><strong>{me?.opens_week ?? 0}</strong><small>Questa settimana</small></div>
      <div><span><CalendarRange size={27} /></span><strong>{me?.opens_month ?? 0}</strong><small>Questo mese</small></div>
    </div>
    <StatsTimeline />
    {entries.length === 0 ? <EmptyMine onCreate={onCreate} /> : <>
      <section className="bl-insights-section"><div className="bl-insights-heading"><h3><Award size={20} /> Le più amate</h3></div><div className="bl-insights-ranking">{stats.top.map((item, i) => <div key={item.bubble_id || i} className="bl-clickable" role="button" tabIndex={0} aria-label={`Apri la bolla: ${bubbleDescription(item)}`} onClick={() => onOpenBubble?.(item)} onKeyDown={e => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onOpenBubble?.(item); } }}><span className="bl-rank-medal"><Medal size={22} color={["#c79a2b", "#8b94a6", "#b67b58"][i]} /></span><div className="bl-bubble-identity"><BubbleMiniature item={item} /><p>{bubbleDescription(item)}</p></div><small>{item.opensCount} aperture · {item.reactionsCount} reazioni</small></div>)}</div></section>
      <section className="bl-insights-section"><div className="bl-insights-heading"><h3><Heart size={20} /> Le emozioni che lasci</h3><small>Reazioni anonime ricevute</small></div><div className="bl-emotion-cloud">{stats.totals.map((r) => <div key={r.key} title={`${r.label}: ${r.count}`} style={{ "--emotion-size": `${48 + (stats.reactions ? Math.round((r.count / stats.reactions) * 44) : 0)}px` }}><span><ReactionIcon reaction={r} size={22} /></span><strong>{r.count}</strong><small>{r.label}</small></div>)}</div></section>
    </>}

  </div>;
}

/* Logica "Regala una bolla" invariata: bolle_create_gift + condivisione del link. */
function GiftView({ entries, onCreate, onNotify }) {
  const [sentGifts, setSentGifts] = useState(null);
  const [historyError, setHistoryError] = useState("");
  const refreshSentGifts = useCallback(async () => {
    const { data, error } = await supabase.rpc("bolle_my_sent_gifts");
    if (error) setHistoryError(error.message);
    else { setHistoryError(""); setSentGifts(data || []); }
  }, []);
  useEffect(() => { refreshSentGifts(); }, [refreshSentGifts]);
  const [sharing, setSharing] = useState(null);
  const [giftMood, setGiftMood] = useState(null);
  async function shareGift(bubbleId) {
    if (!bubbleId || sharing || !giftMood) return;
    setSharing(bubbleId);
    try {
      const { data, error } = await supabase.rpc("bolle_create_gift", { p_bubble_id: bubbleId });
      if (error) throw error;
      refreshSentGifts();
      const token = typeof data === "string" ? data : data?.token;
      if (!token) throw new Error("Link non generato.");
      const link = `${window.location.origin}/?gift=${encodeURIComponent(token)}`;
      const moodMessages = {
        pensiero: "💗 Ho un pensiero speciale per te. L'ho racchiuso in una bolla: scoppiala per scoprire cosa voglio dirti.",
        incoraggiamento: "⭐ Questa bolla è per ricordarti che puoi farcela. Aprila: c'è un incoraggiamento tutto per te!",
        avventura: "🌱 Ogni nuova avventura comincia con una sorpresa. Ho preparato una bolla per il tuo prossimo capitolo!",
        sorriso: "🌈 Ti mando un sorriso dentro una bolla. Scoppiala e lascia che ti illumini la giornata!",
      };
      const message = `${moodMessages[giftMood] || "🫧 Ho lasciato una bolla per te. Tocca per scoprirla!"}\n${link}`;
      if (navigator.share) {
        try { await navigator.share({ title: "Una bolla per te 💌", text: message }); return; }
        catch (e) { if (e.name === "AbortError") return; }
      }
      await navigator.clipboard.writeText(message);
      onNotify("Link regalo copiato! Condividilo con una persona 💌");
    } catch (e) { onNotify(`Non riesco a creare il regalo: ${e.message}`); }
    finally { setSharing(null); }
  }
  const history = <section className="bl-gift-history"><div className="bl-insights-heading"><h3>🎁 Regali inviati</h3><button type="button" className="bl-ghost" onClick={refreshSentGifts}>Aggiorna</button></div>{historyError ? <p role="alert" className="bl-muted">Storico non disponibile: {historyError}</p> : sentGifts === null ? <p className="bl-muted">Caricamento regali…</p> : sentGifts.length === 0 ? <p className="bl-muted">Non hai ancora inviato regali.</p> : <div className="bl-gift-history-list">{sentGifts.map(g => { const source = entries.find(item => item.bubble_id === g.bubble_id); const caption = cleanCaption(g.caption); return <article key={g.id}><BubbleMiniature item={source || g} /><div className="bl-gift-history-content">{caption && <strong>{caption}</strong>}<span>{g.status === "opened" ? "✅ Aperto" : g.status === "expired" ? "⌛ Scaduto" : "🕒 In attesa"}</span><small>Creato: {new Date(g.sent_at).toLocaleString("it-IT")}</small>{g.opened_at ? <small>Aperto: {new Date(g.opened_at).toLocaleString("it-IT")}</small> : <small>Scadenza: {new Date(g.expires_at).toLocaleString("it-IT")}</small>}</div></article>; })}</div>}</section>;
  if (!entries.length) return <div className="bl-insights"><EmptyMine onCreate={onCreate} />{history}</div>;
  const moods = [
    { id: "pensiero", emoji: "💗", title: "Un pensiero", subtitle: "Un messaggio speciale" },
    { id: "incoraggiamento", emoji: "⭐", title: "Un incoraggiamento", subtitle: "Per un momento difficile" },
    { id: "avventura", emoji: "🌱", title: "Una nuova avventura", subtitle: "Per un nuovo inizio" },
    { id: "sorriso", emoji: "🌈", title: "Un sorriso", subtitle: "Per illuminare la giornata" },
  ];
  return <div className="bl-insights bl-gift-picker">
    <div className="bl-gift-pick-intro"><span className="bl-gift-intro-art" aria-hidden="true">💌</span><div><strong>💌 Scegli una bolla da regalare</strong><p>Tocca «Regala questa sorpresa» sotto una tua pubblicazione. Il destinatario vedrà il contenuto solo dopo aver scoppiato la bolla.</p></div></div>
    <div className="bl-gift-mood-grid" aria-label="Scegli il tipo di sorpresa">{moods.map(mood => (
      <button type="button" key={mood.id} className={`bl-gift-mood-card${giftMood === mood.id ? " selected" : ""}`} aria-pressed={giftMood === mood.id} onClick={() => setGiftMood(mood.id)}>
        <span className="bl-gift-mood-orb" aria-hidden="true"><span>{mood.emoji}</span></span>
        <strong>{mood.title}</strong><small>{mood.subtitle}</small>
      </button>
    ))}</div>
    {giftMood && <section className="bl-gift-selection" aria-label="Scegli una tua pubblicazione">
      <h3>Ora scegli la tua bolla 🫧</h3><p>Il messaggio WhatsApp sarà personalizzato in base al tema scelto. Il regalo conterrà la pubblicazione che scegli qui sotto.</p>
      <div className="bl-gift-publications">{entries.map((item, i) => (
        <article className="bl-gift-publication" key={item.bubble_id || i}>
          <BubbleMiniature item={item} />
          <div className="bl-gift-publication-copy"><strong>{cleanCaption(item.caption) || "Bolla senza didascalia"}</strong><small>{item.opensCount} aperture</small></div>
          <button className="bl-gift-share" disabled={sharing !== null} onClick={() => shareGift(item.bubble_id)}>{sharing === item.bubble_id ? "Creo il link…" : "💌 Regala"}</button>
        </article>
      ))}</div>
    </section>}
    {history}
  </div>;
}


/* ====================== Gestione Gruppi e Chat ====================== */
const CHAT_GROUP_PREFIX = "[[bolla:group|";
function parseGroupMsgBody(body) {
  if (typeof body !== "string" || !body.startsWith(CHAT_GROUP_PREFIX)) return null;
  const end = body.indexOf("]] ");
  if (end === -1) return null;
  const meta = body.slice(CHAT_GROUP_PREFIX.length, end);
  const text = body.slice(end + 3);
  const [groupId = "", groupName = "", sender = "", admin = ""] = meta.split("|");
  return { groupId, groupName, sender, admin, text };
}

/* Gruppi sul server: righe di bolle_group_list / bolle_group_thread -> oggetti usati dalla UI. */
function mapGroupRow(r) {
  return {
    id: r.id, name: r.name || "Gruppo", isGroup: true,
    admin: r.admin || "", createdBy: r.admin || "",
    members: Array.isArray(r.members) ? r.members.filter(Boolean) : [],
    createdAt: r.created_at || r.last_at, lastBody: r.last_body || "", lastAt: r.last_at,
    lastMine: Boolean(r.last_mine), unread: Number(r.unread) || 0,
  };
}
function mapGroupMsg(m) {
  return { id: m.id, sender: m.sender || "Sistema", body: m.body, created_at: m.created_at, mine: Boolean(m.mine), isSystem: Boolean(m.is_system) };
}
function groupErrorText(err) {
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

/* Modal per la gestione dei componenti del gruppo e permessi amministratore */
function GroupManageModal({ group, me, avatarMap, onClose, onAddMember, onRemoveMember, onLeaveGroup, onNotify }) {
  const [newMember, setNewMember] = useState("");
  const [adding, setAdding] = useState(false);
  const adminUser = group?.admin || group?.createdBy || "";
  const isAdmin = Boolean(me?.username && adminUser && String(adminUser).toLowerCase() === String(me.username).toLowerCase());
  const members = Array.isArray(group?.members) ? group.members : [me?.username, group?.username].filter(Boolean);

  function submitAdd(e) {
    e?.preventDefault();
    const clean = newMember.trim().replace(/^@/, "");
    if (!clean) return;
    onAddMember(clean);
    setNewMember("");
    setAdding(false);
  }

  function handleAddClick() {
    if (!isAdmin) {
      onNotify?.(`Solo l'amministratore (@${adminUser}) può aggiungere o rimuovere membri dal gruppo a proprio piacimento.`);
      return;
    }
    setAdding(v => !v);
  }

  return (
    <div className="bl-group-modal-wrap" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bl-group-modal" role="dialog" aria-modal="true" aria-label="Componenti del gruppo">
        <div className="bl-group-modal-head">
          <div className="bl-group-modal-head-title">
            <span className="bl-group-modal-icon" aria-hidden="true"><Users size={22} /></span>
            <div>
              <h3>{group?.isGroup ? (group?.name || "Gruppo") : `Chat con @${group?.username}`}</h3>
              <p>{members.length} {members.length === 1 ? "componente" : "componenti"}</p>
            </div>
          </div>
          <button type="button" className="bl-sheet-x" onClick={onClose} aria-label="Chiudi">×</button>
        </div>

        <div className={`bl-group-admin-box ${isAdmin ? "is-admin" : ""}`}>
          <div className="bl-group-admin-info">
            <span className="bl-group-admin-badge">👑 Amministratore: @{adminUser || me?.username}</span>
            <p>
              {isAdmin
                ? "Sei l'amministratore del gruppo (hai avviato la chat). Sei l'unico utente autorizzato ad aggiungere o rimuovere membri a tuo piacimento."
                : `@${adminUser} ha avviato la chat ed è l'amministratore del gruppo. È l'unico utente autorizzato ad aggiungere o rimuovere membri a proprio piacimento.`}
            </p>
          </div>
        </div>

        <div className="bl-group-section">
          <div className="bl-group-section-head">
            <strong>Componenti del gruppo</strong>
            <button
              type="button"
              className={`bl-group-add-btn ${!isAdmin ? "locked" : ""}`}
              onClick={handleAddClick}
              title={isAdmin ? "Aggiungi un membro al gruppo" : `Solo l'amministratore (@${adminUser}) può aggiungere membri`}
            >
              <UserPlus size={15} /> Aggiungi membro
            </button>
          </div>

          {adding && isAdmin && (
            <form className="bl-group-add-form" onSubmit={submitAdd}>
              <div className="bl-group-add-input-row">
                <input
                  type="text"
                  placeholder="Nome utente (senza @)"
                  value={newMember}
                  onChange={(e) => setNewMember(e.target.value)}
                  autoFocus
                  maxLength={30}
                />
                <button type="submit" className="bl-cta-small" disabled={!newMember.trim()}>Aggiungi</button>
                <button type="button" className="bl-ghost-small" onClick={() => setAdding(false)}>Annulla</button>
              </div>
            </form>
          )}

          <div className="bl-group-members-list">
            {members.map((member) => {
              const isMemAdmin = String(member).toLowerCase() === String(adminUser).toLowerCase();
              const isMe = String(member).toLowerCase() === String(me?.username || "").toLowerCase();
              const memAvatar = avatarFor(member, avatarMap);
              return (
                <div key={member} className="bl-group-member-row">
                  <div className="bl-group-member-info">
                    <span className="bl-group-member-avatar">
                      <AvatarImage avatar={memAvatar} />
                    </span>
                    <button type="button" className="bl-user-link bl-group-member-name" onClick={() => { onClose(); openUserProfile(member); }}>
                      @{member}
                    </button>
                    {isMe && <span className="bl-group-me-tag">Tu</span>}
                    {isMemAdmin && <span className="bl-group-admin-tag">👑 Admin</span>}
                  </div>
                  {isAdmin && !isMe && (
                    <button
                      type="button"
                      className="bl-group-remove-btn"
                      onClick={() => onRemoveMember(member)}
                      title={`Rimuovi @${member} dal gruppo`}
                    >
                      Rimuovi
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="bl-group-modal-foot">
          {group?.isGroup && (
            <button type="button" className="bl-ghost bl-group-leave-btn" onClick={() => { onClose(); onLeaveGroup(); }}>
              Abbandona gruppo
            </button>
          )}
          <button type="button" className="bl-ghost" onClick={onClose}>Chiudi</button>
        </div>
      </div>
    </div>
  );
}

/* Modal per creare un nuovo gruppo da zero */
function NewGroupModal({ me, avatarMap, onClose, onCreateGroup, onNotify }) {
  const [name, setName] = useState("");
  const [membersInput, setMembersInput] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);

  function addMemberBadge(u) {
    const clean = u.trim().replace(/^@/, "");
    if (!clean) return;
    if (clean.toLowerCase() === String(me?.username || "").toLowerCase()) {
      onNotify?.("Sei già l'amministratore del gruppo.");
      return;
    }
    if (selectedMembers.map(m => m.toLowerCase()).includes(clean.toLowerCase())) {
      onNotify?.(`@${clean} è già selezionato.`);
      return;
    }
    setSelectedMembers(prev => [...prev, clean]);
    setMembersInput("");
  }

  function removeBadge(u) {
    setSelectedMembers(prev => prev.filter(m => m.toLowerCase() !== u.toLowerCase()));
  }

  function handleCreate(e) {
    e?.preventDefault();
    const gName = name.trim();
    if (!gName) {
      onNotify?.("Inserisci un nome per il gruppo.");
      return;
    }
    let finalMembers = [...selectedMembers];
    const typed = membersInput.trim().replace(/^@/, "");
    if (typed && !finalMembers.map(m => m.toLowerCase()).includes(typed.toLowerCase()) && typed.toLowerCase() !== String(me?.username).toLowerCase()) {
      finalMembers.push(typed);
    }
    if (!finalMembers.length) {
      onNotify?.("Aggiungi almeno un altro membro al gruppo.");
      return;
    }
    onCreateGroup(gName, finalMembers);
    onClose();
  }

  return (
    <div className="bl-group-modal-wrap" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bl-group-modal" role="dialog" aria-modal="true" aria-label="Crea nuovo gruppo">
        <div className="bl-group-modal-head">
          <div className="bl-group-modal-head-title">
            <span className="bl-group-modal-icon" aria-hidden="true"><Users size={22} /></span>
            <div>
              <h3>Nuovo Gruppo</h3>
              <p>Avvia una chat di gruppo come Amministratore</p>
            </div>
          </div>
          <button type="button" className="bl-sheet-x" onClick={onClose} aria-label="Chiudi">×</button>
        </div>

        <form onSubmit={handleCreate} className="bl-new-group-form">
          <label className="bl-field-label">
            <span>Nome del gruppo</span>
            <input
              type="text"
              placeholder="Es. Amici di Bolle, Weekend…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              autoFocus
            />
          </label>

          <label className="bl-field-label">
            <span>Aggiungi membri (@username)</span>
            <div className="bl-group-input-chips">
              <input
                type="text"
                placeholder="Digita @username e premi Invio"
                value={membersInput}
                onChange={(e) => setMembersInput(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === "," || e.key === " ") && membersInput.trim()) {
                    e.preventDefault();
                    addMemberBadge(membersInput);
                  }
                }}
              />
              {membersInput.trim() && (
                <button type="button" className="bl-cta-small" onClick={() => addMemberBadge(membersInput)}>
                  Aggiungi
                </button>
              )}
            </div>
          </label>

          {selectedMembers.length > 0 && (
            <div className="bl-selected-members-chips">
              {selectedMembers.map(m => (
                <span key={m} className="bl-member-chip">
                  <span className="bl-member-chip-avatar"><AvatarImage avatar={avatarFor(m, avatarMap)} /></span>
                  @{m}
                  <button type="button" onClick={() => removeBadge(m)} aria-label={`Rimuovi @${m}`}>×</button>
                </span>
              ))}
            </div>
          )}

          <div className="bl-group-admin-box is-admin">
            <p>👑 <strong>Diventerai l'amministratore del gruppo</strong> (avviando la chat per primo). Sarai l'unico autorizzato ad aggiungere o rimuovere membri.</p>
          </div>

          <div className="bl-group-modal-foot">
            <button type="button" className="bl-ghost" onClick={onClose}>Annulla</button>
            <button type="submit" className="bl-cta" disabled={!name.trim() || (!selectedMembers.length && !membersInput.trim())}>
              Crea gruppo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MessagesView({ me, initialChat, onNotify, onUnreadCountChange, onOpenOwnBubble, onExit, avatarMap = {}, activeChat, onActiveChatChange, groupModalOpen, onGroupModalOpenChange }) {
  const openedDirect = useRef(Boolean(initialChat?.username)); // chat aperta da fuori: la freccia torna alla schermata di provenienza
  const [threads, setThreads] = useState([]);
  const [active, setActiveInternal] = useState(activeChat || null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [newGroupOpen, setNewGroupOpen] = useState(false);
  const [confirmDeleteKey, setConfirmDeleteKey] = useState(null); // chat in attesa di conferma di eliminazione
  const [deletingKey, setDeletingKey] = useState(null);
  const [swipeOpenKey, setSwipeOpenKey] = useState(null); // riga con le azioni aperte
  const hideStoreKey = `bolle-hidden-chats-v1-${String(me?.id || me?.username || "me").toLowerCase()}`;
  const [hiddenMap, setHiddenMap] = useState(() => readHiddenChats(hideStoreKey));
  const [archiveOpen, setArchiveOpen] = useState(false); // vista «Archivio» con le chat nascoste
  const [menu, setMenu] = useState(null); // menu rapido (pressione prolungata): { key, t, rect, hidden, closing }
  const itemEls = useRef(new Map());
  const archiveBtnRef = useRef(null);
  const busyKeys = useRef(new Set());
  const lastSeenMsg = useRef(null); // id dell'ultimo messaggio già mostrato (per lo scorrimento automatico)
  const latestId = useRef(null);
  const loadConversationRef = useRef(null);
  const loadThreadsRef = useRef(null);
  const activeRef = useRef(null);
  const [replyTo, setReplyTo] = useState(null); // { id, from, snippet }: messaggio che sto citando
  const stickerStoreKey = `bolle-stickers-v1-${String(me?.id || me?.username || "me").toLowerCase()}`;
  const [stickerOpen, setStickerOpen] = useState(false);
  const [stickers, setStickers] = useState(() => { try { const r = JSON.parse(localStorage.getItem(stickerStoreKey) || "[]"); return Array.isArray(r) ? r.filter(p => STICKER_PATH_RE.test(p)) : []; } catch { return []; } });
  const [stickerBusy, setStickerBusy] = useState(false);
  const stickerFileRef = useRef(null);
  useEffect(() => { try { localStorage.setItem(stickerStoreKey, JSON.stringify(stickers)); } catch { /* storage non disponibile */ } }, [stickers, stickerStoreKey]);
  // Se il bucket permette l'elenco, recupera anche gli sticker caricati da altri dispositivi.
  useEffect(() => {
    let off = false;
    (async () => {
      try {
        const { data: u } = await supabase.auth.getUser();
        const uid = u?.user?.id;
        if (!uid) return;
        const { data: files, error: lErr } = await supabase.storage.from(AVATAR_BUCKET).list(uid, { limit: 200, search: "st-" });
        if (lErr || !files || off) return;
        const found = files.filter(f => /^st-/.test(f.name)).map(f => `${uid}/${f.name}`).filter(p => STICKER_PATH_RE.test(p));
        if (found.length) setStickers(prev => [...new Set([...prev, ...found])].slice(0, MAX_STICKERS_LIBRARY));
      } catch { /* elenco non disponibile: resta la libreria locale */ }
    })();
    return () => { off = true; };
  }, []);
  async function importStickers(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    const { data: u } = await supabase.auth.getUser();
    const uid = u?.user?.id;
    if (!uid) { onNotify?.("Accedi per importare sticker."); return; }
    setStickerBusy(true);
    const added = [];
    for (const file of files) {
      if (stickers.length + added.length >= MAX_STICKERS_LIBRARY) { onNotify?.(`Libreria piena: massimo ${MAX_STICKERS_LIBRARY} sticker.`); break; }
      if (!["image/webp", "image/png", "image/jpeg"].includes(file.type)) { onNotify?.("Gli sticker devono essere file WebP o PNG."); continue; }
      if (file.size > 1024 * 1024) { onNotify?.("Uno sticker pesa troppo (massimo 1 MB)."); continue; }
      const ext = { "image/webp": "webp", "image/png": "png", "image/jpeg": "jpg" }[file.type];
      const path = `${uid}/st-${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) { onNotify?.("Sticker non importato. Riprova."); continue; }
      added.push(path);
    }
    if (added.length) setStickers(prev => [...added, ...prev].slice(0, MAX_STICKERS_LIBRARY));
    setStickerBusy(false);
    if (stickerFileRef.current) stickerFileRef.current.value = "";
  }
  async function removeSticker(path) {
    setStickers(prev => prev.filter(p => p !== path));
    try { await supabase.storage.from(AVATAR_BUCKET).remove([path]); } catch { /* resta rimosso dalla libreria */ }
  }
  const [highlightId, setHighlightId] = useState(null);
  const inputRef = useRef(null);
  const historyRef = useRef(null);
  const hlTimer = useRef(null);

  // Accetta sia un valore sia una funzione (cur => next), come setState: prima la forma a funzione
  // finiva dentro activeRef e interrompeva l'aggiornamento automatico delle chat di gruppo.
  const setActive = useCallback((next) => {
    const person = typeof next === "function" ? next(activeRef.current) : next;
    if (person === activeRef.current) return;
    setActiveInternal(person);
    activeRef.current = person;
    onActiveChatChange?.(person);
  }, [onActiveChatChange]);

  useEffect(() => { activeRef.current = active; }, [active]);
  useEffect(() => {
    ACTIVE_CHAT_KEY = active ? (active.isGroup ? `g:${active.id}` : `u:${String(active.username || "").toLowerCase()}`) : null;
    return () => { ACTIVE_CHAT_KEY = null; };
  }, [active]);
  useEffect(() => () => clearTimeout(hlTimer.current), []);
  useEffect(() => { setHiddenMap(readHiddenChats(hideStoreKey)); }, [hideStoreKey]);

  // Sincronizzazione con activeChat dall'esterno (es. back button dell'header di Sheet)
  useEffect(() => {
    if (activeChat === null && activeRef.current !== null) {
      setActiveInternal(null);
      activeRef.current = null;
      setMessages([]);
      setReplyTo(null);
      latestId.current = null;
      void loadThreads(true);
    }
  }, [activeChat]);

  function startReply(m) {
    setReplyTo({ id: m.id, from: m.mine ? (me?.username || "") : (m.sender || active?.username || ""), snippet: chatQuoteSnippet(m.body) });
    setTimeout(() => inputRef.current?.focus(), 0);
  }
  function jumpToMessage(id) {
    const el = historyRef.current?.querySelector(`[data-mid="${String(id).replace(/"/g, "")}"]`);
    if (!el) { onNotify?.("Il messaggio originale non è più caricato."); return; }
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    setHighlightId(String(id));
    clearTimeout(hlTimer.current);
    hlTimer.current = setTimeout(() => setHighlightId(null), 1600);
  }
  // Tocco sul riferimento di una risposta alla mia bolla: la riapro (le mie bolle restano visibili al loro autore).
  async function openBubbleRef(bubble) {
    if (!bubble?.id) return;
    const { data, error: err } = await supabase.rpc("my_bubbles_media_dashboard");
    const row = !err && Array.isArray(data) ? data.find(r => String(r.bubble_id) === String(bubble.id)) : null;
    if (!row?.media_path) { onNotify?.("Questa bolla non è più disponibile."); return; }
    await onOpenOwnBubble?.({ ...row, chat_username: active?.username, chat_avatar: active?.avatar });
  }

  const loadThreads = useCallback(async (quiet = false) => {
    if (!me?.registered) return;
    if (!quiet) { setLoading(true); setError(""); }
    const { data, error: err } = await supabase.rpc("bolle_chat_conversations");
    if (err) {
      setError("Impossibile caricare le conversazioni. Verifica che le funzioni SQL della chat siano state installate.");
      if (!quiet) setLoading(false);
      return;
    }
    const rows = Array.isArray(data) ? data : [];
    const directMapped = rows.map(row => ({
      username: row.username || "Utente",
      avatar: row.avatar || avatarFor(row.username, avatarMap) || "🫧",
      conversationId: row.conversation_id,
      lastBody: row.last_body || "",
      lastAt: row.last_at,
      lastMine: Boolean(row.last_mine),
      unread: Number(row.unread) || 0,
      isGroup: false
    }));

    // Gruppi: vivono sul server, uguali per tutti i membri.
    let groupThreads = [];
    try {
      const { data: gData, error: gErr } = await supabase.rpc("bolle_group_list");
      if (!gErr && Array.isArray(gData)) groupThreads = gData.map(mapGroupRow);
      else if (gErr) console.warn("[Bolle] Elenco gruppi:", gErr.message);
    } catch (e) { console.warn("[Bolle] Elenco gruppi:", e); }

    // Vecchi segnali di gruppo (formato precedente) nelle chat 1:1: restano nascosti dall'anteprima.
    const cleanedDirect = directMapped.map(d => {
      const gmsg = parseGroupMsgBody(d.lastBody);
      return gmsg ? { ...d, lastBody: `[Messaggio di gruppo: ${gmsg.groupName}]` } : d;
    });

    const combined = [...groupThreads, ...cleanedDirect].sort((a, b) => {
      const ta = Date.parse(a.lastAt || a.createdAt || 0) || 0;
      const tb = Date.parse(b.lastAt || b.createdAt || 0) || 0;
      return tb - ta;
    });

    setThreads(combined);
    onUnreadCountChange?.(combined.reduce((sum, thread) => sum + (thread.unread || 0), 0));
    if (!quiet) setLoading(false);
  }, [me?.registered, me?.username, me?.id, avatarMap, onUnreadCountChange]);

  const loadConversation = useCallback(async (person, after = null, quiet = false) => {
    if (!person) return;
    if (person.isGroup) {
      if (!quiet) {
        setActive(person);
        setMessages([]);
        latestId.current = null;
        setDraft("");
        setReplyTo(null);
        setError("");
      }
      const { data: gd, error: gErr } = await supabase.rpc("bolle_group_thread", { p_group: person.id, p_after: quiet ? (after ?? null) : null });
      if (gErr) {
        if (String(gErr.message || "").includes("group_not_member")) { setActive(null); onNotify?.("Non fai più parte di questo gruppo."); void loadThreads(true); }
        else if (!quiet) setError(groupErrorText(gErr));
        return;
      }
      const rows = (Array.isArray(gd?.messages) ? gd.messages : []).map(mapGroupMsg);
      // Nome, amministratore e membri arrivano dal server: restano allineati per tutti.
      setActive(cur => {
        if (!cur || cur.id !== person.id) return cur;
        const members = Array.isArray(gd?.members) ? gd.members.filter(Boolean) : cur.members;
        const next = { ...cur, name: gd?.name || cur.name, admin: gd?.admin || cur.admin, createdBy: gd?.admin || cur.createdBy, members };
        return JSON.stringify([next.name, next.admin, next.members]) === JSON.stringify([cur.name, cur.admin, cur.members]) ? cur : next;
      });
      if (rows.length || !quiet) {
        setMessages(prev => {
          const merged = quiet ? [...prev, ...rows.filter(row => !prev.some(old => String(old.id) === String(row.id)))] : rows;
          merged.sort((x, y) => Number(x.id) - Number(y.id));
          return merged.slice(-100);
        });
      }
      latestId.current = rows.reduce((max, row) => Math.max(max, Number(row.id) || 0), Number(latestId.current) || 0) || latestId.current;
      if (rows.some(r => !r.mine)) void loadThreads(true);
      return;
    }

    const username = person?.username?.trim();
    if (!username) return;
    const initialStarter = me?.username || "Tu";
    const initialActive = {
      ...person,
      username,
      avatar: person.avatar || avatarFor(username, avatarMap) || "🫧",
      isGroup: false,
      members: [me?.username, username].filter(Boolean),
      admin: initialStarter
    };
    if (!quiet) {
      setActive(initialActive);
      setMessages([]);
      latestId.current = null;
      setDraft("");
      setReplyTo(null);
      setError("");
    }
    const { data, error: err } = await supabase.rpc("bolle_chat_thread", {
      p_username: username,
      p_after: after
    });
    if (err) {
      setError(err.message?.includes("chat_blocked")
        ? "Non puoi aprire questa conversazione perché uno dei due utenti ha bloccato l’altro."
        : "Impossibile caricare la conversazione. Riprova.");
      return;
    }
    const rows = Array.isArray(data) ? data : [];
    if (rows.length) {
      if (!quiet) {
        const firstMsg = rows[0];
        const initiator = firstMsg.mine ? (me?.username || "Tu") : username;
        setActive({
          ...initialActive,
          admin: initiator
        });
      }
      setMessages(prev => {
        const merged = quiet ? [...prev, ...rows.filter(row => !prev.some(old => String(old.id) === String(row.id)))] : rows;
        merged.sort((a, b) => Number(a.id) - Number(b.id));
        return merged.slice(-100);
      });
      latestId.current = rows.reduce((max, row) => Math.max(max, Number(row.id) || 0), Number(latestId.current) || 0) || latestId.current;
    } else if (!quiet) {
      setMessages([]);
    }
    if (!quiet || rows.length) void loadThreads(true);
  }, [loadThreads, me?.username, avatarMap, setActive, onNotify]);

  useEffect(() => { void loadThreads(); }, [loadThreads]);

  useEffect(() => {
    if (initialChat?.isGroup && initialChat.id) {
      void loadConversation({ id: initialChat.id, name: initialChat.name || "Gruppo", isGroup: true, admin: "", members: [] });
    } else if (initialChat?.username) {
      void loadConversation({ username: initialChat.username, avatar: initialChat.avatar || avatarFor(initialChat.username, avatarMap) || "🫧" });
    }
  }, [initialChat?.username, initialChat?.id, loadConversation, avatarMap]);

  loadConversationRef.current = loadConversation;
  loadThreadsRef.current = loadThreads;

  // Aggiorna la conversazione aperta e l'elenco senza richiedere refresh manuali.
  // Timer unico e stabile: usa i riferimenti alle ultime funzioni, così non viene mai azzerato dai re-render.
  useEffect(() => {
    let lastListPoll = 0;
    let n = 0;
    const tick = (force = false) => {
      if (document.hidden) return;
      const person = activeRef.current;
      if (person && (person.isGroup || person.username)) {
        n += 1;
        // ogni 5 giri (≈20 s) rilettura completa come rete di sicurezza; negli altri solo i messaggi nuovi
        void loadConversationRef.current?.(person, n % 5 === 0 ? null : latestId.current, true);
      } else if (force || Date.now() - lastListPoll >= POLL.chatList) { lastListPoll = Date.now(); void loadThreadsRef.current?.(true); }
    };
    const timer = window.setInterval(() => tick(), POLL.chatOpen);
    const onVisible = () => { if (document.visibilityState === "visible") tick(true); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", onVisible); };
  }, []);

  // Tempo reale: appena arriva un evento si rilegge la chat aperta e l'elenco, senza aspettare il polling.
  useEffect(() => {
    let t = null;
    const onEvent = () => {
      window.clearTimeout(t);
      t = window.setTimeout(() => {
        const person = activeRef.current;
        if (person && (person.isGroup || person.username)) void loadConversationRef.current?.(person, latestId.current, true);
        void loadThreadsRef.current?.(true);
      }, 80);
    };
    window.addEventListener("bolle:chat-event", onEvent);
    return () => { window.clearTimeout(t); window.removeEventListener("bolle:chat-event", onEvent); };
  }, []);

  // Scorrimento automatico: all'apertura si va all'ultimo messaggio; quando ne arriva uno nuovo
  // (o ne invio uno) la chat scende da sola, a meno che io stia rileggendo i messaggi più vecchi.
  useEffect(() => {
    const node = historyRef.current;
    const last = messages[messages.length - 1];
    const key = last ? String(last.id) : null;
    const prev = lastSeenMsg.current;
    lastSeenMsg.current = key;
    if (!node || !key || key === prev) return;
    let host = null;
    for (let el = node; el && el !== document.body; el = el.parentElement) {
      const oy = getComputedStyle(el).overflowY;
      if ((oy === "auto" || oy === "scroll") && el.scrollHeight > el.clientHeight + 1) { host = el; break; }
    }
    host = host || document.scrollingElement;
    if (!host) return;
    const first = prev === null;
    const nearBottom = host.scrollHeight - host.scrollTop - host.clientHeight < 360;
    if (first || last.mine || nearBottom) requestAnimationFrame(() => host.scrollTo({ top: host.scrollHeight, behavior: first ? "auto" : "smooth" }));
  }, [messages]);

  async function handleCreateNewGroup(groupName, membersList) {
    if (!me?.registered) { onNotify?.("Accedi per creare un gruppo."); return; }
    const { data, error: gErr } = await supabase.rpc("bolle_group_create", { p_name: String(groupName || "").trim(), p_members: membersList });
    if (gErr) { onNotify?.(groupErrorText(gErr)); return; }
    if (data?.skipped?.length) onNotify?.(`Non aggiunti: ${data.skipped.map(u => "@" + u).join(", ")} (non esistono o non accettano messaggi).`);
    else onNotify?.(`Gruppo "${String(groupName).trim()}" creato! Sei l'amministratore ✨`);
    await loadThreads(true);
    void loadConversation({ id: data.id, name: String(groupName).trim(), isGroup: true, admin: me?.username, members: [me?.username, ...membersList] });
  }

  async function handleAddMember(newUsername) {
    if (!active) return;
    const cleaned = String(newUsername || "").trim().replace(/^@/, "");
    if (!cleaned) { onNotify?.("Inserisci un nome utente valido."); return; }

    if (!active.isGroup) {
      // Da chat 1:1 a gruppo: nasce un gruppo vero con i due interlocutori e il nuovo utente.
      if ([me?.username, active.username].filter(Boolean).some(m => m.toLowerCase() === cleaned.toLowerCase())) {
        onNotify?.(`@${cleaned} è già presente nella chat.`); return;
      }
      const name = `Gruppo con @${active.username} e @${cleaned}`.slice(0, 40);
      await handleCreateNewGroup(name, [active.username, cleaned]);
      return;
    }

    const { error: gErr } = await supabase.rpc("bolle_group_add_member", { p_group: active.id, p_username: cleaned });
    if (gErr) { onNotify?.(groupErrorText(gErr)); return; }
    onNotify?.(`@${cleaned} aggiunto al gruppo!`);
    await loadConversation(active, latestId.current, true);
    void loadThreads(true);
  }

  async function handleRemoveMember(memberToRemove) {
    if (!active || !active.isGroup) return;
    const { error: gErr } = await supabase.rpc("bolle_group_remove_member", { p_group: active.id, p_username: String(memberToRemove).replace(/^@/, "") });
    if (gErr) { onNotify?.(groupErrorText(gErr)); return; }
    onNotify?.(`@${memberToRemove} rimosso dal gruppo.`);
    await loadConversation(active, latestId.current, true);
    void loadThreads(true);
  }

  async function handleLeaveGroup() {
    if (!active || !active.isGroup) return;
    const { error: gErr } = await supabase.rpc("bolle_group_leave", { p_group: active.id });
    if (gErr) { onNotify?.(groupErrorText(gErr)); return; }
    setActive(null);
    onNotify?.("Hai abbandonato il gruppo.");
    void loadThreads(true);
  }

  const threadKey = (t) => t.isGroup ? `g:${t.id}` : `u:${String(t.username).toLowerCase()}`;
  /* Animazione «risucchio»: la riga si deforma come un liquido molle e sparisce.
     delete  -> compare un buco nero al centro della riga che la inghiotte
     hide    -> la riga vola verso l'icona archivio, che rimbalza quando la riceve
     restore -> uscita morbida dall'archivio */
  function playSuck(key, kind) {
    const item = itemEls.current.get(key);
    const sw = item?.querySelector(".bl-swipe");
    const calm = Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
    if (!item || !sw || typeof sw.animate !== "function") return { done: Promise.resolve(), cancel() {} };
    const anims = [];
    let hole = null, bumpTimer = null, dead = false;
    item.classList.add("is-sucking");
    sw.classList.add("is-flying");
    const r = sw.getBoundingClientRect();
    const ir = item.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    let main;
    if (calm || kind === "restore") {
      main = sw.animate([{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: calm ? "scale(1)" : "translateY(-10px) scale(.94)" }], { duration: calm ? 120 : 240, easing: "ease-in", fill: "forwards" });
    } else if (kind === "hide") {
      const ab = archiveBtnRef.current?.getBoundingClientRect();
      const dx = ab ? ab.left + ab.width / 2 - cx : 0;
      const dy = ab ? ab.top + ab.height / 2 - cy : -(cy - ir.top) - 60;
      main = sw.animate([
        { transform: "translate(0px,0px) scale(1,1) rotate(0deg)", borderRadius: "18px", opacity: 1, offset: 0, easing: "cubic-bezier(.3,.7,.4,1)" },
        { transform: "translate(0px,0px) scale(1.05,.9) rotate(0deg)", borderRadius: "22px", opacity: 1, offset: .16, easing: "cubic-bezier(.4,0,.6,1)" },
        { transform: `translate(${dx * .16}px,${dy * .16}px) scale(.84,1.12) rotate(-3deg)`, borderRadius: "34px", opacity: 1, offset: .4, easing: "cubic-bezier(.55,0,.8,.5)" },
        { transform: `translate(${dx * .68}px,${dy * .68}px) scale(.36,.62) rotate(9deg)`, borderRadius: "50%", opacity: .95, offset: .76, easing: "cubic-bezier(.55,0,.9,.6)" },
        { transform: `translate(${dx}px,${dy}px) scale(.03,.05) rotate(16deg)`, borderRadius: "50%", opacity: .2, offset: 1 }
      ], { duration: 780, fill: "forwards" });
      bumpTimer = setTimeout(() => {
        archiveBtnRef.current?.animate([
          { transform: "scale(1)" }, { transform: "scale(1.38,.8)", offset: .2 }, { transform: "scale(.86,1.2)", offset: .45 },
          { transform: "scale(1.1,.96)", offset: .7 }, { transform: "scale(1)" }
        ], { duration: 560, easing: "ease-out" });
      }, 660);
    } else {
      hole = document.createElement("span");
      hole.className = "bl-blackhole";
      hole.setAttribute("aria-hidden", "true");
      hole.style.left = `${cx - ir.left}px`;
      hole.style.top = `${cy - ir.top}px`;
      item.appendChild(hole);
      anims.push(hole.animate([
        { transform: "translate(-50%,-50%) scale(0) rotate(0deg)", opacity: 0, offset: 0, easing: "cubic-bezier(.3,1.5,.5,1)" },
        { transform: "translate(-50%,-50%) scale(1.18,.9) rotate(140deg)", opacity: 1, offset: .22 },
        { transform: "translate(-50%,-50%) scale(1,1.08) rotate(420deg)", opacity: 1, offset: .45 },
        { transform: "translate(-50%,-50%) scale(1.12,1) rotate(760deg)", opacity: 1, offset: .78, easing: "ease-in" },
        { transform: "translate(-50%,-50%) scale(0) rotate(1000deg)", opacity: 0, offset: 1 }
      ], { duration: 1150, easing: "linear", fill: "forwards" }));
      main = sw.animate([
        { transform: "scale(1,1) rotate(0deg)", borderRadius: "18px", opacity: 1, offset: 0, easing: "ease-out" },
        { transform: "scale(1.04,.9) rotate(0deg)", opacity: 1, offset: .14, easing: "ease-in-out" },
        { transform: "scale(.86,1.04) rotate(-6deg)", borderRadius: "28px", opacity: 1, offset: .34, easing: "cubic-bezier(.55,0,.8,.5)" },
        { transform: "scale(.45,.55) rotate(-140deg)", borderRadius: "50%", opacity: 1, offset: .68, easing: "cubic-bezier(.55,0,.9,.6)" },
        { transform: "scale(.04,.05) rotate(-420deg)", borderRadius: "50%", opacity: .3, offset: 1 }
      ], { duration: 820, delay: 220, easing: "linear", fill: "both" });
    }
    anims.push(main);
    const done = main.finished.then(() => {
      if (dead) return;
      const h = item.getBoundingClientRect().height;
      item.style.overflow = "hidden";
      const c = item.animate([{ height: `${h}px`, opacity: 1 }, { height: "0px", opacity: 0 }], { duration: calm ? 1 : 260, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" });
      anims.push(c);
      return c.finished;
    }).catch(() => {});
    return { done, cancel() {
      dead = true; clearTimeout(bumpTimer);
      anims.forEach(a => { try { a.cancel(); } catch { /* già conclusa */ } });
      hole?.remove();
      item.style.overflow = "";
      item.classList.remove("is-sucking");
      sw.classList.remove("is-flying");
    } };
  }

  // Elimina dall'elenco: chat 1:1 = sparisce solo per me (torna se l'altro riscrive); gruppo = esco dal gruppo.
  async function deleteThread(t) {
    const key = threadKey(t);
    if (deletingKey || busyKeys.current.has(key)) return;
    busyKeys.current.add(key);
    setDeletingKey(key);
    const fx = playSuck(key, "delete");
    const call = t.isGroup
      ? supabase.rpc("bolle_group_leave", { p_group: t.id })
      : supabase.rpc("bolle_chat_delete", { p_username: t.username });
    const [{ error: dErr }] = await Promise.all([call, fx.done]);
    busyKeys.current.delete(key);
    setDeletingKey(null);
    setConfirmDeleteKey(null);
    if (dErr) {
      fx.cancel();
      const m = String(dErr.message || "");
      onNotify?.(t.isGroup ? groupErrorText(dErr) : /bolle_chat_delete|does not exist|schema cache/i.test(m) ? "Eliminazione non ancora attiva sul server (manca bolle_chat_delete.sql)." : "Impossibile eliminare la chat. Riprova.");
      return;
    }
    setThreads(prev => {
      const next = prev.filter(x => threadKey(x) !== key);
      onUnreadCountChange?.(next.reduce((sum, x) => sum + (x.unread || 0), 0));
      return next;
    });
    onNotify?.(t.isGroup ? "Hai abbandonato il gruppo." : "Chat eliminata dal tuo elenco.");
    void loadThreads(true);
  }

  const isThreadHidden = (t) => {
    const at = hiddenMap[threadKey(t)];
    return at != null && (Date.parse(t.lastAt || 0) || 0) <= Number(at);
  };
  async function hideThread(t) {
    const key = threadKey(t);
    if (busyKeys.current.has(key)) return;
    busyKeys.current.add(key);
    setSwipeOpenKey(null);
    await playSuck(key, "hide").done;
    busyKeys.current.delete(key);
    setHiddenMap(prev => { const next = { ...prev, [key]: Date.parse(t.lastAt || 0) || Date.now() }; writeHiddenChats(hideStoreKey, next); return next; });
    onNotify?.("Chat nascosta: la trovi nell'archivio. Ricompare se arriva un nuovo messaggio.");
  }
  async function unhideThread(t) {
    const key = threadKey(t);
    if (busyKeys.current.has(key)) return;
    busyKeys.current.add(key);
    setSwipeOpenKey(null);
    await playSuck(key, "restore").done;
    busyKeys.current.delete(key);
    setHiddenMap(prev => { const next = { ...prev }; delete next[key]; writeHiddenChats(hideStoreKey, next); return next; });
  }

  // Menu rapido (pressione prolungata o tasto destro)
  function openMenu(t, rect) {
    setSwipeOpenKey(null);
    setMenu({ key: threadKey(t), t, rect: rect || null, hidden: isThreadHidden(t), closing: false });
  }
  function closeMenu(after) {
    setMenu(m => (m ? { ...m, closing: true } : m));
    window.setTimeout(() => { setMenu(null); after?.(); }, 170);
  }
  useEffect(() => {
    if (!menu || menu.closing) return undefined;
    const onKey = (e) => { if (e.key === "Escape") closeMenu(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu]);

  function sendSticker(path) {
    if (!active || sending || !STICKER_PATH_RE.test(path)) return;
    setStickerOpen(false);
    return sendMessage(null, `[[sticker|${path}]]`);
  }
  async function sendMessage(event, forcedBody) {
    event?.preventDefault();
    const text = forcedBody ? "" : draft.trim();
    if ((!text && !forcedBody) || !active || sending) return;
    const body = forcedBody || `${replyTo ? makeQuoteMark(replyTo) : ""}${text}`.slice(0, CHAT_MAX_BODY);
    setSending(true);
    setError("");

    if (active.isGroup) {
      const { data: gSent, error: gErr } = await supabase.rpc("bolle_group_send", { p_group: active.id, p_body: body });
      setSending(false);
      if (gErr) { setError(groupErrorText(gErr)); return; }
      if (!forcedBody) setDraft("");
      setReplyTo(null);
      if (gSent) {
        const sent = mapGroupMsg(gSent);
        setMessages(prev => (prev.some(old => String(old.id) === String(sent.id)) ? prev : [...prev, sent]).slice(-100));
        latestId.current = Math.max(Number(latestId.current) || 0, Number(sent.id) || 0);
      }
      void loadThreads(true);
      return;
    }

    const { data, error: err } = await supabase.rpc("bolle_chat_send", {
      p_username: active.username,
      p_body: body
    });
    setSending(false);
    if (err) {
      const message = err.message || "";
      setError(message.includes("chat_blocked")
        ? "Non puoi inviare messaggi a questo utente perché uno dei due lo ha bloccato."
        : message.includes("chat_rate_limited")
          ? "Hai inviato troppi messaggi. Attendi un minuto e riprova."
          : message.includes("user_not_found")
            ? "Questo utente non è più disponibile."
            : "Messaggio non inviato. Riprova.");
      return;
    }
    if (!forcedBody) setDraft("");
    setReplyTo(null);
    if (data) {
      setMessages(prev => [...prev, data].slice(-100));
      latestId.current = Math.max(Number(latestId.current) || 0, Number(data.id) || 0);
    }
    void loadThreads(true);
  }

  if (!me?.registered) return <p className="bl-muted">Accedi per usare i messaggi.</p>;
  return (
    <div className="bl-messages">
      {active ? (
        <>
          <div className="bl-message-history" aria-live="polite" ref={historyRef}>
            {messages.length ? (
              messages.map(m => (
                <ChatMessage
                  key={m.id}
                  m={m}
                  highlighted={highlightId === String(m.id)}
                  meName={me?.username}
                  peerName={active.username}
                  onReply={startReply}
                  onOpenBubble={openBubbleRef}
                  onJumpTo={jumpToMessage}
                  isGroup={active.isGroup}
                  avatar={avatarFor(m.mine ? me?.username : (m.sender || active.username), avatarMap) || (!m.mine && !active.isGroup ? active.avatar : null) || "🫧"}
                />
              ))
            ) : (
              <p className="bl-muted">
                {active.isGroup
                  ? `Inizia la conversazione nel gruppo "${active.name}".`
                  : `Inizia la conversazione con @${active.username}.`}
              </p>
            )}
          </div>
          {replyTo && (
            <div className="bl-reply-bar" role="group" aria-label="Stai rispondendo a un messaggio">
              <span className="bl-reply-bar-line" aria-hidden="true" />
              <div className="bl-reply-bar-copy">
                <b>{String(replyTo.from || "").toLowerCase() === String(me?.username || "").toLowerCase() ? "Rispondi a te stesso" : `Rispondi a @${replyTo.from}`}</b>
                <small>{replyTo.snippet}</small>
              </div>
              <button type="button" onClick={() => setReplyTo(null)} aria-label="Annulla risposta">✕</button>
            </div>
          )}
          <form className="bl-message-compose" onSubmit={sendMessage} style={{display:"flex",alignItems:"flex-end",gap:10,padding:"10px 12px",borderRadius:26,background:"var(--bl-panel, #20232d)",border:"1px solid var(--bl-line, #ffffff20)",position:"relative",width:"100%",boxSizing:"border-box"}}>
            {stickerOpen && (
              <div className="bl-sticker-tray" role="dialog" aria-label="I tuoi sticker">
                <div className="bl-sticker-head">
                  <b>I miei sticker</b>
                  <span>
                    <button type="button" className="bl-sticker-import" onClick={() => stickerFileRef.current?.click()} disabled={stickerBusy}>{stickerBusy ? "Importo…" : "＋ Importa"}</button>
                    <button type="button" onClick={() => setStickerOpen(false)} aria-label="Chiudi sticker">✕</button>
                  </span>
                </div>
                {stickers.length ? (
                  <div className="bl-sticker-grid">
                    {stickers.map(p => (
                      <span key={p} className="bl-sticker-item">
                        <button type="button" onClick={() => sendSticker(p)} disabled={sending} aria-label="Invia sticker"><img src={stickerUrl(p)} alt="" loading="lazy" draggable="false" /></button>
                        <i role="button" tabIndex={0} aria-label="Elimina sticker" onClick={() => removeSticker(p)} onKeyDown={e => { if (e.key === "Enter") removeSticker(p); }}>×</i>
                      </span>
                    ))}
                  </div>
                ) : <p className="bl-sticker-empty">Nessuno sticker. Tocca «Importa» e scegli i file WebP/PNG dei tuoi sticker di WhatsApp.</p>}
              </div>
            )}
            <input ref={stickerFileRef} type="file" accept="image/webp,image/png,image/jpeg" multiple hidden onChange={e => void importStickers(e.target.files)} />
            <button type="button" className="bl-sticker-btn" onClick={() => setStickerOpen(v => !v)} aria-pressed={stickerOpen} aria-label="Sticker" title="Sticker" style={{flex:"0 0 42px",width:42,height:42,border:0,borderRadius:"50%",background:"transparent",color:"inherit",fontSize:22,cursor:"pointer"}}>🎟️</button>
            <div className="bl-message-input-wrap" style={{position:"relative",display:"flex",alignItems:"flex-end",gap:8,flex:1,minWidth:0}}>
              <textarea ref={inputRef} value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === "Escape" && replyTo) { setReplyTo(null); return; } if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); if (draft.trim() && !sending) e.currentTarget.form?.requestSubmit(); } }} maxLength={CHAT_MAX_BODY - (replyTo ? makeQuoteMark(replyTo).length : 0)} rows={1} placeholder={replyTo ? "Scrivi la tua risposta…" : active.isGroup ? "Scrivi nel gruppo…" : "Scrivi un messaggio…"} aria-label="Scrivi un messaggio" style={{flex:1,minWidth:0,resize:"none",border:0,outline:"none",background:"transparent",color:"inherit",font:"inherit",fontSize:16,lineHeight:1.4,padding:"8px 2px",maxHeight:120,overflowY:"auto"}} />
            </div>
            <button type="submit" aria-label="Invia messaggio" title="Invia messaggio" disabled={!draft.trim() || sending} style={{flex:"0 0 42px",width:42,height:42,border:0,borderRadius:"50%",background:"var(--bl-accent, #20b8a5)",color:"#fff",display:"grid",placeItems:"center",fontSize:21,cursor:draft.trim()&&!sending?"pointer":"default",opacity:draft.trim()&&!sending?1:.5,boxShadow:"0 2px 8px #0003"}}>{sending ? "…" : "➤"}</button>
          </form>
          <small style={{display:"block",textAlign:"center",opacity:.55,fontSize:11,marginTop:5}}>Invio per spedire · Shift + Invio per andare a capo</small>
        </>
      ) : (
        <>
          <div className="bl-threads-header">
            {archiveOpen ? (
              <>
                <button type="button" className="bl-archive-back" onClick={() => { setArchiveOpen(false); setSwipeOpenKey(null); }}>‹ Chat</button>
                <p className="bl-muted">Archivio: chat nascoste su questo dispositivo.</p>
              </>
            ) : <p className="bl-muted">Le tue conversazioni, tutte in un unico posto.</p>}
            <span className="bl-threads-tools">
              <button ref={archiveBtnRef} type="button" className={`bl-archive-btn ${archiveOpen ? "on" : ""}`} onClick={() => { setArchiveOpen(v => !v); setSwipeOpenKey(null); }} aria-pressed={archiveOpen} aria-label={`Archivio chat nascoste (${threads.filter(isThreadHidden).length})`} title="Archivio chat nascoste">
                <Archive size={17} aria-hidden="true" />
                {threads.filter(isThreadHidden).length > 0 && <i>{threads.filter(isThreadHidden).length}</i>}
              </button>
              {!archiveOpen && (
                <button type="button" className="bl-new-group-btn" onClick={() => setNewGroupOpen(true)} title="Crea un nuovo gruppo">
                  <Users size={15} /> Nuovo gruppo
                </button>
              )}
            </span>
          </div>
          {loading ? (
            <p className="bl-muted">Caricamento conversazioni…</p>
          ) : error ? (
            <p className="bl-error" role="alert">{error}</p>
          ) : (threads.length || archiveOpen) ? (
            <div className="bl-thread-list">
              {(() => {
                const hiddenThreads = threads.filter(isThreadHidden);
                const visibleThreads = threads.filter(t => !isThreadHidden(t));
                const shown = archiveOpen ? hiddenThreads : visibleThreads;
                const renderThread = (t, hidden) => {
                  const key = threadKey(t);
                  const confirming = confirmDeleteKey === key;
                  const askDelete = () => { setSwipeOpenKey(null); setConfirmDeleteKey(key); };
                  const actions = [
                    hidden
                      ? { key: "show", label: "Ripristina", className: "is-hide", icon: <ArchiveRestore size={17} aria-hidden="true" />, onClick: () => void unhideThread(t) }
                      : { key: "hide", label: "Nascondi", className: "is-hide", icon: <Archive size={17} aria-hidden="true" />, onClick: () => void hideThread(t) },
                    { key: "del", label: t.isGroup ? "Abbandona" : "Elimina", className: "is-delete", icon: <Trash2 size={17} aria-hidden="true" />, onClick: askDelete }
                  ];
                  return (
                  <div className={`bl-thread-item ${confirming ? "confirming" : ""} ${hidden ? "is-hidden-chat" : ""}`} key={t.isGroup ? t.id : (t.conversationId || t.username)}
                    ref={(el) => { if (el) itemEls.current.set(key, el); else itemEls.current.delete(key); }}>
                    <SwipeRow
                      open={swipeOpenKey === key}
                      onOpenChange={(o) => setSwipeOpenKey(o ? key : (cur) => (cur === key ? null : cur))}
                      onLongPress={(rect) => openMenu(t, rect)}
                      actions={actions}
                      label={t.isGroup ? `Azioni per il gruppo ${t.name}` : `Azioni per la chat con @${t.username}`}
                    >
                      <button
                        type="button"
                        className={`bl-thread-row ${t.isGroup ? "is-group" : ""}`}
                        onClick={() => void loadConversation(t)}
                      >
                        <span className={`bl-thread-avatar ${t.isGroup ? "bl-thread-group-avatar" : ""}`}>
                          {t.isGroup ? <Users size={20} /> : <AvatarImage avatar={t.avatar} />}
                        </span>
                        <span className="bl-thread-copy">
                          <strong>
                            {t.isGroup ? t.name : `@${t.username}`}
                            {t.isGroup && <span className="bl-thread-group-badge">{t.members?.length || 2} membri</span>}
                          </strong>
                          <small>{t.lastMine ? "Tu: " : ""}{chatPreview(t.lastBody)}</small>
                        </span>
                        <span className="bl-thread-meta">
                          <small>{t.lastAt ? new Date(t.lastAt).toLocaleDateString("it-IT") : ""}</small>
                          {t.unread > 0 && <i>{t.unread}</i>}
                        </span>
                      </button>
                    </SwipeRow>
                    {confirming && (
                      <span className="bl-thread-confirm" role="group" aria-label={t.isGroup ? "Conferma uscita dal gruppo" : "Conferma eliminazione chat"}>
                        <span>{t.isGroup ? "Abbandonare il gruppo?" : "Eliminare la chat?"}</span>
                        <button type="button" className="bl-thread-confirm-yes" disabled={deletingKey === key} onClick={() => void deleteThread(t)}>{deletingKey === key ? "…" : t.isGroup ? "Abbandona" : "Elimina"}</button>
                        <button type="button" className="bl-thread-confirm-no" disabled={deletingKey === key} onClick={() => setConfirmDeleteKey(null)}>Annulla</button>
                      </span>
                    )}
                  </div>
                  );
                };
                if (shown.length) return shown.map(t => renderThread(t, archiveOpen));
                return archiveOpen
                  ? <div className="bl-insights-empty"><span>🗄️</span><h3>Archivio vuoto</h3><p>Le chat che nascondi finiscono qui. Tornano nell'elenco anche da sole quando ricevi un nuovo messaggio.</p></div>
                  : <p className="bl-muted">Tutte le chat sono nascoste: aprile dall'icona archivio.</p>;
              })()}
            </div>
          ) : (
            <div className="bl-insights-empty">
              <span>💌</span>
              <h3>Nessun messaggio</h3>
              <p>Apri una bolla e tocca “Messaggio” per iniziare una chat, oppure crea un nuovo gruppo.</p>
            </div>
          )}
        </>
      )}
      {error && active && <p className="bl-error" role="alert">{error}</p>}

      {menu && createPortal((() => {
        const W = 232, vw = window.innerWidth, vh = window.innerHeight;
        const rect = menu.rect || { left: vw / 2 - 100, width: 200, top: vh / 2, bottom: vh / 2 + 40 };
        const left = Math.max(12, Math.min(vw - W - 12, rect.left + rect.width / 2 - W / 2));
        const below = rect.bottom + 8 + 190 < vh;
        const pos = below ? { top: rect.bottom + 8 } : { bottom: vh - rect.top + 8 };
        const t = menu.t, key = menu.key;
        return (
          <div className={`bl-ctx-layer ${menu.closing ? "is-closing" : ""}`} onPointerDown={() => closeMenu()} onContextMenu={(e) => e.preventDefault()}>
            <div className="bl-ctx-menu" role="menu" aria-label="Azioni chat" style={{ left, width: W, ...pos, transformOrigin: `${rect.left + rect.width / 2 - left}px ${below ? "0%" : "100%"}` }} onPointerDown={(e) => e.stopPropagation()}>
              <div className="bl-ctx-title">{t.isGroup ? t.name : `@${t.username}`}</div>
              <button type="button" role="menuitem" className="bl-ctx-item" style={{ "--i": 0 }} onClick={() => closeMenu(() => (menu.hidden ? void unhideThread(t) : void hideThread(t)))}>
                {menu.hidden ? <ArchiveRestore size={18} aria-hidden="true" /> : <Archive size={18} aria-hidden="true" />}<span>{menu.hidden ? "Ripristina" : "Nascondi"}</span>
              </button>
              <button type="button" role="menuitem" className="bl-ctx-item is-delete" style={{ "--i": 1 }} onClick={() => closeMenu(() => setConfirmDeleteKey(key))}>
                <Trash2 size={18} aria-hidden="true" /><span>{t.isGroup ? "Abbandona gruppo" : "Elimina chat"}</span>
              </button>
            </div>
          </div>
        );
      })(), document.querySelector(".bl-root") || document.body)}

      {groupModalOpen && active && (
        <GroupManageModal
          group={active}
          me={me}
          avatarMap={avatarMap}
          onClose={() => onGroupModalOpenChange?.(false)}
          onAddMember={handleAddMember}
          onRemoveMember={handleRemoveMember}
          onLeaveGroup={handleLeaveGroup}
          onNotify={onNotify}
        />
      )}

      {newGroupOpen && (
        <NewGroupModal
          me={me}
          avatarMap={avatarMap}
          onClose={() => setNewGroupOpen(false)}
          onCreateGroup={handleCreateNewGroup}
          onNotify={onNotify}
        />
      )}
    </div>
  );
}

function LoginSheet({ onClose, onLogin, onGoogle }) {
  const [name, setName] = useState(""); const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault(); setError("");
    const username = name.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(username) || !/^\d{4}$/.test(pin)) { setError("Inserisci uno username valido e un PIN di quattro cifre."); return; }
    setBusy(true);
    try { await onLogin(username, pin); setPin(""); }
    catch (err) { setError(err?.message || "Accesso non riuscito."); }
    finally { setBusy(false); }
  }
  return <Sheet label="Accedi a BOLLE" onClose={onClose} title="Accedi a BOLLE" subtitle="Ritrova le tue bolle da qualsiasi dispositivo." z={10000}>
    <form className="bl-account-form" onSubmit={submit}>
      <label className="bl-field-label">Username<input type="text" autoComplete="username" minLength={3} maxLength={20} value={name} onChange={(e) => setName(e.target.value.toLowerCase())} placeholder="es. bubblefox27" required /></label>
      <label className="bl-field-label">PIN di 4 cifre<input type="password" inputMode="numeric" autoComplete="current-password" pattern="[0-9]{4}" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))} required /></label>
      {error && <p className="bl-error" role="alert">{error}</p>}
      <button className="bl-cta" type="submit" disabled={busy}>{busy ? "Accesso in corso…" : "Accedi"}</button>
      <p className="bl-muted">Hai dimenticato il PIN? Non è previsto un recupero automatico.</p>
      <button type="button" className="bl-google-button" onClick={onGoogle}>Continua con Google</button>
    </form>
  </Sheet>;
}

/* ====================== Componenti base ====================== */
function useEscape(fn) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && fn();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fn]);
}

function Sheet({ label, title, subtitle, onClose, onBack, wide, z, className = "", headerRight, children }) {
  return <div className="bl-sheet-wrap" style={z ? { zIndex: z } : undefined} onClick={(e) => e.target === e.currentTarget && onClose()}>
    <div className={`bl-sheet ${wide ? "bl-sheet-wide" : ""} ${className}`} role="dialog" aria-modal="true" aria-label={label}>
      <div className="bl-sheet-heading">
        {onBack && <button className="bl-sheet-x" onClick={onBack} aria-label="Indietro">‹</button>}
        <div className="bl-sheet-heading-main">{typeof title === "string" ? <h2>{title}</h2> : title}{subtitle && <p>{subtitle}</p>}</div>
        {headerRight}
        <button className="bl-sheet-x" onClick={onClose} aria-label="Chiudi">×</button>
      </div>
      {children}
    </div>
  </div>;
}

// Sfondo fisico indipendente dalle bolle cliccabili e dal limite Admin.
function ChaoticBubbleBackground() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { alpha: true });
    if (!ctx) return;
    let w = 0, h = 0, raf = 0, last = 0, particles = [];
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const random = (a, b) => a + Math.random() * (b - a);
    const palette = [[165,204,255],[215,171,255],[255,182,222],[153,242,230],[255,217,174]];
    const place = (r, list) => {
      for (let attempt = 0; attempt < 180; attempt++) {
        const x = random(r + 3, Math.max(r + 4, w - r - 3));
        const y = random(r + 3, Math.max(r + 4, h - r - 3));
        if (list.every(b => Math.hypot(x - b.x, y - b.y) >= r + b.r + 3)) return {x,y};
      }
      return null; // Mai introdurre una sovrapposizione, anche su schermi piccoli.
    };
    const resize = () => {
      const dpr = IS_COARSE ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = [];
      // Densità elevata ma con spazio sufficiente per collisioni e movimento.
      const target = IS_COARSE ? Math.min(34, Math.max(18, Math.floor(w * h / 11000))) : Math.min(95, Math.max(32, Math.floor(w * h / 4600)));
      for (let i = 0; i < target; i++) {
        const r = random(6, 15) * (Math.random() < .22 ? 1.65 : 1);
        const point = place(r, particles);
        if (!point) continue;
        const angle = random(0, Math.PI * 2), speed = random(19, 55);
        particles.push({...point, r, vx:Math.cos(angle)*speed, vy:Math.sin(angle)*speed,
          color:palette[i % palette.length], squash:0, phase:random(0, 7)});
      }
    };
    const draw = (b, t) => {
      const [red,green,blue] = b.color;
      const stretch = b.squash;
      const angle = Math.atan2(b.vy, b.vx);
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(angle);
      ctx.scale(1 + stretch, 1 - stretch * .65);
      const grad = ctx.createRadialGradient(-b.r*.33,-b.r*.4, b.r*.06, 0,0,b.r);
      grad.addColorStop(0, `rgba(255,255,255,.42)`);
      grad.addColorStop(.5, `rgba(${red},${green},${blue},.20)`);
      grad.addColorStop(1, `rgba(${red},${green},${blue},.08)`);
      ctx.fillStyle = grad; ctx.strokeStyle = `rgba(${red},${green},${blue},.66)`;
      ctx.lineWidth = 1.15;
      ctx.beginPath();ctx.arc(0,0,b.r,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.beginPath();ctx.ellipse(-b.r*.32,-b.r*.37,b.r*.22,b.r*.10,-.65,0,Math.PI*2);
      ctx.fillStyle='rgba(255,255,255,.56)';ctx.fill();
      ctx.restore();
    };
    let lastDraw = 0, tick = 0, overlayOpen = false;
    const frame = (time) => {
      raf = requestAnimationFrame(frame);
      if (time - lastDraw < 40) return; // ~25 fps: più che sufficiente per uno sfondo
      lastDraw = time;
      if (++tick % 10 === 0) overlayOpen = Boolean(document.querySelector(".bl-viewer, .bl-sheet-wrap, .bl-gift-overlay"));
      if (overlayOpen) { last = 0; return; } // nulla da animare sotto una finestra aperta
      const dt = Math.min((time - (last || time)) / 1000, .06);
      last = time;
      if (!document.hidden && !reduced.matches) {
        for (const b of particles) {
          // Piccole deviazioni imprevedibili, senza teletrasporti.
          b.vx += Math.cos(time*.0011 + b.phase*7) * 15 * dt;
          b.vy += Math.sin(time*.0013 + b.phase*5) * 15 * dt;
          const speed = Math.hypot(b.vx,b.vy) || 1;
          if (speed > 66) {b.vx *= 66/speed; b.vy *= 66/speed;}
          if (speed < 17) {b.vx *= 1.03; b.vy *= 1.03;}
          b.x += b.vx*dt; b.y += b.vy*dt;
          if (b.x < b.r) {b.x=b.r;b.vx=Math.abs(b.vx);b.squash=.18;}
          if (b.x > w-b.r) {b.x=w-b.r;b.vx=-Math.abs(b.vx);b.squash=.18;}
          if (b.y < b.r) {b.y=b.r;b.vy=Math.abs(b.vy);b.squash=.18;}
          if (b.y > h-b.r) {b.y=h-b.r;b.vy=-Math.abs(b.vy);b.squash=.18;}
          b.squash *= Math.exp(-dt*10);
        }
        // Collisioni elastiche tra coppie, con separazione immediata.
        for (const [i,j] of nearbyPairs(particles, 1)) {
          const a=particles[i],b=particles[j];
          let dx=b.x-a.x,dy=b.y-a.y,dist=Math.hypot(dx,dy);
          const minDist=a.r+b.r+1;
          if (dist>=minDist) continue;
          if(dist<.0001){dx=1;dy=0;dist=1;}
          const nx=dx/dist,ny=dy/dist,overlap=minDist-dist;
          a.x-=nx*overlap*.5;a.y-=ny*overlap*.5;
          b.x+=nx*overlap*.5;b.y+=ny*overlap*.5;
          const relative=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;
          if(relative<0){
            const impulse=-relative*.94;
            a.vx-=impulse*nx;a.vy-=impulse*ny;
            b.vx+=impulse*nx;b.vy+=impulse*ny;
          }
          a.squash=Math.max(a.squash,.20);b.squash=Math.max(b.squash,.20);
        }
      }
      ctx.clearRect(0,0,w,h);
      for(const b of particles) draw(b,time);
    };
    resize();
    const onVisibility = () => {
      cancelAnimationFrame(raf);
      last = 0;
      if (!document.hidden) raf = requestAnimationFrame(frame);
    };
    if (!document.hidden) raf = requestAnimationFrame(frame);
    window.addEventListener('resize',resize);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize',resize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);
  return <canvas ref={canvasRef} className="bl-home-physics" aria-hidden="true" />;
}

// Profondità del feed: 3 piani stabili per bolla (nessun costo extra: solo scala e opacità).
const DEPTH_LAYERS = [{ i: 0, s: 1, o: 1 }, { i: 1, s: .84, o: .9 }, { i: 2, s: .7, o: .78 }];
function depthLayer(id, starter) {
  if (starter) return DEPTH_LAYERS[2];
  const k = hash(String(id)) % 10;
  return DEPTH_LAYERS[k < 4 ? 0 : k < 8 ? 1 : 2];
}

function BubbleView({ bubble, bursting, locked, showDistance, onPop, isFavorite, onToggleFavorite, avatar, countryCode, onShare, isRare, isSecret, kindHint }) {
  const slotRef = useRef(null);
  const motion = useRef(null);
  const dragging = useRef(null);
  const suppressClick = useRef(false);
  const burstRef = useRef(false);
  burstRef.current = bursting;
  const [draggingNow, setDraggingNow] = useState(false);
  const h = useMemo(() => hash(bubble.id), [bubble.id]);
  const authorName = String(bubble.username || bubble.author_username || "utente");
  // Diametro proporzionale al testo: lascia spazio a @, username e stellina.
  const size = bubble.system ? 98 + (h % 22) : bubble.starter ? 60 + (h % 35) : Math.min(178, Math.max(94, 54 + authorName.length * 7.4));
  const style = useMemo(() => ({ "--s": `${size}px`, "--float-time": `${5 + (h % 50) / 10}s`, "--float-delay": `${-(h % 70) / 10}s`, "--float-x": `${(h % 13) - 6}px`, "--float-y": `${-5 - (h % 7)}px`, "--liquid-duration": `${13 + (h % 13)}s`, "--liquid-delay": `${-(h % 19)}s`, "--breath-duration": `${5.8 + (h % 47) / 10}s`, "--breath-delay": `${-(h % 31) / 5}s`, ...bubbleLook(h) }), [h, size]);
  const distance = showDistance ? formatDistance(bubble.distance_km) : null;
  const capsuleMs = useCapsuleRemaining(bubble);
  const sealed = !bubble.starter && capsuleMs > 0; // capsula del tempo ancora chiusa
  const capsuleTotal = useMemo(() => sealed ? capsuleTotalMs(bubble, capsuleMs) : 0, [sealed, bubble.opens_at, bubble.created_at]); // eslint-disable-line react-hooks/exhaustive-deps
  // Finché è chiusa il tipo resta una sorpresa: si rivela quando il timer arriva a zero.
  const kind = bubble.starter ? "system" : sealed ? "capsule" : bubbleKind(kindHint ? { ...bubble, kind: kindHint } : bubble);
  const ageStage = bubble.starter ? 0 : Math.max(0, getBubbleAgeStage(bubbleAgeFrom(bubble)));
  const remainingHours = bubble.starter || sealed ? null : getBubbleRemainingHours(bubbleAgeFrom(bubble));
  const category = bubble.category || "utente";
  const sysCat = bubble.system ? (SYSTEM_CATEGORIES[bubble.systemCategory] || SYSTEM_CATEGORIES.curiosita) : null;
  const themed = !bubble.starter && category !== "utente" && USER_CATEGORIES.some(c => c.id === category); // bolla "a tema" del profilo che l'ha pubblicata

  // Griglia stabile con lieve oscillazione CSS: movimento visibile senza collisioni.
  useEffect(() => { motion.current = {x:0,y:0,vx:0,vy:0}; }, [bubble.id]);

  function down(e) {
    if (e.button !== 0) return;
    warmAudio();
    const m = motion.current;
    dragging.current = { id: e.pointerId, x: e.clientX, y: e.clientY, ox: m?.x || 0, oy: m?.y || 0, lastX: e.clientX, lastY: e.clientY, lastT: performance.now(), moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
    setDraggingNow(true);
  }
  function move(e) {
    const d = dragging.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (Math.hypot(dx, dy) > 8) d.moved = true;
    const m = motion.current;
    if (m && d.moved) {
      m.x = 0;
      m.y = 0;
      const dt = Math.max(16, performance.now() - d.lastT) / 1000;
      m.vx = Math.max(-190, Math.min(190, (e.clientX - d.lastX) / dt));
      m.vy = Math.max(-190, Math.min(190, (e.clientY - d.lastY) / dt));
      d.lastX = e.clientX; d.lastY = e.clientY; d.lastT = performance.now();
    }
  }
  function up(e) {
    if (dragging.current?.id !== e.pointerId) return;
    if (dragging.current.moved) suppressClick.current = true;
    dragging.current = null;
    setDraggingNow(false);
  }
  function click(e) {
    if (suppressClick.current) { e.preventDefault(); suppressClick.current = false; return; }
    onPop(); // anche da "locked": l'App mostra il messaggio di saldo esaurito
  }
  return <div ref={slotRef} className={`bl-slot ${bursting ? "bursting" : ""} ${draggingNow ? "dragging" : ""}`} style={style}>
    <button className={`bl-bubble ${bubble.starter ? "" : "bl-bubble--user"} ${sysCat ? `bl-bubble--system bl-bubble--sys-${sysCat.id}` : ""} bl-bubble--kind-${kind} ${themed ? `bl-bubble--cat bl-bubble--cat-${category}` : ""} ${sealed ? "bl-bubble--capsule" : ""} ${isRare ? "bl-bubble--rare" : ""} bl-bubble--age-${ageStage}`} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onClick={click}
      aria-label={sysCat ? `Scoppia una bolla di sistema: ${sysCat.label}` : themed && !sealed ? `Scoppia una bolla di ${categoryLabel(category)}${distance ? `, a ${distance}` : ""}` : sealed ? (distance ? `Capsula del tempo, non ancora apribile, a ${distance}` : "Capsula del tempo, non ancora apribile") : distance ? `Scoppia una bolla, a ${distance}` : "Scoppia una bolla"} aria-disabled={locked && !sealed}>
      <span className="bl-liquid-film" aria-hidden="true" /><span className="bl-bubble-glint" aria-hidden="true" /><span className="bl-bubble-reflection" aria-hidden="true" />
      <span className={`bl-kind-fx bl-kind-fx--${kind}`} aria-hidden="true"><i /></span>
      {themed && <span className={`bl-cat-art bl-cat-art--${category}`} aria-hidden="true"><i className="bl-cat-pattern" /><b>{categoryIcon(category)}</b></span>}
      {!bubble.starter && !themed && <span className="bl-bubble-category-badge" title={categoryLabel(category)}>{categoryIcon(category)}</span>}
      {sysCat && <span className="bl-system-mark"><b aria-hidden="true">{bubble.emoji || sysCat.icon}</b><em>{sysCat.label}</em></span>}
      {!bubble.starter && <span className="bl-bubble-username">{bubble.username || bubble.author_username ? `@${authorName}` : "Anonimo"}</span>}
      {sealed && <CapsuleRing fraction={capsuleMs / capsuleTotal} />}
      {sealed && <span className="bl-capsule-timer" role="timer" aria-label="Tempo mancante all'apertura"><span aria-hidden="true">⏳</span> {formatCountdown(capsuleMs)}</span>}
      {distance && <span className="bl-dist">{distance}</span>}
      {!bubble.starter && remainingHours !== null && remainingHours <= 12 && <span className="bl-age-countdown" title="Ore rimaste prima che svanisca">⏳ {remainingHours}h</span>}
      {isRare && <span className="bl-rare-label" aria-label="Bolla rara">🌟 RARA</span>}
      {isSecret && <span className="bl-secret-label" aria-label="Bolla segreta">🔐</span>}
    </button>

    {!bubble.starter && countryFlag(countryCode) && <span className="bl-country-flag" title={`Nazione di pubblicazione: ${countryCode}`} aria-label={`Nazione di pubblicazione: ${countryCode}`}>{countryFlag(countryCode)}</span>}

    {bursting && <span className="bl-explosion" aria-hidden="true">
      <span className="bl-shockwave" />
      {Array.from({ length: 18 }, (_, i) => <i key={i} className="bl-spray" style={{ "--a": `${i * 20 + (hash(bubble.id + i) % 15)}deg`, "--d": `${55 + (hash(bubble.id + i * 3) % 75)}px`, "--sz": `${3 + (i % 6)}px` }} />)}
      {Array.from({ length: 7 }, (_, i) => <b key={i} className="bl-film" style={{ "--a": `${i * 51}deg`, "--d": `${38 + i * 9}px` }} />)}
    </span>}
  </div>;
}


// GIPHY & KLIPY: Integrazione congiunta per GIF e Meme
const GIPHY_KEY = import.meta.env.VITE_GIPHY_API_KEY || GIPHY_API_KEY || "u6Z3iuUoSGTPbFAfPkFulENlurgQEADu";
const GIF_TAG = '[GIF:GIPHY:';

function normalizeAnswer(value) {
  if (value && typeof value === 'object') return value.answer ?? value.value ?? value.text ?? '';
  return value ?? '';
}

function gifAnswerId(value) {
  value = normalizeAnswer(value);
  const match = typeof value === 'string' && value.match(/^\[GIF:GIPHY:([a-zA-Z0-9_-]{1,80})\]$/);
  return match ? match[1] : null;
}

function GifAnswer({ value }) {
  const answer = normalizeAnswer(value);
  const id = gifAnswerId(answer);
  if (id) {
    return (
      <span className="bl-giphy-answer">
        <img loading="lazy" src={`https://media.giphy.com/media/${id}/giphy.gif`} alt="Risposta GIF" />
        <small>Powered by GIPHY</small>
      </span>
    );
  }
  const matchKlipy = typeof answer === 'string' && answer.match(/^\[GIF:KLIPY:(.+)\]$/);
  if (matchKlipy) {
    return (
      <span className="bl-giphy-answer">
        <img loading="lazy" src={matchKlipy[1]} alt="Risposta GIF" />
        <small>Powered by Klipy</small>
      </span>
    );
  }
  return <>{answer}</>;
}

function extractKlipyUrl(item) {
  if (!item) return null;
  const urlOf = (v) => (typeof v === "string" ? v : v?.url || null);
  const file = item.file;
  if (typeof file === "string") return file;
  if (file && typeof file === "object") {
    // Formato Klipy: file.{hd|md|sm|xs}.{gif|webp|jpg|png|mp4}.url
    for (const size of ["md", "sm", "hd", "xs"]) {
      for (const fmt of ["gif", "webp", "jpg", "png"]) {
        const u = urlOf(file[size]?.[fmt]);
        if (u) return u;
      }
    }
    for (const fmt of ["gif", "webp", "jpg", "png"]) { const u = urlOf(file[fmt]); if (u) return u; }
  }
  if (item.files) {
    for (const k of ["gif", "webp", "original", "medium"]) { const u = urlOf(item.files[k]); if (u) return u; }
  }
  if (item.images?.fixed_width?.url) return item.images.fixed_width.url;
  if (item.images?.original?.url) return item.images.original.url;
  if (item.media_url) return item.media_url;
  if (typeof item.url === "string" && /\.(gif|webp|jpg|jpeg|png)($|\?)/i.test(item.url)) return item.url;
  return null;
}
function klipyCustomerId() {
  try {
    let id = localStorage.getItem("bolle-klipy-customer");
    if (!id) { id = crypto.randomUUID(); localStorage.setItem("bolle-klipy-customer", id); }
    return id;
  } catch { return "bolle-anon"; }
}

async function fetchFromKlipy(q, type, signal) {
  if (!KLIPY_API_KEY) return [];
  const rawQ = (q || "").trim();
  const cid = `&customer_id=${encodeURIComponent(klipyCustomerId())}`;
  const isSearch = Boolean(rawQ);
  
  const endpoints = type === "meme"
    ? [
        isSearch
          ? `https://api.klipy.com/api/v1/${KLIPY_API_KEY}/static-memes/search?q=${encodeURIComponent(rawQ)}&page=1&per_page=24`
          : `https://api.klipy.com/api/v1/${KLIPY_API_KEY}/static-memes/trending?page=1&per_page=24`,
        isSearch
          ? `https://api.klipy.com/api/v1/${KLIPY_API_KEY}/memes/search?q=${encodeURIComponent(rawQ)}&per_page=24`
          : `https://api.klipy.com/api/v1/${KLIPY_API_KEY}/memes/trending?per_page=24`
      ]
    : [
        isSearch
          ? `https://api.klipy.com/api/v1/${KLIPY_API_KEY}/gifs/search?q=${encodeURIComponent(rawQ)}&page=1&per_page=24`
          : `https://api.klipy.com/api/v1/${KLIPY_API_KEY}/gifs/trending?page=1&per_page=24`
      ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url + cid, { signal });
      if (!res.ok) { console.warn("Klipy: risposta", res.status, url); continue; }
      const json = await res.json();
      const rawData = Array.isArray(json.data) ? json.data : (json.data?.data || json.results || []);
      const parsed = (rawData || []).map(item => ({
        id: String(item.id || item.slug || Math.random().toString(36).slice(2)),
        title: item.title || item.slug || "Klipy",
        url: extractKlipyUrl(item),
        provider: "klipy"
      })).filter(x => x.url);
      if (parsed.length > 0) return parsed;
    } catch (e) {
      if (e.name === "AbortError") throw e;
    }
  }
  return [];
}

async function fetchFromGiphy(q, type, signal) {
  const rawQ = (q || "").trim();
  const searchQ = type === "meme" ? (rawQ ? `${rawQ} meme` : "meme") : rawQ;
  const isSearch = Boolean(searchQ);
  const url = isSearch
    ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(searchQ)}&limit=24&rating=pg-13&lang=it`
    : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_KEY}&limit=24&rating=pg-13`;

  try {
    const res = await fetch(url, { signal });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data || []).map(item => ({
      id: item.id,
      title: item.title || "GIPHY",
      url: item.images?.fixed_width?.url || item.images?.downsized?.url || item.images?.original?.url,
      provider: "giphy",
      images: item.images
    })).filter(x => x.url);
  } catch (e) {
    if (e.name === "AbortError") throw e;
    return [];
  }
}

const MEDIA_QUICK_TAGS = [
  { label: "🔥 Tendenze", q: "" },
  { label: "😂 Meme", q: "meme" },
  { label: "🐱 Gatti", q: "cat" },
  { label: "🎉 Festa", q: "party" },
  { label: "❤️ Love", q: "love reaction" },
  { label: "😱 Shock", q: "shocked reaction" },
  { label: "☕ Buongiorno", q: "coffee morning" }
];

function KlipyPicker({ onPick, selectedUrl = null, initialTab = "gif", initialSource = "both" }) {
  const [source, setSource] = useState(initialSource); // "both" | "klipy" | "giphy"
  const [tab, setTab] = useState(initialTab === "meme" ? "meme" : "gif"); // "gif" | "meme"
  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        let results = [];
        if (source === "both") {
          const [kRes, gRes] = await Promise.allSettled([
            fetchFromKlipy(query, tab, controller.signal),
            fetchFromGiphy(query, tab, controller.signal)
          ]);
          const kItems = kRes.status === "fulfilled" ? kRes.value : [];
          const gItems = gRes.status === "fulfilled" ? gRes.value : [];
          const merged = [];
          const max = Math.max(kItems.length, gItems.length);
          for (let i = 0; i < max; i++) {
            if (i < kItems.length) merged.push(kItems[i]);
            if (i < gItems.length) merged.push(gItems[i]);
          }
          results = merged;
        } else if (source === "klipy") {
          results = await fetchFromKlipy(query, tab, controller.signal);
        } else {
          results = await fetchFromGiphy(query, tab, controller.signal);
        }

        if (!alive) return;
        setItems(results);
        if (results.length === 0) {
          setError(
            (source === "klipy" && !KLIPY_API_KEY)
              ? "Klipy non è configurato: manca VITE_KLIPY_API_KEY nelle variabili d'ambiente."
              : source === "klipy"
              ? "Nessun risultato da Klipy. Prova con un'altra parola o seleziona «Entrambi»."
              : source === "giphy"
              ? "Nessun risultato da GIPHY. Prova con un'altra parola o seleziona «Entrambi»."
              : "Nessun contenuto trovato per questa ricerca."
          );
        }
      } catch (err) {
        if (alive && err.name !== "AbortError") setError(err.message || "Errore di caricamento");
      } finally {
        if (alive && !controller.signal.aborted) setLoading(false);
      }
    }, 320);

    return () => {
      alive = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, tab, source]);

  return (
    <div className="bl-klipy-picker" onPointerDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
      <div className="bl-media-sources" role="tablist" aria-label="Sorgente multimediale">
        <button
          type="button"
          className={source === "both" ? "active" : ""}
          onClick={() => setSource("both")}
        >
          ✨ Entrambi (Klipy + GIPHY)
        </button>
        <button
          type="button"
          className={source === "klipy" ? "active" : ""}
          onClick={() => setSource("klipy")}
        >
          ⚡ Klipy {KLIPY_API_KEY ? "✓" : ""}
        </button>
        <button
          type="button"
          className={source === "giphy" ? "active" : ""}
          onClick={() => setSource("giphy")}
        >
          👾 GIPHY ✓
        </button>
      </div>

      <div className="bl-klipy-tabs" role="tablist">
        <button
          type="button"
          className={tab === "gif" ? "active" : ""}
          onClick={() => setTab("gif")}
        >
          🎞️ GIF animate
        </button>
        <button
          type="button"
          className={tab === "meme" ? "active" : ""}
          onClick={() => setTab("meme")}
        >
          😂 Meme popolari
        </button>
      </div>

      <div className="bl-media-quick-tags">
        {MEDIA_QUICK_TAGS.map(t => (
          <button
            type="button"
            key={t.label}
            onClick={() => setQuery(t.q)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <input
        type="search"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder={
          source === "both"
            ? `Cerca ${tab === "meme" ? "meme" : "GIF"} su Klipy e GIPHY…`
            : `Cerca su ${source === "klipy" ? "Klipy" : "GIPHY"}…`
        }
        className="bl-author-search-box"
      />

      {loading && <p className="bl-muted">Ricerca in corso su {source === "both" ? "Klipy & GIPHY" : source === "klipy" ? "Klipy" : "GIPHY"}…</p>}
      {error && <p className="bl-error">{error}</p>}

      <div className="bl-klipy-grid">
        {items.map(item => (
          <button
            type="button"
            key={`${item.provider}-${item.id}`}
            className={`bl-media-card ${selectedUrl === item.url ? "selected" : ""}`}
            onClick={() => onPick(item)}
            aria-label={`Scegli ${item.title || "media"} (${item.provider})`}
          >
            <img src={item.url} alt={item.title || "media"} loading="lazy" />
            <span className={`bl-media-badge bl-badge-${item.provider}`}>
              {item.provider === "klipy" ? "⚡ Klipy" : "👾 GIPHY"}
            </span>
          </button>
        ))}
      </div>

      <div className="bl-media-footer-credits bl-muted">
        <span>{items.length} {tab === "meme" ? "meme" : "GIF"} trovati</span>
        <span>⚡ Klipy API & 👾 GIPHY</span>
      </div>
    </div>
  );
}

function GiphyPicker(props) {
  return <KlipyPicker initialSource="both" {...props} />;
}

function Viewer({ viewer, onClose, onGiftBack, onReport, onReact, reactionBusy, isFavorite, onToggleFavorite, onShare, onDiscoveryInteraction, onBlockUser, onMessage, onContinueChain, onSendReply, onShareToUser, favoriteList, scrollMode = false, scrollDir = "up", onToggleScroll = null, onScrollNav = null }) {
  // Bolle pubblicate prima della migrazione: l'autore, riaprendole, completa l'anteprima sfocata (una sola volta).
  useEffect(() => {
    if (!viewer?.isAuthor || viewer.status !== "ready" || viewer.type !== "image" || !viewer.url || !viewer.id) return undefined;
    const key = `bl_prev_${viewer.id}`;
    try { if (localStorage.getItem(key)) return undefined; } catch { /* storage non disponibile */ }
    let alive = true;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = async () => {
      try {
        const uri = await makeBlurPreview(img);
        const r = await seqApi.setPreview(viewer.id, uri);
        if (alive && !r?.error) { try { localStorage.setItem(key, "1"); } catch { /* ok */ } }
      } catch { /* mai bloccante */ }
    };
    img.src = viewer.url;
    return () => { alive = false; };
  }, [viewer?.id, viewer?.status, viewer?.type, viewer?.url, viewer?.isAuthor]);
  const [vEdit, setVEdit] = useState(null); // modifiche del video (filtro, taglio, muto) salvate dall'autore
  const [vEditReady, setVEditReady] = useState(false);
  useEffect(() => {
    setVEdit(null); setVEditReady(false);
    if (!viewer?.id || viewer.status !== "ready" || viewer.type !== "video") return undefined;
    let alive = true;
    Promise.resolve(supabase.rpc("bolle_get_media_edit", { p_bubble_id: String(viewer.id) }))
      .then(({ data, error }) => { if (alive) { setVEdit(error ? null : sanitizeVideoEdit(data)); setVEditReady(true); } })
      .catch(() => { if (alive) setVEditReady(true); }); // senza modifiche (o senza SQL applicato) il video parte com'è
    return () => { alive = false; };
  }, [viewer?.id, viewer?.status, viewer?.type]);
  const [ovs, setOvs] = useState([]); // testo in sovrimpressione: il server lo consegna solo dopo lo scoppio (o all'autore)
  useEffect(() => {
    setOvs([]);
    if (!viewer?.id || viewer.status !== "ready" || viewer.gift || !(viewer.type === "image" || viewer.type === "video")) return undefined;
    let alive = true;
    seqApi.overlays(viewer.id).then(rows => { if (alive) setOvs(rows); }).catch(() => {});
    return () => { alive = false; };
  }, [viewer?.id, viewer?.status, viewer?.type, viewer?.gift]);
  const [poll, setPoll] = useState(null);
  const [question, setQuestion] = useState(null);
  const [reactionCounts, setReactionCounts] = useState(null);
  const [answer, setAnswer] = useState("");
  const [answerGif, setAnswerGif] = useState(null);
  const [showAnswerGifs, setShowAnswerGifs] = useState(false);
  const [answerBusy, setAnswerBusy] = useState(false);
  const [answerError, setAnswerError] = useState("");
  const [questionLoadError, setQuestionLoadError] = useState("");
  const [interactionLoading, setInteractionLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [truth, setTruth] = useState(null);
  const [truthBusy, setTruthBusy] = useState(false);
  const [truthFeedback, setTruthFeedback] = useState(null); // { ok, n }: animazione dopo aver risposto a "2 verità 1 bugia"
  useEffect(() => { setTruthFeedback(null); }, [viewer.id]);
  useEffect(() => {
    if (!truthFeedback) return undefined;
    const t = setTimeout(() => setTruthFeedback(null), 3400);
    return () => clearTimeout(t);
  }, [truthFeedback]);
  const [truthError, setTruthError] = useState("");
  const [rating, setRating] = useState(null);
  const [ratingValue, setRatingValue] = useState(7);
  const [ratingBusy, setRatingBusy] = useState(false);
  const [ratingError, setRatingError] = useState("");
  const [pollError, setPollError] = useState("");
  const pollSwipeStart = useRef(null);
  const [pollSwipeX, setPollSwipeX] = useState(0);
  const [pollSwipeFlying, setPollSwipeFlying] = useState(false);
  const [pollGlassVisible, setPollGlassVisible] = useState(false);
  // Schermata "storia": messaggio all'autore, cuore, inoltro e menu.
  const [msg, setMsg] = useState("");
  const [msgFocus, setMsgFocus] = useState(false);
  const [msgBusy, setMsgBusy] = useState(false);
  const [msgNote, setMsgNote] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [burstKey, setBurstKey] = useState(0);
  useEffect(() => { setMsg(""); setMsgFocus(false); setMsgBusy(false); setMsgNote(""); setShareOpen(false); setMenuOpen(false); setBurstKey(0); }, [viewer.id]);
  useEffect(() => { if (viewer.reacted) setBurstKey(k => k + 1); }, [viewer.reacted]);
  useEffect(() => { if (!msgNote) return undefined; const t = setTimeout(() => setMsgNote(""), 2800); return () => clearTimeout(t); }, [msgNote]);
  const storyPaused = msgFocus || shareOpen || menuOpen || msg.trim().length > 0; // mentre scrivi o inoltri il timer si ferma
  const pollSwipeBusy = useRef(false);
  const pollSwipeTimer = useRef(null);
  useEffect(() => () => { if (pollSwipeTimer.current) clearTimeout(pollSwipeTimer.current); }, []);
  useEffect(() => { setPollSwipeX(0); setPollSwipeFlying(false); pollSwipeBusy.current = false; if (pollSwipeTimer.current) clearTimeout(pollSwipeTimer.current); }, [viewer.id]);
  const onPollSwipeStart = (event) => {
    if (viewer.isAuthor || poll?.my_vote || voting || pollSwipeBusy.current || event.pointerType === "mouse" && event.button !== 0) return;
    pollSwipeStart.current = { x: event.clientX, y: event.clientY, id: event.pointerId, axis: null };
    event.stopPropagation();
  };
  const onPollSwipeMove = (event) => {
    const start = pollSwipeStart.current;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (!start.axis && Math.hypot(dx, dy) > 9) start.axis = Math.abs(dx) > Math.abs(dy) * 1.15 ? "horizontal" : "vertical";
    if (start.axis !== "horizontal") return;
    event.stopPropagation();
    if (event.cancelable) event.preventDefault();
    setPollSwipeX(Math.max(-260, Math.min(260, dx)));
  };
  const onPollSwipeEnd = (event) => {
    const start = pollSwipeStart.current;
    if (!start || start.id !== event.pointerId) return;
    pollSwipeStart.current = null;
    if (start.axis === "vertical" && scrollMode) {
      const dyv = event.clientY - start.y;
      if (Math.abs(dyv) >= 70) { event.stopPropagation(); suppressClickUntil.current = Date.now() + 450; navigate(dyv < 0 ? 1 : -1); }
      return;
    }
    if (start.axis !== "horizontal") return;
    event.stopPropagation();
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) >= 95 && Math.abs(dx) > Math.abs(dy) * 1.15 && !poll?.my_vote && !voting) {
      pollSwipeBusy.current = true;
      setPollSwipeFlying(true);
      setPollSwipeX(dx > 0 ? window.innerWidth : -window.innerWidth);
      pollSwipeTimer.current = setTimeout(() => {
        setPollSwipeFlying(false);
        setPollSwipeX(0);
        pollSwipeBusy.current = false;
        vote(dx < 0 ? 1 : 2);
      }, 260);
    } else {
      setPollSwipeX(0);
    }
  };
  const onPollSwipeCancel = () => { pollSwipeStart.current = null; setPollSwipeX(0); setPollSwipeFlying(false); };
  useEffect(() => {let alive=true;setPoll(null);setQuestion(null);setTruth(null);setRating(null);setTruthError("");setRatingError("");setRatingValue(7);setReactionCounts(null);setAnswer("");setAnswerGif(null);setShowAnswerGifs(false);setAnswerError("");setQuestionLoadError("");setPollError("");setPollGlassVisible(false);setInteractionLoading(true);
    if(viewer.gift||viewer.type==="surprise"||viewer.type==="capsule"){setInteractionLoading(false);return;} // parte subito, in parallelo con l'URL firmato (la bolla è già scoppiata)
    Promise.all([supabase.rpc("bolle_poll_result",{p_bubble_id:viewer.id}),supabase.rpc("bolle_question_public_v4",{p_bubble_id:viewer.id}),supabase.rpc("bolle_reaction_counts_v4",{p_bubble_id:viewer.id}),supabase.rpc("bolle_truth_public",{p_bubble_id:viewer.id}),supabase.rpc("bolle_rating_public",{p_bubble_id:viewer.id})])
      .then(([p,q,r,t,g])=>{if(!alive)return;if(!t.error)setTruth(t.data||null);if(!g.error)setRating(g.data||null);if(!p.error){setPoll(p.data);if(p.data?.my_vote || viewer.isAuthor)setPollGlassVisible(true);}else setPollError(p.error.message);if(!q.error)setQuestion(q.data);else setQuestionLoadError(q.error.message);if(!r.error)setReactionCounts(r.data || {});else console.warn("Bolle: conteggi reazioni non disponibili",r.error.message);setInteractionLoading(false);})
      .catch(()=>{if(alive)setInteractionLoading(false)});
    return()=>{alive=false};},[viewer.id,viewer.gift,viewer.type]);
  async function sendAnswer(){if(viewer.isAuthor||answerBusy||!(answer.trim()||answerGif)||question?.my_answer)return;setAnswerBusy(true);setAnswerError("");const pAnswer = answerGif ? (answerGif.provider === "klipy" ? `[GIF:KLIPY:${answerGif.url}]` : `${GIF_TAG}${answerGif.id}]`) : answer.trim();const {data,error}=await supabase.rpc("bolle_answer_question",{p_bubble_id:viewer.id,p_answer:pAnswer});setAnswerBusy(false);if(error)setAnswerError(errorText(error));else {const updated=await supabase.rpc("bolle_question_public_v4",{p_bubble_id:viewer.id});setQuestion(updated.error?data:updated.data);onDiscoveryInteraction?.("answer");}}

  async function vote(choice){if(viewer.isAuthor || voting || poll?.my_vote)return;setVoting(true);setPollError("");const {data,error}=await supabase.rpc("bolle_vote_poll",{p_bubble_id:viewer.id,p_choice:choice});setVoting(false);if(error)setPollError(errorText(error));else {setPoll(data);setPollGlassVisible(true);onDiscoveryInteraction?.("vote");}}
  async function guessTruth(i){if(viewer.isAuthor||truthBusy||truth?.my_guess!=null)return;setTruthBusy(true);setTruthError("");const {data,error}=await supabase.rpc("bolle_guess_truth",{p_bubble_id:viewer.id,p_guess:i});setTruthBusy(false);if(error)setTruthError(errorText(error));else{setTruth(data);if(data&&data.my_guess!=null&&data.lie_index!=null)setTruthFeedback({ok:Number(data.my_guess)===Number(data.lie_index),n:Date.now()});onDiscoveryInteraction?.("vote");}}
  async function sendRating(){if(viewer.isAuthor||ratingBusy||rating?.my_value!=null)return;setRatingBusy(true);setRatingError("");const {data,error}=await supabase.rpc("bolle_rate_bubble",{p_bubble_id:viewer.id,p_value:ratingValue});setRatingBusy(false);if(error)setRatingError(errorText(error));else{setRating(data);onDiscoveryInteraction?.("vote");}}
  const [dissolving, setDissolving] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [swipeClosing, setSwipeClosing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef(null);
  const backdropTap = useRef(null);
  const dragValue = useRef(0);
  const swipeActive = useRef(false);
  const springStop = useRef(null); // molla di rilascio in corso (rimbalzo dopo il trascinamento)
  const [springing, setSpringing] = useState(false);
  // Cambio bolla in scorrimento: la bolla attuale si contrae (e fa «pop»), poi arriva la nuova che si espande.
  const [navOut, setNavOut] = useState(0); // 1 = verso la successiva (su), -1 = verso la precedente (giù)
  const navBusy = useRef(false);
  const navigate = (dir) => {
    if (navBusy.current) return;
    navBusy.current = true; setNavOut(dir);
    setTimeout(async () => {
      try { await onScrollNav?.(dir); } finally { navBusy.current = false; setNavOut(0); }
    }, 280);
  };
  useEffect(() => () => { springStop.current?.(); }, []);
  // «Assestato»: dopo l'ingresso l'animazione di apertura non deve ripartire quando si cambia lo stato di trascinamento.
  const [settledId, setSettledId] = useState(null);
  useEffect(() => { const t = setTimeout(() => setSettledId(viewer.id), 900); return () => clearTimeout(t); }, [viewer.id]);
  const settled = settledId === viewer.id;
  // Rilascio morbido: la bolla torna al suo posto con un rimbalzo invece di scattare. La classe `is-springing`
  // spegne le transizioni CSS, così non si sommano al movimento calcolato qui.
  const springBack = (fromY) => {
    springStop.current?.();
    if (Math.abs(fromY) < 1) { setDragY(0); setSpringing(false); return; }
    setSpringing(true);
    springStop.current = runSpring({ from: fromY, to: 0, k: 170, c: 13, onFrame: setDragY, onDone: () => { springStop.current = null; setDragY(0); setSpringing(false); } });
  };
  const closeRef = useRef(onClose); closeRef.current = onClose;
  const doneRef = useRef(false);
  const auto = viewer.status === "ready" && !viewer.gift && viewer.type !== "capsule" && !scrollMode && !viewer.link; // i regali restano finché non li chiudi; in scorrimento il timer è fermo
  const suppressClickUntil = useRef(0); // dopo uno swipe il "click" finale non deve chiudere la bolla
  const dragScale = scrollMode ? 1 : 1 - Math.min(Math.max(dragY, 0) / 440, 0.72);
  const sysMeta = viewer.system ? (SYSTEM_CATEGORIES[viewer.systemCategory] || SYSTEM_CATEGORIES.curiosita) : null;
  const dissolve = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true; setDissolving(true); playDust();
    setTimeout(() => closeRef.current(), 650);
  }, []);
  const onBackdropClick = (event) => {
    // Close only when the backdrop itself is tapped, never on content or controls.
    if (event.target !== event.currentTarget || doneRef.current) return;
    if (Date.now() < suppressClickUntil.current) return;
    if (backdropTap.current?.moved) return;
    dissolve();
  };
  const onHandlePointerDown = (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (doneRef.current || event.target.closest(scrollMode ? "button, input, textarea, select, a, [contenteditable]" : "button, input, textarea, select, a, [contenteditable], video")) return;
    if (event.target === event.currentTarget) {
      backdropTap.current = { x: event.clientX, y: event.clientY, moved: false };
    } else {
      backdropTap.current = null;
    }
    springStop.current?.(); springStop.current = null; setSpringing(false); // riprendi la bolla mentre rimbalza
    dragStart.current = { y: event.clientY, x: event.clientX, pointerId: event.pointerId };
    setIsDragging(true);
    swipeActive.current = false;
    dragValue.current = 0;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const onHandlePointerMove = (event) => {
    if (!dragStart.current || doneRef.current) return;
    if (backdropTap.current && Math.hypot(event.clientX - backdropTap.current.x, event.clientY - backdropTap.current.y) > 9) {
      backdropTap.current.moved = true;
    }
    const dy = event.clientY - dragStart.current.y;
    const dx = event.clientX - dragStart.current.x;
    if (scrollMode) { // scorrimento: lo swipe cambia bolla invece di chiuderla
      if (Math.abs(dx) > Math.abs(dy)) { dragValue.current = 0; setDragY(0); return; }
      if (Math.abs(dy) > 8) swipeActive.current = true;
      dragValue.current = dy; // con segno: negativo = verso l'alto
      setDragY(Math.sign(dy) * 90 * (1 - Math.exp(-Math.abs(dy) / 190))); // resistenza elastica: più tiri, più si irrigidisce
      return;
    }
    if (Math.abs(dx) > Math.max(45, Math.abs(dy) * 1.3)) return;
    if (dy > 8) swipeActive.current = true;
    const nextY = Math.max(0, Math.min(dy, 360));
    dragValue.current = nextY;
    setDragY(nextY);
  };
  const onHandlePointerEnd = () => {
    if (!dragStart.current) return;
    dragStart.current = null;
    setIsDragging(false);
    if (scrollMode) {
      const dy = dragValue.current;
      dragValue.current = 0;
      springBack(Math.sign(dy) * 90 * (1 - Math.exp(-Math.abs(dy) / 190)));
      if (Math.abs(dy) >= 70) { suppressClickUntil.current = Date.now() + 450; navigate(dy < 0 ? 1 : -1); }
      return;
    }
    if (dragValue.current >= 110) {
      setSwipeClosing(true);
      dissolve();
    } else {
      const from = dragValue.current;
      dragValue.current = 0;
      springBack(from);
    }
  };
  const onHandlePointerCancel = () => { dragStart.current = null; swipeActive.current = false; setIsDragging(false); const from = dragValue.current; dragValue.current = 0; springBack(Math.abs(from) > 0 ? (scrollMode ? Math.sign(from) * 90 * (1 - Math.exp(-Math.abs(from) / 190)) : from) : 0); };
  useEscape(() => { if (shareOpen) setShareOpen(false); else if (menuOpen) setMenuOpen(false); else dissolve(); });
  useEffect(() => {
    if (!auto || viewer.chain?.root_bubble_id || poll || question || truth || rating || interactionLoading || storyPaused) return;
    const t = setTimeout(dissolve, 6000);
    return () => clearTimeout(t);
  }, [auto, viewer.id, viewer.chain?.root_bubble_id, dissolve, poll, question, truth, rating, interactionLoading, storyPaused]);
  // Sondaggi e domande occupano tutto lo schermo; il tipo è noto già dal feed, così il layout non "salta" dopo il caricamento.
  const isSpecial = viewer.type === "surprise" || viewer.type === "capsule";
  const interactive = Boolean(poll || question || truth || rating || questionLoadError) || (interactionLoading && ["poll", "question", "truth", "rating"].includes(viewer.kindHint));
  const reactionSet = useMemo(() => reactionsFor(viewer.kindHint), [viewer.kindHint]);
  const interactionPanel = (question || truth || rating || questionLoadError) ? <div className="bl-interaction-panel">
    {questionLoadError && <small role="alert">Impossibile caricare la domanda: {questionLoadError}</small>}
    
    {truth && !viewer.gift && <section className="bl-truth-panel" aria-label="Due verità e una bugia"><strong>🕵️ Qual è la bugia?</strong>
      <div className="bl-truth-options">{(truth.statements || []).map((s, i) => {
        const revealed = truth.lie_index != null, total = Number(truth.total) || 0;
        const pct = revealed && total ? Math.round((Number(truth.counts?.[i]) || 0) * 100 / total) : null;
        const isLie = revealed && truth.lie_index === i + 1;
        return <button key={i} type="button" disabled={revealed || truthBusy || viewer.isAuthor} className={`${isLie ? "lie" : ""} ${truth.my_guess === i + 1 ? "mine" : ""}`} onClick={() => guessTruth(i + 1)}><span>{i + 1}. {s}</span>{revealed && <b>{isLie ? "🤥 Bugia" : "✅ Vera"}{pct != null ? ` · ${pct}%` : ""}</b>}</button>;
      })}</div>
      {truth.my_guess != null && <small>{truth.my_guess === truth.lie_index ? "🎉 Hai scovato la bugia!" : "😅 Ci sei cascato!"} · {Number(truth.total) || 0} {Number(truth.total) === 1 ? "risposta" : "risposte"}</small>}
      {viewer.isAuthor && <small>Il tuo gioco · {Number(truth.total) || 0} {Number(truth.total) === 1 ? "risposta" : "risposte"}</small>}
      {truthError && <small role="alert">{truthError}</small>}</section>}
    {truthFeedback && createPortal(<div key={truthFeedback.n} className={`bl-truth-toast ${truthFeedback.ok ? "win" : "lose"}`} role="status" aria-live="polite">
      <div className="bl-truth-toast-card">
        <span className="bl-truth-toast-emoji" aria-hidden="true">{truthFeedback.ok ? "🕵️" : "🤥"}</span>
        <strong>{truthFeedback.ok ? "Bravo Sherlock!" : "Il brutto di non sapere di chi si stia parlando! haha"}</strong>
      </div>
      <div className="bl-truth-toast-fx" aria-hidden="true">{(truthFeedback.ok ? ["🎉", "✨", "🔎", "⭐", "🎉", "✨", "🔎", "⭐"] : ["😅", "💭", "🤷", "😅", "💭", "🤷"]).map((e, i, a) => <i key={i} style={{ "--a": `${Math.round(360 / a.length * i)}deg`, "--d": `${i * 45}ms` }}>{e}</i>)}</div>
    </div>, document.body)}
    {rating && !viewer.gift && <section className="bl-rating-panel" aria-label="Dai un voto"><strong>⭐ {rating.prompt || "Dai un voto"}</strong>
      {rating.my_value == null && !viewer.isAuthor ? <>
        <div className="bl-rating-value">{ratingValue}<small>/10</small></div>
        <input type="range" min={1} max={10} step={1} value={ratingValue} onChange={e => setRatingValue(Number(e.target.value))} aria-label="Il tuo voto da 1 a 10" />
        <button type="button" disabled={ratingBusy} onClick={sendRating}>{ratingBusy ? "Invio…" : "Invia voto"}</button>
        <small>Vedrai la media dopo aver votato.</small>
      </> : <div className="bl-rating-result">
        <div className="bl-rating-value">{rating.average == null ? "–" : Number(rating.average).toFixed(1).replace(".", ",")}<small>/10</small></div>
        <small>{Number(rating.count) || 0} {Number(rating.count) === 1 ? "voto" : "voti"}{rating.my_value != null ? ` · il tuo voto: ${rating.my_value}` : ""}</small>
        {Array.isArray(rating.distribution) && <div className="bl-rating-bars" aria-hidden="true">{rating.distribution.map((n, i) => { const max = Math.max(1, ...rating.distribution.map(Number)); return <i key={i} style={{ height: `${Math.max(6, Math.round(Number(n) * 100 / max))}%` }} title={`${i + 1}: ${n}`} />; })}</div>}
      </div>}
      {ratingError && <small role="alert">{ratingError}</small>}</section>}
    {question && !viewer.gift && <section className="bl-question-reply" aria-label="Rispondi alla domanda"><strong>🎲 La tua risposta</strong><p>{question.question}</p>{viewer.isAuthor?<div className="bl-question-thanks">Questa è la tua domanda: puoi leggere le risposte, ma non rispondere.</div>:question.my_answer?<div className="bl-question-thanks">✓ Risposta inviata: <GifAnswer value={question.my_answer}/></div>:<><textarea maxLength={280} rows={2} value={answer} onChange={e=>{setAnswer(e.target.value);setAnswerGif(null);}} placeholder="Scrivi cosa ne pensi…" aria-label="La tua risposta"/>{answerGif&&<div className="bl-giphy-selected"><img src={answerGif.url || answerGif.images?.fixed_width?.url} alt={answerGif.title||"GIF selezionata"}/><button type="button" onClick={()=>setAnswerGif(null)}>Rimuovi GIF</button></div>}<button type="button" onClick={()=>setShowAnswerGifs(v=>!v)}>{showAnswerGifs?"Nascondi GIF / Meme":"😂 Rispondi con GIF o Meme"}</button>{showAnswerGifs&&<KlipyPicker selectedUrl={answerGif?.url} onPick={item=>{setAnswerGif(item);setAnswer("");setShowAnswerGifs(false);}}/>}<button type="button" disabled={viewer.isAuthor||answerBusy||!(answer.trim()||answerGif)} onClick={sendAnswer}>{answerBusy?"Invio…":"Invia risposta"}</button></>}{answerError&&<small role="alert">{answerError}</small>}<small>Le nuove risposte sono pubbliche per chi ha scoppiato la bolla. Le risposte precedenti restano private.</small>{Array.isArray(question.answers)&&question.answers.length>0&&<div className="bl-v4-public-answers"><strong>💬 Risposte</strong>{question.answers.map((a,i)=><p key={i}><GifAnswer value={typeof a==="string"?a:a.answer}/></p>)}</div>}</section>}
    </div> : null;
  const chainCard = (!isSpecial && !viewer.gift && viewer.chain?.root_bubble_id) ? (
      <section className="bl-chain-card" aria-label="Bolla a catena">
        <div className="bl-chain-card-top"><span className="bl-chain-orb">🫧</span><div><strong>Questa è una Bolla a catena</strong><small>{Number(viewer.chain.participant_count || 1)} {Number(viewer.chain.participant_count || 1) === 1 ? "partecipante" : "partecipanti"} · continua il viaggio</small></div></div>
        <button type="button" onClick={onContinueChain}>＋ Aggiungi il tuo contributo</button>
        <button type="button" className="bl-chain-share" onClick={() => {
          const url = new URL(window.location.href); url.search = ""; url.searchParams.set("chain", viewer.chain.root_bubble_id);
          const text = `🫧 Continua questa Bolla a catena su Bolle: ${url.toString()}`;
          if (navigator.share) navigator.share({title:"Bolle a catena",text,url:url.toString()}).catch(()=>{});
          else if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(()=>window.dispatchEvent(new CustomEvent("bolle:toast",{detail:"Link della catena copiato!"}))).catch(()=>{});
        }}>↗ Condividi la catena</button>
      </section>
    ) : null;
  /* ---------- Schermata "storia": quella standard per ogni bolla scoppiata ---------- */
  const storyMode = !isSpecial && !viewer.gift;
  const isMediaKind = viewer.type === "image" || viewer.type === "video";
  const overlayOnMedia = Boolean(viewer.caption) && isMediaKind && !interactive;
  const canMessage = Boolean(viewer.username) && !viewer.isAuthor;
  const reactedItem = viewer.reacted ? reactionSet.find(r => r.key === viewer.reacted) : null;
  const burstEmoji = reactedItem?.emoji || ({ love: "❤️", laugh: "😆", wow: "😮", warm: "😭", sad: "🙁" })[viewer.reacted] || "❤️";
  const timerOn = auto && !viewer.chain?.root_bubble_id && !poll && !question && !truth && !rating && !interactionLoading && !dissolving;
  const pollTotal = poll ? (Number(poll.votes_a) || 0) + (Number(poll.votes_b) || 0) : 0;
  // I risultati stanno SOTTO l'immagine, mai sopra: la foto del sondaggio resta sempre visibile.
  const pollResults = poll && (Boolean(poll.my_vote) || viewer.isAuthor) ? <section className="bl-poll-results" role="status" aria-live="polite" aria-label="Risultati del sondaggio">
    <strong>Risultati del sondaggio</strong>
    {[[poll.a, poll.votes_a, 1], [poll.b, poll.votes_b, 2]].map(([label, count, n]) => {
      const votes = Number(count) || 0, pct = pollTotal ? Math.round(votes * 100 / pollTotal) : 0, mine = Number(poll.my_vote) === n;
      return <div className={`bl-poll-results-row ${mine ? "mine" : ""}`} key={n}>
        <div className="bl-poll-results-top"><span>{label}{mine && <em>il tuo voto</em>}</span><b>{pct}%</b></div>
        <div className="bl-poll-results-track" aria-hidden="true"><i style={{ width: `${pct}%` }} /></div>
        <small>{votes} {votes === 1 ? "voto" : "voti"}</small>
      </div>;
    })}
    <small className="bl-poll-results-foot">{pollTotal} {pollTotal === 1 ? "voto in totale" : "voti in totale"}{viewer.isAuthor ? " · il tuo sondaggio" : ""}</small>
  </section> : null;
  async function sendReply(event) {
    event?.preventDefault();
    const body = msg.trim();
    if (!body || msgBusy || !canMessage) return;
    setMsgBusy(true); setMsgNote("");
    const result = await onSendReply?.(body);
    setMsgBusy(false);
    if (result?.ok) { setMsg(""); setMsgNote("Messaggio inviato ✓"); }
    else if (result?.error) setMsgNote(result.error);
  }
  // Un tocco sull'immagine chiude prima tastiera/menu/condivisione; poi, se la bolla non è interattiva, la fa sparire.
  function stageTap() {
    if (Date.now() < suppressClickUntil.current) return;
    if (shareOpen) { setShareOpen(false); return; }
    if (menuOpen) { setMenuOpen(false); return; }
    if (msgFocus) { document.activeElement?.blur?.(); return; }
    if (!interactive || scrollMode) dissolve(); // in scorrimento un tocco sull'immagine chiude tutto
  }
  if (storyMode) {
    const swipeable = poll && !poll.my_vote && !viewer.isAuthor;
    return <div className={`bl-story ${interactive ? "is-interactive" : ""} ${dissolving ? "dissolving" : ""} ${swipeClosing ? "swipe-closing" : ""} ${isDragging ? "is-dragging" : ""} ${springing ? "is-springing" : ""} ${settled ? "is-settled" : ""} ${navOut ? (navOut > 0 ? "is-nav-out-up" : "is-nav-out-down") : ""}`} style={{ "--bl-drag-y": `${dragY}px`, "--bl-drag-scale": String(dragScale) }} role="dialog" aria-modal="true" aria-label="Contenuto della bolla" onPointerDown={onHandlePointerDown} onPointerMove={onHandlePointerMove} onPointerUp={onHandlePointerEnd} onPointerCancel={onHandlePointerCancel} onClick={onBackdropClick}>
      {scrollMode && <span className={`bl-nav-film ${navOut ? "bl-nav-film--out" : ""}`} key={navOut ? "out" : viewer.id} aria-hidden="true" />}
      <div className={`bl-story-card ${scrollMode ? `bl-story-card--nav-${scrollDir}` : ""}`} key={viewer.id}>
        {timerOn && <div className={`bl-story-timer ${storyPaused ? "paused" : ""}`} aria-hidden="true"><i key={`${viewer.id}-${storyPaused ? "p" : "r"}`} /></div>}
        <header className="bl-story-head">
          {(() => {
            const who = <>
              <span className="bl-story-avatar" aria-hidden="true"><AvatarImage avatar={viewer.avatar} /></span>
              <div className="bl-story-who"><strong>{viewer.username ? `@${viewer.username}` : "Bolla anonima"}</strong>{(viewer.isAuthor || !viewer.username) && <small>{viewer.isAuthor ? "La tua bolla" : "Un momento per te"}</small>}</div>
            </>;
            return viewer.username && !viewer.gift && !viewer.system
              ? <button type="button" className="bl-story-whobtn" aria-label={`Apri il profilo di @${viewer.username}`} style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0, background: "none", border: 0, padding: 0, margin: 0, color: "inherit", font: "inherit", textAlign: "left", cursor: "pointer" }}
                  onClick={() => window.dispatchEvent(new CustomEvent("bolle:open-profile", { detail: { username: viewer.username } }))}>{who}</button>
              : who;
          })()}
          {canMessage && viewer.allowFavorites !== false && <button type="button" className={`bl-story-icon ${isFavorite ? "on" : ""}`} onClick={onToggleFavorite} aria-pressed={isFavorite} aria-label={isFavorite ? "Rimuovi autore dai preferiti" : "Aggiungi autore ai preferiti"}><StarIcon size={21} fill={isFavorite ? "currentColor" : "none"} /></button>}
          {!viewer.isAuthor && <div className="bl-story-menu-wrap">
            <button type="button" className="bl-story-icon" onClick={() => setMenuOpen(v => !v)} aria-haspopup="menu" aria-expanded={menuOpen} aria-label="Altre azioni"><MoreIcon size={22} /></button>
            {menuOpen && <div className="bl-story-menu" role="menu">
              <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); onReport(); }}>🚩 Segnala la bolla</button>
              {viewer.username && <button type="button" role="menuitem" className="danger" onClick={() => { setMenuOpen(false); if (window.confirm(`Vuoi bloccare @${viewer.username}? Non vedrai più le sue bolle nel feed.`)) { onBlockUser?.(viewer.username); dissolve(); } }}>🚫 Blocca @{viewer.username}</button>}
            </div>}
          </div>}
          {onToggleScroll && <button type="button" className={`bl-story-icon bl-scroll-toggle ${scrollMode ? "on" : ""}`} onClick={onToggleScroll} aria-pressed={scrollMode} aria-label={scrollMode ? "Disattiva la modalità scorrimento" : "Attiva la modalità scorrimento"} title={scrollMode ? "Esci dallo scorrimento" : "Scorri le bolle"}><ScrollIcon size={22} /></button>}
          <button type="button" className="bl-story-icon" onClick={dissolve} aria-label="Chiudi"><CloseIcon size={22} /></button>
        </header>
        <div className={`bl-story-media ${swipeable ? "bl-poll-swipe-stage" : ""} ${pollSwipeFlying ? "bl-poll-swipe-flying" : ""}`} style={swipeable ? { "--bl-poll-x": `${pollSwipeX}px`, "--bl-poll-rotation": `${Math.max(-17, Math.min(17, pollSwipeX / 15))}deg` } : undefined} onPointerDown={poll ? onPollSwipeStart : undefined} onPointerMove={poll ? onPollSwipeMove : undefined} onPointerUp={poll ? onPollSwipeEnd : undefined} onPointerCancel={poll ? onPollSwipeCancel : undefined} onClick={stageTap} role="button" tabIndex={0} aria-label="Tocca per far sparire il contenuto" onKeyDown={(e) => !poll && !question && (e.key === "Enter" || e.key === " ") && stageTap()}>
          {viewer.status === "loading" && <p className="bl-viewer-msg">Un attimo…</p>}
          {viewer.status === "error" && <p className="bl-viewer-msg">{viewer.gone ? "Questa bolla è scaduta: il suo contenuto non esiste più." : <>Non riusciamo ad aprire questo contenuto. {viewer.loadError ? `Dettaglio: ${viewer.loadError}` : "La bolla è comunque scoppiata."}</>}</p>}
          {viewer.status === "ready" && isMediaKind && <div className="bl-story-frame">
            {viewer.type === "image" && <img className={[viewer.kindHint === "confession" ? "bl-unblur" : "", (viewer.kindHint === "gif" || /\.gif(\?|$)/i.test(String(viewer.url || ""))) ? "bl-gif-full" : ""].filter(Boolean).join(" ") || undefined} src={viewer.url} alt={viewer.caption || "Foto della bolla"} draggable={false} />}
            {viewer.type === "video" && vEditReady && <EditedVideo src={viewer.url} edit={vEdit} />}
            {overlayOnMedia && <p className={`bl-overlay-text pos-${viewer.captionPos || "bot"}`}>{viewer.caption}</p>}
            <OverlayLayer overlays={ovs} />
            {poll && !poll.my_vote && !viewer.isAuthor && Math.abs(pollSwipeX) <= 24 && <><span className="bl-poll-gesture" aria-hidden="true"><i className="bl-pg-arrow l">‹</i><i className="bl-pg-finger" /><i className="bl-pg-arrow r">›</i></span><p className="bl-poll-swipe-hint" aria-live="polite">Fai swipe verso la tua scelta</p></>}
          </div>}
          {poll && !poll.my_vote && !viewer.isAuthor && Math.abs(pollSwipeX) > 24 && <div className={`bl-poll-swipe-choice ${pollSwipeX < 0 ? "left" : "right"}`} aria-hidden="true">{pollSwipeX < 0 ? poll.a : poll.b}</div>}
          {dissolving && <span className="bl-dust" aria-hidden="true">
            {Array.from({ length: 40 }, (_, i) => <i key={i} style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%`, "--dx": `${((i * 29) % 90) - 30}px`, "--dy": `${-20 - ((i * 17) % 90)}px`, "--sz": `${2 + (i % 4) * 1.5}px`, "--dl": `${(i % 6) * 45}ms` }} />)}
          </span>}
        </div>
        {viewer.caption && !overlayOnMedia && <p className="bl-story-caption">{viewer.caption}</p>}
        <div className="bl-story-panel" onPointerDown={e => { const el = e.currentTarget; if (el.scrollHeight > el.clientHeight + 2) e.stopPropagation(); }}>
          {pollError && <small role="alert" className="bl-poll-error">{pollError}</small>}
          {pollResults}
          {interactionPanel}
          {chainCard}
        </div>
        <footer className="bl-story-bar">
          {timerOn && <p className="bl-story-hint">{storyPaused ? "Il timer è in pausa mentre scrivi" : "Si polverizza tra 6 secondi · non si riapre più"}</p>}
          {scrollMode && <p className="bl-story-hint">Scorri su e giù per cambiare bolla · tocca l'immagine per chiudere</p>}
          {interactive && !scrollMode && <p className="bl-story-hint">Puoi interagire finché non chiudi questa schermata.</p>}
          {msgNote && <p className="bl-story-note" role="status">{msgNote}</p>}
          {msgFocus && !interactive && !viewer.reacted && !viewer.isAuthor && <div className="bl-story-quick" role="group" aria-label="Reazioni rapide">
            {reactionSet.map(r => <button key={r.key} type="button" title={r.label} aria-label={r.label} disabled={reactionBusy} onPointerDown={e => e.preventDefault()} onClick={() => onReact(r.key)}><ReactionIcon reaction={r} size={26} /></button>)}
          </div>}
          {viewer.isAuthor ? <div className="bl-story-author-row">
            {!interactive && <div className="bl-story-counts" aria-label="Reazioni ricevute">{reactionSet.map(r => <span key={r.key} title={r.label}><ReactionIcon reaction={r} size={19} /> <b>{reactionCounts === null ? "·" : Number(reactionCounts?.[r.key]) || 0}</b></span>)}</div>}
            <button type="button" className="bl-story-share" onClick={() => setShareOpen(true)} aria-label="Inoltra o condividi la bolla"><SendIcon size={22} /> <span>Condividi</span></button>
          </div> : <div className="bl-story-reply-row">
            <form className="bl-story-reply" onSubmit={sendReply}>
              <input type="text" value={msg} onChange={e => setMsg(e.target.value)} onFocus={() => setMsgFocus(true)} onBlur={() => setMsgFocus(false)} maxLength={500} disabled={!canMessage || msgBusy} placeholder={canMessage ? `Invia un messaggio a @${viewer.username}` : "Autore anonimo: messaggi non disponibili"} aria-label="Scrivi un messaggio all'autore della bolla" enterKeyHint="send" autoComplete="off" />
              {msg.trim() && <button type="submit" className="bl-story-send" disabled={msgBusy}>{msgBusy ? "…" : "Invia"}</button>}
            </form>
            {!interactive && <span className="bl-story-heart-wrap">
              <button type="button" className={`bl-story-heart ${viewer.reacted ? "on" : ""}`} onClick={() => onReact("love")} disabled={Boolean(viewer.reacted) || reactionBusy} aria-pressed={Boolean(viewer.reacted)} aria-label="Mi piace" title="Mi piace">
                {reactedItem && reactedItem.key !== "love" ? <ReactionIcon reaction={reactedItem} size={25} /> : <Heart size={27} fill={viewer.reacted ? "currentColor" : "none"} />}
              </button>
              {burstKey > 0 && <span key={burstKey} className="bl-story-burst" aria-hidden="true">{[0, 1, 2, 3, 4, 5].map(i => <i key={i} style={{ "--bx": `${(i - 2.5) * 11}px`, "--bd": `${i * 70}ms` }}>{burstEmoji}</i>)}</span>}
            </span>}
            <button type="button" className="bl-story-share-btn" onClick={() => setShareOpen(true)} aria-label="Inoltra o condividi la bolla" title="Inoltra"><SendIcon size={25} /></button>
          </div>}
        </footer>
        {shareOpen && <ShareSheet bubbleId={viewer.id} exclude={[viewer.username]} favorites={favoriteList || []} onClose={() => setShareOpen(false)} onWhatsApp={onShare} onSendToUser={onShareToUser} />}
      </div>
    </div>;
  }
  return <div className={`bl-viewer ${viewer.chain?.root_bubble_id ? "bl-viewer-chain-open" : ""} ${interactive ? "bl-viewer-interactive" : ""} ${dissolving ? "dissolving" : ""} ${swipeClosing ? "swipe-closing" : ""} ${isDragging ? "is-dragging" : ""} ${springing ? "is-springing" : ""} ${settled ? "is-settled" : ""} ${navOut ? (navOut > 0 ? "is-nav-out-up" : "is-nav-out-down") : ""}`} style={{ "--bl-drag-y": `${dragY}px`, "--bl-drag-scale": String(dragScale), "--bl-drag-progress": String(Math.min(dragY / 360, 1)) }} role="dialog" aria-modal="true" aria-label="Contenuto della bolla" onPointerDown={onHandlePointerDown} onPointerMove={onHandlePointerMove} onPointerUp={onHandlePointerEnd} onPointerCancel={onHandlePointerCancel} onClick={onBackdropClick}>
    {scrollMode && <span className={`bl-nav-film ${navOut ? "bl-nav-film--out" : ""}`} key={navOut ? "out" : viewer.id} aria-hidden="true" />}
    <div className="bl-viewer-top bl-viewer-drag-handle"
      aria-label="Trascina verso il basso per chiudere"><span className="bl-viewer-grip" aria-hidden="true" /> <span>{scrollMode ? "Scorri su o giù per cambiare bolla" : "Un momento per te · trascina giù per chiudere"}</span></div>
    {auto && !viewer.chain?.root_bubble_id && !poll && !question && !truth && !rating && !interactionLoading && !dissolving && <div className="bl-timer" key={viewer.id} aria-hidden="true" />}
    <div className="bl-implosion-ring" aria-hidden="true" />
    {onToggleScroll && <button type="button" className={`bl-viewer-scroll-toggle ${scrollMode ? "on" : ""}`} onClick={onToggleScroll} aria-pressed={scrollMode} aria-label={scrollMode ? "Disattiva la modalità scorrimento" : "Attiva la modalità scorrimento"} title={scrollMode ? "Esci dallo scorrimento" : "Scorri le bolle"}><ScrollIcon size={22} /></button>}
    <div key={viewer.id} className={`${scrollMode ? `bl-viewer-stage--nav-${scrollDir} ` : ""}bl-viewer-stage ${poll && !poll.my_vote && !viewer.isAuthor ? "bl-poll-swipe-stage" : ""} ${pollSwipeFlying ? "bl-poll-swipe-flying" : ""}`} style={poll && !poll.my_vote && !viewer.isAuthor ? {"--bl-poll-x": `${pollSwipeX}px`, "--bl-poll-rotation": `${Math.max(-17, Math.min(17, pollSwipeX / 15))}deg`} : undefined} onPointerDown={poll ? onPollSwipeStart : undefined} onPointerMove={poll ? onPollSwipeMove : undefined} onPointerUp={poll ? onPollSwipeEnd : undefined} onPointerCancel={poll ? onPollSwipeCancel : undefined} onClick={interactive ? undefined : () => { if (Date.now() >= suppressClickUntil.current) dissolve(); }} role="button" tabIndex={0} aria-label="Tocca per far sparire il contenuto"
      onKeyDown={(e) => !poll && !question && (e.key === "Enter" || e.key === " ") && dissolve()}>
      {viewer.status === "loading" && <p className="bl-viewer-msg">Un attimo…</p>}
      {viewer.status === "error" && <p className="bl-viewer-msg">{viewer.gone ? "Questa bolla è scaduta: il suo contenuto non esiste più." : <>Non riusciamo ad aprire questo contenuto. {viewer.loadError ? `Dettaglio: ${viewer.loadError}` : "La bolla è comunque scoppiata."}</>}</p>}
      {viewer.status === "ready" && viewer.type === "surprise" && (sysMeta ? <div className="bl-system-hero"><span className="bl-system-chip">{sysMeta.icon} {sysMeta.label}</span><div className="bl-surprise" aria-hidden="true">{viewer.emoji || sysMeta.icon}</div></div> : <div className="bl-surprise" aria-hidden="true">✦ 🫧 ✦</div>)}
      {viewer.status === "ready" && viewer.type === "capsule" && <CapsuleCountdown opensAt={viewer.opensAt} username={viewer.username} />}
      {viewer.status === "ready" && viewer.type === "image" && <img className={[viewer.kindHint === "confession" ? "bl-unblur" : "", (viewer.kindHint === "gif" || /\.gif(\?|$)/i.test(String(viewer.url || ""))) ? "bl-gif-full" : ""].filter(Boolean).join(" ") || undefined} src={viewer.url} alt={viewer.caption || "Foto della bolla"} />}
      {viewer.status === "ready" && viewer.type === "video" && <video src={viewer.url} autoPlay playsInline loop controls={false} muted={false} />}
      {viewer.caption && <p className="bl-caption">{viewer.caption}</p>}
      {viewer.attribution && <p className="bl-system-attrib">— {viewer.attribution}</p>}
      {viewer.link && <a className="bl-system-link" href={viewer.link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>Leggi su {viewer.source || "la fonte"} ↗</a>}
      {poll && !poll.my_vote && !viewer.isAuthor && Math.abs(pollSwipeX) <= 24 && <><span className="bl-poll-gesture" aria-hidden="true"><i className="bl-pg-arrow l">‹</i><i className="bl-pg-finger" /><i className="bl-pg-arrow r">›</i></span><p className="bl-poll-swipe-hint" aria-live="polite">Fai swipe verso la tua scelta</p></>}
      {pollError && <small role="alert" className="bl-poll-error">{pollError}</small>}
      {poll && !poll.my_vote && !viewer.isAuthor && Math.abs(pollSwipeX) > 24 && <div className={`bl-poll-swipe-choice ${pollSwipeX < 0 ? "left" : "right"}`} aria-hidden="true">{pollSwipeX < 0 ? poll.a : poll.b}</div>}
      
      {poll && (Boolean(poll.my_vote) || viewer.isAuthor) && pollGlassVisible && <div className="bl-poll-glass" role="status" aria-live="polite"><div className="bl-poll-glass-card"><strong>Risultati del sondaggio</strong>{[[poll.a,poll.votes_a],[poll.b,poll.votes_b]].map(([label,count],i)=>{const total=Number(poll.votes_a)+Number(poll.votes_b);const pct=total?Math.round(Number(count)*100/total):0;return <div className="bl-poll-glass-row" key={i}><span>{label}</span><b>{pct}%</b><i style={{width:`${pct}%`}} aria-hidden="true" /></div>})}<small>{viewer.isAuthor ? "Il tuo sondaggio" : "Voto registrato"} · Scorri verso il basso per chiudere</small></div></div>}

      {dissolving && <span className="bl-dust" aria-hidden="true">
        {Array.from({ length: 40 }, (_, i) => <i key={i} style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%`, "--dx": `${((i * 29) % 90) - 30}px`, "--dy": `${-20 - ((i * 17) % 90)}px`, "--sz": `${2 + (i % 4) * 1.5}px`, "--dl": `${(i % 6) * 45}ms` }} />)}
      </span>}
    </div>
    {interactionPanel}
    {chainCard}
    {!isSpecial && !viewer.gift && viewer.username && !viewer.isAuthor && (
      <div className="bl-viewer-author-actions" aria-label="Autore e azioni della bolla">
        <span className="bl-viewer-author" title={`Autore @${viewer.username}`}><span className="bl-viewer-author-avatar" aria-hidden="true"><AvatarImage avatar={viewer.avatar} /></span><button type="button" className="bl-user-link" onClick={(e) => { e.stopPropagation(); openUserProfile(viewer.username); }}>@{viewer.username}</button></span>
        <button type="button" onClick={onMessage} aria-label={`Scrivi a @${viewer.username}`} title="Invia un messaggio"><MessageCircle size={18} /> <span>Messaggio</span></button>
        <button type="button" onClick={onShare} aria-label="Condividi questa bolla" title="Condividi"><Share2 size={19} /> <span>Condividi</span></button>
        {viewer.allowFavorites !== false && <button type="button" onClick={onToggleFavorite} aria-label={isFavorite ? "Rimuovi autore dai preferiti" : "Aggiungi autore ai preferiti"} title={isFavorite ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}><span className="bl-viewer-star">{isFavorite ? "★" : "☆"}</span> <span>{isFavorite ? "Preferito" : "Preferiti"}</span></button>}
        <button
          type="button"
          onClick={() => {
            if (window.confirm(`Vuoi bloccare @${viewer.username}? Non vedrai più le sue bolle nel feed.`)) {
              onBlockUser?.(viewer.username);
              dissolve();
            }
          }}
          aria-label={`Blocca @${viewer.username}`}
          title="Blocca utente"
          style={{ color: "#ff6b6b" }}
        >
          🚫 <span>Blocca</span>
        </button>
      </div>
    )}
    {!isSpecial && !viewer.gift && !interactive && <div className={`bl-reactions ${interactionLoading ? "is-pending" : ""}`} aria-label="Reazioni della bolla">
      <span className="bl-reactions-title">{viewer.isAuthor ? "Reazioni ricevute" : "Lascia una reazione anonima"}</span>
      {viewer.isAuthor ? (
        <div className="bl-reactions-row" aria-label="Conteggi delle reazioni">
          {reactionSet.map(r => <div key={r.key} title={r.label} aria-label={`${r.label}: ${Number(reactionCounts?.[r.key]) || 0}`} style={{display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:2, padding:"3px 0", color:"inherit"}}>
            <ReactionIcon reaction={r} size={22} />
            <strong style={{fontSize:12, lineHeight:1.2}}>{reactionCounts === null ? "·" : Number(reactionCounts?.[r.key]) || 0}</strong>
          </div>)}
        </div>
      ) : (
        <>
          <div className="bl-reactions-row">{reactionSet.map(r => <button key={r.key} type="button" title={r.label} aria-label={r.label} aria-pressed={viewer.reacted === r.key} disabled={Boolean(viewer.reacted) || reactionBusy} onClick={() => onReact(r.key)}><ReactionIcon reaction={r} size={22} /></button>)}</div>
          {reactionCounts && <div className="bl-v4-reaction-counts" aria-label="Reazioni ricevute">{reactionSet.map(r => <span key={r.key} title={r.label}><ReactionIcon reaction={r} size={16} /> {Number(reactionCounts[r.key]) || 0}</span>)}</div>}
          {viewer.reacted && <small>Grazie! La tua reazione è stata inviata.</small>}
        </>
      )}
    </div>}
    <p className={`bl-once ${interactionLoading ? "is-pending" : ""}`}>{scrollMode ? "Modalità scorrimento: scorri su e giù per cambiare bolla. Tocca il contenuto per chiudere." : viewer.link ? "Tocca il contenuto per chiudere." : interactive ? "Puoi interagire finché non chiudi questa schermata." : viewer.type === "capsule" ? "Il contenuto resta nascosto finché il timer non arriva a zero." : viewer.gift ? "Una sorpresa speciale per te. Ora puoi crearne una anche tu!" : "Si polverizza tra 6 secondi. Toccala per farla sparire subito: non si riapre più."}</p>
    {viewer.gift && viewer.status === "ready" && <button type="button" className="bl-cta bl-gift-reciprocate" onClick={onGiftBack}>💌 Ricambia la sorpresa</button>}
    <div className="bl-viewer-bar">{!isSpecial && !viewer.gift && <button onClick={onReport}>Segnala</button>}<button className="primary" onClick={dissolve} autoFocus>Chiudi</button></div>
  </div>;
}

/* Inoltra una bolla: WhatsApp, link/altre app oppure un altro utente di Bolle (via chat). */
function ShareSheet({ bubbleId, exclude = [], favorites = [], onClose, onWhatsApp, onSendToUser }) {
  const [people, setPeople] = useState(() => favorites.map(username => ({ username })));
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState({}); // username -> "sending" | "sent" | testo errore
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    let alive = true;
    supabase.rpc("bolle_chat_conversations").then(({ data, error }) => {
      if (!alive || error || !Array.isArray(data)) return;
      setPeople(prev => {
        const seen = new Set(prev.map(p => p.username.toLowerCase()));
        return [...prev, ...data.filter(r => r?.username && !seen.has(String(r.username).toLowerCase())).map(r => ({ username: String(r.username) }))];
      });
    }).catch(() => {});
    return () => { alive = false; };
  }, []);
  const hidden = new Set(exclude.filter(Boolean).map(u => String(u).toLowerCase()));
  const q = query.trim().replace(/^@/, "").toLowerCase();
  const visible = people.filter(p => !hidden.has(p.username.toLowerCase()) && (!q || p.username.toLowerCase().includes(q)));
  const typed = q && /^[a-z0-9_.-]{3,20}$/.test(q) && !hidden.has(q) && !people.some(p => p.username.toLowerCase() === q) ? q : "";
  async function send(username) {
    if (status[username] === "sending" || status[username] === "sent") return;
    setStatus(s => ({ ...s, [username]: "sending" }));
    const result = await onSendToUser?.(username);
    setStatus(s => ({ ...s, [username]: result?.ok ? "sent" : (result?.error || "Non inviata") }));
  }
  async function copyOrShare() {
    const url = bubbleShareUrl(bubbleId);
    if (navigator.share) { try { await navigator.share({ title: "Bolle", text: "Guarda questa bolla su Bolle 🫧", url }); } catch { /* annullato */ } return; }
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2200); } catch { /* clipboard non disponibile */ }
  }
  const row = (username) => {
    const st = status[username];
    return <li key={username} className="bl-share-row">
      <span className="bl-share-avatar" aria-hidden="true">🫧</span>
      <span className="bl-share-name">@{username}{st && st !== "sending" && st !== "sent" && <small role="alert">{st}</small>}</span>
      <button type="button" disabled={st === "sending" || st === "sent"} className={st === "sent" ? "done" : ""} onClick={() => send(username)}>{st === "sent" ? "Inviata ✓" : st === "sending" ? "…" : "Invia"}</button>
    </li>;
  };
  return <div className="bl-share" role="dialog" aria-modal="true" aria-label="Inoltra la bolla" onClick={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()}>
    <div className="bl-share-grip" aria-hidden="true" />
    <div className="bl-share-head"><strong>Inoltra la bolla</strong><button type="button" onClick={onClose} aria-label="Chiudi"><CloseIcon size={20} /></button></div>
    <div className="bl-share-main">
      <button type="button" className="bl-share-whatsapp" onClick={() => { onWhatsApp?.(); }}><span aria-hidden="true">💬</span> WhatsApp</button>
      <button type="button" className="bl-share-link" onClick={copyOrShare}><LinkIcon size={22} /> {copied ? "Link copiato ✓" : typeof navigator !== "undefined" && navigator.share ? "Altre app" : "Copia link"}</button>
    </div>
    <p className="bl-share-title">Invia a un utente di Bolle</p>
    <input className="bl-share-search" type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Cerca o scrivi uno username" aria-label="Cerca un utente" autoComplete="off" autoCapitalize="none" />
    <ul className="bl-share-list">
      {visible.slice(0, 30).map(p => row(p.username))}
      {typed && row(typed)}
      {!visible.length && !typed && <li className="bl-share-empty">{q ? "Nessun contatto trovato: scrivi lo username completo." : "Scrivi uno username per inviare la bolla."}</li>}
    </ul>
  </div>;
}

/* Sfondo galattico procedurale: nebulosa morbida a bassa risoluzione + stelle nitide a piena risoluzione.
   Viene generato una sola volta (stesso seme = stessa galassia ad ogni visita) e poi animato solo con CSS. */
function mulberry32(seed) { let t = seed >>> 0; return () => { t += 0x6D2B79F5; let r = Math.imul(t ^ (t >>> 15), 1 | t); r ^= r + Math.imul(r ^ (r >>> 7), 61 | r); return ((r ^ (r >>> 14)) >>> 0) / 4294967296; }; }
const gxHash = (x, y, s) => { let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(s, 1442695041); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
function gxNoise(x, y, s) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); const a = gxHash(xi, yi, s), b = gxHash(xi + 1, yi, s), c = gxHash(xi, yi + 1, s), d = gxHash(xi + 1, yi + 1, s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
function gxFbm(x, y, s, oct = 5) { let amp = .5, f = 1, sum = 0, norm = 0; for (let i = 0; i < oct; i++) { sum += amp * gxNoise(x * f, y * f, s + i * 17); norm += amp; amp *= .5; f *= 2.03; } return sum / norm; }
const GX_ANGLE = -0.62; // inclinazione della Via Lattea
const gxBand = (sx, sy) => { const c = Math.cos(GX_ANGLE), s = Math.sin(GX_ANGLE); return { along: sx * c + sy * s, across: -sx * s + sy * c }; };
const GXP = (base, cool, hot, c1, c2, c3, gain = 1) => ({ base, cool, hot, clouds: [c1, c2, c3], gain });
// Palette della galassia: una per aspetto (standard/chiaro) e una per ogni tema speciale. Valori RGB 0-1.
const GX_PALETTES = {
  standard: GXP([.016, .022, .05], [.42, .5, .95], [1.02, .8, .55], [.95, .22, .52], [.16, .52, .98], [1, .55, .22]),
  light: GXP([.06, .065, .18], [.55, .6, 1], [1.05, .85, .7], [.9, .4, .8], [.3, .6, 1], [1, .7, .5], 1.25),
  halloween: GXP([.05, .015, .05], [.6, .25, .85], [1.05, .55, .15], [.9, .3, .05], [.6, .15, .8], [1, .5, .1]),
  natale: GXP([.01, .035, .03], [.2, .6, .45], [1.05, .8, .5], [.9, .15, .2], [.1, .65, .4], [1, .8, .35]),
  pasqua: GXP([.05, .035, .08], [.75, .55, .95], [1.05, .8, .8], [.95, .5, .8], [.6, .75, 1], [1, .85, .5], 1.15),
  capodanno: GXP([.01, .02, .07], [.35, .45, .95], [1.05, .82, .4], [.2, .35, .95], [.85, .3, .7], [1, .78, .3]),
  estate: GXP([.01, .05, .07], [.2, .65, .9], [1.05, .8, .4], [.1, .7, .85], [1, .55, .2], [1, .8, .3]),
  primavera: GXP([.015, .05, .04], [.4, .8, .6], [1.05, .85, .7], [.95, .45, .7], [.4, .85, .5], [1, .8, .4]),
  autunno: GXP([.04, .02, .01], [.7, .4, .25], [1.05, .7, .3], [.95, .4, .1], [.7, .2, .1], [1, .7, .2]),
  inverno: GXP([.01, .03, .06], [.45, .7, .95], [.9, .95, 1.05], [.4, .7, 1], [.75, .9, 1], [.6, .5, .95]),
  caldo: GXP([.05, .015, .015], [.9, .35, .25], [1.05, .75, .3], [.95, .2, .1], [1, .5, .1], [.8, .1, .3]),
  freddo: GXP([.01, .03, .07], [.3, .6, 1], [.8, .95, 1.05], [.2, .6, 1], [.5, .9, 1], [.5, .4, 1]),
  orientale: GXP([.035, .012, .03], [.7, .3, .5], [1.05, .6, .35], [.9, .15, .25], [.7, .2, .55], [1, .7, .3]),
  universo: GXP([.012, .016, .06], [.4, .4, 1], [.95, .75, 1], [.45, .3, 1], [.9, .3, .9], [.3, .6, 1]),
  bolle: GXP([.02, .02, .07], [.5, .5, 1], [.9, .9, 1.05], [.6, .4, 1], [.3, .85, 1], [1, .5, .9]),
  natura: GXP([.01, .035, .025], [.3, .75, .45], [1, .9, .5], [.3, .8, .4], [.6, .9, .3], [.2, .6, .6]),
};
function paintGalaxy(nebCanvas, starCanvas, paletteId) {
  const pal = GX_PALETTES[paletteId] || GX_PALETTES.standard;
  const W = Math.max(1, window.innerWidth), H = Math.max(1, window.innerHeight);
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  /* 1) nebulosa e Via Lattea */
  const k = Math.min(0.5, 640 / W), nw = Math.max(8, Math.round(W * k)), nh = Math.max(8, Math.round(H * k));
  nebCanvas.width = nw; nebCanvas.height = nh;
  const nctx = nebCanvas.getContext("2d"), img = nctx.createImageData(nw, nh), px = img.data, unit = Math.min(nw, nh);
  const clouds = [{ x: -.34, y: .30, r: .36, c: pal.clouds[0], s: 8 }, { x: .30, y: -.34, r: .42, c: pal.clouds[1], s: 21 }, { x: -.05, y: -.05, r: .30, c: pal.clouds[2], s: 33 }];
  for (let y = 0; y < nh; y++) for (let x = 0; x < nw; x++) {
    const sx = (x - nw / 2) / unit, sy = (y - nh / 2) / unit;
    let { along, across } = gxBand(sx, sy);
    across += (gxFbm(along * 1.6 + 3, across * 1.6, 1, 4) - .5) * .3;
    const band = Math.exp(-((across / .3) ** 2));
    const bulge = Math.exp(-(((along - .08) / .55) ** 2));
    const core = Math.exp(-((across / .13) ** 2)) * (.45 + .55 * bulge);
    const cloud = gxFbm(along * 3.2, across * 3.2 + 7, 2, 6);
    const ridge = 1 - Math.abs(2 * gxFbm(along * 2.6 + 9, across * 3.4, 5, 5) - 1);
    const lane = Math.max(0, Math.min(1, (ridge - .6) / .35)) * Math.exp(-((across / .17) ** 2));
    const I = (band * .3 + core * .55) * (.45 + cloud * 1.1) * (1 - .9 * lane) * pal.gain;
    let [r, g, b] = pal.base; // fondo cosmico: quasi nero, con la tinta del tema
    const warm = Math.min(1, core * 1.4);
    r += I * (pal.cool[0] + (pal.hot[0] - pal.cool[0]) * warm); g += I * (pal.cool[1] + (pal.hot[1] - pal.cool[1]) * warm); b += I * (pal.cool[2] + (pal.hot[2] - pal.cool[2]) * warm);
    for (const n of clouds) {
      const dx = sx - n.x, dy = sy - n.y, d2 = (dx * dx + dy * dy) / (n.r * n.r);
      if (d2 > 4.5) continue;
      const e = Math.max(0, gxFbm(dx * 2.8 + n.s, dy * 2.8, n.s, 5) - .42) * 2.1 * Math.exp(-d2);
      r += e * n.c[0] * .55 * pal.gain; g += e * n.c[1] * .55 * pal.gain; b += e * n.c[2] * .55 * pal.gain;
    }
    const o = (y * nw + x) * 4; // tone mapping morbido: niente bianchi bruciati
    px[o] = 255 * (1 - Math.exp(-1.7 * r)); px[o + 1] = 255 * (1 - Math.exp(-1.7 * g)); px[o + 2] = 255 * (1 - Math.exp(-1.7 * b)); px[o + 3] = 255;
  }
  nctx.putImageData(img, 0, 0);
  /* 2) stelle nitide, più fitte lungo la Via Lattea */
  starCanvas.width = Math.round(W * dpr); starCanvas.height = Math.round(H * dpr);
  const ctx = starCanvas.getContext("2d"), rnd = mulberry32(0x5eed1e57), unitS = Math.min(W, H);
  ctx.scale(dpr, dpr);
  const density = (x, y) => { const { across } = gxBand((x - W / 2) / unitS, (y - H / 2) / unitS); return Math.exp(-((across / .32) ** 2)); };
  const tints = [[200, 220, 255], [255, 255, 255], [255, 244, 214], [255, 205, 160], [255, 170, 150]], weights = [.26, .36, .2, .12, .06];
  const pickTint = () => { let r = rnd(), i = 0; while (i < weights.length - 1 && r > weights[i]) { r -= weights[i]; i++; } return tints[i]; };
  const dust = Math.min(9000, Math.round(W * H / 55));
  for (let i = 0; i < dust; i++) { // polvere di stelle: punti di un solo pixel
    const x = rnd() * W, y = rnd() * H;
    if (rnd() > .18 + .82 * density(x, y)) continue;
    const t = pickTint(); ctx.fillStyle = `rgba(${t[0]},${t[1]},${t[2]},${(.12 + rnd() * .38).toFixed(2)})`;
    ctx.fillRect(x, y, 1 / dpr * (1 + (rnd() > .85 ? 1 : 0)), 1 / dpr * (1 + (rnd() > .85 ? 1 : 0)));
  }
  const field = Math.min(2400, Math.max(450, Math.round(W * H / 950)));
  const heroes = [];
  for (let i = 0; i < field; i++) {
    const x = rnd() * W, y = rnd() * H;
    if (rnd() > .35 + .65 * density(x, y)) continue;
    const m = rnd() ** 4.2, t = pickTint(), r = .35 + m * 1.15;
    if (m > .55) { const gr = ctx.createRadialGradient(x, y, 0, x, y, r * 5); gr.addColorStop(0, `rgba(${t[0]},${t[1]},${t[2]},.32)`); gr.addColorStop(1, `rgba(${t[0]},${t[1]},${t[2]},0)`); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, r * 5, 0, 7); ctx.fill(); }
    ctx.fillStyle = `rgba(${t[0]},${t[1]},${t[2]},${(.3 + m * .7).toFixed(2)})`; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    if (m > .8) heroes.push({ x, y, t, m });
  }
  heroes.sort((p, q) => q.m - p.m).slice(0, 7).forEach(({ x, y, t }, i) => { // le stelle più luminose: alone e raggi di diffrazione
    const len = 16 + (i < 3 ? 22 : 8), gr = ctx.createRadialGradient(x, y, 0, x, y, 11); gr.addColorStop(0, `rgba(${t[0]},${t[1]},${t[2]},.55)`); gr.addColorStop(1, `rgba(${t[0]},${t[1]},${t[2]},0)`);
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, 11, 0, 7); ctx.fill();
    ctx.lineWidth = .7; for (const [dx, dy] of [[1, 0], [0, 1]]) { const lg = ctx.createLinearGradient(x - dx * len, y - dy * len, x + dx * len, y + dy * len); lg.addColorStop(0, "rgba(255,255,255,0)"); lg.addColorStop(.5, `rgba(${t[0]},${t[1]},${t[2]},.7)`); lg.addColorStop(1, "rgba(255,255,255,0)"); ctx.strokeStyle = lg; ctx.beginPath(); ctx.moveTo(x - dx * len, y - dy * len); ctx.lineTo(x + dx * len, y + dy * len); ctx.stroke(); }
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(x, y, 1.5, 0, 7); ctx.fill();
  });
}
const GALAXY_GLINTS = (() => { const r = mulberry32(0xbeef42); return Array.from({ length: 22 }, (_, i) => ({ x: (r() * 100).toFixed(1), y: (r() * 100).toFixed(1), d: (3 + r() * 5).toFixed(1), s: (-r() * 8).toFixed(1), z: (1.4 + r() * 1.6).toFixed(1), h: i % 5 === 0 ? 215 : i % 7 === 0 ? 35 : 220 })); })();
function GalaxyBackdrop({ palette = "standard" }) {
  const nebRef = useRef(null), starRef = useRef(null);
  useEffect(() => {
    let timer = 0, lastW = 0, lastH = 0;
    const draw = () => { if (!nebRef.current || !starRef.current) return; lastW = window.innerWidth; lastH = window.innerHeight; try { paintGalaxy(nebRef.current, starRef.current, palette); } catch { /* canvas non disponibile: resta lo sfondo scuro */ } };
    timer = window.setTimeout(draw, 30);
    // La barra del browser mobile cambia l'altezza di poco: si ridisegna solo per variazioni reali (rotazione, ridimensionamento).
    const onResize = () => { clearTimeout(timer); timer = window.setTimeout(() => { if (Math.abs(window.innerWidth - lastW) > 40 || Math.abs(window.innerHeight - lastH) > Math.max(160, lastH * .25)) draw(); }, 300); };
    window.addEventListener("resize", onResize);
    return () => { clearTimeout(timer); window.removeEventListener("resize", onResize); };
  }, [palette]);
  return <div className="bl-galaxy" aria-hidden="true">
    <canvas ref={nebRef} className="bl-galaxy-neb" />
    <canvas ref={starRef} className="bl-galaxy-stars" />
    <div className="bl-galaxy-glints">{GALAXY_GLINTS.map((g, i) => <i key={i} style={{ left: `${g.x}%`, top: `${g.y}%`, "--d": `${g.d}s`, "--s": `${g.s}s`, "--z": `${g.z}px`, "--h": g.h }} />)}</div>
    <div className="bl-galaxy-vignette" />
  </div>;
}

function TravelSheet({ token, onClose, onStart, onNotify }) {
  const [data,setData]=useState(null),[loading,setLoading]=useState(Boolean(token));
  const [message,setMessage]=useState(""),[busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [tab,setTab]=useState("create");
  const [myTravels,setMyTravels]=useState([]),[myLoading,setMyLoading]=useState(false),[myError,setMyError]=useState("");
  const [selectedToken,setSelectedToken]=useState(null);
  const activeToken=token || selectedToken;
  const loadMine=useCallback(async()=>{
    setMyLoading(true);setMyError("");
    const {data:rows,error:err}=await supabase.rpc("bolle_my_travels");
    setMyLoading(false);
    if(err)setMyError("Impossibile caricare le tue bolle. Esegui lo script SQL aggiuntivo.");
    else setMyTravels(rows||[]);
  },[]);
  useEffect(()=>{if(tab==="mine"&&!activeToken)loadMine();},[tab,activeToken,loadMine]);
  const load=useCallback(async()=>{
    if(!activeToken)return;
    setLoading(true);setError("");
    const {data:rows,error:err}=await supabase.rpc("bolle_read_travel",{p_token:activeToken});
    setLoading(false);if(err||!rows?.length)setError("Bolla scaduta o non disponibile.");else setData(rows[0]);
  },[activeToken]);
  useEffect(()=>{load();},[load]);
  async function pass(){
    if(!message.trim()||busy)return;
    setBusy(true);setError("");
    const {error:err}=await supabase.rpc("bolle_pass_travel",{p_token:activeToken,p_message:message.trim().slice(0,140)});
    setBusy(false);
    if(err){setError(err.message);return;}
    setMessage("");await load();onNotify("Hai fatto viaggiare la bolla! 🫧");
  }
  const link=activeToken ? `${window.location.origin}/?travel=${encodeURIComponent(activeToken)}` : "";
  async function share(){
    const text=`🫧 Una Bolla Viaggiatrice ti aspetta: ${link}`;
    if(navigator.share){try{await navigator.share({text});return;}catch(e){if(e.name==="AbortError")return;}}
    try{await navigator.clipboard.writeText(text);onNotify("Link copiato");}catch{window.prompt("Copia il link",link);}
  }
  return <Sheet label="Bolle Viaggiatrici" title="🫧 Bolle Viaggiatrici" subtitle="Crea una catena o ritrova quelle a cui hai partecipato." onClose={onClose}>
    {!activeToken && <>
      <div className="bl-segment" role="tablist" aria-label="Sezioni Bolle Viaggiatrici">
        <button type="button" role="tab" aria-selected={tab==="create"} className={tab==="create"?"on":""} onClick={()=>setTab("create")}>✨ Crea</button>
        <button type="button" role="tab" aria-selected={tab==="mine"} className={tab==="mine"?"on":""} onClick={()=>setTab("mine")}>🫧 Le mie bolle</button>
      </div>
      {tab==="create" && <><p className="bl-muted">Crea una catena di pensieri anonimi da passare agli amici. Ognuno può contribuire una volta: massimo 20 passaggi e durata 7 giorni.</p><button className="bl-cta" onClick={onStart}>Crea una Bolla Viaggiatrice</button></>}
      {tab==="mine" && <div className="bl-travel-steps">{myLoading && <p className="bl-muted">Caricamento…</p>}{myError && <p className="bl-error">{myError}</p>}{!myLoading&&!myError&&myTravels.length===0&&<p className="bl-muted">Non hai ancora partecipato a Bolle Viaggiatrici.</p>}{myTravels.map(t=><button type="button" key={t.token} className="bl-ghost" style={{display:"block",width:"100%",textAlign:"left",marginBottom:10}} onClick={()=>{setSelectedToken(t.token);setData(null);}}><strong>🫧 {t.title}</strong><br/><small>{t.hops} passaggi · {new Date(t.expires_at).toLocaleDateString("it-IT")}</small></button>)}</div>}
    </>}
    {activeToken && <><button type="button" className="bl-ghost" onClick={()=>{if(token){onClose();}else{setSelectedToken(null);setData(null);setTab("mine");}}}>← Torna alle mie bolle</button>{loading && <p>Caricamento…</p>}{error && <p className="bl-error">{error}</p>}{data && <><h3>{data.title}</h3><p>🫧 {data.hops} passaggi · Scade {new Date(data.expires_at).toLocaleDateString("it-IT")}</p><div className="bl-travel-steps">{(data.messages||[]).map((m,i)=><p key={i}><strong>#{i+1}</strong> {m.message}</p>)}</div><label className="bl-field-label">Aggiungi il tuo pensiero<input maxLength={140} value={message} onChange={e=>setMessage(e.target.value)} placeholder="Il tuo messaggio (max 140 caratteri)" /></label><button className="bl-cta" disabled={busy||!message.trim()||data.hops>=20} onClick={pass}>{busy?"Invio…":"Aggiungi e passa"}</button><button className="bl-ghost" onClick={share}>Condividi su WhatsApp / copia link</button></>}</>}
  </Sheet>;
}

const BOLLE_CREATION_MODES = [
  ["photo", "📸", "Foto / video"], ["gif", "🎬", "GIF e meme"],
  ["thought", "💭", "Pensiero"], ["question", "🎲", "Domanda"],
  ["confession", "💜", "Confessione"], ["choice", "⚡", "Questo o quello?"],
  ["truth", "🕵️", "2 verità, 1 bugia"], ["rating", "⭐", "Dai un voto"]
];
/* Schermata «Cosa vuoi pubblicare?»: una bolla colorata per ogni tipo (id, emoji, nome, sottotitolo, colore 1, colore 2, diametro). */
const CMP_BUBBLES = [
  ["photo", "📸", "Foto o video", "Dalla galleria", "#ff7eb6", "#7a5cff", 132],
  ["thought", "💭", "Pensiero", "Poche parole", "#6ee7f9", "#6a7bff", 108],
  ["choice", "⚡", "Questo o quello?", "Fai scegliere", "#5dffb1", "#2fb7ff", 118],
  ["gif", "🎬", "GIF e meme", "Fai ridere", "#ffb347", "#ff4f81", 104],
  ["question", "🎲", "Domanda", "Chiedi al mondo", "#ffe066", "#ff8a3d", 114],
  ["confession", "💜", "Confessione", "Dillo qui", "#d58cff", "#ff5fa2", 106],
  ["truth", "🕵️", "2 verità, 1 bugia", "Indovina", "#a5b4ff", "#4b57d6", 116],
  ["rating", "⭐", "Dai un voto", "Da 1 a 10", "#fff07a", "#ffa000", 102],
];
/* ---------- Feedback aptico ----------
   Android: navigator.vibrate. iPhone: Safari non espone un'API aptica, ma attivare un interruttore di sistema
   (<input type="checkbox" switch>, Safari 17.4+) produce un leggero tocco. Se non disponibile, non succede nulla. */
let hapticSwitch = null;
function haptic(strength = "tick") {
  try { if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") { navigator.vibrate(strength === "open" ? 14 : strength === "select" ? 22 : 7); return; } } catch { /* ignora */ }
  try {
    if (!hapticSwitch || !hapticSwitch.isConnected) {
      const label = document.createElement("label");
      label.setAttribute("aria-hidden", "true");
      label.style.cssText = "position:fixed;left:-100px;top:-100px;width:1px;height:1px;opacity:.01;pointer-events:none;";
      const input = document.createElement("input");
      input.type = "checkbox"; input.setAttribute("switch", ""); input.tabIndex = -1;
      label.appendChild(input); document.body.appendChild(label); hapticSwitch = label;
    }
    hapticSwitch.click();
  } catch { /* nessun aptico disponibile */ }
}

/* Disposizione a ventaglio: due archi alternati (interno/esterno) attorno al pulsante, spostati se non entrano nello schermo. */
function fanLayout(cx, cy, count, W, H, topSafe) {
  const R1 = 104, R2 = 158, pad = 34, span = (156 * Math.PI) / 180;
  const build = (center) => Array.from({ length: count }, (_, i) => {
    const a = center - span / 2 + span * (count > 1 ? i / (count - 1) : 0.5), r = i % 2 ? R2 : R1;
    return { x: Math.cos(a) * r, y: Math.sin(a) * r };
  });
  const fits = (pts) => pts.every((p) => cx + p.x > pad && cx + p.x < W - pad && cy + p.y > topSafe + pad && cy + p.y < H - pad);
  for (const d of [0, 10, -10, 20, -20, 32, -32, 45, -45, 60, -60, 75, -75]) {
    const pts = build(-Math.PI / 2 + (d * Math.PI) / 180);
    if (fits(pts)) return pts;
  }
  return build(-Math.PI / 2).map((p) => ({ x: Math.min(W - pad - cx, Math.max(pad - cx, p.x)), y: Math.max(topSafe + pad - cy, p.y) }));
}

/* Pulsante «+» con ventaglio di bolle: tocco breve = schermata classica; pressione prolungata = le 8 bolle
   sbocciano a molla; si scorre col dito su una bolla (tick aptico) e si rilascia per aprire quel tipo. */
function BubbleFan({ out, bonus, locked, onTap, onPick }) {
  const fabRef = useRef(null), bdRef = useRef(null), petalRefs = useRef([]);
  const sim = useRef(null), geom = useRef({ cx: 0, cy: 0 }), pointer = useRef({ x: 0, y: 0, down: false, sx: 0, sy: 0 });
  const holdTimer = useRef(0), ignoreClick = useRef(false), openRef = useRef(false), activeRef = useRef(null);
  const [open, setOpen] = useState(false), [pressing, setPressing] = useState(false), [active, setActive] = useState(null), [choosing, setChoosing] = useState(false); // choosing: il ventaglio è in attesa della scelta
  const hardClose = useRef(0);
  const forceClose = () => { clearTimeout(hardClose.current); sim.current = null; openRef.current = false; activeRef.current = null; setChoosing(false); setActive(null); setOpen(false); };
  const armHardClose = () => { clearTimeout(hardClose.current); hardClose.current = setTimeout(forceClose, 750); }; // rete di sicurezza se il browser sospende le animazioni

  const setAct = (v) => { if (activeRef.current === v) return; activeRef.current = v; setActive(v); if (v !== null) haptic("tick"); };
  const openFan = () => {
    const r = fabRef.current?.getBoundingClientRect(); if (!r) return;
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2, now = performance.now();
    const pts = fanLayout(cx, cy, CMP_BUBBLES.length, window.innerWidth, window.innerHeight, 70);
    const topY = Math.min(...pts.map((q) => q.y)), midX = pts.reduce((a, q) => a + q.x, 0) / pts.length;
    geom.current = { cx, cy, capX: Math.max(90 - cx, Math.min(window.innerWidth - 90 - cx, midX)), capY: Math.max(84 - cy, topY - 60) }; // fumetto: sopra l'intero ventaglio, dentro lo schermo
    sim.current = { mode: "open", t0: now, tc: 0, last: now, bd: 0, chosen: null, p: pts.map((pt, i) => ({ x: 0, y: 0, vx: 0, vy: 0, s: 0.18, vs: 0, o: 0, hx: pt.x, hy: pt.y, delay: i * 0.032 })) };
    clearTimeout(hardClose.current); openRef.current = true; activeRef.current = null; setActive(null); setChoosing(true); setOpen(true); haptic("open");
  };
  const closeFan = () => { const S = sim.current; if (!S || S.mode !== "open") return; S.mode = "close"; S.tc = performance.now(); openRef.current = false; setAct(null); setChoosing(false); armHardClose(); };
  const choose = (i) => {
    const S = sim.current; if (!S || S.mode !== "open") return;
    const id = CMP_BUBBLES[i][0];
    haptic("select"); try { playPop(); } catch { /* audio non disponibile */ }
    S.mode = "choose"; S.chosen = i; S.tc = performance.now(); openRef.current = false; setChoosing(false); armHardClose();
    if (id === "photo") onPick(id); // il selettore file richiede il gesto dell'utente: parte subito
    else setTimeout(() => onPick(id), 170); // lascia vedere la bolla che scoppia
  };
  const nearest = (x, y) => {
    const S = sim.current; if (!S) return null;
    let best = null, bd = 1e9;
    S.p.forEach((q, i) => { if (q.o < 0.5) return; const d = Math.hypot(x - (geom.current.cx + q.x), y - (geom.current.cy + q.y)); if (d < bd) { bd = d; best = i; } });
    return bd <= 44 ? best : null;
  };

  /* fisica: ogni bolla è una molla (sottosmorzata = rimbalzo), si allunga nel verso del movimento e segue il dito */
  useEffect(() => {
    if (!open) return undefined;
    const calm = !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let id = 0;
    const step = (t) => {
      const S = sim.current; if (!S) return;
      const dt = Math.min(0.033, Math.max(0.001, (t - S.last) / 1000)); S.last = t;
      const { cx, cy } = geom.current, { x: px, y: py, down } = pointer.current, act = activeRef.current;
      S.p.forEach((q, i) => {
        const el = petalRefs.current[i]; if (!el) return;
        let tx = 0, ty = 0, ts = 0.18, to = 0;
        if (S.mode === "open" && (t - S.t0) / 1000 >= q.delay) {
          tx = q.hx; ty = q.hy; ts = 1; to = 1;
          if (!calm) { tx += Math.sin(t / 900 + i * 1.7) * 3; ty += Math.cos(t / 1100 + i * 2.3) * 3.5; }
          if (down) {
            const dx = px - (cx + q.x), dy = py - (cy + q.y), d = Math.hypot(dx, dy) || 1;
            if (i === act) { ts = 1.34; tx += (dx / d) * Math.min(10, d * 0.25); ty += (dy / d) * Math.min(10, d * 0.25); }
            else if (d < 100) { const k = 1 - d / 100; ts = 1 + 0.1 * k; tx += (dx / d) * 8 * k; ty += (dy / d) * 8 * k; }
          } else if (i === act) ts = 1.18;
        } else if (S.mode === "choose" && i === S.chosen) { tx = q.hx; ty = q.hy; ts = 1.9; to = 0; }
        const kp = 190, cp = calm ? 30 : 13, ks = 260, cs = calm ? 34 : 15;
        q.vx += (kp * (tx - q.x) - cp * q.vx) * dt; q.x += q.vx * dt;
        q.vy += (kp * (ty - q.y) - cp * q.vy) * dt; q.y += q.vy * dt;
        q.vs += (ks * (ts - q.s) - cs * q.vs) * dt; q.s = Math.max(0.01, q.s + q.vs * dt);
        q.o += (to - q.o) * Math.min(1, dt * (S.mode === "open" ? 14 : 9));
        const sp = Math.hypot(q.vx, q.vy), st = calm ? 0 : Math.min(0.32, sp / 1500), ang = Math.atan2(q.vy, q.vx);
        el.style.transform = `translate3d(${q.x.toFixed(2)}px,${q.y.toFixed(2)}px,0) scale(${q.s.toFixed(3)})`;
        el.style.opacity = String(Math.max(0, Math.min(1, q.o)));
        const orb = el.firstElementChild;
        if (orb) orb.style.transform = `rotate(${ang}rad) scale(${(1 + st).toFixed(3)},${(1 - st * 0.7).toFixed(3)}) rotate(${-ang}rad)`;
      });
      S.bd += ((S.mode === "open" ? 1 : 0) - S.bd) * Math.min(1, dt * 12);
      if (bdRef.current) bdRef.current.style.opacity = String(S.bd);
      if (S.mode !== "open" && t - S.tc > 420) { forceClose(); return; }
      id = requestAnimationFrame(step);
    };
    id = requestAnimationFrame(step);
    const onKey = (e) => { if (e.key === "Escape") closeFan(); };
    const onResize = () => closeFan();
    const onHide = () => { if (document.hidden) forceClose(); };
    window.addEventListener("keydown", onKey); window.addEventListener("resize", onResize); document.addEventListener("visibilitychange", onHide); window.addEventListener("pagehide", forceClose);
    return () => { cancelAnimationFrame(id); window.removeEventListener("keydown", onKey); window.removeEventListener("resize", onResize); document.removeEventListener("visibilitychange", onHide); window.removeEventListener("pagehide", forceClose); };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { clearTimeout(holdTimer.current); clearTimeout(hardClose.current); }, []);

  const down = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    ignoreClick.current = false;
    if (openRef.current) return; // ventaglio già aperto: il click lo richiude
    warmAudio();
    pointer.current = { x: e.clientX, y: e.clientY, down: true, sx: e.clientX, sy: e.clientY };
    setPressing(true);
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignora */ }
    clearTimeout(holdTimer.current);
    if (!locked) holdTimer.current = setTimeout(() => { ignoreClick.current = true; openFan(); }, 240);
  };
  const move = (e) => {
    const P = pointer.current; if (!P.down) return;
    P.x = e.clientX; P.y = e.clientY;
    if (!openRef.current) { if (Math.hypot(P.x - P.sx, P.y - P.sy) > 18) clearTimeout(holdTimer.current); return; }
    setAct(nearest(P.x, P.y));
  };
  const up = (e) => {
    clearTimeout(holdTimer.current); setPressing(false);
    const wasDown = pointer.current.down; pointer.current.down = false;
    if (!wasDown || !openRef.current) return;
    if (e.type !== "pointercancel" && activeRef.current !== null) choose(activeRef.current);
    // altrimenti il ventaglio resta aperto: si può toccare una bolla oppure lo sfondo per chiudere
  };
  const click = () => {
    if (ignoreClick.current) { ignoreClick.current = false; return; }
    if (openRef.current) { closeFan(); return; }
    onTap();
  };

  const cur = active !== null ? CMP_BUBBLES[active] : null;
  return <>
    <button ref={fabRef} type="button" className={`bl-fab bl-fab--bubble ${pressing ? "is-pressing" : ""} ${open ? "is-fan-open" : ""}`}
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onClick={click} onContextMenu={(e) => e.preventDefault()}
      aria-haspopup="menu" aria-expanded={open} aria-label={out ? `Crea una bolla e ottieni ${bonus} scoppi` : "Crea una bolla"} title="Tocca per creare, tieni premuto per scegliere il tipo">
      <span className="bl-fab-plus" aria-hidden="true"><Plus size={34} strokeWidth={2.4} /></span>{out && <span className="bl-fab-bonus" aria-hidden="true">+{bonus}</span>}
    </button>
    {open && createPortal(
      <div className="bl-fan" role="menu" aria-label="Scegli il tipo di bolla">
        <div className="bl-fan-backdrop" ref={bdRef} onClick={closeFan} style={{ opacity: 0 }} />
        <div className="bl-fan-origin" style={{ left: geom.current.cx, top: geom.current.cy }}>
          {CMP_BUBBLES.map(([id, icon, label, , c1, c2], i) =>
            <button key={id} ref={(el) => { petalRefs.current[i] = el; }} type="button" role="menuitem" className={`bl-fan-petal ${active === i ? "on" : ""}`} style={{ "--c1": c1, "--c2": c2, opacity: 0 }} onClick={() => choose(i)} aria-label={label}>
              <span className="bl-fan-orb"><span className="bl-fan-icon" aria-hidden="true">{icon}</span></span>
            </button>)}
          {choosing && <div className="bl-fan-caption" aria-live="polite" key={active ?? "hint"} style={{ left: geom.current.capX, top: geom.current.capY }}>
            {cur ? <><strong>{cur[2]}</strong><small>{cur[3]}</small></> : <><strong>Scegli una bolla</strong><small>Scorri e rilascia</small></>}
          </div>}
        </div>
      </div>, document.body)}
  </>;
}
/* ---------- Banner delle distanze «Vicino a me» ----------
   Si apre tenendo premuto sul pulsante. Stessa fisica del ventaglio di bolle: ogni voce è una molla
   sottosmorzata che parte dal pulsante, arriva al suo posto con un rimbalzo (a cascata) e al
   ritorno rientra nel pulsante. Il contenitore si gonfia come una bolla dal punto del pulsante. */
const radiusLabel = (r) => (r < 1 ? `${Math.round(r * 1000)} m` : `${r} km`);
function RadiusFan({ open, radii, value, active, originRef, onPick, onClosed }) {
  const [mounted, setMounted] = useState(open);
  const rootRef = useRef(null), chipRefs = useRef([]), sim = useRef(null), raf = useRef(0);
  const openRef = useRef(open); openRef.current = open;
  const activeRef = useRef(active); activeRef.current = active;
  useEffect(() => { if (open) setMounted(true); }, [open]);
  useEffect(() => { if (open && sim.current) sim.current.t0 = performance.now(); }, [open]); // riaperto mentre si chiude
  useLayoutEffect(() => {
    if (!mounted) return undefined;
    const root = rootRef.current, btn = originRef.current;
    if (!root || !btn) return undefined;
    const calm = !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const b = btn.getBoundingClientRect(), bx = b.left + b.width / 2, by = b.top + b.height / 2, rr = root.getBoundingClientRect();
    root.style.transformOrigin = `${bx - rr.left}px ${by - rr.top}px`;
    const chips = radii.map((_, i) => {
      const el = chipRefs.current[i], r = el?.getBoundingClientRect();
      const hx = r ? bx - (r.left + r.width / 2) : 0, hy = r ? by - (r.top + r.height / 2) : 0; // posizione «a casa» = dentro il pulsante
      return { hx, hy, x: hx, y: hy, vx: 0, vy: 0, s: 0.18, vs: 0, o: 0 };
    });
    sim.current = { chips, box: { s: 0.3, vs: 0, o: 0 }, t0: performance.now(), last: performance.now() };
    const step = (t) => {
      const S = sim.current; if (!S) return;
      const dt = Math.min(0.033, Math.max(0.001, (t - S.last) / 1000)); S.last = t;
      const isOpen = openRef.current, kp = 190, cp = calm ? 30 : 13, ks = 260, cs = calm ? 34 : 15;
      const bs = S.box;
      const bts = isOpen ? 1 : 0.3, bto = isOpen ? 1 : 0;
      bs.vs += (ks * (bts - bs.s) - cs * bs.vs) * dt; bs.s = Math.max(0.01, bs.s + bs.vs * dt);
      bs.o += (bto - bs.o) * Math.min(1, dt * (isOpen ? 16 : 10));
      root.style.transform = `scale(${bs.s.toFixed(3)})`; root.style.opacity = String(Math.max(0, Math.min(1, bs.o)));
      let alive = bs.o > 0.03;
      S.chips.forEach((q, i) => {
        const el = chipRefs.current[i]; if (!el) return;
        const go = isOpen && (t - S.t0) / 1000 >= i * 0.05;
        const tx = go ? 0 : q.hx, ty = go ? 0 : q.hy, isAct = activeRef.current === radii[i];
        const ts = go ? (isAct ? 1.2 : 1) : 0.18, to = go ? 1 : 0;
        q.vx += (kp * (tx - q.x) - cp * q.vx) * dt; q.x += q.vx * dt;
        q.vy += (kp * (ty - q.y) - cp * q.vy) * dt; q.y += q.vy * dt;
        q.vs += (ks * (ts - q.s) - cs * q.vs) * dt; q.s = Math.max(0.01, q.s + q.vs * dt);
        q.o += (to - q.o) * Math.min(1, dt * (go ? 14 : 9));
        const sp = Math.hypot(q.vx, q.vy), st = calm ? 0 : Math.min(0.3, sp / 1400), ang = Math.atan2(q.vy, q.vx);
        el.style.transform = `translate3d(${q.x.toFixed(2)}px,${q.y.toFixed(2)}px,0) scale(${q.s.toFixed(3)}) rotate(${ang}rad) scale(${(1 + st).toFixed(3)},${(1 - st * 0.7).toFixed(3)}) rotate(${-ang}rad)`;
        el.style.opacity = String(Math.max(0, Math.min(1, q.o)));
        if (q.o > 0.03) alive = true;
      });
      if (!isOpen && !alive) { sim.current = null; raf.current = 0; setMounted(false); onClosed?.(); return; }
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(raf.current); };
  }, [mounted]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!mounted) return null;
  return <div ref={rootRef} className="bl-radius bl-radius-fan" role="group" aria-label="Distanza massima" style={{ opacity: 0, pointerEvents: open ? "auto" : "none" }}>
    {radii.map((r, i) => <button key={r} ref={(el) => { chipRefs.current[i] = el; }} type="button" data-radius={r} className={`${value === r ? "on" : ""} ${active === r ? "is-act" : ""}`} style={{ opacity: 0 }} onClick={() => onPick(r)} aria-pressed={value === r}>{radiusLabel(r)}</button>)}
  </div>;
}

/* ---------- Molla a integrazione numerica (come il ventaglio) ----------
   Anima un numero da `from` a `to` con una molla sottosmorzata: supera il bersaglio e si assesta.
   `v0` è la velocità iniziale (px/s), così il rilascio continua il gesto del dito. Restituisce la funzione di stop. */
function runSpring({ from, to = 0, v0 = 0, k = 170, c = 15, onFrame, onDone }) {
  const calm = typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (calm) { onFrame(to); onDone?.(); return () => {}; }
  let x = from, v = v0, last = performance.now(), id = 0, still = 0, stopped = false;
  const step = (t) => {
    if (stopped) return;
    const dt = Math.min(0.033, Math.max(0.001, (t - last) / 1000)); last = t;
    v += (k * (to - x) - c * v) * dt; x += v * dt;
    onFrame(x);
    still = Math.abs(to - x) < 0.4 && Math.abs(v) < 8 ? still + 1 : 0;
    if (still > 3) { onFrame(to); onDone?.(); return; }
    id = requestAnimationFrame(step);
  };
  id = requestAnimationFrame(step);
  return () => { stopped = true; cancelAnimationFrame(id); };
}

/* ---------- Fisica condivisa: ogni pulsante dell'app è una piccola molla ----------
   Alla pressione si schiaccia (come gelatina), al rilascio torna con un rimbalzo e un tocco aptico leggero.
   Usa Web Animations sulla proprietà `scale`: non tocca `transform` né le transizioni già presenti negli stili.
   Per escludere un elemento: data-physics="off". Per spegnere l'aptico: localStorage bolle-haptics = "off". */
const PHYS_SKIP = ".bl-fab, .bl-fan-petal, .bl-bubble, .bl-slot, .bl-ad *, .bl-user-link, .bl-link, [data-physics='off']";
const PHYS_Z = 0.5, PHYS_W = 10; // smorzamento e pulsazione della molla (stessa del ventaglio)
function physicsRelease(from) { // keyframe di una molla sottosmorzata da `from` (x, y) fino a 1
  const wd = PHYS_W * Math.sqrt(1 - PHYS_Z * PHYS_Z), N = 28, frames = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N, p = i === N ? 0 : Math.exp(-PHYS_Z * PHYS_W * t) * (Math.cos(wd * t) + ((PHYS_Z * PHYS_W) / wd) * Math.sin(wd * t));
    frames.push({ offset: t, scale: `${(1 + (from[0] - 1) * p).toFixed(4)} ${(1 + (from[1] - 1) * p).toFixed(4)}` });
  }
  return frames;
}
function installBollePhysics() {
  if (typeof document === "undefined" || typeof Element === "undefined" || !Element.prototype.animate) return () => {};
  const calm = !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  let pressed = null, lastTick = 0;
  const target = (e) => {
    const el = e.target instanceof Element ? e.target.closest("button, [role='button'], .bl-bubble") : null;
    if (!el || el.disabled || el.getAttribute("aria-disabled") === "true" || !el.closest(".bl-root") || el.matches(PHYS_SKIP) && !el.matches(".bl-bubble")) return null;
    return el;
  };
  const down = (e) => {
    const el = target(e); if (!el) return;
    let hapticOff = false; try { hapticOff = localStorage.getItem("bolle-haptics") === "off"; } catch { /* ignora */ }
    const now = performance.now();
    if (!hapticOff && now - lastTick > 60) { lastTick = now; haptic("tick"); }
    if (calm || el.matches(".bl-bubble")) return; // le bolle del feed hanno già la loro fisica
    const r = el.getBoundingClientRect();
    const to = r.width > 220 || r.height > 90 ? [0.985, 0.97] : Math.abs(r.width - r.height) < 6 && r.width < 64 ? [0.88, 0.88] : [1.03, 0.92];
    pressed = { el, to };
    pressed.anim = el.animate([{ scale: "1 1" }, { scale: `${to[0]} ${to[1]}` }], { duration: 110, easing: "ease-out", fill: "forwards" });
  };
  const up = () => {
    if (!pressed) return;
    const { el, to, anim } = pressed; pressed = null;
    anim?.cancel(); // solo la nostra animazione di pressione, non quelle CSS dell'elemento
    const rel = el.animate(physicsRelease(to), { duration: 620, easing: "linear" });
    rel.onfinish = () => rel.cancel();
  };
  document.addEventListener("pointerdown", down, true);
  document.addEventListener("pointerup", up, true);
  document.addEventListener("pointercancel", up, true);
  return () => { document.removeEventListener("pointerdown", down, true); document.removeEventListener("pointerup", up, true); document.removeEventListener("pointercancel", up, true); };
}

const DAILY_PROMPTS = [
  "Qual è la cosa più strana che ti è successa questa settimana?", "Quale piccolo gesto gentile hai ricevuto di recente?", "Se potessi cenare con chiunque, chi sceglieresti?",
  "Qual è il tuo guilty pleasure musicale?", "Che superpotere inutile vorresti avere?", "Qual è stato il tuo primo cellulare?",
  "Qual è un posto in cui torneresti subito?", "Quale film guarderesti all'infinito?", "Cosa ti fa sempre ridere?",
  "Qual è la cosa più coraggiosa che hai fatto?", "Che cibo non riesci proprio a mangiare?", "Qual è il tuo ricordo d'infanzia preferito?",
  "Se la tua giornata fosse una canzone, quale sarebbe?", "Qual è un'abitudine di cui vai fiero?", "Cosa imparerai quest'anno?",
  "Quale app non potresti cancellare?", "Qual è la tua colazione perfetta?", "Che consiglio daresti al te di dieci anni fa?",
  "Qual è un talento nascosto che hai?", "Qual è la cosa più bella che hai visto di recente?", "Mare, montagna o città: dove ti ricarichi?",
  "Quale parola italiana ti piace di più?", "Qual è il regalo più bello che hai fatto?", "Cosa faresti con un giorno senza telefono?",
  "Quale serie ti ha tenuto sveglio fino a tardi?", "Qual è la tua piccola gioia quotidiana?", "Che lavoro faresti se non contassero i soldi?",
  "Qual è la tua paura più divertente?", "Chi ti ha insegnato qualcosa di importante?", "Qual è la tua stagione preferita e perché?",
];
/* Bolla rara: ~1 su 20, decisa dall'id (stessa formula FNV-1a di bolle_is_rare nel database, che assegna il bonus). */
function isRareBubble(id) { return typeof id === "string" && !id.startsWith("starter-") && hash(id) % 20 === 0; }
function dailyPrompt() { return DAILY_PROMPTS[Math.floor(romeToday().getTime() / 86400000) % DAILY_PROMPTS.length]; }
const BOLLE_PRESETS = {
  meme: ["Io che dico 'solo 5 minuti' e passano 3 ore", "Quando arriva venerdì e spariscono tutti i problemi", "La mia faccia quando mi dicono 'dobbiamo parlare'", "POV: apro il frigo per la quinta volta", "Quando il gruppo decide qualcosa senza di me", "Io dopo aver detto 'non mi affeziono'"],
  question: ["Qual è una cosa che tutti amano ma tu no?", "Qual è il consiglio più bello che hai ricevuto?", "Qual è una piccola cosa che ti rende felice?", "Cosa faresti con un giorno completamente libero?", "Quale canzone descrive la tua giornata?", "Qual è il tuo talento più inutile?"],
  confession: ["Non l'ho mai detto a nessuno, ma…", "Una cosa che vorrei cambiare è…", "A volte faccio finta che…", "Il messaggio che non ho mai inviato dice…", "Mi rende felice quando…", "Ho sempre desiderato…"],
  choice: ["Mare 🌊 o montagna ⛰️?", "Pizza 🍕 o sushi 🍣?", "Messaggi 💬 o chiamate 📞?", "Viaggio nel passato ⏳ o nel futuro 🚀?", "Caffè ☕ o tè 🍵?", "Alba 🌅 o tramonto 🌇?"]
};
BOLLE_PRESETS.rating = ["Come ti sembra il mio outfit di oggi?", "Quanto è bella questa foto?", "Che voto dai alla mia idea?", "Quanto è buona questa cena?", "Voto al mio nuovo taglio:"];
const BOLLE_CARD_COLORS = ["#4f2f92", "#185b75", "#a13c64", "#20664e", "#8b4c24", "#293a80"];
const BOLLE_CARD_THEMES = {
  meme: { bg: ["#ff3d81", "#ffb400"], ink: "#ffffff", sub: "#fff3d6", font: (s) => `900 ${s}px Impact, "Arial Black", system-ui, sans-serif`, upper: true, stroke: "#000", deco: "stars" },
  thought: { bg: ["#bfe3ff", "#e6d5ff"], ink: "#2b2a5c", sub: "#5b5a96", font: (s) => `600 ${s}px "Avenir Next", system-ui, sans-serif`, deco: "clouds" },
  confession: { bg: ["#0b0818", "#3a1357"], ink: "#ffe9f5", sub: "#f5a9d6", font: (s) => `italic 600 ${s}px Georgia, "Times New Roman", serif`, deco: "glow" },
  truth: { bg: ["#0f766e", "#1e293b"], ink: "#ffffff", sub: "#99f6e4", font: (s) => `800 ${s}px system-ui, sans-serif`, deco: "rings" },
  rating: { bg: ["#f59e0b", "#b45309"], ink: "#ffffff", sub: "#fff3c4", font: (s) => `800 ${s}px system-ui, sans-serif`, deco: "stars" },
};
async function bolleCardFile(message, tone, colorIndex) {
  const canvas = document.createElement("canvas"); canvas.width = 900; canvas.height = 900;
  const ctx = canvas.getContext("2d");
  const theme = BOLLE_CARD_THEMES[tone] || { bg: [BOLLE_CARD_COLORS[colorIndex % BOLLE_CARD_COLORS.length], "#101427"], ink: "#ffffff", sub: "#e7d9ff", font: (s) => `bold ${s}px system-ui, sans-serif`, deco: "rings" };
  const gradient = ctx.createLinearGradient(0, 0, 900, 900);
  gradient.addColorStop(0, theme.bg[0]); gradient.addColorStop(1, theme.bg[1]);
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 900, 900);
  if (theme.deco === "rings") {
    ctx.globalAlpha = .14; ctx.strokeStyle = "white"; ctx.lineWidth = 7;
    for (const [x, y, r] of [[130, 140, 125], [750, 180, 180], [730, 760, 140], [130, 760, 190]]) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke(); }
  } else if (theme.deco === "clouds") {
    ctx.globalAlpha = .6; ctx.fillStyle = "#ffffff";
    for (const [x, y, r] of [[140, 150, 70], [215, 130, 90], [290, 160, 62], [700, 760, 80], [780, 740, 62], [630, 780, 56]]) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
  } else if (theme.deco === "glow") {
    const glow = ctx.createRadialGradient(450, 450, 40, 450, 450, 520);
    glow.addColorStop(0, "rgba(255,120,200,.28)"); glow.addColorStop(1, "rgba(255,120,200,0)");
    ctx.globalAlpha = 1; ctx.fillStyle = glow; ctx.fillRect(0, 0, 900, 900);
  } else if (theme.deco === "stars") {
    ctx.globalAlpha = .28; ctx.fillStyle = "#ffffff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    for (const [x, y, s] of [[110, 120, 70], [790, 140, 54], [150, 770, 56], [770, 750, 80], [450, 70, 40]]) { ctx.font = `${s}px system-ui, sans-serif`; ctx.fillText("✦", x, y); }
  }
  ctx.globalAlpha = 1;
  const titles = { meme: "😂  MEME", thought: "💭  PENSIERO", question: "🎲  DOMANDA", confession: "💜  CONFESSIONE", choice: "⚡  QUESTO O QUELLO?", truth: "🕵️  2 VERITÀ E 1 BUGIA", rating: "⭐  DAI UN VOTO" };
  ctx.fillStyle = theme.sub; ctx.font = "bold 33px system-ui, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
  ctx.fillText(titles[tone] || "🫧 BOLLE", 450, 160);
  const body = theme.upper ? message.trim().toUpperCase() : message.trim();
  let size = 67; let lines = [];
  do {
    ctx.font = theme.font(size);
    lines = []; let line = "";
    for (const word of body.split(/\s+/)) {
      const test = line ? line + " " + word : word;
      if (ctx.measureText(test).width > 740 && line) { lines.push(line); line = word; } else line = test;
    }
    if (line) lines.push(line);
    if (lines.length * size * 1.3 <= 520 && lines.every(l => ctx.measureText(l).width <= 790)) break;
    size -= 3;
  } while (size > 25);
  ctx.textBaseline = "middle"; ctx.fillStyle = theme.ink;
  const lineHeight = size * 1.3; const y0 = 450 - (lines.length - 1) * lineHeight / 2;
  if (theme.stroke) { ctx.strokeStyle = theme.stroke; ctx.lineWidth = Math.max(4, size / 7); ctx.lineJoin = "round"; lines.forEach((line, i) => ctx.strokeText(line, 450, y0 + i * lineHeight)); }
  lines.forEach((line, i) => ctx.fillText(line, 450, y0 + i * lineHeight));
  ctx.font = "bold 28px system-ui, sans-serif"; ctx.fillStyle = theme.sub; ctx.fillText("BOLLE  🫧", 450, 790);
  const blob = await new Promise((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error("Impossibile creare la bolla.")), "image/png"));
  return new File([blob], `bolle-${tone}-${Date.now()}.png`, { type: "image/png" });
}
/* Meme con la tua foto: testo bianco bordato sopra e sotto, come i meme classici. */
async function bolleMemeFile(imageFile, top, bottom) {
  let bitmap;
  try { bitmap = await createImageBitmap(imageFile, { imageOrientation: "from-image" }); }
  catch { bitmap = await new Promise((resolve, reject) => { const url = URL.createObjectURL(imageFile); const img = new Image(); img.onload = () => { URL.revokeObjectURL(url); resolve(img); }; img.onerror = reject; img.src = url; }); }
  const w0 = bitmap.width || bitmap.naturalWidth, h0 = bitmap.height || bitmap.naturalHeight;
  const scale = Math.min(1, 1200 / Math.max(w0, h0));
  const W = Math.round(w0 * scale), H = Math.round(h0 * scale);
  const canvas = document.createElement("canvas"); canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, W, H); bitmap.close?.();
  const drawBlock = (text, atTop) => {
    const t = String(text || "").trim().toUpperCase(); if (!t) return;
    let size = Math.round(W / 9), lines = [];
    do {
      ctx.font = `900 ${size}px Impact, "Arial Black", system-ui, sans-serif`;
      lines = []; let line = "";
      for (const word of t.split(/\s+/)) { const test = line ? line + " " + word : word; if (ctx.measureText(test).width > W * 0.92 && line) { lines.push(line); line = word; } else line = test; }
      if (line) lines.push(line);
      if (lines.length <= 3 && lines.every(l => ctx.measureText(l).width <= W * 0.95)) break;
      size -= 3;
    } while (size > 16);
    ctx.textAlign = "center"; ctx.textBaseline = "top"; ctx.lineJoin = "round"; ctx.lineWidth = Math.max(4, size / 7);
    ctx.strokeStyle = "#000"; ctx.fillStyle = "#fff";
    const lh = size * 1.12, pad = size * 0.35;
    lines.forEach((line, i) => {
      const y = atTop ? pad + i * lh : H - pad - (lines.length - i) * lh;
      ctx.strokeText(line, W / 2, y); ctx.fillText(line, W / 2, y);
    });
  };
  drawBlock(top, true); drawBlock(bottom, false);
  const blob = await new Promise((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error("Impossibile creare il meme.")), "image/jpeg", 0.86));
  return new File([blob], `meme-${Date.now()}.jpg`, { type: "image/jpeg" });
}

/* «Questo o quello?» con testo: tessera chiara divisa in due semicerchi, come due sezioni di bolla di colori diversi (A a sinistra, B a destra). */
async function bolleChoiceFile(labelA, labelB) {
  const S = 900, canvas = document.createElement("canvas"); canvas.width = S; canvas.height = S;
  const ctx = canvas.getContext("2d");
  const bg = ctx.createLinearGradient(0, 0, S, S); bg.addColorStop(0, "#f6f1ff"); bg.addColorStop(1, "#e9f6ff");
  ctx.fillStyle = bg; ctx.fillRect(0, 0, S, S);
  const cx = 450, cy = 450, R = 390, gap = 8;
  const half = (left, c1, c2, label, tag) => {
    ctx.save(); ctx.beginPath();
    if (left) { ctx.arc(cx - gap, cy, R, Math.PI / 2, Math.PI * 1.5); } else { ctx.arc(cx + gap, cy, R, -Math.PI / 2, Math.PI / 2); }
    ctx.closePath(); ctx.clip();
    const hx = left ? cx - R * .45 : cx + R * .45;
    const g = ctx.createRadialGradient(hx, cy - R * .35, 20, cx, cy, R * 1.05);
    g.addColorStop(0, "#ffffff"); g.addColorStop(.28, c1); g.addColorStop(1, c2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
    const rim = ctx.createRadialGradient(cx, cy, R * .72, cx, cy, R);
    rim.addColorStop(0, "rgba(255,255,255,0)"); rim.addColorStop(1, "rgba(255,255,255,.55)");
    ctx.fillStyle = rim; ctx.fillRect(0, 0, S, S);
    ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.beginPath();
    ctx.ellipse(left ? cx - R * .55 : cx + R * .3, cy - R * .62, R * .2, R * .075, left ? -.5 : .5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    const mx = left ? cx - R * .5 : cx + R * .5, maxW = R * .7;
    const t = String(label || "").trim(); let size = 62, lines = [];
    do {
      ctx.font = `800 ${size}px system-ui, sans-serif`; lines = []; let line = "";
      for (const w of t.split(/\s+/)) { const test = line ? line + " " + w : w; if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test; }
      if (line) lines.push(line);
      if (lines.length <= 4 && lines.every(l => ctx.measureText(l).width <= maxW)) break;
      size -= 3;
    } while (size > 24);
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(40,20,90,.55)"; ctx.shadowBlur = 8; ctx.fillStyle = "#fff";
    const lh = size * 1.2, y0 = cy - (lines.length - 1) * lh / 2;
    lines.forEach((l, i) => ctx.fillText(l, mx, y0 + i * lh));
    ctx.shadowBlur = 0; ctx.font = "800 30px system-ui, sans-serif"; ctx.fillStyle = "rgba(255,255,255,.85)";
    ctx.fillText(tag, mx, cy - R * .78 + 40);
  };
  half(true, "#ff9ac8", "#7a5cff", labelA, "A");
  half(false, "#7df0d0", "#2f9bff", labelB, "B");
  ctx.fillStyle = "rgba(60,40,120,.55)"; ctx.font = "700 28px system-ui, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
  ctx.fillText("QUESTO O QUELLO?  🫧", 450, 870);
  const blob = await new Promise((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error("Impossibile creare il sondaggio.")), "image/png"));
  return new File([blob], `choice-${Date.now()}.png`, { type: "image/png" });
}
/* Sondaggio tra due foto: A a sinistra, B a destra (lo swipe ← vota A, → vota B). */
async function bolleDuoPhotoFile(fileA, fileB, labelA, labelB) {
  const load = async (f) => {
    try { return await createImageBitmap(f, { imageOrientation: "from-image" }); }
    catch { return await new Promise((resolve, reject) => { const url = URL.createObjectURL(f); const img = new Image(); img.onload = () => { URL.revokeObjectURL(url); resolve(img); }; img.onerror = reject; img.src = url; }); }
  };
  const [ia, ib] = await Promise.all([load(fileA), load(fileB)]);
  const W = 1200, H = 900, gap = 6, half = (W - gap) / 2;
  const canvas = document.createElement("canvas"); canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H);
  const cover = (img, x) => {
    const iw = img.width || img.naturalWidth, ih = img.height || img.naturalHeight;
    const s = Math.max(half / iw, H / ih), dw = iw * s, dh = ih * s;
    ctx.save(); ctx.beginPath(); ctx.rect(x, 0, half, H); ctx.clip();
    ctx.drawImage(img, x + (half - dw) / 2, (H - dh) / 2, dw, dh); ctx.restore();
  };
  cover(ia, 0); cover(ib, half + gap);
  ia.close?.(); ib.close?.();
  const badge = (txt, cx) => {
    ctx.beginPath(); ctx.arc(cx, 70, 44, 0, Math.PI * 2); ctx.fillStyle = "rgba(20,16,40,.78)"; ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = "#fff"; ctx.stroke();
    ctx.fillStyle = "#fff"; ctx.font = "800 48px system-ui, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(txt, cx, 72);
  };
  badge("A", 70); badge("B", half + gap + 70);
  const label = (txt, x) => {
    const t = String(txt || "").trim(); if (!t) return;
    ctx.fillStyle = "rgba(10,8,25,.66)"; ctx.fillRect(x, H - 110, half, 110);
    let size = 40; ctx.font = `700 ${size}px system-ui, sans-serif`;
    while (ctx.measureText(t).width > half - 50 && size > 22) { size -= 2; ctx.font = `700 ${size}px system-ui, sans-serif`; }
    let out = t; while (ctx.measureText(out).width > half - 50 && out.length > 3) out = out.slice(0, -2);
    if (out !== t) out = out.trimEnd() + "…";
    ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(out, x + half / 2, H - 55);
  };
  label(labelA, 0); label(labelB, half + gap);
  const blob = await new Promise((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error("Impossibile creare il sondaggio.")), "image/jpeg", 0.86));
  return new File([blob], `duo-${Date.now()}.jpg`, { type: "image/jpeg" });
}
/* Modalità eco: meno animazioni decorative e fisica più lenta. Si attiva da sola dopo qualche minuto d'uso. */
function ecoForced() { try { return localStorage.getItem("bolle-eco") === "on"; } catch { return false; } }
function applyEco(on) { document.documentElement.classList.toggle("bl-eco", on); }

// Paese derivato dalla nazionalità dichiarata nel profilo, senza geolocalizzazione.
function bolleCountryFromNationality(value) {
  const normalize = (v) => String(v || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  const input = normalize(value);
  if (!input) return "";
  const aliases = {
    IT: ["italia", "italiana", "italiano", "italian", "italy"],
    FR: ["francia", "francese", "francese", "french", "france"],
    DE: ["germania", "tedesca", "tedesco", "german", "germany"],
    ES: ["spagna", "spagnola", "spagnolo", "spanish", "spain"],
    GB: ["regno unito", "britannica", "britannico", "inglese", "british", "english", "united kingdom"],
    US: ["stati uniti", "americana", "americano", "american", "united states", "usa"],
    CH: ["svizzera", "svizzero", "svizzera", "swiss", "switzerland"],
    PT: ["portogallo", "portoghese", "portuguese", "portugal"],
    RO: ["romania", "rumena", "rumeno", "romena", "romeno", "romanian"],
    AL: ["albania", "albanese", "albanian"],
    MA: ["marocco", "marocchina", "marocchino", "moroccan", "morocco"],
    TN: ["tunisia", "tunisina", "tunisino", "tunisian"],
    EG: ["egitto", "egiziana", "egiziano", "egyptian"],
    BR: ["brasile", "brasiliana", "brasiliano", "brazilian", "brazil"],
    AR: ["argentina", "argentino", "argentina", "argentinian"],
    IN: ["india", "indiana", "indiano", "indian"],
    CN: ["cina", "cinese", "chinese", "china"],
    JP: ["giappone", "giapponese", "japanese", "japan"],
    UA: ["ucraina", "ucraino", "ucraina", "ukrainian", "ukraine"],
    PL: ["polonia", "polacca", "polacco", "polish", "poland"],
    GR: ["grecia", "greca", "greco", "greek", "greece"],
    TR: ["turchia", "turca", "turco", "turkish", "turkey"],
    NL: ["paesi bassi", "olanda", "olandese", "dutch", "netherlands"],
    BE: ["belgio", "belga", "belgian", "belgium"],
    AT: ["austria", "austriaca", "austriaco", "austrian"],
    HR: ["croazia", "croata", "croato", "croatian"],
    RS: ["serbia", "serba", "serbo", "serbian"],
    RU: ["russia", "russa", "russo", "russian"],
  };
  const found = BOLLE_COUNTRIES.find((c) => normalize(c.name) === input || normalize(c.code) === input);
  if (found) return found.code;
  const fromFullList = countryList().find((c) => normalize(c.name) === input);
  if (fromFullList) return fromFullList.code;
  return Object.entries(aliases).find(([, values]) => values.includes(input))?.[0] || "";
}

/* Riduce le foto prima del caricamento: un'immagine da 4-8 MB diventa ~300 KB e si apre molto più in fretta. */
async function downscaleImage(file, maxSide = 1600, quality = 0.82) {
  try {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size < 350 * 1024) return file;
    let bitmap;
    try { bitmap = await createImageBitmap(file, { imageOrientation: "from-image" }); }
    catch {
      bitmap = await new Promise((resolve, reject) => { const url = URL.createObjectURL(file); const img = new Image(); img.onload = () => { URL.revokeObjectURL(url); resolve(img); }; img.onerror = reject; img.src = url; });
    }
    const w = bitmap.width || bitmap.naturalWidth, h = bitmap.height || bitmap.naturalHeight;
    const scale = Math.min(1, maxSide / Math.max(w, h));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(w * scale); canvas.height = Math.round(h * scale);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch { return file; }
}

function Composer({ uid, bonus, onClose, onDone, daily, chainRootId = null, initial = null }) {
  const [step, setStep] = useState(initial?.mode ? "edit" : "home"); // home: scegli cosa pubblicare · edit: crea e pubblica
  const [captionPos, setCaptionPos] = useState("bot"); // (vecchio testo singolo: resta solo per le bolle già pubblicate)
  const [overlays, setOverlays] = useState([]); // testi liberi sopra foto/video: posizione, zoom, rotazione
  const [ovSel, setOvSel] = useState(null);
  const [edit, setEdit] = useState(defaultEdit); // filtro, regolazioni, ritaglio (foto) · filtro, taglio, muto (video)
  const [stickers, setStickers] = useState([]); // sticker sopra la foto: cotti nel JPEG alla pubblicazione
  const [stickerSel, setStickerSel] = useState(null);
  const [tags, setTags] = useState([]);const [tagSuggestions, setTagSuggestions] = useState([]);
  useEffect(() => {
    let alive = true;
    (async () => {
      const score = new Map();
      const bump = (u, w) => { const k = String(u || "").trim().replace(/^@/, "").toLowerCase(); if (k) score.set(k, (score.get(k) || 0) + w); };
      try { // chat: più recente = più in alto, i non letti pesano di più
        const { data } = await supabase.rpc("bolle_chat_conversations");
        (Array.isArray(data) ? data : []).forEach((r, i) => bump(r.username, 5 + Math.max(0, 6 - i) + Math.min(5, Number(r.unread) || 0)));
      } catch { /* nessun suggerimento dalle chat */ }
      try { // autori preferiti
        const { data } = await supabase.rpc("bolle_my_favorite_authors");
        (Array.isArray(data) ? data : []).forEach((r) => bump(r.username, 4));
      } catch { /* nessun suggerimento dai preferiti */ }
      if (alive) setTagSuggestions([...score].sort((a, b) => b[1] - a[1]).map(([username, s]) => ({ username, score: s })));
    })();
    return () => { alive = false; };
  }, []); 
  // utenti taggati (max 3)
  const [file, setFile] = useState(initial?.file || null);
  const [startChain, setStartChain] = useState(false);
  const [mode, setMode] = useState(initial?.mode || "photo");
  const [text, setText] = useState("");
  const [caption, setCaption] = useState("");
  const [giphySelection, setGiphySelection] = useState(null);
  const [klipySelection, setKlipySelection] = useState(null);
  const [pollA, setPollA] = useState("");
  const [pollB, setPollB] = useState("");
  const [countryCode, setCountryCode] = useState("");
  useEffect(() => {
    let active = true;
    supabase.rpc("bolle_my_personal_data").then(({data,error}) => {
      if (active && !error) setCountryCode(bolleCountryFromNationality(data?.nationality));
    }).catch(() => {});
    return () => { active = false; };
  }, []);
  const [markSecret, setMarkSecret] = useState(false);
  const [secretRadius, setSecretRadius] = useState(500);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);
  const [capsuleMinutes, setCapsuleMinutes] = useState(0); // 0 = pubblica subito
  const [memeBottom, setMemeBottom] = useState("");
  const [truthTexts, setTruthTexts] = useState(["", "", ""]);
  const [lieIdx, setLieIdx] = useState(0);
  const [duoMode, setDuoMode] = useState(false); // sondaggio tra due foto
  const [duoA, setDuoA] = useState(null);
  const [duoB, setDuoB] = useState(null);
  const duoAUrl = useMemo(() => (duoA ? URL.createObjectURL(duoA) : null), [duoA]);
  const duoBUrl = useMemo(() => (duoB ? URL.createObjectURL(duoB) : null), [duoB]);
  useEffect(() => () => duoAUrl && URL.revokeObjectURL(duoAUrl), [duoAUrl]);
  useEffect(() => () => duoBUrl && URL.revokeObjectURL(duoBUrl), [duoBUrl]);
  const [dailyUsed, setDailyUsed] = useState(false);
  function pickDuo(e, setter) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!/^image\//.test(f.type)) return setError("Puoi scegliere soltanto foto.");
    if (f.size > MAX_UPLOAD_MB * 1024 * 1024) return setError(`Il file supera ${MAX_UPLOAD_MB} MB.`);
    setError(""); setter(f);
  }
  const [qFile, setQFile] = useState(null); // immagine facoltativa (domanda, meme, voto)
  const qPreview = useMemo(() => (qFile ? URL.createObjectURL(qFile) : null), [qFile]);
  useEffect(() => () => qPreview && URL.revokeObjectURL(qPreview), [qPreview]);
  function pickQuestionImage(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!/^image\//.test(f.type)) return setError("Puoi aggiungere soltanto una foto.");
    if (f.size > MAX_UPLOAD_MB * 1024 * 1024) return setError(`Il file supera ${MAX_UPLOAD_MB} MB.`);
    setError(""); setQFile(f);
  }
  function pick(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!/^(image|video)\//.test(f.type)) return setError("Scegli una foto o un video.");
    if (f.size > MAX_UPLOAD_MB * 1024 * 1024) return setError(`Il file supera ${MAX_UPLOAD_MB} MB.`);
    setError(""); setFile(f); setEdit(defaultEdit()); setStickers([]); setStickerSel(null);
  }
  function resetFields(nextMode) {
    setMode(nextMode); setError(""); setText(""); setQFile(null); setMemeBottom(""); setDuoMode(false); setDuoA(null); setDuoB(null);
    setDailyUsed(false); setKlipySelection(null); setGiphySelection(null); setFile(null); setEdit(defaultEdit()); setStickers([]); setStickerSel(null); setCaption(""); setCaptionPos("bot"); setPollA(""); setPollB("");
  }
  const chooseMode = (id) => { resetFields(id); setStep("edit"); };
  const backToHome = () => { if (sending) return; resetFields("photo"); setStep("home"); };
  // Scelta del file dalla schermata iniziale: se è valido si passa subito alla modifica.
  function pickMain(e) {
    const f = e.target.files?.[0];
    pick(e);
    if (f && /^(image|video)\//.test(f.type) && f.size <= MAX_UPLOAD_MB * 1024 * 1024) { setMode("photo"); setStep("edit"); }
    e.target.value = "";
  }
  const rollbackBubble = async (id) => { try { await supabase.rpc("bolle_delete_my_bubble", { p_bubble_id: id }); } catch { /* resta comunque il messaggio di errore */ } };
  const detail = (e) => { const t = errorText(e); return t === "Qualcosa non ha funzionato. Riprova." ? `${t} [${String(e?.message || e).slice(0, 160)}]` : t; };
  async function submit() {
    if (sending || (mode === "photo" && !file) || (!["photo", "gif", "choice", "truth"].includes(mode) && !text.trim())) return;
    if (mode === "gif" && !klipySelection?.url && !giphySelection?.images?.original?.url) {setError("Seleziona una GIF o Meme prima di pubblicare.");return;}
    if (mode === "choice" && duoMode && (!duoA || !duoB)) {setError("Carica sia la foto A sia la foto B.");return;}
    if (mode === "choice" && !duoMode && (!pollA.trim() || !pollB.trim() || pollA.trim().toLowerCase() === pollB.trim().toLowerCase())) {setError("Scrivi due alternative diverse.");return;}
    if (mode === "truth") {
      const cleaned = truthTexts.map(t => t.trim());
      if (cleaned.some(t => !t) || new Set(cleaned.map(t => t.toLowerCase())).size < 3) { setError("Scrivi tre frasi diverse."); return; }
    }
    setSending(true); setError("");
    let place = null;
    try { place = await getPosition(); }
    catch (err) { setSending(false); setError(positionErrorText(err)); return; } // ogni bolla registra il luogo effettivo di pubblicazione
    let uploadFile = file;
    try {
      if (mode === "gif") {
        const gifUrl = klipySelection?.url || giphySelection?.images?.original?.url;
        if (!gifUrl) throw new Error("Seleziona una GIF.");
        const response = await fetch(gifUrl);
        if (!response.ok) throw new Error("GIF non scaricabile. Scegli un'altra GIF.");
        const blob = await response.blob();
        if (blob.size > MAX_UPLOAD_MB * 1024 * 1024) throw new Error(`GIF troppo grande (max ${MAX_UPLOAD_MB} MB).`);
        const gifExt = { "image/gif": "gif", "image/webp": "webp", "image/png": "png", "image/jpeg": "jpg" }[blob.type] || "gif";
        uploadFile = new File([blob], `reaction-${crypto.randomUUID()}.${gifExt}`, {type: blob.type || "image/gif"});
      } else if ((mode === "question" || mode === "rating") && qFile) { uploadFile = qFile; } else if (mode === "meme" && qFile) { uploadFile = await bolleMemeFile(qFile, text, memeBottom); } else if (mode === "choice" && duoMode) { uploadFile = await bolleDuoPhotoFile(duoA, duoB, pollA.trim(), pollB.trim()); } else if (mode === "truth") { uploadFile = await bolleCardFile("Qual è la bugia?", "truth", 0); } else if (mode === "choice") uploadFile = await bolleChoiceFile(pollA.trim(), pollB.trim()); else if (mode !== "photo") uploadFile = await bolleCardFile(mode === "choice" ? `${pollA.trim()}  OPPURE  ${pollB.trim()}?` : text, mode, 0);
      if (mode === "photo" && isEditableImage(uploadFile) && hasPhotoEdits(edit, stickers)) {
        try { uploadFile = await bakeImage(uploadFile, edit, stickers); } // ritaglio + filtro + sticker nel JPEG finale
        catch (bakeErr) { setSending(false); setError("Non riesco ad applicare le modifiche alla foto. Riprova o togli qualche modifica. [" + String(bakeErr?.message || bakeErr).slice(0, 80) + "]"); return; }
      } else if ((mode === "photo" || mode === "question" || mode === "rating") && uploadFile?.type?.startsWith("image/")) uploadFile = await downscaleImage(uploadFile);
    } catch (err) {setSending(false);setError(errorText(err));return;}
    const ext = (uploadFile.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = `${uid}/${crypto.randomUUID()}.${ext}`;
    const up = await supabase.storage.from(BUCKET).upload(path, uploadFile, { contentType: uploadFile.type, upsert: false });
    if (up.error) { setSending(false); return setError(errorText(up.error)); }
    const { data: createdBubbleId, error: rpcError } = await supabase.rpc("create_bubble", {
      p_media_path: path, p_media_type: uploadFile.type.startsWith("video/") ? "video" : "image",
      p_caption: "", p_lat: place?.lat ?? null, p_lng: place?.lng ?? null,
    });
    if (rpcError) {
      await supabase.storage.from(BUCKET).remove([path]);
      setSending(false);
      return setError(errorText(rpcError));
    }


    // Testo in sovrimpressione, anteprima sfocata e tag: dopo la creazione della bolla.
    if (mode === "photo" && overlays.some(o => o.text.trim())) {
      const clean = overlays.filter(o => o.text.trim()).map(o => ({ ...o, text: o.text.trim() }));
      const { error: ovError } = await supabase.rpc("bolle_set_text_overlays", { p_bubble_id: createdBubbleId, p_overlays: clean });
      if (ovError) { await rollbackBubble(createdBubbleId); setSending(false); setError("Bolla non pubblicata: il testo non è stato salvato. Applica prima bolle_feed_redesign.sql. " + detail(ovError)); return; }
    }
    if (mode === "photo" && uploadFile.type.startsWith("video/")) {
      const mediaEdit = videoEditPayload(edit);
      if (mediaEdit) {
        const { error: meError } = await supabase.rpc("bolle_set_media_edit", { p_bubble_id: createdBubbleId, p_edit: mediaEdit });
        if (meError) { await rollbackBubble(createdBubbleId); setSending(false); setError("Bolla non pubblicata: le modifiche al video non sono state salvate. Applica prima bolle_media_edit.sql. " + detail(meError)); return; }
      }
    }
    if (["photo", "meme", "gif"].includes(mode) && uploadFile) {
      blurFromFile(uploadFile).then(uri => uri ? seqApi.setPreview(createdBubbleId, uri) : null).then(r => { if (r?.error) console.warn("Anteprima sfocata non salvata:", r.error.message); }).catch(e => console.warn("Anteprima sfocata non salvata:", e)); // mai bloccante
    }
    if (tags.length) {
      try {
        const { data: tagRes, error: tagError } = await supabase.rpc("bolle_set_bubble_tags", { p_bubble_id: createdBubbleId, p_usernames: tags });
        if (tagError) console.warn("Tag non salvati:", tagError.message);
        else if (tagRes?.skipped?.length) window.dispatchEvent(new CustomEvent("bolle:tag-skipped", { detail: tagRes.skipped }));
      } catch (tagErr) { console.warn("Tag non salvati:", tagErr); }
    }
    // Capsula del tempo: subito dopo la pubblicazione, per ridurre al minimo il tempo in cui la bolla è visibile.
    if (capsuleMinutes > 0) {
      const { error: capsuleError } = await supabase.rpc("bolle_set_bubble_opens_at", { p_bubble_id: createdBubbleId, p_delay_minutes: capsuleMinutes });
      if (capsuleError) { await rollbackBubble(createdBubbleId); setSending(false); setError("Bolla non pubblicata: la capsula del tempo non si è attivata. " + detail(capsuleError)); return; }
    }
    const savedKind = { photo: uploadFile.type.startsWith("video/") ? "video" : "photo", meme: "meme", gif: "gif", thought: "thought", question: "question", confession: "confession", choice: "poll", truth: "truth", rating: "rating" }[mode] || "photo";
    // Categoria del profilo (bar, dj, ristorante…): non deve mai bloccare la pubblicazione.
    // Nota: il builder di Supabase non ha .catch(), quindi si usa await dentro try/catch.
    try {
      let myCat = "";
      try { myCat = localStorage.getItem("bolle-my-category") || ""; } catch { /* storage non disponibile */ }
      if (myCat && myCat !== "utente" && USER_CATEGORIES.some(c => c.id === myCat)) {
        const { error: catError } = await supabase.rpc("bolle_set_bubble_category", { p_bubble_id: createdBubbleId, p_category: myCat });
        if (catError) console.warn("Categoria della bolla non salvata:", catError.message);
      }
    } catch (catErr) { console.warn("Categoria della bolla non salvata:", catErr); }

    if (mode === "question") {
      const {error:questionError}=await supabase.rpc("bolle_create_question",{p_bubble_id:createdBubbleId,p_question:text.trim()});
      if(questionError){await rollbackBubble(createdBubbleId);setSending(false);setError("Bolla non pubblicata: le risposte non si sono attivate. "+detail(questionError));return;}
    }
    if (mode === "choice") {
      const {error:pollError} = await supabase.rpc("bolle_create_poll", {p_bubble_id:createdBubbleId,p_option_a:pollA.trim()||"Foto A",p_option_b:pollB.trim()||"Foto B"});
      if (pollError) { await rollbackBubble(createdBubbleId);setSending(false);setError("Bolla non pubblicata: il sondaggio non si è attivato. " + detail(pollError));return; }
    }
    if (mode === "truth") {
      const [s1, s2, s3] = truthTexts.map(t => t.trim());
      const { error: truthError } = await supabase.rpc("bolle_create_truth", { p_bubble_id: createdBubbleId, p_s1: s1, p_s2: s2, p_s3: s3, p_lie_index: lieIdx + 1 });
      if (truthError) { await rollbackBubble(createdBubbleId); setSending(false); setError("Bolla non pubblicata: il gioco non si è attivato. " + detail(truthError)); return; }
    }
    if (mode === "rating") {
      const { error: ratingError } = await supabase.rpc("bolle_create_rating", { p_bubble_id: createdBubbleId, p_prompt: text.trim() });
      if (ratingError) { await rollbackBubble(createdBubbleId); setSending(false); setError("Bolla non pubblicata: il voto non si è attivato. " + detail(ratingError)); return; }
    }
    // Tipo della bolla (colonna bubbles.kind): scritto per ultimo, riprovato e verificato.
    // Senza il tipo corretto una bolla "2 verità e 1 bugia" apparirebbe come una foto: quindi un errore qui blocca la pubblicazione.
    {
      let kindError = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        const { error: kErr } = await supabase.rpc("bolle_set_bubble_kind", { p_bubble_id: createdBubbleId, p_kind: savedKind });
        kindError = kErr || null;
        if (!kindError) break;
      }
      if (!kindError && savedKind !== "photo") {
        // Verifica: il server deve restituire esattamente il tipo appena salvato.
        const check = await fetchBubbleKinds([createdBubbleId]);
        if (check[createdBubbleId] && check[createdBubbleId] !== savedKind) kindError = new Error(`il server ha salvato «${check[createdBubbleId]}» invece di «${savedKind}»`);
      }
      if (kindError) {
        console.warn("Tipo di bolla non salvato:", kindError.message);
        if (savedKind !== "photo" && savedKind !== "video") {
          await rollbackBubble(createdBubbleId); setSending(false);
          setError("Bolla non pubblicata: la categoria non è stata salvata correttamente. " + detail(kindError));
          return;
        }
      }
    }
    // Crea una nuova catena oppure collega questa bolla alla catena esistente.
    if (startChain || chainRootId) {
      const chainResult = startChain
        ? await supabase.rpc("bolle_chain_create_root", { p_bubble_id: createdBubbleId })
        : await supabase.rpc("bolle_chain_join", { p_root_bubble_id: chainRootId, p_bubble_id: createdBubbleId });
      if (chainResult.error) {
        await rollbackBubble(createdBubbleId); setSending(false);
        setError("La bolla non è stata pubblicata perché la catena non è stata salvata. Applica prima la migrazione SQL bolle_chains. " + detail(chainResult.error));
        return;
      }
    }
    if (countryCode) {
      const {error:countryError} = await supabase.rpc("bolle_set_latest_country", {p_country_code:countryCode});
      if (countryError) console.warn("Bandierina non salvata:",countryError.message);
    }
    if (markSecret && place) {
      const {error:secretError}=await supabase.rpc("bolle_mark_latest_secret",{p_lat:place.lat,p_lng:place.lng,p_radius_m:secretRadius});
      if(secretError) console.warn("Bolla segreta non registrata:",secretError.message);
    }
    onDone(); // il bonus è già stato assegnato dal server insieme alla pubblicazione
  }
  const modeInfo = BOLLE_CREATION_MODES.find(([id]) => id === mode) || BOLLE_CREATION_MODES[0];
  const cannotPublish = sending || (mode === "photo" ? !file : mode === "gif" ? (!klipySelection && !giphySelection) : mode === "choice" ? (duoMode ? !duoA || !duoB : !pollA.trim() || !pollB.trim()) : mode === "truth" ? truthTexts.some(t => !t.trim()) : !text.trim());
  const fullEdit = mode === "photo" && Boolean(file); // foto/video in modifica: schermo intero
  const optionsBlock = (
      <details className="bl-cmp-options">
        <summary>Altre opzioni</summary>
        {!chainRootId && <label className="bl-check bl-chain-toggle"><input type="checkbox" checked={startChain} onChange={e => setStartChain(e.target.checked)} /><span><strong>🫧 Bolla a catena</strong><small>Chi la scopre potrà aggiungere il proprio contributo.</small></span></label>}
        <label className="bl-field-label bl-capsule">⏳ Capsula del tempo<select value={capsuleMinutes} onChange={e => setCapsuleMinutes(Number(e.target.value))} aria-label="Quando si apre la bolla"><option value={0}>Subito</option><option value={10}>Si apre tra 10 minuti</option><option value={30}>Si apre tra 30 minuti</option><option value={60}>Si apre tra 1 ora</option><option value={360}>Si apre tra 6 ore</option><option value={1440}>Si apre tra 24 ore</option><option value={2880}>Si apre tra 48 ore</option></select><small>Il contenuto resta nascosto, con il conto alla rovescia, finché non scade.</small></label>
      </details>
  );
  const publishBtn = <button type="button" className="bl-cmp-publish" onClick={submit} disabled={cannotPublish}>{sending ? "Pubblico…" : "Pubblica"}</button>;
  const chainNotice = chainRootId && <div className="bl-chain-compose"><span>🫧</span><div><strong>Stai continuando una catena</strong><small>La tua bolla verrà collegata alla catena originale.</small></div></div>;
  return <Sheet className="bl-sheet-composer" label="Nuova bolla" title={step === "home" ? "Cosa vuoi pubblicare?" : `${modeInfo[1]} ${modeInfo[2]}`} onClose={() => !sending && onClose()} onBack={step === "edit" ? backToHome : undefined}>
    {step === "home" ? <div className="bl-cmp-home bl-cmp-field">
      {chainNotice}
      <p className="bl-cmp-lead">Tocca una bolla per prepararla prima di pubblicarla.</p>
      <div className="bl-cmp-grid" role="group" aria-label="Tipi di bolla">
        {CMP_BUBBLES.map(([id, icon, label, hint, c1, c2, size], i) => {
          const orb = <><span className="bl-cmpb-orb" aria-hidden="true"><span className="bl-cmpb-icon">{icon}</span></span><span className="bl-cmpb-label"><strong>{label}</strong><small>{hint}</small></span></>;
          const st = { "--c1": c1, "--c2": c2, "--sz": `${size}px`, "--dl": `${-(i * 0.9)}s`, "--dur": `${5 + (i % 4) * 0.7}s` };
          return id === "photo"
            ? <label key={id} className="bl-cmpb" style={st}>{orb}<input type="file" accept="image/*,video/*" onChange={pickMain} aria-label="Scegli una foto o un video" /></label>
            : <button key={id} type="button" className="bl-cmpb" style={st} onClick={() => chooseMode(id)}>{orb}</button>;
        })}
      </div>
      {error && <p className="bl-error" role="alert">{error}</p>}
    </div> : <div className="bl-cmp-edit" style={(() => { const c = CMP_BUBBLES.find(x => x[0] === mode); return c ? { "--c1": c[4], "--c2": c[5] } : undefined; })()}>
      {chainNotice}
      {fullEdit && <MediaEditor file={file} preview={preview} edit={edit} setEdit={setEdit} stickers={stickers} setStickers={setStickers} stickerSel={stickerSel} setStickerSel={setStickerSel} disabled={sending} onBackgroundDown={() => setOvSel(null)}
        onBack={backToHome} onClose={() => !sending && onClose()} error={error} footer={publishBtn}
        changePhoto={<label className="bl-me-top-btn bl-me-top-pill" aria-label="Cambia foto">🔄 Cambia<input type="file" accept="image/*,video/*" onChange={e => { pick(e); e.target.value = ""; }} /></label>}
        more={<>{chainNotice}<TagPicker tags={tags} onChange={setTags} disabled={sending} />{optionsBlock}</>}
        renderStage={() => <OverlayStage overlays={overlays} onChange={setOverlays} sel={ovSel} setSel={(v) => { setOvSel(v); if (v != null) setStickerSel(null); }} disabled={sending} hideEmptyHint passThrough />}
        renderRail={({ openStickers, stickersOpen, toolButtons }) => <OverlayRail overlays={overlays} onChange={setOverlays} sel={ovSel} setSel={setOvSel} disabled={sending} onStickers={openStickers} stickersOpen={stickersOpen}>{toolButtons}</OverlayRail>} />}
      {mode === "photo" && !file && <label className="bl-cmp-ghost bl-cmp-pickphoto">📸 Scegli una foto o un video<input type="file" accept="image/*,video/*" onChange={e => { pick(e); e.target.value = ""; }} /></label>}
      {mode === "gif" && <><p className="bl-muted">Cerca una GIF animata o un meme:</p><KlipyPicker selectedUrl={klipySelection?.url} onPick={(item) => { setKlipySelection(item); setGiphySelection(null); }} />{klipySelection && <div className="bl-giphy-selected"><img src={klipySelection.url} alt={klipySelection.title || "GIF selezionata"} /><button type="button" onClick={() => setKlipySelection(null)}>Rimuovi selezione</button></div>}</>}
      {mode === "truth" && <div className="bl-poll-compose bl-truth-compose"><p className="bl-muted">Scrivi 3 frasi su di te: due vere e una falsa. Tocca il cerchio della bugia: chi apre la bolla dovrà scovarla.</p>{[0, 1, 2].map(i => <label key={i} className="bl-truth-row"><input type="radio" name="bl-lie" checked={lieIdx === i} onChange={() => setLieIdx(i)} aria-label={`La frase ${i + 1} è la bugia`} /><input maxLength={120} value={truthTexts[i]} onChange={e => setTruthTexts(prev => prev.map((t, j) => j === i ? e.target.value : t))} placeholder={`Frase ${i + 1}`} /><span>{lieIdx === i ? "🤥 bugia" : "✅ vera"}</span></label>)}</div>}
      {mode === "choice" && <div className="bl-poll-compose bl-cmp-poll">
        {!duoMode && <>
          <label>Prima scelta<input maxLength={80} value={pollA} onChange={e => setPollA(e.target.value)} placeholder="🍕 Pizza" /></label>
          <label>Seconda scelta<input maxLength={80} value={pollB} onChange={e => setPollB(e.target.value)} placeholder="🍔 Hamburger" /></label>
        </>}
        <button type="button" className="bl-cmp-ghost bl-cmp-duo" onClick={() => { if (duoMode) { setDuoA(null); setDuoB(null); } setDuoMode(v => !v); }}>{duoMode ? "✍️ Torna alle scelte scritte" : "📸 Confronta due foto"}</button>
        {duoMode && <div className="bl-duo-pick">{[["A", duoAUrl, setDuoA], ["B", duoBUrl, setDuoB]].map(([k, url, setter]) => <div key={k} className="bl-duo-slot">
          {url ? <><img src={url} alt={`Anteprima foto ${k}`} /><button type="button" disabled={sending} onClick={() => setter(null)}>Cambia foto {k}</button></>
            : <label className="bl-duo-empty"><strong>Foto {k}</strong><small>Tocca per scegliere</small><input type="file" accept="image/*" onChange={e => pickDuo(e, setter)} /></label>}
        </div>)}</div>}
      </div>}
      {mode !== "photo" && mode !== "gif" && mode !== "choice" && mode !== "truth" && <>
        {mode === "question" && <button type="button" className="bl-daily-challenge" onClick={() => { setText(dailyPrompt()); setDailyUsed(true); requestAnimationFrame(() => { const el = document.getElementById("bl-question-text"); if (el) { el.focus({ preventScroll: true }); el.scrollIntoView({ block: "center", behavior: "smooth" }); } }); }}><strong>🌟 Domanda del giorno</strong><span>{dailyPrompt()}</span><small>{dailyUsed && text === dailyPrompt() ? "✅ Inserita: puoi modificarla" : "Tocca per usarla come domanda"}</small></button>}
        <label className="bl-field-label">{mode === "thought" ? "Il tuo pensiero" : mode === "question" ? "La tua domanda" : mode === "confession" ? "La tua confessione" : "Cosa vuoi far valutare?"}<textarea id="bl-question-text" className="bl-cmp-input" maxLength={240} rows={4} value={text} onChange={e => setText(e.target.value)} placeholder="Scrivi qui…" /></label>
        {BOLLE_PRESETS[mode] && <div className="bl-cmp-presets" role="group" aria-label="Suggerimenti">{BOLLE_PRESETS[mode].map((item, i) => <button type="button" key={i} className={text === item ? "on" : ""} onClick={() => setText(item)}>{item}</button>)}</div>}
        {(mode === "question" || mode === "meme" || mode === "rating") && <div className="bl-question-image">
          {qPreview ? <div className="bl-question-image-preview"><img src={qPreview} alt="Anteprima dell’immagine" /><button type="button" onClick={() => setQFile(null)} disabled={sending}>Rimuovi immagine</button></div>
            : <label className="bl-question-image-pick"><span aria-hidden="true">📷</span><strong>Aggiungi una foto (facoltativo)</strong><small>max {MAX_UPLOAD_MB} MB</small><input type="file" accept="image/*" onChange={pickQuestionImage} /></label>}
        </div>}
      </>}
      {!fullEdit && <>
        <TagPicker tags={tags} onChange={setTags} disabled={sending} />
        {error && <p className="bl-error" role="alert">{error}</p>}
        {optionsBlock}
        {publishBtn}
      </>}
    </div>}
  </Sheet>;
}
/* Componenti BolleExtras incorporati: file autonomo. */

/* BOLLE — moduli aggiuntivi: registrazione completa, privacy/GDPR, analytics, Portale Admin.
   Il client Supabase viene passato da App.jsx con initBolleExtras(supabase). */
let sb = null;
function initBolleExtras(client) { sb = client; }
initBolleExtras(supabase);

/* ====================== Analytics (nessun dato personale) ====================== */
function track(event, props = {}) {
  if (!sb) return;
  try { Promise.resolve(sb.rpc("bolle_log_event", { p_event: event, p_props: props })).catch(() => {}); } catch { /* mai bloccare l'app */ }
}
function trackError(where, err) {
  const msg = String(err?.message || err || "unknown").replace(/[^\s@]+@[^\s@]+/g, "[email]").slice(0, 80);
  track("error", { where, code: msg });
}
function trackPerf(metric, ms) { track("perf", { metric, ms: Math.max(0, Math.round(ms)) }); }
function installGlobalErrorTracking() {
  let sent = 0;
  // Errori innocui (es. ResizeObserver alla rotazione dello schermo, risorse non caricate, rete momentanea) non meritano una segnalazione.
  const isBenign = (e) => {
    const msg = String(e?.reason?.message || e?.reason || e?.message || "");
    if (/ResizeObserver/i.test(msg)) return true;
    if (e?.type === "error" && !e.error) return true; // "Script error." / errori senza eccezione reale
    if (!msg.trim()) return true;
    return /AbortError|Load failed|Failed to fetch|NetworkError|cancell?ed|aborted/i.test(msg);
  };
  const onErr = (e) => { if (isBenign(e)) return; if (sent < 5) { sent += 1; trackError("window", e.reason || e.message); window.dispatchEvent(new CustomEvent("bolle:reportable-error", { detail: { message: String(e.reason?.message || e.message || "Errore imprevisto") } })); } };
  window.addEventListener("error", onErr); window.addEventListener("unhandledrejection", onErr);
  return () => { window.removeEventListener("error", onErr); window.removeEventListener("unhandledrejection", onErr); };
}

/* ====================== Validazione e messaggi ====================== */
const PRIVACY_CONTROLLER = "[Inserisci qui nome o ragione sociale del titolare]"; // DA COMPILARE
const PRIVACY_EMAIL = "privacy@tuodominio.it";                                    // DA COMPILARE
const MIN_AGE = 14;
const SEX_OPTIONS = [["F", "Donna"], ["M", "Uomo"], ["X", "Altro"], ["N", "Preferisco non dirlo"]];

/* ====================== Selettori: nazionalità, città, data di nascita ====================== */
const COUNTRY_CODES = "AD AE AF AG AI AL AM AO AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GT GU GW GY HK HN HR HT HU ID IE IL IM IN IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG US UY UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW".split(" ");
let countryListCache = null;
function countryList() {
  if (countryListCache) return countryListCache;
  let names = null;
  try { names = new Intl.DisplayNames(["it"], { type: "region" }); } catch { names = null; }
  const list = names ? COUNTRY_CODES.map(code => ({ code, name: names.of(code) })).filter(c => c.name && c.name !== c.code).sort((a, b) => a.name.localeCompare(b.name, "it")) : BOLLE_COUNTRIES;
  countryListCache = list;
  return list;
}
const normalizeSearch = (v) => String(v || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const MONTHS_IT = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
function ageFromBirthDate(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || "")) return null;
  const [y, m, d] = iso.split("-").map(Number);
  const now = new Date();
  let age = now.getFullYear() - y;
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) age -= 1;
  return age;
}
function birthDateProblem(iso) {
  const age = ageFromBirthDate(iso);
  if (age === null) return "Seleziona la tua data di nascita.";
  if (age < MIN_AGE) return `Devi avere almeno ${MIN_AGE} anni.`;
  if (age > 120) return "Controlla la data di nascita.";
  return "";
}
function usePickerDismiss(open, setOpen, ref) {
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", esc); };
  }, [open, setOpen, ref]);
}
/* Menù a tendina scorrevole con barra di ricerca. */
function SearchableSelect({ label, value, onChange, options, placeholder = "Seleziona…", searchPlaceholder = "Cerca…", error }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const rootRef = useRef(null);
  usePickerDismiss(open, setOpen, rootRef);
  const filtered = options.filter(o => normalizeSearch(o.label).includes(normalizeSearch(q)));
  const known = options.some(o => o.value === value);
  return <div className="bl-field-label bl-picker" ref={rootRef}>{label}
    <button type="button" className="bl-picker-button" aria-haspopup="listbox" aria-expanded={open} onClick={() => { setOpen(o => !o); setQ(""); }}><span className={value ? "" : "placeholder"}>{value || placeholder}</span><i aria-hidden="true">▾</i></button>
    {open && <div className="bl-picker-panel">
      <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder={searchPlaceholder} aria-label={searchPlaceholder} autoComplete="off" />
      <ul role="listbox" aria-label={label}>
        {value && !known && <li><button type="button" role="option" aria-selected="true" className="on" onClick={() => setOpen(false)}>{value} (attuale)</button></li>}
        {filtered.map(o => <li key={o.value}><button type="button" role="option" aria-selected={o.value === value} className={o.value === value ? "on" : ""} onClick={() => { onChange(o.value); setOpen(false); }}>{o.label}</button></li>)}
        {!filtered.length && <li className="bl-picker-empty">Nessun risultato</li>}
      </ul>
    </div>}
    {error && <small className="bl-err" role="alert">{error}</small>}
  </div>;
}
function NationalityPicker({ value, onChange, error }) {
  const options = useMemo(() => countryList().map(c => ({ value: c.name, label: `${countryFlag(c.code) || ""} ${c.name}`.trim() })), []);
  return <SearchableSelect label="Nazionalità" value={value} onChange={onChange} options={options.map(o => ({ ...o, label: o.label }))} placeholder="Seleziona la nazionalità" searchPlaceholder="Cerca un paese…" error={error} />;
}
/* Città: suggerimenti dal servizio di geocodifica Open-Meteo (gratuito, senza chiave), da scegliere dall'elenco. */
function CityPicker({ value, onChange, error }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | error
  const rootRef = useRef(null);
  usePickerDismiss(open, setOpen, rootRef);
  useEffect(() => {
    if (!open) return undefined;
    const term = q.trim();
    if (term.length < 2) { setResults([]); setStatus("idle"); return undefined; }
    let alive = true;
    const ctrl = new AbortController();
    setStatus("loading");
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(term)}&count=20&language=it&format=json`, { signal: ctrl.signal });
        if (!res.ok) throw new Error("http");
        const json = await res.json();
        if (!alive) return;
        const seen = new Set();
        const list = (json.results || []).filter(r => !r.feature_code || r.feature_code.startsWith("PPL")).map(r => ({ value: r.name, label: [r.name, r.admin1, r.country].filter(Boolean).join(", ") })).filter(o => { if (seen.has(o.label)) return false; seen.add(o.label); return true; });
        setResults(list); setStatus("idle");
      } catch (err) { if (alive && err?.name !== "AbortError") setStatus("error"); }
    }, 300);
    return () => { alive = false; clearTimeout(timer); ctrl.abort(); };
  }, [q, open]);
  return <div className="bl-field-label bl-picker" ref={rootRef}>Città di residenza
    <button type="button" className="bl-picker-button" aria-haspopup="listbox" aria-expanded={open} onClick={() => { setOpen(o => !o); setQ(""); setResults([]); }}><span className={value ? "" : "placeholder"}>{value || "Cerca e seleziona la città"}</span><i aria-hidden="true">▾</i></button>
    {open && <div className="bl-picker-panel">
      <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Scrivi il nome della città…" aria-label="Cerca una città" autoComplete="off" />
      <ul role="listbox" aria-label="Città">
        {value && !q && <li><button type="button" role="option" aria-selected="true" className="on" onClick={() => setOpen(false)}>{value} (attuale)</button></li>}
        {results.map(o => <li key={o.label}><button type="button" role="option" aria-selected={o.value === value} onClick={() => { onChange(o.value); setOpen(false); }}>{o.label}</button></li>)}
        {status === "loading" && <li className="bl-picker-empty">Cerco…</li>}
        {status === "idle" && q.trim().length >= 2 && !results.length && <li className="bl-picker-empty">Nessuna città trovata</li>}
        {status === "idle" && q.trim().length < 2 && !value && <li className="bl-picker-empty">Scrivi almeno 2 lettere</li>}
        {status === "error" && <><li className="bl-picker-empty">Ricerca non disponibile al momento.</li>{q.trim().length >= 2 && <li><button type="button" onClick={() => { onChange(q.trim()); setOpen(false); }}>Usa «{q.trim()}»</button></li>}</>}
      </ul>
    </div>}
    {error && <small className="bl-err" role="alert">{error}</small>}
  </div>;
}
/* Data di nascita: tre menù a scorrimento, formato gg/mm/aaaa. Il valore è ISO (aaaa-mm-gg). */
function BirthDatePicker({ label = "Data di nascita (gg/mm/aaaa)", value, onChange, error }) {
  const parse = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v || "") ? v.split("-").map(Number) : [0, 0, 0];
  const [parts, setParts] = useState(() => { const [y, m, d] = parse(value); return { y, m, d }; });
  useEffect(() => {
    const [y, m, d] = parse(value);
    if (y) setParts(prev => (prev.y === y && prev.m === m && prev.d === d ? prev : { y, m, d }));
  }, [value]);
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: 111 - MIN_AGE }, (_, i) => thisYear - MIN_AGE - i);
  const daysIn = (y, m) => (m ? new Date(y || 2000, m, 0).getDate() : 31);
  function update(patch) {
    const next = { ...parts, ...patch };
    const max = daysIn(next.y, next.m);
    if (next.d > max) next.d = max;
    setParts(next);
    onChange(next.y && next.m && next.d ? `${next.y}-${String(next.m).padStart(2, "0")}-${String(next.d).padStart(2, "0")}` : "");
  }
  return <div className="bl-field-label bl-birth-field">{label}
    <div className="bl-birth" role="group" aria-label={label}>
      <select aria-label="Giorno" value={parts.d || ""} onChange={e => update({ d: Number(e.target.value) })}><option value="">gg</option>{Array.from({ length: daysIn(parts.y, parts.m) }, (_, i) => <option key={i + 1} value={i + 1}>{String(i + 1).padStart(2, "0")}</option>)}</select>
      <select aria-label="Mese" value={parts.m || ""} onChange={e => update({ m: Number(e.target.value) })}><option value="">mm</option>{MONTHS_IT.map((name, i) => <option key={name} value={i + 1}>{String(i + 1).padStart(2, "0")} · {name}</option>)}</select>
      <select aria-label="Anno" value={parts.y || ""} onChange={e => update({ y: Number(e.target.value) })}><option value="">aaaa</option>{years.map(y => <option key={y} value={y}>{y}</option>)}</select>
    </div>
    {error && <small className="bl-err" role="alert">{error}</small>}
  </div>;
}

const NAME_RE = /^[\p{L}][\p{L}\p{M}'’ .-]{1,59}$/u;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[0-9]{7,15}$/;
const normalizePhone = (s) => String(s || "").replace(/[\s().-]/g, "");

function validateProfile(f) {
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
function pinProblem(pin, pin2) {
  if (!/^\d{4}$/.test(pin)) return "Il PIN deve contenere esattamente 4 cifre.";
  if (/^(\d)\1{3}$/.test(pin) || "0123456789".includes(pin) || "9876543210".includes(pin)) return "PIN troppo semplice: evita cifre ripetute o sequenze (es. 1111, 1234).";
  if (pin !== pin2) return "I due PIN non coincidono.";
  return "";
}
const ERROR_MAP = [
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
function friendlyError(err) {
  const m = String(err?.message || err || "");
  const hit = ERROR_MAP.find(([k]) => m.includes(k));
  if (hit) return hit[1];
  if (m.startsWith("Profilo creato")) return m;
  return "Qualcosa non ha funzionato. Riprova.";
}

/* Copia fedele del componente Sheet di App.jsx (stesse classi CSS) */
function ExSheet({ label, title, subtitle, onClose, onBack, children }) {
  return <div className="bl-sheet-wrap" style={{ zIndex: 24 }} onClick={(e) => e.target === e.currentTarget && onClose()}>
    <div className="bl-sheet" role="dialog" aria-modal="true" aria-label={label}>
      <div className="bl-sheet-heading">
        {onBack && <button className="bl-sheet-x" onClick={onBack} aria-label="Indietro">‹</button>}
        <div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
        <button className="bl-sheet-x" onClick={onClose} aria-label="Chiudi">×</button>
      </div>
      {children}
    </div>
  </div>;
}

/* ====================== Permessi ospite ====================== */
function GuestPermissions() {
  return <div className="bl-perms">
    <div><strong>Da ospite puoi</strong><ul><li>Esplorare il campo di bolle</li><li>Scoppiare le bolle-sorpresa</li><li>Vedere le bolle degli altri (senza aprirle)</li></ul></div>
    <div><strong>Con un account puoi</strong><ul><li>Scoppiare le bolle degli utenti</li><li>Pubblicare, reagire e segnalare</li><li>Regalare bolle, statistiche e classifiche</li></ul></div>
  </div>;
}

/* ====================== Registrazione completa ====================== */
function RegistrationSheet({ mode = "full", username, initialEmail = "", onClose, onSubmit, onOpenLogin }) {
  const dataOnly = mode === "data" || mode === "google";
  const [step, setStep] = useState(1);
  const [f, setF] = useState({ firstName: "", lastName: "", email: initialEmail, phone: "", sex: "", birthDate: "", nationality: "", city: "", category: "utente", consent: false });
  const [pin, setPin] = useState(""); const [pin2, setPin2] = useState("");
  const [errors, setErrors] = useState({}); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const set = (k, v) => { setF((o) => ({ ...o, [k]: v })); setErrors((o) => ({ ...o, [k]: undefined })); };
  const payload = () => ({ firstName: f.firstName.trim(), lastName: f.lastName.trim(), email: f.email.trim().toLowerCase(), phone: normalizePhone(f.phone), sex: f.sex, age: ageFromBirthDate(f.birthDate), birthDate: f.birthDate, nationality: f.nationality.trim(), city: f.city.trim(), category: f.category || "utente", consent: f.consent });

  async function submitData(e) {
    e.preventDefault(); setError("");
    const errs = validateProfile(f); setErrors(errs);
    if (Object.keys(errs).length) return;
    if (!dataOnly) { track("register_step", { step: 2 }); setStep(2); return; }
    setBusy(true);
    try { await onSubmit(payload(), null); } catch (err) { setError(friendlyError(err)); setBusy(false); }
  }
  async function submitPin(e) {
    e.preventDefault(); setError("");
    const p = pinProblem(pin, pin2); if (p) return setError(p);
    setBusy(true);
    try { await onSubmit(payload(), pin); } catch (err) { setError(friendlyError(err)); setBusy(false); }
  }
  const input = (k, label, props) => <label className="bl-field-label">{label}
    <input value={f[k]} onChange={(e) => set(k, e.target.value)} aria-invalid={Boolean(errors[k])} {...props} />
    {errors[k] && <small className="bl-err" role="alert">{errors[k]}</small>}
  </label>;

  const title = dataOnly ? "Completa il tuo profilo" : step === 1 ? "Crea il tuo account" : "Crea il tuo PIN";
  const subtitle = mode === "google" ? "Accesso Google attivo · completa i dati e accetta l’informativa. Non serve un PIN." : dataOnly ? "Per continuare ci servono ancora alcuni dati." : step === 1 ? "Passo 1 di 2 · I tuoi dati" : "Passo 2 di 2 · Il PIN di 4 cifre ti serve per accedere.";
  return <ExSheet label="Registrazione" title={title} subtitle={subtitle} onClose={() => !busy && onClose()} onBack={step === 2 && !busy ? () => setStep(1) : null}>
    {!dataOnly && <div className="bl-steps" aria-hidden="true"><i className="on" /><i className={step === 2 ? "on" : ""} /></div>}
    {step === 1 && <form className="bl-account-form" noValidate onSubmit={submitData}>
      <div className="bl-two">
        {input("firstName", "Nome", { type: "text", autoComplete: "given-name", maxLength: 60 })}
        {input("lastName", "Cognome", { type: "text", autoComplete: "family-name", maxLength: 60 })}
      </div>
      {input("email", "Email", { type: "email", autoComplete: "email", inputMode: "email", maxLength: 254, placeholder: "nome@esempio.it" })}
      {input("phone", "Numero di telefono", { type: "tel", autoComplete: "tel", inputMode: "tel", maxLength: 20, placeholder: "+39 333 1234567" })}
      <div className="bl-field-label">Sesso
        <div className="bl-chips" role="group" aria-label="Sesso">{SEX_OPTIONS.map(([k, l]) => <button type="button" key={k} className={f.sex === k ? "on" : ""} aria-pressed={f.sex === k} onClick={() => set("sex", k)}>{l}</button>)}</div>
        {errors.sex && <small className="bl-err" role="alert">{errors.sex}</small>}
      </div>
      <BirthDatePicker value={f.birthDate} onChange={(v) => set("birthDate", v)} error={errors.birthDate} />
      <NationalityPicker value={f.nationality} onChange={(v) => set("nationality", v)} error={errors.nationality} />
      <CityPicker value={f.city} onChange={(v) => set("city", v)} error={errors.city} />
      <div className="bl-field-label">Tipo di profilo / Categoria
        <select 
          value={f.category || "utente"} 
          onChange={(e) => set("category", e.target.value)}
          style={{ width: "100%", padding: "11px", borderRadius: 12, background: "#29243d", color: "#fff", border: "1px solid #8e80af", marginTop: 4, fontSize: 15 }}
        >
          {USER_CATEGORIES.map(c => (
            <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
          ))}
        </select>
        <small className="bl-muted" style={{ display: "block", marginTop: 4 }}>Questa icona indicherà la tua categoria sulle bolle nel feed.</small>
      </div>
      <details className="bl-privacy"><summary>Come proteggiamo i tuoi dati</summary><ul>
        <li><strong>Titolare:</strong> {PRIVACY_CONTROLLER} · {PRIVACY_EMAIL}</li>
        <li><strong>Dati raccolti:</strong> nome, cognome, email, telefono, sesso, data di nascita, nazionalità e città di residenza. Se scegli l’accesso con PIN, viene conservato solo come hash cifrato, mai in chiaro.</li>
        <li><strong>Finalità e base giuridica:</strong> creare e gestire il tuo account, sicurezza e statistiche aggregate (art. 6.1 a-b GDPR).</li>
        <li><strong>Visibilità:</strong> gli altri utenti vedono solo il tuo username anonimo. I tuoi dati non sono venduti né pubblicati; vi accede solo l’amministratore del servizio, con accessi registrati.</li>
        <li><strong>Conservazione:</strong> finché l’account è attivo; vengono eliminati con l’account.</li>
        <li><strong>Diritti:</strong> accesso, rettifica, portabilità e cancellazione, direttamente da Profilo → Impostazioni o scrivendo al titolare.</li>
      </ul></details>
      <label className="bl-check"><input type="checkbox" checked={f.consent} onChange={(e) => set("consent", e.target.checked)} /><span><strong>Informativa e consenso</strong><small>Ho letto l’informativa, acconsento al trattamento dei miei dati personali e dichiaro di avere almeno {MIN_AGE} anni.</small></span></label>
      {errors.consent && <small className="bl-err" role="alert">{errors.consent}</small>}
      {error && <p className="bl-error" role="alert">{error}</p>}
      <button type="submit" className="bl-cta" disabled={busy}>{dataOnly ? (busy ? "Salvataggio…" : "Completa la registrazione") : "Continua"}</button>
      {!dataOnly && onOpenLogin && <button type="button" className="bl-link" onClick={onOpenLogin}>Hai già un account? Accedi</button>}
    </form>}
    {step === 2 && <form className="bl-account-form" onSubmit={submitPin}>
      <div className="bl-account-ready" role="status"><strong>Il tuo username: @{username || "in preparazione"}</strong><p>Conserva questo username: ti servirà insieme al PIN di 4 cifre per accedere a Bolle in futuro, anche da un altro dispositivo.</p></div>
      <label className="bl-field-label">PIN di 4 cifre<input type="password" inputMode="numeric" autoComplete="new-password" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="••••" /></label>
      <label className="bl-field-label">Ripeti il PIN<input type="password" inputMode="numeric" autoComplete="new-password" maxLength={4} value={pin2} onChange={(e) => setPin2(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="••••" /></label>
      {error && <p className="bl-error" role="alert">{error}</p>}
      <button type="submit" className="bl-cta" disabled={busy}>{busy ? "Registrazione…" : "Completa la registrazione"}</button>
      <p className="bl-muted">Con username e PIN ritrovi le tue bolle da qualsiasi dispositivo. Il PIN non si può recuperare: conservalo con cura.</p>
    </form>}
  </ExSheet>;
}

/* ====================== Privacy: esporta ed elimina i dati ====================== */
function PrivacySection({ onExport, onDelete }) {
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [confirm, setConfirm] = useState("");
  async function run(fn) { setBusy(true); setError(""); try { await fn(); } catch (e) { setError(friendlyError(e)); } finally { setBusy(false); } }
  return <section className="bl-insights-section"><div className="bl-insights-heading"><h3><ShieldCheck size={21} aria-hidden="true" /> Privacy e dati personali</h3></div>
    <p className="bl-muted">Puoi scaricare una copia dei tuoi dati o eliminare definitivamente il tuo account e tutti i contenuti collegati.</p>
    <div className="bl-row"><button className="bl-ghost" disabled={busy} onClick={() => run(onExport)}>Scarica i miei dati</button></div>
    <label className="bl-field-label">Per eliminare l’account scrivi ELIMINA<input type="text" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" placeholder="ELIMINA" /></label>
    <button className="bl-ghost bl-danger" disabled={busy || confirm.trim() !== "ELIMINA"} onClick={() => run(onDelete)}>Elimina il mio account</button>
    {error && <p className="bl-error" role="alert">{error}</p>}
  </section>;
}
