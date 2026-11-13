import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Heart, MessageCircle, Share2, Star as StarIcon, ChevronsUpDown as ScrollIcon, Send as SendIcon, X as CloseIcon, MoreHorizontal as MoreIcon, Link2 as LinkIcon } from "lucide-react";
import { supabase, errorText, ReactionIcon, playDust, bubbleShareUrl } from "../../lib/bolleCore.jsx";
import { SYSTEM_CATEGORIES } from "../../lib/systemBubbles.js";
import { EditedVideo, sanitizeVideoEdit } from "../../lib/MediaEditor.jsx";
import { makeBlurPreview } from "../../lib/SequentialFeed.jsx";
import { OverlayLayer } from "../../lib/OverlayEditor.jsx";
import useEscape from "../../hooks/useEscape.js";
import AvatarImage from "../../components/AvatarImage.jsx";
import { openUserProfile } from "../../components/UserLinkText.jsx";
import { seqApi } from "../../lib/seqApi.js";
import { reactionsFor } from "../../lib/bubbleTypes.js";
import { formatCountdown, useCapsuleRemaining } from "../../lib/capsule.js";
import { fetchFromKlipy, fetchFromGiphy } from "../../components/KlipyPicker.jsx";
import { GifAnswer } from "../../components/GifAnswer.jsx";
import ChainTimeline from "../../lib/ChainTimeline.jsx";

const HOLD_CSS = `
.bl-story-timer.is-held i,.bl-timer.is-held:after{animation-play-state:paused!important}
.bl-hold-badge{position:fixed;top:calc(env(safe-area-inset-top,0px) + 56px);left:50%;transform:translateX(-50%);z-index:100000;padding:6px 14px;border-radius:999px;background:rgba(20,20,35,.74);color:#fff;font-size:.85rem;font-weight:600;pointer-events:none;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);animation:bl-hold-in .16s ease-out}
@keyframes bl-hold-in{from{opacity:0;transform:translateX(-50%) translateY(-4px)}to{opacity:1;transform:translateX(-50%)}}
.bl-story img,.bl-viewer img,.bl-story video,.bl-viewer video{-webkit-touch-callout:none;-webkit-user-select:none;user-select:none}
@media (prefers-reduced-motion:reduce){.bl-hold-badge{animation:none}}
`;
const GIF_TAG = '[GIF:GIPHY:';


function QuestionGifPicker({ onPick, selectedUrl }) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const q = query.trim();
        const [k, g] = await Promise.allSettled([
          fetchFromKlipy(q, "gif", controller.signal),
          fetchFromGiphy(q, "gif", controller.signal),
        ]);
        const a = k.status === "fulfilled" ? k.value : [];
        const b = g.status === "fulfilled" ? g.value : [];
        const merged = [];
        for (let i = 0; i < Math.max(a.length, b.length) && merged.length < 3; i++) {
          if (i < b.length) merged.push(b[i]);
          if (i < a.length && merged.length < 3) merged.push(a[i]);
        }
        if (alive) setItems(merged.slice(0, 3));
      } catch { if (alive) setItems([]); }
      finally { if (alive && !controller.signal.aborted) setLoading(false); }
    }, query.trim() ? 300 : 0);
    return () => { alive = false; clearTimeout(timer); controller.abort(); };
  }, [query]);
  return (
    <div className="bl-question-gif-picker" onPointerDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
      <label className="bl-question-gif-search">
        <span aria-hidden="true">⌕</span>
        <input type="search" value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Cerca una GIF" aria-label="Cerca una GIF" enterKeyHint="search" />
      </label>
      {loading ? <div className="bl-question-gif-suggestions" aria-label="Caricamento GIF"><span>…</span><span>…</span><span>…</span></div>
        : items.length ? <div className="bl-question-gif-suggestions" role="listbox" aria-label="Suggerimenti GIF">
          {items.map(item => <button key={`${item.provider}-${item.id}`} type="button" role="option"
            aria-selected={selectedUrl === item.url} className={selectedUrl === item.url ? "on" : ""}
            onClick={() => onPick(item)} aria-label={`Scegli ${item.title || "GIF"}`}>
            <img src={item.url} alt="" loading="lazy" />
          </button>)}
        </div> : <small className="bl-question-gif-empty">Nessuna GIF trovata</small>}
    </div>
  );
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

/* Sondaggio: le due metà della bolla sono sovrapposte all'immagine (cerchio centrato, raggio 390/900, scarto 20/900 come in bolleChoiceFile).
   La luminosità di ciascuna metà segue il dito: 0 a riposo, 1 quando lo swipe raggiunge la soglia di conferma. */
const POLL_SWIPE_MAX = 260;
const POLL_SWIPE_COMMIT = 95;
const POLL_IDLE_PERIOD = 3200; // ms: stesso periodo dell'oscillazione CSS .bl-poll-idle
function PollHalves({ x, confirmed, idle = false }) {
  // A riposo la bolla "respira": le due metà si accendono a turno, come per dire "scegli da che parte".
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    if (!idle) { setPhase(0); return undefined; }
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return undefined;
    const t0 = performance.now();
    let id = requestAnimationFrame(function tick(now) {
      setPhase(Math.sin(((now - t0) / POLL_IDLE_PERIOD) * Math.PI * 2));
      id = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(id);
  }, [idle]);
  const idleGlow = idle ? 0.6 : 0;
  const left = idle ? Math.max(0, -phase) * idleGlow : Math.max(0, Math.min(1, -x / POLL_SWIPE_COMMIT));  // verso sinistra = opzione A
  const right = idle ? Math.max(0, phase) * idleGlow : Math.max(0, Math.min(1, x / POLL_SWIPE_COMMIT));  // verso destra = opzione B
  const chosen = confirmed ? (x < 0 ? "a" : "b") : "";
  return (
    <div className={`bl-poll-halves ${confirmed ? "is-confirmed" : ""} ${chosen ? `chose-${chosen}` : ""}`} style={{ "--ga": left.toFixed(3), "--gb": right.toFixed(3) }} aria-hidden="true">
      <span className="bl-poll-halfwrap bl-poll-halfwrap--a"><i className="bl-poll-half" /></span>
      <span className="bl-poll-halfwrap bl-poll-halfwrap--b"><i className="bl-poll-half" /></span>
    </div>
  );
}

/* Gesto suggerito: animazione trasparente in sovraimpressione (un "dito" che scivola a sinistra e a destra).
   Non cattura i tocchi (pointer-events: none) e sparisce non appena l'utente inizia lo swipe o ha votato. */
function PollSwipeGesture() {
  return (
    <div className="bl-pollcue" aria-hidden="true">
      <style>{`
        .bl-pollcue{position:absolute;inset:0;z-index:6;pointer-events:none;display:flex;align-items:center;justify-content:center;overflow:hidden}
        .bl-pollcue__stage{position:relative;width:260px;height:80px;display:flex;align-items:center;justify-content:center}
        .bl-pollcue__chev{position:absolute;top:50%;margin-top:-16px;font-size:30px;line-height:32px;font-weight:300;color:rgba(255,255,255,.55);text-shadow:0 0 10px rgba(0,0,0,.35);animation:blPgChev 4.4s ease-in-out infinite}
        .bl-pollcue__chev--l{left:0}
        .bl-pollcue__chev--r{right:0;animation-delay:2.2s}
        .bl-pollcue__trail{position:absolute;top:50%;height:26px;margin-top:-13px;width:96px;border-radius:13px;opacity:0;transform:scaleX(0)}
        .bl-pollcue__trail--l{right:50%;transform-origin:right center;background:linear-gradient(to left,rgba(255,255,255,.32),rgba(255,255,255,0));animation:blPgTrailL 4.4s ease-in-out infinite}
        .bl-pollcue__trail--r{left:50%;transform-origin:left center;background:linear-gradient(to right,rgba(255,255,255,.32),rgba(255,255,255,0));animation:blPgTrailR 4.4s ease-in-out infinite}
        .bl-pollcue__dot{position:absolute;top:50%;left:50%;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;opacity:0;
          background:radial-gradient(circle at 50% 50%,rgba(255,255,255,.55) 0%,rgba(255,255,255,.28) 55%,rgba(255,255,255,.1) 100%);
          border:1.5px solid rgba(255,255,255,.55);box-shadow:0 0 18px rgba(255,255,255,.25);animation:blPgDot 4.4s ease-in-out infinite}
        @keyframes blPgDot{
          0%{opacity:0;transform:translateX(0) scale(1.25)}
          6%{opacity:1;transform:translateX(0) scale(.9)}
          10%{opacity:1;transform:translateX(0) scale(.9)}
          30%{opacity:1;transform:translateX(-96px) scale(.9)}
          38%{opacity:0;transform:translateX(-96px) scale(1.15)}
          50%{opacity:0;transform:translateX(0) scale(1.25)}
          56%{opacity:1;transform:translateX(0) scale(.9)}
          60%{opacity:1;transform:translateX(0) scale(.9)}
          80%{opacity:1;transform:translateX(96px) scale(.9)}
          88%{opacity:0;transform:translateX(96px) scale(1.15)}
          100%{opacity:0;transform:translateX(0) scale(1.25)}
        }
        @keyframes blPgTrailL{0%,10%{opacity:0;transform:scaleX(0)}14%{opacity:1}30%{opacity:1;transform:scaleX(1)}38%,100%{opacity:0;transform:scaleX(1)}}
        @keyframes blPgTrailR{0%,60%{opacity:0;transform:scaleX(0)}64%{opacity:1}80%{opacity:1;transform:scaleX(1)}88%,100%{opacity:0;transform:scaleX(1)}}
        @keyframes blPgChev{0%,100%{opacity:.15}20%{opacity:.7}45%{opacity:.15}}
        @media (prefers-reduced-motion: reduce){
          .bl-pollcue__dot,.bl-pollcue__trail{animation:none;opacity:0}
          .bl-pollcue__chev{animation:none;opacity:.5}
        }
      `}</style>
      <div className="bl-pollcue__stage">
        <span className="bl-pollcue__chev bl-pollcue__chev--l">‹</span>
        <span className="bl-pollcue__trail bl-pollcue__trail--l" />
        <span className="bl-pollcue__trail bl-pollcue__trail--r" />
        <span className="bl-pollcue__dot" />
        <span className="bl-pollcue__chev bl-pollcue__chev--r">›</span>
      </div>
    </div>
  );
}

/* Frase guida sotto la bolla: sparisce appena si inizia lo swipe. */
function PollSwipeNote() {
  return (
    <p className="bl-poll-swipe-note" aria-live="polite">
      <style>{`
        .bl-poll-swipe-note{position:absolute;left:50%;bottom:4px;transform:translateX(-50%);margin:0;max-width:92%;z-index:6;pointer-events:none;
          padding:6px 14px;border-radius:999px;font-size:13px;font-weight:600;line-height:1.25;text-align:center;white-space:nowrap;
          color:rgba(255,255,255,.92);background:rgba(0,0,0,.28);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);text-shadow:0 1px 6px rgba(0,0,0,.35)}
        @media (max-width:360px){.bl-poll-swipe-note{white-space:normal;font-size:12px}}
      `}</style>
      Fai swipe a destra o sinistra per decidere!
    </p>
  );
}

/* Bolla "questo o quello" aperta: più grande, centrata nello spazio disponibile, con barra messaggio sopra la bottom bar.
   Gli stili vivono qui perché sono legati solo a questa schermata. */
function PollStoryStyles() {
  return <style>{`
    .bl-story--poll{--bl-poll-size:min(calc(100vw - 24px),456px,calc(100dvh - 290px))}
    .bl-story--poll .bl-story-card{display:flex;flex-direction:column}
    .bl-story--poll .bl-story-media{position:relative;flex:1 1 auto;min-height:calc(var(--bl-poll-size) + 44px);display:flex;align-items:center;justify-content:center;
      overflow:visible!important;background:transparent!important;border:0!important;border-radius:0!important;box-shadow:none!important;padding:0!important}
    .bl-story--poll .bl-story-frame{position:relative;flex:0 0 auto;
      width:var(--bl-poll-size)!important;height:var(--bl-poll-size)!important;max-width:none!important;max-height:none!important;
      margin:0 auto!important;padding:0!important;display:flex;align-items:center;justify-content:center;
      overflow:visible!important;background:transparent!important;border:0!important;border-radius:0!important;box-shadow:none!important;backdrop-filter:none!important}
    .bl-story--poll .bl-story-frame>img{width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;object-fit:contain;
      border-radius:0!important;box-shadow:none!important;background:transparent!important;clip-path:none!important;-webkit-mask:none!important;mask:none!important}
    .bl-story--poll .bl-story-bar{margin-top:auto}
    .bl-poll-idle{animation:blPollSway 3.2s ease-in-out infinite;will-change:transform}
    @keyframes blPollSway{
      0%{transform:translateX(0) rotate(0deg) scale(1)}
      25%{transform:translateX(16px) rotate(2.2deg) scale(1.015)}
      50%{transform:translateX(0) rotate(0deg) scale(1)}
      75%{transform:translateX(-16px) rotate(-2.2deg) scale(1.015)}
      100%{transform:translateX(0) rotate(0deg) scale(1)}
    }
    @media (prefers-reduced-motion: reduce){.bl-poll-idle{animation:none}}
  `}</style>;
}

export default function Viewer({ viewer, onClose, onGiftBack, onReport, onReact, reactionBusy, isFavorite, onToggleFavorite, onShare, onDiscoveryInteraction, onBlockUser, onMessage, onContinueChain, onSendReply, onShareToUser, favoriteList, scrollMode = false, scrollDir = "up", onToggleScroll = null, onScrollNav = null }) {
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
  const [vMeta, setVMeta] = useState({ id: null, d: 0 }); // durata reale del video aperto (secondi)
  const vDur = vMeta.id === viewer?.id ? vMeta.d : null; // null = metadati non ancora letti
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
  const [multipoll, setMultipoll] = useState(null); // sondaggio a più opzioni (3-5): { question, multiple, options:[{id,text,votes}], total, my_votes, ... }
  const [mpSel, setMpSel] = useState([]);
  const [mpBusy, setMpBusy] = useState(false);
  const [mpError, setMpError] = useState("");
  const pollSwipeStart = useRef(null);
  const [pollSwipeX, setPollSwipeX] = useState(0);
  const pollStage = Boolean(poll && !poll.my_vote && !viewer.isAuthor); // bolla "questo o quello" ancora da votare
  const [pollSwipeFlying, setPollSwipeFlying] = useState(false);
  const pollIdle = pollStage && !pollSwipeFlying && Math.abs(pollSwipeX) <= 24;
  const [pollGlassVisible, setPollGlassVisible] = useState(false);
  // Schermata "storia": messaggio all'autore, cuore, inoltro e menu.
  const [msg, setMsg] = useState("");
  const [msgFocus, setMsgFocus] = useState(false);
  const [msgBusy, setMsgBusy] = useState(false);
  const [msgNote, setMsgNote] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [burstKey, setBurstKey] = useState(0);
  useEffect(() => { setMsg(""); setMsgFocus(false); setMsgBusy(false); setMsgNote(""); setShareOpen(false); setMenuOpen(false); setBurstKey(0); }, [viewer.id]);
  useEffect(() => { if (viewer.reacted) setBurstKey(k => k + 1); }, [viewer.reacted]);
  useEffect(() => { if (!msgNote) return undefined; const t = setTimeout(() => setMsgNote(""), 2800); return () => clearTimeout(t); }, [msgNote]);
  const storyPaused = msgFocus || shareOpen || menuOpen || reportOpen || msg.trim().length > 0; // mentre scrivi o inoltri il timer si ferma
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
      setPollSwipeFlying(true); // «confermata»: la metà scelta si accende al massimo e pulsa, l'altra si spegne
      setPollSwipeX(dx > 0 ? POLL_SWIPE_MAX : -POLL_SWIPE_MAX);
      pollSwipeTimer.current = setTimeout(() => {
        setPollSwipeFlying(false);
        setPollSwipeX(0);
        pollSwipeBusy.current = false;
        vote(dx < 0 ? 1 : 2);
      }, 460);
    } else {
      setPollSwipeX(0);
    }
  };
  const onPollSwipeCancel = () => { pollSwipeStart.current = null; setPollSwipeX(0); setPollSwipeFlying(false); };
  useEffect(() => {let alive=true;setPoll(null);setQuestion(null);setTruth(null);setRating(null);setMultipoll(null);setMpSel([]);setMpError("");setTruthError("");setRatingError("");setRatingValue(7);setReactionCounts(null);setAnswer("");setAnswerGif(null);setShowAnswerGifs(false);setAnswerError("");setQuestionLoadError("");setPollError("");setPollGlassVisible(false);setInteractionLoading(true);
    if(viewer.gift||viewer.type==="surprise"||viewer.type==="capsule"){setInteractionLoading(false);return;} // parte subito, in parallelo con l'URL firmato (la bolla è già scoppiata)
    Promise.all([supabase.rpc("bolle_poll_result",{p_bubble_id:viewer.id}),supabase.rpc("bolle_question_public_v4",{p_bubble_id:viewer.id}),supabase.rpc("bolle_reaction_counts_v4",{p_bubble_id:viewer.id}),supabase.rpc("bolle_truth_public",{p_bubble_id:viewer.id}),supabase.rpc("bolle_rating_public",{p_bubble_id:viewer.id}),supabase.rpc("bolle_multipoll_public",{p_bubble_id:viewer.id})])
      .then(([p,q,r,t,g,m])=>{if(!alive)return;if(!m.error)setMultipoll(m.data||null);if(!t.error)setTruth(t.data||null);if(!g.error)setRating(g.data||null);if(!p.error){setPoll(p.data);if(p.data?.my_vote || viewer.isAuthor)setPollGlassVisible(true);}else setPollError(p.error.message);if(!q.error)setQuestion(q.data);else setQuestionLoadError(q.error.message);if(!r.error)setReactionCounts(r.data || {});else console.warn("Bolle: conteggi reazioni non disponibili",r.error.message);setInteractionLoading(false);})
      .catch(()=>{if(alive)setInteractionLoading(false)});
    return()=>{alive=false};},[viewer.id,viewer.gift,viewer.type,viewer.isAuthor]);
  async function sendAnswer(){if(viewer.isAuthor||answerBusy||!(answer.trim()||answerGif)||question?.my_answer)return;setAnswerBusy(true);setAnswerError("");const pAnswer = answerGif ? (answerGif.provider === "klipy" ? `[GIF:KLIPY:${answerGif.url}]` : `${GIF_TAG}${answerGif.id}]`) : answer.trim();const {data,error}=await supabase.rpc("bolle_answer_question",{p_bubble_id:viewer.id,p_answer:pAnswer});setAnswerBusy(false);if(error)setAnswerError(errorText(error));else {const updated=await supabase.rpc("bolle_question_public_v4",{p_bubble_id:viewer.id});setQuestion(updated.error?data:updated.data);onDiscoveryInteraction?.("answer");}}

  async function vote(choice){if(viewer.isAuthor || voting || poll?.my_vote)return;setVoting(true);setPollError("");const {data,error}=await supabase.rpc("bolle_vote_poll",{p_bubble_id:viewer.id,p_choice:choice});setVoting(false);if(error)setPollError(errorText(error));else {setPoll(data);setPollGlassVisible(true);onDiscoveryInteraction?.("vote");}}
  async function guessTruth(i){if(viewer.isAuthor||truthBusy||truth?.my_guess!=null)return;setTruthBusy(true);setTruthError("");const {data,error}=await supabase.rpc("bolle_guess_truth",{p_bubble_id:viewer.id,p_guess:i});setTruthBusy(false);if(error)setTruthError(errorText(error));else{setTruth(data);if(data&&data.my_guess!=null&&data.lie_index!=null)setTruthFeedback({ok:Number(data.my_guess)===Number(data.lie_index),n:Date.now()});onDiscoveryInteraction?.("vote");}}
  const mpToggle = (id) => setMpSel(prev => multipoll?.multiple ? (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]) : [id]);
  async function sendMultipoll(){if(viewer.isAuthor||mpBusy||!mpSel.length||multipoll?.my_votes?.length)return;setMpBusy(true);setMpError("");const {data,error}=await supabase.rpc("bolle_vote_multipoll",{p_bubble_id:viewer.id,p_option_ids:mpSel});setMpBusy(false);if(error)setMpError(errorText(error));else{setMultipoll(data);onDiscoveryInteraction?.("vote");}}
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
  // Pressione prolungata su una bolla aperta: il timer resta sospeso finché si tiene premuto.
  const rootRef = useRef(null);
  const holdTimer = useRef(null);
  const holdOrigin = useRef(null);
  const holdActive = useRef(false);
  const [holdPaused, setHoldPaused] = useState(false);
  const timerLeft = useRef(0); // millisecondi rimasti: dopo una pausa il timer riprende da dove era
  const timerSince = useRef(0);
  const videoWait = viewer.type === "video" && viewer.status === "ready" && !viewer.gift && vDur === null; // il timer parte quando si conosce la durata del video
  const auto = viewer.status === "ready" && !viewer.gift && viewer.type !== "capsule" && !scrollMode && !viewer.link && !videoWait; // i regali restano finché non li chiudi; in scorrimento il timer è fermo
  const suppressClickUntil = useRef(0); // dopo uno swipe il "click" finale non deve chiudere la bolla
  const canHold = auto && !viewer.chain?.root_bubble_id && !poll && !question && !truth && !rating && !multipoll && !interactionLoading && !dissolving;
  const endHold = useCallback(() => {
    clearTimeout(holdTimer.current); holdTimer.current = null; holdOrigin.current = null;
    if (holdActive.current) { holdActive.current = false; suppressClickUntil.current = Date.now() + 500; setHoldPaused(false); }
  }, []);
  const startHold = (event) => {
    if (!canHold || holdActive.current) return;
    holdOrigin.current = { x: event.clientX, y: event.clientY };
    clearTimeout(holdTimer.current);
    holdTimer.current = setTimeout(() => {
      holdTimer.current = null; holdActive.current = true; setHoldPaused(true);
      try { navigator.vibrate?.(8); } catch { /* vibrazione non disponibile */ }
    }, 320);
  };
  const dragScale = scrollMode ? 1 : 1 - Math.min(Math.max(dragY, 0) / 440, 0.72);
  const sysMeta = viewer.system ? (SYSTEM_CATEGORIES[viewer.systemCategory] || SYSTEM_CATEGORIES.curiosita) : null;
  const dissolve = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true; setDissolving(true); playDust();
    // La chiusura è un palloncino che si sgonfia (bolle-polish.css, bl-soft-close): serve il tempo di vederla finire.
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    setTimeout(() => closeRef.current(), reduce ? 250 : 820);
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
    if (!doneRef.current && !event.target.closest("button, input, textarea, select, a, [contenteditable]")) startHold(event);
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
    if (holdOrigin.current && !holdActive.current && Math.hypot(event.clientX - holdOrigin.current.x, event.clientY - holdOrigin.current.y) > 10) {
      clearTimeout(holdTimer.current); holdTimer.current = null; holdOrigin.current = null; // ha iniziato a trascinare: non è una pressione prolungata
    }
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
    endHold();
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
  const onHandlePointerCancel = () => { endHold(); dragStart.current = null; swipeActive.current = false; setIsDragging(false); const from = dragValue.current; dragValue.current = 0; springBack(Math.abs(from) > 0 ? (scrollMode ? Math.sign(from) * 90 * (1 - Math.exp(-Math.abs(from) / 190)) : from) : 0); };
  // Durata della bolla: 6 secondi; per i video quanto dura il video (o la parte scelta), al massimo 90 secondi.
  const storyMs = (() => {
    if (viewer.type !== "video") return 6000;
    const trim = vEdit?.trim;
    const start = trim ? trim.start : 0;
    const end = trim ? Math.min(trim.end, vDur || trim.end) : (vDur || 0);
    const len = Math.max(0, end - start);
    return Math.round(Math.min(90, Math.max(6, len + 0.3)) * 1000);
  })();
  useEscape(() => { if (reportOpen) setReportOpen(false); else if (shareOpen) setShareOpen(false); else if (menuOpen) setMenuOpen(false); else dissolve(); });
  useEffect(() => { timerLeft.current = storyMs; }, [viewer.id, storyMs]);
  useEffect(() => {
    if (!auto || viewer.chain?.root_bubble_id || poll || question || truth || rating || multipoll || interactionLoading || storyPaused || holdPaused) return undefined;
    const left = Math.max(0, timerLeft.current);
    timerSince.current = Date.now();
    const t = setTimeout(dissolve, left);
    return () => { clearTimeout(t); timerLeft.current = Math.max(0, left - (Date.now() - timerSince.current)); }; // in pausa il tempo rimasto si conserva
  }, [auto, viewer.id, viewer.chain?.root_bubble_id, dissolve, poll, question, truth, rating, multipoll, interactionLoading, storyPaused, holdPaused, storyMs]);
  // Pressione prolungata: rilascio ovunque (anche fuori dalla bolla), cambio bolla o chiusura.
  useEffect(() => { endHold(); return endHold; }, [viewer.id, endHold]);
  useEffect(() => {
    if (!holdPaused) return undefined;
    window.addEventListener("pointerup", endHold); window.addEventListener("pointercancel", endHold); window.addEventListener("blur", endHold);
    return () => { window.removeEventListener("pointerup", endHold); window.removeEventListener("pointercancel", endHold); window.removeEventListener("blur", endHold); };
  }, [holdPaused, endHold]);
  // Finché si tiene premuto anche il video si ferma e poi riparte; compare l'etichetta «In pausa».
  useEffect(() => {
    if (!holdPaused) return undefined;
    const vids = [...(rootRef.current?.querySelectorAll("video") || [])].filter(el => !el.paused);
    vids.forEach(el => el.pause());
    const badge = document.createElement("div");
    badge.className = "bl-hold-badge"; badge.setAttribute("role", "status"); badge.textContent = "⏸ In pausa";
    document.body.appendChild(badge);
    return () => { badge.remove(); vids.forEach(el => { Promise.resolve(el.play?.()).catch(() => {}); }); };
  }, [holdPaused]);
  useEffect(() => {
    if (typeof document === "undefined" || document.getElementById("bl-hold-css")) return;
    const st = document.createElement("style"); st.id = "bl-hold-css"; st.textContent = HOLD_CSS; document.head.appendChild(st);
  }, []);
  // Sondaggi e domande occupano tutto lo schermo; il tipo è noto già dal feed, così il layout non "salta" dopo il caricamento.
  const isSpecial = viewer.type === "surprise" || viewer.type === "capsule";
  const interactive = Boolean(poll || question || truth || rating || multipoll || questionLoadError) || (interactionLoading && ["poll", "question", "truth", "rating", "multipoll"].includes(viewer.kindHint));
  const reactionSet = useMemo(() => reactionsFor(viewer.kindHint), [viewer.kindHint]);
  const interactionPanel = (question || truth || rating || multipoll || questionLoadError) ? <div className="bl-interaction-panel">
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
    {multipoll && !viewer.gift && (() => {
      const opts = Array.isArray(multipoll.options) ? multipoll.options : [];
      const mine = Array.isArray(multipoll.my_votes) ? multipoll.my_votes : [];
      const voters = Number(multipoll.total_voters) || 0;
      const showResults = viewer.isAuthor || mine.length > 0;
      return <section className="bl-mp-panel" aria-label="Sondaggio">
        <strong>📊 {multipoll.question || "Sondaggio"}</strong>
        {!showResults ? <>
          <small className="bl-mp-hint">{multipoll.multiple ? "Puoi scegliere più risposte." : "Scegli una sola risposta."}</small>
          <div className="bl-mp-options" role={multipoll.multiple ? "group" : "radiogroup"} aria-label="Opzioni del sondaggio">
            {opts.map(o => { const on = mpSel.includes(o.id); return <button key={o.id} type="button" role={multipoll.multiple ? "checkbox" : "radio"} aria-checked={on} className={`bl-mp-option ${on ? "on" : ""} ${multipoll.multiple ? "is-multi" : ""}`} disabled={mpBusy} onClick={() => mpToggle(o.id)}>
              <span className="bl-mp-mark" aria-hidden="true">{on ? "✓" : ""}</span><span className="bl-mp-text">{o.text}</span>
            </button>; })}
          </div>
          <button type="button" className="bl-mp-send" disabled={mpBusy || !mpSel.length} onClick={sendMultipoll}>{mpBusy ? "Invio…" : mpSel.length > 1 ? `Invia ${mpSel.length} risposte` : "Invia risposta"}</button>
        </> : <div className="bl-mp-results" role="status" aria-live="polite">
          {opts.map(o => { const votes = Number(o.votes) || 0, pct = voters ? Math.round(votes * 100 / voters) : 0, isMine = mine.includes(o.id);
            return <div key={o.id} className={`bl-mp-result ${isMine ? "mine" : ""}`}>
              <div className="bl-mp-result-top"><span>{o.text}{isMine && <em>la tua risposta</em>}</span><b>{pct}%</b></div>
              <div className="bl-mp-track" aria-hidden="true"><i style={{ width: `${pct}%` }} /></div>
              <small>{votes} {votes === 1 ? "voto" : "voti"}</small>
            </div>; })}
          <small className="bl-mp-foot">{voters} {voters === 1 ? "partecipante" : "partecipanti"}{multipoll.multiple ? " · risposte multiple: le percentuali possono superare il 100%" : ""}{viewer.isAuthor ? " · il tuo sondaggio" : ""}</small>
        </div>}
        {mpError && <small role="alert">{mpError}</small>}
      </section>;
    })()}
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
    {question && !viewer.gift && <section className="bl-question-reply" aria-label="Rispondi alla domanda"><strong>🎲 La tua risposta</strong><p>{question.question}</p>{viewer.isAuthor?<div className="bl-question-thanks">Questa è la tua domanda: puoi leggere le risposte, ma non rispondere.</div>:question.my_answer?<div className="bl-question-thanks">✓ Risposta inviata: <GifAnswer value={question.my_answer}/></div>:<><textarea maxLength={280} rows={2} value={answer} onChange={e=>{setAnswer(e.target.value);setAnswerGif(null);}} placeholder="Scrivi cosa ne pensi…" aria-label="La tua risposta"/>{answerGif&&<div className="bl-giphy-selected"><img src={answerGif.url || answerGif.images?.fixed_width?.url} alt={answerGif.title||"GIF selezionata"}/><button type="button" onClick={()=>setAnswerGif(null)}>Rimuovi GIF</button></div>}<button type="button" onClick={()=>setShowAnswerGifs(v=>!v)}>{showAnswerGifs?"Nascondi GIF / Meme":"😂 Rispondi con GIF o Meme"}</button>{showAnswerGifs&&<QuestionGifPicker selectedUrl={answerGif?.url} onPick={item=>{setAnswerGif(item);setAnswer("");setShowAnswerGifs(false);}}/>}<button type="button" disabled={viewer.isAuthor||answerBusy||!(answer.trim()||answerGif)} onClick={sendAnswer}>{answerBusy?"Invio…":"Invia risposta"}</button></>}{answerError&&<small role="alert">{answerError}</small>}<small>Le nuove risposte sono pubbliche per chi ha scoppiato la bolla. Le risposte precedenti restano private.</small>{Array.isArray(question.answers)&&question.answers.length>0&&<div className="bl-v4-public-answers"><strong>💬 Risposte</strong>{question.answers.map((a,i)=><p key={i}><GifAnswer value={typeof a==="string"?a:a.answer}/></p>)}</div>}</section>}
    </div> : null;
  const chainCard = (!isSpecial && !viewer.gift && viewer.chain?.root_bubble_id) ? (
      <section className="bl-chain-card" aria-label="Bolla a catena">
        <div className="bl-chain-card-top"><span className="bl-chain-orb">🫧</span><div><strong>Questa è una Bolla a catena</strong><small>{Number(viewer.chain.participant_count || 1)} {Number(viewer.chain.participant_count || 1) === 1 ? "partecipante" : "partecipanti"} · continua il viaggio</small></div></div>
        <ChainTimeline rootId={viewer.chain.root_bubble_id} currentId={viewer.id} />
        <button type="button" onClick={onContinueChain}>＋ Aggiungi il tuo contributo</button>
      </section>
    ) : null;
  /* ---------- Schermata "storia": quella standard per ogni bolla scoppiata ---------- */
  const storyMode = !isSpecial && !viewer.gift;
  const isMediaKind = viewer.type === "image" || viewer.type === "video";
  const overlayOnMedia = Boolean(viewer.caption) && isMediaKind && !interactive;
  const canMessage = Boolean(viewer.username) && !viewer.isAuthor;
  const reactedItem = viewer.reacted ? reactionSet.find(r => r.key === viewer.reacted) : null;
  const burstEmoji = reactedItem?.emoji || ({ love: "❤️", laugh: "😆", wow: "😮", warm: "😭", sad: "🙁" })[viewer.reacted] || "❤️";
  const timerOn = auto && !viewer.chain?.root_bubble_id && !poll && !question && !truth && !rating && !multipoll && !interactionLoading && !dissolving;
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
    return <div className={`bl-story ${swipeable ? "bl-story--poll" : ""} ${multipoll ? "bl-story--mp" : ""} ${interactive ? "is-interactive" : ""} ${dissolving ? "dissolving" : ""} ${swipeClosing ? "swipe-closing" : ""} ${isDragging ? "is-dragging" : ""} ${springing ? "is-springing" : ""} ${settled ? "is-settled" : ""} ${navOut ? (navOut > 0 ? "is-nav-out-up" : "is-nav-out-down") : ""}`} style={{ "--bl-drag-y": `${dragY}px`, "--bl-drag-scale": String(dragScale) }} ref={rootRef} onContextMenu={(e) => { if (holdActive.current || holdTimer.current) e.preventDefault(); }} role="dialog" aria-modal="true" aria-label="Contenuto della bolla" onPointerDown={onHandlePointerDown} onPointerMove={onHandlePointerMove} onPointerUp={onHandlePointerEnd} onPointerCancel={onHandlePointerCancel} onClick={onBackdropClick}>
      {swipeable && <PollStoryStyles />}
      {scrollMode && <span className={`bl-nav-film ${navOut ? "bl-nav-film--out" : ""}`} key={navOut ? "film-out" : `film-${viewer.id}`} aria-hidden="true" />}
      <div className={`bl-story-card ${scrollMode ? `bl-story-card--nav-${scrollDir}` : ""}`} key={`card-${viewer.id}`}>
        {timerOn && <div className={`bl-story-timer ${storyPaused || holdPaused ? "is-held" : ""}`} style={{ "--bl-dur": `${storyMs}ms` }} aria-hidden="true"><i key={`${viewer.id}-${storyMs}`} /></div>}
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
              <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); setReportOpen(true); }}>🚩 Segnala la bolla</button>
              {viewer.username && <button type="button" role="menuitem" className="danger" onClick={() => { setMenuOpen(false); if (window.confirm(`Vuoi bloccare @${viewer.username}? Non vedrai più le sue bolle nel feed.`)) { onBlockUser?.(viewer.username); dissolve(); } }}>🚫 Blocca @{viewer.username}</button>}
            </div>}
          </div>}
          {onToggleScroll && <button type="button" className={`bl-story-icon bl-scroll-toggle ${scrollMode ? "on" : ""}`} onClick={onToggleScroll} aria-pressed={scrollMode} aria-label={scrollMode ? "Disattiva la modalità scorrimento" : "Attiva la modalità scorrimento"} title={scrollMode ? "Esci dallo scorrimento" : "Scorri le bolle"}><ScrollIcon size={22} /></button>}
          <button type="button" className="bl-story-icon" onClick={dissolve} aria-label="Chiudi"><CloseIcon size={22} /></button>
        </header>
        <div className={`bl-story-media ${swipeable ? "bl-poll-swipe-stage" : ""} ${pollSwipeFlying ? "bl-poll-swipe-flying" : ""}`} style={swipeable ? { "--bl-poll-x": `${(pollSwipeX * 0.16).toFixed(1)}px`, "--bl-poll-rotation": `${Math.max(-4, Math.min(4, pollSwipeX / 65)).toFixed(2)}deg` } : undefined} onPointerDown={poll ? onPollSwipeStart : undefined} onPointerMove={poll ? onPollSwipeMove : undefined} onPointerUp={poll ? onPollSwipeEnd : undefined} onPointerCancel={poll ? onPollSwipeCancel : undefined} onClick={stageTap} role="button" tabIndex={0} aria-label="Tocca per far sparire il contenuto" onKeyDown={(e) => !poll && !question && (e.key === "Enter" || e.key === " ") && stageTap()}>
          {viewer.status === "loading" && <p className="bl-viewer-msg">Un attimo…</p>}
          {viewer.status === "error" && <p className="bl-viewer-msg">{viewer.gone ? "Questa bolla è scaduta: il suo contenuto non esiste più." : <>Non riusciamo ad aprire questo contenuto. {viewer.loadError ? `Dettaglio: ${viewer.loadError}` : "La bolla è comunque scoppiata."}</>}</p>}
          {viewer.status === "ready" && isMediaKind && <div className={`bl-story-frame ${pollIdle ? "bl-poll-idle" : ""}`}>
            {viewer.type === "image" && <img className={[viewer.kindHint === "confession" ? "bl-unblur" : "", (viewer.kindHint === "gif" || /\.gif(\?|$)/i.test(String(viewer.url || ""))) ? "bl-gif-full" : ""].filter(Boolean).join(" ") || undefined} src={viewer.url} alt={viewer.caption || "Foto della bolla"} draggable={false} />}
            {viewer.type === "video" && vEditReady && <EditedVideo src={viewer.url} edit={vEdit} onMeta={(d) => setVMeta({ id: viewer.id, d })} />}
            {overlayOnMedia && <p className={`bl-overlay-text pos-${viewer.captionPos || "bot"}`}>{viewer.caption}</p>}
            <OverlayLayer overlays={ovs} />
            {poll && !poll.my_vote && !viewer.isAuthor && <PollHalves x={pollSwipeX} confirmed={pollSwipeFlying} idle={pollIdle} />}
            {poll && !poll.my_vote && !viewer.isAuthor && Math.abs(pollSwipeX) <= 24 && <PollSwipeGesture />}
          </div>}
          {pollStage && Math.abs(pollSwipeX) <= 24 && <PollSwipeNote />}
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
          {timerOn && storyPaused && <p className="bl-story-hint">Il timer è in pausa mentre scrivi</p>}
          {scrollMode && <p className="bl-story-hint">Scorri su e giù per cambiare bolla · tocca l&apos;immagine per chiudere</p>}
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
        {reportOpen && <ReportSheet onClose={() => setReportOpen(false)} onSubmit={(payload) => onReport?.(payload)} />}
        {shareOpen && <ShareSheet bubbleId={viewer.id} exclude={[viewer.username]} favorites={favoriteList || []} onClose={() => setShareOpen(false)} onWhatsApp={onShare} onSendToUser={onShareToUser} />}
      </div>
    </div>;
  }
  return <div className={`bl-viewer ${viewer.chain?.root_bubble_id ? "bl-viewer-chain-open" : ""} ${interactive ? "bl-viewer-interactive" : ""} ${dissolving ? "dissolving" : ""} ${swipeClosing ? "swipe-closing" : ""} ${isDragging ? "is-dragging" : ""} ${springing ? "is-springing" : ""} ${settled ? "is-settled" : ""} ${navOut ? (navOut > 0 ? "is-nav-out-up" : "is-nav-out-down") : ""}`} style={{ "--bl-drag-y": `${dragY}px`, "--bl-drag-scale": String(dragScale), "--bl-drag-progress": String(Math.min(dragY / 360, 1)) }} ref={rootRef} onContextMenu={(e) => { if (holdActive.current || holdTimer.current) e.preventDefault(); }} role="dialog" aria-modal="true" aria-label="Contenuto della bolla" onPointerDown={onHandlePointerDown} onPointerMove={onHandlePointerMove} onPointerUp={onHandlePointerEnd} onPointerCancel={onHandlePointerCancel} onClick={onBackdropClick}>
    {scrollMode && <span className={`bl-nav-film ${navOut ? "bl-nav-film--out" : ""}`} key={navOut ? "film-out" : `film-${viewer.id}`} aria-hidden="true" />}
    <div className="bl-viewer-top bl-viewer-drag-handle"
      aria-label="Trascina verso il basso per chiudere"><span className="bl-viewer-grip" aria-hidden="true" /> <span>{scrollMode ? "Scorri su o giù per cambiare bolla" : "Un momento per te · trascina giù per chiudere"}</span></div>
    {auto && !viewer.chain?.root_bubble_id && !poll && !question && !truth && !rating && !multipoll && !interactionLoading && !dissolving && <div className={`bl-timer ${storyPaused || holdPaused ? "is-held" : ""}`} key={`timer-${viewer.id}-${storyMs}`} style={{ "--bl-dur": `${storyMs}ms` }} aria-hidden="true" />}
    <div className="bl-implosion-ring" aria-hidden="true" />
    {onToggleScroll && <button type="button" className={`bl-viewer-scroll-toggle ${scrollMode ? "on" : ""}`} onClick={onToggleScroll} aria-pressed={scrollMode} aria-label={scrollMode ? "Disattiva la modalità scorrimento" : "Attiva la modalità scorrimento"} title={scrollMode ? "Esci dallo scorrimento" : "Scorri le bolle"}><ScrollIcon size={22} /></button>}
    <div key={`stage-${viewer.id}`} className={`${scrollMode ? `bl-viewer-stage--nav-${scrollDir} ` : ""}bl-viewer-stage ${poll && !poll.my_vote && !viewer.isAuthor ? "bl-poll-swipe-stage" : ""} ${pollSwipeFlying ? "bl-poll-swipe-flying" : ""}`} style={poll && !poll.my_vote && !viewer.isAuthor ? {"--bl-poll-x": `${(pollSwipeX * 0.16).toFixed(1)}px`, "--bl-poll-rotation": `${Math.max(-4, Math.min(4, pollSwipeX / 65)).toFixed(2)}deg`} : undefined} onPointerDown={poll ? onPollSwipeStart : undefined} onPointerMove={poll ? onPollSwipeMove : undefined} onPointerUp={poll ? onPollSwipeEnd : undefined} onPointerCancel={poll ? onPollSwipeCancel : undefined} onClick={interactive ? undefined : () => { if (Date.now() >= suppressClickUntil.current) dissolve(); }} role="button" tabIndex={0} aria-label="Tocca per far sparire il contenuto"
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
      {poll && !poll.my_vote && !viewer.isAuthor && Math.abs(pollSwipeX) <= 24 && <PollSwipeGesture />}
      {pollError && <small role="alert" className="bl-poll-error">{pollError}</small>}
      {pollStage && Math.abs(pollSwipeX) <= 24 && <PollSwipeNote />}
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
    <p className={`bl-once ${interactionLoading ? "is-pending" : ""}`}>{scrollMode ? "Modalità scorrimento: scorri su e giù per cambiare bolla. Tocca il contenuto per chiudere." : viewer.link ? "Tocca il contenuto per chiudere." : interactive ? "Puoi interagire finché non chiudi questa schermata." : viewer.type === "capsule" ? "Il contenuto resta nascosto finché il timer non arriva a zero." : viewer.gift ? "Una sorpresa speciale per te. Ora puoi crearne una anche tu!" : "Si polverizza tra 6 secondi. Toccala per farla sparire subito: non si riapre più. Tieni premuto per mettere in pausa."}</p>
    {viewer.gift && viewer.status === "ready" && <button type="button" className="bl-cta bl-gift-reciprocate" onClick={onGiftBack}>💌 Ricambia la sorpresa</button>}
    {reportOpen && <ReportSheet onClose={() => setReportOpen(false)} onSubmit={(payload) => onReport?.(payload)} />}
    <div className="bl-viewer-bar">{!isSpecial && !viewer.gift && <button onClick={() => setReportOpen(true)}>Segnala</button>}<button className="primary" onClick={dissolve} autoFocus>Chiudi</button></div>
  </div>;
}

const REPORT_REASONS = [["inappropriate", "Contenuto inappropriato"], ["harassment", "Molestie o bullismo"], ["violence", "Violenza"], ["spam", "Spam"], ["minor", "Minori / età"], ["privacy", "Privacy"], ["other", "Altro"]];
function ReportSheet({ onClose, onSubmit }) {
  const [reason, setReason] = useState("inappropriate"), [details, setDetails] = useState(""), [busy, setBusy] = useState(false);
  async function submit() {
    if (busy) return;
    setBusy(true);
    try { await onSubmit?.({ reason: (REPORT_REASONS.find(([id]) => id === reason) || [])[1] || "Altro", details: details.trim() }); }
    finally { setBusy(false); }
  }
  return <div className="bl-share" role="dialog" aria-modal="true" aria-label="Segnala la bolla" onClick={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()}>
    <div className="bl-share-grip" aria-hidden="true" />
    <div className="bl-share-head"><strong>Segnala la bolla</strong><button type="button" onClick={onClose} aria-label="Chiudi"><CloseIcon size={20} /></button></div>
    <p className="bl-share-title">Qual è il problema?</p>
    <ul className="bl-share-list">{REPORT_REASONS.map(([id, label]) => <li key={id} className="bl-share-row"><span className="bl-share-name">{label}</span><button type="button" className={reason === id ? "done" : ""} aria-pressed={reason === id} onClick={() => setReason(id)}>{reason === id ? "✓" : "Scegli"}</button></li>)}</ul>
    <input className="bl-share-search" type="text" maxLength={120} value={details} onChange={e => setDetails(e.target.value)} placeholder="Aggiungi un dettaglio (facoltativo)" aria-label="Dettagli della segnalazione" />
    <button type="button" className="bl-cta" disabled={busy} onClick={submit}>{busy ? "Invio…" : "Invia segnalazione"}</button>
  </div>;
}

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