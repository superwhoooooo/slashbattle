// Poses the held weapon: moves its group around the player body and aims it
// per logic/weaponAnim.js, then lets weapons with moving parts (the whip's
// segments, the nunchuck's swinging stick, the flail's ball) flex.
import { weaponPose } from './logic/weaponAnim.js'

// `progress` is the swing's 0..1, or null to put the weapon back at rest.
export function applyWeaponPose(weapon, id, progress) {
  const p = weaponPose(id, progress)
  weapon.position.set(Math.sin(p.yaw) * p.r, p.h, Math.cos(p.yaw) * p.r)
  weapon.rotation.order = 'YXZ'
  weapon.rotation.set(p.pitch, p.face, p.roll)
  weapon.userData.flex?.(progress)
}
