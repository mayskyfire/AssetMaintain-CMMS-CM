import type { AcceptJobRequest } from '~/types/api'
import { notifyCMStatusChange } from '../../../../utils/notificationHelper'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(getRouterParam(event, 'id'))
    const body = await readBody<AcceptJobRequest>(event)

    if (!id || isNaN(id)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'Invalid job ID'
      })
    }

    // Check if job exists and is assigned
    const job = await queryOne<{
      id: number
      status: string
      technician_id: number | null
      accepted_at: Date | null
    }>(
      'SELECT id, status, technician_id, accepted_at FROM cm_history WHERE id = ?',
      [id]
    )

    if (!job) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Not Found',
        message: 'Job not found'
      })
    }

    if (job.status !== 'assigned') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'Job must be in assigned status to accept'
      })
    }

    if (job.accepted_at) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'Job already accepted'
      })
    }

    // Convert ISO datetime to MySQL format (Thailand timezone)
    let qrScannedStart = null
    if (body.qr_scanned_start) {
      qrScannedStart = toThaiDatetime(body.qr_scanned_start)
    }

    // Accept job
    await query(
      `UPDATE cm_history 
       SET accepted_by = ?,
           accepted_at = NOW(),
           qr_scanned_start = ?,
           status = 'in_progress',
           updated_at = NOW()
       WHERE id = ?`,
      [body.accepted_by || 'ช่าง', qrScannedStart, id]
    )

    // Add timeline event: เริ่มดำเนินการซ่อม
    await query(
      `INSERT INTO cm_timeline (cm_history_id, event, user, status, time)
       VALUES (?, ?, ?, ?, NOW())`,
      [id, 'เริ่มดำเนินการซ่อม', body.accepted_by || 'ช่าง', 'in_progress']
    )

    // Get CM data for notification
    const cmData = await queryOne<{
      notification_id: string
      requester_id: number
      supervisor_id: number | null
      technician_id: number
    }>(
      `SELECT notification_id, requester_id, supervisor_id, technician_id
       FROM cm_history
       WHERE id = ?`,
      [id]
    )

    // Get technician name
    const technician = await queryOne<{ full_name: string }>(
      'SELECT full_name FROM users WHERE id = ?',
      [cmData?.technician_id]
    )

    // Send notifications (accepted + in_progress)
    try {
      // First: accepted notification
      await notifyCMStatusChange(id, 'accepted', {
        notification_id: cmData?.notification_id,
        requester_id: cmData?.requester_id,
        supervisor_id: cmData?.supervisor_id,
        technician_name: technician?.full_name || body.accepted_by || 'ช่าง'
      })

      // Then: in_progress notification
      await notifyCMStatusChange(id, 'in_progress', {
        notification_id: cmData?.notification_id,
        requester_id: cmData?.requester_id,
        supervisor_id: cmData?.supervisor_id
      })
    } catch (notifError) {
      console.error('Failed to send accept/in_progress notifications:', notifError)
      // Don't fail the request if notification fails
    }

    return {
      success: true,
      message: 'Job accepted successfully'
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    console.error('Accept job error:', error)

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: error.message || 'Failed to accept job'
    })
  }
})
