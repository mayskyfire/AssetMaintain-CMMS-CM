<template>
  <div class="min-h-screen bg-slate-50">
    <LayoutMobileHeader title="รายละเอียดใบแจ้ง" :show-back="true" />

    <div class="p-4 space-y-4 pb-24">
      <!-- Header -->
      <UiCard class-name="p-4">
        <div class="flex items-start justify-between mb-3">
          <span class="text-[16px] font-bold text-[#00a6ff]">{{ notification.id }}</span>
          <UiBadge
            :label="getStatusLabel(notification.status)"
            :variant="getStatusVariant(notification.status)"
            :show-dot="true"
          />
        </div>

        <h2 class="text-[18px] font-bold text-slate-800 mb-3">
          {{ notification.equipment }}
        </h2>

        <div class="space-y-2 mb-4">
          <div class="flex items-start gap-2">
            <Icon name="lucide:map-pin" size="16" class="text-slate-500 shrink-0 mt-0.5" />
            <span class="text-[13px] text-slate-500">{{ notification.location }}</span>
          </div>
          <div class="flex items-start gap-2">
            <Icon name="lucide:clock" size="16" class="text-slate-500 shrink-0 mt-0.5" />
            <span class="text-[13px] text-slate-500">
              แจ้งเมื่อ: {{ notification.createdAt }}
            </span>
          </div>
          <div v-if="notification.assignedTo" class="flex items-start gap-2">
            <Icon name="lucide:user" size="16" class="text-slate-500 shrink-0 mt-0.5" />
            <span class="text-[13px] text-slate-500">
              ช่างผู้รับผิดชอบ: {{ notification.assignedTo }}
            </span>
          </div>
        </div>

        <div class="flex gap-2">
          <UiBadge
            :label="notification.type === 'Z1' ? 'Z1 - Breakdown' : 'Z2 - Malfunction'"
            :variant="notification.type === 'Z1' ? 'danger' : 'primary'"
            size="small"
          />
          <UiBadge
            :label="`Priority ${notification.priority}`"
            :variant="notification.priority === '1' ? 'danger' : 'primary'"
            size="small"
          />
        </div>
      </UiCard>

      <!-- Description -->
      <UiCard class-name="p-4">
        <h3 class="text-[13px] font-bold text-slate-800 mb-2">รายละเอียดปัญหา</h3>
        <p class="text-[13px] text-slate-600">{{ notification.description }}</p>
      </UiCard>

      <!-- Timeline -->
      <UiCard class-name="p-4">
        <h3 class="text-[13px] font-bold text-slate-800 mb-4">ไทม์ไลน์</h3>
        <UiTimeline :items="timelineItems" />
      </UiCard>

      <!-- Actions -->
      <UiButton
        v-if="notification.status === 'completed'"
        variant="primary"
        size="large"
        full-width
        icon="lucide:star"
        @click="router.push(`/requester/evaluation/${notification.id}`)"
      >
        ประเมินผลการซ่อม
      </UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const route = useRoute()
const id = route.params.id as string

// Mock data
const notification = ref({
  id: id || 'CM-2026-0124',
  equipment: 'เครื่องปรับอากาศ AC-001',
  location: 'ห้องประชุม A, อาคาร 1',
  status: 'inProgress',
  priority: '1',
  type: 'Z1',
  description: 'แอร์ไม่เย็น มีเสียงดังผิดปกติ',
  createdAt: '21 ม.ค. 2026 15:30',
  assignedTo: 'สมศักดิ์ ช่างเทคนิค'
})

const timelineItems = ref([
  {
    id: '1',
    title: 'สร้างใบแจ้งซ่อม',
    description: 'แจ้งโดย: ผู้ใช้งาน',
    timestamp: '21 ม.ค. 15:30',
    status: 'completed' as const
  },
  {
    id: '2',
    title: 'มอบหมายช่างซ่อม',
    description: 'มอบหมายให้: สมศักดิ์ ช่างเทคนิค',
    timestamp: '21 ม.ค. 15:45',
    status: 'completed' as const
  },
  {
    id: '3',
    title: 'เริ่มดำเนินการซ่อม',
    description: 'กำลังดำเนินการ...',
    timestamp: '21 ม.ค. 16:00',
    status: 'current' as const
  },
  {
    id: '4',
    title: 'ปิดงานซ่อม',
    timestamp: '-',
    status: 'pending' as const
  }
])

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
