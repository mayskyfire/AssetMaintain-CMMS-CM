import { ref, computed } from 'vue'

export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => boolean | string
  message?: string
}

export interface FieldValidation {
  value: any
  rules: ValidationRule[]
  error: string
  touched: boolean
}

export const useFormValidation = () => {
  const fields = ref<Record<string, FieldValidation>>({})

  const registerField = (name: string, rules: ValidationRule[] = []) => {
    fields.value[name] = {
      value: '',
      rules,
      error: '',
      touched: false
    }
  }

  const validateField = (name: string, value: any): string => {
    const field = fields.value[name]
    if (!field) return ''

    field.value = value
    field.touched = true

    for (const rule of field.rules) {
      // Required validation
      if (rule.required && (!value || value.toString().trim() === '')) {
        field.error = rule.message || 'ฟิลด์นี้จำเป็นต้องกรอก'
        return field.error
      }

      // Skip other validations if value is empty and not required
      if (!value || value.toString().trim() === '') {
        continue
      }

      // Min length validation
      if (rule.minLength && value.toString().length < rule.minLength) {
        field.error = rule.message || `ต้องมีอย่างน้อย ${rule.minLength} ตัวอักษร`
        return field.error
      }

      // Max length validation
      if (rule.maxLength && value.toString().length > rule.maxLength) {
        field.error = rule.message || `ต้องไม่เกิน ${rule.maxLength} ตัวอักษร`
        return field.error
      }

      // Pattern validation
      if (rule.pattern && !rule.pattern.test(value.toString())) {
        field.error = rule.message || 'รูปแบบไม่ถูกต้อง'
        return field.error
      }

      // Custom validation
      if (rule.custom) {
        const result = rule.custom(value)
        if (result !== true) {
          field.error = typeof result === 'string' ? result : (rule.message || 'ข้อมูลไม่ถูกต้อง')
          return field.error
        }
      }
    }

    field.error = ''
    return ''
  }

  const validateAll = (): boolean => {
    let isValid = true
    for (const name in fields.value) {
      const error = validateField(name, fields.value[name].value)
      if (error) {
        isValid = false
      }
    }
    return isValid
  }

  const getError = (name: string): string => {
    return fields.value[name]?.error || ''
  }

  const hasError = (name: string): boolean => {
    return !!fields.value[name]?.error && fields.value[name]?.touched
  }

  const clearError = (name: string) => {
    if (fields.value[name]) {
      fields.value[name].error = ''
    }
  }

  const clearAllErrors = () => {
    for (const name in fields.value) {
      fields.value[name].error = ''
      fields.value[name].touched = false
    }
  }

  const reset = () => {
    for (const name in fields.value) {
      fields.value[name].value = ''
      fields.value[name].error = ''
      fields.value[name].touched = false
    }
  }

  const isFormValid = computed(() => {
    return Object.values(fields.value).every(field => !field.error)
  })

  const touchedFields = computed(() => {
    return Object.values(fields.value).filter(field => field.touched).length
  })

  return {
    fields,
    registerField,
    validateField,
    validateAll,
    getError,
    hasError,
    clearError,
    clearAllErrors,
    reset,
    isFormValid,
    touchedFields
  }
}

// Common validation rules
export const validationRules = {
  required: (message?: string): ValidationRule => ({
    required: true,
    message: message || 'ฟิลด์นี้จำเป็นต้องกรอก'
  }),

  minLength: (length: number, message?: string): ValidationRule => ({
    minLength: length,
    message: message || `ต้องมีอย่างน้อย ${length} ตัวอักษร`
  }),

  maxLength: (length: number, message?: string): ValidationRule => ({
    maxLength: length,
    message: message || `ต้องไม่เกิน ${length} ตัวอักษร`
  }),

  email: (message?: string): ValidationRule => ({
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: message || 'รูปแบบอีเมลไม่ถูกต้อง'
  }),

  phone: (message?: string): ValidationRule => ({
    pattern: /^[0-9]{9,10}$/,
    message: message || 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง'
  }),

  number: (message?: string): ValidationRule => ({
    pattern: /^[0-9]+$/,
    message: message || 'กรุณากรอกตัวเลขเท่านั้น'
  }),

  custom: (validator: (value: any) => boolean | string, message?: string): ValidationRule => ({
    custom: validator,
    message
  })
}
