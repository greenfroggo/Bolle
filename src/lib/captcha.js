// src/lib/captcha.js
// Ottiene un token Cloudflare Turnstile da codice non-React (es. ensureSession).
// Ogni token è monouso: chiama getCaptchaToken() ogni volta che serve.

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;
let scriptPromise = null;

function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      s.async = true;
      s.onload = () => resolve(window.turnstile);
      s.onerror = () => { scriptPromise = null; reject(new Error("turnstile_script_blocked")); };
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
}

export async function getCaptchaToken(timeoutMs = 15000) {
  if (!SITE_KEY) return undefined; // captcha non configurato (es. sviluppo locale)
  const turnstile = await loadTurnstile();

  return new Promise((resolve, reject) => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    let widgetId;
    let timer;

    const finish = (fn, value) => {
      clearTimeout(timer);
      try { turnstile.remove(widgetId); } catch { /* già rimosso */ }
      el.remove();
      fn(value);
    };

    timer = setTimeout(() => finish(reject, new Error("turnstile_timeout")), timeoutMs);
    widgetId = turnstile.render(el, {
      sitekey: SITE_KEY,
      callback: (token) => finish(resolve, token),
      "error-callback": (code) => finish(reject, new Error("turnstile_error_" + code)),
    });
  });
}