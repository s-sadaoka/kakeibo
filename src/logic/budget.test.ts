import { describe, expect, it } from 'vitest'
import type { Budget, Category, Entry } from '../data/types'
import { budgetStatus, buildMonthSummary, resolveBudget } from './budget'

const food: Category = { id: 'food', name: '食費', type: 'expense', sortOrder: 0, isActive: true }
const daily: Category = { id: 'daily', name: '日用品', type: 'expense', sortOrder: 1, isActive: true }
const hobby: Category = { id: 'hobby', name: '娯楽', type: 'expense', sortOrder: 2, isActive: false }
const salary: Category = { id: 'salary', name: '給与', type: 'income', sortOrder: 3, isActive: true }

function entry(type: Entry['type'], amount: number, categoryId: string, date = '2026-09-10'): Entry {
  return {
    id: crypto.randomUUID(),
    date,
    type,
    amount,
    categoryId,
    memo: '',
    createdAt: '2026-09-10T00:00:00.000Z',
    updatedAt: '2026-09-10T00:00:00.000Z',
  }
}

describe('resolveBudget', () => {
  const budgets: Budget[] = [
    { categoryId: 'food', yearMonth: '2026-06', amount: 30000 },
    { categoryId: 'food', yearMonth: '2026-08', amount: 35000 },
    { categoryId: 'food', yearMonth: '2026-11', amount: 40000 },
    { categoryId: 'daily', yearMonth: '2026-09', amount: 5000 },
  ]

  it('その月に設定があればその値', () => {
    expect(resolveBudget(budgets, 'food', '2026-08')).toBe(35000)
  })

  it('未設定の月は直近の設定済み月の値を引き継ぐ', () => {
    expect(resolveBudget(budgets, 'food', '2026-09')).toBe(35000)
    expect(resolveBudget(budgets, 'food', '2026-07')).toBe(30000)
  })

  it('未来の月の設定は引き継がない', () => {
    expect(resolveBudget(budgets, 'food', '2026-10')).toBe(35000)
  })

  it('一度も設定されていなければ null', () => {
    expect(resolveBudget(budgets, 'food', '2026-05')).toBeNull()
    expect(resolveBudget(budgets, 'unknown', '2026-09')).toBeNull()
  })

  it('別カテゴリの設定は混ざらない', () => {
    expect(resolveBudget(budgets, 'daily', '2026-09')).toBe(5000)
    expect(resolveBudget(budgets, 'daily', '2026-08')).toBeNull()
  })

  it('年をまたいでも文字列比較で正しく引き継ぐ', () => {
    expect(resolveBudget(budgets, 'food', '2027-01')).toBe(40000)
  })
})

describe('budgetStatus', () => {
  it('予算未設定なら none', () => {
    expect(budgetStatus(null, 1000)).toBe('none')
  })

  it('残額が予算の 10% 以上なら ok', () => {
    expect(budgetStatus(10000, 9000)).toBe('ok')
    expect(budgetStatus(10000, 0)).toBe('ok')
  })

  it('残額が予算の 10% 未満なら warning', () => {
    expect(budgetStatus(10000, 9001)).toBe('warning')
    expect(budgetStatus(10000, 10000)).toBe('warning')
  })

  it('残額がマイナスなら over', () => {
    expect(budgetStatus(10000, 10001)).toBe('over')
  })

  it('予算 0 円で支出 0 円なら ok、1 円でも使えば over', () => {
    expect(budgetStatus(0, 0)).toBe('ok')
    expect(budgetStatus(0, 1)).toBe('over')
  })
})

describe('buildMonthSummary', () => {
  const categories = [salary, hobby, daily, food] // わざと sortOrder と違う順で渡す
  const budgets: Budget[] = [
    { categoryId: 'food', yearMonth: '2026-08', amount: 30000 },
    { categoryId: 'daily', yearMonth: '2026-09', amount: 5000 },
  ]

  it('カテゴリ別の予算・実績・残額と全体合計を組み立てる', () => {
    const entries = [
      entry('expense', 12000, 'food'),
      entry('expense', 8000, 'food'),
      entry('expense', 4800, 'daily'),
      entry('income', 300000, 'salary'),
    ]
    const s = buildMonthSummary('2026-09', categories, entries, budgets)

    expect(s.yearMonth).toBe('2026-09')
    expect(s.income).toBe(300000)
    expect(s.expense).toBe(24800)
    expect(s.budgetTotal).toBe(35000)
    expect(s.remainingTotal).toBe(10200)

    expect(s.categories.map((r) => r.category.id)).toEqual(['food', 'daily'])
    expect(s.categories[0]).toMatchObject({
      budget: 30000, // 2026-08 の設定を引き継ぐ
      spent: 20000,
      remaining: 10000,
      status: 'ok',
    })
    expect(s.categories[1]).toMatchObject({
      budget: 5000,
      spent: 4800,
      remaining: 200,
      status: 'warning',
    })
  })

  it('収入カテゴリは一覧に出さず、収入合計にだけ反映する', () => {
    const s = buildMonthSummary('2026-09', categories, [entry('income', 1000, 'salary')], budgets)
    expect(s.income).toBe(1000)
    expect(s.categories.some((r) => r.category.type === 'income')).toBe(false)
  })

  it('非表示カテゴリは支出がなければ出さない', () => {
    const s = buildMonthSummary('2026-09', categories, [], budgets)
    expect(s.categories.map((r) => r.category.id)).toEqual(['food', 'daily'])
  })

  it('非表示カテゴリでも当月に支出があれば出し、合計にも含める', () => {
    const s = buildMonthSummary('2026-09', categories, [entry('expense', 700, 'hobby')], budgets)
    expect(s.categories.map((r) => r.category.id)).toEqual(['food', 'daily', 'hobby'])
    expect(s.categories[2]).toMatchObject({ budget: null, spent: 700, remaining: null, status: 'none' })
    expect(s.expense).toBe(700)
    expect(s.remainingTotal).toBe(35000 - 700)
  })

  it('予算未設定のカテゴリは budget/remaining が null で、予算合計に含めない', () => {
    const s = buildMonthSummary('2026-07', categories, [entry('expense', 100, 'daily', '2026-07-01')], budgets)
    const dailyRow = s.categories.find((r) => r.category.id === 'daily')
    expect(dailyRow).toMatchObject({ budget: null, spent: 100, remaining: null, status: 'none' })
    expect(s.budgetTotal).toBe(0) // food は 2026-08 から、daily は 2026-09 から。2026-07 はどちらも未設定
    expect(s.remainingTotal).toBe(-100)
  })

  it('予算超過は over になる', () => {
    const s = buildMonthSummary('2026-09', categories, [entry('expense', 5001, 'daily')], budgets)
    const dailyRow = s.categories.find((r) => r.category.id === 'daily')
    expect(dailyRow).toMatchObject({ remaining: -1, status: 'over' })
  })

  it('記録も予算もなければ全部 0 で、表示中の支出カテゴリだけ並ぶ', () => {
    const s = buildMonthSummary('2026-09', categories, [], [])
    expect(s).toMatchObject({ income: 0, expense: 0, budgetTotal: 0, remainingTotal: 0 })
    expect(s.categories).toHaveLength(2)
    expect(s.categories.every((r) => r.status === 'none' && r.spent === 0)).toBe(true)
  })
})
