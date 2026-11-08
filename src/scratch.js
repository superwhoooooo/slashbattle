// Claw scratches: when a clawed pet (petAnimals.js's userData.claws) lands a hit, three
// torn gashes rake across the screen over the enemy -- drawn in a flat DOM layer above
// the 3D canvas (under the HUD), so they read as a scratch "on the screen" rather than
// another spark in the scene. Each rakes in fast, holds a moment, then fades. A small
// pool of SVGs is reused round-robin. Kept deliberately pale and brief: not a glare.
const POOL_SIZE = 8
const SVG_NS = 'http://www.w3.org/2000/svg'
const DURATION = 460

// Three slightly curved, tapered claw marks in a 100x100 box, top-left to bottom-right.
const SLASHES = [
  'M16 8 Q38 40 40 94 Q27 46 16 8 Z',
  'M38 4 Q60 36 62 90 Q49 42 38 4 Z',
  'M60 8 Q80 36 82 84 Q70 42 60 8 Z',
]

export function createScratchLayer(parent = document.body) {
  const layer = document.createElement('div')
  layer.id = 'scratch-layer'
  layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:3;overflow:hidden'
  parent.appendChild(layer)
  const slots = []
  for (let i = 0; i < POOL_SIZE; i++) {
    const svg = document.createElementNS(SVG_NS, 'svg')
    svg.setAttribute('viewBox', '0 0 100 100')
    svg.style.cssText = 'position:absolute;left:0;top:0;visibility:hidden;overflow:visible'
    const paths = SLASHES.map((d) => {
      const path = document.createElementNS(SVG_NS, 'path')
      path.setAttribute('d', d)
      path.setAttribute('stroke-width', '2.4')
      path.setAttribute('stroke-linejoin', 'round')
      svg.appendChild(path)
      return path
    })
    layer.appendChild(svg)
    slots.push({ svg, paths })
  }
  return { layer, slots, next: 0 }
}

// Shows a scratch centred on screen point (x, y), `size` pixels across, edged in `color`
// (the pet's colour, darkened) with pale torn insides.
export function showScratch(scratch, x, y, size, color = 0xc0182c) {
  const slot = scratch.slots[scratch.next]
  scratch.next = (scratch.next + 1) % scratch.slots.length
  const { svg, paths } = slot
  svg.getAnimations().forEach((a) => a.cancel())
  const edge = `#${darken(color, 0.45).toString(16).padStart(6, '0')}`
  for (const path of paths) {
    path.setAttribute('fill', '#fbeee6')
    path.setAttribute('stroke', edge)
  }
  const angle = -25 + Math.random() * 50
  const flip = Math.random() < 0.5 ? -1 : 1
  svg.style.width = `${size}px`
  svg.style.height = `${size}px`
  svg.style.transform = `translate(${x - size / 2}px, ${y - size / 2}px) rotate(${angle}deg) scaleX(${flip})`
  svg.style.visibility = 'visible'
  const anim = svg.animate(
    [
      { clipPath: 'inset(0 100% 100% 0)', opacity: 0.85, offset: 0 },
      { clipPath: 'inset(0 0 0 0)', opacity: 0.85, offset: 0.18 },
      { clipPath: 'inset(0 0 0 0)', opacity: 0.8, offset: 0.45 },
      { clipPath: 'inset(0 0 0 0)', opacity: 0, offset: 1 },
    ],
    { duration: DURATION, easing: 'ease-out' },
  )
  anim.onfinish = () => {
    svg.style.visibility = 'hidden'
  }
}

function darken(hex, k) {
  const ch = (v) => Math.round(v * k)
  return (ch((hex >> 16) & 255) << 16) | (ch((hex >> 8) & 255) << 8) | ch(hex & 255)
}
