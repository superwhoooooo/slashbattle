// Pure, Three-free labyrinth logic: a seeded perfect maze, its wall segments
// (and the circle-chain obstacles that make them solid for the game's
// circle-based collision), a path finder so monsters can navigate it, a
// line-of-sight test, and the spike traps' timing cycle. The maze is centered
// on the world origin; cell (cx, cz) has its center at
// ((cx - (cols-1)/2) * cellSize, (cz - (rows-1)/2) * cellSize).

export function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Directions: 0 = -z (north), 1 = +x (east), 2 = +z (south), 3 = -x (west).
export const DIRS = [
  { dx: 0, dz: -1 },
  { dx: 1, dz: 0 },
  { dx: 0, dz: 1 },
  { dx: -1, dz: 0 },
]
const OPPOSITE = [2, 3, 0, 1]

// `open[cell][dir]` is true when the wall between that cell and its neighbor
// is carved away. A perfect maze: exactly one path between any two cells.
export function generateMaze(cols, rows, rng = Math.random, cellSize = 9) {
  const open = Array.from({ length: cols * rows }, () => [false, false, false, false])
  const visited = new Array(cols * rows).fill(false)
  const stack = [0]
  visited[0] = true
  while (stack.length) {
    const cell = stack[stack.length - 1]
    const cx = cell % cols
    const cz = Math.floor(cell / cols)
    const options = []
    for (let d = 0; d < 4; d++) {
      const nx = cx + DIRS[d].dx
      const nz = cz + DIRS[d].dz
      if (nx < 0 || nz < 0 || nx >= cols || nz >= rows) continue
      if (!visited[nz * cols + nx]) options.push(d)
    }
    if (options.length === 0) {
      stack.pop()
      continue
    }
    const d = options[Math.floor(rng() * options.length)]
    const next = (cz + DIRS[d].dz) * cols + (cx + DIRS[d].dx)
    open[cell][d] = true
    open[next][OPPOSITE[d]] = true
    visited[next] = true
    stack.push(next)
  }
  return { cols, rows, cellSize, open }
}

// Knocks out a few extra walls so the maze has loops (and monsters can't
// always be dodged by a single dead end). Interior walls only.
export function braidMaze(maze, rng, count) {
  const { cols, rows, open } = maze
  let tries = count * 12
  let removed = 0
  while (removed < count && tries-- > 0) {
    const cx = Math.floor(rng() * cols)
    const cz = Math.floor(rng() * rows)
    const d = Math.floor(rng() * 4)
    const nx = cx + DIRS[d].dx
    const nz = cz + DIRS[d].dz
    if (nx < 0 || nz < 0 || nx >= cols || nz >= rows) continue
    const cell = cz * cols + cx
    if (open[cell][d]) continue
    open[cell][d] = true
    open[nz * cols + nx][OPPOSITE[d]] = true
    removed += 1
  }
  return maze
}

export function mazeHalfSize(maze) {
  return { x: (maze.cols * maze.cellSize) / 2, z: (maze.rows * maze.cellSize) / 2 }
}

export function cellCenter(maze, cell) {
  const cx = cell % maze.cols
  const cz = Math.floor(cell / maze.cols)
  return {
    x: (cx - (maze.cols - 1) / 2) * maze.cellSize,
    z: (cz - (maze.rows - 1) / 2) * maze.cellSize,
  }
}

// The cell a world point is in (clamped to the maze).
export function cellOf(maze, x, z) {
  const cx = Math.floor(x / maze.cellSize + maze.cols / 2)
  const cz = Math.floor(z / maze.cellSize + maze.rows / 2)
  return Math.max(0, Math.min(maze.rows - 1, cz)) * maze.cols + Math.max(0, Math.min(maze.cols - 1, cx))
}

// Every wall that is still standing, as an axis-aligned segment
// { x1, z1, x2, z2 } on the cell lattice (outer border included). `skip`
// (optional) drops a wall by `${cell},${dir}` key -- used for the gate's
// own doorway so it can be built separately.
export function wallSegments(maze) {
  const { cols, rows, cellSize: s, open } = maze
  const hx = (cols * s) / 2
  const hz = (rows * s) / 2
  const segments = []
  for (let cz = 0; cz < rows; cz++) {
    for (let cx = 0; cx < cols; cx++) {
      const cell = cz * cols + cx
      const x0 = -hx + cx * s
      const z0 = -hz + cz * s
      // north wall: only draw each shared wall once (north/west of a cell).
      if (!open[cell][0]) segments.push({ x1: x0, z1: z0, x2: x0 + s, z2: z0 })
      if (!open[cell][3]) segments.push({ x1: x0, z1: z0, x2: x0, z2: z0 + s })
      // south / east walls only on the maze's far border
      if (cz === rows - 1 && !open[cell][2]) segments.push({ x1: x0, z1: z0 + s, x2: x0 + s, z2: z0 + s })
      if (cx === cols - 1 && !open[cell][1]) segments.push({ x1: x0 + s, z1: z0, x2: x0 + s, z2: z0 + s })
    }
  }
  return segments
}

// The circle-chain obstacles that make a segment solid: circles of `radius`
// spaced so they overlap, giving a wall about 2 * radius thick.
export function segmentObstacles(segment, radius) {
  const length = Math.hypot(segment.x2 - segment.x1, segment.z2 - segment.z1)
  const steps = Math.max(1, Math.ceil(length / (radius * 1.3)))
  const obstacles = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    obstacles.push({
      x: segment.x1 + (segment.x2 - segment.x1) * t,
      z: segment.z1 + (segment.z2 - segment.z1) * t,
      radius,
    })
  }
  return obstacles
}

// All the wall obstacles for a maze.
export function wallObstacles(maze, radius) {
  return wallSegments(maze).flatMap((segment) => segmentObstacles(segment, radius))
}

// BFS distances (in cells) from `target` across open passages; unreachable = Infinity.
export function distanceField(maze, target) {
  const dist = new Array(maze.cols * maze.rows).fill(Infinity)
  dist[target] = 0
  const queue = [target]
  for (let head = 0; head < queue.length; head++) {
    const cell = queue[head]
    const cx = cell % maze.cols
    const cz = Math.floor(cell / maze.cols)
    for (let d = 0; d < 4; d++) {
      if (!maze.open[cell][d]) continue
      const next = (cz + DIRS[d].dz) * maze.cols + (cx + DIRS[d].dx)
      if (dist[next] !== Infinity) continue
      dist[next] = dist[cell] + 1
      queue.push(next)
    }
  }
  return dist
}

// The farthest cell from `from` (where the gate goes).
export function farthestCell(maze, from) {
  const dist = distanceField(maze, from)
  let best = from
  for (let i = 0; i < dist.length; i++) if (dist[i] !== Infinity && dist[i] > dist[best]) best = i
  return best
}

// A navigator for monsters: given a field cache it answers "which way next to
// get from A to B" and "can A see B". `walls` are the half-thickness-expanded
// rects used for line of sight.
export function createNavigator(maze, wallHalfThickness = 0.7) {
  const fields = new Map()
  const rects = wallSegments(maze).map((s) => ({
    minX: Math.min(s.x1, s.x2) - wallHalfThickness,
    maxX: Math.max(s.x1, s.x2) + wallHalfThickness,
    minZ: Math.min(s.z1, s.z2) - wallHalfThickness,
    maxZ: Math.max(s.z1, s.z2) + wallHalfThickness,
  }))
  function field(target) {
    let f = fields.get(target)
    if (!f) {
      f = distanceField(maze, target)
      fields.set(target, f)
    }
    return f
  }
  const hx = (maze.cols * maze.cellSize) / 2
  const hz = (maze.rows * maze.cellSize) / 2
  function insideWall(x, z) {
    if (Math.abs(x) > hx - wallHalfThickness || Math.abs(z) > hz - wallHalfThickness) return true
    for (const r of rects) if (x > r.minX && x < r.maxX && z > r.minZ && z < r.maxZ) return true
    return false
  }
  return {
    maze,
    // True when no wall lies on the straight line between the two points.
    hasLineOfSight(a, b) {
      const dx = b.x - a.x
      const dz = b.z - a.z
      const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.8))
      for (let i = 1; i < steps; i++) {
        if (insideWall(a.x + (dx * i) / steps, a.z + (dz * i) / steps)) return false
      }
      return true
    },
    // Path length in cells between two points (Infinity if cut off).
    pathCells(from, to) {
      return field(cellOf(maze, to.x, to.z))[cellOf(maze, from.x, from.z)]
    },
    // The point to head for from `from` to eventually reach `to`: the center of
    // the next cell along the path, or `to` itself once in the same cell.
    nextWaypoint(from, to) {
      const here = cellOf(maze, from.x, from.z)
      const goal = cellOf(maze, to.x, to.z)
      if (here === goal) return insideWall(to.x, to.z) ? cellCenter(maze, goal) : to
      const dist = field(goal)
      const cx = here % maze.cols
      const cz = Math.floor(here / maze.cols)
      let best = null
      let bestDir = 0
      for (let d = 0; d < 4; d++) {
        if (!maze.open[here][d]) continue
        const next = (cz + DIRS[d].dz) * maze.cols + (cx + DIRS[d].dx)
        if (best === null || dist[next] < dist[best]) {
          best = next
          bestDir = d
        }
      }
      if (best === null) return to
      // Head for the doorway between the two cells, and a bit beyond it.
      const c = cellCenter(maze, here)
      const reach = maze.cellSize / 2 + 1.2
      return { x: c.x + DIRS[bestDir].dx * reach, z: c.z + DIRS[bestDir].dz * reach }
    },
    insideWall,
  }
}

// ---- Spike traps ----------------------------------------------------------

export const SPIKE_PERIOD = 3.2 // seconds for one full cycle
export const SPIKE_WARN = 0.7 // spikes poking up, not yet dangerous
export const SPIKE_UP = 1.1 // fully extended and dangerous
export const SPIKE_RADIUS = 1.7
export const SPIKE_PLAYER_DAMAGE = 14
export const SPIKE_MONSTER_DAMAGE = 24

// 'down' | 'warn' | 'up' at game time `t` for a trap with its own `phase`.
export function spikeState(phase, t) {
  const local = (((t + phase) % SPIKE_PERIOD) + SPIKE_PERIOD) % SPIKE_PERIOD
  const downFor = SPIKE_PERIOD - SPIKE_WARN - SPIKE_UP
  if (local < downFor) return 'down'
  if (local < downFor + SPIKE_WARN) return 'warn'
  return 'up'
}

// How far out the spikes are, 0..1 (for animating the mesh).
export function spikeExtension(phase, t) {
  const local = (((t + phase) % SPIKE_PERIOD) + SPIKE_PERIOD) % SPIKE_PERIOD
  const downFor = SPIKE_PERIOD - SPIKE_WARN - SPIKE_UP
  if (local < downFor) return 0
  if (local < downFor + SPIKE_WARN) return 0.18 + 0.1 * Math.sin(((local - downFor) / SPIKE_WARN) * 24) // twitching tips
  const upLocal = local - downFor - SPIKE_WARN
  return upLocal < 0.12 ? 0.28 + (upLocal / 0.12) * 0.72 : 1
}

// Scatters `count` traps across the maze's corridors, never in the cells in
// `avoidCells`, at most `perCell` per cell, each with its own phase so they
// don't all snap shut together.
export function placeSpikeTraps(maze, rng, count, avoidCells = [], perCell = 1) {
  const traps = []
  const used = new Map()
  let tries = count * 20
  while (traps.length < count && tries-- > 0) {
    const cell = Math.floor(rng() * maze.cols * maze.rows)
    if (avoidCells.includes(cell)) continue
    if ((used.get(cell) ?? 0) >= perCell) continue
    used.set(cell, (used.get(cell) ?? 0) + 1)
    const c = cellCenter(maze, cell)
    const jitter = maze.cellSize * 0.18
    traps.push({
      x: c.x + (rng() - 0.5) * 2 * jitter,
      z: c.z + (rng() - 0.5) * 2 * jitter,
      radius: SPIKE_RADIUS,
      phase: rng() * SPIKE_PERIOD,
      cell,
    })
  }
  return traps
}

// ---- Floors ---------------------------------------------------------------

export const LABYRINTH_FLOORS = 3
export const BOSSES_PER_FLOOR = 2

// Per-floor look and difficulty. `trapCount` grows with depth.
export const FLOOR_DEFS = [
  {
    name: 'Floor 1: The Cellars',
    seed: 4242,
    trapCount: 9,
    wall: 0x8c7a6a,
    wallTop: 0xc9b79c,
    floor: 0x6b5e52,
    floorAlt: 0x7a6c5e,
    fog: 0x2a2530,
    torch: 0xffa94d,
    hemiSky: 0x9a8aa8,
    hemiGround: 0x4a3f38,
    key: 0xffd9a0,
  },
  {
    name: 'Floor 2: The Crypt',
    seed: 9001,
    trapCount: 13,
    wall: 0x5d6d86,
    wallTop: 0x93a6c4,
    floor: 0x3f4a5e,
    floorAlt: 0x485470,
    fog: 0x141a2c,
    torch: 0x6ad7ff,
    hemiSky: 0x7088b8,
    hemiGround: 0x2a3144,
    key: 0xbcd6ff,
  },
  {
    name: 'Floor 3: The Furnace',
    seed: 1717,
    trapCount: 18,
    wall: 0x7a3b36,
    wallTop: 0xd9755e,
    floor: 0x4a2a28,
    floorAlt: 0x5a3330,
    fog: 0x2b1010,
    torch: 0xff5a2a,
    hemiSky: 0xb06a5a,
    hemiGround: 0x3a1c18,
    key: 0xffb27a,
  },
]

export const MAZE_COLS = 7
export const MAZE_ROWS = 7
export const MAZE_CELL = 9
export const WALL_RADIUS = 0.75

// Builds one floor's data: the maze, start/gate cells, traps.
export function buildFloor(floorIndex) {
  const def = FLOOR_DEFS[Math.min(floorIndex, FLOOR_DEFS.length - 1)]
  const rng = mulberry32(def.seed)
  const maze = braidMaze(generateMaze(MAZE_COLS, MAZE_ROWS, rng, MAZE_CELL), rng, 5)
  const startCell = (maze.rows - 1) * maze.cols // bottom-left
  // The gate goes in a dead end far from the start. A braided maze may have
  // no dead end left at the very farthest cell, so just take the farthest cell
  // and wall its extra openings shut.
  const gateCell = farthestCell(maze, startCell)
  // Seal the gate cell down to a single doorway (toward the start).
  const dist = distanceField(maze, startCell)
  let doorDir = -1
  for (let d = 0; d < 4; d++) {
    if (!maze.open[gateCell][d]) continue
    const cx = gateCell % maze.cols
    const cz = Math.floor(gateCell / maze.cols)
    const next = (cz + DIRS[d].dz) * maze.cols + (cx + DIRS[d].dx)
    if (doorDir === -1 || dist[next] < dist[(cz + DIRS[doorDir].dz) * maze.cols + (cx + DIRS[doorDir].dx)]) doorDir = d
  }
  for (let d = 0; d < 4; d++) {
    if (d === doorDir || !maze.open[gateCell][d]) continue
    const cx = gateCell % maze.cols
    const cz = Math.floor(gateCell / maze.cols)
    const next = (cz + DIRS[d].dz) * maze.cols + (cx + DIRS[d].dx)
    maze.open[gateCell][d] = false
    maze.open[next][OPPOSITE[d]] = false
  }
  const traps = placeSpikeTraps(maze, rng, def.trapCount, [startCell, gateCell])
  // The gate's door: the opening between the gate cell and its neighbor.
  const gc = cellCenter(maze, gateCell)
  const door = {
    x: gc.x + (DIRS[doorDir].dx * maze.cellSize) / 2,
    z: gc.z + (DIRS[doorDir].dz * maze.cellSize) / 2,
    dir: doorDir,
    width: maze.cellSize - 2 * WALL_RADIUS,
  }
  return { def, maze, startCell, gateCell, door, traps, start: cellCenter(maze, startCell), exit: gc }
}

// The portcullis across the gate's door as obstacles (removed when it opens).
export function doorObstacles(door) {
  const along = door.dir === 0 || door.dir === 2 ? 'x' : 'z'
  const out = []
  const half = door.width / 2
  const step = WALL_RADIUS * 0.9
  for (let o = -half; o <= half + 1e-6; o += step) {
    out.push({ x: door.x + (along === 'x' ? o : 0), z: door.z + (along === 'z' ? o : 0), radius: WALL_RADIUS })
  }
  return out
}

// Where a boss drops in for its intro: a cell center straight down an open
// corridor from the player (up to two cells away), so the carpet and the
// boss's approach don't cut through walls. Falls back to the player's cell.
export function bossSpot(maze, pos, rng = Math.random) {
  const here = cellOf(maze, pos.x, pos.z)
  const options = []
  for (let d = 0; d < 4; d++) {
    let cell = here
    for (let step = 1; step <= 2; step++) {
      if (!maze.open[cell][d]) break
      const cx = cell % maze.cols
      const cz = Math.floor(cell / maze.cols)
      cell = (cz + DIRS[d].dz) * maze.cols + (cx + DIRS[d].dx)
      options.push({ cell, step })
    }
  }
  if (options.length === 0) return cellCenter(maze, here)
  // Prefer the farther spots for a proper entrance.
  const far = options.filter((o) => o.step === 2)
  const pool = far.length ? far : options
  return cellCenter(maze, pool[Math.floor(rng() * pool.length)].cell)
}
