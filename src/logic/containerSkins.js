// Pure palettes for the treasure chests and hiding suitcases, one per place
// (a level's `props.style`; the labyrinth has its own). `extra` names the
// decoration chests.js / hiding.js add on top of the shared model.
//
// chest: body / lid / latch / stripe / handle / garnish hex colours, `glow` > 0 makes the
//        stripe and latch emissive, `metal`/`rough` set the shell finish.
// case:  shell / trim / handle / wheel colours (+ finish).
export const CONTAINER_SKINS = {
  resort: {
    chest: { body: 0xf7eedc, lid: 0x19b5a5, latch: 0xff6a4d, stripe: 0xffd15c, handle: 0xd8d0bd, garnish: 0xcdf2ec, glow: 0, metal: 0.05, rough: 0.55, extra: 'none' },
    case: { shell: 0xf5ead8, trim: 0xa9784c, handle: 0xb9b4ab, wheel: 0x2b2f38, metal: 0.3, rough: 0.25, extra: 'none' },
  },
  frost: {
    chest: { body: 0xcfe9f7, lid: 0xffffff, latch: 0x5aa9e6, stripe: 0x9be7ff, handle: 0xa7c6dc, garnish: 0xe6f6ff, glow: 0.3, metal: 0.1, rough: 0.12, extra: 'snow' },
    case: { shell: 0xdff1fb, trim: 0x5aa9e6, handle: 0xc9dcea, wheel: 0x41627d, metal: 0.15, rough: 0.12, extra: 'snow' },
  },
  magma: {
    chest: { body: 0x2e2626, lid: 0x4a3434, latch: 0xff6a2a, stripe: 0xff7a1a, handle: 0x6b5a52, garnish: 0xffb15c, glow: 1.2, metal: 0.4, rough: 0.8, extra: 'cracks' },
    case: { shell: 0x3a2f2f, trim: 0xff6a2a, handle: 0x8a7a70, wheel: 0x1a1414, metal: 0.45, rough: 0.7, extra: 'cracks' },
  },
  neon: {
    chest: { body: 0x1b1632, lid: 0x2a2150, latch: 0x37f2ff, stripe: 0xff3fb4, handle: 0x3b3568, garnish: 0xb4ff3f, glow: 1.4, metal: 0.55, rough: 0.35, extra: 'speaker' },
    case: { shell: 0x211a3d, trim: 0xff3fb4, handle: 0x37f2ff, wheel: 0x0f0b20, metal: 0.55, rough: 0.3, extra: 'speaker' },
  },
  candy: {
    chest: { body: 0xffc2dc, lid: 0xffffff, latch: 0xffd15c, stripe: 0x7ce8c8, handle: 0xff9ac4, garnish: 0xfff08a, glow: 0.2, metal: 0, rough: 0.35, extra: 'bow' },
    case: { shell: 0xffd6e8, trim: 0xff5fa8, handle: 0xffffff, wheel: 0x7ce8c8, metal: 0.05, rough: 0.3, extra: 'dots' },
  },
  // The Wilds: carved dark wood with gold trim and a glowing violet rune gem.
  wilds: {
    chest: { body: 0x5a3a24, lid: 0x6b4630, latch: 0xb46bff, stripe: 0xe8b53a, handle: 0xe8b53a, garnish: 0xc88cff, glow: 0.9, metal: 0.35, rough: 0.7, extra: 'runes' },
    case: { shell: 0x7a5a38, trim: 0xe8b53a, handle: 0xe8b53a, wheel: 0x2a1c12, metal: 0.3, rough: 0.7, extra: 'iron' },
  },
  dungeon: {
    chest: { body: 0x6b4a2b, lid: 0x7a5533, latch: 0xc8a24a, stripe: 0x3a3a42, handle: 0x3a3a42, garnish: 0xffd76a, glow: 0.3, metal: 0.3, rough: 0.8, extra: 'iron' },
    case: { shell: 0x7a5a38, trim: 0x2e2e36, handle: 0x8a8a92, wheel: 0x1c1c22, metal: 0.2, rough: 0.8, extra: 'iron' },
  },
}

export function containerSkin(style) {
  return CONTAINER_SKINS[style] ?? CONTAINER_SKINS.resort
}
