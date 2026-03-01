export default defineNuxtRouteMiddleware((to) => {
  // Skip middleware on server-side
  if (import.meta.server) return

  try {
    const { isAuthenticated, user } = useAuth()

    // Public routes that don't require authentication
    const publicRoutes = ['/']

    // Check if route requires auth
    const requiresAuth = !publicRoutes.includes(to.path)

    if (requiresAuth && !isAuthenticated()) {
      // Redirect to login if not authenticated
      return navigateTo('/')
    }

    // Role-based access control
    if (isAuthenticated() && user.value) {
      const userRole = user.value.role
      const path = to.path

      // Define role-specific route patterns and allowed roles
      const routeAccess = {
        requester: {
          pattern: /^\/(requester)/,
          allowedRoles: ['requester']
        },
        technician: {
          pattern: /^\/(technician)/,
          allowedRoles: ['technician']
        },
        supervisor: {
          pattern: /^\/(supervisor)/,
          allowedRoles: ['supervisor', 'engineer', 'admin'] // engineer และ admin สามารถเข้าถึงหน้า supervisor ได้
        }
      }

      // Check if user is trying to access a role-specific route
      for (const [routeName, config] of Object.entries(routeAccess)) {
        if (config.pattern.test(path)) {
          // If user's role is not in allowed roles, redirect to their home
          if (!config.allowedRoles.includes(userRole)) {
            console.warn(`Access denied: ${userRole} tried to access ${routeName} route`)
            
            // Redirect to appropriate home page based on user's role
            switch (userRole) {
              case 'requester':
                return navigateTo('/requester')
              case 'technician':
                return navigateTo('/technician')
              case 'supervisor':
              case 'engineer':
              case 'admin':
                return navigateTo('/supervisor')
              default:
                return navigateTo('/')
            }
          }
          // If role is allowed, allow access
          break
        }
      }
    }

    // Redirect for '/' is handled by index.vue page-level middleware
  } catch (error) {
    console.error('Auth middleware error:', error)
    // Don't block navigation on error
    return
  }
})
