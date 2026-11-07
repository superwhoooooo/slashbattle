// The water rooms' screen furniture: a blue tint + drifting bubbles overlay while diving,
// and a BREATH bar (with a "[Shift] DIVE" hint on the surface). Pure DOM; main.js drives it.
const CSS = `
#water-tint { position: fixed; inset: 0; pointer-events: none; z-index: 4; opacity: 0; transition: opacity .35s;
  background: radial-gradient(ellipse at center, rgba(40,150,220,0.10) 35%, rgba(5,40,110,0.55) 100%); }
#water-tint.on { opacity: 1; }
#water-breath { position: fixed; left: 50%; bottom: 74px; transform: translateX(-50%); z-index: 6; display: none; flex-direction: column; align-items: center; gap: 4px; pointer-events: none; font: 800 12px/1 Sora, system-ui, sans-serif; letter-spacing: 1.4px; color: #fff; text-shadow: 0 1px 3px rgba(0,30,80,0.7); }
#water-breath .bar { width: 220px; height: 12px; border-radius: 999px; background: rgba(5,40,110,0.55); border: 2px solid rgba(255,255,255,0.85); overflow: hidden; }
#water-breath .fill { height: 100%; width: 100%; background: linear-gradient(90deg, #4de0ff, #bff6ff); transition: background .2s; }
#water-breath.low .fill { background: linear-gradient(90deg, #ff4a4a, #ffb04a); }
#water-breath.low { animation: water-pulse .5s infinite alternate; }
@keyframes water-pulse { from { transform: translateX(-50%) scale(1); } to { transform: translateX(-50%) scale(1.06); } }
@media (prefers-reduced-motion: reduce) { #water-breath.low { animation: none; } }
`

export function createWaterUi({ touch = false } = {}) {
  const style = document.createElement('style')
  style.textContent = CSS
  document.head.appendChild(style)
  const tint = document.createElement('div')
  tint.id = 'water-tint'
  const breath = document.createElement('div')
  breath.id = 'water-breath'
  breath.innerHTML = '<span class="label">BREATH</span><div class="bar"><div class="fill"></div></div>'
  document.body.append(tint, breath)
  const label = breath.querySelector('.label')
  const fill = breath.querySelector('.fill')
  let shown = false
  return {
    // `room`: in a water room at all; `diving`: under; `fraction`: breath left 0..1.
    update({ room, diving, fraction, lurking = false }) {
      tint.classList.toggle('on', room && diving)
      const show = room && (diving || fraction < 0.999)
      const hint = room && !diving
      breath.style.display = room ? 'flex' : 'none'
      if (!room) return
      label.textContent = diving ? 'BREATH' : fraction < 0.999 ? 'CATCHING BREATH' : lurking ? (touch ? 'SOMETHING LURKS BELOW: TAP DIVE' : 'SOMETHING LURKS BELOW: DIVE (SHIFT / E)') : touch ? 'TAP DIVE' : 'SHIFT / E: DIVE'
      fill.style.width = `${Math.round(Math.max(0, Math.min(1, fraction)) * 100)}%`
      breath.classList.toggle('low', diving && fraction < 0.3)
      breath.style.opacity = show || hint ? '1' : '0'
      shown = show
    },
    get visible() {
      return shown
    },
  }
}
