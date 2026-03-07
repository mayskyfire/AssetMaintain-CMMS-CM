import type { ApiResponse, ApiError } from '../../types/api'

interface FetchOptions extends RequestInit {
  params?: Record<string, any>
  skipCache?: boolean // Skip cache for this request
  cacheTTL?: number // Cache TTL in minutes (default: 5)
}

export function useApi() {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBase || '/api'
  const { isOnline } = useNetworkStatus()
  const { setCache, getCache } = useOfflineStorage()
  const { addToQueue } = useOfflineStorage()

  // Get auth token from localStorage (will be set after login)
  const getAuthToken = (): string | null => {
    if (process.client) {
      return localStorage.getItem('auth_token')
    }
    return null
  }

  // Build URL with query params
  const buildURL = (endpoint: string, params?: Record<string, any>): string => {
    // Remove leading slash from endpoint if present
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
    
    // Combine baseURL and endpoint
    const fullURL = `${baseURL}/${cleanEndpoint}`
    
    // Add query params if provided
    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
      return `${fullURL}?${searchParams.toString()}`
    }
    
    return fullURL
  }

  // Generate cache key from URL
  const getCacheKey = (url: string, method: string): string => {
    return `api:${method}:${url}`
  }

  // Generic fetch wrapper with offline support
  async function apiFetch<T = any>(
    endpoint: string,
    options: FetchOptions = {}
  ): Promise<ApiResponse<T>> {
    const { params, skipCache = false, cacheTTL = 5, ...fetchOptions } = options
    const method = (fetchOptions.method || 'GET').toUpperCase()

    const url = buildURL(endpoint, params)
    const cacheKey = getCacheKey(url, method)
    const token = getAuthToken()

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(fetchOptions.headers as Record<string, string> || {})
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    // ===== OFFLINE HANDLING =====
    
    // For GET requests when offline, try to read from cache
    if (!isOnline.value && method === 'GET') {
      const cached = await getCache<ApiResponse<T>>(cacheKey)
      if (cached) {
        return cached
      }
      // No cache available
      throw {
        success: false,
        error: 'Offline',
        message: 'ไม่มีการเชื่อมต่ออินเทอร์เน็ต และไม่มีข้อมูลแคชสำหรับคำขอนี้',
        statusCode: 0
      } as ApiError
    }

    // For write operations (POST/PUT/PATCH/DELETE) when offline, add to queue
    if (!isOnline.value && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      // Parse body if it's a string
      let bodyData = fetchOptions.body
      if (typeof bodyData === 'string') {
        try {
          bodyData = JSON.parse(bodyData)
        } catch {
          // Keep as string if not JSON
        }
      }

      // Add to offline queue
      await addToQueue({
        type: 'notification', // Generic type - will be refined by useOfflineSync
        title: `${method} ${endpoint}`,
        description: `Offline ${method} request`,
        data: {
          endpoint,
          method,
          body: bodyData,
          params
        }
      })

      // Return optimistic response
      return {
        success: true,
        data: null as T,
        message: 'บันทึกลงคิวออฟไลน์แล้ว จะส่งข้อมูลเมื่อกลับมาออนไลน์'
      }
    }

    // ===== ONLINE HANDLING =====

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('[useApi] Error response:', data)

        // Token expired or unauthorized — auto logout & redirect to login
        if (response.status === 401) {
          if (import.meta.client) {
            localStorage.removeItem('auth_token')
            localStorage.removeItem('user_info')
            if (window.location.pathname !== '/') {
              window.location.href = '/'
            }
          }
          throw {
            success: false,
            error: 'Unauthorized',
            message: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่',
            statusCode: 401
          } as ApiError
        }

        throw {
          success: false,
          error: data.error || 'Request failed',
          message: data.message || response.statusText,
          statusCode: response.status
        } as ApiError
      }

      // Build response
      const apiResponse: ApiResponse<T> = {
        success: data.success !== undefined ? data.success : true,
        data: data.data,
        message: data.message,
        pagination: data.pagination,
        ...data // Include any other fields from the response
      }

      // Cache successful GET responses
      if (method === 'GET' && !skipCache && response.ok) {
        await setCache(cacheKey, apiResponse, cacheTTL)
      }

      return apiResponse
    } catch (error: any) {
      
      // If it's already an ApiError, throw it
      if (error.success === false) {
        throw error
      }

      // Network error - try cache for GET requests
      if (method === 'GET') {
        const cached = await getCache<ApiResponse<T>>(cacheKey)
        if (cached) {
          return cached
        }
      }

      // No cache available or not a GET request
      throw {
        success: false,
        error: 'Network error',
        message: error.message || 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้',
        statusCode: 0
      } as ApiError
    }
  }

  // HTTP Methods
  const get = <T = any>(endpoint: string, params?: Record<string, any>, options?: Partial<FetchOptions>) =>
    apiFetch<T>(endpoint, { method: 'GET', params, ...options })

  const post = <T = any>(endpoint: string, body?: any, params?: Record<string, any>, options?: Partial<FetchOptions>) =>
    apiFetch<T>(endpoint, { method: 'POST', body: JSON.stringify(body), params, ...options })

  const put = <T = any>(endpoint: string, body?: any, params?: Record<string, any>, options?: Partial<FetchOptions>) =>
    apiFetch<T>(endpoint, { method: 'PUT', body: JSON.stringify(body), params, ...options })

  const patch = <T = any>(endpoint: string, body?: any, params?: Record<string, any>, options?: Partial<FetchOptions>) =>
    apiFetch<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body), params, ...options })

  const del = <T = any>(endpoint: string, params?: Record<string, any>, options?: Partial<FetchOptions>) =>
    apiFetch<T>(endpoint, { method: 'DELETE', params, ...options })

  return {
    get,
    post,
    put,
    patch,
    delete: del,
    apiFetch
  }
}
