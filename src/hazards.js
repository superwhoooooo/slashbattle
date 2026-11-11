// Poison from a bloater: a glob arcs through the air toward where it
// predicted you'd be (a faint ring marks the landing spot), splashes, then
// settles into a bubbling puddle of toxic liquid that hurts anyone standing in
// it. The rules are pure (src/logic/enemies.js); this owns the pooled meshes.
import * as THREE from 'three'
import { PLAYER_RADIUS } from './config.js'
import { createPoison, stepPoison } from './logic/enemies.js'

const POOL_SIZE = 10
const POISON_COLOR = 0x8fe02e
const ARC_HEIGHT = 4.5
const BUBBLES = 6
const DROPLETS = 8
const SPLASH_TIME = 0.7

// The puddle's surface: dark murky green in the middle, a bright wobbly rim (the liquid's
// meniscus), drifting swirls, little bubbles that swell and pop, and a wet highlight.
const PUDDLE_VERTEX = `
  varying vec2 vP;
  void main() {
    vP = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const PUDDLE_FRAGMENT = `
  uniform float uTime;
  uniform float uFade;
  uniform float uSeed;
  varying vec2 vP;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7)) + uSeed) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
  }

  // One layer of bubbles: each grid cell grows a bubble, then pops it.
  vec3 bubbles(vec2 p, float scale, float speed) {
    vec2 g = p * scale;
    vec2 id = floor(g);
    vec2 f = fract(g) - 0.5;
    float h = hash(id);
    float t = fract(uTime * speed + h);
    float radius = 0.05 + 0.3 * t * (0.5 + 0.5 * h);
    vec2 c = (vec2(hash(id + 3.1), hash(id + 7.7)) - 0.5) * 0.4;
    float d = length(f - c);
    float alive = step(h, 0.55) * (1.0 - smoothstep(0.85, 1.0, t));
    float rim = (smoothstep(radius - 0.05, radius, d) - smoothstep(radius, radius + 0.03, d)) * alive;
    float fill = (1.0 - smoothstep(radius - 0.02, radius, d)) * alive * 0.18;
    float shine = (1.0 - smoothstep(0.0, radius * 0.35, length(f - c - vec2(-radius, radius) * 0.45))) * alive;
    return vec3(rim, fill, shine);
  }

  void main() {
    float r = length(vP);
    float a = atan(vP.y, vP.x);
    float edge = 0.88 + 0.06 * sin(a * 5.0 + uTime * 1.3 + uSeed) + 0.035 * sin(a * 9.0 - uTime * 1.9) + 0.02 * sin(a * 14.0 + uTime * 2.7);
    float inside = 1.0 - smoothstep(edge - 0.03, edge, r);
    if (inside <= 0.0) discard;

    float depth = clamp(r / edge, 0.0, 1.0);
    // Slow swirling currents.
    float swirl = noise(vP * 3.0 + vec2(uTime * 0.35, -uTime * 0.25)) * 0.6 + noise(vP * 6.0 - uTime * 0.4) * 0.4;
    vec3 deep = vec3(0.07, 0.26, 0.06);
    vec3 shallow = vec3(0.36, 0.78, 0.12);
    vec3 col = mix(deep, shallow, smoothstep(0.0, 1.0, depth * 0.85 + swirl * 0.45 - 0.15));

    // Meniscus: a glossy lighter band hugging the edge.
    float meniscus = smoothstep(0.72, 0.97, depth) * (1.0 - smoothstep(0.97, 1.0, depth));
    col += vec3(0.28, 0.32, 0.05) * meniscus;

    // Bubbles (two sizes) with bright rims, translucent fill and a glint.
    vec3 b1 = bubbles(vP, 4.0, 0.33);
    vec3 b2 = bubbles(vP + 5.3, 7.0, 0.5);
    col += vec3(0.5, 0.78, 0.2) * (b1.x + b2.x * 0.8) + vec3(0.12, 0.22, 0.04) * (b1.y + b2.y);
    col += vec3(0.6, 0.62, 0.45) * (b1.z + b2.z) * 0.7;

    // Wet highlight sliding across the surface.
    float gloss = 1.0 - smoothstep(0.0, 0.35, length(vP - vec2(-0.3, 0.38) + vec2(sin(uTime * 0.6), cos(uTime * 0.5)) * 0.04));
    col += vec3(0.4, 0.45, 0.32) * gloss * 0.55;

    gl_FragColor = vec4(min(col, vec3(0.92)), (0.86 - 0.12 * (1.0 - depth)) * inside * uFade);
  }
`

// The Plague Doctor's Contagion puddle (style 'plague'): not the bloater's green acid but a pool of
// dark violet plague ooze -- smoky churning murk, veins of sickly light (the skin's glow colour)
// crawling through it and pulsing, and a ring of rune dashes slowly turning around the rim.
const PLAGUE_FRAGMENT = `
  uniform float uTime;
  uniform float uFade;
  uniform float uSeed;
  uniform vec3 uGlow;
  varying vec2 vP;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7)) + uSeed) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
  }
  float fbm(vec2 p) { return noise(p) * 0.55 + noise(p * 2.1 + 3.7) * 0.3 + noise(p * 4.3 - 1.3) * 0.15; }

  void main() {
    float r = length(vP);
    float a = atan(vP.y, vP.x);
    float edge = 0.9 + 0.05 * sin(a * 7.0 - uTime * 0.9 + uSeed) + 0.03 * sin(a * 13.0 + uTime * 1.4);
    float inside = 1.0 - smoothstep(edge - 0.06, edge, r);
    float ring = 0.0;
    // Rune ring: short dashes on a circle just outside the ooze, turning slowly.
    float rr = abs(r - 0.97);
    float dash = step(0.45, fract((a + uTime * 0.35) * 18.0 / 6.2832));
    ring = (1.0 - smoothstep(0.012, 0.03, rr)) * dash;
    if (inside <= 0.0 && ring <= 0.0) discard;

    vec2 q = vP * 2.4;
    float smoke = fbm(q + vec2(uTime * 0.25, -uTime * 0.18) + fbm(q * 1.3 - uTime * 0.12));
    vec3 col = mix(vec3(0.05, 0.02, 0.08), vec3(0.22, 0.08, 0.26), smoke);
    // Glowing veins: thin ridges of the noise field, crawling and pulsing.
    float v = abs(fbm(q * 1.6 + vec2(-uTime * 0.3, uTime * 0.22)) - 0.5);
    float vein = 1.0 - smoothstep(0.0, 0.035, v);
    float pulse = 0.6 + 0.4 * sin(uTime * 4.0 + r * 9.0);
    col += uGlow * vein * pulse * 0.9;
    // A sickly glow welling up in the middle.
    col += uGlow * 0.22 * (1.0 - smoothstep(0.0, 0.7, r)) * (0.7 + 0.3 * sin(uTime * 2.5));
    col = mix(col, uGlow * 1.1, ring * (1.0 - inside));
    float alpha = max(inside * (0.82 + 0.1 * vein), ring * 0.85);
    gl_FragColor = vec4(min(col, vec3(1.0)), alpha * uFade);
  }
`

export function createPoisonPool({ style = 'bloater', glow = 0xd2ff5a } = {}) {
  const plague = style === 'plague'
  const glowColor = new THREE.Color(glow)
  const group = new THREE.Group()
  const discGeometry = new THREE.CircleGeometry(1, 48)
  const ringGeometry = new THREE.RingGeometry(0.9, 1, 36)
  const globGeometry = new THREE.IcosahedronGeometry(0.35, 2)
  const bubbleGeometry = new THREE.SphereGeometry(1, 12, 8)
  // A plague puddle's "bubbles" are glowing wisps that rise and fade; its splash is dark ooze.
  const bubbleMaterial = plague
    ? new THREE.MeshBasicMaterial({ color: glowColor, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending })
    : new THREE.MeshStandardMaterial({ color: 0xc8ff7a, roughness: 0.08, metalness: 0, transparent: true, opacity: 0.55, depthWrite: false })
  const dropMaterial = plague
    ? new THREE.MeshStandardMaterial({ color: 0x2a1030, roughness: 0.2, metalness: 0, emissive: 0x14061a })
    : new THREE.MeshStandardMaterial({ color: POISON_COLOR, roughness: 0.15, metalness: 0, emissive: 0x1a4a08 })
  const slots = []
  for (let i = 0; i < POOL_SIZE; i++) {
    const disc = new THREE.Mesh(
      discGeometry,
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uFade: { value: 1 }, uSeed: { value: Math.random() * 100 }, uGlow: { value: glowColor } },
        vertexShader: PUDDLE_VERTEX,
        fragmentShader: plague ? PLAGUE_FRAGMENT : PUDDLE_FRAGMENT,
        transparent: true,
        depthWrite: false,
      }),
    )
    const ring = new THREE.Mesh(ringGeometry, new THREE.MeshBasicMaterial({ color: plague ? glowColor : POISON_COLOR, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false }))
    const glob = new THREE.Mesh(globGeometry, new THREE.MeshStandardMaterial({ color: POISON_COLOR, emissive: 0x2c6a0c, roughness: 0.12, metalness: 0 }))
    disc.rotation.x = ring.rotation.x = -Math.PI / 2
    disc.position.y = 0.05
    ring.position.y = 0.07
    const bubbles = Array.from({ length: BUBBLES }, (_, k) => ({
      mesh: new THREE.Mesh(bubbleGeometry, bubbleMaterial),
      angle: Math.random() * Math.PI * 2,
      dist: 0.15 + Math.random() * 0.6,
      phase: k / BUBBLES + Math.random() * 0.15,
      size: 0.1 + Math.random() * 0.12,
    }))
    const drops = Array.from({ length: DROPLETS }, () => ({ mesh: new THREE.Mesh(globGeometry, dropMaterial), vx: 0, vy: 0, vz: 0 }))
    for (const mesh of [disc, ring, glob, ...bubbles.map((b) => b.mesh), ...drops.map((d) => d.mesh)]) {
      mesh.visible = false
      group.add(mesh)
    }
    slots.push({ disc, ring, glob, bubbles, drops, splash: 0, data: null })
  }
  return { group, slots, plague, glowColor, geometries: [discGeometry, ringGeometry, globGeometry, bubbleGeometry], materials: [bubbleMaterial, dropMaterial] }
}

function hideSlot(slot) {
  slot.data = null
  slot.splash = 0
  slot.disc.visible = slot.ring.visible = slot.glob.visible = false
  for (const b of slot.bubbles) b.mesh.visible = false
  for (const d of slot.drops) d.mesh.visible = false
}

// Lobs a glob from (x, z) that lands at (tx, tz). Skipped when the pool is full.
export function lobPoison(pool, { x, z, tx, tz, flight, radius, life, tick, damage }) {
  const slot = pool.slots.find((s) => !s.data)
  if (!slot) return
  slot.data = createPoison({ sx: x, sz: z, x: tx, z: tz, flight, radius, life, tick, damage })
  slot.ring.position.set(tx, 0.07, tz)
  slot.ring.scale.setScalar(radius)
  slot.ring.visible = true
  slot.disc.visible = false
  slot.glob.visible = true
}

// A burst of droplets thrown up where the glob landed.
function startSplash(slot, p) {
  slot.splash = SPLASH_TIME
  for (const d of slot.drops) {
    const a = Math.random() * Math.PI * 2
    const s = (0.6 + Math.random() * 1.6) * Math.min(1.6, p.radius * 0.6)
    d.vx = Math.cos(a) * s
    d.vz = Math.sin(a) * s
    d.vy = 3 + Math.random() * 3
    d.mesh.position.set(p.x, 0.15, p.z)
    d.mesh.scale.setScalar(0.25 + Math.random() * 0.3)
    d.mesh.visible = true
  }
}

// Advances every glob / puddle; returns true when one hurt the player this
// frame (so the caller can shake the screen).
export function updatePoison(pool, dt, player, now) {
  let hurt = false
  for (const slot of pool.slots) {
    const p = slot.data
    if (!p) continue
    const before = p.phase
    const { alive, hit } = stepPoison(p, dt, player, PLAYER_RADIUS)
    if (!alive) {
      hideSlot(slot)
      continue
    }
    if (p.phase === 'flying') {
      const t = Math.min(1, p.elapsed / p.flight)
      slot.glob.position.set(p.sx + (p.x - p.sx) * t, 0.6 + Math.sin(t * Math.PI) * ARC_HEIGHT, p.sz + (p.z - p.sz) * t)
      // The glob wobbles and stretches along its flight like a blob of liquid.
      const wob = Math.sin(p.elapsed * 22)
      slot.glob.scale.set(1 + 0.12 * wob, 1 - 0.14 * wob + 0.12 * Math.cos(t * Math.PI), 1 + 0.12 * wob)
      slot.ring.material.opacity = 0.35 + 0.5 * t
    } else {
      if (before === 'flying') {
        slot.glob.visible = false
        slot.disc.position.set(p.x, 0.05, p.z)
        slot.disc.visible = true
        slot.ring.material.opacity = 0.9
        startSplash(slot, p)
      }
      const fade = Math.min(1, (p.life - p.elapsed) / 1.2)
      const spread = Math.min(1, p.elapsed / 0.25) // the puddle spreads out from the splash
      slot.disc.scale.setScalar(p.radius * (0.4 + 0.6 * (1 - Math.pow(1 - spread, 3))))
      slot.disc.material.uniforms.uTime.value = p.elapsed
      slot.disc.material.uniforms.uFade.value = fade
      slot.ring.material.opacity = 0.35 * fade

      // Rising, popping 3D bubbles on top of the shader's flat ones.
      for (const b of slot.bubbles) {
        const t = (p.elapsed * 0.6 + b.phase) % 1
        const grow = t < 0.88 ? Math.sin((t / 0.88) * Math.PI * 0.5) : 0
        const s = b.size * grow * Math.min(1.4, p.radius * 0.5) * fade * spread
        b.mesh.visible = s > 0.005
        if (pool.plague) {
          // Wisps: thin glowing puffs that float up out of the ooze, stretch and thin out.
          const w = b.size * 1.3 * Math.min(1.4, p.radius * 0.5) * fade * spread * (1 - t)
          b.mesh.visible = w > 0.005
          b.mesh.position.set(p.x + Math.cos(b.angle) * b.dist * p.radius * 0.8, 0.1 + t * 1.6, p.z + Math.sin(b.angle) * b.dist * p.radius * 0.8)
          b.mesh.scale.set(w * 0.7, w * 2.2, w * 0.7)
        } else {
          b.mesh.position.set(p.x + Math.cos(b.angle) * b.dist * p.radius * 0.85, 0.06 + s * 0.4, p.z + Math.sin(b.angle) * b.dist * p.radius * 0.85)
          b.mesh.scale.set(s, s * 0.75, s)
        }
        if (t > 0.97) { // re-roll where the next one rises
          b.angle = Math.random() * Math.PI * 2
          b.dist = 0.15 + Math.random() * 0.6
        }
      }
    }

    if (slot.splash > 0) {
      slot.splash -= dt
      for (const d of slot.drops) {
        d.vy -= 18 * dt
        d.mesh.position.x += d.vx * dt
        d.mesh.position.y += d.vy * dt
        d.mesh.position.z += d.vz * dt
        if (d.mesh.position.y < 0.05 || slot.splash <= 0) d.mesh.visible = false
      }
    }
    if (hit && !player.diving && player.damagePlayer(p.damage, now)) hurt = true // poison sits on the surface
  }
  return hurt
}

// Retints a plague pool's veins, rim and wisps (the Plague Doctor's skin glow).
export function setPoisonGlow(pool, color) {
  if (!pool.glowColor || pool.glowColor.getHex() === color) return
  pool.glowColor.set(color) // shared by every disc's uGlow uniform
  for (const slot of pool.slots) slot.ring.material.color.set(color)
  pool.materials[0].color?.set(color)
}

export function resetPoison(pool) {
  for (const slot of pool.slots) hideSlot(slot)
}
