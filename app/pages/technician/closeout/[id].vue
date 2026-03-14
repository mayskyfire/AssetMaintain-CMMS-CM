<template>
  <div class="min-h-screen bg-slate-50">
    <LayoutMobileHeader title="ปิดงานซ่อม" :show-back="true" />

    <div class="p-4 space-y-4 pb-24">
      <!-- Job Info Card -->
      <UiCard class-name="p-4 bg-blue-100">
        <span class="text-[13px] font-bold text-[#00a6ff]">{{ notificationId || jobId }}</span>
        <h2 class="text-[14px] font-bold text-slate-800 mt-1">{{ assetName }}</h2>
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

      <!-- Warning if no worklog data -->
      <UiCard v-if="elapsedSeconds === 0" class-name="p-4 bg-amber-50 border-amber-200">
        <div class="flex items-start gap-3">
          <Icon name="lucide:alert-circle" class="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p class="text-[13px] font-bold text-amber-800">ไม่พบข้อมูล Worklog</p>
            <p class="text-[12px] text-amber-700 mt-1">
              กรุณาบันทึกเวลาการทำงานในหน้า Worklog ก่อนปิดงาน
            </p>
          </div>
        </div>
      </UiCard>

      <!-- Summary Card -->
      <UiCard class-name="p-4">
        <UiTextarea
          label="สรุปผลการซ่อม"
          placeholder="ระบุสาเหตุของปัญหาและวิธีแก้ไข..."
          v-model="summary"
          :rows="5"
          required
        />
        <p v-if="elapsedSeconds > 0" class="text-[11px] text-slate-500 mt-2">
          <Icon name="lucide:info" class="w-3 h-3 inline mr-1" />
          บันทึกจาก worklog: {{ formattedWorkTime }}
        </p>
      </UiCard>

      <!-- Cost & Time Card -->
      <UiCard class-name="p-4">
        <h3 class="text-[13px] font-bold text-slate-800 mb-3">ข้อมูลเวลาและค่าใช้จ่าย</h3>
        
        <div class="space-y-3">
          <!-- Labor Hours (Auto-calculated from worklog) -->
          <div>
            <label class="block text-[12px] text-slate-600 mb-1">
              เวลาการซ่อม (ชม.)
            </label>
            <div class="relative">
              <input
                :value="laborHours.toFixed(2)"
                type="text"
                disabled
                class="w-full px-3 py-2 border border-slate-200 rounded-lg text-[13px] bg-slate-50 text-slate-700 font-medium"
              />
              <div class="absolute right-3 top-1/2 -translate-y-1/2">
                <Icon name="lucide:clock" class="w-4 h-4 text-slate-400" />
              </div>
            </div>
            <p class="text-[11px] text-slate-500 mt-1">
              คำนวณจาก worklog: {{ formattedWorkTime }}
            </p>
          </div>

          <!-- Downtime Hours -->
          <div>
            <label class="block text-[12px] text-slate-600 mb-1">
              เวลาหยุดการซ่อม (ชม.) <span class="text-red-500">*</span>
            </label>
            <input
              v-model.number="downtimeHours"
              type="number"
              step="0.1"
              min="0"
              placeholder="0.0"
              class="w-full px-3 py-2 border border-slate-300 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#00a6ff]"
              required
            />
            <p class="text-[11px] text-slate-500 mt-1">เวลาที่เครื่องหยุดทำงาน</p>
          </div>

          <!-- Labor Cost -->
          <div>
            <label class="block text-[12px] text-slate-600 mb-1">
              ค่าแรง (บาท)
            </label>
            <input
              v-model.number="laborCost"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              class="w-full px-3 py-2 border border-slate-300 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#00a6ff]"
            />
          </div>

          <!-- External Cost -->
          <div>
            <label class="block text-[12px] text-slate-600 mb-1">
              ค่าใช้จ่ายภายนอก (บาท)
            </label>
            <input
              v-model.number="externalCost"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              class="w-full px-3 py-2 border border-slate-300 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#00a6ff]"
            />
            <p class="text-[11px] text-slate-500 mt-1">เช่น ค่าจ้างภายนอก, ค่าขนส่ง</p>
          </div>
        </div>
      </UiCard>

      <!-- Photos Card -->
      <UiCard class-name="p-4">
        <h3 class="text-[13px] font-bold text-slate-800 mb-3">รูปภาพหลังซ่อม</h3>
        
        <!-- Photo Grid -->
        <div v-if="photos.length > 0" class="grid grid-cols-3 gap-2 mb-3">
          <div
            v-for="(photo, index) in photos"
            :key="photo.id"
            class="relative aspect-square"
          >
            <img
              :src="photo.preview"
              :alt="`After repair ${index + 1}`"
              class="w-full h-full object-cover rounded-[10px]"
            />
            <button
              @click="handleRemovePhoto(index)"
              class="absolute -top-2 -right-2 w-6 h-6 bg-[#ff3b30] rounded-full flex items-center justify-center shadow-lg"
            >
              <Icon name="lucide:x" class="w-4 h-4 text-white" />
            </button>
            <div v-if="photo.compressed" class="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 rounded text-[9px] text-white">
              Compressed
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="isProcessing" class="flex items-center justify-center py-4">
          <UiLoading size="small" message="กำลังประมวลผลรูปภาพ..." />
        </div>

        <!-- Hidden File Input (Gallery only) -->
        <input
          ref="galleryInputRef"
          type="file"
          accept="image/*"
          multiple
          @change="handleFileChange"
          class="hidden"
        />

        <UiButton
          variant="secondary"
          size="medium"
          full-width
          :disabled="isProcessing"
          @click="showPhotoOptions = true"
        >
          <Icon name="lucide:camera" class="w-5 h-5 mr-2" />
          {{ isProcessing ? 'กำลังประมวลผล...' : `ถ่ายรูปหลักฐาน (${photos.length})` }}
        </UiButton>
      </UiCard>

      <!-- Signature Card -->
      <UiCard class-name="p-4">
        <h3 class="text-[13px] font-bold text-slate-800 mb-3">ลายเซ็นผู้ดูแล</h3>
        <UiSignaturePad v-model="signature" />
      </UiCard>

      <!-- Complete Button -->
      <UiButton
        variant="success"
        size="large"
        full-width
        :disabled="!summary || !signature || !downtimeHours"
        @click="handleCompleteClick"
      >
        ยืนยันปิดงาน
      </UiButton>
    </div>

    <!-- Camera Capture -->
    <UiCameraCapture
      :is-open="showCamera"
      @close="showCamera = false"
      @capture="handleCameraCapture"
      @open-gallery="handleCameraOpenGallery"
    />

    <!-- Photo Options Modal (Bottom Sheet) -->
    <Teleport to="body">
      <Transition name="sheet">
        <div
          v-if="showPhotoOptions"
          class="fixed inset-0 z-50 flex items-end justify-center"
          @click.self="showPhotoOptions = false"
        >
          <div class="absolute inset-0 bg-black/50" @click="showPhotoOptions = false" />
          <div class="relative bg-white rounded-t-[20px] w-full max-w-md p-6 pb-8 space-y-4">
            <div class="flex justify-center mb-2">
              <div class="w-10 h-1 bg-slate-300 rounded-full" />
            </div>

            <h3 class="text-[16px] font-bold text-slate-800 text-center">เลือกวิธีเพิ่มรูปภาพ</h3>

            <button
              @click="openCamera"
              class="w-full p-4 bg-slate-50 rounded-xl flex items-center gap-4 active:bg-slate-100 transition-colors"
            >
              <div class="w-12 h-12 bg-[#00a6ff] rounded-full flex items-center justify-center shrink-0">
                <Icon name="lucide:camera" class="w-6 h-6 text-white" />
              </div>
              <div class="flex-1 text-left">
                <p class="text-[14px] font-bold text-slate-800">ถ่ายรูป</p>
                <p class="text-[12px] text-slate-500">เปิดกล้องถ่ายรูปใหม่</p>
              </div>
              <Icon name="lucide:chevron-right" class="w-5 h-5 text-slate-400" />
            </button>

            <button
              @click="openGallery"
              class="w-full p-4 bg-slate-50 rounded-xl flex items-center gap-4 active:bg-slate-100 transition-colors"
            >
              <div class="w-12 h-12 bg-[#6dd400] rounded-full flex items-center justify-center shrink-0">
                <Icon name="lucide:image" class="w-6 h-6 text-white" />
              </div>
              <div class="flex-1 text-left">
                <p class="text-[14px] font-bold text-slate-800">เลือกจากคลัง</p>
                <p class="text-[12px] text-slate-500">เลือกรูปที่มีอยู่แล้ว (เลือกได้หลายรูป)</p>
              </div>
              <Icon name="lucide:chevron-right" class="w-5 h-5 text-slate-400" />
            </button>

            <button
              @click="showPhotoOptions = false"
              class="w-full py-3 text-[14px] font-bold text-slate-500 active:text-slate-700 transition-colors"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Confirmation Modal -->
    <UiModal
      :is-open="showConfirmModal"
      title="ยืนยันปิดงาน"
      :message="`คุณต้องการปิดงานซ่อม ${notificationId || jobId} ใช่หรือไม่? งานที่ปิดแล้วจะไม่สามารถแก้ไขได้`"
      confirm-text="ยืนยันปิดงาน"
      cancel-text="ยกเลิก"
      confirm-variant="success"
      @close="showConfirmModal = false"
      @confirm="handleConfirmComplete"
    >
      <template #icon>
        <Icon name="lucide:check-circle" class="w-16 h-16 text-[#6dd400]" />
      </template>
    </UiModal>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()

const jobId = computed(() => route.params.id as string)
const notificationId = ref<string>('')
const assetName = ref<string>('กำลังโหลด...')
const summary = ref('')
const downtimeHours = ref<number>(0)
const laborCost = ref<number>(0)
const externalCost = ref<number>(0)
const signature = ref<string | null>(null)
const showConfirmModal = ref(false)
const showPhotoOptions = ref(false)
const showCamera = ref(false)
const galleryInputRef = ref<HTMLInputElement | null>(null)
const elapsedSeconds = ref(0)
const isLoadingJob = ref(true)

const laborHours = computed(() => {
  return Math.round((elapsedSeconds.value / 3600) * 100) / 100
})

const formattedWorkTime = computed(() => {
  const hours = Math.floor(elapsedSeconds.value / 3600)
  const minutes = Math.floor((elapsedSeconds.value % 3600) / 60)
  const seconds = elapsedSeconds.value % 60
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})

const spareApproval = ref<any>(null)

const { getJobDetail } = useTechnicianService()

const loadSpareApproval = async () => {
  try {
    const api = useApi()
    const response = await api.get<any>('/cm/spare-approvals', { status: 'all' })
    if (response.success && response.data) {
      spareApproval.value = response.data.find((a: any) => a.cm_history_id === Number(jobId.value)) || null
    }
  } catch (error) {
    // ไม่มี spare approval ก็ไม่เป็นไร
  }
}

// Load job details
const loadJobDetails = async () => {
  try {
    isLoadingJob.value = true
    
    const response = await getJobDetail(Number(jobId.value))
    
    if (response.success && response.data) {
      notificationId.value = response.data.notification_id || `CM-${jobId.value}`
      assetName.value = response.data.asset_name || 'ไม่ระบุ'
    }
  } catch (error) {
    console.error('Failed to load job details:', error)
    notificationId.value = `CM-${jobId.value}`
    assetName.value = 'ไม่สามารถโหลดข้อมูลได้'
  } finally {
    isLoadingJob.value = false
  }
}

// Load worklog data from localStorage
onMounted(async () => {
  await loadJobDetails()
  await loadSpareApproval()
  
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(`worklog_${jobId.value}`)
      if (saved) {
        const data = JSON.parse(saved)
        summary.value = data.notes || ''
        elapsedSeconds.value = data.elapsedSeconds || 0
        
        console.log('Loaded worklog data:', {
          notes: summary.value,
          elapsedSeconds: elapsedSeconds.value,
          laborHours: laborHours.value
        })
      } else {
        console.warn('No worklog data found in localStorage')
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error)
    }
  }
})

const { photos, isProcessing, error, processFiles, removePhotoByIndex } = usePhotoUpload({
  maxSizeMB: 5,
  maxWidthOrHeight: 1920,
  quality: 0.8,
  maxFiles: 10
})

const { success: showSuccess, error: showError } = useToast()
const { isOnline } = useNetworkStatus()
const { addToQueue } = useOfflineStorage()

const openCamera = () => {
  showPhotoOptions.value = false
  showCamera.value = true
}

const openGallery = () => {
  showPhotoOptions.value = false
  galleryInputRef.value?.click()
}

const handleCameraCapture = async (file: File) => {
  await processFiles([file])
  
  if (error.value) {
    showError(error.value)
  } else {
    showSuccess('ถ่ายรูปสำเร็จ')
  }
}

const handleCameraOpenGallery = () => {
  showCamera.value = false
  openGallery()
}

const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (!files || files.length === 0) return

  await processFiles(files)

  if (error.value) {
    showError(error.value)
  } else {
    showSuccess(`อัพโหลดรูปภาพสำเร็จ ${files.length} รูป`)
  }

  target.value = ''
}

const handleRemovePhoto = (index: number) => {
  removePhotoByIndex(index)
  showSuccess('ลบรูปภาพแล้ว')
}

const handleCompleteClick = () => {
  showConfirmModal.value = true
}

const handleConfirmComplete = async () => {
  showConfirmModal.value = false

  const closeoutData = {
    cm_history_id: Number(jobId.value),
    root_cause: summary.value,
    corrective_action: summary.value,
    preventive_recommendation: '',
    downtime_hours: downtimeHours.value,
    labor_hours: laborHours.value,
    labor_cost: laborCost.value || undefined,
    external_cost: externalCost.value || undefined,
    completion_date: new Date().toISOString(),
    completed_by: 'Current Technician', // Get from useAuth().user
    signature: signature.value || '',
    photos: photos.value.map(p => p.preview)
  }

  // If offline, save to queue
  if (!isOnline.value) {
    await addToQueue({
      type: 'closeout',
      title: `ปิดงาน: ${jobId.value}`,
      description: summary.value.slice(0, 100),
      data: closeoutData,
      photos: photos.value.map(p => p.preview),
      signature: signature.value || undefined
    })
    showSuccess('บันทึกลงคิวออฟไลน์แล้ว')
    // Clear localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(`worklog_${jobId.value}`)
      } catch (error) {
        console.error('Error removing from localStorage:', error)
      }
    }
    setTimeout(() => router.push('/technician/jobs'), 1000)
    return
  }

  // If online, send to API
  try {
    const { closeoutJob } = useTechnicianService()
    const { uploadBase64Image } = useImageUpload()
    
    // Upload photos first if any
    const uploadedPhotoUrls: string[] = []
    if (photos.value.length > 0) {
      for (const photo of photos.value) {
        const uploaded = await uploadBase64Image(
          Number(jobId.value),
          'after',
          photo.preview,
          photo.file?.name || `after-${Date.now()}.jpg`
        )
        uploadedPhotoUrls.push(uploaded.path)
      }
    }
    
    // Update closeout data with uploaded photo URLs
    closeoutData.photos = uploadedPhotoUrls
    
    // Closeout job (signature จะถูกอัพโหลดใน API)
    await closeoutJob(Number(jobId.value), closeoutData)
    
    showSuccess('ปิดงานสำเร็จ')
    
    // Clear localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(`worklog_${jobId.value}`)
      } catch (error) {
        console.error('Error removing from localStorage:', error)
      }
    }
    setTimeout(() => {
      router.push('/technician/jobs')
    }, 1000)
  } catch (error) {
    console.error('Failed to closeout job:', error)
    showError('ไม่สามารถปิดงานได้ กรุณาลองใหม่อีกครั้ง')
  }
}
</script>

<style scoped>
.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.25s ease;
}
.sheet-enter-active .relative,
.sheet-leave-active .relative {
  transition: transform 0.25s ease;
}
.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}
.sheet-enter-from .relative,
.sheet-leave-to .relative {
  transform: translateY(100%);
}
</style>
