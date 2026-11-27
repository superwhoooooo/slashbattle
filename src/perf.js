// ?perf=1 overlay: FPS, frame-time stats, draw calls, GPU resource counts, JS heap and per-section
// timings, plus a hitch log: every frame over HITCH_MS is recorded with where its time went (game update,
// render, HUD, or OUTSIDE our code: GPU stalls, garbage collection, the OS throttling a hot laptop), shown
// on the overlay, logged with console.warn and kept in window.__perfHitches (copy(__perfHitches) in devtools). createPerfOverlay() returns null when the flag is off, so callers pay nothing (they guard
// every call with `perf?.`).
import { frameStats } from './logic/perf.js'

const SECTIONS = ['total', 'render', 'hud']
const HITCH_MS = 50
const HITCH_KEEP = 40

export function perfRequested() {
  try {
    return new URLSearchParams(location.search).get('perf') === '1'
  } catch {
    return false
  }
}

export function createPerfOverlay(renderer, getPixelRatio, getFpsCap = () => 0, getContext = () => '') {
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
  const cur = Object.fromEntries(SECTIONS.map((s) => [s, 0])) // this frame's section times
  const hitches = []
  let hitchTotal = 0
  const startedAt = performance.now()
  if (typeof window !== 'undefined') window.__perfHitches = hitches
  const blame = (h) => {
    const parts = { 'game update (JS)': h.update, 'render (CPU side)': h.render, 'HUD (DOM)': h.hud, 'outside the game (GPU / GC / throttling)': h.outside }
    return Object.entries(parts).sort((a, b) => b[1] - a[1])[0][0]
  }

  function hitchLine(now) {
    const recent = hitches.filter((h) => (now - startedAt) / 1000 - h.at < 60).length
    const last = hitches[hitches.length - 1]
    if (!last) return 'hitches none yet\n'
    const ago = Math.round((now - startedAt) / 1000 - last.at)
    return `hitches ${recent} in last min (${hitchTotal} total)\nlast ${last.ms} ms ${ago}s ago: ${last.blame}\n  update ${last.update} render ${last.render} hud ${last.hud} outside ${last.outside}\n  ${last.ctx}\n`
  }

  return {
    // Call once per rendered frame with the rAF timestamp.
    frame(now) {
      if (lastFrameAt !== null) {
        const delta = now - lastFrameAt
        frameTimes.push(delta)
        if (frameTimes.length > 240) frameTimes.shift()
        // A hitch (not a tab coming back from the background, which shows as one huge gap).
        if (delta > HITCH_MS && delta < 3000 && !document.hidden) {
          const update = Math.max(0, cur.total - cur.render - cur.hud)
          const h = { ms: Math.round(delta), update: +update.toFixed(1), render: +cur.render.toFixed(1), hud: +cur.hud.toFixed(1), outside: +Math.max(0, delta - cur.total).toFixed(1), at: +((now - startedAt) / 1000).toFixed(1), ctx: getContext() }
          h.blame = blame(h)
          hitches.push(h)
          hitchTotal++
          if (hitches.length > HITCH_KEEP) hitches.shift()
          console.warn(`[perf] hitch ${h.ms} ms at ${h.at}s: ${h.blame}  (update ${h.update}, render ${h.render}, hud ${h.hud}, outside ${h.outside})  ${h.ctx}`)
        }
      }
      for (const k of SECTIONS) cur[k] = 0
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
        hitchLine(now) +
        `GPU ${gpu.length > 60 ? gpu.slice(0, 60) + '…' : gpu}`
    },
    // (the hitch log: see the top of this file)
    hitches,
    // Section timing: begin('render') ... end('render'). 'total' is the whole game frame; update = total - render - hud. Averaged per display interval.
    begin(name) {
      marks[name] = performance.now()
    },
    end(name) {
      const t = performance.now() - marks[name]
      sectionSums[name] += t
      cur[name] += t
    },
  }
}
