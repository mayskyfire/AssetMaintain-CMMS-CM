export default defineNuxtRouteMiddleware((to) => {
  // Skip middleware on server-side
  if (import.meta.server) return

  try {
    const { isAuthenticated } = useAuth()

    // Public routes that don't require authentication
    const publicRoutes = ['/']

    // Check if route requires auth
    const requiresAuth = !publicRoutes.includes(to.path)

    if (requiresAuth && !isAuthenticated()) {
      // Redirect to login if not authenticated
      return navigateTo('/')
    }

    // Redirect for '/' is handled by index.vue page-level middleware
  } catch (error) {
    console.error('Auth middleware error:', error)
    // Don't block navigation on error
    return
  }
})
