// G4 内容表：长期愿望（设计 §19.4、任务链路 Q24）。愿望可并行、可改选，每个愿望 3 级可见目标，达成后在书桌领取对应装饰。


import { t } from '../core/i18n.ts'

// ---------- 树种（Codex 任务 27）：各区域按权重混种；砍树有机会掉落该树种的种子，种在农场里约 12 天长成 ----------
export const TREE_SPECIES = ['oak', 'maple', 'birch', 'pine', 'spruce', 'willow', 'cherry_wild'] as const
export type TreeSp = (typeof TREE_SPECIES)[number]
export const TREE_NAMES: Record<TreeSp, [string, string]> = {
  oak: [t('content.oak'), t('content.acorn')], maple: [t('content.maple'), t('content.mapleSeed')], birch: [t('content.birch'), t('content.birchSeed')], pine: [t('content.pine'), t('content.pineCone')],
  spruce: [t('content.spruce'), t('content.spruceCone')], willow: [t('content.willow'), t('content.willowFluffSeed')], cherry_wild: [t('content.wildCherry'), t('content.wildCherryPit')],
}
export const REGION_TREES: Record<string, [TreeSp, number][]> = {
  farm: [['oak', 3], ['maple', 2], ['cherry_wild', 1]],
  forest: [['oak', 3], ['maple', 2], ['birch', 2], ['pine', 1]],
  town: [['maple', 2], ['cherry_wild', 2], ['oak', 1]],
  river: [['birch', 2], ['willow', 2], ['oak', 1]],
  mountain: [['pine', 3], ['spruce', 2], ['birch', 1]],
  deepforest: [['spruce', 3], ['oak', 2], ['pine', 1]],
  wetland: [['willow', 3], ['birch', 2]],
  highland: [['pine', 2], ['spruce', 3]],
}
export const WILD_GROW = 12 // 树种子长成大树的日结数（冬季不长）
export const TREE_SEED_CHANCE = 0.25

// ---------- 家具与装饰（Codex 任务 24 家具 19、任务 29 装饰 42、任务 28 节庆纪念 9）：全部可放置 ----------
// where：in 只能摆在自己的屋里 / out 只能摆在农场 / any 都行；on：floor 地面 / top 可以放在桌面类家具上 / wall 贴墙（屋里靠墙的格子）
// flat：贴地的软装（地毯、野餐布）不挡路；light：发光高度（米）
export interface DecorDef { id: string; name: string; foot: [number, number]; price: number; dir: 'interior' | 'decor' | 'festival'; where: 'in' | 'out' | 'any'; on: 'floor' | 'top' | 'wall'; light?: number; flat?: boolean }
export const DECORS: DecorDef[] = [
  { id: 'table_dining', name: t('content.warmwoodDiningTable'), foot: [2, 1], price: 400, dir: 'interior', where: 'in', on: 'floor' },
  { id: 'chair_wood', name: t('content.woodenChair'), foot: [1, 1], price: 120, dir: 'interior', where: 'in', on: 'floor' },
  { id: 'bookshelf', name: t('content.bookcase'), foot: [1, 1], price: 450, dir: 'interior', where: 'in', on: 'floor' },
  { id: 'cabinet_low', name: t('content.lowCabinet'), foot: [1, 1], price: 300, dir: 'interior', where: 'in', on: 'floor' },
  { id: 'nightstand', name: t('content.nightstand'), foot: [1, 1], price: 160, dir: 'interior', where: 'in', on: 'floor' },
  { id: 'lamp_table', name: t('content.laceTableLamp'), foot: [1, 1], price: 220, dir: 'interior', where: 'in', on: 'top', light: 0.53 },
  { id: 'lamp_floor', name: t('content.warmFloorLamp'), foot: [1, 1], price: 320, dir: 'interior', where: 'in', on: 'floor', light: 1.36 },
  { id: 'rug_large', name: t('content.largeWovenRug'), foot: [2, 2], price: 600, dir: 'interior', where: 'in', on: 'floor', flat: true },
  { id: 'rug_small', name: t('content.smallWovenRug'), foot: [1, 1], price: 250, dir: 'interior', where: 'in', on: 'floor', flat: true },
  { id: 'painting_wall', name: t('content.valleyPainting'), foot: [1, 1], price: 500, dir: 'interior', where: 'in', on: 'wall' },
  { id: 'table_bonsai', name: t('content.bonsaiSideTable'), foot: [1, 1], price: 380, dir: 'interior', where: 'in', on: 'floor' },
  { id: 'chair_rocking', name: t('content.rattanRockingChair'), foot: [1, 1], price: 420, dir: 'interior', where: 'in', on: 'floor' },
  { id: 'sofa', name: t('content.fabricLoveseat'), foot: [2, 1], price: 900, dir: 'interior', where: 'in', on: 'floor' },
  { id: 'table_coffee', name: t('content.roundCoffeeTable'), foot: [1, 1], price: 260, dir: 'interior', where: 'in', on: 'floor' },
  { id: 'piano_upright', name: t('content.smallUprightPiano'), foot: [1, 1], price: 2400, dir: 'interior', where: 'in', on: 'floor' },
  { id: 'radio', name: t('content.woodenRadio'), foot: [1, 1], price: 520, dir: 'interior', where: 'in', on: 'top' },
  { id: 'window_flower_box', name: t('content.windowFlowerBox'), foot: [1, 1], price: 200, dir: 'interior', where: 'in', on: 'wall' },
  { id: 'clock_grandfather', name: t('content.grandfatherClock'), foot: [1, 1], price: 1500, dir: 'interior', where: 'in', on: 'floor' },
  { id: 'toy_chest', name: t('content.starToyChest'), foot: [1, 1], price: 300, dir: 'interior', where: 'in', on: 'floor' },
  { id: 'decor_bench_wood', name: t('content.woodenBench'), foot: [2, 1], price: 180, dir: 'decor', where: 'out', on: 'floor' },
  { id: 'decor_bench_stone', name: t('content.stoneBench'), foot: [2, 1], price: 260, dir: 'decor', where: 'out', on: 'floor' },
  { id: 'decor_swing', name: t('content.swing'), foot: [2, 1], price: 480, dir: 'decor', where: 'out', on: 'floor' },
  { id: 'decor_birdbath', name: t('content.birdbath'), foot: [1, 1], price: 200, dir: 'decor', where: 'out', on: 'floor' },
  { id: 'decor_sundial', name: t('content.sundial'), foot: [1, 1], price: 300, dir: 'decor', where: 'out', on: 'floor' },
  { id: 'decor_weathervane', name: t('content.roosterWeathervane'), foot: [1, 1], price: 240, dir: 'decor', where: 'out', on: 'floor' },
  { id: 'decor_gazebo', name: t('content.woodenGazebo'), foot: [2, 2], price: 2200, dir: 'decor', where: 'out', on: 'floor' },
  { id: 'decor_stone_lantern', name: t('content.stoneLantern'), foot: [1, 1], price: 360, dir: 'decor', where: 'out', on: 'floor', light: 1.04 },
  { id: 'decor_flower_arch', name: t('content.trellisFlowerArch'), foot: [2, 1], price: 650, dir: 'decor', where: 'out', on: 'floor' },
  { id: 'decor_well', name: t('content.decorativeWell'), foot: [1, 1], price: 420, dir: 'decor', where: 'out', on: 'floor' },
  { id: 'decor_stone_plinth', name: t('content.stonePlinth'), foot: [1, 1], price: 90, dir: 'decor', where: 'out', on: 'floor' },
  { id: 'decor_mailbox', name: t('content.woodenMailboxDecor'), foot: [1, 1], price: 160, dir: 'decor', where: 'out', on: 'floor' },
  { id: 'decor_scarecrow', name: t('content.scarecrowDecor'), foot: [1, 1], price: 220, dir: 'decor', where: 'out', on: 'floor' },
  { id: 'decor_wheelbarrow', name: t('content.wheelbarrowPlanter'), foot: [1, 1], price: 320, dir: 'decor', where: 'out', on: 'floor' },
  { id: 'decor_path_light', name: t('content.stonePathLight'), foot: [1, 1], price: 180, dir: 'decor', where: 'out', on: 'floor', light: 0.78 },
  { id: 'decor_fountain', name: t('content.smallFountain'), foot: [2, 2], price: 1800, dir: 'decor', where: 'out', on: 'floor' },
  { id: 'decor_pot_cactus', name: t('content.cactus'), foot: [1, 1], price: 80, dir: 'decor', where: 'any', on: 'floor' },
  { id: 'decor_pot_fern', name: t('content.fern'), foot: [1, 1], price: 100, dir: 'decor', where: 'any', on: 'floor' },
  { id: 'decor_pot_olive', name: t('content.littleOliveTree'), foot: [1, 1], price: 260, dir: 'decor', where: 'any', on: 'floor' },
  { id: 'decor_pot_lavender', name: t('content.pottedLavender'), foot: [1, 1], price: 120, dir: 'decor', where: 'any', on: 'floor' },
  { id: 'decor_pot_sunflower', name: t('content.pottedSunflower'), foot: [1, 1], price: 140, dir: 'decor', where: 'any', on: 'floor' },
  { id: 'decor_pot_succulent', name: t('content.succulentPlanter'), foot: [1, 1], price: 180, dir: 'decor', where: 'any', on: 'floor' },
  { id: 'decor_pot_pine', name: t('content.pottedPine'), foot: [1, 1], price: 360, dir: 'decor', where: 'any', on: 'floor' },
  { id: 'decor_pot_orchid', name: t('content.mothOrchid'), foot: [1, 1], price: 240, dir: 'decor', where: 'any', on: 'floor' },
  { id: 'decor_pot_spider', name: t('content.spiderPlantHanging'), foot: [1, 1], price: 160, dir: 'decor', where: 'any', on: 'floor' },
  { id: 'decor_pot_lemon', name: t('content.pottedLemonTree'), foot: [1, 1], price: 280, dir: 'decor', where: 'any', on: 'floor' },
  { id: 'decor_pot_rose', name: t('content.pottedRose'), foot: [1, 1], price: 180, dir: 'decor', where: 'any', on: 'floor' },
  { id: 'decor_pot_bamboo', name: t('content.pottedBamboo'), foot: [1, 1], price: 200, dir: 'decor', where: 'any', on: 'floor' },
  { id: 'decor_wall_lamp', name: t('content.wroughtIronWallLamp'), foot: [1, 1], price: 200, dir: 'decor', where: 'in', on: 'wall', light: 0.56 },
  { id: 'decor_paper_lantern', name: t('content.paperLantern'), foot: [1, 1], price: 100, dir: 'decor', where: 'any', on: 'floor', light: 0.71 },
  { id: 'decor_oil_lamp', name: t('content.oilLamp'), foot: [1, 1], price: 80, dir: 'decor', where: 'any', on: 'top', light: 0.57 },
  { id: 'decor_candelabra', name: t('content.candelabra'), foot: [1, 1], price: 180, dir: 'decor', where: 'any', on: 'top', light: 0.71 },
  { id: 'decor_mushroom_lamp', name: t('content.mushroomNightLight'), foot: [1, 1], price: 160, dir: 'decor', where: 'any', on: 'top', light: 0.51 },
  { id: 'decor_star_lights', name: t('content.starStringLights'), foot: [2, 1], price: 320, dir: 'decor', where: 'any', on: 'floor', light: 1.31 },
  { id: 'decor_fluorite_lamp', name: t('content.fluoriteLamp'), foot: [1, 1], price: 420, dir: 'decor', where: 'any', on: 'top', light: 0.54 },
  { id: 'decor_hurricane_lamp', name: t('content.hurricaneLamp'), foot: [1, 1], price: 140, dir: 'decor', where: 'any', on: 'top', light: 0.64 },
  { id: 'decor_farm_sign', name: t('content.farmSign'), foot: [1, 1], price: 100, dir: 'decor', where: 'any', on: 'floor' },
  { id: 'decor_boss_memorial', name: t('content.bossMemorial'), foot: [1, 1], price: 600, dir: 'decor', where: 'any', on: 'floor' },
  { id: 'decor_windmill_plaque', name: t('content.windmillPlaque'), foot: [1, 1], price: 480, dir: 'decor', where: 'in', on: 'wall' },
  { id: 'decor_harvest_trophy', name: t('content.harvestTrophy'), foot: [1, 1], price: 500, dir: 'decor', where: 'any', on: 'top' },
  { id: 'decor_signature_board', name: t('content.villagersSignatureBoard'), foot: [1, 1], price: 360, dir: 'decor', where: 'any', on: 'floor' },
  { id: 'decor_season_frame', name: t('content.fourSeasonsFrame'), foot: [1, 1], price: 420, dir: 'decor', where: 'in', on: 'wall' },
  { id: 'deco_fishing_trophy', name: t('content.fishTrophy'), foot: [1, 1], price: 0, dir: 'festival', where: 'any', on: 'floor' },
  { id: 'picnic_blanket', name: t('content.checkeredPicnicBlanket'), foot: [2, 2], price: 0, dir: 'festival', where: 'out', on: 'floor', flat: true },
  { id: 'deco_garden_lantern', name: t('content.gardenLantern'), foot: [1, 1], price: 0, dir: 'festival', where: 'any', on: 'floor', light: 1.14 },
  { id: 'deco_display_sign', name: t('content.displaySign'), foot: [1, 1], price: 0, dir: 'festival', where: 'any', on: 'floor' },
  { id: 'deco_flower_box', name: t('content.communityFlowerBox'), foot: [2, 1], price: 0, dir: 'festival', where: 'any', on: 'floor' },
  { id: 'deco_snow_house', name: t('content.woodenSnowCottage'), foot: [1, 1], price: 0, dir: 'festival', where: 'any', on: 'floor' },
  { id: 'deco_sled', name: t('content.woodenSled'), foot: [1, 2], price: 0, dir: 'festival', where: 'out', on: 'floor' },
  { id: 'deco_blanket_chair', name: t('content.blanketChair'), foot: [1, 1], price: 0, dir: 'festival', where: 'any', on: 'floor' },
  { id: 'deco_friend_keepsake', name: t('content.friendshipKeepsake'), foot: [1, 1], price: 0, dir: 'festival', where: 'any', on: 'floor' },
]
export const DECOR_BY_ID: Record<string, DecorDef> = Object.fromEntries(DECORS.map((d) => [d.id, d]))
// 可以在上面摆小物件的家具：台面高度（米）
export const SURFACES: Record<string, number> = { table_dining: 0.76, cabinet_low: 0.8, nightstand: 0.62, table_coffee: 0.44, toy_chest: 0.71, decor_stone_plinth: 0.56 }
export const footOf = (k: string): [number, number] => DECOR_BY_ID[k]?.foot ?? [1, 1]
// 贴墙挂件：[背面到原点的距离, 离地高度]（只挂在北墙与西墙，镜头默认朝向时这两面墙是高墙）
export const WALL_MOUNT: Record<string, [number, number]> = {
  painting_wall: [0.05, 1.0], window_flower_box: [0.15, 0.95], decor_wall_lamp: [0.28, 1.05], decor_windmill_plaque: [0.09, 1.0], decor_season_frame: [0.09, 1.0],
}
export const WALL_SIDES: [number, number][] = [[0, -1], [-1, 0]]
// 商店：木工坊卖家具与户外摆设，杂货店卖盆栽与小灯；愿望、捐赠、节庆的纪念装饰不出售
export const DECOR_SHOPS: Record<string, string[]> = {
  carpenter: [...DECORS.filter((d) => d.dir === 'interior').map((d) => d.id), 'decor_bench_stone', 'decor_mailbox', 'decor_scarecrow', 'decor_stone_plinth', 'decor_path_light', 'decor_farm_sign'],
  general: ['decor_pot_cactus', 'decor_pot_fern', 'decor_pot_lavender', 'decor_pot_succulent', 'decor_pot_spider', 'decor_pot_lemon', 'decor_pot_rose', 'decor_pot_bamboo',
    'decor_paper_lantern', 'decor_oil_lamp', 'decor_hurricane_lamp', 'decor_wall_lamp'],
}
