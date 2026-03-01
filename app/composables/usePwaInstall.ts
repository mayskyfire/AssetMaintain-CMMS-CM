export function usePwaInstall() {
  // These are set by the pwa-install.client.ts plugin at the earliest moment
  const deferredPrompt = useState<any>('pwa-deferred-prompt', () => null)
  const canInstall = useState<boolean>('pwa-can-install', () => false)
  const isInstalled = useState<boolean>('pwa-is-installed', () => false)

  async function promptInstall(): Promise<boolean> {
    if (!deferredPrompt.value) {
      console.log('[PWA] No deferred prompt available (dev mode or browser does not support)')
      // In dev mode, just simulate success
      if (import.meta.dev) {
        console.log('[PWA] Dev mode - simulating install')
        return true
      }
      return false
    }

    console.log('[PWA] Showing install prompt')
    deferredPrompt.value.prompt()
    const { outcome } = await deferredPrompt.value.userChoice
    console.log('[PWA] User choice:', outcome)
    deferredPrompt.value = null
    canInstall.value = false

    return outcome === 'accepted'
  }

  return { canInstall, isInstalled, promptInstall }
}
