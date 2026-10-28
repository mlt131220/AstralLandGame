// 剧情内容装载：任务、居民、新物品（quests.json / npcs.json / items_new.json，见《任务与剧情链路设计 v1.0》）。
// 静态 JSON 导入：浏览器构建与 Node 自检共用同一份数据。
import questsJson from './quests.json' with { type: 'json' }
import npcsJson from './npcs.json' with { type: 'json' }
import { localize } from '../core/i18n.ts'
import type { QuestDef } from '../core/quests.ts'
import { ITEMS } from './content.ts'

const questsFile = localize(questsJson, 'quests')
const npcsFile = localize(npcsJson, 'npcs')

export interface NpcLine { speaker?: string; text: string }
export interface SchedEntry { from: number; to: number; region: string; spot: string }
export interface NpcDef {
  id: string; name: string; role?: string; birthday?: { season: number; day: number }
  gifts?: Record<'love' | 'like' | 'dislike' | 'hate', string[]>
  schedule?: { workday: SchedEntry[]; restday: SchedEntry[]; rain?: SchedEntry[] }
  dialogue?: {
    firstMeet?: string; seasons?: Record<string, string[]>; rain?: string[]; friendship?: Record<string, string[]>
    gift?: Record<string, string>; birthday?: string
  }
  home?: { region: string; spot: string }
  event200?: NpcEvent
  event400?: NpcEvent
  event600?: NpcEvent
  event800?: NpcEvent // 18.5 关系延伸：明确关系
  event1000?: NpcEvent // 18.5 关系延伸：共同生活承诺
}
export interface NpcEvent {
  id: string; trigger: { region: string; from: number; to: number; weather: string }; steps: NpcLine[]
  choice?: { text: string; reply: string; friendship: number }[]
  reward?: { items?: { id: string; n: number }[]; recipe?: string }
}
// 18.4 友情事件阈值与 18.5 关系延伸节点
export const EVENT_TIERS = [200, 400, 600, 800, 1000] as const
export const npcEvent = (npc: string, tier: number) => (NPC_DEFS[npc] as unknown as Record<string, NpcEvent | undefined>)?.['event' + tier]
// 18.1 可发展恋爱关系的居民（任何性别组合，不锁生产配方）
export const ROMANCE = new Set(['lintang', 'heyan', 'shenzhou', 'yelan', 'luyao', 'xiahe'])

export const QUEST_DEFS = questsFile.quests as QuestDef[]
export const NPC_DEFS: Record<string, NpcDef> = Object.fromEntries((npcsFile.npcs as unknown as NpcDef[]).map((n) => [n.id, n]))
const SEASON_KEYS = ['spring', 'summer', 'autumn', 'winter']
export const seasonLines = (d: NpcDef['dialogue'], se: number) => d?.seasons?.[SEASON_KEYS[se]]

// 18.3 居民的每周休息日（weekday 0=周一）：林棠、沈舟周三，老陶周日，夏禾周一；何砚周二，周芹周一（13.4），其余各自安排
export const REST_DAY: Record<string, number> = { lintang: 2, shenzhou: 2, laotao: 6, xiahe: 0, heyan: 1, zhouqin: 0, yelan: -1, luyao: 5, aman: 3, duanxing: 4, anbo: 6 }
// 居民外观（角色模型序号，见 render/models.ts LOOKS）
export const NPC_LOOK: Record<string, number> = { lintang: 7, laotao: 1, xiahe: 10, shenzhou: 2, heyan: 3, zhouqin: 8, yelan: 9, luyao: 4, aman: 11, duanxing: 5, anbo: 14,
  linyou: 12, shipo: 13, bailu: 15, wenheng: 16, songning: 17 } // 12 起为新居民专用外观（render/models NPC_ONLY_LOOKS）

// 奖励里已有扩容道具时去掉同效果的直接解锁：扩容由玩家使用道具触发
for (const q of QUEST_DEFS) {
  const effects = new Set((q.rewards.items ?? []).map((it) => ITEMS[it.id]?.effect))
  if (q.rewards.unlock) q.rewards.unlock = q.rewards.unlock.filter((u) => !effects.has(u))
}
