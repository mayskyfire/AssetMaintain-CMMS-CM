/**
 * GET /api/technician/jobs/:id
 * Get job detail for technician
 */

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

    // Get job detail with asset info
    const job = await queryOne<{
      id: number
      notification_id: string
      asset_id: number
      asset_code: string
      asset_name: string
      location: string
      breakdown_date: Date
      reported_date: Date
      completion_date: Date | null
      start_time: Date | null
      problem_category: string | null
      problem_description: string
      root_cause: string | null
      corrective_action: string | null
      preventive_recommendation: string | null
      priority: 'low' | 'medium' | 'high' | 'critical'
      status: 'reported' | 'pending_spare_approval' | 'spare_approved' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
      requester_id: number
      requester_name: string
      technician_id: number | null
      technician_name: string | null
      supervisor_id: number | null
      supervisor_name: string | null
      assigned_at: Date
      labor_hours: number | null
      labor_cost: number | null
      parts_cost: number | null
      external_cost: number | null
      total_cost: number | null
      downtime_hours: number | null
      satisfaction_rating: number | null
      satisfaction_comment: string | null
      evaluated_by: string | null
      evaluated_at: Date | null
      notes: string | null
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
        cm.completion_date,
        cm.start_time,
        cm.problem_category,
        cm.problem_description,
        cm.root_cause,
        cm.corrective_action,
        cm.preventive_recommendation,
        cm.priority,
        cm.status,
        cm.requester_id,
        u1.full_name as requester_name,
        cm.technician_id,
        u2.full_name as technician_name,
        cm.supervisor_id,
        u3.full_name as supervisor_name,
        cm.supervisor_approved_at AS assigned_at,
        cm.labor_hours,
        cm.labor_cost,
        cm.parts_cost,
        cm.external_cost,
        cm.total_cost,
        cm.downtime_hours,
        cm.satisfaction_rating,
        cm.satisfaction_comment,
        cm.evaluated_by,
        cm.evaluated_at,
        cm.notes
       FROM cm_history cm
       INNER JOIN assets a ON cm.asset_id = a.id
       INNER JOIN users u1 ON cm.requester_id = u1.id
       LEFT JOIN users u2 ON cm.technician_id = u2.id
       LEFT JOIN users u3 ON cm.supervisor_id = u3.id
       WHERE cm.id = ?
       ORDER BY cm.reported_date DESC
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

    // Query parts used
    const partsUsed = await query<{
      id: number
      part_name: string
      part_no: string | null
      quantity: number
      unit: string
      unit_cost: number | null
      total_cost: number | null
    }>(
      'SELECT id, part_name, part_no, quantity, unit, unit_cost, total_cost FROM cm_parts_used WHERE cm_history_id = ?',
      [id]
    )

    // Query timeline from cm_timeline table
    const timeline = await query<{
      id: number
      event: string
      user: string | null
      status: string | null
      time: Date
    }>(
      'SELECT id, event, user, status, time FROM cm_timeline WHERE cm_history_id = ? ORDER BY time ASC',
      [id]
    )

    // Query assigned technicians
    const assignedTechnicians = await query<{
      id: number
      technician_id: number
      full_name: string
      is_lead: number
      status: string
      assigned_at: Date | null
      accepted_at: Date | null
    }>(
      `SELECT 
        cta.id,
        cta.technician_id,
        u.full_name,
        cta.is_lead,
        cta.status,
        cta.assigned_at,
        cta.accepted_at
       FROM cm_technician_assignments cta
       INNER JOIN users u ON cta.technician_id = u.id
       WHERE cta.cm_history_id = ?
       ORDER BY cta.is_lead DESC, cta.assigned_at ASC`,
      [id]
    )

    return {
      success: true,
      data: {
        ...job,
        evidence_images: evidenceImages,
        parts_used: partsUsed,
        assigned_technicians: assignedTechnicians,
        timeline: timeline.map(t => ({
          ...t,
          time: toThaiISOString(t.time)
        }))
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
      message: error.message || 'Failed to get job detail'
    })
  }
})
