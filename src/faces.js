import * as THREE from 'three'
import { pickFaceOptions } from './logic/faceOptions.js'

const CANVAS_SIZE = 256

// Preset face for the player: huge mismatched googly eyes and a
// buck-tooth grin.
export const PLAYER_FACE = {
  eyes: {
    leftSize: 1.4,
    rightSize: 0.8,
    crossEyed: false,
    squintEye: null,
  },
  mouth: {
    type: 'buckTooth',
    tongueOut: false,
  },
  unibrow: false,
  rosyCheeks: true,
  freckles: false,
}

// Draws one eye: a white circle with a black outline and an offset pupil,
// or, if squinting, a thick closed arc instead.
function drawEye(ctx, cx, cy, baseRadius, sizeScale, { squint, pupilDirection }) {
  const radius = baseRadius * sizeScale

  if (squint) {
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = radius * 0.4
    ctx.beginPath()
    ctx.arc(cx, cy, radius * 0.6, Math.PI * 0.15, Math.PI * 0.85)
    ctx.stroke()
    return
  }

  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.fill()
  ctx.lineWidth = radius * 0.15
  ctx.strokeStyle = '#000000'
  ctx.stroke()

  const pupilRadius = radius * 0.45
  const offset = radius * 0.35
  ctx.fillStyle = '#000000'
  ctx.beginPath()
  ctx.arc(cx + pupilDirection.x * offset, cy + pupilDirection.y * offset, pupilRadius, 0, Math.PI * 2)
  ctx.fill()
}

// Draws the mouth shape (plus an optional tongue) centered at (cx, cy).
function drawMouth(ctx, cx, cy, type, tongueOut) {
  ctx.fillStyle = '#000000'
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 4

  switch (type) {
    case 'buckTooth':
      ctx.beginPath()
      ctx.ellipse(cx, cy, 40, 22, 0, 0, Math.PI, false)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(cx - 14, cy, 12, 16)
      ctx.fillRect(cx + 2, cy, 12, 16)
      break
    case 'derp':
      ctx.beginPath()
      ctx.moveTo(cx - 40, cy)
      ctx.quadraticCurveTo(cx - 20, cy + 20, cx, cy)
      ctx.quadraticCurveTo(cx + 20, cy - 20, cx + 40, cy)
      ctx.stroke()
      break
    case 'openO':
      ctx.beginPath()
      ctx.ellipse(cx, cy, 20, 26, 0, 0, Math.PI * 2)
      ctx.fill()
      break
    case 'lopsided':
      ctx.beginPath()
      ctx.moveTo(cx - 36, cy - 6)
      ctx.quadraticCurveTo(cx + 10, cy + 24, cx + 38, cy - 14)
      ctx.lineTo(cx + 30, cy - 2)
      ctx.quadraticCurveTo(cx, cy + 10, cx - 30, cy + 4)
      ctx.closePath()
      ctx.fill()
      break
    default:
      break
  }

  if (tongueOut) {
    ctx.fillStyle = '#ff6f91'
    ctx.beginPath()
    ctx.ellipse(cx, cy + 26, 14, 20, 0, 0, Math.PI * 2)
    ctx.fill()
  }
}

// Draws a goofy face described by `options` onto a canvas and returns a
// THREE.CanvasTexture with a transparent background.
export function createFaceTexture(options) {
  const canvas = document.createElement('canvas')
  canvas.width = CANVAS_SIZE
  canvas.height = CANVAS_SIZE
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

  const { eyes, mouth, unibrow, rosyCheeks, freckles } = options
  const baseEyeRadius = CANVAS_SIZE * 0.14
  const eyeY = CANVAS_SIZE * 0.4
  const leftEyeX = CANVAS_SIZE * 0.35
  const rightEyeX = CANVAS_SIZE * 0.65

  // Cross-eyed pupils point inward toward each other; otherwise they look
  // slightly downward, which reads as a dopey, unfocused stare.
  const leftPupilDirection = eyes.crossEyed ? { x: 1, y: 0 } : { x: 0, y: 0.2 }
  const rightPupilDirection = eyes.crossEyed ? { x: -1, y: 0 } : { x: 0, y: 0.2 }

  drawEye(ctx, leftEyeX, eyeY, baseEyeRadius, eyes.leftSize, {
    squint: eyes.squintEye === 'left',
    pupilDirection: leftPupilDirection,
  })
  drawEye(ctx, rightEyeX, eyeY, baseEyeRadius, eyes.rightSize, {
    squint: eyes.squintEye === 'right',
    pupilDirection: rightPupilDirection,
  })

  if (unibrow) {
    ctx.strokeStyle = '#3b2a1a'
    ctx.lineWidth = 10
    ctx.beginPath()
    ctx.moveTo(leftEyeX - 20, eyeY - baseEyeRadius * 1.6)
    ctx.lineTo(rightEyeX + 20, eyeY - baseEyeRadius * 1.6)
    ctx.stroke()
  }

  if (rosyCheeks) {
    ctx.fillStyle = 'rgba(255, 110, 130, 0.5)'
    for (const cheekX of [leftEyeX - 10, rightEyeX + 10]) {
      ctx.beginPath()
      ctx.arc(cheekX, eyeY + baseEyeRadius * 1.8, 16, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  if (freckles) {
    ctx.fillStyle = 'rgba(120, 72, 48, 0.6)'
    const spots = [
      [leftEyeX + 10, eyeY + 30],
      [leftEyeX + 28, eyeY + 38],
      [rightEyeX - 10, eyeY + 30],
      [rightEyeX - 28, eyeY + 38],
    ]
    for (const [fx, fy] of spots) {
      ctx.beginPath()
      ctx.arc(fx, fy, 3, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  drawMouth(ctx, CANVAS_SIZE * 0.5, CANVAS_SIZE * 0.68, mouth.type, mouth.tongueOut)

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

// Returns a THREE.CanvasTexture for a randomly generated goofy face. rng is
// injectable (default Math.random) so callers can pass a seeded rng for
// deterministic results.
export function randomGoofyFace(rng = Math.random) {
  return createFaceTexture(pickFaceOptions(rng))
}
