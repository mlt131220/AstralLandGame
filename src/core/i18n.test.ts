// 英文支持自检：中文默认不变；英文包覆盖每个内容 id（物品、作物、衣物、居民、任务…）；源码里每个 t() 键在 zh.json 与 en.json 都有、
// 两边键一致、没有用不到的键、键里没有中文。运行：pnpm test
// 新增内容或界面文本后这里失败，说明还缺词条：JSON 内容补 src/content/i18n/en/<同名>.json，界面文本在 src/content/i18n/zh.json 与 en.json 各加一条
// （node scripts/i18n-scan.mjs 列出问题，--missing 待译.json 导出 en.json 缺的键）。
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { lang, localize, setPack, t, zhText } from './i18n.ts'
import pack from '../content/i18n/en.ts'
import { audit, CJK, loadDicts } from '../../scripts/i18n-scan.mjs'

// 中文默认：按键取中文，参数按顺序代入
assert.equal(lang(), 'zh')
assert.equal(t('common.backpackFull'), '背包已满')
assert.equal(t('common.have', 5), '（持有 5）')

// 内容 JSON：叠加英文后，除内部键（日程地点、住处、美术说明…）外不应再有中文；英文包里的 id 必须在源数据里存在
const SKIP = new Set(['schedule', 'home', 'art', 'seasons', 'designStatus', 'spots', 'trigger', 'gifts', '_'])
const leftovers = (v: unknown, path: string, out: string[]) => {
  if (typeof v === 'string') { if (CJK.test(v)) out.push(`${path} = ${v.slice(0, 30)}`) }
  else if (Array.isArray(v)) v.forEach((x, i) => leftovers(x, `${path}[${i}]`, out))
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) if (!SKIP.has(k)) leftovers(x, `${path}.${(v as { id?: string }).id ?? ''}${k}`, out)
}
setPack(pack)
const src = (f: string) => JSON.parse(readFileSync(new URL(`../content/${f}.json`, import.meta.url), 'utf8'))
const files = { crops: 'crops', items: 'items_new', wear: 'wear', npcs: 'npcs', quests: 'quests' }
for (const [name, f] of Object.entries(files)) {
  const raw = src(f)
  const out: string[] = []
  leftovers(localize(raw, name), f, out)
  assert.deepEqual(out, [], `${f}.json 缺英文（src/content/i18n/en/${f}.json）：\n${out.slice(0, 20).join('\n')}`)
  const list = (Array.isArray(raw) ? raw : (Object.values(raw).find(Array.isArray) as { id: string }[])).map((x: { id: string }) => x.id)
  const en = (pack.json as Record<string, unknown>)[name] as Record<string, unknown>
  const enIds = Object.keys(Array.isArray(raw) ? en : (Object.values(en)[0] as object))
  assert.deepEqual(enIds.filter((id) => !list.includes(id)), [], `src/content/i18n/en/${f}.json 有源数据里不存在的 id`)
}

// 运行时内容表（模块初始化时取译名，须在 setPack 之后载入）：物品、居民、任务与各类名称表都应是英文
const C = await import('../content/content.ts')
const G4 = await import('../content/g4.ts')
const S = await import('../content/story.ts')
const W = await import('./wishes.ts')
const out: string[] = []
for (const [k, v] of Object.entries({ ...C, ...G4, NPC_DEFS: S.NPC_DEFS, QUEST_DEFS: S.QUEST_DEFS, WISHES: W.WISHES })) if (typeof v !== 'function') leftovers(v, k, out)
assert.deepEqual(out, [], `内容表里还有中文：\n${out.slice(0, 20).join('\n')}`)
for (const id of Object.keys(C.ITEMS)) assert.ok(C.ITEMS[id].name && !CJK.test(C.ITEMS[id].name), `物品 ${id} 缺英文名`)

// 源码与词典：没有中文字面量（数据值写 i18n-ignore），用到的键两边都有，两边键一致、没有多余键，键名只用英文，占位符一致
const r = audit()
const show = (l: string[]) => l.slice(0, 20).join('\n')
assert.deepEqual(r.bare, [], `这些中文字面量要改成 t('键')（故意保留的写 i18n-ignore）：
${show(r.bare)}`)
assert.deepEqual(r.missing, [], `这些键在 zh.json / en.json 缺词条：
${show(r.missing)}`)
assert.deepEqual(r.unused, [], `这些键代码里没用到（删掉，或代码里用 t() 引用）：
${show(r.unused)}`)
assert.deepEqual([...r.onlyZh, ...r.onlyEn], [], `zh.json 与 en.json 的键不一致：
${show([...r.onlyZh, ...r.onlyEn])}`)
assert.deepEqual(r.badKeys, [], `键名要用英文与点号（区域.名字）：
${show(r.badKeys)}`)
assert.deepEqual(r.holes, [], `中英文的占位符不一致：
${show(r.holes)}`)
assert.deepEqual(r.cjkInEn, [], `en.json 里还有中文：
${show(r.cjkInEn)}`)
const [zh, en] = loadDicts()
assert.equal(t('common.backpackFull'), en['common.backpackFull'])
assert.equal(zhText('common.backpackFull'), '背包已满') // 存档用的中文原文不随语言变
setPack({ ui: { 'x.days': '{0} {0|day|days}' }, json: {} })
assert.equal(t('x.days', 1), '1 day')
assert.equal(t('x.days', 3), '3 days')

console.log(`i18n：${Object.keys(zh).length} 个界面键（中英各一份），内容 JSON 全覆盖`)
