// 界面文本扫描：源码里显示给玩家的文本都写成 t('区域.名字', …参数)，中文与英文分别在 src/content/i18n/zh.json、en.json。
//   node scripts/i18n-scan.mjs [文件或目录…]        报告（默认扫描 src，跳过测试）
//   node scripts/i18n-scan.mjs --missing out.json   把 zh.json 有、en.json 还没有的键写成 { 键: 中文 } 待译
// 规则：源码里不再有中文字面量（故意保留的数据值在同一行写 i18n-ignore 注释；console.* 不算）；
// 键只用英文与点号；动态拼的键（`animals.name.${种类}.${序号}`）按模板开头的前缀算“用到”。
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import ts from 'typescript'
import { parse as parseSfc } from 'vue/compiler-sfc'

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/(\w:)/, '$1')
export const CJK = /[　-〿㐀-鿿＀-￯]/
const SKIP = /\.test\.ts$/
export const KEY = /^[a-z][A-Za-z0-9]*(\.[A-Za-z0-9]+)+$/

const walk = (p) => (statSync(p).isDirectory() ? readdirSync(p).flatMap((f) => walk(join(p, f))) : [p])
export const sourceFiles = (paths = [join(ROOT, 'src')]) => paths.flatMap(walk).filter((f) => /\.(ts|vue)$/.test(f) && !SKIP.test(f))
// 文件里绑定到 core/i18n 的函数名（t、t as tr、zhText）
const bindings = (src) => {
  const m = src.match(/import \{([^}]*)\} from '[./]*(?:core\/)?i18n\.ts'/)
  if (!m) return new Set()
  return new Set(m[1].split(',').map((x) => x.trim()).filter((x) => /^(t|zhText)\b/.test(x)).map((x) => x.split(/\s+as\s+/).pop()))
}
const textOf = (n) => (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) ? n.text : ts.isTemplateExpression(n) ? n.head.text + n.templateSpans.map((s) => '${}' + s.literal.text).join('') : null)
const inConsole = (n) => {
  for (let p = n.parent; p; p = p.parent) if (ts.isCallExpression(p) && /^console\./.test(p.expression.getText())) return true
  return false
}

function scanTs(code, line0, lines, names, out) {
  const sf = ts.createSourceFile('x.ts', code, ts.ScriptTarget.Latest, true)
  const visit = (n) => {
    const text = textOf(n)
    if (text !== null) {
      const line = line0 + sf.getLineAndCharacterOfPosition(n.getStart(sf)).line
      const p = n.parent
      if (CJK.test(text) && !(ts.isImportDeclaration(p) || ts.isLiteralTypeNode(p) || (ts.isPropertyAssignment(p) && p.name === n) || inConsole(n) || /i18n-ignore/.test(lines[line - 1] ?? '')))
        out.bare.push({ text, line })
      const isKeyArg = ts.isCallExpression(p) && ts.isIdentifier(p.expression) && names.has(p.expression.text) && p.arguments[0] === n
      if (isKeyArg && !ts.isTemplateExpression(n)) out.keys.push({ key: text, line })
      else if (ts.isTemplateExpression(n) && /^[a-z][\w.]*\.$/.test(n.head.text)) out.prefixes.push(n.head.text) // 动态键的前缀
    }
    ts.forEachChild(n, visit)
  }
  visit(sf)
}

export function scanFile(file) {
  const src = readFileSync(file, 'utf8')
  const lines = src.split('\n')
  const names = bindings(src)
  const out = { file: relative(ROOT, file).replace(/\\/g, '/'), keys: [], prefixes: [], bare: [] }
  if (file.endsWith('.ts')) { scanTs(src, 1, lines, names, out); return out }
  const { descriptor: d } = parseSfc(src)
  for (const b of [d.script, d.scriptSetup]) if (b) scanTs(b.content, b.loc.start.line, lines, names, out)
  const expr = (code, line) => scanTs('(' + code + '\n)', line, lines, names, out)
  const visit = (n) => {
    if (n.type === 2 && CJK.test(n.content) && !/i18n-ignore/.test(lines[n.loc.start.line - 1])) out.bare.push({ text: n.content.trim(), line: n.loc.start.line }) // 文本
    if (n.type === 5) expr(n.content.content, n.content.loc.start.line) // {{ }}
    for (const p of n.props ?? []) {
      if (p.type === 6 && p.value && CJK.test(p.value.content) && !/i18n-ignore/.test(lines[p.loc.start.line - 1])) out.bare.push({ text: `${p.name}="${p.value.content}"`, line: p.loc.start.line })
      if (p.type === 7 && p.exp) expr(p.exp.content, p.exp.loc.start.line)
    }
    for (const c of n.children ?? []) visit(c)
    for (const b of n.branches ?? []) visit(b)
  }
  if (d.template?.ast) visit(d.template.ast)
  return out
}

export const loadDicts = () => ['zh', 'en'].map((l) => JSON.parse(readFileSync(join(ROOT, `src/content/i18n/${l}.json`), 'utf8')))
const holes = (s) => [...new Set((s.match(/\{\d+(?:\|[^}]*)?\}/g) ?? []).map((h) => h.match(/\d+/)[0]))].sort().join()

// 全量检查：返回各类问题清单（i18n.test.ts 与命令行共用）
export function audit(files = sourceFiles()) {
  const [zh, en] = loadDicts()
  const bare = [], missing = new Set(), used = new Set(), prefixes = new Set()
  for (const f of files) {
    const r = scanFile(f)
    for (const b of r.bare) bare.push(`${r.file}:${b.line}  ${b.text.slice(0, 60)}`)
    for (const k of r.keys) { used.add(k.key); if (!KEY.test(k.key) || !(k.key in zh) || !(k.key in en)) missing.add(k.key) }
    for (const p of r.prefixes) prefixes.add(p)
  }
  const isUsed = (k) => used.has(k) || [...prefixes].some((p) => k.startsWith(p))
  return {
    bare, missing: [...missing],
    unused: Object.keys(zh).filter((k) => !isUsed(k)),
    onlyZh: Object.keys(zh).filter((k) => !(k in en)), onlyEn: Object.keys(en).filter((k) => !(k in zh)),
    badKeys: Object.keys(zh).filter((k) => !KEY.test(k)),
    holes: Object.keys(zh).filter((k) => k in en && holes(zh[k]) !== holes(en[k])),
    cjkInEn: Object.keys(en).filter((k) => CJK.test(en[k])),
  }
}

if (/i18n-scan\.mjs$/.test(process.argv[1] ?? '')) {
  const args = process.argv.slice(2)
  const mi = args.indexOf('--missing')
  const missingOut = mi >= 0 ? args.splice(mi, 2)[1] : null
  const r = audit(args.length ? sourceFiles(args.map((a) => join(process.cwd(), a))) : undefined)
  for (const b of r.bare) console.log(`中文字面量（改成 t('键')，或写 i18n-ignore）：${b}`)
  for (const [name, list] of Object.entries({ 缺词条: r.missing, 没用到: args.length ? [] : r.unused, 只有中文: r.onlyZh, 只有英文: r.onlyEn, 键名不合规: r.badKeys, 占位符不一致: r.holes, 英文里有中文: r.cjkInEn }))
    if (list.length) console.log(`${name} ${list.length}：${list.slice(0, 30).join(' | ')}`)
  console.log(`${r.bare.length} 处中文字面量，${r.missing.length} 个键缺词条，${args.length ? '-' : r.unused.length} 个键没用到，${r.onlyZh.length + r.onlyEn.length} 个键只在一边`)
  if (missingOut) { const [zh] = loadDicts(); writeFileSync(missingOut, JSON.stringify(Object.fromEntries(r.onlyZh.map((k) => [k, zh[k]])), null, 1)) }
}
