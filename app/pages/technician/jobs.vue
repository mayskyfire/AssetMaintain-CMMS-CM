<template>
  <div class="min-h-screen bg-slate-50">
    <LayoutMobileHeader title="งานของฉัน" />
    
    <div class="p-4 space-y-3 pb-24">
      <UiCard
        v-for="job in jobs"
        :key="job.id"
        :clickable="true"
        class-name="p-4"
        @click="handleJobClick(job)"
      >
        <div class="flex items-start justify-between mb-2">
          <span class="text-[13px] font-bold text-[#00a6ff]">{{ job.id }}</span>
          <UiBadge
            :label="getStatusLabel(job.status)"
            :variant="getStatusVariant(job.status)"
            :show-dot="true"
          />
        </div>

        <h4 class="text-[14px] font-bold text-slate-800 mb-2">
          {{ job.equipment }}
        </h4>

        <p class="text-[13px] text-slate-600 mb-3">{{ job.description }}</p>

        <div class="flex items-center justify-between">
          <UiBadge
            :label="`Priority ${job.priority}`"
            :variant="job.priority === '1' ? 'danger' : 'primary'"
            size="small"
          />
          <span class="text-[11px] text-slate-500">{{ job.assignedAt }}</span>
        </div>
      </UiCard>
    </div>

    <LayoutBottomNav role="technician" />
  </div>
</template>

<script setup lang="ts">
const router = useRouter()

const jobs = ref([
  {
    id: 'CM-2026-0123',
    equipment: 'เครื่องปรับอากาศ AC-02',
    description: 'เครื่องไม่เย็น ต้องตรวจสอบน้ำยา',
    status: 'assigned',
    priority: '2',
    assignedAt: '21 ม.ค. 2026 15:00'
  }
])

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    assigned: 'รอรับงาน',
    inProgress: 'กำลังดำเนินการ',
    completed: 'เสร็จสิ้น'
  }
  return labels[status] || status
}

const getStatusVariant = (status: string) => {
  const variants: Record<string, any> = {
    assigned: 'warning',
    inProgress: 'primary',
    completed: 'success'
  }
  return variants[status] || 'secondary'
}

const handleJobClick = (job: any) => {
  if (job.status === 'assigned') {
    router.push(`/technician/accept/${job.id}`)
  } else if (job.status === 'inProgress') {
    router.push(`/technician/worklog/${job.id}`)
  }
}
</script>
