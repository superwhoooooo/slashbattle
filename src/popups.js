import * as THREE from 'three'
import { POPUP_LIFE, POPUP_POOL_SIZE, POPUP_RISE_SPEED } from './config.js'
import { particleAlpha } from './logic/particles.js'

// Canvas textures for popup text are small and few-valued ("+100",
// "RING OUT!", ...), so they're cached by text+color rather than redrawn
// every time the same kill score comes up.
const textureCache = new Map()

function createPopupTexture(text, color) {
  const key = `${text}|${color}`
  const cached = textureCache.get(key)
  if (cached) return cached

  const canvas = document.createElement('canvas')
  canvas.width = 320
  canvas.height = 110
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, 320, 110)
  ctx.font = 'bold 52px Orbitron, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineWidth = 7
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)'
  ctx.strokeText(text, 160, 58)
  ctx.fillStyle = color
  ctx.fillText(text, 160, 58)

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  textureCache.set(key, texture)
  return texture
}

// Builds the floating damage-number popup pool: a fixed set of sprites,
// all hidden, reused round-robin by showPopup. Create once per session
// (like the HUD or composer) and reset it on restart via resetPopups.
export function createPopupPool() {
  const sprites = []
  const group = new THREE.Group()
  for (let i = 0; i < POPUP_POOL_SIZE; i++) {
    const material = new THREE.SpriteMaterial({ transparent: true, depthTest: false, opacity: 0 })
    const sprite = new THREE.Sprite(material)
    sprite.visible = false
    sprite.userData.age = Infinity
    sprite.userData.life = POPUP_LIFE
    sprite.userData.startY = 0
    sprites.push(sprite)
    group.add(sprite)
  }
  return { group, sprites, cursor: 0 }
}

// Shows a popup at `position` reading `text` in `color` (a CSS color
// string), rising and fading over POPUP_LIFE. Reuses the next sprite in
// the pool round-robin, so a dense run of kills just recycles whichever
// popup has been up longest.
export function showPopup(pool, position, text, color) {
  const sprite = pool.sprites[pool.cursor]
  pool.cursor = (pool.cursor + 1) % pool.sprites.length

  sprite.material.map = createPopupTexture(text, color)
  sprite.material.needsUpdate = true
  sprite.scale.set(1.6, 0.55, 1)
  sprite.position.set(position.x, position.y + 1, position.z)
  sprite.userData.startY = sprite.position.y
  sprite.userData.age = 0
  sprite.visible = true
}

// Advances every live popup: rises at a constant rate and fades via the
// same particleAlpha envelope the particle pools use, then hides once
// its life is up.
export function updatePopups(pool, dt) {
  for (const sprite of pool.sprites) {
    if (sprite.userData.age > sprite.userData.life) continue
    sprite.userData.age += dt
    const alpha = particleAlpha(sprite.userData.age, sprite.userData.life)
    sprite.material.opacity = alpha
    sprite.position.y = sprite.userData.startY + (sprite.userData.age / sprite.userData.life) * POPUP_RISE_SPEED
    if (sprite.userData.age >= sprite.userData.life) sprite.visible = false
  }
}

// Instantly hides every live popup -- used on restart, since the pool is
// a per-session singleton like the particle system.
export function resetPopups(pool) {
  for (const sprite of pool.sprites) {
    sprite.visible = false
    sprite.userData.age = Infinity
    sprite.material.opacity = 0
  }
}
