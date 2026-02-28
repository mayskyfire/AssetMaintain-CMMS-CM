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
      appName: 'AssetMaintain CM',
      s3Url: process.env.S3_URL || 'https://railway-upload-api-service-production.up.railway.app'
    }
  },

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxt/icon'
  ],

  css: ['~/assets/css/main.css'],

  // Auto-import composables
  imports: {
    dirs: ['composables']
  },

  app: {
    head: {
      title: 'AssetMaintain CM - Corrective Maintenance System',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' },
        { name: 'description', content: 'ระบบแจ้งซ่อมบำรุงสำหรับช่างหน้างาน' },
        { name: 'theme-color', content: '#00a6ff' },
        // PWA meta tags
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'CM Maintain' },
        { name: 'msapplication-TileColor', content: '#00a6ff' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'manifest', href: '/manifest.json' },
        { rel: 'apple-touch-icon', href: '/icons/icon-152x152.png' }
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
