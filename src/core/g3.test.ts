// G3 系统自检：四季采集与鱼、寒冷潮湿、负面状态、料理增益、装备、多配方机器。
import assert from 'node:assert/strict'
import { ITEMS, SEASON_DAYS } from '../content/content.ts'
import { eat, jobDone, machineCollect, machineInsert, machineRecipes, recipeChoices, tick } from './actions.ts'
import { addStatus, coldZone, equipItem, hasStatus, maxEnergyOf, unequip } from './climate.ts'
import { fishHere, weatherOk } from './fishing.ts'
import { enterMine, ladderDown, liftStops, moveTo } from './travel.ts'
import { attack, drawBow, fighterStep, foeStep, newArena, newFighter, releaseBow, spawnFoes } from './combat.ts'
import { mineFloor, MINE_W, GREENHOUSE_SITE } from './regions.ts'
import { demolish, orderBuilding, placeProblem, putHay, upgradeBuilding, upgradeHouse } from './buildings.ts'
import { buyAnimal, careAnimal, collectNest, toggleDoor } from './animals.ts'
import { chestMove, chestQuickStack, runHoppers, waterNetwork } from './placeables.ts'
import { endDay } from './settle.ts'
import { useAt, entAction, craft } from './actions.ts'
import { fundProject } from './town.ts'
import { RECIPES } from '../content/content.ts'
import { applyUnlock } from './quests.ts'
import { FOES, mineTheme } from '../content/content.ts'
import { addItem, migrate, newGame, regionOf, resetWildCache, tileAt, validState, type Ent, type GameState } from './state.ts'

const winterDay = SEASON_DAYS * 3 + 2
const fresh = (day = 1) => {
  const s = newGame('测试', '测试农场', 1, 4242)
  s.day = day
  s.settled = day - 1
  return s
}
const run = (s: GameState, min: number) => { for (let i = 0; i < min; i++) tick(s, 1) }

// 四季采集物：浅林的品种随季节变化
{
  const seen = (day: number) => {
    const s = fresh(day)
    resetWildCache()
    moveTo(s, 'forest', 24, 2)
    const r = regionOf(s)
    const out = new Set<string>()
    for (let z = 0; z < r.h; z++) for (let x = 0; x < r.w; x++) { const f = tileAt(s, x, z)?.fo; if (f) out.add(f) }
    return out
  }
  const autumn = seen(SEASON_DAYS * 2 + 3)
  assert.ok(autumn.has('wild_pear') || autumn.has('chestnut'), '秋季有野梨或板栗')
  assert.ok(!autumn.has('wild_greens'))
  const winter = seen(winterDay)
  assert.ok([...winter].every((id) => ['winter_root', 'snow_mushroom', 'herb'].includes(id)), '冬季只有冬季采集物')
}

// 24 种鱼：季节、地点与天气条件
{
  assert.ok(weatherOk('grey', 2, 3) && !weatherOk('grey', 0, 3), '阴雪')
  assert.ok(weatherOk('rain', 3, 1) && !weatherOk('rain', 2, 3), '雨含雷雨，不含雪')
  const s = fresh(SEASON_DAYS + 5) // 夏
  s.min = 13 * 60
  const ids = fishHere(s, 'river').map((f) => f.id)
  assert.ok(ids.includes('fish_redtail') && !ids.includes('fish_silverscale'), '夏季河岸')
  assert.equal(Object.keys(ITEMS).filter((id) => ITEMS[id].tags?.includes('fish')).length, 24)
}

// 寒冷：冬季室外无防寒衣会变冷；防寒衣抵消普通冬季寒冷；农场里不会冻伤
{
  const s = fresh(winterDay)
  s.seed = 1 // 选一个非暴雪日
  moveTo(s, 'river', 10, 13.9)
  assert.ok(coldZone(s))
  run(s, 300)
  assert.ok(s.warmth < 75, '冬季野外 300 分钟后变冷 ' + s.warmth)
  const hp0 = s.hp
  run(s, 600)
  assert.ok(s.warmth < 10 && s.hp < hp0, '保暖低于 10 会掉血')
  s.warmth = 100
  s.inv[20] = { id: 'winter_coat', q: 0, n: 1 }
  assert.ok(equipItem(s, 20).ok && s.equip.coat === 'winter_coat' && !s.inv[20])
  run(s, 200)
  assert.ok(s.warmth >= 99, '防寒衣抵消普通冬季寒冷')
  assert.ok(unequip(s, 'coat').ok && s.inv.some((sl) => sl?.id === 'winter_coat'))
  moveTo(s, 'farm', 24, 10)
  s.warmth = 40
  run(s, 2000)
  assert.ok(s.warmth >= 12, '农场里保暖不会降到冻伤')
  assert.ok(validState(s))
}

// 中毒：每 5 分钟 -1 HP，20 分钟后消退；解毒药去除
{
  const s = fresh(10)
  addStatus(s, 'poison')
  run(s, 10)
  assert.equal(s.hp, 98)
  addItem(s.inv, 'antidote', 0, 1)
  assert.ok(eat(s, s.inv.findIndex((sl) => sl?.id === 'antidote')).ok)
  assert.ok(!hasStatus(s, 'poison'))
  addStatus(s, 'slow')
  addStatus(s, 'poison')
  addStatus(s, 'poison')
  assert.equal(s.status.length, 2, '同种刷新时长不叠层')
}

// 料理增益：红薯焗饭临时最大精力 +20，不写入基础值，到时消失
{
  const s = fresh(10)
  s.satiety = 40
  addItem(s.inv, 'gratin_sweet_potato', 0, 1)
  assert.ok(eat(s, s.inv.findIndex((sl) => sl?.id === 'gratin_sweet_potato')).ok)
  assert.equal(maxEnergyOf(s), s.maxEnergy + 20)
  assert.equal(s.maxEnergy, 200)
  run(s, 181)
  assert.equal(maxEnergyOf(s), 200)
  assert.ok(s.energy <= 200)
}

// 多配方机器：腌渍缸按投入品种出同品种腌菜；种子分离器只收普通品质；熔炉炼铁
{
  const s = fresh(10)
  const ent = (k: string): Ent => { const e = { id: s.nextId++, k, x: 30, z: 30, job: null }; s.ents.push(e); return e }
  const jar = ent('pickle_jar')
  addItem(s.inv, 'spring_carrot', 0, 1)
  addItem(s.inv, 'spring_radish', 0, 1)
  assert.deepEqual(recipeChoices(s, machineRecipes(s, 'pickle_jar')[0]).sort(), ['spring_carrot', 'spring_radish'])
  assert.ok(machineInsert(s, jar, 0, 'spring_carrot').ok)
  assert.equal(jar.job!.out.id, 'pickle_spring_carrot')
  assert.equal(ITEMS.pickle_spring_carrot.sell, Math.floor(85 * 1.6 + 15))
  s.day += 1
  assert.ok(jobDone(s, jar) && machineCollect(s, jar).ok)
  const sm = ent('seed_maker')
  s.inv = s.inv.map((sl) => (sl?.id === 'spring_radish' || sl?.id === 'pickle_spring_carrot' ? null : sl))
  addItem(s.inv, 'summer_melon', 2, 1)
  assert.ok(!machineInsert(s, sm).ok, '精品作物不能分离种子')
  addItem(s.inv, 'summer_melon', 0, 1)
  assert.ok(machineInsert(s, sm).ok && sm.job!.out.id === 'seed_summer_melon')
  assert.equal(s.inv.filter((sl) => sl?.id === 'summer_melon' && sl.q === 2).length, 1, '精品保留')
  const fu = ent('furnace')
  addItem(s.inv, 'iron_ore', 0, 5)
  addItem(s.inv, 'coal', 0, 1)
  assert.ok(machineInsert(s, fu).ok && fu.job!.out.id === 'iron_bar')
  assert.equal(machineRecipes(s, 'furnace').length, 2, '合金配方需要解锁')
}

// 矿洞：三主题的敌人与矿脉；高阶岩块不挡出口；首领层
{
  for (const floor of [3, 8, 12, 17, 22, 28]) {
    const m = mineFloor(99, 3, floor)
    const theme = mineTheme(floor)
    assert.ok(m.foes.length && m.foes.every((f) => !FOES[f.k].boss), `第 ${floor} 层有普通敌人`)
    const kinds = new Set([...m.obs.values()])
    if (theme === 1) assert.ok(!kinds.has('crystal'))
    if (theme === 2) assert.ok(!kinds.has('copper'))
  }
  const b = mineFloor(1, 1, 20)
  assert.equal(b.boss, 'furnacebeast')
  assert.equal(b.foes[0].k, 'furnacebeast')
  assert.ok(mineFloor(1, 1, 30).obs.size >= 4, '深矿首领房有晶柱')
  void MINE_W
}

// 首领：击败后永久记录、首次奖励、升降梯停靠；预警区在延迟后才生效；防具减伤
{
  const s = fresh(20)
  applyUnlock(s, 'region:mine')
  s.deepest = 10
  assert.deepEqual(liftStops(s), [1, 5], '首领未击败不停 10 层')
  s.floor = 10
  s.region = 'mine'
  const foes = spawnFoes(s)
  assert.equal(foes.length, 1)
  const boss = foes[0]
  const ft = newFighter()
  const arena = newArena()
  s.x = boss.x; s.z = boss.z + 6
  let hurt = 0
  for (let i = 0; i < 30 * 20; i++) for (const e of foeStep(s, foes, ft, 1 / 30, arena)) if (e.k === 'hurt') hurt++
  assert.ok(hurt > 0 && s.hp < 100, '守门者会攻击或落石')
  // 预警区：延迟内不伤人
  const a2 = newArena()
  a2.zones.push({ x: s.x, z: s.z, r: 1, delay: 1.2, life: 0.3, dmg: 10, k: 'rock', tick: 0 })
  const hp = s.hp
  const ft2 = newFighter()
  for (let i = 0; i < 30; i++) foeStep(s, [], ft2, 1 / 30, a2)
  assert.equal(s.hp, hp, '预警期间不伤人')
  for (let i = 0; i < 12; i++) foeStep(s, [], ft2, 1 / 30, a2)
  assert.equal(s.hp, hp - 10, '落下时命中')
  s.equip.armor = 'armor_iron'
  a2.zones.push({ x: s.x, z: s.z, r: 1, delay: 0, life: 0.3, dmg: 10, k: 'rock', tick: 0 })
  ft2.invuln = 0
  foeStep(s, [], ft2, 1 / 30, a2)
  assert.equal(s.hp, hp - 10 - 5, '铁甲防御 5')
  // 击败首领
  s.hp = 100
  s.inv[3] = { id: 'sword_alloy', q: 0, n: 1 }
  s.sel = 3
  boss.hp = 1
  boss.st = 'stun'; boss.t = 99
  s.x = boss.x; s.z = boss.z + 1.2
  s.face = Math.atan2(boss.x - s.x, boss.z - s.z)
  const ft3 = newFighter()
  attack(ft3, s)
  let boss1 = false
  for (let i = 0; i < 30; i++) for (const e of fighterStep(s, ft3, foes, 1 / 30)) if (e.k === 'boss') boss1 = true
  assert.ok(boss1 && s.bosses[10] === s.day && s.unlocks.includes('mine:iron'))
  assert.ok(s.inv.some((sl) => sl?.id === 'copper_bar' && sl.n >= 5), '首次奖励铜锭 5')
  assert.deepEqual(liftStops(s), [1, 5, 10])
  assert.equal(spawnFoes(s).length, 0, '首领不再出现')
  assert.ok(ladderDown(s).ok && s.floor === 11)
  assert.ok(validState(s))
  // 轻弓：蓄力不足不放箭；满 0.7 秒放出箭矢
  s.inv[4] = { id: 'bow_iron', q: 0, n: 1 }
  s.sel = 4
  const ft4 = newFighter()
  const a4 = newArena()
  drawBow(ft4)
  fighterStep(s, ft4, [], 0.3)
  assert.equal(releaseBow(s, ft4, a4).length, 0)
  drawBow(ft4)
  fighterStep(s, ft4, [], 0.75)
  assert.equal(releaseBow(s, ft4, a4)[0]?.k, 'shoot')
  assert.equal(a4.shots[0].dmg, ITEMS.bow_iron.weapon)
  assert.ok(enterMine(s, 10).ok)
}

// ---------- 生产链与建筑 ----------
const nap = (s: GameState) => { s.energy = 200; endDay(s, false); s.region = 'farm' }
const rich = () => {
  const s = fresh(2)
  s.money = 200000
  s.inv = Array(8 + 48).fill(null)
  s.inv[0] = { id: 'tool_hoe', q: 0, n: 1 }; s.inv[1] = { id: 'tool_can', q: 0, n: 1 }; s.inv[3] = { id: 'tool_pick', q: 0, n: 1 }
  for (const [id, n] of [['wood', 999], ['stone', 999], ['copper_bar', 99], ['iron_bar', 99], ['hay', 200]] as const) addItem(s.inv, id, 0, n)
  applyUnlock(s, 'system:carpenter')
  applyUnlock(s, 'system:animals')
  return s
}
const clear = (s: GameState, x0: number, z0: number, w: number, d: number) => { for (let z = z0; z < z0 + d; z++) for (let x = x0; x < x0 + w; x++) { const t = s.tiles[z * 48 + x]; t.ob = null; t.crop = null; t.till = false } }
{
  // 选址：压到家宅不行；畜棚 2 天完工；一次只接一个私人工程
  const s = rich()
  assert.ok(placeProblem(s, 'barn', 20, 3), '不能压在家宅上')
  clear(s, 30, 22, 9, 12)
  assert.equal(placeProblem(s, 'barn', 31, 24), '')
  assert.ok(orderBuilding(s, 'barn', 31, 24).ok)
  assert.ok(!orderBuilding(s, 'silo', 40, 30).ok, '木工队一次一个')
  assert.ok(!buyAnimal(s, 'cow').ok, '畜棚还没建好')
  nap(s); nap(s)
  assert.ok(regionOf(s, 'farm').buildings.some((b) => b.id === 'barn'))
  // 牛：成年后每天产奶，要挤奶桶
  assert.ok(buyAnimal(s, 'cow').ok)
  assert.ok(!buyAnimal(s, 'goat').ok, '山羊要升级畜棚')
  const cow = s.animals[0]
  const barn = s.farmB[0]
  barn.hay = 30
  for (let d = 0; d < 7; d++) nap(s)
  assert.equal(cow.fed, 7)
  assert.equal(cow.eggs, 1, '成年当天产第一份奶')
  assert.ok(!careAnimal(s, cow.id).ok, '没有挤奶桶')
  addItem(s.inv, 'milk_pail', 0, 1)
  assert.ok(careAnimal(s, cow.id).ok && s.inv.some((sl) => sl?.id === 'milk'))
  // 放牧：开门、非雨天、非冬季算有效喂养
  barn.hay = 0
  assert.ok(toggleDoor(s, barn).ok && barn.open)
  const fed0 = cow.fed
  nap(s)
  assert.ok(cow.fed === fed0 + 1 || cow.fed === fed0, '雨天不放牧')
  // 升级畜棚 → 可养山羊，自动从筒仓取草
  assert.ok(upgradeBuilding(s, barn.id).ok)
  nap(s); nap(s)
  assert.ok(buyAnimal(s, 'goat').ok)
  clear(s, 39, 25, 5, 5)
  assert.ok(orderBuilding(s, 'silo', 40, 26).ok)
  nap(s)
  assert.ok(putHay(s).ok && s.silo > 0)
  barn.open = false
  const silo0 = s.silo
  nap(s)
  assert.equal(s.silo, silo0 - 2, '升级畜棚从筒仓取草喂两只')
  // 拆除：有动物不能拆
  assert.ok(!demolish(s, barn.id).ok)
  assert.ok(validState(s))
}
{
  // 禽舍：鸭两天一枚蛋；兔需要升级禽舍
  const s = rich()
  clear(s, 4, 2, 8, 8)
  assert.ok(orderBuilding(s, 'coop', 5, 3).ok)
  nap(s)
  assert.ok(buyAnimal(s, 'duck').ok)
  assert.ok(!buyAnimal(s, 'rabbit').ok)
  s.farmB[0].hay = 30
  for (let d = 0; d < 10; d++) nap(s)
  assert.equal(s.animals[0].eggs, 2, '鸭 7 天成年，之后每 2 个有效喂养日一枚（第 8、10 天）')
  assert.ok(collectNest(s, s.farmB[0].id).ok && s.inv.some((sl) => sl?.id === 'duck_egg'))
}
{
  // 家宅升级 → 家中厨房
  const s = rich()
  assert.ok(upgradeHouse(s).ok)
  nap(s); nap(s)
  assert.equal(s.house.lv, 1)
  assert.ok(s.flags.includes('house:1'))
}
{
  // 箱子：放入、取回、只存同类、原位升级大木箱
  const s = rich()
  s.region = 'farm'
  const x = 30, z = 14
  clear(s, x, z, 1, 1)
  s.x = x + 0.5; s.z = z + 1.5
  s.inv[5] = { id: 'chest', q: 0, n: 1 }
  s.sel = 5
  assert.ok(useAt(s, x, z).ok)
  const chest = s.ents.find((e) => e.k === 'chest')!
  assert.equal(chest.store!.length, 24)
  const woodAt = s.inv.findIndex((sl) => sl?.id === 'wood')
  assert.ok(chestMove(s, chest, 'bag', woodAt).ok)
  assert.ok(chest.store!.some((sl) => sl?.id === 'wood'))
  s.inv[20] = { id: 'wood', q: 0, n: 5 }
  assert.ok(chestQuickStack(s, chest).ok)
  assert.ok(!s.inv.some((sl) => sl?.id === 'wood'))
  s.inv[5] = { id: 'chest_big', q: 0, n: 1 }
  assert.ok(useAt(s, x, z).ok)
  assert.equal(chest.k, 'chest_big')
  assert.equal(chest.store!.length, 48)
  assert.ok(chest.store!.some((sl) => sl?.id === 'wood'), '升级不丢物')
  assert.ok(validState(s))
}
{
  // 喷灌：水管把喷灌连到水井（12 格内），次日早上浇湿周围 8 格
  const s = rich()
  s.region = 'farm'
  for (let x = 18; x <= 22; x++) { clear(s, x, 13, 1, 1); s.tiles[13 * 48 + x].pipe = 1 }
  for (const z of [10, 11, 12]) s.tiles[z * 48 + 18].pipe = 1
  clear(s, 22, 14, 3, 3)
  s.ents.push({ id: 9001, k: 'sprinkler', x: 23, z: 15, job: null }); s.tiles[15 * 48 + 23].ent = 9001
  s.tiles[14 * 48 + 23].pipe = 1
  s.tiles[14 * 48 + 22].pipe = 1
  assert.ok(waterNetwork(s).has(15 * 48 + 23), '喷灌连通')
  s.tiles[16 * 48 + 24].till = true
  const day = s.day
  nap(s)
  assert.ok(s.tiles[16 * 48 + 24].wet >= day + 1, '日结后喷灌浇了次日')
  assert.ok(validState(s))
}
{
  // 果树：3×3 内不能有树；20 个日结成熟；合法季节每天结果，最多 3 个
  const s = rich()
  s.region = 'farm'
  clear(s, 38, 20, 3, 4)
  s.x = 39.5; s.z = 23.2
  s.inv[5] = { id: 'sapling_cherry', q: 0, n: 2 }
  s.sel = 5
  assert.ok(useAt(s, 39, 21).ok)
  assert.ok(!useAt(s, 39, 22).ok, '相邻不能再种')
  const tree = s.ents.find((e) => e.k === 'fruit_tree')!
  for (let d = 0; d < 20; d++) nap(s)
  assert.ok(tree.grown! >= 20)
  for (let d = 0; d < 4; d++) nap(s)
  assert.equal(tree.fruit, 3, '春季每天 1 个，最多 3 个')
  s.region = 'farm'
  s.x = 39.5; s.z = 22.6
  assert.ok(useAt(s, 39, 21).ok && s.inv.some((sl) => sl?.id === 'cherry'))
  assert.equal(entAction(s, tree), 'tree')
}
{
  // 蜂箱：两个春夏秋日结一份蜂蜜；保水肥：浇一次管两天
  const s = rich()
  s.ents.push({ id: 9100, k: 'beehive', x: 40, z: 30, job: null }); s.tiles[30 * 48 + 40].ent = 9100
  nap(s); nap(s)
  const hive = s.ents.find((e) => e.id === 9100)!
  assert.equal(hive.job?.out.id, 'honey')
  const t = s.tiles[25 * 48 + 30]
  clear(s, 30, 25, 1, 2)
  t.till = true
  t.fert = 2
  s.region = 'farm'
  s.x = 30.5; s.z = 26.4; s.sel = 1; s.water = 10
  assert.ok(useAt(s, 30, 25).ok)
  assert.equal(t.wet, s.day + 1, '保水肥让浇水第二天仍有效')
}
{
  // 温室：完工后 48 格四季耕地，冬季也能种春季作物
  const s = rich()
  s.quests.Q18 = { st: 'active', prog: [0], day: 1 }
  addItem(s.inv, 'crystal_ore', 0, 2)
  s.min = 600
  assert.ok(fundProject(s, 'greenhouse').ok)
  nap(s); nap(s)
  const G = GREENHOUSE_SITE
  assert.equal(s.tiles.filter((t) => t.gh).length, 48)
  s.day = 3 * 28 + 2
  const gx = G.x + 3, gz = G.z + 3
  const tt = s.tiles[gz * 48 + gx]
  tt.till = true
  s.region = 'farm'
  s.x = gx + 0.5; s.z = gz + 1.5
  s.inv[5] = { id: 'seed_spring_radish', q: 0, n: 1 }
  s.sel = 5
  assert.ok(useAt(s, gx, gz).ok, '温室冬季可种春季作物')
}
{
  // 自动进料柜：从 2 格内的箱子取普通品质原料给相邻机器
  const s = rich()
  const put = (id: number, k: string, x: number, z: number, store = false) => { s.ents.push({ id, k, x, z, job: null, ...(store ? { store: Array(24).fill(null) } : {}) }); s.tiles[z * 48 + x].ent = id }
  put(9201, 'auto_hopper', 40, 34); put(9202, 'mill', 41, 34); put(9203, 'chest', 40, 35, true)
  const ch = s.ents.find((e) => e.id === 9203)!
  ch.store![0] = { id: 'summer_corn', q: 0, n: 3 }
  ch.store![1] = { id: 'winter_wheat', q: 2, n: 3 }
  runHoppers(s)
  const mill = s.ents.find((e) => e.id === 9202)!
  assert.equal(mill.job?.out.id, 'flour')
  assert.equal(ch.store![1]!.n, 3, '精品原料不动')
}
{
  // 制作耗时：手工品质肥 60 分钟
  const s = rich()
  s.xp.farming = 80
  addItem(s.inv, 'fiber', 0, 10); addItem(s.inv, 'spring_radish', 0, 1)
  const i = RECIPES.findIndex((r) => r.out === 'fert_quality' && r.min)
  const m0 = s.min
  assert.ok(craft(s, i).ok)
  assert.equal(s.min, m0 + 60)
}
{
  // 旧档：固定位置的禽舍与饲料槽迁移到建筑表
  const s = fresh(5) as unknown as Record<string, unknown> & GameState
  ;(s as Record<string, unknown>).builds = { coop: 3 }
  ;(s as Record<string, unknown>).feeder = 7
  s.animals = [{ id: 77, kind: 'chicken', name: '老鸡', fed: 5, love: 10, pet: 0, fedDay: 0, eggs: 1, bought: 3 } as GameState['animals'][0]]
  delete (s as Record<string, unknown>).farmB
  assert.ok(validState(s))
  migrate(s)
  assert.equal(s.farmB[0].k, 'coop')
  assert.equal(s.farmB[0].hay, 7)
  assert.equal(s.animals[0].home, s.farmB[0].id)
  assert.ok(validState(s))
}

console.log('g3 tests passed')
