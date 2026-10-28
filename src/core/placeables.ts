// 农场可放置物（设计 9.5 / 9.6 / 12.1 / 12.3）：箱子、喷灌与水管网络、果树、蜂箱、捕捞笼、营火、栅栏与门、木/石路、
// 自动进料柜与自动收集柜。放置规则在 actions.place，这里是交互与日结。
import { ANIMALS, BEEHIVE_DAYS, FRUIT_TREES, ITEMS, SEASON_NAMES, type AnimalKind } from '../content/content.ts'
import { addBatch, advanceMachine, batches, fail, jobBusy, jobDone, machineMinutes, machineRecipes, noteFound, ok, tx, type R } from './actions.ts'
import { t as tr } from './i18n.ts'
import { FARM_H, FARM_W } from './regions.ts'
import { TREE_NAMES, WILD_GROW, type TreeSp } from '../content/g4.ts'
import { absMin, addItem, buildingAt, count, isMature, rand, regionOf, removeItem, room, season, specMatch, type Ent, type GameState, type Slot } from './state.ts'

export const CHEST_SIZE: Record<string, number> = { chest: 24, chest_big: 48, auto_collector: 24 }
export const SPRINKLER_RANGE: Record<string, number> = { sprinkler: 1, sprinkler_plus: 2 } // 3×3 去中心 / 5×5 去中心
export const PIPE_REACH = 12 // 距水井或蓄水箱 12 格以内的管线连通
export const entAt = (s: GameState, x: number, z: number) => {
  const t = s.tiles[z * FARM_W + x]
  return t?.ent ? s.ents.find((e) => e.id === t.ent) : undefined
}
// 农场放置物或作坊里的机器
export const findEnt = (s: GameState, id: number) => s.ents.find((e) => e.id === id) ?? Object.values(s.rooms ?? {}).flat().find((e) => e.id === id)
const tile = (s: GameState, x: number, z: number) => (x >= 0 && z >= 0 && x < FARM_W && z < FARM_H ? s.tiles[z * FARM_W + x] : null)

// ---------- 箱子 ----------
export function chestMove(s: GameState, e: Ent, from: 'bag' | 'chest', idx: number): R {
  if (!e.store) return fail()
  const src = from === 'bag' ? s.inv : e.store
  const dst = from === 'bag' ? e.store : s.inv
  const sl = src[idx]
  if (!sl) return fail()
  if (from === 'bag' && ITEMS[sl.id].tool) return fail(tr('placeables.toolsStayBackpack'))
  // 能放多少放多少，余下的留在原处
  let n = Math.min(sl.n, room(dst, sl.id, sl.q, sl.b ?? 0))
  if (!n) return fail(from === 'bag' ? tr('placeables.chestFull') : tr('common.backpackFull'))
  addItem(dst, sl.id, sl.q, n, sl.b ?? 0)
  sl.n -= n
  if (!sl.n) src[idx] = null
  n = 0
  return ok()
}
// 只存已有同类物品（11.2）：工具、快捷栏不动
export function chestQuickStack(s: GameState, e: Ent): R {
  if (!e.store) return fail()
  let moved = 0
  for (let i = s.hotbar; i < s.inv.length; i++) {
    const sl = s.inv[i]
    if (!sl || ITEMS[sl.id].tool || !e.store.some((x) => x?.id === sl.id)) continue
    const n = Math.min(sl.n, room(e.store, sl.id, sl.q, sl.b ?? 0))
    if (!n) continue
    addItem(e.store, sl.id, sl.q, n, sl.b ?? 0)
    sl.n -= n
    moved += n
    if (!sl.n) s.inv[i] = null
  }
  return moved ? ok(tr('placeables.storedMatching', moved)) : fail(tr('placeables.noMatchingItemsStore'))
}
// 对着木箱使用大木箱：原位升级不丢物（12.3）
export function upgradeChest(s: GameState, e: Ent, idx: number): R {
  const sl = s.inv[idx]
  if (e.k !== 'chest' || sl?.id !== 'chest_big') return fail()
  if (!--sl.n) s.inv[idx] = null
  e.k = 'chest_big'
  e.store = [...e.store!, ...Array(24).fill(null)]
  return ok(tr('placeables.chestNowBigChest'))
}

// ---------- 水管网络（9.5）：从水井出发沿水管/蓄水箱/喷灌连通，距水源（井或已连通的蓄水箱）12 格以内 ----------
export function waterNetwork(s: GameState): Set<number> {
  const farm = regionOf(s, 'farm')
  const wells = farm.buildings.filter((b) => b.act === 'well')
  const best = new Int16Array(FARM_W * FARM_H).fill(-1) // 剩余可延伸格数
  const q: number[] = []
  const conductor = (i: number) => {
    const t = s.tiles[i]
    if (t.pipe) return true
    const e = t.ent ? s.ents.find((x) => x.id === t.ent) : undefined
    return !!e && (e.k === 'water_tank' || e.k in SPRINKLER_RANGE)
  }
  const push = (i: number, left: number) => {
    if (left < 0 || best[i] >= left) return
    best[i] = left
    q.push(i)
  }
  for (const w of wells) for (let z = w.z - 1; z <= w.z + w.d; z++) for (let x = w.x - 1; x <= w.x + w.w; x++) {
    if (x < 0 || z < 0 || x >= FARM_W || z >= FARM_H) continue
    const inside = x >= w.x && x < w.x + w.w && z >= w.z && z < w.z + w.d
    if (!inside && conductor(z * FARM_W + x)) push(z * FARM_W + x, PIPE_REACH - 1)
  }
  for (let h = 0; h < q.length; h++) {
    const i = q[h]
    const x = i % FARM_W, z = (i / FARM_W) | 0
    const e = s.tiles[i].ent ? s.ents.find((y) => y.id === s.tiles[i].ent) : undefined
    const left = e?.k === 'water_tank' ? PIPE_REACH : best[i] // 蓄水箱把网络再延伸 12 格
    if (e && e.k in SPRINKLER_RANGE) continue // 喷灌是末端
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, nz = z + dz
      if (nx < 0 || nz < 0 || nx >= FARM_W || nz >= FARM_H) continue
      const n = nz * FARM_W + nx
      if (conductor(n)) push(n, left - 1)
    }
  }
  const out = new Set<number>()
  for (let i = 0; i < best.length; i++) if (best[i] >= 0) out.add(i)
  return out
}
export const sprinklerConnected = (s: GameState, e: Ent, net = waterNetwork(s)) => net.has(e.z * FARM_W + e.x)
export function sprinklerTiles(e: Ent): [number, number][] {
  const r = SPRINKLER_RANGE[e.k] ?? 0
  const out: [number, number][] = []
  for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) if (dx || dz) out.push([e.x + dx, e.z + dz])
  return out
}
// 喷灌浇水：把覆盖范围内的耕地标记为 day 当日有效（同格同日重复覆盖不重复计）
function sprinkle(s: GameState, e: Ent, day: number) {
  let n = 0
  for (const [x, z] of sprinklerTiles(e)) {
    const t = tile(s, x, z)
    if (t?.till && t.wet < day) { t.wet = day; n++ }
  }
  return n
}
// 日中新放的喷灌允许手动启动一次（9.5）
export function runSprinkler(s: GameState, e: Ent): R {
  if (!(e.k in SPRINKLER_RANGE)) return fail()
  if (!sprinklerConnected(s, e)) return fail(tr('placeables.notConnectedWaterLink'))
  if (e.ran === s.day) return fail(tr('placeables.alreadySprinkledToday'))
  e.ran = s.day
  const n = sprinkle(s, e, s.day)
  return ok(n ? tr('placeables.sprinklersWateredTilled', n) : tr('placeables.tilledSoilRangeAlready'))
}

// ---------- 果树（9.6）：树苗 3×3 无树与建筑；成熟后合法季节每天结 1 果，最多 3 个 ----------
export function treeSpotOk(s: GameState, x: number, z: number, self?: number) {
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const t = tile(s, x + dx, z + dz)
    if (!t) return false
    if (t.ob && (t.ob.k === 'tree' || t.ob.k === 'stump')) return false
    if (buildingAt(s, x + dx, z + dz) && s.region === 'farm') return false
    const e = t.ent ? s.ents.find((y) => y.id === t.ent) : undefined
    if (e && e.id !== self && (dx || dz)) return false
  }
  return true
}
export const treeMature = (e: Ent) => e.k === 'fruit_tree' && (e.grown ?? 0) >= FRUIT_TREES[e.tree!].grow
export function pickFruit(s: GameState, e: Ent, dry = false): R {
  if (e.k !== 'fruit_tree' || !e.fruit) return fail(e.k === 'fruit_tree' && !treeMature(e) ? tr('placeables.saplingStillGrowingDays', e.grown ?? 0, FRUIT_TREES[e.tree!].grow) : tr('placeables.noFruitTreeYet'))
  const def = FRUIT_TREES[e.tree!]
  // 树龄每满一年精品概率 +5 个百分点，最多 +15（9.6）
  const years = Math.min(3, Math.floor((s.day - (e.planted ?? s.day)) / 112))
  const qs = Array.from({ length: e.fruit }, (_, k) => (rand(s.seed, e.id, s.day, k, 91) < 0.02 + 0.05 * years ? 2 : rand(s.seed, e.id, s.day, k, 92) < 0.1 ? 1 : 0))
  if (dry) return ok(tr('placeables.picked', def.name, e.fruit))
  if (!tx(s, (inv) => qs.every((q) => addItem(inv, def.fruit, q, 1)))) return fail(tr('common.backpackFull'))
  const n = e.fruit
  e.fruit = 0
  noteFound(s, def.fruit)
  s.xp.foraging += 3 * n
  return ok(`+${n} ${ITEMS[def.fruit].name}`)
}

// ---------- 蜂箱：每 2 个春夏秋日结产 1 份蜂蜜；5 格内有成熟的花酿成花蜜 ----------
const flowerNear = (s: GameState, e: Ent) => s.tiles.some((t, i) => {
  const c = t.crop
  if (!c || !isMature(c) || !ITEMS[c.cid]?.tags?.includes('flower')) return false
  return Math.abs((i % FARM_W) - e.x) <= 5 && Math.abs(((i / FARM_W) | 0) - e.z) <= 5
})

// ---------- 营火：木 1 燃烧 120 分钟；旁边休息 20 分钟恢复 10 精力，每日累计 40 ----------
export function fuelFire(s: GameState, e: Ent): R {
  if (!count(s.inv, 'wood')) return fail(tr('placeables.needs1Wood'))
  removeItem(s.inv, 'wood', 1)
  e.lit = Math.max(e.lit ?? 0, absMin(s)) + 120
  return ok(tr('placeables.campfireBlazing120Min'))
}
export const fireLit = (s: GameState, e: Ent) => (e.lit ?? 0) > absMin(s)
export function restAtFire(s: GameState): R {
  if (s.rest?.day !== s.day) s.rest = { day: s.day, n: 0 }
  if (s.rest.n >= 40) return fail(tr('placeables.youveRestedEnoughToday'))
  if (s.min > 1500) return fail(tr('placeables.lateTimeHeadHome'))
  const gain = Math.min(10, 40 - s.rest.n)
  s.min += 20
  s.energy = Math.min(s.maxEnergy, s.energy + gain)
  s.rest.n += gain
  s.satiety = Math.max(0, s.satiety - 2)
  return ok(tr('placeables.rested20MinEnergy', gain, 40 - s.rest.n))
}

// ---------- 捕捞笼：放在水边，每日用鱼饵 1 份 ----------
export function baitPot(s: GameState, e: Ent): R {
  if (e.job) return jobDone(s, e) ? fail() : fail(tr('placeables.potAlreadyBaited'))
  if (!count(s.inv, 'bait')) return fail(tr('placeables.needs1Bait'))
  removeItem(s.inv, 'bait', 1)
  e.job = { doneAt: (s.day) * 1440 + 360, out: { id: rand(s.seed, e.id, s.day, 93) < 0.55 ? 'crayfish' : 'river_snail', q: 0, n: 1 }, input: [{ id: 'bait', q: 0, n: 1 }] }
  return ok(tr('placeables.baitedComeBackTomorrow'))
}

// ---------- 栅栏门 ----------
export function toggleGate(s: GameState, e: Ent): R {
  if (e.k !== 'gate_wood') return fail()
  e.open = !e.open
  const t = s.tiles[e.z * FARM_W + e.x]
  t.gate = e.open ? 2 : 1
  return ok(e.open ? tr('placeables.gateOpened') : tr('placeables.gateClosed'))
}

// ---------- 自动进料柜：从 2 格内的箱子取普通品质原料，给相邻的空闲机器投料；成品放回箱子 ----------
const near = (a: Ent, b: Ent, d: number) => Math.abs(a.x - b.x) + Math.abs(a.z - b.z) <= d
export function runHoppers(s: GameState, fill = 1) {
  for (const h of s.ents.filter((e) => e.k === 'auto_hopper')) {
    const chests = s.ents.filter((c) => c.store && c.k !== 'auto_collector' && near(h, c, 2))
    if (!chests.length) continue
    for (const m of s.ents.filter((e) => machineRecipes(s, e.k).length && near(h, e, 1) && Math.max(Math.abs(h.x - e.x), Math.abs(h.z - e.z)) <= 1)) {
      // 先把做好的成品收进箱子（放不下的留在机器里）
      advanceMachine(s, m)
      if (m.done) m.done = m.done.filter((o) => { const c = chests.find((c) => room(c.store!, o.id, o.q) >= o.n); if (c) addItem(c.store!, o.id, o.q, o.n); return !c })
      if (m.done && !m.done.length) delete m.done
      if (m.job && !jobBusy(s, m) && !m.queue?.length) {
        const o = m.job.out
        const c = chests.find((c) => room(c.store!, o.id, o.q) >= o.n)
        if (!c) continue
        addItem(c.store!, o.id, o.q, o.n)
        m.job = null
      }
      while (batches(m) < fill) {
      let added = false
      for (const r of machineRecipes(s, m.k)) {
        // 原料只取箱子里普通品质、非商购的物品（默认不用精品、收藏物和任务预留物）
        const pool: { c: Ent; i: number; sl: Slot }[] = []
        for (const c of chests) c.store!.forEach((sl, i) => { if (sl && sl.q === 0 && !sl.b && !ITEMS[sl.id].tags?.includes('key')) pool.push({ c, i, sl }) })
        const need = r.in.map(([spec, n]) => ({ spec, n }))
        const src = pool.find((p) => specMatch(need[0].spec, p.sl.id) && p.sl.n >= need[0].n)?.sl.id
        if (!src) continue
        const ok2 = need.slice(1).every(({ spec, n }) => pool.filter((p) => specMatch(spec, p.sl.id)).reduce((a, p) => a + p.sl.n, 0) >= n)
        if (!ok2) continue
        const out = r.out === '*pickle' ? 'pickle_' + src : r.out === '*jam' ? 'jam_' + src : r.out === '*seed' ? 'seed_' + src : r.out
        if (!ITEMS[out]) continue
        const input: Slot[] = []
        const take = (match: (id: string) => boolean, n: number) => {
          for (const p of pool) {
            if (n <= 0) break
            if (!p.sl.n || !match(p.sl.id)) continue
            const k = Math.min(n, p.sl.n)
            p.sl.n -= k
            n -= k
            input.push({ id: p.sl.id, q: 0, n: k })
            if (!p.sl.n) p.c.store![p.i] = null
          }
        }
        take((id) => id === src, need[0].n)
        for (const { spec, n } of need.slice(1)) take((id) => specMatch(spec, id), n)
        addBatch(s, m, machineMinutes(s, m.k, r.min), { id: out, q: 0, n: r.n }, input)
        added = true
        break
      }
      if (!added) break
      }
    }
  }
}

// ---------- 日结：喷灌、果树、蜂箱、捕捞笼（在作物结算之后、次日天气之后调用） ----------
export function placeablesSettle(s: GameState, today: number, next: number): string[] {
  const notes: string[] = []
  const net = waterNetwork(s)
  let watered = 0
  const grown: Ent[] = []
  for (const e of s.ents) {
    if (e.k in SPRINKLER_RANGE) { if (net.has(e.z * FARM_W + e.x)) watered += sprinkle(s, e, next) }
    else if (e.k === 'fruit_tree') {
      const def = FRUIT_TREES[e.tree!]
      if (!treeMature(e)) {
        // 树苗周围被占用时停长并提示，不无提示停长（9.6）
        if (treeSpotOk(s, e.x, e.z, e.id)) { e.grown = (e.grown ?? 0) + 1; if (treeMature(e)) notes.push(tr('placeables.treeFullyGrownBears', def.name)) }
        else notes.push(tr('placeables.n33AroundSapling', def.name))
      } else if (def.seasons.includes(season(next)) && (e.fruit ?? 0) < 3) e.fruit = (e.fruit ?? 0) + 1
    } else if (e.k === 'wild_tree') {
      // 树种子：冬天不长；长够天数后变成一棵真正的树（可砍伐、掉落种子）
      if (season(today) === 3 || !treeSpotOk(s, e.x, e.z, e.id)) continue
      if ((e.grown = (e.grown ?? 0) + 1) >= WILD_GROW) {
        const t = s.tiles[e.z * FARM_W + e.x]
        t.ent = 0
        t.ob = { k: 'tree', dmg: 0, sp: e.tree }
        grown.push(e)
        notes.push(tr('placeables.plantedGrownBigTree', TREE_NAMES[e.tree as TreeSp][0]))
      }
    } else if (e.k === 'beehive') {
      if (season(today) === 3) continue // 冬季停产
      e.hive = (e.hive ?? 0) + 1
      if (e.hive >= BEEHIVE_DAYS && !e.job) {
        e.hive = 0
        e.job = { doneAt: absMin(s), out: { id: flowerNear(s, e) ? 'honey_flower' : 'honey', q: 0, n: 1 }, input: [] }
      }
    }
  }
  if (grown.length) s.ents = s.ents.filter((e) => !grown.includes(e))
  if (watered) notes.push(tr('placeables.sprinklersWateredTilled', watered))
  return notes
}
// 自动收集柜：每早收取 2 格内畜舍的全部产物（不需要挤奶桶、剪毛剪）
export function collectorsSettle(s: GameState) {
  const farm = regionOf(s, 'farm')
  for (const c of s.ents.filter((e) => e.k === 'auto_collector')) {
    const homes = farm.buildings.filter((b) => b.home && c.x >= b.x - 2 && c.x < b.x + b.w + 2 && c.z >= b.z - 2 && c.z < b.z + b.d + 2).map((b) => b.home)
    for (const a of s.animals.filter((a) => homes.includes(a.home))) {
      const prod = ANIMALS[a.kind as AnimalKind].product
      while (a.eggs > 0 && addItem(c.store!, prod, productQuality(s, a, a.eggs), 1)) {
        a.eggs--
        s.xp.husbandry += 6
      }
    }
  }
}
// 10.2 产物品质：精品 2%+亲密度×0.01%，优良 10%+亲密度×0.02%
export function productQuality(s: GameState, a: { id: number; love: number }, k: number) {
  const r = rand(s.seed, a.id, s.day, k, 31)
  const elite = 0.02 + a.love * 0.0001
  return r < elite ? 2 : r < elite + 0.1 + a.love * 0.0002 ? 1 : 0
}
export const describeEnt = (s: GameState, e: Ent) => {
  const name = ITEMS[e.k]?.name ?? e.k
  if (e.k === 'wild_tree') return tr('placeables.saplingDaysDoesntGrow', TREE_NAMES[e.tree as TreeSp][0], e.grown ?? 0, WILD_GROW)
  if (e.k === 'fruit_tree') {
    const fn = FRUIT_TREES[e.tree!].name
    if (!treeMature(e)) return tr('placeables.saplingDays', fn, e.grown ?? 0, FRUIT_TREES[e.tree!].grow)
    return e.fruit ? tr('placeables.treeFruitFPick', fn, e.fruit) : tr('placeables.treeFruits', fn, FRUIT_TREES[e.tree!].seasons.map((x) => SEASON_NAMES[x]).join('/'))
  }
  if (e.k in SPRINKLER_RANGE) return sprinklerConnected(s, e) ? tr('placeables.connectedWaterWatersEvery', name) : tr('placeables.notConnectedWater', name)
  if (e.store) return tr('common.progress', name, e.store.filter(Boolean).length, e.store.length)
  if (e.k === 'campfire') return fireLit(s, e) ? tr('placeables.campfireBurning') : tr('placeables.campfireFAddWood')
  if (e.k === 'crab_pot') return e.job ? (jobDone(s, e) ? tr('placeables.crabPotCatchReady') : tr('placeables.crabPotBaited')) : tr('placeables.crabPotEmptyF')
  if (e.k === 'beehive') return e.job ? tr('placeables.beehiveHoneyReady') : season(s.day) === 3 ? tr('placeables.beehiveRestingWinter') : tr('placeables.beehiveMakingHoneyDays', e.hive ?? 0, BEEHIVE_DAYS)
  if (e.k === 'gate_wood') return e.open ? tr('placeables.woodGateOpenF') : tr('placeables.woodGateClosedF')
  return name
}
