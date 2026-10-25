// Pure, Three-free falling physics: once a character has left the
// platform, its fall accelerates downward under gravity. Kept free of
// Three.js imports so Vitest can exercise it without WebGL; the
// Three-side driver (main.js) merges the result into a mesh's position
// and decides when a fall has gone far enough to remove/respawn its
// owner.

// Advances one tick of a fall. `fall` is { velocityY, fallenY }: velocityY
// is the current downward speed (world units/second) and fallenY is how
// far below the platform the faller has already dropped, both starting
// at 0 the moment a fall begins. Returns the next tick's { velocityY,
// fallenY }; the caller merges them back onto the faller (it does not
// mutate `fall`).
export function stepFall(fall, dt, gravity) {
  const velocityY = fall.velocityY + gravity * dt
  const fallenY = fall.fallenY + velocityY * dt
  return { velocityY, fallenY }
}
