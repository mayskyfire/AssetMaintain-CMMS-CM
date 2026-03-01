import type { OfflineQueueItem } from './useOfflineStorage'

export function useOfflineSync() {
  const { getQueueByStatus, updateQueueItemStatus, removeFromQueue, getQueueCount } = useOfflineStorage()
  const { success: showSuccess, error: showError } = useToast()
  const { post } = useApi()

  const isSyncing = ref(false)
  const pendingCount = ref(0)

  // Route each queue item to its real API endpoint
  async function sendToServer(item: OfflineQueueItem): Promise<boolean> {
    const { type, data, photos } = item

    switch (type) {
      case 'notification': {
        // POST /api/cm/notifications
        const body: Record<string, any> = {
          asset_id: data.asset_id,
          problem_description: data.problem_description,
          priority: data.priority || 'medium',
          problem_category: data.problem_category || '',
          requester_id: data.requester_id
        }
        // Upload photos as base64 if present
        if (photos && photos.length > 0) {
          const uploadedUrls = await uploadPhotos(data.asset_id, 'evidence', photos)
          body.photos = uploadedUrls
        }
        await post('cm/notifications', body)
        return true
      }

      case 'closeout': {
        // POST /api/technician/jobs/:id/closeout
        const jobId = data.job_id || data.cm_history_id
        if (!jobId) throw new Error('Missing job_id for closeout')

        const body: Record<string, any> = {
          root_cause: data.root_cause,
          corrective_action: data.corrective_action,
          preventive_recommendation: data.preventive_recommendation || '',
          labor_hours: data.labor_hours || 0,
          labor_cost: data.labor_cost || 0,
          parts_cost: data.parts_cost || 0,
          external_cost: data.external_cost || 0,
          completion_date: data.completion_date || new Date().toISOString(),
          completed_by: data.completed_by || 'ช่าง'
        }
        // Upload after-photos if present
        if (photos && photos.length > 0) {
          const uploadedUrls = await uploadPhotos(jobId, 'after', photos)
          body.photos = uploadedUrls
        }
        await post(`technician/jobs/${jobId}/closeout`, body)
        return true
      }

      case 'parts': {
        // POST /api/technician/jobs/:id/parts
        const jobId = data.job_id || data.cm_history_id
        if (!jobId) throw new Error('Missing job_id for parts')

        await post(`technician/jobs/${jobId}/parts`, {
          parts: data.parts || []
        })
        return true
      }

      case 'evaluation': {
        // POST /api/cm/notifications/:id/evaluate
        const notificationId = data.notification_id || data.cm_history_id
        if (!notificationId) throw new Error('Missing notification_id for evaluation')

        await post(`cm/notifications/${notificationId}/evaluate`, {
          satisfaction_rating: data.satisfaction_rating,
          satisfaction_comment: data.satisfaction_comment || '',
          evaluated_by: data.evaluated_by || 'ผู้ใช้งาน'
        })
        return true
      }

      case 'worklog': {
        // Worklog is stored locally — no dedicated API endpoint yet
        // Save as part of closeout data or skip
        console.warn('[OfflineSync] worklog type has no dedicated API — skipping')
        return true
      }

      default:
        console.warn(`[OfflineSync] Unknown queue item type: ${type}`)
        return false
    }
  }

  // Upload base64 photos and return server URLs
  async function uploadPhotos(entityId: number | string, imageType: 'evidence' | 'before' | 'after', base64Photos: string[]): Promise<string[]> {
    const { uploadBase64Image } = useImageUpload()
    const urls: string[] = []

    for (let i = 0; i < base64Photos.length; i++) {
      const photo = base64Photos[i]
      if (!photo) continue
      try {
        const result = await uploadBase64Image(
          Number(entityId),
          imageType,
          photo,
          `${imageType}-offline-${Date.now()}-${i}.jpg`
        )
        urls.push(result.path)
      } catch (err) {
        console.error(`[OfflineSync] Failed to upload photo ${i}:`, err)
        // Continue with remaining photos
      }
    }

    return urls
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
        } catch (err) {
          console.error(`[OfflineSync] Failed to sync item ${item.id} (${item.type}):`, err)
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
