// 画面与辅助设置（每台设备各自保存的偏好）：阴影、渲染分辨率（27.1）、钓鱼辅助（6.6，独立于难度）
// 无障碍（设计 §27.4）：界面字号缩放、减少闪烁（雷雨闪光）、减少粒子、色弱友好的可达/不可达提示色
// 界面语言：默认中文；改语言后重新加载页面（main.ts 启动时按它载入英文包）
import { reactive, watch } from 'vue'

const KEY = 'astral-land:graphics'
export const graphics = reactive({ shadows: true, scale: 1, fishAssist: false, uiScale: 1, reduceFlash: false, fewParticles: false, colorAid: false, lang: 'zh' as 'zh' | 'en' })
try { Object.assign(graphics, JSON.parse(localStorage.getItem(KEY) ?? '{}')) } catch { /* 用默认值 */ }
const applyUi = () => { if (typeof document !== 'undefined') document.documentElement.style.fontSize = `${16 * graphics.uiScale}px` }
applyUi()
const store = () => { try { localStorage.setItem(KEY, JSON.stringify(graphics)) } catch { /* 隐私模式下忽略 */ } }
watch(graphics, () => { applyUi(); store() })
export function switchLang(l: 'zh' | 'en') {
  graphics.lang = l
  store()
  location.reload()
}
// 提示色：可到达/可建造 与 不可 （色弱模式用蓝/橙代替绿/红）
export const okColor = (ok: boolean) => (graphics.colorAid ? (ok ? 0x4a9cff : 0xffa030) : ok ? 0x6ee87a : 0xff5a4a)
