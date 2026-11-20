// The look of the Skylift towers and the sky isles (rules in logic/skyIslands.js). Each tower is a ring of tall
// rune-seamed stone pillars round a glowing launch pad, braced by rings and crowned with a beacon orb; an energy
// column fills it as it charges. Each archipelago is merged into one lit + one glow mesh (rocky, strata-banded
// isles with grassy tops, hanging roots, floating rubble, and their props), plus waterfalls spilling off the
// edges, an updraft column, the Sky Relic on the crown isle, and clouds drifting through. They use a thinner
// haze than the land's fog, so you can see the isles hanging in the sky from the ground far below.
import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { mulberry32 } from './logic/world.js'
import { PAD_RADIUS, TOWER_HEIGHT, TOWER_PILLARS, TOWER_RING, isleLayout, skyArchipelagos, skyTowers, towerShelter } from './logic/skyIslands.js'
import { towerIssue } from './logic/towerQuests.js'
import { box, cone, cyl, dodeca, dome, ico, limb, oct, part } from './worldModelKit.js'

const SHOW_TOWER = 900 // towers are visible from this far (they are landmarks)
const SHOW_ARCH = 650 // archipelagos further than this are hidden
const GLOW = 1.9 // glow parts are drawn this much brighter than their colour
const TEAL = 0x5ef2d6
const STONE = 0x8a8fa8
const STONE_DARK = 0x5d6178
const WOOD = 0x9a7a55
const WOOD_DARK = 0x6a4f38
const ROOF = 0xb5623f
const LANTERN = 0xffd58a

// A thinner haze than the land's fog (the isles and towers stay visible from far away), drawn in the fog's colour.
function haze(material, stretch = 4) {
  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <fog_fragment>',
      `#ifdef USE_FOG
        float hazeF = smoothstep(fogNear * 2.0, fogFar * ${stretch.toFixed(1)}, vFogDepth);
        gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, hazeF * 0.82);
      #endif`,
    )
  }
  material.customProgramCacheKey = () => `haze${stretch}`
  return material
}

const litMaterial = () => haze(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0.04, flatShading: true }))
const glowMaterial = () => haze(new THREE.MeshBasicMaterial({ vertexColors: true, color: new THREE.Color(GLOW, GLOW, GLOW) }))

// Deterministic noise from a position, so duplicated vertices (flat shading) always move together.
function hash3(x, y, z) {
  const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453
  return s - Math.floor(s)
}

function moveParts(parts, x, y, z, rot = 0, scale = 1) {
  for (const g of parts) {
    g.scale(scale, scale, scale)
    g.rotateY(rot)
    g.translate(x, y, z)
  }
  return parts
}

// ---- the isles' rock --------------------------------------------------------------------------------

const TOP_COLORS = {
  grove: [0x6fd68c, 0x4fbf78],
  ruins: [0x9fc79a, 0x86b08a],
  garden: [0x7fe39a, 0x6ad2a0],
  forge: [0x5b4a52, 0x6e5048],
  observatory: [0x8fc6c8, 0x77b2c0],
  crystal: [0xb9a8ec, 0xa395e0],
  shrine: [0x9ad7a8, 0x88c99c],
  crown: [0xf2e6b8, 0xe6d79a],
  islet: [0x79d39a, 0x63c08a],
}
const STRATA = [0xc9a27a, 0xb08866, 0xd8b98e, 0x9c7a62, 0xbfa489]

function isleRock(isle) {
  const R = isle.radius
  const D = isle.depth
  const profile = [
    [0.001, 0], [R * 0.55, 0.05], [R * 0.9, 0.02], [R, 0], [R * 1.03, -0.7], [R * 0.98, -D * 0.16], [R * 0.86, -D * 0.33],
    [R * 0.7, -D * 0.5], [R * 0.5, -D * 0.68], [R * 0.3, -D * 0.84], [R * 0.12, -D * 0.96], [0.001, -D],
  ].reverse().map(([r, y]) => new THREE.Vector2(r, y)) // bottom tip first, so the faces point outward
  const segs = Math.max(14, Math.round(R * 1.2))
  const g = new THREE.LatheGeometry(profile, segs).toNonIndexed()
  const pos = g.attributes.position
  const colors = new Float32Array(pos.count * 3)
  const top = TOP_COLORS[isle.kind] ?? TOP_COLORS.islet
  const c = new THREE.Color()
  const seed = isle.seed * 0.37
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i)
    let y = pos.getY(i)
    let z = pos.getZ(i)
    const r = Math.hypot(x, z)
    const a = Math.atan2(z, x)
    if (y < -0.3 && r > 0.01) {
      // A craggy underside: pushed in and out, and the layers jostled up and down.
      const n = hash3(Math.round(a * 20) + seed, Math.round(y * 2), seed)
      const k = 0.78 + n * 0.4
      x *= k
      z *= k
      y += (hash3(Math.round(a * 20), Math.round(y * 2) + 7, seed) - 0.5) * 1.6
    } else if (r > R * 0.95) {
      // The rim wobbles inward a touch (you can always stand right to the edge of the walkable circle).
      const k = 0.94 + hash3(Math.round(a * 20) + seed, 1, seed) * 0.06
      x *= k
      z *= k
    }
    pos.setXYZ(i, x, y, z)
    if (y > -0.25) c.set(top[hash3(Math.round(x * 0.5), 3, Math.round(z * 0.5)) > 0.5 ? 0 : 1])
    else if (y > -1.4) c.set(0x7a5a44) // the soil under the turf
    else {
      c.set(STRATA[Math.floor(Math.abs(y) / 2.6 + hash3(Math.round(a * 6), 2, seed) * 0.6) % STRATA.length])
      c.multiplyScalar(0.72 + 0.28 * (1 + y / D)) // darker toward the bottom
    }
    colors[i * 3] = c.r
    colors[i * 3 + 1] = c.g
    colors[i * 3 + 2] = c.b
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  g.deleteAttribute('uv')
  g.computeVertexNormals()
  g.translate(isle.x, isle.y, isle.z)
  const lit = [g]
  // Roots hanging from the underside, and rubble drifting around it.
  const rand = mulberry32(isle.seed * 31 + 5)
  for (let i = 0; i < Math.round(R * 0.5); i++) {
    const a = rand() * Math.PI * 2
    const r = R * (0.3 + rand() * 0.55)
    const len = 2 + rand() * 6
    const rootTop = -D * (0.18 + (r / R < 0.6 ? 0.4 : 0.05))
    lit.push(limb([isle.x + Math.cos(a) * r, isle.y + rootTop, isle.z + Math.sin(a) * r], [isle.x + Math.cos(a) * r * 0.95 + (rand() - 0.5), isle.y + rootTop - len, isle.z + Math.sin(a) * r * 0.95], 0.22, 0.04, rand() < 0.5 ? 0x5a8a4a : 0x6b4f3a, 4))
  }
  for (let i = 0; i < 2 + Math.round(R * 0.2); i++) {
    const a = rand() * Math.PI * 2
    const r = R * (1.15 + rand() * 0.5)
    const s = 0.6 + rand() * (R * 0.08)
    lit.push(part(dodeca(s), STRATA[i % STRATA.length], { x: isle.x + Math.cos(a) * r, y: isle.y - 2 - rand() * D * 0.6, z: isle.z + Math.sin(a) * r, rx: rand() * 3, ry: rand() * 3 }))
  }
  return lit
}

// ---- props ----------------------------------------------------------------------------------------

const BLOSSOM = [0xff9ec7, 0x9ff2d0, 0xffd27a, 0xb9a6ff, 0x7fe0ff]
function propParts(p, rand) {
  const lit = []
  const glow = []
  switch (p.kind) {
    case 'skytree': {
      const bend = (rand() - 0.5) * 1.2
      lit.push(limb([0, 0, 0], [bend * 0.4, 2.6, 0], 0.42, 0.3, 0x8a6a52), limb([bend * 0.4, 2.6, 0], [bend, 4.6, 0.2], 0.3, 0.18, 0x8a6a52))
      const col = BLOSSOM[Math.floor(rand() * BLOSSOM.length)]
      for (let k = 0; k < 4; k++) lit.push(part(ico(1.3 + rand() * 0.8, 1), k % 2 ? col : 0x6fd68c, { x: bend + (rand() - 0.5) * 2.2, y: 4.6 + rand() * 1.6, z: 0.2 + (rand() - 0.5) * 2.2 }))
      break
    }
    case 'shrub':
      lit.push(part(ico(0.6 + rand() * 0.4, 0), rand() < 0.3 ? BLOSSOM[Math.floor(rand() * 5)] : 0x5cc27e, { y: 0.35, sy: 0.75 }))
      break
    case 'boulder':
      lit.push(part(dodeca(0.8 + rand() * 0.7), 0x9a96a8, { y: 0.4, sy: 0.7, rx: rand(), ry: rand() * 3 }))
      break
    case 'pillar':
      lit.push(part(box(1.5, 0.5, 1.5), STONE_DARK, { y: 0.25 }), part(cyl(0.55, 0.62, 6, 8), STONE, { y: 3.4 }), part(box(1.6, 0.5, 1.6), STONE_DARK, { y: 6.6 }))
      glow.push(part(cyl(0.64, 0.64, 0.22, 8), TEAL, { y: 2.2 }), part(cyl(0.64, 0.64, 0.22, 8), TEAL, { y: 4.6 }))
      break
    case 'brokenPillar':
      lit.push(part(box(1.5, 0.5, 1.5), STONE_DARK, { y: 0.25 }), part(cyl(0.55, 0.62, 2.6, 8), STONE, { y: 1.7, rz: 0.08 }), part(cyl(0.55, 0.55, 2.4, 8), STONE, { x: 1.8, y: 0.5, rz: Math.PI / 2, ry: rand() }))
      glow.push(part(cyl(0.64, 0.64, 0.22, 8), TEAL, { y: 2.2 }))
      break
    case 'runeSlab':
      lit.push(part(box(1.8, 2.8, 0.45), STONE_DARK, { y: 1.4 }))
      glow.push(part(box(0.14, 2, 0.05), TEAL, { y: 1.5, z: 0.24 }), part(box(1.1, 0.14, 0.05), TEAL, { y: 1.9, z: 0.24 }), part(box(0.7, 0.14, 0.05), TEAL, { y: 1.0, z: 0.24 }), part(ico(0.18), TEAL, { y: 2.4, z: 0.25 }))
      break
    case 'arch':
      lit.push(part(box(1.2, 6, 1.2), STONE, { x: -2.6, y: 3 }), part(box(1.2, 6, 1.2), STONE, { x: 2.6, y: 3 }), part(box(7, 1.1, 1.5), STONE_DARK, { y: 6.5 }), part(box(1.6, 0.4, 1.6), STONE_DARK, { x: -2.6, y: 0.2 }), part(box(1.6, 0.4, 1.6), STONE_DARK, { x: 2.6, y: 0.2 }))
      glow.push(part(oct(0.55), TEAL, { y: 6.5, z: 0.8, sy: 1.4 }), part(box(0.12, 4, 0.05), TEAL, { x: -2.6, y: 3, z: 0.62 }), part(box(0.12, 4, 0.05), TEAL, { x: 2.6, y: 3, z: 0.62 }))
      break
    case 'crystal': {
      const col = rand() < 0.5 ? 0xb69cff : 0x7ff0ff
      for (let k = 0; k < 4; k++) glow.push(part(oct(0.5 + rand() * 0.4), col, { x: (rand() - 0.5) * 1.6, y: 1 + rand() * 0.6, z: (rand() - 0.5) * 1.6, sy: 2.4 + rand() * 1.5, rx: (rand() - 0.5) * 0.6, rz: (rand() - 0.5) * 0.6 }))
      lit.push(part(dodeca(0.9), 0x8a84a0, { y: 0.2, sy: 0.4 }))
      break
    }
    case 'flowerbed':
      lit.push(part(dodeca(1.1), 0x4fb873, { y: 0.15, sy: 0.35 }))
      for (let k = 0; k < 6; k++) lit.push(part(ico(0.22, 0), BLOSSOM[Math.floor(rand() * 5)], { x: (rand() - 0.5) * 1.6, y: 0.55, z: (rand() - 0.5) * 1.6 }))
      break
    case 'lamp':
      lit.push(part(cyl(0.1, 0.14, 2.8, 6), STONE_DARK, { y: 1.4 }), part(box(0.6, 0.12, 0.6), STONE_DARK, { y: 2.8 }))
      glow.push(part(ico(0.3, 1), 0xfff0b0, { y: 3.15 }))
      break
    case 'fountain':
      lit.push(part(cyl(2.6, 2.8, 0.8, 12), STONE, { y: 0.4 }), part(cyl(0.4, 0.5, 2.2, 8), STONE, { y: 1.5 }), part(cyl(1, 0.6, 0.4, 10), STONE, { y: 2.6 }))
      glow.push(part(cyl(2.3, 2.3, 0.1, 12), 0x7fd8ff, { y: 0.78 }), part(cone(0.35, 1.2, 6), 0xbff0ff, { y: 3.3 }))
      break
    case 'brazier':
      lit.push(part(cyl(1.6, 0.9, 1.2, 8), STONE_DARK, { y: 1.6 }), part(cyl(0.4, 0.6, 1.2, 6), STONE_DARK, { y: 0.6 }), part(cyl(2.4, 2.6, 0.4, 8), STONE, { y: 0.2 }))
      glow.push(part(cone(1.1, 2.6, 7), 0xff9a3a, { y: 3.3 }), part(cone(0.6, 3.2, 6), 0xffe07a, { y: 3.6, ry: 0.5 }))
      break
    case 'telescope':
      lit.push(part(cyl(2.2, 2.4, 0.6, 10), STONE, { y: 0.3 }), limb([-1, 0.6, -0.6], [0, 3.2, 0], 0.12, 0.1, 0x6a5a48), limb([1, 0.6, -0.6], [0, 3.2, 0], 0.12, 0.1, 0x6a5a48), limb([0, 0.6, 1.1], [0, 3.2, 0], 0.12, 0.1, 0x6a5a48))
      lit.push(part(cyl(0.45, 0.65, 4.5, 10), 0xc9a24a, { y: 4, z: 0.6, rx: -0.7 }))
      glow.push(part(cyl(0.38, 0.38, 0.08, 10), 0x9ff2ff, { y: 5.7, z: 2.15, rx: -0.7 }))
      break
    case 'relicPedestal':
      lit.push(part(cyl(2.4, 2.8, 0.6, 10), STONE, { y: 0.3 }), part(cyl(1.6, 1.9, 0.6, 10), STONE_DARK, { y: 0.9 }), part(cyl(0.7, 0.9, 1.2, 8), STONE, { y: 1.8 }))
      glow.push(part(cyl(2.45, 2.45, 0.08, 10), TEAL, { y: 0.62 }))
      break
    default:
      break
  }
  return { lit: moveParts(lit, p.x, p.y, p.z, p.rot, p.scale), glow: moveParts(glow, p.x, p.y, p.z, p.rot, p.scale) }
}

// ---- shared textures ------------------------------------------------------------------------------

function streakTexture(colorA, colorB) {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = colorA
  ctx.fillRect(0, 0, 64, 128)
  const rand = mulberry32(3)
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = colorB
    ctx.globalAlpha = 0.25 + rand() * 0.6
    ctx.fillRect(rand() * 64, rand() * 128, 1 + rand() * 3, 8 + rand() * 30)
  }
  const t = new THREE.CanvasTexture(canvas)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

function puffTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 128
  const ctx = canvas.getContext('2d')
  const rand = mulberry32(17)
  for (let i = 0; i < 9; i++) {
    const x = 30 + rand() * 68
    const y = 45 + rand() * 38
    const r = 18 + rand() * 26
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, 'rgba(255,255,255,0.9)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  const t = new THREE.CanvasTexture(canvas)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

// ---- towers ----------------------------------------------------------------------------------------

function buildTower(tower) {
  const g = new THREE.Group()
  g.position.set(tower.x, tower.y, tower.z)
  const lit = []
  const glow = []
  lit.push(part(cyl(7.6, 8.6, 8, 8), STONE_DARK, { y: -3.85 }), part(cyl(6.6, 7.2, 0.4, 8), STONE, { y: 0.2 }))
  // A path of steps through each gap between the pillars.
  const H = TOWER_HEIGHT
  for (let i = 0; i < TOWER_PILLARS; i++) {
    const a = (i / TOWER_PILLARS) * Math.PI * 2 + Math.PI / TOWER_PILLARS
    const x = Math.cos(a) * TOWER_RING
    const z = Math.sin(a) * TOWER_RING
    // Each pillar leans in a touch as it rises.
    lit.push(limb([x * 1.05, 0, z * 1.05], [x * 0.78, H - 6, z * 0.78], 0.95, 0.7, STONE, 6))
    lit.push(part(box(2.2, 0.8, 2.2), STONE_DARK, { x: x * 1.05, y: 0.6, z: z * 1.05, ry: -a }))
    glow.push(limb([x * 0.98, 4, z * 0.98], [x * 0.79, H - 8, z * 0.79], 0.18, 0.12, TEAL, 4))
  }
  // Bracing rings up the tower, and the crown.
  for (const [y, k] of [[12, 0.98], [24, 0.92], [34, 0.86]]) {
    const ring = new THREE.TorusGeometry(TOWER_RING * k * 0.98, 0.42, 5, 18)
    ring.rotateX(Math.PI / 2)
    lit.push(part(ring, STONE_DARK, { y }))
  }
  const crown = new THREE.TorusGeometry(TOWER_RING * 0.95, 0.9, 6, 20)
  crown.rotateX(Math.PI / 2)
  lit.push(part(crown, STONE, { y: H - 6 }), part(cyl(5.2, 4.2, 1.2, 12), STONE_DARK, { y: H - 5.4 }))
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2
    lit.push(limb([Math.cos(a) * 4.8, H - 5, Math.sin(a) * 4.8], [Math.cos(a) * 2.2, H + 2, Math.sin(a) * 2.2], 0.45, 0.2, STONE))
  }
  lit.push(part(cone(0.7, 7, 6), STONE, { y: H + 4.5 }))
  glow.push(part(cyl(PAD_RADIUS, PAD_RADIUS, 0.12, 6), TEAL, { y: 0.47 }))

  // A domed roof over the crown's lookout deck, so the tower reads as a shelter rather than a bare frame.
  lit.push(part(dome(5.6), STONE, { y: H - 4.7, sy: 0.62 }), part(cyl(0.5, 0.5, 1.6, 6), STONE_DARK, { y: H - 1.3 }))
  glow.push(part(new THREE.TorusGeometry(5.5, 0.14, 4, 24).rotateX(Math.PI / 2), LANTERN, { y: H - 4.6 }))

  // The keeper's shelter at the tower's foot: a roofed timber lookout hut with a bench, a glowing window and a lantern.
  const shelter = towerShelter(tower)
  const hutLit = []
  const hutGlow = []
  hutLit.push(part(cyl(3.5, 3.9, 1.4, 8), STONE_DARK, { y: -0.35 }))
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) hutLit.push(part(box(0.38, 3, 0.38), WOOD_DARK, { x: sx * 2.15, y: 1.8, z: sz * 2.15 }))
  hutLit.push(part(box(4.6, 2.7, 0.28), WOOD, { y: 1.75, z: -2.15 }), part(box(4.6, 2.7, 0.28), WOOD, { y: 1.75, z: 2.15 }), part(box(0.28, 2.7, 4.6), WOOD, { x: -2.15, y: 1.75 }))
  hutLit.push(part(box(0.28, 2.7, 1.5), WOOD, { x: 2.15, y: 1.75, z: -1.55 }), part(box(0.28, 2.7, 1.5), WOOD, { x: 2.15, y: 1.75, z: 1.55 }), part(box(0.3, 0.7, 1.7), WOOD_DARK, { x: 2.15, y: 2.85 }))
  hutLit.push(part(box(0.7, 0.45, 3), WOOD_DARK, { x: -1.3, y: 0.75 })) // a bench along the back wall
  for (const side of [-1, 1]) hutLit.push(part(box(3.6, 0.28, 5.4), ROOF, { x: side * 1.55, y: 4.1, rz: -side * 0.5, sx: 1.05 }))
  hutLit.push(part(box(0.34, 0.34, 5.9), WOOD_DARK, { y: 4.95 }), part(cyl(0.12, 0.12, 2.6, 5), WOOD_DARK, { x: 3.1, y: 1.5, z: 2.9 }))
  hutGlow.push(part(box(0.06, 0.9, 1.0), LANTERN, { x: -0.1, y: 2.0, z: 2.17 }), part(ico(0.28, 1), LANTERN, { x: 3.1, y: 2.95, z: 2.9 }), part(ico(0.2, 1), LANTERN, { x: 2.2, y: 3.35, z: 0 }))
  moveParts(hutLit, shelter.x - tower.x, 0, shelter.z - tower.z, Math.PI - shelter.rot)
  moveParts(hutGlow, shelter.x - tower.x, 0, shelter.z - tower.z, Math.PI - shelter.rot)
  lit.push(...hutLit)
  glow.push(...hutGlow)
  const litMesh = new THREE.Mesh(mergeGeometries(lit), litMaterial())
  litMesh.castShadow = true
  litMesh.receiveShadow = true
  const glowMat = glowMaterial()
  const glowMesh = new THREE.Mesh(mergeGeometries(glow), glowMat)
  g.add(litMesh, glowMesh)

  // Moving parts: the pad's rune ring, the charge column, the beacon orb and its beam.
  const runeMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(TEAL).multiplyScalar(GLOW), transparent: true, opacity: 0.9 })
  const runeGeo = new THREE.TorusGeometry(PAD_RADIUS + 0.5, 0.09, 4, 6)
  runeGeo.rotateX(Math.PI / 2)
  const rune = new THREE.Mesh(runeGeo, runeMat)
  rune.position.y = 0.6
  const rune2 = new THREE.Mesh(runeGeo, runeMat)
  rune2.position.y = 0.6
  rune2.scale.setScalar(0.7)
  const columnMat = new THREE.MeshBasicMaterial({ map: streakTexture('#103a40', '#bffff2'), color: new THREE.Color(TEAL), transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
  columnMat.map.repeat.set(3, 4)
  const column = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 2.3, H - 6, 16, 1, true), columnMat)
  column.position.y = (H - 6) / 2 + 0.4
  const orbMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xbffff2).multiplyScalar(1.6), fog: false })
  const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5, 1), orbMat)
  orb.position.y = H + 9.5
  const beamMat = new THREE.MeshBasicMaterial({ color: TEAL, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, side: THREE.DoubleSide })
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 1.2, 160, 10, 1, true), beamMat)
  beam.position.y = H + 90
  g.add(rune, rune2, column, orb, beam)

  // A broken tower (logic/towerQuests.js): vines and moss strangle the pillars and gloom wisps drift over the dead pad.
  const ruin = new THREE.Group()
  ruin.visible = false
  const vine = []
  for (let i = 0; i < TOWER_PILLARS; i++) {
    const a = (i / TOWER_PILLARS) * Math.PI * 2 + Math.PI / TOWER_PILLARS
    const x = Math.cos(a) * TOWER_RING
    const z = Math.sin(a) * TOWER_RING
    for (let k = 0; k < 3; k++) {
      const y0 = 0.4 + k * 7
      vine.push(limb([x * 1.06 + Math.sin(k * 2 + i) * 0.5, y0, z * 1.06], [x * 1.0, y0 + 8, z * 1.0 + Math.cos(k + i) * 0.5], 0.28, 0.18, k % 2 ? 0x3f7a3f : 0x56913f, 4))
    }
    vine.push(part(ico(0.9, 1), 0x4a8a3c, { x: x * 1.12, y: 0.5, z: z * 1.12, sy: 0.6 }))
  }
  ruin.add(new THREE.Mesh(mergeGeometries(vine), litMaterial()))
  const wisps = []
  const gloomMat = new THREE.MeshBasicMaterial({ color: 0x7a2fd0, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false })
  for (let i = 0; i < 7; i++) {
    const w = new THREE.Mesh(new THREE.IcosahedronGeometry(0.7 + (i % 3) * 0.25, 1), gloomMat)
    w.userData.seed = i * 1.7
    ruin.add(w)
    wisps.push(w)
  }
  g.add(ruin)
  return { def: tower, group: g, rune, rune2, column, columnMat, orb, orbMat, beam, beamMat, glowMat, litMat: litMesh.material, charge: 0, lit: false, ruin, wisps, broken: Boolean(towerIssue(tower)) }
}

// ---- archipelagos ---------------------------------------------------------------------------------

function buildArchipelago(arch, puff) {
  const g = new THREE.Group()
  const lit = []
  const glow = []
  const falls = []
  for (const isle of arch.isles) {
    lit.push(...isleRock(isle))
    const rand = mulberry32(isle.seed * 7 + 2)
    for (const p of isleLayout(isle).props) {
      if (p.kind === 'waterfall') {
        falls.push(p)
        continue
      }
      if (p.kind === 'pond') {
        glow.push(part(new THREE.CircleGeometry(3.4 * p.scale, 14).rotateX(-Math.PI / 2), 0x5fc8ff, { x: p.x, y: p.y + 0.08, z: p.z }))
        lit.push(...moveParts([part(new THREE.TorusGeometry(3.5, 0.45, 4, 14).rotateX(Math.PI / 2), 0x9a96a8)], p.x, p.y + 0.1, p.z, 0, p.scale))
        continue
      }
      const parts = propParts(p, rand)
      lit.push(...parts.lit)
      glow.push(...parts.glow)
    }
  }
  const litMesh = new THREE.Mesh(mergeGeometries(lit), litMaterial())
  litMesh.castShadow = true
  litMesh.receiveShadow = true
  g.add(litMesh)
  if (glow.length) g.add(new THREE.Mesh(mergeGeometries(glow), glowMaterial()))

  // Waterfalls: a scrolling sheet of water spilling off the rim and fading away below.
  const fallTex = streakTexture('#3d8fd0', '#e8fbff')
  const fallMeshes = falls.map((p) => {
    const isle = arch.isles.find((i) => Math.hypot(i.x - p.x, i.z - p.z) < i.radius + 1)
    const a = Math.atan2(p.z - isle.z, p.x - isle.x)
    const width = 3.4 * p.scale
    const height = 90
    const geo = new THREE.PlaneGeometry(width, height, 1, 8)
    const colors = new Float32Array(geo.attributes.position.count * 4)
    for (let i = 0; i < geo.attributes.position.count; i++) {
      const t = (geo.attributes.position.getY(i) + height / 2) / height // 1 at the top
      colors.set([1, 1, 1, Math.pow(t, 1.6)], i * 4)
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 4))
    const tex = fallTex.clone()
    tex.repeat.set(1, 6)
    tex.needsUpdate = true
    const mat = haze(new THREE.MeshBasicMaterial({ map: tex, vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, opacity: 0.85 }))
    const mesh = new THREE.Mesh(geo, mat)
    const r = isle.radius * 0.98
    mesh.position.set(isle.x + Math.cos(a) * r, isle.y - height / 2 + 0.2, isle.z + Math.sin(a) * r)
    mesh.rotation.y = -a + Math.PI / 2
    // A ribbon of water across the turf, from the pond / fountain to the lip.
    const lip = new THREE.Mesh(new THREE.PlaneGeometry(width, 1.6).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x7fd8ff).multiplyScalar(1.4) }))
    lip.position.set(isle.x + Math.cos(a) * (r - 0.7), isle.y + 0.07, isle.z + Math.sin(a) * (r - 0.7))
    lip.rotation.y = -a + Math.PI / 2
    g.add(mesh, lip)
    return tex
  })

  // The updraft: a column of rising streaks.
  const u = arch.updraft
  const draftTex = streakTexture('#000000', '#e8fff8')
  draftTex.repeat.set(4, 3)
  const draftMat = new THREE.MeshBasicMaterial({ map: draftTex, color: 0xcff8ff, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
  const draft = new THREE.Mesh(new THREE.CylinderGeometry(u.radius, u.radius * 0.8, u.y1 - u.y0, 14, 1, true), draftMat)
  draft.position.set(u.x, (u.y0 + u.y1) / 2, u.z)
  const draftRing = new THREE.Mesh(new THREE.TorusGeometry(u.radius, 0.15, 4, 20).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xcff8ff).multiplyScalar(1.5) }))
  draftRing.position.set(u.x, u.y0 + 22, u.z)
  g.add(draft, draftRing)

  // The Nimbus Crown (the Sky Relic): a floating gold crown round a teal heart, turning over its pedestal, a halo
  // orbiting it, and a beam you can see from afar. Claim all nine for the secret hero.
  const relic = new THREE.Group()
  relic.position.set(arch.relic.x, arch.relic.y + 3.8, arch.relic.z)
  const gold = new THREE.MeshStandardMaterial({ color: 0xffd15c, metalness: 0.9, roughness: 0.25, emissive: 0x6a4a00 })
  const relicRing = new THREE.Group()
  const band = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.0, 0.5, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0xffd15c, metalness: 0.9, roughness: 0.25, emissive: 0x6a4a00, side: THREE.DoubleSide }))
  relicRing.add(band)
  for (const y of [-0.25, 0.25]) {
    const rim = new THREE.Mesh(new THREE.TorusGeometry(y < 0 ? 1.0 : 1.1, 0.08, 6, 28), gold)
    rim.rotation.x = Math.PI / 2
    rim.position.y = y
    relicRing.add(rim)
  }
  const gemMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(TEAL).multiplyScalar(2) })
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    const tall = i % 2 === 0
    const point = new THREE.Mesh(new THREE.ConeGeometry(0.2, tall ? 0.95 : 0.55, 4), gold)
    point.position.set(Math.sin(a) * 1.08, 0.25 + (tall ? 0.47 : 0.27), Math.cos(a) * 1.08)
    relicRing.add(point)
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(tall ? 0.14 : 0.1), gemMat)
    gem.position.set(Math.sin(a) * 1.12, tall ? 1.2 : 0, Math.cos(a) * 1.12)
    relicRing.add(gem)
  }
  const relicRing2 = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.05, 6, 32), gold)
  const relicHeart = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), new THREE.MeshBasicMaterial({ color: new THREE.Color(TEAL).multiplyScalar(2) }))
  relicHeart.scale.y = 1.5
  const relicBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.9, 120, 10, 1, true), new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, side: THREE.DoubleSide }))
  relicBeam.position.y = 60
  relic.add(relicRing, relicRing2, relicHeart, relicBeam)
  g.add(relic)

  // Clouds drifting through the isles and in a loose sea below them.
  const rand = mulberry32(arch.towerId.length * 999 + arch.isles.length * 7 + Math.round(arch.x))
  const clouds = []
  for (let i = 0; i < 16; i++) {
    const mat = new THREE.SpriteMaterial({ map: puff, color: 0xf4f0ff, transparent: true, opacity: 0.5 + rand() * 0.3, depthWrite: false })
    const s = new THREE.Sprite(mat)
    const a = rand() * Math.PI * 2
    const r = rand() * (arch.radius + 30)
    const low = i < 7
    const scale = low ? 40 + rand() * 30 : 16 + rand() * 18
    s.scale.set(scale, scale * 0.5, 1)
    const base = { x: arch.x + Math.cos(a) * r, y: low ? arch.low - 30 - rand() * 25 : arch.low + rand() * (arch.high - arch.low + 10), z: arch.z + Math.sin(a) * r, speed: 0.6 + rand() * 0.9, phase: rand() * 10 }
    s.position.set(base.x, base.y, base.z)
    g.add(s)
    clouds.push({ s, base })
  }
  return { def: arch, group: g, falls: fallMeshes, draftTex, relic, relicRing, relicRing2, relicHeart, clouds }
}

// ---- the whole sky --------------------------------------------------------------------------------

export function createSkyWorld() {
  const group = new THREE.Group()
  const puff = puffTexture()
  const towers = skyTowers().map((t) => {
    const built = buildTower(t)
    group.add(built.group)
    return built
  })
  const archs = skyArchipelagos().map((a) => {
    const built = buildArchipelago(a, puff)
    group.add(built.group)
    return built
  })
  const lastTime = { t: 0 }
  return {
    group,
    // Towers you have ridden glow brighter (a Set of tower ids).
    setRidden(ids) {
      for (const t of towers) t.lit = ids.has(t.def.id)
    },
    // Towers whose repair job is done (a Set of tower ids): every other tower with an issue looks broken and dark.
    setRepaired(ids) {
      for (const t of towers) {
        t.broken = Boolean(towerIssue(t.def)) && !ids.has(t.def.id)
        t.ruin.visible = t.broken
        t.orb.visible = !t.broken
      }
    },
    // Relics already taken are gone from their pedestals (a Set of relic ids).
    setRelicsTaken(ids) {
      for (const a of archs) a.relic.visible = !ids.has(a.def.relic.id)
    },
    // charging: { towerId, fraction } or null.
    update(pos, time, charging = null) {
      const dt = Math.min(0.1, Math.max(0, time - lastTime.t))
      lastTime.t = time
      for (const t of towers) {
        const d = Math.hypot(t.def.x - pos.x, t.def.z - pos.z)
        t.group.visible = d < SHOW_TOWER
        if (!t.group.visible) continue
        // Inside the ring the pillars fade, so they don't hide you from the camera.
        const inside = d < TOWER_RING + 4 && (pos.y ?? t.def.y) < t.def.y + TOWER_HEIGHT
        if (t.litMat.transparent !== inside) {
          t.litMat.transparent = inside
          t.litMat.opacity = inside ? 0.3 : 1
          t.litMat.depthWrite = !inside
          t.litMat.needsUpdate = true
        }
        if (t.broken) {
          // Dead: no beam, a dim pad, the gloom drifting.
          t.beamMat.opacity = 0.015
          t.glowMat.color.setScalar(GLOW * 0.16)
          t.columnMat.opacity = 0
          for (const w of t.wisps) {
            const k = time * 0.6 + w.userData.seed
            w.position.set(Math.cos(k) * (2 + (w.userData.seed % 3) * 1.4), 0.9 + Math.sin(k * 1.7) * 0.5 + (w.userData.seed % 2) * 0.8, Math.sin(k) * (2 + (w.userData.seed % 3) * 1.4))
            w.scale.setScalar(0.8 + 0.25 * Math.sin(k * 2.3))
          }
          t.rune.rotation.y += dt * 0.1
          t.rune2.rotation.y -= dt * 0.1
          continue
        }
        const target = charging?.towerId === t.def.id ? charging.fraction : 0
        t.charge += (target - t.charge) * Math.min(1, dt * (target > t.charge ? 10 : 3))
        const spin = 0.6 + t.charge * 9
        t.rune.rotation.y += dt * spin
        t.rune2.rotation.y -= dt * spin * 1.4
        t.rune.position.y = 0.6 + t.charge * 1.2
        t.rune2.position.y = 0.6 + t.charge * 2.6
        t.columnMat.opacity = 0.08 + t.charge * 0.8
        t.columnMat.map.offset.y -= dt * (0.3 + t.charge * 3)
        const pulse = 0.5 + 0.5 * Math.sin(time * 2.2)
        t.orb.scale.setScalar(1 + t.charge * 0.6 + pulse * 0.08)
        t.beamMat.opacity = (t.lit ? 0.16 : 0.07) + pulse * 0.04 + t.charge * 0.2
        t.glowMat.color.setScalar(GLOW * ((t.lit ? 1 : 0.55) + t.charge * 0.6))
      }
      for (const a of archs) {
        const d = Math.hypot(a.def.x - pos.x, a.def.z - pos.z)
        a.group.visible = d < SHOW_ARCH + a.def.radius
        if (!a.group.visible) continue
        for (const tex of a.falls) tex.offset.y += dt * 1.6
        a.draftTex.offset.y -= dt * 1.2
        if (a.relic.visible) {
          a.relicRing.rotation.y = time * 1.4
          a.relicRing.rotation.x = Math.sin(time * 0.7) * 0.2
          a.relicRing2.rotation.x = time * 1.9
          a.relicHeart.rotation.y = -time * 2
          a.relic.position.y = a.def.relic.y + 3.8 + Math.sin(time * 1.8) * 0.3
        }
        for (const c of a.clouds) {
          c.s.position.x = c.base.x + Math.sin(time * 0.02 * c.base.speed + c.base.phase) * 30
          c.s.position.z = c.base.z + Math.cos(time * 0.015 * c.base.speed + c.base.phase) * 20
        }
      }
    },
  }
}
