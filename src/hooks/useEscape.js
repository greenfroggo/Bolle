import { useEffect } from "react";

export default function useEscape(fn) {
  useEffect(() => {
    if (!fn) return undefined;
    const onKey = (e) => e.key === "Escape" && fn();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fn]);
}
