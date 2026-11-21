// The four storm peoples' own bodies (logic/species.js), built from primitives -- no longer the player's jelly with ears:
//   Dunekin   - tall, slender desert folk in flowing robes and a head-wrap, huge fennec ears, a curved staff.
//   Frostkin  - plump bird-folk: a feathered body, a beak, a crest, wings for arms that flap, a fanned tail, talons.
//   Embervolk - huge rock-folk: a boulder body with ridged stone plates on the back, glowing cracks, great arms.
//   Mirefolk  - sleek fish-folk: a smooth body, a long head-fin sweeping back like a tail, big glossy eyes, arm fins.
// A champion (the people's hero) is built bigger, with gear of their own and a soft glow at their feet.
// `buildSpecies(speciesId, color, { champion })` -> a Group standing on y = 0, facing +z, with `userData.rig`;
// `animateSpecies(mesh, time, speed, dt)` swings the legs / arms / wings and bobs the body.
import * as THREE from 'three'
import { championOf } from './logic/species.js'

const mats = new Map()
// Shared materials by colour (many villagers share a palette).
function mat(color, { emissive = 0, rough = 0.6, metal = 0 } = {}) {
  const key = `${color}:${emissive}:${rough}:${metal}`
  if (!mats.has(key)) {
    const m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, flatShading: true, emissive: emissive ? color : 0x000000, emissiveIntensity: emissive })
    m.userData.shared = true
    mats.set(key, m)
  }
  return mats.get(key)
}
const glowMat = (color, opacity = 0.85) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false })
function mesh(parent, geometry, material, pos = [0, 0, 0], rot = [0, 0, 0], scale = null) {
  const m = new THREE.Mesh(geometry, material)
  m.position.set(...pos)
  m.rotation.set(...rot)
  if (scale) m.scale.set(...scale)
  m.castShadow = true
  parent.add(m)
  return m
}
// A pivot group at `pos` (a hip, a shoulder), so a limb can swing from its top.
function joint(parent, pos) {
  const g = new THREE.Group()
  g.position.set(...pos)
  parent.add(g)
  return g
}
const shade = (color, k) => new THREE.Color(color).multiplyScalar(k).getHex()
const eye = (parent, x, y, z, r = 0.09, iris = 0x1a1410) => {
  mesh(parent, new THREE.SphereGeometry(r, 10, 8), mat(0xffffff, { rough: 0.2 }), [x, y, z])
  mesh(parent, new THREE.SphereGeometry(r * 0.55, 8, 6), mat(iris, { rough: 0.15 }), [x, y, z + r * 0.62])
}
// The face's mood pieces: a brow over each eye (on a pivot, so it can tilt), a mouth that frowns or smiles, and a bead of
// sweat. `eyeX/eyeY/eyeZ` is the right eye; `mouth` is [y, z, width] (none: the mouth is hidden, e.g. under a veil).
function moodFace(head, { eyeX, eyeY, eyeZ, r, browColor, mouth = null, mouthColor = 0x2a1410 }) {
  const brows = [-1, 1].map((side) => {
    const pivot = joint(head, [side * eyeX, eyeY + r * 1.45, eyeZ + r * 0.3])
    mesh(pivot, new THREE.BoxGeometry(r * 2.3, r * 0.45, r * 0.5), mat(browColor, { rough: 0.9 }))
    pivot.userData.side = side
    return pivot
  })
  let mouthMesh = null
  if (mouth) {
    const [y, z, w] = mouth
    mouthMesh = mesh(head, new THREE.TorusGeometry(w, w * 0.22, 5, 12, Math.PI), mat(mouthColor), [0, y, z])
  }
  const sweat = mesh(head, new THREE.SphereGeometry(r * 0.45, 8, 6), new THREE.MeshStandardMaterial({ color: 0x9fdcff, roughness: 0.05, transparent: true, opacity: 0.85 }), [eyeX + r * 1.6, eyeY + r * 1.2, eyeZ - r * 0.4], [0, 0, 0], [0.8, 1.25, 0.8])
  return { brows, mouth: mouthMesh, sweat }
}

// ---- Dunekin -------------------------------------------------------------------------------------------------------
function dunekin(root, color, champion) {
  const robe = champion ? champion.gear : [0xf0e2c0, 0xc0442e, 0x2a8f9a, 0xe8c890][Math.floor(Math.abs(color) % 4)]
  const body = joint(root, [0, 0, 0])
  const legs = [-1, 1].map((s) => {
    const hip = joint(body, [s * 0.18, 1.1, 0])
    mesh(hip, new THREE.CylinderGeometry(0.09, 0.08, 1.0, 6), mat(shade(color, 0.85)), [0, -0.5, 0])
    mesh(hip, new THREE.BoxGeometry(0.18, 0.1, 0.34), mat(0x6a4a2a), [0, -1.02, 0.08]) // sandals
    return hip
  })
  mesh(body, new THREE.ConeGeometry(0.62, 1.5, 9, 1, true), mat(robe, { rough: 0.8 }), [0, 1.15, 0]) // the flowing robe
  mesh(body, new THREE.CylinderGeometry(0.26, 0.34, 0.75, 8), mat(robe, { rough: 0.8 }), [0, 1.85, 0])
  mesh(body, new THREE.TorusGeometry(0.33, 0.06, 6, 14), mat(0xffd070, { metal: 0.6, rough: 0.3 }), [0, 1.62, 0], [Math.PI / 2, 0, 0]) // sash
  const head = joint(body, [0, 2.42, 0])
  mesh(head, new THREE.SphereGeometry(0.27, 12, 10), mat(color), [0, 0, 0], [0, 0, 0], [0.92, 1.05, 1])
  mesh(head, new THREE.ConeGeometry(0.12, 0.26, 5), mat(shade(color, 0.92)), [0, -0.04, 0.27], [Math.PI / 2, 0, 0]) // a pointed snout
  mesh(head, new THREE.SphereGeometry(0.04, 6, 5), mat(0x2a1a14), [0, -0.02, 0.4])
  eye(head, -0.11, 0.07, 0.2, 0.07, 0xc88a1a)
  eye(head, 0.11, 0.07, 0.2, 0.07, 0xc88a1a)
  const mood = moodFace(head, { eyeX: 0.11, eyeY: 0.07, eyeZ: 0.2, r: 0.07, browColor: shade(color, 0.6) })
  for (const s of [-1, 1]) { // the great fennec ears
    mesh(head, new THREE.ConeGeometry(0.17, 0.85, 5), mat(color), [s * 0.22, 0.52, -0.05], [0, 0, -s * 0.32])
    mesh(head, new THREE.ConeGeometry(0.1, 0.6, 5), mat(0xffd6c0), [s * 0.22, 0.5, 0.0], [0, 0, -s * 0.32])
  }
  mesh(head, new THREE.TorusGeometry(0.27, 0.08, 6, 14), mat(robe, { rough: 0.8 }), [0, 0.12, 0], [Math.PI / 2 - 0.1, 0, 0]) // head-wrap
  mesh(head, new THREE.CylinderGeometry(0.24, 0.3, 0.2, 10, 1, true), mat(robe, { rough: 0.8 }), [0, -0.14, 0.04]) // a veil over the jaw
  const arms = [-1, 1].map((s) => {
    const sh = joint(body, [s * 0.36, 2.05, 0])
    mesh(sh, new THREE.CylinderGeometry(0.1, 0.13, 0.85, 6), mat(robe, { rough: 0.8 }), [0, -0.4, 0])
    mesh(sh, new THREE.SphereGeometry(0.08, 6, 5), mat(color), [0, -0.86, 0])
    return sh
  })
  // A curved staff with a wind-chime of brass.
  mesh(arms[1], new THREE.CylinderGeometry(0.04, 0.04, 2.4, 5), mat(0x6a4a2a), [0.02, -0.5, 0.12])
  mesh(arms[1], new THREE.TorusGeometry(0.2, 0.04, 5, 10, Math.PI * 1.2), mat(0x6a4a2a), [0.15, 0.72, 0.12])
  mesh(arms[1], new THREE.SphereGeometry(0.09, 8, 6), glowMat(champion ? 0xffe08a : 0xffc870, 0.9), [0.32, 0.6, 0.12])
  if (champion) { // a wind-cape and a sun crest
    mesh(body, new THREE.PlaneGeometry(1.0, 1.8), new THREE.MeshStandardMaterial({ color: champion.gear, side: THREE.DoubleSide, roughness: 0.8 }), [0, 1.35, -0.38], [0.12, 0, 0])
    mesh(head, new THREE.TorusGeometry(0.2, 0.04, 6, 14), mat(0xffd070, { emissive: 0.4, metal: 0.7 }), [0, 0.38, 0.1], [0.2, 0, 0])
  }
  return { body, head, legs, arms, mood, height: 3.2, stride: 0.5 }
}

// ---- Frostkin (bird-folk) ---------------------------------------------------------------------------------------------
function frostkin(root, color, champion) {
  const accent = champion ? champion.gear : [0x3a7ac8, 0x8a5ac8, 0x3aa8a8, 0xc85a6a][Math.floor(Math.abs(color) % 4)]
  const body = joint(root, [0, 0, 0])
  const legs = [-1, 1].map((s) => {
    const hip = joint(body, [s * 0.22, 0.62, 0])
    mesh(hip, new THREE.CylinderGeometry(0.06, 0.05, 0.6, 5), mat(0xe8a040), [0, -0.3, 0])
    for (const t of [-0.5, 0, 0.5]) mesh(hip, new THREE.ConeGeometry(0.04, 0.24, 4), mat(0xe8a040), [Math.sin(t) * 0.1, -0.6, 0.1 + Math.cos(t) * 0.06], [Math.PI / 2, 0, t]) // talons
    return hip
  })
  mesh(body, new THREE.SphereGeometry(0.7, 12, 10), mat(color, { rough: 0.9 }), [0, 1.25, 0], [0, 0, 0], [1, 1.12, 0.95]) // the plump feathered body
  mesh(body, new THREE.SphereGeometry(0.5, 10, 8), mat(0xffffff, { rough: 0.95 }), [0, 1.12, 0.3], [0, 0, 0], [1, 1.2, 0.7]) // a pale breast
  mesh(body, new THREE.TorusGeometry(0.46, 0.12, 6, 16), mat(accent, { rough: 0.9 }), [0, 1.8, 0.02], [Math.PI / 2 - 0.15, 0, 0]) // a woolly scarf
  mesh(body, new THREE.BoxGeometry(0.22, 0.5, 0.06), mat(accent, { rough: 0.9 }), [0.25, 1.55, 0.48], [0.2, 0, 0.15])
  const head = joint(body, [0, 2.12, 0.05])
  mesh(head, new THREE.SphereGeometry(0.42, 12, 10), mat(color, { rough: 0.9 }))
  mesh(head, new THREE.ConeGeometry(0.13, 0.42, 6), mat(0xf0b030, { rough: 0.4 }), [0, -0.06, 0.52], [Math.PI / 2, 0, 0]) // the beak
  mesh(head, new THREE.ConeGeometry(0.09, 0.2, 6), mat(0xd08a20, { rough: 0.4 }), [0, -0.15, 0.42], [Math.PI / 2 + 0.3, 0, 0])
  eye(head, -0.18, 0.08, 0.32, 0.09)
  eye(head, 0.18, 0.08, 0.32, 0.09)
  const mood = moodFace(head, { eyeX: 0.18, eyeY: 0.08, eyeZ: 0.32, r: 0.09, browColor: accent, mouth: [-0.24, 0.36, 0.08], mouthColor: 0xb06a10 })
  for (let i = 0; i < 4; i++) mesh(head, new THREE.ConeGeometry(0.06, 0.55 - i * 0.07, 4), mat(i % 2 ? accent : color, { rough: 0.9 }), [0, 0.38, -0.08 - i * 0.1], [-0.6 - i * 0.18, 0, 0]) // the crest
  // Wings for arms: a long feathered blade from each shoulder, with feather tips.
  const arms = [-1, 1].map((s) => {
    const sh = joint(body, [s * 0.62, 1.55, 0])
    sh.rotation.z = s * 0.25
    mesh(sh, new THREE.BoxGeometry(0.12, 1.1, 0.5), mat(color, { rough: 0.9 }), [s * 0.12, -0.45, -0.05], [0, 0, s * 0.1])
    for (let i = 0; i < 4; i++) mesh(sh, new THREE.BoxGeometry(0.06, 0.5, 0.14), mat(i % 2 ? accent : shade(color, 0.85), { rough: 0.9 }), [s * 0.16, -1.0 - i * 0.04, -0.2 + i * 0.12], [0.1 * i, 0, s * 0.18])
    return sh
  })
  const tail = joint(body, [0, 0.95, -0.6])
  for (let i = 0; i < 5; i++) mesh(tail, new THREE.BoxGeometry(0.14, 0.05, 0.7), mat(i % 2 ? accent : color, { rough: 0.9 }), [(i - 2) * 0.1, 0, -0.3], [0.3, (i - 2) * 0.25, 0])
  if (champion) { // a quiver and a bow slung across the back, and a feather circlet
    mesh(body, new THREE.CylinderGeometry(0.12, 0.12, 0.9, 7), mat(0x6a4a32), [0.25, 1.5, -0.62], [0.3, 0, -0.4])
    mesh(body, new THREE.TorusGeometry(0.75, 0.035, 5, 18, Math.PI), mat(0x8a6a4a), [-0.1, 1.4, -0.7], [0, 0, Math.PI / 2 + 0.4])
    mesh(head, new THREE.TorusGeometry(0.42, 0.04, 5, 16), mat(0xbfeaff, { emissive: 0.5 }), [0, 0.18, 0], [Math.PI / 2, 0, 0])
  }
  return { body, head, legs, arms, tail, mood, wings: true, height: 2.9, stride: 0.6 }
}

// ---- Embervolk (rock-folk) --------------------------------------------------------------------------------------------
function embervolk(root, color, champion) {
  const rock = shade(color, 0.55)
  const crack = champion ? champion.gear : 0xff6a1a
  const body = joint(root, [0, 0, 0])
  const legs = [-1, 1].map((s) => {
    const hip = joint(body, [s * 0.4, 0.62, 0])
    mesh(hip, new THREE.CylinderGeometry(0.22, 0.26, 0.6, 7), mat(rock, { rough: 0.95 }), [0, -0.3, 0])
    mesh(hip, new THREE.DodecahedronGeometry(0.28), mat(shade(rock, 0.9), { rough: 0.95 }), [0, -0.55, 0.08], [0, 0, 0], [1, 0.55, 1.2])
    return hip
  })
  mesh(body, new THREE.DodecahedronGeometry(1.0), mat(color, { rough: 0.95 }), [0, 1.55, 0], [0.2, 0.4, 0], [1.08, 1.0, 0.95]) // the boulder body
  mesh(body, new THREE.DodecahedronGeometry(0.62), mat(shade(color, 1.15), { rough: 0.95 }), [0, 1.35, 0.42], [0, 0, 0], [1, 1, 0.6]) // a paler belly
  for (let i = 0; i < 6; i++) { // ridged stone plates down the back
    const a = (i / 5 - 0.5) * 1.6
    mesh(body, new THREE.ConeGeometry(0.28, 0.75, 5), mat(rock, { rough: 0.95 }), [Math.sin(a) * 0.55, 1.6 + Math.cos(a) * 0.55, -0.7], [-0.9, 0, -a * 0.8])
  }
  for (let i = 0; i < 3; i++) mesh(body, new THREE.BoxGeometry(0.06, 0.55, 0.05), glowMat(crack, 0.9), [-0.4 + i * 0.4, 1.45 + (i % 2) * 0.2, 0.86], [0, 0, (i - 1) * 0.5]) // glowing cracks
  const head = joint(body, [0, 2.55, 0.25])
  mesh(head, new THREE.DodecahedronGeometry(0.42), mat(color, { rough: 0.95 }), [0, 0, 0], [0, 0, 0], [1.1, 0.85, 1])
  eye(head, -0.15, 0.02, 0.33, 0.07, 0x8a2a0a)
  eye(head, 0.15, 0.02, 0.33, 0.07, 0x8a2a0a)
  const mood = moodFace(head, { eyeX: 0.15, eyeY: 0.0, eyeZ: 0.36, r: 0.07, browColor: 0x2a1a18, mouth: [-0.2, 0.37, 0.12] })
  for (const s of [-1, 1]) mesh(head, new THREE.ConeGeometry(0.1, 0.45, 5), mat(0x2a1a18), [s * 0.36, 0.28, -0.05], [-0.3, 0, -s * 0.8]) // stubby horns
  const arms = [-1, 1].map((s) => { // great long arms, knuckles nearly to the ground
    const sh = joint(body, [s * 1.0, 1.95, 0.05])
    mesh(sh, new THREE.DodecahedronGeometry(0.38), mat(rock, { rough: 0.95 }), [0, 0, 0])
    mesh(sh, new THREE.CylinderGeometry(0.22, 0.28, 1.1, 7), mat(color, { rough: 0.95 }), [s * 0.06, -0.6, 0])
    mesh(sh, new THREE.DodecahedronGeometry(0.34), mat(rock, { rough: 0.95 }), [s * 0.08, -1.25, 0.05])
    return sh
  })
  if (champion) { // a molten sash and a crown of ember crystals
    mesh(body, new THREE.TorusGeometry(0.98, 0.09, 6, 18), mat(champion.gear, { emissive: 0.5 }), [0, 1.3, 0], [Math.PI / 2 + 0.2, 0, 0.3])
    for (let i = 0; i < 3; i++) mesh(head, new THREE.OctahedronGeometry(0.13), glowMat(0xffa83a, 0.95), [(i - 1) * 0.2, 0.42, -0.02], [0, 0, 0], [0.8, 1.8, 0.8])
  }
  return { body, head, legs, arms, mood, height: 3.3, stride: 0.35 }
}

// ---- Mirefolk (fish-folk) -----------------------------------------------------------------------------------------------
function mirefolk(root, color, champion) {
  const belly = 0xf0f6e8
  const fin = champion ? champion.gear : shade(color, 1.25)
  const body = joint(root, [0, 0, 0])
  const legs = [-1, 1].map((s) => {
    const hip = joint(body, [s * 0.18, 1.05, 0])
    mesh(hip, new THREE.CylinderGeometry(0.1, 0.08, 1.0, 6), mat(color, { rough: 0.3 }), [0, -0.5, 0])
    mesh(hip, new THREE.ConeGeometry(0.16, 0.36, 5), mat(shade(color, 0.85), { rough: 0.3 }), [0, -1.0, 0.12], [Math.PI / 2, 0, 0]) // webbed feet
    return hip
  })
  mesh(body, new THREE.CapsuleGeometry(0.34, 0.8, 4, 10), mat(color, { rough: 0.25, metal: 0.1 }), [0, 1.62, 0], [0, 0, 0], [1, 1, 0.8]) // a sleek body
  mesh(body, new THREE.CapsuleGeometry(0.24, 0.6, 4, 8), mat(belly, { rough: 0.3 }), [0, 1.55, 0.14], [0, 0, 0], [1, 1, 0.6])
  for (let i = 0; i < 4; i++) mesh(body, new THREE.SphereGeometry(0.045, 6, 4), glowMat(0x9affe0, 0.95), [i % 2 ? 0.22 : -0.22, 1.35 + i * 0.18, 0.2]) // glowing spots
  const head = joint(body, [0, 2.38, 0.02])
  mesh(head, new THREE.SphereGeometry(0.33, 12, 10), mat(color, { rough: 0.25 }), [0, 0, 0], [0, 0, 0], [1, 1.15, 1.05])
  // The long head-fin: it sweeps back and down like a tail, ending in a fan.
  const headFin = joint(head, [0, 0.12, -0.15])
  mesh(headFin, new THREE.ConeGeometry(0.2, 1.3, 7), mat(color, { rough: 0.25 }), [0, -0.3, -0.55], [-2.3, 0, 0])
  mesh(headFin, new THREE.ConeGeometry(0.22, 0.5, 4), mat(fin, { rough: 0.3 }), [0, -0.85, -0.95], [-2.8, 0, 0], [1.6, 1, 0.2])
  mesh(head, new THREE.BoxGeometry(0.04, 0.45, 0.6), mat(fin, { rough: 0.3 }), [0, 0.3, -0.05], [0.3, 0, 0]) // a crest fin
  eye(head, -0.15, 0.06, 0.25, 0.11, 0x0a2a3a)
  eye(head, 0.15, 0.06, 0.25, 0.11, 0x0a2a3a)
  const mood = moodFace(head, { eyeX: 0.15, eyeY: 0.06, eyeZ: 0.25, r: 0.08, browColor: shade(color, 0.55), mouth: [-0.17, 0.31, 0.09], mouthColor: shade(color, 0.45) })
  for (const s of [-1, 1]) mesh(head, new THREE.ConeGeometry(0.1, 0.3, 4), mat(fin, { rough: 0.3 }), [s * 0.32, 0.02, -0.02], [0, 0, -s * 1.3], [1, 1, 0.25]) // gill fins
  const arms = [-1, 1].map((s) => {
    const sh = joint(body, [s * 0.4, 1.98, 0])
    mesh(sh, new THREE.CylinderGeometry(0.08, 0.1, 0.85, 6), mat(color, { rough: 0.3 }), [0, -0.42, 0])
    mesh(sh, new THREE.ConeGeometry(0.16, 0.5, 4), mat(fin, { rough: 0.3 }), [s * 0.09, -0.35, -0.12], [-0.4, 0, 0], [0.3, 1, 1]) // forearm fins
    mesh(sh, new THREE.SphereGeometry(0.08, 6, 5), mat(color, { rough: 0.3 }), [0, -0.88, 0])
    return sh
  })
  // A lantern on a reed, glowing green.
  mesh(arms[0], new THREE.CylinderGeometry(0.025, 0.025, 1.2, 4), mat(0x6a8a3a), [0, -0.6, 0.25], [0.6, 0, 0])
  mesh(arms[0], new THREE.SphereGeometry(champion ? 0.2 : 0.13, 8, 6), glowMat(champion ? champion.gear : 0xb8ff8a, 0.95), [0, -0.15, 0.6])
  if (champion) { // a pearl circlet and a flowing shawl of kelp
    mesh(head, new THREE.TorusGeometry(0.34, 0.035, 5, 16), mat(0xf4f0ff, { emissive: 0.3, rough: 0.2 }), [0, 0.18, 0], [Math.PI / 2, 0, 0])
    mesh(body, new THREE.PlaneGeometry(0.8, 1.4), new THREE.MeshStandardMaterial({ color: 0x2a7a5a, side: THREE.DoubleSide, roughness: 0.6 }), [0, 1.55, -0.32], [0.1, 0, 0])
  }
  return { body, head, legs, arms, headFin, mood, height: 3.1, stride: 0.5 }
}

const BUILDERS = { dunekin, frostkin, embervolk, mirefolk }

// Builds one of the four peoples. `champion` (bool) makes it that people's champion: bigger, with gear and a glow.
export function buildSpecies(speciesId, color, { champion = false } = {}) {
  const root = new THREE.Group()
  const champ = champion ? championOf(speciesId) : null
  const rig = BUILDERS[speciesId]?.(root, color, champ) ?? dunekin(root, color, null)
  const scale = champion ? 1.25 : 0.95 + ((color >> 3) % 5) * 0.03
  root.scale.setScalar(scale)
  if (champ) { // a soft ring of the people's colour at the champion's feet, so you spot them across the town
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.25, 28), glowMat(champ.gear, 0.55))
    ring.rotation.x = -Math.PI / 2
    ring.position.y = 0.06
    root.add(ring)
    rig.ring = ring
  }
  rig.phase = Math.random() * 10
  rig.scale = scale
  rig.worried = true
  rig.champion = Boolean(champ)
  root.userData.rig = rig
  root.userData.speciesId = speciesId
  setMood(root, true)
  return root
}

// Worried (their storm still rages: brows up in the middle, a frown, a bead of sweat, fidgeting and nervous glances) or
// at peace (their storm is calm: relaxed brows and a smile). Champions look grimly determined rather than scared.
export function setMood(root, worried) {
  const rig = root.userData.rig
  if (!rig?.mood) return
  rig.worried = worried
  const { brows, mouth, sweat } = rig.mood
  for (const b of brows) b.rotation.z = worried ? (rig.champion ? -0.3 : 0.45) * b.userData.side * -1 : -0.08 * b.userData.side * -1
  if (mouth) {
    mouth.rotation.z = worried ? 0 : Math.PI // a TorusGeometry arc of PI is a frown; turned over, a smile
    mouth.position.y = rig.mood.mouthY ??= mouth.position.y
    if (!worried) mouth.position.y = rig.mood.mouthY + 0.04
  }
  sweat.visible = worried && !rig.champion
}

// One frame of life: legs and arms swing with the walk (wings flap), the body bobs, the head looks about when idle.
export function animateSpecies(root, time, speed = 0, dt = 0.016) {
  const rig = root.userData.rig
  if (!rig) return
  const moving = speed > 0.05
  rig.phase += dt * (moving ? 2 + speed * 2.2 : 0)
  const swing = moving ? Math.sin(rig.phase * 3) * rig.stride : 0
  rig.legs.forEach((leg, i) => (leg.rotation.x = i ? swing : -swing))
  if (rig.wings) { // Frostkin wings flap gently, and harder on the move
    const flap = Math.sin(time * (moving ? 9 : 2.2) + rig.phase) * (moving ? 0.5 : 0.12)
    const fret = !moving && rig.worried && !rig.champion // (worried: wings hugged in front, fidgeting)
    rig.arms.forEach((arm, i) => {
      arm.rotation.z = (i ? 1 : -1) * (0.25 + flap)
      arm.rotation.x = fret ? -0.7 + Math.sin(time * 5 + i * 1.7) * 0.12 : 0
    })
    if (rig.tail) rig.tail.rotation.x = Math.sin(time * 1.7) * 0.12
  } else if (!moving && rig.worried && !rig.champion) {
    // Wringing their hands: both arms drawn in to the front, fidgeting.
    rig.arms.forEach((arm, i) => {
      arm.rotation.x = -0.75 + Math.sin(time * 5 + i * 1.7) * 0.12
      arm.rotation.z = (i ? 1 : -1) * (0.35 + Math.sin(time * 4.2 + i) * 0.06)
    })
  } else rig.arms.forEach((arm, i) => {
    arm.rotation.x = (i ? -swing : swing) * 0.8 + Math.sin(time * 1.3 + i) * 0.04
    arm.rotation.z = 0
  })
  rig.body.position.y = moving ? Math.abs(Math.sin(rig.phase * 3)) * 0.08 : Math.sin(time * 1.6 + rig.phase) * 0.025
  if (moving) rig.head.rotation.y = 0
  else if (rig.worried && !rig.champion) {
    // Nervous glances: the head snaps from side to side now and then, and they tremble a little.
    const beat = Math.floor(time * 0.7 + rig.phase)
    const look = Math.sin(beat * 12.9898) * 0.8
    rig.head.rotation.y += (look - rig.head.rotation.y) * Math.min(1, dt * 10)
    rig.head.rotation.x = 0.12 // head down
    rig.body.position.x = Math.sin(time * 31 + rig.phase) * 0.012 // a tremble
    if (rig.mood?.sweat?.visible) rig.mood.sweat.position.y += Math.sin(time * 3) * 0.0006
  } else {
    rig.head.rotation.y = Math.sin(time * 0.4 + rig.phase) * 0.35
    rig.head.rotation.x = 0
    rig.body.position.x = 0
  }
  if (rig.headFin) rig.headFin.rotation.x = Math.sin(time * 2.4 + rig.phase) * 0.15
  if (rig.ring) {
    rig.ring.material.opacity = 0.4 + Math.sin(time * 3) * 0.15
    rig.ring.scale.setScalar(1 + Math.sin(time * 1.5) * 0.08)
  }
}

export const speciesHeight = (root) => (root.userData.rig?.height ?? 3) * (root.userData.rig?.scale ?? 1)
