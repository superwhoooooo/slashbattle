// Pure random face-option picking logic for goofy faces, kept free of
// canvas/Three.js so it can be unit tested deterministically with an
// injectable rng. faces.js turns the options this returns into a texture.

export const MOUTH_TYPES = ['buckTooth', 'derp', 'openO', 'lopsided']
export const SQUINT_SIDES = ['left', 'right']

export const EYE_SIZE_MIN = 0.6
export const EYE_SIZE_MAX = 1.4
// Minimum difference enforced between the two eye sizes, so every face is
// reliably mismatched rather than just occasionally.
export const EYE_SIZE_MIN_DELTA = 0.15

function randRange(rng, min, max) {
  return min + rng() * (max - min)
}

function randBool(rng, probability) {
  return rng() < probability
}

function pickItem(rng, items) {
  return items[Math.floor(rng() * items.length)]
}

// Picks a random eye size pair where the two sizes always differ by at
// least EYE_SIZE_MIN_DELTA, within [EYE_SIZE_MIN, EYE_SIZE_MAX].
function pickEyeSizes(rng) {
  const leftSize = randRange(rng, EYE_SIZE_MIN, EYE_SIZE_MAX)
  const midpoint = (EYE_SIZE_MIN + EYE_SIZE_MAX) / 2
  const rightSize =
    leftSize >= midpoint
      ? randRange(rng, EYE_SIZE_MIN, leftSize - EYE_SIZE_MIN_DELTA)
      : randRange(rng, leftSize + EYE_SIZE_MIN_DELTA, EYE_SIZE_MAX)
  return { leftSize, rightSize }
}

// Picks a random set of goofy face options. rng is injectable (default
// Math.random) so callers can pass a seeded rng for deterministic results.
export function pickFaceOptions(rng = Math.random) {
  const { leftSize, rightSize } = pickEyeSizes(rng)

  return {
    eyes: {
      leftSize,
      rightSize,
      crossEyed: randBool(rng, 0.2),
      squintEye: randBool(rng, 0.3) ? pickItem(rng, SQUINT_SIDES) : null,
    },
    mouth: {
      type: pickItem(rng, MOUTH_TYPES),
      tongueOut: randBool(rng, 0.3),
    },
    unibrow: randBool(rng, 0.2),
    rosyCheeks: randBool(rng, 0.3),
    freckles: randBool(rng, 0.3),
  }
}
