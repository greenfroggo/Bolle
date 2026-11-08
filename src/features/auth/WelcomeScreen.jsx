import React from "react";

/* Benvenuto al primo accesso: il profilo esistente usa username anonimo e PIN. */
export default function WelcomeScreen({ onExplore, onRegister, onLogin, onGoogle }) {
  return (
    <section className="bl-welcome" aria-label="Benvenuto in Bolle">
      <div className="bl-welcome-glow" aria-hidden="true" />
      <div className="bl-welcome-wordmark" aria-label="Bolle">
        <span>B</span>
        <span className="bl-wordmark-bubble" aria-hidden="true" />
        <span>lle</span>
      </div>
      <div className="bl-welcome-copy">
        <span className="bl-welcome-eyebrow">UN UNIVERSO DI PICCOLE SORPRESE</span>
        <p>Un piccolo pensiero può arrivare lontano.</p>
        <small>Scopri storie, emozioni e sorprese lasciate da persone come te.</small>
      </div>
      <div className="bl-welcome-actions">
        <button type="button" className="bl-welcome-primary" onClick={onExplore}>
          Esplora Bolle <span aria-hidden="true">→</span>
        </button>
        <button type="button" className="bl-welcome-secondary" onClick={onRegister}>
          Crea un account
        </button>
        <button type="button" className="bl-google-button" onClick={onGoogle}>
          Continua con Google
        </button>
        <button type="button" className="bl-welcome-link" onClick={onLogin}>
          Hai già un account? <strong>Accedi</strong>
        </button>
        <span className="bl-welcome-privacy">Puoi esplorare senza registrarti.</span>
      </div>
    </section>
  );
}
