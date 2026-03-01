export const useAppLoader = () => {
  const isLoading = useState('app-loader-loading', () => true)
  const progress = useState('app-loader-progress', () => 0)
  const loadingText = useState('app-loader-text', () => 'กำลังโหลด...')

  const setLoading = (loading: boolean) => {
    isLoading.value = loading
  }

  const setProgress = (value: number) => {
    progress.value = Math.min(100, Math.max(0, value))
  }

  const setLoadingText = (text: string) => {
    loadingText.value = text
  }

  const startLoading = (text?: string) => {
    isLoading.value = true
    progress.value = 0
    if (text) loadingText.value = text
  }

  const finishLoading = () => {
    progress.value = 100
    setTimeout(() => {
      isLoading.value = false
    }, 300)
  }

  return {
    isLoading: readonly(isLoading),
    progress: readonly(progress),
    loadingText: readonly(loadingText),
    setLoading,
    setProgress,
    setLoadingText,
    startLoading,
    finishLoading
  }
}
