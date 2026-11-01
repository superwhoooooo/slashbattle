# SlashBattle

A goofy neon 3D brawler built with Three.js. You're a wobbly jelly guest on a
floating resort sundeck in space, fighting endless waves of jelly monsters
with mismatched googly-eyed faces. Knock them off the edge, hide in lost
luggage to ambush them, open coolers for new weapons, abilities and pets, and
survive the boss that checks in every few waves.

**Play it:** https://superwhoooooo.github.io/slashbattle/

## Controls

| Action | Keyboard / mouse | Gamepad |
| --- | --- | --- |
| Move | WASD / arrow keys | Left stick / d-pad |
| Attack (ranged weapons aim at the cursor) | Left click / Space | A / RT |
| Toggle auto-shoot | L | |
| Hide in / leave a suitcase | E | B |
| Open the nearest chest | F | X |
| Pick a weapon | 1-5 | LB / RB |
| Use abilities | Q Z X C V | Y, LT + Y/A/B/X |
| Restart after losing | R | Start |
| Mute | M | Back |

On a phone or tablet you get on-screen sticks and buttons instead (add `#touch`
to the URL to try them on a desktop). Press **B** on the start card for
sandbox mode: no waves, god mode, and a Tab menu to spawn monsters, equip any
item and jump between levels.

## How it plays

- **Waves** grow every round, and a **boss** arrives after one wave, then
  after two, then three, and so on. Each boss gets a cutscene and has its own
  special attacks.
- **No walls at the edge.** Monsters that fall die; if you fall, you lose HP
  and respawn in the middle.
- **Hiding** in a suitcase makes monsters lose track of you. Coming out gives
  your next hit bonus ambush damage. Each suitcase is single-use, and you get
  ejected after 10 seconds.
- **Crystals** drop from kills and pay for **chests**, which roll weapons
  (17), abilities (13) or pets (21) you don't own yet.
- **Tricks and chains:** every kill is a named trick, and kills close together
  build a score multiplier. Your best score and wave are saved in the browser.
- Beating a boss moves you on to the next of five themed levels.

## Development

Requires Node 22 (what CI uses).

```sh
npm install
npm run dev            # Vite dev server
npm test               # Vitest suite
npm run build          # production build in dist/
npm run build:single   # one self-contained dist-single/SlashBattle.html
```

`build:single` inlines everything into one HTML file you can send to someone.
It opens by double-click, with no server or internet needed.

Game rules (combat, AI, waves, hiding, falling, loot and so on) live in
`src/logic/` as pure functions with no Three.js dependency, and each has a
spec in `test/`. Rendering, audio and input are in the rest of `src/`, and
tunable constants are in `src/config.js`. `CLAUDE.md` describes the
architecture in more detail.

Every push to `main` runs the tests, builds, and deploys to GitHub Pages
(`.github/workflows/deploy.yml`).

All graphics, music and sound are generated in code; the game ships no image
or audio files.
