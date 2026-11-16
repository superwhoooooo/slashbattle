// Hero mastery powers (pure data + rules, no Three.js).
//
// At mastery level AWAKEN_LEVEL (4) a hero AWAKENS: its trait gets far stronger (bigger numbers, and
// for some heroes a whole new shape -- Thundra's hammer hangs in the air for 10 s and follows your aim,
// Kaiju Kiddo's breath becomes a held beam you sweep around, Deadeye Dakota's High Noon slows time for
// 6 s) and it unlocks its HERO ABILITY, an active move on B (gamepad: click a stick; touch: the hero
// slot) with its own cooldown.
//
// `traitTune(traitId, awake)` returns the numbers main.js's trait code runs on; the base values are
// the traits as they always were, so an un-awakened hero plays exactly the same.

import { masteryLevel } from './progress.js'

export const AWAKEN_LEVEL = 4
export const isAwakened = (xp = 0) => masteryLevel(xp) >= AWAKEN_LEVEL
export const HERO_ABILITY_KEY = 'KeyB'

// [base, awakened] numbers per trait id (the awakened set only lists what changes).
const TUNING = {
  kindling: [{ chance: 0.2, dps: 0.4, burn: 3, spread: false }, { chance: 0.4, dps: 0.7, burn: 4, spread: true }],
  bramble: [{ regen: 1.5, rootRadius: 5, rootTime: 2, rootDamage: 1, rootCooldown: 20 }, { regen: 4, rootRadius: 8, rootTime: 3.5, rootDamage: 2, rootCooldown: 10 }],
  slipstream: [{ haste: 1.35, time: 2.5, gust: 0 }, { haste: 1.7, time: 4, gust: 1 }],
  lucky: [{ chance: 0.15, damage: 1, radius: 3, gems: 1 }, { chance: 0.4, damage: 2, radius: 4.5, gems: 3 }],
  chill: [{ chance: 0.15, freeze: 1.2, bonus: 1.2 }, { chance: 0.35, freeze: 2.5, bonus: 1.5 }],
  focus: [{ delay: 0.8, bonus: 1.3, linger: 0 }, { delay: 0.3, bonus: 1.7, linger: 1.5 }],
  contagion: [{ life: 3, radius: 2.2, damage: 0.5, cap: 10 }, { life: 6, radius: 3.2, damage: 1, cap: 20 }],
  marksman: [{ max: 0.5 }, { max: 1.2 }],
  molten: [{ per: 0.1, stacks: 5, time: 6 }, { per: 0.2, stacks: 8, time: 10 }],
  radiance: [{ radius: 3.5, damage: 0.35, heal: 0.5 }, { radius: 6, damage: 0.8, heal: 1.2 }],
  phase: [{ damage: 1.5, radius: 2.6, endBurst: false }, { damage: 3, radius: 4, endBurst: true }],
  whistle: [{ below: 0.3, cooldown: 30, radius: 6, damage: 1, heal: 25 }, { below: 0.5, cooldown: 15, radius: 9, damage: 2, heal: 50 }],
  tipjar: [{ minChain: 3, tipMult: 1, cases: 1, damage: 1 }, { minChain: 2, tipMult: 2, cases: 2, damage: 2.5 }],
  static: [{ every: 6, targets: 3, range: 7, damage: 1 }, { every: 3, targets: 5, range: 10, damage: 1.5 }],
  corpse: [{ damage: 0.6, radius: 3 }, { damage: 1.5, radius: 4.5 }],
  bassdrop: [{ cooldown: 8, radius: 4, damage: 1 }, { cooldown: 3, radius: 6, damage: 2 }],
  hex: [{ bonus: 1.15, time: 4, spread: 0 }, { bonus: 1.4, time: 8, spread: 5 }],
  echo: [{ every: 3, mult: 0.6 }, { every: 2, mult: 1 }],
  rewind: [{ cooldown: 45, minHp: 0.3, slow: 0 }, { cooldown: 20, minHp: 0.6, slow: 3 }],
  seconds: [{ every: 6, heal: 0.12, damage: 1, radius: 3.5 }, { every: 3, heal: 0.2, damage: 2, radius: 5 }],
  broadside: [{ cooldown: 9, blasts: 3, damage: 1.2, radius: 2 }, { cooldown: 3, blasts: 5, damage: 2, radius: 2.8 }],
  thorns: [{ damage: 0.8, radius: 3 }, { damage: 2, radius: 5 }],
  backstab: [{ bonus: 1.6, vanish: 0 }, { bonus: 2.5, vanish: 2 }],
  zerog: [{ ringOut: 3 }, { ringOut: 5 }],
  saber: [{ chance: 0.75, reach: 12, damage: 1.2, twinEvery: 3, twinCount: 2 }, { chance: 1, reach: 18, damage: 2, twinEvery: 2, twinCount: 3 }],
  boomerang: [{ every: 4, reach: 9, damage: 0.7, count: 1 }, { every: 2, reach: 14, damage: 1.5, count: 2 }],
  jackpot: [{ chance: 0.1, damage: 2, crystals: 6, radius: 3.5 }, { chance: 0.25, damage: 4, crystals: 12, radius: 5 }],
  hotfoot: [{ life: 3, damage: 0.4, radius: 0.9, minSpeed: 1.2 }, { life: 6, damage: 1, radius: 1.5, minSpeed: 0.3 }],
  hookshot: [{ cooldown: 6, count: 1, damage: 1, stun: 1.2 }, { cooldown: 2.5, count: 3, damage: 2, stun: 2.5 }],
  ram: [{ damage: 0.9, boomDamage: 1, boomRadius: 3, minSpeed: 1.2 }, { damage: 2, boomDamage: 2.5, boomRadius: 5, minSpeed: 0.85 }],
  orbital: [{ every: 10, damage: 4, radius: 5, delay: 1.5 }, { every: 4, damage: 6, radius: 7, delay: 1 }],
  atomic: [{ every: 10, reach: 14, damage: 1.6, hold: 0, tick: 0.2, tickDamage: 0.5 }, { every: 10, reach: 20, damage: 1.6, hold: 6, tick: 0.2, tickDamage: 0.5 }],
  highnoon: [{ cooldown: 16, slow: 1.3, factor: 0.4, marks: 6, range: 16, damage: 2, boost: 1 }, { cooldown: 10, slow: 6, factor: 0.2, marks: 12, range: 24, damage: 3, boost: 1.5 }],
  hammer: [{ every: 4, reach: 11, hover: 0 }, { every: 4, reach: 11, hover: 10 }],
  blackhole: [{ cooldown: 9, life: 2, pull: 8, blast: 4, damage: 3 }, { cooldown: 4, life: 3, pull: 12, blast: 6, damage: 5 }],
  rebirth: [{ burnChance: 0.25, cooldown: 60, riseHp: 0.5, damage: 3, radius: 6 }, { burnChance: 0.5, cooldown: 25, riseHp: 1, damage: 6, radius: 9 }],
  thousandcuts: [{ cooldown: 9, max: 7, hop: 8, damage: 1.6 }, { cooldown: 4, max: 12, hop: 12, damage: 2.5 }],
  // Legendary heroes.
  limitless: [{ wall: 1.7, orbRadius: 2, cooldown: 7, pull: 6, blast: 3.5, damage: 2, life: 1.2, red: 0 }, { wall: 2.6, orbRadius: 3, cooldown: 3.5, pull: 9, blast: 5, damage: 3.5, life: 1.5, red: 3 }],
  fuse: [{ every: 5, arrows: 1, reach: 16, damage: 2.2, radius: 3.5 }, { every: 3, arrows: 3, reach: 20, damage: 3, radius: 4.5 }],
  spartan: [{ max: 30, time: 8, bonus: 1.5, heal: 0.02, radius: 3, damage: 1 }, { max: 20, time: 10, bonus: 2, heal: 0.04, radius: 4.5, damage: 1.5 }],
  glorykill: [{ below: 0.25, bossBelow: 0, heal: 0.06, gems: 4 }, { below: 0.4, bossBelow: 0.08, heal: 0.1, gems: 8 }],
  stomp: [{ cooldown: 6, damage: 2.5, radius: 4, daze: 1.5, coins: 1 }, { cooldown: 3, damage: 4, radius: 5.5, daze: 2.5, coins: 2 }],
  pellet: [{ every: 12, time: 5, damage: 3, radius: 18 }, { every: 6, time: 8, damage: 5, radius: 24 }],
  tnt: [{ every: 5, fuse: 1.5, damage: 3, radius: 4, blocks: 1 }, { every: 3, fuse: 1.2, damage: 5, radius: 5.5, blocks: 2 }],
  hadoken: [{ every: 4, reach: 15, damage: 2, pierce: false, size: 1 }, { every: 2, reach: 20, damage: 3, pierce: true, size: 1.4 }],
  inhale: [{ cooldown: 8, radius: 6, stars: 1, damage: 2.5 }, { cooldown: 4, radius: 9, stars: 3, damage: 3.5 }],
  charge: [{ charge: 3, reach: 18, damage: 3, width: 1.2 }, { charge: 1.5, reach: 22, damage: 5, width: 1.8 }],
}
const cache = new Map()
export function traitTune(traitId, awake = false) {
  const key = `${traitId}:${awake}`
  if (!cache.has(key)) {
    const pair = TUNING[traitId]
    cache.set(key, pair ? Object.freeze({ ...pair[0], ...(awake ? pair[1] : {}) }) : Object.freeze({}))
  }
  return cache.get(key)
}
export const TUNED_TRAITS = Object.keys(TUNING)

// What awakening does, per hero id (shown in the hub). `stats` stacks on the hero's own (skills effect shape).
export const AWAKENED = {
  guest: { desc: 'Blank Slate, filled in: +15% damage, +10% speed and +25 max health.', stats: { damage: 1.15, speed: 1.1, maxHp: 25 } },
  ember: { desc: '40% of hits burn for 0.7x a second for 4 s, and anything that dies burning bursts into a fire blast that lights everything near it.' },
  thorn: { desc: 'Regen 4 health a second below half; the roots reach 8 m, hold for 3.5 s, hit for 2x and come back every 10 s.' },
  gale: { desc: 'Every dash makes you attack 70% faster for 4 s and leaves a gust that hits everything near where it began.' },
  prospector: { desc: '40% of kills crack a geode: a 4.5 m blast for 2x and three 5-crystal gems.' },
  frost: { desc: '35% of hits freeze for 2.5 s, and frozen monsters take 50% more from you.' },
  monk: { desc: 'Focus after 0.3 s of stillness for +70% damage, and it lingers 1.5 s after you move.' },
  plague: { desc: 'Plague pools last 6 s, spread 3.2 m and hit for 1x every 0.5 s.' },
  moon: { desc: 'Distant hits deal up to +120% damage.' },
  forge: { desc: 'Each hit you take adds 20% damage for 10 s, up to 8 times.' },
  sun: { desc: 'A 6 m aura burns for 0.8x every 0.5 s and heals 1.2 per monster burned.' },
  void: { desc: 'Dashes tear open BOTH ends: 3x bursts, 4 m wide.' },
  lifeguard: { desc: 'The whistle blows below 50% health, every 15 s: 9 m, 2x, and heals 50.' },
  bellhop: { desc: 'Tips start at a chain of 2 and pay double, and two suitcases fly for 2.5x each.' },
  storm: { desc: 'Every 3rd hit arcs into 5 monsters within 10 m for 1.5x.' },
  bone: { desc: 'Bone bursts hit for 1.5x within 4.5 m.' },
  dj: { desc: 'The bass drops every 3 s: 6 m, 2x.' },
  hex: { desc: 'Curses last 8 s and add 40% damage, and a cursed monster that dies curses everything within 5 m.' },
  echo: { desc: 'Every 2nd hit echoes, at full damage.' },
  clock: { desc: 'Rewind every 20 s to at least 60% health, and time crawls for 3 s afterwards.' },
  chef: { desc: 'Every 3rd kill serves a dish: heal 20%, and the flambé hits 5 m for 2x.' },
  pirate: { desc: 'A broadside every 3 s: five blasts of 2x each.' },
  rosa: { desc: 'Thorns burst 5 m wide for 2x.' },
  valet: { desc: 'Backstabs deal +150%, and a backstab kill turns you invisible for 2 s.' },
  astro: { desc: 'Hits shove even farther, and ring-outs score five times the points.', stats: { knockback: 1.5 } },
  dread: { desc: 'EVERY attack hurls a blade 18 m for 2x, and every 2nd throw splits into three.' },
  odie: { desc: 'Every 2nd hit throws TWO boomerangs that loop 14 m for 1.5x.' },
  jackpot: { desc: '1 in 4 hits pays out: a 5 m coin blast for 4x and 12 crystals.' },
  magma: { desc: 'Even walking leaves lava: footprints last 6 s, 1.5 m wide, 1x every 0.5 s.' },
  hana: { desc: 'Every 2.5 s the hook catches the 3 farthest monsters, stunning them 2.5 s for 2x.' },
  rush: { desc: 'Any running counts: rams hit for 2x, and each dash booms 5 m wide for 2.5x.' },
  cobalt: { desc: 'Orbital Strike every 4 kills: 7 m wide, 6x, and it lands faster.' },
  kaiju: { desc: 'Atomic Breath becomes a 20 m beam you HOLD for 6 s: it follows your aim and burns everything it sweeps.' },
  dakota: { desc: 'High Noon every 10 s: time nearly stops for 6 s, 12 monsters within 24 m are marked for 3x, and your hits deal +50% until the clock starts again.' },
  thundra: { desc: 'The hammer stays out for 10 s: it hovers wherever you aim, smashing what it touches and calling lightning every second, then flies home.' },
  singularity: { desc: 'A black hole every 4 s: it pulls 12 m for 3 s, then implodes 6 m wide for 5x.' },
  phoebe: { desc: 'Half your hits burn. Rebirth every 25 s, at full health, in a 9 m nova for 6x.' },
  kenji: { desc: 'Thousand Cuts every 4 s: up to 12 monsters, 12 m apart, for 2.5x each.' },
  shiro: { desc: 'Infinity widens to 2.6 m and swallows orbs 3 m out. Blue every 3.5 s, 9 m pull, 3.5x crush, and every Blue fires Reversal Red: three repelling blasts down your aim.', stats: { damageTaken: 0.85 } },
  ranger: { desc: 'Every 3rd hit looses THREE fused arrows in a fan: 20 m, 3x within 4.5 m each.' },
  ragnar: { desc: 'Rage fills at 20 and lasts 10 s: double damage, each hit heals 4% and quakes 4.5 m for 1.5x.' },
  doomguard: { desc: 'Glory Kill anything at 40% health, and even bosses at 8%: a 10% heal and twice the crystals.' },
  paolo: { desc: 'A ground pound every 3 s: 4x within 5.5 m, dizzy for 2.5 s, two coins each.' },
  chompy: { desc: 'A power pellet every 6 kills: 8 s of panic across 24 m, and every chomp is 5x.' },
  blox: { desc: 'Every 3rd hit drops TWO TNT blocks with shorter fuses: 5x within 5.5 m each.' },
  haru: { desc: 'A fireball every 2nd hit: bigger, 20 m, 3x, and it tears through everything in its path.' },
  poppy: { desc: 'Inhale every 4 s across 9 m, then spit three stars for 3.5x each.' },
  buster: { desc: 'The cannon charges in 1.5 s, and the shot is a wide 22 m beam of plasma for 5x.' },
}

// Each hero's active ability, unlocked at AWAKEN_LEVEL. `range` (if any) is how far from you it can be aimed.
export const HERO_ABILITIES = {
  guest: { name: 'Early Checkout', cooldown: 18, desc: 'A 6 m shockwave for 2x that shoves everything away.' },
  ember: { name: 'Wildfire', cooldown: 20, desc: 'A 7 m fire nova for 2x that sets everything alight.' },
  thorn: { name: 'Overgrowth', cooldown: 24, desc: 'Roots everything within 9 m for 4 s, hits for 1.5x and heals you 30.' },
  gale: { name: 'Tailwind', cooldown: 20, desc: 'A 6 m gale that hurls monsters away, then 5 s of 1.5x speed and attack speed.' },
  prospector: { name: 'Strike It Rich', cooldown: 28, desc: 'Five geodes burst around you, each a blast that drops gems.' },
  frost: { name: 'Deep Freeze', cooldown: 24, desc: 'Freezes everything within 10 m for 3.5 s.' },
  monk: { name: 'Starfall Palm', cooldown: 20, desc: 'A 6 m palm strike for 3x, and Inner Focus stays on for 8 s however much you move.' },
  plague: { name: 'Miasma', cooldown: 24, desc: 'Seven plague pools bloom around you.' },
  moon: { name: 'Moonfall', cooldown: 20, desc: 'Moonbeams strike the 5 farthest monsters within 22 m for 3x.' },
  forge: { name: 'Eruption', cooldown: 24, desc: 'A 5 m slam for 2.5x, and Molten Core is maxed out for 8 s.' },
  sun: { name: 'Solar Flare', cooldown: 32, desc: 'An 8 m flare for 2.5x that heals you 40%.' },
  void: { name: 'Rift Walk', cooldown: 12, range: 12, desc: 'Teleport to where you aim, bursting at both ends for 3x.' },
  lifeguard: { name: 'Riptide', cooldown: 22, desc: 'A 9 m wave for 2x that hurls everything back, and heals you 30.' },
  bellhop: { name: 'Luggage Avalanche', cooldown: 20, desc: 'Eight suitcases fly at the nearest monsters for 2x each.' },
  storm: { name: 'Tempest', cooldown: 20, desc: 'Lightning strikes 8 monsters within 14 m for 2x each.' },
  bone: { name: 'Ossuary', cooldown: 20, desc: 'Every monster within 10 m bursts with bone shards for 1.5x.' },
  dj: { name: 'Drop the Beat', cooldown: 20, desc: 'Four bass drops on the beat, 6 m wide, 1.5x each.' },
  hex: { name: 'Mass Hex', cooldown: 24, desc: 'Curses everything within 14 m for 10 s and leaves them stumbling for 3 s.' },
  echo: { name: 'Mirror Self', cooldown: 24, desc: 'For 6 s every hit echoes at full damage.' },
  clock: { name: 'Time Stop', cooldown: 34, desc: 'Freezes everything within 14 m for 3 s and slows time for 5 s.' },
  chef: { name: 'Banquet', cooldown: 30, desc: 'Heal 35%, and three flambés go off around you.' },
  pirate: { name: 'Full Broadside', cooldown: 20, desc: 'Twelve cannon blasts sweep out along your aim, 2x each.' },
  rosa: { name: 'Briar Ring', cooldown: 20, desc: 'Three waves of thorns 6 m wide for 1.5x, and you heal 20.' },
  valet: { name: 'Vanish', cooldown: 20, desc: 'Invisible for 4 s, and every hit is a backstab meanwhile.' },
  astro: { name: 'Gravity Flip', cooldown: 20, desc: 'Flings every monster within 10 m away, hard, for 1.5x.' },
  dread: { name: 'Saber Storm', cooldown: 18, desc: 'Eight plasma blades whirl out all around you and back, 2x each.' },
  odie: { name: 'Boomerang Barrage', cooldown: 18, desc: 'Six boomerangs fan out along your aim, 1.5x each, both ways.' },
  jackpot: { name: 'Hit the Jackpot', cooldown: 24, desc: 'A guaranteed jackpot on the 3 nearest monsters.' },
  magma: { name: 'Lava Ring', cooldown: 20, desc: 'A ring of lava 4 m around you that burns for 6 s.' },
  hana: { name: 'Chain Reel', cooldown: 18, desc: 'Hooks up to 6 monsters within 16 m and yanks them all in.' },
  rush: { name: 'Sonic Barrage', cooldown: 15, desc: 'Five sonic booms march out along your aim, 2x each.' },
  cobalt: { name: 'Carpet Bomb', cooldown: 30, desc: 'Five orbital strikes walk out along your aim, 4x each.' },
  kaiju: { name: 'Kaiju Rampage', cooldown: 24, desc: 'Roar out a held Atomic Breath beam right now.' },
  dakota: { name: 'Dead Eye', cooldown: 24, desc: 'High Noon, right now, at its awakened strength.' },
  thundra: { name: 'Storm Hammer', cooldown: 24, desc: 'Hurl the hovering storm hammer right now.' },
  singularity: { name: 'Big Crunch', cooldown: 30, range: 14, desc: 'A huge black hole where you aim: pulls 16 m for 3 s, implodes 7 m wide for 6x.' },
  phoebe: { name: 'Phoenix Dive', cooldown: 20, desc: 'A 7 m fire nova for 4x that sets everything alight, and 1 s of invulnerability.' },
  kenji: { name: 'Ninefold Strike', cooldown: 18, desc: 'Thousand Cuts right now, through up to 9 monsters.' },
  shiro: { name: 'Hollow Violet', cooldown: 30, desc: 'Blue and Red collide into an imaginary mass: a huge violet sphere tears 34 m along your aim, erasing everything in its way for 6x.' },
  ranger: { name: 'Flurry Rush', cooldown: 20, desc: 'Time slows to a crawl and you flash-slash the 8 nearest monsters within 12 m for 2x each.' },
  ragnar: { name: 'Blades of Chaos', cooldown: 18, desc: 'Two burning chained blades whirl around you twice, 5.5 m out, 2x each pass and setting monsters alight; rage fills.' },
  doomguard: { name: 'Big Fusion Gun', cooldown: 30, desc: 'A slow green orb that zaps everything within 6 m as it flies 26 m along your aim, then detonates 6 m wide for 5x.' },
  paolo: { name: 'Super Star', cooldown: 26, desc: '6 s of invincibility at 1.5x speed: every monster you touch takes 2x and goes flying.' },
  chompy: { name: 'Power Pellet', cooldown: 25, desc: 'Gobble a power pellet right now, at its awakened strength.' },
  blox: { name: 'TNT Ring', cooldown: 22, desc: 'Eight blocks of TNT around you, 5 m out, all blowing at once for 4x.' },
  haru: { name: 'Heaven Wave', cooldown: 22, desc: 'Gather your energy and unleash a 22 m wave beam for 5x that shoves everything back.' },
  poppy: { name: 'Mega Inhale', cooldown: 22, desc: 'Inhale everything within 14 m, then spit five stars in a fan for 3.5x each.' },
  buster: { name: 'Buster Barrage', cooldown: 18, desc: 'Five fully charged shots fan out along your aim, awakened strength.' },
}

// The hero-only stats awakening adds (empty if none).
export const awakenedStats = (heroId) => AWAKENED[heroId]?.stats ?? {}

// Hero ability cooldown state: `readyAt` (seconds). Returns { used, readyAt }.
export function useHeroAbility(heroId, awake, now, readyAt, haste = 1) {
  const def = HERO_ABILITIES[heroId]
  if (!def || !awake || now < readyAt) return { used: false, readyAt }
  return { used: true, readyAt: now + def.cooldown * haste }
}
// 0 = ready, 1 = just used.
export function heroAbilityFraction(heroId, now, readyAt, haste = 1) {
  const def = HERO_ABILITIES[heroId]
  if (!def || now >= readyAt) return 0
  return Math.min(1, (readyAt - now) / (def.cooldown * haste))
}

// Thundra's storm hammer drifts toward the aim point at up to `speed` m/s (never past it).
export function steerToward(at, target, speed, dt) {
  const dx = target.x - at.x
  const dz = target.z - at.z
  const d = Math.hypot(dx, dz)
  const step = speed * dt
  if (d <= step || d < 1e-6) return { x: target.x, z: target.z }
  return { x: at.x + (dx / d) * step, z: at.z + (dz / d) * step }
}
// Kaiju's held beam turns toward the aim at up to `rate` rad/s (shortest way round).
export function turnToward(angle, target, rate, dt) {
  let diff = ((target - angle + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI
  const step = rate * dt
  if (Math.abs(diff) <= step) return target
  return angle + Math.sign(diff) * step
}
// Points spread evenly along a line from `from` along `angle`: `count` of them, `step` apart, starting `start` out.
export function pointsAlong(from, angle, count, step, start = step) {
  return Array.from({ length: count }, (_, i) => ({ x: from.x + Math.sin(angle) * (start + step * i), z: from.z + Math.cos(angle) * (start + step * i) }))
}
// Points on a ring around `at`.
export function ringPoints(at, count, radius, offset = 0) {
  return Array.from({ length: count }, (_, i) => {
    const a = offset + (i / count) * Math.PI * 2
    return { x: at.x + Math.sin(a) * radius, z: at.z + Math.cos(a) * radius }
  })
}
