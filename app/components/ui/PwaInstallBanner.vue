<template>
  <UiCard v-if="canInstall" class-name="p-4 bg-gradient-to-r from-[#00a6ff] to-[#0084d1]">
    <div class="flex items-start gap-3">
      <div class="w-10 h-10 bg-white/20 rounded-[10px] flex items-center justify-center shrink-0">
        <Icon name="lucide:download" size="20" class="text-white" />
      </div>
      <div class="flex-1">
        <h4 class="text-[13px] font-bold text-white mb-1">ติดตั้งแอป</h4>
        <p class="text-[12px] text-white/80 mb-3">
          ติดตั้งแอปลงในอุปกรณ์เพื่อใช้งานได้เร็วขึ้นและรองรับออฟไลน์
        </p>
        <div class="flex gap-2">
          <button
            @click="handleInstall"
            class="px-4 py-1.5 bg-white text-[#00a6ff] text-[12px] font-bold rounded-lg active:bg-white/90 transition-colors"
          >
            ติดตั้ง
          </button>
          <button
            @click="dismiss"
            class="px-4 py-1.5 text-white/80 text-[12px] font-bold active:text-white transition-colors"
          >
            ไม่ใช่ตอนนี้
          </button>
        </div>
      </div>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
const { canInstall, promptInstall } = usePwaInstall()
const { success: showSuccess } = useToast()

const dismissed = ref(false)

const handleInstall = async () => {
  const accepted = await promptInstall()
  if (accepted) {
    showSuccess('ติดตั้งแอปสำเร็จ')
  }
}

const dismiss = () => {
  dismissed.value = true
}
</script>
