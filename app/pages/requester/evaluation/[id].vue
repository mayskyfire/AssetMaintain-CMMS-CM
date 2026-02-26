<template>
  <div class="min-h-screen bg-slate-50">
    <LayoutMobileHeader title="ประเมินผลการซ่อม" :show-back="true" />

    <div class="p-4 space-y-4 pb-24">
      <UiCard class-name="p-4 bg-[#dbeafe]">
        <span class="text-[13px] font-bold text-[#00a6ff]">{{ id }}</span>
        <h2 class="text-[14px] font-bold text-slate-800 mt-1">
          เครื่องปรับอากาศ AC-001
        </h2>
      </UiCard>

      <!-- Rating -->
      <UiCard class-name="p-6">
        <h3 class="text-[16px] font-bold text-slate-800 text-center mb-4">
          ความพึงพอใจในการซ่อม
        </h3>

        <div class="flex justify-center gap-2 mb-6">
          <button
            v-for="star in 5"
            :key="star"
            @click="rating = star"
            class="transition-transform active:scale-90"
          >
            <Icon
              name="lucide:star"
              size="48"
              :class="[
                star <= rating
                  ? 'fill-[#fe9a00] text-[#fe9a00]'
                  : 'fill-none text-slate-300'
              ]"
            />
          </button>
        </div>

        <p class="text-center text-[14px] text-slate-600">
          {{ getRatingText(rating) }}
        </p>
      </UiCard>

      <!-- Comment -->
      <UiCard class-name="p-4">
        <UiTextarea
          v-model="comment"
          label="ความคิดเห็นเพิ่มเติม (ถ้ามี)"
          placeholder="แบ่งปันความคิดเห็นของคุณเกี่ยวกับการซ่อม..."
          :rows="5"
        />
      </UiCard>

      <!-- Quick Comments -->
      <div>
        <h3 class="text-[13px] font-bold text-slate-800 mb-3">คำแนะนำด่วน</h3>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="tag in quickTags"
            :key="tag"
            @click="addQuickTag(tag)"
            class="px-3 py-1.5 bg-white border border-slate-200 rounded-full text-[12px] text-slate-600 hover:border-[#00a6ff] hover:text-[#00a6ff] transition-colors"
          >
            {{ tag }}
          </button>
        </div>
      </div>

      <UiButton
        variant="success"
        size="large"
        full-width
        icon="lucide:thumbs-up"
        :disabled="rating === 0"
        @click="handleSubmit"
      >
        ส่งการประเมิน
      </UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const route = useRoute()
const id = route.params.id as string

const rating = ref(0)
const comment = ref('')

const quickTags = [
  'ซ่อมเร็ว',
  'ช่างมีฝีมือ',
  'สุภาพดี',
  'แก้ปัญหาได้ดี',
  'ทำความสะอาดหลังซ่อม'
]

const getRatingText = (value: number) => {
  const texts: Record<number, string> = {
    0: 'แตะดาวเพื่อให้คะแนน',
    1: 'ไม่พอใจมาก',
    2: 'ไม่พอใจ',
    3: 'ปานกลาง',
    4: 'พอใจ',
    5: 'พอใจมาก'
  }
  return texts[value] || ''
}

const addQuickTag = (tag: string) => {
  if (comment.value) {
    comment.value += `, ${tag}`
  } else {
    comment.value = tag
  }
}

const { success: showSuccess, error: showError } = useToast()

const handleSubmit = () => {
  if (rating.value === 0) {
    showError('กรุณาให้คะแนนก่อนส่งประเมิน')
    return
  }
  
  if (!comment.value || comment.value.trim().length < 5) {
    showError('กรุณาระบุความคิดเห็นอย่างน้อย 5 ตัวอักษร')
    return
  }
  
  showSuccess('ส่งการประเมินเรียบร้อยแล้ว', 'ขอบคุณสำหรับความคิดเห็น')
  
  setTimeout(() => {
    router.push('/requester/notifications')
  }, 1000)
}
</script>
