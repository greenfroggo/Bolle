/** Deterministic scatter layout: X=opens, Y=reactions. Collision relaxation
 * operates only on display coordinates; the original metrics are unchanged. */
export function layoutConstellation(entries, { width = 340, height = 250 } = {}) {
  const items = entries.slice(0, 24);
  const maxOpens = Math.max(1, ...items.map(e => Math.max(0, Number(e.opensCount) || 0)));
  const maxReactions = Math.max(1, ...items.map(e => Math.max(0, Number(e.reactionsCount) || 0)));
  const nodes = items.map((item, i) => {
    const opens = Math.max(0, Number(item.opensCount) || 0);
    const reactions = Math.max(0, Number(item.reactionsCount) || 0);
    const radius = 11 + Math.min(5, Math.sqrt(opens + reactions) * 0.55);
    return { item, i, radius, x: 22 + (width - 44) * (opens / maxOpens), y: height - 22 - (height - 44) * (reactions / maxReactions) };
  });
  // Relax overlaps while keeping nodes tethered to their real chart coordinates.
  const anchors = nodes.map(n => ({ x: n.x, y: n.y }));
  for (let step = 0; step < 110; step++) {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        let dx = b.x - a.x, dy = b.y - a.y;
        let distance = Math.hypot(dx, dy);
        const minimum = a.radius + b.radius + 3;
        if (distance >= minimum) continue;
        if (distance < 0.001) {
          const angle = (i * 2.399963 + j * 1.618034);
          dx = Math.cos(angle); dy = Math.sin(angle); distance = 1;
        }
        const move = (minimum - distance) * 0.51;
        a.x -= dx / distance * move; a.y -= dy / distance * move;
        b.x += dx / distance * move; b.y += dy / distance * move;
      }
    }
    nodes.forEach((n, i) => {
      n.x = Math.max(n.radius + 3, Math.min(width - n.radius - 3, n.x + (anchors[i].x - n.x) * 0.025));
      n.y = Math.max(n.radius + 3, Math.min(height - n.radius - 3, n.y + (anchors[i].y - n.y) * 0.025));
    });
  }
  return nodes.map(n => ({ ...n, left: `${100 * n.x / width}%`, top: `${100 * n.y / height}%`, size: n.radius * 2 }));
}
