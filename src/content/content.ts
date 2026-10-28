// 内容配置：数值均来自《前期设计 v1.0》，标注了章节。G3 新增内容见 g3.ts，在本文件末尾并入。
import cropsFile from './crops.json' with { type: 'json' }
import itemsJson from './items_new.json' with { type: 'json' }
import wearJson from './wear.json' with { type: 'json' }
import { lang, localize, t } from '../core/i18n.ts'
import { DECORS, TREE_NAMES, TREE_SPECIES, WILD_GROW } from './g4.ts'
import {
  ANIMALS, FISH_LIST, FOE_DEFS, G3_ITEMS, G3_PROJECTS, G3_RECIPES, MACHINE_DEFS, processedItems, type Buff, type ProjectDef, type Recipe, type WeaponKind,
} from './g3.ts'
export * from './g3.ts'

const data = localize(cropsFile, 'crops')
const itemsFile = localize(itemsJson, 'items')
const wearFile = localize(wearJson, 'wear')

export const SEASON_NAMES = [t('content.spring'), t('content.summer'), t('content.fall'), t('content.winter')]
export const WEEKDAYS = [t('content.mon'), t('content.tue'), t('content.wed'), t('content.thu'), t('content.fri'), t('content.sat'), t('content.sun')]
export const QUALITY_MULT = [1, 1.25, 1.5] // 9.4
export const QUALITY_NAMES = [t('content.regular'), t('content.fine'), t('content.premium')]
export const XP_LEVELS = [0, 80, 200, 380, 650, 1000, 1450, 2050, 2800, 3800, 5000] // 16.1
export const START = data.player
export const DAY_START = data.calendar.startMinute // 06:00
export const DAY_END = data.calendar.endMinute // 次日 02:00
export const SEASON_DAYS = data.calendar.seasonDays
export const REACH = 1.8 // 7.3 农务交互半径（米）

// 6.6 难度
export const DIFFICULTY = [
  { name: t('content.relaxed'), rate: 0.75, hunger: 1, dryDeath: Infinity, fee: 0, feeCap: 0, foeDmg: 0.6 },
  { name: t('common.standard'), rate: 1, hunger: 2, dryDeath: 3, fee: 0.05, feeCap: 300, foeDmg: 1 },
  { name: t('content.challenging'), rate: 1.25, hunger: 3, dryDeath: 2, fee: 0.1, feeCap: 600, foeDmg: 1.25 },
]

// 5.3 天气：晴/阴/雨或雪/极端
export const WEATHER_WEIGHTS = [
  [50, 25, 25, 0],
  [55, 20, 20, 5],
  [50, 25, 20, 5],
  [45, 30, 20, 5],
]
export const EXTREME_NAMES = ['', t('common.thunderstorm'), t('common.gale'), t('common.blizzard')]

export const SKILLS = ['farming', 'foraging', 'mining', 'fishing', 'husbandry', 'combat'] as const
export type Skill = (typeof SKILLS)[number]
export const SKILL_NAMES: Record<Skill, string> = {
  farming: t('content.farming'), foraging: t('common.foraging'), mining: t('content.mining'), fishing: t('content.fishing'), husbandry: t('content.ranching'), combat: t('content.combat'),
}

// 11.1 工具（背包里的唯一物品 tool_*／rod_basic，等级记在 GameState.tools）；energy 为基础消耗，skill 为减耗技能。钓竿等级 -1 表示尚未获得
// 工具图标加载失败时的备用字形（ItemSlot），不是文本：按语言直接选（“镐”既是名称又是字形，不能共用一个键）
const glyph = (zh: string, en: string) => (lang() === 'en' ? en : zh)
export const TOOLS = {
  hoe: { name: t('content.hoe'), icon: glyph('锄', 'Ho'), energy: 2, skill: 'farming' }, // i18n-ignore
  can: { name: t('content.watering'), icon: glyph('壶', 'Wa'), energy: 2, skill: 'farming' }, // i18n-ignore
  axe: { name: t('content.axe'), icon: glyph('斧', 'Ax'), energy: 2, skill: 'foraging' }, // i18n-ignore
  pick: { name: t('content.pickaxe'), icon: glyph('镐', 'Pi'), energy: 2, skill: 'mining' }, // i18n-ignore
  scythe: { name: t('content.scythe'), icon: glyph('镰', 'Sc'), energy: 1, skill: 'farming' }, // i18n-ignore
  rod: { name: t('common.fishingRod'), icon: glyph('竿', 'Ro'), energy: 5, skill: 'fishing' }, // i18n-ignore
} as const
export type ToolId = keyof typeof TOOLS
export const CAN_CAPACITY = [40, 80, 120, 200]
export const TOOL_TIER = [t('content.basic'), t('content.copper'), t('content.iron'), t('content.alloy')]

// 8.3 / 11.1 障碍：hits 为各工具等级所需命中数
export const OBSTACLES = {
  weed: { name: t('content.weeds'), tool: 'scythe', hits: [1, 1, 1, 1], drop: ['fiber', 1], xp: null, minLevel: 0, next: null },
  stone: { name: t('content.stone'), tool: 'pick', hits: [3, 2, 1, 1], drop: ['stone', 2], xp: ['mining', 1], minLevel: 0, next: null },
  branch: { name: t('content.twig'), tool: 'axe', hits: [1, 1, 1, 1], drop: ['wood', 2], xp: null, minLevel: 0, next: null },
  tree: { name: t('content.tree'), tool: 'axe', hits: [6, 4, 3, 2], drop: ['wood', 8], xp: ['foraging', 8], minLevel: 0, next: 'stump' },
  stump: { name: t('content.stump'), tool: 'axe', hits: [4, 4, 3, 2], drop: ['wood', 4], xp: ['foraging', 2], minLevel: 1, next: null },
  // 深林硬木（14.3：铁斧可砍）
  hardtree: { name: t('content.ancientHardwood'), tool: 'axe', hits: [9, 7, 4, 3], drop: ['hardwood', 4], xp: ['foraging', 12], minLevel: 2, next: 'hardstump' },
  hardstump: { name: t('content.hardwoodStump'), tool: 'axe', hits: [6, 6, 3, 2], drop: ['hardwood', 2], xp: ['foraging', 4], minLevel: 2, next: null },
  reed: { name: t('content.reeds'), tool: 'scythe', hits: [1, 1, 1, 1], drop: ['fiber', 2], xp: ['foraging', 1], minLevel: 0, next: null },
  // 15.1 浅矿：普通岩块、铜矿、煤层与标记出口岩（打碎后露出下行梯）
  rock: { name: t('content.rock'), tool: 'pick', hits: [2, 1, 1, 1], drop: ['stone', 1], xp: ['mining', 1], minLevel: 0, next: null },
  copper: { name: t('content.copperNode'), tool: 'pick', hits: [4, 3, 2, 1], drop: ['copper_ore', 2], xp: ['mining', 4], minLevel: 0, next: null },
  coal: { name: t('content.coalSeam'), tool: 'pick', hits: [4, 3, 2, 1], drop: ['coal', 1], xp: ['mining', 4], minLevel: 0, next: null },
  exit: { name: t('content.looseRock'), tool: 'pick', hits: [3, 2, 1, 1], drop: ['stone', 2], xp: ['mining', 2], minLevel: 0, next: null },
  // 15.1 旧铁矿与寒晶深矿：矿脉有最低工具等级，低等级不白耗精力（11.1）
  iron: { name: t('content.ironNode'), tool: 'pick', hits: [6, 4, 3, 2], drop: ['iron_ore', 2], xp: ['mining', 6], minLevel: 1, next: null },
  crystal: { name: t('content.crystalOre'), tool: 'pick', hits: [8, 6, 4, 2], drop: ['crystal_ore', 1], xp: ['mining', 8], minLevel: 2, next: null },
  boulder: { name: t('content.boulder'), tool: 'pick', hits: [9, 6, 3, 2], drop: ['stone', 5], xp: ['mining', 4], minLevel: 2, next: null },
  pillar: { name: t('content.crystalPillar'), tool: 'pick', hits: [3, 3, 2, 1], drop: ['crystal_ore', 1], xp: ['mining', 2], minLevel: 0, next: null },
} as const satisfies Record<string, {
  name: string; tool: ToolId; hits: readonly number[]; drop: readonly [string, number]
  xp: readonly [Skill, number] | null; minLevel: number; next: string | null
}>
// 附带掉落：[物品, 数量, 概率]（14.3 树脂为浅林树木副产）
export const OBSTACLE_BONUS: Partial<Record<ObKind, [string, number, number]>> = { tree: ['resin', 1, 0.3], rock: ['coal', 1, 0.04], hardtree: ['resin', 2, 0.5], boulder: ['coal', 1, 0.15] }
export type ObKind = keyof typeof OBSTACLES

// 9.3 作物
const SEASON_INDEX: Record<string, number> = { 春: 0, 夏: 1, 秋: 2, 冬: 3 }
// 12.4：花卉、纤维作物、谷物不可直接吃
const INEDIBLE = new Set(['spring_flax', 'spring_daisy', 'summer_sunflower', 'summer_cotton', 'summer_corn',
  'autumn_sorghum', 'autumn_chrysanthemum', 'autumn_buckwheat', 'winter_wheat'])
const FRUIT = new Set(['spring_strawberry', 'summer_melon', 'summer_blueberry', 'autumn_cranberry'])
const FLOWER = new Set(['spring_daisy', 'summer_sunflower', 'autumn_chrysanthemum'])
const GRAIN = new Set(['summer_corn', 'autumn_sorghum', 'autumn_buckwheat', 'winter_wheat'])
const cropTag = (id: string) => (FRUIT.has(id) ? 'fruit' : FLOWER.has(id) ? 'flower' : GRAIN.has(id) ? 'grain' : INEDIBLE.has(id) ? 'fiber' : 'veg')
const CROP_COLORS: Record<string, number> = {
  spring_radish: 0xe0505a, spring_pea: 0x7ccf5a, spring_lettuce: 0xa8e070, spring_carrot: 0xff8a2a,
  spring_cauliflower: 0xf2efe0, spring_strawberry: 0xe8283c, spring_flax: 0x7a9de0, spring_daisy: 0xfafaf0,
  summer_tomato: 0xe8322a, summer_cucumber: 0x3f8f3a, summer_pepper: 0xe0b020, summer_melon: 0xc8e070,
  summer_corn: 0xf2d24a, summer_sunflower: 0xf5c518, summer_blueberry: 0x3a4fc0, summer_cotton: 0xf8f8f0,
  autumn_pumpkin: 0xf07a1a, autumn_sweet_potato: 0xa0405a, autumn_eggplant: 0x5a2a7a, autumn_beet: 0x8a1a3a,
  autumn_cranberry: 0xb0102a, autumn_sorghum: 0xa0522d, autumn_chrysanthemum: 0xf0d040, autumn_buckwheat: 0xd8c8a0,
  winter_radish: 0xf0f0ff, winter_kale: 0x2f6f4a, winter_leek: 0xd8f0c0, winter_wheat: 0xe0c890,
}

export interface CropDef {
  id: string; name: string; seasons: number[]; seedBuy: number; baseSell: number
  growthDays: number; regrowDays: number; availableFromDay: number
  edible: boolean; veg: boolean; color: number
}
export const CROPS: Record<string, CropDef> = {}
for (const c of data.crops) {
  CROPS[c.id] = {
    id: c.id, name: c.name, seasons: c.seasons.map((x) => SEASON_INDEX[x]), seedBuy: c.seedBuy,
    baseSell: c.baseSell, growthDays: c.growthDays, regrowDays: c.regrowDays, availableFromDay: c.availableFromDay,
    edible: !INEDIBLE.has(c.id), veg: !INEDIBLE.has(c.id) && !FRUIT.has(c.id), color: CROP_COLORS[c.id] ?? 0xffffff,
  }
}

// 26.1 ItemDefinition（最小字段）
export interface ItemDef {
  id: string; name: string; stack: number
  sell: number // 0 = 不可出售
  buy?: number
  color: number
  crop?: string // 种子对应作物
  food?: [number, number, number] // 精力/生命/饱食
  fert?: boolean
  place?: PlaceKind
  weapon?: number // 攻击力（15.3）
  wkind?: WeaponKind // 短剑 / 长柄 / 轻弓
  armor?: number // 防具防御
  equip?: 'armor' | 'coat' // 装备位（15.3 防寒衣与防具为不同装备位）
  med?: number // 药品：恢复生命，饱食满时也能用（6.2）
  cure?: 'poison' | 'slow' // 去除负面状态
  buff?: Buff // 料理增益（12.4）
  tool?: ToolId // 工具物品：放在背包/快捷栏里使用，等级见 GameState.tools
  care?: 'milk' | 'shear' // 照料工具：挤奶桶、剪毛剪
  tree?: string // 果树苗对应的树种
  sp?: string // 树种子对应的野生树种
  wear?: 'hat' | 'top' | 'bottom' // 衣物：放进衣柜后在穿衣镜换装
  wearFile?: string // 帽子模型或上衣/下装平铺图（相对 public/assets）
  icon?: string // 共用图标（同品种腌菜/果酱）
  src?: string // 加工品的原料品种
  produce?: boolean // 可入加工/订单的农产品
  tags?: string[] // veg 蔬菜 / fruit 水果 / flower 花 / grain 谷物 / fiber 纤维作物 / forage / fish / ore / bar …
  desc?: string
  effect?: string // 关键道具效果，如 hotbar:10、bag:36
}
export const ITEMS: Record<string, ItemDef> = {
  wood: { id: 'wood', name: t('content.wood'), stack: 999, sell: 3, buy: 15, color: 0x9a6b3c },
  stone: { id: 'stone', name: t('content.stone2'), stack: 999, sell: 2, buy: 12, color: 0x9a9a9a },
  fiber: { id: 'fiber', name: t('content.fiber'), stack: 999, sell: 1, color: 0x8fbf5a },
  fert_quality: { id: 'fert_quality', name: t('content.qualityFertilizer'), stack: 999, sell: 3, color: 0x6b4a2a, fert: true },
  // 6.3 救济清汤：不可出售、不可入加工
  soup_relief: { id: 'soup_relief', name: t('content.clearBrothRelief'), stack: 99, sell: 0, color: 0xf0e0b0, food: [25, 0, 25] },
  compost: { id: 'compost', name: t('content.compostBin'), stack: 99, sell: 0, color: 0x6a5a2a, place: 'compost' },
  // 工具：放在背包里的唯一物品，等级记在 GameState.tools（钓竿物品为 rod_basic）
  tool_hoe: { id: 'tool_hoe', name: t('content.hoe'), stack: 1, sell: 0, color: 0x9a7a4a, tool: 'hoe', tags: ['tool'], desc: t('content.tillsSoilCopperHold') },
  tool_can: { id: 'tool_can', name: t('content.watering'), stack: 1, sell: 0, color: 0x6a9ac8, tool: 'can', tags: ['tool'], desc: t('content.watersCropsRefillWell') },
  tool_axe: { id: 'tool_axe', name: t('content.axe'), stack: 1, sell: 0, color: 0xa86a3a, tool: 'axe', tags: ['tool'], desc: t('content.chopsTreesTwigsCopper') },
  tool_pick: { id: 'tool_pick', name: t('content.pickaxe'), stack: 1, sell: 0, color: 0x8a8f98, tool: 'pick', tags: ['tool'], desc: t('content.breaksStonesOre') },
  tool_scythe: { id: 'tool_scythe', name: t('content.scythe'), stack: 1, sell: 0, color: 0x9ab06a, tool: 'scythe', tags: ['tool'], desc: t('content.cutsWeedsClearsWithered') },
  // 12.4 公共厨房料理（G2 子集）；清汤、烤萝卜见 items_new.json
  salad_wild: { id: 'salad_wild', name: t('content.wildGreensSalad'), stack: 99, sell: 50, color: 0x8ad06a, food: [45, 5, 30], tags: ['cooked'], desc: t('content.lettuceTossedWildGreens') },
  soup_mushroom: { id: 'soup_mushroom', name: t('content.mushroomSoup'), stack: 99, sell: 40, color: 0xe8dcc0, food: [55, 10, 30], tags: ['cooked'], desc: t('content.richSoupSimmeredTwo') },
  fish_roast: { id: 'fish_roast', name: t('content.grilledFish'), stack: 99, sell: 30, color: 0xd89a4a, food: [60, 10, 35], tags: ['cooked'], desc: t('content.fishOverBitFirewood') },
  herb_salve: { id: 'herb_salve', name: t('content.herbalSalve'), stack: 99, sell: 30, buy: 90, color: 0x7ab868, med: 30, tags: ['med'], desc: t('content.salvePoundedTwoHerbs') },
  egg_fried: { id: 'egg_fried', name: t('content.friedEgg'), stack: 99, sell: 35, color: 0xf8e070, food: [45, 0, 25], tags: ['cooked'], desc: t('content.sunnySideEggOwn') },
  scarecrow: { id: 'scarecrow', name: t('content.scarecrow'), stack: 99, sell: 0, color: 0xd8b860, place: 'scarecrow' },
}
for (const def of G3_ITEMS) ITEMS[def.id] = def
// 衣物（Codex 任务 33）：帽子是挂在头上的模型，上衣/下装是贴在角色衣服区域的平铺图
for (const w of wearFile as { id: string; slot: 'hat' | 'top' | 'bottom'; name: string; price: number; file: string }[])
  ITEMS[w.id] = { id: w.id, name: w.name, stack: 9, sell: Math.floor(w.price / 4), ...(w.price ? { buy: w.price } : {}), color: 0x8a6ab0, wear: w.slot, wearFile: w.file, tags: ['wear'],
    desc: t('content.onceWardrobeMirrorHome', { hat: t('common.hat'), top: t('common.top'), bottom: t('common.bottoms') }[w.slot]) }
ITEMS.festival_coin = { id: 'festival_coin', name: t('content.marketMedallion'), stack: 99, sell: 0, color: 0xd8b040, tags: ['key'], desc: t('content.keepsakeFieldMarketStamped') }
for (const d of DECORS) ITEMS[d.id] = { id: d.id, name: d.name, stack: 99, sell: Math.max(10, Math.floor(d.price / 4)), ...(d.price ? { buy: d.price } : {}), color: 0xb08a5a, place: d.id, tags: ['decor'],
  desc: t('content.takesPickBackAxe', d.where === 'in' ? t('content.goesOwnHouse') : d.where === 'out' ? t('content.goesFarm') : t('content.goesFarmHouse'), d.on === 'wall' ? t('content.againstWall') : d.on === 'top' ? t('content.sitTableLowCabinet') : '', d.foot[0], d.foot[1]) }
for (const sp of TREE_SPECIES) ITEMS['seed_' + sp] = { id: 'seed_' + sp, name: TREE_NAMES[sp][1], stack: 99, sell: 5, color: 0x8a6a3a, place: 'wild_tree', sp, tags: ['forage'], desc: t('content.seedPlantOpenFarmland', TREE_NAMES[sp][0], WILD_GROW) }
// 探索类料理打 explore 标签（Q17 “两份探索料理”）
for (const def of G3_ITEMS) if (def.buff?.k === 'explore') def.tags = [...(def.tags ?? []), 'explore']
for (const c of Object.values(CROPS)) {
  ITEMS['seed_' + c.id] = { id: 'seed_' + c.id, name: t('content.seeds', c.name), stack: 999, sell: 0, buy: c.seedBuy, color: c.color, crop: c.id }
  ITEMS[c.id] = {
    id: c.id, name: c.name, stack: 99, sell: c.baseSell, color: c.color, produce: true, tags: [cropTag(c.id), 'crop'],
    // 12.4 鲜蔬直接食用公式
    food: c.edible ? [Math.min(40, Math.max(8, Math.floor(c.baseSell * 0.35))), 0, Math.min(15, Math.max(5, Math.floor(c.baseSell * 0.15)))] : undefined,
  }
}

// 12.3 制作配方。skill/level 或 unlock 作为门槛；at: 'kitchen' 只能在厨房制作
// cost 的键可用输入规格（'#fish' 任意鱼）；flag 为需要的剧情旗标
export type { Recipe }
export const RECIPES: Recipe[] = [
  { out: 'compost', n: 1, cost: { wood: 25, stone: 10 }, skill: 'farming', level: 1, note: t('content.n10Fiber1Vegetable') },
  { out: 'scarecrow', n: 1, cost: { wood: 30, fiber: 20 }, skill: 'farming', level: 1, note: t('content.protectsCropQuality9') },
  { out: 'furnace', n: 1, cost: { stone: 30, copper_ore: 10 }, unlock: 'recipe:furnace', note: t('content.n5CopperOre1') },
  { out: 'drying_rack', n: 1, cost: { wood: 30, fiber: 15 }, unlock: 'recipe:drying_rack', note: t('content.n2WildBerriesMushrooms') },
  { out: 'bait', n: 10, cost: { fiber: 2, bugmeat: 1 }, skill: 'fishing', level: 1, note: t('content.fasterBitesStillFish') },
  { out: 'herb_salve', n: 1, cost: { herb: 2 }, skill: 'foraging', level: 1, note: t('content.health30WorksEven') },
  { out: 'soup_clear', n: 1, cost: { wild_greens: 2 }, unlock: 'recipe:soup_clear', at: 'kitchen', note: t('content.energy25Fullness25') },
  { out: 'roast_radish', n: 1, cost: { 'spring_radish|winter_radish': 1, wood: 1 }, unlock: 'recipe:roast_radish', at: 'kitchen', note: t('content.energy35Fullness25') },
  // 12.4 用到 G2 食材、能恢复生命的料理
  { out: 'salad_wild', n: 1, cost: { spring_lettuce: 1, wild_greens: 1 }, at: 'kitchen', note: t('content.energy45Health5') },
  { out: 'soup_mushroom', n: 1, cost: { 'mushroom|snow_mushroom': 2 }, skill: 'foraging', level: 2, at: 'kitchen', note: t('content.energy55Health10') },
  { out: 'fish_roast', n: 1, cost: { '#fish': 1, wood: 1 }, flag: 'rod_received', at: 'kitchen', note: t('content.energy60Health10') },
  { out: 'egg_fried', n: 1, cost: { '#egg': 1 }, skill: 'husbandry', level: 1, at: 'kitchen', note: t('content.energy45Fullness25') },
  ...G3_RECIPES,
]

// 12.1/12.2 机器（见 g3.ts MACHINE_DEFS）：输入规格 'id'、'a|b' 任选、'#tag' 按标签；按绝对游戏分钟推进，睡眠也推进
export type PlaceKind = string
export const MACHINES = MACHINE_DEFS

// 13.4 营业时间（分钟；weekday 0=周一）
export const SHOP_HOURS = { open: 480, close: 1080, closedWeekday: 2 }
export const KITCHEN_HOURS = { open: 600, close: 1380 }
export const SHOPS = {
  general: { name: t('common.generalStore'), open: 480, close: 1080, closed: 2 }, // 林棠 08—18，周三休
  smith: { name: t('common.blacksmith'), open: 540, close: 1020, closed: 6 }, // 老陶 09—17，周日休
  tackle: { name: t('content.tackleCounter'), open: 360, close: 1200, closed: -1 }, // 沈舟的自助柜
  carpenter: { name: t('common.carpentryShop'), open: 540, close: 1020, closed: 1 }, // 何砚 09—17，周二休
  ranch: { name: t('common.ranch'), open: 480, close: 960, closed: 0 }, // 周芹 08—16，周一休
  clinic: { name: t('common.clinic'), open: 480, close: 1260, closed: -1 }, // 叶岚 08—21
  station: { name: t('content.waystationCounter'), open: 480, close: 1080, closed: -1 }, // 阿满、段行
} as const
export type ShopId = keyof typeof SHOPS
export const BAG_UPGRADES = [{ size: 36, price: 2000 }, { size: 48, price: 8000 }] // 11.2
// 11.1 工具升级：到期日 06:00 完成，期间旧工具照常可用
export const TOOL_UPGRADES = [null, { money: 1500, bar: 'copper_bar', n: 5, days: 1 }, { money: 4500, bar: 'iron_bar', n: 5, days: 1 }, { money: 12000, bar: 'alloy_bar', n: 5, days: 2 }]

// 14.1/14.2 钓鱼：24 种四季鱼（g3.ts）；at: river 河岸，stream 山溪，wetland 湿地
export const FISH = FISH_LIST
export const FISHING = { zone: 0.28, zonePerLevel: 0.01, zoneMax: 0.4, start: 0.25, gain: 0.18, loss: 0.12, wait: [2, 6], baitWait: [1.5, 4], biteWindow: 2 }

// 15.2/15.4 战斗与浅矿敌人。drops: [物品, 数量, 概率]，首项为保底
export const COMBAT = { combo: [0.45, 0.5, 0.65], arc: Math.PI / 2, reach: 1.5, crit: 0.05, critMult: 1.5, roll: 0.35, rollCd: 1.2, rollEnergy: 4, iframes: 0.6 }
export const FOES = FOE_DEFS
export type FoeKind = string
export const MINE_FLOORS = 30 // 15.1：30 层，三个主题区

// 10.1 动物（g3.ts ANIMALS）；鸡与禽舍沿用旧常量名
export const CHICKEN = { price: ANIMALS.chicken.price, mature: ANIMALS.chicken.mature, product: 'egg', cap: 4 }
export const COOP = { money: 2000, cost: { wood: 100, stone: 40 }, days: 1 }
// 17.1 公共工程
export const PROJECTS: Record<'sluice' | keyof typeof G3_PROJECTS, ProjectDef> = {
  sluice: { name: t('content.sluiceGateRepair'), money: 1000, cost: { stone: 80, copper_bar: 3 }, days: 1, unlock: 'system:sluice_fund' },
  ...G3_PROJECTS,
}
export type ProjectId = keyof typeof PROJECTS
// 20.1 节庆（G2：花种会）；entry 之后不能再入场，end 时活动结束
// 八场节庆（设计 §20.1）：open 起可入场，entry 后不再开始小游戏，end 结束；region 会场所在区域；host 主持人（和 TA 说话或在展台按 F 参加）
export interface FestDef { name: string; season: number; day: number; open: number; entry: number; end: number; region: string; host: string; game: string }
export const FESTIVALS: Record<string, FestDef> = {
  flower_fair: { name: t('content.flowerFair'), season: 0, day: 8, open: 600, entry: 960, end: 1080, region: 'town', host: 'lintang', game: t('content.flowerMatching') },
  fishing_derby: { name: t('content.riversideFishingDay'), season: 0, day: 22, open: 600, entry: 960, end: 1080, region: 'river', host: 'shenzhou', game: t('content.threeMinuteFishingDerby') },
  picnic: { name: t('content.longDayPicnic'), season: 1, day: 8, open: 720, entry: 1080, end: 1200, region: 'town', host: 'xiahe', game: t('content.picnicCookAlong') },
  firefly: { name: t('content.fireflyLanternNight'), season: 1, day: 22, open: 1080, entry: 1320, end: 1380, region: 'river', host: 'bailu', game: t('content.lanternHuntRiverLanterns') },
  market: { name: t('content.fieldMarket'), season: 2, day: 8, open: 600, entry: 960, end: 1080, region: 'town', host: 'lintang', game: t('content.produceStall') },
  harvest_coop: { name: t('content.harvestHelpingDay'), season: 2, day: 22, open: 600, entry: 960, end: 1080, region: 'town', host: 'heyan', game: t('content.sortHaul') },
  snow_craft: { name: t('content.snowCraftFair'), season: 3, day: 8, open: 600, entry: 960, end: 1080, region: 'town', host: 'songning', game: t('content.snowSceneCrafting') },
  hearth_night: { name: t('content.hearthsideThanksNight'), season: 3, day: 22, open: 1080, entry: 1320, end: 1380, region: 'town', host: 'shipo', game: t('content.storiesSecretGreetings') },
}
// Q22 风车启动仪式、Q23 谷地长桌宴：在下一个安全日举行（晴或阴、不撞节庆），错过可以再约
export const CEREMONIES: Record<string, FestDef> = {
  windmill_ceremony: { name: t('content.windmillCeremony'), season: -1, day: 0, open: 600, entry: 1020, end: 1080, region: 'highland', host: 'anbo', game: t('content.ribbonCutting') },
  long_table_feast: { name: t('content.valleyLongTableFeast'), season: -1, day: 0, open: 1020, entry: 1260, end: 1320, region: 'town', host: 'xiahe', game: t('content.longTableFeast') },
}
export const festDef = (id: string): FestDef | undefined => FESTIVALS[id] ?? CEREMONIES[id]

// 剧情新物品（items_new.json）并入物品表：同 id 时合并字段，保留已有的数值规则；再补上运行时需要的行为字段
for (const raw of itemsFile.items as (Partial<ItemDef> & { id: string; cat?: string })[]) {
  const { cat, ...def } = raw
  ITEMS[raw.id] = Object.assign({ stack: 99, sell: 0, color: 0xb0a080, name: raw.id }, ITEMS[raw.id], def, { id: raw.id }) as ItemDef
  if (cat === 'key') ITEMS[raw.id].tags = [...(ITEMS[raw.id].tags ?? []), 'key']
}
const BEHAVIOR: Record<string, Partial<ItemDef>> = {
  sword_old: { weapon: 8, wkind: 'sword' },
  rod_basic: { tool: 'rod', stack: 1, tags: ['tool'] },
  furnace: { place: 'furnace' },
  drying_rack: { place: 'drying_rack' },
  egg: { tags: ['animal', 'egg'] },
  wild_berry: { tags: ['forage', 'fruit', 'dry'] }, mushroom: { tags: ['forage', 'dry'] },
  clay: { color: 0x9a7a5a }, resin: { color: 0xd8a040 }, bugmeat: { color: 0x8a9a5a }, herb: { color: 0x6aa84a },
  wild_greens: { color: 0x7ac05a }, copper_ore: { color: 0xc87a4a },
  coal: { color: 0x3a3a3a }, copper_bar: { color: 0xd88a4a }, hay: { color: 0xd8c070 }, bait: { color: 0xa08a6a },
}
for (const [id, b] of Object.entries(BEHAVIOR)) if (ITEMS[id]) Object.assign(ITEMS[id], b)
// Q23 长桌宴的三类料理（汤类、主食类、鱼蛋奶类），每类至少两种全年都能做的
for (const [tag, ids] of [['soup', ['soup_clear', 'soup_mushroom', 'soup_pumpkin', 'soup_fish_spicy', 'stew_tomato']], ['main', ['bread', 'roast_radish', 'rice_fried_veg', 'gratin_sweet_potato', 'salad_wild', 'pie_berry', 'ration_trail']],
  ['protein', ['egg_fried', 'fish_roast', 'platter_cheese', 'bento_fish', 'porridge_milk']]] as const) for (const id of ids) if (ITEMS[id]) ITEMS[id].tags = [...new Set([...(ITEMS[id].tags ?? []), tag])]
ITEMS.wild_berry.color = 0x7a3a8a
ITEMS.mushroom.color = 0xd8c8a8
// 同品种腌菜、果酱（依赖上面全部农产品与水果）
for (const def of processedItems(Object.values(ITEMS))) ITEMS[def.id] = def
