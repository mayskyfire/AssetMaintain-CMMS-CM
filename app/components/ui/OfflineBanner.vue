<template>
  <div
    v-if="!isOnline"
    class="fixed top-0 left-0 right-0 z-[60] bg-[#fe9a00] text-white px-4 py-2 text-center text-[12px] font-bold"
  >
    <Icon name="lucide:wifi-off" size="16" class="inline mr-2" />
    ไม่มีการเชื่อมต่ออินเทอร์เน็ต - ข้อมูลจะถูกบันทึกในเครื่อง
  </div>
</template>

<script setup lang="ts">
interface Props {
  isOnline?: boolean
}

withDefaults(defineProps<Props>(), {
  isOnline: true
})
</script>
