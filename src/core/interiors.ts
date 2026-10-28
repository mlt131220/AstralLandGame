// 室内（设计 §22.4 室内 18 套布局、§17.4 家居）：进门等于换一张小地图。地图四周是墙（地面码 8），门在南墙正中，
// 走到门格回到室外门口。玩家自己的建筑（家宅、禽舍、畜棚、小屋、作坊）按建筑 id 区分实例，里面可以摆家具与机器。
import type { Act, Building, Decor, Exit, RegionDef, RegionId, Spot } from './regions.ts'
import { t } from './i18n.ts'

export type IndoorStyle = 'home' | 'shop' | 'barn' | 'stone'
export const FLOOR_WOOD = 7, WALL_IN = 8, FLOOR_TILE = 9, FLOOR_STRAW = 10
const FLOOR: Record<IndoorStyle, number> = { home: FLOOR_WOOD, shop: FLOOR_WOOD, barn: FLOOR_STRAW, stone: FLOOR_TILE }
export interface Layout {
  name: string; w: number; h: number; style: IndoorStyle
  decor: Decor[] // 家具与陈设（m 为 PROP_MODELS 的键）
  acts: { act: Act; name: string; x: number; z: number; w?: number; d?: number; shop?: string }[] // 可交互的点（床、柜台、灶台……）
  spots: Record<string, Spot>
}
// 家具摆放：占 w×d 格，solid 时阻挡；x、z 为左上格
const F = (m: string, x: number, z: number, w = 1, d = 1, rot = 0, solid = true): Decor[] => {
  const out: Decor[] = [{ m, x: x + w / 2, z: z + d / 2, rot }]
  if (solid) for (let j = z; j < z + d; j++) for (let i = x; i < x + w; i++) out.push({ m: '', x: i + 0.5, z: j + 0.5, solid: true })
  return out
}
const S = (x: number, z: number, face = 0, extra: Partial<Spot> = {}): Spot => ({ x, z, face, ...extra })

// ---------- 家宅：0 级 10×8；1 级加厨房 13×9；2 级加共居空间与阁楼楼梯 15×11 ----------
function house(lv: number): Layout {
  const w = [10, 13, 15][lv], h = [8, 9, 11][lv]
  const decor: Decor[] = [
    ...F(lv >= 2 ? 'bed_double' : 'bed_single', 1, 1, lv >= 2 ? 2 : 1, 2),
    ...F('fireplace', 4, 1, 2, 1), ...F('wardrobe_mirror', w - 2, 1),
    ...F('table_dining', 4, 4, 2, 1), ...F('chair_wood', 3, 4, 1, 1, Math.PI / 2), ...F('chair_wood', 6, 4, 1, 1, -Math.PI / 2),
    ...F('rug_large', 3, 3, 4, 3, 0, false), ...F('bookshelf', w - 3, 1),
    ...F('lamp_floor', 1, h - 3), { m: 'pet_bed', x: 7.5, z: 2.6 },
  ]
  const acts: Layout['acts'] = [
    { act: 'bed', name: t('interiors.bed'), x: 1, z: 1, w: lv >= 2 ? 2 : 1, d: 2 },
    { act: 'mirror', name: t('interiors.mirrorChangeLook'), x: w - 2, z: 1 },
    { act: 'desk', name: t('interiors.bookshelfWishBook'), x: w - 3, z: 1 },
  ]
  if (lv >= 1) {
    decor.push(...F('kitchen_counter', w - 4, h - 3), ...F('kitchen_stove', w - 3, h - 3), ...F('fridge_wood', w - 2, h - 3))
    acts.push({ act: 'kitchen', name: t('common.homeKitchen'), x: w - 3, z: h - 3 })
  }
  if (lv >= 2) decor.push(...F('stairs_up', w - 2, 4, 1, 2), ...F('sofa', 8, 1, 2, 1), ...F('table_coffee', 8, 2, 2, 1, 0, false))
  return { name: t('common.home'), w, h, style: 'home', decor, acts, spots: { 床边: S(2.5, 3.6, Math.PI), 餐桌: S(5, 5.6, Math.PI), 炉边: S(5, 2.6, Math.PI) } }
}
// ---------- 禽舍、畜棚：沿北墙一排喂食槽（每只动物一格）、窝或隔栏、干草投料斗 ----------
function coop(lv: number): Layout {
  const w = lv ? 14 : 10, h = 8, cap = lv ? 8 : 4
  const decor: Decor[] = [
    ...Array.from({ length: cap }, (_, i) => F('feed_bench', 2 + i, 1)).flat(),
    ...F('hay_hopper', 1, 1), ...Array.from({ length: lv ? 4 : 2 }, (_, i) => F('nest_box', w - 2, 2 + i)).flat(),
    ...F('perch', 2, h - 3, 2, 1), ...F('water_bucket', 1, h - 3), ...F('heater_coop', w - 2, h - 2),
    { m: 'straw_floor_patch_a', x: 4.5, z: 4.5 }, { m: 'straw_floor_patch_b', x: w - 4, z: 5.2 },
  ]
  return {
    name: lv ? t('common.bigCoop') : t('common.coop'), w, h, style: 'barn', decor,
    acts: [{ act: 'coop', name: t('interiors.feedCare'), x: 1, z: 1 }, { act: 'nest', name: t('interiors.nestEggsRabbitFur'), x: w - 2, z: 2, w: 1, d: lv ? 4 : 2 }],
    spots: {},
  }
}
function barn(lv: number): Layout {
  const w = lv ? 18 : 14, h = 10, cap = lv ? 8 : 4
  const decor: Decor[] = [
    ...Array.from({ length: cap }, (_, i) => F('feed_trough_barn', 2 + i * 1.5 > w - 3 ? 2 + i : 2 + i, 1)).flat(),
    ...F('hay_hopper', 1, 1), ...F('milk_station', w - 2, 2), ...F('tool_hooks', w - 2, 1),
    ...Array.from({ length: lv ? 3 : 2 }, (_, i) => F('barn_stall', 2 + i * 4, h - 4, 2, 2, 0, false)).flat(),
    ...F('water_bucket', w - 3, h - 3), ...F('water_bucket', w - 2, h - 3),
    { m: 'straw_floor_patch_a', x: 6.5, z: 4.5 }, { m: 'straw_floor_patch_b', x: w - 5, z: 6.2 },
  ]
  return { name: lv ? t('common.bigBarn') : t('common.barn'), w, h, style: 'barn', decor, acts: [{ act: 'coop', name: t('interiors.feedCare'), x: 1, z: 1 }], spots: {} }
}
const cabin = (): Layout => ({
  name: t('common.cabin'), w: 10, h: 8, style: 'home',
  decor: [...F('bed_single', 1, 1, 1, 2), ...F('table_dining', 4, 3, 2, 1), ...F('chair_wood', 3, 3, 1, 1, Math.PI / 2), ...F('rug_small', 4, 4, 2, 2, 0, false), ...F('cabinet_low', 7, 1), ...F('lamp_table', 8, 1)],
  acts: [{ act: 'cabin', name: t('interiors.storageCabinet48Slots'), x: 7, z: 1 }], spots: {},
})
const workshop = (): Layout => ({
  name: t('common.workshop'), w: 12, h: 8, style: 'shop',
  decor: [...F('workbench_carpenter', 1, 1, 2, 1), ...F('rack_lumber', 9, 1, 2, 1), { m: 'lamp_floor', x: 10.5, z: 5.5 }],
  acts: [], spots: {},
})
// ---------- 小镇与山道的公共室内（柜台后面是店主站位） ----------
const TOWN: Record<string, () => Layout> = {
  general: () => ({
    name: t('common.generalStore'), w: 14, h: 10, style: 'shop',
    decor: [...F('counter_shop', 5, 5, 3, 1), ...[1, 3, 9, 11].flatMap((x) => F('seed_rack', x, 1)), ...F('shelf_goods', 1, 4, 1, 2, Math.PI / 2), ...F('shelf_goods', 12, 4, 1, 2, -Math.PI / 2),
      ...F('table_produce', 9, 6, 2, 1), ...F('barrel_grain', 2, 7), ...F('barrel_grain', 3, 7), ...F('rug_small', 6, 7, 1, 1, 0, false), ...F('lamp_floor', 12, 7)],
    acts: [{ act: 'shop', name: t('interiors.counterLinTang'), x: 5, z: 5, w: 3, d: 1 }],
    spots: { 柜台: S(6.5, 4.4, Math.PI), 整理台: S(10, 2.4, 0), 货架前: S(2.6, 5, -Math.PI / 2) },
  }),
  smith: () => ({
    name: t('common.blacksmith'), w: 12, h: 9, style: 'stone',
    decor: [...F('forge_town', 1, 1, 2, 2), ...F('anvil', 4, 2), ...F('quench_tub', 4, 1), ...F('rack_tools_wall', 7, 1, 2, 1), ...F('crate_ore', 10, 1), ...F('counter_shop', 4, 5, 3, 1)],
    acts: [{ act: 'smith', name: t('interiors.counterOldTao'), x: 4, z: 5, w: 3, d: 1 }],
    spots: { 锻台: S(4.5, 3.4, 0), 工具架: S(8, 2.4, 0), 柜台: S(5.5, 4.4, Math.PI) },
  }),
  carpenter: () => ({
    name: t('common.carpentryShop'), w: 12, h: 9, style: 'shop',
    decor: [...F('workbench_carpenter', 1, 1, 2, 1), ...F('sawhorse', 5, 2, 2, 1), ...F('rack_lumber', 9, 1, 2, 1), ...F('chair_unfinished', 8, 4), ...F('wood_shavings', 4, 3, 1, 1, 0, false), ...F('counter_shop', 4, 5, 3, 1)],
    acts: [{ act: 'carpenter', name: t('interiors.counterHeYan'), x: 4, z: 5, w: 3, d: 1 }],
    spots: { 柜台: S(5.5, 4.4, Math.PI), 锯木台: S(6, 3.4, 0) },
  }),
  ranch: () => ({
    name: t('interiors.ranchOffice'), w: 10, h: 8, style: 'barn',
    decor: [...F('counter_ranch', 4, 4, 2, 1), ...F('feed_sacks', 1, 1), ...F('feed_sacks', 2, 1), ...F('saddle_stand', 8, 1), ...F('board_animals', 5, 1, 2, 1)],
    acts: [{ act: 'ranch', name: t('interiors.counterZhouQin'), x: 4, z: 4, w: 2, d: 1 }],
    spots: { 柜台: S(5, 3.4, Math.PI), 饲料堆: S(2, 2.6, 0) },
  }),
  clinic: () => ({
    name: t('common.clinic'), w: 12, h: 8, style: 'home',
    decor: [...F('bed_clinic', 1, 1, 1, 2), ...F('cabinet_medicine', 5, 1, 2, 1), ...F('desk_herbalist', 8, 3, 2, 1), ...F('screen_clinic', 2, 4, 2, 1)],
    acts: [{ act: 'clinic', name: t('interiors.medicineCabinetYeLan'), x: 5, z: 1, w: 2, d: 1 }],
    spots: { 药柜: S(6, 2.6, 0), 诊疗床边: S(2.6, 2.5, -Math.PI / 2), 书桌: S(9, 4.6, Math.PI) },
  }),
  diner: () => ({
    name: t('common.diner'), w: 14, h: 10, style: 'shop',
    decor: [...F('stove_diner', 5, 1, 2, 1), ...F('rack_dishes', 8, 1, 2, 1), ...F('board_menu', 2, 1), ...F('table_diner', 2, 5, 3, 1), ...F('bench_diner', 2, 6, 3, 1, 0, false),
      ...F('table_diner', 8, 5, 3, 1), ...F('bench_diner', 8, 6, 3, 1, 0, false), ...F('table_diner', 2, 3, 3, 1), ...F('lamp_floor', 12, 7)],
    acts: [{ act: 'kitchen', name: t('interiors.publicStoveXiaHe'), x: 5, z: 1, w: 2, d: 1 }],
    spots: { 灶台: S(6, 2.6, 0), 备菜台: S(8.5, 2.6, 0), 公共料理台: S(5, 2.6, 0.3), 角桌: S(10, 7.6, Math.PI), 靠窗桌: S(3, 4.4, 0), 靠门桌: S(3.5, 7.4, Math.PI) },
  }),
  station: () => ({
    name: t('common.waystation'), w: 12, h: 8, style: 'shop',
    decor: [...F('counter_station', 4, 4, 2, 1), ...F('sorter_mail', 1, 1, 2, 1), ...F('crates_station', 9, 1, 2, 1), ...F('bench_waiting', 8, 5, 2, 1), ...F('luggage', 10, 3)],
    acts: [{ act: 'station', name: t('interiors.counterAhManDuan'), x: 4, z: 4, w: 2, d: 1 }],
    spots: { 柜台: S(5, 3.4, Math.PI), 分拣格: S(2, 2.6, 0), 候车长椅: S(9, 4.4, Math.PI, { sit: true }) },
  }),
  hall: () => ({
    name: t('common.townHallArchive'), w: 16, h: 10, style: 'stone',
    decor: [...F('table_council', 5, 4, 3, 1), ...[1, 3, 11, 13].flatMap((x) => F('shelf_archives', x, 1, 2, 1)), ...F('table_map', 9, 6, 2, 1), ...F('lectern_council', 7, 1), ...F('cabinet_archives', 9, 1, 2, 1), ...F('lamp_floor', 14, 7)],
    acts: [{ act: 'museum', name: t('interiors.archiveDisplayCollectionDonations'), x: 9, z: 1, w: 2, d: 1 }],
    spots: { 会议桌: S(6.5, 5.6, Math.PI), 书架前: S(3, 2.6, 0), 地图桌: S(10, 5.4, 0), 讲台: S(7.5, 2.6, Math.PI) },
  }),
  school: () => ({
    name: t('common.classroom'), w: 12, h: 9, style: 'home',
    decor: [...F('board_classroom', 4, 1, 3, 1), ...F('desk_teacher', 5, 2, 2, 1), ...[[2, 4], [4, 4], [7, 4], [9, 4], [2, 6], [4, 6], [7, 6], [9, 6]].flatMap(([x, z]) => F('desk_student', x, z, 1, 1)),
      ...F('cabinet_specimens', 9, 1, 2, 1), ...F('globe', 1, 1)],
    acts: [], spots: { 讲台: S(5.5, 3.4, 0), 课桌: S(5.5, 5.4, Math.PI), 标本柜: S(10, 2.6, 0) },
  }),
  community: () => ({
    name: t('common.communityHall'), w: 16, h: 10, style: 'shop',
    decor: [...F('stage_small', 6, 1, 3, 2), ...F('easel_bailu', 2, 2), ...[[3, 5], [7, 5], [11, 5], [3, 7], [7, 7], [11, 7]].flatMap(([x, z]) => F('chairs_hall', x, z, 3, 1)), ...F('banner_hall', 12, 1), ...F('banner_hall', 3, 1)],
    acts: [], spots: { 舞台: S(7.5, 3.6, Math.PI), 画架: S(3, 3.4, 0), 长椅: S(4, 4.4, Math.PI, { sit: true }) },
  }),
  house_a: () => ({ name: t('common.baiLusHouse'), w: 10, h: 8, style: 'home', decor: [...F('easel_bailu', 1, 1), ...F('sofa', 4, 1, 2, 1), ...F('table_coffee', 4, 3, 1, 1, 0, false), ...F('bed_single', 8, 1, 1, 2), ...F('rug_large', 3, 3, 2, 2, 0, false), ...F('painting_wall', 6, 1), ...F('lamp_floor', 1, 5)], acts: [], spots: { 客厅: S(5, 4.6, Math.PI), 画桌: S(2, 2.6, 0) } }),
  house_b: () => ({ name: t('common.wenHengsHouse'), w: 10, h: 8, style: 'home', decor: [...F('bookshelf', 1, 1), ...F('bookshelf', 2, 1), ...F('desk_herbalist', 5, 1, 2, 1), ...F('bed_single', 8, 1, 1, 2), ...F('chair_rocking', 4, 4), ...F('clock_grandfather', 1, 5), ...F('lamp_table', 7, 1)], acts: [], spots: { 客厅: S(4.5, 5.6, Math.PI), 书桌: S(6, 2.6, 0) } }),
  house_c: () => ({ name: t('common.grannyShisHouse'), w: 10, h: 8, style: 'home', decor: [...F('chair_wicker', 2, 3), ...F('screen_embroidered', 1, 1, 2, 1), ...F('kitchen_stove', 7, 1), ...F('kitchen_counter', 6, 1), ...F('bed_single', 8, 4, 1, 2), ...F('rug_small', 3, 4, 1, 1, 0, false), ...F('stove_kettle', 4, 1)], acts: [], spots: { 藤椅: S(2.5, 3.5, Math.PI, { sit: true }), 灶台: S(7.5, 2.6, 0) } }),
}
// 公共室内的开门时间（商店按营业表，见 town.shopOpen）
export const INDOOR_HOURS: Record<string, [number, number]> = { hall: [540, 1080], school: [480, 960], community: [540, 1380], house_a: [540, 1200], house_b: [540, 1200], house_c: [540, 1200], diner: [600, 1380] }

// ---------- 室内 → 区域定义 ----------
export interface OwnedRef { id: number; k: string; x: number; z: number; done: number; up: number }
export interface InteriorState { day: number; house: number; farmB: OwnedRef[]; outdoors: (room: string) => { region: RegionId; x: number; z: number } | null }
export function parseRoom(id: string) {
  const [, kind, n] = id.split(':')
  return { kind, owner: n ? Number(n) : 0 }
}
export function layoutOf(id: string, st: InteriorState): Layout | null {
  const { kind, owner } = parseRoom(id)
  if (kind === 'house') return house(Math.min(2, st.house))
  if (owner) {
    const b = st.farmB.find((x) => x.id === owner)
    if (!b || b.done > st.day) return null
    const lv = b.up && b.up <= st.day ? 1 : 0
    return kind === 'coop' ? coop(lv) : kind === 'barn' ? barn(lv) : kind === 'cabin' ? cabin() : kind === 'workshop' ? workshop() : null
  }
  return TOWN[kind]?.() ?? null
}
export function interiorDef(id: string, st: InteriorState): RegionDef | null {
  const L = layoutOf(id, st)
  const out = st.outdoors(id)
  if (!L || !out) return null
  const { w, h } = L
  const door: [number, number] = [Math.floor(w / 2), h - 1]
  const ground = (x: number, z: number) => {
    if (x === door[0] && z === door[1]) return FLOOR[L.style]
    if (x <= 0 || z <= 0 || x >= w - 1 || z >= h - 1) return WALL_IN
    return FLOOR[L.style]
  }
  const buildings: Building[] = L.acts.map((a, i) => ({ id: 'act' + i, name: a.name, x: a.x, z: a.z, w: a.w ?? 1, d: a.d ?? 1, act: a.act, model: '' }))
  const exits: Exit[] = [{ x0: door[0], z0: door[1], x1: door[0], z1: door[1], to: out.region, tx: out.x, tz: out.z }]
  return {
    id: id as RegionId, key: `${id}:${w}x${h}:${out.x},${out.z}`, name: L.name, w, h, spawn: [door[0] + 0.5, door[1] - 0.6], ground,
    outside: () => WALL_IN, buildings, decor: [{ m: 'door_' + L.style, x: door[0] + 0.5, z: door[1] + 0.5 }, ...L.decor], exits, spots: L.spots, indoor: L.style,
  }
}
export const isInterior = (id: string) => id.startsWith('in:')
export const ownedRoom = (id: string) => id === 'in:house' || /^in:(coop|barn|cabin|workshop):\d+$/.test(id)
export const ROOM_KINDS = Object.keys(TOWN)
export const ROOM_STYLES: IndoorStyle[] = ['home', 'shop', 'barn', 'stone']
// 全部室内陈设的模型 id（渲染层预载用）
export const INTERIOR_PROPS = [...new Set([house(0), house(1), house(2), coop(0), coop(1), barn(0), barn(1), cabin(), workshop(), ...Object.values(TOWN).map((f) => f())]
  .flatMap((L) => L.decor.map((d) => d.m)).filter((m) => m && m !== 'pet_bed'))]
// 随状态变化的畜舍陈设：喂食槽（干草）与草窝（产物）
export const STATEFUL_PROPS = ['feed_bench', 'feed_trough_barn', 'nest_box']
