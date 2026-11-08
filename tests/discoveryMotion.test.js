import test from 'node:test';
import assert from 'node:assert/strict';
import { magneticPriority, applyDiscoveryDrift } from '../src/lib/discoveryMotion.js';
test('priority favors the first results and excludes disabled or starter items', () => {
  assert.ok(magneticPriority(0, 30) > magneticPriority(4, 30));
  assert.equal(magneticPriority(20, 30), 0);
  assert.equal(magneticPriority(0, 30, false), 0);
});
test('visual drift is gentle, bounded, and ignores non-featured bubbles', () => {
  const bodies = [{ x: 10, y: 600, vx: 0, vy: 0, priority: 1 }, { x: 20, y: 400, vx: 0, vy: 0, priority: 0 }];
  applyDiscoveryDrift(bodies, .035, 400, 900);
  assert.ok(bodies[0].vx > 0 && bodies[0].vx < 1);
  assert.ok(bodies[0].vy < 0 && bodies[0].vy > -1);
  assert.equal(bodies[1].vx, 0);
  assert.equal(bodies[1].vy, 0);
});
