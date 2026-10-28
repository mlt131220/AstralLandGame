// 玩家命令。每个命令先完整校验再原子提交；dry=true 时只校验并返回预览文本（设计 7.3 / 21.3）。
import {
  BAG_UPGRADES, CAN_CAPACITY, CROPS, DAY_END, DIFFICULTY, ITEMS, KITCHEN_HOURS, MACHINES, OBSTACLE_BONUS, OBSTACLES, QUALITY_MULT,
  QUALITY_NAMES, REACH, RECIPES, SEASON_NAMES, SKILL_NAMES, TOOL_TIER, TOOLS, type ToolId,
} from '../content/content.ts'
import {
  absMin, addItem, bagSize, buildingAt, count, countSpec, dateName, entsOf, fellWild, isMature, level, mineRevealed, rand, regionOf, selItem,
  removeSpec, room, season, specMatch, takeWild, tileAt, touchRoom, weather, weatherWaters, type Ent, type GameState, type Slot, type Tile,
} from './state.ts'
import { ownedRoom, WALL_IN } from './interiors.ts'
import { storeWear } from './wardrobe.ts'
import { DECOR_BY_ID, footOf, SURFACES, WALL_SIDES, type DecorDef } from '../content/g4.ts'
import { treeSpecies } from './regions.ts'
import { TREE_SEED_CHANCE } from '../content/g4.ts'
import type { MachineRecipe } from '../content/content.ts'
import { addBuff, climateStep, cure, hasStatus, laborMult, maxEnergyOf, maxHpOf } from './climate.ts'
import { siloCap } from './buildings.ts'
import { t as tr } from './i18n.ts'
import { applyUnlock, friend, progress, submitQuest, unlocked } from './quests.ts'
import { COOP_SITE, FARM_W, type Act } from './regions.ts'
import { baitPot, chestMove, CHEST_SIZE, describeEnt, fireLit, fuelFire, pickFruit, runHoppers, runSprinkler, SPRINKLER_RANGE, toggleGate, treeMature, treeSpotOk, upgradeChest } from './placeables.ts'

// 禽舍推荐位置（6×5）：还没有禽舍时不能开垦或放置，保证教学建舍不被误操作卡住
export let coopReserved = true
export const onCoopSite = (x: number, z: number) => coopReserved && x >= COOP_SITE.x && x < COOP_SITE.x + COOP_SITE.w && z >= COOP_SITE.z && z < COOP_SITE.z + COOP_SITE.d
const syncCoopReserve = (s: GameState) => { coopReserved = !s.farmB.some((b) => b.k === 'coop') }

export interface R { ok: boolean; msg?: string; dur?: number }
export const fail = (msg = ''): R => ({ ok: false, msg })
export const ok = (msg?: string): R => ({ ok: true, msg })

export const price = (sl: Slot) => Math.floor(ITEMS[sl.id].sell * QUALITY_MULT[sl.q])
export const itemName = (sl: Slot) => (sl.q ? tr('fmt.pair', QUALITY_NAMES[sl.q], ITEMS[sl.id].name) : ITEMS[sl.id].name)

// 多物品操作：在库存副本上执行，全部成功才替换（设计 32.3）
export function tx(s: GameState, fn: (inv: (Slot | null)[]) => boolean) {
  const inv = s.inv.map((sl) => sl && { ...sl })
  if (!fn(inv)) return false
  s.inv = inv
  return true
}
export function takeOne(s: GameState, sl: Slot) {
  if (!--sl.n) s.inv[s.inv.indexOf(sl)] = null
}
// 图鉴：首次获得记录经营日（设计 19.3）
export const noteFound = (s: GameState, id: string) => { s.found[id] ??= s.day }

// 11.1 体力 = 基础 × (1 − 0.03 × 技能等级)；6.2 饥饿加成；6.4 寒冷加成与 12.4 料理减耗
export function energyCost(s: GameState, tool: ToolId) {
  const t = TOOLS[tool]
  let c = t.energy * (1 - 0.03 * level(s.xp[t.skill]))
  if (s.satiety <= 0) c *= 1.4
  else if (s.satiety < 30) c *= 1.2
  c *= laborMult(s)
  return Math.round(c * 10) / 10
}
export function spend(s: GameState, c: number) {
  s.energy = Math.round((s.energy - c) * 10) / 10
  s.satiety = Math.max(0, s.satiety - 0.03)
}

// 鼠标左键：对目标格使用当前快捷栏物品
export function useAt(s: GameState, x: number, z: number, dry = false): R {
  syncCoopReserve(s)
  const t = tileAt(s, x, z)
  if (!t) return fail()
  if (Math.hypot(x + 0.5 - s.x, z + 0.5 - s.z) > REACH) return fail(tr('actions.tooFarAway'))
  if (t.fo) return pickup(s, t, x, z, dry) // 地上的采集物优先拾取
  if (t.crop && isMature(t.crop)) return harvest(s, t, x, z, dry) // 成熟作物优先收获
  const ent = t.ent ? entsOf(s).find((e) => e.id === t.ent) : undefined
  if (ent?.k === 'fruit_tree' && ent.fruit) return pickFruit(s, ent, dry) // 果树有果先采摘
  const sl = selItem(s)
  if (!sl) return fail()
  const def = ITEMS[sl.id]
  if (ent && sl.id === 'chest_big' && ent.k === 'chest') return dry ? ok(tr('actions.upgradeBigChestContents')) : upgradeChest(s, ent, s.sel)
  if (def.tool) return def.tool === 'rod' ? fail() : useTool(s, def.tool, t, x, z, dry)
  if (def.crop) return plant(s, t, sl, dry)
  if (def.fert) return fertilize(s, t, sl, dry)
  if (def.place || def.tree) return place(s, t, sl, x, z, dry)
  if (def.food) return fail(tr('actions.pressEEat'))
  return fail()
}

// 14.3 拾取采集物：成功才给经验；不耗精力
function pickup(s: GameState, t: Tile, x: number, z: number, dry: boolean): R {
  const id = t.fo!
  if (room(s.inv, id) < 1) return fail(tr('common.backpackFull'))
  if (dry) return ok(tr('actions.pick2', ITEMS[id].name))
  addItem(s.inv, id, 0, 1)
  t.fo = undefined
  takeWild(s, x, z)
  noteFound(s, id)
  s.xp.foraging += id === 'herb' ? 4 : 3
  progress(s, { type: 'forage', item: id, n: 1, tags: ITEMS[id].tags, region: s.region })
  return ok(`+1 ${ITEMS[id].name}`)
}

function useTool(s: GameState, tool: ToolId, t: Tile, x: number, z: number, dry: boolean): R {
  const lv = s.tools[tool]
  const name = TOOLS[tool].name
  if (tool === 'can' && (t.g === 2 || buildingAt(s, x, z)?.act === 'well')) return refill(s, dry)
  if (t.ent) {
    if (tool !== 'axe' && tool !== 'pick') return fail()
    const list = entsOf(s)
    const e = list.find((e) => e.id === t.ent)!
    if (e.top) { // 先收桌面上的小物件
      if (room(s.inv, e.top) < 1) return fail(tr('common.backpackFull'))
      if (dry) return ok(tr('actions.takeBack', ITEMS[e.top].name))
      addItem(s.inv, e.top, 0, 1)
      const name = ITEMS[e.top].name
      e.top = undefined
      touchRoom()
      return ok(`+1 ${name}`)
    }
    if (e.k === 'fruit_tree') return treeMature(e) ? fail(tr('actions.fruitTreeStandNext')) : removeSapling(s, t, e, dry)
    if (e.k === 'wild_tree') return removeSapling(s, t, e, dry)
    if (e.job || e.done?.length) return fail(e.done?.length || absMin(s) >= e.job!.doneAt ? tr('actions.collectProductFirst') : tr('actions.machineRunningCantRemove'))
    if (e.store?.some(Boolean)) return fail(tr('actions.emptyFirst'))
    if (room(s.inv, e.k) < 1) return fail(tr('common.backpackFull'))
    if (dry) return ok(tr('actions.remove', ITEMS[e.k].name))
    list.splice(list.indexOf(e), 1)
    touchRoom()
    const [fw, fd] = footOf(e.k)
    for (let j = e.z; j < e.z + fd; j++) for (let i = e.x; i < e.x + fw; i++) { const c = tileAt(s, i, j); if (c?.ent === e.id) { c.ent = 0; c.gate = undefined } }
    t.ent = 0
    t.gate = undefined
    addItem(s.inv, e.k, 0, 1)
    return ok(`+1 ${ITEMS[e.k].name}`)
  }
  // 水管与木/石路：用镐拆回
  if ((t.pipe || t.path) && tool === 'pick' && !t.crop) {
    const id = t.pipe ? 'pipe' : t.path === 2 ? 'path_stone' : 'path_wood'
    if (room(s.inv, id) < 1) return fail(tr('common.backpackFull'))
    if (dry) return ok(tr('actions.remove', ITEMS[id].name))
    if (t.pipe) t.pipe = undefined
    else t.path = undefined
    addItem(s.inv, id, 0, 1)
    return ok(`+1 ${ITEMS[id].name}`)
  }
  if (t.ob) {
    const kind = t.ob.k
    const o = OBSTACLES[kind]
    if (o.tool !== tool) return fail(tr('actions.use', o.name, TOOLS[o.tool].name))
    if (lv < o.minLevel) return fail(tr('actions.needs', o.name, TOOL_TIER[o.minLevel], name))
    const c = energyCost(s, tool)
    if (s.energy < c) return fail(tr('common.notEnoughEnergy'))
    const last = t.ob.dmg + 1 >= o.hits[lv]
    const [drop, n] = o.drop
    if (last && room(s.inv, drop) < n) return fail(tr('common.backpackFull'))
    if (dry) return ok(tr('actions.energy', name, o.name, c))
    spend(s, c)
    if (!last) { t.ob.dmg++; return ok() }
    const sp = t.ob.sp ?? treeSpecies(s.region, x, z)
    addItem(s.inv, drop, 0, n)
    noteFound(s, drop)
    const gains = [`+${n} ${ITEMS[drop].name}`]
    if (kind === 'weed' && s.region === 'farm' && s.silo < siloCap(s)) { s.silo++; gains.push(tr('actions.n1HaySilo')) }
    const bonus = OBSTACLE_BONUS[kind]
    if (bonus && rand(s.seed, s.day, x, z, s.region.length, 77) < bonus[2] && ITEMS[bonus[0]] && addItem(s.inv, bonus[0], 0, bonus[1])) {
      noteFound(s, bonus[0])
      gains.push(`+${bonus[1]} ${ITEMS[bonus[0]].name}`)
    }
    if (kind === 'tree' && rand(s.seed, s.day, x, z, 78) < TREE_SEED_CHANCE && addItem(s.inv, 'seed_' + sp, 0, 1)) {
      noteFound(s, 'seed_' + sp)
      gains.push(`+1 ${ITEMS['seed_' + sp].name}`)
    }
    if (o.xp) s.xp[o.xp[0]] += o.xp[1]
    progress(s, { type: tool === 'scythe' ? 'cut' : tool === 'pick' ? 'break' : 'chop', n: 1, item: drop, region: s.region })
    if (s.region === 'farm') t.ob = o.next ? { k: o.next, dmg: 0, ...(kind === 'tree' ? { sp } : {}) } : null
    else {
      // 野外：树 7 日后再生，其余当日不再出现
      const wasOpen = mineRevealed(s)
      t.ob = null
      if (kind === 'tree' || kind === 'hardtree') fellWild(s, x, z)
      else takeWild(s, x, z)
      if (s.region === 'mine' && !wasOpen && mineRevealed(s)) gains.push(kind === 'exit' ? tr('common.rockCrumblesRevealingLadder') : tr('common.windWhistlesDistanceWay'))
    }
    return ok(gains.join(' · '))
  }
  if (t.crop?.dead) {
    if (tool !== 'scythe') return fail(tr('actions.witheredCropClearScythe'))
    if (dry) return ok(tr('actions.clearWitheredCrop'))
    t.crop = null
    t.fert = 0
    return ok()
  }
  if (tool === 'hoe') {
    if (s.region !== 'farm' || t.g !== 0 || buildingAt(s, x, z) || t.path) return fail(tr('actions.cantTill'))
    if (onCoopSite(x, z)) return fail(tr('actions.coopPlotCantTill'))
    if (t.till) return fail()
    const c = energyCost(s, tool)
    if (s.energy < c) return fail(tr('common.notEnoughEnergy'))
    if (dry) return ok(tr('actions.tillEnergy2', c))
    spend(s, c)
    t.till = true
    progress(s, { type: 'till', n: 1 })
    if (!t.gh && weatherWaters(weather(s.seed, s.day), season(s.day))) { // 雨天全天露天田地视为已浇水（5.3），也算一次有效浇水；温室隔雨
      t.wet = s.day
      progress(s, { type: 'water', n: 1 })
    }
    return ok()
  }
  if (tool === 'can') {
    if (!t.till) return fail()
    if (t.wet >= s.day) return fail(tr('actions.alreadyWatered')) // 重复浇水不耗水和精力
    if (s.water <= 0) return fail(tr('actions.wateringEmptyRefillWell'))
    const c = energyCost(s, tool)
    if (s.energy < c) return fail(tr('common.notEnoughEnergy'))
    if (dry) return ok(tr('actions.waterEnergyWaterLeft', c, s.water))
    spend(s, c)
    s.water--
    t.wet = t.fert === 2 ? s.day + 1 : s.day // 保水肥：浇水后第二天仍有效（9.4）
    progress(s, { type: 'water', n: 1 })
    return ok()
  }
  return fail()
}

// 在井、池塘或河边补水，不耗金币，动作约 1.2 秒（9.2）
export function refill(s: GameState, dry = false): R {
  const cap = CAN_CAPACITY[s.tools.can]
  if (s.water >= cap) return fail(tr('actions.wateringFull'))
  if (!dry) s.water = cap
  return { ok: true, msg: dry ? tr('actions.refill') : tr('actions.wateringRefilled'), dur: 1.2 }
}

// 悬停信息
export function describe(s: GameState, x: number, z: number): string {
  const t = tileAt(s, x, z)
  if (!t) return ''
  const b = buildingAt(s, x, z)
  if (b) return b.name
  if (t.fo) return tr('actions.pick', ITEMS[t.fo].name)
  if (t.g === 2) return s.region === 'farm' ? tr('actions.pondRefill') : tr('actions.waterRefillFish')
  if (t.ob) {
    const o = OBSTACLES[t.ob.k]
    return tr('actions.paren', o.name, TOOLS[o.tool].name)
  }
  if (t.ent) {
    const e = entsOf(s).find((e) => e.id === t.ent)!
    if (!MACHINES[e.k]) return describeEnt(s, e)
    const left = e.job ? e.job.doneAt - absMin(s) : 0
    return tr('fmt.labelValue', ITEMS[e.k].name, !e.job ? tr('actions.idleFLoad') : left <= 0 ? tr('actions.doneFCollect') : tr('actions.hLeft', Math.floor(left / 60), left % 60))
  }
  if (t.gh && !t.crop && !t.till) return tr('actions.greenhouseSoilSeasonNeeds')
  const wet = t.wet >= s.day ? tr('actions.watered') : tr('actions.dry')
  const fert = t.fert === 2 ? tr('actions.waterRetainingFertilizer') : t.fert ? tr('actions.qualityFertilizer') : ''
  if (t.crop) {
    const c = t.crop
    const cd = CROPS[c.cid]
    if (c.dead) return tr('actions.withered', cd.name)
    if (isMature(c)) return tr('actions.readyHarvest', cd.name)
    const need = c.harvests ? cd.regrowDays : cd.growthDays
    return tr('actions.days', cd.name, c.prog, need, wet, fert, c.dry ? tr('actions.unwatered', c.dry) : '')
  }
  return t.till ? tr('actions.tilledSoil', wet, fert) : ''
}

// 9.4 品质：以世界种子+作物实例+收获序号确定，重载不变
export function cropQuality(s: GameState, c: { id: number; harvests: number }, fert: number, x: number, z: number) {
  const L = level(s.xp.farming)
  const elite = 0.02 + 0.0075 * L + 0.04 * fert
  let good = 0.05 + 0.015 * L + 0.08 * fert
  const guarded = s.ents.some((e) => e.k === 'scarecrow' && Math.abs(e.x - x) <= 4 && Math.abs(e.z - z) <= 4)
  if (s.diff > 0 && !guarded) good = Math.max(0, good - 0.05)
  const r = rand(s.seed, c.id, c.harvests, 3)
  return r < elite ? 2 : r < elite + good ? 1 : 0
}

function harvest(s: GameState, t: Tile, x: number, z: number, dry: boolean): R {
  const c = t.crop!
  const cd = CROPS[c.cid]
  const q = cropQuality(s, c, t.fert === 1 ? 1 : 0, x, z)
  if (room(s.inv, cd.id, q) < 1) return fail(tr('actions.backpackFullCantHarvest')) // 先算容量，不改作物状态
  if (dry) return ok(tr('actions.harvest', cd.name))
  addItem(s.inv, cd.id, q, 1)
  noteFound(s, cd.id)
  progress(s, { type: 'harvest', crop: cd.id, item: cd.id, n: 1, tags: ITEMS[cd.id].tags })
  s.xp.farming += cd.growthDays >= 10 ? 8 : 4
  if (cd.regrowDays) { c.harvests++; c.prog = 0 } else { t.crop = null; t.fert = 0 }
  return ok(`+1 ${itemName({ id: cd.id, q, n: 1 })}`)
}

// 9.1 播种预览与日结使用同一规则：之间每一天都必须是合法季节
export function plantForecast(cid: string, day: number) {
  const cd = CROPS[cid]
  const md = day + cd.growthDays
  for (let d = day + 1; d <= md; d++) if (!cd.seasons.includes(season(d))) return null
  return md
}

function plant(s: GameState, t: Tile, sl: Slot, dry: boolean): R {
  const cd = CROPS[ITEMS[sl.id].crop!]
  if (s.region !== 'farm' || !t.till) return fail(tr('actions.tillSoilFirst'))
  if (t.crop) return fail()
  const se = season(s.day)
  if (!t.gh && !cd.seasons.includes(se)) return fail(tr('actions.cantPlanted', cd.name, SEASON_NAMES[se]))
  if (dry) {
    const md = t.gh ? s.day + cd.growthDays : plantForecast(cd.id, s.day)
    return ok(md ? tr('actions.plantReadyIfKept', cd.name, dateName(md)) : tr('actions.plantWontRipenBefore', cd.name))
  }
  takeOne(s, sl)
  t.crop = { id: s.nextId++, cid: cd.id, prog: 0, harvests: 0, dry: 0, dead: false }
  progress(s, { type: 'plant', crop: cd.id, n: 1 })
  return ok()
}

function fertilize(s: GameState, t: Tile, sl: Slot, dry: boolean): R {
  if (s.region !== 'farm' || !t.till) return fail(tr('actions.tillSoilFirst'))
  if (t.crop) return fail(tr('actions.fertilizeBeforePlanting'))
  if (t.fert) return fail(tr('actions.alreadyFertilizedKindPer'))
  if (dry) return ok(tr('actions.apply', ITEMS[sl.id].name))
  takeOne(s, sl)
  t.fert = sl.id === 'fert_water' ? 2 : 1
  return ok()
}
function removeSapling(s: GameState, t: Tile, e: Ent, dry: boolean): R {
  const id = (e.k === 'wild_tree' ? 'seed_' : 'sapling_') + e.tree
  if (room(s.inv, id) < 1) return fail(tr('common.backpackFull'))
  if (dry) return ok(tr('actions.dig', ITEMS[id].name))
  s.ents = s.ents.filter((x) => x !== e)
  t.ent = 0
  addItem(s.inv, id, 0, 1)
  return ok(`+1 ${ITEMS[id].name}`)
}

// 只能放在室外农场的东西（地里的、要水的、要阳光的）
const FARM_ONLY = new Set(['wild_tree', 'pipe', 'path_wood', 'path_stone', 'crab_pot', 'sprinkler', 'sprinkler_plus', 'water_tank', 'fence_wood', 'gate_wood', 'beehive', 'scarecrow', 'campfire', 'auto_hopper', 'auto_collector', 'torch'])
// 家具与装饰：多格占地；桌面小物件可摆在桌子、矮柜上；挂件贴北墙或西墙；地毯不挡路
function placeDecor(s: GameState, t: Tile, sl: Slot, x: number, z: number, dry: boolean, d: DecorDef): R {
  const farm = s.region === 'farm'
  if (!farm && !ownedRoom(s.region)) return fail(tr('actions.onlyFarmInsideOwn'))
  if (d.where === 'in' && farm) return fail(tr('actions.goesIndoors', d.name))
  if (d.where === 'out' && !farm) return fail(tr('actions.goesFarm', d.name))
  if (t.ent && d.on === 'top') {
    const host = entsOf(s).find((e) => e.id === t.ent)
    if (!host || !(host.k in SURFACES) || host.top) return fail(tr('actions.noRoom'))
    if (dry) return ok(tr('actions.put', d.name, ITEMS[host.k].name))
    takeOne(s, sl)
    host.top = d.id
    touchRoom()
    progress(s, { type: 'place', item: d.id })
    return ok()
  }
  const r = regionOf(s)
  const door = r.exits[0]
  const [fw, fd] = d.foot
  for (let j = z; j < z + fd; j++) for (let i = x; i < x + fw; i++) {
    const c = tileAt(s, i, j)
    if (!c || c.ent || buildingAt(s, i, j)) return fail(tr('actions.noRoom'))
    if (farm ? c.g !== 0 || c.till || !!c.ob || !!c.path || onCoopSite(i, j)
      : c.g === WALL_IN || (!!door && i === door.x0 && Math.abs(j - door.z0) <= 1) || r.decor.some((o) => (o.solid || o.m === 'pet_bed') && Math.floor(o.x) === i && Math.floor(o.z) === j)) return fail(tr('actions.noRoom'))
    if (!d.flat && d.on !== 'wall' && Math.abs(i + 0.5 - s.x) < 0.8 && Math.abs(j + 0.5 - s.z) < 0.8) return fail(tr('actions.stepWayFirst'))
  }
  if (d.on === 'wall' && !WALL_SIDES.some(([a, b]) => r.ground(x + a, z + b) === WALL_IN)) return fail(tr('actions.wallDecorMustGo'))
  if (dry) return ok(tr('actions.place', d.name))
  takeOne(s, sl)
  const e: Ent = { id: s.nextId++, k: d.id, x, z, job: null }
  entsOf(s).push(e)
  if (farm) for (let j = z; j < z + fd; j++) for (let i = x; i < x + fw; i++) { const c = tileAt(s, i, j)!; c.ent = e.id; if (d.flat) c.gate = 2 }
  touchRoom()
  progress(s, { type: 'place', item: d.id })
  return ok()
}
function place(s: GameState, t: Tile, sl: Slot, x: number, z: number, dry: boolean): R {
  const def = ITEMS[sl.id]
  const k = def.place!
  if (DECOR_BY_ID[k]) return placeDecor(s, t, sl, x, z, dry, DECOR_BY_ID[k])
  // 自己的室内（家、小屋、作坊、禽舍、畜棚）可以摆家具、机器和箱子
  if (s.region !== 'farm') {
    if (!ownedRoom(s.region)) return fail(tr('actions.onlyFarmInsideOwn2'))
    if (def.tree || FARM_ONLY.has(k)) return fail(tr('actions.goesOutdoors'))
    const r = regionOf(s)
    const [dx, dz] = [r.exits[0]?.x0, r.exits[0]?.z0]
    if (t.g === 8 || t.ent || buildingAt(s, x, z) || (x === dx && Math.abs(z - dz) <= 1)) return fail(tr('actions.cantPlace'))
    if (Math.abs(x + 0.5 - s.x) < 0.8 && Math.abs(z + 0.5 - s.z) < 0.8) return fail(tr('actions.stepWayFirst'))
    if (r.decor.some((d) => d.solid && Math.floor(d.x) === x && Math.floor(d.z) === z)) return fail(tr('actions.theresAlreadyFurniture'))
    if (dry) return ok(tr('actions.place', def.name))
    takeOne(s, sl)
    const e: Ent = { id: s.nextId++, k, x, z, job: null }
    if (CHEST_SIZE[k]) e.store = Array(CHEST_SIZE[k]).fill(null)
    entsOf(s).push(e)
    touchRoom()
    progress(s, { type: 'place', item: def.id })
    return ok()
  }
  if (buildingAt(s, x, z)) return fail(tr('actions.cantPlace'))
  // 水管铺在道路、草地与耕地下面；木/石路铺在草地上；两者都不阻挡移动
  if (k === 'pipe') {
    if (t.pipe || t.g === 2 || t.ent) return fail(tr('actions.cantLayPipe'))
    if (dry) return ok(tr('actions.layPipe'))
    takeOne(s, sl)
    t.pipe = 1
    progress(s, { type: 'place', item: def.id })
    return ok()
  }
  if (k === 'path_wood' || k === 'path_stone') {
    if (t.g !== 0 || t.till || t.ob || t.ent || t.path) return fail(tr('actions.onlyBareGrass'))
    if (dry) return ok(tr('actions.lay', def.name))
    takeOne(s, sl)
    t.path = k === 'path_stone' ? 2 : 1
    progress(s, { type: 'place', item: def.id })
    return ok()
  }
  // 捕捞笼放在水边的水面上
  if (k === 'crab_pot') {
    if (t.g !== 2 || t.ent) return fail(tr('actions.crabPotsGoWater'))
    const shore = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => { const n = tileAt(s, x + dx, z + dz); return !!n && n.g !== 2 })
    if (!shore) return fail(tr('actions.mustGoWaterNext'))
  } else if (t.g !== 0 || t.till || t.ob || t.ent || t.path) return fail(tr('actions.cantPlace'))
  if (onCoopSite(x, z)) return fail(tr('actions.coopPlotCantPlace'))
  if (Math.abs(x + 0.5 - s.x) < 0.8 && Math.abs(z + 0.5 - s.z) < 0.8) return fail(tr('actions.stepWayFirst'))
  if ((def.tree || def.sp) && !treeSpotOk(s, x, z)) return fail(tr('actions.saplingsNeedClear3'))
  if (def.sp && (t.till || t.g !== 0)) return fail(tr('actions.treeSeedsGoGrass'))
  if (dry) return ok(def.tree || def.sp ? tr('actions.plant', def.name) : tr('actions.place2', def.name))
  takeOne(s, sl)
  const e: Ent = { id: s.nextId++, k: def.tree ? 'fruit_tree' : k, x, z, job: null }
  if (def.tree) Object.assign(e, { tree: def.tree, planted: s.day, grown: 0, fruit: 0 })
  if (def.sp) Object.assign(e, { tree: def.sp, planted: s.day, grown: 0 })
  if (CHEST_SIZE[k]) e.store = Array(CHEST_SIZE[k]).fill(null)
  s.ents.push(e)
  t.ent = e.id
  if (k === 'gate_wood') t.gate = 1
  progress(s, { type: 'place', item: def.id })
  return ok()
}

export function foodOf(sl: Slot | null) {
  return sl ? ITEMS[sl.id].food : undefined
}
// 背包里的衣物按 E 收进衣柜（见 wardrobe.ts）
export function eat(s: GameState, idx: number): R {
  const sl = s.inv[idx]
  const def = sl ? ITEMS[sl.id] : undefined
  if (def?.wear) return storeWear(s, idx)
  // 药品：饱食满时也能用；生命药每游戏 10 分钟最多一份（6.2）；解毒药去除中毒
  if (sl && def && def.med !== undefined) {
    const heal = def.med
    if (def.cure && !hasStatus(s, def.cure) && (!heal || s.hp >= maxHpOf(s))) return fail(def.cure === 'poison' ? tr('actions.notPoisoned') : tr('actions.notSlowed'))
    if (!def.cure && s.hp >= maxHpOf(s)) return fail(tr('actions.healthFull'))
    if (heal && s.medAt !== undefined && absMin(s) - s.medAt < 10) return fail(tr('actions.lastDoseStillWorking'))
    if (heal) { s.hp = Math.min(maxHpOf(s), s.hp + heal); s.medAt = absMin(s) }
    if (def.cure) cure(s, def.cure)
    takeOne(s, sl)
    return ok(tr('actions.used', def.name, heal ? tr('actions.health', heal) : tr('actions.ailmentsCured')))
  }
  const f = foodOf(sl)
  if (!sl || !f) return fail(tr('actions.cantEat'))
  if (s.satiety >= 95) return fail(tr('actions.alreadyFull')) // 6.2
  if (def!.buff) addBuff(s, def!.buff) // 先加增益：临时上限当即生效
  s.energy = Math.min(maxEnergyOf(s), s.energy + f[0])
  s.hp = Math.min(maxHpOf(s), s.hp + f[1])
  s.satiety = Math.min(100, s.satiety + f[2])
  if (def!.cure) cure(s, def!.cure)
  takeOne(s, sl)
  progress(s, { type: 'eat', item: sl.id, n: 1 })
  const BUFF_TEXT: Record<string, string> = { labor: tr('actions.workEnergy10'), cold: tr('actions.slowerWarmthLoss'), maxEnergy: tr('actions.maxEnergy20'), gift: tr('actions.firstGiftToday5'), maxHp: tr('actions.maxHealth10'), pickup: tr('actions.pickupRange20'), damage: tr('actions.combatDamage10'), feast: tr('actions.energyUse10Max') }
  return ok(tr('actions.ateEnergyFullness', itemName(sl), f[0], f[2], def!.buff ? ' · ' + BUFF_TEXT[def!.buff.fx] : ''))
}

// F 键：身边最近的可交互对象（建筑交互点、机器、居民、动物）
export type Target = { kind: Act; name: string; home?: number; project?: string; enter?: string; shop?: string } | { kind: 'ent'; name: string; ent: Ent }
  | { kind: 'npc'; name: string; npc: string } | { kind: 'animal'; name: string; animal: number }
export interface Near { kind: 'npc' | 'animal'; id: string | number; name: string; x: number; z: number }
export function interactTarget(s: GameState, near: Near[] = []): Target | null {
  let best: Target | null = null
  let bd = 1.0
  for (const b of regionOf(s).buildings) {
    if (!b.act) continue
    const d = Math.hypot(Math.max(b.x - s.x, 0, s.x - b.x - b.w), Math.max(b.z - s.z, 0, s.z - b.z - b.d))
    if (d <= bd) { bd = d; best = { kind: b.act, name: b.name, home: b.home, project: b.project, enter: b.enter, shop: b.shop } }
  }
  for (const e of entsOf(s)) {
    const d = Math.hypot(e.x + 0.5 - s.x, e.z + 0.5 - s.z) - 0.5
    if (INTERACTIVE(e) && d <= bd) { bd = d; best = { kind: 'ent', name: describeEnt(s, e), ent: e } }
  }
  for (const n of near) {
    const d = Math.hypot(n.x - s.x, n.z - s.z) - 0.3
    if (d <= Math.max(bd, n.kind === 'npc' ? 1.2 : 0.9)) {
      bd = d
      best = n.kind === 'npc' ? { kind: 'npc', name: n.name, npc: n.id as string } : { kind: 'animal', name: n.name, animal: n.id as number }
    }
  }
  return best
}

// F 键能交互的放置物
export const INTERACTIVE = (e: Ent) => !!MACHINES[e.k] || !!e.store || e.k in SPRINKLER_RANGE || ['fruit_tree', 'campfire', 'crab_pot', 'beehive', 'gate_wood'].includes(e.k)
// 放置物的 F 交互（机器与箱子打开面板，其余直接执行）
export function entAction(s: GameState, e: Ent): R | 'machine' | 'chest' | 'tree' | 'fire' {
  if (MACHINES[e.k]) return 'machine'
  if (e.store) return 'chest'
  if (e.k === 'fruit_tree') return 'tree'
  if (e.k === 'campfire') return 'fire'
  if (e.k in SPRINKLER_RANGE) return runSprinkler(s, e)
  if (e.k === 'gate_wood') return toggleGate(s, e)
  if (e.k === 'crab_pot' || e.k === 'beehive') return e.job && jobDone(s, e) ? machineCollect(s, e) : e.k === 'crab_pot' ? baitPot(s, e) : fail(tr('actions.stillMakingHoney'))
  return fail()
}
export { chestMove, fireLit, fuelFire, runHoppers }
export const cutFruitTree = (s: GameState, e: Ent): R => {
  if (e.k !== 'fruit_tree') return fail()
  s.ents = s.ents.filter((x) => x !== e)
  s.tiles[e.z * FARM_W + e.x].ent = 0
  if (!addItem(s.inv, 'wood', 0, 6)) return ok(tr('actions.choppedDownFruitTree2'))
  return ok(tr('actions.choppedDownFruitTree'))
}

// ---------- 出货箱：睡前可撤回，日结时结算 ----------
export function shipPut(s: GameState, idx: number): R {
  const sl = s.inv[idx]
  if (!sl) return fail()
  if (!ITEMS[sl.id].sell) return fail(tr('actions.itemCantSold'))
  const same = s.ship.find((x) => x.id === sl.id && x.q === sl.q && !!x.b === !!sl.b)
  if (same) same.n += sl.n
  else s.ship.push({ ...sl })
  s.inv[idx] = null
  return ok()
}
export function shipTake(s: GameState, i: number): R {
  const sl = s.ship[i]
  if (!sl || !addItem(s.inv, sl.id, sl.q, sl.n, sl.b ? 1 : 0)) return fail(tr('common.notEnoughRoomBackpack'))
  s.ship.splice(i, 1)
  return ok()
}
export const shipValue = (s: GameState) => s.ship.reduce((a, sl) => a + price(sl) * sl.n, 0)

export function sell(s: GameState, idx: number, n: number): R {
  const sl = s.inv[idx]
  if (!sl || !ITEMS[sl.id].sell) return fail(tr('actions.itemCantSold'))
  n = Math.min(n, sl.n)
  const gain = price(sl) * n
  s.money += gain
  sl.n -= n
  if (!sl.n) s.inv[idx] = null
  return ok(tr('actions.soldG', itemName(sl), n, gain))
}
export function nextBagUpgrade(s: GameState) {
  return BAG_UPGRADES.find((u) => u.size > bagSize(s))
}
export function upgradeBag(s: GameState): R {
  const u = nextBagUpgrade(s)
  if (!u) return fail(tr('actions.backpackAlreadyMaxSize'))
  if (s.money < u.price) return fail(tr('common.notEnoughMoney'))
  s.money -= u.price
  applyUnlock(s, 'bag:' + u.size)
  return ok(tr('actions.backpackExpandedSlots', u.size))
}

// 6.3 救济清汤
export function claimSoup(s: GameState): R {
  if (s.min < KITCHEN_HOURS.open || s.min >= KITCHEN_HOURS.close) return fail(tr('common.dinerHours1000'))
  // Q05“一顿热饭”进行中时照常发（晚于第 14 天才接到的玩家也能完成，不锁死后续委托）
  if (s.day > 14 && !(s.satiety < 20 && s.money < 100) && s.quests.Q05?.st !== 'active') return fail(tr('actions.reliefBrothHandedDuring'))
  if (s.soupDay === s.day) return fail(tr('actions.youveAlreadyTodaysBroth'))
  if (count(s.inv, 'soup_relief')) return fail(tr('actions.stillBrothHavent'))
  if (!addItem(s.inv, 'soup_relief', 0, 1)) return fail(tr('common.backpackFull'))
  s.soupDay = s.day
  noteFound(s, 'soup_relief')
  progress(s, { type: 'interact', target: 'kitchen' })
  return ok(tr('actions.gotClearBrothSelect'))
}

// ---------- 制作 ----------
export function recipeLocked(s: GameState, i: number) {
  const r = RECIPES[i]
  if (r.unlock && !unlocked(s, r.unlock)) return tr('actions.notLearnedYet')
  if (r.flag && !s.flags.includes(r.flag)) return tr('actions.notLearnedYet')
  if (r.skill && level(s.xp[r.skill]) < (r.level ?? 0)) return tr('actions.needsLv', SKILL_NAMES[r.skill], r.level)
  if (r.friend && (!s.friends[r.friend[0]] || s.friends[r.friend[0]].pts < r.friend[1])) return r.friend[1] ? tr('actions.needsFriendship', NPC_NAME[r.friend[0]] ?? r.friend[0], r.friend[1]) : tr('actions.meetFirst', NPC_NAME[r.friend[0]] ?? r.friend[0])
  return ''
}
const NPC_NAME: Record<string, string> = { xiahe: tr('actions.xiaHe'), yelan: tr('actions.yeLan'), lintang: tr('actions.linTang'), laotao: tr('actions.oldTao'), shenzhou: tr('actions.shenZhou') }
export function craft(s: GameState, i: number, at = ''): R {
  const r = RECIPES[i]
  const locked = recipeLocked(s, i)
  if (locked) return fail(locked)
  if (r.at && r.at !== at) return fail(tr('actions.mustMadePublicKitchen'))
  for (const [spec, n] of Object.entries(r.cost)) if (countSpec(s.inv, spec) < n) return fail(tr('common.notEnough', specName(spec)))
  const done = tx(s, (inv) => Object.entries(r.cost).every(([spec, n]) => !!removeSpec(inv, spec, n)) && addItem(inv, r.out, 0, r.n))
  if (!done) return fail(tr('common.backpackFull'))
  noteFound(s, r.out)
  if (r.min) s.min = Math.min(DAY_END - 1, s.min + r.min)
  progress(s, { type: 'craft', item: r.out, n: r.n })
  const made = [ITEMS[r.out].name, r.n > 1 ? '×' + r.n : '', r.min ? tr('actions.tookMin', r.min) : '']
  return ok(r.at ? tr('actions.cooked', ...made) : tr('actions.crafted', ...made))
}

// ---------- 机器（12.1）：按绝对游戏分钟推进，睡眠也推进；投料与任务创建同一事务 ----------
// 有成品可取（队列里做完的，或当前这批已完成）
export const jobDone = (s: GameState, e: Ent) => !!e.done?.length || (!!e.job && absMin(s) >= e.job.doneAt)
export const jobBusy = (s: GameState, e: Ent) => !!e.job && absMin(s) < e.job.doneAt
// ---------- 跨夜队列（§32.1）：一台机器连当前一批最多 20 批；原料预约时就扣除，撤销未开始的部分全额退回 ----------
export const MAX_BATCHES = 20
export const batches = (e: Ent) => (e.job ? 1 : 0) + (e.queue?.length ?? 0)
const keepOut = (e: Ent, o: Slot) => {
  const d = (e.done ??= [])
  const same = d.find((x) => x.id === o.id && x.q === o.q)
  if (same) same.n += o.n
  else d.push({ ...o })
}
// 前一批做完就从完成时刻接着做下一批（不早于这批的预约时刻）；成品攒在 done 里
export function advanceMachine(s: GameState, e: Ent) {
  const now = absMin(s)
  while (e.queue?.length && (!e.job || now >= e.job.doneAt)) {
    let start = now
    if (e.job) { keepOut(e, e.job.out); start = e.job.doneAt }
    const b = e.queue.shift()!
    e.job = { doneAt: Math.max(start, b.at) + b.min, out: b.out, input: b.input }
  }
  if (e.queue && !e.queue.length) delete e.queue
}
export function advanceAll(s: GameState) {
  for (const e of s.ents) if (e.queue) advanceMachine(s, e)
  for (const list of Object.values(s.rooms ?? {})) for (const e of list) if (e.queue) advanceMachine(s, e)
}
// 加一批：机器空着就马上开工，否则排进队列
export function addBatch(s: GameState, e: Ent, min: number, out: Slot, input: Slot[]) {
  advanceMachine(s, e)
  const now = absMin(s)
  if (!e.job) e.job = { doneAt: now + min, out, input }
  else (e.queue ??= []).push({ at: now, min, out, input })
}
// 已解锁的配方（如合金需要 Q19 后的配方）
export const machineRecipes = (s: GameState, k: string) => (MACHINES[k]?.recipes ?? []).filter((r) => !r.unlock || unlocked(s, r.unlock))
// 第一种输入是可变品种（如“任意蔬菜”）时，背包里可选的具体物品
export function recipeChoices(s: GameState, r: MachineRecipe): string[] {
  const [spec, n] = r.in[0]
  const ids = [...new Set(s.inv.filter((sl) => sl && specMatch(spec, sl.id) && (!r.q0 || sl.q === 0)).map((sl) => sl!.id))]
  return ids.filter((id) => s.inv.reduce((a, sl) => a + (sl?.id === id && (!r.q0 || sl.q === 0) ? sl.n : 0), 0) >= n)
}
// 成品：'*pickle' / '*jam' / '*seed' 按投入品种生成
const outOf = (r: MachineRecipe, src: string) => (r.out === '*pickle' ? 'pickle_' + src : r.out === '*jam' ? 'jam_' + src : r.out === '*seed' ? 'seed_' + src : r.out)
export function machineReady(s: GameState, e: Ent) {
  return machineRecipes(s, e.k).some((r) => recipeChoices(s, r).length && r.in.slice(1).every(([spec, n]) => countSpec(s.inv, spec) >= n))
}
// 投料：ri 为配方序号（默认第一个材料齐全的），pick 为第一种输入的具体品种（默认最便宜的）
export function machineInsert(s: GameState, e: Ent, ri?: number, pick?: string): R {
  const list = machineRecipes(s, e.k)
  if (!list.length) return fail()
  advanceMachine(s, e)
  if (batches(e) >= MAX_BATCHES) return fail(tr('actions.batchesQueued', MAX_BATCHES))
  const r = ri !== undefined ? list[ri] : list.find((x) => recipeChoices(s, x).length && x.in.slice(1).every(([spec, n]) => countSpec(s.inv, spec) >= n)) ?? list[0]
  if (!r) return fail()
  const choices = recipeChoices(s, r)
  const src = pick && choices.includes(pick) ? pick : choices.sort((a, b) => ITEMS[a].sell - ITEMS[b].sell)[0]
  if (!src) return fail(tr('actions.missingMaterials', specName(r.in[0][0]), r.in[0][1], r.q0 ? tr('actions.regularQuality') : ''))
  for (const [spec, n] of r.in.slice(1)) if (countSpec(s.inv, spec) < n) return fail(tr('common.missingMaterials', specName(spec), n))
  const out = outOf(r, src)
  if (!ITEMS[out]) return fail(tr('actions.cantProcessedWay'))
  const input: Slot[] = []
  const done = tx(s, (inv) => {
    // 第一种输入取选定品种（种子分离器只收普通品质，先扣低品质由 removeSpec 保证）
    let need = r.in[0][1]
    for (let i = 0; i < inv.length && need > 0; i++) {
      const sl = inv[i]
      if (!sl || sl.id !== src || (r.q0 && sl.q)) continue
      const k = Math.min(need, sl.n)
      sl.n -= k
      need -= k
      input.push({ id: sl.id, q: sl.q, n: k, ...(sl.b ? { b: 1 } : {}) })
      if (!sl.n) inv[i] = null
    }
    return need === 0 && r.in.slice(1).every(([spec, n]) => { const got = removeSpec(inv, spec, n); if (got) input.push(...got); return !!got })
  })
  if (!done) return fail()
  const queued = !!e.job
  addBatch(s, e, machineMinutes(s, e.k, r.min), { id: out, q: 0, n: r.n }, input)
  return ok(queued ? tr('actions.queuedBatch', batches(e), ITEMS[out].name) : tr('actions.started', MACHINES[e.k].verb, ITEMS[out].name))
}
const SPEC_NAMES: Record<string, string> = {
  '#veg': tr('actions.vegetable'), '#fish': tr('actions.fish'), '#fruit': tr('actions.fruit'), '#grain': tr('actions.grain'), '#dry': tr('actions.wildBerryMushroom'), '#crop': tr('actions.crop'),
  '#egg': tr('actions.eggDuckEgg'), '#honey': tr('common.honey'), '#dairy': tr('actions.cheese'), '#core': tr('actions.core'),
}
export const specName = (spec: string) => SPEC_NAMES[spec] ?? spec.split('|').map((id) => ITEMS[id]?.name ?? id).join(tr('actions.or'))
// 加工时长：风车转起来后（Q22）磨坊提速 20%（任务链路 §3.2）
export const machineMinutes = (s: GameState, k: string, min: number) => (k === 'mill' && s.flags.includes('windmill_turning') ? Math.round(min * 0.8) : min)
// 取出全部做好的成品（全部放得下才取）；队列里的下一批接着做
export function machineCollect(s: GameState, e: Ent): R {
  advanceMachine(s, e)
  const fin = !!e.job && absMin(s) >= e.job.doneAt
  const outs = [...(e.done ?? []), ...(fin ? [e.job!.out] : [])]
  if (!outs.length) return fail(tr('actions.notDoneYet'))
  if (!tx(s, (inv) => outs.every((o) => addItem(inv, o.id, o.q, o.n)))) return fail(tr('common.backpackFull'))
  delete e.done
  if (fin) e.job = null
  advanceMachine(s, e)
  for (const o of outs) { noteFound(s, o.id); progress(s, { type: 'machine', item: o.id, n: o.n }) }
  return ok(outs.map((o) => `+${o.n} ${itemName(o)}`).join(' '))
}
// 撤销还没做完的：正在做的这批与排队的批次，原料全额退回（已做好的成品不动）
export function machineCancel(s: GameState, e: Ent): R {
  advanceMachine(s, e)
  const running = jobBusy(s, e) ? e.job! : null
  const back = [...(running?.input ?? []), ...(e.queue ?? []).flatMap((b) => b.input)]
  if (!running && !e.queue?.length) return fail()
  if (!tx(s, (inv) => back.every((sl) => addItem(inv, sl.id, sl.q, sl.n, sl.b ? 1 : 0)))) return fail(tr('actions.notEnoughBackpackSpace'))
  const n = (running ? 1 : 0) + (e.queue?.length ?? 0)
  delete e.queue
  if (running) e.job = null
  return ok(n > 1 ? tr('actions.canceledMaterialsReturned', n) : tr('actions.canceledMaterialsReturned2'))
}

// ---------- 时间推进（现实秒 → 游戏分钟） ----------
const WARNINGS = [[1440, tr('actions.midnightTimeHeadHome')], [1500, tr('actions.n0100YoullCollapse')], [1540, tr('actions.n0140HurryHome')]] as const
export function tick(s: GameState, realDt: number) {
  const D = DIFFICULTY[s.diff]
  const dm = realDt * D.rate
  s.min = Math.min(DAY_END, s.min + dm)
  // 便携补给包：野外探索时饱食下降减缓 10%
  const pack = s.region !== 'farm' && s.region !== 'town' && count(s.inv, 'supply_pack') ? 0.9 : 1
  s.satiety = Math.max(0, s.satiety - (D.hunger / 60) * dm * pack)
  const msgs: string[] = climateStep(s, dm)
  if (Math.floor(s.min / 60) !== Math.floor((s.min - dm) / 60) && s.ents.some((e) => e.k === 'auto_hopper')) runHoppers(s)
  advanceAll(s)
  while (s.warned < WARNINGS.length && s.min >= WARNINGS[s.warned][0]) msgs.push(WARNINGS[s.warned++][1])
  return { msgs, passout: s.min >= DAY_END, down: s.hp <= 0 }
}

// ---------- 居民（设计 18.2）：每日首次完整交谈 +5 ----------
export function talk(s: GameState, npc: string): R {
  const f = friend(s, npc)
  const first = f.talked !== s.day
  if (first) {
    f.talked = s.day
    f.pts = Math.min(1000, f.pts + 5)
  }
  progress(s, { type: 'talk', npc })
  return ok()
}

// 关键道具：使用后永久生效并消耗（工具腰包、帆布背包等）
export function useKeyItem(s: GameState, idx: number): R {
  const sl = s.inv[idx]
  const eff = sl ? ITEMS[sl.id].effect : undefined
  if (!sl || !eff) return fail(tr('actions.itemCantUsedLike'))
  const [k, v] = eff.split(':')
  if (k === 'hotbar' && s.hotbar >= Number(v)) return fail(tr('actions.hotbarAlreadyExpanded'))
  if (k === 'bag' && bagSize(s) >= Number(v)) return fail(tr('actions.backpackAlreadyBigEnough'))
  takeOne(s, sl)
  applyUnlock(s, eff)
  return ok(k === 'hotbar' ? tr('actions.hotbarExpandedSlotsPress', v) : k === 'bag' ? tr('actions.backpackExpandedSlots', v) : tr('actions.used2', ITEMS[sl.id].name))
}

// 交付一个指定任务（对话里按钮上写明的那个），避免一次点击把共用的交付物分给多个任务；at 为交付端点（居民、教学柜，或代收的委托柜）
export function deliverQuest(s: GameState, id: string, at: string): R {
  const r = submitQuest(s, id, at)
  return r === '' ? ok() : fail(r ?? tr('actions.cantTurnQuest'))
}
// 在居民或教学柜处交付已完成的任务
export function deliverQuests(s: GameState, at: string): R {
  const msgs: string[] = []
  let any = false
  for (const [id, st] of Object.entries(s.quests)) {
    if (st.st !== 'ready') continue
    const r = submitQuest(s, id, at)
    if (r === null) continue
    if (r) msgs.push(r)
    else any = true
  }
  return any ? ok() : msgs.length ? fail(msgs[0]) : fail()
}

// ---------- 蓄力范围作业（设计 11.1）：铜 1×3、铁 3×3、合金 3×5，只对有效格计耗 ----------
export const CHARGE_SIZE = [[1, 1], [1, 3], [3, 3], [3, 5]] as const // [横宽, 纵深]
export function chargeArea(s: GameState, level: number, dx: number, dz: number): [number, number][] {
  const [w, d] = CHARGE_SIZE[Math.min(level, 3)]
  const ox = Math.floor(s.x) + dx
  const oz = Math.floor(s.z) + dz
  const out: [number, number][] = []
  for (let f = 0; f < d; f++) for (let l = -(w - 1) / 2; l <= (w - 1) / 2; l++) {
    // dx/dz 为四向朝向；横向轴与其垂直
    out.push([ox + dx * f + (dz !== 0 ? l : 0), oz + dz * f + (dx !== 0 ? l : 0)])
  }
  return out
}
export function useArea(s: GameState, tool: 'hoe' | 'can', tiles: [number, number][], dry = false): R {
  const valid = tiles.filter(([x, z]) => {
    const t = tileAt(s, x, z)
    if (!t || buildingAt(s, x, z) || t.ob || t.ent) return false
    return tool === 'hoe' ? s.region === 'farm' && t.g === 0 && !t.till && !t.path && !onCoopSite(x, z) : t.till && t.wet < s.day
  })
  const n = tool === 'can' ? Math.min(valid.length, s.water) : valid.length
  if (!n) return fail(tool === 'can' && valid.length ? tr('actions.wateringEmptyRefillWell') : tr('actions.nothingWorkRange'))
  const c = Math.round(energyCost(s, tool) * n * 10) / 10
  if (s.energy < c) return fail(tr('actions.notEnoughEnergyNeed', c))
  if (dry) return ok(tool === 'hoe' ? tr('actions.tillEnergy', n, c) : tr('actions.waterEnergy', n, c))
  s.energy = Math.round((s.energy - c) * 10) / 10
  s.satiety = Math.max(0, s.satiety - 0.03 * n)
  const rain = weatherWaters(weather(s.seed, s.day), season(s.day))
  if (tool === 'hoe' && rain) progress(s, { type: 'water', n })
  for (const [x, z] of valid.slice(0, n)) {
    const t = tileAt(s, x, z)!
    if (tool === 'hoe') {
      t.till = true
      if (rain && !t.gh) t.wet = s.day
    } else t.wet = t.fert === 2 ? s.day + 1 : s.day
  }
  if (tool === 'can') s.water -= n
  progress(s, { type: tool === 'hoe' ? 'till' : 'water', n })
  return ok()
}

// ---------- 背包（设计 11.2）：前 hotbar 格即快捷栏一排，其后是背包格 ----------
// 交换任意两格（快捷栏与背包之间拖放）；同种物品可叠加时合并
export function swapSlots(s: GameState, i: number, j: number) {
  if (i === j || i < 0 || j < 0 || i >= s.inv.length || j >= s.inv.length) return
  const a = s.inv[i], b = s.inv[j]
  if (a && b && a.id === b.id && a.q === b.q && (a.b ?? 0) === (b.b ?? 0) && b.n < ITEMS[b.id].stack) {
    const k = Math.min(a.n, ITEMS[b.id].stack - b.n)
    b.n += k
    a.n -= k
    if (!a.n) s.inv[i] = null
    return
  }
  ;[s.inv[i], s.inv[j]] = [b, a]
}
// 整理背包（不动快捷栏一排）：合并零散堆叠，按类别、名称、品质排序
const CATEGORY = (id: string) => {
  const d = ITEMS[id]
  const t = d.tags ?? []
  return d.tool ? 0 : d.weapon ? 1 : d.crop ? 2 : t.includes('crop') ? 3 : t.includes('forage') ? 4 : t.includes('fish') ? 5 : t.includes('animal') ? 6
    : t.includes('cooked') || d.food ? 7 : d.med ? 8 : d.place ? 10 : t.includes('key') ? 11 : 9
}
export function sortBag(s: GameState) {
  const merged: Slot[] = []
  for (const sl of s.inv.slice(s.hotbar)) {
    if (!sl) continue
    let n = sl.n
    const stack = ITEMS[sl.id].stack
    for (const m of merged) if (n > 0 && m.id === sl.id && m.q === sl.q && (m.b ?? 0) === (sl.b ?? 0) && m.n < stack) { const k = Math.min(n, stack - m.n); m.n += k; n -= k }
    if (n > 0) merged.push({ ...sl, n })
  }
  merged.sort((a, b) => CATEGORY(a.id) - CATEGORY(b.id) || a.id.localeCompare(b.id) || b.q - a.q || (a.b ?? 0) - (b.b ?? 0))
  const size = bagSize(s)
  s.inv = [...s.inv.slice(0, s.hotbar), ...merged, ...Array(Math.max(0, size - merged.length)).fill(null)]
}
