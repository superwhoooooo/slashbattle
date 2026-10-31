// Pure, Three-free item catalogs: the weapons (the hotbar), abilities
// (active, on cooldown) and pets (follow the player and help) that chests
// hand out. Stats only -- models and effects live on the Three side
// (characters.js, pets.js, and main.js's ability handling).

// `range`/`arc` shape the swing's hit zone (center-to-center, like the
// original sword); `swing` is the swing animation's length in seconds.
// `short` is the hotbar slot's label, too tight for the full name.
// The staff is the starting weapon and always sits in hotbar slot 1.
export const WEAPONS = {
  // The starting weapon: a firearm-style caster. Its orbs (cause 'magic') fly
  // toward the mouse and it can auto-fire (L).
  staff: { id: 'staff', name: 'Wizard Staff', short: 'Staff', icon: '🪄', gun: true, cause: 'magic', damage: 16, range: 14, arc: 0, cooldown: 0.38, swing: 0.12, knockback: 0.1, pellets: 1, spread: 0, bullet: { speed: 20, life: 0.85, radius: 0.3, pierce: 0, explode: 0, color: 0xb48cff }, blurb: 'Shoots magic orbs at your mouse' },
  sword: { id: 'sword', name: 'Energy Sword', short: 'Sword', icon: '🗡️', damage: 20, range: 1.4, arc: Math.PI / 2, cooldown: 0.4, swing: 0.25, knockback: 1.2, blurb: 'Balanced' },
  dagger: { id: 'dagger', name: 'Twin Dagger', short: 'Dagger', icon: '🔪', damage: 11, range: 1.1, arc: Math.PI / 2, cooldown: 0.17, swing: 0.12, knockback: 0.5, blurb: 'Lightning fast' },
  spear: { id: 'spear', name: 'Neon Spear', short: 'Spear', icon: '🔱', damage: 26, range: 2.5, arc: Math.PI / 4.5, cooldown: 0.55, swing: 0.22, knockback: 1.0, blurb: 'Long reach, narrow' },
  hammer: { id: 'hammer', name: 'Mega Hammer', short: 'Hammer', icon: '🔨', damage: 52, range: 1.8, arc: Math.PI * 0.85, cooldown: 1.0, swing: 0.35, knockback: 3.4, blurb: 'Slow, huge knockback' },
  scythe: { id: 'scythe', name: 'Moon Scythe', short: 'Scythe', icon: '🌙', damage: 27, range: 2.0, arc: Math.PI * 1.5, cooldown: 0.65, swing: 0.3, knockback: 1.6, blurb: 'Hits almost all around' },
  katana: { id: 'katana', name: 'Plasma Katana', short: 'Katana', icon: '⚔️', damage: 24, range: 1.7, arc: Math.PI / 3, cooldown: 0.3, swing: 0.16, knockback: 0.9, blurb: 'Quick, clean cuts' },
  axe: { id: 'axe', name: 'Battle Axe', short: 'Axe', icon: '🪓', damage: 38, range: 1.6, arc: Math.PI * 0.7, cooldown: 0.75, swing: 0.28, knockback: 2.0, blurb: 'Chops wide and hard' },
  rapier: { id: 'rapier', name: 'Pixel Rapier', short: 'Rapier', icon: '🤺', damage: 15, range: 2.2, arc: Math.PI / 6, cooldown: 0.22, swing: 0.1, knockback: 0.3, blurb: 'Stabs fast from afar' },
  flail: { id: 'flail', name: 'Disco Flail', short: 'Flail', icon: '🪩', damage: 32, range: 2.2, arc: Math.PI * 1.2, cooldown: 0.85, swing: 0.34, knockback: 2.4, blurb: 'Wide, heavy spin' },
  chainsaw: { id: 'chainsaw', name: 'Chainsaw', short: 'Saw', icon: '🪚', damage: 8, range: 1.2, arc: Math.PI * 0.6, cooldown: 0.1, swing: 0.08, knockback: 0.2, blurb: 'Buzzes through anything' },
  boomstick: { id: 'boomstick', name: 'Boom Stick', short: 'Boomstick', icon: '🏏', damage: 30, range: 1.9, arc: Math.PI * 0.5, cooldown: 0.5, swing: 0.2, knockback: 2.8, blurb: 'Bat-swing launcher' },
  // Firearms: instead of a melee zone, the swing's hit moment fires
  // `pellets` bullets in a `spread`-radian fan. `bullet` is its speed,
  // life (seconds), radius, plus `pierce` (extra monsters it passes
  // through) and `explode` (blast radius on impact, 0 = none).
  pistol: { id: 'pistol', name: 'Pop Pistol', short: 'Pistol', icon: '🔫', gun: true, damage: 14, range: 12, arc: 0, cooldown: 0.28, swing: 0.1, knockback: 0.6, pellets: 1, spread: 0, bullet: { speed: 26, life: 0.55, radius: 0.22, pierce: 0, explode: 0, color: 0xffe14a }, blurb: 'Reliable ranged pops' },
  shotgun: { id: 'shotgun', name: 'Confetti Shotgun', short: 'Shotgun', icon: '💨', gun: true, damage: 9, range: 8, arc: 0, cooldown: 0.9, swing: 0.15, knockback: 1.4, pellets: 7, spread: 0.7, bullet: { speed: 22, life: 0.35, radius: 0.2, pierce: 0, explode: 0, color: 0xff8ad8 }, blurb: 'Close-range spray' },
  smg: { id: 'smg', name: 'Bubble SMG', short: 'SMG', icon: '🫧', gun: true, damage: 6, range: 10, arc: 0, cooldown: 0.08, swing: 0.06, knockback: 0.2, pellets: 1, spread: 0.12, bullet: { speed: 24, life: 0.45, radius: 0.18, pierce: 0, explode: 0, color: 0x66f0ff }, blurb: 'Hose them down' },
  railgun: { id: 'railgun', name: 'Rail Gun', short: 'Railgun', icon: '🚀', gun: true, damage: 48, range: 30, arc: 0, cooldown: 1.3, swing: 0.2, knockback: 1.8, pellets: 1, spread: 0, bullet: { speed: 60, life: 0.55, radius: 0.3, pierce: 5, explode: 0, color: 0x7cffb0 }, blurb: 'Pierces whole lines' },
  launcher: { id: 'launcher', name: 'Cannonball Launcher', short: 'Launcher', icon: '💣', gun: true, damage: 34, range: 16, arc: 0, cooldown: 1.1, swing: 0.2, knockback: 2.6, pellets: 1, spread: 0, bullet: { speed: 16, life: 1.0, radius: 0.32, pierce: 0, explode: 3.0, color: 0xff8a3a }, blurb: 'Explodes on impact' },
}

// Abilities are bound, in the order you find them, to ABILITY_KEYS.
// `duration` is how long a timed effect lasts.
export const ABILITIES = {
  blink: { id: 'blink', name: 'Blink', icon: '💨', cooldown: 5, blurb: 'Teleport forward' },
  shockwave: { id: 'shockwave', name: 'Shockwave', icon: '💥', cooldown: 9, blurb: 'Blast enemies away' },
  heal: { id: 'heal', name: 'Heal Pulse', icon: '💚', cooldown: 22, blurb: 'Restore 30 HP' },
  shield: { id: 'shield', name: 'Bubble Shield', icon: '🛡️', cooldown: 18, duration: 3, blurb: 'Block all damage' },
  rage: { id: 'rage', name: 'Rage', icon: '🔥', cooldown: 22, duration: 6, blurb: 'Hit 1.8x harder' },
  lunge: { id: 'lunge', name: 'Lunge', icon: '🏹', cooldown: 7, blurb: 'Dash through and slash' },
  thunder: { id: 'thunder', name: 'Thunderstorm', icon: '⛈️', cooldown: 14, blurb: 'Lightning on 4 enemies' },
  gravity: { id: 'gravity', name: 'Gravity Well', icon: '🌀', cooldown: 13, blurb: 'Drag enemies in close' },
  volley: { id: 'volley', name: 'Bullet Ring', icon: '🎯', cooldown: 10, blurb: 'Fire a ring of shots' },
  drain: { id: 'drain', name: 'Life Drain', icon: '🧛', cooldown: 16, blurb: 'Steal HP from nearby foes' },
  frenzy: { id: 'frenzy', name: 'Frenzy', icon: '⚡', cooldown: 20, duration: 6, blurb: 'Attack twice as fast' },
  sprint: { id: 'sprint', name: 'Sprint', icon: '👟', cooldown: 12, duration: 5, blurb: 'Run 1.6x faster' },
  refresh: { id: 'refresh', name: 'Second Wind', icon: '♻️', cooldown: 30, blurb: 'Reset other cooldowns' },
}

// kind: 'zap' (hits the nearest enemy in range), 'pulse' (hits every enemy
// within `radius` of the pet), 'heal' (patches you up), 'magnet' (pulls
// crystals in from afar), 'guard' (shrugs off part of every hit), 'buff'
// (passive `bonus` multipliers: damage, cooldown, speed, crystals,
// knockback).
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
  ember: { id: 'ember', name: 'Ember', icon: '🔥', color: 0xff7a2e, shape: 'tetrahedron', kind: 'zap', damage: 4, interval: 0.55, range: 5, blurb: 'Rapid little burns' },
  bolt: { id: 'bolt', name: 'Bolt', icon: '🌩️', color: 0x8fd0ff, shape: 'cone', kind: 'zap', damage: 14, interval: 1.8, range: 16, blurb: 'Zaps from far away' },
  comet: { id: 'comet', name: 'Comet', icon: '☄️', color: 0xc07aff, shape: 'sphere', kind: 'zap', damage: 12, interval: 2.2, range: 9, knockback: 3.5, blurb: 'Shoves enemies back' },
  spike: { id: 'spike', name: 'Spike', icon: '🌵', color: 0x58c24a, shape: 'cone', kind: 'pulse', damage: 7, interval: 1.6, radius: 3, blurb: 'Prickles everything close' },
  boomer: { id: 'boomer', name: 'Boomer', icon: '💥', color: 0xff5a5a, shape: 'dodecahedron', kind: 'pulse', damage: 22, interval: 4.5, radius: 4.5, knockback: 2.5, blurb: 'Big slow blast around you' },
  mender: { id: 'mender', name: 'Mender', icon: '🩹', color: 0xffd1dc, shape: 'cylinder', kind: 'heal', amount: 6, interval: 6, blurb: 'Big heal, now and then' },
  sprout: { id: 'sprout', name: 'Sprout', icon: '🌱', color: 0x9be37a, shape: 'sphere', kind: 'heal', amount: 1, interval: 1, blurb: 'Constant trickle heal' },
  grumble: { id: 'grumble', name: 'Grumble', icon: '😤', color: 0xd9534f, shape: 'octahedron', kind: 'buff', bonus: { damage: 1.2 }, blurb: '+20% weapon damage' },
  whirl: { id: 'whirl', name: 'Whirl', icon: '🌪️', color: 0x7fe0e8, shape: 'cylinder', kind: 'buff', bonus: { cooldown: 0.85 }, blurb: 'Swing 15% faster' },
  zoom: { id: 'zoom', name: 'Zoom', icon: '🛼', color: 0xffb347, shape: 'cone', kind: 'buff', bonus: { speed: 1.15 }, blurb: 'Run 15% faster' },
  goldie: { id: 'goldie', name: 'Goldie', icon: '🪙', color: 0xffd23f, shape: 'dodecahedron', kind: 'buff', bonus: { crystals: 1.5 }, blurb: '+50% crystals' },
  bumper: { id: 'bumper', name: 'Bumper', icon: '🥊', color: 0xff6f91, shape: 'sphere', kind: 'buff', bonus: { knockback: 1.4 }, blurb: '+40% knockback' },
  plated: { id: 'plated', name: 'Plated', icon: '🛡️', color: 0xb0bec5, shape: 'octahedron', kind: 'guard', reduction: 0.15, blurb: 'Takes 15% off every hit' },
  vortex: { id: 'vortex', name: 'Vortex', icon: '🧿', color: 0x4d6bff, shape: 'tetrahedron', kind: 'magnet', radius: 16, blurb: 'Huge crystal pull' },
  rascal: { id: 'rascal', name: 'Rascal', icon: '🦝', color: 0x9e9e9e, shape: 'dodecahedron', kind: 'buff', bonus: { damage: 1.1, speed: 1.08, crystals: 1.15 }, blurb: 'A little of everything' },
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
  const fx = { damageMultiplier: 1, cooldownMultiplier: 1, speedMultiplier: 1, crystalMultiplier: 1, knockbackMultiplier: 1 }
  for (const id of petIds) {
    const pet = PETS[id]
    if (pet.kind === 'magnet') magnetRadius = Math.max(magnetRadius, pet.radius)
    if (pet.kind === 'guard') damageTakenMultiplier *= 1 - pet.reduction
    if (pet.kind === 'buff') {
      const { damage = 1, cooldown = 1, speed = 1, crystals = 1, knockback = 1 } = pet.bonus
      fx.damageMultiplier *= damage
      fx.cooldownMultiplier *= cooldown
      fx.speedMultiplier *= speed
      fx.crystalMultiplier *= crystals
      fx.knockbackMultiplier *= knockback
    }
  }
  return {
    magnetRadius,
    damageTakenMultiplier: Math.max(0.4, damageTakenMultiplier),
    ...fx,
    cooldownMultiplier: Math.max(0.5, fx.cooldownMultiplier),
  }
}
