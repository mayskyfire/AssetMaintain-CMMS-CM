<template>
  <div
    :class="cardClasses"
    @click="handleClick"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
interface Props {
  clickable?: boolean
  className?: string
}

const props = withDefaults(defineProps<Props>(), {
  clickable: false,
  className: ''
})

const emit = defineEmits<{
  click: []
}>()

const cardClasses = computed(() => {
  const classes = ['card']
  if (props.clickable) {
    classes.push('cursor-pointer active:scale-[0.98] transition-transform')
  }
  if (props.className) {
    classes.push(props.className)
  }
  return classes.join(' ')
})

const handleClick = () => {
  if (props.clickable) {
    emit('click')
  }
}
</script>
