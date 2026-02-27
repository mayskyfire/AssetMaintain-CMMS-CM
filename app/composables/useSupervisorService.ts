import type {
  SupervisorInboxRequest,
  SupervisorInboxResponse,
  AvailableTechniciansResponse,
  AssignTechnicianRequest,
  AssignTechnicianResponse,
  SupervisorStatsResponse
} from '~/types/api'

export const useSupervisorService = () => {
  const api = useApi()
  const state = useSupervisorState()
  const { success: showSuccess, error: showError } = useToast()

  const getInbox = async (params?: SupervisorInboxRequest) => {
    state.setLoading(true)
    try {
      const response = await api.get<SupervisorInboxResponse>('/supervisor/inbox', params)

      if (response.success && response.data) {
        state.setInbox(response.data)
      }

      return response
    } catch (error: any) {
      showError(error.message || 'ไม่สามารถโหลดข้อมูลได้')
      throw error
    } finally {
      state.setLoading(false)
    }
  }

  const getTechnicians = async () => {
    state.setLoading(true)
    try {
      const response = await api.get<AvailableTechniciansResponse>('/supervisor/technicians')

      if (response.success && response.data) {
        state.setTechnicians(response.data)
      }

      return response
    } catch (error: any) {
      showError(error.message || 'ไม่สามารถโหลดข้อมูลได้')
      throw error
    } finally {
      state.setLoading(false)
    }
  }

  const assignTechnician = async (data: AssignTechnicianRequest) => {
    state.setLoading(true)
    try {
      const response = await api.post<AssignTechnicianResponse>('/supervisor/assign', data)

      if (response.success) {
        showSuccess('มอบหมายงานสำเร็จ')
        state.removeFromInbox(data.cm_notification_id)
      }

      return response
    } catch (error: any) {
      showError(error.message || 'มอบหมายงานไม่สำเร็จ')
      throw error
    } finally {
      state.setLoading(false)
    }
  }

  const getStats = async () => {
    try {
      const response = await api.get<SupervisorStatsResponse>('/supervisor/stats')

      if (response.success && response.data) {
        state.setStats(response.data)
      }

      return response
    } catch (error: any) {
      throw error
    }
  }

  return {
    getInbox,
    getTechnicians,
    assignTechnician,
    getStats
  }
}
