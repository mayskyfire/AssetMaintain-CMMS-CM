import type { LoginRequest, LoginResponse, UserInfo } from '~/types/api'

// Module-level shared state — not affected by SSR hydration
const _user = ref<UserInfo | null>(null)
let _initialized = false

function _initUser() {
  if (_initialized || !import.meta.client) return
  _initialized = true
  const stored = localStorage.getItem('user_info')
  if (stored) {
    try {
      _user.value = JSON.parse(stored)
    } catch {
      // ignore
    }
  }
}

export function useAuth() {
  const { post, get } = useApi()

  // Always try to init from localStorage on client
  _initUser()

  const user = computed(() => _user.value)

  async function login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await post<LoginResponse>('auth/login', credentials)
    if (response.success && response.data) {
      if (import.meta.client) {
        localStorage.setItem('auth_token', response.data.token)
        localStorage.setItem('user_info', JSON.stringify(response.data.user))
      }
      _user.value = response.data.user
      return response.data
    }
    throw new Error('Login failed')
  }

  async function logout(): Promise<void> {
    try {
      await post('auth/logout')
    } finally {
      if (import.meta.client) {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user_info')
      }
      _user.value = null
      _initialized = false
    }
  }

  async function getCurrentUser(): Promise<UserInfo | null> {
    if (import.meta.client) {
      const stored = localStorage.getItem('user_info')
      if (stored) {
        const userInfo = JSON.parse(stored)
        _user.value = userInfo
        return userInfo
      }
    }
    try {
      const response = await get<UserInfo>('auth/me')
      if (response.success && response.data) {
        if (import.meta.client) {
          localStorage.setItem('user_info', JSON.stringify(response.data))
        }
        _user.value = response.data
        return response.data
      }
    } catch {
      return null
    }
    return null
  }

  function isAuthenticated(): boolean {
    if (import.meta.client) {
      return !!localStorage.getItem('auth_token')
    }
    return false
  }

  function getUserInfo(): UserInfo | null {
    if (import.meta.client) {
      const stored = localStorage.getItem('user_info')
      if (stored) {
        try { return JSON.parse(stored) } catch { return null }
      }
    }
    return null
  }

  function loadUserFromStorage(): void {
    if (import.meta.client) {
      const stored = localStorage.getItem('user_info')
      if (stored) {
        try { _user.value = JSON.parse(stored) } catch { /* ignore */ }
      }
    }
  }

  return {
    user: readonly(_user),
    login,
    logout,
    getCurrentUser,
    isAuthenticated,
    getUserInfo,
    loadUserFromStorage
  }
}
