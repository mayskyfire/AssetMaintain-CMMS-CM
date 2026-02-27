import type { AssignTechnicianRequest } from '~/types/api'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<AssignTechnicianRequest>(event)

    // Validation
    if (!body.cm_notification_id || !body.technician_id) {
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
      [body.cm_notification_id]
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

    // Assign technician
    await query(
      `UPDATE cm_history 
       SET technician_id = ?,
           supervisor_id = ?,
           start_time = NOW(),
           status = 'in_progress',
           updated_at = NOW()
       WHERE id = ?`,
      [body.technician_id, body.supervisor_id || null, body.cm_notification_id]
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
