<template>
  <div class="min-h-screen bg-slate-50">
    <LayoutMobileHeader title="มอบหมายช่าง" :show-back="true" />

    <UiLoading v-if="loading" />

    <div v-else class="p-4 space-y-4 pb-24">
      <!-- Job Info Card -->
      <UiCard v-if="currentNotification" class-name="p-4">
        <div class="flex items-start justify-between mb-3">
          <span class="text-[16px] font-bold text-[#00a6ff]">{{ currentNotification.notification_id }}</span>
          <UiBadge
            :label="getStatusLabel(currentNotification.status)"
            :variant="getStatusVariant(currentNotification.status)"
            :show-dot="true"
          />
        </div>

        <h2 class="text-[18px] font-bold text-slate-800 mb-3">
          {{ currentNotification.asset_name }}
        </h2>

        <div class="space-y-2 mb-4">
          <div class="flex items-start gap-2">
            <Icon name="lucide:map-pin" size="16" class="text-slate-500 shrink-0 mt-0.5" />
            <span class="text-[13px] text-slate-500">{{ currentNotification.location }}</span>
          </div>
          <div class="flex items-start gap-2">
            <Icon name="lucide:clock" size="16" class="text-slate-500 shrink-0 mt-0.5" />
            <span class="text-[13px] text-slate-500">
              แจ้งเมื่อ: {{ formatDate(currentNotification.breakdown_date) }}
            </span>
          </div>
          <div v-if="currentNotification.requester_name" class="flex items-start gap-2">
            <Icon name="lucide:user-check" size="16" class="text-slate-500 shrink-0 mt-0.5" />
            <span class="text-[13px] text-slate-500">
              ผู้แจ้ง: {{ currentNotification.requester_name }}
            </span>
          </div>
        </div>

        <div class="flex gap-2">
          <UiBadge
            :label="`Priority: ${currentNotification.priority}`"
            :variant="currentNotification.priority === 'critical' || currentNotification.priority === 'high' ? 'danger' : 'primary'"
            size="small"
          />
          <UiBadge
            v-if="currentNotification.problem_category"
            :label="currentNotification.problem_category"
            variant="secondary"
            size="small"
          />
        </div>
      </UiCard>

      <!-- Description -->
      <UiCard v-if="currentNotification" class-name="p-4">
        <h3 class="text-[13px] font-bold text-slate-800 mb-2">รายละเอียดปัญหา</h3>
        <p class="text-[13px] text-slate-600">{{ currentNotification.problem_description }}</p>
      </UiCard>

      <!-- Evidence Images -->
      <UiCard v-if="currentNotification?.evidence_images && currentNotification.evidence_images.length > 0" class-name="p-4">
        <h3 class="text-[13px] font-bold text-slate-800 mb-3">รูปภาพหลักฐาน</h3>
        <div class="grid grid-cols-2 gap-3">
          <div
            v-for="img in currentNotification.evidence_images"
            :key="img.id"
            class="relative aspect-square rounded-[8px] overflow-hidden bg-slate-100"
          >
            <img :src="getImageUrl(img.url)" :alt="img.caption || 'Evidence'" class="w-full h-full object-cover" />
            <div v-if="img.caption" class="absolute bottom-0 left-0 right-0 bg-black/50 p-2">
              <p class="text-[11px] text-white">{{ img.caption }}</p>
            </div>
          </div>
        </div>
      </UiCard>

      <!-- Technician Selection -->
      <div>
        <h3 class="text-[14px] font-bold text-slate-800 mb-3">เลือกช่างซ่อม</h3>
        <div class="space-y-2">
          <UiCard
            v-for="tech in technicians"
            :key="tech.id"
            :clickable="tech.is_available"
            :class-name="`p-4 ${!tech.is_available ? 'opacity-50' : ''}`"
            @click="tech.is_available && toggleTech(tech.id)"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                  <Icon name="lucide:user" class="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <p class="text-[14px] font-bold text-slate-800">{{ tech.full_name }}</p>
                  <div class="flex items-center gap-2 mt-1">
                    <span class="text-[11px] text-slate-500">งานปัจจุบัน: {{ tech.current_jobs || 0 }}</span>
                    <span class="text-[11px] text-slate-500">•</span>
                    <span class="text-[11px] text-slate-500">⭐ {{ formatRating(tech.avg_rating) }}</span>
                  </div>
                </div>
              </div>
              <div v-if="tech.is_available" 
                   :class="[
                     'w-6 h-6 rounded-md border-2 flex items-center justify-center',
                     selectedTechId === tech.id
                       ? 'bg-[#00a6ff] border-[#00a6ff]' 
                       : 'border-slate-300'
                   ]">
                <Icon v-if="selectedTechId === tech.id" 
                      name="lucide:check" 
                      class="w-4 h-4 text-white" />
              </div>
              <span v-else class="text-[11px] text-[#ff3b30] font-bold">ไม่ว่าง</span>
            </div>
          </UiCard>
        </div>
      </div>

      <!-- Assign Button -->
      <UiButton
        variant="primary"
        size="large"
        full-width
        :disabled="!selectedTechId || assigning"
        @click="handleAssignClick"
      >
        {{ assigning ? 'กำลังมอบหมาย...' : 'มอบหมายงาน' }}
      </UiButton>
    </div>

    <!-- Confirmation Modal -->
    <UiModal
      :is-open="showConfirmModal"
      title="ยืนยันมอบหมายงาน"
      :message="`คุณต้องการมอบหมายงานให้ ${getSelectedTechName()} ใช่หรือไม่?`"
      confirm-text="มอบหมายงาน"
      cancel-text="ยกเลิก"
      confirm-variant="primary"
      @close="showConfirmModal = false"
      @confirm="handleConfirmAssign"
    >
      <template #icon>
        <Icon name="lucide:user-check" class="w-16 h-16 text-[#00a6ff]" />
      </template>
    </UiModal>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const { success: showSuccess, error: showError } = useToast()
const { getTechnicians, assignTechnician } = useSupervisorService()
const { technicians, loading } = useSupervisorState()
const { getNotificationDetail } = useNotificationService()
const { currentNotification } = useNotificationState()
const { user } = useAuth()
const { getImageUrl } = useImageUrl()

const jobId = Number(route.params.id)
const selectedTechId = ref<number | null>(null)
const showConfirmModal = ref(false)
const assigning = ref(false)

// Load data on mount
onMounted(async () => {
  try {
    await Promise.all([
      getNotificationDetail(jobId),
      getTechnicians()
    ])
  } catch (error) {
    console.error('Failed to load data:', error)
  }
})

const toggleTech = (id: number) => {
  selectedTechId.value = selectedTechId.value === id ? null : id
}

const handleAssignClick = () => {
  if (!selectedTechId.value) {
    showError('กรุณาเลือกช่าง')
    return
  }
  showConfirmModal.value = true
}

const handleConfirmAssign = async () => {
  if (!selectedTechId.value) return

  showConfirmModal.value = false
  assigning.value = true

  try {
    await assignTechnician({
      cm_history_id: jobId,
      technician_id: selectedTechId.value,
      supervisor_id: user.value?.id || 1
    })

    showSuccess('มอบหมายงานสำเร็จ', `มอบหมายให้ ${getSelectedTechName()} แล้ว`)
    
    setTimeout(() => {
      router.push('/supervisor/inbox')
    }, 1000)
  } catch (err: any) {
    showError(err.message || 'มอบหมายงานไม่สำเร็จ')
  } finally {
    assigning.value = false
  }
}

const getSelectedTechName = () => {
  const tech = technicians.value.find(t => t.id === selectedTechId.value)
  return tech?.full_name || ''
}

const formatRating = (rating: any) => {
  if (!rating) return 'N/A'
  const num = typeof rating === 'string' ? parseFloat(rating) : rating
  return isNaN(num) ? 'N/A' : num.toFixed(1)
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    reported: 'รอมอบหมายงาน',
    pending: 'รอดำเนินการ',
    assigned: 'รอการซ่อม',
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
