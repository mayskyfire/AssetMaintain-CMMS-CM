<template>
  <div class="min-h-screen bg-slate-50">
    <UiOfflineBanner />
    <NuxtRouteAnnouncer />
    <NuxtPage :transition="{ name: 'page', mode: 'out-in' }" />
    <UiToastContainer />
  </div>
</template>
<script setup lang="ts">
// Import global CSS
import '~/assets/css/main.css';
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