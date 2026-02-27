import type { Asset } from '~/types/database'
import type { ApiResponse } from '~/types/api'

export const useAssetService = () => {
  const api = useApi()
  const state = useAssetState()
  const { error: showError } = useToast()

  const getAssets = async () => {
    state.setLoading(true)
    try {
      const response = await api.get<Asset[]>('/assets')

      if (response.success && response.data) {
        state.setAssets(response.data)
      }

      return response
    } catch (error: any) {
      showError(error.message || 'ไม่สามารถโหลดข้อมูลได้')
      throw error
    } finally {
      state.setLoading(false)
    }
  }

  const getAssetById = async (id: number) => {
    state.setLoading(true)
    try {
      const response = await api.get<Asset>(`/assets/${id}`)

      if (response.success && response.data) {
        state.setCurrentAsset(response.data)
      }

      return response
    } catch (error: any) {
      showError(error.message || 'ไม่สามารถโหลดข้อมูลได้')
      throw error
    } finally {
      state.setLoading(false)
    }
  }

  const getAssetByCode = async (code: string) => {
    state.setLoading(true)
    try {
      const response = await api.get<Asset>(`/assets/code/${code}`)

      if (response.success && response.data) {
        state.setCurrentAsset(response.data)
      }

      return response
    } catch (error: any) {
      showError(error.message || 'ไม่พบข้อมูลอุปกรณ์')
      throw error
    } finally {
      state.setLoading(false)
    }
  }

  const parseQRCode = async (qrData: string): Promise<Asset> => {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(qrData)
      
      if (parsed.asset_code) {
        const response = await getAssetByCode(parsed.asset_code)
        if (response.data) {
          return response.data
        }
      }
    } catch {
      // If not JSON, treat as asset code
      const response = await getAssetByCode(qrData)
      if (response.data) {
        return response.data
      }
    }

    throw new Error('QR Code ไม่ถูกต้อง')
  }

  return {
    getAssets,
    getAssetById,
    getAssetByCode,
    parseQRCode
  }
}
