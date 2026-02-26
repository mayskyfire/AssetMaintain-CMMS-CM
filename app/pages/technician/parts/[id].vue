<template>
  <div class="min-h-screen bg-slate-50">
    <LayoutMobileHeader title="จัดการอะไหล่" :show-back="true" />

    <div class="p-4 space-y-4 pb-24">
      <!-- Job Info Card -->
      <UiCard class-name="p-4 bg-blue-100">
        <h3 class="text-[13px] font-bold text-slate-800 mb-1">{{ jobId }}</h3>
        <p class="text-[12px] text-slate-600">เครื่องปรับอากาศ AC-02</p>
      </UiCard>

      <!-- Parts List -->
      <div>
        <h3 class="text-[14px] font-bold text-slate-800 mb-3">อะไหล่ที่ใช้</h3>
        <div class="space-y-3">
          <UiCard
            v-for="part in parts"
            :key="part.id"
            class-name="p-4"
          >
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <p class="text-[14px] font-bold text-slate-800">{{ part.name }}</p>
                <p class="text-[12px] text-slate-500">รหัส: {{ part.code }}</p>
              </div>

              <div class="flex items-center gap-2">
                <button
                  @click="updateQuantity(part.id, -1)"
                  class="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center hover:bg-slate-200 transition-colors"
                >
                  <Icon name="lucide:minus" class="w-4 h-4 text-slate-500" />
                </button>
                <span class="w-12 text-center text-[16px] font-bold text-slate-800">
                  {{ part.quantity }}
                </span>
                <button
                  @click="updateQuantity(part.id, 1)"
                  class="w-8 h-8 bg-[#00a6ff] rounded-lg flex items-center justify-center hover:bg-[#0095e8] transition-colors"
                >
                  <Icon name="lucide:plus" class="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </UiCard>
        </div>
      </div>

      <!-- Save Button -->
      <UiButton
        variant="primary"
        size="large"
        full-width
        @click="handleSave"
      >
        บันทึกอะไหล่
      </UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()

const jobId = computed(() => route.params.id as string)

const parts = ref([
  { id: '1', name: 'มอเตอร์พัดลม', code: 'MTR-001', quantity: 0 },
  { id: '2', name: 'คอนเดนเซอร์', code: 'CND-002', quantity: 0 },
])

const updateQuantity = (id: string, delta: number) => {
  const part = parts.value.find(p => p.id === id)
  if (part) {
    part.quantity = Math.max(0, part.quantity + delta)
  }
}

const { success: showSuccess } = useToast()

const handleSave = () => {
  const totalParts = parts.value.reduce((sum, p) => sum + p.quantity, 0)
  showSuccess('บันทึกอะไหล่สำเร็จ', `บันทึก ${totalParts} รายการ`)
  
  setTimeout(() => {
    router.push(`/technician/worklog/${jobId.value}`)
  }, 800)
}
</script>
