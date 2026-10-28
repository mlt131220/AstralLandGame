// 宠物（设计 §3.3、§10.3）：猫或犬，只区别动画与声音，不影响数值；不会饿、不会走失。
// 摸头每天一次推动关系；门口的食盆随时可以添，空盆没有任何惩罚。白天晴天在家门前院子里转，夜里或雨天回屋趴在窝里。
import { fail, ok, type R } from './actions.ts'
import { regionOf, raining, solid, type GameState } from './state.ts'
import { t as tr } from './i18n.ts'

export const PETS = {
  cat: { name: tr('pets.ginger'), sound: 'meow', happy: 'purr' }, cat_b: { name: tr('pets.tabby'), sound: 'meow', happy: 'purr' },
  dog: { name: tr('pets.shiba'), sound: 'bark', happy: 'whine' }, dog_b: { name: tr('pets.collie'), sound: 'bark', happy: 'whine' },
} as const
export type PetKind = keyof typeof PETS
export interface Pet { kind: PetKind; name: string; love: number; pet: number; fed: number }
export const petModel = (k: PetKind) => `models/g4/pets/${k}.glb`
// 与鸡鸭兔同样放大，和角色（约 1.6 米）放在一起看得清
export const petScale = (k: PetKind) => (k.startsWith('cat') ? 1.8 : 1.5)
export const PET_OFFER_DAY = 3 // 周芹把小猫小狗带来的日子

export function adoptPet(s: GameState, kind: string, name: string): R {
  if (s.pet) return fail(tr('pets.alreadyPet'))
  if (!(kind in PETS)) return fail()
  const n = name.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 8)
  s.pet = { kind: kind as PetKind, name: n || PETS[kind as PetKind].name, love: 0, pet: 0, fed: 0 }
  return ok(tr('pets.nowPartFamily', s.pet.name))
}
export function petPet(s: GameState): R {
  const p = s.pet
  if (!p) return fail()
  if (p.pet === s.day) return fail(tr('pets.youveAlreadyPettedToday', p.name))
  p.pet = s.day
  p.love = Math.min(1000, p.love + 10)
  return ok(p.kind.startsWith('cat') ? tr('pets.squintsHappilyNuzzlesHand', p.name) : tr('pets.wagsTailLikeCrazy', p.name))
}
export function fillBowl(s: GameState): R {
  const p = s.pet
  if (!p) return fail(tr('pets.noPetYet'))
  if (p.fed === s.day) return fail(tr('pets.petBowlFull'))
  p.fed = s.day
  p.love = Math.min(1000, p.love + 2)
  return ok(tr('pets.filledPetBowlTrots', p.name))
}

// ---------- 运行时表现（不存档） ----------
export interface PetActor { x: number; z: number; face: number; tx: number; tz: number; t: number; mode: 'idle' | 'walk' | 'sit' | 'sleep' | 'eat' | 'happy'; where: string }
const YARD = { x: 18, z: 9.6, w: 13, d: 6 } // 农场家门前
const outside = (s: GameState) => s.min >= 390 && s.min < 1140 && !raining(s)
export function petStep(s: GameState, a: PetActor | null, dt: number): PetActor | null {
  if (!s.pet) return null
  const out = outside(s)
  const here = s.region === 'farm' ? out : s.region === 'in:house' ? !out : false
  if (!here) return null
  const r = regionOf(s)
  const area = s.region === 'farm' ? YARD : { x: 1, z: 1.5, w: r.w - 2, d: r.h - 3 }
  const free = (x: number, z: number) => x >= area.x && z >= area.z && x < area.x + area.w && z < area.z + area.d && !solid(s, Math.floor(x), Math.floor(z))
  if (!a || a.where !== s.region) {
    const bed = r.decor.find((d) => d.m === 'pet_bed')
    let x = bed && s.region === 'in:house' ? bed.x : area.x + area.w / 2, z = bed && s.region === 'in:house' ? bed.z : area.z + 1
    for (let k = 0; k < 20 && !free(x, z) && !(bed && s.region === 'in:house'); k++) { x = area.x + Math.random() * area.w; z = area.z + Math.random() * area.d }
    a = { x, z, face: 0, tx: x, tz: z, t: 1, mode: s.region === 'in:house' && s.min >= 1260 ? 'sleep' : 'idle', where: s.region }
  }
  a.t -= dt
  if (a.mode === 'happy' && a.t > 0) return a
  if (a.t <= 0) {
    const night = s.region === 'in:house' && (s.min >= 1260 || s.min < 360)
    const k = Math.random()
    if (night) { a.mode = 'sleep'; a.t = 6 }
    else if (k < 0.4) { a.mode = 'walk'; a.tx = area.x + 0.5 + Math.random() * (area.w - 1); a.tz = area.z + 0.5 + Math.random() * (area.d - 1); a.t = 5 }
    else { a.mode = k < 0.7 ? 'sit' : k < 0.85 ? 'idle' : 'sleep'; a.t = 3 + Math.random() * 4 }
  }
  if (a.mode === 'walk') {
    const dx = a.tx - a.x, dz = a.tz - a.z, d = Math.hypot(dx, dz)
    if (d < 0.05) { a.mode = 'sit'; a.t = 2 + Math.random() * 3 }
    else {
      const st = Math.min(d, 1.1 * dt)
      const nx = a.x + (dx / d) * st, nz = a.z + (dz / d) * st
      if (free(nx, nz)) { a.x = nx; a.z = nz } else a.t = 0
      a.face = Math.atan2(dx, dz)
    }
  }
  return a
}
// 跟着玩家看一眼、开心一下（摸头后）
export function petHappy(a: PetActor | null, px: number, pz: number) {
  if (!a) return
  a.mode = 'happy'
  a.t = 1
  a.face = Math.atan2(px - a.x, pz - a.z)
}
