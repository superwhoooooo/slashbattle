# SlashBattle

SlashBattle is a 3D goofy dungeon brawler built with Three.js. The player
fights monsters with funny, mismatched faces in a hand-built dungeon, with
real-time melee combat and crates the player can hide inside to ambush
monsters that lose track of them.

## Gameplay
Kill every monster (a mix of Blobbo, Zippy, and Grumpus) to win; losing
all your hp loses the game. Monsters wander until they spot you, chase,
and attack once in range; hiding in a crate breaks their line of sight,
so a chasing or attacking monster gives up and searches your last known
spot before going back to wandering. Popping out of hiding deals bonus
"ambush" damage on your next hit for a short window. R restarts the game
at any time after winning or losing.

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
    main.js            # bootstrap: renderer, scene, camera, game loop
    config.js          # tunable constants (speeds, damage, ranges, HP)
    input.js           # keyboard/mouse state
    dungeon.js         # level layout (grid map -> floor/wall meshes, box spawn points, collision grid)
    faces.js           # goofy face generator (CanvasTexture: googly eyes, wonky mouths, tongues)
    characters.js      # build player/monster meshes (body + face plane + bobbing/wobble)
    player.js          # movement, attack swing, health, hide/unhide state
    monster.js         # monster AI state machine
    hiding.js          # box interaction logic (find nearest box, enter/exit)
    combat.js          # hit detection (range + facing arc), damage, knockback, cooldowns
    hud.js             # DOM HUD updates
    logic/             # pure, Three-free functions so they can be unit tested
  test/                # Vitest specs for logic/ (combat, AI transitions, hiding, collision)
```

All files listed above now exist.

## Conventions
Testable game rules (distance/arc checks, AI state transitions, collision
against the grid, hide eligibility, and similar) live in `src/logic/` as
plain, pure functions with no Three.js imports. This keeps them covered by
Vitest specs in `test/` without needing a WebGL context.
