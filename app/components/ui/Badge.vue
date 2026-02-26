<template>
  <span :class="badgeClasses">
    <span v-if="showDot" class="w-2 h-2 rounded-full" :class="dotColor" />
    <slot>{{ label }}</slot>
  </span>
</template>

<script setup lang="ts">
interface Props {
  label?: string
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'secondary'
  size?: 'small' | 'medium'
  showDot?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'medium',
  showDot: false
})

const badgeClasses = computed(() => {
  const classes = ['badge']
  
  // Variant
  if (props.variant === 'primary') classes.push('badge-primary')
  if (props.variant === 'success') classes.push('badge-success')
  if (props.variant === 'warning') classes.push('badge-warning')
  if (props.variant === 'danger') classes.push('badge-danger')
  if (props.variant === 'secondary') classes.push('badge-secondary')
  
  // Size
  if (props.size === 'small') classes.push('text-[10px] px-2 py-0.5')
  
  return classes.join(' ')
})

const dotColor = computed(() => {
  if (props.variant === 'primary') return 'bg-[#00a6ff]'
  if (props.variant === 'success') return 'bg-[#6dd400]'
  if (props.variant === 'warning') return 'bg-[#fe9a00]'
  if (props.variant === 'danger') return 'bg-[#ff3b30]'
  return 'bg-slate-400'
})
</script>
