// 手机与触屏（星露谷手机版式：点哪走哪、点哪做哪，不用摇杆）。
// 小屏手机：把页面按约 540 CSS 像素高的“小桌面”排版，由浏览器整体缩放——画布、界面、vh 单位一致缩放，
// 界面元素不必逐个改尺寸（桌面最小设计高度 720，540 下面板可滚动；正文约 12 CSS 像素）。平板屏幕够大，按原尺寸。
export const coarse = () => typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches
export const isPhone = () => coarse() && Math.min(screen.width, screen.height) < 600
const LAYOUT_H = 540

export function fitViewport() {
  if (!isPhone()) return
  const meta = document.querySelector('meta[name=viewport]')
  if (!meta) return
  const land = matchMedia('(orientation: landscape)')
  const apply = () => {
    // iOS 的 screen.width/height 不随方向变，安卓会变：按长短边取
    const long = Math.max(screen.width, screen.height), short = Math.min(screen.width, screen.height)
    const w = land.matches ? long : short
    meta.setAttribute('content', `width=${Math.round((w * LAYOUT_H) / short)}, user-scalable=no`)
  }
  apply()
  land.addEventListener('change', apply)
}

// 进入游戏时（用户点按）在手机上全屏并锁定横屏：安卓 Chrome 支持；iPhone Safari 不支持元素全屏，静默跳过（可添加到主屏幕）
export function phoneFullscreen() {
  if (!isPhone() || document.fullscreenElement) return
  document.documentElement.requestFullscreen?.({ navigationUI: 'hide' })
    .then(() => (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }).lock?.('landscape'))
    .catch(() => {})
}
