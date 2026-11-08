/** Bolle Magnetic Discovery Algorithm v4 (adaptive ranking).
 * Ranking only: never changes server eligibility, pop credits or access control.
 * Stores aggregated author affinity per anonymous account on this device;
 * never stores bubble text, answers, votes, coordinates or media.
 */
const PREFIX = 'bolle-bmda-v2:';
const MAX_AUTHORS = 80;
const DAY = 86400000;
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const authorOf = (b) => String(b?.username || b?.author_username || '').trim().toLowerCase();
const storageKey = (userId) => userId ? `${PREFIX}${userId}` : null;

export function readDiscoverySignals(userId) {
  const key = storageKey(userId);
  if (!key) return {};
  try {
    const value = JSON.parse(globalThis.localStorage?.getItem(key) || '{}');
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch { return {}; }
}

export function recordDiscoverySignal(userId, author, action, now = Date.now()) {
  const key = storageKey(userId);
  const name = String(author || '').trim().toLowerCase();
  const weights = { pop: 1, react: 3, answer: 4, vote: 2 };
  if (!key || !name || !Object.hasOwn(weights, action)) return false;
  try {
    const signals = readDiscoverySignals(userId);
    const old = signals[name] || {};
    // Decay previous affinity before adding a new interaction.
    const age = Number.isFinite(old.at) ? Math.max(0, now - old.at) : 0;
    const previous = clamp(Number(old.score) || 0, 0, 40) * Math.exp(-age / (30 * DAY));
    signals[name] = { score: clamp(previous + weights[action], 0, 40), at: now };
    const recent = Object.entries(signals)
      .filter(([, s]) => s && Number.isFinite(s.at) && Number.isFinite(s.score))
      .sort((a, b) => b[1].at - a[1].at)
      .slice(0, MAX_AUTHORS);
    globalThis.localStorage?.setItem(key, JSON.stringify(Object.fromEntries(recent)));
    return true;
  } catch { return false; }
}

export function discoveryEnabled() {
  try { return globalThis.localStorage?.getItem('bolle-bmda-disabled') !== 'yes'; }
  catch { return true; }
}

function stable(value) {
  let hash = 2166136261;
  for (const char of String(value)) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return (hash >>> 0) / 4294967295;
}

export function rankDiscoveryBubbles(bubbles, { favorites = new Set(), signals = {}, now = Date.now(), scope = 'global', seed = '' } = {}) {
  if (!Array.isArray(bubbles)) return [];
  if (bubbles.length < 2) return bubbles.slice();
  const day = Math.floor(now / DAY);
  const favoriteSet = new Set(Array.from(favorites, x => String(x).toLowerCase()));
  const scored = bubbles.map((bubble, index) => {
    const author = authorOf(bubble);
    const timestamp = Date.parse(bubble.created_at);
    const age = Number.isFinite(timestamp) ? Math.max(0, now - timestamp) : Infinity;
    const freshness = Math.exp(-age / (72 * 3600000));
    const km = Number(bubble.distance_km);
    const hasDistance = scope === 'nearby' && bubble.distance_km != null && Number.isFinite(km) && km >= 0;
    const proximity = hasDistance ? Math.exp(-km / 12) : 0;
    const signal = signals[author];
    const signalAge = Number.isFinite(signal?.at) ? Math.max(0, now - signal.at) : Infinity;
    const affinity = clamp((Number(signal?.score) || 0) / 15, 0, 1) * Math.exp(-signalAge / (30 * DAY));
    const favorite = favoriteSet.has(author) ? 1 : 0;
    const exploration = stable(`${seed}:${bubble.id}:${day}`);
    // Cold-start discovery: a small boost for authors without interaction history.
    // Keeps exploration open without collecting additional user information.
    const unseen = !signal && !favorite ? 1 : 0;
    const novelty = unseen * (0.5 + 0.5 * exploration);
    // Strong preferences gradually trade some affinity weight for exploration.
    const preferenceStrength = clamp((Number(signal?.score) || 0) / 30, 0, 1);
    const explorationWeight = .15 + .04 * preferenceStrength;
    // Reallocate the geographic weight when location is unavailable or not requested.
    const score = hasDistance
      ? .28 * freshness + .25 * proximity + (.18 - .04 * preferenceStrength) * affinity + .12 * favorite + explorationWeight * exploration + .02 * novelty
      : .41 * freshness + (.25 - .04 * preferenceStrength) * affinity + .17 * favorite + explorationWeight * exploration + .02 * novelty;
    return { bubble, index, score, author };
  }).sort((a, b) => b.score - a.score || a.index - b.index);

  // Prevent an author from dominating the top of the feed; preserve every bubble.
  const remaining = scored.slice();
  const output = [];
  while (remaining.length) {
    const recent = new Set(output.slice(-2).map(item => item.author).filter(Boolean));
    let pick = remaining.findIndex(item => !item.author || !recent.has(item.author));
    if (pick < 0) pick = 0;
    output.push(remaining.splice(pick, 1)[0]);
  }
  return output.map(item => item.bubble);
}
