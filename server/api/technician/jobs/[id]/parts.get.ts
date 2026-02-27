export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    
    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Job ID is required'
      })
    }

    const jobId = parseInt(id)

    // Get parts for this job
    const parts = await query<{
      id: number
      cm_history_id: number
      part_no: string | null
      part_name: string
      quantity: number
      unit: string
      unit_cost: number | null
      total_cost: number | null
      requested_date: Date
      requested_by: number
      status: 'pending' | 'approved' | 'rejected'
    }>(
      `SELECT 
        id,
        cm_history_id,
        part_no,
        part_name,
        quantity,
        unit,
        unit_cost,
        total_cost,
        requested_date,
        requested_by,
        status
       FROM cm_parts
       WHERE cm_history_id = ?
       ORDER BY requested_date DESC`,
      [jobId]
    )

    return {
      success: true,
      data: parts
    }
  } catch (error: any) {
    console.error('Get parts error:', error)
    
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to fetch parts'
    })
  }
})
