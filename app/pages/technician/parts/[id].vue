<template>
  <div class="min-h-screen bg-slate-50">
    <LayoutMobileHeader title="จัดการอะไหล่" :show-back="true" />

    <div class="p-4 space-y-4 pb-24">
      <!-- Loading State -->
      <UiLoading v-if="loading" />

      <template v-else>
        <!-- Job Info Card -->
        <UiCard v-if="currentJob" class-name="p-4 bg-blue-100">
          <h3 class="text-[13px] font-bold text-slate-800 mb-1">{{ currentJob.notification_id }}</h3>
          <p class="text-[12px] text-slate-600">{{ currentJob.asset_name }}</p>
        </UiCard>

        <!-- Existing Parts (if any) -->
        <div v-if="existingParts.length > 0">
          <h3 class="text-[14px] font-bold text-slate-800 mb-3">อะไหล่ที่บันทึกแล้ว</h3>
          <div class="space-y-2 mb-4">
            <UiCard
              v-for="part in existingParts"
              :key="part.id"
              class-name="p-3 bg-green-50"
            >
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <p class="text-[13px] font-bold text-slate-800">{{ part.part_name }}</p>
                  <p class="text-[11px] text-slate-500">รหัส: {{ part.part_no || '-' }}</p>
                </div>
                <div class="text-right">
                  <p class="text-[14px] font-bold text-slate-800">{{ part.quantity }} {{ part.unit }}</p>
                  <p v-if="part.total_cost" class="text-[11px] text-slate-500">
                    ฿{{ part.total_cost.toLocaleString() }}
                  </p>
                </div>
              </div>
            </UiCard>
          </div>
        </div>

        <!-- Add New Parts -->
        <div>
          <h3 class="text-[14px] font-bold text-slate-800 mb-3">เพิ่มอะไหล่</h3>
          <div class="space-y-3">
            <UiCard
              v-for="(part, index) in newParts"
              :key="index"
              class-name="p-4"
            >
              <div class="space-y-3">
                <div>
                  <label class="text-[12px] text-slate-600 mb-1 block">ชื่ออะไหล่</label>
                  <UiInput
                    v-model="part.part_name"
                    placeholder="เช่น มอเตอร์พัดลม"
                  />
                </div>

                <div>
                  <label class="text-[12px] text-slate-600 mb-1 block">รหัสอะไหล่ (ถ้ามี)</label>
                  <UiInput
                    v-model="part.part_no"
                    placeholder="เช่น MTR-001"
                  />
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="text-[12px] text-slate-600 mb-1 block">จำนวน</label>
                    <UiInput
                      v-model.number="part.quantity"
                      type="number"
                      min="1"
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <label class="text-[12px] text-slate-600 mb-1 block">หน่วย</label>
                    <UiInput
                      v-model="part.unit"
                      placeholder="ชิ้น"
                    />
                  </div>
                </div>

                <div>
                  <label class="text-[12px] text-slate-600 mb-1 block">ราคาต่อหน่วย (ถ้ามี)</label>
                  <UiInput
                    v-model.number="part.unit_cost"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>

                <button
                  v-if="newParts.length > 1"
                  @click="removePart(index)"
                  class="w-full mt-2 py-2 px-3 bg-red-50 hover:bg-red-100 border border-red-200 rounded-[10px] text-[13px] text-red-600 font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Icon name="lucide:trash-2" class="w-4 h-4" />
                  ลบรายการนี้
                </button>
              </div>
            </UiCard>
          </div>

          <!-- Add More Button -->
          <button
            @click="addMorePart"
            class="w-full mt-3 py-3 border-2 border-dashed border-slate-300 rounded-[12px] text-[13px] text-slate-500 hover:border-[#00a6ff] hover:text-[#00a6ff] transition-colors"
          >
            + เพิ่มอะไหล่
          </button>
        </div>

        <!-- Save Button -->
        <UiButton
          variant="primary"
          size="large"
          full-width
          :disabled="!canSave || saving"
          @click="handleSave"
        >
          {{ saving ? 'กำลังบันทึก...' : 'บันทึกอะไหล่' }}
        </UiButton>

        <!-- Skip Button -->
        <button
          @click="handleSkip"
          class="w-full py-3 text-[13px] text-slate-500 hover:text-slate-700"
        >
          ข้ามขั้นตอนนี้
        </button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const { getJobDetail, getParts, requestParts } = useTechnicianService()
const { currentJob, loading } = useTechnicianState()
const { success: showSuccess, error: showError } = useToast()

const jobId = computed(() => parseInt(route.params.id as string))
const saving = ref(false)
const existingParts = ref<any[]>([])

// New parts to add
const newParts = ref([
  {
    part_name: '',
    part_no: '',
    quantity: 1,
    unit: 'ชิ้น',
    unit_cost: null as number | null
  }
])

// Load job detail and existing parts
onMounted(async () => {
  try {
    await getJobDetail(jobId.value)
    
    // Load existing parts
    const response = await getParts(jobId.value)
    if (response.success && response.data) {
      existingParts.value = response.data
    }
  } catch (error) {
    console.error('Failed to load job:', error)
  }
})

const addMorePart = () => {
  newParts.value.push({
    part_name: '',
    part_no: '',
    quantity: 1,
    unit: 'ชิ้น',
    unit_cost: null
  })
}

const removePart = (index: number) => {
  newParts.value.splice(index, 1)
}

const canSave = computed(() => {
  return newParts.value.some(part => 
    part.part_name.trim() !== '' && part.quantity > 0
  )
})

const handleSave = async () => {
  if (!canSave.value) {
    showError('กรุณากรอกข้อมูลอะไหล่อย่างน้อย 1 รายการ')
    return
  }

  saving.value = true

  try {
    // Filter out empty parts
    const validParts = newParts.value.filter(part => 
      part.part_name.trim() !== '' && part.quantity > 0
    )

    await requestParts(jobId.value, {
      cm_history_id: jobId.value,
      parts: validParts
    })

    // Navigate back to worklog page
    setTimeout(() => {
      router.push(`/technician/worklog/${jobId.value}`)
    }, 800)
  } catch (error) {
    console.error('Failed to save parts:', error)
  } finally {
    saving.value = false
  }
}

const handleSkip = () => {
  router.push(`/technician/worklog/${jobId.value}`)
}
</script>
