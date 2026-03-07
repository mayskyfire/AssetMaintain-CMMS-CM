export default defineEventHandler(async (event) => {
  try {
    // Query available technicians with ratings
    const technicians = await query<{
      id: number
      full_name: string
      email: string
      phone_number: string | null
      specialties: string | null
      current_jobs: number
      avg_rating: number | null
      total_completed: number
    }>(
      `SELECT 
        u.id,
        u.full_name,
        u.email,
        u.phone_number,
        '' as specialties,
        COUNT(CASE WHEN cm.status IN ('assigned', 'in_progress') THEN 1 END) as current_jobs,
        AVG(CASE WHEN cm.status = 'completed' AND cm.satisfaction_rating IS NOT NULL THEN cm.satisfaction_rating END) as avg_rating,
        COUNT(CASE WHEN cm.status = 'completed' THEN 1 END) as total_completed
       FROM users u
       LEFT JOIN cm_history cm ON u.id = cm.technician_id
       WHERE u.role = 'technician' AND u.is_active = 1
       GROUP BY u.id, u.full_name, u.email, u.phone_number
       ORDER BY current_jobs ASC, u.full_name ASC`
    )

    // Add is_available flag (available if current_jobs < 5)
    const techsWithAvailability = technicians.map(tech => ({
      ...tech,
      is_available: tech.current_jobs < 5,
      avg_rating: tech.avg_rating ? parseFloat(tech.avg_rating as any) : null
    }))

    return {
      success: true,
      data: techsWithAvailability
    }
  } catch (error: any) {
    console.error('Get technicians error:', error)
    
    if (error.statusCode) throw error

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: error.message || 'Failed to fetch technicians'
    })
  }
})
