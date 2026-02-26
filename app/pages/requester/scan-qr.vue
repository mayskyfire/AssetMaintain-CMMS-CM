<template>
  <div class="min-h-screen bg-slate-50">
    <LayoutMobileHeader title="สแกน QR Code" :show-back="true" />
    
    <div class="p-4 space-y-6">
      <UiCard class-name="p-6 text-center">
        <div class="w-64 h-64 mx-auto bg-slate-100 rounded-[12px] flex items-center justify-center mb-4">
          <Icon name="lucide:qr-code" size="64" class="text-slate-400" />
        </div>
        <p class="text-[14px] text-slate-600 mb-4">
          กรุณาสแกน QR Code บนอุปกรณ์ที่ต้องการแจ้งซ่อม
        </p>
        <UiButton
          variant="primary"
          size="large"
          full-width
          icon="lucide:camera"
          @click="handleOpenCamera"
        >
          เปิดกล้อง
        </UiButton>
      </UiCard>

      <!-- Info -->
      <UiCard class-name="p-4 bg-[#dbeafe]">
        <h4 class="text-[13px] font-bold text-slate-800 mb-2">
          วิธีใช้งาน
        </h4>
        <ol class="text-[12px] text-slate-600 space-y-1 list-decimal list-inside">
          <li>กดปุ่ม "เปิดกล้อง" ด้านบน</li>
          <li>นำกล้องไปส่องที่ QR Code บนอุปกรณ์</li>
          <li>รอระบบอ่านข้อมูลอุปกรณ์</li>
          <li>กรอกรายละเอียดการแจ้งซ่อม</li>
        </ol>
      </UiCard>

      <!-- Manual Entry -->
      <div class="text-center">
        <p class="text-[12px] text-slate-500 mb-2">หรือ</p>
        <button
          @click="router.push('/requester/create-notification')"
          class="text-[14px] text-[#00a6ff] font-bold hover:underline"
        >
          กรอกข้อมูลด้วยตนเอง
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()

const handleOpenCamera = () => {
  // TODO: Implement QR scanner in Phase 2
  // For now, redirect to create notification
  router.push('/requester/create-notification')
}
</script>
