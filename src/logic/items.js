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
  whip: { id: 'whip', name: 'Neon Whip', short: 'Whip', icon: '🪢', damage: 14, range: 3.1, arc: Math.PI / 5, cooldown: 0.3, swing: 0.14, knockback: 0.6, blurb: 'Cracks from way out' },
  nunchucks: { id: 'nunchucks', name: 'Nunchucks', short: 'Chucks', icon: '🥋', damage: 12, range: 1.5, arc: Math.PI, cooldown: 0.18, swing: 0.12, knockback: 0.7, blurb: 'Fast wide flurries' },
  crossbow: { id: 'crossbow', name: 'Party Crossbow', short: 'Crossbow', icon: '🏹', gun: true, damage: 30, range: 22, arc: 0, cooldown: 0.8, swing: 0.15, knockback: 1.2, pellets: 1, spread: 0, bullet: { speed: 42, life: 0.6, radius: 0.24, pierce: 2, explode: 0, color: 0xc9ff5a }, blurb: 'Bolts that skewer two extra foes' },
  flamer: { id: 'flamer', name: 'Flame Thrower', short: 'Flamer', icon: '🔥', gun: true, damage: 5, range: 6, arc: 0, cooldown: 0.07, swing: 0.05, knockback: 0.1, pellets: 3, spread: 0.45, bullet: { speed: 14, life: 0.4, radius: 0.26, pierce: 1, explode: 0, color: 0xff6a2a }, blurb: 'A short, hot, continuous spray' },
  blaster: { id: 'blaster', name: 'Disco Blaster', short: 'Blaster', icon: '✨', gun: true, damage: 11, range: 14, arc: 0, cooldown: 0.45, swing: 0.12, knockback: 0.9, pellets: 5, spread: 0.35, bullet: { speed: 28, life: 0.55, radius: 0.2, pierce: 1, explode: 0, color: 0xd96bff }, blurb: 'A sparkly five-shot fan' },
  // More melee (each borrows a base weapon's model, swing and effects: see WEAPON_BASE)
  trident: { id: 'trident', name: 'Neon Trident', short: 'Trident', icon: '🔱', damage: 30, range: 2.7, arc: Math.PI / 4, cooldown: 0.5, swing: 0.2, knockback: 1.1, blurb: 'Spear with extra bite and reach' },
  cleaver: { id: 'cleaver', name: 'Meat Cleaver', short: 'Cleaver', icon: '🔪', damage: 44, range: 1.5, arc: Math.PI * 0.6, cooldown: 0.8, swing: 0.26, knockback: 1.6, blurb: 'One heavy chop' },
  mace: { id: 'mace', name: 'Star Mace', short: 'Mace', icon: '⭐', damage: 40, range: 1.7, arc: Math.PI * 0.8, cooldown: 0.7, swing: 0.3, knockback: 3.0, blurb: 'Faster than the hammer, still a wallop' },
  glaive: { id: 'glaive', name: 'Moon Glaive', short: 'Glaive', icon: '🌜', damage: 24, range: 2.6, arc: Math.PI * 1.7, cooldown: 0.6, swing: 0.3, knockback: 1.4, blurb: 'A huge sweeping circle' },
  // More firearms
  minigun: { id: 'minigun', name: 'Party Minigun', short: 'Minigun', icon: '🎉', gun: true, damage: 4, range: 10, arc: 0, cooldown: 0.05, swing: 0.04, knockback: 0.15, pellets: 1, spread: 0.2, bullet: { speed: 26, life: 0.45, radius: 0.16, pierce: 0, explode: 0, color: 0xffb347 }, blurb: 'A blur of confetti rounds' },
  sniper: { id: 'sniper', name: 'Sunbeam Sniper', short: 'Sniper', icon: '☀️', gun: true, damage: 75, range: 40, arc: 0, cooldown: 1.6, swing: 0.25, knockback: 2.2, pellets: 1, spread: 0, bullet: { speed: 80, life: 0.6, radius: 0.28, pierce: 3, explode: 0, color: 0xfff27a }, blurb: 'One huge piercing shot' },
  grenade: { id: 'grenade', name: 'Pineapple Lobber', short: 'Lobber', icon: '🍍', gun: true, damage: 28, range: 14, arc: 0, cooldown: 1.0, swing: 0.2, knockback: 2.2, pellets: 1, spread: 0, bullet: { speed: 13, life: 1.1, radius: 0.34, pierce: 0, explode: 4.2, color: 0xa6e22e }, blurb: 'A big juicy blast' },
  frostgun: { id: 'frostgun', name: 'Frost Blaster', short: 'Frost', icon: '❄️', gun: true, damage: 13, range: 12, arc: 0, cooldown: 0.35, swing: 0.1, knockback: 1.6, pellets: 3, spread: 0.3, bullet: { speed: 24, life: 0.5, radius: 0.22, pierce: 0, explode: 0, color: 0xbfe9ff }, blurb: 'Icy triple shot that shoves' },
  launcher: { id: 'launcher', name: 'Cannonball Launcher', short: 'Launcher', icon: '💣', gun: true, damage: 34, range: 16, arc: 0, cooldown: 1.1, swing: 0.2, knockback: 2.6, pellets: 1, spread: 0, bullet: { speed: 16, life: 1.0, radius: 0.32, pierce: 0, explode: 3.0, color: 0xff8a3a }, blurb: 'Explodes on impact' },
  // Rifles: long guns with a swappable scope and ammo (logic/rifles.js; customize in the Gunsmith, key J,
  // or cycle with [ and ] while one is out). They borrow a base gun's model and effects.
  hunter: { id: 'hunter', name: 'Hunter Rifle', short: 'Hunter', icon: '🎯', gun: true, rifle: true, damage: 32, range: 22, arc: 0, cooldown: 0.7, swing: 0.15, knockback: 1.2, pellets: 1, spread: 0.02, critChance: 0.06, bullet: { speed: 46, life: 0.6, radius: 0.22, pierce: 0, explode: 0, color: 0xd9a066 }, blurb: 'A steady all-round rifle' },
  marksman: { id: 'marksman', name: 'Marksman DMR', short: 'DMR', icon: '🎯', gun: true, rifle: true, damage: 24, range: 22, arc: 0, cooldown: 0.42, swing: 0.1, knockback: 0.9, pellets: 1, spread: 0.02, critChance: 0.08, bullet: { speed: 50, life: 0.6, radius: 0.2, pierce: 0, explode: 0, color: 0x9ad1ff }, blurb: 'Quick, accurate semi-auto' },
  carbine: { id: 'carbine', name: 'Party Carbine', short: 'Carbine', icon: '🎯', gun: true, rifle: true, damage: 10, range: 14, arc: 0, cooldown: 0.14, swing: 0.05, knockback: 0.3, pellets: 1, spread: 0.07, critChance: 0.04, bullet: { speed: 34, life: 0.5, radius: 0.17, pierce: 0, explode: 0, color: 0xff9ad0 }, blurb: 'Rapid-fire and lively' },
  lever: { id: 'lever', name: 'Lever Action', short: 'Lever', icon: '🎯', gun: true, rifle: true, damage: 27, range: 18, arc: 0, cooldown: 0.55, swing: 0.14, knockback: 1.4, pellets: 1, spread: 0.03, critChance: 0.07, bullet: { speed: 40, life: 0.55, radius: 0.22, pierce: 1, explode: 0, color: 0xffcf5a }, blurb: 'Old-school, shoves and skewers' },
  bolt: { id: 'bolt', name: 'Bolt Action', short: 'Bolt', icon: '🎯', gun: true, rifle: true, damage: 62, range: 30, arc: 0, cooldown: 1.2, swing: 0.2, knockback: 2, pellets: 1, spread: 0, critChance: 0.12, bullet: { speed: 70, life: 0.6, radius: 0.24, pierce: 1, explode: 0, color: 0xf2f2f2 }, blurb: 'Slow, heavy and precise' },
  battle: { id: 'battle', name: 'Battle Rifle', short: 'Battle', icon: '🎯', gun: true, rifle: true, damage: 17, range: 16, arc: 0, cooldown: 0.26, swing: 0.08, knockback: 0.7, pellets: 1, spread: 0.04, critChance: 0.05, bullet: { speed: 38, life: 0.55, radius: 0.2, pierce: 0, explode: 0, color: 0x7cffb0 }, blurb: 'Punchy and dependable' },
  amr: { id: 'amr', name: 'Anti-Material Rifle', short: 'AMR', icon: '🎯', gun: true, rifle: true, damage: 115, range: 34, arc: 0, cooldown: 2.1, swing: 0.28, knockback: 3.2, pellets: 1, spread: 0, critChance: 0.1, bullet: { speed: 85, life: 0.6, radius: 0.34, pierce: 4, explode: 0, color: 0xff7a45 }, blurb: 'One enormous piercing round' },
  burst: { id: 'burst', name: 'Triple Burst', short: 'Burst', icon: '🎯', gun: true, rifle: true, damage: 13, range: 16, arc: 0, cooldown: 0.5, swing: 0.1, knockback: 0.6, pellets: 3, spread: 0.1, critChance: 0.06, bullet: { speed: 36, life: 0.55, radius: 0.18, pierce: 0, explode: 0, color: 0x66f0ff }, blurb: 'Three rounds per pull' },
  arcrifle: { id: 'arcrifle', name: 'Arc Rifle', short: 'Arc', icon: '🎯', gun: true, rifle: true, damage: 20, range: 20, arc: 0, cooldown: 0.6, swing: 0.12, knockback: 0.8, pellets: 1, spread: 0.02, critChance: 0.1, bullet: { speed: 48, life: 0.55, radius: 0.22, pierce: 3, explode: 0, color: 0xb48cff }, blurb: 'Crackling bolts through whole lines' },
  scout: { id: 'scout', name: 'Scout Rifle', short: 'Scout', icon: '🎯', gun: true, rifle: true, damage: 19, range: 20, arc: 0, cooldown: 0.36, swing: 0.1, knockback: 0.8, pellets: 1, spread: 0.03, critChance: 0.1, bullet: { speed: 52, life: 0.6, radius: 0.19, pierce: 0, explode: 0, color: 0xc9ff5a }, blurb: 'Light, fast, crit-happy' },
  gauss: { id: 'gauss', name: 'Gauss Rifle', short: 'Gauss', icon: '🎯', gun: true, rifle: true, damage: 78, range: 32, arc: 0, cooldown: 1.6, swing: 0.22, knockback: 2.4, pellets: 1, spread: 0, critChance: 0.08, bullet: { speed: 90, life: 0.55, radius: 0.28, pierce: 6, explode: 0, color: 0x4de0ff }, blurb: 'Magnetic slug that goes through everything' },
  pearl: { id: 'pearl', name: 'Pearl Longshot', short: 'Pearl', icon: '🎯', gun: true, rifle: true, damage: 40, range: 28, arc: 0, cooldown: 0.9, swing: 0.16, knockback: 1.6, pellets: 1, spread: 0.01, critChance: 0.14, bullet: { speed: 62, life: 0.6, radius: 0.24, pierce: 1, explode: 0, color: 0xff8ad8 }, blurb: 'Crit-leaning long shots' },
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
  meteor: { id: 'meteor', name: 'Meteor Strike', icon: '☄️', cooldown: 15, damage: 70, radius: 4, distance: 6, blurb: 'Drop a meteor ahead of you' },
  ghost: { id: 'ghost', name: 'Ghost Form', icon: '👻', cooldown: 16, duration: 2.5, blurb: 'Untouchable for 2.5s' },
  vacuum: { id: 'vacuum', name: 'Warp Field', icon: '🕳️', cooldown: 14, duration: 4.5, radius: 5.5, damage: 9, range: 18, blurb: 'Warp space at your cursor: confuses and hurts, pulls in crystals' },
  quake: { id: 'quake', name: 'Earthquake', icon: '🌋', cooldown: 17, damage: 30, radius: 9, blurb: 'Shake everything in a wide ring' },
  fanblast: { id: 'fanblast', name: 'Fan Blast', icon: '🎇', cooldown: 8, damage: 22, blurb: 'Seven heavy shots ahead' },
  dizzy: { id: 'dizzy', name: 'Dizzy Blast', icon: '💫', cooldown: 15, duration: 3.5, radius: 7, damage: 10, blurb: 'Nearby enemies stumble around, dazed' },
  starfall: { id: 'starfall', name: 'Starfall', icon: '🌠', cooldown: 18, damage: 55, radius: 3.2, targets: 3, blurb: 'Meteors rain on the 3 nearest enemies' },
  crossfire: { id: 'crossfire', name: 'Cross Fire', icon: '✖️', cooldown: 9, damage: 26, blurb: 'Piercing shots in four directions' },
  bulwark: { id: 'bulwark', name: 'Bulwark', icon: '🏰', cooldown: 20, duration: 6, blocks: 7, spacing: 1.3, distance: 2.6, blurb: 'Raise a temporary wall in front of you' },
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
  frosty: { id: 'frosty', name: 'Frosty', icon: '🐺', color: 0xbfe9ff, model: 'wolf', kind: 'zap', damage: 11, interval: 1.4, range: 8, knockback: 1, blurb: 'An arctic wolf with icy bites' },
  pandy: { id: 'pandy', name: 'Pandy', icon: '🐼', color: 0xeeeeee, model: 'panda', kind: 'pulse', damage: 10, interval: 1.8, radius: 3.4, knockback: 1.2, blurb: 'A panda that bonks everything close' },
  polly: { id: 'polly', name: 'Polly', icon: '🦜', color: 0xff4a4a, model: 'parrot', kind: 'zap', damage: 9, interval: 1, range: 10, blurb: 'A parrot that squawks damage at foes' },
  quackers: { id: 'quackers', name: 'Quackers', icon: '🦆', color: 0xfff1a8, model: 'duck', kind: 'heal', amount: 3, interval: 3.5, blurb: 'A duck that quacks you back to health' },
  shadow: { id: 'shadow', name: 'Shadow', icon: '🥷', color: 0x6b5b95, model: 'ninjacoon', kind: 'zap', damage: 5, interval: 0.35, range: 5, blurb: 'A ninja raccoon with a blur of stabs' },
  mittens: { id: 'mittens', name: 'Mittens', icon: '🐱', color: 0xf0b27a, model: 'cat', kind: 'zap', damage: 7, interval: 0.75, range: 6, blurb: 'A cat with quick little swats' },
  oink: { id: 'oink', name: 'Oinky', icon: '🐷', color: 0xffb3c1, model: 'pig', kind: 'magnet', radius: 13, blurb: 'A pig that roots out crystals from afar' },
  koda: { id: 'koda', name: 'Koda', icon: '🐨', color: 0xb0b6c0, model: 'koala', kind: 'pulse', damage: 9, interval: 2, radius: 3.6, knockback: 1.5, blurb: 'A koala that thumps everything close' },
  stripes: { id: 'stripes', name: 'Stripes', icon: '🐯', color: 0xff9a2e, model: 'tiger', kind: 'zap', damage: 20, interval: 2.2, range: 7, knockback: 2.5, blurb: 'A tiger with one big pounce' },
  leo: { id: 'leo', name: 'Leo', icon: '🦁', color: 0xe8b04a, model: 'lion', kind: 'pulse', damage: 18, interval: 3, radius: 4, knockback: 2, blurb: 'A lion whose roar rattles everything near' },
  waddles: { id: 'waddles', name: 'Waddles', icon: '🐧', color: 0x6fa8ff, model: 'penguin', kind: 'zap', damage: 10, interval: 1.1, range: 8, knockback: 1, blurb: 'A penguin that slides snowballs at foes' },
  flame: { id: 'flame', name: 'Flame', icon: '🦩', color: 0xff7fa8, model: 'flamingo', kind: 'heal', amount: 4, interval: 4, blurb: 'A flamingo that fluffs you back to health' },
  toco: { id: 'toco', name: 'Toco', icon: '🦜', color: 0xff8a00, model: 'toucan', kind: 'zap', damage: 12, interval: 1.3, range: 12, blurb: 'A toucan that pecks from way out' },
  biscuit: { id: 'biscuit', name: 'Biscuit', icon: '🐶', color: 0xd9b88a, model: 'pug', kind: 'guard', reduction: 0.2, blurb: 'A loyal pug that takes 20% off every hit' },
  mojo: { id: 'mojo', name: 'Mojo', icon: '🐵', color: 0xffe14a, saberColor: 0xffe14a, model: 'monkey', kind: 'throw', thrown: ['banana'], damage: 13, interval: 1.0, range: 11, knockback: 1, blurb: 'A monkey that lobs bananas at the nearest foe' },
  sparkle: { id: 'sparkle', name: 'Sparkle', icon: '🦄', color: 0xff8ad8, model: 'unicorn', kind: 'heal', amount: 3, interval: 2.8, blurb: 'A unicorn with a steady glittery heal' },
  rascal: { id: 'rascal', name: 'Rascal', icon: '🦝', color: 0x9e9e9e, model: 'raccoon', kind: 'zap', damage: 7, interval: 0.9, range: 7, blurb: 'A raccoon that swipes the nearest enemy' },
}

// New weapons borrow an older one's model, swing animation and effects.
export const WEAPON_BASE = { trident: 'spear', cleaver: 'axe', mace: 'hammer', glaive: 'scythe', minigun: 'smg', sniper: 'railgun', grenade: 'launcher', frostgun: 'blaster', hunter: 'crossbow', marksman: 'crossbow', carbine: 'smg', lever: 'crossbow', bolt: 'railgun', battle: 'smg', amr: 'railgun', burst: 'smg', arcrifle: 'railgun', scout: 'crossbow', gauss: 'railgun', pearl: 'railgun' }
export const weaponBase = (id) => WEAPON_BASE[id] ?? id

export const ABILITY_KEYS = ['KeyQ', 'KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyG', 'KeyH'] // the last two only open up with the Bandolier skill
export const HOTBAR_KEYS = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5']
export const HOTBAR_SLOTS = HOTBAR_KEYS.length
export const ABILITY_SLOTS = 5 // the starting number (the skill tree can add more, up to MAX_SLOTS)
export const MAX_PETS = 1

// How many power-ups / pets / abilities you can hold. The base counts grow with the
// skill tree's slot skills (set by main.js through setSlotBonuses, saved per device).
export const BASE_SLOTS = { powerups: 3, pets: 1, abilities: 5 }
export const MAX_SLOTS = { powerups: 6, pets: 1, abilities: 7 }
export const SLOT_LIMITS = { ...BASE_SLOTS }
export function setSlotBonuses({ powerups = 0, pets = 0, abilities = 0 } = {}) {
  const bonus = { powerups, pets, abilities }
  for (const key of Object.keys(BASE_SLOTS)) SLOT_LIMITS[key] = Math.min(MAX_SLOTS[key], BASE_SLOTS[key] + Math.max(0, Math.floor(bonus[key])))
}

export const BASE_MAGNET_RADIUS = 3.2

// What the owned pets add up to: the crystal-pull radius (a magnet pet
// widens it) and the multiplier on damage you take (guard pets, each
// shaving off their share but never below a 40% floor).
// Pet levels (bought with banked crystals in the hub, kept in the profile): each level past 1 adds
// PET_LEVEL_BOOST to the pet's power (damage, healing, magnet reach, damage reduction) and
// PET_LEVEL_RATE to how fast it acts.
export const PET_MAX_LEVEL = 5
export const PET_UPGRADE_COST = 30 // times the current level
export const PET_LEVEL_BOOST = 0.3
export const PET_LEVEL_RATE = 0.08
export const petLevel = (levels, id) => Math.max(1, Math.min(PET_MAX_LEVEL, Math.floor(levels?.[id] ?? 1)))
export const petBoost = (level) => 1 + PET_LEVEL_BOOST * (Math.max(1, level) - 1)
export const petRate = (level) => 1 + PET_LEVEL_RATE * (Math.max(1, level) - 1)
export const petUpgradeCost = (level) => (level >= PET_MAX_LEVEL ? null : PET_UPGRADE_COST * level)

export function petEffects(petIds, levels = {}) {
  let magnetRadius = BASE_MAGNET_RADIUS
  let damageTakenMultiplier = 1
  for (const id of petIds) {
    const pet = PETS[id]
    const boost = petBoost(petLevel(levels, id))
    if (pet.kind === 'magnet') magnetRadius = Math.max(magnetRadius, pet.radius * boost)
    if (pet.kind === 'guard') damageTakenMultiplier *= 1 - Math.min(0.6, pet.reduction * boost)
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
  swift: { id: 'swift', name: 'Swift Boots', icon: '👟', color: '#4dc8ff', tag: 'MOVE', blurb: '+20% move speed', speed: 1.2 },
  heavy: { id: 'heavy', name: 'Heavy Hitter', icon: '💪', color: '#ff6a4d', tag: 'OFFENSE', blurb: '+25% damage', damage: 1.25 },
  quick: { id: 'quick', name: 'Quick Hands', icon: '⚡', color: '#ffc928', tag: 'OFFENSE', blurb: 'Attack 20% faster', cooldown: 0.8 },
  thick: { id: 'thick', name: 'Thick Skin', icon: '🧱', color: '#c8643e', tag: 'DEFENSE', blurb: 'Take 20% less damage', damageTaken: 0.8 },
  greed: { id: 'greed', name: 'Gem Greed', icon: '💎', color: '#3cc9e8', tag: 'LOOT', blurb: '+40% crystals from pickups', crystal: 1.4 },
  shove: { id: 'shove', name: 'Big Shove', icon: '🥊', color: '#e83a4a', tag: 'OFFENSE', blurb: '+50% knockback (ring-outs!)', knockback: 1.5 },
  leech: { id: 'leech', name: 'Second Helping', icon: '🍰', color: '#e86a9a', tag: 'HEALING', blurb: 'Heal 2 HP on every kill', killHeal: 2 },
  regen: { id: 'regen', name: 'Slow Burn', icon: '🌿', color: '#46d27a', tag: 'HEALING', blurb: 'Regain 1 HP every 2 seconds', regen: 0.5 },
  haste: { id: 'haste', name: 'Quick Study', icon: '⏳', color: '#8a6bff', tag: 'ABILITY', blurb: 'Abilities recharge 25% faster', haste: 0.75 },
  glass: { id: 'glass', name: 'Glass Cannon', icon: '🔮', color: '#ff4fa3', tag: 'RISKY', blurb: '+50% damage, take 30% more', damage: 1.5, damageTaken: 1.3 },
  iron: { id: 'iron', name: 'Iron Will', icon: '🛡️', color: '#8aa0b8', tag: 'DEFENSE', blurb: 'Take 35% less damage, move 10% slower', damageTaken: 0.65, speed: 0.9 },
  thirst: { id: 'thirst', name: 'Bloodthirst', icon: '🩸', color: '#d12a4a', tag: 'HEALING', blurb: 'Heal 4 HP on every kill', killHeal: 4 },
  turbo: { id: 'turbo', name: 'Hyperdrive', icon: '🚀', color: '#ff8a3b', tag: 'MOVE', blurb: 'Attack 30% faster, move 10% faster', cooldown: 0.7, speed: 1.1 },
  jackpot: { id: 'jackpot', name: 'Jackpot', icon: '🎰', color: '#f5c518', tag: 'LOOT', blurb: '+80% crystals from pickups', crystal: 1.8 },
  focus: { id: 'focus', name: 'Deep Focus', icon: '🧘', color: '#6fd3c8', tag: 'ABILITY', blurb: 'Abilities recharge 40% faster', haste: 0.6 },
  magnet: { id: 'magnet', name: 'Gem Magnet', icon: '🧲', color: '#7a8cff', tag: 'LOOT', blurb: 'Crystals fly to you from 60% farther', magnet: 1.6 },
}

// What the equipped power-ups add up to (multipliers start at 1). `levels` maps a
// power-up id to its upgrade level (default 1): each level past 1 pushes a perk
// 35% further from neutral (a +25% damage perk becomes +33.75% at level 2, ...).
export function powerupEffects(ids = [], levels = {}) {
  const fx = { speed: 1, damage: 1, cooldown: 1, damageTaken: 1, crystal: 1, knockback: 1, killHeal: 0, regen: 0, haste: 1, magnet: 1 }
  for (const id of ids) {
    const perk = POWERUPS[id]
    if (!perk) continue
    const amp = 1 + 0.35 * ((levels[id] ?? 1) - 1)
    const mult = (key) => 1 + ((perk[key] ?? 1) - 1) * amp
    fx.speed *= mult('speed')
    fx.damage *= mult('damage')
    fx.cooldown *= mult('cooldown')
    fx.damageTaken *= mult('damageTaken')
    fx.crystal *= mult('crystal')
    fx.knockback *= mult('knockback')
    fx.killHeal += (perk.killHeal ?? 0) * amp
    fx.regen += (perk.regen ?? 0) * amp
    fx.haste *= mult('haste')
    fx.magnet *= mult('magnet')
  }
  return fx
}
