import { describe, expect, it } from 'vitest'
import { wantsTouch } from '../src/touch.js'

const MAC_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15'

describe('touch detection', () => {
  it('a phone gets touch controls, a desktop does not', () => {
    expect(wantsTouch({ coarse: true, anyFine: false, maxTouchPoints: 5, userAgent: 'iPhone' })).toBe(true)
    expect(wantsTouch({ coarse: false, anyFine: true, maxTouchPoints: 0, userAgent: MAC_UA })).toBe(false)
  })

  it('an iPad posing as a Mac gets touch controls, even with a keyboard / trackpad attached', () => {
    expect(wantsTouch({ coarse: false, anyFine: true, maxTouchPoints: 5, userAgent: MAC_UA })).toBe(true)
    expect(wantsTouch({ coarse: true, anyFine: true, maxTouchPoints: 5, userAgent: MAC_UA })).toBe(true)
  })

  it('#touch and #desktop override', () => {
    expect(wantsTouch({ hash: '#touch' })).toBe(true)
    expect(wantsTouch({ hash: '#desktop', maxTouchPoints: 5, userAgent: MAC_UA })).toBe(false)
  })
})
