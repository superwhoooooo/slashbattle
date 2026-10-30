// Pure, Three-free phrasing for HUD text that isn't just a raw number --
// kept here (rather than inline in hud.js) so it's covered by Vitest
// without needing the DOM.

// Resort-voice phrasing for the enemies-left line: a plain count reads
// flat next to "Guest Health", so this reads it as guests checked in
// (singular/plural), with a cleared-out line at zero -- which also
// covers the gap between waves, when nothing's spawned in yet.
export function enemiesLeftText(count) {
  if (count <= 0) return 'All guests checked out'
  return `${count} guest${count === 1 ? '' : 's'} still checked in`
}
