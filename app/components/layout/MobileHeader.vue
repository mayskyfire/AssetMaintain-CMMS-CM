<template>
  <header class="sticky top-0 z-50 bg-white border-b border-slate-200">
    <div class="flex items-center justify-between h-[56px] px-4">
      <div class="flex items-center gap-3 flex-1">
        <button
          v-if="showBack"
          @click="handleBack"
          class="w-10 h-10 flex items-center justify-center rounded-[10px] hover:bg-slate-100 active:bg-slate-200 transition-colors"
        >
          <Icon name="lucide:chevron-left" size="24" class="text-slate-800" />
        </button>
        <h1 class="text-[18px] font-bold text-slate-800 truncate">{{ title }}</h1>
      </div>
      <div v-if="$slots.action" class="ml-2">
        <slot name="action" />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
interface Props {
  title: string
  showBack?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showBack: false
})

const router = useRouter()

const handleBack = () => {
  router.back()
}
</script>
