import * as THREE from 'three'
import {
  DAMAGE_SPARK_COLOR,
  DAMAGE_SPARK_COUNT,
  DAMAGE_SPARK_SPEED,
  FALL_DAMAGE,
  FALL_DESPAWN_DEPTH,
  FALL_GRAVITY,
  HIT_FLASH_DURATION,
  JELLY_HIT_STRENGTH,
  PLAYER_IFRAME_DURATION,
  PLAYER_MAX_HP,
  PLAYER_RADIUS,
  PLAYER_SPEED,
} from './config.js'
import { createPlayerMesh } from './characters.js'
import { resolveArenaMove } from './logic/arena.js'
import { applyDamage } from './logic/combat.js'
import { stepFall } from './logic/falling.js'
import { jellyHit } from './jelly.js'
import { burst } from './particles.js'

const HIT_FLASH_COLOR = new THREE.Color(1, 0, 0)

export class Player {
  constructor({ spawn, obstacles = [], particleSystem = null }) {
    this.obstacles = obstacles
    this.particleSystem = particleSystem
    this.position = { x: spawn.x, z: spawn.z }
    this.facing = 0 // yaw, radians
    this.hp = PLAYER_MAX_HP
    this.invulnerableUntil = -Infinity
    this._hitFlashElapsed = null // null means not currently flashing
    this.hidden = false
    this.exitedAt = null // seconds elapsed at the last pop-out; drives the ambush window
    this.falling = false
    this.fallState = { velocityY: 0, fallenY: 0 }
    this.speed = 0 // world units/second, for the jelly movement bulge
    this.moveDir = { x: 0, z: 1 } // normalized horizontal movement direction, for the jelly movement bulge

    this.mesh = createPlayerMesh()
    this.mesh.position.x = this.position.x
    this.mesh.position.z = this.position.z
  }

  // Applies damage unless hidden (monsters can't see a hidden player, but
  // this is a no-op either way so nothing can sneak past it) or still
  // within invulnerability frames from a previous hit, and starts a brief
  // red flash plus a jelly hit splat. `now` is seconds elapsed (the same
  // clock the attack cooldown uses). Returns whether the damage was
  // actually applied, so callers can trigger a screen shake only on a
  // real hit.
  damagePlayer(amount, now) {
    if (this.hidden) return false
    if (now < this.invulnerableUntil) return false
    this.hp = applyDamage({ hp: this.hp }, amount).hp
    this.invulnerableUntil = now + PLAYER_IFRAME_DURATION
    this._hitFlashElapsed = 0
    jellyHit(this.mesh, JELLY_HIT_STRENGTH)
    this._damageSpark()
    return true
  }

  // A small red spark burst at roughly chest height, for any damage the
  // player takes (a monster's hit or a fall). No-op if this Player
  // wasn't given a particle system to burst into.
  _damageSpark() {
    if (!this.particleSystem) return
    burst(
      this.particleSystem,
      { x: this.position.x, y: 1, z: this.position.z },
      DAMAGE_SPARK_COLOR,
      DAMAGE_SPARK_COUNT,
      DAMAGE_SPARK_SPEED,
    )
  }

  // Snaps into a pod: position set to the pod's center, hidden, and the
  // mesh hidden. update() stops moving the player while hidden.
  enterHiding(boxPos) {
    this.position.x = boxPos.x
    this.position.z = boxPos.z
    this.mesh.position.x = boxPos.x
    this.mesh.position.z = boxPos.z
    this.hidden = true
    this.mesh.visible = false
  }

  // Pops out at exitPos, shown again, and records exitedAt (seconds
  // elapsed) so the ambush damage window can start counting down.
  exitHiding(exitPos, now) {
    this.position.x = exitPos.x
    this.position.z = exitPos.z
    this.mesh.position.x = exitPos.x
    this.mesh.position.z = exitPos.z
    this.hidden = false
    this.mesh.visible = true
    this.exitedAt = now
  }

  // Starts the player falling off the platform: update() stops moving the
  // player while this is true, so main.js's updateFalling() owns the
  // player's vertical position until the fall ends.
  startFalling() {
    this.falling = true
    this.fallState = { velocityY: 0, fallenY: 0 }
  }

  // Advances a fall in progress. Once the player has dropped
  // FALL_DESPAWN_DEPTH, applies FALL_DAMAGE -- bypassing i-frames and the
  // hidden check, since falling off isn't an attack a hidden player could
  // dodge -- and respawns at the platform's center with fresh i-frames.
  // Returns whether the fall damage was actually applied this tick, so
  // callers can trigger the same shake/flash feedback a monster's hit
  // does.
  updateFalling(deltaSeconds, now) {
    this.fallState = stepFall(this.fallState, deltaSeconds, FALL_GRAVITY)
    this.mesh.position.y = -this.fallState.fallenY
    if (this.fallState.fallenY < FALL_DESPAWN_DEPTH) return false

    this.hp = applyDamage({ hp: this.hp }, FALL_DAMAGE).hp
    this.invulnerableUntil = now + PLAYER_IFRAME_DURATION
    this._hitFlashElapsed = 0
    jellyHit(this.mesh, JELLY_HIT_STRENGTH)
    this._damageSpark()

    this.falling = false
    this.position.x = 0
    this.position.z = 0
    this.mesh.position.set(0, 0, 0)
    return true
  }

  // Fades the red hit flash back to the body material's own baseline
  // emissive tint (not to black) over HIT_FLASH_DURATION. Runs every
  // frame via update() so it keeps progressing even while the player
  // stands still.
  _updateHitFlash(deltaSeconds) {
    if (this._hitFlashElapsed === null) return
    this._hitFlashElapsed += deltaSeconds
    const t = Math.min(this._hitFlashElapsed / HIT_FLASH_DURATION, 1)
    const material = this.mesh.userData.body.material
    material.emissive.lerpColors(HIT_FLASH_COLOR, material.userData.baseEmissive, t)
    if (t >= 1) this._hitFlashElapsed = null
  }

  // Moves the player relative to the camera's yaw using WASD/arrow input,
  // resolves the move against the platform's obstacles (with sliding),
  // and turns the mesh to face the direction it just moved in. Does
  // nothing while hidden or while falling off the platform. Does NOT stop
  // the player from walking off the platform's edge -- main.js checks
  // isOnPlatform after calling this and starts a fall if it has.
  update(input, cameraYaw, deltaSeconds) {
    this._updateHitFlash(deltaSeconds)
    if (this.hidden || this.falling) return

    const forwardInput =
      (input.isDown('KeyW') || input.isDown('ArrowUp') ? 1 : 0) -
      (input.isDown('KeyS') || input.isDown('ArrowDown') ? 1 : 0)
    const strafeInput =
      (input.isDown('KeyD') || input.isDown('ArrowRight') ? 1 : 0) -
      (input.isDown('KeyA') || input.isDown('ArrowLeft') ? 1 : 0)

    if (forwardInput === 0 && strafeInput === 0) {
      this.speed = 0
      return
    }

    // Camera-relative forward/right axes: at yaw 0 the camera looks down -Z.
    const forwardX = -Math.sin(cameraYaw)
    const forwardZ = -Math.cos(cameraYaw)
    const rightX = Math.cos(cameraYaw)
    const rightZ = -Math.sin(cameraYaw)

    let dirX = forwardInput * forwardX + strafeInput * rightX
    let dirZ = forwardInput * forwardZ + strafeInput * rightZ
    const length = Math.hypot(dirX, dirZ)
    if (length === 0) {
      this.speed = 0
      return
    }
    dirX /= length
    dirZ /= length

    const distance = PLAYER_SPEED * deltaSeconds
    const resolved = resolveArenaMove(
      this.position,
      { x: dirX * distance, z: dirZ * distance },
      PLAYER_RADIUS,
      this.obstacles,
    )
    this.position = resolved

    this.facing = Math.atan2(dirX, dirZ)
    this.speed = PLAYER_SPEED
    this.moveDir = { x: dirX, z: dirZ }
    this.mesh.position.x = this.position.x
    this.mesh.position.z = this.position.z
    this.mesh.rotation.y = this.facing
  }
}
