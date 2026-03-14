/**
 * POST /api/cm/spare-approvals/:id/approve
 * อนุมัติคำขออะไหล่ CM + ตัดสต็อคจาก parts_materials
 */
export default defineEventHandler(async (event) => {
  try {
    const id = Number(getRouterParam(event, 'id'))
    const body = await readBody<{
      approved_by: number
      approval_notes?: string
    }>(event)

    if (!id || isNaN(id)) {
      throw createError({ statusCode: 400, message: 'Invalid approval ID' })
    }

    if (!body.approved_by) {
      throw createError({ statusCode: 400, message: 'approved_by is required' })
    }

    // Check approval exists and is pending
    const approval = await queryOne<{
      id: number
      cm_history_id: number
      status: string
      requested_by: number
    }>(
      'SELECT id, cm_history_id, status, requested_by FROM cm_spare_part_approvals WHERE id = ?',
      [id]
    )

    if (!approval) {
      throw createError({ statusCode: 404, message: 'Approval not found' })
    }

    if (approval.status !== 'pending') {
      throw createError({ statusCode: 400, message: 'Approval is not in pending status' })
    }

    // Check user has approval permission
    const hasPermission = await queryOne<{ can_approve: number }>(
      `SELECT rp.can_approve FROM users u
       INNER JOIN role_permissions rp ON u.role = rp.role_name
       WHERE u.id = ? AND rp.module = 'spare_parts' AND rp.can_approve = 1`,
      [body.approved_by]
    )

    if (!hasPermission) {
      throw createError({ statusCode: 403, message: 'ไม่มีสิทธิ์อนุมัติอะไหล่' })
    }

    // Get approval items
    const items = await query<{
      id: number
      part_id: number
      quantity: number
    }>(
      'SELECT id, part_id, quantity FROM cm_spare_approval_items WHERE approval_id = ?',
      [id]
    )

    const pool = getDbPool()

    // ตัดสต็อคอะไหล่จาก parts_materials + บันทึกลง cm_parts_used
    for (const item of items) {
      // Get current stock
      const part = await queryOne<{
        id: number
        part_name: string
        part_code: string | null
        unit: string | null
        unit_cost: number | null
        stock_quantity: number
      }>(
        'SELECT id, part_name, part_code, unit, unit_cost, stock_quantity FROM parts_materials WHERE id = ?',
        [item.part_id]
      )

      if (!part) continue

      const stockBefore = part.stock_quantity
      const stockAfter = Math.max(0, stockBefore - item.quantity)
      const totalCost = part.unit_cost ? part.unit_cost * item.quantity : null

      // ตัดสต็อค
      await pool.query(
        'UPDATE parts_materials SET stock_quantity = ?, updated_at = NOW() WHERE id = ?',
        [stockAfter, item.part_id]
      )

      // บันทึกลง cm_parts_used
      await pool.query(
        `INSERT INTO cm_parts_used 
         (cm_history_id, part_id, part_name, part_no, quantity, unit, unit_cost, total_cost, stock_before, stock_after, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          approval.cm_history_id,
          item.part_id,
          part.part_name,
          part.part_code,
          item.quantity,
          part.unit || 'ชิ้น',
          part.unit_cost,
          totalCost,
          stockBefore,
          stockAfter
        ]
      )
    }

    // Update approval status
    await pool.query(
      `UPDATE cm_spare_part_approvals 
       SET status = 'approved', approved_by = ?, approval_notes = ?, approved_at = NOW(), updated_at = NOW()
       WHERE id = ?`,
      [body.approved_by, body.approval_notes || null, id]
    )

    // Update cm_history status to spare_approved
    await pool.query(
      `UPDATE cm_history SET status = 'spare_approved', updated_at = NOW() WHERE id = ?`,
      [approval.cm_history_id]
    )

    // Get approver name for timeline
    const approver = await queryOne<{ full_name: string }>(
      'SELECT full_name FROM users WHERE id = ?',
      [body.approved_by]
    )

    // Add timeline event
    await pool.query(
      `INSERT INTO cm_timeline (cm_history_id, event, user, status, time)
       VALUES (?, ?, ?, ?, NOW())`,
      [approval.cm_history_id, 'อนุมัติอะไหล่แล้ว', approver?.full_name || 'ผู้อนุมัติ', 'completed']
    )

    // Send notification to requester
    try {
      const cmData = await queryOne<{ notification_id: string; requester_id: number }>(
        'SELECT notification_id, requester_id FROM cm_history WHERE id = ?',
        [approval.cm_history_id]
      )

      const { createNotification } = await import('../../../../utils/notificationHelper')
      if (cmData?.requester_id) {
        await createNotification({
          userId: cmData.requester_id,
          type: 'cm_spare_approved',
          title: 'อะไหล่ได้รับการอนุมัติ',
          message: `อะไหล่สำหรับงาน ${cmData.notification_id} ได้รับการอนุมัติแล้ว`,
          referenceType: 'cm_history',
          referenceId: approval.cm_history_id,
          priority: 'high'
        })
      }

      // Notify supervisors that spare is approved and ready for assignment
      const supervisors = await query<{ id: number }>(
        `SELECT id FROM users WHERE role IN ('supervisor', 'engineer', 'admin') AND is_active = 1`
      )
      for (const sup of supervisors) {
        await createNotification({
          userId: sup.id,
          type: 'cm_spare_approved',
          title: 'อะไหล่อนุมัติแล้ว - พร้อมมอบหมายงาน',
          message: `งาน ${cmData?.notification_id} อะไหล่อนุมัติแล้ว พร้อมมอบหมายช่าง`,
          referenceType: 'cm_history',
          referenceId: approval.cm_history_id,
          priority: 'high'
        })
      }
    } catch (notifError) {
      console.error('Failed to send approval notification:', notifError)
    }

    return {
      success: true,
      message: 'อนุมัติอะไหล่สำเร็จ ตัดสต็อคเรียบร้อย'
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Approve CM spare error:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to approve spare parts'
    })
  }
})
