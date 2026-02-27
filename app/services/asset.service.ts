import type {
  AssetListItem,
  AssetDetail,
  QRCodeData,
  PaginatedResponse,
  PaginationParams
} from '~/types/api'

export function useAssetService() {
  const { get } = useApi()

  async function getAssets(params?: PaginationParams): Promise<PaginatedResponse<AssetListItem>> {
    const response = await get<PaginatedResponse<AssetListItem>>('/assets', params)
    if (response.success && response.data) {
      return response.data
    }
    throw new Error('Failed to fetch assets')
  }

  async function getAssetById(id: number): Promise<AssetDetail> {
    const response = await get<AssetDetail>(`/assets/${id}`)
    if (response.success && response.data) {
      return response.data
    }
    throw new Error('Failed to fetch asset detail')
  }

  async function getAssetByCode(code: string): Promise<AssetDetail> {
    const response = await get<AssetDetail>(`/assets/code/${code}`)
    if (response.success && response.data) {
      return response.data
    }
    throw new Error('Failed to fetch asset by code')
  }

  async function parseQRCode(qrData: string): Promise<QRCodeData> {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(qrData)
      if (parsed.asset_id || parsed.asset_code) {
        return parsed as QRCodeData
      }
    } catch {
      // If not JSON, treat as asset code
      const asset = await getAssetByCode(qrData)
      return {
        asset_id: asset.id,
        asset_code: asset.asset_code,
        asset_name: asset.asset_name,
        location: asset.location,
        site: asset.site,
        zone: asset.zone
      }
    }
    throw new Error('Invalid QR code format')
  }

  return {
    getAssets,
    getAssetById,
    getAssetByCode,
    parseQRCode
  }
}
