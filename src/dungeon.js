import * as THREE from 'three'
import {
  AMBIENT_LIGHT_INTENSITY,
  FOG_COLOR,
  FOG_FAR,
  FOG_NEAR,
  TILE_SIZE,
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

  TORCH_TILES.forEach((tile) => {
    const world = gridToWorld(tile.x, tile.z, TILE_SIZE)
    const torch = new THREE.PointLight(
      TORCH_LIGHT_COLOR,
      TORCH_LIGHT_INTENSITY,
      TORCH_LIGHT_DISTANCE,
    )
    torch.position.set(world.x, WALL_HEIGHT * 0.75, world.z)
    group.add(torch)
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
  }
}
