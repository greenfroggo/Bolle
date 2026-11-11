import React, { useState } from "react";
import { Sparkles, LogIn, Compass, ChevronRight } from "lucide-react";
import ReportProblemButton from "./ReportProblemButton.jsx";

/* Benvenuto v6 — stesso mondo dell'app e dei visual di Bolle: cosmo viola scuro con stelle, bolle di vetro iridescenti,
   pannello di vetro scuro, bottone lavanda→rosa, bianco, contorni teal e ambra (gli stessi accenti dell'app).
   Logo: SOLO la scritta «Bolle» (SVG vettoriale) dentro la bolla.
   Gli stili sono INCORPORATI qui sotto: nessun file CSS da importare. Props invariate: onExplore, onRegister, onLogin, onGoogle. */

const WORDMARK_PATH = "M592.4 252.3C591.5 252.1 590.1 252.0 589.1 252.0C569.8 251.7 541.7 236.6 528.9 219.5C519.3 206.6 514.4 195.3 511.0 178.2C510.0 173.1 509.8 154.6 510.8 149.8C513.0 138.4 514.6 132.9 518.1 125.2C529.8 99.8 554.3 80.2 580.1 75.7C582.2 75.3 585.1 74.8 586.5 74.5C590.5 73.7 604.7 73.8 609.1 74.5C614.6 75.5 618.6 76.3 621.1 77.0C653.4 86.3 676.6 112.1 682.5 145.5C684.9 158.8 679.4 169.2 668.8 171.6C664.6 172.5 661.8 173.0 660.5 173.0C659.7 173.0 658.0 173.2 656.6 173.5C655.3 173.8 653.4 174.0 652.4 174.0C651.4 174.0 649.5 174.2 648.1 174.5C646.6 174.8 644.9 175.0 644.2 175.0C643.4 175.0 641.8 175.2 640.5 175.5C639.2 175.8 637.5 176.0 636.8 176.0C636.0 176.0 634.2 176.2 632.8 176.5C631.4 176.8 629.7 177.0 629.0 177.0C628.4 177.0 626.7 177.2 625.4 177.5C624.0 177.8 622.2 178.0 621.3 178.0C620.4 178.0 618.9 178.2 618.0 178.4C617.1 178.6 615.1 178.9 613.6 179.0C612.1 179.1 610.1 179.4 609.1 179.6C608.2 179.8 606.7 180.0 606.0 180.0C605.2 180.0 603.5 180.2 602.2 180.5C600.9 180.8 599.3 181.0 598.6 181.0C597.9 181.0 596.2 181.2 594.8 181.5C593.4 181.8 591.6 182.0 590.9 182.0C590.2 182.0 588.5 182.2 587.1 182.5C585.8 182.8 584.0 183.0 583.2 183.0C582.3 183.0 580.8 183.2 579.9 183.4C578.9 183.6 576.9 183.9 575.5 184.0C574.1 184.1 572.1 184.4 571.1 184.6C570.2 184.8 568.8 185.0 568.1 185.0C567.4 185.0 565.6 185.2 564.2 185.5C562.9 185.8 561.3 186.0 560.8 186.0C557.7 186.0 557.1 187.8 559.3 191.0C571.5 209.2 593.0 216.0 614.6 208.5C621.3 206.2 625.0 203.7 632.2 196.6C642.0 187.1 650.2 185.4 659.5 190.9C673.1 198.8 674.6 213.7 663.1 225.5C649.3 239.6 634.6 247.3 613.6 251.4C609.8 252.1 595.7 252.7 592.4 252.3ZM49.8 250.4C22.2 246.2 5.3 229.4 0.6 201.6C0.1 198.6 -0.3 83.4 0.2 75.5C2.6 35.3 26.2 7.2 62.9 0.8C68.6 -0.2 107.7 -0.3 114.9 0.7C150.3 5.5 174.4 26.9 177.3 56.2C177.4 57.6 177.7 59.4 177.9 60.4C178.4 62.7 178.4 68.7 177.9 71.4C177.7 72.5 177.4 74.5 177.3 75.8C175.5 93.6 164.3 109.1 146.8 118.2C140.2 121.6 140.2 121.9 146.0 124.2C165.4 131.9 178.7 147.2 181.9 165.6C182.1 166.9 182.5 169.1 182.8 170.6C183.4 174.2 183.5 185.8 182.9 188.6C182.7 189.6 182.4 191.3 182.2 192.4C178.2 223.4 151.8 246.5 115.9 250.2C114.4 250.4 112.3 250.6 111.4 250.8C106.9 251.3 53.9 251.0 49.8 250.4ZM268.5 250.5C253.2 247.9 243.2 244.3 232.6 237.3C176.4 200.5 181.9 114.4 242.4 85.5C250.7 81.5 257.0 79.6 268.8 77.5C272.5 76.8 287.4 76.7 290.7 77.4C291.7 77.6 293.5 77.9 294.5 78.0C311.1 80.2 329.5 89.7 342.4 102.8C344.2 104.6 346.4 107.0 347.3 108.1C348.1 109.2 349.6 111.2 350.6 112.5C355.1 118.5 360.4 128.9 363.0 136.8C364.5 141.6 366.2 149.3 366.3 151.6C366.3 152.1 366.5 153.8 366.8 155.2C367.5 158.9 367.5 169.5 366.7 173.0C366.5 174.3 366.2 175.8 366.2 176.4C366.2 184.8 358.7 204.2 351.5 214.2C336.6 235.0 317.4 246.6 291.5 250.5C286.7 251.2 272.9 251.2 268.5 250.5ZM399.4 250.5C391.3 248.4 385.6 242.8 383.1 234.6C382.1 231.4 381.9 21.0 383.0 17.2C389.6 -7.1 425.0 -5.3 428.4 19.6C429.0 23.7 429.1 227.5 428.5 231.4C427.0 241.4 421.2 247.9 411.5 250.4C408.4 251.2 402.2 251.2 399.4 250.5ZM467.0 250.6C458.2 248.6 452.2 242.6 450.1 233.7C449.1 229.6 449.0 22.6 449.9 18.6C455.9 -6.0 489.3 -6.5 495.4 17.9C496.0 20.0 496.3 227.6 495.7 231.4C493.9 244.9 480.7 253.7 467.0 250.6ZM288.9 208.0C306.8 204.8 322.4 188.5 324.3 171.0C324.4 169.7 324.6 167.9 324.8 167.0C326.3 158.5 321.5 144.0 314.5 135.6C281.8 96.6 219.6 133.8 238.7 180.9C246.7 200.5 267.5 211.8 288.9 208.0ZM108.8 206.6C144.3 200.5 146.1 151.5 111.0 146.2C110.0 146.1 107.8 145.7 106.1 145.5C101.3 144.7 48.7 144.8 47.6 145.6C46.1 146.8 46.2 145.4 46.2 172.1C46.3 187.2 46.4 197.0 46.5 197.7C47.5 201.9 51.2 205.5 55.9 206.6C58.2 207.2 105.5 207.2 108.8 206.6ZM561.7 147.5C563.3 147.2 565.1 147.0 565.7 147.0C566.4 147.0 568.0 146.8 569.4 146.5C570.9 146.2 572.6 146.0 573.3 146.0C574.1 146.0 575.7 145.8 577.0 145.5C578.3 145.2 580.0 145.0 580.8 145.0C581.5 145.0 583.4 144.8 584.9 144.5C586.4 144.2 588.3 144.0 589.1 144.0C590.0 144.0 591.9 143.8 593.4 143.5C594.9 143.2 596.7 143.0 597.5 143.0C598.3 143.0 600.1 142.8 601.5 142.5C602.9 142.2 604.6 142.0 605.4 142.0C606.1 142.0 607.9 141.8 609.2 141.5C610.6 141.2 612.6 141.0 613.5 141.0C614.4 141.0 616.4 140.8 617.8 140.5C619.1 140.2 620.9 140.0 621.6 140.0C622.3 140.0 623.7 139.8 624.6 139.6C625.6 139.4 627.8 139.1 629.6 139.0C638.2 138.4 638.6 135.9 631.1 128.4C609.2 106.5 575.3 109.8 558.1 135.6C551.0 146.2 551.9 149.2 561.7 147.5ZM108.3 100.4C129.8 95.4 138.9 74.3 127.2 56.4C123.3 50.2 117.0 46.5 107.4 44.7C103.1 43.9 77.3 43.8 73.1 44.6C55.4 47.9 46.8 60.0 46.2 82.0C45.9 96.4 46.1 99.6 47.6 100.6C48.7 101.4 104.8 101.2 108.3 100.4Z";

/* stelle: posizioni fisse (niente random a ogni render) */
const STARS = (() => {
  let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  return Array.from({ length: 46 }, () => `${(r() * 100).toFixed(1)}vw ${(r() * 100).toFixed(1)}vh 0 ${r() > .8 ? 1 : 0}px rgba(255,255,255,${(.35 + r() * .6).toFixed(2)})`).join(",");
})();

const CSS = `
.bl-w6{position:fixed;inset:0;z-index:1000;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:space-between;gap:16px;overflow-x:hidden;overflow-y:auto;
  padding:calc(30px + env(safe-area-inset-top)) 20px calc(20px + env(safe-area-inset-bottom));color:#fff;font-family:inherit;-webkit-font-smoothing:antialiased;
  background:
    radial-gradient(ellipse 80% 46% at 50% 8%,rgba(70,60,235,.5),transparent 70%),
    radial-gradient(ellipse 95% 50% at 85% 104%,rgba(222,80,222,.55),transparent 70%),
    radial-gradient(ellipse 70% 40% at 0% 62%,rgba(90,60,220,.4),transparent 70%),
    linear-gradient(180deg,#0a0830 0%,#150d4a 48%,#2a1470 80%,#4a1c86 100%)}
.bl-w6>*{position:relative;z-index:1}
.bl-w6 *{box-sizing:border-box}
.bl-w6-stars{position:absolute!important;inset:0;z-index:0!important;overflow:hidden;pointer-events:none}
.bl-w6-stars i{position:absolute;left:0;top:0;width:2px;height:2px;border-radius:50%;background:transparent;box-shadow:${STARS};animation:bl-w6-tw 5s ease-in-out infinite alternate}
.bl-w6-stars i+i{box-shadow:${STARS};transform:translate(23px,31px) scale(.8);animation-duration:7s;animation-delay:-2s;opacity:.6}
.bl-w6-spark{position:absolute;width:var(--s);height:var(--s);left:var(--x);top:var(--y);background:#fff;clip-path:polygon(50% 0,59% 41%,100% 50%,59% 59%,50% 100%,41% 59%,0 50%,41% 41%);filter:drop-shadow(0 0 7px rgba(255,200,255,.95));animation:bl-w6-spark 3.6s ease-in-out var(--d) infinite;will-change:transform,opacity}

.bl-w6-hero{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;text-align:center;width:min(100%,390px)}
.bl-w6-bubblebtn{all:unset;box-sizing:border-box;display:block;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;border-radius:50%;animation:bl-w6-float 7s ease-in-out infinite alternate;will-change:transform}
.bl-w6-bubblebtn:focus-visible{outline:3px solid #fff;outline-offset:6px}
.bl-w6-bubblebtn.is-squish{animation:bl-w6-spring .9s cubic-bezier(.2,1,.3,1) both,bl-w6-float 7s ease-in-out .9s infinite alternate}
.bl-w6-bubble{--bs:min(62vw,min(34vh,270px));position:relative;display:grid;place-items:center;width:var(--bs);height:var(--bs);border-radius:50%;
  background:
    radial-gradient(circle at 50% 58%,rgba(20,90,255,.85) 0,rgba(60,60,230,.7) 36%,rgba(140,70,235,.42) 64%,rgba(255,130,220,.34) 84%,rgba(255,255,255,.08) 100%);
  box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.6),inset 0 0 44px rgba(255,255,255,.16),inset -18px -24px 54px rgba(255,120,220,.38),inset 16px 18px 44px rgba(120,225,255,.3),0 22px 70px rgba(150,80,255,.55),0 0 90px rgba(90,120,255,.35)}
.bl-w6-bubble::before{content:"";position:absolute;inset:0;border-radius:50%;pointer-events:none;
  background:conic-gradient(from 10deg,#5ee0ff,#5a7bff,#b36bff,#ff7ad6,#ffb86b,#ffe27a,#7be3ff,#5ee0ff);
  -webkit-mask-image:radial-gradient(closest-side,transparent 90%,#000 94%,#000 98.5%,transparent 100%);mask-image:radial-gradient(closest-side,transparent 90%,#000 94%,#000 98.5%,transparent 100%);opacity:.9}
.bl-w6-bubble::after{content:"";position:absolute;top:9%;left:14%;width:34%;height:17%;border-radius:50%;transform:rotate(-32deg);pointer-events:none;background:linear-gradient(180deg,rgba(255,255,255,.95),rgba(255,255,255,.12))}
.bl-w6-word{display:block;width:60%;height:auto;overflow:visible;filter:drop-shadow(0 4px 14px rgba(20,10,120,.55))}
.bl-w6-orb{position:absolute;border-radius:50%;pointer-events:none;border:1.5px solid rgba(255,255,255,.55);
  background:radial-gradient(circle at 30% 26%,rgba(255,255,255,.85) 0 8%,rgba(255,255,255,.12) 24%,transparent 50%),conic-gradient(from 200deg,rgba(111,220,245,.3),rgba(205,165,255,.4),rgba(255,176,140,.3),rgba(111,220,245,.3));box-shadow:inset 0 0 10px rgba(255,255,255,.25),0 8px 22px rgba(90,60,230,.35)}
.bl-w6-orb.o1{width:26%;height:26%;right:-9%;top:-4%}
.bl-w6-orb.o2{width:13%;height:13%;right:-14%;top:30%}
.bl-w6-orb.o3{width:24%;height:24%;left:-10%;bottom:-3%}

.bl-w6-title{margin:6px 0 0;font-size:clamp(22px,6.2vw,27px);line-height:1.2;font-weight:800;letter-spacing:-.02em;max-width:17ch;text-shadow:0 2px 16px rgba(10,6,60,.5)}
.bl-w6-title span{display:block;background:linear-gradient(90deg,#ff9be0,#d9a6ff);-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent}
.bl-w6-sub{margin:0;font-size:clamp(13.5px,3.7vw,15px);line-height:1.5;color:rgba(235,228,255,.86);max-width:31ch}

/* pannello di vetro scuro, come le schede dell'app */
.bl-w6-panel{width:min(100%,390px);display:flex;flex-direction:column;gap:10px;padding:14px;border-radius:28px;
  background:linear-gradient(160deg,rgba(70,56,160,.5),rgba(28,20,86,.62));border:1px solid rgba(200,186,255,.32);
  box-shadow:0 18px 50px rgba(6,3,40,.55),inset 0 1px 0 rgba(255,255,255,.28);-webkit-backdrop-filter:blur(22px) saturate(1.4);backdrop-filter:blur(22px) saturate(1.4);
  animation:bl-w6-in .8s cubic-bezier(.22,1.2,.36,1) .1s both}
.bl-w6 .bl-w6-btn.bl-w6-btn{all:unset;box-sizing:border-box;position:relative;display:flex;align-items:center;gap:12px;width:100%;min-height:58px;padding:0 16px;border-radius:20px;color:#fff;font:inherit;font-size:16.5px;font-weight:750;letter-spacing:-.01em;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent;
  transition:transform .28s cubic-bezier(.3,1.6,.5,1),box-shadow .2s ease,background .2s ease}
.bl-w6 .bl-w6-btn.bl-w6-btn:active{transform:scale(.97)}
.bl-w6 .bl-w6-btn.bl-w6-btn:focus-visible{outline:3px solid #cdbfff;outline-offset:2px}
.bl-w6-btn>span.t{flex:1;min-width:0}
.bl-w6-btn>svg{flex:none}
.bl-w6-btn .go{opacity:.7}
/* crea: lavanda → rosa (come «Pubblica la tua bolla») */
.bl-w6 .bl-w6-btn.bl-w6-btn--create{min-height:64px;font-size:17.5px;background:linear-gradient(95deg,#8f7dec,#c78fe6 55%,#f0a3cf);box-shadow:inset 0 1.5px 0 rgba(255,255,255,.55),0 10px 28px rgba(190,110,230,.45)}
/* Google: bianco */
.bl-w6 .bl-w6-btn.bl-w6-btn--google{background:#fff;color:#1b1d2e;box-shadow:0 8px 22px rgba(10,6,50,.35)}
/* accedi: vetro con contorno teal (come «Aggiungi membro») */
.bl-w6 .bl-w6-btn.bl-w6-btn--login{background:rgba(74,215,209,.12);border:1.5px solid rgba(74,215,209,.7);color:#bff5f1;box-shadow:inset 0 1px 0 rgba(255,255,255,.18)}
/* esplora: vetro con contorno ambra (come il badge Amministratore) */
.bl-w6 .bl-w6-btn.bl-w6-btn--explore{background:rgba(255,196,107,.12);border:1.5px solid rgba(255,196,107,.65);color:#ffe2b0;box-shadow:inset 0 1px 0 rgba(255,255,255,.16)}

@keyframes bl-w6-in{from{opacity:0;transform:translate3d(0,40px,0) scale(.95)}60%{opacity:1;transform:translate3d(0,-4px,0) scale(1.01)}to{opacity:1;transform:none}}
@keyframes bl-w6-float{from{transform:translate3d(0,6px,0) rotate(-.8deg)}to{transform:translate3d(0,-9px,0) rotate(.8deg)}}
@keyframes bl-w6-spring{0%{transform:scale(1)}18%{transform:scale(1.13,.87)}38%{transform:scale(.93,1.08)}58%{transform:scale(1.04,.98)}78%{transform:scale(.99,1.01)}100%{transform:scale(1)}}
@keyframes bl-w6-tw{from{opacity:.45}to{opacity:1}}
@keyframes bl-w6-spark{0%,100%{opacity:.25;transform:scale(.55) rotate(0)}50%{opacity:1;transform:scale(1) rotate(18deg)}}
@media(max-height:740px){.bl-w6{gap:10px;padding-top:calc(16px + env(safe-area-inset-top))}.bl-w6-sub{display:none}.bl-w6 .bl-w6-btn.bl-w6-btn{min-height:50px}.bl-w6 .bl-w6-btn.bl-w6-btn--create{min-height:56px}.bl-w6-panel{padding:11px;gap:8px}}
@media(prefers-reduced-motion:reduce){.bl-w6-stars i,.bl-w6-spark,.bl-w6-bubblebtn,.bl-w6-bubblebtn.is-squish,.bl-w6-panel{animation:none}.bl-w6 .bl-w6-btn.bl-w6-btn{transition:none}}
`;

const GoogleG = () => (
  <svg width="22" height="22" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"/><path fill="#FBBC05" d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>
);

export default function WelcomeScreen({ onExplore, onRegister, onLogin, onGoogle }) {
  const [squish, setSquish] = useState(0);
  return (
    <section className="bl-w6" aria-label="Benvenuto in Bolle">
      <style>{CSS}</style>
      <div className="bl-w6-stars" aria-hidden="true">
        <i /><i />
        <b className="bl-w6-spark" style={{ "--s": "16px", "--x": "12%", "--y": "16%", "--d": "0s" }} />
        <b className="bl-w6-spark" style={{ "--s": "11px", "--x": "86%", "--y": "9%", "--d": "-1.4s" }} />
        <b className="bl-w6-spark" style={{ "--s": "13px", "--x": "78%", "--y": "46%", "--d": "-2.4s" }} />
      </div>

      <header className="bl-w6-hero">
        <button type="button" key={squish} className={`bl-w6-bubblebtn ${squish ? "is-squish" : ""}`} aria-label="Bolle" onClick={() => setSquish((n) => n + 1)}>
          <span className="bl-w6-bubble">
            <svg className="bl-w6-word" style={{ width: "60%", height: "auto" }} viewBox="-6 -6 695.20 264.50" role="img" aria-label="Bolle" focusable="false">
              <path d={WORDMARK_PATH} fill="#fff" fillRule="evenodd" />
            </svg>
            <i className="bl-w6-orb o1" /><i className="bl-w6-orb o2" /><i className="bl-w6-orb o3" />
          </span>
        </button>
        <h1 className="bl-w6-title">Scopri ciò che c’è intorno a te.<span>Una bolla alla volta.</span></h1>
        <p className="bl-w6-sub">Il light social network per scoprire ciò che ti circonda. Senza follower. Senza pressione.</p>
      </header>

      <nav className="bl-w6-panel" aria-label="Come vuoi iniziare?">
        <button type="button" className="bl-w6-btn bl-w6-btn--create" onClick={onRegister}><Sparkles size={22} aria-hidden="true" /><span className="t">Crea il tuo account</span><ChevronRight className="go" size={20} aria-hidden="true" /></button>
        {/* Qui in futuro si aggiunge «Continua con Apple» sotto Google. */}
        <button type="button" className="bl-w6-btn bl-w6-btn--google" onClick={onGoogle}><GoogleG /><span className="t">Continua con Google</span><ChevronRight className="go" size={20} aria-hidden="true" /></button>
        <button type="button" className="bl-w6-btn bl-w6-btn--login" onClick={onLogin}><LogIn size={21} aria-hidden="true" /><span className="t">Accedi</span><ChevronRight className="go" size={20} aria-hidden="true" /></button>
        <button type="button" className="bl-w6-btn bl-w6-btn--explore" onClick={onExplore}><Compass size={21} aria-hidden="true" /><span className="t">Esplora senza registrarti</span><ChevronRight className="go" size={20} aria-hidden="true" /></button>
      </nav>

      <ReportProblemButton context="Schermata di benvenuto: problema segnalato dall'utente" className="bl-ob-report-float" />
    </section>
  );
}