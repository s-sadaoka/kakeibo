import { describe, expect, it } from 'vitest'
import { formatYen } from './format'

describe('formatYen', () => {
  it('3 桁区切りにする', () => {
    expect(formatYen(0)).toBe('0')
    expect(formatYen(999)).toBe('999')
    expect(formatYen(1200)).toBe('1,200')
    expect(formatYen(1234567)).toBe('1,234,567')
  })

  it('マイナスは先頭に - を付ける', () => {
    expect(formatYen(-1200)).toBe('-1,200')
  })
})
