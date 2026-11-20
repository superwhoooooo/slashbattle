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
    stats: { damage: 1.15, damageTaken: 0.9, speed: 0.97, maxHp: 25 }, mask: true,
    trait: { id: 'saber', name: 'Plasma Wake', desc: '3 in 4 attacks hurl a spinning plasma blade 12 m along your aim and back again, slicing everything both ways for 1.2x. Every 3rd throw splits into twin blades.' },
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
  // --- Five heroes after classic action-game archetypes (original characters, their own looks) ---
  {
    id: 'hana', name: 'Hookshot Hana', cost: 1200,
    blurb: 'A masked ninja with a chain hook. Nobody gets away from her. Literally.',
    stats: { speed: 1.05, crit: 0.04 },
    trait: { id: 'hookshot', name: 'Get Over Here!', desc: 'Every 6 s, a hit fires a chain hook at the farthest monster within 13 m: it is yanked right up to you, stunned and hit for 1x. Bosses are only dragged partway.' },
    gear: ['hoodScarf', 'hookChain'],
    skins: [
      skin('ember', 'Ember Clan', 0xe8b84a, 0x2a2a30, 0x8d8a86, 0xff6a2a),
      skin('frost', 'Frost Clan', 0x6fa8e8, 0x1c2c5a, 0xdfe6f5, 0x9fe8ff, 80),
      skin('venom', 'Venom Clan', 0x5fd46a, 0x14281c, 0x2a2a30, 0xc8ff4a, 120),
      skin('shadow', 'Shadow Clan', 0x3a3a48, 0x0e0e14, 0xb44aff, 0xff3ac8, 200),
    ],
  },
  {
    id: 'rush', name: 'Rush Rocket', cost: 1400,
    blurb: 'Too fast to stop, too fast to steer. Gotta go, always.',
    stats: { speed: 1.1, dash: 0.7, maxHp: -10 },
    trait: { id: 'ram', name: 'Sonic Boom', desc: 'Sprinting or dashing turns you into a missile: anything you run into takes 0.9x and is blasted away. Every dash leaves a sonic boom (1x within 3 m). Dash comes back 30% sooner.' },
    gear: ['goggles', 'boosterFins'],
    skins: [
      skin('cobalt', 'Cobalt Blur', 0x2f6bff, 0x1c2c5a, 0xff3a3a, 0x9fe8ff),
      skin('crimson', 'Red Streak', 0xe8403a, 0x5a1a14, 0xffffff, 0xffd15c, 80),
      skin('lime', 'Lime Zoom', 0x8ad43a, 0x2a4a14, 0xff6a2a, 0xfff27a, 120),
      skin('chrome', 'Chrome Comet', 0xd8dce4, 0x3a3e48, 0x6fe3ff, 0x6fe3ff, 200),
    ],
  },
  {
    id: 'cobalt', name: 'Commander Cobalt', cost: 1600,
    blurb: 'Space marine on shore leave. Still has a satellite on speed dial.',
    stats: { maxHp: 20, damageTaken: 0.95 }, mask: true,
    trait: { id: 'orbital', name: 'Orbital Strike', desc: 'Every 10 kills, a satellite paints the biggest crowd within 18 m. 1.5 s later a beam from the sky hits everything within 5 m for 4x.' },
    gear: ['visorHelm', 'shoulderPads', 'antenna'],
    skins: [
      skin('olive', 'Olive Drab', 0x5a7a3a, 0x3a4a24, 0x8d8a86, 0xffb547),
      skin('arctic', 'Arctic Ops', 0xe8eef4, 0x9aa4b0, 0x3a3e48, 0x6fe3ff, 80),
      skin('crimson', 'Red Team', 0xb0283a, 0x4a1018, 0xc8c2b4, 0xff6a6a, 120),
      skin('gold', 'Legendary', 0xe8b84a, 0x8a5a14, 0xfff0c0, 0x6fffc8, 200),
    ],
  },
  {
    id: 'kaiju', name: 'Kaiju Kiddo', cost: 1600,
    blurb: 'Hatched under the resort pool. Already bigger than the lifeguard.',
    stats: { maxHp: 30, damage: 1.05, speed: 0.96 },
    trait: { id: 'atomic', name: 'Atomic Breath', desc: 'Every hit charges your glowing back plates; on the 10th you ROAR a 14 m beam along your aim that hits everything in its path for 1.6x and shoves it back.' },
    gear: ['dorsalPlates', 'kaijuTail'],
    skins: [
      skin('classic', 'Atomic', 0x3a5a4a, 0x24382c, 0x8d9a8a, 0x6fe3ff),
      skin('magma', 'Burning', 0x3a2420, 0x1a0e0c, 0x8a4a2a, 0xff5a1a, 80),
      skin('space', 'Space Beast', 0x4a2a6a, 0x24143a, 0xc8b8d8, 0xff4fa3, 120),
      skin('gold', 'Three-Headed Gold', 0xe8c04a, 0x8a6a14, 0xfff0c0, 0xfff27a, 200),
    ],
  },
  {
    id: 'dakota', name: 'Deadeye Dakota', cost: 1400,
    blurb: 'Rode into the resort at sundown. It is always high noon somewhere.',
    stats: { crit: 0.05, speed: 1.03 },
    trait: { id: 'highnoon', name: 'High Noon', desc: 'Every 16 s your next hit stops the clock: time slows, up to 6 monsters within 16 m are marked, then you fan the hammer for 2x on each.' },
    gear: ['cowboyHat', 'poncho'],
    skins: [
      skin('dust', 'Dust Devil', 0xd9a86a, 0x6a4a2a, 0xc8c2b4, 0xff3a3a),
      skin('midnight', 'Midnight Rider', 0x2a2a3a, 0x14141e, 0xc8c8d8, 0x6fe3ff, 80),
      skin('sunset', 'Sunset', 0xff8a5a, 0x8a2a3a, 0xffd15c, 0xfff27a, 120),
      skin('ghost', 'Ghost Town', 0xe8f0f4, 0x8aa4b0, 0x3a3e48, 0x6fffc8, 200),
    ],
  },
  // --- Premium heroes (2200): the big, flashy traits ---
  {
    id: 'thundra', name: 'Thundra Stormborn', cost: 2200,
    blurb: 'Sky warrior with a hammer that always comes home. Brings the weather with it.',
    stats: { damage: 1.12, maxHp: 25, knockback: 1.2 },
    trait: { id: 'hammer', name: 'Hammer Recall', desc: 'Every 4th hit hurls a lightning hammer 11 m along your aim. Where it turns, lightning strikes (1.8x within 3.5 m), then it flies back to your hand through everything for 1x.' },
    gear: ['wingedHelm', 'hammerBack'],
    skins: [
      skin('storm', 'Stormborn', 0xd8c09a, 0xb0283a, 0xc8ced6, 0x6fd8ff),
      skin('frost', 'Frost Giant', 0x9fc8e8, 0x1c2c5a, 0xdfe6f5, 0xbdfff6, 120),
      skin('gold', 'Asgold', 0xe8b84a, 0x3a2a6a, 0xfff0c0, 0xfff27a, 200),
      skin('void', 'Dark Thunder', 0x3a3448, 0x14101e, 0x8a8a9a, 0xb44aff, 300),
    ],
  },
  {
    id: 'singularity', name: 'Professor Singularity', cost: 2200,
    blurb: 'Split the atom, then the resort. Carries a pocket black hole for emergencies.',
    stats: { cooldown: 0.9, crit: 0.03 },
    trait: { id: 'blackhole', name: 'Event Horizon', desc: 'Every 9 s a hit tears open a black hole on its target: for 2 s it drags in everything within 8 m, then it implodes for 3x within 4 m.' },
    gear: ['wildHair', 'atomRings'],
    skins: [
      skin('lab', 'Lab Coat', 0xf2f0e6, 0xdfe6f5, 0x3a3e48, 0xb44aff),
      skin('quantum', 'Quantum', 0x2a3a6a, 0x14141e, 0x6fe3ff, 0x6fe3ff, 120),
      skin('antimatter', 'Antimatter', 0x1a1a1e, 0x08080c, 0xff4fa3, 0xff4fa3, 200),
      skin('supernova', 'Supernova', 0xffd36e, 0x8a3f12, 0xffffff, 0xff6a2a, 300),
    ],
  },
  {
    id: 'phoebe', name: 'Phoenix Phoebe', cost: 2200,
    blurb: 'Has died eleven times. Got better every time.',
    stats: { maxHp: 15, regen: 0.4, speed: 1.04 },
    trait: { id: 'rebirth', name: 'Rebirth', desc: 'A quarter of your hits set monsters alight. Once a minute, a killing blow instead explodes you in a 6 m fire nova (3x, sets everything alight) and you rise again at half health.' },
    gear: ['flameCrest', 'flameWings'],
    skins: [
      skin('flame', 'Firebird', 0xff6a2a, 0xffb547, 0xffd15c, 0xffe07a),
      skin('blue', 'Blue Phoenix', 0x3a8aff, 0x6fd8ff, 0xdfe6f5, 0xbdfff6, 120),
      skin('shadow', 'Shadowflame', 0x2a1a3a, 0x8a3ac8, 0xc77dff, 0xb44aff, 200),
      skin('jade', 'Jade Bird', 0x2fbf8a, 0x8affc8, 0xffd15c, 0xd8fff0, 300),
    ],
  },
  {
    id: 'kenji', name: 'Kenji Ninefold', cost: 2200,
    blurb: 'A wandering swordsman. You will not see the cut. You will see the bill.',
    stats: { speed: 1.08, crit: 0.08, maxHp: -10 },
    trait: { id: 'thousandcuts', name: 'Thousand Cuts', desc: 'Every 9 s your next hit becomes a lightning-fast chain: you flash through up to 7 monsters (each within 8 m of the last) for 1.6x each, untouchable while you do.' },
    gear: ['topknot', 'katanaBack'],
    skins: [
      skin('ronin', 'Ronin', 0xe8d8b8, 0x3a2a4a, 0xc8452f, 0xff6a6a),
      skin('crane', 'White Crane', 0xf2f6fa, 0xdfe6f5, 0x2a2a34, 0x6fe3ff, 120),
      skin('oni', 'Oni Mask', 0xc8303a, 0x2a0a12, 0xffd15c, 0xffb547, 200),
      skin('moon', 'Moonlit Blade', 0x2a3048, 0x10141e, 0xc8c8d8, 0xb8f0ff, 300),
    ],
  },
  // --- Legendary heroes (2500-3000): original characters riffing on famous game heroes' signature moves ---
  {
    id: 'shiro', name: 'Shiro the Limitless', cost: 3000,
    blurb: 'The strongest sorcerer at the resort, and he knows it. The blindfold is for everyone else\'s sake.',
    stats: { damage: 1.03, maxHp: -10, crit: 0.02 }, mask: true,
    trait: { id: 'limitless', name: 'Infinity', desc: 'Infinity flickers on for 2 s out of every 9: while it is up, regular monsters are held back 1.2 m from you and enemy orbs touching you vanish (bosses walk straight through it). Every 12 s a hit casts Blue on its target: a small vortex that drags in everything within 4 m, then crushes it for 1.2x.' },
    gear: ['whiteHair', 'blindfold', 'highCollar'],
    skins: [
      skin('limitless', 'Limitless', 0x23263a, 0x14162a, 0xf4f6ff, 0x6fc8ff),
      skin('red', 'Reversal Red', 0x2a1a22, 0x14080c, 0xf4f6ff, 0xff3a4a, 400),
      skin('violet', 'Hollow Violet', 0x2a1f44, 0x150f26, 0xe8e0ff, 0xb44aff, 600),
      skin('domain', 'Unlimited Void', 0x0c0c14, 0x05050a, 0xffffff, 0xfff27a, 900),
    ],
  },
  {
    id: 'ranger', name: 'Sky Ranger Kai', cost: 2800,
    blurb: 'Woke up in a cave with no memory and a very good bow. Glues bombs to arrows. It works.',
    stats: { speed: 1.06, damage: 1.08, maxHp: 15 },
    trait: { id: 'fuse', name: 'Fuse Arrows', desc: 'Every 5th hit looses a bomb-fused arrow along your aim: it flies 16 m and blows up on the first monster it meets for 2.2x within 3.5 m.' },
    gear: ['pointyEars', 'rangerScarf', 'swordShield'],
    skins: [
      skin('champion', 'Champion Blue', 0x3a7ac8, 0x24508a, 0xd8c08a, 0x6fffe0),
      skin('wild', 'Wild Green', 0x4a8a3a, 0x2a5a24, 0xc8a06a, 0xbdff6f, 300),
      skin('ancient', 'Ancient Tech', 0x3a4048, 0xd86a2a, 0xc8ced6, 0x4fe8ff, 450),
      skin('sky', 'Sky Islands', 0xf2f0e6, 0x2f8f74, 0xd8b84a, 0x7dffb0, 700),
    ],
  },
  {
    id: 'ragnar', name: 'Ragnar Ashfather', cost: 2800,
    blurb: 'Retired from killing gods. Came to the resort for some peace and quiet. Did not get it. BOY.',
    stats: { maxHp: 40, damage: 1.1, speed: 0.97, damageTaken: 0.92 },
    trait: { id: 'spartan', name: 'Spartan Rage', desc: 'Every hit you land builds rage, and every hit you take builds more. At 20 you ENRAGE for 10 s: +75% damage, take 30% less, move 20% faster, and each hit heals 3% and quakes the ground 3.5 m around it for 1.5x.' },
    gear: ['ashBeard', 'warPaint', 'axeBack'],
    skins: [
      skin('ash', 'Ghost of Ash', 0xe0dcd4, 0x6a4a2a, 0xc8302a, 0xff5a2a),
      skin('frost', 'Frozen Axe', 0xd8e4ec, 0x3a4a6a, 0x3a6ac8, 0x8fe8ff, 300),
      skin('valkyrie', 'Valkyrie Gold', 0xe8dcc8, 0x8a5a14, 0xe8b84a, 0xfff27a, 450),
      skin('chaos', 'Blades of Chaos', 0x2a2224, 0x14080a, 0xff3a1a, 0xff8a1a, 700),
    ],
  },
  {
    id: 'doomguard', name: 'Doomguard Rex', cost: 2600,
    blurb: 'Rip. Tear. Check out late. The front desk stopped asking him to keep it down.',
    stats: { damage: 1.15, maxHp: 30, speed: 1.04, damageTaken: 0.95 }, mask: true,
    trait: { id: 'glorykill', name: 'Glory Kill', desc: 'Hit a monster at or under 25% health (not a boss) and you finish it on the spot: it bursts into a 6% heal and a shower of crystals.' },
    gear: ['slayerHelm', 'shoulderPads'],
    skins: [
      skin('praetor', 'Praetor Green', 0x4a6a3a, 0x2e3a24, 0x8d8a86, 0xffb547),
      skin('crimson', 'Crimson Hell', 0x8a2a2a, 0x3a0e0e, 0x4a4040, 0xff5a1a, 300),
      skin('phobos', 'Phobos Grey', 0x8a8e94, 0x3a3e48, 0xd8dce4, 0x6fe3ff, 450),
      skin('gold', 'Night Sentinel', 0xc8a050, 0x5a4214, 0x2a2a30, 0xfff27a, 700),
    ],
  },
  {
    id: 'paolo', name: 'Pipeworks Paolo', cost: 2500,
    blurb: 'A plumber who jumps on things for a living. The resort called about the pool drains.',
    stats: { speed: 1.05, maxHp: 10, crystal: 1.15 },
    trait: { id: 'stomp', name: 'Ground Pound', desc: 'Every 6 s your next hit bounces you onto the target in a ground pound: 2.5x within 4 m, everything flattened dizzy for 1.5 s, and a coin (crystal) pops out of each.' },
    gear: ['plumberCap', 'mustache', 'overalls'],
    skins: [
      skin('classic', 'Classic Red', 0x2f4fd0, 0xd8262a, 0xffd15c, 0xffffff),
      skin('fire', 'Fire Flower', 0xd8262a, 0xf4f0e6, 0xffd15c, 0xff8a1a, 300),
      skin('green', 'Little Brother', 0x2a3a9a, 0x2fa04a, 0xffd15c, 0xbdff6f, 450),
      skin('gold', 'Gold Coin', 0xe8b84a, 0xfff0a0, 0xffffff, 0xfff27a, 700),
    ],
  },
  {
    id: 'chompy', name: 'Chompy Champ', cost: 2500,
    blurb: 'Has been running from ghosts in a maze since 1980-something. Finally fighting back.',
    stats: { speed: 1.08, magnet: 1.3 },
    trait: { id: 'pellet', name: 'Power Pellet', desc: 'Every 12 kills you gobble a power pellet: for 5 s monsters panic and stumble about, and touching one CHOMPS it for 3x.' },
    gear: ['arcadeCap', 'ghostOrbit'],
    skins: [
      skin('arcade', 'Arcade Yellow', 0xffd83a, 0x2a3ad8, 0xffffff, 0xff4fa3),
      skin('bow', 'Hair Bow', 0xffd83a, 0xff3a5a, 0x2a3ad8, 0xff8ac8, 300),
      skin('maze', 'Neon Maze', 0x3a5aff, 0x14143a, 0xffd83a, 0x6fe3ff, 450),
      skin('cherry', 'Cherry Bonus', 0xe8283a, 0x2f8f3a, 0xffffff, 0xfff27a, 700),
    ],
  },
  {
    id: 'blox', name: 'Blox the Builder', cost: 2500,
    blurb: 'Punched a tree on day one. Now punches monsters. Carries a frankly unsafe amount of TNT.',
    stats: { maxHp: 15, damage: 1.06, crystal: 1.1 }, mask: true,
    trait: { id: 'tnt', name: 'Primed TNT', desc: 'Every 5th hit drops a block of TNT on the target. It blinks, hisses, and 1.5 s later blows up for 3x within 4 m.' },
    gear: ['blockHead', 'pickaxe'],
    skins: [
      skin('overworld', 'Overworld', 0x3ab0c8, 0x5a3a1e, 0xc8a07a, 0x6fffa0),
      skin('nether', 'Nether', 0x8a2a2a, 0x2a0e0e, 0xd8a07a, 0xff8a1a, 300),
      skin('diamond', 'Full Diamond', 0x6fe8e8, 0x3ac8d8, 0xe8ffff, 0xffffff, 450),
      skin('ender', 'Ender', 0x1e1626, 0x0c0814, 0x2a2232, 0xd84aff, 700),
    ],
  },
  {
    id: 'haru', name: 'Hado Haru', cost: 2500,
    blurb: 'A wandering fighter looking for a stronger opponent. The resort keeps sending jellies.',
    stats: { damage: 1.08, speed: 1.04, crit: 0.04 },
    trait: { id: 'hadoken', name: 'Wave Fist', desc: 'Every 4th hit you thrust your palms and hurl a blue fireball along your aim: it flies 15 m and slams the first monster for 2x, shoving it hard.' },
    gear: ['headband', 'blackBelt'],
    skins: [
      skin('white', 'White Gi', 0xf2efe6, 0xd82a2a, 0x1a1a1e, 0x6fc8ff),
      skin('red', 'Red Gi', 0xc8302a, 0x1a1a1e, 0x1a1a1e, 0xffb547, 300),
      skin('evil', 'Dark Wave', 0x3a2a4a, 0x8a1a2a, 0x1a1a1e, 0xd84aff, 450),
      skin('gold', 'Golden Fist', 0xe8c04a, 0xffffff, 0x1a1a1e, 0xfff27a, 700),
    ],
  },
  {
    id: 'poppy', name: 'Puffball Poppy', cost: 2500,
    blurb: 'Small, round and pink. Will eat anything. Has eaten several things that were trying to eat her.',
    stats: { maxHp: 20, magnet: 1.2, speed: 1.02 },
    trait: { id: 'inhale', name: 'Inhale', desc: 'Every 8 s your next hit takes a huge breath: everything within 6 m is sucked to you, gulped for 0.5x, then you spit a star along your aim that pierces for 2.5x.' },
    gear: ['redShoes', 'starTiara'],
    skins: [
      skin('bubblegum', 'Bubblegum', 0xffa0c8, 0xd82a4a, 0xffd83a, 0xfff27a),
      skin('shadow', 'Mirror Shadow', 0x4a4a5a, 0x1a1a24, 0xc8c8d8, 0xb44aff, 300),
      skin('mint', 'Mint Puff', 0x8af0c8, 0x2f8f74, 0xffffff, 0xd8fff0, 450),
      skin('meta', 'Masked Knight', 0x2a3a8a, 0x8a2a5a, 0xd8b84a, 0xffd15c, 700),
    ],
  },
  {
    id: 'buster', name: 'Blaster Blu', cost: 2500,
    blurb: 'A helper robot rebuilt for battle. Keeps copying the bosses\' moves and calling it research.',
    stats: { cooldown: 0.92, maxHp: 15, speed: 1.03 }, mask: true,
    trait: { id: 'charge', name: 'Charge Shot', desc: 'Your arm cannon charges itself over 3 s; your next attack also fires a fully charged plasma shot that pierces 18 m for 3x.' },
    gear: ['busterHelm', 'armCannon'],
    skins: [
      skin('blue', 'Blue Bomber', 0x3a8ae8, 0x2a5ac8, 0x6fd8ff, 0x6fffe8),
      skin('proto', 'Proto Red', 0xc8302a, 0x7a1a1a, 0xc8c8d8, 0xfff27a, 300),
      skin('bass', 'Bass Black', 0x2a2a34, 0x14141e, 0xd8b84a, 0xff4fa3, 450),
      skin('copy', 'Copy Gold', 0xe8b84a, 0x8a5a14, 0xfff0c0, 0x6fe3ff, 700),
    ],
  },
  // --- The secret hero: never listed (hub, sandbox) until it's yours. It can't be bought: claim every Nimbus
  // Crown on the Wilds' crown isles (logic/skyIslands.js) and it comes to you (SECRET_HEROES / heroForCrowns).
  {
    id: 'sovereign', name: 'Aurelion, the Nimbus Sovereign', cost: 0, secret: true,
    blurb: 'Wore every crown the sky ever made, then came down to see what all the fuss was about. Floats. Never touches the deck.',
    stats: { damage: 1.1, speed: 1.1, maxHp: 15 }, mask: true,
    trait: { id: 'heavenly', name: 'Heavenly Host', desc: 'You FLY: you hover over the ground, your wings catch you at any edge (you never fall off), and in the Wilds Space spreads your wings (hold Space to climb). Three seraph orbs circle you, and every 1.4 s each one fires a lance of light at a monster within 10 m for 0.5x.' },
    gear: ['sunHalo', 'floatCrown', 'divineRobe', 'lightWings', 'seraphs'],
    skins: [
      skin('dawn', 'Dawnlight', 0xfff4dc, 0xf6f0ff, 0xffd15c, 0xfff2a8),
      skin('azure', 'Azure Heaven', 0xd8ecff, 0x6fa8ff, 0xf4f6ff, 0x9fe8ff, 600),
      skin('eclipse', 'Eclipse', 0x2a2440, 0x120e22, 0xffc84a, 0xff9a3a, 900),
      skin('aurora', 'Aurora Throne', 0xe8fff6, 0x7dffd0, 0xd8b8ff, 0xb8fff0, 1200),
    ],
    secretHint: 'Claim every Nimbus Crown',
  },
  // --- The second secret hero: claim every Umbral Heart in the Depths under the Wilds' chasms (logic/depths.js).
  {
    id: 'umbral', name: 'Veyra, the Hollow Queen', cost: 0, secret: true,
    blurb: 'Ruled the dark under the world until somebody finally turned the lights on. Hungry, patient, and rather fond of you.',
    stats: { damage: 1.1, crit: 0.06, maxHp: 10 }, mask: true,
    trait: { id: 'abyss', name: 'Abyssal Hunger', desc: 'The lower your health, the harder you hit: up to +60% damage as it runs out. Every 4th hit the dark erupts as shadow tendrils under up to 3 monsters within 7 m of the target for 0.9x each, and each tendril feeds you 1% health.' },
    gear: ['voidMask', 'voidCrown', 'umbralCloak', 'hungerWisps'],
    skins: [
      skin('hollow', 'Hollow Queen', 0x1d1233, 0x0d0818, 0xb48aff, 0xb64aff),
      skin('ember', 'Cinder Court', 0x2a0e16, 0x14060a, 0xff9a5a, 0xff4a3a, 600),
      skin('glacial', 'Glacial Abyss', 0x10263c, 0x08141f, 0x9ae8ff, 0x4ac8ff, 900),
      skin('gilded', 'Gilded Dusk', 0x2a2010, 0x140f06, 0xffd15c, 0xffb83a, 1200),
    ],
    secretHint: 'Claim every Umbral Heart in the Depths',
  },
  // --- The third secret hero: it comes to whoever owns BOTH other secret heroes (the Sovereign and the Hollow Queen).
  {
    id: 'twilight', name: 'Nyxara, the Twilight Regent', cost: 0, secret: true,
    blurb: 'Born the moment the Sovereign and the Hollow Queen finally stopped arguing. Half dawn, half dusk, and entirely unbothered.',
    stats: { damage: 1.15, speed: 1.05, crit: 0.05, maxHp: 15 }, mask: true,
    trait: { id: 'twilight', name: 'Twilight Regency', desc: 'You FLY, and the sky cycles between DAWN and DUSK every 8 s. Dawn: two seraphs lance monsters within 10 m for 0.5x and you regenerate 1% health a second. Dusk: +40% damage, and every 3rd hit shadow tendrils erupt under up to 3 monsters near the target for 0.9x, feeding you 1% health each.' },
    gear: ['voidMask', 'eclipseHalo', 'umbralCloak', 'duskWings', 'seraphs'],
    skins: [
      skin('twilight', 'Twilight Regent', 0x3a2a5c, 0x1a1030, 0xffc86a, 0xff8ad8),
      skin('solstice', 'Solstice', 0xfff0d0, 0x2a1a44, 0xffd15c, 0xffb86a, 800),
      skin('equinox', 'Equinox', 0x1a2a4a, 0x0a1428, 0x9ae8ff, 0x6a8aff, 1200),
      skin('totality', 'Totality', 0x0a0a14, 0x000000, 0xfff2c0, 0xfff2c0, 1800),
    ],
    secretHint: 'Own both other secret heroes',
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

// Secret heroes: hidden everywhere (the hub's Heroes page and mastery list, the sandbox) until owned.
export const SECRET_HEROES = HEROES.filter((h) => h.secret).map((h) => h.id)
export const isSecretHero = (id) => BY_ID[id]?.secret === true
export const visibleHeroes = (profile) => HEROES.filter((h) => !h.secret || ownsHero(profile, h.id))
// The Nimbus Sovereign comes to whoever has claimed every Nimbus Crown (`claimed` of `total`).
export const CROWN_HERO = 'sovereign'
export const heroForCrowns = (claimed, total) => (total > 0 && claimed >= total ? CROWN_HERO : null)
// The Hollow Queen comes to whoever has claimed every Umbral Heart in the Depths.
export const DEPTHS_HERO = 'umbral'
export const heroForHearts = (claimed, total) => (total > 0 && claimed >= total ? DEPTHS_HERO : null)
// The Twilight Regent comes to whoever owns BOTH other secret heroes.
export const TWILIGHT_HERO = 'twilight'
export const heroForSecrets = (profile) => (ownsHero(profile, CROWN_HERO) && ownsHero(profile, DEPTHS_HERO) ? TWILIGHT_HERO : null)
// Gives a hero for free (no crystals); unchanged if already owned.
export function grantHero(profile, id) {
  if (!BY_ID[id] || ownsHero(profile, id)) return profile
  return { ...profile, heroesOwned: [...(profile.heroesOwned ?? []), id] }
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
  if (hero.secret) return fail(profile, hero.secretHint ?? 'A secret hero')
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
export function rewindTarget(history, now, maxHp, minHp = 0.3) {
  const past = history.find((h) => now - h.t <= 3.2) ?? history[history.length - 1]
  if (!past) return null
  return { x: past.x, z: past.z, hp: Math.max(past.hp, Math.ceil(maxHp * minHp)) }
}
// Molten Core: +10% per stack, up to 5.
export const moltenBonus = (stacks) => 1 + 0.1 * Math.min(5, Math.max(0, stacks))
export const FOCUS_DELAY = 0.8 // seconds standing still before Inner Focus kicks in
export const SECONDS_EVERY = 6 // kills per Seconds, Please dish
export const BROADSIDE_COOLDOWN = 9
// Broadside: three blast spots marching out past the target, away from the shooter.
export function broadsideSpots(from, target, step = 2.5, count = 3) {
  const dx = target.x - from.x
  const dz = target.z - from.z
  const len = Math.hypot(dx, dz) || 1
  return Array.from({ length: count }, (_, i) => ({ x: target.x + (dx / len) * step * i, z: target.z + (dz / len) * step * i }))
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

// Plasma Wake: 3 in 4 attacks throw a blade out and back (returningPoint, below).
export const SABER_CHANCE = 0.75
export const SABER_REACH = 12
export const SABER_TWIN_EVERY = 3 // every 3rd blade thrown splits into two
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
export function spinReels(rng = Math.random, chance = JACKPOT_CHANCE) {
  if (rng() < chance) {
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

// --- Hookshot Hana, Rush Rocket, Commander Cobalt, Kaiju Kiddo, Deadeye Dakota ---
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z)
// Get Over Here!: the farthest point within `range` of `from` (null if none).
export const HOOK_COOLDOWN = 6
export const HOOK_RANGE = 13
export function farthestWithin(points, from, range = HOOK_RANGE) {
  let best = null
  for (const p of points) {
    const d = dist(p, from)
    if (d <= range && (!best || d > dist(best, from))) best = p
  }
  return best
}
// Sonic Boom: how long a rammed monster is safe before it can be rammed again.
export const RAM_REHIT = 0.5
// Orbital Strike: the spot whose `radius` neighbourhood holds the most points (their centroid).
export const ORBITAL_EVERY = 10
export const ORBITAL_RADIUS = 5
export function densestSpot(points, radius = ORBITAL_RADIUS) {
  let best = null
  for (const p of points) {
    const near = points.filter((q) => dist(p, q) <= radius)
    if (!best || near.length > best.count) {
      best = { count: near.length, x: near.reduce((s, q) => s + q.x, 0) / near.length, z: near.reduce((s, q) => s + q.z, 0) / near.length }
    }
  }
  return best
}
// Atomic Breath: is `point` inside the beam from `from` along `angle` (`reach` long, `width` half-wide)?
export const ATOMIC_EVERY = 10
export const ATOMIC_REACH = 14
export function inBeam(from, angle, point, reach = ATOMIC_REACH, width = 1.3) {
  const fx = Math.sin(angle)
  const fz = Math.cos(angle)
  const dx = point.x - from.x
  const dz = point.z - from.z
  const along = dx * fx + dz * fz
  if (along < 0 || along > reach) return false
  return Math.abs(dx * fz - dz * fx) <= width
}
// High Noon: the nearest `max` points within `range`, nearest first.
export const HIGHNOON_COOLDOWN = 16
export function pickMarks(points, from, range = 16, max = 6) {
  return points.filter((p) => dist(p, from) <= range).sort((a, b) => dist(a, from) - dist(b, from)).slice(0, max)
}

// --- premium heroes ---
// A thrown thing that flies `reach` out along `angle` (easing off) and back to `home` (where the thrower
// is now). t in 0..1; it turns at t = 0.5. Hammer Recall and the buffed Plasma Wake fly this way.
export function returningPoint(from, home, angle, t, reach) {
  const fx = Math.sin(angle)
  const fz = Math.cos(angle)
  if (t <= 0.5) {
    const u = t * 2
    const d = reach * (1 - (1 - u) * (1 - u))
    return { x: from.x + fx * d, z: from.z + fz * d }
  }
  const u = (t - 0.5) * 2
  const turn = { x: from.x + fx * reach, z: from.z + fz * reach }
  const e = u * u // speeds up on the way home
  return { x: turn.x + (home.x - turn.x) * e, z: turn.z + (home.z - turn.z) * e }
}
export const HAMMER_EVERY = 4
export const HAMMER_REACH = 11
export const BLACKHOLE_COOLDOWN = 9
export const BLACKHOLE_PULL_RADIUS = 8
export const BLACKHOLE_BLAST_RADIUS = 4
export const BLACKHOLE_LIFE = 2
export const REBIRTH_COOLDOWN = 60
export const CUTS_COOLDOWN = 9
// Thousand Cuts: hop from `from` to the nearest unvisited point within `hop`, up to `max` hops.
export function chainPath(points, from, max = 7, hop = 8) {
  const left = [...points]
  const path = []
  let at = from
  while (path.length < max) {
    let best = -1
    let bestD = Infinity
    left.forEach((p, i) => {
      const d = Math.hypot(p.x - at.x, p.z - at.z)
      if (d <= hop && d < bestD) {
        best = i
        bestD = d
      }
    })
    if (best < 0) break
    at = left.splice(best, 1)[0]
    path.push(at)
  }
  return path
}

// --- legendary heroes ---
const clamp01 = (v) => Math.min(1, Math.max(0, v))
// A point `t` (0..1) of the way along a straight shot of `reach` from `from` along `angle`.
export function linePoint(from, angle, t, reach) {
  return { x: from.x + Math.sin(angle) * reach * t, z: from.z + Math.cos(angle) * reach * t }
}
// `count` angles fanned evenly across `spread` radians around `aim` (one shot flies straight).
export function fanAngles(aim, count, spread = 0.5) {
  if (count <= 1) return [aim]
  return Array.from({ length: count }, (_, i) => aim - spread / 2 + (spread * i) / (count - 1))
}
// Infinity: where a monster at `at` (body radius `radius`) ends up if it's inside the gap `wall` around
// `center` -- pushed straight out to its edge. Null if it's already outside.
export function infinityPush(center, at, wall, radius = 0.5) {
  const dx = at.x - center.x
  const dz = at.z - center.z
  const d = Math.hypot(dx, dz)
  const keep = wall + radius
  if (d >= keep) return null
  if (d < 1e-6) return { x: center.x, z: center.z + keep }
  return { x: center.x + (dx / d) * keep, z: center.z + (dz / d) * keep }
}
// Spartan Rage: rage after gaining `amount` (capped at `max`); `full` once it reaches the top.
export const RAGE_PER_HIT = 1
export const RAGE_PER_HURT = 3
export function addRage(rage, amount, max) {
  const next = Math.min(max, Math.max(0, rage + amount))
  return { rage: next, full: next >= max }
}
// Glory Kill: is this monster staggered enough to finish? Bosses only when `bossBelow` > 0.
export function gloryKillReady(hp, maxHp, isBoss, below = 0.25, bossBelow = 0) {
  if (!(maxHp > 0) || hp <= 0) return false
  const frac = hp / maxHp
  return isBoss ? bossBelow > 0 && frac <= bossBelow : frac <= below
}
// Charge Shot: how full the arm cannon is (0..1), `charge` seconds to fill since the last release.
export const chargeLevel = (now, releasedAt, charge) => clamp01((now - releasedAt) / charge)
