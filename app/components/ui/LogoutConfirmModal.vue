<template>
  <Transition name="modal">
    <div
      v-if="show"
      class="fixed inset-0 z-[80] flex items-center justify-center p-4"
      @click.self="handleCancel"
    >
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/50" />

      <!-- Modal -->
      <div class="relative bg-white rounded-[20px] w-full max-w-sm p-6 shadow-2xl">
        <!-- Icon -->
        <div class="w-16 h-16 mx-auto mb-4 bg-[#fee2e2] rounded-full flex items-center justify-center">
          <Icon name="lucide:log-out" size="32" class="text-[#ff3b30]" />
        </div>

        <!-- Title -->
        <h3 class="text-[18px] font-bold text-slate-800 text-center mb-2">
          ออกจากระบบ
        </h3>

        <!-- Description -->
        <p class="text-[14px] text-slate-600 text-center mb-6">
          คุณต้องการออกจากระบบใช่หรือไม่?
        </p>

        <!-- Actions -->
        <div class="flex gap-3">
          <button
            @click="handleCancel"
            class="flex-1 px-4 py-3 border border-slate-200 text-slate-600 text-[14px] font-bold rounded-[12px] active:bg-slate-50 transition-colors"
          >
            ยกเลิก
          </button>
          <button
            @click="handleConfirm"
            :disabled="loading"
            class="flex-1 px-4 py-3 bg-[#ff3b30] text-white text-[14px] font-bold rounded-[12px] active:bg-[#e62e24] transition-colors disabled:opacity-50"
          >
            {{ loading ? 'กำลังออก...' : 'ออกจากระบบ' }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
interface Props {
  show: boolean
  loading?: boolean
}

interface Emits {
  (e: 'cancel'): void
  (e: 'confirm'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const handleCancel = () => {
  if (!props.loading) {
    emit('cancel')
  }
}

const handleConfirm = () => {
  if (!props.loading) {
    emit('confirm')
  }
}

// Prevent body scroll when modal is open
watch(() => props.show, (isOpen) => {
  if (process.client) {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }
})

// Cleanup on unmount
onUnmounted(() => {
  if (process.client) {
    document.body.style.overflow = ''
  }
})
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: scale(0.95);
  opacity: 0;
}
</style>
