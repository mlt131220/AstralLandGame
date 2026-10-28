// 任务系统：定义由内容层注册；进度由各动作提交成功后发出的事件推进（设计 19、32.4）。
// 计数类目标从接取任务后开始计；持有/关系/技能类目标实时判断。
import { ITEMS } from '../content/content.ts'
import { addItem, count, countSpec, specMatch, level, projectDone, removeSpec, type GameState, type Slot } from './state.ts'
import { t as tr } from './i18n.ts'

export interface Objective {
  type: string; text: string; n?: number; gold?: number; value?: number; level?: number; tier?: number; floor?: number
  item?: string; tag?: string; crop?: string; to?: string; npc?: string; region?: string; target?: string
  fish?: string; enemy?: string; action?: string; id?: string; skill?: string; tool?: string
}
export interface QuestDef {
  id: string; kind: string; title: string; giver: string; phase: string; requires: string[]
  unlock?: { minDay?: number; flag?: string }
  intro: string; objectives: Objective[]; submit: string; complete: string
  rewards: { money?: number; items?: { id: string; n: number }[]; unlock?: string[]; friendship?: Record<string, number>; flags?: string[] }
  journal: string
}

let DEFS: QuestDef[] = []
const BY_ID = new Map<string, QuestDef>()
export function registerQuests(defs: QuestDef[]) {
  DEFS = defs.filter((d) => d.objectives.every((o) => o.type in COUNTERS || o.type in LIVE || o.type === 'deliver'))
  BY_ID.clear()
  for (const d of DEFS) BY_ID.set(d.id, d)
}
export const questDef = (id: string) => BY_ID.get(id)
export const allQuests = () => DEFS

// 提示队列：领域层只产生文本，由界面层取走显示（不依赖 DOM）
const notes: string[] = []
export const drainQuestNotes = () => notes.splice(0)

// 事件 → 目标匹配。params 中出现的限定字段必须一致；未限定的目标接受任意值
export interface QuestEvent { type: string; n?: number; item?: string; crop?: string; npc?: string; region?: string; target?: string; fish?: string; enemy?: string; action?: string; id?: string; floor?: number; tool?: string; tier?: number; gold?: number; tags?: string[] }
const match = (o: Objective, e: QuestEvent) =>
  (!o.item || o.item === e.item || (e.tags?.includes(o.item) ?? false)) && (!o.crop || o.crop === e.crop || o.crop === e.item) &&
  (!o.tag || (e.tags?.includes(o.tag) ?? false)) && (!o.npc || o.npc === e.npc) && (!o.region || o.region === e.region) &&
  (!o.target || o.target === e.target) && (!o.fish || o.fish === e.fish || o.fish === e.item) && (!o.enemy || o.enemy === e.enemy) &&
  (!o.action || o.action === e.action) && (!o.id || o.id === e.id) && (!o.tool || o.tool === e.tool)
// 计数型目标：事件累加
const COUNTERS: Record<string, (o: Objective) => number> = {
  till: (o) => o.n ?? 1, plant: (o) => o.n ?? 1, water: (o) => o.n ?? 1, harvest: (o) => o.n ?? 1, ship: (o) => o.n ?? 1,
  earn: (o) => o.gold ?? 1, buy: (o) => o.n ?? 1, talk: () => 1, visit: () => 1, interact: () => 1, forage: (o) => o.n ?? 1,
  chop: (o) => o.n ?? 1, break: (o) => o.n ?? 1, cut: (o) => o.n ?? 1, craft: (o) => o.n ?? 1, place: () => 1,
  machine: (o) => o.n ?? 1, eat: (o) => o.n ?? 1, fish: (o) => o.n ?? 1, kill: (o) => o.n ?? 1, animal: (o) => o.n ?? 1,
  build: (o) => o.n ?? 1, gift: (o) => o.n ?? 1,
}
// 状态型目标：实时判断
const LIVE: Record<string, (s: GameState, o: Objective) => [number, number]> = {
  have: (s, o) => [Math.min(count(s.inv, o.item!), o.n ?? 1), o.n ?? 1],
  friendship: (s, o) => [Math.min(s.friends[o.npc!]?.pts ?? 0, o.value ?? 0), o.value ?? 0],
  skill: (s, o) => [Math.min(level(s.xp[o.skill as keyof GameState['xp']] ?? 0), o.level ?? 1), o.level ?? 1],
  mineFloor: (s, o) => [Math.min(s.deepest, o.floor ?? 1), o.floor ?? 1],
  upgrade: (s, o) => [Math.min(Math.max(0, s.tools[o.tool as keyof GameState['tools']] ?? 0), o.tier ?? 1), o.tier ?? 1],
  // 事件、工程、节庆是一次性事实：先于接取发生也算完成，避免任务卡死
  event: (s, o) => [s.flags.includes('event:' + o.id) ? 1 : 0, 1],
  project: (s, o) => [projectDone(s, o.id!) ? 1 : 0, 1],
  festival: (s, o) => [s.flags.includes('festival:' + o.id) ? 1 : 0, 1],
  // G3：持有规格物品、多位居民关系、已完成友情事件数、旗标（a|b 任一）、建筑、动物数
  haveSpec: (s, o) => [Math.min(countSpec(s.inv, o.item!), o.n ?? 1), o.n ?? 1],
  friends: (s, o) => [Math.min(Object.values(s.friends).filter((f) => f.pts >= (o.value ?? 0)).length, o.n ?? 1), o.n ?? 1],
  events: (s, o) => [Math.min(Object.values(s.friends).reduce((a, f) => a + f.events.length, 0), o.n ?? 1), o.n ?? 1],
  flag: (s, o) => [o.id!.split('|').some((f) => s.flags.includes(f)) ? 1 : 0, 1],
  building: (s, o) => [s.farmB.some((b) => b.k === o.id && b.done <= s.day) ? 1 : 0, 1],
  animals: (s, o) => [Math.min(s.animals.filter((a) => !a.lent).length, o.n ?? 1), o.n ?? 1],
}
// 任务暂存里符合这个交付目标的件数
const stashHave = (s: GameState, qid: string, o: Objective) => (s.stash?.[qid] ?? []).filter((sl) => specMatch(o.item && ITEMS[o.item] ? o.item : '#' + o.tag, sl.id)).reduce((a, sl) => a + sl.n, 0)
// 交付只计自采/自种（商店购入的不算，任务设计 §6.1、§11.3）
const deliverHave = (s: GameState, o: Objective) => countSpec(s.inv, o.item && ITEMS[o.item] ? o.item : '#' + o.tag, true)

export function itemTags(id: string): string[] {
  const d = ITEMS[id]
  return d?.tags ?? []
}

// 目标进度 [当前, 需要]
export function objectiveProgress(s: GameState, q: QuestDef, i: number): [number, number] {
  const o = q.objectives[i]
  const st = s.quests[q.id]
  if (o.type === 'deliver') return [Math.min(deliverHave(s, o) + stashHave(s, q.id, o), o.n ?? 1), o.n ?? 1]
  if (o.type in LIVE) return LIVE[o.type](s, o)
  const need = COUNTERS[o.type]?.(o) ?? 1
  return [Math.min(st?.prog[i] ?? 0, need), need]
}
// 会被任务要求交付的物品（买来的要打标区分）
export const deliverable = (id: string) => DEFS.some((q) => q.objectives.some((o) => o.type === 'deliver' && (o.item === id || (!!o.tag && itemTags(id).includes(o.tag)))))
export const objectivesDone = (s: GameState, q: QuestDef) => q.objectives.every((_, i) => { const [a, b] = objectiveProgress(s, q, i); return a >= b })

// 解锁检查：前置全部完成、日期与旗标满足 → 激活；信件类同时投递到信箱
export function refreshQuests(s: GameState) {
  for (const q of DEFS) {
    if (s.quests[q.id]) continue
    if (!q.requires.every((r) => s.quests[r]?.st === 'done')) continue
    if (q.unlock?.minDay && s.day < q.unlock.minDay) continue
    if (q.unlock?.flag && !s.flags.includes(q.unlock.flag)) continue
    // 居民与公告板的委托先处于“待接取”，到对应居民或公告板处接受后才开始计数
    const offered = q.giver !== 'auto' && q.giver !== 'letter'
    s.quests[q.id] = { st: offered ? 'offered' : 'active', prog: q.objectives.map(() => 0), day: s.day }
    if (q.giver === 'letter') s.mail.push(q.id)
    if (!offered && s.tracked.length < 3) s.tracked.push(q.id)
    if (!offered) visitHere(s, q)
    notes.push(q.giver === 'letter' ? tr('quests.newLetterMailbox', q.title) : q.giver === 'board' ? tr('quests.newRequestNoticeBoard', q.title) : offered ? tr('quests.villagerLooking', q.title) : tr('quests.newQuest', q.title))
  }
  for (const q of DEFS) checkReady(s, q)
}

function checkReady(s: GameState, q: QuestDef) {
  const st = s.quests[q.id]
  if (!st || st.st !== 'active' || s.mail.includes(q.id) || !objectivesDone(s, q)) return
  if (q.submit === 'auto') finish(s, q)
  else {
    st.st = 'ready'
    notes.push(tr('quests.readyTurn', q.title))
  }
}

export function progress(s: GameState, e: QuestEvent) {
  for (const q of DEFS) {
    const st = s.quests[q.id]
    if (!st || st.st !== 'active' || s.mail.includes(q.id)) continue
    q.objectives.forEach((o, i) => {
      if (o.type !== e.type || !match(o, e)) return
      st.prog[i] = (st.prog[i] ?? 0) + (e.type === 'earn' ? e.gold ?? 0 : e.n ?? 1)
    })
    checkReady(s, q)
  }
}
// 状态型目标（持有、关系等）需要定期复查
export function recheck(s: GameState) {
  for (const q of DEFS) {
    const st = s.quests[q.id]
    if (st?.st === 'ready' && !objectivesDone(s, q)) st.st = 'active' // 交付物被用掉了
    else if (st?.st === 'ready' && q.submit === 'auto') finish(s, q) // 自动任务奖励曾因背包满待领：腾出空间后自动领取
    else checkReady(s, q)
  }
}

// 按交付目标从背包副本扣物：先交价低、品质低的（与预览共用同一规则）
function takeDeliveries(inv: (Slot | null)[], q: QuestDef): Slot[] | null {
  const out: Slot[] = []
  for (const o of q.objectives) if (o.type === 'deliver') {
    const got = removeSpec(inv, o.item && ITEMS[o.item] ? o.item : '#' + o.tag, o.n ?? 1, true)
    if (!got) return null
    out.push(...got)
  }
  return out
}
// 交付前预览将交出的物品（含品质），界面据此提示，避免无提示交出精品
export const deliveryPreview = (s: GameState, q: QuestDef) => takeDeliveries(s.inv.map((sl) => sl && { ...sl }), q) ?? []

// 交付：在指定居民或教学柜处提交，扣除 deliver 物品并发放奖励（全有或全无）
export function submitQuest(s: GameState, id: string, at: string): string | null {
  const q = BY_ID.get(id)
  const st = s.quests[id]
  if (!q || st?.st !== 'ready') return tr('quests.questIsntCompleteYet')
  if (q.submit !== at) return null
  if (!objectivesDone(s, q)) { st.st = 'active'; return tr('quests.dontItemsNeededTurn') }
  const inv = s.inv.map((sl) => sl && { ...sl })
  const stashed = !!s.stash?.[id]
  if (!stashed && !takeDeliveries(inv, q)) { st.st = 'active'; return tr('quests.dontItemsNeededTurn') }
  if (!grantItems(inv, q.rewards.items ?? [])) return tr('quests.notEnoughBackpackSpace')
  s.inv = inv
  if (stashed) delete s.stash![id]
  finish(s, q, true)
  return ''
}

function grantItems(inv: (Slot | null)[], items: { id: string; n: number }[]) {
  return items.every((it) => !ITEMS[it.id] || addItem(inv, it.id, 0, it.n))
}

function finish(s: GameState, q: QuestDef, itemsGranted = false) {
  const st = s.quests[q.id]
  if (!itemsGranted) {
    const inv = s.inv.map((sl) => sl && { ...sl })
    if (!grantItems(inv, q.rewards.items ?? [])) {
      if (st.st !== 'ready') notes.push(tr('quests.rewardWaitingBackpackFull', q.title))
      st.st = 'ready'
      return
    }
    s.inv = inv
  }
  st.st = 'done'
  const r = q.rewards
  absorbTools(s)
  s.money += r.money ?? 0
  for (const it of r.items ?? []) s.found[it.id] ??= s.day
  for (const [npc, v] of Object.entries(r.friendship ?? {})) friend(s, npc).pts = Math.min(1000, friend(s, npc).pts + v)
  for (const f of r.flags ?? []) if (!s.flags.includes(f)) s.flags.push(f)
  for (const u of r.unlock ?? []) applyUnlock(s, u)
  s.tracked = s.tracked.filter((t) => t !== q.id)
  const gain = [r.money ? tr('common.goldCoins', r.money) : '', ...(r.items ?? []).map((it) => `${ITEMS[it.id]?.name ?? it.id}×${it.n}`)].filter(Boolean)
  notes.push(tr('quests.completed', q.title, gain.length ? tr('quests.received', gain.join(tr('punct.listSep'))) : ''))
  refreshQuests(s)
}

// 获得工具物品（如钓竿）时登记为已拥有（等级从基础开始）
export function absorbTools(s: GameState) {
  for (const sl of s.inv) {
    const tool = sl && ITEMS[sl.id].tool
    if (tool && s.tools[tool] < 0) {
      s.tools[tool] = 0
      notes.push(tr('quests.gotDragBackpackHotbar', ITEMS[sl!.id].name))
    }
  }
}

export function applyUnlock(s: GameState, u: string) {
  const [k, v] = u.split(':')
  if (k === 'hotbar') {
    // 快捷栏一排加长：在快捷栏末尾插入空格，背包格整体后移
    const n = Number(v)
    if (n > s.hotbar) { s.inv.splice(s.hotbar, 0, ...Array(n - s.hotbar).fill(null)); s.hotbar = n }
  } else if (k === 'bag') while (s.inv.length - s.hotbar < Number(v)) s.inv.push(null)
  else if (k === 'maxEnergy') { s.maxEnergy += Number(v); s.energy += Number(v) }
  else if (k === 'maxHp') { s.maxHp += Number(v); s.hp += Number(v) }
  if (!s.unlocks.includes(u)) s.unlocks.push(u)
}
export const unlocked = (s: GameState, u: string) => s.unlocks.includes(u)

// 公告板订单期限（接取当天算第 1 天）
export const ORDER_DAYS = 3
// 日结：过期订单撤下，不扣钱、不扣关系；之后公告板会重新张贴
export function expireOrders(s: GameState, next: number) {
  const out: string[] = []
  for (const [id, st] of Object.entries(s.quests)) {
    if (st.due === undefined || st.st === 'done' || st.due >= next) continue
    delete s.quests[id]
    s.tracked = s.tracked.filter((t) => t !== id)
    out.push(tr('quests.noticeBoardOrderExpired', BY_ID.get(id)?.title ?? id))
  }
  return out
}

// 待接取的委托（某位居民或公告板）
export const offeredBy = (s: GameState, giver: string) => DEFS.filter((q) => q.giver === giver && s.quests[q.id]?.st === 'offered')
export function acceptQuest(s: GameState, id: string) {
  const st = s.quests[id]
  if (st?.st !== 'offered') return
  st.st = 'active'
  st.day = s.day
  if (BY_ID.get(id)?.kind === 'board') st.due = s.day + ORDER_DAYS - 1
  if (s.tracked.length < 3) s.tracked.push(id)
  visitHere(s, BY_ID.get(id)!)
  notes.push(tr('quests.acceptedRequest', BY_ID.get(id)?.title))
  checkReady(s, BY_ID.get(id)!)
}

export function friend(s: GameState, npc: string) {
  return (s.friends[npc] ??= { pts: 0, talked: 0, gifted: 0, week: 0, giftsWeek: 0, events: [] })
}

// 读信：信件类任务读过才开始计数
// 接取时已身处目标区域的“到达”目标直接计为完成
function visitHere(s: GameState, q: QuestDef) {
  q.objectives.forEach((o, i) => { if (o.type === 'visit' && o.region === s.region) s.quests[q.id].prog[i] = 1 })
}

export function readMail(s: GameState, id: string) {
  s.mail = s.mail.filter((m) => m !== id)
  progress(s, { type: 'interact', target: 'mailbox' })
}
