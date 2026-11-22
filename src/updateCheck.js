// Keeps a home-screen (full-screen) copy of the game up to date. A phone's home-screen web app keeps its own copy of
// the page and just resumes it when reopened, so it never notices a new version on its own (and a co-op host on the
// new version turns it away). On start and whenever the app comes back to the front we fetch the live page past every
// cache and compare its script bundle (Vite names it by a hash of its content) with ours: a different one means a new
// version, and a banner offers to load it. `reloadFresh` loads the page under a new address, which no cache has seen.
// Only in a real build (the dev server reloads by itself); never in the single-file copy (it has no live page).

const SCRIPT_RE = /assets\/index-[A-Za-z0-9_-]+\.js/

export function reloadFresh() {
  const url = new URL(window.location.href)
  url.searchParams.set('v', String(Date.now()))
  window.location.replace(url.toString())
}

function currentBundle() {
  for (const s of document.querySelectorAll('script[type="module"][src]')) {
    const m = s.getAttribute('src').match(SCRIPT_RE)
    if (m) return m[0]
  }
  return null
}

let banner = null
function showBanner() {
  if (banner) return
  banner = document.createElement('button')
  banner.type = 'button'
  banner.id = 'update-banner'
  banner.textContent = 'A new version of SlashBattle is out · Tap to update'
  banner.style.cssText = 'position:fixed;left:50%;bottom:max(16px, env(safe-area-inset-bottom));transform:translateX(-50%);z-index:9999;padding:12px 20px;border:0;border-radius:999px;background:#ffd15c;color:#1a2433;font:700 15px Sora,system-ui,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,0.35);cursor:pointer;max-width:calc(100vw - 32px)'
  for (const type of ['keydown', 'mousedown', 'pointerdown', 'touchstart']) banner.addEventListener(type, (e) => e.stopPropagation())
  banner.addEventListener('click', (e) => {
    e.stopPropagation()
    reloadFresh()
  })
  document.body.appendChild(banner)
}

let checking = false
let lastCheck = 0
async function check() {
  const mine = currentBundle()
  if (!mine || checking || Date.now() - lastCheck < 30000) return
  checking = true
  lastCheck = Date.now()
  try {
    const url = new URL(window.location.href)
    url.search = `?check=${Date.now()}`
    url.hash = ''
    const res = await fetch(url.toString(), { cache: 'no-store' })
    if (!res.ok) return
    const live = (await res.text()).match(SCRIPT_RE)?.[0]
    if (live && live !== mine) showBanner()
  } catch {
    // offline, or no live page to ask: keep playing what we have
  } finally {
    checking = false
  }
}

export function startUpdateCheck() {
  if (!import.meta.env.PROD || window.location.protocol === 'file:') return
  check()
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check() })
  setInterval(check, 5 * 60 * 1000)
}
