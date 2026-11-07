// ?perf=1 overlay: FPS, frame-time stats, draw calls, GPU resource counts, JS heap and per-section
// timings. createPerfOverlay() returns null when the flag is off, so callers pay nothing (they guard
// every call with `perf?.`).
import { frameStats } from './logic/perf.js'

const SECTIONS = ['total', 'render', 'hud']

export function perfRequested() {
  try {
    return new URLSearchParams(location.search).get('perf') === '1'
  } catch {
    return false
  }
}

export function createPerfOverlay(renderer, getPixelRatio, getFpsCap = () => 0) {
  if (!perfRequested()) return null
  const el = document.createElement('pre')
  el.style.cssText =
    'position:fixed;left:6px;bottom:6px;z-index:99999;margin:0;padding:6px 8px;background:rgba(0,0,0,.72);color:#9f9;font:11px/1.35 ui-monospace,Menlo,monospace;pointer-events:none;border-radius:4px;white-space:pre'
  document.body.appendChild(el)

  // Which GPU Chrome is actually using -- "SwiftShader" or "llvmpipe" means software rendering.
  let gpu = 'unknown'
  try {
    const gl = renderer.getContext()
    const ext = gl.getExtension('WEBGL_debug_renderer_info')
    gpu = String(gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER))
  } catch {}
  console.info('[perf] GPU:', gpu)

  let frameTimes = []
  let lastFrameAt = null
  let lastShown = 0
  let windowStart = 0
  let framesInWindow = 0
  let fps = 0
  const sectionSums = Object.fromEntries(SECTIONS.map((s) => [s, 0]))
  const marks = {}
  let sectionFrames = 0

  return {
    // Call once per rendered frame with the rAF timestamp.
    frame(now) {
      if (lastFrameAt !== null) {
        frameTimes.push(now - lastFrameAt)
        if (frameTimes.length > 240) frameTimes.shift()
      }
      lastFrameAt = now
      framesInWindow++
      sectionFrames++
      if (now - windowStart >= 500) {
        fps = (framesInWindow * 1000) / (now - windowStart || 1)
        windowStart = now
        framesInWindow = 0
      }
      if (now - lastShown < 500) return
      lastShown = now
      const s = frameStats(frameTimes)
      const info = renderer.info
      const per = (k) => sectionSums[k] / (sectionFrames || 1)
      const sec = `update ${Math.max(0, per('total') - per('render') - per('hud')).toFixed(2)}  render ${per('render').toFixed(2)}  hud ${per('hud').toFixed(2)}`
      for (const k of SECTIONS) sectionSums[k] = 0
      sectionFrames = 0
      const heap = performance.memory ? `${(performance.memory.usedJSHeapSize / 1048576).toFixed(0)} MB` : 'n/a'
      el.textContent =
        `FPS ${fps.toFixed(0)} (cap ${getFpsCap() || 'off'})  PR ${getPixelRatio().toFixed(2)}\n` +
        `frame ms avg ${s.avg.toFixed(1)} p95 ${s.p95.toFixed(1)} max ${s.max.toFixed(1)}\n` +
        `calls ${info.render.calls}  tris ${info.render.triangles}\n` +
        `geoms ${info.memory.geometries}  tex ${info.memory.textures}\n` +
        `JS heap ${heap}\n` +
        `ms/frame ${sec}\n` +
        `GPU ${gpu.length > 60 ? gpu.slice(0, 60) + '…' : gpu}`
    },
    // Section timing: begin('render') ... end('render'). 'total' is the whole game frame; update = total - render - hud. Averaged per display interval.
    begin(name) {
      marks[name] = performance.now()
    },
    end(name) {
      sectionSums[name] += performance.now() - marks[name]
    },
  }
}
