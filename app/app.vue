<template>
  <div class="min-h-screen bg-slate-50">
    <!-- Global App Loader -->
    <UiAppLoader 
      :is-loading="isAppLoading" 
      :progress="loadingProgress" 
      :loading-text="loadingTextGen" 
    />
    
    <UiOfflineBanner />
    <ClientOnly>
      <UiLicenseBanner />
    </ClientOnly>
    <NuxtRouteAnnouncer />
    <NuxtPage :transition="{ name: 'page', mode: 'out-in' }" />
    <UiToastContainer />
    <ClientOnly>
      <UiPwaInstallBanner />
      <UiLicenseActivateModal />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
// Import global CSS
import '~/assets/css/main.css'

// App loading state - start with loading
const isAppLoading = ref(true)
const loadingProgress = ref(0)
const loadingTextGen = ref('กำลังเริ่มต้นระบบ...')

// Initialize app on client side only
onMounted(async () => {
  try {
    // Ensure loader is visible
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Step 1: Initialize authentication (0-40%)
    loadingTextGen.value = 'กำลังตรวจสอบการเข้าสู่ระบบ...'
    loadingProgress.value = 10
    
    const { loadUserFromStorage, isAuthenticated } = useAuth()
    await loadUserFromStorage()
    
    loadingProgress.value = 30
    
    // Small delay for smooth UX
    await new Promise(resolve => setTimeout(resolve, 200))
    
    loadingProgress.value = 40
    
    // Step 2: Load initial data if authenticated (40-80%)
    if (isAuthenticated()) {
      loadingTextGen.value = 'กำลังโหลดข้อมูลผู้ใช้...'
      loadingProgress.value = 50
      
      // Wait a bit to ensure data is loaded
      await new Promise(resolve => setTimeout(resolve, 300))
      
      loadingProgress.value = 70
      
      loadingTextGen.value = 'กำลังเตรียมข้อมูล...'
      await new Promise(resolve => setTimeout(resolve, 200))
      
      loadingProgress.value = 80
    } else {
      // Not authenticated, skip to finalize
      loadingProgress.value = 80
    }
    
    // Step 3: Finalize (80-100%)
    loadingTextGen.value = 'เกือบเสร็จแล้ว...'
    loadingProgress.value = 90
    
    await new Promise(resolve => setTimeout(resolve, 200))
    
    loadingProgress.value = 100
    
    // Wait for 100% animation to complete
    await new Promise(resolve => setTimeout(resolve, 400))
    
    // Hide loader
    isAppLoading.value = false
    
  } catch (error) {
    console.error('App initialization error:', error)
    // Still hide loader even on error
    loadingProgress.value = 100
    await new Promise(resolve => setTimeout(resolve, 400))
    isAppLoading.value = false
  }
})
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