// 角色表现：Kenney Mini Characters 骨架；优先使用带手部挂点与农务动画的版本（Blender 制作），缺失时退回原版。
// 只负责显示；位置、朝向、动作判定都来自领域状态（设计 23.1：逻辑命中由动作时间轴控制）。
import * as THREE from 'three/webgpu'
import { extractParts, instantiateSkinned, loadGltf } from './assets.ts'
import { ALL_LOOKS, CHARACTER_MODELS, type ModelDef } from './models.ts'
import { ASSET_ROOT } from './assets.ts'

// 换装版角色的贴图布局（任务 33）：256×256，左上原调色板，右上两块 64×64 分别是上衣、下装区域
interface WearLayout { size: number; top: number[]; bottom: number[]; looks: Record<string, { hat: { pos: [number, number, number]; scale: number } }> }
let layoutP: Promise<WearLayout | null> | null = null
const wearLayout = () => (layoutP ??= fetch(ASSET_ROOT + 'models/characters/wear/layout.json').then((r) => (r.ok ? r.json() : null)).catch(() => null))
const loadImage = (src: string) => new Promise<HTMLImageElement | null>((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src })
// 在角色自己的贴图上画上衣物图案（每个玩家一张，缓存按搭配）
const dressed = new Map<string, Promise<THREE.Texture | null>>()
function dressTexture(base: THREE.Texture | null, L: WearLayout, outfit: Partial<Record<'top' | 'bottom', string>>) {
  const key = `${base?.uuid}|${outfit.top}|${outfit.bottom}`
  let p = dressed.get(key)
  if (!p) {
    p = (async () => {
      const img = base?.image as CanvasImageSource | undefined
      if (!base || !img) return null
      const c = document.createElement('canvas')
      c.width = c.height = L.size
      const ctx = c.getContext('2d')!
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(img, 0, 0, L.size, L.size)
      for (const k of ['top', 'bottom'] as const) {
        const file = outfit[k]
        if (!file) continue
        const tile = await loadImage(ASSET_ROOT + file)
        if (tile) ctx.drawImage(tile, L[k][0], L[k][1], L[k][2], L[k][3])
      }
      const t = new THREE.CanvasTexture(c)
      t.flipY = base.flipY
      t.colorSpace = base.colorSpace
      t.magFilter = base.magFilter
      t.minFilter = base.minFilter
      t.wrapS = base.wrapS
      t.wrapT = base.wrapT
      return t
    })()
    dressed.set(key, p)
  }
  return p
}

export type Pose = 'idle' | 'walk' | 'sprint' | 'charge' | 'fish' | 'reel' | 'sit'
export type Gesture = 'hoe' | 'pick' | 'axe' | 'scythe' | 'water' | 'plant' | 'harvest' | 'eat' | 'yes' | 'swing1' | 'swing2' | 'swing3'
  | 'roll' | 'cast' | 'pickup' | 'pet' | 'die'
// 每个动作按优先级列出可用片段：专用农务动画 → 原版通用动作
export const CLIPS: Record<Gesture | Pose, string[]> = {
  idle: ['idle'], walk: ['walk'], sprint: ['sprint'], sit: ['sit', 'idle'], charge: ['tool-charge', 'holding-right'],
  hoe: ['tool-hoe', 'attack-melee-right'], pick: ['tool-hoe', 'attack-melee-right'], axe: ['tool-axe', 'attack-melee-right'],
  scythe: ['tool-scythe', 'attack-melee-right'], water: ['tool-water', 'interact-right'], plant: ['plant', 'interact-right'],
  harvest: ['harvest', 'pick-up'], eat: ['eat', 'emote-yes'], yes: ['emote-yes'],
  fish: ['fish-wait', 'holding-right'], reel: ['fish-reel', 'holding-right'], cast: ['fish-cast', 'attack-melee-right'],
  swing1: ['attack-melee-right'], swing2: ['attack-melee-left'], swing3: ['attack-kick-right', 'attack-melee-right'],
  roll: ['jump'], pickup: ['pick-up'], pet: ['interact-right', 'pick-up'], die: ['die'],
}

export class Actor {
  root = new THREE.Group()
  private mixer: THREE.AnimationMixer | null = null
  private actions = new Map<string, THREE.AnimationAction>()
  private pose: Pose | '' = ''
  private gesture: THREE.AnimationAction | null = null
  private hand: THREE.Object3D | null = null
  private socket = false // 是否使用 Blender 制作的 hand-r 挂点
  private tool: THREE.Object3D | null = null
  private toolPath = ''
  private flashT = 0
  private skin: THREE.MeshStandardMaterial[] = []

  // outfit：玩家的衣物（帽子模型、上衣/下装平铺图的路径）。有换装版模型（任务 33）时用它，衣服区域贴上衣物图案
  static async create(model: number, outfit?: Partial<Record<'hat' | 'top' | 'bottom', string>>) {
    const a = new Actor()
    const def = CHARACTER_MODELS[model % CHARACTER_MODELS.length]
    const look = ALL_LOOKS[model % ALL_LOOKS.length]
    const layout = outfit ? await wearLayout() : null
    const wear = layout?.looks?.[look] ? await instantiateSkinned(`models/characters/wear/character-${look}.glb`) : null
    const inst = wear ?? (await instantiateSkinned(def.path)) ?? (await instantiateSkinned(def.fallback))
    if (!inst) {
      // 资源缺失时用胶囊体兜底，保证仍可游玩
      const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.6, 4, 8).translate(0, 0.58, 0), new THREE.MeshStandardNodeMaterial({ color: 0x3a6ad0 }))
      m.castShadow = true
      a.root.add(m)
      return a
    }
    inst.root.scale.setScalar(def.scale)
    a.root.add(inst.root)
    // 受击闪红：材质按实例复制
    inst.root.traverse((o) => {
      const m = o as THREE.Mesh
      if (!m.isMesh) return
      m.material = (m.material as THREE.MeshStandardMaterial).clone()
      a.skin.push(m.material as THREE.MeshStandardMaterial)
    })
    if (wear && layout && (outfit?.top || outfit?.bottom)) {
      const tex = await dressTexture(a.skin[0]?.map ?? null, layout, outfit)
      if (tex) for (const m of a.skin) { m.map = tex; m.needsUpdate = true }
    }
    if (wear && layout && outfit?.hat) {
      const g = await loadGltf(outfit.hat)
      const head = inst.root.getObjectByName('head')
      const at = layout.looks[look].hat
      if (g && head) {
        const hat = g.scene.clone()
        hat.position.fromArray(at.pos)
        hat.scale.setScalar(at.scale)
        hat.traverse((o) => { if ((o as THREE.Mesh).isMesh) o.castShadow = true })
        head.add(hat)
      }
    }
    a.mixer = new THREE.AnimationMixer(inst.root)
    for (const clip of inst.animations) a.actions.set(clip.name, a.mixer.clipAction(clip))
    a.mixer.addEventListener('finished', (e) => {
      if (e.action !== a.gesture) return
      a.gesture = null
      if (a.pose) a.action(a.pose)?.reset().setEffectiveWeight(1).fadeIn(0.12).play()
    })
    const socket = inst.root.getObjectByName('hand-r')
    a.socket = !!socket
    a.hand = socket ?? inst.root.getObjectByName('arm-right') ?? null
    a.setPose('idle')
    return a
  }

  private action(name: Gesture | Pose) {
    for (const c of CLIPS[name]) {
      const a = this.actions.get(c)
      if (a) return a
    }
    return undefined
  }

  setPose(p: Pose) {
    if (p === this.pose) return
    const prev = this.pose ? this.action(this.pose) : undefined
    this.pose = p
    if (this.gesture) return // 一次性动作结束后再淡入新姿态
    prev?.fadeOut(0.15)
    this.action(p)?.reset().setEffectiveWeight(1).fadeIn(0.15).play()
  }

  // 一次性动作（锄地、浇水、拾取…），在 duration 秒内播完；期间暂停基础姿态，避免权重被平均掉
  playGesture(g: Gesture, duration: number) {
    const a = this.action(g)
    if (!a || !this.mixer) return
    if (this.gesture && this.gesture !== a) this.gesture.stop()
    if (!this.gesture && this.pose) this.action(this.pose)?.fadeOut(0.08)
    a.reset()
    a.setLoop(THREE.LoopOnce, 1)
    a.clampWhenFinished = false
    a.timeScale = a.getClip().duration / Math.max(0.2, duration)
    a.setEffectiveWeight(1).fadeIn(0.06).play()
    this.gesture = a
  }

  // 手持工具：def 为 null 时收起
  async setTool(def: ModelDef | null) {
    const path = def?.path ?? ''
    if (path === this.toolPath) return
    this.toolPath = path
    this.tool?.removeFromParent()
    this.tool = null
    if (!def || !this.hand) return
    const gltf = await loadGltf(def.path)
    if (!gltf || this.toolPath !== path) return
    const g = new THREE.Group()
    for (const p of extractParts(gltf.scene)) {
      const m = new THREE.Mesh(p.geometry, p.material)
      m.castShadow = true
      g.add(m)
    }
    // 挂点空间已带角色 2 倍缩放；工具按米制作，乘 0.5 抵消
    g.scale.setScalar(0.5)
    if (!this.socket) {
      // 原版骨架无挂点：近似放到右臂末端
      g.position.set(-0.02, -0.17, 0.04)
      g.rotation.set(Math.PI / 2, 0, 0)
    }
    this.hand.add(g)
    this.tool = g
  }

  // 工具末端的世界坐标（钓竿鱼线起点）；len 为沿握柄 +Y 的长度（米）
  toolTip(len: number, out: THREE.Vector3) {
    if (!this.tool) return out.copy(this.root.position).setY(1.2)
    return this.tool.localToWorld(out.set(0, len / 0.5 * 0.5, 0))
  }
  flash() {
    this.flashT = 0.25
  }
  update(dt: number) {
    this.mixer?.update(dt)
    if (this.flashT > 0 || this.skin[0]?.emissiveIntensity) {
      this.flashT = Math.max(0, this.flashT - dt)
      for (const m of this.skin) { m.emissive.setRGB(1, 0.15, 0.1); m.emissiveIntensity = this.flashT * 3 }
    }
  }
}

// 动物与敌人：刚体层级或骨骼动画，片段名见各模型清单；受击短暂泛红
export class Creature {
  root = new THREE.Group()
  private mixer: THREE.AnimationMixer | null = null
  private actions = new Map<string, THREE.AnimationAction>()
  private cur = ''
  private flashT = 0
  private mats: THREE.MeshStandardMaterial[] = []
  private hidden = new Set<THREE.Object3D>() // 合成蒙皮后的部件（骨骼）：缩到 0 来隐藏
  static async create(path: string, scale = 1) {
    const c = new Creature()
    const inst = await instantiateSkinned(path)
    if (!inst) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8).translate(0, 0.3, 0), new THREE.MeshStandardNodeMaterial({ color: 0x6a9a4a }))
      c.root.add(m)
      return c
    }
    inst.root.scale.setScalar(scale)
    inst.root.traverse((o) => {
      const m = o as THREE.Mesh
      if (!m.isMesh) return
      m.material = (m.material as THREE.MeshStandardMaterial).clone()
      c.mats.push(m.material as THREE.MeshStandardMaterial)
    })
    c.root.add(inst.root)
    c.mixer = new THREE.AnimationMixer(inst.root)
    for (const clip of inst.animations) c.actions.set(clip.name, c.mixer.clipAction(clip))
    c.play('idle')
    return c
  }
  has(name: string) {
    return this.actions.has(name)
  }
  setNode(name: string, visible: boolean) {
    const o = this.root.getObjectByName(name)
    if (!o) return
    if ((o as THREE.Bone).isBone) { if (visible) { this.hidden.delete(o); o.scale.setScalar(1) } else this.hidden.add(o) }
    else if (o.visible !== visible) o.visible = visible
  }
  // once=true 时播完停在最后一帧（死亡、出击）
  play(name: string, once = false, speed = 1) {
    if (name === this.cur || !this.actions.has(name)) return
    const prev = this.actions.get(this.cur)
    const a = this.actions.get(name)!
    a.reset()
    a.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, Infinity)
    a.clampWhenFinished = once
    a.timeScale = speed
    a.fadeIn(0.1).play()
    prev?.fadeOut(0.1)
    this.cur = name
  }
  flash() {
    this.flashT = 0.2
  }
  update(dt: number) {
    this.mixer?.update(dt)
    for (const o of this.hidden) o.scale.setScalar(0) // 动画会写回缩放，每帧再压一次
    if (this.flashT > 0 || this.mats[0]?.emissiveIntensity) {
      this.flashT = Math.max(0, this.flashT - dt)
      for (const m of this.mats) { m.emissive.setRGB(1, 0.2, 0.15); m.emissiveIntensity = this.flashT * 4 }
    }
  }
}
