// G4 系统自检：室内地图、动物住在畜舍里、家具与装饰、多树种与树种子、捐赠与愿望、七场节庆、可预约的仪式。
import assert from 'node:assert/strict'
import { CEREMONIES, FESTIVALS, ITEMS, SEASON_DAYS } from '../content/content.ts'
import { DECORS } from '../content/g4.ts'
import { WISHES } from './wishes.ts'
import { eat, useAt } from './actions.ts'
import { demolish } from './buildings.ts'
import { outfitFiles, putOn } from './wardrobe.ts'
import { animalStep, type AnimalActor } from './animals.ts'
import { donate, donatedCount, DONATE_REWARDS } from './collection.ts'
import { INTERIOR_PROPS, ROOM_KINDS } from './interiors.ts'
import { npcPlace, NPC_IDS } from './npcs.ts'
import { objectiveProgress, questDef, refreshQuests, registerQuests } from './quests.ts'
import { QUEST_DEFS } from '../content/story.ts'
registerQuests(QUEST_DEFS)
import { BASE_REGIONS, doorOfBuilding, FEST_LAYOUTS, treeSpecies, WALKABLE } from './regions.ts'
import { endDay } from './settle.ts'
import { addItem, ceremonyToday, entsOf, raining, migrate, newGame, regionOf, solid, tileAt, validState, type GameState } from './state.ts'
import { shopStock, bookCeremony, cancelFeast, festivalNow, findMarker, finishFestival, fireflyFound, holdCeremony, leaveFestival, stashFeast } from './town.ts'
import { corridorAt, exitAt, moveTo } from './travel.ts'
import { chooseWish, claimTier, wishOf } from './wishes.ts'
import { placeablesSettle } from './placeables.ts'
import { adoptPet, fillBowl, petPet, petStep } from './pets.ts'

const fresh = (day = 1) => {
  const s = newGame('测试', '测试农场', 1, 4242)
  s.day = day
  s.settled = day - 1
  return s
}
const give = (s: GameState, slot: number, id: string, n = 1) => { s.inv[slot] = { id, q: 0, n }; s.sel = slot }
const hold = (s: GameState, id: string) => { s.sel = s.inv.findIndex((sl) => sl?.id === id) } // 背包里已有的工具
const at = (s: GameState, x: number, z: number) => { s.x = x + 0.5; s.z = z + 1.5 }
const roundTrip = (s: GameState) => { const o = JSON.parse(JSON.stringify(s)); assert.ok(validState(o), '存档校验'); migrate(o); assert.ok(validState(o)) }

// 室内地图：所有公共室内与家宅都能生成；出生点、互动点旁、居民站位都能走到；门格通回室外
{
  const s = fresh(10)
  for (const k of [...ROOM_KINDS.map((k) => 'in:' + k), 'in:house']) {
    const r = regionOf({ ...s, region: k } as GameState)
    assert.ok(r, k + ' 能生成')
    moveTo(s, k as GameState['region'], r.spawn[0], r.spawn[1])
    assert.ok(!solid(s, Math.floor(r.spawn[0]), Math.floor(r.spawn[1])), k + ' 出生点可走')
    for (const b of r.buildings) {
      const ok = [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dz]) => { for (let z = b.z; z < b.z + b.d; z++) for (let x = b.x; x < b.x + b.w; x++) if (!solid(s, x + dx, z + dz)) return true; return false })
      assert.ok(ok, `${k} 的 ${b.name} 旁有可站的格子`)
    }
    for (const [name, p] of Object.entries(r.spots)) assert.ok(p.hidden || p.sit || !solid(s, Math.floor(p.x), Math.floor(p.z)), `${k} 站位 ${name} 可走`)
    const e = r.exits[0]
    assert.ok(e && WALKABLE(r.ground(e.x0, e.z0)), k + ' 门格')
    assert.ok(regionOf({ ...s, region: e.to } as GameState), k + ' 门外')
  }
  assert.ok(INTERIOR_PROPS.length > 60)
  assert.ok(BASE_REGIONS().length > 20, '预载用的区域表（含全部会场）能生成')
  // 在家里醒来
  s.energy = 200
  endDay(s, false)
  assert.equal(s.region, 'in:house')
  assert.ok(!solid(s, Math.floor(s.x), Math.floor(s.z)))
}

// 居民的店内站位：林棠白天在杂货店里柜台后
{
  const s = fresh(2)
  s.min = 600
  const p = npcPlace(s, 'lintang')!
  assert.equal(p.region, 'in:general')
}

// 动物住在禽舍里：关门或夜里在屋里，开门的晴天白天到院子
{
  const s = fresh(2)
  s.farmB.push({ id: 900, k: 'coop', x: 5, z: 3, done: 1, up: 0, hay: 3, open: false })
  s.animals.push({ id: 901, kind: 'chicken', name: '小黄', home: 900, fed: 9, love: 0, eggs: 1, prog: 0, pet: 0, fedDay: 0 } as GameState['animals'][number])
  s.min = 600
  const actors = new Map<number, AnimalActor>()
  moveTo(s, 'farm', 24, 12)
  animalStep(s, actors, 0.1)
  assert.equal(actors.size, 0, '关着门：院子里没有鸡')
  moveTo(s, 'in:coop:900', 5, 5)
  animalStep(s, actors, 0.1)
  assert.equal(actors.size, 1, '屋里有鸡')
  const c = actors.get(901)!
  assert.ok(!solid(s, Math.floor(c.x), Math.floor(c.z)))
  s.farmB[0].open = true
  animalStep(s, actors, 0.1)
  assert.equal(actors.size, 0, '开门的白天：鸡出去了')
  s.min = 1300
  animalStep(s, actors, 0.1)
  assert.equal(actors.size, 1, '夜里回到屋里')
}

// 家具与装饰：多格占地、地毯不挡路、桌面小物件、贴墙挂件、室内室外限制、收回
{
  const s = fresh(5)
  moveTo(s, 'in:house', 5, 6)
  at(s, 6, 5)
  give(s, 5, 'rug_small')
  assert.ok(useAt(s, 6, 6).ok, '地毯')
  assert.ok(!solid(s, 6, 6), '地毯不挡路')
  const stand = () => { s.x = 2.5; s.z = 5.5 }
  stand()
  give(s, 5, 'table_dining')
  assert.ok(useAt(s, 2, 6).ok, '2×1 餐桌')
  assert.ok(solid(s, 2, 6) && solid(s, 3, 6), '餐桌占两格')
  give(s, 6, 'lamp_table')
  assert.ok(useAt(s, 3, 6).ok, '台灯摆上桌')
  assert.equal(entsOf(s).find((e) => e.k === 'table_dining')?.top, 'lamp_table')
  give(s, 7, 'decor_bench_stone')
  assert.ok(useAt(s, 1, 6).msg?.includes('农场'), '户外摆设不能摆进屋')
  give(s, 7, 'painting_wall')
  assert.ok(useAt(s, 3, 5).msg?.includes('墙'), '挂画要贴墙')
  at(s, 3, 0)
  assert.ok(useAt(s, 3, 1).ok, '挂在北墙')
  assert.ok(!solid(s, 3, 1), '挂件不挡路')
  roundTrip(s)
  stand()
  hold(s, 'tool_axe')
  assert.ok(useAt(s, 2, 6).ok)
  assert.equal(entsOf(s).find((e) => e.k === 'table_dining')?.top, undefined, '先收桌上的台灯')
  assert.ok(useAt(s, 2, 6).ok, '再收餐桌')
  assert.ok(!solid(s, 2, 6) && !solid(s, 3, 6))
  // 农场：2×2 喷泉
  moveTo(s, 'farm', 24, 13)
  const fx = 30, fz = 16
  for (let z = fz; z < fz + 2; z++) for (let x = fx; x < fx + 2; x++) { const t = tileAt(s, x, z)!; t.ob = null; t.till = false; t.g = 0; t.path = undefined; t.ent = 0 }
  s.x = fx - 0.5
  s.z = fz + 0.5
  give(s, 5, 'decor_fountain')
  const r = useAt(s, fx, fz)
  assert.ok(r.ok, '喷泉 ' + r.msg)
  assert.ok([[0, 0], [1, 0], [0, 1], [1, 1]].every(([dx, dz]) => tileAt(s, fx + dx, fz + dz)!.ent), '喷泉占 2×2')
  roundTrip(s)
  assert.ok(DECORS.length >= 70 && DECORS.every((d) => ITEMS[d.id]?.place === d.id))
}

// 多树种：同一坐标树种固定，各区域构成不同；砍农场的树留下同树种的树桩；树种子 12 天长成大树
{
  assert.equal(treeSpecies('forest', 5, 7), treeSpecies('forest', 5, 7))
  const kinds = (r: string) => new Set(Array.from({ length: 400 }, (_, i) => treeSpecies(r, i % 20, Math.floor(i / 20))))
  assert.ok(kinds('mountain').has('pine') && !kinds('mountain').has('willow'))
  assert.ok(kinds('river').has('willow'))
  const s = fresh(5)
  moveTo(s, 'farm', 24, 13)
  const tx = 34, tz = 22
  for (let z = tz - 1; z <= tz + 1; z++) for (let x = tx - 1; x <= tx + 1; x++) { const t = tileAt(s, x, z)!; t.ob = null; t.till = false; t.g = 0; t.ent = 0 }
  at(s, tx, tz)
  give(s, 5, 'seed_maple', 2)
  assert.ok(useAt(s, tx, tz).ok, '种下枫树种子')
  const e = s.ents.find((x) => x.k === 'wild_tree')!
  assert.equal(e.tree, 'maple')
  for (let d = 0; d < 12; d++) placeablesSettle(s, 5 + d, 6 + d)
  assert.equal(tileAt(s, tx, tz)!.ob?.k, 'tree')
  assert.equal(tileAt(s, tx, tz)!.ob?.sp, 'maple')
  assert.ok(!s.ents.some((x) => x.k === 'wild_tree'))
  hold(s, 'tool_axe')
  s.energy = 200
  for (let i = 0; i < 12 && tileAt(s, tx, tz)!.ob?.k === 'tree'; i++) useAt(s, tx, tz)
  assert.deepEqual([tileAt(s, tx, tz)!.ob?.k, tileAt(s, tx, tz)!.ob?.sp], ['stump', 'maple'])
  roundTrip(s)
}

// 捐赠：每种只收一次，背包少一件，满 5 件回赠装饰；图鉴不消耗
{
  const s = fresh(5)
  const ids = ['spring_radish', 'spring_lettuce', 'spring_carrot', 'spring_pea', 'spring_cauliflower']
  ids.forEach((id, i) => addItem(s.inv, id, 0, 2 - (i ? 1 : 0)))
  assert.ok(donate(s, ids[0]).ok)
  assert.ok(!donate(s, ids[0]).ok, '同一种只收一次')
  assert.equal(s.inv.find((sl) => sl?.id === ids[0])?.n, 1)
  for (const id of ids.slice(1)) assert.ok(donate(s, id).ok)
  assert.equal(donatedCount(s), 5)
  assert.ok(s.inv.some((sl) => sl?.id === DONATE_REWARDS[0][1]), '满 5 件的回赠')
  roundTrip(s)
}

// 愿望簿：登记可改选、Q24 的旗标目标；达成才可领取装饰
{
  const s = fresh(5)
  assert.ok(chooseWish(s, 'river').ok)
  assert.ok(chooseWish(s, 'garden').ok)
  assert.equal(wishOf(s), 'garden')
  assert.equal(s.flags.filter((f) => f.startsWith('wish:')).length, 1)
  assert.ok(!claimTier(s, 'river', 0).ok, '没钓够不能领')
  for (const id of ['fish_silverscale', 'fish_grasscarp', 'fish_bluecarp', 'fish_spottrout', 'fish_rainbarbel', 'fish_lampfish', 'fish_redtail', 'fish_yellowperch']) s.found[id] = 1
  assert.ok(claimTier(s, 'river', 0).ok)
  assert.ok(s.inv.some((sl) => sl?.id === WISHES.find((w) => w.id === 'river')!.tiers[0].reward))
  assert.ok(!claimTier(s, 'river', 0).ok, '只领一次')
}

// 七场节庆：日期、会场、居民聚集、结算推进时间、年度奖励只给一次外观
{
  for (const [id, f] of Object.entries(FESTIVALS)) {
    const s = fresh(f.season * SEASON_DAYS + f.day)
    s.min = f.open
    const n = festivalNow(s)
    assert.equal(n?.id, id, id + ' 当天')
    if (id === 'flower_fair') continue
    assert.ok(FEST_LAYOUTS[id], id + ' 会场布置')
    const r = regionOf({ ...s, region: f.region } as GameState)
    assert.ok(r.buildings.some((b) => b.act === 'booth'), id + ' 小游戏入口')
    const places = NPC_IDS.map((k) => npcPlace(s, k)!)
    assert.ok(places.every((p) => p.region === f.region), id + ' 全镇都在会场')
    assert.equal(new Set(places.map((p) => p.key)).size, NPC_IDS.length, id + ' 站位不重叠')
    moveTo(s, f.region as GameState['region'], 2, 2)
    for (const p of places) assert.ok(!solid(s, Math.floor(p.at.x), Math.floor(p.at.z)), `${id} 站位 (${p.at.x},${p.at.z}) 可走`)
    assert.ok(finishFestival(s, id, 99, '').ok)
    assert.ok(s.flags.includes('festival:' + id))
    assert.equal(s.min, f.end)
    assert.ok(!finishFestival(s, id, 99, '').ok, '同一年只结算一次')
  }
  const s = fresh(SEASON_DAYS + 22)
  s.min = 1100
  assert.ok(findMarker(s, 0).ok && !findMarker(s, 0).ok && findMarker(s, 1).ok && findMarker(s, 2).ok)
  assert.equal(fireflyFound(s), 3)
  const t = fresh(22)
  t.min = 700
  leaveFestival(t, 'fishing_derby', 700)
  assert.equal(t.min, 760, '没参加就离场：入场 +60 分钟')
}

// 仪式：预约下一个安全日（不撞节庆）；Q23 料理先暂存，计入交付；举行后可以交任务；取消原样退还
{
  const s = fresh(SEASON_DAYS + 3)
  s.quests.Q22 = { st: 'active', prog: [0], day: s.day }
  assert.ok(bookCeremony(s, 'windmill_ceremony').ok)
  assert.ok(!bookCeremony(s, 'windmill_ceremony').ok, '已经约过')
  const d = Number(s.flags.find((f) => f.startsWith('book:windmill_ceremony:'))!.split(':')[2])
  assert.ok(d > s.day && !Object.values(FESTIVALS).some((f) => f.season === 1 && f.day === d - SEASON_DAYS))
  s.day = d
  s.min = CEREMONIES.windmill_ceremony.open
  assert.equal(ceremonyToday(s), 'windmill_ceremony')
  assert.equal(festivalNow(s)?.cer, true)
  assert.equal(npcPlace(s, 'anbo')!.region, 'highland')
  assert.ok(holdCeremony(s, 'windmill_ceremony').ok)
  assert.ok(s.flags.includes('event:windmill_ceremony'))
  assert.equal(ceremonyToday(s), '')

  s.quests.Q23 = { st: 'active', prog: [0, 0, 0, 0], day: s.day }
  addItem(s.inv, 'soup_clear', 0, 1)
  addItem(s.inv, 'bread', 0, 1)
  assert.ok(!stashFeast(s).ok, '还差鱼蛋奶类')
  addItem(s.inv, 'egg_fried', 0, 1)
  const st1 = stashFeast(s)
  assert.ok(st1.ok, st1.msg + JSON.stringify(s.quests.Q23))
  assert.ok(!s.inv.some((sl) => sl && ['soup_clear', 'bread', 'egg_fried'].includes(sl.id)), '料理进了暂存')
  const q = questDef('Q23')!
  assert.deepEqual([0, 1, 2].map((i) => objectiveProgress(s, q, i)[0]), [1, 1, 1], '暂存计入交付')
  roundTrip(s)
  assert.ok(cancelFeast(s).ok)
  assert.equal(s.inv.filter((sl) => sl && ['soup_clear', 'bread', 'egg_fried'].includes(sl.id)).length, 3, '原样退还')
  assert.ok(stashFeast(s).ok)
  const fd = Number(s.flags.find((f) => f.startsWith('book:long_table_feast:'))!.split(':')[2])
  s.day = fd
  s.min = CEREMONIES.long_table_feast.open
  assert.ok(holdCeremony(s, 'long_table_feast').ok)
  refreshQuests(s)
  assert.equal(s.quests.Q23.st, 'ready')
}

// 宠物：收养一次、名字截断为纯文本；摸头每天一次；食盆空着没有惩罚；白天在院子，夜里在屋里
{
  const s = fresh(3)
  assert.ok(adoptPet(s, 'dog_b', '  小黑点点点点点点  ').ok)
  assert.equal(s.pet!.name, '小黑点点点点点点')
  assert.ok(!adoptPet(s, 'cat', 'x').ok)
  assert.ok(petPet(s).ok && !petPet(s).ok)
  assert.ok(fillBowl(s).ok && !fillBowl(s).ok)
  assert.equal(s.pet!.love, 12)
  s.min = 600
  while (raining(s)) s.day++ // 晴天才出门
  moveTo(s, 'farm', 24, 12)
  assert.ok(regionOf(s).buildings.some((b) => b.act === 'bowl'), '门口有食盆')
  const a = petStep(s, null, 0.1)!
  assert.ok(a && !solid(s, Math.floor(a.x), Math.floor(a.z)), '白天在院子')
  s.min = 1300
  assert.equal(petStep(s, a, 0.1), null, '夜里不在院子')
  moveTo(s, 'in:house', 5, 6)
  assert.ok(petStep(s, null, 0.1), '夜里在屋里')
  roundTrip(s)
}

// 走动：门格能走进去（踩上就是进屋）；地图边缘出口外还有一段路，走出 1.6 米才换地图；杂草芦苇能走过但不能直接开垦
{
  const s = fresh(5)
  moveTo(s, 'farm', 24.5, 10.5)
  const door = regionOf(s).buildings.find((b) => b.enter === 'in:house')!
  const [dx, dz] = doorOfBuilding(door).tile
  assert.ok(!solid(s, dx, dz), '家门格可走')
  s.x = dx + 0.5; s.z = dz + 0.5
  assert.equal(exitAt(s)?.to, 'in:house')
  const east = regionOf(s).exits.find((e) => e.to === 'town')!
  s.x = 47.5; s.z = east.z0 + 0.5
  assert.equal(exitAt(s), null, '走到边缘格还不换地图')
  assert.ok(corridorAt(s, 49, east.z0), '边缘外的路可以走')
  assert.ok(!corridorAt(s, 49, east.z0 - 3), '路两边不能走')
  s.x = 49.7
  assert.equal(exitAt(s)?.to, 'town', '走出 1.6 米换地图')
  const t = tileAt(s, 30, 30)!
  t.ob = { k: 'weed', dmg: 0 }; t.till = false; t.crop = null; t.ent = 0
  assert.ok(!solid(s, 30, 30), '杂草能走过')
  s.x = 30.5; s.z = 31.4
  give(s, 6, 'seed_spring_radish', 1)
  hold(s, 'tool_hoe')
  assert.ok(!useAt(s, 30, 30).ok, '杂草要先割掉才能开垦')
  // 模型没盖住的边格不挡路（禽舍模型比 6×5 占地窄）
  s.farmB.push({ id: 950, k: 'coop', x: 5, z: 3, done: 1, up: 0, hay: 0, open: false })
  const free = [...Array(6).keys()].filter((i) => !solid(s, 5 + i, 7)).length
  assert.ok(free >= 1, '禽舍前排有可走的格（门格与模型外的格）')
}

// 衣柜：衣物先在背包，收进衣柜才能穿；只能穿衣柜里的、部位要对；建档角色不变；入冬送一套冬衣；杂货店有卖
{
  const s = fresh(5)
  const look = s.look
  give(s, 6, 'wear_hat_straw', 1)
  assert.ok(!putOn(s, 'hat', 'wear_hat_straw').ok, '没收进衣柜不能穿')
  assert.ok(eat(s, 6).ok, 'E 键收进衣柜')
  assert.equal(s.inv[6], null)
  assert.ok(putOn(s, 'hat', 'wear_hat_straw').ok)
  assert.ok(!putOn(s, 'top', 'wear_hat_straw').ok, '部位要对')
  assert.equal(s.look, look, '换装不换角色')
  assert.deepEqual(outfitFiles(s), { hat: 'models/g4/wear/hat_straw.glb' })
  assert.ok(putOn(s, 'hat', '').ok && !s.outfit?.hat, '换回原来的')
  roundTrip(s)
  assert.ok(shopStock(s).includes('wear_top_linen') && !shopStock(s).includes('wear_hat_feather'), '杂货店卖普通衣物，节庆款不卖')
  s.day = SEASON_DAYS * 3; s.settled = s.day - 1; s.energy = 200
  endDay(s, false)
  assert.ok(['wear_top_snowflake', 'wear_bottom_snow', 'wear_hat_snow'].every((id) => s.wardrobe!.includes(id)), '入冬冬衣')
  roundTrip(s)
}

// 拆除建筑：屋里还有家具/机器时拒绝，不让东西凭空消失
{
  const s = fresh(5)
  s.farmB.push({ id: 960, k: 'workshop', x: 30, z: 20, done: 1, up: 0, hay: 0, open: false })
  ;(s.rooms ??= {})['in:workshop:960'] = [{ id: 961, k: 'chest', x: 3, z: 3, job: null, store: Array(36).fill(null) }]
  addItem(s.inv, 'wood', 0, 1)
  assert.ok(!demolish(s, 960).ok, '屋里有箱子不能拆')
  s.rooms['in:workshop:960'] = []
  s.inv = s.inv.map(() => null)
  assert.ok(demolish(s, 960).ok)
  assert.equal(s.rooms['in:workshop:960'], undefined)
}

console.log('g4 tests passed')
