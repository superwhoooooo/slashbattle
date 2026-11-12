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
Every kill is also a named trick (`src/logic/tricks.js`'s `nameTrick`,
highest precedence first): VIP Checkout (a boss falls), Do Not Disturb
(any other boss kill), Checkout (a fall), Cannonball (killed in a pool),
Room Service (an ambush kill), Turndown Service (a pet zap), Wake-Up Call
(Shockwave), Whack-a-Mole (a dazed gopher), Photobomb (a paparazzo's flash hit another monster), or plain Slash. `damageMonster` records the last hit's
`cause`/`ambush` on the monster so `main.js`'s `scoreKill` can name it.
Kills within `CHAIN_WINDOW` of each other build a chain (`stepChain`)
whose multiplier (up to `CHAIN_MAX`) scales that kill's points (never the
wave bonus); the score sticker shows the trick name over the points, and
a "CHAIN xN" chip shows in the HUD while a chain of 2+ is live.
The best score and the best wave reached ever are saved in the browser
(`localStorage`) and shown on the game-over screen alongside the run
that just ended, with a "NEW BEST!" callout when you beat your own
record.

## Controls
- WASD / arrow keys — move
- Left click or Space — cast / swing your weapon (ranged weapons, the Wizard Staff included, aim at the mouse cursor)
- L — toggle auto-shoot (holds the trigger for ranged weapons; shown bottom-right)
- E — enter or exit a nearby pod to hide
- R — restart after losing
- M — mute / unmute all sound, music and effects (remembered in `localStorage`)
- F — open the nearest chest (costs crystals)
- [ / ] — cycle the scope / ammo of the rifle in your hands (J opens the Gunsmith)
- Shift (or E with no suitcase near) — in a water room: dive / surface
- 1-5 — pick a weapon from the hotbar (melee or firearm)
- Shift — tap to dash (`DASH_*` in config.js: a 0.17s burst with brief i-frames, 1.8s cooldown); hold to sprint (1.5x speed; in a water room it dives instead)
- Q / Z / X / C / V — use your abilities, in the order you found them
- 0 — toggle first-person view (pointer-locked mouse look; W moves along the view, every weapon aims where you look; Esc or 0 exits)
- N — open the Dragon Den (customize your dragons' scale and breath); in the Wilds (free roam) N shoots/swings instead and Space jumps (`logic/jump.js`: a plain hop, not an ability); Space again in the air opens the paraglider (`src/glider.js`: slow steady sink, 1.7x speed; Space folds it); E near a villager talks
- U — in the Wilds: open the Wilds journal (goals, landmarks, bestiary, races); F inside a treasure map's circle digs
- Y — open the hub's Heroes page (pick a hero and skin; see Heroes below)
- I — open the hub's Contracts page (contracts, hero mastery, records; see Difficulty and progress below)
- Tab — open the power-up menu (pauses the game): click a power-up to equip / unequip it (in sandbox mode Tab opens the sandbox menu instead)

A standard gamepad works too (`src/logic/gamepad.js` maps a snapshot to
actions; `src/input.js` polls it each frame via `pollGamepad()` and merges
it into the same queries the keyboard/mouse answer): left stick or d-pad
move, A or RT attack, B hide, X open a chest, LB/RB previous/next weapon,
Y ability 1 and LT + Y/A/B/X abilities 2-5 (while LT is held, A/B/X only
fire abilities), Start restart, Back mute; A or Start dismisses the start
card and skips cutscene lines. `input.rumble()` gives light rumble on a
landed hit, medium on a kill and strong on player damage or a boss slam,
where the browser supports `vibrationActuator`.

## Commands
- `npm install` — install dependencies
- `npm run dev` — start the Vite dev server
- `npm test` — run the Vitest test suite
- `npm run build` — produce a production build
- `npm run build:single` — pack the build into one self-contained `dist-single/SlashBattle.html` (scripts, styles, fonts inlined) that opens by double-click, to send to someone

## Project layout
```
slashbattle/
  CLAUDE.md            # how to install, run, test, build; project rules
  package.json         # scripts: dev, build, preview, test
  index.html           # canvas + HUD overlay (health, score/wave, wave banner, game over)
  src/
    main.js            # bootstrap: renderer, scene, camera, post-processing, game loop
    config.js          # tunable constants (speeds, damage, ranges, HP, arena/visual tuning)
    input.js           # keyboard/mouse/gamepad state, rumble
    arena.js           # the resort sundeck + props, daylight sky + gas giant, environment map, lighting
    face3d.js          # 3D goofy face features (googly eyes, mouths, brow/tongue/cheeks), attached to a jelly body
    characters.js      # build player/monster jelly bodies (shape + 3D face + indicators)
    jelly.js           # the jelly body: shared-geometry wireframe edges, per-vertex deformation
    spawner.js         # the spawn-in effect: portal ring + beam, monster materialize animation
    crystals.js        # the dropped-crystal pool (InstancedMesh); scatter/pull/collect
    chests.js          # treasure chests with a crystal price over them
    pets.js            # pets that roam out to enemies, fight them their own way, and return to the player
    logic/petAI.js     # pure pet roaming: sight/leash, where each attack style wants to stand, strike looks
    petModels.js       # the pets' real animal / object models (fox, bee, bomb, medkit...)
    projectiles.js     # pooled boss-barrage orbs
    shockwave.js       # expanding ground rings (boss slam, player Shockwave)
    props.js           # per-level prop models (beach umbrellas, ice crystals, lava spires, neon pylons, lollipops)
    touch.js           # on-screen touch controls (floating sticks, HIDE/CHEST/AUTO buttons, tappable slots)
    sandbox.js         # sandbox mode's Tab menu (spawn, equip, levels, actions)
    loadout.js         # the Tab power-up menu (equip / unequip, pauses the game)
    hazards.js         # bloater poison globs + puddles (pooled meshes)
    logic/enemies.js   # the late enemies' rules (ranged attacks, splitting, poison) + enemyScale difficulty ramp
    logic/sandbox.js   # pure sandbox item toggling + top-up
    logic/world.js     # the Wilds: biomes, seeded chunk content (props/monsters/treasure), chunk streaming rules
    worldArena.js      # the Wilds' look: biome-painted ground, twilight sky, auroras/lightning, instanced scenery, fireflies
    worldModelKit.js   # part/limb/primitive helpers the Wilds' scenery models are merged from
    frontierModels.js  # models for the Frontier biomes' scenery and the landmarks
    wildsActivities.js # the Wilds' lanterns, wayshrines, race rings, star shards (look only)
    journalUi.js       # the Wilds journal panel (U)
    logic/wildsJournal.js # journal + milestones + bestiary (saved); logic/lanterns.js, wayshrines.js, treasure.js, races.js, wildEvents.js, wildsSpots.js: the activities' rules
    logic/quests.js    # villager quests: generation, the quest log, dialogue (pure)
    logic/jump.js      # the Wilds' jump physics (pure)
    npcs.js            # the villagers: the player's jelly model in pastel colours, name tags, quest markers
    questUi.js         # dialogue panel, quest tracker, talk prompt, toast (DOM)
    logic/levels.js    # the five places (themes) and which one follows each boss
    logic/resortLayout.js # seeded sundeck prop layout (pools, umbrellas, loungers, signs), isInPool
    logic/items.js     # weapon / ability / pet catalogs
    logic/bullets.js   # player bullet rules (makeBullets, stepBullet)
    bullets.js         # the pooled player-bullet meshes
    logic/inventory.js # crystals, hotbar, ability cooldowns, chest loot rolls
    logic/crystals.js  # crystal drops + movement rules
    logic/projectiles.js # fan velocities, projectile stepping/hits
    logic/bosses.js    # the seven bosses (stats, specials, dialogue), boss order/scaling
    logic/cutscene.js  # the boss-intro cutscene timeline (enter -> talk -> title -> done), concierge intro line
    logic/hitstop.js   # hitstop freeze state (triggerHitstop / stepHitstop)
    logic/status.js    # freeze / slow / Time Warp rules (applyFreeze, statusTimeScale; bosses are slowed, not frozen)
    graphicsStyle.js   # the saved monster look ('jelly' | 'shard' = Realist), picked on the start card; the Wilds force creatures
    beasts.js          # the Realist creatures: one baked, hide-textured, rim-lit creature body per monster type
    logic/hudText.js   # HUD phrasing (enemiesLeftText)
    logic/checkpoint.js # the Wilds' save points (Sanctum + villages): spot rules, respawn spot, saved-spot parsing
    logic/shadyGuests.js # the paparazzo, gopher and Bellhop Bandit: stats, wave weights, snipe/burrow state machines, steal/refund rules
    logic/tricks.js    # kill trick names (nameTrick) and the chain multiplier (stepChain)
    logic/announcements.js # the resort PA lines (wave start/cleared, boss incoming, low hp, ambush)
    logic/carpet.js    # the VIP red carpet's eased unroll fraction
    carpet.js          # the VIP red carpet mesh for a boss's arrival
    audio.js           # the shared AudioContext, master gain (mute) and compressor
    music.js           # procedural Web Audio background track (lookahead scheduler, synth voices)
    sfx.js             # synthesized, spatialized sound effects
    logic/gamepad.js   # gamepad deadzone, button edges, button -> action mapping
    logic/sfx.js       # sound-effect rate limiting and trick -> voice mapping
    highScore.js       # load/save the best score/wave in localStorage (try/catch, zero fallback)
    saveSync.js        # one save per device: syncs the save keys with ~/.slashbattle/save.json via the dev server (vite.config.js plugin; logic/saveData.js rules), plus pause-menu Export/Import save; savers call noteSaved()
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
within `SIGHT_RANGE` and not hidden. Hiding pods are circular obstacles
spawned dynamically (see Hiding pods below). Monsters keep their own steering (wander, chase,
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
rings at the edge, and a matching teal inlay ring around the prop-free
center (its outer radius is resortLayout's exported `CENTER_CLEARANCE`). `src/logic/resortLayout.js`'s `resortLayout({ radius,
seed })` is a pure, seeded (`RESORT_LAYOUT_SEED`, so every run is the
same) layout of pools, umbrellas, loungers and signs, with a clear zone
around the center and a margin in from the edge; `arena.js` builds them
from primitives. Umbrellas, loungers and signs are static circular
obstacles in `game.obstacles` (same `{ x, z, radius }` shape as pods), and
`pickPodSpawnPoint`/`spawnPointNearPlayer` take them as `obstacles` so
pods, chests and monsters don't spawn inside one. Pools are walkable;
`isInPool` tells whether a point is in one.

## Levels
`src/logic/levels.js`'s `LEVELS` are five places (Orbital Resort, Frostbite Spa,
Magma Marina, Neon Nightclub, Candy Cove), each a palette + layout seed + sign
text: sky, fog, hull/deck/border colors, planet, lights, pool water, umbrella
palette. Defeating a boss moves the run to the next one (`levelIndexAfterBosses`,
wrapping; the visiting order is `LEVEL_ORDER`: Resort, Frostbite Spa, then water rooms and dry places alternate, water first), via `main.js`'s `changeLevel`: it builds `createArena(level, { avoid })`
(props steer clear of pods, chests, monsters and the player), swaps the prop
obstacles in `game.obstacles`, and re-bakes the environment map. Each level's
`props.style` picks its own prop models from `src/props.js`'s `PROP_STYLES`
(`feature` replaces the umbrellas, `seat` the loungers): ice crystal clusters and
snow mounds, volcanic spires and lava rocks, neon pylons and speaker boxes,
lollipops and gumdrops. The move is a **hyperspace jump** (`logic/levelTransition.js`'s pure
timeline: `wait` 1.6s of play, then the world freezes for the `charge` (star streaks in the next place's
sky colours, a rising `hyperspace` sound, a lurch), a full-white `hold` behind which `changeLevel` swaps
the place, and a `reveal` where the camera swoops down from `cameraLift` above while a "NOW ARRIVING"
boarding-pass card shows the new name and one of its sign lines, with an `arrive` boom). `src/levelTransition.js`
draws it (a 2D canvas + DOM card); `main.js`'s `runLevelTransition` drives it. The sandbox's level jumps stay instant. A restart
returns to the first place.

## The Wilds (free roam world)
Pick it on the start card (button or O). A vast mystical floating continent (`WORLD_RADIUS` 560) instead of the
sundeck: no waves, no levels, you just roam. `createGame` calls `config.js`'s `setArenaRadius(WORLD_RADIUS)` (ARENA_RADIUS
is a live `let` binding, so every clamp, fall and spawn ring follows; the sundeck/labyrinth reset it to 48) and builds
`src/worldArena.js`'s `createWorldArena()`. `src/logic/world.js` (pure, seeded by `WORLD_SEED`) holds the rules:
`biomeAt` splits the ring around the central **Sanctum** (safe; heals you; `SANCTUM_RADIUS`) into five meandering biomes
-- Whisperwood, Amethyst Dunes, Frostveil Reach, Emberwaste, Gloomfen -- each with its own scenery, ground colours
(`groundColorAt`, blended across borders), fog/glow and monster table (`BIOMES`; a monster entry is `[type, weight,
minDanger]`). `dangerAt` rises 0 -> 1 from the Sanctum to the rim and scales monster hp / damage / speed and the elite
chance (elites glow red, 2.4x hp). `chunkContent(cx, cz)` deterministically seeds a 40-unit chunk's props, camp monsters
(stable ids) and treasure (chests, suitcases, power-ups); `diffChunks` streams chunks in within `LOAD_RADIUS` and out past
`UNLOAD_RADIUS`. `main.js`'s `stepWorld` applies it: scenery goes into per-kind InstancedMeshes
(`arena.world.setProps`), solid props join `game.obstacles`, camp monsters spawn through `spawnMonster` (remembered in
`game.world.live`; a slain camp member stays dead for `RESPAWN_SECONDS`), monsters left far behind are dropped, a biome
banner names each biome you enter, and a minimap (`#minimap`) shows the land within `MINIMAP_VIEW` (210) of you (rim arrows
point to the Sanctum and to quest villages off the map), monsters, chests, villages, ruins, landmarks and skystars. Random pod/chest/perk
spawners are off (`game.world` set); treasure comes from the chunks. The edge has no wall: walk off it and you fall.

**Heartland and Frontier.** The five biomes above form the Heartland ring; past a meandering border near `HEARTLAND_RADIUS`
(300) lies the **Frontier** (`FAR_BIOMES`, `ringAt` = 'far'), six stranger biomes: Glowcap Hollow (giant glowing mushrooms,
misty), Saltglass Flats (white salt crust, salt pillars, clear long views), the Drowned Reach (mangroves, sunken columns, extra
lakes via the biome's `lakes`), Stormcrown Heights (slate cairns, lightning rods, flat-topped **mesas** via `mesas`, lightning
strikes with thunder via `storm`), the Bonewaste (ribcages, skulls, bone spikes) and the Skyshard Expanse (floating islands,
hovering crystal shards, aurora). Optional biome fields: `fogRange`, `aurora`, `storm`, `density`, `lakes`, `mesas`,
`landmarks`. `OUTER_BIOMES` is still the Heartland five; `WILD_BIOMES` is all eleven (explore quests pick from it).
worldArena.js keys its per-biome looks (`ROCK`, `GRASS_STYLE`, `DRIFT`, `LAKE_TINT`) by biome id, falling back to the
sanctum's. Hills, lakes, villages and sites are bucketed in a coarse grid (`makeGrid`) so `heightAt` stays cheap.

**Landmarks.** `landmarks()` seeds ~40 named sights (`LANDMARK_KINDS`: colossus head + hand, stone circle, monster camp, cave
mound, great arch, and the Frontier's elder shroom, thunder spire, leviathan skeleton and sky anchor), each biome favouring its
own (`BIOMES[id].landmarks`). `landmarkLayout(lm)` returns props / treasure / guards like `ruinLayout` (a `blocker` prop is an
invisible obstacle with no model). Ruins and landmarks are both "sites" (`sites()`, `nearestSite`): the ground is levelled
under them, scenery / grass / wild camps keep off, and `chunkContent` streams their props, loot and guards (`siteId`).
Reaching one shows "DISCOVERED: name" (per run, `game.world.discovered`) and feeds a `{ type: 'discover', landmarkId, kind,
biome }` quest event (see activities below). They show as diamonds on the minimap. Roads run from each village to its nearest
landmark too, and Frontier villages connect to the nearest village closer in (a branching network).

**Hills.** `heightAt(x, z)` (pure, in `logic/world.js`) is the ground height: broad swells, finer bumps and ~84 big seeded
mounds, levelled flat in the Sanctum, at the rim and under every village plaza. The ground mesh, props and grass sit on it,
and `main.js` lifts the player, monsters, chests/pods/pickups and pets onto it (`pets` via a `groundLift` they carry). The
particle / projectile / shockwave / bullet / crystal layers ride up with the player (`world.groundY`, `applyFxDepth`), and the
camera follows a smoothed `camGround`.

**Higher hills, lakes, ruins.** The mounds are tall (peaks of 26-36 units, big enough to launch a paraglider from; overlapping hills
merge with `max`). `LAKES` (~24, on low ground, away from villages) dip the ground to `LAKE_BED` below `WATER_LEVEL`; `worldArena.js`
draws a translucent water disc per lake, wading is slower, and `lakeAt` keeps props/grass/land monsters out. Each lake holds
urchins, eels and anglers (`WATER_MONSTERS`; chunk monster entries with `lake: {x,z,radius}`, clamped in main.js so they
never leave it, floating at the surface). `ruins()` seeds ~30 Zelda-style sites on levelled flagstones: **temples** (a ring of
columns, broken walls, a central shrine, a chest, and a guardian **boss** from `BOSSES` plus two elites; the boss respawns
after `BOSS_RESPAWN_SECONDS`), **watchtowers** (a chest, an elite and guards) and lone **shrines** (a power-up and a suitcase).
`ruinLayout(ruin)` returns props / treasure / guards; ruins show as triangles on the minimap (gold = boss temple). Villages
are at least `VILLAGE_MIN_SEPARATION` (135) apart.

**Villages and quests.** `villages()` seeds ~20 villages (a guaranteed starter just outside the Sanctum, at least one in every
biome of both rings, unique names); `villageLayout(v)` places a hall, cottages, a well, lamp posts, a notice board and three villagers. Villages are safe
(`VILLAGE_SAFE_RADIUS`: no wild monsters). Villagers (`src/npcs.js`) are built with `createPlayerMesh()`, so they look like the
player, each in their own pastel; they amble about, face you, and wear a marker ('!' request, '...' open, '?' to collect).
Press E near one (when no suitcase is in reach) to talk: the game freezes while the dialogue (`src/questUi.js`) is open.
`logic/quests.js`'s `questFor(npc, round)` generates a quest (slay N in the village's biome, hunt a local monster, slay an
elite, gather crystals, walk into another biome, or deliver a letter to a villager elsewhere; paid there), `questEvent`
advances them from kills / crystals / entering a biome / talking, and up to `MAX_ACTIVE_QUESTS` (3) can be open. Rewards are
crystals plus a heal; a villager's next request is new each time. The tracker sits under the score and the minimap shows
villages, with a gold ring where a quest wants you.

**Chests in the Wilds.** They use the `wilds` container skin (carved dark wood, gold bands, glowing violet rune gem; `chests.js`'s
`runes` extra) instead of the cooler. They were rare (10% of far chunks, and the village/lake filter also dropped ruin chests);
now `WILD_CHEST_CHANCE` (30%) of chunks beyond 20 units hold one (kept off roads and out of props), every village has one
(`villageLayout(v).treasure`) and ruin chests are never filtered. Quests: harder ones (`quest.weaponReward`; elites always) also
pay a weapon you don't own (`questWeaponFor`); a full hotbar opens the swap panel. The dialogue, tracker and toast mention it.

**Things to do out there (activities).** All pure rules in `src/logic/` (tested in `test/wildsActivities.test.js`), the look in
`src/wildsActivities.js` (added to the arena group as `game.world.fx`), wired by `main.js`'s `stepActivities` (from `stepWorld`):
- **Wilds journal** (`logic/wildsJournal.js`, saved in `slashbattle:journal`, a save key): landmarks found, biomes walked, a bestiary
  (kills per creature; the first of a kind ever pays `BESTIARY_FIRST_REWARD`), lanterns lit, race best times, treasures, events,
  shrines. `MILESTONES` pay once per device (crystals, some a weapon / ability / pet you lack via `pickUnowned`, queued in
  `w.lootQueue` so the swap panel can ask). U (or the touch JOURNAL button) opens `src/journalUi.js`'s panel; it freezes the game.
- **Landmark discoveries** pay crystals (more the first time ever) and hand over a **treasure map**; villagers' 'explore' requests
  become 'discover' quests (`Seek <landmark>`, `DISCOVER_CHANCE`) completed by the `discover` event, fired on every arrival.
- **Treasure maps** (`logic/treasure.js`): up to `MAX_MAPS`; a dashed gold circle on the minimap (off-centre `hint`) holds the spot,
  a status chip reads cold / cool / warm / hot, sparkles show when close, and F inside the circle digs (`digAt`, `DIG_RADIUS`): a free
  chest plus crystals. The travelling merchant sells maps too.
- **Lost Lanterns** (`logic/lanterns.js`, 160 seeded): walk into one to light it (crystals, a bonus every 10th; remembered in the
  journal). Unlit ones within 120 are drawn (one instanced batch) and show on the minimap within 55.
- **Wayshrines** (`logic/wayshrines.js`, ~25 beside roads): a timed boon (Swiftwind speed, Giant's Might damage, Stoneward ward,
  Gilded Luck double crystals, Wellspring regen + heal), then `SHRINE_RECHARGE`; `foldBoons` folds running boons into `perk`.
- **Sky-ring races** (`logic/races.js`): start gates on high summits; `stepRace` starts the clock in the gate, counts rings in order
  (rings hang on a conservatively steep glide path, so too high is fixable by folding the glider), and medals by time (gold / silver
  / limit from an honest glide-then-run estimate); best times go in the journal.
- **Roaming events** (`logic/wildEvents.js`): a director (`stepEventDirector`; never in the Sanctum, a village, a lake or a race)
  starts one every `EVENT_GAP`: **Ambush** (two rushes of the local monsters, `hordePlan`; beat them in time for crystals + a free
  chest), **Starfall** (meteors via `dropMeteor`, which now land on the hills; each leaves a star shard), **Travelling merchant**
  (an NPC with id `merchant`; the dialogue panel lists `merchantStock`: gear you lack, a map, a tonic = boon, or a stew), and the
  **Wandering Titan** (a roaming boss via `spawnWildMonster`, bounty on top of its chest; it leaves if ignored).
Status chips (`#wilds-status`) show the race clock, the event, treasure heat and boons; toasts now queue (`questUi.showToast`).

## Labyrinth map
Pick it on the start card (button or K). `src/logic/maze.js` (pure) builds a seeded 7x7 maze per
floor (`buildFloor`, `FLOOR_DEFS`: Cellars, Crypt, Furnace), its walls as circle-chain obstacles
(so all the existing circle collision just works), spike-trap timing (`spikeState`), a navigator
(`createNavigator`: BFS waypoints + line of sight) that `monster.js` uses via `setMonsterNavigator`
so monsters route around walls and can't see/hit through them, and `bossSpot`. `src/labyrinth.js`
builds the 3D floor, walls, torches, spike traps and the portcullis gate + exit pad. A floor is:
one wave, a boss, one wave, a boss (`BOSSES_PER_FLOOR`); the second boss opens the gate
(`openLabyrinthGate`), and stepping on the exit pad goes down a floor (`advanceFloor`). Floor 3's exit
wins. Spikes hurt the player and monsters (trick "Pin Cushion"). The wave controller sits in a
`gateOpen` phase once the gate is open.

## Item icons
`src/icons.js` draws every weapon and pet as a small render of its real 3D model (an offscreen
renderer, cached data URLs) and abilities/power-ups as canvas pictograms; the `icon` emoji fields in
`logic/items.js` are no longer shown. Weapon models live in `src/weaponModels.js`.

## Touch controls
On a phone or tablet (`src/touch.js`'s `isTouchDevice`: a coarse pointer and no
fine one, or `#touch` in the address to test on a desktop) a touch layer feeds the
same `Input`: a floating left stick moves, a floating right stick aims AND attacks
(touching it holds Space; dragging past its deadzone sets `input.touchAim`, which
`main.js`'s `touchAimAngle` turns into `player.aimAngle` for any weapon), HIDE /
CHEST are E / F, AUTO / sound are L / M, tapping the hotbar and ability slots picks
a weapon / uses an ability, tapping the game-over card restarts, and any tap on the
play area advances a cutscene. They all go through `input.tapKey` / `holdKey` (virtual
keys), so nothing else in the game cares. Touch mode also caps the pixel ratio,
turns the AO pass off, shrinks the HUD, and asks for landscape. `window.__debug`
(dev server only) exposes `input` and `game` for browser tests.

## Sandbox mode
Press B (or click the button) on the start card instead of any other key to
start a sandbox run: no waves (`stepWaves` is skipped), crystals pinned to
`SANDBOX_CRYSTALS`, no ability cooldowns (`logic/sandbox.js`'s `sandboxTopUp`)
and god mode on by default. Tab opens `src/sandbox.js`'s menu (a DOM panel; its
clicks stop propagation so they don't swing your weapon): spawn any monster or
boss (shift-click for five), pop everything, heal, drop a chest or pod, toggle
god mode, jump to any level (`changeLevel`), and click any weapon / ability / pet
to equip it or take it away (`sandboxToggleItem`, which swaps a slot when full
and keeps the Wizard Staff). `body.sandbox` hides the wave UI.

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

## Power-ups
`logic/items.js`'s `POWERUPS` (Swift Boots, Heavy Hitter, Quick Hands, Thick Skin, Gem
Greed, Big Shove, Second Helping) are passive perks found lying on the ground (`src/pickups.js`: a glowing icon you walk over; one at the start, a new one every ~16-28s up to 2 at once, and one beside a boss's chest; only perks you don't own; chests no longer roll them; `inventory.powerups` owned, `inventory.equipped` on, up to `POWERUP_SLOTS` = 3,
a new one equips itself if there's room). Tab opens `src/loadout.js`'s menu to pick which
are on (`toggleEquipPowerup`, a full set swaps out the oldest) and freezes the frame.
`powerupEffects(equipped)` multiplies them; `main.js` folds it in next to `petEffects`.
The player's movement is NOT frozen by hitstop (only the world is), so landing hits never
stalls you.

## Late enemies and difficulty
Regular enemies (`src/logic/enemies.js`, stats in `config.js`) unlock by wave:
**bloater** (wave 4) keeps its distance and lobs a poison glob at where you'll BE
(`predictPosition` on a smoothed player velocity), which lands as a damaging puddle
(`src/hazards.js`); **spinner** (5) whirls and fires a fan of small orbs
(`fireProjectile` with `size`); **splitter** (6) bursts into two fast
`splitling`s when killed (not when it falls or is popped). `RANGED_ATTACKS` tunes the
shooters; `monster.js`'s `stepRanged` runs them in the attack state. Every regular
monster also scales with the wave (`enemyScale`: +10% hp, +6% damage, +3% speed per
wave, damage/speed capped), waves grow by 3 and enemies arrive faster (down to 0.9s).

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
mint, zippy hot pink, grumpus periwinkle, bosses deeper shades). A
wireframe outline overlay (a lighter tint of the body color) shares its
geometry, so the edges deform right along with it; it's hidden while
`JELLY_EDGE_OPACITY` is 0, so the jellies read as smooth candy. `createJellyBody` clones the
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

The HUD itself uses the self-hosted `@fontsource/sora` font (no
external network fonts, and the in-world canvas labels use it too) on
frosted white resort cards (`.panel`, `backdrop-filter`, design tokens
on `:root` in index.html), laid out like the sketch: health and the
hide countdown top-left, wave / "N guests still checked in"
(`src/logic/hudText.js`'s `enemiesLeftText`) / score / chain top-right,
crystals bottom-right, and hotbar slots labeled with each weapon's
`short` name; the "Guest Health" bar is segmented with a
coral-to-butter fill and pulses red at/under `LOW_HP_PULSE_THRESHOLD`;
the wave banner is a dark announcement pill whose leading word is
butter, and scales in; the start card lays out its controls with light
key caps. Score popups are tilted stickers in the world (butter for kills, coral
for RING OUT), and `showTrickSticker` also pops the newest trick as a big
tilted screen-space sticker that fades after about 1.2s. Decorative animations respect `prefers-reduced-motion`. A
fixed warm vignette gently darkens the screen's edges, and a brief
red screen flash (`triggerDamageFlash`) accompanies every point the
player takes damage, alongside the existing screen shake.

Hits also freeze gameplay briefly (hitstop, `src/logic/hitstop.js`:
`triggerHitstop` keeps the longer of the current and new freeze,
`stepHitstop` returns the fraction of the frame's dt that gameplay gets).
`damageMonster` triggers `HITSTOP_HIT` on a hit (not on a non-lethal pet
zap), `HITSTOP_KILL` on a kill and `HITSTOP_BOSS` on any boss hit; the
player taking damage triggers `HITSTOP_PLAYER_HURT`. `animate()` passes
the scaled `gameplayDelta` to gameplay systems (player, monsters, waves,
particles, popups, pods, chests, pets, crystals, projectiles, shockwaves)
and the real delta to the camera, shake, HUD and music, so the screen
still shakes during a freeze. Timers keyed on `elapsedSeconds`
(cooldowns, i-frames, ambush/chain windows, hide limit) aren't frozen.

## Resort announcements
`src/logic/announcements.js`'s `pickAnnouncement(kind, { wave, bossName, rng,
previous })` returns a deadpan PA line `{ lead, text }` (lead is a department
tag like FRONT DESK, shown in butter in the wave banner) for `waveStart`,
`waveCleared`, `bossIncoming`, `lowHp` and `ambush`, never repeating the
previous line of its kind. `hud.js` shows them in the wave banner (the
intermission line with a countdown, wave-cleared with its bonus, a one-shot
low-hp line when hp first crosses `LOW_HP_PULSE_THRESHOLD`) with a simple
priority: wave cleared / boss defeated > low hp > intermission.

## Music
The background track is synthesized live (no audio files): `src/logic/music.js`
holds the pure pattern -- an 8-bar, 134 BPM loop in D minor (Dm-Bb-F-C, then
Dm-Bb-F-A) where `eventsForStep` returns the drums, bouncy bass, off-beat stabs,
and either an arpeggio (bars 1-4) or the lead hook (bars 5-8) landing on each
16th -- and `src/music.js` voices those with Web Audio oscillators/noise via a
lookahead scheduler. It starts when the start card is dismissed (browsers need a
user gesture) and a low-pass ducks it on the game-over screen.

Music and sound effects share one AudioContext (`src/audio.js`'s
`createAudio`, created lazily on that first gesture): everything routes through
a master gain (the M mute, saved in `localStorage`) and a compressor.
`src/sfx.js`'s `createSfx(audio)` synthesizes short effects live (swing, hit,
kill, ringOut, cannonball, crystal, chestOpen, podIn/podOut, playerHurt,
bossSlam, waveCleared, announcement); positional ones go through an HRTF
`PannerNode`, and `updateListener(camera)` moves the listener with the camera
each frame. `src/logic/sfx.js` rate-limits rapid voices (crystal, hit) and maps
a kill's trick to its voice (`killVoiceForTrick`). Effects are not ducked on
game over.

## Boss music
During the `bossFight` phase `main.js` calls `music.setMode('boss')` (back to
`'normal'` afterwards and on game over): a faster (156 BPM), darker E-minor
loop from `logic/music.js`'s `bossEventsForStep` -- galloping bass, double
kick, tom runs, a held pad, a stabbing riff then a soaring hook -- registered in
`MUSIC_TRACKS` with the normal track. `src/music.js` voices the extra `pad`,
`riff` and `tom` events and restarts the loop (with a crash) on a switch.

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
(`shuffleBossOrder`), so all appear before any repeats. Every boss fight makes
the next one tougher. The first `BOSS_STARTER_FIGHTS` (2) fights are tuned for a player who may only have the starting
Wizard Staff (`BOSS_STARTER`: 0.8x hp, 0.3x damage, one shield, mild enrage, speed capped at the Cone Father's 1.8 by
`bossSpeedScale`); from the third on, `BOSS_BASE` (1.0x hp, 0.4x damage) applies with hp +12% per fight (`bossHpScale`), damage
+5% per fight capped at `BOSS_DAMAGE_CAP` (0.6x), two shields then three (`immunityThresholdsFor`), a stronger enrage
(`bossEnrage`) and a speed cap rising 0.15 per fight. `BOSS_HEAD_START` 1 gives every boss one extra special from its first
fight (`bossSpecialsFor`, from `BOSS_EXTRA_SPECIALS`; blink is learned last), plus one more per fight won; special cooldowns
shrink 6% per fight (`bossCooldownScale`). `blink` is rare (13s), telegraphed (0.9s) and lands 5.5 away. `main.js` applies these
at spawn via `monster.js`'s `upgradeBossSpecials` (per-boss `ai.specials` /
`ai.specialIntervalScale`).

Every boss has `barrage` (shoots a fan of orbs) and `summon` (calls minions every ~22s, up to 4 alive) on top of its own moves.

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
`logic/cutscene.js` -- a red carpet (`src/carpet.js`) unrolls from the player
to the boss, the boss materializes, a concierge welcomes it (`introLines`,
`speakerFor`), and it says its lines typewriter-style
(Space / Enter / click skips ahead), and its name slams on screen -- then calls
`beginBossFight`. A boss health bar shows during the fight; beating it (or
knocking it off the edge) pops its minions, scores bonus points, and heals extra.

## Screen warp and weapon/ability effects
`src/warp.js` is a post-processing pass (before OutputPass) that bends the rendered
frame around world-space zones: a `swirl` (twist + pinch + chromatic fringe; Warp Field,
Gravity Well) or a `ripple` (an outward refracting ring; Shockwave, Earthquake, Meteor
impact, boss slams, exploding bullets, heavy weapons). `logic/warp.js` holds the pure
envelope math. The Warp Field ability (`vacuum`) opens at the cursor's ground point,
drags monsters in, confuses them (`confusedUntil` in `monster.js`: they stumble and spin,
bosses are immune) and damages them in ticks. Starfall drops falling fireballs (Meteor Strike is no longer in the game).
`src/weaponFx.js`'s `playWeaponFx` gives every weapon its own swing effect (whip crack,
hammer slam, scythe crescent, rail beam, flail whirl...) when a swing starts.

## Crystals, chests, and loot
Every kill that finishes its death pop drops crystals (`crystalDrops`: a couple
of 1s for blobbo, a 2 for zippy, three 2s for grumpus, eight 5s for a boss; a
monster that just falls off the edge drops nothing). They scatter, rest, and
home in once you're within a magnet radius (`src/crystals.js` /
`logic/crystals.js`); clearing a wave or boss pulls every leftover to you.

Chests (`src/chests.js`) are resort beach coolers (cream body, teal hinged
lid, coral latch, butter stripe, a soft teal ground ring) with a price pill
floating over them (`chestCost` climbs with how many you've opened): a white
pill with a teal border and "OPEN" when affordable, a muted pill with a coral
price and "NEED MORE" when not, and a butter "FREE" pill for a boss's chest. At most `CHEST_MAX_ACTIVE` exist at once, placed like pods (reusing
`pickPodSpawnPoint`/`stepPodSpawner`), and a boss leaves a FREE one where it
fell. Press F within `CHEST_INTERACT_RANGE` to pay and open one; it rolls
(`rollChestLoot`) a weapon, ability or pet you don't own yet, or -- once every
slot is full -- a score and heal bonus.

The catalogs are bigger than the slots (22 weapons for a 5-slot hotbar with the
Wizard Staff fixed in slot 1, 18 abilities for 5 keys, 27 pets for `MAX_PETS` = 5), and a
chest only rolls items you don't own. When that category is full the game pauses on
`src/swap.js`'s panel (`needsSwap`/`swappableIds`/`swapItem` in `logic/inventory.js`):
click one of your items to swap it out (never the Staff), or Esc / "Keep what I have".
Only once you own everything does a chest pay out score and a heal ("LOADOUT FULL").

- **Weapons** (`WEAPONS`, the 1-5 hotbar): The player starts with the **Wizard Staff** (`staff`, a firearm-style
  weapon whose magic orbs, cause `magic`, trick "Magic Hour", fly toward the mouse;
  `main.js`'s `mouseAimAngle` raycasts the cursor onto the ground and sets
  `player.aimAngle`, which overrides the movement facing while a ranged weapon is
  out, and L toggles `autoShoot`, passed to `updatePlayerAttack` as `autoAttack`).
  Melee -- Energy Sword (now a chest find), Twin
  Dagger, Neon Spear, Mega Hammer, Moon Scythe, Plasma Katana, Battle Axe, Pixel
  Rapier, Disco Flail, Chainsaw, Boom Stick -- each with its own damage / range /
  arc / cooldown / knockback and 3D model. **Firearms** (`gun: true`: Pop Pistol,
  Confetti Shotgun, Bubble SMG, Rail Gun, Cannonball Launcher) skip the melee
  zone and fire `pellets` bullets in a `spread` fan at the swing's hit moment;
  `bullet` sets speed/life/radius/`pierce`/`explode`. `src/logic/bullets.js`
  (`makeBullets`, `stepBullet`) is the pure flight/hit rule and `src/bullets.js`
  the pooled meshes (`updateBullets` hits through `damageMonster`, cause `gun`,
  trick "Last Call"). `combat.js`'s `updatePlayerAttack` takes the selected
  `weaponId` plus damage / cooldown / knockback multipliers and the bullet pool.
- **Rifles** (`rifle: true` in `WEAPONS`: Hunter, Marksman DMR, Party Carbine, Lever Action, Bolt Action,
  Battle Rifle, Anti-Material, Triple Burst, Arc Rifle, Scout, Gauss, Pearl Longshot): firearms that look and
  drop like any other (chests, hotbar, base model via `WEAPON_BASE`) but take a swappable **scope** and **ammo**
  (`logic/rifles.js`: `SCOPES`, `AMMO`, `tuneRifle` folds picks + levels into the weapon `combat.js` fires).
  Scope advantages: `steady` (crit chance that charges while you stand still, `stepSteady`; the reticle ring
  fills), `longShot` (damage grows with distance flown) and `closeShot` (bonus within `CLOSE_SHOT_RANGE`) via
  `bulletDamage`/`distanceBonus`, plus range, spread, fire rate, camera `zoom`, a laser (`src/scope.js`). Ammo
  changes the bullet (pierce, blast, speed, shove, size, color, pellets, crit). Each bullet rolls a crit in
  `makeBullets` (`bullet.crit`, damage x `critMult`); crits / long / point-blank hits pop a popup.
  Scopes and ammo are UNLOCKED from chests (`rollChestLoot(inv, rng, profile.unlocked)` offers them only once you
  carry a rifle; they're kept in `profile.unlocked` and go onto the rifle in hand), picked per rifle in
  `profile.rifles` (`setRifleOption`: only unlocked ones). Gun levels (1-5: +12% damage, +1.5% crit, 4% faster)
  and ammo levels (1-5: effects 35% stronger) are bought with banked crystals (`buyRifleLevel`/`buyAmmoLevel`).
  The hub's Gunsmith page (J) has picture chips for scopes / ammo (locked ones dashed) and the upgrade buttons;
  `[` / `]` cycle the unlocked scope / ammo in a run.
- **Abilities** (`ABILITIES`, keys Q Z X C V in pickup order, each on a
  cooldown shown on its slot): Blink, Shockwave, Heal Pulse, Bubble Shield,
  Rage, Lunge (dash + slash), Thunderstorm (lightning on the nearest 4), Gravity
  Well (drag enemies in), Bullet Ring (16 shots), Life Drain (damage + heal),
  Frenzy (attack 40% faster), Sprint (1.6x speed), Second Wind (resets the
  other cooldowns). Effects live in `main.js`'s `activateAbility`.
- **Pets** (`PETS`, kinds in logic/items.js): every attacker does what its blurb says, and fighters **roam**
  (`logic/petAI.js` decides where to be, `pets.js` moves/hits): with an enemy in sight (`SIGHT` 16 from the pet, within
  `LEASH` 15 of the player, not behind a labyrinth wall; `sight`/`leash` per pet) they run out to it, and with none in sight
  they run back to their spot beside you. Kinds: `lunge` (runs up and hits in person, `strike` = peck / bite / swat /
  swipe / stab / sting / boing / headbutt / pounce / ram / burn; fast ones stay glued for a flurry, slow ones hit and back
  off; Ember, Frosty, Mittens, Rascal, Shadow, Whirl, Zoom, Bumper, Stripes, Comet, Toco), `explode` (Blasty rolls up,
  blows up in `blast` radius, reforms by you), `pulse` (runs close, hits everything within `radius` with a ring: Spike,
  Boomer, Grumble, Pandy, Koda, Leo), `zap` (stands off, spark beam: Sparky, Bolt), `shot` (stands off, fires a
  `projectile`: Waddles' snowball, Goldie's lobbed water droplet, Polly's squawk rings), `throw` (stands off, hurls
  lightsabers / junk / bananas: Matthias, Remy & Benji, Mojo), and `heal`, `magnet`, `guard` which stay by your side.
  A pet with `split` parts (Remy & Benji) spawns as one unit per part (`pet.buddies`): each moves, aims and throws on its own, prefers an enemy its partner isn't on, and throws at interval × parts so total damage is unchanged. It still counts as one equipped pet.
  No pet buffs the player's own stats (`petEffects` only folds magnet radius and damage taken). Each is a real
  animal / object model from `src/petModels.js` (`def.model`); the ground walkers (16 four-legged animals, the
  penguin and the tortoise) are realistic builds in `src/petAnimals.js` (`quadruped`: chest/hips/neck, muzzle, glossy
  eyes, jointed legs that trot or hop, jointed tail, per-species markings; parts merged per joint by `mergeRigid`).
  Their melee hits (`lunge` strikes and `pulse` hits) show as claw scratches on the screen over the enemy
  (`src/scratch.js`, via `updatePets`' `onScratch` / main.js's `petScratch`) instead of sparks. Pets can't be hurt; they stay on the platform, slide
  along labyrinth walls, and pop back beside you if stuck or farther than `SNAP_DISTANCE`.

`combat.js`'s `damageMonster` is the one place a monster takes a hit (sword,
pet zap, shockwave all use it). The inventory HUD (crystal count, hotbar,
ability bar, pet icons, chest prompt, loot toast) is in `hud.js`.

## Recent tuning notes
- Waves: 4 enemies on wave 1, +4 per wave, faster trickle (`waves.js`); in the labyrinth half of spawns bring a second monster.
- Bosses: the first two fights are tuned for a staff-only player (`BOSS_STARTER`); later ones scale from `BOSS_BASE` (soft hits, damage capped at 0.6x); blinks are rare.
- Labyrinth walls block melee, bullets and pets (`monster.js`'s `hasWallLineOfSight` / `isInsideWall`).
- Ghost Form fades the player (`main.js`'s `setGhostLook`) and counts as hidden for monster perception.
- Pause menu has a "Main menu" button (reloads to the start card).
- New weapons borrow a base weapon's model/swing/fx via `items.js`'s `WEAPON_BASE`/`weaponBase`.
- Melee only lands within arm's reach (`monster.js`'s `MELEE_REACH_SLACK`: radius + 2.5, center to center), so long-range casters (attackRange 9-14) never hurt you just for being near; only their visible shots do.

## Profile, hub, skill tree (per device)
`src/logic/profile.js` (pure) + `src/profile.js` (localStorage `slashbattle:profile`, try/catch) hold what
persists between runs: banked crystals, the pet collection (every pet ever found), 3 loadouts of up to
`MAX_PETS` starting pets (`activeLoadoutPets`; applied by `main.js`'s `applyLoadoutPets` on every new run and
when the start card is dismissed), and skill / power-up levels. T banks the run's crystals (`bankRunCrystals`).
`src/hub.js` is one overlay with three pages: Skill Tree (6), Power-Ups (7), Loadout (9); the start card has a
"Skills & Loadout" button. `logic/skills.js` has the ARC Raiders-style tree: Conditioning / Mobility / Survival, 16 ranked nodes each in six tiers (3 columns, nodes hang off the ones above via `needs`; a tier opens once `TIER_GATES` ranks are spent in that tree; tier 6 is a capstone; a rank costs `TIER_COSTS[tier]`; respec refunds everything). It upgrades max HP, damage, crits, regen, i-frames, hide time, pet damage, wave heal, chest prices, start crystals, revive and the SLOT counts (power-up / pet / ability slots via `items.js`'s `SLOT_LIMITS` / `setSlotBonuses`; abilities 6-7 use keys G and H). Saves from the first tree are refunded and the power-up upgrade rules (levels 1-5, `powerupEffects(ids, levels)`); `main.js`'s
`activeFx` folds power-ups + skills into one effect set. The hub pauses the game.

Skill tree look: `src/skillIcons.js` draws each node as a monochrome SVG line icon chosen by the skill's first `per` field (the `icon` emoji in `logic/skills.js` is no longer shown), with rank pips instead of "0/5". The loadout bar (slots + starting pets) shows on every hub page, not just Loadout.

## Tutorial mode
Press G (or the Tutorial button) on the start card: no waves, god mode, and a card (`src/tutorial.js`) driven by
`src/logic/tutorial.js`'s `TUTORIAL_STEPS`, grouped into `TUTORIAL_CHAPTERS`: Basics (move, sprint, cast, pop a jelly, grab
crystals), Combat tricks (switch weapons, kill chain, hide, ambush, auto-shoot, first person), Gear (free chest, an ability, a
power-up, the Tab menu, fighting with a pet), Enemies (a Mirror, a Bloater, a softened Mega Blobbo boss with one shield) and The
big picture (read-and-Continue cards on waves/score, the hub, and the other places). Each step has a `hint` (how), `touch`, and
`why` (the rule behind it); `target` limits a kill step to one monster type, `desktopOnly` steps are skipped on touch, and the
card has Skip step (`skipTutorialStep`). `main.js`'s `tutorialEvent(type, amount, target)` is fed from the real code paths
(`scoreKill`: kill / bossKill / ambush / chain; `selectWeapon`, `activateAbility`, crystal pickup, power-up pickup,
`toggleMenu`, `setFirstPerson`, the L toggle, the melee ambush hit); `stepTutorial` feeds move / sprint / hide, grants each
step's gear once (sword, Shockwave, Ember) and keeps its targets, pods and pickups around. `freePlay()` is `sandbox || tutorial`
wherever waves are skipped.

## Pet limit and pet upgrades
You carry one pet at a time (`MAX_PETS` and the pet slot limits are 1, so the skill tree's pet-slot skill has no effect). Pets level up (1-5) with banked crystals on the Loadout page's Upgrade buttons (`logic/profile.js`'s `buyPetLevel`, `profile.pets`, cost `PET_UPGRADE_COST` x level). `items.js`'s `petBoost` (+30% power per level: damage, healing, magnet reach, guard reduction) and `petRate` (+8% speed per level) are applied in `pets.js`'s `updatePets` and `petEffects(ids, levels)`.

## New enemies and boss versions
`config.js` adds three regular enemies (weights in `logic/waves.js`): **hopper** (wave 4: a turquoise,
bloater-shaped body with arms and legs, `accessory: 'limbs'`; no melee, its attack is the `leap` special:
crouch, then a ballistic jump onto your spot that lands as a `slam` event, `monster.js`'s `stepBossSpecials`
`air` phase, `leapY` is the height main.js adds to its y), **mirror** (wave 6: a mirror held in front,
`accessory: 'mirror'`, `reflect: { halfArc }`; `logic/reflect.js`'s `isFrontHit` decides if a hit lands on
the mirror: bullets (`bullets.js`) come back as an orb at you, a melee swing (`combat.js`) is blocked and
bites you for `MELEE_REFLECT_DAMAGE`; the shield wears out: `reflect.hits` bounces (4; Sir Reflectalot 6) break it, with a crack added to the glass per hit (`userData.setMirrorCracks`) and `userData.reflect` nulled while broken; Sir Reflectalot's regrows after `reflect.regrow` = 30s (`createShield`/`hitShield`/`stepShield` in `logic/reflect.js`); it turns slowly (`MIRROR_TURN_SCALE`), so hit it from behind) and
**glimmer** (wave 8: blinks next to you, the boss `blink` special on a regular enemy). Regular enemies can
use the boss special machinery through `specials` and `specialIntervals` (per-type cooldown overrides) and
`noMelee`. Every regular enemy also has a boss version in `logic/bosses.js` (Mega Blobbo, Zippy Zoomer,
Grumpus Maximus, Duke Bloatsworth, Spinner Supreme, Splitzilla, Sir Reflectalot, King Hopalot, The Blinkmaster;
16 bosses now, all appear before any repeat); `RANGED_ATTACKS.boss_bloater/boss_spinner` and
`SPLITS.boss_splitter` give them their enemy's signature trick.

## The ten crazy enemies
`src/logic/crazyEnemies.js` (pure data) adds ten regular enemies, each with a CRAZY boss form: **Bumblo** (wings, charges) ->
Queen Bumbletron, **Snapper** (claws, spins) -> King Crabulon, **Sporeling** (mushroom cap; no melee, no specials, no signature: just `RANGED_ATTACKS.sporeling`, a puff of 3 small half-damage orbs) -> Grand Shroombah,
**Boogle** (halo, ghost orbs) -> Phantom Prince, **Kablooma** (lit fuse, leaps) -> Big Kaboom, **Icicle** (ice shards,
slides) -> Blizzard Baron, **Prickle Pete** (spins) -> General Cactus, **Wispy** (flame, blinks) -> Will-o-the-Whimsy,
**Drillbit** (spinning drill, charges) -> Drillzilla, **Twister** (whirling rings, spins) -> Cyclone CEO. A regular one has one
move, its boss form four or five (the existing `BOSS_SPECIALS`, so each boss's set of moves is unique). Each has an `unlock`
wave (3-8): `crazyWeights(n)` folds them into `pickMonsterType` (Orbital Resort and every other place), `world.js`'s biome
tables carry them in the Wilds, and the boss forms join `BOSSES` (also the Wilds' temple guardians). Their add-ons
(`characters.js`: wings, claws, cap, halo, fuse, icicles, flame, horn, rings) animate through `userData.animateAcc(time)`.

## Boss immunity phases
Each time a boss's health first falls to 75%, 50% and 25% (`BOSS_IMMUNITY_THRESHOLDS`, `immunityPhaseReached`) it throws up a glowing
shield bubble (`userData.immune`, honoured by `isUntouchable`, so swings, bullets, pets and abilities all bounce off), calls
`BOSS_IMMUNITY_MINIONS` minions and keeps fighting. The shield drops when they are all beaten or after `BOSS_IMMUNITY_SECONDS`
(16); a toast says "SHIELD DOWN! HIT IT NOW". `main.js`'s `startImmunity` / `stepImmunity`.

## Boss phase two
At half health a boss ENRAGES once (`main.js`, `userData.phase2`): +30% speed, its moves come round 35% sooner, +20% damage, a red
glow and shockwave, and its signature attack fires almost at once.

## New enemies vs a maxed build
The Conditioning tree was cut hard (roughly 40% of the old per-rank values: e.g. +1.2% damage, +3 max HP, 0.8% less damage taken).
The ten new enemies counter strong builds: every hit (melee or signature) carries a status from `crazyEnemies.js`'s `ON_HIT`
(`Player.applyStatus`: poison ticks true damage, slow / stun cut speed, weaken cuts your damage, drain steals crystals), `trueFraction`
(40%, Kablooma 60%) of their damage ignores damage-taken reductions (`Player.damagePlayer`'s third argument), and each spawns with
hp scaled by your damage and attack-speed skills (up to 2.2x).

## Signature attacks
Every boss has one attack nobody else has, and each of the ten new regular enemies a smaller one (`src/logic/signatures.js`, pure
data + geometry; `SIGNATURES` keyed by boss / enemy id, folded into `stats.signature`). Each names itself (`label`, shown as a toast
when a boss winds it up) and picks a pattern kind with its own tuning: `ring`, `spiral`, `rain` (blast zones that mark themselves,
then go off; `around` / `player` / `chase`), `wall` (orbs with a gap), `spokes` (warning lines then beams, optionally a rotated
second volley), `shotgun`, `puddles`, `nova` (expanding rings) and `enrage`. `monster.js` runs the cooldown/wind-up
(`ai.signatureTimer`, `ai.special.name === 'signature'`) and emits `sigWarn` / `signature` events; `main.js`'s `runSignature`
plays the pattern out with a tiny job scheduler (`sigJobs`, ticked by `updateSigJobs`). The new regular enemies also have two moves each.

## Water rooms
Three `LEVELS` carry a `water` block (Pool Room, Pacific Ocean, Glowing Reef Aquarium) and follow bosses like
the other places (also in the sandbox level list). `arena.js` swaps the deck and props for
`src/waterArena.js`'s world: a rolling surface (vertices ride `logic/water.js`'s `waveHeight`, updated through
`updateArena(arena, pos, time)`), a floor `WATER.depth` below, and per-style scenery. There is no edge to fall off:
main.js's `clampToWater` keeps the player and monsters inside the wall / buoy ring, and swimmers (player and
monsters) ride the waves (`waterY`). Swimming has momentum (`stepSwim`, `Player.update`'s `swim` argument) and
hits shove farther (`setKnockbackWorldScale`). Shift (or E with no pod near) dives (`setDiving`): you go
first person (`setFirstPerson`, mouse look, every weapon aims where you look), the fog/background turn to the
room's `under` murk and the sky hides, monsters see you only `WATER.diveSightScale` as far (`player.sightScale`),
shots are slower, and a limited breath (`stepBreath`, `src/waterUi.js`'s BREATH bar) runs down; at zero you are
pushed up with a gasp (`Player.drown`). Surfacing after a real dive starts the ambush window. Esc surfaces too.

## Deep dwellers (water rooms only)
`angler` (a glowing lure), `urchin` (spikes, whirls) and `eel` (fast, dashes) have `deep: true` in `config.js`.
In a water room main.js swaps `DEEP_SPAWN_CHANCE` of each wave's arrivals for one (`logic/enemies.js`'s
`pickDeepType`), and a wave only clears once they're dead. While the player is on the surface `monster.js`'s
`setDeepShield(true)` makes them untouchable (`isUntouchable`: `damageMonster`, melee and bullets all skip them),
blind to you (they count you as hidden) and sunk out of sight; dive and they rise to your depth and fight.
Only deep dwellers ever go under: every other monster stays floating on the surface while you dive
(main.js's `monsterSwimY`). A diver is hidden from and out of reach of every surface monster (`monster.js`'s
`setSurfaceShield`: they lose track and search, their melee, slams/spins, orbs and poison can't hit you). The eel is a jelly-sphere head with a long segmented body, back fin and tail
fin (`characters.js`'s `addEelBody`, `accessory: 'eelBody'`) that ripples in an S-wave (`swishEelTail`).
While you dive, the particle, bullet, enemy-orb and shockwave layers are shifted down with you
(`fxDepthOffset`, x`DIVE_FX_DROP` so shots fly below the first-person eye), and shots/orbs ignore fog while you're under (`setShotFog`).
The BREATH bar warns "SOMETHING LURKS BELOW" while any are alive. On dry rooms (e.g. the sandbox) they are normal enemies.

## Dragons and the Dragon Den
Six dragon pets (`kind: 'breath'` in `logic/items.js`: Cinderwing, Glacier, Stormcaller, Nightshade, Aurelia, Voidmaw) fly
`CRUISE` (3.6) high over the player (`src/dragonModel.js`: horned head, fanged jaw, neck and tail chains, glowing chest
gem, membrane wings that beat harder when moving, orbiting motes) and breathe bolts at enemies from the air. Like a rifle's
scope and ammo, each takes a **scale** (8 mystical colour schemes) and a **breath** (flame splash, frost shove, storm chain,
venom triple-spit, void heavy hit, solar beam), all pure data in `logic/dragons.js` (`tuneDragon` folds the picks into the def,
`breathVictims` finds splash/chain targets). Picks live in the run's dragon state (`game.dragonState`, `setDragonOption`); the hub's Dragon Den page (N)
edits them, and closing the hub re-dresses dragons already out (`main.js`'s `refreshDragons`). Pet levels apply as usual.
Each dragon species also has its own **special ability** (`SPECIALS` in `logic/dragons.js`, effects in `src/dragonSpecials.js`),
fired on a cooldown once an enemy is in range: Cinderwing's Meteor Rain, Glacier's Blizzard, Stormcaller's Thunderstorm,
Nightshade's Toxic Cloud, Aurelia's Aurora Nova (hurts enemies, heals you) and Voidmaw's Void Beam (a charged, huge line of
energy). The special's colour follows the dragon's scale.

## Boss dialogue noises
While a boss's line types out in the intro cutscene, each other letter blips (`logic/bossVoice.js`: a per-boss `BOSS_VOICES`
profile of waveform, base pitch, letter spread, slide, wobble, growl and an eerie extra partial; the letter picks the pitch;
`newestBlip` allows one blip a frame). `sfx.babble` synthesizes it (wobbles via an LFO on the pitch, growl via filtered noise);
the concierge has a soft polite voice and the boss's name slamming on screen plays `bossSlam`. Wired in `main.js`'s `runCutscene`.

Dragons are **per-run finds**: a dragon, and the skins and breaths for it, are lost when the run ends (you can find them again
next run). A dragon is never added to the pet collection or a loadout, and the saved profile holds no dragon data. The run's
`game.dragonState` (`createDragonState`: `unlocked.skins` / `.breaths` plus each dragon's `dragons[id]` picks; sandbox has its own with
everything unlocked) is what `dragonSetup` / `setDragonOption` / `unlockDragonPart` work on. Each dragon always has its own starting
skin and breath; the rest drop from chests (`availableLoot`'s `skin` / `breath` loot, their own rare `dragonpart` category at weight
0.12, about 1 chest in 25) only while a dragon is out. A new one goes straight onto the dragon you have out.

## Shardfall-inspired abilities and graphics style
Four abilities borrowed from the Shardfall game: **Frost Lance** (`frostlance`: a huge piercing bullet with `bullet.freeze`,
applied in `bullets.js`), **Glacial Burst** (`glacier`: freezes everything in a radius), **Time Warp** (`timewarp`:
`monster.js`'s `setTimeWarp` slows every monster's clock to 40%, enemy orbs slow too, you fire 23% faster) and **Whirlwind**
(`whirl`: `main.js`'s `updateWhirlwind` spins you, hits everything close every 0.3s, shreds enemy orbs via
`destroyProjectilesNear`, +30% speed). Frozen monsters do nothing and wear an ice shell (`updateFrozenLook`); bosses are only
slowed (`logic/status.js`: `applyFreeze`, `applySlow`, `statusTimeScale`, which `updateMonster` applies to its `dt`).
The start card's **Graphics** button (`src/graphicsStyle.js`, `localStorage` `slashbattle:graphics`) switches monsters between
the Jelly look and **Realist** (see Realist creatures below). It applies to monsters created after the choice, so pick it before
starting a run. The Wilds always use Realist creatures (`setWildsLook`, set by `createGame`; `useCreatures()` decides).

## Up / down aiming
Bullets are 3D (`logic/bullets.js`: `y`, `vy`, `slope`; `BULLET_START_Y` 0.7 is the muzzle). `main.js`'s `aimSlopeFor` sets
`player.aimSlope` each frame: in first person (0) the shot flies along the crosshair's ray (a small circle at screen centre,
`#fp-crosshair`, converging `FP_CONVERGE` units out), in third person a cursor resting on a monster aims at its middle, otherwise
level. `combat.js`, Frost Lance and Fan Blast use it. A target's `y0..y1` (from `bullets.js`, in the bullet layer's own space) means
a shot aimed over or under a monster misses it; a bullet that sinks below y = 0 is spent.

## Realist creatures
`src/beasts.js` gives every monster type (and every boss) its own creature, built the way Shardfall builds its monsters
but with SlashBattle's own designs: lumpy noise-sculpted blobs (`blob`, normals welded so they're seamless), tapering limbs,
jointed legs, cones, rounded boxes, rings and lathed shapes (robes, caps, flames, funnels, barrels) are baked by `forge()`
into ONE vertex-coloured geometry per type (cached, `geometry.userData.shared`, so `disposeObject3D` leaves it alone).
`createBeastMaterial` is a skin-textured, bump-mapped standard material (Shardfall-style painted skins, `SKINS`: big bold scaly `hide`, `fuzz`, armour-plate `shell`, riveted `metal`, `cloth`; `beastSkin(type)` / `SKIN_OF` picks one, boss forms wear their regular form's; each skin has a full-contrast grey relief map, `paintRelief`, used as the bump map so scale rims, shell grooves, seams and weave are indented like Shardfall's; the material swaps in three r149's world-space bump formula, `BUMP_WORLD`, so the dents don't fade on small, distant creatures) with a fresnel rim, plus vertex attributes the shader
reads: `aGlow` (eyes, blisters, cores, embers glow in their own colour) and `aWig` / `aWigX` (legs step with the walk, driven
by `createBeastAnimator`'s `uWalkT` / `uWalkA` from the monster's real speed; wings, fins, tails, tendrils, flames and orbiting
debris sway on the clock). Every creature looks cross (slit-pupil cream eyes, heavy brows, a toothed maw). Regular monsters'
boss forms reuse their design plus `bossDressing` (red eyes, horns, a spiked ridge); the original seven bosses have their own
(King Gloop's crowned slime, Doctor Wobble's brain in a frame on tentacles, the Cone Father's hooded robe, Madam Mayhem's
scythe arms, Omega Jello's many eyes...). Designs are in unit space (ground at y = -1, front +z) and scaled by size / 2.
Creatures move like Shardfall's (`logic/creatureMotion.js`'s `stepMotion`, driven by `createBeastAnimator`): steps follow the ground actually covered (`legB`, a foot's reach, is read off the geometry), the body bobs per footfall, leans into runs and banks into turns, legless ones crawl with a squash pulse, and idle ones breathe. The body is a **rigid** jelly (`createJellyBody(..., { rigid, baseScale, bob })`): `updateJelly` turns the same hit / inflate
springs into a whole-body squash about the feet instead of per-vertex wobble, and floaters bob. Creatures have no face3d; the
mirror shield is still added (it cracks), the other accessories are part of the creature. `test/beasts.test.js` builds every
type with a stub canvas.

## The Wilds: roads, skystars, day and night, rock
Borrowed from Shardfall's open world. `logic/world.js`: **roads** (`roads()`, `roadPaths()`, `roadDistance`, `onRoad`) wind
from the Sanctum's clearing to every village and on to each village's nearest ruin (noise-bent, a grid index for lookups);
props and grass stay off them, wayside lanterns and fingerposts stand beside them and the odd windmill sits on the verge
(`roadLantern`, `signpost`, `windmill` models). `worldArena.js`'s `createRoads` drapes them as dirt ribbons (fading edges)
over a soft dirt underlay in `groundColorAt`. **Skystars** (`skystars()`): star spirits on the tallest hilltops, each with a
fog-ignoring beam of light; reach one (`main.js`'s `stepSkystars`) for `SKYSTAR_REWARD` crystals; caught ones are saved in
`localStorage` `slashbattle:skystars` (a save key) and shown on the minimap (with the time of day). **Day and night**
(`daylight(t)`, `dayName(t)`, `DAY_SECONDS` 480): the world's update warms / brightens the key light by day and turns it a dim
moonlit blue by night, darkening the fog and sky and bringing out stars and fireflies. The ground turns to bare **rock** on
steep slopes and high ground, with a per-biome cap on the peaks (`ROCK`), and is bump-mapped by its grit texture.

## Shady guests (ideas from Shardfall, reworked)
`src/logic/shadyGuests.js` (pure) adds three regular enemies (in `MONSTER_TYPES` via `SHADY_TYPES`, weights via
`shadyWeights` in `logic/waves.js`), each with a `behavior` that `monster.js`'s `stepShady` runs:
**gopher** (wave 4, `burrow`: `stepBurrow` up -> under -> marked -> erupt -> dazed; while burrowed it is `isUntouchable`,
sunk via `leapY` and passes under the player; `erupt` events hurt within `BURROW.radius` and fling a ring of golf balls;
dazed it takes `dazedDamageMultiplier` damage in `damageMonster`, and a kill then is "Whack-a-Mole"; it doesn't dig in water
rooms), **paparazzo** (wave 5, `snipe`: keeps `SNIPE.keepAway`, `stepSnipe` cool -> aim (laser leads you via `snipeAim`) ->
lock (laser blinks) -> fire; the `snipe` event's flash beam (`beamHits`) also damages every monster in the lane, cause
`photobomb`; its laser is `characters.js`'s `addCameraLaser`, on both looks) and the **Bellhop Bandit** (wave 6, `bandit`: no
damage; in reach it emits `steal` (`stealAmount` of your crystals into `userData.stolen`, sack grows via `setSack`) and flees
(`fleeTarget`) for `BANDIT.fleeTime`, then `escape` removes it with the loot; each non-lethal hit leaks `leakAmount` back
(`leakPending`, dropped by main.js); a kill drops `refundWithTip`, a fall credits it straight back). No boss forms or Wilds
biome entries yet. `test/shadyGuestsSim.test.js` drives all three through the real `updateMonster`.

## Wilds save points (you never really die there)
`src/logic/checkpoint.js` (pure): the Sanctum and every village are save points (`saveSpotAt`). Walking into one saves it
(`main.js`'s `stepWorld`, toast "PROGRESS SAVED"; `slashbattle:checkpoint` is a save key, so it syncs and exports with the rest) and a
new Wilds run starts there. In the Wilds, hitting 0 HP never reaches the game-over screen: `respawnAtCheckpoint` gets you back up at the
last save point (the Sanctum before any) with full HP, `RESPAWN_IFRAMES` of invulnerability, statuses cleared, and everything you carry
kept. Falling off the world respawns you at the save point too (hurt, not healed). The Downed But Determined skill still fires first.

## Bullets keep their launch height
The bullet layer rides the player's jumps and hills (`applyFxDepth`), so `bullets.js` stamps each bullet with the layer height it was
fired at (`layerY`) and draws / hit-tests it at that world height (`localY`); a shot no longer bobs up and down while you jump.

## Heroes and skins
Inspired by Shardfall's roster. `src/logic/heroes.js` (pure) lists 25 heroes (The Guest, Ember Squire, Thorn Warden, Gale
Runner, Prospector Pip, Lifeguard Lou, Bellhop Max, Frost Novice, Star Monk, Storm Acolyte, Bone Caller, DJ Bass Drop, Plague
Doctor, Moon Hunter, Forge Titan, Hex Witch, Echo Twin, Sun Paladin, Void Walker, Clockwork Sage, Chef Flambé (Seconds,
Please: every 6th kill heals 12%), Captain Gully (Broadside: cannon blasts past the target every 9 s, `broadsideSpots`), Rosa
Thornheart (Thorns: a burst around you whenever you're hurt), Shadow Valet (Backstab: +60% on a monster's back or one that
hasn't spotted you, `isBehind`) and Cosmo Nova (Zero-G: +60% knockback, ring-outs score triple)), each
with stat tweaks in the skills effect shape (plus a hero-only `dash` cooldown multiplier), one trait and four skins (body /
cloak / trim / glow colours; the first is free). Heroes and skins are bought with banked crystals and saved in the profile
(`hero`, `heroesOwned`, `heroSkins`, `skinsOwned`; `normalizeHeroFields`). `src/heroGear.js`'s `dressPlayer` recolours the
jelly and builds the gear from primitives (hats, beak mask, capes, halos, horns, wings, lantern...; `mask` hides the face),
and `icons.js`'s `heroIconUrl` renders portraits for the hub's Heroes page (Y, or the start card's button). `main.js`:
`activeFx` folds in `heroEffects`; traits run through `combat.js`'s `setDamageHooks` (damage scaling / on-hit procs,
skipping trait damage itself, cause 'hero') and `stepHeroTraits` (burns, contagion puddles -- a second, monster-only `hazards.js` pool in its own 'plague' style (violet ooze, glowing veins in the skin's glow, a rune rim, rising wisps), `contagionPool`, and a kill in one spawns another -- radiance aura, bramble regen,
molten stacks, gear animation, re-dressing when the pick changes). Trait effects that would re-enter `damageMonster` (Static
Charge arcs, Echo Self repeats, Bass Drop, Bone Burst) are queued in `heroState.pending` and run next frame; `heroRescue` (Rewind,
Rescue Whistle) runs before the revive / game-over checks. Sandbox hero picks are session-only (`sandboxHeroPick`), and only the
Guest gets the jelly movement stretch.

## Speed and rendering (Shardfall comparison)
`PLAYER_SPEED` is 6.5 (zippy 5, so no regular chaser outruns you). The medium preset has bloom off (`bloom` in
`QUALITY_PRESETS`, `?bloom=1` overrides) and the canvas is then antialiased: `composer.render` draws straight to the canvas
whenever GTAO, bloom and the warp pass are all off, and only runs the post chain while a warp zone is live.

## Difficulty and progress
`src/logic/difficulty.js` (pure): `DIFFICULTIES` Relax / Normal / Hard, picked on the start card (`#difficulty-row`) and
remembered by `src/difficulty.js` (`slashbattle:difficulty`, a save key). Normal is all 1s. A mode scales regular monster hp and
speed and boss hp (`spawnMonster`), every hit the player takes (`Player.difficultyDamage`, after armour), wave size and arrival
speed (`waves.js`'s `setWaveTuning`, applied by `main.js`'s `applyDifficulty`), the between-wave heal, score (kills and wave
bonuses) and banked rewards. The sandbox and tutorial always play at Normal (`diff()`). High scores are kept per difficulty
(`highScore.js`: Normal keeps the old key, the others `slashbattle:highscore:<id>`).

`src/logic/progress.js` (pure, saved as `profile.progress`, cleaned by `normalizeProgress`) gives runs a lasting point:
- **Contracts**: three open jobs (`CONTRACT_TEMPLATES`: kills, ring-outs, ambushes, pool kills, pet kills, staff kills, a monster
  type, bosses, chests, crystals, waves cleared, or one-run bests: reach wave N, a xN chain, a score). `progressEvent` advances them
  from run events that `main.js`'s `progressNote` feeds (scoreKill, wave cleared / boss, chest opened, crystals collected); a
  finished one banks crystals (x the difficulty's reward) and a new one is drawn, a tier bigger every 3 done.
- **Hero mastery**: the hero you play earns XP (`XP_PER`: kill 1, wave 6, boss 30), levels 1-10 (`MASTERY_XP`), each paying
  `masteryReward`, with levels 4 / 7 / 10 granting that hero's 2nd / 3rd / 4th skin (`grantSkin`).
- **Records**: runs, kills, bosses, chests, best wave per difficulty.
- **Checkout tip**: at game over (and the labyrinth win) `finishRun` banks `runPayout` (wave, bosses, score, x reward), so every
  run moves you forward even without pressing T. The game-over card shows the tip and the open contracts.
Progress is kept in memory and saved a moment later (`saveProgressSoon`). The hub's Contracts page (I) shows all three parts.
Not counted in the sandbox, the tutorial (`freePlay`); the Wilds feed contracts and mastery but pay no checkout tip.

