import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import * as path from 'path'
import { volleyballCrawlPlugin } from './vite.plugin.api'

export default defineConfig({
  plugins: [react(), volleyballCrawlPlugin()],
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