import { db } from './db'
import type { ExportData } from './types'

// JSON エクスポート / インポート（docs/requirements.md 3.4, 4.4）

/** 全データを取り出す。カテゴリは並び順、記録は日付順 */
export async function exportAllData(): Promise<ExportData> {
  const [categories, budgets, entries] = await Promise.all([
    db.categories.orderBy('sortOrder').toArray(),
    db.budgets.toArray(),
    db.entries.orderBy('date').toArray(),
  ])
  return { version: 1, exportedAt: new Date().toISOString(), categories, budgets, entries }
}

/**
 * 既存データをすべて消してから、渡されたデータに置き換える。
 * 1 つのトランザクションで行うので、途中で失敗しても中途半端な状態にはならない。
 * 内容の検証は呼び出し側（src/logic/backup.ts の parseExportData）で済ませておくこと。
 */
export async function importAllData(data: ExportData): Promise<void> {
  await db.transaction('rw', db.categories, db.budgets, db.entries, async () => {
    await Promise.all([db.categories.clear(), db.budgets.clear(), db.entries.clear()])
    await Promise.all([
      db.categories.bulkAdd(data.categories),
      db.budgets.bulkAdd(data.budgets),
      db.entries.bulkAdd(data.entries),
    ])
  })
}
