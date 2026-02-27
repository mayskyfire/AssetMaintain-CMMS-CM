export function useNetworkStatus() {
  const isOnline = ref(true)
  const wasOffline = ref(false)

  const updateStatus = () => {
    const online = navigator.onLine
    if (!online) wasOffline.value = true
    if (online && wasOffline.value) {
      wasOffline.value = false
      // Trigger sync when back online
      window.dispatchEvent(new CustomEvent('app:back-online'))
    }
    isOnline.value = online
  }

  onMounted(() => {
    isOnline.value = navigator.onLine
    window.addEventListener('online', updateStatus)
    window.addEventListener('offline', updateStatus)
  })

  onUnmounted(() => {
    window.removeEventListener('online', updateStatus)
    window.removeEventListener('offline', updateStatus)
  })

  return { isOnline, wasOffline }
}
