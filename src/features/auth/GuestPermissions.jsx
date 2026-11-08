import React from "react";

/* Permessi account ospite vs utente registrato */
export default function GuestPermissions() {
  return (
    <div className="bl-perms">
      <div>
        <strong>Da ospite puoi</strong>
        <ul>
          <li>Esplorare il campo di bolle</li>
          <li>Scoppiare le bolle-sorpresa</li>
          <li>Vedere le bolle degli altri (senza aprirle)</li>
        </ul>
      </div>
      <div>
        <strong>Con un account puoi</strong>
        <ul>
          <li>Scoppiare le bolle degli utenti</li>
          <li>Pubblicare, reagire e segnalare</li>
          <li>Regalare bolle, statistiche e classifiche</li>
        </ul>
      </div>
    </div>
  );
}
