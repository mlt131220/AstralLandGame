// 图鉴与捐赠（设计 19.3）：图鉴记录首次获得，不消耗物品；捐赠在档案馆另行确认，每种交出 1 件实物陈列。两者进度分开。
import { CROPS, ITEMS } from '../content/content.ts'
import { fail, ok, tx, type R } from './actions.ts'
import { progress } from './quests.ts'
import { addItem, count, removeItem, type GameState } from './state.ts'
import { t as tr } from './i18n.ts'

const tagged = (t: string) => Object.values(ITEMS).filter((i) => i.tags?.includes(t)).map((i) => i.id)
export const CATS: { name: string; ids: () => string[] }[] = [
  { name: tr('collection.crops'), ids: () => Object.keys(CROPS) },
  { name: tr('collection.fish'), ids: () => tagged('fish') },
  { name: tr('collection.forage'), ids: () => tagged('forage') },
  { name: tr('collection.mineralsMaterials'), ids: () => ['wood', 'hardwood', 'stone', 'fiber', 'clay', 'resin', 'bugmeat', 'hay', 'bait', 'coal', 'copper_ore', 'iron_ore', 'crystal_ore', 'copper_bar', 'iron_bar', 'alloy_bar', 'hide_scrap'] },
  { name: tr('collection.dishes'), ids: () => ['soup_relief', 'dried_food', ...tagged('cooked')] },
  { name: tr('collection.artisanAnimalGoods'), ids: () => Object.values(ITEMS).filter((i) => (i.tags?.includes('artisan') || i.tags?.includes('animal')) && !i.tags.includes('cooked')).map((i) => i.id) },
  { name: tr('collection.treeFruitShellfish'), ids: () => [...tagged('treefruit'), 'crayfish', 'river_snail'] },
]
export const catIds = (i: number) => [...new Set(CATS[i].ids())].filter((id) => ITEMS[id])
let all: Set<string> | null = null
export const donatable = (id: string) => (all ??= new Set(CATS.flatMap((_, i) => catIds(i)))).has(id)
export const donatedCount = (s: GameState) => Object.keys(s.donated ?? {}).length

// 捐赠里程碑：累计件数 → 档案馆回赠的装饰（收藏奖励以装饰为主）
export const DONATE_REWARDS: [number, string][] = [[5, 'decor_pot_orchid'], [15, 'decor_mushroom_lamp'], [25, 'wear_bottom_corduroy'], [30, 'decor_candelabra'], [50, 'decor_pot_pine'], [80, 'decor_pot_olive']]
export const nextReward = (s: GameState) => DONATE_REWARDS.find(([n, id]) => n > donatedCount(s) && ITEMS[id])

export function donate(s: GameState, id: string): R {
  if (!donatable(id)) return fail(tr('collection.archiveDoesntTake'))
  if (s.donated?.[id]) return fail(tr('collection.alreadyBeenDonated', ITEMS[id].name))
  if (!count(s.inv, id)) return fail(tr('collection.notBackpack'))
  const n = donatedCount(s) + 1
  const gift = DONATE_REWARDS.find(([k, r]) => k === n && ITEMS[r])?.[1]
  if (!tx(s, (inv) => removeItem(inv, id, 1) && (!gift || addItem(inv, gift, 0, 1)))) return fail(tr('collection.backpackFullFreeSlot'))
  ;(s.donated ??= {})[id] = s.day
  progress(s, { type: 'interact', target: 'donate' })
  return ok(tr('collection.donatedDisplay', ITEMS[id].name, n, gift ? tr('collection.wenHengsThankGift', ITEMS[gift].name) : ''))
}
