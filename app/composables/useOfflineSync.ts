import type { OfflineQueueItem } from './useOfflineStorage'

export function useOfflineSync() {
  const { getQueueByStatus, updateQueueItemStatus, removeFromQueue, getQueueCount } = useOfflineStorage()
  const { success: showSuccess, error: showError } = useToast()

  const isSyncing = ref(false)
  const pendingCount = ref(0)

  // Simulated API call — replace with real API in production
  async function sendToServer(item: OfflineQueueItem): Promise<boolean> {
    // TODO: Replace with actual API calls per item.type
    // e.g. if (item.type === 'notification') await $fetch('/api/notifications', { method: 'POST', body: item.data })
    await new Promise(resolve => setTimeout(resolve, 800))
    // Simulate 90% success rate
    return Math.random() > 0.1
  }

  async function refreshCount() {
    pendingCount.value = await getQueueCount()
  }

  async function syncAll(): Promise<{ synced: number; failed: number }> {
    if (isSyncing.value) return { synced: 0, failed: 0 }

    isSyncing.value = true
    let synced = 0
    let failed = 0

    try {
      const pendingItems = await getQueueByStatus('pending')
      const failedItems = await getQueueByStatus('failed')
      const allItems = [...pendingItems, ...failedItems.filter(i => i.retryCount < 3)]

      for (const item of allItems) {
        try {
          await updateQueueItemStatus(item.id, 'syncing')
          const success = await sendToServer(item)

          if (success) {
            await removeFromQueue(item.id)
            synced++
          } else {
            await updateQueueItemStatus(item.id, 'failed')
            failed++
          }
        } catch {
          await updateQueueItemStatus(item.id, 'failed')
          failed++
        }
      }

      if (synced > 0) {
        showSuccess(`ซิงค์สำเร็จ ${synced} รายการ`)
      }
      if (failed > 0) {
        showError(`ซิงค์ไม่สำเร็จ ${failed} รายการ`)
      }
    } finally {
      isSyncing.value = false
      await refreshCount()
    }

    return { synced, failed }
  }

  // Auto-sync when back online
  const handleBackOnline = () => {
    syncAll()
  }

  onMounted(() => {
    refreshCount()
    window.addEventListener('app:back-online', handleBackOnline)
  })

  onUnmounted(() => {
    window.removeEventListener('app:back-online', handleBackOnline)
  })

  return {
    isSyncing,
    pendingCount,
    syncAll,
    refreshCount
  }
}
