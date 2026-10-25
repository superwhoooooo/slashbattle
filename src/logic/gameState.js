// Pure, Three-free game state evaluation: given the player's hp, what
// screen (if any) should be showing. Kept free of Three.js imports so
// Vitest can exercise it without WebGL. There's no win state -- the
// waves are endless -- so this is just alive or dead.

// Returns 'playing', or 'lost' (the player has no hp left).
export function evaluateGameState({ playerHp }) {
  if (playerHp <= 0) return 'lost'
  return 'playing'
}
