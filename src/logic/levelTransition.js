// The hyperspace jump between places (Orbital Resort -> Frostbite Spa -> ...), pure timing only.
//
//   wait    - the boss has just fallen: play goes on (its death pop, the crystals flying in)
//   charge  - the world freezes, star streaks race out from the centre and grow, ending in a white flash
//   (swap)  - at the flash's peak the old place is swapped for the new one, hidden behind the white
//   reveal  - the white clears onto the new place while the camera swoops down from high above;
//             the "NOW ARRIVING" card shows
//   done    - play resumes
//
// `frame(t)` gives everything the effect needs at `t` seconds in.

export const TRANSITION = {
  wait: 1.6,
  charge: 1.2,
  hold: 0.15, // full white while the place swaps
  reveal: 1.5,
  cameraLift: 16, // how high above the usual view the camera starts its swoop
}

export function transitionLength(T = TRANSITION) {
  return T.wait + T.charge + T.hold + T.reveal
}

export function createTransition(levelIndex) {
  return { t: 0, levelIndex, swapped: false, arrived: false }
}

const clamp01 = (v) => Math.max(0, Math.min(1, v))
const easeIn = (v) => v * v * v
const easeOutCubic = (v) => 1 - (1 - v) ** 3

export function transitionFrame(t, T = TRANSITION) {
  const chargeAt = T.wait
  const swapAt = chargeAt + T.charge
  const revealAt = swapAt + T.hold
  const end = revealAt + T.reveal
  if (t < chargeAt) return { phase: 'wait', frozen: false, streaks: 0, flash: 0, camLift: 0, done: false }
  if (t < swapAt) {
    const p = (t - chargeAt) / T.charge
    // the streaks build the whole way; the white comes in over the last third
    return { phase: 'charge', frozen: true, streaks: easeIn(p) * 0.85 + 0.15 * p, flash: easeIn(clamp01((p - 0.62) / 0.38)), camLift: 0, done: false }
  }
  if (t < revealAt) return { phase: 'hold', frozen: true, streaks: 1, flash: 1, camLift: T.cameraLift, done: false }
  if (t < end) {
    const p = (t - revealAt) / T.reveal
    return {
      phase: 'reveal',
      frozen: true,
      streaks: (1 - clamp01(p * 2.2)) ** 2, // the streaks die out quickly as you drop out of hyperspace
      flash: (1 - clamp01(p * 1.6)) ** 2,
      camLift: T.cameraLift * (1 - easeOutCubic(p)),
      done: false,
    }
  }
  return { phase: 'done', frozen: false, streaks: 0, flash: 0, camLift: 0, done: true }
}

// Advances a transition by dt. Returns { state, frame, swapNow, arriveNow }: `swapNow` is true on the one
// step the place should change (the white has peaked), `arriveNow` on the one step the reveal starts.
export function stepTransition(state, dt, T = TRANSITION) {
  const t = state.t + dt
  const frame = transitionFrame(t, T)
  const swapNow = !state.swapped && t >= T.wait + T.charge
  const arriveNow = !state.arrived && t >= T.wait + T.charge + T.hold
  return { state: { ...state, t, swapped: state.swapped || swapNow, arrived: state.arrived || arriveNow }, frame, swapNow, arriveNow }
}
