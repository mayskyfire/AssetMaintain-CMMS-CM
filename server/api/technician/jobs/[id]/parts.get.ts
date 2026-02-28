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
        created_at AS requested_date
       FROM cm_parts_used
       WHERE cm_history_id = ?
       ORDER BY created_at DESC`,
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
