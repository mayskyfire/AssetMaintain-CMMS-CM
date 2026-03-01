// Composable สำหรับ initialize notification system
export const useNotificationInit = () => {
  const { connect, requestNotificationPermission, isConnected } = useSSE()
  const { fetchUnreadCount } = useNotifications()
  const { user } = useAuth()

  const initialize = async () => {
    // ตรวจสอบว่า user login แล้ว
    if (!user.value) {
      console.log('User not logged in, skipping notification initialization')
      return
    }

    // ตรวจสอบว่ามี token
    if (process.client) {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        console.log('No auth token found, skipping notification initialization')
        return
      }
    }

    // ตรวจสอบว่ายังไม่ได้ connect
    if (isConnected.value) {
      console.log('SSE already connected')
      return
    }

    try {
      // Connect SSE
      connect()

      // Request browser notification permission
      await requestNotificationPermission()

      // Fetch initial unread count
      await fetchUnreadCount()
      
      console.log('Notification system initialized successfully')
    } catch (error) {
      console.error('Failed to initialize notification system:', error)
    }
  }

  return {
    initialize
  }
}
