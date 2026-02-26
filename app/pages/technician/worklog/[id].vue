<template>
  <div class="min-h-screen bg-slate-50">
    <LayoutMobileHeader title="บันทึกการทำงาน" :show-back="true" />

    <div class="p-4 space-y-4 pb-24">
      <!-- Job Info Card -->
      <UiCard class-name="p-4">
        <span class="text-[13px] font-bold text-[#00a6ff]">{{ jobId }}</span>
        <h2 class="text-[16px] font-bold text-slate-800 mt-1">เครื่องปรับอากาศ AC-02</h2>
      </UiCard>

      <!-- Timer Card -->
      <UiCard class-name="p-6 text-center">
        <p class="text-[13px] text-slate-500 mb-2">เวลาที่ใช้</p>
        <p class="text-[48px] font-bold text-slate-800">{{ formattedTime }}</p>
        <UiButton
          :variant="isWorking ? 'danger' : 'success'"
          size="large"
          full-width
          @click="toggleTimer"
        >
          <Icon :name="isWorking ? 'lucide:pause' : 'lucide:play'" class="w-5 h-5 mr-2" />
          {{ isWorking ? 'หยุดพัก' : 'เริ่มทำงาน' }}
        </UiButton>
      </UiCard>

      <!-- Work Note Card -->
      <UiCard class-name="p-4">
        <UiTextarea
          label="บันทึกการทำงาน"
          placeholder="ระบุรายละเอียดการทำงาน, ปัญหาที่พบ, วิธีแก้ไข..."
          v-model="workNote"
          :rows="5"
        />
      </UiCard>

      <!-- Action Buttons -->
      <div class="space-y-3">
        <UiButton
          variant="primary"
          size="large"
          full-width
          @click="router.push(`/technician/parts/${jobId}`)"
        >
          <Icon name="lucide:package" class="w-5 h-5 mr-2" />
          จัดการอะไหล่
        </UiButton>

        <UiButton
          variant="success"
          size="large"
          full-width
          @click="router.push(`/technician/closeout/${jobId}`)"
        >
          ปิดงานซ่อม
        </UiButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()

const jobId = computed(() => route.params.id as string)
const isWorking = ref(false)
const workNote = ref('')
const elapsedSeconds = ref(2723) // 00:45:23

const formattedTime = computed(() => {
  const hours = Math.floor(elapsedSeconds.value / 3600)
  const minutes = Math.floor((elapsedSeconds.value % 3600) / 60)
  const seconds = elapsedSeconds.value % 60
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})

let timerInterval: NodeJS.Timeout | null = null

const toggleTimer = () => {
  isWorking.value = !isWorking.value
  
  if (isWorking.value) {
    timerInterval = setInterval(() => {
      elapsedSeconds.value++
    }, 1000)
  } else {
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
  }
}

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval)
  }
})
</script>
