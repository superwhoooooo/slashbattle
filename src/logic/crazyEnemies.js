// Pure data: ten more regular enemies for the waves (Orbital Resort and every other place) and the Wilds, each
// with a CRAZY boss form (bigger, stranger, with four moves instead of one). `stats` goes into MONSTER_TYPES,
// `boss` into the boss roster (logic/bosses.js). `unlock` is the wave a regular one first turns up on.
// The moves are the existing boss machinery (BOSS_SPECIALS): a regular enemy has one, its boss form four.

export const CRAZY_ENEMIES = [
  {
    id: 'bumble',
    name: 'Bumblo',
    unlock: 3,
    stats: { shape: 'sphere', size: 1.2, color: 0xffc933, edgeColor: 0xfff0a0, speed: 3.2, hp: 40, damage: 6, radius: 0.55, accessory: 'wings', specials: ['charge', 'blink'], specialIntervals: { charge: 3.6, blink: 6 } },
    boss: {
      id: 'boss_bumble', name: 'QUEEN BUMBLETRON', title: 'Buzz Off (Literally)', specials: ['charge', 'barrage', 'summon', 'blink', 'spin'], score: 1650,
      stats: { shape: 'sphere', size: 4.2, color: 0xffb800, edgeColor: 0xfff0a0, speed: 2.8, hp: 1100, damage: 16, radius: 1.9, accessory: 'wings' },
      lines: ['BZZZ. I mean: good evening. BZZZZZ.', 'I have four hundred thousand children and every one of them is a stinger.', 'Please remain calm. The swarm can smell calm.'],
    },
  },
  {
    id: 'snapper',
    name: 'Snapper',
    unlock: 4,
    stats: { shape: 'box', size: 1.3, color: 0xff6a4a, edgeColor: 0xffc0a8, speed: 2.4, hp: 95, damage: 13, radius: 0.6, accessory: 'claws', specials: ['spin', 'charge'], specialIntervals: { spin: 5, charge: 6 } },
    boss: {
      id: 'boss_snapper', name: 'KING CRABULON', title: 'Sideways Supremacy', specials: ['slam', 'spin', 'charge', 'geyser'], score: 1750,
      stats: { shape: 'box', size: 3.8, color: 0xe8442a, edgeColor: 0xffc0a8, speed: 2.1, hp: 1500, damage: 22, radius: 1.6, accessory: 'claws' },
      lines: ['I walk sideways because FORWARD is for the weak.', 'Behold my claws. They are enormous. I measured them.', 'You will be snipped, and then you will be sorry, and then you will be snipped again.'],
    },
  },
  {
    id: 'sporeling',
    name: 'Sporeling',
    unlock: 3,
    stats: { shape: 'cone', size: 1.4, color: 0xe0527a, edgeColor: 0xffc0d0, speed: 1.6, hp: 85, damage: 9, radius: 0.6, accessory: 'cap', attackRange: 9, specials: ['barrage'], specialIntervals: { barrage: 5 } },
    boss: {
      id: 'boss_sporeling', name: 'GRAND SHROOMBAH', title: 'Mushroom for Improvement', specials: ['barrage', 'summon', 'spin', 'leap'], score: 1700,
      stats: { shape: 'cone', size: 4.2, color: 0xd03a6a, edgeColor: 0xffc0d0, speed: 1.9, hp: 1300, damage: 17, radius: 1.8, accessory: 'cap', attackRange: 12 },
      lines: ['Do not worry about the spores. Worry about the OTHER spores.', 'I am a fungus among men. And also a fun guy.', 'You will join the mycelium. Everyone does eventually.'],
    },
  },
  {
    id: 'boogle',
    name: 'Boogle',
    unlock: 5,
    stats: { shape: 'octahedron', size: 1.2, color: 0xcfd8ff, edgeColor: 0xffffff, speed: 2.6, hp: 45, damage: 8, radius: 0.5, accessory: 'halo', attackRange: 10, specials: ['barrage', 'blink'], specialIntervals: { barrage: 4.2, blink: 7 } },
    boss: {
      id: 'boss_boogle', name: 'PHANTOM PRINCE', title: 'Rather Dead, Quite Rude', specials: ['barrage', 'blink', 'lure', 'summon'], score: 1800,
      stats: { shape: 'octahedron', size: 3.8, color: 0xb9c6ff, edgeColor: 0xffffff, speed: 2.4, hp: 1200, damage: 17, radius: 1.5, accessory: 'halo', attackRange: 12 },
      lines: ['Boooo. Oh, you are not scared. Let me try that again. BOOOOO.', 'I died of embarrassment in the year 1203. It still stings.', 'Come closer. I will haunt you personally.'],
    },
  },
  {
    id: 'kablooma',
    name: 'Kablooma',
    unlock: 4,
    stats: { shape: 'sphere', size: 1.3, color: 0x2c2c3c, edgeColor: 0xff7a3a, speed: 2.8, hp: 55, damage: 18, radius: 0.6, accessory: 'fuse', attackRange: 1.8, noMelee: true, specials: ['leap'], specialIntervals: { leap: 3.4 } },
    boss: {
      id: 'boss_kablooma', name: 'BIG KABOOM', title: 'Short Fuse, Big Problem', specials: ['leap', 'slam', 'barrage', 'charge'], score: 1900,
      stats: { shape: 'sphere', size: 4.4, color: 0x24242f, edgeColor: 0xff7a3a, speed: 2.5, hp: 1400, damage: 21, radius: 2.0, accessory: 'fuse', specialIntervals: { leap: 4.2 } },
      lines: ['Everybody stay calm. I am very calm. TICK TICK TICK.', 'I have a short fuse. It is the length of this sentence.', 'Nobody ever listens to me until I go off.'],
    },
  },
  {
    id: 'icicle',
    name: 'Icicle',
    unlock: 6,
    stats: { shape: 'tetrahedron', size: 1.2, color: 0x9fe8ff, edgeColor: 0xffffff, speed: 2.0, hp: 60, damage: 9, radius: 0.5, accessory: 'icicles', specials: ['charge', 'barrage'], specialIntervals: { charge: 3.8, barrage: 6 } },
    boss: {
      id: 'boss_icicle', name: 'BLIZZARD BARON', title: 'Cold Open', specials: ['barrage', 'spin', 'slam', 'blink'], score: 1850,
      stats: { shape: 'tetrahedron', size: 3.8, color: 0x7fd4ff, edgeColor: 0xffffff, speed: 2.2, hp: 1250, damage: 18, radius: 1.5, accessory: 'icicles' },
      lines: ['Brrrr. That is the sound I make. I do not feel the cold.', 'I once froze a whole sandwich buffet. Nobody has forgiven me.', 'Let it go? No. LET IT SNOW.'],
    },
  },
  {
    id: 'prickle',
    name: 'Prickle Pete',
    unlock: 5,
    stats: { shape: 'cylinder', size: 1.5, color: 0x4fbf5a, edgeColor: 0xc8f5a0, speed: 1.3, hp: 110, damage: 12, radius: 0.65, accessory: 'limbs', specials: ['spin'], specialIntervals: { spin: 5 } },
    boss: {
      id: 'boss_prickle', name: 'GENERAL CACTUS', title: 'Do Not Hug (Again)', specials: ['spin', 'summon', 'slam', 'leap'], score: 1750,
      stats: { shape: 'cylinder', size: 4.0, color: 0x3fa84c, edgeColor: 0xc8f5a0, speed: 1.6, hp: 1450, damage: 20, radius: 1.7, accessory: 'limbs', specialIntervals: { leap: 5 } },
      lines: ['Soldiers! Stand tall! Stand pointy!', 'I have fought in forty deserts and lost every single hug.', 'Salute me. With oven mitts.'],
    },
  },
  {
    id: 'wispy',
    name: 'Wispy',
    unlock: 7,
    stats: { shape: 'sphere', size: 0.9, color: 0x7af0ff, edgeColor: 0xe0ffff, speed: 3.0, hp: 40, damage: 7, radius: 0.42, accessory: 'flame', specials: ['blink'], specialIntervals: { blink: 3 } },
    boss: {
      id: 'boss_wispy', name: 'WILL-O-THE-WHIMSY', title: 'Follow Me (Please Do Not)', specials: ['lure', 'blink', 'barrage', 'spin'], score: 1900,
      stats: { shape: 'sphere', size: 3.6, color: 0x5ee8ff, edgeColor: 0xe0ffff, speed: 2.6, hp: 1150, damage: 16, radius: 1.6, accessory: 'flame', attackRange: 12 },
      lines: ['Over here! No, over HERE. Now you are lost. Hello!', 'I lead travellers astray. It is a living.', 'Follow the pretty light. Everyone does. It is a problem.'],
    },
  },
  {
    id: 'drillbit',
    name: 'Drillbit',
    unlock: 6,
    stats: { shape: 'cone', size: 1.3, color: 0xb0b8c8, edgeColor: 0xeef2ff, speed: 3.4, hp: 75, damage: 12, radius: 0.55, accessory: 'horn', specials: ['charge'], specialIntervals: { charge: 3 } },
    boss: {
      id: 'boss_drillbit', name: 'DRILLZILLA', title: 'Hole in One Thousand', specials: ['charge', 'slam', 'leap', 'blink'], score: 1950,
      stats: { shape: 'cone', size: 4.2, color: 0x9aa3b8, edgeColor: 0xeef2ff, speed: 3.0, hp: 1350, damage: 20, radius: 1.8, accessory: 'horn' },
      lines: ['VRRRRRRRRRRR. Sorry, that is just how I say hello.', 'I dig. That is the whole personality. I dig, and then you are in the hole.', 'Mind the floor. I am under it.'],
    },
  },
  {
    id: 'twister',
    name: 'Twister',
    unlock: 8,
    stats: { shape: 'cylinder', size: 1.6, color: 0xa0a0ff, edgeColor: 0xe0e0ff, speed: 2.6, hp: 70, damage: 8, radius: 0.7, accessory: 'rings', specials: ['spin', 'charge'], specialIntervals: { spin: 3.5, charge: 6 } },
    boss: {
      id: 'boss_twister', name: 'CYCLONE CEO', title: 'Quarterly Gale Report', specials: ['spin', 'charge', 'barrage', 'summon'], score: 2000,
      stats: { shape: 'cylinder', size: 4.0, color: 0x8888ff, edgeColor: 0xe0e0ff, speed: 2.8, hp: 1300, damage: 17, radius: 1.7, accessory: 'rings' },
      lines: ['Let us circle back. Let us circle back. LET US CIRCLE BACK.', 'This quarter we are blowing the competition away. Literally.', 'I will be taking questions at the eye of the storm.'],
    },
  },
]

import { signatureFor } from './signatures.js'

// Each regular one also carries its own signature attack (a smaller version of its boss's idea).
// The regular ones are buffed on top of the numbers above: tougher, harder-hitting, a bit quicker, and their moves come
// round sooner.
export const CRAZY_BUFF = { hp: 1.4, damage: 1.25, speed: 1.1, cooldown: 0.8 }
const ON_HIT = {
  bumble: { status: 'poison', seconds: 4 },
  snapper: { status: 'slow', seconds: 2.5, factor: 0.55 },
  sporeling: { status: 'weaken', seconds: 5 },
  boogle: { status: 'drain', amount: 5 },
  kablooma: null,
  icicle: { status: 'slow', seconds: 3, factor: 0.4 },
  prickle: { status: 'poison', seconds: 5 },
  wispy: { status: 'drain', amount: 4 },
  drillbit: { status: 'stun' },
  twister: { status: 'slow', seconds: 2, factor: 0.6 },
}
const buffed = (e) => {
  const signature = signatureFor(e.id)
  const intervals = Object.fromEntries(Object.entries(e.stats.specialIntervals ?? {}).map(([k, v]) => [k, v * CRAZY_BUFF.cooldown]))
  return {
    ...e.stats,
    hp: Math.round(e.stats.hp * CRAZY_BUFF.hp),
    damage: Math.round(e.stats.damage * CRAZY_BUFF.damage),
    speed: +(e.stats.speed * CRAZY_BUFF.speed).toFixed(2),
    specialIntervals: intervals,
    onHit: ON_HIT[e.id], // a status it inflicts on every hit (poison, slow, weaken, drain, stun)
    trueFraction: e.id === 'kablooma' ? 0.6 : 0.4, // the share of its damage armour can't reduce
    signature: signature && { ...signature, interval: signature.interval * CRAZY_BUFF.cooldown, damageMultiplier: (signature.damageMultiplier ?? 0.6) * 1.2 },
  }
}
export const CRAZY_TYPES = Object.fromEntries(CRAZY_ENEMIES.map((e) => [e.id, buffed(e)]))
export const CRAZY_TYPE_IDS = CRAZY_ENEMIES.map((e) => e.id)
export const CRAZY_BOSS_DEFS = CRAZY_ENEMIES.map((e) => e.boss)
export const CRAZY_SCORES = Object.fromEntries(CRAZY_ENEMIES.map((e, i) => [e.id, 170 + (i % 5) * 15 + e.unlock * 4]))

// Each unlocked enemy's share of a wave's spawns: it starts small and grows, capped.
export function crazyWeights(n) {
  const weights = {}
  for (const e of CRAZY_ENEMIES) if (n >= e.unlock) weights[e.id] = Math.min(0.04 + 0.008 * (n - e.unlock), 0.075)
  return weights
}
