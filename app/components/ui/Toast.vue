<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-2"
    >
      <div
        v-if="isVisible"
        :class="toastClass"
        role="alert"
      >
        <div class="flex items-start gap-3">
          <Icon :name="iconName" :class="iconClass" />
          <div class="flex-1 min-w-0">
            <p v-if="title" class="text-[14px] font-bold mb-1">{{ title }}</p>
            <p class="text-[13px]">{{ message }}</p>
          </div>
          <button
            v-if="closable"
            @click="close"
            class="shrink-0 w-6 h-6 flex items-center justify-center rounded-md hover:bg-black/10 transition-colors"
          >
            <Icon name="lucide:x" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
interface Props {
  message: string
  title?: string
  variant?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  closable?: boolean
  position?: 'top' | 'bottom'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'info',
  duration: 3000,
  closable: true,
  position: 'top'
})

const emit = defineEmits<{
  close: []
}>()

const isVisible = ref(true)
let timeoutId: NodeJS.Timeout | null = null

const variantConfig = {
  success: {
    bg: 'bg-[#6dd400]',
    text: 'text-white',
    icon: 'lucide:check-circle'
  },
  error: {
    bg: 'bg-[#ff3b30]',
    text: 'text-white',
    icon: 'lucide:alert-circle'
  },
  warning: {
    bg: 'bg-[#fe9a00]',
    text: 'text-white',
    icon: 'lucide:alert-triangle'
  },
  info: {
    bg: 'bg-[#00a6ff]',
    text: 'text-white',
    icon: 'lucide:info'
  }
}

const toastClass = computed(() => [
  'fixed left-4 right-4 mx-auto max-w-md z-[9999]',
  'rounded-xl shadow-lg p-4',
  variantConfig[props.variant].bg,
  variantConfig[props.variant].text,
  props.position === 'top' ? 'top-20' : 'bottom-24'
])

const iconName = computed(() => variantConfig[props.variant].icon)
const iconClass = computed(() => 'w-5 h-5 shrink-0')

const close = () => {
  isVisible.value = false
  if (timeoutId) {
    clearTimeout(timeoutId)
  }
  setTimeout(() => {
    emit('close')
  }, 200)
}

onMounted(() => {
  if (props.duration > 0) {
    timeoutId = setTimeout(() => {
      close()
    }, props.duration)
  }
})

onUnmounted(() => {
  if (timeoutId) {
    clearTimeout(timeoutId)
  }
})
</script>
