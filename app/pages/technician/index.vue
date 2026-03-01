<template>
  <div class="min-h-screen bg-slate-50">
    <LayoutMobileHeader title="AssetMaintain CM" />

    <div class="p-4 space-y-6 pb-24">
      <!-- Welcome Section -->
      <UiCard class-name="p-6 bg-gradient-to-br from-[#00a6ff] to-[#0084d1]">
        <h2 class="text-[20px] font-bold text-white mb-2">
          สวัสดี, {{ user?.full_name || 'ช่างเทคนิค' }}
        </h2>
        <p class="text-[14px] text-white/80">
          พร้อมรับงานซ่อมและดำเนินการซ่อมบำรุง
        </p>
      </UiCard>

      <!-- Quick Actions -->
      <div class="grid grid-cols-2 gap-3">
        <UiCard
          :clickable="true"
          class-name="p-4 flex flex-col items-center justify-center gap-3 hover:shadow-md transition-shadow"
          @click="router.push('/technician/jobs')"
        >
          <div class="w-12 h-12 bg-[#00a6ff]/10 rounded-[12px] flex items-center justify-center">
            <Icon name="lucide:clipboard" size="24" class="text-[#00a6ff]" />
          </div>
          <span class="text-[14px] font-bold text-slate-800 text-center">
            งานของฉัน
          </span>
        </UiCard>

        <UiCard
          :clickable="true"
          class-name="p-4 flex flex-col items-center justify-center gap-3 hover:shadow-md transition-shadow"
          @click="router.push('/technician/profile')"
        >
          <div class="w-12 h-12 bg-[#6dd400]/10 rounded-[12px] flex items-center justify-center">
            <Icon name="lucide:user" size="24" class="text-[#6dd400]" />
          </div>
          <span class="text-[14px] font-bold text-slate-800 text-center">
            โปรไฟล์
          </span>
        </UiCard>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-3 gap-3">
        <UiCard 
          :clickable="true"
          class-name="p-3 hover:shadow-md transition-shadow cursor-pointer flex flex-col"
          @click="router.push('/technician/jobs?status=assigned')"
        >
          <div class="flex items-center gap-2 mb-2 min-h-[36px]">
            <Icon name="lucide:clock" size="16" class="text-[#fe9a00] shrink-0" />
            <span class="text-[11px] text-slate-500 leading-tight">รอรับงาน</span>
          </div>
          <p class="text-[24px] font-bold text-slate-800 text-center mt-auto">{{ stats.assigned }}</p>
        </UiCard>

        <UiCard 
          :clickable="true"
          class-name="p-3 hover:shadow-md transition-shadow cursor-pointer flex flex-col"
          @click="router.push('/technician/jobs?status=in_progress')"
        >
          <div class="flex items-center gap-2 mb-2 min-h-[36px]">
            <Icon name="lucide:alert-circle" size="16" class="text-[#00a6ff] shrink-0" />
            <span class="text-[11px] text-slate-500 leading-tight">กำลังซ่อม</span>
          </div>
          <p class="text-[24px] font-bold text-slate-800 text-center mt-auto">{{ stats.inProgress }}</p>
        </UiCard>

        <UiCard 
          :clickable="true"
          class-name="p-3 hover:shadow-md transition-shadow cursor-pointer flex flex-col"
          @click="router.push('/technician/jobs?status=completed')"
        >
          <div class="flex items-center gap-2 mb-2 min-h-[36px]">
            <Icon name="lucide:check-circle" size="16" class="text-[#6dd400] shrink-0" />
            <span class="text-[11px] text-slate-500 leading-tight">เสร็จสิ้น</span>
          </div>
          <p class="text-[24px] font-bold text-slate-800 text-center mt-auto">{{ stats.completed }}</p>
        </UiCard>
      </div>

      <!-- Recent Jobs -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-[16px] font-bold text-slate-800">งานล่าสุด</h3>
          <button
            @click="router.push('/technician/jobs')"
            class="text-[13px] text-[#00a6ff] font-bold"
          >
            ดูทั้งหมด
          </button>
        </div>

        <UiLoading v-if="loading" />

        <div v-else-if="recentJobs.length === 0" class="text-center py-8">
          <Icon name="lucide:inbox" size="48" class="text-slate-300 mx-auto mb-2" />
          <p class="text-[14px] text-slate-500">ยังไม่มีงาน</p>
        </div>

        <div v-else class="space-y-3">
          <UiCard
            v-for="job in recentJobs"
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

            <p class="text-[12px] text-slate-600 mb-2 line-clamp-2">
              {{ job.problem_description }}
            </p>

            <div class="flex items-center justify-between">
              <UiBadge
                :label="`ความสำคัญ: ${getPriorityLabel(job.priority)}`"
                :variant="getPriorityVariant(job.priority)"
                size="small"
              />
              <span class="text-[11px] text-slate-500">{{ formatDate(job.assigned_at) }}</span>
            </div>
          </UiCard>
        </div>
      </div>
    </div>

    <LayoutBottomNav role="technician" />
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const { user, loadUserFromStorage } = useAuth()
const { getJobs } = useTechnicianService()
const { jobs, loading } = useTechnicianState()
const { finishLoading } = useAppLoader()
const { saveCurrentPage } = useActiveNavigation()

// Load data on mount
onMounted(async () => {
  await loadUserFromStorage()
  
  // Save this page as active for BottomNav
  saveCurrentPage()
  
  try {
    await getJobs({ page: 1, limit: 10 })
  } catch (error) {
    console.error('Failed to load jobs:', error)
  } finally {
    // Hide global loader after data is loaded
    finishLoading()
  }
})

// Stats
const stats = computed(() => {
  if (!jobs.value || !Array.isArray(jobs.value)) {
    return { assigned: 0, inProgress: 0, completed: 0 }
  }
  
  const assigned = jobs.value.filter(j => j.status === 'assigned').length
  const inProgress = jobs.value.filter(j => j.status === 'in_progress').length
  const completed = jobs.value.filter(j => j.status === 'completed').length

  return { assigned, inProgress, completed }
})

// Recent jobs (latest 3)
const recentJobs = computed(() => {
  if (!jobs.value || !Array.isArray(jobs.value)) {
    return []
  }
  return jobs.value.slice(0, 3)
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
    router.push(`/technician/job-detail/${job.id}`)
  }
}
</script>
