// Pure, Three-free swing-trail history: a fixed-length window of recent
// tip positions, oldest first, and the alpha falloff along it. Kept free
// of Three.js imports so Vitest can exercise it without WebGL; the
// Three-side ribbon-mesh driver lives in src/trail.js.

// Appends `point` to `history`, dropping the oldest entry once
// `maxLength` is exceeded. Returns a new array; does not mutate
// `history`.
export function pushTrailPoint(history, point, maxLength) {
  const next = [...history, point]
  while (next.length > maxLength) next.shift()
  return next
}

// Alpha for the point at `index` of a trail of `length` points: 0 at the
// oldest end (index 0), 1 at the newest (index length - 1). A trail of
// one point is fully opaque.
export function trailAlphaAt(index, length) {
  if (length <= 1) return 1
  return Math.max(0, Math.min(1, index / (length - 1)))
}
