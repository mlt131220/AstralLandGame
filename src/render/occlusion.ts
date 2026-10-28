// 遮挡淡化（设计 7.1）：挡在镜头与角色之间的树冠、屋顶、岩壁按屏幕抖动镂空，只影响显示，不改碰撞与点选。
// 对实例化网格同样有效（按片元世界坐标判断），不需要排序透明物体。
import * as THREE from 'three/webgpu'
import { float, interleavedGradientNoise, positionWorld, screenCoordinate, smoothstep, uniform } from 'three/tsl'

export const occPlayer = uniform(new THREE.Vector3())
export const occDir = uniform(new THREE.Vector3(0, -1, 0)) // 镜头视线方向（单位向量）

const d = positionWorld.sub(occPlayer)
const along = d.dot(occDir) // 负值：比角色更靠近镜头
const perp = d.sub(occDir.mul(along)).length() // 到视线的距离
const cut = smoothstep(-0.2, -0.9, along).mul(smoothstep(2.3, 1.3, perp)).mul(smoothstep(0.45, 0.9, positionWorld.y))
const FADE = float(1).sub(cut.mul(0.88))
const DITHER = interleavedGradientNoise(screenCoordinate.xy)

const converted = new WeakMap<THREE.Material, THREE.MeshStandardNodeMaterial>()
// glTF 读进来的是普通材质：转成节点材质后才能挂自定义节点
function toNode(m: THREE.Material): THREE.MeshStandardNodeMaterial {
  if ((m as THREE.MeshStandardNodeMaterial).isNodeMaterial) return m as THREE.MeshStandardNodeMaterial
  let n = converted.get(m)
  if (!n) {
    const s = m as THREE.MeshStandardMaterial
    n = new THREE.MeshStandardNodeMaterial({
      name: s.name, map: s.map, vertexColors: s.vertexColors, roughness: s.roughness ?? 0.9, metalness: s.metalness ?? 0,
      roughnessMap: s.roughnessMap, metalnessMap: s.metalnessMap, normalMap: s.normalMap, emissiveMap: s.emissiveMap,
      emissiveIntensity: s.emissiveIntensity ?? 1, flatShading: s.flatShading, side: s.side, transparent: s.transparent, opacity: s.opacity,
    })
    if (s.color) n.color.copy(s.color)
    if (s.emissive) n.emissive.copy(s.emissive)
    converted.set(m, n)
  }
  return n
}
export function cutout<T extends { material: THREE.Material | THREE.Material[] }>(parts: T[]) {
  for (const p of parts) {
    const conv = (m: THREE.Material) => {
      const n = toNode(m)
      if (!n.userData.cut && !n.transparent) {
        n.userData.cut = true
        n.opacityNode = FADE
        n.alphaTestNode = DITHER
      }
      return n
    }
    p.material = Array.isArray(p.material) ? p.material.map(conv) : conv(p.material)
  }
  return parts
}
