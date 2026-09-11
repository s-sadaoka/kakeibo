import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

// GitHub Pages はサブパス配信（https://<user>.github.io/kakeibo/）になるため、
// Vite の base と PWA の scope / start_url をこの値で揃える。
const BASE = '/kakeibo/'

export default defineConfig({
  base: BASE,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // manifest のアイコンは自動で事前キャッシュされる。iOS 用アイコンだけ明示する
      includeAssets: ['icons/apple-touch-icon.png'],
      manifest: {
        name: '家計簿',
        short_name: '家計簿',
        description: '個人用の家計簿。データは端末内にのみ保存します。',
        lang: 'ja',
        start_url: BASE,
        scope: BASE,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#ffffff',
        theme_color: '#2b7a78',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // オフラインで全画面を動かすため、ビルド成果物をすべて事前キャッシュする
        globPatterns: ['**/*.{js,css,html,svg,ico}'],
      },
    }),
  ],
  test: {
    // 集計ロジック（src/logic/）のユニットテストのみ対象
    include: ['src/**/*.test.ts'],
    // ステップ 3 でテストを追加するまでは、テストが 0 件でも成功扱いにする
    passWithNoTests: true,
  },
})
