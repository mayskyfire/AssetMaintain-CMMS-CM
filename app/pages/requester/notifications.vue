<template>
  <div class="min-h-screen bg-slate-50">
    <LayoutMobileHeader title="ประวัติการแจ้งซ่อม" />
    
    <div class="p-4 space-y-4 pb-24">
      <!-- Search -->
      <div class="relative">
        <Icon name="lucide:search" size="20" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          v-model="searchTerm"
          type="text"
          placeholder="ค้นหาเลขที่ใบแจ้ง, อุปกรณ์..."
          class="w-full h-[46px] pl-10 pr-4 bg-white rounded-[10px] border border-slate-200 text-[14px] focus:outline-none focus:border-[#00a6ff]"
        />
      </div>

      <!-- Status Filters -->
      <div class="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        <button
          @click="filterStatus = 'all'"
          :class="[
            'px-4 py-2 rounded-full text-[14px] whitespace-nowrap transition-colors',
            filterStatus === 'all'
              ? 'bg-[#00a6ff] text-white'
              : 'bg-white text-slate-500 border border-slate-200'
          ]"
        >
          ทั้งหมด ({{ notifications.length }})
        </button>
        <button
          @click="filterStatus = 'pending'"
          :class="[
            'px-4 py-2 rounded-full text-[14px] whitespace-nowrap transition-colors',
            filterStatus === 'pending'
              ? 'bg-[#fef3c6] text-[#bb4d00] border-2 border-[#fe9a00]'
              : 'bg-white text-slate-500 border border-slate-200'
          ]"
        >
          รอดำเนินการ
        </button>
        <button
          @click="filterStatus = 'inProgress'"
          :class="[
            'px-4 py-2 rounded-full text-[14px] whitespace-nowrap transition-colors',
            filterStatus === 'inProgress'
              ? 'bg-[#dbeafe] text-[#1447e6] border-2 border-[#2b7fff]'
              : 'bg-white text-slate-500 border border-slate-200'
          ]"
        >
          กำลังซ่อม
        </button>
        <button
          @click="filterStatus = 'completed'"
          :class="[
            'px-4 py-2 rounded-full text-[14px] whitespace-nowrap transition-colors',
            filterStatus === 'completed'
              ? 'bg-[rgba(109,212,0,0.1)] text-[#6dd400] border-2 border-[#6dd400]'
              : 'bg-white text-slate-500 border border-slate-200'
          ]"
        >
          เสร็จสิ้น
        </button>
      </div>

      <!-- Notification List -->
      <div class="space-y-3">
        <UiCard
          v-for="notif in filteredNotifications"
          :key="notif.id"
          :clickable="true"
          class-name="p-4"
          @click="router.push(`/requester/notification/${notif.id}`)"
        >
          <div class="flex items-start justify-between mb-3">
            <div class="flex items-center gap-2">
              <span class="text-[13px] font-bold text-[#00a6ff]">{{ notif.id }}</span>
            </div>
            <UiBadge
              :label="getStatusLabel(notif.status)"
              :variant="getStatusVariant(notif.status)"
              :show-dot="true"
            />
          </div>

          <h4 class="text-[14px] font-bold text-slate-800 mb-2">
            {{ notif.equipment }}
          </h4>

          <div class="flex items-center justify-between">
            <UiBadge
              :label="`Priority ${notif.priority}`"
              :variant="notif.priority === '1' ? 'danger' : 'primary'"
              size="small"
            />
            <span class="text-[11px] text-slate-500">{{ notif.createdAt }}</span>
          </div>
        </UiCard>

        <!-- Empty State -->
        <div v-if="filteredNotifications.length === 0" class="text-center py-12">
          <Icon name="lucide:inbox" size="48" class="mx-auto text-slate-300 mb-3" />
          <p class="text-[14px] text-slate-500">ไม่พบรายการแจ้งซ่อม</p>
        </div>
      </div>
    </div>

    <LayoutBottomNav role="requester" />
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const searchTerm = ref('')
const filterStatus = ref('all')

const notifications = ref([
  {
    id: 'CM-2026-0123',
    equipment: 'เครื่องปรับอากาศ AC-02',
    status: 'inProgress',
    priority: '2',
    createdAt: '21 ม.ค. 2026 14:30',
    description: 'แอร์ไม่เย็น มีน้ำหยด'
  },
  {
    id: 'CM-2026-0122',
    equipment: 'ปั๊มน้ำ P-01',
    status: 'completed',
    priority: '1',
    createdAt: '20 ม.ค. 2026 09:15',
    description: 'ปั๊มไม่ทำงาน'
  },
  {
    id: 'CM-2026-0121',
    equipment: 'เครื่องปรับอากาศ AC-01',
    status: 'pending',
    priority: '2',
    createdAt: '19 ม.ค. 2026 16:45',
    description: 'แอร์มีกลิ่นเหม็น'
  }
])

const filteredNotifications = computed(() => {
  return notifications.value.filter((notif) => {
    const matchesSearch = notif.id.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      notif.equipment.toLowerCase().includes(searchTerm.value.toLowerCase())
    const matchesStatus = filterStatus.value === 'all' || notif.status === filterStatus.value
    return matchesSearch && matchesStatus
  })
})

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: 'รอดำเนินการ',
    inProgress: 'กำลังซ่อม',
    completed: 'เสร็จสิ้น'
  }
  return labels[status] || status
}

const getStatusVariant = (status: string) => {
  const variants: Record<string, any> = {
    pending: 'warning',
    inProgress: 'primary',
    completed: 'success'
  }
  return variants[status] || 'secondary'
}
</script>
