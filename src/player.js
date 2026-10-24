import {
  HIT_FLASH_DURATION,
  PLAYER_IFRAME_DURATION,
  PLAYER_MAX_HP,
  PLAYER_RADIUS,
  PLAYER_SPEED,
  TILE_SIZE,
} from './config.js'
import { createPlayerMesh } from './characters.js'
import { applyDamage } from './logic/combat.js'
import { resolveMove } from './logic/grid.js'

export class Player {
  constructor({ spawn, grid, tileSize = TILE_SIZE }) {
    this.grid = grid
    this.tileSize = tileSize
    this.position = { x: spawn.x, z: spawn.z }
    this.facing = 0 // yaw, radians
    this.hp = PLAYER_MAX_HP
    this.invulnerableUntil = -Infinity
    this._hitFlashElapsed = null // null means not currently flashing

    this.mesh = createPlayerMesh()
    this.mesh.position.x = this.position.x
    this.mesh.position.z = this.position.z
  }

  // Applies damage unless the player is still within invulnerability
  // frames from a previous hit, and starts a brief red flash. `now` is
  // seconds elapsed (the same clock the attack cooldown uses). Monsters
  // call this once they can attack (the AI milestone); nothing calls it
  // yet.
  damagePlayer(amount, now) {
    if (now < this.invulnerableUntil) return
    this.hp = applyDamage({ hp: this.hp }, amount).hp
    this.invulnerableUntil = now + PLAYER_IFRAME_DURATION
    this._hitFlashElapsed = 0
  }

  // Fades the red hit flash back to normal over HIT_FLASH_DURATION. Runs
  // every frame via update() so it keeps progressing even while the
  // player stands still.
  _updateHitFlash(deltaSeconds) {
    if (this._hitFlashElapsed === null) return
    this._hitFlashElapsed += deltaSeconds
    const t = Math.min(this._hitFlashElapsed / HIT_FLASH_DURATION, 1)
    this.mesh.userData.body.material.emissive.setRGB(1 - t, 0, 0)
    if (t >= 1) this._hitFlashElapsed = null
  }

  // Moves the player relative to the camera's yaw using WASD/arrow input,
  // resolves the move against the dungeon grid's walls (with sliding), and
  // turns the mesh to face the direction it just moved in.
  update(input, cameraYaw, deltaSeconds) {
    this._updateHitFlash(deltaSeconds)

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
