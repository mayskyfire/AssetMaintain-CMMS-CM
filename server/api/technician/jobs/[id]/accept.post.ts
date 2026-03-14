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

    // Get authenticated user
    const authHeader = getHeader(event, 'authorization')
    const token = authHeader?.replace('Bearer ', '')
    let currentUserId: number | null = null
    if (token) {
      const decoded = verifyToken(token)
      if (decoded) currentUserId = decoded.userId
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
        message: 'ไม่พบงานนี้'
      })
    }

    if (job.status !== 'assigned') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'งานนี้ถูกรับแล้วหรือไม่อยู่ในสถานะรอรับงาน'
      })
    }

    if (job.accepted_at) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'งานนี้ถูกรับแล้ว'
      })
    }

    // ตรวจสอบว่ามีช่างคนอื่นรับงานนี้ไปแล้วหรือยัง (จาก cm_technician_assignments)
    const alreadyAccepted = await queryOne<{ id: number, full_name: string }>(
      `SELECT cta.id, u.full_name
       FROM cm_technician_assignments cta
       INNER JOIN users u ON cta.technician_id = u.id
       WHERE cta.cm_history_id = ? AND cta.status IN ('accepted', 'in_progress')
       LIMIT 1`,
      [id]
    )

    if (alreadyAccepted) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: `ช่าง ${alreadyAccepted.full_name} รับงานนี้ไปแล้ว ไม่สามารถรับงานซ้อนได้`
      })
    }

    // Convert ISO datetime to MySQL format (Thailand timezone)
    let qrScannedStart = null
    if (body.qr_scanned_start) {
      qrScannedStart = toThaiDatetime(body.qr_scanned_start)
    }

    // Accept job - update cm_history
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

    // Update cm_technician_assignments สำหรับช่างที่รับงาน
    if (currentUserId) {
      await query(
        `UPDATE cm_technician_assignments 
         SET status = 'in_progress', accepted_at = NOW(), updated_at = NOW()
         WHERE cm_history_id = ? AND technician_id = ?`,
        [id, currentUserId]
      )
    }

    // Add timeline event
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
       FROM cm_history WHERE id = ?`,
      [id]
    )

    const technician = await queryOne<{ full_name: string }>(
      'SELECT full_name FROM users WHERE id = ?',
      [cmData?.technician_id]
    )

    // Send notifications
    try {
      await notifyCMStatusChange(id, 'accepted', {
        notification_id: cmData?.notification_id,
        requester_id: cmData?.requester_id,
        supervisor_id: cmData?.supervisor_id,
        technician_name: technician?.full_name || body.accepted_by || 'ช่าง'
      })

      await notifyCMStatusChange(id, 'in_progress', {
        notification_id: cmData?.notification_id,
        requester_id: cmData?.requester_id,
        supervisor_id: cmData?.supervisor_id
      })
    } catch (notifError) {
      console.error('Failed to send accept/in_progress notifications:', notifError)
    }

    return {
      success: true,
      message: 'รับงานสำเร็จ'
    }
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Accept job error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: error.message || 'รับงานไม่สำเร็จ'
    })
  }
})
