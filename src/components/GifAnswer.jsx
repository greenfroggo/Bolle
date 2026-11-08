import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { supabase, errorText, KLIPY_API_KEY, GIPHY_API_KEY } from "../lib/bolleCore.jsx";

function normalizeAnswer(value) {
  if (value && typeof value === 'object') return value.answer ?? value.value ?? value.text ?? '';
  return value ?? '';
}

function gifAnswerId(value) {
  value = normalizeAnswer(value);
  const match = typeof value === 'string' && value.match(/^\[GIF:GIPHY:([a-zA-Z0-9_-]{1,80})\]$/);
  return match ? match[1] : null;
}

export function GifAnswer({ value }) {
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
