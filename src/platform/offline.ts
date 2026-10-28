// 离线完整包（用户确认：首次进入时整包下载，约 117MB）：按构建生成的清单把全部文件下载进 `astral-<版本>` 缓存。
// 每个文件核对 SHA-256（清单里的前 16 位）后才放进缓存，并在条目上记下这个哈希；续传、修复都按记下的哈希判断能否复用。
// 下载请求带 X-Astral-Dl 头，sw.js 放行到网络（否则同名路径会读到正在用的旧包）；先用浏览器 HTTP 缓存
// （游戏预载过的文件通常不重复下载），哈希不符再强制重下。全部到齐才登记为当前版本：正在运行的页面仍用导航时
// 固定的版本，刷新后才换新版；旧版本等没有页面在用时由 sw.js 回收。
// 就绪 = 当前版本的清单（随包存在 /__manifest）逐项都在缓存里、哈希记录一致；缺项时联网就补，断网就如实提示。
import { reactive } from 'vue'
import { t } from '../core/i18n.ts'

export const offline = reactive({ state: 'idle' as 'idle' | 'unsupported' | 'checking' | 'downloading' | 'ready' | 'error', done: 0, total: 0, bytes: 0, version: '', update: false, error: '' })
const META = 'astral-meta'
const ACTIVE = '/__active'
const NEXT = '/__next'
const MAN = '/__manifest'
const H = 'X-Astral-H'
interface Manifest { version: string; bytes: number; files: { p: string; n: number; h: string }[] }

async function read(key: string) {
  const r = await (await caches.open(META)).match(key)
  return r ? r.text() : ''
}
const write = async (key: string, v: string) => (await caches.open(META)).put(key, new Response(v))
const hash = async (buf: ArrayBuffer) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', buf))].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 16)
// 缓存里缺的、或哈希记录与清单不符的文件
async function lacking(cache: Cache, man: Manifest) {
  const got = await Promise.all(man.files.map((f) => cache.match(f.p)))
  return man.files.filter((f, i) => got[i]?.headers.get(H) !== f.h)
}
// 取清单指定版本的一个文件并核对：先走 HTTP 缓存，长度或哈希不符再强制重下（共 3 次）
async function fetchFile(f: Manifest['files'][number]) {
  let last = ''
  for (let tries = 0; tries < 3; tries++) {
    try {
      const r = await fetch(f.p, { cache: tries ? 'reload' : 'force-cache', headers: { 'X-Astral-Dl': '1' } })
      const buf = await r.arrayBuffer()
      const h = r.ok && buf.byteLength === f.n ? await hash(buf) : ''
      if (h === f.h) return new Response(buf, { headers: { 'Content-Type': r.headers.get('Content-Type') ?? 'application/octet-stream', [H]: h } })
      last = `${f.p}：${r.status} ${buf.byteLength}/${f.n} ${h}` // i18n-ignore（只进 console）
    } catch (e) { last = `${f.p}：${(e as Error)?.message ?? e}` } // i18n-ignore（只进 console）
  }
  throw new Error(last)
}
// 这一页导航时固定的版本（没被 sw.js 控制时为 null）
async function pinned() {
  if (!navigator.serviceWorker.controller) return null
  const r = await fetch('/__pin').catch(() => null)
  return r?.headers.get('X-Astral-Pin') ? r.text() : null
}

let running = false
export async function startOffline() {
  if (running) return
  if (!('serviceWorker' in navigator) || typeof caches === 'undefined') { offline.state = 'unsupported'; return }
  running = true
  try {
    const reg = await navigator.serviceWorker.register('/sw.js')
    offline.state = 'checking'
    const current = await read(ACTIVE)
    let man: Manifest
    try {
      man = await fetch('/offline-manifest.json', { cache: 'no-store' }).then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json() })
    } catch {
      // 断网：按随包保存的清单核对已登记的完整包，缺项不承诺可离线
      const cache = current ? await caches.open('astral-' + current) : null
      const saved = await cache?.match(MAN)
      const miss = cache && saved ? (await lacking(cache, await saved.json())).length : -1
      offline.version = current
      offline.state = miss === 0 ? 'ready' : 'error'
      offline.error = !current ? t('offline.noConnectionOfflinePackage') : miss > 0 ? t('offline.offlinePackageMissingTheyll', miss) : miss ? t('offline.couldntCheckOfflinePackage') : ''
      return
    }
    offline.version = man.version
    offline.total = man.files.length
    offline.bytes = man.bytes
    const cache = await caches.open('astral-' + man.version)
    const todo = await lacking(cache, man)
    offline.done = offline.total - todo.length
    if (todo.length) {
      offline.state = 'downloading'
      if (man.version !== current) await write(NEXT, man.version)
      let i = 0
      let err: unknown = null
      const worker = async () => {
        while (i < todo.length) {
          const f = todo[i++]
          try { await cache.put(f.p, await fetchFile(f)) } catch (e) { err = e; i = todo.length; return } // 一个失败就都停下，不在报错后还接着写
          offline.done++
        }
      }
      await Promise.all(Array.from({ length: 6 }, worker))
      if (err) throw err
    }
    await cache.put(MAN, new Response(JSON.stringify(man)))
    // 全部核对通过：登记为当前版本（下一次导航起生效）
    if (man.version !== current) {
      await write(ACTIVE, man.version)
      await (await caches.open(META)).delete(NEXT)
    }
    const pin = await pinned()
    offline.update = !!pin && pin !== man.version
    offline.state = 'ready'
    ;(reg.active ?? navigator.serviceWorker.controller)?.postMessage('prune')
  } catch (e) {
    offline.state = 'error'
    offline.error = t('offline.offlinePackageDownloadInterrupted')
    console.warn('[offline]', e)
  } finally {
    running = false
  }
}
globalThis.addEventListener?.('online', () => { if (offline.state === 'error') startOffline() })
