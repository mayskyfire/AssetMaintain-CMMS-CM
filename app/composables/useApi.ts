import type { ApiResponse, ApiError } from '~/types/api'

interface FetchOptions extends RequestInit {
  params?: Record<string, any>
}

export function useApi() {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBase || '/api'

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

  // Generic fetch wrapper
  async function apiFetch<T = any>(
    endpoint: string,
    options: FetchOptions = {}
  ): Promise<ApiResponse<T>> {
    const { params, ...fetchOptions } = options

    const url = buildURL(endpoint, params)
    const token = getAuthToken()

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('[useApi] Error response:', data)
        throw {
          success: false,
          error: data.error || 'Request failed',
          message: data.message || response.statusText,
          statusCode: response.status
        } as ApiError
      }

      // Return the full response data (including pagination, etc.)
      return {
        success: data.success !== undefined ? data.success : true,
        data: data.data,
        message: data.message,
        pagination: data.pagination,
        ...data // Include any other fields from the response
      }
    } catch (error: any) {
      console.error('[useApi] Fetch error:', error)
      if (error.success === false) {
        throw error
      }
      throw {
        success: false,
        error: 'Network error',
        message: error.message || 'Failed to connect to server',
        statusCode: 0
      } as ApiError
    }
  }

  // HTTP Methods
  const get = <T = any>(endpoint: string, params?: Record<string, any>) =>
    apiFetch<T>(endpoint, { method: 'GET', params })

  const post = <T = any>(endpoint: string, body?: any, params?: Record<string, any>) =>
    apiFetch<T>(endpoint, { method: 'POST', body: JSON.stringify(body), params })

  const put = <T = any>(endpoint: string, body?: any, params?: Record<string, any>) =>
    apiFetch<T>(endpoint, { method: 'PUT', body: JSON.stringify(body), params })

  const patch = <T = any>(endpoint: string, body?: any, params?: Record<string, any>) =>
    apiFetch<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body), params })

  const del = <T = any>(endpoint: string, params?: Record<string, any>) =>
    apiFetch<T>(endpoint, { method: 'DELETE', params })

  return {
    get,
    post,
    put,
    patch,
    delete: del,
    apiFetch
  }
}
