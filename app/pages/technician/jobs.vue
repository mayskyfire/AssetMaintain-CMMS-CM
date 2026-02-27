<template>
  <div class="min-h-screen bg-slate-50">
    <LayoutMobileHeader title="งานของฉัน" />
    
    <div class="p-4 space-y-3 pb-24">
      <!-- Loading State -->
      <UiLoading v-if="loading" />

      <!-- Empty State -->
      <div v-else-if="jobs.length === 0" class="text-center py-12">
        <Icon name="lucide:inbox" size="48" class="text-slate-300 mx-auto mb-3" />
        <p class="text-[14px] text-slate-500">ไม่มีงานในขณะนี้</p>
      </div>

      <!-- Jobs List -->
      <UiCard
        v-else
        v-for="job in jobs"
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
            :label="getPriorityLabel(job.priority)"
            :variant="getPriorityVariant(job.priority)"
            size="small"
          />
          <span class="text-[11px] text-slate-500">{{ formatDate(job.assigned_at) }}</span>
        </div>
      </UiCard>
    </div>

    <LayoutBottomNav role="technician" />
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const { getJobs } = useTechnicianService()
const { jobs, loading } = useTechnicianState()

// Load jobs on mount
onMounted(async () => {
  try {
    await getJobs({ page: 1, limit: 50 })
  } catch (error) {
    console.error('Failed to load jobs:', error)
  }
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
    high: 'สูง',
    medium: 'ปานกลาง',
    low: 'ต่ำ'
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
  }
}
</script>
