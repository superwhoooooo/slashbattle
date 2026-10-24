import * as THREE from 'three'
import {
  AMBIENT_LIGHT_INTENSITY,
  FLAME_COLOR,
  FLAME_HEIGHT,
  FLAME_RADIUS,
  FOG_COLOR,
  FOG_FAR,
  FOG_NEAR,
  TILE_SIZE,
  TORCH_FLICKER_AMOUNT,
  TORCH_FLICKER_SPEED_A,
  TORCH_FLICKER_SPEED_B,
  TORCH_LIGHT_COLOR,
  TORCH_LIGHT_DISTANCE,
  TORCH_LIGHT_INTENSITY,
  WALL_HEIGHT,
} from './config.js'
import { gridToWorld, parseMap, TILE } from './logic/grid.js'

// Hand-authored dungeon layout: four rooms joined by single-tile-wide
// corridors. Legend: # wall, . floor, P player spawn, M monster spawn,
// B box spawn. M and B are only recorded as spawn points for now; later
// milestones will place actual monsters and boxes there.
export const DUNGEON_MAP = [
  '####################',
  '####################',
  '##......####......##',
  '##......####......##',
  '##..P..........M..##',
  '##......####......##',
  '##......####......##',
  '##......####......##',
  '#######.####.#######',
  '#######.####.#######',
  '#######.####.#######',
  '#######.####.#######',
  '##....#......#######',
  '##....#......#######',
  '##.B.........#######',
  '##....#...M..#######',
  '##....#..B...#######',
  '#######......#######',
  '####################',
  '####################',
]

// Positions where a torch point light is placed, by grid coordinates
// (roughly one per room).
const TORCH_TILES = [
  { x: 4, z: 4 },
  { x: 15, z: 4 },
  { x: 9, z: 14 },
  { x: 3, z: 14 },
]

// A small glowing flame mesh so the torch light has a visible source.
// MeshBasicMaterial ignores scene lighting, so it reads as bright
// regardless of how dim the surrounding torchlight gets mid-flicker.
function createFlameMesh() {
  const geometry = new THREE.ConeGeometry(FLAME_RADIUS, FLAME_HEIGHT, 8)
  const material = new THREE.MeshBasicMaterial({ color: FLAME_COLOR })
  return new THREE.Mesh(geometry, material)
}

// Builds the dungeon: a Three.js group (floor + walls) ready to add to the
// scene, lighting, fog, and the parsed grid/spawn data that later systems
// (player movement, monster AI, hiding) use for collision and placement.
export function createDungeon() {
  const grid = parseMap(DUNGEON_MAP)
  const group = new THREE.Group()

  const floorGeometry = new THREE.PlaneGeometry(
    grid.width * TILE_SIZE,
    grid.height * TILE_SIZE,
  )
  const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x3a3a42 })
  const floor = new THREE.Mesh(floorGeometry, floorMaterial)
  floor.rotation.x = -Math.PI / 2
  floor.position.set(
    (grid.width * TILE_SIZE) / 2,
    0,
    (grid.height * TILE_SIZE) / 2,
  )
  group.add(floor)

  const wallTiles = []
  for (let z = 0; z < grid.height; z++) {
    for (let x = 0; x < grid.width; x++) {
      if (grid.cells[z][x] === TILE.WALL) wallTiles.push({ x, z })
    }
  }

  const wallGeometry = new THREE.BoxGeometry(TILE_SIZE, WALL_HEIGHT, TILE_SIZE)
  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x5a5a66 })
  const walls = new THREE.InstancedMesh(
    wallGeometry,
    wallMaterial,
    wallTiles.length,
  )
  const matrix = new THREE.Matrix4()
  wallTiles.forEach((tile, index) => {
    const world = gridToWorld(tile.x, tile.z, TILE_SIZE)
    matrix.setPosition(world.x, WALL_HEIGHT / 2, world.z)
    walls.setMatrixAt(index, matrix)
  })
  group.add(walls)

  const ambientLight = new THREE.AmbientLight(0xffffff, AMBIENT_LIGHT_INTENSITY)
  group.add(ambientLight)

  // Each torch pairs a point light with a small flame mesh at the same
  // spot, plus a random phase so updateTorchFlicker doesn't flicker them
  // all in sync.
  const torches = TORCH_TILES.map((tile, index) => {
    const world = gridToWorld(tile.x, tile.z, TILE_SIZE)
    const light = new THREE.PointLight(
      TORCH_LIGHT_COLOR,
      TORCH_LIGHT_INTENSITY,
      TORCH_LIGHT_DISTANCE,
    )
    light.position.set(world.x, WALL_HEIGHT * 0.75, world.z)
    group.add(light)

    const flame = createFlameMesh()
    flame.position.copy(light.position)
    group.add(flame)

    return { light, flame, phase: index * 1.7 + Math.random() }
  })

  const fog = new THREE.Fog(FOG_COLOR, FOG_NEAR, FOG_FAR)

  const toWorldSpawns = (spawns) =>
    spawns.map((spawn) => gridToWorld(spawn.x, spawn.z, TILE_SIZE))

  return {
    group,
    grid,
    tileSize: TILE_SIZE,
    fog,
    backgroundColor: FOG_COLOR,
    playerSpawn: toWorldSpawns(grid.playerSpawns)[0],
    monsterSpawns: toWorldSpawns(grid.monsterSpawns),
    boxSpawns: toWorldSpawns(grid.boxSpawns),
    torches,
  }
}

// Gives each torch a noisy intensity flicker (a sum of two sines at
// different speeds, offset by the torch's own phase so they don't
// flicker in sync) and pulses its flame mesh along with it.
export function updateTorchFlicker(torches, elapsedSeconds) {
  for (const torch of torches) {
    const t = elapsedSeconds + torch.phase
    const noise = Math.sin(t * TORCH_FLICKER_SPEED_A) * 0.6 + Math.sin(t * TORCH_FLICKER_SPEED_B) * 0.4
    torch.light.intensity = TORCH_LIGHT_INTENSITY * (1 + noise * TORCH_FLICKER_AMOUNT)
    torch.flame.scale.setScalar(1 + noise * 0.15)
  }
}
