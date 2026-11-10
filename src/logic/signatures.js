// Pure data and geometry for every boss's SIGNATURE attack: one move nobody else has. Each boss names its own
// (label), picks a pattern kind and tunes it (counts, speeds, colours, timings), so no two fights feel alike.
// monster.js winds the move up on a timer and emits a 'signature' event; main.js plays the pattern out.
//
// Kinds:
//   ring     - rings of orbs flying out all round: count, rings, twist (turn per ring), stagger (s between rings)
//   spiral   - a rotating stream of orbs: arms, duration, rate (s between volleys), turn (rad/s)
//   rain     - blast zones that mark themselves, then go off: count, delay, radius, mode 'around' | 'player' | 'chase'
//   wall     - a row of orbs sweeping at you with a gap to slip through: count, gap, spacing, sideways
//   spokes   - warning lines that then fire beams from the boss: count, delay, second (a rotated second volley)
//   shotgun  - a dense fan of fast orbs: count, spread, mirror (also fires the opposite way)
//   puddles  - lingering poison pools: count, radius, life, layout 'ring' | 'scatter'
//   nova     - expanding rings you have to hop between: radii, gap
//   enrage   - the boss speeds up for a while: duration, speed

export const SIGNATURES = {
  boss_gloop: { label: 'GOO SPLATS', kind: 'puddles', interval: 9, windup: 0.9, color: 0x8dff7a, count: 6, radius: 2.4, life: 6, layout: 'scatter' },
  boss_zipzilla: { label: 'ZIP-ZAP SPOKES', kind: 'spokes', interval: 9, windup: 0.7, color: 0xcaaced, count: 4, delay: 0.9, second: 0.5, length: 30, width: 1 },
  boss_grumpsalot: { label: 'SHIELD WALL', kind: 'wall', interval: 8.5, windup: 0.9, color: 0xffa070, count: 12, gap: 2, spacing: 1.5, speed: 8 },
  boss_wobble: { label: 'WOBBLE VORTEX', kind: 'spiral', interval: 10, windup: 0.8, color: 0xff7ac8, arms: 3, duration: 3.2, rate: 0.14, speed: 7, turn: 2.2 },
  boss_conefather: { label: 'AN OFFER', kind: 'nova', interval: 10, windup: 1.0, color: 0xffd15c, radii: [4, 8, 12], gap: 0.5 },
  boss_mayhem: { label: 'CHAOS CONFETTI', kind: 'ring', interval: 8, windup: 0.8, color: 0xff5ab4, count: 14, rings: 3, twist: 0.22, stagger: 0.35, speed: 6.5 },
  boss_omega: { label: 'OMEGA COLLAPSE', kind: 'rain', interval: 11, windup: 1.2, color: 0x6dfff0, count: 9, delay: 1.7, radius: 3.4, mode: 'around' },
  boss_blobbo: { label: 'BLOBBO RAGE', kind: 'enrage', interval: 13, windup: 0.7, color: 0xff6a6a, duration: 5, speed: 1.8 },
  boss_zippy: { label: 'ZOOMIES VOLLEY', kind: 'shotgun', interval: 6.5, windup: 0.5, color: 0xffbed0, count: 9, spread: 0.6, speed: 15, mirror: false },
  boss_grumpus: { label: 'GRUMBLE STOMPS', kind: 'rain', interval: 9, windup: 0.8, color: 0xbed1ff, count: 4, delay: 0.8, every: 0.5, radius: 2.8, mode: 'chase' },
  boss_bloater: { label: 'CASSEROLE CARPET', kind: 'puddles', interval: 10, windup: 1.0, color: 0xdff59a, count: 8, radius: 2.2, life: 8, layout: 'ring' },
  boss_spinner: { label: 'DIZZY DISCO', kind: 'spiral', interval: 9.5, windup: 0.7, color: 0xffd699, arms: 5, duration: 2.6, rate: 0.12, speed: 8, turn: 4 },
  boss_splitter: { label: 'TWIN SHOTS', kind: 'shotgun', interval: 7.5, windup: 0.6, color: 0xdcc2ff, count: 6, spread: 0.7, speed: 12, mirror: true },
  boss_mirror: { label: 'REFLECTION RAYS', kind: 'spokes', interval: 11, windup: 0.9, color: 0xe6f0ff, count: 6, delay: 1.3, second: 0.52, length: 34, width: 0.9 },
  boss_hopper: { label: 'HOPSCOTCH', kind: 'rain', interval: 9, windup: 0.6, color: 0x6dffe8, count: 5, delay: 0.7, every: 0.45, radius: 2.8, mode: 'chase' },
  boss_glimmer: { label: 'BLINK BLITZ', kind: 'enrage', interval: 12, windup: 0.5, color: 0xfff1a8, duration: 3.5, speed: 2.4 },
  boss_bumble: { label: 'STINGER STORM', kind: 'spiral', interval: 9, windup: 0.7, color: 0xffd23a, arms: 6, duration: 2.4, rate: 0.1, speed: 9, turn: 5, size: 0.7 },
  boss_snapper: { label: 'SIDEWAYS SNIP', kind: 'wall', interval: 8.5, windup: 0.8, color: 0xff8a6a, count: 9, gap: 1, spacing: 1.2, speed: 10, sideways: true },
  boss_sporeling: { label: 'SPORE CLOUD', kind: 'ring', interval: 9, windup: 0.9, color: 0xff9ad0, count: 20, rings: 1, twist: 0, stagger: 0, speed: 4.5, size: 0.6 },
  boss_boogle: { label: 'POLTERGEIST DROP', kind: 'rain', interval: 10, windup: 0.8, color: 0xdfe6ff, count: 6, delay: 1.2, radius: 2.2, mode: 'around' },
  boss_kablooma: { label: 'BIG BANG', kind: 'nova', interval: 10.5, windup: 1.1, color: 0xff8a3a, radii: [3, 6, 9, 12], gap: 0.35 },
  boss_icicle: { label: 'ICICLE FALL', kind: 'rain', interval: 9.5, windup: 0.8, color: 0x9fe8ff, count: 8, delay: 1.0, radius: 1.8, mode: 'player' },
  boss_prickle: { label: 'NEEDLE NOVA', kind: 'ring', interval: 8.5, windup: 0.8, color: 0xb8ff7a, count: 18, rings: 2, twist: 0.17, stagger: 0.4, speed: 7, size: 0.7 },
  boss_wispy: { label: 'WISP TRAIL', kind: 'spiral', interval: 9.5, windup: 0.7, color: 0xbdf8ff, arms: 1, duration: 4, rate: 0.07, speed: 6, turn: 3 },
  boss_drillbit: { label: 'DRILL SWEEP', kind: 'spokes', interval: 9, windup: 0.8, color: 0xdfe5f2, count: 1, delay: 0.7, second: 0.7, length: 34, width: 1.2 },
  boss_twister: { label: 'TORNADO', kind: 'spiral', interval: 10, windup: 0.9, color: 0xc8c8ff, arms: 4, duration: 3.6, rate: 0.13, speed: 6.5, turn: -3 },
  boss_eel: { label: 'STATIC SHOCK', kind: 'ring', interval: 8, windup: 0.8, color: 0x7cff3a, count: 10, rings: 2, twist: 0.3, stagger: 0.3, speed: 10 },
  boss_angler: { label: 'LUMINA FLARES', kind: 'rain', interval: 10, windup: 0.9, color: 0xfff1a8, count: 5, delay: 1.5, radius: 2.8, mode: 'around' },
  boss_urchin: { label: 'SPINE WALL', kind: 'wall', interval: 9, windup: 0.8, color: 0xdbb8ff, count: 14, gap: 3, spacing: 0.9, speed: 7 },
}

// The ten new regular enemies get a smaller one of their own too (so they are more than one trick each).
Object.assign(SIGNATURES, {
  bumble: { label: 'STINGER BURST', kind: 'ring', interval: 7, windup: 0.6, color: 0xffd23a, damageMultiplier: 0.5, count: 8, rings: 1, twist: 0, stagger: 0, speed: 8, size: 0.6 },
  snapper: { label: 'CLAW CLACK', kind: 'wall', interval: 8, windup: 0.7, color: 0xff8a6a, damageMultiplier: 0.5, count: 5, gap: 1, spacing: 1, speed: 8, sideways: true },
  boogle: { label: 'BOO!', kind: 'rain', interval: 13, windup: 0.9, color: 0xdfe6ff, damageMultiplier: 0.4, count: 1, delay: 0.9, radius: 2.2, mode: 'player' },
  kablooma: { label: 'FUSE POP', kind: 'nova', interval: 8, windup: 0.9, color: 0xff8a3a, damageMultiplier: 0.8, radii: [3, 6], gap: 0.4 },
  icicle: { label: 'ICE VOLLEY', kind: 'shotgun', interval: 6, windup: 0.5, color: 0x9fe8ff, damageMultiplier: 0.5, count: 5, spread: 0.5, speed: 11, mirror: false },
  prickle: { label: 'NEEDLE SPRAY', kind: 'ring', interval: 7.5, windup: 0.7, color: 0xb8ff7a, damageMultiplier: 0.5, count: 12, rings: 1, twist: 0, stagger: 0, speed: 6, size: 0.6 },
  wispy: { label: 'WISP FLICKER', kind: 'spiral', interval: 8, windup: 0.6, color: 0xbdf8ff, damageMultiplier: 0.5, arms: 2, duration: 1.6, rate: 0.12, speed: 6, turn: 3 },
  drillbit: { label: 'DRILL LINE', kind: 'spokes', interval: 8, windup: 0.6, color: 0xdfe5f2, damageMultiplier: 0.7, count: 1, delay: 0.7, second: 0, length: 20, width: 0.8 },
  twister: { label: 'MINI TWISTER', kind: 'spiral', interval: 8, windup: 0.7, color: 0xc8c8ff, damageMultiplier: 0.5, arms: 3, duration: 2, rate: 0.13, speed: 6, turn: -4 },
})

export const signatureFor = (bossId) => (SIGNATURES[bossId] ? { id: `${bossId}:sig`, ...SIGNATURES[bossId] } : null)

// ---- pure geometry the runner uses ----

// Evenly spaced launch angles round a full circle (rad), starting at `offset`.
export const ringAngles = (count, offset = 0) => Array.from({ length: count }, (_, i) => offset + (i / count) * Math.PI * 2)

// Orbs for a wall: positions across the line perpendicular to `aim`, one velocity each, with a gap `gap` wide whose
// centre sits at `gapAt` (a fraction 0-1 of the wall's width).
export function wallOrbs({ x, z, aim, count, spacing, speed, gap, gapAt }) {
  const orbs = []
  const half = ((count - 1) * spacing) / 2
  const gapCentre = -half + gapAt * (count - 1) * spacing
  for (let i = 0; i < count; i++) {
    const offset = -half + i * spacing
    if (Math.abs(offset - gapCentre) < gap) continue
    orbs.push({
      x: x + Math.cos(aim) * offset + Math.sin(aim) * 1.8,
      z: z - Math.sin(aim) * offset + Math.cos(aim) * 1.8,
      vx: Math.sin(aim) * speed,
      vz: Math.cos(aim) * speed,
    })
  }
  return orbs
}

// Where the blast zones of a rain go. `around`: scattered within 9 of the player; `player`: tight on the player;
// `chase`: not decided here (each lands on wherever the player is when its turn comes).
export function rainZones(mode, count, player, rng = Math.random) {
  if (mode === 'chase') return []
  const spread = mode === 'player' ? 3 : 9
  return Array.from({ length: count }, () => {
    const a = rng() * Math.PI * 2
    const d = Math.sqrt(rng()) * spread
    return { x: player.x + Math.cos(a) * d, z: player.z + Math.sin(a) * d }
  })
}

// Pool targets for a puddle attack: on a ring round the boss, or scattered round the player.
export function puddleTargets(layout, count, boss, player, rng = Math.random) {
  return Array.from({ length: count }, (_, i) => {
    if (layout === 'ring') {
      const a = (i / count) * Math.PI * 2
      const d = 5 + (i % 2) * 3.5
      return { x: boss.x + Math.cos(a) * d, z: boss.z + Math.sin(a) * d }
    }
    const a = rng() * Math.PI * 2
    const d = 2 + rng() * 6
    return { x: player.x + Math.cos(a) * d, z: player.z + Math.sin(a) * d }
  })
}

// Does a point lie on a beam from (x, z) along `aim`?
export function onBeam(point, { x, z, aim, length, width }) {
  const px = point.x - x
  const pz = point.z - z
  const along = px * Math.sin(aim) + pz * Math.cos(aim)
  const across = Math.abs(px * Math.cos(aim) - pz * Math.sin(aim))
  return along > 0 && along < length && across <= width + 0.6
}

// Is a point inside the band of an expanding ring (`radius`, half-thickness `band`) centred at (x, z)?
export const inRingBand = (point, x, z, radius, band = 1.6) => Math.abs(Math.hypot(point.x - x, point.z - z) - radius) <= band
