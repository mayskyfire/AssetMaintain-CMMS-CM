import type {
  TechnicianJobsRequest,
  TechnicianJobsResponse,
  TechnicianJobDetailResponse,
  AcceptJobRequest,
  AcceptJobResponse,
  AddWorklogRequest,
  AddWorklogResponse,
  RequestPartsRequest,
  RequestPartsResponse,
  CloseoutJobRequest,
  CloseoutJobResponse,
  TechnicianStatsResponse
} from '../../types/api'

export const useTechnicianService = () => {
  const api = useApi()
  const state = useTechnicianState()
  const { success: showSuccess, error: showError } = useToast()

  const getJobs = async (params?: TechnicianJobsRequest) => {
    state.setLoading(true)
    try {
      const response = await api.get<TechnicianJobsResponse>('/technician/jobs', params)

      if (response.success && response.data) {
        state.setJobs(response.data)
      }

      return response
    } catch (error: any) {
      showError(error.message || 'ไม่สามารถโหลดข้อมูลได้')
      throw error
    } finally {
      state.setLoading(false)
    }
  }

  const getJobDetail = async (id: number) => {
    state.setLoading(true)
    try {
      const response = await api.get<TechnicianJobDetailResponse>(`/technician/jobs/${id}`)

      if (response.success && response.data) {
        state.setCurrentJob(response.data)
      }

      return response
    } catch (error: any) {
      showError(error.message || 'ไม่สามารถโหลดข้อมูลได้')
      throw error
    } finally {
      state.setLoading(false)
    }
  }

  const acceptJob = async (data: AcceptJobRequest) => {
    state.setLoading(true)
    try {
      const response = await api.post<AcceptJobResponse>(`/technician/jobs/${data.cm_history_id}/accept`, data)

      if (response.success) {
        showSuccess('รับงานสำเร็จ')
        state.updateJobStatus(data.cm_history_id, 'in_progress')
      }

      return response
    } catch (error: any) {
      showError(error.message || 'รับงานไม่สำเร็จ')
      throw error
    } finally {
      state.setLoading(false)
    }
  }

  const addWorklog = async (id: number, data: AddWorklogRequest) => {
    state.setLoading(true)
    try {
      const response = await api.post<AddWorklogResponse>(`/technician/jobs/${id}/worklog`, data)

      if (response.success) {
        showSuccess('บันทึกการทำงานสำเร็จ')
      }

      return response
    } catch (error: any) {
      showError(error.message || 'บันทึกการทำงานไม่สำเร็จ')
      throw error
    } finally {
      state.setLoading(false)
    }
  }

  const getParts = async (id: number) => {
    state.setLoading(true)
    try {
      const response = await api.get<any>(`/technician/jobs/${id}/parts`)

      return response
    } catch (error: any) {
      showError(error.message || 'ไม่สามารถโหลดข้อมูลอะไหล่ได้')
      throw error
    } finally {
      state.setLoading(false)
    }
  }

  const requestParts = async (id: number, data: RequestPartsRequest) => {
    state.setLoading(true)
    try {
      const response = await api.post<RequestPartsResponse>(`/technician/jobs/${id}/parts`, data)

      if (response.success) {
        showSuccess('บันทึกอะไหล่สำเร็จ')
      }

      return response
    } catch (error: any) {
      showError(error.message || 'บันทึกอะไหล่ไม่สำเร็จ')
      throw error
    } finally {
      state.setLoading(false)
    }
  }

  const closeoutJob = async (id: number, data: CloseoutJobRequest) => {
    state.setLoading(true)
    try {
      const response = await api.post<CloseoutJobResponse>(`/technician/jobs/${id}/closeout`, data)

      if (response.success) {
        showSuccess('ปิดงานสำเร็จ')
        state.updateJobStatus(id, 'completed')
      }

      return response
    } catch (error: any) {
      showError(error.message || 'ปิดงานไม่สำเร็จ')
      throw error
    } finally {
      state.setLoading(false)
    }
  }

  const getStats = async () => {
    try {
      const response = await api.get<TechnicianStatsResponse>('/technician/stats')

      if (response.success && response.data) {
        state.setStats(response.data)
      }

      return response
    } catch (error: any) {
      throw error
    }
  }

  return {
    getJobs,
    getJobDetail,
    acceptJob,
    addWorklog,
    getParts,
    requestParts,
    closeoutJob,
    getStats
  }
}
