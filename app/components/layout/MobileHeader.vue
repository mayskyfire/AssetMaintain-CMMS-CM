<template>
  <header class="sticky top-0 z-50 bg-white border-b border-slate-200">
    <div class="flex items-center justify-between h-[56px] px-4">
      <div class="flex items-center gap-3 flex-1">
        <button
          v-if="showBack"
          @click="handleBack"
          class="w-10 h-10 flex items-center justify-center rounded-[10px] hover:bg-slate-100 active:bg-slate-200 transition-colors"
        >
          <Icon name="lucide:chevron-left" size="24" class="text-slate-800" />
        </button>
        <h1 class="text-[18px] font-bold text-slate-800 truncate">{{ title }}</h1>
      </div>
      
      <div class="flex items-center gap-2">
        <!-- Notification Bell -->
        <button
          @click="goToNotifications"
          class="relative w-10 h-10 flex items-center justify-center rounded-[10px] hover:bg-slate-100 active:bg-slate-200 transition-colors"
        >
          <Icon name="lucide:bell" size="22" class="text-slate-700" />
          <span 
            v-if="unreadCount > 0" 
            class="absolute top-1 right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-[#ff3b30] text-white text-[10px] font-bold rounded-full px-1"
          >
            {{ unreadCount > 99 ? '99+' : unreadCount }}
          </span>
        </button>

        <!-- Custom Action Slot -->
        <div v-if="$slots.action">
          <slot name="action" />
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
interface Props {
  title: string
  showBack?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showBack: false
})

const router = useRouter()
const { unreadCount } = useNotifications()
const { initialize } = useNotificationInit()

// Initialize notification system on mount
onMounted(async () => {
  try {
    await initialize()
    // SSE จะ update unread count แบบ real-time แล้ว ไม่ต้อง polling
  } catch (error) {
    console.error('Failed to initialize notifications:', error)
  }
})

const handleBack = () => {
  router.back()
}

const goToNotifications = () => {
  navigateTo('/notifications')
}
</script>
