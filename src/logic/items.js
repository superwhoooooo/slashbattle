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
// crystals in from afar), 'guard' (shrugs off part of every hit), 'throw'
// (hurls a spinning lightsaber at the nearest enemy; `saberColor`). Every
// pet but the healers, magnets and guards fights. `model` picks the real
// animal / object it looks like (src/petModels.js); `color` is the accent
// used for its icon and attack particles.
export const PETS = {
  sparky: { id: 'sparky', name: 'Sparky', icon: '🐥', color: 0xffe14a, model: 'chick', kind: 'zap', damage: 8, interval: 1.1, range: 7, blurb: 'A chick that zaps nearby enemies' },
  blasty: { id: 'blasty', name: 'Blasty', icon: '💣', color: 0xb4e61d, model: 'bomb', kind: 'zap', damage: 26, interval: 2.8, range: 11, knockback: 1.6, blurb: 'A bomb with slow, heavy blasts' },
  healbit: { id: 'healbit', name: 'Healbit', icon: '💗', color: 0xff6fa5, model: 'heart', kind: 'heal', amount: 2, interval: 2.5, blurb: 'A heart that heals you over time' },
  magneto: { id: 'magneto', name: 'Magneto', icon: '🧲', color: 0x7a8cff, model: 'magnet', kind: 'magnet', radius: 10, blurb: 'A magnet that vacuums up crystals' },
  shieldy: { id: 'shieldy', name: 'Shieldy', icon: '🐢', color: 0x4de0c0, model: 'turtle', kind: 'guard', reduction: 0.25, blurb: 'A turtle that takes 25% off every hit' },
  ember: { id: 'ember', name: 'Ember', icon: '🦊', color: 0xff7a2e, model: 'fox', kind: 'zap', damage: 4, interval: 0.55, range: 5, blurb: 'A fox with rapid little burns' },
  bolt: { id: 'bolt', name: 'Bolt', icon: '🦉', color: 0x8fd0ff, model: 'owl', kind: 'zap', damage: 14, interval: 1.8, range: 16, blurb: 'An owl that zaps from far away' },
  comet: { id: 'comet', name: 'Comet', icon: '🚀', color: 0xc07aff, model: 'rocket', kind: 'zap', damage: 12, interval: 2.2, range: 9, knockback: 3.5, blurb: 'A rocket that shoves enemies back' },
  spike: { id: 'spike', name: 'Spike', icon: '🌵', color: 0x58c24a, model: 'cactus', kind: 'pulse', damage: 7, interval: 1.6, radius: 3, blurb: 'A cactus that prickles everything close' },
  boomer: { id: 'boomer', name: 'Boomer', icon: '🧨', color: 0xff5a5a, model: 'tnt', kind: 'pulse', damage: 22, interval: 4.5, radius: 4.5, knockback: 2.5, blurb: 'Dynamite: a big slow blast around you' },
  mender: { id: 'mender', name: 'Mender', icon: '🧰', color: 0xffd1dc, model: 'medkit', kind: 'heal', amount: 6, interval: 6, blurb: 'A medkit: big heal, now and then' },
  sprout: { id: 'sprout', name: 'Sprout', icon: '🌱', color: 0x9be37a, model: 'sprout', kind: 'heal', amount: 1, interval: 1, blurb: 'A potted sprout with a constant trickle heal' },
  grumble: { id: 'grumble', name: 'Grumble', icon: '🐻', color: 0xd9534f, model: 'bear', kind: 'pulse', damage: 14, interval: 2.2, radius: 3.2, knockback: 2, blurb: 'A grumpy bear that swipes everything close' },
  whirl: { id: 'whirl', name: 'Whirl', icon: '🐝', color: 0x7fe0e8, model: 'bee', kind: 'zap', damage: 6, interval: 0.7, range: 6, blurb: 'A bee that stings the nearest enemy, fast' },
  zoom: { id: 'zoom', name: 'Zoom', icon: '🐰', color: 0xffb347, model: 'rabbit', kind: 'zap', damage: 9, interval: 1.2, range: 8, knockback: 2, blurb: 'A rabbit that boings enemies away' },
  goldie: { id: 'goldie', name: 'Goldie', icon: '🐠', color: 0xffd23f, model: 'goldfish', kind: 'zap', damage: 10, interval: 1.5, range: 8, blurb: 'A goldfish that splashes the nearest enemy' },
  bumper: { id: 'bumper', name: 'Bumper', icon: '🐏', color: 0xff6f91, model: 'ram', kind: 'zap', damage: 12, interval: 2.4, range: 5, knockback: 4.5, blurb: 'A ram that headbutts enemies off the edge' },
  plated: { id: 'plated', name: 'Plated', icon: '🛡️', color: 0xb0bec5, model: 'shield', kind: 'guard', reduction: 0.15, blurb: 'A shield that takes 15% off every hit' },
  vortex: { id: 'vortex', name: 'Vortex', icon: '🐦‍⬛', color: 0x4d6bff, model: 'magpie', kind: 'magnet', radius: 16, blurb: 'A magpie with a huge crystal pull' },
  matthias: { id: 'matthias', name: 'Matthias', icon: '🧑', color: 0x58ff6a, saberColor: 0x58ff6a, model: 'matthias', kind: 'throw', damage: 18, interval: 1.3, range: 13, knockback: 2, blurb: 'Throws lightsabers at the nearest enemy' },
  remybenji: { id: 'remybenji', name: 'Remy & Benji', icon: '👦', color: 0xffd84a, saberColor: 0xffd84a, model: 'remybenji', kind: 'throw', thrown: ['junk', 'banana'], damage: 16, interval: 0.9, range: 12, knockback: 1.5, blurb: 'Remy chucks junk, Benji lobs bananas, at the nearest enemy' },
  rascal: { id: 'rascal', name: 'Rascal', icon: '🦝', color: 0x9e9e9e, model: 'raccoon', kind: 'zap', damage: 7, interval: 0.9, range: 7, blurb: 'A raccoon that swipes the nearest enemy' },
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
  // Pets no longer buff the player's own stats (they fight instead), so the
  // weapon / speed / loot multipliers are always neutral.
  return {
    magnetRadius,
    damageTakenMultiplier: Math.max(0.4, damageTakenMultiplier),
    damageMultiplier: 1,
    cooldownMultiplier: 1,
    speedMultiplier: 1,
    crystalMultiplier: 1,
    knockbackMultiplier: 1,
  }
}

// Power-ups: passive perks found in chests. You choose which to equip (up to
// POWERUP_SLOTS) in the Tab menu; equipped ones multiply together.
export const POWERUP_SLOTS = 3
export const POWERUPS = {
  swift: { id: 'swift', name: 'Swift Boots', icon: '👟', blurb: '+25% move speed', speed: 1.25 },
  heavy: { id: 'heavy', name: 'Heavy Hitter', icon: '💪', blurb: '+30% damage', damage: 1.3 },
  quick: { id: 'quick', name: 'Quick Hands', icon: '⚡', blurb: 'Attack 25% faster', cooldown: 0.75 },
  thick: { id: 'thick', name: 'Thick Skin', icon: '🧱', blurb: 'Take 20% less damage', damageTaken: 0.8 },
  greed: { id: 'greed', name: 'Gem Greed', icon: '💎', blurb: '+50% crystals', crystal: 1.5 },
  shove: { id: 'shove', name: 'Big Shove', icon: '🥊', blurb: '+60% knockback', knockback: 1.6 },
  leech: { id: 'leech', name: 'Second Helping', icon: '🍰', blurb: 'Heal 2 HP on every kill', killHeal: 2 },
}

// What the equipped power-ups add up to (multipliers start at 1).
export function powerupEffects(ids = []) {
  const fx = { speed: 1, damage: 1, cooldown: 1, damageTaken: 1, crystal: 1, knockback: 1, killHeal: 0 }
  for (const id of ids) {
    const perk = POWERUPS[id]
    if (!perk) continue
    fx.speed *= perk.speed ?? 1
    fx.damage *= perk.damage ?? 1
    fx.cooldown *= perk.cooldown ?? 1
    fx.damageTaken *= perk.damageTaken ?? 1
    fx.crystal *= perk.crystal ?? 1
    fx.knockback *= perk.knockback ?? 1
    fx.killHeal += perk.killHeal ?? 0
  }
  return fx
}
