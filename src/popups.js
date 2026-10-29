import * as THREE from 'three'
import { POPUP_LIFE, POPUP_POOL_SIZE, POPUP_RISE_SPEED } from './config.js'
import { particleAlpha } from './logic/particles.js'

// Canvas textures for popup text are small and few-valued ("+100",
// "RING OUT!", ...), so they're cached by text+color rather than redrawn
// every time the same kill score comes up.
const textureCache = new Map()

// The two-line sticker (a trick name over its points) uses a smaller
// weight for the name so a longer one (e.g. "Do Not Disturb") still
// fits, and keeps the points line at the original single-line size.
const POPUP_NAME_FONT = "800 26px Sora, system-ui, sans-serif"
const POPUP_POINTS_FONT = "800 40px Sora, system-ui, sans-serif"
// @fontsource/sora is imported in main.js but loads asynchronously; wait
// for it so a popup drawn before it's ready doesn't bake the fallback
// font permanently into its cached canvas texture (drawPopupSticker is
// re-run once this resolves).
const soraLoaded =
  typeof document !== 'undefined' && document.fonts
    ? Promise.all([POPUP_NAME_FONT, POPUP_POINTS_FONT].map((font) => document.fonts.load(font))).catch(() => [])
    : Promise.resolve([])

// A darker shade of a '#rrggbb' fill, for the sticker's drop-edge
// peeking out from beneath its main rounded-rect fill.
function darkenHex(hex, amount) {
  const value = parseInt(hex.slice(1), 16)
  const r = Math.round(((value >> 16) & 0xff) * amount)
  const g = Math.round(((value >> 8) & 0xff) * amount)
  const b = Math.round((value & 0xff) * amount)
  return `rgb(${r}, ${g}, ${b})`
}

// Whether a '#rrggbb' fill is light enough to read with dark ink text
// rather than white on top of it.
function isLightHex(hex) {
  const value = parseInt(hex.slice(1), 16)
  const r = (value >> 16) & 0xff
  const g = (value >> 8) & 0xff
  const b = value & 0xff
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6
}

// Draws the popup as a sticker: a rounded rect in `fill` with a darker
// bottom edge showing beneath it, and bold Sora text in ink or white
// depending on how light `fill` is. The sprite itself carries the tilt
// (see showPopup), so the canvas is drawn upright. `line2` is optional:
// without it, `line1` is centered on its own (the plain single-line
// sticker); with it, `line1` (a trick's name, e.g. "Cannonball") sits
// above `line2` (its points, e.g. "+250 ×3").
function drawPopupSticker(line1, line2, fill) {
  const canvas = document.createElement('canvas')
  canvas.width = 320
  canvas.height = 110
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, 320, 110)

  const x = 24, y = 14, w = 272, h = 70, radius = 18, edge = 6
  ctx.fillStyle = darkenHex(fill, 0.72)
  ctx.beginPath()
  ctx.roundRect(x, y + edge, w, h, radius)
  ctx.fill()
  ctx.fillStyle = fill
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, radius)
  ctx.fill()

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = isLightHex(fill) ? '#1a2433' : '#fff'
  if (line2) {
    ctx.font = POPUP_NAME_FONT
    ctx.fillText(line1, 160, y + h * 0.32)
    ctx.font = POPUP_POINTS_FONT
    ctx.fillText(line2, 160, y + h * 0.74)
  } else {
    ctx.font = POPUP_POINTS_FONT
    ctx.fillText(line1, 160, y + h / 2 + 2)
  }
  return canvas
}

function createPopupTexture(line1, line2, fill) {
  const key = `${line1}|${line2}|${fill}`
  const cached = textureCache.get(key)
  if (cached) return cached

  const texture = new THREE.CanvasTexture(drawPopupSticker(line1, line2, fill))
  texture.colorSpace = THREE.SRGBColorSpace // canvas colors are sRGB, not linear
  texture.needsUpdate = true
  textureCache.set(key, texture)

  soraLoaded.then(() => {
    texture.image = drawPopupSticker(line1, line2, fill)
    texture.needsUpdate = true
  })

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

// Shows a popup at `position` reading `line1` over `line2` (e.g. a
// trick's name, "Cannonball", over its points, "+250 ×3") on a
// sticker filled with `color` (a '#rrggbb' string), rising and fading
// over POPUP_LIFE. `line2` is optional -- omit it for a plain
// single-line sticker, like the old "+100"/"RING OUT!" popups. Reuses
// the next sprite in the pool round-robin, so a dense run of kills just
// recycles whichever popup has been up longest. Each popup gets its own
// slight tilt (-5 to -8 degrees) via the sprite's own rotation, so the
// cached, upright canvas texture can be shared.
export function showPopup(pool, position, line1, line2, color) {
  const sprite = pool.sprites[pool.cursor]
  pool.cursor = (pool.cursor + 1) % pool.sprites.length

  sprite.material.map = createPopupTexture(line1, line2, color)
  sprite.material.needsUpdate = true
  sprite.material.rotation = THREE.MathUtils.degToRad(-(5 + Math.random() * 3))
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
