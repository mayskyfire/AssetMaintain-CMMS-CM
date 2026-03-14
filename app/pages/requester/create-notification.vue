<template>
  <div class="min-h-screen bg-slate-50">
    <LayoutMobileHeader title="สร้างใบแจ้งซ่อม" :show-back="true" />

    <div class="p-4 space-y-4 pb-24">
      <!-- Equipment Info -->
      <UiCard class-name="p-4 bg-[#dbeafe]">
        <div class="flex items-start justify-between mb-2">
          <h3 class="text-[13px] font-bold text-slate-800">ข้อมูลอุปกรณ์</h3>
          <UiBadge v-if="route.query.asset_code" variant="success" size="small">
            <Icon name="lucide:qr-code" size="12" class="mr-1" />
            จาก QR
          </UiBadge>
        </div>
        <p class="text-[14px] font-bold text-[#00a6ff] mb-1">
          {{ formData.asset_name || 'กรุณาเลือกอุปกรณ์' }}
        </p>
        <div v-if="formData.location" class="flex items-start gap-1">
          <Icon name="lucide:map-pin" size="16" class="text-slate-500 shrink-0 mt-0.5" />
          <span class="text-[12px] text-slate-500">{{ formData.location }}</span>
        </div>
      </UiCard>

      <!-- Form -->
      <UiCard class-name="p-4 space-y-4">
        <UiSelect
          v-model="formData.priority"
          label="ระดับความสำคัญ"
          :options="priorityOptions"
          required
        />

        <UiSelect
          v-if="problemCategories.length > 0"
          v-model="formData.problem_category"
          label="หมวดหมู่ปัญหา (ถ้ามี)"
          :options="problemCategories"
        />

        <UiTextarea
          v-model="formData.problem_description"
          label="รายละเอียดปัญหา"
          placeholder="อธิบายอาการหรือปัญหาที่พบ..."
          :rows="5"
          required
        />
      </UiCard>

      <!-- Warning -->
      <UiCard v-if="formData.priority === 'critical' || formData.priority === 'high'" class-name="p-4 bg-[#fee2e2]">
        <div class="flex items-start gap-2">
          <Icon name="lucide:alert-circle" size="20" class="text-[#ef4444] shrink-0 mt-0.5" />
          <div>
            <h4 class="text-[13px] font-bold text-[#ef4444] mb-1">
              {{ formData.priority === 'critical' ? 'วิกฤติ - ต้องแก้ไขทันที' : 'ด่วน - ภายใน 24 ชม.' }}
            </h4>
            <p class="text-[12px] text-[#ef4444]/80">
              งานนี้จะได้รับการดำเนินการอย่างเร่งด่วน
            </p>
          </div>
        </div>
      </UiCard>

      <!-- Spare Parts Request -->
      <UiCard class-name="p-4 space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-[13px] font-bold text-slate-800">ขออะไหล่ (ถ้าต้องการ)</h3>
          <button
            v-if="spareParts.length === 0"
            @click="addSparePart"
            class="text-[12px] text-[#00a6ff] font-bold"
          >
            + เพิ่มอะไหล่
          </button>
        </div>

        <div v-if="spareParts.length > 0" class="space-y-3">
          <div v-for="(sp, index) in spareParts" :key="index" class="bg-slate-50 rounded-[8px] p-3 space-y-2">
            <!-- Part search -->
            <div class="relative">
              <input
                v-model="sp.searchText"
                type="text"
                placeholder="ค้นหาอะไหล่..."
                class="w-full px-3 py-2 bg-white border border-slate-200 rounded-[8px] text-[13px] focus:outline-none focus:ring-2 focus:ring-[#00a6ff]"
                @focus="sp.showDropdown = true"
                @input="filterSpareParts(index)"
              />
              <div
                v-if="sp.showDropdown && sp.filteredParts.length > 0"
                class="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-[8px] shadow-lg max-h-[160px] overflow-y-auto"
              >
                <button
                  v-for="pm in sp.filteredParts"
                  :key="pm.id"
                  type="button"
                  class="w-full px-3 py-2 text-left hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
                  @mousedown.prevent="selectSparePart(index, pm)"
                >
                  <p class="text-[12px] font-bold text-slate-800">{{ pm.part_name }}</p>
                  <p class="text-[11px] text-slate-500">{{ pm.part_code || '-' }} | คงเหลือ: {{ pm.stock_quantity }}</p>
                </button>
              </div>
            </div>
            <!-- Selected info -->
            <div v-if="sp.part_id" class="flex items-center justify-between bg-blue-50 rounded-[6px] px-2 py-1">
              <span class="text-[11px] text-[#00a6ff]">{{ sp.part_name }}</span>
              <button @click="clearSparePart(index)" class="text-slate-400 hover:text-red-500">
                <Icon name="lucide:x" class="w-3 h-3" />
              </button>
            </div>
            <!-- Quantity -->
            <div class="flex items-center gap-2">
              <label class="text-[11px] text-slate-600 shrink-0">จำนวน:</label>
              <input
                v-model.number="sp.quantity"
                type="number"
                min="1"
                class="w-20 px-2 py-1 bg-white border border-slate-200 rounded-[6px] text-[13px] text-center"
              />
              <span class="text-[11px] text-slate-500">{{ sp.unit || 'ชิ้น' }}</span>
              <button @click="removeSparePart(index)" class="ml-auto text-red-400 hover:text-red-600">
                <Icon name="lucide:trash-2" class="w-4 h-4" />
              </button>
            </div>
          </div>

          <button
            @click="addSparePart"
            class="w-full py-2 border border-dashed border-slate-300 rounded-[8px] text-[12px] text-slate-500 hover:border-[#00a6ff] hover:text-[#00a6ff]"
          >
            + เพิ่มอะไหล่อีก
          </button>
        </div>
      </UiCard>

      <UiButton
        variant="primary"
        size="large"
        full-width
        :disabled="!canSubmit || submitting"
        @click="handleSubmit"
      >
        {{ submitting ? 'กำลังบันทึก...' : 'ถัดไป: อัปโหลดหลักฐาน' }}
      </UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Priority } from '~/types/database'

const router = useRouter()
const route = useRoute()
const { success: showSuccess, error: showError } = useToast()
const { createNotification } = useNotificationService()
const { isOnline } = useNetworkStatus()
const { saveDraft, getDraft, removeDraft, addToQueue } = useOfflineStorage()
const { user } = useAuth()

const submitting = ref(false)

// Spare parts catalog and selection
const allPartsCatalog = ref<any[]>([])

interface SparePartEntry {
  part_id: number | null
  part_name: string
  quantity: number
  unit: string
  searchText: string
  showDropdown: boolean
  filteredParts: any[]
}

const spareParts = ref<SparePartEntry[]>([])

const loadPartsCatalog = async () => {
  try {
    const api = useApi()
    const response = await api.get<any>('/parts')
    if (response.success && response.data) {
      allPartsCatalog.value = response.data
    }
  } catch (error) {
    console.error('Failed to load parts catalog:', error)
  }
}

const addSparePart = () => {
  spareParts.value.push({
    part_id: null, part_name: '', quantity: 1, unit: 'ชิ้น',
    searchText: '', showDropdown: false, filteredParts: []
  })
}

const removeSparePart = (index: number) => { spareParts.value.splice(index, 1) }

const filterSpareParts = (index: number) => {
  const sp = spareParts.value[index]
  const search = sp.searchText.toLowerCase().trim()
  if (!search) {
    sp.filteredParts = allPartsCatalog.value.slice(0, 15)
  } else {
    sp.filteredParts = allPartsCatalog.value.filter(p =>
      p.part_name.toLowerCase().includes(search) ||
      (p.part_code && p.part_code.toLowerCase().includes(search))
    ).slice(0, 15)
  }
}

const selectSparePart = (index: number, pm: any) => {
  const sp = spareParts.value[index]
  sp.part_id = pm.id
  sp.part_name = pm.part_name
  sp.unit = pm.unit || 'ชิ้น'
  sp.searchText = pm.part_name
  sp.showDropdown = false
}

const clearSparePart = (index: number) => {
  const sp = spareParts.value[index]
  sp.part_id = null
  sp.part_name = ''
  sp.unit = 'ชิ้น'
  sp.searchText = ''
}

// Initialize form data from query params (from QR scan)
const formData = ref({
  asset_id: Number(route.query.asset_id) || 0,
  asset_code: (route.query.asset_code as string) || '',
  asset_name: (route.query.asset_name as string) || '',
  location: (route.query.location as string) || '',
  priority: 'medium' as Priority,
  problem_category: '',
  problem_description: '',
  photos: [] as string[]
})

const priorityOptions = [
  { value: 'critical', label: 'วิกฤติ - ต้องแก้ไขทันที' },
  { value: 'high', label: 'ด่วน - ภายใน 24 ชม.' },
  { value: 'medium', label: 'ปกติ - ภายใน 3 วัน' },
  { value: 'low', label: 'ไม่ด่วน - ภายใน 7 วัน' }
]

const problemCategories = [
  { value: 'electrical', label: 'ไฟฟ้า' },
  { value: 'mechanical', label: 'เครื่องกล' },
  { value: 'plumbing', label: 'ประปา' },
  { value: 'hvac', label: 'ระบบปรับอากาศ' },
  { value: 'other', label: 'อื่นๆ' }
]

// Auto-save draft
const draftKey = 'create-notification'

// Restore draft on mount (only if not from QR)
onMounted(async () => {
  await loadPartsCatalog()
  if (!route.query.asset_id) {
    const draft = await getDraft<typeof formData.value>(draftKey)
    if (draft) {
      formData.value = { ...formData.value, ...draft }
    }
  }
})

// Auto-save draft on change
watch(formData, async (val) => {
  await saveDraft(draftKey, toRaw(val))
}, { deep: true })

// Validation
const canSubmit = computed(() => {
  return formData.value.asset_id > 0 &&
         formData.value.problem_description.trim().length >= 10
})

const handleSubmit = async () => {
  // Validation
  if (!formData.value.asset_id) {
    showError('กรุณาเลือกอุปกรณ์')
    return
  }
  
  if (!formData.value.problem_description || formData.value.problem_description.trim().length < 10) {
    showError('กรุณาระบุรายละเอียดปัญหาอย่างน้อย 10 ตัวอักษร')
    return
  }

  submitting.value = true

  try {
    // If offline, save to queue
    if (!isOnline.value) {
      await addToQueue({
        type: 'notification',
        title: `แจ้งซ่อม: ${formData.value.asset_name}`,
        description: formData.value.problem_description.slice(0, 100),
        data: {
          asset_id: formData.value.asset_id,
          problem_description: formData.value.problem_description,
          priority: formData.value.priority,
          problem_category: formData.value.problem_category || undefined
        },
        photos: formData.value.photos
      })
      await removeDraft(draftKey)
      showSuccess('บันทึกลงคิวออฟไลน์แล้ว')
      
      // Navigate to evidence-upload with offline data
      router.push({
        path: '/requester/evidence-upload',
        query: {
          offline: 'true',
          notification_id: 'OFFLINE-' + Date.now(),
          asset_name: formData.value.asset_name,
          problem_category: formData.value.problem_category,
          priority: formData.value.priority
        }
      })
      return
    }

    // If online, send to API
    const validSpareParts = spareParts.value.filter(sp => sp.part_id && sp.quantity > 0)
    
    const response = await createNotification({
      asset_id: formData.value.asset_id,
      asset_code: formData.value.asset_code,
      problem_description: formData.value.problem_description,
      priority: formData.value.priority,
      problem_category: formData.value.problem_category || undefined,
      photos: formData.value.photos,
      requester_id: user.value?.id || 1,
      spare_parts: validSpareParts.length > 0 ? validSpareParts.map(sp => ({
        part_id: sp.part_id!,
        quantity: sp.quantity
      })) : undefined
    })

    await removeDraft(draftKey)
    showSuccess('สร้างใบแจ้งซ่อมสำเร็จ')
    
    // Navigate to evidence-upload with notification data
    if (response.success && response.data) {
      router.push({
        path: '/requester/evidence-upload',
        query: {
          notification_id: response.data.notification_id,
          cm_history_id: response.data.id.toString(),
          asset_name: formData.value.asset_name,
          problem_category: formData.value.problem_category,
          priority: formData.value.priority
        }
      })
    } else {
      router.push('/requester/evidence-upload')
    }
  } catch (err: any) {
    showError(err.message || 'สร้างใบแจ้งซ่อมไม่สำเร็จ')
  } finally {
    submitting.value = false
  }
}
</script>
