// Guidance for the regional phenomena (pure; tested in test/stormGuide.test.js): where the next objective is and how to
// say it ("about 140 m to the north-east"), who to go and see first (each storm city's Sage) and what the Sage says at
// every point of the chain. `north` is -z, east is +x (the camera looks down -z).
import { PHENOMENA, PHENOMENON_ORDER, currentStage, isCleared, phenomenonEye, progressOf, stageCount, stagePoints } from './phenomena.js'
import { CITY_DEFS, villages } from './world.js'
import { SPECIES } from './species.js'

const POINTS = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west']
// The compass word for the direction from (x0, z0) to (x1, z1).
export function compassWord(x0, z0, x1, z1) {
  const angle = Math.atan2(x1 - x0, -(z1 - z0)) // 0 = north, clockwise
  return POINTS[((Math.round(angle / (Math.PI / 4)) % 8) + 8) % 8]
}
export const distanceText = (m) => (m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.max(1, Math.round(m / 5) * 5)} m`)

// The storm's city (a village with `city`), or null.
export const stormCity = (stormId) => villages().find((v) => v.stormId === stormId) ?? null

// Where the current stage wants you: { x, z, y?, text (the verb), kind } or null (cleared). `rt` is the live run state
// ({ trial: { running, next } }).
export function objectiveFor(phenomena, id, player, rt = {}) {
  const stage = currentStage(phenomena, id)
  if (!stage) return null
  const prog = progressOf(phenomena, id)
  const pts = stagePoints(id, prog.stage)
  const eye = phenomenonEye(id)
  const nearest = (list) => list.reduce((b, p) => (!b || Math.hypot(p.x - player.x, p.z - player.z) < Math.hypot(b.x - player.x, b.z - player.z) ? p : b), null)
  switch (stage.kind) {
    case 'seek': return { ...pts[0], text: `Reach the marker (${stage.title})`, kind: 'seek' }
    case 'collect': {
      const left = pts.filter((p) => !prog.got.includes(p.id))
      return left.length ? { ...nearest(left), text: `Fetch a ${stage.item} (${prog.n}/${stage.n}); beat its guards first`, kind: 'collect' } : null
    }
    case 'purge': return { x: eye.x, z: eye.z, text: `Fight inside the storm: ${stage.n - prog.n} more to fell`, kind: 'purge' }
    case 'hold': return { ...pts[0], text: 'Stand in the glowing ring and hold it', kind: 'hold' }
    case 'trial': {
      const next = rt.trial?.running ? rt.trial.next : 0
      return { ...pts[Math.min(pts.length - 1, next)], text: rt.trial?.running ? `Gate ${next + 1} of ${stage.gates}: hurry` : 'Reach the first gate to start the clock', kind: 'trial' }
    }
    case 'boss': return { x: eye.x, z: eye.z, text: `Face ${stage.title}`, kind: 'boss' }
    default: return null
  }
}

// What to follow right now: { stormId, x, z, label, kind ('sage' | 'objective'), distance, bearing } or null.
// `tracked` is the storm you asked the Sage to mark; otherwise the nearest one you have started, otherwise the nearest
// unfinished storm's Sage.
export function guideTarget(phenomena, player, tracked = null, rt = {}) {
  const open = PHENOMENON_ORDER.filter((id) => !isCleared(phenomena, id))
  if (!open.length) return null
  const dist = (p) => Math.hypot(p.x - player.x, p.z - player.z)
  const started = open.filter((id) => progressOf(phenomena, id).started)
  let id = tracked && open.includes(tracked) && progressOf(phenomena, tracked).started ? tracked : null
  if (!id && started.length) id = started.reduce((b, s) => (dist(phenomenonEye(s)) < dist(phenomenonEye(b)) ? s : b))
  const make = (stormId, spot, label, kind) => ({ stormId, x: spot.x, z: spot.z, y: spot.y, label, kind, distance: dist(spot), bearing: compassWord(player.x, player.z, spot.x, spot.z) })
  if (id) {
    const o = objectiveFor(phenomena, id, player, rt[id] ?? {})
    if (o) return make(id, o, o.text, 'objective')
  }
  // Nothing started: go and see the nearest unfinished storm's Sage.
  const city = open.map((s) => stormCity(s)).filter(Boolean).reduce((b, c) => (!b || dist(c) < dist(b) ? c : b), null)
  if (!city) return null
  return make(city.stormId, city, `Visit the Sage of ${city.name} about the ${PHENOMENA[city.stormId].short}`, 'sage')
}
export const guideText = (t) => `${t.label} · ${distanceText(t.distance)} ${t.bearing}`

// ---- the Sage's voice -------------------------------------------------------------------------------------------

export const SAGES = {
  sandstorm: {
    intro: 'Child of the lowlands, you walked a long way. Listen: the Howling Sandstorm is not weather. Something at its heart is spinning the sand, and every day the wall creeps closer to Gildenspire. We Dunekin read wind, and this wind is reading us. Calm it, and I will tell the other Sages your name.',
    wise: 'Keep moving in there. The gusts lean on you, so lean back and use the dunes.',
    done: 'The air is still. I have not heard the dunes this quiet in my lifetime. Gildenspire is yours for as long as you want it.',
  },
  whiteout: {
    intro: 'Come in, come in, shut the door! The Great Whiteout has crept down from the glacier and eaten three of our fire-towers. Frostkin do not fear cold, but this cold is wrong. Calm it, friend, and every window in Rimehold will burn your name.',
    wise: 'The cold is a clock: stay near fires, and fight to keep your blood moving. The bonfire rings are your friends.',
    done: 'Listen. That is not wind, that is a quiet night. Every window in Rimehold is lit for you tonight.',
  },
  ashstorm: {
    intro: 'Hah! A visitor with a spine. The Burning Ashstorm came out of the vents and it is raining fire on our forges. Embervolk can take a burn, but not forever. Go in, find what is stoking it, and put it out. I will keep your hammer warm.',
    wise: 'Watch the red rings. Every cinder tells you where it will land. Keep moving and keep your head.',
    done: 'The vents are sleeping again. Take a seat at our forge: you have earned the best chair in Pyreholm.',
  },
  miasma: {
    intro: 'Shh. Softly. The Weeping Miasma has been listening at our windows. It steals our lights, it weeps poison onto the reeds, and the fen is going dark. Mirefolk are patient, but we have run out of patience. Please, bring our lights back.',
    wise: 'Keep out of the green clouds, and keep walking. The fen forgives those who do not stand still.',
    done: 'Do you see it? The fog is lifting and the lights are coming back one by one. Lanternmere will never forget this.',
  },
}

// The Sage's dialogue for a storm: { text, buttons: [{ id, label }] }.
export function sageDialog(phenomena, id, player, rt = {}) {
  const voice = SAGES[id]
  const def = PHENOMENA[id]
  const prog = progressOf(phenomena, id)
  if (isCleared(phenomena, id)) {
    const left = PHENOMENON_ORDER.filter((s) => !isCleared(phenomena, s)).length
    return {
      text: `${voice.done}${left ? ` ${left} other regional phenomen${left === 1 ? 'on still rages' : 'a still rage'} across the Wilds; the other cities' Sages need you.` : ' All four storms are calm. The weather itself has taken a liking to you.'}`,
      buttons: [{ id: 'rest', label: 'Rest by the fire' }, { id: 'close', label: 'Farewell' }],
    }
  }
  if (!prog.started) {
    return {
      text: `${voice.intro} (${def.name}: ${stageCount(id)} trials, from a beacon at its edge to the beast at its heart.)`,
      buttons: [{ id: 'accept', label: 'I will calm the storm' }, { id: 'close', label: 'Not yet' }],
    }
  }
  const stage = currentStage(phenomena, id)
  const o = objectiveFor(phenomena, id, player, rt)
  const where = o ? ` Your next stop is ${Math.round(Math.hypot(o.x - player.x, o.z - player.z) / 5) * 5} m to the ${compassWord(player.x, player.z, o.x, o.z)}.` : ''
  return {
    text: `Trial ${prog.stage + 1} of ${stageCount(id)}: ${stage.title}. ${stage.text}${where} ${voice.wise}`,
    buttons: [{ id: 'mark', label: 'Mark it on my map' }, { id: 'rest', label: 'Rest by the fire' }, { id: 'close', label: 'On my way' }],
  }
}

export { CITY_DEFS, SPECIES }
