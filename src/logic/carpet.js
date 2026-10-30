// Pure timing for the boss-intro cutscene's red carpet: how far along
// (0-1) it has unrolled `elapsed` seconds into a roll of `duration`
// seconds (the cutscene's `enter` phase, CUTSCENE_ENTER_DURATION) --
// eased so it slows into its final length rather than snapping to a stop.
export function carpetLengthFraction(elapsed, duration) {
  const t = Math.min(Math.max(elapsed, 0) / duration, 1)
  return Math.sin((t * Math.PI) / 2)
}
