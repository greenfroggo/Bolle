import test from 'node:test';
import assert from 'node:assert/strict';
import { neighborhoodMagnetism } from '../src/lib/localMagnetism.js';

test('no effect outside nearby mode', () => {
  assert.deepEqual(neighborhoodMagnetism([{distance_km:1},{distance_km:2}]), [0,0]);
});
test('nearby clusters have a bounded gentle influence', () => {
  const values = neighborhoodMagnetism([{distance_km:1},{distance_km:2},{distance_km:3},{distance_km:80}], {enabled:true});
  assert.ok(values[0] > 0 && values[0] <= 1);
  assert.ok(values[1] > 0 && values[1] <= 1);
  assert.equal(values[3], 0);
});
test('missing distance and starter bubbles have no influence', () => {
  assert.deepEqual(neighborhoodMagnetism([{starter:true,distance_km:1},{distance_km:null},{distance_km:1}],{enabled:true}),[0,0,0]);
});
