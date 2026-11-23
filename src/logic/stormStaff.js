// Storm-touched staff: every regional phenomenon you calm leaves a piece of its trouble in your Wizard Staff, for good
// (it reads the Wilds journal's storms, so it works in every mode). Pure data + small helpers; main.js's damage hook
// applies them to staff hits (cause 'magic'). Tests: test/stormStaff.test.js.
import { PHENOMENON_ORDER, isCleared } from './phenomena.js'

export const STAFF_UPGRADES = {
  sandstorm: { id: 'sandstorm', name: 'Sandblast', color: 0xffd98a, desc: 'The Howling Sandstorm\'s gusts: staff orbs shove what they hit back hard.', push: 1.8 },
  whiteout: { id: 'whiteout', name: 'Frostbite', color: 0xcfeaff, desc: 'The Great Whiteout\'s cold: staff orbs slow what they hit.', slow: 0.55, slowFor: 1.6 },
  ashstorm: { id: 'ashstorm', name: 'Ember Core', color: 0xffb04a, desc: 'The Burning Ashstorm\'s embers: staff orbs set what they hit burning.', burnDps: 0.35, burnFor: 3 },
  miasma: { id: 'miasma', name: 'Rot Bloom', color: 0xb8ff8a, desc: 'The Weeping Miasma\'s spores: a staff orb bursts into a spore puff that hurts monsters next to its target.', splash: 3.2, splashMult: 0.4 },
}

// The upgrades a journal's storms have earned (in storm order).
export function staffUpgrades(phenomena) {
  return PHENOMENON_ORDER.filter((id) => isCleared(phenomena ?? {}, id)).map((id) => STAFF_UPGRADES[id])
}
export const hasStaffUpgrade = (list, id) => list.some((u) => u.id === id)
