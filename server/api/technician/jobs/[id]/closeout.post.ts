import type { CloseoutJobRequest } from '~/types/api'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(getRouterParam(event, 'id'))
    const body = await readBody<CloseoutJobRequest>(event)

    if (!id || isNaN(id)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'Invalid job ID'
      })
    }

    // Validation
    if (!body.root_cause || !body.corrective_action) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'Root cause and corrective action are required'
      })
    }

    // Check if job exists
    const job = await queryOne<{
      id: number
      status: string
      completion_date: Date | null
    }>(
      'SELECT id, status, completion_date FROM cm_history WHERE id = ?',
      [id]
    )

    if (!job) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Not Found',
        message: 'Job not found'
      })
    }

    if (job.completion_date) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'Job already closed'
      })
    }

    // Calculate total cost
    const totalCost = (body.labor_cost || 0) + (body.parts_cost || 0) + (body.external_cost || 0)

    // Close job
    await query(
      `UPDATE cm_history 
       SET root_cause = ?,
           corrective_action = ?,
           preventive_recommendation = ?,
           labor_hours = ?,
           labor_cost = ?,
           parts_cost = ?,
           external_cost = ?,
           total_cost = ?,
           completion_date = ?,
           completed_by = ?,
           qr_scanned_end = NOW(),
           status = 'completed',
           updated_at = NOW()
       WHERE id = ?`,
      [
        body.root_cause,
        body.corrective_action,
        body.preventive_recommendation || null,
        body.labor_hours || null,
        body.labor_cost || null,
        body.parts_cost || null,
        body.external_cost || null,
        totalCost,
        body.completion_date || new Date().toISOString(),
        body.completed_by || 'ช่าง',
        id
      ]
    )

    // Insert after photos if provided
    if (body.photos && body.photos.length > 0) {
      for (const photo of body.photos) {
        await query(
          `INSERT INTO cm_evidence_images (
            cm_history_id,
            image_type,
            url,
            caption,
            created_at
          ) VALUES (?, 'after', ?, 'รูปหลังซ่อม', NOW())`,
          [id, photo]
        )
      }
    }

    return {
      success: true,
      message: 'Job closed successfully'
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    console.error('Closeout job error:', error)

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: error.message || 'Failed to close job'
    })
  }
})
