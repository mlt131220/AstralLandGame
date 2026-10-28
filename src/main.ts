import { createApp } from 'vue'
import './style.css'
import { setPack } from './core/i18n.ts'
import { graphics } from './platform/settings.ts'
import { fitViewport } from './platform/touch.ts'

fitViewport() // 手机：按小桌面排版、整体缩放（见 platform/touch.ts）

// 先定语言再载入游戏模块：内容表在模块初始化时就取译名（见 core/i18n.ts）
if (graphics.lang === 'en') {
  setPack((await import('./content/i18n/en.ts')).default)
  document.documentElement.lang = 'en'
  document.title = 'Astral Land'
}
const { default: App } = await import('./App.vue')
createApp(App).mount('#app')
