import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import sheetSeo from './plugins/sheet-seo.js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // '' prefix so the un-prefixed server credentials load too; these stay in the
  // config's node context and are never exposed to the client bundle
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), sheetSeo(env)],
    server: {
      // mirrors the Netlify redirect (/api/sheet/* → the sheet function) so the
      // app talks to a same-origin path in dev and in production alike
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:3001',
          changeOrigin: true,
        },
      },
    },
  }
})
