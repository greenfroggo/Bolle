import { useEffect, useState } from "react";
import { fetchFromKlipy, fetchFromGiphy } from "./KlipyPicker.jsx";

/* Selezione GIF semplificata: barra di ricerca, le GIF più famose sotto (tendenze) e la didascalia.
   «Altre opzioni» (bolla a catena, capsula del tempo) restano nel composer. */
export function GifSimplePicker({ selectedUrl = null, onPick, caption = "", onCaption, maxCaption = 140, disabled = false }) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const q = query.trim();
        const [k, g] = await Promise.allSettled([
          fetchFromKlipy(q, "gif", controller.signal),
          fetchFromGiphy(q, "gif", controller.signal),
        ]);
        const a = k.status === "fulfilled" ? k.value : [];
        const b = g.status === "fulfilled" ? g.value : [];
        const merged = [];
        for (let i = 0; i < Math.max(a.length, b.length); i++) {
          if (i < b.length) merged.push(b[i]);
          if (i < a.length) merged.push(a[i]);
        }
        if (alive) setItems(merged.slice(0, 24));
      } catch { if (alive) setItems([]); }
      finally { if (alive && !controller.signal.aborted) setLoading(false); }
    }, query ? 350 : 0);
    return () => { alive = false; clearTimeout(timer); controller.abort(); };
  }, [query]);

  return (
    <div className="bl-gs" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
      <label className="bl-gs-search">
        <span aria-hidden="true">🔍</span>
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cerca una GIF" aria-label="Cerca una GIF" enterKeyHint="search" />
      </label>

      <h4 className="bl-gs-title">{query.trim() ? "Risultati" : "🔥 Le più famose"}</h4>
      {loading ? <p className="bl-muted">Caricamento…</p>
        : items.length === 0 ? <p className="bl-muted">Nessuna GIF trovata. Prova un’altra parola.</p>
        : (
          <div className="bl-gs-grid" role="listbox" aria-label="GIF">
            {items.map((item) => (
              <button type="button" role="option" aria-selected={selectedUrl === item.url} key={`${item.provider}-${item.id}`} className={selectedUrl === item.url ? "on" : ""} onClick={() => onPick(item)} aria-label={`Scegli ${item.title || "GIF"}`}>
                <img src={item.url} alt="" loading="lazy" />
              </button>
            ))}
          </div>
        )}
      <small className="bl-gs-credits bl-muted">Powered by GIPHY · Klipy</small>

      <label className="bl-field-label">
        Didascalia
        <input type="text" maxLength={maxCaption} value={caption} disabled={disabled} onChange={(e) => onCaption(e.target.value)} placeholder="Aggiungi due parole (facoltativo)" />
      </label>
    </div>
  );
}
