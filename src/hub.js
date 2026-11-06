// The hub: one overlay with three pages -- the Skill Tree (key 6), the Power-Ups
// page (key 7) and the Loadout (key 9; also openable from the start card). Banked
// crystals buy skill levels and power-up upgrades; the loadout picks the pets
// you start every run with. Pure DOM; main.js hands in the profile and callbacks.
import { iconImg } from './icons.js'
import { skillIconSvg } from './skillIcons.js'
import * as actions from './logic/profile.js'
import { PETS, PET_MAX_LEVEL, POWERUPS, SLOT_LIMITS, petBoost, petLevel, petUpgradeCost, powerupEffects } from './logic/items.js'
import {
  POWERUP_MAX_LEVEL,
  SKILLS,
  SKILL_BRANCHES,
  TIER_GATES,
  branchPoints,
  describeEffects,
  powerupLevel,
  powerupUpgradeCost,
  skillEffects,
  skillState,
  skillsSpent,
} from './logic/skills.js'

const CSS = `
#hub-root { z-index: 45; background: rgba(20, 26, 40, 0.55); }
#hub-root .hub-card { width: min(1040px, 96vw); max-height: 92vh; overflow: auto; padding: 18px 22px 20px; align-items: stretch; gap: 12px; }
.hub-head { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.hub-head h1 { font-size: 26px; margin: 0; margin-right: auto; }
.hub-tab, .hub-btn { font: inherit; font-weight: 700; font-size: 13px; padding: 7px 14px; border-radius: 10px; border: 2px solid var(--teal, #19b5a5); background: transparent; color: var(--teal, #19b5a5); cursor: pointer; }
.hub-tab small { opacity: 0.65; margin-left: 4px; }
.hub-tab.on, .hub-btn.primary, .hub-tab:hover, .hub-btn:hover { background: var(--teal, #19b5a5); color: #fff; }
.hub-btn:disabled { opacity: 0.45; cursor: default; background: transparent; color: var(--muted, #5b6b80); border-color: var(--muted, #5b6b80); }
.hub-bank { font-weight: 800; font-size: 15px; padding: 6px 12px; border-radius: 999px; background: #fff; border: 2px solid var(--butter, #ffd15c); color: var(--ink, #1a2433); }
.hub-note { margin: 0; font-size: 12px; color: var(--muted, #5b6b80); }
.hub-status { min-height: 18px; margin: 0; font-size: 13px; font-weight: 700; color: var(--coral, #ff6a4d); text-align: center; }
.hub-tree { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.hub-branch { position: relative; border-radius: 14px; padding: 12px 12px 14px; background: rgba(255,255,255,0.7); border: 1px solid color-mix(in srgb, var(--branch) 35%, #d8dee6); box-shadow: 0 1px 0 rgba(255,255,255,0.8) inset, 0 6px 18px -12px rgba(26,36,51,0.35); }
.hub-branch h2 { margin: 0; font-size: 12px; font-weight: 700; letter-spacing: 1.6px; text-transform: uppercase; color: var(--ink, #1a2433); display: flex; justify-content: space-between; align-items: baseline; }
.hub-branch h2::before { content: ''; width: 8px; height: 8px; border-radius: 50%; background: var(--branch); margin-right: 8px; align-self: center; }
.hub-branch h2 small { margin-left: auto; font-size: 11px; font-weight: 600; color: var(--muted, #5b6b80); text-transform: none; letter-spacing: 0; }
.hub-branch .sub { margin: 2px 0 12px; font-size: 11px; color: var(--muted, #5b6b80); }
.hub-web { position: relative; display: grid; grid-template-columns: 22px repeat(3, 1fr); gap: 12px 8px; align-items: center; }
.hub-web > svg { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; overflow: visible; }
.hub-tier { font-size: 9px; font-weight: 600; letter-spacing: 1px; color: #9aa6b5; writing-mode: vertical-rl; transform: rotate(180deg); text-align: center; white-space: nowrap; }
.hub-tier.open { color: var(--branch); }
.hub-slot { position: relative; min-height: 84px; display: flex; }
.hub-node { position: relative; z-index: 1; flex: 1; min-width: 0; min-height: 84px; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; gap: 4px; font: inherit; color: #3d4a5c; padding: 9px 3px 8px; border-radius: 10px; border: 1px solid #d3dae3; background: #fff; cursor: pointer; transition: border-color .15s, box-shadow .15s, background .15s, transform .15s; }
.hub-node:hover { border-color: var(--branch); transform: translateY(-1px); }
.hub-node .glyph { position: relative; z-index: 0; flex: none; width: 22px; height: 22px; display: block; color: #6b778a; }
.hub-node .glyph svg, .hub-detail .glyph svg { width: 100%; height: 100%; display: block; }
.hub-node .nm { position: relative; z-index: 1; font-weight: 600; font-size: 9.5px; line-height: 1.15; text-align: center; letter-spacing: 0.1px; overflow-wrap: anywhere; hyphens: auto; }
.hub-node .pipbar { display: flex; flex-wrap: wrap; justify-content: center; gap: 3px; margin-top: auto; padding-top: 2px; }
.hub-node .pipbar i { width: 5px; height: 5px; border-radius: 50%; background: #dde3ea; }
.hub-node .pipbar i.on { background: var(--branch); }
.hub-node.locked { background: #f3f5f8; border-color: #e3e8ee; color: #9aa6b5; cursor: default; }
.hub-node.locked:hover { transform: none; border-color: #e3e8ee; }
.hub-node.locked .glyph { color: #b4bdc9; }
.hub-node.has { border-color: var(--branch); background: color-mix(in srgb, var(--branch) 8%, #fff); }
.hub-node.has .glyph { color: var(--branch); }
.hub-node.maxed { background: color-mix(in srgb, var(--branch) 16%, #fff); border-color: var(--branch); box-shadow: 0 0 0 1px var(--branch) inset; }
.hub-node.maxed .glyph { color: var(--branch); }
.hub-node.cap { border-radius: 50% / 38%; box-shadow: 0 0 0 3px color-mix(in srgb, var(--branch) 18%, transparent); }
.hub-node.afford:not(.maxed) { border-color: var(--branch); }
.hub-node.afford:not(.maxed):hover, .hub-node.sel { box-shadow: 0 0 0 3px color-mix(in srgb, var(--branch) 30%, transparent); }
.hub-detail { min-height: 44px; padding: 8px 12px; border-radius: 12px; background: #fff; border: 2px solid var(--detail, var(--muted, #5b6b80)); font-size: 12px; display: flex; flex-wrap: wrap; gap: 4px 14px; align-items: center; }
.hub-detail b { font-size: 14px; display: inline-flex; align-items: center; gap: 8px; }
.hub-detail .glyph { width: 20px; height: 20px; color: var(--detail); display: inline-block; }
.hub-detail .cs { margin-left: auto; font-weight: 800; }
.pips { letter-spacing: 2px; font-size: 11px; color: var(--branch, #19b5a5); }
.hub-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 12px; }
.hub-perk { display: grid; grid-template-columns: 56px 1fr; gap: 4px 12px; align-items: center; padding: 10px 12px; border-radius: 14px; background: #fff; border: 2px solid var(--branch); }
.hub-perk img { width: 52px; height: 52px; grid-row: span 3; }
.hub-perk .nm { font-weight: 800; font-size: 14px; }
.hub-perk .tag { font-size: 10px; font-weight: 800; padding: 1px 6px; border-radius: 999px; background: var(--branch); color: #fff; margin-left: 6px; vertical-align: middle; }
.hub-perk .ef { font-size: 12px; color: var(--ink, #1a2433); }
.hub-perk .nx { font-size: 11px; color: var(--muted, #5b6b80); }
.hub-perk .row { grid-column: 1 / -1; display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.hub-perk .live { font-size: 10px; font-weight: 800; color: var(--teal, #19b5a5); }
.hub-slots { display: flex; gap: 8px; flex-wrap: wrap; }
.hub-slotbtn { font: inherit; font-weight: 700; font-size: 13px; padding: 7px 12px; border-radius: 10px; border: 2px solid var(--teal, #19b5a5); background: #fff; color: var(--ink, #1a2433); cursor: pointer; }
.hub-slotbtn.on { background: var(--teal, #19b5a5); color: #fff; }
.hub-team { display: flex; gap: 10px; }
.hub-team .cell { width: 74px; height: 74px; border-radius: 14px; border: 2px dashed var(--muted, #5b6b80); display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.6); cursor: pointer; font-size: 11px; color: var(--muted, #5b6b80); }
.hub-team .cell.full { border-style: solid; border-color: var(--teal, #19b5a5); background: #fff; }
.hub-team img { width: 62px; height: 62px; }
.hub-pets { display: grid; grid-template-columns: repeat(auto-fill, minmax(86px, 1fr)); gap: 10px; }
.hub-pet { font: inherit; display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 6px 4px; border-radius: 12px; border: 2px solid transparent; background: #fff; cursor: pointer; color: var(--ink, #1a2433); }
.hub-pet img { width: 56px; height: 56px; }
.hub-pet .nm { font-size: 11px; font-weight: 800; }
.hub-petwrap { display: flex; flex-direction: column; gap: 4px; }
.hub-pet .lv { font-size: 10px; font-weight: 700; color: var(--teal, #19b5a5); }
.hub-petup { font: inherit; font-size: 10px; font-weight: 800; padding: 3px 4px; border-radius: 8px; border: 1px solid var(--teal, #19b5a5); background: #fff; color: var(--teal, #19b5a5); cursor: pointer; }
.hub-petup:hover:not(:disabled) { background: var(--teal, #19b5a5); color: #fff; }
.hub-petup:disabled { opacity: 0.45; cursor: default; }
.hub-pet.in { border-color: var(--teal, #19b5a5); background: #e6faf7; }
.hub-pet.locked { cursor: default; opacity: 0.55; }
.hub-pet.locked img { filter: brightness(0) opacity(0.4); }
@media (max-width: 860px) { .hub-tree { grid-template-columns: 1fr; } }
`

function el(tag, className, text) {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

const pips = (level, max) => '●'.repeat(level) + '○'.repeat(max - level)
const TABS = [
  { id: 'skills', label: 'Skill Tree', key: '6' },
  { id: 'powerups', label: 'Power-Ups', key: '7' },
  { id: 'loadout', label: 'Loadout', key: '9' },
]

// Callbacks: getProfile() -> profile, setProfile(next) (main saves it), getRun() ->
// { inRun, crystals, owned: [], equipped: [] }, onBank() banks the run's crystals,
// onOpenChange(open).
export function createHub({ getProfile, setProfile, getRun, onBank, onOpenChange }) {
  const style = document.createElement('style')
  style.textContent = CSS
  document.head.appendChild(style)

  const root = el('div', 'overlay')
  root.id = 'hub-root'
  root.style.display = 'none'
  for (const type of ['mousedown', 'mouseup', 'pointerdown', 'click']) root.addEventListener(type, (event) => event.stopPropagation())
  const card = el('div', 'card panel hub-card')
  root.appendChild(card)
  document.body.appendChild(root)

  let open = false
  let tab = 'skills'
  let status = ''

  const say = (text) => {
    status = text
    render()
  }

  // Applies a profile action ({ profile, ok, reason }).
  const act = (result) => {
    if (result.ok) {
      setProfile(result.profile)
      status = ''
    } else status = result.reason
    render()
  }

  function header(profile) {
    const head = el('div', 'hub-head')
    head.appendChild(el('h1', null, 'Resort Hub'))
    for (const t of TABS) {
      const b = el('button', `hub-tab${tab === t.id ? ' on' : ''}`, t.label)
      b.type = 'button'
      b.appendChild(el('small', null, `[${t.key}]`))
      b.addEventListener('click', () => {
        tab = t.id
        status = ''
        render()
      })
      head.appendChild(b)
    }
    head.appendChild(el('span', 'hub-bank', `◆ ${profile.bank} banked`))
    const run = getRun()
    if (run.inRun) {
      const bank = el('button', 'hub-btn primary', `Bank ${run.crystals} ◆ [T]`)
      bank.type = 'button'
      bank.disabled = run.crystals <= 0
      bank.addEventListener('click', () => {
        onBank()
        render()
      })
      head.appendChild(bank)
    }
    const close = el('button', 'hub-btn', 'Close ✕')
    close.type = 'button'
    close.addEventListener('click', () => api.close())
    head.appendChild(close)
    return head
  }

  let hoverSkill = null

  // The detail bar under the tree: what the hovered / last-clicked node does and costs.
  function describeSkill(profile, id) {
    const bar = el('div', 'hub-detail')
    if (!id) {
      bar.appendChild(el('span', null, 'Hover a node to see what it does. Click to buy a rank. Each tier opens once you have spent enough ranks in that tree.'))
      return bar
    }
    const skill = SKILLS[id]
    const st = skillState(profile.skills, id)
    bar.style.setProperty('--detail', SKILL_BRANCHES.find((b) => b.id === skill.branch).color)
    const title = el('b', 'ttl')
    const ic = el('span', 'glyph')
    ic.innerHTML = skillIconSvg(skill)
    title.appendChild(ic)
    title.appendChild(document.createTextNode(skill.name))
    bar.appendChild(title)
    bar.appendChild(el('span', null, `Rank ${st.level}/${st.max}`))
    bar.appendChild(el('span', null, skill.blurb))
    if (st.locked) bar.appendChild(el('span', 'cs', `Locked · ${st.reason}`))
    else bar.appendChild(el('span', 'cs', st.cost === null ? 'MAXED' : `${st.cost} ◆ next rank${st.cost > profile.bank ? ' (not enough banked)' : ''}`))
    return bar
  }

  function skillsPage(profile) {
    const wrap = el('div')
    wrap.style.display = 'flex'
    wrap.style.flexDirection = 'column'
    wrap.style.gap = '10px'
    const detailHolder = el('div')
    detailHolder.appendChild(describeSkill(profile, hoverSkill))
    const tree = el('div', 'hub-tree')
    const lines = [] // { web, from, to } measured into SVG once laid out
    for (const branch of SKILL_BRANCHES) {
      const col = el('div', 'hub-branch')
      col.style.setProperty('--branch', branch.color)
      const spentRanks = branchPoints(profile.skills, branch.id)
      const head = el('h2', null, branch.name)
      head.appendChild(el('small', null, `${spentRanks} ranks`))
      col.appendChild(head)
      col.appendChild(el('p', 'sub', branch.blurb))
      const web = el('div', 'hub-web')
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      web.appendChild(svg)
      const els = {}
      for (let tier = 0; tier < TIER_GATES.length; tier++) {
        const open = spentRanks >= TIER_GATES[tier]
        web.appendChild(el('div', `hub-tier${open ? ' open' : ''}`, TIER_GATES[tier] === 0 ? 'TIER 1' : `T${tier + 1} · ${TIER_GATES[tier]}`))
        for (let c = 0; c < 3; c++) {
          const slot = el('div', 'hub-slot')
          const skill = Object.values(SKILLS).find((s) => s.branch === branch.id && s.tier === tier && s.col === c)
          if (skill) {
            const st = skillState(profile.skills, skill.id)
            const maxed = st.cost === null
            const node = el('button', `hub-node${st.locked ? ' locked' : ''}${st.level ? ' has' : ''}${maxed ? ' maxed' : ''}${skill.tier === 5 ? ' cap' : ''}${!st.locked && !maxed && profile.bank >= st.cost ? ' afford' : ''}${hoverSkill === skill.id ? ' sel' : ''}`)
            node.type = 'button'
            const glyph = el('span', 'glyph')
            glyph.innerHTML = skillIconSvg(skill)
            node.appendChild(glyph)
            node.appendChild(el('span', 'nm', skill.name))
            const pips = el('span', 'pipbar')
            for (let i = 0; i < st.max; i++) pips.appendChild(el('i', i < st.level ? 'on' : ''))
            node.appendChild(pips)
            const show = () => {
              hoverSkill = skill.id
              detailHolder.replaceChildren(describeSkill(getProfile(), skill.id))
            }
            node.addEventListener('mouseenter', show)
            node.addEventListener('focus', show)
            node.addEventListener('click', () => {
              hoverSkill = skill.id
              act(api.buySkill(skill.id))
            })
            slot.appendChild(node)
            els[skill.id] = { node, lit: st.level > 0 }
            for (const need of skill.needs) lines.push({ svg, web, from: need, to: skill.id, els })
          }
          web.appendChild(slot)
        }
      }
      col.appendChild(web)
      tree.appendChild(col)
    }
    wrap.appendChild(tree)
    wrap.appendChild(detailHolder)

    const spent = skillsSpent(profile.skills)
    const foot = el('div', 'hub-head')
    foot.appendChild(el('p', 'hub-note', describeEffects(skillEffects(profile.skills)).join('  ·  ') || 'Spend banked crystals to buy ranks. Slots, max HP, hiding time, crits and more are in here.'))
    const respec = el('button', 'hub-btn', `Respec (refund ◆ ${spent})`)
    respec.type = 'button'
    respec.disabled = spent === 0
    respec.addEventListener('click', () => act(api.respec()))
    foot.appendChild(respec)
    wrap.appendChild(foot)
    // Connector lines need the laid-out positions: draw them next frame.
    requestAnimationFrame(() => drawLines(lines))
    return wrap
  }

  function drawLines(lines) {
    for (const { svg, web, from, to, els } of lines) {
      if (!web.isConnected || !els[from] || !els[to]) continue
      const w = web.getBoundingClientRect()
      const a = els[from].node.getBoundingClientRect()
      const b = els[to].node.getBoundingClientRect()
      const x1 = a.left + a.width / 2 - w.left
      const y1 = a.bottom - w.top
      const x2 = b.left + b.width / 2 - w.left
      const y2 = b.top - w.top
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      const mid = (y1 + y2) / 2
      path.setAttribute('d', `M${x1} ${y1} C${x1} ${mid} ${x2} ${mid} ${x2} ${y2}`)
      path.setAttribute('fill', 'none')
      path.setAttribute('stroke', getComputedStyle(web).getPropertyValue('--branch') || '#888')
      path.setAttribute('stroke-width', els[from].lit ? '2' : '1.5')
      path.setAttribute('stroke-opacity', els[from].lit ? '0.85' : '0.25')
      svg.appendChild(path)
    }
  }

  function powerupsPage(profile) {
    const wrap = el('div')
    wrap.appendChild(el('p', 'hub-note', 'Upgrades are permanent: a higher level makes a power-up stronger every time you find and equip it. Find power-ups lying around in a run.'))
    const run = getRun()
    const grid = el('div', 'hub-grid')
    for (const perk of Object.values(POWERUPS)) {
      const level = powerupLevel(profile.powerups, perk.id)
      const cost = powerupUpgradeCost(level)
      const card = el('div', 'hub-perk')
      card.style.setProperty('--branch', perk.color)
      card.appendChild(iconImg('powerup', perk.id))
      const name = el('div', 'nm', perk.name)
      name.appendChild(el('span', 'tag', perk.tag))
      card.appendChild(name)
      card.appendChild(el('div', 'ef', describeEffects(powerupEffects([perk.id], { [perk.id]: level })).join(', ')))
      const next = cost === null ? 'Max level' : `Next: ${describeEffects(powerupEffects([perk.id], { [perk.id]: level + 1 })).join(', ')}`
      card.appendChild(el('div', 'nx', next))
      const row = el('div', 'row')
      const left = el('span', 'pips', `Lv ${level}/${POWERUP_MAX_LEVEL}  ${pips(level, POWERUP_MAX_LEVEL)}`)
      if (run.inRun && run.equipped.includes(perk.id)) left.appendChild(el('span', 'live', '  EQUIPPED'))
      else if (run.inRun && run.owned.includes(perk.id)) left.appendChild(el('span', 'live', '  OWNED'))
      row.appendChild(left)
      const up = el('button', 'hub-btn primary', cost === null ? 'MAX' : `Upgrade ◆ ${cost}`)
      up.type = 'button'
      up.disabled = cost === null || profile.bank < cost
      up.addEventListener('click', () => act(api.upgradePowerup(perk.id)))
      row.appendChild(up)
      card.appendChild(row)
      grid.appendChild(card)
    }
    wrap.appendChild(grid)
    return wrap
  }

  // The loadout slots + your starting team: shown on every page (the Loadout page adds the pet picker).
  function loadoutStrip(profile) {
    const wrap = el('div')
    wrap.style.display = 'flex'
    wrap.style.flexDirection = 'column'
    wrap.style.gap = '12px'
    const slots = el('div', 'hub-slots')
    for (let i = 0; i < actions.LOADOUT_SLOTS; i++) {
      const l = profile.loadouts[i]
      const b = el('button', `hub-slotbtn${profile.activeLoadout === i ? ' on' : ''}`, `${l.name} (${l.pets.length}/${SLOT_LIMITS.pets})`)
      b.type = 'button'
      b.addEventListener('click', () => {
        setProfile(api.setActive(i))
        status = ''
        render()
      })
      slots.appendChild(b)
    }
    wrap.appendChild(slots)

    const active = profile.loadouts[profile.activeLoadout]
    const team = el('div', 'hub-team')
    for (let i = 0; i < SLOT_LIMITS.pets; i++) {
      const id = active.pets[i]
      const cell = el('div', `cell${id ? ' full' : ''}`)
      if (id) {
        cell.appendChild(iconImg('pet', id))
        cell.title = `${PETS[id].name} Lv ${petLevel(profile.pets, id)} (click to remove)`
        cell.addEventListener('click', () => act(api.togglePet(id)))
      } else cell.textContent = 'empty'
      team.appendChild(cell)
    }
    wrap.appendChild(team)
    return wrap
  }

  function loadoutPage(profile) {
    const wrap = loadoutStrip(profile)
    const active = profile.loadouts[profile.activeLoadout]
    wrap.appendChild(el('p', 'hub-note', `This pet joins you at the start of every run (changes apply from your next run). Spend banked crystals on Upgrade to make a pet stronger and quicker for good. Collected ${profile.collection.length}/${Object.keys(PETS).length}: find new pets in chests.`))

    const grid = el('div', 'hub-pets')
    for (const pet of Object.values(PETS)) {
      const have = profile.collection.includes(pet.id)
      const b = el('button', `hub-pet${active.pets.includes(pet.id) ? ' in' : ''}${have ? '' : ' locked'}`)
      b.type = 'button'
      b.title = have ? pet.blurb : 'Not found yet'
      b.appendChild(iconImg('pet', pet.id))
      b.appendChild(el('span', 'nm', have ? pet.name : '???'))
      const level = petLevel(profile.pets, pet.id)
      if (have) {
        b.appendChild(el('span', 'lv', level >= PET_MAX_LEVEL ? `Lv ${level} MAX` : `Lv ${level}`))
        b.title = `${pet.blurb}\nLevel ${level}: ${Math.round((petBoost(level) - 1) * 100)}% stronger`
        b.addEventListener('click', () => act(api.togglePet(pet.id)))
      }
      const cell = el('div', 'hub-petwrap')
      cell.appendChild(b)
      if (have) {
        const cost = petUpgradeCost(level)
        const up = el('button', 'hub-petup', cost === null ? 'MAX' : `Upgrade ${cost} ◆`)
        up.type = 'button'
        up.disabled = cost === null || profile.bank < cost
        up.addEventListener('click', () => act(api.upgradePet(pet.id)))
        cell.appendChild(up)
      }
      grid.appendChild(cell)
    }
    wrap.appendChild(grid)
    return wrap
  }

  function render() {
    if (!open) return
    const profile = getProfile()
    card.replaceChildren(header(profile))
    if (tab !== 'loadout') card.appendChild(loadoutStrip(profile))
    card.appendChild(tab === 'skills' ? skillsPage(profile) : tab === 'powerups' ? powerupsPage(profile) : loadoutPage(profile))
    card.appendChild(el('p', 'hub-status', status))
    card.appendChild(el('p', 'hub-note', '6 / 7 / 9: switch pages · Esc: close · T (in a run): bank crystals'))
  }

  // The profile actions live here so the page code stays small; each returns { profile, ok, reason }.
  const api = {
    buySkill: (id) => actions.buySkill(getProfile(), id),
    respec: () => ({ profile: actions.respecSkills(getProfile()), ok: true }),
    upgradePowerup: (id) => actions.buyPowerupLevel(getProfile(), id),
    upgradePet: (id) => actions.buyPetLevel(getProfile(), id),
    togglePet: (id) => actions.toggleLoadoutPet(getProfile(), id),
    setActive: (i) => actions.setActiveLoadout(getProfile(), i),
    isOpen: () => open,
    refresh: render,
    say,
    open(which) {
      if (which) tab = which
      status = ''
      open = true
      root.style.display = 'flex'
      render()
      onOpenChange?.(true)
    },
    close() {
      if (!open) return
      open = false
      root.style.display = 'none'
      onOpenChange?.(false)
    },
    // Pressing a page's key: opens it, switches to it, or closes if already showing it.
    toggle(which) {
      if (open && tab === which) api.close()
      else api.open(which)
    },
  }
  return api
}

