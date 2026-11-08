import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

// Scarto tra orologio del dispositivo e orologio del server (aggiornato a ogni caricamento del feed).
let capsuleClockSkewMs = 0;
export function setCapsuleClockSkew(ms) { capsuleClockSkewMs = ms; }
export const capsuleNow = () => Date.now() + capsuleClockSkewMs;
const secondListeners = new Set();
let secondTimer = 0;


export function capsuleRemainingMs(bubble) {
  const t = Date.parse(bubble?.opens_at || "");
  return Number.isFinite(t) ? Math.max(0, t - capsuleNow()) : 0;
}

export function subscribeSecond(fn) {
  secondListeners.add(fn);
  if (!secondTimer) secondTimer = setInterval(() => secondListeners.forEach(f => f()), 1000);
  return () => {
    secondListeners.delete(fn);
    if (!secondListeners.size && secondTimer) { clearInterval(secondTimer); secondTimer = 0; }
  };
}

export function formatCountdown(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return [Math.floor(total / 3600), Math.floor((total % 3600) / 60), total % 60].map(n => String(n).padStart(2, "0")).join(":");
}

export function useCapsuleRemaining(bubble) {
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
