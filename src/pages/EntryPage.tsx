import { useEffect, useState } from 'react'
import {
  addEntry,
  deleteEntry,
  getEntry,
  listAllCategories,
  updateEntry,
  type Category,
  type EntryType,
} from '../data'
import { today } from '../logic/date'
import { validateEntryForm, type EntryFormErrors, type EntryFormValues } from '../logic/entryForm'
import { paths } from '../logic/route'
import { replace } from '../router'

interface Props {
  /** 編集対象の記録 id。新規なら undefined */
  entryId?: string
  /** 新規のときの既定日付（カレンダーの日から来た場合）。省略時は今日 */
  initialDate?: string | null
}

type LoadState = 'loading' | 'ready' | 'notFound'

export function EntryPage({ entryId, initialDate }: Props) {
  const isEdit = entryId !== undefined
  const [state, setState] = useState<LoadState>('loading')
  const [categories, setCategories] = useState<Category[]>([])
  const [values, setValues] = useState<EntryFormValues>({
    date: initialDate ?? today(),
    type: 'expense',
    amountText: '',
    categoryId: '',
    memo: '',
  })
  const [errors, setErrors] = useState<EntryFormErrors>({})
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // 初期表示：カテゴリ一覧と（編集なら）記録を読む
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const cats = await listAllCategories()
      if (cancelled) return
      setCategories(cats)

      if (!isEdit) {
        const first = cats.find((c) => c.isActive && c.type === 'expense')
        setValues((v) => ({ ...v, categoryId: first?.id ?? '' }))
        setState('ready')
        return
      }

      const entry = await getEntry(entryId)
      if (cancelled) return
      if (!entry) {
        setState('notFound')
        return
      }
      setValues({
        date: entry.date,
        type: entry.type,
        amountText: String(entry.amount),
        categoryId: entry.categoryId,
        memo: entry.memo,
      })
      setState('ready')
    })()
    return () => {
      cancelled = true
    }
  }, [entryId, isEdit])

  // 選択肢：表示中のカテゴリ。編集中の記録が非表示カテゴリを使っている場合はそれも残す
  const options = categories.filter(
    (c) => c.type === values.type && (c.isActive || c.id === values.categoryId),
  )

  function changeType(type: EntryType) {
    const first = categories.find((c) => c.isActive && c.type === type)
    setValues((v) => ({ ...v, type, categoryId: first?.id ?? '' }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = validateEntryForm(values)
    if (!result.ok) {
      setErrors(result.errors)
      return
    }
    setErrors({})
    setSaveError(null)
    setSaving(true)
    try {
      if (isEdit) await updateEntry(entryId, result.input)
      else await addEntry(result.input)
      replace(paths.home())
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err))
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!isEdit) return
    if (!window.confirm('この記録を削除しますか？')) return
    setSaving(true)
    try {
      await deleteEntry(entryId)
      replace(paths.home())
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err))
      setSaving(false)
    }
  }

  if (state === 'loading') return <p className="muted">読み込み中…</p>
  if (state === 'notFound') {
    return (
      <>
        <p role="alert">記録が見つかりません。削除済みの可能性があります。</p>
        <a className="button secondary" href={paths.home()}>
          ホームへ戻る
        </a>
      </>
    )
  }

  return (
    <form className="entry-form" onSubmit={handleSubmit} noValidate>
      <h1>{isEdit ? '記録を編集' : '記録を追加'}</h1>

      <div className="field">
        <span className="label">種別</span>
        <div className="segmented" role="radiogroup" aria-label="種別">
          <button
            type="button"
            role="radio"
            aria-checked={values.type === 'expense'}
            className={values.type === 'expense' ? 'selected' : ''}
            onClick={() => changeType('expense')}
          >
            支出
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={values.type === 'income'}
            className={values.type === 'income' ? 'selected' : ''}
            onClick={() => changeType('income')}
          >
            収入
          </button>
        </div>
      </div>

      <div className="field">
        <label className="label" htmlFor="date">
          日付
        </label>
        <input
          id="date"
          type="date"
          value={values.date}
          onChange={(e) => setValues((v) => ({ ...v, date: e.target.value }))}
        />
        {errors.date && <p className="error">{errors.date}</p>}
      </div>

      <div className="field">
        <label className="label" htmlFor="amount">
          金額（円）
        </label>
        <input
          id="amount"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="例: 1200"
          value={values.amountText}
          onChange={(e) => setValues((v) => ({ ...v, amountText: e.target.value }))}
        />
        {errors.amount && <p className="error">{errors.amount}</p>}
      </div>

      <div className="field">
        <label className="label" htmlFor="category">
          カテゴリ
        </label>
        <select
          id="category"
          value={values.categoryId}
          onChange={(e) => setValues((v) => ({ ...v, categoryId: e.target.value }))}
        >
          {options.length === 0 && <option value="">（カテゴリがありません）</option>}
          {options.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.isActive ? '' : '（非表示）'}
            </option>
          ))}
        </select>
        {errors.categoryId && <p className="error">{errors.categoryId}</p>}
      </div>

      <div className="field">
        <label className="label" htmlFor="memo">
          メモ（任意）
        </label>
        <input
          id="memo"
          type="text"
          value={values.memo}
          onChange={(e) => setValues((v) => ({ ...v, memo: e.target.value }))}
        />
      </div>

      {saveError && (
        <p className="error" role="alert">
          {saveError}
        </p>
      )}

      <div className="actions">
        <button type="submit" className="button primary" disabled={saving}>
          {isEdit ? '更新する' : '保存する'}
        </button>
        <a className="button secondary" href={paths.home()}>
          キャンセル
        </a>
        {isEdit && (
          <button type="button" className="button danger" onClick={handleDelete} disabled={saving}>
            削除する
          </button>
        )}
      </div>
    </form>
  )
}
