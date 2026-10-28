// 动作反馈粒子：实例化的朝向相机的软圆片，逐粒子颜色与透明度（设计 4.1 / 23.3）。
import * as THREE from 'three/webgpu'
import { graphics } from '../platform/settings.ts'
import { float, instancedBufferAttribute, length, smoothstep, uv } from 'three/tsl'

export type FxKind = 'dust' | 'stone' | 'chips' | 'leaves' | 'water' | 'sparkle' | 'soil'
interface P { p: THREE.Vector3; v: THREE.Vector3; life: number; max: number; size: number; grow: number; gravity: number; color: THREE.Color }

const MAX = 512
const PRESETS: Record<FxKind, { n: number; colors: number[]; speed: number; up: number; size: number; grow: number; life: number; gravity: number }> = {
  dust: { n: 10, colors: [0xc9a477, 0xb08a5c, 0xdcc29a], speed: 1.1, up: 1.2, size: 0.22, grow: 0.6, life: 0.6, gravity: -1.5 },
  soil: { n: 12, colors: [0x7a5233, 0x5e3d25, 0x9a6a43], speed: 1.5, up: 2.4, size: 0.17, grow: -0.06, life: 0.55, gravity: 7 },
  stone: { n: 12, colors: [0x9aa0aa, 0x7c828c, 0xc8ccd2], speed: 2, up: 2.6, size: 0.16, grow: -0.08, life: 0.55, gravity: 9 },
  chips: { n: 12, colors: [0xc89458, 0x9a6a3a, 0xe0b880], speed: 2, up: 2.6, size: 0.16, grow: -0.06, life: 0.6, gravity: 9 },
  leaves: { n: 12, colors: [0x6fb04e, 0x4f9a3a, 0x9ac85a], speed: 1.6, up: 1.8, size: 0.14, grow: 0, life: 0.9, gravity: 2.2 },
  water: { n: 16, colors: [0x7fc6f0, 0xbfe6ff, 0x5aaee6], speed: 1.2, up: 2.4, size: 0.13, grow: -0.04, life: 0.5, gravity: 9 },
  sparkle: { n: 14, colors: [0xfff1a0, 0xffd34a, 0xffffff], speed: 1.4, up: 2.2, size: 0.13, grow: -0.1, life: 0.8, gravity: 1.5 },
}

export class Fx {
  mesh: THREE.InstancedMesh
  private alpha: THREE.InstancedBufferAttribute
  private ps: P[] = []
  private m = new THREE.Matrix4()
  private s = new THREE.Vector3()

  constructor() {
    this.alpha = new THREE.InstancedBufferAttribute(new Float32Array(MAX), 1)
    const mat = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false })
    const d = length(uv().sub(0.5))
    const a = instancedBufferAttribute(this.alpha, 'float') as unknown as ReturnType<typeof float> // 类型声明对属性节点推断不出 float
    mat.opacityNode = a.mul(smoothstep(float(0.5), float(0.32), d))
    this.mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), mat, MAX)
    this.mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAX * 3), 3)
    this.mesh.frustumCulled = false
    this.mesh.renderOrder = 3
    this.mesh.count = 0
  }

  emit(kind: FxKind, x: number, y: number, z: number) {
    const k = PRESETS[kind]
    const n = graphics.fewParticles ? Math.ceil(k.n * 0.35) : k.n
    for (let i = 0; i < n && this.ps.length < MAX; i++) {
      const a = Math.random() * Math.PI * 2
      const sp = k.speed * (0.5 + Math.random() * 0.7)
      this.ps.push({
        p: new THREE.Vector3(x + (Math.random() - 0.5) * 0.3, y, z + (Math.random() - 0.5) * 0.3),
        v: new THREE.Vector3(Math.cos(a) * sp, k.up * (0.6 + Math.random() * 0.6), Math.sin(a) * sp),
        life: 0, max: k.life * (0.7 + Math.random() * 0.6), size: k.size * (0.7 + Math.random() * 0.6), grow: k.grow,
        gravity: k.gravity, color: new THREE.Color(k.colors[i % k.colors.length]),
      })
    }
  }

  update(dt: number, camera: THREE.Camera) {
    const q = camera.quaternion
    let n = 0
    this.ps = this.ps.filter((p) => (p.life += dt) < p.max)
    for (const p of this.ps) {
      p.v.y -= p.gravity * dt
      p.v.multiplyScalar(1 - dt * 1.5)
      p.p.addScaledVector(p.v, dt)
      if (p.p.y < 0.03) { p.p.y = 0.03; p.v.y *= -0.3 }
      const t = p.life / p.max
      const size = Math.max(0.01, p.size + p.grow * t)
      this.m.compose(p.p, q, this.s.set(size, size, size))
      this.mesh.setMatrixAt(n, this.m)
      this.mesh.setColorAt(n, p.color)
      this.alpha.setX(n, t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85)
      n++
    }
    this.mesh.count = n
    this.mesh.instanceMatrix.needsUpdate = true
    this.mesh.instanceColor!.needsUpdate = true
    this.alpha.needsUpdate = true
  }
}
