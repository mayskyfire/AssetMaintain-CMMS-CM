export default defineNuxtRouteMiddleware((to) => {
  // Skip middleware on server-side
  if (process.server) return

  // Skip on initial load to prevent hydration issues
  if (!process.client) return

  try {
    const { isAuthenticated, getUserInfo } = useAuth()

    // Public routes that don't require authentication
    const publicRoutes = ['/']

    // Check if route requires auth
    const requiresAuth = !publicRoutes.includes(to.path)

    if (requiresAuth && !isAuthenticated()) {
      // Redirect to login if not authenticated
      return navigateTo('/')
    }

    // If authenticated and trying to access login page, redirect to appropriate home
    if (to.path === '/' && isAuthenticated()) {
      const user = getUserInfo()
      if (user) {
        switch (user.role) {
          case 'requester':
            return navigateTo('/requester/')
          case 'technician':
            return navigateTo('/technician/jobs')
          case 'planner':
          case 'engineer':
            return navigateTo('/supervisor/inbox')
          default:
            return navigateTo('/requester/')
        }
      }
    }
  } catch (error) {
    console.error('Auth middleware error:', error)
    // Don't block navigation on error
    return
  }
})
