<template>
  <div class="space-y-2">
    <label v-if="label" class="block text-[13px] font-bold text-slate-800">
      {{ label }}
      <span v-if="required" class="text-[#ff3b30] ml-1">*</span>
    </label>
    <div class="relative">
      <div v-if="icon" class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
        <Icon :name="icon" size="20" />
      </div>
      <input
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :class="inputClasses"
        @input="handleInput"
        @blur="handleBlur"
      />
      <div v-if="error" class="absolute right-4 top-1/2 -translate-y-1/2">
        <Icon name="lucide:alert-circle" class="w-5 h-5 text-[#ff3b30]" />
      </div>
    </div>
    <p v-if="error" class="text-[12px] text-[#ff3b30] flex items-center gap-1">
      {{ error }}
    </p>
    <p v-else-if="hint" class="text-[12px] text-slate-500">
      {{ hint }}
    </p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: string
  label?: string
  placeholder?: string
  type?: string
  icon?: string
  disabled?: boolean
  required?: boolean
  error?: string
  hint?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  disabled: false,
  required: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  blur: []
}>()

const inputClasses = computed(() => {
  const classes = ['input']
  if (props.icon) classes.push('pl-12')
  if (props.error) classes.push('pr-12 border-[#ff3b30] focus:border-[#ff3b30]')
  if (props.disabled) classes.push('opacity-50 cursor-not-allowed')
  return classes.join(' ')
})

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

const handleBlur = () => {
  emit('blur')
}
</script>
