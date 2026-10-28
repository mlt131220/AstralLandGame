// 英文包：en.json 与 zh.json 同一套键（t() 查表）；en/ 下按内容 JSON 的 id 叠加英文字段（localize()）
import type { LangPack } from '../../core/i18n.ts'
import ui from './en.json' with { type: 'json' }
import crops from './en/crops.json' with { type: 'json' }
import items from './en/items_new.json' with { type: 'json' }
import wear from './en/wear.json' with { type: 'json' }
import npcs from './en/npcs.json' with { type: 'json' }
import quests from './en/quests.json' with { type: 'json' }

export default { ui, json: { crops, items, wear, npcs, quests } } satisfies LangPack
