// The look of the regional phenomena (rules in logic/phenomena.js, wired by main.js's stepPhenomena): a swirling storm wall
// and an eye beam over each of the four storms, stage markers (stones, ritual rings, gates, the seek beacon) and the
// hazard zones (ember warning rings, poison clouds). Everything is world-space, added to the arena group.
import * as THREE from 'three'
import { PHENOMENON_LIST, PHENOMENON_RADIUS, phenomenonEye } from './logic/phenomena.js'
import { heightAt, withSurface } from './logic/world.js'
import { STORM_PAD_RADIUS, deepTemples, skyTemples, templePlace } from './logic/stormTemples.js'

const WALL_HEIGHT = 220

// Soft vertical streaks (alpha only) that make an open cylinder read as a wall of blown dust, snow, ash or spores.
function streakTexture(seed) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  let s = seed
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, 256, 128)
  for (let i = 0; i < 90; i++) {
    const x = rand() * 256
    const w = 2 + rand() * 12
    const grad = ctx.createLinearGradient(0, 0, 0, 128)
    const a = 0.25 + rand() * 0.6
    grad.addColorStop(0, 'rgba(255,255,255,0)')
    grad.addColorStop(0.35 + rand() * 0.3, `rgba(255,255,255,${a})`)
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = grad
    ctx.fillRect(x, 0, w, 128)
    ctx.fillRect(x - 256, 0, w, 128)
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  tex.repeat.set(3, 1)
  return tex
}

const additive = (color, opacity, map = null) => new THREE.MeshBasicMaterial({ color, map, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false })

function makeStorm(ph, index) {
  const eye = phenomenonEye(ph.id)
  const g = new THREE.Group()
  g.position.set(eye.x, eye.y, eye.z)
  const walls = []
  for (let i = 0; i < 3; i++) {
    const r = PHENOMENON_RADIUS * (1 - i * 0.045)
    const mat = additive(ph.color, 0.34 - i * 0.07, streakTexture(1000 + index * 17 + i * 5))
    mat.alphaMap = mat.map
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.06, r, WALL_HEIGHT, 48, 1, true), mat)
    wall.position.y = WALL_HEIGHT / 2 - 4
    wall.userData.spin = (i % 2 ? -1 : 1) * (0.12 + i * 0.05)
    wall.userData.scroll = (i % 2 ? -1 : 1) * (0.05 + i * 0.03)
    walls.push(wall)
    g.add(wall)
  }
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 6.5, 260, 16, 1, true), additive(ph.glow, 0.22))
  beam.position.y = 120
  g.add(beam)
  const ring = new THREE.Mesh(new THREE.RingGeometry(PHENOMENON_RADIUS * 0.96, PHENOMENON_RADIUS * 1.02, 72), additive(ph.glow, 0.5))
  ring.rotation.x = -Math.PI / 2
  ring.position.y = 0.5
  g.add(ring)
  g.userData = { walls, beam, ring, ph }
  return g
}


// The heart of a storm: a dark, cracked crystal wrapped in the storm's light, spinning in rings. It is what the storm turns
// round; calm the storm and it is gone, leaving a soft pillar of clear light.
function makeHeart(ph, scale = 1) {
  const heart = new THREE.Group()
  heart.scale.setScalar(scale)
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(1.3), new THREE.MeshStandardMaterial({ color: 0x1a1424, emissive: ph.glow, emissiveIntensity: 0.35, roughness: 0.3, metalness: 0.4, flatShading: true }))
  core.scale.set(1, 1.6, 1)
  const aura = new THREE.Mesh(new THREE.OctahedronGeometry(1.7), additive(ph.glow, 0.35))
  aura.scale.set(1, 1.6, 1)
  const rings = [0, 1, 2].map((i) => {
    const r = new THREE.Mesh(new THREE.TorusGeometry(2.4 + i * 0.7, 0.07, 6, 40), additive(ph.color, 0.8))
    r.rotation.set(Math.PI / 2 + i * 0.6, i * 0.9, 0)
    heart.add(r)
    return r
  })
  heart.add(core, aura)
  const calm = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.6, 60, 12, 1, true), additive(0xffffff, 0.25))
  calm.position.y = 26
  calm.visible = false
  heart.userData = { core, aura, rings, calm, baseY: 0 }
  return { heart, calm }
}
function animateHeart(h, now, calmed) {
  const u = h.heart.userData
  h.heart.visible = !calmed
  h.calm.visible = calmed
  if (calmed) {
    h.calm.material.opacity = 0.18 + Math.sin(now * 2) * 0.06
    return
  }
  h.heart.position.y = u.baseY + Math.sin(now * 1.3) * 0.4
  u.core.rotation.y = now * 0.6
  u.aura.rotation.y = -now * 0.9
  u.aura.material.opacity = 0.25 + Math.sin(now * 4) * 0.12
  u.rings.forEach((r, i) => (r.rotation.z = now * (0.8 + i * 0.4) * (i % 2 ? -1 : 1)))
}

// A temple: a floor, a ring of columns (some broken), braziers that light once the storm is calm, maybe an altar + heart.
// `lift(x, z)` gives the ground under a point (relative to the group). Returns the parts to animate.
function templeRing(g, ph, { stone, dark, floor = true, radius = 14, cols = 10, tall = 8.5, altar = true, lift = () => 0 }) {
  if (floor) {
    const f = new THREE.Mesh(new THREE.CylinderGeometry(radius + 1, radius + 2, 0.7, 28), dark)
    f.position.y = 0.1
    g.add(f)
    const rune = new THREE.Mesh(new THREE.RingGeometry(radius * 0.64, radius * 0.69, 48), new THREE.MeshBasicMaterial({ color: ph.glow, transparent: true, opacity: 0.55, side: THREE.DoubleSide, fog: false }))
    rune.rotation.x = -Math.PI / 2
    rune.position.y = 0.5
    g.add(rune)
  }
  for (let i = 0; i < cols; i++) {
    const a = (i / cols) * Math.PI * 2
    const x = Math.cos(a) * radius
    const z = Math.sin(a) * radius
    const broken = i % 3 === 1
    const h = broken ? tall * 0.4 + (i % 4) : tall
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.9, h, 8), stone)
    col.position.set(x, lift(x, z) + h / 2, z)
    col.rotation.z = broken ? ((i % 2) - 0.5) * 0.12 : 0
    g.add(col)
    if (!broken) {
      const cap = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.7, 2.1), stone)
      cap.position.set(x, lift(x, z) + h + 0.3, z)
      g.add(cap)
    }
  }
  if (altar) {
    const a = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.1, 1.6, 8), stone)
    a.position.y = 1.1
    g.add(a)
  }
  const flames = []
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4
    const x = Math.cos(a) * radius * 0.54
    const z = Math.sin(a) * radius * 0.54
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.45, 0.8, 8), dark)
    bowl.position.set(x, lift(x, z) + 1.2, z)
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 1.2, 6), stone)
    post.position.set(x, lift(x, z) + 0.6, z)
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.6, 2.2, 8, 1, true), additive(ph.glow, 0.85))
    flame.position.set(x, lift(x, z) + 2.5, z)
    flame.visible = false
    g.add(bowl, post, flame)
    flames.push(flame)
  }
  return flames
}

// At the storm's eye on the surface: a great ruined ring. For a sky temple, a storm pad glows in its middle (it throws you
// up); for a Depths temple, the floor is gone and a pit drops away (the chasm is drawn by depthsFx.js).
function makeTemple(ph) {
  const eye = phenomenonEye(ph.id)
  const place = templePlace(ph.id)
  const g = new THREE.Group()
  g.position.set(eye.x, eye.y, eye.z)
  g.scale.setScalar(2.4) // a massive ruin, visible from afar
  const stone = new THREE.MeshStandardMaterial({ color: 0x8a8498, roughness: 0.85, flatShading: true })
  const dark = new THREE.MeshStandardMaterial({ color: 0x4a4658, roughness: 0.9, flatShading: true })
  const lift = (x, z) => (heightAt(eye.x + x * 2.4, eye.z + z * 2.4) - eye.y) / 2.4
  const flames = templeRing(g, ph, { stone, dark, floor: place === 'sky', altar: false, lift })
  const parts = { flames }
  if (place === 'sky') { // the storm pad: a glowing disc and a column of rising light
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(STORM_PAD_RADIUS / 2.4, STORM_PAD_RADIUS / 2.4 + 0.2, 0.3, 24), new THREE.MeshBasicMaterial({ color: ph.glow, fog: false }))
    pad.position.y = 0.55
    const lift2 = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 40, 16, 1, true), additive(ph.glow, 0.22))
    lift2.position.y = 20
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.08, 6, 32), additive(ph.glow, 0.9))
    ring.rotation.x = Math.PI / 2
    ring.position.y = 0.8
    g.add(pad, lift2, ring)
    Object.assign(parts, { pad, lift: lift2, padRing: ring })
  }
  g.userData = parts
  return g
}

// A sky temple: a floating rock with a temple on top -- columns, arches of light, the altar and the storm's heart.
function makeSkyTemple(t, ph) {
  const g = new THREE.Group()
  g.position.set(t.x, t.y, t.z)
  const rock = new THREE.MeshStandardMaterial({ color: 0x6a6478, roughness: 0.95, flatShading: true })
  const stone = new THREE.MeshStandardMaterial({ color: 0xe8e4f0, roughness: 0.75, flatShading: true })
  const dark = new THREE.MeshStandardMaterial({ color: 0x8a8498, roughness: 0.85, flatShading: true })
  const under = new THREE.Mesh(new THREE.ConeGeometry(t.radius, t.depth, 12), rock)
  under.rotation.x = Math.PI
  under.position.y = -t.depth / 2 - 0.4
  g.add(under)
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2
    const lump = new THREE.Mesh(new THREE.DodecahedronGeometry(5 + (i % 3) * 2), rock)
    lump.position.set(Math.cos(a) * t.radius * 0.6, -6 - (i % 2) * 5, Math.sin(a) * t.radius * 0.6)
    g.add(lump)
  }
  const top = new THREE.Mesh(new THREE.CylinderGeometry(t.radius, t.radius * 0.96, 0.8, 24), new THREE.MeshStandardMaterial({ color: ph.id === 'whiteout' ? 0xeef6ff : 0x5a8a5a, roughness: 0.9, flatShading: true }))
  top.position.y = -0.4
  g.add(top)
  const flames = templeRing(g, ph, { stone, dark, radius: 15, cols: 12, tall: 10 })
  // Arches of light over the four ways in.
  for (let i = 0; i < 4; i++) {
    const arch = new THREE.Mesh(new THREE.TorusGeometry(4, 0.25, 6, 24, Math.PI), additive(ph.glow, 0.7))
    const a = (i / 4) * Math.PI * 2
    arch.position.set(Math.cos(a) * 19, 0, Math.sin(a) * 19)
    arch.rotation.y = -a + Math.PI / 2
    g.add(arch)
  }
  // Banners on tall poles round the edge.
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.2
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 7, 5), dark)
    pole.position.set(Math.cos(a) * 21.5, 3.5, Math.sin(a) * 21.5)
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 3), new THREE.MeshStandardMaterial({ color: ph.color, side: THREE.DoubleSide, roughness: 0.8 }))
    flag.position.set(Math.cos(a) * 21.5 + 0.75, 5.2, Math.sin(a) * 21.5)
    g.add(pole, flag)
  }
  const h = makeHeart(ph, 1.2)
  h.heart.userData.baseY = 5
  g.add(h.heart, h.calm)
  g.userData = { flames, heart: h }
  return g
}

// A sunken temple in the Depths: a deep stepped floor, tall dark pillars with glowing seams, and the storm's heart.
// (The hall's walls are a world prop, `deepTemple`; this is what glows and moves.)
function makeDeepTemple(t, ph) {
  const g = new THREE.Group()
  g.position.set(t.x, 0, t.z)
  const lit = additive(ph.glow, 0.6)
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(6 + i * 7, 6.4 + i * 7, 56), lit)
    ring.rotation.x = -Math.PI / 2
    ring.position.y = 0.4
    g.add(ring)
  }
  const h = makeHeart(ph, 1.4)
  h.heart.userData.baseY = 6
  g.add(h.heart, h.calm)
  const glowBeam = new THREE.Mesh(new THREE.CylinderGeometry(2, 3.5, 70, 14, 1, true), additive(ph.glow, 0.14))
  glowBeam.position.y = 35
  g.add(glowBeam)
  g.userData = { heart: h, t, beam: glowBeam }
  return g
}

function markerMesh(kind, color, radius) {
  const g = new THREE.Group()
  if (kind === 'stone') {
    g.add(new THREE.Mesh(new THREE.OctahedronGeometry(0.6), new THREE.MeshBasicMaterial({ color, fog: false })))
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.06, 6, 28), additive(color, 0.9))
    ring.rotation.x = Math.PI / 2
    g.add(ring)
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 26, 6, 1, true), additive(color, 0.35))
    beam.position.y = 12
    g.add(beam)
    g.userData = { spin: g.children[0], ring, beam, float: 1.3 }
  } else if (kind === 'seek') {
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.4, 90, 10, 1, true), additive(color, 0.3))
    beam.position.y = 44
    const ring = new THREE.Mesh(new THREE.RingGeometry(radius * 0.8, radius, 40), additive(color, 0.6))
    ring.rotation.x = -Math.PI / 2
    ring.position.y = 0.3
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.9), new THREE.MeshBasicMaterial({ color, fog: false }))
    g.add(beam, ring, gem)
    g.userData = { spin: gem, ring, beam, float: 2.4 }
  } else if (kind === 'hold') {
    const base = new THREE.Mesh(new THREE.RingGeometry(radius * 0.94, radius, 56), additive(color, 0.75))
    base.rotation.x = -Math.PI / 2
    base.position.y = 0.3
    const fill = new THREE.Mesh(new THREE.CircleGeometry(radius * 0.94, 48), additive(color, 0.2))
    fill.rotation.x = -Math.PI / 2
    fill.position.y = 0.25
    const flame = new THREE.Mesh(new THREE.ConeGeometry(radius * 0.35, 6, 10, 1, true), additive(color, 0.5))
    flame.position.y = 3
    const pillars = []
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.34, 3.2, 6), new THREE.MeshBasicMaterial({ color, fog: false }))
      p.position.set(Math.cos(a) * radius, 1.6, Math.sin(a) * radius)
      pillars.push(p)
      g.add(p)
    }
    g.add(base, fill, flame)
    g.userData = { base, fill, flame, pillars, radius }
  } else if (kind === 'gate') {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.8, 0.28, 8, 32), additive(color, 0.95))
    ring.position.y = radius * 0.85
    const glow = new THREE.Mesh(new THREE.CircleGeometry(radius * 0.8, 24), additive(color, 0.14))
    glow.position.y = radius * 0.85
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 40, 6, 1, true), additive(color, 0.25))
    beam.position.y = 20
    g.add(ring, glow, beam)
    g.userData = { ring, glow, beam }
  }
  return g
}

// Hazard zones: a ground ring that fills as the strike nears (ember), or a lingering cloud (spores).
function zoneMesh(color, radius) {
  const g = new THREE.Group()
  const ring = new THREE.Mesh(new THREE.RingGeometry(radius * 0.92, radius, 40), additive(color, 0.9))
  ring.rotation.x = -Math.PI / 2
  ring.position.y = 0.35
  const fill = new THREE.Mesh(new THREE.CircleGeometry(radius * 0.92, 32), additive(color, 0.25))
  fill.rotation.x = -Math.PI / 2
  fill.position.y = 0.3
  const dome = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.8, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), additive(color, 0.2))
  dome.position.y = 0.2
  g.add(ring, fill, dome)
  g.userData = { ring, fill, dome }
  return g
}

export function createPhenomenaFx() {
  const group = new THREE.Group()
  const storms = new Map()
  PHENOMENON_LIST.forEach((ph, i) => {
    const s = makeStorm(ph, i)
    storms.set(ph.id, s)
    group.add(s)
  })
  const temples = new Map()
  for (const ph of PHENOMENON_LIST) {
    const t = withSurface(() => makeTemple(ph))
    temples.set(ph.id, t)
    group.add(t)
  }
  const skyTempleMeshes = new Map()
  for (const t of skyTemples()) {
    const m = makeSkyTemple(t, PHENOMENON_LIST.find((p) => p.id === t.stormId))
    skyTempleMeshes.set(t.stormId, m)
    group.add(m)
  }
  // The Depths' side (shown only down there): the sunken temples' hearts and glows.
  const deep = new THREE.Group()
  deep.visible = false
  const deepMeshes = new Map()
  for (const t of deepTemples()) {
    const m = makeDeepTemple(t, PHENOMENON_LIST.find((p) => p.id === t.stormId))
    deepMeshes.set(t.stormId, m)
    deep.add(m)
  }
  // The guide beam: a tall, thin pillar of light over whatever you are being sent to, visible across the land.
  const guide = new THREE.Group()
  const guideBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.6, 460, 10, 1, true), additive(0xffffff, 0.4))
  guideBeam.position.y = 230
  const guideRing = new THREE.Mesh(new THREE.RingGeometry(3, 3.7, 40), additive(0xffffff, 0.8))
  guideRing.rotation.x = -Math.PI / 2
  guideRing.position.y = 0.5
  guide.add(guideBeam, guideRing)
  guide.visible = false
  group.add(guide)
  const markers = new Map()
  const zones = new Map()

  // Adds / updates / removes the meshes of `list` (by id) in `pool` with `make(item)`.
  function sync(pool, list, make, apply) {
    const keep = new Set()
    for (const item of list) {
      keep.add(item.id)
      let m = pool.get(item.id)
      if (!m) {
        m = make(item)
        m.position.set(item.x, item.y, item.z)
        group.add(m)
        pool.set(item.id, m)
      }
      m.userData.item = item
      apply?.(m, item)
    }
    for (const [id, m] of pool) {
      if (keep.has(id)) continue
      group.remove(m)
      m.traverse((o) => { o.geometry?.dispose(); o.material?.dispose?.() })
      pool.delete(id)
    }
  }

  return {
    group,
    deep,
    // [{ id, kind, x, y, z, color, radius, progress, active, yaw }]
    setMarkers(list) {
      sync(markers, list, (it) => markerMesh(it.kind, it.color, it.radius ?? 5))
    },
    // [{ id, x, y, z, r, color, t (0..1 charge), live }]
    setZones(list) {
      sync(zones, list, (it) => zoneMesh(it.color, it.r))
    },
    // The guide beam (null hides it): { x, z, y, color }.
    setGuide(g) {
      guide.visible = Boolean(g)
      if (!g) return
      guide.position.set(g.x, g.y, g.z)
      guideBeam.material.color.set(g.color)
      guideRing.material.color.set(g.color)
    },
    // Hides the storms already calmed (set of ids) and any far from the player.
    update(now, player, cleared = new Set()) {
      if (guide.visible) {
        guideBeam.material.opacity = 0.32 + Math.sin(now * 3) * 0.1
        guideRing.scale.setScalar(1 + (now % 1.4) * 0.9)
        guideRing.material.opacity = 0.8 * (1 - (now % 1.4) / 1.4)
      }
      const flicker = (flames, on) => {
        for (const f of flames) {
          f.visible = on
          if (on) f.scale.set(1 + Math.sin(now * 9 + f.position.x) * 0.12, 1 + Math.sin(now * 7 + f.position.z) * 0.25, 1)
        }
      }
      for (const [id, m] of skyTempleMeshes) {
        m.visible = Math.hypot(m.position.x - player.x, m.position.z - player.z) < 800
        if (!m.visible) continue
        animateHeart(m.userData.heart, now, cleared.has(id))
        flicker(m.userData.flames, cleared.has(id))
      }
      for (const [id, m] of deepMeshes) {
        m.visible = Math.hypot(m.position.x - player.x, m.position.z - player.z) < 260
        if (!m.visible) continue
        m.position.y = heightAt(m.position.x, m.position.z) // (in the Depths, the cavern floor)
        animateHeart(m.userData.heart, now, cleared.has(id))
        m.userData.beam.material.opacity = cleared.has(id) ? 0.05 : 0.12 + Math.sin(now * 2) * 0.04
      }
      for (const [id, t] of temples) {
        const eye = phenomenonEye(id)
        t.visible = Math.hypot(eye.x - player.x, eye.z - player.z) < 700
        const u = t.userData
        if (u.pad && t.visible) {
          u.padRing.scale.setScalar(1 + (now % 1.2) * 1.4)
          u.padRing.material.opacity = 0.9 * (1 - (now % 1.2) / 1.2)
          u.lift.material.opacity = 0.16 + Math.sin(now * 3) * 0.06
        }
        for (const f of t.userData.flames) {
          f.visible = cleared.has(id)
          if (f.visible) f.scale.set(1 + Math.sin(now * 9 + f.position.x) * 0.12, 1 + Math.sin(now * 7 + f.position.z) * 0.25, 1)
        }
      }
      for (const [id, s] of storms) {
        const eye = phenomenonEye(id)
        const near = Math.hypot(eye.x - player.x, eye.z - player.z) < 520
        s.visible = near && !cleared.has(id)
        if (!s.visible) continue
        for (const wall of s.userData.walls) {
          wall.rotation.y += wall.userData.spin * 0.016
          wall.material.map.offset.x += wall.userData.scroll * 0.016
        }
        s.userData.beam.material.opacity = 0.18 + Math.sin(now * 2 + eye.x) * 0.06
        s.userData.ring.material.opacity = 0.4 + Math.sin(now * 3) * 0.15
      }
      for (const m of markers.values()) {
        const u = m.userData
        const it = u.item
        if (u.spin) {
          u.spin.rotation.y = now * 1.8
          m.position.y = it.y + (u.float ?? 0) + Math.sin(now * 2 + it.x) * 0.2
        }
        if (u.ring && u.spin) u.ring.rotation.z = now * 1.2
        if (u.fill) {
          const p = Math.max(0.02, it.progress ?? 0)
          u.fill.scale.setScalar(p)
          u.fill.material.opacity = 0.15 + p * 0.35
          u.flame.scale.set(0.4 + p, 0.3 + p * 1.4, 0.4 + p)
          u.flame.material.opacity = 0.2 + p * 0.5
          u.base.material.opacity = it.active ? 0.85 : 0.35
          u.flame.rotation.y = now * 3
        }
        if (u.glow) {
          if (it.yaw !== undefined) m.rotation.y = it.yaw
          const on = it.active !== false
          u.ring.material.opacity = on ? 0.95 : 0.3
          u.glow.material.opacity = on ? 0.16 + Math.sin(now * 5) * 0.05 : 0.04
          u.beam.visible = on
          u.ring.scale.setScalar(on ? 1 + Math.sin(now * 4) * 0.04 : 1)
        }
      }
      for (const z of zones.values()) {
        const it = z.userData.item
        const t = Math.max(0, Math.min(1, it.t ?? 0))
        if (it.live) {
          z.userData.ring.material.opacity = 0.35
          z.userData.fill.material.opacity = 0.3 + Math.sin(now * 6 + it.x) * 0.06
          z.userData.dome.material.opacity = 0.22
          z.userData.dome.visible = true
          z.userData.dome.scale.y = 0.8 + Math.sin(now * 2 + it.z) * 0.15
        } else {
          z.userData.ring.material.opacity = 0.5 + Math.sin(now * 14) * 0.35
          z.userData.fill.material.opacity = 0.08 + t * 0.55
          z.userData.fill.scale.setScalar(Math.max(0.05, t))
          z.userData.dome.visible = false
        }
      }
    },
    dispose() {
      group.traverse((o) => { o.geometry?.dispose(); o.material?.dispose?.() })
    },
  }
}
