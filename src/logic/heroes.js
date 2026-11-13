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
    stats: { maxHp: 40, speed: 0.95, damageTaken: 0.88 }, trait: { id: 'bramble', name: 'Bramble Skin', desc: 'Below half health you heal 1.5 health a second. The moment you drop below half, roots burst out: monsters within 5 m are rooted for 2 s and hit for 1x (once every 20 s).' },
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
    stats: { crystal: 1.25, magnet: 1.4 }, trait: { id: 'lucky', name: 'Mother Lode', desc: '15% of your kills crack open a geode: a blast hits everything within 3 m for 1x and drops a bonus 5-crystal gem.' },
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
    stats: { damageTaken: 0.95, regen: 0.4 }, trait: { id: 'contagion', name: 'Contagion', desc: 'Monsters you kill leave a pool of plague ooze for 3 s that hits every monster in it for 0.5x damage every 0.5 s. Monsters the poison kills leave puddles too.' },
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
  {
    id: 'lifeguard', name: 'Lifeguard Lou', cost: 150,
    blurb: 'On duty since the resort opened. Has never once sat down.',
    stats: { maxHp: 20, speed: 1.05 }, trait: { id: 'whistle', name: 'Rescue Whistle', desc: 'Drop below 30% health and you blow the whistle: monsters within 6 m are hurled back and hit for 1x, and you heal 25. Once every 30 s.' },
    gear: ['visor', 'whistle', 'floatRing'],
    skins: [
      skin('red', 'On Duty', 0xff6a4d, 0xfff4e0, 0xffffff, 0xffd15c),
      skin('teal', 'Pool Deck', 0x19b5a5, 0xffffff, 0xff6a4d, 0xffffff, 80),
      skin('night', 'Night Shift', 0x2c3a5c, 0x18203a, 0xffd15c, 0x6fe3d6, 120),
      skin('gold', 'Hall of Fame', 0xe8b84a, 0xfff4e0, 0x8a3f12, 0xfff0a0, 200),
    ],
  },
  {
    id: 'bellhop', name: 'Bellhop Max', cost: 150,
    blurb: 'Carries your bags, your tips, and a grudge.',
    stats: { crystal: 1.1, speed: 1.08 }, trait: { id: 'tipjar', name: 'Tip Jar', desc: 'Once your kill chain reaches 3, every kill in it drops an extra crystal (two at x5 and up) and flings a suitcase at the nearest monster for 1x, knocking it flying.' },
    gear: ['pillbox', 'tray'],
    skins: [
      skin('classic', 'Lobby Red', 0xc8452f, 0x8a1c1c, 0xffd15c, 0xfff0c0),
      skin('emerald', 'Emerald Suite', 0x2f8f74, 0x14503f, 0xffd15c, 0xd8fff0, 80),
      skin('royal', 'Royal Purple', 0x6a3aa8, 0x3a1a5a, 0xffc94a, 0xffe9a0, 120),
      skin('penthouse', 'Penthouse', 0x1a1a24, 0x0a0a10, 0xe8e2d0, 0xffd15c, 200),
    ],
  },
  {
    id: 'storm', name: 'Storm Acolyte', cost: 400,
    blurb: 'Hums faintly. Hair stands up when they walk in.',
    stats: { cooldown: 0.95, crit: 0.03 }, trait: { id: 'static', name: 'Static Charge', desc: 'Every 6th hit arcs lightning into the 3 nearest monsters within 7 m for 1x damage.' },
    gear: ['rod', 'crystals'],
    skins: [
      skin('charge', 'Charged', 0x4a7fc0, 0x2c4a78, 0xdff2ff, 0xfff27a),
      skin('violet', 'Violet Arc', 0x8a5ac8, 0x3a1a5a, 0xe8d8ff, 0xd8a8ff, 80),
      skin('red', 'Red Sprite', 0xc8452f, 0x5a1010, 0xffd36e, 0xff8a6a, 120),
      skin('ion', 'Ionized', 0xe8f6ff, 0x8aa8c8, 0x2a2a3a, 0x6fe3ff, 200),
    ],
  },
  {
    id: 'bone', name: 'Bone Caller', cost: 400,
    blurb: 'Nothing that dies nearby stays quiet.',
    stats: { maxHp: -5, regen: 0.3 }, trait: { id: 'corpse', name: 'Bone Burst', desc: 'Monsters you kill burst into bone shards that hit everything within 3 m for 0.6x. A burst kill bursts too.' },
    gear: ['skull', 'ribs', 'cape'],
    mask: true,
    skins: [
      skin('grave', 'Gravekeeper', 0x24222c, 0x17151c, 0xe6e0cc, 0x6fffc8),
      skin('ember', 'Pyre', 0x3a1a14, 0x1a0c0a, 0xe8d9c0, 0xff7a2f, 80),
      skin('frost', 'Frost Crypt', 0x3a4a6a, 0x1c2840, 0xeaf6ff, 0x9fd8ff, 120),
      skin('gilded', 'Gilded Tomb', 0x2a2414, 0x14100a, 0xffc94a, 0xff4fa3, 200),
    ],
  },
  {
    id: 'dj', name: 'DJ Bass Drop', cost: 400,
    blurb: 'Resident DJ of the Neon Nightclub. The drop is a weapon.',
    stats: { speed: 1.05, cooldown: 0.95 }, trait: { id: 'bassdrop', name: 'Bass Drop', desc: 'Every 8 s your next hit drops the bass: a shockwave hits everything within 4 m for 1x and knocks it back.' },
    gear: ['headphones', 'shades'],
    skins: [
      skin('neon', 'Neon', 0xff4fa3, 0x2a1848, 0x1a1030, 0x6fe3ff),
      skin('lime', 'Acid', 0x9ae04a, 0x1a2a10, 0x20202e, 0xfff27a, 80),
      skin('chrome', 'Chrome', 0xc8d0dc, 0x5a6070, 0x20202e, 0xff4fa3, 120),
      skin('sunset', 'Sunset Set', 0xff9a3a, 0x8a3f12, 0x2a1014, 0xc77dff, 200),
    ],
  },
  {
    id: 'hex', name: 'Hex Witch', cost: 600,
    blurb: 'Every grudge she ever held still works.',
    stats: { crit: 0.05 }, trait: { id: 'hex', name: 'Hexed', desc: 'Your hits curse monsters for 4 s: cursed monsters take 15% more damage from everything, pets and traits included.' },
    gear: ['witchHat', 'crystals'],
    skins: [
      skin('night', 'Nightshade', 0x43245e, 0x2d1740, 0x9ae04a, 0xa8ff5a),
      skin('swamp', 'Bog', 0x4a5a2a, 0x1a2a10, 0xc8a050, 0xffd36e, 80),
      skin('candy', 'Candy Coven', 0xff9ab8, 0x8a3a5a, 0xffffff, 0xff4fa3, 120),
      skin('ash', 'Ashen', 0x5a5a60, 0x24222c, 0xc9c2b4, 0xff6a6a, 200),
    ],
  },
  {
    id: 'echo', name: 'Echo Twin', cost: 600,
    blurb: 'There were always two of them. Check again.',
    stats: { speed: 1.08, damage: 0.95, cooldown: 0.92 }, trait: { id: 'echo', name: 'Echo Self', desc: 'A ghostly twin trails you. Every 3rd hit echoes 0.4 s later for 60% damage.' },
    gear: ['echo', 'hood'],
    skins: [
      skin('mist', 'Mist', 0x3a3a50, 0x20202e, 0x9ab0d0, 0xaabfff),
      skin('rose', 'Rose Echo', 0xc87aa8, 0x5a2a5a, 0xffe0f0, 0xffb0e0, 80),
      skin('void', 'Void Echo', 0x14141e, 0x0a0a10, 0xc77dff, 0xc77dff, 120),
      skin('gold', 'Gilded Echo', 0xe8c56a, 0x8a6a2a, 0xfff4c0, 0xfff0a0, 200),
    ],
  },
  {
    id: 'clock', name: 'Clockwork Sage', cost: 900,
    blurb: 'Late for nothing. Has checked.',
    stats: { haste: 0.85, speed: 0.96 }, trait: { id: 'rewind', name: 'Rewind', desc: 'A blow that would knock you out instead winds you back 3 s: your spot and health from then (at least 30%). Once every 45 s.' },
    gear: ['topHat', 'monocle', 'gear'],
    skins: [
      skin('brass', 'Brass', 0x7a5a24, 0x3a2a10, 0xe9c46a, 0x8ae8ff),
      skin('silver', 'Silverwork', 0x8a9aa8, 0x2a2a3a, 0xdfe6f5, 0x6fe3d6, 80),
      skin('copper', 'Copperpot', 0xb05a2a, 0x3a1a0c, 0xffb547, 0xfff27a, 120),
      skin('midnight', 'Midnight Hour', 0x1c2440, 0x0e1220, 0xffc94a, 0xff4fa3, 200),
    ],
  },
  {
    id: 'chef', name: 'Chef Flambé', cost: 150,
    blurb: 'Runs the resort kitchen. Cooks with whatever falls on the deck.',
    stats: { maxHp: 20, regen: 0.2 }, trait: { id: 'seconds', name: 'Flambé!', desc: 'Every 6th kill serves a dish: you heal 12% of your max health and the pan goes up in flames, hitting everything within 3.5 m for 1x and setting it alight.' },
    gear: ['chefHat', 'mustache'],
    skins: [
      skin('whites', 'Kitchen Whites', 0xf4ede0, 0xffffff, 0xc8452f, 0xffd15c),
      skin('pastry', 'Pastry Pink', 0xffb0c8, 0xfff4f8, 0x8a3a5a, 0xfff0a0, 80),
      skin('grill', 'Grill Master', 0x5a3a2a, 0x20202e, 0xff7a2f, 0xffb547, 120),
      skin('truffle', 'Truffle', 0x3a2a24, 0xe8d9c0, 0xffd15c, 0xfff4c0, 200),
    ],
  },
  {
    id: 'pirate', name: 'Captain Gully', cost: 400,
    blurb: 'Lost the ship, kept the hat. Still fires the cannons.',
    stats: { damage: 1.05, knockback: 1.15 }, trait: { id: 'broadside', name: 'Broadside', desc: 'Every 9 s your next hit fires a broadside: three cannon blasts march out past the target, each hitting everything within 2 m for 1.2x.' },
    gear: ['tricorn', 'eyepatch', 'cape'],
    skins: [
      skin('sea', 'High Seas', 0x3a6a9a, 0x20202e, 0xffc94a, 0xfff0a0),
      skin('red', 'Redbeard', 0xc8452f, 0x2a1014, 0xe8c56a, 0xffb547, 80),
      skin('ghost', 'Ghost Ship', 0x9fe8d8, 0x2a3a3a, 0xdfe6f5, 0x6fffd0, 120),
      skin('royal', 'Admiral', 0xf0e6d0, 0x1c2c5a, 0xffd15c, 0xffe9a0, 200),
    ],
  },
  {
    id: 'rosa', name: 'Rosa Thornheart', cost: 400,
    blurb: 'Tends the resort gardens. The roses bite back.',
    stats: { maxHp: 25, damageTaken: 0.94 }, trait: { id: 'thorns', name: 'Thorns', desc: 'Whenever you get hurt, thorns burst out of you: everything within 3 m takes 0.8x damage and is shoved away.' },
    gear: ['flowerCrown', 'leafCape'],
    skins: [
      skin('rose', 'Red Rose', 0xd94a5a, 0x3e5a2c, 0x6d5233, 0xffe0e8),
      skin('lily', 'White Lily', 0xf2f0e6, 0x4f8a4a, 0xffd15c, 0xffffff, 80),
      skin('violet', 'Violet', 0x8a5ac8, 0x2f5a3a, 0xffd15c, 0xe8d8ff, 120),
      skin('night', 'Nightbloom', 0x24223a, 0x14281c, 0xc77dff, 0x6fe3ff, 200),
    ],
  },
  {
    id: 'valet', name: 'Shadow Valet', cost: 600,
    blurb: 'Parks your car. Nobody ever sees them do it.',
    stats: { speed: 1.12, crit: 0.06, maxHp: -15 }, trait: { id: 'backstab', name: 'Backstab', desc: "Hits on a monster's back, or on one that hasn't spotted you yet, deal 60% more damage." },
    gear: ['headband', 'kunai'],
    skins: [
      skin('ink', 'Ink', 0x2a2a34, 0x14141e, 0xc8452f, 0xff6a6a),
      skin('smoke', 'Smoke', 0x8a8a96, 0x3a3a44, 0x2a2a34, 0xdfe6f5, 80),
      skin('sakura', 'Sakura', 0xffb0c8, 0x8a3a5a, 0xffffff, 0xff4fa3, 120),
      skin('jade', 'Jade Lotus', 0x1f6a4a, 0x0e2a20, 0xffd15c, 0x6fffc8, 200),
    ],
  },
  {
    id: 'astro', name: 'Cosmo Nova', cost: 900,
    blurb: 'Fell off a space station once. Liked it.',
    stats: { knockback: 1.6, speed: 1.05 }, trait: { id: 'zerog', name: 'Zero-G', desc: 'Your hits shove monsters 60% farther, and every guest you knock off the edge scores triple points.' },
    gear: ['bubbleHelmet', 'jetpack'],
    skins: [
      skin('nasa', 'Mission White', 0xf2f6fa, 0xdfe6f5, 0xff6a2a, 0x9fd8ff),
      skin('mars', 'Red Planet', 0xd9734a, 0x5a2a1a, 0xffd36e, 0xffb547, 80),
      skin('nebula', 'Nebula', 0x6a3aa8, 0x1a1030, 0xff4fa3, 0x6fe3ff, 120),
      skin('gold', 'Gold Visor', 0x2a2a3a, 0x14141e, 0xffc94a, 0xffd96a, 200),
    ],
  },
  {
    id: 'dread', name: 'Dread Lord Vexar', cost: 900,
    blurb: 'Black armour, heavy breathing, a plasma blade that never stays sheathed.',
    stats: { damage: 1.1, damageTaken: 0.92, speed: 0.95, maxHp: 20 }, mask: true,
    trait: { id: 'saber', name: 'Plasma Wake', desc: 'Half your attacks are trailed by a spinning plasma blade that flies 9 m along your aim, slicing everything it passes for 0.8x.' },
    gear: ['dreadHelm', 'longCape', 'chestPanel', 'saberHilt'],
    skins: [
      skin('crimson', 'Crimson Blade', 0x22222a, 0x0c0c10, 0x6a6e78, 0xff2a2a),
      skin('azure', 'Azure Blade', 0x2a2f3a, 0x10141c, 0xb8c0cc, 0x3aa8ff, 120),
      skin('emerald', 'Emerald Blade', 0x24302a, 0x0e1612, 0x9aa49c, 0x3aff6a, 120),
      skin('amethyst', 'Amethyst Blade', 0x2c2434, 0x120e18, 0xc8b8d8, 0xb44aff, 200),
    ],
  },
  {
    id: 'odie', name: 'Outback Odie', cost: 400,
    blurb: 'Throws it, catches it, never once checked where it was going.',
    stats: { speed: 1.06, crit: 0.03 },
    trait: { id: 'boomerang', name: 'Boomerang', desc: 'Every 4th hit flings a boomerang that loops 9 m out and back to you, hitting everything on the way out and again on the way back for 0.7x.' },
    gear: ['bushHat', 'boomerangBack'],
    skins: [
      skin('khaki', 'Khaki', 0xd9a86a, 0x8a6a3a, 0xc8452f, 0xffd36e),
      skin('outback', 'Red Centre', 0xc8603a, 0x5a3a20, 0xffe0a0, 0xff9a4a, 80),
      skin('reef', 'Reef', 0x3ac0c8, 0xf2e6c8, 0xff6a8a, 0xbdfff6, 120),
      skin('dreamtime', 'Dreamtime', 0x3a2a24, 0x1a120e, 0xffd15c, 0xff7a2f, 200),
    ],
  },
  {
    id: 'jackpot', name: 'Lady Jackpot', cost: 600,
    blurb: 'Plays the slots with every swing. The house always wins; she is the house.',
    stats: { crit: 0.04, crystal: 1.1 },
    trait: { id: 'jackpot', name: 'Jackpot', desc: 'Every hit spins the reels: 1 in 10 hits pays out, a coin blast hits everything within 3.5 m for 2x and sprays 6 crystals.' },
    gear: ['topHat', 'dice'],
    skins: [
      skin('velvet', 'Velvet', 0xb0283a, 0x2a0a12, 0xffd15c, 0xffe07a),
      skin('emerald', 'Card Table', 0x2a7a4a, 0x0e2a1a, 0xffffff, 0xffd15c, 80),
      skin('neon', 'Neon Strip', 0xff4fa3, 0x1a1030, 0x6fe3ff, 0xfff27a, 120),
      skin('platinum', 'High Roller', 0xe8e8f0, 0x2a2a34, 0xc8c8d8, 0xb8f0ff, 200),
    ],
  },
  {
    id: 'magma', name: 'Magma Marge', cost: 600,
    blurb: 'Retired volcano. Still erupts when she runs late.',
    stats: { maxHp: 30, speed: 1.04, dash: 0.85 },
    trait: { id: 'hotfoot', name: 'Hot Foot', desc: 'Sprinting or dashing leaves burning footprints for 3 s that hit monsters standing in them for 0.4x every 0.5 s. Dash comes back 15% sooner.' },
    gear: ['magmaCrown', 'lavaDrips'],
    skins: [
      skin('basalt', 'Basalt', 0x3a2a28, 0x1a1210, 0x5a4a44, 0xff6a1a),
      skin('pumice', 'Pumice', 0xb8aca0, 0x6a5e54, 0x8a7a6a, 0xffb547, 80),
      skin('blue', 'Blue Lava', 0x1c2a3a, 0x0e141c, 0x4a5a6a, 0x3ad8ff, 120),
      skin('obsidian', 'Obsidian Bloom', 0x14101a, 0x08060c, 0x6a3a8a, 0xff3ac8, 200),
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

// Gives a skin for free (hero mastery rewards): owned from now on, but not worn automatically.
// `index` is the skin's place in the hero's list; the first skin always comes with the hero.
export function grantSkin(profile, heroId, index) {
  const sk = BY_ID[heroId]?.skins[index]
  if (!sk || index === 0 || ownsSkin(profile, heroId, sk.id)) return profile
  return { ...profile, skinsOwned: [...(profile.skinsOwned ?? []), skinKey(heroId, sk.id)] }
}

// --- trait rules (pure) ---

// Marksman: +0 at point blank up to +50% at 14 m.
export const marksmanBonus = (distance) => 1 + 0.5 * Math.min(1, Math.max(0, distance) / 14)
// Tip Jar: extra crystals for a kill at chain length `count`.
export const tipJarCrystals = (count) => (count >= 5 ? 2 : count >= 3 ? 1 : 0)
export const STATIC_EVERY = 6 // hits per Static Charge arc
export const ECHO_EVERY = 3 // hits per echo
export const HEX_BONUS = 1.15
// Rewind: the snapshot from ~3 s back, with at least 30% health.
export function rewindTarget(history, now, maxHp) {
  const past = history.find((h) => now - h.t <= 3.2) ?? history[history.length - 1]
  if (!past) return null
  return { x: past.x, z: past.z, hp: Math.max(past.hp, Math.ceil(maxHp * 0.3)) }
}
// Molten Core: +10% per stack, up to 5.
export const moltenBonus = (stacks) => 1 + 0.1 * Math.min(5, Math.max(0, stacks))
export const FOCUS_DELAY = 0.8 // seconds standing still before Inner Focus kicks in
export const SECONDS_EVERY = 6 // kills per Seconds, Please dish
export const BROADSIDE_COOLDOWN = 9
// Broadside: three blast spots marching out past the target, away from the shooter.
export function broadsideSpots(from, target, step = 2.5) {
  const dx = target.x - from.x
  const dz = target.z - from.z
  const len = Math.hypot(dx, dz) || 1
  return [0, 1, 2].map((i) => ({ x: target.x + (dx / len) * step * i, z: target.z + (dz / len) * step * i }))
}
// Backstab: is the attacker at `from` behind a monster at `at` facing `rotationY` (forward = +z rotated)?
export function isBehind(at, rotationY, from) {
  const fx = Math.sin(rotationY)
  const fz = Math.cos(rotationY)
  const dx = from.x - at.x
  const dz = from.z - at.z
  const len = Math.hypot(dx, dz) || 1
  return (fx * dx + fz * dz) / len < -0.25
}

// Plasma Wake: half your attacks launch a blade. The blade's spot `t` (0..1) along its flight.
export const SABER_CHANCE = 0.5
export const SABER_REACH = 9
export function saberPoint(from, angle, t, reach = SABER_REACH) {
  const d = reach * (1 - (1 - t) * (1 - t)) // fast out, easing off
  return { x: from.x + Math.sin(angle) * d, z: from.z + Math.cos(angle) * d }
}
// Boomerang: loops `reach` out along `angle`, bowing to one side going out and the other coming
// back, and ends on `home` (where the thrower is now). t in 0..1; the return leg starts at 0.5.
export const BOOMERANG_EVERY = 4
export function boomerangPoint(from, home, angle, t, reach = 9, bow = 2.4) {
  const ox = from.x + (home.x - from.x) * t
  const oz = from.z + (home.z - from.z) * t
  const out = reach * Math.sin(Math.PI * t)
  const side = bow * Math.sin(2 * Math.PI * t)
  const fx = Math.sin(angle)
  const fz = Math.cos(angle)
  return { x: ox + fx * out + fz * side, z: oz + fz * out - fx * side }
}
// Jackpot: one hit in ten pays out; the reels shown for it (three of a kind on a win).
export const JACKPOT_CHANCE = 0.1
const REELS = ['7', '★', '◆', '♣', '♥', '$']
export function spinReels(rng = Math.random) {
  if (rng() < JACKPOT_CHANCE) {
    const s = REELS[Math.floor(rng() * REELS.length)]
    return { win: true, reels: [s, s, s] }
  }
  const a = Math.floor(rng() * REELS.length)
  const b = (a + 1 + Math.floor(rng() * (REELS.length - 1))) % REELS.length // never three alike
  return { win: false, reels: [REELS[a], REELS[b], REELS[Math.floor(rng() * REELS.length)]] }
}
// Hot Foot: a footprint every this many metres covered while running fast.
export const HOTFOOT_STEP = 1.1
export const HOTFOOT_MAX = 18
// Thorn Warden's roots: fire on the frame health first crosses below half (and the cooldown is up).
export const ROOTS_COOLDOWN = 20
export const rootsTriggered = (lastHp, hp, maxHp, now, readyAt) => lastHp !== null && lastHp >= maxHp / 2 && hp > 0 && hp < maxHp / 2 && now >= readyAt
