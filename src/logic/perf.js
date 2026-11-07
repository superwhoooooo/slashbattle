// Pure performance helpers: the frame-rate cap decision, frame-time stats for the ?perf=1 overlay,
// and the adaptive pixel-ratio step. No Three.js / DOM so they can be unit tested.

export const DEFAULT_FPS_CAP = 60

// Parses ?fps=N: a positive number caps at N, 0 means uncapped, anything else falls back to 60.
export function parseFpsCap(value, fallback = DEFAULT_FPS_CAP) {
  if (value === null || value === undefined || value === '') return fallback
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0) return fallback
  return n
}

// The frame cap counts display frames rather than comparing timestamps: rAF timestamps jitter by a
// couple of ms, so a "skip if under ~15.5 ms" rule on a 60 Hz screen threw away real frames and
// left 33 ms gaps (48-54 fps with stutter while rAF itself ran a steady 60). Instead, estimate the
// display's refresh interval and render every Nth display frame.

// Display frames per rendered frame for an fps cap: 60 cap on 60 Hz -> 1, on 120 Hz -> 2; 30 cap
// on 60 Hz -> 2. `fpsCap` 0 (or less) means uncapped -> 1.
export function framesPerRender(displayIntervalMs, fpsCap) {
  if (!(fpsCap > 0) || !(displayIntervalMs > 0)) return 1
  return Math.max(1, Math.round(1000 / fpsCap / displayIntervalMs))
}

// Refresh-interval estimate: the median of recent rAF deltas (robust to jitter and the odd long
// frame). Returns 0 until there are enough samples.
export function estimateDisplayInterval(deltas) {
  const usable = deltas.filter((d) => d > 2 && d < 100)
  if (usable.length < 8) return 0
  const sorted = [...usable].sort((a, b) => a - b)
  return sorted[sorted.length >> 1]
}

// Summary of an array of frame times in ms: { avg, p95, max }.
export function frameStats(times) {
  if (times.length === 0) return { avg: 0, p95: 0, max: 0 }
  const sorted = [...times].sort((a, b) => a - b)
  const sum = sorted.reduce((a, b) => a + b, 0)
  const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))]
  return { avg: sum / sorted.length, p95, max: sorted[sorted.length - 1] }
}

export const ADAPTIVE_STEP = 0.25
export const ADAPTIVE_MIN_RATIO = 1
// Trimmed-mean frame time above which a 60 fps cap counts as missed. Tight on purpose: on a laptop
// that is just barely missing 60 (stuttering at 46-54 fps) the extra work also heats it into
// thermal throttling within about a minute, so fall back fast.
export const ADAPTIVE_SLOW_MS = 18
export const ADAPTIVE_WINDOW_SECONDS = 2
// A ratio that had to be stepped down from is off-limits for this long before we retry it.
export const ADAPTIVE_RETRY_SECONDS = 30
// When frames run slow the cap drops to this before any sharpness is given up: half the GPU work
// (and heat) per second at the same picture quality.
export const ADAPTIVE_LOW_FPS = 30
// How long to stay at the low fps cap before trying full rate again; doubles after each failed
// retry, up to the max, so a hot machine isn't stuttered back up every few seconds.
export const ADAPTIVE_FPS_RETRY_SECONDS = 60
export const ADAPTIVE_FPS_RETRY_MAX_SECONDS = 300

// Thresholds for an fps cap: "slow" = clearly missing it, "fast" = holding it (vsync slack).
export function adaptiveThresholds(fpsCap) {
  const cap = fpsCap > 0 ? fpsCap : 60
  return { slowMs: cap < 50 ? (1000 / cap) * 1.2 : ADAPTIVE_SLOW_MS, fastMs: (1000 / cap) * 1.05 }
}

// One adaptive-quality decision per measurement window. Order of preference when slow: drop the
// fps cap to ADAPTIVE_LOW_FPS (if the cap is automatic), then lower pixel ratio. When fast: restore
// pixel ratio first (sharpness), then -- once `fpsRetryDue` -- the full fps cap.
// Returns { ratio, fpsCap, change } where change is null | 'fpsDown' | 'fpsUp' | 'ratioDown' | 'ratioUp'.
export function adaptiveDecision({ ratio, fpsCap, avgFrameMs, maxRatio, autoFps, fullFps = 60, fpsRetryDue = false }) {
  const { slowMs, fastMs } = adaptiveThresholds(fpsCap)
  if (avgFrameMs > slowMs) {
    if (autoFps && fpsCap > ADAPTIVE_LOW_FPS) return { ratio, fpsCap: ADAPTIVE_LOW_FPS, change: 'fpsDown' }
    const next = nextPixelRatio(ratio, avgFrameMs, { slowMs })
    return { ratio: next, fpsCap, change: next !== ratio ? 'ratioDown' : null }
  }
  if (avgFrameMs <= fastMs) {
    const next = nextPixelRatio(ratio, avgFrameMs, { slowMs, fastMs, maxRatio })
    if (next !== ratio) return { ratio: next, fpsCap, change: 'ratioUp' }
    if (autoFps && fpsCap < fullFps && fpsRetryDue) return { ratio, fpsCap: fullFps, change: 'fpsUp' }
  }
  return { ratio, fpsCap, change: null }
}

// Mean of frame intervals with the slowest `trim` fraction dropped: a sustained missed-vsync
// pattern (16/33/16/33...) still reads slow, but a handful of one-off hitches (a shader compiling
// for a new enemy, a GC pause) don't trip a quality change.
export function trimmedMean(times, trim = 0.1) {
  if (times.length === 0) return 0
  const sorted = [...times].sort((a, b) => a - b)
  const keep = sorted.slice(0, Math.max(1, Math.ceil(sorted.length * (1 - trim))))
  return keep.reduce((a, b) => a + b, 0) / keep.length
}

// Menu backdrops: true when enough time has passed to redraw the scene behind a menu at `fps`.
export function menuFrameDue(now, lastMenuRenderAt, fps) {
  return now - lastMenuRenderAt >= 1000 / fps - 2
}

// Next pixel ratio given the average frame time over the last window: one step down while slow
// (never below the floor); one step back up while comfortably fast (avg <= fastMs), never above
// maxRatio; otherwise unchanged. Returns the same value when no change is needed.
export function nextPixelRatio(
  currentRatio,
  avgFrameMs,
  { step = ADAPTIVE_STEP, floor = ADAPTIVE_MIN_RATIO, slowMs = ADAPTIVE_SLOW_MS, fastMs = 0, maxRatio = currentRatio } = {},
) {
  if (avgFrameMs > slowMs) return currentRatio <= floor ? currentRatio : Math.max(floor, currentRatio - step)
  if (avgFrameMs <= fastMs && currentRatio < maxRatio) return Math.min(maxRatio, currentRatio + step)
  return currentRatio
}
