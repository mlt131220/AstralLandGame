// 农场私人建筑（设计 17.1 / 17.2 / 17.3）：选址预览、下单施工、升级、免费移动、拆除退料；家宅升级。
// 木工队同时最多施工 1 个私人建筑（17.2）；施工按“经过 N 个日结”的工期，第 D 日下单、第 D+N 日早晨完工。
import { BUILDINGS, HOUSE_UPGRADES, ITEMS, type BuildKind } from '../content/content.ts'
import { fail, ok, tx, type R } from './actions.ts'
import { t as tr } from './i18n.ts'
import { progress, unlocked } from './quests.ts'
import { COOP_SITE, FARM_H, FARM_W } from './regions.ts'
import { addItem, count, regionOf, removeItem, WALKABLE_G, type FarmBuilding, type GameState } from './state.ts'

export const bLevel = (s: GameState, b: FarmBuilding) => (b.up && b.up <= s.day ? 1 : 0)
export const bDone = (s: GameState, b: FarmBuilding) => b.done <= s.day
export const bName = (s: GameState, b: FarmBuilding) => (bLevel(s, b) ? BUILDINGS[b.k].up?.name : null) ?? BUILDINGS[b.k].name
export const homes = (s: GameState, kind?: 'coop' | 'barn') => s.farmB.filter((b) => (kind ? b.k === kind : b.k === 'coop' || b.k === 'barn') && bDone(s, b))
export const bCap = (s: GameState, b: FarmBuilding) => (bLevel(s, b) ? BUILDINGS[b.k].up?.cap : BUILDINGS[b.k].cap) ?? 0
export const siloCap = (s: GameState) => s.farmB.filter((b) => b.k === 'silo' && bDone(s, b)).length * 240
export const busy = (s: GameState) => s.farmB.find((b) => b.done > s.day || (b.up && b.up > s.day))
// 门口格：正面朝 +Z，占地下沿中间
export const doorOf = (b: { x: number; z: number; w?: number; d?: number; k?: BuildKind }) => {
  const w = b.w ?? BUILDINGS[b.k!].w, d = b.d ?? BUILDINGS[b.k!].d
  return [b.x + Math.floor(w / 2), b.z + d] as [number, number]
}
// 门前活动院子：动物白天在这里吃草走动
export const yardOf = (b: FarmBuilding) => {
  const { w, d } = BUILDINGS[b.k]
  return { x: b.x - 1, z: b.z + d, w: w + 2, d: 4 }
}

// ---------- 选址校验（17.2）：占地合法、不压作物/机器/箱子、留出门口、家门与出口仍连通 ----------
const DEBRIS = new Set(['weed', 'branch', 'stone'])
export function placeProblem(s: GameState, k: BuildKind, x: number, z: number, self?: FarmBuilding): string {
  const { w, d } = BUILDINGS[k]
  if (x < 1 || z < 1 || x + w > 44 || z + d > FARM_H - 2) return tr('buildings.outsideBuildableArea')
  const farm = regionOf(s, 'farm')
  const others = farm.buildings.filter((b) => b.id !== 'coop_site' && (!self || b.home !== self.id))
  for (const b of others) if (x < b.x + b.w + 1 && x + w + 1 > b.x && z < b.z + b.d + 1 && z + d + 1 > b.z) return tr('buildings.tooCloseLeave1', b.name)
  for (let j = z; j < z + d; j++) for (let i = x; i < x + w; i++) {
    const t = s.tiles[j * FARM_W + i]
    if (t.g !== 0) return tr('buildings.onlyBuildOpenGrass')
    if (t.crop) return tr('buildings.cropsWayHarvestClear')
    if (t.ent) return tr('buildings.removeWayFirst', ITEMS[s.ents.find((e) => e.id === t.ent)?.k ?? '']?.name ?? tr('buildings.placedItem'))
    if (t.ob && !DEBRIS.has(t.ob.k)) return t.ob.k === 'tree' ? tr('buildings.theresTreeWayClear') : t.ob.k === 'stump' ? tr('buildings.theresStumpWayClear') : tr('buildings.somethingsWayClearFirst')
    if (t.pipe) return tr('buildings.theresWaterPipeWay')
  }
  const [dx, dz] = doorOf({ x, z, k })
  const dt = s.tiles[dz * FARM_W + dx]
  if (!dt || !WALKABLE_G(dt.g) || dt.ent || (dt.ob && !DEBRIS.has(dt.ob.k))) return tr('buildings.leaveWalkableSpaceFront')
  // 家门、区域出口与新门口连通（按建成后的阻挡计算）
  const block = (i: number, j: number) => {
    if (i >= x && i < x + w && j >= z && j < z + d) return true
    if (others.some((b) => i >= b.x && i < b.x + b.w && j >= b.z && j < b.z + b.d)) return true
    const t = s.tiles[j * FARM_W + i]
    return !WALKABLE_G(t.g) || (!!t.ent && t.gate !== 2) || (!!t.ob && !DEBRIS.has(t.ob.k))
  }
  const seen = new Uint8Array(FARM_W * FARM_H)
  const q = [10 * FARM_W + 24]
  seen[q[0]] = 1
  for (let h = 0; h < q.length; h++) {
    const i = q[h] % FARM_W, j = (q[h] / FARM_W) | 0
    for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const ni = i + a, nj = j + b
      if (ni < 0 || nj < 0 || ni >= FARM_W || nj >= FARM_H) continue
      const n = nj * FARM_W + ni
      if (seen[n] || block(ni, nj)) continue
      seen[n] = 1
      q.push(n)
    }
  }
  if (!seen[19 * FARM_W + 47] || !seen[39 * FARM_W + 23]) return tr('buildings.blockWayTownWoods')
  if (!seen[dz * FARM_W + dx]) return tr('buildings.doorCantReached')
  return ''
}

function pay(s: GameState, money: number, cost: Record<string, number>): string {
  if (s.money < money) return tr('buildings.notEnoughMoneyNeed', money)
  for (const [id, n] of Object.entries(cost)) if (count(s.inv, id) < n) return tr('common.notEnoughNeed', ITEMS[id].name, n)
  if (!tx(s, (inv) => Object.entries(cost).every(([id, n]) => removeItem(inv, id, n)))) return tr('buildings.notEnoughMaterials')
  s.money -= money
  return ''
}
const clearFootprint = (s: GameState, x: number, z: number, w: number, d: number) => {
  for (let j = z; j < z + d; j++) for (let i = x; i < x + w; i++) {
    const t = s.tiles[j * FARM_W + i]
    t.ob = null
    t.till = false
    t.wet = 0
    t.fert = 0
  }
  // 站在占地里的人挪到门口
  if (s.region === 'farm' && s.x > x - 0.4 && s.x < x + w + 0.4 && s.z > z - 0.4 && s.z < z + d + 0.4) { s.x = x + Math.floor(w / 2) + 0.5; s.z = z + d + 1.2 }
}
export const canOrder = (s: GameState, k: BuildKind) =>
  k === 'coop' ? unlocked(s, 'system:animals') || unlocked(s, 'system:carpenter') : unlocked(s, 'system:carpenter')

// 下单：确认时扣款并生成工地（17.2）
export function orderBuilding(s: GameState, k: BuildKind, x: number, z: number): R {
  const def = BUILDINGS[k]
  if (!canOrder(s, k)) return fail(k === 'coop' ? tr('buildings.visitXiaHeDiner') : tr('buildings.visitHeYanCarpentry'))
  const b = busy(s)
  if (b) return fail(tr('buildings.carpentersBusyBuildingThey', BUILDINGS[b.k].name))
  if (def.max && s.farmB.filter((x) => x.k === k).length >= def.max) return fail(tr('buildings.buildMost', def.name, def.max))
  const why = placeProblem(s, k, x, z)
  if (why) return fail(why)
  const p = pay(s, def.money, def.cost)
  if (p) return fail(p)
  clearFootprint(s, x, z, def.w, def.d)
  s.farmB.push({ id: s.nextId++, k, x, z, done: s.day + def.days, up: 0, hay: 0, open: false, ...(k === 'cabin' ? { store: Array(48).fill(null) } : {}), ...(k === 'workshop' ? { mach: [] } : {}) })
  return ok(def.days === 1 ? tr('buildings.carpentersTookOrderReady2', def.name) : tr('buildings.carpentersTookOrderReady', def.days, def.name))
}
// G2 教学路线：禽舍建在门口西侧的预留地
export function buildCoop(s: GameState): R {
  if (s.farmB.some((b) => b.k === 'coop')) return fail(s.farmB.some((b) => b.k === 'coop' && bDone(s, b)) ? tr('buildings.coopAlreadyBuilt') : tr('buildings.coopUnderConstructionReady'))
  if (!unlocked(s, 'system:animals')) return fail(tr('buildings.visitXiaHeDiner'))
  return orderBuilding(s, 'coop', COOP_SITE.x, COOP_SITE.z)
}
export function upgradeBuilding(s: GameState, id: number): R {
  const b = s.farmB.find((x) => x.id === id)
  const up = b && BUILDINGS[b.k].up
  if (!b || !up) return fail(tr('buildings.buildingCantUpgraded'))
  if (b.up) return fail(bLevel(s, b) ? tr('buildings.alreadyUpgraded') : tr('buildings.upgradeProgress'))
  if (!bDone(s, b)) return fail(tr('buildings.stillUnderConstruction'))
  const other = busy(s)
  if (other) return fail(tr('buildings.carpentersBusyBuilding', BUILDINGS[other.k].name))
  const p = pay(s, up.money, up.cost)
  if (p) return fail(p)
  b.up = s.day + up.days
  return ok(tr('buildings.workBegunReadyKeep', up.name, up.days))
}
// 免费移动（17.3）：没有进行中的施工；动物、仓储随建筑一起搬
export function moveBuilding(s: GameState, id: number, x: number, z: number): R {
  const b = s.farmB.find((y) => y.id === id)
  if (!b) return fail()
  if (!bDone(s, b) || (b.up && b.up > s.day)) return fail(tr('buildings.buildingsUnderConstructionCant'))
  if (s.region === `in:${b.k}:${b.id}`) return fail(tr('buildings.insideStepBeforeMoving'))
  const why = placeProblem(s, b.k, x, z, b)
  if (why) return fail(why)
  const { w, d } = BUILDINGS[b.k]
  clearFootprint(s, x, z, w, d)
  b.x = x
  b.z = z
  return ok(tr('buildings.beenMoved', bName(s, b)))
}
// 拆除（17.3）：退回材料的 50%，不退金币；必须先腾空
export function demolish(s: GameState, id: number): R {
  const b = s.farmB.find((y) => y.id === id)
  if (!b) return fail()
  if (!bDone(s, b)) return fail(tr('buildings.cantDemolishDuringConstruction'))
  if (s.region === `in:${b.k}:${b.id}`) return fail(tr('buildings.insideStepBeforeDemolishing'))
  if (s.animals.some((a) => a.home === b.id)) return fail(tr('buildings.moveSellAnimalsInside'))
  if (b.store?.some(Boolean)) return fail(tr('buildings.emptyCabinsStorageFirst'))
  if (b.mach?.length || s.rooms?.[`in:${b.k}:${b.id}`]?.length) return fail(tr('buildings.pickFurnitureMachinesChests'))
  if (b.k === 'silo' && s.silo > siloCap(s) - 240) return fail(tr('buildings.takeExtraHayFirst'))
  const refund = Object.entries(BUILDINGS[b.k].cost).map(([k, n]) => [k, Math.floor(n / 2)] as const)
  if (!tx(s, (inv) => refund.every(([k, n]) => addItem(inv, k, 0, n)))) return fail(tr('buildings.noRoomBackpackRefunded'))
  s.farmB = s.farmB.filter((y) => y !== b)
  if (s.rooms) delete s.rooms[`in:${b.k}:${b.id}`]
  return ok(tr('buildings.toreDownGotBack', bName(s, b), refund.map(([k, n]) => ITEMS[k].name + '×' + n).join(tr('punct.listSep'))))
}

// ---------- 家宅升级：1 级开放私人厨房，2 级开放共居空间（17.4） ----------
export const houseLevel = (s: GameState) => s.house.lv
export function upgradeHouse(s: GameState): R {
  const u = HOUSE_UPGRADES[s.house.lv + 1]
  if (!u) return fail(tr('buildings.farmhouseFullyUpgraded'))
  if (s.house.up) return fail(tr('buildings.farmhouseAlreadyBeingExpanded'))
  const p = pay(s, u.money, u.cost)
  if (p) return fail(p)
  s.house.up = s.day + u.days
  return ok(tr('buildings.farmhouseExpansionBegunReady', u.days))
}

// ---------- 筒仓干草（10.3 筒仓 240 份，最多 4 个） ----------
export function putHay(s: GameState): R {
  const room = siloCap(s) - s.silo
  const n = Math.min(room, count(s.inv, 'hay'))
  if (room <= 0) return fail(tr('buildings.siloFull'))
  if (n <= 0) return fail(tr('buildings.noHayBackpack'))
  removeItem(s.inv, 'hay', n)
  s.silo += n
  return ok(tr('buildings.storedHaySilo', n, s.silo, siloCap(s)))
}
export function takeHay(s: GameState, n = 10): R {
  const k = Math.min(n, s.silo)
  if (!k) return fail(tr('buildings.siloEmpty'))
  if (!addItem(s.inv, 'hay', 0, k)) return fail(tr('common.backpackFull'))
  s.silo -= k
  return ok(tr('buildings.tookHay', k))
}

// ---------- 日结：完工与升级 ----------
export function buildingsSettle(s: GameState, next: number): string[] {
  const notes: string[] = []
  for (const b of s.farmB) {
    if (b.done === next) {
      const nm = BUILDINGS[b.k].name
      notes.push(b.k === 'coop' ? tr('buildings.finishedBuyChickensDucks', nm) : b.k === 'barn' ? tr('buildings.finishedBuyCowsSheep', nm) : tr('buildings.finished', nm))
      progress(s, { type: 'build', item: b.k, n: 1 })
    }
    if (b.up === next) notes.push(tr('buildings.finishedRoomAnimalsFeeds', BUILDINGS[b.k].up!.name, BUILDINGS[b.k].up!.cap))
  }
  if (s.house.up && s.house.up <= next) {
    s.house.lv++
    s.house.up = 0
    notes.push(s.house.lv === 1 ? tr('buildings.farmhouseExpansionCompleteNow') : tr('buildings.farmhouseSecondFloorComplete'))
    if (!s.flags.includes('house:' + s.house.lv)) s.flags.push('house:' + s.house.lv)
  }
  return notes
}
