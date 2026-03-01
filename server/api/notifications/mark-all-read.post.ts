// POST /api/notifications/mark-all-read - อ่านทั้งหมด
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  // Mark all as read
  await query(`
    UPDATE cm_notifications 
    SET is_read = 1, read_at = NOW()
    WHERE user_id = ? AND is_read = 0
  `, [user.id])

  return {
    success: true,
    message: 'All notifications marked as read'
  }
})
