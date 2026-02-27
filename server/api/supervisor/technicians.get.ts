export default defineEventHandler(async (event) => {
  try {
    // Query available technicians
    const technicians = await query<{
      id: number
      full_name: string
      email: string
      phone_number: string | null
      specialties: string | null
      current_jobs: number
    }>(
      `SELECT 
        u.id,
        u.full_name,
        u.email,
        u.phone_number,
        '' as specialties,
        COUNT(cm.id) as current_jobs
       FROM users u
       LEFT JOIN cm_history cm ON u.id = cm.technician_id 
         AND cm.status IN ('reported', 'in_progress')
       WHERE u.role = 'technician' AND u.is_active = 1
       GROUP BY u.id, u.full_name, u.email, u.phone_number
       ORDER BY current_jobs ASC, u.full_name ASC`
    )

    return {
      success: true,
      data: technicians
    }
  } catch (error: any) {
    console.error('Get technicians error:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: error.message || 'Failed to fetch technicians'
    })
  }
})
