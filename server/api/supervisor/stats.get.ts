export default defineEventHandler(async (event) => {
  try {
    // Get total pending (waiting for assignment)
    const [pendingResult] = await query<{ total: number }>(
      `SELECT COUNT(*) as total 
       FROM cm_history 
       WHERE status = 'reported' AND technician_id IS NULL`
    )

    // Get total in progress
    const [inProgressResult] = await query<{ total: number }>(
      `SELECT COUNT(*) as total 
       FROM cm_history 
       WHERE status = 'in_progress'`
    )

    // Get total completed
    const [completedResult] = await query<{ total: number }>(
      `SELECT COUNT(*) as total 
       FROM cm_history 
       WHERE status = 'completed'`
    )

    // Get critical priority count
    const [criticalResult] = await query<{ total: number }>(
      `SELECT COUNT(*) as total 
       FROM cm_history 
       WHERE priority = 'critical' AND status IN ('reported', 'in_progress')`
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
