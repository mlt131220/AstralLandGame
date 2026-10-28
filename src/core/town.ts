// 小镇服务（设计 13.4 / 11.1 / 18.2 / 17.1 / 20.1）：商店、铁匠升级、公共厨房、赠礼与友情事件、公共工程、节庆。
import { DECOR_SHOPS } from '../content/g4.ts'
import wearList from '../content/wear.json' with { type: 'json' }
const WEAR_SHOP = (wearList as { id: string; source: string }[]).filter((w) => w.source === 'shop').map((w) => w.id)
import {
  CEREMONIES, CROPS, FESTIVALS, GEAR_TIERS, ITEMS, KITCHEN_HOURS, MACHINES, PROJECTS, RECIPES, SHOPS, TOOL_TIER, TOOL_UPGRADES, TOOLS, type ProjectId, type ShopId, type ToolId,
} from '../content/content.ts'
import { EVENT_TIERS, NPC_DEFS, npcEvent, ROMANCE, type NpcEvent } from '../content/story.ts'
import { craft, fail, noteFound, ok, specName, takeOne, tx, type R } from './actions.ts'
import { t as tr } from './i18n.ts'
import { npcPlace } from './npcs.ts'
import { absorbTools, applyUnlock, deliverable, friend, progress, questDef, refreshQuests, unlocked } from './quests.ts'
import {
  absMin, addItem, ceremonyToday, clock, count, countSpec, dateName, dayOfSeason, projectDone, raining, removeItem, removeSpec, room, season, weather, weekday, year, type GameState, type Slot,
} from './state.ts'

// ---------- 商店 ----------
export function shopOpen(s: GameState, shop: ShopId = 'general') {
  const h = SHOPS[shop]
  return s.min >= h.open && s.min < h.close && weekday(s.day) !== h.closed
}
export const shopHours = (shop: ShopId) => {
  const h = SHOPS[shop]
  const t = (m: number) => `${String(m / 60).padStart(2, '0')}:00`
  return tr('town.hours', h.name, t(h.open), t(h.close)) + (h.closed >= 0 ? DAY_OFF[h.closed] : '')
}
const DAY_OFF = [tr('town.closedMondays'), tr('town.closedTuesdays'), tr('town.closedWednesdays'), tr('town.closedThursdays'), tr('town.closedFridays'), tr('town.closedSaturdays'), tr('town.closedSundays')]
export function shopStock(s: GameState, shop: ShopId = 'general'): string[] {
  // 14.3 常规矿石在对应矿层解锁后开放；林桥完工后老陶代购外地铁锭
  if (shop === 'smith') return [...['copper_ore', 'coal', 'copper_bar'].filter((id) => unlocked(s, 'shop:' + id)),
    ...(s.deepest >= 11 ? ['iron_ore'] : []), ...(unlocked(s, 'shop:iron_bar') ? ['iron_bar'] : []), ...(s.deepest >= 21 ? ['crystal_ore'] : [])]
  if (shop === 'tackle') return unlocked(s, 'shop:bait') ? ['bait'] : []
  if (shop === 'carpenter') return ['wood', 'stone', 'hardwood', ...DECOR_SHOPS.carpenter]
  if (shop === 'ranch') return ['hay', 'milk_pail', 'shears']
  if (shop === 'clinic') return ['herb_salve', ...((s.friends.yelan?.pts ?? 0) >= 200 ? ['antidote'] : [])]
  if (shop === 'station') return [...(unlocked(s, 'shop:crystal_trade') ? ['crystal_ore'] : []), 'iron_bar']
  const se = season(s.day)
  const dos = dayOfSeason(s.day)
  const seeds = Object.values(CROPS).filter((c) => c.seasons.includes(se) && (year(s.day) > 1 || dos >= c.availableFromDay))
  const love = Object.values(s.friends).some((f) => f.pts >= 800)
  return [...seeds.map((c) => 'seed_' + c.id), 'wood', 'stone', ...(unlocked(s, 'shop:hay') ? ['hay'] : []), ...(se >= 2 ? ['winter_coat'] : []),
    ...(love ? ['bouquet'] : []), ...(s.partner?.stage === 'dating' && s.house.lv >= 2 ? ['promise_charm'] : []),
    ...Object.keys(ITEMS).filter((id) => id.startsWith('sapling_') && ITEMS[id].buy), ...DECOR_SHOPS.general, ...WEAR_SHOP]
}
export function buy(s: GameState, id: string, n: number, shop: ShopId = 'general'): R {
  if (!shopStock(s, shop).includes(id) || !ITEMS[id]?.buy) return fail(tr('town.notSaleRightNow'))
  if (!shopOpen(s, shop)) return fail(shopHours(shop))
  const cost = ITEMS[id].buy! * n
  if (s.money < cost) return fail(tr('common.notEnoughMoney'))
  const b = deliverable(id) ? 1 : 0 // 任务要求自采的物品，买来的单独成堆、标“购”
  if (room(s.inv, id, 0, b) < n) return fail(tr('common.notEnoughRoomBackpack'))
  s.money -= cost
  addItem(s.inv, id, 0, n, b)
  noteFound(s, id)
  progress(s, { type: 'buy', item: id, n })
  return ok(tr('town.boughtG', ITEMS[id].name, n, cost))
}

// ---------- 11.1 工具升级：付款交料后到期日 06:00 完成；期间旧工具照常可用 ----------
export function upgradeInfo(s: GameState, tool: ToolId) {
  const tier = s.tools[tool] + 1
  const u = TOOL_UPGRADES[tier]
  return u ? { tier, ...u, open: !!ITEMS[u.bar] } : null
}
export function startUpgrade(s: GameState, tool: ToolId): R {
  if (!unlocked(s, 'system:tool_upgrade')) return fail(tr('town.oldTaoIsntTaking2'))
  if (tool === 'rod' || s.tools[tool] < 0) return fail(tr('town.toolCantUpgradedYet'))
  if (s.upgrade) return fail(tr('town.stillForgeJobTime', TOOLS[s.upgrade.tool].name))
  if (!shopOpen(s, 'smith')) return fail(shopHours('smith'))
  const u = upgradeInfo(s, tool)
  if (!u) return fail(tr('town.alreadyHighestTier'))
  if (!u.open) return fail(tr('town.needsBarsNotAvailable', TOOL_TIER[u.tier]))
  if (s.money < u.money) return fail(tr('common.notEnoughMoney'))
  if (count(s.inv, u.bar) < u.n) return fail(tr('common.notEnoughNeed', ITEMS[u.bar].name, u.n))
  if (!tx(s, (inv) => removeItem(inv, u.bar, u.n))) return fail()
  s.money -= u.money
  s.upgrade = { tool, tier: u.tier, ready: s.day + u.days }
  const next = tr('fmt.pair', TOOL_TIER[u.tier], TOOLS[tool].name)
  return ok(u.days === 1 ? tr('town.oldTaoTookReady2', TOOLS[tool].name, next) : tr('town.oldTaoTookReady', TOOLS[tool].name, u.days, next))
}

// ---------- 15.3 装备打造：铜/铁/合金 × 短剑/长柄/轻弓/护甲，当场交付 ----------
export const forgeable = (s: GameState) => unlocked(s, 'system:tool_upgrade')
export function forgeCost(id: string) {
  const tier = GEAR_TIERS.find((g) => id.endsWith('_' + g.tier))
  if (!tier) return null
  const [n, money] = id.startsWith('armor_') ? tier.armor : tier.weapon
  return { bar: tier.bar, n, money }
}
export function forge(s: GameState, id: string): R {
  const c = forgeCost(id)
  if (!c || !ITEMS[id]) return fail()
  if (!forgeable(s)) return fail(tr('town.oldTaoIsntTaking'))
  if (!shopOpen(s, 'smith')) return fail(shopHours('smith'))
  if (s.money < c.money) return fail(tr('common.notEnoughMoney'))
  if (count(s.inv, c.bar) < c.n) return fail(tr('common.notEnoughNeed', ITEMS[c.bar].name, c.n))
  if (!tx(s, (inv) => removeItem(inv, c.bar, c.n) && addItem(inv, id, 0, 1))) return fail(tr('common.backpackFull'))
  s.money -= c.money
  noteFound(s, id)
  return ok(tr('town.oldTaoForged', ITEMS[id].name))
}

// ---------- Q09 替代路线：老陶的教学炉代炼（与自建熔炉同配方同时长），铺外委托柜取件，闭店也能取 ----------
const SMELT = MACHINES.furnace.recipes[0]
export const smithJobDone = (s: GameState) => !!s.smithJob && absMin(s) >= s.smithJob.doneAt
export function smithSmelt(s: GameState): R {
  if (!unlocked(s, 'system:mine')) return fail(tr('town.finishOldTaosMine'))
  if (s.smithJob) return fail(smithJobDone(s) ? tr('town.collectFinishedCopperBars') : tr('town.teachingFurnaceStillSmelting'))
  if (!shopOpen(s, 'smith')) return fail(shopHours('smith'))
  for (const [spec, n] of SMELT.in) if (countSpec(s.inv, spec) < n) return fail(tr('common.missingMaterials', specName(spec), n))
  const input: Slot[] = []
  if (!tx(s, (inv) => SMELT.in.every(([spec, n]) => { const got = removeSpec(inv, spec, n); if (got) input.push(...got); return !!got }))) return fail()
  s.smithJob = { doneAt: absMin(s) + SMELT.min, out: { id: SMELT.out, q: 0, n: SMELT.n }, input }
  return ok(tr('town.oldTaoLoadedCopper', SMELT.min / 60))
}
export function smithCollect(s: GameState): R {
  const j = s.smithJob
  if (!j || !smithJobDone(s)) return fail(tr('town.teachingFurnaceIsntDone'))
  if (!addItem(s.inv, j.out.id, j.out.q, j.out.n)) return fail(tr('common.backpackFull'))
  s.smithJob = null
  noteFound(s, j.out.id)
  progress(s, { type: 'machine', item: j.out.id, n: j.out.n })
  return ok(`+${j.out.n} ${ITEMS[j.out.id].name}`)
}

// ---------- 公共厨房（12.4）：营业时间内用配方做菜 ----------
// 家宅 1 级后家里有私人厨房，随时可用（17.4）
export const kitchenOpen = (s: GameState, home = false) => (home && s.house.lv >= 1 && (s.region === 'in:house' || s.region === 'farm')) || (s.min >= KITCHEN_HOURS.open && s.min < KITCHEN_HOURS.close)
export const KITCHEN_RECIPES = RECIPES.map((r, i) => [r, i] as const).filter(([r]) => r.at === 'kitchen')
export function cookCheck(s: GameState, i: number, home = false): R {
  if (!kitchenOpen(s, home)) return fail(tr('common.dinerHours1000'))
  const r = RECIPES[i]
  if (r.at !== 'kitchen') return fail()
  for (const [spec, n] of Object.entries(r.cost)) if (countSpec(s.inv, spec) < n) return fail(tr('common.notEnough', specName(spec)))
  return ok()
}
export function cook(s: GameState, i: number, home = false): R {
  if (!kitchenOpen(s, home)) return fail(tr('common.dinerHours1000'))
  return craft(s, i, 'kitchen')
}

// ---------- 18.2 赠礼：精确物品优先于类别；每日 1 次、每周 3 次；生日首礼 ×2 ----------
export type Taste = 'love' | 'like' | 'neutral' | 'dislike' | 'hate'
const GIFT_PTS: Record<Taste, number> = { love: 40, like: 20, neutral: 5, dislike: -10, hate: -10 }
export const TASTE_NAMES: Record<Taste, string> = { love: tr('town.love'), like: tr('town.like'), neutral: tr('town.neutral'), dislike: tr('town.dislike'), hate: tr('town.hate') }
export function giftTaste(npc: string, id: string): Taste {
  const g = NPC_DEFS[npc]?.gifts
  if (!g) return 'neutral'
  const order = ['love', 'like', 'dislike', 'hate'] as const
  for (const k of order) if (g[k]?.includes(id)) return k
  const tags = ITEMS[id]?.tags ?? []
  for (const k of order) if (g[k]?.some((t) => tags.includes(t))) return k
  return 'neutral'
}
export function isBirthday(s: GameState, npc: string) {
  const b = NPC_DEFS[npc]?.birthday
  return !!b && b.season === season(s.day) && b.day === dayOfSeason(s.day)
}
export const giftable = (id: string) => !ITEMS[id]?.tags?.includes('key') && !ITEMS[id]?.weapon && !ITEMS[id]?.tool
export function giftsLeft(s: GameState, npc: string) {
  const f = friend(s, npc)
  const wk = Math.floor((s.day - 1) / 7)
  return f.gifted === s.day ? 0 : Math.max(0, 3 - (f.week === wk ? f.giftsWeek : 0))
}
export function gift(s: GameState, npc: string, idx: number): R & { taste?: Taste } {
  const sl = s.inv[idx]
  const name = NPC_DEFS[npc]?.name ?? npc
  if (!sl) return fail()
  if (!giftable(sl.id)) return fail(tr('town.cantGivenGift'))
  const f = friend(s, npc)
  const wk = Math.floor((s.day - 1) / 7)
  if (f.week !== wk) { f.week = wk; f.giftsWeek = 0 }
  if (f.gifted === s.day) return fail(tr('town.youveAlreadyGivenGift', name))
  if (f.giftsWeek >= 3) return fail(tr('town.youveAlreadyGiven3', name))
  const taste = giftTaste(npc, sl.id)
  const pts = GIFT_PTS[taste] * (isBirthday(s, npc) ? 2 : 1)
  takeOne(s, sl)
  f.gifted = s.day
  f.giftsWeek++
  f.pts = Math.max(0, Math.min(1000, f.pts + pts))
  progress(s, { type: 'gift', npc, item: sl.id, tags: ITEMS[sl.id].tags })
  const lines = NPC_DEFS[npc]?.dialogue?.gift
  const line = (isBirthday(s, npc) && NPC_DEFS[npc]?.dialogue?.birthday) || lines?.[taste === 'hate' ? 'dislike' : taste] || tr('town.thank')
  return { ok: true, msg: line, taste }
}

// ---------- 18.4 友情事件（200/400/600）与 18.5 关系节点（800/1000）：按顺序、关系达标、居民在场、时间与天气满足 ----------
// 下一个待看的事件：前一档已看完，关系达到本档
export function nextEvent(s: GameState, npc: string): NpcEvent | null {
  const pts = s.friends[npc]?.pts ?? 0
  for (const tier of EVENT_TIERS) {
    const e = npcEvent(npc, tier)
    if (!e) return null
    if (s.flags.includes('event:' + e.id)) continue
    if (pts < tier) return null
    // 800 节点需要已约会，1000 节点需要已结伴意向且家宅 2 级（18.2）
    if (tier === 800 && s.partner?.npc !== npc) return null
    if (tier === 1000 && (s.partner?.npc !== npc || s.house.lv < 2)) return null
    return e
  }
  return null
}
export function eventFor(s: GameState, npc: string) {
  const e = nextEvent(s, npc)
  if (!e) return null
  const p = npcPlace(s, npc)
  if (!p || p.region !== e.trigger.region || s.region !== e.trigger.region) return null
  if (s.min < e.trigger.from || s.min >= e.trigger.to) return null
  if (e.trigger.weather === 'clear' && raining(s)) return null
  if (s.flags.filter((f) => f === 'evday:' + s.day).length >= 2) return null // 每天最多 2 段长事件
  return e
}
export function finishEvent(s: GameState, npc: string, option: number): R {
  const e = nextEvent(s, npc)
  if (!e || s.flags.includes('event:' + e.id)) return fail()
  const items = e.reward?.items ?? []
  if (!tx(s, (inv) => items.every((it) => !ITEMS[it.id] || addItem(inv, it.id, 0, it.n)))) return fail(tr('town.backpacksFullMakeRoom'))
  for (const it of items) noteFound(s, it.id)
  if (e.reward?.recipe) applyUnlock(s, 'recipe:' + e.reward.recipe)
  const f = friend(s, npc)
  f.pts = Math.min(1000, f.pts + (e.choice?.[option]?.friendship ?? 0))
  f.events.push(e.id)
  s.flags.push('event:' + e.id, 'evday:' + s.day)
  progress(s, { type: 'event', id: e.id, npc })
  absorbTools(s)
  const gain = [...items.map((it) => `${ITEMS[it.id]?.name ?? it.id}×${it.n}`), e.reward?.recipe ? tr('town.recipe', ITEMS[e.reward.recipe]?.name ?? e.reward.recipe) : '']
  return ok(gain.filter(Boolean).length ? tr('town.received2', gain.filter(Boolean).join(tr('punct.listSep'))) : undefined)
}

// ---------- 15.5 / Q20 替代核心委托：驿站柜台交金币与材料，1 次日结后领取同功能核心件（不伪造首领击败记录） ----------
export const CORE_TRADE = { money: 6000, cost: { copper_bar: 10, iron_bar: 5 } as Record<string, number>, days: 1 }
export function orderCore(s: GameState): R {
  if (!unlocked(s, 'system:core_trade')) return fail(tr('town.waystationIsntTradingCores'))
  if (s.coreOrder) return fail(s.coreOrder <= s.day ? tr('town.coreArrivedCollectFirst') : tr('town.coreArrivesTomorrowMorning'))
  if (s.money < CORE_TRADE.money) return fail(tr('common.notEnoughMoney'))
  for (const [k, n] of Object.entries(CORE_TRADE.cost)) if (count(s.inv, k) < n) return fail(tr('common.notEnoughNeed', ITEMS[k].name, n))
  if (!tx(s, (inv) => Object.entries(CORE_TRADE.cost).every(([k, n]) => removeItem(inv, k, n)))) return fail()
  s.money -= CORE_TRADE.money
  s.coreOrder = s.day + CORE_TRADE.days
  return ok(tr('town.duanXingTookOrder'))
}
export function claimCore(s: GameState): R {
  if (!s.coreOrder || s.coreOrder > s.day) return fail(tr('town.coreHasntArrivedYet'))
  if (!addItem(s.inv, 'core_trade', 0, 1)) return fail(tr('common.backpackFull'))
  s.coreOrder = 0
  noteFound(s, 'core_trade')
  if (!s.flags.includes('core:trade')) s.flags.push('core:trade')
  return ok(tr('town.n1SubstituteCore'))
}

// ---------- 18.2 关系：约会邀请（花束）与共同生活承诺（约定信物）；结束关系后回到普通友情 ----------
export const friendEventsDone = (s: GameState, npc: string) => [200, 400, 600].every((t) => { const e = npcEvent(npc, t); return !e || s.flags.includes('event:' + e.id) })
export function romanceCheck(s: GameState, npc: string, item: string): string {
  if (!ROMANCE.has(npc)) return tr('town.thatsSweetButLets')
  const pts = s.friends[npc]?.pts ?? 0
  if (item === 'bouquet') {
    if (s.partner) return s.partner.npc === npc ? tr('town.alreadyDating') : tr('town.alreadyDatingSomeoneElse')
    if (pts < 800) return tr('town.notCloseYetNeed')
    if (!friendEventsDone(s, npc)) return tr('town.shareMoreMomentsTogether')
    return ''
  }
  if (item === 'promise_charm') {
    if (s.partner?.npc !== npc) return tr('town.startDatingFirst')
    if (s.partner.stage === 'together') return tr('town.alreadyLiveTogether')
    if (pts < 1000) return tr('town.bondNeedsGrowDeeper')
    const e1000 = npcEvent(npc, 1000)
    if (e1000 && !s.flags.includes('event:' + e1000.id)) return tr('town.finishRelationshipEventFirst')
    if (s.house.lv < 2) return tr('town.expandFarmhouseLevel2')
    return ''
  }
  return '?'
}
export function giveRomance(s: GameState, npc: string, idx: number): R {
  const sl = s.inv[idx]
  if (!sl || (sl.id !== 'bouquet' && sl.id !== 'promise_charm')) return fail()
  const why = romanceCheck(s, npc, sl.id)
  if (why) return fail(why)
  takeOne(s, sl)
  const name = NPC_DEFS[npc]?.name ?? npc
  if (sl.id === 'bouquet') { s.partner = { npc, stage: 'dating', day: s.day }; return ok(tr('town.acceptedBouquetNowDating', name)) }
  s.partner = { npc, stage: 'together', day: s.day }
  return ok(tr('town.acceptedPromiseCharmStarting', name, name))
}
export function breakUp(s: GameState): R {
  if (!s.partner) return fail()
  const name = NPC_DEFS[s.partner.npc]?.name ?? s.partner.npc
  s.partner = null
  return ok(tr('town.endedRomanceButYoull', name))
}

// Q08 矿口安全课（教学交互，不计友情事件）
export const SAFETY_STEPS = [
  tr('town.readSignLoudEat'),
  tr('town.mossBlobSquatsDown'),
  tr('town.dirtBeetlePawsDirt'),
  tr('town.pressSpaceRollHalfway'),
  tr('town.getKnockedFlatNo'),
]
export const safetyReady = (s: GameState) => s.quests.Q08?.st === 'active' && !s.flags.includes('event:laotao_safety')
export function finishSafety(s: GameState): R {
  if (!safetyReady(s)) return fail()
  s.flags.push('event:laotao_safety')
  progress(s, { type: 'event', id: 'laotao_safety', npc: 'laotao' })
  return ok()
}

// ---------- 17.1 公共工程：一次性付清金币与材料，N 次日结后完工 ----------
// 公共工程与对应主线：主线进行中即可筹建（任务链路设计 §3.2）
const PROJECT_QUEST: Record<string, string> = { bridge: 'Q12', station: 'Q15', greenhouse: 'Q18', windmill: 'Q21' }
export const projectOpen = (s: GameState, id: ProjectId) => unlocked(s, PROJECTS[id].unlock) || ['active', 'ready'].includes(s.quests[PROJECT_QUEST[id]]?.st ?? '')
export function projectInfo(s: GameState, id: ProjectId) {
  const p = PROJECTS[id]
  return { ...p, open: projectOpen(s, id), started: !!s.projects[id], done: projectDone(s, id) }
}
export function fundProject(s: GameState, id: ProjectId): R {
  const p = PROJECTS[id]
  if (!projectOpen(s, id)) return fail(tr('town.projectIsntOpenFunding'))
  if (s.projects[id]) return fail(projectDone(s, id) ? tr('town.alreadyFinished') : tr('town.underConstruction'))
  if (s.money < p.money) return fail(tr('common.notEnoughMoney'))
  for (const [k, n] of Object.entries(p.cost)) if (countSpec(s.inv, k) < n) return fail(tr('common.notEnoughNeed', specName(k), n))
  if (!tx(s, (inv) => Object.entries(p.cost).every(([k, n]) => !!removeSpec(inv, k, n)))) return fail()
  s.money -= p.money
  s.projects[id] = s.day + p.days
  progress(s, { type: 'interact', target: ({ bridge: 'bridge_site', windmill: 'windmill_site', station: 'station_counter', sluice: 'sluice_board' } as Record<string, string>)[id] ?? id })
  return ok(p.days === 1 ? tr('town.workBegunItllDone2', p.name) : tr('town.workBegunItllDone', p.name, p.days))
}

// ---------- 20.1 节庆 ----------
export function festivalNow(s: GameState) {
  for (const [id, f] of Object.entries(FESTIVALS)) {
    if (season(s.day) !== f.season || dayOfSeason(s.day) !== f.day) continue
    return { id, ...f, cer: false, canEnter: s.min >= f.open && s.min < f.entry, over: s.min >= f.end }
  }
  const c = ceremonyToday(s)
  if (c) { const f = CEREMONIES[c]; return { id: c, ...f, cer: true, canEnter: s.min >= f.open && s.min < f.entry, over: s.min >= f.end } }
  return null
}
// 完成节庆活动：记录参加（同一年只计一次），时间推进到结束时刻（20.2，不倒退）
// 年度小游戏奖励：按成绩给一点常用物资；外观只在最高档给、每件只给一次（任务链路 §9：最高分只给外观）
const FEST_GIFTS: Record<string, (score: number, s: GameState) => [string, number][]> = {
  flower_fair: (n) => (n >= 6 ? [['wear_hat_flower', 1]] : []),
  fishing_derby: (n) => [['bait', n >= 60 ? 5 : 3], ...(n >= 60 ? [['wear_top_sakura', 1] as [string, number]] : [])],
  picnic: (n) => [[n >= 3 ? 'salad_wild' : 'soup_clear', 1], ['wear_top_watermelon', 1]],
  firefly: () => [['wear_top_stars', 1]],
  market: (n) => [['festival_coin', 1], ...(n >= 45 ? [['wear_top_leaves', 1] as [string, number]] : [])],
  harvest_coop: (n) => [['wild_greens', n >= 15 ? 3 : 2], ...(n >= 15 ? [['wear_top_festival', 1] as [string, number]] : [])],
  hearth_night: () => [['wear_hat_feather', 1]],
  snow_craft: (n, s) => (n >= 5 ? [[!count(s.inv, 'deco_sled') && !s.flags.includes('festgift:deco_sled') ? 'deco_sled' : 'deco_blanket_chair', 1]] : []),
}
// 完成节庆活动：记录参加（同一年只计一次），时间推进到结束时刻（20.2，不倒退）；在场已认识的居民好感 +5
export function finishFestival(s: GameState, id: string, score: number, text: string): R {
  const f = FESTIVALS[id]
  const tag = `fest:${id}:${year(s.day)}`
  if (s.flags.includes(tag)) return fail()
  s.flags.push(tag)
  s.flags = s.flags.filter((f) => !f.startsWith('festtry:'))
  if (!s.flags.includes('festival:' + id)) s.flags.push('festival:' + id)
  const known = Object.entries(s.friends).filter(([, x]) => x.talked).map(([k]) => k)
  for (const npc of id === 'flower_fair' ? ['lintang', 'laotao', 'xiahe', 'shenzhou'] : known) friend(s, npc).pts = Math.min(1000, friend(s, npc).pts + (id === 'flower_fair' ? 10 : 5))
  const looks = (g: string) => !!ITEMS[g]?.tags?.some((t) => t === 'decor' || t === 'wear') // 外观类奖励每件只给一次
  const gifts = (FEST_GIFTS[id]?.(score, s) ?? []).filter(([g]) => ITEMS[g] && !(looks(g) && s.flags.includes('festgift:' + g)))
  const got: string[] = []
  for (const [g, n] of gifts) if (addItem(s.inv, g, 0, n)) { got.push(`${ITEMS[g].name}×${n}`); noteFound(s, g); if (looks(g)) s.flags.push('festgift:' + g) }
  s.min = Math.max(s.min, f.end)
  refreshQuests(s)
  return ok(tr('town.comeClose', f.name, text) + (got.length ? tr('town.received', got.join(tr('punct.listSep'))) : ''))
}
// ---------- Q22 / Q23 仪式：预约下一个安全日（晴或阴，不撞节庆与已有预约） ----------
export const bookedDay = (s: GameState, id: string) => Math.max(0, ...s.flags.filter((f) => f.startsWith(`book:${id}:`)).map((f) => Number(f.split(':')[2])))
export function bookCeremony(s: GameState, id: string): R {
  const c = CEREMONIES[id]
  if (s.flags.includes('event:' + id)) return fail(tr('town.alreadyBeenHeld', c.name))
  const old = bookedDay(s, id)
  if (old >= s.day && !(old === s.day && s.min >= c.end)) return fail(tr('town.alreadySet', c.name, dateName(old)))
  let d = s.day + 1
  const festDay = (k: number) => Object.values(FESTIVALS).some((f) => season(k) === f.season && dayOfSeason(k) === f.day)
  while (d < s.day + 28 && (weather(s.seed, d) > 1 || festDay(d))) d++
  s.flags.push(`book:${id}:${d}`)
  return ok(tr('town.set', c.name, dateName(d), clock(c.open), clock(c.end), c.region === 'town' ? tr('town.townSquare') : tr('common.windmillHeights')))
}
// Q23：三类料理先交给夏禾暂存，同时预约长桌宴；取消时原样退还
export function stashFeast(s: GameState): R {
  const q = questDef('Q23')
  if (!q || s.quests.Q23?.st !== 'active') return fail()
  if (s.stash?.Q23) return fail(tr('town.dishesAlreadyStoredDiner'))
  const inv = s.inv.map((sl) => sl && { ...sl })
  const got: Slot[] = []
  for (const o of q.objectives) if (o.type === 'deliver') {
    const r = removeSpec(inv, '#' + o.tag, o.n ?? 1, true)
    if (!r) return fail(tr('town.stillNeedDishCooked', { soup: tr('town.soup'), main: tr('town.main'), protein: tr('town.fishEggDairy') }[o.tag!] ?? ''))
    got.push(...r)
  }
  s.inv = inv
  s.stash = { ...s.stash, Q23: got }
  const b = bookCeremony(s, 'long_table_feast')
  refreshQuests(s)
  return ok(tr('town.xiaHePutThree', b.msg ?? ''))
}
export function cancelFeast(s: GameState): R {
  const got = s.stash?.Q23
  if (!got) return fail()
  if (!tx(s, (inv) => got.every((sl) => addItem(inv, sl.id, sl.q, sl.n)))) return fail(tr('town.backpackFullMakeRoom'))
  delete s.stash!.Q23
  s.flags = s.flags.filter((f) => !f.startsWith('book:long_table_feast:'))
  refreshQuests(s)
  return ok(tr('town.xiaHeHandedDishes'))
}
// 举行：在场已认识的居民好感 +5，时间推进到散场
export function holdCeremony(s: GameState, id: string): R {
  if (ceremonyToday(s) !== id) return fail()
  s.flags.push('event:' + id)
  for (const [npc, x] of Object.entries(s.friends)) if (x.talked) friend(s, npc).pts = Math.min(1000, x.pts + 5)
  s.min = Math.max(s.min, CEREMONIES[id].end)
  progress(s, { type: 'event', id })
  refreshQuests(s)
  if (id === 'long_table_feast' && !(s.wardrobe ?? []).includes('wear_hat_chef')) (s.wardrobe ??= []).push('wear_hat_chef')
  return ok(id === 'windmill_ceremony' ? tr('town.windmillTurningTodayValleys') : tr('town.valleyLongTableFeast'))
}

// 围炉谢礼夜的匿名问候：收到的居民额外 +10
export function hearthGreet(s: GameState, npc: string) {
  friend(s, npc).pts = Math.min(1000, friend(s, npc).pts + 10)
}
// 萤灯夜沿河找到的灯影标记（存档里记旗标，刷新页面不丢）
export const fireflyFound = (s: GameState) => [0, 1, 2].filter((i) => s.flags.includes(`firefly:${year(s.day)}:${i}`)).length
export function findMarker(s: GameState, i: number): R {
  const f = festivalNow(s)
  if (f?.id !== 'firefly' || !f.canEnter) return fail(tr('town.lanternMarkersOnlyLight'))
  const tag = `firefly:${year(s.day)}:${i}`
  if (s.flags.includes(tag)) return fail(tr('town.youveAlreadyNotedLantern'))
  s.flags.push(tag)
  const n = fireflyFound(s)
  return ok(n < 3 ? tr('town.foundLanternMarkerGo', n, 3 - n) : tr('town.threeLanternMarkersFound'))
}
// 节庆检查点（§20.2）：小游戏一开始就记一笔并存档；刷新页面后按“中途离开”结算（算参加，不能刷新重来刷成绩）
export const festStarted = (s: GameState, id: string) => { const t = `festtry:${id}:${year(s.day)}`; if (!s.flags.includes(t)) s.flags.push(t) }
export function resumeFestival(s: GameState): R | null {
  const tries = s.flags.filter((f) => f.startsWith('festtry:'))
  if (!tries.length) return null
  s.flags = s.flags.filter((f) => !f.startsWith('festtry:'))
  const f = festivalNow(s)
  const t = f && tries.find((x) => x === `festtry:${f.id}:${year(s.day)}`)
  if (!t || f.cer || s.flags.includes(`fest:${f.id}:${year(s.day)}`)) return null
  return finishFestival(s, f.id, 0, tr('town.leftPartwayThroughMini'))
}
// 没开始小游戏就离场：入场时间 +60 分钟或结束时刻较早者（20.2，不倒退）
export function leaveFestival(s: GameState, id: string, enteredAt: number) {
  s.min = Math.max(s.min, Math.min(FESTIVALS[id].end, enteredAt + 60))
}
