import test from 'node:test';
import assert from 'node:assert/strict';
import { layoutConstellation } from '../src/lib/constellationLayout.js';
test('positions reflect opens on X and reactions on Y', () => {
  const [a,b] = layoutConstellation([{opensCount:1,reactionsCount:1},{opensCount:20,reactionsCount:30}]);
  assert.ok(parseFloat(a.left)<parseFloat(b.left));
  assert.ok(parseFloat(a.top)>parseFloat(b.top));
});
test('stable and bounded for identical metrics', () => {
  const data=Array.from({length:15},(_,i)=>({bubble_id:i,opensCount:5,reactionsCount:5}));
  const a=layoutConstellation(data);assert.deepEqual(a,layoutConstellation(data));
  for(const n of a){assert.ok(parseFloat(n.left)>0&&parseFloat(n.left)<100);assert.ok(parseFloat(n.top)>0&&parseFloat(n.top)<100)}
});
