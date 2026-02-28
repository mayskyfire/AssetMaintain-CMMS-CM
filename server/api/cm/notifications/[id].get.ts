import type { NotificationDetailResponse } from '~/types/api'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(getRouterParam(event, 'id'))

    if (!id || isNaN(id)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'Invalid notification ID'
      })
    }

    // Query notification detail
    const notification = await queryOne<{
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
      status: 'reported' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
      requester_id: number
      requester_name: string
      technician_id: number | null
      technician_name: string | null
      supervisor_id: number | null
      supervisor_name: string | null
      labor_hours: number | null
      labor_cost: number | null
      parts_cost: number | null
      total_cost: number | null
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
        cm.labor_hours,
        cm.labor_cost,
        cm.parts_cost,
        cm.total_cost,
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
       LIMIT 1`,
      [id]
    )

    if (!notification) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Not Found',
        message: 'Notification not found'
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

    // Build timeline (convert dates to Thailand timezone)
    const timeline = []
    
    if (notification.reported_date) {
      timeline.push({
        id: 1,
        event: 'แจ้งซ่อม',
        time: toThaiISOString(notification.reported_date),
        user: notification.requester_name,
        status: 'completed'
      })
    }

    if (notification.technician_id && notification.start_time) {
      timeline.push({
        id: 2,
        event: 'มอบหมายช่าง',
        time: toThaiISOString(notification.start_time),
        user: notification.supervisor_name || 'ระบบ',
        status: 'completed'
      })
    }

    if (notification.completion_date) {
      timeline.push({
        id: 3,
        event: 'ปิดงาน',
        time: toThaiISOString(notification.completion_date),
        user: notification.technician_name || 'ช่าง',
        status: 'completed'
      })
    }

    if (notification.evaluated_at) {
      timeline.push({
        id: 4,
        event: 'ประเมินผล',
        time: toThaiISOString(notification.evaluated_at),
        user: notification.evaluated_by || notification.requester_name,
        status: 'completed'
      })
    }

    return {
      success: true,
      data: {
        ...notification,
        evidence_images: evidenceImages,
        parts_used: partsUsed,
        timeline
      }
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    console.error('Get notification detail error:', error)

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: error.message || 'Failed to fetch notification'
    })
  }
})
