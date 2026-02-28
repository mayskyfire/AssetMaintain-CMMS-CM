<template>
  <Teleport to="body">
    <Transition name="scanner">
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
              <Icon name="lucide:x" size="24" class="text-white" />
            </button>
            <h3 class="text-white font-bold text-[16px]">สแกน QR Code</h3>
            <button
              @click="toggleFlash"
              class="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm active:bg-white/30 transition-colors"
              :class="{ 'bg-yellow-500/50': isFlashOn }"
            >
              <Icon :name="isFlashOn ? 'lucide:zap' : 'lucide:zap-off'" size="20" class="text-white" />
            </button>
          </div>
        </div>

        <!-- Scanner View -->
        <div class="relative w-full h-full flex items-center justify-center">
          <!-- Scanner Container -->
          <div id="qr-reader" class="w-full h-full" />

          <!-- Scanning Frame Overlay -->
          <div class="absolute inset-0 pointer-events-none">
            <div class="absolute inset-0 bg-black/50" />
            <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64">
              <!-- Transparent center -->
              <div class="absolute inset-0 border-2 border-white rounded-2xl shadow-lg" />
              <!-- Corner indicators -->
              <div class="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#00a6ff] rounded-tl-2xl" />
              <div class="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#00a6ff] rounded-tr-2xl" />
              <div class="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#00a6ff] rounded-bl-2xl" />
              <div class="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#00a6ff] rounded-br-2xl" />
            </div>
          </div>

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
              <Icon name="lucide:camera-off" size="64" class="text-white/60 mx-auto mb-4" />
              <p class="text-white text-[16px] font-bold mb-2">ไม่สามารถเข้าถึงกล้องได้</p>
              <p class="text-white/80 text-[14px] mb-6">{{ error }}</p>
              <UiButton variant="secondary" @click="handleClose">
                ปิด
              </UiButton>
            </div>
          </div>
        </div>

        <!-- Instructions -->
        <div
          v-if="!error"
          class="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-6 pb-8"
        >
          <p class="text-center text-white text-[14px]">
            วาง QR Code ให้อยู่ในกรอบสี่เหลี่ยม
          </p>
          <p class="text-center text-white/70 text-[12px] mt-2">
            ระบบจะอ่านอัตโนมัติเมื่อพบ QR Code
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { Html5Qrcode } from 'html5-qrcode'

interface Props {
  isOpen: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  scan: [result: string]
}>()

const isLoading = ref(false)
const loadingMessage = ref('กำลังเปิดกล้อง...')
const error = ref('')
const isFlashOn = ref(false)

let html5QrCode: Html5Qrcode | null = null

// Start scanner when opened
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    startScanner()
  } else {
    stopScanner()
  }
})

// Cleanup on unmount
onUnmounted(() => {
  stopScanner()
})

const startScanner = async () => {
  try {
    isLoading.value = true
    loadingMessage.value = 'กำลังเปิดกล้อง...'
    error.value = ''

    // Initialize scanner
    html5QrCode = new Html5Qrcode('qr-reader')

    // Get cameras
    const devices = await Html5Qrcode.getCameras()
    if (!devices || devices.length === 0) {
      throw new Error('ไม่พบกล้องในอุปกรณ์นี้')
    }

    // Prefer back camera
    const backCamera = devices.find(device => 
      (device.label || '').toLowerCase().includes('back') || 
      (device.label || '').toLowerCase().includes('rear') ||
      (device.label || '').toLowerCase().includes('environment')
    )
    const cameraId = backCamera?.id || devices[0].id

    // Start scanning
    await html5QrCode.start(
      cameraId,
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      },
      (decodedText) => {
        // Success callback
        handleScanSuccess(decodedText)
      },
      (errorMessage) => {
        // Error callback (scanning errors, not critical)
      }
    )

    isLoading.value = false
  } catch (err) {
    console.error('Scanner error:', err)
    isLoading.value = false
    
    if (err instanceof Error) {
      if (err.name === 'NotAllowedError') {
        error.value = 'กรุณาอนุญาตให้เข้าถึงกล้องในการตั้งค่าเบราว์เซอร์'
      } else if (err.name === 'NotFoundError') {
        error.value = 'ไม่พบกล้องในอุปกรณ์นี้'
      } else if (err.name === 'NotReadableError') {
        error.value = 'กล้องกำลังถูกใช้งานโดยแอปพลิเคชันอื่น'
      } else {
        error.value = err.message || 'ไม่สามารถเปิดกล้องได้ กรุณาลองอีกครั้ง'
      }
    }
  }
}

const stopScanner = async () => {
  if (html5QrCode) {
    try {
      if (html5QrCode.isScanning) {
        await html5QrCode.stop()
      }
      html5QrCode.clear()
    } catch (err) {
      console.error('Stop scanner error:', err)
    }
    html5QrCode = null
  }
  isFlashOn.value = false
}

const toggleFlash = async () => {
  if (!html5QrCode) return
  
  try {
    const track = html5QrCode.getRunningTrackCameraCapabilities()
    // @ts-ignore - torch is not in standard types but supported by many devices
    if (track && track.torch) {
      isFlashOn.value = !isFlashOn.value
      // @ts-ignore
      await track.applyConstraints({
        advanced: [{ torch: isFlashOn.value }]
      })
    }
  } catch (err) {
    console.error('Flash toggle error:', err)
  }
}

const handleScanSuccess = (decodedText: string) => {
  emit('scan', decodedText)
  stopScanner()
}

const handleClose = () => {
  stopScanner()
  error.value = ''
  emit('close')
}
</script>

<style scoped>
#qr-reader {
  width: 100%;
  height: 100%;
}

/* Hide default html5-qrcode UI elements */
:deep(#qr-reader__dashboard_section) {
  display: none !important;
}

:deep(#qr-reader__dashboard_section_csr) {
  display: none !important;
}

:deep(#qr-reader__scan_region) {
  border: none !important;
}

.scanner-enter-active,
.scanner-leave-active {
  transition: opacity 0.3s ease;
}

.scanner-enter-from,
.scanner-leave-to {
  opacity: 0;
}
</style>
