<template>
  <div class="min-h-screen bg-slate-50">
    <LayoutMobileHeader title="จัดการอะไหล่" :show-back="true" />

    <div class="p-4 space-y-4 pb-24">
      <UiLoading v-if="loading" />

      <template v-else>
        <!-- Job Info Card -->
        <UiCard v-if="currentJob" class-name="p-4 bg-blue-100">
          <h3 class="text-[13px] font-bold text-slate-800 mb-1">{{ currentJob.notification_id }}</h3>
          <p class="text-[12px] text-slate-600">{{ currentJob.asset_name }}</p>
        </UiCard>

        <!-- Existing Parts -->
        <div v-if="existingParts.length > 0">
          <h3 class="text-[14px] font-bold text-slate-800 mb-3">อะไหล่ที่บันทึกแล้ว</h3>
          <div class="space-y-2 mb-4">
            <UiCard v-for="part in existingParts" :key="part.id" class-name="p-3 bg-green-50">
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
            <UiCard v-for="(part, index) in newParts" :key="index" class-name="p-4">
              <div class="space-y-3">
                <!-- Part Selection from parts_materials -->
                <div>
                  <label class="text-[12px] text-slate-600 mb-1 block">เลือกอะไหล่</label>
                  <div class="relative">
                    <input
                      v-model="part.searchText"
                      type="text"
                      placeholder="ค้นหาชื่อหรือรหัสอะไหล่..."
                      class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-[10px] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#00a6ff] focus:border-transparent"
                      @focus="part.showDropdown = true"
                      @input="filterParts(index)"
                    />
                    <!-- Dropdown -->
                    <div
                      v-if="part.showDropdown && part.filteredParts.length > 0"
                      class="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-[10px] shadow-lg max-h-[200px] overflow-y-auto"
                    >
                      <button
                        v-for="pm in part.filteredParts"
                        :key="pm.id"
                        type="button"
                        class="w-full px-4 py-3 text-left hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
                        @mousedown.prevent="selectPart(index, pm)"
                      >
                        <p class="text-[13px] font-bold text-slate-800">{{ pm.part_name }}</p>
                        <div class="flex items-center gap-2 mt-1">
                          <span class="text-[11px] text-slate-500">{{ pm.part_code || '-' }}</span>
                          <span class="text-[11px] text-slate-400">•</span>
                          <span class="text-[11px] text-slate-500">คงเหลือ: {{ pm.stock_quantity }} {{ pm.unit || 'ชิ้น' }}</span>
                          <span v-if="pm.unit_cost" class="text-[11px] text-slate-400">•</span>
                          <span v-if="pm.unit_cost" class="text-[11px] text-slate-500">฿{{ pm.unit_cost }}</span>
                        </div>
                      </button>
                    </div>
                  </div>
                  <!-- Selected part info -->
                  <div v-if="part.part_id" class="mt-2 px-3 py-2 bg-blue-50 rounded-[8px] flex items-center justify-between">
                    <div>
                      <p class="text-[12px] font-bold text-[#00a6ff]">{{ part.part_name }}</p>
                      <p class="text-[11px] text-slate-500">{{ part.part_no || '-' }} | คงเหลือ: {{ part.stock_qty }} {{ part.unit }}</p>
                    </div>
                    <button @click="clearPart(index)" class="text-slate-400 hover:text-red-500">
                      <Icon name="lucide:x" class="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="text-[12px] text-slate-600 mb-1 block">จำนวน</label>
                    <UiInput v-model.number="part.quantity" type="number" min="1" :max="part.stock_qty || 9999" placeholder="1" />
                  </div>
                  <div>
                    <label class="text-[12px] text-slate-600 mb-1 block">หน่วย</label>
                    <UiInput v-model="part.unit" placeholder="ชิ้น" :disabled="!!part.part_id" />
                  </div>
                </div>

                <div>
                  <label class="text-[12px] text-slate-600 mb-1 block">ราคาต่อหน่วย</label>
                  <UiInput v-model.number="part.unit_cost" type="number" min="0" step="0.01" placeholder="0.00" :disabled="!!part.part_id" />
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

          <button
            @click="addMorePart"
            class="w-full mt-3 py-3 border-2 border-dashed border-slate-300 rounded-[12px] text-[13px] text-slate-500 hover:border-[#00a6ff] hover:text-[#00a6ff] transition-colors"
          >
            + เพิ่มอะไหล่
          </button>
        </div>

        <UiButton variant="primary" size="large" full-width :disabled="!canSave || saving" @click="handleSave">
          {{ saving ? 'กำลังบันทึก...' : 'บันทึกอะไหล่' }}
        </UiButton>

        <button @click="handleSkip" class="w-full py-3 text-[13px] text-slate-500 hover:text-slate-700">
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
const api = useApi()

const jobId = computed(() => parseInt(route.params.id as string))
const saving = ref(false)
const existingParts = ref<any[]>([])
const allParts = ref<any[]>([])

interface NewPart {
  part_id: number | null
  part_name: string
  part_no: string
  quantity: number
  unit: string
  unit_cost: number | null
  stock_qty: number
  searchText: string
  showDropdown: boolean
  filteredParts: any[]
}

const createEmptyPart = (): NewPart => ({
  part_id: null,
  part_name: '',
  part_no: '',
  quantity: 1,
  unit: 'ชิ้น',
  unit_cost: null,
  stock_qty: 0,
  searchText: '',
  showDropdown: false,
  filteredParts: []
})

const newParts = ref<NewPart[]>([createEmptyPart()])

// Load parts_materials catalog
const loadPartsCatalog = async () => {
  try {
    const response = await api.get<any>('/parts')
    if (response.success && response.data) {
      allParts.value = response.data
    }
  } catch (error) {
    console.error('Failed to load parts catalog:', error)
  }
}

// Filter parts based on search text
const filterParts = (index: number) => {
  const part = newParts.value[index]
  const search = part.searchText.toLowerCase().trim()
  if (!search) {
    part.filteredParts = allParts.value.slice(0, 20)
  } else {
    part.filteredParts = allParts.value.filter(p =>
      p.part_name.toLowerCase().includes(search) ||
      (p.part_code && p.part_code.toLowerCase().includes(search))
    ).slice(0, 20)
  }
}

// Select a part from dropdown
const selectPart = (index: number, pm: any) => {
  const part = newParts.value[index]
  part.part_id = pm.id
  part.part_name = pm.part_name
  part.part_no = pm.part_code || ''
  part.unit = pm.unit || 'ชิ้น'
  part.unit_cost = pm.unit_cost
  part.stock_qty = pm.stock_quantity
  part.searchText = pm.part_name
  part.showDropdown = false
}

// Clear selected part
const clearPart = (index: number) => {
  const part = newParts.value[index]
  part.part_id = null
  part.part_name = ''
  part.part_no = ''
  part.unit = 'ชิ้น'
  part.unit_cost = null
  part.stock_qty = 0
  part.searchText = ''
}

onMounted(async () => {
  try {
    await Promise.all([
      getJobDetail(jobId.value),
      loadPartsCatalog()
    ])
    const response = await getParts(jobId.value)
    if (response.success && response.data) {
      existingParts.value = response.data
    }
  } catch (error) {
    console.error('Failed to load job:', error)
  }
})

// Close dropdown when clicking outside
if (import.meta.client) {
  document.addEventListener('click', () => {
    newParts.value.forEach(p => { p.showDropdown = false })
  })
}

const addMorePart = () => { newParts.value.push(createEmptyPart()) }
const removePart = (index: number) => { newParts.value.splice(index, 1) }

const canSave = computed(() => {
  return newParts.value.some(part => part.part_id && part.quantity > 0)
})

const handleSave = async () => {
  if (!canSave.value) {
    showError('กรุณาเลือกอะไหล่อย่างน้อย 1 รายการ')
    return
  }
  saving.value = true
  try {
    const validParts = newParts.value.filter(part => part.part_id && part.quantity > 0)
    await requestParts(jobId.value, {
      cm_history_id: jobId.value,
      parts: validParts.map(p => ({
        part_id: p.part_id!,
        part_name: p.part_name,
        part_no: p.part_no,
        quantity: p.quantity,
        unit: p.unit,
        unit_cost: p.unit_cost || undefined
      }))
    })
    setTimeout(() => { router.push(`/technician/worklog/${jobId.value}`) }, 800)
  } catch (error) {
    console.error('Failed to save parts:', error)
  } finally {
    saving.value = false
  }
}

const handleSkip = () => { router.push(`/technician/worklog/${jobId.value}`) }
</script>
