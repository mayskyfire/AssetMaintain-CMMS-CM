import { ref } from 'vue'

interface ToastOptions {
  message: string
  title?: string
  variant?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  closable?: boolean
  position?: 'top' | 'bottom'
}

interface Toast extends ToastOptions {
  id: number
}

const toasts = ref<Toast[]>([])
let toastId = 0

export const useToast = () => {
  const show = (options: ToastOptions) => {
    const id = toastId++
    const toast: Toast = {
      id,
      variant: 'info',
      duration: 3000,
      closable: true,
      position: 'top',
      ...options
    }
    
    toasts.value.push(toast)
    
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        remove(id)
      }, toast.duration)
    }
    
    return id
  }

  const remove = (id: number) => {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }

  const success = (message: string, title?: string) => {
    return show({ message, title, variant: 'success' })
  }

  const error = (message: string, title?: string) => {
    return show({ message, title, variant: 'error' })
  }

  const warning = (message: string, title?: string) => {
    return show({ message, title, variant: 'warning' })
  }

  const info = (message: string, title?: string) => {
    return show({ message, title, variant: 'info' })
  }

  const clear = () => {
    toasts.value = []
  }

  return {
    toasts: readonly(toasts),
    show,
    remove,
    success,
    error,
    warning,
    info,
    clear
  }
}
