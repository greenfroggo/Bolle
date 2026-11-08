import { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, Star } from "lucide-react";

/* =====================================================================
   Profilo pubblico: dati scelti dall'utente + storico delle bolle.
   Parla solo con le RPC di bolle_profilo_pubblico.sql.
   Tre gruppi, mai mischiati:
     · Da scoppiare  → sfera sfocata e deformata, tocca per scoppiare (chiede conferma)
     · Già scoppiate → in chiaro, con ✓, tocca per rivedere (gratis)
     · Svanite       → segnaposto grigio, non si aprono
   ===================================================================== */
const KIND_META = {
  photo: ["📷", "Foto", 200], video: ["▶️", "Video", 265], question: ["❓", "Domanda", 190], poll: ["⚖️", "Questo o quello", 330],
  meme: ["😂", "Meme", 45], gif: ["🎞️", "GIF", 20], truth: ["🕵️", "2 verità 1 bugia", 150], rating: ["⭐", "Voto", 52],
  thought: ["💭", "Pensiero", 285], confession: ["🤫", "Confessione", 350],
};
const metaOf = (k) => KIND_META[k] || ["🫧", "Bolla", 215];

function timeAgo(iso) {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "adesso";
  if (m < 60) return `${m} min fa`;
  const h = Math.floor(m / 60);
  if (h < 24) return h === 1 ? "1 ora fa" : `${h} ore fa`;
  const d = Math.floor(h / 24);
  return d === 1 ? "ieri" : `${d} giorni fa`;
}
function memberSince(iso) {
  if (!iso) return "";
  const months = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / (30.44 * 864e5)));
  if (months < 1) return "Su Bolle da poco";
  if (months < 24) return `Su Bolle da ${months} ${months === 1 ? "mese" : "mesi"}`;
  return `Su Bolle da ${Math.floor(months / 12)} anni`;
}
function fmtBirth(iso) { const [y, m, d] = String(iso).slice(0, 10).split("-"); return `${d}/${m}/${y}`; }

function Tile({ t, busy, onOpen }) {
  const [icon, label, hue] = metaOf(t.kind);
  const when = timeAgo(t.created_at);
  const st = t.state;
  const common = { type: "button", className: `bl-pp-tile is-${st}`, style: { "--h": hue }, disabled: busy || st === "expired" || st === "capsule", onClick: () => onOpen(t) };
  const aria = st === "locked" ? `Da scoppiare: ${label}, ${when}. Tocca per aprirla` : st === "expired" ? `Bolla svanita, ${when}` : st === "capsule" ? "Capsula del tempo non ancora aperta" : st === "mine" ? `La tua bolla (${label}), ${when}` : `Già scoppiata: ${label}, ${when}. Tocca per rivederla`;
  return (
    <li>
      <button {...common} aria-label={aria}>
        {st === "locked" && <>
          {t.preview_blur
            ? <><span className="bl-pp-img" style={{ backgroundImage: `url("${t.preview_blur}")` }} /><span className="bl-pp-img bl-pp-img--b" style={{ backgroundImage: `url("${t.preview_blur}")` }} /></>
            : <span className="bl-pp-blobs"><i /><i /></span>}
          <span className="bl-pp-shine" />
        </>}
        {(st === "popped" || st === "mine") && <>
          {t.signed ? <span className="bl-pp-clear" style={{ backgroundImage: `url("${t.signed}")` }} />
            : t.preview_blur ? <span className="bl-pp-clear is-soft" style={{ backgroundImage: `url("${t.preview_blur}")` }} />
            : <span className="bl-pp-glyph">{icon}</span>}
          {t.media_type === "video" && <span className="bl-pp-play">▶</span>}
          {st === "popped" && <span className="bl-pp-check" aria-hidden="true">✓</span>}
        </>}
        {st === "expired" && <span className="bl-pp-glyph" aria-hidden="true">💨</span>}
        {st === "capsule" && <span className="bl-pp-glyph" aria-hidden="true">⏳</span>}
      </button>
      {st === "locked" && <em className="bl-pp-badge is-locked">🫧 Da scoppiare</em>}
      {st === "popped" && <em className="bl-pp-badge is-popped">✓ Già scoppiata</em>}
      {st === "mine" && <em className="bl-pp-badge is-mine">La tua</em>}
      <small>{st === "expired" ? "Svanita" : st === "capsule" ? "Capsula" : label}<br />{st === "capsule" && t.opens_at ? `si apre ${new Date(t.opens_at).toLocaleString("it-IT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}` : when}</small>
    </li>
  );
}

export default function PublicProfile({ supabase, bucket, username, avatarNode, onClose, onPop, onReopen, viewerOpen = false, notify, onMessage, onToggleFavorite, isFavorite = false }) {
  const [profile, setProfile] = useState(null);
  const [tiles, setTiles] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [priv, setPriv] = useState(null);
  const [confirm, setConfirm] = useState(null); // bolla "da scoppiare" in attesa di conferma
  const wasViewer = useRef(viewerOpen);

  const loadTiles = useCallback(async () => {
    const { data, error: e } = await supabase.rpc("bolle_profile_bubbles", { p_username: username, p_limit: 60 });
    if (e) return;
    const rows = data || [];
    const paths = rows.filter((r) => r.media_path && r.media_type === "image").map((r) => r.media_path);
    let map = {};
    if (paths.length) {
      try {
        const { data: signed } = await supabase.storage.from(bucket).createSignedUrls(paths, 600);
        (signed || []).forEach((s) => { if (s?.signedUrl) map[s.path] = s.signedUrl; });
      } catch { /* senza miniature in chiaro: resta l'anteprima */ }
    }
    setTiles(rows.map((r) => ({ ...r, signed: map[r.media_path] || null })));
  }, [supabase, bucket, username]);

  useEffect(() => {
    let alive = true;
    setProfile(null); setTiles(null); setError(""); setConfirm(null);
    (async () => {
      const { data, error: e } = await supabase.rpc("bolle_public_profile", { p_username: username });
      if (!alive) return;
      if (e) { setError(/profile_not_found/.test(e.message) ? "Questo profilo non è disponibile." : "Impossibile caricare il profilo. Applica prima bolle_profilo_pubblico.sql."); return; }
      setProfile(data);
      if (data?.is_me) { try { const { data: p } = await supabase.rpc("bolle_my_profile_privacy"); if (alive) setPriv(p); } catch { /* ignora */ } }
      if (alive) loadTiles();
    })();
    return () => { alive = false; };
  }, [supabase, username, loadTiles]);

  // Chiuso il viewer (dopo uno scoppio o una rivisione) l'elenco si aggiorna: la bolla passa tra le «scoppiate».
  useEffect(() => {
    if (wasViewer.current && !viewerOpen) loadTiles();
    wasViewer.current = viewerOpen;
  }, [viewerOpen, loadTiles]);

  async function open(t, confirmed = false) {
    if (busy) return;
    // Scoppiare consuma uno scoppio: prima si chiede conferma.
    if (t.state === "locked" && !confirmed) { setConfirm(t); return; }
    setConfirm(null);
    setBusy(true);
    try {
      if (t.state === "locked") await onPop(t);
      else if (t.state === "popped" || t.state === "mine") await onReopen(t);
    } finally { setTimeout(() => setBusy(false), 500); }
  }

  async function savePriv(next) {
    const old = priv; setPriv(next);
    const { error: e } = await supabase.rpc("bolle_set_profile_privacy", { p_show_name: next.show_name, p_birth_mode: next.birth_mode, p_show_bubbles: next.show_bubbles });
    if (e) { setPriv(old); notify?.("Impostazione non salvata. Riprova."); } else notify?.("Salvato ✓");
  }

  const groups = tiles ? {
    locked: tiles.filter((t) => t.state === "locked"),
    popped: tiles.filter((t) => t.state === "popped"),
    mine: tiles.filter((t) => t.state === "mine" || t.state === "capsule"),
    expired: tiles.filter((t) => t.state === "expired"),
  } : null;

  const fullName = profile && [profile.first_name, profile.last_name].filter(Boolean).join(" ");
  const ageLine = profile && (profile.birth_date ? `${fmtBirth(profile.birth_date)}${profile.age != null ? ` (${profile.age} anni)` : ""}` : profile.age != null ? `${profile.age} anni` : "");
  // Funzione (non componente): così l'elenco non viene rimontato a ogni render.
  const renderSection = ({ title, hint, items, cls }) => items?.length ? (
    <section className={`bl-pp-sec ${cls}`} key={cls}>
      <h3>{title} <em>{items.length}</em></h3>
      {hint && <p>{hint}</p>}
      <ul className="bl-pp-grid">{items.map((t) => <Tile key={t.bubble_id} t={t} busy={busy} onOpen={open} />)}</ul>
    </section>
  ) : null;

  const showActions = profile && !profile.is_me && (onMessage || onToggleFavorite);

  return (
    <div className="bl-sheet-wrap bl-pp-wrap" style={{ zIndex: 46 }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <style>{CSS}</style>
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" focusable="false">
        <filter id="bl-pp-warp" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.02 0.03" numOctaves="2" seed="5" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="26" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <div className="bl-sheet bl-sheet-wide bl-pp" role="dialog" aria-modal="true" aria-label={`Profilo di @${username}`}>
        <div className="bl-sheet-heading">
          <button className="bl-sheet-x" onClick={onClose} aria-label="Indietro">‹</button>
          <div><h2>@{username}</h2></div>
          <button className="bl-sheet-x" onClick={onClose} aria-label="Chiudi">×</button>
        </div>

        {error && <p className="bl-error" role="alert">{error}</p>}
        {!error && !profile && <p className="bl-muted">Caricamento…</p>}

        {profile && <>
          <header className="bl-pp-head">
            <span className="bl-pp-avatar">{avatarNode}</span>
            <div>
              {fullName && <strong className="bl-pp-name">{fullName}</strong>}
              {ageLine && <span>{ageLine}</span>}
              <small>{memberSince(profile.member_since)}</small>
            </div>
            {showActions && <div className="bl-pp-actions" role="group" aria-label={`Azioni su @${username}`}>
              {onMessage && <button type="button" className="bl-pp-act" onClick={() => onMessage(username)} aria-label={`Scrivi a @${username}`} title="Invia un messaggio"><MessageCircle size={21} /></button>}
              {onToggleFavorite && <button type="button" className={`bl-pp-act ${isFavorite ? "is-fav" : ""}`} onClick={() => onToggleFavorite(username)} aria-pressed={isFavorite} aria-label={isFavorite ? `Rimuovi @${username} dai preferiti` : `Aggiungi @${username} ai preferiti`} title={isFavorite ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}><Star size={21} fill={isFavorite ? "currentColor" : "none"} /></button>}
            </div>}
          </header>

          {profile.is_me && priv && (
            <details className="bl-pp-priv">
              <summary>Cosa vedono gli altri di me</summary>
              <label><input type="checkbox" checked={priv.show_name} onChange={(e) => savePriv({ ...priv, show_name: e.target.checked })} /> Mostra il mio nome e cognome</label>
              <label>Età e data di nascita
                <select value={priv.birth_mode} onChange={(e) => savePriv({ ...priv, birth_mode: e.target.value })}>
                  <option value="nobody">Non mostrare</option>
                  <option value="age">Solo l'età</option>
                  <option value="full">Data di nascita ed età</option>
                </select>
              </label>
              <label><input type="checkbox" checked={priv.show_bubbles} onChange={(e) => savePriv({ ...priv, show_bubbles: e.target.checked })} /> Mostra le mie bolle nel profilo</label>
              <small>Di default è tutto nascosto. Se hai meno di 18 anni cognome e data di nascita non vengono mai mostrati.</small>
            </details>
          )}

          {!profile.show_bubbles && <p className="bl-muted">Questo utente non mostra le sue bolle.</p>}
          {profile.show_bubbles && tiles === null && <p className="bl-muted">Carico le bolle…</p>}
          {groups && tiles.length === 0 && profile.show_bubbles && <p className="bl-muted">Nessuna bolla da mostrare per ora 🫧</p>}
          {groups && tiles.length > 0 && !profile.is_me && <p className="bl-pp-legend" role="note"><b>🫧 Da scoppiare</b>: sfocata, usa 1 scoppio · <b>✓ Già scoppiata</b>: in chiaro, la rivedi gratis</p>}
          {groups && <>
            {profile.is_me
              ? renderSection({ title: "Le tue bolle", items: groups.mine, cls: "is-mine" })
              : <>
                  {renderSection({ title: "Da scoppiare", hint: "Tocca una bolla per scoppiarla e scoprirla, senza uscire dal profilo.", items: groups.locked, cls: "is-locked" })}
                  {renderSection({ title: "Già scoppiate da te", hint: "Tocca per rivederle quando vuoi, gratis.", items: groups.popped, cls: "is-popped" })}
                  {renderSection({ title: "Capsule", items: groups.mine, cls: "is-capsule" })}
                </>}
            {renderSection({ title: "Svanite", hint: "Le bolle durano poco: queste non ci sono più.", items: groups.expired, cls: "is-expired" })}
          </>}
        </>}

        {confirm && <div className="bl-pp-confirm" role="alertdialog" aria-label="Conferma scoppio">
          <p><strong>Scoppiare questa bolla?</strong> Usa 1 scoppio. Dopo averla vista la ritrovi tra le «già scoppiate» e la puoi rivedere gratis.</p>
          <div><button type="button" onClick={() => setConfirm(null)}>Annulla</button><button type="button" className="primary" onClick={() => open(confirm, true)}>Scoppia 🫧</button></div>
        </div>}
      </div>
    </div>
  );
}

const CSS = `
.bl-pp{max-height:92dvh;overflow-y:auto;overscroll-behavior:contain}
.bl-pp-head{display:flex;align-items:center;gap:14px;margin:4px 0 14px}
.bl-pp-avatar{display:grid;place-items:center;flex:none;width:68px;height:68px;border-radius:50%;overflow:hidden;background:rgba(255,255,255,.7);font-size:34px}
.bl-pp-head>div:not(.bl-pp-actions){display:flex;flex-direction:column;gap:2px;min-width:0}
.bl-pp-name{font-size:19px;overflow-wrap:anywhere}
.bl-pp-head span{font-weight:600}
.bl-pp-head small{opacity:.75}
.bl-pp-actions{display:flex;gap:8px;margin-left:auto;flex:none}
.bl-root .bl-pp .bl-pp-act{display:grid;place-items:center;width:46px;height:46px;padding:0;border-radius:50%;border:1px solid rgba(146,118,216,.55)!important;background:rgba(146,118,216,.18)!important;color:#7a5cc8!important;cursor:pointer;touch-action:manipulation}
.bl-root:not(.bl-appearance-light) .bl-pp .bl-pp-act{color:#e4d9ff!important}
.bl-root .bl-pp .bl-pp-act.is-fav{background:#f5b301!important;border-color:#f5b301!important;color:#3a2600!important}
.bl-root .bl-pp .bl-pp-act:focus-visible{outline:3px solid #9276d8;outline-offset:2px}
.bl-pp-legend{margin:0 0 12px;font-size:12px;line-height:1.5;opacity:.85}
.bl-pp-priv{margin:0 0 14px;padding:10px 12px;border-radius:16px;background:rgba(106,95,176,.12);display:flex;flex-direction:column;gap:8px}
.bl-pp-priv summary{cursor:pointer;font-weight:700}
.bl-pp-priv label{display:flex;flex-direction:column;gap:4px;font-size:14px}
.bl-pp-priv label:has(input[type=checkbox]){flex-direction:row;align-items:center;gap:8px}
.bl-pp-priv select{min-height:40px;border-radius:10px;padding:0 8px}
.bl-pp-sec{margin:0 0 18px}
.bl-pp-sec h3{display:flex;align-items:center;gap:8px;margin:0 0 2px;font-size:15px}
.bl-pp-sec h3 em{font-style:normal;font-size:12px;padding:2px 8px;border-radius:999px;background:rgba(106,95,176,.18)}
.bl-pp-sec>p{margin:0 0 10px;font-size:13px;opacity:.75}
.bl-pp-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px 10px;list-style:none;margin:10px 0 0;padding:0}
.bl-pp-grid li{display:flex;flex-direction:column;align-items:center;gap:6px;min-width:0}
.bl-pp-grid small{text-align:center;font-size:11px;line-height:1.25;opacity:.85}
.bl-pp-badge{display:inline-block;padding:2px 8px;border-radius:99px;font:700 10px/1.3 system-ui;font-style:normal;white-space:nowrap}
.bl-pp-badge.is-locked{background:#ffe4a8;color:#5b3a00}
.bl-pp-badge.is-popped{background:#c6f1d8;color:#0f5132}
.bl-pp-badge.is-mine{background:#e3d8ff;color:#3b2a78}
.bl-pp-tile{position:relative;width:100%;aspect-ratio:1;border-radius:50%;padding:0;overflow:hidden;cursor:pointer;
  display:grid;place-items:center;border:2px solid rgba(255,255,255,.85);-webkit-tap-highlight-color:transparent;transition:transform .2s}
.bl-pp-tile:active{transform:scale(.94)}
.bl-pp-tile:focus-visible{outline:3px solid #6a5fb0;outline-offset:3px}
/* da scoppiare: sfera sfocata e deformata, con alone */
.bl-pp-tile.is-locked{background:radial-gradient(circle at 35% 30%,hsla(var(--h),90%,90%,.9),hsla(var(--h),80%,70%,.85));
  box-shadow:inset 0 0 14px rgba(255,255,255,.7),0 0 0 3px hsla(var(--h),90%,70%,.35),0 6px 18px hsla(var(--h),60%,50%,.35);animation:bl-pp-pulse 3s ease-in-out infinite}
@keyframes bl-pp-pulse{0%,100%{box-shadow:inset 0 0 14px rgba(255,255,255,.7),0 0 0 3px hsla(var(--h),90%,70%,.3),0 6px 18px hsla(var(--h),60%,50%,.3)}50%{box-shadow:inset 0 0 14px rgba(255,255,255,.7),0 0 0 6px hsla(var(--h),90%,70%,.2),0 6px 22px hsla(var(--h),60%,50%,.5)}}
.bl-pp-img{position:absolute;inset:-6%;background-size:cover;background-position:center;filter:saturate(1.3);transform:scale(1.2) rotate(6deg)}
@supports (filter:url(#a)){.bl-pp-img{filter:url(#bl-pp-warp) saturate(1.3)}}
.bl-pp-img--b{opacity:.5;mix-blend-mode:soft-light;transform:scale(1.35) rotate(-24deg) scaleX(-1);filter:saturate(1.5)!important}
.bl-pp-blobs i{position:absolute;border-radius:50%;width:70%;height:70%;opacity:.85}
.bl-pp-blobs i:nth-child(1){left:-10%;top:-8%;background:radial-gradient(circle,hsla(var(--h),95%,72%,.95),transparent 70%)}
.bl-pp-blobs i:nth-child(2){right:-12%;bottom:-8%;background:radial-gradient(circle,hsla(calc(var(--h) + 55),95%,74%,.9),transparent 70%)}
.bl-pp-shine{position:absolute;width:34%;height:14%;top:12%;left:16%;border-radius:50%;rotate:-34deg;background:radial-gradient(ellipse,rgba(255,255,255,.95),transparent 70%)}
/* già scoppiate: nitide, con spunta */
.bl-pp-tile.is-popped,.bl-pp-tile.is-mine{border-color:#2fa86a;background:rgba(255,255,255,.6)}
.bl-pp-tile.is-mine{border-color:#fff}
.bl-pp-clear{position:absolute;inset:0;background-size:cover;background-position:center}
.bl-pp-clear.is-soft{filter:saturate(1.1)}
.bl-pp-check{position:absolute;right:6%;bottom:6%;width:24px;height:24px;display:grid;place-items:center;border-radius:50%;background:#2fa86a;color:#fff;font:800 14px/1 system-ui;border:2px solid #fff}
.bl-pp-play{position:absolute;left:6%;bottom:6%;width:22px;height:22px;display:grid;place-items:center;border-radius:50%;background:#51457f;color:#fff;font-size:10px}
.bl-pp-glyph{font-size:28px;opacity:.7}
/* svanite */
.bl-pp-tile.is-expired,.bl-pp-tile.is-capsule{background:rgba(120,120,140,.18);border:2px dashed rgba(120,120,140,.55);cursor:default}
/* conferma scoppio */
.bl-pp-confirm{position:sticky;bottom:0;z-index:5;display:grid;gap:10px;margin:8px -4px -4px;padding:14px;border-radius:18px;background:#fff;color:#2b1d47;box-shadow:0 -6px 30px rgba(20,10,50,.35);border:1px solid #d8cbee}
.bl-pp-confirm p{margin:0;font-size:13.5px;line-height:1.45;color:#45396a!important}
.bl-pp-confirm strong{color:#2b1d47}
.bl-pp-confirm>div{display:flex;gap:10px}
.bl-root .bl-pp .bl-pp-confirm button{flex:1;min-height:46px;border-radius:14px;border:1px solid #cfc3e6!important;background:#f4effb!important;color:#2b1d47!important;font:700 14px system-ui;cursor:pointer}
.bl-root .bl-pp .bl-pp-confirm button.primary{background:linear-gradient(110deg,#a18ce8,#e9a0ce)!important;border-color:transparent!important;color:#fff!important}
@media (prefers-reduced-motion:reduce){.bl-pp-tile.is-locked{animation:none}}
`;