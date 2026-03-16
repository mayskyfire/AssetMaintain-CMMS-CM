interface LicenseData {
  license_type: 'trial' | 'licensed'
  status: 'active' | 'expired'
  activated_at: string
  expires_at: string
  days_remaining: number
  is_expired: boolean
}

// Global state (shared across components)
const license = ref<LicenseData | null>(null)
const licenseLoaded = ref(false)
const showActivateModal = ref(false)

export function useLicense() {
  const api = useApi()

  const isTrial = computed(() => license.value?.license_type === 'trial')
  const isLicensed = computed(() => license.value?.license_type === 'licensed')
  const isExpired = computed(() => license.value?.is_expired === true)
  const daysRemaining = computed(() => license.value?.days_remaining ?? 0)

  const fetchLicense = async () => {
    try {
      const response = await api.get<LicenseData>('/license')
      if (response.success && response.data) {
        license.value = response.data
      }
    } catch (error) {
      console.error('Failed to fetch license:', error)
    } finally {
      licenseLoaded.value = true
    }
  }

  const activateLicense = async (key: string) => {
    const response = await api.post('/license/activate', { license_key: key })
    if (response.success) {
      // Reload license info
      await fetchLicense()
      showActivateModal.value = false
    }
    return response
  }

  const openActivateModal = () => {
    showActivateModal.value = true
  }

  const closeActivateModal = () => {
    showActivateModal.value = false
  }

  return {
    license,
    licenseLoaded,
    isTrial,
    isLicensed,
    isExpired,
    daysRemaining,
    showActivateModal,
    fetchLicense,
    activateLicense,
    openActivateModal,
    closeActivateModal
  }
}
