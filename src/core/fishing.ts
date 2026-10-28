// 钓鱼（设计 14.1 / 14.2）：瞄准合法水点 → 抛竿（耗 5 精力）→ 等待 → 鱼讯 2 秒内确认 → 控制条收鱼。
// 鱼种在咬钩时由遭遇序号确定，重载该遭遇不会重抽；鱼饵在咬钩时扣 1 份。
import { FISH, FISHING, ITEMS, type FishWeather } from '../content/content.ts'
import { energyCost, fail, noteFound, ok, spend, type R } from './actions.ts'
import { progress } from './quests.ts'
import { inCreek } from './regions.ts'
import { t as tr } from './i18n.ts'
import { addItem, count, level, rand, removeItem, room, season, tileAt, weather, type GameState } from './state.ts'

export type FishSpot = 'river' | 'stream' | 'wetland'
// 抛竿落点：沿朝向 2—5.5 米，必须落在水面上
export function castTarget(s: GameState, dx: number, dz: number, power: number): { x: number; z: number; spot: FishSpot } | string {
  const len = Math.hypot(dx, dz) || 1
  const dist = 2 + Math.min(1, Math.max(0, power)) * 3.5
  const x = s.x + (dx / len) * dist, z = s.z + (dz / len) * dist
  const tx = Math.floor(x), tz = Math.floor(z)
  const t = tileAt(s, tx, tz)
  if (!t || t.g !== 2) return tr('fishing.castWaterHoldAdjust')
  if (s.region === 'farm') return tr('fishing.noFishPond')
  if (s.region === 'wetland') return { x, z, spot: 'wetland' }
  if (s.region === 'deepforest') return { x, z, spot: 'stream' } // 林间小潭与山溪同类鱼
  if (s.region !== 'river') return tr('fishing.noFishCatch')
  return { x, z, spot: inCreek(tx, tz) ? 'stream' : 'river' }
}
export function castCheck(s: GameState): R {
  if (s.tools.rod < 0) return fail(tr('fishing.noFishingRodYet'))
  const c = energyCost(s, 'rod')
  if (s.energy < c) return fail(tr('common.notEnoughEnergy'))
  if (room(s.inv, 'fish_silverscale') < 1) return fail(tr('common.backpackFull'))
  return ok()
}
// 真正抛竿才扣精力；返回等待秒数（有鱼饵更快）
export function cast(s: GameState): number {
  spend(s, energyCost(s, 'rod'))
  const [a, b] = count(s.inv, 'bait') ? FISHING.baitWait : FISHING.wait
  return a + rand(s.seed, s.day, s.fishSeq, 41) * (b - a)
}

// 天气条件：any 任意 / clear 晴阴 / rain 雨（含雷雨）/ sun 晴 / grey 阴或雪
export function weatherOk(cond: FishWeather, w: number, se: number) {
  return cond === 'any' || (cond === 'clear' && w <= 1) || (cond === 'sun' && w === 0) || (cond === 'rain' && w >= 2 && se !== 3) || (cond === 'grey' && (w === 1 || (w >= 2 && se === 3)))
}
// 当前可钓到的鱼：季节、时段、天气与地点
export function fishHere(s: GameState, spot: FishSpot) {
  const w = weather(s.seed, s.day)
  const se = season(s.day)
  const list = FISH.filter((f) => f.seasons.includes(se) && s.min >= f.from && s.min < f.to && weatherOk(f.weather, w, se))
  const at = list.filter((f) => f.at === spot)
  return at.length ? at : list.filter((f) => f.at === 'river')
}
// 咬钩：确定鱼种并扣鱼饵
export function bite(s: GameState, spot: FishSpot): string | null {
  const list = fishHere(s, spot)
  s.fishSeq++
  if (!list.length) return null
  const weights = list.map((f) => 1 / f.diff)
  let r = rand(s.seed, s.fishSeq, 43) * weights.reduce((a, b) => a + b, 0)
  const f = list.find((_, i) => (r -= weights[i]) < 0) ?? list[0]
  if (count(s.inv, 'bait')) removeItem(s.inv, 'bait', 1)
  return f.id
}

// ---------- 控制阶段：横向鱼道，按住使稳定区右移、放开缓慢左移 ----------
export interface Reel { fish: string; diff: number; pos: number; target: number; speed: number; zone: number; zoneV: number; zoneW: number; prog: number; t: number; next: number; k: number; seed: number }
export function reelStart(s: GameState, fish: string, assist = false): Reel {
  const diff = FISH.find((f) => f.id === fish)?.diff ?? 1
  const zoneW = assist ? 0.55 : Math.min(FISHING.zoneMax, FISHING.zone + FISHING.zonePerLevel * level(s.xp.fishing))
  return { fish, diff, pos: 0.5, target: 0.5, speed: 0.25, zone: 0.4, zoneV: 0, zoneW, prog: FISHING.start, t: 0, next: 0.6, k: 0, seed: s.seed + s.fishSeq * 131 }
}
// 鱼的动作可预判：平稳巡游 + 冲刺 + 回摆，节奏随难度加快；不随机闪现
function nextMove(r: Reel) {
  const R = (n: number) => rand(r.seed, r.k, n)
  r.k++
  const dash = R(1) < 0.25 + r.diff * 0.15
  const back = !dash && R(2) < r.diff * 0.12
  const span = dash ? 0.25 + R(3) * 0.35 : 0.1 + R(4) * 0.2
  const dir = back ? Math.sign(r.pos - r.target) || 1 : R(5) < 0.5 ? -1 : 1
  r.target = Math.min(0.95, Math.max(0.05, r.pos + dir * span))
  r.speed = dash ? 0.55 + r.diff * 0.15 : 0.16 + r.diff * 0.06
  r.next = r.t + (dash ? 0.45 : 0.9 + R(6) * (1.6 - r.diff * 0.3))
}
export function reelStep(r: Reel, dt: number, hold: boolean): 'win' | 'lose' | null {
  r.t += dt
  if (r.t >= r.next) nextMove(r)
  const d = r.target - r.pos
  r.pos += Math.sign(d) * Math.min(Math.abs(d), r.speed * dt)
  r.zoneV = Math.max(-0.9, Math.min(0.9, r.zoneV + (hold ? 2.4 : -1.6) * dt))
  r.zone += r.zoneV * dt
  const half = r.zoneW / 2
  if (r.zone < half) { r.zone = half; r.zoneV = Math.max(0, r.zoneV) * 0.3 }
  if (r.zone > 1 - half) { r.zone = 1 - half; r.zoneV = Math.min(0, r.zoneV) * 0.3 }
  const inside = Math.abs(r.pos - r.zone) <= half
  r.prog = Math.min(1, Math.max(0, r.prog + (inside ? FISHING.gain : -FISHING.loss) * dt))
  return r.prog >= 1 ? 'win' : r.prog <= 0 ? 'lose' : null
}
export const reelInside = (r: Reel) => Math.abs(r.pos - r.zone) <= r.zoneW / 2

export function landFish(s: GameState, fish: string): R {
  if (!addItem(s.inv, fish, 0, 1)) return fail(tr('fishing.backpackFullFishSlipped'))
  noteFound(s, fish)
  const diff = FISH.find((f) => f.id === fish)?.diff ?? 1
  s.xp.fishing += Math.max(4, diff * 4) // 16.1 钓鱼经验：难度×4，最低 4
  progress(s, { type: 'fish', fish, item: fish, n: 1, tags: ITEMS[fish]?.tags, region: s.region })
  return ok(tr('fishing.caught', ITEMS[fish].name))
}
