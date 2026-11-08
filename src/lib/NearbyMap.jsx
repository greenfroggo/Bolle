import React, { useEffect, useMemo, useRef, useState } from "react";

/* Mappa «Vicino a me» senza librerie esterne.
   - Mappa vera: tessere OpenStreetMap disegnate con la matematica standard delle «slippy map», tinte con i colori dell'app.
     Se le tessere non si caricano (offline, blocco di rete) resta uno sfondo morbido con anelli di distanza: la mappa funziona comunque.
   - Ogni bolla geolocalizzata è una bolla sulla mappa; toccandola compare una scheda con distanza e pulsante per aprirla.
   - Le coordinate vengono lette da `lat`/`lng` (o nomi equivalenti) se il feed le fornisce.
     Altrimenti la bolla è messa alla sua distanza reale (`distance_km`) con una direzione indicativa, e la mappa lo dice. */

const TILE = 256;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const hashStr = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

const worldPx = (lat, lng, z) => {
  const size = TILE * 2 ** z;
  const sin = Math.sin((clamp(lat, -85.0511, 85.0511) * Math.PI) / 180);
  return { x: ((lng + 180) / 360) * size, y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * size };
};
const metersPerPixel = (lat, z) => (156543.03392 * Math.cos((lat * Math.PI) / 180)) / 2 ** z;

function bubbleCoords(b) {
  const lat = Number(b?.lat ?? b?.latitude ?? b?.geo_lat ?? b?.approx_lat);
  const lng = Number(b?.lng ?? b?.lon ?? b?.longitude ?? b?.geo_lng ?? b?.approx_lng);
  return Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0) ? { lat, lng } : null;
}

/* Posizione indicativa: distanza reale, direzione ricavata dall'id (stabile). */
function placeByDistance(center, b) {
  const km = Number(b?.distance_km);
  if (!Number.isFinite(km)) return null;
  const ang = (hashStr(String(b.id)) % 3600) / 3600 * Math.PI * 2;
  const dLat = (km * Math.cos(ang)) / 111.32;
  const dLng = (km * Math.sin(ang)) / (111.32 * Math.max(0.2, Math.cos((center.lat * Math.PI) / 180)));
  return { lat: center.lat + dLat, lng: center.lng + dLng };
}

const KIND_ICON = { photo: "📷", video: "🎬", gif: "🎞️", poll: "📊", question: "❓", thought: "💭", confession: "💜", truth: "🕵️", rating: "⭐", meme: "😂", capsule: "⏳" };
const fmtRadius = (km) => (km < 1 ? `${Math.round(km * 1000)} m` : `${km} km`);
const fmtDist = (km) => (!Number.isFinite(Number(km)) ? "" : Number(km) < 1 ? `${Math.max(10, Math.round(Number(km) * 100) * 10)} m` : `${Number(km).toFixed(Number(km) < 10 ? 1 : 0)} km`);

export default function NearbyMap({ center, radiusKm = 5, bubbles = [], getKind, onOpen, locked = false, collapsed = false, onToggle, radii = [], onRadius }) {
  const boxRef = useRef(null);
  const [size, setSize] = useState({ w: 340, h: 200 });
  const [zoomShift, setZoomShift] = useState(0);
  const [selected, setSelected] = useState(null);
  const [tilesOk, setTilesOk] = useState(true);
  const failed = useRef(0);

  useEffect(() => {
    const el = boxRef.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      if (width > 40 && height > 40) setSize({ w: Math.round(width), h: Math.round(height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [collapsed]);

  useEffect(() => { setZoomShift(0); setSelected(null); failed.current = 0; setTilesOk(true); }, [radiusKm, center?.lat, center?.lng]);

  const view = useMemo(() => {
    if (!center) return null;
    const fit = Math.log2((156543.03392 * Math.cos((center.lat * Math.PI) / 180) * 0.42 * Math.min(size.w, size.h)) / (radiusKm * 1000));
    const z = clamp(Math.floor(fit) + zoomShift, 3, 18);
    const c = worldPx(center.lat, center.lng, z);
    const origin = { x: c.x - size.w / 2, y: c.y - size.h / 2 };
    return { z, c, origin, mpp: metersPerPixel(center.lat, z) };
  }, [center, radiusKm, size, zoomShift]);

  const tiles = useMemo(() => {
    if (!view) return [];
    const { z, origin } = view, n = 2 ** z, out = [];
    for (let ty = Math.floor(origin.y / TILE); ty <= Math.floor((origin.y + size.h) / TILE); ty++) {
      if (ty < 0 || ty >= n) continue;
      for (let tx = Math.floor(origin.x / TILE); tx <= Math.floor((origin.x + size.w) / TILE); tx++) {
        out.push({ key: `${z}/${tx}/${ty}`, url: `https://tile.openstreetmap.org/${z}/${((tx % n) + n) % n}/${ty}.png`, left: tx * TILE - origin.x, top: ty * TILE - origin.y });
      }
    }
    return out;
  }, [view, size]);

  const markers = useMemo(() => {
    if (!view || !center) return { list: [], approx: false };
    let approx = false;
    const list = [];
    for (const b of bubbles) {
      if (!b || b.starter || b.system) continue;
      let pos = bubbleCoords(b);
      if (!pos) { pos = placeByDistance(center, b); if (pos) approx = true; }
      if (!pos) continue;
      const p = worldPx(pos.lat, pos.lng, view.z);
      list.push({ b, x: p.x - view.origin.x, y: p.y - view.origin.y });
    }
    return { list, approx };
  }, [bubbles, center, view]);

  if (!center || !view) return null;
  const ringPx = (radiusKm * 1000) / view.mpp;
  const sel = markers.list.find((m) => m.b.id === selected)?.b || null;
  const total = markers.list.length;

  return (
    <section className={`bl-map ${collapsed ? "is-collapsed" : ""}`} aria-label="Mappa delle bolle vicino a te">
      <header className="bl-map-bar">
        <span className="bl-map-title">⌖ <b>{total}</b> {total === 1 ? "bolla" : "bolle"} entro {fmtRadius(radiusKm)}</span>
        <span className="bl-map-actions">
          {!collapsed && <>
            <button type="button" onClick={() => setZoomShift((v) => clamp(v - 1, -3, 4))} aria-label="Allontana la mappa" disabled={view.z <= 3}>−</button>
            <button type="button" onClick={() => setZoomShift((v) => clamp(v + 1, -3, 4))} aria-label="Avvicina la mappa" disabled={view.z >= 18}>+</button>
          </>}
          <button type="button" className="bl-map-toggle" onClick={onToggle} aria-expanded={!collapsed} aria-label={collapsed ? "Mostra la mappa" : "Nascondi la mappa"}>{collapsed ? "Mappa ▾" : "▴"}</button>
        </span>
      </header>
      {!collapsed && radii.length > 0 && onRadius && (
        <div className="bl-map-radii" role="group" aria-label="Distanza">
          {radii.map((r) => <button key={r} type="button" className={r === radiusKm ? "on" : ""} aria-pressed={r === radiusKm} onClick={() => onRadius(r)}>{fmtRadius(r)}</button>)}
        </div>
      )}
      {!collapsed && (
        <div className="bl-map-box" ref={boxRef} onClick={() => setSelected(null)}>
          <div className="bl-map-bg" aria-hidden="true" />
          {tilesOk && (
            <div className="bl-map-tiles" aria-hidden="true">
              {tiles.map((t) => (
                <img key={t.key} src={t.url} alt="" width={TILE} height={TILE} draggable={false} decoding="async" referrerPolicy="strict-origin-when-cross-origin"
                  style={{ transform: `translate(${t.left}px,${t.top}px)` }}
                  onError={() => { failed.current += 1; if (failed.current >= 3) setTilesOk(false); }} />
              ))}
            </div>
          )}
          <div className="bl-map-tint" aria-hidden="true" />
          <svg className="bl-map-rings" width={size.w} height={size.h} aria-hidden="true">
            {[1, 0.5].map((f) => <circle key={f} cx={size.w / 2} cy={size.h / 2} r={ringPx * f} className={f === 1 ? "bl-map-ring" : "bl-map-ring bl-map-ring--in"} />)}
          </svg>
          <span className="bl-map-me" style={{ left: size.w / 2, top: size.h / 2 }} aria-label="La tua posizione"><i /></span>
          {markers.list.map(({ b, x, y }, i) => {
            if (x < -20 || y < -20 || x > size.w + 20 || y > size.h + 20) return null;
            const k = getKind ? getKind(b) : "photo";
            const on = selected === b.id;
            return (
              <button key={b.id} type="button" className={`bl-map-pin ${on ? "on" : ""}`} style={{ left: x, top: y, "--h": (hashStr(String(b.id)) % 300) + 20, animationDelay: `${(i % 8) * 70}ms` }}
                aria-label={`Bolla di ${b.username || b.author_username || "utente"}${fmtDist(b.distance_km) ? `, a ${fmtDist(b.distance_km)}` : ""}`} aria-pressed={on}
                onClick={(e) => { e.stopPropagation(); setSelected(on ? null : b.id); }}>
                <span aria-hidden="true">{KIND_ICON[k] || "🫧"}</span>
              </button>
            );
          })}
          {!total && <p className="bl-map-empty">Nessuna bolla di utenti in quest'area.<br /><small>Prova con un raggio più grande.</small></p>}
          {sel && (
            <div className="bl-map-card" role="dialog" aria-label="Bolla selezionata" onClick={(e) => e.stopPropagation()}>
              <div><b>@{sel.username || sel.author_username || "utente"}</b>{fmtDist(sel.distance_km) && <small>a {fmtDist(sel.distance_km)}</small>}</div>
              <button type="button" onClick={() => { onOpen?.(sel); setSelected(null); }}>{locked ? "Scopri" : "Scoppia"} 🫧</button>
            </div>
          )}
          <a className="bl-map-credit" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>© OpenStreetMap</a>
          {markers.approx && <small className="bl-map-note">Direzione indicativa: la distanza è reale</small>}
        </div>
      )}
    </section>
  );
}
