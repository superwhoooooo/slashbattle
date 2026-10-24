// Clamps value to the inclusive range [min, max].
export function clamp(value, min, max) {
  if (value < min) return min
  if (value > max) return max
  return value
}
