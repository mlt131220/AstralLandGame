// 区域转场（设计 8.1）与矿洞上下（15.1）。转场后由表现层重建场景，并在安全时点存档。
import { isBossFloor, isRestFloor, MINE_FLOORS, MINE_THEMES, mineTheme } from '../content/content.ts'
import { fail, ok, type R } from './actions.ts'
import { progress, unlocked } from './quests.ts'
import { MINE_DOOR, mineFloor } from './regions.ts'
import { addItem, regionOf, type Exit, type GameState, type RegionId } from './state.ts'
import { t as tr } from './i18n.ts'

export function moveTo(s: GameState, to: RegionId, x: number, z: number, floor = 0) {
  s.region = to
  s.floor = to === 'mine' ? floor : 0
  s.x = x
  s.z = z
  progress(s, { type: 'visit', region: to })
}
// 走到出口格时转场
// 出口所在的地图边（室外区域）：往外的方向；室内门和地图里面的出口返回 null
export function edgeDir(s: GameState, e: Exit): [number, number] | null {
  const r = regionOf(s)
  if (r.indoor) return null
  if (e.x1 <= 0) return [-1, 0]
  if (e.x0 >= r.w - 1) return [1, 0]
  if (e.z1 <= 0) return [0, -1]
  if (e.z0 >= r.h - 1) return [0, 1]
  return null
}
export const EXIT_WALK = 3 // 边缘出口外还能沿路走的格数
export const EXIT_FAR = 1.6 // 走出地图边缘这么远才换地图（路走到尽头再转场）
// 地图外某格是否在某个边缘出口的延伸通道上
export function corridorAt(s: GameState, tx: number, tz: number): Exit | null {
  const r = regionOf(s)
  for (const e of r.exits) {
    const d = edgeDir(s, e)
    if (!d) continue
    const along = d[0] ? tz >= e.z0 && tz <= e.z1 : tx >= e.x0 && tx <= e.x1
    const out = d[0] < 0 ? -tx : d[0] > 0 ? tx - r.w + 1 : d[1] < 0 ? -tz : tz - r.h + 1
    if (along && out >= 1 && out <= EXIT_WALK) return e
  }
  return null
}
// 玩家触发的出口：门、梯子等地图内出口踩上去就走；边缘出口要走出边缘 EXIT_FAR 才走
export function exitAt(s: GameState) {
  const r = regionOf(s)
  const tx = Math.floor(s.x), tz = Math.floor(s.z)
  const inner = r.exits.find((e) => !edgeDir(s, e) && tx >= e.x0 && tx <= e.x1 && tz >= e.z0 && tz <= e.z1)
  if (inner) return inner
  const far = Math.max(-s.x, s.x - r.w, -s.z, s.z - r.h)
  return far >= EXIT_FAR ? corridorAt(s, tx, tz) : null
}

// 矿口：Q08 安全课后开放；升降梯停靠到过的休息层（5/15/25）与已击败首领的 10/20/30 层（15.1）
export function mineOpen(s: GameState) {
  return unlocked(s, 'region:mine')
}
export const liftStops = (s: GameState) => [1, ...[5, 10, 15, 20, 25, 30].filter((f) => f <= s.deepest && (!isBossFloor(f) || !!s.bosses[f]))]
export function enterMine(s: GameState, floor: number): R {
  if (!mineOpen(s)) return fail(tr('common.mineEntranceSealedNow'))
  if (!liftStops(s).includes(floor)) return fail(tr('travel.elevatorOnlyGoesStops'))
  if (s.min >= 1500) return fail(tr('travel.tooLateHeadMines'))
  goFloor(s, floor)
  return ok(tr('common.minesFloor', floor, MINE_THEMES[mineTheme(floor)].name))
}
function goFloor(s: GameState, floor: number) {
  const m = mineFloor(s.seed, s.day, floor)
  moveTo(s, 'mine', m.spawn[0], m.spawn[1], floor)
  s.deepest = Math.max(s.deepest, floor)
}
export function ladderDown(s: GameState): R {
  if (s.region !== 'mine' || s.floor >= MINE_FLOORS) return fail(tr('travel.alreadyDeepestFloor'))
  if (isBossFloor(s.floor) && !s.bosses[s.floor]) return fail(tr('travel.defeatFloorsBossFirst'))
  goFloor(s, s.floor + 1)
  const f = s.floor
  return ok(isRestFloor(f) ? tr('travel.floorRestStopNo', f)
    : isBossFloor(f) ? tr('travel.floorBossRoomDodge', f) : f % 10 === 1 ? tr('travel.floorEntering', f, MINE_THEMES[mineTheme(f)].name) : tr('travel.minesFloor', f))
}
// 矿口失物箱：背包满时的掉落在这里领回（能放多少放多少）
export function claimParcel(s: GameState): R {
  if (!s.parcel.length) return fail(tr('travel.lostFoundBoxEmpty'))
  let got = 0
  s.parcel = s.parcel.filter((sl) => {
    if (!addItem(s.inv, sl.id, sl.q, sl.n)) return true
    got += sl.n
    return false
  })
  return got ? ok(tr('travel.tookLostFound', got, s.parcel.length ? tr('travel.backpackFullRestStill') : '')) : fail(tr('common.backpackFull'))
}
export function leaveMine(s: GameState): R {
  moveTo(s, 'mountain', MINE_DOOR[0] + 0.5, MINE_DOOR[1] + 0.3)
  return ok(tr('travel.backSurface'))
}
