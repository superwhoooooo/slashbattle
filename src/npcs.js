// The villagers of the Wilds: little jellies built from the player's own model (the same body and face),
// each in a pastel of their own, with a name above their head and a marker that shows whether they have a
// quest for you ('!'), are waiting on you ('...'), or have something to collect ('?').
import * as THREE from 'three'
import { createPlayerMesh } from './characters.js'
import { updateJelly } from './jelly.js'
import { updateFace3D } from './face3d.js'
import { dampAngle } from './logic/smoothing.js'
import { heightAt } from './logic/world.js'

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

// Builds a villager from a world.js npc def: { id, name, role, color, x, z, villageId }.
export function createNpc(def) {
  const mesh = createPlayerMesh()
  const body = mesh.userData.jelly.body
  body.material.color.set(def.color)
  body.material.emissive?.set(def.color)
  mesh.position.set(def.x, heightAt(def.x, def.z), def.z)
  mesh.rotation.y = Math.random() * Math.PI * 2

  const label = createLabel(def.name, def.role)
  label.position.set(0, 3.35, 0)
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
