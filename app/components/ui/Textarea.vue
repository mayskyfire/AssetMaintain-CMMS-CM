<template>
  <div class="space-y-2">
    <label v-if="label" class="block text-[13px] font-bold text-slate-800">
      {{ label }}
      <span v-if="required" class="text-[#ff3b30]">*</span>
    </label>
    <textarea
      :value="modelValue"
      :placeholder="placeholder"
      :rows="rows"
      :disabled="disabled"
      :required="required"
      :class="textareaClasses"
      @input="handleInput"
      @blur="handleBlur"
    />
    <p v-if="error" class="text-[12px] text-[#ff3b30] flex items-center gap-1">
      <Icon name="lucide:alert-circle" class="w-3 h-3" />
      {{ error }}
    </p>
    <p v-else-if="hint" class="text-[11px] text-slate-500">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: string
  label?: string
  placeholder?: string
  rows?: number
  disabled?: boolean
  required?: boolean
  hint?: string
  error?: string
}

const props = withDefaults(defineProps<Props>(), {
  rows: 4,
  disabled: false,
  required: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  blur: []
}>()

const textareaClasses = computed(() => {
  const classes = [
    'w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-[10px]',
    'text-[14px] text-slate-800 placeholder:text-slate-400',
    'focus:outline-none focus:ring-2 focus:ring-[#00a6ff] focus:border-transparent',
    'transition-all resize-none'
  ]
  
  if (props.error) {
    classes.push('border-[#ff3b30] focus:ring-[#ff3b30]')
  }
  
  if (props.disabled) {
    classes.push('opacity-50 cursor-not-allowed')
  }
  
  return classes.join(' ')
})

const handleInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
}

const handleBlur = () => {
  emit('blur')
}
</script>
