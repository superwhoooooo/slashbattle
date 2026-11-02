// Detailed, glowing models for the hotbar weapons. Every model follows the
// same contract as the originals in characters.js: the group's origin is the
// grip and +y runs toward the business end, `userData.tip` marks the far end
// for the swing trail, and `userData.flex(progress)` (optional) animates moving
// parts. Shapes are real geometry (tapered blades, curved heads, spikes, rings,
// gems) with emissive cores and additive glow twins instead of plain boxes.
import * as THREE from 'three'

const TAU = Math.PI * 2
// Everything the player carries glows a bit less than it used to.
const PLAYER_GLOW = 0.6
const PLAYER_AURA = 0.55

const metal = (color = 0x2a2c36, roughness = 0.32, metalness = 0.8) => new THREE.MeshStandardMaterial({ color, roughness, metalness })
const glowMat = (color, intensity = 1.3) =>
  new THREE.MeshStandardMaterial({ color, emissive: new THREE.Color(color), emissiveIntensity: intensity * PLAYER_GLOW, roughness: 0.25, metalness: 0.2 })
const auraMat = (color, opacity = 0.22) =>
  new THREE.MeshBasicMaterial({ color, transparent: true, opacity: opacity * PLAYER_AURA, blending: THREE.AdditiveBlending, depthWrite: false })

function place(mesh, x = 0, y = 0, z = 0) {
  mesh.position.set(x, y, z)
  return mesh
}
function box(w, h, d, mat, x, y, z) {
  return place(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat), x, y, z)
}
function cyl(rt, rb, h, mat, x, y, z, seg = 12) {
  return place(new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat), x, y, z)
}
function sphere(r, mat, x, y, z, detail = 14) {
  return place(new THREE.Mesh(new THREE.SphereGeometry(r, detail, Math.max(6, detail - 4)), mat), x, y, z)
}
// A glowing faceted gem with a halo.
function gem(r, color, x, y, z) {
  const g = new THREE.Group()
  g.add(new THREE.Mesh(new THREE.OctahedronGeometry(r, 0), glowMat(color, 1.8)))
  const halo = new THREE.Mesh(new THREE.SphereGeometry(r * 2.1, 12, 8), auraMat(color, 0.25))
  g.add(halo)
  return place(g, x, y, z)
}
function torus(r, tube, mat, x, y, z, rx = Math.PI / 2) {
  const t = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 8, 24), mat)
  t.rotation.x = rx
  return place(t, x, y, z)
}
function tiltX(mesh, angle) {
  mesh.rotation.x = angle
  return mesh
}
function cone(r, h, mat, x, y, z, seg = 8) {
  return place(new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), mat), x, y, z)
}

// A pointed, optionally curved blade lying in the xy plane, base at y = 0.
// Returns a group: a bright core with a hot edge and an additive glow twin.
function blade(length, width, color, { curve = 0, point = 0.16, thick = 0.035, base = 0 } = {}) {
  const shape = new THREE.Shape()
  const shoulder = length * (1 - point)
  shape.moveTo(-width / 2, base)
  shape.lineTo(-width / 2, shoulder * 0.55)
  shape.quadraticCurveTo(-width / 2 + curve * 0.45, shoulder, curve, length)
  shape.quadraticCurveTo(width / 2 + curve * 0.55, shoulder, width / 2 + curve * 0.1, shoulder * 0.55)
  shape.lineTo(width / 2, base)
  shape.closePath()
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: thick, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 1, curveSegments: 6 })
  geometry.translate(0, 0, -thick / 2)
  const group = new THREE.Group()
  group.add(new THREE.Mesh(geometry, glowMat(color, 1.1)))
  const twin = new THREE.Mesh(geometry, auraMat(color, 0.22))
  twin.scale.set(1.5, 1.02, 2.6)
  group.add(twin)
  // A pale spine so the blade reads as metal with a hot edge.
  const spine = new THREE.Mesh(new THREE.BoxGeometry(width * 0.18, length * 0.82, thick * 1.5), metal(0xf2f6ff, 0.2, 0.9))
  spine.position.set(curve * 0.25, length * 0.45 + base, 0)
  group.add(spine)
  return group
}

function tipAt(group, x, y, z = 0) {
  const tip = new THREE.Object3D()
  tip.position.set(x, y, z)
  group.add(tip)
  group.userData.tip = tip
  return tip
}

// A leather-wrapped grip: dark cylinder with glowing bands.
function wrappedGrip(group, color, length, y0 = 0, radius = 0.032) {
  group.add(cyl(radius, radius, length, metal(0x1b1d26, 0.7, 0.2), 0, y0 + length / 2, 0))
  const bands = Math.max(2, Math.floor(length / 0.07))
  for (let i = 0; i < bands; i++) {
    group.add(torus(radius * 1.12, 0.008, glowMat(color, 0.9), 0, y0 + 0.04 + (i * (length - 0.06)) / Math.max(1, bands - 1), 0))
  }
}

const BUILDERS = {
  sword(group, color) {
    group.add(blade(0.9, 0.11, color, { point: 0.14 }))
    place(group.children[0], 0, 0.06, 0)
    group.add(box(0.36, 0.06, 0.07, metal(), 0, 0.05, 0))
    for (const s of [-1, 1]) {
      const wing = cone(0.04, 0.16, metal(), s * 0.2, 0.07, 0)
      wing.rotation.z = -s * 1.2
      group.add(wing)
    }
    group.add(gem(0.055, color, 0, 0.05, 0.05))
    wrappedGrip(group, color, 0.2, -0.2)
    group.add(sphere(0.055, glowMat(color, 1.5), 0, -0.24, 0, 10))
    return tipAt(group, 0, 0.96)
  },
  dagger(group, color) {
    // Twin daggers: two blades fanned from one grip.
    for (const s of [-1, 1]) {
      const b = blade(0.52, 0.085, color, { point: 0.22 })
      b.position.set(s * 0.05, 0.05, 0)
      b.rotation.z = -s * 0.2
      group.add(b)
    }
    group.add(box(0.26, 0.045, 0.06, metal(), 0, 0.03, 0))
    wrappedGrip(group, color, 0.16, -0.14)
    group.add(gem(0.04, color, 0, -0.17, 0))
    return tipAt(group, 0, 0.56)
  },
  spear(group, color) {
    group.add(cyl(0.022, 0.026, 1.4, metal(0x2b2d38, 0.5, 0.5), 0, 0.45, 0))
    for (const y of [0.1, 0.5, 0.9]) group.add(torus(0.032, 0.012, glowMat(color, 1), 0, y, 0))
    const head = blade(0.46, 0.17, color, { point: 0.45, thick: 0.05 })
    head.position.set(0, 1.12, 0)
    group.add(head)
    for (const s of [-1, 1]) {
      const barb = cone(0.035, 0.16, metal(0xe8eef8, 0.2, 0.9), 0, 0, 0)
      barb.position.set(s * 0.1, 1.14, 0)
      barb.rotation.z = -s * 0.7
      group.add(barb)
    }
    // A fluttering tassel of glow.
    group.add(place(new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 8), glowMat(0xff4a6e, 1.4)), 0, 1.07, 0))
    group.add(cone(0.035, 0.2, glowMat(color, 1.2), 0, -0.3, 0))
    group.children[group.children.length - 1].rotation.x = Math.PI
    return tipAt(group, 0, 1.6)
  },
  hammer(group, color) {
    group.add(cyl(0.04, 0.045, 1.0, metal(0x2b2d38, 0.5, 0.5), 0, 0.4, 0))
    wrappedGrip(group, color, 0.3, -0.08, 0.05)
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.6, 20), metal(0x383b48, 0.3, 0.85))
    head.rotation.z = Math.PI / 2
    head.position.y = 0.98
    group.add(head)
    for (const s of [-1, 1]) {
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.1, 20), glowMat(color, 1.5))
      cap.rotation.z = Math.PI / 2
      cap.position.set(s * 0.33, 0.98, 0)
      group.add(cap)
      const halo = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 8), auraMat(color, 0.18))
      halo.position.set(s * 0.36, 0.98, 0)
      group.add(halo)
      for (const a of [0, 1, 2, 3, 4, 5]) {
        const stud = cone(0.035, 0.08, metal(0xf4f6ff, 0.2, 0.9), 0, 0, 0, 6)
        stud.rotation.z = -s * Math.PI / 2
        stud.position.set(s * 0.43, 0.98 + Math.sin((a / 6) * TAU) * 0.13, Math.cos((a / 6) * TAU) * 0.13)
        group.add(stud)
      }
    }
    const band = torus(0.27, 0.025, glowMat(color, 1.3), 0, 0.98, 0, 0)
    band.rotation.y = Math.PI / 2
    group.add(band)
    return tipAt(group, 0, 1.3)
  },
  scythe(group, color) {
    group.add(cyl(0.028, 0.034, 1.5, metal(0x2b2d38, 0.5, 0.5), 0, 0.5, 0))
    group.add(torus(0.045, 0.014, glowMat(color, 1), 0, 0.15, 0))
    // A big crescent blade swept off the top: a ring segment.
    const shape = new THREE.Shape()
    shape.absarc(0, 0, 0.62, 0.15, 1.9, false)
    shape.absarc(0.06, 0.1, 0.46, 1.9, 0.15, true)
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.035, bevelEnabled: false, curveSegments: 20 })
    geometry.translate(0, 0, -0.018)
    const crescent = new THREE.Group()
    crescent.add(new THREE.Mesh(geometry, glowMat(color, 1.3)))
    const twin = new THREE.Mesh(geometry, auraMat(color, 0.22))
    twin.scale.set(1.04, 1.04, 3)
    crescent.add(twin)
    crescent.position.set(0.02, 1.0, 0)
    crescent.rotation.z = 0.55
    group.add(crescent)
    group.add(gem(0.05, color, 0, 1.22, 0.04))
    return tipAt(group, 0.62, 1.55)
  },
  katana(group, color) {
    group.add(blade(1.0, 0.075, color, { curve: 0.07, point: 0.1, thick: 0.03 }))
    place(group.children[0], 0, 0.1, 0)
    const guard = cyl(0.09, 0.09, 0.03, metal(0x3a2c10, 0.3, 0.9), 0, 0.09, 0, 16)
    group.add(guard)
    group.add(torus(0.095, 0.012, glowMat(color, 1.4), 0, 0.09, 0))
    wrappedGrip(group, color, 0.26, -0.2, 0.03)
    group.add(sphere(0.04, metal(0x3a2c10, 0.3, 0.9), 0, -0.22, 0, 10))
    return tipAt(group, 0.07, 1.12)
  },
  axe(group, color) {
    group.add(cyl(0.035, 0.04, 1.1, metal(0x2b2d38, 0.5, 0.5), 0, 0.42, 0))
    wrappedGrip(group, color, 0.3, -0.1, 0.045)
    // A big crescent single-bit head and a spike on the back.
    const shape = new THREE.Shape()
    shape.moveTo(0, -0.08)
    shape.quadraticCurveTo(0.28, -0.3, 0.52, -0.22)
    shape.quadraticCurveTo(0.42, 0.04, 0.5, 0.3)
    shape.quadraticCurveTo(0.26, 0.28, 0, 0.2)
    shape.closePath()
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.05, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01, bevelSegments: 1 })
    geometry.translate(0, 0, -0.025)
    const head = new THREE.Group()
    head.add(new THREE.Mesh(geometry, glowMat(color, 1.15)))
    const twin = new THREE.Mesh(geometry, auraMat(color, 0.22))
    twin.scale.set(1.08, 1.08, 2.5)
    head.add(twin)
    head.position.set(0.02, 0.83, 0)
    group.add(head)
    const back = cone(0.06, 0.28, metal(0xf4f6ff, 0.2, 0.9), -0.12, 0.93, 0)
    back.rotation.z = Math.PI / 2
    group.add(back)
    group.add(gem(0.05, color, 0, 0.83, 0.05))
    return tipAt(group, 0.5, 1.05)
  },
  rapier(group, color) {
    const b = blade(1.4, 0.045, color, { point: 0.1, thick: 0.025 })
    b.position.y = 0.1
    group.add(b)
    // Swept-hilt basket guard.
    const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 8, 0, TAU, 0, Math.PI / 2), metal(0xcfa84a, 0.25, 0.9))
    bowl.rotation.x = Math.PI
    bowl.position.y = 0.1
    bowl.scale.set(1, 0.7, 1)
    group.add(bowl)
    group.add(torus(0.17, 0.014, glowMat(color, 1.4), 0, 0.1, 0))
    const bar = cyl(0.014, 0.014, 0.5, metal(0xcfa84a, 0.25, 0.9), 0, 0.1, 0, 8)
    bar.rotation.z = Math.PI / 2
    group.add(bar)
    wrappedGrip(group, color, 0.22, -0.14, 0.024)
    group.add(gem(0.05, color, 0, -0.18, 0))
    return tipAt(group, 0, 1.52)
  },
  chainsaw(group, color) {
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.28, 6, 12), metal(0x33353f, 0.5, 0.5))
    body.position.set(0, 0.12, 0)
    group.add(body)
    group.add(box(0.1, 0.18, 0.2, glowMat(0xff5a2a, 1), 0, 0.16, 0))
    group.add(torus(0.08, 0.018, metal(0x1b1d26), 0, -0.1, 0.1, 0))
    // Guide bar with a loop of glowing teeth.
    const bar = box(0.09, 0.8, 0.04, metal(0x9aa0ad, 0.3, 0.9), 0, 0.72, 0)
    group.add(bar)
    const nose = place(new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.04, 12), metal(0x9aa0ad)), 0, 1.12, 0)
    nose.rotation.x = Math.PI / 2
    group.add(nose)
    const teeth = []
    for (let i = 0; i < 14; i++) {
      const t = cone(0.028, 0.07, glowMat(color, 1.6), 0, 0, 0, 4)
      t.rotation.z = -Math.PI / 2
      teeth.push(t)
      group.add(t)
    }
    teeth.forEach((t, i) => {
      const side = i % 2 ? 1 : -1
      t.position.set(side * 0.075, 0.38 + Math.floor(i / 2) * 0.11, 0)
      t.rotation.z = side * -Math.PI / 2
    })
    group.add(sphere(0.07, auraMat(color, 0.25), 0, 0.75, 0, 10))
    return tipAt(group, 0, 1.15)
  },
  boomstick(group, color) {
    // A glowing slugger bat with studs.
    const bat = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.035, 1.05, 16), metal(0x6a4a2a, 0.55, 0.15))
    bat.position.y = 0.55
    group.add(bat)
    for (const [y, r] of [[0.95, 0.105], [0.78, 0.09], [0.6, 0.075]]) {
      group.add(torus(r, 0.016, glowMat(color, 1.4), 0, y, 0))
    }
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU
      const stud = cone(0.025, 0.07, metal(0xf4f6ff, 0.2, 0.9), 0, 0, 0, 5)
      stud.position.set(Math.cos(a) * 0.115, 1.0, Math.sin(a) * 0.115)
      stud.rotation.z = -Math.cos(a) * Math.PI / 2
      stud.rotation.x = Math.sin(a) * Math.PI / 2
      group.add(stud)
    }
    group.add(sphere(0.09, glowMat(color, 1.7), 0, 1.1, 0, 12))
    group.add(sphere(0.2, auraMat(color, 0.2), 0, 1.1, 0, 10))
    wrappedGrip(group, color, 0.22, -0.02, 0.04)
    return tipAt(group, 0, 1.2)
  },
  staff(group, color) {
    group.add(cyl(0.025, 0.035, 1.3, metal(0x4a3a5e, 0.45, 0.4), 0, 0.5, 0))
    for (const y of [0.0, 0.3]) group.add(torus(0.045, 0.013, glowMat(color, 1.2), 0, y, 0))
    // A cradle of curled prongs around the orb.
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * TAU
      const prong = cone(0.022, 0.38, metal(0xd9cffc, 0.25, 0.8), Math.cos(a) * 0.13, 1.2, Math.sin(a) * 0.13, 6)
      prong.rotation.z = -Math.cos(a) * 0.35
      prong.rotation.x = Math.sin(a) * 0.35
      group.add(prong)
    }
    const orb = sphere(0.14, glowMat(color, 1.8), 0, 1.3, 0, 18)
    group.add(orb)
    group.add(sphere(0.3, auraMat(color, 0.25), 0, 1.3, 0, 12))
    group.add(torus(0.24, 0.012, glowMat(0xffffff, 1.4), 0, 1.3, 0, 1.0))
    group.add(torus(0.2, 0.01, glowMat(color, 1.4), 0, 1.3, 0, 2.1))
    for (const [x, y, z] of [[0.28, 1.5, 0], [-0.24, 1.42, 0.1], [0.05, 1.62, -0.15]]) group.add(gem(0.03, 0xffffff, x, y, z))
    return tipAt(group, 0, 1.3)
  },
  flail(group, color) {
    group.add(cyl(0.035, 0.04, 0.7, metal(0x2b2d38, 0.5, 0.5), 0, 0.3, 0))
    wrappedGrip(group, color, 0.25, -0.05, 0.045)
    const pivot = new THREE.Group()
    pivot.position.y = 0.65
    // Chain links down to a spiked disco ball.
    for (let i = 0; i < 6; i++) {
      const link = torus(0.04, 0.012, metal(0xc8ccd8, 0.3, 0.9), 0, 0.06 + i * 0.075, 0, i % 2 ? 0 : Math.PI / 2)
      link.scale.set(1, 1.4, 1)
      pivot.add(link)
    }
    const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 1), new THREE.MeshStandardMaterial({ color, emissive: new THREE.Color(color), emissiveIntensity: 0.9, roughness: 0.1, metalness: 0.9, flatShading: true }))
    ball.position.y = 0.68
    pivot.add(ball)
    const dirs = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1], [0.7, 0.7, 0], [-0.7, 0.7, 0], [0, 0.7, 0.7], [0, 0.7, -0.7], [0.7, -0.7, 0], [-0.7, -0.7, 0]]
    for (const d of dirs) {
      const v = new THREE.Vector3(...d).normalize()
      const spike = cone(0.045, 0.2, metal(0xf4f6ff, 0.2, 0.9), 0, 0, 0, 6)
      spike.position.copy(v).multiplyScalar(0.25).add(new THREE.Vector3(0, 0.68, 0))
      spike.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v)
      pivot.add(spike)
    }
    pivot.add(sphere(0.38, auraMat(color, 0.2), 0, 0.68, 0, 12))
    const tip = new THREE.Object3D()
    tip.position.y = 0.68
    pivot.add(tip)
    group.add(pivot)
    group.userData.tip = tip
    group.userData.flex = (t) => {
      pivot.rotation.z = t === null ? 0.5 : 1.0 * Math.sin(Math.min(1, t / 0.2) * Math.PI / 2) * (1 - 0.6 * Math.max(0, (t - 0.8) / 0.2))
    }
    return tip
  },
  whip(group, color) {
    group.add(cyl(0.04, 0.05, 0.34, metal(0x2b2d38, 0.5, 0.4), 0, 0.05, 0))
    group.add(torus(0.055, 0.013, glowMat(color, 1.4), 0, 0.2, 0))
    group.add(sphere(0.05, glowMat(color, 1.6), 0, -0.14, 0, 10))
    const segments = []
    let parent = group
    const SEGMENT = 0.23
    for (let i = 0; i < 13; i++) {
      const segment = new THREE.Group()
      segment.position.y = i === 0 ? 0.22 : SEGMENT
      const r = 0.032 * (1 - i * 0.05)
      segment.add(cyl(r * 0.8, r, SEGMENT, glowMat(color, i % 2 ? 0.8 : 1.4), 0, SEGMENT / 2, 0, 8))
      segment.add(sphere(r * 1.25, metal(0xf4f6ff, 0.25, 0.8), 0, SEGMENT, 0, 8))
      parent.add(segment)
      segments.push(segment)
      parent = segment
    }
    parent.add(sphere(0.07, glowMat(0xffffff, 2), 0, SEGMENT, 0, 10))
    parent.add(sphere(0.16, auraMat(color, 0.3), 0, SEGMENT, 0, 10))
    const tip = new THREE.Object3D()
    tip.position.y = SEGMENT
    parent.add(tip)
    group.userData.tip = tip
    group.userData.flex = (t) => {
      segments.forEach((segment, i) => {
        if (t === null) segment.rotation.z = 0.04
        else {
          const amp = t < 0.5 ? 0.32 : 0.55 * (1 - Math.min(1, (t - 0.5) * 1.6))
          segment.rotation.z = amp * Math.sin(i * 0.7 - t * 18)
        }
      })
    }
    return tip
  },
  nunchucks(group, color) {
    const stick = (parent, y0, y1) => {
      parent.add(cyl(0.04, 0.04, y1 - y0, metal(0x2b2d38, 0.4, 0.5), 0, (y0 + y1) / 2, 0, 10))
      for (const y of [y0 + 0.08, y1 - 0.08]) parent.add(torus(0.05, 0.014, glowMat(color, 1.5), 0, y, 0))
      parent.add(sphere(0.045, glowMat(color, 1.6), 0, y1, 0, 8))
    }
    stick(group, -0.12, 0.5)
    group.add(torus(0.035, 0.01, metal(0xc8ccd8, 0.3, 0.9), 0, 0.53, 0, 0))
    const joint = new THREE.Group()
    joint.position.y = 0.55
    joint.add(torus(0.035, 0.01, metal(0xc8ccd8, 0.3, 0.9), 0, 0.0, 0, Math.PI / 2))
    stick(joint, 0.04, 0.62)
    const tip = new THREE.Object3D()
    tip.position.y = 0.66
    joint.add(tip)
    group.add(joint)
    group.userData.tip = tip
    group.userData.flex = (t) => {
      if (t === null) joint.rotation.set(0.15, 0, 0.35)
      else joint.rotation.set(1.3 * Math.sin(t * Math.PI * 5), 0, 1.2 * Math.cos(t * Math.PI * 5) + 0.3)
    }
    return tip
  },

  // ---- firearms: barrel along +y, grip at the origin ----------------------
  pistol(group, color) {
    const body = metal(0x35384a, 0.3, 0.7)
    group.add(box(0.13, 0.5, 0.17, body, 0, 0.32, 0))
    group.add(place(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.28, 14), metal(0x9aa0ad, 0.25, 0.9)), 0, 0.64, 0))
    group.add(torus(0.062, 0.012, glowMat(color, 1.8), 0, 0.76, 0))
    group.add(tiltX(box(0.14, 0.22, 0.16, metal(0x1b1d26, 0.6, 0.3), 0, -0.05, 0.03), -0.25))
    group.add(box(0.02, 0.4, 0.19, glowMat(color, 1.6), 0, 0.33, 0))
    group.add(box(0.03, 0.05, 0.03, glowMat(0xffffff, 1.5), 0, 0.57, 0.09))
    group.add(sphere(0.12, auraMat(color, 0.18), 0, 0.7, 0, 8))
    return tipAt(group, 0, 0.82)
  },
  shotgun(group, color) {
    const steel = metal(0x9aa0ad, 0.25, 0.9)
    group.add(box(0.15, 0.28, 0.17, metal(0x4a3a2a, 0.55, 0.2), 0, -0.02, 0))
    for (const s of [-1, 1]) {
      group.add(cyl(0.045, 0.05, 0.95, steel, s * 0.055, 0.6, 0, 12))
      group.add(torus(0.052, 0.012, glowMat(color, 1.8), s * 0.055, 1.08, 0))
      group.add(sphere(0.05, auraMat(color, 0.3), s * 0.055, 1.1, 0, 8))
    }
    group.add(box(0.2, 0.3, 0.17, metal(0x6a4a2a, 0.5, 0.2), 0, 0.45, 0)) // pump
    for (let i = 0; i < 4; i++) group.add(box(0.215, 0.012, 0.185, glowMat(color, 1.2), 0, 0.34 + i * 0.07, 0))
    group.add(box(0.12, 0.24, 0.17, glowMat(color, 1.1), 0, 0.2, 0))
    return tipAt(group, 0, 1.15)
  },
  smg(group, color) {
    group.add(box(0.16, 0.62, 0.18, metal(0x35384a, 0.3, 0.7), 0, 0.28, 0))
    group.add(cyl(0.04, 0.04, 0.34, metal(0x9aa0ad, 0.25, 0.9), 0, 0.78, 0, 10))
    group.add(torus(0.05, 0.011, glowMat(color, 1.8), 0, 0.95, 0))
    // A glowing drum magazine.
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.14, 20), glowMat(color, 1.2))
    drum.rotation.z = Math.PI / 2
    drum.position.set(0, 0.2, 0)
    group.add(drum)
    group.add(place(new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 8), auraMat(color, 0.16)), 0, 0.2, 0))
    group.add(tiltX(box(0.12, 0.2, 0.15, metal(0x1b1d26, 0.6, 0.3), 0, -0.1, 0.02), -0.2))
    group.add(box(0.05, 0.06, 0.05, glowMat(0xffffff, 1.5), 0, 0.64, 0.1))
    return tipAt(group, 0, 0.98)
  },
  railgun(group, color) {
    const dk = metal(0x2a2d3c, 0.3, 0.8)
    group.add(box(0.15, 0.4, 0.18, dk, 0, 0.18, 0))
    group.add(box(0.22, 0.62, 0.2, dk, 0, 0.6, 0))
    for (const s of [-1, 1]) group.add(box(0.04, 1.2, 0.07, metal(0xc8ccd8, 0.2, 0.9), s * 0.09, 0.9, 0))
    group.add(box(0.05, 1.18, 0.06, glowMat(color, 2), 0, 0.9, 0))
    for (let i = 0; i < 5; i++) group.add(torus(0.12, 0.016, glowMat(color, 1.8), 0, 0.5 + i * 0.2, 0, Math.PI / 2))
    group.add(sphere(0.1, glowMat(0xffffff, 2), 0, 1.55, 0, 10))
    group.add(sphere(0.24, auraMat(color, 0.3), 0, 1.55, 0, 10))
    group.add(tiltX(box(0.1, 0.18, 0.15, metal(0x1b1d26, 0.6, 0.3), 0, -0.08, 0.02), -0.2))
    return tipAt(group, 0, 1.62)
  },
  launcher(group, color) {
    const dk = metal(0x3a3d4c, 0.35, 0.7)
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.17, 0.9, 20), dk)
    tube.position.y = 0.65
    group.add(tube)
    group.add(torus(0.21, 0.025, glowMat(color, 1.8), 0, 1.1, 0))
    group.add(torus(0.19, 0.02, glowMat(color, 1.4), 0, 0.5, 0))
    group.add(cyl(0.16, 0.16, 0.04, glowMat(color, 1.6), 0, 1.12, 0, 20))
    group.add(sphere(0.12, metal(0x1b1d26, 0.2, 0.9), 0, 1.14, 0, 12)) // cannonball peeking out
    group.add(box(0.06, 0.06, 0.2, metal(0x9aa0ad), 0, 0.85, 0.2)) // sight
    group.add(sphere(0.3, auraMat(color, 0.14), 0, 1.1, 0, 10))
    group.add(box(0.12, 0.24, 0.16, metal(0x1b1d26, 0.6, 0.3), 0, 0.0, 0.0))
    return tipAt(group, 0, 1.3)
  },
  crossbow(group, color) {
    group.add(box(0.1, 1.0, 0.12, metal(0x6a4a2a, 0.55, 0.2), 0, 0.42, 0))
    // Curved limbs tipped with glowing nocks.
    for (const s of [-1, 1]) {
      const limb = box(0.55, 0.06, 0.07, metal(0x3a3d4c, 0.35, 0.7), s * 0.26, 0.82, 0)
      limb.rotation.z = -s * 0.28
      group.add(limb)
      group.add(sphere(0.05, glowMat(color, 1.8), s * 0.52, 0.94, 0, 8))
    }
    const bowString = place(new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1.04, 4), glowMat(0xffffff, 1.4)), 0, 0.9, 0)
    bowString.rotation.z = Math.PI / 2
    group.add(bowString)
    // A loaded glowing bolt.
    group.add(box(0.03, 0.85, 0.03, glowMat(color, 1.6), 0, 0.78, 0.06))
    group.add(cone(0.05, 0.14, metal(0xf4f6ff, 0.2, 0.9), 0, 1.27, 0.06, 6))
    group.add(sphere(0.2, auraMat(color, 0.16), 0, 0.9, 0, 8))
    return tipAt(group, 0, 1.36, 0.06)
  },
  flamer(group, color) {
    group.add(box(0.13, 0.26, 0.15, metal(0x1b1d26, 0.6, 0.3), 0, -0.02, 0))
    group.add(cyl(0.07, 0.07, 0.8, metal(0x6a6f80, 0.35, 0.8), 0, 0.5, 0, 14))
    // A fuel tank slung underneath, and a nozzle with a pilot flame.
    const tank = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.34, 6, 14), glowMat(0xff4a2a, 0.9))
    tank.position.set(0, 0.35, -0.2)
    group.add(tank)
    group.add(cyl(0.05, 0.1, 0.18, metal(0x9aa0ad, 0.25, 0.9), 0, 1.0, 0, 12))
    group.add(torus(0.1, 0.016, glowMat(color, 1.8), 0, 0.5, 0))
    const flame = cone(0.07, 0.3, glowMat(color, 2.2), 0, 1.22, 0, 8)
    group.add(flame)
    group.add(cone(0.12, 0.48, auraMat(color, 0.3), 0, 1.3, 0, 8))
    group.add(sphere(0.045, glowMat(0xffee88, 2.4), 0, 1.1, 0, 8))
    return tipAt(group, 0, 1.45)
  },
  blaster(group, color) {
    // A retro ray gun: finned barrel, glowing orb, disco ring.
    group.add(box(0.13, 0.4, 0.18, metal(0xe8eaf4, 0.3, 0.6), 0, 0.15, 0))
    group.add(place(new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.45, 6, 14), metal(0xe8eaf4, 0.3, 0.6)), 0, 0.6, 0))
    for (const s of [-1, 1]) {
      const fin = cone(0.07, 0.4, glowMat(color, 1.4), s * 0.16, 0.62, 0, 4)
      fin.scale.z = 0.4
      fin.rotation.z = -s * 0.25
      group.add(fin)
    }
    group.add(sphere(0.11, glowMat(color, 2), 0, 0.98, 0, 14))
    group.add(sphere(0.26, auraMat(color, 0.3), 0, 0.98, 0, 10))
    group.add(torus(0.15, 0.014, glowMat(0xffffff, 1.6), 0, 0.98, 0, 1.2))
    group.add(torus(0.14, 0.012, glowMat(color, 1.6), 0, 0.5, 0))
    group.add(tiltX(box(0.1, 0.22, 0.14, metal(0x1b1d26, 0.6, 0.3), 0, -0.07, 0.02), -0.2))
    return tipAt(group, 0, 1.12)
  },
}

// A detailed model for weapon `id`, or null if it has no special model.
export function buildFancyWeapon(id, color) {
  const build = BUILDERS[id]
  if (!build) return null
  const group = new THREE.Group()
  build(group, color)
  group.traverse((child) => {
    if (child.isMesh && child.material.transparent !== true) child.castShadow = true
  })
  return group
}
