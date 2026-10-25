// Tunable constants shared across the game. Grouped by the system that
// mostly cares about them; values are in world units unless noted.

export const PLAYER_RADIUS = 0.35
export const PLAYER_BODY_RADIUS = 0.6 // icosahedron radius for the player's jelly body (visual only; PLAYER_RADIUS stays the collision radius)
export const PLAYER_EDGE_COLOR = 0x5fd4ff
export const PLAYER_SPEED = 4 // world units per second
// Speed eases into/out of PLAYER_SPEED over this many seconds (a
// rampToward, not an instant snap) instead of starting/stopping dead.
export const PLAYER_ACCEL_TIME = 0.1
// How snappily the mesh's visual rotation (dampAngle) catches up to the
// player's actual facing direction -- higher converges faster.
export const PLAYER_FACING_DAMPING = 20
export const PLAYER_MAX_HP = 100
export const PLAYER_IFRAME_DURATION = 0.5 // seconds of invulnerability after taking damage

export const CAMERA_OFFSET = { x: 0, y: 11, z: 8 } // behind, above, and looking down at the open platform
export const CAMERA_LERP = 6 // higher = camera catches up to the player faster

// Deep purple/blue, far enough out that it doesn't hide the platform
// (ARENA_RADIUS 48) but still gives the starfield some depth and keeps
// the space mood -- the far edge of the 48-radius platform still fades
// into it a little, rather than staying crisp all the way out.
export const FOG_COLOR = 0x140a2e
export const FOG_NEAR = 70
export const FOG_FAR = 260

// Monster types: shape (jelly body geometry), size (body scale), color,
// edgeColor (the glowing wireframe overlay), speed (world units/second),
// hp, damage per hit, and radius (collision/knockback/separation radius).
export const MONSTER_TYPES = {
  blobbo: { shape: 'dodecahedron', size: 1.4, color: 0x4caf50, edgeColor: 0x9dffb0, speed: 1.2, hp: 60, damage: 8, radius: 0.6 },
  zippy: { shape: 'octahedron', size: 0.6, color: 0x9c27b0, edgeColor: 0xe9a3ff, speed: 5.5, hp: 20, damage: 5, radius: 0.25 },
  grumpus: { shape: 'box', size: 1.1, color: 0xff5722, edgeColor: 0xffc49d, speed: 2.0, hp: 100, damage: 15, radius: 0.45 },
}

// 3D face features (src/face3d.js): googly eyeballs with a jiggling
// pupil, a 3D mouth shape, an optional unibrow/tongue/cheeks/freckles --
// all built from geometry rather than a flat texture, and attached so
// they ride the jelly body's deformation. Colors are kept off pure
// white/black so bloom (BLOOM_THRESHOLD) doesn't wash them out.
export const FACE_EYE_WHITE_COLOR = 0xeeeeee
export const FACE_PUPIL_COLOR = 0x111111
export const FACE_MOUTH_COLOR = 0x160f0a
export const FACE_TEETH_COLOR = 0xeeeeee
export const FACE_TONGUE_COLOR = 0xff6f91
export const FACE_CHEEK_COLOR = 0xff6e82
export const FACE_FRECKLE_COLOR = 0x6b4430

// Eyeball radius as a fraction of the body's representative radius (see
// face3d.js's bodyRadiusEstimate), before the per-eye size/type scaling
// below is applied.
export const FACE_EYE_RADIUS_FACTOR = 0.22

// A googly pupil's radius (fraction of the eyeball's), how far forward
// it sits on the eyeball (fraction of the eyeball's radius), and how far
// it's allowed to drift from dead center (fraction of the eyeball's
// radius) while jiggling.
export const FACE_PUPIL_RADIUS_FACTOR = 0.42
export const FACE_PUPIL_FRONT_FACTOR = 0.82
export const FACE_PUPIL_MAX_OFFSET_FACTOR = 0.45

// The pupil's spring (reusing jelly.js's springStep): how snappily it
// chases its target offset, and how much the body's movement-bulge and
// hit-spring velocities (already computed every frame for the jelly
// wobble) kick that target around, so pupils lag and jiggle on
// accelerating/decelerating or getting hit.
export const FACE_PUPIL_SPRING_STIFFNESS = 140
export const FACE_PUPIL_SPRING_DAMPING = 10
export const FACE_PUPIL_ACCEL_KICK = 0.12
export const FACE_PUPIL_HIT_KICK = 0.3

// Scales every face feature on a monster up or down relative to its
// body, so a small body (zippy) still reads clearly from the gameplay
// camera. Keyed by MONSTER_TYPES key; the player isn't scaled.
export const FACE_SCALE_BY_TYPE = { blobbo: 1, zippy: 1.6, grumpus: 1 }

// Arena platform geometry and the neon grid pulsing across its top.
export const ARENA_RADIUS = 48
export const ARENA_THICKNESS = 1.2
export const ARENA_TOP_COLOR = 0x14141c
export const ARENA_UNDERSIDE_COLOR = 0x0a0a10
export const ARENA_GRID_COLOR = '#19e7ff'
export const ARENA_GRID_PULSE_SPEED = 1.5 // radians per second
// How many world units apart the grid's concentric rings are drawn --
// kept constant as ARENA_RADIUS changes (the grid texture redraws with
// however many rings that takes) so the cells don't stretch.
export const ARENA_GRID_RING_SPACING = 16 / 11
export const ARENA_RIM_COLOR = 0x00e5ff
export const ARENA_RIM_THICKNESS = 0.5

// Glowing thrusters on the platform's tapered underside, so it reads as
// floating rather than resting on something. No PointLight anymore --
// just the dimmed glow mesh itself (removing lots of small lights under
// the platform was most of the overall brightness cut).
export const ARENA_THRUSTER_COUNT = 6
export const ARENA_THRUSTER_COLOR = 0xff2db0
export const ARENA_THRUSTER_EMISSIVE_INTENSITY = 0.8
export const ARENA_THRUSTER_PULSE_SPEED = 2.2 // radians per second
export const ARENA_THRUSTER_PULSE_AMOUNT = 0.3 // fraction of ARENA_THRUSTER_EMISSIVE_INTENSITY

// Neon light pylons standing around the platform's rim, replacing the
// dungeon's torches. Each pairs a PointLight with a glowing cap, pulsing
// gently (a sum of two sines at different speeds, offset by a random
// per-pylon phase, same idea as the old torch flicker). Down to 3 (from
// 6) and much dimmer, as part of the overall brightness cut.
export const PYLON_COUNT = 3
export const PYLON_COLORS = [0x00e5ff, 0xff2db0, 0x7cff5a]
export const PYLON_LIGHT_INTENSITY = 1.5
export const PYLON_LIGHT_DISTANCE = 8
export const PYLON_CAP_EMISSIVE_INTENSITY = 0.8
export const PYLON_PULSE_SPEED_A = 1.3 // radians per second
export const PYLON_PULSE_SPEED_B = 2.1 // radians per second
export const PYLON_PULSE_AMOUNT = 0.3 // fraction of PYLON_LIGHT_INTENSITY

// Space backdrop: a starfield on a large sphere plus a gradient nebula
// sky further out still.
export const STARFIELD_COUNT = 4000
export const STARFIELD_RADIUS = 400
export const SKY_RADIUS = 450
export const STARFIELD_COLOR = 0xcfcfcf // dimmed from pure white
export const STARFIELD_OPACITY = 0.7

// Lighting: a soft hemisphere fill plus a shadow-casting directional key
// light (the platform receives shadows; characters cast them).
export const HEMI_LIGHT_SKY_COLOR = 0x8899ff
export const HEMI_LIGHT_GROUND_COLOR = 0x1a0a2a
export const HEMI_LIGHT_INTENSITY = 0.45
export const KEY_LIGHT_COLOR = 0xbcd2ff
export const KEY_LIGHT_INTENSITY = 1.1
export const SHADOW_MAP_SIZE = 2048
// The key light (and its target) follow the player every frame at this
// fixed world-space offset, rather than staying fixed over the
// platform's center, so a shadow frustum this small stays crisp however
// big the arena is.
export const KEY_LIGHT_OFFSET = { x: 12, y: 22, z: 10 }
export const KEY_LIGHT_SHADOW_EXTENT = 25

// Post-processing bloom (EffectComposer + UnrealBloomPass in main.js)
// and the renderer's own tone mapping exposure -- both turned down a
// lot from their original values so the neon surfaces glow without
// washing out the whole scene.
export const BLOOM_STRENGTH = 0.3
export const BLOOM_RADIUS = 0.4
export const BLOOM_THRESHOLD = 0.75
export const TONE_MAPPING_EXPOSURE = 0.8

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

// Wander targets are biased to within this many world units of the
// monster's current position (still clamped onto the platform), so a
// wandering monster doesn't trek clean across the much bigger arena.
export const WANDER_BIAS_RADIUS = 15

// Temporary fixed ring of 12 cargo pod positions on the platform, in two
// rings (radius 14 and radius 32, offset 30 degrees from each other),
// standing in as circular obstacles until a later milestone spawns them
// dynamically.
export const POD_POSITIONS = [
  { x: 0, z: 14 },
  { x: 12.12, z: 7 },
  { x: 12.12, z: -7 },
  { x: 0, z: -14 },
  { x: -12.12, z: -7 },
  { x: -12.12, z: 7 },
  { x: 16, z: 27.71 },
  { x: 32, z: 0 },
  { x: 16, z: -27.71 },
  { x: -16, z: -27.71 },
  { x: -32, z: 0 },
  { x: -16, z: 27.71 },
]
export const POD_OBSTACLE_RADIUS = 0.75 // matches the hover base's visual footprint, plus a little clipping margin

// Monsters spawn on a ring this far from the PLAYER's current position
// (not the platform's edge -- at ARENA_RADIUS 48 that would take far too
// long to close in), clamped onto the platform with this margin in from
// the edge.
export const SPAWN_NEAR_PLAYER_MIN_DIST = 14
export const SPAWN_NEAR_PLAYER_MAX_DIST = 22
export const SPAWN_NEAR_PLAYER_MARGIN = 3

// Healed between waves (capped at max hp) so endless runs are survivable.
export const WAVE_CLEAR_HEAL = 20

// How long the "WAVE CLEARED +bonus" banner stays up before the
// intermission countdown banner takes over for the rest of the break.
export const WAVE_CLEARED_BANNER_DURATION = 1.5

// The spawn-in effect: a glowing portal ring flush with the platform plus
// a vertical light beam, while the monster itself scales up from 0 (with
// a jelly inflate wobble) and its color fades in from black.
export const SPAWN_EFFECT_DURATION = 0.8 // seconds
export const SPAWN_RING_COLOR = 0x00e5ff
export const SPAWN_RING_RADIUS = 1.1
export const SPAWN_BEAM_COLOR = 0x80f0ff
export const SPAWN_BEAM_RADIUS = 0.5
export const SPAWN_BEAM_HEIGHT = 4
export const SPAWN_INFLATE_STRENGTH = -1.2 // one-shot jelly impulse (negative inflates) as the monster appears

// Jelly body material: flat-shaded faces, a saturated base color, some
// metalness/roughness, and no emissive tint, so the characters read as
// solid colored shapes rather than glowing.
export const JELLY_METALNESS = 0.25
export const JELLY_ROUGHNESS = 0.45
export const JELLY_EMISSIVE_INTENSITY = 0

// The wireframe overlay: shares the body's geometry (so it deforms with
// it) at a slightly larger scale, so the edges read as an outline
// instead of fighting the solid faces for depth. Translucent rather
// than a fully solid bright line, so it reads as a subtle edge rather
// than a glow.
export const JELLY_EDGE_SCALE = 1.01
export const JELLY_EDGE_OPACITY = 0.35

// Idle wobble: a slow traveling ripple over the body's surface.
export const JELLY_IDLE_AMPLITUDE = 0.035 // world units
export const JELLY_IDLE_SPEED = 2.4 // radians per second

// Movement bulge: a spring toward a target driven by current speed, so
// starting or stopping overshoots and wobbles instead of snapping.
export const JELLY_BULGE_RESPONSE = 0.05 // target bulge per world unit/second of speed
export const JELLY_BULGE_STIFFNESS = 90
export const JELLY_BULGE_DAMPING = 9

// The hit spring, shared by the hit splat, the attack wind-up, and the
// death burst (see JELLY_HIT_STRENGTH and JELLY_DEATH_INFLATE_STRENGTH
// below, and MONSTER_ATTACK_WINDUP_INFLATE_RATE further down).
export const JELLY_HIT_STIFFNESS = 140
export const JELLY_HIT_DAMPING = 8
export const JELLY_HIT_STRENGTH = 0.9 // impulse applied when hit lands (player or monster)
export const JELLY_DEATH_INFLATE_STRENGTH = -1.4 // one-shot inflate impulse at the moment of death

export const ATTACK_RANGE = 1.4
export const ATTACK_ARC_RADIANS = Math.PI / 2 // total width of the attack cone
export const ATTACK_COOLDOWN = 0.4 // seconds between swings
export const ATTACK_DAMAGE = 20
export const ATTACK_SWING_DURATION = 0.25 // seconds for the sword to swing through its arc

export const KNOCKBACK_STRENGTH = 1.2 // world units a hit monster is pushed back

export const HIT_FLASH_DURATION = 0.1 // seconds for a hit flash to fade out
export const DEATH_POP_DURATION = 0.3 // seconds for the death pop before removal

export const SIGHT_RANGE = 24 // world units a monster can see the player at (the arena has no walls to block it) -- raised with ARENA_RADIUS so freshly spawned monsters notice the player
export const MONSTER_ATTACK_RANGE = 1.2
export const MONSTER_ATTACK_COOLDOWN = 1.2 // seconds between monster attacks
export const MONSTER_ATTACK_WINDUP_DURATION = 0.3 // seconds of telegraph lean/grow before the hit lands
export const MONSTER_ATTACK_WINDUP_INFLATE_RATE = 2.5 // jelly inflate fed into the hit spring per second during the telegraph

export const SEARCH_DURATION = 3 // seconds spent looking around before giving up and wandering again
export const SEARCH_SPIN_SPEED = 1.5 // radians per second, while looking around

// How snappily a monster's visual rotation (dampAngle) catches up to
// the direction it's actually steering/attacking toward.
export const MONSTER_FACING_DAMPING = 15

export const WANDER_TIMEOUT = 4 // seconds before repicking a wander target if not arrived

export const MONSTER_ARRIVAL_DISTANCE = 0.3 // world units considered "arrived" at a wander/search target

export const SEPARATION_STRENGTH = 0.5 // how much of an overlap is resolved per frame (0-1)

export const HIDE_RANGE = 1.5 // world units within which E enters/is prompted for a pod

export const HIDDEN_CAMERA_OFFSET = { x: 0, y: 4, z: 3 } // pulled in closer than CAMERA_OFFSET

export const AMBUSH_WINDOW = 1 // seconds after popping out of hiding that attacks deal ambush damage
export const AMBUSH_BANNER_DURATION = 1 // seconds the "AMBUSH!" HUD banner stays up

// Cargo pod geometry: a capsule hull standing on a small hover base,
// glowing seam rings, a translucent visor band, and a soft floor glow.
export const POD_HULL_RADIUS = 0.45
export const POD_HULL_LENGTH = 0.85 // straight cylindrical part of the capsule
export const POD_HULL_COLOR = 0x2b2f38 // dark gunmetal
export const POD_BASE_RADIUS = 0.6
export const POD_BASE_HEIGHT = 0.12
export const POD_HOVER_GAP = 0.08 // gap between the hover base and the floor glow ring
export const POD_HOVER_BOB_SPEED = 1.2 // radians/second
export const POD_HOVER_BOB_AMOUNT = 0.04 // world units
export const POD_VISOR_COLOR = 0x9be7ff
export const POD_VISOR_HEIGHT = 0.3
export const POD_VISOR_ARC = (Math.PI * 2) / 3 // radians of the hull's front the visor band covers
export const POD_FLOOR_GLOW_COLOR = 0x19e7ff
export const POD_FLOOR_GLOW_RADIUS = 0.9

// Seam ring colors per state (idle, near enough to enter, occupied) plus
// a gentle pulse applied to whichever color is current.
export const POD_SEAM_COLOR_IDLE = 0x1fb6ff
export const POD_SEAM_COLOR_HIGHLIGHT = 0x7dffb0
export const POD_SEAM_COLOR_OCCUPIED = 0xff2bd6
export const POD_SEAM_PULSE_SPEED = 2 // radians/second
export const POD_SEAM_PULSE_AMOUNT = 0.3 // fraction of the seam color's brightness

// The holographic label sprite floating above the pod.
export const POD_LABEL_TEXT = 'NOT A PLAYER'
export const POD_LABEL_SIZE = 0.8
export const POD_LABEL_BOB_SPEED = 1.5 // radians/second
export const POD_LABEL_BOB_AMOUNT = 0.05 // world units

// While occupied, the pod wiggles comically (a small random rotation/
// scale pulse) every POD_WIGGLE_MIN_INTERVAL-POD_WIGGLE_MAX_INTERVAL
// seconds.
export const POD_WIGGLE_MIN_INTERVAL = 1 // seconds
export const POD_WIGGLE_MAX_INTERVAL = 2 // seconds
export const POD_WIGGLE_DURATION = 0.3 // seconds
export const POD_WIGGLE_ANGLE = 0.25 // radians, peak rotation during a wiggle
export const POD_WIGGLE_SCALE_PULSE = 0.08 // peak scale increase during a wiggle

// Camera screen shake: a short decaying random offset. "Damage" is the
// player getting hit; "hit" is the player's attack landing on a monster.
export const SHAKE_DAMAGE_MAGNITUDE = 0.25 // world units, peak offset
export const SHAKE_DAMAGE_DURATION = 0.3 // seconds to decay to nothing
export const SHAKE_HIT_MAGNITUDE = 0.08
export const SHAKE_HIT_DURATION = 0.15

// Pooled spark/spray particles (src/particles.js): a fixed-size Points
// pool, ring-buffered so a burst never allocates. Gravity/drag apply to
// every live particle every frame; each one also fades and shrinks
// linearly over its own randomized life.
export const PARTICLE_POOL_SIZE = 300
export const PARTICLE_GRAVITY = 9
export const PARTICLE_DRAG = 0.96
export const PARTICLE_BASE_SIZE = 46 // sprite point size in pixels at 1 world unit from the camera
export const PARTICLE_LIFE_MIN = 0.3 // seconds
export const PARTICLE_LIFE_MAX = 0.7 // seconds
export const PARTICLE_BRIGHTNESS = 0.65 // dims each spark's tint before it's additively blended

// Pooled tumbling shard instances (src/particles.js): a fixed-size
// InstancedMesh pool of small low-poly tetrahedra, for the big death
// burst that plain point sprites can't convincingly fake.
export const SHARD_POOL_SIZE = 90
export const SHARD_GRAVITY = 14
export const SHARD_DRAG = 0.97
export const SHARD_BASE_SIZE = 0.16
export const SHARD_LIFE_MIN = 0.5 // seconds
export const SHARD_LIFE_MAX = 1 // seconds
export const SHARD_SPIN_SPEED = 6 // radians/second, max per-shard tumble

// Per-effect burst tuning (count, speed, color). "Spark" bursts use the
// Points pool; "shard" bursts use the InstancedMesh pool.
export const HIT_SPARK_COUNT = 10
export const HIT_SPARK_SPEED = 3
export const HIT_SPARK_WHITE_COUNT = 5
export const HIT_SPARK_WHITE_SPEED = 4
export const HIT_SPARK_WHITE_COLOR = 0xffffff

export const DEATH_SHARD_COUNT = 18
export const DEATH_SHARD_SPEED = 4.5

export const FALL_PUFF_COUNT = 14
export const FALL_PUFF_SPEED = 2
export const FALL_PUFF_COLOR = 0xcccccc
export const FALL_STREAK_COUNT = 8
export const FALL_STREAK_SPEED = 1.5

export const SPAWN_SWIRL_COUNT = 16
export const SPAWN_SWIRL_SPEED = 1.8
export const SPAWN_SWIRL_UPWARD_BIAS = 0.7 // 0 = fully random spherical, 1 = straight up

export const DAMAGE_SPARK_COUNT = 14
export const DAMAGE_SPARK_SPEED = 3.5
export const DAMAGE_SPARK_COLOR = 0xff3344

// Energy sword: a glowing emissive blade (plus a slightly larger,
// additive "glow" twin for a bloom-friendly blur) and a dark hilt.
export const SWORD_BLADE_COLOR = 0x30e0ff
export const SWORD_GLOW_SCALE = 1.4
export const SWORD_HILT_COLOR = 0x20222a

// The swing trail: a fixed-length ribbon of the blade tip's recent world
// positions, additive-blended with the color fading toward black at the
// oldest end (so the fade reads without a custom per-vertex-alpha shader).
export const TRAIL_MAX_POINTS = 10
export const TRAIL_WIDTH = 0.12

// Floating damage-number popups (src/popups.js): a small pool of sprites
// showing "+100"-style text (or "RING OUT!" for a fall), rising and
// fading over their life.
export const POPUP_POOL_SIZE = 12
export const POPUP_LIFE = 0.9 // seconds
export const POPUP_RISE_SPEED = 1.2 // world units over the popup's life
export const POPUP_KILL_COLOR = '#ffe066'
export const POPUP_RING_OUT_COLOR = '#7dd3ff'

// A brief red flash over the whole screen (CSS) when the player takes
// damage, and the health bar's low-hp pulse threshold.
export const DAMAGE_FLASH_DURATION = 0.15 // seconds
export const LOW_HP_PULSE_THRESHOLD = 0.25 // fraction of max hp
