import { ref } from 'vue'

export type ToastType = 'success' | 'warning' | 'danger' | 'info'

export interface ToastItem {
  id: string
  type: ToastType
  title: string
  message: string
  duration: number
  createdAt: number
}

const toasts = ref<ToastItem[]>([])

export const useToast = () => {
  const remove = (id: string) => {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  const add = (type: ToastType, title: string, message: string = '', duration: number = 5000) => {
    const id = Math.random().toString(36).substring(2, 9)
    const toast: ToastItem = {
      id,
      type,
      title,
      message,
      duration,
      createdAt: Date.now()
    }
    toasts.value.push(toast)
    return id
  }

  const toast = {
    success: (title: string, message?: string, duration?: number) => add('success', title, message, duration),
    warning: (title: string, message?: string, duration?: number) => add('warning', title, message, duration),
    danger: (title: string, message?: string, duration?: number) => add('danger', title, message, duration),
    info: (title: string, message?: string, duration?: number) => add('info', title, message, duration),
    remove
  }

  return {
    toasts,
    toast,
    remove
  }
}
