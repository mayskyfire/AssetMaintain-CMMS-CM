<template>
  <div class="min-h-screen bg-slate-50">
    <LayoutMobileHeader title="การแจ้งเตือน" :show-back="true" />

    <div class="p-4 space-y-4 pb-24">
      <!-- Actions Bar -->
      <div class="flex items-center justify-between">
        <div class="flex gap-2">
          <!-- Filter Buttons -->
          <button
            @click="filters.isRead = ''"
            :class="[
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              filters.isRead === '' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white text-slate-600 border border-slate-200'
            ]"
          >
            ทั้งหมด
          </button>
          <button
            @click="filters.isRead = 'false'"
            :class="[
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              filters.isRead === 'false' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white text-slate-600 border border-slate-200'
            ]"
          >
            ยังไม่อ่าน
          </button>
        </div>

        <button
          v-if="unreadCount > 0"
          @click="handleMarkAllRead"
          class="px-3 py-1.5 rounded-lg text-sm font-medium bg-white text-blue-500 border border-blue-200 hover:bg-blue-50 transition-colors"
        >
          อ่านทั้งหมด
        </button>
      </div>

      <!-- Notifications List -->
      <div v-if="loading" class="flex justify-center py-12">
        <UiLoading />
      </div>

      <div v-else-if="notifications.length === 0" class="flex flex-col items-center justify-center py-16">
        <Icon name="lucide:bell-off" size="64" class="text-slate-300 mb-4" />
        <h3 class="text-lg font-semibold text-slate-600 mb-2">ไม่มีการแจ้งเตือน</h3>
        <p class="text-sm text-slate-400">คุณไม่มีการแจ้งเตือนในขณะนี้</p>
      </div>

      <div v-else class="space-y-2">
        <UiNotificationItem
          v-for="notification in notifications"
          :key="notification.id"
          :notification="notification"
          @click="handleNotificationClick(notification)"
        />
      </div>

      <!-- Pagination -->
      <div v-if="pagination.totalPages > 1" class="flex items-center justify-center gap-4 pt-4">
        <button
          @click="goToPage(pagination.page - 1)"
          :disabled="pagination.page === 1"
          class="w-10 h-10 flex items-center justify-center rounded-lg bg-white border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
        >
          <Icon name="lucide:chevron-left" :size="20" />
        </button>

        <span class="text-sm text-slate-600 font-medium">
          {{ pagination.page }} / {{ pagination.totalPages }}
        </span>

        <button
          @click="goToPage(pagination.page + 1)"
          :disabled="pagination.page === pagination.totalPages"
          class="w-10 h-10 flex items-center justify-center rounded-lg bg-white border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
        >
          <Icon name="lucide:chevron-right" :size="20" />
        </button>
      </div>
    </div>

    <!-- Bottom Navigation -->
    <LayoutBottomNav />
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
