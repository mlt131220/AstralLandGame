// 模型登记表：游戏对象 → 资源文件、缩放、变体。路径相对 public/assets/。
// 素材来源与许可（Kenney CC0、本项目 Blender 原创/派生等）逐批记在 docs/ASSET_LEDGER.md。1 地格 = 1 米。

import { DECOR_BY_ID, DECORS, TREE_SPECIES } from '../content/g4.ts'

export interface ModelDef { path: string; scale: number }
const nk = (name: string, scale: number): ModelDef => ({ path: `kenney/nature-kit/${name}.glb`, scale })
const k = (kit: string, name: string, scale: number): ModelDef => ({ path: `kenney/${kit}/${name}.glb`, scale })
// G2 场景、生物与公共工程（Blender 制作，米制，正面朝 +Z）
const g2 = (name: string, scale = 1): ModelDef => ({ path: `models/g2/${name}.glb`, scale })
const item = (name: string, scale = 1): ModelDef => ({ path: `models/items/${name}.glb`, scale })
const flora = (name: string, scale = 1): ModelDef => ({ path: `models/flora/${name}.glb`, scale })
const mine = (name: string, scale = 1): ModelDef => ({ path: `models/g3/mine/${name}.glb`, scale })

// 障碍物与可交互地物（变体按坐标哈希挑选）
export const OBSTACLE_MODELS: Record<string, ModelDef[]> = {
  // 可割的杂草：精细草丛放大，比装饰草丛更高更密，一眼能分辨
  weed: [flora('grass_tuft_c', 2.3), flora('grass_tuft_e', 2.1), flora('grass_tuft_f', 2.4), flora('flower_mixed', 2.2)],
  stone: [k('survival-kit', 'rock-a', 1.25), k('survival-kit', 'rock-b', 1.25), k('survival-kit', 'rock-c', 1.2)],
  branch: [nk('log', 1.5), nk('log', 1.25)],
  reed: [g2('reeds_a'), g2('reeds_b')],
  rock: [g2('rock_node_a'), g2('rock_node_b')],
  copper: [g2('ore_copper')],
  coal: [g2('ore_coal')],
  exit: [g2('rock_node_b', 1.18)],
  iron: [mine('ore_iron')],
  crystal: [mine('ore_crystal')],
  boulder: [g2('rock_node_a', 1.5)],
  pillar: [mine('ice_pillar')],
  hardtree: [{ path: 'models/g3/regions/hardwood_tree_a.glb', scale: 0.72 }, { path: 'models/g3/regions/hardwood_tree_b.glb', scale: 0.72 }],
  hardstump: [{ path: 'models/g3/regions/hardwood_stump.glb', scale: 1 }],
}

// 野外地上的采集物（无专用模型的用相近的自然物件代替）
export const FORAGE_MODELS: Record<string, ModelDef> = {
  // 物品按真实尺寸只有 0.3 米，放大到与角色比例相称、一眼能看见
  wild_greens: item('wild_greens', 1.7), wild_berry: item('wild_berry', 1.7), mushroom: item('mushroom', 1.7), herb: item('herb', 1.7),
  wood: nk('log', 1.7), clay: nk('stone_smallFlatA', 1.6),
}
// 掉落物与机器
export const ITEM_MODELS: Record<string, ModelDef> = {
  copper_ore: item('copper_ore', 0.7), coal: item('coal', 0.7), furnace: item('furnace'), furnace_lit: item('furnace_lit'),
  drying_rack: item('drying_rack'), compost: item('compost'), scarecrow: item('scarecrow'),
  iron_ore: item('iron_ore', 0.7), crystal_ore: item('crystal_ore', 0.7), hide_scrap: item('hide_scrap', 0.7), core_boss: item('core_boss', 0.8),
}
// 农场放置物（Codex 任务 17）：机器带 working 子节点，栅栏/水管带四向连接子节点
export const ENT_KINDS = ['mill', 'pickle_jar', 'jam_pot', 'cheese_press', 'loom', 'oil_press', 'beehive', 'bake_oven', 'seed_maker', 'auto_hopper', 'auto_collector',
  'chest', 'chest_big', 'fence_wood', 'gate_wood', 'sprinkler', 'sprinkler_plus', 'water_tank', 'campfire', 'torch', 'lamp_post', 'crab_pot', 'pipe',
  'path_wood_a', 'path_wood_b', 'path_stone_a', 'path_stone_b']
for (const k of ENT_KINDS) ITEM_MODELS[k] ??= item(k)
// 果树：通用树苗 → 幼树 → 成树（leaves / blossom / fruit_1..3 子节点）
export const fruitTreeModel = (tree: string, stage: number): ModelDef => ({ path: stage === 0 ? 'models/g3/flora/fruit_sapling.glb' : `models/g3/flora/${tree}_${stage === 1 ? 'young' : 'tree'}.glb`, scale: 1 })
// 动物（Codex 任务 19）；幼崽缩放 0.6
export const ANIMAL_MODELS: Record<string, string> = {
  chicken: 'models/g2/chicken.glb', duck: 'models/g3/animals/duck.glb', rabbit: 'models/g3/animals/rabbit.glb',
  cow: 'models/g3/animals/cow.glb', sheep: 'models/g3/animals/sheep.glb', goat: 'models/g3/animals/goat.glb',
}
// 农场私人建筑与公共工程模型（Codex 任务 20）
export const G3_BUILDING_MODELS = ['farmhouse_1', 'farmhouse_2', 'coop_big', 'barn_big', 'silo', 'workshop', 'cabin', 'construction_site', 'greenhouse_ruined', 'greenhouse_scaffold',
  'greenhouse', 'carpenter_shop', 'ranch_house', 'clinic', 'trader_stall', 'bridge_ruined', 'bridge_scaffold', 'bridge', 'station_ruined', 'station_scaffold', 'station']
  .map((n) => ({ path: `models/g3/buildings/${n}.glb`, scale: 1 }))
// 矿洞岩壁（1×1×2.3 米，可连续拼接）：苔石浅矿 / 旧铁矿 / 寒晶深矿，第 4 个是装饰变体
export const MINE_WALL_SETS = [
  [g2('mine_wall_a'), g2('mine_wall_b'), g2('mine_wall_c'), g2('mine_wall_moss')],
  [mine('iron_wall_a'), mine('iron_wall_b'), mine('iron_wall_c'), mine('iron_wall_rust')],
  [mine('frost_wall_a'), mine('frost_wall_b'), mine('frost_wall_c'), mine('frost_wall_crystal')],
]
export const MINE_WALLS = MINE_WALL_SETS.flat()
// 矿洞障碍按主题换外观
const THEMED: Record<string, ModelDef[][]> = {
  rock: [[g2('rock_node_a'), g2('rock_node_b')], [mine('rock_node_iron_a'), mine('rock_node_iron_b')], [mine('rock_node_frost_a'), mine('rock_node_frost_b')]],
  coal: [[g2('ore_coal')], [mine('ore_coal_iron')], [mine('ore_coal_iron')]],
  iron: [[mine('ore_iron')], [mine('ore_iron')], [mine('ore_iron_frost')]],
  exit: [[g2('rock_node_b', 1.18)], [mine('rock_node_iron_b', 1.18)], [mine('rock_node_frost_b', 1.18)]],
  boulder: [[g2('rock_node_a', 1.5)], [mine('rock_node_iron_a', 1.5)], [mine('rock_node_frost_a', 1.5)]],
}
export const obstacleModels = (k: string, theme: number) => THEMED[k]?.[theme] ?? OBSTACLE_MODELS[k]
export const THEMED_MODELS = Object.values(THEMED).flat(2)
// 投射物与落石
export const SHOT_MODELS: Record<string, ModelDef> = {
  crystal: { path: 'models/g3/creatures/proj_crystal.glb', scale: 1 }, spore: { path: 'models/g3/creatures/proj_spore.glb', scale: 1 },
  arrow: item('arrow_practice'), boulder: { path: 'models/g3/creatures/proj_boulder.glb', scale: 1 },
}
export const CLIFFS = [nk('cliff_block_rock', 1), nk('cliff_block_rock', 1), nk('cliff_blockHalf_rock', 1)]
// 带动画的生物
export const CREATURES = { moss: 'models/g2/enemy_moss.glb', beetle: 'models/g2/enemy_beetle.glb', chicken: 'models/g2/chicken.glb', chick: 'models/g2/chick.glb' }
export const ROD_TIP = 1.5 // 钓竿长度（米），用于鱼线起点

// 地表装饰
export const DECOR_MODELS = {
  // 地表草丛与野花：Blender 制作的精细版（models/flora，单位米），按角色比例略放大
  tuft: ['grass_tuft_a', 'grass_tuft_b', 'grass_tuft_c', 'grass_tuft_d', 'grass_tuft_e', 'grass_tuft_f', 'clover_patch'].map((n) => flora(n, 1.6)),
  flower: ['flower_daisy', 'flower_dandelion', 'flower_poppy', 'flower_bluebell', 'flower_violet', 'flower_lavender', 'flower_mixed'].map((n) => flora(n, 1.5)),
  pebble: [nk('stone_smallA', 1.4), nk('stone_smallFlatA', 1.6), nk('stone_smallC', 1.3)],
  lily: [nk('lily_large', 2.2), nk('lily_small', 2.2)],
  reed: [nk('grass_large', 1.6), nk('plant_flatTall', 2)],
  mushroom: [nk('mushroom_redGroup', 1.8), nk('mushroom_tanGroup', 1.8)],
  soil: [nk('crops_dirtSingle', 2.3)],
}

// 场景摆件（区域定义里用 id 引用）
export const PROP_MODELS: Record<string, ModelDef> = {
  barrel: k('survival-kit', 'barrel', 2),
  crate: k('survival-kit', 'box-large', 2),
  chest: k('survival-kit', 'chest', 2),
  campfire: k('survival-kit', 'campfire-pit', 2.2),
  signpost: k('survival-kit', 'signpost', 2),
  workbench: k('survival-kit', 'workbench', 2),
  hay: k('graveyard-kit', 'hay-bale', 2),
  hayBundle: k('graveyard-kit', 'hay-bale-bundled', 2),
  lightpost: k('graveyard-kit', 'lightpost-single', 2),
  bench: k('holiday-kit', 'bench', 1.4),
  lantern: k('fantasy-town-kit', 'lantern', 1.6),
  stall: k('fantasy-town-kit', 'stall', 2),
  stallRed: k('fantasy-town-kit', 'stall-red', 2),
  stallGreen: k('fantasy-town-kit', 'stall-green', 2),
  cart: k('fantasy-town-kit', 'cart', 2),
  fountain: k('fantasy-town-kit', 'fountain-round', 2),
  hedge: k('fantasy-town-kit', 'hedge', 2),
  hedgeLarge: k('fantasy-town-kit', 'hedge-large', 2),
  fence: nk('fence_simple', 2),
  fenceGate: nk('fence_gate', 2),
  pumpkin: k('graveyard-kit', 'pumpkin', 2),
  bush: nk('plant_bushDetailed', 2.6),
  logStack: nk('log_stack', 2),
  tent: nk('tent_detailedOpen', 2),
  rockLarge: k('fantasy-town-kit', 'rock-large', 1.6),
  rockWide: k('fantasy-town-kit', 'rock-wide', 1.6),
  windmillRuined: { path: 'models/buildings/windmill_ruined.glb', scale: 1 },
  log: nk('log', 2.2),
  festArch: g2('festival_arch'), festBunting: g2('festival_bunting'), flowerBooth: g2('flower_booth'), festTable: g2('festival_table'),
  flowerPot_a: g2('flower_pot_a'), flowerPot_b: g2('flower_pot_b'), flowerPot_c: g2('flower_pot_c'),
  sluiceRuined: g2('sluice_ruined'), sluiceScaffold: g2('sluice_scaffold'), sluice: g2('sluice'), fishingDock: g2('fishing_dock'),
  signRegion: g2('signpost_region'), riverRock_a: g2('river_rock_a'), riverRock_b: g2('river_rock_b'), logBig: g2('forest_log_big'),
  bushBerry: g2('bush_berry', 1.3), mineLamp: g2('mine_lamp'), mineCart: g2('mine_cart'), mineSupport: g2('mine_support'), mossGlow: g2('moss_glow'),
  // 旧铁矿、寒晶深矿与据点摆件（Codex 任务 15）
  ironLamp: mine('iron_lamp'), slagHeap: mine('slag_heap'), ironSupport: mine('iron_support'), mineCartRusty: mine('mine_cart_rusty'), railStraight: mine('rail_straight'),
  frostLamp: mine('frost_lamp'), crystalCluster_a: mine('crystal_cluster_a'), crystalCluster_b: mine('crystal_cluster_b'), iceIcicles: mine('icicle_cluster'),
  supplyCrate: mine('supply_crate'), rescueCabinet: mine('rescue_cabinet'), bossGate: mine('boss_gate'),
  greenhouse: { path: 'models/g3/buildings/greenhouse.glb', scale: 1 },
  bridgeRuined: { path: 'models/g3/buildings/bridge_ruined.glb', scale: 1 }, bridgeScaffold: { path: 'models/g3/buildings/bridge_scaffold.glb', scale: 1 }, bridge: { path: 'models/g3/buildings/bridge.glb', scale: 1 },
  traderStall: { path: 'models/g3/buildings/trader_stall.glb', scale: 1 }, safetySign: mine('safety_sign'),
  ...Object.fromEntries(([['forestShrine', 'forest_shrine'], ['giantMushroom', 'giant_mushroom'], ['mossyRock_a', 'mossy_rock_a'], ['mossyRock_b', 'mossy_rock_b'], ['fern_a', 'fern_a'], ['fern_b', 'fern_b'],
    ['heron', 'heron_statue'], ['wetlandDeadtree', 'wetland_deadtree'], ['mudMound', 'mud_mound'], ['cattail_a', 'cattail_a'], ['cattail_b', 'cattail_b'], ['lilyFlower', 'lily_pad_flower'],
    ['boardwalk', 'boardwalk_straight'], ['lookoutBench', 'lookout_bench'], ['cairn', 'cairn'], ['windFlag', 'wind_flag'], ['stoneWall', 'stone_wall_straight'], ['stoneWallCorner', 'stone_wall_corner'],
    ['highlandGrass_a', 'highland_grass_a'], ['highlandGrass_b', 'highland_grass_b'], ['alpineFlower_a', 'alpine_flower_a'], ['alpineFlower_b', 'alpine_flower_b']] as const)
    .map(([k, f]) => [k, { path: `models/g3/regions/${f}.glb`, scale: 1 }])),
}
// 树木（Codex 任务 27）：7 个树种 × 四季成树 + 树桩 + 树苗/幼树；叶冠在 leaves 子节点
export const TREE_STAGES = ['spring', 'summer', 'autumn', 'winter', 'stump', 'sapling', 'young'] as const
// 成树原尺寸 4.5–6 米、树冠约 3 米；按格子种的树缩到约六成，林子才透得出地面与小路（树苗、幼树按原大）
export const TREE_SCALE = 0.6
export const treeModel = (sp: string, stage: string): ModelDef => ({ path: `models/g4/trees/${sp}_${stage}.glb`, scale: stage === 'sapling' || stage === 'young' ? 0.85 : TREE_SCALE })
export const TREE_MODELS = TREE_SPECIES.flatMap((sp) => TREE_STAGES.map((st) => treeModel(sp, st)))
// 地图外圈树林用的远景版本（Codex 任务 37）：同结构、同材质，面数约原来的三成；只有四季成树
export const farTreeModel = (sp: string, season: string): ModelDef => ({ path: `models/g4/trees/far/${sp}_${season}.glb`, scale: TREE_SCALE })
export const FAR_TREE_MODELS = TREE_SPECIES.flatMap((sp) => TREE_STAGES.slice(0, 4).map((se) => farTreeModel(sp, se)))
// 室内陈设、墙块与门（Codex 任务 24–26，正面朝 +Z，原点在占地中心底面）
export const interiorModel = (id: string): ModelDef => ({ path: `models/g4/interior/${id}.glb`, scale: 1 })
export const ROOM_WALLS = ['a', 'b', 'window', 'corner', 'shelf'] as const
export const wallModel = (style: string, v: string): ModelDef => interiorModel(v === 'door' ? `door_${style}` : `wall_${style}_${v}`)
// 可放置的家具与装饰（任务 24 家具在 interior、任务 29 在 decor、任务 28 纪念物在 festival）
export const decorModel = (id: string): ModelDef => ({ path: `models/g4/${DECOR_BY_ID[id].dir}/${id}.glb`, scale: 1 })
export const DECOR_MODELS_G4 = DECORS.map((d) => decorModel(d.id))
PROP_MODELS.pet_bowl = { path: 'models/g4/pets/pet_bowl.glb', scale: 1.4 }
PROP_MODELS.pet_bed = { path: 'models/g4/pets/pet_bed.glb', scale: 1.4 }
// 节庆会场道具（Codex 任务 28）
for (const id of ["fishfest_banner", "fishfest_scoreboard", "fishfest_podium", "fishfest_stall", "picnic_basket", "picnic_grill", "picnic_parasol", "picnic_pot", "lantern_float", "lantern_marker", "lantern_stand", "market_booth_player", "market_tent_a", "market_tent_b", "market_judge_table", "sort_bin_red", "sort_bin_yellow", "sort_bin_green", "harvest_cart", "grain_sacks", "craft_bench_snow", "craft_parts", "snow_base", "hearth_brazier", "greeting_cabinet", "story_bench", "festival_arch_summer", "festival_arch_autumn", "festival_arch_winter"]) PROP_MODELS[id] = { path: `models/g4/festival/${id}.glb`, scale: 1 }
for (const id of ['deco_snow_house', 'deco_flower_box', 'picnic_blanket']) PROP_MODELS[id] = { path: `models/g4/festival/${id}.glb`, scale: 1 }
// 夜间/矿洞点光源的摆件与光色（glow：光晕高度，缺省按路灯/矿灯）
export const LAMP_PROPS: Record<string, { y: number; color: number; mine: boolean; glow?: number }> = {
  fireplace: { y: 0.7, color: 0xff8a3a, mine: false, glow: 0.6 }, kitchen_stove: { y: 1.0, color: 0xff9a4a, mine: false, glow: 0.95 },
  lamp_floor: { y: 1.5, color: 0xffc27a, mine: false, glow: 1.55 }, lamp_table: { y: 1.1, color: 0xffc27a, mine: false, glow: 1.0 },
  forge_town: { y: 1.0, color: 0xff7a2a, mine: false, glow: 0.9 }, stove_diner: { y: 1.0, color: 0xff9a4a, mine: false, glow: 0.95 },
  heater_coop: { y: 0.6, color: 0xff8a3a, mine: false, glow: 0.55 },
  hearth_brazier: { y: 1.0, color: 0xff8a3a, mine: false, glow: 0.9 }, picnic_grill: { y: 0.9, color: 0xff9a4a, mine: false, glow: 0.8 },
  lantern_stand: { y: 1.3, color: 0xffd08a, mine: false, glow: 1.3 }, lantern_marker: { y: 0.8, color: 0xffd08a, mine: false, glow: 0.8 }, lantern_float: { y: 0.3, color: 0xffd08a, mine: false, glow: 0.3 },
  ...Object.fromEntries(DECORS.filter((d) => d.light).map((d) => [d.id, { y: d.light!, color: d.id === 'decor_fluorite_lamp' ? 0x9ad8ff : 0xffc27a, mine: false, glow: d.light! }])),
  lantern: { y: 2.3, color: 0xffb560, mine: false }, lightpost: { y: 2.3, color: 0xffb560, mine: false },
  mineLamp: { y: 1.5, color: 0xffb560, mine: true }, ironLamp: { y: 1.5, color: 0xffa040, mine: true }, frostLamp: { y: 1.5, color: 0x9ad8ff, mine: true },
  lamp_post: { y: 2.2, color: 0xffb560, mine: false }, torch: { y: 1.2, color: 0xffa040, mine: false }, campfire: { y: 0.7, color: 0xff9040, mine: false },
}

// 角色：Blender 版（加了手部挂点与农务动画）优先，缺失时退回 Kenney Mini Characters 原版（共用骨架）
export const LOOKS = ['male-a', 'male-b', 'male-c', 'male-d', 'male-e', 'male-f', 'female-a', 'female-b', 'female-c', 'female-d', 'female-e', 'female-f']
// G4 新居民专用外观（Codex 任务 31，沿用同一骨架）：玩家穿衣镜只列 LOOKS 的 12 套
export const NPC_ONLY_LOOKS = ['child-a', 'elder-f', 'elder-m', 'artist-f', 'scholar-m', 'teacher-f']
export const ALL_LOOKS = [...LOOKS, ...NPC_ONLY_LOOKS]
export const CHARACTER_MODELS = ALL_LOOKS.map((n) => ({
  path: `models/characters/character-${n}.glb`, fallback: LOOKS.includes(n) ? `kenney/mini-characters/character-${n}.glb` : `models/characters/character-${n}.glb`, scale: 2,
}))
export const lookPortrait = (i: number) => `/assets/ui/chars/character-${ALL_LOOKS[i % ALL_LOOKS.length]}.png`

// 手持工具：Blender 制作，4 个等级（原点在握柄，柄沿 +Y，工作端朝 +Z）
const TIERS = ['base', 'copper', 'iron', 'alloy']
export const toolModel = (id: string, tier: number): ModelDef => ({ path: `models/items/tool_${id}_${TIERS[tier] ?? 'base'}.glb`, scale: 1 })

// 建筑：由 Blender 组装的整体模型，单位米，正面朝 +Z
export const buildingModel = (id: string): ModelDef => ({ path: `models/buildings/${id}.glb`, scale: 1 })
export const cropModel = (id: string): ModelDef => ({ path: `models/crops/${id}.glb`, scale: 1 })

// Nature Kit 语义材质的季节配色（春夏秋冬）。树木的季节由 g3/flora 的季节模型表现，这里只调草叶
const SEASONAL: Record<string, number[]> = {
  leafsGreen: [0x86c766, 0x86c766, 0x86c766, 0x86c766],
  leafsDark: [0x5aa35a, 0x5aa35a, 0x5aa35a, 0x5aa35a],
  leafsFall: [0x86c766, 0x86c766, 0x86c766, 0x86c766],
  grass: [0x74b552, 0x569d3c, 0xa9a24a, 0xa2b5ad],
}
// 季节模型（Codex 任务 14）：草丛秋/冬版、灌木三季版；尺寸与原点与原模型一致，可直接替换
const SEASON_NAME = ['', 'summer', 'autumn', 'winter']
export function seasonalPath(path: string, se: number): string {
  if (!se) return path
  const g = /^models\/flora\/(grass_tuft_[a-f]|clover_patch)\.glb$/.exec(path)
  if (g && se >= 2) return `models/g3/flora/${g[1]}_${SEASON_NAME[se]}.glb`
  if (path === 'models/g2/bush_berry.glb') return `models/g3/flora/bush_${SEASON_NAME[se]}.glb`
  return path
}
// 四季野花：春用原有 7 种，夏/秋各 4 种，冬 2 种
const g3flora = (name: string, scale: number): ModelDef => ({ path: `models/g3/flora/${name}.glb`, scale })
export const FLOWERS_BY_SEASON: ModelDef[][] = [
  [], ['a', 'b', 'c', 'd'].map((k) => g3flora('flower_summer_' + k, 1.5)), ['a', 'b', 'c', 'd'].map((k) => g3flora('flower_autumn_' + k, 1.5)), ['a', 'b'].map((k) => g3flora('flower_winter_' + k, 1.5)),
]
export const GROUND_SEASONAL: Record<string, ModelDef[]> = {
  snow: [g3flora('snow_pile_a', 1), g3flora('snow_pile_b', 1)], leaves: [g3flora('leaf_pile_a', 1), g3flora('leaf_pile_b', 1)],
}
const FIXED: Record<string, number> = {
  woodBark: 0x8a5a3a, woodBarkDark: 0x6a442c, woodBirch: 0xdcd3c2, woodInner: 0xddb27c, wood: 0xae7a44, woodDark: 0x7d5532,
  dirt: 0x8d5d38, dirtDark: 0x6b4429, stone: 0xbfc3ca, stoneDark: 0x8c919a, colorRed: 0xd9534f, colorYellow: 0xf2c94c,
  colorPurple: 0x9b6bd0, colorBlue: 0x5b8fd9, colorWhite: 0xf4f1ea, _defaultMat: 0xf2ebdd,
}
export const paletteColor = (name: string, season: number) => SEASONAL[name]?.[season] ?? FIXED[name]
export const SEASONAL_MATERIALS = Object.keys(SEASONAL)
