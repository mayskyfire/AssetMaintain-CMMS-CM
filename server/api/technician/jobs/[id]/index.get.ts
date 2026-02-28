export default defineEventHandler(async (event) => {
  try {
    const id = Number(getRouterParam(event, 'id'))

    if (!id || isNaN(id)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'Invalid job ID'
      })
    }

    // Query job detail
    const job = await queryOne<{
      id: number
      notification_id: string
      asset_id: number
      asset_code: string
      asset_name: string
      brand_model: string | null
      location: string
      breakdown_date: Date
      reported_date: Date
      start_time: Date | null
      completion_date: Date | null
      problem_category: string | null
      problem_description: string
      root_cause: string | null
      corrective_action: string | null
      priority: 'low' | 'medium' | 'high' | 'critical'
      status: 'reported' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
      requester_name: string
      technician_id: number | null
      accepted_at: Date | null
      notification_type: string | null
    }>(
      `SELECT 
        cm.id,
        cm.notification_id,
        cm.asset_id,
        a.asset_code,
        a.asset_name,
        a.brand_model,
        a.location,
        cm.breakdown_date,
        cm.reported_date,
        cm.start_time,
        cm.completion_date,
        cm.problem_category,
        cm.problem_description,
        cm.root_cause,
        cm.corrective_action,
        cm.priority,
        cm.status,
        u.full_name as requester_name,
        cm.technician_id,
        cm.accepted_at,
        cm.problem_category as notification_type
       FROM cm_history cm
       INNER JOIN assets a ON cm.asset_id = a.id
       INNER JOIN users u ON cm.requester_id = u.id
       WHERE cm.id = ?
       LIMIT 1`,
      [id]
    )

    if (!job) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Not Found',
        message: 'Job not found'
      })
    }

    // Query evidence images
    const evidenceImages = await query<{
      id: number
      image_type: 'evidence' | 'before' | 'after'
      url: string
      caption: string | null
    }>(
      'SELECT id, image_type, url, caption FROM cm_evidence_images WHERE cm_history_id = ?',
      [id]
    )

    return {
      success: true,
      data: {
        ...job,
        evidence_images: evidenceImages
      }
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    console.error('Get job detail error:', error)

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: error.message || 'Failed to fetch job'
    })
  }
})
