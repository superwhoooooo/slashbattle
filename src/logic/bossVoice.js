// Pure, Web-Audio-free boss "dialogue noises": while a boss's line types out in the intro cutscene,
// every other letter blips, Animal Crossing style. Each boss has its own weird voice (a waveform, a
// base pitch, how far letters bend it, a slide, a wobble, a growl of noise, a harmonic). The letter
// picks the pitch within the voice's range, so the same words always garble the same way.
// src/sfx.js's `babble` synthesizes the result.

// base: Hz of the lowest letter. range: octaves the letters spread over. dur: blip seconds. slide: pitch
// multiplier across the blip (<1 sags, >1 swoops). wobble: 0-1 vibrato depth. growl: 0-1 noise mixed in.
// fifth: an extra detuned partial (ratio) for a spooky chord, or 0.
export const BOSS_VOICES = {
  concierge: { wave: 'sine', base: 520, range: 0.5, dur: 0.07, slide: 1.04, wobble: 0, growl: 0, fifth: 0 },
  boss_gloop: { wave: 'sine', base: 120, range: 1.2, dur: 0.12, slide: 0.55, wobble: 0.5, growl: 0.1, fifth: 0 }, // a wet bubbling gurgle
  boss_zipzilla: { wave: 'square', base: 700, range: 1.4, dur: 0.045, slide: 1.5, wobble: 0.1, growl: 0, fifth: 0 }, // frantic chipmunk chirps
  boss_grumpsalot: { wave: 'sawtooth', base: 70, range: 0.7, dur: 0.14, slide: 0.8, wobble: 0.05, growl: 0.5, fifth: 0 }, // a gruff knight's rumble
  boss_wobble: { wave: 'triangle', base: 260, range: 1.6, dur: 0.1, slide: 1, wobble: 1, growl: 0, fifth: 0 }, // a very wobbly mad doctor
  boss_conefather: { wave: 'sawtooth', base: 95, range: 0.9, dur: 0.15, slide: 0.7, wobble: 0.2, growl: 0.35, fifth: 1.5 }, // godfather mumble
  boss_mayhem: { wave: 'square', base: 380, range: 1.8, dur: 0.08, slide: 1.25, wobble: 0.6, growl: 0.05, fifth: 1.335 }, // cackling chaos
  boss_omega: { wave: 'sine', base: 55, range: 1.0, dur: 0.2, slide: 0.9, wobble: 0.15, growl: 0.2, fifth: 2 }, // a deep, cosmic hum
  boss_blobbo: { wave: 'triangle', base: 150, range: 1.1, dur: 0.11, slide: 0.65, wobble: 0.3, growl: 0, fifth: 0 },
  boss_zippy: { wave: 'square', base: 820, range: 1.2, dur: 0.04, slide: 1.8, wobble: 0, growl: 0, fifth: 0 },
  boss_grumpus: { wave: 'sawtooth', base: 80, range: 0.8, dur: 0.13, slide: 0.75, wobble: 0, growl: 0.45, fifth: 0 },
  boss_bloater: { wave: 'sine', base: 105, range: 1.0, dur: 0.16, slide: 0.5, wobble: 0.7, growl: 0.3, fifth: 0 }, // a squelchy, gassy drawl
  boss_spinner: { wave: 'triangle', base: 440, range: 2.0, dur: 0.06, slide: 1.3, wobble: 0.9, growl: 0, fifth: 1.5 }, // dizzy
  boss_splitter: { wave: 'square', base: 300, range: 1.0, dur: 0.07, slide: 1, wobble: 0.25, growl: 0, fifth: 1.06 }, // two voices out of tune
  boss_mirror: { wave: 'sine', base: 880, range: 0.8, dur: 0.1, slide: 1.02, wobble: 0.05, growl: 0, fifth: 1.003 }, // shimmering echo
  boss_hopper: { wave: 'triangle', base: 200, range: 1.5, dur: 0.07, slide: 1.9, wobble: 0, growl: 0, fifth: 0 }, // boing
  boss_glimmer: { wave: 'sine', base: 640, range: 1.6, dur: 0.05, slide: 0.6, wobble: 0.4, growl: 0, fifth: 1.5 }, // twinkly zaps
}

const FALLBACK_WAVES = ['sine', 'triangle', 'square', 'sawtooth']

// A voice for any boss id (unknown ones get a stable made-up one, so a new boss is never silent).
export function voiceFor(speakerId) {
  if (BOSS_VOICES[speakerId]) return BOSS_VOICES[speakerId]
  let h = 0
  for (const c of String(speakerId)) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return { wave: FALLBACK_WAVES[h % 4], base: 100 + (h % 500), range: 0.6 + ((h >> 3) % 15) / 10, dur: 0.05 + ((h >> 5) % 10) / 80, slide: 0.6 + ((h >> 7) % 12) / 10, wobble: ((h >> 9) % 10) / 10, growl: ((h >> 11) % 4) / 10, fifth: 0 }
}

// Letters and digits make a sound; spaces and punctuation are silent.
export const isVoiced = (char) => /[a-z0-9]/i.test(char)

// The blip for one typed character of a line: { freq, dur, ... } or null when this character stays quiet.
// Only every other voiced letter blips (index parity) so fast typing reads as babble, not a buzz.
export function babbleFor(char, index, voice) {
  if (!isVoiced(char) || index % 2 === 1) return null
  const code = char.toLowerCase().charCodeAt(0)
  const spread = ((code * 7) % 26) / 25 // each letter lands somewhere in the range, always the same place
  const vowel = 'aeiou'.includes(char.toLowerCase())
  return {
    wave: voice.wave,
    freq: voice.base * 2 ** (spread * voice.range),
    dur: voice.dur * (vowel ? 1.35 : 0.85),
    slide: voice.slide,
    wobble: voice.wobble,
    growl: voice.growl,
    fifth: voice.fifth,
  }
}

// Which character index (if any) to blip given how many characters were visible before and now: at most
// one blip per frame (the newest voiced one), so skipping ahead through a line doesn't machine-gun.
export function newestBlip(text, before, now, voice) {
  for (let i = Math.min(now, text.length) - 1; i >= before; i--) {
    const blip = babbleFor(text[i], i, voice)
    if (blip) return blip
  }
  return null
}
