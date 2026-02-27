export default defineEventHandler(async (event) => {
  try {
    // Get query parameters
    const queryParams = getQuery(event)
    const page = parseInt(queryParams.page as string) || 1
    const limit = parseInt(queryParams.limit as string) || 20
    const offset = (page - 1) * limit

    // Query pending notifications (reported status, not assigned to technician)
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
        u.full_name as requester_name
       FROM cm_history cm
       INNER JOIN assets a ON cm.asset_id = a.id
       INNER JOIN users u ON cm.requester_id = u.id
       WHERE cm.status = 'reported' AND cm.technician_id IS NULL
       ORDER BY 
         CASE cm.priority
           WHEN 'critical' THEN 1
           WHEN 'high' THEN 2
           WHEN 'medium' THEN 3
           WHEN 'low' THEN 4
         END,
         cm.reported_date ASC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    )

    // Get total count
    const [countResult] = await query<{ total: number }>(
      `SELECT COUNT(*) as total 
       FROM cm_history 
       WHERE status = 'reported' AND technician_id IS NULL`
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
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: error.message || 'Failed to fetch inbox'
    })
  }
})
