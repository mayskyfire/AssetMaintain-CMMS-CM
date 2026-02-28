<template>
  <div class="min-h-screen bg-slate-50">
    <LayoutMobileHeader title="โปรไฟล์" />
    
    <div class="p-4 space-y-4 pb-24">
      <!-- PWA Install Banner -->
      <UiPwaInstallBanner />

      <!-- Loading State -->
      <UiLoading v-if="loading" />

      <template v-else>
        <!-- User Info -->
        <UiCard class-name="p-6">
          <div class="flex flex-col items-center mb-6">
            <div class="w-20 h-20 bg-gradient-to-br from-[#fe9a00] to-[#e68900] rounded-full flex items-center justify-center mb-3">
              <Icon name="lucide:user" size="40" class="text-white" />
            </div>
            <h2 class="text-[18px] font-bold text-slate-800 mb-1">{{ user?.full_name || 'หัวหน้างาน' }}</h2>
            <p class="text-[13px] text-slate-500">{{ user?.role || 'Supervisor' }}</p>
          </div>

          <div class="h-px bg-slate-200 mb-4" />

          <div class="space-y-3">
            <div class="flex items-center gap-3">
              <Icon name="lucide:mail" size="20" class="text-slate-500" />
              <div>
                <p class="text-[11px] text-slate-500">อีเมล</p>
                <p class="text-[13px] text-slate-800">{{ user?.email || '-' }}</p>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <Icon name="lucide:phone" size="20" class="text-slate-500" />
              <div>
                <p class="text-[11px] text-slate-500">เบอร์โทรศัพท์</p>
                <p class="text-[13px] text-slate-800">{{ user?.phone_number || '-' }}</p>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <Icon name="lucide:building" size="20" class="text-slate-500" />
              <div>
                <p class="text-[11px] text-slate-500">แผนก</p>
                <p class="text-[13px] text-slate-800">{{ user?.department || 'ฝ่ายซ่อมบำรุง' }}</p>
              </div>
            </div>
          </div>
        </UiCard>

        <!-- Settings -->
        <div>
          <h3 class="text-[14px] font-bold text-slate-800 mb-3">การตั้งค่า</h3>
          <UiCard class-name="overflow-hidden">
            <button class="w-full px-4 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div class="flex items-center gap-3">
                <Icon name="lucide:bell" size="20" class="text-slate-500" />
                <span class="text-[14px] text-slate-800">การแจ้งเตือน</span>
              </div>
              <span class="text-[12px] text-slate-500">เปิดใช้งาน</span>
            </button>
          </UiCard>
        </div>

        <!-- Statistics -->
        <UiCard class-name="p-4">
          <h3 class="text-[13px] font-bold text-slate-800 mb-3">สถิติการมอบหมาย</h3>
          <div class="grid grid-cols-3 gap-4">
            <div class="text-center">
              <p class="text-[24px] font-bold text-[#fe9a00]">{{ stats?.total_pending || 0 }}</p>
              <p class="text-[11px] text-slate-500">รอมอบหมาย</p>
            </div>
            <div class="text-center">
              <p class="text-[24px] font-bold text-[#00a6ff]">{{ stats?.total_in_progress || 0 }}</p>
              <p class="text-[11px] text-slate-500">กำลังดำเนินการ</p>
            </div>
            <div class="text-center">
              <p class="text-[24px] font-bold text-[#6dd400]">{{ stats?.total_completed || 0 }}</p>
              <p class="text-[11px] text-slate-500">เสร็จสิ้น</p>
            </div>
          </div>

          <!-- Additional Stats -->
          <div v-if="stats" class="mt-4 pt-4 border-t border-slate-200">
            <div class="grid grid-cols-2 gap-3 text-center">
              <div>
                <p class="text-[18px] font-bold text-red-500">{{ stats.critical_priority || 0 }}</p>
                <p class="text-[11px] text-slate-500">งานเร่งด่วน</p>
              </div>
              <div>
                <p class="text-[18px] font-bold text-slate-700">{{ stats.total_technicians || 0 }}</p>
                <p class="text-[11px] text-slate-500">ช่างทั้งหมด</p>
              </div>
            </div>
          </div>
        </UiCard>

        <!-- Logout -->
        <UiButton
          variant="danger"
          size="large"
          full-width
          icon="lucide:log-out"
          @click="showLogoutModal = true"
        >
          ออกจากระบบ
        </UiButton>

        <p class="text-center text-[11px] text-slate-300">AssetMaintain CM v1.0.0</p>
      </template>
    </div>

    <LayoutBottomNav role="supervisor" />

    <!-- Logout Confirmation Modal -->
    <UiLogoutConfirmModal
      :show="showLogoutModal"
      :loading="loggingOut"
      @cancel="showLogoutModal = false"
      @confirm="handleLogout"
    />
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const { user, logout, loadUserFromStorage } = useAuth()
const { getStats } = useSupervisorService()
const { stats, loading } = useSupervisorState()
const { success } = useToast()

const showLogoutModal = ref(false)
const loggingOut = ref(false)

// Load stats on mount
onMounted(async () => {
  loadUserFromStorage()
  try {
    await getStats()
  } catch (error) {
    console.error('Failed to load stats:', error)
  }
})

// Handle logout
const handleLogout = async () => {
  loggingOut.value = true
  try {
    await logout()
    success('ออกจากระบบสำเร็จ')
    showLogoutModal.value = false
    router.push('/')
  } catch (error) {
    console.error('Logout failed:', error)
    showLogoutModal.value = false
    router.push('/')
  } finally {
    loggingOut.value = false
  }
}
</script>
