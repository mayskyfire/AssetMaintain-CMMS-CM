<template>
  <div class="min-h-screen bg-slate-50">
    <LayoutMobileHeader title="มอบหมายช่าง" :show-back="true" />

    <UiLoading v-if="loading" />

    <div v-else class="p-4 space-y-4 pb-24">
      <!-- Job Info Card -->
      <UiCard v-if="currentNotification" class-name="p-4">
        <h3 class="text-[13px] font-bold text-slate-800 mb-2">เลขที่ใบแจ้ง</h3>
        <p class="text-[16px] font-bold text-[#00a6ff]">{{ currentNotification.notification_id }}</p>
        <p class="text-[14px] font-bold text-slate-800 mt-2">{{ currentNotification.asset_name }}</p>
        <p class="text-[12px] text-slate-500 mt-1">{{ currentNotification.problem_description }}</p>
        <div class="flex items-center gap-2 mt-2">
          <UiBadge
            :label="`Priority: ${currentNotification.priority}`"
            :variant="currentNotification.priority === 'critical' || currentNotification.priority === 'high' ? 'danger' : 'primary'"
            size="small"
          />
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
                    <span class="text-[11px] text-slate-500">งานปัจจุบัน: {{ tech.current_jobs }}</span>
                    <span class="text-[11px] text-slate-500">•</span>
                    <span class="text-[11px] text-slate-500">⭐ {{ tech.avg_rating.toFixed(1) }}</span>
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
</script>
