// 画面からデータを扱うときはこのファイルだけを import する

import { seedDefaultCategories } from './categoryRepository'

export type { Budget, Category, Entry, EntryType, ExportData } from './types'
export {
  addCategory,
  listAllCategories,
  renameCategory,
  reorderCategories,
  setCategoryActive,
} from './categoryRepository'
export {
  addEntry,
  deleteEntry,
  getEntry,
  listEntriesByMonth,
  updateEntry,
  type EntryInput,
} from './entryRepository'
export {
  deleteBudget,
  listAllBudgets,
  upsertBudget,
} from './budgetRepository'
export { exportAllData, importAllData } from './backupRepository'

/** アプリ起動時に 1 回呼ぶ。初回起動なら初期カテゴリを投入する */
export async function initializeDatabase(): Promise<void> {
  await seedDefaultCategories()
}
