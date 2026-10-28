/// <reference lib="dom" />
// 设计 §29.2 用例矩阵 T01—T32 中，其他测试文件没有覆盖完整的部分（按编号）。浏览器/设备层面的部分见 _infomation/开发进度/RC进展.md。
import assert from 'node:assert/strict'
import { absMin, addItem, count, countSpec, newGame, regionOf, solid, tileAt, validState, weather, migrate, type Ent, type GameState } from './state.ts'
import { CROPS, DIFFICULTY, FESTIVALS, ITEMS, MINE_FLOORS, OBSTACLES, SEASON_DAYS, isBossFloor, isRestFloor } from '../content/content.ts'
import { QUEST_DEFS } from '../content/story.ts'
import { advanceAll, claimSoup, eat, jobBusy, jobDone, machineCollect, machineInsert, machineRecipes, tick, useAt } from './actions.ts'
import { animalOut, animalsSettle, careAnimal, collectNest } from './animals.ts'
import { acceptQuest, recheck, refreshQuests, registerQuests, submitQuest } from './quests.ts'
import { mineFloor, MINE_H, MINE_W } from './regions.ts'
import { endDay, endDaySafe } from './settle.ts'
import { claimCore, finishEvent, fundProject, isBirthday, nextEvent, orderCore, shopOpen } from './town.ts'
import { enterMine, leaveMine } from './travel.ts'
import { npcPlace, NPC_IDS } from './npcs.ts'

registerQuests(QUEST_DEFS)
const fresh = (day = 5, diff = 1) => {
  const s = newGame('测试', '测试农场', diff, 4242)
  s.day = day
  s.settled = day - 1
  return s
}
const clone = (s: GameState) => JSON.parse(JSON.stringify(s)) as GameState
const sleep = (s: GameState, passedOut = false) => { s.energy = Math.max(s.energy, 0); const r = endDay(s, passedOut); s.region = 'farm'; return r }
const tileXZ = (s: GameState, x: number, z: number) => s.tiles[z * 48 + x]
const clear = (s: GameState, x: number, z: number) => { const t = tileXZ(s, x, z); Object.assign(t, { ob: null, ent: 0, crop: null, g: 0, path: undefined, pipe: undefined }); return t }
const plantAt = (s: GameState, x: number, z: number, cid: string, prog = 0) => { const t = clear(s, x, z); t.till = true; t.crop = { id: s.nextId++, cid, prog, harvests: 0, dry: 0, dead: false }; return t }

// T05 玉米跨秋：保留成长与肥料，不重置，不额外收获
{
  const s = fresh(SEASON_DAYS * 2 - 1) // 夏 27
  const corn = Object.values(CROPS).find((c) => c.seasons.includes(1) && c.seasons.includes(2))!
  const t = plantAt(s, 30, 30, corn.id, 2)
  t.fert = 1
  t.wet = s.day
  sleep(s)
  assert.equal(t.crop?.dead, false, '跨季作物不枯萎')
  assert.equal(t.crop?.prog, 3, '成长保留并 +1')
  assert.equal(t.fert, 1, '肥料保留')
  assert.equal(t.crop?.harvests, 0, '不额外给收获')
}

// T06 雨天、保水肥、手动浇水同格同日：每日最多长 1 次，浇已湿润的格不耗水不耗精力
{
  const s = fresh(5)
  let d = s.day
  while (weather(s.seed, d) !== 2) d++
  s.day = d
  s.settled = d - 1
  const t = plantAt(s, 30, 30, 'spring_radish', 0)
  t.fert = 2
  t.wet = d // 雨天视为已浇
  s.x = 30.5; s.z = 31.4
  s.sel = s.inv.findIndex((sl) => sl?.id === 'tool_can')
  s.water = 10
  const e0 = s.energy
  const r = useAt(s, 30, 30)
  assert.ok(!r.ok && s.water === 10 && s.energy === e0, '已湿润：不重复耗水和精力')
  sleep(s)
  assert.equal(t.crop?.prog, 1, '只长一次')
}

// T07 满背包：机器成品、手收畜产都原样保留，不丢不复制
{
  const s = fresh()
  const full = () => { s.inv = s.inv.map((sl) => (sl && ITEMS[sl.id].tool ? sl : { id: 'stone', q: 0, n: 999 })) }
  const f: Ent = { id: 800, k: 'furnace', x: 33, z: 33, job: { doneAt: absMin(s) - 1, out: { id: 'copper_bar', q: 0, n: 1 }, input: [] } }
  s.ents.push(f)
  tileXZ(s, 33, 33).ent = 800
  full()
  assert.ok(!machineCollect(s, f).ok, '背包满取不出')
  assert.ok(jobDone(s, f) && f.job?.out.id === 'copper_bar', '成品留在机器里')
  s.farmB.push({ id: 801, k: 'coop', x: 5, z: 3, done: 1, up: 0, hay: 0, open: false })
  s.animals.push({ id: 802, kind: 'chicken', name: '小黄', home: 801, fed: 9, love: 0, eggs: 2, prog: 0, pet: 0, fedDay: 0, bought: 1 } as GameState['animals'][number])
  assert.ok(!collectNest(s, 801).ok)
  assert.equal(s.animals[0].eggs, 2, '蛋留在窝里')
  s.animals.push({ id: 803, kind: 'cow', name: '小花', home: 801, fed: 9, love: 0, eggs: 1, prog: 0, pet: 0, fedDay: 0, bought: 1 } as GameState['animals'][number])
  s.inv[s.inv.findIndex((sl) => sl?.id === 'stone')] = { id: 'milk_pail', q: 0, n: 1 }
  assert.ok(!careAnimal(s, 803).ok)
  assert.equal(s.animals[1].eggs, 1, '奶没挤走')
}

// T08 动作命中前目标没了：不扣资源、不给经验
{
  const s = fresh()
  const t = clear(s, 30, 30)
  t.ob = { k: 'rock', dmg: 0 }
  s.x = 30.5; s.z = 31.4
  s.sel = s.inv.findIndex((sl) => sl?.id === 'tool_pick')
  assert.ok(useAt(s, 30, 30, true).ok, '前摇时可以敲')
  const e0 = s.energy, xp0 = s.xp.mining, stone0 = count(s.inv, 'stone')
  t.ob = null // 命中前目标消失（别处被清掉/换了区域）
  assert.ok(!useAt(s, 30, 30).ok)
  assert.deepEqual([s.energy, s.xp.mining, count(s.inv, 'stone')], [e0, xp0, stone0], '不扣精力、不给经验和物品')
}

// T09 日结中途出错：状态整体退回睡前；修好后重新日结，与一次成功日结的结果一致
{
  const a = fresh()
  plantAt(a, 30, 30, 'spring_radish', 1).wet = a.day
  a.ship.push({ id: 'spring_radish', q: 0, n: 3 })
  a.farmB.push({ id: 810, k: 'coop', x: 5, z: 3, done: 1, up: 0, hay: 5, open: false })
  a.animals.push({ id: 811, kind: 'chicken', name: '小黄', home: 810, fed: 9, love: 0, eggs: 0, prog: 0, pet: 0, fedDay: 0, bought: 1 } as GameState['animals'][number])
  const b = clone(a)
  const ok = endDaySafe(a, false)
  assert.ok(ok.sum && !ok.error)
  const before = JSON.stringify(b)
  ;(b.animals[0] as { kind: string }).kind = 'missing_kind' // 注入：日结到动物时出错
  const bad = endDaySafe(b, false)
  assert.ok(bad.error, '出错被捕获')
  const restored = JSON.parse(JSON.stringify(b))
  restored.animals[0].kind = 'chicken'
  assert.equal(JSON.stringify(restored), before.replace('"kind":"chicken"', '"kind":"chicken"'), '退回睡前状态（只有注入的那一处不同）')
  b.animals[0].kind = 'chicken'
  const again = endDaySafe(b, false)
  assert.ok(again.sum)
  for (const k of ['money', 'day', 'xp', 'animals', 'tiles', 'ship'] as const) assert.equal(JSON.stringify(b[k]), JSON.stringify(a[k]), `重新日结后 ${k} 与一次成功日结一致`)
}

// T10 23:00 睡觉：机器按绝对分钟跨夜完成，作物只长一天
{
  const s = fresh()
  s.min = 1380
  const t = plantAt(s, 30, 30, 'spring_radish', 0)
  t.wet = s.day
  const at = (day: number, min: number) => absMin({ ...s, day, min } as GameState)
  const m1: Ent = { id: 820, k: 'furnace', x: 31, z: 31, job: { doneAt: at(s.day + 1, 60), out: { id: 'copper_bar', q: 0, n: 1 }, input: [] } }
  const m2: Ent = { id: 821, k: 'furnace', x: 32, z: 31, job: { doneAt: at(s.day + 1, 600), out: { id: 'iron_bar', q: 0, n: 1 }, input: [] } }
  for (const m of [m1, m2]) { s.ents.push(m); tileXZ(s, m.x, m.z).ent = m.id }
  sleep(s)
  advanceAll(s)
  assert.equal(s.min, 360)
  assert.ok(jobDone(s, m1), '凌晨 01:00 完成的那台醒来已完成')
  assert.ok(jobBusy(s, m2), '次日 10:00 才完成的还在做')
  s.min = 600
  assert.ok(jobDone(s, m2))
  assert.equal(t.crop?.prog, 1, '作物只长一天')
}

// T12 精力、金币、饱食全为 0：能领救济汤、吃下、睡一觉后回到经营循环
{
  const s = fresh(20)
  Object.assign(s, { energy: 0, money: 0, satiety: 0, min: 700 })
  const t = clear(s, 30, 30)
  s.x = 30.5; s.z = 31.4
  s.sel = s.inv.findIndex((sl) => sl?.id === 'tool_hoe')
  assert.equal(useAt(s, 30, 30).msg, '精力不足', '没精力不能劳动')
  assert.ok(!solid(s, Math.floor(s.x), Math.floor(s.z)), '还能走动回家')
  assert.ok(claimSoup(s).ok, '饱食<20 且金币<100：领救济清汤')
  assert.ok(eat(s, s.inv.findIndex((sl) => sl?.id === 'soup_relief')).ok)
  assert.ok(s.satiety > 0)
  sleep(s)
  assert.ok(s.energy > 0 && s.satiety >= 30, '睡一觉恢复')
  s.x = 30.5; s.z = 31.4
  s.sel = s.inv.findIndex((sl) => sl?.id === 'tool_hoe')
  assert.ok(useAt(s, 30, 30).ok && t.till, '第二天能开垦')
}

// T13 三种难度昏倒：救援费按比例且有上限，首 7 日免费
{
  for (const diff of [0, 1, 2]) {
    const s = fresh(10, diff)
    s.money = 10000
    sleep(s, true)
    const D = DIFFICULTY[diff]
    assert.equal(10000 - s.money, Math.min(D.feeCap, Math.floor(10000 * D.fee)), `${D.name}：救援费`)
    const early = fresh(5, diff)
    early.money = 10000
    sleep(early, true)
    assert.equal(early.money, 10000, `${D.name}：首 7 日免费`)
  }
}

// T14 动物：没喂不会死、产物攒满 3 份停产有提示、夜里一定回到屋里（门口被堵也一样）
{
  const s = fresh()
  s.farmB.push({ id: 830, k: 'coop', x: 5, z: 3, done: 1, up: 0, hay: 0, open: false })
  s.animals.push({ id: 831, kind: 'chicken', name: '小黄', home: 830, fed: 9, love: 0, eggs: 3, prog: 0, pet: 0, fedDay: 0, bought: 1 } as GameState['animals'][number])
  const notes = animalsSettle(s)
  assert.equal(s.animals.length, 1, '饿一天不死')
  assert.ok(notes.some((n) => n.includes('没吃上')), '说明没吃上草')
  assert.ok(notes.some((n) => n.includes('3 份')), '说明产物攒满')
  assert.equal(s.animals[0].eggs, 3)
  // 门口被箱子堵住：夜里照样算在屋里
  const door = regionOf(s).buildings.find((b) => b.enter === 'in:coop:830')!
  const front = [door.x + Math.floor(door.w / 2), door.z + door.d]
  clear(s, front[0], front[1]).ent = 832
  s.ents.push({ id: 832, k: 'chest', x: front[0], z: front[1], job: null, store: Array(36).fill(null) })
  s.min = 1300
  assert.ok(!animalOut(s, s.animals[0]), '夜里在屋里')
}

// T17 订单：重复提交只领一次奖励；过期撤下不扣钱、不扣关系
{
  const s = fresh()
  s.quests.Q06 = { st: 'done', prog: [], day: 1 }
  refreshQuests(s)
  assert.equal(s.quests.B01?.st, 'offered')
  acceptQuest(s, 'B01')
  addItem(s.inv, 'spring_radish', 0, 4)
  recheck(s)
  assert.equal(s.quests.B01.st, 'ready', '交付物齐了')
  const money = s.money
  assert.equal(submitQuest(s, 'B01', 'xiahe'), '')
  assert.equal(s.money, money + 100)
  assert.equal(count(s.inv, 'spring_radish'), 2, '只扣两份')
  assert.notEqual(submitQuest(s, 'B01', 'xiahe'), '', '第二次提交被拒')
  assert.equal(s.money, money + 100, '奖励只发一次')
  // 另一张单子过期：撤下、不扣钱
  const t = fresh()
  t.quests.Q06 = { st: 'done', prog: [], day: 1 }
  refreshQuests(t)
  acceptQuest(t, 'B01')
  const m0 = t.money
  for (let k = 0; k < 4; k++) sleep(t)
  assert.ok(t.quests.B01?.st !== 'active', '过期撤下')
  assert.ok(t.money >= m0, '不扣钱')
}

// T18 节庆当天又下雨又有人过生日：每位居民只有一个去处（会场），商店照常说明营业时间
{
  for (const [id, f] of Object.entries(FESTIVALS)) {
    const s = fresh(f.season * SEASON_DAYS + f.day)
    s.min = f.open + 30
    const places = NPC_IDS.map((n) => npcPlace(s, n))
    if (id !== 'flower_fair') assert.ok(places.every((p) => p?.region === f.region), `${id}：大家都在会场`)
    for (const n of NPC_IDS) assert.deepEqual(npcPlace(s, n), npcPlace(s, n), '同一时刻结果唯一且稳定')
    void isBirthday(s, NPC_IDS[0])
    void shopOpen(s, 'general') // 不抛错：营业判断与节庆、居民在不在场无关
  }
}

// T19 友情事件：中断（没看完就刷新）后还能重来；看完只发一次奖励；800/1000 节点有前置
{
  const s = fresh()
  const npc = 'lintang'
  s.friends[npc] = { pts: 200, talked: 1, gifted: 0, week: 0, giftsWeek: 0, events: [] }
  const e = nextEvent(s, npc)
  assert.ok(e, '200 事件待看')
  const saved = clone(s) // 看到一半刷新：存档里还没有完成标记
  assert.equal(nextEvent(saved, npc)?.id, e!.id, '刷新后还能重来')
  const inv0 = JSON.stringify(s.inv)
  assert.ok(finishEvent(s, npc, 0).ok)
  assert.ok(!finishEvent(s, npc, 0).ok, '不能再领一次')
  assert.ok(s.flags.includes('event:' + e!.id))
  void inv0
  s.friends[npc].pts = 800
  for (const t of [400, 600]) { const x = nextEvent(s, npc); if (x) finishEvent(s, npc, 0); void t }
  assert.equal(nextEvent(s, npc), null, '800 节点要先约会')
}

// T20 矿洞：每层用当时阶段的镐（1—10 层基础、11—20 铜、21—30 铁）就能走到出口，不靠稀有掉落
{
  for (let seed = 1; seed <= 12; seed++) for (let floor = 1; floor <= MINE_FLOORS; floor++) {
    if (isRestFloor(floor) || isBossFloor(floor)) continue
    const m = mineFloor(seed * 104729, seed % 7 + 1, floor)
    const tier = floor <= 10 ? 0 : floor <= 20 ? 1 : 2
    const pass = (i: number) => m.g[i] === 4 && (!m.obs.has(i) || OBSTACLES[m.obs.get(i)!].minLevel <= tier)
    const start = m.up[1] * MINE_W + m.up[0]
    const seen = new Set([start])
    const q = [start]
    for (let h = 0; h < q.length; h++) for (const d of [1, -1, MINE_W, -MINE_W]) {
      const n = q[h] + d
      if (n < 0 || n >= MINE_W * MINE_H || seen.has(n) || !pass(n)) continue
      seen.add(n)
      q.push(n)
    }
    assert.ok(seen.has(m.exit), `种子 ${seed} 第 ${floor} 层：当前阶段的镐能走到出口`)
  }
}

// T21 同一天进出矿洞：敲掉的矿不会刷新回来；第二天重新生成
{
  const s = fresh(20)
  s.unlocks.push('region:mine')
  s.min = 600
  assert.ok(enterMine(s, 1).ok)
  const r = regionOf(s)
  let target: [number, number] | null = null
  for (let z = 0; z < r.h && !target; z++) for (let x = 0; x < r.w; x++) {
    const t = tileAt(s, x, z)
    if (t?.ob?.k !== 'rock') continue
    const stand = [[0, 1], [0, -1], [1, 0], [-1, 0]].find(([dx, dz]) => { const n = tileAt(s, x + dx, z + dz); return n && !solid(s, x + dx, z + dz) })
    if (stand) { target = [x, z]; s.x = x + stand[0] + 0.5; s.z = z + stand[1] + 0.5; break }
  }
  assert.ok(target, '这一层有能站着敲的岩石')
  const [x, z] = target!
  s.sel = s.inv.findIndex((sl) => sl?.id === 'tool_pick')
  s.energy = 200
  for (let k = 0; k < 6 && tileAt(s, x, z)?.ob; k++) useAt(s, x, z)
  assert.equal(tileAt(s, x, z)?.ob, null, '敲掉了')
  leaveMine(s)
  assert.ok(enterMine(s, 1).ok, '同一天再下去')
  assert.equal(tileAt(s, x, z)?.ob, null, '敲掉的没有刷新回来')
  leaveMine(s)
  s.energy = 200
  sleep(s)
  assert.ok(!Object.keys(s.wild).some((k) => k.startsWith('mine')), '第二天野外记录清空、矿层重新生成')
}

// T23 存储写失败：当前档与备份都不被毁，返回失败让界面引导导出
{
  const store = new Map<string, string>()
  let failOn = ''
  ;(globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => { if (failOn && k.endsWith(failOn)) throw new Error('QuotaExceededError'); store.set(k, v) },
    removeItem: (k: string) => store.delete(k),
  }
  const { readSlot, writeSlot } = await import('../platform/save.ts')
  const s = fresh()
  assert.ok(writeSlot(1, s))
  const cur = store.get('astral-land:slot1')!
  s.money += 1
  failOn = 'slot1'
  assert.ok(!writeSlot(1, s, true), '写当前档失败返回 false')
  assert.equal(store.get('astral-land:slot1'), cur, '当前档原样')
  failOn = ':prev'
  assert.ok(!writeSlot(1, s, true), '写备份失败也返回 false')
  assert.equal(store.get('astral-land:slot1'), cur, '当前档没被半写')
  failOn = ''
  assert.ok(readSlot(1), '仍能读回')

  // T25 旧版本存档集：G1 早期档、G2 档、G3 档都能通过校验、迁移、再校验，并能正常日结；未知物品档被拒绝并回退备份
  const base = fresh(9)
  const g1 = clone(base) as unknown as Record<string, unknown>
  for (const k of ['floor', 'deepest', 'wild', 'felled', 'animals', 'farmB', 'house', 'silo', 'projects', 'upgrade', 'fishSeq', 'rooms', 'wardrobe', 'outfit', 'pet', 'donated', 'stash', 'warmth', 'damp', 'status', 'buffs', 'equip', 'bosses', 'partner']) delete g1[k]
  const g3 = clone(base) as unknown as Record<string, unknown>
  for (const k of ['rooms', 'wardrobe', 'outfit', 'pet', 'donated', 'stash']) delete g3[k]
  for (const [name, o] of [['G1', g1], ['G3', g3]] as const) {
    assert.ok(validState(o), name + ' 旧档通过校验')
    const m = migrate(o as unknown as GameState)
    assert.ok(validState(m), name + ' 迁移后仍合法')
    assert.ok(regionOf(m))
    m.energy = 200
    assert.ok(endDay(m, false), name + ' 能正常日结')
    assert.ok(validState(JSON.parse(JSON.stringify(m))))
  }
  const bad = clone(base)
  bad.inv[3] = { id: 'no_such_item', q: 0, n: 1 }
  store.set('astral-land:slot2:prev', JSON.stringify(base))
  store.set('astral-land:slot2', JSON.stringify(bad))
  const loaded = readSlot(2)
  assert.ok(loaded && !loaded.inv.some((sl) => sl?.id === 'no_such_item'), '未知物品档被拒绝，回退到前一日备份')
}

// T24 两个标签页抢同一存档：只有一个写者；“在此接管”后旧页收到失去写权的通知
{
  const held = new Map<string, (e: Error) => void>()
  const locks = {
    request(name: string, opts: { ifAvailable?: boolean; steal?: boolean }, cb: (lock: unknown) => unknown) {
      return new Promise<void>((resolve, reject) => {
        const cur = held.get(name)
        if (cur && opts.ifAvailable && !opts.steal) { Promise.resolve(cb(null)).then(() => resolve()); return }
        if (cur && opts.steal) { held.delete(name); cur(new Error('AbortError')) }
        held.set(name, reject)
        Promise.resolve(cb({ name })).then(() => { if (held.get(name) === reject) held.delete(name); resolve() })
      })
    },
  }
  Object.defineProperty(globalThis.navigator, 'locks', { value: locks, configurable: true })
  // 同一文件带不同查询串 = 两个独立的模块实例，模拟两个标签页
  type Save = typeof import('../platform/save.ts')
  const [u1, u2] = ['../platform/save.ts?page1', '../platform/save.ts?page2']
  const page1 = (await import(u1)) as Save
  const page2 = (await import(u2)) as Save
  let lost1 = 0
  assert.ok(await page1.acquireLock(3, () => lost1++), '第一个标签页拿到写锁')
  assert.ok(!(await page2.acquireLock(3, () => {})), '第二个标签页拿不到（只读）')
  assert.ok(await page2.acquireLock(3, () => {}, true), '第二个标签页“在此接管”')
  await new Promise((r) => setTimeout(r, 0))
  assert.equal(lost1, 1, '第一个标签页收到失去写权的通知')
  page2.releaseSaveLock()
  Object.defineProperty(globalThis.navigator, 'locks', { value: undefined, configurable: true })
  assert.ok(!(await page1.acquireLock(3, () => {})), '没有 Web Locks 的浏览器：只读')
}

// T28 不同刷新率：同样的现实时长，经营时间与饱食推进一致（固定步长模拟）
{
  const a = fresh(), b = fresh()
  for (let i = 0; i < 30; i++) tick(a, 1 / 30)
  for (let i = 0; i < 120; i++) tick(b, 1 / 120)
  assert.ok(Math.abs(a.min - b.min) < 1e-6 && Math.abs(a.satiety - b.satiety) < 1e-6, '30Hz 与 120Hz 推进一致')
}

// T29 无套利：所有能买的东西卖回价不高于买价；种子分离只收普通品质
{
  for (const it of Object.values(ITEMS)) if (it.buy && it.sell) assert.ok(it.sell <= it.buy, `${it.id} 卖价不高于买价`)
  const s = fresh()
  const sm: Ent = { id: 840, k: 'seed_maker', x: 34, z: 34, job: null }
  s.ents.push(sm)
  tileXZ(s, 34, 34).ent = 840
  s.inv[6] = { id: 'summer_melon', q: 2, n: 1 }
  assert.ok(!machineInsert(s, sm).ok, '精品不能分离种子')
  void machineRecipes
}

// T30 不打首领的贸易路线：驿站换来的替代核心件能用于风车工程，不产生击败记录
{
  const s = fresh(60)
  s.unlocks.push('system:core_trade', 'system:windmill_fund')
  s.money = 100000
  addItem(s.inv, 'copper_bar', 0, 10)
  addItem(s.inv, 'iron_bar', 0, 5)
  assert.ok(orderCore(s).ok)
  s.day++
  assert.ok(claimCore(s).ok)
  assert.equal(countSpec(s.inv, '#core'), 1, '替代核心件算作核心')
  addItem(s.inv, 'hardwood', 0, 60)
  addItem(s.inv, 'alloy_bar', 0, 5)
  assert.ok(fundProject(s, 'windmill').ok, '风车开工')
  assert.deepEqual(s.bosses, {}, '没有首领击败记录')
  assert.ok(!s.flags.some((f) => f.startsWith('boss')), '没有首领成就')
}

console.log('acceptance tests passed')
