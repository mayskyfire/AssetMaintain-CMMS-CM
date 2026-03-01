/**
 * POST /api/upload/signature
 * Upload signature (base64 → file) to Railway service
 */

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<{
      cm_history_id: number
      signature: string // base64 data URL
      file_name?: string
    }>(event)

    // Validation
    if (!body.cm_history_id || !body.signature) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'cm_history_id and signature are required'
      })
    }

    // ตรวจสอบว่าเป็น base64 data URL
    if (!body.signature.startsWith('data:image/')) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'Invalid signature format. Must be base64 data URL'
      })
    }

    // แยก base64 data
    const matches = body.signature.match(/^data:image\/(\w+);base64,(.+)$/)
    if (!matches) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'Invalid base64 format'
      })
    }

    const imageType = matches[1] // png, jpeg, etc.
    const base64Data = matches[2]
    const buffer = Buffer.from(base64Data, 'base64')

    // สร้างชื่อไฟล์
    const timestamp = Date.now()
    const fileName = body.file_name || `signature-${timestamp}.${imageType}`
    
    // สร้าง subpath: /cm_history/{cm_history_id}/signature
    const subpath = `/cm_history/${body.cm_history_id}/signature`

    // ตรวจสอบ Railway upload URL
    const railwayUploadUrl = process.env.UPLOAD_URL

    if (!railwayUploadUrl) {
      throw createError({
        statusCode: 500,
        message: 'UPLOAD_URL is not configured'
      })
    }

    // สร้าง FormData สำหรับอัพโหลดไป Railway
    const FormData = (await import('formdata-node')).FormData
    const { Blob } = await import('buffer')
    
    const uploadFormData = new FormData()
    const blob = new Blob([new Uint8Array(buffer)], { 
      type: `image/${imageType}` 
    })
    uploadFormData.append('file', blob, fileName)
    uploadFormData.append('subpath', subpath)

    // Upload to Railway
    const response = await $fetch<{ 
      ok: boolean
      filename: string
      url: string 
    }>(railwayUploadUrl, {
      method: 'POST',
      body: uploadFormData
    })

    if (!response.ok || !response.url) {
      throw createError({
        statusCode: 500,
        message: 'Railway upload failed'
      })
    }

    // Extract path from Railway response URL
    let filePath = response.url
    try {
      const url = new URL(response.url)
      filePath = url.pathname // Get only the path part
    } catch {
      // If not a valid URL, use as is
      filePath = response.url
    }

    // อัพเดท signature_url ในฐานข้อมูล
    await query(
      'UPDATE cm_history SET signature_url = ?, updated_at = NOW() WHERE id = ?',
      [filePath, body.cm_history_id]
    )

    return {
      success: true,
      path: filePath,
      filename: response.filename || fileName,
      message: 'Signature uploaded successfully'
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    console.error('Upload signature error:', error)
    console.error('Error details:', {
      message: error.message,
      cause: error.cause
    })

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: error.message || 'Failed to upload signature'
    })
  }
})
