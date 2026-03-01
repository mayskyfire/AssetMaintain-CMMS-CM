import type { CreateNotificationRequest, CreateNotificationResponse } from '~/types/api'

// Generate notification ID (CM-YYYY-XXXX)
function generateNotificationId(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `CM-${year}-${random}`
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<CreateNotificationRequest>(event)

    // Validation
    if (!body.asset_id || !body.problem_description) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'Asset ID and problem description are required'
      })
    }

    // Get requester from auth (in real app, get from token)
    // For now, use requester_id from body or default to 1
    const requesterId = body.requester_id || 1

    // Generate notification ID
    const notificationId = generateNotificationId()

    // Insert notification
    const pool = getDbPool()
    const [result] = await pool.query(
      `INSERT INTO cm_history (
        notification_id,
        asset_id,
        breakdown_date,
        reported_date,
        problem_category,
        problem_description,
        requester_id,
        priority,
        status,
        created_at,
        updated_at
      ) VALUES (?, ?, NOW(), NOW(), ?, ?, ?, ?, 'reported', NOW(), NOW())`,
      [
        notificationId,
        body.asset_id,
        body.problem_category || '',
        body.problem_description,
        requesterId,
        body.priority || 'medium'
      ]
    )

    // Get insertId from result (ResultSetHeader)
    const insertId = (result as any).insertId
    
    if (!insertId) {
      throw createError({
        statusCode: 500,
        message: 'Failed to create notification - no insert ID'
      })
    }

    // Insert evidence images if provided
    if (body.photos && body.photos.length > 0) {
      for (const photoUrl of body.photos) {
        // Extract path from full URL if needed
        let photoPath = photoUrl
        try {
          const url = new URL(photoUrl)
          photoPath = url.pathname // Get only the path part
        } catch {
          // If not a valid URL, assume it's already a path
          photoPath = photoUrl
        }
        
        await pool.query(
          `INSERT INTO cm_evidence_images (
            cm_history_id,
            image_type,
            url,
            uploaded_by,
            created_at
          ) VALUES (?, 'evidence', ?, ?, NOW())`,
          [insertId, photoPath, requesterId]
        )
      }
    }

    // Get requester name for timeline
    const requester = await queryOne<{ full_name: string }>(
      'SELECT full_name FROM users WHERE id = ?',
      [requesterId]
    )
    const requesterName = requester?.full_name || 'ผู้แจ้ง'

    // Add timeline event: สร้างใบแจ้งซ่อม
    await pool.query(
      `INSERT INTO cm_timeline (cm_history_id, event, user, status, time)
       VALUES (?, ?, ?, ?, NOW())`,
      [insertId, 'สร้างใบแจ้งซ่อม', requesterName, 'completed']
    )

    // Get the created notification
    const notification = await queryOne<{
      id: number
      notification_id: string
      asset_id: number
      reported_date: Date
      problem_description: string
      priority: string
      status: string
    }>(
      `SELECT id, notification_id, asset_id, reported_date, problem_description, priority, status
       FROM cm_history
       WHERE id = ?`,
      [insertId]
    )

    return {
      success: true,
      data: notification,
      message: 'Notification created successfully'
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    console.error('Create notification error:', error)

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: error.message || 'Failed to create notification'
    })
  }
})
