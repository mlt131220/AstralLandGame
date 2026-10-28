// 日结：原子执行，顺序固定（设计 5.2）；同一 daySettlementId 重复执行无效果。
import { CROPS, DAY_START, DIFFICULTY, ITEMS, PROJECTS, TOOL_TIER, TOOLS } from '../content/content.ts'
import { MAX_BATCHES, itemName, price } from './actions.ts'
import { animalsSettle } from './animals.ts'
import { buildingsSettle, yardOf } from './buildings.ts'
import { collectorsSettle, placeablesSettle, runHoppers } from './placeables.ts'
import { expireOrders, progress, refreshQuests } from './quests.ts'
import { COOP_SITE, COOP_YARD, FARM_H, FARM_W, GREENHOUSE_SITE } from './regions.ts'
import { addItem, isMature, rand, regionOf, season, weather, weatherWaters, type GameState } from './state.ts'
import { NPC_DEFS } from '../content/story.ts'
import { t as tr } from './i18n.ts'

export interface Summary {
  day: number
  lines: { name: string; n: number; gain: number }[]
  total: number
  fee: number
  grew: number
  died: number
  withered: number
  weather: number
  passedOut: boolean
  notes: string[] // 完工、动物等次日早晨要告知的事
  rescued: string // 在野外/矿洞倒下时的救援说明
}

export function endDay(s: GameState, passedOut: boolean, dayId = s.day): Summary | null {
  if (s.settled >= dayId || dayId !== s.day) return null
  const D = DIFFICULTY[s.diff]
  const today = s.day
  const next = today + 1
  const sleptAt = s.min
  const notes: string[] = []
  const rescued = passedOut ? (s.region === 'mine' ? tr('settle.collapsedMinesRescueTeam') : s.region === 'farm' ? '' : tr('settle.collapsedExhaustionPassingVillager')) : ''

  // 睡前：自动进料柜把相邻机器的跨夜队列预约满（只用此刻箱子里的原料，§32.1）
  runHoppers(s, MAX_BATCHES)

  // 作物：当天有水 +1 生长日；未浇水累计缺水，达到阈值枯死（成熟植株不受缺水影响，32.2）
  let grew = 0, died = 0, withered = 0
  const seasonChange = season(next) !== season(today)
  for (const t of s.tiles) {
    const c = t.crop
    if (!c || c.dead) continue
    if (!isMature(c)) {
      if (t.wet >= today) { c.prog++; c.dry = 0; grew++ }
      else if (++c.dry >= D.dryDeath) { c.dead = true; died++ }
    }
    // 先算生长再检查新季节，包括恰好今早长熟的作物（9.1）；温室四季可种
    if (seasonChange && !c.dead && !t.gh && !CROPS[c.cid].seasons.includes(season(next))) { c.dead = true; withered++ }
  }

  // 救援费按昏倒时的金币计算；首 7 日免费（6.5）
  const fee = passedOut && today > 7 ? Math.min(D.feeCap, Math.floor(s.money * D.fee)) : 0
  s.money -= fee

  // 出货
  const lines = s.ship.map((sl) => ({ name: itemName(sl), n: sl.n, gain: price(sl) * sl.n }))
  const total = lines.reduce((a, l) => a + l.gain, 0)
  s.money += total
  for (const sl of s.ship) progress(s, { type: 'ship', item: sl.id, n: sl.n, tags: ITEMS[sl.id].tags })
  if (total) progress(s, { type: 'earn', gold: total })
  s.ship = []

  // 动物：手喂、放牧、饲料槽与筒仓（10.2）；自动收集柜收取产物
  notes.push(...animalsSettle(s))
  collectorsSettle(s)

  // 次日天气：雨天露天田地视为已浇水（温室屋顶隔雨，9.5 / 5.3）
  const w = weather(s.seed, next)
  if (weatherWaters(w, season(next))) for (const t of s.tiles) if (t.till && !t.gh) t.wet = next
  // 喷灌、果树、蜂箱（先清理过期供水，再应用雨天与喷灌）；自动进料柜
  notes.push(...placeablesSettle(s, today, next))
  runHoppers(s)

  // 空闲草地少量长杂草，不破坏设施（8.3）
  const farm = regionOf(s, 'farm')
  for (let i = 0; i < 4; i++) {
    const x = Math.floor(rand(s.seed, next, i, 11) * FARM_W)
    const z = Math.floor(rand(s.seed, next, i, 12) * FARM_H)
    const t = s.tiles[z * FARM_W + x]
    const inB = [...farm.buildings, ...s.farmB.map((b) => yardOf(b)), COOP_SITE, COOP_YARD, GREENHOUSE_SITE].some((b) => x >= b.x - 1 && x < b.x + b.w + 1 && z >= b.z - 1 && z < b.z + b.d + 1)
    if (t.g === 0 && !t.till && !t.ob && !t.ent && !t.path && !t.pipe && x < 45 && !inB) t.ob = { k: 'weed', dmg: 0 }
  }

  // 次日 06:00 完工的工具升级、建筑与公共工程（11.1 / 17.2）
  if (s.upgrade && s.upgrade.ready <= next) {
    const u = s.upgrade
    s.tools[u.tool] = Math.max(s.tools[u.tool], u.tier)
    s.upgrade = null
    notes.push(tr('settle.oldTaoFinishedAlready', TOOL_TIER[u.tier], TOOLS[u.tool].name))
  }
  notes.push(...buildingsSettle(s, next))
  for (const [id, d] of Object.entries(s.projects)) if (d === next) {
    notes.push(tr('settle.complete', PROJECTS[id as keyof typeof PROJECTS]?.name ?? id))
    if (id === 'greenhouse') { // 温室里 8×6 = 48 格四季耕地
      const G = GREENHOUSE_SITE
      for (let z = G.z + 1; z < G.z + G.d - 1; z++) for (let x = G.x + 1; x < G.x + G.w - 1; x++) { const t = s.tiles[z * FARM_W + x]; t.gh = 1; t.ob = null; t.g = 0 }
    }
  }

  notes.push(...expireOrders(s, next))
  // 17.4 共居对象每日一项非关键帮助：一份简单早餐
  if (s.partner?.stage === 'together' && s.partner.day < next) {
    const dish = rand(s.seed, next, 41) < 0.5 ? 'soup_clear' : 'egg_fried'
    if (addItem(s.inv, dish, 0, 1)) notes.push(tr('settle.left', NPC_DEFS[s.partner.npc]?.name ?? tr('settle.partner'), ITEMS[dish].name))
  }
  // 18.2 挑战模式：连续 14 日没互动每天 -2，不低于已完成事件的里程碑
  if (s.diff === 2) for (const [npc, f] of Object.entries(s.friends)) {
    if (next - Math.max(f.talked, f.gifted) <= 14) continue
    const floor = [200, 400, 600].filter((t) => f.events.some((e) => e.endsWith('_' + t))).pop() ?? 0
    f.pts = Math.max(floor, f.pts - 2)
    void npc
  }

  // 野外资源记录只保留当日；砍倒的树 7 日后再生
  for (const k of Object.keys(s.wild)) if (s.wild[k].day < next) delete s.wild[k]
  for (const [k, d] of Object.entries(s.felled)) if (next - d >= 7) delete s.felled[k]

  // 玩家恢复（6.3）：按入睡时间给恢复上限，取原有精力与恢复额度的较大值
  const pct = passedOut ? 0.6 : sleptAt < 1440 ? 1 : sleptAt < 1500 ? 0.85 : 0.7
  s.energy = Math.max(s.energy, Math.floor(s.maxEnergy * pct * (s.satiety < 30 ? 0.8 : 1)))
  s.hp = s.maxHp
  s.satiety = Math.max(s.satiety, 30)
  s.warmth = 100
  s.damp = 0
  s.status = []

  s.day = next
  s.min = DAY_START
  s.settled = today
  s.warned = 0
  // 入冬：石婆织了一套冬衣（雪花毛衣、防寒裤、雪绒帽），直接放进衣柜
  if (season(next) === 3 && !s.flags.includes('gift:winter_wear')) {
    s.flags.push('gift:winter_wear')
    for (const id of ['wear_top_snowflake', 'wear_bottom_snow', 'wear_hat_snow']) if (!(s.wardrobe ??= []).includes(id)) s.wardrobe.push(id)
    notes.push(tr('settle.grannyShiSentOver'))
  }
  // 在家里醒来（床边）
  s.region = 'in:house'
  s.floor = 0
  const home = regionOf(s)
  ;[s.x, s.z] = home.spots['床边'] ? [home.spots['床边'].x, home.spots['床边'].z] : home.spawn // i18n-ignore
  refreshQuests(s) // 新的一天可能解锁按日期开放的任务
  return { day: today, lines, total, fee, grew, died, withered, weather: w, passedOut, notes, rescued }
}

// 日结事务（T09）：中途出错就把状态整体退回睡前，不留下半个日结；调用方提示后保持睡前存档
export function endDaySafe(s: GameState, passedOut: boolean, dayId = s.day): { sum: ReturnType<typeof endDay>; error?: undefined } | { sum?: undefined; error: string } {
  const snap = JSON.stringify(s)
  try {
    return { sum: endDay(s, passedOut, dayId) }
  } catch (e) {
    const back = JSON.parse(snap) as GameState
    for (const k of Object.keys(s)) delete (s as unknown as Record<string, unknown>)[k]
    Object.assign(s, back)
    return { error: (e as Error)?.message ?? String(e) }
  }
}

// 睡前提示：明日换季会枯萎的作物数
export function witherTomorrow(s: GameState) {
  const next = s.day + 1
  if (season(next) === season(s.day)) return 0
  return s.tiles.filter((t) => t.crop && !t.crop.dead && !t.gh && !CROPS[t.crop.cid].seasons.includes(season(next))).length
}
