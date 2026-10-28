// 随机：以世界种子+键确定，读档不重抽
export function rand(...keys: number[]): number {
  let h = 0x811c9dc5
  for (const k of keys) {
    h = Math.imul(h ^ (k | 0), 0x01000193)
    h = Math.imul(h ^ (h >>> 15), 0x85ebca6b)
  }
  h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16
  return (h >>> 0) / 4294967296
}
