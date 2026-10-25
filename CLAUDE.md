# SlashBattle

SlashBattle is a 3D goofy neon brawler built with Three.js. The player
fights monsters with funny, mismatched faces on a single floating
circular platform adrift in space, with real-time melee combat and
crates the player can hide inside to ambush monsters that lose track of
them.

## Gameplay
Kill every monster (a mix of Blobbo, Zippy, and Grumpus) to win; losing
all your hp loses the game. Monsters wander until they spot you, chase,
and attack once in range; hiding in a crate breaks their line of sight,
so a chasing or attacking monster gives up and searches your last known
spot before going back to wandering. Popping out of hiding deals bonus
"ambush" damage on your next hit for a short window. There are no walls
at the platform's edge: anyone whose center leaves it falls. A monster
that falls dies (counts as a kill); a player who falls loses HP and
respawns at the center with a moment of invulnerability. Attacks knock
monsters back, which can push them off the edge. R restarts the game at
any time after winning or losing.

## Controls
- WASD / arrow keys — move
- Left click or Space — swing your sword
- E — enter or exit a nearby crate to hide
- R — restart after winning or losing

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
  index.html           # canvas + HUD overlay (health, hidden indicator, game over/win)
  src/
    main.js            # bootstrap: renderer, scene, camera, post-processing, game loop
    config.js          # tunable constants (speeds, damage, ranges, HP, arena/visual tuning)
    input.js           # keyboard/mouse state
    arena.js           # the floating platform, starfield/nebula sky, lighting, neon pylons
    faces.js           # goofy face generator (CanvasTexture: googly eyes, wonky mouths, tongues)
    characters.js      # build player/monster meshes (body + face plane + bobbing/wobble)
    player.js          # movement, attack swing, health, hide/unhide state, falling
    monster.js         # monster AI state machine, falling
    hiding.js          # box interaction logic (find nearest box, enter/exit)
    combat.js          # hit detection (range + facing arc), damage, knockback, cooldowns
    hud.js             # DOM HUD updates
    logic/             # pure, Three-free functions so they can be unit tested
  test/                # Vitest specs for logic/ (combat, AI transitions, hiding, arena, falling)
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
