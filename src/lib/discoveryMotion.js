/** Visual priority only: does not change feed eligibility or pop limits. */
export function magneticPriority(index, total, enabled = true) {
  if (!enabled || !Number.isInteger(index) || index < 0 || total < 2) return 0;
  const featured = Math.min(8, Math.max(2, Math.ceil(total * 0.22)));
  return index < featured ? (featured - index) / featured : 0;
}

/** A bounded, gentle pull towards the discoverable upper-center of the field. */
export function applyDiscoveryDrift(bodies, dt, width, height, { strength = 11 } = {}) {
  if (!(dt > 0) || !Number.isFinite(dt) || width <= 0 || height <= 0) return;
  const centerX = width / 2;
  const targetY = Math.min(height * .32, 320);
  for (const b of bodies) {
    if (!b.priority || b.dragging) continue;
    const dx = centerX - b.x;
    const dy = targetY - b.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 10) continue;
    const force = Math.min(strength * b.priority, strength) * dt;
    b.vx += dx / distance * force;
    b.vy += dy / distance * force;
  }
}
