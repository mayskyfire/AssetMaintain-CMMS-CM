<template>
  <div class="min-h-screen bg-slate-50">
    <LayoutMobileHeader title="รับงานซ่อม" :show-back="true" />

    <div class="p-4 space-y-4 pb-24">
      <!-- Job Details Card -->
      <UiCard class-name="p-4">
        <div class="flex items-start justify-between mb-3">
          <span class="text-[16px] font-bold text-[#00a6ff]">{{ jobId }}</span>
          <UiBadge label="Priority 2" variant="primary" size="small" />
        </div>

        <h2 class="text-[18px] font-bold text-slate-800 mb-4">
          เครื่องปรับอากาศ AC-02
        </h2>

        <div class="grid grid-cols-2 gap-3 mb-4">
          <div class="flex items-start gap-2">
            <Icon name="lucide:map-pin" class="w-4 h-4 text-slate-500 shrink-0 mt-1" />
            <div>
              <p class="text-[11px] text-slate-500">สถานที่</p>
              <p class="text-[13px] text-slate-800 font-bold">อาคาร B ชั้น 3</p>
            </div>
          </div>

          <div class="flex items-start gap-2">
            <Icon name="lucide:clock" class="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <span class="text-[13px] text-slate-500">
              ได้รับมอบหมายเมื่อ: 21 ม.ค. 2026 14:30
            </span>
          </div>
        </div>

        <div class="h-px bg-slate-200 my-4"></div>

        <div class="bg-slate-50 rounded-[10px] p-3">
          <h3 class="text-[13px] font-bold text-slate-800 mb-2">รายละเอียดปัญหา</h3>
          <p class="text-[13px] text-slate-600">
            แอร์ไม่เย็น มีน้ำหยดจากตัวเครื่อง
          </p>
        </div>

        <div class="h-px bg-slate-200 my-4"></div>

        <div>
          <h3 class="text-[13px] font-bold text-slate-800 mb-2">ประเภทการแจ้ง</h3>
          <UiBadge label="Z2 - ผิดปกติ" variant="primary" size="medium" />
        </div>
      </UiCard>

      <!-- Note Card -->
      <UiCard class-name="p-4 bg-blue-100">
        <h3 class="text-[14px] font-bold text-slate-800 mb-2">หมายเหตุ</h3>
        <p class="text-[12px] text-slate-600">
          กรุณาตรวจสอบอุปกรณ์และเริ่มงานภายใน 2 ชั่วโมงหลังจากรับงาน
        </p>
      </UiCard>

      <!-- Action Buttons -->
      <div class="space-y-3">
        <UiButton
          variant="primary"
          size="large"
          full-width
          @click="handleAccept"
        >
          รับงานและเริ่มซ่อม
        </UiButton>

        <UiButton
          variant="secondary"
          size="large"
          full-width
          @click="router.push('/technician/jobs')"
        >
          ยกเลิก
        </UiButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()

const jobId = computed(() => route.params.id as string)

const { success: showSuccess } = useToast()

const handleAccept = () => {
  showSuccess('รับงานสำเร็จ', 'เริ่มทำงานได้เลย')
  
  setTimeout(() => {
    router.push(`/technician/worklog/${jobId.value}`)
  }, 800)
}
</script>
