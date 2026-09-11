import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import {
  addCategory,
  deleteBudget,
  exportAllData,
  importAllData,
  listAllBudgets,
  listAllCategories,
  renameCategory,
  reorderCategories,
  setCategoryActive,
  upsertBudget,
  type Budget,
  type Category,
  type EntryType,
} from '../data'
import { exportFileName, parseExportData } from '../logic/backup'
import { resolveBudget } from '../logic/budget'
import { addMonths, currentYearMonth, formatYearMonthLabel, today } from '../logic/date'
import { parseAmount } from '../logic/entryForm'
import { formatYen } from '../logic/format'

// 設定（docs/requirements.md 3.4）
// 3 つの独立したセクションに分ける。インポートで全データが入れ替わったときは
// key を変えてセクションごと作り直し、古い表示が残らないようにする。

export function SettingsPage() {
  const [generation, setGeneration] = useState(0)
  // カテゴリの追加・非表示・並び替えを月予算欄にも反映するための版数
  const [categoriesVersion, setCategoriesVersion] = useState(0)
  return (
    <>
      <h1>設定</h1>
      <CategorySection key={`c${generation}`} onChanged={() => setCategoriesVersion((v) => v + 1)} />
      <BudgetSection key={`b${generation}`} categoriesVersion={categoriesVersion} />
      <DataSection onImported={() => setGeneration((g) => g + 1)} />
    </>
  )
}

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

// ---------------------------------------------------------------- カテゴリ管理

function CategorySection({ onChanged }: { onChanged: () => void }) {
  const [categories, setCategories] = useState<Category[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const reload = async () => setCategories(await listAllCategories())
  useEffect(() => {
    void reload()
  }, [])

  const run = async (action: () => Promise<void>) => {
    setError(null)
    try {
      await action()
      await reload()
      onChanged()
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  if (categories === null) return <section className="settings-section" />

  const byType = (type: EntryType) => categories.filter((c) => c.type === type)

  /** 同じ種別の中で index の項目を delta（±1）だけ動かす。sortOrder は全カテゴリ通しで振り直す */
  const move = (type: EntryType, index: number, delta: number) => {
    const list = byType(type)
    const target = index + delta
    if (target < 0 || target >= list.length) return
    const reordered = [...list]
    ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]
    const expense = type === 'expense' ? reordered : byType('expense')
    const income = type === 'income' ? reordered : byType('income')
    void run(() => reorderCategories([...expense, ...income].map((c) => c.id)))
  }

  return (
    <section className="settings-section" aria-labelledby="h-categories">
      <h2 id="h-categories">カテゴリ</h2>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <CategoryList
        title="支出"
        type="expense"
        items={byType('expense')}
        onMove={(i, d) => move('expense', i, d)}
        onRename={(id, name) => run(() => renameCategory(id, name))}
        onToggle={(id, active) => run(() => setCategoryActive(id, active))}
        onAdd={(name) => run(() => addCategory(name, 'expense').then(() => undefined))}
      />
      <CategoryList
        title="収入"
        type="income"
        items={byType('income')}
        onMove={(i, d) => move('income', i, d)}
        onRename={(id, name) => run(() => renameCategory(id, name))}
        onToggle={(id, active) => run(() => setCategoryActive(id, active))}
        onAdd={(name) => run(() => addCategory(name, 'income').then(() => undefined))}
      />
      <p className="muted small">
        非表示にしたカテゴリは入力画面に出なくなりますが、過去の記録はそのまま残ります。
      </p>
    </section>
  )
}

interface CategoryListProps {
  title: string
  type: EntryType
  items: Category[]
  onMove: (index: number, delta: number) => void
  onRename: (id: string, name: string) => void
  onToggle: (id: string, active: boolean) => void
  onAdd: (name: string) => void
}

function CategoryList({ title, type, items, onMove, onRename, onToggle, onAdd }: CategoryListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [newName, setNewName] = useState('')

  const submitRename = (e: FormEvent) => {
    e.preventDefault()
    if (editingId === null) return
    onRename(editingId, editName)
    setEditingId(null)
  }
  const submitAdd = (e: FormEvent) => {
    e.preventDefault()
    onAdd(newName)
    setNewName('')
  }

  return (
    <div className="category-group">
      <h3>{title}</h3>
      <ul className="category-list">
        {items.map((c, i) => (
          <li key={c.id} className={c.isActive ? 'category-row' : 'category-row inactive'}>
            {editingId === c.id ? (
              <form className="category-edit" onSubmit={submitRename}>
                <input
                  type="text"
                  aria-label="カテゴリ名"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  autoFocus
                />
                <button type="submit" className="small-button primary">
                  保存
                </button>
                <button type="button" className="small-button" onClick={() => setEditingId(null)}>
                  取消
                </button>
              </form>
            ) : (
              <>
                <span className="category-name">
                  {c.name}
                  {!c.isActive && <span className="muted">（非表示）</span>}
                </span>
                <span className="category-actions">
                  <button
                    type="button"
                    className="small-button"
                    aria-label={`${c.name} を上へ`}
                    disabled={i === 0}
                    onClick={() => onMove(i, -1)}
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    className="small-button"
                    aria-label={`${c.name} を下へ`}
                    disabled={i === items.length - 1}
                    onClick={() => onMove(i, 1)}
                  >
                    ▼
                  </button>
                  <button
                    type="button"
                    className="small-button"
                    aria-label={`${c.name} の名前を変更`}
                    onClick={() => {
                      setEditingId(c.id)
                      setEditName(c.name)
                    }}
                  >
                    名前
                  </button>
                  <button
                    type="button"
                    className="small-button"
                    aria-label={`${c.name} を${c.isActive ? '非表示' : '表示'}にする`}
                    onClick={() => onToggle(c.id, !c.isActive)}
                  >
                    {c.isActive ? '非表示' : '表示'}
                  </button>
                </span>
              </>
            )}
          </li>
        ))}
      </ul>
      <form className="category-add" onSubmit={submitAdd}>
        <input
          type="text"
          aria-label={`${title}カテゴリを追加`}
          placeholder={`${title}カテゴリを追加`}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          data-type={type}
        />
        <button type="submit" className="small-button primary" disabled={newName.trim() === ''}>
          追加
        </button>
      </form>
    </div>
  )
}

// ---------------------------------------------------------------- 月予算

function BudgetSection({ categoriesVersion }: { categoriesVersion: number }) {
  const [ym, setYm] = useState(currentYearMonth)
  const [categories, setCategories] = useState<Category[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [texts, setTexts] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState<string | null>(null)

  const load = async (yearMonth: string) => {
    const [cats, all] = await Promise.all([listAllCategories(), listAllBudgets()])
    setCategories(cats.filter((c) => c.type === 'expense' && c.isActive))
    setBudgets(all)
    // 入力欄には「この月に明示的に設定した値」だけを入れる。引き継ぎ分は placeholder に出す
    const initial: Record<string, string> = {}
    for (const b of all) if (b.yearMonth === yearMonth) initial[b.categoryId] = String(b.amount)
    setTexts(initial)
    setErrors({})
  }
  useEffect(() => {
    void load(ym)
  }, [ym, categoriesVersion])

  const changeMonth = (delta: number) => {
    setMessage(null)
    setYm((m) => addMonths(m, delta))
  }

  const save = async (e: FormEvent) => {
    e.preventDefault()
    setMessage(null)
    const nextErrors: Record<string, string> = {}
    const ops: (() => Promise<void>)[] = []
    for (const c of categories) {
      const text = (texts[c.id] ?? '').trim()
      const existing = budgets.some((b) => b.categoryId === c.id && b.yearMonth === ym)
      if (text === '') {
        if (existing) ops.push(() => deleteBudget(c.id, ym))
        continue
      }
      const amount = parseAmount(text)
      if (amount === null) {
        nextErrors[c.id] = '半角数字で入力してください'
        continue
      }
      ops.push(() => upsertBudget({ categoryId: c.id, yearMonth: ym, amount }))
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    try {
      for (const op of ops) await op()
      await load(ym)
      setMessage(`${formatYearMonthLabel(ym)}の予算を保存しました`)
    } catch (err) {
      setMessage(errorMessage(err))
    }
  }

  return (
    <section className="settings-section" aria-labelledby="h-budget">
      <h2 id="h-budget">月予算</h2>
      <div className="month-nav compact">
        <button type="button" className="month-arrow" aria-label="前の月" onClick={() => changeMonth(-1)}>
          ‹
        </button>
        <span className="month-label">{formatYearMonthLabel(ym)}</span>
        <button type="button" className="month-arrow" aria-label="次の月" onClick={() => changeMonth(1)}>
          ›
        </button>
      </div>
      <form onSubmit={save}>
        {categories.map((c) => {
          const inherited = resolveBudget(
            budgets.filter((b) => b.yearMonth !== ym),
            c.id,
            ym,
          )
          return (
            <div key={c.id} className="budget-field">
              <label htmlFor={`budget-${c.id}`} className="budget-label">
                {c.name}
              </label>
              <div className="budget-input">
                <input
                  id={`budget-${c.id}`}
                  type="text"
                  inputMode="numeric"
                  placeholder={inherited === null ? '未設定' : `${formatYen(inherited)}（引き継ぎ）`}
                  value={texts[c.id] ?? ''}
                  onChange={(e) => setTexts({ ...texts, [c.id]: e.target.value })}
                />
                {errors[c.id] && (
                  <p className="error" role="alert">
                    {errors[c.id]}
                  </p>
                )}
              </div>
            </div>
          )
        })}
        <p className="muted small">空欄のカテゴリは、それより前の月に設定した予算を引き継ぎます。</p>
        <button type="submit" className="button primary">
          予算を保存する
        </button>
        {message && (
          <p className="notice" role="status">
            {message}
          </p>
        )}
      </form>
    </section>
  )
}

// ---------------------------------------------------------------- データ管理

function DataSection({ onImported }: { onImported: () => void }) {
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const exportJson = async () => {
    setMessage(null)
    setError(null)
    try {
      const data = await exportAllData()
      const json = JSON.stringify(data, null, 2)
      const name = exportFileName(today())
      const file = new File([json], name, { type: 'application/json' })
      // iPhone では共有シートに出す（「ファイルに保存」や AirDrop が選べる）。使えない環境ではダウンロード
      if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: name })
      } else {
        const url = URL.createObjectURL(file)
        const a = document.createElement('a')
        a.href = url
        a.download = name
        a.click()
        URL.revokeObjectURL(url)
      }
      setMessage(`記録 ${data.entries.length} 件をエクスポートしました`)
    } catch (e) {
      // 共有シートを閉じただけのときはエラー扱いにしない
      if (e instanceof DOMException && e.name === 'AbortError') return
      setError(errorMessage(e))
    }
  }

  const importJson = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setMessage(null)
    setError(null)
    const parsed = parseExportData(await file.text())
    if (!parsed.ok) {
      setError(`インポートできません: ${parsed.error}`)
      return
    }
    const current = await exportAllData()
    const ok = window.confirm(
      `現在のデータ（記録 ${current.entries.length} 件）をすべて削除して、ファイルの内容（記録 ${parsed.data.entries.length} 件、カテゴリ ${parsed.data.categories.length} 件、予算 ${parsed.data.budgets.length} 件）に置き換えます。よろしいですか？`,
    )
    if (!ok) return
    try {
      await importAllData(parsed.data)
      setMessage(`記録 ${parsed.data.entries.length} 件をインポートしました`)
      onImported()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <section className="settings-section" aria-labelledby="h-data">
      <h2 id="h-data">データ</h2>
      <div className="actions">
        <button type="button" className="button secondary" onClick={() => void exportJson()}>
          JSON をエクスポート
        </button>
        <button type="button" className="button secondary" onClick={() => fileInput.current?.click()}>
          JSON をインポート
        </button>
        <input
          ref={fileInput}
          type="file"
          accept=".json,application/json"
          aria-label="インポートするファイル"
          hidden
          onChange={(e) => void importJson(e)}
        />
      </div>
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <p className="muted small">
        データはこの端末の中にだけ保存されています。機種変更や万一に備えて、ときどきエクスポートしてください。
      </p>
    </section>
  )
}
