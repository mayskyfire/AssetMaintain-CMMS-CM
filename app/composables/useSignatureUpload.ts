// Composable สำหรับอัพโหลดลายเซ็น
export const useSignatureUpload = () => {
  const { apiCall } = useApi()

  /**
   * อัพโหลดลายเซ็น (base64 → file)
   * @param cmHistoryId - ID ของ CM History
   * @param signatureBase64 - ลายเซ็นในรูปแบบ base64 data URL
   * @param fileName - ชื่อไฟล์ (optional)
   * @returns URL path ของลายเซ็นที่อัพโหลด
   */
  const uploadSignature = async (
    cmHistoryId: number,
    signatureBase64: string,
    fileName?: string
  ): Promise<{ path: string }> => {
    try {
      const response = await apiCall<{ path: string }>('/api/upload/signature', {
        method: 'POST',
        body: {
          cm_history_id: cmHistoryId,
          signature: signatureBase64,
          file_name: fileName
        }
      })

      return response
    } catch (error) {
      console.error('Failed to upload signature:', error)
      throw error
    }
  }

  /**
   * สร้าง URL สำหรับแสดงลายเซ็น
   * @param path - path ของลายเซ็น (เช่น /uploads/signatures/1/signature-123.png)
   * @returns Full URL
   */
  const getSignatureUrl = (path: string | null): string | null => {
    if (!path) return null
    
    const config = useRuntimeConfig()
    const baseUrl = config.public.apiBase || ''
    
    // ถ้า path เป็น full URL อยู่แล้ว ให้ return ตรงๆ
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path
    }
    
    // ถ้าเป็น relative path ให้เติม base URL
    return `${baseUrl}${path}`
  }

  return {
    uploadSignature,
    getSignatureUrl
  }
}
