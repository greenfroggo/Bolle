import React, { useState } from "react";
import { VenetianMask, Bell, Volume2 } from "lucide-react";
import { soundOn, setSoundOn, playPop, BOLLE_THEMES } from "../../lib/bolleCore.jsx";
import { useGoogleAccount, GoogleAccountBadge } from "../../hooks/useGoogleAccount.js";
import { ecoForced, applyEco } from "../../lib/ecoMode.js";
import { NOTIFICATION_CATEGORIES } from "../notifications/notificationTypes.js";
import DeleteAccountSection from "./DeleteAccountSection.jsx";

export default function SettingsView({
  me,
  onLogout,
  onDeleteAccount,
  onOpenLogin,
  onGoogleLink,
  appearance,
  onAppearanceChange,
  activeTheme,
  themeChoice,
  onThemeChoiceChange,
  notificationPrefs,
  onNotificationPrefChange,
  privacyPrefs,
  onPrivacyPrefChange,
  blockedUsers,
  onUnblockUser,
}) {
  const [snd, setSnd] = useState(soundOn);
  const [eco, setEco] = useState(ecoForced);
  const googleAccount = useGoogleAccount();

  return (
    <div className="bl-insights">
      <section className="bl-insights-section bl-theme-controls">
        <div className="bl-insights-heading"><h3>🌌 Aspetto della galassia</h3></div>
        <p className="bl-muted">Scegli la luminosità e l’atmosfera delle tue bolle.</p>
        <div className="bl-segment bl-theme-options" role="group" aria-label="Modalità colore">
          {[["light", "☀️ Chiaro"], ["dark", "🌙 Dark"], ["auto", "📱 Automatico"]].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={appearance === value ? "on" : ""}
              aria-pressed={appearance === value}
              onClick={() => onAppearanceChange(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="bl-segment bl-theme-options" role="group" aria-label="Tema speciale attivo">
          <button
            type="button"
            className={themeChoice === "special" ? "on" : ""}
            aria-pressed={themeChoice === "special"}
            onClick={() => onThemeChoiceChange("special")}
          >
            {BOLLE_THEMES.find(t => t.id === activeTheme)?.label || "🫧 Bolle"}
          </button>
        </div>
      </section>

      <section className="bl-insights-section">
        <div className="bl-insights-heading"><h3><VenetianMask size={21} aria-hidden="true" /> Identità anonima</h3></div>
        <div className="bl-account-ready">
          <strong>@{me?.username || "…"}</strong>
          <p>Generato automaticamente e non modificabile. È l’unico nome che gli altri possono vedere.</p>
        </div>
      </section>

      <section className="bl-insights-section">
        <div className="bl-insights-heading">
          <h3>🚫 Utenti bloccati</h3>
          <small>{blockedUsers?.size || 0} bloccati</small>
        </div>
        <p className="bl-muted">Gli utenti bloccati non compaiono nel tuo feed di bolle.</p>
        {!blockedUsers || blockedUsers.size === 0 ? (
          <p className="bl-muted">Nessun utente bloccato.</p>
        ) : (
          <ul className="bl-blocked-users-list">
            {[...blockedUsers].map(username => (
              <li key={username}>
                <strong>@{username}</strong>
                <button
                  type="button"
                  className="bl-unblock-btn"
                  onClick={() => onUnblockUser?.(username)}
                >
                  Sblocca
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {me?.registered && (
        <section className="bl-insights-section bl-notification-settings">
          <div className="bl-insights-heading"><h3>🔒 Privacy e visibilità</h3></div>
          <p className="bl-muted">Scegli cosa mostrare agli altri utenti. Le modifiche vengono salvate nel tuo profilo.</p>
          {[["show_username", "Mostra il mio username"], ["show_nationality", "Mostra la mia nazionalità"], ["allow_favorites", "Consenti di aggiungermi ai preferiti"]].map(([key, label]) => (
            <label className="bl-notification-toggle" key={key}>
              <span>{label}</span>
              <input
                type="checkbox"
                checked={privacyPrefs?.[key] !== false}
                onChange={e => onPrivacyPrefChange?.(key, e.target.checked)}
              />
            </label>
          ))}
        </section>
      )}

      <section className="bl-insights-section bl-notification-settings">
        <div className="bl-insights-heading"><h3><Bell size={21} aria-hidden="true" /> Notifiche</h3></div>
        <p className="bl-muted">Scegli quali notifiche vedere nell’app. Sono tutte attive per impostazione predefinita.</p>
        {NOTIFICATION_CATEGORIES.map(category => (
          <label className="bl-notification-toggle" key={category.key}>
            <span>{category.label}</span>
            <input
              type="checkbox"
              checked={notificationPrefs?.[category.key] !== false}
              onChange={e => onNotificationPrefChange?.(category.key, e.target.checked)}
            />
          </label>
        ))}
        <p className="bl-muted">Le preferenze sono salvate su questo dispositivo. Non modificano le notifiche push del sistema.</p>
      </section>

      {me?.registered && (
        <section className="bl-insights-section">
          <div className="bl-insights-heading"><h3>Accesso con Google</h3></div>
          {googleAccount ? <GoogleAccountBadge /> : (
            <>
              <p className="bl-muted">Collega Google al tuo account attuale senza perdere bolle, preferiti e statistiche.</p>
              <button type="button" className="bl-google-button" onClick={onGoogleLink}>
                Collega Google a questo profilo
              </button>
            </>
          )}
        </section>
      )}

      {me?.registered && (
        <section className="bl-insights-section">
          <button type="button" className="bl-ghost" onClick={onLogout}>Esci dal profilo</button>
        </section>
      )}

      {!me?.registered && (
        <section className="bl-insights-section">
          <button type="button" className="bl-link" onClick={onOpenLogin}>Ho già un profilo: accedi</button>
        </section>
      )}

      <section className="bl-insights-section">
        <div className="bl-insights-heading"><h3><Volume2 size={21} aria-hidden="true" /> Effetti sonori</h3></div>
        <div className="bl-segment" role="group" aria-label="Effetti sonori">
          <button className={snd ? "on" : ""} aria-pressed={snd} onClick={() => { setSoundOn(true); setSnd(true); playPop(); }}>Attivi</button>
          <button className={!snd ? "on" : ""} aria-pressed={!snd} onClick={() => { setSoundOn(false); setSnd(false); }}>Disattivati</button>
        </div>
      </section>

      <section className="bl-insights-section">
        <div className="bl-insights-heading"><h3>🔋 Risparmio energia</h3></div>
        <p className="bl-muted">Riduce le animazioni decorative per far scaldare meno il telefono. In modalità automatica scatta da sola dopo 4 minuti d'uso.</p>
        <div className="bl-segment" role="group" aria-label="Risparmio energia">
          <button
            className={!eco ? "on" : ""}
            aria-pressed={!eco}
            onClick={() => {
              try { localStorage.setItem("bolle-eco", "off"); } catch { /* ignora */ }
              setEco(false);
            }}
          >
            Automatico
          </button>
          <button
            className={eco ? "on" : ""}
            aria-pressed={eco}
            onClick={() => {
              try { localStorage.setItem("bolle-eco", "on"); } catch { /* ignora */ }
              setEco(true);
              applyEco(true);
            }}
          >
            Sempre attivo
          </button>
        </div>
      </section>

      {me?.registered && onDeleteAccount && <DeleteAccountSection me={me} onDeleteAccount={onDeleteAccount} />}
    </div>
  );
}
