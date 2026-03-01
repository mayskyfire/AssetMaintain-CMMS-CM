// GET /api/notifications/unread-count - นับจำนวน notifications ที่ยังไม่อ่าน
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const [result] = await query<{ count: number }>(`
    SELECT COUNT(*) as count
    FROM cm_notifications
    WHERE user_id = ? AND is_read = 0
  `, [user.id])

  return {
    success: true,
    data: {
      count: result?.count || 0
    }
  }
})
