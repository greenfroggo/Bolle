import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { supabase, errorText, KLIPY_API_KEY, GIPHY_API_KEY } from "../lib/bolleCore.jsx";

const MEDIA_QUICK_TAGS = [
  { label: "🔥 Tendenze", q: "" },
  { label: "😂 Meme", q: "meme" },
  { label: "🐱 Gatti", q: "cat" },
  { label: "🎉 Festa", q: "party" },
  { label: "❤️ Love", q: "love reaction" },
  { label: "😱 Shock", q: "shocked reaction" },
  { label: "☕ Buongiorno", q: "coffee morning" }
];

const GIPHY_KEY = import.meta.env.VITE_GIPHY_API_KEY || GIPHY_API_KEY || "u6Z3iuUoSGTPbFAfPkFulENlurgQEADu";

function extractKlipyUrl(item) {
  if (!item) return null;
  const urlOf = (v) => (typeof v === "string" ? v : v?.url || null);
  const file = item.file;
  if (typeof file === "string") return file;
  if (file && typeof file === "object") {
    // Formato Klipy: file.{hd|md|sm|xs}.{gif|webp|jpg|png|mp4}.url
    for (const size of ["md", "sm", "hd", "xs"]) {
      for (const fmt of ["gif", "webp", "jpg", "png"]) {
        const u = urlOf(file[size]?.[fmt]);
        if (u) return u;
      }
    }
    for (const fmt of ["gif", "webp", "jpg", "png"]) { const u = urlOf(file[fmt]); if (u) return u; }
  }
  if (item.files) {
    for (const k of ["gif", "webp", "original", "medium"]) { const u = urlOf(item.files[k]); if (u) return u; }
  }
  if (item.images?.fixed_width?.url) return item.images.fixed_width.url;
  if (item.images?.original?.url) return item.images.original.url;
  if (item.media_url) return item.media_url;
  if (typeof item.url === "string" && /\.(gif|webp|jpg|jpeg|png)($|\?)/i.test(item.url)) return item.url;
  return null;
}

function klipyCustomerId() {
  try {
    let id = localStorage.getItem("bolle-klipy-customer");
    if (!id) { id = crypto.randomUUID(); localStorage.setItem("bolle-klipy-customer", id); }
    return id;
  } catch { return "bolle-anon"; }
}

async function fetchFromKlipy(q, type, signal) {
  if (!KLIPY_API_KEY) return [];
  const rawQ = (q || "").trim();
  const cid = `&customer_id=${encodeURIComponent(klipyCustomerId())}`;
  const isSearch = Boolean(rawQ);
  
  const endpoints = type === "meme"
    ? [
        isSearch
          ? `https://api.klipy.com/api/v1/${KLIPY_API_KEY}/static-memes/search?q=${encodeURIComponent(rawQ)}&page=1&per_page=24`
          : `https://api.klipy.com/api/v1/${KLIPY_API_KEY}/static-memes/trending?page=1&per_page=24`,
        isSearch
          ? `https://api.klipy.com/api/v1/${KLIPY_API_KEY}/memes/search?q=${encodeURIComponent(rawQ)}&per_page=24`
          : `https://api.klipy.com/api/v1/${KLIPY_API_KEY}/memes/trending?per_page=24`
      ]
    : [
        isSearch
          ? `https://api.klipy.com/api/v1/${KLIPY_API_KEY}/gifs/search?q=${encodeURIComponent(rawQ)}&page=1&per_page=24`
          : `https://api.klipy.com/api/v1/${KLIPY_API_KEY}/gifs/trending?page=1&per_page=24`
      ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url + cid, { signal });
      if (!res.ok) { console.warn("Klipy: risposta", res.status, url); continue; }
      const json = await res.json();
      const rawData = Array.isArray(json.data) ? json.data : (json.data?.data || json.results || []);
      const parsed = (rawData || []).map(item => ({
        id: String(item.id || item.slug || Math.random().toString(36).slice(2)),
        title: item.title || item.slug || "Klipy",
        url: extractKlipyUrl(item),
        provider: "klipy"
      })).filter(x => x.url);
      if (parsed.length > 0) return parsed;
    } catch (e) {
      if (e.name === "AbortError") throw e;
    }
  }
  return [];
}

async function fetchFromGiphy(q, type, signal) {
  const rawQ = (q || "").trim();
  const searchQ = type === "meme" ? (rawQ ? `${rawQ} meme` : "meme") : rawQ;
  const isSearch = Boolean(searchQ);
  const url = isSearch
    ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(searchQ)}&limit=24&rating=pg-13&lang=it`
    : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_KEY}&limit=24&rating=pg-13`;

  try {
    const res = await fetch(url, { signal });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data || []).map(item => ({
      id: item.id,
      title: item.title || "GIPHY",
      url: item.images?.fixed_width?.url || item.images?.downsized?.url || item.images?.original?.url,
      provider: "giphy",
      images: item.images
    })).filter(x => x.url);
  } catch (e) {
    if (e.name === "AbortError") throw e;
    return [];
  }
}

export function KlipyPicker({ onPick, selectedUrl = null, initialTab = "gif", initialSource = "both" }) {
  const [source, setSource] = useState(initialSource); // "both" | "klipy" | "giphy"
  const [tab, setTab] = useState(initialTab === "meme" ? "meme" : "gif"); // "gif" | "meme"
  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        let results = [];
        if (source === "both") {
          const [kRes, gRes] = await Promise.allSettled([
            fetchFromKlipy(query, tab, controller.signal),
            fetchFromGiphy(query, tab, controller.signal)
          ]);
          const kItems = kRes.status === "fulfilled" ? kRes.value : [];
          const gItems = gRes.status === "fulfilled" ? gRes.value : [];
          const merged = [];
          const max = Math.max(kItems.length, gItems.length);
          for (let i = 0; i < max; i++) {
            if (i < kItems.length) merged.push(kItems[i]);
            if (i < gItems.length) merged.push(gItems[i]);
          }
          results = merged;
        } else if (source === "klipy") {
          results = await fetchFromKlipy(query, tab, controller.signal);
        } else {
          results = await fetchFromGiphy(query, tab, controller.signal);
        }

        if (!alive) return;
        setItems(results);
        if (results.length === 0) {
          setError(
            (source === "klipy" && !KLIPY_API_KEY)
              ? "Klipy non è configurato: manca VITE_KLIPY_API_KEY nelle variabili d'ambiente."
              : source === "klipy"
              ? "Nessun risultato da Klipy. Prova con un'altra parola o seleziona «Entrambi»."
              : source === "giphy"
              ? "Nessun risultato da GIPHY. Prova con un'altra parola o seleziona «Entrambi»."
              : "Nessun contenuto trovato per questa ricerca."
          );
        }
      } catch (err) {
        if (alive && err.name !== "AbortError") setError(err.message || "Errore di caricamento");
      } finally {
        if (alive && !controller.signal.aborted) setLoading(false);
      }
    }, 320);

    return () => {
      alive = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, tab, source]);

  return (
    <div className="bl-klipy-picker" onPointerDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
      <div className="bl-media-sources" role="tablist" aria-label="Sorgente multimediale">
        <button
          type="button"
          className={source === "both" ? "active" : ""}
          onClick={() => setSource("both")}
        >
          ✨ Entrambi (Klipy + GIPHY)
        </button>
        <button
          type="button"
          className={source === "klipy" ? "active" : ""}
          onClick={() => setSource("klipy")}
        >
          ⚡ Klipy {KLIPY_API_KEY ? "✓" : ""}
        </button>
        <button
          type="button"
          className={source === "giphy" ? "active" : ""}
          onClick={() => setSource("giphy")}
        >
          👾 GIPHY ✓
        </button>
      </div>

      <div className="bl-klipy-tabs" role="tablist">
        <button
          type="button"
          className={tab === "gif" ? "active" : ""}
          onClick={() => setTab("gif")}
        >
          🎞️ GIF animate
        </button>
        <button
          type="button"
          className={tab === "meme" ? "active" : ""}
          onClick={() => setTab("meme")}
        >
          😂 Meme popolari
        </button>
      </div>

      <div className="bl-media-quick-tags">
        {MEDIA_QUICK_TAGS.map(t => (
          <button
            type="button"
            key={t.label}
            onClick={() => setQuery(t.q)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <input
        type="search"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder={
          source === "both"
            ? `Cerca ${tab === "meme" ? "meme" : "GIF"} su Klipy e GIPHY…`
            : `Cerca su ${source === "klipy" ? "Klipy" : "GIPHY"}…`
        }
        className="bl-author-search-box"
      />

      {loading && <p className="bl-muted">Ricerca in corso su {source === "both" ? "Klipy & GIPHY" : source === "klipy" ? "Klipy" : "GIPHY"}…</p>}
      {error && <p className="bl-error">{error}</p>}

      <div className="bl-klipy-grid">
        {items.map(item => (
          <button
            type="button"
            key={`${item.provider}-${item.id}`}
            className={`bl-media-card ${selectedUrl === item.url ? "selected" : ""}`}
            onClick={() => onPick(item)}
            aria-label={`Scegli ${item.title || "media"} (${item.provider})`}
          >
            <img src={item.url} alt={item.title || "media"} loading="lazy" />
            <span className={`bl-media-badge bl-badge-${item.provider}`}>
              {item.provider === "klipy" ? "⚡ Klipy" : "👾 GIPHY"}
            </span>
          </button>
        ))}
      </div>

      <div className="bl-media-footer-credits bl-muted">
        <span>{items.length} {tab === "meme" ? "meme" : "GIF"} trovati</span>
        <span>⚡ Klipy API & 👾 GIPHY</span>
      </div>
    </div>
  );
}
