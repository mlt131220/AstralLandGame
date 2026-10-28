// 界面语言：界面与领域文本按键取词（`t('bag.full')`），中文 `src/content/i18n/zh.json` 是默认词典，
// 英文 `src/content/i18n/en.json` 在启动时按设置载入（main.ts 先载入语言包，再载入游戏模块，内容表初始化时就取到译名）。
// {0} {1} 按顺序代入参数；英文条目可写 {0|day|days}：参数为 1 时取前一个词。缺条目时退回中文，再退回键本身。
// localize(json, 名)：内容 JSON 按 id 叠加英文字段（数组里带 id 的对象按 id 对齐，其余数组按下标）。
import zhDict from '../content/i18n/zh.json' with { type: 'json' }

export interface LangPack { ui: Record<string, string>; json: Record<string, unknown> }
const ZH: Record<string, string> = zhDict

let pack: LangPack | null = null
export const setPack = (p: LangPack | null) => { pack = p }
export const lang = (): 'zh' | 'en' => (pack ? 'en' : 'zh')

export function t(key: string, ...v: unknown[]): string {
  const out = pack?.ui[key] ?? ZH[key] ?? key
  return v.length ? out.replace(/\{(\d+)(?:\|([^|}]*)\|([^}]*))?\}/g, (m, i, one, many) => (+i >= v.length ? m : one === undefined ? String(v[+i]) : Number(v[+i]) === 1 ? one : many)) : out
}
// 不随界面语言变的中文原文：存进存档的值（例如动物名）用它，显示时再换成当前语言
export const zhText = (key: string): string => ZH[key] ?? key

const merge = (src: unknown, en: unknown): unknown => {
  if (en === undefined || en === null) return src
  if (typeof src === 'string') return typeof en === 'string' ? en : src
  if (Array.isArray(src)) {
    if (Array.isArray(en)) return src.map((x, i) => merge(x, en[i]))
    const byId = en as Record<string, unknown>
    return src.map((x) => (x && typeof x === 'object' && 'id' in x ? merge(x, byId[(x as { id: string }).id]) : x))
  }
  if (src && typeof src === 'object') {
    const o = { ...(src as Record<string, unknown>) }
    for (const k of Object.keys(o)) o[k] = merge(o[k], (en as Record<string, unknown>)[k])
    return o
  }
  return src
}
export const localize = <T>(src: T, name: string): T => (pack?.json[name] ? (merge(src, pack.json[name]) as T) : src)
