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
import MessagesView from "./features/chat/MessagesView.jsx";
import Sheet from "./components/Sheet.jsx";
import useEscape from "./hooks/useEscape.js";
import WelcomeScreen from "./features/auth/WelcomeScreen.jsx";
import TutorialSheet from "./features/auth/TutorialSheet.jsx";
import InfoSheet from "./features/auth/InfoSheet.jsx";
import LoginSheet from "./features/auth/LoginSheet.jsx";
import RegistrationSheet from "./features/auth/RegistrationSheet.jsx";
import Viewer from "./features/viewer/Viewer.jsx";
import { formatCountdown, useCapsuleRemaining, capsuleRemainingMs, capsuleNow, setCapsuleClockSkew } from "./lib/capsule.js";
import { KlipyPicker } from "./components/KlipyPicker.jsx";
import { GifAnswer } from "./components/GifAnswer.jsx";
import { seqApi } from "./lib/seqApi.js";
import GuestPermissions from "./features/auth/GuestPermissions.jsx";
import {
  CHAT_MARK_SHARE,
  CHAT_MAX_BODY,
  makeBubbleReplyMark,
  parseChatBody,
  parseGroupMsgBody,
  chatPreview,
  appendChatNotifLog,
  readChatNotifLog,
  getActiveChatKey
} from "./features/chat/chatUtils.js";
import AvatarImage, { AVATAR_BUCKET } from "./components/AvatarImage.jsx";
import UserLinkText, { openUserProfile } from "./components/UserLinkText.jsx";
import { GoogleAccountBadge } from "./hooks/useGoogleAccount.jsx";
import { romeToday } from "./lib/geo.js";
import { layoutConstellation } from "./lib/constellationLayout.js";
import "./styles/bolle.css";
import "./styles/bolle-polish.css";
import { nearbyPairs } from "./lib/spatialPairs.js";
import { applyMagneticAttraction } from "./lib/magneticForces.js";
import { magneticPriority, applyDiscoveryDrift } from "./lib/discoveryMotion.js";
import { neighborhoodMagnetism } from "./lib/localMagnetism.js";
import { getCtx, warmAudio, soundOn, supabase, BUCKET, MAX_UPLOAD_MB, RADII, BOLLE_COUNTRIES, countryFlag, STARTER_COUNT, MINI_THRESHOLD, miniStyle, AVATARS, avatarFor, shareBubbleWhatsApp, bubbleShareUrl, REACTIONS, ReactionIcon, PALETTES, cleanCaption, captionPosition, SURPRISES, setSoundOn, playPop, playDust, ensureSession, setAuthSession, hash, bubbleLook, getPosition, positionErrorText, errorText, formatDistance, subscribeFrame, USER_CATEGORIES, categoryIcon, categoryLabel, getBubbleAgeStage, getBubbleRemainingHours, KLIPY_API_KEY, GIPHY_API_KEY, BOLLE_THEMES } from "./lib/bolleCore.jsx";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Trash2, CircleUserRound, Circle, ChartColumn, Gift, Trophy, Settings, Hand, Droplets, Plus, VenetianMask, Heart, Smile, Eye, Sparkles, Frown, CalendarDays, CalendarRange, LockKeyhole, Award, Rocket, HeartHandshake, Waves, Zap, Medal, TrendingUp, TrendingDown, Minus, Orbit, Sprout, Volume2, KeyRound, Users, UserPlus, Activity, Gauge, RefreshCw, ShieldCheck, Bell, Share2, Camera, MessageCircle, Send as SendIcon, X as CloseIcon, MoreHorizontal as MoreIcon, EyeOff, Archive, ArchiveRestore, Star as StarIcon, Link2 as LinkIcon, ChevronsUpDown as ScrollIcon } from "lucide-react";


const BOLLE_THEME_DECOR = {"halloween": ["🦇", "🎃", "👻", "🕸️", "🧙\u200d♀️", "🕷️", "🌙", "💀"], "natale": ["🎄", "❄️", "🎁", "⭐", "🔔", "🦌", "🧣", "🍬"], "pasqua": ["🐣", "🥚", "🐰", "🌷", "🌼", "🦋", "🐇", "🌸"], "capodanno": ["🎆", "🎇", "✨", "🥂", "🎉", "⭐", "🎊", "🪩"], "estate": ["☀️", "🌴", "🍉", "🏖️", "🐚", "🌊", "🕶️", "🍍"], "primavera": ["🌸", "🌷", "🦋", "🌼", "🐝", "🌱", "🌺", "🍃"], "autunno": ["🍂", "🍁", "🌰", "🍄", "🦔", "🌾", "☕", "🍃"], "inverno": ["❄️", "☃️", "🌨️", "🧤", "⛸️", "🏔️", "🧣", "❄️"], "caldo": ["☀️", "🔥", "🌞", "🌵", "🍊", "🌅", "✨", "🌶️"], "freddo": ["🧊", "❄️", "💎", "🌬️", "🧣", "🌨️", "🧤", "🧊"], "orientale": ["🏮", "🌸", "🎋", "🪭", "⛩️", "🐉", "🍵", "🌙"], "universo": ["🪐", "🌟", "🌙", "☄️", "✨", "🚀", "🌌", "⭐"], "bolle": ["🫧", "🫧", "✨", "💧", "🫧", "💠", "🫧", "✨"], "natura": ["🌿", "🍀", "🌳", "🦋", "🌱", "🌻", "🍃", "🌼"]};
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
const GUEST_POPS_PER_KIND = 3;
/* ---------- Capsula del tempo: conto alla rovescia visibile a tutti ---------- */
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
// Un solo setInterval condiviso da tutte le bolle con capsula.
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
        if (getActiveChatKey() === `u:${String(row.username || "").toLowerCase()}`) continue; // chat già aperta
        found.push({ key: `${row.conversation_id || row.username}|${row.last_at}`, row, parsed: parseChatBody(row.last_body) });
      }
      for (const g of groupRows) {
        if (!g || g.last_mine || !(Number(g.unread) > 0)) continue;
        if (getActiveChatKey() === `g:${g.id}`) continue;
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
          if (Number.isFinite(serverNow)) setCapsuleClockSkew(serverNow - Date.now());
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
        if (Number.isFinite(serverNow)) setCapsuleClockSkew(serverNow - Date.now());
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









function GiphyPicker(props) {
  return <KlipyPicker initialSource="both" {...props} />;
}


/* Inoltra una bolla: WhatsApp, link/altre app oppure un altro utente di Bolle (via chat). */

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
