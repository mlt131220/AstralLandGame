// RC（发布候选）回归：G4 验收报告（_infomation/开发进度/G4验收报告.md）R01—R08 的复现用例，修好后必须一直通过。
import assert from 'node:assert/strict'
// 先导入 state.ts：守住内容表之间不能有加载顺序依赖（g4.ts ↔ content.ts 曾循环导入，换个顺序就崩）
import { addItem, countSpec, newGame, regionOf, validState, type Ent, type GameState } from './state.ts'
import { QUEST_DEFS } from '../content/story.ts'
import { WISHES } from './wishes.ts'
import { plantForecast, useAt, advanceAll, batches, jobBusy, jobDone, machineCancel, machineCollect, machineInsert, machineRecipes, shipPut, shipTake } from './actions.ts'
import { endDay } from './settle.ts'
import { ITEMS } from '../content/content.ts'
import { specMatch } from './state.ts'
const recipeIds = (spec: string) => Object.keys(ITEMS).find((id) => specMatch(spec, id))!
import { demolish, moveBuilding } from './buildings.ts'
import { collectorsSettle } from './placeables.ts'
import { recheck, registerQuests } from './quests.ts'
import { buy, festStarted, finishFestival, kitchenOpen, resumeFestival, shopStock } from './town.ts'
import { moveTo } from './travel.ts'

registerQuests(QUEST_DEFS)
const fresh = () => {
  const s = newGame('测试', '测试农场', 1, 4242)
  s.day = 5
  s.settled = 4
  return s
}

// R01 自动任务多件奖励：背包只放得下其中一件时，反复重检不能重复发放
{
  const s = fresh()
  s.quests.F02 = { st: 'ready', prog: [1], day: 1 }
  s.flags.push('festival:fishing_derby')
  s.inv = s.inv.map(() => ({ id: 'stone', q: 0, n: 999 }))
  s.inv[0] = { id: 'bait', q: 0, n: 1 }
  for (let i = 0; i < 3; i++) recheck(s)
  assert.equal(s.inv[0]!.n, 1, '鱼饵没有被重复加')
  assert.equal(s.quests.F02.st, 'ready', '奖励待领')
  s.inv[5] = null
  recheck(s)
  assert.equal(s.quests.F02.st, 'done')
  assert.equal(s.inv[0]!.n, 6, '腾位后整组领取一次')
  recheck(s)
  assert.equal(s.inv[0]!.n, 6)
}

// R02 自动收集柜：放不下的优良产物留在动物身上，不凭空消失
{
  const s = fresh()
  s.farmB.push({ id: 900, k: 'coop', x: 5, z: 3, done: 1, up: 0, hay: 0, open: false })
  s.animals.push({ id: 901, kind: 'chicken', name: '小黄', home: 900, fed: 9, love: 1000, eggs: 3, prog: 0, pet: 0, fedDay: 0 } as GameState['animals'][number])
  const c: Ent = { id: 902, k: 'auto_collector', x: 12, z: 5, job: null, store: Array(1).fill(null) }
  c.store![0] = { id: 'egg', q: 0, n: 98 }
  s.ents.push(c)
  s.tiles[5 * 48 + 12].ent = 902
  const before = countSpec(c.store!, 'egg') + s.animals[0].eggs
  collectorsSettle(s)
  assert.equal(countSpec(c.store!, 'egg') + s.animals[0].eggs, before, '蛋总数守恒')
}

// R03 未知室内 / 不存在的私人建筑：存档不通过校验（读档会回退到前一日备份）
{
  const s = fresh()
  assert.ok(validState(JSON.parse(JSON.stringify(s))))
  for (const bad of ['in:missing', 'in:coop:9999']) {
    const o = JSON.parse(JSON.stringify(s))
    o.region = bad
    assert.ok(!validState(o), bad + ' 被拒绝')
  }
  // 人在屋里不能拆、不能搬这栋建筑
  s.farmB.push({ id: 910, k: 'cabin', x: 30, z: 20, done: 1, up: 0, hay: 0, open: false, store: Array(48).fill(null) })
  moveTo(s, 'in:cabin:910', 5, 5)
  s.inv = s.inv.map(() => null)
  assert.ok(!demolish(s, 910).ok)
  assert.ok(!moveBuilding(s, 910, 34, 24).ok)
}

// R05 乳品工坊第三级：有真实可获得的目录，全部见过后能达成
{
  const s = fresh()
  const tier = WISHES.find((w) => w.id === 'dairy')!.tiers[2]
  for (const id of ['egg', 'duck_egg', 'rabbit_fur', 'milk', 'goat_milk', 'wool', 'cheese_cow', 'cheese_goat', 'cloth']) s.found[id] = 1
  const [a, b] = tier.prog(s)
  assert.ok(a >= b, '乳品第三级可达成')
}

// R06 商购标记：出货撤回、机器取消退料后仍是“购”，不能洗成自产
{
  const s = fresh()
  s.inv[5] = { id: 'copper_ore', q: 0, n: 5, b: 1 }
  assert.ok(shipPut(s, 5).ok)
  assert.ok(shipTake(s, 0).ok)
  assert.ok(s.inv.some((sl) => sl?.id === 'copper_ore' && sl.b), '出货撤回保留标记')
  s.inv = s.inv.map((sl) => (sl?.id === 'copper_ore' ? null : sl))
  s.inv[5] = { id: 'copper_ore', q: 0, n: 5, b: 1 }
  addItem(s.inv, 'coal', 0, 2)
  const e: Ent = { id: 920, k: 'furnace', x: 30, z: 30, job: null }
  s.ents.push(e)
  s.tiles[30 * 48 + 30].ent = 920
  const ri = machineRecipes(s, 'furnace').findIndex((r) => r.in.some(([spec]) => spec === 'copper_ore'))
  assert.ok(ri >= 0 && machineInsert(s, e, ri).ok, '熔炉投料')
  assert.ok(machineCancel(s, e).ok)
  assert.ok(s.inv.some((sl) => sl?.id === 'copper_ore' && sl.b), '取消退料保留标记')
}

// R07 家宅 1 级后家里的厨房随时能用（人在屋里）；食堂仍按营业时间
{
  const s = fresh()
  s.house.lv = 1
  moveTo(s, 'in:house', 5, 5)
  s.min = 360
  assert.ok(kitchenOpen(s, true), '清早在家能做饭')
  assert.ok(!kitchenOpen(s, false), '食堂没开门')
}

// R08 风车转起来后（Q22 奖励旗标）磨坊加工时间缩短 20%
{
  const s = fresh()
  const mill: Ent = { id: 930, k: 'mill', x: 31, z: 31, job: null }
  s.ents.push(mill)
  s.tiles[31 * 48 + 31].ent = 930
  const r = machineRecipes(s, 'mill')[0]
  for (const [spec, n] of r.in) addItem(s.inv, spec.startsWith('#') ? recipeIds(spec) : spec.split('|')[0], 0, n * 2)
  const c = structuredClone(s)
  const m0 = c.ents.find((e) => e.id === 930)!
  assert.ok(machineInsert(c, m0, 0).ok, '磨坊投料')
  s.flags.push('windmill_turning')
  const m = s.ents.find((e) => e.id === 930)!
  assert.ok(machineInsert(s, m, 0).ok)
  assert.ok(m.job!.doneAt < m0.job!.doneAt, '提速后更快完成')
}

// 机器跨夜队列（§32.1）：最多 20 批；预约即扣料；睡觉期间依次做完；一次取出全部；撤销未开始的全额退回
{
  const s = fresh()
  s.min = 1200
  const f: Ent = { id: 940, k: 'furnace', x: 32, z: 32, job: null }
  s.ents.push(f)
  s.tiles[32 * 48 + 32].ent = 940
  s.inv = s.inv.map((sl) => (sl && ITEMS[sl.id].tool ? sl : null))
  addItem(s.inv, 'copper_ore', 0, 50)
  addItem(s.inv, 'coal', 0, 20)
  const ri = machineRecipes(s, 'furnace').findIndex((r) => r.in.some(([spec]) => spec === 'copper_ore'))
  for (let i = 0; i < 3; i++) assert.ok(machineInsert(s, f, ri).ok, '投料/预约第 ' + (i + 1) + ' 批')
  assert.equal(batches(f), 3)
  const oreLeft = countSpec(s.inv, 'copper_ore')
  assert.ok(machineCancel(s, f).ok)
  assert.equal(countSpec(s.inv, 'copper_ore'), 50, '撤销全额退料')
  assert.equal(batches(f), 0)
  for (let i = 0; i < 3; i++) machineInsert(s, f, ri)
  assert.ok(oreLeft < 50)
  s.energy = 200
  endDay(s, false)
  advanceAll(s)
  assert.ok(jobDone(s, f) && !jobBusy(s, f), '睡一觉三批都做完')
  assert.ok(machineCollect(s, f).ok)
  assert.equal(countSpec(s.inv, 'copper_bar'), 3, '一次取出三份')
  assert.ok(validState(JSON.parse(JSON.stringify(s))))
}
// 上线审计 L02：不领取、连续多轮预约，攒着的成品超过单格上限（99）也能存档读回并一次领完；L01：机器里还有成品时不能拆
{
  const s = fresh()
  const m: Ent = { id: 960, k: 'mill', x: 33, z: 33, job: null }
  s.ents.push(m)
  s.tiles[33 * 48 + 33].ent = 960
  s.inv = s.inv.map((sl) => (sl && ITEMS[sl.id].tool ? sl : null))
  const r = machineRecipes(s, 'mill')[0]
  const grain = recipeIds(r.in[0][0])
  let made = 0
  for (let round = 0; round < 6; round++) {
    addItem(s.inv, grain, 0, r.in[0][1] * 20)
    while (machineInsert(s, m, 0).ok) made += r.n
    s.day += 3
    advanceAll(s)
  }
  // 再投一批又撤销：正在做的那批退料、机器空着，但攒着的成品还在（审计复现 L01 的路径）
  addItem(s.inv, grain, 0, r.in[0][1])
  assert.ok(machineInsert(s, m, 0).ok)
  assert.ok(machineCancel(s, m).ok)
  assert.equal(m.job, null)
  assert.ok((m.done?.[0]?.n ?? 0) > ITEMS[m.done![0].id].stack, '攒着的成品超过单格上限')
  const back = JSON.parse(JSON.stringify(s))
  assert.ok(validState(back), '这样的存档能通过校验、读得回来')
  s.sel = s.inv.findIndex((sl) => sl?.id === 'tool_pick')
  s.x = 33.5
  s.z = 34.5
  s.energy = 200
  assert.ok(!useAt(s, 33, 33).ok && s.ents.includes(m), '有成品时不能拆机器（L01）')
  assert.ok(machineCollect(back, back.ents.find((e: Ent) => e.id === 960)!).ok, '读回的存档能领取')
  assert.equal(countSpec(back.inv, m.done![0].id), made, '全部成品一份不少')
}
{
  // 自动进料柜：睡前把队列预约满，只用箱子里已有的原料，最多 20 批
  const s = fresh()
  s.min = 1200
  const put = (e: Ent) => { s.ents.push(e); s.tiles[e.z * 48 + e.x].ent = e.id }
  const box: Ent = { id: 950, k: 'chest_big', x: 30, z: 34, job: null, store: Array(48).fill(null) }
  put(box)
  put({ id: 951, k: 'auto_hopper', x: 31, z: 34, job: null })
  const mill: Ent = { id: 952, k: 'mill', x: 32, z: 34, job: null }
  put(mill)
  const r = machineRecipes(s, 'mill')[0]
  const grain = recipeIds(r.in[0][0])
  addItem(box.store!, grain, 0, r.in[0][1] * 30)
  s.energy = 200
  endDay(s, false)
  assert.ok(batches(mill) + (mill.done?.length ?? 0) > 1, '睡前预约了多批')
  assert.ok(batches(mill) <= 20)
  assert.ok(validState(JSON.parse(JSON.stringify(s))))
}

// T15 搬迁带库存、家具和动物的建筑：建筑 ID、储物、室内家具、动物归属都不变，门口跟着新位置走
{
  const s = fresh()
  s.money = 99999
  s.farmB.push({ id: 970, k: 'coop', x: 5, z: 3, done: 1, up: 0, hay: 7, open: false })
  s.animals.push({ id: 971, kind: 'chicken', name: '小黄', home: 970, fed: 9, love: 300, eggs: 2, prog: 0, pet: 0, fedDay: 0, bought: 1 } as GameState['animals'][number])
  ;(s.rooms ??= {})['in:coop:970'] = [{ id: 972, k: 'chest', x: 3, z: 4, job: null, store: [{ id: 'egg', q: 1, n: 5 }, ...Array(35).fill(null)] }]
  const before = JSON.stringify({ room: s.rooms['in:coop:970'], animals: s.animals, hay: s.farmB[0].hay })
  for (let z = 20; z < 26; z++) for (let x = 30; x < 37; x++) { const t = s.tiles[z * 48 + x]; t.ob = null; t.till = false; t.crop = null; t.ent = 0; t.g = 0 }
  const r = moveBuilding(s, 970, 30, 20)
  assert.ok(r.ok, '搬迁 ' + r.msg)
  assert.equal(JSON.stringify({ room: s.rooms['in:coop:970'], animals: s.animals, hay: s.farmB[0].hay }), before, '库存、动物、饲料都保留')
  moveTo(s, 'in:coop:970', 5, 5)
  const exit = regionOf(s).exits[0]
  assert.ok(exit.tx >= 30 && exit.tx < 37 && exit.tz > 20, '出门到新位置门口')
  assert.ok(validState(JSON.parse(JSON.stringify(s))))
}

// T16 买最后一格放不下的多件：全部拒绝，金币不变
{
  const s = fresh()
  s.money = 10000
  s.min = 600
  s.inv = s.inv.map((_, i) => (i === 0 ? null : { id: 'stone', q: 0, n: 999 }))
  const id = 'seed_spring_radish'
  const r = buy(s, id, ITEMS[id].stack + 1)
  assert.ok(!r.ok, '一格放不下就整单不买')
  assert.equal(s.money, 10000)
  assert.equal(s.inv[0], null)
  assert.ok(buy(s, id, 3).ok)
  assert.equal(s.money, 10000 - ITEMS[id].buy! * 3)
}

// T31 首春错过花种会：之后照样能买草莓种子
{
  const s = fresh()
  s.day = 9
  s.min = 600
  assert.ok(!s.flags.includes('festival:flower_fair'))
  assert.ok(shopStock(s).includes('seed_spring_strawberry'), '春 9 日杂货店有草莓种子')
}

// T02 春 24 日真的播下 4 日熟作物：春 28 日成熟；春 25 日的预警
{
  const s = fresh()
  s.day = 24
  s.settled = 23
  moveTo(s, 'farm', 20.5, 14.5)
  const t = s.tiles[13 * 48 + 20]
  t.ob = null; t.till = true; t.crop = null; t.ent = 0
  s.inv[5] = { id: 'seed_spring_radish', q: 0, n: 1 }
  s.sel = 5
  assert.ok(useAt(s, 20, 13).ok, '播种')
  for (let d = 0; d < 4; d++) { t.wet = s.day; s.energy = 200; endDay(s, false); s.region = 'farm' }
  assert.equal(s.day, 28)
  const crop = s.tiles[13 * 48 + 20].crop
  assert.ok(crop && !crop.dead && crop.prog >= 4, '春 28 日成熟')
  assert.equal(plantForecast('spring_radish', 25), null, '春 25 日播种会提示来不及')
}

// §20.2 节庆检查点：小游戏开始后刷新页面，读档时按中途离开结算一次，不能重来刷成绩，奖励不重复
{
  const s = fresh()
  s.day = 22
  s.min = 700
  festStarted(s, 'fishing_derby')
  const saved = JSON.parse(JSON.stringify(s)) as GameState
  assert.ok(validState(saved))
  const r = resumeFestival(saved)
  assert.ok(r?.ok, '读档时结算')
  assert.ok(saved.flags.includes('festival:fishing_derby'))
  assert.ok(!saved.flags.some((f) => f.startsWith('festtry:')))
  assert.equal(resumeFestival(saved), null, '只结算一次')
  assert.ok(!finishFestival(saved, 'fishing_derby', 99, '').ok, '今年不能再比')
}

// Q05 晚于第 14 天才接到：仍能领到救济汤完成任务（否则 G06、N_xiahe_01、F03 永远锁住）
{
  const { claimSoup } = await import('./actions.ts')
  const s = fresh()
  s.day = 20; s.settled = 19; s.min = 700; s.money = 300; s.satiety = 60
  assert.ok(!claimSoup(s).ok, '平时第 14 天后不发')
  s.quests.Q05 = { st: 'active', prog: [0, 0], day: 20 }
  assert.ok(claimSoup(s).ok, 'Q05 进行中照常发')
  assert.equal(s.quests.Q05.prog[0], 1, '领汤即“到公共厨房领取”')
}

// 配方的解锁条件必须有规则能给到（喷灌/水管/蓄水箱曾要求从没有任何规则发放的 system:irrigation，真实游戏里永远做不出来）
{
  const { RECIPES } = await import('../content/content.ts')
  const { BOSS_FIRST } = await import('../content/g3.ts')
  const { npcEvent, NPC_DEFS } = await import('../content/story.ts')
  const fs = await import('node:fs')
  const unlocks = new Set(['system:carpenter', 'system:ranch']) // 界面层：第一次走到木工坊、牧场柜台时登记（game.ts interact）
  const flags = new Set<string>()
  for (const q of QUEST_DEFS) { for (const u of q.rewards?.unlock ?? []) unlocks.add(u); for (const f of q.rewards?.flags ?? []) flags.add(f) }
  for (const b of Object.values(BOSS_FIRST)) for (const u of b.unlock) unlocks.add(u)
  for (const it of Object.values(ITEMS)) if (it.effect) unlocks.add(it.effect)
  for (const npc of Object.keys(NPC_DEFS)) for (const t of [200, 400, 600, 800, 1000]) { const r = npcEvent(npc, t)?.reward?.recipe; if (r) unlocks.add('recipe:' + r) }
  const core = fs.readdirSync(new URL('.', import.meta.url)).filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts')).map((f) => fs.readFileSync(new URL(f, import.meta.url), 'utf8')).join('\n')
  for (const r of RECIPES) {
    if (r.unlock) assert.ok(unlocks.has(r.unlock), `配方 ${r.out} 要求 ${r.unlock}，但没有任何任务/事件/首领/道具会发放`)
    if (r.flag) assert.ok(flags.has(r.flag) || core.includes(`'${r.flag}'`) || core.includes(`'${r.flag.split(':')[0]}:`), `配方 ${r.out} 要求旗标 ${r.flag}，但没有规则会设置`)
  }
}

console.log('rc tests passed')
