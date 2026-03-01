<template>
  <div
    class="notification-item"
    :class="{ 'unread': !notification.is_read, [priorityClass]: true }"
    @click="$emit('click', notification)"
  >
    <div class="icon">
      <Icon :name="iconName" :size="20" />
    </div>

    <div class="content">
      <div class="header">
        <h4 class="title">{{ notification.title }}</h4>
        <span class="time">{{ relativeTime }}</span>
      </div>
      <p class="message">{{ notification.message }}</p>
      <div v-if="notification.metadata" class="metadata">
        <span v-if="notification.metadata.notification_id" class="tag">
          {{ notification.metadata.notification_id }}
        </span>
        <span v-if="notification.metadata.asset_code" class="tag">
          {{ notification.metadata.asset_code }}
        </span>
      </div>
    </div>

    <div v-if="!notification.is_read" class="unread-dot"></div>
  </div>
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
    'cm_evaluated': 'lucide:star',
    'pm_reminder': 'lucide:clock',
    'pm_overdue': 'lucide:alert-circle',
    'system': 'lucide:bell'
  }
  return iconMap[props.notification.type] || 'lucide:bell'
})

const priorityClass = computed(() => {
  return `priority-${props.notification.priority}`
})

const relativeTime = computed(() => {
  const date = new Date(props.notification.created_at)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return 'เมื่อสักครู่'
  if (minutes < 60) return `${minutes} นาทีที่แล้ว`
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`
  if (days < 7) return `${days} วันที่แล้ว`
  
  return date.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  })
})
</script>

<style scoped>
.notification-item {
  display: flex;
  gap: 12px;
  padding: 12px 20px;
  cursor: pointer;
  transition: background-color 0.2s;
  position: relative;
}

.notification-item:hover {
  background-color: #f9fafb;
}

.notification-item.unread {
  background-color: #eff6ff;
}

.notification-item.unread:hover {
  background-color: #dbeafe;
}

.icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: #e5e7eb;
}

.priority-critical .icon {
  background-color: #fee2e2;
  color: #dc2626;
}

.priority-high .icon {
  background-color: #fed7aa;
  color: #ea580c;
}

.priority-medium .icon {
  background-color: #dbeafe;
  color: #2563eb;
}

.priority-low .icon {
  background-color: #e5e7eb;
  color: #6b7280;
}

.content {
  flex: 1;
  min-width: 0;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 4px;
}

.title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.time {
  font-size: 12px;
  color: #9ca3af;
  white-space: nowrap;
}

.message {
  margin: 0;
  font-size: 13px;
  color: #6b7280;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.metadata {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.tag {
  display: inline-block;
  padding: 2px 8px;
  background-color: #f3f4f6;
  color: #6b7280;
  font-size: 11px;
  border-radius: 4px;
  font-weight: 500;
}

.unread-dot {
  position: absolute;
  top: 50%;
  right: 12px;
  transform: translateY(-50%);
  width: 8px;
  height: 8px;
  background-color: #3b82f6;
  border-radius: 50%;
}
</style>
