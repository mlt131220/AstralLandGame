// 地表：每格一个泼溅纹素（R 土路 / G 石板 / R+G 岩地 / B 耕地 / A 湿润），着色器混合并用噪声打散边缘；
// 水格把地形压低形成河岸，上方一张统一水面。矿洞用洞底配色（cave）。
// 材质与泼溅贴图全局共用（贴图固定 128×128，按区域只用左上一块）：换区域只重建网格，不重编着色器。
import * as THREE from 'three/webgpu'
import {
  clamp, color, float, mix, mx_noise_float, positionWorld, smoothstep, texture, time, uniform, uv, vec3,
} from 'three/tsl'
import { isWater } from '../core/regions.ts'

export const MARGIN = 14 // 地图外延伸的地面（米），外圈种树遮住边界
export const WATER_Y = -0.16
const TEX = 128 // 泼溅贴图边长，需 ≥ 最大区域 + 2×MARGIN

const data = new Uint8Array(TEX * TEX * 4)
const splat = new THREE.DataTexture(data, TEX, TEX, THREE.RGBAFormat)
splat.magFilter = splat.minFilter = THREE.LinearFilter
splat.flipY = false
splat.needsUpdate = true
const grassA = uniform(new THREE.Color(0x76b551))
const grassB = uniform(new THREE.Color(0x5e9c43))
// 洞底：苔石浅矿 / 旧铁矿 / 寒晶深矿
const caveA = uniform(new THREE.Color(0x7a6f5e))
const caveB = uniform(new THREE.Color(0x5f5648))
const CAVE_COLORS = [[0x7a6f5e, 0x5f5648], [0x7a5a46, 0x5a4034], [0x7a8898, 0x58687a]]
export function setCaveTheme(theme: number) {
  caveA.value.set(CAVE_COLORS[theme][0])
  caveB.value.set(CAVE_COLORS[theme][1])
}

// 室内木地板色：家（暖棕）、商店（浅橡木）、畜舍（干草地面不用）、石屋（石砖地面不用）
const woodA = uniform(new THREE.Color(0xa87a50))
const woodB = uniform(new THREE.Color(0x8a6040))
const ROOM_WOOD: Record<string, [number, number]> = { home: [0xa87a50, 0x8a6040], shop: [0xbf9c6c, 0xa07e54], barn: [0x9a7448, 0x7c5a38], stone: [0x9a7a58, 0x7a5e44] }
export function setRoomStyle(style: string) {
  woodA.value.set(ROOM_WOOD[style][0])
  woodB.value.set(ROOM_WOOD[style][1])
}
// 室内：R 木地板、G 石砖、R+G 稻草，都没有为墙脚与墙外（暗色，墙块盖住）
function indoorMaterial() {
  const wp = positionWorld
  const sp = texture(splat, uv())
  const fine = mx_noise_float(vec3(wp.x.mul(2.3), wp.z.mul(2.3), 7.3))
  // 木地板：沿 X 的长条板（宽 0.25 米），每条板错缝、深浅不一，带细木纹
  const pz = wp.z.mul(4)
  const row = pz.floor()
  const px = wp.x.mul(0.55).add(mx_noise_float(vec3(row, 1.7, 0.3)).mul(3))
  const seam = smoothstep(0.0, 0.07, pz.fract()).mul(smoothstep(1.0, 0.93, pz.fract())).mul(smoothstep(0.0, 0.025, px.fract())).mul(smoothstep(1.0, 0.975, px.fract()))
  const tone = mx_noise_float(vec3(px.floor(), row, 2.2)).mul(0.5).add(0.5)
  const grain = mx_noise_float(vec3(wp.x.mul(6), wp.z.mul(38), 1.1)).mul(0.07)
  const wood = mix(woodB.mul(0.55), mix(woodA, woodB, tone).mul(grain.add(1)), seam)
  // 石砖：0.5 米方砖，灰缝与每块不同的灰度
  const tx = wp.x.mul(2)
  const tz = wp.z.mul(2)
  const grout = smoothstep(0.0, 0.06, tx.fract()).mul(smoothstep(1.0, 0.94, tx.fract())).mul(smoothstep(0.0, 0.06, tz.fract())).mul(smoothstep(1.0, 0.94, tz.fract()))
  const flag = mix(color(0xb4ab9d), color(0x958c7f), mx_noise_float(vec3(tx.floor(), tz.floor(), 4.2)).mul(0.5).add(0.5)).mul(fine.mul(0.06).add(1))
  const tile = mix(color(0x655e56), flag, grout)
  // 稻草：泥地上铺干草，细密的纤维噪声
  const fiber = mx_noise_float(vec3(wp.x.mul(16), wp.z.mul(3.2), 9.1)).add(mx_noise_float(vec3(wp.x.mul(3.5), wp.z.mul(15), 5.4))).mul(0.5)
  const patch = mx_noise_float(vec3(wp.x.mul(0.45), wp.z.mul(0.45), 3.3))
  const straw = mix(color(0x8a6d45), mix(color(0xc8a35a), color(0xe2c77c), fiber.mul(0.5).add(0.5)), smoothstep(-0.45, 0.1, patch.add(fiber.mul(0.3))))
  let c = mix(color(0x0d0a08), wood, smoothstep(0.4, 0.6, sp.r.mul(sp.g.oneMinus())))
  c = mix(c, tile, smoothstep(0.4, 0.6, sp.g.mul(sp.r.oneMinus())))
  c = mix(c, straw, smoothstep(0.4, 0.6, sp.r.mul(sp.g)))
  const mat = new THREE.MeshStandardNodeMaterial({ roughness: 0.8, metalness: 0 })
  mat.colorNode = c
  return mat
}

function groundMaterial(cave: boolean) {
  const wp = positionWorld
  const sp = texture(splat, uv())
  const big = mx_noise_float(vec3(wp.x.mul(0.11), wp.z.mul(0.11), 0.5))
  const fine = mx_noise_float(vec3(wp.x.mul(2.3), wp.z.mul(2.3), 7.3))
  const edge = fine.mul(0.16)
  const grass = mix(grassA, grassB, big.mul(0.5).add(0.5)).mul(fine.mul(0.05).add(1))
  const dirt = color(0xc2a074).mul(fine.mul(0.08).add(0.95))
  // 石板：错缝方砖 + 灰缝
  const bx = wp.x.mul(1.4)
  const bz = wp.z.mul(1.4)
  const row = bz.floor()
  const fx = bx.add(row.mod(2).mul(0.5)).fract()
  const fz = bz.fract()
  const grout = smoothstep(0.0, 0.07, fx).mul(smoothstep(1.0, 0.93, fx)).mul(smoothstep(0.0, 0.07, fz)).mul(smoothstep(1.0, 0.93, fz))
  const stone = mix(color(0x8f8a85), mix(color(0xc9c2b6), color(0xb5aea2), mx_noise_float(vec3(bx.add(row.mod(2).mul(0.5)).floor(), row, 3.1)).mul(0.5).add(0.5)), grout)
  const soil = mix(color(0x9a6a43), color(0x5c3c26), sp.a)
  // R 与 G 同时为岩地；单独 R 为土路、单独 G 为石板
  const rockW = sp.r.mul(sp.g), dirtW = sp.r.mul(sp.g.oneMinus()), paveW = sp.g.mul(sp.r.oneMinus())
  const caveFloor = mix(caveA, caveB, big.mul(0.5).add(0.5)).mul(fine.mul(0.1).add(1))
  const base = cave ? caveFloor : grass
  const path = cave ? color(0x74695a).mul(fine.mul(0.1).add(0.95)) : dirt
  const rock = cave ? color(0x0d0c0b) : mix(color(0x8d8374), color(0x6f675b), fine.mul(0.5).add(0.5))
  let c = mix(base, path, smoothstep(0.42, 0.62, dirtW.add(edge)))
  c = mix(c, stone, smoothstep(0.42, 0.62, paveW.add(edge.mul(0.5))))
  c = mix(c, rock, smoothstep(0.35, 0.6, rockW.add(edge.mul(0.5))))
  c = mix(c, soil, smoothstep(0.35, 0.6, sp.b.add(edge)))
  // 水下河床与岸边湿泥
  const under = smoothstep(-0.02, -0.3, wp.y)
  c = mix(c, color(0x6f6145), under.mul(0.85))
  const mat = new THREE.MeshStandardNodeMaterial({ roughness: 0.95, metalness: 0 })
  mat.colorNode = c
  return mat
}
const MATERIALS = { outdoor: groundMaterial(false), cave: groundMaterial(true), indoor: indoorMaterial() }
export type GroundKind = keyof typeof MATERIALS

// 水面：深浅两色 + 随时间流动的噪声波纹，低粗糙度带出高光
const WATER_MAT = (() => {
  const wp = positionWorld
  const flow = mx_noise_float(vec3(wp.x.mul(0.9), wp.z.mul(0.9), time.mul(0.35)))
  const ripple = mx_noise_float(vec3(wp.x.mul(3.1).add(time.mul(0.4)), wp.z.mul(3.1), time.mul(0.6)))
  const m = new THREE.MeshStandardNodeMaterial({ roughness: 0.12, metalness: 0, transparent: true })
  m.colorNode = mix(color(0x2f7fb5), color(0x5bb3d6), clamp(flow.mul(0.6).add(0.5), 0, 1)).add(vec3(smoothstep(0.55, 0.75, ripple).mul(0.18)))
  m.opacityNode = float(0.82)
  return m
})()

export class Terrain {
  mesh: THREE.Mesh
  water: THREE.Mesh
  private W: number
  private H: number

  constructor(w: number, h: number, kind: GroundKind = 'outdoor') {
    this.W = w + MARGIN * 2
    this.H = h + MARGIN * 2
    const { W, H } = this
    // 网格顶点在格子角点；uv 指向格子中心对应的纹素（贴图只用左上 W×H 一块）
    const geo = new THREE.PlaneGeometry(W, H, W * 2, H * 2).rotateX(-Math.PI / 2) // 每格 2×2 细分，水岸更圆润
    geo.translate(W / 2 - MARGIN, 0, H / 2 - MARGIN)
    const uvs = geo.attributes.uv as THREE.BufferAttribute
    const pos = geo.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < pos.count; i++) uvs.setXY(i, (pos.getX(i) + MARGIN) / TEX, (pos.getZ(i) + MARGIN) / TEX)
    this.mesh = new THREE.Mesh(geo, MATERIALS[kind])
    this.mesh.receiveShadow = true
    this.water = new THREE.Mesh(new THREE.PlaneGeometry(W, H).rotateX(-Math.PI / 2), WATER_MAT)
    this.water.position.set(W / 2 - MARGIN, WATER_Y, H / 2 - MARGIN)
  }

  dispose() {
    this.mesh.geometry.dispose()
    this.water.geometry.dispose()
  }

  // 静态地面：0 草 1 土路 2 水 3 石板 4 洞底 5 岩壁 6 木栈（下为水）；室内 7 木地板 8 墙 9 石砖 10 稻草。水格周围顶点下沉成河岸
  setGround(ground: (x: number, z: number) => number) {
    const { W, H } = this
    data.fill(0)
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const g = ground(i - MARGIN, j - MARGIN)
      const o = (j * TEX + i) * 4
      data[o] = g === 1 || g === 5 || g === 7 || g === 10 ? 255 : 0
      data[o + 1] = g === 3 || g === 5 || g === 9 || g === 10 ? 255 : 0
    }
    splat.needsUpdate = true
    // 顶点按到最近水格中心的距离平滑下沉：岸线约在水格外 0.2 格处，避免方格锯齿
    const mask = new Uint8Array(W * H)
    let any = false
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) if (isWater(ground(i - MARGIN, j - MARGIN))) { mask[j * W + i] = 1; any = true }
    const pos = this.mesh.geometry.attributes.position as THREE.BufferAttribute
    for (let k = 0; k < pos.count; k++) {
      const px = pos.getX(k)
      const pz = pos.getZ(k)
      let d = 9
      const ci = Math.floor(px) + MARGIN, cj = Math.floor(pz) + MARGIN
      for (let j = cj - 2; j <= cj + 2; j++) for (let i = ci - 2; i <= ci + 2; i++) {
        if (i < 0 || j < 0 || i >= W || j >= H || !mask[j * W + i]) continue
        d = Math.min(d, Math.hypot(i - MARGIN + 0.5 - px, j - MARGIN + 0.5 - pz))
      }
      const t = Math.min(1, Math.max(0, (d - 0.2) / 0.8))
      pos.setY(k, d >= 1 ? 0 : -0.65 * (1 - t * t * (3 - 2 * t)))
    }
    pos.needsUpdate = true
    this.mesh.geometry.computeVertexNormals()
    this.water.visible = any
  }

  // 动态地面：耕地与当日湿润（只在农场有）
  setTiles(w: number, h: number, tile: (x: number, z: number) => { till: boolean; wet: boolean } | null) {
    for (let z = 0; z < h; z++) for (let x = 0; x < w; x++) {
      const t = tile(x, z)
      const o = ((z + MARGIN) * TEX + x + MARGIN) * 4
      data[o + 2] = t?.till ? 255 : 0
      data[o + 3] = t?.till && t.wet ? 255 : 0
    }
    splat.needsUpdate = true
  }

  setSeason(season: number) {
    const A = [0x7cbf55, 0x5fa646, 0xb7a552, 0xe4ebef]
    const B = [0x5f9f42, 0x478a36, 0x9a7f3e, 0xc9d3db]
    grassA.value.set(A[season])
    grassB.value.set(B[season])
  }
}
