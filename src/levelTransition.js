// The look of the hyperspace jump between places (timing is in logic/levelTransition.js): a full-screen
// canvas of star streaks racing out from the centre in the next place's colours, a white flash to hide
// the swap, and a "NOW ARRIVING" boarding-pass card for the new place. Purely visual, DOM + 2D canvas.

const STAR_COUNT = 320
const reduceMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

const CSS = `
#hyperspace { position: fixed; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 9000; display: none; }
#arrival-card { position: fixed; left: 50%; top: 30%; transform: translate(-50%, -50%); z-index: 9001; pointer-events: none;
  display: none; text-align: center; padding: 16px 34px 18px; border-radius: 22px; color: #fff;
  background: rgba(22, 18, 40, 0.82); box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35), inset 0 0 0 2px rgba(255, 255, 255, 0.12);
  font-family: 'Sora', system-ui, sans-serif; backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); }
#arrival-card .lead { font-size: 13px; letter-spacing: 0.32em; font-weight: 700; color: var(--butter, #ffd76a); }
#arrival-card .name { font-size: clamp(30px, 6vw, 58px); font-weight: 800; line-height: 1.05; margin: 6px 0 4px; letter-spacing: 0.02em; }
#arrival-card .tag { font-size: 14px; opacity: 0.75; font-style: italic; }
#arrival-card .stripe { height: 4px; border-radius: 2px; margin: 10px auto 0; width: 70%; }
#arrival-card.show { display: block; animation: arrival-in 3.2s cubic-bezier(.2, .9, .25, 1) forwards; }
@keyframes arrival-in {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(1.6) rotate(-4deg); filter: blur(8px); }
  12% { opacity: 1; transform: translate(-50%, -50%) scale(0.96) rotate(1deg); filter: blur(0); }
  18% { transform: translate(-50%, -50%) scale(1) rotate(-1deg); }
  82% { opacity: 1; transform: translate(-50%, -50%) scale(1) rotate(-1deg); }
  100% { opacity: 0; transform: translate(-50%, -60%) scale(0.92) rotate(-1deg); }
}
@media (prefers-reduced-motion: reduce) { #arrival-card.show { animation: arrival-fade 3.2s linear forwards; } }
@keyframes arrival-fade { 0%, 100% { opacity: 0; } 10%, 85% { opacity: 1; } }
`

export function createTransitionOverlay() {
  const style = document.createElement('style')
  style.textContent = CSS
  document.head.appendChild(style)
  const canvas = document.createElement('canvas')
  canvas.id = 'hyperspace'
  document.body.appendChild(canvas)
  const ctx = canvas.getContext('2d')
  const card = document.createElement('div')
  card.id = 'arrival-card'
  card.innerHTML = '<div class="lead">NOW ARRIVING</div><div class="name"></div><div class="tag"></div><div class="stripe"></div>'
  document.body.appendChild(card)

  const stars = Array.from({ length: STAR_COUNT }, () => ({ a: Math.random() * Math.PI * 2, z: Math.random(), c: Math.random() }))
  let colors = ['#ffffff', '#9fd8ff']

  function resize() {
    canvas.width = Math.round(window.innerWidth * 0.75) // a little under full size: it's all motion blur anyway
    canvas.height = Math.round(window.innerHeight * 0.75)
  }

  return {
    // Starts a jump toward `level` (its sky colours tint the streaks).
    begin(level) {
      colors = [level?.sky?.horizon ?? '#ffffff', level?.sky?.top ?? '#9fd8ff', '#ffffff']
      resize()
      canvas.style.display = 'block'
    },
    // Draws one frame: `frame` from logic/levelTransition.js's transitionFrame, dt in real seconds.
    draw(frame, dt) {
      if (!frame || (frame.streaks <= 0 && frame.flash <= 0)) {
        canvas.style.display = 'none'
        return
      }
      canvas.style.display = 'block'
      const w = canvas.width
      const h = canvas.height
      const cx = w / 2
      const cy = h / 2
      const reach = Math.hypot(cx, cy)
      ctx.clearRect(0, 0, w, h)
      const s = reduceMotion ? 0 : frame.streaks
      if (s > 0) {
        // a dark tunnel closing in, with a glow at its far end
        const vignette = ctx.createRadialGradient(cx, cy, reach * 0.15, cx, cy, reach)
        vignette.addColorStop(0, `rgba(10, 8, 30, ${0.15 * s})`)
        vignette.addColorStop(1, `rgba(6, 4, 20, ${0.75 * s})`)
        ctx.fillStyle = vignette
        ctx.fillRect(0, 0, w, h)
        const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, reach * 0.35)
        core.addColorStop(0, `rgba(255, 255, 255, ${0.55 * s})`)
        core.addColorStop(1, 'rgba(255, 255, 255, 0)')
        ctx.fillStyle = core
        ctx.fillRect(0, 0, w, h)
        const speed = 0.25 + s * 3.2
        const tail = 0.02 + s * 0.4
        ctx.lineCap = 'round'
        for (const star of stars) {
          star.z -= dt * speed
          if (star.z <= 0.02) {
            star.z = 1
            star.a = Math.random() * Math.PI * 2
            star.c = Math.random()
          }
          const r0 = (reach * 0.06) / star.z
          const r1 = (reach * 0.06) / Math.min(1.5, star.z + tail)
          if (r1 > reach * 1.2) continue
          const dx = Math.cos(star.a)
          const dy = Math.sin(star.a)
          ctx.strokeStyle = colors[Math.floor(star.c * colors.length)]
          ctx.globalAlpha = Math.min(1, s * 1.2) * Math.min(1, (1 - star.z) * 2.5)
          ctx.lineWidth = 1 + s * 2.6 * (1 - star.z)
          ctx.beginPath()
          ctx.moveTo(cx + dx * r1, cy + dy * r1)
          ctx.lineTo(cx + dx * Math.min(r0, reach * 1.3), cy + dy * Math.min(r0, reach * 1.3))
          ctx.stroke()
        }
        ctx.globalAlpha = 1
      }
      if (frame.flash > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${frame.flash})`
        ctx.fillRect(0, 0, w, h)
      }
    },
    // Shows the "NOW ARRIVING" card for the new place.
    arrive(level, tagline = '') {
      card.querySelector('.name').textContent = level?.name ?? ''
      card.querySelector('.tag').textContent = tagline
      card.querySelector('.stripe').style.background = `linear-gradient(90deg, ${level?.sky?.top ?? '#9fd8ff'}, ${level?.sky?.horizon ?? '#fff'})`
      card.classList.remove('show')
      void card.offsetWidth // restart the animation
      card.classList.add('show')
    },
    // Clears everything (restart / leaving mid-jump).
    reset() {
      canvas.style.display = 'none'
      card.classList.remove('show')
    },
  }
}
