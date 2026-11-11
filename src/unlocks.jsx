import React, { createContext, useContext, useEffect, useState } from "react";

/* ===== Funzioni sbloccate dai traguardi =====
   UNICA tabella: funzione -> traguardo (nome esatto come in buildMilestones, App.jsx) che la sblocca.
   Sempre disponibili (nessun blocco): polls, questions (Scintilla), chain (Cuore pulsante), map, wideRadius (Marea di bolle).
   Una chiave assente da questa tabella risulta sbloccata: isUnlocked() → true, requirement() → null.
   Per cambiare una soglia: sposta la funzione su un altro traguardo qui, oppure cambia il `target` in buildMilestones. */
export const FEATURE_UNLOCKS = {
  tags: { milestone: "Primo soffio", label: "Tag utenti" },
  favorites: { milestone: "Primo soffio", label: "Aggiungere ai preferiti" },
  stickers: { milestone: "Primo ricordo", label: "Sticker sulle foto" },
  groups: { milestone: "Costellazione", label: "Gruppi chat" },
  capsule: { milestone: "Universo", label: "Capsula del tempo" },
  themes: { milestone: "Universo", label: "Temi speciali" },
};

/* Raggio massimo (km) di «Vicino a me» senza il traguardo della funzione wideRadius. */
export const FREE_RADIUS_KM = 5;

/* Tipo di bolla del composer -> funzione che lo sblocca (gli altri tipi sono sempre liberi). */
export const MODE_FEATURE = {}; // «Questo o quello?» e «Domanda» sono sempre libere

function bypassOn() {
  try { return localStorage.getItem("bolle-unlock-all") === "1"; } catch { return false; } // solo per provare l'app
}

/* progress: { [nomeTraguardo]: { value, target, unit } } (null finché non è caricato)
   cachedNames: traguardi già sbloccati in passato (restano sbloccati anche se i contatori scendono). */
export function buildUnlocks(progress, cachedNames = []) {
  const cached = new Set(cachedNames);
  const bypass = bypassOn();
  const isUnlocked = (key) => {
    const def = FEATURE_UNLOCKS[key];
    if (!def || bypass) return true;
    const p = progress?.[def.milestone];
    return (p && p.value >= p.target) || cached.has(def.milestone);
  };
  const requirement = (key) => {
    const def = FEATURE_UNLOCKS[key];
    if (!def) return null;
    const p = progress?.[def.milestone];
    const value = Math.min(Number(p?.value) || 0, Number(p?.target) || 0);
    const target = Number(p?.target) || 0;
    const counts = p ? ` (${value}/${target} ${p.unit})` : "";
    return { label: def.label, milestone: def.milestone, value, target, unit: p?.unit || "", pct: target ? Math.round((value / target) * 100) : 0, text: `Si sblocca col traguardo «${def.milestone}»${counts}` };
  };
  const message = (key) => { const r = requirement(key); return r ? `🔒 ${r.label}: ${r.text.charAt(0).toLowerCase()}${r.text.slice(1)}.` : ""; };
  return { isUnlocked, requirement, message };
}

const OPEN = { isUnlocked: () => true, requirement: () => null, message: () => "" }; // senza provider tutto è libero
const UnlocksContext = createContext(OPEN);

export function UnlocksProvider({ value, children }) {
  return <UnlocksContext.Provider value={value || OPEN}>{children}</UnlocksContext.Provider>;
}
export function useUnlocks() { return useContext(UnlocksContext); }
export function useFeature(key) {
  const u = useUnlocks();
  return { unlocked: u.isUnlocked(key), requirement: u.requirement(key) };
}

function Progress({ r }) {
  if (!r?.target) return null;
  return <span className="bl-lock-progress" aria-hidden="true"><i style={{ width: `${Math.max(4, r.pct)}%` }} /></span>;
}

/* Riga compatta al posto di un comando bloccato (nessuna scorciatoia: spiega cosa fare per sbloccarlo). */
export function LockedNote({ feature }) {
  const { unlocked, requirement } = useFeature(feature);
  if (unlocked || !requirement) return null;
  return (
    <div className="bl-locked-note" role="note">
      <span className="bl-locked-ico" aria-hidden="true">🔒</span>
      <div><strong>{requirement.label}</strong><small>{requirement.text}</small><Progress r={requirement} /></div>
    </div>
  );
}

/* Pannello a tutta larghezza al posto di una schermata bloccata. */
export function LockPanel({ feature, onBack, backLabel = "Indietro" }) {
  const { requirement } = useFeature(feature);
  if (!requirement) return null;
  return (
    <div className="bl-lock-panel" role="status">
      <span className="bl-lock-panel-ico" aria-hidden="true">🔒</span>
      <h3>{requirement.label}</h3>
      <p>{requirement.text}.</p>
      <Progress r={requirement} />
      <p className="bl-muted">Continua a usare Bolle: la funzione si attiva da sola appena raggiungi il traguardo.</p>
      {onBack && <button type="button" className="bl-ghost" onClick={onBack}>{backLabel}</button>}
    </div>
  );
}

/* ===== Popup al centro quando una funzione è bloccata =====
   Chiunque (App, chat, impostazioni) chiama showLocked("chiave-funzione"); il popup (LockPopupHost, montato una volta
   in App) resta aperto finché non si tocca la X (o lo sfondo, o Esc). Mostra l'avanzamento aggiornato in tempo reale. */
export const LOCKED_EVENT = "bolle:feature-locked";
export function showLocked(feature) {
  try { window.dispatchEvent(new CustomEvent(LOCKED_EVENT, { detail: { feature } })); } catch { /* ambiente senza window */ }
}

export function LockPopupHost() {
  const { isUnlocked, requirement } = useUnlocks();
  const [feature, setFeature] = useState(null);
  useEffect(() => {
    const onLocked = (e) => setFeature(e.detail?.feature || null);
    window.addEventListener(LOCKED_EVENT, onLocked);
    return () => window.removeEventListener(LOCKED_EVENT, onLocked);
  }, []);
  useEffect(() => {
    if (!feature) return undefined;
    const onKey = (e) => { if (e.key === "Escape") setFeature(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [feature]);
  const r = feature && !isUnlocked(feature) ? requirement(feature) : null;
  if (!r) return null;
  const close = () => setFeature(null);
  return (
    <div className="bl-lock-popup-wrap" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="bl-lock-popup" role="alertdialog" aria-modal="true" aria-labelledby="bl-lock-popup-title" aria-describedby="bl-lock-popup-text">
        <button type="button" className="bl-lock-popup-x" aria-label="Chiudi" onClick={close} autoFocus>×</button>
        <span className="bl-lock-popup-ico" aria-hidden="true">🔒</span>
        <h3 id="bl-lock-popup-title">{r.label}</h3>
        <p id="bl-lock-popup-text">{r.text}.</p>
        <Progress r={r} />
        <small>Continua a usare Bolle: la funzione si attiva da sola appena raggiungi il traguardo.</small>
      </div>
    </div>
  );
}