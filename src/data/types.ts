// docs/requirements.md 4. データ に対応する型定義

export type EntryType = 'income' | 'expense'

/** 記録（1 件の収入 or 支出） */
export interface Entry {
  id: string
  /** YYYY-MM-DD */
  date: string
  type: EntryType
  /** 整数（円） */
  amount: number
  categoryId: string
  /** 空文字可 */
  memo: string
  /** ISO 8601 */
  createdAt: string
  /** ISO 8601 */
  updatedAt: string
}

/** カテゴリ。削除はせず isActive=false で非表示にする */
export interface Category {
  id: string
  name: string
  type: EntryType
  sortOrder: number
  isActive: boolean
}

/** カテゴリ別の月予算（支出カテゴリのみ） */
export interface Budget {
  categoryId: string
  /** YYYY-MM */
  yearMonth: string
  /** 整数（円） */
  amount: number
}

/** JSON エクスポート / インポートの形式 */
export interface ExportData {
  version: 1
  /** ISO 8601 */
  exportedAt: string
  categories: Category[]
  budgets: Budget[]
  entries: Entry[]
}
