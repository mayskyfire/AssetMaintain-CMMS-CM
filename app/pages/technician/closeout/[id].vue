<template>
  <div class="min-h-screen bg-slate-50">
    <LayoutMobileHeader title="ปิดงานซ่อม" :show-back="true" />

    <div class="p-4 space-y-4 pb-24">
      <!-- Job Info Card -->
      <UiCard class-name="p-4 bg-blue-100">
        <span class="text-[13px] font-bold text-[#00a6ff]">{{ jobId }}</span>
        <h2 class="text-[14px] font-bold text-slate-800 mt-1">เครื่องปรับอากาศ AC-02</h2>
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
        :disabled="!summary || !signature"
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
      :message="`คุณต้องการปิดงานซ่อม ${jobId} ใช่หรือไม่? งานที่ปิดแล้วจะไม่สามารถแก้ไขได้`"
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
const summary = ref('')
const signature = ref<string | null>(null)
const showConfirmModal = ref(false)
const showPhotoOptions = ref(false)
const showCamera = ref(false)
const galleryInputRef = ref<HTMLInputElement | null>(null)
const elapsedSeconds = ref(0)

// Load worklog data from localStorage
onMounted(() => {
  const saved = localStorage.getItem(`worklog_${jobId.value}`)
  if (saved) {
    const data = JSON.parse(saved)
    summary.value = data.notes || ''
    elapsedSeconds.value = data.elapsedSeconds || 0
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

  const laborHours = Math.round((elapsedSeconds.value / 3600) * 10) / 10

  const closeoutData = {
    cm_history_id: Number(jobId.value),
    root_cause: summary.value,
    corrective_action: summary.value,
    preventive_recommendation: '',
    labor_hours: laborHours,
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
      photos: photos.value.map(p => p.preview)
    })
    showSuccess('บันทึกลงคิวออฟไลน์แล้ว')
    // Clear localStorage
    localStorage.removeItem(`worklog_${jobId.value}`)
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
    
    await closeoutJob(Number(jobId.value), closeoutData)
    // Clear localStorage
    localStorage.removeItem(`worklog_${jobId.value}`)
    setTimeout(() => {
      router.push('/technician/jobs')
    }, 1000)
  } catch (error) {
    console.error('Failed to closeout job:', error)
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
