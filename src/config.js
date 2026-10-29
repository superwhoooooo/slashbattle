// Tunable constants shared across the game. Grouped by the system that
// mostly cares about them; values are in world units unless noted.
import { BOSS_MONSTER_TYPES } from './logic/bosses.js'

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
export const CAMERA_LOOKAHEAD = 1.2 // world units, peak offset in the player's movement direction at full speed

// A pale daylight haze, matching the sky gradient's horizon band, far
// enough out that it doesn't hide the platform (ARENA_RADIUS 48) but
// still softens its far edge into the sky rather than keeping it crisp
// all the way out.
export const FOG_COLOR = 0xbfe3ff
export const FOG_NEAR = 70
export const FOG_FAR = 260

// Monster types: shape (jelly body geometry), size (body scale), color,
// edgeColor (the glowing wireframe overlay), speed (world units/second),
// hp, damage per hit, and radius (collision/knockback/separation radius).
export const MONSTER_TYPES = {
  blobbo: { shape: 'dodecahedron', size: 1.4, color: 0x4caf50, edgeColor: 0x9dffb0, speed: 1.2, hp: 60, damage: 8, radius: 0.6 },
  zippy: { shape: 'octahedron', size: 0.6, color: 0x9c27b0, edgeColor: 0xe9a3ff, speed: 5.5, hp: 20, damage: 5, radius: 0.25 },
  grumpus: { shape: 'box', size: 1.1, color: 0xff5722, edgeColor: 0xffc49d, speed: 2.0, hp: 100, damage: 15, radius: 0.45 },
  // The seven bosses (src/logic/bosses.js) share the same stat shape, plus
  // boss-only fields (attackRange, reachBonus, knockbackScale, special...).
  ...BOSS_MONSTER_TYPES,
}

// Boss fights: where the boss materializes for its intro cutscene
// (straight ahead of the player, in the camera's view). The specials'
// tuning lives in logic/bosses.js's BOSS_SPECIALS.
export const BOSS_SPAWN_DISTANCE = 15
export const BOSS_SPAWN_MARGIN = 7 // world units in from the platform's edge
export const BOSS_SPAWN_EFFECT_SCALE = 2.6 // portal ring/beam widened for a boss
export const BOSS_SPAWN_EFFECT_DURATION = 1.8 // seconds, matches CUTSCENE_ENTER_DURATION
export const BOSS_DEFEAT_HEAL_MULTIPLIER = 2 // beating a boss heals WAVE_CLEAR_HEAL times this
export const BOSS_DEATH_SHARD_MULTIPLIER = 3
export const CUTSCENE_CAMERA_LERP = 3.5

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

// Arena platform geometry and its sundeck surface: a tileable composite-
// plank CanvasTexture (a single canvas can't hold enough resolution for
// crisp planks across the platform's full radius, so it repeats instead)
// plus a teal border band and a white pinstripe, each a flat ring mesh
// laid on top of the deck -- a repeating texture can't carry a band that
// only appears near the edge, so those are separate geometry instead.
export const ARENA_RADIUS = 48
export const ARENA_THICKNESS = 1.2
export const ARENA_HULL_COLOR = 0xe7e9ec // light grey/white, slightly metallic sides/underside
export const ARENA_DECK_PLANK_COLOR = '#ece4d4' // warm white composite plank base
export const ARENA_DECK_SEAM_COLOR = '#b9ad94' // seams between planks
// World-unit size of one repeating plank tile, so plank width/length stay
// a sensible real-world size rather than stretching with ARENA_RADIUS.
export const ARENA_DECK_PLANK_WIDTH = 0.4
export const ARENA_DECK_PLANK_LENGTH = 1.6
export const ARENA_DECK_BORDER_COLOR = '#19b5a5'
export const ARENA_DECK_BORDER_WIDTH = 1 // world units, how wide the border band is
export const ARENA_DECK_PINSTRIPE_COLOR = '#f5f5f0'
export const ARENA_DECK_PINSTRIPE_WIDTH = 0.12
// World units in from the platform's edge to the pinstripe's outer edge,
// so it sits just inside the border band rather than touching it.
export const ARENA_DECK_PINSTRIPE_INSET = 1.6

// The sundeck's props (pools, umbrellas, loungers, signs -- laid out by
// src/logic/resortLayout.js, built into meshes by src/arena.js): a fixed
// seed so the same layout appears every run.
export const RESORT_LAYOUT_SEED = 20240

// Pool water and rim.
export const POOL_WATER_COLOR = 0x2bc8e6
export const POOL_RIM_COLOR = 0xffffff

// Umbrella pole/canopy (canopy color comes from resortLayout.js's own
// per-umbrella `color`).
export const UMBRELLA_POLE_COLOR = 0xffffff
export const UMBRELLA_POLE_HEIGHT = 2.2
export const UMBRELLA_POLE_RADIUS = 0.04
export const UMBRELLA_CANOPY_HEIGHT = 0.6

// Lounger slats/back.
export const LOUNGER_COLOR = 0xf5f5f0
export const LOUNGER_LENGTH = 1.3
export const LOUNGER_WIDTH = 0.6

// Sign post/panel.
export const SIGN_POST_COLOR = 0xffffff
export const SIGN_POST_HEIGHT = 1.4
export const SIGN_PANEL_COLOR = 0x19b5a5
export const SIGN_PANEL_WIDTH = 0.9
export const SIGN_PANEL_HEIGHT = 0.4

// Daylight backdrop: a vertical gradient sky dome (deep sky blue at the
// zenith, fading through a pale haze near the horizon, down to a warm
// sand tone below) plus a distant gas giant hanging near the horizon.
export const SKY_RADIUS = 450
export const SKY_TOP_COLOR = '#2F7FF2'
export const SKY_HORIZON_COLOR = '#DDF0FF'
export const SKY_GROUND_COLOR = '#F6E6CF'

// The gas giant: a big peachy sphere with a translucent ring, placed far
// out along -Z (the general direction CAMERA_OFFSET/the fixed-world-space
// follow camera looks) and low enough that the sightline clears the
// platform's edge instead of being blocked by its opaque top surface:
// the camera pitches ~51 degrees down, so its top-of-frame ray only
// clears the edge once the player is on the far (-Z) side, and from
// there the planet sits ~25 degrees below horizontal, near the top of
// frame. It reads as sitting near the horizon from a chunk of the
// platform, not the whole time, since the camera never rotates to face
// it head-on.
export const GAS_GIANT_POSITION = { x: 0, y: -140, z: -360 }
export const GAS_GIANT_RADIUS = 60
export const GAS_GIANT_COLOR = 0xf2b27a
export const GAS_GIANT_EMISSIVE_INTENSITY = 0.15 // keeps it from reading as a dark silhouette against the sky
export const GAS_GIANT_RING_COLOR = 0xffe9cf
export const GAS_GIANT_RING_INNER_RADIUS = 78
export const GAS_GIANT_RING_OUTER_RADIUS = 118
export const GAS_GIANT_RING_OPACITY = 0.45
export const GAS_GIANT_RING_TILT = Math.PI / 2.6 // radians, off the orbital plane so it reads as a ring rather than a flat disc edge-on

// Lighting: a cool-sky-fill hemisphere light plus a shadow-casting warm
// sun as the directional key light (the platform receives shadows;
// characters cast them).
export const HEMI_LIGHT_SKY_COLOR = 0xcfe8ff
export const HEMI_LIGHT_GROUND_COLOR = 0xe8d6b8
export const HEMI_LIGHT_INTENSITY = 0.35
export const KEY_LIGHT_COLOR = 0xfff0d6
export const KEY_LIGHT_INTENSITY = 1.6
export const SHADOW_MAP_SIZE = 2048
// The key light (and its target) follow the player every frame at this
// fixed world-space offset, rather than staying fixed over the
// platform's center, so a shadow frustum this small stays crisp however
// big the arena is.
export const KEY_LIGHT_OFFSET = { x: 12, y: 22, z: 10 }
export const KEY_LIGHT_SHADOW_EXTENT = 25

// Post-processing bloom (EffectComposer + UnrealBloomPass in main.js)
// and the renderer's own tone mapping exposure. In daylight, bloom is
// tuned near-off (a high threshold plus a low strength) so only
// genuinely bright highlights -- not the whole sunlit scene -- glow.
export const BLOOM_STRENGTH = 0.15
export const BLOOM_RADIUS = 0.4
export const BLOOM_THRESHOLD = 0.95
export const TONE_MAPPING_EXPOSURE = 0.75
// How strongly the baked sky environment map (scene.environment) lights
// and reflects off physical materials, on top of the sun and hemisphere
// lights -- kept low so the pale deck doesn't wash out to white.
export const ENVIRONMENT_INTENSITY = 0.35

// GTAOPass (EffectComposer, main.js): ambient occlusion for the contact
// shadows and creases a directional sun makes obvious. GTAO_ENABLED is a quick on/off toggle independent of the other
// tuning.
export const GTAO_ENABLED = true
export const GTAO_RADIUS = 1.2 // world units, how far each pixel samples for occluders
export const GTAO_INTENSITY = 1.0 // blend strength of the occlusion term

export const CAMERA_FAR = 1500

// Rendering/loop steadiness: the pixel ratio is capped (a high-DPI
// display otherwise renders far more pixels than it's worth), and the
// per-frame delta is clamped so a dropped or backgrounded-tab frame
// doesn't feed a huge dt into movement/physics.
export const MAX_PIXEL_RATIO = 2
export const MAX_DELTA_SECONDS = 1 / 20

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

// Dynamic pod spawning (src/logic/podSpawner.js): at most POD_MAX_ACTIVE
// pods on the field at once; while below that, the next one spawns
// after a random POD_SPAWN_DELAY_MIN-MAX second delay, at a random spot
// on the platform (POD_SPAWN_MARGIN in from the edge) at least
// POD_MIN_SPACING from other pods, POD_MIN_PLAYER_DISTANCE from the
// player, and POD_MONSTER_AVOID_RADIUS from any monster -- retried up
// to POD_SPAWN_MAX_ATTEMPTS times before giving up on that attempt.
// Each game starts with a random count in
// [POD_INITIAL_COUNT_MIN, POD_INITIAL_COUNT_MAX] already placed.
export const POD_MAX_ACTIVE = 3
export const POD_SPAWN_DELAY_MIN = 4 // seconds
export const POD_SPAWN_DELAY_MAX = 10 // seconds
export const POD_SPAWN_MARGIN = 4 // world units in from the platform's edge
export const POD_MIN_SPACING = 10 // world units between pods
export const POD_MIN_PLAYER_DISTANCE = 4 // world units from the player
export const POD_MONSTER_AVOID_RADIUS = 2 // world units from any monster
export const POD_SPAWN_MAX_ATTEMPTS = 20
export const POD_INITIAL_COUNT_MIN = 1
export const POD_INITIAL_COUNT_MAX = 2

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
export const SEARCH_APPROACH_TIMEOUT = 6 // seconds a searching monster spends walking to its spot before just looking around where it is
export const HIDE_SEARCH_MIN_DISTANCE = 6 // world units from a pod (min) a monster that lost the player to it goes to search -- not the pod itself, or it'd give the hiding spot away
export const HIDE_SEARCH_MAX_DISTANCE = 10 // ...and the max
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

// A hidden player is ejected (knocked out, losing HP) after this many
// seconds; exiting early with E avoids the penalty. Either way the pod
// is single-use -- it disappears once vacated.
export const POD_HIDE_LIMIT = 10 // seconds
export const POD_EJECT_PENALTY_FRACTION = 0.1 // fraction of PLAYER_MAX_HP
export const POD_HIDE_URGENT_THRESHOLD = 3 // seconds left when the countdown/pod shake turns urgent

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

// How far outside the pod the player pops out to -- a bit further for
// a hide-limit eject than a voluntary exit, so it reads as a knockback.
export const POD_EXIT_MARGIN = 0.3
export const POD_EJECT_EXIT_MARGIN = 0.8

// Seam ring colors per state (idle, near enough to enter, occupied,
// urgent -- the last POD_HIDE_URGENT_THRESHOLD seconds of hiding) plus
// a gentle pulse applied to whichever color is current.
export const POD_SEAM_COLOR_IDLE = 0x1fb6ff
export const POD_SEAM_COLOR_HIGHLIGHT = 0x7dffb0
export const POD_SEAM_COLOR_OCCUPIED = 0xff2bd6
export const POD_SEAM_COLOR_URGENT = 0xff3355
export const POD_SEAM_PULSE_SPEED = 2 // radians/second
export const POD_SEAM_PULSE_AMOUNT = 0.3 // fraction of the seam color's brightness

// The holographic label sprite floating above the pod, and the hide-
// limit countdown sprite just above that (shown while occupied).
export const POD_LABEL_TEXT = 'NOT A PLAYER'
export const POD_LABEL_SIZE = 0.8
export const POD_LABEL_BOB_SPEED = 1.5 // radians/second
export const POD_LABEL_BOB_AMOUNT = 0.05 // world units
export const POD_COUNTDOWN_SIZE = 0.5
export const POD_COUNTDOWN_COLOR = '#9be7ff'
export const POD_COUNTDOWN_URGENT_COLOR = '#ff3355'

// While occupied, the pod wiggles comically (a small random rotation/
// scale pulse) every POD_WIGGLE_MIN_INTERVAL-POD_WIGGLE_MAX_INTERVAL
// seconds -- harder and more often (both scaled by these factors) once
// urgent.
export const POD_WIGGLE_MIN_INTERVAL = 1 // seconds
export const POD_WIGGLE_MAX_INTERVAL = 2 // seconds
export const POD_WIGGLE_DURATION = 0.3 // seconds
export const POD_WIGGLE_ANGLE = 0.25 // radians, peak rotation during a wiggle
export const POD_WIGGLE_SCALE_PULSE = 0.08 // peak scale increase during a wiggle
export const POD_URGENT_WIGGLE_SCALE = 2 // multiplies the wiggle angle/scale pulse
export const POD_URGENT_WIGGLE_SPEEDUP = 4 // divides the wiggle interval

// The pod's materialize (grow in) / dematerialize (shrink away)
// animation, played when src/logic/podSpawner.js spawns/despawns one.
export const POD_MATERIALIZE_DURATION = 0.4 // seconds
export const POD_DEMATERIALIZE_DURATION = 0.3 // seconds
export const POD_SPAWN_BURST_COUNT = 14
export const POD_SPAWN_BURST_SPEED = 2.2

// Camera screen shake: a short decaying smooth-noise offset (a sum of
// two sines per axis, not a fresh random value every frame, so it
// reads as a shake rather than a flicker). "Damage" is the player
// getting hit; "hit" is the player's attack landing on a monster.
export const SHAKE_DAMAGE_MAGNITUDE = 0.25 // world units, peak offset
export const SHAKE_DAMAGE_DURATION = 0.3 // seconds to decay to nothing
export const SHAKE_HIT_MAGNITUDE = 0.08
export const SHAKE_HIT_DURATION = 0.15
export const SHAKE_NOISE_FREQUENCY_A = 37 // radians/second
export const SHAKE_NOISE_FREQUENCY_B = 71 // radians/second

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

// Treasure chests (src/chests.js): up to CHEST_MAX_ACTIVE at once, a new
// one every CHEST_SPAWN_DELAY_MIN-MAX seconds, spaced like pods. Walk
// within CHEST_INTERACT_RANGE and press F to open one.
export const CHEST_MAX_ACTIVE = 2
export const CHEST_SPAWN_DELAY_MIN = 14
export const CHEST_SPAWN_DELAY_MAX = 24
export const CHEST_SPAWN_MARGIN = 5 // world units in from the platform's edge
export const CHEST_MIN_SPACING = 14 // world units between chests/pods
export const CHEST_OBSTACLE_RADIUS = 0.85
export const CHEST_INTERACT_RANGE = 2.6
export const CHEST_FLASH_COLOR = 0xffc93d
export const CHEST_ALL_OWNED_SCORE = 500 // consolation prize once a chest has nothing left to give
export const CHEST_ALL_OWNED_HEAL = 40

// Ability tuning (src/logic/items.js has names/cooldowns).
export const BLINK_DISTANCE = 6
export const BLINK_IFRAMES = 0.3 // seconds of invulnerability after a blink
export const SHOCKWAVE_RADIUS = 5.5
export const SHOCKWAVE_DAMAGE = 30
export const SHOCKWAVE_KNOCKBACK = 4
export const SHOCKWAVE_COLOR = 0x19e7ff
export const HEAL_PULSE_AMOUNT = 30
export const RAGE_DAMAGE_MULTIPLIER = 1.8
