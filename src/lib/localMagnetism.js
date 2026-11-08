/** Visual-only neighborhood density. Uses approximate distance already returned by feed.
 * Never requests location, stores coordinates or changes bubble eligibility.
 */
export function neighborhoodMagnetism(bubbles, { enabled = false, radiusKm = 8 } = {}) {
  if (!Array.isArray(bubbles)) return [];
  if (!enabled) return bubbles.map(() => 0);
  const distances = bubbles.map(b => {
    const n = Number(b?.distance_km);
    return b?.starter || b?.distance_km == null || !Number.isFinite(n) || n < 0 ? null : n;
  });
  return distances.map((distance, index) => {
    if (distance === null) return 0;
    let density = 0;
    for (let j = 0; j < distances.length; j++) {
      if (j === index || distances[j] === null) continue;
      const delta = Math.abs(distance - distances[j]);
      if (delta < radiusKm) density += (1 - delta / radiusKm);
    }
    // A bounded 0..1 visual influence. No inference of exact bubble-to-bubble distance.
    return Math.min(1, density / 5);
  });
}
