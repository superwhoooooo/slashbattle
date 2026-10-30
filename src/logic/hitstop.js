// Pure, Three-free hitstop math: a tiny freeze of gameplay time on
// impact, so hits read as heavier than a same-length swing with no
// freeze at all. Kept free of Three.js imports so Vitest can exercise
// it without WebGL; the Three-side driver (deciding which systems'
// delta it scales) lives in src/main.js.

// Starting state: no freeze pending.
export function createHitstopState() {
  return { remaining: 0 }
}

// Extends the pending freeze to `duration` seconds from now -- never
// shorter than whatever's already left, and never stacked on top of it,
// so a kill landing while a hit's freeze is still running just takes
// over rather than adding to it.
export function triggerHitstop(state, duration) {
  return { remaining: Math.max(state.remaining, duration) }
}

// Advances the freeze by one real-time tick. Returns { state, scale }:
// scale is 0 while still inside the freeze (gameplay should get none of
// this tick's dt), 1 once there's no freeze left (gameplay gets all of
// it). When the freeze ends partway through the tick, scale is the
// fraction of dt left over after the freeze finishes, so that leftover
// time isn't lost -- e.g. 0.01s remaining against a 0.016s dt ends the
// freeze 0.01s in and hands gameplay the remaining 0.006s (scale 0.375).
export function stepHitstop(state, dt) {
  if (state.remaining <= 0) return { state: { remaining: 0 }, scale: 1 }
  if (state.remaining >= dt) return { state: { remaining: state.remaining - dt }, scale: 0 }
  return { state: { remaining: 0 }, scale: (dt - state.remaining) / dt }
}
