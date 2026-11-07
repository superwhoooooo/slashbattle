import { describe, expect, it } from 'vitest'
import { adaptiveDecision, frameStats, menuFrameDue, nextPixelRatio, parseFpsCap, shouldRenderFrame, trimmedMean } from '../src/logic/perf.js'
import { QUALITY_PRESETS } from '../src/config.js'

describe('shouldRenderFrame', () => {
  it('renders the first frame and when uncapped', () => {
    expect(shouldRenderFrame(10, null, 60)).toBe(true)
    expect(shouldRenderFrame(10, 9, 0)).toBe(true)
  })
  it('skips a 120 Hz in-between frame and renders the next', () => {
    expect(shouldRenderFrame(8.33, 0, 60)).toBe(false)
    expect(shouldRenderFrame(16.67, 0, 60)).toBe(true)
  })
  it('does not skip 60 Hz frames with jitter', () => {
    expect(shouldRenderFrame(16.0, 0, 60)).toBe(true)
  })
})

describe('parseFpsCap', () => {
  it('parses values', () => {
    expect(parseFpsCap(null)).toBe(60)
    expect(parseFpsCap('0')).toBe(0)
    expect(parseFpsCap('30')).toBe(30)
    expect(parseFpsCap('abc')).toBe(60)
  })
})

describe('frameStats', () => {
  it('computes avg, p95 and max', () => {
    const times = Array.from({ length: 100 }, (_, i) => i + 1)
    const s = frameStats(times)
    expect(s.avg).toBeCloseTo(50.5)
    expect(s.max).toBe(100)
    expect(s.p95).toBe(96)
    expect(frameStats([])).toEqual({ avg: 0, p95: 0, max: 0 })
  })
})

describe('nextPixelRatio', () => {
  it('steps down when slow, down to the floor', () => {
    expect(nextPixelRatio(1.5, 25)).toBe(1.25)
    expect(nextPixelRatio(1.25, 25)).toBe(1)
    expect(nextPixelRatio(1, 40)).toBe(1)
    expect(nextPixelRatio(1.1, 25)).toBe(1)
  })
  it('holds when fast enough', () => {
    expect(nextPixelRatio(1.5, 16.7)).toBe(1.5)
  })
  it('steps back up when holding the cap, never above maxRatio', () => {
    expect(nextPixelRatio(1, 16.8, { fastMs: 17.5, maxRatio: 1.5 })).toBe(1.25)
    expect(nextPixelRatio(1.25, 16.8, { fastMs: 17.5, maxRatio: 1.5 })).toBe(1.5)
    expect(nextPixelRatio(1.5, 16.8, { fastMs: 17.5, maxRatio: 1.5 })).toBe(1.5)
    expect(nextPixelRatio(1.4, 16.8, { fastMs: 17.5, maxRatio: 1.5 })).toBe(1.5)
  })
  it('holds between fast and slow thresholds', () => {
    expect(nextPixelRatio(1, 19, { fastMs: 17.5, maxRatio: 1.5 })).toBe(1)
  })
})

describe('quality presets', () => {
  it('medium is cheaper than the old default; high stays pretty', () => {
    expect(QUALITY_PRESETS.medium).toEqual({ maxPixelRatio: 1.5, msaaSamples: 2, gtao: false, shadowMapSize: 1024 })
    expect(QUALITY_PRESETS.high.gtao).toBe(true)
    expect(QUALITY_PRESETS.high.maxPixelRatio).toBe(2)
  })
})

describe('adaptiveDecision', () => {
  const base = { ratio: 1.5, fpsCap: 60, maxRatio: 1.5, autoFps: true, fullFps: 60 }
  it('drops the fps cap to 30 before giving up sharpness', () => {
    expect(adaptiveDecision({ ...base, avgFrameMs: 25 })).toEqual({ ratio: 1.5, fpsCap: 30, change: 'fpsDown' })
  })
  it('only lowers pixel ratio once already at 30 fps and still slow', () => {
    expect(adaptiveDecision({ ...base, fpsCap: 30, avgFrameMs: 34 }).change).toBe(null)
    expect(adaptiveDecision({ ...base, fpsCap: 30, avgFrameMs: 45 })).toEqual({ ratio: 1.25, fpsCap: 30, change: 'ratioDown' })
  })
  it('with an explicit fps cap, lowers pixel ratio directly', () => {
    expect(adaptiveDecision({ ...base, autoFps: false, avgFrameMs: 25 })).toEqual({ ratio: 1.25, fpsCap: 60, change: 'ratioDown' })
  })
  it('restores sharpness first, then full fps once the retry is due', () => {
    expect(adaptiveDecision({ ...base, ratio: 1.25, fpsCap: 30, avgFrameMs: 33.4, fpsRetryDue: true }).change).toBe('ratioUp')
    expect(adaptiveDecision({ ...base, fpsCap: 30, avgFrameMs: 33.4, fpsRetryDue: false }).change).toBe(null)
    expect(adaptiveDecision({ ...base, fpsCap: 30, avgFrameMs: 33.4, fpsRetryDue: true })).toEqual({ ratio: 1.5, fpsCap: 60, change: 'fpsUp' })
  })
  it('holds when steady at 60', () => {
    expect(adaptiveDecision({ ...base, avgFrameMs: 16.7, fpsRetryDue: true }).change).toBe(null)
  })
})

describe('menuFrameDue', () => {
  it('redraws menu backdrops at the given rate', () => {
    expect(menuFrameDue(1000, 900, 15)).toBe(true) // 100ms >= ~64.7ms
    expect(menuFrameDue(1000, 950, 15)).toBe(false)
    expect(menuFrameDue(1000, 801, 5)).toBe(true) // 199ms, within vsync slack of 200ms
    expect(menuFrameDue(1000, 850, 5)).toBe(false)
  })
})

describe('trimmedMean', () => {
  it('ignores a few one-off hitches', () => {
    const times = Array(57).fill(16.7).concat([90, 120, 200])
    expect(trimmedMean(times)).toBeCloseTo(16.7, 1)
  })
  it('still reads a missed-vsync pattern as slow', () => {
    const times = Array(30).fill(0).flatMap(() => [16.7, 33.3])
    expect(trimmedMean(times)).toBeGreaterThan(20)
  })
})
