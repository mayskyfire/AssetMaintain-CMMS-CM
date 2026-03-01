<template>
  <div class="min-h-screen bg-slate-50">
    <UiOfflineBanner :is-online="isOnline" />
    <LayoutMobileHeader title="AssetMaintain CM" />

    <div class="p-4 space-y-6 pb-24">
      <!-- Welcome Section -->
      <UiCard class-name="p-6 bg-gradient-to-br from-[#00a6ff] to-[#0084d1]">
        <h2 class="text-[20px] font-bold text-white mb-2">
          สวัสดี, {{ user?.full_name || 'ผู้ใช้งาน' }}
        </h2>
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
        <UiCard 
          :clickable="true"
          class-name="p-2 hover:shadow-md transition-shadow cursor-pointer"
          @click="router.push('/requester/notifications?status=pending')"
        >
          <div class="flex items-center gap-2 mb-2">
            <Icon name="lucide:clock" size="16" class="text-[#fe9a00]" />
            <span class="text-[11px] text-slate-500">รอดำเนินการ</span>
          </div>
          <p class="text-[24px] font-bold text-slate-800 text-center">{{ stats.pending }}</p>
        </UiCard>

        <UiCard 
          :clickable="true"
          class-name="p-2 hover:shadow-md transition-shadow cursor-pointer"
          @click="router.push('/requester/notifications?status=in_progress')"
        >
          <div class="flex items-center gap-2 mb-2">
            <Icon name="lucide:alert-circle" size="16" class="text-[#00a6ff]" />
            <span class="text-[11px] text-slate-500">กำลังซ่อม</span>
          </div>
          <p class="text-[24px] font-bold text-slate-800 text-center">{{ stats.inProgress }}</p>
        </UiCard>

        <UiCard 
          :clickable="true"
          class-name="p-2 hover:shadow-md transition-shadow cursor-pointer"
          @click="router.push('/requester/notifications?status=completed')"
        >
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

        <UiLoading v-if="loading" />

        <div v-else-if="recentNotifications.length === 0" class="text-center py-8">
          <Icon name="lucide:inbox" size="48" class="text-slate-300 mx-auto mb-2" />
          <p class="text-[14px] text-slate-500">ยังไม่มีรายการแจ้งซ่อม</p>
        </div>

        <div v-else class="space-y-3">
          <UiCard
            v-for="notif in recentNotifications"
            :key="notif.id"
            :clickable="true"
            class-name="p-4"
            @click="router.push(`/requester/notification/${notif.id}`)"
          >
            <div class="flex items-start justify-between mb-2">
              <span class="text-[13px] font-bold text-[#00a6ff]">{{ notif.notification_id }}</span>
              <UiBadge
                :label="getStatusLabel(notif.status)"
                :variant="getStatusVariant(notif.status)"
                :show-dot="true"
              />
            </div>

            <h4 class="text-[14px] font-bold text-slate-800 mb-2">
              {{ notif.asset_name }}
            </h4>

            <p class="text-[12px] text-slate-600 mb-2 line-clamp-2">
              {{ notif.problem_description }}
            </p>

            <div class="flex items-center justify-between">
              <UiBadge
                :label="`Priority: ${getPriorityLabel(notif.priority)}`"
                :variant="getPriorityVariant(notif.priority)"
                size="small"
              />
              <span class="text-[11px] text-slate-500">{{ formatDate(notif.breakdown_date) }}</span>
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
const { isOnline } = useNetworkStatus()
const { user, loadUserFromStorage } = useAuth()
const { getNotifications } = useNotificationService()
const { notifications, loading } = useNotificationState()

// Load data on mount
onMounted(async () => {
  // Ensure user state is loaded from localStorage after hydration
  loadUserFromStorage()
  
  try {
    await getNotifications({
      page: 1,
      limit: 10
    })
  } catch (error) {
    console.error('Failed to load notifications:', error)
  }
})

// Stats
const stats = computed(() => {
  if (!notifications.value || !Array.isArray(notifications.value)) {
    return { pending: 0, inProgress: 0, completed: 0 }
  }
  
  const pending = notifications.value.filter(n => n.status === 'reported' || n.status === 'pending').length
  const inProgress = notifications.value.filter(n => n.status === 'assigned' || n.status === 'in_progress').length
  const completed = notifications.value.filter(n => n.status === 'completed').length

  return { pending, inProgress, completed }
})

// Recent notifications (latest 3)
const recentNotifications = computed(() => {
  if (!notifications.value || !Array.isArray(notifications.value)) {
    return []
  }
  return notifications.value.slice(0, 3)
})

// Load data on mount
onMounted(async () => {
  try {
    await getNotifications({
      page: 1,
      limit: 10
    })
  } catch (error) {
    console.error('Failed to load notifications:', error)
  }
})

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    reported: 'รอดำเนินการ',
    pending: 'รอดำเนินการ',
    assigned: 'กำลังซ่อม',
    in_progress: 'กำลังซ่อม',
    completed: 'เสร็จสิ้น',
    evaluated: 'เสร็จสิ้น'
  }
  return labels[status] || status
}

const getStatusVariant = (status: string) => {
  const variants: Record<string, any> = {
    reported: 'warning',
    pending: 'warning',
    assigned: 'primary',
    in_progress: 'primary',
    completed: 'success',
    evaluated: 'success'
  }
  return variants[status] || 'secondary'
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getPriorityLabel = (priority: string) => {
  const labels: Record<string, string> = {
    critical: 'เร่งด่วน',
    high: 'ด่วน',
    medium: 'ปกติ',
    low: 'ไม่ดวน'
  }
  return labels[priority] || priority
}

const getPriorityVariant = (priority: string) => {
  const variants: Record<string, any> = {
    critical: 'danger',
    high: 'warning',
    medium: 'primary',
    low: 'secondary'
  }
  return variants[priority] || 'secondary'
}
</script>
