<template>
  <div class="notification-bell">
    <button
      @click="toggleDropdown"
      class="bell-button"
      :class="{ 'has-unread': unreadCount > 0 }"
    >
      <Icon name="lucide:bell" :size="24" />
      <span v-if="unreadCount > 0" class="badge">
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
    </button>

    <Teleport to="body">
      <div
        v-if="isOpen"
        class="notification-dropdown"
        :style="dropdownStyle"
      >
        <div class="dropdown-header">
          <h3>การแจ้งเตือน</h3>
          <button
            v-if="unreadCount > 0"
            @click="handleMarkAllRead"
            class="mark-all-btn"
          >
            อ่านทั้งหมด
          </button>
        </div>

        <div class="dropdown-body">
          <div v-if="loading" class="loading">
            <Loading />
          </div>

          <div v-else-if="recentNotifications.length === 0" class="empty">
            <Icon name="lucide:bell-off" :size="48" />
            <p>ไม่มีการแจ้งเตือน</p>
          </div>

          <div v-else class="notification-list">
            <NotificationItem
              v-for="notification in recentNotifications"
              :key="notification.id"
              :notification="notification"
              @click="handleNotificationClick(notification)"
            />
          </div>
        </div>

        <div class="dropdown-footer">
          <NuxtLink to="/notifications" class="view-all-btn" @click="closeDropdown">
            ดูทั้งหมด
          </NuxtLink>
        </div>
      </div>
    </Teleport>

    <!-- Backdrop -->
    <div
      v-if="isOpen"
      class="backdrop"
      @click="closeDropdown"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const isOpen = ref(false)
const buttonRef = ref<HTMLElement | null>(null)
const dropdownStyle = ref({})

const { 
  recentNotifications, 
  unreadCount, 
  loading,
  fetchNotifications,
  fetchUnreadCount,
  markAsRead,
  markAllAsRead
} = useNotifications()

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
  
  if (isOpen.value) {
    calculateDropdownPosition()
    fetchNotifications({ limit: 10 })
  }
}

const closeDropdown = () => {
  isOpen.value = false
}


const calculateDropdownPosition = () => {
  if (!buttonRef.value) return
  
  const rect = buttonRef.value.getBoundingClientRect()
  dropdownStyle.value = {
    position: 'fixed',
    top: `${rect.bottom + 8}px`,
    right: `${window.innerWidth - rect.right}px`,
    zIndex: 1000
  }
}

const handleNotificationClick = async (notification: any) => {
  // Mark as read
  if (!notification.is_read) {
    await markAsRead(notification.id)
  }

  // Navigate to reference
  if (notification.reference_type === 'cm_history' && notification.reference_id) {
    navigateTo(`/cm/${notification.reference_id}`)
  }

  closeDropdown()
}

const handleMarkAllRead = async () => {
  await markAllAsRead()
}

// Fetch unread count on mount
onMounted(() => {
  fetchUnreadCount()
})

// Close dropdown on escape
const handleEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
})
</script>

<style scoped>
.notification-bell {
  position: relative;
}

.bell-button {
  position: relative;
  padding: 8px;
  background: transparent;
  border: none;
  cursor: pointer;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.bell-button:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.bell-button.has-unread {
  animation: ring 2s ease-in-out infinite;
}

@keyframes ring {
  0%, 100% { transform: rotate(0deg); }
  10%, 30% { transform: rotate(-10deg); }
  20%, 40% { transform: rotate(10deg); }
}

.badge {
  position: absolute;
  top: 4px;
  right: 4px;
  background-color: #ef4444;
  color: white;
  font-size: 10px;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
}

.notification-dropdown {
  width: 400px;
  max-height: 600px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.dropdown-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.mark-all-btn {
  background: transparent;
  border: none;
  color: #3b82f6;
  font-size: 14px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.mark-all-btn:hover {
  background-color: rgba(59, 130, 246, 0.1);
}

.dropdown-body {
  flex: 1;
  overflow-y: auto;
  max-height: 500px;
}

.loading,
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #9ca3af;
}

.empty p {
  margin-top: 12px;
  font-size: 14px;
}

.notification-list {
  padding: 8px 0;
}

.dropdown-footer {
  padding: 12px 20px;
  border-top: 1px solid #e5e7eb;
  text-align: center;
}

.view-all-btn {
  color: #3b82f6;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
}

.view-all-btn:hover {
  text-decoration: underline;
}

.backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
  z-index: 999;
}

@media (max-width: 640px) {
  .notification-dropdown {
    width: calc(100vw - 32px);
    max-width: 400px;
  }
}
</style>
