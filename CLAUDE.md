# SlashBattle

SlashBattle is a 3D goofy neon brawler built with Three.js. The player
fights wobbly jelly monsters with funny, mismatched faces on a single
floating circular platform adrift in space, with real-time melee combat
and cargo pods the player can hide inside to ambush monsters that lose
track of them.

## Gameplay
There's no win state: monsters (a mix of Blobbo, Zippy, and Grumpus)
arrive in endless waves, each bigger than the last, trickling in one at
a time with a glowing spawn-in effect on a ring 14-22 units out from the
PLAYER's current position (not the platform's actual edge -- the
platform's much bigger than that now, and an edge spawn would take too
long to close in), clamped onto the platform. Losing all
your hp loses the game. Monsters wander until they spot you, chase, and
attack once in range; hiding in a pod breaks their line of sight, so a
chasing or attacking monster gives up and searches your last known spot
before going back to wandering. Popping out of hiding deals bonus
"ambush" damage on your next hit for a short window. There are no walls
at the platform's edge: anyone whose center leaves it falls. A monster
that falls dies (counts as a kill); a player who falls loses HP and
respawns at the center with a moment of invulnerability. Attacks knock
monsters back, which can push them off the edge. Between waves you heal
a little, so endless runs stay survivable. R restarts the game (back to
wave 1, score 0) at any time after losing.

## Scoring
Every kill (including a fall off the edge) scores points by monster
type; clearing a wave scores a bonus that grows with the wave number.
The best score and the best wave reached ever are saved in the browser
(`localStorage`) and shown on the game-over screen alongside the run
that just ended, with a "NEW BEST!" callout when you beat your own
record.

## Controls
- WASD / arrow keys — move
- Left click or Space — swing your sword
- E — enter or exit a nearby pod to hide
- R — restart after losing

## Commands
- `npm install` — install dependencies
- `npm run dev` — start the Vite dev server
- `npm test` — run the Vitest test suite
- `npm run build` — produce a production build

## Project layout
```
slashbattle/
  CLAUDE.md            # how to install, run, test, build; project rules
  package.json         # scripts: dev, build, preview, test
  index.html           # canvas + HUD overlay (health, score/wave, wave banner, game over)
  src/
    main.js            # bootstrap: renderer, scene, camera, post-processing, game loop
    config.js          # tunable constants (speeds, damage, ranges, HP, arena/visual tuning)
    input.js           # keyboard/mouse state
    arena.js           # the floating platform, starfield/nebula sky, lighting, neon pylons
    face3d.js          # 3D goofy face features (googly eyes, mouths, brow/tongue/cheeks), attached to a jelly body
    characters.js      # build player/monster jelly bodies (shape + 3D face + indicators)
    jelly.js           # the jelly body: shared-geometry wireframe edges, per-vertex deformation
    spawner.js         # the spawn-in effect: portal ring + beam, monster materialize animation
    highScore.js       # load/save the best score/wave in localStorage (try/catch, zero fallback)
    particles.js       # pooled spark (Points) and tumbling-shard (InstancedMesh) bursts
    trail.js           # the sword's fading swing-trail ribbon (tip position history)
    popups.js          # floating "+100" / "RING OUT!" score popups (a sprite pool)
    player.js          # movement, attack swing, health, hide/unhide state, falling
    monster.js         # monster AI state machine, falling
    hiding.js          # cargo pod visuals/states + interaction (find nearest, enter/exit)
    combat.js          # hit detection (range + facing arc), damage, knockback, cooldowns
    hud.js             # DOM HUD updates (health, score, wave, enemies left, banners, game over)
    logic/             # pure, Three-free functions so they can be unit tested
  test/                # Vitest specs for logic/ (combat, AI, hiding, arena, falling, jelly, waves, particles, trail)
```

All files listed above now exist.

## Conventions
Testable game rules (distance/arc checks, AI state transitions, platform
collision, hide eligibility, falling physics, and similar) live in
`src/logic/` as plain, pure functions with no Three.js imports. This
keeps them covered by Vitest specs in `test/` without needing a WebGL
context.

## Arena
The dungeon has been replaced by a single circular platform (radius
`ARENA_RADIUS`, 48) floating in space, with no walls at the edge -- line
of sight is always clear, so monsters see the player whenever they're
within `SIGHT_RANGE` and not hidden. Cargo pods are temporarily placed at
a few fixed positions on the platform (`POD_POSITIONS` in config.js, 12
of them in two rings) as circular obstacles; a later milestone spawns
them dynamically. Monsters keep their own steering (wander, chase,
search) away from the very edge (`MONSTER_PLATFORM_MARGIN`), so only
knockback -- or the player's own choice to walk off -- sends anyone over
the side. A wandering monster's target is biased to within
`WANDER_BIAS_RADIUS` of its current position (`randomPointNear` in
`src/logic/arena.js`), so it doesn't trek clean across the arena.

Lighting stays deliberately dim: the hemisphere/key lights are the main
source, bloom is tuned low and only picks up genuinely bright surfaces
(`BLOOM_THRESHOLD`), and most small per-object lights (the platform's
underside thrusters, most of the neon pylons) were cut in favor of
dimmed emissive materials instead -- a handful of real lights reads
better than a crowd of dim ones.

## Hiding pods
Each hiding spot (`src/hiding.js`) is a capsule hull on a small hovering
base, with glowing seam rings, a translucent visor band, a soft floor
glow, and a bobbing holographic "NOT A PLAYER" label -- restyled from the
original wooden crates, with the same hide-in/pop-out behavior
underneath (`src/logic/hiding.js`'s box-named functions are unchanged).
The seam color reads the pod's state: idle, highlighted when it's the
nearest one E would enter, or switched to the occupied color with a pair
of googly eyes peeking out of the visor and the pod wiggling comically
every second or two (harder and more often in the last
`POD_HIDE_URGENT_THRESHOLD` seconds of hiding, turning the seam/
countdown red).

Pods are dynamic and single-use rather than fixed: `src/logic/
podSpawner.js`'s `pickPodSpawnPoint`/`stepPodSpawner` decide where and
when the next one appears -- at most `POD_MAX_ACTIVE` (3) at a time,
each spawning after a random delay, spaced from other pods/the player/
any monster -- and `src/main.js`'s `trySpawnPod`/`despawnPod` drive the
mesh lifecycle (a grow-in materialize / shrink-away dematerialize, each
with a particle flash). A game starts with 1-2 already placed. Hiding
has a `POD_HIDE_LIMIT` (10s): a visible countdown shows both in the HUD
(a ring + seconds next to the HIDDEN indicator) and as a small sprite
over the pod itself, and once it runs out the player is ejected --
popped out with a knockback-sized push, losing `POD_EJECT_PENALTY_FRACTION`
(10%) of max HP through the normal damage path (same shake/flash a
monster's hit gets). Leaving early with E avoids that penalty, but
either way the pod disappears -- it's a one-time hiding spot, and a new
one takes its turn once a slot frees up.

## Waves
`src/logic/waves.js`'s wave controller (`createWaveState`/`stepWaves`)
cycles through three phases: `intermission` (a countdown, shown as a
center banner) -> `spawning` (one enemy right away, then one more every
`waveSpawnInterval(n)` until `waveSize(n)` have been emitted -- both
strictly/monotonically tuned by the wave number) -> `clearing` (waits
for every spawned monster, including ones still materializing in, to be
gone) -> emits a `waveCleared` event and starts the next intermission.
`pickMonsterType` weights which type spawns: blobbo only on wave 1,
zippy from wave 2, grumpus from wave 3 with its share growing slowly.
main.js steps the controller every frame once the start card is
dismissed, spawns whatever it emits via `spawnMonster` (through
`src/spawner.js`'s portal-ring-and-beam effect), and reacts to
`waveCleared` with a score bonus, a heal, and a banner.

## Jelly bodies
Every character (player = icosahedron, blobbo = dodecahedron, zippy =
octahedron, grumpus = a multi-segment box) is one faceted, flat-shaded
low-poly mesh with a glowing wireframe overlay that shares its geometry,
so the edges deform right along with it. `createJellyBody` clones the
geometry's original vertex positions once; every frame `updateJelly`
displaces each vertex as a pure function (`src/logic/jelly.js`'s
`jellyOffset`) of that ORIGINAL position, the current time, and the
jelly state -- never the previous frame's displaced position, so
duplicated flat-shaded vertices always move together and faces never
tear. The jelly state is two springs (`springStep`): a movement bulge
driven by current speed (so starting/stopping overshoots and wobbles)
and a shared hit spring that a positive `jellyHit` flattens (the hit
splat) and a negative one inflates (the attack wind-up and the death
burst). `jelly.params` stashes that frame's displacement params so a
3D face (below) can ride the same deformation at its own anchor points;
a sword (player only) is attached directly to the body group instead,
so it stays rigid.

Every body's resting center height (`createJellyBody`'s `restY`) is set
so its lowest point touches y = 0 -- `src/logic/arena.js`'s
`platformLayout` keeps the platform's own top surface there too, rather
than at its vertical center, so nothing stands half-buried in it.
`updateJelly` also re-pins the body's lowest ORIGINAL vertex to that
same height every frame (adjusting body/edges' group-local y by
whatever the hit spring's squash/inflate moved that vertex), so the
body's feet stay planted instead of floating or sinking as it
squashes/inflates; `face3d.js` applies the same correction to its
features so they don't detach from the body.

## 3D face features
`src/logic/faceLayout.js` places a body's face features (eyes, brow,
mouth, tongue, cheeks) just outside its surface rather than sunk inside
it: `bodySurfaceDistance` gives the exact (box, octahedron) or
geometrically derived (dodecahedron face planes; the player's
icosahedron, built with one subdivision level, is close enough to a
sphere to treat as one) distance from the body's center to its surface
along any direction, and `faceLayout` offsets each feature along a
small perturbation of the old flat face's forward-ish direction until
it clears that surface. `src/face3d.js` builds the actual 3D geometry
from a `pickFaceOptions()`/`PLAYER_FACE`-shaped options object
(`src/logic/faceOptions.js`): googly eyes (a matte white eyeball, a
jiggling pupil constrained to its front face via a spring --
`springStep`, reused from the jelly's own spring math -- driven by the
jelly movement-bulge/hit-spring velocities, and a body-colored eyelid
cap while squinting), a mouth built from real geometry per type (a
torus arc for a grin/lopsided smile, a wavy tube for derp, a recessed
torus for the "O"), an optional unibrow, a drooping tongue capsule, and
rosy cheeks/freckles. Every feature is a child of the character group,
so it inherits rotation/scale/the spawn-in and death-pop scale for
free; `updateFace3D` (called alongside `updateJelly` every frame) is
only responsible for re-evaluating `jellyOffset` at each feature's own
original anchor point so it rides the wobbling surface, plus the
pupils' spring jiggle.

## Polish: particles, trail, popups, HUD
The sword is a glowing energy blade (an emissive core plus a larger
additive "glow" twin, the same trick the jelly edges use) on a dark
hilt, with a fading swing-trail ribbon following its tip
(`src/trail.js`; `src/logic/trail.js`'s `pushTrailPoint`/`trailAlphaAt`
keep the point history and the per-point fade pure and testable).
`src/particles.js` pools two kinds of bursts -- `burst` (a THREE.Points
pool, for sparks/puffs/swirls) and `shardBurst` (an InstancedMesh pool
of tumbling tetrahedra, for the big death burst) -- both ring-buffered
(`src/logic/particles.js`'s `allocateSlots`) so a burst never allocates;
`stepParticle`/`particleAlpha`/`particleScale` (also pure) drive
gravity/drag/fade/shrink. They fire on a hit (a spark burst in the
monster's edge color plus a white spark), a death (a big tumbling shard
burst), falling off the edge (a puff plus a streak), a spawn-in (an
upward swirl in the beam), and the player taking damage (a red spark).
`src/popups.js` floats a small pool of "+100"-style sprites (or "RING
OUT!" for a fall) up and fades them out when a monster dies. The
particle system, the swing trail, and the popup pool are all per-session
singletons -- created once alongside the HUD and composer, added to the
scene once, and reset (not disposed/recreated) on restart.

The HUD itself uses the self-hosted `@fontsource/orbitron` font (no
external network fonts) on glassy, translucent, neon-bordered panels; the
health bar is segmented and pulses red at/under `LOW_HP_PULSE_THRESHOLD`;
the wave banner scales in; the start card lays out its controls with key
caps. A fixed vignette gently darkens the screen's edges, and a brief
red screen flash (`triggerDamageFlash`) accompanies every point the
player takes damage, alongside the existing screen shake.
