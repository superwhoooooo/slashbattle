// The levels ("places"): pure data describing how each stop looks. The
// game moves to the next one every time a boss is defeated, cycling back to
// the first after the last. Colors are the same shapes config.js uses
// (strings for canvas-drawn ones, hex numbers for materials/lights).
//
//   seed         - resortLayout seed, so each place has its own prop layout
//   sky          - gradient dome stops (top / horizon / ground)
//   fog          - fog + scene background color (matches the horizon haze)
//   hull         - the platform's sides and underside
//   deck         - plank texture colors, edge band and pinstripe
//   planet       - the big ringed planet on the horizon
//   light        - key light, hemisphere fill and the env-map "sun" panel
//   pool         - pool water/rim (`glow` > 0 makes the water self-lit)
//   water        - (optional) makes it a WATER ROOM: no deck, a rolling water surface you swim on
//                  (or dive under, in first person) over a floor `depth` below. `style` picks the
//                  scenery ('pool' tiled basin, 'ocean' open sea, 'reef' glass aquarium); `surface`
//                  is the water's color/opacity/wave height, `under` the murk when diving,
//                  `floor` the colors of the bottom. See src/waterArena.js and logic/water.js.
//   props        - `style` (which prop models src/props.js draws: resort,
//                  frost, magma, neon, candy), umbrella canopy palette, lounger/sign colors, sign texts
export const LEVELS = [
  {
    name: 'Orbital Resort',
    seed: 1337,
    sky: { top: '#2F7FF2', horizon: '#DDF0FF', ground: '#F6E6CF' },
    fog: 0xbfe3ff,
    hull: 0xe7e9ec,
    deck: { plank: '#f0e2c6', seam: '#d8cbb2', border: '#19b5a5', pinstripe: '#f5f5f0' },
    planet: { color: 0xf2b27a, ring: 0xffe9cf },
    light: { key: 0xfff0d6, hemiSky: 0xcfe8ff, hemiGround: 0xe8d6b8, sun: 0xfff6e0 },
    pool: { water: 0x2bc8e6, rim: 0xffffff, glow: 0 },
    props: {
      style: 'resort',
      umbrellaColors: [0xff6a4d, 0xffd15c, 0x19b5a5],
      loungerColor: 0xf5f5f0,
      signPanel: 0x19b5a5,
      signPost: 0xffffff,
      signTexts: ['DECK 4', 'POOL', 'SUNDECK', 'PLEASE DO NOT FEED THE GRUMPUS', 'NO DIVING (SERIOUSLY)'],
    },
  },
  {
    name: 'Frostbite Spa',
    seed: 2024,
    sky: { top: '#3b5fb8', horizon: '#e4f3ff', ground: '#f4fbff' },
    fog: 0xdcefff,
    hull: 0xcfe0ee,
    deck: { plank: '#dcecf6', seam: '#bcd2e2', border: '#5aa9e6', pinstripe: '#ffffff' },
    planet: { color: 0xa9c8ff, ring: 0xe6f1ff },
    light: { key: 0xe6f0ff, hemiSky: 0xd6e9ff, hemiGround: 0xc9dcee, sun: 0xeef6ff },
    pool: { water: 0x9be7ff, rim: 0xffffff, glow: 0.15 },
    props: {
      style: 'frost',
      umbrellaColors: [0x7cc8ff, 0xffffff, 0xb9a6ff],
      loungerColor: 0xeaf4fb,
      signPanel: 0x3f7fc4,
      signPost: 0xeaf4fb,
      signTexts: ['SAUNA (BROKEN)', 'THIN ICE', 'NO LICKING THE RAILS', 'HOT TUB: LUKEWARM', 'PENGUINS HAVE RIGHT OF WAY'],
    },
  },
  {
    name: 'Magma Marina',
    seed: 777,
    sky: { top: '#3a1620', horizon: '#ff9a5c', ground: '#5a2a1c' },
    fog: 0xe58a5a,
    hull: 0x4a3f3f,
    deck: { plank: '#6b5a52', seam: '#4d3f39', border: '#ff6a2a', pinstripe: '#ffd15c' },
    planet: { color: 0xff5a2a, ring: 0xffc27a },
    light: { key: 0xffc890, hemiSky: 0xffb48a, hemiGround: 0x6a3b2a, sun: 0xffb060 },
    pool: { water: 0xff5a1a, rim: 0xffd15c, glow: 0.9 },
    props: {
      style: 'magma',
      umbrellaColors: [0xff6a2a, 0xffd15c, 0x3a3a3a],
      loungerColor: 0x8a7a70,
      signPanel: 0xc2410c,
      signPost: 0x3a3a3a,
      signTexts: ['FLOOR IS LAVA', 'DOCK 9 (MOLTEN)', 'NO SWIMMING', 'COMPLIMENTARY SULFUR', 'MIND THE EMBERS'],
    },
  },
  {
    name: 'Neon Nightclub',
    seed: 4242,
    sky: { top: '#0b0630', horizon: '#6a2bb8', ground: '#1a0b3d' },
    fog: 0x4a2090,
    hull: 0x2a2250,
    deck: { plank: '#3a2f6b', seam: '#2a2150', border: '#ff3fb4', pinstripe: '#37f2ff' },
    planet: { color: 0xff3fb4, ring: 0x37f2ff },
    light: { key: 0xd6c2ff, hemiSky: 0x8a6bff, hemiGround: 0x3a2a7a, sun: 0xc9a8ff },
    pool: { water: 0x37f2ff, rim: 0xff3fb4, glow: 0.7 },
    props: {
      style: 'neon',
      umbrellaColors: [0xff3fb4, 0x37f2ff, 0xb4ff3f],
      loungerColor: 0x4b3f8a,
      signPanel: 0xff3fb4,
      signPost: 0x37f2ff,
      signTexts: ['VIP ONLY (YOU ARE NOT)', 'DJ IS ALSO A JELLY', 'COVER CHARGE: 1 CRYSTAL', 'GLOW STICKS AT BAR', 'LAST CALL WAS LAST WAVE'],
    },
  },
  {
    name: 'Candy Cove',
    seed: 9001,
    sky: { top: '#ff8fc8', horizon: '#fff0f8', ground: '#ffe3f1' },
    fog: 0xffe0f0,
    hull: 0xf6d6e6,
    deck: { plank: '#ffe0ee', seam: '#f3bcd6', border: '#ff5fa8', pinstripe: '#ffffff' },
    planet: { color: 0xb48cff, ring: 0xffd6f0 },
    light: { key: 0xfff0f6, hemiSky: 0xffd6ee, hemiGround: 0xf5d2e2, sun: 0xfff2f8 },
    pool: { water: 0xa6f0d8, rim: 0xffffff, glow: 0.1 },
    props: {
      style: 'candy',
      umbrellaColors: [0xff5fa8, 0x7ce8c8, 0xffd15c, 0xb48cff],
      loungerColor: 0xfff4f9,
      signPanel: 0xff5fa8,
      signPost: 0xffffff,
      signTexts: ['SUGAR RUSH LANE', 'DO NOT LICK THE DECK', 'GUMDROP CROSSING', 'SPRINKLES OPTIONAL', 'THE POOL IS SODA'],
    },
  },
  {
    name: 'Pool Room',
    seed: 5150,
    sky: { top: '#2A6FE0', horizon: '#CDEBFF', ground: '#E8F6FF' },
    fog: 0xbfe3ff,
    hull: 0xe7f6f8,
    deck: { plank: '#e9f7f8', seam: '#bfe3ea', border: '#19b5a5', pinstripe: '#ffffff' },
    planet: { color: 0xf2b27a, ring: 0xffe9cf },
    light: { key: 0xfff6e0, hemiSky: 0xcfe8ff, hemiGround: 0x9fd8e8, sun: 0xfff6e0 },
    pool: { water: 0x2bc8e6, rim: 0xffffff, glow: 0 },
    water: {
      style: 'pool',
      surface: { color: 0x35cfe8, opacity: 0.62, amp: 0.2 },
      under: { fog: 0x1aa6c8, near: 1, far: 34 },
      floor: { color: 0xdff6fa, accent: 0x19b5a5 },
      wall: { color: 0xf4fbfc, trim: 0x19b5a5 },
    },
    props: {
      style: 'resort',
      umbrellaColors: [0xff6a4d, 0xffd15c, 0x19b5a5],
      loungerColor: 0xf5f5f0,
      signPanel: 0x19b5a5,
      signPost: 0xffffff,
      signTexts: ['NO RUNNING', 'DEEP END', 'WALK, DO NOT SPLASH', 'NO DIVING (SERIOUSLY)', 'LIFEGUARD ON BREAK'],
    },
  },
  {
    name: 'Pacific Ocean',
    seed: 6060,
    sky: { top: '#1d4f9f', horizon: '#ffc79a', ground: '#ffb27a' },
    fog: 0xffc79a,
    hull: 0x2a6f9a,
    deck: { plank: '#2a8ab8', seam: '#1f6f98', border: '#ffffff', pinstripe: '#ffffff' },
    planet: { color: 0xffe08a, ring: 0xfff3c4 },
    light: { key: 0xffd9a8, hemiSky: 0xffd2a8, hemiGround: 0x2a6f9a, sun: 0xffc27a },
    pool: { water: 0x1f8fc4, rim: 0xffffff, glow: 0 },
    water: {
      style: 'ocean',
      surface: { color: 0x1f9be0, opacity: 0.88, amp: 0.34 },
      under: { fog: 0x0a4f86, near: 1, far: 40 },
      floor: { color: 0xe6cf98, accent: 0x5a7a4a },
      wall: { color: 0xff5a3a, trim: 0xffffff },
    },
    props: {
      style: 'resort',
      umbrellaColors: [0xff6a4d, 0xffd15c, 0x19b5a5],
      loungerColor: 0xf5f5f0,
      signPanel: 0x1f6f98,
      signPost: 0xffffff,
      signTexts: ['HERE BE SHARKS (FRIENDLY)', 'NEXT LAND: A LONG WAY', 'TIDE: YES', 'PLEASE DO NOT FEED THE WHALE', 'X MARKS A SPOT'],
    },
  },
  {
    name: 'Glowing Reef Aquarium',
    seed: 7007,
    sky: { top: '#050a2a', horizon: '#1a3b8a', ground: '#0a1a4a' },
    fog: 0x0e2a6a,
    hull: 0x16306a,
    deck: { plank: '#14306a', seam: '#0e2150', border: '#37f2ff', pinstripe: '#ff3fb4' },
    planet: { color: 0x37f2ff, ring: 0xff3fb4 },
    light: { key: 0xa8c8ff, hemiSky: 0x6a9aff, hemiGround: 0x1a2a6a, sun: 0xb8d0ff },
    pool: { water: 0x37f2ff, rim: 0xff3fb4, glow: 0.7 },
    water: {
      style: 'reef',
      surface: { color: 0x2a8fff, opacity: 0.5, amp: 0.16 },
      under: { fog: 0x06164a, near: 1, far: 32 },
      floor: { color: 0x10285a, accent: 0xff3fb4 },
      wall: { color: 0x7fd8ff, trim: 0x37f2ff },
    },
    props: {
      style: 'neon',
      umbrellaColors: [0xff3fb4, 0x37f2ff, 0xb4ff3f],
      loungerColor: 0x4b3f8a,
      signPanel: 0x37f2ff,
      signPost: 0xff3fb4,
      signTexts: ['DO NOT TAP THE GLASS', 'FEEDING TIME: ALWAYS', 'JELLYFISH ARE FRIENDS', 'CORAL IS A LIVING THING', 'EXIT THROUGH THE GIFT SHOP'],
    },
  },
]

// Which level the player is on after `bossesDefeated` boss kills; wraps
// around once every place has been visited.
export function levelIndexAfterBosses(bossesDefeated) {
  const count = Math.max(0, Math.floor(bossesDefeated))
  return count % LEVELS.length
}

export function levelAt(index) {
  return LEVELS[((index % LEVELS.length) + LEVELS.length) % LEVELS.length]
}
