<template>
  <div class="min-h-screen bg-slate-50">
    <LayoutMobileHeader title="มอบหมายช่าง" :show-back="true" />

    <div class="p-4 space-y-4 pb-24">
      <!-- Job Info Card -->
      <UiCard class-name="p-4">
        <h3 class="text-[13px] font-bold text-slate-800 mb-2">เลขที่ใบแจ้ง</h3>
        <p class="text-[16px] font-bold text-[#00a6ff]">{{ jobId }}</p>
        <p class="text-[12px] text-slate-500 mt-1">เครื่องปรับอากาศ AC-001</p>
      </UiCard>

      <!-- Technician Selection -->
      <div>
        <h3 class="text-[14px] font-bold text-slate-800 mb-3">เลือกช่างซ่อม</h3>
        <div class="space-y-2">
          <UiCard
            v-for="tech in technicians"
            :key="tech.id"
            :clickable="tech.available"
            :class-name="`p-4 ${!tech.available ? 'opacity-50' : ''}`"
            @click="tech.available && toggleTech(tech.id)"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                  <Icon name="lucide:user" class="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <p class="text-[14px] font-bold text-slate-800">{{ tech.name }}</p>
                  <p class="text-[12px] text-slate-500">ทักษะ: {{ tech.skill }}</p>
                </div>
              </div>
              <div v-if="tech.available" 
                   :class="[
                     'w-6 h-6 rounded-md border-2 flex items-center justify-center',
                     selectedTechs.includes(tech.id) 
                       ? 'bg-[#00a6ff] border-[#00a6ff]' 
                       : 'border-slate-300'
                   ]">
                <Icon v-if="selectedTechs.includes(tech.id)" 
                      name="lucide:check" 
                      class="w-4 h-4 text-white" />
              </div>
              <span v-else class="text-[11px] text-[#ff3b30] font-bold">ไม่ว่าง</span>
            </div>
          </UiCard>
        </div>
      </div>

      <!-- Assign Button -->
      <UiButton
        variant="primary"
        size="large"
        full-width
        :disabled="selectedTechs.length === 0"
        @click="handleAssignClick"
      >
        มอบหมายงาน ({{ selectedTechs.length }})
      </UiButton>
    </div>

    <!-- Confirmation Modal -->
    <UiModal
      :is-open="showConfirmModal"
      title="ยืนยันมอบหมายงาน"
      :message="`คุณต้องการมอบหมายงานให้ ${getSelectedTechNames()} ใช่หรือไม่?`"
      confirm-text="มอบหมายงาน"
      cancel-text="ยกเลิก"
      confirm-variant="primary"
      @close="showConfirmModal = false"
      @confirm="handleConfirmAssign"
    >
      <template #icon>
        <Icon name="lucide:user-check" class="w-16 h-16 text-[#00a6ff]" />
      </template>
    </UiModal>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()

const jobId = computed(() => route.params.id as string)
const selectedTechs = ref<string[]>([])
const showConfirmModal = ref(false)

const technicians = ref([
  { id: '1', name: 'สมศักดิ์ ช่างเทคนิค', skill: 'แอร์', available: true },
  { id: '2', name: 'วิชัย ช่างแอร์', skill: 'แอร์', available: true },
  { id: '3', name: 'สมชาย ช่างแอร์', skill: 'แอร์', available: false },
])

const { success: showSuccess } = useToast()

const toggleTech = (id: string) => {
  if (selectedTechs.value.includes(id)) {
    selectedTechs.value = selectedTechs.value.filter(t => t !== id)
  } else {
    selectedTechs.value = [...selectedTechs.value, id]
  }
}

const handleAssignClick = () => {
  showConfirmModal.value = true
}

const handleConfirmAssign = () => {
  showConfirmModal.value = false
  showSuccess('มอบหมายงานสำเร็จ', `มอบหมายให้ ${getSelectedTechNames()} แล้ว`)
  
  setTimeout(() => {
    router.push('/supervisor/inbox')
  }, 1000)
}

const getSelectedTechNames = () => {
  return technicians.value
    .filter(tech => selectedTechs.value.includes(tech.id))
    .map(tech => tech.name)
    .join(', ')
}
</script>
