import { describe, expect, it } from 'vitest'
import {
  addMonths,
  datesOfMonth,
  formatDateLabel,
  daysInMonth,
  firstWeekday,
  formatLocalDate,
  formatYearMonthLabel,
  toYearMonth,
} from './date'

describe('formatLocalDate', () => {
  it('ローカル時刻の年月日を YYYY-MM-DD にする（月日は 0 埋め）', () => {
    expect(formatLocalDate(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(formatLocalDate(new Date(2026, 11, 31))).toBe('2026-12-31')
  })

  it('深夜 0 時台でも日付がずれない（UTC 変換しない）', () => {
    expect(formatLocalDate(new Date(2026, 8, 11, 0, 30))).toBe('2026-09-11')
  })
})

describe('toYearMonth', () => {
  it('YYYY-MM-DD の先頭 7 文字を返す', () => {
    expect(toYearMonth('2026-09-11')).toBe('2026-09')
  })
})

describe('addMonths', () => {
  it('同じ年の中で加減算できる', () => {
    expect(addMonths('2026-09', 1)).toBe('2026-10')
    expect(addMonths('2026-09', -1)).toBe('2026-08')
  })

  it('年をまたぐ', () => {
    expect(addMonths('2026-12', 1)).toBe('2027-01')
    expect(addMonths('2026-01', -1)).toBe('2025-12')
  })

  it('複数年分まとめて動かせる', () => {
    expect(addMonths('2026-03', 25)).toBe('2028-04')
    expect(addMonths('2026-03', -27)).toBe('2023-12')
  })

  it('0 なら変わらない', () => {
    expect(addMonths('2026-09', 0)).toBe('2026-09')
  })
})

describe('daysInMonth', () => {
  it('30 日・31 日の月を区別する', () => {
    expect(daysInMonth('2026-09')).toBe(30)
    expect(daysInMonth('2026-10')).toBe(31)
  })

  it('うるう年の 2 月を扱う', () => {
    expect(daysInMonth('2028-02')).toBe(29)
    expect(daysInMonth('2027-02')).toBe(28)
    expect(daysInMonth('2100-02')).toBe(28)
  })
})

describe('firstWeekday', () => {
  it('2026-09-01 は火曜（2）', () => {
    expect(firstWeekday('2026-09')).toBe(2)
  })

  it('2026-11-01 は日曜（0）', () => {
    expect(firstWeekday('2026-11')).toBe(0)
  })
})

describe('datesOfMonth', () => {
  it('1 日から月末までを順に返す', () => {
    const dates = datesOfMonth('2026-02')
    expect(dates).toHaveLength(28)
    expect(dates[0]).toBe('2026-02-01')
    expect(dates[27]).toBe('2026-02-28')
  })
})

describe('formatYearMonthLabel', () => {
  it('「2026年9月」のように月の 0 埋めを外す', () => {
    expect(formatYearMonthLabel('2026-09')).toBe('2026年9月')
    expect(formatYearMonthLabel('2026-12')).toBe('2026年12月')
  })
})

describe('formatDateLabel', () => {
  it('月日と曜日を日本語で返す', () => {
    expect(formatDateLabel('2026-09-11')).toBe('9月11日（金）')
    expect(formatDateLabel('2026-11-01')).toBe('11月1日（日）')
  })
  it('うるう日も正しい曜日になる', () => {
    expect(formatDateLabel('2024-02-29')).toBe('2月29日（木）')
  })
})
