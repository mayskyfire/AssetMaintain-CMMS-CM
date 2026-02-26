<template>
  <div class="min-h-screen bg-slate-50">
    <LayoutMobileHeader title="โปรไฟล์" />
    
    <div class="p-4 space-y-4 pb-24">
      <!-- User Info -->
      <UiCard class-name="p-6">
        <div class="flex flex-col items-center mb-6">
          <div class="w-20 h-20 bg-gradient-to-br from-[#fe9a00] to-[#e68900] rounded-full flex items-center justify-center mb-3">
            <Icon name="lucide:user" size="40" class="text-white" />
          </div>
          <h2 class="text-[18px] font-bold text-slate-800 mb-1">หัวหน้างาน</h2>
          <p class="text-[13px] text-slate-500">Supervisor</p>
        </div>

        <div class="h-px bg-slate-200 mb-4" />

        <div class="space-y-3">
          <div class="flex items-center gap-3">
            <Icon name="lucide:mail" size="20" class="text-slate-500" />
            <div>
              <p class="text-[11px] text-slate-500">อีเมล</p>
              <p class="text-[13px] text-slate-800">supervisor@aircm.com</p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <Icon name="lucide:phone" size="20" class="text-slate-500" />
            <div>
              <p class="text-[11px] text-slate-500">เบอร์โทรศัพท์</p>
              <p class="text-[13px] text-slate-800">089-234-5678</p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <Icon name="lucide:building" size="20" class="text-slate-500" />
            <div>
              <p class="text-[11px] text-slate-500">แผนก</p>
              <p class="text-[13px] text-slate-800">ฝ่ายซ่อมบำรุง</p>
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
            <p class="text-[24px] font-bold text-[#fe9a00]">8</p>
            <p class="text-[11px] text-slate-500">รอมอบหมาย</p>
          </div>
          <div class="text-center">
            <p class="text-[24px] font-bold text-[#00a6ff]">12</p>
            <p class="text-[11px] text-slate-500">กำลังดำเนินการ</p>
          </div>
          <div class="text-center">
            <p class="text-[24px] font-bold text-[#6dd400]">45</p>
            <p class="text-[11px] text-slate-500">เสร็จสิ้น</p>
          </div>
        </div>
      </UiCard>

      <!-- Logout -->
      <UiButton
        variant="danger"
        size="large"
        full-width
        icon="lucide:log-out"
        @click="router.push('/')"
      >
        ออกจากระบบ
      </UiButton>

      <p class="text-center text-[11px] text-slate-300">AssetMaintain CM v1.0.0</p>
    </div>

    <LayoutBottomNav role="supervisor" />
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
</script>
