// The "Shardfall" look for monsters: a matte body with a procedural skin texture
// (also used as a bump map) and a fresnel rim light that makes the silhouette glow,
// cream eyes (red for bosses) with no mouth, and little bone horns on the big ones.
import * as THREE from 'three'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

const SKIN_SIZE = 256
let skinTexture = null

// A mottled, lightly scratched near-white skin: it tints with the body color and bumps it.
function getSkinTexture() {
  if (skinTexture) return skinTexture
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = SKIN_SIZE
  const ctx = canvas.getContext('2d')
  let seed = 7
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  ctx.fillStyle = 'rgb(226,226,226)'
  ctx.fillRect(0, 0, SKIN_SIZE, SKIN_SIZE)
  for (let i = 0; i < 70; i++) {
    const x = rand() * SKIN_SIZE
    const y = rand() * SKIN_SIZE
    const r = 10 + rand() * 40
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, r)
    const v = rand() < 0.5 ? 0 : 255
    gradient.addColorStop(0, `rgba(${v},${v},${v},${0.05 + rand() * 0.1})`)
    gradient.addColorStop(1, `rgba(${v},${v},${v},0)`)
    ctx.fillStyle = gradient
    ctx.fillRect(x - r, y - r, r * 2, r * 2)
  }
  for (let i = 0; i < 160; i++) {
    const v = rand() < 0.5 ? 0 : 255
    ctx.strokeStyle = `rgba(${v},${v},${v},${rand() * 0.16})`
    ctx.lineWidth = 1
    const a = rand() * Math.PI * 2
    const l = 6 + rand() * 30
    const x = rand() * SKIN_SIZE
    const y = rand() * SKIN_SIZE
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l)
    ctx.stroke()
  }
  skinTexture = new THREE.CanvasTexture(canvas)
  skinTexture.wrapS = skinTexture.wrapT = THREE.RepeatWrapping
  skinTexture.colorSpace = THREE.SRGBColorSpace
  return skinTexture
}

// The body material. `rim` is how strongly the grazing-angle glow shows (bosses more).
export function createShardMaterial(color, { rim = 0.5, vertexColors = false } = {}) {
  const skin = getSkinTexture()
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.58,
    metalness: 0,
    map: skin,
    bumpMap: skin,
    bumpScale: 0.45,
    emissive: new THREE.Color(color).multiplyScalar(vertexColors ? 0.06 : 0.1),
    vertexColors,
  })
  material.userData.baseEmissive = material.emissive.clone() // the hit flash fades back to this
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uRim = { value: rim }
    shader.fragmentShader =
      'uniform float uRim;\n' +
      shader.fragmentShader.replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        totalEmissiveRadiance += (diffuseColor.rgb * 0.75 + 0.1) * pow(1.0 - saturate(dot(normalize(vViewPosition), normal)), 3.0) * uRim;`,
      )
  }
  material.customProgramCacheKey = () => `shardrim${rim}${vertexColors ? 'v' : ''}`
  return material
}

// Round bodies (the icosahedron and sphere) read smooth like Shardfall's blobs: share
// normals between vertices at the same spot. The angular ones stay faceted.
export function smoothGeometry(geometry) {
  const copy = geometry.clone()
  copy.deleteAttribute('normal')
  copy.deleteAttribute('uv')
  const merged = mergeVertices(copy, 1e-4)
  merged.computeVertexNormals()
  return merged
}

const EYE_CREAM = 0xfff4d6
const EYE_RED = 0xff5a6a
const HORN_COLOR = 0xe7dcc2
const hornMaterial = new THREE.MeshStandardMaterial({ color: HORN_COLOR, roughness: 0.45 })
const hornGeometry = new THREE.ConeGeometry(1, 1, 12)

// Restyles a monster's 3D face for this look: cream (or, for bosses, red) eyeballs and
// no mouth, brow, tongue or cheeks. `face` is createFace3D's return value.
export function restyleFace(face, boss) {
  for (const eye of [face.eyes.left, face.eyes.right]) {
    const eyeball = eye.group.children[0]
    eyeball.material.color.setHex(boss ? EYE_RED : EYE_CREAM)
    eyeball.material.emissive?.setHex(boss ? 0x501018 : 0x30281a)
  }
  face.features.slice(2).forEach((feature) => {
    feature.anchorGroup.visible = false
  })
}

// A pair of bone horns on top of the body (bosses and the big boxy ones).
export function addHorns(group, geometry, bodyCenterY, size) {
  geometry.computeBoundingBox()
  const top = bodyCenterY + geometry.boundingBox.max.y
  const reach = Math.max(geometry.boundingBox.max.x, geometry.boundingBox.max.z)
  for (const side of [-1, 1]) {
    const horn = new THREE.Mesh(hornGeometry, hornMaterial)
    horn.scale.set(size * 0.1, size * 0.34, size * 0.1)
    horn.position.set(side * reach * 0.5, top - size * 0.03 + size * 0.15, -reach * 0.05)
    horn.rotation.z = -side * 0.45
    horn.castShadow = true
    group.add(horn)
  }
}
