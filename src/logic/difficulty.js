// Difficulty modes (pure data + rules, no Three.js). Picked on the start card and remembered on this
// device (src/difficulty.js). Normal is the game as tuned; Relax softens everything for a chill run;
// Hard pushes back and pays more for it (score, the end-of-run payout and contract rewards).
//
// monsterHp / monsterSpeed: regular monsters (on top of the wave ramp); bossHp: bosses (on top of
//   their own fight-by-fight scaling).
// damageTaken: every hit the player takes (applied after armour, so it stacks with it).
// waveSize / spawnInterval: how many monsters a wave holds and how fast they trickle in.
// waveHeal: the heal between waves. score: kill points and wave bonuses. reward: banked crystals
//   (run payout, contracts, mastery level-ups).
// Optional (default 1 / false): playerHp scales your max HP; monsterDamage scales how hard every monster and
//   boss hits on top of damageTaken; bossEnraged starts every boss already in its phase-two rage.
export const DIFFICULTIES = {
  relax: {
    id: 'relax', name: 'Relax', icon: '🌴',
    blurb: 'Soft monsters, small waves, gentle hits, big heals. Just vibes.',
    monsterHp: 0.65, monsterSpeed: 0.85, bossHp: 0.6, damageTaken: 0.45,
    waveSize: 0.7, spawnInterval: 1.4, waveHeal: 2, score: 0.6, reward: 0.6,
  },
  normal: {
    id: 'normal', name: 'Normal', icon: '🛎️',
    blurb: 'The resort as intended.',
    monsterHp: 1, monsterSpeed: 1, bossHp: 1, damageTaken: 1,
    waveSize: 1, spawnInterval: 1, waveHeal: 1, score: 1, reward: 1,
  },
  hard: {
    id: 'hard', name: 'Hard', icon: '🔥',
    blurb: 'Tougher, faster monsters in bigger waves, and hits hurt. 1.5x score, 1.6x rewards.',
    monsterHp: 1.4, monsterSpeed: 1.12, bossHp: 1.5, damageTaken: 1.5,
    waveSize: 1.35, spawnInterval: 0.8, waveHeal: 0.5, score: 1.5, reward: 1.6,
  },
  // Extremely, unbelievably hard. Half the health, monsters that are three times as tough and much faster,
  // waves twice the size arriving at a sprint, hits that nearly one-shot you, no heal between waves, and
  // every boss shows up already enraged. Pays like it.
  benji: {
    id: 'benji', name: 'Benji Mode', icon: '💀',
    blurb: 'Unbelievably hard. Half HP, 3x tough monsters, double waves, brutal hits, no heals, bosses arrive enraged. 4x score, 5x rewards.',
    monsterHp: 3, monsterSpeed: 1.35, bossHp: 3.5, damageTaken: 3,
    waveSize: 2.2, spawnInterval: 0.45, waveHeal: 0, score: 4, reward: 5,
    playerHp: 0.5, monsterDamage: 1.5, bossEnraged: true,
  },
}
export const DIFFICULTY_IDS = ['relax', 'normal', 'hard', 'benji']
export const DEFAULT_DIFFICULTY = 'normal'
export const difficultyById = (id) => DIFFICULTIES[id] ?? DIFFICULTIES[DEFAULT_DIFFICULTY]

// The end-of-run "checkout tip": banked crystals for how far the run got, so every run moves you
// forward even if you never pressed T. Scaled by the difficulty's reward.
export function runPayout({ wave = 1, score = 0, bosses = 0, difficulty = DEFAULT_DIFFICULTY } = {}) {
  const base = Math.max(0, wave - 1) * 4 + bosses * 25 + Math.floor(Math.max(0, score) / 500)
  return Math.round(base * difficultyById(difficulty).reward)
}
