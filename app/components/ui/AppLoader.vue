<template>
  <Transition name="loader-fade">
    <div
      v-if="isLoading"
      class="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-[#00a6ff] to-[#0084d1]"
    >
      <div class="flex flex-col items-center gap-6">
        <!-- Logo/Icon Animation -->
        <div class="relative">
          <!-- Outer rotating ring -->
          <div class="absolute inset-0 w-24 h-24 border-4 border-white/20 rounded-full animate-spin-slow"></div>
          
          <!-- Inner pulsing circle -->
          <div class="relative w-24 h-24 flex items-center justify-center">
            <div class="absolute inset-2 bg-white/10 rounded-full animate-pulse"></div>
            
            <!-- Icon -->
            <div class="relative z-10 w-16 h-16 bg-white rounded-[16px] flex items-center justify-center shadow-lg">
              <img src="/favicon-96x96.png" class="w-100 h-100">
            </div>
          </div>
        </div>

        <!-- App Name -->
        <div class="text-center">
          <h1 class="text-[28px] font-bold text-white mb-2 tracking-tight">
            AssetMaintain CMMS - CM
          </h1>
          <p class="text-[14px] text-white/80 animate-pulse">
            {{ loadingText }}
          </p>
        </div>

        <!-- Loading Progress Bar -->
        <div class="w-48 h-1 bg-white/20 rounded-full overflow-hidden relative">
          <!-- Main progress bar -->
          <div 
            class="h-full bg-white rounded-full transition-all duration-500 ease-out relative overflow-hidden"
            :style="{ width: `${progress}%` }"
          >
            <!-- Shimmer effect -->
            <div class="absolute inset-0 shimmer"></div>
          </div>
          
          <!-- Indeterminate loading animation when progress is low -->
          <div 
            v-if="progress < 100"
            class="absolute inset-0 overflow-hidden"
          >
            <div class="h-full w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-slide"></div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
const props = defineProps<{
  isLoading: boolean
  progress?: number
  loadingText?: string
}>()

const internalProgress = ref(0)
const progress = computed(() => props.progress || internalProgress.value)
const loadingText = computed(() => props.loadingText || 'กำลังโหลด...')

// Auto-increment progress for smooth animation
let progressInterval: NodeJS.Timeout | null = null

watch(() => props.isLoading, (isLoading) => {
  if (isLoading) {
    // Start auto-increment
    internalProgress.value = 0
    progressInterval = setInterval(() => {
      if (internalProgress.value < 90) {
        // Slow down as it approaches 90%
        const increment = internalProgress.value < 30 ? 2 : 
                         internalProgress.value < 60 ? 1 : 0.5
        internalProgress.value = Math.min(90, internalProgress.value + increment)
      }
    }, 100)
  } else {
    // Stop auto-increment
    if (progressInterval) {
      clearInterval(progressInterval)
      progressInterval = null
    }
    internalProgress.value = 0
  }
})

// Update internal progress when props.progress changes
watch(() => props.progress, (newProgress) => {
  if (newProgress !== undefined && newProgress > internalProgress.value) {
    internalProgress.value = newProgress
  }
})

onUnmounted(() => {
  if (progressInterval) {
    clearInterval(progressInterval)
  }
})
</script>

<style scoped>
.loader-fade-enter-active,
.loader-fade-leave-active {
  transition: opacity 0.3s ease;
}

.loader-fade-enter-from,
.loader-fade-leave-to {
  opacity: 0;
}

@keyframes spin-slow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes bounce-slow {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

@keyframes slide {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(400%);
  }
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.animate-spin-slow {
  animation: spin-slow 3s linear infinite;
}

.animate-bounce-slow {
  animation: bounce-slow 2s ease-in-out infinite;
}

.animate-slide {
  animation: slide 1.5s ease-in-out infinite;
}

.shimmer {
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.3) 50%,
    transparent 100%
  );
  animation: shimmer 2s ease-in-out infinite;
}
</style>
