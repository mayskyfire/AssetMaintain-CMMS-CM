export default defineNuxtPlugin(() => {
  // Don't await - run in background so it doesn't block app startup
  if (!('serviceWorker' in navigator)) return

  // Use setTimeout to not block Vue mounting
  setTimeout(async () => {
    try {
      const registration = await navigator.serviceWorker.ready

      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'SYNC_OFFLINE_QUEUE') {
          window.dispatchEvent(new CustomEvent('app:back-online'))
        }
      })

      if ('sync' in registration) {
        window.addEventListener('app:back-online', async () => {
          try {
            await (registration as any).sync.register('offline-queue-sync')
          } catch {
            // Background sync not supported
          }
        })
      }
    } catch (err) {
      console.warn('[SW] Registration failed:', err)
    }
  }, 0)
})
