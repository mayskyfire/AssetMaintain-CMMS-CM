<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="handleClose"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50" @click="handleClose" />

        <!-- Modal -->
        <div class="relative bg-white rounded-[16px] w-full max-w-sm shadow-xl">
          <!-- Icon -->
          <div v-if="$slots.icon" class="flex justify-center pt-6 pb-4">
            <slot name="icon" />
          </div>

          <!-- Content -->
          <div class="px-6 pb-6">
            <h3 class="text-[18px] font-bold text-slate-800 text-center mb-2">
              {{ title }}
            </h3>
            <p v-if="message" class="text-[14px] text-slate-600 text-center mb-6">
              {{ message }}
            </p>

            <!-- Custom Body -->
            <slot />

            <!-- Actions (hide when using custom body without confirm) -->
            <div v-if="confirmText" class="space-y-2" :class="{ 'mt-6': $slots.default }">
              <UiButton
                :variant="confirmVariant"
                size="large"
                full-width
                @click="handleConfirm"
              >
                {{ confirmText }}
              </UiButton>
              <UiButton
                v-if="cancelText"
                variant="secondary"
                size="large"
                full-width
                @click="handleClose"
              >
                {{ cancelText }}
              </UiButton>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
interface Props {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  confirmVariant?: 'primary' | 'success' | 'danger' | 'secondary'
}

const props = withDefaults(defineProps<Props>(), {
  confirmText: 'ยืนยัน',
  cancelText: 'ยกเลิก',
  confirmVariant: 'primary'
})

const emit = defineEmits<{
  close: []
  confirm: []
}>()

const handleClose = () => {
  emit('close')
}

const handleConfirm = () => {
  emit('confirm')
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.2s ease;
}

.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: scale(0.95);
}
</style>
