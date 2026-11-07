import { describe, expect, it } from 'vitest'
import { SAVE_KEYS, collectSave, hasSaveData, parseSave, syncDirection } from '../src/logic/saveData.js'

const memoryStorage = (entries = {}) => ({ getItem: (key) => (key in entries ? entries[key] : null) })

describe('save documents', () => {
  it('bundles only the save keys', () => {
    const save = collectSave(memoryStorage({ 'slashbattle:profile': '{"a":1}', 'slashbattle:ctxReload': '5', other: 'x' }), 123)
    expect(save).toEqual({ game: 'slashbattle', version: 1, savedAt: 123, data: { 'slashbattle:profile': '{"a":1}' } })
    expect(SAVE_KEYS).not.toContain('slashbattle:ctxReload')
  })

  it('round-trips through JSON and drops unknown keys and non-string values', () => {
    const text = JSON.stringify({ game: 'slashbattle', version: 1, savedAt: 9, data: { 'slashbattle:highscore': '{}', 'slashbattle:brightness': 2, evil: 'x' } })
    expect(parseSave(text)).toEqual({ game: 'slashbattle', version: 1, savedAt: 9, data: { 'slashbattle:highscore': '{}' } })
  })

  it('rejects things that are not saves', () => {
    expect(() => parseSave('not json')).toThrow(/isn't a SlashBattle save/)
    expect(() => parseSave('{"data":{}}')).toThrow(/isn't a SlashBattle save/)
    expect(() => parseSave({ game: 'slashbattle', version: 0, data: {} })).toThrow(/version/)
    expect(() => parseSave('x'.repeat(2_000_000))).toThrow(/too big/)
  })
})

describe('device file sync direction', () => {
  const file = (savedAt) => ({ savedAt, data: { 'slashbattle:profile': '{}' } })
  it('pushes when there is no file yet, does nothing when both are empty', () => {
    expect(syncDirection({ localSavedAt: 0, localHasData: true, file: null })).toBe('push')
    expect(syncDirection({ localSavedAt: 0, localHasData: false, file: null })).toBe('none')
    expect(hasSaveData({ data: {} })).toBe(false)
  })
  it('pulls into an empty browser and when the file is newer', () => {
    expect(syncDirection({ localSavedAt: 0, localHasData: false, file: file(5) })).toBe('pull')
    expect(syncDirection({ localSavedAt: 4, localHasData: true, file: file(5) })).toBe('pull')
    // A browser with progress from before device saves (no timestamp) takes the file; its copy is backed up.
    expect(syncDirection({ localSavedAt: 0, localHasData: true, file: file(5) })).toBe('pull')
  })
  it('pushes when this browser is newer, and is idle when in step', () => {
    expect(syncDirection({ localSavedAt: 6, localHasData: true, file: file(5) })).toBe('push')
    expect(syncDirection({ localSavedAt: 5, localHasData: true, file: file(5) })).toBe('none')
  })
})
