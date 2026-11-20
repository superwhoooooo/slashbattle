import { describe, expect, it } from 'vitest'
import { MUSIC_TRACKS, eventsForStep } from '../src/logic/music.js'
import { AMBIENT_KINDS, AMBIENT_LOOP_STEPS, DEFAULT_MUSIC_STYLE, MUSIC_STYLES, WILDS_BIOME_TRACKS, WILDS_TRACKS, WILDS_TRACK_IDS, nextMusicStyle, parseMusicStyle, pickTrack } from '../src/logic/wildsMusic.js'
import { BIOMES } from '../src/logic/world.js'

describe('the Wilds tracks', () => {
  it('has a track for every biome, the sky isles, the Depths and the Dungeon', () => {
    for (const id of Object.keys(BIOMES)) {
      if (id === 'depths') continue
      expect(WILDS_BIOME_TRACKS[id], id).toBeTruthy()
      expect(MUSIC_TRACKS[WILDS_BIOME_TRACKS[id]], id).toBeDefined()
    }
    for (const id of ['sky', 'depths', 'dungeon']) expect(MUSIC_TRACKS[id], id).toBeDefined()
    expect(WILDS_TRACK_IDS.length).toBe(15)
  })

  it('plays real notes on known voices, forever, the same every loop', () => {
    for (const id of WILDS_TRACK_IDS) {
      const track = WILDS_TRACKS[id]
      expect(track.bpm).toBeGreaterThan(50)
      let any = 0
      let notes = 0
      for (let step = 0; step < AMBIENT_LOOP_STEPS; step++) {
        const events = track.events(step)
        expect(track.events(step + AMBIENT_LOOP_STEPS), `${id} step ${step} loops`).toEqual(events)
        for (const e of events) {
          expect(AMBIENT_KINDS, `${id}: ${e.kind}`).toContain(e.kind)
          expect(e.steps).toBeGreaterThan(0)
          expect(e.velocity).toBeGreaterThan(0)
          if (e.note !== undefined) {
            expect(e.note, `${id} ${e.kind}`).toBeGreaterThan(15)
            expect(e.note, `${id} ${e.kind}`).toBeLessThan(120)
            notes++
          }
        }
        any += events.length
      }
      expect(any, id).toBeGreaterThan(60)
      expect(notes, id).toBeGreaterThan(30)
    }
  })

  it('gives each place its own sound', () => {
    const signature = (id) => JSON.stringify(Array.from({ length: 64 }, (_, i) => WILDS_TRACKS[id].events(i)))
    const seen = new Set(WILDS_TRACK_IDS.map(signature))
    expect(seen.size).toBe(WILDS_TRACK_IDS.length)
  })

  it('the Depths are drone and heartbeat, the sky has no drums, the Dungeon marches', () => {
    const kindsOf = (id) => new Set(Array.from({ length: AMBIENT_LOOP_STEPS }, (_, i) => WILDS_TRACKS[id].events(i)).flat().map((e) => e.kind))
    expect(kindsOf('depths').has('drone')).toBe(true)
    expect(kindsOf('depths').has('thud')).toBe(true)
    expect(kindsOf('depths').has('kick')).toBe(false)
    const sky = kindsOf('sky')
    for (const k of ['kick', 'snare', 'hat', 'tom']) expect(sky.has(k), k).toBe(false)
    expect(kindsOf('dungeon').has('kick')).toBe(true)
    expect(kindsOf('dungeon').has('bass')).toBe(true)
  })

  it('leaves the resort track exactly as it was', () => {
    expect(MUSIC_TRACKS.normal.events).toBe(eventsForStep)
    expect(MUSIC_TRACKS.normal.bpm).toBe(134)
    expect(MUSIC_TRACKS.boss.bpm).toBe(156)
    expect(MUSIC_TRACKS.chill.bpm).toBe(76)
  })
})

describe('pickTrack', () => {
  const wilds = { world: true, biome: 'whisperwood' }
  it('keeps the Orbital Resort (and other sundeck places) on the old loop', () => {
    expect(pickTrack({})).toBe('normal')
    expect(pickTrack({ style: 'places' })).toBe('normal')
    expect(pickTrack({ bossFight: true })).toBe('boss')
    expect(pickTrack({ paused: true })).toBe('chill')
  })
  it('plays each biome, the sky and the Depths in the Wilds, and the Dungeon in the Labyrinth', () => {
    expect(pickTrack(wilds)).toBe('wilds_whisperwood')
    expect(pickTrack({ world: true, biome: 'bonewaste' })).toBe('wilds_bonewaste')
    expect(pickTrack({ world: true, biome: 'nowhere' })).toBe('wilds_sanctum')
    expect(pickTrack({ ...wilds, aloft: true })).toBe('sky')
    expect(pickTrack({ ...wilds, depths: true })).toBe('depths')
    expect(pickTrack({ ...wilds, depths: true, aloft: true })).toBe('depths')
    expect(pickTrack({ labyrinth: true })).toBe('dungeon')
  })
  it('puts the fight music on for a boss close by, and the chill loop when paused, anywhere', () => {
    expect(pickTrack({ ...wilds, bossNear: true })).toBe('boss')
    expect(pickTrack({ ...wilds, depths: true, bossNear: true })).toBe('boss')
    expect(pickTrack({ ...wilds, paused: true })).toBe('chill')
    expect(pickTrack({ labyrinth: true, bossFight: true })).toBe('boss')
  })
  it('"same music always" is exactly the way it was: the resort loop everywhere', () => {
    const classic = { style: 'classic' }
    expect(pickTrack({ ...classic, ...wilds })).toBe('normal')
    expect(pickTrack({ ...classic, ...wilds, depths: true, aloft: true })).toBe('normal')
    expect(pickTrack({ ...classic, labyrinth: true })).toBe('normal')
    expect(pickTrack({ ...classic, ...wilds, bossNear: true })).toBe('normal')
    expect(pickTrack({ ...classic, bossFight: true })).toBe('boss')
    expect(pickTrack({ ...classic, paused: true })).toBe('chill')
  })
})

describe('the music style setting', () => {
  it('cycles between the two and tolerates junk', () => {
    expect(MUSIC_STYLES).toEqual(['places', 'classic'])
    expect(nextMusicStyle('places')).toBe('classic')
    expect(nextMusicStyle('classic')).toBe('places')
    expect(parseMusicStyle('classic')).toBe('classic')
    expect(parseMusicStyle(null)).toBe(DEFAULT_MUSIC_STYLE)
    expect(parseMusicStyle('loud')).toBe(DEFAULT_MUSIC_STYLE)
  })
})
