import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import ChainOrbs, { useChainSummary } from "./ChainOrbs.jsx";

/* =====================================================================
 SequentialFeed — la home "una bolla alla volta" di Bolle.

 • Una sola bolla grande al centro; dietro, sullo sfondo, le due bolle successive (più piccole
 e trasparenti, una in alto a destra e una a sinistra) che si avvicinano mentre trascini
 quella davanti: si capisce che scartandola ce ne sono altre.
 • Aspetto: sfera di vetro scuro con bordo iridescente blu/viola/magenta, etichetta in vetro,
 titolo con serif e descrizione bianchi (vedi item.title / item.body).
 • Tocca = scoppia · Scorri via (qualsiasi direzione) = respingi gratis,
 la bolla si allontana lentamente e non torna più.
 • Anteprima: miniatura minuscola ingrandita via CSS (niente backdrop-filter → leggero su
 smartphone), palette unica con una lieve sfumatura per tipo di bolla,
 icona + etichetta per ogni tipo (mai solo il colore).
 • Le bolle in cui sei taggato hanno un anello luminoso, passano per prime e
 lo swipe chiede conferma.
 • Fisica a molla: la bolla segue il dito con un leggero ritardo elastico, si allunga
 nel verso del movimento e, al rilascio, rimbalza al suo posto oppure scivola via
 con la velocità del gesto. Tutto in un solo ciclo requestAnimationFrame.
 • Prestazioni: durante il trascinamento nessun setState (si scrive direttamente
 sullo stile), solo 2 bolle nel DOM, solo transform/opacity animati.

 Il componente NON parla con Supabase: usa callback. In fondo trovi
 feedApi(supabase) con le chiamate alle RPC del file SQL.
 ===================================================================== */

/* ------------------------------ costanti ------------------------------ */
const DRAG_START_PX = 14; // sotto questa distanza non è ancora uno swipe
const TAP_MAX_MOVE_PX = 4; // un tap vero si muove meno di così
const TAP_MAX_MS = 600;
const SWIPE_RATIO = 0.28; // distanza minima = 28% del diametro della bolla
const SWIPE_SPEED = 0.5; // px/ms: un flick veloce vale come swipe
const SKIP_LOCK_MS = 400; // pausa anti-frenesia dopo ogni azione
const LEAVE_MS = 1000; // durata dell'allontanamento lento
const NUDGE_EVERY = 15; // dopo N swipe di fila senza scoppiare, suggerimento
const MAX_HOOK_CHARS = 80;
const MAX_TITLE_CHARS = 70;
const MAX_BODY_CHARS = 130;
const GHOSTS = 2; // quante bolle successive si vedono sullo sfondo
const HINT_KEY = "bl_seq_hint_done";
/* INTERRUTTORE «contenuto nitido»: true = anteprime e testi senza sfocatura (tutte le bolle);
 false = tutto torna com'era prima (anteprima con blur leggero). Nessun'altra modifica da fare. */
const CLEAR_PREVIEW = true;

/* Tipi di bolla: colore + icona + etichetta (mai solo il colore, per l'accessibilità).
 `hook: true` = il testo della domanda è visibile come gancio prima dello scoppio. */
const KINDS = {
 photo: { label: "Foto", icon: "", hue: 200 },
 video: { label: "Video", icon: "", hue: 265 },
 question: { label: "Domanda", icon: "", hue: 190, hook: true },
 poll: { label: "Questo o quello", icon: "", hue: 330, hook: true, split: true },
 multipoll: { label: "Sondaggio", icon: "", hue: 168, hook: true },
 meme: { label: "Meme", icon: "", hue: 45 },
 gif: { label: "GIF", icon: "", hue: 20 },
 truth: { label: "2 verità, 1 bugia",icon: "", hue: 150 },
 rating: { label: "Dai un voto", icon: "", hue: 52 },
 thought: { label: "Pensiero", icon: "", hue: 285 },
 confession: { label: "Confessione", icon: "", hue: 350 },
 capsule: { label: "Capsula del tempo",icon: "", hue: 30 },
 system: { label: "Dal sistema", icon: "", hue: 170 },
};
const FALLBACK_KIND = { label: "Bolla", icon: "", hue: 215 };

/* ------------------------------ utilità ------------------------------ */
function hashStr(s) {
 let h = 2166136261;
 for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
 return h >>> 0;
}

/* Bordo organico leggermente diverso per ogni bolla: "deformata", ma statica. */
function organicRadius(id) {
 const h = hashStr(String(id));
 const p = (n) => 46 + ((h >>> n) & 7); // 46..53
 return `${p(0)}% ${100 - p(3)}% ${p(6)}% ${100 - p(9)}% / ${p(12)}% ${p(15)}% ${100 - p(18)}% ${100 - p(21)}%`;
}

function trimText(text, max) {
 const t = String(text || "").replace(/\s+/g, " ").trim();
 return t.length > max ? t.slice(0, max - 1).trimEnd() + "…" : t;
}
const trimHook = (text) => trimText(text, MAX_HOOK_CHARS);

function defaultGetKind(item) {
 const k = String(item?.kind || "").toLowerCase();
 return KINDS[k] || FALLBACK_KIND;
}

/* Bolle di sistema (curiosità, aforismi, notizie…): il contenuto è pubblico, quindi si legge già prima dello scoppio. */
const SYSTEM_CATS = {
 curiosita: { label: "Curiosità", icon: "" },
 aforisma: { label: "Aforisma", icon: "" },
 motivazione: { label: "Motivazione", icon: "" },
 notizia: { label: "Notizia", icon: "" },
};
const isSystemItem = (item) => Boolean(item) && (item.system === true || Boolean(item.systemCategory) || item.kind === "system" || item.source === "system" || item.isSystem === true);
const systemTitle = (item) => item.message || item.title || item.headline || item.hook || item.text || item.quote || "";
// aforismi: autore · notizie: fonte (il link all'articolo resta nel dettaglio)
const systemBody = (item) => {
 if (item.body || item.description || item.summary) return item.body || item.description || item.summary;
 if (item.attribution) return `— ${item.attribution}`;
 if (item.systemCategory === "notizia" && item.source && typeof item.source === "string" && item.source !== "system") return item.source;
 return "";
};

const isCalm = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/* Trasformazione «gelatina»: posizione + inclinazione + allungamento nel verso della velocità. */
function jellyTransform(x, y, vx, vy, calm, extraScale = 1) {
 const sp = Math.hypot(vx, vy);
 const st = calm ? 0 : Math.min(0.24, sp / 3000);
 const ang = Math.atan2(vy, vx);
 return `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) rotate(${(x * 0.04).toFixed(2)}deg) `
 + `rotate(${ang.toFixed(3)}rad) scale(${((1 + st) * extraScale).toFixed(3)},${((1 - st * 0.7) * extraScale).toFixed(3)}) rotate(${(-ang).toFixed(3)}rad)`;
}

/* ------------------------------ contenuto vivo + lente della pellicola ------------------------------
 Fisica: una bolla è una pellicola d'acqua sottilissima (~0,1-1 µm). Le due superfici quasi coincidono, quindi la
 rifrazione in ingresso e in uscita si compensa: al centro il contenuto si vede praticamente identico (niente lente
 di vetro, niente immagine capovolta). Si deforma appena verso il bordo, dove la superficie si inclina e la luce
 attraversa la pellicola radente. Modello fisico completo qui sotto (FILM_N / LENS_EPS).
 Il canvas legge i fotogrammi da UN solo elemento <video>/<img> (un solo decoder) e li ridisegna in anelli
 concentrici con ingrandimento diverso: nessun filtro SVG, quindi nessun costo per fotogramma sul livello animato. */
const LENS_RINGS = 20; // anelli concentrici, fitti verso il bordo (dove lo spostamento varia di più)
const LENS_MAX_PX = 448; // risoluzione massima del canvas
const isEco = () => typeof document !== "undefined" && document.documentElement.classList.contains("bl-eco");

/* Ottica della pellicola (acqua saponata, n = 1,33).
 Lastra piano-parallela di spessore t: un raggio che la attraversa con incidenza θ esce PARALLELO a sé stesso, solo traslato di
 d = t · sinθ · (1 − cosθ / √(n² − sin²θ)) / cosθ
 Sulla sfera, sinθ = ρ (distanza dal centro / raggio). Per ρ piccolo d ≈ 0,25·t·ρ: un semplice fattore di scala costante, quindi il centro
 è praticamente indistinguibile da un vetro nullo; d cresce solo verso il bordo, dove l'incidenza è radente (cosθ → 0).
 Con t ≈ 0,5 µm e R ≈ 5 cm lo spostamento reale è ~10⁻⁵ del raggio: invisibile. Per renderlo percepibile si moltiplica TUTTO il profilo
 per un solo fattore artistico (LENS_EPS), mantenendo la forma fisica: ingrandimento locale a(ρ) = 1 + LENS_EPS · g(ρ), con
 g(ρ) = (1 − cosθ/√(n²−ρ²)) / (cosθ · (1 − 1/n)) (g(0) = 1)
 Risultato: centro ≈ +0,25%, ρ=0,9 ≈ +1,3%, ρ=0,97 ≈ +3%. La divergenza di g viene limitata a ρ = LENS_RHO_MAX. */
const FILM_N = 1.33;
const LENS_EPS = 0.0025;
const LENS_RHO_MAX = 0.985;
function filmMagnification(rho) {
 const r = Math.min(rho, LENS_RHO_MAX), c = Math.sqrt(1 - r * r);
 const g = (1 - c / Math.sqrt(FILM_N * FILM_N - r * r)) / (c * (1 - 1 / FILM_N));
 return 1 + LENS_EPS * g;
}
/* Bordi degli anelli: ρ_k = 1 − (1 − k/N)², fitti verso il bordo. */
const LENS_EDGES = Array.from({ length: LENS_RINGS + 1 }, (_, k) => 1 - Math.pow(1 - k / LENS_RINGS, 2));
const LENS_MAGS = Array.from({ length: LENS_RINGS }, (_, i) => filmMagnification((LENS_EDGES[i] + LENS_EDGES[i + 1]) / 2));

function paintLens(ctx, buf, S) {
 ctx.clearRect(0, 0, S, S);
 for (let i = LENS_RINGS - 1; i >= 0; i--) { // dal bordo al centro: ogni disco copre il precedente, senza cuciture
 const d = S * LENS_MAGS[i], o = (S - d) / 2;
 ctx.save();
 ctx.beginPath();
 ctx.arc(S / 2, S / 2, (S / 2) * LENS_EDGES[i + 1] * (i === LENS_RINGS - 1 ? 1.05 : 1), 0, Math.PI * 2);
 ctx.clip();
 ctx.drawImage(buf, o, o, d, d);
 ctx.restore();
 }
}

function BubbleMedia({ media, live, onFail }) {
 const srcRef = useRef(null);
 const lensRef = useRef(null);
 const [ready, setReady] = useState(false);
 const failRef = useRef(onFail);
 failRef.current = onFail;
 const isVideo = media.type === "video";

 useEffect(() => {
 const el = srcRef.current, canvas = lensRef.current;
 if (!el || !canvas) return undefined;
 const ctx = canvas.getContext("2d");
 const buf = document.createElement("canvas");
 const bctx = buf.getContext("2d");
 if (!ctx || !bctx) { setReady(false); return undefined; } // senza canvas resta il contenuto nitido, senza lente
 ctx.imageSmoothingQuality = bctx.imageSmoothingQuality = "high";

 const freeze = media.type === "image" || !live || isCalm() || isEco(); // un solo fotogramma, nessun ciclo
 let S = 0, raf = 0, rvfc = 0, last = 0, alive = true;

 const draw = () => {
 const sw = isVideo ? el.videoWidth : el.naturalWidth;
 const sh = isVideo ? el.videoHeight : el.naturalHeight;
 if (!sw || !sh || (isVideo && el.readyState < 2)) return false;
 const css = canvas.clientWidth || 300;
 const px = Math.max(256, Math.min(LENS_MAX_PX, Math.round(css * Math.min(window.devicePixelRatio || 1, 2))));
 if (px !== S) { S = px; canvas.width = canvas.height = buf.width = buf.height = S; }
 const cover = Math.max(S / sw, S / sh); // ritaglio «cover», come object-fit
 const dw = sw * cover, dh = sh * cover;
 bctx.clearRect(0, 0, S, S);
 bctx.drawImage(el, (S - dw) / 2, (S - dh) / 2, dw, dh); // il fotogramma si decodifica una volta sola
 paintLens(ctx, buf, S);
 setReady(true);
 return true;
 };

 const onFailEv = () => failRef.current?.();
 el.addEventListener("error", onFailEv);
 const onData = () => { if (alive) draw(); };
 const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => { if (alive && freeze) draw(); }) : null;
 ro?.observe(canvas);

 if (freeze) {
 if (isVideo) { el.pause(); el.addEventListener("loadeddata", onData); el.addEventListener("seeked", onData); }
 else { if (el.complete) draw(); else el.addEventListener("load", onData); }
 if (isVideo && el.readyState >= 2) draw();
 } else if (isVideo) {
 const tick = () => { if (!alive) return; draw(); rvfc = el.requestVideoFrameCallback ? el.requestVideoFrameCallback(tick) : requestAnimationFrame(tick); };
 el.play?.().catch(() => {}); // muto + playsInline: l'autoplay è consentito
 rvfc = el.requestVideoFrameCallback ? el.requestVideoFrameCallback(tick) : requestAnimationFrame(tick);
 } else { // GIF: la <img> sotto il canvas anima, qui si ridisegna a ~24 fps
 const tick = (t) => { if (!alive) return; if (t - last > 41) { last = t; if (el.complete) draw(); } raf = requestAnimationFrame(tick); };
 raf = requestAnimationFrame(tick);
 }

 return () => {
 alive = false;
 cancelAnimationFrame(raf);
 if (rvfc && el.cancelVideoFrameCallback) el.cancelVideoFrameCallback(rvfc);
 ro?.disconnect();
 el.removeEventListener("error", onFailEv);
 el.removeEventListener("load", onData);
 el.removeEventListener("loadeddata", onData);
 el.removeEventListener("seeked", onData);
 if (isVideo) el.pause?.();
 };
 }, [media.url, media.type, live, isVideo]);

 // libera il decoder quando la bolla esce di scena
 useEffect(() => () => {
 const el = srcRef.current;
 if (el && isVideo) { try { el.pause(); el.removeAttribute("src"); el.load(); } catch { /* niente */ } }
 }, [isVideo]);

 return (
 <span className="bl-seq-blurwrap">
 {isVideo ? (
 <video ref={srcRef} className="bl-seq-media bl-seq-media--src" src={media.url} muted loop playsInline preload="auto"
 disablePictureInPicture disableRemotePlayback tabIndex={-1} />
 ) : (
 <img ref={srcRef} className="bl-seq-media bl-seq-media--src" src={media.url} alt="" decoding="async" draggable={false} />
 )}
 <canvas ref={lensRef} className={`bl-seq-media bl-seq-media--lens${ready ? " is-ready" : ""}`} />
 </span>
 );
}

/* ------------------------------ anteprima ingrandita con cura ------------------------------
 La miniatura salvata è minuscola (24-40 px). Stirata di colpo a 500 px mostra i blocchi, anche con un po' di blur.
 Qui la si ingrandisce a raddoppi successivi (ogni passo interpolato): il risultato converge a una sfumatura continua,
 senza quadrati né scalini del JPEG. Si calcola una volta per miniatura (cache), poi resta una semplice immagine. */
const SMOOTH_PX = 256;
const smoothCache = new Map();
function smoothUpscale(img) {
 let src = img, w = img.naturalWidth || 24;
 while (w < SMOOTH_PX) {
 const nw = Math.min(SMOOTH_PX, w * 2);
 const c = document.createElement("canvas");
 c.width = c.height = nw;
 const x = c.getContext("2d");
 x.imageSmoothingEnabled = true; x.imageSmoothingQuality = "high";
 x.drawImage(src, 0, 0, nw, nw);
 src = c; w = nw;
 }
 // un passaggio giù e su ammorbidisce i bordi dei blocchi 8×8 del JPEG
 const mid = document.createElement("canvas"); mid.width = mid.height = SMOOTH_PX / 2;
 const mx = mid.getContext("2d"); mx.imageSmoothingQuality = "high"; mx.drawImage(src, 0, 0, SMOOTH_PX / 2, SMOOTH_PX / 2);
 const out = document.createElement("canvas"); out.width = out.height = SMOOTH_PX;
 const ox = out.getContext("2d"); ox.imageSmoothingQuality = "high"; ox.drawImage(mid, 0, 0, SMOOTH_PX, SMOOTH_PX);
 return out.toDataURL("image/jpeg", 0.92);
}
function useSmoothPreview(src) {
 const [url, setUrl] = useState(() => (src ? smoothCache.get(src) || null : null));
 useEffect(() => {
 if (!src) { setUrl(null); return undefined; }
 const hit = smoothCache.get(src);
 if (hit) { setUrl(hit); return undefined; }
 let alive = true;
 const img = new Image();
 img.onload = () => {
 if (!alive) return;
 try {
 const out = smoothUpscale(img);
 smoothCache.set(src, out);
 if (smoothCache.size > 60) smoothCache.delete(smoothCache.keys().next().value);
 setUrl(out);
 } catch { /* canvas non disponibile: resta la miniatura originale */ }
 };
 img.src = src;
 return () => { alive = false; };
 }, [src]);
 return url || src || null;
}

/* ------------------------------ la bolla ------------------------------ */
function BubbleFace({ item, kind, small, live = false }) {
 const posterUrl = useSmoothPreview(item.sealed ? null : item.preview);
 const sysCat = SYSTEM_CATS[item.systemCategory];
 const label = item.label || sysCat?.label || kind.label;
 const icon = item.icon || (sysCat ? item.emoji || sysCat.icon : kind.icon);
 // Titolo + descrizione (es. notizie e curiosità del sistema) oppure, per domande e «questo o quello», il solo gancio.
 const sys = isSystemItem(item);
 const rawTitle = sys ? systemTitle(item) : item.title;
 const rawBody = sys ? systemBody(item) : item.body;
 const title = rawTitle ? trimText(rawTitle, sys ? 140 : MAX_TITLE_CHARS) : ""; // anche sulle bolle sullo sfondo: il testo si intravede
 const body = !small && title && rawBody && rawBody !== rawTitle ? trimText(rawBody, MAX_BODY_CHARS) : "";
 const hook = !title && kind.hook && item.hook ? trimHook(item.hook) : "";
 const lead = title || hook;
 // Stesse classi e variabili delle bolle sparse (bolle.css): pellicola liquida, riflessi; l'aspetto scuro è nel CSS qui sotto.
 const cls = item.faceClass || `bl-bubble--user bl-bubble--kind-${item.kind || "photo"}`;
 // Contenuto vero (foto, GIF, video) solo sulla bolla davanti; le altre restano con la miniatura.
 const [mediaFailed, setMediaFailed] = useState(false);
 const media = !small && !item.sealed && item.media?.url && !mediaFailed ? item.media : null;
 const hasPreview = Boolean(item.preview) && !item.sealed;
 const optics = (
 <>
 <span className="bl-seq-scrim" />
 <span className="bl-seq-fresnel" />
 <span className="bl-seq-thin"><i /></span>
 </>
 );
 return (
 <div className={`bl-bubble bl-seq-face ${cls}${media || hasPreview ? " is-media" : ""}`} style={{ ...(item.look || {}), "--h": kind.hue }}>
 {media ? (
 <span className="bl-seq-clip" aria-hidden="true">
 {hasPreview && <span className="bl-seq-poster" style={{ backgroundImage: `url("${posterUrl}")` }} />}
 <BubbleMedia key={media.url} media={media} live={live} onFail={() => setMediaFailed(true)} />
 {optics}
 </span>
 ) : hasPreview ? (
 <span className="bl-seq-clip" aria-hidden="true">
 <span className="bl-seq-poster" style={{ backgroundImage: `url("${posterUrl}")` }} />
 {optics}
 </span>
 ) : (
 <span className="bl-seq-blobs" style={{ "--r": `${hashStr(String(item.id)) % 360}deg` }} aria-hidden="true"><i /><i /><i /></span>
 )}
 <span className="bl-liquid-film" aria-hidden="true" />
 <span className="bl-bubble-glint" aria-hidden="true" />
 <span className="bl-bubble-reflection" aria-hidden="true" />
 <span className="bl-seq-sheen" aria-hidden="true" />
 <span className={`bl-kind-fx bl-kind-fx--${item.kind || "photo"}`} aria-hidden="true"><i /></span>
 <span className="bl-seq-tint" aria-hidden="true" />
 {kind.split && <span className="bl-seq-split" aria-hidden="true" />}
 {(!small || lead) && (
 <div className={`bl-seq-copy${small ? " bl-seq-copy--ghost" : ""}${lead ? " has-text" : ""}${kind.split ? " is-split" : ""}${lead && !body ? " bl-seq-copy--hook" : ""}`}>
 <span className="bl-seq-pill"><span aria-hidden="true">{icon}</span>{label}</span>
 {lead && <p className="bl-seq-hook" dir="auto">{lead}</p>}
 {body && <p className="bl-seq-body" dir="auto">{body}</p>}
 {lead && <span className="bl-seq-bar" aria-hidden="true" />}
 </div>
 )}
 {!small && item.tagCount > 0 && !item.taggedForMe && (
 <span className="bl-seq-badge"> con {item.tagCount} {item.tagCount === 1 ? "persona" : "persone"}</span>
 )}
 {!small && item.taggedForMe && <span className="bl-seq-badge bl-seq-badge--me"> Per te</span>}
 </div>
 );
}

/* ------------------------------ componente ------------------------------ */
export default function SequentialFeed({
 items = [], // [{ id, kind, hook, preview, taggedForMe, tagCount, rare, sealed }]
 rankIds, // opzionale: id in ordine di ranking (da bolle_feed_sequence)
 popsLeft = Infinity, // scoppi rimasti oggi (solo per etichetta e messaggio finale)
 canPop = () => true, // (item) => false se questa bolla non si può scoppiare ora
 paused = false, // true mentre il viewer è aperto
 getKind = defaultGetKind, // adatta qui il tuo bubbleKind(item)
 onPop, // (item) => apri il viewer, registra lo scoppio
 onSkip, // (item) => es. api.skip(item.id)
 onLimit, // (item) => scoppi giornalieri finiti
 onRequestMore, // () => carica altre bolle quando ne restano ≤ 3
 loadMedia, // (item) => Promise<{ url, type: "image"|"gif"|"video" } | null>: contenuto vero da mostrare dentro la bolla
 onNudgeNearby, // () => passa a «Vicino a me»
 renderEnd, // ({ popsLeft }) => fine feed personalizzata
}) {
 const [handled, setHandled] = useState(() => new Set());
 const [leaving, setLeaving] = useState(null);
 const [popping, setPopping] = useState(false);
 const [shaking, setShaking] = useState(false);
 const [confirm, setConfirm] = useState(null);
 const [nudge, setNudge] = useState(false);
 const [, setHint] = useState(() => {
 try { return !localStorage.getItem(HINT_KEY); } catch { return true; }
 });

 const stageRef = useRef(null);
 const bubbleRef = useRef(null);
 const dragRef = useRef(null);
 const lockUntil = useRef(0);
 const streak = useRef(0);
 const timers = useRef({});
 const lastRequested = useRef(-1);
 const leaveRef = useRef(null); // elemento della bolla che si allontana
 const sim = useRef({ x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, k: 420, c: 30, size: 300, raf: 0, last: 0 });

 /* ---- coda: ordine di ranking, meno le bolle già gestite ---- */
 const ordered = useMemo(() => {
 if (!rankIds?.length) return items;
 const pos = new Map(rankIds.map((id, i) => [String(id), i]));
 const at = (i) => (pos.has(String(i.id)) ? pos.get(String(i.id)) : 1e9);
 return [...items].sort((a, b) => at(a) - at(b));
 }, [items, rankIds]);

 const queue = useMemo(() => ordered.filter((i) => !handled.has(String(i.id))), [ordered, handled]);
 const current = queue[0] || null;
 const ghosts = queue.slice(1, 1 + GHOSTS); // le bolle che si vedono sullo sfondo
 // Contenuto vero (foto/GIF/video) per la bolla davanti e la successiva; se manca, resta la miniatura.
 const [mediaMap, setMediaMap] = useState({});
 const mediaAsked = useRef(new Set());
 const loadMediaRef = useRef(loadMedia);
 loadMediaRef.current = loadMedia;
 useEffect(() => {
 if (!loadMediaRef.current) return;
 queue.slice(0, 2).forEach((it) => {
 if (it.sealed || it.media || mediaAsked.current.has(it.id)) return;
 mediaAsked.current.add(it.id);
 Promise.resolve(loadMediaRef.current(it)).then((m) => {
 if (!m?.url) return;
 if (m.type !== "video") { const im = new Image(); im.src = m.url; } // pre-caricamento: la bolla successiva arriva già pronta
 setMediaMap((prev) => ({ ...prev, [it.id]: m }));
 }).catch(() => {});
 });
 }, [queue]);
 const withMedia = (it) => (it && !it.media && mediaMap[it.id] ? { ...it, media: mediaMap[it.id] } : it);
 const firstId = useRef(null); // la primissima bolla non arriva da dietro: si gonfia sul posto
 if (current && firstId.current === null) firstId.current = current.id;
 const isFirst = Boolean(current) && firstId.current === current.id;

 // Bolla a catena: una bolla per ogni partecipante, aggiornata mentre la bolla è sulla scena.
 const chain = useChainSummary(current?.id, { enabled: Boolean(current && current.chainable && !current.sealed), initial: current?.chainCount || 0 });

 const currentKind = current ? getKind(current) : null;

 const markHandled = useCallback((id) => {
 setHandled((prev) => { const n = new Set(prev); n.add(String(id)); return n; });
 }, []);

 const resetStage = () => stageRef.current?.style.setProperty("--p", "0");

 const finishHint = useCallback(() => {
 setHint(false);
 try { localStorage.setItem(HINT_KEY, "1"); } catch { /* ignora */ }
 }, []);

 /* ---- carica altre bolle quando la coda si sta svuotando ---- */
 useEffect(() => {
 if (queue.length <= 3 && lastRequested.current !== items.length) {
 lastRequested.current = items.length;
 onRequestMore?.();
 }
 }, [queue.length, items.length, onRequestMore]);

 useEffect(() => {
 setConfirm(null); setPopping(false);
 const S = sim.current; // nuova bolla: la molla riparte da ferma
 cancelAnimationFrame(S.raf); S.raf = 0; S.x = S.y = S.vx = S.vy = S.tx = S.ty = 0;
 }, [current?.id]);
 useEffect(() => {
 if (!nudge) return undefined;
 const t = setTimeout(() => setNudge(false), 6000);
 return () => clearTimeout(t);
 }, [nudge]);
 useEffect(() => () => { Object.values(timers.current).forEach(clearTimeout); cancelAnimationFrame(sim.current.raf); }, []);

 /* ---- azioni ---- */
 /* Un solo ciclo di animazione per la bolla corrente: integra una molla verso (tx,ty).
 Durante il trascinamento il bersaglio è il dito (molla rigida, poco ritardo);
 al rilascio il bersaglio diventa il centro (molla morbida: supera e rimbalza). */
 const stepSim = useCallback((t) => {
 const S = sim.current;
 const dt = Math.min(0.033, Math.max(0.001, (t - S.last) / 1000)); S.last = t;
 S.vx += (S.k * (S.tx - S.x) - S.c * S.vx) * dt; S.x += S.vx * dt;
 S.vy += (S.k * (S.ty - S.y) - S.c * S.vy) * dt; S.y += S.vy * dt;
 const el = bubbleRef.current;
 if (el) {
 el.style.transform = jellyTransform(S.x, S.y, S.vx, S.vy, isCalm());
 stageRef.current?.style.setProperty("--p", String(Math.min(1, Math.hypot(S.x, S.y) / (S.size * 0.5))));
 }
 const rest = !dragRef.current && Math.hypot(S.tx - S.x, S.ty - S.y) < 0.4 && Math.hypot(S.vx, S.vy) < 6;
 if (rest) {
 S.x = S.tx; S.y = S.ty; S.vx = S.vy = 0; S.raf = 0;
 if (el) el.style.transform = "";
 resetStage();
 return;
 }
 S.raf = requestAnimationFrame(stepSim);
 }, []);
 const runSim = () => { const S = sim.current; if (!S.raf) { S.last = performance.now(); S.raf = requestAnimationFrame(stepSim); } };
 const unpress = () => bubbleRef.current?.classList.remove("is-pressed");

 const springBack = useCallback(() => {
 const S = sim.current, calm = isCalm();
 S.tx = 0; S.ty = 0; S.k = calm ? 900 : 170; S.c = calm ? 60 : 12;
 unpress();
 runSim();
 }, [stepSim]);

 const doSkip = useCallback((item, dx = 0, dy = -1) => {
 const len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
 // la bolla parte dalla posizione e dalla velocità che aveva sotto il dito (almeno una spinta minima)
 const S = sim.current;
 const along = S.vx * ux + S.vy * uy;
 // distanza che la bolla deve percorrere in questa direzione per uscire del tutto dallo schermo
 let need = 700;
 const r = bubbleRef.current?.getBoundingClientRect();
 if (r) {
 const cx = r.left + r.width / 2, cy = r.top + r.height / 2, hw = r.width / 2;
 const tx = ux > 0.001 ? (window.innerWidth + hw - cx) / ux : ux < -0.001 ? (-hw - cx) / ux : Infinity;
 const ty = uy > 0.001 ? (window.innerHeight + hw - cy) / uy : uy < -0.001 ? (-hw - cy) / uy : Infinity;
 need = Math.min(tx, ty) + 24;
 }
 const push = Math.min(7000, Math.max(1100, along, need * 1.8));
 const from = { x: S.x, y: S.y, vx: ux * push, vy: uy * push };
 cancelAnimationFrame(S.raf); S.raf = 0; S.x = S.y = S.vx = S.vy = S.tx = S.ty = 0;
 setLeaving({ item, key: `${item.id}-${Date.now()}`, from });
 clearTimeout(timers.current.leave);
 timers.current.leave = setTimeout(() => setLeaving(null), LEAVE_MS);
 lockUntil.current = performance.now() + SKIP_LOCK_MS;
 markHandled(item.id);
 resetStage();
 finishHint();
 onSkip?.(item);
 streak.current += 1;
 if (streak.current % NUDGE_EVERY === 0 && onNudgeNearby) setNudge(true);
 }, [markHandled, onSkip, onNudgeNearby, finishHint]);

 /* La bolla respinta scivola via con la velocità del gesto, rallentando come in un liquido,
 mentre si allunga, si restringe e svanisce. */
 useLayoutEffect(() => {
 if (!leaving) return undefined;
 const el = leaveRef.current;
 if (!el) return undefined;
 const calm = isCalm();
 let { x, y, vx, vy } = leaving.from;
 const t0 = performance.now();
 let last = t0, id = 0;
 const paint = (u) => {
 const e = u * u * (3 - 2 * u);
 el.style.transform = jellyTransform(x, y, vx, vy, calm, 1 - 0.1 * e);
 // resta piena finché è visibile: sparisce solo oltre il bordo dello schermo (dissolvenza di sicurezza a fine corsa)
 const rc = el.getBoundingClientRect();
 const gone = rc.right < -8 || rc.left > window.innerWidth + 8 || rc.bottom < -8 || rc.top > window.innerHeight + 8;
 el.style.opacity = gone ? "0" : String(u > 0.88 ? Math.max(0, (1 - u) / 0.12) : 1);
 };
 paint(0); // primo fotogramma già nella posizione giusta: nessun salto
 const step = (t) => {
 const dt = Math.min(0.033, Math.max(0.001, (t - last) / 1000)); last = t;
 const damp = Math.exp(-dt * 0.9);
 vx *= damp; vy *= damp; x += vx * dt; y += vy * dt;
 const u = Math.min(1, (t - t0) / LEAVE_MS);
 paint(u);
 if (u < 1) id = requestAnimationFrame(step);
 };
 id = requestAnimationFrame(step);
 return () => cancelAnimationFrame(id);
 }, [leaving?.key]); // eslint-disable-line react-hooks/exhaustive-deps

 /* Le bolle "per te" non si perdono per sbaglio: lo swipe chiede conferma. */
 const requestSkip = useCallback((item, dx, dy) => {
 if (item.taggedForMe) { springBack(); setConfirm(item); return; }
 doSkip(item, dx, dy);
 }, [doSkip, springBack]);

 const doPop = useCallback((item) => {
 if (performance.now() < lockUntil.current) return;
 if (!canPop(item)) {
 setShaking(true);
 clearTimeout(timers.current.shake);
 timers.current.shake = setTimeout(() => setShaking(false), 420);
 onLimit?.(item);
 return;
 }
 lockUntil.current = performance.now() + SKIP_LOCK_MS;
 setPopping(true);
 // La bolla esce dal feed quando il genitore la rimuove (scoppio riuscito). Se lo scoppio
 // fallisce (scoppi finiti, errore di rete) la bolla torna visibile dopo un istante.
 clearTimeout(timers.current.popReset);
 timers.current.popReset = setTimeout(() => setPopping(false), 1800);
 clearTimeout(timers.current.pop);
 timers.current.pop = setTimeout(() => {
 streak.current = 0;
 setNudge(false);
 finishHint();
 onPop?.(item);
 if (item.sealed) markHandled(item.id); // le capsule chiuse non si consumano: non restano in cima
 }, 180);
 }, [canPop, onPop, onLimit, markHandled, finishHint]);

 /* ---- gesti (nessun setState durante il trascinamento) ---- */
 const onPointerDown = (e) => {
 if (!current || paused || performance.now() < lockUntil.current) return;
 if (e.pointerType === "mouse" && e.button !== 0) return;
 if (e.target.closest?.("button, a, input, textarea")) return; // toast e conferma restano cliccabili
 e.currentTarget.setPointerCapture?.(e.pointerId);
 dragRef.current = {
 id: e.pointerId, x0: e.clientX, y0: e.clientY, t0: performance.now(),
 dx: 0, dy: 0, max: 0, moved: false, size: bubbleRef.current?.offsetWidth || 300,
 onBubble: Boolean(e.target.closest?.(".bl-seq-bubble")), // il tocco scoppia solo se è sulla bolla
 };
 sim.current.size = dragRef.current.size;
 if (dragRef.current.onBubble) bubbleRef.current?.classList.add("is-pressed"); // si schiaccia sotto il dito
 };

 const onPointerMove = (e) => {
 const d = dragRef.current;
 if (!d || d.id !== e.pointerId) return;
 d.dx = e.clientX - d.x0;
 d.dy = e.clientY - d.y0;
 const dist = Math.hypot(d.dx, d.dy);
 d.max = Math.max(d.max, dist);
 if (!d.moved) {
 if (dist < DRAG_START_PX) return;
 d.moved = true;
 unpress(); // la pressione si rilascia con un rimbalzo e inizia il trascinamento
 }
 const S = sim.current, calm = isCalm();
 S.tx = d.dx; S.ty = d.dy; S.k = calm ? 900 : 420; S.c = calm ? 60 : 30; // il dito tira la bolla con una molla
 runSim();
 };

 const onPointerUp = (e) => {
 const d = dragRef.current;
 if (!d || d.id !== e.pointerId || !current) return;
 dragRef.current = null;
 const dur = Math.max(1, performance.now() - d.t0);
 const dist = Math.hypot(d.dx, d.dy);

 if (!d.moved) {
 // tra 4 e 14 px il gesto è ambiguo: non scoppia e non respinge
 unpress();
 if (d.max < TAP_MAX_MOVE_PX && dur < TAP_MAX_MS) { if (d.onBubble) doPop(current); }
 return;
 }
 const isSwipe = dist > d.size * SWIPE_RATIO || (dist / dur > SWIPE_SPEED && dist > 40);
 if (isSwipe) requestSkip(current, d.dx, d.dy);
 else springBack();
 };

 const onPointerCancel = () => { dragRef.current = null; unpress(); springBack(); };

 const onKeyDown = (e) => {
 if (!current) return;
 if (e.key === "Enter" || e.key === " ") { e.preventDefault(); doPop(current); return; }
 const dir = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
 if (dir) { e.preventDefault(); requestSkip(current, dir[0], dir[1]); }
 };

 /* ---- render ---- */
 const exhausted = !current;
 const stopTouch = (e) => e.stopPropagation(); // il drag della bolla non deve far partire il pull-to-refresh
 const announce = current
 ? `Bolla: ${currentKind.label}${current.title ? ", " + trimText(current.title, MAX_TITLE_CHARS) : currentKind.hook && current.hook ? ", " + trimHook(current.hook) : ""}`
 : "Nessuna bolla da mostrare";

 return (
 <section ref={stageRef} className={`bl-seq ${paused ? "is-paused" : ""}${CLEAR_PREVIEW ? " bl-seq--clear" : ""}`} aria-label="Bolle da scoprire">
 <style>{CSS}</style>
 <p className="bl-seq-sr" aria-live="polite">{announce}</p>

 {/* micro-bolle cosmiche decorative: fluttuano indipendentemente dal feed */}
 <div className="bl-seq-universe" aria-hidden="true">
 {Array.from({ length: 14 }, (_, i) => <i key={i} className={`bl-seq-micro bl-seq-micro--${i % 7}`} />)}
 </div>

 {/* bolle successive sullo sfondo: si vede che dietro a quella davanti ce ne sono altre */}
 {ghosts.map((g, i) => (
 <div key={g.id} className={`bl-seq-slot bl-seq-ghost bl-seq-ghost--${i}${isSystemItem(g) ? " is-system" : ""}`} aria-hidden="true">
 <div className="bl-seq-ghost-in">
 <div className="bl-seq-float"><BubbleFace item={g} kind={getKind(g)} small /></div>
 </div>
 </div>
 ))}

 {/* bolla respinta che si allontana lentamente */}
 {leaving && (
 <div className="bl-seq-slot" aria-hidden="true">
 <div
 key={leaving.key}
 ref={leaveRef}
 className="bl-seq-leaving"
 style={{ transform: `translate3d(${leaving.from.x}px,${leaving.from.y}px,0)` }}
 >
 <BubbleFace item={withMedia(leaving.item)} kind={getKind(leaving.item)} />
 </div>
 </div>
 )}

 {/* bolla corrente */}
 {current && (
 <div className="bl-seq-slot">
 <div
 key={current.id}
 ref={bubbleRef}
 role="button"
 tabIndex={0}
 aria-label={announce}
 className={[
 "bl-seq-bubble",
 isFirst ? "is-first" : "",
 popping ? "is-popping" : "",
 shaking ? "is-shaking" : "",
 current.rare ? "is-rare" : "",
 current.taggedForMe ? "is-tagged" : "",
 isSystemItem(current) ? "is-system" : "",
 ].join(" ")}
 style={{ "--h": currentKind.hue, pointerEvents: "auto", borderRadius: "50%" }}
 onKeyDown={onKeyDown}
 onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerCancel}
 onTouchStart={stopTouch} onTouchMove={stopTouch} onTouchEnd={stopTouch} onTouchCancel={stopTouch}
 onContextMenu={(e) => e.preventDefault()}
 >
 <div className="bl-seq-float">
 <span className="bl-seq-halo" aria-hidden="true" />
 {current.taggedForMe && <span className="bl-seq-ring" aria-hidden="true" />}
 <BubbleFace item={withMedia(current)} kind={currentKind} live={!paused && !popping} />
 {popping && <span className="bl-seq-burst-ring" aria-hidden="true" />}
 </div>
 </div>
 {chain && !popping && (
 <div className="bl-seq-chain" key={`chain-${current.id}`} style={{ "--h": currentKind.hue }}>
 <ChainOrbs count={chain.count} hue={currentKind.hue} />
 </div>
 )}
 </div>
 )}

 {/* fine feed */}
 {exhausted && !leaving && (
 <div className="bl-seq-end" style={{ pointerEvents: "auto" }}>
 <span className="bl-seq-end-orb" aria-hidden="true"></span>
 {renderEnd ? renderEnd({ popsLeft }) : (
 <>
 <strong>{popsLeft <= 0 ? "Per oggi hai finito gli scoppi" : "Hai visto tutte le bolle"}</strong>
 <span>{popsLeft <= 0 ? "Domani torni con nuovi scoppi." : "Torna tra poco: ne arrivano di nuove."}</span>
 </>
 )}
 </div>
 )}

 {/* cosa si può fare: sempre visibile, discreto */}
 {current && !confirm && (
 <p className={`bl-seq-hint${chain && !popping ? " has-chain" : ""}`}>
 {Number.isFinite(popsLeft) && popsLeft <= 0
 ? "Scoppi finiti per oggi · scorri per vedere le altre bolle"
 : "Tocca per scoppiare · Scorri per passare"}
 </p>
 )}

 {/* suggerimento dopo molti swipe di fila */}
 {nudge && (
 <div className="bl-seq-toast" role="status" style={{ pointerEvents: "auto" }}>
 <span>Niente ti ispira? Prova le bolle vicino a te.</span>
 <button type="button" onClick={() => { setNudge(false); onNudgeNearby?.(); }}>Vicino a me</button>
 </div>
 )}

 {/* conferma per le bolle in cui sei taggato */}
 {confirm && (
 <div className="bl-seq-confirm" role="alertdialog" aria-label="Bolla per te" style={{ pointerEvents: "auto" }}>
 <p> Questa bolla è per te. Vuoi davvero passare?</p>
 <div>
 <button type="button" className="is-primary" onClick={() => { const it = confirm; setConfirm(null); doPop(it); }}>Scoppia</button>
 <button type="button" onClick={() => { const it = confirm; setConfirm(null); doSkip(it); }}>Passa comunque</button>
 </div>
 </div>
 )}

 </section>
 );
}

/* =====================================================================
 Chiamate alle RPC del file bolle_feed_redesign.sql
 const api = feedApi(supabase);
 ===================================================================== */
export function feedApi(supabase) {
 const quiet = (p) => Promise.resolve(p).then(() => {}, () => {});
 return {
 /** Ordine di ranking: restituisce [{ bubble_id, rank_score, preview_blur, tag_count, tagged_for_me }] */
 async sequence(limit = 30) {
 const { data, error } = await supabase.rpc("bolle_feed_sequence", { p_limit: limit });
 if (error) throw error;
 return data || [];
 },
 skip: (bubbleId) => quiet(supabase.rpc("bolle_feed_skip", { p_bubble_id: bubbleId })),
 /** Da chiamare allo scoppio: restituisce l'id sessione (null se sei l'autore) */
 async startSession(bubbleId, source = "home") {
 const { data } = await supabase.rpc("bolle_open_session_start", { p_bubble_id: bubbleId, p_source: source });
 return data || null;
 },
 /** Reazione, voto, risposta, condivisione */
 interact: (sessionId) => (sessionId ? quiet(supabase.rpc("bolle_open_session_interact", { p_session: sessionId })) : null),
 /** Alla chiusura del viewer: millisecondi trascorsi dentro la bolla */
 endSession: (sessionId, dwellMs) =>
 (sessionId ? quiet(supabase.rpc("bolle_open_session_end", { p_session: sessionId, p_dwell_ms: Math.round(dwellMs) })) : null),
 /** Testo in sovrimpressione: visibile solo dopo lo scoppio */
 async overlays(bubbleId) {
 const { data } = await supabase.rpc("bolle_bubble_overlays", { p_bubble_id: bubbleId });
 return Array.isArray(data) ? data : [];
 },
 setPreview: (bubbleId, dataUri) => supabase.rpc("bolle_set_preview_blur", { p_bubble_id: bubbleId, p_data_uri: dataUri }),
 };
}

/* =====================================================================
 Genera la miniatura sfocata (40×40 JPEG, ~2 KB) al momento della pubblicazione.
 source: File/Blob immagine, <img> o <video> (primo fotogramma).
 Normalizza la luminosità, così foto molto scure o molto chiare restano leggibili.
 ===================================================================== */
export async function makeBlurPreview(source, size = 40) {
 let drawable = source, sw, sh, bitmap = null;
 if (source instanceof Blob) {
 bitmap = await createImageBitmap(source);
 drawable = bitmap; sw = bitmap.width; sh = bitmap.height;
 } else {
 sw = source.videoWidth || source.naturalWidth || source.width;
 sh = source.videoHeight || source.naturalHeight || source.height;
 }
 const canvas = document.createElement("canvas");
 canvas.width = canvas.height = size;
 const ctx = canvas.getContext("2d", { willReadFrequently: true });
 const side = Math.min(sw, sh); // ritaglio quadrato centrato
 ctx.drawImage(drawable, (sw - side) / 2, (sh - side) / 2, side, side, 0, 0, size, size);
 bitmap?.close?.();

 const img = ctx.getImageData(0, 0, size, size);
 const px = img.data;
 let sum = 0;
 for (let i = 0; i < px.length; i += 4) sum += 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
 const mean = sum / (px.length / 4);
 const shift = (128 - mean) * 0.5; // correzione a metà strada
 for (let i = 0; i < px.length; i += 4) {
 px[i] = Math.max(0, Math.min(255, px[i] + shift));
 px[i + 1] = Math.max(0, Math.min(255, px[i + 1] + shift));
 px[i + 2] = Math.max(0, Math.min(255, px[i + 2] + shift));
 }
 ctx.putImageData(img, 0, 0);
 return canvas.toDataURL("image/jpeg", 0.6);
}

/* ------------------------------ stili ------------------------------ */
/* Prefisso bl-seq-: nessun conflitto con bolle.css. Niente backdrop-filter; un solo blur statico sui livelli immagine. */
const CSS = `
.bl-seq{position:relative;width:100%;height:100%;min-height:360px;overflow:hidden;
 touch-action:none;user-select:none;-webkit-user-select:none;--p:0;
 --size:max(250px,min(96vw,calc(100svh - 430px - env(safe-area-inset-top) - env(safe-area-inset-bottom)),600px));--cy:46%;font-family:inherit}
.bl-seq.is-paused{visibility:hidden}
.bl-seq-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}

.bl-seq-slot{position:absolute;left:50%;top:var(--cy);width:var(--size);aspect-ratio:1;translate:-50% -50%}

/* Bolle successive sullo sfondo: più piccole, più trasparenti, una a destra in alto e una a sinistra (tagliata dal bordo).
 L'elemento esterno si sposta con una transizione quando la coda avanza (la seconda diventa la prima);
 quello interno reagisce al trascinamento (--p) senza transizione, così segue il dito. */
.bl-seq-ghost{pointer-events:none;
 transition:translate .75s var(--bl-spring-soft,cubic-bezier(.3,1.25,.6,1)),scale .75s var(--bl-spring-soft,cubic-bezier(.3,1.25,.6,1)),opacity .5s ease}
.bl-seq-ghost--0{translate:calc(-50% + min(50%, 50vw - 44px)) calc(-50% - 46%);scale:.26;opacity:.92}
.bl-seq-ghost--1{translate:calc(-50% - min(54%, 50vw - 34px)) calc(-50% + 47%);scale:.2;opacity:.74}
.bl-seq-ghost-in{position:absolute;inset:0;scale:calc(1 + var(--p) * .16);opacity:calc(.8 + var(--p) * .2);
 animation:bl-seq-ghost-pop .8s var(--bl-spring-soft,cubic-bezier(.3,1.25,.6,1)) .1s backwards}
.bl-seq-ghost--1 .bl-seq-ghost-in{scale:calc(1 + var(--p) * .06)}
@keyframes bl-seq-ghost-pop{from{scale:.2;opacity:0}}
.bl-seq-ghost .bl-seq-float{animation-duration:9s;animation-delay:-3s}
.bl-seq-ghost--1 .bl-seq-float{animation-duration:11s;animation-delay:-6s}

.bl-seq-bubble{position:absolute;inset:0;cursor:grab;touch-action:none;will-change:transform;
 animation:bl-seq-in .78s var(--bl-spring-soft,cubic-bezier(.3,1.25,.6,1)) both}
.bl-seq-bubble:active{cursor:grabbing}
.bl-seq-bubble:focus-visible{outline:3px solid #c9bbff;outline-offset:8px;border-radius:50%}
/* la bolla successiva «passa avanti» dalla posizione in cui stava sullo sfondo (in alto a destra) e si assesta con un rimbalzo */
@keyframes bl-seq-in{from{scale:.26;translate:min(50%, 50vw - 44px) -46%;opacity:.6}35%{opacity:1}to{scale:1 1;translate:0 0;opacity:1}}
/* la primissima bolla non ha una posizione di partenza: si gonfia sul posto */
.bl-seq-bubble.is-first{animation-name:bl-seq-first}
@keyframes bl-seq-first{from{scale:.55;opacity:0}to{scale:1 1;opacity:1}}

.bl-seq-float{position:absolute;inset:0;animation:bl-seq-float 6s ease-in-out infinite}
/* La bolla davanti fluttua su un percorso morbido (x e y con ritmi diversi), respira (si gonfia e si sgonfia, con un lieve ovale) e oscilla di pochi gradi.
 Tre animazioni indipendenti su translate / scale / rotate: la somma non si ripete in modo evidente. Ampiezze relative al diametro. */
.bl-seq-bubble .bl-seq-float{animation:bl-seq-bob 9s ease-in-out infinite,bl-seq-breathe 5.4s ease-in-out infinite,bl-seq-tilt 13s ease-in-out infinite}
@keyframes bl-seq-bob{
 0%,100%{translate:0 0}
 25%{translate:calc(var(--size) * .014) calc(var(--size) * -.028)}
 50%{translate:calc(var(--size) * -.006) calc(var(--size) * -.046)}
 75%{translate:calc(var(--size) * -.016) calc(var(--size) * -.014)}}
@keyframes bl-seq-breathe{
 0%,100%{scale:1 1}
 28%{scale:1.036 1.02}
 52%{scale:1.014 1.042}
 78%{scale:.984 1.004}}
@keyframes bl-seq-tilt{0%,100%{rotate:-1.1deg}50%{rotate:1.3deg}}
/* alone che respira insieme alla bolla: la fa risaltare sullo sfondo */
.bl-seq-halo{position:absolute;inset:-13%;border-radius:50%;pointer-events:none;
 background:radial-gradient(circle closest-side,transparent 68%,hsla(calc(var(--h,215) + 30),95%,72%,.3) 82%,hsla(calc(var(--h,215) + 5),95%,66%,.14) 92%,transparent 100%);
 animation:bl-seq-halo 5.4s ease-in-out infinite}
@keyframes bl-seq-halo{0%,100%{opacity:.6;scale:.98}45%{opacity:1;scale:1.045}}
html.bl-eco .bl-seq-halo{animation:none}
@keyframes bl-seq-float{0%,100%{translate:0 0;scale:1 1}50%{translate:0 -9px;scale:1.018 .982}}

/* ---------- La faccia: sfera di vetro scuro con bordo iridescente ----------
 Riusa .bl-bubble di bolle.css (che usa molti !important): qui i selettori hanno più specificità. */
.bl-seq-face{position:absolute;inset:0;width:100%;height:100%;cursor:inherit;overflow:hidden}
.bl-seq .bl-seq-face.bl-seq-face.bl-bubble{
 --k:calc((var(--h) - 215) * .08);--rim:7%;
 display:block!important;border:0!important;border-radius:50%!important;overflow:hidden!important;
 background:transparent!important;background-color:transparent!important;
 box-shadow:
 inset 0 0 0 calc(var(--size) * .003) rgba(230,236,255,.34),
 inset 0 0 calc(var(--size) * .05) rgba(190,205,255,.16),
 0 0 calc(var(--size) * .06) rgba(150,140,255,.14)!important;
 filter:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
.bl-seq .bl-seq-ghost .bl-seq-face.bl-seq-face.bl-bubble{--rim:13%;
 background:transparent!important;
 box-shadow:inset 0 0 0 2px rgba(210,220,255,.35),inset 0 0 20px 3px rgba(170,170,255,.2),0 0 24px rgba(126,104,255,.18)!important}
.bl-seq .bl-seq-bubble.is-rare .bl-seq-face.bl-seq-face.bl-bubble{
 box-shadow:inset 0 0 0 2px rgba(255,214,120,.9),inset 0 0 calc(var(--size) * .1) rgba(244,197,66,.55),
 0 0 calc(var(--size) * .14) rgba(244,197,66,.55),0 calc(var(--size) * .07) calc(var(--size) * .22) rgba(4,2,26,.5)!important}
.bl-seq-face:hover,.bl-seq-face:active{scale:1}
/* pressione: la bolla si schiaccia come gelatina e, al rilascio, torna con un rimbalzo */
.bl-seq-bubble .bl-seq-face{transition:scale .55s var(--bl-spring,cubic-bezier(.34,1.56,.64,1))}
.bl-seq-bubble.is-pressed .bl-seq-face{scale:.92 .89;transition:scale .14s ease-out}

/* Bordo iridescente: blu, viola, magenta, ciano (solo una sfumatura per tipo di bolla, così restano armoniche) che ruota piano */
.bl-seq .bl-seq-face .bl-liquid-film{position:absolute;z-index:1;inset:0;border-radius:0;opacity:.95;
 background:conic-gradient(from 0deg,
 hsla(calc(224 + var(--k)),95%,64%,.9),hsla(calc(262 + var(--k)),90%,68%,.85),hsla(calc(305 + var(--k)),90%,70%,.7),
 hsla(calc(190 + var(--k)),95%,66%,.8),hsla(calc(240 + var(--k)),92%,66%,.9),hsla(calc(290 + var(--k)),90%,68%,.75),hsla(calc(224 + var(--k)),95%,64%,.9));
 -webkit-mask-image:radial-gradient(circle closest-side,transparent 0 80%,rgba(0,0,0,.3) 90%,#000 98%,#000 100%);
 mask-image:radial-gradient(circle closest-side,transparent 0 80%,rgba(0,0,0,.3) 90%,#000 98%,#000 100%);
 animation:bl-seq-film 40s linear infinite}
@keyframes bl-seq-film{to{rotate:360deg}}
/* anello interno sottile */
.bl-seq .bl-seq-face.bl-seq-face.bl-bubble::before{inset:2.4%;border:0;border-radius:50%;z-index:2;
 box-shadow:inset 0 0 0 1px rgba(214,200,255,.2),inset 0 0 calc(var(--size) * .05) rgba(150,130,255,.25)}
/* Riflessi a mezzaluna lungo il bordo: bianco in alto a sinistra, ciano a sinistra, rosa in basso a destra */
.bl-seq .bl-seq-face.bl-seq-face.bl-bubble::after,
.bl-seq .bl-seq-face .bl-bubble-glint,
.bl-seq .bl-seq-face .bl-bubble-reflection{content:"";position:absolute;top:1.2%;left:1.2%;right:1.2%;bottom:1.2%;width:auto;height:auto;
 border-radius:50%;transform:none;filter:none!important;pointer-events:none;z-index:4;
 -webkit-mask-image:radial-gradient(circle closest-side,transparent calc(100% - var(--rim) - 1%),#000 calc(100% - var(--rim)),#000 97%,transparent 100%);
 mask-image:radial-gradient(circle closest-side,transparent calc(100% - var(--rim) - 1%),#000 calc(100% - var(--rim)),#000 97%,transparent 100%)}
.bl-seq .bl-seq-face.bl-seq-face.bl-bubble::after{
 background:conic-gradient(from 292deg,rgba(255,255,255,0) 0deg,rgba(255,255,255,.95) 22deg,rgba(214,226,255,.55) 44deg,rgba(255,255,255,0) 74deg,rgba(255,255,255,0) 360deg)}
.bl-seq .bl-seq-face .bl-bubble-reflection{
 background:conic-gradient(from 222deg,rgba(120,230,255,0) 0deg,rgba(120,230,255,.75) 26deg,rgba(150,190,255,.4) 52deg,rgba(120,230,255,0) 74deg,rgba(255,255,255,0) 360deg)}
.bl-seq .bl-seq-face .bl-bubble-glint{
 background:conic-gradient(from 96deg,rgba(255,160,230,0) 0deg,rgba(255,170,235,.8) 24deg,rgba(190,150,255,.55) 52deg,rgba(130,200,255,.3) 76deg,rgba(255,255,255,0) 100deg,rgba(255,255,255,0) 360deg)}
.bl-seq .bl-seq-face .bl-kind-fx{opacity:.5}

/* Ritaglio circolare dei livelli immagine: Safari/WebKit ignora border-radius + overflow:hidden quando i figli sono animati con filter/blend. */
.bl-seq-clip{position:absolute;inset:0;z-index:0;border-radius:50%;overflow:hidden;isolation:isolate;pointer-events:none;
 clip-path:circle(50% at 50% 50%);-webkit-mask-image:-webkit-radial-gradient(white,black)}
/* ---------- Contenuto nella bolla (foto, GIF, video) + ottica della pellicola ----------
 Il contenuto si vede nitido e quasi indisturbato: la deformazione (lente, sul canvas) è lieve e solo verso il bordo.
 Sopra, tre effetti reali di una pellicola sottile: 1) riflessione di Fresnel, 2) interferenza a film sottile, 3) frangia cromatica. */
/* Anteprima = miniatura piccola ingrandita: serve solo il blur minimo per fondere i blocchi, così si capisce ancora cosa c'è dentro.
 Regola --bl-seq-poster-blur (frazione della bolla): più basso = più nitido. Scala 1,1: tiene fuori dal cerchio il bordo schiarito.
 Un solo blur statico per bolla (nessun backdrop-filter, nessuna animazione): costo trascurabile. */
.bl-seq-poster{position:absolute;inset:-3%;z-index:0;background-size:cover;background-position:center;
 image-rendering:auto;filter:blur(calc(var(--size) * var(--bl-seq-poster-blur,.014))) saturate(1.12) contrast(1.04);transform:scale(1.1)}
/* bolle sullo sfondo: sono ridotte a ~1/4, quindi blur ancora più lieve */
.bl-seq-ghost .bl-seq-poster{--bl-seq-poster-blur:.008}
/* bolle sullo sfondo: il testo (anche delle frasi di sistema) si intravede, senza etichetta né barra */
.bl-seq-copy--ghost .bl-seq-pill,.bl-seq-copy--ghost .bl-seq-bar{display:none}
.bl-seq-copy--ghost{filter:blur(calc(var(--size) * .003));opacity:.88}
.bl-seq .bl-seq-ghost .bl-seq-copy .bl-seq-hook{font-size:clamp(26px,calc(var(--size) * .1),46px);line-height:1.12;-webkit-line-clamp:4}
/* Contenuto NITIDO attraverso la pellicola (trasparente, solo la lente fisica del canvas lo deforma appena).
 Un solo filtro sul gruppo sorgente+canvas (GPU). Scala 1,07: il bordo sfumato dal blur resta fuori dal cerchio.
 Allo scoppio il blur si dissolve: il contenuto «si apre». Regola --bl-seq-blur per cambiare quanto si intravede. */
.bl-seq-blurwrap{position:absolute;inset:0;z-index:1;pointer-events:none;
 filter:blur(var(--bl-seq-blur,0px));transition:filter .3s ease-out}
.bl-seq-bubble.is-popping .bl-seq-blurwrap{filter:blur(0)}
.bl-seq-media{position:absolute;inset:0;z-index:1;width:100%;height:100%;display:block;pointer-events:none;user-select:none;-webkit-user-select:none}
.bl-seq-media--src{object-fit:cover}
.bl-seq-media--lens{z-index:2;opacity:0;transition:opacity .3s ease}
.bl-seq-media--lens.is-ready{opacity:1}
/* velo minimo in basso: tiene leggibile l'etichetta sul contenuto chiaro, senza scurire la bolla */
.bl-seq-scrim{position:absolute;inset:0;z-index:3;border-radius:50%;pointer-events:none;
 background:linear-gradient(180deg,rgba(8,6,40,0) 70%,rgba(8,6,40,.14) 100%)}
/* Fresnel: al centro la pellicola riflette ~4% (è trasparente); verso il bordo la luce è radente e la riflessione sale (Schlick, (1-cosθ)^5).
 Sopra: frangia cromatica sottile sul bordo (dispersione: rosso e blu si separano di poco). */
.bl-seq-fresnel{position:absolute;inset:0;z-index:4;border-radius:50%;pointer-events:none;
 background:
 radial-gradient(circle closest-side,transparent 95.4%,rgba(255,80,110,.13) 97.2%,rgba(80,200,255,.15) 98.8%,transparent 100%),
 radial-gradient(circle closest-side,transparent 0,transparent 78%,rgba(222,232,255,.07) 86%,rgba(226,234,255,.16) 93%,rgba(236,242,255,.32) 97%,rgba(255,255,255,.55) 100%)}
/* Interferenza a film sottile: la gravità assottiglia la pellicola in alto (quasi nera/trasparente) e la ispessisce in basso,
 quindi i colori (argento → giallo paglierino → magenta → blu → ciclamino…) formano fasce orizzontali. Luce riflessa = aggiunta, non filtro:
 colori chiari e poco opachi. Scorrimento lentissimo (convezione nel film), solo transform. */
.bl-seq-thin{position:absolute;inset:0;z-index:4;border-radius:50%;pointer-events:none;overflow:hidden;
 -webkit-mask-image:radial-gradient(circle closest-side,rgba(0,0,0,.55) 0,#000 100%);mask-image:radial-gradient(circle closest-side,rgba(0,0,0,.55) 0,#000 100%)}
.bl-seq-thin i{position:absolute;left:0;right:0;top:-30%;height:160%;will-change:transform;
 background:linear-gradient(180deg,rgba(255,255,255,0) 0%,rgba(235,240,255,.12) 12%,rgba(255,236,150,.2) 26%,rgba(255,150,210,.22) 38%,
 rgba(130,150,255,.22) 50%,rgba(120,235,225,.19) 62%,rgba(200,245,140,.17) 72%,rgba(255,170,215,.22) 84%,rgba(140,215,255,.19) 94%,rgba(255,255,255,.09) 100%);
 animation:bl-seq-thin-flow 22s ease-in-out infinite alternate}
@keyframes bl-seq-thin-flow{from{transform:translateY(-5%)}to{transform:translateY(7%)}}
html.bl-eco .bl-seq-thin i{animation:none}
/* Riflesso «finestra»: una vera bolla specchia la sorgente di luce (softbox/finestra) in alto a sinistra; più debole e capovolto il riflesso della
 superficie opposta, in basso a destra. Sono riflessi: restano fermi rispetto alla luce mentre la bolla fluttua. */
.bl-seq-sheen{position:absolute;inset:0;z-index:5;border-radius:50%;pointer-events:none}
.bl-seq-sheen::before{content:"";position:absolute;left:14%;top:10%;width:31%;height:19%;border-radius:46% 54% 50% 50% / 62% 60% 40% 38%;rotate:-32deg;
 background:linear-gradient(165deg,rgba(255,255,255,.8),rgba(255,255,255,.2) 68%,rgba(255,255,255,0));filter:blur(calc(var(--size) * .005));opacity:.85}
.bl-seq-sheen::after{content:"";position:absolute;right:16%;bottom:11%;width:18%;height:8%;border-radius:50%;rotate:-32deg;
 background:linear-gradient(200deg,rgba(190,225,255,.55),rgba(255,255,255,0));filter:blur(calc(var(--size) * .008));opacity:.7}
/* con il contenuto in vista si tolgono i veli scuri e le stelline; il bordo iridescente resta ma più discreto */
.bl-seq .bl-seq-face.is-media .bl-seq-tint{display:none}
.bl-seq .bl-seq-face.is-media .bl-kind-fx{opacity:.15}
.bl-seq .bl-seq-face.is-media .bl-liquid-film{opacity:.5;
 -webkit-mask-image:radial-gradient(circle closest-side,transparent 0 90%,rgba(0,0,0,.35) 95%,#000 100%);
 mask-image:radial-gradient(circle closest-side,transparent 0 90%,rgba(0,0,0,.35) 95%,#000 100%)}
.bl-seq .bl-seq-face.is-media .bl-seq-pill{background:rgba(10,8,44,.5);border-color:rgba(255,255,255,.34);text-shadow:0 1px 4px rgba(0,0,0,.45)}
/* senza anteprima (testi, notizie, bolle vecchie): nebulosa fluida blu-viola, non un'icona */
.bl-seq-blobs{position:absolute;inset:0;z-index:0;border-radius:50%;overflow:hidden;rotate:var(--r)}
.bl-seq-blobs i{position:absolute;border-radius:50%;opacity:.85;animation:bl-seq-blob 9s ease-in-out infinite alternate}
.bl-seq-blobs i:nth-child(1){width:70%;height:70%;left:-10%;top:-8%;background:radial-gradient(circle,hsla(calc(228 + var(--k)),92%,60%,.3),transparent 70%)}
.bl-seq-blobs i:nth-child(2){width:65%;height:65%;right:-12%;bottom:-6%;background:radial-gradient(circle,hsla(calc(285 + var(--k)),88%,62%,.26),transparent 70%);animation-delay:-3s}
.bl-seq-blobs i:nth-child(3){width:50%;height:50%;left:30%;top:35%;background:radial-gradient(circle,hsla(calc(196 + var(--k)),95%,62%,.14),transparent 70%);animation-delay:-6s}
@keyframes bl-seq-blob{from{transform:translate(-6%,-4%) scale(.95)}to{transform:translate(8%,6%) scale(1.12)}}
/* piccole stelle dentro la sfera + leggero bagliore viola al centro */
.bl-seq-tint{position:absolute;inset:0;z-index:1;border-radius:50%;pointer-events:none;
 background:
 radial-gradient(circle at 24% 36%,#fff 0 .9px,transparent 1.6px),
 radial-gradient(circle at 70% 22%,rgba(255,255,255,.9) 0 .8px,transparent 1.5px),
 radial-gradient(circle at 82% 58%,#fff 0 1px,transparent 1.8px),
 radial-gradient(circle at 36% 80%,rgba(255,255,255,.85) 0 .8px,transparent 1.5px),
 radial-gradient(circle at 58% 70%,rgba(255,255,255,.7) 0 .7px,transparent 1.4px),
 radial-gradient(circle at 16% 62%,rgba(255,255,255,.75) 0 .7px,transparent 1.4px),
 radial-gradient(circle at 50% 56%,hsla(calc(255 + var(--k)),90%,62%,0),hsla(calc(255 + var(--k)),90%,62%,.22))}
.bl-seq-split{position:absolute;z-index:3;top:10%;bottom:10%;left:50%;width:1.5px;
 background:linear-gradient(180deg,rgba(255,255,255,0),rgba(255,255,255,.5) 30%,rgba(255,255,255,.5) 70%,rgba(255,255,255,0))}

/* ---------- Testi: etichetta, titolo con serif, descrizione, filo luminoso ---------- */
.bl-seq-copy{position:absolute;z-index:6;inset:0;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;
 gap:calc(var(--size) * .03);padding:0 12% 15%;pointer-events:none}
.bl-seq-copy.has-text{align-items:flex-start;justify-content:center;text-align:left;padding:16% 12% 12% 15%;overflow:hidden}
.bl-seq-copy.has-text.is-split{align-items:center;text-align:center}
.bl-seq-pill{display:inline-flex;align-items:center;gap:6px;padding:calc(var(--size) * .024) calc(var(--size) * .045);border-radius:999px;
 background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.26);box-shadow:inset 0 1px 0 rgba(255,255,255,.18);color:#fff;
 font:600 clamp(11px,calc(var(--size) * .045),14px)/1 system-ui,-apple-system,"Segoe UI",sans-serif;white-space:nowrap}
.bl-seq-hook{margin:0;color:#fff;text-shadow:0 1px 14px rgba(8,6,40,.55);
 font-family:"Iowan Old Style","Palatino Linotype",Palatino,Georgia,"Times New Roman",serif;font-weight:500;letter-spacing:-.01em;
 font-size:clamp(20px,calc(var(--size) * .092),34px);line-height:1.1;
 display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere}
/* solo il gancio (domande, «questo o quello»): un po' più piccolo, fino a 5 righe */
.bl-seq-copy--hook .bl-seq-hook{font-size:clamp(17px,calc(var(--size) * .075),28px);line-height:1.15;-webkit-line-clamp:5}
.bl-seq-body{margin:0;color:rgba(255,255,255,.88);
 font:400 clamp(12px,calc(var(--size) * .043),16px)/1.4 system-ui,-apple-system,"Segoe UI",sans-serif;
 display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere}
.bl-seq-bar{display:block;flex:none;width:52%;height:3px;border-radius:3px;margin-top:calc(var(--size) * .02);
 background:linear-gradient(90deg,#fff,rgba(255,255,255,.55) 55%,rgba(255,255,255,0));box-shadow:0 0 10px rgba(190,180,255,.6)}
.bl-seq-badge{position:absolute;z-index:6;top:7%;left:50%;translate:-50% 0;padding:5px 10px;border-radius:999px;
 background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.28);color:#fff;font:600 11px/1 system-ui,-apple-system,sans-serif;white-space:nowrap}
.bl-seq-badge--me{background:linear-gradient(135deg,rgba(255,120,210,.5),rgba(140,110,255,.5));border-color:rgba(255,255,255,.6)}

.bl-seq-ring{position:absolute;inset:-6px;border-radius:50%;border:2px solid rgba(255,255,255,.88);pointer-events:none;
 box-shadow:0 0 26px 4px rgba(190,150,255,.7),0 0 60px 8px rgba(110,140,255,.35);
 animation:bl-seq-pulse 2.2s ease-in-out infinite}
@keyframes bl-seq-pulse{0%,100%{opacity:.55}50%{opacity:1}}

.bl-seq-bubble.is-popping .bl-seq-face{animation:bl-seq-burst .36s cubic-bezier(.3,0,.3,1) forwards}
@keyframes bl-seq-burst{0%{scale:.92 .89;opacity:1}32%{scale:1.2 1.08;opacity:1}62%{scale:1.1 1.2;opacity:.85}to{scale:1.4 1.4;opacity:0}}
.bl-seq-burst-ring{position:absolute;inset:-2%;border-radius:50%;border:3px solid rgba(220,210,255,.95);pointer-events:none;animation:bl-seq-ring .45s ease-out forwards}
@keyframes bl-seq-ring{from{transform:scale(.9);opacity:.95}to{transform:scale(1.55);opacity:0}}
.bl-seq-bubble.is-shaking{animation:bl-seq-shake .42s ease both}
@keyframes bl-seq-shake{0%,100%{translate:0}20%{translate:-9px}40%{translate:9px}60%{translate:-6px}80%{translate:6px}}

/* movimento e dissolvenza della bolla respinta sono calcolati in JS (velocità del gesto) */
.bl-seq-leaving{position:absolute;inset:0;pointer-events:none;will-change:transform,opacity}

.bl-seq-confirm button,.bl-seq-toast button{min-width:44px;min-height:44px;padding:0 22px;
 border:1px solid rgba(255,255,255,.3);border-radius:999px;background:rgba(255,255,255,.12);color:#fff;
 font:700 15px/1 system-ui,-apple-system,sans-serif;cursor:pointer}
.bl-seq-confirm button.is-primary{background:linear-gradient(135deg,#6f63ff,#a15cf0);border-color:rgba(255,255,255,.4)}
.bl-seq button:focus-visible{outline:3px solid #c9bbff;outline-offset:3px}

/* suggerimento sotto la bolla (se c'è la catena di partecipanti, resta in basso per non sovrapporsi) */
.bl-seq-hint{position:absolute;left:50%;top:calc(var(--cy) + var(--size) * .5 + clamp(24px,6.4vw,44px));translate:-50% 0;margin:0;
 width:min(92%,380px);text-align:center;color:#fff;opacity:.85;
 font:500 clamp(13px,3.6vw,16px)/1.4 system-ui,-apple-system,"Segoe UI",sans-serif;text-shadow:0 1px 8px rgba(6,4,30,.6);pointer-events:none}
.bl-seq-hint.has-chain{top:auto;bottom:calc(6px + env(safe-area-inset-bottom))}
.bl-seq-toast,.bl-seq-confirm{position:absolute;left:50%;translate:-50% 0;width:min(92%,380px);
 display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:22px;
 background:rgba(22,16,66,.9);border:1px solid rgba(190,176,255,.3);box-shadow:0 10px 30px rgba(4,2,26,.5);
 color:#fff;font:600 14px/1.3 system-ui,-apple-system,sans-serif}
.bl-seq-toast{bottom:calc(66px + env(safe-area-inset-bottom));justify-content:space-between}
.bl-seq-confirm{bottom:calc(14px + env(safe-area-inset-bottom));flex-direction:column;text-align:center}
.bl-seq-confirm p{margin:0}
.bl-seq-confirm div{display:flex;gap:10px}

.bl-seq-end{position:absolute;left:50%;top:44%;translate:-50% -50%;width:min(88%,360px);box-sizing:border-box;
 display:flex;flex-direction:column;align-items:center;gap:10px;padding:30px 22px 24px;text-align:center;color:#fff;
 font-family:system-ui,-apple-system,sans-serif;border-radius:32px;
 background:linear-gradient(160deg,rgba(40,30,120,.72),rgba(96,58,176,.62));
 border:1px solid rgba(200,186,255,.4);box-shadow:0 18px 44px rgba(10,6,50,.55),0 0 40px rgba(126,104,255,.25),inset 0 1px 0 rgba(255,255,255,.3);
 animation:bl-seq-end-in .7s var(--bl-spring-soft,cubic-bezier(.3,1.25,.6,1)) both}
/* solo scala e dissolvenza: il banner è centrato con translate, che qui non va toccato */
@keyframes bl-seq-end-in{from{scale:.82;opacity:0}30%{opacity:1}to{scale:1;opacity:1}}
.bl-seq-end-orb{font-size:46px;line-height:1;animation:bl-seq-float 4.5s ease-in-out infinite;filter:drop-shadow(0 6px 14px rgba(160,140,255,.5))}
.bl-seq-end strong{font-size:21px;line-height:1.2;text-shadow:0 1px 8px rgba(20,10,70,.5)}
.bl-seq-end span{color:#efe8ff;opacity:1;font-size:15px;line-height:1.35}
.bl-seq-end .bl-seq-end-orb{font-size:46px}
.bl-seq-end button{max-width:100%}

@media (prefers-reduced-motion:reduce){
 .bl-seq-blobs i,.bl-seq-thin i,.bl-seq-float,.bl-seq-ring,.bl-seq-bubble,.bl-seq-end-orb,.bl-seq-end,
 .bl-seq-ghost-in,.bl-seq-face .bl-liquid-film{animation:none!important}
 .bl-seq-bubble .bl-seq-face,.bl-seq-ghost{transition:none}
}

/* ---------- Galassia viva e bolle di sistema trasparenti ---------- */
.bl-seq{isolation:isolate}
.bl-seq-universe{position:absolute;inset:0;z-index:0;overflow:hidden;pointer-events:none}
.bl-seq-micro{position:absolute;display:block;width:var(--d);height:var(--d);left:var(--x);top:var(--y);
 border-radius:50%;border:1px solid rgba(225,232,255,.42);
 background:radial-gradient(circle at 30% 24%,rgba(255,255,255,.42),rgba(190,190,255,.07) 34%,rgba(130,145,255,.025) 70%,transparent 100%);
 box-shadow:inset 1px 1px 4px rgba(255,255,255,.25),inset -2px -3px 6px rgba(155,145,255,.12),0 0 12px rgba(170,165,255,.13);
 opacity:var(--a);will-change:transform;animation:bl-seq-cosmic-drift var(--t) ease-in-out var(--delay) infinite alternate}
.bl-seq-micro::after{content:"";position:absolute;left:23%;top:17%;width:24%;height:11%;border-radius:50%;
 background:rgba(255,255,255,.65);filter:blur(1px);rotate:-32deg}
.bl-seq-micro--0{--d:9px;--x:8%;--y:18%;--a:.48;--t:13s;--delay:-3s}
.bl-seq-micro--1{--d:15px;--x:82%;--y:23%;--a:.38;--t:17s;--delay:-9s}
.bl-seq-micro--2{--d:6px;--x:23%;--y:68%;--a:.55;--t:11s;--delay:-5s}
.bl-seq-micro--3{--d:12px;--x:91%;--y:72%;--a:.4;--t:19s;--delay:-12s}
.bl-seq-micro--4{--d:7px;--x:67%;--y:13%;--a:.34;--t:15s;--delay:-7s}
.bl-seq-micro--5{--d:18px;--x:5%;--y:82%;--a:.3;--t:21s;--delay:-15s}
.bl-seq-micro--6{--d:5px;--x:74%;--y:88%;--a:.5;--t:12s;--delay:-4s}
@keyframes bl-seq-cosmic-drift{
 0%{transform:translate3d(0,12px,0) scale(.86)}
 35%{transform:translate3d(13px,-19px,0) scale(1.08)}
 70%{transform:translate3d(-9px,-38px,0) scale(.94)}
 100%{transform:translate3d(8px,-58px,0) scale(1.12)}
}
/* Le bolle di sistema sono membrane quasi invisibili: il contenuto sembra sospeso nello spazio. */
.bl-seq-bubble.is-system .bl-seq-face{
 background:transparent!important;background-color:transparent!important;
 box-shadow:inset 0 0 0 1px rgba(235,239,255,.24),inset 0 0 34px rgba(165,160,255,.055),0 0 26px rgba(150,145,255,.09)!important;
}
.bl-seq-bubble.is-system .bl-seq-blobs{opacity:.32}
.bl-seq-bubble.is-system .bl-seq-tint{opacity:.2}
.bl-seq-bubble.is-system .bl-seq-copy.has-text{justify-content:center;padding:15% 13% 13%}
.bl-seq-bubble.is-system .bl-seq-hook{color:rgba(255,255,255,.96);text-shadow:0 2px 16px rgba(5,3,28,.72),0 0 28px rgba(180,175,255,.22)}
.bl-seq-bubble.is-system .bl-seq-body{color:rgba(245,245,255,.82);text-shadow:0 1px 10px rgba(5,3,28,.72)}
.bl-seq-bubble.is-system .bl-seq-pill{background:rgba(220,220,255,.055);border-color:rgba(255,255,255,.18);backdrop-filter:none}
.bl-seq-ghost .bl-seq-face{background:transparent!important}
/* ---- modalità «contenuto nitido» (CLEAR_PREVIEW): toglie le sfocature delle anteprime e dei testi sullo sfondo ---- */
.bl-seq--clear .bl-seq-poster,
.bl-seq--clear .bl-seq-ghost .bl-seq-poster{--bl-seq-poster-blur:0;filter:saturate(1.1) contrast(1.03)}
.bl-seq--clear .bl-seq-copy--ghost,
.bl-seq--clear .bl-seq-ghost.is-system .bl-seq-copy--ghost{filter:none;opacity:.95}
/* contenuto di sistema leggibile subito: più grande, nitido, con un leggero velo scuro dietro il testo */
.bl-seq-bubble.is-system .bl-seq-copy.has-text{align-items:center;text-align:center;gap:calc(var(--size) * .035)}
.bl-seq-bubble.is-system .bl-seq-hook{font-size:clamp(18px,calc(var(--size) * .075),30px);line-height:1.18;-webkit-line-clamp:6}
.bl-seq-bubble.is-system .bl-seq-body{font-size:clamp(12px,calc(var(--size) * .04),15px);-webkit-line-clamp:4}
.bl-seq-bubble.is-system .bl-seq-bar{margin-inline:auto}
.bl-seq-bubble.is-system .bl-seq-face::after{content:"";position:absolute;inset:14%;border-radius:50%;z-index:5;pointer-events:none;
 background:radial-gradient(circle closest-side,rgba(8,6,40,.38),rgba(8,6,40,.18) 70%,transparent)}
.bl-seq-bubble.is-system .bl-seq-blobs{opacity:.5}
.bl-seq-bubble.is-system .bl-seq-tint{opacity:.3}
.bl-seq-ghost.is-system .bl-seq-copy--ghost{filter:none;opacity:.8}
/* ---------- Layout ordinato: suggerimento discreto, fuori dalla bolla ---------- */
.bl-seq{
 --cy:40%;
 --size:max(210px,min(82vw,calc(100svh - 500px),520px));
 padding-bottom:calc(42px + env(safe-area-inset-bottom));
 box-sizing:border-box;
}
.bl-seq-slot{z-index:2}
.bl-seq-ghost{z-index:1}
.bl-seq-universe{z-index:0}
/* «Tocca per scoppiare…» è un'indicazione secondaria: niente box né contorno. */
.bl-seq-hint{
 top:auto!important;
 bottom:calc(3px + env(safe-area-inset-bottom));
 left:50%;
 width:max-content;
 max-width:90%;
 box-sizing:border-box;
 padding:0;
 border:0;
 border-radius:0;
 background:transparent;
 color:rgba(255,255,255,.42);
 opacity:.62;
 font-size:clamp(10px,2.8vw,12px);
 line-height:1.2;
 text-shadow:none;
 box-shadow:none;
}
.bl-seq-hint.has-chain{bottom:calc(3px + env(safe-area-inset-bottom))}
.bl-seq-toast{bottom:calc(56px + env(safe-area-inset-bottom));z-index:8}
.bl-seq-confirm{bottom:calc(14px + env(safe-area-inset-bottom));z-index:8}
.bl-seq-end{z-index:5;top:40%;max-height:58%;overflow:auto}
@media(max-height:700px){
 .bl-seq{--cy:38%;--size:max(190px,min(68vw,calc(100svh - 440px),440px))}
 .bl-seq-hint{bottom:calc(3px + env(safe-area-inset-bottom));padding:0}
}
@media(min-width:700px){
 .bl-seq{--cy:42%;--size:min( min(54vw,520px), calc(100svh - 390px) )}
}

@media(prefers-reduced-motion:reduce){.bl-seq-micro{animation:none}}
`;