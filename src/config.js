// Tunable constants shared across the game. Grouped by the system that
// mostly cares about them; values are in world units unless noted.

export const TILE_SIZE = 2
export const WALL_HEIGHT = 2.5

export const PLAYER_RADIUS = 0.35
export const PLAYER_HEIGHT = 1.6
export const PLAYER_SPEED = 4 // world units per second
export const PLAYER_MAX_HP = 100
export const PLAYER_IFRAME_DURATION = 0.5 // seconds of invulnerability after taking damage

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
// damage per hit, and radius (collision/knockback/separation radius).
export const MONSTER_TYPES = {
  blobbo: { size: 1.4, color: 0x4caf50, speed: 1.2, hp: 60, damage: 8, radius: 0.6 },
  zippy: { size: 0.6, color: 0x9c27b0, speed: 5.5, hp: 20, damage: 5, radius: 0.25 },
  grumpus: { size: 1.1, color: 0xff5722, speed: 2.0, hp: 100, damage: 15, radius: 0.45 },
}

export const WOBBLE_SPEED = 2 // radians per second
export const WOBBLE_BOB_AMOUNT = 0.05 // world units
export const WOBBLE_SQUASH_AMOUNT = 0.04
export const WOBBLE_FACE_JIGGLE_AMOUNT = 0.05 // radians

export const ATTACK_RANGE = 1.4
export const ATTACK_ARC_RADIANS = Math.PI / 2 // total width of the attack cone
export const ATTACK_COOLDOWN = 0.4 // seconds between swings
export const ATTACK_DAMAGE = 20
export const ATTACK_SWING_DURATION = 0.25 // seconds for the sword to swing through its arc

export const KNOCKBACK_STRENGTH = 1.2 // world units a hit monster is pushed back

export const HIT_FLASH_DURATION = 0.1 // seconds for a hit flash to fade out
export const HIT_SQUASH_DURATION = 0.2 // seconds for a hit squash to rebound
export const DEATH_POP_DURATION = 0.3 // seconds for the death pop before removal

export const SIGHT_RANGE = 6 // world units a monster can see the player at, line-of-sight permitting
export const MONSTER_ATTACK_RANGE = 1.2
export const MONSTER_ATTACK_COOLDOWN = 1.2 // seconds between monster attacks
export const MONSTER_ATTACK_WINDUP_DURATION = 0.3 // seconds of telegraph lean/grow before the hit lands
export const MONSTER_ATTACK_WINDUP_GROW = 0.2 // peak size increase during the telegraph

export const SEARCH_DURATION = 3 // seconds spent looking around before giving up and wandering again
export const SEARCH_SPIN_SPEED = 1.5 // radians per second, while looking around

export const WANDER_RADIUS_TILES = 3
export const WANDER_TIMEOUT = 4 // seconds before repicking a wander target if not arrived

export const MONSTER_ARRIVAL_DISTANCE = 0.3 // world units considered "arrived" at a wander/search target

export const SEPARATION_STRENGTH = 0.5 // how much of an overlap is resolved per frame (0-1)

export const CRATE_SIZE = 1.3
export const HIDE_RANGE = 1.5 // world units within which E enters/is prompted for a box

export const HIDDEN_CAMERA_OFFSET = { x: 0, y: 2, z: 2.5 } // pulled in closer than CAMERA_OFFSET

export const AMBUSH_WINDOW = 1 // seconds after popping out of hiding that attacks deal ambush damage
export const AMBUSH_BANNER_DURATION = 1 // seconds the "AMBUSH!" HUD banner stays up

export const CRATE_WIGGLE_MIN_INTERVAL = 1 // seconds
export const CRATE_WIGGLE_MAX_INTERVAL = 2 // seconds
export const CRATE_WIGGLE_DURATION = 0.3 // seconds
export const CRATE_WIGGLE_ANGLE = 0.25 // radians, peak rotation during a wiggle
export const CRATE_WIGGLE_SCALE_PULSE = 0.08 // peak scale increase during a wiggle
