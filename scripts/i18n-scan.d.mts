// i18n-scan.mjs 的类型（供 src/core/i18n.test.ts 使用）
export const CJK: RegExp
export const KEY: RegExp
export function sourceFiles(paths?: string[]): string[]
export function loadDicts(): [Record<string, string>, Record<string, string>]
export function audit(files?: string[]): { bare: string[]; missing: string[]; unused: string[]; onlyZh: string[]; onlyEn: string[]; badKeys: string[]; holes: string[]; cjkInEn: string[] }
