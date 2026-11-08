import test from 'node:test';
import assert from 'node:assert/strict';
import { nearbyPairs } from '../src/lib/spatialPairs.js';

test('non perde coppie in collisione, anche con raggi differenti', () => {
  for (let seed = 1; seed <= 30; seed++) {
    let x = seed;
    const rnd = () => ((x = (x * 16807) % 2147483647) / 2147483647);
    const balls = Array.from({ length: 120 }, () => ({x: rnd() * 800, y: rnd() * 900, r: 5 + rnd() * 35}));
    const pairs = [...nearbyPairs(balls, 3)];
    const found = new Set(pairs.map(([i,j]) => `${i}:${j}`));
    assert.equal(found.size, pairs.length, 'coppie duplicate');
    for (let i = 0; i < balls.length; i++) for (let j = i+1; j < balls.length; j++) {
      const a = balls[i], b = balls[j];
      if (Math.hypot(a.x-b.x, a.y-b.y) < a.r+b.r+3) {
        assert.ok(found.has(`${i}:${j}`), `collisione persa ${i},${j}`);
      }
    }
  }
});
