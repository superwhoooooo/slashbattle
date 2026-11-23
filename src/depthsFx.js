// The look of the chasms and of the Depths' landmarks (rules in src/logic/depths.js):
//   on the surface: a black pit with a glowing violet lip, a ring of dark rocks and a faint beam of violet light that
//   shows from far across the land (it ignores the fog), so a chasm can be found;
//   in the Depths: a Lightroot (a tall pillar of pale light that fills as it charges) beside every chasm's drop, and
//   the floating Umbral Hearts in their lairs (each with a magenta beam you can steer by).
import * as THREE from 'three'
import { beacons, chasms, colosseumGlow, colosseums, depthsLairs } from './logic/depths.js'
import { heightAt, withSurface } from './logic/world.js'

const BEAM_HEIGHT = 90

function beamMaterial(color, opacity) {
  return new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, fog: false })
}

function buildChasm(c) {
  const group = new THREE.Group()
  // The pit itself, as black as the cavern: every vertex sits on the hills just above the grass.
  const geometry = new THREE.RingGeometry(0.001, c.radius * 1.02, 56, 7)
  geometry.rotateX(-Math.PI / 2)
  const pos = geometry.attributes.position
  for (let i = 0; i < pos.count; i++) pos.setY(i, withSurface(() => heightAt(c.x + pos.getX(i), c.z + pos.getZ(i))) + 0.14)
  const pit = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 0x03010a, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }))
  pit.position.set(c.x, 0, c.z)
  pit.renderOrder = 2
  group.add(pit)
  // A glowing lip that breathes.
  const lipGeometry = new THREE.RingGeometry(c.radius * 0.78, c.radius * 1.12, 56, 1)
  lipGeometry.rotateX(-Math.PI / 2)
  const lip = new THREE.Mesh(lipGeometry, new THREE.MeshBasicMaterial({ color: 0x9a5aff, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }))
  lip.position.set(c.x, c.y + 0.3, c.z)
  lip.renderOrder = 3
  group.add(lip)
  // Rocks around the rim.
  const rockGeometry = new THREE.DodecahedronGeometry(1, 0)
  const rockMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2236, roughness: 1, flatShading: true })
  const count = Math.round(c.radius * 1.5)
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + Math.sin(i * 12.9898) * 0.12
    const d = c.radius * (1.04 + 0.09 * Math.abs(Math.sin(i * 4.1)))
    const x = c.x + Math.cos(a) * d
    const z = c.z + Math.sin(a) * d
    const s = 0.7 + 0.8 * Math.abs(Math.sin(i * 7.3))
    const rock = new THREE.Mesh(rockGeometry, rockMaterial)
    rock.scale.set(s * 1.3, s, s * 1.1)
    rock.rotation.set(i, i * 2, 0)
    rock.position.set(x, withSurface(() => heightAt(x, z)) + s * 0.3, z)
    rock.castShadow = true
    group.add(rock)
  }
  // A faint violet beam from the pit, and a few motes drifting up out of it.
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(c.radius * 0.35, c.radius * 0.7, BEAM_HEIGHT, 14, 1, true), beamMaterial(0x9a5aff, 0.1))
  beam.position.set(c.x, c.y + BEAM_HEIGHT / 2, c.z)
  group.add(beam)
  return { group, lip, beam, def: c }
}

function buildBeacon(b) {
  const group = new THREE.Group()
  group.position.set(b.x, 0, b.z)
  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 1.1, BEAM_HEIGHT, 12, 1, true), beamMaterial(0xcfe8ff, 0.28))
  core.position.y = BEAM_HEIGHT / 2
  const halo = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.6, BEAM_HEIGHT, 14, 1, true), beamMaterial(0x6a9aff, 0.1))
  halo.position.y = BEAM_HEIGHT / 2
  const ring = new THREE.Mesh(new THREE.RingGeometry(2.0, 2.8, 40), new THREE.MeshBasicMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }))
  ring.rotation.x = -Math.PI / 2
  const fill = new THREE.Mesh(new THREE.CircleGeometry(2.8, 40), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }))
  fill.rotation.x = -Math.PI / 2
  group.add(core, halo, ring, fill)
  return { group, ring, fill, core, halo, def: b }
}

function buildRelic(lair) {
  const group = new THREE.Group()
  group.position.set(lair.relic.x, 0, lair.relic.z)
  const heart = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9, 1), new THREE.MeshStandardMaterial({ color: 0x2a0a40, emissive: 0xd23aff, emissiveIntensity: 1.6, roughness: 0.3, flatShading: true }))
  const shell = new THREE.Mesh(new THREE.OctahedronGeometry(1.5, 0), new THREE.MeshBasicMaterial({ color: 0xd23aff, wireframe: true, transparent: true, opacity: 0.6 }))
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.9, BEAM_HEIGHT, 10, 1, true), beamMaterial(0xd23aff, 0.16))
  beam.position.y = BEAM_HEIGHT / 2
  group.add(heart, shell, beam)
  return { group, heart, shell, def: lair }
}

// A storm colosseum's marker: a tall beam in its storm's colour over the sand, with a slow ring, until its champion is beaten.
function buildColosseum(c) {
  const group = new THREE.Group()
  group.position.set(c.x, 0, c.z)
  const glow = colosseumGlow(c)
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 3, BEAM_HEIGHT * 1.4, 14, 1, true), beamMaterial(glow, 0.2))
  beam.position.y = BEAM_HEIGHT * 0.7
  const ring = new THREE.Mesh(new THREE.TorusGeometry(6, 0.18, 6, 48), new THREE.MeshBasicMaterial({ color: glow, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }))
  ring.rotation.x = Math.PI / 2
  ring.position.y = 0.8
  group.add(beam, ring)
  return { group, beam, ring, def: c }
}

export function createDepthsFx() {
  const group = new THREE.Group()
  const surface = new THREE.Group()
  const under = new THREE.Group()
  under.visible = false
  group.add(surface, under)
  const pits = chasms().map((c) => {
    const built = buildChasm(c)
    surface.add(built.group)
    return built
  })
  const roots = beacons().map((b) => {
    const built = buildBeacon(b)
    under.add(built.group)
    return built
  })
  const hearts = depthsLairs().map((l) => {
    const built = buildRelic(l)
    under.add(built.group)
    return built
  })
  const arenas = colosseums().map((c) => {
    const built = buildColosseum(c)
    under.add(built.group)
    return built
  })
  let depths = false
  return {
    group,
    // The Depths are showing: the pits go, the Lightroots and Hearts come (call after setDepthsMode, so the ground is the cavern's).
    setDepths(on) {
      depths = Boolean(on)
      surface.visible = !depths
      under.visible = depths
      if (depths) {
        for (const r of roots) r.group.position.y = heightAt(r.def.x, r.def.z)
        for (const h of hearts) h.group.position.y = heightAt(h.def.relic.x, h.def.relic.z)
        for (const a of arenas) a.group.position.y = heightAt(a.def.x, a.def.z)
      }
    },
    // Hearts already claimed are gone (a Set of relic ids).
    setRelicsTaken(ids) {
      for (const h of hearts) h.group.visible = !ids.has(h.def.relic.id)
    },
    // Colosseums whose champion is beaten lose their beam (a Set of colosseum ids).
    setColossiBeaten(ids) {
      for (const a of arenas) a.group.visible = !ids.has(a.def.id)
    },
    // charging: { beaconId, fraction } or null.
    update(time, charging = null) {
      if (depths) {
        for (const r of roots) {
          const c = charging && charging.beaconId === r.def.id ? charging.fraction : 0
          r.fill.material.opacity = c * 0.8
          r.ring.scale.setScalar(1 + 0.08 * Math.sin(time * 3 + r.def.x) + c * 0.4)
          r.core.material.opacity = 0.28 + c * 0.5
          r.core.scale.set(1 + c * 1.5, 1, 1 + c * 1.5)
        }
        for (const a of arenas) {
          if (!a.group.visible) continue
          a.ring.rotation.z = time * 0.5
          a.ring.scale.setScalar(1 + 0.1 * Math.sin(time * 2 + a.def.x))
          a.beam.material.opacity = 0.16 + 0.06 * Math.sin(time * 1.3 + a.def.z)
        }
        for (const h of hearts) {
          if (!h.group.visible) continue
          h.heart.rotation.y = time * 1.4
          h.heart.position.y = 3 + Math.sin(time * 2 + h.def.x) * 0.35
          h.shell.rotation.set(time * 0.7, time * 1.1, 0)
          h.shell.position.y = h.heart.position.y
        }
      } else {
        for (const p of pits) p.lip.material.opacity = 0.42 + 0.2 * Math.sin(time * 1.6 + p.def.x)
      }
    },
  }
}
