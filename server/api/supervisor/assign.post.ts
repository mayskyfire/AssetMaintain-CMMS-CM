import type { AssignTechnicianRequest } from '~/types/api'
import { notifyCMStatusChange } from '../../utils/notificationHelper'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<AssignTechnicianRequest>(event)

    // Validation - รองรับทั้ง technician_ids (array) และ technician_id (เดิม) เพื่อ backward compatibility
    const technicianIds: number[] = body.technician_ids || ((body as any).technician_id ? [(body as any).technician_id] : [])

    if (!body.cm_history_id || technicianIds.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'กรุณาระบุ Notification ID และเลือกช่างอย่างน้อย 1 คน'
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
        message: 'ไม่พบใบแจ้งซ่อม'
      })
    }

    // Check if spare parts approval is pending
    if (notification.status === 'pending_spare_approval') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'ต้องอนุมัติอะไหล่ก่อนจึงจะมอบหมายงานได้'
      })
    }

    // Validate all technicians
    const techNames: string[] = []
    for (const techId of technicianIds) {
      const technician = await queryOne<{
        id: number
        full_name: string
        role: string
        is_active: number
      }>(
        'SELECT id, full_name, role, is_active FROM users WHERE id = ?',
        [techId]
      )

      if (!technician) {
        throw createError({ statusCode: 404, message: `ไม่พบช่าง ID: ${techId}` })
      }
      if (technician.role !== 'technician') {
        throw createError({ statusCode: 400, message: `${technician.full_name} ไม่ใช่ช่างเทคนิค` })
      }
      if (!technician.is_active) {
        throw createError({ statusCode: 400, message: `${technician.full_name} ไม่พร้อมให้บริการ` })
      }

      // Check duplicate assignment
      const existing = await queryOne<{ id: number }>(
        'SELECT id FROM cm_technician_assignments WHERE cm_history_id = ? AND technician_id = ?',
        [body.cm_history_id, techId]
      )
      if (existing) {
        throw createError({ statusCode: 400, message: `${technician.full_name} ถูกมอบหมายงานนี้แล้ว` })
      }

      techNames.push(technician.full_name)
    }

    // ช่างคนแรก = ช่างหลัก (lead)
    const leadTechId = technicianIds[0]

    // Update cm_history - set lead technician for backward compatibility
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
      [leadTechId, body.supervisor_id || null, body.cm_history_id]
    )

    // Insert into cm_technician_assignments
    for (let i = 0; i < technicianIds.length; i++) {
      await query(
        `INSERT INTO cm_technician_assignments 
         (cm_history_id, technician_id, assigned_by, assigned_at, is_lead, status)
         VALUES (?, ?, ?, NOW(), ?, 'assigned')`,
        [body.cm_history_id, technicianIds[i], body.supervisor_id || null, i === 0 ? 1 : 0]
      )
    }

    // Add timeline event
    const allNames = techNames.join(', ')
    await query(
      `INSERT INTO cm_timeline (cm_history_id, event, user, status, time)
       VALUES (?, ?, ?, ?, NOW())`,
      [body.cm_history_id, 'มอบหมายช่างซ่อม', `มอบหมายให้: ${allNames}`, 'completed']
    )

    // Get CM data for notifications
    const cmData = await queryOne<{
      notification_id: string
      asset_id: number
      requester_id: number
      problem_description: string
    }>(
      `SELECT notification_id, asset_id, requester_id, problem_description
       FROM cm_history WHERE id = ?`,
      [body.cm_history_id]
    )

    const asset = await queryOne<{ asset_code: string }>(
      'SELECT asset_code FROM assets WHERE id = ?',
      [cmData?.asset_id]
    )

    // Send notifications to all technicians
    try {
      for (let i = 0; i < technicianIds.length; i++) {
        await notifyCMStatusChange(body.cm_history_id, 'assigned', {
          notification_id: cmData?.notification_id,
          asset_code: asset?.asset_code,
          requester_id: cmData?.requester_id,
          technician_id: technicianIds[i],
          technician_name: techNames[i],
          problem_description: cmData?.problem_description
        })
      }
    } catch (notifError) {
      console.error('Failed to send assignment notifications:', notifError)
    }

    return {
      success: true,
      message: `มอบหมายงานให้ ${techNames.join(', ')} สำเร็จ`
    }
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Assign technician error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: error.message || 'มอบหมายงานไม่สำเร็จ'
    })
  }
})
