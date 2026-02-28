import type { LoginRequest, LoginResponse } from '~/types/api'

export default defineEventHandler(async (event) => {
  try {
    // Parse request body
    const body = await readBody<LoginRequest>(event)

    // Validation
    if (!body.email || !body.password) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'กรุณากรอกอีเมลและรหัสผ่าน'
      })
    }

    // Query user from database
    const user = await queryOne<{
      id: number
      email: string
      password_hash: string
      full_name: string
      role: 'admin' | 'planner' | 'technician' | 'vendor' | 'requester' | 'engineer'
      phone_number: string | null
      is_active: number
      last_login: Date | null
    }>(
      'SELECT id, email, password_hash, full_name, role, phone_number, is_active, last_login FROM users WHERE email = ? LIMIT 1',
      [body.email]
    )

    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
        message: 'ไม่พบผู้ใช้งานหรืออีเมลไม่ถูกต้อง'
      })
    }

    // Check if user is active
    if (!user.is_active) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden',
        message: 'บัญชีผู้ใช้ถูกระงับการใช้งาน'
      })
    }

    // Verify password
    const isPasswordValid = await comparePassword(body.password, user.password_hash)
    
    if (!isPasswordValid) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
        message: 'รหัสผ่านไม่ถูกต้อง'
      })
    }

    // Update last login
    await query(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [user.id]
    )

    // Generate token
    const token = generateToken(user.id, user.email)
    
    // Prepare response
    const response: LoginResponse = {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        phone_number: user.phone_number || undefined,
        is_active: user.is_active === 1
      },
      token,
      expiresIn: 86400 // 24 hours in seconds
    }

    return {
      success: true,
      data: response,
      message: 'เข้าสู่ระบบสำเร็จ'
    }
  } catch (error: any) {
    // Handle errors
    if (error.statusCode) {
      throw error
    }

    console.error('Login error:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ'
    })
  }
})
