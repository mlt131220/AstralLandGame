// 表现层：只读领域状态并绘制，不修改金币/物品/任务（设计 24.3）。
import * as THREE from 'three/webgpu'
import { abs, float, length, max, positionLocal, sin, smoothstep, time, uniform, uv, vec3 } from 'three/tsl'
import { CROPS, FOES, ITEMS, MACHINES, TOOLS, type ToolId } from '../content/content.ts'
import { NPC_LOOK } from '../content/story.ts'
import { jobBusy, jobDone } from '../core/actions.ts'
import type { Arena, Foe } from '../core/combat.ts'
import { t as tr } from '../core/i18n.ts'
type Loot = { id: string; n: number; x: number; z: number; t: number }
import type { NpcActor } from '../core/npcs.ts'
import { BASE_REGIONS, isWater } from '../core/regions.ts'
import { entsOf, isMature, newGame, rand, regionOf, season, tileAt, weather, type Building, type GameState, type RegionDef } from '../core/state.ts'
import { Actor, CLIPS, Creature, type Gesture, type Pose } from './actors.ts'
import { Batch, mergeByMaterial, extractParts, failed, getShared, loadGltf, sharedMaterial, type Part } from './assets.ts'
import {
  ANIMAL_MODELS, buildingModel, CHARACTER_MODELS, CLIFFS, CREATURES, cropModel, DECOR_MODELS, FLOWERS_BY_SEASON, FORAGE_MODELS, fruitTreeModel, G3_BUILDING_MODELS, GROUND_SEASONAL,
  decorModel, DECOR_MODELS_G4, interiorModel, ITEM_MODELS, TREE_MODELS, TREE_STAGES, treeModel, farTreeModel, FAR_TREE_MODELS, LAMP_PROPS, MINE_WALL_SETS, MINE_WALLS, OBSTACLE_MODELS, obstacleModels, paletteColor, PROP_MODELS, ROD_TIP, ROOM_WALLS, SEASONAL_MATERIALS, seasonalPath,
  SHOT_MODELS, THEMED_MODELS, toolModel, wallModel, type ModelDef,
} from './models.ts'
import { ANIMALS, FRUIT_TREES } from '../content/content.ts'
import { DECOR_BY_ID, SURFACES, WALL_MOUNT, WALL_SIDES, WILD_GROW } from '../content/g4.ts'
import { adult, needsTool, type AnimalActor } from '../core/animals.ts'
import { petModel, petScale, type PetActor } from '../core/pets.ts'
import { fireLit, sprinklerConnected, treeMature, waterNetwork } from '../core/placeables.ts'
import { BRIDGE, FARM_W, treeSpecies } from '../core/regions.ts'
import { Fx, type FxKind } from './fx.ts'
import { cutout, occDir, occPlayer } from './occlusion.ts'
import { MARGIN, setCaveTheme, setRoomStyle, Terrain } from './terrain.ts'
import { Weather } from './rain.ts'
import { INTERIOR_PROPS, ROOM_STYLES, STATEFUL_PROPS, WALL_IN } from '../core/interiors.ts'
import { graphics, okColor } from '../platform/settings.ts'

const CLIFF_H = 2.2 // 山崖岩块的统一高度（倍数）
const STAGES = ['stage0', 'stage1', 'stage2', 'stage3', 'dead'] as const
const _c = new THREE.Color()
const _p = new THREE.Vector3()
const _v = new THREE.Vector3()
const _m = new THREE.Matrix4()
const _q = new THREE.Quaternion()
const _s = new THREE.Vector3()

// 植物随风轻摆：按顶点高度加权，在实例化之后的网格空间偏移。同一幅度共用一个节点（节点对象不同着色器缓存键就不同，见 assets.ts Batch）
const swayNodes = new Map<number, THREE.Node>()
function sway(mat: THREE.MeshStandardNodeMaterial, amount: number) {
  let n = swayNodes.get(amount)
  if (!n) {
    const h = max(positionLocal.y, float(0))
    const phase = time.mul(1.6).add(positionLocal.x.mul(0.6)).add(positionLocal.z.mul(0.45))
    swayNodes.set(amount, (n = positionLocal.add(vec3(sin(phase).mul(amount).mul(h), 0, sin(phase.mul(0.8).add(1.3)).mul(amount * 0.6).mul(h)))))
  }
  mat.positionNode = n
}

// 每帧由游戏层传入的运行时实体（居民、敌人、掉落、鸡、钓鱼）
export interface View {
  npcs: NpcActor[]
  foes: Foe[]
  loot: Loot[]
  chickens: AnimalActor[]
  pet?: PetActor | null
  bobber: [number, number] | null // 浮漂位置
  bite: boolean
  arena?: Arena // 弹体与地面预警区
  draw?: number // 轻弓蓄力秒数
}
const EMPTY: View = { npcs: [], foes: [], loot: [], chickens: [], bobber: null, bite: false }
// 敌人状态 → 动画片段（按顺序取模型里存在的第一个）
const FOE_CLIP: Record<string, string[]> = {
  idle: ['idle'], chase: ['walk', 'move', 'fly', 'hop', 'idle'], crouch: ['crouch', 'telegraph'], pounce: ['pounce', 'attack'], recover: ['idle'],
  telegraph: ['telegraph', 'charge_up', 'idle'], charge: ['charge', 'walk'], stun: ['stun', 'tired', 'idle'], hurt: ['hit'], dead: ['die'],
  guard: ['guard', 'idle'], open: ['open', 'telegraph'], attack: ['attack', 'slam', 'shoot'], telegraph2: ['telegraph2', 'telegraph'], attack2: ['attack2', 'attack'],
  swoop: ['attack', 'fly'], roar: ['roar', 'telegraph'], vent: ['vent', 'attack'], tired: ['tired', 'stun', 'idle'], summon: ['summon', 'attack'],
}
// 地面预警区配色：预警阶段暗淡，生效时明亮
const ZONE_COLOR: Record<string, number> = { rock: 0xff7040, heat: 0xff5a20, spike: 0x7ae0ff, frost: 0x9ad8ff, spore: 0xb0e060, shock: 0xffc040, slam: 0xff8040 }

export class WorldRenderer {
  renderer: THREE.WebGPURenderer
  scene = new THREE.Scene()
  camera = new THREE.OrthographicCamera()
  sky = new THREE.Color()
  regionKey = ''
  backend = ''
  zoom = 16 // 7.1 可视高度 12—24 米
  rot = 0
  az = Math.PI / 4
  orbit = false // 标题背景：镜头缓慢环绕
  // 后台还在逐个区域预编译时（每个区域会占住主线程 50—130 ms）标题镜头先不动，静止画面看不出卡顿；做完再缓缓转起来
  calm = false
  private spin = 0
  target = new THREE.Vector3()

  private host: HTMLElement
  private terrain: Terrain | null = null
  private def: RegionDef | null = null
  // ponytail: 试过 WebGPU 渲染包（BundleGroup）省 CPU，但 three r186 回放时不刷新随相机变化的矩阵，镜头一动建筑和树就停在屏幕上不动；升级 three 后再试
  private statics = new THREE.Group() // 区域静态：建筑、摆件、外圈树林
  private dyn = new THREE.Group() // 随状态变化：障碍、作物、耕地、草丛
  private lootGroup = new THREE.Group()
  private batches = new Map<string, Batch>()
  private parts = new Map<string, Part[] | null>()
  private cropParts = new Map<string, (Part[] | null)[]>()
  private seasonApplied = -1
  private player: Actor | null = null
  private playerLook = ''
  private npcs = new Map<string, Actor>()
  private npcPending = new Set<string>()
  private foes = new Map<number, Creature>()
  private chickens = new Map<number, Creature>()
  private pets = new Map<number, Creature>()
  private pending = new Set<string>()
  private lootMeshes = new Map<Loot, THREE.Object3D>()
  private hover: THREE.Mesh
  private area: THREE.InstancedMesh
  private clipInfo: Record<string, { duration: number; impact: number | null }> = {}
  private weather = new Weather() // 雨雪：计算着色器粒子（rain.ts）
  private sun = new THREE.DirectionalLight(0xffffff, 2.4)
  private hemi = new THREE.HemisphereLight(0xeaf4ff, 0x6a5a3a, 1.1)
  private torch = new THREE.PointLight(0xffc68a, 0, 8, 1.4) // 矿洞里玩家身上的提灯
  private ray = new THREE.Raycaster()
  private plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
  private cropMat = new THREE.MeshStandardNodeMaterial({ vertexColors: true, roughness: 0.85, flatShading: true })
  private fxs = new Fx()
  // 灯光数量固定（12 盏灯 + 提灯）：灯光数量变化会让所有材质重新编译，切换区域时卡顿数秒
  private lamps: THREE.PointLight[] = Array.from({ length: 12 }, () => new THREE.PointLight(0xffb560, 0, 9, 1.6))
  private lampOn = 0
  private glows: THREE.InstancedMesh
  private glowLevel = uniform(0)
  private wallRot = -1
  private bobber: THREE.Mesh
  private line: THREE.Line
  private dustT = 0
  private flashT = 0 // 雷雨闪电
  lightning() {
    if (!graphics.reduceFlash) this.flashT = 0.35
  }
  private planMesh: THREE.InstancedMesh
  private scenes = new Map<string, THREE.Object3D>() // 放置物的原始场景，用来按子节点生成变体
  private discs: THREE.InstancedMesh
  private sectors: THREE.InstancedMesh
  private shotPool = new Map<string, THREE.Group[]>()
  private shotUsed: THREE.Group[] = []

  constructor(host: HTMLElement) {
    this.host = host
    this.renderer = new THREE.WebGPURenderer({ antialias: true, trackTimestamp: new URLSearchParams(location.search).has('perf') }) // ?perf 实测时记录显卡耗时
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)) // 27.1 DPR 上限 1.5
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFShadowMap
    this.renderer.toneMapping = THREE.NeutralToneMapping
    host.appendChild(this.renderer.domElement)
    this.scene.background = this.sky
    // 场景矩阵每帧只在 frame() 里更新一次（three 默认主视图、阴影通道各遍历一遍整个场景）；合批容器不动，不用每帧重算
    this.scene.matrixWorldAutoUpdate = false
    for (const g of [this.statics, this.dyn]) g.matrixAutoUpdate = false
    // 阴影图隔帧重画（见 frame）
    this.sun.shadow.autoUpdate = false
    sway(this.cropMat, 0.025)

    // 悬停格：描边 + 淡填充
    const hm = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false })
    const d = max(abs(uv().x.sub(0.5)), abs(uv().y.sub(0.5)))
    hm.opacityNode = smoothstep(0.4, 0.46, d).mul(0.85).add(0.12)
    this.hover = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), hm)
    this.hover.renderOrder = 2
    // 蓄力范围预览：最多 3×5 格
    const am = hm.clone()
    am.color.set(0xa8e6ff)
    this.area = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.96, 0.96).rotateX(-Math.PI / 2), am, 15)
    this.area.count = 0
    this.area.frustumCulled = false
    this.area.renderOrder = 2


    // 钓鱼浮漂与鱼线
    const bob = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), new THREE.MeshStandardNodeMaterial({ color: 0xe8483a, roughness: 0.5 }))
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.092, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardNodeMaterial({ color: 0xf4f1ea }))
    bob.add(cap)
    this.bobber = bob
    this.bobber.visible = false
    this.line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicNodeMaterial({ color: 0xf4f4f4, transparent: true, opacity: 0.8 }))
    this.line.frustumCulled = false
    this.line.visible = false

    this.sun.castShadow = true
    this.sun.shadow.mapSize.set(2048, 2048)
    this.sun.shadow.bias = -0.0004
    this.sun.shadow.normalBias = 0.03
    Object.assign(this.sun.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26, near: 1, far: 90 })
    const gm = new THREE.MeshBasicNodeMaterial({ color: 0xffc070, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })
    gm.opacityNode = this.glowLevel.mul(smoothstep(float(0.5), float(0.05), length(uv().sub(0.5))))
    this.glows = new THREE.InstancedMesh(new THREE.PlaneGeometry(1.4, 1.4), gm, 12)
    this.glows.count = 0
    this.glows.frustumCulled = false
    this.glows.renderOrder = 4
    // 建造规划：占地格绿/红预览
    const pm = hm.clone()
    this.planMesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.94, 0.94).rotateX(-Math.PI / 2), pm, 64)
    this.planMesh.count = 0
    this.planMesh.frustumCulled = false
    this.planMesh.renderOrder = 2
    this.scene.add(this.planMesh)
    // 地面预警区：圆形与扇形（叠加混合，按颜色明暗区分预警/生效）
    const zm = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })
    const zd = length(uv().sub(0.5)).mul(2)
    zm.opacityNode = smoothstep(0.82, 1.0, zd).mul(0.9).add(0.28).mul(smoothstep(1.02, 0.98, zd))
    this.discs = new THREE.InstancedMesh(new THREE.CircleGeometry(1, 40).rotateX(-Math.PI / 2), zm, 48)
    this.sectors = new THREE.InstancedMesh(new THREE.CircleGeometry(1, 24, -Math.PI / 4, Math.PI / 2).rotateX(-Math.PI / 2), zm.clone(), 16)
    for (const m of [this.discs, this.sectors]) { m.count = 0; m.frustumCulled = false; m.renderOrder = 3 }
    this.scene.add(this.discs, this.sectors)
    this.scene.add(this.statics, this.dyn, this.lootGroup, this.hover, this.area, this.weather.group, this.fxs.mesh, this.sun, this.sun.target, this.hemi, this.torch, this.bobber, this.line, this.glows, ...this.lamps)
    this.resize()
  }

  async init() {
    await this.renderer.init()
    const be = this.renderer.backend as { isWebGPUBackend?: boolean; device?: { lost?: Promise<unknown> } }
    // 首发只支持 WebGPU（决策 D06）：拿不到 WebGPU 适配器时 three 会退回 WebGL2，这里直接拒绝
    if (!be.isWebGPUBackend) throw new Error(tr('render.noGpuAdapter'))
    this.backend = 'WebGPU'
    // 显卡设备丢失（驱动重置、休眠唤醒、显存不足）：通知上层暂停并保存（设计 T22）
    be.device?.lost?.then(() => this.onLost?.())
  }
  onLost: (() => void) | null = null

  // ---------- 分阶段加载（设计 27.3、DCR19） ----------
  // 标题页只等标题场景要用的模型；其余在后台按优先级加载：存档所在区域 → 按出口由近到远的区域 → 其余全部。
  // 搭场景时用到却还没加载的模型都记进 miss（need）：读档、换区域前用 ensure 补齐；平时搭场景碰到就后台补上再重搭（late）
  private dry = false
  private probes: { id: string; to: string[]; need: Map<string, () => Promise<unknown>>; s: GameState; done?: boolean }[] = []
  private busy = new Map<string, Promise<unknown>>()
  private once(path: string, f: () => Promise<unknown>) {
    let p = this.busy.get(path)
    if (!p) this.busy.set(path, (p = f().catch((e) => console.warn('[assets]', path, e)).finally(() => this.busy.delete(path))))
    return p
  }
  // 启动时（模型都还没加载，搭一遍很快）按存档和各区域的演示状态把场景搭一遍，记下每个区域要用的模型和通往哪些区域
  probe(save: GameState | null) {
    const demo = newGame('', '', 1, 7)
    demo.day = save?.day ?? 1 // 按最近存档的季节探查（树、野花、草丛随季节换模型）
    const plan: [GameState['region'], number][] = [['farm', 0], ['town', 0], ['river', 0], ['forest', 0], ['mountain', 0], ['deepforest', 0], ['wetland', 0], ['highland', 0],
      ['in:house', 0], ['in:general', 0], ['mine', 1], ['mine', 5], ['mine', 12], ['mine', 23], ['mine', 30]]
    const states = plan.map(([region, floor]) => {
      const s = structuredClone(demo)
      s.region = region
      s.floor = floor
      ;[s.x, s.z] = regionOf(s).spawn
      return s
    })
    this.dry = true
    for (const s of save ? [save, ...states] : states) {
      this.check(s)
      this.probes.push({ id: s.region, to: [...this.def!.exits.map((e) => e.to), ...(s.region === 'mountain' ? ['mine'] : [])], need: new Map(this.miss), s })
    }
    this.dry = false
    this.regionKey = ''
  }
  // 读档、换区域前：把这个状态的场景要用的模型补齐（含搭好才知道要的，如崖顶的树），返回仍缺的（加载失败）
  async ensure(s: GameState, onProgress?: (f: number) => void) {
    this.hold++
    try {
      let miss = this.check(s)
      for (let round = 0; round < 4 && miss.length; round++) {
        const todo = [...this.miss]
        let done = 0
        await Promise.all(todo.map(([p, f]) => this.once(p, f).then(() => onProgress?.(++done / todo.length))))
        miss = this.check(s)
        if (miss.every((p) => failed.has(p))) break
      }
      return miss
    } finally { this.hold-- }
  }
  // 后台加载，同时最多 4 个（给急用的留出连接）。区域按玩家当前所在区域（标题页上按最近的存档）由近到远，
  // 每个区域的模型到齐后在标题页上预编译；最后补齐其余全部模型、建好居民与生物的对象池
  async background() {
    for (let p; (p = this.nextProbe()); p.done = true) {
      await pool([...p.need].map(([path, f]) => () => this.once(path, f)), 4)
      await this.precompile(p.s)
    }
    this.calm = true
    await pool(this.allModels(), 4)
    await this.warmActors()
  }
  // 第一次画一个区域要构建它独有材质的着色器（合批已共用着色器，见 assets.ts Batch；浏览器着色器缓存是空的时候仍要 1—3 秒）。
  // 标题页上（镜头环绕、没在读档）：在同一段同步代码里把这个区域搭起来交给 compileAsync、再搭回标题场景——画面不闪，
  // 编译在后台进行；之后第一次去这个区域只剩阴影通道的少量编译。游戏中不做（来回重搭会卡一下）
  private async precompile(s: GameState) {
    const cur = this.last
    if (!this.orbit || this.hold || !cur) return
    this.check(s)
    const done = this.compileLit()
    this.regionKey = ''
    this.sync(cur)
    await done
  }
  private nextProbe() {
    const seen: string[] = [(this.orbit ? this.probes[0]?.id : this.def?.id) ?? 'farm']
    for (let i = 0; i < seen.length; i++) {
      const hit = this.probes.find((p) => !p.done && p.id === seen[i])
      if (hit) return hit
      for (const p of this.probes) if (p.id === seen[i]) for (const t of p.to) if (!seen.includes(t)) seen.push(t)
    }
    return this.probes.find((p) => !p.done)
  }
  // 平时搭场景碰到还没加载的模型：后台补上，到齐后按最近一次的状态重搭（读档、换区域进行中不插手）
  private last: GameState | null = null
  private hold = 0
  private lateP: Promise<void> | null = null
  private late() {
    this.lateP ??= Promise.resolve().then(async () => {
      await Promise.all([...this.miss].filter(([p]) => !failed.has(p)).map(([p, f]) => this.once(p, f)))
      this.lateP = null
      if (this.last && !this.hold) { this.regionKey = ''; this.sync(this.last) }
    })
  }
  async loadClips() {
    this.clipInfo = await fetch('/assets/models/characters/manifest.json').then((r) => (r.ok ? r.json() : null)).then((m) => m?.clips ?? {}).catch(() => ({}))
  }
  // 全部会用到的模型（原先启动时整包预载的清单），后台最后一轮补齐
  private allModels(): (() => Promise<unknown>)[] {
    const regions = BASE_REGIONS()
    const defs: ModelDef[] = [
      ...Object.values(OBSTACLE_MODELS).flat(), ...Object.values(DECOR_MODELS).flat(), ...Object.values(PROP_MODELS),
      ...Object.values(FORAGE_MODELS), ...Object.values(ITEM_MODELS), ...MINE_WALLS, ...CLIFFS, ...THEMED_MODELS, ...Object.values(SHOT_MODELS),
      ...regions.flatMap((r) => r.buildings.filter((b) => b.model !== '').map((b) => this.buildingDef(b))), ...G3_BUILDING_MODELS,
      { path: 'models/buildings/coop.glb', scale: 1 }, { path: 'models/buildings/barn.glb', scale: 1 },
      { path: 'models/g2/ladder_up.glb', scale: 1 }, { path: 'models/g2/ladder_down.glb', scale: 1 }, { path: 'models/g2/elevator.glb', scale: 1 },
      ...TREE_MODELS, ...FAR_TREE_MODELS, ...DECOR_MODELS_G4, ...INTERIOR_PROPS.filter((m) => !STATEFUL_PROPS.includes(m)).map(interiorModel), ...ROOM_STYLES.flatMap((st) => [...ROOM_WALLS, 'door'].map((v) => wallModel(st, v))),
    ]
    const crops = Object.keys(CROPS)
    // 放置物与果树按子节点出变体：保留原始场景
    const sceneDefs = [...Object.values(ITEM_MODELS), ...Object.keys(FRUIT_TREES).flatMap((t) => [1, 2].map((k) => fruitTreeModel(t, k))), fruitTreeModel('', 0), ...STATEFUL_PROPS.map(interiorModel)]
    for (const d of [...defs]) for (let se = 1; se < 4; se++) { const p = seasonalPath(d.path, se); if (p !== d.path) defs.push({ path: p, scale: d.scale }) }
    defs.push(...FLOWERS_BY_SEASON.flat(), ...Object.values(GROUND_SEASONAL).flat())
    return [
      ...defs.map((d) => () => this.once(d.path, () => this.prepare(d))),
      ...crops.map((id) => () => this.once(cropModel(id).path, () => this.prepareCrop(id))),
      ...sceneDefs.map((d) => () => this.loadScene(d.path)), // 与上面同路径的模型共用一次下载解析（loadGltf 缓存），不能按路径去重
      ...[...new Set([...Object.values(ANIMAL_MODELS), ...Object.values(CREATURES), ...Object.values(FOES).map((f) => f.model)])].map((p) => () => loadGltf(p)),
    ]
  }

  // three 的 compileAsync 对整个场景是逐个对象串行等管线（标题场景约 150 个对象要 4 秒，期间标题背景是空的）。
  // 改成每个网格各发一次：各自的遍历在这一刻同步完成（之后马上重搭场景也不影响），管线编译交给显卡进程并行做
  private compileAll() {
    this.scene.updateMatrixWorld() // 视锥剔除要用到最新的位置
    const objs: THREE.Object3D[] = []
    this.scene.traverseVisible((o) => { if ((o as THREE.Mesh).isMesh) objs.push(o) })
    return Promise.all(objs.map((o) => this.renderer.compileAsync(o, this.camera, this.scene)))
  }

  // 进场景前（标题、读档、第一次到某个区域）：把这个状态的场景先编译好，连同对象池里闲置的居民与生物（放进视野才不会被剔除）。
  // 不做这一步，读一个经营很久的存档进农场会冻住 3—6 秒（满载农场一次要编译约 300 条管线）
  private warm = new Set<string>()
  private warmKey() { return (this.def!.dark ? 'mine:' + this.def!.theme : this.def!.key) + '|' + this.seasonApplied }
  isWarm() { return !!this.def && this.warm.has(this.warmKey()) }
  // 依次进行（标题场景还在编译时就点了继续：排在后面，画布显隐不打架）
  private warmQ: Promise<unknown> = Promise.resolve()
  warmState(s: GameState) {
    const p = this.warmQ.then(() => this.warmNow(s))
    this.warmQ = p.catch(() => {})
    return p
  }
  private async warmNow(s: GameState) {
    const canvas = this.renderer.domElement
    canvas.style.visibility = 'hidden'
    this.hold++
    const idle = [...this.npcPool.values(), ...[...this.creaturePool.values()].flat()].filter((a) => !a.root.parent)
    try {
      this.build(s)
      const key = this.warmKey()
      this.target.set(s.x, 0, s.z)
      for (const a of idle) { a.root.position.copy(this.target); this.scene.add(a.root) }
      await this.compileLit() // 主通道在后台编译（白天、夜间两套光源），不卡界面
      this.frame(s, s.x, s.z, 0.016, null, true) // 阴影通道的变体在真正渲染时才编译
      await new Promise((r) => requestAnimationFrame(r))
      this.warm.add(key)
    } finally {
      for (const a of idle) a.root.removeFromParent()
      canvas.style.visibility = ''
      this.hold--
    }
  }

  // ---------- 场景资源屏障（L05） ----------
  // 搭场景时用到、却还没加载或没加载成（缺文件；离线包不完整又断网）的模型 → 加载它的办法
  private miss = new Map<string, () => Promise<unknown>>()
  private checking = false
  private need(path: string, load?: () => Promise<unknown>, have = this.parts.has(path)) {
    if (have && !failed.has(path)) return
    this.miss.set(path, load ?? (() => { if (failed.has(path)) this.parts.delete(path); return this.prepare({ path, scale: 1 }) }))
    if (!have && !failed.has(path) && !this.checking) this.late()
  }
  // 按这个状态把场景整个搭一遍（含岩壁、室内墙、矿洞弹体），返回用到却还没加载或没加载成的模型；搭好的场景留着，提交后不用重搭
  check(s: GameState): string[] {
    this.miss.clear()
    this.regionKey = ''
    this.checking = true
    try {
      this.build(s)
      if (this.def!.dark) {
        this.buildWalls(this.def!)
        for (const d of Object.values(SHOT_MODELS)) this.need(d.path)
      }
      if (this.def!.indoor) this.buildRoom(this.def!)
    } finally { this.checking = false }
    return [...this.miss.keys()]
  }
  // 重新请求缺的模型（失败不会被记住，联网后就能取到）；返回仍缺的个数。补上的模型在下次搭场景时用上
  private repairing: Promise<number> | null = null
  repair(): Promise<number> {
    return (this.repairing ??= (async () => {
      await Promise.all([...this.miss.values()].map((f) => f()))
      const left = [...this.miss.keys()].filter((p) => failed.has(p)).length
      this.regionKey = ''
      this.repairing = null
      return left
    })())
  }

  private buildingDef(b: Building): ModelDef {
    return b.model ? { path: b.model, scale: 1 } : buildingModel(b.id)
  }

  // 动作时长与命中时刻：取角色清单里实际使用的片段（缺失时用通用值）
  private clipOf(g: Gesture) {
    return CLIPS[g].map((c) => this.clipInfo[c]).find(Boolean)
  }
  gestureTime(g: Gesture) {
    return this.clipOf(g)?.duration ?? (g === 'water' ? 0.7 : 0.5)
  }
  gestureImpact(g: Gesture) {
    const c = this.clipOf(g)
    return c?.impact ?? (c ? c.duration * 0.6 : 0.3)
  }

  setArea(tiles: [number, number][] | null) {
    this.area.count = 0
    for (const [x, z] of tiles ?? []) this.area.setMatrixAt(this.area.count++, _m.makeTranslation(x + 0.5, 0.07, z + 0.5))
    this.area.instanceMatrix.needsUpdate = true
  }

  // 发光材质（矿灯、发光苔）自发光
  private glowify(parts: Part[]) {
    for (const p of parts) for (const m of [p.material].flat()) {
      if (m.name !== 'glow') continue
      const sm = m as THREE.MeshStandardMaterial
      sm.emissive?.copy(sm.color)
      sm.emissiveIntensity = 1.6
    }
  }
  private async prepare(def: ModelDef): Promise<Part[] | null> {
    if (this.parts.has(def.path)) return this.parts.get(def.path)!
    const gltf = await loadGltf(def.path)
    // 山崖岩块顶上的草皮单独用一份材质：不跟着草丛随风摆（否则草皮和岩壁错开、一直在动）
    const cliff = def.path.includes('/cliff_')
    const parts = gltf ? this.finish(extractParts(gltf.scene, { remap: cliff ? (m) => (m.name === 'grass' ? sharedMaterial('cliffGrass', paletteColor('grass', 0)!) : undefined) : undefined, palette: (n) => paletteColor(n, 0), center: !def.path.startsWith('models/buildings') && !def.path.startsWith('models/g2/mine_entrance') && !def.path.startsWith('models/g3/buildings') })) : null
    this.parts.set(def.path, parts)
    if (cliff && parts) {
      const top = parts.filter((p) => (p.material as THREE.Material).name === 'cliffGrass')
      const body = parts.filter((p) => !top.includes(p))
      const h = Math.max(...body.map((p) => { p.geometry.computeBoundingBox(); return p.geometry.boundingBox!.max.y }))
      if (top.length && body.length) this.cliffCaps.set(def.path, { top, body, h })
    }
    return parts
  }
  private finish(raw: Part[]) {
    const parts = mergeByMaterial(raw)
    this.glowify(parts)
    cutout(parts) // 挡住角色时镂空淡化
    for (const p of parts) for (const m of [p.material].flat()) {
      // 花瓣、花心与草叶同幅摆动，花不会和茎分开
      const flower = m.name.startsWith('petal_') || m.name === 'flower_center'
      if ((flower || ['grass', 'leafsGreen', 'leafsDark', 'leafsFall'].includes(m.name)) && !(m as THREE.MeshStandardNodeMaterial).positionNode)
        sway(m as THREE.MeshStandardNodeMaterial, m.name === 'grass' || flower ? 0.08 : 0.012)
    }
    return parts
  }
  // 按子节点显隐/旋转生成模型变体（机器工作中、营火点燃、果树挂果、栅栏连接……），结果缓存
  private variantCache = new Map<string, Part[] | null>()
  private cliffCaps = new Map<string, { top: Part[]; body: Part[]; h: number }>() // 山崖岩块：草皮、岩体与岩体高度
  private variant(path: string, hide: string[], turn: string[] = []): Part[] | null {
    this.need(path, () => this.loadScene(path), this.scenes.has(path))
    const key = path + '#' + hide.join(',') + '|' + turn.join(',')
    if (this.variantCache.has(key)) return this.variantCache.get(key)!
    const scene = this.scenes.get(path)
    if (!scene) return null
    const copy = scene.clone()
    for (const n of hide) copy.getObjectByName(n)?.removeFromParent()
    for (const n of turn) { const o = copy.getObjectByName(n); if (o) o.rotation.y -= Math.PI / 2 }
    const parts = this.finish(extractParts(copy, { palette: (n) => paletteColor(n, 0) }))
    this.variantCache.set(key, parts)
    return parts
  }
  private async loadScene(path: string) {
    const g = this.scenes.has(path) ? null : await loadGltf(path)
    if (g) this.scenes.set(path, g.scene)
  }

  private async prepareCrop(id: string) {
    if (this.cropParts.has(id) && !failed.has(cropModel(id).path)) return
    const gltf = await loadGltf(cropModel(id).path)
    const stages = STAGES.map((name) => {
      const node = gltf?.scene.getObjectByName(name)
      if (!node) return null
      const holder = new THREE.Group().add(node.clone().translateX(0))
      holder.children[0].position.set(0, 0, 0)
      return mergeByMaterial(extractParts(holder, { remap: () => this.cropMat }))
    })
    this.cropParts.set(id, stages)
  }

  private batch(key: string, parts: Part[] | null | undefined, group = this.dyn, shadow = true, cull = false) {
    if (!parts) return null
    let b = this.batches.get(key)
    if (!b) {
      b = new Batch(parts, group, 8, shadow)
      b.cull = cull
      this.batches.set(key, b)
    }
    return b
  }
  private place(def: ModelDef, prefix: string, x: number, z: number, rot = 0, s = 1, group = this.dyn, color?: THREE.Color, sy = s, y = 0, shadow = true, cull = false) {
    const se = this.def?.dark ? 0 : Math.max(0, this.seasonApplied)
    const sp = seasonalPath(def.path, se)
    const path = this.parts.get(sp) ? sp : def.path
    this.need(sp)
    this.need(def.path)
    this.batch(prefix + path, this.parts.get(path), group, shadow, cull)?.addAt(x, y, z, rot, def.scale * s, def.scale * sy, def.scale * s, color)
  }

  private appliedScale = 0
  resize() {
    this.appliedScale = graphics.scale
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5) * graphics.scale) // 27.1 DPR 上限 1.5，可再降分辨率
    const w = this.host.clientWidth || innerWidth
    const h = this.host.clientHeight || innerHeight
    this.renderer.setSize(w, h)
    const c = this.camera
    c.top = this.zoom / 2
    c.bottom = -this.zoom / 2
    c.left = (-this.zoom / 2) * (w / h)
    c.right = (this.zoom / 2) * (w / h)
    c.near = 0.1
    c.far = 220
    c.updateProjectionMatrix()
    this.viewR = (this.zoom / 2) * (w / h) + this.zoom * 0.71 + 3
  }
  zoomBy(d: number) {
    this.zoom = Math.min(24, Math.max(12, this.zoom + d))
    this.resize()
  }
  rotate(d: number) {
    this.rot += d
  }

  // ---------- 区域静态内容 ----------
  private buildRegion(s: GameState, r: RegionDef, key: string) {
    // 静态合批常驻，只清空实例：新建实例化网格要重新生成着色器，切换区域会卡顿
    for (const [k, b] of this.batches) if (k.startsWith('s:') || k.startsWith('w:')) b.reset()
    for (const o of [...this.statics.children]) if (!o.userData.batch) {
      o.removeFromParent()
      ;(o as THREE.Mesh).geometry?.dispose()
    }
    this.def = r
    if (r.dark) setCaveTheme(r.theme ?? 0)
    if (r.indoor) setRoomStyle(r.indoor)
    if (!this.dry) { // 启动探查只要知道用到哪些模型，不建地形（地形网格占探查大半时间）
      if (this.terrain) {
        this.scene.remove(this.terrain.mesh, this.terrain.water)
        this.terrain.dispose()
      }
      this.terrain = new Terrain(r.w, r.h, r.dark ? 'cave' : r.indoor ? 'indoor' : 'outdoor')
      this.terrain.setGround(this.groundWithExits(r))
      this.terrain.setSeason(season(s.day))
      this.scene.add(this.terrain.mesh, this.terrain.water)
      this.weather.setRegion(r.w, r.h, (x, z) => isWater(r.ground(x, z)))
    }

    for (const b of r.buildings) this.addBuilding(b)
    for (const d of r.decor) {
      // 室内：门随墙体按镜头生成；喂食槽、草窝随状态在 syncEnts 里画
      if (r.indoor && (d.m.startsWith('door_') || STATEFUL_PROPS.includes(d.m))) continue
      if (d.m === 'pet_bed' && !s.pet) continue
      const def = PROP_MODELS[d.m] ?? (r.indoor && d.m ? interiorModel(d.m) : undefined)
      if (def) this.place(def, 's:', d.x, d.z, d.rot ?? 0, d.s ?? 1, this.statics)
    }
    if (r.dark || r.indoor) this.wallRot = -1 // 岩壁、室内墙按镜头方向在 frame 中生成
    else {
      this.cliffs(r)
      this.forestRing(r)
    }
    for (const [k, b] of this.batches) if (k.startsWith('s:') || k.startsWith('w:')) b.commit()
    this.buildLamps(r.decor.filter((d) => LAMP_PROPS[d.m]))

    for (const a of this.npcs.values()) a.root.removeFromParent()
    this.npcs.clear()
    for (const c of [...this.foes.values(), ...this.chickens.values(), ...this.pets.values()]) this.release(c, c.root.userData.path, c.root.userData.scale)
    this.pets.clear()
    this.foes.clear()
    this.chickens.clear()
    for (const m of this.lootMeshes.values()) m.removeFromParent()
    this.lootMeshes.clear()
    this.regionKey = key
  }

  // 矿洞岩壁：与洞底相邻的岩壁格放 1×1 岩柱；镜头一侧的岩壁压低，避免挡住角色（7.1）
  private buildWalls(r: RegionDef) {
    for (const [k, b] of this.batches) if (k.startsWith('w:')) b.reset()
    const dx = -Math.sign(Math.sin(this.az)), dz = -Math.sign(Math.cos(this.az)) // 镜头看向的方向
    const floor = (x: number, z: number) => r.ground(x, z) === 4
    for (let z = -1; z <= r.h; z++) for (let x = -1; x <= r.w; x++) {
      if (r.ground(x, z) !== 5) continue
      let near = false
      for (let j = -1; j <= 1 && !near; j++) for (let i = -1; i <= 1; i++) if (floor(x + i, z + j)) { near = true; break }
      if (!near) continue
      const front = floor(x + dx, z) || floor(x, z + dz) || floor(x + dx, z + dz)
      const h = rand(x, z, 61)
      const def = MINE_WALL_SETS[r.theme ?? 0][h < 0.18 ? 3 : Math.floor(h * 3.99) % 3]
      this.place(def, 'w:', x + 0.5, z + 0.5, Math.floor(rand(x, z, 62) * 4) * Math.PI / 2, 1, this.statics, undefined, front ? 0.28 : 1 + rand(x, z, 63) * 0.15)
    }
    for (const [k, b] of this.batches) if (k.startsWith('w:')) b.commit()
  }

  // 室内墙：每个墙格放一块 1×1 墙（装饰面 +Z 转向屋内）；镜头一侧的墙与门压低到约 0.7 米，看得见屋里
  private buildRoom(r: RegionDef) {
    for (const [k, b] of this.batches) if (k.startsWith('w:')) b.reset()
    const st = r.indoor!
    const dx = -Math.sign(Math.sin(this.az)), dz = -Math.sign(Math.cos(this.az)) // 镜头看向的方向
    const floor = (x: number, z: number) => x >= 0 && z >= 0 && x < r.w && z < r.h && r.ground(x, z) !== WALL_IN
    const door = r.exits[0]
    const LOW = 0.7 / 3
    for (let z = 0; z < r.h; z++) for (let x = 0; x < r.w; x++) {
      const isDoor = !!door && x === door.x0 && z === door.z0
      if (floor(x, z) && !isDoor) continue
      // 朝屋内的方向：先找正对的地面，再看斜角（墙角）
      const n = ([[0, 1], [1, 0], [-1, 0], [0, -1]] as const).filter(([i, j]) => floor(x + i, z + j) && !(isDoor && j === 1))
      let faces: [number, number][] = n.map(([i, j]) => [i, j])
      if (isDoor) faces = [[0, -1]]
      let corner = false
      if (!faces.length) {
        const d = ([[1, 1], [-1, 1], [1, -1], [-1, -1]] as const).find(([i, j]) => floor(x + i, z + j))
        if (!d) continue
        faces = [[d[0], 0], [0, d[1]]]
        corner = true
      }
      const front = faces.some(([i, j]) => i * dx + j * dz > 0)
      // +Z 转到面向屋内；墙角让 +Z 与 +X 两面朝屋内
      const [fx, fz] = corner ? [faces[0][0] + faces[1][0], faces[0][1] + faces[1][1]] : faces[0]
      const rot = corner ? Math.atan2(fx, fz) - Math.PI / 4 : Math.atan2(fx, fz)
      const h = rand(x, z, 91)
      const v = isDoor ? 'door' : corner ? 'corner' : front ? (h < 0.6 ? 'a' : 'b') : h < 0.42 ? 'a' : h < 0.66 ? 'b' : h < 0.86 ? 'window' : 'shelf'
      this.place(wallModel(st, v), 'w:', x + 0.5, z + 0.5, rot, 1, this.statics, undefined, front ? LOW : 1)
    }
    for (const [k, b] of this.batches) if (k.startsWith('w:')) b.commit()
  }

  // 山崖：所有岩地格立同样高的岩块，连成一整片平顶崖壁（高低不一会显得一格一格很割裂）
  private cliffs(r: RegionDef) {
    if (!r.outside || r.outside(-5, -5) !== 5) return
    const ground = this.groundWithExits(r)
    for (let z = -MARGIN + 1; z < r.h + MARGIN - 1; z++) for (let x = -MARGIN + 1; x < r.w + MARGIN - 1; x++) {
      if (ground(x, z) !== 5) continue
      const def = CLIFFS[0]
      const rot = Math.floor(rand(x, z, 73) * 4) * Math.PI / 2
      // 只拉高岩体，草皮按原厚度盖在顶上（整块拉伸会把薄草皮拉成厚板，和岩壁错开）
      const cap = this.cliffCaps.get(def.path)
      if (!cap) { this.place(def, 's:', x + 0.5, z + 0.5, rot, 1, this.statics, undefined, CLIFF_H); continue }
      const sc = def.scale
      this.batch('s:' + def.path + '#body', cap.body, this.statics)?.addAt(x + 0.5, 0, z + 0.5, rot, sc, sc * CLIFF_H, sc)
      this.batch('s:' + def.path + '#top', cap.top, this.statics)?.addAt(x + 0.5, cap.h * sc * (CLIFF_H - 1), z + 0.5, rot, sc, sc, sc)
      // 崖顶离边缘两格以外零星长些树和石头，平顶不至于光秃秃
      let edge = false
      for (let j = -2; j <= 2 && !edge; j++) for (let i = -2; i <= 2; i++) if (ground(x + i, z + j) !== 5) { edge = true; break }
      if (edge) continue
      const k = rand(x, z, 74), top = cap.h * sc * CLIFF_H
      if (k < 0.13) this.place(treeModel(treeSpecies(r.id, x, z), TREE_STAGES[Math.max(0, this.seasonApplied)]), 's:', x + 0.5, z + 0.5, rand(x, z, 75) * 6.28, 0.9 + rand(x, z, 76) * 0.4, this.statics, undefined, undefined, top)
      else if (k < 0.17) this.place(OBSTACLE_MODELS.stone[Math.floor(rand(x, z, 77) * 3)], 's:', x + 0.5, z + 0.5, rand(x, z, 78) * 6.28, 1.2, this.statics, undefined, undefined, top)
    }
  }

  // 不亮的点光源也要逐像素算一遍（白天 13 盏全是 0 亮度，占农场显卡时间一半以上），所以只让亮着的灯参与着色：
  // 白天全部隐藏，黄昏起显示本区域用到的前 lampOn 盏。两种组合各是一套着色器变体，进场景前都编好（compileLit），亮灯时不现编
  private lampsLit = false
  private setLampsLit(on: boolean) {
    this.lampsLit = on
    this.lamps.forEach((l, i) => { l.visible = on && i < this.lampOn })
  }
  private compileLit() {
    const lit = this.lampsLit
    const ps = this.def?.dark || this.def?.indoor ? [] : [(this.setLampsLit(false), this.compileAll())] // 室内、矿洞一直亮灯，只有一套
    this.setLampsLit(true)
    ps.push(this.compileAll())
    this.setLampsLit(lit)
    return Promise.all(ps)
  }

  // 夜间灯光：灯柱处的暖色点光源 + 柔光光晕，黄昏渐亮；矿洞里常亮。只改位置与亮度，不增删光源
  private buildLamps(spots: { x: number; z: number; m: string; y?: number }[]) {
    this.lampOn = Math.min(spots.length, this.lamps.length)
    this.lamps.forEach((l, i) => {
      const d = spots[i]
      const p = d ? LAMP_PROPS[d.m] : null
      l.position.set(d ? d.x : 0, p ? d.y ?? p.y : -50, d ? d.z : 0)
      l.distance = p?.mine ? 10 : 9
      l.color.set(p?.color ?? 0xffb560)
      l.intensity = 0
    })
    this.setLampsLit(this.lampsLit)
    this.torch.visible = !!this.def?.dark
    this.glows.count = this.lampOn
    for (let i = 0; i < this.lampOn; i++) { const p = LAMP_PROPS[spots[i].m]; this.glows.setMatrixAt(i, _m.makeTranslation(spots[i].x, spots[i].y ?? p.glow ?? (p.mine ? 1.3 : 2.45), spots[i].z)) }
    this.glows.instanceMatrix.needsUpdate = true
  }

  fx(kind: FxKind, x: number, z: number, y = 0.25) {
    this.fxs.emit(kind, x, y, z)
  }

  // 地图外：出口方向的道路延伸、河流与山崖延续，其余为草地
  private groundWithExits(r: RegionDef) {
    return (x: number, z: number) => {
      if (x >= 0 && z >= 0 && x < r.w && z < r.h) return r.ground(x, z)
      if (!r.indoor) for (const e of r.exits) {
        const cx = Math.min(Math.max(x, 0), r.w - 1)
        const cz = Math.min(Math.max(z, 0), r.h - 1)
        const straight = cx !== x ? z === cz : x === cx
        if (straight && cx >= e.x0 && cx <= e.x1 && cz >= e.z0 && cz <= e.z1) return r.ground(cx, cz)
      }
      return r.outside ? r.outside(x, z) : 0
    }
  }

  private addBuilding(b: Building) {
    if (b.model === '') return
    const def = this.buildingDef(b)
    this.need(def.path)
    const parts = this.parts.get(def.path)
    const cx = b.x + b.w / 2
    const cz = b.z + b.d / 2
    if (!parts) return
    this.batch('s:' + def.path, parts, this.statics)?.addAt(cx, 0, cz, ((b.rot ?? 0) * Math.PI) / 2, b.sx ?? 1, 1, b.sz ?? b.sx ?? 1)
  }
  // 木栈道、栈桥与林桥上的人物站在桥面高度（拱桥中间最高）
  private deckY(x: number, z: number) {
    const r = this.def
    if (!r || r.ground(Math.floor(x), Math.floor(z)) !== 6) return 0
    if (r.id === 'river' && x >= BRIDGE.x && x < BRIDGE.x + BRIDGE.w && z >= BRIDGE.z && z < BRIDGE.z + BRIDGE.d) return 0.35 + 1.05 * Math.sin(Math.PI * Math.min(1, Math.max(0, (x - BRIDGE.x) / BRIDGE.w)))
    return r.id === 'wetland' ? 0.34 : 0.32
  }
  // 建造规划预览：占地格（可建为绿、不可建为红）
  setPlan(rect: [number, number, number, number] | null, okToBuild: boolean) {
    this.planMesh.count = 0
    if (rect) {
      const [x0, z0, w, d] = rect
      for (let z = z0; z < z0 + d; z++) for (let x = x0; x < x0 + w; x++) this.planMesh.setMatrixAt(this.planMesh.count++, _m.makeTranslation(x + 0.5, 0.07, z + 0.5))
      // 门口格
      this.planMesh.setMatrixAt(this.planMesh.count++, _m.compose(_p.set(x0 + Math.floor(w / 2) + 0.5, 0.07, z0 + d + 0.5), _q.identity(), _s.set(0.5, 1, 0.5)))
    }
    ;(this.planMesh.material as THREE.MeshBasicNodeMaterial).color.set(okColor(okToBuild))
    this.planMesh.instanceMatrix.needsUpdate = true
  }

  // 地图外一圈树林（只是表现，不参与碰撞），出口方向留出道路
  private forestRing(r: RegionDef) {
    const ground = this.groundWithExits(r)
    const landmarks = r.decor.filter((d) => d.x < 0 || d.z < 0 || d.x >= r.w || d.z >= r.h)
    const dense = r.id === 'forest' ? 0.75 : 0.55
    for (let z = -MARGIN + 1; z < r.h + MARGIN - 1; z++) for (let x = -MARGIN + 1; x < r.w + MARGIN - 1; x++) {
      if (x >= 0 && z >= 0 && x < r.w && z < r.h) continue
      if (landmarks.some((d) => Math.hypot(x + 0.5 - d.x, z + 0.5 - d.z) < 4.5)) continue
      if ([[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]].some(([dx, dz]) => ground(x + dx, z + dz) !== 0)) continue
      const dist = Math.max(-x, x - r.w + 1, -z, z - r.h + 1)
      if (rand(r.w * 977 + r.h, x, z, 5) > (dist <= 2 ? dense : 0.4)) continue
      const def = farTreeModel(treeSpecies(r.id, x, z), TREE_STAGES[Math.max(0, this.seasonApplied)]) // 远景低面数版本
      const ox = (rand(x, z, 12) - 0.5) * 0.6
      const oz = (rand(x, z, 13) - 0.5) * 0.6
      // 外圈树稍大，挡住地图边界；不进阴影通道（一千多棵、每棵近三千面，影子落在地图外基本看不到，却占了阴影通道一半的面数）
      // 按 20×20 格分区块合批、做视锥剔除：镜头只看得到一两段，其余一千多棵（每棵近三千面）不用画
      const chunk = `s:ring:${Math.floor(x / 20)},${Math.floor(z / 20)}:`
      this.place(def, chunk, x + 0.5 + ox, z + 0.5 + oz, rand(x, z, 14) * 6.28, 1.1 + rand(x, z, 15) * 0.4, this.statics, undefined, undefined, 0, false, true)
    }
  }

  // ---------- 状态同步：只在领域状态版本变化时调用 ----------
  sync(s: GameState) {
    this.last = s
    this.build(s)
  }
  private build(s: GameState) {
    const r = regionOf(s)
    const key = `${r.key}|${s.region === 'mine' ? s.day + ':' + s.seed : ''}`
    const se = season(s.day)
    if (se !== this.seasonApplied) this.applySeason(se)
    if (this.regionKey !== key + '|' + se) this.buildRegion(s, r, key + '|' + se)
    for (const [k, b] of this.batches) if (!k.startsWith('s:') && !k.startsWith('w:')) b.reset()
    if (!this.dry) this.terrain!.setTiles(r.w, r.h, (x, z) => {
      const t = tileAt(s, x, z)
      return t ? { till: t.till, wet: t.wet >= s.day } : null
    })
    const soil = DECOR_MODELS.soil[0]
    const wetColor = _c.setRGB(0.6, 0.52, 0.48).clone()
    for (let z = 0; z < r.h; z++) for (let x = 0; x < r.w; x++) {
      const t = tileAt(s, x, z)!
      const cx = x + 0.5
      const cz = z + 0.5
      const h = rand(x, z, 21)
      if (t.till) this.batch('d:' + soil.path, this.parts.get(soil.path), this.dyn, false)?.addAt(cx, 0, cz, (h > 0.5 ? 0 : Math.PI) + (h - 0.5) * 0.1, soil.scale, soil.scale, soil.scale, t.wet >= s.day ? wetColor : undefined) // 耕地贴地，不进阴影通道
      if (t.crop) {
        const c = t.crop
        const cd = CROPS[c.cid]
        const need = c.harvests ? cd.regrowDays : cd.growthDays
        const stage = c.dead ? 4 : isMature(c) ? 3 : c.harvests ? 2 : c.prog === 0 ? 0 : c.prog < need * 0.5 ? 1 : 2
        this.need(cropModel(c.cid).path, () => this.prepareCrop(c.cid), this.cropParts.has(c.cid))
        this.batch(`c:${c.cid}:${stage}`, this.cropParts.get(c.cid)?.[stage])
          ?.addAt(cx + (h - 0.5) * 0.08, 0.04, cz + (rand(x, z, 22) - 0.5) * 0.08, h * 6.28)
      }
      if (t.ob) {
        const list = s.region === 'mine' ? obstacleModels(t.ob.k, r.theme ?? 0) : OBSTACLE_MODELS[t.ob.k]
        // 树与树桩按树种与季节换模型（种出来的树记着树种，野生树按坐标定）
        const def = t.ob.k === 'tree' || t.ob.k === 'stump' ? treeModel(t.ob.sp ?? treeSpecies(r.id, x, z), t.ob.k === 'stump' ? 'stump' : TREE_STAGES[se]) : list[Math.floor(h * list.length)]
        const hit = t.ob.dmg ? 0.94 : 1
        this.place(def, 'o:', cx + (rand(x, z, 23) - 0.5) * 0.15, cz + (rand(x, z, 24) - 0.5) * 0.15, h * 6.28, (0.9 + rand(x, z, 25) * 0.2) * hit)
        if (t.ob.k === 'exit') this.place(PROP_MODELS.mossGlow, 'o:', cx, cz, h * 6, 0.9, this.dyn, undefined, 1) // 标记出口岩
      }
      if (t.fo) {
        const def = FORAGE_MODELS[t.fo]
        if (def) this.place(def, 'f:', cx + (rand(x, z, 33) - 0.5) * 0.2, cz + (rand(x, z, 34) - 0.5) * 0.2, h * 6.28, 1, this.dyn, t.fo === 'clay' ? _c.setRGB(0.75, 0.55, 0.42).clone() : undefined)
      }
      // 草丛与野花点缀空草地
      if (t.g === 0 && !t.till && !t.ob && !t.ent && !t.fo && !t.path && h < 0.32) {
        const flower = rand(x, z, 26) < (se === 3 ? 0.05 : 0.18)
        const list = flower ? (se ? FLOWERS_BY_SEASON[se] : DECOR_MODELS.flower) : DECOR_MODELS.tuft
        const def = list[Math.floor(rand(x, z, 27) * list.length)]
        this.place(def, 't:', x + 0.2 + rand(x, z, 28) * 0.6, z + 0.2 + rand(x, z, 29) * 0.6, rand(x, z, 30) * 6.28, se === 3 ? 0.7 : 0.85 + rand(x, z, 35) * 0.3)
        if (h < 0.14) { // 部分格子再补一丛，草地更茂密
          const t2 = DECOR_MODELS.tuft[Math.floor(rand(x, z, 36) * DECOR_MODELS.tuft.length)]
          this.place(t2, 't:', x + 0.15 + rand(x, z, 37) * 0.7, z + 0.15 + rand(x, z, 38) * 0.7, rand(x, z, 39) * 6.28, se === 3 ? 0.7 : 0.8 + rand(x, z, 40) * 0.3)
        }
      }
      // 秋天的落叶堆、冬天的积雪堆点缀空地
      if ((se === 2 || se === 3) && !r.dark && t.g === 0 && !t.till && !t.ob && !t.ent && !t.fo && !t.path && h > 0.97) {
        const list = se === 3 ? GROUND_SEASONAL.snow : GROUND_SEASONAL.leaves
        this.place(list[Math.floor(rand(x, z, 41) * list.length)], 't:', x + 0.5, z + 0.5, rand(x, z, 42) * 6.28, 0.8 + rand(x, z, 43) * 0.4)
      }
      if (t.g === 2 && h < 0.16) this.place(DECOR_MODELS.lily[Math.floor(h * 10) % 2], 't:', x + 0.3 + rand(x, z, 31) * 0.4, z + 0.3 + rand(x, z, 32) * 0.4, h * 30)
    }
    this.syncEnts(s)
    for (const [k, b] of this.batches) if (!k.startsWith('s:') && !k.startsWith('w:')) b.commit()
    this.shadowDirty = true
  }

  private applySeason(se: number) {
    for (const name of SEASONAL_MATERIALS) getShared(name)?.color.set(paletteColor(name, se))
    getShared('cliffGrass')?.color.set(paletteColor('grass', se))
    this.terrain?.setSeason(se)
    const changed = this.seasonApplied >= 0 && this.seasonApplied !== se
    this.seasonApplied = se
    return changed
  }

  private syncEnts(s: GameState) {
    const farm = s.region === 'farm'
    if (!farm && !this.def?.indoor) return
    const se = season(s.day)
    const ents = entsOf(s)
    const at = (x: number, z: number) => (farm ? (x >= 0 && z >= 0 && x < FARM_W ? s.tiles[z * FARM_W + x] : undefined) : tileAt(s, x, z) ?? undefined)
    const entAt = (x: number, z: number) => { const t = at(x, z); return t?.ent ? ents.find((e) => e.id === t.ent) : undefined }
    const isFence = (x: number, z: number) => ['fence_wood', 'gate_wood'].includes(entAt(x, z)?.k ?? '')
    const net = farm && s.ents.some((e) => e.k === 'sprinkler' || e.k === 'sprinkler_plus') ? waterNetwork(s) : null
    const lamps: { x: number; z: number; m: string; y?: number }[] = this.def!.decor.filter((d) => LAMP_PROPS[d.m])
    const put = (path: string, hide: string[], x: number, z: number, rot = 0, turn: string[] = []) =>
      this.batch('e:' + path + hide.join(',') + turn.join(','), this.variant(path, hide, turn))?.addAt(x, 0, z, rot)
    if (!farm) this.syncStalls(s, put)
    for (const e of ents) {
      const cx = e.x + 0.5, cz = e.z + 0.5
      const busy = jobBusy(s, e)
      const dd = DECOR_BY_ID[e.k]
      if (dd) {
        let px = e.x + dd.foot[0] / 2, pz = e.z + dd.foot[1] / 2, rot = 0, y = 0
        const mount = WALL_MOUNT[e.k]
        const side = mount && WALL_SIDES.find(([a, b]) => this.def!.ground(e.x + a, e.z + b) === WALL_IN)
        if (mount && side) { px += side[0] * (0.5 - mount[0]); pz += side[1] * (0.5 - mount[0]); rot = Math.atan2(-side[0], -side[1]); y = mount[1] }
        this.place(decorModel(e.k), 'e:', px, pz, rot, 1, this.dyn, undefined, 1, y)
        if (dd.light) lamps.push({ x: px, z: pz, m: e.k, y: y + dd.light })
        if (e.top && DECOR_BY_ID[e.top]) {
          this.place(decorModel(e.top), 'e:', px, pz, 0, 1, this.dyn, undefined, 1, SURFACES[e.k] ?? 0)
          if (DECOR_BY_ID[e.top].light) lamps.push({ x: px, z: pz, m: e.top, y: (SURFACES[e.k] ?? 0) + DECOR_BY_ID[e.top].light! })
        }
        continue
      }
      if (e.k === 'wild_tree') {
        this.place(treeModel(e.tree!, (e.grown ?? 0) < WILD_GROW / 3 ? 'sapling' : 'young'), 'e:', cx, cz, (e.id % 4) * Math.PI / 2)
        continue
      }
      if (e.k === 'fruit_tree') {
        const def = FRUIT_TREES[e.tree!]
        const stage = treeMature(e) ? 2 : (e.grown ?? 0) >= def.grow / 3 ? 1 : 0
        const path = fruitTreeModel(e.tree!, stage).path
        const hide = stage < 2 ? [] : [
          ...(se === 3 && !(def.seasons.includes(3)) ? ['leaves'] : []), // 冬季落叶（柿子秋冬挂果，保留枝干上的果）
          ...(se === 0 && def.seasons.includes(0) && !e.fruit ? [] : ['blossom']),
          ...[1, 2, 3].filter((k) => k > (e.fruit ?? 0)).map((k) => 'fruit_' + k),
        ]
        put(path, hide, cx, cz, (e.id % 4) * Math.PI / 2)
        continue
      }
      const path = (e.k === 'furnace' && busy ? ITEM_MODELS.furnace_lit : ITEM_MODELS[e.k] ?? ITEM_MODELS.compost).path
      const hide: string[] = []
      const turn: string[] = []
      if (e.k in MACHINES || e.k === 'beehive') { if (!busy && !(e.k === 'beehive' && se < 3)) hide.push('working') }
      if (e.k === 'campfire') { if (!fireLit(s, e)) hide.push('fire'); else lamps.push({ x: cx, z: cz, m: 'campfire' }) }
      if (e.k === 'sprinkler' || e.k === 'sprinkler_plus') { if (!(net && sprinklerConnected(s, e, net) && (s.min < 400 || e.ran === s.day))) hide.push('working') }
      if (e.k === 'fence_wood') for (const [n, dx, dz] of [['rail_px', 1, 0], ['rail_nx', -1, 0], ['rail_pz', 0, 1], ['rail_nz', 0, -1]] as const) if (!isFence(e.x + dx, e.z + dz)) hide.push(n)
      if (e.k === 'gate_wood' && e.open) turn.push('door')
      if (e.k === 'lamp_post' || e.k === 'torch') lamps.push({ x: cx, z: cz, m: e.k })
      // 栅栏门朝向：左右有栅栏时门板沿 X
      const rot = e.k === 'gate_wood' && (isFence(e.x, e.z - 1) || isFence(e.x, e.z + 1)) ? Math.PI / 2 : 0
      put(path, hide, cx, cz, rot, turn)
      if ((MACHINES[e.k] || e.k === 'beehive' || e.k === 'crab_pot') && e.job) {
        // 加工中/已完成的小圆点：合批成一次绘制，不投影
        const ready = jobDone(s, e)
        this.batch(ready ? 'm:ready' : 'm:busy', ready ? MARK_READY : MARK_BUSY, this.dyn, false)?.addAt(cx, e.k === 'furnace' ? 1.7 : 1.3, cz)
      }
    }
    // 地面覆盖：水管（按相邻连接显示管段）、木路/石路
    if (farm) for (let z = 0; z < this.def!.h; z++) for (let x = 0; x < this.def!.w; x++) {
      const t = at(x, z)!
      if (t.path) put(ITEM_MODELS[t.path === 2 ? (rand(x, z, 81) < 0.5 ? 'path_stone_a' : 'path_stone_b') : (rand(x, z, 81) < 0.5 ? 'path_wood_a' : 'path_wood_b')].path, [], x + 0.5, z + 0.5)
      if (t.pipe) {
        const link = (dx: number, dz: number) => { const n = at(x + dx, z + dz); const e = entAt(x + dx, z + dz); return !!n?.pipe || ['sprinkler', 'sprinkler_plus', 'water_tank'].includes(e?.k ?? '') || this.def!.buildings.some((b) => b.act === 'well' && x + dx >= b.x && x + dx < b.x + b.w && z + dz >= b.z && z + dz < b.z + b.d) }
        put(ITEM_MODELS.pipe.path, ([['px', 1, 0], ['nx', -1, 0], ['pz', 0, 1], ['nz', 0, -1]] as const).filter(([, dx, dz]) => !link(dx, dz)).map(([n]) => n), x + 0.5, z + 0.5)
      }
    }
    this.buildLamps(lamps)
  }

  // 禽舍/畜棚里的喂食槽（有干草的段显示草）与草窝（按待收产物显示蛋、鸭蛋或兔绒）
  private syncStalls(s: GameState, put: (path: string, hide: string[], x: number, z: number, rot?: number) => void) {
    const m = /^in:(coop|barn):(\d+)$/.exec(s.region)
    const b = m ? s.farmB.find((x) => x.id === Number(m[2])) : undefined
    const goods = b ? s.animals.filter((a) => a.home === b.id && !needsTool(a)).flatMap((a) => Array<string>(a.eggs).fill(ANIMALS[a.kind].product)) : []
    let hay = b?.hay ?? 0, nest = 0
    for (const d of this.def!.decor) {
      if (!STATEFUL_PROPS.includes(d.m)) continue
      const path = interiorModel(d.m).path
      if (d.m === 'nest_box') {
        const g = goods[nest++]
        const show = g === 'duck_egg' ? 'duck_egg' : g === 'rabbit_fur' ? 'fur' : g ? 'egg' : ''
        put(path, ['egg', 'duck_egg', 'fur'].filter((n) => n !== show), d.x, d.z, d.rot ?? 0)
      } else put(path, hay-- > 0 ? [] : ['hay'], d.x, d.z, d.rot ?? 0)
    }
  }

  // ---------- 玩家表现 ----------
  async ensurePlayer(look: number, outfit: Partial<Record<'hat' | 'top' | 'bottom', string>> = {}) {
    const key = look + '|' + JSON.stringify(outfit)
    if (this.player && this.playerLook === key) return
    this.player?.root.removeFromParent()
    this.playerLook = key
    this.player = await Actor.create(look % CHARACTER_MODELS.length, outfit)
    this.scene.add(this.player.root)
  }
  setPlayerPose(pose: Pose) {
    this.player?.setPose(pose)
  }
  playerGesture(g: Gesture, duration: number) {
    this.player?.playGesture(g, duration)
  }
  playerFlash() {
    this.player?.flash()
  }
  // 手持：工具（含钓竿）或背包里的武器
  holdTool(tool: ToolId | null, tier = 0, item?: string) {
    if (item && (item === 'sword_old')) return this.player?.setTool({ path: `models/items/${item}.glb`, scale: 1 })
    if (tool === 'rod') return this.player?.setTool({ path: 'models/items/rod_basic.glb', scale: 1 })
    this.player?.setTool(tool && tool in TOOLS ? toolModel(tool, tier) : null)
  }

  // ---------- 运行时实体 ----------
  // 居民、敌人、鸡的模型实例放进对象池反复使用：每次新建都要复制材质、重新生成着色器，会让切换区域卡顿
  private npcPool = new Map<string, Actor>()
  private creaturePool = new Map<string, Creature[]>()
  private async npcActor(id: string) {
    let a = this.npcPool.get(id)
    if (!a) {
      a = await Actor.create(NPC_LOOK[id] ?? 0)
      this.npcPool.set(id, a)
    }
    return a
  }
  private async creature(path: string, scale: number) {
    const pool = this.creaturePool.get(path + scale)
    const c = pool?.pop() ?? await Creature.create(path, scale)
    c.play('idle')
    return c
  }
  private release(c: Creature, path: string, scale: number) {
    c.root.removeFromParent()
    const k = path + scale
    if (!this.creaturePool.has(k)) this.creaturePool.set(k, [])
    this.creaturePool.get(k)!.push(c)
  }
  // 预先建好常用的居民与生物实例（编译在 warmState 里随下一个场景一起做）
  private async warmActors() {
    for (const id of Object.keys(NPC_LOOK)) await this.npcActor(id)
    for (const [path, scale, n] of [[CREATURES.moss, 1.35, 6], [CREATURES.beetle, 1.35, 3], [CREATURES.chicken, 1.7, 4], ...Object.entries(ANIMAL_MODELS).filter(([k]) => k !== 'chicken').map(([k, p]) => [p, ANIMALS[k as keyof typeof ANIMALS].scale, 1] as const)] as const) {
      const list = await Promise.all(Array.from({ length: n }, () => this.creature(path, scale)))
      list.forEach((c) => this.release(c, path, scale))
    }
  }
  private syncNpcs(list: NpcActor[], dt: number) {
    for (const [id, a] of this.npcs) if (!list.some((n) => n.id === id)) { a.root.removeFromParent(); this.npcs.delete(id) }
    for (const n of list) {
      const a = this.npcs.get(n.id)
      if (!a) {
        if (this.npcPending.has(n.id)) continue
        this.npcPending.add(n.id)
        const key = this.regionKey
        this.npcActor(n.id).then((x) => {
          this.npcPending.delete(n.id)
          if (this.regionKey !== key) return
          this.npcs.set(n.id, x)
          this.scene.add(x.root)
        })
        continue
      }
      a.root.position.set(n.x, this.deckY(n.x, n.z), n.z)
      a.root.rotation.y = n.face
      a.root.visible = !n.hidden
      a.setPose(n.moving ? 'walk' : n.sit ? 'sit' : 'idle')
      if (this.near(n.x, n.z)) a.update(dt)
    }
  }
  // 弹体（模型池）与地面预警区；落石在预警最后 0.45 秒从空中落下
  private syncArena(a?: Arena) {
    for (const g of this.shotUsed) { g.visible = false; this.shotPool.get(g.userData.k)!.push(g) }
    this.shotUsed = []
    const shot = (k: string) => {
      let g = this.shotPool.get(k)?.pop()
      if (!g) {
        if (!this.shotPool.has(k)) this.shotPool.set(k, [])
        g = new THREE.Group()
        g.userData.k = k
        const def = SHOT_MODELS[k]
        const parts = def ? this.parts.get(def.path) : null
        if (parts) for (const p of parts) g.add(new THREE.Mesh(p.geometry, p.material))
        else g.add(new THREE.Mesh(LOOT_GEO, sharedMaterial('shot:' + k, k === 'spore' ? 0xb0e060 : 0x9ae8ff)))
        this.scene.add(g)
      }
      g.visible = true
      this.shotUsed.push(g)
      return g
    }
    for (const sh of a?.shots ?? []) {
      const g = shot(sh.k)
      g.position.set(sh.x, sh.k === 'arrow' ? 1.0 : 0.8, sh.z)
      g.rotation.set(0, Math.atan2(sh.vx, sh.vz), 0)
    }
    this.discs.count = this.sectors.count = 0
    for (const z of a?.zones ?? []) {
      const live = z.delay <= 0
      const pulse = live ? 1 : 0.35 + 0.25 * Math.sin(performance.now() / 90)
      _c.set(ZONE_COLOR[z.k] ?? 0xff6040).multiplyScalar(pulse)
      const mesh = z.dir ? this.sectors : this.discs
      if (mesh.count >= mesh.instanceMatrix.count) continue
      const rot = z.dir ? Math.atan2(z.dir[0], z.dir[1]) - Math.PI / 2 : 0
      _q.setFromAxisAngle(_v.set(0, 1, 0), rot)
      mesh.setMatrixAt(mesh.count, _m.compose(_p.set(z.x, 0.08, z.z), _q, _s.set(z.r, 1, z.r)))
      mesh.setColorAt(mesh.count++, _c)
      if (z.k === 'rock' && z.delay > 0 && z.delay < 0.45) {
        const g = shot('boulder')
        g.position.set(z.x, z.delay * 18, z.z)
        g.rotation.set(z.delay * 6, z.delay * 4, 0)
      }
    }
    for (const m of [this.discs, this.sectors]) {
      m.instanceMatrix.needsUpdate = true
      if (m.instanceColor) m.instanceColor.needsUpdate = true
    }
  }
  // 羊：攒着羊毛时显示毛，剪过之后到下一份毛长好前不显示
  private woolOn(s: GameState, id: number) {
    const a = s.animals.find((x) => x.id === id)
    return !!a && (a.eggs > 0 || !adult(a))
  }
  private syncCreatures(list: { id: number; path: string; x: number; z: number; face: number; clip: string | string[]; once?: boolean; scale: number; node?: Record<string, boolean> }[], map: Map<number, Creature>, prefix: string, dt: number) {
    for (const [id, c] of map) if (!list.some((n) => n.id === id)) { this.release(c, c.root.userData.path, c.root.userData.scale); map.delete(id) }
    for (const n of list) {
      const c = map.get(n.id)
      if (!c) {
        const k = prefix + n.id
        if (this.pending.has(k)) continue
        this.pending.add(k)
        const key = this.regionKey
        this.creature(n.path, n.scale).then((x) => {
          this.pending.delete(k)
          x.root.userData.path = n.path
          x.root.userData.scale = n.scale
          if (this.regionKey !== key) return this.release(x, n.path, n.scale)
          map.set(n.id, x)
          this.scene.add(x.root)
        })
        continue
      }
      c.root.position.set(n.x, 0, n.z)
      c.root.rotation.y = n.face
      c.play(Array.isArray(n.clip) ? n.clip.find((k) => c.has(k)) ?? 'idle' : n.clip, n.once)
      if (n.node) for (const [k, v] of Object.entries(n.node)) c.setNode(k, v)
      c.root.scale.setScalar(n.scale / (c.root.userData.scale || n.scale))
      if (this.near(n.x, n.z)) c.update(dt)
    }
  }
  flashFoe(idx: number) {
    this.foes.get(idx)?.flash()
  }
  private syncLoot(list: Loot[]) {
    for (const [l, m] of this.lootMeshes) if (!list.includes(l)) { m.removeFromParent(); this.lootMeshes.delete(l) }
    for (const l of list) {
      let m = this.lootMeshes.get(l)
      if (!m) {
        const def = ITEM_MODELS[l.id] ?? FORAGE_MODELS[l.id]
        const parts = def ? this.parts.get(def.path) : null
        m = new THREE.Group()
        if (parts) for (const p of parts) (m as THREE.Group).add(new THREE.Mesh(p.geometry, p.material))
        else (m as THREE.Group).add(new THREE.Mesh(LOOT_GEO, sharedMaterial('loot:' + l.id, ITEMS[l.id]?.color ?? 0xffffff)))
        m.userData.s = def ? def.scale * 0.8 : 1
        m.scale.setScalar(m.userData.s)
        this.lootGroup.add(m)
        this.lootMeshes.set(l, m)
      }
      // 先弹起再飞向角色，随后消失（物品已入包）
      const k = Math.max(0, (l.t - 0.35) / 0.55)
      const px = this.player?.root.position.x ?? l.x, pz = this.player?.root.position.z ?? l.z
      m.position.set(l.x + (px - l.x) * k, 0.2 + Math.sin(Math.min(1, l.t / 0.35) * Math.PI) * 0.5 + k * 0.6, l.z + (pz - l.z) * k)
      m.rotation.y = l.t * 6
      m.scale.setScalar((m.userData.s ?? 1) * (1 - k * 0.7))
    }
  }

  // 每帧：相机、角色、光照、雨雪、运行时实体
  frame(s: GameState, px: number, pz: number, dt: number, hover: [number, number] | null, hoverOk: boolean, view: View = EMPTY) {
    const k = 1 - Math.exp(-dt * 8)
    this.target.x += (px - this.target.x) * k
    this.target.z += (pz - this.target.z) * k
    if (this.orbit) {
      if (this.calm) this.spin = Math.min(1, this.spin + dt * 0.4)
      this.az += dt * 0.05 * this.spin * this.spin * (3 - 2 * this.spin)
    }
    else this.az += (Math.PI / 4 + (this.rot * Math.PI) / 2 - this.az) * (1 - Math.exp(-dt * 10))
    const el = Math.PI / 4
    this.camera.position.set(
      this.target.x + Math.sin(this.az) * Math.cos(el) * 60,
      Math.sin(el) * 60,
      this.target.z + Math.cos(this.az) * Math.cos(el) * 60,
    )
    this.camera.lookAt(this.target)
    this.camera.getWorldDirection(occDir.value)
    occPlayer.value.set(px, 0.9, pz)
    const dark = !!this.def?.dark
    const inside = !!this.def?.indoor
    // 矿洞岩壁、室内墙随镜头 90° 旋转重排高低
    const quarter = ((Math.round((this.az - Math.PI / 4) / (Math.PI / 2)) % 4) + 4) % 4
    if ((dark || inside) && this.def && quarter !== this.wallRot) { this.wallRot = quarter; if (inside) this.buildRoom(this.def); else this.buildWalls(this.def) }

    if (this.player) {
      this.player.root.position.set(px, this.deckY(px, pz), pz)
      this.player.root.rotation.y = s.face
      this.player.update(dt)
    }
    this.syncNpcs(view.npcs, dt)
    this.syncCreatures(view.foes.map((f) => ({
      id: f.idx, path: FOES[f.k].model, x: f.x, z: f.z, face: f.face, clip: FOE_CLIP[f.st] ?? ['idle'],
      once: ['dead', 'pounce', 'attack', 'attack2', 'telegraph', 'telegraph2', 'roar', 'vent', 'summon', 'open', 'swoop'].includes(f.st), scale: FOES[f.k].scale,
    })), this.foes, 'f', dt)
    this.syncArena(view.arena)
    this.syncCreatures(view.chickens.map((c) => ({
      id: c.id, path: ANIMAL_MODELS[c.kind], x: c.x, z: c.z, face: c.face, scale: ANIMALS[c.kind].scale * (c.baby ? 0.6 : 1), // 与角色比例相称（角色约 1.6 米）
      clip: c.mode === 'eat' ? ['eat', 'peck', 'idle'] : c.mode === 'walk' ? ['walk', 'hop'] : ['idle'],
      node: c.kind === 'sheep' ? { wool: this.woolOn(s, c.id) } : undefined,
    })), this.chickens, 'c', dt)
    const p = view.pet
    this.syncCreatures(p && s.pet ? [{ id: 1, path: petModel(s.pet.kind), x: p.x, z: p.z, face: p.face, scale: petScale(s.pet.kind), clip: p.mode, once: p.mode === 'happy' }] : [], this.pets, 'p', dt)
    this.syncLoot(view.loot)
    // 土甲虫冲刺预警：沿锁定方向扬起一道尘线（15.4）
    if ((this.dustT -= dt) <= 0) {
      this.dustT = 0.08
      for (const f of view.foes) if (f.st === 'telegraph') for (let d = 0.6; d < 4.5; d += 0.9) this.fxs.emit('dust', f.x + f.dirX * d, 0.05, f.z + f.dirZ * d)
    }
    // 钓鱼：浮漂与鱼线
    this.bobber.visible = this.line.visible = !!view.bobber && !!this.player
    if (view.bobber && this.player) {
      const bob = Math.sin(performance.now() / (view.bite ? 60 : 400)) * (view.bite ? 0.05 : 0.02)
      this.bobber.position.set(view.bobber[0], -0.12 + bob - (view.bite ? 0.05 : 0), view.bobber[1])
      this.player.toolTip(ROD_TIP, _v)
      const pos = (this.line.geometry.attributes.position as THREE.BufferAttribute)
      pos.setXYZ(0, _v.x, _v.y, _v.z)
      pos.setXYZ(1, this.bobber.position.x, this.bobber.position.y + 0.06, this.bobber.position.z)
      pos.needsUpdate = true
    }

    this.hover.visible = !!hover
    if (hover) {
      this.hover.position.set(hover[0] + 0.5, 0.06, hover[1] + 0.5)
      ;(this.hover.material as THREE.MeshBasicNodeMaterial).color.set(okColor(hoverOk)) // 能走到：绿；走不到：红（色弱模式蓝/橙）
    }

    // 昼夜：夜晚保留足够亮度（22.1）；矿洞里不受昼夜影响，靠灯光照明
    const hr = s.min / 60
    const day = hr < 7 ? 0.5 + 0.5 * (hr - 6) : hr < 17 ? 1 : hr < 20 ? 1 - (0.55 * (hr - 17)) / 3 : 0.45
    const w = dark || inside ? 0 : weather(s.seed, s.day)
    const dim = w >= 2 ? 0.72 : w === 1 ? 0.86 : 1
    const sunAngle = (Math.min(Math.max(hr, 6), 20) - 6) / 14 * Math.PI
    if (dark) {
      this.sun.intensity = 0.6
      this.sun.color.set(0x9aa8d0)
      this.hemi.intensity = 1.15
      this.hemi.color.set(0xa4b0d0)
      this.sky.set(0x050505)
      this.torch.intensity = 11
      this.torch.distance = 10
      this.torch.position.set(px, 1.8, pz)
    } else if (inside) {
      // 室内：白天窗光柔和，入夜靠壁炉与灯；屋外一片暗
      const lit = hr >= 6 && hr < 18.5 ? 1 : 0.55
      this.torch.intensity = 0
      this.sun.intensity = 1.25 * lit
      this.sun.color.set(0xffe6c4)
      this.hemi.intensity = 1.0 + 0.45 * lit
      this.hemi.color.set(0xfff0dc)
      this.sky.set(0x0d0a08)
    } else {
      this.torch.intensity = 0
      this.sun.intensity = 2.25 * day * dim
      this.sun.color.set(0xfff4e0).lerp(_c.set(hr > 16.5 && hr < 20 ? 0xffa060 : 0x8fa6ff), Math.min(1, (1 - day) * 1.4))
      this.hemi.intensity = (0.85 + 0.8 * day) * dim
      this.hemi.color.set(0xeaf4ff).lerp(_c.set(0x6a7ab8), 1 - day)
      this.sky.set(0x8fc3e6).multiplyScalar(day * dim)
      if (this.flashT > 0) {
        this.flashT -= dt
        const f = Math.max(0, this.flashT / 0.35)
        this.hemi.intensity += 2.5 * f
        this.sky.lerp(_c.set(0xe8f0ff), 0.6 * f)
      }
    }
    this.sun.position.set(this.target.x - Math.cos(sunAngle) * 14, 22, this.target.z + 10 - Math.sin(sunAngle) * 4)
    this.sun.target.position.copy(this.target)
    const night = dark || inside ? 1 : hr < 6.6 ? 1 - (hr - 6) / 0.6 : Math.min(1, Math.max(0, (hr - 17.6) / 1.6))
    if (night > 0 !== this.lampsLit) this.setLampsLit(night > 0)
    this.lamps.forEach((l, i) => { l.intensity = i < this.lampOn ? night * (dark ? 14 : inside ? 6 : 9) : 0 })
    this.glowLevel.value = night * 0.55
    for (let i = 0; i < this.glows.count; i++) {
      this.glows.getMatrixAt(i, _m)
      _p.setFromMatrixPosition(_m)
      this.glows.setMatrixAt(i, _m.compose(_p, this.camera.quaternion, _s.set(1, 1, 1)))
    }
    this.glows.instanceMatrix.needsUpdate = true
    this.fxs.update(dt, this.camera)

    // 雨/雪（矿洞里没有）
    const se = season(s.day)
    const falling = !dark && (w === 2 || (w === 3 && se !== 2))
    this.weather.update(this.renderer, dt, !falling ? 0 : se === 3 ? 3 : w === 3 ? 2 : 1, this.target, graphics.fewParticles)

    if (graphics.scale !== this.appliedScale) this.resize()
    this.sun.castShadow = graphics.shadows // 不随区域切换：阴影开关同样会触发全部材质重编译
    if (!this.host.clientWidth || !this.host.clientHeight) return // 窗格隐藏时画布尺寸为 0，跳过渲染
    if (this.renderer.domElement.width !== Math.floor(this.host.clientWidth * this.renderer.getPixelRatio())) this.resize()
    this.scene.updateMatrixWorld()
    // 阴影图隔帧重画：阴影图和它的投影矩阵成对保留，静止物体的影子不变；走动的人和动物影子最多慢一帧。换区域、场景变化时立刻重画
    if (this.shadowDirty || (this.shadowTick = (this.shadowTick + 1) % 2) === 0) { this.sun.shadow.needsUpdate = true; this.shadowDirty = false }
    this.renderer.render(this.scene, this.camera)
  }
  private shadowTick = 0
  private shadowDirty = true
  // 镜头看得到的地面范围（正交镜头高度 = zoom，45° 俯视时地面纵深约 1.41 倍）；范围外的人和动物不更新动画
  private viewR = 40
  private near(x: number, z: number) { return Math.abs(x - this.target.x) + Math.abs(z - this.target.z) < this.viewR }

  // 鼠标 → 地面格（7.3 先定位地面再映射逻辑格）
  pick(clientX: number, clientY: number): [number, number] | null {
    const p = this.pickPoint(clientX, clientY)
    return p ? [Math.floor(p[0]), Math.floor(p[1])] : null
  }
  pickPoint(clientX: number, clientY: number): [number, number] | null {
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.ray.setFromCamera(new THREE.Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1), this.camera)
    const hit = this.ray.ray.intersectPlane(this.plane, _p)
    return hit ? [hit.x, hit.z] : null
  }
  // 世界坐标 → 屏幕像素（HUD 上的浮动提示）
  toScreen(x: number, y: number, z: number): [number, number] {
    _v.set(x, y, z).project(this.camera)
    const rect = this.renderer.domElement.getBoundingClientRect()
    return [(_v.x + 1) / 2 * rect.width + rect.left, (1 - _v.y) / 2 * rect.height + rect.top]
  }
}

const MARK_GEO = new THREE.SphereGeometry(0.12, 10, 8)
const MARK_BUSY: Part[] = [{ geometry: MARK_GEO, material: sharedMaterial('markBusy', 0xf0b030) }]
const MARK_READY: Part[] = [{ geometry: MARK_GEO, material: sharedMaterial('markReady', 0x44dd66) }]
const LOOT_GEO = new THREE.OctahedronGeometry(0.14)
// 同时最多 n 个任务
async function pool(tasks: (() => Promise<unknown>)[], n: number) {
  let i = 0
  await Promise.all(Array.from({ length: n }, async () => { while (i < tasks.length) await tasks[i++]() }))
}
void isWater
