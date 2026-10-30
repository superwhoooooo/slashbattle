import { describe, expect, it } from 'vitest'
import { enemiesLeftText } from '../src/logic/hudText.js'

describe('enemiesLeftText', () => {
  it('reads "All guests checked out" once none are left', () => {
    expect(enemiesLeftText(0)).toBe('All guests checked out')
  })

  it('uses the singular for exactly one', () => {
    expect(enemiesLeftText(1)).toBe('1 guest still checked in')
  })

  it('uses the plural for more than one', () => {
    expect(enemiesLeftText(2)).toBe('2 guests still checked in')
    expect(enemiesLeftText(12)).toBe('12 guests still checked in')
  })

  it('treats a negative count the same as zero', () => {
    expect(enemiesLeftText(-1)).toBe('All guests checked out')
  })
})
