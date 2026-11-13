import { useCallback, useEffect, useRef, useState } from "react";
import { Lightbulb, Share, ChevronLeft, ChevronRight, BookOpen, LayoutGrid } from "lucide-react";

/* Suggerimento provvisorio (finché Bolle non è sull'App Store):
   su iPhone, una lampadina luminosa nello sfondo del feed apre uno splash con i passaggi
   per aggiungere Bolle alla schermata Home.
   - Compare su iPhone/iPod, sempre: anche se l'app è già aperta dalla Home.
   - La lampadina resta sempre disponibile (discreta); «Ho aggiunto Bolle» e «Più tardi» chiudono soltanto lo splash.
   - Per provarlo da computer: aggiungi ?install=1 all'indirizzo. */

function isIPhone() {
  try {
    const ua = navigator.userAgent || "";
    return /iPhone|iPod/.test(ua);
  } catch { return false; }
}
function forced() {
  try { return /[?&]install=1\b/.test(window.location.search); } catch { return false; }
}

export function shouldOfferInstall() {
  if (forced()) return true;
  return isIPhone();
}

const STEPS = [
  { n: 1, body: <>Tocca <Share size={16} strokeWidth={2.2} className="bl-ih-inline" aria-hidden="true" /> <b>Condividi</b>, nella barra di Safari</> },
  { n: 2, body: <>Scegli <b>“Aggiungi alla schermata Home”</b></> },
  { n: 3, body: <>Tocca <b>“Aggiungi”</b> in alto a destra</> },
];

export default function InstallHint({ hidden = false }) {
  const [offer, setOffer] = useState(false);
  const [open, setOpen] = useState(false);
  const confirmRef = useRef(null);
  const bulbRef = useRef(null);

  useEffect(() => { setOffer(shouldOfferInstall()); }, []);

  const close = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => bulbRef.current?.focus?.());
  }, []);
  const confirm = useCallback(() => { close(); }, [close]);

  useEffect(() => {
    if (!open) return undefined;
    confirmRef.current?.focus?.();
    const onKey = (e) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  // Apre il foglio di condivisione del telefono (su iPhone contiene «Aggiungi alla schermata Home»).
  const openShare = useCallback(async () => {
    const url = window.location.href.replace(/([?&])install=1&?/, "$1").replace(/[?&]$/, "");
    try {
      if (navigator.share) await navigator.share({ title: "Bolle", url });
    } catch { /* annullato dall'utente o non disponibile */ }
  }, []);

  if (!offer) return null;

  return (
    <>
      {!hidden && (
        <button ref={bulbRef} type="button" className="bl-ih-bulb" onClick={() => setOpen(true)}
          aria-haspopup="dialog" aria-label="Suggerimento: tieni Bolle sulla Home del telefono">
          <span className="bl-ih-rays" aria-hidden="true" />
          <span className="bl-ih-glow" aria-hidden="true" />
          <span className="bl-ih-icon" aria-hidden="true"><Lightbulb size={26} strokeWidth={2} /></span>
        </button>
      )}

      {open && (
        <div className="bl-ih-splash" role="dialog" aria-modal="true" aria-labelledby="bl-ih-title">
          <button type="button" className="bl-ih-skip" onClick={close}>Salta</button>
          <div className="bl-ih-body">
            <h2 id="bl-ih-title">Tieni Bolle sulla Home</h2>
            <p className="bl-ih-lead">Si apre con un tocco, come un’app vera, e potrai ricevere le notifiche.</p>
            <ol className="bl-ih-steps">
              {STEPS.map((s) => (
                <li key={s.n}><span className="bl-ih-num" aria-hidden="true">{s.n}</span><span>{s.body}</span></li>
              ))}
            </ol>
            <div className="bl-ih-bar">
              <span aria-hidden="true"><ChevronLeft size={22} /></span>
              <span aria-hidden="true"><ChevronRight size={22} /></span>
              <button type="button" className="on" onClick={openShare} aria-label="Apri il menu Condividi"><Share size={22} /></button>
              <span aria-hidden="true"><BookOpen size={22} /></span>
              <span aria-hidden="true"><LayoutGrid size={22} /></span>
            </div>
          </div>
          <div className="bl-ih-actions">
            <button ref={confirmRef} type="button" className="bl-ih-confirm" onClick={confirm}>Ho aggiunto Bolle</button>
            <button type="button" className="bl-ih-later" onClick={close}>Più tardi</button>
          </div>
        </div>
      )}
    </>
  );
}