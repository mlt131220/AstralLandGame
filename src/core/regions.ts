// 区域地图（设计 8.1）：地面、建筑、摆件、出口与居民锚点。只依赖内容配置与随机数，不导入 Three.js。
// 农场之外的区域按“世界种子 + 经营日”生成野外资源（8.3），玩家取走的记录在 GameState.wild；
// 矿洞楼层由手工房间模板 + 生成树走廊拼接（15.1），同一天重复进出布局不变。
import { FESTIVALS, festDef, isBossFloor, isRestFloor, MINE_THEMES, mineTheme, type FoeKind, type ObKind } from '../content/content.ts'
import { rand } from './rng.ts'
import { t as tr } from './i18n.ts'
import { REGION_TREES, type TreeSp } from '../content/g4.ts'
// 野生树的树种：按区域构成与坐标固定（同一棵树四季、砍倒再生都不变）
export function treeSpecies(region: string, x: number, z: number): TreeSp {
  const list = REGION_TREES[region] ?? REGION_TREES.forest
  let r = rand(x, z, region.length, 911) * list.reduce((a, [, w]) => a + w, 0)
  for (const [sp, w] of list) if ((r -= w) < 0) return sp
  return list[0][0]
}
import { interiorDef, type IndoorStyle } from './interiors.ts'

export type RegionId = 'farm' | 'town' | 'river' | 'forest' | 'mountain' | 'mine' | 'deepforest' | 'wetland' | 'highland' | `in:${string}`
export type Act = 'bed' | 'ship' | 'well' | 'shop' | 'kitchen' | 'mail' | 'board' | 'smith' | 'tackle' | 'mine' | 'up' | 'down' | 'lift' | 'coop' | 'booth'
  | 'silo' | 'workshop' | 'cabin' | 'site' | 'carpenter' | 'ranch' | 'clinic' | 'station' | 'project' | 'greenhouse' | 'sign'
  | 'door' | 'mirror' | 'desk' | 'nest' | 'museum' | 'marker' | 'bowl'
// 建筑：占地矩形为世界坐标；rot 为绕 Y 轴的 90° 次数（0 时门朝 +Z，1 朝 +X，2 朝 −Z，3 朝 −X）；model 为空串时只占位不显示
// home 为农场建筑表里的 id；sx/sz 为模型在 X/Z 方向的缩放（通用工地按占地拉伸）；project 为公共工程 id
export interface Building { id: string; name: string; x: number; z: number; w: number; d: number; rot?: number; act?: Act; model?: string; home?: number; sx?: number; sz?: number; project?: string; enter?: string; shop?: string }
// 装饰摆件：x/z 为世界坐标（米），solid 时阻挡所在格；m 为空串表示只占位不显示
export interface Decor { m: string; x: number; z: number; rot?: number; s?: number; solid?: boolean }
export interface Exit { x0: number; z0: number; x1: number; z1: number; to: RegionId; tx: number; tz: number }
// 居民站位；hidden 表示在室内（不显示、不能交谈）
export interface Spot { x: number; z: number; face: number; hidden?: boolean; sit?: boolean }
export interface RegionDef {
  id: RegionId; key: string; name: string; w: number; h: number
  buildings: Building[]; decor: Decor[]; exits: Exit[]; spawn: [number, number]
  ground: (x: number, z: number) => number // 0 草地 1 土路 2 水 3 石板 4 洞底 5 岩壁/山崖 6 木栈（下为水）
  outside?: (x: number, z: number) => number // 地图外的表现地面（河流、山崖延续）
  spots: Record<string, Spot>
  dark?: boolean
  theme?: number // 矿洞主题区 0/1/2
  indoor?: IndoorStyle // 室内风格（家、商店、畜舍、石屋）
}
export const WALKABLE = (g: number) => g !== 2 && g !== 5 && g !== 8
export const isWater = (g: number) => g === 2 || g === 6

// ---------- 农场 48×40 ----------
export const FARM_W = 48
export const FARM_H = 40
export const COOP_SITE = { x: 5, z: 3, w: 6, d: 5 } // 17.1 禽舍 6×5，门朝南；门前空地为鸡的活动区（新档默认推荐位置）
export const COOP_YARD = { x: 3, z: 8, w: 10, d: 6 }
export const GREENHOUSE_SITE = { x: 36, z: 2, w: 10, d: 8 } // 8.2 东侧温室废址（公共修复、农场使用）
function farmGround(x: number, z: number) {
  if ((x - 8) ** 2 + (z - 30) ** 2 <= 16) return 2 // 池塘
  if ((x === 23 || x === 24) && z >= 9) return 1 // 家门口小路，向南通往浅林
  if ((z === 19 || z === 20) && x >= 23) return 1 // 通往小镇
  return 0
}
// 横向围栏：覆盖 x0..x1 每一格（共偶数格），每段模型 2 米长
const fenceRow = (x0: number, x1: number, z: number): Decor[] => {
  const out: Decor[] = []
  for (let x = x0; x <= x1; x++) {
    if ((x - x0) % 2 === 0) out.push({ m: 'fence', x: x + 1, z: z + 0.5 })
    out.push({ m: '', x: x + 0.5, z: z + 0.5, solid: true })
  }
  return out
}
// 纵向树篱：覆盖 z0..z1 每一格，每段模型 2 米长
const hedgeCol = (x: number, z0: number, z1: number, rot = 0): Decor[] => {
  const out: Decor[] = []
  for (let z = z0; z <= z1; z++) {
    if ((z - z0) % 2 === 0) out.push({ m: 'hedge', x: x + 0.5, z: Math.min(z + 1, z1 + 0.5), rot })
    out.push({ m: '', x: x + 0.5, z: z + 0.5, solid: true })
  }
  return out
}
// 门：rot 0 门朝 +Z（南），rot 2 门朝 −Z（北），rot 1 朝 +X，rot 3 朝 −X；返回门洞格与门外站位
export function doorOfBuilding(b: Building): { tile: [number, number]; front: [number, number] } {
  const r = b.rot ?? 0
  const cx = b.x + Math.floor(b.w / 2), cz = b.z + Math.floor(b.d / 2)
  if (r === 2) return { tile: [cx, b.z], front: [cx + 0.5, b.z - 0.6] }
  if (r === 1) return { tile: [b.x + b.w - 1, cz], front: [b.x + b.w + 0.6, cz + 0.5] }
  if (r === 3) return { tile: [b.x, cz], front: [b.x - 0.6, cz + 0.5] }
  return { tile: [cx, b.z + b.d - 1], front: [cx + 0.5, b.z + b.d + 0.6] }
}
// 可进入的建筑：在门洞格加一个出口，居民寻路可以“走进门”；玩家在门口按 F 进门
const doorExits = (bs: Building[]): Exit[] => bs.filter((b) => b.enter).map((b) => {
  const { tile } = doorOfBuilding(b)
  return { x0: tile[0], z0: tile[1], x1: tile[0], z1: tile[1], to: b.enter as RegionId, tx: 0, tz: 0 }
})

// 农场私人建筑（state.farmB）→ 区域建筑：施工中显示通用工地，升级后换模型
export interface FarmBRef { id: number; k: string; x: number; z: number; done: number; up: number }
const B_SIZE: Record<string, [number, number, string]> = { coop: [6, 5, tr('common.coop')], barn: [7, 6, tr('common.barn')], silo: [3, 3, tr('common.silo')], workshop: [8, 6, tr('common.workshop')], well: [3, 3, tr('common.well')], cabin: [5, 4, tr('common.cabin')] }
const B_ACT: Record<string, Act> = { coop: 'coop', barn: 'coop', silo: 'silo', workshop: 'workshop', well: 'well', cabin: 'cabin' }
function farmBuilding(b: FarmBRef, day: number): Building {
  const [w, d, name] = B_SIZE[b.k]
  if (b.done > day) return { id: 'site', name: tr('regions.constructionSite', name), x: b.x, z: b.z, w, d, act: 'site', home: b.id, model: 'models/g3/buildings/construction_site.glb', sx: w / 4, sz: d / 4 }
  const lv = b.up && b.up <= day ? 1 : 0
  const model = { coop: lv ? 'models/g3/buildings/coop_big.glb' : 'models/buildings/coop.glb', barn: lv ? 'models/g3/buildings/barn_big.glb' : 'models/buildings/barn.glb',
    silo: 'models/g3/buildings/silo.glb', workshop: 'models/g3/buildings/workshop.glb', well: 'models/buildings/well.glb', cabin: 'models/g3/buildings/cabin.glb' }[b.k]
  const enter = b.k === 'silo' || b.k === 'well' ? undefined : `in:${b.k}:${b.id}`
  return { id: b.k, name: lv ? (b.k === 'coop' ? tr('common.bigCoop') : tr('common.bigBarn')) : name, x: b.x, z: b.z, w, d, act: enter ? 'door' : B_ACT[b.k], enter, home: b.id, model, ...(b.k === 'well' ? { sx: 1.4, sz: 1.4 } : {}) }
}
// house：家宅等级；gh：温室 0 废址 1 施工 2 完成
function farm(fb: FarmBRef[], day: number, house: number, gh: number, pet = false): RegionDef {
  const G = GREENHOUSE_SITE
  return {
    id: 'farm', key: `farm:${house}:${gh}:` + fb.map((b) => `${b.id},${b.k},${b.x},${b.z},${b.done <= day ? 1 : 0}${b.up && b.up <= day ? 1 : 0}`).join(';'),
    name: tr('common.farm'), w: FARM_W, h: FARM_H, spawn: [24, 10.2], ground: farmGround,
    buildings: [
      { id: 'farmhouse', name: tr('common.home'), x: 20, z: 2, w: 8, d: 7, act: 'door', enter: 'in:house', model: house ? `models/g3/buildings/farmhouse_${house}.glb` : undefined }, // 17.1 家宅 8×7
      { id: 'shipping_bin', name: tr('common.shippingBin'), x: 29, z: 9, w: 2, d: 1, act: 'ship' },
      { id: 'well', name: tr('common.well'), x: 16, z: 9, w: 2, d: 2, act: 'well' },
      { id: 'mailbox', name: tr('regions.mailbox'), x: 21, z: 9, w: 1, d: 1, act: 'mail' },
      ...(pet ? [{ id: 'pet_bowl', name: tr('regions.petBowl'), x: 26, z: 9, w: 1, d: 1, act: 'bowl' as Act, model: '' }] : []),
      // 温室：完成后只有四周的墙阻挡，里面是 48 格四季耕地（门在南面正中）
      ...(gh === 2 ? [] : [{ id: 'greenhouse_site', name: gh ? tr('regions.greenhouseConstructionSite') : tr('regions.greenhouseRuins'), ...G, act: 'project' as Act, project: 'greenhouse', model: gh ? 'models/g3/buildings/greenhouse_scaffold.glb' : 'models/g3/buildings/greenhouse_ruined.glb' }]),
      ...fb.map((b) => farmBuilding(b, day)),
      ...(fb.some((b) => b.k === 'coop') ? [] : [{ id: 'coop_site', name: tr('common.coopPlot'), x: 8, z: 8, w: 1, d: 1, act: 'coop' as Act, model: '' }]),
    ],
    decor: [
      { m: 'barrel', x: 28.6, z: 2.6, solid: true }, { m: 'barrel', x: 29.4, z: 3.3, solid: true },
      { m: 'crate', x: 28.7, z: 4.6, rot: 0.3, solid: true },
      { m: 'logStack', x: 18.6, z: 3.5, rot: Math.PI / 2, solid: true },
      { m: 'hay', x: 14.6, z: 5.5, rot: 0.4, solid: true }, { m: 'hayBundle', x: 15.4, z: 6.6, solid: true },
      { m: 'bush', x: 22.4, z: 9.6, solid: true }, { m: 'bush', x: 25.4, z: 9.6, solid: true },
      ...(pet ? [{ m: 'pet_bowl', x: 26.5, z: 9.5 }] : []),
      ...fenceRow(12, 19, 12), ...fenceRow(29, 36, 12),
      { m: 'signpost', x: 44.5, z: 17.6, rot: -Math.PI / 2, solid: true },
      { m: 'signpost', x: 25.6, z: 37.4, rot: Math.PI, solid: true },
      { m: 'lightpost', x: 25.6, z: 18.4, solid: true },
      { m: 'rockLarge', x: 12.5, z: 26.2, rot: 1.1, solid: true }, { m: 'rockWide', x: 4.2, z: 34.5, rot: 2.2, solid: true },
      { m: 'campfire', x: 33.5, z: 24.5, solid: true },
      { m: 'windmillRuined', x: 39, z: -7, rot: -0.6 }, // 远处高地上的旧风车（主线工程）
      // 禽舍推荐位置的路牌（还没有禽舍时）
      ...(fb.some((b) => b.k === 'coop') ? [] : [{ m: 'signpost', x: 8.5, z: 8.5, rot: 0.3 }]),
      // 温室：完成后的玻璃墙（四周一圈阻挡，南面正中留门）
      ...(gh === 2 ? [{ m: 'greenhouse', x: G.x + G.w / 2, z: G.z + G.d / 2 }, ...ring(G)] : []),
    ],
    exits: [
      { x0: 47, z0: 18, x1: 47, z1: 21, to: 'town', tx: 1.6, tz: 12.9 },
      { x0: 23, z0: 39, x1: 24, z1: 39, to: 'forest', tx: 24, tz: 1.6 },
    ],
    spots: {},
  }
}

// 矩形四周一圈阻挡格（南面正中留门）
function ring(r: { x: number; z: number; w: number; d: number }): Decor[] {
  const out: Decor[] = []
  const door = r.x + Math.floor(r.w / 2)
  for (let x = r.x; x < r.x + r.w; x++) for (const z of [r.z, r.z + r.d - 1]) if (!(z === r.z + r.d - 1 && (x === door || x === door - 1))) out.push({ m: '', x: x + 0.5, z: z + 0.5, solid: true })
  for (let z = r.z + 1; z < r.z + r.d - 1; z++) for (const x of [r.x, r.x + r.w - 1]) out.push({ m: '', x: x + 0.5, z: z + 0.5, solid: true })
  return out
}

// ---------- 小镇 40×30 ----------
function townGround(x: number, z: number) {
  if (z === 33 || z === 34) return 3 // 南街
  if ((x === 11 || x === 12 || x === 26 || x === 27) && z >= 14 && z <= 34) return 1 // 广场两侧通往南街的小路
  if (z === 12 || z === 13) return 3 // 东西主街
  if (x >= 13 && x <= 25 && z >= 14 && z <= 23) return 3 // 中央广场
  if ((z === 10 || z === 11 || z === 14) && x >= 2 && x <= 38) return 1 // 店门前的土路
  if ((x === 22 || x === 23) && z <= 11) return 1 // 北上山道
  return 0
}
const FOUNTAIN_TILES: Decor[] = []
for (let z = 17; z <= 20; z++) for (let x = 17; x <= 20; x++) FOUNTAIN_TILES.push({ m: '', x: x + 0.5, z: z + 0.5, solid: true })
// 20.1 花种会：广场布置
const FESTIVAL_DECOR: Decor[] = [
  { m: 'festArch', x: 19, z: 14.6 }, { m: 'festBunting', x: 15.5, z: 14.4 }, { m: 'festBunting', x: 22.5, z: 14.4 },
  { m: 'flowerBooth', x: 15.6, z: 19, rot: Math.PI / 2, solid: true }, { m: 'flowerBooth', x: 22.6, z: 19, rot: -Math.PI / 2, solid: true },
  { m: '', x: 15.5, z: 18.5, solid: true }, { m: '', x: 22.5, z: 18.5, solid: true }, { m: '', x: 22.5, z: 19.5, solid: true },
  { m: 'festTable', x: 19, z: 22.6, solid: true }, { m: '', x: 18.5, z: 22.5, solid: true }, { m: '', x: 20.5, z: 22.5, solid: true },
  ...[[14.4, 15.4, 'a'], [24, 15.4, 'b'], [14.4, 23, 'c'], [24, 23, 'a'], [16.6, 16.8, 'b'], [21.4, 16.8, 'c'], [16.6, 21, 'a'], [21.4, 21, 'b']]
    .map(([x, z, k]) => ({ m: 'flowerPot_' + k, x: x as number, z: z as number })),
]
// G4 节庆会场：s 为实心格（左上格、宽、深）；booth 为小游戏入口
type FestLayout = { decor: Decor[]; solid: [number, number, number, number][]; booth: [number, number, number, number, string]; markers?: [number, number][] }
const ARCH = (k: string): Decor => ({ m: 'festival_arch_' + k, x: 19, z: 14.6 })
export const FEST_LAYOUTS: Record<string, FestLayout> = {
  picnic: {
    decor: [ARCH('summer'), { m: 'picnic_parasol', x: 15, z: 15 }, { m: 'picnic_blanket', x: 23, z: 15 }, { m: 'picnic_blanket', x: 23, z: 23 }, { m: 'picnic_blanket', x: 15, z: 23.2 },
      { m: 'picnic_grill', x: 23, z: 19, rot: Math.PI / 2 }, { m: 'picnic_pot', x: 15, z: 19 }, { m: 'picnic_basket', x: 22.3, z: 22.4 }, { m: 'picnic_basket', x: 15.8, z: 22.6, rot: 1 }],
    solid: [[15, 15, 1, 1], [23, 18, 1, 2], [14, 18, 2, 2]], booth: [14, 18, 2, 2, tr('regions.picnicPotXiaHe')],
  },
  market: {
    decor: [ARCH('autumn'), { m: 'market_tent_a', x: 14.5, z: 14.5 }, { m: 'market_tent_b', x: 23.5, z: 14.5 }, { m: 'market_booth_player', x: 15, z: 22.5 }, { m: 'market_judge_table', x: 23, z: 22.5 }],
    solid: [[14, 14, 2, 1], [23, 14, 2, 1], [14, 22, 2, 1], [22, 22, 2, 1]], booth: [14, 22, 2, 1, tr('regions.produceBooth')],
  },
  harvest_coop: {
    decor: [ARCH('autumn'), { m: 'harvest_cart', x: 15, z: 14.5 }, { m: 'grain_sacks', x: 23, z: 15 }, { m: 'sort_bin_red', x: 14.5, z: 22.5 }, { m: 'sort_bin_yellow', x: 15.5, z: 22.5 },
      { m: 'sort_bin_green', x: 16.5, z: 22.5 }, { m: 'deco_flower_box', x: 23, z: 22.5 }],
    solid: [[14, 13, 2, 3], [22, 15, 2, 1], [14, 22, 3, 1], [22, 22, 2, 1]], booth: [14, 22, 3, 1, tr('regions.sortingBinsHeYan')],
  },
  snow_craft: {
    decor: [ARCH('winter'), { m: 'craft_bench_snow', x: 15, z: 15 }, { m: 'craft_bench_snow', x: 23, z: 15 }, { m: 'craft_parts', x: 15, z: 23 }, { m: 'snow_base', x: 23.5, z: 22.5 }, { m: 'deco_snow_house', x: 22.5, z: 22.5 }],
    solid: [[14, 15, 2, 1], [22, 15, 2, 1], [14, 22, 2, 2], [22, 22, 2, 1]], booth: [14, 22, 2, 2, tr('regions.woodcraftTableSongNing')],
  },
  hearth_night: {
    decor: [ARCH('winter'), { m: 'hearth_brazier', x: 15, z: 15 }, { m: 'greeting_cabinet', x: 23, z: 15 }, { m: 'story_bench', x: 15.5, z: 22.5 }, { m: 'story_bench', x: 22.5, z: 22.5 }],
    solid: [[14, 14, 2, 2], [22, 15, 2, 1], [14, 22, 3, 1], [21, 22, 3, 1]], booth: [14, 14, 2, 2, tr('regions.hearthGrannyShi')],
  },
  long_table_feast: {
    decor: [{ m: 'festBunting', x: 15.5, z: 14.4 }, { m: 'festBunting', x: 22.5, z: 14.4 }, ...[15, 19, 23].map((x) => ({ m: 'festTable', x, z: 22.6 })), { m: 'picnic_basket', x: 14.3, z: 22.4 }, { m: 'picnic_pot', x: 23.8, z: 15 }],
    solid: [[14, 22, 3, 1], [18, 22, 3, 1], [22, 22, 3, 1], [23, 14, 2, 2]], booth: [18, 22, 3, 1, tr('regions.longTableXiaHe')],
  },
  windmill_ceremony: {
    decor: [{ m: 'festBunting', x: 26.5, z: 13.6 }, { m: 'festival_arch_summer', x: 26.5, z: 17.6 }],
    solid: [], booth: [26, 13, 1, 1, tr('regions.ceremonyRibbonUncle')],
  },
  // 河岸：登记台在渔具屋东侧，记分牌与领奖台在草地边
  fishing_derby: {
    decor: [{ m: 'fishfest_stall', x: 21.5, z: 17.5 }, { m: 'fishfest_banner', x: 22, z: 20.2 }, { m: 'fishfest_scoreboard', x: 18.5, z: 24, rot: Math.PI / 2 }, { m: 'fishfest_podium', x: 22.5, z: 28.5 }],
    solid: [[20, 17, 3, 1], [18, 23, 1, 2], [21, 28, 3, 1]], booth: [20, 17, 3, 1, tr('regions.derbySignShenZhou')],
  },
  firefly: {
    decor: [{ m: 'lantern_stand', x: 21.5, z: 17.5 }, { m: 'lantern_marker', x: 12.5, z: 25.5 }, { m: 'lantern_marker', x: 24.5, z: 11.5 }, { m: 'lantern_marker', x: 29.5, z: 21.5 },
      { m: 'lantern_float', x: 31.5, z: 23.5 }, { m: 'lantern_float', x: 33, z: 26.5 }, { m: 'lantern_float', x: 30.5, z: 28.5 }],
    solid: [[21, 17, 2, 1]], booth: [21, 17, 2, 1, tr('regions.lanternStandBaiLu')], markers: [[12, 25], [24, 11], [29, 21]],
  },
}
// 野外会场草地（不长杂物）：[x, z, 宽, 深]
export const FEST_GROUNDS: Record<string, [number, number, number, number]> = { river: [18, 16, 8, 14], highland: [21, 13, 12, 6] }
// 节庆当天居民在会场的站位（广场绕喷泉一圈；河岸在草地上）；主持人站在入口旁
export const FEST_RING: Record<string, [number, number][]> = {
  town: [[16.5, 16.5], [21.5, 16.5], [16.5, 21.5], [21.5, 21.5], [18.5, 16.4], [20.5, 16.4], [18.5, 21.6], [20.5, 21.6], [16.4, 18.5], [16.4, 20.5], [21.6, 18.5], [21.6, 20.5],
    [17.5, 16.4], [19.5, 16.4], [17.5, 21.6], [19.5, 21.6]],
  highland: [[23.5, 14.6], [24.5, 15.6], [25.5, 14.6], [26.5, 15.8], [27.5, 14.6], [28.5, 15.6], [29.5, 14.6], [30.5, 15.6], [23.5, 16.8], [25.5, 17], [27.5, 17], [29.5, 17],
    [31, 16], [22.5, 15.6], [31.5, 14.6], [26.5, 16.9]],
  river: [[20.5, 22.6], [21.5, 22.6], [22.5, 22.6], [23.5, 22.6], [24.5, 22.6], [20.5, 25.4], [21.5, 25.4], [22.5, 25.4], [23.5, 25.4], [24.5, 25.4], [19.6, 24], [24.6, 24],
    [20.5, 27], [24.5, 27], [21.5, 26.6], [23.5, 26.6]],
}
function festParts(id: string) {
  const L = FEST_LAYOUTS[id]
  if (!L) return { decor: [] as Decor[], buildings: [] as Building[] }
  const [bx, bz, bw, bd, bn] = L.booth
  return {
    decor: [...L.decor, ...L.solid.flatMap(([x, z, w, d]) => Array.from({ length: w * d }, (_, i) => ({ m: '', x: x + (i % w) + 0.5, z: z + Math.floor(i / w) + 0.5, solid: true })))],
    buildings: [{ id: 'booth', name: bn, x: bx, z: bz, w: bw, d: bd, act: 'booth' as Act, model: '' },
      ...(L.markers ?? []).map(([x, z], i) => ({ id: 'marker' + i, name: tr('regions.lanternMarker'), x, z, w: 1, d: 1, act: 'marker' as Act, home: i, model: '' }))],
  }
}
function town(fest: string): RegionDef {
  const buildings: Building[] = [
    { id: 'shop_general', name: tr('regions.generalStoreLinTang'), x: 3, z: 4, w: 8, d: 6, act: 'door', enter: 'in:general', shop: 'general' },
    { id: 'diner', name: tr('common.diner'), x: 14, z: 4, w: 8, d: 6, act: 'door', enter: 'in:diner' },
    { id: 'blacksmith', name: tr('regions.blacksmithOldTao'), x: 25, z: 4, w: 7, d: 6, act: 'door', enter: 'in:smith', shop: 'smith' },
    // G3 服务建筑（17.1 / 13.4）：木工坊（何砚）、牧场（周芹）、诊所（叶岚）
    { id: 'carpenter_shop', name: tr('regions.carpentryShopHeYan'), x: 33, z: 4, w: 7, d: 6, act: 'door', enter: 'in:carpenter', shop: 'carpenter', model: 'models/g3/buildings/carpenter_shop.glb' },
    { id: 'clinic', name: tr('regions.clinicYeLan'), x: 3, z: 17, w: 6, d: 5, rot: 2, act: 'door', enter: 'in:clinic', shop: 'clinic', model: 'models/g3/buildings/clinic.glb' },
    { id: 'council_hall', name: tr('common.townHallArchive'), x: 15, z: 24, w: 8, d: 6, rot: 2, act: 'door', enter: 'in:hall' },
    { id: 'ranch_house', name: tr('regions.ranchZhouQin'), x: 31, z: 17, w: 8, d: 6, rot: 2, act: 'door', enter: 'in:ranch', shop: 'ranch', model: 'models/g3/buildings/ranch_house.glb' },
    // G4 南街（22.4 教室、公共活动厅、民宅）
    { id: 'school', name: tr('regions.classroomSongNing'), x: 3, z: 36, w: 8, d: 6, rot: 2, act: 'door', enter: 'in:school', model: 'models/g4/buildings/school.glb' },
    { id: 'community_hall', name: tr('common.communityHall'), x: 14, z: 36, w: 10, d: 7, rot: 2, act: 'door', enter: 'in:community', model: 'models/g4/buildings/community_hall.glb' },
    { id: 'house_c', name: tr('common.grannyShisHouse'), x: 26, z: 36, w: 6, d: 5, rot: 2, act: 'door', enter: 'in:house_c', model: 'models/g4/buildings/house_c.glb' },
    { id: 'house_a', name: tr('common.baiLusHouse'), x: 33, z: 36, w: 6, d: 5, rot: 2, act: 'door', enter: 'in:house_a' },
    { id: 'house_b', name: tr('common.wenHengsHouse'), x: 31, z: 25, w: 6, d: 5, act: 'door', enter: 'in:house_b' },
    { id: 'notice_board', name: tr('common.noticeBoard'), x: 11, z: 9, w: 2, d: 1, act: 'board' },
    ...(fest === 'flower_fair' ? [{ id: 'booth', name: tr('regions.flowerQuizBooth'), x: 15, z: 19, w: 1, d: 1, act: 'booth' as const, model: '' }] : festParts(fest).buildings),
  ]
  return {
    id: 'town', key: fest ? 'town:fest:' + fest : 'town', name: tr('common.town'), w: 40, h: 44, spawn: [1.6, 12.9], ground: townGround,
    buildings,
    decor: [
      { m: 'fountain', x: 19, z: 19 }, ...FOUNTAIN_TILES,
      { m: 'bench', x: 15, z: 16.5, rot: Math.PI / 2, solid: true }, { m: 'bench', x: 23, z: 16.5, rot: -Math.PI / 2, solid: true },
      { m: 'bench', x: 15, z: 21.5, rot: Math.PI / 2, solid: true }, { m: 'bench', x: 23, z: 21.5, rot: -Math.PI / 2, solid: true },
      ...[3, 9, 15, 27, 33].map((x) => ({ m: 'lantern', x: x + 0.5, z: 11.5, solid: true })),
      ...[6, 11, 27, 33, 38].map((x) => ({ m: 'lantern', x: x + 0.5, z: 14.5, solid: true })),
      { m: 'stallRed', x: 27.5, z: 17, rot: -Math.PI / 2, solid: true }, { m: 'stallGreen', x: 27.5, z: 20, rot: -Math.PI / 2, solid: true },
      { m: 'crate', x: 28.6, z: 16, solid: true }, { m: 'barrel', x: 28.6, z: 21.3, solid: true },
      { m: 'cart', x: 11.3, z: 16.6, rot: 0.6, solid: true },
      { m: 'barrel', x: 2.4, z: 9.3, solid: true }, { m: 'crate', x: 12.4, z: 6.5, solid: true },
      { m: 'hay', x: 24.4, z: 6, rot: 1.2, solid: true },
      ...hedgeCol(13, 15, 22), ...hedgeCol(25, 15, 22, Math.PI),
      { m: 'bush', x: 2.5, z: 10.5, solid: true }, { m: 'bush', x: 21.5, z: 10.5, solid: true },
      { m: 'pumpkin', x: 12.6, z: 7.6 }, { m: 'logStack', x: 31.5, z: 3.4, solid: true },
      { m: 'signpost', x: 24.5, z: 1.5, rot: Math.PI / 2, solid: true }, { m: 'signpost', x: 38.5, z: 10.5, rot: -Math.PI / 2, solid: true },
      ...(fest === 'flower_fair' ? FESTIVAL_DECOR : festParts(fest).decor),
      // 南街：路灯、长椅、花坛
      ...[4, 12, 20, 28, 36].map((x) => ({ m: 'lantern', x: x + 0.5, z: 32.5, solid: true })),
      { m: 'bench', x: 24.5, z: 31.4, solid: true }, { m: 'bench', x: 8.5, z: 31.4, solid: true },
      { m: 'bush', x: 12.6, z: 30.6, solid: true }, { m: 'bush', x: 25.4, z: 30.6, solid: true },
    ],
    exits: [
      { x0: 0, z0: 11, x1: 0, z1: 14, to: 'farm', tx: 45.5, tz: 19.5 },
      { x0: 39, z0: 11, x1: 39, z1: 14, to: 'river', tx: 1.6, tz: 13.9 },
      { x0: 22, z0: 0, x1: 23, z1: 0, to: 'mountain', tx: 18, tz: 28.4 },
      ...doorExits(buildings),
    ],
    spots: {
      种子店柜台: { x: 7, z: 10.6, face: 0 }, 种子店檐下: { x: 5, z: 10.5, face: 0.4 }, 种子店内侧整理台: { x: 8.6, z: 10.5, face: -0.3 },
      种子店后宅: { x: 7, z: 3, face: 0, hidden: true }, 种子店后侧住宅: { x: 7, z: 3, face: 0, hidden: true },
      中央广场: { x: 19, z: 15.4, face: 0 }, 中央广场长椅: { x: 15.15, z: 16.5, face: Math.PI / 2, sit: true }, 广场长椅: { x: 22.85, z: 21.5, face: -Math.PI / 2, sit: true },
      档案馆阅览桌: { x: 17.5, z: 23.3, face: Math.PI },
      食堂门前: { x: 17.5, z: 10.7, face: 0 }, 食堂灶台: { x: 20.3, z: 10.5, face: 0 }, 食堂备菜台: { x: 15.4, z: 10.5, face: 0 },
      食堂公共料理台: { x: 18.8, z: 11.1, face: 0.5 }, 食堂角桌: { x: 21.2, z: 11.3, face: -0.6 }, 食堂靠窗桌: { x: 14.6, z: 11.2, face: 0.4 },
      食堂靠门桌: { x: 16.4, z: 11.2, face: 0 }, 食堂后院: { x: 17.5, z: 3, face: 0, hidden: true }, 食堂后侧小院: { x: 17.5, z: 3, face: 0, hidden: true },
      铁匠铺锻台: { x: 28.5, z: 10.5, face: 0 }, 铁匠铺工具架: { x: 30.6, z: 10.5, face: -0.4 }, 铁匠铺檐下委托柜: { x: 26.2, z: 10.6, face: 0.3 },
      铺外委托柜: { x: 26.2, z: 10.6, face: 0.3 }, 铁匠铺后屋: { x: 28.5, z: 3, face: 0, hidden: true },
      木工坊柜台: { x: 36.5, z: 10.6, face: 0 }, 木工坊锯木台: { x: 38.4, z: 10.5, face: -0.5 }, 木工坊后屋: { x: 36.5, z: 3, face: 0, hidden: true },
      牧场柜台: { x: 35, z: 16.2, face: Math.PI }, 牧场围栏: { x: 30.2, z: 23.6, face: Math.PI / 2 }, 牧场后屋: { x: 35, z: 25, face: 0, hidden: true },
      诊所门前: { x: 6, z: 16.2, face: Math.PI }, 诊所药柜: { x: 8.6, z: 16.4, face: Math.PI }, 诊所后屋: { x: 6, z: 25, face: 0, hidden: true },
      议事厅门前: { x: 19, z: 23.4, face: Math.PI }, 议事厅内: { x: 19, z: 28, face: 0, hidden: true },
      学校门前: { x: 7.5, z: 35.2, face: 0 }, 活动厅门前: { x: 19.5, z: 35.2, face: 0 }, 南街长椅: { x: 24.5, z: 31.9, face: 0, sit: true },
      石婆家门前: { x: 29.5, z: 35.2, face: 0 }, 白露家门前: { x: 36.5, z: 35.2, face: 0 }, 温衡家门前: { x: 34.5, z: 30.6, face: Math.PI },
      // 节庆站位
      节庆展台: { x: 16.4, z: 19.6, face: Math.PI / 2 }, 节庆入口: { x: 21, z: 15.6, face: 0 }, 节庆长桌: { x: 19, z: 21.7, face: Math.PI }, 节庆喷泉: { x: 22.2, z: 17.6, face: -Math.PI / 2 },
    },
  }
}

// ---------- 河岸 48×36：河流自北向南，北端旧水闸，西北山溪汇入 ----------
export const riverCx = (z: number) => 31 + 2.5 * Math.sin(z / 5.5)
const riverHw = (z: number) => (z < 8 ? 2.6 : 3.4)
const inRiver = (x: number, z: number) => Math.abs(x + 0.5 - riverCx(z)) < riverHw(z)
const creekZ = (x: number) => 1.2 + 0.7 * Math.sin(x / 2.6)
export const inCreek = (x: number, z: number) => z <= 4 && x + 0.5 < riverCx(z) && Math.abs(z + 0.5 - creekZ(x)) < 1.05
export const SLUICE = { z: 4, d: 3, walk: 5 } // 17.1 水闸跨河，占地 6×3；完工后中间一行可通行
const sluiceX0 = Math.round(riverCx(5) - 3)
// 17.1 林桥：横跨河道的木拱桥（模型 4×8 沿 Z，转 90° 后沿 X 跨河），桥面两行可通行
export const BRIDGE = { x: 25, z: 29, w: 9, d: 4, deck: [30, 31] }
function riverGround(state: number, bridge = 0) {
  return (x: number, z: number) => {
    if (state === 2 && z === SLUICE.walk && x >= sluiceX0 && x < sluiceX0 + 6) return 6
    if (bridge === 2 && BRIDGE.deck.includes(z) && x >= BRIDGE.x && x < BRIDGE.x + BRIDGE.w && (inRiver(x, z) || inCreek(x, z))) return 6
    if (z >= 21 && z <= 22 && x >= 26 && x <= 29) return 6 // 钓鱼栈桥
    if (inRiver(x, z) || inCreek(x, z)) return 2
    if (z >= 13 && z <= 14 && x <= 24) return 1 // 入口主路
    if ((x === 22 || x === 23) && z >= 5 && z <= 12) return 1 // 北去水闸的步道
    if (z === 5 && x >= 22 && x < sluiceX0) return 1
    if ((x === 23 || x === 24) && z >= 15 && z <= 22) return 1 // 南去栈桥
    if (z >= 21 && z <= 22 && x === 25) return 1
    if (x >= 17 && x <= 21 && z >= 15 && z <= 20 && x === 17) return 1 // 渔具屋门前
    return 0
  }
}
function river(state: number, bridge = 0, fest = ''): RegionDef {
  const ground = riverGround(state, bridge)
  const sx = sluiceX0 + 3
  const fp = festParts(fest)
  return {
    id: 'river', key: `river:${state}:${bridge}:${fest}`, name: tr('common.riverside'), w: 48, h: 36, spawn: [1.6, 13.9], ground,
    outside: (x, z) => (inRiver(x, z) || inCreek(x, z) ? 2 : 0),
    buildings: [
      { id: 'fishing_hut', name: tr('regions.tackleHutShenZhou'), x: 13, z: 16, w: 4, d: 5, rot: 1, act: 'tackle' },
      // 水闸工程牌（17.1）与林桥工地牌：施工前后都可以查看工程
      { id: 'sluice_board', name: tr('regions.sluiceGateProjectSign'), x: 21, z: 4, w: 1, d: 1, act: 'project', project: 'sluice', model: '' },
      { id: 'bridge_sign', name: bridge === 2 ? tr('common.woodsBridge') : tr('regions.woodsBridgeSite'), x: 23, z: 28, w: 1, d: 1, act: 'project', project: 'bridge', model: '' },
      ...fp.buildings,
    ],
    decor: [
      { m: ['sluiceRuined', 'sluiceScaffold', 'sluice'][state], x: sx, z: SLUICE.z + 1.5 },
      { m: 'fishingDock', x: 28, z: 22, rot: Math.PI / 2 },
      { m: 'workbench', x: 17.6, z: 21.3, rot: Math.PI / 2, solid: true },
      { m: 'barrel', x: 12.5, z: 21.5, solid: true }, { m: 'crate', x: 12.4, z: 15.4, solid: true },
      { m: 'signpost', x: 1.5, z: 11.6, rot: Math.PI / 2, solid: true }, { m: 'signpost', x: 21.5, z: 4.4, rot: 0.4, solid: true },
      { m: 'signRegion', x: 44.5, z: 15.5, rot: -Math.PI / 2, solid: true }, { m: 'logStack', x: 45.5, z: 18.5, rot: 0.3, solid: true },
      { m: 'logStack', x: 44.6, z: 21, rot: 1.6, solid: true },
      { m: 'lightpost', x: 21.5, z: 12.4, solid: true }, { m: 'lightpost', x: 25.5, z: 20.4, solid: true },
      { m: 'riverRock_a', x: 31.6, z: 12.4, rot: 0.6 }, { m: 'riverRock_b', x: 29.4, z: 28.6, rot: 2 }, { m: 'riverRock_a', x: 33.2, z: 31.5, rot: 4 },
      { m: 'riverRock_b', x: 30.4, z: 17.2, rot: 1 }, { m: 'logBig', x: 9.5, z: 28.5, rot: 0.4, solid: true }, { m: '', x: 10.5, z: 28.5, solid: true },
      { m: 'tent', x: 6.5, z: 25.5, rot: 0.6, solid: true }, { m: 'campfire', x: 8.5, z: 23.5, solid: true },
      { m: ['bridgeRuined', 'bridgeScaffold', 'bridge'][bridge], x: BRIDGE.x + BRIDGE.w / 2, z: BRIDGE.z + BRIDGE.d / 2, rot: Math.PI / 2 },
      { m: 'signpost', x: 23.5, z: 28.5, rot: Math.PI / 2, solid: true },
      ...(bridge === 2 ? [{ m: 'signRegion', x: 45.5, z: 19.4, rot: -Math.PI / 2, solid: true }, { m: 'signRegion', x: 37.4, z: 34.5, rot: Math.PI, solid: true }] : []),
      ...fp.decor,
    ],
    exits: [
      { x0: 0, z0: 12, x1: 0, z1: 15, to: 'town', tx: 38.2, tz: 12.9 },
      // 林桥完工后：东岸通往深林、南端通往湿地（8.1）
      ...(bridge === 2 ? [{ x0: 47, z0: 20, x1: 47, z1: 23, to: 'deepforest' as RegionId, tx: 1.6, tz: 15.5 }, { x0: 38, z0: 35, x1: 41, z1: 35, to: 'wetland' as RegionId, tx: 19.5, tz: 1.6 }] : []),
    ],
    spots: {
      河岸浅水调查点: { x: 24.7, z: 25.6, face: Math.PI / 2 }, 渔具屋檐下: { x: 17.7, z: 18.4, face: Math.PI / 2 },
      渔具屋檐下记录桌: { x: 17.6, z: 20.4, face: Math.PI / 2 }, 渔具屋记录桌: { x: 17.6, z: 20.4, face: Math.PI / 2 },
      渔具屋后间: { x: 14.5, z: 18.5, face: 0, hidden: true }, 河岸渔具屋后间: { x: 14.5, z: 18.5, face: 0, hidden: true },
      旧水闸安全步道: { x: 26.5, z: 5.6, face: Math.PI / 2 }, 旧水闸安全路侧: { x: 24.5, z: 6.7, face: 0.8 }, 河岸安全步道: { x: 22.6, z: 9.6, face: 0 },
      林桥桥头: { x: 23.6, z: 30.5, face: Math.PI / 2 },
    },
  }
}
export const SLUICE_X0 = sluiceX0

// ---------- 浅林 48×40：北接农场，林间小路、营火空地，西侧倒木挡住深林 ----------
const forestPath = (z: number) => 23.5 + 2.2 * Math.sin(z / 7)
const CLEARING = { x: 24, z: 22, r: 5.2 }
function forestGround(x: number, z: number) {
  const cx = x + 0.5, cz = z + 0.5
  const dc = Math.hypot(cx - CLEARING.x, cz - CLEARING.z)
  if (z <= 17 && Math.abs(cx - forestPath(z)) < 1.1) return 1
  if (dc < 2.2) return 1
  if (Math.abs(cz - (CLEARING.z + 0.3 * Math.sin(cx / 3))) < 1.1 && cx >= 5 && cx <= CLEARING.x) return 1 // 西去倒木
  if (Math.abs(cx - (32 + (cz - 26) * 0.6)) < 1.0 && cz >= 26 && cz <= 36) return 1 // 东南蘑菇谷
  return 0
}
// 是否留空（路、空地、锚点周围不长树）
export function forestOpen(x: number, z: number) {
  const cx = x + 0.5, cz = z + 0.5
  if (Math.hypot(cx - CLEARING.x, cz - CLEARING.z) < CLEARING.r) return true
  if (Math.hypot(cx - 34, cz - 33) < 3.6) return true // 蘑菇谷
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (forestGround(x + dx, z + dz) === 1) return true
  return z <= 3 || x <= 1 || x >= 46 || z >= 38
}
const FOREST: RegionDef = {
  id: 'forest', key: 'forest', name: tr('common.woods'), w: 48, h: 40, spawn: [24, 1.6], ground: forestGround,
  buildings: [],
  decor: [
    { m: 'campfire', x: CLEARING.x, z: CLEARING.z, solid: true },
    { m: 'logBig', x: 20.6, z: 25.6, rot: 0.3 }, { m: 'log', x: 27.4, z: 18.7, rot: 2.2 },
    { m: 'logBig', x: 4.6, z: 22.4, rot: Math.PI / 2, solid: true }, { m: '', x: 4.5, z: 21.5, solid: true }, { m: '', x: 4.5, z: 23.5, solid: true },
    { m: 'signRegion', x: 7.5, z: 20.4, rot: Math.PI / 2, solid: true },
    { m: 'signpost', x: 25.6, z: 2.4, rot: Math.PI, solid: true },
    { m: 'tent', x: 28.6, z: 24.8, rot: -0.7, solid: true },
    ...[[19.5, 8.5], [27.5, 12.5], [18.5, 29.5], [30.5, 20.5], [14.5, 17.5], [36.5, 30.5], [38.5, 35.5], [10.5, 12.5]]
      .map(([x, z]) => ({ m: 'bushBerry', x, z, solid: true })),
  ],
  exits: [{ x0: 23, z0: 0, x1: 24, z1: 0, to: 'farm', tx: 24, tz: 38.2 }],
  spots: {
    浅林入口: { x: 25.2, z: 4.6, face: 0 }, 浅林入口植物观察处: { x: 20.6, z: 8.2, face: -0.6 }, 浅林空地: { x: 25.6, z: 21, face: -Math.PI / 2 },
  },
}

// ---------- 山道·矿口 36×30：南接小镇，北端山崖下是矿口 ----------
const mtLeft = (z: number) => 3.2 + 1.6 * Math.sin(z / 3.7)
const mtRight = (z: number) => 31.5 - 1.6 * Math.sin(z / 4.3 + 1)
const mtPath = (z: number) => 17.5 + 2.4 * Math.sin((29 - z) / 6)
export const STATION = { x: 22, z: 13, w: 8, d: 6 }
function mountainGround(station: number) {
  return (x: number, z: number) => {
    // 驿站完工后打通东去风车高地的驿道（8.1）
    if (station === 2 && (z === 11 || z === 12) && x >= 26) return 1
    return mountainBase(x, z)
  }
}
function mountainBase(x: number, z: number) {
  const cx = x + 0.5
  if (z < 2 || cx < mtLeft(z) || cx > mtRight(z)) return 5
  if (z < 6 && (x < 14 || x > 21)) return 5 // 矿口两侧的崖壁
  if (z >= 6 && z <= 8 && x >= 14 && x <= 21) return 1 // 矿口前的平台
  if (z >= 6 && Math.abs(cx - mtPath(z)) < 1.1) return 1
  return 0
}
const mountain = (station: number): RegionDef => ({
  id: 'mountain', key: 'mountain:' + station, name: tr('regions.mountainPathMineEntrance'), w: 36, h: 30, spawn: [18, 28.4], ground: mountainGround(station),
  outside: (x, z) => (station === 2 && (z === 11 || z === 12) && x >= 26 ? 1 : 5),
  buildings: [
    { id: 'mine_entrance', name: tr('common.mineEntrance'), x: 15, z: 2, w: 6, d: 4, act: 'mine', model: 'models/g2/mine_entrance.glb' },
    { id: 'mine_sign', name: tr('regions.mineSafetyNotice'), x: 13, z: 6, w: 1, d: 1, act: 'sign', model: '' },
    // 17.1 驿站：破败 / 施工 / 完成；完成后是阿满与段行的柜台
    station === 2 ? { id: 'station', name: tr('regions.waystationAhManDuan'), ...STATION, act: 'door', enter: 'in:station', shop: 'station', model: 'models/g3/buildings/station.glb' }
      : { id: 'station_site', name: station ? tr('regions.waystationConstructionSite') : tr('regions.oldWaystation'), ...STATION, act: 'project', project: 'station', model: `models/g3/buildings/station_${station ? 'scaffold' : 'ruined'}.glb` },
  ],
  decor: [
    { m: 'mineLamp', x: 14.5, z: 6.5, solid: true }, { m: 'mineLamp', x: 21.5, z: 6.5, solid: true },
    { m: 'signpost', x: 20.6, z: 7.6, rot: -0.3, solid: true }, { m: 'mineCart', x: 13.6, z: 7.8, rot: 0.4, solid: true },
    { m: 'signRegion', x: 15.4, z: 26.6, rot: 0.2, solid: true }, { m: 'bench', x: 12.6, z: 16, rot: Math.PI / 2, solid: true },
    { m: 'rockLarge', x: 8.5, z: 12.5, rot: 0.6, solid: true }, { m: 'rockWide', x: 26.5, z: 20.5, rot: 2.1, solid: true },
    { m: 'rockLarge', x: 24.5, z: 10.5, rot: 2.6, solid: true }, { m: 'rockWide', x: 7.5, z: 23.5, rot: 0.3, solid: true },
    { m: 'logStack', x: 22.6, z: 8.4, rot: 0.1, solid: true },
    { m: 'safetySign', x: 13.4, z: 6.6, rot: 0.3, solid: true }, { m: 'rescueCabinet', x: 22.6, z: 6.6, rot: -0.2, solid: true },
    ...(station === 2 ? [{ m: 'traderStall', x: 24.5, z: 21, solid: true }, { m: '', x: 25.5, z: 21, solid: true }, { m: '', x: 23.5, z: 21, solid: true }, { m: 'signRegion', x: 33.4, z: 10.4, rot: -Math.PI / 2, solid: true }] : []),
  ],
  exits: [
    { x0: 17, z0: 29, x1: 18, z1: 29, to: 'town', tx: 22.9, tz: 1.6 },
    ...(station === 2 ? [{ x0: 35, z0: 11, x1: 35, z1: 12, to: 'highland' as RegionId, tx: 1.6, tz: 15.5 }, { x0: 26, z0: 18, x1: 26, z1: 18, to: 'in:station' as RegionId, tx: 0, tz: 0 }] : []),
  ],
  spots: {
    矿口: { x: 19.5, z: 7.4, face: 0 }, 山道长凳: { x: 13.4, z: 16, face: Math.PI / 2, sit: true }, 山道草药坡: { x: 9.5, z: 20.5, face: 0.6 },
    驿站柜台: { x: 26, z: 19.6, face: Math.PI }, 驿站门廊: { x: 23.4, z: 19.8, face: Math.PI }, 驿站后屋: { x: 26, z: 14, face: 0, hidden: true },
  },
})
export const MINE_DOOR: [number, number] = [18, 7.2]

// ---------- 深林 40×32：林桥东去，硬木古树、巨蘑菇与林中石龛（14.3 硬木需铁斧） ----------
const dfPath = (x: number) => 15.5 + 3 * Math.sin(x / 6)
export const DF_CAMP = { x: 28, z: 12, r: 3.4 }
function deepforestGround(x: number, z: number) {
  const cx = x + 0.5, cz = z + 0.5
  if (Math.abs(cz - dfPath(cx)) < 1.1 && cx < 34) return 1
  if (Math.hypot(cx - DF_CAMP.x, cz - DF_CAMP.z) < 2) return 1
  if (Math.abs(cx - (28 + (cz - 12) * 0.1)) < 0.9 && cz > 12 && cz < dfPath(cx) + 1) return 1
  if (Math.hypot(cx - 33, cz - 25) < 2.6) return 2 // 林间小潭
  return 0
}
export function deepforestOpen(x: number, z: number) {
  const cx = x + 0.5, cz = z + 0.5
  if (Math.hypot(cx - DF_CAMP.x, cz - DF_CAMP.z) < DF_CAMP.r || Math.hypot(cx - 10, cz - 6) < 3 || Math.hypot(cx - 33, cz - 25) < 4) return true
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (deepforestGround(x + dx, z + dz) === 1) return true
  return x <= 1 || z <= 1 || x >= 38 || z >= 30
}
const DEEPFOREST: RegionDef = {
  id: 'deepforest', key: 'deepforest', name: tr('common.deepWoods'), w: 40, h: 32, spawn: [1.6, 15.5], ground: deepforestGround,
  buildings: [],
  decor: [
    { m: 'campfire', x: DF_CAMP.x, z: DF_CAMP.z, solid: true }, { m: 'tent', x: 30.6, z: 10.2, rot: -0.8, solid: true },
    { m: 'forestShrine', x: 10, z: 6, solid: true }, { m: 'signRegion', x: 2.5, z: 13.4, rot: Math.PI / 2, solid: true },
    ...[[6, 22], [16, 26], [22, 4], [35, 6], [13, 12], [36, 18]].map(([x, z], k) => ({ m: k % 2 ? 'giantMushroom' : 'mossyRock_a', x: x + 0.5, z: z + 0.5, rot: k * 1.7, solid: true })),
    ...[[4, 8], [19, 19], [25, 28], [30, 20], [8, 28], [17, 9]].map(([x, z], k) => ({ m: k % 2 ? 'mossyRock_b' : 'giantMushroom', x: x + 0.5, z: z + 0.5, rot: k * 2.3, solid: true })),
    ...Array.from({ length: 26 }, (_, k) => ({ m: k % 2 ? 'fern_a' : 'fern_b', x: 2 + ((k * 7.3) % 36), z: 2 + ((k * 11.7) % 28), rot: k })),
  ],
  exits: [{ x0: 0, z0: 14, x1: 0, z1: 17, to: 'river', tx: 46.2, tz: 21.5 }],
  spots: { 深林入口: { x: 3.5, z: 15.6, face: Math.PI / 2 }, 古树下: { x: 20.5, z: 8.5, face: 0 }, 深林营地: { x: 26.6, z: 13.4, face: 0.8 } },
}

// ---------- 湿地 40×32：林桥南去，浅水、香蒲与木栈道，观鸟小屋（14.2 湿地鱼） ----------
const WET_PONDS: [number, number, number][] = [[12, 14, 6], [27, 20, 7], [10, 27, 4], [32, 8, 4]]
const onBoardwalk = (x: number, z: number) => (z === 16 && x >= 4 && x <= 34) || (x === 21 && z >= 2 && z <= 16) || (x === 27 && z >= 16 && z <= 29)
function wetlandGround(x: number, z: number) {
  const cx = x + 0.5, cz = z + 0.5
  const wet = WET_PONDS.some(([px, pz, r]) => Math.hypot((cx - px) * 0.85, cz - pz) < r + 0.8 * Math.sin(cx * 0.9 + cz * 0.7))
  if (onBoardwalk(x, z)) return wet ? 6 : 1
  if (wet) return 2
  if ((x === 19 || x === 20) && z <= 3) return 1
  return 0
}
// 栈道木板、水边香蒲、水面睡莲（按格确定，不随日刷新）
function wetlandDecor(): Decor[] {
  const out: Decor[] = []
  for (let z = 0; z < 32; z++) for (let x = 0; x < 40; x++) {
    const g = wetlandGround(x, z)
    if (onBoardwalk(x, z)) out.push({ m: 'boardwalk', x: x + 0.5, z: z + 0.5, rot: z === 16 ? Math.PI / 2 : 0 })
    else if (g === 2 && rand(x, z, 931) < 0.07) out.push({ m: 'lilyFlower', x: x + 0.5, z: z + 0.5, rot: rand(x, z, 932) * 6 })
    else if (g === 0 && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => wetlandGround(x + a, z + b) === 2) && rand(x, z, 933) < 0.25)
      out.push({ m: rand(x, z, 934) < 0.5 ? 'cattail_a' : 'cattail_b', x: x + 0.3 + rand(x, z, 935) * 0.4, z: z + 0.3 + rand(x, z, 936) * 0.4, rot: rand(x, z, 937) * 6 })
  }
  return out
}
const WETLAND: RegionDef = {
  id: 'wetland', key: 'wetland', name: tr('common.wetland'), w: 40, h: 32, spawn: [19.5, 1.6], ground: wetlandGround,
  outside: (x, z) => (WET_PONDS.some(([px, pz, r]) => Math.hypot(x - px, z - pz) < r) ? 2 : 0),
  buildings: [{ id: 'bird_hide', name: tr('regions.birdHideShenZhous'), x: 28, z: 5, w: 3, d: 2, model: 'models/g3/regions/bird_hide.glb' }],
  decor: [
    { m: 'signRegion', x: 22.5, z: 2.5, rot: 0, solid: true }, { m: 'heron', x: 25.5, z: 21.5, rot: 1.2 },
    ...wetlandDecor(),
    ...[[3, 6], [36, 14], [6, 20], [35, 27], [16, 5]].map(([x, z], k) => ({ m: k % 2 ? 'wetlandDeadtree' : 'mudMound', x: x + 0.5, z: z + 0.5, rot: k, solid: true })),
  ],
  exits: [{ x0: 18, z0: 0, x1: 21, z1: 0, to: 'river', tx: 39.5, tz: 34.2 }],
  spots: { 湿地入口: { x: 20.5, z: 3, face: 0 }, 湿地栈道: { x: 15.5, z: 16.5, face: Math.PI / 2 }, 观鸟小屋: { x: 29.5, z: 7.6, face: 0 } },
}

// ---------- 风车高地 40×32：驿道东去，草浪、石墙与旧风车（17.1 风车工程） ----------
export const WINDMILL = { x: 24, z: 7, w: 6, d: 6 }
function highlandGround(x: number, z: number) {
  const cx = x + 0.5, cz = z + 0.5
  if ((z === 15 || z === 16) && x <= 22) return 1
  if (Math.abs(cx - (22 + (cz - 15) * -0.2)) < 1 && cz >= 13 && cz <= 16) return 1
  if (Math.abs(cz - (14 - (cx - 22) * 0.3)) < 1 && cx >= 22 && cx <= 27) return 1
  if (Math.hypot(cx - 34, cz - 24) < 2.2) return 3 // 观景台石板
  if ((cx > 32 && cz < 4) || (cx > 37 && cz > 28)) return 5
  return 0
}
const highland = (windmill: number, fest = ''): RegionDef => ({
  id: 'highland', key: 'highland:' + windmill + ':' + fest, name: tr('common.windmillHeights'), w: 40, h: 32, spawn: [1.6, 15.5], ground: highlandGround,
  outside: (x, z) => (x > 36 || z < 0 ? 5 : 0),
  buildings: [
    windmill === 2 ? { id: 'windmill', name: tr('common.windmill'), ...WINDMILL, act: 'project', project: 'windmill', model: 'models/buildings/windmill.glb' }
      : { id: 'windmill_site', name: windmill ? tr('regions.windmillConstructionSite') : tr('regions.oldWindmill'), ...WINDMILL, act: 'project', project: 'windmill', model: `models/buildings/windmill_${windmill ? 'scaffold' : 'ruined'}.glb` },
    ...festParts(fest).buildings,
  ],
  decor: [
    { m: 'lookoutBench', x: 34, z: 25.4, rot: Math.PI, solid: true }, { m: 'signRegion', x: 2.5, z: 13.4, rot: Math.PI / 2, solid: true },
    ...[[8, 6], [15, 25], [31, 18], [5, 26], [18, 4]].map(([x, z], k) => ({ m: 'cairn', x: x + 0.5, z: z + 0.5, rot: k * 1.3, solid: true })),
    ...[[12, 12], [20, 21], [30, 12], [10, 21]].map(([x, z], k) => ({ m: 'windFlag', x: x + 0.5, z: z + 0.5, rot: k, solid: true })),
    ...Array.from({ length: 9 }, (_, k) => ({ m: 'stoneWall', x: 6.5 + k, z: 9.5, solid: true })), { m: 'stoneWallCorner', x: 15.5, z: 9.5, solid: true },
    ...Array.from({ length: 7 }, (_, k) => ({ m: 'stoneWall', x: 25.5 + k, z: 20.5, solid: true })),
    ...Array.from({ length: 40 }, (_, k) => ({ m: k % 3 ? (k % 2 ? 'highlandGrass_a' : 'highlandGrass_b') : (k % 2 ? 'alpineFlower_a' : 'alpineFlower_b'), x: 1.5 + ((k * 9.7) % 36), z: 1.5 + ((k * 13.1) % 29), rot: k })),
    ...festParts(fest).decor,
  ],
  exits: [{ x0: 0, z0: 14, x1: 0, z1: 17, to: 'mountain', tx: 34.2, tz: 11.5 }],
  spots: { 高地入口: { x: 3.5, z: 15.6, face: Math.PI / 2 }, 风车工地: { x: 26.5, z: 14.6, face: Math.PI }, 观景台: { x: 34, z: 24, face: 0.6 } },
})

// ---------- 矿洞楼层（15.1）：3×2 房间格，每格套一个 8×8 手工模板（随机旋转/翻转），生成树连通 ----------
// 每个主题区 8 套手工房间模板（共 24 套，设计 §15.1）：苔石浅矿 / 旧铁矿（巷道、矿柱）/ 寒晶深矿（冰脊、晶柱）；每套内部四连通
const ROOMS_MOSS = [
  ['........', '........', '........', '........', '........', '........', '........', '........'],
  ['##....##', '#......#', '........', '........', '........', '........', '#......#', '##....##'],
  ['........', '........', '...##...', '..####..', '..####..', '...##...', '........', '........'],
  ['........', '.#....#.', '........', '...##...', '...##...', '........', '.#....#.', '........'],
  ['##....##', '##....##', '........', '........', '........', '........', '##....##', '##....##'],
  ['........', '........', '........', '.....###', '.....###', '....####', '...#####', '...#####'],
  ['........', '........', '###..###', '###..###', '........', '........', '........', '........'],
  ['#.......', '........', '.....#..', '....###.', '........', '.##.....', '.##.....', '......##'],
]
const ROOMS_IRON = [
  ['..#..#..', '..#..#..', '........', '##....##', '##....##', '........', '..#..#..', '..#..#..'],
  ['###..###', '###..###', '###..###', '........', '........', '###..###', '###..###', '###..###'],
  ['........', '.######.', '........', '........', '........', '........', '.######.', '........'],
  ['........', '.##..##.', '.##..##.', '........', '........', '.##..##.', '.##..##.', '........'],
  ['.....###', '.....###', '###.....', '###.....', '.....###', '.....###', '###.....', '###.....'],
  ['........', '........', '..####..', '..#.....', '..#.....', '..####..', '........', '........'],
  ['##....##', '##....##', '........', '.#.##.#.', '.#.##.#.', '........', '##....##', '##....##'],
  ['....####', '....####', '....####', '........', '........', '........', '........', '........'],
]
const ROOMS_FROST = [
  ['........', '..#.....', '..##....', '....##..', '.....##.', '........', '.#......', '........'],
  ['........', '.##..##.', '.#....#.', '........', '........', '.#....#.', '.##..##.', '........'],
  ['.#...#..', '...#...#', '.#...#..', '...#...#', '.#...#..', '...#...#', '.#...#..', '...#...#'],
  ['###.....', '##......', '#.......', '#...##..', '#...##..', '#.......', '##......', '###.....'],
  ['....####', '....####', '....####', '........', '####....', '####....', '####....', '........'],
  ['........', '.#.#.#..', '........', '..#.#.#.', '........', '.#.#.#..', '........', '..#.#.#.'],
  ['#......#', '........', '...##...', '..#..#..', '........', '........', '........', '#......#'],
  ['........', '........', '#######.', '........', '........', '.#######', '........', '........'],
]
export const MINE_ROOMS = [ROOMS_MOSS, ROOMS_IRON, ROOMS_FROST]
export const MINE_W = 32
export const MINE_H = 22
export interface MineFloor {
  floor: number; theme: number; g: Uint8Array; obs: Map<number, ObKind>; up: [number, number]; exit: number; spawn: [number, number]
  foes: { k: FoeKind; x: number; z: number }[]; decor: Decor[]; lift: [number, number] | null; boss: string | null
}
// 三个主题的摆件（15.1）：灯、装饰、矿车
const THEME_DECOR = [
  { lamp: 'mineLamp', glow: 'mossGlow', support: 'mineSupport', cart: 'mineCart', extra: 'mossGlow' },
  { lamp: 'ironLamp', glow: 'slagHeap', support: 'ironSupport', cart: 'mineCartRusty', extra: 'railStraight' },
  { lamp: 'frostLamp', glow: 'crystalCluster_a', support: 'iceIcicles', cart: 'crystalCluster_b', extra: 'crystalCluster_a' },
]
const mineCache = new Map<string, MineFloor>()
const m0 = (p: [number, number]) => p[1] * MINE_W + p[0]
export function mineFloor(seed: number, day: number, floor: number): MineFloor {
  const key = `${seed}:${day}:${floor}`
  let m = mineCache.get(key)
  if (!m) {
    m = isRestFloor(floor) ? restFloor(seed, floor) : isBossFloor(floor) ? bossFloor(floor) : genFloor(seed, day, floor)
    if (mineCache.size > 12) mineCache.clear()
    mineCache.set(key, m)
  }
  return m
}

function genFloor(seed: number, day: number, floor: number): MineFloor {
  const W = MINE_W, H = MINE_H
  const theme = mineTheme(floor)
  const TD = THEME_DECOR[theme]
  const R = (...k: number[]) => rand(seed, day, floor, 9001, ...k)
  const g = new Uint8Array(W * H).fill(5)
  const carve = (x: number, z: number) => { if (x >= 1 && z >= 1 && x < W - 1 && z < H - 1) g[z * W + x] = 4 }
  // 活动格：6 格中随机去掉 1 格（3×2 网格去掉任一格后仍连通）
  const cells: [number, number][] = []
  for (let cz = 0; cz < 2; cz++) for (let cx = 0; cx < 3; cx++) cells.push([cx, cz])
  if (R(1) < 0.5) cells.splice(Math.floor(R(2) * 6), 1)
  const anchor = new Map<string, [number, number]>()
  for (const [cx, cz] of cells) {
    const set = MINE_ROOMS[theme]
    const t = set[Math.floor(R(3, cx, cz) * set.length)]
    const rot = Math.floor(R(4, cx, cz) * 4)
    const flip = R(5, cx, cz) < 0.5
    const ox = 2 + cx * 10, oz = 2 + cz * 10
    let best: [number, number] = [ox + 4, oz + 4], bd = 99
    for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) {
      let u = flip ? 7 - i : i, v = j
      for (let r = 0; r < rot; r++) [u, v] = [7 - v, u]
      if (t[v][u] !== '.') continue
      carve(ox + i, oz + j)
      const d = Math.abs(i - 3.5) + Math.abs(j - 3.5)
      if (d < bd) { bd = d; best = [ox + i, oz + j] }
    }
    anchor.set(`${cx},${cz}`, best)
  }
  // 生成树：随机深度优先；40% 再加一条回路
  const has = (cx: number, cz: number) => anchor.has(`${cx},${cz}`)
  const edges: [[number, number], [number, number]][] = []
  const seen = new Set<string>()
  const start = cells[Math.floor(R(6) * cells.length)]
  const stack = [start]
  seen.add(`${start[0]},${start[1]}`)
  let step = 0
  while (stack.length) {
    const [cx, cz] = stack[stack.length - 1]
    const next = ([[1, 0], [-1, 0], [0, 1], [0, -1]] as const).map(([dx, dz]) => [cx + dx, cz + dz] as [number, number])
      .filter(([x, z]) => has(x, z) && !seen.has(`${x},${z}`))
    if (!next.length) { stack.pop(); continue }
    const n = next[Math.floor(R(7, step++) * next.length)]
    seen.add(`${n[0]},${n[1]}`)
    edges.push([[cx, cz], n])
    stack.push(n)
  }
  if (R(8) < 0.4) {
    const extra = cells.flatMap(([cx, cz]) => [[cx + 1, cz], [cx, cz + 1]].filter(([x, z]) => has(x, z)).map((n) => [[cx, cz], n] as [[number, number], [number, number]]))
      .filter(([a, b]) => !edges.some(([p, q]) => (p + '' === a + '' && q + '' === b + '') || (p + '' === b + '' && q + '' === a + '')))
    if (extra.length) edges.push(extra[Math.floor(R(9) * extra.length)])
  }
  const corridor = new Set<number>()
  edges.forEach(([a, b], k) => {
    const [ax, az] = anchor.get(a + '')!
    const [bx, bz] = anchor.get(b + '')!
    const hFirst = R(10, k) < 0.5
    const [mx, mz] = hFirst ? [bx, az] : [ax, bz]
    for (const [x0, z0, x1, z1] of [[ax, az, mx, mz], [mx, mz, bx, bz]]) {
      for (let x = Math.min(x0, x1); x <= Math.max(x0, x1) + 1; x++) for (let z = Math.min(z0, z1); z <= Math.max(z0, z1) + 1; z++) {
        carve(x, z)
        corridor.add(z * W + x)
      }
    }
  })
  // 入口房与出口房：格距最远的一对
  const entryCell = cells[Math.floor(R(11) * cells.length)]
  const dist = (a: [number, number], b: [number, number]) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1])
  const exitCell = cells.filter((c) => c !== entryCell).sort((a, b) => dist(b, entryCell) - dist(a, entryCell) || R(12, a[0], a[1]) - R(12, b[0], b[1]))[0]
  const up = anchor.get(entryCell + '')!
  const spawn: [number, number] = [up[0] + 0.5, up[1] + 1.5]
  carve(up[0], up[1]); carve(up[0], up[1] + 1); carve(up[0] - 1, up[1] + 1); carve(up[0] + 1, up[1] + 1)
  const [ex, ez] = anchor.get(exitCell + '')!
  const exit = ez * W + ex
  carve(ex, ez)
  // 岩块：离入口 2 格外的空地约 20%；按主题出产铜/铁/晶矿与煤，深层出现需要铁镐的大片岩块
  const obs = new Map<number, ObKind>()
  obs.set(exit, 'exit')
  const depth = floor - theme * 10
  for (let z = 1; z < H - 1; z++) for (let x = 1; x < W - 1; x++) {
    const i = z * W + x
    if (g[i] !== 4 || i === exit || Math.max(Math.abs(x - up[0]), Math.abs(z - up[1])) <= 2) continue
    if (R(20, i) >= 0.2) continue
    const r = R(21, i)
    const ore = 0.12 + 0.015 * depth
    obs.set(i, theme === 0 ? (r < ore ? 'copper' : r < ore + 0.08 ? 'coal' : 'rock')
      : theme === 1 ? (r < ore ? 'iron' : r < ore + 0.04 ? 'copper' : r < ore + 0.12 ? 'coal' : r < ore + 0.18 && !corridor.has(i) ? 'boulder' : 'rock')
        : (r < ore * 0.8 ? 'crystal' : r < ore * 0.8 + 0.06 ? 'iron' : r < ore * 0.8 + 0.12 ? 'coal' : r < ore * 0.8 + 0.2 && !corridor.has(i) ? 'boulder' : 'rock'))
  }
  // 15.1 核心通路必须能用当前阶段工具通过：入口到出口只走普通岩块可敲开的路，否则移除挡路的高阶岩块
  const hard = (k?: ObKind) => k === 'boulder' || k === 'iron' || k === 'crystal'
  const reach = () => {
    const seen = new Uint8Array(W * H)
    const q = [m0(up)]
    seen[q[0]] = 1
    for (let h = 0; h < q.length; h++) {
      const i = q[h]
      for (const d of [1, -1, W, -W]) {
        const n = i + d
        if (seen[n] || g[n] !== 4 || hard(obs.get(n))) continue
        seen[n] = 1
        q.push(n)
      }
    }
    return seen[exit] === 1
  }
  if (!reach()) for (const [i, k] of [...obs]) if (k === 'boulder') obs.delete(i)
  if (!reach()) for (const [i, k] of [...obs]) if (hard(k)) obs.set(i, 'rock')
  // 摆件：每房一盏挂灯（贴北墙），装饰、支撑梁、矿车
  const decor: Decor[] = []
  const wallN = (x: number, z: number) => g[z * W + x] === 4 && g[(z - 1) * W + x] === 5 && !obs.has(z * W + x)
  for (const [cx, cz] of cells) {
    const [ax, az] = anchor.get(`${cx},${cz}`)!
    for (let dz = 0; dz < 6; dz++) {
      const z = az - dz
      if (z >= 1 && wallN(ax + 1, z) && z * W + ax + 1 !== m0(up)) { decor.push({ m: TD.lamp, x: ax + 1.5, z: z + 0.35, solid: true }); break }
    }
  }
  const open = () => {
    const taken = new Set(decor.filter((d) => d.solid).map((d) => Math.floor(d.z) * W + Math.floor(d.x)))
    const out: number[] = []
    for (let i = 0; i < W * H; i++) {
      const x = i % W, z = (i / W) | 0
      if (g[i] === 4 && !obs.has(i) && !taken.has(i) && i !== exit && Math.hypot(x - up[0], z - up[1]) >= 7) out.push(i)
    }
    return out
  }
  let free = open()
  for (let k = 0; k < 7; k++) {
    const i = free[Math.floor(R(40, k) * free.length)]
    if (i !== undefined) decor.push({ m: k % 2 ? TD.glow : TD.extra, x: (i % W) + 0.2 + R(41, k) * 0.6, z: ((i / W) | 0) + 0.2 + R(42, k) * 0.6, rot: R(43, k) * 6.28 })
  }
  const cl = [...corridor]
  const ci = cl[Math.floor(R(44) * cl.length)]
  if (ci !== undefined && !obs.has(ci)) decor.push({ m: TD.support, x: (ci % W) + 1, z: ((ci / W) | 0) + 0.5, rot: R(45) < 0.5 ? 0 : Math.PI / 2 })
  const cart = free[Math.floor(R(46) * free.length)]
  if (cart !== undefined) decor.push({ m: TD.cart, x: (cart % W) + 0.5, z: ((cart / W) | 0) + 0.5, rot: R(47) * 6.28, solid: true })
  // 敌人：本主题前两种从第 1 层起，第三、四种在本主题后半出现；数量随层数增加（15.4 无出生点偷袭）
  free = open()
  const foes: MineFloor['foes'] = []
  const kinds = MINE_THEMES[theme].foes
  const want: FoeKind[] = depth < 5
    ? [...Array(1 + depth).fill(kinds[0]), ...Array(Math.max(0, depth - 1)).fill(kinds[1]), ...(theme && depth >= 3 ? [kinds[2]] : [])]
    : [...Array(2).fill(kinds[0]), ...Array(2).fill(kinds[1]), ...Array(depth - 5).fill(kinds[2]), ...Array(Math.max(1, depth - 6)).fill(kinds[3])]
  want.forEach((k, n) => {
    if (!free.length) return
    const i = free.splice(Math.floor(R(30, n) * free.length), 1)[0]
    foes.push({ k, x: (i % W) + 0.5, z: ((i / W) | 0) + 0.5 })
  })
  return { floor, theme, g, obs, up, exit, spawn, foes, decor, lift: null, boss: null }
}

// 5/15/25 层：无敌人的休息层，升降梯据点（15.1）
function restFloor(seed: number, floor: number): MineFloor {
  const W = MINE_W, H = MINE_H
  const theme = mineTheme(floor)
  const TD = THEME_DECOR[theme]
  const g = new Uint8Array(W * H).fill(5)
  for (let z = 3; z <= 18; z++) for (let x = 5; x <= 26; x++) {
    const corner = (x < 7 || x > 24) && (z < 5 || z > 16)
    if (!corner) g[z * W + x] = 4
  }
  const obs = new Map<number, ObKind>()
  const ore: ObKind = (['copper', 'iron', 'crystal'] as const)[theme]
  ;[[6, 10], [6, 13], [25, 9], [25, 12], [10, 17], [14, 17], [19, 17], [23, 16]].forEach(([x, z], k) =>
    obs.set(z * W + x, rand(seed, floor, k, 77) < 0.55 ? ore : 'coal'))
  const decor: Decor[] = [
    { m: 'campfire', x: 15.5, z: 11, solid: true }, { m: 'bench', x: 13.4, z: 11, rot: Math.PI / 2, solid: true }, { m: 'bench', x: 17.6, z: 11, rot: -Math.PI / 2, solid: true },
    { m: TD.lamp, x: 8.5, z: 3.35, solid: true }, { m: TD.lamp, x: 15.5, z: 3.35, solid: true }, { m: TD.lamp, x: 24.5, z: 4.35, solid: true },
    { m: TD.support, x: 12, z: 7.5 }, { m: TD.support, x: 20, z: 14.5 }, { m: TD.cart, x: 21.5, z: 9.5, rot: 1.2, solid: true },
    { m: 'supplyCrate', x: 11.5, z: 13.5, solid: true }, { m: 'rescueCabinet', x: 19.5, z: 4.4, solid: true },
    { m: 'signpost', x: 15.5, z: 18.4, rot: Math.PI, solid: true },
    ...[[7.5, 7.3], [24.2, 14.6], [11.4, 15.6], [19.6, 5.4]].map(([x, z], k) => ({ m: k % 2 ? TD.glow : TD.extra, x, z, rot: k * 1.3 })),
  ]
  return { floor, theme, g, obs, up: [8, 4], exit: -1, spawn: [8.5, 5.5], foes: [], decor, lift: [21, 4], boss: null }
}

// 10/20/30 层：首领房（15.5）。击败后出现下行梯与升降梯据点；深矿首领房有可作掩体的晶柱
function bossFloor(floor: number): MineFloor {
  const W = MINE_W, H = MINE_H
  const theme = mineTheme(floor)
  const TD = THEME_DECOR[theme]
  const g = new Uint8Array(W * H).fill(5)
  for (let z = 3; z <= 19; z++) for (let x = 4; x <= 27; x++) {
    const corner = (x < 6 || x > 25) && (z < 5 || z > 17)
    if (!corner) g[z * W + x] = 4
  }
  for (let z = 1; z <= 3; z++) for (let x = 14; x <= 17; x++) g[z * W + x] = 4 // 入口通道
  const obs = new Map<number, ObKind>()
  if (theme === 2) for (const [x, z] of [[9, 8], [22, 8], [9, 15], [22, 15], [15, 6], [16, 17]]) obs.set(z * W + x, 'pillar')
  const decor: Decor[] = [
    { m: 'bossGate', x: 22.5, z: 19.6 }, // 通往下层的石门（击败首领后门前出现下行梯）
    { m: TD.lamp, x: 6.5, z: 5.35, solid: true }, { m: TD.lamp, x: 25.5, z: 5.35, solid: true },
    { m: TD.glow, x: 6.4, z: 17.2, rot: 1 }, { m: TD.glow, x: 25.4, z: 16.8, rot: 2 },
  ]
  const boss = MINE_THEMES[theme].boss
  return { floor, theme, g, obs, up: [15, 1], exit: 18 * W + 22, spawn: [15.5, 3.5], foes: [{ k: boss, x: 16, z: 12 }], decor, lift: [7, 17], boss }
}

export function mineRegion(m: MineFloor, revealed: boolean, beaten = false): RegionDef {
  const W = MINE_W
  const ex = m.exit % W, ez = (m.exit / W) | 0
  const down = m.boss ? beaten && m.floor < 30 : revealed && m.exit >= 0
  const lift = m.lift && (!m.boss || beaten)
  return {
    id: 'mine', key: `mine:${m.floor}:${revealed ? 1 : 0}:${beaten ? 1 : 0}`, name: tr('common.minesFloor', m.floor, MINE_THEMES[m.theme].name), w: W, h: MINE_H, dark: true, theme: m.theme,
    spawn: m.spawn, ground: (x, z) => (x >= 0 && z >= 0 && x < W && z < MINE_H ? m.g[z * W + x] : 5), outside: () => 5,
    buildings: [
      { id: 'ladder_up', name: tr('regions.ladder'), x: m.up[0], z: m.up[1], w: 1, d: 1, act: 'up', model: 'models/g2/ladder_up.glb' },
      ...(down ? [{ id: 'ladder_down', name: tr('regions.ladderDown'), x: ex, z: ez, w: 1, d: 1, act: 'down' as const, model: 'models/g2/ladder_down.glb' }] : []),
      ...(lift ? [{ id: 'elevator', name: tr('regions.elevator'), x: m.lift![0], z: m.lift![1], w: 2, d: 2, act: 'lift' as const, model: 'models/g2/elevator.glb' }] : []),
    ],
    decor: m.decor, exits: [], spots: {},
  }
}

// ---------- 区域查询（按状态取变体，结果缓存） ----------
const fixed = new Map<string, RegionDef>()
// 所有室外区域：可进入建筑的门格都是出口（玩家走进去就进屋，居民也从这里进出）
function withDoors(r: RegionDef) {
  if (r.indoor) return r
  const extra = doorExits(r.buildings).filter((e) => !r.exits.some((x) => x.x0 === e.x0 && x.z0 === e.z0))
  if (extra.length) r.exits = [...r.exits, ...extra]
  return r
}
function cached(key: string, make: () => RegionDef) {
  let r = fixed.get(key)
  if (!r) { r = withDoors(make()); fixed.set(key, r) }
  return r
}
export interface RegionState {
  pet?: boolean; coop: number; fest: string; sluice: number; floor: number; seed: number; day: number; revealed: boolean; boss: boolean; farmB?: FarmBRef[]; house?: number; gh?: number
  bridge?: number; station?: number; windmill?: number // 公共工程 0 未开工 1 施工 2 完成
}
export function regionDef(id: RegionId, st: RegionState): RegionDef {
  switch (id) {
    case 'farm': {
      const fb = st.farmB ?? []
      const key = `farm:${st.house ?? 0}:${st.gh ?? 0}:${st.pet ? 1 : 0}:` + fb.map((b) => `${b.id},${b.k},${b.x},${b.z},${b.done <= st.day ? 1 : 0}${b.up && b.up <= st.day ? 1 : 0}`).join(';')
      if (fixed.size > 60) for (const k of [...fixed.keys()].filter((k) => k.startsWith('farm:')).slice(0, 20)) fixed.delete(k)
      return cached(key, () => farm(fb, st.day, st.house ?? 0, st.gh ?? 0, !!st.pet))
    }
    case 'town': { const f = festDef(st.fest)?.region === 'town' ? st.fest : ''; return cached('town:' + f, () => town(f)) }
    case 'river': { const f = FESTIVALS[st.fest]?.region === 'river' ? st.fest : ''; return cached(`river:${st.sluice}:${st.bridge ?? 0}:${f}`, () => river(st.sluice, st.bridge ?? 0, f)) }
    case 'forest': return FOREST
    case 'mountain': return cached('mountain:' + (st.station ?? 0), () => mountain(st.station ?? 0))
    case 'deepforest': return DEEPFOREST
    case 'wetland': return WETLAND
    case 'highland': { const f = st.fest === 'windmill_ceremony' ? st.fest : ''; return cached('highland:' + (st.windmill ?? 0) + f, () => highland(st.windmill ?? 0, f)) }
    default: {
      // 室内：门外站位来自对应的室外建筑（玩家建筑会移动，所以每次按当前位置求）
      const fb = st.farmB ?? []
      const outdoors = (room: string) => {
        if (room === 'in:house') return { region: 'farm' as RegionId, x: 24.5, z: 9.8 }
        const owned = /^in:\w+:(\d+)$/.exec(room)
        if (owned) {
          const b = fb.find((x) => x.id === Number(owned[1]))
          if (!b) return null
          const [w, d] = B_SIZE[b.k]
          return { region: 'farm' as RegionId, x: b.x + Math.floor(w / 2) + 0.5, z: b.z + d + 0.6 }
        }
        for (const r of [town(''), mountain(2)]) {
          const b = r.buildings.find((x) => x.enter === room)
          if (b) { const f = doorOfBuilding(b).front; return { region: r.id, x: f[0], z: f[1] } }
        }
        return null
      }
      const key = `${id}:${st.house ?? 0}:` + fb.map((b) => `${b.id},${b.x},${b.z},${b.done <= st.day ? 1 : 0}${b.up && b.up <= st.day ? 1 : 0}`).join(';')
      const def = cached(key, () => interiorDef(id, { day: st.day, house: st.house ?? 0, farmB: fb, outdoors })!)
      if (!def) fixed.delete(key)
      return def
    }
    case 'mine': {
      const m = mineFloor(st.seed, st.day, st.floor)
      return cached(`mine:${st.seed}:${st.day}:${st.floor}:${st.revealed}:${st.boss}`, () => {
        for (const k of fixed.keys()) if (k.startsWith('mine:') && !k.startsWith(`mine:${st.seed}:${st.day}:`)) fixed.delete(k)
        return mineRegion(m, st.revealed, st.boss)
      })
    }
  }
}
export const REGION_NAMES: Record<string, string> = { farm: tr('common.farm'), town: tr('common.town'), river: tr('common.riverside'), forest: tr('common.woods'), mountain: tr('regions.mountainPathMineEntrance'), mine: tr('regions.mines'), deepforest: tr('common.deepWoods'), wetland: tr('common.wetland'), highland: tr('common.windmillHeights'),
  'in:house': tr('common.home'), 'in:general': tr('common.generalStore'), 'in:smith': tr('common.blacksmith'), 'in:carpenter': tr('common.carpentryShop'), 'in:ranch': tr('common.ranch'), 'in:clinic': tr('common.clinic'), 'in:diner': tr('common.diner'), 'in:station': tr('common.waystation'),
  'in:hall': tr('regions.townHall'), 'in:school': tr('common.classroom'), 'in:community': tr('regions.communityHall'), 'in:house_a': tr('common.baiLusHouse'), 'in:house_b': tr('common.wenHengsHouse'), 'in:house_c': tr('common.grannyShisHouse') }
export const regionName = (id: string) => REGION_NAMES[id] ?? (id.startsWith('in:coop') ? tr('common.coop') : id.startsWith('in:barn') ? tr('common.barn') : id.startsWith('in:cabin') ? tr('common.cabin') : id.startsWith('in:workshop') ? tr('regions.workshop') : id)
// 静态区域（地图、小地图示意、预载模型用）
export const BASE_REGIONS = () => [farm([], 1, 0, 0), farm([], 1, 1, 2), town(''), ...Object.keys(FEST_LAYOUTS).map((f) => { const r = festDef(f)!.region; return r === 'town' ? town(f) : r === 'highland' ? highland(2, f) : river(2, 2, f) }), town('flower_fair'), river(0), river(1), river(2, 1), river(2, 2), FOREST, mountain(0), mountain(1), mountain(2),
  DEEPFOREST, WETLAND, highland(0), highland(1), highland(2)]
