import type { SupervisorInboxItem, AvailableTechnician, SupervisorStats } from '~/types/api'

export const useSupervisorState = () => {
  const inbox = useState<SupervisorInboxItem[]>('supervisorInbox', () => [])
  const technicians = useState<AvailableTechnician[]>('availableTechnicians', () => [])
  const stats = useState<SupervisorStats | null>('supervisorStats', () => null)
  const loading = useState<boolean>('supervisorLoading', () => false)

  const setInbox = (data: SupervisorInboxItem[]) => {
    inbox.value = data
  }

  const setTechnicians = (data: AvailableTechnician[]) => {
    technicians.value = data
  }

  const setStats = (data: SupervisorStats | null) => {
    stats.value = data
  }

  const setLoading = (value: boolean) => {
    loading.value = value
  }

  const removeFromInbox = (id: number) => {
    inbox.value = inbox.value.filter(item => item.id !== id)
  }

  const clearState = () => {
    inbox.value = []
    technicians.value = []
    stats.value = null
    loading.value = false
  }

  return {
    inbox: readonly(inbox),
    technicians: readonly(technicians),
    stats: readonly(stats),
    loading: readonly(loading),
    setInbox,
    setTechnicians,
    setStats,
    setLoading,
    removeFromInbox,
    clearState
  }
}
