// Pure, Three-free resort PA voice: the lines shown in the wave banner,
// the boss-intro cutscene and the low-hp warning -- a deadpan five-star
// resort staff calmly announcing chaos. Each kind has its own pool of a
// few lines (`lead` is the short department tag the HUD highlights;
// `text` is the line itself, or a function of `{ wave, bossName }` for
// the ones that interpolate the wave number or a boss's name).
// pickAnnouncement picks one at random and skips whichever line played
// last for that kind, so the same announcement doesn't repeat back to
// back. rng is injectable (default Math.random) for deterministic
// tests; the caller is responsible for calling this once per banner
// (not every frame) and keeping the previous pick around to pass back in.
const LINES = {
  // The intermission countdown ahead of a regular wave.
  waveStart: [
    { lead: 'FRONT DESK', text: ({ wave }) => `Wave ${wave} guests are now checking in. Please remain calm.` },
    { lead: 'CONCIERGE', text: 'Additional guests are arriving. Do mind the jellies.' },
    { lead: 'POOL STAFF', text: ({ wave }) => `Wave ${wave} arrivals are being escorted to the deck.` },
    { lead: 'BELL DESK', text: ({ wave }) => `Wave ${wave} has checked in. Luggage not included.` },
    { lead: 'HOUSEKEEPING', text: 'Please stand by while rooms are prepared for incoming guests.' },
    { lead: 'FRONT DESK', text: 'More guests are checking in. Occupancy limits do not apply to monsters.' },
  ],
  // Shown once a wave is cleared; the caller appends the score bonus.
  waveCleared: [
    { lead: 'FRONT DESK', text: 'The deck has been cleared of unticketed guests.' },
    { lead: 'HOUSEKEEPING', text: 'Housekeeping has finished with the jellies. For now.' },
    { lead: 'POOL STAFF', text: 'The pool is open again. You may towel off.' },
    { lead: 'CONCIERGE', text: 'That unpleasantness has been resolved. Thank you for your patience.' },
    { lead: 'BELL DESK', text: 'The grounds are tidy again. Briefly.' },
    { lead: 'FRONT DESK', text: 'Checkout is at noon. Or whenever you fall off the deck.' },
  ],
  // The intermission countdown right before a boss's cutscene starts.
  bossIncoming: [
    { lead: 'CONCIERGE', text: ({ bossName }) => `A VIP guest, ${bossName}, is arriving. Please applaud politely.` },
    { lead: 'FRONT DESK', text: ({ bossName }) => `${bossName} has requested the entire deck. Immediately.` },
    { lead: 'POOL STAFF', text: 'The pool is closed for a very important arrival.' },
    { lead: 'HOUSEKEEPING', text: ({ bossName }) => `Housekeeping has been briefed on ${bossName}.` },
    { lead: 'CONCIERGE', text: 'Our VIP suite has relocated itself to the deck.' },
  ],
  // Shown once when the player's hp first drops to/under LOW_HP_PULSE_THRESHOLD.
  lowHp: [
    { lead: 'FRONT DESK', text: 'Guests are reminded that the infirmary is down the hall. Eventually.' },
    { lead: 'HOUSEKEEPING', text: 'Housekeeping has been notified about the mess you are about to become.' },
    { lead: 'CONCIERGE', text: 'We regret to inform you that you look unwell.' },
    { lead: 'POOL STAFF', text: 'Lifeguards are not currently on duty for this kind of emergency.' },
    { lead: 'BELL DESK', text: 'Shall we call ahead to the infirmary?' },
  ],
  // Replaces the plain "AMBUSH!" text when popping out of hiding lands a bonus hit.
  ambush: [
    { lead: 'POOL STAFF', text: 'Surprise!' },
    { lead: 'FRONT DESK', text: 'Unscheduled visit.' },
    { lead: 'CONCIERGE', text: 'Ambush service.' },
    { lead: 'BELL DESK', text: 'Surprise checkout!' },
  ],
}

// Picks one line from `kind`'s pool, rendering its text against `wave`/
// `bossName` if it needs them. `previous` is the prior return value;
// whichever candidate would render the same text is skipped, unless
// that's every candidate, in which case the skip is dropped rather than
// picking from an empty list. Returns `{ lead: '', text: '' }` for an
// unrecognized kind.
export function pickAnnouncement(kind, { wave, bossName, rng = Math.random, previous = null } = {}) {
  const pool = LINES[kind] ?? []
  if (pool.length === 0) return { lead: '', text: '' }

  const rendered = pool.map((line) => ({
    lead: line.lead,
    text: typeof line.text === 'function' ? line.text({ wave, bossName }) : line.text,
  }))

  const choices = previous ? rendered.filter((line) => line.text !== previous.text) : rendered
  const pick = choices.length > 0 ? choices : rendered
  return pick[Math.floor(rng() * pick.length)]
}
