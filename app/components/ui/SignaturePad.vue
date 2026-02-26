<template>
  <div class="signature-pad-wrapper">
    <!-- Signature Preview (when signed) -->
    <div v-if="signatureData && !isEditing" class="relative">
      <img
        :src="signatureData"
        alt="ลายเซ็น"
        class="w-full h-32 object-contain bg-white rounded-[10px] border-2 border-[#6dd400]"
      />
      <div class="flex gap-2 mt-2">
        <button
          @click="isEditing = true"
          class="flex-1 py-2 text-[12px] font-bold text-[#00a6ff] bg-blue-50 rounded-lg active:bg-blue-100 transition-colors"
        >
          แก้ไข
        </button>
        <button
          @click="clearSignature"
          class="flex-1 py-2 text-[12px] font-bold text-[#ef4444] bg-red-50 rounded-lg active:bg-red-100 transition-colors"
        >
          ล้าง
        </button>
      </div>
    </div>

    <!-- Drawing Area -->
    <div v-else>
      <div class="relative">
        <canvas
          ref="canvasRef"
          class="w-full h-40 bg-white rounded-[10px] border-2 border-dashed border-slate-300 touch-none"
          @pointerdown="startDrawing"
          @pointermove="draw"
          @pointerup="stopDrawing"
          @pointerleave="stopDrawing"
        />
        <!-- Placeholder text -->
        <p
          v-if="!hasDrawn"
          class="absolute inset-0 flex items-center justify-center text-[13px] text-slate-400 pointer-events-none"
        >
          วาดลายเซ็นที่นี่
        </p>
      </div>
      <div class="flex gap-2 mt-2">
        <button
          @click="clearCanvas"
          class="flex-1 py-2 text-[12px] font-bold text-slate-500 bg-slate-100 rounded-lg active:bg-slate-200 transition-colors"
        >
          ล้างใหม่
        </button>
        <button
          @click="confirmSignature"
          :disabled="!hasDrawn"
          class="flex-1 py-2 text-[12px] font-bold text-white bg-[#6dd400] rounded-lg active:bg-[#5cb800] transition-colors disabled:opacity-40"
        >
          ยืนยันลายเซ็น
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue?: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const isDrawing = ref(false)
const hasDrawn = ref(false)
const isEditing = ref(false)
const signatureData = ref<string | null>(props.modelValue || null)

let ctx: CanvasRenderingContext2D | null = null

const initCanvas = () => {
  const canvas = canvasRef.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr

  ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.scale(dpr, dpr)
  ctx.strokeStyle = '#1e293b'
  ctx.lineWidth = 2.5
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
}

onMounted(() => {
  if (!signatureData.value) {
    nextTick(initCanvas)
  }
})

watch(isEditing, (editing) => {
  if (editing) {
    hasDrawn.value = false
    nextTick(initCanvas)
  }
})

const getPos = (e: PointerEvent) => {
  const canvas = canvasRef.value
  if (!canvas) return { x: 0, y: 0 }
  const rect = canvas.getBoundingClientRect()
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  }
}

const startDrawing = (e: PointerEvent) => {
  if (!ctx) return
  isDrawing.value = true
  hasDrawn.value = true
  const pos = getPos(e)
  ctx.beginPath()
  ctx.moveTo(pos.x, pos.y)
  canvasRef.value?.setPointerCapture(e.pointerId)
}

const draw = (e: PointerEvent) => {
  if (!isDrawing.value || !ctx) return
  const pos = getPos(e)
  ctx.lineTo(pos.x, pos.y)
  ctx.stroke()
}

const stopDrawing = () => {
  isDrawing.value = false
}

const clearCanvas = () => {
  if (!ctx || !canvasRef.value) return
  ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
  hasDrawn.value = false
}

const confirmSignature = () => {
  if (!canvasRef.value) return
  signatureData.value = canvasRef.value.toDataURL('image/png')
  isEditing.value = false
  emit('update:modelValue', signatureData.value)
}

const clearSignature = () => {
  signatureData.value = null
  isEditing.value = false
  hasDrawn.value = false
  emit('update:modelValue', null)
  nextTick(initCanvas)
}
</script>
