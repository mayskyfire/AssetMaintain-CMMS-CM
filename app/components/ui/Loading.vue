<template>
  <div v-if="isLoading" :class="containerClass">
    <div :class="spinnerClass">
      <div class="animate-spin rounded-full border-4 border-t-transparent" :style="spinnerStyle"></div>
    </div>
    <p v-if="message" :class="messageClass">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  isLoading?: boolean
  size?: 'small' | 'medium' | 'large'
  variant?: 'primary' | 'white'
  message?: string
  fullscreen?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: true,
  size: 'medium',
  variant: 'primary',
  fullscreen: false
})

const sizeMap = {
  small: { width: '20px', height: '20px' },
  medium: { width: '40px', height: '40px' },
  large: { width: '60px', height: '60px' }
}

const colorMap = {
  primary: '#00a6ff',
  white: '#ffffff'
}

const containerClass = computed(() => [
  'flex flex-col items-center justify-center gap-3',
  props.fullscreen ? 'fixed inset-0 bg-white/80 backdrop-blur-sm z-50' : ''
])

const spinnerClass = computed(() => [
  'flex items-center justify-center'
])

const spinnerStyle = computed(() => ({
  width: sizeMap[props.size].width,
  height: sizeMap[props.size].height,
  borderColor: `${colorMap[props.variant]} transparent transparent transparent`
}))

const messageClass = computed(() => [
  'text-slate-600 text-[13px] font-medium'
])
</script>
