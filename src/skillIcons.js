// Skill-tree icons: one monochrome line glyph per kind of effect (stroke = currentColor),
// picked from a skill's first `per` field. Replaces the old emoji.
const P = {
  maxHp: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  regen: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/><path d="M12 9.5v5M9.5 12h5"/>',
  damage: '<path d="M5 19 17 7M14 5h5v5M5 19l-1.5 1.5M7.5 14.5l2 2"/>',
  crit: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4"/><circle cx="12" cy="12" r="3.5"/>',
  damageTaken: '<path d="M12 3 5 6v5.5c0 4.2 3 7.4 7 9.5 4-2.1 7-5.3 7-9.5V6z"/>',
  knockback: '<path d="M4 12h11M11 8l4 4-4 4M19 6v12"/>',
  cooldown: '<path d="M13 3 5 13.5h6L10 21l8-10.5h-6z"/>',
  haste: '<circle cx="12" cy="13" r="7"/><path d="M12 9.5V13l2.5 1.5M10 3h4"/>',
  speed: '<path d="m6 6 6 6-6 6M13 6l6 6-6 6"/>',
  magnet: '<path d="M6 4v8a6 6 0 0 0 12 0V4h-4v8a2 2 0 0 1-4 0V4zM6 8h4M14 8h4"/>',
  iframes: '<circle cx="12" cy="12" r="8" stroke-dasharray="3 3"/><circle cx="12" cy="12" r="3"/>',
  scoreMult: '<path d="m12 3.5 2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8L3.6 9.6l5.8-.8z"/>',
  crystal: '<path d="M7 4h10l4 5-9 11L3 9z"/><path d="M3 9h18M9.5 4 8 9l4 11 4-11-1.5-5"/>',
  killHeal: '<path d="M12 3.5s6 6.2 6 10.5a6 6 0 0 1-12 0c0-4.3 6-10.5 6-10.5z"/>',
  revive: '<path d="M12 20V8M7 12.5l5-5 5 5M5 20h14"/>',
  hideTime: '<rect x="5" y="8" width="14" height="12" rx="2.5"/><path d="M9 8V5.5h6V8M9 12v4M15 12v4"/>',
  startCrystals: '<ellipse cx="12" cy="7" rx="6" ry="2.5"/><path d="M6 7v5c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V7M6 12v5c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-5"/>',
  chestPrice: '<path d="M3.5 12.5 12 4h7.5v7.5L11 20z"/><circle cx="15.5" cy="8.5" r="1.2"/>',
  waveHeal: '<path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14zM5 19c3-4 6-6 9-8"/>',
  slotsPowerups: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><path d="M16.5 13.5v6M13.5 16.5h6"/>',
  slotsAbilities: '<path d="m12 3 8 9-8 9-8-9z"/><path d="M12 9v6M9 12h6"/>',
  slotsPets: '<circle cx="8" cy="9" r="1.8"/><circle cx="16" cy="9" r="1.8"/><circle cx="5" cy="14" r="1.6"/><circle cx="19" cy="14" r="1.6"/><path d="M12 12.5c-3 0-5 2.8-5 4.8 0 1.7 1.6 2.2 5 2.2s5-.5 5-2.2c0-2-2-4.8-5-4.8z"/>',
  petDamage: '<circle cx="8" cy="9" r="1.8"/><circle cx="16" cy="9" r="1.8"/><path d="M12 12.5c-3 0-5 2.8-5 4.8 0 1.7 1.6 2.2 5 2.2s5-.5 5-2.2c0-2-2-4.8-5-4.8z"/>',
}
const FALLBACK = '<circle cx="12" cy="12" r="6"/>'

export function skillIconKey(skill) {
  return Object.keys(skill.per)[0]
}

// An <svg> string for a skill, sized by CSS.
export function skillIconSvg(skill) {
  const body = P[skillIconKey(skill)] ?? FALLBACK
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`
}
