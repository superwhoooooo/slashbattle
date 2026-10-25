import * as THREE from 'three'
import {
  DEATH_SHARD_COUNT,
  PARTICLE_BASE_SIZE,
  PARTICLE_DRAG,
  PARTICLE_GRAVITY,
  PARTICLE_LIFE_MAX,
  PARTICLE_LIFE_MIN,
  PARTICLE_POOL_SIZE,
  SHARD_BASE_SIZE,
  SHARD_DRAG,
  SHARD_GRAVITY,
  SHARD_LIFE_MAX,
  SHARD_LIFE_MIN,
  SHARD_POOL_SIZE,
  SHARD_SPIN_SPEED,
} from './config.js'
import { allocateSlots, isParticleDead, particleAlpha, particleScale, stepParticle } from './logic/particles.js'

// A soft round sprite (radial falloff) for the point pool, so bursts
// read as glowing specks rather than hard squares.
function createSparkTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 32
  canvas.height = 32
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.4, 'rgba(255,255,255,0.8)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 32, 32)
  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

// A custom shader (rather than the stock PointsMaterial) so each point
// can carry its own size and alpha -- PointsMaterial only exposes a
// single size/opacity for the whole pool, which can't fade or shrink
// individual particles independently.
function createPointsMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { map: { value: createSparkTexture() } },
    vertexShader: `
      attribute float size;
      attribute float alpha;
      attribute vec3 particleColor;
      varying float vAlpha;
      varying vec3 vColor;
      void main() {
        vAlpha = alpha;
        vColor = particleColor;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (300.0 / max(-mvPosition.z, 0.001));
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D map;
      varying float vAlpha;
      varying vec3 vColor;
      void main() {
        vec4 tex = texture2D(map, gl_PointCoord);
        gl_FragColor = vec4(vColor, vAlpha) * tex;
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
}

// Builds the spark pool: a fixed-size THREE.Points buffer (position,
// per-point size/alpha/color attributes) plus the parallel JS arrays of
// kinematic state (velocity, age, life) that drive them. Nothing here
// allocates per burst -- bursts just overwrite slots via allocateSlots.
function createSparkPool() {
  const positions = new Float32Array(PARTICLE_POOL_SIZE * 3)
  const sizes = new Float32Array(PARTICLE_POOL_SIZE)
  const alphas = new Float32Array(PARTICLE_POOL_SIZE)
  const particleColors = new Float32Array(PARTICLE_POOL_SIZE * 3)

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
  geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1))
  geometry.setAttribute('particleColor', new THREE.BufferAttribute(particleColors, 3))

  const points = new THREE.Points(geometry, createPointsMaterial())
  points.frustumCulled = false

  const state = []
  for (let i = 0; i < PARTICLE_POOL_SIZE; i++) {
    state.push({ vx: 0, vy: 0, vz: 0, age: Infinity, life: 0, baseSize: 0 })
  }

  return { points, state, cursor: 0 }
}

// Builds the shard pool: a fixed-size InstancedMesh of small tetrahedra
// (for the death burst's tumbling low-poly debris, which plain point
// sprites can't convincingly fake) plus the parallel kinematic state.
function createShardPool() {
  const geometry = new THREE.TetrahedronGeometry(SHARD_BASE_SIZE)
  const material = new THREE.MeshStandardMaterial({ flatShading: true, metalness: 0.2, roughness: 0.5 })
  const mesh = new THREE.InstancedMesh(geometry, material, SHARD_POOL_SIZE)
  mesh.frustumCulled = false
  mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(SHARD_POOL_SIZE * 3), 3)

  const matrix = new THREE.Matrix4()
  const zeroScale = new THREE.Vector3(0, 0, 0)
  const state = []
  for (let i = 0; i < SHARD_POOL_SIZE; i++) {
    matrix.compose(new THREE.Vector3(), new THREE.Quaternion(), zeroScale)
    mesh.setMatrixAt(i, matrix)
    state.push({
      vx: 0, vy: 0, vz: 0, age: Infinity, life: 0,
      rotationAxis: new THREE.Vector3(0, 1, 0), spinSpeed: 0, spin: 0,
    })
  }

  return { mesh, state, cursor: 0 }
}

// Builds the whole pooled particle system: the spark Points pool and the
// shard InstancedMesh pool, grouped so the caller only has to add/update
// one object. Create once per session (not per game run) and reset it on
// restart, the same way the HUD and composer are reused across runs.
export function createParticleSystem() {
  const sparkPool = createSparkPool()
  const shardPool = createShardPool()

  const group = new THREE.Group()
  group.add(sparkPool.points)
  group.add(shardPool.mesh)

  return { group, sparkPool, shardPool }
}

// Spawns `count` spark particles at `position`, tinted `color`, flying
// outward at up to `speed` world units/second. `upwardBias` (0-1) blends
// the random spherical spray toward straight up, for effects like the
// spawn-in swirl.
export function burst(system, position, color, count, speed, upwardBias = 0) {
  const { state, cursor: startCursor } = system.sparkPool
  const { indices, nextCursor } = allocateSlots(startCursor, state.length, count)
  system.sparkPool.cursor = nextCursor
  const tint = new THREE.Color(color)

  for (const index of indices) {
    const particle = state[index]
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(Math.random() * 2 - 1)
    const randomSpeed = speed * (0.5 + Math.random() * 0.5)

    const randomDirY = Math.cos(phi)
    particle.vx = Math.sin(phi) * Math.cos(theta) * randomSpeed * (1 - upwardBias)
    particle.vy = (randomDirY * (1 - upwardBias) + upwardBias) * randomSpeed
    particle.vz = Math.sin(phi) * Math.sin(theta) * randomSpeed * (1 - upwardBias)
    particle.age = 0
    particle.life = PARTICLE_LIFE_MIN + Math.random() * (PARTICLE_LIFE_MAX - PARTICLE_LIFE_MIN)
    particle.baseSize = PARTICLE_BASE_SIZE * (0.7 + Math.random() * 0.6)
    particle.color = tint

    const positionAttr = system.sparkPool.points.geometry.attributes.position
    positionAttr.setXYZ(index, position.x, position.y, position.z)
  }
}

// Spawns `count` tumbling low-poly shard instances at `position`, tinted
// `color`, flying outward at up to `speed` world units/second -- the big
// death burst.
export function shardBurst(system, position, color, count = DEATH_SHARD_COUNT, speed = 1) {
  const { state, cursor: startCursor, mesh } = system.shardPool
  const { indices, nextCursor } = allocateSlots(startCursor, state.length, count)
  system.shardPool.cursor = nextCursor
  const tint = new THREE.Color(color)

  for (const index of indices) {
    const particle = state[index]
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(Math.random() * 2 - 1)
    const randomSpeed = speed * (0.5 + Math.random() * 0.5)

    particle.x = position.x
    particle.y = position.y
    particle.z = position.z
    particle.vx = Math.sin(phi) * Math.cos(theta) * randomSpeed
    particle.vy = Math.abs(Math.cos(phi)) * randomSpeed + randomSpeed * 0.4
    particle.vz = Math.sin(phi) * Math.sin(theta) * randomSpeed
    particle.age = 0
    particle.life = SHARD_LIFE_MIN + Math.random() * (SHARD_LIFE_MAX - SHARD_LIFE_MIN)
    particle.rotationAxis.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize()
    particle.spinSpeed = (Math.random() * 2 - 1) * SHARD_SPIN_SPEED
    particle.spin = 0

    mesh.setColorAt(index, tint)
  }
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
}

const scratchMatrix = new THREE.Matrix4()
const scratchQuaternion = new THREE.Quaternion()
const scratchScale = new THREE.Vector3()
const scratchPosition = new THREE.Vector3()

// Advances every live spark and shard by one tick: gravity, drag,
// fade/shrink (sparks) or fade-via-shrink (shards, since InstancedMesh
// has no per-instance alpha), via the pure stepParticle/particleAlpha/
// particleScale helpers, writing straight into the pools' typed arrays
// (no per-frame allocation in the hot loop).
export function updateParticles(system, dt) {
  const { points, state: sparks } = system.sparkPool
  const position = points.geometry.attributes.position
  const size = points.geometry.attributes.size
  const alpha = points.geometry.attributes.alpha
  const particleColor = points.geometry.attributes.particleColor

  for (let i = 0; i < sparks.length; i++) {
    const particle = sparks[i]
    if (isParticleDead(particle.age, particle.life)) {
      size.setX(i, 0)
      alpha.setX(i, 0)
      continue
    }

    const stepped = stepParticle(
      { x: position.getX(i), y: position.getY(i), z: position.getZ(i), vx: particle.vx, vy: particle.vy, vz: particle.vz, age: particle.age },
      dt,
      PARTICLE_GRAVITY,
      PARTICLE_DRAG,
    )
    particle.vx = stepped.vx
    particle.vy = stepped.vy
    particle.vz = stepped.vz
    particle.age = stepped.age

    position.setXYZ(i, stepped.x, stepped.y, stepped.z)
    size.setX(i, particle.baseSize * particleScale(particle.age, particle.life))
    alpha.setX(i, particleAlpha(particle.age, particle.life))
    if (particle.color) particleColor.setXYZ(i, particle.color.r, particle.color.g, particle.color.b)
  }
  position.needsUpdate = true
  size.needsUpdate = true
  alpha.needsUpdate = true
  particleColor.needsUpdate = true

  const { mesh, state: shards } = system.shardPool
  for (let i = 0; i < shards.length; i++) {
    const particle = shards[i]
    if (isParticleDead(particle.age, particle.life)) {
      mesh.getMatrixAt(i, scratchMatrix)
      scratchMatrix.decompose(scratchPosition, scratchQuaternion, scratchScale)
      if (scratchScale.x !== 0) {
        scratchMatrix.compose(scratchPosition, scratchQuaternion, scratchScale.set(0, 0, 0))
        mesh.setMatrixAt(i, scratchMatrix)
      }
      continue
    }

    const stepped = stepParticle(particle, dt, SHARD_GRAVITY, SHARD_DRAG)
    particle.x = stepped.x
    particle.y = stepped.y
    particle.z = stepped.z
    particle.vx = stepped.vx
    particle.vy = stepped.vy
    particle.vz = stepped.vz
    particle.age = stepped.age
    particle.spin += particle.spinSpeed * dt

    const scale = particleScale(particle.age, particle.life)
    scratchQuaternion.setFromAxisAngle(particle.rotationAxis, particle.spin)
    scratchMatrix.compose(
      scratchPosition.set(particle.x, particle.y, particle.z),
      scratchQuaternion,
      scratchScale.set(scale, scale, scale),
    )
    mesh.setMatrixAt(i, scratchMatrix)
  }
  mesh.instanceMatrix.needsUpdate = true
}

// Instantly kills every live spark and shard (hides them and stops them
// animating) without disposing the pools -- used on restart, since the
// particle system is a per-session singleton like the HUD or composer.
export function resetParticles(system) {
  for (const particle of system.sparkPool.state) {
    particle.age = Infinity
    particle.life = 0
  }
  const sizeAttr = system.sparkPool.points.geometry.attributes.size
  const alphaAttr = system.sparkPool.points.geometry.attributes.alpha
  for (let i = 0; i < sizeAttr.count; i++) {
    sizeAttr.setX(i, 0)
    alphaAttr.setX(i, 0)
  }
  sizeAttr.needsUpdate = true
  alphaAttr.needsUpdate = true

  const zeroScale = new THREE.Vector3(0, 0, 0)
  for (let i = 0; i < system.shardPool.state.length; i++) {
    const particle = system.shardPool.state[i]
    particle.age = Infinity
    particle.life = 0
    scratchMatrix.compose(scratchPosition.set(0, 0, 0), scratchQuaternion.identity(), zeroScale)
    system.shardPool.mesh.setMatrixAt(i, scratchMatrix)
  }
  system.shardPool.mesh.instanceMatrix.needsUpdate = true
}
