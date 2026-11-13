import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

/* Taggare utenti in una bolla, con suggerimenti mentre si digita.
   - Bastano le prime lettere del nome utente: i risultati arrivano da `onSearch(prefisso)` (database) e, nel frattempo,
     compaiono subito quelli già noti (`suggestions`: chat recenti e autori preferiti) che corrispondono.
   - Con il campo vuoto e a fuoco si propongono i contatti più probabili.
   - Un tocco (o Invio) su un suggerimento aggiunge la persona: non serve scrivere l'username intero.
   - Tastiera: ↑ ↓ per scorrere, Invio/Tab per scegliere, Backspace a campo vuoto per togliere l'ultimo tag, Esc per chiudere.
   Props compatibili con il vecchio TagPicker: tags, onChange, disabled, suggestions, onSearch. */

export const MAX_TAGS = 3;

/* Focus: il campo di testo interno non ha bordo né riquadro (era il rettangolo viola a spigoli vivi);
   si illumina tutto il contenitore, con gli angoli arrotondati.
   Zoom su iPhone: Safari ingrandisce la pagina se il testo del campo è sotto i 16px, quindi qui è 16px. */
const FOCUS_CSS = `
.bl-tagac .bl-tagac-field{border-radius:16px;transition:border-color .15s ease,box-shadow .15s ease}
.bl-tagac .bl-tagac-field input,.bl-tagac .bl-tagac-field input:focus,.bl-tagac .bl-tagac-field input:focus-visible{border:0!important;border-radius:0!important;outline:0!important;box-shadow:none!important;background:transparent!important;font-size:16px!important;-webkit-appearance:none;appearance:none}
.bl-tagac .bl-tagac-field:focus-within,.bl-tagac .bl-tagac-field.is-focus{border-color:#8f7dff;box-shadow:0 0 0 3px rgba(143,125,255,.35),0 0 16px rgba(143,125,255,.45)}
`;
const DEBOUNCE_MS = 140;
const clean = (v) => String(v || "").trim().replace(/^@+/, "").toLowerCase();

function hueOf(name) {
  let h = 5381;
  for (let i = 0; i < name.length; i++) h = ((h << 5) + h + name.charCodeAt(i)) | 0;
  return Math.abs(h * 137) % 360;
}

function Dot({ name }) {
  const hue = hueOf(name);
  return (
    <span className="bl-tagac-dot" aria-hidden="true" style={{ "--h": hue }}>
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

export default function TagAutocomplete({ tags = [], onChange, disabled = false, suggestions = [], onSearch, max = MAX_TAGS, selfUsername = "" }) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [remote, setRemote] = useState([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [hi, setHi] = useState(0);
  const inputRef = useRef(null);
  const wrapRef = useRef(null);
  const seq = useRef(0);
  const listId = useId();

  const taken = useMemo(() => new Set([...tags.map(clean), clean(selfUsername)]), [tags, selfUsername]);
  const full = tags.length >= max;
  const q = clean(query);

  // Ricerca nel database mentre si digita (con piccola attesa per non fare una richiesta a ogni lettera).
  useEffect(() => {
    if (!q || !onSearch || full) { setRemote([]); setLoading(false); setFailed(false); return undefined; }
    const mine = ++seq.current;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const rows = await onSearch(q);
        if (mine !== seq.current) return; // risposta vecchia: ignorata
        setRemote(Array.isArray(rows) ? rows : []);
        setFailed(false);
      } catch {
        if (mine === seq.current) { setRemote([]); setFailed(true); }
      } finally {
        if (mine === seq.current) setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [q, onSearch, full]);

  const options = useMemo(() => {
    const out = [];
    const seen = new Set();
    const push = (u, hint) => {
      const k = clean(typeof u === "string" ? u : u?.username);
      if (!k || seen.has(k) || taken.has(k)) return;
      seen.add(k); out.push({ username: k, hint });
    };
    if (!q) {
      suggestions.slice(0, 6).forEach((s) => push(s, "frequente"));
      return out;
    }
    // Prima i già noti che iniziano con le lettere scritte (compaiono subito), poi quelli del database, poi i noti che le contengono.
    suggestions.filter((s) => clean(s.username ?? s).startsWith(q)).forEach((s) => push(s, "frequente"));
    remote.forEach((r) => push(r));
    suggestions.filter((s) => clean(s.username ?? s).includes(q)).forEach((s) => push(s, "frequente"));
    return out.slice(0, 8);
  }, [q, remote, suggestions, taken]);

  useEffect(() => { setHi(0); }, [q, options.length]);

  const open = focused && !disabled && !full && (Boolean(q) || options.length > 0);

  const add = useCallback((username) => {
    const u = clean(username);
    if (!u || taken.has(u) || tags.length >= max) return;
    onChange?.([...tags, u]);
    setQuery("");
    setRemote([]);
    requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
  }, [taken, tags, max, onChange]);

  const remove = (u) => onChange?.(tags.filter((t) => clean(t) !== clean(u)));

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setHi((i) => Math.min(options.length - 1, i + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHi((i) => Math.max(0, i - 1)); }
    else if (e.key === "Enter" || e.key === "Tab" || e.key === ",") {
      if (open && options[hi]) { e.preventDefault(); add(options[hi].username); }
      else if (e.key === "Enter") e.preventDefault(); // non inviare il modulo di pubblicazione per sbaglio
    } else if (e.key === "Backspace" && !query && tags.length) remove(tags[tags.length - 1]);
    else if (e.key === "Escape") { setFocused(false); inputRef.current?.blur(); }
  };

  // Chiude toccando fuori.
  useEffect(() => {
    if (!focused) return undefined;
    const off = (e) => { if (!wrapRef.current?.contains(e.target)) setFocused(false); };
    document.addEventListener("pointerdown", off, true);
    return () => document.removeEventListener("pointerdown", off, true);
  }, [focused]);

  return (
    <div className={`bl-tagac ${disabled ? "is-disabled" : ""}`} ref={wrapRef}>
      <style>{FOCUS_CSS}</style>
      <div className="bl-tagac-head">
        <b>Tagga qualcuno</b>
        <small>{tags.length}/{max}</small>
      </div>
      <div className={`bl-tagac-field ${focused ? "is-focus" : ""}`} onClick={() => inputRef.current?.focus({ preventScroll: true })}>
        {tags.map((t) => (
          <span key={t} className="bl-tagac-chip">
            <Dot name={clean(t)} />@{clean(t)}
            <button type="button" aria-label={`Rimuovi il tag a ${clean(t)}`} disabled={disabled} onClick={(e) => { e.stopPropagation(); remove(t); }}>×</button>
          </span>
        ))}
        {!full && (
          <input
            ref={inputRef}
            type="text"
            inputMode="text"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="done"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={open && options[hi] ? `${listId}-${hi}` : undefined}
            value={query}
            disabled={disabled}
            placeholder={tags.length ? "Aggiungi un altro…" : "@ scrivi le prime lettere"}
            onChange={(e) => setQuery(e.target.value.slice(0, 32))}
            onFocus={() => setFocused(true)}
            onKeyDown={onKeyDown}
          />
        )}
        {full && <span className="bl-tagac-full">Massimo {max} persone</span>}
      </div>
      {open && (
        <ul className="bl-tagac-list" id={listId} role="listbox" aria-label="Utenti suggeriti">
          {options.map((o, i) => (
            <li
              key={o.username}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === hi}
              className={i === hi ? "on" : ""}
              onPointerDown={(e) => { e.preventDefault(); add(o.username); }} // preventDefault: il campo non perde il fuoco
              onPointerEnter={() => setHi(i)}
            >
              <Dot name={o.username} />
              <span className="bl-tagac-name">
                {q && o.username.startsWith(q) ? <><mark>{o.username.slice(0, q.length)}</mark>{o.username.slice(q.length)}</> : o.username}
              </span>
              {o.hint && <small>{o.hint}</small>}
            </li>
          ))}
          {!options.length && (
            <li className="bl-tagac-empty" role="presentation">
              {loading ? "Cerco…" : failed ? "Ricerca non disponibile: riprova tra poco." : `Nessun utente che inizia con «${q}»`}
            </li>
          )}
          {options.length > 0 && loading && <li className="bl-tagac-empty" role="presentation">Cerco altri…</li>}
        </ul>
      )}
    </div>
  );
}