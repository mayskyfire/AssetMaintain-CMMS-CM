<template>
  <div class="min-h-screen bg-gradient-to-br from-[#00a6ff] to-[#0084d1] flex items-center justify-center p-4">
    <div class="w-full max-w-md space-y-6">
      <!-- Logo -->
      <div class="text-center">
        <div class="bg-white rounded-[20px] w-20 h-20 flex items-center justify-center mx-auto mb-4 shadow-lg">
          <img src="/favicon-96x96.png" class="w-100 h-100">
        </div>
        <h1 class="text-[28px] font-bold text-white mb-2">AssetMaintain CM</h1>
        <p class="text-[14px] text-white/80">Corrective Maintenance System</p>
      </div>

      <!-- Login Card -->
      <UiCard class-name="p-6">
        <h2 class="text-[20px] font-bold text-slate-800 mb-6 text-center">เข้าสู่ระบบ</h2>

        <!-- Inline Error Banner -->
        <div
          v-if="errorMessage"
          class="mb-4 px-4 py-3 bg-[#ff3b30]/10 border border-[#ff3b30]/20 rounded-[10px] text-[13px] text-[#ff3b30] font-medium"
        >
          {{ errorMessage }}
        </div>

        <div class="space-y-4">
          <!-- Email -->
          <UiInput
            v-model="username"
            label="อีเมล"
            placeholder="กรอกอีเมล"
            icon="lucide:user"
            :error="fieldErrors.username"
            @keyup.enter="handleLogin"
          />

          <!-- Password with toggle -->
          <div class="space-y-2">
            <label class="block text-[13px] font-bold text-slate-800">รหัสผ่าน</label>
            <div class="relative">
              <div class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Icon name="lucide:lock" size="20" />
              </div>
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="กรอกรหัสผ่าน"
                :class="[
                  'input pl-12 pr-12',
                  fieldErrors.password ? 'border-[#ff3b30] focus:border-[#ff3b30]' : ''
                ]"
                @keyup.enter="handleLogin"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <Icon :name="showPassword ? 'lucide:eye-off' : 'lucide:eye'" size="20" />
              </button>
            </div>
            <p v-if="fieldErrors.password" class="text-[12px] text-[#ff3b30]">
              {{ fieldErrors.password }}
            </p>
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
// Redirect logged-in users before page renders
definePageMeta({
  middleware: [
    function () {
      if (import.meta.server) return
      const { isAuthenticated, getUserInfo } = useAuth()
      if (isAuthenticated()) {
        const user = getUserInfo()
        if (user) {
          switch (user.role) {
            case 'requester': return window.location.href = '/requester/'
            case 'technician': return window.location.href = '/technician/jobs'
            case 'planner':
            case 'engineer': return window.location.href = '/supervisor/inbox'
            default: return window.location.href = '/requester/'
          }
        }
      }
    }
  ]
})

const router = useRouter()
const { login } = useAuth()

const username = ref('')
const password = ref('')
const loading = ref(false)
const showPassword = ref(false)
const errorMessage = ref('')
const fieldErrors = reactive({ username: '', password: '' })

const clearErrors = () => {
  errorMessage.value = ''
  fieldErrors.username = ''
  fieldErrors.password = ''
}

const handleLogin = async () => {
  clearErrors()

  // Field validation
  if (!username.value && !password.value) {
    errorMessage.value = 'กรุณากรอกอีเมลและรหัสผ่าน'
    fieldErrors.username = 'กรุณากรอกอีเมล'
    fieldErrors.password = 'กรุณากรอกรหัสผ่าน'
    return
  }
  if (!username.value) {
    fieldErrors.username = 'กรุณากรอกอีเมล'
    return
  }
  if (!password.value) {
    fieldErrors.password = 'กรุณากรอกรหัสผ่าน'
    return
  }

  loading.value = true

  try {
    const response = await login({
      email: username.value,
      password: password.value
    })

    if (response.user) {
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
    errorMessage.value = error.message || 'เข้าสู่ระบบไม่สำเร็จ'
  } finally {
    loading.value = false
  }
}
</script>
