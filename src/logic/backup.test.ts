import { describe, expect, it } from 'vitest'
import type { ExportData } from '../data/types'
import { exportFileName, parseExportData } from './backup'

function valid(): ExportData {
  return {
    version: 1,
    exportedAt: '2026-09-11T10:00:00.000Z',
    categories: [
      { id: 'c-food', name: '食費', type: 'expense', sortOrder: 0, isActive: true },
      { id: 'c-salary', name: '給与', type: 'income', sortOrder: 1, isActive: false },
    ],
    budgets: [{ categoryId: 'c-food', yearMonth: '2026-09', amount: 30000 }],
    entries: [
      {
        id: 'e1',
        date: '2026-09-11',
        type: 'expense',
        amount: 1200,
        categoryId: 'c-food',
        memo: '洗剤',
        createdAt: '2026-09-11T01:00:00.000Z',
        updatedAt: '2026-09-11T01:00:00.000Z',
      },
    ],
  }
}

function withPatch(patch: (d: any) => void): string {
  const d: any = valid()
  patch(d)
  return JSON.stringify(d)
}

describe('parseExportData', () => {
  it('正しい JSON をそのまま返す', () => {
    const result = parseExportData(JSON.stringify(valid()))
    expect(result).toEqual({ ok: true, data: valid() })
  })

  it('余分なプロパティは捨てる', () => {
    const result = parseExportData(
      withPatch((d) => {
        d.extra = 'x'
        d.entries[0].paymentMethod = 'card'
        d.categories[0].color = '#fff'
      }),
    )
    expect(result).toEqual({ ok: true, data: valid() })
  })

  it('空のデータも受け付ける', () => {
    const result = parseExportData(
      JSON.stringify({ version: 1, exportedAt: 'x', categories: [], budgets: [], entries: [] }),
    )
    expect(result.ok).toBe(true)
  })

  it('JSON でない文字列はエラー', () => {
    expect(parseExportData('{not json')).toEqual({ ok: false, error: 'JSON として読み取れません' })
  })

  it('オブジェクトでなければエラー', () => {
    expect(parseExportData('[]').ok).toBe(false)
    expect(parseExportData('null').ok).toBe(false)
  })

  it('version が 1 以外はエラー', () => {
    const result = parseExportData(withPatch((d) => (d.version = 2)))
    expect(result).toEqual({ ok: false, error: '対応していないバージョンです（version: 2）' })
  })

  it('配列が欠けていればエラー', () => {
    expect(parseExportData(withPatch((d) => delete d.entries)).ok).toBe(false)
    expect(parseExportData(withPatch((d) => (d.budgets = {}))).ok).toBe(false)
  })

  it('記録の項目が不正ならどの件かを示してエラー', () => {
    expect(parseExportData(withPatch((d) => (d.entries[0].date = '2026/09/11')))).toEqual({
      ok: false,
      error: '記録 1 件目: date が不正です',
    })
    expect(parseExportData(withPatch((d) => (d.entries[0].amount = 0))).ok).toBe(false)
    expect(parseExportData(withPatch((d) => (d.entries[0].amount = 1.5))).ok).toBe(false)
    expect(parseExportData(withPatch((d) => (d.entries[0].amount = '1200'))).ok).toBe(false)
    expect(parseExportData(withPatch((d) => (d.entries[0].type = 'transfer'))).ok).toBe(false)
    expect(parseExportData(withPatch((d) => delete d.entries[0].memo)).ok).toBe(false)
  })

  it('カテゴリの項目が不正ならエラー', () => {
    expect(parseExportData(withPatch((d) => (d.categories[0].name = '')))).toEqual({
      ok: false,
      error: 'カテゴリ 1 件目: name がありません',
    })
    expect(parseExportData(withPatch((d) => (d.categories[1].isActive = 'no'))).ok).toBe(false)
    expect(parseExportData(withPatch((d) => (d.categories[1].sortOrder = '1'))).ok).toBe(false)
  })

  it('予算の項目が不正ならエラー', () => {
    expect(parseExportData(withPatch((d) => (d.budgets[0].yearMonth = '2026-9'))).ok).toBe(false)
    expect(parseExportData(withPatch((d) => (d.budgets[0].amount = -1))).ok).toBe(false)
    // 予算は 0 円を許す
    expect(parseExportData(withPatch((d) => (d.budgets[0].amount = 0))).ok).toBe(true)
  })

  it('id の重複はエラー', () => {
    expect(parseExportData(withPatch((d) => d.categories.push({ ...d.categories[0] })))).toEqual({
      ok: false,
      error: 'カテゴリ id が重複しています: c-food',
    })
    expect(parseExportData(withPatch((d) => d.entries.push({ ...d.entries[0] }))).ok).toBe(false)
    expect(parseExportData(withPatch((d) => d.budgets.push({ ...d.budgets[0] }))).ok).toBe(false)
  })

  it('存在しないカテゴリを指す記録・予算はエラー', () => {
    expect(parseExportData(withPatch((d) => (d.entries[0].categoryId = 'nope')))).toEqual({
      ok: false,
      error: '記録 e1 が存在しないカテゴリを指しています',
    })
    expect(parseExportData(withPatch((d) => (d.budgets[0].categoryId = 'nope'))).ok).toBe(false)
  })
})

describe('exportFileName', () => {
  it('日付入りのファイル名を返す', () => {
    expect(exportFileName('2026-09-11')).toBe('kakeibo-2026-09-11.json')
  })
})
