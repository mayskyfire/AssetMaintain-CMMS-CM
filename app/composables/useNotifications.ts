// Composable สำหรับจัดการ Notifications State
import { ref, computed } from 'vue'

export interface Notification {
  id: number
  type: string
  title: string
  message: string
  reference_type?: string
  reference_id?: number
  is_read: boolean
  read_at?: string
  priority: string
  metadata?: any
  created_at: string
  updated_at: string
}

export const useNotifications = () => {
  const notifications = useState<Notification[]>('notifications', () => [])
  const unreadCount = useState<number>('unreadCount', () => 0)
  const loading = useState<boolean>('notificationsLoading', () => false)

  const api = useApi()
  const { success: showSuccess, error: showError } = useToast()

  /**
   * ดึงรายการ notifications
   */
  const fetchNotifications = async (params: any = {}) => {
    loading.value = true
    try {
      const response = await api.get('/notifications', params)
      
      if (response.success && response.data) {
        notifications.value = response.data
      }
      
      return response
    } catch (error: any) {
      console.error('Failed to fetch notifications:', error)
      showError(error.message || 'ไม่สามารถโหลดการแจ้งเตือนได้')
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * ดึงจำนวน unread
   */
  const fetchUnreadCount = async () => {
    try {
      // Check if user is logged in
      if (process.client) {
        const token = localStorage.getItem('auth_token')
        if (!token) {
          unreadCount.value = 0
          return
        }
      }

      const response = await api.get('/notifications/unread-count')
      
      if (response.success && response.data) {
        unreadCount.value = response.data.count
      }
      
      return response
    } catch (error: any) {
      console.error('Failed to fetch unread count:', error)
      // Don't show error toast for unread count
      unreadCount.value = 0
    }
  }

  /**
   * Mark notification as read
   */
  const markAsRead = async (id: number) => {
    try {
      const response = await api.patch(`/notifications/${id}`, {
        isRead: true
      })
      
      if (response.success) {
        // Update local state
        const index = notifications.value.findIndex(n => n.id === id)
        if (index !== -1) {
          notifications.value[index].is_read = true
          notifications.value[index].read_at = new Date().toISOString()
        }
        
        // Update unread count
        if (unreadCount.value > 0) {
          unreadCount.value--
        }
      }
      
      return response
    } catch (error: any) {
      console.error('Failed to mark as read:', error)
      showError(error.message || 'ไม่สามารถอัพเดทได้')
      throw error
    }
  }

  /**
   * Mark all as read
   */
  const markAllAsRead = async () => {
    try {
      const response = await api.post('/notifications/mark-all-read')
      
      if (response.success) {
        // Update local state
        notifications.value.forEach(n => {
          n.is_read = true
          n.read_at = new Date().toISOString()
        })
        
        unreadCount.value = 0
        showSuccess('อ่านทั้งหมดแล้ว')
      }
      
      return response
    } catch (error: any) {
      console.error('Failed to mark all as read:', error)
      showError(error.message || 'ไม่สามารถอัพเดทได้')
      throw error
    }
  }

  /**
   * เพิ่ม notification ใหม่ (จาก SSE)
   */
  const addNotification = (notification: Notification) => {
    // Add to beginning of array
    notifications.value.unshift(notification)
    
    // Update unread count
    if (!notification.is_read) {
      unreadCount.value++
    }
  }

  /**
   * Set notifications
   */
  const setNotifications = (data: Notification[]) => {
    notifications.value = data
  }

  /**
   * Clear all
   */
  const clearNotifications = () => {
    notifications.value = []
    unreadCount.value = 0
  }

  // Computed
  const unreadNotifications = computed(() => 
    notifications.value.filter(n => !n.is_read)
  )

  const recentNotifications = computed(() => 
    notifications.value.slice(0, 10)
  )

  return {
    notifications: readonly(notifications),
    unreadCount: readonly(unreadCount),
    loading: readonly(loading),
    unreadNotifications,
    recentNotifications,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    addNotification,
    setNotifications,
    clearNotifications
  }
}
