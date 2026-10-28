// 地图绘制：按领域格子数据画到 2D 画布（小地图与地图页共用），不依赖 Three.js。
import { regionOf, tileAt, type GameState } from '../core/state.ts'

// 0 草 1 土路 2 水 3 石板 4 洞底 5 岩壁/山崖 6 木栈
const GROUND = ['#7fb85a', '#d2b27e', '#4f9bd0', '#c9c2b6', '#7a705f', '#8d8374', '#b9844e']
const OB_COLOR: Record<string, string> = { tree: '#2f6b2a', stone: '#8a8f98', weed: '#4f8a35', reed: '#9ab060', rock: '#9a958c', copper: '#d27a3a', coal: '#2a2a2a', exit: '#7fe0c0' }
const SOIL = '#8a5a35'
const WET = '#5c3a22'

// 整个区域画成一张底图（每格 px 像素），状态变化时重画
export function drawRegion(s: GameState, px: number, canvas: HTMLCanvasElement) {
  const r = regionOf(s)
  canvas.width = r.w * px
  canvas.height = r.h * px
  const g = canvas.getContext('2d')!
  for (let z = 0; z < r.h; z++) for (let x = 0; x < r.w; x++) {
    const t = tileAt(s, x, z)!
    g.fillStyle = t.till ? (t.wet >= s.day ? WET : SOIL) : r.dark && t.g === 5 ? '#141210' : GROUND[t.g] ?? GROUND[0]
    g.fillRect(x * px, z * px, px, px)
    if (t.fo) {
      g.fillStyle = '#ffd34a'
      g.fillRect(x * px + px * 0.3, z * px + px * 0.3, px * 0.4, px * 0.4)
    }
    if (t.ob) {
      g.fillStyle = OB_COLOR[t.ob.k] ?? '#8a5a3a'
      const k = t.ob.k === 'tree' ? 0.9 : 0.55
      g.fillRect(x * px + (px * (1 - k)) / 2, z * px + (px * (1 - k)) / 2, px * k, px * k)
    }
    if (t.crop) {
      g.fillStyle = t.crop.dead ? '#a08050' : '#5fd35a'
      g.fillRect(x * px + px * 0.3, z * px + px * 0.3, px * 0.4, px * 0.4)
    }
  }
  for (const d of r.decor) if (d.m && d.solid && d.m !== 'hedge') {
    g.fillStyle = '#6b5a45'
    g.fillRect(Math.floor(d.x) * px, Math.floor(d.z) * px, px, px)
  }
  for (const b of r.buildings) {
    if (b.model === '') continue
    g.fillStyle = b.act ? '#c0563f' : '#9a6a48'
    g.fillRect(b.x * px, b.z * px, b.w * px, b.d * px)
    g.strokeStyle = '#4a2a18'
    g.lineWidth = Math.max(1, px / 4)
    g.strokeRect(b.x * px + 0.5, b.z * px + 0.5, b.w * px - 1, b.d * px - 1)
  }
  return canvas
}

export interface Marker { x: number; z: number; color: string; r?: number }

// 圆形小地图：以玩家为中心、随相机方位旋转（屏幕上方 = 镜头前方）
export function drawMinimap(ctx: CanvasRenderingContext2D, base: HTMLCanvasElement, px: number, s: GameState, az: number, markers: Marker[]) {
  const W = ctx.canvas.width
  const H = ctx.canvas.height
  ctx.clearRect(0, 0, W, H)
  ctx.save()
  ctx.beginPath()
  ctx.arc(W / 2, H / 2, W / 2, 0, Math.PI * 2)
  ctx.clip()
  ctx.fillStyle = regionOf(s).dark ? '#0d0c0b' : '#3f6b35'
  ctx.fillRect(0, 0, W, H)
  ctx.translate(W / 2, H / 2)
  ctx.rotate(az)
  ctx.translate(-s.x * px, -s.z * px)
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(base, 0, 0)
  for (const m of markers) {
    ctx.fillStyle = m.color
    ctx.beginPath()
    ctx.arc(m.x * px, m.z * px, (m.r ?? 0.6) * px, 0, Math.PI * 2)
    ctx.fill()
  }
  // 玩家箭头
  ctx.translate(s.x * px, s.z * px)
  ctx.rotate(-s.face + Math.PI)
  ctx.fillStyle = '#fff'
  ctx.strokeStyle = '#2b1a0a'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, -px * 1.4)
  ctx.lineTo(px * 0.9, px * 0.9)
  ctx.lineTo(0, px * 0.4)
  ctx.lineTo(-px * 0.9, px * 0.9)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.restore()
}
