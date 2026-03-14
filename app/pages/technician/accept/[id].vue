<template>
  <div class="min-h-screen bg-slate-50">
    <LayoutMobileHeader :title="alreadyAccepted ? 'ดำเนินการซ่อมต่อ' : 'รับงานซ่อม'" :show-back="true" />

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
                :src="getImageUrl(img.url)" 
                :alt="img.caption"
                class="w-full h-32 object-cover rounded-lg"
              />
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
        </UiCard>

        <!-- Assigned Technicians Card -->
        <UiCard v-if="assignedTechnicians.length > 1" class-name="p-4">
          <h3 class="text-[13px] font-bold text-slate-800 mb-3">ช่างที่ได้รับมอบหมาย ({{ assignedTechnicians.length }} คน)</h3>
          <div class="space-y-2">
            <div
              v-for="tech in assignedTechnicians"
              :key="tech.technician_id"
              class="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
            >
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 bg-[#00a6ff]/10 rounded-full flex items-center justify-center">
                  <Icon name="lucide:user" class="w-3.5 h-3.5 text-[#00a6ff]" />
                </div>
                <p class="text-[13px] text-slate-800">
                  {{ tech.full_name }}
                  <span v-if="tech.is_lead" class="text-[10px] text-[#00a6ff]">(หลัก)</span>
                </p>
              </div>
              <UiBadge
                :label="tech.status === 'in_progress' ? 'รับงานแล้ว' : 'รอรับงาน'"
                :variant="tech.status === 'in_progress' ? 'primary' : 'warning'"
                size="small"
              />
            </div>
          </div>
        </UiCard>

        <!-- Note Card -->
        <UiCard v-if="!alreadyAccepted" class-name="p-4 bg-blue-100">
          <h3 class="text-[14px] font-bold text-slate-800 mb-2">หมายเหตุ</h3>
          <p class="text-[12px] text-slate-600">
            กรุณาตรวจสอบอุปกรณ์และเริ่มงานภายใน 2 ชั่วโมงหลังจากรับงาน
          </p>
        </UiCard>

        <!-- Action Buttons -->
        <div class="space-y-3">
          <!-- กรณีรับงานไปแล้ว (กลับมาเปิดใหม่) -->
          <UiButton
            v-if="alreadyAccepted"
            variant="success"
            size="large"
            full-width
            @click="router.push(`/technician/worklog/${jobId}`)"
          >
            <Icon name="lucide:play" class="w-5 h-5 mr-2" />
            เริ่มงานซ่อมต่อ
          </UiButton>

          <!-- กรณียังไม่ได้รับงาน -->
          <UiButton
            v-else
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
            {{ alreadyAccepted ? 'กลับ' : 'ยกเลิก' }}
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
const { getImageUrl } = useImageUrl()
const api = useApi()

const jobId = computed(() => Number(route.params.id))
const spareApproval = ref<any>(null)
const assignedTechnicians = ref<any[]>([])

// ตรวจสอบว่าช่างคนนี้รับงานไปแล้วหรือยัง
const alreadyAccepted = computed(() => {
  // เช็คจาก cm_history.status ว่าเป็น in_progress
  if (currentJob.value?.status === 'in_progress') return true
  // เช็คจาก assigned_technicians ว่าตัวเองมี status = accepted/in_progress
  if (user.value && assignedTechnicians.value.length > 0) {
    const myAssignment = assignedTechnicians.value.find(
      (t: any) => t.technician_id === user.value?.id
    )
    if (myAssignment && (myAssignment.status === 'accepted' || myAssignment.status === 'in_progress')) {
      return true
    }
  }
  return false
})
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
    const response = await api.get<any>('/cm/spare-approvals', { status: 'all' })
    if (response.success && response.data) {
      spareApproval.value = response.data.find((a: any) => a.cm_history_id === jobId.value) || null
    }
  } catch (error) {
    // ไม่มี spare approval ก็ไม่เป็นไร
  }
}

const getPriorityLabel = (priority: string) => {
  const labels: Record<string, string> = {
    critical: 'เร่งด่วน',
    high: 'ด่วน',
    medium: 'ปกติ',
    low: 'ไม่ดวน'
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
  }) + ` น.`
}

const handleAccept = async () => {
  try {
    // Send current time as-is; server will convert to Thailand timezone
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
