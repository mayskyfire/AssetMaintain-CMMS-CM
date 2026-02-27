import type { NotificationListRequest, NotificationListResponse } from '~/types/api'

export default defineEventHandler(async (event) => {
  try {
    // Get query parameters
    const queryParams = getQuery(event) as NotificationListRequest
    const page = parseInt(queryParams.page as string) || 1
    const limit = parseInt(queryParams.limit as string) || 20
    const offset = (page - 1) * limit
    const status = queryParams.status
    const priority = queryParams.priority

    // Build WHERE clause
    let whereClause = '1=1'
    const params: any[] = []

    if (status) {
      whereClause += ' AND cm.status = ?'
      params.push(status)
    }

    if (priority) {
      whereClause += ' AND cm.priority = ?'
      params.push(priority)
    }

    // Query notifications from database
    const notifications = await query<{
      id: number
      notification_id: string
      asset_id: number
      asset_code: string
      asset_name: string
      location: string
      breakdown_date: Date
      reported_date: Date
      completion_date: Date | null
      problem_category: string | null
      problem_description: string
      priority: 'low' | 'medium' | 'high' | 'critical'
      status: 'reported' | 'in_progress' | 'completed' | 'cancelled'
      requester_id: number
      requester_name: string
      technician_id: number | null
      technician_name: string | null
    }>(
      `SELECT 
        cm.id,
        COALESCE(cm.notification_id, '') as notification_id,
        cm.asset_id,
        COALESCE(a.asset_code, '') as asset_code,
        COALESCE(a.asset_name, '') as asset_name,
        COALESCE(a.location, '') as location,
        cm.breakdown_date,
        cm.reported_date,
        cm.completion_date,
        cm.problem_category,
        COALESCE(cm.problem_description, '') as problem_description,
        cm.priority,
        cm.status,
        cm.requester_id,
        COALESCE(u1.full_name, '') as requester_name,
        cm.technician_id,
        u2.full_name as technician_name
       FROM cm_history cm
       INNER JOIN assets a ON cm.asset_id = a.id
       INNER JOIN users u1 ON cm.requester_id = u1.id
       LEFT JOIN users u2 ON cm.technician_id = u2.id
       WHERE ${whereClause}
       ORDER BY cm.reported_date DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    )

    // Get total count
    const [countResult] = await query<{ total: number }>(
      `SELECT COUNT(*) as total FROM cm_history cm WHERE ${whereClause}`,
      params
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
    console.error('Get notifications error:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: error.message || 'Failed to fetch notifications'
    })
  }
})
