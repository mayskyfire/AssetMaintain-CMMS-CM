export default defineEventHandler(async (event) => {
  try {
    // Get auth token
    const authHeader = getHeader(event, 'authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
        message: 'Missing or invalid authorization token'
      })
    }

    const token = authHeader.substring(7)
    const payload = verifyToken(token)

    if (!payload) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
        message: 'Invalid or expired token'
      })
    }

    // Get job ID from route params
    const jobId = parseInt(event.context.params?.id || '0')

    if (!jobId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'Invalid job ID'
      })
    }

    // Get request body
    const body = await readBody(event)
    const { parts } = body

    if (!parts || !Array.isArray(parts) || parts.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'Parts array is required and must not be empty'
      })
    }

    // Verify job exists and belongs to technician
    const job = await queryOne<{ id: number; technician_id: number | null }>(
      'SELECT id, technician_id FROM cm_history WHERE id = ? LIMIT 1',
      [jobId]
    )

    if (!job) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Not Found',
        message: 'Job not found'
      })
    }

    if (job.technician_id !== payload.userId) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden',
        message: 'You are not assigned to this job'
      })
    }

    // Insert parts into database
    const insertedParts = []
    
    for (const part of parts) {
      const { part_name, part_no, quantity, unit, unit_cost } = part

      if (!part_name || !quantity || quantity <= 0) {
        continue // Skip invalid parts
      }

      const total_cost = unit_cost ? unit_cost * quantity : null

      const result = await query(
        `INSERT INTO cm_parts_used 
         (cm_history_id, part_name, part_no, quantity, unit, unit_cost, total_cost)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          jobId,
          part_name,
          part_no || null,
          quantity,
          unit || 'ชิ้น',
          unit_cost || null,
          total_cost
        ]
      )

      insertedParts.push({
        id: (result as any).insertId,
        part_name,
        part_no,
        quantity,
        unit: unit || 'ชิ้น',
        unit_cost,
        total_cost
      })
    }

    // Add timeline event
    await query(
      `INSERT INTO cm_timeline (cm_history_id, event, user_id, status)
       VALUES (?, ?, ?, ?)`,
      [jobId, `บันทึกอะไหล่ ${insertedParts.length} รายการ`, payload.userId, null]
    )

    return {
      success: true,
      message: `บันทึกอะไหล่สำเร็จ ${insertedParts.length} รายการ`,
      data: {
        parts: insertedParts,
        total_parts: insertedParts.length
      }
    }
  } catch (error: any) {
    console.error('Add parts error:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: error.message || 'Failed to add parts'
    })
  }
})
