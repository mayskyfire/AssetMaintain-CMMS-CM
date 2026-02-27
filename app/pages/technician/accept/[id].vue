<template>
  <div class="min-h-screen bg-slate-50">
    <LayoutMobileHeader title="รับงานซ่อม" :show-back="true" />

    <div class="p-4 space-y-4 pb-24">
      <!-- Loading State -->
      <UiLoading v-if="loading" />

      <template v-else-if="currentJob">
        <!-- Job Details Card -->
        <UiCard class-name="p-4">
          <div class="flex items-start justify-between mb-3">
            <span class="text-[16px] font-bold text-[#00a6ff]">{{ currentJob.notification_id }}</span>
            <UiBadge 
              :label="getPriorityLabel(currentJob.priority)" 
              :variant="getPriorityVariant(currentJob.priority)" 
              size="small" 
            />
          </div>

          <h2 class="text-[18px] font-bold text-slate-800 mb-4">
            {{ currentJob.asset_name }}
          </h2>

          <div class="grid grid-cols-2 gap-3 mb-4">
            <div class="flex items-start gap-2">
              <Icon name="lucide:map-pin" class="w-4 h-4 text-slate-500 shrink-0 mt-1" />
              <div>
                <p class="text-[11px] text-slate-500">สถานที่</p>
                <p class="text-[13px] text-slate-800 font-bold">{{ currentJob.location }}</p>
              </div>
            </div>

            <div class="flex items-start gap-2">
              <Icon name="lucide:clock" class="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <div>
                <p class="text-[11px] text-slate-500">ได้รับมอบหมายเมื่อ</p>
                <p class="text-[13px] text-slate-800">{{ formatDate(currentJob.assigned_at) }}</p>
              </div>
            </div>
          </div>

          <div class="h-px bg-slate-200 my-4"></div>

          <div class="bg-slate-50 rounded-[10px] p-3">
            <h3 class="text-[13px] font-bold text-slate-800 mb-2">รายละเอียดปัญหา</h3>
            <p class="text-[13px] text-slate-600">
              {{ currentJob.problem_description }}
            </p>
          </div>

          <div class="h-px bg-slate-200 my-4"></div>

          <div>
            <h3 class="text-[13px] font-bold text-slate-800 mb-2">ประเภทการแจ้ง</h3>
            <UiBadge 
              :label="currentJob.notification_type || 'Z2 - ผิดปกติ'" 
              variant="primary" 
              size="medium" 
            />
          </div>

          <!-- Evidence Images -->
          <div v-if="currentJob.evidence_images && currentJob.evidence_images.length > 0" class="mt-4">
            <h3 class="text-[13px] font-bold text-slate-800 mb-2">รูปภาพหลักฐาน</h3>
            <div class="grid grid-cols-2 gap-2">
              <img 
                v-for="img in currentJob.evidence_images" 
                :key="img.id"
                :src="img.url" 
                :alt="img.caption"
                class="w-full h-32 object-cover rounded-lg"
              />
            </div>
          </div>
        </UiCard>

        <!-- Note Card -->
        <UiCard class-name="p-4 bg-blue-100">
          <h3 class="text-[14px] font-bold text-slate-800 mb-2">หมายเหตุ</h3>
          <p class="text-[12px] text-slate-600">
            กรุณาตรวจสอบอุปกรณ์และเริ่มงานภายใน 2 ชั่วโมงหลังจากรับงาน
          </p>
        </UiCard>

        <!-- Action Buttons -->
        <div class="space-y-3">
          <UiButton
            variant="primary"
            size="large"
            full-width
            @click="handleAccept"
            :disabled="loading"
          >
            รับงานและเริ่มซ่อม
          </UiButton>

          <UiButton
            variant="secondary"
            size="large"
            full-width
            @click="router.push('/technician/jobs')"
          >
            ยกเลิก
          </UiButton>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const { user } = useAuth()
const { getJobDetail, acceptJob } = useTechnicianService()
const { currentJob, loading } = useTechnicianState()

const jobId = computed(() => Number(route.params.id))

// Load job detail on mount
onMounted(async () => {
  try {
    await getJobDetail(jobId.value)
  } catch (error) {
    console.error('Failed to load job detail:', error)
  }
})

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

const handleAccept = async () => {
  try {
    await acceptJob({
      cm_history_id: jobId.value,
      accepted_by: user.value?.full_name || 'Technician',
      qr_scanned_start: new Date().toISOString()
    })
    
    setTimeout(() => {
      router.push(`/technician/worklog/${jobId.value}`)
    }, 800)
  } catch (error) {
    console.error('Failed to accept job:', error)
  }
}
</script>
