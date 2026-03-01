/**
 * Composable for managing PWA install banner dismiss state
 * Handles 24-hour dismiss period
 */

const DISMISS_KEY = 'pwa-banner-dismissed-at'
const DISMISS_HOURS = 24

export const usePwaBannerDismiss = () => {
  /**
   * Check if banner was dismissed within the last 24 hours
   */
  const isDismissed = (): boolean => {
    if (typeof window === 'undefined') return false
    
    const dismissedAt = localStorage.getItem(DISMISS_KEY)
    if (!dismissedAt) return false
    
    try {
      const dismissedTime = new Date(dismissedAt).getTime()
      const now = new Date().getTime()
      const hoursPassed = (now - dismissedTime) / (1000 * 60 * 60)
      
      // If less than 24 hours have passed, keep it dismissed
      if (hoursPassed < DISMISS_HOURS) {
        return true
      }
      
      // More than 24 hours, clear the flag
      localStorage.removeItem(DISMISS_KEY)
      return false
    } catch (error) {
      console.error('[usePwaBannerDismiss] Error checking dismiss status:', error)
      localStorage.removeItem(DISMISS_KEY)
      return false
    }
  }

  /**
   * Dismiss the banner for 24 hours
   */
  const dismissBanner = (): void => {
    if (typeof window === 'undefined') return
    
    const now = new Date().toISOString()
    localStorage.setItem(DISMISS_KEY, now)
    
    const showAgainAt = new Date(Date.now() + DISMISS_HOURS * 60 * 60 * 1000)
    console.log(`[usePwaBannerDismiss] Banner dismissed until: ${showAgainAt.toLocaleString('th-TH')}`)
  }

  /**
   * Clear dismiss state (e.g., when user installs the app)
   */
  const clearDismiss = (): void => {
    if (typeof window === 'undefined') return
    
    localStorage.removeItem(DISMISS_KEY)
    console.log('[usePwaBannerDismiss] Dismiss state cleared')
  }

  /**
   * Get remaining hours until banner shows again
   */
  const getRemainingHours = (): number => {
    if (typeof window === 'undefined') return 0
    
    const dismissedAt = localStorage.getItem(DISMISS_KEY)
    if (!dismissedAt) return 0
    
    try {
      const dismissedTime = new Date(dismissedAt).getTime()
      const now = new Date().getTime()
      const hoursPassed = (now - dismissedTime) / (1000 * 60 * 60)
      const hoursLeft = DISMISS_HOURS - hoursPassed
      
      return hoursLeft > 0 ? hoursLeft : 0
    } catch (error) {
      return 0
    }
  }

  /**
   * Get the date/time when banner will show again
   */
  const getShowAgainDate = (): Date | null => {
    if (typeof window === 'undefined') return null
    
    const dismissedAt = localStorage.getItem(DISMISS_KEY)
    if (!dismissedAt) return null
    
    try {
      const dismissedTime = new Date(dismissedAt).getTime()
      return new Date(dismissedTime + DISMISS_HOURS * 60 * 60 * 1000)
    } catch (error) {
      return null
    }
  }

  return {
    isDismissed,
    dismissBanner,
    clearDismiss,
    getRemainingHours,
    getShowAgainDate,
    DISMISS_HOURS
  }
}
