<template>
  <Teleport to="body">
    <Transition name="camera">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[60] bg-black"
      >
        <!-- Header -->
        <div class="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
          <div class="flex items-center justify-between">
            <button
              @click="handleClose"
              class="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm active:bg-white/30 transition-colors"
            >
              <Icon name="lucide:x" class="w-6 h-6 text-white" />
            </button>
            <h3 class="text-white font-bold text-[16px]">ถ่ายรูป</h3>
            <button
              v-if="!isCaptured"
              @click="switchCamera"
              class="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm active:bg-white/30 transition-colors"
            >
              <Icon name="lucide:refresh-cw" class="w-5 h-5 text-white" />
            </button>
            <div v-else class="w-10" />
          </div>
        </div>

        <!-- Camera View / Preview -->
        <div class="relative w-full h-full flex items-center justify-center">
          <!-- Video Stream -->
          <video
            v-show="!isCaptured"
            ref="videoRef"
            autoplay
            playsinline
            class="w-full h-full object-cover"
          />

          <!-- Captured Image Preview -->
          <img
            v-if="isCaptured && capturedImage"
            :src="capturedImage"
            class="w-full h-full object-contain"
            alt="Captured"
          />

          <!-- Loading State -->
          <div
            v-if="isLoading"
            class="absolute inset-0 flex items-center justify-center bg-black/50"
          >
            <div class="text-center">
              <UiLoading size="large" variant="white" />
              <p class="text-white text-[14px] mt-4">{{ loadingMessage }}</p>
            </div>
          </div>

          <!-- Error State -->
          <div
            v-if="error"
            class="absolute inset-0 flex items-center justify-center bg-black p-6"
          >
            <div class="text-center max-w-sm">
              <Icon name="lucide:camera-off" class="w-16 h-16 text-white/60 mx-auto mb-4" />
              <p class="text-white text-[16px] font-bold mb-2">ไม่สามารถเข้าถึงกล้องได้</p>
              <p class="text-white/80 text-[14px] mb-6">{{ error }}</p>
              <UiButton variant="secondary" @click="handleClose">
                ปิด
              </UiButton>
            </div>
          </div>
        </div>

        <!-- Controls -->
        <div
          v-if="!error"
          class="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-6 pb-8"
        >
          <div class="flex items-center justify-center gap-6">
            <!-- Retake Button (when captured) -->
            <button
              v-if="isCaptured"
              @click="retake"
              class="w-14 h-14 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm active:bg-white/30 transition-colors"
            >
              <Icon name="lucide:rotate-ccw" class="w-6 h-6 text-white" />
            </button>

            <!-- Capture / Confirm Button -->
            <button
              v-if="!isCaptured"
              @click="capture"
              :disabled="isLoading"
              class="w-20 h-20 rounded-full bg-white border-4 border-white/30 active:scale-95 transition-transform disabled:opacity-50"
            />
            <button
              v-else
              @click="confirm"
              class="w-16 h-16 flex items-center justify-center rounded-full bg-[#6dd400] active:scale-95 transition-transform"
            >
              <Icon name="lucide:check" class="w-8 h-8 text-white" />
            </button>

            <!-- Gallery Button (when not captured) -->
            <button
              v-if="!isCaptured"
              @click="openGallery"
              class="w-14 h-14 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm active:bg-white/30 transition-colors"
            >
              <Icon name="lucide:image" class="w-6 h-6 text-white" />
            </button>
            <div v-else class="w-14" />
          </div>

          <p class="text-center text-white/80 text-[12px] mt-4">
            {{ isCaptured ? 'กดเครื่องหมายถูกเพื่อยืนยัน' : 'กดปุ่มกลางเพื่อถ่ายรูป' }}
          </p>
        </div>

        <!-- Hidden Canvas -->
        <canvas ref="canvasRef" class="hidden" />
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
interface Props {
  isOpen: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  capture: [file: File]
  openGallery: []
}>()

const videoRef = ref<HTMLVideoElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const stream = ref<MediaStream | null>(null)
const isCaptured = ref(false)
const capturedImage = ref<string>('')
const isLoading = ref(false)
const loadingMessage = ref('กำลังเปิดกล้อง...')
const error = ref('')
const facingMode = ref<'user' | 'environment'>('environment')

// Start camera when opened
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    startCamera()
  } else {
    stopCamera()
  }
})

// Cleanup on unmount
onUnmounted(() => {
  stopCamera()
})

const startCamera = async () => {
  try {
    isLoading.value = true
    loadingMessage.value = 'กำลังเปิดกล้อง...'
    error.value = ''
    isCaptured.value = false
    capturedImage.value = ''

    // Request camera permission
    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: facingMode.value,
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      },
      audio: false
    }

    stream.value = await navigator.mediaDevices.getUserMedia(constraints)

    // Wait for next tick to ensure video element is ready
    await nextTick()

    if (videoRef.value && stream.value) {
      videoRef.value.srcObject = stream.value
      await videoRef.value.play()
    }

    isLoading.value = false
  } catch (err) {
    console.error('Camera error:', err)
    isLoading.value = false
    
    if (err instanceof Error) {
      if (err.name === 'NotAllowedError') {
        error.value = 'กรุณาอนุญาตให้เข้าถึงกล้องในการตั้งค่าเบราว์เซอร์'
      } else if (err.name === 'NotFoundError') {
        error.value = 'ไม่พบกล้องในอุปกรณ์นี้'
      } else if (err.name === 'NotReadableError') {
        error.value = 'กล้องกำลังถูกใช้งานโดยแอปพลิเคชันอื่น'
      } else {
        error.value = 'ไม่สามารถเปิดกล้องได้ กรุณาลองอีกครั้ง'
      }
    }
  }
}

const stopCamera = () => {
  if (stream.value) {
    stream.value.getTracks().forEach(track => track.stop())
    stream.value = null
  }
  if (videoRef.value) {
    videoRef.value.srcObject = null
  }
}

const switchCamera = async () => {
  facingMode.value = facingMode.value === 'user' ? 'environment' : 'user'
  stopCamera()
  await startCamera()
}

const capture = () => {
  if (!videoRef.value || !canvasRef.value) return

  const video = videoRef.value
  const canvas = canvasRef.value

  // Set canvas size to video size
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight

  // Draw video frame to canvas
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

  // Get image data
  capturedImage.value = canvas.toDataURL('image/jpeg', 0.9)
  isCaptured.value = true

  // Stop camera to save battery
  stopCamera()
}

const retake = () => {
  isCaptured.value = false
  capturedImage.value = ''
  startCamera()
}

const confirm = async () => {
  if (!capturedImage.value) return

  try {
    isLoading.value = true
    loadingMessage.value = 'กำลังบันทึกรูปภาพ...'

    // Convert base64 to blob
    const response = await fetch(capturedImage.value)
    const blob = await response.blob()

    // Create file
    const file = new File(
      [blob],
      `photo-${Date.now()}.jpg`,
      { type: 'image/jpeg' }
    )

    emit('capture', file)
    handleClose()
  } catch (err) {
    console.error('Confirm error:', err)
    error.value = 'ไม่สามารถบันทึกรูปภาพได้'
  } finally {
    isLoading.value = false
  }
}

const openGallery = () => {
  emit('openGallery')
  handleClose()
}

const handleClose = () => {
  stopCamera()
  isCaptured.value = false
  capturedImage.value = ''
  error.value = ''
  emit('close')
}
</script>

<style scoped>
.camera-enter-active,
.camera-leave-active {
  transition: opacity 0.3s ease;
}

.camera-enter-from,
.camera-leave-to {
  opacity: 0;
}
</style>
