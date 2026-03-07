export default defineEventHandler(async (event) => {
  try {
    // Get query parameters
    const queryParams = getQuery(event)
    const page = parseInt(queryParams.page as string) || 1
    const limit = parseInt(queryParams.limit as string) || 20
    const offset = (page - 1) * limit

    // Query assets from database
    const assets = await query<{
      id: number
      asset_code: string
      asset_name: string
      brand_model: string | null
      serial_number: string | null
      capacity: string | null
      location: string
      site: string
      zone: string
      building: string | null
      floor: string | null
      installation_date: Date
      warranty_expiry: Date | null
      status: 'active' | 'inactive' | 'maintenance' | 'retired'
      notes: string | null
    }>(
      `SELECT id, asset_code, asset_name, brand_model, serial_number, capacity, 
              location, site, zone, building, floor, installation_date, 
              warranty_expiry, status, notes
       FROM assets 
       WHERE status = 'active'
       ORDER BY asset_code ASC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    )

    // Get total count
    const [countResult] = await query<{ total: number }>(
      'SELECT COUNT(*) as total FROM assets WHERE status = ?',
      ['active']
    )

    const total = countResult?.total || 0

    return {
      success: true,
      data: assets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  } catch (error: any) {
    console.error('Get assets error:', error)
    
    if (error.statusCode) throw error

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: error.message || 'Failed to fetch assets'
    })
  }
})
