/* Modalità eco: meno animazioni decorative e fisica più lenta. Si attiva da sola dopo qualche minuto d'uso. */
export function ecoForced() {
  try {
    return localStorage.getItem("bolle-eco") === "on";
  } catch {
    return false;
  }
}

export function applyEco(on) {
  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("bl-eco", on);
  }
}
