import React from "react";

/* Hub informativo su privacy, regole e filosofia di Bolle. */
export default function LegalInfoView() {
  return (
    <div className="bl-insights bl-legal">
      <section className="bl-insights-section bl-legal-intro">
        <h3>🫧 Un piccolo spazio per grandi emozioni</h3>
        <p>Bolle nasce per condividere momenti senza trasformare ogni gesto in una gara di popolarità. Una bolla custodisce una sorpresa; chi la scopre può reagire, senza bisogno di esporre la propria identità reale.</p>
        <p>La curiosità viene prima dei numeri. Il rispetto delle persone viene prima di tutto.</p>
      </section>
      <p className="bl-legal-warning" role="note">
        <strong>Documenti in preparazione.</strong> Le sezioni seguenti descrivono le funzionalità osservabili dell’app, ma non costituiscono ancora l’informativa privacy o i termini legali definitivi. Prima della pubblicazione occorre completarli con i dati del titolare, le basi giuridiche, i tempi di conservazione e i fornitori effettivi, e sottoporli a revisione.
      </p>
      <details className="bl-legal-detail">
        <summary>🔐 Privacy e dati personali</summary>
        <div>
          <p><strong>Identità.</strong> Bolle utilizza uno username generato automaticamente. Uno pseudonimo non rende necessariamente anonimi i dati trattati dal servizio.</p>
          <p><strong>Dati utilizzati.</strong> Per le funzioni dell’app possono essere trattati identificativi dell’account, contenuti caricati, aperture, reazioni, preferenze e dati tecnici necessari al funzionamento e alla sicurezza. Se scegli funzioni geografiche, può essere utilizzata la posizione.</p>
          <p><strong>Visibilità.</strong> Le bolle e gli avatar che pubblichi possono essere visualizzati da altri utenti secondo le funzioni dell’app. Evita di inserire informazioni personali o immagini di terzi senza autorizzazione.</p>
          <p><strong>I tuoi diritti.</strong> L’app prevede funzioni di gestione dei dati personali; per informazioni su accesso, rettifica, esportazione e cancellazione serviranno anche i recapiti ufficiali del titolare.</p>
          <p><strong>Da completare prima del rilascio:</strong> titolare e contatto privacy, finalità e basi giuridiche, destinatari e fornitori, trasferimenti extra-SEE, conservazione, diritti e reclamo, eventuali permessi e tecnologie di tracciamento.</p>
        </div>
      </details>
      <details className="bl-legal-detail">
        <summary>📜 Regole e condizioni d’uso</summary>
        <div>
          <p><strong>Rispetta gli altri.</strong> Non pubblicare minacce, molestie, contenuti illegali, dati privati altrui o materiali di cui non possiedi i diritti necessari.</p>
          <p><strong>Responsabilità dei contenuti.</strong> Pubblica soltanto foto, video e testi che puoi condividere. Non usare Bolle per impersonare altre persone.</p>
          <p><strong>Funzioni social.</strong> Scoppi, reazioni e classifiche sono elementi ludici; non costituiscono premi economici né garanzie di visibilità.</p>
          <p><strong>Disponibilità.</strong> Il servizio può cambiare durante lo sviluppo. Regole su moderazione, segnalazioni, sospensioni, età minima, responsabilità e controversie devono essere definite prima della distribuzione pubblica.</p>
        </div>
      </details>
      <details className="bl-legal-detail">
        <summary>💜 La filosofia di Bolle</summary>
        <div>
          <p><strong>Scopri prima di giudicare.</strong> Ogni bolla è una piccola sorpresa.</p>
          <p><strong>Esprimi emozioni, non etichette.</strong> Le reazioni raccontano ciò che un contenuto ti fa provare.</p>
          <p><strong>Lascia spazio alla leggerezza.</strong> Le classifiche celebrano l’attività, non il valore delle persone.</p>
          <p><strong>Proteggi la fiducia.</strong> La curiosità funziona solo se tutti rispettano chi condivide.</p>
        </div>
      </details>
      <p className="bl-muted">Versione informativa preliminare · 29 ottobre 2026 · Non sostituisce la documentazione legale finale.</p>
    </div>
  );
}
