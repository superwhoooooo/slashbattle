# SlashBattle

SlashBattle is a 3D goofy neon brawler built with Three.js. The player
fights wobbly jelly monsters with funny, mismatched faces on a single
floating circular platform adrift in space, with real-time melee combat
and crates the player can hide inside to ambush monsters that lose track
of them.

## Gameplay
There's no win state: monsters (a mix of Blobbo, Zippy, and Grumpus)
arrive in endless waves, each bigger than the last, trickling in one at
a time at the platform's edge with a glowing spawn-in effect. Losing all
your hp loses the game. Monsters wander until they spot you, chase, and
attack once in range; hiding in a crate breaks their line of sight, so a
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
- E — enter or exit a nearby crate to hide
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
    faces.js           # goofy face generator (CanvasTexture: googly eyes, wonky mouths, tongues)
    characters.js      # build player/monster jelly bodies (shape + face anchor + indicators)
    jelly.js           # the jelly body: shared-geometry wireframe edges, per-vertex deformation
    spawner.js         # the spawn-in effect: portal ring + beam, monster materialize animation
    highScore.js       # load/save the best score/wave in localStorage (try/catch, zero fallback)
    player.js          # movement, attack swing, health, hide/unhide state, falling
    monster.js         # monster AI state machine, falling
    hiding.js          # box interaction logic (find nearest box, enter/exit)
    combat.js          # hit detection (range + facing arc), damage, knockback, cooldowns
    hud.js             # DOM HUD updates (health, score, wave, enemies left, banners, game over)
    logic/             # pure, Three-free functions so they can be unit tested
  test/                # Vitest specs for logic/ (combat, AI, hiding, arena, falling, jelly, waves)
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
`ARENA_RADIUS`) floating in space, with no walls at the edge -- line of
sight is always clear, so monsters see the player whenever they're
within `SIGHT_RANGE` and not hidden. Crates are temporarily placed at a
few fixed positions on the platform (`CRATE_POSITIONS` in config.js) as
circular obstacles; a later milestone restyles them as cargo pods and
spawns them dynamically. Monsters keep their own steering (wander,
chase, search) away from the very edge (`MONSTER_PLATFORM_MARGIN`), so
only knockback -- or the player's own choice to walk off -- sends anyone
over the side.

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
burst). A face plane rides a `faceAnchor` child that pulses with the
overall bulge/hit state rather than tracking individual vertices; a
sword (player only) is attached directly to the body group instead, so
it stays rigid.
