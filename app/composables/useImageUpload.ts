/**
 * Composable for uploading images to server
 */

export interface UploadImageOptions {
  cm_history_id: number
  image_type: 'evidence' | 'before' | 'after'
  file: File
}

export interface UploadedImage {
  path: string
  filename: string
  size: number
  type: string
}

export const useImageUpload = () => {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBase || '/api'

  /**
   * Upload a single image
   */
  const uploadImage = async (options: UploadImageOptions): Promise<UploadedImage> => {
    const formData = new FormData()
    formData.append('cm_history_id', options.cm_history_id.toString())
    formData.append('image_type', options.image_type)
    formData.append('file', options.file)

    try {
      const response = await fetch(`${baseURL}/upload`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Upload failed')
      }

      const result = await response.json()
      
      if (!result.success || !result.files || result.files.length === 0) {
        throw new Error('No file uploaded')
      }

      return result.files[0]
    } catch (error: any) {
      console.error('Upload error:', error)
      throw new Error(error.message || 'Failed to upload image')
    }
  }

  /**
   * Upload multiple images
   */
  const uploadImages = async (
    cm_history_id: number,
    image_type: 'evidence' | 'before' | 'after',
    files: File[]
  ): Promise<UploadedImage[]> => {
    const formData = new FormData()
    formData.append('cm_history_id', cm_history_id.toString())
    formData.append('image_type', image_type)
    
    files.forEach((file) => {
      formData.append('file', file)
    })

    try {
      const response = await fetch(`${baseURL}/upload`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Upload failed')
      }

      const result = await response.json()
      
      if (!result.success || !result.files) {
        throw new Error('Upload failed')
      }

      return result.files
    } catch (error: any) {
      console.error('Upload error:', error)
      throw new Error(error.message || 'Failed to upload images')
    }
  }

  /**
   * Convert base64 to File object
   */
  const base64ToFile = (base64: string, filename: string): File => {
    const arr = base64.split(',')
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg'
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    
    return new File([u8arr], filename, { type: mime })
  }

  /**
   * Upload base64 image
   */
  const uploadBase64Image = async (
    cm_history_id: number,
    image_type: 'evidence' | 'before' | 'after',
    base64: string,
    filename?: string
  ): Promise<UploadedImage> => {
    const file = base64ToFile(base64, filename || `image-${Date.now()}.jpg`)
    return uploadImage({ cm_history_id, image_type, file })
  }

  return {
    uploadImage,
    uploadImages,
    uploadBase64Image,
    base64ToFile
  }
}
