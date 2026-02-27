import type { LoginRequest, LoginResponse, UserInfo } from '~/types/api'

export function useAuth() {
  const { post, get } = useApi()
  
  // Reactive user state
  const user = useState<UserInfo | null>('auth_user', () => {
    if (process.client) {
      const stored = localStorage.getItem('user_info')
      if (stored) {
        try {
          return JSON.parse(stored)
        } catch {
          return null
        }
      }
    }
    return null
  })

  async function login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await post<LoginResponse>('auth/login', credentials)
    
    if (response.success && response.data) {
      // Store token in localStorage
      if (process.client) {
        localStorage.setItem('auth_token', response.data.token)
        localStorage.setItem('user_info', JSON.stringify(response.data.user))
      }
      // Update reactive state
      user.value = response.data.user
      return response.data
    }
    
    throw new Error('Login failed')
  }

  async function logout(): Promise<void> {
    try {
      await post('auth/logout')
    } finally {
      if (process.client) {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user_info')
      }
      // Clear reactive state
      user.value = null
    }
  }

  async function getCurrentUser(): Promise<UserInfo | null> {
    if (process.client) {
      const stored = localStorage.getItem('user_info')
      if (stored) {
        const userInfo = JSON.parse(stored)
        user.value = userInfo
        return userInfo
      }
    }

    try {
      const response = await get<UserInfo>('auth/me')
      if (response.success && response.data) {
        if (process.client) {
          localStorage.setItem('user_info', JSON.stringify(response.data))
        }
        user.value = response.data
        return response.data
      }
    } catch {
      return null
    }

    return null
  }

  function isAuthenticated(): boolean {
    if (process.client) {
      return !!localStorage.getItem('auth_token')
    }
    return false
  }

  function getUserInfo(): UserInfo | null {
    if (process.client) {
      const stored = localStorage.getItem('user_info')
      if (stored) {
        try {
          return JSON.parse(stored)
        } catch {
          return null
        }
      }
    }
    return null
  }
  
  function loadUserFromStorage(): void {
    if (process.client) {
      const stored = localStorage.getItem('user_info')
      if (stored) {
        try {
          user.value = JSON.parse(stored)
        } catch (e) {
          console.error('Failed to parse stored user:', e)
        }
      }
    }
  }

  return {
    user: readonly(user),
    login,
    logout,
    getCurrentUser,
    isAuthenticated,
    getUserInfo,
    loadUserFromStorage
  }
}
