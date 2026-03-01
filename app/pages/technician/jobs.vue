<template>
  <div class="min-h-screen bg-slate-50">
    <LayoutMobileHeader title="งานของฉัน" />
    
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
        <div class="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          <button
            @click="filterStatus = 'all'"
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
            @click="filterStatus = 'assigned'"
            :class="[
              'px-4 py-2 rounded-full text-[14px] whitespace-nowrap transition-colors',
              filterStatus === 'assigned'
                ? 'bg-[#fef3c6] text-[#bb4d00] border border-[#fe9a00]'
                : 'bg-white text-slate-500 border border-slate-200'
            ]"
          >
            รอซ่อม ({{ assignedCount }})
          </button>
          <button
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
      </div>

      <!-- Jobs List -->
      <div v-if="filteredJobs.length > 0" class="p-4 space-y-3">
        <UiCard
          v-for="job in filteredJobs"
          :key="job.id"
          :clickable="true"
          class-name="p-4"
          @click="handleJobClick(job)"
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

          <p class="text-[13px] text-slate-600 mb-3">{{ job.problem_description }}</p>

          <div class="flex items-center justify-between">
            <UiBadge
                :label="`Priority: ${getPriorityLabel(job.priority)}`"
                :variant="getPriorityVariant(job.priority)"
                size="small"
              />
            <span class="text-[11px] text-slate-500">{{ formatDate(job.assigned_at) }}</span>
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

    <LayoutBottomNav role="technician" />
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const { getJobs } = useTechnicianService()
const { jobs, loading } = useTechnicianState()

const searchQuery = ref('')
const filterStatus = ref<'all' | 'assigned' | 'in_progress' | 'completed'>('all')

// Load jobs on mount
onMounted(async () => {
  try {
    await getJobs({ page: 1, limit: 50 })
  } catch (error) {
    console.error('Failed to load jobs:', error)
  }
})

// Computed counts
const totalCount = computed(() => jobs.value.length)

const assignedCount = computed(() => 
  jobs.value.filter(job => job.status === 'assigned').length
)

const inProgressCount = computed(() => 
  jobs.value.filter(job => job.status === 'in_progress').length
)

const completedCount = computed(() => 
  jobs.value.filter(job => job.status === 'completed').length
)

// Filtered jobs based on search and filter
const filteredJobs = computed(() => {
  let filtered = jobs.value

  // Apply status filter
  if (filterStatus.value !== 'all') {
    filtered = filtered.filter(job => job.status === filterStatus.value)
  }

  // Apply search filter
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
    assigned: 'รอรับงาน',
    in_progress: 'กำลังดำเนินการ',
    completed: 'เสร็จสิ้น'
  }
  return labels[status] || status
}

const getStatusVariant = (status: string) => {
  const variants: Record<string, any> = {
    assigned: 'warning',
    in_progress: 'primary',
    completed: 'success'
  }
  return variants[status] || 'secondary'
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

const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const handleJobClick = (job: any) => {
  if (job.status === 'assigned') {
    router.push(`/technician/accept/${job.id}`)
  } else if (job.status === 'in_progress') {
    router.push(`/technician/worklog/${job.id}`)
  } else if (job.status === 'completed') {
    // View completed job details
    router.push(`/technician/job-detail/${job.id}`)
  }
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
