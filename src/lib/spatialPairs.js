/**
 * Restituisce ogni coppia di cerchi potenzialmente a contatto una sola volta.
 * Celle grandi almeno quanto il diametro massimo + margine: basta cercare
 * la cella corrente e le 8 vicine. Non modifica le posizioni né le velocità.
 */
export function* nearbyPairs(circles, padding = 0) {
  if (circles.length < 2) return;
  const maxRadius = circles.reduce((m, b) => Math.max(m, b.r), 0);
  const cell = Math.max(1, maxRadius * 2 + padding);
  const grid = new Map();
  for (let i = 0; i < circles.length; i++) {
    const b = circles[i];
    const cx = Math.floor(b.x / cell);
    const cy = Math.floor(b.y / cell);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const bucket = grid.get(`${cx + dx},${cy + dy}`);
        if (bucket) for (const j of bucket) yield [j, i];
      }
    }
    const key = `${cx},${cy}`;
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key).push(i);
  }
}
