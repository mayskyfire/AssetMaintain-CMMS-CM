export default defineEventHandler(async (event) => {
  try {
    // Get authorization header
    const authHeader = getRequestHeader(event, 'authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
        message: 'Missing or invalid authorization header'
      })
    }

    // Verify token
    const token = authHeader.substring(7)
    const payload = verifyToken(token)
    
    if (!payload) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
        message: 'Invalid token'
      })
    }

    const userId = payload.userId

    // Get query parameters
    const queryParams = getQuery(event)
    const page = parseInt(queryParams.page as string) || 1
    const limit = parseInt(queryParams.limit as string) || 50
    const offset = (page - 1) * limit

    // Query notifications
    // - reported, pending_spare_approval, spare_approved: แสดงทั้งหมด (ยังไม่ได้มอบหมาย หรือรออนุมัติอะไหล่)
    // - assigned, in_progress, completed: แสดงเฉพาะที่ supervisor คนนี้เป็นคนมอบหมาย
    const notifications = await query<{
      id: number
      notification_id: string
      asset_id: number
      asset_code: string
      asset_name: string
      location: string
      breakdown_date: Date
      reported_date: Date
      problem_category: string | null
      problem_description: string
      priority: 'low' | 'medium' | 'high' | 'critical'
      status: string
      requester_id: number
      requester_name: string
      technician_id: number | null
      technician_name: string | null
      supervisor_id: number | null
    }>(
      `SELECT 
        cm.id,
        cm.notification_id,
        cm.asset_id,
        a.asset_code,
        a.asset_name,
        a.location,
        cm.breakdown_date,
        cm.reported_date,
        cm.problem_category,
        cm.problem_description,
        cm.priority,
        cm.status,
        cm.requester_id,
        u1.full_name as requester_name,
        cm.technician_id,
        u2.full_name as technician_name,
        cm.supervisor_id
       FROM cm_history cm
       INNER JOIN assets a ON cm.asset_id = a.id
       INNER JOIN users u1 ON cm.requester_id = u1.id
       LEFT JOIN users u2 ON cm.technician_id = u2.id
       WHERE (
         cm.status IN ('reported', 'pending_spare_approval', 'spare_approved')
         OR (cm.status IN ('assigned', 'in_progress', 'completed') AND cm.supervisor_id = ?)
       )
       ORDER BY 
         CASE cm.priority
           WHEN 'critical' THEN 1
           WHEN 'high' THEN 2
           WHEN 'medium' THEN 3
           WHEN 'low' THEN 4
         END,
         cm.reported_date ASC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    )

    // Get total count
    const [countResult] = await query<{ total: number }>(
      `SELECT COUNT(*) as total 
       FROM cm_history 
       WHERE (
         status IN ('reported', 'pending_spare_approval', 'spare_approved')
         OR (status IN ('assigned', 'in_progress', 'completed') AND supervisor_id = ?)
       )`,
      [userId]
    )

    const total = countResult?.total || 0

    return {
      success: true,
      data: notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  } catch (error: any) {
    console.error('Get supervisor inbox error:', error)
    
    if (error.statusCode) throw error

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: error.message || 'Failed to fetch inbox'
    })
  }
})
