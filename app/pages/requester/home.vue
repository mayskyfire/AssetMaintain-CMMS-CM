<template>
  <div class="min-h-screen bg-slate-50">
    <UiOfflineBanner :is-online="isOnline" />
    <LayoutMobileHeader title="AssetMaintain CM" />

    <div class="p-4 space-y-6 pb-24">
      <!-- Welcome Section -->
      <UiCard class-name="p-6 bg-gradient-to-br from-[#00a6ff] to-[#0084d1]">
        <h2 class="text-[20px] font-bold text-white mb-2">สวัสดี, ผู้ใช้งาน</h2>
        <p class="text-[14px] text-white/80">
          พร้อมแจ้งซ่อมหรือติดตามสถานะการซ่อมของคุณ
        </p>
      </UiCard>

      <!-- Quick Actions -->
      <div class="grid grid-cols-2 gap-3">
        <UiCard
          :clickable="true"
          class-name="p-4 flex flex-col items-center justify-center gap-3 hover:shadow-md transition-shadow"
          @click="router.push('/requester/scan-qr')"
        >
          <div class="w-12 h-12 bg-[#00a6ff]/10 rounded-[12px] flex items-center justify-center">
            <Icon name="lucide:qr-code" size="24" class="text-[#00a6ff]" />
          </div>
          <span class="text-[14px] font-bold text-slate-800 text-center">
            สแกน QR Code
          </span>
        </UiCard>

        <UiCard
          :clickable="true"
          class-name="p-4 flex flex-col items-center justify-center gap-3 hover:shadow-md transition-shadow"
          @click="router.push('/requester/notifications')"
        >
          <div class="w-12 h-12 bg-[#6dd400]/10 rounded-[12px] flex items-center justify-center">
            <Icon name="lucide:list" size="24" class="text-[#6dd400]" />
          </div>
          <span class="text-[14px] font-bold text-slate-800 text-center">
            รายการแจ้งซ่อม
          </span>
        </UiCard>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-3 gap-3">
        <UiCard class-name="p-2">
          <div class="flex items-center gap-2 mb-2">
            <Icon name="lucide:clock" size="16" class="text-[#fe9a00]" />
            <span class="text-[11px] text-slate-500">รอดำเนินการ</span>
          </div>
          <p class="text-[24px] font-bold text-slate-800 text-center">{{ stats.pending }}</p>
        </UiCard>

        <UiCard class-name="p-2">
          <div class="flex items-center gap-2 mb-2">
            <Icon name="lucide:alert-circle" size="16" class="text-[#00a6ff]" />
            <span class="text-[11px] text-slate-500">กำลังซ่อม</span>
          </div>
          <p class="text-[24px] font-bold text-slate-800 text-center">{{ stats.inProgress }}</p>
        </UiCard>

        <UiCard class-name="p-2">
          <div class="flex items-center gap-2 mb-2">
            <Icon name="lucide:check-circle" size="16" class="text-[#6dd400]" />
            <span class="text-[11px] text-slate-500">เสร็จสิ้น</span>
          </div>
          <p class="text-[24px] font-bold text-slate-800 text-center">{{ stats.completed }}</p>
        </UiCard>
      </div>

      <!-- Recent Notifications -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-[16px] font-bold text-slate-800">รายการล่าสุด</h3>
          <button
            @click="router.push('/requester/notifications')"
            class="text-[13px] text-[#00a6ff] font-bold"
          >
            ดูทั้งหมด
          </button>
        </div>

        <div class="space-y-3">
          <UiCard
            v-for="notif in recentNotifications"
            :key="notif.id"
            :clickable="true"
            class-name="p-4"
            @click="router.push(`/requester/notification/${notif.id}`)"
          >
            <div class="flex items-start justify-between mb-2">
              <span class="text-[13px] font-bold text-[#00a6ff]">{{ notif.id }}</span>
              <UiBadge
                :label="getStatusLabel(notif.status)"
                :variant="getStatusVariant(notif.status)"
                :show-dot="true"
              />
            </div>

            <h4 class="text-[14px] font-bold text-slate-800 mb-2">
              {{ notif.equipment }}
            </h4>

            <div class="flex items-center justify-between">
              <UiBadge
                :label="`Priority ${notif.priority}`"
                :variant="notif.priority === '1' ? 'danger' : 'primary'"
                size="small"
              />
              <span class="text-[11px] text-slate-500">{{ notif.createdAt }}</span>
            </div>
          </UiCard>
        </div>
      </div>
    </div>

    <LayoutBottomNav role="requester" />
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const isOnline = ref(true)

const stats = ref({
  pending: 3,
  inProgress: 2,
  completed: 12
})

const recentNotifications = ref([
  {
    id: 'CM-2026-0123',
    equipment: 'เครื่องปรับอากาศ AC-02',
    status: 'inProgress',
    priority: '2',
    createdAt: '21 ม.ค. 2026 14:30'
  }
])

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: 'รอดำเนินการ',
    inProgress: 'กำลังซ่อม',
    completed: 'เสร็จสิ้น'
  }
  return labels[status] || status
}

const getStatusVariant = (status: string) => {
  const variants: Record<string, any> = {
    pending: 'warning',
    inProgress: 'primary',
    completed: 'success'
  }
  return variants[status] || 'secondary'
}
</script>
