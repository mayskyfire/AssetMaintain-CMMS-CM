<template>
  <Transition name="loader-fade">
    <div
      v-if="isLoading"
      class="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-[#00a6ff] to-[#0084d1]"
    >
      <div class="flex flex-col items-center gap-6 px-6">
        <!-- Logo/Icon Animation -->
        <div class="relative">
          <!-- Outer rotating ring -->
          <div class="absolute inset-0 w-24 h-24 border-4 border-white/30 rounded-full animate-spin-slow"></div>
          
          <!-- Middle rotating ring (opposite direction) -->
          <div class="absolute inset-2 w-20 h-20 border-4 border-white/20 border-t-transparent rounded-full animate-spin-reverse"></div>
          
          <!-- Inner pulsing circle -->
          <div class="relative w-24 h-24 flex items-center justify-center">
            <div class="absolute inset-3 bg-white/10 rounded-full animate-pulse-slow"></div>
            
            <!-- Icon -->
            <div class="relative z-10 w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-xl">
              <img src="/favicon-96x96.png" class="w-100 h-100">
            </div>
          </div>
        </div>

        <!-- App Name -->
        <div class="text-center">
          <h1 class="text-[28px] font-bold text-white mb-2 tracking-tight">
            AssetMaintain CMMS<br />CM
          </h1>
          <p class="text-[14px] text-white/80 animate-pulse">
            {{ loadingText }}
          </p>
        </div>

        <!-- Loading Progress Bar -->
        <div class="w-64 relative">
          <!-- Progress container -->
          <div class="h-1.5 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
            <!-- Animated progress bar -->
            <div 
              class="h-full bg-white rounded-full transition-all duration-300 ease-out relative overflow-hidden shadow-lg"
              :style="{ width: `${progress}%` }"
            >
              <!-- Shimmer effect -->
              <div class="absolute inset-0 shimmer"></div>
            </div>
            
            <!-- Continuous sliding animation -->
            <div 
              v-if="progress < 100"
              class="absolute inset-0 overflow-hidden"
            >
              <div class="h-full w-1/2 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-slide-continuous"></div>
            </div>
          </div>
          
          <!-- Progress percentage -->
          <div class="text-center mt-1">
            <span class="text-xs text-white/80 font-medium">{{ Math.round(progress) }}%</span>
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
    // Complete to 100% before hiding
    internalProgress.value = 100
    setTimeout(() => {
      if (progressInterval) {
        clearInterval(progressInterval)
        progressInterval = null
      }
      internalProgress.value = 0
    }, 300)
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
.loader-fade-enter-active {
  transition: opacity 0.3s ease;
}

.loader-fade-leave-active {
  transition: opacity 0.5s ease 0.2s;
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

@keyframes spin-reverse {
  from {
    transform: rotate(360deg);
  }
  to {
    transform: rotate(0deg);
  }
}

@keyframes pulse-slow {
  0%, 100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.05);
  }
}

@keyframes slide-continuous {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(300%);
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

@keyframes bounce-dot {
  0%, 80%, 100% {
    transform: translateY(0);
    opacity: 0.6;
  }
  40% {
    transform: translateY(-8px);
    opacity: 1;
  }
}

.animate-spin-slow {
  animation: spin-slow 3s linear infinite;
}

.animate-spin-reverse {
  animation: spin-reverse 2s linear infinite;
}

.animate-pulse-slow {
  animation: pulse-slow 2s ease-in-out infinite;
}

.animate-slide-continuous {
  animation: slide-continuous 1.2s ease-in-out infinite;
}

.animate-bounce-dot {
  animation: bounce-dot 1.4s ease-in-out infinite;
}

.shimmer {
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.4) 50%,
    transparent 100%
  );
  animation: shimmer 1.5s ease-in-out infinite;
}
</style>
