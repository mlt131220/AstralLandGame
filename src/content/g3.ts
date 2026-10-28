// G3 系统完整版本的内容表（设计 §30.4）：四季鱼与采集物、12 类机器、24 条制作与 20 道料理、6 种动物、
// 12 类建筑、5 项公共工程、30 层矿洞的 12 种敌人与 3 个首领、三类武器与防具。数值均来自《前期设计 v1.0》，标注章节。
import type { ItemDef, Skill } from './content.ts'
import { t as tr } from '../core/i18n.ts' // 本文件有局部变量 t

// 12.4 可直接食用的鲜蔬/果实/野外可食物：精力 min(40,max(8,⌊售价×0.35⌋))，饱食 min(15,max(5,⌊售价×0.15⌋))
export const rawFood = (sell: number): [number, number, number] => [Math.min(40, Math.max(8, Math.floor(sell * 0.35))), 0, Math.min(15, Math.max(5, Math.floor(sell * 0.15)))]
const it = (id: string, name: string, sell: number, color: number, more: Partial<ItemDef> = {}): ItemDef => ({ id, name, stack: 999, sell, color, ...more })
const food = (id: string, name: string, sell: number, color: number, tags: string[], more: Partial<ItemDef> = {}): ItemDef =>
  it(id, name, sell, color, { stack: 99, food: rawFood(sell), tags, ...more })

// ---------- 14.2 鱼类：时段为游戏分钟（全天 06:00—02:00 = 360—1560）；天气 any/clear 晴阴/rain 雨/sun 晴/grey 阴雪 ----------
export type FishWeather = 'any' | 'clear' | 'rain' | 'sun' | 'grey'
export interface FishDef { id: string; name: string; at: 'river' | 'stream' | 'wetland'; seasons: number[]; from: number; to: number; weather: FishWeather; diff: number; sell: number; color: number }
const F = (id: string, name: string, at: FishDef['at'], se: number, from: number, to: number, weather: FishWeather, diff: number, sell: number, color: number): FishDef =>
  ({ id: 'fish_' + id, name, at, seasons: [se], from: from * 60, to: (to <= 6 ? to + 24 : to) * 60, weather, diff, sell, color })
export const FISH_LIST: FishDef[] = [
  F('silverscale', tr('content.silverscale'), 'river', 0, 6, 2, 'any', 1, 35, 0xc8d4e0), F('grasscarp', tr('content.grassStripedCarp'), 'river', 0, 6, 18, 'clear', 1, 40, 0x9ac07a),
  F('bluecarp', tr('content.bluebackedCarp'), 'river', 0, 8, 20, 'any', 2, 55, 0x4a8ab0), F('spottrout', tr('content.spottedTrout'), 'stream', 0, 6, 12, 'clear', 3, 85, 0xb87a5a),
  F('rainbarbel', tr('content.rainBarbel'), 'river', 0, 16, 2, 'rain', 3, 100, 0x7a8aa0), F('lampfish', tr('content.springLampfish'), 'wetland', 0, 20, 2, 'any', 4, 140, 0xe0d070),
  F('redtail', tr('content.redtail'), 'river', 1, 6, 2, 'any', 1, 40, 0xd05a4a), F('yellowperch', tr('content.yellowfinPerch'), 'river', 1, 10, 20, 'sun', 2, 60, 0xd8b040),
  F('bambooeel', tr('content.bambooEel'), 'wetland', 1, 18, 2, 'rain', 3, 110, 0x6a8a4a), F('mirrorscale', tr('content.mirrorscale'), 'stream', 1, 6, 14, 'clear', 3, 90, 0xd8e0e8),
  F('mudback', tr('content.mudback'), 'wetland', 1, 6, 2, 'any', 2, 65, 0x7a6a4a), F('fireflytrout', tr('content.fireflyTrout'), 'wetland', 1, 20, 2, 'sun', 5, 170, 0x8ad0a0),
  F('goldcarp', tr('content.goldStripedCarp'), 'river', 2, 8, 20, 'any', 2, 65, 0xe0a030), F('brownfin', tr('content.brownfin'), 'river', 2, 6, 2, 'any', 1, 40, 0x8a6a4a),
  F('maplebass', tr('content.mapleBass'), 'stream', 2, 12, 20, 'clear', 3, 90, 0xc0503a), F('stonebarbel', tr('content.stoneBarbel'), 'wetland', 2, 6, 18, 'rain', 3, 105, 0x9a9a90),
  F('mooneel', tr('content.silverMoonEel'), 'wetland', 2, 20, 2, 'any', 4, 145, 0xd0d8e8), F('crownfish', tr('content.autumnCrownfish'), 'stream', 2, 16, 20, 'rain', 5, 180, 0xb0602a),
  F('icescale', tr('content.icescale'), 'river', 3, 6, 2, 'any', 1, 45, 0xb8d8f0), F('snowcarp', tr('content.snowStripedCarp'), 'river', 3, 6, 18, 'any', 2, 60, 0xe8eef4),
  F('coldtrout', tr('content.coldspringTrout'), 'stream', 3, 8, 16, 'clear', 3, 100, 0x3a5a8a), F('deepeel', tr('content.deepBlueEel'), 'wetland', 3, 18, 2, 'grey', 4, 150, 0x2a3a7a),
  F('frostbarbel', tr('content.frostBarbel'), 'wetland', 3, 6, 2, 'any', 3, 100, 0xc8d8e0), F('winterstar', tr('content.winterStarfish'), 'stream', 3, 20, 2, 'sun', 5, 190, 0x5a6ab0),
]

// ---------- 14.3 / 8.3 四季野外采集物（浅林按季节换品种）----------
export const FORAGE_BY_SEASON: [string, number][][] = [
  [['wild_greens', 0.4], ['mushroom', 0.3], ['wild_berry', 0.3]],
  [['wild_berry', 0.45], ['wild_greens', 0.35], ['mushroom', 0.2]],
  [['wild_pear', 0.35], ['mushroom', 0.35], ['chestnut', 0.3]],
  [['winter_root', 0.55], ['snow_mushroom', 0.45]],
]

// ---------- 9.6 果树 ----------
export interface FruitTreeDef { name: string; fruit: string; seasons: number[]; price: number; sell: number; grow: number; color: number }
export const FRUIT_TREES: Record<string, FruitTreeDef> = {
  cherry: { name: tr('content.cherry'), fruit: 'cherry', seasons: [0], price: 800, sell: 45, grow: 20, color: 0xd02a3a },
  apricot: { name: tr('content.apricot'), fruit: 'apricot', seasons: [0], price: 700, sell: 40, grow: 20, color: 0xf0a040 },
  peach: { name: tr('content.peach'), fruit: 'peach', seasons: [1], price: 900, sell: 55, grow: 20, color: 0xf8a8a0 },
  lemon: { name: tr('content.lemon'), fruit: 'lemon', seasons: [1, 2], price: 1200, sell: 45, grow: 24, color: 0xf0e040 },
  apple: { name: tr('content.apple'), fruit: 'apple', seasons: [2], price: 1000, sell: 60, grow: 20, color: 0xd83a2a },
  persimmon: { name: tr('content.persimmon'), fruit: 'persimmon', seasons: [2, 3], price: 1100, sell: 55, grow: 24, color: 0xf07a20 },
}

// ---------- 15.3 武器与防具 ----------
export type WeaponKind = 'sword' | 'spear' | 'bow'
export const WEAPON_KINDS: Record<WeaponKind, { name: string; dmg: number; speed: number; reach: number; arc: number }> = {
  sword: { name: tr('common.sword'), dmg: 1, speed: 1, reach: 1.5, arc: Math.PI / 2 },
  spear: { name: tr('content.spear'), dmg: 1.15, speed: 0.8, reach: 2.1, arc: Math.PI / 3 },
  bow: { name: tr('content.bow'), dmg: 0.8, speed: 1, reach: 6, arc: 0 }, // 蓄力 0.7 秒，练习箭不消耗
}
export const BOW_CHARGE = 0.7
export const GEAR_TIERS = [
  { tier: 'copper', name: tr('content.copper2'), atk: 14, def: 2, bar: 'copper_bar', weapon: [5, 800], armor: [3, 600] },
  { tier: 'iron', name: tr('content.iron2'), atk: 22, def: 5, bar: 'iron_bar', weapon: [5, 2500], armor: [4, 2000] },
  { tier: 'alloy', name: tr('content.alloy'), atk: 34, def: 9, bar: 'alloy_bar', weapon: [5, 7000], armor: [4, 6000] },
] as const

// ---------- 12.4 料理增益：同类取较强、时间取较长；最多一个劳动类与一个探索类 ----------
export type BuffKind = 'work' | 'explore'
export interface Buff { k: BuffKind; fx: 'labor' | 'cold' | 'maxEnergy' | 'gift' | 'maxHp' | 'pickup' | 'damage' | 'feast'; v: number; min: number }

const weaponDesc = (k: WeaponKind, atk: number) =>
  k === 'spear' ? tr('content.attack21Reach', atk) : k === 'bow' ? tr('content.attackHold07', atk) : tr('content.attack', atk)

export const G3_ITEMS: ItemDef[] = [
  // 采集物
  food('wild_pear', tr('content.wildPear'), 20, 0xc8c050, ['forage', 'fruit', 'dry'], { desc: tr('content.wildFruitWoodsFall') }),
  food('chestnut', tr('content.chestnut'), 25, 0x8a5a2a, ['forage'], { desc: tr('content.spikyNutWoodsFall') }),
  food('winter_root', tr('content.snowRoot'), 18, 0xb08a6a, ['forage'], { desc: tr('content.rootDugUnderWinter') }),
  food('snow_mushroom', tr('content.snowMushroom'), 30, 0xf0f0f0, ['forage', 'dry'], { desc: tr('content.whiteMushroomSnowyWoods') }),
  // 果树果实
  ...Object.values(FRUIT_TREES).map((t) => food(t.fruit, t.name, t.sell, t.color, ['fruit', 'treefruit'], { produce: true, desc: tr('content.fruitTree', t.name) })),
  ...Object.entries(FRUIT_TREES).map(([k, t]) => it('sapling_' + k, tr('common.sapling', t.name), 0, t.color, { stack: 99, buy: t.price, tree: k, desc: tr('content.maturesAboutAfterPlanting', t.grow) })),
  // 鱼与捕捞笼产物（鱼 99 堆叠，生鱼不能直接吃）
  ...FISH_LIST.map((f) => it(f.id, f.name, f.sell, f.color, { stack: 99, tags: ['fish'], desc: tr('content.fishSeasonPlace', [tr('content.spring'), tr('content.summer'), tr('content.fall'), tr('content.winter')][f.seasons[0]], { river: tr('common.riverside'), stream: tr('content.mountainStream'), wetland: tr('common.wetland') }[f.at]) })),
  it('crayfish', tr('content.crayfish'), 30, 0xc04a2a, { stack: 99, tags: ['seafood'], desc: tr('content.caughtCrabPot') }),
  it('river_snail', tr('content.riverSnail'), 20, 0x6a6a5a, { stack: 99, tags: ['seafood'], desc: tr('content.caughtCrabPot') }),
  // 矿物与材料（14.3）
  it('iron_ore', tr('content.ironOre'), 15, 0x8a8a90, { buy: 90, tags: ['ore'], desc: tr('content.foundOldIronMine') }),
  it('crystal_ore', tr('content.crystalOre'), 30, 0x7ad8e8, { buy: 180, tags: ['ore'], desc: tr('content.foundFrostCrystalDepths') }),
  it('iron_bar', tr('content.ironBar'), 120, 0xa8acb4, { buy: 650, tags: ['bar'], desc: tr('content.materialIronToolsIron') }),
  it('alloy_bar', tr('content.alloyBar'), 300, 0x8a7ad0, { tags: ['bar'], desc: tr('content.smelted2IronBars') }),
  it('hardwood', tr('content.hardwood'), 12, 0x6a3a1a, { buy: 60, desc: tr('content.comesAncientTreesHardwood') }),
  it('hide_scrap', tr('content.hideScraps'), 25, 0x9a7a5a, { desc: tr('content.oddsEndsDroppedMine') }),
  it('core_boss', tr('content.windmillCore'), 0, 0x7ae0f0, { stack: 1, tags: ['key', 'core'], desc: tr('content.heartLeftBehindWhen') }),
  it('core_trade', tr('common.substituteCore'), 0, 0xd8b060, { stack: 1, tags: ['key', 'core'], desc: tr('content.coreEarnedThroughWaystation') }),
  // 加工品（12.2）
  it('flour', tr('content.flour'), 100, 0xf4ecd8, { stack: 99, tags: ['artisan'], desc: tr('content.milledGrainBreadPies') }),
  food('bread', tr('content.bread'), 70, 0xd8a058, ['cooked', 'artisan'], { food: [40, 0, 25] }),
  it('cheese_cow', tr('content.cowCheese'), 170, 0xf0d870, { stack: 99, tags: ['artisan', 'dairy'] }),
  it('cheese_goat', tr('content.goatCheese'), 300, 0xf4f0e0, { stack: 99, tags: ['artisan', 'dairy'] }),
  it('cloth', tr('content.cloth'), 260, 0xe8e0d0, { stack: 99, tags: ['artisan'], desc: tr('content.woven2FlaxCotton') }),
  it('veg_oil', tr('content.vegetableOil'), 180, 0xe8c050, { stack: 99, tags: ['artisan'] }),
  it('honey', tr('common.honey'), 80, 0xe8a830, { stack: 99, tags: ['artisan', 'honey'] }),
  it('honey_flower', tr('content.flowerHoney'), 110, 0xf0b840, { stack: 99, tags: ['artisan', 'honey'], icon: 'honey', desc: tr('content.madeWhenFullGrown') }),
  it('fert_water', tr('content.waterRetainingFertilizer'), 3, 0x4a7ab0, { fert: true, desc: tr('content.applyBeforePlantingSoil') }),
  // 动物产物（10.1）
  it('duck_egg', tr('content.duckEgg'), 90, 0xd8e8e0, { stack: 99, tags: ['animal', 'egg'] }),
  it('rabbit_fur', tr('content.rabbitFur'), 130, 0xf8f4f0, { stack: 99, tags: ['animal'] }),
  it('milk', tr('content.milk'), 100, 0xf8f8f0, { stack: 99, tags: ['animal', 'milk'] }),
  it('goat_milk', tr('content.goatMilk'), 180, 0xf0ece0, { stack: 99, tags: ['animal', 'milk'] }),
  it('wool', tr('content.wool'), 160, 0xf0ead8, { stack: 99, tags: ['animal'] }),
  // 照料工具（10.2：奶与毛需要工具采集）
  it('milk_pail', tr('content.milkPail'), 0, 0x9a7a4a, { stack: 1, buy: 500, care: 'milk', tags: ['tool'], desc: tr('content.useGrownCowGoat') }),
  it('shears', tr('content.shears'), 0, 0x8a8f98, { stack: 1, buy: 500, care: 'shear', tags: ['tool'], desc: tr('content.useGrownSheepShear') }),
  // 装备与补给（12.3）
  it('bobber', tr('content.steadyBobber'), 0, 0xe8483a, { stack: 1, tags: ['gear'], desc: tr('content.worksBackpackFishingCatch') }),
  it('supply_pack', tr('content.travelSupplyPack'), 0, 0xb09a6a, { stack: 1, tags: ['gear'], desc: tr('content.worksBackpackFullnessDrops') }),
  it('winter_coat', tr('common.winterCoat'), 0, 0x6a8ab0, { stack: 1, buy: 1200, equip: 'coat', desc: tr('content.whenEquippedCancelsOrdinary') }),
  it('bouquet', tr('content.bouquet'), 0, 0xf08ab0, { stack: 1, buy: 200, tags: ['key'], desc: tr('content.onceFriendshipReaches800') }),
  it('promise_charm', tr('content.promiseCharm'), 0, 0x8ad0f0, { stack: 1, buy: 5000, tags: ['key'], desc: tr('content.n1000FriendshipRelationshipEvents') }),
  it('antidote', tr('content.antidote'), 40, 0x7ac080, { stack: 99, buy: 120, med: 0, cure: 'poison', tags: ['med'], desc: tr('content.curesPoison2') }),
  // 机器与可放置物
  ...([
    ['mill', tr('content.mill')], ['pickle_jar', tr('content.pickleJar')], ['jam_pot', tr('content.jamPot')], ['cheese_press', tr('content.cheesePress')], ['loom', tr('content.loom')], ['oil_press', tr('content.oilPress')],
    ['beehive', tr('content.beehive')], ['bake_oven', tr('content.bakeOven')], ['seed_maker', tr('content.seedMaker')], ['auto_hopper', tr('content.autoFeeder')], ['auto_collector', tr('content.autoCollector')],
    ['chest', tr('content.chest')], ['chest_big', tr('content.bigChest')], ['fence_wood', tr('content.woodFence')], ['gate_wood', tr('content.woodGate')], ['path_wood', tr('content.woodPath')], ['path_stone', tr('content.stonePath')],
    ['sprinkler', tr('content.basicSprinkler')], ['sprinkler_plus', tr('content.improvedSprinkler')], ['pipe', tr('content.waterPipe')], ['water_tank', tr('content.waterTank')], ['campfire', tr('common.campfire')], ['torch', tr('content.torch')],
    ['lamp_post', tr('content.lampPost')], ['crab_pot', tr('content.crabPot')],
  ] as const).map(([id, name]) => it(id, name, 0, 0xa07a4a, { stack: 99, place: id })),
  // 料理（12.4，售价见表后注）
  food('porridge_milk', tr('content.milkPorridge'), 125, 0xf4f0e0, ['cooked'], { food: [80, 15, 40] }),
  food('stew_tomato', tr('content.tomatoStew'), 100, 0xd8402a, ['cooked'], { food: [80, 15, 40], buff: { k: 'work', fx: 'labor', v: 0.1, min: 180 } }),
  food('soup_pumpkin', tr('content.creamyPumpkinSoup'), 250, 0xf08a2a, ['cooked'], { food: [100, 25, 45], buff: { k: 'explore', fx: 'cold', v: 0.3, min: 240 } }),
  food('gratin_sweet_potato', tr('content.sweetPotatoGratin'), 220, 0xe0a040, ['cooked'], { food: [110, 20, 50], buff: { k: 'work', fx: 'maxEnergy', v: 20, min: 180 } }),
  food('pie_berry', tr('content.berryPie'), 150, 0x9a3a6a, ['cooked'], { food: [90, 10, 40], buff: { k: 'explore', fx: 'gift', v: 5, min: 1440 } }),
  food('rice_fried_veg', tr('content.veggieFriedRice'), 130, 0xe8c060, ['cooked'], { food: [100, 20, 45], buff: { k: 'work', fx: 'labor', v: 0.1, min: 240 } }),
  food('bento_fish', tr('content.fishBento'), 100, 0xd8b080, ['cooked'], { food: [110, 30, 50], buff: { k: 'explore', fx: 'maxHp', v: 10, min: 180 } }),
  food('tea_herb', tr('content.herbTea'), 40, 0xa8c870, ['cooked'], { food: [20, 5, 10], cure: 'slow' }),
  food('drink_honey', tr('content.honeyDrink'), 85, 0xf0c040, ['cooked'], { food: [65, 15, 20] }),
  food('platter_cheese', tr('content.cheesePlatter'), 180, 0xf0d070, ['cooked'], { food: [100, 20, 45], buff: { k: 'explore', fx: 'pickup', v: 0.2, min: 180 } }),
  food('soup_fish_spicy', tr('content.spicyFishSoup'), 140, 0xd04a2a, ['cooked'], { food: [95, 30, 40], buff: { k: 'explore', fx: 'damage', v: 0.1, min: 180 } }),
  food('ration_trail', tr('content.trailRations'), 90, 0xb08a5a, ['cooked'], { food: [80, 10, 35], buff: { k: 'explore', fx: 'cold', v: 0.2, min: 240 } }),
  food('feast_harvest', tr('common.harvestFeast'), 360, 0xe8a040, ['cooked'], { food: [150, 50, 60], buff: { k: 'work', fx: 'feast', v: 0.1, min: 240 } }),
  // 武器与防具（15.3）
  ...GEAR_TIERS.flatMap((g) => (['sword', 'spear', 'bow'] as const).map((k) => it(`${k}_${g.tier}`, tr('fmt.pair', g.name, WEAPON_KINDS[k].name), 0, 0xa0a4ac,
    { stack: 1, weapon: Math.round(g.atk * WEAPON_KINDS[k].dmg), wkind: k, desc: weaponDesc(k, Math.round(g.atk * WEAPON_KINDS[k].dmg)) }))),
  ...GEAR_TIERS.map((g) => it(`armor_${g.tier}`, tr('content.armor', g.name), 0, 0x8a8f98, { stack: 1, armor: g.def, equip: 'armor', desc: tr('content.defenseReducesDamageTaken', g.def, g.def) })),
]
// 同品种腌菜与果酱（12.2）：售价 ⌊原价×1.6+15⌋ / ⌊原价×1.7+20⌋
export function processedItems(base: ItemDef[]): ItemDef[] {
  const out: ItemDef[] = []
  for (const b of base) {
    const tags = b.tags ?? []
    if (tags.includes('veg') && tags.includes('crop')) out.push(it('pickle_' + b.id, tr('content.pickled', b.name), Math.floor(b.sell * 1.6 + 15), b.color, { stack: 99, tags: ['artisan', 'pickle'], icon: 'pickle', src: b.id }))
    if (tags.includes('fruit')) out.push(it('jam_' + b.id, tr('content.jam', b.name), Math.floor(b.sell * 1.7 + 20), b.color, { stack: 99, tags: ['artisan', 'jam'], icon: 'jam', src: b.id }))
  }
  return out
}

// ---------- 12.2 机器：每台若干配方；输入规格 'id' / 'a|b' / '#tag'；out 为 '*pickle' 等时按投入物品生成同品种成品 ----------
export interface MachineRecipe { in: [string, number][]; out: string; n: number; min: number; unlock?: string; q0?: boolean }
export interface MachineDef { name: string; verb: string; recipes: MachineRecipe[] }
export const MACHINE_DEFS: Record<string, MachineDef> = {
  furnace: { name: tr('content.furnace'), verb: tr('content.smelting'), recipes: [
    { in: [['copper_ore', 5], ['coal', 1]], out: 'copper_bar', n: 1, min: 180 },
    { in: [['iron_ore', 5], ['coal', 1]], out: 'iron_bar', n: 1, min: 180 },
    { in: [['iron_bar', 2], ['crystal_ore', 1], ['coal', 1]], out: 'alloy_bar', n: 1, min: 360, unlock: 'recipe:alloy' },
  ] },
  mill: { name: tr('content.mill'), verb: tr('content.milling'), recipes: [{ in: [['#grain', 1]], out: 'flour', n: 1, min: 120 }] },
  drying_rack: { name: tr('content.dryingRack'), verb: tr('content.drying'), recipes: [{ in: [['#dry', 2]], out: 'dried_food', n: 1, min: 240 }] },
  pickle_jar: { name: tr('content.pickleJar'), verb: tr('content.pickling'), recipes: [{ in: [['#veg', 1]], out: '*pickle', n: 1, min: 720 }] },
  jam_pot: { name: tr('content.jamPot'), verb: tr('content.simmering'), recipes: [{ in: [['#fruit', 1]], out: '*jam', n: 1, min: 960 }] },
  cheese_press: { name: tr('content.cheesePress'), verb: tr('content.pressing'), recipes: [{ in: [['milk', 1]], out: 'cheese_cow', n: 1, min: 480 }, { in: [['goat_milk', 1]], out: 'cheese_goat', n: 1, min: 480 }] },
  loom: { name: tr('content.loom'), verb: tr('content.weaving'), recipes: [{ in: [['spring_flax|summer_cotton', 2]], out: 'cloth', n: 1, min: 360 }, { in: [['wool|rabbit_fur', 1]], out: 'cloth', n: 1, min: 360 }] },
  oil_press: { name: tr('content.oilPress'), verb: tr('content.pressing2'), recipes: [{ in: [['summer_corn|summer_sunflower', 2]], out: 'veg_oil', n: 1, min: 360 }] },
  compost: { name: tr('content.compostBin'), verb: tr('content.composting'), recipes: [{ in: [['fiber', 10], ['#veg', 1]], out: 'fert_quality', n: 5, min: 1440 }] },
  bake_oven: { name: tr('content.bakeOven'), verb: tr('content.baking'), recipes: [{ in: [['flour', 2], ['wood', 1]], out: 'bread', n: 2, min: 180 }] },
  seed_maker: { name: tr('content.seedMaker'), verb: tr('content.separating'), recipes: [{ in: [['#crop', 1]], out: '*seed', n: 1, min: 180, q0: true }] },
}
export const BEEHIVE_DAYS = 2 // 每 2 个春夏秋日结产 1 份蜂蜜；冬季停产

// ---------- 12.3 制作配方（含机器蓝图）与 12.4 料理 ----------
// skill/level、unlock、flag、friend（[居民, 关系]）为门槛；at: 'kitchen' 在公共厨房或家中厨房制作；min 为制作耗费的游戏分钟
export interface Recipe {
  out: string; n: number; cost: Record<string, number>; skill?: Skill; level?: number; unlock?: string; flag?: string
  friend?: [string, number]; at?: 'kitchen'; min?: number; note: string
}
export const G3_RECIPES: Recipe[] = [
  { out: 'chest', n: 1, cost: { wood: 30 }, note: tr('content.n24SlotsStorage') },
  { out: 'chest_big', n: 1, cost: { wood: 60, copper_bar: 2 }, skill: 'foraging', level: 3, note: tr('content.n48SlotsStorageUse') },
  { out: 'fence_wood', n: 10, cost: { wood: 20 }, note: tr('content.pensLayouts') },
  { out: 'gate_wood', n: 1, cost: { wood: 10 }, note: tr('content.opensClosesNeverPinches') },
  { out: 'path_wood', n: 10, cost: { wood: 10 }, note: tr('content.plankPathMoveSpeed') },
  { out: 'path_stone', n: 10, cost: { stone: 10 }, skill: 'mining', level: 1, note: tr('content.flagstonePathMoveSpeed') },
  { out: 'sprinkler', n: 1, cost: { copper_bar: 3, wood: 20, stone: 10 }, skill: 'farming', level: 3, flag: 'irrigation_network_available', note: tr('content.waters8TilesAround') },
  { out: 'sprinkler_plus', n: 1, cost: { iron_bar: 3, copper_bar: 2, crystal_ore: 1 }, skill: 'farming', level: 5, flag: 'irrigation_network_available', note: tr('content.waters24TilesAround') },
  { out: 'pipe', n: 10, cost: { copper_bar: 1, stone: 5 }, flag: 'irrigation_network_available', note: tr('content.connectsWellWaterTanks') },
  { out: 'water_tank', n: 1, cost: { wood: 40, copper_bar: 2 }, flag: 'irrigation_network_available', note: tr('content.extendsPipeNetwork12') },
  { out: 'fert_quality', n: 5, cost: { fiber: 10, '#veg': 1 }, skill: 'farming', level: 1, min: 60, note: tr('content.takes60MinutesMake') },
  { out: 'fert_water', n: 5, cost: { clay: 10, fiber: 10 }, skill: 'farming', level: 2, note: tr('content.wateringLastsNextDay') },
  { out: 'campfire', n: 1, cost: { stone: 15, wood: 10 }, skill: 'foraging', level: 1, note: tr('content.restWarm1Wood') },
  { out: 'torch', n: 5, cost: { wood: 5, resin: 1 }, note: tr('content.stickGroundLight') },
  { out: 'lamp_post', n: 1, cost: { wood: 10, copper_bar: 1 }, skill: 'mining', level: 2, note: tr('content.lightsNight') },
  { out: 'bobber', n: 1, cost: { wood: 10, copper_bar: 1 }, skill: 'fishing', level: 3, note: tr('content.catchBarWidth10') },
  { out: 'crab_pot', n: 1, cost: { wood: 30, copper_bar: 2 }, skill: 'fishing', level: 4, note: tr('content.placeWaterUses1') },
  { out: 'supply_pack', n: 1, cost: { cloth: 1, wood: 10 }, skill: 'foraging', level: 5, note: tr('content.fullnessDropsSlowerWhile') },
  { out: 'winter_coat', n: 1, cost: { cloth: 3, rabbit_fur: 2 }, skill: 'foraging', level: 5, note: tr('content.cancelsOrdinaryWinterCold') },
  { out: 'antidote', n: 2, cost: { herb: 3, '#honey': 1 }, friend: ['yelan', 200], note: tr('content.curesPoison') },
  { out: 'auto_hopper', n: 1, cost: { wood: 60, iron_bar: 5, crystal_ore: 2 }, skill: 'farming', level: 6, note: tr('content.loadsNearbyMachinesChests') },
  { out: 'auto_collector', n: 1, cost: { wood: 60, iron_bar: 5, cloth: 2 }, skill: 'husbandry', level: 6, note: tr('content.collectsEverythingAdjoiningCoop') },
  // 机器蓝图（12.2）
  { out: 'mill', n: 1, cost: { wood: 40, stone: 20, copper_bar: 2 }, skill: 'farming', level: 2, note: tr('content.grainFlour120Min') },
  { out: 'pickle_jar', n: 1, cost: { wood: 40, stone: 15, copper_bar: 1 }, skill: 'farming', level: 3, note: tr('content.vegetableMatchingPickles720') },
  { out: 'jam_pot', n: 1, cost: { wood: 40, copper_bar: 3 }, skill: 'farming', level: 4, note: tr('content.fruitMatchingJam960') },
  { out: 'cheese_press', n: 1, cost: { wood: 50, stone: 20, copper_bar: 3 }, skill: 'husbandry', level: 3, note: tr('content.milkCheese480Min') },
  { out: 'loom', n: 1, cost: { wood: 60, copper_bar: 2 }, skill: 'foraging', level: 4, note: tr('content.fiberCropsWoolCloth') },
  { out: 'oil_press', n: 1, cost: { wood: 60, iron_bar: 2 }, skill: 'farming', level: 5, note: tr('content.n2CornSunflowersVegetable') },
  { out: 'beehive', n: 1, cost: { wood: 50, copper_bar: 2, resin: 5 }, skill: 'farming', level: 4, note: tr('content.makesHoneyEvery2') },
  { out: 'bake_oven', n: 1, cost: { stone: 50, iron_bar: 3 }, skill: 'farming', level: 4, flag: 'house:1', note: tr('content.n2Flour1Wood') },
  { out: 'seed_maker', n: 1, cost: { wood: 60, iron_bar: 5, crystal_ore: 2 }, skill: 'farming', level: 7, note: tr('content.regularQualityCropSeeds') },
  // 料理（公共厨房或家中厨房）
  { out: 'porridge_milk', n: 1, cost: { 'milk|goat_milk': 1, '#grain': 1 }, friend: ['xiahe', 200], at: 'kitchen', note: tr('content.energy80Health15') },
  { out: 'bread', n: 1, cost: { flour: 1 }, at: 'kitchen', note: tr('content.energy40Fullness25') },
  { out: 'stew_tomato', n: 1, cost: { summer_tomato: 1, 'spring_carrot|autumn_sweet_potato': 1 }, skill: 'farming', level: 3, at: 'kitchen', note: tr('content.workEnergyCost10') },
  { out: 'soup_pumpkin', n: 1, cost: { autumn_pumpkin: 1, 'milk|goat_milk': 1 }, unlock: 'recipe:soup_pumpkin', at: 'kitchen', note: tr('content.coldDrain30240') },
  { out: 'gratin_sweet_potato', n: 1, cost: { autumn_sweet_potato: 1, 'milk|goat_milk': 1, 'winter_wheat|autumn_sorghum': 1 }, flag: 'house:2', at: 'kitchen', note: tr('content.maxEnergy20Temporary') },
  { out: 'pie_berry', n: 1, cost: { 'spring_strawberry|summer_blueberry|autumn_cranberry': 1, flour: 1, '#egg': 1 }, friend: ['xiahe', 400], at: 'kitchen', note: tr('content.firstGiftDayGives') },
  { out: 'rice_fried_veg', n: 1, cost: { '#grain': 1, summer_pepper: 1, '#veg': 1 }, skill: 'farming', level: 5, at: 'kitchen', note: tr('content.workEnergyCost102') },
  { out: 'bento_fish', n: 1, cost: { '#fish': 1, '#grain': 1, '#veg': 1 }, skill: 'fishing', level: 4, at: 'kitchen', note: tr('content.maxHealth10180') },
  { out: 'tea_herb', n: 1, cost: { herb: 1, autumn_chrysanthemum: 1 }, friend: ['yelan', 0], at: 'kitchen', note: tr('content.curesSlowed') },
  { out: 'drink_honey', n: 1, cost: { '#honey': 1, lemon: 1 }, skill: 'farming', level: 4, at: 'kitchen', note: tr('content.energy65Health15') },
  { out: 'platter_cheese', n: 1, cost: { '#dairy': 1, 'apple|wild_pear': 1 }, skill: 'husbandry', level: 5, at: 'kitchen', note: tr('content.pickupRange20180') },
  { out: 'soup_fish_spicy', n: 1, cost: { '#fish': 1, summer_pepper: 1, winter_leek: 1 }, skill: 'combat', level: 4, at: 'kitchen', note: tr('content.combatDamage10180') },
  { out: 'ration_trail', n: 1, cost: { dried_food: 1, '#grain': 1 }, skill: 'foraging', level: 4, at: 'kitchen', note: tr('content.coldDrain20240') },
  { out: 'feast_harvest', n: 1, cost: { autumn_pumpkin: 1, 'milk|goat_milk': 1, '#fish': 1, flour: 1 }, unlock: 'recipe:feast_harvest', at: 'kitchen', note: tr('content.energyCost10Max') },
]

// ---------- 10.1 动物 ----------
export type AnimalKind = 'chicken' | 'duck' | 'rabbit' | 'cow' | 'sheep' | 'goat'
export interface AnimalDef { name: string; price: number; mature: number; product: string; every: number; home: 'coop' | 'barn'; big: boolean; care?: 'milk' | 'shear'; sound: string; scale: number }
export const ANIMALS: Record<AnimalKind, AnimalDef> = {
  chicken: { name: tr('content.chicken'), price: 600, mature: 5, product: 'egg', every: 1, home: 'coop', big: false, sound: 'cluck', scale: 1.7 },
  duck: { name: tr('content.duck'), price: 1200, mature: 7, product: 'duck_egg', every: 2, home: 'coop', big: false, sound: 'quack', scale: 1.6 },
  rabbit: { name: tr('content.rabbit'), price: 1800, mature: 8, product: 'rabbit_fur', every: 3, home: 'coop', big: true, sound: 'rabbit', scale: 1.6 },
  cow: { name: tr('content.cow'), price: 2500, mature: 7, product: 'milk', every: 1, home: 'barn', big: false, care: 'milk', sound: 'moo', scale: 1 },
  sheep: { name: tr('content.sheep'), price: 3200, mature: 9, product: 'wool', every: 2, home: 'barn', big: false, care: 'shear', sound: 'baa', scale: 1.1 },
  goat: { name: tr('content.goat'), price: 3500, mature: 10, product: 'goat_milk', every: 2, home: 'barn', big: true, care: 'milk', sound: 'goat', scale: 1 },
}
export const HAY = { buy: 15, sell: 3, silo: 240, maxSilos: 4 }

// ---------- 17.1 农场私人建筑（公共工程见 PROJECTS） ----------
export type BuildKind = 'coop' | 'barn' | 'silo' | 'workshop' | 'well' | 'cabin'
export interface BuildDef { name: string; w: number; d: number; money: number; cost: Record<string, number>; days: number; cap?: number; up?: { money: number; cost: Record<string, number>; days: number; name: string; cap?: number }; max?: number; door?: [number, number] }
export const BUILDINGS: Record<BuildKind, BuildDef> = {
  coop: { name: tr('common.coop'), w: 6, d: 5, money: 2000, cost: { wood: 100, stone: 40 }, days: 1, cap: 4, up: { name: tr('common.bigCoop'), money: 6000, cost: { wood: 180, copper_bar: 5 }, days: 2, cap: 8 } },
  barn: { name: tr('common.barn'), w: 7, d: 6, money: 6000, cost: { wood: 180, stone: 80 }, days: 2, cap: 4, up: { name: tr('common.bigBarn'), money: 12000, cost: { wood: 250, iron_bar: 8 }, days: 2, cap: 8 } },
  silo: { name: tr('common.silo'), w: 3, d: 3, money: 1200, cost: { stone: 60, copper_bar: 2 }, days: 1, max: 4 },
  workshop: { name: tr('common.workshop'), w: 8, d: 6, money: 8000, cost: { wood: 200, stone: 100, iron_bar: 5 }, days: 2 },
  well: { name: tr('common.well'), w: 3, d: 3, money: 1500, cost: { stone: 80, copper_bar: 2 }, days: 1 },
  cabin: { name: tr('common.cabin'), w: 5, d: 4, money: 3000, cost: { wood: 120, stone: 40 }, days: 1 },
}
// 家宅升级（17.1）
export const HOUSE_UPGRADES: ({ money: number; cost: Record<string, number>; days: number } | null)[] = [null, { money: 5000, cost: { wood: 150 }, days: 2 }, { money: 15000, cost: { wood: 250, iron_bar: 10 }, days: 3 }]

// ---------- 17.1 公共工程 ----------
export interface ProjectDef { name: string; money: number; cost: Record<string, number>; days: number; unlock: string }
export const G3_PROJECTS = {
  bridge: { name: tr('common.woodsBridge'), money: 1500, cost: { wood: 100, stone: 30 }, days: 1, unlock: 'system:bridge_fund' },
  station: { name: tr('common.waystation'), money: 4000, cost: { wood: 120, iron_bar: 5 }, days: 2, unlock: 'system:station_fund' },
  greenhouse: { name: tr('content.greenhouseRestoration'), money: 9000, cost: { wood: 150, stone: 100, iron_bar: 8, crystal_ore: 2 }, days: 2, unlock: 'system:greenhouse_fund' },
  windmill: { name: tr('common.windmill'), money: 15000, cost: { hardwood: 60, alloy_bar: 5, '#core': 1 }, days: 3, unlock: 'system:windmill_fund' },
} satisfies Record<string, ProjectDef>

// ---------- 15.4 / 15.5 敌人与首领 ----------
export type FoeAi = 'pounce' | 'charge' | 'crab' | 'swoop' | 'combo' | 'spore' | 'smash' | 'shoot' | 'frost' | 'shock' | 'boss_gate' | 'boss_furnace' | 'boss_crystal'
export interface FoeDef { name: string; hp: number; atk: number; def: number; speed: number; sight: number; ai: FoeAi; tele: number; drops: [string, number, number][]; xp: number; model: string; scale: number; fly?: boolean; boss?: boolean }
const foe = (name: string, hp: number, atk: number, def: number, ai: FoeAi, tele: number, drops: [string, number, number][], xp: number, model: string, more: Partial<FoeDef> = {}): FoeDef =>
  ({ name, hp, atk, def, speed: 1.1, sight: 7, ai, tele, drops, xp, model, scale: 1.35, ...more })
export const FOE_DEFS: Record<string, FoeDef> = {
  moss: foe(tr('content.mossBlob'), 20, 6, 0, 'pounce', 0.6, [['fiber', 1, 1], ['clay', 1, 0.4]], 6, 'models/g2/enemy_moss.glb', { speed: 1.0, sight: 6 }),
  beetle: foe(tr('content.dirtBeetle'), 32, 8, 1, 'charge', 0.8, [['bugmeat', 1, 1], ['copper_ore', 1, 0.35]], 8, 'models/g2/enemy_beetle.glb', { speed: 1.3 }),
  crab: foe(tr('content.rubbleCrab'), 40, 10, 3, 'crab', 0.5, [['stone', 2, 1], ['copper_ore', 1, 0.4]], 9, 'models/g3/creatures/enemy_crab.glb', { speed: 0.9 }),
  bat: foe(tr('content.caveWing'), 24, 8, 0, 'swoop', 0.5, [['bugmeat', 1, 1], ['coal', 1, 0.3]], 8, 'models/g3/creatures/enemy_bat.glb', { speed: 1.8, fly: true, sight: 8 }),
  ironbug: foe(tr('content.ironshellBug'), 60, 12, 4, 'charge', 0.6, [['iron_ore', 1, 1], ['bugmeat', 1, 0.5]], 11, 'models/g3/creatures/enemy_ironbug.glb', { speed: 1.2 }),
  claw: foe(tr('content.mineClaw'), 75, 14, 2, 'combo', 0.5, [['iron_ore', 1, 1], ['hide_scrap', 1, 0.4]], 12, 'models/g3/creatures/enemy_claw.glb', { speed: 1.4 }),
  moth: foe(tr('content.glowdustMoth'), 45, 8, 0, 'spore', 0.8, [['herb', 1, 1], ['bugmeat', 1, 0.5]], 10, 'models/g3/creatures/enemy_moth.glb', { speed: 1.3, fly: true }),
  rockback: foe(tr('content.rockback'), 100, 18, 5, 'smash', 0.9, [['stone', 3, 1], ['coal', 1, 0.6]], 14, 'models/g3/creatures/enemy_rockback.glb', { speed: 0.8 }),
  spiker: foe(tr('content.crystalSpiker'), 100, 20, 3, 'shoot', 0.7, [['crystal_ore', 1, 1]], 15, 'models/g3/creatures/enemy_spiker.glb', { speed: 0.9, sight: 8 }),
  wisp: foe(tr('content.frostWisp'), 90, 16, 2, 'frost', 0.8, [['crystal_ore', 1, 1], ['herb', 1, 0.4]], 15, 'models/g3/creatures/enemy_wisp.glb', { speed: 1.1, fly: true }),
  crystalwing: foe(tr('content.crystalWing'), 80, 18, 2, 'swoop', 0.6, [['crystal_ore', 1, 1], ['coal', 1, 0.5]], 16, 'models/g3/creatures/enemy_crystalwing.glb', { speed: 2.0, fly: true, sight: 9 }),
  guard: foe(tr('content.oldMineGuardian'), 140, 25, 8, 'shock', 0.9, [['crystal_ore', 1, 1], ['iron_ore', 2, 0.6]], 18, 'models/g3/creatures/enemy_guard.glb', { speed: 0.9 }),
  gatekeeper: foe(tr('content.stonebackGatekeeper'), 300, 14, 3, 'boss_gate', 0.6, [['copper_bar', 5, 1]], 100, 'models/g3/creatures/boss_gatekeeper.glb', { speed: 1.1, sight: 30, boss: true, scale: 1 }),
  furnacebeast: foe(tr('content.furnaceHeartBeast'), 800, 22, 6, 'boss_furnace', 0.8, [['iron_bar', 5, 1]], 100, 'models/g3/creatures/boss_furnace.glb', { speed: 1.2, sight: 30, boss: true, scale: 1 }),
  crystalcore: foe(tr('content.crystalCore'), 1500, 30, 8, 'boss_crystal', 0.9, [['core_boss', 1, 1]], 100, 'models/g3/creatures/boss_crystal.glb', { speed: 0, sight: 30, boss: true, scale: 1 }),
}
// 15.1 三个主题区：每主题 4 种普通敌人；10/20/30 层首领
export const MINE_THEMES = [
  { name: tr('content.mossyShallows'), foes: ['moss', 'beetle', 'crab', 'bat'], boss: 'gatekeeper', ore: 'copper' },
  { name: tr('content.oldIronMine'), foes: ['ironbug', 'claw', 'moth', 'rockback'], boss: 'furnacebeast', ore: 'iron' },
  { name: tr('content.frostCrystalDepths'), foes: ['spiker', 'wisp', 'crystalwing', 'guard'], boss: 'crystalcore', ore: 'crystal' },
] as const
export const mineTheme = (floor: number) => Math.min(2, Math.floor((Math.max(1, floor) - 1) / 10))
export const isRestFloor = (floor: number) => floor % 10 === 5
export const isBossFloor = (floor: number) => floor % 10 === 0
// 首领首次击败奖励（15.5）
export const BOSS_FIRST: Record<string, { items: [string, number][]; unlock: string[]; note: string }> = {
  gatekeeper: { items: [['copper_bar', 5]], unlock: ['mine:iron'], note: tr('content.oldIronMineFloors') },
  furnacebeast: { items: [['iron_bar', 5]], unlock: ['mine:frost', 'recipe:alloy_hint'], note: tr('content.frostCrystalDepthsFloors') },
  crystalcore: { items: [['core_boss', 1]], unlock: ['mine:cleared'], note: tr('content.windmillCoreMinesFully') },
}

// 6.4 寒冷与潮湿（每游戏分钟）
export const COLD = { wetGain: 1, wetDry: 1.5, wetFire: 3, lossWet: 0.25, lossDry: 0.1, lossBlizzard: 0.3, regen: 1, regenFire: 3, slow: 30, hurt: 10 }
// 6.4 负面状态：最多 2 个，同种刷新时长
export const STATUS = { poison: { name: tr('content.poisoned'), min: 20, tick: 5, dmg: 1 }, slow: { name: tr('content.slowed'), min: 5, mult: 0.8 } } as const
