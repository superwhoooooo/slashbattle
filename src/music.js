// Procedural background music: no audio files, just Web Audio oscillators
// and noise voicing the pattern from src/logic/music.js. A lookahead
// scheduler (a short setInterval queuing notes slightly ahead on the
// audio clock) keeps the beat steady however the frame rate wobbles.
// Shares its AudioContext and master mute with the sound effects
// (src/sfx.js) through src/audio.js; only the game-over ducking filter
// below belongs to music alone.
import { createNoiseBuffer } from './audio.js'
import { noteSaved } from './saveSync.js'
import { MUSIC_TRACKS, midiToFreq, stepDuration } from './logic/music.js'
import { DEFAULT_MUSIC_STYLE, WILDS_TRACK_IDS, parseMusicStyle } from './logic/wildsMusic.js'

const MUSIC_VOLUME = 0.32
const LOOKAHEAD_SECONDS = 0.15
const TICK_MS = 25
const MUFFLED_CUTOFF = 500
const OPEN_CUTOFF = 18000
const STYLE_KEY = 'slashbattle:music-style' // 'places' | 'classic' (see logic/wildsMusic.js)
const FADE_SECONDS = 0.4 // a change to or from one of the Wilds' tracks fades out and back in instead of cutting

function loadStyle() {
  try {
    return parseMusicStyle(localStorage.getItem(STYLE_KEY))
  } catch (_) {
    return DEFAULT_MUSIC_STYLE
  }
}
function saveStyle(style) {
  try {
    localStorage.setItem(STYLE_KEY, style)
    noteSaved()
  } catch (_) {
    // storage unavailable: the choice just lasts this session
  }
}
const isWildsTrack = (id) => WILDS_TRACK_IDS.includes(id)

// `audio` is the shared src/audio.js instance: its context and master
// gain (the one the M key mutes) are reused rather than creating a
// second AudioContext.
export function createMusic(audio) {
  let ctx = null
  let master = null
  let muffle = null
  let noiseBuffer = null
  let timer = null
  let nextStepTime = 0
  let stepIndex = 0
  let mode = 'normal' // which MUSIC_TRACKS entry is playing
  let fadeTimer = null
  let pendingMode = null // the track a fade is heading to
  let style = loadStyle()

  function buildGraph() {
    ctx = audio.context
    // Closed down on game over so the track ducks into a "muffled" mood.
    muffle = ctx.createBiquadFilter()
    muffle.type = 'lowpass'
    muffle.frequency.value = OPEN_CUTOFF
    muffle.connect(audio.master)
    master = ctx.createGain()
    master.gain.value = MUSIC_VOLUME
    master.connect(muffle)

    noiseBuffer = createNoiseBuffer(ctx)
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
    // Boss track voices: a held detuned pad, a biting riff, and falling toms.
    pad: (time, e, len) => {
      const freq = midiToFreq(e.note)
      tone('sawtooth', freq, time, len, 0.04, { attack: len * 0.25, cutoff: 1300, detune: -10 })
      tone('sawtooth', freq, time, len, 0.04, { attack: len * 0.25, cutoff: 1300, detune: 10 })
    },
    riff: (time, e, len) => {
      const freq = midiToFreq(e.note)
      tone('sawtooth', freq, time, len * 0.8, 0.12, { cutoff: 2200, detune: -6 })
      tone('square', freq, time, len * 0.8, 0.06, { cutoff: 1800, detune: 6 })
    },
    tom: (time, e) => {
      const osc = ctx.createOscillator()
      const freq = midiToFreq(e.note)
      osc.frequency.setValueAtTime(freq * 1.8, time)
      osc.frequency.exponentialRampToValueAtTime(freq, time + 0.12)
      osc.connect(envelope(time, 0.6 * e.velocity, 0.003, 0.25))
      osc.start(time)
      osc.stop(time + 0.3)
    },
    // Chill track voices: a soft electric piano, a round sine bass, a glassy bell, vinyl ticks.
    keys: (time, e, len) => {
      const freq = midiToFreq(e.note)
      tone('sine', freq, time, len, 0.075 * e.velocity, { attack: 0.02, detune: -4 })
      tone('triangle', freq, time, len * 0.8, 0.05 * e.velocity, { attack: 0.02, cutoff: 1500, detune: 5 })
    },
    sub: (time, e, len) => {
      tone('sine', midiToFreq(e.note), time, len, 0.5 * e.velocity, { attack: 0.015 })
    },
    bell: (time, e, len) => {
      const freq = midiToFreq(e.note)
      tone('sine', freq, time, len * 1.4, 0.1, { attack: 0.01 })
      tone('sine', freq * 2, time, len * 0.7, 0.03, { attack: 0.01 })
    },
    crackle: (time, e) => noise(time, 0.012, 0.05 * e.velocity, 'highpass', 3500),
    // The Wilds' tracks: a soft swelling pad, a dark drone, plucks, glassy shimmers, drips and a slow heartbeat.
    air: (time, e, len) => {
      const freq = midiToFreq(e.note)
      tone('sine', freq, time, len, 0.06 * e.velocity, { attack: len * 0.3, detune: -5 })
      tone('triangle', freq, time, len, 0.028 * e.velocity, { attack: len * 0.35, cutoff: 1800, detune: 6 })
    },
    drone: (time, e, len) => {
      const freq = midiToFreq(e.note)
      tone('sawtooth', freq, time, len, 0.06 * e.velocity, { attack: len * 0.35, cutoff: 360, detune: -9 })
      tone('sawtooth', freq, time, len, 0.06 * e.velocity, { attack: len * 0.35, cutoff: 360, detune: 9 })
      tone('sine', freq / 2, time, len, 0.07 * e.velocity, { attack: len * 0.3 })
    },
    pluck: (time, e) => tone('triangle', midiToFreq(e.note), time, 0.4, 0.16 * e.velocity, { attack: 0.004, cutoff: 3000 }),
    shimmer: (time, e) => {
      const freq = midiToFreq(e.note)
      tone('sine', freq, time, 1.0, 0.07 * e.velocity, { attack: 0.01 })
      tone('sine', freq * 2, time, 0.55, 0.025 * e.velocity, { attack: 0.01, detune: 7 })
    },
    drip: (time, e) => {
      const osc = ctx.createOscillator()
      const freq = midiToFreq(e.note)
      osc.frequency.setValueAtTime(freq, time)
      osc.frequency.exponentialRampToValueAtTime(freq * 0.62, time + 0.16)
      osc.connect(envelope(time, 0.11 * e.velocity, 0.004, 0.45))
      osc.start(time)
      osc.stop(time + 0.5)
    },
    thud: (time, e) => {
      const osc = ctx.createOscillator()
      osc.frequency.setValueAtTime(95, time)
      osc.frequency.exponentialRampToValueAtTime(40, time + 0.2)
      osc.connect(envelope(time, 0.6 * e.velocity, 0.004, 0.4))
      osc.start(time)
      osc.stop(time + 0.45)
    },
    lead: (time, e, len) => {
      const freq = midiToFreq(e.note)
      tone('square', freq, time, len, 0.13, { attack: 0.012, cutoff: 3200 })
      tone('triangle', freq * 2, time, len, 0.06, { attack: 0.012, detune: 6 })
    },
  }

  function scheduleAhead() {
    const track = MUSIC_TRACKS[mode]
    const secondsPerStep = stepDuration(track.bpm)
    // After a long stall (a backgrounded tab) don't replay the backlog in
    // one burst -- just pick the beat back up from now.
    if (nextStepTime < ctx.currentTime - 0.1) nextStepTime = ctx.currentTime + 0.05
    while (nextStepTime < ctx.currentTime + LOOKAHEAD_SECONDS) {
      for (const event of track.events(stepIndex)) {
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
      audio.start()
      if (!ctx) buildGraph()
      ctx.resume()
      nextStepTime = ctx.currentTime + 0.1
      timer = setInterval(scheduleAhead, TICK_MS)
      document.addEventListener('visibilitychange', onVisibilityChange)
    },
    // Mutes/unmutes the shared master gain, so this also mutes the sound
    // effects riding along on the same AudioContext.
    toggleMuted() {
      return audio.toggleMuted()
    },
    // Ducks the track under a low-pass while the game-over screen is up.
    setMuffled(muffled) {
      if (!muffle) return
      muffle.frequency.setTargetAtTime(muffled ? MUFFLED_CUTOFF : OPEN_CUTOFF, ctx.currentTime, 0.15)
    },
    // Switches between the 'normal', 'boss' and 'chill' (pause) tracks, restarting the loop
    // from its top (with the boss track's opening crash) on a change.
    setMode(next) {
      if (!MUSIC_TRACKS[next]) return
      if (next === (pendingMode ?? mode)) return
      if (next === mode && pendingMode) {
        // Changed back before the fade finished: stay on this track and bring it back up.
        clearTimeout(fadeTimer)
        pendingMode = null
        master.gain.cancelScheduledValues(ctx.currentTime)
        master.gain.setTargetAtTime(MUSIC_VOLUME, ctx.currentTime, FADE_SECONDS / 2)
        return
      }
      const restart = () => {
        pendingMode = null
        mode = next
        stepIndex = 0
        if (ctx) nextStepTime = ctx.currentTime + 0.05
      }
      // The resort's own switches (fight, pause) are instant, as ever; anything to or from a Wilds track fades.
      if (!ctx || !(isWildsTrack(mode) || isWildsTrack(next))) {
        restart()
        return
      }
      clearTimeout(fadeTimer)
      pendingMode = next
      master.gain.cancelScheduledValues(ctx.currentTime)
      master.gain.setTargetAtTime(0.0001, ctx.currentTime, FADE_SECONDS / 4)
      fadeTimer = setTimeout(() => {
        restart()
        master.gain.cancelScheduledValues(ctx.currentTime)
        master.gain.setValueAtTime(0.0001, ctx.currentTime)
        master.gain.setTargetAtTime(MUSIC_VOLUME, ctx.currentTime, FADE_SECONDS / 2)
      }, FADE_SECONDS * 1000)
    },
    // 'places' (every place has its own music) or 'classic' (the resort's music always); remembered on this device.
    getStyle: () => style,
    setStyle(next) {
      style = parseMusicStyle(next)
      saveStyle(style)
    },
    currentMode: () => mode,
    isMuted: () => audio.isMuted(),
  }
}
