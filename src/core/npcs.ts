// 居民日程（设计 18.3）：节庆 → 雨天 → 休息日/工作日。玩家到达区域时按当前时间直接放到应在的位置；
// 同区域内日程切换时沿网格寻路走过去，去别的区域就走向出口后离开。只模拟玩家所在区域的居民。
import { NPC_DEFS, REST_DAY, type SchedEntry } from '../content/story.ts'
import { festDef } from '../content/content.ts'
import { FEST_LAYOUTS, FEST_RING } from './regions.ts'
import { nextEvent } from './town.ts'
import { festivalOn, projectDone, raining, regionOf, solidTest, weekday, type GameState, type RegionId, type Spot } from './state.ts'

export const NPC_IDS = Object.keys(NPC_DEFS)
// 区域与地点是否已开放（林桥、驿站完工前，深林/湿地/高地与驿站柜台都不可去）
function placeOpen(s: GameState, region: string, spot: string) {
  if (region === 'deepforest' || region === 'wetland') return projectDone(s, 'bridge')
  if (region === 'highland') return projectDone(s, 'station')
  if ((region === 'mountain' && spot.startsWith('驿站')) || region === 'in:station') return projectDone(s, 'station') // i18n-ignore
  return true
}
const FEST_SPOT: Record<string, string> = { lintang: '节庆展台', laotao: '节庆入口', xiahe: '节庆长桌', shenzhou: '节庆喷泉' } // i18n-ignore

export interface NpcPlace { region: RegionId; spot: string; at: Spot; key: string }
// 室内化（G4）：原来写在室外的店内站位，搬进对应的室内地图
const INDOOR_SPOT: Record<string, [string, string]> = {
  'town:种子店柜台': ['in:general', '柜台'], 'town:种子店内侧整理台': ['in:general', '整理台'], // i18n-ignore
  'town:食堂灶台': ['in:diner', '灶台'], 'town:食堂备菜台': ['in:diner', '备菜台'], 'town:食堂公共料理台': ['in:diner', '公共料理台'], // i18n-ignore
  'town:食堂角桌': ['in:diner', '角桌'], 'town:食堂靠窗桌': ['in:diner', '靠窗桌'], 'town:食堂靠门桌': ['in:diner', '靠门桌'], // i18n-ignore
  'town:铁匠铺锻台': ['in:smith', '锻台'], 'town:铁匠铺工具架': ['in:smith', '工具架'], // i18n-ignore
  'town:木工坊柜台': ['in:carpenter', '柜台'], 'town:木工坊锯木台': ['in:carpenter', '锯木台'], // i18n-ignore
  'town:牧场柜台': ['in:ranch', '柜台'], 'town:诊所药柜': ['in:clinic', '药柜'], // i18n-ignore
  'town:档案馆阅览桌': ['in:hall', '书架前'], 'town:议事厅内': ['in:hall', '会议桌'], // i18n-ignore
  'mountain:驿站柜台': ['in:station', '柜台'], // i18n-ignore
}
function entryOf(s: GameState, id: string, min: number): SchedEntry | null {
  const sch = NPC_DEFS[id]?.schedule
  if (!sch) return null
  const list = raining(s) && sch.rain ? sch.rain : weekday(s.day) === (REST_DAY[id] ?? -1) ? sch.restday : sch.workday
  return list.find((e) => min >= e.from && min < e.to) ?? list[list.length - 1] ?? null
}
export function npcPlace(s: GameState, id: string, min = s.min): NpcPlace | null {
  const fid = festivalOn(s)
  if (fid === 'flower_fair' && min >= 600 && FEST_SPOT[id]) {
    const spot = FEST_SPOT[id]
    return { region: 'town', spot, at: regionOf(s, 'town').spots[spot], key: 'fest:' + spot }
  }
  // G4 节庆：开场前一小时起全镇居民聚到会场，主持人站在离入口最近的位置
  const f = fid ? festDef(fid) : null
  if (f && fid !== 'flower_fair' && min >= f.open - 60 && min < f.end) {
    const ring = FEST_RING[f.region]
    const [bx, bz, bw, bd] = FEST_LAYOUTS[fid].booth
    const dist = (k: number) => Math.hypot(ring[k][0] - bx - bw / 2, ring[k][1] - bz - bd / 2)
    const near = ring.reduce((k, _, j) => (dist(j) < dist(k) ? j : k), 0)
    const others = NPC_IDS.filter((n) => n !== f.host)
    const j = id === f.host ? near : [...ring.keys()].filter((k) => k !== near)[others.indexOf(id) % (ring.length - 1)]
    const [x, z] = ring[j]
    const [cx, cz] = f.region === 'town' ? [19, 19] : f.region === 'highland' ? [26.5, 12] : [22.5, 24]
    return { region: f.region as RegionId, spot: '节庆会场', at: { x, z, face: Math.atan2(cx - x, cz - z) }, key: `fest:${fid}:${j}` } // i18n-ignore
  }
  // 关系事件约在农场（1000 共同生活约定）：约定的时段里对方来家门口等你
  const ev = nextEvent(s, id)
  if (ev && ev.trigger.region === 'farm' && min >= ev.trigger.from && min < ev.trigger.to) return { region: 'farm', spot: '家门口', at: { x: 25.3, z: 10.4, face: Math.PI }, key: 'visit:' + ev.id } // i18n-ignore
  let e = entryOf(s, id, min)
  if (!e) return null
  if (!placeOpen(s, e.region, e.spot)) {
    const home = NPC_DEFS[id]?.home
    e = { ...e, ...(home && placeOpen(s, home.region, home.spot) ? home : { region: 'town', spot: '议事厅门前' }) } // i18n-ignore
  }
  e = { ...e, spot: e.spot.replace(/[（(]室内[)）]$/, '') } // 旧式写法“木工坊后屋(室内)”与地图上的“木工坊后屋”同一处
  const moved = INDOOR_SPOT[`${e.region}:${e.spot}`]
  if (moved) e = { ...e, region: moved[0], spot: moved[1] }
  const region = e.region as RegionId
  const def = regionOf(s, region)
  const at = def.spots[e.spot] ?? Object.values(def.spots)[0] ?? { x: def.spawn[0], z: def.spawn[1], face: 0 }
  return { region, spot: e.spot, at, key: `${e.from}:${e.region}:${e.spot}` }
}

export interface NpcActor { id: string; x: number; z: number; face: number; path: [number, number][]; key: string; leaving: boolean; hidden: boolean; moving: boolean; sit?: boolean; wait?: number }
const GAP = 0.6 // 人与人之间的最小间距
const YIELD = 1.5 // 让路最多等这么久，之后挤过去（不在门口卡死）
const SPEED = 2.0 // 米/秒

// 4 邻接网格寻路（区域不大，BFS 足够）；起终点允许是阻挡格
export function findPath(s: GameState, fx: number, fz: number, tx: number, tz: number): [number, number][] | null {
  const r = regionOf(s)
  const W = r.w, H = r.h
  const sx = Math.floor(fx), sz = Math.floor(fz), ex = Math.floor(tx), ez = Math.floor(tz)
  if (sx === ex && sz === ez) return [[tx, tz]]
  const prev = new Int32Array(W * H).fill(-1)
  const solid = solidTest(s)
  const start = sz * W + sx
  if (start < 0 || start >= W * H) return null
  prev[start] = start
  const q = [start]
  for (let h = 0; h < q.length; h++) {
    const i = q[h]
    const x = i % W, z = (i / W) | 0
    if (x === ex && z === ez) {
      const out: [number, number][] = [[tx, tz]]
      for (let k = prev[i]; k !== start; k = prev[k]) out.push([(k % W) + 0.5, ((k / W) | 0) + 0.5])
      return out.reverse()
    }
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, nz = z + dz
      if (nx < 0 || nz < 0 || nx >= W || nz >= H) continue
      const n = nz * W + nx
      if (prev[n] !== -1 || (solid(nx, nz) && !(nx === ex && nz === ez))) continue
      prev[n] = i
      q.push(n)
    }
  }
  return null
}

// 区域内通往另一区域的出口（取中点）
// 不相邻的区域按区域连接图走下一跳（浅林去小镇要先经过农场）
function nextHop(s: GameState, from: RegionId, to: RegionId): RegionId | null {
  const prev = new Map<RegionId, RegionId>([[from, from]])
  const q: RegionId[] = [from]
  for (let h = 0; h < q.length; h++) {
    const r = q[h]
    if (r === to) {
      let k = to
      while (prev.get(k) !== from) k = prev.get(k)!
      return k
    }
    for (const e of regionOf(s, r).exits) if (!prev.has(e.to)) { prev.set(e.to, r); q.push(e.to) }
  }
  return null
}
function exitTo(s: GameState, to: RegionId): [number, number] | null {
  const hop = to === s.region ? null : nextHop(s, s.region, to)
  const e = hop && regionOf(s).exits.find((x) => x.to === hop)
  return e ? [(e.x0 + e.x1) / 2 + 0.5, (e.z0 + e.z1) / 2 + 0.5] : null
}

// 玩家进入区域或读档：所有应在此处的居民直接就位
export function npcReset(s: GameState, actors: Map<string, NpcActor>) {
  actors.clear()
  for (const id of NPC_IDS) {
    const p = npcPlace(s, id)
    if (!p || p.region !== s.region || !p.at) continue
    actors.set(id, { id, x: p.at.x, z: p.at.z, face: p.at.face, path: [], key: p.key, leaving: false, hidden: !!p.at.hidden, moving: false, sit: !!p.at.sit })
  }
}

// 每个模拟步推进：到点换位置时寻路行走；去往其他区域则走到出口后消失
export function npcStep(s: GameState, actors: Map<string, NpcActor>, dt: number) {
  for (const id of NPC_IDS) {
    const p = npcPlace(s, id)
    if (!p) continue
    let a = actors.get(id)
    if (p.region === s.region && p.at && (!a || a.leaving)) {
      // 从别处走进本区域：在通往其上一个所在区域的出口处出现
      const before = npcPlace(s, id, s.min - 1)
      const from = before && before.region !== s.region ? exitTo(s, before.region) : null
      const [x, z] = from ?? [p.at.x, p.at.z]
      a = { id, x, z, face: 0, path: [], key: '', leaving: false, hidden: false, moving: false }
      actors.set(id, a)
    }
    if (!a) continue
    if (a.key !== p.key && !a.leaving) {
      a.key = p.key
      const goal = p.region === s.region ? [p.at.x, p.at.z] : exitTo(s, p.region)
      a.leaving = p.region !== s.region
      a.hidden = false
      a.sit = false
      if (!goal) { actors.delete(id); continue }
      a.path = findPath(s, a.x, a.z, goal[0], goal[1]) ?? [goal as [number, number]]
    }
    a.moving = a.path.length > 0
    if (!a.path.length) {
      if (a.leaving) actors.delete(id)
      else if (p.at) { a.hidden = !!p.at.hidden; a.sit = !!p.at.sit; if (!a.moving && p.region === s.region) a.face = p.at.face }
      continue
    }
    const [tx, tz] = a.path[0]
    const dx = tx - a.x, dz = tz - a.z
    const d = Math.hypot(dx, dz)
    const stepLen = SPEED * dt
    const [nx, nz] = d <= stepLen ? [tx, tz] : [a.x + (dx / d) * stepLen, a.z + (dz / d) * stepLen]
    // 前面有人（玩家或别的居民）就停下让一让；等太久就挤过去
    const near = (x: number, z: number, ox: number, oz: number) => Math.hypot(ox - x, oz - z) < GAP && Math.hypot(ox - x, oz - z) < Math.hypot(ox - a!.x, oz - a!.z)
    const blocked = near(nx, nz, s.x, s.z) || [...actors.values()].some((o) => o !== a && !o.hidden && near(nx, nz, o.x, o.z))
    if (blocked && (a.wait ?? 0) < YIELD) { a.wait = (a.wait ?? 0) + dt; a.moving = false; if (d > 1e-3) a.face = Math.atan2(dx, dz); continue }
    if (!blocked) a.wait = 0
    if (d <= stepLen) a.path.shift()
    a.x = nx
    a.z = nz
    if (d > 1e-3) a.face = Math.atan2(dx, dz)
  }
}
