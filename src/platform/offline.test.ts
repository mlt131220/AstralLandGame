/// <reference lib="dom" />
// 离线完整包（上线审计 L04/L05）：真实的 public/sw.js 处理器 + 页面下载器，跑在内存 CacheStorage、假服务器与假 HTTP 缓存上。
// 页面发出的字符串请求先交给 SW 的 fetch 处理器（受控页面）；SW 自己用请求对象发出的才是网络请求。
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

const ORIGIN = 'https://astral.test'
const path = (k: string | { url: string }) => new URL(typeof k === 'string' ? k : k.url, ORIGIN).pathname
let broken = false // 模拟缓存库损坏（浏览器崩溃后 Chrome 报 Entry already exists）、存储满
const fail = () => { if (broken) throw new DOMException('Entry already exists.', 'InvalidAccessError') }
class FakeCache {
  m = new Map<string, Response>()
  async match(k: string | { url: string }) { fail(); return this.m.get(path(k))?.clone() }
  async put(k: string | { url: string }, r: Response) { fail(); this.m.set(path(k), r) }
  async delete(k: string | { url: string }) { return this.m.delete(path(k)) }
  async keys() { return [...this.m.keys()].map((p) => ({ url: ORIGIN + p })) }
}
const stores = new Map<string, FakeCache>()
const caches = {
  async open(name: string) { if (!stores.has(name)) stores.set(name, new FakeCache()); return stores.get(name)! },
  async keys() { return [...stores.keys()] },
  async delete(name: string) { return stores.delete(name) },
}

// 服务器与浏览器 HTTP 缓存（force-cache 命中旧副本，reload 绕过）
let server: Record<string, string> = {}
const httpCache = new Map<string, string>()
let offlineNet = false
const hits: string[] = []
function net(p: string, mode?: string) {
  if (mode === 'force-cache' && httpCache.has(p)) return new Response(httpCache.get(p))
  if (offlineNet) throw new TypeError('Failed to fetch')
  hits.push(p)
  if (server[p] === undefined) return new Response('', { status: 404 })
  httpCache.set(p, server[p])
  return new Response(server[p])
}
const h16 = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 16)
// 同 vite.config.ts 的清单：路径、字节数、SHA-256 前 16 位；版本由全部内容决定
function deploy(files: Record<string, string>) {
  const list = Object.entries(files).map(([p, b]) => ({ p, n: Buffer.byteLength(b), h: h16(b) })).sort((a, b) => a.p.localeCompare(b.p))
  const version = createHash('sha256').update(list.map((f) => f.p + f.h).join('\n')).digest('hex').slice(0, 12)
  server = { ...files, '/offline-manifest.json': JSON.stringify({ version, bytes: list.reduce((a, f) => a + f.n, 0), files: list }) }
  return version
}

// Service Worker 全局环境
type Handler = (e: Record<string, unknown>) => void
let handlers: Record<string, Handler[]> = {}
const live = new Set<string>()
const waits: Promise<unknown>[] = []
const sw = {
  addEventListener: (t: string, f: Handler) => (handlers[t] ??= []).push(f),
  skipWaiting() {},
  clients: { claim: async () => {}, matchAll: async () => [...live].map((id) => ({ id })) },
}
let restarts = 0
const startSW = async () => { handlers = {}; await import(`../../public/sw.js?r${restarts++}` as string) } // 重新导入 = SW 被回收后重启（内存里的记录丢失）
const dispatch = (type: string, e: Record<string, unknown>) => { for (const f of handlers[type] ?? []) f({ ...e, waitUntil: (p: Promise<unknown>) => waits.push(p) }) }
const settle = async () => { while (waits.length) await waits.shift() }

let page = ''
async function swFetch(p: string, init: RequestInit = {}, client = page, nav = false) {
  let res: Promise<Response> | null = null
  const request = { method: 'GET', url: ORIGIN + p, mode: nav ? 'navigate' : 'cors', cache: init.cache, headers: new Headers(init.headers) }
  for (const f of handlers.fetch ?? []) f({ request, clientId: nav ? '' : client, resultingClientId: nav ? client : '', respondWith: (r: Promise<Response>) => (res = r), waitUntil: () => {} })
  return res ?? net(p, init.cache)
}
const navigate = async (id: string) => { live.add(id); await (await swFetch('/', {}, id, true)).text(); page = id }
Object.assign(globalThis, {
  caches,
  location: { origin: ORIGIN },
  fetch: (input: string | { url: string; cache?: string }, init?: RequestInit) => (typeof input === 'string' ? swFetch(input, init) : net(path(input), input.cache)),
})
Object.defineProperty(globalThis, 'self', { value: sw, configurable: true })
const worker = { postMessage: (data: unknown) => dispatch('message', { data }) }
Object.defineProperty(globalThis.navigator, 'serviceWorker', { value: { register: async () => ({ active: worker }), controller: worker }, configurable: true })
await startSW()

type Offline = typeof import('./offline.ts')
let pages = 0
const openPage = async () => (await import(`./offline.ts?page${pages++}` as string)) as Offline // 每个页面一个独立模块实例
const read = async (name: string, p: string) => (await (await caches.open(name)).match(p))?.text()
const active = () => read('astral-meta', '/__active')
const get = async (p: string) => (await fetch(p)).text()

// 首次访问（导航时还没有完整包）：整包下载、逐项核对后登记为当前版本
const FILES1 = { '/index.html': '<v1>', '/asset.glb': 'OLD', '/b.bin': 'bbb' }
const v1 = deploy(FILES1)
await navigate('p1')
const a = await openPage()
await a.startOffline()
assert.equal(a.offline.state, 'ready')
assert.equal(await active(), v1)
assert.equal(await read('astral-' + v1, '/asset.glb'), 'OLD')

// L04 复现：v2 同名同长度（OLD→NEW）与不同长度（bbb→bbbb），HTTP 缓存里还是旧副本；发起下载的页面运行的是 v1
const FILES2 = { '/index.html': '<v2>', '/asset.glb': 'NEW', '/b.bin': 'bbbb' }
const v2 = deploy(FILES2)
await navigate('p2')
assert.equal(await get('/asset.glb'), 'OLD', '旧页面从自己的 v1 包取')
const b = await openPage()
await b.startOffline()
assert.equal(b.offline.state, 'ready')
assert.equal(await active(), v2)
assert.equal(await read('astral-' + v2, '/asset.glb'), 'NEW', '下载器绕过旧包、HTTP 缓存旧副本被哈希拦下，取到新版')
assert.equal(await read('astral-' + v2, '/b.bin'), 'bbbb')
assert.ok(b.offline.update, '这一页还在 v1：提示刷新后使用')
assert.equal(await get('/asset.glb'), 'OLD', '换版后正在运行的旧页面不混用新文件')
assert.equal(await get('/b.bin'), 'bbb')
await navigate('p3')
assert.equal(await get('/asset.glb'), 'NEW', '下一次导航才用新版')
assert.equal(await get('/b.bin'), 'bbbb')

// SW 被回收重启：页面固定的版本从缓存读回
await startSW()
page = 'p2'
assert.equal(await get('/asset.glb'), 'OLD', '重启后旧页面仍是 v1')
page = 'p3'
assert.equal(await get('/asset.glb'), 'NEW')

// 回收（过了新导航保护期）：还有页面在用的旧版本保留；页面都关了才删
const now = Date.now
Date.now = () => now() + 120000
worker.postMessage('prune')
await settle()
assert.ok(stores.has('astral-' + v1), '双标签：p2 还开着，v1 保留')
live.delete('p1')
live.delete('p2')
worker.postMessage('prune')
await settle()
Date.now = now
assert.ok(!stores.has('astral-' + v1), '没有页面再用 v1：回收')
assert.ok(stores.has('astral-' + v2))

// L05 复现：当前包缺一项。断网时不承诺就绪；联网后补齐
await (await caches.open('astral-' + v2)).delete('/b.bin')
offlineNet = true
const c = await openPage()
await c.startOffline()
assert.equal(c.offline.state, 'error', '断网缺项：不显示已就绪')
assert.match(c.offline.error, /缺 1 个文件/)
offlineNet = false
hits.length = 0
await c.startOffline()
assert.equal(c.offline.state, 'ready')
assert.equal(await read('astral-' + v2, '/b.bin'), 'bbbb', '联网后补齐缺项')
assert.ok(!hits.includes('/asset.glb'), '只补缺的，不重下整包')

// 更新中断：服务器文件与清单不符（部署中途或 CDN 旧副本），不登记新版，旧包照常；修好后接着下
const FILES3 = { ...FILES2, '/index.html': '<v3>', '/asset.glb': 'NEW3' }
const v3 = deploy(FILES3)
server['/asset.glb'] = 'BAD3'
await navigate('p4')
const d = await openPage()
const warn = console.warn
console.warn = () => {} // 预期的中断日志
await d.startOffline()
console.warn = warn
assert.equal(d.offline.state, 'error')
assert.equal(await active(), v2, '核对失败不换版')
assert.equal(await get('/asset.glb'), 'NEW', '断在半路时页面仍用完整的 v2')
worker.postMessage('prune')
await settle()
assert.ok(stores.has('astral-' + v3), '下载中的候选版本不被回收')
server['/asset.glb'] = 'NEW3'
hits.length = 0
await d.startOffline()
assert.equal(d.offline.state, 'ready')
assert.equal(await active(), v3)
assert.deepEqual(hits.filter((p) => p !== '/offline-manifest.json'), ['/asset.glb'], '续传只取没通过核对的文件')
await settle()

// 回滚：服务器退回 v2，仍有页面（p3）在用的 v2 包按哈希核对后直接复用
assert.equal(deploy(FILES2), v2)
await navigate('p5')
const e = await openPage()
hits.length = 0
await e.startOffline()
assert.equal(e.offline.state, 'ready')
assert.equal(await active(), v2)
assert.deepEqual(hits, ['/offline-manifest.json'], '回滚复用已核对的 v2 包')
assert.ok(e.offline.update, 'p5 导航时是 v3：提示刷新后用回 v2')

// 缓存库坏了：读写都抛错时 SW 不拦页面，导航和资源照常走网络
await settle()
broken = true
assert.equal(await (await swFetch('/index.html', {}, 'p6', true)).text(), server['/index.html'], '缓存库损坏仍能打开页面')
assert.equal(await (await swFetch('/b.bin', {}, 'p6')).text(), server['/b.bin'])
broken = false

console.log('离线包（L04/L05）测试通过')
