// 战斗（设计 15.2 / 15.4 / 15.5）：12 种敌人、3 个首领、弹体与地面危险区、短剑/长柄/轻弓、防具与负面状态。
// 敌人是矿洞楼层的运行时实体：同一天击败的不再出现（记入 wild）；首领首次击败永久记录。
// 判定只用逻辑位置与时间轴，不依赖渲染帧率；每次出手（attackId）对同一敌人最多命中一次。
import { BOSS_FIRST, BOW_CHARGE, COMBAT, DIFFICULTY, FOES, ITEMS, STATUS, WEAPON_KINDS, type FoeKind } from '../content/content.ts'
import { addStatus, armorDef, buffOf } from './climate.ts'
import { applyUnlock, progress } from './quests.ts'
import { mineFloor } from './regions.ts'
import { addItem, level, markTaken, rand, solid, takenToday, takeWild, tileAt, type GameState } from './state.ts'

export type FoeState = 'idle' | 'chase' | 'crouch' | 'pounce' | 'recover' | 'telegraph' | 'charge' | 'stun' | 'hurt' | 'dead'
  | 'guard' | 'open' | 'attack' | 'telegraph2' | 'attack2' | 'swoop' | 'roar' | 'vent' | 'tired' | 'summon'
export interface Foe {
  idx: number; k: FoeKind; x: number; z: number; hp: number; max: number; st: FoeState; t: number; face: number
  vx: number; vz: number; hx: number; hz: number; dirX: number; dirZ: number; hitBy: number
  cyc: number // 首领出招轮次 / 掠过次数
  struck: boolean // 本次攻击是否已结算
}
export interface Fighter {
  swing: number; dur: number; combo: number; queued: boolean; atkId: number; impact: number; struck: boolean; since: number
  roll: number; rollCd: number; rdx: number; rdz: number; invuln: number; draw: number // 轻弓蓄力秒数（-1 未在拉弓）
}
export const newFighter = (): Fighter => ({ swing: 0, dur: 0, combo: 0, queued: false, atkId: 0, impact: 0, struck: false, since: 9, roll: 0, rollCd: 0, rdx: 0, rdz: 1, invuln: 0, draw: -1 })
// 弹体与地面危险区（预警圈）：delay 期间只显示轮廓，到时才生效
export interface Shot { x: number; z: number; vx: number; vz: number; t: number; dmg: number; k: 'crystal' | 'spore' | 'arrow'; foe: boolean; atkId: number }
export interface Zone { x: number; z: number; r: number; delay: number; life: number; dmg: number; k: 'rock' | 'heat' | 'spike' | 'frost' | 'spore' | 'shock' | 'slam'; tick: number; dir?: [number, number, number]; status?: 'poison' | 'slow'; hit?: boolean }
export interface Arena { shots: Shot[]; zones: Zone[] }
export const newArena = (): Arena => ({ shots: [], zones: [] })
export type CombatEvent = { k: 'hurt'; dmg: number; status?: string } | { k: 'hit'; foe: Foe; dmg: number; crit: boolean } | { k: 'die'; foe: Foe } | { k: 'state'; foe: Foe }
  | { k: 'swing'; combo: number } | { k: 'shoot'; arrow: boolean } | { k: 'drop'; id: string; n: number; x: number; z: number; parcel: boolean }
  | { k: 'boss'; foe: Foe; note: string } | { k: 'pillar'; x: number; z: number }

const R = 0.28 // 敌人碰撞半径
const def = (f: Foe) => FOES[f.k]
export function spawnFoes(s: GameState): Foe[] {
  if (s.region !== 'mine') return []
  const m = mineFloor(s.seed, s.day, s.floor)
  const taken = takenToday(s, 'mine:' + s.floor)
  return m.foes.map((f, idx) => ({
    idx, k: f.k, x: f.x, z: f.z, hp: FOES[f.k].hp, max: FOES[f.k].hp, st: 'idle' as FoeState, t: rand(s.seed, idx, 5) * 2, face: rand(s.seed, idx, 6) * 6.28,
    vx: 0, vz: 0, hx: f.x, hz: f.z, dirX: 0, dirZ: 1, hitBy: -1, cyc: 0, struck: false,
  })).filter((f) => !taken.includes(100000 + f.idx) && !(FOES[f.k].boss && s.bosses[s.floor]))
}

function blockedAt(s: GameState, x: number, z: number, r = R) {
  for (const [ox, oz] of [[-r, -r], [r, -r], [-r, r], [r, r]]) if (solid(s, Math.floor(x + ox), Math.floor(z + oz))) return true
  return false
}
// 返回是否撞到障碍；飞行敌人只被岩壁挡住
function moveFoe(s: GameState, f: Foe, dx: number, dz: number) {
  const r = def(f).boss ? 0.7 : R
  let hit = false
  if (!blockedAt(s, f.x + dx, f.z, r)) f.x += dx
  else hit = true
  if (!blockedAt(s, f.x, f.z + dz, r)) f.z += dz
  else hit = true
  return hit
}
function set(f: Foe, st: FoeState, t: number, ev: CombatEvent[]) {
  f.st = st
  f.t = t
  f.struck = false
  ev.push({ k: 'state', foe: f })
}
// 敌人当前防御：碎石蟹张壳与首领疲劳时防御为 0
const foeDef = (f: Foe) => (f.st === 'open' || f.st === 'pounce' || f.st === 'tired' ? 0 : def(f).def)

// 对玩家造成伤害：受击无敌期、翻滚中段无敌；防具减伤（15.2）
function hurtPlayer(s: GameState, ft: Fighter, atk: number, ev: CombatEvent[], status?: 'poison' | 'slow') {
  if (ft.invuln > 0 || rollSafe(ft) || s.hp <= 0) return false
  const dmg = Math.max(1, Math.round(atk * DIFFICULTY[s.diff].foeDmg) - armorDef(s))
  s.hp = Math.max(0, s.hp - dmg)
  ft.invuln = COMBAT.iframes
  if (status) addStatus(s, status)
  ev.push({ k: 'hurt', dmg, status: status ? STATUS[status].name : undefined })
  return true
}
// 扇形/圆形命中玩家
const inArc = (s: GameState, f: Foe, reach: number, half: number) => {
  const dx = s.x - f.x, dz = s.z - f.z
  const d = Math.hypot(dx, dz)
  if (d > reach) return false
  if (d < 0.4) return true
  const fx = Math.sin(f.face), fz = Math.cos(f.face)
  return (dx * fx + dz * fz) / d >= Math.cos(half)
}
const zone = (a: Arena, z: Zone) => a.zones.push(z)

// 敌人 AI；返回事件。arena 承载弹体与危险区
export function foeStep(s: GameState, foes: Foe[], ft: Fighter, dt: number, arena: Arena = newArena()): CombatEvent[] {
  const ev: CombatEvent[] = []
  for (const f of foes) {
    if (f.st === 'dead') { f.t -= dt; continue }
    const D = def(f)
    const dx = s.x - f.x, dz = s.z - f.z
    const dist = Math.hypot(dx, dz) || 1e-6
    f.t -= dt
    const toward = (sp: number) => {
      f.face = Math.atan2(dx, dz)
      moveFoe(s, f, (dx / dist) * sp * dt, (dz / dist) * sp * dt)
    }
    const away = (sp: number) => moveFoe(s, f, (-dx / dist) * sp * dt, (-dz / dist) * sp * dt)
    const lock = () => { f.dirX = dx / dist; f.dirZ = dz / dist; f.face = Math.atan2(dx, dz) }
    const backToChase = () => set(f, dist < D.sight * 1.8 ? 'chase' : 'idle', 0, ev)
    // 通用：游荡、受击、眩晕、恢复
    if (f.st === 'idle') {
      if (dist < D.sight) { set(f, 'chase', 0, ev); continue }
      if (!D.speed) continue
      const a = rand(f.idx, Math.floor(f.t * 0.5), 9) * 6.28
      const back = Math.hypot(f.hx - f.x, f.hz - f.z) > 2
      const ax = back ? f.hx - f.x : Math.sin(a), az = back ? f.hz - f.z : Math.cos(a)
      const l = Math.hypot(ax, az) || 1
      if (rand(f.idx, Math.floor(f.t), 10) < 0.5) { moveFoe(s, f, (ax / l) * 0.4 * dt, (az / l) * 0.4 * dt); f.face = Math.atan2(ax, az) }
      continue
    }
    if (f.st === 'hurt') { moveFoe(s, f, f.vx * dt, f.vz * dt); if (f.t <= 0) backToChase(); continue }
    if (f.st === 'recover' || f.st === 'stun') { if (f.t <= 0) backToChase(); continue }
    if (f.st === 'chase' && dist > D.sight * 1.8 && !D.boss) { set(f, 'idle', 0, ev); continue }

    switch (D.ai) {
      case 'pounce': // 苔团：蹲伏 0.6 秒再起跳
        if (f.st === 'chase') { if (dist < 2.4) { set(f, 'crouch', D.tele, ev); f.face = Math.atan2(dx, dz) } else toward(D.speed) }
        else if (f.st === 'crouch' && f.t <= 0) { lock(); set(f, 'pounce', 0.38, ev) }
        else if (f.st === 'pounce') { moveFoe(s, f, f.dirX * 5.5 * dt, f.dirZ * 5.5 * dt); if (f.t <= 0) set(f, 'recover', 0.9, ev) }
        break
      case 'charge': // 土甲虫、铁壳虫：刨地扬尘锁定方向，直线冲刺，撞墙眩晕
        if (f.st === 'chase') { if (dist < 5) { set(f, 'telegraph', D.tele, ev); lock() } else toward(D.speed) }
        else if (f.st === 'telegraph' && f.t <= 0) set(f, 'charge', 1.4, ev)
        else if (f.st === 'charge') {
          if (moveFoe(s, f, f.dirX * 6.5 * dt, f.dirZ * 6.5 * dt)) set(f, 'stun', 1.5, ev)
          else if (f.t <= 0) set(f, 'recover', 0.7, ev)
        }
        break
      case 'crab': // 碎石蟹：缩壳防御 → 张壳（防御 0）→ 扑击
        if (f.st === 'chase') { if (dist < 3) set(f, 'guard', 1.2, ev); else toward(D.speed) }
        else if (f.st === 'guard') { f.face = Math.atan2(dx, dz); if (f.t <= 0) set(f, 'open', D.tele, ev) }
        else if (f.st === 'open' && f.t <= 0) { lock(); set(f, 'pounce', 0.4, ev) }
        else if (f.st === 'pounce') { moveFoe(s, f, f.dirX * 5 * dt, f.dirZ * 5 * dt); if (f.t <= 0) set(f, 'recover', 1.0, ev) }
        break
      case 'swoop': // 穴翼兽、晶翼兽：鸣叫锁定方向后掠过；晶翼兽回头再掠一次（方向固定可读）
        if (f.st === 'chase') { if (dist < 6) { set(f, 'telegraph', D.tele, ev); lock(); f.cyc = 0 } else toward(D.speed) }
        else if (f.st === 'telegraph' && f.t <= 0) set(f, 'swoop', 0.75, ev)
        else if (f.st === 'swoop') {
          moveFoe(s, f, f.dirX * 7.5 * dt, f.dirZ * 7.5 * dt)
          if (f.t <= 0) {
            if (f.k === 'crystalwing' && f.cyc === 0) { f.cyc = 1; f.dirX = -f.dirX; f.dirZ = -f.dirZ; f.face = Math.atan2(f.dirX, f.dirZ); set(f, 'telegraph', 0.45, ev); f.st = 'telegraph' }
            else set(f, 'recover', 1.0, ev)
          }
        }
        break
      case 'combo': // 矿爪兽：两段挥爪，第二段前有独立预警
        if (f.st === 'chase') { if (dist < 1.6) set(f, 'telegraph', D.tele, ev); else toward(D.speed) }
        else if (f.st === 'telegraph') { f.face = Math.atan2(dx, dz); if (f.t <= 0) set(f, 'attack', 0.35, ev) }
        else if (f.st === 'attack') { if (!f.struck && f.t <= 0.2) { f.struck = true; if (inArc(s, f, 1.7, Math.PI / 3)) hurtPlayer(s, ft, D.atk, ev) } if (f.t <= 0) set(f, 'telegraph2', D.tele, ev) }
        else if (f.st === 'telegraph2') { f.face = Math.atan2(dx, dz); if (f.t <= 0) set(f, 'attack2', 0.35, ev) }
        else if (f.st === 'attack2') { if (!f.struck && f.t <= 0.2) { f.struck = true; if (inArc(s, f, 1.7, Math.PI / 3)) hurtPlayer(s, ft, D.atk, ev) } if (f.t <= 0) set(f, 'recover', 1.1, ev) }
        break
      case 'spore': // 萤粉蛾：保持距离，投下延迟 0.8 秒的毒粉圈
        if (f.st === 'chase') {
          if (dist < 2.5) away(D.speed)
          else if (dist > 4.5) toward(D.speed)
          else { set(f, 'telegraph', D.tele, ev); f.face = Math.atan2(dx, dz); zone(arena, { x: s.x, z: s.z, r: 1.2, delay: D.tele, life: 3, dmg: 0, k: 'spore', tick: 0, status: 'poison' }) }
        } else if (f.st === 'telegraph' && f.t <= 0) set(f, 'recover', 1.6, ev)
        break
      case 'smash': // 岩背兽：0.9 秒抬起前身后重砸，背后易击
        if (f.st === 'chase') { if (dist < 2) { set(f, 'telegraph', D.tele, ev); f.face = Math.atan2(dx, dz); zone(arena, { x: f.x + Math.sin(f.face) * 1.2, z: f.z + Math.cos(f.face) * 1.2, r: 1.5, delay: D.tele, life: 0.2, dmg: D.atk, k: 'slam', tick: 0 }) } else toward(D.speed) }
        else if (f.st === 'telegraph' && f.t <= 0) set(f, 'attack', 0.4, ev)
        else if (f.st === 'attack' && f.t <= 0) set(f, 'recover', 1.5, ev)
        break
      case 'shoot': // 晶刺虫：发光蓄力后三向射出慢速可见的晶刺
        if (f.st === 'chase') {
          if (dist < 3.5) away(D.speed)
          else if (dist > 6.5) toward(D.speed)
          else { set(f, 'telegraph', D.tele, ev); lock() }
        } else if (f.st === 'telegraph' && f.t <= 0) {
          for (const a of [-0.35, 0, 0.35]) {
            const c = Math.cos(a), sn = Math.sin(a)
            const vx = f.dirX * c - f.dirZ * sn, vz = f.dirX * sn + f.dirZ * c
            arena.shots.push({ x: f.x + vx * 0.5, z: f.z + vz * 0.5, vx: vx * 4.2, vz: vz * 4.2, t: 2.2, dmg: D.atk, k: 'crystal', foe: true, atkId: 0 })
          }
          set(f, 'attack', 0.4, ev)
        } else if (f.st === 'attack' && f.t <= 0) set(f, 'recover', 1.3, ev)
        break
      case 'frost': // 霜灵：先出现霜地轮廓，再释放减速冰环
        if (f.st === 'chase') {
          if (dist < 2.6) { set(f, 'telegraph', D.tele, ev); zone(arena, { x: f.x, z: f.z, r: 2.4, delay: D.tele, life: 0.25, dmg: D.atk, k: 'frost', tick: 0, status: 'slow' }) }
          else toward(D.speed)
        } else if (f.st === 'telegraph' && f.t <= 0) set(f, 'attack', 0.4, ev)
        else if (f.st === 'attack' && f.t <= 0) set(f, 'recover', 1.4, ev)
        break
      case 'shock': // 旧矿岩卫：地面扇区预警后锥形震波
        if (f.st === 'chase') {
          if (dist < 2.6) { set(f, 'telegraph', D.tele, ev); f.face = Math.atan2(dx, dz); zone(arena, { x: f.x, z: f.z, r: 3, delay: D.tele, life: 0.25, dmg: D.atk, k: 'shock', tick: 0, dir: [Math.sin(f.face), Math.cos(f.face), Math.PI / 4] }) }
          else toward(D.speed)
        } else if (f.st === 'telegraph' && f.t <= 0) set(f, 'attack', 0.5, ev)
        else if (f.st === 'attack' && f.t <= 0) set(f, 'recover', 1.6, ev)
        break
      case 'boss_gate': bossGate(s, f, ft, dt, arena, ev, dist, dx, dz); break
      case 'boss_furnace': bossFurnace(s, f, dt, arena, ev, dist, dx, dz); break
      case 'boss_crystal': bossCrystal(s, f, arena, ev, dist, dx, dz); break
    }
    // 接触伤害：只有扑击/冲刺/掠过动作造成伤害
    const touching = Math.hypot(s.x - f.x, s.z - f.z) < (D.boss ? 1.2 : 0.62)
    if (touching && (f.st === 'pounce' || f.st === 'charge' || f.st === 'swoop')) {
      if (hurtPlayer(s, ft, D.atk, ev) && f.st === 'charge' && !D.boss) set(f, 'recover', 0.7, ev)
    }
  }
  stepArena(s, arena, ft, foes, dt, ev)
  return ev
}

// ---------- 首领（15.5）：动作循环固定、预警时长不随阶段缩短 ----------
function bossGate(s: GameState, f: Foe, ft: Fighter, _dt: number, arena: Arena, ev: CombatEvent[], dist: number, dx: number, dz: number) {
  const D = def(f)
  const face = () => { f.face = Math.atan2(dx, dz) }
  if (f.st === 'chase') {
    if (dist < 2.4) { set(f, 'telegraph', D.tele, ev); face() }
    else { face(); moveFoe(s, f, (dx / dist) * D.speed * _dt, (dz / dist) * D.speed * _dt) }
  } else if (f.st === 'telegraph' && f.t <= 0) set(f, f.cyc % 2 ? 'attack2' : 'attack', 0.45, ev)
  else if (f.st === 'attack' || f.st === 'attack2') {
    if (!f.struck && f.t <= 0.25) { f.struck = true; if (inArc(s, f, 2.6, Math.PI * 0.55)) hurtPlayer(s, ft, D.atk, ev) }
    if (f.t > 0) return
    if (f.st === 'attack') { set(f, 'telegraph', D.tele, ev); face(); f.cyc++; return }
    // 两次前挥后一次落石：落点先标记 1.2 秒
    set(f, 'roar', 1.2, ev)
    f.cyc = 0
    for (let k = 0; k < 5; k++) {
      const a = rand(s.seed, s.day, f.idx, ft.atkId, k, 81) * 6.28
      const r = k === 0 ? 0 : 1.6 + rand(s.seed, s.day, k, 82) * 2.4
      zone(arena, { x: s.x + Math.sin(a) * r, z: s.z + Math.cos(a) * r, r: 0.95, delay: 1.2, life: 0.3, dmg: D.atk, k: 'rock', tick: 0 })
    }
  } else if (f.st === 'roar' && f.t <= 0) set(f, 'recover', 1.0, ev)
}
function bossFurnace(s: GameState, f: Foe, dt: number, arena: Arena, ev: CombatEvent[], dist: number, dx: number, dz: number) {
  const D = def(f)
  if (f.st === 'chase') {
    // 冲锋与散落热区交替；两轮之后进入疲劳，弱点暴露（受到伤害 ×1.5）
    if (f.cyc >= 4) { f.cyc = 0; set(f, 'tired', 3.2, ev); return }
    if (f.cyc % 2 === 1) {
      f.cyc++
      set(f, 'vent', 1.0, ev)
      // 热区避开两条贯穿场地中心的安全路线
      for (let k = 0; k < 6; k++) {
        const x = f.x + (rand(s.seed, s.day, f.cyc, k, 83) - 0.5) * 10
        const z = f.z + (rand(s.seed, s.day, f.cyc, k, 84) - 0.5) * 8
        if (Math.abs(x - 16) < 1.3 || Math.abs(z - 11) < 1.3) continue
        zone(arena, { x, z, r: 1.3, delay: 0.8, life: 4, dmg: Math.round(D.atk * 0.5), k: 'heat', tick: 0 })
      }
      return
    }
    set(f, 'telegraph', D.tele, ev)
    f.dirX = dx / dist; f.dirZ = dz / dist; f.face = Math.atan2(dx, dz)
  } else if (f.st === 'telegraph' && f.t <= 0) set(f, 'charge', 2.5, ev)
  else if (f.st === 'charge') {
    if (moveFoe(s, f, f.dirX * 6.8 * dt, f.dirZ * 6.8 * dt) || f.t <= 0) { f.cyc++; set(f, 'stun', 1.2, ev) }
  } else if ((f.st === 'vent' || f.st === 'tired') && f.t <= 0) set(f, 'chase', 0, ev)
}
function bossCrystal(s: GameState, f: Foe, arena: Arena, ev: CombatEvent[], dist: number, dx: number, dz: number) {
  const D = def(f)
  const phase = f.hp > f.max * 0.66 ? 0 : f.hp > f.max * 0.33 ? 1 : 2 // 三个血量阶段只增加组合
  f.face = Math.atan2(dx, dz)
  if (f.st === 'chase') {
    const move = f.cyc % 3
    f.cyc++
    if (move === 0 || dist < 3) {
      set(f, 'telegraph', D.tele, ev)
      zone(arena, { x: f.x, z: f.z, r: 3 + phase * 0.4, delay: D.tele, life: 0.3, dmg: D.atk, k: 'slam', tick: 0 })
    } else if (move === 1) {
      set(f, 'summon', 1.0, ev)
      for (let k = 0; k < 3 + phase; k++) {
        const a = rand(s.seed, s.day, f.cyc, k, 85) * 6.28, r = k === 0 ? 0 : 1.5 + rand(s.seed, s.day, f.cyc, k, 86) * 2
        zone(arena, { x: s.x + Math.sin(a) * r, z: s.z + Math.cos(a) * r, r: 0.9, delay: 1.0, life: 0.3, dmg: Math.round(D.atk * 0.8), k: 'spike', tick: 0 })
      }
    } else {
      set(f, 'attack', 0.8, ev)
      const n = 3 + phase * 2
      for (let k = 0; k < n; k++) {
        const a = f.face + (k - (n - 1) / 2) * 0.3
        arena.shots.push({ x: f.x + Math.sin(a) * 1.2, z: f.z + Math.cos(a) * 1.2, vx: Math.sin(a) * 4, vz: Math.cos(a) * 4, t: 3, dmg: Math.round(D.atk * 0.7), k: 'crystal', foe: true, atkId: 0 })
      }
    }
  } else if ((f.st === 'telegraph' || f.st === 'summon' || f.st === 'attack') && f.t <= 0) set(f, 'recover', 1.4 - phase * 0.2, ev)
}

// 弹体飞行、危险区生效
function stepArena(s: GameState, a: Arena, ft: Fighter, foes: Foe[], dt: number, ev: CombatEvent[]) {
  for (const sh of a.shots) {
    sh.t -= dt
    sh.x += sh.vx * dt
    sh.z += sh.vz * dt
    if (solid(s, Math.floor(sh.x), Math.floor(sh.z))) {
      sh.t = 0 // 晶柱、岩壁挡下弹体
      // 箭打中晶柱：首领房的晶柱也会被射碎
      continue
    }
    if (sh.foe) {
      if (Math.hypot(s.x - sh.x, s.z - sh.z) < 0.45 && hurtPlayer(s, ft, sh.dmg, ev)) sh.t = 0
    } else for (const f of foes) {
      if (f.st === 'dead' || f.hitBy === sh.atkId || Math.hypot(f.x - sh.x, f.z - sh.z) > (def(f).boss ? 1.1 : 0.55)) continue
      damageFoe(s, f, sh.dmg, sh.atkId, ev, sh.vx, sh.vz)
      sh.t = 0
      break
    }
  }
  a.shots = a.shots.filter((x) => x.t > 0)
  for (const z of a.zones) {
    z.delay -= dt
    if (z.delay > 0) continue
    z.life -= dt
    const inside = (() => {
      const dx = s.x - z.x, dz = s.z - z.z
      const d = Math.hypot(dx, dz)
      if (d > z.r) return false
      if (!z.dir || d < 0.4) return true
      return (dx * z.dir[0] + dz * z.dir[1]) / d >= Math.cos(z.dir[2])
    })()
    if (z.k === 'heat') {
      // 热区：每 0.5 秒结算一次
      z.tick -= dt
      if (inside && z.tick <= 0) { z.tick = 0.5; hurtPlayer(s, ft, z.dmg, ev) }
    } else if (!z.hit && inside) {
      z.hit = true
      if (z.dmg) hurtPlayer(s, ft, z.dmg, ev, z.status)
      else if (z.status && !rollSafe(ft)) { addStatus(s, z.status); ev.push({ k: 'hurt', dmg: 0, status: STATUS[z.status].name }) }
    }
  }
  a.zones = a.zones.filter((z) => z.delay > 0 || z.life > 0)
}

// 翻滚中段（第 0.10—0.25 秒）无敌（15.2）
export const rollSafe = (ft: Fighter) => ft.roll > 0 && COMBAT.roll - ft.roll >= 0.1 && COMBAT.roll - ft.roll <= 0.25

// ---------- 玩家武器：短剑三段连击；长柄慢而远；轻弓蓄力放箭 ----------
export function weaponAtk(s: GameState) {
  const sl = s.inv[s.sel]
  return sl ? ITEMS[sl.id].weapon ?? 0 : 0
}
export const weaponKind = (s: GameState) => (s.inv[s.sel] && ITEMS[s.inv[s.sel]!.id].wkind) || 'sword'
const comboDur = (s: GameState, i: number) => COMBAT.combo[i] / WEAPON_KINDS[weaponKind(s)].speed
export function attack(ft: Fighter, s?: GameState): CombatEvent[] {
  if (ft.roll > 0) return []
  if (ft.swing > 0) {
    if (ft.swing < ft.dur * 0.5 && ft.combo < 2) ft.queued = true
    return []
  }
  ft.combo = ft.since < 0.35 && ft.combo < 2 ? ft.combo + 1 : 0
  return startSwing(ft, s)
}
function startSwing(ft: Fighter, s?: GameState): CombatEvent[] {
  ft.dur = ft.swing = s ? comboDur(s, ft.combo) : COMBAT.combo[ft.combo]
  ft.impact = ft.dur * 0.6 // 剩余时间降到此值时判定
  ft.struck = false
  ft.atkId++
  ft.queued = false
  return [{ k: 'swing', combo: ft.combo }]
}
// 轻弓：按住拉弓，满 0.7 秒松开放箭（练习箭无限）
export function drawBow(ft: Fighter) {
  if (ft.roll > 0 || ft.swing > 0) return
  if (ft.draw < 0) ft.draw = 0
}
export function releaseBow(s: GameState, ft: Fighter, arena: Arena): CombatEvent[] {
  const ready = ft.draw >= BOW_CHARGE
  ft.draw = -1
  if (!ready) return []
  ft.atkId++
  const atk = playerAtk(s)
  arena.shots.push({ x: s.x + Math.sin(s.face) * 0.5, z: s.z + Math.cos(s.face) * 0.5, vx: Math.sin(s.face) * 14, vz: Math.cos(s.face) * 14, t: WEAPON_KINDS.bow.reach / 14, dmg: atk, k: 'arrow', foe: false, atkId: ft.atkId })
  ft.swing = ft.dur = 0.3
  ft.struck = true
  return [{ k: 'shoot', arrow: true }]
}
const playerAtk = (s: GameState) => (weaponAtk(s) || 8) * (1 + (buffOf(s, 'damage')?.v ?? 0))

export function fighterStep(s: GameState, ft: Fighter, foes: Foe[], dt: number): CombatEvent[] {
  const ev: CombatEvent[] = []
  ft.invuln = Math.max(0, ft.invuln - dt)
  ft.rollCd = Math.max(0, ft.rollCd - dt)
  if (ft.draw >= 0) ft.draw += dt
  if (ft.roll > 0) {
    ft.roll -= dt
    const sp = 7 * dt
    const nx = s.x + ft.rdx * sp, nz = s.z + ft.rdz * sp
    if (!blockedAt(s, nx, s.z)) s.x = nx
    if (!blockedAt(s, s.x, nz)) s.z = nz
  }
  if (ft.swing > 0) {
    ft.swing -= dt
    if (!ft.struck && ft.swing <= ft.impact) {
      ft.struck = true
      ev.push(...strike(s, ft, foes))
    }
    if (ft.swing <= 0) {
      ft.since = 0
      if (ft.queued) { ft.combo++; ev.push(...startSwing(ft, s)) }
    }
  } else ft.since += dt
  return ev
}
function strike(s: GameState, ft: Fighter, foes: Foe[]): CombatEvent[] {
  const ev: CombatEvent[] = []
  const wk = WEAPON_KINDS[weaponKind(s)]
  const reach = wk.reach === 6 ? 1.5 : wk.reach
  const arc = wk.arc || COMBAT.arc
  const fx = Math.sin(s.face), fz = Math.cos(s.face)
  for (const f of foes) {
    if (f.st === 'dead' || f.hitBy === ft.atkId) continue
    const dx = f.x - s.x, dz = f.z - s.z
    const d = Math.hypot(dx, dz)
    const big = def(f).boss ? 0.9 : R
    if (d > reach + big) continue
    if (d > 0.3 && (dx * fx + dz * fz) / d < Math.cos(arc / 2)) continue
    damageFoe(s, f, playerAtk(s), ft.atkId, ev, dx, dz)
  }
  // 首领房的晶柱：挥砍三下打碎，首领短暂僵直（15.5 摧毁晶柱产生短暂安全窗口）
  const px = Math.floor(s.x + fx * 1.1), pz = Math.floor(s.z + fz * 1.1)
  const t = s.region === 'mine' ? tileAt(s, px, pz) : null
  if (t?.ob?.k === 'pillar') {
    if (++t.ob.dmg >= 3) {
      t.ob = null
      takeWild(s, px, pz)
      stunBoss(foes, ev)
    }
    ev.push({ k: 'pillar', x: px, z: pz })
  }
  return ev
}
// 伤害结算（15.2）：max(1, round(攻击 × (1+0.015×战斗等级) × 暴击)) − 防御；岩背兽背后 ×1.5、首领疲劳 ×1.5
function damageFoe(s: GameState, f: Foe, atk: number, atkId: number, ev: CombatEvent[], dx: number, dz: number) {
  f.hitBy = atkId
  const D = def(f)
  const crit = rand(s.seed, s.day, atkId, f.idx, 51) < COMBAT.crit
  let mult = (1 + 0.015 * level(s.xp.combat)) * (crit ? COMBAT.critMult : 1)
  if (f.k === 'rockback' && (Math.sin(f.face) * dx + Math.cos(f.face) * dz) > 0) mult *= 1.5 // 从背后打
  if (f.st === 'tired') mult *= 1.5
  const dmg = Math.max(1, Math.round(atk * mult) - foeDef(f))
  f.hp -= dmg
  ev.push({ k: 'hit', foe: f, dmg, crit })
  if (f.hp <= 0) return kill(s, f, ev)
  // 击退并打断蓄力（冲刺、掠过中的敌人与首领不被打断）
  if (!D.boss && f.st !== 'charge' && f.st !== 'swoop' && f.st !== 'guard') {
    const l = Math.hypot(dx, dz) || 1
    f.vx = (dx / l) * 5
    f.vz = (dz / l) * 5
    set(f, 'hurt', 0.18, ev)
  }
}
function kill(s: GameState, f: Foe, ev: CombatEvent[]) {
  const D = def(f)
  set(f, 'dead', D.boss ? 1.6 : 0.9, ev)
  ev.push({ k: 'die', foe: f })
  markTaken(s, 'mine:' + s.floor, 100000 + f.idx)
  progress(s, { type: 'kill', enemy: f.k, n: 1 })
  const first = D.boss && !s.bosses[s.floor] && !s.flags.includes('boss:' + f.k)
  if (D.boss) s.bosses[s.floor] = s.day
  // 首领只有首次给奖励与经验；重复挑战只给一般材料（15.5）
  if (!D.boss || first) s.xp.combat += D.xp
  const drops: [string, number, number][] = D.boss ? (first ? BOSS_FIRST[f.k].items.map(([id, n]) => [id, n, 1] as [string, number, number]) : [['stone', 5, 1]]) : D.drops
  drops.forEach(([id, n, p], k) => {
    if (k > 0 && rand(s.seed, s.day, s.floor, f.idx, k, 52) >= p) return
    // 掉落与击败记录同一事务直接入包，背包满则进矿口失物箱（11.3），不会因转场丢失
    const parcel = !addItem(s.inv, id, 0, n)
    if (parcel) addItem(s.parcel, id, 0, n) || s.parcel.push({ id, q: 0, n })
    s.found[id] ??= s.day
    ev.push({ k: 'drop', id, n, x: f.x + (k - 0.5) * 0.35, z: f.z + 0.2 * k, parcel })
  })
  if (first) {
    s.flags.push('boss:' + f.k)
    for (const u of BOSS_FIRST[f.k].unlock) applyUnlock(s, u)
    progress(s, { type: 'event', id: 'boss:' + f.k })
    ev.push({ k: 'boss', foe: f, note: BOSS_FIRST[f.k].note })
  }
}
// 首领房晶柱被打碎：首领短暂僵直
export function stunBoss(foes: Foe[], ev: CombatEvent[]) {
  for (const f of foes) if (def(f).boss && f.st !== 'dead') set(f, 'stun', 2, ev)
}

// 翻滚 0.35 秒，中段 0.15 秒无敌，冷却 1.2 秒，耗 4 精力（精力不足仍可走路脱离）
export function roll(s: GameState, ft: Fighter, dx: number, dz: number): boolean {
  if (ft.roll > 0 || ft.rollCd > 0 || ft.swing > 0 || s.energy < COMBAT.rollEnergy) return false
  const l = Math.hypot(dx, dz)
  ft.rdx = l ? dx / l : Math.sin(s.face)
  ft.rdz = l ? dz / l : Math.cos(s.face)
  ft.roll = COMBAT.roll
  ft.rollCd = COMBAT.rollCd
  ft.draw = -1
  s.energy = Math.round((s.energy - COMBAT.rollEnergy) * 10) / 10
  s.face = Math.atan2(ft.rdx, ft.rdz)
  return true
}
