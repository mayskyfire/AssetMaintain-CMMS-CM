/**
 * GET /api/cm/spare-approvals
 * ดึงรายการคำขออนุมัติอะไหล่ CM ทั้งหมด (สำหรับผู้มีสิทธิ์อนุมัติ)
 */
export default defineEventHandler(async (event) => {
  try {
    const queryParams = getQuery(event)
    const status = (queryParams.status as string) || ''

    let sql = `
      SELECT 
        csa.id,
        csa.cm_history_id,
        csa.status,
        csa.request_notes,
        csa.approval_notes,
        csa.requested_at,
        csa.approved_at,
        ch.notification_id,
        ch.priority,
        ch.status AS cm_status,
        a.asset_code,
        a.asset_name,
        a.location,
        u1.full_name AS requested_by_name,
        u2.full_name AS approved_by_name
      FROM cm_spare_part_approvals csa
      INNER JOIN cm_history ch ON csa.cm_history_id = ch.id
      INNER JOIN assets a ON ch.asset_id = a.id
      INNER JOIN users u1 ON csa.requested_by = u1.id
      LEFT JOIN users u2 ON csa.approved_by = u2.id
    `
    const params: any[] = []

    if (status && status !== 'all') {
      sql += ` WHERE csa.status = ?`
      params.push(status)
    }

    sql += ` ORDER BY csa.requested_at DESC`

    const approvals = await query<any>(sql, params)

    // Get items for each approval
    for (const approval of approvals) {
      const items = await query<{
        id: number
        part_id: number
        part_name: string
        part_code: string | null
        quantity: number
        unit: string | null
        unit_cost: number | null
        stock_quantity: number
      }>(
        `SELECT 
          csai.id,
          csai.part_id,
          pm.part_name,
          pm.part_code,
          csai.quantity,
          pm.unit,
          pm.unit_cost,
          pm.stock_quantity
        FROM cm_spare_approval_items csai
        INNER JOIN parts_materials pm ON csai.part_id = pm.id
        WHERE csai.approval_id = ?`,
        [approval.id]
      )
      approval.items = items
    }

    return {
      success: true,
      data: approvals
    }
  } catch (error: any) {
    console.error('Get CM spare approvals error:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to fetch spare part approvals'
    })
  }
})
