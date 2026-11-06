import * as THREE from 'three'
import {
  FACE_SCALE_BY_TYPE,
  JELLY_CLEARCOAT,
  JELLY_CLEARCOAT_ROUGHNESS,
  JELLY_EMISSIVE_INTENSITY,
  JELLY_METALNESS,
  JELLY_ROUGHNESS,
  JELLY_SHEEN,
  JELLY_SHEEN_COLOR,
  MONSTER_TYPES,
  PLAYER_BODY_RADIUS,
  PLAYER_EDGE_COLOR,
  SWORD_BLADE_COLOR,
  SWORD_GLOW_SCALE,
  SWORD_HILT_COLOR,
} from './config.js'
import { createFace3D } from './face3d.js'
import { createJellyBody } from './jelly.js'
import { PLAYER_FACE, pickFaceOptions } from './logic/faceOptions.js'
import { WEAPONS, weaponBase } from './logic/items.js'
import { applyWeaponPose } from './weaponAnim.js'
import { buildFancyWeapon } from './weaponModels.js'
import {
  CONE_HEIGHT_FACTOR,
  CONE_RADIUS_FACTOR,
  CYLINDER_RADIUS_FACTOR,
  bodySurfaceDistance,
} from './logic/faceLayout.js'

const PLAYER_BODY_COLOR = 0xff7a5c

const BLADE_LENGTH = 0.8

// A glowing energy sword: a bright emissive blade core plus a slightly
// larger, additive "glow" twin of the same shape (the same trick the
// jelly bodies use for their neon edges) so it blooms, on a dark metal
// hilt (grip + crossguard). Grouped so later milestones can animate the
// whole swing as one object; a `tip` child marks the blade's far end in
// local space, for the swing trail to read as a world position each
// frame. Attached directly to the body group (not the face anchor), so
// it stays rigid and doesn't pulse with the jelly bulge/hit state.
function createSword() {
  const group = new THREE.Group()

  const bladeGeometry = new THREE.BoxGeometry(0.05, BLADE_LENGTH, 0.025)
  const blade = new THREE.Mesh(
    bladeGeometry,
    new THREE.MeshStandardMaterial({
      color: SWORD_BLADE_COLOR,
      emissive: new THREE.Color(SWORD_BLADE_COLOR),
      emissiveIntensity: 0.85,
      metalness: 0.2,
      roughness: 0.2,
    }),
  )
  blade.position.y = BLADE_LENGTH / 2
  group.add(blade)

  const glow = new THREE.Mesh(
    bladeGeometry,
    new THREE.MeshBasicMaterial({
      color: SWORD_BLADE_COLOR,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  )
  glow.position.y = blade.position.y
  glow.scale.set(SWORD_GLOW_SCALE, 1, SWORD_GLOW_SCALE)
  group.add(glow)

  const hiltMaterial = new THREE.MeshStandardMaterial({ color: SWORD_HILT_COLOR, metalness: 0.7, roughness: 0.4 })

  const crossguard = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.06, 0.06), hiltMaterial)
  group.add(crossguard)

  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.22, 8), hiltMaterial)
  grip.position.y = -0.14
  group.add(grip)

  const tip = new THREE.Object3D()
  tip.position.y = BLADE_LENGTH
  group.add(tip)

  group.userData.tip = tip
  return group
}

const WEAPON_TINTS = { trident: 0x4de0ff, cleaver: 0xff5a5a, mace: 0xffd23f, glaive: 0x8aa8ff }
const WEAPON_COLORS = {
  dagger: 0xffa94d, spear: 0x7cffb0, hammer: 0xff4fa3, scythe: 0xb48cff,
  katana: 0x4de0ff, axe: 0xff7a45, rapier: 0xf5f07a, flail: 0xff6fe0, chainsaw: 0xffd23f, boomstick: 0x8cff6f,
  staff: 0xb48cff, pistol: 0xffe14a, shotgun: 0xff8ad8, smg: 0x66f0ff, railgun: 0x7cffb0, launcher: 0xff8a3a,
  whip: 0xff5fa8, nunchucks: 0x5affc4, crossbow: 0xc9ff5a, flamer: 0xff6a2a, blaster: 0xd96bff,
}

function glowMaterial(color, intensity = 1) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: new THREE.Color(color),
    emissiveIntensity: intensity,
    metalness: 0.2,
    roughness: 0.25,
  })
}

// A weapon-sized glowing part: an emissive box plus (optionally) an
// additive glow twin, the same trick the sword blade uses.
function glowBox(width, height, depth, color, y, { glow = true, x = 0, rotationZ = 0 } = {}) {
  const geometry = new THREE.BoxGeometry(width, height, depth)
  const part = new THREE.Group()
  const core = new THREE.Mesh(geometry, glowMaterial(color))
  part.add(core)
  if (glow) {
    const twin = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false }),
    )
    twin.scale.set(SWORD_GLOW_SCALE, 1.05, SWORD_GLOW_SCALE)
    part.add(twin)
  }
  part.position.set(x, y, 0)
  part.rotation.z = rotationZ
  return part
}

function darkPole(length, radius, y) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, length, 8),
    new THREE.MeshStandardMaterial({ color: SWORD_HILT_COLOR, metalness: 0.7, roughness: 0.4 }),
  )
  mesh.position.y = y
  return mesh
}

// Builds the hotbar weapon `id` as a group whose origin is the grip and
// whose +y runs toward the business end, with a `tip` child at the far
// end for the swing trail -- the same contract the original sword had, so
// the swing animation (rotation.z) drives any of them.
// The same model, for the item icons (src/icons.js).
export function createWeaponModel(id) {
  return createWeaponMesh(id)
}

function createWeaponMesh(id) {
  const group = buildWeaponMesh(id)
  applyWeaponPose(group, id, null)
  return group
}

function buildWeaponMesh(requestedId) {
  // New weapons reuse an older one's model, retinted with their own bullet / glow color.
  const id = weaponBase(requestedId)
  const tint = WEAPON_TINTS[requestedId] ?? (requestedId !== id ? WEAPONS[requestedId]?.bullet?.color : undefined)
  const fancy = buildFancyWeapon(id, id === 'sword' ? SWORD_BLADE_COLOR : tint ?? WEAPON_COLORS[id])
  if (fancy) return fancy
  if (id === 'sword') return createSword()
  const group = new THREE.Group()
  const color = tint ?? WEAPON_COLORS[id]
  let tipY
  let customTip = null // weapons with moving parts carry their own tip

  if (id === 'dagger') {
    group.add(glowBox(0.045, 0.45, 0.02, color, 0.22))
    group.add(glowBox(0.18, 0.05, 0.05, color, 0, { glow: false }))
    group.add(darkPole(0.16, 0.03, -0.1))
    tipY = 0.45
  } else if (id === 'spear') {
    group.add(darkPole(1.4, 0.025, 0.45))
    group.add(glowBox(0.1, 0.34, 0.03, color, 1.28))
    group.add(glowBox(0.05, 0.12, 0.03, color, 1.1, { glow: false, rotationZ: 0 }))
    tipY = 1.45
  } else if (id === 'hammer') {
    group.add(darkPole(0.95, 0.04, 0.4))
    group.add(glowBox(0.5, 0.32, 0.34, color, 0.95))
    tipY = 1.12
  } else if (id === 'staff') {
    // A wizard staff: a dark shaft topped with a glowing orb in a small cradle.
    group.add(darkPole(1.25, 0.03, 0.5))
    group.add(glowBox(0.2, 0.04, 0.2, color, 1.08, { glow: false }))
    const orbGeometry = new THREE.SphereGeometry(0.15, 16, 12)
    const orb = new THREE.Mesh(orbGeometry, glowMaterial(color, 1.4))
    const aura = new THREE.Mesh(
      orbGeometry,
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false }),
    )
    aura.scale.setScalar(1.7)
    orb.position.y = 1.25
    aura.position.y = 1.25
    group.add(orb, aura)
    tipY = 1.25
  } else if (id === 'katana') {
    group.add(glowBox(0.05, 0.95, 0.02, color, 0.55))
    group.add(glowBox(0.2, 0.05, 0.06, color, 0.05, { glow: false }))
    group.add(darkPole(0.2, 0.03, -0.1))
    tipY = 1.02
  } else if (id === 'axe') {
    group.add(darkPole(1.0, 0.04, 0.4))
    group.add(glowBox(0.45, 0.4, 0.05, color, 0.85, { x: 0.2 }))
    tipY = 1.0
  } else if (id === 'rapier') {
    group.add(glowBox(0.025, 1.3, 0.02, color, 0.7))
    group.add(glowBox(0.22, 0.04, 0.22, color, 0.08, { glow: false }))
    group.add(darkPole(0.16, 0.025, -0.08))
    tipY = 1.35
  } else if (id === 'flail') {
    // A handle with a chain and spiked ball that really swings on its pivot,
    // trailing behind as the flail whirls.
    group.add(darkPole(0.7, 0.035, 0.3))
    const pivot = new THREE.Group()
    pivot.position.y = 0.65
    pivot.add(glowBox(0.04, 0.5, 0.04, color, 0.27, { glow: false }))
    pivot.add(glowBox(0.34, 0.34, 0.34, color, 0.62))
    pivot.add(glowBox(0.2, 0.2, 0.2, color, 0.62, { glow: false, rotationZ: Math.PI / 4 }))
    customTip = new THREE.Object3D()
    customTip.position.y = 0.62
    pivot.add(customTip)
    group.add(pivot)
    group.userData.flex = (t) => {
      pivot.rotation.z = t === null ? 0.5 : 1.0 * Math.sin(Math.min(1, t / 0.2) * Math.PI / 2) * (1 - 0.6 * Math.max(0, (t - 0.8) / 0.2))
    }
  } else if (id === 'chainsaw') {
    group.add(darkPole(0.3, 0.07, 0.05))
    group.add(glowBox(0.12, 0.8, 0.04, color, 0.6))
    tipY = 1.0
  } else if (id === 'boomstick') {
    group.add(darkPole(0.7, 0.05, 0.3))
    group.add(glowBox(0.22, 0.5, 0.22, color, 0.85))
    tipY = 1.15
  } else if (id === 'whip') {
    // A handle and a chain of linked segments: a wave runs down them, so it
    // coils back and then snaps out straight with a crack.
    group.add(darkPole(0.3, 0.04, 0.05))
    const segments = []
    let parent = group
    const SEGMENT = 0.23
    for (let i = 0; i < 13; i++) {
      const segment = new THREE.Group()
      segment.position.y = i === 0 ? 0.2 : SEGMENT
      segment.add(glowBox(0.04 * (1 - i * 0.045), SEGMENT, 0.04 * (1 - i * 0.045), color, SEGMENT / 2, { glow: i % 2 === 0 }))
      parent.add(segment)
      segments.push(segment)
      parent = segment
    }
    customTip = new THREE.Object3D()
    customTip.position.y = SEGMENT
    parent.add(customTip)
    group.userData.flex = (t) => {
      segments.forEach((segment, i) => {
        if (t === null) segment.rotation.z = 0.04
        else {
          const amp = t < 0.5 ? 0.32 : 0.55 * (1 - Math.min(1, (t - 0.5) * 1.6))
          segment.rotation.z = amp * Math.sin(i * 0.7 - t * 18)
        }
      })
    }
  } else if (id === 'nunchucks') {
    // Two sticks on a chain: the second really whips around the joint.
    group.add(darkPole(0.5, 0.04, 0.1))
    group.add(glowBox(0.09, 0.14, 0.09, color, 0.34))
    group.add(glowBox(0.03, 0.06, 0.03, color, 0.42, { glow: false }))
    group.add(glowBox(0.03, 0.06, 0.03, color, 0.47, { glow: false, rotationZ: Math.PI / 2 }))
    const joint = new THREE.Group()
    joint.position.y = 0.5
    joint.add(darkPole(0.5, 0.04, 0.28))
    joint.add(glowBox(0.09, 0.14, 0.09, color, 0.18))
    customTip = new THREE.Object3D()
    customTip.position.y = 0.54
    joint.add(customTip)
    group.add(joint)
    group.userData.flex = (t) => {
      if (t === null) joint.rotation.set(0.15, 0, 0.35)
      else joint.rotation.set(1.3 * Math.sin(t * Math.PI * 5), 0, 1.2 * Math.cos(t * Math.PI * 5) + 0.3)
    }
  } else if (WEAPONS[id].gun) {
    // Firearms: a dark grip and body with a glowing barrel pointing along +y
    // (the player's forward once the sword's pose is applied).
    const long = id === 'railgun' || id === 'shotgun' || id === 'crossbow' || id === 'flamer'
    group.add(darkPole(0.3, 0.05, 0))
    group.add(glowBox(0.14, long ? 0.8 : 0.45, 0.14, color, long ? 0.5 : 0.35))
    if (id === 'launcher') group.add(glowBox(0.3, 0.3, 0.3, color, 0.75))
    if (id === 'smg') group.add(glowBox(0.08, 0.3, 0.08, color, 0.05, { glow: false, x: 0.12 }))
    tipY = long ? 0.95 : id === 'launcher' ? 0.95 : 0.6
  } else {
    // scythe: a long pole with a crescent blade swept off its top
    group.add(darkPole(1.3, 0.03, 0.45))
    group.add(glowBox(0.55, 0.07, 0.03, color, 1.15, { x: 0.25, rotationZ: -0.25 }))
    group.add(glowBox(0.3, 0.07, 0.03, color, 1.0, { x: 0.58, rotationZ: -0.95 }))
    tipY = 1.0
  }

  if (customTip) {
    group.userData.tip = customTip
    return group
  }

  const tip = new THREE.Object3D()
  tip.position.y = tipY
  if (id === 'scythe') tip.position.x = 0.7
  group.add(tip)
  group.userData.tip = tip
  return group
}

function disposeObject(object) {
  object.traverse((child) => {
    if (child.geometry) child.geometry.dispose()
    if (child.material) {
      const materials = Array.isArray(child.material) ? child.material : [child.material]
      materials.forEach((material) => material.dispose())
    }
  })
}

// Swaps the weapon the player is holding (hotbar selection) for weapon
// `id`, keeping it at the same spot on the body. The previous model is
// disposed.
export function setPlayerWeapon(playerMesh, id) {
  const old = playerMesh.userData.sword
  const next = createWeaponMesh(id)
  if (old) {
    playerMesh.remove(old)
    disposeObject(old)
  }
  playerMesh.add(next)
  playerMesh.userData.sword = next
}

const INDICATOR_SIZE = 0.4

// Draws a single bold glyph ("!" or "?") onto a small canvas for use as a
// sprite texture.
function createIndicatorTexture(glyph) {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, 64, 64)
  ctx.font = 'bold 48px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineWidth = 6
  ctx.strokeStyle = '#000000'
  ctx.strokeText(glyph, 32, 34)
  ctx.fillStyle = '#fff200'
  ctx.fillText(glyph, 32, 34)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace // canvas colors are sRGB, not linear
  texture.needsUpdate = true
  return texture
}

function createIndicatorSprite(glyph) {
  const material = new THREE.SpriteMaterial({
    map: createIndicatorTexture(glyph),
    transparent: true,
    depthTest: false,
  })
  const sprite = new THREE.Sprite(material)
  sprite.scale.set(INDICATOR_SIZE, INDICATOR_SIZE, 1)
  sprite.visible = false
  return sprite
}

// Flat-shaded, faceted jelly material: a saturated pastel base color, a
// little metalness/roughness, a glossy clearcoat layer (like a candy
// shell) with a soft sheen highlight at grazing angles, and no emissive
// tint, so the body reads as a glossy colored shape rather than glowing.
// Remembers its own baseline emissive color (material.userData.baseEmissive)
// so the hit-flash animation (player.js, combat.js) can fade back to it
// instead of to black.
function createJellyMaterial(color) {
  const material = new THREE.MeshPhysicalMaterial({
    color,
    flatShading: true,
    metalness: JELLY_METALNESS,
    roughness: JELLY_ROUGHNESS,
    clearcoat: JELLY_CLEARCOAT,
    clearcoatRoughness: JELLY_CLEARCOAT_ROUGHNESS,
    sheen: JELLY_SHEEN,
    sheenColor: new THREE.Color(JELLY_SHEEN_COLOR),
    emissive: new THREE.Color(color),
    emissiveIntensity: JELLY_EMISSIVE_INTENSITY,
  })
  material.userData.baseEmissive = material.emissive.clone()
  return material
}

function createPlayerGeometry() {
  return new THREE.IcosahedronGeometry(PLAYER_BODY_RADIUS, 1)
}

function createBlobboGeometry(size) {
  return new THREE.DodecahedronGeometry(size / 2)
}

function createZippyGeometry(size) {
  const geometry = new THREE.OctahedronGeometry(size / 2)
  geometry.scale(1, 1.3, 1) // small, slightly stretched tall
  return geometry
}

function createGrumpusGeometry(size) {
  // A few segments per side (not a bare 8-vertex box), so there are
  // interior vertices for the jelly deformation to actually jiggle.
  return new THREE.BoxGeometry(size * 0.7, size, size * 0.7, 3, 3, 3)
}

// The bosses' extra shapes (their proportions live in faceLayout.js so
// the face math matches). The sphere/cylinder/cone have enough segments
// for the jelly deformation to have vertices to jiggle; the tetrahedron
// is left at detail 0 (any subdivision would round it into a sphere), so
// only its four corners wobble.
function createSphereGeometry(size) {
  return new THREE.IcosahedronGeometry(size / 2, 1)
}

function createTetrahedronGeometry(size) {
  return new THREE.TetrahedronGeometry(size / 2)
}

function createCylinderGeometry(size) {
  return new THREE.CylinderGeometry(size * CYLINDER_RADIUS_FACTOR, size * CYLINDER_RADIUS_FACTOR, size, 14, 4)
}

function createConeGeometry(size) {
  return new THREE.ConeGeometry(size * CONE_RADIUS_FACTOR, size * CONE_HEIGHT_FACTOR, 14, 4)
}

const GEOMETRY_BUILDERS = {
  dodecahedron: createBlobboGeometry,
  octahedron: createZippyGeometry,
  box: createGrumpusGeometry,
  sphere: createSphereGeometry,
  tetrahedron: createTetrahedronGeometry,
  cylinder: createCylinderGeometry,
  cone: createConeGeometry,
}

// The body's resting center height so its lowest point touches the
// ground (y = 0, the platform's top surface per platformLayout).
// size/2 is correct for the dodecahedron/box (symmetric top-to-bottom),
// but zippy's octahedron is stretched 1.3x vertically (see
// createZippyGeometry), so centering it at size/2 used to leave its
// lower, stretched tip poking 0.15 * size below the ground; reusing
// faceLayout's own bodySurfaceDistance (straight down) gives the exact
// height instead (size * 0.65), so this stays correct if the stretch
// ever changes.
function monsterBodyCenterY(stats, geometry) {
  if (stats.shape === 'octahedron') return bodySurfaceDistance(stats.shape, stats.size, 0, -1, 0)
  // The bosses' extra shapes aren't symmetric top-to-bottom (a tetrahedron
  // or cone), so read the exact lowest point off the geometry itself.
  if (!['dodecahedron', 'box'].includes(stats.shape)) {
    geometry.computeBoundingBox()
    return -geometry.boundingBox.min.y
  }
  return stats.size / 2
}

// Builds the player's body: a faceted, flat-shaded icosahedron jelly body
// with glowing neon edges, the goofy preset face built from 3D geometry
// (googly eyes, buck teeth, rosy cheeks) attached so it rides the
// jelly's deformation, and a sword held at the side as a rigid child
// group.
export function createPlayerMesh() {
  const geometry = createPlayerGeometry()
  const material = createJellyMaterial(PLAYER_BODY_COLOR)
  // The player's candy shell is a touch darker and less glossy so it stops glaring.
  material.color.multiplyScalar(0.8)
  material.sheen = 0.1
  material.clearcoat = 0.5
  material.envMapIntensity = 0.55
  const group = createJellyBody(geometry, material, PLAYER_EDGE_COLOR, PLAYER_BODY_RADIUS)

  const { body } = group.userData.jelly
  body.castShadow = true

  const face = createFace3D({
    shape: 'icosahedron',
    size: PLAYER_BODY_RADIUS,
    bodyCenterY: PLAYER_BODY_RADIUS,
    bodyColor: PLAYER_BODY_COLOR,
    options: PLAYER_FACE,
  })
  group.add(face.group)
  group.userData.face3d = face

  const sword = createWeaponMesh('staff')
  group.add(sword)

  group.userData.body = body
  group.userData.sword = sword

  return group
}

// Builds one monster of `type` (a key of MONSTER_TYPES) as a faceted,
// flat-shaded jelly body in its own shape with glowing neon edges, a
// randomly generated goofy 3D face (googly eyes, a mouth shape, and
// maybe a unibrow/tongue/rosy cheeks/freckles) attached so it rides the
// jelly's deformation, and a pair of small "!"/"?" indicator sprites
// above its head that the AI milestone flashes briefly on entering chase
// or search. rng is injectable (default Math.random) so the face can be
// seeded deterministically in tests.
// A jelly-ish solid colour for the add-on bits (limbs, mirror frame).
function accessoryMaterial(color, roughness = 0.5, metalness = 0.1) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness })
}

// The hopper's arms and legs: stubby limbs poking out of the sides of its body. The arms
// are returned so main.js can raise them while it leaps.
function addLimbs(group, stats) {
  const s = stats.size
  const limbColor = new THREE.Color(stats.color).multiplyScalar(0.85)
  const mat = accessoryMaterial(limbColor)
  const handMat = accessoryMaterial(new THREE.Color(stats.color).lerp(new THREE.Color(0xffffff), 0.25))
  const limbs = new THREE.Group()
  const arms = []
  for (const side of [-1, 1]) {
    // Arm: a pivot at the shoulder, a capsule-ish cylinder angled outward and down, a round hand.
    const pivot = new THREE.Group()
    pivot.position.set(side * s * 0.5, s * 0.62, 0)
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.07, s * 0.06, s * 0.5, 10), mat)
    arm.position.y = -s * 0.25
    const hand = new THREE.Mesh(new THREE.SphereGeometry(s * 0.12, 12, 8), handMat)
    hand.position.y = -s * 0.52
    pivot.add(arm, hand)
    pivot.rotation.z = side * 0.55
    limbs.add(pivot)
    arms.push({ pivot, side })

    // Leg: from the lower side of the body down to a flat foot on the ground.
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.09, s * 0.075, s * 0.42, 10), mat)
    leg.position.set(side * s * 0.3, s * 0.2, s * 0.05)
    const foot = new THREE.Mesh(new THREE.BoxGeometry(s * 0.2, s * 0.07, s * 0.3), handMat)
    foot.position.set(side * s * 0.3, s * 0.035, s * 0.12)
    limbs.add(leg, foot)
  }
  for (const m of limbs.children) m.castShadow = true
  group.add(limbs)
  group.userData.arms = arms
}

// The mirror enemy's mirror: a tall oval of polished glass in a metal frame, held out in
// front of its face (+z is forward). Anything that hits this side bounces.
function addMirror(group, stats, bodyCenterY) {
  const s = stats.size
  const mirror = new THREE.Group()
  const frame = new THREE.Mesh(new THREE.TorusGeometry(1, 0.1, 10, 36), accessoryMaterial(0xd9b24a, 0.3, 0.9))
  frame.scale.set(s * 0.46, s * 0.62, s * 0.46)
  const glass = new THREE.Mesh(
    new THREE.CircleGeometry(1, 36),
    new THREE.MeshStandardMaterial({ color: 0xf2f9ff, roughness: 0.04, metalness: 1, emissive: 0x6c8fb4, emissiveIntensity: 0.35, side: THREE.DoubleSide }),
  )
  glass.scale.set(s * 0.46, s * 0.62, 1)
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.05, s * 0.05, s * 0.5, 8), accessoryMaterial(0xd9b24a, 0.3, 0.9))
  handle.position.y = -s * 0.8
  // A glint streak across the glass.
  const glint = new THREE.Mesh(new THREE.PlaneGeometry(s * 0.1, s * 0.7), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 }))
  glint.position.set(-s * 0.15, s * 0.05, 0.01)
  glint.rotation.z = 0.35
  // Cracks: one more spreads across the glass for every hit the shield takes (see setMirrorCracks).
  const hits = stats.reflect?.hits ?? 4
  const crackMat = new THREE.MeshBasicMaterial({ color: 0x1b2a3d, side: THREE.DoubleSide })
  const cracks = []
  for (let i = 0; i < hits; i++) {
    const angle = (i / hits) * Math.PI * 2 + 0.5
    const crack = new THREE.Group()
    const len = s * (0.3 + 0.08 * (i % 3))
    const main = new THREE.Mesh(new THREE.PlaneGeometry(s * 0.025, len), crackMat)
    main.position.y = len / 2
    const branch = new THREE.Mesh(new THREE.PlaneGeometry(s * 0.018, len * 0.5), crackMat)
    branch.position.set(s * 0.05, len * 0.65, 0)
    branch.rotation.z = -0.7
    crack.add(main, branch)
    crack.rotation.z = angle
    crack.position.set(Math.cos(angle + 1.1) * s * 0.06, Math.sin(angle + 1.1) * s * 0.08, 0.02)
    crack.visible = false
    mirror.add(crack)
    cracks.push(crack)
  }
  mirror.add(frame, glass, handle, glint)
  mirror.position.set(0, Math.max(s * 0.7, bodyCenterY + s * 0.25), s * 0.82)
  mirror.children.forEach((m) => { m.castShadow = true })
  group.add(mirror)
  group.userData.mirror = mirror
  // fraction 0..1 of the shield worn away; a broken shield loses its glass (and glint) entirely.
  group.userData.setMirrorCracks = (fraction, broken) => {
    cracks.forEach((c, i) => { c.visible = !broken && i < Math.round(fraction * hits) })
    glass.visible = !broken
    glint.visible = !broken
    glass.material.emissiveIntensity = 0.35 * (1 - 0.6 * fraction)
  }
}

// The angler's glowing lure: a curved stalk over its head ending in a bright bulb.
function addLure(group, stats) {
  const s = stats.size
  const stalk = new THREE.Mesh(new THREE.TorusGeometry(s * 0.35, s * 0.03, 6, 14, Math.PI * 0.9), accessoryMaterial(0x1a1f4a))
  stalk.position.set(0, s * 0.7, s * 0.05)
  stalk.rotation.y = Math.PI / 2
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(s * 0.14, 12, 8),
    new THREE.MeshStandardMaterial({ color: 0xfff1a8, emissive: 0xffe066, emissiveIntensity: 1.6 }),
  )
  bulb.position.set(0, s * 0.72, s * 0.42)
  const glow = new THREE.Mesh(new THREE.SphereGeometry(s * 0.34, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffe066, transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false }))
  glow.position.copy(bulb.position)
  group.add(stalk, bulb, glow)
}

// The urchin's spikes: cones poking out all round the body.
function addSpikes(group, stats, bodyCenterY) {
  const s = stats.size
  const mat = accessoryMaterial(0x2a1250, 0.4)
  for (let i = 0; i < 18; i++) {
    const phi = Math.acos(1 - (2 * (i + 0.5)) / 18)
    const theta = Math.PI * (1 + Math.sqrt(5)) * i
    const dir = new THREE.Vector3(Math.sin(phi) * Math.cos(theta), Math.cos(phi), Math.sin(phi) * Math.sin(theta))
    const spike = new THREE.Mesh(new THREE.ConeGeometry(s * 0.07, s * 0.4, 6), mat)
    spike.position.copy(dir).multiplyScalar(s * 0.62).add(new THREE.Vector3(0, bodyCenterY, 0))
    spike.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)
    group.add(spike)
  }
}

export function createMonsterMesh(type, rng = Math.random) {
  const stats = MONSTER_TYPES[type]
  const geometry = GEOMETRY_BUILDERS[stats.shape](stats.size)
  const material = createJellyMaterial(stats.color)
  const bodyCenterY = monsterBodyCenterY(stats, geometry)
  const group = createJellyBody(geometry, material, stats.edgeColor, bodyCenterY)

  const { body } = group.userData.jelly
  body.castShadow = true

  const face = createFace3D({
    shape: stats.shape,
    size: stats.size,
    bodyCenterY,
    bodyColor: stats.color,
    options: pickFaceOptions(rng),
    faceTypeScale: FACE_SCALE_BY_TYPE[type] ?? 1,
  })
  group.add(face.group)
  group.userData.face3d = face

  const chaseIndicator = createIndicatorSprite('!')
  const searchIndicator = createIndicatorSprite('?')
  chaseIndicator.position.set(0, stats.size + 0.3, 0)
  searchIndicator.position.set(0, stats.size + 0.3, 0)
  // Bigger bodies (the bosses) get proportionally bigger "!"/"?" so they still read.
  const indicatorScale = Math.max(1, stats.size / 1.5)
  chaseIndicator.scale.multiplyScalar(indicatorScale)
  searchIndicator.scale.multiplyScalar(indicatorScale)
  group.add(chaseIndicator)
  group.add(searchIndicator)

  if (stats.boss) {
    // A flat red ring on the ground that a boss's slam/spin wind-up
    // shows (scaled to the move's radius, see monster.js); hidden until then.
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.93, 1, 56),
      new THREE.MeshBasicMaterial({ color: 0xff3355, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }),
    )
    ring.rotation.x = -Math.PI / 2
    ring.position.y = 0.06
    ring.visible = false
    group.add(ring)
    group.userData.telegraph = ring
  }

  if (stats.accessory === 'limbs') addLimbs(group, stats)
  if (stats.accessory === 'mirror') addMirror(group, stats, bodyCenterY)
  if (stats.accessory === 'lure') addLure(group, stats)
  if (stats.accessory === 'spikes') addSpikes(group, stats, bodyCenterY)

  group.userData.body = body
  group.userData.type = type
  group.userData.indicators = { chase: chaseIndicator, search: searchIndicator }
  group.userData.indicatorElapsed = null

  return group
}
