<template>
  <div class="space-y-2">
    <label v-if="label" class="block text-[13px] font-bold text-slate-800">
      {{ label }}
      <span v-if="required" class="text-[#ff3b30]">*</span>
    </label>
    <div class="relative">
      <select
        :value="modelValue"
        :disabled="disabled"
        :required="required"
        :class="selectClasses"
        @change="handleChange"
      >
        <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
        <option
          v-for="option in options"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
      <Icon
        name="lucide:chevron-down"
        size="20"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
      />
    </div>
    <p v-if="hint" class="text-[11px] text-slate-500">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
interface Option {
  value: string
  label: string
}

interface Props {
  modelValue: string
  label?: string
  placeholder?: string
  options: Option[]
  disabled?: boolean
  required?: boolean
  hint?: string
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  required: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const selectClasses = computed(() => {
  const classes = [
    'w-full px-4 py-3 pr-10 bg-slate-50 border border-slate-200 rounded-[10px]',
    'text-[14px] text-slate-800',
    'focus:outline-none focus:ring-2 focus:ring-[#00a6ff] focus:border-transparent',
    'transition-all appearance-none cursor-pointer'
  ]
  
  if (props.disabled) {
    classes.push('opacity-50 cursor-not-allowed')
  }
  
  return classes.join(' ')
})

const handleChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  emit('update:modelValue', target.value)
}
</script>
