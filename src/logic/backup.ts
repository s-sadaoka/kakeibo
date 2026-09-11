import type { Budget, Category, Entry, ExportData } from '../data/types'

// JSON インポートの検証（純粋関数）。壊れたファイルや別アプリの JSON を取り込んで
// DB を空にしてしまわないよう、取り込む前に形をすべて確かめる。

export type ParseResult = { ok: true; data: ExportData } | { ok: false; error: string }

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const YEAR_MONTH_PATTERN = /^\d{4}-\d{2}$/

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}
const isString = (v: unknown): v is string => typeof v === 'string'
const isNonEmptyString = (v: unknown): v is string => typeof v === 'string' && v !== ''
const isInteger = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v)
const isType = (v: unknown): v is 'income' | 'expense' => v === 'income' || v === 'expense'

function toCategory(v: unknown, i: number): Category {
  if (!isRecord(v)) throw new Error(`カテゴリ ${i + 1} 件目の形式が不正です`)
  if (!isNonEmptyString(v.id)) throw new Error(`カテゴリ ${i + 1} 件目: id がありません`)
  if (!isNonEmptyString(v.name)) throw new Error(`カテゴリ ${i + 1} 件目: name がありません`)
  if (!isType(v.type)) throw new Error(`カテゴリ ${i + 1} 件目: type が不正です`)
  if (!isInteger(v.sortOrder)) throw new Error(`カテゴリ ${i + 1} 件目: sortOrder が不正です`)
  if (typeof v.isActive !== 'boolean') throw new Error(`カテゴリ ${i + 1} 件目: isActive が不正です`)
  return { id: v.id, name: v.name, type: v.type, sortOrder: v.sortOrder, isActive: v.isActive }
}

function toBudget(v: unknown, i: number): Budget {
  if (!isRecord(v)) throw new Error(`予算 ${i + 1} 件目の形式が不正です`)
  if (!isNonEmptyString(v.categoryId)) throw new Error(`予算 ${i + 1} 件目: categoryId がありません`)
  if (!isString(v.yearMonth) || !YEAR_MONTH_PATTERN.test(v.yearMonth)) {
    throw new Error(`予算 ${i + 1} 件目: yearMonth が不正です`)
  }
  if (!isInteger(v.amount) || v.amount < 0) throw new Error(`予算 ${i + 1} 件目: amount が不正です`)
  return { categoryId: v.categoryId, yearMonth: v.yearMonth, amount: v.amount }
}

function toEntry(v: unknown, i: number): Entry {
  if (!isRecord(v)) throw new Error(`記録 ${i + 1} 件目の形式が不正です`)
  if (!isNonEmptyString(v.id)) throw new Error(`記録 ${i + 1} 件目: id がありません`)
  if (!isString(v.date) || !DATE_PATTERN.test(v.date)) throw new Error(`記録 ${i + 1} 件目: date が不正です`)
  if (!isType(v.type)) throw new Error(`記録 ${i + 1} 件目: type が不正です`)
  if (!isInteger(v.amount) || v.amount <= 0) throw new Error(`記録 ${i + 1} 件目: amount が不正です`)
  if (!isNonEmptyString(v.categoryId)) throw new Error(`記録 ${i + 1} 件目: categoryId がありません`)
  if (!isString(v.memo)) throw new Error(`記録 ${i + 1} 件目: memo が不正です`)
  if (!isString(v.createdAt) || !isString(v.updatedAt)) {
    throw new Error(`記録 ${i + 1} 件目: createdAt / updatedAt が不正です`)
  }
  return {
    id: v.id,
    date: v.date,
    type: v.type,
    amount: v.amount,
    categoryId: v.categoryId,
    memo: v.memo,
    createdAt: v.createdAt,
    updatedAt: v.updatedAt,
  }
}

/**
 * エクスポート JSON の文字列を検証して ExportData にする。
 * - version が 1 でない、必須項目がない、型が違う、日付形式が違う → エラー
 * - id の重複、記録や予算が存在しないカテゴリを指している → エラー
 * 余分なプロパティは捨てる（将来の項目追加に備えて）。
 */
export function parseExportData(text: string): ParseResult {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, error: 'JSON として読み取れません' }
  }
  if (!isRecord(raw)) return { ok: false, error: 'JSON の形式が不正です' }
  if (raw.version !== 1) return { ok: false, error: `対応していないバージョンです（version: ${String(raw.version)}）` }
  if (!isString(raw.exportedAt)) return { ok: false, error: 'exportedAt がありません' }
  if (!Array.isArray(raw.categories) || !Array.isArray(raw.budgets) || !Array.isArray(raw.entries)) {
    return { ok: false, error: 'categories / budgets / entries がありません' }
  }

  try {
    const categories = raw.categories.map(toCategory)
    const budgets = raw.budgets.map(toBudget)
    const entries = raw.entries.map(toEntry)

    const categoryIds = new Set<string>()
    for (const c of categories) {
      if (categoryIds.has(c.id)) throw new Error(`カテゴリ id が重複しています: ${c.id}`)
      categoryIds.add(c.id)
    }
    const entryIds = new Set<string>()
    for (const e of entries) {
      if (entryIds.has(e.id)) throw new Error(`記録 id が重複しています: ${e.id}`)
      entryIds.add(e.id)
      if (!categoryIds.has(e.categoryId)) throw new Error(`記録 ${e.id} が存在しないカテゴリを指しています`)
    }
    const budgetKeys = new Set<string>()
    for (const b of budgets) {
      const key = `${b.categoryId}/${b.yearMonth}`
      if (budgetKeys.has(key)) throw new Error(`予算が重複しています: ${key}`)
      budgetKeys.add(key)
      if (!categoryIds.has(b.categoryId)) throw new Error(`予算 ${key} が存在しないカテゴリを指しています`)
    }

    return { ok: true, data: { version: 1, exportedAt: raw.exportedAt, categories, budgets, entries } }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

/** エクスポートファイル名。例: kakeibo-2026-09-11.json */
export function exportFileName(date: string): string {
  return `kakeibo-${date}.json`
}
