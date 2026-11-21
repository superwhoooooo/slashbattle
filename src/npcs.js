// The villagers of the Wilds: little jellies built from the player's own model (the same body and face), each in a
// pastel of their own -- except the storm cities' peoples, who have bodies of their own (speciesModels.js) -- with a name above their head and a marker that shows whether they have a
// quest for you ('!'), are waiting on you ('...'), or have something to collect ('?').
import * as THREE from 'three'
import { createPlayerMesh } from './characters.js'
import { updateJelly } from './jelly.js'
import { updateFace3D } from './face3d.js'
import { dampAngle } from './logic/smoothing.js'
import { heightAt } from './logic/world.js'
import { animateSpecies, buildSpecies, speciesHeight } from './speciesModels.js'

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
// A storm city's people are their own species (speciesModels.js); everyone else is a pastel jelly like the player.
export function createNpc(def) {
  let mesh
  if (def.species) mesh = buildSpecies(def.species, def.color, { champion: Boolean(def.champion) })
  else {
    mesh = createPlayerMesh()
    const body = mesh.userData.jelly.body
    body.material.color.set(def.color)
    body.material.emissive?.set(def.color)
  }
  mesh.position.set(def.x, heightAt(def.x, def.z), def.z)
  mesh.rotation.y = Math.random() * Math.PI * 2

  const label = createLabel(def.name, def.role)
  const top = def.species ? speciesHeight(mesh) + 0.5 : 3.35
  const s = mesh.scale.x
  label.position.set(0, top / s, 0)
  label.scale.set(3.2 / s, 0.88 / s, 1)
  mesh.add(label)
  const marker = new THREE.Sprite(new THREE.SpriteMaterial({ map: markerTexture('offer'), transparent: true, depthTest: false }))
  marker.scale.setScalar(1 / s)
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
    markerY: (top + 0.8) / s,
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
  if (npc.def.follow) { // a champion at your side: keeps up, a step behind and to one side
    followPlayer(npc, dt, playerPos, toPlayer)
  } else if (toPlayer < NOTICE_RANGE) {
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
  if (npc.isle) { // on a sky temple: never step off its edge
    const dx = mesh.position.x - npc.isle.x
    const dz = mesh.position.z - npc.isle.z
    const d = Math.hypot(dx, dz)
    if (d > npc.isle.r) {
      mesh.position.x = npc.isle.x + (dx / d) * npc.isle.r
      mesh.position.z = npc.isle.z + (dz / d) * npc.isle.r
    }
  }
  mesh.position.y = npc.yOverride ?? heightAt(mesh.position.x, mesh.position.z)
  npc.moveDir = { x: Math.sin(mesh.rotation.y), z: Math.cos(mesh.rotation.y) }
  if (mesh.userData.rig) animateSpecies(mesh, time, npc.speed, dt)
  else {
    updateJelly(mesh, dt, time, { speed: npc.speed, moveDir: npc.moveDir })
    updateFace3D(mesh, dt, time)
  }
  if (npc.marker.visible) npc.marker.position.set(0, npc.markerY + Math.sin(time * 3 + npc.home.x) * 0.15, 0)
  return toPlayer
}

export const FOLLOW_GAP = 3.2 // a following champion keeps about this far from you
const FOLLOW_SPEED = 8.5
const FOLLOW_SNAP = 34 // left this far behind (a glide, a fall), they catch up at once
function followPlayer(npc, dt, playerPos, toPlayer) {
  const { mesh } = npc
  if (npc.busyUntil && npc.busyUntil > npc.clock) return // mid-move (their power): main.js drives them
  if (toPlayer > FOLLOW_SNAP) {
    const a = Math.random() * Math.PI * 2
    mesh.position.x = playerPos.x + Math.cos(a) * FOLLOW_GAP
    mesh.position.z = playerPos.z + Math.sin(a) * FOLLOW_GAP
    return
  }
  // Aim for a spot beside and behind you.
  const side = npc.def.side ?? 1
  const fx = npc.dir?.x ?? 0 // the way you face (main.js's stepChampion sets it)
  const fz = npc.dir?.z ?? 1
  const tx = playerPos.x - fx * FOLLOW_GAP * 0.6 + fz * side * FOLLOW_GAP * 0.8
  const tz = playerPos.z - fz * FOLLOW_GAP * 0.6 - fx * side * FOLLOW_GAP * 0.8
  const dx = tx - mesh.position.x
  const dz = tz - mesh.position.z
  const d = Math.hypot(dx, dz)
  if (d > 0.6) {
    const speed = Math.min(FOLLOW_SPEED, 2 + d * 1.6)
    const step = Math.min(speed * dt, d)
    mesh.position.x += (dx / d) * step
    mesh.position.z += (dz / d) * step
    mesh.rotation.y = dampAngle(mesh.rotation.y, Math.atan2(dx, dz), 10, dt)
    npc.speed = speed
  } else {
    mesh.rotation.y = dampAngle(mesh.rotation.y, Math.atan2(playerPos.x - mesh.position.x, playerPos.z - mesh.position.z), 5, dt)
  }
}
