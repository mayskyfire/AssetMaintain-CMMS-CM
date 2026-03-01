<template>
  <div class="min-h-screen bg-slate-50">
    <LayoutMobileHeader title="การแจ้งเตือน" :show-back="true" />

    <div class="p-4 space-y-4 pb-24">
      <!-- Stats Card -->
      <UiCard class-name="p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-[11px] text-slate-500 mb-1">การแจ้งเตือนทั้งหมด</p>
            <p class="text-[24px] font-bold text-slate-800">{{ pagination.total }}</p>
          </div>
          <div class="text-right">
            <p class="text-[11px] text-slate-500 mb-1">ยังไม่อ่าน</p>
            <p class="text-[24px] font-bold text-[#00a6ff]">{{ unreadCount }}</p>
          </div>
        </div>
      </UiCard>

      <!-- Filter Tabs -->
      <div class="flex items-center gap-2">
        <button
          @click="filters.isRead = ''"
          :class="[
            'flex-1 px-4 py-2.5 rounded-[10px] text-[13px] font-bold transition-all',
            filters.isRead === '' 
              ? 'bg-[#00a6ff] text-white shadow-sm' 
              : 'bg-white text-slate-600 border border-slate-200'
          ]"
        >
          ทั้งหมด
        </button>
        <button
          @click="filters.isRead = 'false'"
          :class="[
            'flex-1 px-4 py-2.5 rounded-[10px] text-[13px] font-bold transition-all relative',
            filters.isRead === 'false' 
              ? 'bg-[#00a6ff] text-white shadow-sm' 
              : 'bg-white text-slate-600 border border-slate-200'
          ]"
        >
          ยังไม่อ่าน
          <span v-if="unreadCount > 0" class="absolute -top-1 -right-1 w-5 h-5 bg-[#ff3b30] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {{ unreadCount > 99 ? '99+' : unreadCount }}
          </span>
        </button>
      </div>

      <!-- Mark All Read Button -->
      <div v-if="unreadCount > 0 && filters.isRead === 'false'" class="flex justify-end">
        <button
          @click="handleMarkAllRead"
          class="px-4 py-2 rounded-[10px] text-[13px] font-bold bg-white text-[#00a6ff] border border-[#00a6ff] active:bg-blue-50 transition-colors flex items-center gap-2"
        >
          <Icon name="lucide:check-circle" class="w-4 h-4" />
          อ่านทั้งหมด
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-12">
        <UiLoading />
      </div>

      <!-- Empty State -->
      <UiCard v-else-if="notifications.length === 0" class-name="p-8">
        <div class="flex flex-col items-center justify-center text-center">
          <div class="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <Icon name="lucide:bell-off" class="w-10 h-10 text-slate-400" />
          </div>
          <h3 class="text-[16px] font-bold text-slate-800 mb-2">ไม่มีการแจ้งเตือน</h3>
          <p class="text-[13px] text-slate-500">
            {{ filters.isRead === 'false' ? 'คุณอ่านการแจ้งเตือนทั้งหมดแล้ว' : 'คุณไม่มีการแจ้งเตือนในขณะนี้' }}
          </p>
        </div>
      </UiCard>

      <!-- Notifications List -->
      <div v-else class="space-y-2">
        <UiNotificationItem
          v-for="notification in notifications"
          :key="notification.id"
          :notification="notification"
          @click="handleNotificationClick(notification)"
        />
      </div>

      <!-- Pagination -->
      <div v-if="pagination.totalPages > 1" class="flex items-center justify-center gap-3 pt-2">
        <button
          @click="goToPage(pagination.page - 1)"
          :disabled="pagination.page === 1"
          class="w-10 h-10 flex items-center justify-center rounded-[10px] bg-white border border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed active:bg-slate-50 transition-colors"
        >
          <Icon name="lucide:chevron-left" class="w-5 h-5 text-slate-600" />
        </button>

        <div class="flex items-center gap-2">
          <span class="text-[13px] text-slate-600 font-bold">
            หน้า {{ pagination.page }}
          </span>
          <span class="text-[13px] text-slate-400">
            / {{ pagination.totalPages }}
          </span>
        </div>

        <button
          @click="goToPage(pagination.page + 1)"
          :disabled="pagination.page === pagination.totalPages"
          class="w-10 h-10 flex items-center justify-center rounded-[10px] bg-white border border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed active:bg-slate-50 transition-colors"
        >
          <Icon name="lucide:chevron-right" class="w-5 h-5 text-slate-600" />
        </button>
      </div>
    </div>

    <!-- Bottom Navigation -->
    <LayoutBottomNav :role="userRole" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'

const {
  notifications,
  unreadCount,
  loading,
  fetchNotifications,
  markAsRead,
  markAllAsRead
} = useNotifications()

const { user } = useAuth()
const router = useRouter()

// Get user role for BottomNav
const userRole = computed(() => {
  return user.value?.role || 'requester'
})

const filters = reactive({
  isRead: '',
  type: ''
})

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0
})

const loadNotifications = async () => {
  const response = await fetchNotifications({
    page: pagination.page,
    limit: pagination.limit,
    isRead: filters.isRead,
    type: filters.type
  })

  if (response?.pagination) {
    Object.assign(pagination, response.pagination)
  }
}

const handleFilterChange = () => {
  pagination.page = 1
  loadNotifications()
}

const goToPage = (page: number) => {
  pagination.page = page
  loadNotifications()
}

const handleNotificationClick = async (notification: any) => {
  // Mark as read
  if (!notification.is_read) {
    await markAsRead(notification.id)
  }

  // Navigate to reference
  if (notification.reference_type === 'cm_history' && notification.reference_id) {
    const { user } = useAuth()
    const role = user.value?.role
    
    // Navigate based on role
    if (role === 'requester') {
      navigateTo(`/requester/job/${notification.reference_id}`)
    } else if (role === 'technician') {
      navigateTo(`/technician/job-detail/${notification.reference_id}`)
    } else if (role === 'supervisor') {
      navigateTo(`/supervisor/assign/${notification.reference_id}`)
    }
  }
}

const handleMarkAllRead = async () => {
  await markAllAsRead()
  loadNotifications()
}

// Watch filter changes
watch(() => filters.isRead, handleFilterChange)

onMounted(() => {
  loadNotifications()
})
</script>
<style scoped>
/* Mobile-optimized styles - no additional styles needed */
</style>
