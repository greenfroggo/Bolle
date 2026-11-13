import { useEffect, useState } from "react";
import { supabase, BUCKET, cleanCaption } from "./bolleCore.jsx";

/* Contributi di una bolla a catena: una bolla sotto l'altra, unite da un filo, dalla prima all'ultima.
   Legge l'RPC `bolle_chain_contributions` (vedi bolle_chain_contributions.sql).
   Se la migrazione non è applicata o la catena è vuota, non mostra nulla (la bolla si apre comunque). */
export default function ChainTimeline({ rootId, currentId }) {
  const [items, setItems] = useState(null); // null = caricamento

  useEffect(() => {
    if (!rootId) return undefined;
    let alive = true;
    const load = async () => {
      try {
        const { data, error } = await supabase.rpc("bolle_chain_contributions", { p_root_bubble_id: String(rootId) });
        if (error || !Array.isArray(data)) { if (alive) setItems([]); return; }
        const paths = data.map((r) => r.o_path).filter(Boolean);
        const urlByPath = {};
        if (paths.length) {
          const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 3600);
          (signed || []).forEach((s) => { if (s?.signedUrl) urlByPath[s.path] = s.signedUrl; });
        }
        if (!alive) return;
        setItems(data.map((r) => ({
          id: String(r.bubble_id),
          type: r.o_type,
          caption: cleanCaption(r.o_caption || ""),
          username: r.username || "",
          url: r.o_path ? urlByPath[r.o_path] || null : null,
        })));
      } catch { if (alive) setItems([]); }
    };
    load();
    const onUpdate = () => load();
    window.addEventListener("bolle:chain-updated", onUpdate);
    return () => { alive = false; window.removeEventListener("bolle:chain-updated", onUpdate); };
  }, [rootId]);

  if (!items) return <p className="bl-ct-loading">Carico la catena…</p>;
  if (items.length === 0) return null;

  return (
    <ol className="bl-ct" aria-label={`Contributi della catena: ${items.length}`} onClick={(e) => e.stopPropagation()}>
      {items.map((it, i) => {
        const isVideo = it.type === "video";
        const isImage = it.type === "image";
        return (
          <li key={it.id} className={`bl-ct-item ${it.id === String(currentId) ? "is-current" : ""}`} style={{ "--oh": (270 + i * 31) % 360, "--i": i }}>
            <figure className="bl-ct-orb">
              {isImage && it.url && <img src={it.url} alt={it.caption || `Contributo ${i + 1}`} loading="lazy" decoding="async" />}
              {isVideo && it.url && <video src={it.url} muted loop playsInline autoPlay preload="metadata" />}
              {!(it.url && (isImage || isVideo)) && <span className="bl-ct-fallback" aria-hidden="true">🫧</span>}
              {it.id === String(currentId) && <span className="bl-ct-here">Qui puoi interagire</span>}
            </figure>
            <div className="bl-ct-meta">
              <small className="bl-ct-who">{i === 0 ? "🔗 Inizio · " : `#${i + 1} · `}{it.username ? `@${it.username}` : "Anonimo"}</small>
              {it.caption && <p className="bl-ct-caption">{it.caption}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}