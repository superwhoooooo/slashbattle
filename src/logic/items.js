// Pure, Three-free item catalogs: the weapons (the hotbar), abilities
// (active, on cooldown) and pets (follow the player and help) that chests
// hand out. Stats only -- models and effects live on the Three side
// (characters.js, pets.js, and main.js's ability handling).

// `range`/`arc` shape the swing's hit zone (center-to-center, like the
// original sword); `swing` is the swing animation's length in seconds.
// `short` is the hotbar slot's label, too tight for the full name.
// The sword is the starting weapon and always sits in hotbar slot 1.
export const WEAPONS = {
  sword: { id: 'sword', name: 'Energy Sword', short: 'Sword', icon: '🗡️', damage: 20, range: 1.4, arc: Math.PI / 2, cooldown: 0.4, swing: 0.25, knockback: 1.2, blurb: 'Balanced' },
  dagger: { id: 'dagger', name: 'Twin Dagger', short: 'Dagger', icon: '🔪', damage: 11, range: 1.1, arc: Math.PI / 2, cooldown: 0.17, swing: 0.12, knockback: 0.5, blurb: 'Lightning fast' },
  spear: { id: 'spear', name: 'Neon Spear', short: 'Spear', icon: '🔱', damage: 26, range: 2.5, arc: Math.PI / 4.5, cooldown: 0.55, swing: 0.22, knockback: 1.0, blurb: 'Long reach, narrow' },
  hammer: { id: 'hammer', name: 'Mega Hammer', short: 'Hammer', icon: '🔨', damage: 52, range: 1.8, arc: Math.PI * 0.85, cooldown: 1.0, swing: 0.35, knockback: 3.4, blurb: 'Slow, huge knockback' },
  scythe: { id: 'scythe', name: 'Moon Scythe', short: 'Scythe', icon: '🌙', damage: 27, range: 2.0, arc: Math.PI * 1.5, cooldown: 0.65, swing: 0.3, knockback: 1.6, blurb: 'Hits almost all around' },
}

// Abilities are bound, in the order you find them, to ABILITY_KEYS.
// `duration` is how long a timed effect lasts.
export const ABILITIES = {
  blink: { id: 'blink', name: 'Blink', icon: '💨', cooldown: 5, blurb: 'Teleport forward' },
  shockwave: { id: 'shockwave', name: 'Shockwave', icon: '💥', cooldown: 9, blurb: 'Blast enemies away' },
  heal: { id: 'heal', name: 'Heal Pulse', icon: '💚', cooldown: 22, blurb: 'Restore 30 HP' },
  shield: { id: 'shield', name: 'Bubble Shield', icon: '🛡️', cooldown: 18, duration: 3, blurb: 'Block all damage' },
  rage: { id: 'rage', name: 'Rage', icon: '🔥', cooldown: 22, duration: 6, blurb: 'Hit 1.8x harder' },
}

// kind: 'zap' (hits the nearest enemy in range), 'heal' (patches you up),
// 'magnet' (pulls crystals in from afar), 'guard' (shrugs off part of
// every hit).
export const PETS = {
  sparky: { id: 'sparky', name: 'Sparky', icon: '⚡', color: 0xffe14a, shape: 'octahedron', kind: 'zap', damage: 8, interval: 1.1, range: 7, blurb: 'Zaps nearby enemies' },
  // A vivid lime/chartreuse -- far enough from sparky's warm yellow, the
  // player's coral, and every monster's hue (blobbo's mint green,
  // zippy's hot pink, grumpus's periwinkle) to stay readable on its own
  // against the pale deck.
  blasty: { id: 'blasty', name: 'Blasty', icon: '💣', color: 0xb4e61d, shape: 'dodecahedron', kind: 'zap', damage: 26, interval: 2.8, range: 11, knockback: 1.6, blurb: 'Slow, heavy blasts' },
  healbit: { id: 'healbit', name: 'Healbit', icon: '💗', color: 0xff6fa5, shape: 'sphere', kind: 'heal', amount: 2, interval: 2.5, blurb: 'Heals you over time' },
  magneto: { id: 'magneto', name: 'Magneto', icon: '🧲', color: 0x7a8cff, shape: 'cylinder', kind: 'magnet', radius: 10, blurb: 'Vacuums up crystals' },
  shieldy: { id: 'shieldy', name: 'Shieldy', icon: '🔰', color: 0x4de0c0, shape: 'tetrahedron', kind: 'guard', reduction: 0.25, blurb: 'Takes 25% off every hit' },
}

export const ABILITY_KEYS = ['KeyQ', 'KeyZ', 'KeyX', 'KeyC', 'KeyV']
export const HOTBAR_KEYS = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5']
export const HOTBAR_SLOTS = HOTBAR_KEYS.length
export const ABILITY_SLOTS = ABILITY_KEYS.length
export const MAX_PETS = 5

export const BASE_MAGNET_RADIUS = 3.2

// What the owned pets add up to: the crystal-pull radius (a magnet pet
// widens it) and the multiplier on damage you take (guard pets, each
// shaving off their share but never below a 40% floor).
export function petEffects(petIds) {
  let magnetRadius = BASE_MAGNET_RADIUS
  let damageTakenMultiplier = 1
  for (const id of petIds) {
    const pet = PETS[id]
    if (pet.kind === 'magnet') magnetRadius = Math.max(magnetRadius, pet.radius)
    if (pet.kind === 'guard') damageTakenMultiplier *= 1 - pet.reduction
  }
  return { magnetRadius, damageTakenMultiplier: Math.max(0.4, damageTakenMultiplier) }
}
