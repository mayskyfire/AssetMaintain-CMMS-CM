import type {
  NotificationListRequest,
  NotificationListResponse,
  NotificationDetailResponse,
  CreateNotificationRequest,
  CreateNotificationResponse,
  EvaluateNotificationRequest,
  EvaluateNotificationResponse
} from '../../types/api'

export const useNotificationService = () => {
  const api = useApi()
  const state = useNotificationState()
  const { success: showSuccess, error: showError } = useToast()

  const getNotifications = async (params: NotificationListRequest) => {
    state.setLoading(true)
    try {
      const response = await api.get<any>('cm/notifications', params)

      if (response.success && response.data) {
        // response.data is the array of notifications
        const notifications = Array.isArray(response.data) ? response.data : []
        state.setNotifications(notifications)
        
        // response.pagination contains pagination info
        if (response.pagination) {
          state.setPagination(response.pagination)
        }
      }

      return response
    } catch (error: any) {
      console.error('getNotifications error:', error)
      showError(error.message || 'ไม่สามารถโหลดข้อมูลได้')
      // Set empty array on error
      state.setNotifications([])
      throw error
    } finally {
      state.setLoading(false)
    }
  }

  const getNotificationDetail = async (id: number) => {
    state.setLoading(true)
    try {
      const response = await api.get<NotificationDetailResponse>(`cm/notifications/${id}`)

      if (response.success && response.data) {
        state.setCurrentNotification(response.data)
      }

      return response
    } catch (error: any) {
      console.error('getNotificationDetail error:', error)
      showError(error.message || 'ไม่สามารถโหลดข้อมูลได้')
      throw error
    } finally {
      state.setLoading(false)
    }
  }

  const createNotification = async (data: CreateNotificationRequest) => {
    state.setLoading(true)
    try {
      const response = await api.post<CreateNotificationResponse>('cm/notifications', data)

      if (response.success) {
        showSuccess('สร้างใบแจ้งซ่อมสำเร็จ')
      }

      return response
    } catch (error: any) {
      console.error('createNotification error:', error)
      showError(error.message || 'สร้างใบแจ้งซ่อมไม่สำเร็จ')
      throw error
    } finally {
      state.setLoading(false)
    }
  }

  const evaluateNotification = async (id: number, data: EvaluateNotificationRequest) => {
    state.setLoading(true)
    try {
      const response = await api.post<EvaluateNotificationResponse>(`cm/notifications/${id}/evaluate`, data)

      if (response.success) {
        showSuccess('ส่งแบบประเมินสำเร็จ')
        state.updateNotificationStatus(id, 'evaluated')
      }

      return response
    } catch (error: any) {
      console.error('evaluateNotification error:', error)
      showError(error.message || 'ส่งแบบประเมินไม่สำเร็จ')
      throw error
    } finally {
      state.setLoading(false)
    }
  }

  return {
    getNotifications,
    getNotificationDetail,
    createNotification,
    evaluateNotification
  }
}
