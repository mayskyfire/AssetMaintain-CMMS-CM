/**
 * POST /api/upload
 * Upload photos for PM jobs - Upload to Railway service
 */

export default defineEventHandler(async (event) => {
  try {
    const formData = await readMultipartFormData(event);
    
    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No file uploaded'
      });
    }

    // Extract cm_history_id, image_type, and subpath from formData
    let cmHistoryId = '';
    let imageType = 'evidence'; // default: 'evidence', 'before', 'after'
    let subpath = ''; // Will be constructed as: {cm_history_id}/{image_type}
    const files: Array<{ data: Buffer; filename: string; type?: string }> = [];
    
    for (const part of formData) {
      // Check if this part is the cm_history_id
      if (part.name === 'cm_history_id' && part.data) {
        cmHistoryId = part.data.toString('utf-8');
      }
      // Check if this part is the image_type
      else if (part.name === 'image_type' && part.data) {
        imageType = part.data.toString('utf-8');
      }
      // Check if this part is the jobId (for backward compatibility)
      else if (part.name === 'jobId' && part.data) {
        cmHistoryId = part.data.toString('utf-8');
      }
      // Otherwise, it's a file
      else if (part.filename && part.data) {
        files.push({
          data: part.data,
          filename: part.filename,
          type: part.type
        });
      }
    }

    if (!cmHistoryId) {
      throw createError({
        statusCode: 400,
        message: 'cm_history_id is required'
      });
    }

    if (files.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No files to upload'
      });
    }

    // Construct subpath: {cm_history_id}/{image_type}
    subpath = `/cm_history/${cmHistoryId}/${imageType}`;

    const railwayUploadUrl = process.env.UPLOAD_URL;

    if (!railwayUploadUrl) {
      throw createError({
        statusCode: 500,
        message: 'UPLOAD_URL is not configured'
      });
    }

    // Upload each file to Railway
    const uploadedFiles = [];
    
    for (const file of files) {
      try {
        // สร้าง FormData สำหรับแต่ละไฟล์
        const FormData = (await import('formdata-node')).FormData;
        const { Blob } = await import('buffer');
        
        const uploadFormData = new FormData();
        const blob = new Blob([new Uint8Array(file.data)], { type: file.type || 'application/octet-stream' });
        uploadFormData.append('file', blob, file.filename);
        
        // เพิ่ม subpath ถ้ามี (เช่น 'cm_history', 'cm_history')
        if (subpath) {
          uploadFormData.append('subpath', subpath);
        }

        // Upload to Railway
        const response = await $fetch<{ ok: boolean; filename: string; url: string }>(railwayUploadUrl, {
          method: 'POST',
          body: uploadFormData
        });

        if (response.ok && response.url) {
          // Extract path from Railway response URL
          let filePath = response.url
          try {
            const url = new URL(response.url)
            filePath = url.pathname // Get only the path part
          } catch {
            // If not a valid URL, use as is
            filePath = response.url
          }
          
          uploadedFiles.push({
            path: filePath, // Store only the path, not full URL
            filename: response.filename || file.filename,
            size: file.data.length,
            type: file.type || 'application/octet-stream'
          });
        } else {
          console.error('Railway upload failed for file:', file.filename);
        }
      } catch (fileError) {
        console.error('Error uploading file to Railway:', file.filename, fileError);
        // Continue with other files even if one fails
      }
    }

    if (uploadedFiles.length === 0) {
      throw createError({
        statusCode: 500,
        message: 'Failed to upload any files to Railway'
      });
    }

    return {
      success: true,
      files: uploadedFiles
    };

  } catch (error: any) {
    console.error('Upload error:', error);
    console.error('Error details:', {
      message: error.message,
      cause: error.cause,
      statusCode: error.statusCode
    });
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      message: error.message || 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ'
    });
  }
});
