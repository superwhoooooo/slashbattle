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
