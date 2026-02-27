import type {
  TechnicianJob,
  AcceptJobRequest,
  WorklogEntry,
  PartsRequest,
  CloseoutRequest,
  TechnicianStats
} from '~/types/api'

export function useTechnicianService() {
  const { get, post, put } = useApi()

  async function getMyJobs(status?: string): Promise<TechnicianJob[]> {
    const response = await get<TechnicianJob[]>('/technician/jobs', { status })
    if (response.success && response.data) {
      return response.data
    }
    throw new Error('Failed to fetch jobs')
  }

  async function getJobById(id: number): Promise<TechnicianJob> {
    const response = await get<TechnicianJob>(`/technician/jobs/${id}`)
    if (response.success && response.data) {
      return response.data
    }
    throw new Error('Failed to fetch job detail')
  }

  async function acceptJob(data: AcceptJobRequest): Promise<void> {
    const response = await post(`/technician/jobs/${data.cm_history_id}/accept`, data)
    if (!response.success) {
      throw new Error('Failed to accept job')
    }
  }

  async function addWorklog(data: WorklogEntry): Promise<void> {
    const response = await post(`/technician/jobs/${data.cm_history_id}/worklog`, data)
    if (!response.success) {
      throw new Error('Failed to add worklog')
    }
  }

  async function requestParts(data: PartsRequest): Promise<void> {
    const response = await post(`/technician/jobs/${data.cm_history_id}/parts`, data)
    if (!response.success) {
      throw new Error('Failed to request parts')
    }
  }

  async function closeoutJob(data: CloseoutRequest): Promise<void> {
    const response = await post(`/technician/jobs/${data.cm_history_id}/closeout`, data)
    if (!response.success) {
      throw new Error('Failed to closeout job')
    }
  }

  async function getMyStats(): Promise<TechnicianStats> {
    const response = await get<TechnicianStats>('/technician/stats')
    if (response.success && response.data) {
      return response.data
    }
    throw new Error('Failed to fetch stats')
  }

  return {
    getMyJobs,
    getJobById,
    acceptJob,
    addWorklog,
    requestParts,
    closeoutJob,
    getMyStats
  }
}
