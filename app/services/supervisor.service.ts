import type {
  SupervisorInboxItem,
  AssignTechnicianRequest,
  SupervisorStats,
  UserInfo
} from '~/types/api'

export function useSupervisorService() {
  const { get, post } = useApi()

  async function getInbox(): Promise<SupervisorInboxItem[]> {
    const response = await get<SupervisorInboxItem[]>('/supervisor/inbox')
    if (response.success && response.data) {
      return response.data
    }
    throw new Error('Failed to fetch inbox')
  }

  async function getAvailableTechnicians(): Promise<UserInfo[]> {
    const response = await get<UserInfo[]>('/supervisor/technicians')
    if (response.success && response.data) {
      return response.data
    }
    throw new Error('Failed to fetch technicians')
  }

  async function assignTechnician(data: AssignTechnicianRequest): Promise<void> {
    const response = await post(`/supervisor/assign`, data)
    if (!response.success) {
      throw new Error('Failed to assign technician')
    }
  }

  async function getStats(): Promise<SupervisorStats> {
    const response = await get<SupervisorStats>('/supervisor/stats')
    if (response.success && response.data) {
      return response.data
    }
    throw new Error('Failed to fetch stats')
  }

  return {
    getInbox,
    getAvailableTechnicians,
    assignTechnician,
    getStats
  }
}
