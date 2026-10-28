// 领域状态、时间、库存与地格查询。不导入 Three.js，不操作 DOM（设计 24.3）。地图几何见 regions.ts。
import { DECOR_BY_ID, footOf } from '../content/g4.ts'
import BUILDING_BOUNDS from '../content/building_bounds.json' with { type: 'json' }
import { PETS, type Pet } from './pets.ts'
import {
  ANIMALS, BUILDINGS, CEREMONIES, CROPS, DAY_END, DAY_START, EXTREME_NAMES, FESTIVALS, festDef, FORAGE_BY_SEASON, ITEMS, MINE_FLOORS, OBSTACLES, SEASON_DAYS, SEASON_NAMES, SKILLS, START, TOOLS,
  WEATHER_WEIGHTS, XP_LEVELS, type AnimalKind, type BuildKind, type ObKind, type PlaceKind, type Skill, type ToolId,
} from '../content/content.ts'
import { rand } from './rng.ts'
import { t as tr } from './i18n.ts'
import {
  COOP_SITE, COOP_YARD, deepforestOpen, doorOfBuilding, FARM_H, FEST_GROUNDS, FARM_W, forestOpen, GREENHOUSE_SITE, isWater, mineFloor, MINE_W, regionDef, STATION, WALKABLE,
  type Building, type RegionDef, type RegionId,
} from './regions.ts'

export { rand }
export type { Building, Decor, Exit, RegionDef, RegionId, Spot } from './regions.ts'

export interface Slot { id: string; q: number; n: number; b?: 1 } // b：商店购入（不计入要求自采的交付）
export interface Crop { id: number; cid: string; prog: number; harvests: number; dry: number; dead: boolean }
export interface Tile {
  g: number // 地面：0 草 1 路 2 水 3 石板 4 洞底 5 岩壁 6 木栈
  till: boolean
  wet: number // 有效供水至该经营日（含）
  fert: number // 0 无 1 品质肥 2 保水肥
  crop: Crop | null
  ob: { k: ObKind; dmg: number; sp?: string } | null // sp：种出来的树记住树种（野生树按坐标定树种）
  ent: number // 放置物 id，0 为无
  fo?: string // 地上可拾取的采集物（野外）
  pipe?: 1 // 水管：铺在道路与耕地之下，不阻挡移动（9.5）
  path?: 1 | 2 // 木路 / 石路：移动 +5%，石路不长杂草（12.3）
  gate?: 1 | 2 // 木门：1 关 2 开
  gh?: 1 // 温室里的耕地：四季可种、不受雨水（17.1）
}
export interface Ent {
  id: number; k: PlaceKind; x: number; z: number; job: Job | null
  store?: (Slot | null)[] // 箱子、自动收集柜
  tree?: string; planted?: number; grown?: number; fruit?: number // 果树
  hive?: number // 蜂箱已累计的日结
  lit?: number // 营火燃到的绝对分钟
  open?: boolean // 木门
  ran?: number // 喷灌手动启动的经营日
  top?: string // 桌面类家具上摆的小物件
  queue?: Batch[] // 机器跨夜队列：已预扣原料、尚未开始的批次（设计 §32.1，连当前一批最多 20 批）
  done?: Slot[] // 队列里已做完、等着取出的成品：每种一项、聚合计数（可超过单格堆叠上限，领取时按堆叠放进背包）
}
export interface Batch { at: number; min: number; out: Slot; input: Slot[] } // at：预约时刻（绝对分钟），下一批不早于此开始
export interface Job { doneAt: number; out: Slot; input: Slot[] }
export interface Animal {
  id: number; kind: AnimalKind; name: string; home: number // 所属畜舍（0 = 教学代养）
  fed: number; love: number; pet: number; fedDay: number
  eggs: number // 未取的产物（最多 3 份）
  prog: number // 距下一份产物已过的有效喂养日
  bought: number; lent?: boolean
}
// 农场私人建筑（17.1）：done 完工日；up 升级完工日（0 未升级）；hay 饲料槽；open 畜舍门（放牧）
export interface FarmBuilding { id: number; k: BuildKind; x: number; z: number; done: number; up: number; hay: number; open: boolean; store?: (Slot | null)[]; mach?: Ent[] }
export interface QuestState { st: 'offered' | 'active' | 'ready' | 'done'; prog: number[]; day: number; due?: number }
export interface Friend { pts: number; talked: number; gifted: number; week: number; giftsWeek: number; events: string[] }
export interface GameState {
  schema: 1
  saveId: string; seed: number; createdAt: number; updatedAt: number; commitSeq: number
  settled: number // 最近完成日结的经营日（daySettlementId）
  name: string; farm: string; diff: number
  look?: number // 外观（角色模型序号）
  day: number // 经营日，从 1 开始
  min: number // 当日分钟，360..1560
  region: RegionId; x: number; z: number; face: number
  hp: number; maxHp: number; energy: number; maxEnergy: number; satiety: number; money: number
  inv: (Slot | null)[] // 前 hotbar 格是快捷栏一排，其后是背包格；工具也是背包里的物品
  bind?: string[] // 旧版快捷栏引用（仅用于迁移旧存档）
  sel: number // 选中的快捷栏格（0..hotbar-1）
  tools: Record<ToolId, number> // 工具等级；钓竿 -1 = 尚未获得
  water: number
  xp: Record<Skill, number>
  tiles: Tile[] // 农场地格
  ents: Ent[]
  nextId: number
  ship: Slot[]
  soupDay: number
  warned: number
  // ---- 任务、关系与成长（旧存档读入时由 migrate 补默认值） ----
  quests: Record<string, QuestState>
  flags: string[]
  tracked: string[] // HUD 追踪的任务（最多 3 个，设计 21.1）
  mail: string[] // 未读信件（对应任务 id）
  found: Record<string, number> // 图鉴：物品 id → 首次获得的经营日
  friends: Record<string, Friend>
  hotbar: number // 快捷栏格数：8，工具腰包后 10
  unlocks: string[] // region:x / recipe:x / shop:x / system:x
  // ---- G2：野外、矿洞、动物、工程 ----
  floor: number // 所在矿洞层（不在矿洞为 0）
  deepest: number // 到达过的最深层（5 层解锁升降梯）
  wild: Record<string, { day: number; taken: number[] }> // 野外当日已取走的资源格（区域或 mine:N）
  felled: Record<string, number> // 野外砍倒的树：'区域:格' → 经营日，7 日后再生（8.3）
  animals: Animal[]
  feeder?: number // 旧版禽舍饲料槽（迁移到 farmB）
  builds?: Record<string, number> // 旧版私人建筑完工日（迁移到 farmB）
  farmB: FarmBuilding[] // 农场私人建筑
  house: { lv: number; up: number } // 家宅等级与扩建完工日
  silo: number // 筒仓里的干草
  projects: Record<string, number> // 公共工程完工日（sluice）
  upgrade: { tool: ToolId; tier: number; ready: number } | null // 铁匠铺里正在升级的工具
  fishSeq: number // 钓鱼遭遇序号：咬钩时确定鱼种，读档不重抽（14.1）
  parcel: Slot[] // 待领包裹（矿口失物箱）：背包满时的战斗掉落
  medAt?: number // 上次用药的绝对游戏分钟（6.2/12.4 生命药每 10 分钟最多一份）
  smithJob: Job | null // 铁匠教学炉代炼（Q09 的替代路线）
  // ---- G3：寒冷潮湿、负面状态、料理增益、装备位 ----
  warmth: number // 保暖 0—100（6.4）
  damp: number // 潮湿 0—100
  coldTick?: number // 冻伤计时（游戏分钟）
  status: { k: 'poison' | 'slow'; until: number; next: number }[] // 负面状态，最多 2 个
  buffs: { k: 'work' | 'explore'; fx: string; v: number; until: number }[] // 料理增益：劳动类、探索类各一
  equip: { armor: string | null; coat: string | null } // 防具与防寒衣
  bosses: Record<number, number> // 首领层 → 首次击败的经营日（15.1 永久保留）
  rest?: { day: number; n: number } // 长椅、营火休息当日已恢复的精力（6.3 每日最多 40）
  partner?: { npc: string; stage: 'dating' | 'together'; day: number } | null // 18.2 恋爱与共同生活
  coreOrder?: number // 驿站替代核心件的到货日（0 = 没有订单）
  rooms?: Record<string, Ent[]> // 自己的室内（家、小屋、作坊、禽舍、畜棚）里摆的家具与机器
  donated?: Record<string, number> // 档案馆捐赠：物品 id → 捐出的经营日（与图鉴分开）
  pet?: Pet // 宠物（猫或犬）
  wardrobe?: string[] // 衣柜里的衣物
  outfit?: { hat?: string; top?: string; bottom?: string } // 正穿着的（空着就是建档时角色原本的衣服）
  stash?: Record<string, Slot[]> // 任务暂存（Q23 长桌宴的料理先交给夏禾，取消时原样退还）
}

// ---------- 时间 ----------
export const season = (day: number) => Math.floor((day - 1) / SEASON_DAYS) % 4
export const dayOfSeason = (day: number) => ((day - 1) % SEASON_DAYS) + 1
export const year = (day: number) => Math.floor((day - 1) / (SEASON_DAYS * 4)) + 1
export const weekday = (day: number) => (day - 1) % 7
export const absMin = (s: GameState) => (s.day - 1) * 1440 + Math.floor(s.min)
export const dateName = (day: number) => tr('common.date', SEASON_NAMES[season(day)], dayOfSeason(day))
export function clock(min: number) {
  const m = Math.floor(min / 10) * 10 % 1440
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

// 5.3：0 晴 1 阴 2 雨/雪 3 极端
export function weather(seed: number, day: number): number {
  if (day === 3) return 2 // 首春第 3 日固定下雨
  const w = WEATHER_WEIGHTS[season(day)]
  let r = rand(seed, day, 7) * 100
  for (let i = 0; i < 4; i++) if ((r -= w[i]) < 0) return i
  return 0
}
export const weatherName = (w: number, se: number) => [tr('state.sunny'), tr('state.cloudy'), se === 3 ? tr('state.snow') : tr('state.rain'), EXTREME_NAMES[se]][w]
// 雨天与夏季雷雨视为露天田地已浇水；雪不算
export const weatherWaters = (w: number, se: number) => (w === 2 && se !== 3) || (w === 3 && se === 1)
export const raining = (s: GameState) => weatherWaters(weather(s.seed, s.day), season(s.day))
export function forecast(s: GameState) {
  const name = (d: number) => weatherName(weather(s.seed, d), season(d))
  const next = s.day + 1
  const w = weather(s.seed, next)
  return { tomorrow: name(next), extreme: w === 3 ? EXTREME_NAMES[season(next)] : '', trend: [2, 3, 4].map((k) => `${dateName(s.day + k)} ${name(s.day + k)}`) }
}

export const level = (xp: number) => XP_LEVELS.filter((t) => xp >= t).length - 1

// ---------- 建筑、工程、节庆状态 ----------
export const built = (s: GameState, k: string) => s.farmB.some((b) => b.k === k && b.done <= s.day)
export const projectDone = (s: GameState, id: string) => !!s.projects[id] && s.projects[id] <= s.day
export const sluiceState = (s: GameState) => (projectDone(s, 'sluice') ? 2 : s.projects.sluice ? 1 : 0)
export const projStage = (s: GameState, id: string) => (projectDone(s, id) ? 2 : s.projects[id] ? 1 : 0)
export function festivalToday(s: GameState) {
  return Object.entries(FESTIVALS).find(([, f]) => season(s.day) === f.season && dayOfSeason(s.day) === f.day)?.[0]
}
// 节庆布置：当天 06:00 起到结束时刻
// 今天预约的仪式（Q22/Q23），已办过的不算
export const ceremonyToday = (s: GameState) => Object.keys(CEREMONIES).find((id) => s.flags.includes(`book:${id}:${s.day}`) && !s.flags.includes('event:' + id)) ?? ''
// 返回当天正在布置的节庆或仪式 id（没有则为空串）
export const festivalOn = (s: GameState) => {
  const f = festivalToday(s) || ceremonyToday(s)
  return f && s.min < festDef(f)!.end ? f : ''
}

// ---------- 地图 ----------
export const wildKey = (s: GameState, region: RegionId = s.region) => (region === 'mine' ? 'mine:' + s.floor : region)
export function takenToday(s: GameState, key = wildKey(s)) {
  const w = s.wild[key]
  return w && w.day === s.day ? w.taken : []
}
// 矿洞出口：打碎标记岩，或本层已开采 10 块岩石（15.1 固定探索进度）
export function mineRevealed(s: GameState) {
  if (s.region !== 'mine' || s.floor >= MINE_FLOORS) return false
  const m = mineFloor(s.seed, s.day, s.floor)
  if (m.exit < 0) return false
  const taken = takenToday(s, 'mine:' + s.floor)
  return taken.includes(m.exit) || taken.filter((i) => i < 100000 && m.obs.has(i)).length >= 10
}
export function regionOf(s: GameState, id: RegionId = s.region): RegionDef {
  return regionDef(id, {
    coop: 0, fest: festivalOn(s), sluice: sluiceState(s), floor: s.floor, seed: s.seed, day: s.day,
    revealed: id === 'mine' && mineRevealed(s), boss: id === 'mine' && !!s.bosses[s.floor],
    farmB: id === 'farm' || id.startsWith('in:') ? s.farmB : undefined, pet: !!s.pet, house: s.house.lv, gh: projStage(s, 'greenhouse'),
    bridge: projStage(s, 'bridge'), station: projStage(s, 'station'), windmill: projStage(s, 'windmill'),
  })
}

function inRect(x: number, z: number, b: { x: number; z: number; w: number; d: number }, pad = 0) {
  return x >= b.x - pad && x < b.x + b.w + pad && z >= b.z - pad && z < b.z + b.d + pad
}
export const buildingAt = (s: GameState, x: number, z: number): Building | undefined => regionOf(s).buildings.find((b) => inRect(x, z, b))

// 静态阻挡格：建筑占地 + 实心摆件（按区域变体缓存）
const blockedCache = new WeakMap<RegionDef, Uint8Array>()
// 建筑挡住的格子：只挡模型实际覆盖到（两个方向都盖住四成以上）的格，不留“空气墙”；可进入建筑的门格不挡（走进去就进屋）
function buildingCells(b: Building, mark: (x: number, z: number) => void) {
  const bb = b.model === '' ? undefined : (BUILDING_BOUNDS as Record<string, number[] | string>)[b.model ?? `models/buildings/${b.id}.glb`]
  const door = b.enter ? doorOfBuilding(b).tile : null
  let rect: [number, number, number, number] | null = null
  if (Array.isArray(bb)) {
    const [x0, x1, z0, z1] = bb
    const sx = b.sx ?? 1, sz = b.sz ?? b.sx ?? 1
    const th = ((b.rot ?? 0) * Math.PI) / 2, c = Math.cos(th), sn = Math.sin(th)
    const cx = b.x + b.w / 2, cz = b.z + b.d / 2
    const pts = [[x0 * sx, z0 * sz], [x1 * sx, z0 * sz], [x0 * sx, z1 * sz], [x1 * sx, z1 * sz]].map(([x, z]) => [cx + x * c + z * sn, cz - x * sn + z * c])
    rect = [Math.min(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1])), Math.max(...pts.map((p) => p[1]))]
  }
  for (let z = b.z; z < b.z + b.d; z++) for (let x = b.x; x < b.x + b.w; x++) {
    if (door && x === door[0] && z === door[1]) continue
    if (rect && (Math.min(rect[1], x + 1) - Math.max(rect[0], x) < 0.4 || Math.min(rect[3], z + 1) - Math.max(rect[2], z) < 0.4)) continue
    mark(x, z)
  }
}
export function blockedOf(r: RegionDef) {
  let g = blockedCache.get(r)
  if (!g) {
    const { w, h, buildings, decor } = r
    const grid = (g = new Uint8Array(w * h))
    for (const b of buildings) buildingCells(b, (x, z) => { if (x >= 0 && z >= 0 && x < w && z < h) grid[z * w + x] = 1 })
    for (const d of decor) if (d.solid) {
      const x = Math.floor(d.x), z = Math.floor(d.z)
      if (x >= 0 && z >= 0 && x < w && z < h) g[z * w + x] = 1
    }
    blockedCache.set(r, g)
  }
  return g
}

const blank = (g: number): Tile => ({ g, till: false, wet: 0, fert: 0, crop: null, ob: null, ent: 0 })
// 8.2 农场：门前示范田与禽舍预留地无障碍，其他区域按种子生成障碍密度
function genFarm(seed: number): Tile[] {
  const def = regionDef('farm', { coop: 0, fest: '', sluice: 0, floor: 0, seed, day: 1, revealed: false, boss: false })
  const tiles: Tile[] = []
  for (let z = 0; z < FARM_H; z++) for (let x = 0; x < FARM_W; x++) {
    const t = blank(def.ground(x, z))
    if (!farmReserved(x, z, t.g, def)) {
      const r = rand(seed, x, z, 1)
      t.ob = r < 0.14 ? { k: 'weed', dmg: 0 } : r < 0.2 ? { k: 'stone', dmg: 0 } : r < 0.25 ? { k: 'branch', dmg: 0 }
        : r < 0.3 ? { k: 'tree', dmg: 0 } : null
    }
    tiles.push(t)
  }
  return tiles
}
function farmReserved(x: number, z: number, g: number, def: RegionDef) {
  return g !== 0 || def.buildings.some((b) => inRect(x, z, b, 1)) || !!blockedOf(def)[z * FARM_W + x] ||
    (x >= 13 && x <= 35 && z >= 2 && z <= 17) || x >= 44 || (x - 8) ** 2 + (z - 30) ** 2 <= 30 ||
    inRect(x, z, COOP_SITE, 1) || inRect(x, z, COOP_YARD) || inRect(x, z, GREENHOUSE_SITE, 1) || ((x === 22 || x === 25) && z >= 20)
}

// ---------- 野外地格：按种子与经营日生成，叠加当日已取走与砍伐记录 ----------
const wildCache = new Map<string, Tile[]>()
export const resetWildCache = () => wildCache.clear()
// 室内放置物：家具、机器、箱子（只在自己的室内）；改动后调用 touchRoom 让地格缓存失效
export const entsOf = (s: GameState, region: string = s.region): Ent[] => (region === 'farm' ? s.ents : region.startsWith('in:') ? ((s.rooms ??= {})[region] ??= []) : [])
let roomRev = 0
export const touchRoom = () => { roomRev++ }
function tilesOf(s: GameState): Tile[] {
  if (s.region === 'farm') return s.tiles
  const def = regionOf(s)
  if (def.indoor) {
    const key = `${s.saveId}|${def.key}|${roomRev}`
    let t = wildCache.get(key)
    if (!t) {
      if (wildCache.size > 10) wildCache.clear()
      t = []
      for (let z = 0; z < def.h; z++) for (let x = 0; x < def.w; x++) t.push(blank(def.ground(x, z)))
      // 家具按占地标记每一格；地毯、贴墙的挂件不挡路
      for (const e of entsOf(s)) {
        const [fw, fd] = footOf(e.k)
        const pass = DECOR_BY_ID[e.k]?.flat || DECOR_BY_ID[e.k]?.on === 'wall'
        for (let z = e.z; z < e.z + fd; z++) for (let x = e.x; x < e.x + fw; x++) if (x >= 0 && z >= 0 && x < def.w && z < def.h) { t[z * def.w + x].ent = e.id; if (pass) t[z * def.w + x].gate = 2 }
      }
      wildCache.set(key, t)
    }
    return t
  }
  const key = `${s.saveId}|${s.seed}|${s.day}|${def.key}`
  let t = wildCache.get(key)
  if (!t) {
    if (wildCache.size > 10) wildCache.clear()
    t = genWild(s, def)
    wildCache.set(key, t)
  }
  return t
}
function genWild(s: GameState, def: RegionDef): Tile[] {
  const { w, h } = def
  const tiles: Tile[] = []
  for (let z = 0; z < h; z++) for (let x = 0; x < w; x++) tiles.push(blank(def.ground(x, z)))
  const blocked = blockedOf(def)
  const seed = s.seed, day = s.day
  // 节庆会场草地常年空着（河岸开钓日、萤灯夜在这里站人）
  const stage = FEST_GROUNDS[def.id]
  const free = (i: number) => tiles[i].g === 0 && !blocked[i] && !tiles[i].ob && !tiles[i].fo &&
    !(stage && i % w >= stage[0] && i % w < stage[0] + stage[2] && ((i / w) | 0) >= stage[1] && ((i / w) | 0) < stage[1] + stage[3])
  const nearWater = (i: number) => {
    const x = i % w, z = (i / w) | 0
    return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => isWater(tiles[(z + dz) * w + x + dx]?.g ?? 0) && x + dx >= 0 && x + dx < w)
  }
  // 在候选格中按日随机放 n 个采集物
  const scatter = (cands: number[], n: number, pick: (k: number) => string, salt: number) => {
    for (let k = 0, tries = 0; k < n && tries < n * 6 && cands.length; tries++) {
      const i = cands[Math.floor(rand(seed, day, salt, tries) * cands.length)]
      if (!free(i)) continue
      tiles[i].fo = pick(k)
      k++
    }
  }
  const all = [...Array(w * h).keys()]
  const felled = (i: number) => {
    const d = s.felled[`${def.id}:${i}`]
    return d !== undefined && s.day - d < 7
  }
  if (def.id === 'forest' || def.id === 'mountain' || def.id === 'deepforest') {
    // 树木：位置只随世界种子（长期存在），砍倒后 7 日再生；杂草与枯枝按日刷新；深林是硬木古树（需铁斧）
    for (const i of all) {
      const x = i % w, z = (i / w) | 0
      if (!free(i)) continue
      const open = def.id === 'forest' ? forestOpen(x, z) : def.id === 'deepforest' ? deepforestOpen(x, z)
        : Math.abs(z - 4) < 4 || (x >= STATION.x - 2 && x < STATION.x + STATION.w + 2 && z >= STATION.z - 3 && z < STATION.z + STATION.d + 4) ||
          def.ground(x, z + 1) === 1 || def.ground(x, z - 1) === 1 || def.ground(x + 1, z) === 1 || def.ground(x - 1, z) === 1
      const density = def.id === 'forest' ? 0.34 : def.id === 'deepforest' ? 0.17 : 0.07
      if (!open && rand(seed, x, z, 501) < density && !felled(i)) tiles[i].ob = { k: def.id === 'deepforest' && rand(seed, x, z, 503) < 0.45 ? 'hardtree' : 'tree', dmg: 0 }
      else if (!open || def.id !== 'mountain') {
        const r = rand(seed, day, x, z, 502)
        if (r < 0.025) tiles[i].ob = { k: 'weed', dmg: 0 }
        else if (r < 0.04) tiles[i].ob = { k: def.id === 'deepforest' && r < 0.032 ? 'hardstump' : 'branch', dmg: 0 }
      }
    }
  }
  if (def.id === 'forest') {
    // 14.3 浅林食用采集物每日 12（按季节换品种）、草药 3（冬季 2）
    const cands = all.filter((i) => free(i) && tiles[i].g === 0)
    const pool = FORAGE_BY_SEASON[season(day)]
    scatter(cands, 12, (k) => {
      let r = rand(seed, day, k, 511)
      return (pool.find(([, p]) => (r -= p) < 0) ?? pool[0])[0]
    }, 512)
    scatter(cands, season(day) === 3 ? 2 : 3, () => 'herb', 513)
  } else if (def.id === 'river') {
    for (const i of all) if (free(i) && nearWater(i) && rand(seed, day, i, 601) < 0.22) tiles[i].ob = { k: 'reed', dmg: 0 }
    const bank = all.filter((i) => free(i) && nearWater(i))
    scatter(bank, 8, (k) => (k < 3 ? 'clay' : k < 6 ? 'wood' : 'herb'), 602) // 河岸漂流物每日 8
    const land = all.filter((i) => free(i) && !nearWater(i) && def.ground(i % w, (i / w) | 0) === 0)
    for (let k = 0, n = 0; k < 40 && n < 7; k++) {
      const i = land[Math.floor(rand(seed, day, k, 603) * land.length)]
      if (i !== undefined && free(i)) { tiles[i].ob = { k: 'stone', dmg: 0 }; n++ }
    }
  } else if (def.id === 'deepforest' || def.id === 'wetland' || def.id === 'highland') {
    // 14.3 深林与湿地各 12；高地晚期采集：草药与季节野果
    const cands = all.filter((i) => free(i) && tiles[i].g === 0)
    const pool = FORAGE_BY_SEASON[season(day)]
    scatter(cands, def.id === 'highland' ? 8 : 12, (k) => {
      let r = rand(seed, day, k, 521, def.w)
      if (def.id !== 'deepforest' && r < 0.3) return 'herb'
      return (pool.find(([, p]) => (r -= p) < 0) ?? pool[0])[0]
    }, 522)
    if (def.id === 'wetland') for (const i of all) if (free(i) && nearWater(i) && rand(seed, day, i, 611) < 0.3) tiles[i].ob = { k: 'reed', dmg: 0 }
    if (def.id === 'highland') for (let k = 0, n = 0; k < 40 && n < 6; k++) {
      const i = cands[Math.floor(rand(seed, day, k, 711) * cands.length)]
      if (i !== undefined && free(i)) { tiles[i].ob = { k: 'stone', dmg: 0 }; n++ }
    }
  } else if (def.id === 'mountain') {
    // 山道草药/石材点每日 10
    const land = all.filter((i) => free(i))
    for (let k = 0, n = 0; k < 40 && n < 6; k++) {
      const i = land[Math.floor(rand(seed, day, k, 701) * land.length)]
      if (i !== undefined && free(i)) { tiles[i].ob = { k: 'stone', dmg: 0 }; n++ }
    }
    scatter(land, 4, () => 'herb', 702)
  } else if (def.id === 'mine') {
    const m = mineFloor(s.seed, s.day, s.floor)
    const open = mineRevealed(s)
    for (const [i, k] of m.obs) if (!blocked[i] && !(open && i === m.exit)) tiles[i].ob = { k, dmg: 0 }
  }
  for (const i of takenToday(s, wildKey(s, def.id))) if (i < tiles.length) { tiles[i].ob = null; tiles[i].fo = undefined }
  return tiles
}
// 取走野外资源：同时改缓存地格与存档记录
export function takeWild(s: GameState, x: number, z: number) {
  markTaken(s, wildKey(s), z * regionOf(s).w + x)
}
// 当日已取走/已击败（矿洞敌人记 100000+序号）
export function markTaken(s: GameState, key: string, i: number) {
  const w = s.wild[key]?.day === s.day ? s.wild[key] : (s.wild[key] = { day: s.day, taken: [] })
  if (!w.taken.includes(i)) w.taken.push(i)
}
export function fellWild(s: GameState, x: number, z: number) {
  s.felled[`${s.region}:${z * regionOf(s).w + x}`] = s.day
}

export function tileAt(s: GameState, x: number, z: number): Tile | null {
  const r = regionOf(s)
  if (x < 0 || z < 0 || x >= r.w || z >= r.h) return null
  return tilesOf(s)[z * r.w + x]
}
// 杂草、芦苇可以直接走过去（但要先用镰刀割掉才能开垦、种植、摆放）
const WALK_THROUGH = new Set(['weed', 'reed'])
// 区域、地格与阻挡表一次取好，批量判断（寻路、可达性逐格调用；每次都重算区域在满载农场上一次搜索要 7—28 毫秒）
export function solidTest(s: GameState) {
  const r = regionOf(s), tiles = tilesOf(s), blocked = blockedOf(r)
  return (x: number, z: number) => {
    if (x < 0 || z < 0 || x >= r.w || z >= r.h) return true
    const t = tiles[z * r.w + x]
    return !WALKABLE(t.g) || (!!t.ob && !WALK_THROUGH.has(t.ob.k)) || (!!t.ent && t.gate !== 2) || !!blocked[z * r.w + x]
  }
}
export const solid = (s: GameState, x: number, z: number) => solidTest(s)(x, z)
export const WALKABLE_G = WALKABLE

// ---------- 库存（全有或全无，设计 32.3） ----------
const same = (sl: Slot, id: string, q: number, b: number) => sl.id === id && sl.q === q && (sl.b ?? 0) === b
export function room(inv: (Slot | null)[], id: string, q = 0, b = 0) {
  const stack = ITEMS[id].stack
  let n = 0
  for (const sl of inv) n += !sl ? stack : same(sl, id, q, b) ? stack - sl.n : 0
  return n
}
export function addItem(inv: (Slot | null)[], id: string, q: number, n: number, b = 0): boolean {
  if (room(inv, id, q, b) < n) return false
  const stack = ITEMS[id].stack
  for (const sl of inv) if (sl && same(sl, id, q, b) && n > 0) { const k = Math.min(n, stack - sl.n); sl.n += k; n -= k }
  for (let i = 0; i < inv.length && n > 0; i++) if (!inv[i]) { const k = Math.min(n, stack); inv[i] = b ? { id, q, n: k, b: 1 } : { id, q, n: k }; n -= k }
  return true
}
export const count = (inv: (Slot | null)[], id: string) => inv.reduce((a, sl) => a + (sl?.id === id ? sl.n : 0), 0)
export function removeItem(inv: (Slot | null)[], id: string, n: number): boolean {
  if (count(inv, id) < n) return false
  // 先扣低品质
  const idx = inv.map((sl, i) => [sl, i] as const).filter(([sl]) => sl?.id === id).sort((a, b) => a[0]!.q - b[0]!.q)
  for (const [sl, i] of idx) { const k = Math.min(n, sl!.n); sl!.n -= k; n -= k; if (!sl!.n) inv[i] = null }
  return true
}
// 机器/配方输入规格：'id'、'a|b' 任选、'#tag' 按标签
export const specMatch = (spec: string, id: string) =>
  spec.startsWith('#') ? (ITEMS[id]?.tags?.includes(spec.slice(1)) ?? false) : spec.split('|').includes(id)
export const countSpec = (inv: (Slot | null)[], spec: string, own = false) => inv.reduce((a, sl) => a + (sl && specMatch(spec, sl.id) && !(own && sl.b) ? sl.n : 0), 0)
// 按规格扣除，返回实际扣掉的物品（先扣低价、低品质）
export function removeSpec(inv: (Slot | null)[], spec: string, n: number, own = false): Slot[] | null {
  if (countSpec(inv, spec, own) < n) return null
  const out: Slot[] = []
  const idx = inv.map((sl, i) => [sl, i] as const).filter(([sl]) => sl && specMatch(spec, sl.id) && !(own && sl.b))
    .sort((a, b) => ITEMS[a[0]!.id].sell - ITEMS[b[0]!.id].sell || a[0]!.q - b[0]!.q)
  for (const [sl, i] of idx) {
    if (n <= 0) break
    const k = Math.min(n, sl!.n)
    sl!.n -= k
    n -= k
    const same = out.find((o) => o.id === sl!.id && o.q === sl!.q && !!o.b === !!sl!.b)
    if (same) same.n += k
    else out.push({ id: sl!.id, q: sl!.q, n: k, ...(sl!.b ? { b: 1 } : {}) })
    if (!sl!.n) inv[i] = null
  }
  return out
}

export const isMature = (c: Crop) => !c.dead && c.prog >= (c.harvests ? CROPS[c.cid].regrowDays : CROPS[c.cid].growthDays)

// 工具物品（钓竿为 rod_basic）
export const toolItem = (t: ToolId): Slot => ({ id: t === 'rod' ? 'rod_basic' : 'tool_' + t, q: 0, n: 1 })
export const selItem = (s: GameState) => s.inv[s.sel] ?? null
export const bagSize = (s: GameState) => s.inv.length - s.hotbar

export function newGame(name: string, farm: string, diff: number, seed = (Math.random() * 2 ** 31) | 0, look = 0): GameState {
  const inv: (Slot | null)[] = Array(8 + START.backpackSlots).fill(null)
  ;(['hoe', 'can', 'axe', 'pick', 'scythe'] as ToolId[]).forEach((t, i) => (inv[i] = toolItem(t)))
  inv[5] = { id: 'seed_spring_radish', q: 0, n: START.initialRadishSeeds }
  const now = Date.now()
  const s: GameState = {
    schema: 1, saveId: `${now.toString(36)}-${seed.toString(36)}`, seed, createdAt: now, updatedAt: now, commitSeq: 0, settled: 0,
    name: name.trim() || tr('common.namelessTraveler'), farm: farm.trim() || tr('common.astralFarm'), diff, look,
    day: 1, min: DAY_START, region: 'farm', x: 24, z: 10.2, face: 0,
    hp: START.hp, maxHp: START.hp, energy: START.energy, maxEnergy: START.energy, satiety: START.satiety, money: START.money,
    inv, sel: 0,
    tools: { hoe: 0, can: 0, axe: 0, pick: 0, scythe: 0, rod: -1 }, water: 40,
    xp: { farming: 0, foraging: 0, mining: 0, fishing: 0, husbandry: 0, combat: 0 },
    tiles: genFarm(seed), ents: [], nextId: 1, ship: [], soupDay: 0, warned: 0,
    quests: {}, flags: [], tracked: [], mail: [], found: {}, friends: {}, hotbar: 8, unlocks: [],
    floor: 0, deepest: 0, wild: {}, felled: {}, animals: [], farmB: [], house: { lv: 0, up: 0 }, silo: 0, projects: {}, upgrade: null, fishSeq: 0,
    parcel: [], smithJob: null,
    warmth: 100, damp: 0, status: [], buffs: [], equip: { armor: null, coat: null }, bosses: {},
  }
  return s
}

// 旧存档补字段（schema 1 内的向前兼容）；快捷栏绑定数量跟随格数
export function migrate(s: GameState): GameState {
  s.quests ??= {}
  s.flags ??= []
  s.tracked ??= []
  s.mail ??= []
  s.found ??= {}
  s.friends ??= {}
  s.hotbar ??= 8
  s.unlocks ??= []
  s.floor ??= 0
  s.deepest ??= 0
  s.wild ??= {}
  s.felled ??= {}
  s.animals ??= []
  s.farmB ??= []
  s.house ??= { lv: 0, up: 0 }
  s.silo ??= 0
  // 旧版固定位置的禽舍 → 农场建筑表；动物补上所属畜舍与产物进度
  if (s.builds?.coop && !s.farmB.some((b) => b.k === 'coop')) s.farmB.push({ id: s.nextId++, k: 'coop', x: COOP_SITE.x, z: COOP_SITE.z, done: s.builds.coop, up: 0, hay: s.feeder ?? 0, open: false })
  delete s.builds
  delete s.feeder
  s.rooms ??= {}
  for (const b of s.farmB) if (b.mach?.length) {
    const room = (s.rooms[`in:workshop:${b.id}`] ??= [])
    b.mach.forEach((e, i) => room.push({ ...e, x: 2 + (i % 4) * 2, z: 3 + Math.floor(i / 4) * 2 }))
    delete b.mach
  }
  const coop = s.farmB.find((b) => b.k === 'coop')
  for (const a of s.animals) { a.home ??= a.lent ? 0 : coop?.id ?? 0; a.prog ??= 0 }
  s.projects ??= {}
  s.upgrade ??= null
  s.fishSeq ??= 0
  s.parcel ??= []
  s.smithJob ??= null
  s.warmth ??= 100
  s.damp ??= 0
  s.status ??= []
  s.buffs ??= []
  s.equip ??= { armor: null, coat: null }
  s.bosses ??= {}
  s.tools.rod ??= -1
  if (Array.isArray(s.bind)) migrateHotbar(s)
  s.sel = Math.min(s.sel, s.hotbar - 1)
  for (const sl of s.inv) if (sl) s.found[sl.id] ??= s.day
  // G2 地图：通往浅林的南路与禽舍预留地上不应有障碍
  const def = regionDef('farm', { coop: 0, fest: '', sluice: 0, floor: 0, seed: s.seed, day: s.day, revealed: false, boss: false })
  for (let z = 0; z < FARM_H; z++) for (let x = 0; x < FARM_W; x++) {
    const t = s.tiles[z * FARM_W + x]
    const g = def.ground(x, z)
    if (g !== 0 && t.g !== g && !t.till && !t.ent) { t.g = g; t.ob = null }
    if ((inRect(x, z, COOP_YARD) || inRect(x, z, GREENHOUSE_SITE, 1) || (inRect(x, z, COOP_SITE, 1) && !s.farmB.some((b) => b.k !== 'coop' && inRect(x, z, { ...b, w: BUILDINGS[b.k].w, d: BUILDINGS[b.k].d })))) && t.ob) t.ob = null
  }
  if (s.region === 'mine' && !s.floor) s.region = 'mountain'
  return s
}

// 旧版（快捷栏引用背包格/工具位）→ 新版（快捷栏就是背包前几格，工具是物品）
function migrateHotbar(s: GameState) {
  const old = s.inv
  const bind = s.bind!
  const bar: (Slot | null)[] = Array(s.hotbar).fill(null)
  const used = new Set<number>()
  bind.slice(0, s.hotbar).forEach((b, i) => {
    if (b.startsWith('tool:')) {
      const t = b.slice(5) as ToolId
      if ((s.tools[t] ?? -1) >= 0) bar[i] = toolItem(t)
    } else {
      const k = +b.slice(5)
      if (!used.has(k) && old[k]) { bar[i] = old[k]; used.add(k) }
    }
  })
  const bag = old.map((sl, k) => (used.has(k) ? null : sl))
  for (const t of Object.keys(TOOLS) as ToolId[]) {
    if ((s.tools[t] ?? -1) < 0 || bar.some((x) => x && ITEMS[x.id]?.tool === t) || bag.some((x) => x && ITEMS[x.id]?.tool === t)) continue
    const i = bag.indexOf(null)
    if (i >= 0) bag[i] = toolItem(t)
    else bag.push(toolItem(t))
  }
  s.inv = [...bar, ...bag]
  delete s.bind
}

// 25.3 读档与导入共用的完整校验：字段、数值范围、内容 ID、实体引用
const num = (v: unknown, lo = -Infinity, hi = Infinity) => typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi
function slotOk(v: unknown, capped = true) {
  const sl = v as Slot
  return !!sl && !!ITEMS[sl?.id] && num(sl.q, 0, 2) && Number.isInteger(sl.n) && num(sl.n, 1, capped ? ITEMS[sl.id].stack : Infinity) && (sl.b === undefined || sl.b === 1)
}
const REGION_IDS = ['farm', 'town', 'river', 'forest', 'mountain', 'mine', 'deepforest', 'wetland', 'highland']
const regionIdOk = (r: string) => REGION_IDS.includes(r) || /^in:[a-z_]+(:\d+)?$/.test(r)
const isObj = (v: unknown) => !!v && typeof v === 'object' && !Array.isArray(v)
const queueOk = (e: Ent) => (e.queue === undefined || (Array.isArray(e.queue) && e.queue.length < 20 && e.queue.every((b) => isObj(b) && num(b.at) && num(b.min, 0) && slotOk(b.out) && Array.isArray(b.input) && b.input.every((x) => slotOk(x))))) &&
  (e.done === undefined || (Array.isArray(e.done) && e.done.length <= 40 && e.done.every((x) => slotOk(x, false)))) // 攒着的成品按种类聚合计数，可以超过单格上限
export function validState(v: unknown): v is GameState {
  const s = v as GameState
  if (!s || typeof s !== 'object' || s.schema !== 1) return false
  if (![s.saveId, s.name, s.farm].every((x) => typeof x === 'string')) return false
  if (!num(s.seed) || !num(s.day, 1) || !num(s.min, DAY_START, DAY_END) || !num(s.settled, 0) || !num(s.diff, 0, 2)) return false
  if (s.look !== undefined && !num(s.look, 0, 63)) return false
  if (!regionIdOk(s.region) || !num(s.x) || !num(s.z) || !num(s.face) || !Number.isInteger(s.sel) || !num(s.sel, 0, (s.hotbar ?? 8) - 1)) return false
  if (s.quests !== undefined && !(isObj(s.quests) && Object.values(s.quests).every((q) => isObj(q) && ['offered', 'active', 'ready', 'done'].includes(q.st) &&
    Array.isArray(q.prog) && q.prog.every((n) => num(n, 0)) && num(q.day, 0) && (q.due === undefined || num(q.due, 0))))) return false
  if (s.friends !== undefined && !(isObj(s.friends) && Object.values(s.friends).every((f) => isObj(f) &&
    [f.pts, f.talked, f.gifted, f.week, f.giftsWeek].every((v) => num(v, 0)) && f.pts <= 1000 && Array.isArray(f.events) && f.events.every((e) => typeof e === 'string')))) return false
  if ([s.flags, s.tracked, s.mail, s.unlocks].some((a) => a !== undefined && Array.isArray(a) && !a.every((x) => typeof x === 'string'))) return false
  if ([s.flags, s.tracked, s.mail, s.unlocks, s.animals].some((a) => a !== undefined && !Array.isArray(a))) return false
  if ([s.wild, s.felled, s.builds, s.projects, s.bosses].some((o) => o !== undefined && !isObj(o))) return false
  if (s.farmB !== undefined && !(Array.isArray(s.farmB) && s.farmB.length <= 40 && s.farmB.every((b) => isObj(b) && b.k in BUILDINGS && num(b.id, 1) &&
    [b.x, b.z, b.done, b.up, b.hay].every((v) => Number.isInteger(v) && num(v, 0)) && b.x + BUILDINGS[b.k].w <= FARM_W && b.z + BUILDINGS[b.k].d <= FARM_H && b.hay <= 30 &&
    typeof b.open === 'boolean' && (b.store === undefined || (Array.isArray(b.store) && b.store.length <= 48 && b.store.every((x) => x === null || slotOk(x)))) &&
    (b.mach === undefined || (Array.isArray(b.mach) && b.mach.length <= 6))))) return false
  if (s.house !== undefined && !(isObj(s.house) && num(s.house.lv, 0, 2) && Number.isInteger(s.house.lv) && num(s.house.up, 0))) return false
  if (s.silo !== undefined && !(Number.isInteger(s.silo) && num(s.silo, 0, 960))) return false
  if (s.wardrobe !== undefined && !(Array.isArray(s.wardrobe) && s.wardrobe.length <= 200 && s.wardrobe.every((id) => typeof id === 'string' && !!ITEMS[id]?.wear))) return false
  if (s.outfit !== undefined && !(isObj(s.outfit) && Object.entries(s.outfit).every(([k, id]) => ['hat', 'top', 'bottom'].includes(k) && ITEMS[id as string]?.wear === k))) return false
  if (s.pet !== undefined && !(isObj(s.pet) && s.pet.kind in PETS && typeof s.pet.name === 'string' && s.pet.name.length <= 8 && num(s.pet.love, 0, 1000) && num(s.pet.pet, 0) && num(s.pet.fed, 0))) return false
  if (s.stash !== undefined && !(isObj(s.stash) && Object.values(s.stash).every((l) => Array.isArray(l) && l.length <= 12 && l.every((x) => slotOk(x))))) return false
  if (s.region.startsWith('in:')) { try { if (!regionOf(s)) return false } catch { return false } }
  if (s.donated !== undefined && !(isObj(s.donated) && Object.values(s.donated).every((d) => Number.isInteger(d) && num(d, 1)))) return false
  if (s.bosses && !Object.entries(s.bosses).every(([k, d]) => [10, 20, 30].includes(+k) && Number.isInteger(d) && num(d, 1))) return false
  if (s.floor !== undefined && !(Number.isInteger(s.floor) && num(s.floor, 0, MINE_FLOORS))) return false
  if (s.hotbar !== undefined && !(s.hotbar === 8 || s.hotbar === 10 || s.hotbar === 12)) return false
  if ([s.deepest, s.fishSeq].some((v) => v !== undefined && !(Number.isInteger(v) && num(v, 0)))) return false
  if (s.deepest !== undefined && s.deepest > MINE_FLOORS) return false
  if (s.feeder !== undefined && !(Number.isInteger(s.feeder) && num(s.feeder, 0, 30))) return false
  const homeIds = new Set((s.farmB ?? []).map((b) => b.id))
  if ([s.builds, s.projects, s.felled].some((o) => o && !Object.values(o).every((d) => Number.isInteger(d) && num(d, 0)))) return false
  if (s.wild && !Object.values(s.wild).every((w) => isObj(w) && num(w.day, 0) && Array.isArray(w.taken) && w.taken.every((i) => Number.isInteger(i) && num(i, 0)))) return false
  if (s.region === 'mine' && !num(s.floor, 1, MINE_FLOORS)) return false
  if (s.animals && (s.animals.length > 200 || !s.animals.every((a) => !!a && a.kind in ANIMALS && num(a.id) && typeof a.name === 'string' &&
    [a.fed, a.pet, a.fedDay, a.bought].every((v) => Number.isInteger(v) && num(v, 0)) && num(a.love, 0, 1000) && Number.isInteger(a.eggs) && num(a.eggs, 0, 3) &&
    (a.prog === undefined || (Number.isInteger(a.prog) && num(a.prog, 0, 3))) && (a.home === undefined || a.home === 0 || homeIds.has(a.home) || !s.farmB)))) return false
  if (s.upgrade && !(s.upgrade.tool in TOOLS && num(s.upgrade.tier, 1, 3) && num(s.upgrade.ready, 1))) return false
  if (s.medAt !== undefined && !num(s.medAt)) return false
  if (s.coreOrder !== undefined && !(Number.isInteger(s.coreOrder) && num(s.coreOrder, 0))) return false
  if (s.rooms !== undefined && !(isObj(s.rooms) && Object.entries(s.rooms).every(([k, list]) => regionIdOk(k) && Array.isArray(list) && list.length <= 200 &&
    list.every((e) => isObj(e) && num(e.id) && num(e.x, 0, 40) && num(e.z, 0, 40) && !!ITEMS[e.k]?.place && (e.top === undefined || !!ITEMS[e.top]) && queueOk(e) && (e.store === undefined || (Array.isArray(e.store) && e.store.every((x) => x === null || slotOk(x)))))))) return false
  if (s.partner && !(isObj(s.partner) && typeof s.partner.npc === 'string' && (s.partner.stage === 'dating' || s.partner.stage === 'together') && num(s.partner.day, 1))) return false
  if ([s.warmth, s.damp].some((v) => v !== undefined && !num(v, 0, 100))) return false
  if (s.status !== undefined && !(Array.isArray(s.status) && s.status.length <= 2 && s.status.every((x) => isObj(x) && (x.k === 'poison' || x.k === 'slow') && num(x.until) && num(x.next)))) return false
  if (s.buffs !== undefined && !(Array.isArray(s.buffs) && s.buffs.length <= 2 && s.buffs.every((b) => isObj(b) && (b.k === 'work' || b.k === 'explore') && typeof b.fx === 'string' && num(b.v) && num(b.until)))) return false
  if (s.equip !== undefined && !(isObj(s.equip) && (['armor', 'coat'] as const).every((k) => s.equip[k] === null || ITEMS[s.equip[k]!]?.equip === k))) return false
  if (s.parcel !== undefined && !(Array.isArray(s.parcel) && s.parcel.length <= 64 && s.parcel.every((sl) => slotOk(sl, false)))) return false
  if (s.smithJob && !(num(s.smithJob.doneAt) && slotOk(s.smithJob.out) && Array.isArray(s.smithJob.input) && s.smithJob.input.every((x) => slotOk(x)))) return false
  if (![s.hp, s.maxHp, s.energy, s.maxEnergy, s.satiety, s.money, s.water, s.nextId, s.soupDay, s.warned, s.commitSeq].every((x) => num(x, 0))) return false
  const legacy = s.bind !== undefined
  if (!Array.isArray(s.inv) || s.inv.length < (legacy ? 0 : s.hotbar ?? 8) + START.backpackSlots || !s.inv.every((sl) => sl === null || slotOk(sl))) return false
  // 工具物品唯一
  const toolCount = new Map<string, number>()
  for (const sl of s.inv) if (sl && ITEMS[sl.id].tool) toolCount.set(sl.id, (toolCount.get(sl.id) ?? 0) + sl.n)
  if ([...toolCount.values()].some((n) => n > 1)) return false
  if (!Array.isArray(s.ship) || !s.ship.every((sl) => slotOk(sl, false))) return false
  if (legacy && (!Array.isArray(s.bind) || s.bind.length < 8 || s.bind.length > 12 ||
    !s.bind.every((b) => typeof b === 'string' && (b.startsWith('tool:') ? b.slice(5) in TOOLS : b.startsWith('slot:') && num(+b.slice(5), 0, s.inv.length - 1))))) return false
  if (!SKILLS.every((k) => num(s.xp?.[k], 0)) || !(Object.keys(TOOLS) as ToolId[]).every((k) => s.tools?.[k] === undefined && k === 'rod' || num(s.tools?.[k], k === 'rod' ? -1 : 0, 3))) return false
  if (!Array.isArray(s.tiles) || s.tiles.length !== FARM_W * FARM_H || !Array.isArray(s.ents)) return false
  const ids = new Set(s.ents.map((e) => e?.id))
  const entOk = s.ents.every((e) => !!ITEMS[e.k]?.place || e.k === 'fruit_tree' || e.k === 'wild_tree' ? num(e.x, 0, FARM_W - 1) && num(e.z, 0, FARM_H - 1) &&
    s.tiles[e.z * FARM_W + e.x]?.ent === e.id && (e.job === null || (num(e.job.doneAt) && slotOk(e.job.out) && Array.isArray(e.job.input) && e.job.input.every((x) => slotOk(x)))) &&
    (e.store === undefined || (Array.isArray(e.store) && e.store.length <= 48 && e.store.every((x) => x === null || slotOk(x)))) && queueOk(e) &&
    (e.k !== 'fruit_tree' || !!ITEMS['sapling_' + e.tree]) : false)
  return entOk && s.tiles.every((t) => !!t && num(t.g, 0, 2) && typeof t.till === 'boolean' && num(t.wet) && num(t.fert, 0, 2) &&
    [t.pipe, t.path, t.gate, t.gh].every((v) => v === undefined || v === 1 || v === 2) &&
    (t.ent === 0 || ids.has(t.ent)) && (t.ob === null || (t.ob?.k in OBSTACLES && num(t.ob.dmg, 0))) &&
    (t.crop === null || (!!CROPS[t.crop?.cid] && num(t.crop.id) && num(t.crop.prog, 0) && num(t.crop.harvests, 0) && num(t.crop.dry, 0) && typeof t.crop.dead === 'boolean')))
}
export { MINE_W }
