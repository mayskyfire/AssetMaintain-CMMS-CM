<template>
  <div class="min-h-screen bg-gradient-to-br from-[#00a6ff] to-[#0084d1] flex items-center justify-center p-4">
    <div class="w-full max-w-md space-y-6">
      <!-- Logo -->
      <div class="text-center">
        <div class="bg-white rounded-[20px] w-20 h-20 flex items-center justify-center mx-auto mb-4 shadow-lg">
          <span class="text-[32px]">🔧</span>
        </div>
        <h1 class="text-[28px] font-bold text-white mb-2">AssetMaintain CM</h1>
        <p class="text-[14px] text-white/80">Corrective Maintenance System</p>
      </div>

      <!-- Login Card -->
      <UiCard class-name="p-6">
        <h2 class="text-[20px] font-bold text-slate-800 mb-6 text-center">เข้าสู่ระบบ</h2>

        <div class="space-y-4">
          <UiInput
            v-model="username"
            label="ชื่อผู้ใช้"
            placeholder="กรอกชื่อผู้ใช้"
            icon="lucide:user"
          />

          <UiInput
            v-model="password"
            label="รหัสผ่าน"
            placeholder="กรอกรหัสผ่าน"
            type="password"
            icon="lucide:lock"
          />

          <!-- Role Selection -->
          <div class="space-y-2">
            <label class="block text-[13px] font-bold text-slate-800">บทบาท</label>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="roleOption in roles"
                :key="roleOption.value"
                @click="role = roleOption.value"
                :class="[
                  'px-3 py-2 rounded-[8px] text-[12px] font-bold transition-all',
                  role === roleOption.value
                    ? 'bg-[#00a6ff] text-white'
                    : 'bg-slate-100 text-slate-500'
                ]"
              >
                {{ roleOption.label }}
              </button>
            </div>
          </div>

          <UiButton
            variant="primary"
            size="large"
            full-width
            icon="lucide:log-in"
            :disabled="loading"
            @click="handleLogin"
          >
            {{ loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ' }}
          </UiButton>
        </div>
      </UiCard>

      <p class="text-center text-[12px] text-white/60">
        AssetMaintain CM v1.0 • PWA Offline-First
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const { login } = useAuth()
const { success: showSuccess, error: showError } = useToast()

const username = ref('')
const password = ref('')
const role = ref<'requester' | 'supervisor' | 'technician'>('requester')
const loading = ref(false)

const roles = [
  { value: 'requester', label: 'ผู้แจ้งซ่อม' },
  { value: 'supervisor', label: 'หัวหน้างาน' },
  { value: 'technician', label: 'ช่างซ่อม' }
]

const handleLogin = async () => {
  // Validation
  if (!username.value || !password.value) {
    showError('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน')
    return
  }

  loading.value = true

  try {
    const response = await login({
      email: username.value,
      password: password.value
    })
    
    if (response.user) {
      showSuccess('เข้าสู่ระบบสำเร็จ')

      // Navigate based on user role from API response
      const userRole = response.user.role

      switch (userRole) {
        case 'requester':
          router.push('/requester/')
          break
        case 'technician':
          router.push('/technician/jobs')
          break
        case 'planner':
        case 'engineer':
          router.push('/supervisor/inbox')
          break
        default:
          router.push('/requester/')
      }
    }
  } catch (error: any) {
    showError(error.message || 'เข้าสู่ระบบไม่สำเร็จ')
  } finally {
    loading.value = false
  }
}
</script>
