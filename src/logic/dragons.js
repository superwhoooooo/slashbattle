// Pure, Three-free dragon customization: the mystical SCALES (colour schemes) and BREATHS
// (what a dragon spits) a player mixes onto any dragon pet, the way a rifle takes a scope and
// ammo. A dragon pet (`kind: 'breath'` in items.js) flies above the player and breathes at
// enemies from the air. `dragonSetup` reads the saved picks, `tuneDragon` folds them (and the
// dragon's own def) into the def pets.js runs. src/dragonModel.js turns a scale into a body.

export const DRAGON_SPECIES = ['cinderwing', 'glacier', 'stormcaller', 'nightshade', 'aurelia', 'voidmaw']

// Each scale: body / belly plates / wing membrane / horns+claws / glow (eyes, mouth, runes,
// wing veins, ember specks).
export const SCALES = {
  crimson: { id: 'crimson', name: 'Crimson Ember', body: 0xb3162a, belly: 0xffb35c, wing: 0x6e0a1c, horn: 0xf3e3c3, glow: 0xff7a1a, blurb: 'Molten red scales with a burning belly' },
  azure: { id: 'azure', name: 'Moonlit Azure', body: 0x2a6fe0, belly: 0xd9f1ff, wing: 0x143a8a, horn: 0xe9f6ff, glow: 0x6fe3ff, blurb: 'Deep blue scales that shimmer like winter moonlight' },
  emerald: { id: 'emerald', name: 'Emerald Mist', body: 0x1f9e5a, belly: 0xd8ff9e, wing: 0x0f5c35, horn: 0xefe9b8, glow: 0x7dff6a, blurb: 'Forest-green scales wreathed in glowing spores' },
  amethyst: { id: 'amethyst', name: 'Amethyst Arcane', body: 0x8a3fe0, belly: 0xf0d2ff, wing: 0x4a1d8f, horn: 0xffe9ff, glow: 0xe27bff, blurb: 'Violet scales humming with old magic' },
  obsidian: { id: 'obsidian', name: 'Obsidian Night', body: 0x23232e, belly: 0x6a6a80, wing: 0x12121a, horn: 0xc9c9d8, glow: 0xff3b5c, blurb: 'Black glass scales with blood-red eyes' },
  aurum: { id: 'aurum', name: 'Aurum Sun', body: 0xe0a21c, belly: 0xfff3b0, wing: 0xa8630a, horn: 0xffffff, glow: 0xffe14a, blurb: 'Gleaming gold scales that throw sparks of sunlight' },
  opal: { id: 'opal', name: 'Opal Aurora', body: 0xe6a2f0, belly: 0xc7fff2, wing: 0x7dc9e8, horn: 0xffffff, glow: 0x9dffe6, blurb: 'Pearly scales that shift between pink and sea-green' },
  starlit: { id: 'starlit', name: 'Starlit Void', body: 0x1c1f6e, belly: 0x7a6cff, wing: 0x0b0d3a, horn: 0xd7d9ff, glow: 0xb48bff, blurb: 'Midnight scales scattered with tiny stars' },
}
export const DEFAULT_SCALE = 'crimson'
export const SKIN_IDS = Object.keys(SCALES)

// Each breath: the bolt's colour, and how it bends the dragon's own numbers. `splash` is a
// blast radius around the target, `chain` how many extra enemies it arcs to, `bolts` how many
// shots one breath fires, `damage` / `interval` / `knockback` / `range` are multipliers.
export const BREATHS = {
  flame: { id: 'flame', name: 'Dragonfire', color: 0xff6a1a, core: 0xfff0a0, blurb: 'Blasts of fire that burst on impact and scorch what is near', damage: 1, interval: 1, splash: 2.4, splashShare: 0.5 },
  frost: { id: 'frost', name: 'Frostbreath', color: 0x7fe0ff, core: 0xffffff, blurb: 'Quick icy bolts that shove enemies back', damage: 0.85, interval: 0.75, knockback: 1.6 },
  storm: { id: 'storm', name: 'Stormbreath', color: 0xffe94a, core: 0xffffff, blurb: 'Lightning that leaps to two more enemies', damage: 0.9, interval: 1, chain: 2, chainShare: 0.6, chainRange: 5.5 },
  venom: { id: 'venom', name: 'Venomspit', color: 0x8cff3a, core: 0xe7ffb0, blurb: 'Three toxic globs fired at once', damage: 0.5, interval: 1.1, bolts: 3 },
  void: { id: 'void', name: 'Voidbreath', color: 0xb04dff, core: 0xf2d6ff, blurb: 'Slow dark blasts that hit enormously hard and fling enemies', damage: 1.7, interval: 1.45, knockback: 3.2, range: 1.1 },
  solar: { id: 'solar', name: 'Sunbeam', color: 0xffffff, core: 0xfff7c2, blurb: 'Piercing beams of light that reach far and burst wide', damage: 1.15, interval: 1.2, splash: 1.5, splashShare: 0.4, range: 1.3 },
}
export const DEFAULT_BREATH = 'flame'
export const BREATH_IDS = Object.keys(BREATHS)

// Each species' own special ability: fires now and then (every `interval` seconds, once an enemy is
// in range) on top of its normal breath. Damage is `mult` x the dragon's base damage (after pet level
// and power-ups). Colours follow the dragon's scale, so a purple Cinderwing rains purple meteors.
export const SPECIALS = {
  meteors: { id: 'meteors', name: 'Meteor Rain', interval: 9, mult: 1.5, count: 6, radius: 2.2, spread: 5, blurb: 'Calls down six fireballs around its target' },
  blizzard: { id: 'blizzard', name: 'Blizzard', interval: 8, mult: 1.8, radius: 5.5, knockback: 4, blurb: 'A freezing burst that hits everything near its target and flings it back' },
  thunderstorm: { id: 'thunderstorm', name: 'Thunderstorm', interval: 7, mult: 2.2, strikes: 5, blurb: 'Lightning strikes the five nearest enemies' },
  toxic: { id: 'toxic', name: 'Toxic Cloud', interval: 10, mult: 0.7, radius: 3.4, duration: 5, tick: 0.5, blurb: 'Leaves a poison cloud that burns everything inside for five seconds' },
  aurora: { id: 'aurora', name: 'Aurora Nova', interval: 11, mult: 2, radius: 8, heal: 0.2, blurb: 'A burst of light around you that hurts enemies and heals you' },
  voidbeam: { id: 'voidbeam', name: 'Void Beam', interval: 12, mult: 6, length: 26, width: 1.7, charge: 0.6, blurb: 'Charges up, then fires a huge beam of energy that cuts through every enemy in a line' },
}

export const isDragon = (def) => def?.kind === 'breath'

export function isScale(id) {
  return Object.prototype.hasOwnProperty.call(SCALES, id)
}
export function isBreath(id) {
  return Object.prototype.hasOwnProperty.call(BREATHS, id)
}

// ---- Unlocks: skins (scales) and breaths are found in chests (once you have a dragon) and kept in the
// profile. Every dragon always has its own starting skin and breath.
export const ownSkin = (def) => def?.defaultScale ?? DEFAULT_SCALE
export const ownBreath = (def) => def?.defaultBreath ?? DEFAULT_BREATH
export const isSkinUnlocked = (unlocked, id, def = null) => id === ownSkin(def) || (unlocked?.skins ?? []).includes(id)
export const isBreathUnlocked = (unlocked, id, def = null) => id === ownBreath(def) || (unlocked?.breaths ?? []).includes(id)
export const unlockedSkins = (unlocked, def) => SKIN_IDS.filter((id) => isSkinUnlocked(unlocked, id, def))
export const unlockedBreaths = (unlocked, def) => BREATH_IDS.filter((id) => isBreathUnlocked(unlocked, id, def))

// A dragon's look and breath: the saved pick if it is a real, unlocked one, else its own default.
export function dragonSetup(profile, def) {
  const saved = profile?.dragons?.[def.id]
  const skin = isScale(saved?.scale) && isSkinUnlocked(profile?.unlocked, saved.scale, def)
  const breath = isBreath(saved?.breath) && isBreathUnlocked(profile?.unlocked, saved.breath, def)
  return { scale: skin ? saved.scale : ownSkin(def), breath: breath ? saved.breath : ownBreath(def) }
}

// The def pets.js runs for a dragon: its base def with the breath's multipliers folded in and
// the chosen scale / breath attached for the model and the bolt.
export function tuneDragon(def, setup) {
  const scale = SCALES[setup.scale] ?? SCALES[DEFAULT_SCALE]
  const breath = BREATHS[setup.breath] ?? BREATHS[DEFAULT_BREATH]
  return {
    ...def,
    color: scale.glow, // icon accent and attack particles follow the scale
    scale,
    breath,
    baseDamage: def.damage,
    specialInfo: SPECIALS[def.special] ?? null,
    damage: def.damage * (breath.damage ?? 1),
    interval: def.interval * (breath.interval ?? 1),
    range: def.range * (breath.range ?? 1),
    knockback: (def.knockback ?? 0) + (breath.knockback ?? 0),
    bolts: breath.bolts ?? 1,
    splash: breath.splash ?? 0,
    splashShare: breath.splashShare ?? 0,
    chain: breath.chain ?? 0,
    chainShare: breath.chainShare ?? 0,
    chainRange: breath.chainRange ?? 0,
  }
}

// A short description of what a dragon does with the picks, for the Dragon Den card.
export function describeDragon(tuned) {
  const hits = tuned.bolts > 1 ? `${tuned.bolts} x ${Math.round(tuned.damage)}` : `${Math.round(tuned.damage)}`
  return [
    `${hits} dmg every ${tuned.interval.toFixed(1)}s`,
    `range ${Math.round(tuned.range)}`,
    tuned.splash > 0 && `burst ${tuned.splash}`,
    tuned.chain > 0 && `chains to ${tuned.chain} more`,
    tuned.knockback > 0 && 'shoves',
    tuned.specialInfo && `special: ${tuned.specialInfo.name}`,
  ].filter(Boolean)
}

// Distance from point p to the segment a-b (all {x, z}), for a beam's width.
export function distanceToSegment(p, a, b) {
  const dx = b.x - a.x
  const dz = b.z - a.z
  const len2 = dx * dx + dz * dz
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / len2))
  return Math.hypot(p.x - (a.x + dx * t), p.z - (a.z + dz * t))
}

// Steps to the next / previous id in `ids` after `current`, wrapping.
export function cycleChoice(ids, current, dir = 1) {
  const i = ids.indexOf(current)
  if (i < 0) return ids[0]
  return ids[(i + (dir >= 0 ? 1 : ids.length - 1)) % ids.length]
}

// Enemies a breath also hits: the splash ring around the impact plus the chain arcs. `points` are
// { x, z, ref } candidates (not including the primary target). Returns [{ ref, share }].
export function breathVictims(tuned, impact, primary, candidates) {
  const out = []
  const d = (a, b) => Math.hypot(a.x - b.x, a.z - b.z)
  const used = new Set([primary])
  if (tuned.splash > 0) {
    for (const c of candidates) {
      if (used.has(c.ref) || d(c, impact) > tuned.splash) continue
      used.add(c.ref)
      out.push({ ref: c.ref, share: tuned.splashShare })
    }
  }
  if (tuned.chain > 0) {
    let from = impact
    for (let hop = 0; hop < tuned.chain; hop++) {
      let best = null
      let bestDistance = tuned.chainRange
      for (const c of candidates) {
        if (used.has(c.ref)) continue
        const dist = d(c, from)
        if (dist <= bestDistance) {
          best = c
          bestDistance = dist
        }
      }
      if (!best) break
      used.add(best.ref)
      out.push({ ref: best.ref, share: tuned.chainShare })
      from = best
    }
  }
  return out
}
