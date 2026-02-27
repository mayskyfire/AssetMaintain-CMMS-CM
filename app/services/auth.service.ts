import type { LoginRequest, LoginResponse, UserInfo } from '~/types/api'

// Re-export useAuth as useAuthService for backward compatibility
export function useAuthService() {
  return useAuth()
}
