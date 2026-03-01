import type { AssignTechnicianRequest } from '~/types/api'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<AssignTechnicianRequest>(event)

    // Validation
    if (!body.cm_history_id || !body.technician_id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'Notification ID and technician ID are required'
      })
    }

    // Check if notification exists
    const notification = await queryOne<{
      id: number
      status: string
      technician_id: number | null
    }>(
      'SELECT id, status, technician_id FROM cm_history WHERE id = ?',
      [body.cm_history_id]
    )

    if (!notification) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Not Found',
        message: 'Notification not found'
      })
    }

    if (notification.technician_id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'Notification already assigned to a technician'
      })
    }

    // Check if technician exists
    const technician = await queryOne<{
      id: number
      role: string
      is_active: number
    }>(
      'SELECT id, role, is_active FROM users WHERE id = ?',
      [body.technician_id]
    )

    if (!technician) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Not Found',
        message: 'Technician not found'
      })
    }

    if (technician.role !== 'technician') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'User is not a technician'
      })
    }

    if (!technician.is_active) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'Technician is not active'
      })
    }

    // Assign technician with supervisor approval
    await query(
      `UPDATE cm_history 
       SET technician_id = ?,
           supervisor_id = ?,
           supervisor_approved = 1,
           supervisor_approved_at = NOW(),
           start_time = NOW(),
           status = 'assigned',
           updated_at = NOW()
       WHERE id = ?`,
      [body.technician_id, body.supervisor_id || null, body.cm_history_id]
    )

    // Get technician name for timeline
    const technicianInfo = await queryOne<{ full_name: string }>(
      'SELECT full_name FROM users WHERE id = ?',
      [body.technician_id]
    )
    const technicianName = technicianInfo?.full_name || 'ช่างเทคนิค'

    // Add timeline event: มอบหมายช่างซ่อม
    await query(
      `INSERT INTO cm_timeline (cm_history_id, event, user, status, time)
       VALUES (?, ?, ?, ?, NOW())`,
      [body.cm_history_id, 'มอบหมายช่างซ่อม', `มอบหมายให้: ${technicianName}`, 'completed']
    )

    return {
      success: true,
      message: 'Technician assigned successfully'
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    console.error('Assign technician error:', error)

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: error.message || 'Failed to assign technician'
    })
  }
})
