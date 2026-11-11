/* Stemma-bolla di vetro con l'icona che fluttua all'interno.
   Livelli (dal fondo): vetro → parete interna → ombra dell'icona sulla parete → icona → pellicola e riflessi.
   L'aria si percepisce perché l'icona è piccola (≈42% del diametro), si muove con un periodo diverso dall'orb
   e la sua ombra sulla parete si allarga/si schiarisce in opposizione al movimento (stessa durata e fase).
   Solo transform/opacity animati, nessun backdrop-filter: costo trascurabile anche con molte bolle in griglia. */

export const ORB_TINTS = ["229 138 53", "231 181 47", "155 123 232", "229 111 145", "54 169 160"];

export default function GlassOrb({ Icon, tint = ORB_TINTS[0], locked = false, size = 76, strokeWidth = 2.1, className = "", delay = 0 }) {
  return (
    <span
      className={`bl-orb ${locked ? "is-locked" : "is-earned"} ${className}`}
      style={{ "--orb": `${size}px`, "--tint": tint, "--d": `${-delay}s` }}
      aria-hidden="true"
    >
      <i className="bl-orb-glass" />
      <i className="bl-orb-wall" />
      <i className="bl-orb-shadow" />
      <span className="bl-orb-icon"><Icon size={Math.round(size * 0.42)} strokeWidth={strokeWidth} /></span>
      <i className="bl-orb-film" />
      <i className="bl-orb-glint" />
      <i className="bl-orb-arc" />
    </span>
  );
}
