// Notification Helper Functions
import type { H3Event } from 'h3'

export interface CreateNotificationParams {
  userId: number
  type: string
  title: string
  message: string
  referenceType?: 'cm_history' | 'pm_plan' | 'system'
  referenceId?: number
  priority?: 'low' | 'medium' | 'high' | 'critical'
  metadata?: any
}

/**
 * สร้าง notification และส่งผ่าน SSE
 */
export async function createNotification(params: CreateNotificationParams) {
  const {
    userId,
    type,
    title,
    message,
    referenceType = null,
    referenceId = null,
    priority = 'medium',
    metadata = null
  } = params

  // Insert notification
  const result = await query(`
    INSERT INTO cm_notifications (
      user_id, type, title, message,
      reference_type, reference_id,
      priority_level, metadata,
      is_read, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, NOW())
  `, [
    userId,
    type,
    title,
    message,
    referenceType,
    referenceId,
    priority,
    metadata ? JSON.stringify(metadata) : null
  ])

  const notificationId = (result as any).insertId || result[0]?.insertId

  // Get created notification
  const notification = await queryOne<any>(
    'SELECT * FROM cm_notifications WHERE id = ?',
    [notificationId]
  )

  // Broadcast via SSE
  try {
    const { broadcastNotification } = await import('../api/notifications/sse.get')
    broadcastNotification(userId, notification)
  } catch (error) {
    console.error('Failed to broadcast notification:', error)
  }

  return notification
}


/**
 * สร้าง notification สำหรับ CM status change
 */
export async function notifyCMStatusChange(
  cmHistoryId: number,
  status: string,
  cmData: any
) {
  const notifications: CreateNotificationParams[] = []

  switch (status) {
    case 'assigned':
      // แจ้ง Requester
      if (cmData.requester_id) {
        notifications.push({
          userId: cmData.requester_id,
          type: 'cm_assigned',
          title: 'งานถูกมอบหมาย',
          message: `งาน ${cmData.notification_id} ถูกมอบหมายให้ช่าง ${cmData.technician_name}`,
          referenceType: 'cm_history',
          referenceId: cmHistoryId,
          priority: 'high',
          metadata: {
            notification_id: cmData.notification_id,
            asset_code: cmData.asset_code,
            technician_name: cmData.technician_name
          }
        })
      }
      
      // แจ้ง Technician
      if (cmData.technician_id) {
        notifications.push({
          userId: cmData.technician_id,
          type: 'cm_assigned',
          title: 'คุณได้รับมอบหมายงาน',
          message: `คุณได้รับมอบหมายงาน ${cmData.notification_id}`,
          referenceType: 'cm_history',
          referenceId: cmHistoryId,
          priority: 'critical',
          metadata: {
            notification_id: cmData.notification_id,
            asset_code: cmData.asset_code,
            problem_description: cmData.problem_description
          }
        })
      }
      break

    case 'accepted':
      // แจ้ง Requester
      if (cmData.requester_id) {
        notifications.push({
          userId: cmData.requester_id,
          type: 'cm_accepted',
          title: 'ช่างรับงานแล้ว',
          message: `ช่าง ${cmData.technician_name} รับงาน ${cmData.notification_id} แล้ว`,
          referenceType: 'cm_history',
          referenceId: cmHistoryId,
          priority: 'medium',
          metadata: {
            notification_id: cmData.notification_id,
            technician_name: cmData.technician_name
          }
        })
      }
      
      // แจ้ง Supervisor
      if (cmData.supervisor_id) {
        notifications.push({
          userId: cmData.supervisor_id,
          type: 'cm_accepted',
          title: 'ช่างรับงาน',
          message: `ช่าง ${cmData.technician_name} รับงาน ${cmData.notification_id}`,
          referenceType: 'cm_history',
          referenceId: cmHistoryId,
          priority: 'medium',
          metadata: {
            notification_id: cmData.notification_id,
            technician_name: cmData.technician_name
          }
        })
      }
      break

    case 'in_progress':
      // แจ้ง Requester
      if (cmData.requester_id) {
        notifications.push({
          userId: cmData.requester_id,
          type: 'cm_in_progress',
          title: 'ช่างเริ่มทำงานแล้ว',
          message: `ช่างเริ่มทำงาน ${cmData.notification_id} แล้ว`,
          referenceType: 'cm_history',
          referenceId: cmHistoryId,
          priority: 'medium',
          metadata: {
            notification_id: cmData.notification_id
          }
        })
      }
      
      // แจ้ง Supervisor
      if (cmData.supervisor_id) {
        notifications.push({
          userId: cmData.supervisor_id,
          type: 'cm_in_progress',
          title: 'งานกำลังดำเนินการ',
          message: `งาน ${cmData.notification_id} กำลังดำเนินการ`,
          referenceType: 'cm_history',
          referenceId: cmHistoryId,
          priority: 'medium',
          metadata: {
            notification_id: cmData.notification_id
          }
        })
      }
      break

    case 'completed':
      // แจ้ง Requester
      if (cmData.requester_id) {
        notifications.push({
          userId: cmData.requester_id,
          type: 'cm_completed',
          title: 'งานเสร็จสิ้นแล้ว',
          message: `งาน ${cmData.notification_id} เสร็จสิ้นแล้ว กรุณาประเมินความพึงพอใจ`,
          referenceType: 'cm_history',
          referenceId: cmHistoryId,
          priority: 'high',
          metadata: {
            notification_id: cmData.notification_id,
            requires_evaluation: true
          }
        })
      }
      
      // แจ้ง Supervisor
      if (cmData.supervisor_id) {
        notifications.push({
          userId: cmData.supervisor_id,
          type: 'cm_completed',
          title: 'งานเสร็จสิ้น',
          message: `งาน ${cmData.notification_id} เสร็จสิ้น รอการอนุมัติ`,
          referenceType: 'cm_history',
          referenceId: cmHistoryId,
          priority: 'high',
          metadata: {
            notification_id: cmData.notification_id
          }
        })
      }
      break
  }

  // Create all notifications
  const results = await Promise.all(
    notifications.map(n => createNotification(n))
  )

  return results
}

/**
 * สร้าง notification สำหรับการประเมิน
 */
export async function notifyCMEvaluation(
  cmHistoryId: number,
  technicianId: number,
  rating: number,
  cmData: any
) {
  return createNotification({
    userId: technicianId,
    type: 'cm_evaluated',
    title: 'ได้รับการประเมิน',
    message: `งาน ${cmData.notification_id} ได้รับการประเมิน ${rating} ดาว`,
    referenceType: 'cm_history',
    referenceId: cmHistoryId,
    priority: 'low',
    metadata: {
      notification_id: cmData.notification_id,
      rating,
      comment: cmData.satisfaction_comment
    }
  })
}

/**
 * สร้าง notification เมื่อมีงาน CM ใหม่ถูกสร้าง
 */
export async function notifyCMCreated(
  cmHistoryId: number,
  cmData: any
) {
  const notifications: CreateNotificationParams[] = []

  // แจ้ง Supervisor ทุกคนที่ active
  const supervisors = await query<{ id: number; full_name: string }>(
    `SELECT id, full_name 
     FROM users 
     WHERE role IN ('supervisor', 'engineer', 'admin') 
     AND is_active = 1`
  )

  for (const supervisor of supervisors) {
    notifications.push({
      userId: supervisor.id,
      type: 'cm_created',
      title: 'งาน CM ใหม่',
      message: `มีงาน CM ใหม่ ${cmData.notification_id} - ${cmData.asset_code} รอการมอบหมาย`,
      referenceType: 'cm_history',
      referenceId: cmHistoryId,
      priority: 'high',
      metadata: {
        notification_id: cmData.notification_id,
        asset_code: cmData.asset_code,
        asset_name: cmData.asset_name,
        problem_description: cmData.problem_description,
        priority: cmData.priority,
        requester_name: cmData.requester_name
      }
    })
  }

  // Create all notifications
  const results = await Promise.all(
    notifications.map(n => createNotification(n))
  )

  return results
}
