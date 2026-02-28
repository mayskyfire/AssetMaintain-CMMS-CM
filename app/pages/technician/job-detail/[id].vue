<template>
  <div class="min-h-screen bg-slate-50">
    <LayoutMobileHeader title="รายละเอียดงาน" :show-back="true" />

    <div class="p-4 space-y-4 pb-24">
      <!-- Loading State -->
      <UiLoading v-if="loading" />

      <template v-else-if="currentJob">
        <!-- Job Header Card -->
        <UiCard class-name="p-4">
          <div class="flex items-start justify-between mb-3">
            <span class="text-[16px] font-bold text-[#00a6ff]">{{ currentJob.notification_id }}</span>
            <UiBadge 
              :label="getStatusLabel(currentJob.status)" 
              :variant="getStatusVariant(currentJob.status)"
              :show-dot="true"
            />
          </div>

          <h2 class="text-[18px] font-bold text-slate-800 mb-4">
            {{ currentJob.asset_name }}
          </h2>

          <div class="grid grid-cols-2 gap-3">
            <div class="flex items-start gap-2">
              <Icon name="lucide:map-pin" class="w-4 h-4 text-slate-500 shrink-0 mt-1" />
              <div>
                <p class="text-[11px] text-slate-500">สถานที่</p>
                <p class="text-[13px] text-slate-800 font-bold">{{ currentJob.location }}</p>
              </div>
            </div>

            <div class="flex items-start gap-2">
              <Icon name="lucide:calendar" class="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <div>
                <p class="text-[11px] text-slate-500">วันที่เสร็จสิ้น</p>
                <p class="text-[13px] text-slate-800">{{ formatDate(currentJob.completion_date) }}</p>
              </div>
            </div>
          </div>
        </UiCard>

        <!-- Problem Description -->
        <UiCard class-name="p-4">
          <h3 class="text-[13px] font-bold text-slate-800 mb-2">รายละเอียดปัญหา</h3>
          <p class="text-[13px] text-slate-600">{{ currentJob.problem_description }}</p>
        </UiCard>

        <!-- Root Cause & Corrective Action -->
        <UiCard v-if="currentJob.root_cause || currentJob.corrective_action" class-name="p-4">
          <div v-if="currentJob.root_cause" class="mb-3">
            <h3 class="text-[13px] font-bold text-slate-800 mb-2">สาเหตุ</h3>
            <p class="text-[13px] text-slate-600">{{ currentJob.root_cause }}</p>
          </div>

          <div v-if="currentJob.corrective_action">
            <h3 class="text-[13px] font-bold text-slate-800 mb-2">การแก้ไข</h3>
            <p class="text-[13px] text-slate-600">{{ currentJob.corrective_action }}</p>
          </div>
        </UiCard>

        <!-- Evidence Images (Before) -->
        <UiCard v-if="currentJob.evidence_images && currentJob.evidence_images.length > 0" class-name="p-4">
          <h3 class="text-[13px] font-bold text-slate-800 mb-3">รูปภาพหลักฐาน</h3>
          <div class="grid grid-cols-2 gap-2">
            <img 
              v-for="img in currentJob.evidence_images" 
              :key="img.id"
              :src="getImageUrl(img.url)" 
              :alt="img.caption"
              class="w-full h-32 object-cover rounded-lg"
            />
          </div>
        </UiCard>

        <!-- Work Summary -->
        <UiCard v-if="currentJob.labor_hours || currentJob.total_cost" class-name="p-4">
          <h3 class="text-[13px] font-bold text-slate-800 mb-3">สรุปงาน</h3>
          
          <div class="space-y-2">
            <div v-if="currentJob.labor_hours" class="flex items-center justify-between">
              <span class="text-[12px] text-slate-600">ชั่วโมงการทำงาน</span>
              <span class="text-[13px] font-bold text-slate-800">{{ currentJob.labor_hours }} ชม.</span>
            </div>

            <div v-if="currentJob.total_cost" class="flex items-center justify-between pt-2 border-t border-slate-200">
              <span class="text-[12px] text-slate-600">ค่าใช้จ่ายรวม</span>
              <span class="text-[14px] font-bold text-[#00a6ff]">฿{{ currentJob.total_cost.toLocaleString() }}</span>
            </div>
          </div>
        </UiCard>

        <!-- Back Button -->
        <UiButton
          variant="secondary"
          size="large"
          full-width
          @click="router.push('/technician/jobs')"
        >
          กลับ
        </UiButton>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const { getJobDetail } = useTechnicianService()
const { currentJob, loading } = useTechnicianState()
const { getImageUrl } = useImageUrl()

const jobId = computed(() => Number(route.params.id))

// Load job detail on mount
onMounted(async () => {
  try {
    await getJobDetail(jobId.value)
  } catch (error) {
    console.error('Failed to load job detail:', error)
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

const formatDate = (dateString: string | null) => {
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
</script>
