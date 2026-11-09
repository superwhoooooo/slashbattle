// The look of the Wilds' activities: lost lanterns (one instanced batch, only the unlit ones near you), the
// roadside wayshrines (a waystone with a floating boon orb that dims while it recharges), the sky-ring race gates
// and rings, and the star shards a Starfall leaves behind. Rules live in logic/lanterns.js, logic/wayshrines.js,
// logic/races.js and logic/wildEvents.js; main.js drives this from its Wilds step.
import * as THREE from 'three'
import { heightAt } from './logic/world.js'
import { BOONS, wayshrines } from './logic/wayshrines.js'
import { RING_RADIUS, raceCourses } from './logic/races.js'

const MAX_LANTERNS = 64
const SHOW_RADIUS = 190 // shrines / race gates further than this are hidden

export function createWildsActivities() {
  const group = new THREE.Group()
  const matrix = new THREE.Matrix4()
  const quat = new THREE.Quaternion()
  const pos = new THREE.Vector3()
  const scl = new THREE.Vector3()
  const yAxis = new THREE.Vector3(0, 1, 0)

  // ---- lanterns: a paper body (lit) plus an additive halo, both instanced ----
  const bodyGeo = new THREE.CylinderGeometry(0.32, 0.26, 0.62, 10)
  bodyGeo.translate(0, 0, 0)
  const capGeo = new THREE.ConeGeometry(0.36, 0.22, 10)
  const haloGeo = new THREE.SphereGeometry(0.8, 12, 8)
  const lanternBody = new THREE.InstancedMesh(bodyGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }), MAX_LANTERNS)
  const lanternCap = new THREE.InstancedMesh(capGeo, new THREE.MeshStandardMaterial({ color: 0x3a2a4a, roughness: 0.7 }), MAX_LANTERNS)
  const lanternHalo = new THREE.InstancedMesh(haloGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false }), MAX_LANTERNS)
  for (const m of [lanternBody, lanternCap, lanternHalo]) {
    m.count = 0
    m.frustumCulled = false
    group.add(m)
  }
  let shownLanterns = []
  const tint = new THREE.Color()

  // ---- wayshrines ----
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x6d6888, roughness: 0.85, flatShading: true })
  const stoneGeo = new THREE.CylinderGeometry(0.55, 0.85, 2.4, 6)
  stoneGeo.translate(0, 1.2, 0)
  const baseGeo = new THREE.CylinderGeometry(1.6, 1.8, 0.3, 8)
  baseGeo.translate(0, 0.15, 0)
  const orbGeo = new THREE.IcosahedronGeometry(0.42, 1)
  const ringGeo = new THREE.TorusGeometry(0.75, 0.06, 6, 24)
  const shrines = wayshrines().map((def) => {
    const g = new THREE.Group()
    g.position.set(def.x, heightAt(def.x, def.z), def.z)
    const color = new THREE.Color(BOONS[def.boon].color)
    const orbMat = new THREE.MeshBasicMaterial({ color })
    const glowMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false })
    g.add(new THREE.Mesh(baseGeo, stoneMat), new THREE.Mesh(stoneGeo, stoneMat))
    const orb = new THREE.Mesh(orbGeo, orbMat)
    orb.position.y = 3.1
    const halo = new THREE.Mesh(haloGeo, glowMat)
    halo.position.y = 3.1
    halo.scale.setScalar(1.3)
    const ring = new THREE.Mesh(ringGeo, glowMat)
    ring.position.y = 3.1
    g.add(orb, halo, ring)
    group.add(g)
    return { def, g, orb, halo, ring, orbMat, glowMat, color, charge: 1 }
  })

  // ---- race gates and rings ----
  const torusGeo = new THREE.TorusGeometry(RING_RADIUS, 0.22, 8, 40)
  const gateGeo = new THREE.TorusGeometry(3.4, 0.18, 6, 40)
  gateGeo.rotateX(Math.PI / 2)
  const beamGeo = new THREE.CylinderGeometry(0.5, 1.4, 40, 12, 1, true)
  beamGeo.translate(0, 20, 0)
  const gateMat = new THREE.MeshBasicMaterial({ color: 0x7ae8ff, transparent: true, opacity: 0.85, fog: false })
  const beamMat = new THREE.MeshBasicMaterial({ color: 0x7ae8ff, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false })
  const idleRingMat = new THREE.MeshBasicMaterial({ color: 0xbfe9ff, transparent: true, opacity: 0.32, depthWrite: false })
  const nextRingMat = new THREE.MeshBasicMaterial({ color: 0xffd15c, fog: false })
  const laterRingMat = new THREE.MeshBasicMaterial({ color: 0x7ae8ff, transparent: true, opacity: 0.75, fog: false })
  const races = raceCourses().map((course) => {
    const gate = new THREE.Group()
    gate.position.set(course.start.x, course.start.y + 0.2, course.start.z)
    const gateRing = new THREE.Mesh(gateGeo, gateMat)
    gate.add(gateRing, new THREE.Mesh(beamGeo, beamMat))
    group.add(gate)
    const rings = course.rings.map((r) => {
      const mesh = new THREE.Mesh(torusGeo, idleRingMat)
      mesh.position.set(r.x, r.y, r.z)
      mesh.rotation.y = r.yaw
      group.add(mesh)
      return mesh
    })
    return { course, gate, gateRing, rings }
  })
  let raceShown = { id: null, next: -1 }

  // ---- star shards (Starfall) ----
  const shardGeo = new THREE.OctahedronGeometry(0.45, 0)
  const shardMat = new THREE.MeshBasicMaterial({ color: 0xfff1a8 })
  const shardGlowMat = new THREE.MeshBasicMaterial({ color: 0xffd15c, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false })

  return {
    group,
    // Shows the unlit lanterns in `list` (nearest first, capped).
    setLanterns(list) {
      shownLanterns = list.slice(0, MAX_LANTERNS)
      lanternBody.count = lanternCap.count = lanternHalo.count = shownLanterns.length
      shownLanterns.forEach((l, i) => {
        tint.set(l.color).lerp(new THREE.Color(0xffe2a0), 0.45)
        lanternBody.setColorAt(i, tint)
        lanternHalo.setColorAt(i, tint)
        l.ground = heightAt(l.x, l.z)
      })
      for (const m of [lanternBody, lanternHalo]) if (m.instanceColor) m.instanceColor.needsUpdate = true
    },
    // A shrine's orb dims and shrinks while it recharges (charge 0..1).
    setShrineCharge(id, charge) {
      const s = shrines.find((x) => x.def.id === id)
      if (!s || Math.abs(s.charge - charge) < 0.01) return
      s.charge = charge
      const ready = charge >= 1
      s.orbMat.color.copy(s.color).multiplyScalar(ready ? 1 : 0.25 + charge * 0.4)
      s.glowMat.opacity = ready ? 0.35 : 0.06
    },
    // The race in progress (or null): its next ring glows gold, the passed ones vanish.
    setRace(active) {
      const id = active?.id ?? null
      const next = active?.next ?? -1
      if (raceShown.id === id && raceShown.next === next) return
      raceShown = { id, next }
      for (const r of races) {
        const mine = r.course.id === id
        r.rings.forEach((mesh, i) => {
          mesh.visible = !mine || i >= next
          mesh.material = !mine ? idleRingMat : i === next ? nextRingMat : laterRingMat
        })
        r.gateRing.material = gateMat
      }
    },
    addShard(x, y, z) {
      const g = new THREE.Group()
      g.add(new THREE.Mesh(shardGeo, shardMat))
      const glow = new THREE.Mesh(haloGeo, shardGlowMat)
      glow.scale.setScalar(0.9)
      g.add(glow)
      g.position.set(x, y, z)
      group.add(g)
      return g
    },
    removeShard(g) {
      group.remove(g) // shared geometry and materials: nothing to dispose
    },
    update(time, player) {
      shownLanterns.forEach((l, i) => {
        const bob = Math.sin(time * 1.6 + l.x) * 0.18
        quat.setFromAxisAngle(yAxis, time * 0.6 + l.z)
        pos.set(l.x, l.ground + 1.3 + bob, l.z)
        matrix.compose(pos, quat, scl.set(1, 1, 1))
        lanternBody.setMatrixAt(i, matrix)
        lanternHalo.setMatrixAt(i, matrix)
        pos.y += 0.42
        matrix.compose(pos, quat, scl.set(1, 1, 1))
        lanternCap.setMatrixAt(i, matrix)
      })
      for (const m of [lanternBody, lanternCap, lanternHalo]) m.instanceMatrix.needsUpdate = true
      for (const s of shrines) {
        s.g.visible = Math.hypot(s.def.x - player.x, s.def.z - player.z) < SHOW_RADIUS
        if (!s.g.visible) continue
        const y = 3.1 + Math.sin(time * 1.8 + s.def.x) * 0.15
        s.orb.position.y = s.halo.position.y = s.ring.position.y = y
        s.orb.rotation.y = time * 1.2
        s.ring.rotation.x = time * 0.9
        s.ring.rotation.y = time * 0.5
      }
      for (const r of races) {
        const near = Math.hypot(r.course.start.x - player.x, r.course.start.z - player.z) < SHOW_RADIUS + 60
        r.gate.visible = near
        r.gateRing.rotation.y = time * 0.8
        r.gateRing.scale.setScalar(1 + Math.sin(time * 3) * 0.05)
        for (const mesh of r.rings) {
          if (!near && raceShown.id !== r.course.id) mesh.visible = false
          else if (raceShown.id !== r.course.id) mesh.visible = true
        }
      }
      nextRingMat.color.setHSL(0.12, 1, 0.55 + Math.sin(time * 8) * 0.12)
    },
    // Spins and bobs a star shard.
    animateShard(g, time, groundY) {
      g.rotation.y = time * 2.5
      g.position.y = groundY + 0.8 + Math.sin(time * 3 + g.position.x) * 0.15
    },
  }
}
