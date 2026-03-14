<template>
  <div class="min-h-screen bg-slate-50">
    <LayoutMobileHeader title="อนุมัติอะไหล่" />

    <UiLoading v-if="loading" />

    <div v-else class="pb-24">
      <!-- Filter Tabs -->
      <div class="px-4 pt-4">
        <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            @click="filterStatus = tab.value"
            :class="[
              'px-4 py-2 rounded-full text-[14px] whitespace-nowrap transition-colors',
              filterStatus === tab.value
                ? tab.activeClass
                : 'bg-white text-slate-500 border border-slate-200'
            ]"
          >
            {{ tab.label }} ({{ getCount(tab.value) }})
          </button>
        </div>
      </div>

      <!-- Approval List -->
      <div v-if="filteredApprovals.length > 0" class="p-4 space-y-3">
        <UiCard
          v-for="approval in filteredApprovals"
          :key="approval.id"
          class-name="p-4"
        >
          <!-- Header -->
          <div class="flex items-start justify-between mb-3">
            <span class="text-[13px] font-bold text-[#00a6ff]">{{ approval.notification_id }}</span>
            <UiBadge
              :label="getApprovalStatusLabel(approval.status)"
              :variant="getApprovalStatusVariant(approval.status)"
              :show-dot="true"
            />
          </div>

          <h4 class="text-[14px] font-bold text-slate-800 mb-1">{{ approval.asset_name }}</h4>
          <div class="flex items-start gap-1 mb-3">
            <Icon name="lucide:map-pin" size="14" class="text-slate-500 shrink-0 mt-0.5" />
            <span class="text-[12px] text-slate-500">{{ approval.location }}</span>
          </div>

          <div class="flex items-center gap-2 mb-3">
            <Icon name="lucide:user" size="14" class="text-slate-500" />
            <span class="text-[12px] text-slate-500">ผู้ขอ: {{ approval.requested_by_name }}</span>
            <span class="text-[11px] text-slate-400">{{ formatDate(approval.requested_at) }}</span>
          </div>

          <!-- Parts List -->
          <div class="bg-slate-50 rounded-[8px] p-3 mb-3">
            <p class="text-[12px] font-bold text-slate-700 mb-2">รายการอะไหล่ ({{ approval.items?.length || 0 }} รายการ)</p>
            <div class="space-y-2">
              <div
                v-for="item in approval.items"
                :key="item.id"
                class="flex items-center justify-between"
              >
                <div>
                  <p class="text-[12px] text-slate-800">{{ item.part_name }}</p>
                  <p class="text-[11px] text-slate-500">{{ item.part_code || '-' }} | คงเหลือ: {{ item.stock_quantity }} {{ item.unit || 'ชิ้น' }}</p>
                </div>
                <div class="text-right">
                  <p class="text-[13px] font-bold text-slate-800">{{ item.quantity }} {{ item.unit || 'ชิ้น' }}</p>
                  <p v-if="item.unit_cost" class="text-[11px] text-slate-500">฿{{ (item.unit_cost * item.quantity).toLocaleString() }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Approved/Rejected info -->
          <div v-if="approval.status !== 'pending'" class="bg-slate-50 rounded-[8px] p-3 mb-3">
            <p class="text-[12px] text-slate-600">
              {{ approval.status === 'approved' ? 'อนุมัติโดย' : 'ปฏิเสธโดย' }}: {{ approval.approved_by_name || '-' }}
            </p>
            <p v-if="approval.approval_notes" class="text-[12px] text-slate-500 mt-1">หมายเหตุ: {{ approval.approval_notes }}</p>
          </div>

          <!-- Action Buttons (only for pending) -->
          <div v-if="approval.status === 'pending'" class="space-y-2">
            <!-- Notes input -->
            <div>
              <label class="text-[12px] text-slate-600 mb-1 block">หมายเหตุ (ถ้ามี)</label>
              <textarea
                v-model="approvalNotes[approval.id]"
                placeholder="หมายเหตุการอนุมัติ..."
                rows="2"
                class="w-full px-3 py-2 bg-white border border-slate-200 rounded-[8px] text-[13px] focus:outline-none focus:ring-2 focus:ring-[#00a6ff]"
              />
            </div>
            <div class="flex gap-2">
              <button
                @click="handleReject(approval.id)"
                :disabled="processing[approval.id]"
                class="flex-1 py-3 bg-red-50 hover:bg-red-100 border border-red-200 rounded-[10px] text-[13px] text-red-600 font-bold transition-colors disabled:opacity-50"
              >
                {{ processing[approval.id] === 'reject' ? 'กำลังดำเนินการ...' : 'ปฏิเสธ' }}
              </button>
              <button
                @click="handleApprove(approval.id)"
                :disabled="processing[approval.id]"
                class="flex-1 py-3 bg-[#00a6ff] hover:bg-[#0084d1] rounded-[10px] text-[13px] text-white font-bold transition-colors disabled:opacity-50"
              >
                {{ processing[approval.id] === 'approve' ? 'กำลังดำเนินการ...' : 'อนุมัติ' }}
              </button>
            </div>
          </div>
        </UiCard>
      </div>

      <!-- Empty State -->
      <div v-else class="flex flex-col items-center justify-center min-h-[50vh] p-4">
        <Icon name="lucide:clipboard-list" size="48" class="text-slate-300 mb-3" />
        <p class="text-[14px] text-slate-500">ไม่มีคำขออนุมัติอะไหล่</p>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <UiModal
      :is-open="showConfirmModal"
      :title="confirmAction === 'approve' ? 'ยืนยันอนุมัติอะไหล่' : 'ยืนยันปฏิเสธอะไหล่'"
      :message="confirmAction === 'approve' ? 'อนุมัติอะไหล่และตัดสต็อคอัตโนมัติ ต้องการดำเนินการ?' : 'ปฏิเสธคำขออะไหล่นี้ ต้องการดำเนินการ?'"
      :confirm-text="confirmAction === 'approve' ? 'อนุมัติ' : 'ปฏิเสธ'"
      cancel-text="ยกเลิก"
      :confirm-variant="confirmAction === 'approve' ? 'primary' : 'danger'"
      @close="showConfirmModal = false"
      @confirm="confirmActionHandler"
    >
      <template #icon>
        <Icon
          :name="confirmAction === 'approve' ? 'lucide:check-circle' : 'lucide:x-circle'"
          :class="['w-16 h-16', confirmAction === 'approve' ? 'text-[#6dd400]' : 'text-[#ff3b30]']"
        />
      </template>
    </UiModal>

    <LayoutBottomNav role="supervisor" />
  </div>
</template>

<script setup lang="ts">
const { user } = useAuth()
const { success: showSuccess, error: showError } = useToast()
const api = useApi()

const loading = ref(true)
const approvals = ref<any[]>([])
const filterStatus = ref('all')
const approvalNotes = ref<Record<number, string>>({})
const processing = ref<Record<number, string | false>>({})
const showConfirmModal = ref(false)
const confirmAction = ref<'approve' | 'reject'>('approve')
const confirmApprovalId = ref<number | null>(null)

const tabs = [
  { value: 'all', label: 'ทั้งหมด', activeClass: 'bg-[#00a6ff] text-white' },
  { value: 'pending', label: 'รออนุมัติ', activeClass: 'bg-[#fef3c6] text-[#bb4d00] border border-[#fe9a00]' },
  { value: 'approved', label: 'อนุมัติแล้ว', activeClass: 'bg-[rgba(109,212,0,0.1)] text-[#6dd400] border border-[#6dd400]' },
  { value: 'rejected', label: 'ปฏิเสธ', activeClass: 'bg-red-50 text-red-600 border border-red-200' }
]

const loadApprovals = async () => {
  loading.value = true
  try {
    const response = await api.get<any>('/cm/spare-approvals')
    if (response.success && response.data) {
      approvals.value = response.data
    }
  } catch (error) {
    console.error('Failed to load approvals:', error)
    showError('ไม่สามารถโหลดข้อมูลได้')
  } finally {
    loading.value = false
  }
}

onMounted(() => { loadApprovals() })

const getCount = (status: string) => {
  if (status === 'all') return approvals.value.length
  return approvals.value.filter(a => a.status === status).length
}

const filteredApprovals = computed(() => {
  if (filterStatus.value === 'all') return approvals.value
  return approvals.value.filter(a => a.status === filterStatus.value)
})

const handleApprove = (id: number) => {
  confirmAction.value = 'approve'
  confirmApprovalId.value = id
  showConfirmModal.value = true
}

const handleReject = (id: number) => {
  confirmAction.value = 'reject'
  confirmApprovalId.value = id
  showConfirmModal.value = true
}

const confirmActionHandler = async () => {
  const id = confirmApprovalId.value
  if (!id) return
  showConfirmModal.value = false

  const action = confirmAction.value
  processing.value[id] = action

  try {
    const endpoint = action === 'approve'
      ? `/cm/spare-approvals/${id}/approve`
      : `/cm/spare-approvals/${id}/reject`

    const response = await api.post<any>(endpoint, {
      approved_by: user.value?.id || 1,
      approval_notes: approvalNotes.value[id] || null
    })

    if (response.success) {
      showSuccess(action === 'approve' ? 'อนุมัติอะไหล่สำเร็จ' : 'ปฏิเสธคำขอสำเร็จ')
      await loadApprovals()
    }
  } catch (error: any) {
    showError(error.message || 'ดำเนินการไม่สำเร็จ')
  } finally {
    processing.value[id] = false
  }
}

const getApprovalStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: 'รออนุมัติ',
    approved: 'อนุมัติแล้ว',
    rejected: 'ปฏิเสธ'
  }
  return labels[status] || status
}

const getApprovalStatusVariant = (status: string) => {
  const variants: Record<string, string> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger'
  }
  return variants[status] || 'secondary'
}

const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('th-TH', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }) + ` น.`
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
