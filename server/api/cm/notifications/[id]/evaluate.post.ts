import type { EvaluateNotificationRequest } from '~/types/api'
import { notifyCMEvaluation } from '../../../../utils/notificationHelper'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(getRouterParam(event, 'id'))
    const body = await readBody<EvaluateNotificationRequest>(event)

    if (!id || isNaN(id)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'Invalid notification ID'
      })
    }

    // Validation
    if (!body.satisfaction_rating || body.satisfaction_rating < 1 || body.satisfaction_rating > 5) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'Satisfaction rating must be between 1 and 5'
      })
    }

    // Check if notification exists and is completed
    const notification = await queryOne<{
      id: number
      status: string
      satisfaction_rating: number | null
    }>(
      'SELECT id, status, satisfaction_rating FROM cm_history WHERE id = ?',
      [id]
    )

    if (!notification) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Not Found',
        message: 'Notification not found'
      })
    }

    if (notification.status !== 'completed') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'Can only evaluate completed notifications'
      })
    }

    if (notification.satisfaction_rating) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'Notification already evaluated'
      })
    }

    // Update evaluation
    await query(
      `UPDATE cm_history 
       SET satisfaction_rating = ?,
           satisfaction_comment = ?,
           evaluated_by = ?,
           evaluated_at = NOW(),
           updated_at = NOW()
       WHERE id = ?`,
      [
        body.satisfaction_rating,
        body.satisfaction_comment || null,
        body.evaluated_by || 'ผู้ใช้งาน',
        id
      ]
    )

    // Get CM data for notification
    const cmData = await queryOne<{
      notification_id: string
      technician_id: number
    }>(
      'SELECT notification_id, technician_id FROM cm_history WHERE id = ?',
      [id]
    )

    // ดึงช่างทุกคนที่ได้รับมอบหมายงานนี้ (จาก cm_technician_assignments)
    const assignedTechnicians = await query<{ technician_id: number }>(
      `SELECT technician_id FROM cm_technician_assignments WHERE cm_history_id = ?`,
      [id]
    )

    console.log('CM Data for evaluation notification:', cmData)
    console.log('Assigned technicians:', assignedTechnicians)

    // Send evaluation notification to all assigned technicians
    try {
      if (assignedTechnicians && assignedTechnicians.length > 0) {
        for (const tech of assignedTechnicians) {
          console.log('Sending evaluation notification to technician:', tech.technician_id)
          await notifyCMEvaluation(
            id,
            tech.technician_id,
            body.satisfaction_rating,
            {
              notification_id: cmData?.notification_id,
              satisfaction_comment: body.satisfaction_comment
            }
          )
        }
        console.log('Evaluation notifications sent successfully')
      } else if (cmData?.technician_id) {
        // Fallback: ถ้าไม่มีข้อมูลใน cm_technician_assignments ให้ส่งไปหา technician_id เดิม
        console.log('Fallback: Sending evaluation notification to lead technician:', cmData.technician_id)
        await notifyCMEvaluation(
          id,
          cmData.technician_id,
          body.satisfaction_rating,
          {
            notification_id: cmData.notification_id,
            satisfaction_comment: body.satisfaction_comment
          }
        )
        console.log('Evaluation notification sent successfully')
      } else {
        console.warn('No technicians found, cannot send evaluation notification')
      }
    } catch (notifError) {
      console.error('Failed to send evaluation notification:', notifError)
      // Don't fail the request if notification fails
    }

    return {
      success: true,
      message: 'Evaluation submitted successfully'
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    console.error('Evaluate notification error:', error)

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: error.message || 'Failed to submit evaluation'
    })
  }
})
