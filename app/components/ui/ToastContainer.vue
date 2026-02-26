<template>
  <Teleport to="body">
    <div class="fixed inset-0 pointer-events-none z-[9999]">
      <TransitionGroup
        name="toast"
        tag="div"
        class="fixed top-20 left-4 right-4 mx-auto max-w-md space-y-2 pointer-events-auto"
      >
        <UiToast
          v-for="toast in toasts"
          :key="toast.id"
          :message="toast.message"
          :title="toast.title"
          :variant="toast.variant"
          :duration="0"
          :closable="toast.closable"
          :position="toast.position"
          @close="remove(toast.id)"
        />
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const { toasts, remove } = useToast()
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>
