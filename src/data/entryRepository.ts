import { db } from './db'
import type { Entry } from './types'

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export type EntryInput = Pick<Entry, 'date' | 'type' | 'amount' | 'categoryId' | 'memo'>

/** 保存前の最低限の検証。画面側でも検証するが、DB に不正な値を入れない最後の砦 */
function validateEntryInput(input: EntryInput): void {
  if (!DATE_PATTERN.test(input.date)) throw new Error('日付は YYYY-MM-DD 形式で指定してください')
  if (!Number.isInteger(input.amount) || input.amount <= 0) {
    throw new Error('金額は 1 円以上の整数で入力してください')
  }
  if (input.categoryId === '') throw new Error('カテゴリを選択してください')
}

export async function addEntry(input: EntryInput): Promise<Entry> {
  validateEntryInput(input)
  const now = new Date().toISOString()
  const entry: Entry = {
    id: crypto.randomUUID(),
    date: input.date,
    type: input.type,
    amount: input.amount,
    categoryId: input.categoryId,
    memo: input.memo,
    createdAt: now,
    updatedAt: now,
  }
  await db.entries.add(entry)
  return entry
}

export async function updateEntry(id: string, input: EntryInput): Promise<void> {
  validateEntryInput(input)
  const updated = await db.entries.update(id, {
    ...input,
    updatedAt: new Date().toISOString(),
  })
  if (updated === 0) throw new Error('記録が見つかりません')
}

export async function deleteEntry(id: string): Promise<void> {
  await db.entries.delete(id)
}

export async function getEntry(id: string): Promise<Entry | undefined> {
  return db.entries.get(id)
}

/** 指定月（YYYY-MM）の記録を日付順で返す */
export async function listEntriesByMonth(yearMonth: string): Promise<Entry[]> {
  return db.entries.where('date').startsWith(`${yearMonth}-`).sortBy('date')
}

/** 指定日（YYYY-MM-DD）の記録を作成順で返す */
export async function listEntriesByDate(date: string): Promise<Entry[]> {
  return db.entries.where('date').equals(date).sortBy('createdAt')
}
