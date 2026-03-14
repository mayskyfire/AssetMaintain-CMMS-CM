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

      <!-- Spare Parts Approval Card -->
      <UiCard v-if="spareApproval" class-name="p-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-[13px] font-bold text-slate-800">รายการอะไหล่ที่ขออนุมัติ</h3>
          <UiBadge
            :label="spareApproval.status === 'pending' ? 'รออนุมัติ' : spareApproval.status === 'approved' ? 'อนุมัติแล้ว' : 'ปฏิเสธ'"
            :variant="spareApproval.status === 'pending' ? 'warning' : spareApproval.status === 'approved' ? 'success' : 'danger'"
            :show-dot="true"
            size="small"
          />
        </div>
        <div class="bg-slate-50 rounded-[8px] p-3">
          <div class="space-y-2">
            <div
              v-for="item in spareApproval.items"
              :key="item.id"
              class="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
            >
              <div>
                <p class="text-[12px] font-bold text-slate-800">{{ item.part_name }}</p>
                <p class="text-[11px] text-slate-500">{{ item.part_code || '-' }} | คงเหลือ: {{ item.stock_quantity }} {{ item.unit || 'ชิ้น' }}</p>
              </div>
              <div class="text-right">
                <p class="text-[13px] font-bold text-slate-800">{{ item.quantity }} {{ item.unit || 'ชิ้น' }}</p>
                <p v-if="item.unit_cost" class="text-[11px] text-slate-500">฿{{ (item.unit_cost * item.quantity).toLocaleString() }}</p>
              </div>
            </div>
          </div>
        </div>
        <div v-if="spareApproval.status === 'rejected' && spareApproval.approval_notes" class="mt-3 px-3 py-2 bg-red-50 rounded-[8px]">
          <p class="text-[12px] text-red-600">เหตุผล: {{ spareApproval.approval_notes }}</p>
        </div>
        <div v-if="spareApproval.approved_by_name" class="mt-2">
          <p class="text-[11px] text-slate-500">
            {{ spareApproval.status === 'approved' ? 'อนุมัติโดย' : 'โดย' }}: {{ spareApproval.approved_by_name }}
            <span v-if="spareApproval.approved_at"> • {{ formatDate(spareApproval.approved_at) }}</span>
          </p>
        </div>
      </UiCard>

      <!-- Spare Approval Warning -->
      <UiCard v-if="currentNotification?.status === 'pending_spare_approval'" class-name="p-4 bg-orange-50 border border-orange-200">
        <div class="flex items-start gap-3">
          <Icon name="lucide:alert-circle" size="20" class="text-orange-500 shrink-0 mt-0.5" />
          <div>
            <p class="text-[13px] font-bold text-orange-700">รออนุมัติอะไหล่</p>
            <p class="text-[12px] text-orange-600 mt-1">ต้องอนุมัติอะไหล่ก่อนจึงจะมอบหมายงานได้</p>
            <button
              @click="router.push('/supervisor/spare-approvals')"
              class="mt-2 text-[12px] text-[#00a6ff] font-bold"
            >
              ไปหน้าอนุมัติอะไหล่ →
            </button>
          </div>
        </div>
      </UiCard>

      <!-- Already Assigned Technicians -->
      <UiCard v-if="assignedTechnicians.length > 0" class-name="p-4">
        <h3 class="text-[13px] font-bold text-slate-800 mb-3">ช่างที่มอบหมายแล้ว</h3>
        <div class="space-y-2">
          <div
            v-for="tech in assignedTechnicians"
            :key="tech.technician_id"
            class="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
          >
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 bg-[#00a6ff]/10 rounded-full flex items-center justify-center">
                <Icon name="lucide:user" class="w-4 h-4 text-[#00a6ff]" />
              </div>
              <div>
                <p class="text-[13px] font-bold text-slate-800">
                  {{ tech.full_name }}
                  <span v-if="tech.is_lead" class="text-[10px] text-[#00a6ff] ml-1">(ช่างหลัก)</span>
                </p>
                <p class="text-[11px] text-slate-500">{{ formatDate(tech.assigned_at) }}</p>
              </div>
            </div>
            <UiBadge
              :label="tech.status === 'accepted' ? 'รับงานแล้ว' : tech.status === 'in_progress' ? 'กำลังซ่อม' : tech.status === 'completed' ? 'เสร็จ' : 'รอรับงาน'"
              :variant="tech.status === 'accepted' || tech.status === 'in_progress' ? 'primary' : tech.status === 'completed' ? 'success' : 'warning'"
              size="small"
            />
          </div>
        </div>
      </UiCard>

      <!-- Technician Selection (Multi-select) -->
      <div v-if="canAssign">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-[14px] font-bold text-slate-800">เลือกช่างซ่อม</h3>
          <span v-if="selectedTechIds.length > 0" class="text-[12px] text-[#00a6ff] font-bold">
            เลือกแล้ว {{ selectedTechIds.length }} คน
          </span>
        </div>
        <div class="space-y-2">
          <UiCard
            v-for="tech in availableTechnicians"
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
                     selectedTechIds.includes(tech.id)
                       ? 'bg-[#00a6ff] border-[#00a6ff]'
                       : 'border-slate-300'
                   ]">
                <Icon v-if="selectedTechIds.includes(tech.id)"
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
        v-if="canAssign"
        variant="primary"
        size="large"
        full-width
        :disabled="selectedTechIds.length === 0 || assigning"
        @click="handleAssignClick"
      >
        {{ assigning ? 'กำลังมอบหมาย...' : `มอบหมายงาน (${selectedTechIds.length} คน)` }}
      </UiButton>
    </div>

    <!-- Confirmation Modal -->
    <UiModal
      :is-open="showConfirmModal"
      title="ยืนยันมอบหมายงาน"
      :message="`คุณต้องการมอบหมายงานให้ ${getSelectedTechNames()} ใช่หรือไม่?`"
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
const api = useApi()

const jobId = Number(route.params.id)
const selectedTechIds = ref<number[]>([])
const showConfirmModal = ref(false)
const assigning = ref(false)
const spareApproval = ref<any>(null)
const assignedTechnicians = ref<any[]>([])

// Load data on mount
onMounted(async () => {
  try {
    await Promise.all([
      getNotificationDetail(jobId),
      getTechnicians(),
      loadSpareApproval(),
      loadAssignedTechnicians()
    ])
  } catch (error) {
    console.error('Failed to load data:', error)
  }
})

const loadSpareApproval = async () => {
  try {
    const response = await api.get<any>('/cm/spare-approvals', { status: 'all' })
    if (response.success && response.data) {
      spareApproval.value = response.data.find((a: any) => a.cm_history_id === jobId) || null
    }
  } catch (error) {
    // ไม่มี spare approval ก็ไม่เป็นไร
  }
}

const loadAssignedTechnicians = async () => {
  try {
    const response = await api.get<any>(`/cm/notifications/${jobId}`)
    if (response.success && response.data?.assigned_technicians) {
      assignedTechnicians.value = response.data.assigned_technicians
    }
  } catch (error) {
    // ไม่มีข้อมูลก็ไม่เป็นไร
  }
}

// กรองช่างที่ยังไม่ถูกมอบหมายงานนี้
const availableTechnicians = computed(() => {
  const assignedIds = assignedTechnicians.value.map((t: any) => t.technician_id)
  return technicians.value.filter(t => !assignedIds.includes(t.id))
})

// สามารถมอบหมายได้เมื่อสถานะไม่ใช่ pending_spare_approval
const canAssign = computed(() => {
  const status = currentNotification.value?.status
  return status !== 'pending_spare_approval' && status !== 'completed' && status !== 'cancelled'
})

const toggleTech = (id: number) => {
  const index = selectedTechIds.value.indexOf(id)
  if (index === -1) {
    selectedTechIds.value.push(id)
  } else {
    selectedTechIds.value.splice(index, 1)
  }
}

const handleAssignClick = () => {
  if (selectedTechIds.value.length === 0) {
    showError('กรุณาเลือกช่างอย่างน้อย 1 คน')
    return
  }
  showConfirmModal.value = true
}

const handleConfirmAssign = async () => {
  if (selectedTechIds.value.length === 0) return

  showConfirmModal.value = false
  assigning.value = true

  try {
    await assignTechnician({
      cm_history_id: jobId,
      technician_ids: selectedTechIds.value,
      supervisor_id: user.value?.id || 1
    })

    showSuccess('มอบหมายงานสำเร็จ', `มอบหมายให้ ${getSelectedTechNames()} แล้ว`)

    setTimeout(() => {
      router.push('/supervisor/inbox')
    }, 1000)
  } catch (err: any) {
    showError(err.message || 'มอบหมายงานไม่สำเร็จ')
  } finally {
    assigning.value = false
  }
}

const getSelectedTechNames = () => {
  return selectedTechIds.value
    .map(id => technicians.value.find(t => t.id === id)?.full_name || '')
    .filter(Boolean)
    .join(', ')
}

const formatRating = (rating: any) => {
  if (!rating) return 'N/A'
  const num = typeof rating === 'string' ? parseFloat(rating) : rating
  return isNaN(num) ? 'N/A' : num.toFixed(1)
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    reported: 'พร้อมมอบหมาย',
    pending: 'พร้อมมอบหมาย',
    pending_spare_approval: 'รออนุมัติอะไหล่',
    spare_approved: 'พร้อมมอบหมาย',
    assigned: 'มอบหมายแล้ว',
    in_progress: 'กำลังซ่อม',
    completed: 'เสร็จสิ้น',
    evaluated: 'เสร็จสิ้น'
  }
  return labels[status] || status
}

const getStatusVariant = (status: string) => {
  const variants: Record<string, any> = {
    reported: 'primary',
    pending: 'primary',
    pending_spare_approval: 'warning',
    spare_approved: 'primary',
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
  }) + ` น.`
}
</script>
