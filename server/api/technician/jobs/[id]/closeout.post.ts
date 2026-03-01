import type { CloseoutJobRequest } from '~/types/api'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(getRouterParam(event, 'id'))
    const body = await readBody<CloseoutJobRequest>(event)

    if (!id || isNaN(id)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'Invalid job ID'
      })
    }

    // Validation
    if (!body.root_cause || !body.corrective_action) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'Root cause and corrective action are required'
      })
    }

    // Check if job exists
    const job = await queryOne<{
      id: number
      status: string
      completion_date: Date | null
    }>(
      'SELECT id, status, completion_date FROM cm_history WHERE id = ?',
      [id]
    )

    if (!job) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Not Found',
        message: 'Job not found'
      })
    }

    if (job.completion_date) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'Job already closed'
      })
    }

    // Calculate total cost
    const totalCost = (body.labor_cost || 0) + (body.parts_cost || 0) + (body.external_cost || 0)

    // Convert completion_date to MySQL format (Thailand timezone)
    let completionDate = null
    if (body.completion_date) {
      completionDate = toThaiDatetime(body.completion_date)
    } else {
      completionDate = toThaiDatetime()
    }

    // อัพโหลดลายเซ็นถ้ามี (base64 → Railway)
    let signatureUrl = null
    if (body.signature) {
      try {
        // แยก base64 data
        const matches = body.signature.match(/^data:image\/(\w+);base64,(.+)$/)
        if (matches) {
          const imageType = matches[1]
          const base64Data = matches[2]
          const buffer = Buffer.from(base64Data, 'base64')

          // สร้างชื่อไฟล์
          const timestamp = Date.now()
          const fileName = `signature-${timestamp}.${imageType}`
          
          // สร้าง subpath: /cm_history/{id}/signature
          const subpath = `/cm_history/${id}/signature`

          // ตรวจสอบ Railway upload URL
          const railwayUploadUrl = process.env.UPLOAD_URL

          if (railwayUploadUrl) {
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

            if (response.ok && response.url) {
              // Extract path from Railway response URL
              try {
                const url = new URL(response.url)
                signatureUrl = url.pathname // Get only the path part
              } catch {
                signatureUrl = response.url
              }
            }
          }
        }
      } catch (signatureError) {
        console.error('Failed to save signature:', signatureError)
        // ไม่ throw error เพราะไม่อยากให้ signature ทำให้ closeout ล้มเหลว
      }
    }

    // Close job
    await query(
      `UPDATE cm_history 
       SET root_cause = ?,
           corrective_action = ?,
           preventive_recommendation = ?,
           labor_hours = ?,
           labor_cost = ?,
           parts_cost = ?,
           external_cost = ?,
           total_cost = ?,
           completion_date = ?,
           completed_by = ?,
           signature_url = ?,
           qr_scanned_end = NOW(),
           status = 'completed',
           updated_at = NOW()
       WHERE id = ?`,
      [
        body.root_cause,
        body.corrective_action,
        body.preventive_recommendation || null,
        body.labor_hours || null,
        body.labor_cost || null,
        body.parts_cost || null,
        body.external_cost || null,
        totalCost,
        completionDate,
        body.completed_by || 'ช่าง',
        signatureUrl,
        id
      ]
    )

    // Insert after photos if provided
    if (body.photos && body.photos.length > 0) {
      for (const photo of body.photos) {
        // Extract path from full URL if needed
        // If photo is full URL (https://...), extract only the path part
        let photoPath = photo
        try {
          const url = new URL(photo)
          photoPath = url.pathname // Get only the path part (e.g., /16/after/image.jpg)
        } catch {
          // If not a valid URL, assume it's already a path
          photoPath = photo
        }
        
        await query(
          `INSERT INTO cm_evidence_images (
            cm_history_id,
            image_type,
            url,
            caption,
            created_at
          ) VALUES (?, 'after', ?, 'รูปหลังซ่อม', NOW())`,
          [id, photoPath]
        )
      }
    }

    // Update timeline: เริ่มดำเนินการซ่อม to completed status
    await query(
      `UPDATE cm_timeline 
       SET status = 'completed'
       WHERE cm_history_id = ? AND event = 'เริ่มดำเนินการซ่อม'`,
      [id]
    )

    // Add timeline event: ปิดงานซ่อม
    await query(
      `INSERT INTO cm_timeline (cm_history_id, event, user, status, time)
       VALUES (?, ?, ?, ?, NOW())`,
      [id, 'ปิดงานซ่อม', body.completed_by || 'ช่าง', 'completed']
    )

    return {
      success: true,
      message: 'Job closed successfully'
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    console.error('Closeout job error:', error)

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: error.message || 'Failed to close job'
    })
  }
})
