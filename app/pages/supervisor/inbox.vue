<template>
  <div class="min-h-screen bg-slate-50">
    <LayoutMobileHeader title="งานใหม่" />
    
    <UiLoading v-if="loading" />

    <div v-else class="pb-24">
      <!-- Search and Filter Section -->
      <div class="px-4 pt-4 space-y-4">
        <!-- Search Input -->
        <div class="relative">
          <Icon name="lucide:search" size="20" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="ค้นหาเลขที่ใบแจ้ง, อุปกรณ์..."
            class="w-full h-[46px] pl-10 pr-4 bg-white rounded-[10px] border border-slate-200 text-[14px] focus:outline-none focus:border-[#00a6ff]"
          />
        </div>

        <!-- Filter Tabs -->
        <div ref="filterContainer" class="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          <button
            ref="filterAll"
            @click="() => { filterStatus = 'all'; scrollToActiveFilter() }"
            :class="[
              'px-4 py-2 rounded-full text-[14px] whitespace-nowrap transition-colors',
              filterStatus === 'all'
                ? 'bg-[#00a6ff] text-white'
                : 'bg-white text-slate-500 border border-slate-200'
            ]"
          >
            ทั้งหมด ({{ totalCount }})
          </button>
          <button
            ref="filterReady"
            @click="() => { filterStatus = 'ready'; scrollToActiveFilter() }"
            :class="[
              'px-4 py-2 rounded-full text-[14px] whitespace-nowrap transition-colors',
              filterStatus === 'ready'
                ? 'bg-[#dbeafe] text-[#1447e6] border border-[#2b7fff]'
                : 'bg-white text-slate-500 border border-slate-200'
            ]"
          >
            พร้อมมอบหมาย ({{ readyCount }})
          </button>
          <button
            ref="filterPendingSpare"
            @click="() => { filterStatus = 'pending_spare_approval'; scrollToActiveFilter() }"
            :class="[
              'px-4 py-2 rounded-full text-[14px] whitespace-nowrap transition-colors',
              filterStatus === 'pending_spare_approval'
                ? 'bg-orange-100 text-orange-700 border border-orange-300'
                : 'bg-white text-slate-500 border border-slate-200'
            ]"
          >
            รออนุมัติอะไหล่ ({{ pendingSpareCount }})
          </button>
          <button
            ref="filterAssigned"
            @click="() => { filterStatus = 'assigned'; scrollToActiveFilter() }"
            :class="[
              'px-4 py-2 rounded-full text-[14px] whitespace-nowrap transition-colors',
              filterStatus === 'assigned'
                ? 'bg-slate-100 text-slate-700 border border-slate-300'
                : 'bg-white text-slate-500 border border-slate-200'
            ]"
          >
            มอบหมายแล้ว ({{ assignedCount }})
          </button>
          <button
            ref="filterInProgress"
            @click="() => { filterStatus = 'in_progress'; scrollToActiveFilter() }"
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
            @click="() => { filterStatus = 'completed'; scrollToActiveFilter() }"
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
      </div>

      <!-- Job List -->
      <div v-if="filteredInbox.length > 0" class="p-4 space-y-3">
        <UiCard
          v-for="job in filteredInbox"
          :key="job.id"
          :clickable="true"
          class-name="p-4"
          @click="router.push(`/supervisor/assign/${job.id}`)"
        >
          <div class="flex items-start justify-between mb-2">
            <span class="text-[13px] font-bold text-[#00a6ff]">{{ job.notification_id }}</span>
            <UiBadge 
              :label="getStatusLabel(job.status)" 
              :variant="getStatusVariant(job.status)" 
              :show-dot="true" 
            />
          </div>

          <h4 class="text-[14px] font-bold text-slate-800 mb-2">
            {{ job.asset_name }}
          </h4>

          <p class="text-[13px] text-slate-600 mb-2">{{ job.problem_description }}</p>

          <div class="flex items-start gap-1 mb-3">
            <Icon name="lucide:map-pin" size="14" class="text-slate-500 shrink-0 mt-0.5" />
            <span class="text-[12px] text-slate-500">{{ job.location }}</span>
          </div>

          <div class="flex items-center justify-between">
            <UiBadge
                :label="`Priority: ${getPriorityLabel(job.priority)}`"
                :variant="getPriorityVariant(job.priority)"
                size="small"
              />
            <span class="text-[11px] text-slate-500">{{ formatDate(job.breakdown_date) }}</span>
          </div>
        </UiCard>
      </div>

      <!-- Empty State -->
      <div v-else class="flex flex-col items-center justify-center min-h-[50vh] p-4">
        <Icon name="lucide:inbox" size="48" class="text-slate-300 mb-3" />
        <p class="text-[14px] text-slate-500">
          {{ searchQuery ? 'ไม่พบงานที่ค้นหา' : 'ไม่มีงานในหมวดนี้' }}
        </p>
      </div>
    </div>

    <LayoutBottomNav role="supervisor" />
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const route = useRoute()
const { getInbox } = useSupervisorService()
const { inbox, loading } = useSupervisorState()

const searchQuery = ref('')
const filterStatus = ref<'all' | 'ready' | 'pending_spare_approval' | 'assigned' | 'in_progress' | 'completed'>('all')
const filterContainer = ref<HTMLElement | null>(null)
const filterAll = ref<HTMLElement | null>(null)
const filterReady = ref<HTMLElement | null>(null)
const filterPendingSpare = ref<HTMLElement | null>(null)
const filterAssigned = ref<HTMLElement | null>(null)
const filterInProgress = ref<HTMLElement | null>(null)
const filterCompleted = ref<HTMLElement | null>(null)

// Scroll to active filter button
const scrollToActiveFilter = () => {
  nextTick(() => {
    const filterRefs: Record<string, HTMLElement | null> = {
      all: filterAll.value,
      ready: filterReady.value,
      pending_spare_approval: filterPendingSpare.value,
      assigned: filterAssigned.value,
      in_progress: filterInProgress.value,
      completed: filterCompleted.value
    }

    const targetButton = filterRefs[filterStatus.value] || filterAll.value

    if (targetButton && filterContainer.value) {
      const container = filterContainer.value
      const scrollLeft = targetButton.offsetLeft - (container.offsetWidth / 2) + (targetButton.offsetWidth / 2)
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' })
    }
  })
}

// Load inbox on mount
onMounted(async () => {
  const statusParam = route.query.status as string
  if (statusParam === 'ready') {
    filterStatus.value = 'ready'
  } else if (['pending_spare_approval', 'assigned', 'in_progress', 'completed'].includes(statusParam)) {
    filterStatus.value = statusParam as any
  }

  try {
    await getInbox()
    scrollToActiveFilter()
  } catch (error) {
    console.error('Failed to load inbox:', error)
  }
})

// Computed counts
const totalCount = computed(() => inbox.value.length)

const readyCount = computed(() =>
  inbox.value.filter(job => job.status === 'reported' || job.status === 'spare_approved').length
)

const pendingSpareCount = computed(() =>
  inbox.value.filter(job => job.status === 'pending_spare_approval').length
)

const assignedCount = computed(() =>
  inbox.value.filter(job => job.status === 'assigned').length
)

const inProgressCount = computed(() =>
  inbox.value.filter(job => job.status === 'in_progress').length
)

const completedCount = computed(() =>
  inbox.value.filter(job => job.status === 'completed').length
)

// Filtered inbox based on search and filter
const filteredInbox = computed(() => {
  let filtered = inbox.value

  if (filterStatus.value === 'ready') {
    filtered = filtered.filter(job => job.status === 'reported' || job.status === 'spare_approved')
  } else if (filterStatus.value === 'pending_spare_approval') {
    filtered = filtered.filter(job => job.status === 'pending_spare_approval')
  } else if (filterStatus.value === 'assigned') {
    filtered = filtered.filter(job => job.status === 'assigned')
  } else if (filterStatus.value === 'in_progress') {
    filtered = filtered.filter(job => job.status === 'in_progress')
  } else if (filterStatus.value === 'completed') {
    filtered = filtered.filter(job => job.status === 'completed')
  }

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    filtered = filtered.filter(job =>
      job.notification_id?.toLowerCase().includes(query) ||
      job.asset_name?.toLowerCase().includes(query) ||
      job.problem_description?.toLowerCase().includes(query) ||
      job.location?.toLowerCase().includes(query)
    )
  }

  return filtered
})

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    reported: 'พร้อมมอบหมาย',
    pending: 'พร้อมมอบหมาย',
    pending_spare_approval: 'รออนุมัติอะไหล่',
    spare_approved: 'พร้อมมอบหมาย',
    assigned: 'มอบหมายแล้ว',
    in_progress: 'กำลังซ่อม',
    completed: 'เสร็จสิ้น'
  }
  return labels[status] || status
}

const getStatusVariant = (status: string) => {
  const variants: Record<string, any> = {
    reported: 'primary',
    pending: 'primary',
    pending_spare_approval: 'warning',
    spare_approved: 'primary',
    assigned: 'secondary',
    in_progress: 'primary',
    completed: 'success'
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
  }) + ` น.`
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

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
