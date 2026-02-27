<template>
  <div class="min-h-screen bg-gradient-to-br from-[#6dd400] to-[#5cb800] flex items-center justify-center p-4">
    <div class="w-full max-w-md space-y-6">
      <!-- Success Icon -->
      <div class="text-center">
        <div class="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
          <Icon name="lucide:check-circle" size="64" class="text-[#6dd400]" />
        </div>
        <h1 class="text-[24px] font-bold text-white mb-2">
          ส่งใบแจ้งซ่อมสำเร็จ!
        </h1>
        <p class="text-[14px] text-white/90">
          เราได้รับแจ้งปัญหาของคุณแล้ว
        </p>
      </div>

      <!-- Notification ID Card -->
      <UiCard class-name="p-6 text-center">
        <p class="text-[13px] text-slate-500 mb-2">เลขที่ใบแจ้ง</p>
        <p class="text-[28px] font-bold text-[#00a6ff] mb-4">{{ notificationId }}</p>
        
        <div class="bg-slate-50 rounded-[10px] p-4 mb-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-[12px] text-slate-500">อุปกรณ์</span>
            <span class="text-[13px] font-bold text-slate-800">
              {{ assetName }}
            </span>
          </div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-[12px] text-slate-500">ประเภท</span>
            <span class="text-[13px] font-bold text-[#ef4444]">{{ problemCategory }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-[12px] text-slate-500">ความสำคัญ</span>
            <span class="text-[13px] font-bold text-[#ef4444]">{{ priority }}</span>
          </div>
        </div>

        <p class="text-[12px] text-slate-500">
          คุณจะได้รับการแจ้งเตือนเมื่อมีการอัปเดตสถานะ
        </p>
      </UiCard>

      <!-- Actions -->
      <div class="space-y-3">
        <UiButton
          variant="primary"
          size="large"
          full-width
          icon="lucide:file-text"
          @click="handleViewDetail"
        >
          ดูรายละเอียดใบแจ้ง
        </UiButton>

        <button
          @click="router.push('/requester/')"
          class="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-[10px] text-[14px] font-bold transition-colors"
        >
          <Icon name="lucide:home" size="18" />
          กลับหน้าหลัก
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const route = useRoute()

// Get notification data from route state or query
const notificationData = computed(() => {
  if (route.query.notification) {
    try {
      return JSON.parse(route.query.notification as string)
    } catch {
      return null
    }
  }
  return null
})

const notificationId = computed(() => {
  return notificationData.value?.notification_id || route.query.id || 'CM-2026-0124'
})

const assetName = computed(() => {
  return notificationData.value?.asset_name || 'เครื่องปรับอากาศ AC-001'
})

const problemCategory = computed(() => {
  const category = notificationData.value?.problem_category || 'breakdown'
  const labels: Record<string, string> = {
    breakdown: 'Z1 - เสียหาย',
    malfunction: 'Z2 - ทำงานผิดปกติ',
    maintenance: 'Z3 - บำรุงรักษา',
    other: 'อื่นๆ'
  }
  return labels[category] || category
})

const priority = computed(() => {
  const p = notificationData.value?.priority || 'high'
  const labels: Record<string, string> = {
    critical: 'Priority 1',
    high: 'Priority 1',
    medium: 'Priority 2',
    low: 'Priority 3'
  }
  return labels[p] || 'Priority 2'
})

const handleViewDetail = () => {
  const id = notificationData.value?.id || notificationId.value
  router.push(`/requester/notification/${id}`)
}
</script>
