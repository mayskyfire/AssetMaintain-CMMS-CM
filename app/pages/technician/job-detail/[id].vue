<template>
  <div class="min-h-screen bg-slate-50">
    <LayoutMobileHeader title="รายละเอียดงาน" :show-back="true" />

    <UiLoading v-if="loading" />

    <div v-else-if="currentJob" class="p-4 space-y-4 pb-24">
      <!-- Header -->
      <UiCard class-name="p-4">
        <div class="flex items-start justify-between mb-3">
          <span class="text-[16px] font-bold text-[#00a6ff]">{{ currentJob.notification_id }}</span>
          <UiBadge
            :label="getStatusLabel(currentJob.status)"
            :variant="getStatusVariant(currentJob.status)"
            :show-dot="true"
          />
        </div>

        <h2 class="text-[18px] font-bold text-slate-800 mb-3">
          {{ currentJob.asset_name }}
        </h2>

        <div class="space-y-2 mb-4">
          <div class="flex items-start gap-2">
            <Icon name="lucide:map-pin" size="16" class="text-slate-500 shrink-0 mt-0.5" />
            <span class="text-[13px] text-slate-500">{{ currentJob.location }}</span>
          </div>
          <div class="flex items-start gap-2">
            <Icon name="lucide:clock" size="16" class="text-slate-500 shrink-0 mt-0.5" />
            <span class="text-[13px] text-slate-500">
              แจ้งเมื่อ: {{ formatDate(currentJob.breakdown_date) }}
            </span>
          </div>
          <div v-if="currentJob.technician_name" class="flex items-start gap-2">
            <Icon name="lucide:user" size="16" class="text-slate-500 shrink-0 mt-0.5" />
            <span class="text-[13px] text-slate-500">
              ช่างผู้รับผิดชอบ: {{ currentJob.technician_name }}
            </span>
          </div>
          <!-- แสดงช่างหลายคน (ถ้ามี) -->
          <div v-if="assignedTechnicians.length > 1" class="flex items-start gap-2">
            <Icon name="lucide:users" size="16" class="text-slate-500 shrink-0 mt-0.5" />
            <div>
              <span class="text-[13px] text-slate-500">ช่างทั้งหมด ({{ assignedTechnicians.length }} คน):</span>
              <div class="mt-1 space-y-1">
                <p v-for="tech in assignedTechnicians" :key="tech.technician_id" class="text-[12px] text-slate-500">
                  • {{ tech.full_name }}
                  <span v-if="tech.is_lead" class="text-[10px] text-[#00a6ff]">(หลัก)</span>
                </p>
              </div>
            </div>
          </div>
          <div v-if="currentJob.requester_name" class="flex items-start gap-2">
            <Icon name="lucide:user-check" size="16" class="text-slate-500 shrink-0 mt-0.5" />
            <span class="text-[13px] text-slate-500">
              ผู้แจ้ง: {{ currentJob.requester_name }}
            </span>
          </div>
        </div>

        <div class="flex gap-2">
          <UiBadge
            :label="`Priority: ${currentJob.priority}`"
            :variant="currentJob.priority === 'critical' || currentJob.priority === 'high' ? 'danger' : 'primary'"
            size="small"
          />
          <UiBadge
            v-if="currentJob.problem_category"
            :label="currentJob.problem_category"
            variant="secondary"
            size="small"
          />
        </div>
      </UiCard>

      <!-- Description -->
      <UiCard class-name="p-4">
        <h3 class="text-[13px] font-bold text-slate-800 mb-2">รายละเอียดปัญหา</h3>
        <p class="text-[13px] text-slate-600">{{ currentJob.problem_description }}</p>
      </UiCard>

      <!-- Root Cause & Actions (if completed) -->
      <UiCard v-if="currentJob.root_cause" class-name="p-4">
        <h3 class="text-[13px] font-bold text-slate-800 mb-3">สาเหตุและการแก้ไข</h3>
        <div class="space-y-3">
          <div>
            <p class="text-[12px] font-bold text-slate-600 mb-1">สาเหตุ:</p>
            <p class="text-[13px] text-slate-800">{{ currentJob.root_cause }}</p>
          </div>
          <div v-if="currentJob.corrective_action">
            <p class="text-[12px] font-bold text-slate-600 mb-1">การแก้ไข:</p>
            <p class="text-[13px] text-slate-800">{{ currentJob.corrective_action }}</p>
          </div>
          <div v-if="currentJob.preventive_recommendation">
            <p class="text-[12px] font-bold text-slate-600 mb-1">ข้อเสนอแนะ:</p>
            <p class="text-[13px] text-slate-800">{{ currentJob.preventive_recommendation }}</p>
          </div>
        </div>
      </UiCard>

      <!-- Work Summary (if completed) -->
      <UiCard v-if="currentJob.completion_date" class-name="p-4">
        <h3 class="text-[13px] font-bold text-slate-800 mb-3">สรุปการทำงาน</h3>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <p class="text-[11px] text-slate-500 mb-1">เวลาเริ่มงาน</p>
            <p class="text-[13px] font-bold text-slate-800">
              {{ currentJob.start_time ? formatDate(currentJob.start_time) : '-' }}
            </p>
          </div>
          <div>
            <p class="text-[11px] text-slate-500 mb-1">เวลาเสร็จงาน</p>
            <p class="text-[13px] font-bold text-slate-800">
              {{ formatDate(currentJob.completion_date) }}
            </p>
          </div>
          <div v-if="currentJob.downtime_hours">
            <p class="text-[11px] text-slate-500 mb-1">Downtime</p>
            <p class="text-[13px] font-bold text-slate-800">{{ currentJob.downtime_hours }} ชม.</p>
          </div>
          <div v-if="currentJob.labor_hours">
            <p class="text-[11px] text-slate-500 mb-1">ชั่วโมงทำงาน</p>
            <p class="text-[13px] font-bold text-slate-800">{{ currentJob.labor_hours }} ชม.</p>
          </div>
        </div>
      </UiCard>

      <!-- Evidence Images -->
      <UiCard v-if="currentJob.evidence_images && currentJob.evidence_images.length > 0" class-name="p-4">
        <h3 class="text-[13px] font-bold text-slate-800 mb-3">รูปภาพหลักฐาน</h3>
        <div class="grid grid-cols-2 gap-3">
          <div
            v-for="img in currentJob.evidence_images"
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
      </UiCard>

      <!-- Parts Used -->
      <!-- <UiCard v-if="currentJob.parts_used && currentJob.parts_used.length > 0" class-name="p-4">
        <h3 class="text-[13px] font-bold text-slate-800 mb-3">อะไหล่ที่ใช้</h3>
        <div class="space-y-2">
          <div
            v-for="part in currentJob.parts_used"
            :key="part.id"
            class="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
          >
            <div>
              <p class="text-[13px] font-bold text-slate-800">{{ part.part_name }}</p>
              <p class="text-[11px] text-slate-500">{{ part.part_no || '-' }}</p>
            </div>
            <div class="text-right">
              <p class="text-[13px] font-bold text-slate-800">{{ part.quantity }} {{ part.unit }}</p>
              <p v-if="part.total_cost" class="text-[11px] text-slate-500">฿{{ part.total_cost.toLocaleString() }}</p>
            </div>
          </div>
        </div>
      </UiCard> -->

      <!-- Timeline -->
      <UiCard class-name="p-4">
        <h3 class="text-[13px] font-bold text-slate-800 mb-4">ไทม์ไลน์</h3>
        <UiTimeline :items="timelineItems" />
      </UiCard>

      <!-- Cost Summary (if completed) -->
      <UiCard v-if="currentJob.total_cost" class-name="p-4">
        <h3 class="text-[13px] font-bold text-slate-800 mb-3">สรุปค่าใช้จ่าย</h3>
        <div class="space-y-2">
          <div v-if="currentJob.labor_cost" class="flex items-center justify-between">
            <span class="text-[12px] text-slate-600">ค่าแรง</span>
            <span class="text-[13px] text-slate-800">฿{{ currentJob.labor_cost.toLocaleString() }}</span>
          </div>
          <div v-if="currentJob.parts_cost" class="flex items-center justify-between">
            <span class="text-[12px] text-slate-600">ค่าอะไหล่</span>
            <span class="text-[13px] text-slate-800">฿{{ currentJob.parts_cost.toLocaleString() }}</span>
          </div>
          <div v-if="currentJob.external_cost" class="flex items-center justify-between">
            <span class="text-[12px] text-slate-600">ค่าใช้จ่ายอื่นๆ</span>
            <span class="text-[13px] text-slate-800">฿{{ currentJob.external_cost.toLocaleString() }}</span>
          </div>
          <div class="flex items-center justify-between pt-2 border-t border-slate-200">
            <span class="text-[13px] font-bold text-slate-800">รวมทั้งหมด</span>
            <span class="text-[16px] font-bold text-[#00a6ff]">฿{{ currentJob.total_cost.toLocaleString() }}</span>
          </div>
        </div>
      </UiCard>

      <!-- Evaluation (if exists) -->
      <UiCard v-if="currentJob.satisfaction_rating" class-name="p-4">
        <h3 class="text-[13px] font-bold text-slate-800 mb-3">การประเมินผล</h3>
        <div class="flex items-center gap-2 mb-2">
          <div class="flex gap-1">
            <Icon
              v-for="i in 5"
              :key="i"
              name="lucide:star"
              size="16"
              :class="i <= currentJob.satisfaction_rating ? 'text-[#fe9a00] fill-[#fe9a00]' : 'text-slate-300'"
            />
          </div>
          <span class="text-[13px] font-bold text-slate-800">{{ currentJob.satisfaction_rating }}/5</span>
        </div>
        <p v-if="currentJob.satisfaction_comment" class="text-[13px] text-slate-600">
          {{ currentJob.satisfaction_comment }}
        </p>
      </UiCard>

      <!-- Action Buttons -->
      <div v-if="currentJob.status === 'assigned' || currentJob.status === 'in_progress'" class="space-y-3">
        <UiButton
          v-if="currentJob.status === 'assigned'"
          variant="success"
          size="large"
          full-width
          @click="router.push(`/technician/accept/${currentJob.id}`)"
        >
          <Icon name="lucide:check" class="w-5 h-5 mr-2" />
          รับงาน
        </UiButton>

        <UiButton
          v-if="currentJob.status === 'in_progress'"
          variant="primary"
          size="large"
          full-width
          @click="router.push(`/technician/worklog/${currentJob.id}`)"
        >
          <Icon name="lucide:clipboard" class="w-5 h-5 mr-2" />
          บันทึกการทำงาน
        </UiButton>

        <UiButton
          v-if="currentJob.status === 'in_progress'"
          variant="success"
          size="large"
          full-width
          @click="router.push(`/technician/closeout/${currentJob.id}`)"
        >
          <Icon name="lucide:check-circle" class="w-5 h-5 mr-2" />
          ปิดงาน
        </UiButton>
      </div>

      <!-- Back Button -->
      <UiButton
        variant="secondary"
        size="large"
        full-width
        @click="router.push('/technician/jobs')"
      >
        กลับ
      </UiButton>
    </div>

    <!-- Empty State -->
    <div v-else class="flex flex-col items-center justify-center min-h-[60vh] p-4">
      <Icon name="lucide:alert-circle" size="48" class="text-slate-300 mb-3" />
      <p class="text-[14px] text-slate-500">ไม่พบข้อมูลงาน</p>
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
const assignedTechnicians = ref<any[]>([])
const spareApproval = ref<any>(null)

// Load job detail on mount
onMounted(async () => {
  try {
    await getJobDetail(jobId.value)
    await loadSpareApproval()
  } catch (error) {
    console.error('Failed to load job detail:', error)
  }
})

// โหลดข้อมูลช่างหลายคนจาก assigned_technicians
watch(() => currentJob.value, (val) => {
  if (val && (val as any).assigned_technicians) {
    assignedTechnicians.value = (val as any).assigned_technicians
  }
}, { immediate: true })

const loadSpareApproval = async () => {
  try {
    const api = useApi()
    const response = await api.get<any>('/cm/spare-approvals', { status: 'all' })
    if (response.success && response.data) {
      spareApproval.value = response.data.find((a: any) => a.cm_history_id === jobId.value) || null
    }
  } catch (error) {
    // ไม่มี spare approval ก็ไม่เป็นไร
  }
}

// Transform timeline from API data
const timelineItems = computed(() => {
  if (!currentJob.value?.timeline) return []
  
  return currentJob.value.timeline.map((event: any) => ({
    id: event.id.toString(),
    title: event.event,
    description: event.user ? `โดย: ${event.user}` : undefined,
    timestamp: formatDate(event.time),
    status: event.status === 'completed' ? 'completed' as const : 
            event.status === 'current' ? 'current' as const : 
            'pending' as const
  }))
})

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    reported: 'รอดำเนินการ',
    pending_spare_approval: 'รออนุมัติอะไหล่',
    spare_approved: 'อะไหล่อนุมัติแล้ว',
    assigned: 'รอรับงาน',
    in_progress: 'กำลังดำเนินการ',
    completed: 'เสร็จสิ้น'
  }
  return labels[status] || status
}

const getStatusVariant = (status: string) => {
  const variants: Record<string, any> = {
    reported: 'warning',
    pending_spare_approval: 'warning',
    spare_approved: 'primary',
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
  }) + ` น.`
}
</script>
