import type { TechnicianJob, TechnicianJobDetail, TechnicianStats } from '~/types/api'

export const useTechnicianState = () => {
  const jobs = useState<TechnicianJob[]>('technicianJobs', () => [])
  const currentJob = useState<TechnicianJobDetail | null>('currentJob', () => null)
  const stats = useState<TechnicianStats | null>('technicianStats', () => null)
  const loading = useState<boolean>('technicianLoading', () => false)

  const setJobs = (data: TechnicianJob[]) => {
    jobs.value = data
  }

  const setCurrentJob = (data: TechnicianJobDetail | null) => {
    currentJob.value = data
  }

  const setStats = (data: TechnicianStats | null) => {
    stats.value = data
  }

  const setLoading = (value: boolean) => {
    loading.value = value
  }

  const updateJobStatus = (id: number, status: string) => {
    const index = jobs.value.findIndex(j => j.id === id)
    if (index !== -1) {
      jobs.value[index].status = status
    }
  }

  const clearState = () => {
    jobs.value = []
    currentJob.value = null
    stats.value = null
    loading.value = false
  }

  return {
    jobs: readonly(jobs),
    currentJob: readonly(currentJob),
    stats: readonly(stats),
    loading: readonly(loading),
    setJobs,
    setCurrentJob,
    setStats,
    setLoading,
    updateJobStatus,
    clearState
  }
}
