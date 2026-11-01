// Packs the production build (dist/) into ONE self-contained HTML file --
// the script, styles and fonts all inlined -- that can be sent to someone
// and opened by double-clicking it, with no server or internet needed.
//   npm run build:single   ->   dist-single/SlashBattle.html
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const dist = 'dist'
const html = readFileSync(join(dist, 'index.html'), 'utf8')

const scriptTag = html.match(/<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/)
const styleLink = html.match(/<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/)
if (!scriptTag || !styleLink) throw new Error('Run `npm run build` first: dist/index.html has no script/stylesheet.')

const read = (ref) => readFileSync(join(dist, ref.replace(/^\.\//, '')))

// Fonts: keep only the woff2 sources and embed them as data: URIs.
let css = read(styleLink[1]).toString('utf8')
css = css.replace(/,\s*url\([^)]+\.woff\)\s*format\(["']?woff["']?\)/g, '')
css = css.replace(/url\(["']?([^)"']+\.woff2)["']?\)/g, (_, ref) => {
  const file = join(dirname(join(dist, styleLink[1])), ref.replace(/^\.\//, ''))
  return `url(data:font/woff2;base64,${readFileSync(file).toString('base64')})`
})

// A literal "</script" inside the inlined code would end the tag early.
const js = read(scriptTag[1]).toString('utf8').replace(/<\/script/gi, '<\\/script')

const out = html
  .replace(scriptTag[0], '')
  .replace(styleLink[0], () => `<style>${css}</style>`)
  .replace('</body>', () => `<script type="module">${js}</script>\n</body>`)

mkdirSync('dist-single', { recursive: true })
writeFileSync('dist-single/SlashBattle.html', out)
console.log(`dist-single/SlashBattle.html  ${(out.length / 1024 / 1024).toFixed(2)} MB`)
