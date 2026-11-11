import { describe, expect, it } from 'vitest'
import { adaptiveDecision, frameStats, estimateDisplayInterval, framesPerRender, menuFrameDue, nextPixelRatio, parseFpsCap, trimmedMean } from '../src/logic/perf.js'
import { QUALITY_PRESETS } from '../src/config.js'

describe('framesPerRender', () => {
  it('renders every display frame when the cap matches or exceeds the refresh rate, or is off', () => {
    expect(framesPerRender(16.67, 60)).toBe(1)
    expect(framesPerRender(16.67, 0)).toBe(1)
    expect(framesPerRender(0, 60)).toBe(1) // no estimate yet
  })
  it('renders every Nth frame on faster displays or lower caps', () => {
    expect(framesPerRender(8.33, 60)).toBe(2) // 120 Hz
    expect(framesPerRender(16.67, 30)).toBe(2)
    expect(framesPerRender(8.33, 30)).toBe(4)
    expect(framesPerRender(6.94, 60)).toBe(2) // 144 Hz -> 72 fps, closest whole divisor
  })
})

describe('estimateDisplayInterval', () => {
  it('is the median of jittery 60 Hz deltas, ignoring stalls', () => {
    const deltas = [16.6, 14.9, 18.4, 16.7, 15.1, 18.2, 16.6, 16.8, 400, 16.5]
    expect(estimateDisplayInterval(deltas)).toBeCloseTo(16.6, 0)
  })
  it('needs a few samples first', () => {
    expect(estimateDisplayInterval([16.7, 16.7])).toBe(0)
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
    expect(QUALITY_PRESETS.medium).toEqual({ maxPixelRatio: 1.5, msaaSamples: 2, gtao: false, bloom: false, shadowMapSize: 1024 })
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
