export default defineEventHandler(async (event) => {
  try {
    // Get authenticated user from token
    const authHeader = getHeader(event, 'authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
        message: 'Authentication required'
      })
    }

    // Decode token to get user info
    const decoded = verifyToken(token)
    
    if (!decoded) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
        message: 'Invalid or expired token'
      })
    }
    
    const technicianId = decoded.userId

    // Get query parameters
    const queryParams = getQuery(event)
    const page = parseInt(queryParams.page as string) || 1
    const limit = parseInt(queryParams.limit as string) || 20
    const offset = (page - 1) * limit

    // Query jobs assigned to technician (รองรับทั้ง cm_history.technician_id เดิม และ cm_technician_assignments ใหม่)
    const jobs = await query<{
      id: number
      notification_id: string
      asset_id: number
      asset_code: string
      asset_name: string
      location: string
      breakdown_date: Date
      reported_date: Date
      start_time: Date | null
      completion_date: Date | null
      problem_category: string | null
      problem_description: string
      priority: 'low' | 'medium' | 'high' | 'critical'
      status: 'assigned' | 'in_progress' | 'completed' | 'cancelled'
      assigned_at: Date | null
      accepted_at: Date | null
    }>(
      `SELECT DISTINCT
        cm.id,
        cm.notification_id,
        cm.asset_id,
        a.asset_code,
        a.asset_name,
        a.location,
        cm.breakdown_date,
        cm.reported_date,
        cm.start_time,
        cm.completion_date,
        cm.problem_category,
        cm.problem_description,
        cm.priority,
        cm.status,
        cm.start_time as assigned_at,
        cm.accepted_at
       FROM cm_history cm
       INNER JOIN assets a ON cm.asset_id = a.id
       LEFT JOIN cm_technician_assignments cta ON cta.cm_history_id = cm.id AND cta.technician_id = ?
       WHERE cm.technician_id = ? OR cta.technician_id = ?
       ORDER BY 
         CASE cm.status
           WHEN 'assigned' THEN 1
           WHEN 'in_progress' THEN 2
           WHEN 'completed' THEN 3
         END,
         CASE cm.priority
           WHEN 'critical' THEN 1
           WHEN 'high' THEN 2
           WHEN 'medium' THEN 3
           WHEN 'low' THEN 4
         END,
         cm.reported_date DESC
       LIMIT ? OFFSET ?`,
      [technicianId, technicianId, technicianId, limit, offset]
    )

    // Get total count
    const [countResult] = await query<{ total: number }>(
      `SELECT COUNT(DISTINCT cm.id) as total 
       FROM cm_history cm
       LEFT JOIN cm_technician_assignments cta ON cta.cm_history_id = cm.id AND cta.technician_id = ?
       WHERE cm.technician_id = ? OR cta.technician_id = ?`,
      [technicianId, technicianId, technicianId]
    )

    const total = countResult?.total || 0

    return {
      success: true,
      data: jobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  } catch (error: any) {
    console.error('Get technician jobs error:', error)
    
    if (error.statusCode) throw error

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: error.message || 'Failed to fetch jobs'
    })
  }
})
