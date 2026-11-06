// The screen warp: a post-processing pass that bends the rendered frame
// around world-space zones. A 'swirl' twists and pinches a disc of the screen
// (the Warp Field, Gravity Well); a 'ripple' sends a refracting ring outward
// (Shockwave, slams, heavy weapons). Up to MAX_ZONES run at once.
import * as THREE from 'three'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import { rippleState, swirlStrength } from './logic/warp.js'

const MAX_ZONES = 4

const WarpShader = {
  uniforms: {
    tDiffuse: { value: null },
    uZones: { value: Array.from({ length: MAX_ZONES }, () => new THREE.Vector4()) },
    uKinds: { value: new Array(MAX_ZONES).fill(0) },
    uTime: { value: 0 },
    uAspect: { value: 1 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform vec4 uZones[${MAX_ZONES}];
    uniform float uKinds[${MAX_ZONES}];
    uniform float uTime;
    uniform float uAspect;
    varying vec2 vUv;
    void main() {
      vec2 offset = vec2(0.0);
      float aberr = 0.0;
      for (int i = 0; i < ${MAX_ZONES}; i++) {
        float kind = uKinds[i];
        if (kind < 0.5) continue;
        vec2 c = uZones[i].xy;
        float R = uZones[i].z;
        float s = uZones[i].w;
        vec2 d = vUv - c;
        d.x *= uAspect;
        float r = length(d);
        if (kind < 1.5) {
          if (r < R) {
            float f = 1.0 - r / R;
            f *= f;
            float ang = s * f * (3.2 + sin(uTime * 4.0) * 0.6);
            float cs = cos(ang);
            float sn = sin(ang);
            vec2 rd = vec2(d.x * cs - d.y * sn, d.x * sn + d.y * cs) * (1.0 - 0.3 * s * f);
            rd.x /= uAspect;
            offset += (c + rd) - vUv;
            aberr += f * s;
          }
        } else {
          float band = exp(-pow((r - R) / (0.28 * R + 0.004), 2.0));
          vec2 dir = d / max(r, 0.0001);
          dir.x /= uAspect;
          offset -= dir * band * s * 0.05;
          aberr += band * s * 0.5;
        }
      }
      float ab = aberr * 0.012;
      vec4 col = texture2D(tDiffuse, vUv + offset);
      col.r = texture2D(tDiffuse, vUv + offset * (1.0 + aberr * 0.5) + vec2(ab, 0.0)).r;
      col.b = texture2D(tDiffuse, vUv + offset * (1.0 - aberr * 0.5) - vec2(ab, 0.0)).b;
      gl_FragColor = col;
    }`,
}

const projected = new THREE.Vector3()
const right = new THREE.Vector3()

// Returns { pass, add(kind, x, z, radius, life), update(dt, time), reset() }.
// `pass` goes into the composer before the OutputPass. It disables itself
// while no zone is live, so it costs nothing at rest.
export function createWarp(camera) {
  const pass = new ShaderPass(WarpShader)
  pass.enabled = false
  const zones = []

  return {
    pass,
    // kind: 'swirl' | 'ripple'; (x, z) world ground point; radius in world units.
    add(kind, x, z, radius, life) {
      if (zones.length >= MAX_ZONES) zones.shift()
      const zone = { kind, x, z, radius, life, age: 0 }
      zones.push(zone)
      return zone
    },
    update(dt, time) {
      for (let i = zones.length - 1; i >= 0; i--) {
        zones[i].age += dt
        if (zones[i].age >= zones[i].life) zones.splice(i, 1)
      }
      pass.enabled = zones.length > 0
      if (!pass.enabled) return
      const { uZones, uKinds } = pass.uniforms
      const aspect = camera.aspect
      uZones.value.forEach((v) => v.set(0, 0, 0, 0))
      uKinds.value.fill(0)
      camera.updateMatrixWorld()
      right.setFromMatrixColumn(camera.matrixWorld, 0)
      zones.forEach((zone, i) => {
        projected.set(zone.x, 0.4, zone.z).project(camera)
        const cx = projected.x * 0.5 + 0.5
        const cy = projected.y * 0.5 + 0.5
        const edgeProjected = new THREE.Vector3(zone.x, 0.4, zone.z).addScaledVector(right, zone.radius).project(camera)
        if (projected.z > 1) return // behind the camera (first person dive): the projection is garbage
        const screenRadius = Math.hypot((edgeProjected.x - projected.x) * 0.5 * aspect, (edgeProjected.y - projected.y) * 0.5)
        let radius = screenRadius
        let strength
        if (zone.kind === 'ripple') {
          const state = rippleState(zone.age, zone.life)
          radius = screenRadius * Math.max(0.02, state.radiusFraction)
          strength = state.strength
        } else {
          strength = swirlStrength(zone.age, zone.life)
        }
        if (![cx, cy, radius, strength].every(Number.isFinite)) return // a NaN here would bloom to white
        uZones.value[i].set(cx, cy, radius, strength)
        uKinds.value[i] = zone.kind === 'ripple' ? 2 : 1
      })
      pass.uniforms.uTime.value = time
      pass.uniforms.uAspect.value = aspect
    },
    reset() {
      zones.length = 0
      pass.enabled = false
    },
  }
}
