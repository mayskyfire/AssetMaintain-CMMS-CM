// Authentication utility functions
import type { H3Event } from 'h3'

export interface AuthUser {
  id: number
  email: string
  full_name: string
  role: 'admin' | 'planner' | 'technician' | 'vendor' | 'requester' | 'engineer'
  phone_number?: string
  is_active: boolean
}

/**
 * Get authenticated user from request
 */
export async function getAuthUser(event: H3Event): Promise<AuthUser | null> {
  try {
    // Get token from header
    const authHeader = getHeader(event, 'authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)

    // Verify and decode token
    const payload = verifyToken(token)
    
    if (!payload) {
      return null
    }

    // Query user from database
    const user = await queryOne<{
      id: number
      email: string
      full_name: string
      role: 'admin' | 'planner' | 'technician' | 'vendor' | 'requester' | 'engineer'
      phone_number: string | null
      is_active: number
    }>(
      'SELECT id, email, full_name, role, phone_number, is_active FROM users WHERE id = ? AND is_active = 1 LIMIT 1',
      [payload.userId]
    )

    if (!user) {
      return null
    }

    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      phone_number: user.phone_number || undefined,
      is_active: user.is_active === 1
    }
  } catch (error) {
    console.error('Get auth user error:', error)
    return null
  }
}

/**
 * Require authentication - throws error if not authenticated
 */
export async function requireAuth(event: H3Event): Promise<AuthUser> {
  const user = await getAuthUser(event)
  
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'Authentication required'
    })
  }

  // Set user in context for later use
  event.context.user = user

  return user
}
