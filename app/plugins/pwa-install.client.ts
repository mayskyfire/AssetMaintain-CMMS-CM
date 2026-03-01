// Capture beforeinstallprompt at the earliest possible moment
// This MUST run before any component mounts, otherwise the event is lost

export default defineNuxtPlugin(() => {
  const deferredPrompt = useState<any>('pwa-deferred-prompt', () => null)
  const canInstall = useState<boolean>('pwa-can-install', () => false)
  const isInstalled = useState<boolean>('pwa-is-installed', () => false)

  if (typeof window === 'undefined') {
    return
  }

  // Check if already installed
  if (window.matchMedia('(display-mode: standalone)').matches) {
    isInstalled.value = true
    console.log('[PWA] Already installed in standalone mode')
    return
  }

  // Check if running as PWA
  if (window.navigator.standalone === true) {
    isInstalled.value = true
    console.log('[PWA] Running as iOS PWA')
    return
  }

  // DEBUG MODE: Force show install banner in dev
  const isDev = import.meta.dev
  if (isDev) {
    console.log('[PWA] Dev mode - forcing install banner to show')
    canInstall.value = true
    
    // Create a mock deferred prompt for dev mode
    deferredPrompt.value = {
      prompt: () => {
        console.log('[PWA] Mock prompt shown (dev mode)')
        return Promise.resolve()
      },
      userChoice: Promise.resolve({ outcome: 'accepted' })
    }
  }

  // Listen for real install prompt
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    console.log('[PWA] beforeinstallprompt event fired!')
    e.preventDefault()
    deferredPrompt.value = e
    canInstall.value = true
    console.log('[PWA] Install prompt captured and ready')
  })

  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App installed successfully')
    canInstall.value = false
    isInstalled.value = true
    deferredPrompt.value = null
  })

  // Log initial state
  console.log('[PWA] Install plugin initialized', { 
    canInstall: canInstall.value, 
    isInstalled: isInstalled.value,
    isDev,
    standalone: window.matchMedia('(display-mode: standalone)').matches
  })
})
