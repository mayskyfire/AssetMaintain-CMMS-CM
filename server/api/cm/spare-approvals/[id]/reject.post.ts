/**
 * POST /api/cm/spare-approvals/:id/reject
 * ปฏิเสธคำขออะไหล่ CM
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
    }>(
      'SELECT id, cm_history_id, status FROM cm_spare_part_approvals WHERE id = ?',
      [id]
    )

    if (!approval) {
      throw createError({ statusCode: 404, message: 'Approval not found' })
    }

    if (approval.status !== 'pending') {
      throw createError({ statusCode: 400, message: 'Approval is not in pending status' })
    }

    const pool = getDbPool()

    // Update approval status to rejected
    await pool.query(
      `UPDATE cm_spare_part_approvals 
       SET status = 'rejected', approved_by = ?, approval_notes = ?, approved_at = NOW(), updated_at = NOW()
       WHERE id = ?`,
      [body.approved_by, body.approval_notes || null, id]
    )

    // Revert cm_history status back to reported (ให้แจ้งใหม่ได้)
    await pool.query(
      `UPDATE cm_history SET status = 'reported', updated_at = NOW() WHERE id = ?`,
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
      [approval.cm_history_id, 'ปฏิเสธอะไหล่', approver?.full_name || 'ผู้อนุมัติ', 'completed']
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
          type: 'cm_spare_rejected',
          title: 'อะไหล่ถูกปฏิเสธ',
          message: `อะไหล่สำหรับงาน ${cmData.notification_id} ถูกปฏิเสธ${body.approval_notes ? ': ' + body.approval_notes : ''}`,
          referenceType: 'cm_history',
          referenceId: approval.cm_history_id,
          priority: 'high'
        })
      }
    } catch (notifError) {
      console.error('Failed to send rejection notification:', notifError)
    }

    return {
      success: true,
      message: 'ปฏิเสธคำขออะไหล่แล้ว'
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Reject CM spare error:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to reject spare parts'
    })
  }
})
