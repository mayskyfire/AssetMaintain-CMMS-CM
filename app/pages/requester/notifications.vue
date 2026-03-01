<template>
  <div class="min-h-screen bg-slate-50">
    <LayoutMobileHeader title="ประวัติการแจ้งซ่อม" />
    
    <div class="p-4 space-y-4 pb-24">
      <!-- Search -->
      <div class="relative">
        <Icon name="lucide:search" size="20" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          v-model="searchTerm"
          type="text"
          placeholder="ค้นหาเลขที่ใบแจ้ง, อุปกรณ์..."
          class="w-full h-[46px] pl-10 pr-4 bg-white rounded-[10px] border border-slate-200 text-[14px] focus:outline-none focus:border-[#00a6ff]"
        />
      </div>

      <!-- Status Filters -->
      <div ref="filterContainer" class="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        <button
          ref="filterAll"
          @click="filterStatus = 'all'"
          :class="[
            'px-4 py-2 rounded-full text-[14px] whitespace-nowrap transition-colors',
            filterStatus === 'all'
              ? 'bg-[#00a6ff] text-white'
              : 'bg-white text-slate-500 border border-slate-200'
          ]"
        >
          ทั้งหมด ({{ notifications.length }})
        </button>
        <button
          ref="filterPending"
          @click="filterStatus = 'pending'"
          :class="[
            'px-4 py-2 rounded-full text-[14px] whitespace-nowrap transition-colors',
            filterStatus === 'pending'
              ? 'bg-[#fef3c6] text-[#bb4d00] border border-[#fe9a00]'
              : 'bg-white text-slate-500 border border-slate-200'
          ]"
        >
          รอดำเนินการ ({{ pendingCount }})
        </button>
        <button
          ref="filterInProgress"
          @click="filterStatus = 'in_progress'"
          :class="[
            'px-4 py-2 rounded-full text-[14px] whitespace-nowrap transition-colors',
            filterStatus === 'in_progress'
              ? 'bg-[#dbeafe] text-[#1447e6] border border-[#2b7fff]'
              : 'bg-white text-slate-500 border border-slate-200'
          ]"
        >
          กำลังซ่อม ({{ inProgressCount }})
        </button>
        <button
          ref="filterCompleted"
          @click="filterStatus = 'completed'"
          :class="[
            'px-4 py-2 rounded-full text-[14px] whitespace-nowrap transition-colors',
            filterStatus === 'completed'
              ? 'bg-[rgba(109,212,0,0.1)] text-[#6dd400] border border-[#6dd400]'
              : 'bg-white text-slate-500 border border-slate-200'
          ]"
        >
          เสร็จสิ้น ({{ completedCount }})
        </button>
      </div>

      <!-- Notification List -->
      <UiLoading v-if="loading" />

      <div v-else class="space-y-3">
        <UiCard
          v-for="notif in filteredNotifications"
          :key="notif.id"
          :clickable="true"
          class-name="p-4"
          @click="router.push(`/requester/notification/${notif.id}`)"
        >
          <div class="flex items-start justify-between mb-3">
            <div class="flex items-center gap-2">
              <span class="text-[13px] font-bold text-[#00a6ff]">{{ notif.notification_id }}</span>
            </div>
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

        <!-- Empty State -->
        <div v-if="filteredNotifications.length === 0" class="text-center py-12">
          <Icon name="lucide:inbox" size="48" class="mx-auto text-slate-300 mb-3" />
          <p class="text-[14px] text-slate-500">ไม่พบรายการแจ้งซ่อม</p>
        </div>
      </div>
    </div>

    <LayoutBottomNav role="requester" />
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const route = useRoute()
const { getNotifications } = useNotificationService()
const { notifications, loading } = useNotificationState()

const searchTerm = ref('')
const filterStatus = ref('all')
const filterContainer = ref<HTMLElement | null>(null)
const filterAll = ref<HTMLElement | null>(null)
const filterPending = ref<HTMLElement | null>(null)
const filterInProgress = ref<HTMLElement | null>(null)
const filterCompleted = ref<HTMLElement | null>(null)

// Scroll to active filter button
const scrollToActiveFilter = () => {
  nextTick(() => {
    let targetButton: HTMLElement | null = null
    
    if (filterStatus.value === 'pending') {
      targetButton = filterPending.value
    } else if (filterStatus.value === 'in_progress') {
      targetButton = filterInProgress.value
    } else if (filterStatus.value === 'completed') {
      targetButton = filterCompleted.value
    } else {
      targetButton = filterAll.value
    }
    
    if (targetButton && filterContainer.value) {
      const container = filterContainer.value
      const button = targetButton
      const containerRect = container.getBoundingClientRect()
      const buttonRect = button.getBoundingClientRect()
      
      // Calculate scroll position to center the button
      const scrollLeft = button.offsetLeft - (container.offsetWidth / 2) + (button.offsetWidth / 2)
      
      container.scrollTo({
        left: scrollLeft,
        behavior: 'smooth'
      })
    }
  })
}

// Load notifications on mount
onMounted(async () => {
  // Check for status query parameter
  const statusParam = route.query.status as string
  if (statusParam && ['pending', 'in_progress', 'completed'].includes(statusParam)) {
    filterStatus.value = statusParam
  }
  
  try {
    await getNotifications({
      page: 1,
      limit: 50
    })
    
    // Scroll to active filter after data is loaded
    scrollToActiveFilter()
  } catch (error) {
    console.error('Failed to load notifications:', error)
  }
})

// Status counts
const pendingCount = computed(() => 
  notifications.value.filter(n => n.status === 'reported' || n.status === 'pending').length
)
const inProgressCount = computed(() => 
  notifications.value.filter(n => n.status === 'assigned' || n.status === 'in_progress').length
)
const completedCount = computed(() => 
  notifications.value.filter(n => n.status === 'completed' || n.status === 'evaluated').length
)

// Filtered notifications
const filteredNotifications = computed(() => {
  return notifications.value.filter((notif) => {
    const matchesSearch = 
      (notif.notification_id || '').toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      (notif.asset_name || '').toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      (notif.problem_description || '').toLowerCase().includes(searchTerm.value.toLowerCase())
    
    let matchesStatus = true
    if (filterStatus.value === 'pending') {
      matchesStatus = notif.status === 'reported' || notif.status === 'pending'
    } else if (filterStatus.value === 'in_progress') {
      matchesStatus = notif.status === 'assigned' || notif.status === 'in_progress'
    } else if (filterStatus.value === 'completed') {
      matchesStatus = notif.status === 'completed' || notif.status === 'evaluated'
    }
    
    return matchesSearch && matchesStatus
  })
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
