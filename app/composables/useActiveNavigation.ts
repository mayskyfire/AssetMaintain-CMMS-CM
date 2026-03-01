/**
 * Composable for managing active navigation state
 * Saves and retrieves the last active page for BottomNav
 */
export const useActiveNavigation = () => {
  const route = useRoute()

  /**
   * Save current page as the last active page
   */
  const saveCurrentPage = () => {
    if (typeof window !== 'undefined') {
      // Don't save notification page as active
      if (route.path !== '/notifications') {
        localStorage.setItem('lastActivePage', route.path)
      }
    }
  }

  /**
   * Get the last active page from localStorage
   */
  const getLastActivePage = (defaultPath: string = '/'): string => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('lastActivePage') || defaultPath
    }
    return defaultPath
  }

  /**
   * Clear the last active page
   */
  const clearLastActivePage = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('lastActivePage')
    }
  }

  return {
    saveCurrentPage,
    getLastActivePage,
    clearLastActivePage
  }
}
