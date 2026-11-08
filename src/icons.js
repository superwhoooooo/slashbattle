// Item icons: instead of emoji, every weapon and pet is drawn as a small render
// of its real 3D model (the same mesh used in the game), and abilities and
// power-ups as little pictograms of what they do. Everything is drawn once,
// lazily, and cached as a data URL.
import * as THREE from 'three'
import { createWeaponModel } from './characters.js'
import { createPetModel } from './petModels.js'
import { ABILITIES, PETS, POWERUPS, WEAPONS } from './logic/items.js'

const SIZE = 112
const cache = new Map()

let renderer = null
let scene = null
let camera = null

function ensureStage() {
  if (renderer) return
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
  renderer.setSize(SIZE, SIZE, false)
  renderer.setPixelRatio(1)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.NeutralToneMapping
  scene = new THREE.Scene()
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8aa0, 1.6))
  const key = new THREE.DirectionalLight(0xffffff, 2.4)
  key.position.set(2, 3, 4)
  scene.add(key)
  const rim = new THREE.DirectionalLight(0xbfd8ff, 1.2)
  rim.position.set(-3, 1, -2)
  scene.add(rim)
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 50)
}

// The icon stage is a second WebGL context; browsers cap those and a lost one can blank the main
// game, so give it back shortly after the last icon is drawn (the data URLs are cached).
let releaseTimer = 0
function scheduleRelease() {
  clearTimeout(releaseTimer)
  releaseTimer = setTimeout(() => {
    if (!renderer) return
    renderer.dispose()
    renderer.forceContextLoss()
    renderer = null
    scene = null
    camera = null
  }, 1500)
}

// Renders `object` (centered and scaled to fit) and returns a data URL.
function snapshot(object, options) {
  try {
    return renderSnapshot(object, options)
  } catch (error) {
    console.error('icon render failed', error)
    return '' // no picture, but the HUD and game keep working
  }
}

function renderSnapshot(object, { tilt = 0, yaw = 0, pitch = 0.35 } = {}) {
  ensureStage()
  const holder = new THREE.Group()
  holder.add(object)
  holder.rotation.z = tilt
  holder.rotation.y = yaw
  holder.rotation.x = pitch
  holder.updateMatrixWorld(true)
  const box = new THREE.Box3().setFromObject(holder)
  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  const extent = Math.max(size.x, size.y, 0.001) * 0.56
  holder.position.copy(center).negate()
  const frame = new THREE.Group()
  frame.add(holder)
  scene.add(frame)
  camera.left = -extent
  camera.right = extent
  camera.top = extent
  camera.bottom = -extent
  camera.updateProjectionMatrix()
  camera.position.set(0, 0, 10)
  camera.lookAt(0, 0, 0)
  renderer.setClearColor(0x000000, 0)
  renderer.render(scene, camera)
  const url = renderer.domElement.toDataURL('image/png')
  scene.remove(frame)
  scheduleRelease()
  return url
}

function weaponIcon(id) {
  const model = createWeaponModel(id)
  // Hide the invisible swing-trail anchor so it doesn't stretch the framing.
  // Weapons run along +y from the grip: lean them up and to the right.
  return snapshot(model, { tilt: -Math.PI / 4, yaw: 0.35, pitch: 0.25 })
}

function petIcon(id) {
  const model = createPetModel(PETS[id])
  return snapshot(model, { yaw: -0.55, pitch: 0.28 })
}

// ---- 2D pictograms for abilities and power-ups ---------------------------

const TAU = Math.PI * 2

function line(ctx, pts, close = false) {
  ctx.beginPath()
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
  if (close) ctx.closePath()
}
function fillStroke(ctx, fill, stroke, w = 5) {
  if (fill) {
    ctx.fillStyle = fill
    ctx.fill()
  }
  if (stroke) {
    ctx.lineWidth = w
    ctx.strokeStyle = stroke
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.stroke()
  }
}
function circle(ctx, x, y, r) {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, TAU)
}
function bolt(ctx, cx, cy, s, fill = '#ffd93b', stroke = '#a86b00') {
  line(ctx, [[cx + 0.1 * s, cy - s], [cx - 0.55 * s, cy + 0.1 * s], [cx - 0.05 * s, cy + 0.1 * s], [cx - 0.2 * s, cy + s], [cx + 0.6 * s, cy - 0.2 * s], [cx + 0.08 * s, cy - 0.2 * s]], true)
  fillStroke(ctx, fill, stroke, 4)
}
function glow(ctx, x, y, r, color) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r)
  g.addColorStop(0, color)
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  circle(ctx, x, y, r)
  ctx.fill()
}
function spiral(ctx, cx, cy, r, turns, color, w = 5) {
  ctx.beginPath()
  for (let i = 0; i <= 60; i++) {
    const t = i / 60
    const a = t * turns * TAU
    const rr = r * t
    const x = cx + Math.cos(a) * rr
    const y = cy + Math.sin(a) * rr
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
  }
  fillStroke(ctx, null, color, w)
}
function heart(ctx, cx, cy, s, fill, stroke) {
  ctx.beginPath()
  ctx.moveTo(cx, cy + s * 0.85)
  ctx.bezierCurveTo(cx - s * 1.5, cy - s * 0.1, cx - s * 0.6, cy - s * 1.1, cx, cy - s * 0.35)
  ctx.bezierCurveTo(cx + s * 0.6, cy - s * 1.1, cx + s * 1.5, cy - s * 0.1, cx, cy + s * 0.85)
  fillStroke(ctx, fill, stroke, 4)
}

const DRAW = {
  // abilities
  blink(c) {
    for (const [x, a] of [[28, 0.25], [44, 0.5], [60, 1]]) {
      c.globalAlpha = a
      line(c, [[x, 28], [x + 22, 56], [x, 84]])
      fillStroke(c, null, '#7a8cff', 9)
    }
    c.globalAlpha = 1
    glow(c, 82, 56, 20, 'rgba(160,190,255,0.9)')
  },
  shockwave(c) {
    glow(c, 56, 56, 16, 'rgba(255,170,60,0.9)')
    for (const [r, col] of [[18, '#ffb347'], [31, '#ff7a3a'], [44, '#ff4a3a']]) {
      circle(c, 56, 56, r)
      fillStroke(c, null, col, 6)
    }
  },
  heal(c) {
    line(c, [[44, 18], [68, 18], [68, 44], [94, 44], [94, 68], [68, 68], [68, 94], [44, 94], [44, 68], [18, 68], [18, 44], [44, 44]], true)
    fillStroke(c, '#46d27a', '#1b8a4a', 5)
  },
  shield(c) {
    circle(c, 56, 56, 38)
    fillStroke(c, 'rgba(110,235,255,0.55)', '#2cc5e8', 6)
    c.beginPath()
    c.arc(56, 56, 26, Math.PI * 1.1, Math.PI * 1.6)
    fillStroke(c, null, 'rgba(255,255,255,0.9)', 6)
  },
  rage(c) {
    c.beginPath()
    c.moveTo(56, 12)
    c.bezierCurveTo(88, 42, 100, 62, 82, 86)
    c.bezierCurveTo(74, 98, 38, 98, 30, 84)
    c.bezierCurveTo(14, 62, 40, 52, 44, 30)
    c.bezierCurveTo(50, 40, 56, 34, 56, 12)
    fillStroke(c, '#ff5a2a', '#a82a10', 5)
    c.beginPath()
    c.moveTo(56, 48)
    c.bezierCurveTo(72, 66, 74, 80, 56, 88)
    c.bezierCurveTo(40, 84, 40, 66, 56, 48)
    fillStroke(c, '#ffd23f', null)
  },
  lunge(c) {
    line(c, [[14, 78], [76, 38]])
    fillStroke(c, null, '#4de0c0', 9)
    line(c, [[62, 22], [96, 38], [74, 60]], true)
    fillStroke(c, '#c8fff0', '#2aa890', 4)
    line(c, [[20, 96], [60, 66]])
    fillStroke(c, null, 'rgba(77,224,192,0.5)', 5)
  },
  thunder(c) {
    for (const [x, y, r] of [[38, 44, 20], [62, 38, 24], [80, 48, 17]]) {
      circle(c, x, y, r)
      c.fillStyle = '#7c8aa6'
      c.fill()
    }
    bolt(c, 58, 76, 28)
  },
  gravity(c) {
    glow(c, 56, 56, 46, 'rgba(120,80,255,0.55)')
    spiral(c, 56, 56, 40, 2.4, '#8a6bff', 7)
    circle(c, 56, 56, 8)
    fillStroke(c, '#1a1030', null)
  },
  volley(c) {
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU
      circle(c, 56 + Math.cos(a) * 36, 56 + Math.sin(a) * 36, 7)
      fillStroke(c, '#ffe14a', '#c98a00', 3)
    }
    circle(c, 56, 56, 12)
    fillStroke(c, '#ff7a3a', '#a83a10', 4)
  },
  drain(c) {
    heart(c, 56, 52, 30, '#d12a5a', '#6e0a2a')
    line(c, [[38, 62], [43, 80], [48, 62]], true)
    fillStroke(c, '#fff', '#6e0a2a', 3)
    line(c, [[64, 62], [69, 80], [74, 62]], true)
    fillStroke(c, '#fff', '#6e0a2a', 3)
  },
  frenzy(c) {
    bolt(c, 40, 56, 40)
    bolt(c, 74, 58, 34, '#ff8a3b', '#a83a10')
  },
  sprint(c) {
    line(c, [[28, 36], [28, 74], [78, 74], [96, 62], [78, 56], [58, 40], [48, 36]], true)
    fillStroke(c, '#ff6a4d', '#a82a1a', 5)
    for (const y of [40, 56, 72]) {
      line(c, [[8, y], [22, y]])
      fillStroke(c, null, '#9be3ff', 5)
    }
  },
  meteor(c) {
    line(c, [[96, 16], [40, 70], [58, 70], [96, 30]], true)
    c.globalAlpha = 0.8
    fillStroke(c, '#ff9a3a', null)
    c.globalAlpha = 1
    circle(c, 38, 76, 26)
    fillStroke(c, '#ff5a2a', '#7a1a0a', 5)
    circle(c, 32, 70, 9)
    fillStroke(c, '#ffd23f', null)
  },
  ghost(c) {
    c.beginPath()
    c.moveTo(24, 96)
    c.lineTo(24, 54)
    c.bezierCurveTo(24, 10, 88, 10, 88, 54)
    c.lineTo(88, 96)
    c.lineTo(76, 84)
    c.lineTo(64, 96)
    c.lineTo(52, 84)
    c.lineTo(40, 96)
    c.closePath()
    fillStroke(c, '#f2eeff', '#8a7fd0', 5)
    for (const x of [44, 68]) {
      circle(c, x, 50, 6)
      fillStroke(c, '#2a2450', null)
    }
  },
  vacuum(c) {
    glow(c, 56, 56, 46, 'rgba(60,20,120,0.7)')
    spiral(c, 56, 56, 42, 2.2, '#b48cff', 6)
    circle(c, 56, 56, 12)
    fillStroke(c, '#050210', '#b48cff', 3)
  },
  quake(c) {
    line(c, [[8, 70], [104, 70]])
    fillStroke(c, null, '#7a4a2a', 8)
    line(c, [[56, 70], [46, 86], [58, 92], [48, 106]])
    fillStroke(c, null, '#3a1a0a', 5)
    line(c, [[56, 70], [72, 54], [64, 44], [78, 30]])
    fillStroke(c, null, '#ff7a3a', 6)
    for (const [x, y] of [[30, 56], [86, 62], [22, 40]]) {
      circle(c, x, y, 6)
      fillStroke(c, '#a07050', null)
    }
  },
  fanblast(c) {
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI / 2 + (i - 3) * 0.32
      const x = 56 + Math.cos(a) * 52
      const y = 98 + Math.sin(a) * 78
      line(c, [[56, 98], [x, y]])
      fillStroke(c, null, 'rgba(255,200,60,0.55)', 4)
      circle(c, x, y, 7)
      fillStroke(c, '#ffb02a', '#a8620a', 3)
    }
  },
  refresh(c) {
    for (const start of [0.2, Math.PI + 0.2]) {
      c.beginPath()
      c.arc(56, 56, 34, start, start + 2.5)
      fillStroke(c, null, '#46d27a', 10)
      const end = start + 2.5
      const ex = 56 + Math.cos(end) * 34
      const ey = 56 + Math.sin(end) * 34
      circle(c, ex, ey, 1)
      line(c, [[ex + Math.cos(end + 1.9) * 16, ey + Math.sin(end + 1.9) * 16], [ex + Math.cos(end - 1.3) * 16, ey + Math.sin(end - 1.3) * 16], [ex + Math.cos(end + 0.3) * 4, ey + Math.sin(end + 0.3) * 4]], true)
      fillStroke(c, '#46d27a', '#1b8a4a', 3)
    }
  },
  // power-ups
  swift(c) {
    line(c, [[34, 18], [60, 18], [60, 54], [96, 70], [96, 92], [34, 92]], true)
    fillStroke(c, '#8a5a3a', '#4a2a14', 5)
    line(c, [[34, 80], [96, 80]])
    fillStroke(c, null, '#e8d8b8', 7)
    for (const y of [30, 46]) {
      line(c, [[6, y], [24, y]])
      fillStroke(c, null, '#9be3ff', 5)
    }
  },
  heavy(c) {
    line(c, [[20, 56], [92, 56]])
    fillStroke(c, null, '#555b66', 8)
    for (const x of [24, 88]) {
      c.beginPath()
      c.roundRect(x - 9, 28, 18, 56, 5)
      fillStroke(c, '#ff6a4d', '#a82a1a', 4)
    }
    for (const x of [40, 72]) {
      c.beginPath()
      c.roundRect(x - 7, 36, 14, 40, 4)
      fillStroke(c, '#ff8a6d', '#a82a1a', 4)
    }
  },
  quick(c) {
    circle(c, 56, 58, 38)
    fillStroke(c, '#fff', '#2b3a55', 6)
    line(c, [[56, 58], [56, 34]])
    fillStroke(c, null, '#2b3a55', 6)
    line(c, [[56, 58], [76, 66]])
    fillStroke(c, null, '#ff6a4d', 6)
    bolt(c, 92, 26, 18)
  },
  thick(c) {
    const rows = [[14, 20], [14, 52], [14, 84]]
    rows.forEach(([x, y], r) => {
      for (let i = 0; i < 2; i++) {
        const bx = x + (r % 2 ? -18 : 0) + i * 44
        c.beginPath()
        c.roundRect(bx + 8, y, 40, 26, 4)
        fillStroke(c, r % 2 ? '#c8643e' : '#d9774a', '#7a3a1e', 4)
      }
    })
  },
  greed(c) {
    line(c, [[30, 16], [82, 16], [102, 42], [56, 100], [10, 42]], true)
    fillStroke(c, '#6fe0ff', '#1b86b0', 5)
    line(c, [[10, 42], [102, 42]])
    fillStroke(c, null, '#1b86b0', 4)
    line(c, [[30, 16], [40, 42], [56, 100], [72, 42], [82, 16]])
    fillStroke(c, null, '#bff2ff', 3)
  },
  shove(c) {
    c.beginPath()
    c.roundRect(22, 22, 62, 58, 26)
    fillStroke(c, '#e83a4a', '#8a1424', 5)
    c.beginPath()
    c.roundRect(28, 66, 40, 34, 8)
    fillStroke(c, '#fff', '#8a1424', 4)
    c.beginPath()
    c.arc(42, 42, 14, 0, TAU)
    fillStroke(c, 'rgba(255,255,255,0.35)', null)
    for (const y of [26, 44]) {
      line(c, [[92, y], [106, y - 6]])
      fillStroke(c, null, '#ffb02a', 5)
    }
  },
  regen(c) {
    for (const [x, y, s] of [[56, 44, 26], [34, 76, 16], [80, 74, 18]]) {
      c.beginPath()
      c.moveTo(x, y + s)
      c.quadraticCurveTo(x - s * 1.1, y, x, y - s)
      c.quadraticCurveTo(x + s * 1.1, y, x, y + s)
      fillStroke(c, '#46d27a', '#1b8a4a', 4)
    }
    line(c, [[56, 98], [56, 62]])
    fillStroke(c, null, '#1b8a4a', 5)
    line(c, [[44, 20], [68, 20]])
    fillStroke(c, null, '#ff6a8a', 6)
    line(c, [[56, 8], [56, 32]])
    fillStroke(c, null, '#ff6a8a', 6)
  },
  haste(c) {
    line(c, [[28, 14], [84, 14], [84, 22], [64, 56], [84, 90], [84, 98], [28, 98], [28, 90], [48, 56], [28, 22]], true)
    fillStroke(c, 'rgba(180,160,255,0.5)', '#6a4cd8', 5)
    line(c, [[40, 90], [72, 90], [56, 66]], true)
    fillStroke(c, '#ffd23f', null)
    line(c, [[40, 22], [72, 22], [56, 44]], true)
    fillStroke(c, '#ffd23f', null)
    bolt(c, 100, 56, 14)
  },
  magnet(c) {
    c.beginPath()
    c.arc(56, 52, 30, Math.PI, 0)
    c.lineTo(86, 86)
    c.lineTo(66, 86)
    c.lineTo(66, 52)
    c.arc(56, 52, 10, 0, Math.PI, true)
    c.lineTo(46, 86)
    c.lineTo(26, 86)
    c.closePath()
    fillStroke(c, '#e83a4a', '#8a1424', 5)
    for (const x of [36, 76]) {
      c.beginPath()
      c.rect(x - 10, 80, 20, 14)
      fillStroke(c, '#e8ecf4', '#8a90a0', 4)
    }
    for (const [x, y] of [[20, 106], [56, 104], [92, 106]]) {
      circle(c, x, y, 4)
      fillStroke(c, '#3cc9e8', null)
    }
  },
  dizzy(c) {
    spiral(c, 56, 56, 38, 2.4, '#ffd23f', 7)
    for (const [x, y] of [[24, 28], [88, 34], [40, 92]]) {
      circle(c, x, y, 7)
      fillStroke(c, '#fff3b0', '#c98a00', 3)
    }
  },
  starfall(c) {
    for (const [x, y, r] of [[34, 40, 16], [76, 32, 12], [60, 80, 18]]) {
      line(c, [[x + r * 1.8, y - r * 1.8], [x, y]])
      fillStroke(c, null, 'rgba(255,200,90,0.6)', 6)
      circle(c, x, y, r * 0.6)
      fillStroke(c, '#ffe9a0', '#d98a1a', 3)
    }
  },
  crossfire(c) {
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      line(c, [[56 + dx * 14, 56 + dy * 14], [56 + dx * 44, 56 + dy * 44]])
      fillStroke(c, null, '#7ae8ff', 8)
    }
    circle(c, 56, 56, 11)
    fillStroke(c, '#ffffff', '#2c9ac0', 4)
  },
  bulwark(c) {
    line(c, [[20, 96], [20, 42], [34, 42], [34, 30], [46, 30], [46, 42], [66, 42], [66, 30], [78, 30], [78, 42], [92, 42], [92, 96]], true)
    fillStroke(c, '#b8c4d6', '#5a6a82', 5)
    c.beginPath()
    c.arc(56, 96, 14, Math.PI, 0)
    fillStroke(c, '#3a4a62', null)
  },
  glass(c) {
    glow(c, 56, 56, 40, 'rgba(255,79,163,0.55)')
    circle(c, 56, 56, 26)
    fillStroke(c, 'rgba(255,200,230,0.9)', '#c2307a', 5)
    bolt(c, 56, 56, 26)
  },
  iron(c) {
    c.beginPath()
    c.moveTo(56, 12)
    c.lineTo(94, 26)
    c.lineTo(88, 68)
    c.quadraticCurveTo(80, 92, 56, 102)
    c.quadraticCurveTo(32, 92, 24, 68)
    c.lineTo(18, 26)
    c.closePath()
    fillStroke(c, '#9fb0c6', '#56677f', 5)
    line(c, [[56, 24], [56, 88]])
    fillStroke(c, null, '#56677f', 4)
  },
  thirst(c) {
    c.beginPath()
    c.moveTo(56, 12)
    c.bezierCurveTo(84, 46, 94, 64, 78, 86)
    c.bezierCurveTo(66, 100, 46, 100, 34, 86)
    c.bezierCurveTo(18, 64, 30, 46, 56, 12)
    fillStroke(c, '#d12a4a', '#6e0a1e', 5)
    circle(c, 46, 70, 6)
    fillStroke(c, 'rgba(255,255,255,0.7)', null)
  },
  turbo(c) {
    line(c, [[56, 10], [76, 62], [56, 52], [36, 62]], true)
    fillStroke(c, '#ff8a3b', '#a83a10', 5)
    for (const x of [44, 56, 68]) {
      line(c, [[x, 72], [x, 98]])
      fillStroke(c, null, '#ffd23f', 5)
    }
  },
  jackpot(c) {
    for (const [x, y] of [[38, 56], [74, 56]]) {
      circle(c, x, y, 22)
      fillStroke(c, '#f5c518', '#a87c00', 5)
    }
    circle(c, 56, 78, 22)
    fillStroke(c, '#ffe066', '#a87c00', 5)
  },
  focus(c) {
    for (const r of [14, 28, 42]) {
      circle(c, 56, 56, r)
      fillStroke(c, null, '#6fd3c8', 5)
    }
    circle(c, 56, 56, 6)
    fillStroke(c, '#2a8a80', null)
  },
  leech(c) {
    line(c, [[18, 78], [96, 78], [96, 94], [18, 94]], true)
    fillStroke(c, '#f6dba8', '#a8723a', 4)
    line(c, [[18, 78], [18, 50], [96, 78]], true)
    fillStroke(c, '#fff0f4', '#c46a8a', 4)
    line(c, [[18, 50], [96, 78]])
    fillStroke(c, null, '#e86a9a', 6)
    circle(c, 28, 38, 9)
    fillStroke(c, '#e83a4a', '#8a1424', 3)
  },
}

function pictogram(kind, id) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = SIZE
  const ctx = canvas.getContext('2d')
  const draw = DRAW[id]
  if (draw) draw(ctx)
  else {
    circle(ctx, 56, 56, 30)
    fillStroke(ctx, '#b0b8c8', '#6a7488')
  }
  return canvas.toDataURL('image/png')
}

// A dragon rendered in its chosen scale (cached per dragon + scale), for the Dragon Den and loadout.
export function dragonIconUrl(tuned) {
  const key = `dragon:${tuned.id}:${tuned.scale.id}`
  let url = cache.get(key)
  if (!url) {
    try {
      url = snapshot(createPetModel(tuned), { yaw: -0.6, pitch: 0.3 })
    } catch (error) {
      console.warn('dragon icon failed', key, error)
      url = iconUrl('pet', tuned.id)
    }
    cache.set(key, url)
  }
  return url
}

// The icon for an item as a data URL (cached). `kind`: weapon | ability | pet | powerup.
export function iconUrl(kind, id) {
  const key = `${kind}:${id}`
  let url = cache.get(key)
  if (url) return url
  try {
    url = kind === 'weapon' ? weaponIcon(id) : kind === 'pet' ? petIcon(id) : pictogram(kind, id)
  } catch (error) {
    console.warn('icon failed', key, error)
    url = pictogram(kind, id)
  }
  cache.set(key, url)
  return url
}

// An <img> for the item; `inline` makes a small one that sits in a line of text.
export function iconImg(kind, id, inline = false) {
  const img = document.createElement('img')
  img.src = iconUrl(kind, id)
  img.alt = ''
  img.draggable = false
  img.className = inline ? 'inline-icon' : 'item-icon'
  return img
}

export const ITEM_DEFS = { weapon: WEAPONS, ability: ABILITIES, pet: PETS, powerup: POWERUPS }
