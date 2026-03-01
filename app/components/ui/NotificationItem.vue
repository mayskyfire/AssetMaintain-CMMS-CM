<template>
  <UiCard 
    :class-name="[
      'p-4 cursor-pointer transition-all active:scale-[0.98]',
      !notification.is_read ? 'bg-blue-50 border-l-4 border-[#00a6ff]' : 'bg-white'
    ]"
    @click="$emit('click', notification)"
  >
    <div class="flex gap-3">
      <!-- Icon -->
      <div 
        :class="[
          'w-12 h-12 rounded-full flex items-center justify-center shrink-0',
          iconBgClass
        ]"
      >
        <Icon :name="iconName" class="w-6 h-6" :class="iconColorClass" />
      </div>

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <!-- Header -->
        <div class="flex items-start justify-between gap-2 mb-1">
          <h4 class="text-[14px] font-bold text-slate-800 line-clamp-1">
            {{ notification.title }}
          </h4>
          <span class="text-[11px] text-slate-500 whitespace-nowrap">
            {{ relativeTime }}
          </span>
        </div>

        <!-- Message -->
        <p class="text-[13px] text-slate-600 line-clamp-2 mb-2">
          {{ notification.message }}
        </p>

        <!-- Metadata Tags -->
        <div v-if="notification.metadata" class="flex flex-wrap gap-2">
          <span 
            v-if="notification.metadata.notification_id" 
            class="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-700 text-[11px] font-bold rounded-md"
          >
            <Icon name="lucide:hash" class="w-3 h-3" />
            {{ notification.metadata.notification_id }}
          </span>
          <span 
            v-if="notification.metadata.asset_code" 
            class="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-700 text-[11px] font-bold rounded-md"
          >
            <Icon name="lucide:package" class="w-3 h-3" />
            {{ notification.metadata.asset_code }}
          </span>
        </div>

        <!-- Priority Badge -->
        <div v-if="notification.priority === 'critical' || notification.priority === 'high'" class="mt-2">
          <UiBadge
            :label="notification.priority === 'critical' ? 'เร่งด่วนมาก' : 'เร่งด่วน'"
            variant="danger"
            size="small"
          />
        </div>
      </div>

      <!-- Unread Indicator -->
      <div v-if="!notification.is_read" class="shrink-0">
        <div class="w-2.5 h-2.5 bg-[#00a6ff] rounded-full"></div>
      </div>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Notification } from '~/composables/useNotifications'

const props = defineProps<{
  notification: Notification
}>()

defineEmits<{
  click: [notification: Notification]
}>()

const iconName = computed(() => {
  const iconMap: Record<string, string> = {
    'cm_assigned': 'lucide:clipboard-list',
    'cm_accepted': 'lucide:check-circle',
    'cm_in_progress': 'lucide:wrench',
    'cm_completed': 'lucide:check-circle-2',
    'cm_evaluated': 'lucide:thumbs-up',
    'pm_reminder': 'lucide:clock',
    'pm_overdue': 'lucide:alert-circle',
    'system': 'lucide:bell'
  }
  return iconMap[props.notification.type] || 'lucide:bell'
})

const iconBgClass = computed(() => {
  const bgMap: Record<string, string> = {
    'critical': 'bg-red-100',
    'high': 'bg-orange-100',
    'medium': 'bg-blue-100',
    'low': 'bg-slate-100'
  }
  return bgMap[props.notification.priority] || 'bg-slate-100'
})

const iconColorClass = computed(() => {
  const colorMap: Record<string, string> = {
    'critical': 'text-[#ff3b30]',
    'high': 'text-[#fe9a00]',
    'medium': 'text-[#00a6ff]',
    'low': 'text-slate-500'
  }
  return colorMap[props.notification.priority] || 'text-slate-500'
})

const relativeTime = computed(() => {
  const date = new Date(props.notification.created_at)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return 'เมื่อสักครู่'
  if (minutes < 60) return `${minutes} นาที`
  if (hours < 24) return `${hours} ชม.`
  if (days < 7) return `${days} วัน`
  
  return date.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  })
})
</script>
