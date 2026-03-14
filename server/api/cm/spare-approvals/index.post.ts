/**
 * POST /api/cm/spare-approvals
 * สร้างคำขออนุมัติอะไหล่ CM (เรียกหลังจากสร้างใบแจ้งซ่อม)
 */
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<{
      cm_history_id: number
      requested_by: number
      request_notes?: string
      items: Array<{
        part_id: number
        quantity: number
      }>
    }>(event)

    if (!body.cm_history_id || !body.items || body.items.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'cm_history_id and items are required'
      })
    }

    // Verify CM job exists
    const cmJob = await queryOne<{ id: number; status: string }>(
      'SELECT id, status FROM cm_history WHERE id = ?',
      [body.cm_history_id]
    )

    if (!cmJob) {
      throw createError({ statusCode: 404, message: 'CM job not found' })
    }

    const pool = getDbPool()

    // Create approval request
    const [result] = await pool.query(
      `INSERT INTO cm_spare_part_approvals 
       (cm_history_id, requested_by, status, request_notes, requested_at, created_at, updated_at)
       VALUES (?, ?, 'pending', ?, NOW(), NOW(), NOW())`,
      [body.cm_history_id, body.requested_by, body.request_notes || null]
    )

    const approvalId = (result as any).insertId

    // Insert approval items
    for (const item of body.items) {
      await pool.query(
        `INSERT INTO cm_spare_approval_items (approval_id, part_id, quantity, created_at)
         VALUES (?, ?, ?, NOW())`,
        [approvalId, item.part_id, item.quantity]
      )
    }

    // Update cm_history status to pending_spare_approval
    await pool.query(
      `UPDATE cm_history SET status = 'pending_spare_approval', updated_at = NOW() WHERE id = ?`,
      [body.cm_history_id]
    )

    // Get requester name for timeline
    const requester = await queryOne<{ full_name: string }>(
      'SELECT full_name FROM users WHERE id = ?',
      [body.requested_by]
    )

    // Add timeline event
    await pool.query(
      `INSERT INTO cm_timeline (cm_history_id, event, user, status, time)
       VALUES (?, ?, ?, ?, NOW())`,
      [body.cm_history_id, 'ขออนุมัติอะไหล่', requester?.full_name || 'ผู้แจ้ง', 'completed']
    )

    // Send notification to approvers
    try {
      const approvers = await query<{ id: number }>(
        `SELECT u.id FROM users u
         INNER JOIN role_permissions rp ON u.role = rp.role_name
         WHERE rp.module = 'spare_parts' AND rp.can_approve = 1 AND u.is_active = 1`
      )

      const cmData = await queryOne<{ notification_id: string; asset_id: number }>(
        'SELECT notification_id, asset_id FROM cm_history WHERE id = ?',
        [body.cm_history_id]
      )
      const asset = await queryOne<{ asset_code: string; asset_name: string }>(
        'SELECT asset_code, asset_name FROM assets WHERE id = ?',
        [cmData?.asset_id]
      )

      const { createNotification } = await import('../../../utils/notificationHelper')
      for (const approver of approvers) {
        await createNotification({
          userId: approver.id,
          type: 'cm_spare_approval',
          title: 'คำขออนุมัติอะไหล่ CM',
          message: `งาน ${cmData?.notification_id} - ${asset?.asset_name} ขออนุมัติอะไหล่ ${body.items.length} รายการ`,
          referenceType: 'cm_history',
          referenceId: body.cm_history_id,
          priority: 'high',
          metadata: {
            approval_id: approvalId,
            notification_id: cmData?.notification_id,
            asset_code: asset?.asset_code
          }
        })
      }
    } catch (notifError) {
      console.error('Failed to send spare approval notification:', notifError)
    }

    return {
      success: true,
      data: { id: approvalId },
      message: 'สร้างคำขออนุมัติอะไหล่สำเร็จ'
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Create CM spare approval error:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to create spare part approval'
    })
  }
})
