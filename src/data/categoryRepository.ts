import { db } from './db'
import type { Category, EntryType } from './types'

/** docs/requirements.md 6. 初期カテゴリ */
const DEFAULT_CATEGORIES: ReadonlyArray<{ name: string; type: EntryType }> = [
  { name: '食費', type: 'expense' },
  { name: '日用品', type: 'expense' },
  { name: '交通費', type: 'expense' },
  { name: '住居費', type: 'expense' },
  { name: '水道光熱費', type: 'expense' },
  { name: '通信費', type: 'expense' },
  { name: '医療', type: 'expense' },
  { name: '娯楽', type: 'expense' },
  { name: '交際費', type: 'expense' },
  { name: 'その他', type: 'expense' },
  { name: '給与', type: 'income' },
  { name: 'その他収入', type: 'income' },
]

/**
 * 初回起動時に初期カテゴリを投入する。
 * 2 回目以降（すでに 1 件でもある場合）は何もしない。
 * トランザクション内で件数を確認するので、同時に 2 回呼ばれても二重投入しない。
 */
export async function seedDefaultCategories(): Promise<void> {
  await db.transaction('rw', db.categories, async () => {
    if ((await db.categories.count()) > 0) return
    const categories: Category[] = DEFAULT_CATEGORIES.map((c, index) => ({
      id: crypto.randomUUID(),
      name: c.name,
      type: c.type,
      sortOrder: index,
      isActive: true,
    }))
    await db.categories.bulkAdd(categories)
  })
}

/** 全カテゴリ（非表示含む）を sortOrder 順で返す */
export async function listAllCategories(): Promise<Category[]> {
  return db.categories.orderBy('sortOrder').toArray()
}

/** 表示中のカテゴリを sortOrder 順で返す。type を渡すと絞り込む */
export async function listActiveCategories(type?: EntryType): Promise<Category[]> {
  const all = await listAllCategories()
  return all.filter((c) => c.isActive && (type === undefined || c.type === type))
}

export async function getCategory(id: string): Promise<Category | undefined> {
  return db.categories.get(id)
}

/** カテゴリを追加する。並び順は全体の末尾 */
export async function addCategory(name: string, type: EntryType): Promise<Category> {
  const trimmed = name.trim()
  if (trimmed === '') throw new Error('カテゴリ名を入力してください')
  const last = await db.categories.orderBy('sortOrder').last()
  const category: Category = {
    id: crypto.randomUUID(),
    name: trimmed,
    type,
    sortOrder: last ? last.sortOrder + 1 : 0,
    isActive: true,
  }
  await db.categories.add(category)
  return category
}

export async function renameCategory(id: string, name: string): Promise<void> {
  const trimmed = name.trim()
  if (trimmed === '') throw new Error('カテゴリ名を入力してください')
  const updated = await db.categories.update(id, { name: trimmed })
  if (updated === 0) throw new Error('カテゴリが見つかりません')
}

/** 非表示 / 再表示。削除はしない（過去の記録との整合を保つため） */
export async function setCategoryActive(id: string, isActive: boolean): Promise<void> {
  const updated = await db.categories.update(id, { isActive })
  if (updated === 0) throw new Error('カテゴリが見つかりません')
}

/** 渡した id の並び順で sortOrder を振り直す */
export async function reorderCategories(orderedIds: string[]): Promise<void> {
  await db.transaction('rw', db.categories, async () => {
    await Promise.all(
      orderedIds.map((id, index) => db.categories.update(id, { sortOrder: index })),
    )
  })
}
