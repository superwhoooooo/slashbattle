// The storm-touched staff's look (logic/stormStaff.js): what rides each staff orb in flight (a little twister, orbiting ice
// shards, a comet's flame, drifting spores) and the zones the orbs leave where they land (a sand tornado, frost spikes
// out of the ground, a glowing toadstool puffing spores).
import * as THREE from 'three'
import { STAFF_UPGRADES } from './logic/stormStaff.js'

const glow = (color, opacity) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
const UP = new THREE.Vector3(0, 1, 0)

// A twisting funnel: an open cone whose vertices are skewed round as they rise, so it reads as a spiral when it spins.
function funnelGeometry(bottom, top, height) {
  const g = new THREE.CylinderGeometry(top, bottom, height, 18, 8, true)
  const p = g.attributes.position
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i) / height + 0.5
    const a = y * 2.4
    const x = p.getX(i)
    const z = p.getZ(i)
    p.setXYZ(i, x * Math.cos(a) - z * Math.sin(a), p.getY(i) + height / 2, x * Math.sin(a) + z * Math.cos(a))
  }
  g.computeVertexNormals()
  return g
}

const shared = {}
const geo = (key, make) => (shared[key] ??= make())

// What rides one orb: one piece per boon the staff has.
function makeOrbFx(boons) {
  const g = new THREE.Group()
  const parts = { group: g, spin: [], orbit: [], flame: null, motes: [] }
  if (boons.has('sandstorm')) {
    const twister = new THREE.Group()
    const a = new THREE.Mesh(geo('miniFunnel', () => funnelGeometry(0.06, 0.32, 0.8)), glow(0xffd98a, 0.75))
    const b = new THREE.Mesh(geo('miniFunnel2', () => funnelGeometry(0.1, 0.42, 0.7)), glow(0xc89a5a, 0.45))
    a.position.y = -0.4
    b.position.y = -0.35
    twister.add(a, b)
    g.add(twister)
    parts.orbit.push({ mesh: twister, r: 0.65, speed: 7, y: 0, phase: 0 })
    parts.spin.push(a, b)
  }
  if (boons.has('whiteout')) {
    for (let i = 0; i < 3; i++) {
      const shard = new THREE.Mesh(geo('shard', () => new THREE.OctahedronGeometry(1, 0)), glow(0xcfeaff, 0.9))
      shard.scale.set(0.07, 0.2, 0.07)
      g.add(shard)
      parts.orbit.push({ mesh: shard, r: 0.45, speed: -9, y: 0.1 * Math.sin(i * 2), phase: (i / 3) * Math.PI * 2, tumble: true })
    }
  }
  if (boons.has('ashstorm')) {
    const flame = new THREE.Mesh(geo('comet', () => new THREE.ConeGeometry(0.32, 1.6, 10, 1, true).translate(0, 0.8, 0)), glow(0xff8a2a, 0.7))
    const core = new THREE.Mesh(geo('cometCore', () => new THREE.SphereGeometry(0.34, 12, 8)), glow(0xffd04a, 0.55))
    g.add(flame, core)
    parts.flame = flame
  }
  if (boons.has('miasma')) {
    for (let i = 0; i < 5; i++) {
      const mote = new THREE.Mesh(geo('mote', () => new THREE.SphereGeometry(0.07, 6, 4)), glow(0xb8ff8a, 0.9))
      g.add(mote)
      parts.motes.push({ mesh: mote, phase: i * 1.3 })
    }
  }
  return parts
}

export function createStaffFx(scene, bulletLayer) {
  const orbs = new Map() // bullet data -> parts
  const zones = new Map() // zone -> group
  return {
    // Every frame: dress each live staff orb (cause 'magic', not a co-op friend's ghost shot).
    updateOrbs(pool, boons, now) {
      const seen = new Set()
      if (boons.size) {
        for (const slot of pool.slots) {
          const b = slot.data
          if (!slot.active || !b || b.cause !== 'magic' || b.ghost) continue
          seen.add(b)
          let parts = orbs.get(b)
          if (!parts) {
            parts = makeOrbFx(boons)
            bulletLayer.add(parts.group)
            orbs.set(b, parts)
          }
          parts.group.position.copy(slot.mesh.position)
          const t = now + (b.x + b.z) * 0.01
          for (const o of parts.orbit) {
            const a = t * o.speed + o.phase
            o.mesh.position.set(Math.cos(a) * o.r, o.y, Math.sin(a) * o.r)
            if (o.tumble) o.mesh.rotation.set(a * 1.3, a, 0)
          }
          for (const s of parts.spin) s.rotation.y = now * 18
          if (parts.flame) {
            // the comet's tail points back along the flight
            const back = new THREE.Vector3(-(b.vx ?? 0), 0, -(b.vz ?? 0))
            if (back.lengthSq() > 0) parts.flame.quaternion.setFromUnitVectors(UP, back.normalize())
            parts.flame.scale.set(1 + Math.sin(now * 40) * 0.12, 1 + Math.sin(now * 23) * 0.2, 1 + Math.sin(now * 40) * 0.12)
          }
          for (const m of parts.motes) {
            const a = now * 3 + m.phase
            m.mesh.position.set(Math.cos(a) * 0.35, Math.sin(now * 5 + m.phase) * 0.25, Math.sin(a * 1.3) * 0.35)
          }
        }
      }
      for (const [b, parts] of orbs) {
        if (seen.has(b)) continue
        bulletLayer.remove(parts.group)
        orbs.delete(b)
      }
    },
    // The landing zones (world space).
    addZone(zone) {
      const g = new THREE.Group()
      g.position.set(zone.x, zone.y, zone.z)
      if (zone.kind === 'tornado') {
        const r = STAFF_UPGRADES.sandstorm.tornado.radius
        const layers = [[0.35, r * 0.75, 4.6, 0xffd98a, 0.5], [0.5, r * 0.95, 3.8, 0xc89a5a, 0.32], [0.2, r * 0.5, 5.2, 0xfff1c8, 0.28]]
        g.userData.spin = layers.map(([b, t, h, c, o], i) => {
          const m = new THREE.Mesh(geo(`funnel${i}`, () => funnelGeometry(b, t, h)), glow(c, o))
          g.add(m)
          return m
        })
        const ring = new THREE.Mesh(geo('dustRing', () => new THREE.RingGeometry(r * 0.6, r, 40)), glow(0xd8b070, 0.3))
        ring.rotation.x = -Math.PI / 2
        ring.position.y = 0.1
        g.add(ring)
      } else {
        const t = STAFF_UPGRADES.miasma.cap
        const stem = new THREE.Mesh(geo('capStem', () => new THREE.CylinderGeometry(0.22, 0.32, 1.2, 10).translate(0, 0.6, 0)), new THREE.MeshStandardMaterial({ color: 0xe8e0c0, roughness: 0.7 }))
        const cap = new THREE.Mesh(geo('capTop', () => new THREE.SphereGeometry(0.9, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.7, 1)), new THREE.MeshStandardMaterial({ color: 0x4a8a3a, emissive: 0x6aff4a, emissiveIntensity: 0.35, roughness: 0.5 }))
        cap.position.y = 1.15
        g.add(stem, cap)
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2
          const spot = new THREE.Mesh(geo('capSpot', () => new THREE.SphereGeometry(0.11, 8, 5)), glow(0xd8ff8a, 1))
          spot.position.set(Math.cos(a) * 0.55, 1.5, Math.sin(a) * 0.55)
          g.add(spot)
        }
        const cloud = new THREE.Mesh(geo('capCloud', () => new THREE.SphereGeometry(1, 18, 12)), glow(0x9aff6a, 0))
        cloud.position.y = 0.9
        g.add(cloud)
        const ring = new THREE.Mesh(geo('capRing', () => new THREE.RingGeometry(t.radius - 0.25, t.radius, 40)), glow(0xb8ff8a, 0.3))
        ring.rotation.x = -Math.PI / 2
        ring.position.y = 0.08
        g.add(ring)
        g.userData.cloud = cloud
      }
      scene.add(g)
      zones.set(zone, g)
    },
    // A puff from a sporecap (the cloud swells and fades).
    puff(zone, now) {
      const g = zones.get(zone)
      if (g) g.userData.puffAt = now
    },
    updateZones(list, now) {
      for (const [zone, g] of zones) {
        if (list.includes(zone)) continue
        scene.remove(g)
        zones.delete(zone)
      }
      for (const zone of list) {
        const g = zones.get(zone)
        if (!g) continue
        g.position.set(zone.x, zone.y, zone.z)
        const age = now - zone.born
        const left = zone.until - now
        const grow = Math.min(1, age / 0.25) * Math.min(1, Math.max(0, left) / 0.35)
        if (zone.kind === 'tornado') {
          g.scale.set(grow, 0.3 + 0.7 * grow, grow)
          g.userData.spin.forEach((m, i) => (m.rotation.y = now * (9 + i * 3) * (i % 2 ? -1 : 1)))
        } else {
          g.scale.setScalar(Math.max(0.01, Math.min(1, age / 0.4)) * (left < 0.5 ? Math.max(0.01, left / 0.5) : 1))
          const k = Math.max(0, 1 - (now - (g.userData.puffAt ?? -9)) / 0.7)
          g.userData.cloud.material.opacity = k * 0.35
          g.userData.cloud.scale.setScalar(1 + (1 - k) * (STAFF_UPGRADES.miasma.cap.radius - 1))
        }
      }
    },
    // Frost spikes bursting out of the ground round a frozen-hit target: rise, hold, sink.
    spikes(at, now) {
      const g = new THREE.Group()
      g.position.set(at.x, at.y, at.z)
      const r = STAFF_UPGRADES.whiteout.spikes.radius
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2 + Math.random() * 0.3
        const d = r * (0.4 + Math.random() * 0.6)
        const s = new THREE.Mesh(geo('spike', () => new THREE.ConeGeometry(0.22, 1.4, 5).translate(0, 0.7, 0)), glow(0xcfeaff, 0.85))
        s.position.set(Math.cos(a) * d, 0, Math.sin(a) * d)
        s.rotation.set(Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35)
        s.userData.h = 0.7 + Math.random() * 0.8
        g.add(s)
      }
      scene.add(g)
      const start = now
      g.userData.step = (t) => {
        const age = t - start
        const k = age < 0.12 ? age / 0.12 : age > 0.7 ? Math.max(0, 1 - (age - 0.7) / 0.3) : 1
        for (const s of g.children) s.scale.set(1, Math.max(0.01, k * s.userData.h), 1)
        return age < 1
      }
      this._spikes = [...(this._spikes ?? []), g]
    },
    stepSpikes(now) {
      this._spikes = (this._spikes ?? []).filter((g) => {
        if (g.userData.step(now)) return true
        scene.remove(g)
        return false
      })
    },
  }
}
