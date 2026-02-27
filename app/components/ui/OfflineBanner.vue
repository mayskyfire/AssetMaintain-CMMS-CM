<template>
  <Transition name="banner">
    <div
      v-if="!online"
      class="fixed top-0 left-0 right-0 z-[60] bg-[#fe9a00] text-white px-4 py-2 text-center text-[12px] font-bold"
    >
      <Icon name="lucide:wifi-off" size="16" class="inline mr-2" />
      ไม่มีการเชื่อมต่ออินเทอร์เน็ต - ข้อมูลจะถูกบันทึกในเครื่อง
    </div>
  </Transition>
</template>

<script setup lang="ts">
const { isOnline: online } = useNetworkStatus()
</script>

<style scoped>
.banner-enter-active,
.banner-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}
.banner-enter-from,
.banner-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>
