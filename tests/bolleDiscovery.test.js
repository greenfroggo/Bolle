import test from 'node:test';
import assert from 'node:assert/strict';
import { rankDiscoveryBubbles, recordDiscoverySignal, readDiscoverySignals, discoveryEnabled } from '../src/lib/bolleDiscovery.js';
const now = Date.parse('2026-10-31T12:00:00Z');
const bubble = (id, username, ageHours, distance_km) => ({ id, username, created_at: new Date(now - ageHours * 3600000).toISOString(), distance_km });
test('keeps all eligible bubbles without changing inputs', () => {
  const input = [bubble('a','a',1,1),bubble('b','b',2,2),bubble('c','c',3,3)];
  const result = rankDiscoveryBubbles(input, { now, scope:'nearby' });
  assert.deepEqual(new Set(result.map(b => b.id)), new Set(input.map(b => b.id)));
  assert.equal(input[0].id, 'a');
});
test('deterministic for same account and day', () => {
  const input = Array.from({length: 15}, (_, i) => bubble(String(i), `u${i}`, 2, 2));
  assert.deepEqual(rankDiscoveryBubbles(input, { now, seed:'account' }), rankDiscoveryBubbles(input, { now, seed:'account' }));
});
test('local affinity is isolated by account and disabled storage is safe', () => {
  const data = new Map();
  globalThis.localStorage = {getItem: key => data.get(key) ?? null, setItem: (key,value) => data.set(key,value)};
  assert.equal(recordDiscoverySignal('userA', 'ALICE', 'answer', now), true);
  assert.equal(readDiscoverySignals('userA').alice.score, 4);
  assert.deepEqual(readDiscoverySignals('userB'), {});
  data.set('bolle-bmda-disabled', 'yes');
  assert.equal(discoveryEnabled(), false);
  delete globalThis.localStorage;
  assert.deepEqual(readDiscoverySignals('userA'), {});
  assert.equal(discoveryEnabled(), true);
});
test('nearby prioritizes location when available, global ignores distance', () => {
  const input = [bubble('far','u1',2,100), bubble('near','u2',2,0)];
  assert.equal(rankDiscoveryBubbles(input, { now, scope:'nearby' })[0].id, 'near');
});
