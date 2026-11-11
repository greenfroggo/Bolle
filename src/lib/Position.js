import { useEffect, useRef } from "react";

/* Posizione dell'utente ad alta precisione (GPS). Resta sul dispositivo: non viene salvata né finisce negli analytics.
   Sostituisce getPosition / positionErrorText importati da bolleCore.jsx (stessa forma: {lat, lng}, in più `accuracy` in metri). */

const geo = () => (typeof navigator !== "undefined" ? navigator.geolocation : null);
const HIGH = { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 };
const toCoords = (p) => ({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: Math.round(p.coords.accuracy || 0) });

export function distanceM(a, b) {
  const R = 6371000, rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

/* Aspetta un fix abbastanza preciso (targetAccuracy, in metri) fino a maxWait ms e restituisce il migliore ottenuto.
   I telefoni danno prima una posizione approssimativa da rete/Wi‑Fi e solo dopo qualche secondo quella GPS. */
export function getPosition({ targetAccuracy = 30, maxWait = 6000 } = {}) {
  return new Promise((resolve, reject) => {
    const g = geo();
    if (!g) { reject(Object.assign(new Error("La posizione non è disponibile su questo dispositivo."), { code: 2 })); return; }
    let best = null, done = false, id = null, timer = null;
    const finish = (fn) => { if (done) return; done = true; clearTimeout(timer); if (id != null) g.clearWatch(id); fn(); };
    id = g.watchPosition(
      (p) => {
        const c = toCoords(p);
        if (!best || c.accuracy < best.accuracy) best = c;
        if (c.accuracy <= targetAccuracy) finish(() => resolve(best));
      },
      (err) => finish(() => (best ? resolve(best) : reject(err))),
      HIGH
    );
    timer = setTimeout(() => finish(() => (best ? resolve(best) : reject(Object.assign(new Error("timeout"), { code: 3 })))), maxWait);
  });
}

export function positionErrorText(err) {
  if (err?.code === 1) return "Hai bloccato l'accesso alla posizione. Consentilo dalle impostazioni del browser o dell'app e riprova.";
  if (err?.code === 2) return "Non riesco a trovare la tua posizione. Controlla che il GPS sia attivo e riprova.";
  if (err?.code === 3) return "Il GPS ci mette troppo. Spostati all'aperto e riprova.";
  return err?.message || "Posizione non disponibile. Riprova tra poco.";
}

/* Segue la posizione solo mentre `active` è vero e la scheda è visibile (meno batteria, meno calore).
   Chiama onPosition solo se ti sei spostato di almeno minMoveM metri e sono passati minIntervalMs. */
export function useLivePosition(active, onPosition, { minMoveM = 25, minIntervalMs = 20000 } = {}) {
  const cb = useRef(onPosition);
  useEffect(() => { cb.current = onPosition; }, [onPosition]);
  useEffect(() => {
    const g = geo();
    if (!active || !g) return undefined;
    let last = null, lastAt = 0, id = null;
    const handler = (p) => {
      const c = toCoords(p), now = Date.now();
      if (last && (distanceM(last, c) < minMoveM || now - lastAt < minIntervalMs)) return;
      last = c; lastAt = now; cb.current?.(c);
    };
    const start = () => { if (id == null) id = g.watchPosition(handler, () => {}, HIGH); };
    const stop = () => { if (id != null) { g.clearWatch(id); id = null; } };
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVis);
    start();
    return () => { document.removeEventListener("visibilitychange", onVis); stop(); };
  }, [active, minMoveM, minIntervalMs]);
}