import { createApp } from 'vue'
import Toast from '@/components/toast/index.vue'

let instance: any
let timer: any

// 创建实例
const createInstance = () => {
  const div = document.createElement('div')
  document.body.appendChild(div)
  instance = createApp(Toast).mount(div)
}

export const showToast = (
  arg:
    | string
    | {
        message: string
        type?: 'success' | 'error' | 'warning'
        icon?: string | null
        duration?: number
        position?: 'top' | 'center'
      }
) => {
  // 实例化
  if (!instance) {
    createInstance()
  }

  // 参数
  const {
    message,
    type = '',
    icon = null,
    duration = 2000,
    position = 'top',
  } = typeof arg === 'string' ? { message: arg } : arg

  instance.message = message
  instance.type = type
  instance.icon = icon
  instance.show = true
  instance.position = position
  clearTimeout(timer)
  timer = setTimeout(() => {
    instance.show = false
  }, duration)
}
