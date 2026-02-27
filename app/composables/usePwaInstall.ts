export function usePwaInstall() {
  const deferredPrompt = ref<any>(null)
  const canInstall = ref(false)
  const isInstalled = ref(false)

  onMounted(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      isInstalled.value = true
      return
    }

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault()
      deferredPrompt.value = e
      canInstall.value = true
    })

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      canInstall.value = false
      isInstalled.value = true
      deferredPrompt.value = null
    })
  })

  async function promptInstall(): Promise<boolean> {
    if (!deferredPrompt.value) return false

    deferredPrompt.value.prompt()
    const { outcome } = await deferredPrompt.value.userChoice
    deferredPrompt.value = null
    canInstall.value = false

    return outcome === 'accepted'
  }

  return { canInstall, isInstalled, promptInstall }
}
