import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import * as path from 'path'
import { VitePWA } from 'vite-plugin-pwa'
import { baseballCrawlPlugin, volleyballCrawlPlugin, internationalSportsCrawlPlugin } from './vite.plugin.api'

export default defineConfig({
  plugins: [
    react(),
    baseballCrawlPlugin(),
    volleyballCrawlPlugin(),
    internationalSportsCrawlPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'MY SPORT - 스포츠 대시보드',
        short_name: 'MY SPORT',
        description: '한화 이글스, 현대캐피탈 스카이워커스 실시간 정보',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // 캐싱 전략
        runtimeCaching: [
          {
            // JSON 데이터 파일 - Stale While Revalidate
            urlPattern: /\/data\/.*\.json$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'sports-data-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7일
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // 이미지 - Cache First
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30일
              }
            }
          }
        ]
      }
    })
  ],
  base: '/mysport/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  esbuild: {
    drop: ['console', 'debugger'],
  },
})