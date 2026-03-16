<template>
  <div v-if="shouldShow" :class="bannerClasses" class="p-4 flex items-center justify-between gap-3">
    <div class="flex items-center gap-2 min-w-0">
      <Icon :name="iconName" class="w-4 h-4 shrink-0" />
      <p class="text-[12px] truncate">{{ bannerText }}</p>
    </div>
    <button
      v-if="isExpired"
      @click="openActivateModal"
      class="shrink-0 px-3 py-1.5 bg-white/90 text-[11px] font-bold rounded-[8px] active:bg-white/70 transition-colors"
      :class="isExpired ? 'text-[#ff3b30]' : 'text-[#00a6ff]'"
    >
      กรอก License Key
    </button>
  </div>
</template>

<script setup lang="ts">
const { license, licenseLoaded, isTrial, isLicensed, isExpired, daysRemaining, fetchLicense, openActivateModal } = useLicense()

onMounted(async () => {
  if (!licenseLoaded.value) {
    await fetchLicense()
  }
})

const shouldShow = computed(() => {
  if (!licenseLoaded.value || !license.value) return false
  if (isLicensed.value && !isExpired.value) return false
  return true
})

const bannerClasses = computed(() => {
  if (isExpired.value) return 'bg-[#ff3b30] text-white'
  if (isTrial.value && daysRemaining.value <= 7) return 'bg-[#fe9a00] text-white'
  return 'bg-[#00a6ff]/10 text-[#00a6ff]'
})

const iconName = computed(() => {
  if (isExpired.value) return 'lucide:alert-circle'
  if (isTrial.value && daysRemaining.value <= 7) return 'lucide:clock'
  return 'lucide:info'
})

const bannerText = computed(() => {
  if (isExpired.value) return 'หมดอายุทดลองใช้งาน — กรุณากรอก License Key เพื่อใช้งานต่อ'
  if (isTrial.value) return `ทดลองใช้งานเหลืออีก ${daysRemaining.value} วัน`
  return ''
})
</script>
