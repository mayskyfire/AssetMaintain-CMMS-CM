<template>
  <div class="min-h-screen bg-slate-50">
    <LayoutMobileHeader title="คิวออฟไลน์" :show-back="true" />
    
    <div class="p-4 space-y-4">
      <!-- Info Banner -->
      <UiCard class-name="p-4 bg-[#dbeafe] border border-[#00a6ff]/20">
        <div class="flex items-start gap-3">
          <Icon name="lucide:info" size="20" class="text-[#00a6ff] flex-shrink-0 mt-0.5" />
          <div>
            <p class="text-[13px] text-[#1e293b] font-medium mb-1">
              คิวออฟไลน์
            </p>
            <p class="text-[12px] text-[#64748b]">
              รายการที่บันทึกไว้ขณะออฟไลน์ จะถูกส่งอัตโนมัติเมื่อเชื่อมต่ออินเทอร์เน็ตอีกครั้ง
            </p>
          </div>
        </div>
      </UiCard>

      <!-- Sync Button -->
      <UiButton
        v-if="queueItems.length > 0"
        variant="primary"
        size="large"
        full-width
        icon="lucide:refresh-cw"
        @click="syncNow"
        :disabled="isSyncing"
      >
        {{ isSyncing ? 'กำลังซิงค์...' : `ซิงค์ทันที (${queueItems.length} รายการ)` }}
      </UiButton>

      <!-- Queue List -->
      <div v-if="queueItems.length > 0" class="space-y-3">
        <UiCard
          v-for="item in queueItems"
          :key="item.id"
          class-name="p-4"
        >
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
                 :class="getTypeColor(item.type)">
              <Icon :name="getTypeIcon(item.type)" size="20" class="text-white" />
            </div>
            
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between mb-2">
                <h4 class="text-[14px] font-bold text-slate-800">
                  {{ item.title }}
                </h4>
                <UiBadge label="รอซิงค์" variant="warning" size="small" />
              </div>
              
              <p class="text-[12px] text-slate-600 mb-2">{{ item.description }}</p>
              
              <div class="flex items-center justify-between">
                <span class="text-[11px] text-slate-500">
                  {{ formatDate(item.createdAt) }}
                </span>
                <button
                  @click="removeItem(item.id)"
                  class="text-[11px] text-[#ff3b30] hover:underline"
                >
                  ลบ
                </button>
              </div>
            </div>
          </div>
        </UiCard>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-16">
        <div class="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon name="lucide:check-circle" size="40" class="text-slate-400" />
        </div>
        <h3 class="text-[16px] font-bold text-slate-800 mb-2">ไม่มีรายการรอซิงค์</h3>
        <p class="text-[13px] text-slate-500">
          ข้อมูลทั้งหมดถูกซิงค์เรียบร้อยแล้ว
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const isSyncing = ref(false)

interface QueueItem {
  id: string
  type: 'notification' | 'worklog' | 'parts' | 'closeout'
  title: string
  description: string
  createdAt: Date
  data: any
}

const queueItems = ref<QueueItem[]>([
  // Mock data - จะถูกแทนที่ด้วย localStorage ใน Phase 2
])

const getTypeIcon = (type: string) => {
  const icons: Record<string, string> = {
    notification: 'lucide:file-text',
    worklog: 'lucide:clock',
    parts: 'lucide:package',
    closeout: 'lucide:check-circle'
  }
  return icons[type] || 'lucide:file'
}

const getTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    notification: 'bg-[#00a6ff]',
    worklog: 'bg-[#fe9a00]',
    parts: 'bg-[#6dd400]',
    closeout: 'bg-[#8b5cf6]'
  }
  return colors[type] || 'bg-slate-400'
}

const formatDate = (date: Date) => {
  return new Date(date).toLocaleString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const syncNow = async () => {
  isSyncing.value = true
  
  // Simulate sync
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  // Clear queue
  queueItems.value = []
  isSyncing.value = false
  
  // Show success message (ใน Phase 2 จะใช้ Toast)
  alert('ซิงค์ข้อมูลสำเร็จ!')
}

const removeItem = (id: string) => {
  if (confirm('ต้องการลบรายการนี้?')) {
    queueItems.value = queueItems.value.filter(item => item.id !== id)
  }
}
</script>
