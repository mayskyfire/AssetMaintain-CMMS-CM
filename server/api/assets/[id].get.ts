export default defineEventHandler(async (event) => {
  try {
    const id = Number(getRouterParam(event, 'id'))

    if (!id || isNaN(id)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'Invalid asset ID'
      })
    }

    // Query asset from database
    const asset = await queryOne<{
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
       WHERE id = ?
       LIMIT 1`,
      [id]
    )

    if (!asset) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Not Found',
        message: 'Asset not found'
      })
    }

    return {
      success: true,
      data: asset
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    console.error('Get asset by ID error:', error)

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: error.message || 'Failed to fetch asset'
    })
  }
})
