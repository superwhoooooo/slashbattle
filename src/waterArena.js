// The scenery of the water rooms (logic/levels.js entries with a `water` block): a rolling
// water surface you swim on, a floor `WATER.depth` below it you see when you dive, and
// per-style dressing -- a tiled pool basin with lane ropes, an open ocean ringed by buoys, or
// a glass reef aquarium with glowing coral and jellyfish. Everything here is decoration: the
// walls are not obstacles (main.js clamps swimmers inside ARENA_RADIUS instead).
import * as THREE from 'three'
import { ARENA_RADIUS } from './config.js'
import { WATER, waveHeight } from './logic/water.js'

const SURFACE_SIZE = 340
const SURFACE_SEGMENTS = 68

function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const hex = (n) => `#${n.toString(16).padStart(6, '0')}`

// A repeating floor/wall texture for each style.
function createTexture(style, cfg, repeat) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 256
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = hex(cfg.floor.color)
  ctx.fillRect(0, 0, 256, 256)
  if (style === 'pool') {
    ctx.strokeStyle = 'rgba(25,181,165,0.55)'
    ctx.lineWidth = 6
    for (let i = 0; i <= 256; i += 64) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 256); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(256, i); ctx.stroke()
    }
  } else if (style === 'ocean') {
    const rand = mulberry32(11)
    for (let i = 0; i < 900; i++) {
      ctx.fillStyle = rand() < 0.5 ? 'rgba(255,255,255,0.12)' : 'rgba(120,90,40,0.12)'
      ctx.fillRect(rand() * 256, rand() * 256, 2 + rand() * 4, 2 + rand() * 3)
    }
  } else {
    ctx.strokeStyle = 'rgba(55,242,255,0.18)'
    ctx.lineWidth = 2
    for (let i = 0; i <= 256; i += 32) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 256); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(256, i); ctx.stroke()
    }
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(repeat, repeat)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export function createWaterWorld(level) {
  const cfg = level.water
  const style = cfg.style
  const group = new THREE.Group()
  const rand = mulberry32(level.seed ?? 1)
  const amp = cfg.surface.amp
  const floorY = -WATER.depth
  const R = ARENA_RADIUS

  // --- The surface: a coarse flat-shaded sheet whose vertices ride the waves.
  const surfaceGeometry = new THREE.PlaneGeometry(SURFACE_SIZE, SURFACE_SIZE, SURFACE_SEGMENTS, SURFACE_SEGMENTS)
  surfaceGeometry.rotateX(-Math.PI / 2)
  const surfacePos = surfaceGeometry.attributes.position
  const baseXZ = new Float32Array(surfacePos.count * 2)
  for (let i = 0; i < surfacePos.count; i++) {
    baseXZ[i * 2] = surfacePos.getX(i)
    baseXZ[i * 2 + 1] = surfacePos.getZ(i)
  }
  const surface = new THREE.Mesh(
    surfaceGeometry,
    // Rough, no clearcoat: a glossy flat-shaded sheet this big throws sun glints far above the
    // bloom threshold as the waves move, and the bloom pass turns those into white screen flashes.
    new THREE.MeshStandardMaterial({
      color: cfg.surface.color,
      transparent: true,
      opacity: cfg.surface.opacity,
      roughness: 0.75,
      metalness: 0,
      envMapIntensity: 0.4,
      side: THREE.DoubleSide,
      flatShading: true,
      depthWrite: false,
      emissive: new THREE.Color(cfg.surface.color),
      emissiveIntensity: style === 'reef' ? 0.35 : 0.12,
    }),
  )
  surface.renderOrder = 2
  surface.receiveShadow = true
  group.add(surface)

  // --- The floor you see when you dive.
  const floor = new THREE.Mesh(new THREE.CircleGeometry(R + 70, 64), new THREE.MeshStandardMaterial({ map: createTexture(style, cfg, style === 'pool' ? 26 : 14), roughness: 0.9 }))
  floor.rotation.x = -Math.PI / 2
  floor.position.y = floorY
  group.add(floor)

  const bobbers = [] // { mesh|index, x, z, lift }: floating things that ride the surface
  const spinners = []

  if (style === 'pool' || style === 'reef') {
    // A basin wall all the way round (tile for the pool, glass for the aquarium).
    const wallHeight = WATER.depth + 1.6
    const wallMaterial =
      style === 'pool'
        ? new THREE.MeshStandardMaterial({ map: createTexture('pool', { floor: { color: cfg.wall.color } }, 40), roughness: 0.6, side: THREE.DoubleSide })
        : new THREE.MeshStandardMaterial({ color: cfg.wall.color, transparent: true, opacity: 0.16, roughness: 0.6, envMapIntensity: 0.3, side: THREE.DoubleSide, depthWrite: false })
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.6, R + 0.6, wallHeight, 72, 1, true), wallMaterial)
    wall.position.y = floorY + wallHeight / 2
    wall.renderOrder = style === 'reef' ? 3 : 0
    group.add(wall)
    const trim = new THREE.Mesh(new THREE.TorusGeometry(R + 0.6, 0.45, 8, 96), new THREE.MeshStandardMaterial({ color: cfg.wall.trim, roughness: 0.4, emissive: new THREE.Color(cfg.wall.trim), emissiveIntensity: style === 'reef' ? 0.8 : 0.1 }))
    trim.rotation.x = Math.PI / 2
    trim.position.y = 1.6
    group.add(trim)
    if (style === 'reef') {
      const lower = trim.clone()
      lower.position.y = floorY + 0.4
      group.add(lower)
    }
  }

  if (style === 'pool') {
    // Lane ropes: rings of red and white floats.
    const beadGeo = new THREE.SphereGeometry(0.34, 8, 6)
    for (const radius of [15, 29, 41]) {
      const count = Math.round(radius * 3.4)
      const beads = new THREE.InstancedMesh(beadGeo, new THREE.MeshStandardMaterial({ roughness: 0.4 }), count)
      const color = new THREE.Color()
      for (let i = 0; i < count; i++) {
        beads.setColorAt(i, color.set(i % 2 ? 0xff4a4a : 0xffffff))
        const a = (i / count) * Math.PI * 2
        bobbers.push({ beads, index: i, x: Math.cos(a) * radius, z: Math.sin(a) * radius, lift: 0.1 })
      }
      beads.instanceColor.needsUpdate = true
      group.add(beads)
    }
    // A few inflatable rings drifting about.
    for (let i = 0; i < 6; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.45, 10, 24), new THREE.MeshStandardMaterial({ color: [0xff6a4d, 0xffd15c, 0x19b5a5][i % 3], roughness: 0.35 }))
      ring.rotation.x = Math.PI / 2
      const a = rand() * Math.PI * 2
      const d = 6 + rand() * 30
      bobbers.push({ mesh: ring, x: Math.cos(a) * d, z: Math.sin(a) * d, lift: 0.2, tilt: true })
      group.add(ring)
    }
    // A big target ring + drain on the floor at the center.
    const drain = new THREE.Mesh(new THREE.RingGeometry(2, 3, 32), new THREE.MeshStandardMaterial({ color: cfg.floor.accent }))
    drain.rotation.x = -Math.PI / 2
    drain.position.y = floorY + 0.02
    group.add(drain)
  }

  if (style === 'ocean') {
    // A ring of buoys marks how far you can swim.
    const buoyGeo = new THREE.SphereGeometry(0.75, 10, 8)
    const count = 56
    const buoys = new THREE.InstancedMesh(buoyGeo, new THREE.MeshStandardMaterial({ roughness: 0.5 }), count)
    const color = new THREE.Color()
    for (let i = 0; i < count; i++) {
      buoys.setColorAt(i, color.set(i % 2 ? cfg.wall.color : cfg.wall.trim))
      const a = (i / count) * Math.PI * 2
      bobbers.push({ beads: buoys, index: i, x: Math.cos(a) * (R + 0.6), z: Math.sin(a) * (R + 0.6), lift: 0.2, scale: 1 })
    }
    buoys.instanceColor.needsUpdate = true
    group.add(buoys)
    // Rocks and kelp on the seabed.
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x6a6a70, roughness: 0.9, flatShading: true })
    const kelpMat = new THREE.MeshStandardMaterial({ color: cfg.floor.accent, roughness: 0.8 })
    for (let i = 0; i < 26; i++) {
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.8 + rand() * 1.8, 0), rockMat)
      const a = rand() * Math.PI * 2
      const d = rand() * (R + 20)
      rock.position.set(Math.cos(a) * d, floorY + 0.3, Math.sin(a) * d)
      rock.rotation.set(rand() * 3, rand() * 3, rand() * 3)
      group.add(rock)
    }
    for (let i = 0; i < 46; i++) {
      const kelp = new THREE.Mesh(new THREE.ConeGeometry(0.3, 3 + rand() * 4, 6), kelpMat)
      const a = rand() * Math.PI * 2
      const d = rand() * (R + 15)
      kelp.position.set(Math.cos(a) * d, floorY + 1.8, Math.sin(a) * d)
      spinners.push({ mesh: kelp, phase: rand() * 6, sway: 0.12 })
      group.add(kelp)
    }
  }

  if (style === 'reef') {
    // Glowing coral on the floor and drifting jellyfish.
    const colors = [0xff3fb4, 0x37f2ff, 0xb4ff3f, 0xffd23f, 0xa66bff]
    for (let i = 0; i < 70; i++) {
      const color = colors[Math.floor(rand() * colors.length)]
      const mat = new THREE.MeshStandardMaterial({ color, emissive: new THREE.Color(color), emissiveIntensity: 0.9, roughness: 0.5 })
      const coral = new THREE.Mesh(rand() < 0.5 ? new THREE.ConeGeometry(0.4 + rand() * 0.5, 1.5 + rand() * 3, 7) : new THREE.IcosahedronGeometry(0.5 + rand() * 0.8, 0), mat)
      const a = rand() * Math.PI * 2
      const d = rand() * (R + 6)
      coral.position.set(Math.cos(a) * d, floorY + 0.8, Math.sin(a) * d)
      group.add(coral)
    }
    for (let i = 0; i < 14; i++) {
      const color = colors[Math.floor(rand() * colors.length)]
      const jelly = new THREE.Group()
      const bell = new THREE.Mesh(new THREE.SphereGeometry(0.9, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }))
      jelly.add(bell)
      for (let t = 0; t < 5; t++) {
        const tentacle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.8, 4), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false }))
        const ta = (t / 5) * Math.PI * 2
        tentacle.position.set(Math.cos(ta) * 0.45, -0.9, Math.sin(ta) * 0.45)
        jelly.add(tentacle)
      }
      const a = rand() * Math.PI * 2
      const d = rand() * (R - 4)
      jelly.position.set(Math.cos(a) * d, -2.5 - rand() * 4.5, Math.sin(a) * d)
      spinners.push({ mesh: jelly, phase: rand() * 6, bob: 0.6, baseY: jelly.position.y })
      group.add(jelly)
    }
  }

  const dummy = new THREE.Object3D()
  const instanced = new Set(bobbers.filter((b) => b.beads).map((b) => b.beads))

  function update(time) {
    for (let i = 0; i < surfacePos.count; i++) {
      surfacePos.setY(i, waveHeight(baseXZ[i * 2], baseXZ[i * 2 + 1], time, amp))
    }
    surfacePos.needsUpdate = true
    for (const b of bobbers) {
      const y = waveHeight(b.x, b.z, time, amp) + b.lift
      if (b.beads) {
        dummy.position.set(b.x, y, b.z)
        dummy.rotation.set(0, 0, 0)
        dummy.updateMatrix()
        b.beads.setMatrixAt(b.index, dummy.matrix)
      } else {
        b.mesh.position.set(b.x, y, b.z)
        if (b.tilt) b.mesh.rotation.set(Math.PI / 2 + Math.sin(time + b.x) * 0.12, 0, Math.cos(time * 0.8 + b.z) * 0.12)
      }
    }
    for (const beads of instanced) beads.instanceMatrix.needsUpdate = true
    for (const s of spinners) {
      if (s.sway) s.mesh.rotation.z = Math.sin(time * 0.9 + s.phase) * s.sway
      if (s.bob) {
        s.mesh.position.y = s.baseY + Math.sin(time * 0.7 + s.phase) * s.bob
        s.mesh.scale.y = 1 + Math.sin(time * 2.2 + s.phase) * 0.12
      }
    }
  }
  update(0)

  return { group, update, amp }
}
