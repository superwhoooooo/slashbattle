// The rifle scope's on-screen side: a reticle that follows the cursor (its shape
// comes from the scope: dot, ring or cross), a laser sight line along the aim, and
// a smoothed camera zoom factor (a longer-range scope pulls the camera back so you
// can see what you're shooting at). The numbers come from logic/rifles.js.
import * as THREE from 'three'

const STYLE = `
#scope-reticle { position: fixed; left: 0; top: 0; width: 0; height: 0; pointer-events: none; z-index: 20; display: none; }
#scope-reticle i { position: absolute; left: 0; top: 0; transform: translate(-50%, -50%); border-radius: 50%; border: 2px solid rgba(255,255,255,0.9); box-shadow: 0 0 0 1px rgba(20,26,40,0.5), 0 0 8px rgba(255,80,80,0.6); }
#scope-reticle b { display: none; }
#scope-reticle.steady b { display: block; position: absolute; left: 0; top: 0; width: 56px; height: 56px; transform: translate(-50%, -50%); border-radius: 50%; background: conic-gradient(rgba(255,210,63,0.95) var(--steady, 0deg), transparent 0); -webkit-mask: radial-gradient(circle, transparent 23px, #000 24px, #000 27px, transparent 28px); mask: radial-gradient(circle, transparent 23px, #000 24px, #000 27px, transparent 28px); }
#scope-reticle.locked i { border-color: #ffd23f; box-shadow: 0 0 10px 2px rgba(255,210,63,0.9); }
#fp-crosshair { position: fixed; left: 50%; top: 50%; width: 14px; height: 14px; transform: translate(-50%, -50%); border-radius: 50%; border: 2px solid rgba(255,255,255,0.9); box-shadow: 0 0 0 1px rgba(20,26,40,0.55); pointer-events: none; z-index: 20; display: none; }
#scope-reticle.dot i { width: 6px; height: 6px; background: #ff4a4a; border-color: #fff; }
#scope-reticle.ring i { width: 30px; height: 30px; }
#scope-reticle.cross i { width: 44px; height: 44px; }
#scope-reticle.cross::before, #scope-reticle.cross::after { content: ''; position: absolute; background: rgba(255,255,255,0.9); box-shadow: 0 0 0 1px rgba(20,26,40,0.5); }
#scope-reticle.cross::before { left: -26px; top: -1px; width: 52px; height: 2px; }
#scope-reticle.cross::after { left: -1px; top: -26px; width: 2px; height: 52px; }
`

export function createScope(scene) {
  const style = document.createElement('style')
  style.textContent = STYLE
  document.head.appendChild(style)
  const reticle = document.createElement('div')
  reticle.id = 'scope-reticle'
  reticle.appendChild(document.createElement('i'))
  reticle.appendChild(document.createElement('b'))
  document.body.appendChild(reticle)
  // First person: a little circle at the middle of the screen, where every shot is aimed.
  const crosshair = document.createElement('div')
  crosshair.id = 'fp-crosshair'
  document.body.appendChild(crosshair)

  const laser = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, 1)]),
    new THREE.LineBasicMaterial({ color: 0xff3030, transparent: true, opacity: 0.55, depthWrite: false }),
  )
  laser.visible = false
  laser.frustumCulled = false
  scene.add(laser)

  return {
    zoom: 1,
    // `tuned` is the rifle in hand (logic/rifles.js's tuneRifle) or null. Returns the camera zoom factor.
    update(tuned, { player, aimAngle, mouse, showCursor, firstPerson = false, dt, steady = 0 }) {
      crosshair.style.display = firstPerson ? 'block' : 'none'
      const wantZoom = tuned ? tuned.zoom : 1
      this.zoom += (wantZoom - this.zoom) * (1 - Math.exp(-4 * dt))
      const on = Boolean(tuned) && showCursor
      reticle.style.display = on ? 'block' : 'none'
      if (on) {
        reticle.className = tuned.reticle + (tuned.steady > 0 ? ' steady' : '') + (steady >= 0.99 ? ' locked' : '')
        reticle.style.setProperty('--steady', String(Math.round(steady * 360)) + 'deg')
        reticle.style.transform = `translate(${mouse.x}px, ${mouse.y}px)`
      }
      const showLaser = Boolean(tuned?.laser) && aimAngle !== null && !player.hidden
      laser.visible = showLaser
      if (showLaser) {
        const length = tuned.bullet.speed * tuned.bullet.life
        const dx = Math.sin(aimAngle)
        const dz = Math.cos(aimAngle)
        const pos = laser.geometry.attributes.position
        pos.setXYZ(0, player.position.x + dx * 0.9, 0.7, player.position.z + dz * 0.9)
        pos.setXYZ(1, player.position.x + dx * length, 0.7, player.position.z + dz * length)
        pos.needsUpdate = true
      }
      return this.zoom
    },
  }
}
