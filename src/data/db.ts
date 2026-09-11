import Dexie, { type EntityTable, type Table } from 'dexie'
import type { Budget, Category, Entry } from './types'

// IndexedDB を触るのはこの db.ts と同じ src/data/ 配下のリポジトリだけ。
// 画面（src/pages/）からは直接 import しないこと。

export type KakeiboDB = Dexie & {
  entries: EntityTable<Entry, 'id'>
  categories: EntityTable<Category, 'id'>
  // 予算は「カテゴリ × 年月」で 1 件なので複合主キーにする
  budgets: Table<Budget, [string, string]>
}

export const db = new Dexie('kakeibo') as KakeiboDB

// stores() に書くのは「主キーと検索に使う索引」だけ。全項目を列挙する必要はない。
db.version(1).stores({
  entries: 'id, date, categoryId',
  categories: 'id, type, sortOrder',
  budgets: '[categoryId+yearMonth], yearMonth',
})
