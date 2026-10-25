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
// Noisy per-light intensity variation: a sum of two sines at different
// speeds (plus a random per-torch phase) so torches don't flicker in sync.
export const TORCH_FLICKER_SPEED_A = 7 // radians per second
export const TORCH_FLICKER_SPEED_B = 13 // radians per second
export const TORCH_FLICKER_AMOUNT = 0.25 // fraction of TORCH_LIGHT_INTENSITY

export const FLAME_COLOR = 0xffaa33
export const FLAME_RADIUS = 0.1
export const FLAME_HEIGHT = 0.25

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

// Arena platform geometry and the neon grid pulsing across its top.
export const ARENA_RADIUS = 16
export const ARENA_THICKNESS = 1.2
export const ARENA_TOP_COLOR = 0x14141c
export const ARENA_UNDERSIDE_COLOR = 0x0a0a10
export const ARENA_GRID_COLOR = '#19e7ff'
export const ARENA_GRID_PULSE_SPEED = 1.5 // radians per second
export const ARENA_RIM_COLOR = 0x00e5ff
export const ARENA_RIM_THICKNESS = 0.5

// Glowing thrusters on the platform's tapered underside, so it reads as
// floating rather than resting on something.
export const ARENA_THRUSTER_COUNT = 6
export const ARENA_THRUSTER_COLOR = 0xff2db0
export const ARENA_THRUSTER_LIGHT_INTENSITY = 4
export const ARENA_THRUSTER_LIGHT_DISTANCE = 6
export const ARENA_THRUSTER_PULSE_SPEED = 2.2 // radians per second
export const ARENA_THRUSTER_PULSE_AMOUNT = 0.3 // fraction of ARENA_THRUSTER_LIGHT_INTENSITY

// Neon light pylons standing around the platform's rim, replacing the
// dungeon's torches. Each pairs a PointLight with a glowing cap, pulsing
// gently (a sum of two sines at different speeds, offset by a random
// per-pylon phase, same idea as the old torch flicker).
export const PYLON_COUNT = 6
export const PYLON_COLORS = [0x00e5ff, 0xff2db0, 0x7cff5a]
export const PYLON_LIGHT_INTENSITY = 6
export const PYLON_LIGHT_DISTANCE = 10
export const PYLON_PULSE_SPEED_A = 1.3 // radians per second
export const PYLON_PULSE_SPEED_B = 2.1 // radians per second
export const PYLON_PULSE_AMOUNT = 0.3 // fraction of PYLON_LIGHT_INTENSITY

// Space backdrop: a starfield on a large sphere plus a gradient nebula
// sky further out still.
export const STARFIELD_COUNT = 4000
export const STARFIELD_RADIUS = 400
export const SKY_RADIUS = 450

// Lighting: a soft hemisphere fill plus a shadow-casting directional key
// light (the platform receives shadows; characters cast them).
export const HEMI_LIGHT_SKY_COLOR = 0x8899ff
export const HEMI_LIGHT_GROUND_COLOR = 0x1a0a2a
export const HEMI_LIGHT_INTENSITY = 0.6
export const KEY_LIGHT_COLOR = 0xbcd2ff
export const KEY_LIGHT_INTENSITY = 1.6
export const SHADOW_MAP_SIZE = 2048

// Post-processing bloom (EffectComposer + UnrealBloomPass in main.js).
export const BLOOM_STRENGTH = 0.9
export const BLOOM_RADIUS = 0.6
export const BLOOM_THRESHOLD = 0.2

export const CAMERA_FAR = 1500

// Falling off the platform's edge.
export const FALL_GRAVITY = 20 // world units/second^2
export const FALL_DESPAWN_DEPTH = 4 // world units below the platform before a faller is removed/respawned
export const FALL_DAMAGE = 25
export const MONSTER_FALL_TUMBLE_SPEED = 3 // radians/second, cosmetic tumble while falling

// Keeps monster steering targets (wander/chase/search) off the very edge
// of the platform, so only knockback -- never a monster's own steering --
// can send it over the side.
export const MONSTER_PLATFORM_MARGIN = 1.5

// Temporary fixed ring of 5 crate positions on the platform (radius 8),
// standing in as circular obstacles until a later milestone spawns them
// dynamically and restyles them as cargo pods.
export const CRATE_RING_RADIUS = 8
export const CRATE_POSITIONS = [
  { x: 0, z: 8 },
  { x: 7.61, z: 2.47 },
  { x: 4.7, z: -6.47 },
  { x: -4.7, z: -6.47 },
  { x: -7.61, z: 2.47 },
]
export const CRATE_OBSTACLE_RADIUS = 0.9

// Milestone A keeps a fixed starting group of monsters (waves arrive in
// a later milestone), spawned at the platform's edge.
export const STARTING_MONSTER_COUNT = 4
export const EDGE_SPAWN_MARGIN = 1 // world units in from the platform's edge for edge spawns

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

// Camera screen shake: a short decaying random offset. "Damage" is the
// player getting hit; "hit" is the player's attack landing on a monster.
export const SHAKE_DAMAGE_MAGNITUDE = 0.25 // world units, peak offset
export const SHAKE_DAMAGE_DURATION = 0.3 // seconds to decay to nothing
export const SHAKE_HIT_MAGNITUDE = 0.08
export const SHAKE_HIT_DURATION = 0.15
