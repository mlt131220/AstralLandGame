// 长期愿望（Q24）：在家中书桌登记一个“现在最想做的事”，随时可改；所有愿望的目标都实时可见、可并行完成，达成一级就能领对应装饰
import { CROPS, ITEMS } from '../content/content.ts'
import { fail, ok, tx, type R } from './actions.ts'
import { t as tr } from './i18n.ts'
import { refreshQuests } from './quests.ts'
import { addItem, type GameState } from './state.ts'

// ---------- 六个愿望 × 3 级可见目标（设计 §19.4）；奖励是对应的纪念装饰 ----------
const n = (s: GameState, tag: string) => Object.keys(s.found).filter((id) => ITEMS[id]?.tags?.includes(tag)).length
const placed = (s: GameState) => s.ents.length + Object.values(s.rooms ?? {}).reduce((a, l) => a + l.length, 0)
const bestTool = (s: GameState) => Math.max(...Object.values(s.tools).map((t) => t ?? 0))
const friendsAt = (s: GameState, pts: number) => Object.values(s.friends).filter((f) => f.pts >= pts).length
export interface WishTier { text: string; prog: (s: GameState) => [number, number]; reward: string }
export interface WishDef { id: string; name: string; blurb: string; tiers: WishTier[] }
const DAIRY_GOODS = ['egg', 'duck_egg', 'rabbit_fur', 'milk', 'goat_milk', 'wool', 'cheese_cow', 'cheese_goat', 'cloth']
const crops = (s: GameState) => Object.keys(CROPS).filter((id) => s.found[id]).length
export const WISHES: WishDef[] = [
  { id: 'garden', name: tr('wishes.gardenFarmstead'), blurb: tr('wishes.keepFieldsFullColor'), tiers: [
    { text: tr('wishes.harvest10DifferentCrops'), prog: (s) => [crops(s), 10], reward: 'decor_pot_sunflower' },
    { text: tr('wishes.harvest20DifferentCrops'), prog: (s) => [crops(s), 20], reward: 'decor_flower_arch' },
    { text: tr('wishes.harvest28DifferentCrops'), prog: (s) => [crops(s), 28], reward: 'decor_gazebo' },
  ] },
  { id: 'dairy', name: tr('wishes.dairyWorkshop'), blurb: tr('wishes.earlyMorningsBarnWarm'), tiers: [
    { text: tr('wishes.raise2Animals'), prog: (s) => [s.animals.filter((a) => !a.lent).length, 2], reward: 'decor_wheelbarrow' },
    { text: tr('wishes.raise6Animals'), prog: (s) => [s.animals.filter((a) => !a.lent).length, 6], reward: 'decor_weathervane' },
    { text: tr('wishes.collect8KindsAnimal'), prog: (s) => [DAIRY_GOODS.filter((id) => s.found[id]).length, 8], reward: 'decor_well' },
  ] },
  { id: 'river', name: tr('wishes.riverRecorder'), blurb: tr('wishes.rememberEveryFishSwum'), tiers: [
    { text: tr('wishes.catch8KindsFish'), prog: (s) => [n(s, 'fish'), 8], reward: 'decor_birdbath' },
    { text: tr('wishes.catch16KindsFish'), prog: (s) => [n(s, 'fish'), 16], reward: 'decor_stone_lantern' },
    { text: tr('wishes.catch24KindsFish'), prog: (s) => [n(s, 'fish'), 24], reward: 'decor_fountain' },
  ] },
  { id: 'craft', name: tr('wishes.mountainArtisan'), blurb: tr('wishes.makeThingsEverydayLife'), tiers: [
    { text: tr('wishes.place15ItemsFarm'), prog: (s) => [placed(s), 15], reward: 'decor_bench_wood' },
    { text: tr('wishes.upgradeToolIron'), prog: (s) => [Math.min(bestTool(s), 2), 2], reward: 'decor_star_lights' },
    { text: tr('wishes.place50ItemsOwn'), prog: (s) => [Math.min(placed(s), 50) + (bestTool(s) >= 3 ? 1 : 0), 51], reward: 'decor_boss_memorial' },
  ] },
  { id: 'friends', name: tr('wishes.valleyFriend'), blurb: tr('wishes.shareMealsChatsHelping'), tiers: [
    { text: tr('wishes.reach400Friendship4'), prog: (s) => [friendsAt(s, 400), 4], reward: 'decor_signature_board' },
    { text: tr('wishes.reach600Friendship8'), prog: (s) => [friendsAt(s, 600), 8], reward: 'decor_swing' },
    { text: tr('wishes.reach800Friendship12'), prog: (s) => [friendsAt(s, 800), 12], reward: 'decor_season_frame' },
  ] },
  { id: 'collector', name: tr('wishes.fullCollection'), blurb: tr('wishes.fillArchivesDisplayCases'), tiers: [
    { text: tr('wishes.donate15ItemsArchive'), prog: (s) => [Object.keys(s.donated ?? {}).length, 15], reward: 'decor_sundial' },
    { text: tr('wishes.donate45ItemsArchive'), prog: (s) => [Object.keys(s.donated ?? {}).length, 45], reward: 'decor_fluorite_lamp' },
    { text: tr('wishes.donate90ItemsArchive'), prog: (s) => [Object.keys(s.donated ?? {}).length, 90], reward: 'decor_harvest_trophy' },
  ] },
]

export const wishOf = (s: GameState) => s.flags.find((f) => f.startsWith('wish:'))?.slice(5) ?? ''
export const tierDone = (s: GameState, id: string, k: number) => { const [a, b] = WISHES.find((w) => w.id === id)!.tiers[k].prog(s); return a >= b }
export const tierClaimed = (s: GameState, id: string, k: number) => s.flags.includes(`wishTier:${id}:${k}`)
export function chooseWish(s: GameState, id: string): R {
  const w = WISHES.find((x) => x.id === id)
  if (!w) return fail()
  if (wishOf(s) === id) return fail(tr('wishes.alreadyWish', w.name))
  s.flags = s.flags.filter((f) => !f.startsWith('wish:'))
  s.flags.push('wish:' + id)
  refreshQuests(s)
  return ok(tr('wishes.wroteWishBook', w.name))
}
export function claimTier(s: GameState, id: string, k: number): R {
  const t = WISHES.find((x) => x.id === id)?.tiers[k]
  if (!t || tierClaimed(s, id, k)) return fail()
  if (!tierDone(s, id, k)) return fail(tr('wishes.notReachedYet'))
  const gift = ITEMS[t.reward] ? t.reward : ''
  if (gift && !tx(s, (inv) => addItem(inv, gift, 0, 1))) return fail(tr('common.backpackFull'))
  s.flags.push(`wishTier:${id}:${k}`)
  return ok(gift ? tr('wishes.goalReachedReceived', t.text, ITEMS[gift].name) : tr('wishes.goalReached', t.text))
}
