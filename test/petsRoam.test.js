import * as THREE from 'three'
import { describe, expect, it, vi } from 'vitest'

const hits = []
vi.mock('../src/combat.js', () => ({ damageMonster: (monster, damage, opts) => hits.push({ monster, damage, opts }) }))
vi.mock('../src/particles.js', () => ({ burst: () => {} }))

const { createPet, disposePets, updatePets } = await import('../src/pets.js')

function world(petId, monsterAt) {
  const scene = new THREE.Scene()
  const player = { position: new THREE.Vector3(0, 0, 0), hp: 5, maxHp: 10 }
  const monsters = monsterAt ? [Object.assign(new THREE.Object3D(), { userData: { hp: 100 } })] : []
  if (monsterAt) monsters[0].position.set(monsterAt.x, 0, monsterAt.z)
  const pet = createPet(petId, scene, player)
  const pets = [pet]
  const tick = (seconds, extra = {}) => {
    for (let t = 0, e = 0; t < seconds; t += 1 / 60) {
      e += 1 / 60
      updatePets(pets, { dt: 1 / 60, elapsed: e, player, monsters, obstacles: [], particleSystem: {}, hitstop: null, ...extra })
    }
  }
  return { scene, player, monsters, pet, pets, tick }
}

describe('pets roam and fight', () => {
  it('Toco runs out to an enemy and pecks it in person, not from where it stands', () => {
    hits.length = 0
    const w = world('toco', { x: 12, z: 0 })
    w.pet.age = 5
    w.tick(2)
    expect(hits.length).toBeGreaterThan(0)
    const hit = hits[0]
    expect(Math.hypot(hit.opts.fromPos.x - 12, hit.opts.fromPos.z)).toBeLessThan(2) // it was next to the enemy
    disposePets(w.pets, w.scene)
  })

  it('a pet comes back to the player when nothing is in sight', () => {
    const w = world('toco', { x: 12, z: 0 })
    w.pet.age = 5
    w.tick(1)
    expect(w.pet.mesh.position.x).toBeGreaterThan(5)
    w.monsters.length = 0
    w.tick(3)
    expect(Math.hypot(w.pet.mesh.position.x, w.pet.mesh.position.z)).toBeLessThan(3.6) // back circling overhead
  })

  it('ignores enemies beyond sight and stays by the player', () => {
    hits.length = 0
    const w = world('ember', { x: 40, z: 0 })
    w.pet.age = 5
    w.tick(3)
    expect(hits.length).toBe(0)
    expect(Math.hypot(w.pet.mesh.position.x, w.pet.mesh.position.z)).toBeLessThan(2.6)
  })

  it('Blasty blows up beside the enemy and reforms by the player', () => {
    hits.length = 0
    const w = world('blasty', { x: 8, z: 0 })
    w.pet.age = 5
    w.pet.timer = 0
    w.tick(3)
    expect(hits.length).toBeGreaterThan(0)
    expect(hits[0].damage).toBeGreaterThan(0)
    expect(hits[0].opts.fromPos.x).toBeGreaterThan(5) // it went off out at the enemy
    expect(w.pet.age).toBeLessThan(3) // and has since been regrowing
  })

  it('Waddles stands off and fires a snowball that lands', () => {
    hits.length = 0
    const w = world('waddles', { x: 12, z: 0 })
    w.pet.age = 5
    w.pet.timer = 0
    w.tick(3)
    expect(hits.length).toBeGreaterThan(0)
    expect(w.pet.mesh.position.x).toBeGreaterThan(1) // it moved up to get in range
    expect(w.pet.mesh.position.x).toBeLessThan(11) // it did not run up to touch it
  })

  it('support pets never leave your side', () => {
    const w = world('healbit', { x: 6, z: 0 })
    w.pet.age = 5
    w.tick(3)
    expect(Math.hypot(w.pet.mesh.position.x, w.pet.mesh.position.z)).toBeLessThan(2.6)
    expect(w.player.hp).toBeGreaterThan(5)
  })

  it('birds soar high over the player and dive on an enemy', () => {
    const w = world('toco', null)
    w.pet.age = 5
    w.tick(3)
    expect(w.pet.mesh.userData.soar).toBeTruthy()
    const cruise = w.pet.mesh.position.y
    expect(cruise).toBeGreaterThan(0.9) // up in the air, not hovering at hip height
    expect(Math.hypot(w.pet.mesh.position.x, w.pet.mesh.position.z)).toBeGreaterThan(2) // on a wide loop, not on top of you
    w.monsters.push(Object.assign(new THREE.Object3D(), { userData: { hp: 100 } }))
    w.monsters[0].position.set(9, 0, 0)
    let lowest = cruise
    for (let t = 0; t < 2; t += 1 / 60) {
      w.tick(1 / 60)
      lowest = Math.min(lowest, w.pet.mesh.position.y)
    }
    expect(lowest).toBeLessThan(cruise - 0.4) // it came down to the enemy
    disposePets(w.pets, w.scene)
  })

  it('banks into its turns while circling', () => {
    const w = world('bolt', null)
    w.pet.age = 5
    w.tick(2)
    expect(Math.abs(w.pet.mesh.rotation.z)).toBeGreaterThan(0.05)
  })
})

describe('bird models', () => {
  it('flying birds spread wings and soar; the penguin walks', async () => {
    const { createPetModel } = await import('../src/petModels.js')
    const { PETS } = await import('../src/logic/items.js')
    for (const id of ['sparky', 'bolt', 'polly', 'toco', 'flame', 'vortex', 'quackers']) {
      const model = createPetModel(PETS[id])
      expect(model.userData.fly, id).toBe(true)
      expect(model.userData.soar.cruise, id).toBeGreaterThan(0.5)
      const box = new THREE.Box3().setFromObject(model)
      expect(box.max.x - box.min.x, `${id} wingspan`).toBeGreaterThan(box.max.y - box.min.y) // wider than tall: wings out
      model.userData.effort = 1
      model.userData.animate(1.3, true)
    }
    expect(createPetModel(PETS.waddles).userData.fly).toBe(false)
  })
})
