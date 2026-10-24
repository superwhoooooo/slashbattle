// Pure, Three-free game state evaluation: given the player's hp and how
// many monsters remain, what screen (if any) should be showing. Kept
// free of Three.js imports so Vitest can exercise it without WebGL.

// Returns 'playing', 'won' (no monsters remain), or 'lost' (the player
// has no hp left). If both happen on the same frame, lost takes priority
// — dying and winning in the same hit reads as a loss, not a win.
export function evaluateGameState({ playerHp, monstersRemaining }) {
  if (playerHp <= 0) return 'lost'
  if (monstersRemaining <= 0) return 'won'
  return 'playing'
}
