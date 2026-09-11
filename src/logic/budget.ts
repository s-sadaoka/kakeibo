import type { Budget, Category, Entry } from '../data/types'
import { sumByType, sumExpenseByCategory } from './summary'

// 予算の引き継ぎと、ホーム画面に出す「予算 / 実績 / 残額」を組み立てる純粋関数。

/** 残額が予算の 10% 未満になったら警告（docs/requirements.md 3.1） */
export const WARNING_RATIO = 0.1

/**
 * 指定月の予算を求める。その月に設定がなければ、それより前の直近の設定月の値を引き継ぐ。
 * 一度も設定されていなければ null（画面では「未設定」と表示する）。
 * 未来の月に設定された値は引き継がない。
 */
export function resolveBudget(
  budgets: readonly Budget[],
  categoryId: string,
  yearMonth: string,
): number | null {
  let best: Budget | null = null
  for (const b of budgets) {
    if (b.categoryId !== categoryId) continue
    if (b.yearMonth > yearMonth) continue
    if (best === null || b.yearMonth > best.yearMonth) best = b
  }
  return best ? best.amount : null
}

export type BudgetStatus =
  /** 予算未設定 */
  | 'none'
  /** 残額が十分ある */
  | 'ok'
  /** 残額が予算の 10% 未満 */
  | 'warning'
  /** 残額がマイナス */
  | 'over'

export function budgetStatus(budget: number | null, spent: number): BudgetStatus {
  if (budget === null) return 'none'
  const remaining = budget - spent
  if (remaining < 0) return 'over'
  if (remaining < budget * WARNING_RATIO) return 'warning'
  return 'ok'
}

export interface CategorySummary {
  category: Category
  /** 引き継ぎ後の予算。未設定なら null */
  budget: number | null
  /** 当月の支出合計 */
  spent: number
  /** 予算 − 支出。予算未設定なら null */
  remaining: number | null
  status: BudgetStatus
}

export interface MonthSummary {
  yearMonth: string
  income: number
  expense: number
  /** 予算が設定されている支出カテゴリの予算合計 */
  budgetTotal: number
  /** budgetTotal − expense（未設定カテゴリの支出も差し引く） */
  remainingTotal: number
  /** 支出カテゴリのみ。sortOrder 順 */
  categories: CategorySummary[]
}

/**
 * ホーム画面用の月次サマリーを組み立てる。
 * - entries は当月分だけを渡すこと（月の絞り込みはここでは行わない）
 * - 表示するカテゴリは「表示中の支出カテゴリ」＋「非表示だが当月に支出がある支出カテゴリ」。
 *   非表示カテゴリの過去の支出が合計から消えないようにするため
 * - 収入は income に含めるだけで、予算管理の対象にしない
 */
export function buildMonthSummary(
  yearMonth: string,
  categories: readonly Category[],
  entries: readonly Entry[],
  budgets: readonly Budget[],
): MonthSummary {
  const totals = sumByType(entries)
  const spentByCategory = sumExpenseByCategory(entries)

  const rows: CategorySummary[] = [...categories]
    .filter((c) => c.type === 'expense')
    .filter((c) => c.isActive || spentByCategory.has(c.id))
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((category) => {
      const budget = resolveBudget(budgets, category.id, yearMonth)
      const spent = spentByCategory.get(category.id) ?? 0
      return {
        category,
        budget,
        spent,
        remaining: budget === null ? null : budget - spent,
        status: budgetStatus(budget, spent),
      }
    })

  const budgetTotal = rows.reduce((sum, r) => sum + (r.budget ?? 0), 0)

  return {
    yearMonth,
    income: totals.income,
    expense: totals.expense,
    budgetTotal,
    remainingTotal: budgetTotal - totals.expense,
    categories: rows,
  }
}
