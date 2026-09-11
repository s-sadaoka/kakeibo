import { db } from './db'
import type { Budget } from './types'

const YEAR_MONTH_PATTERN = /^\d{4}-\d{2}$/

/** 予算を登録 / 更新する（同じカテゴリ × 年月があれば上書き） */
export async function upsertBudget(budget: Budget): Promise<void> {
  if (!YEAR_MONTH_PATTERN.test(budget.yearMonth)) {
    throw new Error('年月は YYYY-MM 形式で指定してください')
  }
  if (!Number.isInteger(budget.amount) || budget.amount < 0) {
    throw new Error('予算は 0 円以上の整数で入力してください')
  }
  await db.budgets.put(budget)
}

export async function deleteBudget(categoryId: string, yearMonth: string): Promise<void> {
  await db.budgets.delete([categoryId, yearMonth])
}

export async function getBudget(
  categoryId: string,
  yearMonth: string,
): Promise<Budget | undefined> {
  return db.budgets.get([categoryId, yearMonth])
}

/** 指定月（YYYY-MM）に明示的に設定された予算だけを返す。前月からの引き継ぎは src/logic/ で行う */
export async function listBudgetsByMonth(yearMonth: string): Promise<Budget[]> {
  return db.budgets.where('yearMonth').equals(yearMonth).toArray()
}

/** 全予算を返す。件数は少ないので、引き継ぎ計算は取得後に純粋関数で行う */
export async function listAllBudgets(): Promise<Budget[]> {
  return db.budgets.toArray()
}
