import { supabase } from "./bolleCore.jsx";

/* ====================== Analytics (nessun dato personale) ====================== */
export function track(event, props = {}) {
  try {
    Promise.resolve(supabase.rpc("bolle_log_event", { p_event: event, p_props: props })).catch(() => {});
  } catch {
    /* mai bloccare l'app */
  }
}

export function trackError(where, err) {
  const msg = String(err?.message || err || "unknown").replace(/[^\s@]+@[^\s@]+/g, "[email]").slice(0, 80);
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
