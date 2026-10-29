// The shared Web Audio plumbing underneath both the procedural music
// (src/music.js) and the procedural sound effects (src/sfx.js): one
// AudioContext, lazily created on the first user gesture (browsers block
// audio until one), with a single master gain both route through -- so
// the M key mutes everything together -- on its way to a compressor that
// keeps the mix from clipping when several voices land at once.
const MUTE_KEY = 'slashbattle:music-muted'
const MASTER_VOLUME = 1

function loadMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
}

function saveMuted(muted) {
  try {
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0')
  } catch {
    // Storage may be unavailable; the preference just won't persist.
  }
}

// A one-second mono buffer of white noise, the raw material noise-based
// voices (drums, whooshes, splashes, zips) filter and envelope. Shared
// between the music and sfx graphs so each only builds its own once.
export function createNoiseBuffer(ctx) {
  const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  return buffer
}

export function createAudio() {
  let ctx = null
  let master = null
  let muted = loadMuted()

  function buildGraph() {
    ctx = new (window.AudioContext || window.webkitAudioContext)()
    const compressor = ctx.createDynamicsCompressor()
    compressor.connect(ctx.destination)
    master = ctx.createGain()
    master.gain.value = muted ? 0 : MASTER_VOLUME
    master.connect(compressor)
  }

  return {
    // Must be called from a user gesture (browsers block audio until one).
    // Safe to call every time one happens; only the first builds the graph.
    start() {
      if (!ctx) buildGraph()
      ctx.resume()
    },
    get context() {
      return ctx
    },
    get master() {
      return master
    },
    toggleMuted() {
      muted = !muted
      saveMuted(muted)
      if (master) master.gain.setTargetAtTime(muted ? 0 : MASTER_VOLUME, ctx.currentTime, 0.05)
      return muted
    },
    isMuted: () => muted,
  }
}
