// 领域规则自检：对应设计 29.2 关键用例。运行：pnpm test
import assert from 'node:assert/strict'
import { chargeArea, craft, machineInsert, deliverQuests, eat, machineCollect, plantForecast, shipPut, sortBag, swapSlots, useArea, useAt, useKeyItem } from './actions.ts'
import { readMail, refreshQuests, registerQuests, type QuestDef } from './quests.ts'
import { ITEMS } from '../content/content.ts'
import { endDay } from './settle.ts'
import { isMature, migrate, newGame, tileAt, validState, weather, type GameState } from './state.ts'

const X = 20, Z = 13 // 门前示范田，无障碍
const near = (s: GameState) => { s.x = X + 0.5; s.z = Z + 1.5 }
function setup() {
  const s = newGame('测试', '测试农场', 1, 12345)
  near(s)
  return s
}
const tile = (s: GameState) => tileAt(s, X, Z)!
function sow(s: GameState, cid: string) {
  s.sel = 0
  assert.ok(useAt(s, X, Z).ok, '开垦')
  s.inv[5] = { id: 'seed_' + cid, q: 0, n: 1 }
  s.sel = 5
  assert.ok(useAt(s, X, Z).ok, '播种')
}
const water = (s: GameState) => { near(s); s.sel = 1; s.water = 40; return useAt(s, X, Z) }
// 睡觉；dry=true 时抹掉次日降雨，模拟晴天
function sleep(s: GameState, dry = true) {
  s.energy = 200
  endDay(s, false)
  s.region = 'farm' // 出门
  near(s)
  if (dry) tile(s).wet = 0
}

// T01 春1日播4日熟并连续浇水 → 春5日成熟
{
  const s = setup()
  sow(s, 'spring_radish')
  for (let d = 1; d <= 4; d++) { assert.ok(!isMature(tile(s).crop!)); water(s); sleep(s) }
  assert.equal(s.day, 5)
  assert.ok(isMature(tile(s).crop!))
  s.sel = 0
  assert.ok(useAt(s, X, Z).ok, '收获')
  assert.equal(tile(s).crop, null)
  assert.ok(!useAt(s, X, Z, true).msg?.startsWith('收获'), '只收获一次')
}

// T02 春24日播 → 春28日成熟；春25日播预警
assert.equal(plantForecast('spring_radish', 24), 28)
assert.equal(plantForecast('spring_radish', 25), null)

// T03 漏水1日只延迟1日，缺水计数清零
{
  const s = setup()
  sow(s, 'spring_radish')
  water(s); sleep(s)
  sleep(s) // 漏浇
  assert.equal(tile(s).crop!.dry, 1)
  for (let i = 0; i < 3; i++) { water(s); sleep(s) }
  assert.equal(tile(s).crop!.dry, 0)
  assert.equal(s.day, 6)
  assert.ok(isMature(tile(s).crop!))
}

// T04 连续3日未浇水枯萎；成熟植株不因缺水枯萎
{
  const s = setup()
  sow(s, 'spring_radish')
  sleep(s); sleep(s)
  assert.ok(!tile(s).crop!.dead)
  sleep(s)
  assert.ok(tile(s).crop!.dead)

  const m = setup()
  sow(m, 'spring_radish')
  for (let d = 0; d < 4; d++) { water(m); sleep(m) }
  for (let d = 0; d < 5; d++) sleep(m)
  assert.ok(isMature(tile(m).crop!))
}

// T05 夏季玉米跨秋继续生长；春萝卜跨夏枯萎
{
  const s = setup()
  s.day = 50 // 夏22
  sow(s, 'summer_corn')
  for (let d = 0; d < 9; d++) { water(s); sleep(s) }
  assert.equal(s.day, 59) // 秋3
  assert.ok(isMature(tile(s).crop!))

  const r = setup()
  r.day = 26
  sow(r, 'spring_radish')
  for (let d = 0; d < 3; d++) { water(r); sleep(r) }
  assert.ok(tile(r).crop!.dead)
}

// T06 雨+手动浇水同日只增长1次
{
  const s = setup()
  sow(s, 'spring_radish')
  water(s)
  tile(s).wet = s.day
  sleep(s)
  assert.equal(tile(s).crop!.prog, 1)
}

// T07 背包满时收获：作物保留成熟，不丢不复制
{
  const s = setup()
  sow(s, 'spring_radish')
  for (let d = 0; d < 4; d++) { water(s); sleep(s) }
  s.inv = s.inv.map(() => ({ id: 'stone', q: 0, n: 999 }))
  s.sel = 0
  assert.ok(!useAt(s, X, Z).ok)
  assert.ok(isMature(tile(s).crop!))
}

// 再生：豌豆 7 日首熟，收获后 3 日再熟
{
  const s = setup()
  sow(s, 'spring_pea')
  for (let d = 0; d < 7; d++) { water(s); sleep(s) }
  s.sel = 0
  assert.ok(useAt(s, X, Z).ok)
  assert.ok(tile(s).crop && !isMature(tile(s).crop!))
  for (let d = 0; d < 3; d++) { water(s); sleep(s) }
  assert.ok(isMature(tile(s).crop!))
}

// T09 同一日结重复执行不产生额外收益；出货结算
{
  const s = setup()
  s.inv[3] = { id: 'spring_radish', q: 0, n: 2 }
  assert.ok(shipPut(s, 3).ok)
  const d = s.day
  const sum = endDay(s, false, d)!
  assert.equal(sum.total, 80)
  assert.equal(s.money, 580)
  assert.equal(endDay(s, false, d), null)
  assert.equal(s.money, 580)
}

// T12 0 精力：动作不提交、不扣资源
{
  const s = setup()
  s.energy = 1
  s.sel = 0
  assert.ok(!useAt(s, X, Z).ok)
  assert.equal(s.energy, 1)
  assert.ok(!tile(s).till)
}

// 饱食 ≥95 不能再吃普通食物
{
  const s = setup()
  s.inv[3] = { id: 'spring_radish', q: 0, n: 2 }
  s.satiety = 90
  assert.ok(eat(s, 3).ok)
  assert.ok(!eat(s, 3).ok)
}

// 02:00 昏倒：首7日免救援费；之后 5% 上限 300
{
  const s = setup()
  s.money = 1000
  endDay(s, true)
  assert.equal(s.money, 1000)
  s.day = 10
  s.settled = 9
  endDay(s, true)
  assert.equal(s.money, 950)
  assert.equal(s.energy >= 120, true)
}

// 天气确定：读档不重抽；首春第3日固定下雨
assert.equal(weather(1, 3), 2)
assert.equal(weather(99, 40), weather(99, 40))

// 堆肥箱：耕作1解锁 → 制作 → 放置 → 投料 → 次日 06:00 取出品质肥×5
{
  const s = setup()
  s.inv[3] = { id: 'wood', q: 0, n: 25 }
  s.inv[4] = { id: 'stone', q: 0, n: 10 }
  assert.ok(!craft(s, 0).ok, '未解锁')
  s.xp.farming = 80
  assert.ok(craft(s, 0).ok)
  swapSlots(s, s.inv.findIndex((sl) => sl?.id === 'compost'), 5)
  s.sel = 5
  assert.ok(useAt(s, X, Z).ok, '放置')
  const e = s.ents[0]
  s.inv[3] = { id: 'fiber', q: 0, n: 10 }
  s.inv[4] = { id: 'spring_radish', q: 0, n: 1 }
  assert.ok(machineInsert(s, e).ok)
  assert.ok(!machineCollect(s, e).ok)
  sleep(s)
  assert.ok(machineCollect(s, e).ok)
  assert.equal(s.inv.find((sl) => sl?.id === 'fert_quality')?.n, 5)
}

// 雨天新开垦的田视为已浇水（首春第3日固定下雨）
{
  const s = setup()
  s.day = 3
  sow(s, 'spring_radish')
  sleep(s)
  assert.equal(tile(s).crop!.prog, 1)
  assert.equal(tile(s).crop!.dry, 0)
}

// 存档校验：残缺或引用错误的状态不能通过
assert.ok(validState(setup()))
assert.ok(!validState({ schema: 1, tiles: [], inv: [], day: 1 }))
{
  const s = setup()
  tileAt(s, 1, 1)!.ent = 999
  assert.ok(!validState(s))
}

// 任务：信件 → 读信完成 → 解锁下一环；计数从接取后开始；教学柜交付扣物并发奖励；关键道具扩充快捷栏
{
  ITEMS.belt_toolbag = { id: 'belt_toolbag', name: '工具腰包', stack: 1, sell: 0, color: 0, effect: 'hotbar:10' }
  const defs: QuestDef[] = [
    { id: 'A', kind: 'main', title: '信', giver: 'letter', phase: 'G1', requires: [], intro: '', submit: 'auto', complete: '', journal: '',
      objectives: [{ type: 'interact', target: 'mailbox', text: '' }], rewards: {} },
    { id: 'B', kind: 'main', title: '种地', giver: 'auto', phase: 'G1', requires: ['A'], intro: '', submit: 'auto', complete: '', journal: '',
      objectives: [{ type: 'till', n: 1, text: '' }, { type: 'plant', crop: 'spring_radish', n: 1, text: '' }], rewards: { money: 50 } },
    { id: 'C', kind: 'main', title: '交付', giver: 'auto', phase: 'G1', requires: ['B'], intro: '', submit: 'teach_box', complete: '', journal: '',
      objectives: [{ type: 'deliver', item: 'spring_radish', n: 2, to: 'teach_box', text: '' }], rewards: { items: [{ id: 'belt_toolbag', n: 1 }] } },
  ]
  registerQuests(defs)
  const s = setup()
  refreshQuests(s)
  assert.deepEqual(s.mail, ['A'])
  s.sel = 0
  useAt(s, X, Z) // 信未读，开垦不计入后续任务
  readMail(s, 'A')
  assert.equal(s.quests.A.st, 'done')
  assert.equal(s.quests.B.st, 'active')
  assert.equal(s.quests.B.prog[0], 0)
  tile(s).till = false
  sow(s, 'spring_radish')
  assert.equal(s.quests.B.st, 'done')
  assert.equal(s.money, 550)
  assert.equal(s.quests.C.st, 'active')
  s.inv[9] = { id: 'spring_radish', q: 0, n: 3 }
  refreshQuests(s)
  assert.equal(s.quests.C.st, 'ready')
  assert.ok(!deliverQuests(s, 'lintang').ok, '交付地点不对')
  assert.ok(deliverQuests(s, 'teach_box').ok)
  assert.equal(s.quests.C.st, 'done')
  assert.equal(s.inv[9]!.n, 1)
  const bag = s.inv.findIndex((sl) => sl?.id === 'belt_toolbag')
  assert.ok(useKeyItem(s, bag).ok)
  assert.equal(s.hotbar, 10)
  assert.equal(s.inv.length, 10 + 24, '快捷栏一排加长，背包格数不变')
  assert.equal(s.inv[0]?.id, 'tool_hoe')
  assert.ok(!s.inv.some((sl) => sl?.id === 'belt_toolbag'))
  registerQuests([])
}

// 蓄力（设计 11.1）：铁锄 3×3 只对有效格计耗；已湿润格浇水不耗水不耗精力
{
  const s = setup()
  s.x = 21.5
  s.z = 12.5
  const area = chargeArea(s, 2, 0, 1) // 朝 +Z，3×3
  assert.equal(area.length, 9)
  const e0 = s.energy
  assert.ok(useArea(s, 'hoe', area).ok)
  assert.equal(area.filter(([x, z]) => tileAt(s, x, z)!.till).length, 9)
  assert.equal(s.energy, e0 - 18)
  tileAt(s, area[0][0], area[0][1])!.wet = s.day
  s.water = 40
  assert.ok(useArea(s, 'can', area).ok)
  assert.equal(s.water, 32)
  assert.ok(!useArea(s, 'can', area).ok, '全部已湿润')
}

// 背包：工具是物品，快捷栏是前 8 格；整理只动背包格，合并零散堆叠并按类别排序
{
  const s = setup()
  assert.deepEqual(s.inv.slice(0, 6).map((sl) => sl?.id), ['tool_hoe', 'tool_can', 'tool_axe', 'tool_pick', 'tool_scythe', 'seed_spring_radish'])
  s.inv[20] = { id: 'wood', q: 0, n: 5 }
  s.inv[12] = { id: 'spring_radish', q: 0, n: 2 }
  s.inv[30] = { id: 'wood', q: 0, n: 7 }
  s.inv[9] = { id: 'compost', q: 0, n: 1 }
  const bar = s.inv.slice(0, 8)
  sortBag(s)
  assert.deepEqual(s.inv.slice(0, 8), bar, '快捷栏不动')
  assert.equal(s.inv.length, 32)
  assert.deepEqual(s.inv.slice(8, 11).map((sl) => sl && sl.id + sl.n), ['spring_radish2', 'wood12', 'compost1'])
  swapSlots(s, 8, 0) // 拖动交换
  assert.equal(s.inv[0]?.id, 'spring_radish')
  assert.equal(s.inv[8]?.id, 'tool_hoe')
  assert.ok(validState(s))
  s.inv[9] = { id: 'tool_hoe', q: 0, n: 1 }
  assert.ok(!validState(s), '工具物品不能重复')
}
// 旧存档（快捷栏引用工具位/背包格）迁移为新背包
{
  const s = setup() as any
  s.inv = Array(24).fill(null)
  s.inv[0] = { id: 'seed_spring_radish', q: 0, n: 3 }
  s.inv[4] = { id: 'wood', q: 0, n: 9 }
  s.bind = ['tool:hoe', 'tool:can', 'slot:4', 'tool:pick', 'tool:scythe', 'slot:0', 'slot:1', 'slot:2']
  assert.ok(validState(s))
  migrate(s)
  assert.equal(s.bind, undefined)
  assert.equal(s.inv.length, 32)
  assert.deepEqual(s.inv.slice(0, 8).map((sl: any) => sl?.id ?? null), ['tool_hoe', 'tool_can', 'wood', 'tool_pick', 'tool_scythe', 'seed_spring_radish', null, null])
  assert.equal(s.inv.filter((sl: any) => sl?.id === 'tool_axe').length, 1, '没绑定的斧头放进背包')
  assert.equal(s.inv.filter((sl: any) => sl?.id === 'wood').length, 1, '不重复')
  assert.ok(validState(s))
}

console.log('core tests passed')
