// Saves the player's profile (logic/profile.js) in this browser's localStorage,
// so banked crystals, the pet collection, loadouts and upgrades stay on the device.
import { noteSaved } from './saveSync.js'
import { createProfile, normalizeProfile } from './logic/profile.js'

const KEY = 'slashbattle:profile'

export function loadProfile() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? normalizeProfile(JSON.parse(raw)) : createProfile()
  } catch {
    return createProfile() // storage blocked or corrupt: start fresh
  }
}

export function saveProfile(profile) {
  try {
    localStorage.setItem(KEY, JSON.stringify(profile))
    noteSaved()
  } catch {
    // storage unavailable: the profile just won't persist
  }
}
