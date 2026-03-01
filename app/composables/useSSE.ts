// Composable สำหรับจัดการ SSE Connection
import { ref, onMounted, onUnmounted } from 'vue'

export const useSSE = () => {
  const isConnected = ref(false)
  const connectionId = ref<string | null>(null)
  const lastHeartbeat = ref<Date | null>(null)
  const reconnectAttempts = ref(0)
  const maxReconnectAttempts = 10

  let eventSource: EventSource | null = null
  let reconnectTimeout: NodeJS.Timeout | null = null
  let heartbeatCheckInterval: NodeJS.Timeout | null = null

  const { success: showSuccess, error: showError } = useToast()

  /**
   * เชื่อมต่อ SSE
   */
  const connect = () => {
    if (eventSource && eventSource.readyState !== EventSource.CLOSED) {
      console.log('SSE already connected or connecting')
      return // Already connected
    }

    try {
      // Get auth token
      const token = process.client ? localStorage.getItem('auth_token') : null
      
      if (!token) {
        console.warn('No auth token found, cannot connect SSE')
        return
      }

      console.log('Connecting to SSE...')
      
      // Create SSE connection with token in query parameter
      const url = `/api/notifications/sse?token=${encodeURIComponent(token)}`
      eventSource = new EventSource(url)

      eventSource.onopen = () => {
        console.log('✅ SSE Connected')
        isConnected.value = true
        reconnectAttempts.value = 0
        
        // Start heartbeat check
        startHeartbeatCheck()
      }

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          handleSSEMessage(data)
        } catch (error) {
          console.error('Failed to parse SSE message:', error)
        }
      }

      eventSource.onerror = (error) => {
        console.error('❌ SSE Error:', error)
        isConnected.value = false
        
        // Stop heartbeat check
        stopHeartbeatCheck()
        
        // Close existing connection
        if (eventSource) {
          eventSource.close()
          eventSource = null
        }

        // Auto reconnect with exponential backoff
        if (reconnectAttempts.value < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.value), 30000)
          console.log(`🔄 Reconnecting in ${delay}ms... (attempt ${reconnectAttempts.value + 1}/${maxReconnectAttempts})`)
          
          reconnectTimeout = setTimeout(() => {
            reconnectAttempts.value++
            connect()
          }, delay)
        } else {
          console.error('Max reconnect attempts reached')
          showError('ไม่สามารถเชื่อมต่อระบบแจ้งเตือนได้')
        }
      }
    } catch (error) {
      console.error('Failed to create SSE connection:', error)
      isConnected.value = false
    }
  }

  /**
   * ตัดการเชื่อมต่อ SSE
   */
  const disconnect = () => {
    console.log('Disconnecting SSE...')
    
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
      reconnectTimeout = null
    }

    stopHeartbeatCheck()

    if (eventSource) {
      eventSource.close()
      eventSource = null
    }

    isConnected.value = false
    connectionId.value = null
  }

  /**
   * เริ่มตรวจสอบ heartbeat
   */
  const startHeartbeatCheck = () => {
    stopHeartbeatCheck()
    
    // Check heartbeat every 45 seconds (server sends every 30s)
    heartbeatCheckInterval = setInterval(() => {
      if (lastHeartbeat.value) {
        const now = new Date()
        const diff = now.getTime() - lastHeartbeat.value.getTime()
        
        // If no heartbeat for 60 seconds, reconnect
        if (diff > 60000) {
          console.warn('⚠️ No heartbeat received for 60s, reconnecting...')
          disconnect()
          connect()
        }
      }
    }, 45000)
  }

  /**
   * หยุดตรวจสอบ heartbeat
   */
  const stopHeartbeatCheck = () => {
    if (heartbeatCheckInterval) {
      clearInterval(heartbeatCheckInterval)
      heartbeatCheckInterval = null
    }
  }


  /**
   * จัดการข้อความจาก SSE
   */
  const handleSSEMessage = async (data: any) => {
    switch (data.type) {
      case 'connected':
        connectionId.value = data.connectionId
        console.log('✅ SSE Connection ID:', data.connectionId)
        // Fetch missed notifications
        await fetchMissedNotifications()
        break

      case 'heartbeat':
        lastHeartbeat.value = new Date(data.timestamp)
        console.log('💓 Heartbeat received')
        break

      case 'notification':
        console.log('🔔 New notification received:', data.data)
        handleNewNotification(data.data)
        break

      case 'broadcast':
        console.log('📢 Broadcast message:', data.data)
        break

      default:
        console.log('❓ Unknown SSE message type:', data.type)
    }
  }

  /**
   * จัดการ notification ใหม่
   */
  const handleNewNotification = (notification: any) => {
    console.log('Processing notification:', notification)
    
    // Update notifications state
    const notificationsState = useNotifications()
    notificationsState.addNotification(notification)

    // Show toast
    showSuccess(notification.title)

    // Play sound
    playNotificationSound()

    // Show browser notification if permitted
    showBrowserNotification(notification)
  }

  /**
   * ดึง notifications ที่พลาด
   */
  const fetchMissedNotifications = async () => {
    try {
      const notificationsState = useNotifications()
      // แค่ update unread count ไม่ต้อง set notifications เพราะจะไปกระทบกับหน้า notifications.vue
      await notificationsState.fetchUnreadCount()
    } catch (error) {
      console.error('Failed to fetch missed notifications:', error)
    }
  }

  /**
   * เล่นเสียงแจ้งเตือน
   */
  const playNotificationSound = () => {
    try {
      const audio = new Audio('/sounds/notification.mp3')
      audio.volume = 0.5
      audio.play().catch(console.error)
    } catch (error) {
      console.error('Failed to play notification sound:', error)
    }
  }

  /**
   * แสดง browser notification
   */
  const showBrowserNotification = (notification: any) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/icon.png',
        badge: '/badge.png',
        tag: `notification-${notification.id}`
      })
    }
  }

  /**
   * ขอสิทธิ์ browser notification
   */
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }
    return Notification.permission === 'granted'
  }

  // Auto connect on mount
  onMounted(() => {
    console.log('🚀 Mounting SSE composable')
    connect()
    
    // Reconnect when page becomes visible again
    if (process.client) {
      document.addEventListener('visibilitychange', handleVisibilityChange)
    }
  })

  // Disconnect on unmount
  onUnmounted(() => {
    console.log('👋 Unmounting SSE composable')
    disconnect()
    
    if (process.client) {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  })

  /**
   * Handle page visibility change
   */
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      console.log('📱 Page visible, checking SSE connection...')
      // If not connected, try to reconnect
      if (!isConnected.value) {
        console.log('🔄 Reconnecting SSE...')
        reconnectAttempts.value = 0 // Reset attempts
        connect()
      }
    }
  }

  return {
    isConnected: readonly(isConnected),
    connectionId: readonly(connectionId),
    lastHeartbeat: readonly(lastHeartbeat),
    connect,
    disconnect,
    requestNotificationPermission
  }
}
