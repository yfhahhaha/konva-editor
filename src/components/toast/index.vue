<template>
    <transition name="fade">
      <div v-if="show" class="toast" :class="`toast-${direction} ${position}`">
        <template v-if="icon">
          <SvgIcon :name="icon" />
        </template>
        <template v-else>
          <SvgIcon v-if="type === 'success'" name="success" />
          <SvgIcon v-if="type === 'error'" name="error" />
          <SvgIcon v-if="type === 'warning'" name="warning" />
        </template>
        <slot />
        <span v-if="!$slots.default" class="message">{{ message }}</span>
      </div>
    </transition>
  </template>
  
  <script lang="ts" setup>
    import { computed, ref } from 'vue';

    
    const props = defineProps<{
      visible: boolean
      type: 'success' | 'error' | 'warning'
      icon: string | null
      message: string
      direction: 'row' | 'column' // 默认为row
      position: 'top' | 'center' // 默认为top
    }>()
  
    const direction = computed(() => {
      return props.direction || 'row'
    })
  
    const show = ref(props.visible)
    const type = ref(props.type)
    const icon = ref(props.icon)
    const message = ref(props.message)
  
    defineExpose({
      show,
      message,
      type,
      icon
    })
  </script>
  
  <style scoped lang="less">
    .toast {
      max-width: 328px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: var(---toast-bg, rgba(0, 0, 0, 0.80));
      border-radius: 8px;
      position: fixed;
      top: 48px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 1002;
      &.center {
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      }
    }
  
    .toast-row {
      padding: 14px 16px;
      flex-direction: row;
    }
  
    .toast-column {
      padding: 16px;
      flex-direction: column;
    }
  
    .toast svg {
      width: 24px;
      height: 24px;
    }
  
    .toast .message {
      color: var(---text-1, #FFF);
      text-align: center;
      font-size: 16px;
      font-style: normal;
      font-weight: 400;
      line-height: 140%; /* 22.4px */
      white-space: pre-wrap;
    }
  
    .fade-enter-active, .fade-leave-active {
      transition: opacity .5s;
    }
  
    .fade-enter, .fade-leave-to {
      opacity: 0;
    }
  </style>