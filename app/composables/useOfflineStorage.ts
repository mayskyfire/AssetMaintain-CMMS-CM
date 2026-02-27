const DB_NAME = 'assetmaintain-cmms'
const DB_VERSION = 1

interface OfflineQueueItem {
  id: string
  type: 'notification' | 'worklog' | 'parts' | 'closeout' | 'evaluation'
  title: string
  description: string
  createdAt: string
  data: Record<string, any>
  photos?: string[] // base64 strings
  status: 'pending' | 'syncing' | 'failed'
  retryCount: number
}

interface CachedData {
  key: string
  value: any
  expiresAt: string | null
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Offline queue store
      if (!db.objectStoreNames.contains('offlineQueue')) {
        const queueStore = db.createObjectStore('offlineQueue', { keyPath: 'id' })
        queueStore.createIndex('type', 'type', { unique: false })
        queueStore.createIndex('status', 'status', { unique: false })
        queueStore.createIndex('createdAt', 'createdAt', { unique: false })
      }

      // Cache store for API responses
      if (!db.objectStoreNames.contains('cache')) {
        const cacheStore = db.createObjectStore('cache', { keyPath: 'key' })
        cacheStore.createIndex('expiresAt', 'expiresAt', { unique: false })
      }

      // Draft store for form data
      if (!db.objectStoreNames.contains('drafts')) {
        db.createObjectStore('drafts', { keyPath: 'key' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function txOperation<T>(
  storeName: string,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await openDB()
      const tx = db.transaction(storeName, mode)
      const store = tx.objectStore(storeName)
      const request = operation(store)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
      tx.oncomplete = () => db.close()
    } catch (err) {
      reject(err)
    }
  })
}

export function useOfflineStorage() {
  // ===== OFFLINE QUEUE =====

  async function addToQueue(item: Omit<OfflineQueueItem, 'id' | 'createdAt' | 'status' | 'retryCount'>): Promise<string> {
    const queueItem: OfflineQueueItem = {
      ...item,
      id: `offline-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      createdAt: new Date().toISOString(),
      status: 'pending',
      retryCount: 0
    }
    await txOperation('offlineQueue', 'readwrite', (store) => store.put(queueItem))
    return queueItem.id
  }

  async function getQueue(): Promise<OfflineQueueItem[]> {
    return txOperation('offlineQueue', 'readonly', (store) => store.getAll())
  }

  async function getQueueByStatus(status: OfflineQueueItem['status']): Promise<OfflineQueueItem[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const db = await openDB()
        const tx = db.transaction('offlineQueue', 'readonly')
        const store = tx.objectStore('offlineQueue')
        const index = store.index('status')
        const request = index.getAll(status)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
        tx.oncomplete = () => db.close()
      } catch (err) {
        reject(err)
      }
    })
  }

  async function updateQueueItemStatus(id: string, status: OfflineQueueItem['status']): Promise<void> {
    const db = await openDB()
    const tx = db.transaction('offlineQueue', 'readwrite')
    const store = tx.objectStore('offlineQueue')

    return new Promise((resolve, reject) => {
      const getReq = store.get(id)
      getReq.onsuccess = () => {
        const item = getReq.result
        if (item) {
          item.status = status
          if (status === 'failed') item.retryCount++
          store.put(item)
        }
        resolve()
      }
      getReq.onerror = () => reject(getReq.error)
      tx.oncomplete = () => db.close()
    })
  }

  async function removeFromQueue(id: string): Promise<void> {
    await txOperation('offlineQueue', 'readwrite', (store) => store.delete(id))
  }

  async function clearQueue(): Promise<void> {
    await txOperation('offlineQueue', 'readwrite', (store) => store.clear())
  }

  async function getQueueCount(): Promise<number> {
    return txOperation('offlineQueue', 'readonly', (store) => store.count())
  }

  // ===== CACHE =====

  async function setCache(key: string, value: any, ttlMinutes?: number): Promise<void> {
    const cached: CachedData = {
      key,
      value,
      expiresAt: ttlMinutes ? new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString() : null
    }
    await txOperation('cache', 'readwrite', (store) => store.put(cached))
  }

  async function getCache<T = any>(key: string): Promise<T | null> {
    const result = await txOperation<CachedData | undefined>('cache', 'readonly', (store) => store.get(key))
    if (!result) return null
    if (result.expiresAt && new Date(result.expiresAt) < new Date()) {
      await txOperation('cache', 'readwrite', (store) => store.delete(key))
      return null
    }
    return result.value as T
  }

  async function removeCache(key: string): Promise<void> {
    await txOperation('cache', 'readwrite', (store) => store.delete(key))
  }

  async function clearExpiredCache(): Promise<void> {
    const db = await openDB()
    const tx = db.transaction('cache', 'readwrite')
    const store = tx.objectStore('cache')

    return new Promise((resolve, reject) => {
      const request = store.openCursor()
      request.onsuccess = () => {
        const cursor = request.result
        if (cursor) {
          const item = cursor.value as CachedData
          if (item.expiresAt && new Date(item.expiresAt) < new Date()) {
            cursor.delete()
          }
          cursor.continue()
        }
      }
      tx.oncomplete = () => { db.close(); resolve() }
      tx.onerror = () => reject(tx.error)
    })
  }

  // ===== DRAFTS =====

  async function saveDraft(key: string, data: any): Promise<void> {
    await txOperation('drafts', 'readwrite', (store) => store.put({ key, data, savedAt: new Date().toISOString() }))
  }

  async function getDraft<T = any>(key: string): Promise<T | null> {
    const result = await txOperation<any>('drafts', 'readonly', (store) => store.get(key))
    return result?.data ?? null
  }

  async function removeDraft(key: string): Promise<void> {
    await txOperation('drafts', 'readwrite', (store) => store.delete(key))
  }

  async function getAllDrafts(): Promise<Array<{ key: string; data: any; savedAt: string }>> {
    return txOperation('drafts', 'readonly', (store) => store.getAll())
  }

  return {
    // Queue
    addToQueue,
    getQueue,
    getQueueByStatus,
    updateQueueItemStatus,
    removeFromQueue,
    clearQueue,
    getQueueCount,
    // Cache
    setCache,
    getCache,
    removeCache,
    clearExpiredCache,
    // Drafts
    saveDraft,
    getDraft,
    removeDraft,
    getAllDrafts
  }
}

export type { OfflineQueueItem, CachedData }
