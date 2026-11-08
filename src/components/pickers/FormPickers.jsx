import React, { useState, useEffect, useRef, useMemo } from "react";
import { countryFlag } from "../../lib/bolleCore.jsx";
import { countryList, MONTHS_IT, MIN_AGE } from "../../lib/geo.js";

export const SEX_OPTIONS = [
  ["F", "Donna"],
  ["M", "Uomo"],
  ["X", "Altro"],
  ["N", "Preferisco non dirlo"]
];

export function usePickerDismiss(open, setOpen, ref) {
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const esc = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open, setOpen, ref]);
}

const normalizeSearch = (v) => String(v || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/* Menù a tendina scorrevole con barra di ricerca. */
export function SearchableSelect({ label, value, onChange, options, placeholder = "Seleziona…", searchPlaceholder = "Cerca…", error }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const rootRef = useRef(null);
  usePickerDismiss(open, setOpen, rootRef);
  const filtered = options.filter(o => normalizeSearch(o.label).includes(normalizeSearch(q)));
  const known = options.some(o => o.value === value);

  return (
    <div className="bl-field-label bl-picker" ref={rootRef}>
      {label}
      <button
        type="button"
        className="bl-picker-button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => { setOpen(o => !o); setQ(""); }}
      >
        <span className={value ? "" : "placeholder"}>{value || placeholder}</span>
        <i aria-hidden="true">▾</i>
      </button>
      {open && (
        <div className="bl-picker-panel">
          <input
            type="search"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            autoComplete="off"
          />
          <ul role="listbox" aria-label={label}>
            {value && !known && (
              <li>
                <button type="button" role="option" aria-selected="true" className="on" onClick={() => setOpen(false)}>
                  {value} (attuale)
                </button>
              </li>
            )}
            {filtered.map(o => (
              <li key={o.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={o.value === value}
                  className={o.value === value ? "on" : ""}
                  onClick={() => { onChange(o.value); setOpen(false); }}
                >
                  {o.label}
                </button>
              </li>
            ))}
            {!filtered.length && <li className="bl-picker-empty">Nessun risultato</li>}
          </ul>
        </div>
      )}
      {error && <small className="bl-err" role="alert">{error}</small>}
    </div>
  );
}

export function NationalityPicker({ value, onChange, error }) {
  const options = useMemo(() => countryList().map(c => ({ value: c.name, label: `${countryFlag(c.code) || ""} ${c.name}`.trim() })), []);
  return (
    <SearchableSelect
      label="Nazionalità"
      value={value}
      onChange={onChange}
      options={options}
      placeholder="Seleziona la nazionalità"
      searchPlaceholder="Cerca un paese…"
      error={error}
    />
  );
}

/* Città: suggerimenti dal servizio di geocodifica Open-Meteo (gratuito, senza chiave), da scegliere dall'elenco. */
export function CityPicker({ value, onChange, error }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | error
  const rootRef = useRef(null);
  usePickerDismiss(open, setOpen, rootRef);

  useEffect(() => {
    if (!open) return undefined;
    const term = q.trim();
    if (term.length < 2) { setResults([]); setStatus("idle"); return undefined; }
    let alive = true;
    const ctrl = new AbortController();
    setStatus("loading");
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(term)}&count=20&language=it&format=json`, { signal: ctrl.signal });
        if (!res.ok) throw new Error("http");
        const json = await res.json();
        if (!alive) return;
        const seen = new Set();
        const list = (json.results || []).filter(r => !r.feature_code || r.feature_code.startsWith("PPL")).map(r => ({ value: r.name, label: [r.name, r.admin1, r.country].filter(Boolean).join(", ") })).filter(o => { if (seen.has(o.label)) return false; seen.add(o.label); return true; });
        setResults(list); setStatus("idle");
      } catch (err) {
        if (alive && err?.name !== "AbortError") setStatus("error");
      }
    }, 300);
    return () => { alive = false; clearTimeout(timer); ctrl.abort(); };
  }, [q, open]);

  return (
    <div className="bl-field-label bl-picker" ref={rootRef}>
      Città di residenza
      <button
        type="button"
        className="bl-picker-button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => { setOpen(o => !o); setQ(""); setResults([]); }}
      >
        <span className={value ? "" : "placeholder"}>{value || "Cerca e seleziona la città"}</span>
        <i aria-hidden="true">▾</i>
      </button>
      {open && (
        <div className="bl-picker-panel">
          <input
            type="search"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Scrivi il nome della città…"
            aria-label="Cerca una città"
            autoComplete="off"
          />
          <ul role="listbox" aria-label="Città">
            {value && !q && <li><button type="button" role="option" aria-selected="true" className="on" onClick={() => setOpen(false)}>{value} (attuale)</button></li>}
            {results.map(o => (
              <li key={o.label}>
                <button type="button" role="option" aria-selected={o.value === value} onClick={() => { onChange(o.value); setOpen(false); }}>{o.label}</button>
              </li>
            ))}
            {status === "loading" && <li className="bl-picker-empty">Cerco…</li>}
            {status === "idle" && q.trim().length >= 2 && !results.length && <li className="bl-picker-empty">Nessuna città trovata</li>}
            {status === "idle" && q.trim().length < 2 && !value && <li className="bl-picker-empty">Scrivi almeno 2 lettere</li>}
            {status === "error" && (
              <>
                <li className="bl-picker-empty">Ricerca non disponibile al momento.</li>
                {q.trim().length >= 2 && <li><button type="button" onClick={() => { onChange(q.trim()); setOpen(false); }}>Usa «{q.trim()}»</button></li>}
              </>
            )}
          </ul>
        </div>
      )}
      {error && <small className="bl-err" role="alert">{error}</small>}
    </div>
  );
}

/* Data di nascita: tre menù a scorrimento, formato gg/mm/aaaa. Il valore è ISO (aaaa-mm-gg). */
export function BirthDatePicker({ label = "Data di nascita (gg/mm/aaaa)", value, onChange, error }) {
  const parse = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v || "") ? v.split("-").map(Number) : [0, 0, 0];
  const [parts, setParts] = useState(() => { const [y, m, d] = parse(value); return { y, m, d }; });

  useEffect(() => {
    const [y, m, d] = parse(value);
    if (y) setParts(prev => (prev.y === y && prev.m === m && prev.d === d ? prev : { y, m, d }));
  }, [value]);

  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: 111 - MIN_AGE }, (_, i) => thisYear - MIN_AGE - i);
  const daysIn = (y, m) => (m ? new Date(y || 2000, m, 0).getDate() : 31);

  function update(patch) {
    const next = { ...parts, ...patch };
    const max = daysIn(next.y, next.m);
    if (next.d > max) next.d = max;
    setParts(next);
    onChange(next.y && next.m && next.d ? `${next.y}-${String(next.m).padStart(2, "0")}-${String(next.d).padStart(2, "0")}` : "");
  }

  return (
    <div className="bl-field-label bl-birth-field">
      {label}
      <div className="bl-birth" role="group" aria-label={label}>
        <select aria-label="Giorno" value={parts.d || ""} onChange={e => update({ d: Number(e.target.value) })}>
          <option value="">gg</option>
          {Array.from({ length: daysIn(parts.y, parts.m) }, (_, i) => (
            <option key={i + 1} value={i + 1}>{String(i + 1).padStart(2, "0")}</option>
          ))}
        </select>
        <select aria-label="Mese" value={parts.m || ""} onChange={e => update({ m: Number(e.target.value) })}>
          <option value="">mm</option>
          {MONTHS_IT.map((name, i) => (
            <option key={name} value={i + 1}>{String(i + 1).padStart(2, "0")} · {name}</option>
          ))}
        </select>
        <select aria-label="Anno" value={parts.y || ""} onChange={e => update({ y: Number(e.target.value) })}>
          <option value="">aaaa</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      {error && <small className="bl-err" role="alert">{error}</small>}
    </div>
  );
}
