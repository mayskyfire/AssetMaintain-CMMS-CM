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

const submitting = ref(false)

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
    const response = await createNotification({
      asset_id: formData.value.asset_id,
      asset_code: formData.value.asset_code,
      problem_description: formData.value.problem_description,
      priority: formData.value.priority,
      problem_category: formData.value.problem_category || undefined,
      photos: formData.value.photos
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
