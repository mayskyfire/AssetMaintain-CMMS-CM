<template>
  <div class="min-h-screen bg-slate-50">
    <LayoutMobileHeader title="สร้างใบแจ้งซ่อม" :show-back="true" />

    <div class="p-4 space-y-4 pb-24">
      <!-- Equipment Info -->
      <UiCard class-name="p-4 bg-[#dbeafe]">
        <div class="flex items-start justify-between mb-2">
          <h3 class="text-[13px] font-bold text-slate-800">ข้อมูลอุปกรณ์</h3>
          <UiBadge v-if="qrData" variant="success" size="small">
            <Icon name="lucide:qr-code" size="12" class="mr-1" />
            จาก QR
          </UiBadge>
        </div>
        <p class="text-[14px] font-bold text-[#00a6ff] mb-1">
          {{ formData.equipment }}
        </p>
        <div class="flex items-start gap-1">
          <Icon name="lucide:map-pin" size="16" class="text-slate-500 shrink-0 mt-0.5" />
          <span class="text-[12px] text-slate-500">{{ formData.location }}</span>
        </div>
      </UiCard>

      <!-- Form -->
      <UiCard class-name="p-4 space-y-4">
        <UiSelect
          v-model="formData.type"
          label="ประเภทการแจ้ง"
          :options="typeOptions"
          required
        />

        <UiSelect
          v-model="formData.priority"
          label="ระดับความสำคัญ"
          :options="priorityOptions"
          required
        />

        <UiTextarea
          v-model="formData.description"
          label="รายละเอียดปัญหา"
          placeholder="อธิบายอาการหรือปัญหาที่พบ..."
          :rows="5"
          required
        />
      </UiCard>

      <!-- Warning -->
      <UiCard v-if="formData.priority === '1'" class-name="p-4 bg-[#fee2e2]">
        <div class="flex items-start gap-2">
          <Icon name="lucide:alert-circle" size="20" class="text-[#ef4444] shrink-0 mt-0.5" />
          <div>
            <h4 class="text-[13px] font-bold text-[#ef4444] mb-1">
              Priority 1 - วิกฤติ
            </h4>
            <p class="text-[12px] text-[#ef4444]/80">
              งานนี้จะได้รับการดำเนินการอย่างเร่งด่วนทันที
            </p>
          </div>
        </div>
      </UiCard>

      <UiButton
        variant="primary"
        size="large"
        full-width
        :disabled="!formData.description"
        @click="handleSubmit"
      >
        ถัดไป: อัปโหลดหลักฐาน
      </UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const route = useRoute()
const { success: showSuccess, error: showError } = useToast()

// Parse QR data if available
const qrData = computed(() => {
  const qr = route.query.qr as string
  if (!qr) return null
  
  try {
    // Try to parse as JSON first
    return JSON.parse(qr)
  } catch {
    // If not JSON, treat as equipment ID
    return { equipmentId: qr }
  }
})

const formData = ref({
  equipment: qrData.value?.equipmentName || qrData.value?.equipmentId || 'เครื่องปรับอากาศ AC-001',
  location: qrData.value?.location || 'ห้องประชุม A, อาคาร 1',
  type: 'Z1',
  priority: '1',
  description: ''
})

const typeOptions = [
  { value: 'Z1', label: 'Z1 - เสียหาย (Breakdown)' },
  { value: 'Z2', label: 'Z2 - ผิดปกติ (Malfunction)' }
]

const priorityOptions = [
  { value: '1', label: 'Priority 1 - วิกฤติ (ต้องแก้ไขทันที)' },
  { value: '2', label: 'Priority 2 - ด่วน (ภายใน 24 ชม.)' },
  { value: '3', label: 'Priority 3 - ปกติ (ภายใน 3 วัน)' },
  { value: '4', label: 'Priority 4 - ไม่ด่วน (ภายใน 7 วัน)' }
]

const handleSubmit = () => {
  // Basic validation
  if (!formData.value.type) {
    showError('กรุณาเลือกประเภทการแจ้งซ่อม')
    return
  }
  
  if (!formData.value.priority) {
    showError('กรุณาเลือกระดับความสำคัญ')
    return
  }
  
  if (!formData.value.description || formData.value.description.trim().length < 10) {
    showError('กรุณาระบุรายละเอียดปัญหาอย่างน้อย 10 ตัวอักษร')
    return
  }
  
  showSuccess('บันทึกข้อมูลเรียบร้อย')
  router.push('/requester/evidence-upload')
}
</script>
