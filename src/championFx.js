// The look of a storm champion's fight (logic/championFights.js): Sirocco's sun mirrors and sand veil, Rimefang's braziers,
// ice armour and frost-breath cone, the Cinder Tyrant's bombs and obsidian shell, Mother Miasma's root ward and roots, and the
// glowing seal across the colosseum's gate while the fight is on. One group per fight, in world space at the arena's floor.
import * as THREE from 'three'
import { COLOSSEUM_GATE, COLOSSEUM_WALL } from './logic/depths.js'

const add = (group, mesh, x = 0, y = 0, z = 0) => {
  mesh.position.set(x, y, z)
  group.add(mesh)
  return mesh
}
const glowMat = (color, opacity = 0.6) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })

export function createChampionFx(s, c) {
  const group = new THREE.Group()
  group.position.set(0, c.floor, 0)
  const color = s.def.color
  const parts = { group, s }

  // The gate's seal: a glowing curtain across the opening while the fight is on.
  const seal = new THREE.Mesh(
    new THREE.CylinderGeometry(COLOSSEUM_WALL, COLOSSEUM_WALL, 9, 16, 1, true, Math.PI / 2 - (c.gate + COLOSSEUM_GATE), COLOSSEUM_GATE * 2),
    glowMat(color, 0.35),
  )
  add(group, seal, c.x, 4.5, c.z)
  seal.visible = false
  parts.seal = seal

  // The ward around the champion (a veil, armour, a shell or a bubble), placed on it every frame.
  const ward = new THREE.Group()
  group.add(ward)
  parts.ward = ward
  if (s.kind === 'mirrors') {
    const veil = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 0.6, 2.6, 20, 4, true), glowMat(0xffd98a, 0.32))
    veil.position.y = 1.3
    ward.add(veil)
    const veil2 = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 0.9, 2.2, 14, 1, true), glowMat(0xc8a060, 0.22))
    veil2.position.y = 1.2
    ward.add(veil2)
    parts.spin = [veil, veil2]
  } else if (s.kind === 'braziers') {
    const mat = new THREE.MeshPhysicalMaterial({ color: 0xcfeeff, roughness: 0.1, transmission: 0.4, transparent: true, opacity: 0.55, emissive: 0x5ab8ff, emissiveIntensity: 0.4, flatShading: true })
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2
      const shard = new THREE.Mesh(new THREE.OctahedronGeometry(1, 0), mat)
      shard.scale.set(0.22, 0.55 + (i % 3) * 0.15, 0.22)
      shard.position.set(Math.cos(a) * 0.9, 0.4 + (i % 4) * 0.42, Math.sin(a) * 0.9)
      shard.rotation.set(0.3 * Math.sin(i), a, 0.4 * Math.cos(i * 1.3))
      ward.add(shard)
    }
  } else if (s.kind === 'bombs') {
    const shell = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshStandardMaterial({ color: 0x1a1420, roughness: 0.2, metalness: 0.4, transparent: true, opacity: 0.55, flatShading: true, emissive: 0xff5a1a, emissiveIntensity: 0 }))
    shell.position.y = 1.1
    ward.add(shell)
    parts.shell = shell
  } else {
    const bubble = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), glowMat(0x9aff6a, 0.22))
    bubble.position.y = 1.0
    ward.add(bubble)
    parts.bubble = bubble
  }
  // A ring on the floor that flares while the champion reels.
  const reel = add(group, new THREE.Mesh(new THREE.RingGeometry(0.9, 1.2, 40), glowMat(0xffffff, 0.7)), 0, 0.1, 0)
  reel.rotation.x = -Math.PI / 2
  reel.visible = false
  parts.reel = reel

  if (s.kind === 'mirrors') {
    parts.mirrors = s.mirrors.map((m) => {
      const g = new THREE.Group()
      g.position.set(m.x, 0, m.z)
      g.rotation.y = Math.atan2(c.x - m.x, c.z - m.z)
      const stone = new THREE.MeshStandardMaterial({ color: 0xb89870, roughness: 0.8 })
      add(g, new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 3.2, 8), stone), 0, 1.6, 0)
      const frame = add(g, new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.12, 8, 24), new THREE.MeshStandardMaterial({ color: 0xffc847, metalness: 0.8, roughness: 0.3 })), 0, 3.6, 0)
      frame.rotation.x = 0.35
      const face = new THREE.MeshStandardMaterial({ color: 0x6a6a80, metalness: 0.9, roughness: 0.15, emissive: 0xffe066, emissiveIntensity: 0 })
      const disc = add(g, new THREE.Mesh(new THREE.CircleGeometry(0.95, 24), face), 0, 3.6, 0.02)
      disc.rotation.x = 0.35
      const pad = add(g, new THREE.Mesh(new THREE.RingGeometry(1.7, 2.4, 32), glowMat(0xffd98a, 0.35)), 0, 0.08, 0)
      pad.rotation.x = -Math.PI / 2
      const fill = add(g, new THREE.Mesh(new THREE.CircleGeometry(1.7, 32), glowMat(0xffd98a, 0.0)), 0, 0.07, 0)
      fill.rotation.x = -Math.PI / 2
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.35, 1, 10, 1, true), glowMat(0xfff1a8, 0.55))
      beam.visible = false
      group.add(beam)
      group.add(g)
      return { g, face, pad, fill, beam, m }
    })
  }
  if (s.kind === 'braziers') {
    parts.braziers = s.braziers.map((b) => {
      const g = new THREE.Group()
      g.position.set(b.x, 0, b.z)
      const iron = new THREE.MeshStandardMaterial({ color: 0x3a3440, metalness: 0.6, roughness: 0.5 })
      add(g, new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.45, 1.4, 8), iron), 0, 0.7, 0)
      add(g, new THREE.Mesh(new THREE.CylinderGeometry(1.0, 0.6, 0.5, 12), iron), 0, 1.6, 0)
      const flame = add(g, new THREE.Mesh(new THREE.ConeGeometry(0.75, 2.0, 10), glowMat(0xff9a3a, 0.85)), 0, 2.8, 0)
      const core = add(g, new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.2, 8), glowMat(0xffe08a, 0.9)), 0, 2.4, 0)
      const ring = add(g, new THREE.Mesh(new THREE.RingGeometry(s.def.warm - 0.35, s.def.warm, 48), glowMat(0xff9a3a, 0.4)), 0, 0.08, 0)
      ring.rotation.x = -Math.PI / 2
      const light = add(g, new THREE.PointLight(0xff9a3a, 30, 14, 2), 0, 3, 0)
      group.add(g)
      return { g, flame, core, ring, light, b }
    })
    const cone = new THREE.Mesh(new THREE.CircleGeometry(s.def.breathRange, 32, -s.def.breathArc, s.def.breathArc * 2), glowMat(0x9fe8ff, 0.0))
    cone.rotation.x = -Math.PI / 2
    cone.position.y = 0.12
    cone.visible = false
    group.add(cone)
    parts.cone = cone
  }
  if (s.kind === 'bombs') parts.bombs = new Map()
  if (s.kind === 'pods') {
    parts.roots = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xb8ff8a, transparent: true, opacity: 0.8 }))
    parts.roots.frustumCulled = false
    group.add(parts.roots)
  }
  return parts
}

function bombMesh() {
  const g = new THREE.Group()
  g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 1), new THREE.MeshStandardMaterial({ color: 0x2a2026, roughness: 0.5, emissive: 0xff4a10, emissiveIntensity: 0.4, flatShading: true })))
  const spark = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), glowMat(0xffd04a, 1))
  spark.position.y = 0.65
  g.add(spark)
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.7, 1.95, 36), glowMat(0xff5a2a, 0.0))
  ring.rotation.x = -Math.PI / 2
  g.add(ring)
  g.userData = { spark, ring }
  return g
}

// Every frame: ward on the champion, arena pieces' states, bombs in flight, the breath telegraph.
// view: { now, boss: {x, y, z, radius, size}, floorAt(x, z), podPositions: [{x, y, z}], sealed }
export function updateChampionFx(parts, view) {
  const { s, group } = parts
  const { now, boss } = view
  const base = group.position.y
  parts.seal.visible = view.sealed
  if (view.sealed) parts.seal.material.opacity = 0.28 + Math.sin(now * 3) * 0.08
  const r = Math.max(1.6, boss.radius * 1.6)
  parts.ward.position.set(boss.x, boss.y - base, boss.z)
  parts.ward.scale.set(r, boss.size * 0.5, r)
  parts.ward.visible = !s.exposed
  if (parts.spin) {
    parts.spin[0].rotation.y = now * 3
    parts.spin[1].rotation.y = -now * 2.2
  }
  if (parts.shell) parts.shell.material.emissiveIntensity = (s.cracks ?? 0) * 0.45 + Math.sin(now * 8) * 0.08 * (s.cracks ?? 0)
  if (parts.bubble) parts.bubble.material.opacity = 0.18 + Math.sin(now * 2.5) * 0.06
  if (s.kind === 'braziers') parts.ward.scale.multiplyScalar(1 - Math.min(0.45, (s.melt / s.def.melt) * 0.45))
  parts.reel.visible = s.exposed
  if (s.exposed) {
    parts.reel.position.set(boss.x, boss.y - base + 0.1, boss.z)
    parts.reel.scale.setScalar(r * (1 + 0.15 * Math.sin(now * 6)))
    parts.reel.material.color.setHex(s.def.color)
  }

  if (parts.mirrors) {
    for (const pm of parts.mirrors) {
      const { m } = pm
      pm.face.emissiveIntensity = m.lit ? 1.6 + Math.sin(now * 5) * 0.3 : (m.charge / s.def.turn) * 0.8
      pm.fill.material.opacity = m.lit ? 0.3 : (m.charge / s.def.turn) * 0.5
      pm.pad.material.opacity = m.lit ? 0.7 : 0.3 + 0.15 * Math.sin(now * 3)
      pm.beam.visible = m.lit && !s.exposed
      if (pm.beam.visible) {
        const from = new THREE.Vector3(m.x, 3.6, m.z)
        const to = new THREE.Vector3(boss.x, boss.y - base + boss.size * 0.5, boss.z)
        const d = from.distanceTo(to)
        pm.beam.position.copy(from).add(to).multiplyScalar(0.5)
        pm.beam.scale.set(1, d, 1)
        pm.beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.sub(from).normalize())
        pm.beam.material.opacity = 0.4 + Math.sin(now * 9) * 0.15
      }
    }
  }
  if (parts.braziers) {
    for (const pb of parts.braziers) {
      const lit = pb.b.lit
      pb.flame.visible = pb.core.visible = lit
      pb.light.intensity = lit ? 28 + Math.sin(now * 13 + pb.b.x) * 6 : 0
      pb.ring.material.opacity = lit ? 0.35 + Math.sin(now * 4) * 0.08 : 0.06
      if (lit) {
        const k = 1 + Math.sin(now * 11 + pb.b.z) * 0.08
        pb.flame.scale.set(k, 1 / k + 0.1 * Math.sin(now * 7), k)
      }
    }
    const b = s.breath
    parts.cone.visible = !!b || now < (parts.flashUntil ?? 0)
    if (b) {
      parts.cone.position.x = b.x
      parts.cone.position.z = b.z
      parts.cone.rotation.z = -b.angle
      const k = 1 - Math.max(0, b.at - now) / s.def.breathWarn
      parts.cone.material.color.setHex(0x9fe8ff)
      parts.cone.material.opacity = 0.12 + 0.25 * k + 0.1 * Math.sin(now * 18) * k
    } else if (parts.cone.visible) parts.cone.material.opacity = Math.max(0, (parts.flashUntil - now) / 0.5) * 0.8
  }
  if (parts.bombs) {
    const seen = new Set()
    for (const b of s.bombs) {
      seen.add(b.id)
      let mesh = parts.bombs.get(b.id)
      if (!mesh) {
        mesh = bombMesh()
        group.add(mesh)
        parts.bombs.set(b.id, mesh)
      }
      const ground = view.floorAt(b.x, b.z) - base
      if (b.phase === 'air') {
        const t = Math.min(1, (now - b.t0) / s.def.flight)
        mesh.position.set(b.fromX + (b.x - b.fromX) * t, ground + 3 + Math.sin(t * Math.PI) * 6 - 2.5 * t, b.fromZ + (b.z - b.fromZ) * t)
        mesh.userData.ring.material.opacity = 0.25 * t
      } else {
        mesh.position.set(b.x, ground + 0.55, b.z)
        const left = Math.max(0, b.fuseAt - now)
        mesh.userData.ring.material.opacity = b.phase === 'fizz' ? 0.35 + 0.35 * Math.sin(now * (left < 1.5 ? 30 : 10)) : 0
        mesh.userData.ring.position.y = -0.5
        mesh.rotation.x += b.phase === 'kicked' ? 0.4 : 0
      }
      mesh.userData.spark.scale.setScalar(0.8 + Math.random() * 0.6)
    }
    for (const [id, mesh] of parts.bombs) {
      if (seen.has(id)) continue
      group.remove(mesh)
      disposeTree(mesh)
      parts.bombs.delete(id)
    }
  }
  if (parts.roots) {
    const pts = []
    if (!s.exposed) {
      for (const p of view.podPositions ?? []) pts.push(p.x, p.y - base + 0.4, p.z, boss.x, boss.y - base + 0.3, boss.z)
    }
    parts.roots.geometry.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
    parts.roots.material.opacity = 0.55 + Math.sin(now * 4) * 0.25
  }
}

export function flashBreath(parts, now) {
  parts.flashUntil = now + 0.5
  if (parts.cone) parts.cone.material.color.setHex(0xffffff)
}

function disposeTree(o) {
  o.traverse((n) => {
    n.geometry?.dispose()
    n.material?.dispose?.()
  })
}
export function disposeChampionFx(parts) {
  parts.group.parent?.remove(parts.group)
  disposeTree(parts.group)
}
