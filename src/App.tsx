import { useEffect, useState } from 'react'
import { initializeDatabase, listActiveCategories, type Category } from './data'

// ステップ 2 の確認用画面。データ層が動いていることを見せるだけで、本番の画面はステップ 4 以降で作る。
function App() {
  const [categories, setCategories] = useState<Category[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    initializeDatabase()
      .then(() => listActiveCategories())
      .then(setCategories)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
  }, [])

  return (
    <main className="app">
      <h1>家計簿</h1>
      {error && <p role="alert">エラー: {error}</p>}
      {categories === null ? (
        <p>読み込み中…</p>
      ) : (
        <>
          <p>カテゴリ {categories.length} 件（IndexedDB から取得）</p>
          <ul>
            {categories.map((c) => (
              <li key={c.id}>
                {c.name}（{c.type === 'expense' ? '支出' : '収入'}）
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  )
}

export default App
