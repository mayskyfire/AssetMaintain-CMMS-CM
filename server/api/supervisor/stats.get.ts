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

    // Get total pending (waiting for assignment) - แสดงทั้งหมด
    const [pendingResult] = await query<{ total: number }>(
      `SELECT COUNT(*) as total 
       FROM cm_history 
       WHERE status = 'reported' AND technician_id IS NULL`
    )

    // Get total assigned (assigned to technician) - เฉพาะที่ตัวเองมอบหมาย
    const [assignedResult] = await query<{ total: number }>(
      `SELECT COUNT(*) as total 
       FROM cm_history 
       WHERE status = 'assigned' AND supervisor_id = ?`,
      [userId]
    )

    // Get total in progress - เฉพาะที่ตัวเองมอบหมาย
    const [inProgressResult] = await query<{ total: number }>(
      `SELECT COUNT(*) as total 
       FROM cm_history 
       WHERE status = 'in_progress' AND supervisor_id = ?`,
      [userId]
    )

    // Get total completed - เฉพาะที่ตัวเองมอบหมาย
    const [completedResult] = await query<{ total: number }>(
      `SELECT COUNT(*) as total 
       FROM cm_history 
       WHERE status = 'completed' AND supervisor_id = ?`,
      [userId]
    )

    // Get critical priority count - เฉพาะที่ตัวเองมอบหมายหรือยังไม่ได้มอบหมาย
    const [criticalResult] = await query<{ total: number }>(
      `SELECT COUNT(*) as total 
       FROM cm_history 
       WHERE priority = 'critical' 
       AND status IN ('reported', 'assigned', 'in_progress')
       AND (status = 'reported' OR supervisor_id = ?)`,
      [userId]
    )

    // Get total technicians
    const [technicianResult] = await query<{ total: number }>(
      `SELECT COUNT(*) as total 
       FROM users 
       WHERE role = 'technician' AND is_active = 1`
    )

    return {
      success: true,
      data: {
        total_pending: pendingResult?.total || 0,
        total_assigned: assignedResult?.total || 0,
        total_in_progress: inProgressResult?.total || 0,
        total_completed: completedResult?.total || 0,
        critical_priority: criticalResult?.total || 0,
        total_technicians: technicianResult?.total || 0
      }
    }
  } catch (error: any) {
    console.error('Get supervisor stats error:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: error.message || 'Failed to fetch stats'
    })
  }
})
