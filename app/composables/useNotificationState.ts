import type { NotificationListItem, NotificationDetail } from '~/types/api'

export const useNotificationState = () => {
  const notifications = useState<NotificationListItem[]>('notifications', () => [])
  const currentNotification = useState<NotificationDetail | null>('currentNotification', () => null)
  const loading = useState<boolean>('notificationsLoading', () => false)
  const pagination = useState('notificationsPagination', () => ({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  }))

  const setNotifications = (data: NotificationListItem[]) => {
    notifications.value = data
  }

  const setCurrentNotification = (data: NotificationDetail | null) => {
    currentNotification.value = data
  }

  const setLoading = (value: boolean) => {
    loading.value = value
  }

  const setPagination = (data: { page: number; limit: number; total: number; totalPages: number }) => {
    pagination.value = data
  }

  const updateNotificationStatus = (id: number, status: string) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index !== -1) {
      notifications.value[index].status = status
    }
  }

  const clearState = () => {
    notifications.value = []
    currentNotification.value = null
    loading.value = false
    pagination.value = { page: 1, limit: 20, total: 0, totalPages: 0 }
  }

  return {
    notifications: readonly(notifications),
    currentNotification: readonly(currentNotification),
    loading: readonly(loading),
    pagination: readonly(pagination),
    setNotifications,
    setCurrentNotification,
    setLoading,
    setPagination,
    updateNotificationStatus,
    clearState
  }
}
