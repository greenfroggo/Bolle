import { useId } from "react";

/* Icone illustrate per i temi di Bolle.
   Stile "gel-vetro": ogni oggetto ha volume (gradienti), luce speculare e un piccolo
   dettaglio a bolla, così appartiene al mondo di Bolle invece di sembrare una glyph generica. */

const U = (u, k) => `url(#${u}${k})`;
const defs = (u, spec) => (
  <defs>
    {Object.entries(spec).map(([k, [t, ...cs]]) => {
      const stops = cs.map((c, i) => <stop key={i} offset={cs.length > 1 ? i / (cs.length - 1) : 0} stopColor={c} />);
      return t === "r"
        ? <radialGradient key={k} id={u + k} cx=".35" cy=".3" r=".85">{stops}</radialGradient>
        : <linearGradient key={k} id={u + k} x1="0" y1="0" x2={t === "h" ? 1 : 0} y2={t === "h" ? 0 : 1}>{stops}</linearGradient>;
    })}
  </defs>
);
const Eli = (cx, cy, rx, ry, rot = 0, o = 0.5) => <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#fff" opacity={o} transform={rot ? `rotate(${rot} ${cx} ${cy})` : undefined} />;
const rad = (d) => (d * Math.PI) / 180;
const pol = (cx, cy, r, deg) => [+(cx + r * Math.cos(rad(deg))).toFixed(2), +(cy + r * Math.sin(rad(deg))).toFixed(2)];
const starPts = (cx, cy, R, r, n = 5, rot = -90) => Array.from({ length: n * 2 }, (_, i) => pol(cx, cy, i % 2 ? r : R, rot + (i * 180) / n).join(",")).join(" ");
const spark4 = (cx, cy, R, k = 0.18) => `M${cx} ${cy - R}Q${cx + R * k} ${cy - R * k} ${cx + R} ${cy}Q${cx + R * k} ${cy + R * k} ${cx} ${cy + R}Q${cx - R * k} ${cy + R * k} ${cx - R} ${cy}Q${cx - R * k} ${cy - R * k} ${cx} ${cy - R}Z`;
const J = { strokeLinejoin: "round", strokeLinecap: "round" };
const rot = (a, cx = 32, cy = 32) => `rotate(${a} ${cx} ${cy})`;
const Bub = (cx, cy, r, o = 1, k) => (
  <g key={k} opacity={o}>
    <circle cx={cx} cy={cy} r={r} fill="#bfe9ff" fillOpacity=".16" stroke="#fff" strokeOpacity=".8" strokeWidth={Math.max(0.7, r * 0.12)} />
    <circle cx={cx - r * 0.35} cy={cy - r * 0.38} r={Math.max(0.8, r * 0.22)} fill="#fff" opacity=".95" />
  </g>
);

const WEB = (() => { const p = (r, a) => pol(32, 32, r, a); let d = ""; [8, 16, 24].forEach((r) => { for (let i = 0; i < 8; i++) { const a = i * 45, A = p(r, a), B = p(r, a + 45), C = p(r * 0.8, a + 22.5); d += `${i ? "" : `M${A[0]} ${A[1]}`}Q${C[0]} ${C[1]} ${B[0]} ${B[1]}`; } }); return d; })();
const GALAXY = (k) => { let d = ""; for (let i = 0; i <= 40; i++) { const t = i / 40, [x, y] = pol(0, 0, 3 + t * 27, k * 180 + t * 300); d += `${i ? "L" : "M"}${x} ${y}`; } return d; };
const SEEDS = Array.from({ length: 46 }, (_, i) => { const [x, y] = pol(32, 28, 1.5 * Math.sqrt(i + 1), (i + 1) * 137.5); return [x, y, i]; });
const palmFrond = "M35 22C42 9 57 8 62 19C52 14 44 17 35 22Z";

const ICONS = {
  /* ───────── Halloween ───────── */
  bat: (u) => (<>{defs(u, { w: ["l", "#7a49c8", "#2b1257"], b: ["r", "#6a3cb4", "#2a1256"] })}
    <path d="M32 24C26 15 13 13 3 20C8 24 8 30 6 36C12 33 16 35 18 41C22 36 27 36 29 42C30 38 31 36 32 36C33 36 34 38 35 42C37 36 42 36 46 41C48 35 52 33 58 36C56 30 56 24 61 20C51 13 38 15 32 24Z" fill={U(u, "w")} stroke="#1c0b3d" strokeWidth="1.4" {...J} />
    <path d="M32 31L12 24M32 32L10 33M32 33L18 40M32 31L52 24M32 32L54 33M32 33L46 40" stroke="#c9a6ff" strokeOpacity=".35" strokeWidth="1" fill="none" {...J} />
    <path d="M26 24L25 12L31 20ZM38 24L39 12L33 20Z" fill="#3b1c78" stroke="#1c0b3d" strokeWidth="1.2" {...J} />
    <ellipse cx="32" cy="30" rx="7" ry="8.5" fill={U(u, "b")} stroke="#1c0b3d" strokeWidth="1.2" />
    <circle cx="29.2" cy="29" r="2" fill="#ffd54a" /><circle cx="34.8" cy="29" r="2" fill="#ffd54a" /><circle cx="29.2" cy="29" r=".8" fill="#2a0f00" /><circle cx="34.8" cy="29" r=".8" fill="#2a0f00" />
    <path d="M30 35L30.6 38L31.6 35ZM33.6 35L34.4 38L34.9 35Z" fill="#fff" />{Eli(29, 25, 4, 1.4, -20, 0.25)}</>),
  pumpkin: (u) => (<>{defs(u, { o: ["r", "#ffb347", "#ff7a14", "#c94a00"], g: ["l", "#fff6a8", "#ffb81f"], s: ["l", "#7ac143", "#3f6b1c"] })}
    <ellipse cx="19" cy="37" rx="14" ry="20" fill={U(u, "o")} stroke="#a33a00" strokeWidth="1.2" /><ellipse cx="45" cy="37" rx="14" ry="20" fill={U(u, "o")} stroke="#a33a00" strokeWidth="1.2" />
    <ellipse cx="32" cy="37" rx="13" ry="22" fill={U(u, "o")} stroke="#a33a00" strokeWidth="1.2" />
    <path d="M29 16C29 10 33 7 37 6L39 10C36 11 35.5 13 36 17Z" fill={U(u, "s")} stroke="#2e4d12" strokeWidth="1" {...J} />
    <path d="M21 34L29 34L25 26ZM35 34L43 34L39 26ZM19 42L25 47L28 42L32 48L36 42L39 47L45 42L42 51L36 53L32 50L28 53L22 51Z" fill={U(u, "g")} stroke="#6b2400" strokeWidth="1.2" {...J} />
    {Eli(14, 28, 3, 7, 25, 0.3)}</>),
  ghost: (u) => (<>{defs(u, { g: ["l", "#ffffff", "#cdc5ff", "#a79bf0"] })}
    <path d="M13 57V30C13 17 21 8 32 8C43 8 51 17 51 30V57L45 51L38.5 57L32 51L25.5 57L19 51Z" fill={U(u, "g")} stroke="#8d80dc" strokeWidth="1.3" {...J} />
    <ellipse cx="25.5" cy="29" rx="3.2" ry="4.6" fill="#2a2150" /><ellipse cx="38.5" cy="29" rx="3.2" ry="4.6" fill="#2a2150" />
    <circle cx="24.6" cy="27.4" r="1" fill="#fff" /><circle cx="37.6" cy="27.4" r="1" fill="#fff" />
    <ellipse cx="32" cy="39" rx="3.4" ry="4.6" fill="#2a2150" /><circle cx="20" cy="36" r="3" fill="#ff9ccb" opacity=".55" /><circle cx="44" cy="36" r="3" fill="#ff9ccb" opacity=".55" />
    {Eli(21, 18, 4, 8, 30, 0.6)}{Bub(54, 12, 4)}</>),
  web: (u) => (<>{defs(u, { w: ["l", "#ffffff", "#bda8ff"] })}
    <g stroke={U(u, "w")} strokeWidth="1.5" fill="none" {...J}>
      <path d="M32 32L58 32M32 32L50.4 50.4M32 32L32 58M32 32L13.6 50.4M32 32L6 32M32 32L13.6 13.6M32 32L32 6M32 32L50.4 13.6" /><path d={WEB} />
    </g>
    {[[38, 20.5], [22, 40.5], [46.5, 36], [27, 14]].map(([x, y], i) => Bub(x, y, 2.2, 0.95, i))}{Bub(32, 32, 3.4)}</>),
  witchhat: (u) => (<>{defs(u, { h: ["h", "#8a4fd6", "#3a1a70"], b: ["l", "#ffcb4a", "#e08a10"] })}
    <ellipse cx="32" cy="51" rx="28" ry="7" fill="#2c1258" stroke="#1a0a38" strokeWidth="1.2" />
    <path d="M21 50L29 20C30 12 38 8 45 12C40 13 39 17 40 22L44 50Z" fill={U(u, "h")} stroke="#1a0a38" strokeWidth="1.3" {...J} />
    <path d="M22.5 43L42.6 43L44 50L21 50Z" fill={U(u, "b")} stroke="#8a4b00" strokeWidth="1" {...J} /><rect x="28" y="43" width="8" height="7" rx="1.2" fill="none" stroke="#7a3d00" strokeWidth="1.5" />
    <path d={spark4(31, 30, 3.6)} fill="#ffe27a" />{Eli(29, 28, 1.6, 8, 12, 0.3)}</>),
  spider: (u) => {
    const legs = "M27 29Q15 18 6 25M26 33Q11 30 5 40M26 38Q13 41 9 53M28 42Q20 50 18 60";
    return (<>{defs(u, { b: ["r", "#4a4560", "#16121f"] })}
      <path d="M32 0V22" stroke="#e8e0ff" strokeOpacity=".7" strokeWidth="1" />
      <g stroke="#1a1626" strokeWidth="2.6" fill="none" {...J}><path d={legs} /><g transform="translate(64 0) scale(-1 1)"><path d={legs} /></g></g>
      <ellipse cx="32" cy="42" rx="9.5" ry="11.5" fill={U(u, "b")} stroke="#0e0b16" strokeWidth="1.2" /><circle cx="32" cy="28" r="6" fill={U(u, "b")} stroke="#0e0b16" strokeWidth="1.2" />
      <path d="M32 36L35 42L32 48L29 42Z" fill="#ff3b5c" /><circle cx="29.6" cy="27" r="1.4" fill="#ff5e7e" /><circle cx="34.4" cy="27" r="1.4" fill="#ff5e7e" />{Eli(28, 38, 2, 5, 10, 0.3)}</>);
  },
  moon: (u) => (<>{defs(u, { m: ["l", "#fff7d1", "#ffd86b", "#f0a93a"] })}
    <path d="M44 7A25 25 0 1 0 57 45A20 20 0 1 1 44 7Z" fill={U(u, "m")} stroke="#c98a1f" strokeWidth="1.2" {...J} />
    <ellipse cx="22" cy="28" rx="4" ry="3.4" fill="#e9b24f" opacity=".5" /><ellipse cx="27" cy="44" rx="3" ry="2.6" fill="#e9b24f" opacity=".5" /><ellipse cx="17" cy="40" rx="1.8" ry="1.6" fill="#e9b24f" opacity=".5" />
    <path d={spark4(52, 14, 5)} fill="#fff6c0" /><path d={spark4(48, 52, 3)} fill="#fff6c0" />{Eli(17, 22, 2, 7, 20, 0.45)}</>),
  skull: (u) => (<>{defs(u, { s: ["l", "#ffffff", "#e3dccb", "#bdb39d"], bn: ["l", "#f2ead6", "#b9ad92"] })}
    <g transform={rot(35, 32, 50)}><rect x="6" y="47" width="52" height="7" rx="3.5" fill={U(u, "bn")} stroke="#9a8d73" strokeWidth="1" /><circle cx="8" cy="47" r="4" fill="#efe6d0" /><circle cx="8" cy="54" r="4" fill="#efe6d0" /><circle cx="56" cy="47" r="4" fill="#efe6d0" /><circle cx="56" cy="54" r="4" fill="#efe6d0" /></g>
    <g transform={rot(-35, 32, 50)}><rect x="6" y="47" width="52" height="7" rx="3.5" fill={U(u, "bn")} stroke="#9a8d73" strokeWidth="1" /><circle cx="8" cy="47" r="4" fill="#efe6d0" /><circle cx="8" cy="54" r="4" fill="#efe6d0" /><circle cx="56" cy="47" r="4" fill="#efe6d0" /><circle cx="56" cy="54" r="4" fill="#efe6d0" /></g>
    <path d="M32 6C18 6 11 16 11 27C11 34 15 38 19 41V48C19 50 21 52 23 52H41C43 52 45 50 45 48V41C49 38 53 34 53 27C53 16 46 6 32 6Z" fill={U(u, "s")} stroke="#8a7f68" strokeWidth="1.3" {...J} />
    <ellipse cx="23.5" cy="28" rx="6" ry="7" fill="#1d1830" /><ellipse cx="40.5" cy="28" rx="6" ry="7" fill="#1d1830" /><circle cx="23.5" cy="29" r="1.8" fill="#9dff7a" /><circle cx="40.5" cy="29" r="1.8" fill="#9dff7a" />
    <path d="M32 36L28.6 42H35.4Z" fill="#2b2540" /><path d="M25.5 46V52M29 46V52M32 46V52M35 46V52M38.5 46V52" stroke="#8a7f68" strokeWidth="1.1" />{Eli(19, 15, 2.4, 6, 30, 0.55)}</>),

  /* ───────── Natale ───────── */
  tree: (u) => (<>{defs(u, { g: ["l", "#3fbf6a", "#0f6a3a"], t: ["l", "#9a5a2b", "#5a2f12"] })}
    <rect x="27.5" y="53" width="9" height="8" rx="1.5" fill={U(u, "t")} />
    {["M32 14L44 31H20Z", "M32 24L48 44H16Z", "M32 36L53 56H11Z"].map((d, i) => <path key={i} d={d} fill={U(u, "g")} stroke="#0b4a28" strokeWidth="3.4" {...J} />)}
    {["M32 14L44 31H20Z", "M32 24L48 44H16Z", "M32 36L53 56H11Z"].map((d, i) => <path key={"f" + i} d={d} fill={U(u, "g")} {...J} />)}
    <path d="M22 33Q32 28 42 33M19 46Q32 40 46 46" stroke="#ffe27a" strokeWidth="1.6" strokeDasharray="1.2 3.2" fill="none" {...J} />
    <polygon points={starPts(32, 9, 7, 3, 5)} fill="#ffd54a" stroke="#c98a00" strokeWidth="1" {...J} />
    <circle cx="27" cy="40" r="3" fill="#ff4b4b" /><circle cx="38" cy="48" r="3.2" fill="#4bb3ff" /><circle cx="24" cy="52" r="2.6" fill="#ffd54a" /><circle cx="36" cy="30" r="2.4" fill="#ff7ad9" />
    <circle cx="26.2" cy="39.2" r=".9" fill="#fff" /><circle cx="37.2" cy="47" r=".9" fill="#fff" /></>),
  snowflake: (u) => (<>{defs(u, { i: ["l", "#ffffff", "#8fd8ff"] })}
    <g stroke={U(u, "i")} strokeWidth="2.6" fill="none" {...J}>{[0, 60, 120, 180, 240, 300].map((a) => <g key={a} transform={rot(a)}><path d="M32 32V5M32 13L26.5 7.5M32 13L37.5 7.5M32 22L25.5 16.5M32 22L38.5 16.5" /><circle cx="32" cy="4.6" r="1.6" fill="#fff" stroke="none" /></g>)}</g>
    <polygon points={starPts(32, 32, 5.2, 4.4, 6, 0)} fill="#e8f8ff" stroke="#8fd8ff" strokeWidth="1" {...J} /></>),
  gift: (u) => (<>{defs(u, { r: ["l", "#ff5d6c", "#c4142e"], l: ["l", "#ff4a5c", "#a50f27"], g: ["l", "#fff0a0", "#f0b11f"] })}
    <rect x="11" y="29" width="42" height="28" rx="3" fill={U(u, "r")} stroke="#7e0b1e" strokeWidth="1.2" /><rect x="8" y="21" width="48" height="11" rx="3" fill={U(u, "l")} stroke="#7e0b1e" strokeWidth="1.2" />
    <rect x="28" y="21" width="8" height="36" fill={U(u, "g")} /><path d="M32 21C24 7 11 10 15 18C17 22 26 22 32 21ZM32 21C40 7 53 10 49 18C47 22 38 22 32 21Z" fill={U(u, "g")} stroke="#b4780a" strokeWidth="1.1" {...J} />
    <circle cx="32" cy="21" r="3.6" fill="#ffd24a" stroke="#b4780a" strokeWidth="1" />{Eli(17, 40, 2.5, 8, 0, 0.28)}{Bub(55, 12, 3.4)}</>),
  star: (u) => { const o = Array.from({ length: 5 }, (_, i) => pol(32, 33, 26, -90 + i * 72)), n = Array.from({ length: 5 }, (_, i) => pol(32, 33, 11, -54 + i * 72));
    return (<>{defs(u, { s: ["l", "#fff3a0", "#ffc21f"] })}
      <polygon points={starPts(32, 33, 26, 11)} fill={U(u, "s")} stroke="#c98a00" strokeWidth="1.6" {...J} />
      {o.map((p, i) => <g key={i}><polygon points={`32,33 ${p.join(",")} ${n[i].join(",")}`} fill="#fff" opacity=".28" /><polygon points={`32,33 ${p.join(",")} ${n[(i + 4) % 5].join(",")}`} fill="#d98a00" opacity=".22" /></g>)}</>); },
  bell: (u) => (<>{defs(u, { g: ["h", "#c98412", "#ffe27a", "#d89a1b"] })}
    <circle cx="32" cy="7" r="3.4" fill={U(u, "g")} stroke="#8a5a00" strokeWidth="1" />
    <path d="M32 9C22 9 18 19 18 29C18 39 14 42 9 47H55C50 42 46 39 46 29C46 19 42 9 32 9Z" fill={U(u, "g")} stroke="#8a5a00" strokeWidth="1.4" {...J} />
    <path d="M9 47H55" stroke="#8a5a00" strokeWidth="2" {...J} /><ellipse cx="32" cy="50" rx="5.4" ry="4.6" fill="#e6a62a" stroke="#8a5a00" strokeWidth="1" />{Eli(25, 24, 2.6, 9, 12, 0.5)}
    <path d="M32 14C26 6 20 8 22 12C24 15 29 15 32 14ZM32 14C38 6 44 8 42 12C40 15 35 15 32 14Z" fill="#e8283f" stroke="#8a0f1f" strokeWidth="1" {...J} /><circle cx="32" cy="14" r="2.3" fill="#c4142e" />
    <path d="M44 56C48 52 54 54 52 59C50 61 46 60 44 56Z" fill="#2f9e5a" /><circle cx="50" cy="58" r="2.2" fill="#e8283f" /><circle cx="46" cy="59" r="2" fill="#e8283f" /></>),
  reindeer: (u) => (<>{defs(u, { h: ["l", "#b9763c", "#7a4420"], m: ["l", "#f3dcb8", "#d5b484"], n: ["r", "#ff7d7d", "#e0142c"] })}
    <g stroke="#d9b077" strokeWidth="3.2" fill="none" {...J}><path d="M24 22C20 12 14 9 12 3M19 14C14 15 10 13 8 9M22 17L17 10M40 22C44 12 50 9 52 3M45 14C50 15 54 13 56 9M42 17L47 10" /></g>
    <ellipse cx="17" cy="27" rx="5.4" ry="8" transform={rot(-30, 17, 27)} fill={U(u, "h")} stroke="#5a3016" strokeWidth="1" /><ellipse cx="47" cy="27" rx="5.4" ry="8" transform={rot(30, 47, 27)} fill={U(u, "h")} stroke="#5a3016" strokeWidth="1" />
    <path d="M20 26C20 38 26 54 32 56C38 54 44 38 44 26C44 21 38 19 32 19C26 19 20 21 20 26Z" fill={U(u, "h")} stroke="#5a3016" strokeWidth="1.3" {...J} />
    <ellipse cx="32" cy="48" rx="9.5" ry="7.5" fill={U(u, "m")} /><circle cx="26.5" cy="33" r="2.6" fill="#241309" /><circle cx="37.5" cy="33" r="2.6" fill="#241309" /><circle cx="25.8" cy="32.2" r=".9" fill="#fff" /><circle cx="36.8" cy="32.2" r=".9" fill="#fff" />
    <circle cx="32" cy="48" r="5.6" fill={U(u, "n")} stroke="#8a0a1c" strokeWidth="1" /><circle cx="30.4" cy="46.4" r="1.6" fill="#fff" opacity=".85" /></>),
  scarf: (u) => scarfArt(u, "#ef3e4f", "#b4152b", "#fff"),
  scarfIce: (u) => scarfArt(u, "#4aa8ff", "#1f64c9", "#eaf7ff"),
  candy: (u) => (<>{defs(u, { r: ["r", "#ff7b8c", "#e0142c", "#a30a20"] })}
    <g transform={rot(-25)}>
      <path d="M8 24L22 31L22 33L8 40Z" fill="#ffd6dc" stroke="#e0142c" strokeWidth="1.2" {...J} /><path d="M56 24L42 31L42 33L56 40Z" fill="#ffd6dc" stroke="#e0142c" strokeWidth="1.2" {...J} />
      <path d="M12 28L21 32M12 36L21 32.4M52 28L43 32M52 36L43 32.4" stroke="#e0142c" strokeWidth="1" opacity=".6" />
      <circle cx="32" cy="32" r="13" fill={U(u, "r")} stroke="#8a0a1c" strokeWidth="1.2" />
      <path d="M22 24C28 30 36 28 42 22M20 32C28 38 38 34 44 28M23 41C29 44 37 41 41 37" stroke="#fff" strokeWidth="3" fill="none" opacity=".85" {...J} /></g>{Eli(26, 24, 3, 6, 40, 0.55)}</>),

  /* ───────── Pasqua / Primavera ───────── */
  chick: (u) => (<>{defs(u, { y: ["r", "#fff59a", "#ffd23a", "#f2a60c"], e: ["l", "#fffdf6", "#f1e6d4"] })}
    <circle cx="32" cy="28" r="17" fill={U(u, "y")} stroke="#c98a00" strokeWidth="1.2" /><path d="M28 12C28 8 31 7 32 9C32 6 36 6 36 10" stroke="#e0a010" strokeWidth="2" fill="none" {...J} />
    <path d="M27 31L37 31L32 38Z" fill="#ff8a1f" stroke="#b34e00" strokeWidth="1" {...J} /><circle cx="25" cy="27" r="2.6" fill="#2a1a08" /><circle cx="39" cy="27" r="2.6" fill="#2a1a08" /><circle cx="24.3" cy="26.2" r=".9" fill="#fff" /><circle cx="38.3" cy="26.2" r=".9" fill="#fff" />
    <circle cx="20" cy="33" r="2.8" fill="#ff9ccb" opacity=".6" /><circle cx="44" cy="33" r="2.8" fill="#ff9ccb" opacity=".6" />
    <path d="M9 44L15 37L21 44L27 37L33 44L39 37L45 44L51 37L55 43C55 55 46 61 32 61C18 61 9 55 9 44Z" fill={U(u, "e")} stroke="#c9b79c" strokeWidth="1.2" {...J} />
    <circle cx="22" cy="53" r="2" fill="#ffb3d1" /><circle cx="32" cy="55" r="2" fill="#9fdcff" /><circle cx="42" cy="53" r="2" fill="#ffe27a" />{Eli(26, 22, 4, 2, -30, 0.5)}</>),
  egg: (u) => (<>{defs(u, { e: ["l", "#d9c8ff", "#a78bfa"], c: ["l", "#ffe27a", "#ffb02e"] })}
    <clipPath id={u + "c"}><path d="M32 5C45 5 53 26 53 38C53 51 44 59 32 59C20 59 11 51 11 38C11 26 19 5 32 5Z" /></clipPath>
    <path d="M32 5C45 5 53 26 53 38C53 51 44 59 32 59C20 59 11 51 11 38C11 26 19 5 32 5Z" fill={U(u, "e")} />
    <g clipPath={U(u, "c")}><path d="M8 30L14 24L20 30L26 24L32 30L38 24L44 30L50 24L56 30V37H8Z" fill={U(u, "c")} /><rect x="8" y="42" width="48" height="5" fill="#ff7ab8" />{[14, 24, 34, 44].map((x, i) => <circle key={i} cx={x} cy={53} r="2" fill="#fff" opacity=".85" />)}{[20, 32, 44].map((x, i) => <circle key={i} cx={x} cy="15" r="1.8" fill="#fff" opacity=".75" />)}</g>
    <path d="M32 5C45 5 53 26 53 38C53 51 44 59 32 59C20 59 11 51 11 38C11 26 19 5 32 5Z" fill="none" stroke="#7d5cd6" strokeWidth="1.3" />{Eli(22, 22, 3, 9, 20, 0.5)}</>),
  bunny: (u) => (<>{defs(u, { f: ["l", "#ffffff", "#e6dcf7"], p: ["l", "#ffc2dc", "#ff8fbb"] })}
    <ellipse cx="22" cy="17" rx="7" ry="16" transform={rot(-8, 22, 17)} fill={U(u, "f")} stroke="#b9a6dc" strokeWidth="1.2" /><ellipse cx="42" cy="17" rx="7" ry="16" transform={rot(8, 42, 17)} fill={U(u, "f")} stroke="#b9a6dc" strokeWidth="1.2" />
    <ellipse cx="22" cy="18" rx="3.2" ry="11" transform={rot(-8, 22, 18)} fill={U(u, "p")} /><ellipse cx="42" cy="18" rx="3.2" ry="11" transform={rot(8, 42, 18)} fill={U(u, "p")} />
    <ellipse cx="32" cy="43" rx="19" ry="16" fill={U(u, "f")} stroke="#b9a6dc" strokeWidth="1.2" /><circle cx="25" cy="40" r="2.5" fill="#2a2150" /><circle cx="39" cy="40" r="2.5" fill="#2a2150" /><circle cx="24.3" cy="39.2" r=".9" fill="#fff" /><circle cx="38.3" cy="39.2" r=".9" fill="#fff" />
    <path d="M29.5 46L34.5 46L32 49Z" fill="#ff7aa8" /><path d="M32 49Q30 52 28 51M32 49Q34 52 36 51" stroke="#9a86c0" strokeWidth="1.2" fill="none" {...J} /><circle cx="20" cy="47" r="3" fill="#ffa6c8" opacity=".5" /><circle cx="44" cy="47" r="3" fill="#ffa6c8" opacity=".5" />
    <path d="M10 44L2 42M10 48L3 50M54 44L62 42M54 48L61 50" stroke="#b9a6dc" strokeWidth="1" {...J} /></>),
  carrot: (u) => (<>{defs(u, { c: ["l", "#ffa23a", "#e8590c"], l: ["l", "#8fd35a", "#2f8f3a"] })}
    <g transform={rot(28)}>
      <path d="M32 18C26 8 24 4 22 1C30 3 33 9 32 18ZM32 18C31 9 32 4 34 0C38 5 36 12 32 18ZM32 18C38 10 42 8 47 8C45 14 39 17 32 18Z" fill={U(u, "l")} stroke="#1f6a2a" strokeWidth="1" {...J} />
      <path d="M21 21C21 14 43 14 43 21C43 36 36 51 32 62C28 51 21 36 21 21Z" fill={U(u, "c")} stroke="#a33a00" strokeWidth="1.3" {...J} />
      <path d="M24 27Q29 29 31 26M33 33Q38 35 41 31M27 40Q31 42 33 39M30 50Q32 51 34 49" stroke="#b34500" strokeWidth="1.4" fill="none" {...J} />{Eli(26, 28, 2, 8, -8, 0.4)}</g></>),
  tulip: (u) => (<>{defs(u, { p: ["l", "#ff9bc4", "#e0246e"], s: ["l", "#5fcf7a", "#1f8a45"] })}
    <path d="M32 60V38" stroke="#1f8a45" strokeWidth="3.2" {...J} /><path d="M32 58C20 57 14 48 15 38C25 40 32 48 32 58Z" fill={U(u, "s")} stroke="#176b36" strokeWidth="1" {...J} /><path d="M32 54C41 52 47 46 47 38C38 40 32 46 32 54Z" fill={U(u, "s")} stroke="#176b36" strokeWidth="1" {...J} />
    <path d="M18 13C15 28 21 40 32 42C29 30 25 20 18 13Z" fill={U(u, "p")} stroke="#a3154f" strokeWidth="1.1" {...J} /><path d="M46 13C49 28 43 40 32 42C35 30 39 20 46 13Z" fill={U(u, "p")} stroke="#a3154f" strokeWidth="1.1" {...J} />
    <path d="M32 6C25 14 21 24 24 35C28 41 36 41 40 35C43 24 39 14 32 6Z" fill={U(u, "p")} stroke="#a3154f" strokeWidth="1.2" {...J} />{Eli(28, 22, 2.2, 8, 12, 0.45)}</>),
  daisy: (u) => (<>{defs(u, { p: ["l", "#ffffff", "#fff0a8"], c: ["r", "#ffd84a", "#f59e0b", "#b45f06"] })}
    {Array.from({ length: 14 }, (_, i) => <ellipse key={i} cx="32" cy="14" rx="4.4" ry="11" fill={U(u, "p")} stroke="#e8cf6a" strokeWidth=".9" transform={rot(i * (360 / 14))} />)}
    <circle cx="32" cy="32" r="9" fill={U(u, "c")} stroke="#a85a00" strokeWidth="1" />{[[29, 30], [34, 29], [31, 35], [36, 34], [28, 34]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r=".9" fill="#7a3f00" opacity=".6" />)}{Eli(29, 28, 2.6, 1.6, -30, 0.7)}</>),
  butterfly: (u) => (<>{defs(u, { a: ["h", "#7ee8ff", "#7a5cff"], b: ["h", "#ff9be0", "#b259ff"] })}
    {[0, 1].map((s) => <g key={s} transform={s ? "translate(64 0) scale(-1 1)" : undefined}>
      <path d="M31 30C22 8 5 6 7 21C8 30 20 34 31 32Z" fill={U(u, "a")} stroke="#3b2f9e" strokeWidth="1.2" {...J} /><path d="M31 33C19 34 10 43 16 52C22 57 29 47 31 37Z" fill={U(u, "b")} stroke="#6a2a9e" strokeWidth="1.2" {...J} />
      <circle cx="16" cy="20" r="3.4" fill="#fff" opacity=".8" /><circle cx="19" cy="47" r="2.4" fill="#fff" opacity=".75" /><path d="M30 31Q18 22 11 17M30 34Q20 38 17 46" stroke="#fff" strokeOpacity=".45" strokeWidth="1" fill="none" /></g>)}
    <rect x="29.8" y="22" width="4.4" height="26" rx="2.2" fill="#2a1d55" /><path d="M31 22Q28 13 24 10M33 22Q36 13 40 10" stroke="#2a1d55" strokeWidth="1.4" fill="none" {...J} /><circle cx="24" cy="10" r="1.6" fill="#2a1d55" /><circle cx="40" cy="10" r="1.6" fill="#2a1d55" /></>),
  blossom: (u) => (<>{defs(u, { p: ["l", "#ffe1ee", "#ff7fb0"] })}
    {[0, 72, 144, 216, 288].map((a) => <path key={a} transform={rot(a)} d="M32 30C20 24 19 9 27 7C30 6 31 8 32 10C33 8 34 6 37 7C45 9 44 24 32 30Z" fill={U(u, "p")} stroke="#e0508a" strokeWidth="1" {...J} />)}
    <circle cx="32" cy="32" r="4" fill="#ffd54a" stroke="#c98a00" strokeWidth=".8" />{[0, 60, 120, 180, 240, 300].map((a) => { const [x, y] = pol(32, 32, 8, a); return <g key={a}><path d={`M32 32L${x} ${y}`} stroke="#c2185b" strokeWidth=".8" /><circle cx={x} cy={y} r="1.3" fill="#c2185b" /></g>; })}</>),

  /* ───────── Capodanno ───────── */
  firework: (u) => (<><defs><radialGradient id={u + "hz"}><stop offset="0" stopColor="#fff6c0" stopOpacity=".95" /><stop offset="1" stopColor="#ff4fa3" stopOpacity="0" /></radialGradient></defs>
    <circle cx="32" cy="30" r="15" fill={U(u, "hz")} />
    {Array.from({ length: 12 }, (_, i) => { const L = i % 2 ? 21 : 27, [x1, y1] = pol(32, 30, 8, i * 30), [x2, y2] = pol(32, 30, L, i * 30), col = ["#ffd54a", "#ff4fa3", "#4fd8ff"][i % 3];
      return <g key={i}><path d={`M${x1} ${y1}L${x2} ${y2}`} stroke={col} strokeWidth="2.4" {...J} /><circle cx={x2} cy={y2} r={i % 2 ? 2 : 2.8} fill={col} /></g>; })}
    <circle cx="32" cy="30" r="3.4" fill="#fff" /><path d="M32 60C32 52 30 48 32 44" stroke="#ffd54a" strokeWidth="1.6" strokeDasharray="1 3" fill="none" {...J} /></>),
  sparkler: (u) => (<>{defs(u, { s: ["l", "#ffe9a8", "#ff9a1f"] })}
    <path d="M10 60L33 36" stroke="#8a5a2b" strokeWidth="3.4" {...J} /><path d="M10 60L33 36" stroke="#d9a35e" strokeWidth="1.2" {...J} />
    {Array.from({ length: 14 }, (_, i) => { const [x1, y1] = pol(36, 32, 4, i * 25.7), [x2, y2] = pol(36, 32, 12 + (i % 3) * 6, i * 25.7); return <path key={i} d={`M${x1} ${y1}L${x2} ${y2}`} stroke={U(u, "s")} strokeWidth="2" {...J} />; })}
    <path d={spark4(50, 14, 6)} fill="#fff3b0" /><path d={spark4(18, 22, 4)} fill="#ffd54a" /><path d={spark4(54, 44, 4)} fill="#ffb02e" /><circle cx="36" cy="32" r="4" fill="#fff" /></>),
  sparkles: (u) => (<>{defs(u, { g: ["l", "#fff7b0", "#ffb81f"], h: ["l", "#ffffff", "#ffe27a"] })}
    <path d={spark4(27, 36, 22, 0.14)} fill={U(u, "g")} stroke="#d98a00" strokeWidth="1" {...J} /><path d={spark4(47, 15, 12, 0.14)} fill={U(u, "h")} stroke="#e0a010" strokeWidth=".8" {...J} /><path d={spark4(48, 49, 8, 0.14)} fill={U(u, "g")} stroke="#d98a00" strokeWidth=".8" {...J} />
    <circle cx="10" cy="14" r="2" fill="#fff" opacity=".9" /><circle cx="57" cy="32" r="1.6" fill="#fff" opacity=".9" /></>),
  champagne: (u) => {
    const glass = (x, a) => (<g transform={`translate(${x} 10) rotate(${a}) scale(1.18)`}>
      <clipPath id={u + "k" + x}><path d="M-7 0L7 0C7 14 5 22 1.5 26V38H5V41H-5V38H-1.5V26C-5 22 -7 14 -7 0Z" /></clipPath>
      <path d="M-7 0L7 0C7 14 5 22 1.5 26V38H5V41H-5V38H-1.5V26C-5 22 -7 14 -7 0Z" fill="#dff4ff" fillOpacity=".3" />
      <g clipPath={U(u, "k" + x)}><rect x="-8" y="5" width="16" height="36" fill={U(u, "l")} /></g>
      <path d="M-7 0L7 0C7 14 5 22 1.5 26V38H5V41H-5V38H-1.5V26C-5 22 -7 14 -7 0Z" fill="none" stroke="#fff" strokeOpacity=".9" strokeWidth="1" {...J} />
      <circle cx="-2" cy="14" r="1" fill="#fff" /><circle cx="2" cy="9" r="1.2" fill="#fff" /><circle cx="0" cy="19" r=".8" fill="#fff" /><path d="M-4.5 3L-3.4 14" stroke="#fff" strokeWidth="1.4" opacity=".7" {...J} /></g>);
    return (<>{defs(u, { l: ["l", "#ffe9a0", "#f2b233"] })}{glass(22, -22)}{glass(42, 22)}<path d={spark4(32, 8, 6)} fill="#fff3b0" /><path d={spark4(55, 6, 3.4)} fill="#fff" /><path d={spark4(9, 8, 3.4)} fill="#fff" /></>); },
  popper: (u) => (<>{defs(u, { c: ["h", "#ffd54a", "#ff8a1f", "#e0561a"] })}
    <path d="M6 58L20 22L44 44Z" fill={U(u, "c")} stroke="#a33a00" strokeWidth="1.3" {...J} /><path d="M12 42L27 32M9 50L36 38" stroke="#fff" strokeWidth="2" opacity=".6" {...J} /><ellipse cx="32" cy="33" rx="13" ry="5.5" transform={rot(42, 32, 33)} fill="#ffb347" stroke="#a33a00" strokeWidth="1.1" />
    <path d="M36 24C42 16 38 8 46 6M42 32C52 28 52 20 58 20M30 20C28 12 34 8 32 2" stroke="#ff4fa3" strokeWidth="2" fill="none" {...J} /><path d="M40 20C46 22 48 14 54 14" stroke="#4fd8ff" strokeWidth="2" fill="none" {...J} />
    {[[48, 28, "#4fd8ff"], [54, 8, "#ffd54a"], [40, 6, "#7affc2"], [58, 34, "#ff4fa3"], [26, 8, "#ffd54a"]].map(([x, y, c], i) => <rect key={i} x={x - 2} y={y - 2} width="4.4" height="4.4" rx="1" fill={c} transform={rot(i * 35, x, y)} />)}</>),
  confetti: (u) => (<>{defs(u, { b: ["r", "#ff8ad8", "#b04bff", "#5a21b8"] })}
    <clipPath id={u + "c"}><circle cx="32" cy="36" r="22" /></clipPath>
    <circle cx="32" cy="36" r="22" fill={U(u, "b")} stroke="#40168a" strokeWidth="1.2" />
    <g clipPath={U(u, "c")}>{[[20, 26, "#ffd54a"], [34, 20, "#4fd8ff"], [44, 32, "#7affc2"], [24, 42, "#ff6f91"], [38, 48, "#ffd54a"], [14, 36, "#4fd8ff"], [48, 46, "#fff"], [30, 34, "#fff"]].map(([x, y, c], i) => <rect key={i} x={x} y={y} width="6" height="2.6" rx="1.2" fill={c} transform={rot(i * 47, x + 3, y + 1)} />)}</g>
    <path d="M26 15C22 8 18 7 14 9M38 15C42 8 46 7 50 9M32 14V4" stroke="#ff4fa3" strokeWidth="2.2" fill="none" {...J} /><circle cx="14" cy="9" r="2.2" fill="#ffd54a" /><circle cx="50" cy="9" r="2.2" fill="#4fd8ff" /><circle cx="32" cy="4" r="2.2" fill="#7affc2" />{Eli(23, 28, 5, 9, 35, 0.35)}</>),
  discoball: (u) => { const cols = ["#f4f6ff", "#c9d2ee", "#9fb0dc", "#dfe6ff", "#ffb3e6", "#a8f0ff"]; const tiles = [];
    for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) tiles.push(<rect key={r * 7 + c} x={10 + c * 6.3} y={14 + r * 6.3} width="5.6" height="5.6" rx=".8" fill={cols[(r * 3 + c * 5 + (r * c) % 4) % cols.length]} />);
    return (<>{defs(u, { s: ["r", "#ffffff", "#a8b4d8", "#4a5688"] })}<clipPath id={u + "c"}><circle cx="32" cy="38" r="22" /></clipPath>
      <path d="M32 0V16" stroke="#c9cfe6" strokeWidth="2" {...J} /><circle cx="32" cy="38" r="22" fill={U(u, "s")} />
      <g clipPath={U(u, "c")}>{tiles}<ellipse cx="32" cy="38" rx="22" ry="22" fill={U(u, "s")} opacity=".42" /></g>
      <circle cx="32" cy="38" r="22" fill="none" stroke="#4a5688" strokeWidth="1.2" />{Eli(23, 26, 4, 8, 40, 0.55)}
      <path d={spark4(54, 14, 7)} fill="#fff" /><path d={spark4(8, 50, 5)} fill="#ffb3e6" /><path d={spark4(55, 50, 4)} fill="#a8f0ff" /></>); },

  /* ───────── Estate / Caldo ───────── */
  sun: (u) => sunArt(u, false),
  sunface: (u) => sunArt(u, true),
  palm: (u) => (<>{defs(u, { t: ["h", "#b8793a", "#7a4720"], f: ["l", "#58d66f", "#1c8a45"] })}
    <path d="M30 61C31 47 33 35 33 22L38 22C38 35 36 47 36 61Z" fill={U(u, "t")} stroke="#5a3012" strokeWidth="1" {...J} />{[30, 38, 46, 54].map((y, i) => <path key={i} d={`M${31 + i * .1} ${y}Q34 ${y + 2} ${37} ${y}`} stroke="#5a3012" strokeWidth="1" fill="none" opacity=".6" />)}
    {[-170, -130, -85, -35, 10, 150].map((a, i) => <path key={i} d={palmFrond} transform={rot(a, 35, 22)} fill={U(u, "f")} stroke="#126a35" strokeWidth="1" {...J} />)}
    <circle cx="32.5" cy="25" r="3.2" fill="#8a5a2b" stroke="#4a2a10" strokeWidth=".8" /><circle cx="38" cy="25.5" r="3.2" fill="#8a5a2b" stroke="#4a2a10" strokeWidth=".8" /></>),
  watermelon: (u) => (<>{defs(u, { f: ["r", "#ff8a8a", "#ef2f4a", "#b3122c"] })}
    <g transform="translate(0 6)"><path d="M5 20A27 27 0 0 0 59 20Z" fill="#2f9e4a" stroke="#176b30" strokeWidth="1.2" {...J} /><path d="M8 20A24 24 0 0 0 56 20Z" fill="#e8f7c8" /><path d="M11 20A21 21 0 0 0 53 20Z" fill={U(u, "f")} />
      {[[24, 28, 20], [32, 34, 0], [40, 28, -20], [28, 40, 10], [37, 40, -10]].map(([x, y, a], i) => <ellipse key={i} cx={x} cy={y} rx="1.6" ry="2.8" fill="#2a1a1a" transform={rot(a, x, y)} />)}
      <path d="M5 20H59" stroke="#176b30" strokeWidth="1.4" {...J} />{Eli(20, 24, 2.4, 6, -50, 0.4)}</g>{Bub(52, 12, 4)}</>),
  umbrella: (u) => { const x = [6, 19, 32, 45, 58], cs = ["#ff5d6c", "#fff", "#ff5d6c", "#fff"];
    return (<>{defs(u, { s: ["l", "#ffe7a8", "#e8b866"] })}<path d="M33 28L28 58" stroke="#8a5a2b" strokeWidth="2.6" {...J} /><ellipse cx="32" cy="58" rx="24" ry="5" fill={U(u, "s")} stroke="#c99a52" strokeWidth="1" />
      {cs.map((c, i) => <path key={i} d={`M32 5C${x[i]} 10 ${x[i]} 22 ${x[i]} 30Q${(x[i] + x[i + 1]) / 2} 25 ${x[i + 1]} 30C${x[i + 1]} 22 ${x[i + 1]} 10 32 5Z`} fill={c} stroke="#b0172c" strokeWidth="1" {...J} />)}
      <circle cx="32" cy="5" r="2" fill="#8a5a2b" />{Eli(20, 17, 2.2, 7, 20, 0.35)}<circle cx="14" cy="55" r="2.4" fill="#ffd54a" /><path d="M44 55C46 52 50 52 51 55" stroke="#ff8fb8" strokeWidth="2" fill="none" {...J} /></>); },
  shell: (u) => { const shape = "M32 57C16 53 6 41 8 27C12 13 22 8 32 8C42 8 52 13 56 27C58 41 48 53 32 57Z";
    return (<>{defs(u, { s: ["l", "#ffe1ec", "#ff9ec0", "#f06c9b"] })}<clipPath id={u + "c"}><path d={shape} /></clipPath>
      <path d={shape} fill={U(u, "s")} /><g clipPath={U(u, "c")} stroke="#c2467a" strokeWidth="1.6" opacity=".55" {...J}>{Array.from({ length: 9 }, (_, i) => { const a = -66 + i * 16.5; return <path key={i} d={`M32 55L${32 + 34 * Math.sin(rad(a))} ${55 - 52 * Math.cos(rad(a))}`} />; })}</g>
      <path d={shape} fill="none" stroke="#b83a72" strokeWidth="1.4" {...J} /><path d="M26 57H38L36 61H28Z" fill="#f5b0cb" stroke="#b83a72" strokeWidth="1" {...J} />{Eli(22, 24, 3, 8, 30, 0.45)}{Bub(54, 12, 3.4)}</>); },
  wave: (u) => (<>{defs(u, { w: ["l", "#7be3ff", "#1478d4", "#0b3f94"] })}
    <path d="M3 58C5 38 20 14 40 11C52 10 60 18 58 28C57 33 52 36 48 34C52 30 50 24 44 24C36 24 32 34 38 44C42 50 52 52 61 52V58Z" fill={U(u, "w")} stroke="#0a3a88" strokeWidth="1.2" {...J} />
    <path d="M40 11C52 10 60 18 58 28" stroke="#fff" strokeWidth="3" fill="none" {...J} /><path d="M10 50C18 44 28 46 34 52" stroke="#fff" strokeOpacity=".5" strokeWidth="1.6" fill="none" {...J} />
    {Bub(46, 40, 2.6)}{Bub(52, 32, 1.8)}{Bub(14, 36, 2.2)}<path d="M3 58H61" stroke="#0a3a88" strokeWidth="1.4" {...J} /></>),
  sunglasses: (u) => (<>{defs(u, { l: ["l", "#3b2a8c", "#ff6fa8"] })}
    <path d="M5 24H59" stroke="#1c1536" strokeWidth="4.4" {...J} /><path d="M29 26C31 21 33 21 35 26" stroke="#1c1536" strokeWidth="2.6" fill="none" {...J} />
    <path d="M6 24H29C29 37 24 45 17.5 45C11 45 6 37 6 24Z" fill={U(u, "l")} stroke="#1c1536" strokeWidth="2" {...J} /><path d="M35 24H58C58 37 53 45 46.5 45C40 45 35 37 35 24Z" fill={U(u, "l")} stroke="#1c1536" strokeWidth="2" {...J} />
    <path d="M11 28L19 28L13 40L11 40Z" fill="#fff" opacity=".55" /><path d="M40 28L48 28L42 40L40 40Z" fill="#fff" opacity=".55" /></>),
  pineapple: (u) => (<>{defs(u, { p: ["l", "#ffe066", "#ffa81f", "#d97706"], l: ["l", "#78d65a", "#1f8a3d"] })}
    <clipPath id={u + "c"}><ellipse cx="32" cy="42" rx="16" ry="19" /></clipPath>
    {["M32 24C28 15 26 8 28 1C31 8 32 15 32 24", "M32 24C24 18 18 14 14 8C22 8 29 14 32 24", "M32 24C40 18 46 14 50 8C42 8 35 14 32 24", "M32 24C22 22 15 22 10 18C18 14 27 18 32 24", "M32 24C42 22 49 22 54 18C46 14 37 18 32 24"].map((d, i) => <path key={i} d={d + "Z"} fill={U(u, "l")} stroke="#176b30" strokeWidth="1" {...J} />)}
    <ellipse cx="32" cy="42" rx="16" ry="19" fill={U(u, "p")} /><g clipPath={U(u, "c")} stroke="#b45309" strokeWidth="1.3" opacity=".75">{[-24, -12, 0, 12, 24, 36].map((o, i) => <g key={i}><path d={`M${16 + o} 22L${48 + o} 62`} /><path d={`M${48 - o} 22L${16 - o} 62`} /></g>)}</g>
    <ellipse cx="32" cy="42" rx="16" ry="19" fill="none" stroke="#b45309" strokeWidth="1.2" />{Eli(24, 38, 2.4, 8, 12, 0.4)}</>),

  /* ───────── Primavera ───────── */
  bee: (u) => (<>{defs(u, { b: ["l", "#ffe066", "#f5a80c"] })}
    <g transform={rot(-12)}><ellipse cx="29" cy="22" rx="7" ry="12" transform={rot(-20, 29, 22)} fill="#dff6ff" fillOpacity=".7" stroke="#8fd0ee" strokeWidth="1" /><ellipse cx="40" cy="22" rx="7" ry="12" transform={rot(20, 40, 22)} fill="#dff6ff" fillOpacity=".7" stroke="#8fd0ee" strokeWidth="1" />
      <clipPath id={u + "c"}><ellipse cx="34" cy="40" rx="17" ry="12" /></clipPath><ellipse cx="34" cy="40" rx="17" ry="12" fill={U(u, "b")} /><g clipPath={U(u, "c")} fill="#2a1d0a"><rect x="29" y="26" width="5" height="28" /><rect x="39" y="26" width="5" height="28" /></g>
      <ellipse cx="34" cy="40" rx="17" ry="12" fill="none" stroke="#8a5a00" strokeWidth="1.2" /><path d="M50 40L57 40L50 43Z" fill="#2a1d0a" /><circle cx="17" cy="40" r="8" fill="#2a1d0a" /><circle cx="14.6" cy="38" r="2.2" fill="#fff" /><circle cx="14.2" cy="37.6" r=".9" fill="#2a1d0a" />
      <path d="M13 33Q11 27 7 26M19 32Q19 26 16 22" stroke="#2a1d0a" strokeWidth="1.4" fill="none" {...J} />{Eli(30, 34, 5, 1.8, -8, 0.5)}</g></>),
  sprout: (u) => (<>{defs(u, { l: ["l", "#9be564", "#2f9e45"], d: ["l", "#7a4a26", "#3f2410"] })}
    <path d="M32 56C32 46 32 40 32 34" stroke="#2f8a3d" strokeWidth="3" {...J} />
    <path d="M32 38C21 40 11 33 9 19C22 19 30 26 32 38Z" fill={U(u, "l")} stroke="#1f7a35" strokeWidth="1.1" {...J} /><path d="M32 42C42 42 52 36 54 23C43 23 35 30 32 42Z" fill={U(u, "l")} stroke="#1f7a35" strokeWidth="1.1" {...J} />
    <path d="M12 22C20 24 26 29 30 36M51 26C44 27 38 31 34 38" stroke="#fff" strokeOpacity=".5" strokeWidth="1" fill="none" {...J} /><ellipse cx="32" cy="57" rx="17" ry="5.5" fill={U(u, "d")} />{Bub(51, 10, 3.6)}</>),
  hibiscus: (u) => (<>{defs(u, { p: ["r", "#ffa07a", "#ff3b6b", "#c2185b"], c: ["r", "#7a0a3c", "#d6155a"] })}
    {[0, 72, 144, 216, 288].map((a) => <path key={a} transform={rot(a)} d="M32 32C14 29 12 9 32 6C52 9 50 29 32 32Z" fill={U(u, "p")} stroke="#a50f48" strokeWidth="1" {...J} />)}
    <circle cx="32" cy="32" r="7" fill={U(u, "c")} /><path d="M32 32L46 16" stroke="#ffd54a" strokeWidth="2" {...J} />{[[46, 16], [43, 14], [48, 19], [44, 18]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.5" fill="#ffd54a" stroke="#b45f06" strokeWidth=".5" />)}</>),
  leaf: (u) => leafArt(u, ["#b6f07a", "#3fae4a", "#1f7a35"], "#176b30"),
  leafGold: (u) => leafArt(u, ["#fff08a", "#d9a21f", "#a8661a"], "#8a4a12"),

  /* ───────── Autunno ───────── */
  fallen: (u) => { const half = "M32 6C35 9 36 13 38 15C42 13 46 15 46 19C46 23 44 25 42 27C46 29 49 32 47 36C45 40 41 40 39 42C41 46 39 50 35 50C34 48 33 47 32 46Z";
    return (<>{defs(u, { o: ["l", "#ffbe4a", "#e0641a", "#a8340a"] })}<path d="M32 46V60" stroke="#7a4220" strokeWidth="2.6" {...J} />
      <g transform="rotate(-10 32 32)"><path d={half} fill={U(u, "o")} stroke="#8a3208" strokeWidth="1.2" {...J} /><path d={half} transform="translate(64 0) scale(-1 1)" fill={U(u, "o")} stroke="#8a3208" strokeWidth="1.2" {...J} />
        <path d="M32 46V10M32 36L41 30M32 36L23 30M32 26L40 21M32 26L24 21" stroke="#8a3208" strokeOpacity=".6" strokeWidth="1.2" fill="none" {...J} />{Eli(24, 20, 2, 6, 30, 0.4)}</g></>); },
  maple: (u) => (<>{defs(u, { m: ["l", "#ff7a4a", "#d3201a", "#8f0f12"] })}
    <polygon points="32,4 36,14 41,10 41,22 52,18 48,30 59,32 48,40 52,47 38,45 36,52 33,50 33,60 31,60 31,50 28,52 26,45 12,47 16,40 5,32 16,30 12,18 23,22 23,10 28,14" fill={U(u, "m")} stroke="#7a0b10" strokeWidth="1.4" {...J} />
    <path d="M32 50V10M32 40L12 32M32 40L52 32M32 32L22 20M32 32L42 20" stroke="#ffd0a0" strokeOpacity=".5" strokeWidth="1.1" fill="none" {...J} />{Eli(24, 22, 2, 6, 30, 0.35)}</>),
  chestnut: (u) => (<>{defs(u, { n: ["r", "#c9783a", "#8a4a1e", "#4a220f"] })}
    <path d="M32 7C42 10 52 26 50 40C48 52 40 58 32 58C24 58 16 52 14 40C12 26 22 10 32 7Z" fill={U(u, "n")} stroke="#3a1a0a" strokeWidth="1.3" {...J} />
    <path d="M17 50C20 57 26 59 32 59C38 59 44 57 47 50C42 53 22 53 17 50Z" fill="#e8c99a" stroke="#b08a5a" strokeWidth="1" {...J} /><path d="M32 7C34 5 36 5 37 7" stroke="#3a1a0a" strokeWidth="2" fill="none" {...J} />{Eli(23, 28, 3, 11, 12, 0.35)}</>),
  mushroom: (u) => (<>{defs(u, { c: ["l", "#ff6b5e", "#d62828", "#9a1313"], s: ["h", "#f6e7d0", "#fffaf0", "#e2cfae"] })}
    <path d="M24 38C24 49 22 54 19 59H45C42 54 40 49 40 38Z" fill={U(u, "s")} stroke="#b89a68" strokeWidth="1.2" {...J} /><path d="M6 37C6 18 18 7 32 7C46 7 58 18 58 37C58 40 56 41 54 41H10C8 41 6 40 6 37Z" fill={U(u, "c")} stroke="#7a1010" strokeWidth="1.3" {...J} />
    {[[20, 22, 5, 4], [36, 16, 4.4, 3.4], [46, 28, 5, 4], [30, 31, 4, 3.2], [14, 33, 3, 2.4]].map(([x, y, rx, ry], i) => <ellipse key={i} cx={x} cy={y} rx={rx} ry={ry} fill="#fff7ea" />)}{Eli(16, 18, 3, 8, 40, 0.3)}</>),
  hedgehog: (u) => { const sp = []; for (let r = 0; r < 2; r++) for (let i = 0; i <= 16; i++) { const t = 188 + i * 10.6, rx = 22 - r * 4, ry = 18 - r * 3.5, cx = 36, cy = 40, x = Math.cos(rad(t)), y = Math.sin(rad(t)), px = cx + rx * x, py = cy + ry * y; sp.push(<path key={r * 20 + i} d={`M${px.toFixed(1)} ${py.toFixed(1)}L${(px + x * 8).toFixed(1)} ${(py + y * 8).toFixed(1)}`} stroke={(i + r) % 2 ? "#5a3a1e" : "#9a6a3a"} strokeWidth="3" {...J} />); }
    return (<>{defs(u, { b: ["r", "#8a5a30", "#4a2a12"], f: ["l", "#f6dfbb", "#d9b07a"] })}{sp}<ellipse cx="36" cy="40" rx="22" ry="17" fill={U(u, "b")} stroke="#2e1a0a" strokeWidth="1.2" />
      <ellipse cx="17" cy="46" rx="12" ry="9.5" fill={U(u, "f")} stroke="#8a6a3a" strokeWidth="1" /><circle cx="6.4" cy="47" r="2.8" fill="#2a1a10" /><circle cx="15" cy="42" r="2" fill="#2a1a10" /><circle cx="14.4" cy="41.4" r=".7" fill="#fff" /><ellipse cx="22" cy="36" rx="3.2" ry="3.6" fill="#d9b07a" stroke="#8a6a3a" strokeWidth=".8" />
      <ellipse cx="26" cy="57" rx="5" ry="3" fill="#d9b07a" /><ellipse cx="44" cy="57" rx="5" ry="3" fill="#d9b07a" />{Eli(34, 30, 6, 2, -10, 0.2)}</>); },
  wheat: (u) => { const stalk = (x, a, s) => (<g transform={`translate(${x} 0) rotate(${a} 32 60) scale(${s})`}><path d="M32 60V10" stroke="#c98a2a" strokeWidth="2" {...J} />
      {Array.from({ length: 6 }, (_, i) => <g key={i}><ellipse cx="28.2" cy={18 + i * 6} rx="2.6" ry="5.2" transform={rot(-30, 28.2, 18 + i * 6)} fill={U(u, "g")} stroke="#a8691a" strokeWidth=".8" /><ellipse cx="35.8" cy={18 + i * 6} rx="2.6" ry="5.2" transform={rot(30, 35.8, 18 + i * 6)} fill={U(u, "g")} stroke="#a8691a" strokeWidth=".8" /></g>)}<ellipse cx="32" cy="8" rx="2.6" ry="6" fill={U(u, "g")} stroke="#a8691a" strokeWidth=".8" /></g>);
    return (<>{defs(u, { g: ["l", "#ffe27a", "#e0a21f"] })}{stalk(-9, -16, 0.9)}{stalk(9, 16, 0.9)}{stalk(0, 0, 1)}</>); },
  coffee: (u) => (<>{defs(u, { c: ["l", "#fffaf0", "#eadcc4"], t: ["l", "#ff9a3c", "#d96a12"] })}
    <path d="M18 17C14 12 20 9 18 4M30 17C26 12 32 9 30 4M42 17C38 12 44 9 42 4" stroke="#fff" strokeOpacity=".75" strokeWidth="2.2" fill="none" {...J} />{Bub(19, 4, 2.2)}{Bub(43, 3, 1.8)}
    <ellipse cx="30" cy="56" rx="26" ry="5" fill="#eadcc4" stroke="#b89a68" strokeWidth="1" /><path d="M46 30C60 28 60 46 44 44" stroke="#eadcc4" strokeWidth="4.4" fill="none" {...J} /><path d="M46 30C60 28 60 46 44 44" stroke="#b89a68" strokeWidth=".9" fill="none" opacity=".7" {...J} />
    <path d="M10 26H50C50 44 44 54 30 54C16 54 10 44 10 26Z" fill={U(u, "c")} stroke="#b89a68" strokeWidth="1.2" {...J} /><path d="M10.6 32H49.4" stroke={U(u, "t")} strokeWidth="4" /><ellipse cx="30" cy="26" rx="20" ry="4.6" fill="#6b3a1a" stroke="#b89a68" strokeWidth="1" />{Eli(20, 40, 2, 7, 10, 0.5)}</>),

  /* ───────── Inverno / Freddo ───────── */
  snowman: (u) => (<>{defs(u, { s: ["r", "#ffffff", "#e6f2ff", "#b4cff0"] })}
    <path d="M18 34L6 26M46 34L58 26M10 28L8 22M54 28L56 22" stroke="#6b4423" strokeWidth="2.4" {...J} />
    <circle cx="32" cy="46" r="15" fill={U(u, "s")} stroke="#8fb0d8" strokeWidth="1.2" /><circle cx="32" cy="24" r="11" fill={U(u, "s")} stroke="#8fb0d8" strokeWidth="1.2" />
    <rect x="22" y="9" width="20" height="3.6" rx="1.4" fill="#2b2b3d" /><rect x="25.5" y="0.8" width="13" height="10" rx="2" fill="#2b2b3d" /><rect x="25.5" y="6.4" width="13" height="2.6" fill="#ef3e4f" />
    <path d="M22 34Q32 40 42 34L42 38Q32 44 22 38Z" fill="#ef3e4f" stroke="#a50f27" strokeWidth=".9" {...J} /><path d="M38 38L42 50L37 50Z" fill="#ef3e4f" stroke="#a50f27" strokeWidth=".9" {...J} />
    <circle cx="28" cy="22" r="1.7" fill="#1c1c2b" /><circle cx="36" cy="22" r="1.7" fill="#1c1c2b" /><path d="M32 25L40 27L32 28.4Z" fill="#ff8a1f" stroke="#b34e00" strokeWidth=".7" {...J} />
    <circle cx="32" cy="46" r="1.8" fill="#1c1c2b" /><circle cx="32" cy="52" r="1.8" fill="#1c1c2b" />{Eli(24, 42, 3, 7, 20, 0.5)}</>),
  snowcloud: (u) => (<>{defs(u, { c: ["l", "#e3ecfa", "#8ea6cc", "#5f7aa6"] })}
    <path d="M16 40C8 40 5 30 13 28C13 17 26 13 32 20C36 12 50 14 50 24C58 24 61 40 51 40Z" fill={U(u, "c")} stroke="#4b6290" strokeWidth="1.3" {...J} />{Eli(22, 24, 4, 7, 50, 0.5)}
    {[[18, 50], [32, 55], [46, 50]].map(([x, y], i) => <g key={i} stroke="#cfeeff" strokeWidth="1.8" {...J}><path d={`M${x} ${y - 5}V${y + 5}M${x - 4.4} ${y - 2.5}L${x + 4.4} ${y + 2.5}M${x - 4.4} ${y + 2.5}L${x + 4.4} ${y - 2.5}`} /></g>)}{Bub(58, 52, 2.6)}</>),
  mitten: (u) => (<>{defs(u, { m: ["l", "#5fb8ff", "#2561d6"], c: ["l", "#f3fbff", "#bfe1f7"] })}
    <path d="M18 30C14 14 22 5 32 5C42 5 48 14 46 30L46 46H18Z" fill={U(u, "m")} stroke="#143f96" strokeWidth="1.3" {...J} /><path d="M18 31C9 29 5 36 9 43C12 47 18 45 20 41Z" fill={U(u, "m")} stroke="#143f96" strokeWidth="1.3" {...J} />
    <rect x="15" y="45" width="34" height="13" rx="3" fill={U(u, "c")} stroke="#8fb8d6" strokeWidth="1.2" /><path d="M21 46V57M27 46V57M33 46V57M39 46V57M45 46V57" stroke="#8fb8d6" strokeWidth="1" />
    <g stroke="#fff" strokeWidth="2" fill="none" {...J}><path d="M32 14V30M25.4 18L38.6 26M25.4 26L38.6 18" /></g><circle cx="32" cy="22" r="2.4" fill="#fff" />{[[24, 36], [32, 38], [40, 36]].map(([x, y], i) => <path key={i} d={`M${x} ${y - 2}L${x + 2} ${y}L${x} ${y + 2}L${x - 2} ${y}Z`} fill="#fff" />)}{Eli(24, 18, 2.4, 7, 15, 0.4)}</>),
  skate: (u) => (<>{defs(u, { b: ["l", "#ffffff", "#cfe7fb"], k: ["l", "#f4f8ff", "#8a9bb8"] })}
    <path d="M17 7H31V30C31 34 40 36 50 38C56 40 56 49 54 51H15C13 51 13 49 13 47Z" fill={U(u, "b")} stroke="#6f95c0" strokeWidth="1.3" {...J} />
    <ellipse cx="24" cy="7" rx="9.4" ry="3.2" fill="#fff" stroke="#bcd6ee" strokeWidth="1" /><path d="M19 14L28 14M19 20L28 20M20 26L29 26" stroke="#6f95c0" strokeWidth="1.5" {...J} />{[14, 20, 26].map((y, i) => <circle key={i} cx={24} cy={y} r=".01" />)}
    <path d="M13 51H55" stroke="#6f95c0" strokeWidth="1.2" /><rect x="19" y="51" width="4" height="5" fill="#8a9bb8" /><rect x="45" y="51" width="4" height="5" fill="#8a9bb8" />
    <path d="M7 55C7 52 10 53 12 56H59C61 56 62 60 58 60H12C8 60 7 58 7 55Z" fill={U(u, "k")} stroke="#5f7aa6" strokeWidth="1.2" {...J} />{Eli(20, 40, 2, 6, 0, 0.5)}{Bub(54, 14, 3.4)}</>),
  mountain: (u) => (<>{defs(u, { a: ["l", "#8fa8d6", "#46598c"], b: ["l", "#b9cbe9", "#6f87b8"] })}
    <path d="M30 58L46 28L63 58Z" fill={U(u, "b")} stroke="#3a4a78" strokeWidth="1.2" {...J} /><path d="M46 28L40.5 38L44 36.6L46 40L49.4 36.6L52.4 39Z" fill="#fff" {...J} />
    <path d="M1 58L26 11L52 58Z" fill={U(u, "a")} stroke="#2b3a68" strokeWidth="1.3" {...J} /><path d="M26 11L18 26L22 24L26 29.4L30.4 24L34 27Z" fill="#fff" stroke="#cfe0f6" strokeWidth=".8" {...J} />
    <path d="M26 29L30 58M26 29L18 58" stroke="#2b3a68" strokeOpacity=".3" strokeWidth="1.2" {...J} /><circle cx="52" cy="12" r="5" fill="#fff6c8" opacity=".9" />{Bub(10, 14, 3)}</>),

  /* ───────── Caldo ───────── */
  flame: (u) => (<>{defs(u, { o: ["l", "#ff5a1f", "#d91e18"], i: ["l", "#ffe27a", "#ff9f1a"] })}
    <path d="M32 3C34 15 46 21 48 37C50 50 42 60 32 60C22 60 14 50 16 37C17 31 20 27 22 23C24 29 26 31 28 31C26 21 28 11 32 3Z" fill={U(u, "o")} stroke="#8a1010" strokeWidth="1.2" {...J} />
    <path d="M32 27C34 36 42 40 42 48C42 54 38 58 32 58C26 58 22 54 22 48C22 42 28 38 32 27Z" fill={U(u, "i")} /><path d="M32 42C34 46 37 48 37 52C37 55 35 57 32 57C29 57 27 55 27 52C27 48 30 46 32 42Z" fill="#fff6c0" />{Eli(22, 40, 2, 6, 0, 0.3)}</>),
  cactus: (u) => (<>{defs(u, { g: ["l", "#5fcf7a", "#1f8a45"] })}
    <ellipse cx="32" cy="60" rx="20" ry="3.4" fill="#e8c88a" opacity=".8" />
    <g fill="none" {...J}><path d="M24 42H16Q12 42 12 36V28" stroke="#126a35" strokeWidth="10.4" /><path d="M40 34H46Q51 34 51 28V20" stroke="#126a35" strokeWidth="10.4" /><path d="M32 58V14" stroke="#126a35" strokeWidth="18.4" />
      <path d="M24 42H16Q12 42 12 36V28" stroke="#3fbf62" strokeWidth="7.6" /><path d="M40 34H46Q51 34 51 28V20" stroke="#3fbf62" strokeWidth="7.6" /><path d="M32 58V14" stroke="#3fbf62" strokeWidth="15.6" />
      <path d="M32 56V16M27 54V18M37 54V18" stroke="#1f8a45" strokeOpacity=".5" strokeWidth="1.2" /></g>
    {[[28, 24], [36, 30], [28, 40], [36, 46], [12, 30], [51, 24]].map(([x, y], i) => <path key={i} d={`M${x - 1.6} ${y - 1.6}L${x + 1.6} ${y + 1.6}M${x + 1.6} ${y - 1.6}L${x - 1.6} ${y + 1.6}`} stroke="#fff3c0" strokeWidth=".9" {...J} />)}
    <circle cx="32" cy="8" r="3.6" fill="#ff7ab8" /><circle cx="28.6" cy="10" r="2.6" fill="#ff9ccb" /><circle cx="35.6" cy="10" r="2.6" fill="#ff9ccb" /><circle cx="32" cy="8.4" r="1.4" fill="#ffd54a" /></>),
  orange: (u) => (<>{defs(u, { o: ["r", "#ffc15a", "#ff8a14", "#d95c00"], s: ["r", "#fff1b8", "#ffb52e"] })}
    <circle cx="26" cy="40" r="20" fill={U(u, "o")} stroke="#a84300" strokeWidth="1.2" /><path d="M26 20C26 15 29 13 32 13C32 18 29 20 26 20Z" fill="#4fbf5a" stroke="#1f7a35" strokeWidth="1" {...J} /><path d="M26 20C24 15 20 14 17 16C19 20 23 21 26 20Z" fill="#3fae4a" stroke="#1f7a35" strokeWidth="1" {...J} />
    <circle cx="26" cy="22" r="1.4" fill="#7a4a1a" />{Eli(17, 34, 3, 8, 30, 0.4)}
    <circle cx="48" cy="20" r="11" fill="#ff9a1f" stroke="#b34e00" strokeWidth="1" /><circle cx="48" cy="20" r="9" fill={U(u, "s")} />{Array.from({ length: 8 }, (_, i) => { const [x, y] = pol(48, 20, 9, i * 45); return <path key={i} d={`M48 20L${x} ${y}`} stroke="#ff9a1f" strokeWidth="1" />; })}</>),
  sunrise: (u) => (<>{defs(u, { s: ["l", "#fff3a0", "#ff9a3a", "#ff4f6a"], w: ["h", "#ff9a3a", "#ff4fa3"] })}
    <path d="M14 42A18 18 0 0 1 50 42Z" fill={U(u, "s")} stroke="#c2410c" strokeWidth="1" {...J} />
    {Array.from({ length: 7 }, (_, i) => { const a = -180 + i * 30, [x1, y1] = pol(32, 42, 22, a), [x2, y2] = pol(32, 42, 28, a); return <path key={i} d={`M${x1} ${y1}L${x2} ${y2}`} stroke="#ffb52e" strokeWidth="3" {...J} />; })}
    <path d="M4 42H60" stroke="#c2410c" strokeWidth="2" {...J} />{[[10, 48, 44], [16, 53, 32], [22, 58, 20]].map(([x, y, w], i) => <rect key={i} x={x} y={y} width={w} height="3.4" rx="1.7" fill={U(u, "w")} opacity={0.9 - i * 0.2} />)}{Eli(24, 34, 3, 1.6, -30, 0.5)}</>),
  chili: (u) => (<>{defs(u, { c: ["l", "#ff6a5a", "#d11a1a", "#8f0b12"] })}
    <path d="M40 13C52 17 54 31 46 43C38 55 22 60 7 56C22 51 32 43 36 33C38 25 36 17 40 13Z" fill={U(u, "c")} stroke="#7a0b10" strokeWidth="1.3" {...J} />
    <path d="M35 15C32 11 34 6 40 6C43 8 46 11 46 15C42 17 38 17 35 15Z" fill="#4fbf5a" stroke="#1f7a35" strokeWidth="1.1" {...J} /><path d="M40 6C40 3 43 2 45 3" stroke="#1f7a35" strokeWidth="2.2" fill="none" {...J} />
    <path d="M40 22C44 28 41 38 32 46" stroke="#fff" strokeOpacity=".5" strokeWidth="2.4" fill="none" {...J} /></>),

  /* ───────── Freddo ───────── */
  icecube: (u) => (<>{defs(u, { t: ["l", "#f3fcff", "#b8e8ff"], l: ["l", "#bfeaff", "#6ec3f2"], r: ["l", "#8fd2f7", "#3a93d8"] })}
    <polygon points="32,5 54,18 32,31 10,18" fill={U(u, "t")} /><polygon points="10,18 32,31 32,58 10,44" fill={U(u, "l")} /><polygon points="54,18 54,44 32,58 32,31" fill={U(u, "r")} />
    <path d="M32 31V58M10 18L32 31L54 18" stroke="#fff" strokeOpacity=".8" strokeWidth="1.2" fill="none" {...J} /><polygon points="32,5 54,18 54,44 32,58 10,44 10,18" fill="none" stroke="#2f7fc0" strokeWidth="1.4" {...J} />
    <path d="M17 24L24 28M40 38L46 34M20 44L26 47" stroke="#fff" strokeOpacity=".6" strokeWidth="1.2" {...J} />{Bub(22, 38, 2.6)}{Bub(40, 44, 1.8)}{Bub(44, 24, 2.2)}<path d={spark4(15, 12, 5)} fill="#fff" /></>),
  gem: (u) => (<>{defs(u, { a: ["l", "#e6fbff", "#8fe3ff"], b: ["l", "#8fe3ff", "#35a7f0"], c: ["l", "#35a7f0", "#1c5fd0"] })}
    <polygon points="20,12 26,24 8,24" fill={U(u, "a")} /><polygon points="20,12 44,12 38,24 26,24" fill="#d8f6ff" /><polygon points="44,12 56,24 38,24" fill={U(u, "b")} />
    <polygon points="8,24 26,24 32,58" fill={U(u, "b")} /><polygon points="26,24 38,24 32,58" fill={U(u, "a")} /><polygon points="38,24 56,24 32,58" fill={U(u, "c")} />
    <polygon points="20,12 44,12 56,24 32,58 8,24" fill="none" stroke="#1c5fd0" strokeWidth="1.4" {...J} /><path d="M8 24H56" stroke="#1c5fd0" strokeOpacity=".5" strokeWidth="1" />
    <path d={spark4(14, 8, 6)} fill="#fff" /><path d={spark4(54, 10, 4)} fill="#fff" /></>),
  wind: (u) => (<>{defs(u, { w: ["h", "#ffffff", "#8fd8ff"] })}
    {["M6 24H38C47 24 48 12 40 12C36 12 34 15 35 18", "M6 34H48C58 34 58 47 50 47C46 47 44 44 45 41", "M12 45H30C36 45 36 53 30 53C28 53 27 52 27 50"].map((d, i) => <g key={i} fill="none" {...J}><path d={d} stroke="#4aa8e0" strokeWidth="5.4" /><path d={d} stroke={U(u, "w")} strokeWidth="3.2" /></g>)}
    {Bub(54, 16, 3)}{Bub(58, 26, 1.8)}<path d={spark4(12, 12, 4)} fill="#fff" /></>),

  /* ───────── Orientale ───────── */
  lantern: (u) => (<>{defs(u, { l: ["r", "#ff7a6a", "#e0242c", "#9a0f1c"], g: ["h", "#c98412", "#ffe27a", "#c98412"], w: ["r", "#fff3a8", "#ffd54a"] })}
    <path d="M32 0V8" stroke="#8a5a00" strokeWidth="1.6" {...J} /><ellipse cx="32" cy="31" rx="21" ry="22" fill={U(u, "l")} stroke="#7a0b14" strokeWidth="1.3" /><ellipse cx="32" cy="31" rx="11" ry="20" fill={U(u, "w")} opacity=".4" />
    <path d="M32 9V53M22 11C14 22 14 40 22 51M42 11C50 22 50 40 42 51" stroke="#7a0b14" strokeOpacity=".5" strokeWidth="1.2" fill="none" />
    <rect x="22" y="6" width="20" height="6" rx="2" fill={U(u, "g")} stroke="#8a5a00" strokeWidth="1" /><rect x="22" y="50" width="20" height="6" rx="2" fill={U(u, "g")} stroke="#8a5a00" strokeWidth="1" />
    <path d="M32 56V62M27 56L26 62M37 56L38 62" stroke="#ffd54a" strokeWidth="1.8" {...J} /><circle cx="32" cy="31" r="4.2" fill="none" stroke="#ffd54a" strokeWidth="1.6" />{Eli(20, 24, 2.6, 8, 20, 0.35)}</>),
  bamboo: (u) => (<>{defs(u, { b: ["h", "#4fbf5a", "#b6f07a", "#2f9e45"] })}
    <g transform={rot(6, 32, 32)}><rect x="27" y="1" width="9" height="62" rx="3" fill={U(u, "b")} stroke="#1f7a35" strokeWidth="1.2" />{[12, 26, 40, 54].map((y) => <rect key={y} x="26" y={y} width="11" height="3.4" rx="1.4" fill="#2f9e45" stroke="#1f7a35" strokeWidth=".8" />)}</g>
    {["M36 14C44 8 54 10 58 4C54 14 46 16 36 14Z", "M28 28C20 22 10 24 6 18C10 28 18 30 28 28Z", "M38 42C46 36 54 38 58 32C54 42 46 44 38 42Z"].map((d, i) => <path key={i} d={d} fill="#6fd66a" stroke="#1f7a35" strokeWidth="1" {...J} />)}
    {[[50, 14, "#ff9ccb"], [14, 28, "#ffe27a"], [50, 44, "#8fe3ff"]].map(([x, y, c], i) => <g key={i}><path d={`M${x} ${y - 3}V${y + 3}`} stroke="#c98412" strokeWidth="1" /><rect x={x - 3.4} y={y + 2} width="6.8" height="14" rx="1" fill={c} stroke="#8a5a00" strokeWidth=".8" /><path d={`M${x - 1} ${y + 6}H${x + 1}M${x - 1} ${y + 10}H${x + 1}`} stroke="#8a5a00" strokeWidth=".8" opacity=".6" /></g>)}</>),
  fan: (u) => { const R = 40, cx = 32, cy = 58, a0 = -138, step = 16, N = 6, cols = ["#e0242c", "#ffd54a"];
    return (<>{defs(u, { r: ["l", "#ff5d6c", "#c4142e"], y: ["l", "#ffe27a", "#f0b11f"] })}
      {Array.from({ length: N }, (_, i) => { const [x1, y1] = pol(cx, cy, R, a0 + i * step), [x2, y2] = pol(cx, cy, R, a0 + (i + 1) * step); return <path key={i} d={`M${cx} ${cy}L${x1} ${y1}A${R} ${R} 0 0 1 ${x2} ${y2}Z`} fill={U(u, i % 2 ? "y" : "r")} stroke="#7a0b14" strokeWidth="1" {...J} />; })}
      <path d={`M${pol(cx, cy, R, a0).join(" ")}A${R} ${R} 0 0 1 ${pol(cx, cy, R, a0 + N * step).join(" ")}`} fill="none" stroke="#c98412" strokeWidth="2.4" {...J} />
      <path d={`M${pol(cx, cy, R * 0.5, a0).join(" ")}A${R * 0.5} ${R * 0.5} 0 0 1 ${pol(cx, cy, R * 0.5, a0 + N * step).join(" ")}`} fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="1" />
      <path d="M28 57L36 57L37 63L27 63Z" fill="#8a4b1e" stroke="#4a2a10" strokeWidth="1" {...J} /><circle cx="32" cy="50" r="3" fill="#ffd54a" stroke="#8a5a00" strokeWidth=".8" /></>); },
  torii: (u) => (<>{defs(u, { r: ["l", "#ff5d4a", "#c4142e"], k: ["l", "#3a3a4a", "#17171f"] })}
    <circle cx="32" cy="28" r="14" fill="#fff4c0" opacity=".55" />
    <rect x="13" y="20" width="6.4" height="39" fill={U(u, "r")} stroke="#7a0b14" strokeWidth="1" /><rect x="44.6" y="20" width="6.4" height="39" fill={U(u, "r")} stroke="#7a0b14" strokeWidth="1" />
    <rect x="9" y="29" width="46" height="5" rx="1" fill={U(u, "r")} stroke="#7a0b14" strokeWidth="1" /><rect x="28.6" y="22" width="6.8" height="7" fill="#e0242c" stroke="#7a0b14" strokeWidth="1" />
    <path d="M1 9C14 15 50 15 63 9L61 17C48 22 16 22 3 17Z" fill={U(u, "k")} stroke="#0b0b12" strokeWidth="1" {...J} /><path d="M5 17C18 22 46 22 59 17L59 20C46 25 18 25 5 20Z" fill={U(u, "r")} stroke="#7a0b14" strokeWidth="1" {...J} />
    <rect x="11" y="57" width="10.4" height="4" rx="1" fill="#3a3a4a" /><rect x="42.6" y="57" width="10.4" height="4" rx="1" fill="#3a3a4a" /></>),
  dragon: (u) => (<>{defs(u, { b: ["h", "#2fd6a8", "#1b9ac4"], p: ["r", "#ffffff", "#ffe27a", "#ff9a1f"] })}
    <g fill="none" {...J}><path d="M33 20C20 26 20 36 33 40C46 44 48 53 36 57C28 60 19 58 11 53" stroke="#0e5f7a" strokeWidth="10" /><path d="M33 20C20 26 20 36 33 40C46 44 48 53 36 57C28 60 19 58 11 53" stroke={U(u, "b")} strokeWidth="7.4" />
      <path d="M33 20C20 26 20 36 33 40C46 44 48 53 36 57C28 60 19 58 11 53" stroke="#fff" strokeOpacity=".4" strokeWidth="7.4" strokeDasharray=".6 4.4" /></g>
    <path d="M11 53C5 52 3 56 6 60C8 58 10 58 13 59Z" fill="#ff6a8a" stroke="#a50f48" strokeWidth=".9" {...J} />
    <path d="M30 20C30 11 38 6 46 8C52 8 58 12 58 15C54 17 50 16 46 18C42 23 35 23 30 20Z" fill={U(u, "b")} stroke="#0e5f7a" strokeWidth="1.2" {...J} />
    <path d="M36 9C34 4 38 2 41 3C40 5 39 7 40 9ZM30 14C26 12 24 9 25 6C28 7 31 9 32 12Z" fill="#ffd54a" stroke="#a8691a" strokeWidth=".9" {...J} /><circle cx="43" cy="13" r="2" fill="#fff" /><circle cx="43.4" cy="13" r="1" fill="#2a0f0f" /><circle cx="54" cy="14" r=".8" fill="#0e5f7a" />
    <path d="M57 15C62 18 60 25 55 25M52 17C56 22 52 28 48 27" stroke="#ff9a1f" strokeWidth="1.5" fill="none" {...J} />
    <circle cx="14" cy="14" r="7.4" fill={U(u, "p")} opacity=".95" /><circle cx="14" cy="14" r="7.4" fill="none" stroke="#ff9a1f" strokeWidth="1" />{Eli(11.6, 11.4, 2, 1.2, -30, 0.9)}</>),
  tea: (u) => (<>{defs(u, { c: ["l", "#ffffff", "#dcecf8"], t: ["l", "#b9e46a", "#6fae2a"] })}
    <clipPath id={u + "c"}><path d="M10 26H54C54 44 46 56 32 56C18 56 10 44 10 26Z" /></clipPath>
    <path d="M22 18C18 12 24 9 21 3M34 18C30 12 36 9 33 3M44 18C40 12 46 9 43 3" stroke="#fff" strokeOpacity=".8" strokeWidth="2.2" fill="none" {...J} />
    <path d="M10 26H54C54 44 46 56 32 56C18 56 10 44 10 26Z" fill={U(u, "c")} /><g clipPath={U(u, "c")} stroke="#4a8fd6" strokeWidth="1.3" fill="none" opacity=".75">{[[16, 40], [28, 40], [40, 40], [22, 48], [34, 48], [46, 48]].map(([x, y], i) => <g key={i}><path d={`M${x - 6} ${y}A6 6 0 0 1 ${x + 6} ${y}`} /><path d={`M${x - 3.6} ${y}A3.6 3.6 0 0 1 ${x + 3.6} ${y}`} /></g>)}</g>
    <path d="M10 26H54C54 44 46 56 32 56C18 56 10 44 10 26Z" fill="none" stroke="#7aa6c9" strokeWidth="1.3" {...J} /><ellipse cx="32" cy="26" rx="22" ry="5.4" fill={U(u, "t")} stroke="#5f9a22" strokeWidth="1.1" />{Bub(24, 26, 1.6)}{Bub(34, 27, 1.2)}{Bub(40, 25, 1.4)}{Eli(17, 38, 2, 7, 10, 0.5)}</>),

  /* ───────── Universo ───────── */
  planet: (u) => (<>{defs(u, { p: ["r", "#ffd9a0", "#ff9a6a", "#a8409a"], r: ["h", "#ffe9b8", "#ff8ad8", "#7a5cff"] })}
    <clipPath id={u + "c"}><circle cx="32" cy="32" r="15" /></clipPath>
    <g transform={rot(-22)}><path d="M3 32A29 8 0 0 1 61 32" fill="none" stroke={U(u, "r")} strokeWidth="4.2" opacity=".8" /></g>
    <circle cx="32" cy="32" r="15" fill={U(u, "p")} stroke="#6a2a7a" strokeWidth="1.1" /><g clipPath={U(u, "c")}><path d="M14 26Q32 22 52 28V31Q32 27 14 31Z" fill="#fff" opacity=".28" /><path d="M14 38Q32 34 52 40V43Q32 39 14 43Z" fill="#7a2a8a" opacity=".3" /></g>
    <g transform={rot(-22)}><path d="M3 32A29 8 0 0 0 61 32" fill="none" stroke={U(u, "r")} strokeWidth="4.2" /></g>{Eli(25, 24, 3, 5, 40, 0.45)}<path d={spark4(54, 9, 5)} fill="#fff" /><circle cx="9" cy="52" r="1.6" fill="#fff" /></>),
  glowstar: (u) => (<>{defs(u, { s: ["l", "#fffbe0", "#ffc21f"] })}<defs><radialGradient id={u + "hz"}><stop offset="0" stopColor="#fff6c0" stopOpacity=".85" /><stop offset="1" stopColor="#ffd54a" stopOpacity="0" /></radialGradient></defs>
    <circle cx="32" cy="33" r="30" fill={U(u, "hz")} />{Array.from({ length: 8 }, (_, i) => { const [x1, y1] = pol(32, 33, 25, i * 45 + 22.5), [x2, y2] = pol(32, 33, 30, i * 45 + 22.5); return <path key={i} d={`M${x1} ${y1}L${x2} ${y2}`} stroke="#fff3a0" strokeWidth="2" {...J} />; })}
    <polygon points={starPts(32, 33, 21, 9)} fill={U(u, "s")} stroke="#e0a010" strokeWidth="1.4" {...J} /><polygon points={starPts(32, 33, 11, 4.8)} fill="#fff" opacity=".75" /></>),
  comet: (u) => (<>{defs(u, { t: ["l", "#ffffff", "#8fd8ff", "#7a5cff"], h: ["r", "#ffffff", "#9fe0ff", "#4a6cf0"] })}
    <linearGradient id={u + "tl"} gradientUnits="userSpaceOnUse" x1="16" y1="48" x2="60" y2="4"><stop offset="0" stopColor="#bfeaff" stopOpacity=".95" /><stop offset="1" stopColor="#7a5cff" stopOpacity="0" /></linearGradient>
    <path d="M12 44L52 4C54 22 44 40 24 54Z" fill={U(u, "tl")} /><path d="M18 52C30 42 42 28 50 14M10 40C24 32 38 20 46 8" stroke="#fff" strokeOpacity=".7" strokeWidth="1.2" fill="none" {...J} />
    <circle cx="19" cy="47" r="12" fill="#9fe0ff" opacity=".35" /><circle cx="19" cy="47" r="9" fill={U(u, "h")} stroke="#3a56c8" strokeWidth="1" /><circle cx="16" cy="44" r="2" fill="#4a6cf0" opacity=".4" /><circle cx="22" cy="50" r="1.5" fill="#4a6cf0" opacity=".4" />
    <path d={spark4(52, 36, 5)} fill="#fff" /><circle cx="40" cy="56" r="1.4" fill="#fff" /><circle cx="8" cy="24" r="1.6" fill="#fff" /></>),
  rocket: (u) => (<>{defs(u, { b: ["h", "#c9d4ee", "#ffffff", "#aab6d6"], n: ["l", "#ff6a7a", "#c4142e"], f: ["l", "#ffe27a", "#ff7a1a", "#e0242c"], g: ["r", "#bfe9ff", "#3a8fe0", "#1a3a90"] })}
    <g transform={rot(40)}>
      <path d="M26 46C26 56 32 63 32 63C32 63 38 56 38 46Z" fill={U(u, "f")} stroke="#b3260a" strokeWidth="1" {...J} /><path d="M29 47C29 53 32 57 32 57C32 57 35 53 35 47Z" fill="#fff6c0" />
      <path d="M22 36L11 52L22 47Z" fill={U(u, "n")} stroke="#7e0b1e" strokeWidth="1.1" {...J} /><path d="M42 36L53 52L42 47Z" fill={U(u, "n")} stroke="#7e0b1e" strokeWidth="1.1" {...J} />
      <path d="M32 2C43 13 44 30 42 46H22C20 30 21 13 32 2Z" fill={U(u, "b")} stroke="#6f7fa8" strokeWidth="1.3" {...J} /><path d="M32 2C36 6 39 11 40.4 17H23.6C25 11 28 6 32 2Z" fill={U(u, "n")} stroke="#7e0b1e" strokeWidth="1.1" {...J} />
      <rect x="22.6" y="42" width="18.8" height="5" rx="1.4" fill="#8a97bc" stroke="#6f7fa8" strokeWidth="1" /><circle cx="32" cy="29" r="6.6" fill="#8a97bc" stroke="#6f7fa8" strokeWidth="1" /><circle cx="32" cy="29" r="4.8" fill={U(u, "g")} /><circle cx="30.4" cy="27.4" r="1.5" fill="#fff" opacity=".9" /></g>
    <path d={spark4(10, 12, 5)} fill="#fff" /><circle cx="54" cy="10" r="1.4" fill="#fff" /><circle cx="8" cy="46" r="1.2" fill="#fff" /></>),
  galaxy: (u) => (<>{defs(u, { c: ["r", "#ffffff", "#c9a8ff", "#4a2a9a"] })}
    <g transform="translate(32 32) rotate(-25) scale(1 .62)">{[0, 1].map((k) => <g key={k}><path d={GALAXY(k)} fill="none" stroke="#7a5cff" strokeOpacity=".28" strokeWidth="9" {...J} /><path d={GALAXY(k)} fill="none" stroke={k ? "#ff8ad8" : "#8fd8ff"} strokeWidth="3.2" strokeDasharray=".1 3.2" {...J} /></g>)}<circle r="9" fill={U(u, "c")} opacity=".9" /></g>
    {[[8, 12], [54, 10], [58, 44], [10, 52], [30, 6], [48, 58], [6, 32]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 3 ? 1 : 1.6} fill="#fff" />)}<path d={spark4(52, 22, 4)} fill="#fff" /></>),

  /* ───────── Bolle ───────── */
  bubble: (u) => (<>{defs(u, { r: ["r", "#ffffff", "#bfe9ff", "#e1a8ff"], s: ["h", "#7ee8ff", "#c28bff", "#ff9bd6"] })}
    <circle cx="28" cy="36" r="22" fill={U(u, "r")} fillOpacity=".25" stroke={U(u, "s")} strokeWidth="2.4" /><path d="M13 44A17 17 0 0 0 38 53" stroke="#ff9bd6" strokeOpacity=".7" strokeWidth="2.4" fill="none" {...J} /><path d="M16 24A16 16 0 0 1 30 16" stroke="#7ee8ff" strokeOpacity=".8" strokeWidth="2" fill="none" {...J} />
    {Eli(19, 25, 4, 7.5, 40, 0.85)}<circle cx="33" cy="48" r="1.8" fill="#fff" opacity=".9" />
    <circle cx="51" cy="16" r="9" fill={U(u, "r")} fillOpacity=".25" stroke={U(u, "s")} strokeWidth="1.8" />{Eli(48, 12.4, 2.2, 3.6, 40, 0.85)}<circle cx="53" cy="52" r="5" fill={U(u, "r")} fillOpacity=".25" stroke={U(u, "s")} strokeWidth="1.5" />{Eli(51.4, 50, 1.2, 2, 40, 0.85)}</>),
  bubbles: (u) => (<>{defs(u, { r: ["r", "#ffffff", "#c9f0ff", "#f0b6ff"], s: ["h", "#7ee8ff", "#a88bff", "#ff9bd6"] })}
    {[[24, 22, 14], [46, 36, 11], [22, 48, 9], [48, 12, 6], [36, 54, 5]].map(([x, y, r], i) => <g key={i}><circle cx={x} cy={y} r={r} fill={U(u, "r")} fillOpacity=".28" stroke={U(u, "s")} strokeWidth={Math.max(1.2, r / 6)} />{Eli(x - r * 0.35, y - r * 0.38, r * 0.2, r * 0.36, 40, 0.85)}<path d={`M${x - r * 0.6} ${y + r * 0.5}A${r * 0.8} ${r * 0.8} 0 0 0 ${x + r * 0.2} ${y + r * 0.8}`} stroke="#ff9bd6" strokeOpacity=".6" strokeWidth={Math.max(1, r / 7)} fill="none" {...J} /></g>)}</>),
  drop: (u) => (<>{defs(u, { d: ["l", "#9be8ff", "#2f9cf0", "#1550c4"] })}
    <path d="M32 5C42 21 52 31 52 42C52 52 43 59 32 59C21 59 12 52 12 42C12 31 22 21 32 5Z" fill={U(u, "d")} stroke="#123f9c" strokeWidth="1.3" {...J} /><path d="M20 44C20 50 25 54 31 54" stroke="#fff" strokeOpacity=".55" strokeWidth="2" fill="none" {...J} />
    {Eli(23, 36, 3.4, 8.5, 20, 0.7)}<circle cx="39" cy="50" r="2" fill="#fff" opacity=".6" /><path d={spark4(50, 14, 5)} fill="#fff" /></>),
  crystal: (u) => (<>{defs(u, { a: ["l", "#e9fbff", "#7fdcff"], b: ["l", "#7fdcff", "#3a7cf0"], c: ["l", "#b79bff", "#5a3fd6"] })}
    <polygon points="32,3 61,32 32,61 3,32" fill={U(u, "b")} stroke="#2a3fa8" strokeWidth="1.4" {...J} /><polygon points="32,3 61,32 32,32" fill={U(u, "a")} /><polygon points="3,32 32,32 32,61" fill={U(u, "c")} opacity=".85" /><polygon points="32,3 3,32 32,32" fill="#fff" opacity=".28" />
    <polygon points="32,13 51,32 32,51 13,32" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="1.2" {...J} />{Bub(32, 32, 7)}</>),

  /* ───────── Natura ───────── */
  herb: (u) => { const pts = [[19, 50, 1], [25, 41, .95], [32, 32, .9], [39, 23, .85], [46, 15, .8]];
    return (<>{defs(u, { l: ["l", "#9be564", "#2f9e45"] })}<path d="M14 60C20 44 34 28 52 8" stroke="#1f7a35" strokeWidth="2.4" fill="none" {...J} />
      {pts.map(([x, y, s], i) => <g key={i}>{[-102, 8].map((a) => <path key={a} d="M0 0C4-7 13-7 18 0C13 7 4 7 0 0Z" transform={`translate(${x} ${y}) rotate(${a}) scale(${s})`} fill={U(u, "l")} stroke="#1f7a35" strokeWidth=".9" {...J} />)}</g>)}
      <path d="M52 8C54 2 60 2 62 6C58 10 54 10 52 8Z" fill={U(u, "l")} stroke="#1f7a35" strokeWidth=".9" {...J} />{Bub(10, 22, 3.4)}</>); },
  clover: (u) => (<>{defs(u, { l: ["l", "#7be07a", "#1f9a4a"] })}
    <path d="M32 34C32 46 36 54 46 59" stroke="#157a38" strokeWidth="3" fill="none" {...J} />
    {[0, 90, 180, 270].map((a) => <g key={a} transform={rot(a)}><path d="M32 32C21 24 18 11 26 8C30 6 32 10 32 14C32 10 34 6 38 8C46 11 43 24 32 32Z" fill={U(u, "l")} stroke="#157a38" strokeWidth="1.1" {...J} /><path d="M32 30V15" stroke="#d8ffd0" strokeOpacity=".6" strokeWidth="1" {...J} /></g>)}
    <circle cx="32" cy="32" r="2.2" fill="#d8ffd0" />{Bub(24, 18, 2.4)}</>),
  treeNature: (u) => (<>{defs(u, { c: ["r", "#9be564", "#3fae4a", "#1f7a35"], t: ["h", "#a8693a", "#6a3a18"] })}
    <path d="M28 61L30 38H35L37 61Z" fill={U(u, "t")} stroke="#4a2a10" strokeWidth="1" {...J} /><path d="M32 46L24 38M33 42L41 34" stroke="#6a3a18" strokeWidth="2.4" {...J} />
    {[[32, 21, 15], [19, 32, 12], [45, 32, 12], [32, 35, 13]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill={U(u, "c")} stroke="#176b30" strokeWidth="1.1" />)}
    {[[32, 21, 15], [19, 32, 12], [45, 32, 12], [32, 35, 13]].map(([x, y, r], i) => <circle key={"f" + i} cx={x} cy={y} r={r - 1} fill={U(u, "c")} />)}{Eli(26, 16, 4, 6, 40, 0.35)}{Eli(15, 28, 2.4, 4, 30, 0.3)}<circle cx="22" cy="40" r="2.2" fill="#ff5d6c" /><circle cx="42" cy="26" r="2.2" fill="#ff5d6c" /><circle cx="36" cy="44" r="2.2" fill="#ff5d6c" /></>),
  sunflower: (u) => (<>{defs(u, { p: ["l", "#fff08a", "#ffb81f"], c: ["r", "#9a6a3a", "#5a3416", "#2e1a0a"], s: ["l", "#5fcf7a", "#1f8a45"] })}
    <path d="M32 40V62" stroke="#1f8a45" strokeWidth="3.4" {...J} /><path d="M32 56C24 56 18 52 16 46C24 46 30 50 32 56Z" fill={U(u, "s")} stroke="#176b36" strokeWidth="1" {...J} /><path d="M32 52C40 52 46 48 48 42C40 42 34 46 32 52Z" fill={U(u, "s")} stroke="#176b36" strokeWidth="1" {...J} />
    {Array.from({ length: 16 }, (_, i) => <ellipse key={i} cx="32" cy="11" rx="3.8" ry="9" transform={rot(i * 22.5, 32, 28)} fill={U(u, "p")} stroke="#c98a00" strokeWidth=".8" />)}
    <circle cx="32" cy="28" r="12" fill={U(u, "c")} stroke="#2e1a0a" strokeWidth="1" />{SEEDS.map(([x, y, i]) => <circle key={i} cx={x} cy={y} r=".85" fill={i % 2 ? "#d9a35e" : "#8a5a2b"} />)}{Eli(27, 22, 2.6, 1.6, -35, 0.35)}</>),
};

function scarfArt(u, c1, c2, st) {
  const band = "M7 21C20 12 44 12 57 21L55 33C44 26 20 26 9 33Z", tail = "M37 29L50 29L53 55L40 58Z";
  return (<>{defs(u, { s: ["l", c1, c2] })}<clipPath id={u + "c"}><path d={band} /><path d={tail} /></clipPath>
    <path d={tail} fill={U(u, "s")} /><path d={band} fill={U(u, "s")} />
    <g clipPath={U(u, "c")} fill={st} opacity=".85">{[14, 26, 38, 50].map((x) => <rect key={x} x={x} y="8" width="5" height="52" transform={rot(-12, x, 30)} />)}</g>
    <path d={band} fill="none" stroke={c2} strokeWidth="1.3" {...J} /><path d={tail} fill="none" stroke={c2} strokeWidth="1.3" {...J} />
    <path d="M41 58L40.5 62M45 57.4L45 62M49 56.8L49.5 61.6M52 56L53 60" stroke={c2} strokeWidth="1.8" {...J} />{Eli(22, 20, 8, 1.8, -12, 0.4)}</>);
}
function sunArt(u, face) {
  return (<>{defs(u, { s: ["r", "#fff6a8", "#ffc21f", "#ff8a14"] })}
    {Array.from({ length: 12 }, (_, i) => { const [x1, y1] = pol(32, 32, 20, i * 30), [x2, y2] = pol(32, 32, i % 2 ? 27 : 31, i * 30); return <path key={i} d={`M${x1} ${y1}L${x2} ${y2}`} stroke={i % 2 ? "#ffb52e" : "#ff9a1f"} strokeWidth={i % 2 ? 3.4 : 4.4} {...J} />; })}
    <circle cx="32" cy="32" r="17" fill={U(u, "s")} stroke="#d97706" strokeWidth="1.3" />
    {face ? <><circle cx="26" cy="29" r="2" fill="#7a3d00" /><circle cx="38" cy="29" r="2" fill="#7a3d00" /><path d="M25 36Q32 43 39 36" stroke="#7a3d00" strokeWidth="2" fill="none" {...J} /><circle cx="22" cy="35" r="2.6" fill="#ff7a5c" opacity=".5" /><circle cx="42" cy="35" r="2.6" fill="#ff7a5c" opacity=".5" /></> : null}{Eli(25, 24, 5, 2.6, -35, 0.5)}</>);
}
function leafArt(u, cs, edge) {
  return (<>{defs(u, { l: ["l", ...cs] })}
    <path d="M10 52C8 26 28 8 57 9C58 38 40 56 10 52Z" fill={U(u, "l")} stroke={edge} strokeWidth="1.3" {...J} />
    <path d="M10 52C24 40 38 26 53 13M25 40L26 28M33 33L35 22M41 26L47 22M22 43L34 44M30 36L41 36" stroke="#fff" strokeOpacity=".55" strokeWidth="1.3" fill="none" {...J} />
    <path d="M6 58C8 55 9 54 10 52" stroke={edge} strokeWidth="2" {...J} />{Eli(22, 22, 3, 6, 50, 0.4)}{Bub(52, 50, 3.6)}<path d="M52 58C56 58 58 56 60 54" stroke="#cfeeff" strokeWidth="1.6" fill="none" {...J} /></>);
}

export const THEME_ICON_NAMES = Object.keys(ICONS);

/* Un'icona illustrata. `size` in px (default: 1em, così segue il font-size dell'ornamento). */
export function ThemeIcon({ name, size, className = "", title }) {
  const uid = "ti" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const draw = ICONS[name];
  if (!draw) return null;
  return (
    <svg className={`bl-ticon bl-ticon--${name} ${className}`.trim()} viewBox="0 0 64 64" width={size ?? "1em"} height={size ?? "1em"} aria-hidden={title ? undefined : "true"} role={title ? "img" : undefined} focusable="false" xmlns="http://www.w3.org/2000/svg">
      {title ? <title>{title}</title> : null}
      {draw(uid)}
    </svg>
  );
}

/* Icone per tema (stesso ordine/posizione degli ornamenti di prima). */
export const THEME_DECOR_ICONS = {
  halloween: ["bat", "pumpkin", "ghost", "web", "witchhat", "spider", "moon", "skull"],
  natale: ["tree", "snowflake", "gift", "star", "bell", "reindeer", "scarf", "candy"],
  pasqua: ["chick", "egg", "bunny", "tulip", "daisy", "butterfly", "carrot", "blossom"],
  capodanno: ["firework", "sparkler", "sparkles", "champagne", "popper", "star", "confetti", "discoball"],
  estate: ["sun", "palm", "watermelon", "umbrella", "shell", "wave", "sunglasses", "pineapple"],
  primavera: ["blossom", "tulip", "butterfly", "daisy", "bee", "sprout", "hibiscus", "leaf"],
  autunno: ["fallen", "maple", "chestnut", "mushroom", "hedgehog", "wheat", "coffee", "leafGold"],
  inverno: ["snowflake", "snowman", "snowcloud", "mitten", "skate", "mountain", "scarfIce", "snowflake"],
  caldo: ["sun", "flame", "sunface", "cactus", "orange", "sunrise", "sparkles", "chili"],
  freddo: ["icecube", "snowflake", "gem", "wind", "scarfIce", "snowcloud", "mitten", "icecube"],
  orientale: ["lantern", "blossom", "bamboo", "fan", "torii", "dragon", "tea", "moon"],
  universo: ["planet", "glowstar", "moon", "comet", "sparkles", "rocket", "galaxy", "star"],
  bolle: ["bubble", "bubbles", "sparkles", "drop", "bubble", "crystal", "bubbles", "sparkles"],
  natura: ["herb", "clover", "treeNature", "butterfly", "sprout", "sunflower", "leaf", "daisy"],
};

/* Icona "badge" di ciascun tema (selettore del tema nel profilo). */
export const THEME_BADGE_ICON = {
  halloween: "pumpkin", natale: "tree", pasqua: "chick", capodanno: "firework", estate: "sun", primavera: "blossom", autunno: "maple",
  inverno: "snowflake", caldo: "flame", freddo: "icecube", orientale: "lantern", universo: "planet", bolle: "bubble", natura: "clover",
};
