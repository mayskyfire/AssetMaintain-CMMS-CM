import type { Asset } from '~/types/database'

export const useAssetState = () => {
  const assets = useState<Asset[]>('assets', () => [])
  const currentAsset = useState<Asset | null>('currentAsset', () => null)
  const loading = useState<boolean>('assetsLoading', () => false)

  const setAssets = (data: Asset[]) => {
    assets.value = data
  }

  const setCurrentAsset = (data: Asset | null) => {
    currentAsset.value = data
  }

  const setLoading = (value: boolean) => {
    loading.value = value
  }

  const findAssetByCode = (code: string): Asset | undefined => {
    return assets.value.find(a => a.asset_code === code)
  }

  const clearState = () => {
    assets.value = []
    currentAsset.value = null
    loading.value = false
  }

  return {
    assets: readonly(assets),
    currentAsset: readonly(currentAsset),
    loading: readonly(loading),
    setAssets,
    setCurrentAsset,
    setLoading,
    findAssetByCode,
    clearState
  }
}
