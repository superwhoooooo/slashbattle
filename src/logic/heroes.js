// Playable heroes and their skins (pure data + profile rules, no Three.js).
//
// Inspired by Shardfall's character roster: each hero is the player's jelly wearing its own gear,
// with a few stat tweaks and one trait. Heroes and skins are bought with banked crystals and saved
// in the profile (`profile.hero`, `heroesOwned`, `heroSkins`, `skinsOwned`), so the pick sticks
// between visits. The Guest is free and always owned; each hero's first skin comes with it.
//
// `stats` uses the effect shape from logic/skills.js (multipliers: speed, damage, cooldown,
// damageTaken, crystal, magnet; flat: maxHp, regen, crit) plus the hero-only `dash` (a multiplier
// on the dash cooldown). `trait.id` is what main.js switches on.
// `gear` lists the parts heroGear.js builds; `mask` hides the googly face behind a mask.
// A skin: body (jelly colour), cloak (capes, hats), trim (bands, metal), glow (lenses, halos, fire).

const skin = (id, name, body, cloak, trim, glow, cost = 0) => ({ id, name, body, cloak, trim, glow, cost })

export const HEROES = [
  {
    id: 'guest', name: 'The Guest', cost: 0,
    blurb: 'Checked in, wobbly, ready. No bonuses, no strings.',
    stats: {}, trait: { id: null, name: 'Blank Slate', desc: 'No trait. Every run is what you make of it.' },
    gear: [],
    skins: [
      skin('coral', 'Coral Classic', 0xff7a5c, 0xff7a5c, 0xffd15c, 0xffffff),
      skin('mint', 'Mint Sorbet', 0x5fd4a8, 0x2f8f74, 0xffffff, 0xd8fff0, 80),
      skin('grape', 'Grape Soda', 0x9a6bff, 0x5a3aa8, 0xffd15c, 0xe8d8ff, 80),
      skin('midnight', 'Midnight Swim', 0x2c3a5c, 0x18203a, 0x6fe3d6, 0x6fe3d6, 160),
    ],
  },
  {
    id: 'ember', name: 'Ember Squire', cost: 150,
    blurb: 'A young fire-sworn knight with a singed helm.',
    stats: { damage: 1.1 }, trait: { id: 'kindling', name: 'Kindling', desc: '20% of your hits set monsters alight: 0.4x damage a second for 3 s.' },
    gear: ['helm', 'plume', 'cape'],
    skins: [
      skin('forge', 'Forge Red', 0xd9583a, 0x7a2d1a, 0x8d8a86, 0xff8a3d),
      skin('ash', 'Cold Ash', 0x8d8a86, 0x3a3a40, 0xc9c2b4, 0xffb547, 80),
      skin('blue', 'Blue Flame', 0x4a7fc0, 0x1c2c5a, 0xdfe6f5, 0x6fd8ff, 120),
      skin('gold', 'Gilded', 0xe8b84a, 0x8a3f12, 0xfff0c0, 0xff6a2a, 200),
    ],
  },
  {
    id: 'thorn', name: 'Thorn Warden', cost: 150,
    blurb: 'The forest walks with this one, slowly.',
    stats: { maxHp: 40, speed: 0.95, damageTaken: 0.88 }, trait: { id: 'bramble', name: 'Bramble Skin', desc: 'Below half health you heal 1.5 health a second.' },
    gear: ['antlers', 'leafCape'],
    skins: [
      skin('moss', 'Moss', 0x6f9e4a, 0x3e5a2c, 0x6d5233, 0xc6ff7a),
      skin('autumn', 'Autumn', 0xd98a3a, 0x7a3a1a, 0x5a3a20, 0xffd36e, 80),
      skin('frost', 'Frostbark', 0xbfe0e8, 0x5a7a8a, 0x8a9aa8, 0xeaffff, 120),
      skin('blight', 'Blight', 0x5a4a6a, 0x2a2030, 0x3a2a20, 0xa8ff5a, 200),
    ],
  },
  {
    id: 'gale', name: 'Gale Runner', cost: 150,
    blurb: 'Light boots, long scarf, never quite still.',
    stats: { speed: 1.15, maxHp: -10, dash: 0.8 }, trait: { id: 'slipstream', name: 'Slipstream', desc: 'Every dash makes you attack 35% faster for 2.5 s. Dash comes back 20% sooner.' },
    gear: ['scarf', 'goggles'],
    skins: [
      skin('sky', 'Sky', 0x7fb7c9, 0xf2f6fa, 0x2d3e48, 0xbdf3ff),
      skin('dune', 'Dune', 0xe0b070, 0xc8452f, 0x5a3a20, 0xffe07a, 80),
      skin('storm', 'Stormfront', 0x5a6a80, 0xffd15c, 0x20202e, 0xaabfff, 120),
      skin('rose', 'Rosewind', 0xff9ab8, 0xffffff, 0x8a3a5a, 0xffe0f0, 200),
    ],
  },
  {
    id: 'prospector', name: 'Prospector Pip', cost: 150,
    blurb: 'Knows what crystals are worth, and where they hide.',
    stats: { crystal: 1.25, magnet: 1.4 }, trait: { id: 'lucky', name: 'Lucky Strike', desc: '12% of your kills drop a bonus 5-crystal gem.' },
    gear: ['minerHat', 'pickaxe'],
    skins: [
      skin('dust', 'Dusty', 0xc89a6a, 0x5c4426, 0xffb547, 0xffd36e),
      skin('copper', 'Copper Vein', 0xd9734a, 0x3a2818, 0xc8452f, 0xffa25a, 80),
      skin('quartz', 'Rose Quartz', 0xffc0d0, 0x8a5a6a, 0xffffff, 0xfff4c0, 120),
      skin('obsidian', 'Obsidian', 0x2a2630, 0x141218, 0xffb547, 0xff7a2f, 200),
    ],
  },
  {
    id: 'frost', name: 'Frost Novice', cost: 400,
    blurb: 'Still learning, but the cold listens already.',
    stats: { cooldown: 0.92 }, trait: { id: 'chill', name: 'Chill Touch', desc: '15% of your hits freeze monsters for 1.2 s, and frozen monsters take 20% more damage from you.' },
    gear: ['wizardHat', 'crystals'],
    skins: [
      skin('ice', 'Glacier', 0x9fd8ff, 0x3a6aa8, 0xdff2ff, 0xbfeaff),
      skin('snow', 'Snowdrift', 0xf2f6fa, 0x8aa8c8, 0x4a7fc0, 0xd8fbff, 80),
      skin('aurora', 'Aurora', 0x6fe3a8, 0x3a2a78, 0xc77dff, 0xa8ffe0, 120),
      skin('deep', 'Deep Freeze', 0x1c3a6a, 0x0e1c3a, 0x9fd8ff, 0x6fd8ff, 200),
    ],
  },
  {
    id: 'monk', name: 'Star Monk', cost: 400,
    blurb: 'Stillness first, then a hundred blows.',
    stats: { speed: 1.1, maxHp: 10, damage: 1.05 }, trait: { id: 'focus', name: 'Inner Focus', desc: 'Stand still for 0.8 s and everything you do deals 30% more damage until you move.' },
    gear: ['halo', 'beads'],
    skins: [
      skin('saffron', 'Saffron', 0xff9a3a, 0xd9822b, 0x6a3a1a, 0xffe9a0),
      skin('jade', 'Jade', 0x4fbf8a, 0x1f6a4a, 0xe8d9c0, 0xd8ffe0, 80),
      skin('dusk', 'Dusk', 0x8a5ac8, 0x3a1a5a, 0xffc94a, 0xffd96a, 120),
      skin('stone', 'Temple Stone', 0xa8a090, 0x5a5448, 0x3a3428, 0xfff4c0, 200),
    ],
  },
  {
    id: 'plague', name: 'Plague Doctor', cost: 600,
    blurb: 'The cure is worse. That is the idea.',
    stats: { damageTaken: 0.95, regen: 0.4 }, trait: { id: 'contagion', name: 'Contagion', desc: 'Monsters you kill leave a bubbling poison puddle for 3 s that hits every monster in it for 0.5x damage every 0.5 s. Monsters the poison kills leave puddles too.' },
    gear: ['plagueHat', 'beak', 'longCape', 'lantern'],
    mask: true,
    skins: [
      skin('classic', 'Physician', 0x3a3d42, 0x23262a, 0xd8cfae, 0xd2ff5a),
      skin('crimson', 'Crimson Ward', 0x6a1c24, 0x2a1014, 0xe8d9c0, 0xff6a6a, 80),
      skin('bone', 'Bonewhite', 0xe8e2d0, 0x5a5448, 0x8a7a50, 0x7fffd0, 120),
      skin('toxic', 'Toxic Bloom', 0x4a6a2a, 0x1a2a10, 0xa8d24a, 0xc8ff3a, 200),
    ],
  },
  {
    id: 'moon', name: 'Moon Hunter', cost: 600,
    blurb: 'Never seen closer than the far side of the deck.',
    stats: { crit: 0.05, damage: 1.05 }, trait: { id: 'marksman', name: 'Marksman', desc: 'Hits deal more the farther away they land, up to +50% at 14 m.' },
    gear: ['moon', 'hood', 'quiver'],
    skins: [
      skin('night', 'Nightfall', 0x46587f, 0x2c3a5c, 0xdfe6f5, 0xe2ecff),
      skin('harvest', 'Harvest Moon', 0xd98a3a, 0x5a3010, 0xffd36e, 0xffc94a, 80),
      skin('blood', 'Blood Moon', 0x8c1c2c, 0x3a0c14, 0xe8d9c0, 0xff5a6a, 120),
      skin('eclipse', 'Eclipse', 0x1a1a24, 0x0a0a10, 0xc77dff, 0xc77dff, 200),
    ],
  },
  {
    id: 'forge', name: 'Forge Titan', cost: 600,
    blurb: 'Takes the hit. Gets hotter. Hits back.',
    stats: { maxHp: 70, speed: 0.88, damageTaken: 0.9, damage: 1.1 }, trait: { id: 'molten', name: 'Molten Core', desc: 'Each hit you take adds 10% damage for 6 s, up to 5 times.' },
    gear: ['helm', 'horns', 'plate'],
    skins: [
      skin('iron', 'Cast Iron', 0x4f4744, 0x3c3330, 0x241c18, 0xff7a2f),
      skin('bronze', 'Bronze', 0xb07a4a, 0x5a3a20, 0xe8c56a, 0xffb547, 80),
      skin('slag', 'Slag Blue', 0x3a4a5a, 0x20282e, 0x8a9aa8, 0x6fd8ff, 120),
      skin('magma', 'Magma Heart', 0x8a2a14, 0x3a0c0c, 0x241c18, 0xffd24a, 200),
    ],
  },
  {
    id: 'sun', name: 'Sun Paladin', cost: 900,
    blurb: 'Stands in front. Glows while doing it.',
    stats: { maxHp: 30, damage: 1.1, damageTaken: 0.92 }, trait: { id: 'radiance', name: 'Radiance', desc: 'A 3.5 m aura burns monsters for 0.35x damage every 0.5 s, healing you 0.5 health per hit.' },
    gear: ['halo', 'wings', 'plate'],
    skins: [
      skin('dawn', 'Dawn', 0xf0e6d0, 0xe8c56a, 0xfff4c0, 0xffd96a),
      skin('noon', 'High Noon', 0xffd15c, 0xff9a3a, 0xffffff, 0xfff0a0, 80),
      skin('dusk', 'Twilight', 0xc87aa8, 0x5a2a5a, 0xffc94a, 0xffb0e0, 120),
      skin('corona', 'Corona', 0x2a2a3a, 0x14141e, 0xffc94a, 0xff8a3d, 200),
    ],
  },
  {
    id: 'void', name: 'Void Walker', cost: 900,
    blurb: 'Steps out of the world and back in somewhere better.',
    stats: { dash: 0.7, damage: 1.1, speed: 1.05 }, trait: { id: 'phase', name: 'Phase Tear', desc: 'Every dash bursts where it began for 1.5x damage. Dash comes back 30% sooner.' },
    gear: ['horns', 'halo', 'crystals'],
    skins: [
      skin('abyss', 'Abyss', 0x3a2060, 0x1a1030, 0x2a1848, 0xc77dff),
      skin('nebula', 'Nebula', 0xff4fa3, 0x3a1a5a, 0x1a1030, 0x6fe3ff, 80),
      skin('null', 'Null', 0xe8e8f0, 0x8a8aa0, 0x2a2a3a, 0x2a2a3a, 120),
      skin('rift', 'Rift', 0x0e3a3a, 0x061818, 0x6fe3d6, 0xff4fa3, 200),
    ],
  },
]

export const HERO_IDS = HEROES.map((h) => h.id)
export const DEFAULT_HERO = 'guest'
const BY_ID = Object.fromEntries(HEROES.map((h) => [h.id, h]))

export const heroById = (id) => BY_ID[id] ?? BY_ID[DEFAULT_HERO]
export const skinKey = (heroId, skinId) => `${heroId}:${skinId}`

// The hero's stats in effect shape (logic/skills.js combineEffects ignores the hero-only `dash`).
export function heroEffects(id) {
  return { dash: 1, ...heroById(id).stats }
}

// The colours to dress the player in: the selected skin of the selected hero (falls back to the first).
export function heroLook(profile) {
  const hero = heroById(profile?.hero)
  const chosen = hero.skins.find((s) => s.id === profile?.heroSkins?.[hero.id]) ?? hero.skins[0]
  return { heroId: hero.id, gear: hero.gear, mask: hero.mask === true, ...chosen, accent: chosen.glow }
}

export const ownsHero = (profile, id) => id === DEFAULT_HERO || (profile.heroesOwned ?? []).includes(id)
export function ownsSkin(profile, heroId, skinId) {
  const hero = BY_ID[heroId]
  if (!hero) return false
  if (hero.skins[0].id === skinId) return ownsHero(profile, heroId) // the first skin comes with the hero
  return (profile.skinsOwned ?? []).includes(skinKey(heroId, skinId))
}

// Cleans the saved hero fields (unknown ids dropped; the pick falls back to what you own).
export function normalizeHeroFields(raw) {
  const heroesOwned = Array.isArray(raw?.heroesOwned) ? [...new Set(raw.heroesOwned.filter((id) => BY_ID[id] && id !== DEFAULT_HERO))] : []
  const skinsOwned = Array.isArray(raw?.skinsOwned)
    ? [...new Set(raw.skinsOwned.filter((key) => typeof key === 'string' && BY_ID[key.split(':')[0]]?.skins.some((s, i) => i > 0 && s.id === key.split(':')[1])))]
    : []
  const profileLike = { heroesOwned, skinsOwned }
  const heroSkins = {}
  for (const [heroId, skinId] of Object.entries(raw?.heroSkins ?? {})) {
    if (BY_ID[heroId] && ownsSkin(profileLike, heroId, skinId) && BY_ID[heroId].skins[0].id !== skinId) heroSkins[heroId] = skinId
  }
  const hero = BY_ID[raw?.hero] && ownsHero(profileLike, raw.hero) ? raw.hero : DEFAULT_HERO
  return { hero, heroesOwned, heroSkins, skinsOwned }
}

const fail = (profile, reason) => ({ profile, ok: false, reason })

// Unlocks hero `id` for its price in banked crystals (and picks it).
export function buyHero(profile, id) {
  const hero = BY_ID[id]
  if (!hero) return fail(profile, 'No such hero')
  if (ownsHero(profile, id)) return selectHero(profile, id)
  if (profile.bank < hero.cost) return fail(profile, `Needs ${hero.cost} ◆`)
  return { profile: { ...profile, bank: profile.bank - hero.cost, heroesOwned: [...(profile.heroesOwned ?? []), id], hero: id }, ok: true }
}

export function selectHero(profile, id) {
  if (!ownsHero(profile, id)) return fail(profile, 'Locked')
  return { profile: { ...profile, hero: id }, ok: true }
}

// Unlocks a skin (if needed) and wears it; buying a skin needs the hero first.
export function buySkin(profile, heroId, skinId) {
  const hero = BY_ID[heroId]
  const s = hero?.skins.find((k) => k.id === skinId)
  if (!s) return fail(profile, 'No such skin')
  if (!ownsHero(profile, heroId)) return fail(profile, `Unlock ${hero.name} first`)
  let next = profile
  if (!ownsSkin(profile, heroId, skinId)) {
    if (profile.bank < s.cost) return fail(profile, `Needs ${s.cost} ◆`)
    next = { ...profile, bank: profile.bank - s.cost, skinsOwned: [...(profile.skinsOwned ?? []), skinKey(heroId, skinId)] }
  }
  const heroSkins = { ...(next.heroSkins ?? {}) }
  if (hero.skins[0].id === skinId) delete heroSkins[heroId]
  else heroSkins[heroId] = skinId
  return { profile: { ...next, heroSkins, hero: heroId }, ok: true }
}

// --- trait rules (pure) ---

// Marksman: +0 at point blank up to +50% at 14 m.
export const marksmanBonus = (distance) => 1 + 0.5 * Math.min(1, Math.max(0, distance) / 14)
// Molten Core: +10% per stack, up to 5.
export const moltenBonus = (stacks) => 1 + 0.1 * Math.min(5, Math.max(0, stacks))
export const FOCUS_DELAY = 0.8 // seconds standing still before Inner Focus kicks in
