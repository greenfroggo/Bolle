import { useEffect, useRef, useState } from "react";
import { useWidth } from "./OverlayEditor.jsx";

/* =====================================================================
   Editor foto/video in stile Instagram: filtri con intensità, regolazioni
   (luminosità, contrasto, calore, saturazione, dissolvenza, vignettatura),
   ritaglio con raddrizzamento / rotazione / specchio, sticker, taglio video.

   FOTO   → tutto viene "cotto" nel JPEG al momento della pubblicazione (bakeImage):
            nessuna colonna SQL, vale in ogni punto dell'app (feed, chat, profilo…).
   VIDEO  → non si può rielaborare nel browser senza scaldare il telefono: filtro,
            regolazioni, taglio e muto sono salvati come metadati (bolle_set_media_edit)
            e applicati in riproduzione da <EditedVideo>.
   Anteprima e file finale usano la stessa matrice colore (le stesse formule dei filtri CSS),
   quindi ciò che si vede nell'editor è ciò che viene pubblicato.
   ===================================================================== */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const round2 = (v) => Math.round(v * 100) / 100;
export const MAX_STICKERS = 10;

/* ---------------------------- modello ---------------------------- */
export const DEFAULT_ADJ = { brightness: 0, contrast: 0, saturation: 0, warmth: 0, fade: 0, vignette: 0 };
export const DEFAULT_CROP = { aspect: "orig", zoom: 1, x: 0, y: 0, angle: 0, rot: 0, flip: false };
export const defaultEdit = () => ({ filter: "normal", strength: 1, adj: { ...DEFAULT_ADJ }, crop: { ...DEFAULT_CROP }, trim: null, muted: false });

/* Approssimazioni dei filtri più noti (b=luminosità c=contrasto s=saturazione sepia gray hue warm fade) */
export const FILTERS = [
  { id: "normal", label: "Normale" },
  { id: "clarendon", label: "Clarendon", c: 1.18, s: 1.3, b: 1.05, warm: -0.12 },
  { id: "gingham", label: "Gingham", b: 1.05, hue: -10, s: 0.9, fade: 0.18 },
  { id: "moon", label: "Moon", gray: 1, c: 1.1, b: 1.08 },
  { id: "lark", label: "Lark", c: 0.92, b: 1.1, s: 1.2, warm: -0.1 },
  { id: "reyes", label: "Reyes", sepia: 0.22, b: 1.1, c: 0.85, s: 0.8, fade: 0.15 },
  { id: "juno", label: "Juno", sepia: 0.12, c: 1.12, b: 1.08, s: 1.35, warm: 0.25 },
  { id: "slumber", label: "Slumber", s: 0.68, b: 1.04, fade: 0.18, warm: 0.18 },
  { id: "crema", label: "Crema", sepia: 0.2, c: 0.92, b: 1.08, s: 0.9, warm: 0.1 },
  { id: "ludwig", label: "Ludwig", b: 1.04, c: 1.06, s: 0.92, warm: 0.08 },
  { id: "aden", label: "Aden", hue: -18, c: 0.9, s: 0.85, b: 1.18, fade: 0.1 },
  { id: "perpetua", label: "Perpetua", b: 1.04, s: 1.1, warm: -0.05, fade: 0.08 },
];
const ADJUSTMENTS = [
  ["brightness", "Luminosità", -100, 100], ["contrast", "Contrasto", -100, 100], ["warmth", "Calore", -100, 100],
  ["saturation", "Saturazione", -100, 100], ["fade", "Dissolvenza", 0, 100], ["vignette", "Vignettatura", 0, 100],
];
const ASPECTS = [["orig", "Originale"], ["1:1", "1:1"], ["4:5", "4:5"], ["9:16", "9:16"], ["16:9", "16:9"]];
const WARM = "rgb(255,150,40)", COOL = "rgb(40,120,255)";

/* Parametri effettivi = filtro (scalato dall'intensità) + regolazioni manuali */
export function resolveFx(edit) {
  const f = FILTERS.find((x) => x.id === edit.filter) || FILTERS[0];
  const k = clamp(edit.strength ?? 1, 0, 1);
  const lerp = (v, n) => n + ((v ?? n) - n) * k;
  const a = edit.adj || DEFAULT_ADJ;
  const fade = clamp(lerp(f.fade, 0) + a.fade / 100, 0, 1);
  return {
    brightness: clamp(lerp(f.b, 1) + a.brightness / 200, 0.4, 1.6),
    contrast: clamp((lerp(f.c, 1) + a.contrast / 200) * (1 - 0.2 * fade), 0.4, 1.6),
    saturate: clamp(lerp(f.s, 1) + a.saturation / 100, 0, 2),
    sepia: clamp(lerp(f.sepia, 0), 0, 1),
    gray: clamp(lerp(f.gray, 0), 0, 1),
    hue: lerp(f.hue, 0),
    warmth: clamp(lerp(f.warm, 0) + a.warmth / 100, -1, 1),
    fade,
    vignette: clamp(a.vignette / 100, 0, 1),
  };
}
export function fxCss(fx) {
  if (!fx) return "none";
  const p = [];
  if (fx.brightness !== 1) p.push(`brightness(${fx.brightness.toFixed(3)})`);
  if (fx.contrast !== 1) p.push(`contrast(${fx.contrast.toFixed(3)})`);
  if (fx.saturate !== 1) p.push(`saturate(${fx.saturate.toFixed(3)})`);
  if (fx.sepia) p.push(`sepia(${fx.sepia.toFixed(3)})`);
  if (fx.gray) p.push(`grayscale(${fx.gray.toFixed(3)})`);
  if (fx.hue) p.push(`hue-rotate(${fx.hue.toFixed(1)}deg)`);
  return p.length ? p.join(" ") : "none";
}

/* ----- matrice colore: stesse formule dei filtri CSS (spec "Filter Effects"), applicate in ordine ----- */
const I4 = () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
function mul(A, B) {
  const o = new Array(16).fill(0);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { let s = 0; for (let k = 0; k < 4; k++) s += A[i * 4 + k] * B[k * 4 + j]; o[i * 4 + j] = s; }
  return o;
}
const m3 = (a, b, c, d, e, f, g, h, i, o = [0, 0, 0]) => [a, b, c, o[0], d, e, f, o[1], g, h, i, o[2], 0, 0, 0, 1];
function fxMatrix(fx) {
  let T = I4();
  const apply = (M) => { T = mul(M, T); };
  if (fx.brightness !== 1) { const b = fx.brightness; apply(m3(b, 0, 0, 0, b, 0, 0, 0, b)); }
  if (fx.contrast !== 1) { const c = fx.contrast, o = 0.5 * (1 - c); apply(m3(c, 0, 0, 0, c, 0, 0, 0, c, [o, o, o])); }
  if (fx.saturate !== 1) { const s = fx.saturate; apply(m3(0.213 + 0.787 * s, 0.715 - 0.715 * s, 0.072 - 0.072 * s, 0.213 - 0.213 * s, 0.715 + 0.285 * s, 0.072 - 0.072 * s, 0.213 - 0.213 * s, 0.715 - 0.715 * s, 0.072 + 0.928 * s)); }
  if (fx.sepia) { const a = 1 - fx.sepia; apply(m3(0.393 + 0.607 * a, 0.769 - 0.769 * a, 0.189 - 0.189 * a, 0.349 - 0.349 * a, 0.686 + 0.314 * a, 0.168 - 0.168 * a, 0.272 - 0.272 * a, 0.534 - 0.534 * a, 0.131 + 0.869 * a)); }
  if (fx.gray) { const a = 1 - fx.gray; apply(m3(0.2126 + 0.7874 * a, 0.7152 - 0.7152 * a, 0.0722 - 0.0722 * a, 0.2126 - 0.2126 * a, 0.7152 + 0.2848 * a, 0.0722 - 0.0722 * a, 0.2126 - 0.2126 * a, 0.7152 - 0.7152 * a, 0.0722 + 0.9278 * a)); }
  if (fx.hue) {
    const r = (fx.hue * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r);
    apply(m3(0.213 + c * 0.787 - s * 0.213, 0.715 - c * 0.715 - s * 0.715, 0.072 - c * 0.072 + s * 0.928,
      0.213 - c * 0.213 + s * 0.143, 0.715 + c * 0.285 + s * 0.14, 0.072 - c * 0.072 - s * 0.283,
      0.213 - c * 0.213 - s * 0.787, 0.715 - c * 0.715 + s * 0.715, 0.072 + c * 0.928 + s * 0.072));
  }
  return T;
}
const isIdentityMatrix = (T) => T.every((v, i) => Math.abs(v - I4()[i]) < 1e-4);
function applyMatrix(img, T) {
  const d = img.data, n = d.length;
  const [a, b, c, e, f, g, h, i, j, k, l, m] = T;
  const eo = e * 255, io = i * 255, mo = m * 255;
  for (let p = 0; p < n; p += 4) {
    const r = d[p], gg = d[p + 1], bb = d[p + 2];
    d[p] = a * r + b * gg + c * bb + eo; d[p + 1] = f * r + g * gg + h * bb + io; d[p + 2] = j * r + k * gg + l * bb + mo; // Uint8ClampedArray satura da solo
  }
}

/* Calore · dissolvenza · vignettatura: livelli sopra la foto (canvas per le foto, <span> per i video) */
function paintFxLayers(ctx, W, H, fx) {
  if (fx.warmth) { ctx.save(); ctx.globalCompositeOperation = "soft-light"; ctx.globalAlpha = Math.min(1, Math.abs(fx.warmth) * 0.7); ctx.fillStyle = fx.warmth > 0 ? WARM : COOL; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  if (fx.fade) { ctx.save(); ctx.globalAlpha = fx.fade * 0.16; ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  if (fx.vignette) {
    const R = Math.hypot(W, H) / 2, g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, R);
    g.addColorStop(0.45, "rgba(0,0,0,0)"); g.addColorStop(1, `rgba(0,0,0,${fx.vignette * 0.7})`);
    ctx.save(); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
  }
}
export function FxLayers({ fx }) {
  if (!fx) return null;
  const base = { position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1 };
  return <>
    {fx.warmth !== 0 && <span aria-hidden="true" style={{ ...base, background: fx.warmth > 0 ? WARM : COOL, mixBlendMode: "soft-light", opacity: Math.min(1, Math.abs(fx.warmth) * 0.7) }} />}
    {fx.fade > 0 && <span aria-hidden="true" style={{ ...base, background: "#fff", opacity: fx.fade * 0.16 }} />}
    {fx.vignette > 0 && <span aria-hidden="true" style={{ ...base, background: `radial-gradient(circle farthest-corner at 50% 50%, rgba(0,0,0,0) 45%, rgba(0,0,0,${(fx.vignette * 0.7).toFixed(3)}) 100%)` }} />}
  </>;
}

/* ---------------------------- ritaglio ---------------------------- */
function cropGeometry(sw, sh, crop, outLong) {
  const rot = ((crop.rot % 4) + 4) % 4;
  const ew = rot % 2 ? sh : sw, eh = rot % 2 ? sw : sh;
  const ar = { "1:1": 1, "4:5": 4 / 5, "9:16": 9 / 16, "16:9": 16 / 9 }[crop.aspect] || ew / eh;
  const W = ar >= 1 ? outLong : outLong * ar, H = ar >= 1 ? outLong / ar : outLong;
  return { W: Math.max(1, Math.round(W)), H: Math.max(1, Math.round(H)), ew, eh };
}
/* Limita lo spostamento perché l'immagine copra sempre tutta la cornice (anche se raddrizzata) */
export function constrainPan(crop, sw, sh, W, H) {
  const { ew, eh } = cropGeometry(sw, sh, crop, Math.max(W, H));
  const phi = ((crop.angle || 0) * Math.PI) / 180, cs = Math.abs(Math.cos(phi)), sn = Math.abs(Math.sin(phi));
  const needW = W * cs + H * sn, needH = W * sn + H * cs;
  const s = Math.max(needW / ew, needH / eh) * clamp(crop.zoom || 1, 1, 4);
  const limA = Math.max(0, (s * ew - needW) / 2), limB = Math.max(0, (s * eh - needH) / 2);
  const px = (crop.x || 0) * W, py = (crop.y || 0) * H;
  const da = Math.abs(px) * cs + Math.abs(py) * sn, db = Math.abs(px) * sn + Math.abs(py) * cs;
  const k = Math.min(1, da > 1e-9 ? limA / da : 1, db > 1e-9 ? limB / db : 1);
  return { x: (px * k) / W, y: (py * k) / H, scale: s };
}
function drawCropped(ctx, src, sw, sh, W, H, crop) {
  const pan = constrainPan(crop, sw, sh, W, H);
  const rot = ((crop.rot % 4) + 4) % 4;
  ctx.save();
  ctx.translate(W / 2 + pan.x * W, H / 2 + pan.y * H);
  ctx.rotate(((crop.angle || 0) * Math.PI) / 180);
  if (crop.flip) ctx.scale(-1, 1);
  ctx.rotate((rot * Math.PI) / 2);
  ctx.scale(pan.scale, pan.scale);
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
  ctx.drawImage(src, -sw / 2, -sh / 2, sw, sh);
  ctx.restore();
  return pan;
}

/* Disegna l'immagine ritagliata + filtro sul canvas (anteprima, miniature e file finale) */
function renderEdit(canvas, src, sw, sh, edit, outLong) {
  const geo = cropGeometry(sw, sh, edit.crop, outLong);
  if (canvas.width !== geo.W) canvas.width = geo.W;
  if (canvas.height !== geo.H) canvas.height = geo.H;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, geo.W, geo.H);
  const pan = drawCropped(ctx, src, sw, sh, geo.W, geo.H, edit.crop);
  const fx = resolveFx(edit), T = fxMatrix(fx);
  if (!isIdentityMatrix(T)) { const id = ctx.getImageData(0, 0, geo.W, geo.H); applyMatrix(id, T); ctx.putImageData(id, 0, 0); }
  paintFxLayers(ctx, geo.W, geo.H, fx);
  return { W: geo.W, H: geo.H, pan };
}

/* ---------------------------- sticker ---------------------------- */
const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
const LABEL_FONT = 'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif';
const EMOJI_SETS = [
  ["Facce", "😀 😂 🥹 😍 🥰 😎 🤩 😜 🤪 😇 🥳 😭 😡 🤯 😴 🤔 🙄 😏"],
  ["Gesti", "👍 👏 🙌 🙏 💪 ✌️ 🤞 👀 🫶 🤝 👋 🤙"],
  ["Cuori", "❤️ 🧡 💛 💚 💙 💜 🖤 🤍 💖 💘 💝 ✨ 💫 ⭐ 🌟 🔥"],
  ["Festa", "🎉 🎊 🎂 🎁 🎈 🥂 🍾 🎶 🎵 🎤 🪩 🏆"],
  ["Natura", "🌈 ☀️ 🌙 ⛅ 🌊 🌸 🌻 🌴 🍀 🫧 🦋 🐶 🐱 🦄"],
  ["Cibo", "🍕 🍔 🍟 🍣 🍝 🍦 🍩 🍪 🍓 🍉 ☕ 🍺 🍷 🧋"],
].map(([name, list]) => [name, list.split(" ")]);
const LABELS = [["CIAO!", "grad"], ["WOW", "white"], ["LOL", "dark"], ["OMG", "grad"], ["TOP", "white"], ["BUONGIORNO", "dark"], ["BUONANOTTE", "grad"], ["#bolle", "white"]];
const LOOKS = { white: { bg: "#ffffff", fg: "#2b2150" }, dark: { bg: "rgba(0,0,0,.68)", fg: "#ffffff" }, grad: { bg: "linear-gradient(135deg,#8c7bdb,#ff6fa5)", fg: "#ffffff" } };
const labelDims = (fs) => ({ fs, h: fs * 1.7, pad: fs * 0.55 });

function stickerStyle(s, w) {
  const base = { position: "absolute", left: `${s.x}%`, top: `${s.y}%`, margin: 0, transform: `translate(-50%,-50%) rotate(${s.rotation}deg) scale(${s.scale})`, transformOrigin: "center", userSelect: "none", WebkitUserSelect: "none", whiteSpace: "nowrap", display: "grid", placeItems: "center" };
  if (s.kind === "emoji") return { ...base, fontSize: w * 0.18, lineHeight: 1, fontFamily: EMOJI_FONT };
  const { fs, h, pad } = labelDims(w * 0.07), look = LOOKS[s.look] || LOOKS.white;
  return { ...base, fontSize: fs, height: h, lineHeight: `${h}px`, padding: `0 ${pad}px`, borderRadius: 999, fontWeight: 800, fontFamily: LABEL_FONT, background: look.bg, color: look.fg, boxShadow: "0 2px 8px rgba(0,0,0,.28)" };
}
function drawStickers(ctx, W, H, stickers) {
  for (const s of stickers) {
    ctx.save();
    ctx.translate((s.x / 100) * W, (s.y / 100) * H); ctx.rotate((s.rotation * Math.PI) / 180); ctx.scale(s.scale, s.scale);
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    if (s.kind === "emoji") { ctx.font = `${W * 0.18}px ${EMOJI_FONT}`; ctx.fillStyle = "#000"; ctx.fillText(s.content, 0, 0); }
    else {
      const { fs, h } = labelDims(W * 0.07), look = LOOKS[s.look] || LOOKS.white;
      ctx.font = `800 ${fs}px ${LABEL_FONT}`;
      const pw = ctx.measureText(s.content).width + fs * 1.1, r = h / 2;
      let fill = look.bg;
      if (fill.startsWith("linear")) { const g = ctx.createLinearGradient(-pw / 2, -h / 2, pw / 2, h / 2); g.addColorStop(0, "#8c7bdb"); g.addColorStop(1, "#ff6fa5"); fill = g; }
      ctx.shadowColor = "rgba(0,0,0,.28)"; ctx.shadowBlur = 8; ctx.shadowOffsetY = 2;
      ctx.beginPath(); ctx.moveTo(-pw / 2 + r, -h / 2); ctx.lineTo(pw / 2 - r, -h / 2); ctx.arc(pw / 2 - r, 0, r, -Math.PI / 2, Math.PI / 2);
      ctx.lineTo(-pw / 2 + r, h / 2); ctx.arc(-pw / 2 + r, 0, r, Math.PI / 2, (Math.PI * 3) / 2); ctx.closePath();
      ctx.fillStyle = fill; ctx.fill();
      ctx.shadowColor = "transparent"; ctx.fillStyle = look.fg; ctx.fillText(s.content, 0, fs * 0.04);
    }
    ctx.restore();
  }
}
const newSticker = (kind, content, look) => ({ kind, content, look, x: 50 + (Math.random() * 14 - 7), y: 42 + (Math.random() * 14 - 7), scale: 1, rotation: 0 });

/* Livello sticker nell'editor: sposta con un dito, pizzica per ingrandire/ruotare, ⤡ come maniglia,
   trascina sul cestino in basso per eliminare. */
function StickerLayer({ stickers, onChange, sel, setSel, disabled, onBackgroundDown }) {
  const stageRef = useRef(null);
  const w = useWidth(stageRef);
  const ptrs = useRef(new Map());
  const gesture = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [overBin, setOverBin] = useState(false);
  const patch = (i, p) => onChange(stickers.map((s, k) => (k === i ? { ...s, ...p } : s)));
  const rect = () => stageRef.current.getBoundingClientRect();
  const inBin = (cx, cy) => { const r = rect(); return cy > r.bottom - r.height * 0.16 && Math.abs(cx - (r.left + r.width / 2)) < r.width * 0.2; };
  const norm = (deg) => ((((deg + 180) % 360) + 360) % 360) - 180;

  function down(e, i) {
    if (disabled) return;
    e.stopPropagation(); e.currentTarget.setPointerCapture?.(e.pointerId);
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    setSel(i);
    const s = stickers[i], pts = [...ptrs.current.values()];
    if (pts.length === 1) gesture.current = { type: "drag", i, sx: e.clientX, sy: e.clientY, ox: s.x, oy: s.y, moved: false };
    else if (pts.length >= 2) { const [a, b] = pts; gesture.current = { type: "pinch", i, d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, a0: Math.atan2(b.y - a.y, b.x - a.x), s0: s.scale, r0: s.rotation }; }
  }
  function handleDown(e, i) {
    if (disabled) return;
    e.stopPropagation(); e.currentTarget.setPointerCapture?.(e.pointerId);
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const r = rect(), s = stickers[i];
    const cx = r.left + (s.x / 100) * r.width, cy = r.top + (s.y / 100) * r.height, dx = e.clientX - cx, dy = e.clientY - cy;
    gesture.current = { type: "handle", i, cx, cy, d0: Math.hypot(dx, dy) || 1, a0: Math.atan2(dy, dx), s0: s.scale, r0: s.rotation };
  }
  function move(e) {
    const g = gesture.current;
    if (!g || !ptrs.current.has(e.pointerId)) return;
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const r = rect();
    if (g.type === "drag") {
      if (!g.moved && Math.hypot(e.clientX - g.sx, e.clientY - g.sy) > 6) { g.moved = true; setDragging(true); }
      if (!g.moved) return;
      setOverBin(inBin(e.clientX, e.clientY));
      patch(g.i, { x: clamp(g.ox + ((e.clientX - g.sx) / r.width) * 100, 2, 98), y: clamp(g.oy + ((e.clientY - g.sy) / r.height) * 100, 2, 98) });
    } else if (g.type === "pinch") {
      const [a, b] = [...ptrs.current.values()], d = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      patch(g.i, { scale: clamp(g.s0 * (d / g.d0), 0.4, 4), rotation: Math.round(norm(g.r0 + ((Math.atan2(b.y - a.y, b.x - a.x) - g.a0) * 180) / Math.PI)) });
    } else if (g.type === "handle") {
      const dx = e.clientX - g.cx, dy = e.clientY - g.cy;
      patch(g.i, { scale: clamp(g.s0 * (Math.hypot(dx, dy) / g.d0), 0.4, 4), rotation: Math.round(norm(g.r0 + ((Math.atan2(dy, dx) - g.a0) * 180) / Math.PI)) });
    }
  }
  function up(e) {
    const g = gesture.current;
    if (g?.type === "drag" && g.moved && inBin(e.clientX, e.clientY)) { onChange(stickers.filter((_, k) => k !== g.i)); setSel(null); }
    ptrs.current.delete(e.pointerId);
    if (ptrs.current.size === 0) { gesture.current = null; setDragging(false); setOverBin(false); }
    else if (ptrs.current.size === 1 && gesture.current?.type === "pinch") {
      const [p] = [...ptrs.current.values()], s = stickers[gesture.current.i];
      gesture.current = { type: "drag", i: gesture.current.i, sx: p.x, sy: p.y, ox: s.x, oy: s.y, moved: true };
    }
  }
  const knob = { position: "absolute", width: 26, height: 26, borderRadius: "50%", background: "#fff", color: "#4a3d8f", font: "700 14px/26px system-ui", textAlign: "center", boxShadow: "0 1px 6px rgba(0,0,0,.45)", touchAction: "none" };
  return (
    <div ref={stageRef} className="bl-me-stickers" style={{ position: "absolute", inset: 0, zIndex: 2, touchAction: "none", overflow: "hidden" }}
      onPointerMove={move} onPointerUp={up} onPointerCancel={up} onPointerDown={() => { setSel(null); onBackgroundDown?.(); }}>
      {stickers.map((s, i) => (
        <div key={i} onPointerDown={(e) => down(e, i)} style={{ ...stickerStyle(s, w), cursor: "grab", touchAction: "none", outline: sel === i ? "1.5px dashed rgba(255,255,255,.95)" : "none", outlineOffset: 4 }}>
          {s.content}
          {sel === i && !disabled && <>
            <span role="button" aria-label="Elimina lo sticker" tabIndex={0} onPointerDown={(e) => { e.stopPropagation(); onChange(stickers.filter((_, k) => k !== i)); setSel(null); }}
              style={{ ...knob, left: -16, top: -16, cursor: "pointer", transform: `scale(${1 / s.scale}) rotate(${-s.rotation}deg)` }}>✕</span>
            <span role="slider" aria-label="Ridimensiona e ruota lo sticker" aria-valuenow={Math.round(s.scale * 100)} tabIndex={0} onPointerDown={(e) => handleDown(e, i)} onPointerMove={move} onPointerUp={up}
              style={{ ...knob, right: -16, bottom: -16, cursor: "nwse-resize", transform: `scale(${1 / s.scale}) rotate(${-s.rotation}deg)` }}>⤡</span>
          </>}
        </div>
      ))}
      {dragging && <span aria-hidden="true" className={`bl-me-bin ${overBin ? "on" : ""}`}>🗑</span>}
    </div>
  );
}

/* ---------------------------- sorgente ---------------------------- */
async function loadBitmap(file) {
  try { return await createImageBitmap(file, { imageOrientation: "from-image" }); }
  catch {
    return await new Promise((resolve, reject) => { const url = URL.createObjectURL(file); const img = new Image(); img.onload = () => { URL.revokeObjectURL(url); resolve(img); }; img.onerror = reject; img.src = url; });
  }
}
function coverThumb(source, sw, sh, size = 84) {
  const c = document.createElement("canvas"); c.width = size; c.height = size;
  const s = Math.max(size / sw, size / sh);
  c.getContext("2d").drawImage(source, (size - sw * s) / 2, (size - sh * s) / 2, sw * s, sh * s);
  return c;
}
/* Immagini modificabili: JPEG/PNG/WebP. GIF e altri formati restano com'erano (solo testo e tag). */
export const isEditableImage = (file) => /^image\/(jpeg|png|webp)$/.test(file?.type || "");
function useMediaSource(file) {
  const [st, setSt] = useState({ status: "loading", kind: "image" });
  useEffect(() => {
    let alive = true;
    if (!file) { setSt({ status: "plain", kind: "image" }); return undefined; }
    if (file.type.startsWith("video/")) { setSt({ status: "ready", kind: "video" }); return undefined; }
    if (!isEditableImage(file)) { setSt({ status: "plain", kind: "image" }); return undefined; }
    setSt({ status: "loading", kind: "image" });
    (async () => {
      try {
        const bmp = await loadBitmap(file);
        const bw = bmp.width || bmp.naturalWidth, bh = bmp.height || bmp.naturalHeight;
        const sc = Math.min(1, 1100 / Math.max(bw, bh));
        const c = document.createElement("canvas"); c.width = Math.max(1, Math.round(bw * sc)); c.height = Math.max(1, Math.round(bh * sc));
        c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
        const thumb = coverThumb(bmp, bw, bh);
        bmp.close?.();
        if (alive) setSt({ status: "ready", kind: "image", src: c, sw: c.width, sh: c.height, thumb });
      } catch { if (alive) setSt({ status: "plain", kind: "image" }); }
    })();
    return () => { alive = false; };
  }, [file]);
  return st;
}

/* ---------------------------- esportazione ---------------------------- */
export function hasPhotoEdits(edit, stickers = []) {
  const fx = resolveFx(edit);
  const c = edit.crop;
  return !isIdentityMatrix(fxMatrix(fx)) || fx.warmth !== 0 || fx.fade > 0 || fx.vignette > 0 || stickers.length > 0
    || c.aspect !== "orig" || c.zoom !== 1 || c.angle !== 0 || c.rot % 4 !== 0 || c.flip;
}
/* Cuoce ritaglio + filtro + sticker in un JPEG (max 1600 px sul lato lungo). */
export async function bakeImage(file, edit, stickers = [], maxSide = 1600, quality = 0.86) {
  const bmp = await loadBitmap(file);
  try {
    const sw = bmp.width || bmp.naturalWidth, sh = bmp.height || bmp.naturalHeight;
    const canvas = document.createElement("canvas");
    const geo = renderEdit(canvas, bmp, sw, sh, edit, Math.min(maxSide, Math.max(sw, sh)));
    drawStickers(canvas.getContext("2d"), geo.W, geo.H, stickers);
    const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", quality));
    if (!blob) throw new Error("Impossibile applicare le modifiche alla foto.");
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } finally { bmp.close?.(); }
}
/* Video: solo metadati. null = nessuna modifica da salvare. */
export function videoEditPayload(edit) {
  const dirty = (edit.filter !== "normal" && edit.strength > 0) || Object.values(edit.adj).some((v) => v !== 0) || edit.trim || edit.muted;
  if (!dirty) return null;
  return { v: 1, filter: edit.filter, strength: round2(edit.strength), adj: edit.adj, trim: edit.trim ? { start: round2(edit.trim.start), end: round2(edit.trim.end) } : null, muted: edit.muted === true };
}
export function sanitizeVideoEdit(raw) {
  if (!raw || typeof raw !== "object") return null;
  const num = (v, a, b, d = 0) => (Number.isFinite(Number(v)) ? clamp(Number(v), a, b) : d);
  const e = defaultEdit();
  e.filter = FILTERS.some((f) => f.id === raw.filter) ? raw.filter : "normal";
  e.strength = num(raw.strength, 0, 1, 1);
  for (const [k, , lo, hi] of ADJUSTMENTS) e.adj[k] = num(raw.adj?.[k], lo, hi, 0);
  if (raw.trim && Number(raw.trim.end) > Number(raw.trim.start) && Number.isFinite(Number(raw.trim.start))) e.trim = { start: Math.max(0, Number(raw.trim.start)), end: Number(raw.trim.end) };
  e.muted = raw.muted === true;
  return e;
}

/* ---------- Riproduzione di un video modificato (viewer): filtro CSS leggero, taglio e muto ---------- */
export function EditedVideo({ src, edit }) {
  const ref = useRef(null);
  const fx = edit ? resolveFx(edit) : null;
  const trim = edit?.trim || null;
  useEffect(() => {
    if (!trim) return undefined;
    const id = setInterval(() => {
      const v = ref.current;
      if (v && (v.currentTime >= trim.end - 0.05 || v.currentTime < trim.start - 0.3)) { v.currentTime = trim.start; v.play?.().catch(() => {}); }
    }, 80);
    return () => clearInterval(id);
  }, [trim?.start, trim?.end]); // eslint-disable-line react-hooks/exhaustive-deps
  return <>
    <video ref={ref} src={src} autoPlay playsInline loop controls={false} muted={edit?.muted === true}
      style={fx ? { filter: fxCss(fx) } : undefined}
      onLoadedMetadata={() => { if (trim && ref.current) ref.current.currentTime = trim.start; }} />
    <FxLayers fx={fx} />
  </>;
}

/* ---------------------------- interfaccia ---------------------------- */
function useBox(ref) {
  const [b, setB] = useState({ w: 360, h: 640 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const read = () => { const r = el.getBoundingClientRect(); if (r.width && r.height) setB({ w: r.width, h: r.height }); };
    read();
    if (typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return b;
}
function FilterThumb({ id, label, thumbSrc, active, onPick, disabled }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!thumbSrc || !ref.current) return;
    try { renderEdit(ref.current, thumbSrc, thumbSrc.width, thumbSrc.height, { filter: id, strength: 1, adj: DEFAULT_ADJ, crop: DEFAULT_CROP }, 72); } catch { /* miniatura non disponibile */ }
  }, [thumbSrc, id]);
  return <button type="button" className={`bl-me-thumb ${active ? "on" : ""}`} aria-pressed={active} disabled={disabled} onClick={() => onPick(id)}>
    <canvas ref={ref} width={72} height={72} aria-hidden="true" /><span>{label}</span>
  </button>;
}
const fmtTime = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

/* Schermo intero: la foto occupa tutto lo spazio, i pulsanti stanno a destra e ogni strumento apre un pannello in basso.
   renderStage() → testi sopra la foto (dentro la cornice) · renderRail({openStickers, stickersOpen, toolButtons}) → barra a destra
   (OverlayRail con gli strumenti come figli) · footer → pulsante Pubblica · more → tag e opzioni (pannello «Tag»). */
export default function MediaEditor({ file, preview, edit, setEdit, stickers, setStickers, stickerSel, setStickerSel, disabled = false, onBackgroundDown, onBack, onClose, changePhoto, error, footer, more, renderStage, renderRail }) {
  const src = useMediaSource(file);
  const isVideo = src.kind === "video";
  const canEdit = src.status === "ready";
  const canSticker = canEdit && !isVideo;
  const [tool, setTool] = useState(null); // null = nessun pannello aperto: la foto resta a tutto schermo
  const [adjKey, setAdjKey] = useState("brightness");
  const [stickerTab, setStickerTab] = useState(0);
  const [dur, setDur] = useState(0);
  const [vThumb, setVThumb] = useState(null);
  const [mediaAspect, setMediaAspect] = useState(0); // proporzioni di video / immagine non modificabile
  const stageRef = useRef(null), canvasRef = useRef(null), frameRef = useRef(null), geoRef = useRef(null), vref = useRef(null);
  const box = useBox(stageRef);
  const ptrs = useRef(new Map()), gesture = useRef(null);
  const fx = resolveFx(edit);

  useEffect(() => { if ((tool === "crop" || tool === "stickers") && !canSticker) setTool(null); if (tool === "trim" && !isVideo) setTool(null); }, [tool, canSticker, isVideo]);

  // Anteprima della foto: ritaglio + filtro sul canvas, una volta per fotogramma
  useEffect(() => {
    if (!canSticker) return undefined;
    const id = requestAnimationFrame(() => { if (canvasRef.current) geoRef.current = renderEdit(canvasRef.current, src.src, src.sw, src.sh, edit, 760); });
    return () => cancelAnimationFrame(id);
  }, [src, canSticker, edit.filter, edit.strength, edit.adj, edit.crop]); // eslint-disable-line react-hooks/exhaustive-deps

  // Video: ripete soltanto la parte scelta
  useEffect(() => {
    if (!isVideo) return undefined;
    const id = setInterval(() => {
      const v = vref.current;
      if (!v || !dur) return;
      const t0 = edit.trim?.start ?? 0, t1 = edit.trim?.end ?? dur;
      if (v.currentTime >= t1 - 0.04 || v.currentTime < t0 - 0.3) { v.currentTime = t0; v.play?.().catch(() => {}); }
    }, 80);
    return () => clearInterval(id);
  }, [isVideo, dur, edit.trim]);

  const setAdj = (k, v) => setEdit((e) => ({ ...e, adj: { ...e.adj, [k]: v } }));
  const setCrop = (p, constrain = true) => setEdit((e) => {
    let crop = { ...e.crop, ...p };
    const g = geoRef.current;
    if (constrain && g && src.src) { const c = constrainPan(crop, src.sw, src.sh, g.W, g.H); crop = { ...crop, x: c.x, y: c.y }; }
    return { ...e, crop };
  });
  const setTrim = (start, end) => setEdit((e) => ({ ...e, trim: start <= 0.05 && end >= dur - 0.05 ? null : { start, end } }));

  // Ritaglio: un dito sposta la foto, due dita la ingrandiscono
  const cropDown = (e) => {
    if (disabled) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...ptrs.current.values()], pan = geoRef.current?.pan || { x: 0, y: 0 };
    if (pts.length === 1) gesture.current = { type: "pan", sx: e.clientX, sy: e.clientY, ox: pan.x, oy: pan.y };
    else { const [a, b] = pts; gesture.current = { type: "zoom", d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, z0: edit.crop.zoom }; }
  };
  const cropMove = (e) => {
    const g = gesture.current;
    if (!g || !ptrs.current.has(e.pointerId)) return;
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const r = frameRef.current.getBoundingClientRect();
    if (g.type === "pan") setCrop({ x: g.ox + (e.clientX - g.sx) / r.width, y: g.oy + (e.clientY - g.sy) / r.height });
    else { const [a, b] = [...ptrs.current.values()]; setCrop({ zoom: clamp(g.z0 * (Math.hypot(a.x - b.x, a.y - b.y) / g.d0), 1, 4) }); }
  };
  const cropUp = (e) => {
    ptrs.current.delete(e.pointerId);
    if (ptrs.current.size === 0) gesture.current = null;
    else if (ptrs.current.size === 1) { const [p] = [...ptrs.current.values()], pan = geoRef.current?.pan || { x: 0, y: 0 }; gesture.current = { type: "pan", sx: p.x, sy: p.y, ox: pan.x, oy: pan.y }; }
  };

  const onVideoReady = (e) => {
    const v = e.currentTarget;
    setDur(v.duration && Number.isFinite(v.duration) ? v.duration : 0);
    if (v.videoWidth && v.videoHeight) setMediaAspect(v.videoWidth / v.videoHeight);
    try { setVThumb(coverThumb(v, v.videoWidth || 1, v.videoHeight || 1)); } catch { /* nessuna miniatura */ }
  };
  const thumbSrc = isVideo ? vThumb : src.thumb;
  const adj = ADJUSTMENTS.find((a) => a[0] === adjKey);
  const trimStart = edit.trim?.start ?? 0, trimEnd = edit.trim?.end ?? dur, minLen = Math.min(1, dur || 1);
  const showOverlays = tool !== "crop";
  const toggleTool = (id) => setTool((t) => (t === id ? null : id));

  // Cornice della foto: la proporzione più grande che sta nello schermo intero
  const aspect = canSticker ? (() => { const g = cropGeometry(src.sw, src.sh, edit.crop, 1000); return g.W / g.H; })() : (mediaAspect || 1);
  const fw = Math.min(box.w, box.h * aspect), fh = fw / aspect;

  const railBtn = (id, icon, label) => (
    <button key={id} type="button" className="bl-ov-rail-btn" aria-pressed={tool === id} aria-label={label} title={label} disabled={disabled} onClick={() => toggleTool(id)}>
      <span style={{ fontSize: 17, lineHeight: 1 }}>{icon}</span><small>{label}</small>
    </button>
  );
  const toolButtons = <>
    {canEdit && railBtn("filters", "✨", "Filtri")}
    {canEdit && railBtn("adjust", "◐", "Modifica")}
    {canSticker && railBtn("crop", "⛶", "Ritaglia")}
    {isVideo && railBtn("trim", "✂️", "Taglia")}
    {more && railBtn("more", "🏷", "Tag")}
  </>;
  const titles = { filters: "Filtri", adjust: "Modifica", crop: "Ritaglia", stickers: "Sticker", trim: "Taglia il video", more: "Tag e opzioni" };

  return (
    <div className="bl-me-full" role="group" aria-label="Modifica la foto o il video">
      <div className="bl-me-stage" ref={stageRef}>
        <div className="bl-story-frame bl-cmp-frame" ref={frameRef} style={{ width: fw, height: fh }}>
          {src.status === "loading" && <p className="bl-muted bl-me-loading">Preparo la foto…</p>}
          {src.status === "plain" && <img src={preview} alt="Anteprima" onLoad={(e) => { const i = e.currentTarget; if (i.naturalWidth) setMediaAspect(i.naturalWidth / i.naturalHeight); }} />}
          {canSticker && <canvas ref={canvasRef} className="bl-me-canvas" aria-label="Anteprima della foto modificata" />}
          {isVideo && <>
            <video ref={vref} src={preview} muted playsInline loop autoPlay style={{ filter: fxCss(fx) }} onLoadedData={onVideoReady} onLoadedMetadata={(e) => { const v = e.currentTarget; setDur(v.duration || 0); if (v.videoWidth && v.videoHeight) setMediaAspect(v.videoWidth / v.videoHeight); }} />
            <FxLayers fx={fx} />
          </>}
          {canSticker && showOverlays && <StickerLayer stickers={stickers} onChange={setStickers} sel={stickerSel} setSel={setStickerSel} disabled={disabled} onBackgroundDown={onBackgroundDown} />}
          {canSticker && tool === "crop" && <div className="bl-me-cropgrid" style={{ position: "absolute", inset: 0, zIndex: 4, touchAction: "none", cursor: "grab" }} onPointerDown={cropDown} onPointerMove={cropMove} onPointerUp={cropUp} onPointerCancel={cropUp}><i /><i /><i /><i /></div>}
          {showOverlays && typeof renderStage === "function" && renderStage()}
        </div>
      </div>

      <div className="bl-me-top">
        {onBack && <button type="button" className="bl-me-top-btn" onClick={onBack} disabled={disabled} aria-label="Indietro">‹</button>}
        {changePhoto}
        <span className="bl-me-top-fill" />
        {onClose && <button type="button" className="bl-me-top-btn" onClick={onClose} disabled={disabled} aria-label="Chiudi">×</button>}
      </div>

      {typeof renderRail === "function" && renderRail({ openStickers: canSticker && !disabled ? () => toggleTool("stickers") : null, stickersOpen: tool === "stickers", toolButtons })}

      {tool && (tool !== "more" || more) && <div className="bl-me-drawer" role="region" aria-label={titles[tool]}>
        <div className="bl-me-drawer-head"><strong>{titles[tool]}</strong><button type="button" aria-label="Chiudi il pannello" onClick={() => setTool(null)}>⌄</button></div>
        <div className="bl-me-panel">
          {tool === "filters" && <>
            <div className="bl-me-filters" role="group" aria-label="Filtri">
              {FILTERS.map((f) => <FilterThumb key={f.id} id={f.id} label={f.label} thumbSrc={thumbSrc} active={edit.filter === f.id} disabled={disabled} onPick={(id) => setEdit((e) => ({ ...e, filter: id, strength: 1 }))} />)}
            </div>
            {edit.filter !== "normal" && <label className="bl-me-range"><span>Intensità <b>{Math.round(edit.strength * 100)}</b></span>
              <input type="range" min={0} max={100} value={Math.round(edit.strength * 100)} disabled={disabled} onChange={(e) => setEdit((x) => ({ ...x, strength: Number(e.target.value) / 100 }))} /></label>}
          </>}

          {tool === "adjust" && <>
            <div className="bl-me-chips" role="group" aria-label="Regolazioni">
              {ADJUSTMENTS.map(([k, label]) => <button key={k} type="button" className={`${adjKey === k ? "on" : ""} ${edit.adj[k] ? "dirty" : ""}`} aria-pressed={adjKey === k} onClick={() => setAdjKey(k)}>{label}</button>)}
            </div>
            <label className="bl-me-range"><span>{adj[1]} <b>{edit.adj[adjKey]}</b></span>
              <input type="range" min={adj[2]} max={adj[3]} value={edit.adj[adjKey]} disabled={disabled} onChange={(e) => setAdj(adjKey, Number(e.target.value))} onDoubleClick={() => setAdj(adjKey, 0)} /></label>
            <button type="button" className="bl-me-link" disabled={disabled || !Object.values(edit.adj).some((v) => v !== 0)} onClick={() => setEdit((e) => ({ ...e, adj: { ...DEFAULT_ADJ } }))}>Azzera le regolazioni</button>
          </>}

          {tool === "crop" && canSticker && <>
            <div className="bl-me-chips" role="group" aria-label="Proporzioni">
              {ASPECTS.map(([id, label]) => <button key={id} type="button" className={edit.crop.aspect === id ? "on" : ""} aria-pressed={edit.crop.aspect === id} disabled={disabled} onClick={() => setCrop({ aspect: id, x: 0, y: 0 }, false)}>{label}</button>)}
              <button type="button" aria-label="Ruota di 90 gradi" disabled={disabled} onClick={() => setCrop({ rot: (edit.crop.rot + 1) % 4, x: 0, y: 0 }, false)}>⟳ Ruota</button>
              <button type="button" aria-pressed={edit.crop.flip} className={edit.crop.flip ? "on" : ""} disabled={disabled} onClick={() => setCrop({ flip: !edit.crop.flip })}>⇋ Specchia</button>
            </div>
            <label className="bl-me-range"><span>Raddrizza <b>{edit.crop.angle}°</b></span>
              <input type="range" min={-45} max={45} value={edit.crop.angle} disabled={disabled} onChange={(e) => setCrop({ angle: Number(e.target.value) })} onDoubleClick={() => setCrop({ angle: 0 })} /></label>
            <label className="bl-me-range"><span>Zoom <b>{Math.round(edit.crop.zoom * 100)}%</b></span>
              <input type="range" min={100} max={300} value={Math.round(edit.crop.zoom * 100)} disabled={disabled} onChange={(e) => setCrop({ zoom: Number(e.target.value) / 100 })} /></label>
            <small className="bl-muted">Trascina la foto per spostarla · pizzica per ingrandire</small>
            <button type="button" className="bl-me-link" disabled={disabled} onClick={() => setEdit((e) => ({ ...e, crop: { ...DEFAULT_CROP } }))}>Ripristina il ritaglio</button>
          </>}

          {tool === "stickers" && canSticker && <>
            <div className="bl-me-chips" role="tablist" aria-label="Categorie di sticker">
              {EMOJI_SETS.map(([name], i) => <button key={name} type="button" role="tab" aria-selected={stickerTab === i} className={stickerTab === i ? "on" : ""} onClick={() => setStickerTab(i)}>{name}</button>)}
              <button type="button" role="tab" aria-selected={stickerTab === -1} className={stickerTab === -1 ? "on" : ""} onClick={() => setStickerTab(-1)}>Testi</button>
            </div>
            <div className="bl-me-grid" role="group" aria-label="Sticker disponibili">
              {stickerTab >= 0
                ? EMOJI_SETS[stickerTab][1].map((em) => <button key={em} type="button" disabled={disabled || stickers.length >= MAX_STICKERS} aria-label={`Aggiungi ${em}`} onClick={() => { setStickers([...stickers, newSticker("emoji", em)]); setStickerSel(stickers.length); }}>{em}</button>)
                : <>
                  {LABELS.map(([t, look]) => <button key={t} type="button" className="bl-me-label" disabled={disabled || stickers.length >= MAX_STICKERS} onClick={() => { setStickers([...stickers, newSticker("label", t, look)]); setStickerSel(stickers.length); }}>{t}</button>)}
                  <button type="button" className="bl-me-label" disabled={disabled || stickers.length >= MAX_STICKERS} onClick={() => { setStickers([...stickers, newSticker("label", "🕒 " + new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }), "dark")]); setStickerSel(stickers.length); }}>🕒 Ora</button>
                  <button type="button" className="bl-me-label" disabled={disabled || stickers.length >= MAX_STICKERS} onClick={() => { setStickers([...stickers, newSticker("label", "📅 " + new Date().toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" }), "white")]); setStickerSel(stickers.length); }}>📅 Data</button>
                </>}
            </div>
            <small className="bl-muted">{stickers.length}/{MAX_STICKERS} · trascina per spostare · pizzica per ingrandire e ruotare · trascina sul cestino per eliminare</small>
          </>}

          {tool === "trim" && isVideo && <>
            {dur > 0 ? <>
              <label className="bl-me-range"><span>Inizio <b>{fmtTime(trimStart)}</b></span>
                <input type="range" min={0} max={dur} step={0.1} value={trimStart} disabled={disabled} onChange={(e) => { const s = Math.min(Number(e.target.value), trimEnd - minLen); setTrim(s, trimEnd); if (vref.current) vref.current.currentTime = s; }} /></label>
              <label className="bl-me-range"><span>Fine <b>{fmtTime(trimEnd)}</b></span>
                <input type="range" min={0} max={dur} step={0.1} value={trimEnd} disabled={disabled} onChange={(e) => { const t = Math.max(Number(e.target.value), trimStart + minLen); setTrim(trimStart, t); }} /></label>
              <small className="bl-muted">Durata scelta: {fmtTime(trimEnd - trimStart)} su {fmtTime(dur)}</small>
            </> : <small className="bl-muted">Carico la durata del video…</small>}
            <button type="button" className={`bl-me-chip-toggle ${edit.muted ? "on" : ""}`} aria-pressed={edit.muted} disabled={disabled} onClick={() => setEdit((e) => ({ ...e, muted: !e.muted }))}>{edit.muted ? "🔇 Audio disattivato" : "🔊 Audio attivo"}</button>
          </>}
          {tool === "more" && more}
        </div>
      </div>}

      <div className="bl-me-footer">
        {error && <p className="bl-error" role="alert">{error}</p>}
        {footer}
      </div>
    </div>
  );
}