// 离线运行（设计 §25.6 / §27.3）：页面按 offline-manifest.json 把整包下载进 `astral-<版本>` 缓存（逐个文件核对哈希），
// 下载完整后在 `astral-meta` 里登记为当前版本。每个页面在导航时固定当时的完整版本（记在 /__pin/<页面 id>，
// Service Worker 被回收重启后也读得回），这一页之后的全部请求只从那一版取——新包下好只在下一次导航时换上，
// 正在玩的页面不会新旧混用；旧版本一直留到没有页面在用才删。包里没有的请求走网络；断网时导航回落到包里的首页。
const META = 'astral-meta'
const ACTIVE = '/__active'
const NEXT = '/__next' // 正在下载的候选版本：回收时保留，下次接着下
const PIN = '/__pin/'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(Promise.all([self.clients.claim(), prune()])))
// 页面下载完新包后发 'prune'：回收没有页面在用的旧包
self.addEventListener('message', (e) => { if (e.data === 'prune') e.waitUntil(prune()) })

async function read(key) {
  const r = await (await caches.open(META)).match(key)
  return r ? r.text() : ''
}
const pins = new Map() // 页面 id → 固定的版本（'' 表示导航时还没有完整包，走网络）
async function pinOf(id) {
  if (!id) return undefined
  if (!pins.has(id)) { const r = await (await caches.open(META)).match(PIN + id); pins.set(id, r ? await r.text() : undefined) }
  return pins.get(id)
}
async function pin(id, v) {
  if (!id) return
  pins.set(id, v)
  // 写不进（存储满、浏览器崩溃后缓存库损坏）不拦这次导航：本次 SW 存活期内按内存记录固定
  try { await (await caches.open(META)).put(PIN + id, new Response(v, { headers: { 'X-Time': String(Date.now()) } })) } catch (err) { console.warn('[sw] pin', err) }
}
// 回收：当前版本、候选版本和还有页面在用的版本保留，其余整包删除。已关闭页面的固定记录一并清掉
// （刚导航、页面还没建好的记录 1 分钟内不清，否则会被误当成已关闭）
async function prune() {
  const meta = await caches.open(META)
  const live = new Set((await self.clients.matchAll({ type: 'window', includeUncontrolled: true })).map((c) => c.id))
  const keep = new Set([await read(ACTIVE), await read(NEXT)])
  for (const req of await meta.keys()) {
    const p = new URL(req.url).pathname
    if (!p.startsWith(PIN)) continue
    const id = p.slice(PIN.length)
    const r = await meta.match(req)
    if (live.has(id) || Date.now() - Number(r.headers.get('X-Time')) < 60000) keep.add(await r.text())
    else { await meta.delete(req); pins.delete(id) }
  }
  for (const k of await caches.keys()) if (k.startsWith('astral-') && k !== META && !keep.has(k.slice(7))) await caches.delete(k)
}

self.addEventListener('fetch', (e) => {
  const req = e.request
  const url = new URL(req.url)
  if (req.method !== 'GET' || url.origin !== location.origin) return
  // 清单与 sw.js 总是问网络（用来发现新版本）；下载器带 X-Astral-Dl 头取指定版本，也不能从正在用的包里拿
  if (url.pathname === '/offline-manifest.json' || url.pathname === '/sw.js' || req.headers.has('X-Astral-Dl')) return
  e.respondWith((async () => {
    const nav = req.mode === 'navigate'
    const path = nav && !url.pathname.endsWith('.html') ? '/index.html' : url.pathname // 打开 /privacy.html 等独立页面时给那一页
    let v, hit
    try { // 缓存库读不出来：当作没有离线包，走网络（不能因为离线包坏了连页面都打不开）
      if (nav) await pin(e.resultingClientId, (v = await read(ACTIVE)))
      else v = await pinOf(e.clientId)
      hit = v && (await (await caches.open('astral-' + v)).match(path))
    } catch (err) { console.warn('[sw]', err) }
    if (url.pathname === '/__pin') return new Response(v ?? '', { headers: { 'X-Astral-Pin': '1' } }) // 页面问自己固定在哪一版
    if (hit) return hit
    try {
      return await fetch(req)
    } catch (err) {
      // 断网：没有固定版本的页面（从网络加载、之后整包才下好）退到当前完整版本；固定了版本的页面不拿别的版本凑数
      const alt = !v && (await read(ACTIVE).catch(() => ''))
      const home = alt && (await (await caches.open('astral-' + alt)).match(path).catch(() => null))
      if (home) return home
      throw err
    }
  })())
})
