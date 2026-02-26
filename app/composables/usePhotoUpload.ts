import { ref } from 'vue'

export interface PhotoFile {
  id: string
  file: File
  preview: string
  size: number
  type: string
  name: string
  compressed?: boolean
}

export interface PhotoUploadOptions {
  maxSizeMB?: number
  maxWidthOrHeight?: number
  quality?: number
  acceptedTypes?: string[]
  maxFiles?: number
}

const defaultOptions: PhotoUploadOptions = {
  maxSizeMB: 5,
  maxWidthOrHeight: 1920,
  quality: 0.8,
  acceptedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  maxFiles: 10
}

export const usePhotoUpload = (options: PhotoUploadOptions = {}) => {
  const config = { ...defaultOptions, ...options }
  const photos = ref<PhotoFile[]>([])
  const isProcessing = ref(false)
  const error = ref<string>('')

  /**
   * Validate file type
   */
  const validateFileType = (file: File): boolean => {
    if (!config.acceptedTypes?.includes(file.type)) {
      error.value = `ไฟล์ต้องเป็นรูปภาพเท่านั้น (${config.acceptedTypes?.join(', ')})`
      return false
    }
    return true
  }

  /**
   * Validate file size
   */
  const validateFileSize = (file: File): boolean => {
    const maxBytes = (config.maxSizeMB || 5) * 1024 * 1024
    if (file.size > maxBytes) {
      error.value = `ไฟล์ต้องมีขนาดไม่เกิน ${config.maxSizeMB} MB`
      return false
    }
    return true
  }

  /**
   * Validate max files
   */
  const validateMaxFiles = (newFilesCount: number): boolean => {
    if (photos.value.length + newFilesCount > (config.maxFiles || 10)) {
      error.value = `สามารถอัพโหลดได้สูงสุด ${config.maxFiles} รูป`
      return false
    }
    return true
  }

  /**
   * Compress image
   */
  const compressImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        const img = new Image()
        
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          // Calculate new dimensions
          const maxDimension = config.maxWidthOrHeight || 1920
          if (width > height) {
            if (width > maxDimension) {
              height = (height * maxDimension) / width
              width = maxDimension
            }
          } else {
            if (height > maxDimension) {
              width = (width * maxDimension) / height
              height = maxDimension
            }
          }

          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('Cannot get canvas context'))
            return
          }

          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height)
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob)
              } else {
                reject(new Error('Canvas to Blob failed'))
              }
            },
            file.type,
            config.quality || 0.8
          )
        }

        img.onerror = () => reject(new Error('Image load failed'))
        img.src = e.target?.result as string
      }

      reader.onerror = () => reject(new Error('File read failed'))
      reader.readAsDataURL(file)
    })
  }

  /**
   * Create preview URL
   */
  const createPreview = (file: File | Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = () => reject(new Error('Preview creation failed'))
      reader.readAsDataURL(file)
    })
  }

  /**
   * Process single photo file
   */
  const processPhotoFile = async (file: File): Promise<PhotoFile | null> => {
    try {
      // Validate
      if (!validateFileType(file)) return null
      if (!validateFileSize(file)) return null

      // Compress if needed
      let processedFile: File | Blob = file
      let compressed = false

      const sizeMB = file.size / (1024 * 1024)
      if (sizeMB > 1) {
        // Compress files larger than 1MB
        processedFile = await compressImage(file)
        compressed = true
      }

      // Create preview
      const preview = await createPreview(processedFile)

      // Create PhotoFile object
      const photoFile: PhotoFile = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file: processedFile instanceof Blob ? new File([processedFile], file.name, { type: file.type }) : file,
        preview,
        size: processedFile.size,
        type: file.type,
        name: file.name,
        compressed
      }

      return photoFile
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการประมวลผลรูปภาพ'
      return null
    }
  }

  /**
   * Process multiple files
   */
  const processFiles = async (files: FileList | File[]): Promise<void> => {
    const fileArray = Array.from(files)
    
    // Validate max files
    if (!validateMaxFiles(fileArray.length)) return

    isProcessing.value = true
    error.value = ''

    try {
      const processedPhotos: PhotoFile[] = []

      for (const file of fileArray) {
        const photoFile = await processPhotoFile(file)
        if (photoFile) {
          processedPhotos.push(photoFile)
        }
      }

      photos.value.push(...processedPhotos)
    } catch (err) {
      error.value = 'เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ'
    } finally {
      isProcessing.value = false
    }
  }

  /**
   * Remove photo by id
   */
  const removePhoto = (id: string) => {
    const index = photos.value.findIndex(p => p.id === id)
    if (index > -1) {
      // Revoke object URL to free memory
      URL.revokeObjectURL(photos.value[index].preview)
      photos.value.splice(index, 1)
    }
  }

  /**
   * Remove photo by index
   */
  const removePhotoByIndex = (index: number) => {
    if (index >= 0 && index < photos.value.length) {
      URL.revokeObjectURL(photos.value[index].preview)
      photos.value.splice(index, 1)
    }
  }

  /**
   * Clear all photos
   */
  const clearPhotos = () => {
    // Revoke all object URLs
    photos.value.forEach(photo => {
      URL.revokeObjectURL(photo.preview)
    })
    photos.value = []
    error.value = ''
  }

  /**
   * Get total size in MB
   */
  const getTotalSize = (): number => {
    const totalBytes = photos.value.reduce((sum, photo) => sum + photo.size, 0)
    return totalBytes / (1024 * 1024)
  }

  /**
   * Convert photos to FormData
   */
  const toFormData = (fieldName: string = 'photos'): FormData => {
    const formData = new FormData()
    photos.value.forEach((photo, index) => {
      formData.append(`${fieldName}[${index}]`, photo.file, photo.name)
    })
    return formData
  }

  /**
   * Get photos as base64 array
   */
  const toBase64Array = (): string[] => {
    return photos.value.map(photo => photo.preview)
  }

  return {
    photos,
    isProcessing,
    error,
    processPhotoFile,
    processFiles,
    removePhoto,
    removePhotoByIndex,
    clearPhotos,
    getTotalSize,
    toFormData,
    toBase64Array
  }
}

/**
 * Standalone function to process single photo
 */
export const processPhotoFile = async (
  file: File,
  options: PhotoUploadOptions = {}
): Promise<{ preview: string; compressed: boolean } | null> => {
  const config = { ...defaultOptions, ...options }

  try {
    // Validate type
    if (!config.acceptedTypes?.includes(file.type)) {
      throw new Error(`ไฟล์ต้องเป็นรูปภาพเท่านั้น`)
    }

    // Validate size
    const maxBytes = (config.maxSizeMB || 5) * 1024 * 1024
    if (file.size > maxBytes) {
      throw new Error(`ไฟล์ต้องมีขนาดไม่เกิน ${config.maxSizeMB} MB`)
    }

    // Compress if needed
    let processedFile: File | Blob = file
    let compressed = false

    const sizeMB = file.size / (1024 * 1024)
    if (sizeMB > 1) {
      // Compress files larger than 1MB
      const reader = new FileReader()
      
      const compressedBlob = await new Promise<Blob>((resolve, reject) => {
        reader.onload = (e) => {
          const img = new Image()
          
          img.onload = () => {
            const canvas = document.createElement('canvas')
            let width = img.width
            let height = img.height

            const maxDimension = config.maxWidthOrHeight || 1920
            if (width > height) {
              if (width > maxDimension) {
                height = (height * maxDimension) / width
                width = maxDimension
              }
            } else {
              if (height > maxDimension) {
                width = (width * maxDimension) / height
                height = maxDimension
              }
            }

            canvas.width = width
            canvas.height = height

            const ctx = canvas.getContext('2d')
            if (!ctx) {
              reject(new Error('Cannot get canvas context'))
              return
            }

            ctx.drawImage(img, 0, 0, width, height)
            
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  resolve(blob)
                } else {
                  reject(new Error('Canvas to Blob failed'))
                }
              },
              file.type,
              config.quality || 0.8
            )
          }

          img.onerror = () => reject(new Error('Image load failed'))
          img.src = e.target?.result as string
        }

        reader.onerror = () => reject(new Error('File read failed'))
        reader.readAsDataURL(file)
      })

      processedFile = compressedBlob
      compressed = true
    }

    // Create preview
    const preview = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = () => reject(new Error('Preview creation failed'))
      reader.readAsDataURL(processedFile)
    })

    return { preview, compressed }
  } catch (err) {
    console.error('Photo processing error:', err)
    return null
  }
}
