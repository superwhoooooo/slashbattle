// Pure, Web-Audio-free sound effect logic: which named voice a kill's
// trick id should play, and a per-voice rate limiter so a burst of the
// same sound in one frame (lots of crystals landing at once, say)
// doesn't stack into a buzz. src/sfx.js is the Web Audio side that
// actually synthesizes and plays these voices.

// Minimum seconds between two plays of the same named voice; a voice
// missing here has no limit and always plays.
const MIN_VOICE_INTERVAL = {
  crystal: 0.08,
  hit: 0.04,
}

export function createVoiceState() {
  return {} // voice name -> last-played time (seconds)
}

// True if `name` may play now (at `now`, seconds elapsed), given when it
// last played. Doesn't mutate `state` -- call registerVoicePlay once it
// actually plays.
export function canPlayVoice(state, name, now) {
  const minInterval = MIN_VOICE_INTERVAL[name] ?? 0
  const last = state[name]
  return last === undefined || now - last >= minInterval
}

// Records that `name` played at `now`. Returns a new state rather than
// mutating `state`.
export function registerVoicePlay(state, name, now) {
  return { ...state, [name]: now }
}

// Picks the kill voice for a trick id (src/logic/tricks.js's nameTrick):
// the ring-out slide whistle for a fall (Checkout/VIP Checkout), the
// splash for a pool kill (Cannonball), and the plain kill splat for
// everything else (Slash, Room Service, Turndown Service, Wake-Up Call,
// Do Not Disturb).
export function killVoiceForTrick(trickId) {
  if (trickId === 'checkout' || trickId === 'vipCheckout') return 'ringOut'
  if (trickId === 'cannonball') return 'cannonball'
  return 'kill'
}
