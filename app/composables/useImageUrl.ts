/**
 * Composable for handling image URLs
 * Combines S3_URL with image path from database
 */

export const useImageUrl = () => {
  const config = useRuntimeConfig()
  const s3Url = config.public.s3Url

  /**
   * Get full image URL from path
   * @param path - Image path from database (e.g., "/16/evidence/image.jpg")
   * @returns Full URL (e.g., "https://s3.../16/evidence/image.jpg")
   */
  const getImageUrl = (path: string | null | undefined): string => {
    if (!path) return ''
    
    // If already a full URL, return as is
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path
    }
    
    // Ensure path starts with /
    const cleanPath = path.startsWith('/') ? path : `/${path}`
    
    return `${s3Url}${cleanPath}`
  }

  /**
   * Get image URLs from array of paths
   */
  const getImageUrls = (paths: (string | null | undefined)[]): string[] => {
    return paths.map(getImageUrl).filter(url => url !== '')
  }

  return {
    getImageUrl,
    getImageUrls,
    s3Url
  }
}
