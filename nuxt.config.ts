// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  devServer: {
    port: 3002
  },

  runtimeConfig: {
    // Private keys (server-side only)
    apiSecret: process.env.API_SECRET || '',
    
    // Database configuration (server-side only)
    dbHost: process.env.DB_HOST || 'localhost',
    dbPort: process.env.DB_PORT || '3306',
    dbUser: process.env.DB_USER || 'root',
    dbPassword: process.env.DB_PASSWORD || '',
    dbName: process.env.DB_NAME || 'assetmaintain',
    
    // Public keys (exposed to client)
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || '/api',
      appName: 'AssetMaintain CMMS - CM',
      s3Url: process.env.S3_URL || 'https://railway-upload-api-service-production.up.railway.app'
    }
  },

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxt/icon',
    '@vite-pwa/nuxt'
  ],

  // PWA Configuration
  pwa: {
    registerType: 'autoUpdate',
    strategies: 'generateSW',
    manifest: {
      name: 'AssetMaintain CMMS - CM ระบบแจ้งซ่อมบำรุง',
      short_name: 'CM Maintain',
      description: 'ระบบแจ้งซ่อมบำรุงสำหรับช่างหน้างาน',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: '#f8fafc',
      theme_color: '#00a6ff',
      orientation: 'portrait',
      lang: 'th',
      categories: ['business', 'utilities'],
      icons: [
        { src: '/icons/icon-72x72.png', sizes: '72x72', type: 'image/png' },
        { src: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' },
        { src: '/icons/icon-128x128.png', sizes: '128x128', type: 'image/png' },
        { src: '/icons/icon-144x144.png', sizes: '144x144', type: 'image/png' },
        { src: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
        { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
        { src: '/icons/icon-384x384.png', sizes: '384x384', type: 'image/png' },
        { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
      ]
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,png,jpg,jpeg,svg,gif,ico,woff,woff2,ttf,eot}'],
      runtimeCaching: [
        {
          urlPattern: /^\/api\/.*/i,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'api-cache',
            expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 },
            cacheableResponse: { statuses: [0, 200] },
            networkTimeoutSeconds: 5
          }
        },
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: 'StaleWhileRevalidate',
          options: { cacheName: 'google-fonts-stylesheets' }
        },
        {
          urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts-webfonts',
            expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 }
          }
        },
        {
          urlPattern: /^https:\/\/.*\.(png|jpg|jpeg|gif|svg|webp)$/i,
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'external-images',
            expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 }
          }
        }
      ],
      navigateFallback: '/',
      navigateFallbackDenylist: [/^\/api\//],
      cleanupOutdatedCaches: true,
      skipWaiting: true,
      clientsClaim: true
    },
    client: {
      installPrompt: true,
      periodicSyncForUpdates: 3600
    },
    devOptions: {
      enabled: true,
      suppressWarnings: true,
      type: 'module'
    }
  },

  css: ['~/assets/css/main.css'],

  // Auto-import composables
  imports: {
    dirs: ['composables']
  },

  app: {
    head: {
      title: 'AssetMaintain CM - Corrective Maintenance System',
      htmlAttrs: {
        lang: 'th'
      },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes' },
        { name: 'description', content: 'ระบบแจ้งซ่อมบำรุงสำหรับช่างหน้างาน' },
        { name: 'theme-color', content: '#00a6ff' },
        // PWA meta tags
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'CM Maintain' },
        { name: 'msapplication-TileColor', content: '#00a6ff' },
        { name: 'msapplication-TileImage', content: '/icons/icon-144x144.png' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/manifest.json' }
      ]
    }
  },

  // Performance optimizations
  experimental: {
    payloadExtraction: false,
    renderJsonPayloads: true,
    viewTransition: true
  },
  
  // Nitro optimizations
  nitro: {
    compressPublicAssets: true,
    minify: true,
    prerender: {
      crawlLinks: false,
      routes: []
    }
  },
  
  // Vite optimizations
  vite: {
    build: {
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          manualChunks: {
            'lucide': ['lucide-vue-next']
          }
        }
      }
    },
    optimizeDeps: {
      include: ['lucide-vue-next']
    }
  },
})
