<template>
  <div class="min-h-screen bg-slate-50">
    <LayoutMobileHeader title="งานใหม่" />
    
    <UiLoading v-if="loading" />

    <div v-else-if="inbox.length > 0" class="p-4 space-y-3 pb-24">
      <UiCard
        v-for="job in inbox"
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
            :label="`Priority: ${job.priority}`"
            :variant="job.priority === 'critical' || job.priority === 'high' ? 'danger' : 'primary'"
            size="small"
          />
          <span class="text-[11px] text-slate-500">{{ formatDate(job.breakdown_date) }}</span>
        </div>
      </UiCard>
    </div>

    <div v-else class="flex flex-col items-center justify-center min-h-[60vh] p-4">
      <Icon name="lucide:inbox" size="48" class="text-slate-300 mb-3" />
      <p class="text-[14px] text-slate-500">ไม่มีงานรอมอบหมาย</p>
    </div>

    <LayoutBottomNav role="supervisor" />
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const { getInbox } = useSupervisorService()
const { inbox, loading } = useSupervisorState()

// Load inbox on mount
onMounted(async () => {
  try {
    await getInbox()
  } catch (error) {
    console.error('Failed to load inbox:', error)
  }
})

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    reported: 'รอมอบหมาย',
    pending: 'รอมอบหมาย',
    assigned: 'มอบหมายแล้ว',
    in_progress: 'กำลังซ่อม',
    completed: 'เสร็จสิ้น'
  }
  return labels[status] || status
}

const getStatusVariant = (status: string) => {
  const variants: Record<string, any> = {
    reported: 'warning',
    pending: 'warning',
    assigned: 'primary',
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
  })
}
</script>
