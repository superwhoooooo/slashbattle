// The labyrinth's 3D world: a tiled floor, standing walls with torches, spike
// traps that pop up on a timer, a portcullis gate on the far dead end, and
// the glowing exit pad behind it. Built from one floor's data
// (logic/maze.js's buildFloor). Returns the same shape main.js expects from
// arena.js's createArena (group / fog / backgroundColor / keyLight /
// propObstacles) plus its own `update` for the animated bits.
import * as THREE from 'three'
import {
  HEMI_LIGHT_INTENSITY,
  KEY_LIGHT_INTENSITY,
  KEY_LIGHT_OFFSET,
  KEY_LIGHT_SHADOW_EXTENT,
  SHADOW_MAP_SIZE,
} from './config.js'
import {
  WALL_RADIUS,
  doorObstacles,
  mazeHalfSize,
  spikeExtension,
  spikeState,
  wallObstacles,
  wallSegments,
} from './logic/maze.js'

export const WALL_HEIGHT = 2.0
const TORCH_EVERY = 5 // one torch per this many wall segments

function glowDisc(color, radius, opacity) {
  const mesh = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 24),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending }),
  )
  mesh.rotation.x = -Math.PI / 2
  return mesh
}

function buildSpikeTrap(trap, def) {
  const group = new THREE.Group()
  group.position.set(trap.x, 0, trap.z)

  const plateMat = new THREE.MeshStandardMaterial({ color: 0x2b2b30, roughness: 0.7, metalness: 0.4, emissive: 0xff2a1a, emissiveIntensity: 0 })
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(trap.radius, trap.radius * 1.05, 0.12, 20), plateMat)
  plate.position.y = 0.06
  plate.receiveShadow = true
  group.add(plate)

  const holeMat = new THREE.MeshStandardMaterial({ color: 0x0c0c10, roughness: 1 })
  const spikeMat = new THREE.MeshStandardMaterial({ color: 0xd9dde6, roughness: 0.25, metalness: 0.9, emissive: 0xff3b2a, emissiveIntensity: 0 })
  const spikes = []
  const spots = [[0, 0]]
  for (let i = 0; i < 6; i++) spots.push([Math.cos((i / 6) * Math.PI * 2) * trap.radius * 0.6, Math.sin((i / 6) * Math.PI * 2) * trap.radius * 0.6])
  const spikeGeometry = new THREE.ConeGeometry(0.2, 1.1, 6)
  spikeGeometry.translate(0, 0.55, 0) // pivot at the base so scaling y grows it upward
  const holeGeometry = new THREE.CircleGeometry(0.26, 8)
  for (const [x, z] of spots) {
    const hole = new THREE.Mesh(holeGeometry, holeMat)
    hole.rotation.x = -Math.PI / 2
    hole.position.set(x, 0.13, z)
    group.add(hole)
    const spike = new THREE.Mesh(spikeGeometry, spikeMat)
    spike.position.set(x, 0.12, z)
    spike.scale.y = 0.001
    spike.castShadow = true
    group.add(spike)
    spikes.push(spike)
  }
  const warnGlow = glowDisc(0xff3b2a, trap.radius * 1.15, 0)
  warnGlow.position.y = 0.14
  group.add(warnGlow)
  return { group, spikes, plateMat, spikeMat, warnGlow, trap }
}

function buildTorch(x, z, nx, nz, color) {
  // Sits on the side of a wall facing the corridor (n = outward normal).
  const group = new THREE.Group()
  group.position.set(x + nx * (WALL_RADIUS + 0.12), WALL_HEIGHT * 0.62, z + nz * (WALL_RADIUS + 0.12))
  const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.5, 0.14), new THREE.MeshStandardMaterial({ color: 0x3a2a1e, roughness: 0.9 }))
  group.add(bracket)
  const flame = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.2, 0),
    new THREE.MeshBasicMaterial({ color }),
  )
  flame.position.y = 0.38
  group.add(flame)
  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 12, 8),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending }),
  )
  halo.position.y = 0.38
  group.add(halo)
  return { group, flame, halo }
}

export function createLabyrinthArena(floor) {
  const { maze, def, door } = floor
  const group = new THREE.Group()
  const half = mazeHalfSize(maze)

  group.add(new THREE.HemisphereLight(def.hemiSky, def.hemiGround, HEMI_LIGHT_INTENSITY * 1.5))

  const keyLight = new THREE.DirectionalLight(def.key, KEY_LIGHT_INTENSITY * 0.85)
  keyLight.position.set(KEY_LIGHT_OFFSET.x, KEY_LIGHT_OFFSET.y, KEY_LIGHT_OFFSET.z)
  keyLight.castShadow = true
  keyLight.shadow.mapSize.set(SHADOW_MAP_SIZE, SHADOW_MAP_SIZE)
  keyLight.shadow.camera.left = -KEY_LIGHT_SHADOW_EXTENT
  keyLight.shadow.camera.right = KEY_LIGHT_SHADOW_EXTENT
  keyLight.shadow.camera.top = KEY_LIGHT_SHADOW_EXTENT
  keyLight.shadow.camera.bottom = -KEY_LIGHT_SHADOW_EXTENT
  keyLight.shadow.camera.near = 1
  keyLight.shadow.camera.far = 60
  group.add(keyLight)
  group.add(keyLight.target)

  // Floor: checkered stone tiles on a dark slab.
  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(half.x * 2 + 4, 2, half.z * 2 + 4),
    new THREE.MeshStandardMaterial({ color: 0x15121a, roughness: 1 }),
  )
  slab.position.y = -1.05
  slab.receiveShadow = true
  group.add(slab)
  const tileMats = [
    new THREE.MeshStandardMaterial({ color: def.floor, roughness: 0.85 }),
    new THREE.MeshStandardMaterial({ color: def.floorAlt, roughness: 0.85 }),
  ]
  const tileGeometry = new THREE.BoxGeometry(maze.cellSize / 3 - 0.06, 0.1, maze.cellSize / 3 - 0.06)
  const tiles = new THREE.InstancedMesh(tileGeometry, tileMats[0], maze.cols * maze.rows * 9)
  const tilesAlt = new THREE.InstancedMesh(tileGeometry, tileMats[1], maze.cols * maze.rows * 9)
  tiles.receiveShadow = tilesAlt.receiveShadow = true
  const m = new THREE.Matrix4()
  let a = 0
  let b = 0
  const sub = maze.cellSize / 3
  for (let i = 0; i < maze.cols * 3; i++) {
    for (let j = 0; j < maze.rows * 3; j++) {
      m.makeTranslation(-half.x + sub * (i + 0.5), -0.05, -half.z + sub * (j + 0.5))
      if ((i + j) % 2 === 0) tiles.setMatrixAt(a++, m)
      else tilesAlt.setMatrixAt(b++, m)
    }
  }
  tiles.count = a
  tilesAlt.count = b
  group.add(tiles, tilesAlt)

  // Walls.
  const wallMat = new THREE.MeshStandardMaterial({ color: def.wall, roughness: 0.8, metalness: 0.05 })
  const capMat = new THREE.MeshStandardMaterial({ color: def.wallTop, roughness: 0.6 })
  const segments = wallSegments(maze)
  const torchColor = def.torch
  const torches = []
  segments.forEach((segment, index) => {
    const horizontal = segment.z1 === segment.z2
    const length = Math.abs(horizontal ? segment.x2 - segment.x1 : segment.z2 - segment.z1)
    const cx = (segment.x1 + segment.x2) / 2
    const cz = (segment.z1 + segment.z2) / 2
    const thick = WALL_RADIUS * 2
    const w = horizontal ? length + thick : thick
    const d = horizontal ? thick : length + thick
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, WALL_HEIGHT, d), wallMat)
    wall.position.set(cx, WALL_HEIGHT / 2, cz)
    wall.castShadow = true
    wall.receiveShadow = true
    group.add(wall)
    const cap = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, 0.16, d + 0.1), capMat)
    cap.position.set(cx, WALL_HEIGHT + 0.08, cz)
    group.add(cap)
    if (index % TORCH_EVERY === 0) {
      // Face the torch toward the maze's middle so it lights the corridor side.
      const nx = horizontal ? 0 : Math.sign(-cx) || 1
      const nz = horizontal ? Math.sign(-cz) || 1 : 0
      const torch = buildTorch(cx, cz, nx, nz, torchColor)
      group.add(torch.group)
      torches.push(torch)
      const pool = glowDisc(torchColor, 3.4, 0.16)
      pool.position.set(cx + nx * 2.2, 0.06, cz + nz * 2.2)
      group.add(pool)
    }
  })

  // Spike traps.
  const traps = floor.traps.map((trap) => {
    const built = buildSpikeTrap(trap, def)
    group.add(built.group)
    return built
  })

  // Gate: a portcullis across the door, an arch, and the exit pad inside.
  const gate = new THREE.Group()
  const barMat = new THREE.MeshStandardMaterial({ color: 0x8a8f99, roughness: 0.35, metalness: 0.85 })
  const barCount = 9
  const bars = new THREE.Group()
  for (let i = 0; i < barCount; i++) {
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, WALL_HEIGHT + 0.6, 8), barMat)
    const t = (i / (barCount - 1) - 0.5) * (door.width - 0.6)
    bar.position.set(t, (WALL_HEIGHT + 0.6) / 2, 0)
    bar.castShadow = true
    bars.add(bar)
  }
  for (const y of [0.5, 1.3]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(door.width - 0.3, 0.1, 0.14), barMat)
    rail.position.y = y
    bars.add(rail)
  }
  const lockMat = new THREE.MeshStandardMaterial({ color: 0xff3b2a, emissive: 0xff2a1a, emissiveIntensity: 0.9 })
  const lock = new THREE.Mesh(new THREE.SphereGeometry(0.34, 12, 10), lockMat)
  lock.position.set(0, 1.0, 0.12)
  bars.add(lock)
  gate.add(bars)
  const alongX = door.dir === 0 || door.dir === 2
  gate.position.set(door.x, 0, door.z)
  gate.rotation.y = alongX ? 0 : Math.PI / 2
  group.add(gate)

  const pad = new THREE.Group()
  pad.position.set(floor.exit.x, 0, floor.exit.z)
  const padRing = new THREE.Mesh(
    new THREE.TorusGeometry(2.1, 0.14, 8, 40),
    new THREE.MeshBasicMaterial({ color: 0x6b6b78 }),
  )
  padRing.rotation.x = Math.PI / 2
  padRing.position.y = 0.14
  pad.add(padRing)
  const padGlow = glowDisc(0x6b6b78, 2.1, 0.25)
  padGlow.position.y = 0.12
  pad.add(padGlow)
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(1.5, 1.9, 7, 24, 1, true),
    new THREE.MeshBasicMaterial({ color: 0x7dffb0, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }),
  )
  beam.position.y = 3.5
  pad.add(beam)
  group.add(pad)

  const wallObs = wallObstacles(maze, WALL_RADIUS)
  const gateObstacles = doorObstacles(door)

  const state = { open: false, openAmount: 0 }

  function update(t, dt) {
    // Spike traps.
    for (const built of traps) {
      const ext = spikeExtension(built.trap.phase, t)
      const s = spikeState(built.trap.phase, t)
      for (const spike of built.spikes) spike.scale.y = Math.max(0.001, ext)
      built.plateMat.emissiveIntensity = s === 'warn' ? 0.6 + 0.4 * Math.sin(t * 30) : s === 'up' ? 0.5 : 0
      built.spikeMat.emissiveIntensity = s === 'up' ? 0.35 : 0
      built.warnGlow.material.opacity = s === 'warn' ? 0.28 + 0.14 * Math.sin(t * 30) : s === 'up' ? 0.2 : 0
    }
    // Torch flicker.
    torches.forEach((torch, i) => {
      const f = 1 + 0.18 * Math.sin(t * 9 + i * 1.7) + 0.1 * Math.sin(t * 17 + i)
      torch.flame.scale.setScalar(f)
      torch.halo.scale.setScalar(0.9 + 0.2 * f)
    })
    // Gate: bars slide up when open; the pad lights up.
    state.openAmount = THREE.MathUtils.clamp(state.openAmount + (state.open ? dt / 1.6 : -dt / 0.6), 0, 1)
    bars.position.y = state.openAmount * (WALL_HEIGHT + 0.8)
    bars.visible = state.openAmount < 0.995
    lock.visible = !state.open
    const lit = state.open ? 1 : 0
    padRing.material.color.setHex(state.open ? 0x7dffb0 : 0x6b6b78)
    padGlow.material.color.setHex(state.open ? 0x7dffb0 : 0x6b6b78)
    padGlow.material.opacity = state.open ? 0.35 + 0.15 * Math.sin(t * 4) : 0.2
    beam.material.opacity = lit * (0.22 + 0.08 * Math.sin(t * 5))
    padRing.rotation.z = t * 0.8
  }

  return {
    group,
    fog: new THREE.Fog(def.fog, 36, 120),
    backgroundColor: def.fog,
    level: { name: def.name },
    keyLight,
    pools: [],
    propObstacles: wallObs,
    gateObstacles,
    traps: floor.traps,
    floor,
    labyrinth: true,
    setGateOpen(open) {
      state.open = open
    },
    update,
  }
}
