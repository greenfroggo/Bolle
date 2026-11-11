import { supabase } from "./bolleCore.jsx";

/* ====================== Analytics (nessun dato personale) ====================== */
/* Mai coordinate, nomi, email o telefoni negli eventi: queste chiavi vengono scartate prima dell'invio. */
const FORBIDDEN_KEY = /^(lat|lng|lon|latitude|longitude|coords?|position|geo\w*|first_?name|last_?name|business\w*|email|phone|pin)$/i;
function safeProps(props) {
  const out = {};
  for (const [k, v] of Object.entries(props || {})) if (!FORBIDDEN_KEY.test(k)) out[k] = v;
  return out;
}

export function track(event, props = {}) {
  try {
    Promise.resolve(supabase.rpc("bolle_log_event", { p_event: event, p_props: safeProps(props) })).catch(() => {});
  } catch {
    /* mai bloccare l'app */
  }
}

export function trackError(where, err) {
  const msg = String(err?.message || err || "unknown").replace(/[^\s@]+@[^\s@]+/g, "[email]").replace(/-?\d{1,3}\.\d{4,}/g, "[num]").slice(0, 80);
  track("error", { where, code: msg });
}

export function trackPerf(metric, ms) {
  track("perf", { metric, ms: Math.max(0, Math.round(ms)) });
}

export function installGlobalErrorTracking() {
  let sent = 0;
  // Errori innocui (es. ResizeObserver alla rotazione dello schermo, risorse non caricate, rete momentanea) non meritano una segnalazione.
  const isBenign = (e) => {
    const msg = String(e?.reason?.message || e?.reason || e?.message || "");
    if (/ResizeObserver/i.test(msg)) return true;
    if (e?.type === "error" && !e.error) return true; // "Script error." / errori senza eccezione reale
    if (!msg.trim()) return true;
    return /AbortError|Load failed|Failed to fetch|NetworkError|cancell?ed|aborted/i.test(msg);
  };
  const onErr = (e) => {
    if (isBenign(e)) return;
    if (sent < 5) {
      sent += 1;
      trackError("window", e.reason || e.message);
      window.dispatchEvent(new CustomEvent("bolle:reportable-error", {
        detail: { message: String(e.reason?.message || e.message || "Errore imprevisto") }
      }));
    }
  };
  window.addEventListener("error", onErr);
  window.addEventListener("unhandledrejection", onErr);
  return () => {
    window.removeEventListener("error", onErr);
    window.removeEventListener("unhandledrejection", onErr);
  };
}