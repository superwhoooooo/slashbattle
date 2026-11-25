// The storm colosseums' champions each fight their own way (Tears of the Kingdom-style "puzzle" bosses): a ward that ordinary
// blows bounce off, a trick in the arena that breaks it, and a short window when the champion reels and takes heavy damage.
// Then the ward comes back and you do it again, a little harder once it's below half.
//   Sultan Sirocco  -- SAND VEIL: stand on each of the three SUN MIRRORS to swing its light onto him; all three burn the veil away.
//                      Below half, lit mirrors dim again if you dawdle, and every re-veil throws up sand mirages.
//   Queen Rimefang  -- ICE ARMOUR: lure her into a burning brazier's fire to melt it (the brazier gutters out for a while).
//                      The arena's cold creeps into you away from the fires, and her drawn-out FROST BREATH can only be
//                      weathered by a fire.
//   The Cinder Tyrant -- OBSIDIAN SHELL: he lobs cinder bombs at you; run into a fizzing one to kick it back at him before it
//                      blows. Three cracks shatter the shell.
//   Mother Miasma   -- ROOT WARD: rot pods round the arena feed her (she heals while any lives); burst them all and she wilts.
// Pure rules (no Three); main.js's stepChampionFights applies the events, src/championFx.js draws it all.
// Tests: test/championFights.test.js.

const TAU = Math.PI * 2

export const FIGHT_START_RADIUS = 17 // walk this far into the arena and the champion wakes (the gate seals behind you)
export const EXPOSED_DAMAGE = 2.5 // a reeling champion takes this much from every hit
export const ARENA_KEEP = 21 // the champion never leaves this circle of the arena's middle

export const FIGHTS = {
  boss_sirocco: {
    kind: 'mirrors', ward: 'SAND VEIL', color: 0xffd98a,
    count: 3, ring: 15, pad: 2.4, turn: 1.0, dim: 11, open: 8, stagger: 8, mirage: 3,
    hint: 'HIS SAND VEIL TURNS EVERY BLOW. STAND ON EACH SUN MIRROR TO SWING ITS LIGHT ONTO HIM',
    broken: 'THE SUN BURNS THE VEIL AWAY! STRIKE NOW',
  },
  boss_rime: {
    kind: 'braziers', ward: 'ICE ARMOUR', color: 0xcfeaff,
    count: 4, ring: 15, warm: 4.2, melt: 1.6, open: 8, stagger: 3.5, relight: 16,
    breathEvery: 10, breathWarn: 1.8, breathRange: 24, breathArc: 0.55, breathDamage: 30,
    coldUp: 1 / 18, coldDown: 0.5, chillEvery: 1, chillDamage: 5,
    hint: 'HER ICE ARMOUR SHRUGS OFF BLOWS. LURE HER INTO A BRAZIER\'S FIRE TO MELT IT. KEEP WARM BY THE FIRES',
    broken: 'THE FIRE MELTS HER ARMOUR! STRIKE NOW',
  },
  boss_cinder: {
    kind: 'bombs', ward: 'OBSIDIAN SHELL', color: 0xff7a3a,
    throwEvery: 4.2, flight: 1.1, fuse: 4.5, kick: 1.9, blast: 4.4, blastDamage: 26, speed: 17, cracks: 3, maxBombs: 3, open: 8, stagger: 5,
    hint: 'HIS OBSIDIAN SHELL IS TOO HARD TO HURT. RUN INTO HIS CINDER BOMBS TO KICK THEM BACK AT HIM',
    broken: 'THE SHELL SHATTERS! HIS CORE IS BARE, STRIKE NOW',
  },
  boss_mire: {
    kind: 'pods', ward: 'ROOT WARD', color: 0xb8ff8a,
    pods: [3, 4, 5], ring: 13, open: 9, stagger: 9, regen: 0.004, grace: 1.5,
    hint: 'HER ROOT WARD DRINKS FROM THE ROT PODS, AND SHE HEALS WHILE ANY LIVES. BURST EVERY POD',
    broken: 'THE LAST POD BURSTS AND SHE WILTS! STRIKE NOW',
  },
}

// The arena-side props of the fight: a rot pod is a real monster (so every weapon pops it); bombs, mirrors and braziers are not.
export const CHAMPION_PROP_TYPES = {
  rot_pod: { shape: 'sphere', size: 1.8, color: 0x5f7f34, edgeColor: 0xd8ff8a, speed: 0.01, hp: 110, damage: 1, radius: 0.8, noMelee: true },
}

export const fightFor = (bossId) => FIGHTS[bossId] ?? null
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z)

// Where the fight's arena pieces stand: evenly round the middle, never in front of the gate.
export function arenaSpots(c, n, ring) {
  return Array.from({ length: n }, (_, i) => {
    const a = c.gate + ((i + 0.5) / n) * TAU
    return { x: c.x + Math.cos(a) * ring, z: c.z + Math.sin(a) * ring, angle: a }
  })
}

export function createFight(bossId, c) {
  const def = fightFor(bossId)
  if (!def) return null
  const s = { bossId, def, kind: def.kind, cx: c.x, cz: c.z, gate: c.gate, active: false, exposed: false, until: 0, staggerUntil: 0, round: 0 }
  if (def.kind === 'mirrors') s.mirrors = arenaSpots(c, def.count, def.ring).map((p) => ({ ...p, lit: false, charge: 0, litAt: 0 }))
  if (def.kind === 'braziers') {
    s.braziers = arenaSpots(c, def.count, def.ring).map((p) => ({ ...p, lit: true, outUntil: 0 }))
    s.melt = 0
    s.cold = 0
    s.chillAt = 0
    s.breathAt = 0
    s.breath = null
  }
  if (def.kind === 'bombs') {
    s.bombs = []
    s.cracks = 0
    s.throwAt = 0
    s.nextBomb = 1
  }
  if (def.kind === 'pods') {
    s.planted = false
    s.plantedAt = 0
  }
  return s
}

// Is (x, z) warm: within a lit brazier's fire?
export function isWarm(s, x, z) {
  return (s.braziers ?? []).some((b) => b.lit && Math.hypot(b.x - x, b.z - z) < s.def.warm)
}
// Is a point inside a breath cone from (x, z) toward `angle`?
export function inCone(from, angle, range, arc, p) {
  const d = Math.hypot(p.x - from.x, p.z - from.z)
  if (d > range) return false
  if (d < 1.5) return true
  const off = Math.atan2(p.z - from.z, p.x - from.x) - angle
  return Math.abs(Math.atan2(Math.sin(off), Math.cos(off))) < arc
}

function expose(s, now, ev) {
  s.exposed = true
  s.until = now + s.def.open
  s.staggerUntil = now + s.def.stagger
  ev.push({ type: 'expose' })
}

function podSpots(s, n, rng) {
  const c = { x: s.cx, z: s.cz, gate: s.gate + (rng() - 0.5) * 0.6 }
  return arenaSpots(c, n, s.def.ring + (rng() - 0.5) * 3).map((p) => ({ x: p.x, z: p.z }))
}
function plant(s, now, rng, ev) {
  const n = s.def.pods[Math.min(s.round, s.def.pods.length - 1)]
  s.planted = true
  s.plantedAt = now
  ev.push({ type: 'plant', spots: podSpots(s, n, rng) })
}

// One frame of the fight. input: { dt, now, player: {x, z}, boss: {x, z, radius}, hpFrac, podsAlive, rng }.
// Returns the events main.js acts on (and mutates `s`).
export function stepFight(s, { dt, now, player, boss, hpFrac = 1, podsAlive = 0, rng = Math.random }) {
  const ev = []
  const def = s.def
  const hard = hpFrac < 0.5
  if (!s.active) {
    if (Math.hypot(player.x - s.cx, player.z - s.cz) > FIGHT_START_RADIUS) return ev
    s.active = true
    ev.push({ type: 'begin' })
    if (s.kind === 'pods') plant(s, now, rng, ev)
    if (s.kind === 'braziers') s.breathAt = now + def.breathEvery * 0.6
    if (s.kind === 'bombs') s.throwAt = now + 1.5
  }

  // The window closes: the ward comes back, and the arena resets for another go.
  if (s.exposed && now >= s.until) {
    s.exposed = false
    s.round++
    ev.push({ type: 'cover' })
    if (s.kind === 'mirrors') {
      for (const m of s.mirrors) Object.assign(m, { lit: false, charge: 0 })
      if (hard) ev.push({ type: 'mirage', count: def.mirage })
    }
    if (s.kind === 'braziers') s.melt = 0
    if (s.kind === 'bombs') {
      s.cracks = 0
      s.throwAt = now + 1.2
    }
    if (s.kind === 'pods') plant(s, now, rng, ev)
  }

  if (s.kind === 'mirrors' && !s.exposed) {
    for (const [i, m] of s.mirrors.entries()) {
      if (m.lit) {
        if (hard && now - m.litAt > def.dim) {
          m.lit = false
          m.charge = 0
          ev.push({ type: 'mirrorDim', index: i })
        }
        continue
      }
      if (dist(player, m) < def.pad) {
        m.charge += dt
        if (m.charge >= def.turn) {
          m.lit = true
          m.litAt = now
          ev.push({ type: 'mirrorLit', index: i, lit: s.mirrors.filter((k) => k.lit).length })
        }
      } else m.charge = Math.max(0, m.charge - dt * 0.5)
    }
    if (s.mirrors.every((m) => m.lit)) expose(s, now, ev)
  }

  if (s.kind === 'braziers') {
    for (const [i, b] of s.braziers.entries()) {
      if (!b.lit && now >= b.outUntil) {
        b.lit = true
        ev.push({ type: 'brazierLit', index: i })
      }
    }
    // The cold: it creeps in away from the fires and bites once it's full.
    const warm = isWarm(s, player.x, player.z)
    s.cold = Math.max(0, Math.min(1, s.cold + (warm ? -def.coldDown : def.coldUp) * dt))
    if (s.cold >= 1 && now >= s.chillAt) {
      s.chillAt = now + def.chillEvery
      ev.push({ type: 'chill', damage: def.chillDamage })
    }
    // Melting: she has to stand in a lit brazier's fire for a moment.
    if (!s.exposed) {
      const fire = s.braziers.find((b) => b.lit && dist(boss, b) < def.warm + boss.radius * 0.5)
      if (fire) {
        s.melt += dt
        if (s.melt >= def.melt) {
          s.melt = 0
          fire.lit = false
          fire.outUntil = now + def.relight
          ev.push({ type: 'brazierOut', index: s.braziers.indexOf(fire) })
          expose(s, now, ev)
        }
      } else s.melt = Math.max(0, s.melt - dt * 0.5)
    }
    // Her frost breath: a long, loud wind-up toward where you stood, then a wide cone; only a fire keeps you safe.
    if (s.breath && now >= s.breath.at) {
      const b = s.breath
      s.breath = null
      ev.push({ type: 'breath', x: b.x, z: b.z, angle: b.angle, range: def.breathRange, arc: def.breathArc, damage: def.breathDamage, hit: inCone(b, b.angle, def.breathRange, def.breathArc, player) && !isWarm(s, player.x, player.z) })
    } else if (!s.breath && now >= s.breathAt && now >= s.staggerUntil) {
      s.breath = { x: boss.x, z: boss.z, angle: Math.atan2(player.z - boss.z, player.x - boss.x), at: now + def.breathWarn }
      s.breathAt = now + def.breathEvery * (hard ? 0.7 : 1)
      ev.push({ type: 'breathWarn', x: boss.x, z: boss.z, angle: s.breath.angle, range: def.breathRange, arc: def.breathArc, secs: def.breathWarn })
    }
  }

  if (s.kind === 'bombs') {
    if (!s.exposed && now >= s.throwAt && s.bombs.length < def.maxBombs && now >= s.staggerUntil) {
      s.throwAt = now + def.throwEvery * (hard ? 0.7 : 1)
      const a = rng() * TAU
      const r = def.kick + 0.4 + rng() * 2 // a step away: you have to go and kick it (and it still catches you standing about)
      let x = player.x + Math.cos(a) * r
      let z = player.z + Math.sin(a) * r
      const off = Math.hypot(x - s.cx, z - s.cz)
      if (off > ARENA_KEEP) {
        x = s.cx + ((x - s.cx) / off) * ARENA_KEEP
        z = s.cz + ((z - s.cz) / off) * ARENA_KEEP
      }
      const bomb = { id: s.nextBomb++, fromX: boss.x, fromZ: boss.z, x, z, phase: 'air', t0: now, fuseAt: now + def.flight + def.fuse }
      s.bombs.push(bomb)
      ev.push({ type: 'throw', bomb })
    }
    for (const b of [...s.bombs]) {
      if (b.phase === 'air') {
        if (now >= b.t0 + def.flight) {
          b.phase = 'fizz'
          ev.push({ type: 'land', bomb: b })
        }
      } else if (b.phase === 'fizz') {
        if (dist(player, b) < def.kick) {
          b.phase = 'kicked'
          ev.push({ type: 'kick', bomb: b })
        } else if (now >= b.fuseAt) {
          s.bombs.splice(s.bombs.indexOf(b), 1)
          ev.push({ type: 'blast', bomb: b, radius: def.blast, damage: def.blastDamage, hit: dist(player, b) < def.blast })
        }
      } else if (b.phase === 'kicked') {
        const d = dist(boss, b)
        const step = def.speed * dt
        if (d <= boss.radius + 0.8 + step) {
          s.bombs.splice(s.bombs.indexOf(b), 1)
          if (s.exposed) continue
          s.cracks++
          ev.push({ type: 'crack', bomb: b, cracks: s.cracks, need: def.cracks })
          if (s.cracks >= def.cracks) {
            for (const o of s.bombs) ev.push({ type: 'fizzle', bomb: o })
            s.bombs = []
            expose(s, now, ev)
          }
        } else {
          b.x += ((boss.x - b.x) / d) * step
          b.z += ((boss.z - b.z) / d) * step
        }
      }
    }
  }

  if (s.kind === 'pods' && !s.exposed && s.planted && now - s.plantedAt > def.grace && podsAlive === 0) {
    s.planted = false
    expose(s, now, ev)
  }
  return ev
}

// The fight's chip: what the ward is and how close you are to breaking it.
export function fightStatus(s, now, podsAlive = 0) {
  if (!s?.active) return null
  const def = s.def
  if (s.exposed) return `<b>${def.ward} BROKEN</b> strike now! ${Math.max(0, Math.ceil(s.until - now))}s`
  if (s.kind === 'mirrors') return `<b>${def.ward}</b> sun mirrors lit ${s.mirrors.filter((m) => m.lit).length}/${s.mirrors.length}`
  if (s.kind === 'braziers') return `<b>${def.ward}</b> lure her into a fire${s.melt > 0 ? ` · melting ${Math.round((s.melt / def.melt) * 100)}%` : ''} · cold ${Math.round(s.cold * 100)}%`
  if (s.kind === 'bombs') return `<b>${def.ward}</b> kick his bombs back · cracks ${s.cracks}/${def.cracks}`
  return `<b>${def.ward}</b> rot pods left ${podsAlive}`
}

// Keep the champion inside its arena (it never wanders out through the gate).
export function keepInArena(s, x, z, radius = 0) {
  const lim = ARENA_KEEP - radius
  const d = Math.hypot(x - s.cx, z - s.cz)
  if (d <= lim) return null
  return { x: s.cx + ((x - s.cx) / d) * lim, z: s.cz + ((z - s.cz) / d) * lim }
}
