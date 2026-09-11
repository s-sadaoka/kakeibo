import type { Entry } from '../data/types'

// 記録の配列から合計を出す純粋関数。DB には触らない。
// 「どの月の記録か」は呼び出し側が listEntriesByMonth() などで絞ってから渡す。

export interface TypeTotals {
  income: number
  expense: number
}

/** 収入合計と支出合計 */
export function sumByType(entries: readonly Entry[]): TypeTotals {
  const totals: TypeTotals = { income: 0, expense: 0 }
  for (const e of entries) totals[e.type] += e.amount
  return totals
}

/** 支出のカテゴリ別合計。収入は含めない。支出のないカテゴリはキー自体が無い */
export function sumExpenseByCategory(entries: readonly Entry[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const e of entries) {
    if (e.type !== 'expense') continue
    map.set(e.categoryId, (map.get(e.categoryId) ?? 0) + e.amount)
  }
  return map
}

/** 支出の日別合計（カレンダー用）。収入は含めない */
export function sumExpenseByDate(entries: readonly Entry[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const e of entries) {
    if (e.type !== 'expense') continue
    map.set(e.date, (map.get(e.date) ?? 0) + e.amount)
  }
  return map
}
