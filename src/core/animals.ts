// 畜牧（设计 10 / 17.1）：6 种动物、禽舍与畜棚、干草与放牧、摸头、产物与照料工具、出售。
// 成长和生产只在有效喂养日推进；缺粮只暂停，不死亡、不永久降低属性（10.2）。
import { ANIMALS, ITEMS, type AnimalKind } from '../content/content.ts'
import { fail, noteFound, ok, tx, type R } from './actions.ts'
import { bCap, bDone, bLevel, bName, buildCoop, homes, yardOf } from './buildings.ts'
import { productQuality } from './placeables.ts'
import { progress, unlocked } from './quests.ts'
import { t as tr, zhText } from './i18n.ts'
import { COOP_YARD, FARM_W } from './regions.ts'
import { addItem, count, raining, regionOf, removeItem, room, season, solid, type Animal, type FarmBuilding, type GameState } from './state.ts'

export { buildCoop }
export const FEEDER_CAP = 30 // 每座畜舍的饲料槽
export const hasLent = (s: GameState) => s.animals.some((a) => a.lent)
export const adult = (a: Animal) => a.fed >= ANIMALS[a.kind].mature
// 动物名：存档里存中文原文（与旧存档一致，切换语言不改存档），显示时用 animalName() 换成当前语言；名字表是词典里的 animals.name.<种类>.<序号>
const NAMES = Object.fromEntries(Object.keys(ANIMALS).map((k) => [k, Array.from({ length: 8 }, (_, i) => `animals.name.${k}.${i}`)])) as Record<AnimalKind, string[]>
const LENT_NAME = 'animals.name.lent'
const NAME_KEY = new Map([...Object.values(NAMES).flat(), LENT_NAME].map((key) => [zhText(key), key]))
export const animalName = (name: string) => { const key = NAME_KEY.get(name); return key ? tr(key) : name in ANIMALS ? ANIMALS[name as AnimalKind].name : name }
// G2 教学代养（任务设计 §1.1、§5）：夏禾借出一只成年教学鸡，手喂 5 个有效日后产首蛋，领蛋后归还；不可出售
export function borrowChicken(s: GameState): R {
  if (!unlocked(s, 'system:animals')) return fail(tr('animals.visitXiaHeDiner'))
  if (s.animals.length) return fail(tr('animals.alreadyLookingAfterChicken'))
  s.animals.push({ id: s.nextId++, kind: 'chicken', name: zhText(LENT_NAME), home: 0, fed: 0, love: 0, pet: 0, fedDay: 0, eggs: 0, prog: 0, bought: s.day, lent: true })
  return ok(tr('animals.xiaHeLentTraining'))
}
// 手动喂一份干草（没有饲料槽时也能照料，10.2）
export function feedAnimal(s: GameState, id: number): R {
  const a = s.animals.find((x) => x.id === id)
  if (!a) return fail()
  if (a.fedDay === s.day) return fail(tr('animals.alreadyEatenToday', animalName(a.name)))
  if (!count(s.inv, 'hay')) return fail(tr('animals.noHayBackpackSold'))
  removeItem(s.inv, 'hay', 1)
  a.fedDay = s.day
  return ok(tr('animals.fedHay', animalName(a.name)))
}

// ---------- 购买（10.1）：检查空栏位、建筑类别与升级要求，金币与动物实例原子提交 ----------
export function homeFor(s: GameState, kind: AnimalKind): FarmBuilding | undefined {
  const d = ANIMALS[kind]
  return homes(s, d.home).find((b) => (!d.big || bLevel(s, b)) && s.animals.filter((a) => a.home === b.id).length < bCap(s, b))
}
export function buyAnimal(s: GameState, kind: AnimalKind, homeId?: number): R {
  const d = ANIMALS[kind]
  const b = homeId ? s.farmB.find((x) => x.id === homeId) : homeFor(s, kind)
  const hk = d.home === 'coop' ? tr('common.coop') : tr('common.barn')
  if (!homes(s, d.home).length) return fail(tr('animals.buildFirst', hk))
  if (!b) return fail(d.big ? tr('animals.needsUpgraded', d.name, hk) : tr('animals.full', hk))
  if (d.big && !bLevel(s, b)) return fail(tr('animals.needsUpgraded', d.name, bName(s, b)))
  if (s.animals.filter((a) => a.home === b.id).length >= bCap(s, b)) return fail(tr('animals.full2', bName(s, b), bCap(s, b)))
  if (s.money < d.price) return fail(tr('common.notEnoughMoney'))
  s.money -= d.price
  const name = NAMES[kind].map(zhText).find((n) => !s.animals.some((a) => a.name === n)) ?? kind // 8 个名字都用过了：存种类，显示为种类名
  s.animals.push({ id: s.nextId++, kind, name, home: b.id, fed: 0, love: 0, pet: 0, fedDay: 0, eggs: 0, prog: 0, bought: s.day })
  return ok(tr('animals.newMoved', d.name, animalName(name), bName(s, b)))
}
export const buyChicken = (s: GameState) => buyAnimal(s, 'chicken')
// 出售（10.3）：长按确认；返还购价 40% + 亲密度奖励，合计不超过 70%
export const sellPrice = (a: Animal) => Math.floor(ANIMALS[a.kind].price * Math.min(0.7, 0.4 + (a.love / 1000) * 0.3))
export function sellAnimal(s: GameState, id: number): R {
  const a = s.animals.find((x) => x.id === id)
  if (!a || a.lent) return fail(tr('animals.trainingAnimalsCantSold'))
  s.money += sellPrice(a)
  s.animals = s.animals.filter((x) => x !== a)
  return ok(tr('animals.wentOffNewHome', animalName(a.name), sellPrice(a)))
}
// 迁移（10.3）：只能去同类、有空位的建筑
export function moveAnimal(s: GameState, id: number, to: number): R {
  const a = s.animals.find((x) => x.id === id)
  const b = s.farmB.find((x) => x.id === to)
  if (!a || !b || a.lent) return fail()
  const d = ANIMALS[a.kind]
  if (b.k !== d.home || !bDone(s, b)) return fail(tr('animals.animalsOnlyMoveSame'))
  if (d.big && !bLevel(s, b)) return fail(tr('animals.needsUpgradedBuilding'))
  if (s.animals.filter((x) => x.home === b.id).length >= bCap(s, b)) return fail(tr('animals.alreadyFull'))
  a.home = b.id
  return ok(tr('animals.moved', animalName(a.name), bName(s, b)))
}

// 把背包里的干草放进某座畜舍的饲料槽（每只每天吃 1 份）
export function fillTrough(s: GameState, b: FarmBuilding): R {
  const n = Math.min(count(s.inv, 'hay'), FEEDER_CAP - b.hay)
  if (b.hay >= FEEDER_CAP) return fail(tr('animals.feedTroughAlreadyFull'))
  if (n <= 0) return fail(tr('animals.noHayBackpackSold'))
  removeItem(s.inv, 'hay', n)
  b.hay += n
  return ok(tr('animals.addedHayTrough', n, b.hay, FEEDER_CAP))
}
export const firstCoop = (s: GameState) => homes(s, 'coop')[0]
export const fillFeeder = (s: GameState) => (firstCoop(s) ? fillTrough(s, firstCoop(s)!) : fail(tr('animals.buildCoopFirst')))
export function toggleDoor(_s: GameState, b: FarmBuilding): R {
  b.open = !b.open
  return ok(b.open ? tr('animals.doorOpenedSunnyDays') : tr('animals.doorClosedAnimalsStay'))
}

// 摸头每天每只 +8 亲密度（10.2）
export function petAnimal(s: GameState, id: number): R {
  const a = s.animals.find((x) => x.id === id)
  if (!a) return fail()
  if (a.pet === s.day) return fail(tr('animals.youveAlreadyPettedToday', animalName(a.name)))
  a.pet = s.day
  a.love = Math.min(1000, a.love + 8)
  progress(s, { type: 'animal', action: 'pet', n: 1 })
  return ok(tr('animals.happilySnuggles', animalName(a.name)))
}

// ---------- 产物：鸡鸭兔的蛋/绒在窝里收；奶与毛要用挤奶桶、剪毛剪（10.2） ----------
export const needsTool = (a: Animal) => ANIMALS[a.kind].care
export const nestWaiting = (s: GameState, home?: number) => s.animals.filter((a) => !needsTool(a) && (home === undefined || a.home === home)).reduce((n, a) => n + a.eggs, 0)
export const eggsWaiting = (s: GameState) => nestWaiting(s)
function collect(s: GameState, list: Animal[]): R {
  const got = list.flatMap((a) => Array.from({ length: a.eggs }, (_, k) => ({ a, id: ANIMALS[a.kind].product, q: productQuality(s, a, k) })))
  if (!got.length) return fail(tr('animals.nothingCollectYet'))
  if (!tx(s, (inv) => got.every((g) => addItem(inv, g.id, g.q, 1)))) return fail(tr('common.backpackFull'))
  const back = list.filter((a) => a.lent && a.eggs > 0)
  for (const a of list) a.eggs = 0
  s.animals = s.animals.filter((a) => !back.includes(a)) // 教学鸡领过首蛋后归还
  for (const g of got) noteFound(s, g.id)
  s.xp.husbandry += 6 * got.length // 16.1 领取产物每份 6
  progress(s, { type: 'animal', action: 'collect', n: got.length })
  const names = [...new Set(got.map((g) => ITEMS[g.id].name))].join(tr('punct.listSep'))
  return ok(`+${got.length} ${names}${back.length ? tr('animals.trainingHensJobDone') : ''}`)
}
// 收取一座畜舍里窝中的产物；不带 home 时收全部（含教学鸡）
export const collectNest = (s: GameState, home?: number) => collect(s, s.animals.filter((a) => !needsTool(a) && (home === undefined || a.home === home)))
export const collectEggs = (s: GameState) => collectNest(s)
// 挤奶、剪毛：背包里有对应工具即可
export function careAnimal(s: GameState, id: number): R {
  const a = s.animals.find((x) => x.id === id)
  const care = a && needsTool(a)
  if (!a || !care) return fail()
  const tool = care === 'milk' ? 'milk_pail' : 'shears'
  if (!count(s.inv, tool)) return fail(tr('animals.requiresSoldRanch', ITEMS[tool].name))
  if (!a.eggs) return fail(adult(a) ? tr('animals.noRightNow', animalName(a.name), ITEMS[ANIMALS[a.kind].product].name) : tr('animals.stillYoungFedDays', animalName(a.name), a.fed, ANIMALS[a.kind].mature))
  if (room(s.inv, ANIMALS[a.kind].product) < a.eggs) return fail(tr('common.backpackFull'))
  return collect(s, [a])
}

// ---------- 日结（10.2）：手喂 → 放牧 → 饲料槽 → 升级建筑自动从筒仓取草 ----------
export function animalsSettle(s: GameState) {
  const lines: string[] = []
  let hungry = 0
  const grazing = !raining(s) && season(s.day) < 3
  for (const a of s.animals) {
    const d = ANIMALS[a.kind]
    const b = s.farmB.find((x) => x.id === a.home)
    let fed = a.fedDay === s.day
    if (!fed && b && b.open && grazing && bDone(s, b)) fed = true // 有效放牧
    if (!fed && b && b.hay > 0) { b.hay--; fed = true }
    if (!fed && b && bLevel(s, b) && s.silo > 0) { s.silo--; fed = true }
    if (!fed && a.lent) { const c = s.farmB.find((x) => x.k === 'coop' && bDone(s, x)); if (c && c.hay > 0) { c.hay--; fed = true } }
    if (!fed) { hungry++; continue }
    a.fedDay = s.day
    a.fed++
    a.love = Math.min(1000, a.love + 2)
    s.xp.husbandry += 1 // 16.1 喂养每只每日 1
    progress(s, { type: 'animal', action: 'feed', n: 1 })
    if (a.fed === d.mature) lines.push(tr('animals.grownNowProducing', animalName(a.name), ITEMS[d.product].name))
    if (a.fed >= d.mature && ++a.prog >= d.every) {
      a.prog = 0
      if (a.eggs < 3) a.eggs++ // 每只最多保留 3 份未取产物
    }
  }
  if (hungry) lines.push(tr('animals.animalsWentUnfedYesterday', hungry))
  const full = s.animals.filter((a) => a.eggs >= 3).length
  if (full) lines.push(tr('animals.animals3ProductsWaiting', full))
  return lines
}

// ---------- 运行时：动物住在禽舍/畜棚里；开着门、白天、晴天且不是冬天才到门前院子活动。只用于表现与摸头定位，不存档 ----------
export interface AnimalActor { id: number; kind: AnimalKind; x: number; z: number; face: number; tx: number; tz: number; t: number; mode: 'idle' | 'walk' | 'eat'; baby: boolean; yard: { x: number; z: number; w: number; d: number } }
export type ChickenActor = AnimalActor
const fineDay = (s: GameState) => s.min >= 420 && s.min < 1110 && !raining(s) && season(s.day) < 3
// 这只动物此刻在院子里（否则在自己的畜舍里）；教学鸡没有畜舍，白天在默认院子
export function animalOut(s: GameState, a: Animal) {
  const b = s.farmB.find((x) => x.id === a.home)
  return fineDay(s) && (b ? bDone(s, b) && !!b.open : !!a.lent)
}
export const chickensOut = (s: GameState) => s.region === 'farm' && s.animals.some((a) => animalOut(s, a))
export function animalStep(s: GameState, actors: Map<number, AnimalActor>, dt: number) {
  const inside = /^in:(coop|barn):(\d+)$/.exec(s.region)
  const home = inside ? Number(inside[2]) : 0
  if (s.region !== 'farm' && !home) { actors.clear(); return }
  const r = regionOf(s)
  const free = (x: number, z: number) => {
    if (!home) { const t = s.tiles[Math.floor(z) * FARM_W + Math.floor(x)]; return !!t && !t.ob && !t.ent && !t.crop && t.g === 0 }
    return z >= 2 && !solid(s, Math.floor(x), Math.floor(z)) // 屋里：避开北墙喂食槽一排与家具
  }
  for (const a of s.animals) {
    const want = home ? a.home === home && !animalOut(s, a) : animalOut(s, a)
    if (!want) { actors.delete(a.id); continue }
    if (actors.has(a.id)) continue
    const b = s.farmB.find((x) => x.id === a.home)
    const yard = home ? { x: 1, z: 2, w: r.w - 2, d: r.h - 3 } : b ? yardOf(b) : COOP_YARD
    let x = yard.x + 1 + Math.random() * (yard.w - 2), z = yard.z + 0.6 + Math.random() * 1.2
    for (let k = 0; home && k < 20 && !free(x, z); k++) { x = yard.x + 0.5 + Math.random() * (yard.w - 1); z = yard.z + 0.5 + Math.random() * (yard.d - 1) }
    actors.set(a.id, { id: a.id, kind: a.kind, x, z, face: Math.random() * 6.28, tx: x, tz: z, t: Math.random() * 2, mode: 'idle', baby: !adult(a), yard })
  }
  for (const [id, c] of actors) {
    const a = s.animals.find((x) => x.id === id)
    if (!a) { actors.delete(id); continue }
    c.baby = !adult(a)
    c.t -= dt
    if (c.t <= 0) {
      const r = Math.random()
      if (r < 0.45) {
        c.mode = 'walk'
        c.tx = c.yard.x + 0.6 + Math.random() * (c.yard.w - 1.2)
        c.tz = c.yard.z + 0.6 + Math.random() * (c.yard.d - 1.2)
        c.t = 4
      } else { c.mode = r < 0.75 ? 'eat' : 'idle'; c.t = 1.5 + Math.random() * 2.5 }
    }
    if (c.mode === 'walk') {
      const dx = c.tx - c.x, dz = c.tz - c.z
      const d = Math.hypot(dx, dz)
      if (d < 0.05) { c.mode = 'eat'; c.t = 1.2 + Math.random() * 2 }
      else {
        const sp = (ANIMALS[c.kind].home === 'barn' ? 0.9 : 0.7) * dt
        const st = Math.min(d, sp)
        const nx = c.x + (dx / d) * st, nz = c.z + (dz / d) * st
        if (free(nx, nz)) { c.x = nx; c.z = nz } else c.t = 0
        c.face = Math.atan2(dx, dz)
      }
    }
  }
}
export const chickenStep = animalStep
