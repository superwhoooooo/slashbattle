// The look of the cave mouths (rules in logic/caves.js): a lumpy rock outcrop with a stone-framed, pitch-black
// doorway, hanging lanterns, mossy lumps and glowing crystals. Land caves are brown rock with moss and amber light;
// isle caves are pale cloud-stone with teal light. One merged lit mesh and one glow mesh per cave.
import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { mulberry32 } from './logic/world.js'
import { CAVE_DOOR_DISTANCE, caves } from './logic/caves.js'
import { box, cone, ico, limb, part } from './worldModelKit.js'

const SHOW_LAND = 190
const SHOW_ISLE = 300

const LOOKS = {
  land: { rock: [0x7a6f66, 0x8a7c70, 0x6c625b], moss: 0x5a8a4a, glow: 0xffc87a, frame: 0x5d544e },
  isle: { rock: [0xb8c2d8, 0xcfd8ea, 0xa8b2cc], moss: 0x8fd6b0, glow: 0x7ff0d8, frame: 0x8a93ad },
}

function buildCave(cave) {
  const look = LOOKS[cave.kind]
  const rand = mulberry32(cave.index * 977 + 31)
  const g = new THREE.Group()
  g.position.set(cave.rock.x, cave.y, cave.rock.z)
  g.rotation.y = -cave.face // local +x is the way the doorway looks
  const lit = []
  const glow = []
  // The rock: one big lump, ringed with smaller ones, mossy on top.
  const pick = () => look.rock[Math.floor(rand() * look.rock.length)]
  lit.push(part(ico(4.3, 1), pick(), { y: 1.6, sy: 0.82 }))
  for (let i = 0; i < 9; i++) {
    const a = rand() * Math.PI * 2
    // keep the doorway side (local +x, a ~ 0) clear of lumps
    if (Math.cos(a) > 0.55) continue
    const d = 2.2 + rand() * 1.8
    lit.push(part(ico(1.3 + rand() * 1.5, 1), pick(), { x: Math.cos(a) * d, y: 0.6 + rand() * 2.2, z: Math.sin(a) * d, sy: 0.85 }))
  }
  lit.push(part(ico(2.6, 1), look.moss, { x: -0.6, y: 3.9, sy: 0.35 }), part(ico(1.5, 1), look.moss, { x: -2.4, y: 3.0, z: 1.4, sy: 0.4 }))
  // The doorway: two stone posts, a lintel, a pitch-black recess and a glowing rim.
  const doorX = CAVE_DOOR_DISTANCE - 0.9
  for (const s of [-1, 1]) {
    lit.push(part(box(1.0, 3.6, 1.0), look.frame, { x: doorX, y: 1.8, z: s * 1.7 }))
    lit.push(part(ico(0.8, 1), look.rock[0], { x: doorX - 0.3, y: 0.5, z: s * 2.4 }))
  }
  lit.push(part(box(1.1, 0.9, 4.6), look.frame, { x: doorX, y: 3.8 }))
  lit.push(part(cone(0.9, 1.8, 5), look.frame, { x: doorX - 0.2, y: 4.9 }))
  // Crystals and a lantern on a post.
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + rand()
    glow.push(part(cone(0.22, 0.9 + rand() * 0.7, 5), look.glow, { x: Math.cos(a) * 3.6 - 0.3, y: 0.5, z: Math.sin(a) * 3.6, rz: (rand() - 0.5) * 0.5 }))
  }
  lit.push(limb([doorX + 1.3, 0, 3.0], [doorX + 1.3, 3.4, 3.0], 0.14, 0.12, look.frame, 5))
  glow.push(part(ico(0.3, 1), look.glow, { x: doorX + 1.3, y: 3.6, z: 3.0 }))
  glow.push(part(new THREE.TorusGeometry(1.6, 0.07, 4, 16, Math.PI).rotateY(Math.PI / 2), look.glow, { x: doorX + 0.45, y: 3.45 }))

  const litMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0.02, flatShading: true })
  const litMesh = new THREE.Mesh(mergeGeometries(lit), litMat)
  litMesh.castShadow = true
  litMesh.receiveShadow = true
  const glowMesh = new THREE.Mesh(mergeGeometries(glow), new THREE.MeshBasicMaterial({ vertexColors: true, color: new THREE.Color(1.8, 1.8, 1.8) }))
  g.add(litMesh, glowMesh)
  const dark = new THREE.MeshBasicMaterial({ color: 0x030308, side: THREE.DoubleSide })
  const hole = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 3.2), dark)
  hole.rotation.y = Math.PI / 2
  hole.position.set(doorX + 0.02, 1.7, 0)
  const tunnel = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.0, 3.2), dark)
  tunnel.position.set(doorX - 1.5, 1.6, 0)
  // A soft pulse of light spilling out of the opening.
  const spillMat = new THREE.MeshBasicMaterial({ color: look.glow, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
  const spill = new THREE.Mesh(new THREE.CircleGeometry(2.4, 20), spillMat)
  spill.rotation.y = Math.PI / 2
  spill.position.set(doorX + 0.05, 1.7, 0)
  g.add(hole, tunnel, spill)
  return { def: cave, group: g, spillMat }
}

export function createCavesFx() {
  const group = new THREE.Group()
  const built = caves().map((c) => {
    const b = buildCave(c)
    group.add(b.group)
    return b
  })
  return {
    group,
    // Show the caves near the player; pulse the doorway light.
    update(pos, time) {
      for (const b of built) {
        const d = Math.hypot(b.def.x - pos.x, b.def.z - pos.z)
        b.group.visible = d < (b.def.kind === 'isle' ? SHOW_ISLE : SHOW_LAND)
        if (b.group.visible) b.spillMat.opacity = 0.15 + 0.06 * Math.sin(time * 2 + b.def.index)
      }
    },
  }
}
