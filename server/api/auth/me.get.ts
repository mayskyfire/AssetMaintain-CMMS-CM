import type { UserInfo } from '~/types/api'

export default defineEventHandler(async (event) => {
  try {
    // Get token from header
    const authHeader = getHeader(event, 'authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
        message: 'No authorization token provided'
      })
    }

    const token = authHeader.substring(7)

    // Verify and decode token
    const payload = verifyToken(token)
    
    if (!payload) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
        message: 'Invalid or expired token'
      })
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
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
        message: 'User not found or inactive'
      })
    }

    const userInfo: UserInfo = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      phone_number: user.phone_number || undefined,
      is_active: user.is_active === 1
    }

    return {
      success: true,
      data: userInfo
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    console.error('Get user error:', error)

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: error.message || 'An error occurred'
    })
  }
})
