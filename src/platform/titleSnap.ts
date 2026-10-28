// 标题背景快照：标题 3D 场景第一次要先编译几秒才能画（每次打开都要，浏览器着色器缓存帮不上），这几秒先显示上次存下的同一画面。
// 后台加载完之前标题镜头不动，快照取的就是这个起始角度，淡出时与实时画面对得上。存在离线包的登记缓存里（不会被换版清理）
const KEY = '/__title.jpg'
export function saveTitleSnap(canvas: HTMLCanvasElement) {
  if (!('caches' in window)) return
  // WebGPU 画布只在本次任务内有效：必须在刚画完的同一帧里取
  canvas.toBlob((b) => { if (b) caches.open('astral-meta').then((c) => c.put(KEY, new Response(b, { headers: { 'Content-Type': 'image/jpeg' } }))).catch(() => {}) }, 'image/jpeg', 0.85)
}
export async function loadTitleSnap(): Promise<string> {
  try {
    const r = await (await caches.open('astral-meta')).match(KEY)
    return r ? URL.createObjectURL(await r.blob()) : ''
  } catch { return '' }
}
