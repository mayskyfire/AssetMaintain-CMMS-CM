import type { AcceptJobRequest } from '~/types/api'

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
