// 资源加载：GLTF 缓存、按材质名共享材质、静态模型实例化合批（设计 24.5）。
import * as THREE from 'three/webgpu'
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js'
import { attribute, Fn, instanceColor, mat4, normalLocal, positionLocal, transformNormal, vec4 } from 'three/tsl'

const loader = new GLTFLoader()
const cache = new Map<string, Promise<GLTF | null>>()
export const ASSET_ROOT = '/assets/'

// 加载失败（缺文件）返回 null，调用方使用替代表现，不让整场景因一个资源中断；
// 失败的路径记在 failed 里，换区域前据此确认新场景用到的模型都已加载（L05）
export const failed = new Set<string>()
export function loadGltf(path: string): Promise<GLTF | null> {
  let p = cache.get(path)
  if (!p) {
    p = loader.loadAsync(ASSET_ROOT + path).then((g) => { failed.delete(path); return g }, (e) => {
      console.warn('[assets] 缺少资源', path, e?.message ?? e)
      cache.delete(path) // 不记住失败：之后再用到时重新请求
      failed.add(path)
      return null
    })
    cache.set(path, p)
  }
  return p
}

// Nature Kit 用语义化材质名（leafsGreen、woodBark、grass…）；同名材质全场共享，便于按季节统一改色
const shared = new Map<string, THREE.MeshStandardNodeMaterial>()
export function sharedMaterial(name: string, color: number) {
  let m = shared.get(name)
  if (!m) {
    m = new THREE.MeshStandardNodeMaterial({ color, roughness: 0.9, metalness: 0, flatShading: true })
    m.name = name
    shared.set(name, m)
  }
  return m
}
export const getShared = (name: string) => shared.get(name)

export interface Part { geometry: THREE.BufferGeometry; material: THREE.Material | THREE.Material[] }

export interface PartOptions {
  palette?: (name: string) => number | undefined // 按材质名换成全场共享材质
  remap?: (m: THREE.Material) => THREE.Material | undefined
  center?: boolean // 水平方向居中（围栏、树篱等原点在格边的模型）
}
// 把模型拆成“几何（已烘焙节点变换）+ 材质”的列表，供实例化使用
export function extractParts(root: THREE.Object3D, opts: PartOptions = {}): Part[] {
  root.updateMatrixWorld(true)
  const parts: Part[] = []
  const box = new THREE.Box3()
  root.traverse((o) => {
    const mesh = o as THREE.Mesh
    if (!mesh.isMesh || (mesh as THREE.SkinnedMesh).isSkinnedMesh) return
    const geometry = mesh.geometry.clone().applyMatrix4(mesh.matrixWorld)
    geometry.computeBoundingBox()
    box.union(geometry.boundingBox!)
    const remap = (m: THREE.Material) => {
      const r = opts.remap?.(m)
      if (r) return r
      const color = opts.palette?.(m.name)
      return color === undefined ? m : sharedMaterial(m.name, color)
    }
    const material = Array.isArray(mesh.material) ? mesh.material.map(remap) : remap(mesh.material)
    parts.push({ geometry, material })
  })
  if (opts.center && parts.length) {
    const c = box.getCenter(new THREE.Vector3())
    for (const p of parts) p.geometry.translate(-c.x, 0, -c.z)
  }
  return parts
}

// 同一个材质对象、同样顶点结构的部件拼成一个（无损，不改材质与外观）：模型按节点拆出的部件很多其实共用一份调色板材质
// （树的枝干、树冠与积雪，机器、家具的各个零件）。全部模型 1691 → 905 个部件，合批与每帧经过 three 渲染流程的网格同比减少
export function mergeByMaterial(parts: Part[]): Part[] {
  const layout = (g: THREE.BufferGeometry) => Object.keys(g.attributes).sort().map((n) => { const a = g.attributes[n]; return `${n}:${a.itemSize}:${a.normalized}:${(a as THREE.BufferAttribute).array.constructor.name}` }).join()
  const sig = (p: Part) => (Array.isArray(p.material) || p.geometry.groups.length || Object.keys(p.geometry.morphAttributes).length ? '' : `${p.material.uuid}|${layout(p.geometry)}|${!!p.geometry.index}`)
  const groups = new Map<string, Part[]>()
  const order: (Part | Part[])[] = [] // 保持原来的前后顺序（第一次出现的位置）
  for (const p of parts) {
    const k = sig(p)
    if (!k) { order.push(p); continue }
    let list = groups.get(k)
    if (!list) { groups.set(k, (list = [])); order.push(list) }
    list.push(p)
  }
  return order.flatMap((x) => {
    if (!Array.isArray(x)) return [x]
    if (x.length === 1) return x
    const merged = mergeGeometries(x.map((p) => p.geometry))
    return merged ? [{ geometry: merged, material: x[0].material }] : x // 合并失败就保留原来的各个部件
  })
}

// 同一模型的大量摆放：每个子网格一个网格，共用同一组实例矩阵与颜色（几何体上的实例属性）；容量不足时自动翻倍。
// 不用 InstancedMesh：three r186 给每个 InstancedMesh 单独跑一遍着色器构建（缓存键带网格 uuid，满载农场 460 多次，
// 第一次画一个区域要卡 1—5 秒）。这里实例数据放在几何体属性里、材质换成共用的“实例化变体”，同材质、同顶点结构的合批共用一份着色器
const IM = mat4(attribute('iM0', 'vec4'), attribute('iM1', 'vec4'), attribute('iM2', 'vec4'), attribute('iM3', 'vec4'))
// 只建一个函数节点（每次新建都会带进不同的缓存键）；原材质的位置节点（随风摆动等）作参数，在实例化之后的网格空间里偏移，与 three 自带实例化的顺序一致
const instancing = Fn(([base]: [THREE.Node]) => {
  positionLocal.assign(IM.mul(vec4(positionLocal, 1)).xyz)
  normalLocal.assign(transformNormal(normalLocal, IM))
  instanceColor.assign(attribute('iColor', 'vec3'))
  return base
})
const instancingOf = new Map<THREE.Node, THREE.Node>() // 同一个位置节点只包一次：节点对象不同，缓存键就不同
const instanced = new WeakMap<THREE.Material, THREE.Material>()
function instancedMaterial(m: THREE.Material) {
  let v = instanced.get(m)
  if (!v) {
    const src = m as THREE.MeshStandardNodeMaterial
    const nm = src.clone()
    nm.color = src.color // 共用颜色对象：按季节改色（getShared(...).color.set）照样生效
    if (src.emissive) nm.emissive = src.emissive
    const base = src.positionNode ?? positionLocal
    let pos = instancingOf.get(base)
    if (!pos) instancingOf.set(base, (pos = instancing(base)))
    nm.positionNode = pos
    instanced.set(m, (v = nm))
  }
  return v
}
export class Batch {
  meshes: THREE.Mesh[] = []
  count = 0
  private capacity = 0
  private m = new THREE.Matrix4()
  private matrices!: THREE.InstancedInterleavedBuffer
  private colors!: THREE.InstancedBufferAttribute
  // 视锥剔除（地图外一圈树林按区块分批）：提交时按实例位置算一个包住全部实例的包围球
  cull = false
  private reach = 0 // 模型自身最远处到原点的距离（再乘实例缩放）
  constructor(parts: Part[], parent: THREE.Object3D, capacity = 8, shadow = true) {
    this.meshes = parts.map((p) => {
      const g = new THREE.InstancedBufferGeometry()
      g.index = p.geometry.index
      for (const [k, a] of Object.entries(p.geometry.attributes)) g.setAttribute(k, a)
      g.groups = p.geometry.groups
      const mesh = new THREE.Mesh(g, Array.isArray(p.material) ? p.material.map(instancedMaterial) : instancedMaterial(p.material))
      mesh.castShadow = shadow
      mesh.receiveShadow = true
      mesh.frustumCulled = false // ponytail: 区域不大，省去包围体维护；分块加载时再按 16×16 区块裁剪
      mesh.userData.batch = true
      mesh.matrixAutoUpdate = mesh.matrixWorldAutoUpdate = false // 合批网格永远在原点，实例位置在实例属性里
      parent.add(mesh)
      if (!p.geometry.boundingSphere) p.geometry.computeBoundingSphere()
      const bs = p.geometry.boundingSphere!
      this.reach = Math.max(this.reach, bs.center.length() + bs.radius)
      return mesh
    })
    this.grow(capacity)
  }
  private grow(capacity: number) {
    const old = this.matrices
    const oldColors = this.colors
    this.capacity = capacity
    this.matrices = new THREE.InstancedInterleavedBuffer(new Float32Array(capacity * 16), 16)
    this.colors = new THREE.InstancedBufferAttribute(new Float32Array(capacity * 3).fill(1), 3)
    if (old) {
      this.matrices.array.set(old.array)
      this.colors.array.set(oldColors.array)
    }
    for (const mesh of this.meshes) {
      for (let i = 0; i < 4; i++) mesh.geometry.setAttribute('iM' + i, new THREE.InterleavedBufferAttribute(this.matrices, 4, i * 4))
      mesh.geometry.setAttribute('iColor', this.colors)
      ;(mesh as unknown as { instanceColor: unknown }).instanceColor = this.colors // 让材质乘上实例颜色（three 按 object.instanceColor 判断）
    }
  }
  reset() {
    this.count = 0
  }

  add(matrix: THREE.Matrix4, color?: THREE.Color) {
    if (this.count >= this.capacity) this.grow(this.capacity * 2)
    const i = this.count++
    matrix.toArray(this.matrices.array, i * 16)
    if (color) this.colors.setXYZ(i, color.r, color.g, color.b)
    else this.colors.setXYZ(i, 1, 1, 1)
    return i
  }
  addAt(x: number, y: number, z: number, rotY = 0, sx = 1, sy = sx, sz = sx, color?: THREE.Color) {
    this.m.compose(_p.set(x, y, z), _q.setFromAxisAngle(_up, rotY), _s.set(sx, sy, sz))
    return this.add(this.m, color)
  }
  commit() {
    for (const mesh of this.meshes) {
      (mesh.geometry as THREE.InstancedBufferGeometry).instanceCount = this.count
      mesh.visible = this.count > 0 // 别的区域留下的空批次不进渲染列表（满载农场每帧约 800 个空绘制，各自都要走一遍更新与绑定）
    }
    this.matrices.needsUpdate = true
    this.colors.needsUpdate = true
    if (this.cull) this.bound()
  }
  private bound() {
    const a = this.matrices.array
    _box.makeEmpty()
    let s = 0
    for (let i = 0; i < this.count; i++) {
      const o = i * 16
      _box.expandByPoint(_p.set(a[o + 12], a[o + 13], a[o + 14]))
      s = Math.max(s, Math.hypot(a[o], a[o + 1], a[o + 2]), Math.hypot(a[o + 4], a[o + 5], a[o + 6]))
    }
    const sphere = new THREE.Sphere()
    if (this.count) _box.getBoundingSphere(sphere).radius += this.reach * s
    for (const mesh of this.meshes) {
      mesh.geometry.boundingSphere = sphere
      mesh.frustumCulled = this.count > 0
    }
  }
}
const _p = new THREE.Vector3()
const _box = new THREE.Box3()
const _q = new THREE.Quaternion()
const _s = new THREE.Vector3()
const _up = new THREE.Vector3(0, 1, 0)

// 刚体层级动画的生物（动物、敌人：每个部件一个网格）按材质合成蒙皮网格（通常 1—2 个）：
// 部件换成同名骨骼（动画轨道按名字绑定不变），顶点 100% 绑到原部件。一头牛从 22 次绘制变成 1 次，满载农场 32 只动物时绘制批次约 1080 → 400
function rigidToSkinned(scene: THREE.Object3D) {
  if (scene.userData.rigid !== undefined) return
  scene.userData.rigid = false
  const meshes: THREE.Mesh[] = []
  let skinned = false
  scene.traverse((o) => { if ((o as THREE.SkinnedMesh).isSkinnedMesh) skinned = true; else if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh) })
  if (skinned || meshes.length < 2 || meshes.some((m) => Array.isArray(m.material))) return
  const groups = new Map<THREE.Material, number[]>()
  meshes.forEach((m, i) => { const g = groups.get(m.material as THREE.Material) ?? []; g.push(i); groups.set(m.material as THREE.Material, g) })
  const attrs = (i: number) => Object.keys(meshes[i].geometry.attributes).sort().join() + !!meshes[i].geometry.index
  for (const ids of groups.values()) if (ids.some((i) => attrs(i) !== attrs(ids[0]))) return
  scene.updateMatrixWorld(true)
  const inv = scene.matrixWorld.clone().invert()
  const merged = [...groups].map(([mat, ids]) => [mat, mergeGeometries(ids.map((i) => {
    const g = meshes[i].geometry.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, meshes[i].matrixWorld))
    const n = g.attributes.position.count
    g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(new Uint16Array(n * 4).map((_, k) => (k % 4 ? 0 : i)), 4))
    g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(new Float32Array(n * 4).map((_, k) => (k % 4 ? 0 : 1)), 4))
    return g
  }))] as const)
  if (merged.some(([, g]) => !g)) return
  const bones = meshes.map((m) => {
    const b = new THREE.Bone()
    b.name = m.name
    b.position.copy(m.position)
    b.quaternion.copy(m.quaternion)
    b.scale.copy(m.scale)
    m.parent!.add(b)
    for (const c of [...m.children]) b.add(c)
    m.removeFromParent()
    return b
  })
  // 骨骼数补齐到 16 的倍数（至少 32）：骨骼数会写进着色器，补齐后各种生物共用同一套着色器，加载时少编译十几次
  const pad = Math.max(32, Math.ceil(bones.length / 16) * 16)
  while (bones.length < pad) { const b = new THREE.Bone(); b.matrixAutoUpdate = b.matrixWorldAutoUpdate = false; scene.add(b); bones.push(b) }
  const sms = merged.map(([mat, g]) => {
    const sm = new THREE.SkinnedMesh(g!, mat)
    sm.castShadow = sm.receiveShadow = true
    scene.add(sm)
    return sm
  })
  scene.updateMatrixWorld(true)
  const skeleton = new THREE.Skeleton(bones)
  for (const sm of sms) sm.bind(skeleton)
  scene.userData.rigid = true
}

// 同一骨架、同一材质、同样摆放的几个蒙皮网格（Kenney 角色的身体、头、手）拼成一个：
// 角色每个约 3 个网格 → 1—2 个；节庆时 16 位居民同场，主视图与阴影各少几十次绘制
function mergeSkinned(scene: THREE.Object3D) {
  if (scene.userData.skinMerged) return
  scene.userData.skinMerged = true
  const groups = new Map<string, THREE.SkinnedMesh[]>()
  scene.traverse((o) => {
    const m = o as THREE.SkinnedMesh
    if (!m.isSkinnedMesh || Array.isArray(m.material) || m.geometry.groups.length || Object.keys(m.geometry.morphAttributes).length) return
    const g = m.geometry
    const layout = Object.keys(g.attributes).sort().map((n) => `${n}:${g.attributes[n].itemSize}:${(g.attributes[n] as THREE.BufferAttribute).array.constructor.name}`).join()
    const key = [m.material.uuid, m.skeleton.bones.map((b) => b.uuid).join(), m.bindMatrix.elements.join(), m.matrix.elements.join(), m.parent?.uuid, layout, !!g.index].join('|')
    const list = groups.get(key)
    if (list) list.push(m); else groups.set(key, [m])
  })
  for (const list of groups.values()) {
    if (list.length < 2) continue
    const merged = mergeGeometries(list.map((m) => m.geometry))
    if (!merged) continue
    list[0].geometry = merged
    for (const m of list.slice(1)) m.removeFromParent()
  }
}

// 角色等带骨骼动画的模型：每个实例独立克隆
export async function instantiateSkinned(path: string) {
  const gltf = await loadGltf(path)
  if (!gltf) return null
  rigidToSkinned(gltf.scene)
  mergeSkinned(gltf.scene)
  const root = cloneSkinned(gltf.scene)
  root.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.castShadow = o.receiveShadow = true
  })
  return { root, animations: gltf.animations }
}
