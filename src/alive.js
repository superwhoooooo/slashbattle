// Makes live monsters feel aware: their pupils follow the player, they blink now and
// then, and they bounce along while moving. Purely visual; call once per frame for a
// monster that is neither spawning, dying nor falling.
const LOOK_STRENGTH = 0.85 // share of the pupil's travel used to look at the player
const HOP_HEIGHT = 0.16 // world units at a full-speed hop
const HOP_RATE = 9 // radians/second of the hop cycle at full speed

export function animateAlive(mesh, target, dt, time) {
  const data = mesh.userData
  const face = data.face3d
  const alive = (data.alive ??= {
    phase: Math.random() * 6.28,
    nextBlink: time + 1 + Math.random() * 3,
    blinkT: -1,
    hop: 0,
  })

  // Pupils look toward the target, in the monster's own frame (+z is forward, +x its left).
  if (face) {
    const rel = Math.atan2(target.x - mesh.position.x, target.z - mesh.position.z) - mesh.rotation.y
    const lookX = Math.sin(rel) * LOOK_STRENGTH
    const lookY = 0.15 + 0.1 * Math.cos(rel)
    for (const eye of [face.eyes.left, face.eyes.right]) {
      eye.look = eye.look ?? { x: 0, y: 0 }
      const k = 1 - Math.exp(-12 * dt)
      eye.look.x += (lookX - eye.look.x) * k
      eye.look.y += (lookY - eye.look.y) * k
    }

    // Blink: squash both eyes shut and open again over ~0.14s.
    if (alive.blinkT < 0 && time >= alive.nextBlink) alive.blinkT = 0
    let open = 1
    if (alive.blinkT >= 0) {
      alive.blinkT += dt
      const p = alive.blinkT / 0.14
      open = p >= 1 ? 1 : 1 - Math.sin(p * Math.PI) * 0.9
      if (p >= 1) {
        alive.blinkT = -1
        alive.nextBlink = time + 1.5 + Math.random() * 4
      }
    }
    face.eyes.left.group.scale.y = open
    face.eyes.right.group.scale.y = open
  }

  // Bounce along while moving; settle back to the ground when still.
  const moving = Math.min(1, (data.speed ?? 0) / 3)
  alive.hop += dt * HOP_RATE * (0.4 + moving)
  const target_y = moving > 0.05 ? Math.abs(Math.sin(alive.hop + alive.phase)) * HOP_HEIGHT * moving : 0
  mesh.position.y += (target_y - mesh.position.y) * (1 - Math.exp(-18 * dt))
}
