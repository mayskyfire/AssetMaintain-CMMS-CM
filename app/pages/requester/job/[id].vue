<template>
  <div class="min-h-screen bg-slate-50">
    <LayoutMobileHeader title="รายละเอียดใบแจ้ง" :show-back="true" />

    <UiLoading v-if="loading" />

    <div v-else-if="currentNotification" class="p-4 space-y-4 pb-24">
      <!-- Header -->
      <UiCard class-name="p-4">
        <div class="flex items-start justify-between mb-3">
          <span class="text-[16px] font-bold text-[#00a6ff]">{{ currentNotification.notification_id }}</span>
          <UiBadge
            :label="getStatusLabel(currentNotification.status)"
            :variant="getStatusVariant(currentNotification.status)"
            :show-dot="true"
          />
        </div>

        <h2 class="text-[18px] font-bold text-slate-800 mb-3">
          {{ currentNotification.asset_name }}
        </h2>

        <div class="space-y-2 mb-4">
          <div class="flex items-start gap-2">
            <Icon name="lucide:map-pin" size="16" class="text-slate-500 shrink-0 mt-0.5" />
            <span class="text-[13px] text-slate-500">{{ currentNotification.location }}</span>
          </div>
          <div class="flex items-start gap-2">
            <Icon name="lucide:clock" size="16" class="text-slate-500 shrink-0 mt-0.5" />
            <span class="text-[13px] text-slate-500">
              แจ้งเมื่อ: {{ formatDate(currentNotification.breakdown_date) }}
            </span>
          </div>
          <div v-if="currentNotification.technician_name" class="flex items-start gap-2">
            <Icon name="lucide:user" size="16" class="text-slate-500 shrink-0 mt-0.5" />
            <span class="text-[13px] text-slate-500">
              ช่างผู้รับผิดชอบ: {{ currentNotification.technician_name }}
            </span>
          </div>
          <div v-if="currentNotification.requester_name" class="flex items-start gap-2">
            <Icon name="lucide:user-check" size="16" class="text-slate-500 shrink-0 mt-0.5" />
            <span class="text-[13px] text-slate-500">
              ผู้แจ้ง: {{ currentNotification.requester_name }}
            </span>
          </div>
        </div>

        <div class="flex gap-2">
          <UiBadge
            :label="`Priority: ${currentNotification.priority}`"
            :variant="currentNotification.priority === 'critical' || currentNotification.priority === 'high' ? 'danger' : 'primary'"
            size="small"
          />
          <UiBadge
            v-if="currentNotification.problem_category"
            :label="currentNotification.problem_category"
            variant="secondary"
            size="small"
          />
        </div>
      </UiCard>

      <!-- Description -->
      <UiCard class-name="p-4">
        <h3 class="text-[13px] font-bold text-slate-800 mb-2">รายละเอียดปัญหา</h3>
        <p class="text-[13px] text-slate-600">{{ currentNotification.problem_description }}</p>
      </UiCard>

      <!-- Root Cause & Actions (if completed) -->
      <UiCard v-if="currentNotification.root_cause" class-name="p-4">
        <h3 class="text-[13px] font-bold text-slate-800 mb-3">สาเหตุและการแก้ไข</h3>
        <div class="space-y-3">
          <div>
            <p class="text-[12px] font-bold text-slate-600 mb-1">สาเหตุ:</p>
            <p class="text-[13px] text-slate-800">{{ currentNotification.root_cause }}</p>
          </div>
          <div v-if="currentNotification.corrective_action">
            <p class="text-[12px] font-bold text-slate-600 mb-1">การแก้ไข:</p>
            <p class="text-[13px] text-slate-800">{{ currentNotification.corrective_action }}</p>
          </div>
          <div v-if="currentNotification.preventive_recommendation">
            <p class="text-[12px] font-bold text-slate-600 mb-1">ข้อเสนอแนะ:</p>
            <p class="text-[13px] text-slate-800">{{ currentNotification.preventive_recommendation }}</p>
          </div>
        </div>
      </UiCard>

      <!-- Work Summary (if completed) -->
      <UiCard v-if="currentNotification.completion_date" class-name="p-4">
        <h3 class="text-[13px] font-bold text-slate-800 mb-3">สรุปการทำงาน</h3>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <p class="text-[11px] text-slate-500 mb-1">เวลาเริ่มงาน</p>
            <p class="text-[13px] font-bold text-slate-800">
              {{ currentNotification.start_time ? formatDate(currentNotification.start_time) : '-' }}
            </p>
          </div>
          <div>
            <p class="text-[11px] text-slate-500 mb-1">เวลาเสร็จงาน</p>
            <p class="text-[13px] font-bold text-slate-800">
              {{ formatDate(currentNotification.completion_date) }}
            </p>
          </div>
          <div v-if="currentNotification.downtime_hours">
            <p class="text-[11px] text-slate-500 mb-1">Downtime</p>
            <p class="text-[13px] font-bold text-slate-800">{{ currentNotification.downtime_hours }} ชม.</p>
          </div>
          <div v-if="currentNotification.labor_hours">
            <p class="text-[11px] text-slate-500 mb-1">ชั่วโมงทำงาน</p>
            <p class="text-[13px] font-bold text-slate-800">{{ currentNotification.labor_hours }} ชม.</p>
          </div>
        </div>
      </UiCard>

      <!-- Evidence Images -->
      <UiCard v-if="currentNotification.evidence_images && currentNotification.evidence_images.length > 0" class-name="p-4">
        <h3 class="text-[13px] font-bold text-slate-800 mb-3">รูปภาพหลักฐาน</h3>
        <div class="grid grid-cols-2 gap-3">
          <div
            v-for="img in currentNotification.evidence_images"
            :key="img.id"
            class="relative aspect-square rounded-[8px] overflow-hidden bg-slate-100"
          >
            <img :src="getImageUrl(img.url)" :alt="img.caption || 'Evidence'" class="w-full h-full object-cover" />
            <div v-if="img.caption" class="absolute bottom-0 left-0 right-0 bg-black/50 p-2">
              <p class="text-[11px] text-white">{{ img.caption }}</p>
            </div>
          </div>
        </div>
      </UiCard>

      <!-- Parts Used -->
      <UiCard v-if="currentNotification.parts_used && currentNotification.parts_used.length > 0" class-name="p-4">
        <h3 class="text-[13px] font-bold text-slate-800 mb-3">อะไหล่ที่ใช้</h3>
        <div class="space-y-2">
          <div
            v-for="part in currentNotification.parts_used"
            :key="part.id"
            class="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
          >
            <div>
              <p class="text-[13px] font-bold text-slate-800">{{ part.part_name }}</p>
              <p class="text-[11px] text-slate-500">{{ part.part_no || '-' }}</p>
            </div>
            <div class="text-right">
              <p class="text-[13px] font-bold text-slate-800">{{ part.quantity }} {{ part.unit }}</p>
              <p v-if="part.total_cost" class="text-[11px] text-slate-500">฿{{ part.total_cost.toLocaleString() }}</p>
            </div>
          </div>
        </div>
      </UiCard>

      <!-- Timeline -->
      <UiCard class-name="p-4">
        <h3 class="text-[13px] font-bold text-slate-800 mb-4">ไทม์ไลน์</h3>
        <UiTimeline :items="timelineItems" />
      </UiCard>

      <!-- Evaluation (if exists) -->
      <UiCard v-if="currentNotification.satisfaction_rating" class-name="p-4">
        <h3 class="text-[13px] font-bold text-slate-800 mb-3">การประเมินผล</h3>
        <div class="flex items-center gap-2 mb-2">
          <div class="flex gap-1">
            <Icon
              v-for="i in 5"
              :key="i"
              name="lucide:star"
              size="16"
              :class="i <= currentNotification.satisfaction_rating ? 'text-[#fe9a00] fill-[#fe9a00]' : 'text-slate-300'"
            />
          </div>
          <span class="text-[13px] font-bold text-slate-800">{{ currentNotification.satisfaction_rating }}/5</span>
        </div>
        <p v-if="currentNotification.satisfaction_comment" class="text-[13px] text-slate-600">
          {{ currentNotification.satisfaction_comment }}
        </p>
      </UiCard>

      <!-- Actions -->
      <UiButton
        v-if="currentNotification.status === 'completed' && !currentNotification.satisfaction_rating"
        variant="primary"
        size="large"
        full-width
        icon="lucide:star"
        @click="router.push(`/requester/evaluation/${currentNotification.id}`)"
      >
        ประเมินผลการซ่อม
      </UiButton>
    </div>

    <!-- Empty State -->
    <div v-else class="flex flex-col items-center justify-center min-h-[60vh] p-4">
      <Icon name="lucide:alert-circle" size="48" class="text-slate-300 mb-3" />
      <p class="text-[14px] text-slate-500">ไม่พบข้อมูลใบแจ้งซ่อม</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const route = useRoute()
const { getNotificationDetail } = useNotificationService()
const { currentNotification, loading } = useNotificationState()
const { getImageUrl } = useImageUrl()

const id = Number(route.params.id)

// Load notification detail on mount
onMounted(async () => {
  try {
    await getNotificationDetail(id)
  } catch (error) {
    console.error('Failed to load notification detail:', error)
  }
})

// Transform timeline from API data
const timelineItems = computed(() => {
  if (!currentNotification.value?.timeline) return []
  
  return currentNotification.value.timeline.map(event => ({
    id: event.id.toString(),
    title: event.event,
    description: event.user ? `โดย: ${event.user}` : undefined,
    timestamp: formatDate(event.time),
    status: event.status === 'completed' ? 'completed' as const : 
            event.status === 'current' ? 'current' as const : 
            'pending' as const
  }))
})

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    reported: 'รอดำเนินการ',
    pending: 'รอดำเนินการ',
    assigned: 'กำลังซ่อม',
    in_progress: 'กำลังซ่อม',
    completed: 'เสร็จสิ้น',
    evaluated: 'เสร็จสิ้น'
  }
  return labels[status] || status
}

const getStatusVariant = (status: string) => {
  const variants: Record<string, any> = {
    reported: 'warning',
    pending: 'warning',
    assigned: 'primary',
    in_progress: 'primary',
    completed: 'success',
    evaluated: 'success'
  }
  return variants[status] || 'secondary'
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>
