import { PLAYER_RADIUS, PLAYER_SPEED, TILE_SIZE } from './config.js'
import { createPlayerMesh } from './characters.js'
import { resolveMove } from './logic/grid.js'

export class Player {
  constructor({ spawn, grid, tileSize = TILE_SIZE }) {
    this.grid = grid
    this.tileSize = tileSize
    this.position = { x: spawn.x, z: spawn.z }
    this.facing = 0 // yaw, radians

    this.mesh = createPlayerMesh()
    this.mesh.position.x = this.position.x
    this.mesh.position.z = this.position.z
  }

  // Moves the player relative to the camera's yaw using WASD/arrow input,
  // resolves the move against the dungeon grid's walls (with sliding), and
  // turns the mesh to face the direction it just moved in.
  update(input, cameraYaw, deltaSeconds) {
    const forwardInput =
      (input.isDown('KeyW') || input.isDown('ArrowUp') ? 1 : 0) -
      (input.isDown('KeyS') || input.isDown('ArrowDown') ? 1 : 0)
    const strafeInput =
      (input.isDown('KeyD') || input.isDown('ArrowRight') ? 1 : 0) -
      (input.isDown('KeyA') || input.isDown('ArrowLeft') ? 1 : 0)

    if (forwardInput === 0 && strafeInput === 0) return

    // Camera-relative forward/right axes: at yaw 0 the camera looks down -Z.
    const forwardX = -Math.sin(cameraYaw)
    const forwardZ = -Math.cos(cameraYaw)
    const rightX = Math.cos(cameraYaw)
    const rightZ = -Math.sin(cameraYaw)

    let dirX = forwardInput * forwardX + strafeInput * rightX
    let dirZ = forwardInput * forwardZ + strafeInput * rightZ
    const length = Math.hypot(dirX, dirZ)
    if (length === 0) return
    dirX /= length
    dirZ /= length

    const distance = PLAYER_SPEED * deltaSeconds
    const resolved = resolveMove(
      this.grid,
      this.tileSize,
      this.position,
      PLAYER_RADIUS,
      { x: dirX * distance, z: dirZ * distance },
    )
    this.position = resolved

    this.facing = Math.atan2(dirX, dirZ)
    this.mesh.position.x = this.position.x
    this.mesh.position.z = this.position.z
    this.mesh.rotation.y = this.facing
  }
}
