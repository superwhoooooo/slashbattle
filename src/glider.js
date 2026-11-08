// The paraglider: a striped, arched canopy on four lines above the player. It unfurls when opened and folds away.
import * as THREE from 'three'

export function createGlider() {
  const group = new THREE.Group()
  group.visible = false
  const width = 5.6
  const depth = 2.6
  const geometry = new THREE.PlaneGeometry(width, depth, 14, 4)
  geometry.rotateX(-Math.PI / 2)
  const pos = geometry.attributes.position
  const colors = new Float32Array(pos.count * 3)
  const a = new THREE.Color(0xff7a9c)
  const b = new THREE.Color(0xfff0c8)
  const c = new THREE.Color()
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const z = pos.getZ(i)
    pos.setY(i, 0.9 - (x * x) * 0.075 - (z * z) * 0.05) // arched both ways, like a real wing
    c.copy(Math.floor((x + width / 2) / (width / 7)) % 2 ? a : b)
    colors[i * 3] = c.r
    colors[i * 3 + 1] = c.g
    colors[i * 3 + 2] = c.b
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.computeVertexNormals()
  const canopy = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, side: THREE.DoubleSide, emissive: 0x401020, emissiveIntensity: 0.25 }))
  canopy.castShadow = true
  canopy.position.y = 3.2
  group.add(canopy)

  // Four lines from the wing's corners down to the shoulders.
  const corners = [[-2.6, -1.2], [-2.6, 1.2], [2.6, -1.2], [2.6, 1.2]]
  const points = []
  for (const [x, z] of corners) {
    const y = 3.2 + 0.9 - x * x * 0.075 - z * z * 0.05
    points.push(x, y, z, x * 0.1, 1.3, z * 0.1)
  }
  const lines = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(points, 3)), new THREE.LineBasicMaterial({ color: 0xfff0c8 }))
  group.add(lines)
  group.userData.open = 0
  return group
}

// Unfurl (open) or fold (closed) the canopy; tilts a little with the turn for some life.
export function updateGlider(glider, open, dt, time, bank = 0) {
  const target = open ? 1 : 0
  glider.userData.open += (target - glider.userData.open) * Math.min(1, dt * 9)
  const t = glider.userData.open
  glider.visible = t > 0.02
  glider.scale.set(0.2 + 0.8 * t, 0.3 + 0.7 * t, 0.2 + 0.8 * t)
  glider.rotation.z = bank * 0.25 + Math.sin(time * 2.2) * 0.04
  glider.rotation.x = Math.sin(time * 1.7) * 0.03
}
