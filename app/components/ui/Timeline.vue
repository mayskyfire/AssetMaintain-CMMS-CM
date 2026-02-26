<template>
  <div class="space-y-4">
    <div
      v-for="(item, index) in items"
      :key="item.id"
      class="relative flex gap-3"
    >
      <!-- Line -->
      <div
        v-if="index < items.length - 1"
        class="absolute left-[15px] top-[32px] bottom-[-16px] w-[2px]"
        :class="item.status === 'completed' ? 'bg-[#6dd400]' : 'bg-slate-200'"
      />

      <!-- Icon -->
      <div
        class="relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        :class="getStatusColor(item.status)"
      >
        <Icon
          v-if="item.status === 'completed'"
          name="lucide:check"
          size="16"
          class="text-white"
        />
        <Icon
          v-else-if="item.status === 'current'"
          name="lucide:loader"
          size="16"
          class="text-white animate-spin"
        />
        <div
          v-else
          class="w-2 h-2 rounded-full bg-white"
        />
      </div>

      <!-- Content -->
      <div class="flex-1 pb-4">
        <h4
          class="text-[14px] font-bold mb-1"
          :class="item.status === 'pending' ? 'text-slate-400' : 'text-slate-800'"
        >
          {{ item.title }}
        </h4>
        <p
          v-if="item.description"
          class="text-[12px] mb-1"
          :class="item.status === 'pending' ? 'text-slate-400' : 'text-slate-600'"
        >
          {{ item.description }}
        </p>
        <span
          class="text-[11px]"
          :class="item.status === 'pending' ? 'text-slate-400' : 'text-slate-500'"
        >
          {{ item.timestamp }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface TimelineItem {
  id: string
  title: string
  description?: string
  timestamp: string
  status: 'completed' | 'current' | 'pending'
}

interface Props {
  items: TimelineItem[]
}

defineProps<Props>()

const getStatusColor = (status: string) => {
  if (status === 'completed') return 'bg-[#6dd400]'
  if (status === 'current') return 'bg-[#00a6ff]'
  return 'bg-slate-300'
}
</script>
