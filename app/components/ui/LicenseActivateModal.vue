<template>
  <UiModal
    :is-open="showActivateModal"
    title="กรอก License Key"
    :show-actions="false"
    @close="closeActivateModal"
  >
    <template #icon>
      <div class="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
        <Icon name="lucide:key-round" class="w-8 h-8 text-[var(--primary)]" />
      </div>
    </template>

    <template #default>
      <div class="space-y-4 mt-2">
        <p class="text-[13px] text-slate-600 text-center">
          กรอก License Key เพื่อปลดล็อกการใช้งาน
        </p>

        <div>
          <input
            v-model="licenseKey"
            type="text"
            placeholder="CMMS-LIC-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            class="w-full px-3 py-2.5 border rounded-[10px] text-[13px] focus:outline-none focus:ring-2 transition-all"
            :class="errorMessage ? 'border-[#ff3b30] focus:ring-[#ff3b30]' : 'border-slate-300 focus:ring-[#00a6ff]'"
            @input="errorMessage = ''"
            @keyup.enter="handleActivate"
          />
          <p v-if="errorMessage" class="text-[11px] text-[#ff3b30] mt-1.5">
            {{ errorMessage }}
          </p>
        </div>

        <div class="flex gap-2 pt-2">
          <UiButton
            variant="secondary"
            size="large"
            full-width
            :disabled="activating"
            @click="closeActivateModal"
          >
            ยกเลิก
          </UiButton>
          <UiButton
            variant="primary"
            size="large"
            full-width
            :disabled="!licenseKey.trim() || activating"
            @click="handleActivate"
          >
            {{ activating ? 'กำลังตรวจสอบ...' : 'ยืนยัน' }}
          </UiButton>
        </div>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
const { showActivateModal, closeActivateModal, activateLicense } = useLicense()
const { success: showSuccess } = useToast()

const licenseKey = ref('')
const errorMessage = ref('')
const activating = ref(false)

watch(showActivateModal, (val) => {
  if (val) {
    licenseKey.value = ''
    errorMessage.value = ''
    activating.value = false
  }
})

const handleActivate = async () => {
  const key = licenseKey.value.trim()
  if (!key || activating.value) return

  activating.value = true
  errorMessage.value = ''

  try {
    await activateLicense(key)
    showSuccess('เปิดใช้งาน License สำเร็จ', 'ระบบพร้อมใช้งานเต็มรูปแบบแล้ว')
  } catch (error: any) {
    errorMessage.value = error?.message || 'ไม่สามารถเปิดใช้งานได้ กรุณาลองใหม่'
  } finally {
    activating.value = false
  }
}
</script>
