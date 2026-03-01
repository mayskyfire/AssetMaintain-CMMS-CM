export default defineNuxtPlugin(async () => {
  if (!('serviceWorker' in navigator)) return

  // Wait for SW to be ready (registered by @vite-pwa/nuxt)
  try {
    const registration = await navigator.serviceWorker.ready

    // Listen for messages from SW (offline queue sync trigger)
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'SYNC_OFFLINE_QUEUE') {
        window.dispatchEvent(new CustomEvent('app:back-online'))
      }
    })

    // Register background sync if supported
    if ('sync' in registration) {
      window.addEventListener('app:back-online', async () => {
        try {
          await (registration as any).sync.register('offline-queue-sync')
        } catch {
          // Background sync not supported, handled by composable
        }
      })
    }
  } catch (err) {
    console.error('[SW] Ready failed:', err)
  }
})
