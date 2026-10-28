// 声音：音乐 / 环境 / 音效三条总线（设计 23.2）。由玩家首次操作解锁（浏览器自动播放限制）。
const BASE = '/assets/audio/'
let ctx: AudioContext | null = null
let sfxGain: GainNode
let sfxIndex: Record<string, number> = {}
let musicFiles: Record<string, string> = {}
const buffers = new Map<string, Promise<AudioBuffer | null>>()

const SETTINGS_KEY = 'astral-land:audio'
export const volume = (() => {
  const v = { music: 0.55, ambience: 0.5, sfx: 0.8 }
  try { Object.assign(v, JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}')) } catch { /* 用默认值 */ }
  return v
})()
export function saveVolume() {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(volume)) } catch { /* 隐私模式下忽略 */ }
  if (ctx) sfxGain.gain.value = volume.sfx
  music.apply()
  ambience.apply()
}

export async function unlockAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') await ctx.resume().catch(() => {})
    return
  }
  ctx = new AudioContext()
  sfxGain = ctx.createGain()
  sfxGain.gain.value = volume.sfx
  sfxGain.connect(ctx.destination)
  const [a, b] = await Promise.all([
    fetch(BASE + 'sfx/index.json').then((r) => r.json()).catch(() => ({})),
    fetch(BASE + 'music/index.json').then((r) => r.json()).catch(() => ({})),
  ])
  sfxIndex = a
  musicFiles = b
  music.retry()
  ambience.retry()
}

function load(url: string) {
  let p = buffers.get(url)
  if (!p) {
    p = fetch(url).then((r) => r.arrayBuffer()).then((d) => ctx!.decodeAudioData(d)).catch(() => null)
    buffers.set(url, p)
  }
  return p
}

// 同一音效短时间内不叠太多份
const lastPlayed = new Map<string, number>()
export function sfx(name: string, gain = 1) {
  if (!ctx || !sfxIndex[name] || ctx.state !== 'running') return
  const now = performance.now()
  if (now - (lastPlayed.get(name) ?? 0) < 45) return
  lastPlayed.set(name, now)
  const i = Math.floor(Math.random() * sfxIndex[name])
  load(`${BASE}sfx/${name}_${i}.ogg`).then((buf) => {
    if (!buf || !ctx) return
    const src = ctx.createBufferSource()
    src.buffer = buf
    src.playbackRate.value = 0.94 + Math.random() * 0.12
    const g = ctx.createGain()
    g.gain.value = gain
    src.connect(g).connect(sfxGain)
    src.start()
  })
}

// 循环音轨：切换时交叉淡化，不每次从头重播同一首（23.2）
class Track {
  private el: HTMLAudioElement | null = null
  private want = ''
  private current = ''
  private fadeTimer = 0
  private level: () => number
  constructor(level: () => number) {
    this.level = level
  }
  play(id: string) {
    this.want = id
    if (id === this.current || !ctx) return
    const file = musicFiles[id]
    const old = this.el
    this.current = id
    this.el = null
    if (file) {
      const el = new Audio(BASE + 'music/' + file)
      el.loop = true
      el.volume = 0
      el.play().catch(() => {})
      this.el = el
    }
    this.fade(old)
  }
  private fade(old: HTMLAudioElement | null) {
    clearInterval(this.fadeTimer)
    const start = performance.now()
    this.fadeTimer = window.setInterval(() => {
      const t = Math.min(1, (performance.now() - start) / 1800)
      if (old) old.volume = Math.max(0, (1 - t) * this.level())
      if (this.el) this.el.volume = t * this.level()
      if (t >= 1) {
        clearInterval(this.fadeTimer)
        old?.pause()
      }
    }, 50)
  }
  apply() {
    if (this.el) this.el.volume = this.level()
  }
  retry() {
    const id = this.want
    this.want = ''
    if (id) this.play(id)
  }
  pause(p: boolean) {
    if (!this.el) return
    if (p) this.el.pause()
    else this.el.play().catch(() => {})
  }
}
export const music = new Track(() => volume.music)
export const ambience = new Track(() => volume.ambience)

// 页面隐藏或游戏暂停时静音，恢复时继续（23.3 不叠播积压音效）
export function suspendAll(p: boolean) {
  music.pause(p)
  ambience.pause(p)
  if (!ctx) return
  if (p) ctx.suspend().catch(() => {})
  else ctx.resume().catch(() => {})
}
