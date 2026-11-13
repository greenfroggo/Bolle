import React, { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { useFeature, showLocked } from "../../unlocks.jsx";

const SEARCH_CSS = `
.bl-gfs-search{display:flex;align-items:center;gap:8px;padding:0 14px;border:1px solid rgba(160,160,200,.4);border-radius:16px;background:rgba(255,255,255,.06);transition:border-color .15s ease,box-shadow .15s ease}
.bl-gfs-search svg{flex:none}
.bl-gfs-search input,.bl-gfs-search input:focus,.bl-gfs-search input:focus-visible{flex:1 1 auto;min-width:0;width:auto;margin:0;padding:12px 0;border:0!important;border-radius:0!important;outline:0!important;box-shadow:none!important;background:transparent!important;color:inherit;font:inherit;-webkit-appearance:none;appearance:none}
.bl-gfs-search:focus-within{border-color:#8f7dff;box-shadow:0 0 0 3px rgba(143,125,255,.35),0 0 16px rgba(143,125,255,.45)}
@media (pointer:coarse){.bl-gfs-search input{font-size:16px!important}}
`;

/* «Posta GIF» semplificato: ricerca → trending → didascalia → «Altre opzioni» (Bolla a catena, Capsula del tempo).
   Il provider GIF lo passi tu (stesse chiamate che usa già il composer):
     fetchGifs(query)  → Promise<[{ id, url, preview }]>      (query vuota = trending se fetchTrending manca)
     fetchTrending()   → Promise<[{ id, url, preview }]>      (facoltativo)
   Stato: gif, caption, chain (bool), capsule (valore del tuo selettore, o null).
   renderCapsule(): il tuo selettore data/ora della capsula (già esistente). */
export default function GifComposerFields({ fetchGifs, fetchTrending, gif, onGif, caption, onCaption, chain, onChain, capsule, renderCapsule, maxCaption = 140 }) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const capsuleFeat = useFeature("capsule");
  const seq = useRef(0);

  useEffect(() => {
    const id = ++seq.current;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const term = q.trim();
        const list = term ? await fetchGifs(term) : await (fetchTrending ? fetchTrending() : fetchGifs(""));
        if (id === seq.current) setItems(Array.isArray(list) ? list.slice(0, 24) : []);
      } catch { if (id === seq.current) setItems([]); }
      finally { if (id === seq.current) setLoading(false); }
    }, q ? 350 : 0);
    return () => clearTimeout(t);
  }, [q, fetchGifs, fetchTrending]);

  return (
    <div className="bl-gf">
      <style>{SEARCH_CSS}</style>
      <label className="bl-gfs-search">
        <Search size={18} aria-hidden="true" />
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca una GIF" aria-label="Cerca una GIF" enterKeyHint="search" autoComplete="off" />
      </label>

      <section aria-label={q ? "Risultati" : "GIF di tendenza"}>
        <h4 className="bl-gf-title">{q ? "Risultati" : "🔥 Di tendenza"}</h4>
        {loading ? <p className="bl-muted">Caricamento…</p>
          : items.length === 0 ? <p className="bl-muted">Nessuna GIF trovata. Prova un’altra parola.</p>
          : (
            <div className="bl-gf-grid" role="listbox" aria-label="GIF">
              {items.map((g) => (
                <button type="button" role="option" aria-selected={gif?.id === g.id} key={g.id} className={gif?.id === g.id ? "on" : ""} onClick={() => onGif(g)}>
                  <img src={g.preview || g.url} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          )}
      </section>

      <label className="bl-field-label">
        Didascalia
        <input type="text" maxLength={maxCaption} value={caption || ""} onChange={(e) => onCaption(e.target.value)} placeholder="Aggiungi due parole (facoltativo)" />
      </label>

      <button type="button" className="bl-gf-more" aria-expanded={more} onClick={() => setMore((m) => !m)}>
        Altre opzioni <span aria-hidden="true">{more ? "▴" : "▾"}</span>
      </button>
      {more && (
        <div className="bl-gf-options">
          <label className="bl-notification-toggle">
            <span>🔗 Bolla a catena</span>
            <input type="checkbox" checked={Boolean(chain)} onChange={(e) => onChain(e.target.checked)} />
          </label>
          <div className="bl-gf-capsule">
            <div className="bl-notification-toggle"><span>⏳ Capsula del tempo {capsuleFeat.unlocked ? "" : "🔒"}</span></div>
            {capsuleFeat.unlocked
              ? renderCapsule?.(capsule)
              : <button type="button" className="bl-ghost" onClick={() => showLocked("capsule")}>Come si sblocca</button>}
          </div>
        </div>
      )}
    </div>
  );
}