<template>
  <button
    :class="buttonClasses"
    :disabled="disabled"
    @click="handleClick"
  >
    <Icon v-if="icon" :name="icon" :size="iconSize" />
    <slot />
  </button>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'success' | 'danger' | 'secondary'
  size?: 'small' | 'medium' | 'large'
  fullWidth?: boolean
  disabled?: boolean
  icon?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'medium',
  fullWidth: false,
  disabled: false
})

const emit = defineEmits<{
  click: []
}>()

const buttonClasses = computed(() => {
  const classes = ['btn']
  
  // Variant
  if (props.variant === 'primary') classes.push('btn-primary')
  if (props.variant === 'success') classes.push('btn-success')
  if (props.variant === 'danger') classes.push('btn-danger')
  if (props.variant === 'secondary') classes.push('btn-secondary')
  
  // Size
  if (props.size === 'small') classes.push('btn-sm')
  if (props.size === 'medium') classes.push('btn-md')
  if (props.size === 'large') classes.push('btn-lg')
  
  // Full width
  if (props.fullWidth) classes.push('w-full')
  
  // Disabled
  if (props.disabled) classes.push('opacity-50 cursor-not-allowed')
  
  return classes.join(' ')
})

const iconSize = computed(() => {
  if (props.size === 'small') return '16'
  if (props.size === 'large') return '20'
  return '18'
})

const handleClick = () => {
  if (!props.disabled) {
    emit('click')
  }
}
</script>
