// 雨雪：计算着色器粒子（显卡上推进，CPU 每帧只发一次计算与三次绘制）。
// 雨滴在镜头周围 48×48 米、14 米高的空间里下落，随镜头平移时在水平方向循环；落到地面溅起水花（小水圈 + 两颗弹起的水珠），
// 落进水面荡开两圈涟漪（按当前区域的水格判断）。屋顶、树冠不单独碰撞：落在屋后的水花被屋顶挡住，看上去就是雨停在屋顶。
// 雪：慢速飘落、左右摆动，落地即在顶上重生，不溅水花。
import * as THREE from 'three/webgpu'
import { clamp, color, cos, float, floor, Fn, hash, If, instancedArray, instanceIndex, int, length, max, mix, positionLocal, sin, smoothstep, uint, uniform, uv, vec2, vec3, vec4 } from 'three/tsl'
import { WATER_Y } from './terrain.ts'

const N = 9000
const SIZE = 48 // 水平范围（米）
const TOP = 14 // 雨滴最高（米）
const GRID = 64 // 水格表边长（≥ 最大区域）

export class Weather {
  readonly group = new THREE.Group()
  private pos = instancedArray(N, 'vec3') // 雨滴位置
  private hit = instancedArray(N, 'vec4') // 每颗雨滴最近一次落点（xyz）与时刻（w，-1 表示没有）
  private water = instancedArray(GRID * GRID, 'float') // 当前区域的水格（1 = 水面）
  private center = uniform(new THREE.Vector3())
  private dt = uniform(0)
  private now = uniform(0)
  private active = uniform(0) // 正在下落的雨滴数（按天气强弱）
  private snow = uniform(0) // 0 雨 1 雪
  private wind = uniform(new THREE.Vector2(0.8, 0.3))
  private region = uniform(new THREE.Vector2(48, 40))
  private init: THREE.ComputeNode
  private step: THREE.ComputeNode
  private ready = false
  private time = 0

  constructor() {
    const { pos, hit, water, center, dt, now, active, snow, wind, region } = this
    const rnd = (k: number) => hash(instanceIndex.add(uint(k)).add(now.mul(977).toUint()))
    this.init = Fn(() => {
      pos.element(instanceIndex).assign(vec3(center.x.add(hash(instanceIndex).sub(0.5).mul(SIZE)), hash(instanceIndex.add(uint(7))).mul(TOP), center.z.add(hash(instanceIndex.add(uint(13))).sub(0.5).mul(SIZE))))
      hit.element(instanceIndex).assign(vec4(0, -100, 0, -1))
    })().compute(N)

    this.step = Fn(() => {
      const p = pos.element(instanceIndex)
      If(instanceIndex.toFloat().greaterThanEqual(active), () => { p.y.assign(-100) }).Else(() => {
        const r = hash(instanceIndex.add(uint(31)))
        // 雨 15—21 m/s，顺风斜落；雪 1.0—1.8 m/s，左右飘
        const fall = mix(mix(float(15), float(21), r), mix(float(1.0), float(1.8), r), snow)
        const sway = sin(now.mul(1.3).add(r.mul(40))).mul(snow).mul(0.6)
        p.addAssign(vec3(wind.x.mul(mix(float(1), float(0.5), snow)).add(sway), fall.negate(), wind.y.mul(mix(float(1), float(0.5), snow))).mul(dt))
        // 镜头走开时在水平方向循环（始终铺满镜头附近）
        const rx = p.x.sub(center.x).add(SIZE / 2)
        const rz = p.z.sub(center.z).add(SIZE / 2)
        p.x.assign(center.x.sub(SIZE / 2).add(rx.sub(floor(rx.div(SIZE)).mul(SIZE))))
        p.z.assign(center.z.sub(SIZE / 2).add(rz.sub(floor(rz.div(SIZE)).mul(SIZE))))
        // 落点所在格是不是水
        const tx = floor(p.x), tz = floor(p.z)
        const inside = tx.greaterThanEqual(0).and(tz.greaterThanEqual(0)).and(tx.lessThan(region.x)).and(tz.lessThan(region.y))
        const wet = float(0).toVar()
        If(inside, () => { wet.assign(water.element(int(tz).mul(GRID).add(int(tx)))) })
        const ground = mix(float(0.01), float(WATER_Y), wet)
        If(p.y.lessThan(ground).and(p.y.greaterThan(-50)), () => {
          If(snow.lessThan(0.5), () => { hit.element(instanceIndex).assign(vec4(p.x, ground, p.z, now)) })
          p.assign(vec3(center.x.add(rnd(3).sub(0.5).mul(SIZE)), ground.add(TOP).add(rnd(5).mul(2)), center.z.add(rnd(11).sub(0.5).mul(SIZE))))
        })
        If(p.y.lessThanEqual(-50), () => { p.y.assign(rnd(17).mul(TOP)) }) // 刚从不活跃变为活跃：随机高度出现，不排成一层
      })
    })().compute(N)

    // 雨滴：沿下落方向拉长的细条；雪花：圆形软边小片
    const drop = new THREE.SpriteNodeMaterial({ transparent: true, depthWrite: false })
    drop.positionNode = pos.toAttribute()
    drop.scaleNode = mix(vec2(0.022, 0.46), vec2(0.09, 0.09), snow)
    drop.colorNode = mix(color(0xc4d8ff), color(0xffffff), snow)
    const flake = smoothstep(0.5, 0.15, length(uv().sub(0.5)))
    drop.opacityNode = mix(float(0.38), flake.mul(0.9), snow)
    const drops = new THREE.Sprite(drop)
    drops.count = N
    drops.frustumCulled = false

    // 落点：地面上的小水圈（0.28 秒）、水面上的两圈涟漪（0.9 秒）
    const h = hit.toAttribute()
    const onWater = h.y.lessThan(-0.05)
    const life = mix(float(0.28), float(0.9), onWater.select(1, 0))
    const age = now.sub(h.w)
    const k = clamp(age.div(life), 0, 1)
    const alive = age.greaterThanEqual(0).and(age.lessThan(life)).and(h.w.greaterThanEqual(0))
    const size = alive.select(mix(mix(float(0.05), float(0.24), k), mix(float(0.12), float(0.85), k), onWater.select(1, 0)), 0)
    const ringMat = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false })
    ringMat.positionNode = vec3(h.x, h.y.add(0.015), h.z).add(positionLocal.mul(size))
    const rr = length(uv().sub(0.5))
    const ring = (at: number, w: number) => smoothstep(at - w, at, rr).mul(smoothstep(at + w * 0.5, at, rr))
    ringMat.colorNode = color(0xe8f2ff)
    ringMat.opacityNode = ring(0.45, 0.07).add(ring(0.27, 0.06).mul(onWater.select(k, 0))).mul(float(1).sub(k)).mul(onWater.select(0.55, 0.4))
    const rings = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), ringMat)
    rings.count = N
    rings.frustumCulled = false
    rings.renderOrder = 2

    // 地面水花：每个落点弹起两颗小水珠，抛物线 0.3 秒
    const spray = new THREE.SpriteNodeMaterial({ transparent: true, depthWrite: false })
    const sh = hit.element(instanceIndex.div(2))
    const sAge = now.sub(sh.w)
    const sAlive = sAge.greaterThanEqual(0).and(sAge.lessThan(0.3)).and(sh.y.greaterThan(-0.05)).and(sh.w.greaterThanEqual(0))
    const ang = hash(instanceIndex.add(uint(101))).mul(6.2832)
    const sp = hash(instanceIndex.add(uint(57))).mul(0.6).add(0.5)
    const up = hash(instanceIndex.add(uint(83))).mul(1.0).add(1.4)
    spray.positionNode = vec3(sh.x.add(cos(ang).mul(sp).mul(sAge)), sh.y.add(max(up.mul(sAge).sub(sAge.mul(sAge).mul(4.9)), 0)), sh.z.add(sin(ang).mul(sp).mul(sAge)))
    spray.scaleNode = vec2(sAlive.select(0.05, 0))
    spray.colorNode = color(0xeaf3ff)
    spray.opacityNode = smoothstep(0.5, 0.2, length(uv().sub(0.5))).mul(float(1).sub(sAge.div(0.3))).mul(0.8)
    const drops2 = new THREE.Sprite(spray)
    drops2.count = N * 2
    drops2.frustumCulled = false

    for (const o of [drops, rings, drops2]) { o.castShadow = o.receiveShadow = false; o.matrixAutoUpdate = false; this.group.add(o) }
    this.group.visible = false
  }

  // 换区域：记下哪些格是水面（落进去荡涟漪，水面比地面低）
  setRegion(w: number, h: number, isWater: (x: number, z: number) => boolean) {
    const arr = (this.water.value as THREE.StorageInstancedBufferAttribute).array as Float32Array
    arr.fill(0)
    for (let z = 0; z < Math.min(h, GRID); z++) for (let x = 0; x < Math.min(w, GRID); x++) if (isWater(x, z)) arr[z * GRID + x] = 1
    ;(this.water.value as THREE.StorageInstancedBufferAttribute).needsUpdate = true
    this.region.value.set(Math.min(w, GRID), Math.min(h, GRID))
  }

  // 每帧：kind 0 不下 / 1 小雨 / 2 暴雨 / 3 雪；few = 减少粒子特效
  update(renderer: THREE.WebGPURenderer, dt: number, kind: number, center: THREE.Vector3, few: boolean) {
    this.group.visible = kind > 0
    if (!kind) return
    this.time += dt
    this.now.value = this.time
    this.dt.value = Math.min(dt, 0.1)
    this.center.value.copy(center)
    this.snow.value = kind === 3 ? 1 : 0
    this.active.value = Math.round(N * (kind === 2 ? 1 : kind === 3 ? 0.6 : 0.6) * (few ? 0.35 : 1))
    this.wind.value.set(kind === 2 ? 2.2 : 0.8, kind === 2 ? 0.9 : 0.3)
    if (!this.ready) { this.ready = true; renderer.compute(this.init) }
    renderer.compute(this.step)
  }
}
