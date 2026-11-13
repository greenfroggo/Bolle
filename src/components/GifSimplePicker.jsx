import { useEffect, useState } from "react";
import { fetchFromKlipy, fetchFromGiphy } from "./KlipyPicker.jsx";

/* Selezione GIF semplificata: barra di ricerca, le GIF più famose sotto (tendenze) e la didascalia.
   «Altre opzioni» (bolla a catena, capsula del tempo) restano nel composer.

   Layout: ogni GIF sta in una cella quadrata di dimensione fissa (immagine ritagliata con object-fit),
   così le GIF non si sovrappongono qualunque sia il loro formato.
   Zoom su iPhone: Safari ingrandisce la pagina quando si tocca un campo con testo sotto i 16px.
   Qui i campi sono a 16px e la regola vale anche per gli altri campi mentre il selettore è aperto
   (es. «tagga qualcuno»). Se vuoi renderla permanente, copia la regola @media (pointer:coarse) nel CSS globale. */

const CSS = `
.bl-gsp{display:flex;flex-direction:column;gap:12px;min-width:0;touch-action:manipulation}
.bl-gsp-search{display:flex;align-items:center;gap:8px;padding:0 14px;border:1px solid rgba(160,160,200,.4);border-radius:16px;background:rgba(255,255,255,.06);transition:border-color .15s ease,box-shadow .15s ease}
.bl-gsp-search input,.bl-gsp-search input:focus,.bl-gsp-search input:focus-visible{flex:1 1 auto;min-width:0;width:auto;margin:0;padding:12px 0;border:0!important;border-radius:0!important;outline:0!important;box-shadow:none!important;background:transparent!important;color:inherit;font:inherit;-webkit-appearance:none;appearance:none}
.bl-gsp-search:focus-within{border-color:#8f7dff;box-shadow:0 0 0 3px rgba(143,125,255,.35),0 0 16px rgba(143,125,255,.45)}
.bl-gsp-title{margin:0;font-size:1rem}
.bl-gsp-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;max-height:min(52vh,420px);overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;padding:2px}
@media (min-width:520px){.bl-gsp-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
.bl-gsp-cell{position:relative;display:block;width:100%;aspect-ratio:1 / 1;margin:0;padding:0;border:2px solid transparent;border-radius:12px;overflow:hidden;background:rgba(150,150,180,.18);cursor:pointer;-webkit-tap-highlight-color:transparent}
.bl-gsp-cell img{position:absolute;inset:0;display:block;width:100%;height:100%;object-fit:cover}
.bl-gsp-cell:focus-visible{outline:2px solid #b9a7ff;outline-offset:2px}
.bl-gsp-cell.on{border-color:#8f7dff;box-shadow:0 0 0 2px rgba(143,125,255,.45)}
.bl-gsp-credits{display:block}
.bl-gsp-caption{display:flex;flex-direction:column;gap:6px;font-weight:600}
.bl-gsp-input{width:100%;box-sizing:border-box;padding:12px 14px;border:1px solid rgba(160,160,200,.4);border-radius:14px;background:rgba(255,255,255,.06);color:inherit;font:inherit;font-weight:400}
.bl-gsp-input:focus{outline:0;border-color:#8f7dff}
@media (pointer:coarse){
  input:not([type="checkbox"]):not([type="radio"]):not([type="range"]),textarea,select{font-size:max(16px,1em)!important}
}
`;

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
    <div className="bl-gsp" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
      <style>{CSS}</style>

      <label className="bl-gsp-search">
        <span aria-hidden="true">🔍</span>
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cerca una GIF" aria-label="Cerca una GIF" enterKeyHint="search" autoComplete="off" autoCorrect="off" />
      </label>

      <h4 className="bl-gsp-title">{query.trim() ? "Risultati" : "🔥 Le più famose"}</h4>
      {loading ? <p className="bl-muted">Caricamento…</p>
        : items.length === 0 ? <p className="bl-muted">Nessuna GIF trovata. Prova un’altra parola.</p>
        : (
          <div className="bl-gsp-grid" role="listbox" aria-label="GIF">
            {items.map((item) => (
              <button type="button" role="option" aria-selected={selectedUrl === item.url} key={`${item.provider}-${item.id}`} className={`bl-gsp-cell ${selectedUrl === item.url ? "on" : ""}`} onClick={() => onPick(item)} aria-label={`Scegli ${item.title || "GIF"}`}>
                <img src={item.url} alt="" loading="lazy" decoding="async" />
              </button>
            ))}
          </div>
        )}
      <small className="bl-gsp-credits bl-muted">Powered by GIPHY · Klipy</small>

      <label className="bl-gsp-caption">
        Didascalia
        <input className="bl-gsp-input" type="text" maxLength={maxCaption} value={caption} disabled={disabled} onChange={(e) => onCaption(e.target.value)} placeholder="Aggiungi due parole (facoltativo)" />
      </label>
    </div>
  );
}