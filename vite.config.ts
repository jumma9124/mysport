import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import * as path from 'path'
import { baseballCrawlPlugin, volleyballCrawlPlugin, internationalSportsCrawlPlugin } from './vite.plugin.api'

export default defineConfig({
  plugins: [react(), baseballCrawlPlugin(), volleyballCrawlPlugin(), internationalSportsCrawlPlugin()],
  base: '/mysport/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    fs: {
      strict: false,
    },
  },
})