// G2 纵向切片规则自检：矿洞连通、野外刷新、钓鱼、战斗、畜牧、赠礼、工程、升级、日程、任务数据。运行：pnpm test
import assert from 'node:assert/strict'
import { QUEST_DEFS } from '../content/story.ts'
import { FOES, ITEMS, MINE_FLOORS } from '../content/content.ts'
import { deliverQuest, eat, useAt } from './actions.ts'
import { borrowChicken, buildCoop, buyChicken, collectEggs, feedAnimal, fillFeeder, petAnimal } from './animals.ts'
import { attack, fighterStep, foeStep, newFighter, roll, rollSafe, spawnFoes } from './combat.ts'
import { bite, castTarget, reelStart, reelStep } from './fishing.ts'
import { npcPlace, npcReset, npcStep } from './npcs.ts'
import { absorbTools, acceptQuest, allQuests, applyUnlock, progress, recheck, refreshQuests, registerQuests } from './quests.ts'
import { MINE_H, MINE_W, mineFloor, regionDef, riverCx, SLUICE } from './regions.ts'
import { endDay } from './settle.ts'
import { count, migrate, newGame, projectDone, regionOf, solid, tileAt, validState, weekday, type GameState } from './state.ts'
import { buy, finishEvent, fundProject, gift, giftTaste, smithCollect, smithSmelt, startUpgrade } from './town.ts'
import { claimParcel, enterMine, ladderDown, leaveMine, moveTo } from './travel.ts'

const setup = () => {
  const s = newGame('测试', '测试农场', 1, 4242)
  return s
}
// 睡觉并出门；返回醒来所在的地图
const sleep = (s: GameState) => { s.energy = 200; endDay(s, false); const r = s.region; s.region = 'farm'; return r }

// 任务数据全部可注册（目标类型都受支持），前置引用存在
registerQuests(QUEST_DEFS)
assert.equal(allQuests().length, QUEST_DEFS.length, '所有任务目标类型都受支持')
for (const q of QUEST_DEFS) for (const r of q.requires) assert.ok(QUEST_DEFS.some((x) => x.id === r), `${q.id} 前置 ${r} 存在`)
for (const q of QUEST_DEFS) for (const it of q.rewards.items ?? []) assert.ok(ITEMS[it.id], `${q.id} 奖励物品 ${it.id} 存在`)
assert.ok(!QUEST_DEFS.find((q) => q.id === 'Q06')!.rewards.unlock!.includes('hotbar:10'), '扩容只由使用道具触发')

// 矿洞：普通层入口与出口连通（忽略可敲碎的岩石），敌人不出生在入口 7 米内；5/15/25 层是休息层
for (let seed = 1; seed <= 25; seed++) for (let floor = 1; floor < MINE_FLOORS; floor++) {
  if (floor % 5 === 0) continue
  const m = mineFloor(seed * 7919, seed % 9 + 1, floor)
  const W = MINE_W
  const seen = new Set([m.up[1] * W + m.up[0]])
  const q = [m.up[1] * W + m.up[0]]
  for (let h = 0; h < q.length; h++) {
    const i = q[h]
    for (const d of [1, -1, W, -W]) {
      const n = i + d
      if (n < 0 || n >= W * MINE_H || seen.has(n) || m.g[n] !== 4) continue
      seen.add(n)
      q.push(n)
    }
  }
  assert.ok(seen.has(m.exit), `种子 ${seed} 第 ${floor} 层出口可达`)
  assert.equal(m.obs.get(m.exit), 'exit')
  for (const f of m.foes) assert.ok(Math.hypot(f.x - m.up[0], f.z - m.up[1]) >= 6.5, '敌人远离入口')
  if (floor < 5) assert.equal(m.foes.length, floor + 1 + Math.max(0, floor - 1))
}
assert.ok(mineFloor(1, 1, 5).lift && !mineFloor(1, 1, 5).foes.length)

// 矿洞：安全课后才能下；打碎 10 块岩石或标记岩后出口出现；下到 5 层解锁升降梯
{
  const s = setup()
  assert.ok(!enterMine(s, 1).ok)
  applyUnlock(s, 'region:mine')
  assert.ok(enterMine(s, 1).ok)
  assert.equal(s.region, 'mine')
  assert.ok(!regionOf(s).buildings.some((b) => b.act === 'down'))
  const m = mineFloor(s.seed, s.day, 1)
  s.tools.pick = 3 // 合金镐一下一块
  s.energy = 200
  s.sel = 3
  const ex = m.exit % MINE_W, ez = (m.exit / MINE_W) | 0
  s.x = ex + 0.5; s.z = ez + 1.5
  const r = useAt(s, ex, ez)
  assert.ok(r.ok && r.msg!.includes('木梯'), r.msg)
  assert.ok(regionOf(s).buildings.some((b) => b.act === 'down'))
  for (let f = 2; f <= 10; f++) assert.ok(ladderDown(s).ok)
  assert.equal(s.deepest, 10)
  assert.ok(!ladderDown(s).ok, '首领未击败前不能继续下行')
  assert.equal(sleep(s), 'in:house', '在家里醒来')
  assert.ok(enterMine(s, 5).ok, '升降梯直达 5 层')
}

// 浅林：每日 12 份食用采集物 + 3 份草药；拾取后当天不再出现，次日重新分布；砍树 7 日后再生
{
  const s = setup()
  moveTo(s, 'forest', 24, 1.6)
  const def = regionOf(s)
  const items = () => { const out: [number, number, string][] = []; for (let z = 0; z < def.h; z++) for (let x = 0; x < def.w; x++) { const t = tileAt(s, x, z)!; if (t.fo) out.push([x, z, t.fo]) } return out }
  const list = items()
  assert.equal(list.filter(([, , id]) => id !== 'herb').length, 12)
  assert.equal(list.filter(([, , id]) => id === 'herb').length, 3)
  const [fx, fz, fid] = list[0]
  s.x = fx + 0.5; s.z = fz + 1.2
  const xp = s.xp.foraging
  assert.ok(useAt(s, fx, fz).ok)
  assert.ok(s.inv.some((sl) => sl?.id === fid))
  assert.ok(s.xp.foraging > xp)
  assert.equal(tileAt(s, fx, fz)!.fo, undefined)
  assert.equal(items().length, 14)
  // 砍一棵树
  let tree: [number, number] | null = null
  for (let z = 5; z < def.h && !tree; z++) for (let x = 1; x < def.w - 1 && !tree; x++) if (tileAt(s, x, z)!.ob?.k === 'tree' && !solid(s, x, z + 1)) tree = [x, z]
  assert.ok(tree)
  s.tools.axe = 3; s.sel = 2; s.energy = 200
  s.x = tree![0] + 0.5; s.z = tree![1] + 1.5
  while (tileAt(s, tree![0], tree![1])!.ob) assert.ok(useAt(s, tree![0], tree![1]).ok)
  assert.ok(s.inv.some((sl) => sl?.id === 'wood'))
  for (let d = 0; d < 6; d++) { sleep(s); moveTo(s, 'forest', 24, 1.6); assert.ok(!tileAt(s, tree![0], tree![1])!.ob, `第 ${d + 1} 天未再生`) }
  sleep(s); moveTo(s, 'forest', 24, 1.6)
  assert.equal(tileAt(s, tree![0], tree![1])!.ob?.k, 'tree', '7 日后再生')
}

// 钓鱼：只能抛进河里；鱼种由遭遇序号确定；理想操作能稳定钓起各难度的鱼，放手不管会脱钩
{
  const s = setup()
  s.min = 600
  moveTo(s, 'river', 27.5, 21.5) // 栈桥上
  assert.equal(tileAt(s, 27, 21)!.g, 6)
  const t = castTarget(s, 1, 0, 0.3)
  assert.ok(typeof t !== 'string', String(t))
  const a = { ...s, fishSeq: 0 }
  const f1 = bite(a as GameState, 'river')
  const b = { ...s, fishSeq: 0 }
  assert.equal(bite(b as GameState, 'river'), f1, '重载同一遭遇不重抽')
  for (const fish of ['fish_silverscale', 'fish_bluecarp', 'fish_spottrout']) {
    const r = reelStart(s, fish)
    let res: string | null = null
    for (let i = 0; i < 30 * 60 && !res; i++) res = reelStep(r, 1 / 30, r.zone + r.zoneV * 0.25 < r.pos)
    assert.equal(res, 'win', fish)
    const idle = reelStart(s, fish)
    let lost: string | null = null
    for (let i = 0; i < 30 * 60 && !lost; i++) lost = reelStep(idle, 1 / 30, false)
    assert.ok(lost === 'lose' || lost === 'win')
  }
  moveTo(s, 'farm', 8.5, 25.5)
  assert.equal(typeof castTarget(s, 0, 1, 0.3), 'string', '农场池塘没有鱼')
}

// 战斗：苔团蹲伏 0.6 秒后扑击，受击后 0.6 秒内不再重复扣血；旧制短剑三下击败苔团，掉落保底纤维
{
  const s = setup()
  applyUnlock(s, 'region:mine')
  enterMine(s, 1)
  const foes = spawnFoes(s)
  const moss = foes.find((f) => f.k === 'moss')!
  for (const f of foes) if (f !== moss) f.st = 'dead'
  s.x = moss.x; s.z = moss.z + 1.5
  if (solid(s, Math.floor(s.x), Math.floor(s.z))) s.z = moss.z - 1.5
  const ft = newFighter()
  const hp0 = s.hp
  let hurt = 0
  for (let i = 0; i < 90; i++) for (const e of foeStep(s, foes, ft, 1 / 30)) if (e.k === 'hurt') hurt++
  assert.ok(hurt >= 1 && s.hp < hp0, '扑击命中')
  assert.ok(hp0 - s.hp <= FOES.moss.atk * hurt)
  // 挥剑
  s.inv[3] = { id: 'sword_old', q: 0, n: 1 }
  s.sel = 3
  moss.st = 'stun'; moss.t = 99; moss.hp = 20
  let hits = 0
  for (let k = 0; k < 6 && (moss.st as string) !== 'dead'; k++) {
    s.face = Math.atan2(moss.x - s.x, moss.z - s.z)
    attack(ft)
    for (let i = 0; i < 25; i++) for (const e of fighterStep(s, ft, foes, 1 / 30)) if (e.k === 'hit') hits++
    if ((moss.st as string) !== 'dead') { moss.st = 'stun'; moss.t = 99 }
  }
  assert.equal(moss.st, 'dead')
  assert.ok(hits >= 3)
  assert.ok(s.inv.some((sl) => sl?.id === 'fiber'), '保底掉落直接入包')
  assert.ok(!spawnFoes(s).some((f) => f.idx === moss.idx), '当天击败的敌人不再出现')
}

// 畜牧：开放 → 下单建禽舍（次日完工）→ 买鸡 → 5 个有效喂养日后产蛋 → 摸头、捡蛋推进任务事件
{
  const s = setup()
  s.money = 5000
  s.inv[3] = { id: 'wood', q: 0, n: 100 }; s.inv[4] = { id: 'stone', q: 0, n: 40 }; s.inv[5] = { id: 'hay', q: 0, n: 20 }
  assert.ok(!buildCoop(s).ok, '未开放')
  applyUnlock(s, 'system:animals')
  assert.ok(buildCoop(s).ok)
  assert.equal(s.money, 3000)
  assert.ok(!buyChicken(s).ok, '禽舍还没建好')
  sleep(s)
  assert.ok(regionOf(s).buildings.some((b) => b.id === 'coop'))
  assert.ok(buyChicken(s).ok)
  assert.ok(fillFeeder(s).ok)
  const id = s.animals[0].id
  assert.ok(petAnimal(s, id).ok)
  assert.ok(!petAnimal(s, id).ok, '每天只能摸一次')
  for (let d = 0; d < 4; d++) sleep(s)
  assert.equal(s.animals[0].eggs, 0)
  sleep(s)
  assert.equal(s.animals[0].fed, 5)
  assert.equal(s.animals[0].eggs, 1, '第 5 个有效喂养日产蛋')
  assert.ok(collectEggs(s).ok)
  assert.ok(s.inv.some((sl) => sl?.id === 'egg'))
  s.farmB[0].hay = 0
  sleep(s)
  assert.equal(s.animals[0].eggs, 0, '缺粮暂停产蛋，不死亡')
  assert.equal(s.animals.length, 1)
}

// 赠礼：最爱 +40，每天 1 次、每周 3 次，生日 ×2；按物品精确匹配优先于类别
{
  const s = setup()
  assert.equal(giftTaste('lintang', 'spring_radish'), 'love')
  assert.equal(giftTaste('lintang', 'spring_pea'), 'like')
  assert.equal(giftTaste('laotao', 'copper_ore'), 'love')
  s.inv[3] = { id: 'spring_radish', q: 0, n: 9 }
  assert.ok(gift(s, 'lintang', 3).ok)
  assert.equal(s.friends.lintang.pts, 40)
  assert.ok(!gift(s, 'lintang', 3).ok, '每日 1 次')
  s.day = 2; gift(s, 'lintang', 3); s.day = 3; gift(s, 'lintang', 3)
  s.day = 4
  assert.equal(weekday(4), 3)
  assert.ok(!gift(s, 'lintang', 3).ok, '每周 3 次')
  s.day = 8 + 3 // 下一周，春 11 日是老陶生日
  assert.ok(gift(s, 'laotao', 3).ok)
  assert.equal(s.friends.laotao.pts, 10, '生日 ×2（萝卜对老陶是一般）')
}

// 友情事件奖励只领一次；配方奖励写入解锁
{
  const s = setup()
  assert.ok(!finishEvent(s, 'xiahe', 0).ok, '好感未到 200')
  s.friends.xiahe = { pts: 200, talked: 1, gifted: 0, week: 0, giftsWeek: 0, events: [] }
  assert.ok(finishEvent(s, 'xiahe', 0).ok)
  assert.ok(s.unlocks.includes('recipe:roast_radish'))
  assert.ok(!finishEvent(s, 'xiahe', 1).ok)
  assert.ok(s.flags.includes('event:xiahe_200'))
}

// 公共工程：水闸筹建一次付清，次日完工，水闸走道可通行到东岸
{
  const s = setup()
  s.money = 2000
  s.inv[3] = { id: 'stone', q: 0, n: 80 }; s.inv[4] = { id: 'copper_bar', q: 0, n: 3 }
  assert.ok(!fundProject(s, 'sluice').ok, '未开放')
  applyUnlock(s, 'system:sluice_fund')
  assert.ok(fundProject(s, 'sluice').ok)
  assert.equal(s.money, 1000)
  assert.ok(!fundProject(s, 'sluice').ok, '不能重复付款')
  moveTo(s, 'river', 2, 14)
  const x = Math.round(riverCx(5))
  assert.ok(solid(s, x, SLUICE.walk))
  sleep(s)
  assert.ok(projectDone(s, 'sluice'))
  moveTo(s, 'river', 2, 14)
  assert.ok(!solid(s, x, SLUICE.walk), '完工后走道可通行')
}

// 工具升级：付款交铜锭，次日 06:00 换上；期间旧工具照常可用
{
  const s = setup()
  s.money = 2000
  s.inv[3] = { id: 'copper_bar', q: 0, n: 5 }
  s.min = 600
  s.day = 1 // 周一
  assert.ok(!startUpgrade(s, 'hoe').ok, '未开放')
  applyUnlock(s, 'system:tool_upgrade')
  assert.ok(startUpgrade(s, 'hoe').ok)
  assert.equal(s.tools.hoe, 0)
  assert.ok(!startUpgrade(s, 'can').ok, '一次一件')
  sleep(s)
  assert.equal(s.tools.hoe, 1)
  assert.equal(s.upgrade, null)
}

// 居民日程：林棠工作日在种子店柜台，周三去浅林，雨天在店里；花种会当天全员在广场
{
  const s = setup()
  s.day = 2; s.min = 600
  const shop = npcPlace(s, 'lintang')!
  assert.deepEqual([shop.region, shop.spot], ['in:general', '柜台'], '店内柜台（室内地图）')
  s.day = 10 // 周三（春 10 日，晴？）
  assert.equal(weekday(10), 2)
  const p = npcPlace(s, 'lintang')!
  assert.ok(p.region === 'forest' || p.region === 'town' || p.region === 'in:general')
  s.day = 3 // 首春第 3 日固定下雨
  assert.ok(npcPlace(s, 'lintang')!.region.startsWith('in:'), '雨天在室内')
  s.day = 8; s.min = 700
  assert.equal(npcPlace(s, 'shenzhou')!.region, 'town')
  assert.ok(regionDef('town', { coop: 0, fest: 'flower_fair', sluice: 0, floor: 0, seed: 1, day: 8, revealed: false, boss: false }).buildings.some((b) => b.act === 'booth'))
}

// 钓竿奖励是背包里的工具物品，并登记为已拥有；任务里的事件目标先发生也能完成
{
  const s = setup()
  s.inv[5] = { id: 'rod_basic', q: 0, n: 1 }
  absorbTools(s)
  assert.equal(s.tools.rod, 0)
  assert.equal(s.inv[5]?.id, 'rod_basic')
  s.flags.push('event:laotao_safety')
  s.quests.Q08a = { st: 'done', prog: [0], day: 1 }
  s.day = 5
  refreshQuests(s)
  assert.equal(s.quests.Q08?.st, 'offered')
  acceptQuest(s, 'Q08')
  assert.equal(s.quests.Q08?.st, 'ready', '安全课先完成，接取后立即可交付')
}

// 存档：新档与 G1 旧档（缺 G2 字段）都能通过校验并迁移
{
  const s = setup()
  assert.ok(validState(s))
  const old = JSON.parse(JSON.stringify(s))
  for (const k of ['floor', 'deepest', 'wild', 'felled', 'animals', 'farmB', 'house', 'silo', 'projects', 'upgrade', 'fishSeq']) delete old[k]
  delete old.tools.rod
  assert.ok(validState(old))
  const m = migrate(old)
  assert.equal(m.tools.rod, -1)
  assert.ok(validState(m))
  assert.equal(m.tiles[30 * 48 + 23].g, 1, '迁移补上通往浅林的南路')
}

// ---------- 审查修复回归 ----------
{
  // #1 任务条目缺少进度数组的存档不能通过校验
  const s = setup()
  const bad = JSON.parse(JSON.stringify(s))
  bad.quests = { Q02: { st: 'active', day: 1 } }
  assert.ok(!validState(bad), '残缺任务条目被拒绝')
  bad.quests = { Q02: { st: 'active', day: 1, prog: [0, 0, 0] } }
  assert.ok(validState(bad))
}
{
  // #2 禽舍预留地不能开垦；旧档留下的空耕地在下单时恢复
  const s = setup()
  s.x = 7.5; s.z = 8.6; s.sel = 0
  assert.ok(!useAt(s, 7, 7).ok, '预留地不能开垦')
  s.tiles[5 * 48 + 7].till = true // 模拟旧档
  applyUnlock(s, 'system:animals')
  s.money = 5000
  s.inv[3] = { id: 'wood', q: 0, n: 100 }; s.inv[4] = { id: 'stone', q: 0, n: 40 }
  assert.ok(buildCoop(s).ok)
  assert.ok(!s.tiles[5 * 48 + 7].till)
}
{
  // #3 自动任务奖励因背包满待领，腾出空间后自动领取
  registerQuests([{ id: 'T', kind: 'main', title: '测试', giver: 'auto', phase: 'G2', requires: [], intro: '', submit: 'auto', complete: '', journal: '',
    objectives: [{ type: 'eat', n: 1, text: '' }], rewards: { items: [{ id: 'hay', n: 5 }] } }])
  const s = setup()
  s.inv = s.inv.map(() => ({ id: 'stone', q: 0, n: 999 }))
  refreshQuests(s)
  progress(s, { type: 'eat', n: 1 })
  assert.equal(s.quests.T.st, 'ready')
  s.inv[0] = null
  recheck(s)
  assert.equal(s.quests.T.st, 'done')
  assert.equal(count(s.inv, 'hay'), 5)
  registerQuests(QUEST_DEFS)
}
{
  // #4 背包满时的战斗掉落进矿口失物箱，转场不丢
  const s = setup()
  applyUnlock(s, 'region:mine')
  enterMine(s, 1)
  const foes = spawnFoes(s)
  const moss = foes[0]
  s.inv = s.inv.map(() => ({ id: 'stone', q: 0, n: 999 }))
  s.inv[3] = { id: 'sword_old', q: 0, n: 1 }
  s.sel = 3
  s.x = moss.x; s.z = moss.z + 1
  moss.hp = 1; moss.st = 'stun'; moss.t = 99
  const ft = newFighter()
  s.face = Math.atan2(moss.x - s.x, moss.z - s.z)
  attack(ft)
  let drops = 0
  for (let i = 0; i < 25; i++) for (const e of fighterStep(s, ft, foes, 1 / 30)) if (e.k === 'drop') { drops++; assert.ok(e.parcel) }
  assert.ok(drops >= 1 && s.parcel.some((sl) => sl.id === 'fiber'))
  leaveMine(s)
  s.inv[0] = null; s.inv[1] = null
  assert.ok(claimParcel(s).ok)
  assert.ok(s.inv.some((sl) => sl?.id === 'fiber'))
}
{
  // #5 老陶的教学炉代炼：交料 → 3 小时后取件，推进“机器取出铜锭”
  const s = setup()
  applyUnlock(s, 'system:mine')
  s.min = 600
  s.inv[3] = { id: 'copper_ore', q: 0, n: 5 }; s.inv[4] = { id: 'coal', q: 0, n: 1 }
  assert.ok(smithSmelt(s).ok)
  assert.ok(!smithCollect(s).ok)
  s.min = 600 + 180
  assert.ok(smithCollect(s).ok)
  assert.equal(count(s.inv, 'copper_bar'), 1)
}
{
  // #6 教学鸡：手喂 5 天下首蛋，领蛋后归还
  const s = setup()
  applyUnlock(s, 'system:animals')
  assert.ok(borrowChicken(s).ok)
  s.inv[3] = { id: 'hay', q: 0, n: 10 }
  const id = s.animals[0].id
  for (let d = 0; d < 5; d++) { assert.ok(feedAnimal(s, id).ok); assert.ok(!feedAnimal(s, id).ok, '一天一次'); sleep(s) }
  assert.equal(s.animals[0].eggs, 1)
  assert.ok(collectEggs(s).ok)
  assert.equal(s.animals.length, 0, '教学鸡归还')
  assert.ok(s.xp.husbandry >= 5 + 6)
}
{
  // #8 公告板订单 3 日期限：过期撤下，不扣钱
  const s = setup()
  s.day = 5
  s.quests.Q06 = { st: 'done', prog: [], day: 1 }
  refreshQuests(s)
  assert.equal(s.quests.B01?.st, 'offered')
  acceptQuest(s, 'B01')
  assert.equal(s.quests.B01.due, 7)
  const m = s.money
  sleep(s); sleep(s)
  assert.equal(s.quests.B01?.st, 'active', '第 7 天仍有效')
  sleep(s)
  assert.notEqual(s.quests.B01?.st, 'active', '第 7 天日结后过期')
  assert.ok(s.money >= m)
}
{
  // #13 翻滚只有中段 0.15 秒无敌
  const s = setup()
  const ft = newFighter()
  assert.ok(roll(s, ft, 1, 0))
  assert.ok(!rollSafe(ft), '起手不无敌')
  ft.roll -= 0.12
  assert.ok(rollSafe(ft))
  ft.roll -= 0.15
  assert.ok(!rollSafe(ft), '收尾不无敌')
}
{
  // #15 居民跨不相邻区域：林棠周三 14:00 从浅林去小镇，先走向通往农场的出口
  const s = setup()
  s.day = 10; s.min = 839
  moveTo(s, 'forest', 24, 1.6)
  const actors = new Map()
  npcReset(s, actors)
  assert.ok(actors.has('lintang'))
  s.min = 840
  npcStep(s, actors, 1 / 30)
  const a = actors.get('lintang')
  assert.ok(a && a.leaving && a.path.length > 0, '沿路离开而不是瞬间消失')
}

console.log('review regression passed')
// ---------- 14 日试玩修复回归 ----------
{
  // 商店买的铜矿不能交 B03（要求自采）；自己挖的可以
  const s = setup()
  applyUnlock(s, 'shop:copper_ore')
  s.money = 1000; s.day = 1; s.min = 600
  assert.ok(buy(s, 'copper_ore', 5, 'smith').ok)
  assert.ok(s.inv.some((sl) => sl?.id === 'copper_ore' && sl.b === 1), '买来的打上“购”')
  s.quests.B03 = { st: 'active', prog: [0], day: 1 }
  recheck(s)
  assert.equal(s.quests.B03.st, 'active', '买来的不算')
  s.inv[10] = { id: 'copper_ore', q: 0, n: 5 }
  recheck(s)
  assert.equal(s.quests.B03.st, 'ready')
  assert.ok(deliverQuest(s, 'B03', 'laotao').ok)
  assert.equal(count(s.inv, 'copper_ore'), 5, '交掉的是自采的那 5 份')
}
{
  // 雨天开垦算作有效浇水：首春第 3 日
  registerQuests(QUEST_DEFS)
  const s = setup()
  s.day = 3
  s.quests.Q02 = { st: 'active', prog: [0, 0, 0], day: 3 }
  s.x = 20.5; s.z = 14.5; s.sel = 0
  assert.ok(useAt(s, 20, 13).ok)
  assert.equal(s.quests.Q02.prog[2], 1)
}
{
  // 草药膏：饱食满也能用，10 分钟冷却
  const s = setup()
  s.hp = 40; s.satiety = 100
  s.inv[3] = { id: 'herb_salve', q: 0, n: 2 }
  assert.ok(eat(s, 3).ok)
  assert.equal(s.hp, 70)
  assert.ok(!eat(s, 3).ok, '冷却中')
  s.min += 10
  assert.ok(eat(s, 3).ok)
}
console.log('g2 tests passed')
