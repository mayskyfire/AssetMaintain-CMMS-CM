<template>
  <div class="min-h-screen bg-slate-50">
    <!-- Global App Loader -->
    <UiAppLoader 
      :is-loading="isLoading" 
      :progress="progress" 
      :loading-text="loadingText" 
    />
    
    <UiOfflineBanner />
    <NuxtRouteAnnouncer />
    <NuxtPage :transition="{ name: 'page', mode: 'out-in' }" />
    <UiToastContainer />
    <ClientOnly>
      <UiPwaInstallBanner />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
// Import global CSS
import '~/assets/css/main.css'

const { isLoading, progress, loadingText } = useAppLoader()
</script>

<style>
.page-enter-active,
.page-leave-active {
  transition: opacity 0.1s ease;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
}
</style>