// Procedural background music: no audio files, just Web Audio oscillators
// and noise voicing the pattern from src/logic/music.js. A lookahead
// scheduler (a short setInterval queuing notes slightly ahead on the
// audio clock) keeps the beat steady however the frame rate wobbles.
import { eventsForStep, midiToFreq, stepDuration } from './logic/music.js'

const MUTE_KEY = 'slashbattle:music-muted'
const MASTER_VOLUME = 0.32
const LOOKAHEAD_SECONDS = 0.15
const TICK_MS = 25
const MUFFLED_CUTOFF = 500
const OPEN_CUTOFF = 18000

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

export function createMusic() {
  let ctx = null
  let master = null
  let muffle = null
  let noiseBuffer = null
  let timer = null
  let nextStepTime = 0
  let stepIndex = 0
  let muted = loadMuted()

  function buildGraph() {
    ctx = new (window.AudioContext || window.webkitAudioContext)()
    const compressor = ctx.createDynamicsCompressor()
    compressor.connect(ctx.destination)
    // Closed down on game over so the track ducks into a "muffled" mood.
    muffle = ctx.createBiquadFilter()
    muffle.type = 'lowpass'
    muffle.frequency.value = OPEN_CUTOFF
    muffle.connect(compressor)
    master = ctx.createGain()
    master.gain.value = muted ? 0 : MASTER_VOLUME
    master.connect(muffle)

    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
    const data = noiseBuffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  }

  // A gain node with a fast attack and exponential decay, wired to master.
  function envelope(time, peak, attack, length) {
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, time)
    gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), time + attack)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + length)
    gain.connect(master)
    return gain
  }

  function tone(type, freq, time, length, peak, { attack = 0.005, cutoff = 0, detune = 0 } = {}) {
    const osc = ctx.createOscillator()
    osc.type = type
    osc.frequency.value = freq
    osc.detune.value = detune
    let out = envelope(time, peak, attack, length)
    if (cutoff) {
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = cutoff
      filter.connect(out)
      out = filter
    }
    osc.connect(out)
    osc.start(time)
    osc.stop(time + length + 0.05)
  }

  function noise(time, length, peak, filterType, frequency) {
    const src = ctx.createBufferSource()
    src.buffer = noiseBuffer
    const filter = ctx.createBiquadFilter()
    filter.type = filterType
    filter.frequency.value = frequency
    filter.connect(envelope(time, peak, 0.002, length))
    src.connect(filter)
    src.start(time, Math.random() * 0.5)
    src.stop(time + length + 0.05)
  }

  function kick(time, v) {
    const osc = ctx.createOscillator()
    osc.frequency.setValueAtTime(160, time)
    osc.frequency.exponentialRampToValueAtTime(42, time + 0.14)
    osc.connect(envelope(time, 0.95 * v, 0.003, 0.28))
    osc.start(time)
    osc.stop(time + 0.35)
  }

  const voices = {
    kick: (time, e) => kick(time, e.velocity),
    snare: (time, e) => {
      noise(time, 0.16, 0.45 * e.velocity, 'highpass', 1500)
      tone('triangle', 190, time, 0.1, 0.3 * e.velocity)
    },
    hat: (time, e) => noise(time, 0.04, 0.22 * e.velocity, 'highpass', 7500),
    openHat: (time, e, len) => noise(time, Math.min(len, 0.2), 0.2 * e.velocity, 'highpass', 7000),
    crash: (time, e) => noise(time, 0.9, 0.22 * e.velocity, 'highpass', 5000),
    bass: (time, e, len) => {
      const freq = midiToFreq(e.note)
      tone('sawtooth', freq, time, len * 0.9, 0.5, { cutoff: 520 })
      tone('square', freq / 2, time, len * 0.9, 0.22, { cutoff: 300 })
    },
    stab: (time, e) => {
      const freq = midiToFreq(e.note)
      tone('sawtooth', freq, time, 0.14, 0.09 * e.velocity, { cutoff: 2600, detune: -8 })
      tone('sawtooth', freq, time, 0.14, 0.09 * e.velocity, { cutoff: 2600, detune: 8 })
    },
    arp: (time, e) => {
      tone('triangle', midiToFreq(e.note), time, 0.11, 0.2 * e.velocity, { cutoff: 4000 })
    },
    lead: (time, e, len) => {
      const freq = midiToFreq(e.note)
      tone('square', freq, time, len, 0.13, { attack: 0.012, cutoff: 3200 })
      tone('triangle', freq * 2, time, len, 0.06, { attack: 0.012, detune: 6 })
    },
  }

  function scheduleAhead() {
    const secondsPerStep = stepDuration()
    // After a long stall (a backgrounded tab) don't replay the backlog in
    // one burst -- just pick the beat back up from now.
    if (nextStepTime < ctx.currentTime - 0.1) nextStepTime = ctx.currentTime + 0.05
    while (nextStepTime < ctx.currentTime + LOOKAHEAD_SECONDS) {
      for (const event of eventsForStep(stepIndex)) {
        voices[event.kind](nextStepTime, event, event.steps * secondsPerStep)
      }
      nextStepTime += secondsPerStep
      stepIndex++
    }
  }

  function onVisibilityChange() {
    if (!ctx) return
    if (document.hidden) ctx.suspend()
    else ctx.resume()
  }

  return {
    // Must be called from a user gesture (browsers block audio until one).
    start() {
      if (timer) return
      if (!ctx) buildGraph()
      ctx.resume()
      nextStepTime = ctx.currentTime + 0.1
      timer = setInterval(scheduleAhead, TICK_MS)
      document.addEventListener('visibilitychange', onVisibilityChange)
    },
    toggleMuted() {
      muted = !muted
      saveMuted(muted)
      if (master) master.gain.setTargetAtTime(muted ? 0 : MASTER_VOLUME, ctx.currentTime, 0.05)
      return muted
    },
    // Ducks the track under a low-pass while the game-over screen is up.
    setMuffled(muffled) {
      if (!muffle) return
      muffle.frequency.setTargetAtTime(muffled ? MUFFLED_CUTOFF : OPEN_CUTOFF, ctx.currentTime, 0.15)
    },
    isMuted: () => muted,
  }
}
