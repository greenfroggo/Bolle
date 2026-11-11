import React from "react";

/* «Questo o quello?» — campi del composer, riorganizzati: descrizione → due opzioni affiancate.
   Componente controllato, da montare al posto dei campi attuali del tipo "choice".
   value: { description, a: { text }, b: { text } }
   renderMedia(side) (facoltativo): il tuo selettore foto per "a"/"b" (sondaggio tra due foto). */
export default function ChoiceComposerFields({ value, onChange, renderMedia, maxDescription = 200, maxOption = 40 }) {
  const v = value || { description: "", a: { text: "" }, b: { text: "" } };
  const patch = (p) => onChange({ ...v, ...p });
  const side = (k, label) => (
    <div className={`bl-ch-opt bl-ch-${k}`}>
      <span className="bl-ch-badge" aria-hidden="true">{k === "a" ? "A" : "B"}</span>
      {renderMedia?.(k)}
      <label className="bl-field-label">
        {label}
        <input type="text" maxLength={maxOption} value={v[k]?.text || ""} placeholder={k === "a" ? "es. Mare" : "es. Montagna"}
          onChange={(e) => patch({ [k]: { ...(v[k] || {}), text: e.target.value } })} />
      </label>
    </div>
  );
  return (
    <div className="bl-ch">
      <label className="bl-field-label">
        Descrizione
        <textarea rows={3} maxLength={maxDescription} value={v.description || ""} placeholder="Racconta il dilemma: «Dove andresti in vacanza?»"
          onChange={(e) => patch({ description: e.target.value })} />
        <small className="bl-muted bl-ch-count">{(v.description || "").length}/{maxDescription}</small>
      </label>
      <div className="bl-ch-grid">
        {side("a", "Questo")}
        <span className="bl-ch-vs" aria-hidden="true">o</span>
        {side("b", "Quello")}
      </div>
    </div>
  );
}
