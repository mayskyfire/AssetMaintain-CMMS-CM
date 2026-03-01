// PATCH /api/notifications/:id - อัพเดท notification (mark as read)
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  // ตรวจสอบว่า notification เป็นของ user นี้
  const notification = await queryOne<any>(
    'SELECT * FROM cm_notifications WHERE id = ? AND user_id = ?',
    [id, user.id]
  )

  if (!notification) {
    throw createError({
      statusCode: 404,
      message: 'Notification not found'
    })
  }

  // Update notification
  const updates: string[] = []
  const params: any[] = []

  if (body.isRead !== undefined) {
    updates.push('is_read = ?')
    params.push(body.isRead ? 1 : 0)
    
    if (body.isRead) {
      updates.push('read_at = NOW()')
    }
  }

  if (updates.length > 0) {
    params.push(id, user.id)
    await query(
      `UPDATE cm_notifications SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
      params
    )
  }

  // Get updated notification
  const updated = await queryOne<any>(
    'SELECT * FROM cm_notifications WHERE id = ? AND user_id = ?',
    [id, user.id]
  )

  return {
    success: true,
    data: updated
  }
})
