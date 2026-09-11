import { describe, expect, it } from 'vitest'
import { parseAmount, validateEntryForm, type EntryFormValues } from './entryForm'

describe('parseAmount', () => {
  it('半角数字をそのまま整数にする', () => {
    expect(parseAmount('1200')).toBe(1200)
    expect(parseAmount('0')).toBe(0)
  })

  it('全角数字・カンマ・空白を許容する', () => {
    expect(parseAmount('１２００')).toBe(1200)
    expect(parseAmount('1,200')).toBe(1200)
    expect(parseAmount('１，２００')).toBe(1200)
    expect(parseAmount(' 1 200 ')).toBe(1200)
  })

  it('小数・負数・空文字・文字混じりは null', () => {
    expect(parseAmount('12.5')).toBeNull()
    expect(parseAmount('-100')).toBeNull()
    expect(parseAmount('')).toBeNull()
    expect(parseAmount('abc')).toBeNull()
    expect(parseAmount('100円')).toBeNull()
  })
})

describe('validateEntryForm', () => {
  const valid: EntryFormValues = {
    date: '2026-09-11',
    type: 'expense',
    amountText: '1,200',
    categoryId: 'food',
    memo: '  昼食  ',
  }

  it('正しい入力は EntryInput に変換され、メモの前後空白は削られる', () => {
    expect(validateEntryForm(valid)).toEqual({
      ok: true,
      input: { date: '2026-09-11', type: 'expense', amount: 1200, categoryId: 'food', memo: '昼食' },
    })
  })

  it('日付が空ならエラー', () => {
    const r = validateEntryForm({ ...valid, date: '' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors.date).toBe('日付を入力してください')
  })

  it('金額が数字でなければエラー', () => {
    const r = validateEntryForm({ ...valid, amountText: 'abc' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors.amount).toBe('金額は半角数字で入力してください')
  })

  it('金額 0 はエラー（0 以下は登録不可）', () => {
    const r = validateEntryForm({ ...valid, amountText: '0' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors.amount).toBe('金額は 1 円以上にしてください')
  })

  it('カテゴリ未選択はエラー', () => {
    const r = validateEntryForm({ ...valid, categoryId: '' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors.categoryId).toBe('カテゴリを選択してください')
  })

  it('複数の誤りを同時に返す', () => {
    const r = validateEntryForm({ ...valid, date: '', amountText: '', categoryId: '' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(['amount', 'categoryId', 'date'])
  })
})
