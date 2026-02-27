export default defineEventHandler(async (event) => {
  try {
    const code = getRouterParam(event, 'code')

    if (!code) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'Asset code is required'
      })
    }

    // Try to parse as JSON first (QR code might contain JSON)
    let assetCode = code
    try {
      const parsed = JSON.parse(decodeURIComponent(code))
      if (parsed.asset_code) {
        assetCode = parsed.asset_code
      }
    } catch {
      // Not JSON, use as-is
      assetCode = decodeURIComponent(code)
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
       WHERE asset_code = ?
       LIMIT 1`,
      [assetCode]
    )

    if (!asset) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Not Found',
        message: `Asset with code '${assetCode}' not found`
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

    console.error('Get asset by code error:', error)

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: error.message || 'Failed to fetch asset'
    })
  }
})
