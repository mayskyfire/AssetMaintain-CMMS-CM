<template>
  <div class="min-h-screen bg-slate-50 p-4 space-y-6">
    <h1 class="text-[24px] font-bold text-slate-800 mb-6">Component Testing</h1>

    <!-- Toast Examples -->
    <UiCard class-name="p-4 space-y-3">
      <h2 class="text-[18px] font-bold text-slate-800 mb-3">Toast Notifications</h2>
      <div class="grid grid-cols-2 gap-2">
        <UiButton variant="success" size="small" @click="toast.success('บันทึกสำเร็จ', 'ข้อมูลถูกบันทึกแล้ว')">
          Success Toast
        </UiButton>
        <UiButton variant="danger" size="small" @click="toast.error('เกิดข้อผิดพลาด', 'กรุณาลองใหม่อีกครั้ง')">
          Error Toast
        </UiButton>
        <UiButton variant="warning" size="small" @click="toast.warning('คำเตือน', 'กรุณาตรวจสอบข้อมูล')">
          Warning Toast
        </UiButton>
        <UiButton variant="primary" size="small" @click="toast.info('ข้อมูล', 'นี่คือข้อความแจ้งเตือน')">
          Info Toast
        </UiButton>
      </div>
    </UiCard>

    <!-- Loading Examples -->
    <UiCard class-name="p-4 space-y-4">
      <h2 class="text-[18px] font-bold text-slate-800 mb-3">Loading Spinners</h2>
      
      <div class="space-y-3">
        <div class="flex items-center gap-4">
          <UiLoading size="small" />
          <span class="text-[13px] text-slate-600">Small</span>
        </div>
        
        <div class="flex items-center gap-4">
          <UiLoading size="medium" />
          <span class="text-[13px] text-slate-600">Medium</span>
        </div>
        
        <div class="flex items-center gap-4">
          <UiLoading size="large" />
          <span class="text-[13px] text-slate-600">Large</span>
        </div>
        
        <div class="flex items-center gap-4">
          <UiLoading size="medium" message="กำลังโหลด..." />
        </div>
      </div>

      <UiButton variant="primary" @click="showFullscreenLoading = true">
        Show Fullscreen Loading
      </UiButton>
    </UiCard>

    <!-- Form Validation Example -->
    <UiCard class-name="p-4 space-y-4">
      <h2 class="text-[18px] font-bold text-slate-800 mb-3">Form Validation</h2>
      
      <UiInput
        v-model="formData.name"
        label="ชื่อ"
        placeholder="กรอกชื่อของคุณ"
        required
        :error="errors.name"
        @blur="validateName"
      />
      
      <UiInput
        v-model="formData.email"
        label="อีเมล"
        type="email"
        placeholder="example@email.com"
        required
        :error="errors.email"
        @blur="validateEmail"
      />
      
      <UiTextarea
        v-model="formData.message"
        label="ข้อความ"
        placeholder="กรอกข้อความของคุณ"
        required
        :error="errors.message"
        :rows="4"
        @blur="validateMessage"
      />
      
      <UiButton variant="primary" full-width @click="handleFormSubmit">
        ส่งข้อมูล
      </UiButton>
    </UiCard>

    <!-- Fullscreen Loading -->
    <UiLoading
      :is-loading="showFullscreenLoading"
      fullscreen
      size="large"
      message="กำลังประมวลผล..."
    />
  </div>
</template>

<script setup lang="ts">
const toast = useToast()

const showFullscreenLoading = ref(false)

// Auto hide fullscreen loading after 3 seconds
watch(showFullscreenLoading, (value) => {
  if (value) {
    setTimeout(() => {
      showFullscreenLoading.value = false
      toast.success('โหลดเสร็จสิ้น')
    }, 3000)
  }
})

// Form validation example
const formData = ref({
  name: '',
  email: '',
  message: ''
})

const errors = ref({
  name: '',
  email: '',
  message: ''
})

const validateName = () => {
  if (!formData.value.name || formData.value.name.trim().length < 2) {
    errors.value.name = 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร'
  } else {
    errors.value.name = ''
  }
}

const validateEmail = () => {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!formData.value.email) {
    errors.value.email = 'กรุณากรอกอีเมล'
  } else if (!emailPattern.test(formData.value.email)) {
    errors.value.email = 'รูปแบบอีเมลไม่ถูกต้อง'
  } else {
    errors.value.email = ''
  }
}

const validateMessage = () => {
  if (!formData.value.message || formData.value.message.trim().length < 10) {
    errors.value.message = 'ข้อความต้องมีอย่างน้อย 10 ตัวอักษร'
  } else {
    errors.value.message = ''
  }
}

const handleFormSubmit = () => {
  validateName()
  validateEmail()
  validateMessage()
  
  if (!errors.value.name && !errors.value.email && !errors.value.message) {
    toast.success('ส่งข้อมูลสำเร็จ', 'ข้อมูลของคุณถูกบันทึกแล้ว')
    
    // Reset form
    formData.value = {
      name: '',
      email: '',
      message: ''
    }
  } else {
    toast.error('กรุณาตรวจสอบข้อมูล', 'มีข้อมูลบางส่วนไม่ถูกต้อง')
  }
}
</script>
