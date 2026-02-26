// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  devServer: {
    port: 3002
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
        { name: 'theme-color', content: '#00a6ff' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
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
