// Pure, Three-free skill tree and power-up upgrade rules, modelled on ARC Raiders'
// skill screen: three trees (Conditioning, Mobility, Survival), each a web of
// ranked nodes in six tiers. Every rank costs one purchase (banked crystals here,
// where ARC Raiders spends skill points), a node needs the nodes it hangs off
// to have at least one rank, and each deeper tier stays locked until you have put
// enough ranks into that same tree. The last tier is a capstone.
// Power-ups each have their own upgrade level too. Everything folds into the
// effect shape logic/items.js's powerupEffects uses.

export const SKILL_BRANCHES = [
  { id: 'conditioning', name: 'Conditioning', color: '#5fcf6a', blurb: 'Health, damage and staying power' },
  { id: 'mobility', name: 'Mobility', color: '#f2c230', blurb: 'Speed, recharge and loot reach' },
  { id: 'survival', name: 'Survival', color: '#ff6b6b', blurb: 'Loot, hiding, pets and slots' },
]

// Ranks already spent in a tree before each tier opens, and the crystals a rank costs there.
export const TIER_GATES = [0, 3, 8, 14, 21, 30]
export const TIER_COSTS = [10, 15, 20, 30, 45, 70]

// `per` is what ONE rank adds: multiplier fields start at 1 (cooldown -0.02 = 2% faster per
// rank), flat fields at 0 (maxHp +6 = 6 more HP per rank). `needs` lists nodes that must
// each have a rank first. `price` scales the tier cost (slot skills are dearer).
const node = (id, branch, tier, col, name, icon, max, per, needs, blurb, price = 1) => ({ id, branch, tier, col, name, icon, max, per, needs, blurb, price, cost: Math.round(TIER_COSTS[tier] * price) })

const NODES = [
  // ---- Conditioning ----
  node('hardy', 'conditioning', 0, 0, 'Hardy', '🫀', 5, { maxHp: 6 }, [], '+6 max HP'),
  node('gutcheck', 'conditioning', 0, 1, 'Gut Check', '💪', 5, { regen: 0.06 }, [], 'Regain 0.06 HP per second'),
  node('heavy', 'conditioning', 0, 2, 'Heavy Hands', '🥊', 5, { damage: 0.03 }, [], '+3% damage'),
  node('thick', 'conditioning', 1, 0, 'Thick Hide', '🧱', 5, { damageTaken: -0.02 }, ['hardy'], 'Take 2% less damage'),
  node('sharp', 'conditioning', 1, 1, 'Sharpened', '🗡️', 5, { crit: 0.02 }, ['heavy'], '+2% chance to hit for double'),
  node('brace', 'conditioning', 1, 2, 'Brace', '🛡️', 4, { knockback: 0.08 }, ['heavy'], '+8% knockback'),
  node('secondwind', 'conditioning', 2, 0, 'Second Wind', '🌬️', 5, { regen: 0.08 }, ['thick'], 'Regain 0.08 HP per second'),
  node('quickdraw', 'conditioning', 2, 1, 'Quick Draw', '⚡', 5, { cooldown: -0.02 }, ['sharp'], 'Attack 2% faster'),
  node('bruiser', 'conditioning', 2, 2, 'Bruiser', '💢', 5, { damage: 0.03 }, ['brace'], '+3% damage'),
  node('ironlungs', 'conditioning', 3, 0, 'Iron Lungs', '🫁', 4, { maxHp: 8 }, ['secondwind'], '+8 max HP'),
  node('finisher', 'conditioning', 3, 1, 'Finisher', '🩸', 4, { killHeal: 0.5 }, ['quickdraw'], 'Heal 0.5 HP per kill'),
  node('ruthless', 'conditioning', 3, 2, 'Ruthless', '😈', 4, { crit: 0.03 }, ['bruiser'], '+3% chance to hit for double'),
  node('fortress', 'conditioning', 4, 0, 'Fortress', '🏰', 4, { damageTaken: -0.03 }, ['ironlungs'], 'Take 3% less damage'),
  node('determined', 'conditioning', 4, 1, 'Downed But Determined', '🪦', 1, { revive: 1 }, ['finisher'], 'Once a run, get back up at half HP', 2),
  node('executioner', 'conditioning', 4, 2, 'Executioner', '☠️', 4, { damage: 0.05 }, ['ruthless'], '+5% damage'),
  node('unstoppable', 'conditioning', 5, 1, 'Unstoppable', '🦾', 1, { maxHp: 25, damage: 0.1, damageTaken: -0.08 }, ['fortress', 'executioner'], '+25 HP, +10% damage, -8% damage taken (capstone)'),

  // ---- Mobility ----
  node('lightfeet', 'mobility', 0, 0, 'Light Feet', '👟', 5, { speed: 0.02 }, [], '+2% move speed'),
  node('quickstudy', 'mobility', 0, 1, 'Quick Study', '🧠', 5, { haste: -0.03 }, [], 'Abilities recharge 3% faster'),
  node('gemrunner', 'mobility', 0, 2, 'Gem Runner', '🧲', 5, { magnet: 0.08 }, [], '+8% pickup range'),
  node('marathon', 'mobility', 1, 0, 'Marathon Runner', '🏃', 5, { speed: 0.02 }, ['lightfeet'], '+2% move speed'),
  node('slip', 'mobility', 1, 1, 'Slip and Slide', '🌀', 4, { iframes: 0.1 }, ['quickstudy'], '+10% invulnerability after a hit'),
  node('showboat', 'mobility', 1, 2, 'Showboat', '🎪', 5, { scoreMult: 0.04 }, ['gemrunner'], '+4% score'),
  node('momentum', 'mobility', 2, 0, 'Carry the Momentum', '💨', 4, { speed: 0.03 }, ['marathon'], '+3% move speed'),
  node('vigorous', 'mobility', 2, 1, 'Vigorous', '🔋', 5, { haste: -0.03 }, ['slip'], 'Abilities recharge 3% faster'),
  node('sticky', 'mobility', 2, 2, 'Sticky Fingers', '🤏', 5, { crystal: 0.05 }, ['showboat'], '+5% crystals'),
  node('evasive', 'mobility', 3, 0, 'Evasive', '🕺', 3, { iframes: 0.12 }, ['momentum'], '+12% invulnerability after a hit'),
  node('nimble', 'mobility', 3, 1, 'Nimble Fingers', '🤹', 5, { cooldown: -0.02 }, ['vigorous'], 'Attack 2% faster'),
  node('vacuum', 'mobility', 3, 2, 'Vacuum', '🌪️', 4, { magnet: 0.1 }, ['sticky'], '+10% pickup range'),
  node('blur', 'mobility', 4, 0, 'Blur', '🌫️', 3, { speed: 0.03 }, ['evasive'], '+3% move speed'),
  node('rhythm', 'mobility', 4, 1, 'Combo Rhythm', '🥁', 4, { crit: 0.03 }, ['nimble'], '+3% chance to hit for double'),
  node('hunter', 'mobility', 4, 2, 'Treasure Hunter', '🏴‍☠️', 4, { crystal: 0.08 }, ['vacuum'], '+8% crystals'),
  node('ghostmachine', 'mobility', 5, 1, 'Ghost in the Machine', '👻', 1, { speed: 0.08, haste: -0.1, iframes: 0.3 }, ['blur', 'hunter'], '+8% speed, abilities 10% faster, +30% i-frames (capstone)'),

  // ---- Survival ----
  node('looter', 'survival', 0, 0, "Looter's Instincts", '💎', 5, { crystal: 0.05 }, [], '+5% crystals'),
  node('hunker', 'survival', 0, 1, 'Hunker Down', '🧳', 5, { hideTime: 1 }, [], '+1s hiding in a pod'),
  node('pocket', 'survival', 0, 2, 'Pocket Change', '🪙', 5, { startCrystals: 10 }, [], 'Start each run with +10 crystals'),
  node('haggler', 'survival', 1, 0, 'Haggler', '🏷️', 5, { chestPrice: -0.05 }, ['looter'], 'Chests cost 5% less'),
  node('revital', 'survival', 1, 1, 'Revitalizing', '💚', 5, { waveHeal: 0.15 }, ['hunker'], 'Wave-clear heals 15% more'),
  node('mule', 'survival', 1, 2, 'Stubborn Mule', '🫏', 3, { slotsPowerups: 1 }, ['pocket'], '+1 power-up slot per rank', 2),
  node('scavenger', 'survival', 2, 0, 'Silent Scavenger', '🕵️', 4, { magnet: 0.08 }, ['haggler'], '+8% pickup range'),
  node('nerves', 'survival', 2, 1, 'Steady Nerves', '🧊', 5, { damageTaken: -0.02 }, ['revital'], 'Take 2% less damage'),
  node('bandolier', 'survival', 2, 2, 'Bandolier', '🎒', 2, { slotsAbilities: 1 }, ['mule'], '+1 ability slot per rank (keys G, H)', 2),
  node('greedy', 'survival', 3, 0, 'Greedy', '🤑', 4, { crystal: 0.06 }, ['scavenger'], '+6% crystals'),
  node('friend', 'survival', 3, 1, 'Animal Friend', '🐾', 3, { slotsPets: 1 }, ['nerves'], '+1 pet slot per rank', 2),
  node('breath', 'survival', 3, 2, 'Deep Breath', '😮‍💨', 4, { regen: 0.1 }, ['bandolier'], 'Regain 0.1 HP per second'),
  node('wallet', 'survival', 4, 0, 'Fat Wallet', '👛', 3, { startCrystals: 15 }, ['greedy'], 'Start each run with +15 crystals'),
  node('beastmaster', 'survival', 4, 1, 'Beastmaster', '🦁', 5, { petDamage: 0.1 }, ['friend'], 'Pets hit 10% harder'),
  node('scrounger', 'survival', 4, 2, 'Scrounger', '🧺', 3, { waveHeal: 0.2 }, ['breath'], 'Wave-clear heals 20% more'),
  node('survivor', 'survival', 5, 1, 'Survivor', '🏕️', 1, { petDamage: 0.2, maxHp: 15, regen: 0.3 }, ['wallet', 'beastmaster'], 'Pets +20%, +15 HP, +0.3 HP/s (capstone)'),
]

export const SKILLS = Object.fromEntries(NODES.map((n) => [n.id, n]))
export const SKILL_IDS = Object.keys(SKILLS)

export const POWERUP_MAX_LEVEL = 5
export const POWERUP_UPGRADE_COST = 40 // times the current level
export const POWERUP_LEVEL_BOOST = 0.35 // each level past 1 adds this share of the perk's base strength

export const skillLevel = (skills, id) => skills?.[id] ?? 0
export const powerupLevel = (levels, id) => levels?.[id] ?? 1

// Crystals for the next rank of skill `id` (null once maxed). A rank costs the same every time.
export function skillCost(id, level) {
  const skill = SKILLS[id]
  if (!skill || level >= skill.max) return null
  return skill.cost
}

export function powerupUpgradeCost(level) {
  return level >= POWERUP_MAX_LEVEL ? null : POWERUP_UPGRADE_COST * level
}

// Ranks spent in a tree.
export function branchPoints(skills, branch) {
  let total = 0
  for (const id of SKILL_IDS) if (SKILLS[id].branch === branch) total += skillLevel(skills, id)
  return total
}

// Where skill `id` stands: { level, max, cost, locked, reason }. A node is locked until each
// node it hangs off has a rank AND its tier is open (enough ranks spent in the same tree).
export function skillState(skills, id) {
  const skill = SKILLS[id]
  const level = skillLevel(skills, id)
  let reason = null
  const missing = skill.needs.find((need) => skillLevel(skills, need) < 1)
  if (missing) reason = `Needs ${SKILLS[missing].name}`
  else {
    const have = branchPoints(skills, skill.branch)
    if (have < TIER_GATES[skill.tier]) reason = `Spend ${TIER_GATES[skill.tier] - have} more rank${TIER_GATES[skill.tier] - have === 1 ? '' : 's'} in ${SKILL_BRANCHES.find((b) => b.id === skill.branch).name}`
  }
  return { level, max: skill.max, cost: skillCost(id, level), locked: reason !== null, reason }
}

// Every crystal sunk into the learned skills (what a respec refunds).
export function skillsSpent(skills) {
  let total = 0
  for (const id of SKILL_IDS) total += skillLevel(skills, id) * SKILLS[id].cost
  return total
}

// Effects: multipliers start at 1, flat bonuses at 0.
const MULT_FIELDS = ['speed', 'damage', 'cooldown', 'damageTaken', 'crystal', 'knockback', 'haste', 'magnet', 'petDamage', 'waveHeal', 'scoreMult', 'iframes', 'chestPrice']
const FLAT_FIELDS = ['killHeal', 'regen', 'maxHp', 'crit', 'hideTime', 'startCrystals', 'revive', 'slotsPowerups', 'slotsPets', 'slotsAbilities']
const FLAT = new Set(FLAT_FIELDS)
export const NEUTRAL_EFFECTS = Object.freeze({
  ...Object.fromEntries(MULT_FIELDS.map((k) => [k, 1])),
  ...Object.fromEntries(FLAT_FIELDS.map((k) => [k, 0])),
})

// What the learned skills add up to, in powerupEffects' shape (plus the skill-only fields).
export function skillEffects(skills = {}) {
  const fx = { ...NEUTRAL_EFFECTS }
  for (const id of SKILL_IDS) {
    const level = skillLevel(skills, id)
    if (!level) continue
    for (const [field, per] of Object.entries(SKILLS[id].per)) fx[field] += per * level // multiplier fields start at 1, flat ones at 0
  }
  return fx
}

// Two effect sets together (multipliers multiply, flat bonuses add), kept sane.
// Missing fields count as neutral, so a power-up set can be combined with a skill set.
export function combineEffects(a, b) {
  const out = {}
  for (const key of Object.keys(NEUTRAL_EFFECTS)) {
    const x = a[key] ?? NEUTRAL_EFFECTS[key]
    const y = b[key] ?? NEUTRAL_EFFECTS[key]
    out[key] = FLAT.has(key) ? x + y : x * y
  }
  out.damageTaken = Math.max(0.3, out.damageTaken)
  out.cooldown = Math.max(0.35, out.cooldown)
  out.haste = Math.max(0.35, out.haste)
  out.chestPrice = Math.max(0.4, out.chestPrice)
  out.crit = Math.min(0.75, out.crit)
  return out
}

// How strong a power-up of `level` is relative to level 1.
export const powerupAmp = (level) => 1 + POWERUP_LEVEL_BOOST * (level - 1)

// Plain-English lines for an effect set (only the parts that differ from neutral).
export function describeEffects(fx) {
  const pct = (v) => `${Math.round(Math.abs(v - 1) * 100)}%`
  const more = (v) => (v > 1 ? '+' : '-')
  const lines = []
  const mult = (key, text) => {
    if (fx[key] !== undefined && fx[key] !== 1) lines.push(text(fx[key]))
  }
  mult('damage', (v) => `${more(v)}${pct(v)} damage`)
  mult('cooldown', (v) => `Attack ${pct(v)} ${v < 1 ? 'faster' : 'slower'}`)
  mult('knockback', (v) => `${more(v)}${pct(v)} knockback`)
  mult('speed', (v) => `${more(v)}${pct(v)} move speed`)
  mult('damageTaken', (v) => `Take ${pct(v)} ${v < 1 ? 'less' : 'more'} damage`)
  mult('haste', (v) => `Abilities recharge ${pct(v)} ${v < 1 ? 'faster' : 'slower'}`)
  mult('crystal', (v) => `${more(v)}${pct(v)} crystals`)
  mult('magnet', (v) => `${more(v)}${pct(v)} pickup range`)
  mult('petDamage', (v) => `Pets ${more(v)}${pct(v)} damage`)
  mult('waveHeal', (v) => `Wave-clear heal ${more(v)}${pct(v)}`)
  mult('scoreMult', (v) => `${more(v)}${pct(v)} score`)
  mult('iframes', (v) => `${more(v)}${pct(v)} i-frames`)
  mult('chestPrice', (v) => `Chests ${pct(v)} ${v < 1 ? 'cheaper' : 'dearer'}`)
  const flat = (key, text) => {
    if (fx[key]) lines.push(text(Math.round(fx[key] * 100) / 100))
  }
  flat('maxHp', (v) => `+${v} max HP`)
  flat('crit', (v) => `${Math.round(v * 100)}% crit chance`)
  flat('killHeal', (v) => `Heal ${Math.round(v * 10) / 10} HP per kill`)
  flat('regen', (v) => `Regain ${v} HP/s`)
  flat('hideTime', (v) => `+${v}s hiding`)
  flat('startCrystals', (v) => `Start with ${v} crystals`)
  flat('revive', (v) => `${v} revive${v > 1 ? 's' : ''} per run`)
  flat('slotsPowerups', (v) => `+${v} power-up slot${v > 1 ? 's' : ''}`)
  flat('slotsAbilities', (v) => `+${v} ability slot${v > 1 ? 's' : ''}`)
  flat('slotsPets', (v) => `+${v} pet slot${v > 1 ? 's' : ''}`)
  return lines
}
