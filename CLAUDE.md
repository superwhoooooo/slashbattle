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
chasing or attacking monster gives up and searches near where it lost you
(a point `HIDE_SEARCH_MIN_DISTANCE`-`HIDE_SEARCH_MAX_DISTANCE` away from the pod,
never the pod itself, which would give the hiding spot away) before going back to wandering. Popping out of hiding deals bonus
"ambush" damage on your next hit for a short window. There are no walls
at the platform's edge: anyone whose center leaves it falls. A monster
that falls dies (counts as a kill); a player who falls loses HP and
respawns at the center with a moment of invulnerability. Attacks knock
monsters back, which can push them off the edge. Between waves you heal
a little, so endless runs stay survivable. R restarts the game (back to
wave 1, score 0) at any time after losing. Every few waves a boss arrives
(see Bosses below).

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
- M — mute / unmute the music (remembered in `localStorage`)
- F — open the nearest chest (costs crystals)
- 1-5 — pick a weapon from the hotbar
- Q / Z / X / C / V — use your abilities, in the order you found them

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
    arena.js           # the resort sundeck + props, daylight sky + gas giant, environment map, lighting
    face3d.js          # 3D goofy face features (googly eyes, mouths, brow/tongue/cheeks), attached to a jelly body
    characters.js      # build player/monster jelly bodies (shape + 3D face + indicators)
    jelly.js           # the jelly body: shared-geometry wireframe edges, per-vertex deformation
    spawner.js         # the spawn-in effect: portal ring + beam, monster materialize animation
    crystals.js        # the dropped-crystal pool (InstancedMesh); scatter/pull/collect
    chests.js          # treasure chests with a crystal price over them
    pets.js            # pets that orbit the player and zap/heal
    projectiles.js     # pooled boss-barrage orbs
    shockwave.js       # expanding ground rings (boss slam, player Shockwave)
    logic/resortLayout.js # seeded sundeck prop layout (pools, umbrellas, loungers, signs), isInPool
    logic/items.js     # weapon / ability / pet catalogs
    logic/inventory.js # crystals, hotbar, ability cooldowns, chest loot rolls
    logic/crystals.js  # crystal drops + movement rules
    logic/projectiles.js # fan velocities, projectile stepping/hits
    logic/bosses.js    # the seven bosses (stats, specials, dialogue), boss order/scaling
    logic/cutscene.js  # the boss-intro cutscene timeline (enter -> talk -> title -> done)
    music.js           # procedural Web Audio background track (lookahead scheduler, synth voices, mute)
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

The sky is daylight: a gradient dome (deep blue zenith, pale haze at
the horizon, warm sand below) with a ringed gas giant placed out along
-Z, where the follow camera can see past the platform's edge. A warm
sun (the shadow-casting key light that follows the player) and a cool
hemisphere fill light the scene; the fog matches the horizon haze.
`createEnvironmentMap` (arena.js) PMREM-bakes the sky plus a sun panel
into `scene.environment` once at startup, so physical materials have
something to reflect. The renderer uses `NeutralToneMapping`, and the
composer runs RenderPass -> GTAOPass (ambient occlusion, `GTAO_*`) ->
UnrealBloomPass (near off: only genuinely bright surfaces above
`BLOOM_THRESHOLD` glow) -> OutputPass. Light levels (`KEY_LIGHT_INTENSITY`,
`HEMI_LIGHT_INTENSITY`, `ENVIRONMENT_INTENSITY`, `TONE_MAPPING_EXPOSURE`)
are kept moderate so the pale deck doesn't wash out to white.

The platform is a resort sundeck: a repeating warm-white plank texture
on a light hull, with a teal border band and white pinstripe as flat
rings at the edge. `src/logic/resortLayout.js`'s `resortLayout({ radius,
seed })` is a pure, seeded (`RESORT_LAYOUT_SEED`, so every run is the
same) layout of pools, umbrellas, loungers and signs, with a clear zone
around the center and a margin in from the edge; `arena.js` builds them
from primitives. Umbrellas, loungers and signs are static circular
obstacles in `game.obstacles` (same `{ x, z, radius }` shape as pods), and
`pickPodSpawnPoint`/`spawnPointNearPlayer` take them as `obstacles` so
pods, chests and monsters don't spawn inside one. Pools are walkable;
`isInPool` tells whether a point is in one.

## Hiding pods
Each hiding spot (`src/hiding.js`) is a piece of lost luggage: a
cream hard-shell suitcase (a RoundedBoxGeometry shell with ribs, corner
bumpers, wheels and a telescoping handle) with a paper "NOT A GUEST"
tag swaying from the handle, over the same hide-in/pop-out behavior
(`src/logic/hiding.js`'s box-named functions). Two zip-seam bands around
the shell read the pod's state: idle tan, teal when it's the nearest
one E would enter, or the occupied coral with a pair of googly eyes
peeking out of the zipper gap and the suitcase wiggling comically
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
low-poly mesh in a glossy candy-pastel `MeshPhysicalMaterial`
(clearcoat + sheen, `JELLY_*` in config.js; the player is coral, blobbo
mint, zippy hot pink, grumpus periwinkle, bosses deeper shades) with a
subtle wireframe outline (a lighter tint of the body color) that shares
its geometry, so the edges deform right along with it. `createJellyBody` clones the
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

## Music
The background track is synthesized live (no audio files): `src/logic/music.js`
holds the pure pattern -- an 8-bar, 134 BPM loop in D minor (Dm-Bb-F-C, then
Dm-Bb-F-A) where `eventsForStep` returns the drums, bouncy bass, off-beat stabs,
and either an arpeggio (bars 1-4) or the lead hook (bars 5-8) landing on each
16th -- and `src/music.js` voices those with Web Audio oscillators/noise via a
lookahead scheduler. It starts when the start card is dismissed (browsers need a
user gesture), M toggles mute (saved in `localStorage`), and a low-pass ducks it
on the game-over screen.

## Bosses
After one regular wave a boss fight, then two waves and a boss, then three,
and so on (`wavesBeforeBoss`). `src/logic/bosses.js` defines seven bosses --
King Gloop (sphere), Zipzilla (tetrahedron), Sir Grumpsalot (box), Doctor
Wobble (cylinder), The Cone Father (cone), Madam Mayhem (octahedron), Omega
Jello (dodecahedron) -- each with its own stats, one or two `specials`, and
goofy dialogue. Their stats are folded into `MONSTER_TYPES` (keyed by id) so
spawning, combat and rendering treat them like any monster; boss-only stat
fields are `attackRange`/`reachBonus` (so big bodies can still hit and be hit),
`knockbackScale`, `attackCooldown` and `specials`. The extra shapes
(`sphere`/`tetrahedron`/`cylinder`/`cone`) have exact surface math in
`faceLayout.js`'s `bodySurfaceDistance`, so faces sit right on them, and a
body's resting height comes off its bounding box. A run shuffles the seven
(`shuffleBossOrder`), so all appear before any repeats; later visits have more
hp (`bossHpScale`).

Specials (tuned in `BOSS_SPECIALS`): `charge` (dash), `summon` (minions),
`slam` (ground-pound with a red danger ring during its wind-up), `blink`
(teleport next to you), `barrage` (a fan of orbs, `src/projectiles.js`) and
`spin` (a whirl that hits everything near it). `monster.js`'s
`stepBossSpecials` runs each boss's cooldown timers and wind-ups and returns
events (`slam`, `spinTick`, `barrage`, `summon`, `blink`) that
`main.js`'s `applyBossEvents` turns into damage, shockwave rings
(`src/shockwave.js`), orbs and minions. A special fizzles if you hide.

The wave controller (`src/logic/waves.js`) gained `bossIntro` and `bossFight`
phases: after the last regular wave's intermission it emits `bossIntro`, and
`main.js`'s `startBossCutscene` drops the boss in straight ahead of the player
through a widened portal while `game.cutscene` freezes gameplay (the hide timer
is held too). `runCutscene` pans the camera to the boss and steps
`logic/cutscene.js` -- the boss materializes, says its lines typewriter-style
(Space / Enter / click skips ahead), and its name slams on screen -- then calls
`beginBossFight`. A boss health bar shows during the fight; beating it (or
knocking it off the edge) pops its minions, scores bonus points, and heals extra.

## Crystals, chests, and loot
Every kill that finishes its death pop drops crystals (`crystalDrops`: a couple
of 1s for blobbo, a 2 for zippy, three 2s for grumpus, eight 5s for a boss; a
monster that just falls off the edge drops nothing). They scatter, rest, and
home in once you're within a magnet radius (`src/crystals.js` /
`logic/crystals.js`); clearing a wave or boss pulls every leftover to you.

Chests (`src/chests.js`) stand on the platform with a price floating over them
(`chestCost` climbs with how many you've opened; green when affordable, red
when not). At most `CHEST_MAX_ACTIVE` exist at once, placed like pods (reusing
`pickPodSpawnPoint`/`stepPodSpawner`), and a boss leaves a FREE one where it
fell. Press F within `CHEST_INTERACT_RANGE` to pay and open one; it rolls
(`rollChestLoot`) a weapon, ability or pet you don't own yet, or -- once you own
all 14 items -- a score and heal bonus.

- **Weapons** (`WEAPONS`, the 1-5 hotbar): Energy Sword (start), Twin Dagger,
  Neon Spear, Mega Hammer, Moon Scythe, each with its own damage / range / arc /
  cooldown / knockback and 3D model. `combat.js`'s `updatePlayerAttack` takes the
  selected `weaponId`; a new weapon is equipped when found.
- **Abilities** (`ABILITIES`, keys Q Z X C V in pickup order, each on a
  cooldown shown on its slot): Blink, Shockwave, Heal Pulse, Bubble Shield,
  Rage. Effects live in `main.js`'s `activateAbility`.
- **Pets** (`PETS`): Sparky and Blasty zap the nearest enemy, Healbit heals,
  Magneto widens the crystal pull, Shieldy softens every hit (`petEffects`).
  They orbit you and can't be hurt (`src/pets.js`).

`combat.js`'s `damageMonster` is the one place a monster takes a hit (sword,
pet zap, shockwave all use it). The inventory HUD (crystal count, hotbar,
ability bar, pet icons, chest prompt, loot toast) is in `hud.js`.
