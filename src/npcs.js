// The villagers of the Wilds: little jellies built from the player's own model (the same body and face),
// each in a pastel of their own, with a name above their head and a marker that shows whether they have a
// quest for you ('!'), are waiting on you ('...'), or have something to collect ('?').
import * as THREE from 'three'
import { createPlayerMesh } from './characters.js'
import { updateJelly } from './jelly.js'
import { updateFace3D } from './face3d.js'
import { dampAngle } from './logic/smoothing.js'
import { heightAt } from './logic/world.js'
import { speciesById } from './logic/species.js'

export const TALK_RANGE = 4.6
const NOTICE_RANGE = 8 // they turn to face you inside this
const WANDER_RADIUS = 3.5
const WALK_SPEED = 0.9

function textTexture(draw, width, height) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  draw(canvas.getContext('2d'), width, height)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function createLabel(name, role) {
  const texture = textTexture((ctx, w, h) => {
    ctx.fillStyle = 'rgba(28,20,58,0.78)'
    ctx.beginPath()
    ctx.roundRect(4, 4, w - 8, h - 8, 22)
    ctx.fill()
    ctx.textAlign = 'center'
    ctx.fillStyle = '#ffffff'
    ctx.font = '700 34px Sora, system-ui, sans-serif'
    ctx.fillText(name, w / 2, 40)
    ctx.fillStyle = '#c9bdff'
    ctx.font = '500 22px Sora, system-ui, sans-serif'
    ctx.fillText(role, w / 2, 70)
  }, 320, 88)
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false }))
  sprite.scale.set(3.2, 0.88, 1)
  sprite.renderOrder = 10
  return sprite
}

const MARKERS = {
  offer: { glyph: '!', fill: '#ffd15c', ink: '#3a2a00' },
  ready: { glyph: '?', fill: '#7dffc4', ink: '#073a28' },
  progress: { glyph: '…', fill: '#c9bdff', ink: '#241b3a' },
}
const markerTextures = {}
function markerTexture(kind) {
  if (markerTextures[kind]) return markerTextures[kind]
  const m = MARKERS[kind]
  return (markerTextures[kind] = textTexture((ctx, w, h) => {
    ctx.fillStyle = m.fill
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 6
    ctx.beginPath()
    ctx.arc(w / 2, h / 2, w / 2 - 8, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = m.ink
    ctx.font = '800 76px Sora, system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(m.glyph, w / 2, h / 2 + 4)
  }, 96, 96))
}


// ---- species: each storm city's people are a kind of their own (logic/species.js) -------------------------------
const mat = (color, emissive = 0) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, flatShading: true, emissive: emissive ? color : 0x000000, emissiveIntensity: emissive })
const glow = (color, opacity = 0.9) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false })
function bit(parent, geometry, material, pos = [0, 0, 0], rot = [0, 0, 0], scale = null) {
  const m = new THREE.Mesh(geometry, material)
  m.position.set(...pos)
  m.rotation.set(...rot)
  if (scale) m.scale.set(...scale)
  m.castShadow = false
  parent.add(m)
  return m
}
// Adds a species' ears, horns, tails and the like to a villager, and reshapes the body a little.
export function dressSpecies(mesh, speciesId, color) {
  const sp = speciesById(speciesId)
  if (!sp) return
  const accent = new THREE.Color(color).multiplyScalar(0.7).getHex()
  const parts = new THREE.Group()
  mesh.add(parts)
  mesh.userData.speciesParts = parts
  if (speciesId === 'dunekin') { // tall fennec ears, a curled tail and a sun-gold scarf
    mesh.scale.set(0.95, 1.14, 0.95)
    for (const side of [-1, 1]) {
      bit(parts, new THREE.ConeGeometry(0.17, 0.72, 5), mat(color), [side * 0.32, 1.52, -0.02], [0, 0, -side * 0.28])
      bit(parts, new THREE.ConeGeometry(0.09, 0.5, 5), mat(0xffd6c0), [side * 0.33, 1.5, 0.05], [0, 0, -side * 0.28])
    }
    bit(parts, new THREE.TorusGeometry(0.58, 0.07, 6, 18, Math.PI * 1.7), mat(accent), [0, 0.5, -0.62], [0.4, 0.3, 0], [1, 1.5, 1])
    bit(parts, new THREE.TorusGeometry(0.5, 0.08, 6, 20), mat(0xffe08a, 0.25), [0, 0.95, 0], [Math.PI / 2, 0, 0])
  } else if (speciesId === 'frostkin') { // round and fluffy, ice-crystal horns, a snowy collar
    mesh.scale.set(1.12, 0.96, 1.12)
    for (const side of [-1, 1]) {
      bit(parts, new THREE.OctahedronGeometry(0.17), glow(0xaee4ff, 0.85), [side * 0.28, 1.4, 0], [0, 0, -side * 0.3], [0.7, 1.9, 0.7])
      bit(parts, new THREE.SphereGeometry(0.16, 8, 6), mat(0xffffff), [side * 0.56, 0.72, 0.12])
    }
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2
      bit(parts, new THREE.SphereGeometry(0.15, 8, 6), mat(0xffffff), [Math.cos(a) * 0.55, 0.95, Math.sin(a) * 0.55])
    }
    bit(parts, new THREE.SphereGeometry(0.2, 8, 6), mat(0xffffff), [0, 0.45, -0.66])
  } else if (speciesId === 'embervolk') { // swept-back horns, glowing cheeks, a flame-tipped tail
    mesh.scale.set(1.0, 1.06, 1.0)
    for (const side of [-1, 1]) {
      bit(parts, new THREE.ConeGeometry(0.12, 0.62, 6), mat(0x2a1a18), [side * 0.34, 1.3, -0.08], [-0.35, 0, -side * 0.65])
      bit(parts, new THREE.CircleGeometry(0.1, 10), glow(0xff5a1a, 0.9), [side * 0.36, 0.78, 0.5], [0, side * 0.5, 0])
    }
    bit(parts, new THREE.CylinderGeometry(0.05, 0.1, 0.7, 6), mat(accent), [0, 0.45, -0.75], [0.9, 0, 0])
    const flame = bit(parts, new THREE.ConeGeometry(0.17, 0.5, 7), glow(0xffa83a, 0.85), [0, 0.85, -1.05], [0.5, 0, 0])
    mesh.userData.flame = flame
  } else if (speciesId === 'mirefolk') { // wide and froggy: bulging eyes, a lily-pad hat, a reed
    mesh.scale.set(1.16, 0.92, 1.1)
    for (const side of [-1, 1]) {
      bit(parts, new THREE.SphereGeometry(0.2, 10, 8), mat(color), [side * 0.28, 1.28, 0.2])
      bit(parts, new THREE.SphereGeometry(0.1, 8, 6), mat(0xffffff), [side * 0.29, 1.32, 0.34])
      bit(parts, new THREE.SphereGeometry(0.05, 6, 6), mat(0x102010), [side * 0.29, 1.32, 0.42])
    }
    bit(parts, new THREE.CylinderGeometry(0.42, 0.42, 0.04, 14), mat(0x3a9a4a), [0.08, 1.5, -0.1], [0.1, 0, 0.12])
    bit(parts, new THREE.CylinderGeometry(0.02, 0.02, 0.6, 5), mat(0x7a6a3a), [-0.25, 1.65, -0.1], [0, 0, 0.25])
    bit(parts, new THREE.SphereGeometry(0.07, 6, 6), glow(0xb8ff8a, 0.9), [-0.35, 1.95, -0.1])
  }
}
// Per-frame life for a species' parts (the Embervolk tail-flame flickers).
export function animateSpecies(npc, time) {
  const flame = npc.mesh.userData.flame
  if (flame) {
    flame.scale.set(1 + Math.sin(time * 11 + npc.home.x) * 0.15, 1 + Math.sin(time * 9) * 0.25, 1)
  }
}

// Builds a villager from a world.js npc def: { id, name, role, color, x, z, villageId }.
export function createNpc(def) {
  const mesh = createPlayerMesh()
  const body = mesh.userData.jelly.body
  body.material.color.set(def.color)
  body.material.emissive?.set(def.color)
  mesh.position.set(def.x, heightAt(def.x, def.z), def.z)
  mesh.rotation.y = Math.random() * Math.PI * 2
  if (def.species) dressSpecies(mesh, def.species, def.color)

  const label = createLabel(def.name, def.role)
  label.position.set(0, def.species ? 3.1 : 3.35, 0)
  if (def.species) label.scale.set(3.2 / mesh.scale.x, 0.88 / mesh.scale.y, 1)
  mesh.add(label)
  const marker = new THREE.Sprite(new THREE.SpriteMaterial({ map: markerTexture('offer'), transparent: true, depthTest: false }))
  marker.scale.set(1, 1, 1)
  marker.renderOrder = 11
  marker.visible = false
  mesh.add(marker)

  return {
    def,
    mesh,
    marker,
    markerKind: null,
    home: { x: def.x, z: def.z },
    target: null,
    wait: 1 + Math.random() * 3,
    speed: 0,
    moveDir: { x: 0, z: 1 },
  }
}

export function setNpcMarker(npc, kind) {
  if (npc.markerKind === kind) return
  npc.markerKind = kind
  npc.marker.visible = Boolean(kind)
  if (kind) npc.marker.material.map = markerTexture(kind)
  npc.marker.material.needsUpdate = true
}

// One frame: they idle, amble about their home, and turn to look at you when you come near.
export function updateNpc(npc, dt, time, playerPos) {
  const { mesh } = npc
  if (npc.def.species) animateSpecies(npc, time)
  const toPlayer = Math.hypot(playerPos.x - mesh.position.x, playerPos.z - mesh.position.z)
  npc.speed = 0
  if (toPlayer < NOTICE_RANGE) {
    const face = Math.atan2(playerPos.x - mesh.position.x, playerPos.z - mesh.position.z)
    mesh.rotation.y = dampAngle(mesh.rotation.y, face, 6, dt)
    npc.target = null
    npc.wait = 1.5
  } else if (npc.target) {
    const dx = npc.target.x - mesh.position.x
    const dz = npc.target.z - mesh.position.z
    const d = Math.hypot(dx, dz)
    if (d < 0.2) {
      npc.target = null
      npc.wait = 2 + Math.random() * 4
    } else {
      const step = Math.min(WALK_SPEED * dt, d)
      mesh.position.x += (dx / d) * step
      mesh.position.z += (dz / d) * step
      mesh.rotation.y = dampAngle(mesh.rotation.y, Math.atan2(dx, dz), 8, dt)
      npc.speed = WALK_SPEED
    }
  } else {
    npc.wait -= dt
    if (npc.wait <= 0) {
      const a = Math.random() * Math.PI * 2
      const r = Math.random() * WANDER_RADIUS
      npc.target = { x: npc.home.x + Math.cos(a) * r, z: npc.home.z + Math.sin(a) * r }
    }
  }
  mesh.position.y = heightAt(mesh.position.x, mesh.position.z)
  npc.moveDir = { x: Math.sin(mesh.rotation.y), z: Math.cos(mesh.rotation.y) }
  updateJelly(mesh, dt, time, { speed: npc.speed, moveDir: npc.moveDir })
  updateFace3D(mesh, dt, time)
  if (npc.marker.visible) npc.marker.position.set(0, 4.15 + Math.sin(time * 3 + npc.home.x) * 0.15, 0)
  return toPlayer
}
