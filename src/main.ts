import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import { showToast } from './composables/toast'
import VueKonva from 'vue-konva';
import ArcoVue from '@arco-design/web-vue';
import '@arco-design/web-vue/dist/arco.css';
// 额外引入图标库
import ArcoVueIcon from '@arco-design/web-vue/es/icon';

const app = createApp(App)
app.config.globalProperties.showToast = showToast
app.use(VueKonva)
.use(ArcoVueIcon)
.use(ArcoVue, {
  // 用于改变使用组件时的前缀名称
  componentPrefix: 'a'
}).mount('#app')
