// Pure, Three-free boss-intro cutscene timeline: the boss materializes
// ('enter'), says its lines one typewriter-d line at a time ('talk'), then
// its name is slammed on screen ('title') before handing control back
// ('done'). The caller feeds it real time plus whether the player pressed
// "next", and reads back which line/how many characters to show.
export const CUTSCENE_ENTER_DURATION = 1.8 // seconds for the boss to materialize before it speaks
export const CUTSCENE_TITLE_DURATION = 1.8 // seconds the boss's name card holds
export const CUTSCENE_CHARS_PER_SECOND = 38
export const CUTSCENE_LINE_HOLD = 1.3 // seconds a finished line stays up before moving on by itself

export function createCutscene() {
  return { phase: 'enter', phaseElapsed: 0, lineIndex: 0, lineElapsed: 0 }
}

// The speaker label the cutscene dialogue box shows for the concierge's
// introduction, ahead of the boss's own name.
export const CONCIERGE_SPEAKER = 'Concierge'

// Builds the full script for a boss's intro: the concierge's one-line
// VIP announcement, prepended ahead of the boss's own dialogue (`lines`,
// from logic/bosses.js). The caller feeds this to stepCutscene in place
// of `lines` directly.
export function introLines(bossName, lines) {
  return [`Please welcome our VIP guest, ${bossName}.`, ...lines]
}

// The speaker for `lineIndex` of a script built by introLines: the
// concierge for the prepended line 0, the boss itself after that.
export function speakerFor(boss, lineIndex) {
  return lineIndex === 0 ? CONCIERGE_SPEAKER : boss.name
}

// How many characters of `text` are visible `elapsed` seconds into a line.
export function visibleChars(text, elapsed) {
  return Math.min(text.length, Math.floor(Math.max(elapsed, 0) * CUTSCENE_CHARS_PER_SECOND))
}

// Advances the cutscene by dt. `advancePressed` skips ahead: it finishes
// the current line's typing first, and a second press moves to the next
// line (or on to the name card after the last one). `lines` is the
// boss's dialogue. Returns the next state without mutating `state`.
export function stepCutscene(state, dt, advancePressed, lines) {
  const next = { ...state, phaseElapsed: state.phaseElapsed + dt }

  if (state.phase === 'enter') {
    if (next.phaseElapsed >= CUTSCENE_ENTER_DURATION || advancePressed) {
      return { phase: 'talk', phaseElapsed: 0, lineIndex: 0, lineElapsed: 0 }
    }
    return next
  }

  if (state.phase === 'talk') {
    next.lineElapsed = state.lineElapsed + dt
    const line = lines[state.lineIndex]
    const typedAll = visibleChars(line, next.lineElapsed) >= line.length
    const typedAllTime = line.length / CUTSCENE_CHARS_PER_SECOND

    let advance = false
    if (advancePressed) {
      if (typedAll) advance = true
      else next.lineElapsed = typedAllTime // first press: finish typing
    } else if (next.lineElapsed >= typedAllTime + CUTSCENE_LINE_HOLD) {
      advance = true
    }

    if (advance) {
      if (state.lineIndex + 1 >= lines.length) {
        return { phase: 'title', phaseElapsed: 0, lineIndex: state.lineIndex, lineElapsed: 0 }
      }
      return { phase: 'talk', phaseElapsed: 0, lineIndex: state.lineIndex + 1, lineElapsed: 0 }
    }
    return next
  }

  if (state.phase === 'title') {
    if (next.phaseElapsed >= CUTSCENE_TITLE_DURATION || advancePressed) {
      return { ...next, phase: 'done' }
    }
    return next
  }

  return next
}
