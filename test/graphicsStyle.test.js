import { describe, expect, it } from 'vitest'
import { GRAPHICS_STYLES, getGraphicsStyle, nextGraphicsStyle, setGraphicsStyle } from '../src/graphicsStyle.js'

describe('graphics style', () => {
  it('defaults to jelly and cycles through every style', () => {
    expect(getGraphicsStyle()).toBe('jelly')
    expect(nextGraphicsStyle('jelly')).toBe('shard')
    expect(nextGraphicsStyle('shard')).toBe('jelly')
    expect(GRAPHICS_STYLES).toEqual(['jelly', 'shard'])
  })

  it('ignores an unknown style', () => {
    expect(setGraphicsStyle('nope')).toBe('jelly')
    expect(setGraphicsStyle('shard')).toBe('shard')
    expect(setGraphicsStyle('jelly')).toBe('jelly')
  })
})
