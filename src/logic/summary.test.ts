import { describe, expect, it } from 'vitest'
import type { Entry } from '../data/types'
import { sumByType, sumExpenseByCategory, sumExpenseByDate } from './summary'

function entry(partial: Partial<Entry> & Pick<Entry, 'type' | 'amount'>): Entry {
  return {
    id: partial.id ?? crypto.randomUUID(),
    date: partial.date ?? '2026-09-10',
    type: partial.type,
    amount: partial.amount,
    categoryId: partial.categoryId ?? 'food',
    memo: partial.memo ?? '',
    createdAt: '2026-09-10T00:00:00.000Z',
    updatedAt: '2026-09-10T00:00:00.000Z',
  }
}

describe('sumByType', () => {
  it('収入と支出を分けて合計する', () => {
    const entries = [
      entry({ type: 'expense', amount: 1200 }),
      entry({ type: 'expense', amount: 800 }),
      entry({ type: 'income', amount: 300000 }),
      entry({ type: 'income', amount: 5000 }),
    ]
    expect(sumByType(entries)).toEqual({ income: 305000, expense: 2000 })
  })

  it('記録がなければ両方 0', () => {
    expect(sumByType([])).toEqual({ income: 0, expense: 0 })
  })
})

describe('sumExpenseByCategory', () => {
  it('支出だけをカテゴリごとに合計し、収入は無視する', () => {
    const entries = [
      entry({ type: 'expense', amount: 1200, categoryId: 'food' }),
      entry({ type: 'expense', amount: 300, categoryId: 'food' }),
      entry({ type: 'expense', amount: 5000, categoryId: 'daily' }),
      entry({ type: 'income', amount: 300000, categoryId: 'salary' }),
    ]
    const map = sumExpenseByCategory(entries)
    expect(map.get('food')).toBe(1500)
    expect(map.get('daily')).toBe(5000)
    expect(map.has('salary')).toBe(false)
    expect(map.size).toBe(2)
  })
})

describe('sumExpenseByDate', () => {
  it('同じ日の支出をまとめ、収入は含めない', () => {
    const entries = [
      entry({ type: 'expense', amount: 500, date: '2026-09-01' }),
      entry({ type: 'expense', amount: 700, date: '2026-09-01' }),
      entry({ type: 'expense', amount: 100, date: '2026-09-02' }),
      entry({ type: 'income', amount: 9999, date: '2026-09-01' }),
    ]
    const map = sumExpenseByDate(entries)
    expect(map.get('2026-09-01')).toBe(1200)
    expect(map.get('2026-09-02')).toBe(100)
    expect(map.size).toBe(2)
  })
})
