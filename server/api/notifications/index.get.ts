// GET /api/notifications - ดึงรายการ notifications
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const queryParams = getQuery(event)
  const page = parseInt(queryParams.page as string) || 1
  const limit = parseInt(queryParams.limit as string) || 20
  const isRead = queryParams.isRead as string // 'true', 'false', or undefined (all)
  const type = queryParams.type as string
  const offset = (page - 1) * limit

  // Build WHERE clause
  let whereConditions = ['user_id = ?']
  const params: any[] = [user.id]

  if (isRead === 'true') {
    whereConditions.push('is_read = 1')
  } else if (isRead === 'false') {
    whereConditions.push('is_read = 0')
  }

  if (type) {
    whereConditions.push('type = ?')
    params.push(type)
  }

  const whereClause = whereConditions.join(' AND ')

  // Get total count
  const [countResult] = await query<{ total: number }>(
    `SELECT COUNT(*) as total FROM cm_notifications WHERE ${whereClause}`,
    params
  )
  const total = countResult?.total || 0

  // Get notifications
  const notifications = await query<any>(`
    SELECT 
      id,
      type,
      title,
      message,
      reference_type,
      reference_id,
      is_read,
      read_at,
      priority_level as priority,
      metadata,
      created_at,
      updated_at
    FROM cm_notifications
    WHERE ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `, [...params, limit, offset])

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
})
