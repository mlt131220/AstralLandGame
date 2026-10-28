// 启动壳与主循环：组装领域、表现、输入与存档（设计 24.3 web-app 层）。
import { reactive, watch } from 'vue'
import { festDef, ANIMALS, BUILDINGS, COMBAT, FISHING, FOES, ITEMS, OBSTACLES, REACH, SKILL_NAMES, SKILLS, type BuildKind, type ShopId, type ToolId } from './content/content.ts'
import { moveBuilding, orderBuilding, placeProblem } from './core/buildings.ts'
import { entAction } from './core/actions.ts'
import { unlocked as isUnlocked, applyUnlock } from './core/quests.ts'
import { NPC_DEFS, QUEST_DEFS, seasonLines } from './content/story.ts'
import {
  chargeArea, describe, eat, interactTarget, INTERACTIVE, refill, talk, tick, useArea, useAt, type Near, type R, type Target,
} from './core/actions.ts'
import { animalName, animalStep, careAnimal, needsTool, petAnimal, type AnimalActor } from './core/animals.ts'
import { outfitFiles } from './core/wardrobe.ts'
import { fillBowl, PET_OFFER_DAY, petHappy, petPet, PETS, petStep, type PetActor } from './core/pets.ts'
import {
  attack, drawBow, fighterStep, foeStep, newArena, newFighter, releaseBow, roll, spawnFoes, weaponAtk, weaponKind, type Arena, type CombatEvent, type Foe,
} from './core/combat.ts'
import { hasStatus } from './core/climate.ts'
import { bite, cast, castCheck, castTarget, landFish, reelStart, reelStep, reelInside, type FishSpot, type Reel } from './core/fishing.ts'
import { findPath, npcReset, npcStep, type NpcActor } from './core/npcs.ts'
import { drainQuestNotes, progress, questDef, recheck, refreshQuests, registerQuests } from './core/quests.ts'
import { endDaySafe, type Summary } from './core/settle.ts'
import {
  clock, dayOfSeason, entsOf, isMature, level, newGame, raining, regionOf, resetWildCache, season, solid, solidTest, tileAt, weather, weatherWaters, year,
  type GameState,
} from './core/state.ts'
import { cook, cookCheck, eventFor, festivalNow, findMarker, fireflyFound, resumeFestival, safetyReady, shopHours, shopOpen, smithCollect, smithJobDone } from './core/town.ts'
import { INDOOR_HOURS } from './core/interiors.ts'
import { collectNest } from './core/animals.ts'
import { corridorAt, edgeDir, enterMine, EXIT_FAR, exitAt, ladderDown, leaveMine, mineOpen, moveTo } from './core/travel.ts'
import { doorOfBuilding, mineFloor } from './core/regions.ts'
import { describeEnt } from './core/placeables.ts'
import { ambience, music, sfx, suspendAll, unlockAudio } from './platform/audio.ts'
import { padActive, readPad, tabCycle, uiNav, type PadFrame } from './platform/gamepad.ts'
import { acquireLock, readSlot, releaseSaveLock, SLOTS, writeSlot } from './platform/save.ts'
import { startOffline } from './platform/offline.ts'
import { saveTitleSnap } from './platform/titleSnap.ts'
import { graphics } from './platform/settings.ts'
import { coarse } from './platform/touch.ts'
import { t as tr } from './core/i18n.ts'
import type { Gesture } from './render/actors.ts'
import type { FxKind } from './render/fx.ts'
import { WorldRenderer } from './render/world.ts'

registerQuests(QUEST_DEFS)
// 调试：控制台直接读档；正式版加 ?perf 用于性能实测（读帧时间、绘制批次、三角形）
if (import.meta.env.DEV || new URLSearchParams(location.search).has('perf')) queueMicrotask(() => Object.assign(window, { startGame, astral: () => game, astralUi: ui, astralCore: { tileAt, regionOf, mineFloor } }))

export type Panel = '' | 'menu' | 'dialog' | 'shop' | 'ship' | 'machine' | 'sleep' | 'summary' | 'pause' | 'help' | 'settings'
  | 'kitchen' | 'coop' | 'mine' | 'festival' | 'chest' | 'silo' | 'fire' | 'tree' | 'project' | 'workshop' | 'look' | 'wish' | 'museum' | 'pet'
export type MenuTab = 'bag' | 'skills' | 'quests' | 'people' | 'collection' | 'craft' | 'map' | 'farm'
export interface DialogState {
  kind: 'npc' | 'letter' | 'board' | 'event' | 'safety'; title: string; npc?: string; quest?: string; lines: string[]; idx: number
  choice?: { text: string; reply: string; friendship: number }[]; picked?: number; gifting?: boolean
}
export interface FishingUi { phase: 'charge' | 'fly' | 'wait' | 'bite' | 'reel'; power: number; pos: number; zone: number; zoneW: number; prog: number; inside: boolean }
export const ui = reactive({
  screen: 'title' as 'title' | 'game',
  panel: '' as Panel,
  tab: 'bag' as MenuTab,
  shop: 'general' as ShopId,
  dialog: null as DialogState | null,
  rev: 0, // 领域状态版本：面板据此重绘
  tick: 0, // HUD 刷新节拍（10Hz）
  toasts: [] as { id: number; text: string; until: number }[],
  hint: '',
  pad: false, // 最近在用手柄（提示文字改成手柄按键）
  touch: coarse(), // 触屏操作（手机、平板）：显示触屏按钮与提示；用鼠标后切回
  gpuLost: false, // 显卡设备丢失，等待重新加载
  lostSaved: true, // 显卡丢失那一刻是否存上了（没存上要给导出与重试）
  hintOk: true,
  away: false,
  readOnly: false,
  error: '',
  summary: null as Summary | null,
  saveOk: true,
  machine: 0,
  sleepDay: 0,
  loading: -1, // 资源加载进度 0..1；-1 表示未在加载
  titleLive: false, // 标题 3D 背景已经画出来（之前先显示上次的快照）
  fishing: null as FishingUi | null,
  hurt: 0, // 受击时刻（HUD 闪红）
  fade: 0, // 区域转场次数（HUD 播放淡入）
  home: 0, // 打开的畜舍/筒仓/作坊/小屋（农场建筑 id；0 为禽舍预留地）
  project: '', // 打开的公共工程
  homeKitchen: false, // 在家中厨房做菜（家宅 1 级）
  plan: null as { kind: BuildKind; move?: number } | null, // 建造规划模式（17.2）：预览不消耗物资
  planMsg: '',
  planAt: null as [number, number] | null,
})

const STEP = 1 / 30 // 24.4 固定 30Hz 模拟
const CHARGE_STEP = 0.45 // 每蓄力一级所需秒数
const FX_OF: Record<string, FxKind> = { hoe: 'soil', chop: 'chips', pick: 'stone', scythe: 'leaves', water: 'water', plant: 'dust', harvest: 'sparkle', craft: 'dust', forage: 'leaves' }
const RADIUS = 0.3
const PERSON_GAP = 0.6 // 人与人之间的最小间距（米）
let rendererP: Promise<WorldRenderer> | null = null
export let game: Game | null = null

// 渲染器全局只建一次（设计 27.3 分阶段加载）：标题页只等标题场景要用的模型，其余在后台按优先级加载
function getRenderer(host: HTMLElement) {
  if (!rendererP) {
    let gpuReady = false // 启动失败分三类提示：浏览器没有 WebGPU / 有 WebGPU 但拿不到显卡 / 显卡就绪后加载出错
    rendererP = (async () => {
      ui.loading = 0
      if (!('gpu' in navigator)) throw new Error(tr('game.noWebgpu'))
      const r = new WorldRenderer(host)
      // 显卡丢失：立刻暂停经营时间并保存，界面提示重新加载（重新加载会按存档重建画面）
      r.onLost = () => { ui.gpuLost = true; ui.lostSaved = game ? game.save() : true }
      await r.init()
      gpuReady = true
      performance.mark('title-init')
      r.probe(SLOTS.map(readSlot).reduce<GameState | null>((a, s) => (s && (!a || s.updatedAt > a.updatedAt) ? s : a), null)) // 最近玩的存档所在区域最先加载
      performance.mark('title-probed') // 性能实测（?perf）读这几个时间点：探查完、可进入、标题场景编译完
      const title = titleState()
      await Promise.all([r.ensure(title, (f) => (ui.loading = f)), r.ensurePlayer(0), r.loadClips()])
      ui.loading = -1
      performance.mark('title-ready')
      // 标题场景在后台编译（编译好之前标题背景不画），再按优先级后台加载、预编译其余区域；
      // 离线完整包等这些做完才下载（多数文件已在浏览器缓存里），不和首屏、相邻区域抢带宽；拿不到 WebGPU 的浏览器走不到这里，也就不下载（开发模式不注册）
      r.warmState(title).then(() => performance.mark('title-warm')).then(() => r.background()).finally(() => (r.calm = true)).then(() => {
        performance.mark('background-done')
        if (import.meta.env.PROD) startOffline()
      })
      return r
    })()
    rendererP.catch((e) => {
      const m = (e as Error).message
      ui.error = !('gpu' in navigator) ? tr('game.gameNeedsBrowserWebgpu', m) : !gpuReady ? tr('game.gpuUnavailable', m) : tr('game.startupLoadFailed', m)
      ui.loading = -1
      rendererP = null
    })
  }
  return rendererP
}

// 标题背景：真实农场场景缓慢环绕，门前种着几种成熟作物
let titleRaf = 0
let titleDemo: GameState | null = null
function titleState() {
  if (titleDemo) return titleDemo
  const demo = newGame('', '', 1, 20261014)
  demo.day = 2
  demo.min = 600
  demo.x = 24
  demo.z = 11
  const crops = ['spring_cauliflower', 'spring_strawberry', 'spring_carrot', 'spring_radish', 'spring_lettuce', 'spring_pea', 'spring_daisy', 'spring_flax']
  for (let z = 13; z <= 16; z++) for (let x = 14; x <= 33; x++) {
    if (x === 23 || x === 24) continue
    const t = tileAt(demo, x, z)!
    if (t.ob || t.g !== 0) continue
    t.till = true
    t.wet = (x + z) % 3 ? demo.day : 0
    const cid = crops[Math.floor((x - 14) / 2.6) % crops.length]
    t.crop = { id: x * 100 + z, cid, prog: z === 16 ? 2 : 99, harvests: 0, dry: 0, dead: false }
  }
  return (titleDemo = demo)
}
export async function startTitleScene(host: HTMLElement) {
  const r = await getRenderer(host)
  if (ui.screen !== 'title' || titleRaf) return
  const demo = titleState()
  r.sync(demo)
  await r.ensurePlayer(0)
  r.orbit = true
  let last = performance.now()
  const loop = (now: number) => {
    if (ui.screen !== 'title') { titleRaf = 0; r.orbit = false; return }
    titleRaf = requestAnimationFrame(loop)
    demo.face = Math.PI * 0.15
    // 标题场景编译好才画（现场编译会卡住标题界面）；读档加载中场景已换成存档的，停在最后一帧
    if (ui.loading < 0 && r.isWarm()) {
      r.frame(demo, demo.x, demo.z, Math.min((now - last) / 1000, 0.1), null, true)
      if (!ui.titleLive) { ui.titleLive = true; saveTitleSnap(r.renderer.domElement) } // 镜头还没转：存下起始画面，下次打开先显示它
    }
    last = now
  }
  titleRaf = requestAnimationFrame(loop)
  music.play('title')
}

// 任务提示按开头挑音效：取该提示在当前语言里 {0} 之前的固定开头（没有开头时不匹配）
const lead = (key: string) => tr(key).split('{')[0] || '\0'

const lostLock = () => {
  ui.readOnly = true
  game?.toast(tr('game.anotherTabTakenOver'))
}

// 先取得写锁再读槽位：继续时读最新存档，新建时确认槽位仍为空（25.4）
export async function startGame(host: HTMLElement, slot: number, fresh?: GameState) {
  unlockAudio()
  let renderer: WorldRenderer
  try {
    renderer = await getRenderer(host)
  } catch {
    return
  }
  ui.readOnly = !(await acquireLock(slot, lostLock))
  if (ui.readOnly && !navigator.locks) ui.error = tr('game.browserDoesntSupportSave')
  let s = readSlot(slot)
  if (fresh) {
    if (ui.readOnly || s) {
      releaseSaveLock()
      ui.error = tr('game.anotherTabUsedSlot')
      return
    }
    s = fresh
  }
  if (!s) {
    releaseSaveLock()
    ui.error = tr('game.saveMissingDamaged')
    return
  }
  // 资源屏障（L05）：先补齐存档所在区域要用的模型（多半已在后台加载好）；仍没加载成（离线包不完整又断网）就不进游戏，后台重新请求
  ui.loading = 0
  const miss = await renderer.ensure(s, (f) => (ui.loading = f * 0.9))
  if (miss.length) {
    ui.loading = -1
    releaseSaveLock()
    if (titleDemo) renderer.sync(titleDemo) // 标题背景搭回来
    console.warn('[start] 缺少模型', miss)
    ui.error = tr('game.failedLoadOfflinePackage2', regionOf(s).name, miss.length)
    renderer.repair().then((left) => { if (!left && ui.screen === 'title') ui.error = tr('game.missingModelsStartPlaying') })
    return
  }
  if (fresh && !writeSlot(slot, s)) {
    ui.loading = -1
    releaseSaveLock()
    if (titleDemo) renderer.sync(titleDemo)
    ui.error = tr('game.cantWriteSaveBrowser')
    return
  }
  ui.error = ''
  ui.saveOk = true
  resetWildCache()
  await renderer.ensurePlayer(s.look ?? 0, outfitFiles(s))
  ui.loading = 0.99 // 标题页的加载条：先把存档里的场景编译好再进
  await renderer.warmState(s)
  ui.loading = -1
  const back = resumeFestival(s) // 上次在节庆小游戏中途刷新/关闭：按中途离开结算
  game = new Game(renderer, slot, s)
  if (back?.msg) game.toast(back.msg)
  if (import.meta.env.DEV) Object.assign(window, { game, ui }) // 调试用
  renderer.orbit = false // 离开标题：停止后台预编译（见 world.ts precompile）
  ui.screen = 'game'
  ui.panel = ''
  game.start()
}

// 居民台词：初次见面 → 生日 → 雨天 → 季节常态；关系档位台词穿插（设计 18.6）
function npcLines(s: GameState, id: string): string[] {
  const d = NPC_DEFS[id]?.dialogue
  if (!d) return ['……']
  const met = !!s.friends[id]?.talked
  if (!met && d.firstMeet) return [d.firstMeet]
  const se = season(s.day)
  const bd = NPC_DEFS[id]?.birthday
  if (bd && bd.season === se && bd.day === dayOfSeason(s.day) && d.birthday) return [d.birthday]
  const pts = s.friends[id]?.pts ?? 0
  const tier = pts >= 600 ? '600' : pts >= 400 ? '400' : pts >= 200 ? '200' : '0'
  const pick = <T,>(a: T[] | undefined) => (a?.length ? a[(s.day * 7 + id.length) % a.length] : undefined)
  const line = (raining(s) && pick(d.rain)) || ((s.day % 3 === 0 && pick(d.friendship?.[tier])) || pick(seasonLines(d, se)))
  return [line ?? '……']
}

interface Fishing { phase: FishingUi['phase']; t: number; power: number; dir: [number, number]; spot: FishSpot; target: [number, number]; fish: string | null; reel: Reel | null; wait: number }

export class Game {
  keys = new Set<string>()
  mouse = { x: 0, y: 0, down: false, fresh: false }
  hover: [number, number] | null = null
  act: { t: number; wind: number; total: number; done: boolean; run: () => R; sound?: string; tiles?: [number, number][] } | null = null
  charge: { t: number; tool: 'hoe' | 'can'; tier: number; level: number; dir: [number, number] } | null = null
  moving = false
  stepTimer = 0
  musicTimer = 0
  acc = 0
  last = 0
  prev = { x: 0, z: 0 }
  saveTimer = 0
  hintTimer = 0
  raf = 0
  toastId = 0
  unwatch = () => {}
  // 运行时实体（不存档）
  npcs = new Map<string, NpcActor>()
  foes: Foe[] = []
  arena: Arena = newArena()
  fighter = newFighter()
  loot: { id: string; n: number; x: number; z: number; t: number }[] = [] // 掉落飞向背包的表现（物品已在战斗事务里入包）
  chickens = new Map<number, AnimalActor>()
  pet: PetActor | null = null
  fishing: Fishing | null = null
  clucks = 0

  r: WorldRenderer
  slot: number
  s: GameState
  constructor(r: WorldRenderer, slot: number, s: GameState) {
    this.r = r
    this.slot = slot
    this.s = s
  }

  start() {
    this.prev = { x: this.s.x, z: this.s.z }
    this.r.target.set(this.s.x, 0, this.s.z)
    refreshQuests(this.s)
    this.enterRegion()
    addEventListener('keydown', this.onKey)
    addEventListener('keyup', this.onKey)
    addEventListener('blur', this.onAway)
    addEventListener('resize', this.onResize)
    document.addEventListener('visibilitychange', this.onAway)
    const c = this.r.renderer.domElement
    c.addEventListener('mousemove', this.onMouse)
    c.addEventListener('mousedown', this.onMouse)
    addEventListener('mouseup', this.onMouse)
    c.addEventListener('wheel', this.onWheel, { passive: false })
    c.addEventListener('contextmenu', this.onContext)
    for (const k of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel'] as const) c.addEventListener(k, this.onTouch)
    c.style.touchAction = 'none' // 不让浏览器把手指拖动当成滚动、缩放页面
    this.last = performance.now()
    this.raf = requestAnimationFrame(this.loop)
    if (document.hidden) this.onAway()
    const stopPanel = watch(() => ui.panel, (p, old) => {
      if (!p && old) this.save() // 关闭界面即事务边界
      if (p && !old) sfx('ui_open', 0.6)
      if (!p && old) sfx('ui_close', 0.5)
      if (p) this.endFishing()
    })
    const stopAway = watch(() => ui.away, (a) => suspendAll(a))
    this.unwatch = () => { stopPanel(); stopAway() }
    this.updateMusic()
  }

  // 保存失败时不退出，保留内存状态与导出入口；force 由玩家在暂停菜单明确选择放弃
  stop(force = false) {
    if (!this.save() && !ui.readOnly && !force) return
    this.unwatch()
    cancelAnimationFrame(this.raf)
    removeEventListener('keydown', this.onKey)
    removeEventListener('keyup', this.onKey)
    removeEventListener('blur', this.onAway)
    removeEventListener('resize', this.onResize)
    document.removeEventListener('visibilitychange', this.onAway)
    const c = this.r.renderer.domElement
    c.removeEventListener('mousemove', this.onMouse)
    c.removeEventListener('mousedown', this.onMouse)
    removeEventListener('mouseup', this.onMouse)
    c.removeEventListener('wheel', this.onWheel)
    c.removeEventListener('contextmenu', this.onContext)
    for (const k of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel'] as const) c.removeEventListener(k, this.onTouch)
    this.r.setArea(null)
    releaseSaveLock()
    game = null
    ui.screen = 'title'
    ui.panel = ''
    ui.dialog = null
    ui.fishing = null
    ambience.play('')
    music.play('title')
  }

  // 背包、商店、对话等界面打开、页面隐藏或失焦、换区域加载中时暂停（5.1）
  running = () => ui.screen === 'game' && !ui.panel && !ui.away && !ui.gpuLost && !this.travelling

  loop = (now: number) => {
    this.raf = requestAnimationFrame(this.loop)
    const dt = Math.min((now - this.last) / 1000, 0.25)
    this.last = now
    if (this.running()) {
      this.acc += dt
      let n = 0
      for (; this.acc >= STEP && n < 5 && this.running(); n++) {
        this.prev = { x: this.s.x, z: this.s.z }
        this.step()
        this.acc -= STEP
      }
      if (n === 5) this.acc = 0 // ponytail: 追帧超限直接丢弃；设计要求暂停并提示恢复
    }
    if (ui.toasts.length && ui.toasts[0].until < now) ui.toasts.shift()
    if (this.travelling) return // 场景已换成正在加载的区域：停在最后一帧，加载条盖在上面
    const a = this.acc / STEP
    const f = this.fishing
    this.r.frame(this.s, this.prev.x + (this.s.x - this.prev.x) * a, this.prev.z + (this.s.z - this.prev.z) * a, dt, this.charge || f ? null : this.hover, this.hoverReach, {
      npcs: [...this.npcs.values()], foes: this.foes, loot: this.loot, chickens: [...this.chickens.values()], pet: this.pet, arena: this.arena, draw: this.fighter.draw,
      bobber: f && f.phase !== 'charge' ? (f.phase === 'fly' ? [this.s.x + (f.target[0] - this.s.x) * Math.min(1, f.t / 0.45), this.s.z + (f.target[1] - this.s.z) * Math.min(1, f.t / 0.45)] : f.target) : null,
      bite: f?.phase === 'bite' || f?.phase === 'reel',
    })
  }

  step() {
    const s = this.s
    if (this.act) {
      const a = this.act
      a.t += STEP
      if (!a.done && a.t >= a.wind) {
        a.done = true
        if (this.run(a.run).ok && a.sound) {
          sfx(a.sound, 0.7)
          const fx = FX_OF[a.sound]
          if (fx) for (const [x, z] of a.tiles ?? []) this.r.fx(fx, x + 0.5, z + 0.5)
        }
      }
      if (a.t >= a.total) this.act = null
    }
    if (this.press?.mode === 'tap' && performance.now() - this.press.t0 > 350) this.touchHold()
    const pd = this.pending
    if (pd && !this.act) {
      const at = pd.where ? pd.where() : undefined
      if (at === null) { this.pending = null; this.route = null } // 目标进屋或离开了：不跟进去
      else if (pd.near()) { this.pending = null; this.route = null; pd.run() }
      else if (!this.route && at && (pd.tries = (pd.tries ?? 0) + 1) <= 4) this.goTo(Math.floor(at[0]), Math.floor(at[1]))
      else if (!this.route) this.pending = null // 走不到：放弃
    }
    if (this.fishing) this.updateFishing()
    else if (this.charge) this.updateCharge()
    else if (this.fighter.draw >= 0) { this.aimAtMouse(); if (!this.mouse.down) this.combatEvents(releaseBow(s, this.fighter, this.arena)) } // 轻弓：松开放箭
    else if (!this.act && this.mouse.down && this.fighter.swing <= 0) this.startUse()
    // 战斗：挥砍判定、翻滚位移、敌人 AI、弹体与危险区
    this.combatEvents(fighterStep(s, this.fighter, this.foes, STEP))
    if (this.foes.length || this.arena.shots.length || this.arena.zones.length) {
      this.combatEvents(foeStep(s, this.foes, this.fighter, STEP, this.arena))
      this.foes = this.foes.filter((f) => f.st !== 'dead' || f.t > 0)
      if (s.hp <= 0) return this.defeated()
    }
    if (this.loot.length) this.loot = this.loot.filter((l) => (l.t += STEP) < 0.9)
    npcStep(s, this.npcs, STEP)
    {
      animalStep(s, this.chickens, STEP) // 农场院子或自家禽舍/畜棚里
      this.pet = petStep(s, this.pet, STEP)
      if (this.chickens.size && Math.random() < STEP / 9) {
        const list = [...this.chickens.values()]
        sfx(ANIMALS[list[Math.floor(Math.random() * list.length)].kind].sound, 0.25)
      }
    }
    this.moving = false
    if (!this.act && !this.charge && !this.fishing && this.fighter.roll <= 0 && this.fighter.swing <= 0 && this.fighter.draw < 0) this.move()
    const f = this.fishing
    this.r.setPlayerPose(this.charge || f?.phase === 'charge' ? 'charge' : f?.phase === 'reel' ? 'reel' : f ? 'fish' : this.moving ? (this.keys.has('shift') ? 'sprint' : 'walk') : 'idle')
    if (this.moving && (this.stepTimer -= STEP) <= 0) {
      this.stepTimer = this.keys.has('shift') ? 0.28 : 0.4
      const t = tileAt(s, Math.floor(s.x), Math.floor(s.z))
      sfx(season(s.day) === 3 && t?.g === 0 ? 'step_snow' : t?.g === 3 || t?.g === 4 ? 'step_stone' : t?.g === 6 ? 'step_wood' : 'step_grass', 0.35)
    }
    if ((this.musicTimer += STEP) >= 1) {
      this.musicTimer = 0
      this.updateMusic()
      if (s.region !== 'mine' && weather(s.seed, s.day) === 3 && season(s.day) === 1 && Math.random() < 0.06) { this.r.lightning(); setTimeout(() => sfx('thunder', 0.6), 600) }
      if (s.region !== 'mine' && weather(s.seed, s.day) === 3 && season(s.day) === 2 && Math.random() < 0.05) sfx('wind_gust', 0.4)
    }
    const { msgs, passout, down } = tick(s, STEP)
    msgs.forEach((m) => this.toast(m))
    if (passout) return this.sleep(true)
    if (down) return this.defeated()
    if ((this.hintTimer += STEP) >= 0.1) { this.hintTimer = 0; this.updateHint(); ui.tick++ }
    if ((this.saveTimer += STEP) >= 30 && !this.act && !this.foes.some((x) => x.st !== 'idle' && x.st !== 'dead')) { this.saveTimer = 0; this.save() } // 25.2 每 30 秒检查点（战斗中不存）
  }

  move() {
    const [dx0, dz0] = this.moveDir()
    if (dx0 || dz0) { this.route = null; return this.walk(dx0, dz0) } // 手动移动取消自动寻路
    if (this.route) this.followRoute()
  }
  // 朝单位方向走一步（6.1 行走 3.2 / 冲刺 4.8 米每秒），走到出口格时转场
  private walk(dx0: number, dz0: number, max = Infinity) {
    const s = this.s
    // 缓速 -20%（6.4）；木路、石路 +5%（12.3）
    const slow = hasStatus(s, 'slow') ? 0.8 : 1
    const path = s.region === 'farm' && s.ents.some((e) => (e.k === 'path_wood' || e.k === 'path_stone') && e.x === Math.floor(s.x) && e.z === Math.floor(s.z)) ? 1.05 : 1
    const sp = Math.min(max, (this.keys.has('shift') || this.padSprint ? 4.8 : 3.2) * STEP * slow * path)
    const dx = dx0 * sp
    const dz = dz0 * sp
    s.face = Math.atan2(dx, dz)
    const ox = s.x
    const oz = s.z
    if (!this.blocked(s.x + dx, s.z) && !this.crowded(s.x + dx, s.z)) s.x += dx
    if (!this.blocked(s.x, s.z + dz) && !this.crowded(s.x, s.z + dz)) s.z += dz
    this.moving = s.x !== ox || s.z !== oz
    // 撞到关着的店门：提示开门时间
    if (!this.moving) { const d = this.shutDoor(Math.floor(s.x + dx0 * 0.6), Math.floor(s.z + dz0 * 0.6)); if (d) this.toast(d) }
    const exit = exitAt(s)
    if (exit) {
      // 走进建筑的门：等于进屋（按营业时间）；其余出口直接换地图
      const b = !regionOf(s).indoor && exit.to.startsWith('in:') ? regionOf(s).buildings.find((x) => x.enter === exit.to) : undefined
      const went = b ? this.enterDoor(exit.to, b.shop, b.name) : this.travel((t) => moveTo(t, exit.to, exit.tx, exit.tz))
      if (!went) { s.x = ox; s.z = oz; this.route = null; return (this.moving = false) } // 没进去（关门、缺资源）：退回出口前
      if (!b) sfx(regionOf(s).indoor || exit.to.startsWith('in:') ? 'door_wood_close' : 'door', 0.5)
    }
    return this.moving
  }

  // ---------- 右键寻路（不默认自动寻路，7.3；右键明确指定目标格） ----------
  route: [number, number][] | null = null
  private routeStuck = 0
  private reach: { key: string; map: Uint8Array; w: number; h: number } | null = null
  // 从角色所在格出发能走到的格（按区域、角色格与状态版本缓存）
  private reachMap() {
    const s = this.s
    const r = regionOf(s)
    const sx = Math.floor(s.x), sz = Math.floor(s.z)
    const key = `${r.key}|${sx},${sz}|${ui.rev}`
    if (this.reach?.key === key) return this.reach
    const map = new Uint8Array(r.w * r.h)
    const blocked = solidTest(s)
    const q = [sz * r.w + sx]
    if (sx >= 0 && sz >= 0 && sx < r.w && sz < r.h) map[q[0]] = 1
    for (let h = 0; h < q.length; h++) {
      const i = q[h], x = i % r.w, z = (i / r.w) | 0
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, nz = z + dz
        if (nx < 0 || nz < 0 || nx >= r.w || nz >= r.h) continue
        const n = nz * r.w + nx
        if (map[n] || blocked(nx, nz)) continue
        map[n] = 1
        q.push(n)
      }
    }
    this.reach = { key, map, w: r.w, h: r.h }
    return this.reach
  }
  // 能否走到：可走格本身连通，或障碍/建筑/水面旁有连通的格可以站
  reachable(x: number, z: number) {
    const m = this.reachMap()
    const at = (a: number, b: number) => a >= 0 && b >= 0 && a < m.w && b < m.h && m.map[b * m.w + a] === 1
    if (at(x, z)) return true
    return solid(this.s, x, z) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => at(x + dx, z + dz))
  }
  goTo(x: number, z: number) {
    const s = this.s
    if (!this.reachable(x, z)) { this.toast(tr('game.cantGet')); sfx('ui_error', 0.35); return }
    const target = solid(s, x, z)
    const path = findPath(s, s.x, s.z, x + 0.5, z + 0.5)
    if (!path) return
    if (target) path.pop() // 目标是障碍或建筑：停在它旁边
    // 点在地图边缘的出口上：顺着路再往外走一段，走到路尽头换地图
    const edge = regionOf(s).exits.find((e) => edgeDir(s, e) && x >= e.x0 && x <= e.x1 && z >= e.z0 && z <= e.z1)
    if (edge && !target) { const d = edgeDir(s, edge)!; path.push([x + 0.5 + d[0] * (EXIT_FAR + 1), z + 0.5 + d[1] * (EXIT_FAR + 1)]) }
    this.route = path.length ? path : null
    this.routeStuck = 0
    if (target && !path.length) s.face = Math.atan2(x + 0.5 - s.x, z + 0.5 - s.z)
    this.routeFace = target ? [x + 0.5, z + 0.5] : null
  }
  private routeFace: [number, number] | null = null
  // 两点之间能否直线走过（按角色碰撞半径取样）
  private clear(ax: number, az: number, bx: number, bz: number) {
    const d = Math.hypot(bx - ax, bz - az)
    for (let t = 0.2; t < d; t += 0.2) if (this.blocked(ax + ((bx - ax) * t) / d, az + ((bz - az) * t) / d)) return false
    return true
  }
  private followRoute() {
    const s = this.s
    const r = this.route!
    // 能直线走到更远的路点就跳过中间的格心，路线不走锯齿
    while (r.length > 1 && this.clear(s.x, s.z, r[1][0], r[1][1])) r.shift()
    const [tx, tz] = r[0]
    const d = Math.hypot(tx - s.x, tz - s.z)
    if (d < 0.06) {
      r.shift()
      if (!r.length) {
        this.route = null
        if (this.routeFace) s.face = Math.atan2(this.routeFace[0] - s.x, this.routeFace[1] - s.z)
      }
      return
    }
    const region = s.region
    const moved = this.walk((tx - s.x) / d, (tz - s.z) / d, d)
    if (s.region !== region) { this.route = null; return }
    this.routeStuck = moved ? 0 : this.routeStuck + STEP
    if (this.routeStuck > 0.6) this.route = null // 被居民或新障碍挡住：放弃
  }
  // WASD 在相机平面上的单位方向
  moveDir(): [number, number] {
    const k = this.keys
    let ix = (k.has('d') ? 1 : 0) - (k.has('a') ? 1 : 0)
    let iz = (k.has('w') ? 1 : 0) - (k.has('s') ? 1 : 0)
    if (!ix && !iz && ui.panel === '') [ix, iz] = this.padMove
    if (!ix && !iz && this.press?.mode === 'drag' && ui.panel === '') {
      const p = this.r.pickPoint(this.mouse.x, this.mouse.y)
      const dx = p ? p[0] - this.s.x : 0, dz = p ? p[1] - this.s.z : 0, d = Math.hypot(dx, dz)
      return d > 0.35 ? [dx / d, dz / d] : [0, 0]
    }
    if (!ix && !iz) return [0, 0]
    const az = this.r.az
    const dx = -Math.sin(az) * iz + Math.cos(az) * ix
    const dz = -Math.cos(az) * iz - Math.sin(az) * ix
    const len = Math.hypot(dx, dz)
    return [dx / len, dz / len]
  }
  blocked(x: number, z: number) {
    const s = this.s
    const r = regionOf(s)
    for (const [ox, oz] of [[-RADIUS, -RADIUS], [RADIUS, -RADIUS], [-RADIUS, RADIUS], [RADIUS, RADIUS]]) {
      const tx = Math.floor(x + ox), tz = Math.floor(z + oz)
      // 地图外：只有边缘出口的延伸路段能走（走出去一段再换地图）
      if (tx < 0 || tz < 0 || tx >= r.w || tz >= r.h) { if (!corridorAt(s, tx, tz)) return true; continue }
      if (solid(s, tx, tz) || this.shutDoor(tx, tz)) return true
    }
    return false
  }
  // 门格对应的建筑现在关门：返回提示文字（开着或不是门返回空串）
  shutDoor(tx: number, tz: number) {
    const s = this.s
    const r = regionOf(s)
    if (r.indoor) return ''
    const b = r.buildings.find((x) => x.enter && doorOfBuilding(x).tile[0] === tx && doorOfBuilding(x).tile[1] === tz)
    if (!b) return ''
    if (b.shop) return shopOpen(s, b.shop as ShopId) || (b.shop === 'smith' && smithJobDone(s)) ? '' : tr('fmt.labelValue', b.name, shopHours(b.shop as ShopId))
    const h = INDOOR_HOURS[b.enter!.split(':')[1]]
    return h && (s.min < h[0] || s.min >= h[1]) ? tr('game.closedRightNowOpen', b.name, clock(h[0]), clock(h[1])) : ''
  }
  // 人与人不重叠：离居民太近时不能再往前挤（往外走可以）
  crowded(x: number, z: number) {
    const s = this.s
    for (const n of this.npcs.values()) {
      if (n.hidden) continue
      const d = Math.hypot(n.x - x, n.z - z)
      if (d < PERSON_GAP && d < Math.hypot(n.x - s.x, n.z - s.z)) return true
    }
    return false
  }

  // 换区域事务（L05）：先在状态副本上走一遍核心层的换区域，渲染层按副本搭好新场景、确认用到的模型都已加载，
  // 才在真实状态上提交。模型还在后台加载、或这个区域还没编译过：显示加载条、暂停经营时间，补齐并编译好再进（27.3）。
  // 缺模型（离线包不完整又断网）就留在原区域，后台重新请求，提示联网后再走一次
  private travelWait = 0
  travelling = false
  travel(go: (s: GameState) => R | void): boolean {
    if (this.travelling || performance.now() < this.travelWait) return false
    const trial = structuredClone(this.s)
    const pre = go(trial)
    if (pre && !pre.ok) { this.run(() => pre); return false }
    const arrive = () => {
      const r = go(this.s)
      if (r) this.run(() => r)
      this.enterRegion()
    }
    if (!this.r.check(trial).length && this.r.isWarm()) { arrive(); return true }
    this.travelling = true
    ui.loading = 0
    ;(async () => {
      const miss = await this.r.ensure(trial, (f) => (ui.loading = f * 0.9))
      if (game !== this) return
      if (miss.length) {
        console.warn('[travel] 缺少模型', miss)
        this.r.sync(this.s) // 搭回原区域
        this.s.x = this.prev.x // 退回出口前
        this.s.z = this.prev.z
        this.route = null
        this.travelWait = performance.now() + 2000
        this.toast(tr('game.failedLoadOfflinePackage', regionOf(trial).name, miss.length))
        sfx('ui_error', 0.4)
        this.r.repair().then((left) => { if (!left) this.toast(tr('game.missingModelsHeadOver')) })
        return
      }
      ui.loading = 0.95
      await this.r.warmState(trial)
      if (game === this) arrive()
    })().finally(() => { this.travelling = false; ui.loading = -1 })
    return true
  }

  // 进入新区域（转场、读档、日结后）：居民就位、生成敌人、清掉上个区域的运行时实体
  enterRegion() {
    const s = this.s
    ui.fade++
    this.prev = { x: s.x, z: s.z }
    this.r.target.set(s.x, 0, s.z)
    this.act = null
    this.charge = null
    this.route = null
    this.endFishing()
    this.fighter = newFighter()
    this.foes = spawnFoes(s)
    this.arena = newArena()
    this.loot = []
    this.chickens.clear()
    this.pet = null
    npcReset(s, this.npcs)
    // 第 3 天起出门时，周芹把一只没人领的小猫小狗带来（不选也行，第二天再问）
    if (!s.pet && s.region === 'farm' && s.day >= PET_OFFER_DAY && !s.flags.includes('petOffer:' + s.day)) { s.flags.push('petOffer:' + s.day); setTimeout(() => { if (!ui.panel) ui.panel = 'pet' }, 900) }
    this.changed()
    this.save()
    this.updateMusic()
  }

  // 7.3 校验 → 前摇 → 命中时再次校验并原子提交 → 后摇
  startUse() {
    // 武器：短剑/长柄三段连击；轻弓按住拉弓
    if (weaponAtk(this.s) > 0) {
      if (!this.mouse.fresh && this.fighter.swing > 0) return
      this.mouse.fresh = false
      this.aimAtMouse()
      if (weaponKind(this.s) === 'bow') { drawBow(this.fighter); this.r.playerGesture('cast', 0.7); return }
      this.combatEvents(attack(this.fighter, this.s))
      return
    }
    if (this.selectedTool() === 'rod') { this.mouse.fresh = false; return this.startCast() }
    const h = this.hover
    if (!h) return
    const pre = useAt(this.s, h[0], h[1], true)
    if (!pre.ok) {
      if (this.mouse.fresh && pre.msg) {
        this.toast(pre.msg)
        sfx('ui_error', 0.4)
      }
      this.mouse.fresh = false
      return
    }
    this.mouse.fresh = false
    this.s.face = Math.atan2(h[0] + 0.5 - this.s.x, h[1] + 0.5 - this.s.z)
    const { gesture, sound } = this.actionStyle(h[0], h[1], pre)
    const total = pre.dur ? pre.dur + 0.2 : this.r.gestureTime(gesture)
    const wind = pre.dur ?? this.r.gestureImpact(gesture)
    this.r.playerGesture(gesture, total)
    this.act = { t: 0, wind, total, done: false, run: () => useAt(this.s, h[0], h[1]), sound, tiles: [h] }
  }
  private aimAtMouse() {
    if (padActive) return // 手柄：朝向由左摇杆决定
    const p = this.r.pickPoint(this.mouse.x, this.mouse.y)
    if (p && Math.hypot(p[0] - this.s.x, p[1] - this.s.z) > 0.2) this.s.face = Math.atan2(p[0] - this.s.x, p[1] - this.s.z)
  }

  // ---------- 战斗（15.2）----------
  private combatEvents(ev: CombatEvent[]) {
    for (const e of ev) {
      if (e.k === 'swing') {
        this.r.playerGesture((['swing1', 'swing2', 'swing3'] as Gesture[])[e.combo], COMBAT.combo[e.combo])
        sfx('swing', 0.55)
      } else if (e.k === 'shoot') sfx('bow', 0.6)
      else if (e.k === 'pillar') { sfx('ice_crack', 0.7); this.r.fx('stone', e.x + 0.5, e.z + 0.5, 0.8); this.changed() }
      else if (e.k === 'boss') { this.toast(tr('game.defeated', FOES[e.foe.k].name, e.note)); sfx('fanfare', 0.8) }
      else if (e.k === 'hit') {
        sfx('hit', e.crit ? 0.9 : 0.7)
        const k = e.foe.k
        sfx(k === 'moss' ? 'slime' : ['ironbug', 'guard', 'furnacebeast'].includes(k) ? 'metal_clank' : ['spiker', 'wisp', 'crystalwing', 'crystalcore'].includes(k) ? 'ice_crack' : 'beetle', 0.5)
        this.r.flashFoe(e.foe.idx)
        this.r.fx(k === 'moss' ? 'leaves' : 'stone', e.foe.x, e.foe.z, 0.4)
        if (e.crit) this.toast(tr('game.criticalHit', e.dmg))
      } else if (e.k === 'drop') {
        this.loot.push({ id: e.id, n: e.n, x: e.x, z: e.z, t: 0 })
        this.toast(e.parcel ? tr('game.backpackFullWentLost', ITEMS[e.id]?.name ?? e.id, e.n) : `+${e.n} ${ITEMS[e.id]?.name ?? e.id}`)
        sfx('pickup', 0.45)
      } else if (e.k === 'die') {
        sfx('enemy_die', 0.7)
        this.r.fx('dust', e.foe.x, e.foe.z, 0.3)
        this.changed()
      } else if (e.k === 'hurt') {
        if (e.dmg) { sfx('hurt', 0.7); this.r.playerFlash(); ui.hurt = performance.now() }
        if (e.status) this.toast(tr('game.statusInflicted', e.status))
        this.fighter.draw = -1
        if (this.fishing) this.endFishing(tr('game.wereHitReeledLine'))
      } else if (e.k === 'state' && e.foe.st === 'crouch') sfx('slime', 0.35)
      else if (e.k === 'state' && (e.foe.st === 'roar' || (e.foe.st === 'telegraph' && FOES[e.foe.k].boss))) sfx('boss_roar', 0.6)
      else if (e.k === 'state' && e.foe.st === 'telegraph') sfx(e.foe.k === 'spiker' ? 'projectile' : FOES[e.foe.k].fly ? 'wind_gust' : 'beetle', 0.45)
      else if (e.k === 'state' && e.foe.st === 'attack' && ['rockback', 'guard', 'wisp'].includes(e.foe.k)) sfx('shockwave', 0.6)
    }
  }
  // 6.5 被击败：送回家、当天结束，按规则收救援费，物品与装备不丢
  private defeated() {
    this.toast(tr('game.collapsed'))
    this.r.playerGesture('die', 1)
    this.sleep(true)
  }
  // ---------- 钓鱼（14.1）----------
  private startCast() {
    if (this.fishing || this.act) return
    const pre = castCheck(this.s)
    if (!pre.ok) { this.toast(pre.msg!); sfx('ui_error', 0.4); return }
    this.aimAtMouse()
    this.fishing = { phase: 'charge', t: 0, power: 0, dir: [Math.sin(this.s.face), Math.cos(this.s.face)], spot: 'river', target: [0, 0], fish: null, reel: null, wait: 0 }
    ui.fishing = { phase: 'charge', power: 0, pos: 0.5, zone: 0.4, zoneW: 0.3, prog: 0, inside: false }
  }
  endFishing(msg?: string) {
    if (!this.fishing) return
    this.fishing = null
    ui.fishing = null
    if (msg) this.toast(msg)
  }
  private updateFishing() {
    const f = this.fishing!
    const s = this.s
    f.t += STEP
    const [mx, mz] = this.moveDir()
    // 抛竿后移动即收竿；收线阶段专心控制
    if (f.phase !== 'charge' && f.phase !== 'reel' && (mx || mz)) return this.endFishing(tr('game.putAwayRod'))
    switch (f.phase) {
      case 'charge': {
        this.aimAtMouse()
        f.dir = [Math.sin(s.face), Math.cos(s.face)]
        f.power = 1 - Math.abs(1 - ((f.t / 0.8) % 2)) // 力度来回摆动
        ui.fishing!.power = f.power
        if (this.mouse.down) break
        const t = castTarget(s, f.dir[0], f.dir[1], f.power)
        if (typeof t === 'string') { sfx('ui_error', 0.4); return this.endFishing(t) } // 不合法的落点不扣精力
        f.wait = cast(s)
        f.spot = t.spot
        f.target = [t.x, t.z]
        f.phase = 'fly'
        f.t = 0
        this.r.playerGesture('cast', 0.8)
        sfx('cast', 0.6)
        this.changed()
        break
      }
      case 'fly': // 浮漂飞行约 0.45 秒后落水
        if (f.t >= 0.45) {
          f.phase = 'wait'
          f.t = 0
          this.r.fx('water', f.target[0], f.target[1], 0)
          sfx('catch', 0.35)
        }
        break
      case 'wait': // 2—6 秒（有鱼饵更快）后鱼讯
        if (f.t < f.wait) break
        f.fish = bite(s, f.spot)
        if (!f.fish) return this.endFishing(tr('game.nothingsBitingTryAnother'))
        f.phase = 'bite'
        f.t = 0
        sfx('bite', 0.8)
        this.r.fx('water', f.target[0], f.target[1], 0)
        break
      case 'bite': // 鱼讯 2 秒内点击确认
        if (this.mouse.down && this.mouse.fresh) {
          this.mouse.fresh = false
          f.phase = 'reel'
          f.reel = reelStart(s, f.fish!, graphics.fishAssist)
          ui.fishing!.zoneW = f.reel.zoneW
        } else if (f.t >= FISHING.biteWindow) return this.endFishing(tr('game.fishGotAwayLeft'))
        break
      case 'reel': {
        const r = f.reel!
        const res = reelStep(r, STEP, this.mouse.down)
        if (Math.random() < STEP * 6) sfx('reel', 0.25)
        Object.assign(ui.fishing!, { pos: r.pos, zone: r.zone, prog: r.prog, inside: reelInside(r) })
        if (res === 'lose') return this.endFishing(tr('game.fishSlippedHook'))
        if (res === 'win') {
          const fish = f.fish!
          const at = f.target
          this.endFishing()
          if (this.run(() => landFish(s, fish)).ok) {
            sfx('catch', 0.8)
            this.r.fx('water', at[0], at[1], 0)
            this.r.playerGesture('yes', 1)
          }
          return
        }
        break
      }
    }
    ui.fishing!.phase = f.phase
  }

  // 蓄力（设计 11.1）：升级后的锄头与水壶按住蓄力，松开对范围内有效格同时作业
  private selectedTool(): ToolId | null {
    const sl = this.s.inv[this.s.sel]
    return (sl && ITEMS[sl.id].tool) || null
  }
  private facingDir(): [number, number] {
    const h = this.hover
    const fx = h ? h[0] + 0.5 - this.s.x : Math.sin(this.s.face)
    const fz = h ? h[1] + 0.5 - this.s.z : Math.cos(this.s.face)
    return Math.abs(fx) > Math.abs(fz) ? [Math.sign(fx), 0] : [0, Math.sign(fz) || 1]
  }
  private updateCharge() {
    const c = this.charge!
    c.t += STEP
    c.level = Math.min(c.tier, Math.floor(c.t / CHARGE_STEP))
    c.dir = this.facingDir()
    this.s.face = Math.atan2(c.dir[0], c.dir[1])
    this.r.setArea(c.level >= 1 ? chargeArea(this.s, c.level, c.dir[0], c.dir[1]) : null)
    if (!this.mouse.down) this.releaseCharge()
  }
  private releaseCharge() {
    const c = this.charge!
    this.charge = null
    this.r.setArea(null)
    if (c.level < 1) {
      this.mouse.fresh = true
      return this.startUse()
    }
    const tiles = chargeArea(this.s, c.level, c.dir[0], c.dir[1])
    const pre = useArea(this.s, c.tool, tiles, true)
    if (!pre.ok) {
      this.toast(pre.msg!)
      sfx('ui_error', 0.4)
      return
    }
    const gesture: Gesture = c.tool === 'hoe' ? 'hoe' : 'water'
    const total = this.r.gestureTime(gesture)
    this.r.playerGesture(gesture, total)
    this.act = { t: 0, wind: this.r.gestureImpact(gesture), total, done: false, run: () => useArea(this.s, c.tool, tiles), sound: c.tool === 'hoe' ? 'hoe' : 'water', tiles }
  }

  // 动作表现：用哪段动画、命中时播什么音效（只影响表现，不影响判定）
  actionStyle(x: number, z: number, pre: R): { gesture: Gesture; sound: string } {
    const t = tileAt(this.s, x, z)
    if (t?.fo) return { gesture: 'pickup', sound: 'forage' }
    if (t?.crop && isMature(t.crop)) return { gesture: 'harvest', sound: 'harvest' }
    const tool = this.selectedTool()
    if (tool) {
      if (tool === 'can') return pre.dur ? { gesture: 'water', sound: 'plant' } : { gesture: 'water', sound: 'water' }
      if (t?.crop?.dead || (tool === 'scythe' && t?.ob)) return { gesture: 'scythe', sound: 'scythe' }
      if (t?.ent) return { gesture: 'axe', sound: 'craft' }
      if (tool === 'pick' && t?.ob && ['rock', 'copper', 'coal', 'exit'].includes(t.ob.k)) return { gesture: 'pick', sound: 'pick' }
      return { gesture: tool === 'pick' ? 'pick' : tool === 'rod' ? 'cast' : tool, sound: { hoe: 'hoe', axe: 'chop', pick: 'pick', scythe: 'scythe', rod: 'cast' }[tool] }
    }
    const sl = this.s.inv[this.s.sel]
    return { gesture: 'plant', sound: sl && ITEMS[sl.id].tags?.includes('decor') ? 'place_furniture' : sl && ITEMS[sl.id].place ? 'craft' : 'plant' }
  }

  // 背景音乐：区域 / 季节 / 时段；雨天加雨声（23.2 切换淡入淡出）
  updateMusic() {
    const s = this.s
    const se = season(s.day)
    const w = weather(s.seed, s.day)
    const rainy = weatherWaters(w, se) || (w === 2 && se === 3)
    const night = s.min >= 1200
    const evening = s.min >= 1080 && !night
    const fn = festivalNow(s)
    const fd = fn && festDef(fn.id)
    const fest = !!fd && !fn!.over && s.region === fd.region && s.min >= fd.open - 60
    // 节庆各有会场曲（花种会沿用 festival）；仪式用庄重的短曲
    const festTrack = fn ? ({ fishing_derby: 'fest_fishing', picnic: 'fest_picnic', firefly: 'fest_firefly', market: 'fest_market', harvest_coop: 'fest_harvest',
      snow_craft: 'fest_snow', hearth_night: 'fest_hearth', windmill_ceremony: 'ceremony', long_table_feast: 'fest_hearth' } as Record<string, string>)[fn.id] ?? 'festival' : 'festival'
    const byRegion: Record<string, string> = {
      town: ['town', 'summer', 'autumn', 'winter'][se], river: 'river', forest: 'forest', mountain: 'forest',
      deepforest: 'deepforest', wetland: 'wetland', highland: 'highland',
      farm: ['farm_spring', 'farm_summer', 'farm_autumn', 'farm_winter'][se],
    }
    // 室内：家里安静、商店轻快、畜舍里是动物与干草声
    const room = s.region.startsWith('in:') ? s.region.split(':')[1] : ''
    const inTrack = room === 'house' || room === 'cabin' || room.startsWith('house_') ? 'home' : room === 'coop' || room === 'barn' ? '' : 'shop'
    // 矿洞：三个主题区各有配乐；首领还在时换成首领战
    const mineTrack = this.foes.some((f) => FOES[f.k].boss && f.st !== 'dead') ? 'boss' : ['mine', 'mine_iron', 'mine_frost'][Math.min(2, Math.floor((s.floor - 1) / 10))]
    music.play(s.region === 'mine' ? mineTrack : fest ? festTrack : room ? inTrack : night ? 'night' : evening ? 'evening' : byRegion[s.region])
    const storm = w === 3 && se === 1
    const fire = room && regionOf(s).decor.some((d) => d.m === 'fireplace' || d.m === 'forge_town' || d.m === 'stove_diner')
    ambience.play(room ? (room === 'coop' || room === 'barn' ? 'amb_barn' : fire ? 'amb_fire' : 'amb_indoor')
      : s.region === 'mine' ? 'amb_cave' : storm ? 'amb_rain_thunder' : rainy ? 'amb_rain' : s.region === 'highland' ? 'amb_wind' : s.region === 'wetland' ? 'amb_wetland'
      : se === 3 ? 'amb_snow' : s.region === 'river' ? 'amb_river' : !night ? 'amb_forest' : '')
  }

  // 执行一条命令：提示、刷新、升级通知
  run(fn: () => R): R {
    const before = SKILLS.map((k) => level(this.s.xp[k]))
    const r = fn()
    if (r.msg) this.toast(r.msg)
    if (r.ok) {
      SKILLS.forEach((k, i) => {
        if (level(this.s.xp[k]) > before[i]) {
          this.toast(tr('game.reachedLevel', SKILL_NAMES[k], level(this.s.xp[k])))
          sfx('levelup', 0.7)
          this.r.playerGesture('yes', 1.2)
        }
      })
      if (r.msg?.startsWith('+')) sfx('pickup', 0.6)
      if (r.msg?.includes(tr('common.rockCrumblesRevealingLadder')) || r.msg?.includes(tr('common.windWhistlesDistanceWay'))) sfx('rock_break', 0.8)
      this.changed()
    } else if (r.msg) sfx('ui_error', 0.4)
    return r
  }

  changed() {
    recheck(this.s)
    for (const n of drainQuestNotes()) {
      this.toast(n)
      if (n.startsWith(lead('quests.completed'))) sfx('fanfare', 0.6) // quests.ts 的提示文本
      else if (n.startsWith(lead('quests.newQuest')) || n.startsWith(lead('quests.newLetterMailbox'))) sfx('ui_open', 0.5)
    }
    ui.rev++
    this.r.sync(this.s)
    const tool = this.selectedTool()
    const item = this.s.inv[this.s.sel]?.id
    this.r.holdTool(tool, tool ? Math.max(0, this.s.tools[tool]) : 0, item && ITEMS[item]?.weapon ? item : undefined)
  }

  // 同一提示 1 秒内不重复（21.3）
  toast(text: string) {
    const now = performance.now()
    const same = ui.toasts.find((t) => t.text === text)
    if (same) { same.until = now + 3000; return }
    ui.toasts.push({ id: ++this.toastId, text, until: now + 3000 })
    if (ui.toasts.length > 5) ui.toasts.shift()
  }

  // 可交互的居民与动物（F 键目标、HUD 提示）
  near(): Near[] {
    const out: Near[] = []
    for (const n of this.npcs.values()) if (!n.hidden) out.push({ kind: 'npc', id: n.id, name: NPC_DEFS[n.id]?.name ?? n.id, x: n.x, z: n.z })
    if (this.pet && this.s.pet) out.push({ kind: 'animal', id: -1, name: this.s.pet.name, x: this.pet.x, z: this.pet.z })
    for (const c of this.chickens.values()) out.push({ kind: 'animal', id: c.id, name: animalName(this.s.animals.find((a) => a.id === c.id)?.name ?? c.kind), x: c.x, z: c.z })
    return out
  }

  hoverReach = true // 悬停格能否走到：绿框 / 红框
  // 规划锚点：鼠标指着建筑门口那一格
  planOrigin(): [number, number] | null {
    if (!ui.plan || !this.hover) return null
    const { w, d } = BUILDINGS[ui.plan.kind]
    return [this.hover[0] - Math.floor(w / 2), this.hover[1] - d]
  }
  startPlan(kind: BuildKind, move?: number) {
    if (this.s.region !== 'farm') { this.toast(tr('common.goBackFarmPlace')); return }
    ui.plan = { kind, move }
    ui.panel = ''
  }
  private confirmPlan() {
    const o = this.planOrigin()
    if (!o || !ui.plan) return
    const p = ui.plan
    const r = this.run(() => (p.move ? moveBuilding(this.s, p.move, o[0], o[1]) : orderBuilding(this.s, p.kind, o[0], o[1])))
    if (r.ok) { ui.plan = null; sfx('craft', 0.7); this.r.setPlan(null, true) }
  }
  updateHint() {
    this.hover = padActive ? this.frontTile() : ui.touch ? this.touchTile : this.r.pick(this.mouse.x, this.mouse.y)
    ui.pad = padActive
    if (ui.plan) {
      const o = this.planOrigin()
      const b = ui.plan.move ? this.s.farmB.find((x) => x.id === ui.plan!.move) : undefined
      ui.planMsg = o ? placeProblem(this.s, ui.plan.kind, o[0], o[1], b) : ui.touch ? tr('touch.planPick') : tr('game.moveMouseOverFarm')
      ui.planAt = o
      this.r.setPlan(o ? [o[0], o[1], BUILDINGS[ui.plan.kind].w, BUILDINGS[ui.plan.kind].d] : null, !ui.planMsg)
      ui.hint = ui.planMsg || (ui.touch ? tr('touch.plan', BUILDINGS[ui.plan.kind].name) : ui.plan.move ? tr('game.leftClickMoveRight', BUILDINGS[ui.plan.kind].name) : tr('game.leftClickBuildRight', BUILDINGS[ui.plan.kind].name))
      ui.hintOk = !ui.planMsg
      return
    }
    this.hoverReach = !this.hover || this.reachable(this.hover[0], this.hover[1])
    const t = interactTarget(this.s, this.near())
    const what = t && (t.kind === 'npc' ? tr('game.talk', t.name) : t.kind === 'animal' ? tr('game.pet', t.name) : t.kind === 'mail' && this.s.mail.length ? tr('game.readNewMail') : t.name)
    const e = what && (ui.touch ? what : tr('fmt.labelValue', padActive ? 'X' : 'F', what))
    if (this.fishing) {
      ui.hint = ui.touch ? { charge: tr('touch.releaseCast'), fly: '', wait: tr('touch.waitBite'), bite: tr('touch.bite'), reel: tr('touch.reel') }[this.fishing.phase]
        : { charge: tr('game.releaseLeftClickCast'), fly: '', wait: tr('game.waitingBiteMoveReel'), bite: tr('game.biteLeftClick'), reel: tr('game.holdLeftClickMove') }[this.fishing.phase]
      ui.hintOk = true
      return
    }
    if (weaponAtk(this.s) > 0) { ui.hint = [e, ui.touch ? (weaponKind(this.s) === 'bow' ? tr('touch.bow') : tr('touch.attack')) : weaponKind(this.s) === 'bow' ? tr('game.holdLeftClick0') : tr('game.leftClickAttack3'), ui.touch ? '' : tr('game.spaceRoll')].filter(Boolean).join(' · '); ui.hintOk = true; return }
    if (this.selectedTool() === 'rod') { ui.hint = [e, ui.touch ? tr('touch.rod') : tr('game.faceWaterHoldLeft')].filter(Boolean).join(' · '); ui.hintOk = true; return }
    if (!this.hover) { ui.hint = e || ''; return }
    const [x, z] = this.hover
    const pre = useAt(this.s, x, z, true)
    // 触屏：点远处会先走过去，不提示“距离过远”；食物用“食用”按钮
    const msg = ui.touch && pre.msg === tr('actions.tooFarAway') ? '' : ui.touch && pre.msg === tr('actions.pressEEat') ? tr('touch.eatButton') : pre.msg
    const hint = [e, describe(this.s, x, z), msg].filter(Boolean).join(' · ')
    // 放置物说明里的“（F 采摘）/(F to pick)”：触屏改成“点一下”
    const lp = String.fromCharCode(0xff08) // 全角左括号
    ui.hint = ui.touch ? hint.replaceAll(lp + 'F ', lp + tr('touch.tapTo')).replaceAll('(F to ', '(' + tr('touch.tapTo') + ' ') : hint
    ui.hintOk = pre.ok
  }

  openDialog(d: Omit<DialogState, 'idx'>) {
    ui.dialog = { ...d, idx: 0 }
    ui.panel = 'dialog'
  }

  // F 键：身边最近的对象；触屏点按时传入点中的那个（不被旁边更近的信箱、柜台抢走）
  interact(t: Target | null = interactTarget(this.s, this.near())) {
    const s = this.s
    if (!t) { this.mouse.fresh = true; return this.startUse() }
    if (t.kind === 'bed') { ui.sleepDay = s.day; ui.panel = 'sleep' }
    else if (t.kind === 'door') this.enterDoor(t.enter!, t.shop, t.name)
    else if (t.kind === 'mirror') ui.panel = 'look'
    else if (t.kind === 'desk') ui.panel = 'wish'
    else if (t.kind === 'museum') { progress(s, { type: 'interact', target: 'museum' }); ui.panel = 'museum' }
    else if (t.kind === 'nest') { const r = this.run(() => collectNest(s, Number(s.region.split(':')[2]))); if (r.ok) sfx('pickup', 0.6) }
    else if (t.kind === 'ship') {
      progress(s, { type: 'interact', target: 'shipping_bin' })
      ui.panel = 'ship'
    } else if (t.kind === 'well') {
      const pre = refill(s, true)
      if (!pre.ok) return this.toast(pre.msg!)
      this.r.playerGesture('water', pre.dur! + 0.2)
      progress(s, { type: 'interact', target: 'well' })
      this.act = { t: 0, wind: pre.dur!, total: pre.dur! + 0.2, done: false, run: () => refill(s), sound: 'plant' }
    } else if (t.kind === 'shop' || t.kind === 'smith' || t.kind === 'tackle' || t.kind === 'carpenter' || t.kind === 'ranch' || t.kind === 'clinic' || t.kind === 'station') {
      // 室内柜台与渔具屋自助柜
      const shop: ShopId = t.kind === 'shop' ? 'general' : t.kind
      if (t.kind === 'carpenter' && !isUnlocked(s, 'system:carpenter')) applyUnlock(s, 'system:carpenter') // 认识木工坊后可以下建筑订单
      if (t.kind === 'ranch' && !isUnlocked(s, 'system:ranch')) applyUnlock(s, 'system:ranch')
      progress(s, { type: 'interact', target: t.kind === 'station' ? 'station_counter' : t.kind })
      if (shopOpen(s, shop)) { ui.shop = shop; ui.panel = 'shop' }
      else if (shop === 'smith' && smithJobDone(s)) this.run(() => smithCollect(s)) // 13.4 铺外委托柜：闭店也能取件
      else this.toast(shopHours(shop))
    } else if (t.kind === 'kitchen') { ui.homeKitchen = s.region === 'in:house'; ui.panel = 'kitchen' }
    else if (t.kind === 'coop') { ui.home = t.home ?? (s.region.startsWith('in:') ? Number(s.region.split(':')[2]) || 0 : 0); ui.panel = 'coop' }
    else if (t.kind === 'silo' || t.kind === 'cabin' || t.kind === 'workshop') { ui.home = t.home ?? (s.region.startsWith('in:') ? Number(s.region.split(':')[2]) || 0 : 0); ui.panel = t.kind === 'silo' ? 'silo' : t.kind === 'cabin' ? 'chest' : 'workshop'; ui.machine = 0 }
    else if (t.kind === 'site') this.toast(tr('game.carpentersWorkUseMorning', t.name))
    else if (t.kind === 'project') {
      ui.project = t.project ?? ''
      progress(s, { type: 'interact', target: ({ bridge: 'bridge_site', windmill: 'windmill_site', station: 'station_counter', sluice: 'sluice_board' } as Record<string, string>)[ui.project] ?? ui.project })
      ui.panel = 'project'
    } else if (t.kind === 'sign') {
      progress(s, { type: 'interact', target: 'mine_sign' })
      this.toast(tr('game.mineSafetyNoticeEat'))
    }
    else if (t.kind === 'ent') {
      const a = entAction(s, t.ent)
      if (a === 'machine') { ui.machine = t.ent.id; ui.panel = 'machine' }
      else if (a === 'chest') { ui.machine = t.ent.id; ui.home = 0; ui.panel = 'chest' }
      else if (a === 'tree' || a === 'fire') { ui.machine = t.ent.id; ui.panel = a }
      else { this.run(() => a); this.changed() }
    }
    else if (t.kind === 'mail') {
      const id = s.mail[0]
      const q = id ? questDef(id) : undefined
      if (q) this.openDialog({ kind: 'letter', title: q.title, quest: id, lines: [q.intro] })
      else this.toast(tr('game.mailboxEmpty'))
    } else if (t.kind === 'board') {
      progress(s, { type: 'interact', target: 'notice_board' })
      this.openDialog({ kind: 'board', title: tr('game.noticeBoardTeachingBox'), lines: [tr('game.noticeBoardHoldsVillagers')] })
    } else if (t.kind === 'npc') {
      const ev = eventFor(s, t.npc)
      if (t.npc === 'laotao' && safetyReady(s)) {
        this.openDialog({ kind: 'safety', title: tr('game.mineSafetyLessonOld'), npc: 'laotao', lines: [] })
      } else if (ev) {
        this.openDialog({ kind: 'event', title: tr('game.friendshipEvent', NPC_DEFS[t.npc].name), npc: t.npc, lines: ev.steps.map((x) => x.text), choice: ev.choice })
      } else {
        const lines = npcLines(s, t.npc)
        this.run(() => talk(s, t.npc))
        this.openDialog({ kind: 'npc', title: t.name, npc: t.npc, lines })
      }
    } else if (t.kind === 'animal' && t.animal === -1) {
      if (this.run(() => petPet(s)).ok && s.pet) { sfx(PETS[s.pet.kind].happy, 0.7); this.r.playerGesture('pet', 0.8); petHappy(this.pet, s.x, s.z) }
      else if (s.pet) sfx(PETS[s.pet.kind].sound, 0.5)
    } else if (t.kind === 'bowl') {
      if (this.run(() => fillBowl(s)).ok) { sfx('eat', 0.5); if (this.pet) { this.pet.mode = 'eat'; this.pet.t = 3 } }
    } else if (t.kind === 'animal') {
      // 有奶/毛可取、背包里有对应工具时先挤奶剪毛，否则摸头
      const a = s.animals.find((x) => x.id === t.animal)
      const care = a && needsTool(a) && a.eggs > 0
      const r = this.run(() => (care ? careAnimal(s, t.animal) : petAnimal(s, t.animal)))
      if (r.ok && a) { sfx(care ? (needsTool(a) === 'milk' ? 'milk' : 'shear') : ANIMALS[a.kind].sound, 0.7); this.r.playerGesture(care ? 'pickup' : 'pet', 0.8) }
    } else if (t.kind === 'mine') {
      if (!mineOpen(s)) this.toast(tr('common.mineEntranceSealedNow'))
      else if (s.deepest >= 5 || s.parcel.length) ui.panel = 'mine'
      else this.goMine(1)
    } else if (t.kind === 'up' || t.kind === 'lift') {
      if (this.travel(leaveMine)) sfx('ladder', 0.7)
    } else if (t.kind === 'down') {
      if (this.travel(ladderDown)) sfx('ladder', 0.7)
    } else if (t.kind === 'booth') {
      const f = festivalNow(s)
      if (!f || f.over) this.toast(tr('game.todaysFestivalAlreadyOver'))
      else if (!f.cer && s.flags.includes(`fest:${f.id}:${year(s.day)}`)) this.toast(tr('game.youveAlreadyJoinedYear', f.game))
      else if (!f.canEnter) this.toast(tr('game.entry', f.game, clock(f.open), clock(f.entry)))
      else if (f.id === 'firefly' && fireflyFound(s) < 3) this.toast(tr('game.firstFindThreeLantern', fireflyFound(s)))
      else ui.panel = 'festival'
    } else if (t.kind === 'marker') {
      if (this.run(() => findMarker(s, t.home ?? 0)).ok) sfx('lantern', 0.6)
    }
  }
  // 在公共灶台做一份料理：关闭面板，播放 3 秒烹饪动作，结束时再校验并提交
  startCook(i: number) {
    const home = ui.homeKitchen
    const pre = cookCheck(this.s, i, home)
    if (!pre.ok) { this.toast(pre.msg!); sfx('ui_error', 0.4); return }
    ui.panel = ''
    this.r.playerGesture('plant', 3)
    sfx('craft', 0.5)
    this.act = { t: 0, wind: 3, total: 3.2, done: false, run: () => cook(this.s, i, home), sound: 'eat' }
  }
  // 进门（等于换地图）：商店与公共建筑按开门时间；自己的建筑随时可进；闭店时铁匠铺的委托柜在门外照常取件
  enterDoor(room: string, shop: string | undefined, name: string) {
    const s = this.s
    const kind = room.split(':')[1]
    const hours = INDOOR_HOURS[kind]
    if (shop && !shopOpen(s, shop as ShopId)) {
      if (shop === 'smith' && smithJobDone(s)) { this.run(() => smithCollect(s)); return false }
      this.toast(tr('fmt.labelValue', name, shopHours(shop as ShopId)))
      return false
    }
    if (!shop && hours && (s.min < hours[0] || s.min >= hours[1])) { this.toast(tr('game.closedRightNowOpen', name, clock(hours[0]), clock(hours[1]))); return false }
    const def = regionOf({ ...s, region: room as GameState['region'] } as GameState)
    if (!def || !this.travel((t) => moveTo(t, room as GameState['region'], def.spawn[0], def.spawn[1]))) return false
    sfx('door_wood_open', 0.6)
    return true
  }
  goMine(floor: number) {
    if (this.travel((t) => enterMine(t, floor))) { sfx('ladder', 0.7); ui.panel = '' }
  }

  eatSelected() {
    const r = this.run(() => eat(this.s, this.s.sel))
    if (r.ok) this.r.playerGesture('eat', 0.9)
  }

  // 睡眠或 02:00 昏倒/战败 → 日结 → 新日存档并保留前一日备份
  sleep(passedOut: boolean, dayId = this.s.day) {
    this.act = null
    this.charge = null
    this.endFishing()
    this.mouse.down = false
    this.keys.clear()
    if (!passedOut) progress(this.s, { type: 'interact', target: 'bed' })
    const r = endDaySafe(this.s, passedOut, dayId)
    if (r.error) {
      console.error('[日结]', r.error)
      this.toast(tr('game.somethingWentWrongEnding'))
      return
    }
    const sum = r.sum
    if (!sum) return
    this.save(true)
    sfx('dayend', 0.7)
    if (sum.total) sfx('coins', 0.8)
    ui.summary = sum
    ui.panel = 'summary'
    this.enterRegion()
  }

  // 25.5 存储失败：暂停并保留内存状态，引导导出
  save(newDay = false) {
    if (ui.readOnly) return false
    ui.saveOk = writeSlot(this.slot, this.s, newDay)
    if (!ui.saveOk) {
      this.toast(tr('game.saveFailedBrowserStorage'))
      if (!ui.panel) ui.panel = 'pause'
    }
    return ui.saveOk
  }

  // 在此接管：先夺取写锁，再读取最新存档，避免用本页的旧状态覆盖别处的进度
  async takeover() {
    if (!(await acquireLock(this.slot, lostLock, true))) return
    const fresh = readSlot(this.slot)
    if (fresh) Object.assign(this.s, fresh) // 原地替换，常驻界面持有的引用随之更新
    resetWildCache()
    this.keys.clear()
    ui.readOnly = false
    this.enterRegion()
  }

  resume() {
    ui.away = false
    this.acc = 0
    this.last = performance.now()
  }

  openMenu(tab: MenuTab) {
    if (ui.panel === 'menu' && ui.tab === tab) ui.panel = ''
    else if (!ui.panel || ui.panel === 'menu') {
      ui.tab = tab
      ui.panel = 'menu'
    }
  }

  // ---------- 输入 ----------
  onKey = (e: KeyboardEvent) => {
    if ((e.target as HTMLElement).closest?.('input,textarea,select')) return
    const k = e.key.toLowerCase()
    if (e.type === 'keyup') { this.keys.delete(k); return }
    if (this.travelling) return // 换区域加载中不接受操作
    const MENU: Record<string, MenuTab> = { b: 'bag', k: 'skills', l: 'quests', p: 'people', c: 'craft', m: 'map', n: 'farm' }
    if (MENU[k] && (!ui.panel || ui.panel === 'menu') && !ui.away) {
      this.openMenu(MENU[k])
      this.keys.clear()
      return
    }
    if (k === 'escape' && this.escape()) return
    // 界面打开时 Tab、空格、回车留给界面（Tab 在面板里循环）；只在游戏中拦下 Tab 与空格（翻滚）
    if (ui.panel || ui.away) { if (k === 'tab' && tabCycle(e.shiftKey)) e.preventDefault(); this.keys.clear(); this.mouse.down = false; return }
    if (k === 'tab' || k === ' ') e.preventDefault()
    this.keys.add(k)
    if (/^[0-9]$/.test(k)) {
      const i = k === '0' ? 9 : +k - 1
      if (i < this.s.hotbar && !this.fishing) { this.s.sel = i; this.changed(); sfx('ui_select', 0.35) }
    } else if (k === 'f') { if (!this.fishing) this.interact() } // F 交互（对话、信箱、商店……）
    else if (k === 'e') this.eatSelected() // E 食用选中的食物
    else if (k === ' ') this.rollNow()
    else if (k === 'q') this.r.rotate(-1)
    else if (k === 'r') this.r.rotate(1)
    else if (k === 'h') ui.panel = 'help'
  }
  // Esc / 手柄 B：取消规划、收竿、关面板；没有面板时打开暂停。返回 true 表示已处理完（不再当作按键）
  escape() {
    if (ui.plan && !ui.panel) { ui.plan = null; this.r.setPlan(null, true); return true }
    if (this.fishing && !ui.panel) { this.endFishing(tr('game.putAwayRod')); return true }
    if (ui.panel === 'dialog') ui.dialog = null
    ui.panel = ui.panel === 'summary' ? ui.panel : ui.panel ? '' : 'pause'
    return false
  }
  // ---------- 手柄（游戏中）：见 platform/gamepad.ts ----------
  private padMove: [number, number] = [0, 0]
  private padSprint = false
  private padLookT = 0
  private padA = false // 按住 A 时由手柄按下的“左键”：松开、断开或改用鼠标时都要放开
  padPlay(f: PadFrame) {
    const s = this.s
    this.padMove = f.move
    this.padSprint = f.held.has('rt')
    if (this.padA && !f.held.has('a')) { this.padA = false; this.mouse.down = false }
    if (!padActive) return
    // 镜头：右摇杆左右一推转 90°，上下缩放
    if (Math.abs(f.look[0]) > 0.7) { if (this.padLookT <= 0) { this.r.rotate(f.look[0] > 0 ? 1 : -1); this.padLookT = 0.4 } } else this.padLookT = 0
    this.padLookT -= 1 / 60
    if (Math.abs(f.look[1]) > 0.3) this.r.zoomBy(-f.look[1] * 0.25)
    if (ui.plan) {
      if (f.pressed.has('a')) { this.hover = this.frontTile(); this.confirmPlan() }
      if (f.pressed.has('b')) this.escape()
      return
    }
    if (f.pressed.has('b')) { this.escape(); return }
    if (f.pressed.has('start')) { ui.panel = 'pause'; return }
    if (f.pressed.has('y')) { this.openMenu('bag'); return }
    if (f.pressed.has('back')) { this.openMenu('map'); return }
    if (f.pressed.has('x') && !this.fishing) this.interact()
    if (f.pressed.has('lb') || f.pressed.has('rb')) {
      s.sel = (s.sel + (f.pressed.has('rb') ? 1 : s.hotbar - 1)) % s.hotbar
      this.changed()
      sfx('ui_select', 0.35)
    }
    if (f.pressed.has('lt')) this.rollNow()
    // A：和鼠标左键同一套（按住蓄力、拉弓、收线）
    if (f.pressed.has('a')) {
      unlockAudio()
      this.hover = this.frontTile()
      this.mouse.down = this.mouse.fresh = this.padA = true
      const tool = this.selectedTool()
      if (!this.fishing) {
        if (!this.act && (tool === 'hoe' || tool === 'can') && s.tools[tool] >= 1) this.charge = { t: 0, tool, tier: s.tools[tool], level: 0, dir: this.facingDir() }
        else if (!this.act) this.startUse()
      }
    }
  }
  // 手柄瞄准：角色面前的那一格
  private frontTile(): [number, number] {
    const s = this.s
    return [Math.floor(s.x + Math.sin(s.face) * 0.85), Math.floor(s.z + Math.cos(s.face) * 0.85)]
  }
  onMouse = (e: MouseEvent) => {
    if (performance.now() - this.lastTouch < 800) return
    if (e.type === 'mousemove') ui.touch = false
    if (e.type === 'mousedown') unlockAudio()
    this.mouse.x = e.clientX
    this.mouse.y = e.clientY
    if (e.type === 'mousedown' && ui.plan && this.running()) {
      if (e.button === 2) { ui.plan = null; this.r.setPlan(null, true) }
      else if (e.button === 0) { this.hover = this.r.pick(e.clientX, e.clientY); this.confirmPlan() }
      return
    }
    if (e.type === 'mousedown' && e.button === 2 && this.fishing && this.fishing.phase !== 'reel') this.endFishing(tr('game.putAwayRod'))
    if (e.type === 'mousedown' && e.button === 2 && this.charge) { this.charge = null; this.r.setArea(null) } // 右键取消蓄力，不提交
    else if (e.type === 'mousedown' && e.button === 2 && this.running() && !this.fishing && !this.act) {
      const h = this.r.pick(e.clientX, e.clientY)
      if (h) this.goTo(h[0], h[1]) // 右键：寻路走到该格
    }
    if (e.type === 'mousedown' && e.button === 0 && this.running()) {
      this.hover = this.r.pick(e.clientX, e.clientY)
      this.mouse.down = this.mouse.fresh = true
      const tool = this.selectedTool()
      if (this.fishing) return // 鱼讯确认与收线在模拟步里处理
      if (!this.act && (tool === 'hoe' || tool === 'can') && this.s.tools[tool] >= 1) {
        this.charge = { t: 0, tool, tier: this.s.tools[tool], level: 0, dir: this.facingDir() }
      } else if (!this.act) this.startUse() // 快速点击可能在两个模拟步之间就松开
    }
    if (e.type === 'mouseup' || (e.type === 'mousedown' && e.button === 2)) this.mouse.down = false
  }
  // 翻滚：朝移动方向（没在走就朝面前）
  rollNow() {
    const [dx, dz] = this.moveDir()
    if (!this.fishing && !this.act && roll(this.s, this.fighter, dx, dz)) { this.r.playerGesture('roll', COMBAT.roll); sfx('swing', 0.3); this.changed() }
  }

  // ---------- 触屏（星露谷手机版式，没有摇杆） ----------
  // 点地面：寻路走过去。点人、动物、门、柜台、机器、箱子：走近后交互。点石头、树、杂草、作物、耕地、地上的采集物：
  // 走近后用手上的东西（石头、树、杂草自动换上快捷栏里对应的工具）。点身边的空地：手上的工具能用就用（锄地、放置），
  // 远处的空地只走过去，不会一点就锄。按住身边目标：重复使用，升级过的锄头/水壶蓄力；按住后拖动：角色朝手指走。
  // 双指：缩放。拿着鱼竿或武器时，按下/松开与鼠标左键相同（蓄力抛竿、咬钩、收线、挥砍、拉弓），先转向手指方向
  private fingers = new Map<number, { x: number; y: number; x0: number; y0: number }>()
  private pinchD = 0
  private press: { mode: 'tap' | 'hold' | 'drag' | 'direct'; t0: number } | null = null
  private lastTouch = -1e9
  private touchTile: [number, number] | null = null
  private planTap: [number, number] | null = null
  // 走近再执行：near 为真时执行；目标会走动（居民）时 where 给出它现在的位置，走到了还没够着就重新寻路（最多 4 次），它进屋、离开就作罢
  private pending: { near: () => boolean; run: () => void; where?: () => [number, number] | null; tries?: number } | null = null
  onTouch = (e: PointerEvent) => {
    if (e.pointerType !== 'touch') return
    e.preventDefault()
    ui.touch = true
    this.lastTouch = performance.now()
    const f = this.fingers
    if (e.type === 'pointerdown') {
      unlockAudio()
      this.r.renderer.domElement.setPointerCapture?.(e.pointerId)
      f.set(e.pointerId, { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY })
      if (f.size === 2) { this.touchCancel(); const [a, b] = [...f.values()]; this.pinchD = Math.hypot(a.x - b.x, a.y - b.y) }
      else if (f.size === 1 && this.running()) this.touchDown(e.clientX, e.clientY)
      return
    }
    const p = f.get(e.pointerId)
    if (!p) return
    p.x = e.clientX
    p.y = e.clientY
    if (e.type === 'pointermove') {
      if (f.size === 2) {
        const [a, b] = [...f.values()]
        const d = Math.hypot(a.x - b.x, a.y - b.y)
        this.r.zoomBy((this.pinchD - d) / 40) // 双指张开放大、捏合缩小
        this.pinchD = d
      } else if (f.size === 1) {
        this.mouse.x = e.clientX
        this.mouse.y = e.clientY
        if (this.press?.mode === 'tap' && Math.hypot(p.x - p.x0, p.y - p.y0) > 16) { this.press.mode = 'drag'; this.pending = null; this.route = null }
      }
      return
    }
    f.delete(e.pointerId)
    if (f.size) return // 双指只松开一指：不当作点按
    const pr = this.press
    this.press = null
    this.mouse.down = false
    if (pr?.mode === 'tap' && e.type === 'pointerup' && this.running()) this.smartTap(e.clientX, e.clientY)
  }
  private touchCancel() {
    this.press = null
    this.mouse.down = false
    this.charge = null
    this.r.setArea(null)
  }
  private touchDown(x: number, y: number) {
    const s = this.s
    this.mouse.x = x
    this.mouse.y = y
    const p = this.r.pickPoint(x, y)
    const close = !!p && Math.hypot(p[0] - s.x, p[1] - s.z) < 3.5
    // 钓鱼中、拿着鱼竿、或拿着武器点身边：和按下鼠标左键一样
    if (!ui.plan && (this.fishing || (!this.act && close && (this.selectedTool() === 'rod' || weaponAtk(s) > 0)))) {
      if (!this.fishing && p && Math.hypot(p[0] - s.x, p[1] - s.z) > 0.2) s.face = Math.atan2(p[0] - s.x, p[1] - s.z)
      this.route = null
      this.pending = null
      this.press = { mode: 'direct', t0: performance.now() }
      this.mouse.down = this.mouse.fresh = true
      if (!this.fishing) this.startUse()
      return
    }
    this.press = { mode: 'tap', t0: performance.now() }
    this.touchTile = this.r.pick(x, y)
  }
  // 按住不动：身边的目标能用就重复使用（锄头、水壶升级后蓄力）；否则跟着手指走
  private touchHold() {
    const s = this.s
    const h = this.touchTile
    this.press!.mode = 'drag'
    if (!h || ui.plan || this.act || Math.hypot(h[0] + 0.5 - s.x, h[1] + 0.5 - s.z) > REACH) return
    this.autoTool(h)
    if (!useAt(s, h[0], h[1], true).ok) return
    this.press!.mode = 'hold'
    this.route = null
    this.pending = null
    this.hover = h
    s.face = Math.atan2(h[0] + 0.5 - s.x, h[1] + 0.5 - s.z)
    this.mouse.down = this.mouse.fresh = true
    const tool = this.selectedTool()
    if ((tool === 'hoe' || tool === 'can') && s.tools[tool] >= 1) this.charge = { t: 0, tool, tier: s.tools[tool], level: 0, dir: this.facingDir() }
    else this.startUse()
  }
  private smartTap(x: number, y: number) {
    const s = this.s
    const h = this.r.pick(x, y)
    const p = this.r.pickPoint(x, y)
    this.touchTile = this.hover = h
    // 规划建筑：第一下放预览，在同一处再点一下确认
    if (ui.plan) {
      if (h && this.planTap && h[0] === this.planTap[0] && h[1] === this.planTap[1]) { this.confirmPlan(); this.planTap = null }
      else this.planTap = h
      return
    }
    if (!h) return
    this.pending = null
    // 人与动物
    const who = p && this.near().map((n) => ({ n, d: Math.hypot(n.x - p[0], n.z - p[1]) })).filter((o) => o.d < 0.9).sort((a, b) => a.d - b.d)[0]?.n
    if (who) {
      const live = () => { const n = who.kind === 'npc' ? this.npcs.get(who.id as string) : who; return n && !('hidden' in n && n.hidden) ? n : null }
      const target: Target = who.kind === 'npc' ? { kind: 'npc', name: who.name, npc: who.id as string } : { kind: 'animal', name: who.name, animal: who.id as number }
      const pd = this.approach(h, () => { const n = live(); return !!n && Math.hypot(n.x - s.x, n.z - s.z) < (who.kind === 'npc' ? 1.3 : 1.0) }, () => this.interact(target))
      if (who.kind === 'npc') pd.where = () => { const n = live(); return n ? [n.x, n.z] : null }
      return
    }
    // 建筑（门、柜台、信箱、出货箱、床……）与可交互的放置物
    const b = regionOf(s).buildings.find((b) => b.act && h[0] >= b.x && h[0] < b.x + b.w && h[1] >= b.z && h[1] < b.z + b.d)
    const t = tileAt(s, h[0], h[1])
    const ent = t?.ent ? entsOf(s).find((e) => e.id === t.ent) : undefined
    if (b) return this.approach(h, () => Math.hypot(Math.max(b.x - s.x, 0, s.x - b.x - b.w), Math.max(b.z - s.z, 0, s.z - b.z - b.d)) <= 0.9,
      () => this.interact({ kind: b.act!, name: b.name, home: b.home, project: b.project, enter: b.enter, shop: b.shop }))
    if (ent && INTERACTIVE(ent) && !(ent.k === 'fruit_tree' && ent.fruit)) return this.approach(h, () => Math.hypot(ent.x + 0.5 - s.x, ent.z + 0.5 - s.z) - 0.5 <= 0.9,
      () => this.interact({ kind: 'ent', name: describeEnt(s, ent), ent }))
    // 有东西的格：走近后用手上的东西；用不了就只走到旁边
    if (t && (t.ob || t.crop || t.fo || t.till || ent)) {
      this.autoTool(h)
      if (this.canUseNear(h)) return this.approach(h, () => Math.hypot(h[0] + 0.5 - s.x, h[1] + 0.5 - s.z) <= REACH - 0.25, () => this.useTile(h))
      return this.goTo(h[0], h[1])
    }
    // 身边的空地：手上的工具或物品能用就用；远处只走过去
    if (useAt(s, h[0], h[1], true).ok) return this.useTile(h)
    this.goTo(h[0], h[1])
  }
  // 走到目标旁边（near 为真）再执行；已经在旁边就下一个模拟步执行
  private approach(h: [number, number], near: () => boolean, run: () => void) {
    const pd: NonNullable<Game['pending']> = { near, run }
    this.pending = pd
    if (!near()) this.goTo(h[0], h[1])
    return pd
  }
  private useTile(h: [number, number]) {
    this.hover = this.touchTile = h
    this.mouse.fresh = true
    if (!this.act) this.startUse()
  }
  // 点到石头、树、树桩、树枝、杂草：快捷栏里有对应工具就换上（星露谷手机版做法）
  private autoTool(h: [number, number]) {
    const k = tileAt(this.s, h[0], h[1])?.ob?.k
    if (!k) return
    const want = (OBSTACLES as Record<string, { tool: string }>)[k]?.tool ?? 'pick'
    if (this.selectedTool() === want) return
    const i = this.s.inv.slice(0, this.s.hotbar).findIndex((sl) => sl && ITEMS[sl.id].tool === want)
    if (i >= 0) { this.s.sel = i; this.changed() }
  }
  // 走到这一格旁边后，手上的东西能不能用（只换位置试算，不改状态）
  private canUseNear(h: [number, number]) {
    const s = this.s
    const ox = s.x, oz = s.z
    const d = Math.hypot(h[0] + 0.5 - ox, h[1] + 0.5 - oz) || 1
    s.x = h[0] + 0.5 + (ox - h[0] - 0.5) / d
    s.z = h[1] + 0.5 + (oz - h[1] - 0.5) / d
    try { return useAt(s, h[0], h[1], true).ok } finally { s.x = ox; s.z = oz }
  }
  onWheel = (e: WheelEvent) => {
    e.preventDefault()
    this.r.zoomBy(Math.sign(e.deltaY) * 1.5)
  }
  onContext = (e: Event) => e.preventDefault()
  onResize = () => this.r.resize()
  onAway = () => {
    if (document.hidden || !document.hasFocus()) { ui.away = true; this.keys.clear(); this.mouse.down = false }
  }
}

// ---------- 手柄轮询（整个页面一条，标题画面也能用） ----------
const MENU_ORDER: MenuTab[] = ['bag', 'skills', 'quests', 'people', 'farm', 'collection', 'craft', 'map']
let padLast = 0
let padWas = false
function padTick(now: number) {
  requestAnimationFrame(padTick)
  const dt = Math.min(0.1, (now - (padLast || now)) / 1000)
  padLast = now
  if (document.hidden) return
  const f = readPad(dt)
  if (!f) {
    // 手柄断开（或拔掉）：放开所有持续输入，不让角色接着走、接着蓄力
    if (padWas && game) game.padPlay({ move: [0, 0], look: [0, 0], held: new Set(), pressed: new Set() })
    padWas = false
    return
  }
  padWas = true
  if (padActive !== ui.pad) ui.pad = padActive
  if (game?.travelling) return
  if (game && ui.screen === 'game' && !ui.panel && !ui.away) return game.padPlay(f)
  if (game) game.padPlay({ ...f, move: [0, 0], pressed: new Set(), held: new Set() }) // 打开面板时停步
  if (ui.panel === 'menu' && (f.pressed.has('lb') || f.pressed.has('rb'))) {
    const i = MENU_ORDER.indexOf(ui.tab)
    ui.tab = MENU_ORDER[(i + (f.pressed.has('rb') ? 1 : MENU_ORDER.length - 1)) % MENU_ORDER.length]
    return
  }
  if (f.pressed.has('b')) {
    if (game && ui.screen === 'game') { game.escape(); return }
    const back = [...document.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.offsetParent && /^(返回|取消)/.test(b.textContent?.trim() ?? ''))
    back?.click()
    return
  }
  if (game && ui.screen === 'game' && f.pressed.has('start') && ui.panel === 'pause') { ui.panel = ''; return }
  uiNav(f)
}
if (typeof window !== 'undefined') requestAnimationFrame(padTick)
