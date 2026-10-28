// 衣柜（设计 §3.3：家中镜子免费换装）：建档时选的角色（体型、脸、发型、肤色）不变，镜子只换收集到的帽子、上衣、下装。
// 衣物拿到时先在背包里，放进衣柜后才能穿；收进衣柜的衣物不占背包，也不会再被卖掉或用掉。
import { ITEMS } from '../content/content.ts'
import { fail, ok, type R } from './actions.ts'
import type { GameState } from './state.ts'
import { t as tr } from './i18n.ts'

export type WearSlot = 'hat' | 'top' | 'bottom'
export const WEAR_SLOTS: WearSlot[] = ['hat', 'top', 'bottom']
export const SLOT_NAMES: Record<WearSlot, string> = { hat: tr('common.hat'), top: tr('common.top'), bottom: tr('common.bottoms') }
export const isWear = (id: string) => !!ITEMS[id]?.wear

export function storeWear(s: GameState, i: number): R {
  const sl = s.inv[i]
  if (!sl || !isWear(sl.id)) return fail()
  const w = (s.wardrobe ??= [])
  if (w.includes(sl.id)) return fail(tr('wardrobe.alreadyWardrobe', ITEMS[sl.id].name))
  w.push(sl.id)
  if (--sl.n <= 0) s.inv[i] = null
  return ok(tr('wardrobe.putWardrobe', ITEMS[sl.id].name))
}
export function putOn(s: GameState, slot: WearSlot, id: string): R {
  if (id && (!s.wardrobe?.includes(id) || ITEMS[id]?.wear !== slot)) return fail()
  const o = (s.outfit ??= {})
  if ((o[slot] ?? '') === id) return fail()
  if (id) o[slot] = id
  else delete o[slot]
  return ok(id ? tr('wardrobe.put', ITEMS[id].name) : tr('wardrobe.changedBackOriginal', SLOT_NAMES[slot]))
}
// 表现层用：当前穿着的三件（文件路径）
export const outfitFiles = (s: GameState) => Object.fromEntries(WEAR_SLOTS.filter((k) => s.outfit?.[k]).map((k) => [k, ITEMS[s.outfit![k]!].wearFile!])) as Partial<Record<WearSlot, string>>
