import type { EntryInput, EntryType } from '../data'

// 入力画面のフォーム値（すべて文字列）を検証し、保存用の EntryInput に変換する純粋関数。

export interface EntryFormValues {
  date: string
  type: EntryType
  /** 入力欄の生テキスト */
  amountText: string
  categoryId: string
  memo: string
}

export type EntryFormErrors = Partial<Record<'date' | 'amount' | 'categoryId', string>>

/**
 * 金額テキストを整数（円）にする。
 * 全角数字とカンマ・空白は許容する。小数・負数・空文字は null。
 */
export function parseAmount(text: string): number | null {
  const normalized = text
    .replace(/[０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .replace(/[,，\s]/g, '')
  if (!/^\d+$/.test(normalized)) return null
  const n = Number(normalized)
  return Number.isSafeInteger(n) ? n : null
}

export function validateEntryForm(
  values: EntryFormValues,
): { ok: true; input: EntryInput } | { ok: false; errors: EntryFormErrors } {
  const errors: EntryFormErrors = {}

  if (!/^\d{4}-\d{2}-\d{2}$/.test(values.date)) errors.date = '日付を入力してください'

  const amount = parseAmount(values.amountText)
  if (amount === null) errors.amount = '金額は半角数字で入力してください'
  else if (amount <= 0) errors.amount = '金額は 1 円以上にしてください'

  if (values.categoryId === '') errors.categoryId = 'カテゴリを選択してください'

  if (Object.keys(errors).length > 0 || amount === null) return { ok: false, errors }

  return {
    ok: true,
    input: {
      date: values.date,
      type: values.type,
      amount,
      categoryId: values.categoryId,
      memo: values.memo.trim(),
    },
  }
}
