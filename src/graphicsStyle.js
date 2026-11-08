// The graphics style for monsters, picked on the start card and remembered on this
// device: 'jelly' (SlashBattle's glossy candy jellies) or 'shard' (a Shardfall-like
// look: textured, rim-lit bodies with plain cream eyes and horns).
export const GRAPHICS_STYLES = ['jelly', 'shard']
export const GRAPHICS_LABELS = { jelly: 'Jelly', shard: 'Realist' }
const KEY = 'slashbattle:graphics'

let style = 'jelly'
try {
  const saved = localStorage.getItem(KEY)
  if (GRAPHICS_STYLES.includes(saved)) style = saved
} catch (_) {
  // private window / blocked storage: just use the default
}

export function getGraphicsStyle() {
  return style
}

export function setGraphicsStyle(next) {
  if (!GRAPHICS_STYLES.includes(next)) return style
  style = next
  try {
    localStorage.setItem(KEY, style)
  } catch (_) {
    // not remembered, still applies this session
  }
  return style
}

export function nextGraphicsStyle(current = style) {
  return GRAPHICS_STYLES[(GRAPHICS_STYLES.indexOf(current) + 1) % GRAPHICS_STYLES.length]
}
