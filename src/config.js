// Tunable constants shared across the game. Grouped by the system that
// mostly cares about them; values are in world units unless noted.

export const TILE_SIZE = 2
export const WALL_HEIGHT = 2.5

export const PLAYER_RADIUS = 0.35
export const PLAYER_HEIGHT = 1.6
export const PLAYER_SPEED = 4 // world units per second

export const CAMERA_OFFSET = { x: 0, y: 5, z: 6 } // behind and above the player
export const CAMERA_LERP = 6 // higher = camera catches up to the player faster

export const AMBIENT_LIGHT_INTENSITY = 0.35
export const TORCH_LIGHT_COLOR = 0xffaa55
export const TORCH_LIGHT_INTENSITY = 6
export const TORCH_LIGHT_DISTANCE = 8

export const FOG_COLOR = 0x0b0b12
export const FOG_NEAR = 6
export const FOG_FAR = 24

// Monster types: size (body scale), color, speed (world units/second), hp,
// and damage per hit. hp/damage are unused until the combat milestone.
export const MONSTER_TYPES = {
  blobbo: { size: 1.4, color: 0x4caf50, speed: 1.2, hp: 60, damage: 8 },
  zippy: { size: 0.6, color: 0x9c27b0, speed: 5.5, hp: 20, damage: 5 },
  grumpus: { size: 1.1, color: 0xff5722, speed: 2.0, hp: 100, damage: 15 },
}

export const WOBBLE_SPEED = 2 // radians per second
export const WOBBLE_BOB_AMOUNT = 0.05 // world units
export const WOBBLE_SQUASH_AMOUNT = 0.04
export const WOBBLE_FACE_JIGGLE_AMOUNT = 0.05 // radians
