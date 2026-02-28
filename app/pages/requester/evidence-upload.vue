<template>
  <div class="min-h-screen bg-slate-50">
    <LayoutMobileHeader title="อัปโหลดหลักฐาน" :show-back="true" />

    <div class="p-4 space-y-4 pb-24">
      <UiCard class-name="p-4">
        <h3 class="text-[14px] font-bold text-slate-800 mb-2">
          รูปภาพหลักฐาน
        </h3>
        <p class="text-[12px] text-slate-500 mb-4">
          ถ่ายรูปอุปกรณ์ที่มีปัญหาหรืออาการผิดปกติ (แนะนำ 2-3 รูป)
        </p>

        <!-- Photo Grid -->
        <div v-if="photos.length > 0" class="grid grid-cols-3 gap-2 mb-4">
          <div
            v-for="photo in photos"
            :key="photo.id"
            class="relative aspect-square"
          >
            <img
              :src="photo.preview"
              :alt="photo.name"
              class="w-full h-full object-cover rounded-[10px]"
            />
            <!-- Compressed Badge -->
            <div
              v-if="photo.compressed"
              class="absolute top-2 left-2 px-2 py-0.5 bg-[#6dd400] rounded-full"
            >
              <span class="text-[10px] font-bold text-white">
                -{{ photo.compressionPercent }}%
              </span>
            </div>
            <!-- Remove Button -->
            <button
              @click="removePhoto(photo.id)"
              class="absolute -top-2 -right-2 w-6 h-6 bg-[#ef4444] rounded-full flex items-center justify-center shadow-lg"
            >
              <Icon name="lucide:x" size="16" class="text-white" />
            </button>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="isProcessing" class="flex items-center justify-center py-8">
          <UiLoading size="medium" />
          <span class="ml-3 text-[14px] text-slate-600">กำลังประมวลผลรูปภาพ...</span>
        </div>

        <!-- Hidden File Input (Gallery Only) -->
        <input
          ref="galleryInputRef"
          type="file"
          accept="image/*"
          multiple
          class="hidden"
          @change="handleFileChange"
        />

        <!-- Upload Button -->
        <UiButton
          variant="secondary"
          size="medium"
          full-width
          icon="lucide:camera"
          @click="showPhotoOptions = true"
          :disabled="isProcessing"
        >
          {{ isProcessing ? 'กำลังประมวลผล...' : 'ถ่ายรูป / เลือกจากคลัง' }}
        </UiButton>
      </UiCard>

      <!-- Info -->
      <UiCard class-name="p-4 bg-[#dbeafe]">
        <h4 class="text-[13px] font-bold text-slate-800 mb-2">
          เคล็ดลับการถ่ายรูป
        </h4>
        <ul class="text-[12px] text-slate-600 space-y-1 list-disc list-inside">
          <li>ถ่ายให้เห็นป้ายอุปกรณ์ชัดเจน</li>
          <li>ถ่ายส่วนที่มีปัญหาหรือชำรุด</li>
          <li>ถ่ายมุมกว้างเพื่อแสดงตำแหน่งโดยรวม</li>
        </ul>
      </UiCard>

      <!-- Actions -->
      <div class="space-y-3">
        <UiButton
          variant="primary"
          size="large"
          full-width
          :disabled="isProcessing || uploading"
          @click="handleSubmitClick"
        >
          {{ uploading ? 'กำลังอัพโหลด...' : photos.length > 0 ? `ส่งใบแจ้งซ่อม (${photos.length} รูป)` : 'ส่งใบแจ้งซ่อม' }}
        </UiButton>

        <button
          @click="handleSubmitClick"
          :disabled="uploading"
          class="w-full py-3 text-[14px] text-slate-600 hover:text-slate-800 transition-colors disabled:opacity-50"
        >
          ข้ามขั้นตอนนี้
        </button>
      </div>
    </div>

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
                <Icon name="lucide:camera" size="24" class="text-white" />
              </div>
              <div class="flex-1 text-left">
                <p class="text-[14px] font-bold text-slate-800">ถ่ายรูป</p>
                <p class="text-[12px] text-slate-500">เปิดกล้องถ่ายรูปใหม่</p>
              </div>
              <Icon name="lucide:chevron-right" size="20" class="text-slate-400" />
            </button>

            <button
              @click="openGallery"
              class="w-full p-4 bg-slate-50 rounded-xl flex items-center gap-4 active:bg-slate-100 transition-colors"
            >
              <div class="w-12 h-12 bg-[#6dd400] rounded-full flex items-center justify-center shrink-0">
                <Icon name="lucide:image" size="24" class="text-white" />
              </div>
              <div class="flex-1 text-left">
                <p class="text-[14px] font-bold text-slate-800">เลือกจากคลัง</p>
                <p class="text-[12px] text-slate-500">เลือกรูปที่มีอยู่แล้ว (เลือกได้หลายรูป)</p>
              </div>
              <Icon name="lucide:chevron-right" size="20" class="text-slate-400" />
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

    <!-- Camera Capture -->
    <UiCameraCapture
      :is-open="showCamera"
      @close="showCamera = false"
      @capture="handleCameraCapture"
      @open-gallery="handleCameraOpenGallery"
    />

    <!-- Confirmation Modal -->
    <UiModal
      :is-open="showConfirmModal"
      title="ยืนยันส่งใบแจ้งซ่อม"
      :message="`คุณต้องการส่งใบแจ้งซ่อมพร้อมรูปภาพ ${photos.length} รูปใช่หรือไม่?`"
      confirm-text="ส่งใบแจ้งซ่อม"
      cancel-text="ยกเลิก"
      confirm-variant="primary"
      @close="showConfirmModal = false"
      @confirm="handleConfirmSubmit"
    >
      <template #icon>
        <Icon name="lucide:send" size="64" class="text-[#00a6ff]" />
      </template>
    </UiModal>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const route = useRoute()
const galleryInputRef = ref<HTMLInputElement | null>(null)
const showConfirmModal = ref(false)
const showPhotoOptions = ref(false)
const showCamera = ref(false)
const uploading = ref(false)

const { photos, isProcessing, error, processFiles, removePhotoByIndex } = usePhotoUpload({
  maxSizeMB: 5,
  maxWidthOrHeight: 1920,
  quality: 0.8,
  maxFiles: 10
})

const { success: showSuccess, error: showError } = useToast()

// Get notification data from query
const notificationData = computed(() => ({
  notification_id: route.query.notification_id as string,
  cm_history_id: route.query.cm_history_id ? parseInt(route.query.cm_history_id as string) : null,
  asset_name: route.query.asset_name as string,
  problem_category: route.query.problem_category as string,
  priority: route.query.priority as string,
  offline: route.query.offline === 'true'
}))

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

const removePhoto = (id: string) => {
  const photo = photos.value.find(p => p.id === id)
  if (photo) {
    removePhotoByIndex(photos.value.indexOf(photo))
    showSuccess('ลบรูปภาพแล้ว')
  }
}

const handleSubmitClick = () => {
  if (photos.value.length === 0) {
    // Skip to success page if no photos
    navigateToSuccess()
  } else {
    showConfirmModal.value = true
  }
}

const handleConfirmSubmit = async () => {
  showConfirmModal.value = false
  
  // If has photos and not offline, upload them
  if (photos.value.length > 0 && !notificationData.value.offline && notificationData.value.cm_history_id) {
    uploading.value = true
    
    try {
      const { uploadBase64Image } = useImageUpload()
      
      // Upload each photo
      for (const photo of photos.value) {
        await uploadBase64Image(
          notificationData.value.cm_history_id,
          'evidence',
          photo.preview,
          photo.file?.name || `evidence-${Date.now()}.jpg`
        )
      }
      
      showSuccess('อัพโหลดรูปภาพสำเร็จ')
    } catch (err: any) {
      showError(err.message || 'อัพโหลดรูปภาพไม่สำเร็จ')
      uploading.value = false
      return // Don't navigate if upload fails
    } finally {
      uploading.value = false
    }
  }
  
  navigateToSuccess()
}

const navigateToSuccess = () => {
  router.push({
    path: '/requester/submit-success',
    query: {
      notification: JSON.stringify({
        id: notificationData.value.cm_history_id,
        notification_id: notificationData.value.notification_id,
        asset_name: notificationData.value.asset_name,
        problem_category: notificationData.value.problem_category,
        priority: notificationData.value.priority
      })
    }
  })
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
