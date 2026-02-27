export default defineNuxtPlugin(() => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        })

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (!newWorker) return

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated' && navigator.serviceWorker.controller) {
              // New version available — could show a toast here
              console.log('[SW] New version available')
            }
          })
        })

        // Listen for messages from SW
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data?.type === 'SYNC_OFFLINE_QUEUE') {
            window.dispatchEvent(new CustomEvent('app:back-online'))
          }
        })

        // Register background sync if supported
        if ('sync' in registration) {
          // Will be triggered when back online
          window.addEventListener('app:back-online', async () => {
            try {
              await (registration as any).sync.register('offline-queue-sync')
            } catch {
              // Background sync not supported, handled by composable
            }
          })
        }

        console.log('[SW] Registered successfully')
      } catch (err) {
        console.error('[SW] Registration failed:', err)
      }
    })
  }
})
