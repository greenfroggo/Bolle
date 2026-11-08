import test from 'node:test';
import assert from 'node:assert/strict';
import { applyMagneticAttraction } from '../src/lib/magneticForces.js';

test('nearby separated bubbles attract symmetrically', () => {
  const bodies = [{x:0,y:0,r:20,vx:0,vy:0},{x:70,y:0,r:20,vx:0,vy:0}];
  applyMagneticAttraction(bodies, .02);
  assert.ok(bodies[0].vx > 0);
  assert.ok(bodies[1].vx < 0);
  assert.ok(Math.abs(bodies[0].vx + bodies[1].vx) < 1e-10);
});
test('touching and faraway bubbles are not attracted', () => {
  for (const x of [42, 150]) {
    const bodies = [{x:0,y:0,r:20,vx:0,vy:0},{x,y:0,r:20,vx:0,vy:0}];
    applyMagneticAttraction(bodies, .02);
    assert.equal(bodies[0].vx, 0);
  }
});
test('acceleration is capped for dense clusters', () => {
  const bodies = Array.from({length:20},(_,i)=>({x:i*3,y:0,r:10,vx:0,vy:0}));
  applyMagneticAttraction(bodies, .03);
  assert.ok(bodies.every(b=>Math.abs(b.vx)<=34*.03+1e-9));
});
