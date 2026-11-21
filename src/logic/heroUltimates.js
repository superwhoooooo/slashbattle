// Mastery 8: at the start of every run with a hero at mastery ULTIMATE_LEVEL or higher, you choose
// your edge for that run -- the hero's ULTIMATE (a second, far stronger ability on K, on top of B)
// or +10% to one stat of your choice (MASTERY_STAT_PICKS).
//
// Pure data + small rules (no Three.js): each ultimate is a list of effect steps that main.js's
// runUltimate plays out. Damage numbers (`dmg`) are multiples of your weapon's damage, like the
// other hero powers; `at` (seconds) delays a step. Step kinds:
//   nova    { r, dmg, kb, status? }               a blast around you
//   waves   { n, gap, r, dmg, kb, status? }       n blasts around wherever you are, `gap` s apart
//   ring    { n, radius, r, dmg, gap?, status? }  n blasts on a ring `radius` out
//   line    { n, step, r, dmg, gap?, status? }    n blasts marching out along your aim
//   strikes { n, range, r, dmg, pick, gap?, status? }  lightning on n monsters within range
//                                                 (pick: 'nearest' | 'farthest' | 'random')
//   rain    { n, range, r, dmg, gap, status? }    blasts falling on random spots near you
//   hole    { range, pull, blast, dmg, life }     a black hole where you aim
//   blades  { n, radius, dmg, turns, dur, status? } blades whirling round you
//   fan     { n, spread, reach, dmg, status? }    blades flying out along your aim and back
//   pull    { r }                                 drags every monster within r in to you
//   freeze  { r, secs }  /  confuse { r, secs }   a status on everything near
//   heal    { frac }                              heals that share of max HP
//   buff    { secs, damage?, speed?, guard?, haste?, attack? }  a big temporary boost (guard < 1 = less
//                                                 damage taken; haste / attack < 1 = faster abilities / attacks)
//   invuln  { secs }                              untouchable
//   timewarp { secs, factor }                     every monster's clock runs at `factor`
//   cast    { times, gap }                        your B ability, free, `times` times
// status: 'burn' | 'freeze' | 'confuse' | 'slow' | 'hex'

export const ULTIMATE_LEVEL = 8
export const ULTIMATE_KEY = 'KeyK'
export const STAT_PICK_BONUS = 0.1

const U = (name, cooldown, desc, steps) => ({ name, cooldown, desc, steps })

export const HERO_ULTIMATES = {
  guest: U('Grand Opening', 45, 'Three huge 10 m shockwaves for 4x each, then 8 s of +40% damage and speed.', [
    { k: 'waves', n: 3, gap: 0.45, r: 10, dmg: 4, kb: 8 },
    { k: 'buff', secs: 8, damage: 1.4, speed: 1.4 },
  ]),
  ember: U('Dragonfire Crown', 45, 'A 12 m firestorm for 5x that burns everything, then 12 fireballs rain down for 3x each.', [
    { k: 'nova', r: 12, dmg: 5, kb: 4, status: 'burn' },
    { k: 'rain', n: 12, range: 12, r: 3.5, dmg: 3, gap: 0.12, status: 'burn', at: 0.3 },
  ]),
  thorn: U('Worldroot', 50, 'Roots grip everything within 14 m for 4 s, three thorn waves hit for 4x, and you heal 50%.', [
    { k: 'freeze', r: 14, secs: 4 },
    { k: 'waves', n: 3, gap: 0.6, r: 12, dmg: 4, kb: 2 },
    { k: 'heal', frac: 0.5 },
  ]),
  gale: U('Hurricane', 45, 'A hurricane pulls everything within 16 m to you, shreds it with 5 gusts for 3x, then 8 s of double speed.', [
    { k: 'pull', r: 16 },
    { k: 'waves', n: 5, gap: 0.3, r: 8, dmg: 3, kb: 3, at: 0.2 },
    { k: 'buff', secs: 8, speed: 2 },
  ]),
  prospector: U('Gold Rush', 45, 'Mother Lode three times over, and 10 gold nuggets crash down for 4x each.', [
    { k: 'cast', times: 3, gap: 0.5 },
    { k: 'rain', n: 10, range: 12, r: 3, dmg: 4, gap: 0.15 },
  ]),
  frost: U('Absolute Zero', 50, 'Freezes everything within 18 m for 6 s, then a 12 m ice burst for 6x.', [
    { k: 'freeze', r: 18, secs: 6 },
    { k: 'nova', r: 12, dmg: 6, kb: 2, status: 'freeze', at: 0.8 },
  ]),
  monk: U('Hundred Palms', 45, 'Ten palm strikes on the nearest monsters within 14 m for 4x each, then 10 s of +60% damage.', [
    { k: 'strikes', n: 10, range: 14, r: 3, dmg: 4, pick: 'nearest', gap: 0.1 },
    { k: 'buff', secs: 10, damage: 1.6 },
  ]),
  plague: U('Black Death', 50, 'Miasma twice and a 14 m plague burst for 4x that curses and confuses everything for 5 s.', [
    { k: 'cast', times: 2, gap: 0.8 },
    { k: 'nova', r: 14, dmg: 4, kb: 1, status: 'hex' },
    { k: 'confuse', r: 14, secs: 5 },
  ]),
  moon: U('Lunar Eclipse', 50, 'Time crawls for 5 s while 12 moonbeams strike the farthest monsters within 26 m for 5x each.', [
    { k: 'timewarp', secs: 5, factor: 0.3 },
    { k: 'strikes', n: 12, range: 26, r: 3.5, dmg: 5, pick: 'farthest', gap: 0.15 },
  ]),
  forge: U('Meteor Forge', 50, 'Eruption, plus 14 molten meteors for 4x each that set everything alight, and 10 s of 40% less damage taken.', [
    { k: 'cast', times: 1 },
    { k: 'rain', n: 14, range: 13, r: 3.5, dmg: 4, gap: 0.12, status: 'burn' },
    { k: 'buff', secs: 10, guard: 0.6 },
  ]),
  sun: U('Supernova', 55, 'A blinding 16 m supernova for 8x, full heal and 3 s of invulnerability.', [
    { k: 'invuln', secs: 3 },
    { k: 'nova', r: 16, dmg: 8, kb: 10, at: 0.3 },
    { k: 'heal', frac: 1 },
  ]),
  void: U('Event Collapse', 45, 'Rift Walk three times in a row, then a black hole where you aim (20 m pull, 8 m implosion for 8x).', [
    { k: 'cast', times: 3, gap: 0.35 },
    { k: 'hole', range: 14, pull: 20, blast: 8, dmg: 8, life: 3, at: 1.1 },
  ]),
  lifeguard: U('Tsunami', 45, 'Three tidal waves 14 m wide for 4x that hurl everything away, and you heal 50%.', [
    { k: 'waves', n: 3, gap: 0.5, r: 14, dmg: 4, kb: 16 },
    { k: 'heal', frac: 0.5 },
  ]),
  bellhop: U('Lost Baggage Claim', 45, 'Luggage Avalanche three times, and 12 trunks crash down for 4x each.', [
    { k: 'cast', times: 3, gap: 0.4 },
    { k: 'rain', n: 12, range: 12, r: 3, dmg: 4, gap: 0.1 },
  ]),
  storm: U('Thunder God', 50, '24 lightning bolts hit random monsters within 20 m for 4x each, and 10 s of +50% speed.', [
    { k: 'strikes', n: 24, range: 20, r: 3, dmg: 4, pick: 'random', gap: 0.08 },
    { k: 'buff', secs: 10, speed: 1.5 },
  ]),
  bone: U('Army of the Dead', 50, 'Ossuary twice, and a 14 m bone storm for 5x that leaves everything stumbling.', [
    { k: 'cast', times: 2, gap: 0.6 },
    { k: 'nova', r: 14, dmg: 5, kb: 4, status: 'confuse' },
  ]),
  dj: U('Festival Main Stage', 50, 'Eight bass drops 10 m wide for 3x each on the beat, and 12 s of +30% attack and ability speed.', [
    { k: 'waves', n: 8, gap: 0.42, r: 10, dmg: 3, kb: 4 },
    { k: 'buff', secs: 12, haste: 0.7, attack: 0.7 },
  ]),
  hex: U('Coven Night', 50, 'Mass Hex reaches 20 m, and 10 cursed bolts hit for 5x each.', [
    { k: 'nova', r: 20, dmg: 2, kb: 0, status: 'hex' },
    { k: 'confuse', r: 20, secs: 5 },
    { k: 'strikes', n: 10, range: 20, r: 3, dmg: 5, pick: 'random', gap: 0.12, at: 0.3 },
  ]),
  echo: U('Infinite Mirror', 45, 'Mirror Self, plus three echo blasts 12 m wide for 4x and 10 s of +50% damage.', [
    { k: 'cast', times: 1 },
    { k: 'waves', n: 3, gap: 0.5, r: 12, dmg: 4, kb: 3 },
    { k: 'buff', secs: 10, damage: 1.5 },
  ]),
  clock: U('End of Time', 55, 'Time all but stops for 7 s and everything within 20 m freezes, then a 14 m chime for 6x.', [
    { k: 'timewarp', secs: 7, factor: 0.1 },
    { k: 'freeze', r: 20, secs: 5 },
    { k: 'nova', r: 14, dmg: 6, kb: 4, at: 1 },
  ]),
  chef: U('Hell\'s Kitchen', 45, 'Full heal, twelve flambés on a 6 m ring for 4x that set everything on fire, and 10 s of +40% damage.', [
    { k: 'heal', frac: 1 },
    { k: 'ring', n: 12, radius: 6, r: 3.5, dmg: 4, gap: 0.08, status: 'burn' },
    { k: 'buff', secs: 10, damage: 1.4 },
  ]),
  pirate: U('Armada', 45, 'Full Broadside twice, and 16 cannonballs pound down around you for 4x each.', [
    { k: 'cast', times: 2, gap: 0.6 },
    { k: 'rain', n: 16, range: 14, r: 3, dmg: 4, gap: 0.1 },
  ]),
  rosa: U('Garden of Thorns', 45, 'Six thorn waves 10 m wide for 3x, 8 s of 50% less damage taken, and a 40% heal.', [
    { k: 'waves', n: 6, gap: 0.4, r: 10, dmg: 3, kb: 2 },
    { k: 'buff', secs: 8, guard: 0.5 },
    { k: 'heal', frac: 0.4 },
  ]),
  valet: U('Lights Out', 45, 'Vanish, while 10 shadow strikes hit the nearest monsters for 5x each; 10 s of +60% damage.', [
    { k: 'cast', times: 1 },
    { k: 'strikes', n: 10, range: 16, r: 2.5, dmg: 5, pick: 'nearest', gap: 0.15 },
    { k: 'buff', secs: 10, damage: 1.6 },
  ]),
  astro: U('Big Bang', 50, 'Pulls everything within 18 m in, then a 14 m big bang for 8x that hurls it all off the map.', [
    { k: 'pull', r: 18 },
    { k: 'nova', r: 14, dmg: 8, kb: 24, at: 0.6 },
  ]),
  dread: U('Dark Side Storm', 45, 'Saber Storm three times over, and 6 orbiting blades whirl round you for 3x each pass.', [
    { k: 'cast', times: 3, gap: 0.5 },
    { k: 'blades', n: 6, radius: 6, dmg: 3, turns: 3, dur: 3 },
  ]),
  odie: U('Walkabout', 45, 'Boomerang Barrage three times over, and 12 boomerangs fan out all round you for 3x each.', [
    { k: 'cast', times: 3, gap: 0.45 },
    { k: 'fan', n: 12, spread: Math.PI * 2, reach: 14, dmg: 3 },
  ]),
  jackpot: U('Mega Millions', 50, 'A jackpot on the 3 nearest monsters, three times, and 12 golden coins rain down for 4x each.', [
    { k: 'cast', times: 3, gap: 0.6 },
    { k: 'rain', n: 12, range: 12, r: 3, dmg: 4, gap: 0.12 },
  ]),
  magma: U('Volcano', 50, 'Lava Ring, a 12 m eruption for 6x that burns everything, and 14 lava bombs for 3x each.', [
    { k: 'cast', times: 1 },
    { k: 'nova', r: 12, dmg: 6, kb: 6, status: 'burn' },
    { k: 'rain', n: 14, range: 14, r: 3, dmg: 3, gap: 0.12, status: 'burn', at: 0.3 },
  ]),
  hana: U('Grand Slam', 45, 'Hooks everything within 22 m and yanks it in, a 9 m slam for 7x, then a second that flings it all away for 4x.', [
    { k: 'pull', r: 22 },
    { k: 'nova', r: 9, dmg: 7, kb: 2, at: 0.5 },
    { k: 'nova', r: 9, dmg: 4, kb: 16, at: 1.1 },
  ]),
  rush: U('Light Speed', 45, 'Sonic Barrage three times, then 10 s of double speed and +40% damage.', [
    { k: 'cast', times: 3, gap: 0.35 },
    { k: 'buff', secs: 10, speed: 2, damage: 1.4 },
  ]),
  cobalt: U('Orbital Barrage', 55, 'Fifteen orbital strikes pound everything within 18 m for 6x each.', [
    { k: 'rain', n: 15, range: 18, r: 4.5, dmg: 6, gap: 0.15 },
  ]),
  kaiju: U('King of Monsters', 50, 'Kaiju Rampage, and two stomps 12 m wide for 5x, and 10 s of 40% less damage taken.', [
    { k: 'cast', times: 1 },
    { k: 'waves', n: 2, gap: 1, r: 12, dmg: 5, kb: 8 },
    { k: 'buff', secs: 10, guard: 0.6 },
  ]),
  dakota: U('Showdown', 50, 'Dead Eye, and 12 shots pick off the nearest monsters within 22 m for 5x each.', [
    { k: 'cast', times: 1 },
    { k: 'strikes', n: 12, range: 22, r: 2.5, dmg: 5, pick: 'nearest', gap: 0.12, at: 0.4 },
  ]),
  thundra: U('Ragnarok Storm', 50, 'Storm Hammer, plus 20 lightning bolts on random monsters within 20 m for 4x each.', [
    { k: 'cast', times: 1 },
    { k: 'strikes', n: 20, range: 20, r: 3.5, dmg: 4, pick: 'random', gap: 0.1 },
  ]),
  singularity: U('Big Crunch Prime', 55, 'Three black holes march out along your aim, each pulling 16 m and imploding 8 m wide for 8x.', [
    { k: 'hole', range: 6, pull: 16, blast: 8, dmg: 8, life: 3 },
    { k: 'hole', range: 13, pull: 16, blast: 8, dmg: 8, life: 3, at: 0.4 },
    { k: 'hole', range: 20, pull: 16, blast: 8, dmg: 8, life: 3, at: 0.8 },
  ]),
  phoebe: U('Eternal Flame', 50, 'Phoenix Dive three times, 4 s of invulnerability and a 60% heal.', [
    { k: 'invuln', secs: 4 },
    { k: 'cast', times: 3, gap: 0.6 },
    { k: 'heal', frac: 0.6 },
  ]),
  kenji: U('Ten Thousand Cuts', 45, 'Ninefold Strike three times in a row, and 10 s of +50% damage.', [
    { k: 'cast', times: 3, gap: 0.7 },
    { k: 'buff', secs: 10, damage: 1.5 },
  ]),
  shiro: U('Domain Expansion', 75, 'Everything within 10 m freezes for 2 s, then one Hollow Violet and a 10 m void for 4x.', [
    { k: 'freeze', r: 10, secs: 2 },
    { k: 'cast', times: 1, gap: 0.8 },
    { k: 'nova', r: 10, dmg: 4, kb: 6, at: 1.8 },
  ]),
  ranger: U('Champion\'s Ballad', 50, 'Flurry Rush twice, and 12 bomb arrows rain down for 4x each.', [
    { k: 'cast', times: 2, gap: 1 },
    { k: 'rain', n: 12, range: 14, r: 3.5, dmg: 4, gap: 0.12 },
  ]),
  ragnar: U('Fimbulwinter', 50, 'Spartan Rage at once, a 12 m frost slam for 6x that freezes everything, and Blades of Chaos.', [
    { k: 'nova', r: 12, dmg: 6, kb: 6, status: 'freeze' },
    { k: 'cast', times: 1, at: 0.3 },
  ]),
  doomguard: U('BFG Overload', 55, 'Big Fusion Gun three times along your aim, and 10 s of +50% damage.', [
    { k: 'cast', times: 3, gap: 0.6 },
    { k: 'buff', secs: 10, damage: 1.5 },
  ]),
  paolo: U('Mega Star', 50, 'Super Star, plus three 10 m ground pounds for 5x.', [
    { k: 'cast', times: 1 },
    { k: 'waves', n: 3, gap: 0.8, r: 10, dmg: 5, kb: 10 },
  ]),
  chompy: U('Ghost Buffet', 45, 'Power Pellet, a 16 m pull that drags everything in, then 4 chomps 8 m wide for 4x.', [
    { k: 'cast', times: 1 },
    { k: 'pull', r: 16 },
    { k: 'waves', n: 4, gap: 0.4, r: 8, dmg: 4, kb: 2, at: 0.4 },
  ]),
  blox: U('Creeper Party', 50, 'TNT Ring twice, then 14 more blocks of TNT fall around you for 5x each.', [
    { k: 'cast', times: 2, gap: 1.2 },
    { k: 'rain', n: 14, range: 13, r: 4, dmg: 5, gap: 0.15 },
  ]),
  haru: U('Shin Heaven Wave', 50, 'Heaven Wave three times, and 10 s of +50% damage.', [
    { k: 'cast', times: 3, gap: 0.8 },
    { k: 'buff', secs: 10, damage: 1.5 },
  ]),
  poppy: U('Super Inhale', 50, 'Mega Inhale twice, and 12 stars fly out all round you for 4x each.', [
    { k: 'cast', times: 2, gap: 1.4 },
    { k: 'fan', n: 12, spread: Math.PI * 2, reach: 16, dmg: 4 },
  ]),
  tempest: U('Storm of Storms', 60, 'The four storms break over everything within 18 m: a sand wave that shoves, a frost wave that slows, an ember wave for 4x and a mire wave for 3x that heals you 25%, with 3 s of slow time and 8 s of +40% damage.', [
    { k: 'timewarp', secs: 3, factor: 0.4 },
    { k: 'waves', n: 4, gap: 0.5, r: 18, dmg: 3, kb: 4, status: 'slow', at: 0.1 },
    { k: 'strikes', n: 10, range: 18, r: 3, dmg: 2.5, pick: 'random', gap: 0.15, at: 1.2 },
    { k: 'heal', frac: 0.25, at: 2.2 },
    { k: 'buff', secs: 8, damage: 1.4, at: 2.2 },
  ]),
  buster: U('Hyper Buster', 45, 'Buster Barrage three times over, and 10 s of +40% attack speed.', [
    { k: 'cast', times: 3, gap: 0.4 },
    { k: 'buff', secs: 10, attack: 0.6 },
  ]),
  sovereign: U('Final Judgment', 60, 'The heavens open: time slows to a crawl for 4 s, 14 pillars of light fall on monsters within 20 m for 3x each, then you Ascend and crash down, and 8 s of +30% damage.', [
    { k: 'timewarp', secs: 4, factor: 0.3 },
    { k: 'strikes', n: 14, range: 20, r: 3, dmg: 3, pick: 'random', gap: 0.15 },
    { k: 'cast', times: 1, at: 2.4 },
    { k: 'buff', secs: 8, damage: 1.3 },
  ]),
  umbral: U('Total Eclipse', 60, 'Everything within 18 m is slowed for 6 s as the world goes dark: three waves of shadow for 4x each, you heal 35%, and 8 s of +40% damage.', [
    { k: 'nova', r: 18, dmg: 1, kb: 0, status: 'slow' },
    { k: 'waves', n: 3, gap: 0.55, r: 14, dmg: 4, kb: 3, status: 'slow', at: 0.2 },
    { k: 'heal', frac: 0.35, at: 1.4 },
    { k: 'buff', secs: 8, damage: 1.4, at: 1.4 },
  ]),
  twilight: U('Grand Syzygy', 60, 'Time crawls for 4 s as 12 pillars of light fall on monsters within 20 m for 3x each, then a dusk wave slows everything within 16 m for 4x, you heal 30%, and 8 s of +40% damage.', [
    { k: 'timewarp', secs: 4, factor: 0.3 },
    { k: 'strikes', n: 12, range: 20, r: 3, dmg: 3, pick: 'random', gap: 0.15 },
    { k: 'waves', n: 2, gap: 0.55, r: 16, dmg: 4, kb: 3, status: 'slow', at: 2 },
    { k: 'heal', frac: 0.3, at: 2.4 },
    { k: 'buff', secs: 8, damage: 1.4, at: 2.4 },
  ]),
}

// The +10% stat choices, in activeFx's effect shape (maxHp is a share of base HP; main.js turns it into points).
export const MASTERY_STAT_PICKS = [
  { id: 'damage', name: 'Damage', desc: '+10% damage', fx: { damage: 1 + STAT_PICK_BONUS } },
  { id: 'maxHp', name: 'Max HP', desc: '+10% max HP', fx: { maxHpFrac: STAT_PICK_BONUS } },
  { id: 'speed', name: 'Move speed', desc: '+10% move speed', fx: { speed: 1 + STAT_PICK_BONUS } },
  { id: 'attack', name: 'Attack speed', desc: 'Attack 10% faster', fx: { cooldown: 1 - STAT_PICK_BONUS } },
  { id: 'armor', name: 'Toughness', desc: 'Take 10% less damage', fx: { damageTaken: 1 - STAT_PICK_BONUS } },
  { id: 'haste', name: 'Ability haste', desc: 'Abilities recharge 10% faster', fx: { haste: 1 - STAT_PICK_BONUS } },
  { id: 'crit', name: 'Critical hits', desc: '+10% chance to hit for double', fx: { crit: STAT_PICK_BONUS } },
  { id: 'crystal', name: 'Crystals', desc: '+10% crystals', fx: { crystal: 1 + STAT_PICK_BONUS } },
]
export const statPick = (id) => MASTERY_STAT_PICKS.find((p) => p.id === id) ?? null

// Does a hero at this mastery level get the run-start choice?
export function hasMasteryChoice(level) {
  return level >= ULTIMATE_LEVEL
}

// Ultimate cooldown state, like useHeroAbility: { used, readyAt }.
export function useUltimate(heroId, unlocked, now, readyAt, haste = 1) {
  const def = HERO_ULTIMATES[heroId]
  if (!def || !unlocked || now < readyAt) return { used: false, readyAt }
  return { used: true, readyAt: now + def.cooldown * haste }
}
// 0 = ready, 1 = just used.
export function ultimateFraction(heroId, now, readyAt, haste = 1) {
  const def = HERO_ULTIMATES[heroId]
  if (!def || now >= readyAt) return 0
  return Math.min(1, (readyAt - now) / (def.cooldown * haste))
}

// The whole ultimate's damage, in weapon-damage multiples, if every blast landed on one monster
// (for the tests' "way better than B" check). A `cast` counts as `bValue` each.
export function ultimatePower(heroId, bValue = 3) {
  const def = HERO_ULTIMATES[heroId]
  if (!def) return 0
  let total = 0
  for (const s of def.steps) {
    const each = s.dmg ?? 0
    if (s.k === 'nova') total += each
    else if (s.k === 'waves') total += each * s.n
    else if (s.k === 'ring' || s.k === 'line' || s.k === 'rain') total += each * Math.min(s.n, 3) // one monster won't stand under every blast
    else if (s.k === 'strikes') total += each * Math.min(s.n, 3)
    else if (s.k === 'hole') total += each
    else if (s.k === 'blades') total += each * s.turns
    else if (s.k === 'fan') total += each * 2
    else if (s.k === 'cast') total += bValue * s.times
    else if (s.k === 'buff' || s.k === 'heal' || s.k === 'invuln' || s.k === 'freeze' || s.k === 'timewarp') total += 3 // utility counts for something
  }
  return total
}
