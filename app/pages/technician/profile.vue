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
            <div class="w-20 h-20 bg-gradient-to-br from-[#6dd400] to-[#5cb800] rounded-full flex items-center justify-center mb-3">
              <Icon name="lucide:user" size="40" class="text-white" />
            </div>
            <h2 class="text-[18px] font-bold text-slate-800 mb-1">{{ user?.full_name || 'ช่างเทคนิค' }}</h2>
            <p class="text-[13px] text-slate-500 mb-3">{{ user?.role || 'Technician' }}</p>
            
            <div v-if="user?.specialties" class="flex gap-2 flex-wrap justify-center">
              <UiBadge 
                v-for="specialty in user.specialties.split(',')" 
                :key="specialty"
                :label="specialty.trim()" 
                variant="primary" 
                size="small" 
              />
            </div>
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

            <div v-if="user?.specialties" class="flex items-center gap-3">
              <Icon name="lucide:wrench" size="20" class="text-slate-500" />
              <div>
                <p class="text-[11px] text-slate-500">ความเชี่ยวชาญ</p>
                <p class="text-[13px] text-slate-800">{{ user.specialties }}</p>
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
          <h3 class="text-[13px] font-bold text-slate-800 mb-3">สถิติการซ่อม</h3>
          <div class="grid grid-cols-3 gap-4 mb-4">
            <div class="text-center">
              <p class="text-[24px] font-bold text-[#fe9a00]">{{ stats?.total_assigned || 0 }}</p>
              <p class="text-[11px] text-slate-500">ได้รับมอบหมาย</p>
            </div>
            <div class="text-center">
              <p class="text-[24px] font-bold text-[#00a6ff]">{{ stats?.total_in_progress || 0 }}</p>
              <p class="text-[11px] text-slate-500">กำลังซ่อม</p>
            </div>
            <div class="text-center">
              <p class="text-[24px] font-bold text-[#6dd400]">{{ stats?.total_completed || 0 }}</p>
              <p class="text-[11px] text-slate-500">เสร็จสิ้น</p>
            </div>
          </div>

          <div v-if="stats" class="space-y-2">
            <div class="h-px bg-slate-200" />

            <div class="flex items-center justify-between pt-2">
              <span class="text-[12px] text-slate-500">เวลาเฉลี่ยต่องาน</span>
              <span class="text-[14px] font-bold text-slate-800">{{ stats.avg_completion_time || '-' }} ชม.</span>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-[12px] text-slate-500">คะแนนเฉลี่ย</span>
              <span class="text-[14px] font-bold text-[#6dd400]">{{ stats.avg_rating || '-' }}/5</span>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-[12px] text-slate-500">งานเสร็จเดือนนี้</span>
              <span class="text-[14px] font-bold text-slate-800">{{ stats.completed_this_month || 0 }}</span>
            </div>
          </div>
        </UiCard>

        <!-- Logout -->
        <UiButton
          variant="danger"
          size="large"
          full-width
          icon="lucide:log-out"
          @click="handleLogout"
        >
          ออกจากระบบ
        </UiButton>

        <p class="text-center text-[11px] text-slate-300">AssetMaintain CM v1.0.0</p>
      </template>
    </div>

    <LayoutBottomNav role="technician" />
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const { user, logout } = useAuth()
const { getStats } = useTechnicianService()
const { stats, loading } = useTechnicianState()
const { success } = useToast()

// Load stats on mount
onMounted(async () => {
  try {
    await getStats()
  } catch (error) {
    console.error('Failed to load stats:', error)
  }
})

// Handle logout
const handleLogout = async () => {
  try {
    await logout()
    success('ออกจากระบบสำเร็จ')
    router.push('/')
  } catch (error) {
    console.error('Logout failed:', error)
    router.push('/')
  }
}
</script>
