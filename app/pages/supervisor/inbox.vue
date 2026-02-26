<template>
  <div class="min-h-screen bg-slate-50">
    <LayoutMobileHeader title="งานใหม่" />
    
    <div class="p-4 space-y-3 pb-24">
      <UiCard
        v-for="job in jobs"
        :key="job.id"
        :clickable="true"
        class-name="p-4"
        @click="router.push(`/supervisor/assign/${job.id}`)"
      >
        <div class="flex items-start justify-between mb-2">
          <span class="text-[13px] font-bold text-[#00a6ff]">{{ job.id }}</span>
          <UiBadge label="รอมอบหมาย" variant="warning" :show-dot="true" />
        </div>

        <h4 class="text-[14px] font-bold text-slate-800 mb-2">
          {{ job.equipment }}
        </h4>

        <p class="text-[13px] text-slate-600 mb-3">{{ job.description }}</p>

        <div class="flex items-center justify-between">
          <UiBadge
            :label="`Priority ${job.priority}`"
            :variant="job.priority === '1' ? 'danger' : 'primary'"
            size="small"
          />
          <span class="text-[11px] text-slate-500">{{ job.createdAt }}</span>
        </div>
      </UiCard>
    </div>

    <LayoutBottomNav role="supervisor" />
  </div>
</template>

<script setup lang="ts">
const router = useRouter()

const jobs = ref([
  {
    id: 'CM-2026-0124',
    equipment: 'เครื่องปรับอากาศ AC-03',
    description: 'เครื่องไม่เย็น มีเสียงดังผิดปกติ',
    priority: '1',
    createdAt: '22 ม.ค. 2026 10:30'
  }
])
</script>
