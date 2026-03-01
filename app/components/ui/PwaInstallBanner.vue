<template>
  <Transition name="slide-up">
    <div
        v-if="showBanner"
        class="fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-[20px] shadow-[0_-4px_20px_rgba(0,0,0,0.15)] p-0"
      >
        <div class="bg-white rounded-2xl overflow-hidden">
          <!-- Header with gradient -->
          <div class="bg-white border-b-2 border-[#00a6ff] p-4">
            <div class="flex items-start gap-3">
              <div class="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#00a6ff] to-[#0084d1] rounded-xl flex items-center justify-center shadow-lg">
                <img src="/favicon-96x96.png" class="w-100 h-100">
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="font-bold text-lg text-slate-800">ติดตั้งแอพ</h3>
                <p class="text-sm text-slate-600 mt-0.5">AssetMaintain CMMS - CM</p>
                <p v-if="isDev" class="text-xs text-amber-600 mt-1 font-medium">
                  ⚠️ Dev Mode - ต้อง build production เพื่อติดตั้งจริง
                </p>
              </div>
              <button
                @click="dismiss"
                class="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Close"
              >
                <Icon name="lucide:x" size="20" class="text-slate-400" />
              </button>
            </div>
          </div>

        <!-- Content -->
        <div class="p-4">
          <p v-if="!isDev" class="text-[13px] text-slate-600 mb-4">
            ติดตั้งแอพเพื่อประสบการณ์ที่ดีขึ้น
          </p>
          
          <!-- Dev Mode Instructions -->
          <div v-if="isDev" class="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p class="text-[12px] text-amber-800 font-medium mb-2">
              📝 วิธีติดตั้ง PWA จริง:
            </p>
            <ol class="text-[11px] text-amber-700 space-y-1 ml-4 list-decimal">
              <li>รัน: <code class="bg-amber-100 px-1 rounded">npm run build</code></li>
              <li>รัน: <code class="bg-amber-100 px-1 rounded">npm run preview</code></li>
              <li>เปิด: <code class="bg-amber-100 px-1 rounded">http://localhost:3000</code></li>
              <li>ดูไอคอน ⊕ ใน Chrome address bar</li>
            </ol>
          </div>

          <!-- Actions -->
          <div class="flex gap-2">
            <button
              @click="dismiss"
              class="flex-1 px-4 py-3 border border-slate-200 text-slate-600 text-[14px] font-bold rounded-[12px] active:bg-slate-50 transition-colors"
            >
              {{ isDev ? 'ปิด' : 'ไว้ทีหลัง' }}
            </button>
            <button
              @click="handleInstall"
              :class="[
                'flex-1 px-4 py-3 text-white text-[14px] font-bold rounded-[12px] transition-colors',
                isDev 
                  ? 'bg-slate-400 cursor-not-allowed' 
                  : 'bg-[#00a6ff] active:bg-[#0084d1]'
              ]"
              :disabled="isDev"
            >
              {{ isDev ? 'ไม่สามารถติดตั้งได้' : 'ติดตั้งเลย' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
const { canInstall, promptInstall } = usePwaInstall()
const { success: showSuccess, error: showError } = useToast()
const { isDismissed, dismissBanner, clearDismiss, getRemainingHours } = usePwaBannerDismiss()

const dismissed = ref(false)
const isDev = import.meta.dev

const showBanner = computed(() => {
  // Don't show if dismissed within last 24 hours
  if (isDismissed()) {
    return false
  }
  
  const show = canInstall.value && !dismissed.value
  return show
})

const handleInstall = async () => {
  if (isDev) {
    showError('ไม่สามารถติดตั้งได้ใน dev mode กรุณา build production')
    return
  }
  
  const accepted = await promptInstall()
  
  if (accepted) {
    showSuccess('ติดตั้งแอปสำเร็จ')
    dismissed.value = true
    // Clear dismissed flag since user installed
    clearDismiss()
  } else {
    // User declined, dismiss for 24 hours
    dismiss()
  }
}

const dismiss = () => {
  console.log('[PwaInstallBanner] Dismissed for 24 hours')
  dismissed.value = true
  dismissBanner()
}

// Check on mount
onMounted(() => {
  const wasDismissed = isDismissed()
  
  if (wasDismissed) {
    const hoursLeft = getRemainingHours()
    console.log(`[PwaInstallBanner] Banner hidden, will show again in ${hoursLeft.toFixed(1)} hours`)
  } else {
    console.log('[PwaInstallBanner] Banner ready to show')
  }
})
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.35s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

code {
  font-family: 'Courier New', monospace;
  font-size: 11px;
}
</style>
