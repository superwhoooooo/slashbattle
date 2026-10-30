// Procedural sound effects: no audio files, just short Web Audio
// oscillator/noise voices synthesized on demand, sharing the
// AudioContext and master mute src/music.js sets up (src/audio.js).
// Positional voices (a swing, a hit, a fall, a zip) route through a
// PannerNode so they pan and fade with distance from the camera; a
// handful of UI-ish ones (a crystal pickup, a chest, the wave-cleared
// chime, a PA announcement) play the same everywhere.
import * as THREE from 'three'
import { createNoiseBuffer } from './audio.js'
import { canPlayVoice, createVoiceState, registerVoicePlay } from './logic/sfx.js'

// A PannerNode's inverse distance falloff: full volume at refDistance,
// still audible (just quieter) by the time something is ~20 units out.
const PANNER_REF_DISTANCE = 3
const PANNER_ROLLOFF_FACTOR = 1.2
const PANNER_MAX_DISTANCE = 100

const SWING_DURATION = 0.18
const SWING_PEAK = 0.22
const SWING_FREQ_START = 600
const SWING_FREQ_END = 2400

const HIT_DURATION = 0.12
const HIT_PEAK = 0.3
const HIT_FREQ_START = 220
const HIT_FREQ_END = 90
const HIT_CLICK_DURATION = 0.05
const HIT_CLICK_PEAK = 0.18
const HIT_CLICK_FREQ = 3500

const KILL_DURATION = 0.22
const KILL_PEAK = 0.35
const KILL_FREQ_START = 180
const KILL_FREQ_END = 60
const KILL_SPLAT_DURATION = 0.18
const KILL_SPLAT_PEAK = 0.3
const KILL_SPLAT_FREQ = 900
const KILL_BLIP_DELAY = 0.09
const KILL_BLIP_DURATION = 0.12
const KILL_BLIP_PEAK = 0.18
const KILL_BLIP_FREQ_START = 600
const KILL_BLIP_FREQ_END = 1200

const RING_OUT_DURATION = 0.6
const RING_OUT_PEAK = 0.3
const RING_OUT_FREQ_START = 1200
const RING_OUT_FREQ_END = 220

const CANNONBALL_DURATION = 0.4
const CANNONBALL_PEAK = 0.32
const CANNONBALL_FREQ_START = 2200
const CANNONBALL_FREQ_END = 180

const CRYSTAL_DURATION = 0.08
const CRYSTAL_PEAK = 0.18
const CRYSTAL_FREQ = 1800

const CHEST_NOTE_DURATION = 0.14
const CHEST_NOTE_GAP = 0.1
const CHEST_NOTE_PEAK = 0.22
const CHEST_NOTE_FREQS = [880, 1320]

const POD_ZIP_DURATION = 0.22
const POD_ZIP_PEAK = 0.22
const POD_ZIP_FREQ_LOW = 500
const POD_ZIP_FREQ_HIGH = 3200

const HURT_DURATION = 0.18
const HURT_PEAK = 0.3
const HURT_FREQ_START = 150
const HURT_FREQ_END = 70

const SLAM_DURATION = 0.35
const SLAM_PEAK = 0.5
const SLAM_FREQ_START = 110
const SLAM_FREQ_END = 40
const SLAM_RUMBLE_DURATION = 0.5
const SLAM_RUMBLE_PEAK = 0.3
const SLAM_RUMBLE_FREQ = 150

const CHIME_NOTE_DURATION = 0.16
const CHIME_NOTE_GAP = 0.14
const CHIME_PEAK = 0.22
const CHIME_NOTE_FREQS = [1320, 1046, 1320] // ding, dong, ding

const ANNOUNCEMENT_DURATION = 0.3
const ANNOUNCEMENT_PEAK = 0.15
const ANNOUNCEMENT_FREQ = 1760

// A gain node with a fast attack and exponential decay, wired to
// `destination` (the master gain, or a PannerNode on its way there).
function envelope(ctx, destination, time, peak, attack, length) {
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.0001, time)
  gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), time + attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, time + length)
  gain.connect(destination)
  return gain
}

function tone(ctx, destination, type, freq, time, length, peak, { attack = 0.004, freqEnd = null } = {}) {
  const osc = ctx.createOscillator()
  osc.type = type
  osc.frequency.setValueAtTime(freq, time)
  if (freqEnd != null) osc.frequency.exponentialRampToValueAtTime(freqEnd, time + length)
  osc.connect(envelope(ctx, destination, time, peak, attack, length))
  osc.start(time)
  osc.stop(time + length + 0.05)
}

function noise(ctx, destination, noiseBuffer, time, length, peak, filterType, frequency, { attack = 0.003, frequencyEnd = null, q = null } = {}) {
  const src = ctx.createBufferSource()
  src.buffer = noiseBuffer
  const filter = ctx.createBiquadFilter()
  filter.type = filterType
  filter.frequency.setValueAtTime(frequency, time)
  if (frequencyEnd != null) filter.frequency.exponentialRampToValueAtTime(frequencyEnd, time + length)
  if (q != null) filter.Q.value = q
  filter.connect(envelope(ctx, destination, time, peak, attack, length))
  src.connect(filter)
  src.start(time, Math.random() * 0.5)
  src.stop(time + length + 0.05)
}

// Every named voice: short, punchy, cheerful synthesis recipes. Each
// takes (ctx, destination, noiseBuffer, time) -- destination is the
// master gain for a UI-ish sound, or a PannerNode for a positional one.
const VOICES = {
  // An airy whoosh: filtered noise sweeping upward as the blade swings.
  swing: (ctx, destination, noiseBuffer, time) => {
    noise(ctx, destination, noiseBuffer, time, SWING_DURATION, SWING_PEAK, 'bandpass', SWING_FREQ_START, {
      frequencyEnd: SWING_FREQ_END,
      q: 0.6,
    })
  },
  // A squelchy jelly thwack: a pitch-dropping sine thump plus a brief
  // noise click on top.
  hit: (ctx, destination, noiseBuffer, time) => {
    tone(ctx, destination, 'sine', HIT_FREQ_START, time, HIT_DURATION, HIT_PEAK, { freqEnd: HIT_FREQ_END })
    noise(ctx, destination, noiseBuffer, time, HIT_CLICK_DURATION, HIT_CLICK_PEAK, 'highpass', HIT_CLICK_FREQ, { attack: 0.001 })
  },
  // A bigger splat (a lower thump plus a muffled noise burst) and a
  // tiny ascending blip right after, for a kill that isn't a fall or a
  // pool splash.
  kill: (ctx, destination, noiseBuffer, time) => {
    tone(ctx, destination, 'sine', KILL_FREQ_START, time, KILL_DURATION, KILL_PEAK, { freqEnd: KILL_FREQ_END })
    noise(ctx, destination, noiseBuffer, time, KILL_SPLAT_DURATION, KILL_SPLAT_PEAK, 'lowpass', KILL_SPLAT_FREQ)
    tone(ctx, destination, 'triangle', KILL_BLIP_FREQ_START, time + KILL_BLIP_DELAY, KILL_BLIP_DURATION, KILL_BLIP_PEAK, {
      freqEnd: KILL_BLIP_FREQ_END,
    })
  },
  // A descending slide whistle for a ring-out (Checkout/VIP Checkout).
  ringOut: (ctx, destination, noiseBuffer, time) => {
    tone(ctx, destination, 'sine', RING_OUT_FREQ_START, time, RING_OUT_DURATION, RING_OUT_PEAK, {
      attack: 0.01,
      freqEnd: RING_OUT_FREQ_END,
    })
  },
  // A splash: a noise burst swept down through a low-pass filter.
  cannonball: (ctx, destination, noiseBuffer, time) => {
    noise(ctx, destination, noiseBuffer, time, CANNONBALL_DURATION, CANNONBALL_PEAK, 'lowpass', CANNONBALL_FREQ_START, {
      attack: 0.005,
      frequencyEnd: CANNONBALL_FREQ_END,
    })
  },
  // A bright, tiny blip for a crystal pickup; rate-limited (logic/sfx.js)
  // so a handful landing at once doesn't stack into a buzz.
  crystal: (ctx, destination, noiseBuffer, time) => {
    tone(ctx, destination, 'triangle', CRYSTAL_FREQ, time, CRYSTAL_DURATION, CRYSTAL_PEAK, { attack: 0.002 })
  },
  // A two-note chime for opening a chest.
  chestOpen: (ctx, destination, noiseBuffer, time) => {
    CHEST_NOTE_FREQS.forEach((freq, i) => {
      tone(ctx, destination, 'triangle', freq, time + i * CHEST_NOTE_GAP, CHEST_NOTE_DURATION, CHEST_NOTE_PEAK, { attack: 0.005 })
    })
  },
  // A zip sliding up (hiding in a pod): filtered noise with a rising
  // pitch ramp.
  podIn: (ctx, destination, noiseBuffer, time) => {
    noise(ctx, destination, noiseBuffer, time, POD_ZIP_DURATION, POD_ZIP_PEAK, 'bandpass', POD_ZIP_FREQ_LOW, {
      attack: 0.005,
      frequencyEnd: POD_ZIP_FREQ_HIGH,
      q: 4,
    })
  },
  // The same zip sliding down (popping out of a pod).
  podOut: (ctx, destination, noiseBuffer, time) => {
    noise(ctx, destination, noiseBuffer, time, POD_ZIP_DURATION, POD_ZIP_PEAK, 'bandpass', POD_ZIP_FREQ_HIGH, {
      attack: 0.005,
      frequencyEnd: POD_ZIP_FREQ_LOW,
      q: 4,
    })
  },
  // A low bonk for the player taking damage.
  playerHurt: (ctx, destination, noiseBuffer, time) => {
    tone(ctx, destination, 'sine', HURT_FREQ_START, time, HURT_DURATION, HURT_PEAK, { freqEnd: HURT_FREQ_END })
  },
  // A deep thump plus a short low rumble for a boss's ground slam.
  bossSlam: (ctx, destination, noiseBuffer, time) => {
    tone(ctx, destination, 'sine', SLAM_FREQ_START, time, SLAM_DURATION, SLAM_PEAK, { attack: 0.004, freqEnd: SLAM_FREQ_END })
    noise(ctx, destination, noiseBuffer, time, SLAM_RUMBLE_DURATION, SLAM_RUMBLE_PEAK, 'lowpass', SLAM_RUMBLE_FREQ, { attack: 0.01 })
  },
  // A three-note resort "ding-dong-ding" chime for clearing a wave.
  waveCleared: (ctx, destination, noiseBuffer, time) => {
    CHIME_NOTE_FREQS.forEach((freq, i) => {
      tone(ctx, destination, 'sine', freq, time + i * CHIME_NOTE_GAP, CHIME_NOTE_DURATION, CHIME_PEAK, { attack: 0.005 })
    })
  },
  // A soft PA chime just before an announcement banner shows.
  announcement: (ctx, destination, noiseBuffer, time) => {
    tone(ctx, destination, 'sine', ANNOUNCEMENT_FREQ, time, ANNOUNCEMENT_DURATION, ANNOUNCEMENT_PEAK, { attack: 0.02 })
  },
}

// A PannerNode at `position` ({x, y?, z}), wired to the shared master
// gain. HRTF/inverse falloff tuned so something ~20 units away is
// quieter but still audible, not silent.
function connectPanner(ctx, master, position) {
  const panner = ctx.createPanner()
  panner.panningModel = 'HRTF'
  panner.distanceModel = 'inverse'
  panner.refDistance = PANNER_REF_DISTANCE
  panner.rolloffFactor = PANNER_ROLLOFF_FACTOR
  panner.maxDistance = PANNER_MAX_DISTANCE
  const y = position.y ?? 1
  if (panner.positionX) {
    panner.positionX.value = position.x
    panner.positionY.value = y
    panner.positionZ.value = position.z
  } else {
    panner.setPosition(position.x, y, position.z)
  }
  panner.connect(master)
  return panner
}

const listenerForward = new THREE.Vector3()
const listenerUp = new THREE.Vector3()

// `audio` is the shared src/audio.js instance: its context and master
// gain (the one the M key mutes) are reused rather than creating a
// second AudioContext.
export function createSfx(audio) {
  let noiseBuffer = null
  let voiceState = createVoiceState()

  function sharedNoiseBuffer(ctx) {
    if (!noiseBuffer) noiseBuffer = createNoiseBuffer(ctx)
    return noiseBuffer
  }

  return {
    // Synthesizes and plays `name` (one of the VOICES above), optionally
    // positioned in 3D at `position` ({x, y?, z}) through a PannerNode --
    // omit it for a UI-ish sound that should sound the same everywhere.
    // A no-op before the first user gesture (audio.context is still
    // null), for an unknown voice name, or if Web Audio throws for any
    // reason -- a synthesis glitch should never break gameplay.
    play(name, position = null) {
      const ctx = audio.context
      const recipe = VOICES[name]
      if (!ctx || !recipe) return
      const now = ctx.currentTime
      if (!canPlayVoice(voiceState, name, now)) return
      voiceState = registerVoicePlay(voiceState, name, now)
      try {
        const destination = position ? connectPanner(ctx, audio.master, position) : audio.master
        recipe(ctx, destination, sharedNoiseBuffer(ctx), now)
      } catch {
        // Ignore: never let a synthesis glitch break gameplay.
      }
    },

    // Keeps the shared AudioContext's listener at the camera's position
    // and facing, so positional voices pan/attenuate correctly. Call
    // every frame once the camera has settled for that frame.
    updateListener(camera) {
      const ctx = audio.context
      if (!ctx) return
      const listener = ctx.listener
      const pos = camera.position
      camera.getWorldDirection(listenerForward)
      listenerUp.copy(camera.up).applyQuaternion(camera.quaternion)
      try {
        if (listener.positionX) {
          listener.positionX.value = pos.x
          listener.positionY.value = pos.y
          listener.positionZ.value = pos.z
          listener.forwardX.value = listenerForward.x
          listener.forwardY.value = listenerForward.y
          listener.forwardZ.value = listenerForward.z
          listener.upX.value = listenerUp.x
          listener.upY.value = listenerUp.y
          listener.upZ.value = listenerUp.z
        } else {
          listener.setPosition(pos.x, pos.y, pos.z)
          listener.setOrientation(listenerForward.x, listenerForward.y, listenerForward.z, listenerUp.x, listenerUp.y, listenerUp.z)
        }
      } catch {
        // Ignore: a listener update failing shouldn't break gameplay either.
      }
    },
  }
}
