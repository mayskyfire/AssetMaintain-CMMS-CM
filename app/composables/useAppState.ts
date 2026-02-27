export const useAppState = () => {
  const isInitialized = useState<boolean>('appInitialized', () => false)
  const globalLoading = useState<boolean>('globalLoading', () => false)
  const error = useState<string | null>('globalError', () => null)

  const setInitialized = (value: boolean) => {
    isInitialized.value = value
  }

  const setGlobalLoading = (value: boolean) => {
    globalLoading.value = value
  }

  const setError = (message: string | null) => {
    error.value = message
  }

  const clearError = () => {
    error.value = null
  }

  const clearAllState = () => {
    const { clearState: clearNotifications } = useNotificationState()
    const { clearState: clearTechnician } = useTechnicianState()
    const { clearState: clearSupervisor } = useSupervisorState()
    const { clearState: clearAssets } = useAssetState()

    clearNotifications()
    clearTechnician()
    clearSupervisor()
    clearAssets()
    
    isInitialized.value = false
    globalLoading.value = false
    error.value = null
  }

  return {
    isInitialized: readonly(isInitialized),
    globalLoading: readonly(globalLoading),
    error: readonly(error),
    setInitialized,
    setGlobalLoading,
    setError,
    clearError,
    clearAllState
  }
}
