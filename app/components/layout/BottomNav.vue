<template>
  <nav class="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 safe-area-inset-bottom">
    <div class="flex items-center justify-around h-[64px] px-4">
      <NuxtLink
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors"
        :class="isActive(item.path) ? 'text-[#00a6ff]' : 'text-slate-500'"
        @click="saveActivePage(item.path)"
      >
        <Icon :name="item.icon" size="24" :class="isActive(item.path) ? 'fill-[#00a6ff]' : ''" />
        <span class="text-[11px] font-medium">{{ item.label }}</span>
      </NuxtLink>
    </div>
  </nav>
</template>

<script setup lang="ts">
interface Props {
  role: 'requester' | 'supervisor' | 'technician'
  activeOverride?: string // Allow parent to override active state
}

const props = defineProps<Props>()
const route = useRoute()

interface NavItem {
  path: string
  icon: string
  label: string
}

const navItems = computed<NavItem[]>(() => {
  if (props.role === 'requester') {
    return [
      { path: '/requester/', icon: 'lucide:home', label: 'หน้าหลัก' },
      { path: '/requester/jobs', icon: 'lucide:list', label: 'ประวัติ' },
      { path: '/requester/profile', icon: 'lucide:user', label: 'โปรไฟล์' }
    ]
  }
  
  if (props.role === 'supervisor') {
    return [
      { path: '/supervisor/', icon: 'lucide:home', label: 'หน้าหลัก' },
      { path: '/supervisor/inbox', icon: 'lucide:menu', label: 'งานใหม่' },
      { path: '/supervisor/spare-approvals', icon: 'lucide:clipboard-list', label: 'อนุมัติอะไหล่' },
      { path: '/supervisor/profile', icon: 'lucide:user', label: 'โปรไฟล์' }
    ]
  }
  
  if (props.role === 'technician') {
    return [
      { path: '/technician/', icon: 'lucide:home', label: 'หน้าหลัก' },
      { path: '/technician/jobs', icon: 'lucide:list', label: 'งานของฉัน' },
      { path: '/technician/profile', icon: 'lucide:user', label: 'โปรไฟล์' }
    ]
  }
  
  return []
})

const isActive = (path: string) => {
  // If activeOverride is provided, use it
  if (props.activeOverride) {
    return props.activeOverride === path || props.activeOverride.startsWith(path)
  }
  
  // Check if current route matches
  if (route.path === path) {
    return true
  }
  
  // For notifications page, check localStorage for last active page
  if (route.path === '/notifications' && typeof window !== 'undefined') {
    try {
      const lastActivePage = localStorage.getItem('lastActivePage')
      return lastActivePage === path || lastActivePage?.startsWith(path)
    } catch (error) {
      console.error('Error accessing localStorage:', error)
      return false
    }
  }
  
  return false
}

const saveActivePage = (path: string) => {
  // Save the clicked page as the last active page
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('lastActivePage', path)
    } catch (error) {
      console.error('Error saving to localStorage:', error)
    }
  }
}
</script>
