import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Search, X, ChevronRight } from "lucide-react";
import { SEARCH_CHIPS, chipsFromQuery } from "./bubbleSearch.js";

/* Barra di ricerca della home: pill compatta al centro dell'header che si apre in un pannello con
   campo, chip di tipologia (multi-selezione, applicati subito al feed) e suggerimenti in tempo reale.

   Props
   - activeChips / onChipsChange: id dei chip attivi (vedi SEARCH_CHIPS)
   - authors: [{ username, isFav }] già noti (risposta immediata, senza rete)
   - fetchUsers(prefix) → Promise<[{ username }]>: ricerca sul server (RPC bolle_search_usernames)
   - onPickUser(username): apre il profilo · onFilterUser(username): mostra solo le sue bolle
   - renderAvatar(username): nodo avatar opzionale */

const RECENT_KEY = "bolle-recent-search-v1";
const readRecent = () => { try { const v = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); return Array.isArray(v) ? v.slice(0, 6) : []; } catch { return []; } };
const saveRecent = (u) => { try { const next = [u, ...readRecent().filter((x) => x !== u)].slice(0, 6); localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* ignora */ } };

export default function SearchBar({ activeChips = [], onChipsChange, authors = [], fetchUsers, onPickUser, onFilterUser, renderAvatar, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [remote, setRemote] = useState([]);
  const [busy, setBusy] = useState(false);
  const [hi, setHi] = useState(-1);
  const [recent, setRecent] = useState([]);
  const [vvh, setVvh] = useState(null);
  const inputRef = useRef(null);
  const seq = useRef(0);

  const term = useMemo(() => q.replace(/^@+/, "").trim().toLowerCase(), [q]);
  const close = useCallback(() => { setOpen(false); setQ(""); setRemote([]); setHi(-1); }, []);
  const openPanel = () => { if (disabled) return; setRecent(readRecent()); setOpen(true); };

  // Focus e altezza utile quando compare la tastiera (visualViewport).
  useEffect(() => {
    if (!open) return undefined;
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    const vv = window.visualViewport;
    const upd = () => setVvh(vv ? vv.height : null);
    upd();
    vv?.addEventListener("resize", upd);
    const key = (e) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", key);
    return () => { clearTimeout(t); vv?.removeEventListener("resize", upd); window.removeEventListener("keydown", key); };
  }, [open, close]);

  // Suggerimenti dal server: 180 ms di attesa, le risposte in ritardo vengono scartate.
  useEffect(() => {
    if (!open || !term || !fetchUsers) { setRemote([]); setBusy(false); return undefined; }
    const my = ++seq.current;
    setBusy(true);
    const t = setTimeout(async () => {
      let rows = [];
      try { rows = await fetchUsers(term); } catch { rows = []; }
      if (seq.current === my) { setRemote(Array.isArray(rows) ? rows : []); setBusy(false); }
    }, 180);
    return () => clearTimeout(t);
  }, [term, open, fetchUsers]);

  const chipMatches = useMemo(() => {
    const ids = chipsFromQuery(q);
    return SEARCH_CHIPS.filter((c) => ids.includes(c.id));
  }, [q]);

  const users = useMemo(() => {
    if (!term) return [];
    const seen = new Set();
    const out = [];
    const add = (username, isFav) => {
      const u = String(username || "").toLowerCase();
      if (!u || seen.has(u)) return;
      seen.add(u); out.push({ username: u, isFav: !!isFav });
    };
    authors.filter((a) => a.username.startsWith(term)).sort((a, b) => Number(b.isFav) - Number(a.isFav)).forEach((a) => add(a.username, a.isFav));
    remote.forEach((r) => add(r.username, authors.find((a) => a.username === r.username)?.isFav));
    authors.filter((a) => a.username.includes(term)).forEach((a) => add(a.username, a.isFav));
    return out.slice(0, 8);
  }, [term, authors, remote]);

  const rows = useMemo(() => [
    ...chipMatches.map((c) => ({ type: "chip", chip: c })),
    ...users.map((u) => ({ type: "user", user: u })),
  ], [chipMatches, users]);

  const toggleChip = (id) => {
    haptic();
    onChipsChange?.(activeChips.includes(id) ? activeChips.filter((x) => x !== id) : [...activeChips, id]);
  };
  const pickUser = (u) => { saveRecent(u); close(); onPickUser?.(u); };
  const filterUser = (u) => { saveRecent(u); close(); onFilterUser?.(u); };
  const activate = (row) => { if (row.type === "chip") { toggleChip(row.chip.id); setQ(""); } else pickUser(row.user.username); };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setHi((h) => Math.min(rows.length - 1, h + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => Math.max(-1, h - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); const row = rows[hi >= 0 ? hi : 0]; if (row) activate(row); }
  };

  const stop = (e) => e.stopPropagation();
  const n = activeChips.length;
  const root = typeof document !== "undefined" ? document.querySelector(".bl-root") : null;

  const panel = open && (
    <div className="bl-search-layer" role="dialog" aria-label="Cerca bolle e persone" onTouchStart={stop} onTouchMove={stop} onTouchEnd={stop} onPointerDown={stop}>
      <div className="bl-search-backdrop" onClick={close} />
      <div className="bl-search-panel" style={vvh ? { maxHeight: `${Math.max(240, vvh - 24)}px` } : undefined}>
        <div className="bl-search-field">
          <Search size={18} aria-hidden="true" />
          <input
            ref={inputRef} type="search" value={q} onChange={(e) => { setQ(e.target.value); setHi(-1); }} onKeyDown={onKeyDown}
            placeholder="Cerca persone o tipi di bolla…" autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} enterKeyHint="search"
            role="combobox" aria-expanded={rows.length > 0} aria-controls="bl-search-list" aria-activedescendant={hi >= 0 ? `bl-search-row-${hi}` : undefined}
          />
          {q && <button type="button" className="bl-search-clear" onClick={() => { setQ(""); inputRef.current?.focus(); }} aria-label="Cancella"><X size={16} /></button>}
          <button type="button" className="bl-search-done" onClick={close}>{n ? "Fatto" : "Annulla"}</button>
        </div>

        <div className="bl-search-chips" role="group" aria-label="Tipo di bolla">
          {SEARCH_CHIPS.map((c) => (
            <button key={c.id} type="button" className={activeChips.includes(c.id) ? "on" : ""} aria-pressed={activeChips.includes(c.id)} onClick={() => toggleChip(c.id)}>
              <span aria-hidden="true">{c.icon}</span>{c.label}
            </button>
          ))}
        </div>

        <div className="bl-search-results" id="bl-search-list" role="listbox">
          {!term && (
            <>
              {recent.length > 0 && <p className="bl-search-title">Recenti</p>}
              {recent.map((u) => (
                <button key={u} type="button" role="option" className="bl-search-row" onClick={() => pickUser(u)}>
                  <span className="bl-search-ava">{renderAvatar ? renderAvatar(u) : "👤"}</span><span className="bl-search-name">@{u}</span><ChevronRight size={16} aria-hidden="true" />
                </button>
              ))}
              <p className="bl-search-hint">Prova a scrivere «foto», «gif», «questo o quello», «domande», «voto»… oppure il nome di un utente.</p>
            </>
          )}
          {term && chipMatches.length > 0 && <p className="bl-search-title">Tipi di bolla</p>}
          {term && chipMatches.map((c, i) => (
            <button key={c.id} id={`bl-search-row-${i}`} type="button" role="option" aria-selected={hi === i} className={`bl-search-row ${hi === i ? "is-hi" : ""}`} onClick={() => activate({ type: "chip", chip: c })}>
              <span className="bl-search-ava" aria-hidden="true">{c.icon}</span><span className="bl-search-name">{c.label}</span>
              <em>{activeChips.includes(c.id) ? "Attivo" : "Filtra"}</em>
            </button>
          ))}
          {term && users.length > 0 && <p className="bl-search-title">Persone</p>}
          {term && users.map((u, j) => {
            const i = chipMatches.length + j;
            return (
              <div key={u.username} className={`bl-search-row ${hi === i ? "is-hi" : ""}`} id={`bl-search-row-${i}`} role="option" aria-selected={hi === i}>
                <button type="button" className="bl-search-main" onClick={() => pickUser(u.username)}>
                  <span className="bl-search-ava">{renderAvatar ? renderAvatar(u.username) : "👤"}</span>
                  <span className="bl-search-name">@{u.username}{u.isFav ? " ⭐" : ""}</span>
                </button>
                <button type="button" className="bl-search-side" onClick={() => filterUser(u.username)} aria-label={`Mostra solo le bolle di @${u.username}`}>Bolle</button>
              </div>
            );
          })}
          {term && !busy && rows.length === 0 && <p className="bl-search-hint">Nessun risultato per «{q.trim()}».</p>}
          {term && busy && rows.length === 0 && <p className="bl-search-hint">Cerco…</p>}
        </div>

        {n > 0 && <button type="button" className="bl-search-reset" onClick={() => onChipsChange?.([])}>Azzera filtri ({n})</button>}
      </div>
    </div>
  );

  return (
    <div className="bl-search-slot">
      <button type="button" className={`bl-search-pill ${n ? "has-filter" : ""}`} onClick={openPanel} onPointerDown={(e) => e.stopPropagation()} aria-haspopup="dialog" aria-expanded={open} aria-label={n ? `Cerca, ${n} filtri attivi` : "Cerca persone e bolle"}>
        <Search size={17} aria-hidden="true" /><span>Cerca</span>{n > 0 && <b aria-hidden="true">{n}</b>}
      </button>
      {panel && (root ? createPortal(panel, root) : panel)}
    </div>
  );
}

function haptic() { try { navigator.vibrate?.(8); } catch { /* ignora */ } }
