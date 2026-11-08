import { nearbyPairs } from './spatialPairs.js';

/** Apply gentle short-range attraction; collision separation remains the caller's job. */
export function applyMagneticAttraction(bodies, dt, options = {}) {
  const { reach = 48, strength = 20, maxAcceleration = 34, gap = 3 } = options;
  if (!(dt > 0) || !Number.isFinite(dt) || bodies.length < 2) return;
  // A larger spatial hash radius includes nearby (but non-touching) circles.
  const accelerations = bodies.map(() => ({ x: 0, y: 0 }));
  for (const [i, j] of nearbyPairs(bodies, reach + gap)) {
    const a = bodies[i], b = bodies[j];
    const dx = b.x - a.x, dy = b.y - a.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 0.001) continue;
    const surfaceGap = distance - a.r - b.r;
    if (surfaceGap <= gap || surfaceGap >= reach) continue;
    // Smooth at both ends: no sudden snap when entering the magnetic field.
    const t = (surfaceGap - gap) / (reach - gap);
    const envelope = Math.sin(Math.PI * t) ** 2;
    const force = strength * envelope;
    const nx = dx / distance, ny = dy / distance;
    accelerations[i].x += nx * force;
    accelerations[i].y += ny * force;
    accelerations[j].x -= nx * force;
    accelerations[j].y -= ny * force;
  }
  for (let i = 0; i < bodies.length; i++) {
    const a = accelerations[i];
    const magnitude = Math.hypot(a.x, a.y);
    const factor = magnitude > maxAcceleration ? maxAcceleration / magnitude : 1;
    bodies[i].vx += a.x * factor * dt;
    bodies[i].vy += a.y * factor * dt;
  }
}
