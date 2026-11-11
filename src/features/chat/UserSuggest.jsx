import React, { useState, useEffect, useRef } from "react";
import AvatarImage from "../../components/AvatarImage.jsx";
import { supabase, avatarFor } from "../../lib/bolleCore.jsx";

/* Ricerca utenti per prefisso: funzione SQL bolle_search_usernames, con ripiego sulla tabella profiles. */
async function searchUsernames(prefix, limit = 12) {
  const { data, error } = await supabase.rpc("bolle_search_usernames", { p_prefix: prefix, p_limit: limit });
  if (!error && Array.isArray(data)) {
    return data.map((r) => String(r?.username ?? r ?? "").toLowerCase()).filter(Boolean);
  }
  const safe = prefix.replace(/[%_\\]/g, (c) => "\\" + c);
  const fb = await supabase.from("profiles").select("username").ilike("username", safe + "%").limit(limit);
  if (fb.error || !Array.isArray(fb.data)) throw error || fb.error || new Error("ricerca utenti non disponibile");
  return fb.data.map((r) => String(r.username || "").toLowerCase()).filter(Boolean);
}

/* Suggerimenti man mano che si digita (con attesa breve) ed esclusione di chi è già nel gruppo. */
export function useUserSuggest(query, exclude = []) {
  const [items, setItems] = useState([]);
  const [active, setActive] = useState(-1);
  const [resolved, setResolved] = useState("");
  const reqId = useRef(0);
  const prefix = String(query || "").replace(/^@+/, "").trim().toLowerCase();
  const excludeKey = exclude.map((x) => String(x || "").toLowerCase()).filter(Boolean).join("|");

  useEffect(() => {
    const id = ++reqId.current;
    if (!prefix) {
      setItems([]);
      setActive(-1);
      setResolved("");
      return undefined;
    }
    const t = setTimeout(async () => {
      let found = [];
      try {
        found = await searchUsernames(prefix);
      } catch {
        found = [];
      }
      if (id !== reqId.current) return; // risposta vecchia: ignorata
      const skip = new Set(excludeKey ? excludeKey.split("|") : []);
      setItems([...new Set(found)].filter((u) => !skip.has(u)).slice(0, 8));
      setActive(-1);
      setResolved(prefix);
    }, 180);
    return () => clearTimeout(t);
  }, [prefix, excludeKey]);

  // frecce per scorrere, Invio per scegliere il suggerimento evidenziato; restituisce true se ha gestito il tasto
  function onKeyDown(e, pick) {
    if (!items.length) return false;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (a + 1) % items.length); return true; }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a <= 0 ? items.length - 1 : a - 1)); return true; }
    if (e.key === "Enter" && active >= 0) { e.preventDefault(); pick(items[active]); return true; }
    return false;
  }

  return { items, active, setActive, onKeyDown, empty: Boolean(prefix) && resolved === prefix && items.length === 0 };
}

export function UserSuggestList({ items, active, empty, onPick, onHover, avatarMap }) {
  if (!items.length && !empty) return null;
  return (
    <ul className="bl-user-suggest" role="listbox" aria-label="Suggerimenti utenti">
      {items.map((u, i) => (
        <li key={u} role="option" aria-selected={i === active}>
          <button
            type="button"
            className={i === active ? "on" : ""}
            onMouseDown={(e) => e.preventDefault()} /* la tastiera resta aperta */
            onClick={() => onPick(u)}
            onMouseEnter={() => onHover?.(i)}
          >
            <span className="bl-user-suggest-avatar"><AvatarImage avatar={avatarFor(u, avatarMap)} /></span>
            @{u}
          </button>
        </li>
      ))}
      {empty && <li className="bl-user-suggest-empty">Nessun utente trovato</li>}
    </ul>
  );
}
