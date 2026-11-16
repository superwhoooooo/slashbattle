// Online co-op (P): up to four players fight the same waves on the Orbital Sundeck.
//
// The HOST's game is the real one: it runs the waves, every monster and every boss, and streams them to
// everyone ~15 times a second. A joined player's monsters are PUPPETS that follow the host's: they sit in
// game.monsters like any monster, so every weapon, bullet, pet, ability and hero trait can hit them, but
// combat.js's damageMonster hands a hit on a puppet to us (setNetHooks) and we send it to the host, whose
// game applies it. Kill credit (score, crystals, the trick) goes to whoever landed the last hit.
//
// Monsters go after the nearest player who is up. On the host a remote player is a stand-in object with the
// same fields the AI reads (position, hidden, sightScale, damagePlayer), so monster.js needs no changes:
// when a monster's swing lands on a stand-in, the host sends that player a 'hurt' and THEIR game applies
// it (their armour, i-frames, shake). A monster's area attacks and shots are sent to everyone as events and
// each game checks them against its own player.
//
// Each player keeps their own hero, gear, crystals, chests, pods, pets and score. A player who goes down
// gets back up after a few seconds; the run only ends when everyone is down at once.
//
// src/net/link.js moves the messages (PeerJS, with an MQTT relay fallback); src/logic/coop.js holds the
// pure rules (snapshot format, targeting, event routing).
import * as THREE from 'three'
import { Link } from './net/link.js'
import {
  COOP_RESPAWN_SECONDS, INTERP_DELAY, MAX_PLAYERS, PROTOCOL, RELAY_INTERP_DELAY, cleanName, clampDamage, everyoneDown,
  lerp, lerpAngle, normalizeCode, packMonster, packPets, packShots, pickTarget, plainCopy, pushSnapshot, routeEvents, sampleSnapshots,
  unpackMonster, unpackPets, unpackShots,
} from './logic/coop.js'
import { createPetModel } from './petModels.js'
import { createBeamMesh, aimBeam } from './pets.js'
import { PETS } from './logic/items.js'
import {
  BOSS_DEATH_SHARD_MULTIPLIER, DEATH_SHARD_COUNT, DEATH_SHARD_SPEED, FALL_DESPAWN_DEPTH, FALL_GRAVITY, JELLY_DEATH_INFLATE_STRENGTH,
  JELLY_HIT_STRENGTH, MONSTER_FALL_TUMBLE_SPEED, MONSTER_TYPES, PLAYER_IFRAME_DURATION,
} from './config.js'
import { createMonsterMesh, createPlayerMesh, setPlayerWeapon } from './characters.js'
import { createMonsterAIState } from './monster.js'
import { setNetHooks, updateMonsterHitReaction } from './combat.js'
import { dressPlayer } from './heroGear.js'
import { heroLook as lookForProfile } from './logic/heroes.js'
import { jellyHit, updateJelly } from './jelly.js'
import { updateFace3D } from './face3d.js'
import { animateAlive } from './alive.js'
import { burst, shardBurst } from './particles.js'
import { createSpawnEffect } from './spawner.js'
import { stepFall } from './logic/falling.js'

const STATE_HZ = 20 // our own player, to everyone
const MONSTER_HZ = 15 // host -> joiners: every monster
const RELAY_STATE_HZ = 10 // gentler on the public relay
const RELAY_MONSTER_HZ = 8
const NAME_KEY = 'slashbattle:coopName'
const COLORS = ['#ff6a4d', '#19b5a5', '#8a6cff', '#ffb547'] // name-tag accents, by join order

function nameTag(name, color) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 64
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = 'rgba(26,36,51,0.78)'
  ctx.beginPath()
  ctx.roundRect(4, 6, 248, 52, 20)
  ctx.fill()
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(30, 32, 9, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.font = '700 28px Sora, system-ui, sans-serif'
  ctx.textBaseline = 'middle'
  ctx.fillText(name, 48, 33, 196)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false }))
  sprite.scale.set(2.6, 0.65, 1)
  sprite.position.y = 2.7
  sprite.renderOrder = 10
  return sprite
}

/**
 * @param {object} ctx  hooks into main.js:
 *   scene, particleSystem, getGame(), now(), disposeObject3D(obj)
 *   localLook() -> { hero, skin }, localWeapon() -> id
 *   canCoop() -> null | reason it can't start now
 *   onJoined(welcome)            joiner: the host welcomed us (reset to their run)
 *   onEnded(reason, wasClient)   the session is over
 *   onHurt(amount, trueFraction) joiner: a monster's melee landed on us in the host's game
 *   onEvents(mesh, events)       a monster's attack events to play out against our own player
 *   onKill(info)                 we landed a killing blow in the host's game
 *   onWaveEvents(msg)            joiner: the host's wave controller cleared a wave / a boss, a boss is coming
 *   onRestart()                  joiner: the host started a new run
 *   onGameOver()                 everyone is down
 *   onSwingFx(weaponId, at, facing)  someone else swung / fired
 *   toast(text)
 */
export function createCoop(ctx) {
  const remotes = new Map() // id -> remote player
  const puppets = new Map() // joiner: netId -> monster mesh
  let nextNetId = 1
  let sendT = 0
  let monsterT = 0
  let welcomed = false
  let hostDifficulty = null
  let lastSwingSeq = 0
  let name = (() => { try { return localStorage.getItem(NAME_KEY) || '' } catch { return '' } })()
  const t0 = performance.now()
  const clock = () => (performance.now() - t0) / 1000

  const link = new Link({
    onStatus: (text) => setStatus(text),
    onConnected: () => refresh(),
    onPeerJoin: (id, peerName) => hostAcceptPeer(id, peerName),
    onPeerLeave: (id) => removeRemote(id, true),
    onMessage: (m, from) => receive(m, from),
    onClosed: (reason, wasHost) => {
      const wasClient = welcomed && !wasHost
      for (const id of [...remotes.keys()]) removeRemote(id, false)
      clearPuppets()
      welcomed = false
      hostDifficulty = null
      if (reason === 'hostLeft') setStatus('The host left the game.')
      else if (reason === 'left') setStatus('Left the game.')
      ctx.onEnded(reason, wasClient)
      refresh()
    },
  })

  // ---------- roles ----------
  const isHost = () => link.isHost && link.active
  const isClient = () => !link.isHost && link.active && welcomed
  const active = () => isHost() || isClient()

  // ---------- remote players ----------
  function addRemote(id, info) {
    if (id === link.myId || remotes.has(id)) return remotes.get(id)
    const color = COLORS[remotes.size % COLORS.length]
    const mesh = createPlayerMesh()
    mesh.position.set(0, -50, 0) // out of sight until their first state arrives
    const tag = nameTag(cleanName(info.name), color)
    mesh.add(tag)
    ctx.scene.add(mesh)
    const remote = {
      id,
      name: cleanName(info.name),
      mesh,
      tag,
      snaps: [],
      lookKey: '',
      weapon: null,
      last: null,
      pets: [], // { key, mesh, beam } for each of their pet units we're showing
      speed: 0,
      moveDir: { x: 0, z: 1 },
      // What the host's monsters see and swing at: the same fields monster.js reads off the real player.
      proxy: {
        key: id,
        remote: true,
        position: { x: 0, z: 0 },
        hidden: true,
        diving: false,
        sightScale: 1,
        ghostUntil: -Infinity,
        invulnerableUntil: -Infinity,
        down: true,
        damagePlayer(amount, now, trueFraction = 0) {
          if (this.hidden || this.down || now < this.invulnerableUntil) return false
          this.invulnerableUntil = now + PLAYER_IFRAME_DURATION
          link.sendTo(id, { t: 'hurt', d: Math.round(amount * 100) / 100, tf: trueFraction })
          return true
        },
      },
    }
    remotes.set(id, remote)
    refresh()
    return remote
  }

  function removeRemote(id, announce) {
    const remote = remotes.get(id)
    if (!remote) return
    remotes.delete(id)
    ctx.disposeObject3D(remote.mesh)
    clearRemotePets(remote)
    if (announce) ctx.toast(`${remote.name} LEFT THE GAME`)
    refresh()
  }

  function hostAcceptPeer(id, peerName) {
    const game = ctx.getGame()
    const reason = ctx.canCoop()
    if (reason) {
      link.sendTo(id, { t: 'nope', why: reason })
      return
    }
    link.sendTo(id, {
      t: 'welcome',
      v: PROTOCOL,
      you: id,
      level: game.levelIndex ?? 0,
      difficulty: ctx.difficultyId(),
      players: [{ id: 'host', name: link.name }, ...[...remotes.values()].map((r) => ({ id: r.id, name: r.name }))],
    })
    addRemote(id, { name: peerName })
    link.broadcast({ t: 'join', id, name: peerName }, id)
    ctx.toast(`${cleanName(peerName).toUpperCase()} JOINED!`)
  }

  function applyRemoteState(remote, m) {
    if (!Number.isFinite(m.x) || !Number.isFinite(m.z)) return
    pushSnapshot(remote.snaps, { t: clock(), x: m.x, z: m.z, y: Number.isFinite(m.y) ? m.y : 0, f: Number.isFinite(m.f) ? m.f : 0, p: unpackPets(m.pt) })
    const look = `${m.hero}:${m.skin}`
    if (look !== remote.lookKey && typeof m.hero === 'string') {
      remote.lookKey = look
      try { dressPlayer(remote.mesh, lookForProfile({ hero: m.hero, heroSkins: { [m.hero]: m.skin } })) } catch { /* an unknown hero: keep the plain jelly */ }
    }
    if (m.w && m.w !== remote.weapon) {
      remote.weapon = m.w
      try { setPlayerWeapon(remote.mesh, m.w) } catch { /* unknown weapon id */ }
    }
    const p = remote.proxy
    p.hidden = Boolean(m.hid)
    p.down = Boolean(m.dn)
    p.diving = Boolean(m.dv)
    p.sightScale = Number.isFinite(m.ss) ? m.ss : 1
    p.ghostUntil = m.gh ? Infinity : -Infinity
    remote.hp = m.hp
    remote.maxHp = m.mhp
    if (m.sw && m.sw !== remote.swingSeq) {
      const first = remote.swingSeq === undefined
      remote.swingSeq = m.sw
      if (!first && !p.hidden && !p.down) ctx.onSwingFx(remote.weapon, { x: m.x, z: m.z }, m.f)
    }
  }

  function stepRemotes(dt) {
    const delay = link.viaRelay ? RELAY_INTERP_DELAY : INTERP_DELAY
    const t = clock() - delay
    const now = ctx.now()
    for (const remote of remotes.values()) {
      const s = sampleSnapshots(remote.snaps, t)
      if (!s) continue
      const x = lerp(s.a.x, s.b.x, s.k)
      const z = lerp(s.a.z, s.b.z, s.k)
      const mesh = remote.mesh
      const dx = x - mesh.position.x
      const dz = z - mesh.position.z
      const moved = Math.hypot(dx, dz)
      remote.speed = dt > 0 ? Math.min(12, moved / dt) : 0
      if (moved > 0.001) remote.moveDir = { x: dx / moved, z: dz / moved }
      mesh.position.set(x, lerp(s.a.y, s.b.y, s.k), z)
      mesh.rotation.y = lerpAngle(s.a.f, s.b.f, s.k)
      remote.proxy.position.x = x
      remote.proxy.position.z = z
      stepRemotePets(remote, s, dt, now)
      const shown = !remote.proxy.hidden && !remote.proxy.down
      mesh.visible = shown
      if (shown) {
        updateJelly(mesh, dt, now, { speed: 0, moveDir: remote.moveDir, still: Boolean(remote.lookKey) && !remote.lookKey.startsWith('guest:') }) // a hero in gear stays still inside it
        updateFace3D(mesh, dt, now)
      }
    }
  }

  // ---------- a friend's pets (cosmetic: their own game does the fighting) ----------
  function buildPetModel(key) {
    try {
      if (key.startsWith('d:')) return PETS[key.slice(2)] ? createPetModel(PETS[key.slice(2)]) : null
      return createPetModel({ model: key })
    } catch {
      return null
    }
  }
  function clearRemotePets(remote) {
    for (const pet of remote.pets) {
      if (pet.mesh) ctx.disposeObject3D(pet.mesh)
      if (pet.beam) ctx.disposeObject3D(pet.beam)
    }
    remote.pets = []
  }
  function stepRemotePets(remote, s, dt, now) {
    const from = s.a.p ?? []
    const to = s.b.p ?? []
    const rows = to.length ? to : from
    // A different line-up (they swapped pets): rebuild.
    if (rows.length !== remote.pets.length || rows.some((row, i) => row.key !== remote.pets[i].key)) {
      clearRemotePets(remote)
      remote.pets = rows.map((row) => {
        const mesh = buildPetModel(row.key)
        if (mesh) ctx.scene.add(mesh)
        return { key: row.key, mesh, beam: null, lastX: row.x, lastZ: row.z }
      })
    }
    const visible = !remote.proxy.down
    rows.forEach((row, i) => {
      const pet = remote.pets[i]
      if (!pet.mesh) return
      const a = from[i]?.key === row.key ? from[i] : row
      const x = lerp(a.x, row.x, s.k)
      const z = lerp(a.z, row.z, s.k)
      const moving = Math.hypot(x - pet.lastX, z - pet.lastZ) > 0.3 * Math.max(dt, 1e-3)
      pet.lastX = x
      pet.lastZ = z
      pet.mesh.visible = visible
      pet.mesh.position.set(x, lerp(a.y, row.y, s.k), z)
      pet.mesh.rotation.y = lerpAngle(a.rotY, row.rotY, s.k)
      const beaming = visible && Boolean(row.beamTo)
      pet.mesh.userData.beaming = beaming
      try { pet.mesh.userData.animate?.(now, moving) } catch { /* a model that needs more than (t, moving) */ }
      if (beaming) {
        if (!pet.beam) {
          pet.beam = createBeamMesh(PETS.dylan?.color ?? 0xffcf3a)
          ctx.scene.add(pet.beam)
        }
        aimBeam(pet.beam, pet.mesh, { x: row.beamTo.x, y: 0.8, z: row.beamTo.z }, now)
      } else if (pet.beam) {
        pet.beam.visible = false
      }
    })
  }

  // ---------- host: which player a monster goes after ----------
  function targetFor(mesh, localPlayer, localDown) {
    if (!isHost() || !remotes.size) return localPlayer
    const players = [
      { key: 'host', x: localPlayer.position.x, z: localPlayer.position.z, alive: !localDown && localPlayer.hp > 0 },
      ...[...remotes.values()].map((r) => ({ key: r.id, x: r.proxy.position.x, z: r.proxy.position.z, alive: !r.proxy.down && r.snaps.length > 0 })),
    ]
    const key = pickTarget(mesh.position, players, mesh.userData.netTarget ?? null)
    mesh.userData.netTarget = key
    if (!key || key === 'host') return localPlayer
    return remotes.get(key)?.proxy ?? localPlayer
  }

  // Host: splits a monster's events. Returns the ones the host's own game should apply.
  function routeMonsterEvents(mesh, target, events) {
    if (!isHost() || !events.length) return events
    const { host, broadcast, targeted } = routeEvents(events, Boolean(target?.remote))
    if (broadcast.length) link.broadcast({ t: 'ev', id: mesh.userData.netId, e: plainCopy(broadcast) })
    if (targeted.length) link.sendTo(target.key, { t: 'ev', id: mesh.userData.netId, e: plainCopy(targeted) })
    return host
  }

  function registerMonster(mesh) {
    mesh.userData.netId = nextNetId++
    mesh.userData.netKiller = null
  }

  // Host: a kill whose last hit came from a joined player is theirs. Returns true if it was sent to them.
  function creditKill(mesh, cause) {
    const by = mesh.userData.netKiller
    if (!isHost() || !by || !remotes.has(by)) return false
    const ud = mesh.userData
    link.sendTo(by, { t: 'kill', type: ud.type, c: cause, a: Boolean(ud.lastHitAmbush), dz: Boolean(ud.lastHitDazed), b: Boolean(ud.isBoss), x: mesh.position.x, z: mesh.position.z, st: ud.stolen ?? 0 })
    return true
  }

  function sendMonsters(game, now) {
    const rows = []
    for (const mesh of game.monsters) {
      if (mesh.userData.netId == null) continue
      rows.push(packMonster(mesh.userData, mesh.position, mesh.rotation.y, now))
    }
    const w = game.waveState
    link.broadcast({ t: 'mon', m: rows, w: [w.waveNumber, w.phase, Math.round(w.phaseElapsed * 100) / 100, w.spawnedCount, game.levelIndex ?? 0, game.levelTransition ? 1 : 0] })
  }

  // ---------- joiner: puppets ----------
  function createPuppet(game, row) {
    const stats = MONSTER_TYPES[row.type]
    if (!stats) return null
    const mesh = createMonsterMesh(row.type)
    Object.assign(mesh.userData, createMonsterAIState(stats))
    const ud = mesh.userData
    ud.netPuppet = true
    ud.netId = row.id
    ud.type = row.type
    ud.hp = row.hp
    ud.maxHp = row.maxHp
    ud.isBoss = stats.boss === true
    ud.reachBonus = stats.reachBonus ?? 0
    ud.deep = stats.deep === true
    ud.amphibious = stats.amphibious ?? null
    ud.submerged = row.submerged
    ud.reflectCfg = stats.reflect ?? null
    ud.reflect = row.reflect ? ud.reflectCfg : null
    ud.shield = null
    ud.knockbackScale = stats.knockbackScale ?? 1
    ud.radius = stats.radius
    ud.falling = false
    ud.fallState = { velocityY: 0, fallenY: 0 }
    ud.snaps = []
    ud.spawning = row.spawning
    mesh.position.set(row.x, row.y, row.z)
    mesh.rotation.y = row.rotY
    ctx.scene.add(mesh)
    game.monsters.push(mesh)
    if (row.spawning) {
      const effect = createSpawnEffect({ x: row.x, z: row.z }, ud.isBoss ? { scale: 2.2 } : undefined)
      ctx.scene.add(effect.group)
      game.spawnEffects.push({ effect, monster: mesh })
    }
    puppets.set(row.id, mesh)
    return mesh
  }

  function startPuppetDeath(mesh) {
    const ud = mesh.userData
    if (ud.dying) return
    ud.dying = true
    ud.deathPopElapsed = 0
    jellyHit(mesh, JELLY_DEATH_INFLATE_STRENGTH)
    if (ud.isBoss) ctx.onPuppetBossDeath?.(mesh) // our own free chests where it fell
    const stats = MONSTER_TYPES[ud.type]
    shardBurst(ctx.particleSystem, { x: mesh.position.x, y: mesh.position.y + stats.size * 0.5, z: mesh.position.z }, stats.color, DEATH_SHARD_COUNT * (stats.boss ? BOSS_DEATH_SHARD_MULTIPLIER : 1), DEATH_SHARD_SPEED)
  }

  function applyMonsters(m) {
    const game = ctx.getGame()
    if (!Array.isArray(m.m)) return
    const t = clock()
    const seen = new Set()
    for (const raw of m.m) {
      const row = unpackMonster(raw)
      if (!row) continue
      seen.add(row.id)
      let mesh = puppets.get(row.id)
      if (!mesh) {
        if (row.dying || row.falling) continue // a late joiner doesn't need to see the tail end of a death
        mesh = createPuppet(game, row)
        if (!mesh) continue
      }
      const ud = mesh.userData
      pushSnapshot(ud.snaps, { t, x: row.x, z: row.z, y: row.y, r: row.rotY })
      if (row.hp < ud.hp && clock() - (ud.netLocalHitAt ?? -1) > 0.25 && !ud.dying) {
        // Someone else hit it: a little splat so you can see it land.
        jellyHit(mesh, JELLY_HIT_STRENGTH * 0.6)
        ud.hitFlashElapsed = 0
      }
      ud.hp = row.hp
      ud.maxHp = row.maxHp
      ud.immune = row.immune
      ud.dazed = row.dazed
      ud.burrowed = row.burrowed
      ud.netFrozen = row.frozen
      ud.reflect = row.reflect ? ud.reflectCfg : null
      ud.submerged = row.submerged
      if (row.phase2 && !ud.phase2) {
        ud.phase2 = true
        const material = ud.jelly?.body?.material
        if (material?.emissive) {
          material.emissive.setHex(0xff2244)
          material.emissiveIntensity = 0.5
        }
      }
      if (row.dying) startPuppetDeath(mesh)
      if (row.falling && !ud.falling && !ud.dying) {
        ud.falling = true
        ud.fallState = { velocityY: 0, fallenY: 0 }
      }
    }
    // Gone from the host's list without dying on screen (a bandit got away, a lake monster left): remove.
    for (const [id, mesh] of puppets) {
      if (!seen.has(id) && !mesh.userData.dying && !mesh.userData.falling) mesh.userData.netGone = true
    }
    if (Array.isArray(m.w)) ctx.onWaveState({ waveNumber: m.w[0], phase: m.w[1], phaseElapsed: m.w[2], spawnedCount: m.w[3], levelIndex: m.w[4], transitioning: m.w[5] === 1 })
  }

  // Joiner: one frame of a puppet. Returns false once it should leave game.monsters (it has been disposed).
  function stepPuppet(mesh, dt, now, playerPos) {
    const ud = mesh.userData
    const drop = () => {
      puppets.delete(ud.netId)
      ctx.disposeObject3D(mesh)
      return false
    }
    if (ud.netGone) return drop()
    if (ud.dying) {
      updateJelly(mesh, dt, now, { speed: 0, moveDir: ud.moveDir })
      updateFace3D(mesh, dt, now)
      return updateMonsterHitReaction(mesh, dt) ? drop() : true
    }
    if (ud.falling) {
      ud.fallState = stepFall(ud.fallState, dt, FALL_GRAVITY)
      mesh.position.y = -ud.fallState.fallenY
      mesh.rotation.x += dt * MONSTER_FALL_TUMBLE_SPEED
      mesh.rotation.z += dt * MONSTER_FALL_TUMBLE_SPEED * 0.6
      return ud.fallState.fallenY >= FALL_DESPAWN_DEPTH ? drop() : true
    }
    const s = sampleSnapshots(ud.snaps, clock() - (link.viaRelay ? RELAY_INTERP_DELAY : INTERP_DELAY))
    if (s) {
      const x = lerp(s.a.x, s.b.x, s.k)
      const z = lerp(s.a.z, s.b.z, s.k)
      const dx = x - mesh.position.x
      const dz = z - mesh.position.z
      const moved = Math.hypot(dx, dz)
      ud.speed = dt > 0 ? Math.min(14, moved / dt) : 0
      if (moved > 0.001) ud.moveDir = { x: dx / moved, z: dz / moved }
      // In a water room the swim height is OUR view of the water: a deep dweller rises to us when WE dive
      // (the host's copy lurks low while the host floats), so our own shots and swings can reach it.
      const localY = ctx.puppetY?.(mesh, now)
      mesh.position.set(x, Number.isFinite(localY) ? localY : lerp(s.a.y, s.b.y, s.k), z)
      mesh.rotation.y = lerpAngle(s.a.r, s.b.r, s.k)
    }
    updateJelly(mesh, dt, now, { speed: ud.spawning ? 0 : ud.speed, moveDir: ud.moveDir ?? { x: 0, z: 1 } })
    updateFace3D(mesh, dt, now)
    if (ud.spawning) return true
    animateAlive(mesh, playerPos, dt, now)
    updateMonsterHitReaction(mesh, dt)
    ud.animateAcc?.(now)
    forwardStatuses(mesh, now)
    return true
  }

  // Freezes, slows and Warp-Field confusion our abilities put on a puppet go to the host's real monster.
  function forwardStatuses(mesh, now) {
    const ud = mesh.userData
    const msg = { t: 'status', hostOnly: true, id: ud.netId }
    let any = false
    if ((ud.frozenUntil ?? -Infinity) > (ud.netSentFrozen ?? -Infinity)) {
      ud.netSentFrozen = ud.frozenUntil
      msg.fr = Math.min(30, ud.frozenUntil - now)
      any = true
    }
    if ((ud.slowUntil ?? -Infinity) > (ud.netSentSlow ?? -Infinity)) {
      ud.netSentSlow = ud.slowUntil
      msg.sl = [Math.min(30, ud.slowUntil - now), ud.slowFactor ?? 1]
      any = true
    }
    if ((ud.confusedUntil ?? -Infinity) > (ud.netSentConfused ?? -Infinity)) {
      ud.netSentConfused = ud.confusedUntil
      msg.cf = Math.min(30, ud.confusedUntil - now)
      any = true
    }
    if (any) link.sendTo('host', msg)
  }

  function clearPuppets() {
    const game = ctx.getGame()
    for (const mesh of puppets.values()) {
      ctx.disposeObject3D(mesh)
      if (game) {
        const i = game.monsters.indexOf(mesh)
        if (i >= 0) game.monsters.splice(i, 1)
        game.spawnEffects = game.spawnEffects.filter((pair) => {
          if (pair.monster !== mesh) return true
          ctx.disposeObject3D(pair.effect.group)
          return false
        })
      }
    }
    puppets.clear()
  }

  // A hit on a puppet (from combat.js's damageMonster): the host's game applies it for real.
  setNetHooks({
    puppetHit(monster, damage, { fromPos, knockback, cause, ambush }) {
      monster.userData.netLocalHitAt = clock()
      link.sendTo('host', {
        t: 'hit',
        hostOnly: true,
        id: monster.userData.netId,
        d: Math.round(damage * 100) / 100,
        kb: knockback ?? 0,
        fx: fromPos?.x ?? monster.position.x,
        fz: fromPos?.z ?? monster.position.z,
        c: cause,
        a: Boolean(ambush),
      })
    },
  })

  // ---------- messages ----------
  function receive(m, from) {
    const game = ctx.getGame()
    switch (m.t) {
      case 'welcome':
        if (welcomed) break
        welcomed = true
        hostDifficulty = m.difficulty ?? null
        for (const p of m.players ?? []) addRemote(p.id, p)
        ctx.onJoined(m)
        ctx.toast(`JOINED ${link.code}! FIGHT TOGETHER`)
        refresh()
        break
      case 'nope':
        setStatus(`The host can't take players right now: ${m.why}`)
        link.leave()
        break
      case 'join':
        addRemote(m.id, m)
        ctx.toast(`${cleanName(m.name).toUpperCase()} JOINED!`)
        break
      case 'st': {
        const remote = remotes.get(from) ?? (from !== link.myId ? addRemote(from, { name: m.n }) : null)
        if (remote) applyRemoteState(remote, m)
        break
      }
      case 'mon':
        if (isClient()) applyMonsters(m)
        break
      case 'ev': {
        if (!isClient() || !Array.isArray(m.e)) break
        const mesh = puppets.get(m.id) ?? null
        if (mesh) ctx.onEvents(mesh, m.e)
        break
      }
      case 'sh':
        if (from !== link.myId && remotes.has(from)) ctx.onRemoteShots?.(unpackShots(m.b))
        break
      case 'ab': {
        const remote = remotes.get(from)
        if (remote && typeof m.id === 'string' && !remote.proxy.down) ctx.onRemoteAbility?.(m.id.slice(0, 24), { x: remote.mesh.position.x, z: remote.mesh.position.z })
        break
      }
      case 'hurt':
        if (isClient()) ctx.onHurt(clampDamage(m.d), Math.max(0, Math.min(1, Number(m.tf) || 0)))
        break
      case 'kill':
        ctx.onKill(m)
        break
      case 'wave':
        if (isClient()) ctx.onWaveEvents(m)
        break
      case 'restart':
        if (isClient()) {
          clearPuppets()
          ctx.onRestart()
        }
        break
      case 'over':
        if (isClient()) ctx.onGameOver()
        break
      // ---- joiner -> host ----
      case 'hit': {
        if (!isHost() || !remotes.has(from)) break
        const mesh = game.monsters.find((mm) => mm.userData.netId === m.id)
        if (!mesh || mesh.userData.dying || mesh.userData.falling || mesh.userData.spawning) break
        ctx.applyRemoteHit(mesh, {
          damage: clampDamage(m.d),
          knockback: Math.max(0, Math.min(40, Number(m.kb) || 0)),
          fromPos: { x: Number(m.fx) || 0, z: Number(m.fz) || 0 },
          cause: typeof m.c === 'string' ? m.c.slice(0, 20) : 'sword',
          ambush: Boolean(m.a),
          by: from,
          diving: remotes.get(from).proxy.diving,
        })
        break
      }
      case 'status': {
        if (!isHost()) break
        const mesh = game.monsters.find((mm) => mm.userData.netId === m.id)
        if (mesh) ctx.applyRemoteStatus(mesh, m)
        break
      }
      case 'leave':
        if (isHost()) link._dropPeer(from)
        break
      default:
        break
    }
  }

  // ---------- every frame ----------
  function frame(dt, now, local) {
    link.tick()
    if (!link.active) return
    stepRemotes(dt)
    sendT -= dt
    if (sendT <= 0 && link.connected && (isHost() || welcomed)) {
      sendT = 1 / (link.viaRelay ? RELAY_STATE_HZ : STATE_HZ)
      const p = local.player
      if (local.swingStarted) lastSwingSeq++
      link.broadcast({
        t: 'st',
        n: link.name,
        x: Math.round(p.position.x * 100) / 100,
        z: Math.round(p.position.z * 100) / 100,
        y: Math.round(p.mesh.position.y * 100) / 100,
        f: Math.round(p.facing * 100) / 100,
        hp: Math.round(p.hp),
        mhp: p.maxHp,
        hid: p.hidden || local.down || Boolean(local.cutscene), // watching a boss intro: monsters leave us be
        dn: local.down,
        dv: Boolean(p.diving),
        ss: p.sightScale ?? 1,
        gh: now < (p.ghostUntil ?? -Infinity),
        w: local.weapon,
        hero: local.look.hero,
        skin: local.look.skin,
        sw: lastSwingSeq,
        pt: packPets(local.pets ?? []),
      })
    } else if (local.swingStarted) lastSwingSeq++
    if (isHost() && remotes.size) {
      monsterT -= dt
      if (monsterT <= 0) {
        monsterT = 1 / (link.viaRelay ? RELAY_MONSTER_HZ : MONSTER_HZ)
        sendMonsters(ctx.getGame(), now)
      }
    }
  }

  // ---------- panel (P) ----------
  const panel = document.createElement('div')
  panel.id = 'coop-panel'
  panel.innerHTML = `
    <div class="coop-card panel">
      <h2>Co-op</h2>
      <p class="coop-blurb">Fight the waves with up to ${MAX_PLAYERS - 1} friends, anywhere. One hosts, the others join with the room code.</p>
      <label class="coop-field">Your name <input id="coop-name" type="text" maxlength="16" placeholder="Player" autocomplete="off" enterkeyhint="done"></label>
      <div class="coop-row"><button id="coop-host" type="button">Host a game</button></div>
      <div class="coop-row"><input id="coop-code" type="text" maxlength="4" placeholder="CODE" autocomplete="off" autocapitalize="characters" autocorrect="off" spellcheck="false" enterkeyhint="go"><button id="coop-join" type="button">Join</button></div>
      <div id="coop-code-big"></div>
      <div id="coop-status">Not connected.</div>
      <div id="coop-players"></div>
      <div class="coop-row"><button id="coop-leave" type="button">Leave</button><button id="coop-close" type="button">Close <kbd>P</kbd></button></div>
    </div>`
  document.body.appendChild(panel)
  const $ = (id) => panel.querySelector(`#${id}`)
  const ui = { name: $('coop-name'), code: $('coop-code'), host: $('coop-host'), join: $('coop-join'), leave: $('coop-leave'), status: $('coop-status'), players: $('coop-players'), big: $('coop-code-big') }
  ui.name.value = name
  const saveName = () => {
    name = cleanName(ui.name.value, '')
    try { localStorage.setItem(NAME_KEY, name) } catch { /* ignore */ }
  }
  ui.name.addEventListener('change', saveName)
  ui.code.addEventListener('input', () => { ui.code.value = normalizeCode(ui.code.value) })
  ui.code.addEventListener('keydown', (e) => { if (e.key === 'Enter') doJoin() })
  ui.host.addEventListener('click', () => doHost())
  ui.join.addEventListener('click', () => doJoin())
  ui.leave.addEventListener('click', () => link.leave())
  $('coop-close').addEventListener('click', () => toggle(false))
  // Typing in the panel never reaches the game (WASD, hotkeys) and clicks never swing a weapon.
  for (const type of ['keydown', 'keyup', 'mousedown', 'pointerdown', 'click']) {
    panel.addEventListener(type, (e) => {
      if (type === 'keydown' && e.code === 'Escape') toggle(false)
      if (type === 'keydown' && e.code === 'KeyP' && e.target.tagName !== 'INPUT') toggle(false)
      e.stopPropagation()
    })
  }

  function doHost() {
    saveName()
    const reason = ctx.canCoop()
    if (reason) { setStatus(reason); return }
    link.host(name || 'Host')
    refresh()
  }
  function doJoin() {
    saveName()
    const reason = ctx.canCoop()
    if (reason) { setStatus(reason); return }
    link.join(normalizeCode(ui.code.value), name || 'Friend')
    refresh()
  }
  function setStatus(text) { ui.status.textContent = text }
  function refresh() {
    const on = link.active
    ui.host.disabled = on
    ui.join.disabled = on
    ui.code.disabled = on
    ui.leave.style.display = on ? '' : 'none'
    ui.big.textContent = on && link.isHost && link.code ? link.code : ''
    const names = [`${link.name || name || 'You'} (you${link.isHost ? ', host' : ''})`, ...[...remotes.values()].map((r) => r.name)]
    ui.players.textContent = on ? `Players: ${names.join(', ')}` : ''
    document.body.classList.toggle('coop-on', active())
  }
  function toggle(show = !panel.classList.contains('open')) {
    panel.classList.toggle('open', show)
    if (show) {
      document.exitPointerLock?.()
      refresh()
      if (!link.active) setTimeout(() => (name ? ui.code : ui.name).focus(), 0)
    }
  }
  refresh()

  // ---------- host -> everyone ----------
  return {
    get active() { return active() },
    get isHost() { return isHost() },
    get isClient() { return isClient() },
    get connecting() { return link.active && !active() },
    get difficulty() { return isClient() ? hostDifficulty : null },
    isOpen: () => panel.classList.contains('open'),
    toggle,
    frame,
    targetFor,
    routeMonsterEvents,
    registerMonster,
    creditKill,
    stepPuppet,
    clearPuppets,
    remoteCount: () => remotes.size,
    remoteDowns: () => [...remotes.values()].map((r) => r.proxy.down),
    everyoneDown: (localDown) => isHost() && everyoneDown(localDown, [...remotes.values()].map((r) => r.proxy.down)),
    sendShots(bullets) { if (active() && bullets.length) link.broadcast({ t: 'sh', b: packShots(bullets) }) },
    sendAbility(id) { if (active()) link.broadcast({ t: 'ab', id }) },
    sendWaveEvents(msg) { if (isHost()) link.broadcast({ t: 'wave', ...msg }) },
    sendRestart() { if (isHost()) link.broadcast({ t: 'restart' }) },
    sendGameOver() { if (isHost()) link.broadcast({ t: 'over' }) },
    leave: () => link.leave(),
    respawnSeconds: COOP_RESPAWN_SECONDS,
  }
}
