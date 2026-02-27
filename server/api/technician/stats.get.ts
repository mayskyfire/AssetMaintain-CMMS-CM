export default defineEventHandler(async (event) => {
  try {
    // Get query parameters
    const queryParams = getQuery(event)
    const technicianId = parseInt(queryParams.technician_id as string) || 2 // Default to test technician

    // Get total assigned
    const [assignedResult] = await query<{ total: number }>(
      `SELECT COUNT(*) as total 
       FROM cm_history 
       WHERE technician_id = ? AND status IN ('reported', 'in_progress')`,
      [technicianId]
    )

    // Get total in progress
    const [inProgressResult] = await query<{ total: number }>(
      `SELECT COUNT(*) as total 
       FROM cm_history 
       WHERE technician_id = ? AND status = 'in_progress'`,
      [technicianId]
    )

    // Get total completed
    const [completedResult] = await query<{ total: number }>(
      `SELECT COUNT(*) as total 
       FROM cm_history 
       WHERE technician_id = ? AND status = 'completed'`,
      [technicianId]
    )

    // Get completed this month
    const [monthResult] = await query<{ total: number }>(
      `SELECT COUNT(*) as total 
       FROM cm_history 
       WHERE technician_id = ? 
         AND status = 'completed'
         AND MONTH(completion_date) = MONTH(CURRENT_DATE())
         AND YEAR(completion_date) = YEAR(CURRENT_DATE())`,
      [technicianId]
    )

    // Get average rating
    const [ratingResult] = await query<{ avg_rating: number | null }>(
      `SELECT AVG(satisfaction_rating) as avg_rating
       FROM cm_history 
       WHERE technician_id = ? 
         AND satisfaction_rating IS NOT NULL`,
      [technicianId]
    )

    // Get average completion time (in hours)
    const [timeResult] = await query<{ avg_time: number | null }>(
      `SELECT AVG(TIMESTAMPDIFF(HOUR, start_time, completion_date)) as avg_time
       FROM cm_history 
       WHERE technician_id = ? 
         AND completion_date IS NOT NULL
         AND start_time IS NOT NULL`,
      [technicianId]
    )

    return {
      success: true,
      data: {
        total_assigned: assignedResult?.total || 0,
        total_in_progress: inProgressResult?.total || 0,
        total_completed: completedResult?.total || 0,
        completed_this_month: monthResult?.total || 0,
        avg_rating: ratingResult?.avg_rating ? parseFloat(ratingResult.avg_rating.toFixed(1)) : null,
        avg_completion_time: timeResult?.avg_time ? parseFloat(timeResult.avg_time.toFixed(1)) : null
      }
    }
  } catch (error: any) {
    console.error('Get technician stats error:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: error.message || 'Failed to fetch stats'
    })
  }
})
