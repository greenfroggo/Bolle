import React, { useEffect, useRef, useState } from "react";
import { supabase } from "./bolleCore.jsx";

/* Bolle a catena nel feed: una piccola bolla per ogni partecipante, unite da un filo, a festone sotto la bolla.
   - I partecipanti restano anonimi: ogni bolla è solo un colore, non un nome.
   - La catena si aggiorna da sola: ricontrolla mentre la bolla è visibile e subito dopo un nuovo contributo
     (evento "bolle:chain-updated"); la bolla appena arrivata compare con un piccolo «pop». */

const MAX_ORBS = 9;      // oltre questo numero l'ultima bolla diventa «+N»
const POLL_MS = 25000;
const TTL_MS = 15000;

const cache = new Map();     // id bolla -> { at, data }
const inflight = new Map();  // id bolla -> Promise

async function fetchChain(id, force = false) {
  const key = String(id);
  const hit = cache.get(key);
  if (!force && hit && Date.now() - hit.at < TTL_MS) return hit.data;
  if (inflight.has(key)) return inflight.get(key);
  const p = (async () => {
    try {
      const { data, error } = await supabase.rpc("bolle_chain_get", { p_bubble_id: key });
      const row = !error && data && !Array.isArray(data) ? data : Array.isArray(data) ? data[0] : null;
      const out = row?.root_bubble_id ? { root: row.root_bubble_id, count: Math.max(1, Number(row.participant_count) || 1) } : null;
      cache.set(key, { at: Date.now(), data: out });
      return out;
    } catch {
      return hit?.data ?? null; // migrazione assente o rete: nessuna catena mostrata
    } finally {
      inflight.delete(key);
    }
  })();
  inflight.set(key, p);
  return p;
}

/* Restituisce { count, root } se la bolla fa parte di una catena, altrimenti null.
   `initial` = numero già noto dal feed (evita il lampeggio); `enabled` = false per non fare richieste. */
export function useChainSummary(id, { enabled = true, initial = 0 } = {}) {
  const [info, setInfo] = useState(() => (initial > 0 ? { count: initial, root: null } : null));
  const idRef = useRef(id);
  idRef.current = id;

  useEffect(() => {
    setInfo(initial > 0 ? { count: initial, root: null } : null);
    if (!enabled || !id) return undefined;
    let alive = true;
    let isChain = initial > 0; // si ricontrolla nel tempo solo se la bolla è davvero una catena: niente richieste inutili per le altre
    const load = (force) => fetchChain(id, force).then((d) => {
      if (!alive || idRef.current !== id) return;
      isChain = Boolean(d) || isChain;
      setInfo((prev) => (d ? d : prev && !prev.root ? prev : null));
    });
    load(false);
    const timer = setInterval(() => { if (!document.hidden && isChain) load(true); }, POLL_MS);
    const onUpdate = () => { cache.delete(String(id)); load(true); }; // nuovo contributo: ricarica subito
    const onVisible = () => { if (!document.hidden) load(false); };
    window.addEventListener("bolle:chain-updated", onUpdate);
    document.addEventListener("visibilitychange", onVisible);
    return () => { alive = false; clearInterval(timer); window.removeEventListener("bolle:chain-updated", onUpdate); document.removeEventListener("visibilitychange", onVisible); };
  }, [id, enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  return info;
}

export const chainCountFromRow = (row) => {
  const n = Number(row?.chain_participant_count ?? row?.chain_participants ?? row?.chain_count ?? 0);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

/* La catena: festone di bolle collegate. `mini` = versione compatta per le bolle sparse. */
export default function ChainOrbs({ count = 1, hue = 270, mini = false, label = true }) {
  const n = Math.max(1, Math.floor(count));
  const shown = Math.min(n, MAX_ORBS);
  const extra = n > MAX_ORBS ? n - (MAX_ORBS - 1) : 0;
  const prev = useRef(n);
  const [fresh, setFresh] = useState(-1);
  useEffect(() => {
    if (n > prev.current) { setFresh(n - 1); const t = setTimeout(() => setFresh(-1), 1400); prev.current = n; return () => clearTimeout(t); }
    prev.current = n;
    return undefined;
  }, [n]);

  const orbs = Array.from({ length: shown }, (_, i) => i);
  const mid = (shown - 1) / 2;
  const text = `Bolla a catena: ${n} ${n === 1 ? "partecipante" : "partecipanti"}`;
  return (
    <div className={`bl-chain ${mini ? "bl-chain--mini" : ""}`} role="img" aria-label={text} style={{ "--n": shown }}>
      <div className="bl-chain-row" aria-hidden="true">
        {orbs.map((i) => {
          const isMore = extra > 0 && i === shown - 1;
          const sag = Math.cos(((i - mid) / Math.max(1, mid)) * (Math.PI / 2)); // festone: il centro scende più dei lati
          return (
            <React.Fragment key={i}>
              {i > 0 && <span className="bl-chain-link" style={{ "--d": `${i * 70}ms` }} />}
              <span
                className={`bl-chain-orb ${i === fresh ? "is-new" : ""} ${isMore ? "is-more" : ""}`}
                style={{ "--oh": (hue + i * 31) % 360, "--sag": `${(sag * (mini ? 5 : 10)).toFixed(1)}px`, "--d": `${i * 70}ms`, "--i": i }}
              >
                {isMore ? `+${extra}` : null}
              </span>
            </React.Fragment>
          );
        })}
      </div>
      {label && !mini && <small className="bl-chain-label">🔗 Catena · {n} {n === 1 ? "partecipante" : "partecipanti"}</small>}
    </div>
  );
}
