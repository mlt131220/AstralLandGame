// 存档：3 个槽位，每槽保留当前检查点与前一经营日备份（设计 25.2）。
// ponytail: 用 localStorage（单次 setItem 原子、存档约 200KB）；存档超过 ~1MB 或需要 OPFS 快照时换 IndexedDB（25.3）。
import { migrate, validState as valid, type GameState } from '../core/state.ts'

export const SLOTS = [1, 2, 3]
const key = (slot: number) => `astral-land:slot${slot}`

// 当前档损坏时回退到前一日备份，绝不覆盖
export function readSlot(slot: number): GameState | null {
  for (const k of [key(slot), key(slot) + ':prev']) {
    try {
      const s = JSON.parse(localStorage.getItem(k) ?? 'null')
      if (valid(s)) return migrate(s)
    } catch { /* 尝试备份 */ }
  }
  return null
}

export function writeSlot(slot: number, s: GameState, newDay = false): boolean {
  try {
    if (newDay) {
      const cur = localStorage.getItem(key(slot))
      if (cur) localStorage.setItem(key(slot) + ':prev', cur)
    }
    s.commitSeq++
    s.updatedAt = Date.now()
    localStorage.setItem(key(slot), JSON.stringify(s))
    return true
  } catch {
    return false
  }
}

export function deleteSlot(slot: number) {
  localStorage.removeItem(key(slot))
  localStorage.removeItem(key(slot) + ':prev')
}

export function exportSave(s: GameState) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([JSON.stringify(s)], { type: 'application/json' }))
  a.download = `astral-land-${s.farm}-day${s.day}.json`
  a.click()
  URL.revokeObjectURL(a.href)
}

export function parseImport(text: string): GameState | null {
  if (text.length > 5_000_000) return null
  try {
    const s = JSON.parse(text)
    return valid(s) ? migrate(s) : null
  } catch {
    return null
  }
}

// 同一存档只允许一个标签页写入（25.4）。steal=true 为“在此接管”，旧页的 onLost 会被调用并停止写入
let releaseLock: (() => void) | null = null
export async function acquireLock(slot: number, onLost: () => void, steal = false): Promise<boolean> {
  releaseSaveLock()
  // 无 Web Locks 就无法保证只有一个标签页写入：只读（设计 25.4；需要时再补 IndexedDB 租约 + fencing token）
  if (!navigator.locks) return false
  for (let i = 0; i < 4; i++) {
    const got = await new Promise<boolean>((res) => {
      let held = false
      navigator.locks
        .request(key(slot), steal ? { steal: true } : { ifAvailable: true }, (lock) => {
          res((held = !!lock))
          if (lock) return new Promise<void>((r) => (releaseLock = r))
        })
        .catch(() => {
          res(false) // 请求本身失败时也要结束等待
          if (held) { releaseLock = null; onLost() } // 持有期间被接管
        })
    })
    if (got) return true
    await new Promise((r) => setTimeout(r, 300)) // 刷新页面时旧页的锁可能稍后才释放
  }
  return false
}
export function releaseSaveLock() {
  releaseLock?.()
  releaseLock = null
}
