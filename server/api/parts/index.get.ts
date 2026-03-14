/**
 * GET /api/parts
 * ดึงรายการอะไหล่จากตาราง parts_materials
 * ใช้สำหรับ dropdown เลือกอะไหล่ในหน้า technician parts
 */
export default defineEventHandler(async (event) => {
  try {
    const queryParams = getQuery(event)
    const search = (queryParams.search as string) || ''

    let sql = `
      SELECT id, part_code, part_name, category, unit, unit_cost, stock_quantity, min_stock_level
      FROM parts_materials
    `
    const params: any[] = []

    if (search) {
      sql += ` WHERE part_name LIKE ? OR part_code LIKE ?`
      params.push(`%${search}%`, `%${search}%`)
    }

    sql += ` ORDER BY part_name ASC`

    const parts = await query<{
      id: number
      part_code: string | null
      part_name: string
      category: string | null
      unit: string | null
      unit_cost: number | null
      stock_quantity: number
      min_stock_level: number | null
    }>(sql, params)

    return {
      success: true,
      data: parts
    }
  } catch (error: any) {
    console.error('Get parts_materials error:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to fetch parts materials'
    })
  }
})
