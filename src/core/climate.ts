// 寒冷、潮湿与负面状态（设计 6.4）、料理增益（12.4）、装备位（15.3）。按游戏分钟推进，暂停时不推进。
import { COLD, ITEMS, STATUS, type Buff } from '../content/content.ts'
import { fail, ok, type R } from './actions.ts'
import { absMin, addItem, raining, regionOf, season, weather, type GameState } from './state.ts'
import { t as tr } from './i18n.ts'

// ---------- 增益：同类取较强、时间取较长；最多一个劳动类与一个探索类（12.4） ----------
export const buffOf = (s: GameState, fx: Buff['fx']) => s.buffs.find((b) => b.fx === fx && b.until > absMin(s))
export function addBuff(s: GameState, b: Buff) {
  const now = absMin(s)
  s.buffs = s.buffs.filter((x) => x.until > now)
  const same = s.buffs.find((x) => x.k === b.k)
  const until = now + b.min
  if (same && same.fx === b.fx) { same.v = Math.max(same.v, b.v); same.until = Math.max(same.until, until) }
  else if (same) Object.assign(same, { fx: b.fx, v: b.v, until })
  else s.buffs.push({ k: b.k, fx: b.fx, v: b.v, until })
}
// 临时上限：增益不写入基础值（16.3）
export const maxEnergyOf = (s: GameState) => s.maxEnergy + (buffOf(s, 'maxEnergy')?.v ?? 0)
export const maxHpOf = (s: GameState) => s.maxHp + (buffOf(s, 'maxHp')?.v ?? 0) + (buffOf(s, 'feast') ? 10 : 0)
// 劳动耗能倍率：料理减耗、低保暖加耗
export function laborMult(s: GameState) {
  let m = 1
  const b = buffOf(s, 'labor') ?? buffOf(s, 'feast')
  if (b) m *= 1 - b.v
  if (s.warmth < COLD.slow) m *= 1.1
  return m
}

// ---------- 负面状态：最多 2 个，同种刷新时长不叠层 ----------
export function addStatus(s: GameState, k: 'poison' | 'slow') {
  const now = absMin(s)
  s.status = s.status.filter((x) => x.until > now)
  const cur = s.status.find((x) => x.k === k)
  const until = now + STATUS[k].min
  if (cur) cur.until = until
  else if (s.status.length < 2) s.status.push({ k, until, next: now + (k === 'poison' ? STATUS.poison.tick : 0) })
}
export const hasStatus = (s: GameState, k: 'poison' | 'slow') => s.status.some((x) => x.k === k && x.until > absMin(s))
export function cure(s: GameState, k: 'poison' | 'slow') {
  const had = hasStatus(s, k)
  s.status = s.status.filter((x) => x.k !== k)
  return had
}

// ---------- 寒冷区域：冬季室外、深层冷区（21 层以下）、暴雪；秋季大风时风车高地 ----------
const OUTDOOR = new Set(['farm', 'town', 'river', 'forest', 'mountain', 'deepforest', 'wetland', 'highland'])
const SAFE = new Set(['farm', 'town']) // 普通农场、小镇主路不触发致命冻伤
export function coldZone(s: GameState) {
  const se = season(s.day)
  const w = weather(s.seed, s.day)
  if (s.region === 'mine') return s.floor >= 21
  if (!OUTDOOR.has(s.region)) return false
  return se === 3 || (w === 3 && se === 2 && (s.region as string) === 'highland')
}
export const blizzard = (s: GameState) => weather(s.seed, s.day) === 3 && season(s.day) === 3 && s.region !== 'mine'
const precip = (s: GameState) => s.region !== 'mine' && weather(s.seed, s.day) >= 2 && !(weather(s.seed, s.day) === 3 && season(s.day) === 2)
// 营火旁：区域摆件或农场里放置的营火 2.5 米内
export function nearFire(s: GameState) {
  const r = regionOf(s)
  if (r.decor.some((d) => d.m === 'campfire' && Math.hypot(d.x - s.x, d.z - s.z) < 2.5)) return true
  return s.region === 'farm' && s.ents.some((e) => e.k === 'campfire' && Math.hypot(e.x + 0.5 - s.x, e.z + 0.5 - s.z) < 2.5)
}
// 每游戏分钟推进；返回需要提示的消息
export function climateStep(s: GameState, dm: number): string[] {
  const msgs: string[] = []
  const now = absMin(s)
  const fire = nearFire(s)
  // 潮湿：雨雪无遮挡 +1/分；其余 -1.5/分，营火旁 -3/分
  s.damp = Math.max(0, Math.min(100, s.damp + (precip(s) && !fire ? COLD.wetGain : -(fire ? COLD.wetFire : COLD.wetDry)) * dm))
  // 保暖
  if (coldZone(s) && !fire) {
    const coat = s.equip.coat && ITEMS[s.equip.coat]?.equip === 'coat'
    let loss = s.damp > 70 && !coat ? COLD.lossWet : coat ? 0 : COLD.lossDry
    if (blizzard(s)) loss = Math.max(loss, coat ? COLD.lossBlizzard * 0.25 : COLD.lossBlizzard)
    const b = buffOf(s, 'cold')
    if (b) loss *= 1 - b.v
    const before = s.warmth
    s.warmth = Math.max(SAFE.has(s.region) ? 12 : 0, s.warmth - loss * dm)
    if (before >= COLD.slow && s.warmth < COLD.slow) msgs.push(tr('climate.gettingColderActionsCost'))
    if (before >= COLD.hurt && s.warmth < COLD.hurt) msgs.push(tr('climate.shiveringBelow10Warmth'))
  } else s.warmth = Math.min(100, s.warmth + (fire ? COLD.regenFire : COLD.regen) * dm)
  // 冻伤：保暖 < 10 时每游戏 10 分钟 -1 HP
  if (s.warmth < COLD.hurt) {
    s.coldTick = (s.coldTick ?? 0) + dm
    while (s.coldTick >= 10) { s.coldTick -= 10; s.hp = Math.max(0, s.hp - 1) }
  } else s.coldTick = 0
  // 中毒：每游戏 5 分钟 -1 HP，持续 20 分钟
  for (const st of s.status) {
    if (st.k !== 'poison' || st.until <= now) continue
    while (st.next <= Math.min(now, st.until)) { st.next += STATUS.poison.tick; s.hp = Math.max(0, s.hp - STATUS.poison.dmg) }
  }
  const before = s.status.length
  s.status = s.status.filter((x) => x.until > now)
  if (s.status.length < before) msgs.push(tr('climate.ailmentsWoreOff'))
  s.buffs = s.buffs.filter((b) => b.until > now)
  s.energy = Math.min(s.energy, maxEnergyOf(s))
  s.hp = Math.min(s.hp, maxHpOf(s))
  void raining
  return msgs
}

// ---------- 装备位：防具与防寒衣（15.3） ----------
export function equipItem(s: GameState, idx: number): R {
  const sl = s.inv[idx]
  const slot = sl && ITEMS[sl.id].equip
  if (!sl || !slot) return fail(tr('climate.cantEquip'))
  const old = s.equip[slot]
  s.inv[idx] = null
  s.equip[slot] = sl.id
  if (old) s.inv[idx] = { id: old, q: 0, n: 1 }
  return ok(tr('climate.equipped', ITEMS[sl.id].name))
}
export function unequip(s: GameState, slot: 'armor' | 'coat'): R {
  const id = s.equip[slot]
  if (!id) return fail()
  if (!addItem(s.inv, id, 0, 1)) return fail(tr('common.backpackFull'))
  s.equip[slot] = null
  return ok(tr('climate.tookOff', ITEMS[id].name))
}
export const armorDef = (s: GameState) => (s.equip.armor ? ITEMS[s.equip.armor]?.armor ?? 0 : 0)
