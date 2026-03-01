<template>
  <div class="min-h-screen bg-slate-50">
    <LayoutMobileHeader title="บันทึกการทำงาน" :show-back="true" />

    <div class="p-4 space-y-4 pb-24">
      <!-- Loading State -->
      <UiLoading v-if="loading" />

      <template v-else-if="currentJob">
        <!-- Job Info Card -->
        <UiCard class-name="p-4">
          <span class="text-[13px] font-bold text-[#00a6ff]">{{ currentJob.notification_id }}</span>
          <h2 class="text-[16px] font-bold text-slate-800 mt-1">{{ currentJob.asset_name }}</h2>
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
            @click="handleSaveWorklog"
            :disabled="!workNote.trim()"
          >
            <Icon name="lucide:save" class="w-5 h-5 mr-2" />
            บันทึกการทำงาน
          </UiButton>

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
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const { getJobDetail } = useTechnicianService()
const { currentJob, loading } = useTechnicianState()
const { success } = useToast()

const jobId = computed(() => Number(route.params.id))
const isWorking = ref(false)
const workNote = ref('')
const elapsedSeconds = ref(0)
const startTime = ref<Date | null>(null)

// Load job detail on mount
onMounted(async () => {
  try {
    await getJobDetail(jobId.value)
    // Load saved worklog from localStorage if exists
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`worklog_${jobId.value}`)
        if (saved) {
          const data = JSON.parse(saved)
          workNote.value = data.notes || ''
          elapsedSeconds.value = data.elapsedSeconds || 0
        }
      } catch (error) {
        console.error('Error loading from localStorage:', error)
      }
    }
  } catch (error) {
    console.error('Failed to load job detail:', error)
  }
})

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
    startTime.value = new Date()
    timerInterval = setInterval(() => {
      elapsedSeconds.value++
      // Auto-save every 30 seconds
      if (elapsedSeconds.value % 30 === 0) {
        saveToLocalStorage()
      }
    }, 1000)
  } else {
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
    saveToLocalStorage()
  }
}

const saveToLocalStorage = () => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`worklog_${jobId.value}`, JSON.stringify({
        notes: workNote.value,
        elapsedSeconds: elapsedSeconds.value,
        lastSaved: new Date().toISOString()
      }))
    } catch (error) {
      console.error('Error saving to localStorage:', error)
    }
  }
}

const handleSaveWorklog = () => {
  saveToLocalStorage()
  success('บันทึกการทำงานสำเร็จ')
}

// Auto-save when leaving page
onBeforeUnmount(() => {
  if (timerInterval) {
    clearInterval(timerInterval)
  }
  saveToLocalStorage()
})

// Watch for changes and auto-save
watch([workNote, elapsedSeconds], () => {
  if (workNote.value) {
    saveToLocalStorage()
  }
})
</script>
