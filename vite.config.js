import { defineConfig } from 'vite'

// Relative asset paths, so the built game works from any folder or URL
// (GitHub Pages serves it from /slashbattle/, not the site root).
export default defineConfig({
  base: './',
})
