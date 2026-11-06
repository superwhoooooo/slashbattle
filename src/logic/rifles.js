// Pure, Three-free rules for rifles: long guns with a swappable SCOPE and AMMO, each
// unlocked from chests (once you carry a rifle to use it) and upgradable with banked
// crystals. `tuneRifle` folds a rifle's base stats + scope + ammo + levels into one
// effective weapon, which combat.js fires through the normal bullet path.
//
// What a scope is FOR (beyond a flat stat nudge):
//  - steady:    crit chance that grows the longer you stand still (the reticle fills up).
//  - longShot:  bonus damage that grows with how far the bullet flew (full at max range).
//  - closeShot: bonus damage on bullets that hit within CLOSE_SHOT_RANGE of the muzzle.
//  - zoom/laser/reticle: a wider view, a laser line, a reticle shape.

export const SCOPES = {
  iron: { id: 'iron', name: 'Iron Sights', blurb: 'Plain and honest. No bonuses.', reticle: 'dot', color: '#8a96a8' },
  reddot: { id: 'reddot', name: 'Red Dot', blurb: 'Tight spread. +35% damage up close', spread: 0.7, closeShot: 0.35, reticle: 'dot', color: '#ff4a4a' },
  holo: { id: 'holo', name: 'Holo Sight', blurb: 'Half the spread, +10% crit, +25% damage up close', spread: 0.5, critChance: 0.1, closeShot: 0.25, reticle: 'ring', color: '#ff9a3c' },
  quick: { id: 'quick', name: 'Quickdraw', blurb: 'Fires 25% faster, +4% crit. Great on the move', cooldown: 0.75, critChance: 0.04, reticle: 'dot', color: '#ffd23f' },
  x4: { id: 'x4', name: '4x Scope', blurb: '+30% range, wider view, up to +30% far damage, +10% crit standing still', range: 1.3, spread: 0.4, longShot: 0.3, steady: 0.1, zoom: 1.15, reticle: 'cross', color: '#4de0ff' },
  laser: { id: 'laser', name: 'Laser Sight', blurb: 'Shows your line, near-zero spread, locks on fast: +15% crit standing still', spread: 0.3, steady: 0.15, steadyRate: 2.2, laser: true, reticle: 'dot', color: '#ff3030' },
  thermal: { id: 'thermal', name: 'Thermal Scope', blurb: '+12% crit, crits +0.25x, +15% crit standing still', critChance: 0.12, critMult: 0.25, steady: 0.15, zoom: 1.1, reticle: 'ring', color: '#ff6a2a' },
  x8: { id: 'x8', name: 'Sniper Scope', blurb: '+70% range, far view, up to +80% far damage, +20% crit standing still, slower', range: 1.7, spread: 0.15, longShot: 0.8, steady: 0.2, critChance: 0.1, critMult: 0.5, zoom: 1.3, cooldown: 1.1, reticle: 'cross', color: '#b48cff' },
  deadeye: { id: 'deadeye', name: 'Deadeye', blurb: 'Hold still for up to +45% crit, crits +1x. Slow to lock, 25% slower fire', steady: 0.45, steadyRate: 0.6, critChance: 0.1, critMult: 1, zoom: 1.2, cooldown: 1.25, reticle: 'cross', color: '#6dff9c' },
}
export const SCOPE_IDS = Object.keys(SCOPES)
export const DEFAULT_SCOPE = 'iron'

export const AMMO = {
  standard: { id: 'standard', name: 'Standard', blurb: 'The rifle as it came.', color: 0xdfe6ee },
  ap: { id: 'ap', name: 'Armor Piercing', blurb: 'Skewers 2 extra foes, -8% damage', color: 0xc7d2e0, pierce: 2, damage: 0.92 },
  hollow: { id: 'hollow', name: 'Hollow Point', blurb: '+25% damage, no piercing, slower shot', color: 0xffb066, damage: 1.25, speed: 0.9, pierce: -99 },
  heavy: { id: 'heavy', name: 'Heavy Slug', blurb: '+10% damage, 2x shove, big and slow', color: 0x9a8cff, damage: 1.1, knockback: 2.2, radius: 1.4, speed: 0.85 },
  explosive: { id: 'explosive', name: 'Explosive', blurb: 'Blasts nearby foes, -15% damage, slower fire', color: 0xff5a3a, explode: 2.2, damage: 0.85, cooldown: 1.15 },
  tracer: { id: 'tracer', name: 'Tracer', blurb: '1.4x bullet speed, +6% crit', color: 0xfff8c0, speed: 1.4, critChance: 0.06 },
  lucky: { id: 'lucky', name: 'Lucky Rounds', blurb: '+15% crit, crits +0.5x harder, -15% damage', color: 0x6dff9c, critChance: 0.15, critMult: 0.5, damage: 0.85 },
  flechette: { id: 'flechette', name: 'Flechette', blurb: '+2 pellets in a spray, -45% damage each', color: 0xe8f0ff, pellets: 2, spread: 0.25, damage: 0.55 },
}
export const AMMO_IDS = Object.keys(AMMO)
export const DEFAULT_AMMO = 'standard'

export const CRIT_CHANCE_CAP = 0.95
export const BASE_CRIT_MULT = 2
export const CLOSE_SHOT_RANGE = 5 // a bullet that hits within this many units of the muzzle gets the scope's closeShot bonus
export const STEADY_SECONDS = 0.7 // standing still this long fully steadies a x1 scope

// ---- Upgrades (banked crystals, per device) ----
export const RIFLE_MAX_LEVEL = 5
export const AMMO_MAX_LEVEL = 5
export const RIFLE_UPGRADE_COST = 40 // times the current level
export const AMMO_UPGRADE_COST = 30
export const RIFLE_LEVEL_DAMAGE = 0.12 // +12% damage per level past 1
export const RIFLE_LEVEL_CRIT = 0.015 // +1.5% crit chance per level past 1
export const RIFLE_LEVEL_RATE = 0.04 // 4% faster fire per level past 1
export const AMMO_LEVEL_AMP = 0.35 // each ammo level pushes its effects 35% further from neutral
const clampLevel = (level, max) => Math.max(1, Math.min(max, Math.floor(level ?? 1) || 1))
export const rifleLevel = (levels, id) => clampLevel(levels?.[id], RIFLE_MAX_LEVEL)
export const ammoLevel = (levels, id) => clampLevel(levels?.[id], AMMO_MAX_LEVEL)
export const rifleUpgradeCost = (level) => (level >= RIFLE_MAX_LEVEL ? null : RIFLE_UPGRADE_COST * level)
export const ammoUpgradeCost = (level) => (level >= AMMO_MAX_LEVEL ? null : AMMO_UPGRADE_COST * level)

export const isRifle = (weapon) => weapon?.rifle === true
export const validScope = (id) => (SCOPES[id] ? id : DEFAULT_SCOPE)
export const validAmmo = (id) => (AMMO[id] ? id : DEFAULT_AMMO)

// ---- Unlocks (found in chests, kept in the profile) ----
export const isScopeUnlocked = (unlocked, id) => id === DEFAULT_SCOPE || (unlocked?.scopes ?? []).includes(id)
export const isAmmoUnlocked = (unlocked, id) => id === DEFAULT_AMMO || (unlocked?.ammo ?? []).includes(id)
export const unlockedScopes = (unlocked) => SCOPE_IDS.filter((id) => isScopeUnlocked(unlocked, id))
export const unlockedAmmo = (unlocked) => AMMO_IDS.filter((id) => isAmmoUnlocked(unlocked, id))

// A rifle's effective picks from the profile: a pick you haven't unlocked falls back to the default.
export function rifleSetup(profile, id) {
  const saved = profile?.rifles?.[id]
  const scope = validScope(saved?.scope)
  const ammo = validAmmo(saved?.ammo)
  const usableAmmo = isAmmoUnlocked(profile?.unlocked, ammo) ? ammo : DEFAULT_AMMO
  return {
    scope: isScopeUnlocked(profile?.unlocked, scope) ? scope : DEFAULT_SCOPE,
    ammo: usableAmmo,
    gunLevel: rifleLevel(profile?.rifleLevels, id),
    ammoLevel: ammoLevel(profile?.ammoLevels, usableAmmo),
  }
}

// Folds a rifle's base stats with its scope, ammo and levels. Returns a NEW weapon object
// (the catalog entry is untouched) with the extra fields critChance, critMult, zoom, laser,
// reticle, steady, steadyRate, longShot and closeShot, ready for makeBullets.
export function tuneRifle(weapon, { scope = DEFAULT_SCOPE, ammo = DEFAULT_AMMO, gunLevel = 1, ammoLevel: ammoLvl = 1 } = {}) {
  const s = SCOPES[validScope(scope)]
  const a = AMMO[validAmmo(ammo)]
  const bullet = weapon.bullet
  const amp = 1 + AMMO_LEVEL_AMP * (clampLevel(ammoLvl, AMMO_MAX_LEVEL) - 1)
  const lv = clampLevel(gunLevel, RIFLE_MAX_LEVEL) - 1
  // An ammo's multiplier, pushed further from 1 by its level.
  const mult = (key) => 1 + ((a[key] ?? 1) - 1) * amp
  const pierce = Math.max(0, bullet.pierce + (a.pierce === undefined ? 0 : a.pierce < -50 ? a.pierce : Math.round(a.pierce * amp)))
  const speedMult = mult('speed')
  const rangeMult = s.range ?? 1
  return {
    ...weapon,
    damage: weapon.damage * mult('damage') * (1 + RIFLE_LEVEL_DAMAGE * lv),
    cooldown: weapon.cooldown * (s.cooldown ?? 1) * mult('cooldown') * (1 - RIFLE_LEVEL_RATE * lv),
    knockback: weapon.knockback * mult('knockback'),
    pellets: weapon.pellets + (a.pellets === undefined ? 0 : Math.round(a.pellets * amp)),
    spread: weapon.spread * (s.spread ?? 1) + (a.spread ?? 0),
    bullet: {
      ...bullet,
      speed: bullet.speed * speedMult,
      // Range scales how long a bullet flies (and offsets slower / faster ammo so it still reaches).
      life: (bullet.life * rangeMult) / speedMult,
      radius: bullet.radius * mult('radius'),
      pierce,
      explode: a.explode === undefined ? bullet.explode : a.explode * amp,
      color: a.color && a.id !== DEFAULT_AMMO ? a.color : bullet.color,
    },
    critChance: Math.min(CRIT_CHANCE_CAP, (weapon.critChance ?? 0) + (s.critChance ?? 0) + (a.critChance ?? 0) * amp + RIFLE_LEVEL_CRIT * lv),
    critMult: BASE_CRIT_MULT + (weapon.critMult ?? 0) + (s.critMult ?? 0) + (a.critMult ?? 0) * amp,
    zoom: s.zoom ?? 1,
    laser: s.laser === true,
    reticle: s.reticle,
    steady: s.steady ?? 0,
    steadyRate: s.steadyRate ?? 1,
    longShot: s.longShot ?? 0,
    closeShot: s.closeShot ?? 0,
  }
}

// How steady the aim is after `dt` more seconds: charges while the player stands still, drops fast when moving.
export function stepSteady(steady, moving, dt, rate = 1) {
  if (moving) return Math.max(0, steady - dt * 4)
  return Math.min(1, steady + (dt * rate) / STEADY_SECONDS)
}

// A bullet's flight bonus: closeShot while it's still near the muzzle, longShot growing with distance.
export function distanceBonus({ traveled = 0, maxRange = 1, longShot = 0, closeShot = 0 }) {
  if (traveled <= CLOSE_SHOT_RANGE && closeShot > 0) return closeShot
  return longShot * Math.min(1, traveled / Math.max(1, maxRange * 0.9))
}

// One roll of the dice for a bullet: true when it crits.
export const rollCrit = (critChance, rng = Math.random) => critChance > 0 && rng() < critChance

// Steps to the next / previous id in `ids` after `current`, wrapping.
export function cycleIn(ids, current, dir = 1) {
  if (ids.length === 0) return current
  const i = ids.indexOf(current)
  if (i < 0) return ids[0]
  return ids[(i + (dir >= 0 ? 1 : ids.length - 1)) % ids.length]
}
