import React, { useState, useRef } from "react";
import AvatarImage from "../../components/AvatarImage.jsx";
import { parseChatBody, stickerUrl, chatUserHue, formatClock } from "./chatUtils.js";

export function ChatBody({ body, mine, meName, peerName, onOpenBubble, onJumpTo }) {
  const { kind, text, quote, bubble, sticker } = parseChatBody(body);
  if (kind === "sticker") {
    const src = stickerUrl(sticker);
    return src ? <img className="bl-chat-sticker" src={src} alt="Sticker" loading="lazy" draggable="false" /> : <p>🎟️ Sticker</p>;
  }
  const who = (name) => (String(name || "").toLowerCase() === String(meName || "").toLowerCase() ? "Tu" : `@${name}`);
  const quoteEl = quote ? (
    <button
      type="button"
      className="bl-chat-ref bl-chat-quote"
      onClick={() => onJumpTo?.(quote.id)}
      aria-label={`Vai al messaggio originale di ${who(quote.from)}`}
    >
      <span className="bl-chat-ref-copy">
        <b>{who(quote.from)}</b>
        <small>{quote.snippet || "Messaggio"}</small>
      </span>
    </button>
  ) : null;

  if (kind === "plain") return <>{quoteEl}<p>{text}</p></>;
  if (kind === "reply") {
    if (!bubble) return <>{quoteEl}<span className="bl-chat-tag">{mine ? "↩ Risposta a una bolla" : "↩ Risposta alla tua bolla"}</span><p>{text}</p></>;
    const icon = bubble.type === "video" ? "🎬" : bubble.type === "image" ? "📷" : "🫧";
    const canOpen = !mine; // la bolla è mia solo quando è l'altro a rispondere
    return (
      <>
        <button
          type="button"
          className="bl-chat-ref bl-chat-bubble-ref"
          disabled={!canOpen}
          onClick={() => canOpen && onOpenBubble?.(bubble)}
          aria-label={canOpen ? "Apri la bolla a cui ha risposto" : "Bolla a cui hai risposto"}
        >
          <span className="bl-chat-ref-ico" aria-hidden="true">{icon}</span>
          <span className="bl-chat-ref-copy">
            <b>{mine ? `Risposta alla bolla di @${peerName}` : "Risposta alla tua bolla"}</b>
            <small>{bubble.snippet}</small>
          </span>
          {canOpen && <em aria-hidden="true">Apri</em>}
        </button>
        {quoteEl}
        <p>{text}</p>
      </>
    );
  }
  const link = text.match(/https?:\/\/\S+/)?.[0];
  const note = text.replace(/https?:\/\/\S+/, "").trim();
  return (
    <>
      {quoteEl}
      <span className="bl-chat-tag">🫧 Bolla inoltrata</span>
      <p>{note} {link && <a href={link} target="_blank" rel="noopener noreferrer">Apri su Bolle</a>}</p>
    </>
  );
}

export default function ChatMessage({ m, highlighted, meName, peerName, onReply, onOpenBubble, onJumpTo, isGroup, avatar }) {
  const [dx, setDx] = useState(0);
  const drag = useRef(null);
  const TRIGGER = 52, MAX = 78;

  function onTouchStart(e) {
    const t = e.touches[0];
    drag.current = { x: t.clientX, y: t.clientY, lock: null, fired: false };
  }

  function onTouchMove(e) {
    const d = drag.current;
    if (!d) return;
    const t = e.touches[0], ddx = t.clientX - d.x, ddy = t.clientY - d.y;
    if (d.lock === null) {
      if (Math.abs(ddx) < 8 && Math.abs(ddy) < 8) return;
      d.lock = ddx > 0 && Math.abs(ddx) > Math.abs(ddy) * 1.4 ? "x" : "y";
    }
    if (d.lock !== "x") return;
    e.stopPropagation();
    const next = Math.min(MAX, Math.max(0, ddx) * 0.7);
    setDx(next);
    if (next >= TRIGGER && !d.fired) {
      d.fired = true;
      try {
        navigator.vibrate?.(12);
      } catch {
        /* vibrazione non disponibile */
      }
    }
  }

  function onTouchEnd() {
    const d = drag.current;
    drag.current = null;
    if (d?.lock === "x" && d.fired) onReply(m);
    setDx(0);
  }

  const senderDisplay = m.sender || m.from || peerName;
  if (m.isSystem) return <div className="bl-msg-system" data-mid={String(m.id)}>{m.body}</div>;
  const authorName = m.mine ? (meName || "") : senderDisplay;
  const hue = chatUserHue(authorName);

  return (
    <div
      className={`bl-msg-row bl-msg-colored ${m.mine ? "mine" : ""} ${highlighted ? "hl" : ""}`}
      style={{ "--bl-msg-h": hue }}
      data-mid={String(m.id)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      <span
        className="bl-msg-swipe-hint"
        aria-hidden="true"
        style={{ opacity: Math.min(1, dx / TRIGGER), transform: `scale(${0.6 + Math.min(0.4, dx / 130)})` }}
      >
        ↩
      </span>
      {isGroup && !m.mine && (
        <span className="bl-msg-avatar" title={`@${authorName}`} aria-hidden="true">
          <AvatarImage avatar={avatar} />
        </span>
      )}
      <div
        className={`bl-message-bubble ${m.mine ? "mine" : ""} ${String(m.body || "").startsWith("[[sticker|") ? "is-sticker" : ""}`}
        style={dx ? { transform: `translateX(${dx}px)`, transition: "none" } : undefined}
      >
        {isGroup && !m.mine && senderDisplay && <span className="bl-msg-sender-name">@{senderDisplay}</span>}
        <ChatBody body={m.body} mine={m.mine} meName={meName} peerName={senderDisplay} onOpenBubble={onOpenBubble} onJumpTo={onJumpTo} />
        <small className="bl-msg-time">{formatClock(m.created_at)}{m.mine && <span className="bl-msg-tick" aria-label="Inviato">✓</span>}</small>
      </div>
      <button type="button" className="bl-msg-reply-btn" onClick={() => onReply(m)} aria-label="Rispondi a questo messaggio" title="Rispondi">
        ↩
      </button>
    </div>
  );
}