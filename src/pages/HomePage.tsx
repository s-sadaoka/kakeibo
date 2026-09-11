import { useEffect, useState } from 'react'
import { listAllCategories, listEntriesByMonth, type Category, type Entry } from '../data'
import { addMonths, currentYearMonth, formatYearMonthLabel } from '../logic/date'
import { formatYen } from '../logic/format'
import { paths } from '../logic/route'

// ステップ 4 時点の仮のホーム。当月の記録一覧と「＋」だけを置き、
// 予算 / 実績 / 残額の一覧はステップ 5 で作る。

interface Props {
  yearMonth: string | null
}

export function HomePage({ yearMonth }: Props) {
  const ym = yearMonth ?? currentYearMonth()
  const [entries, setEntries] = useState<Entry[] | null>(null)
  const [categoryNames, setCategoryNames] = useState<Map<string, string>>(new Map())

  useEffect(() => {
    let cancelled = false
    Promise.all([listEntriesByMonth(ym), listAllCategories()]).then(([es, cats]) => {
      if (cancelled) return
      setEntries(es)
      setCategoryNames(new Map(cats.map((c: Category) => [c.id, c.name])))
    })
    return () => {
      cancelled = true
    }
  }, [ym])

  return (
    <>
      <header className="month-nav">
        <a className="month-arrow" href={paths.home(addMonths(ym, -1))} aria-label="前の月">
          ‹
        </a>
        <h1>{formatYearMonthLabel(ym)}</h1>
        <a className="month-arrow" href={paths.home(addMonths(ym, 1))} aria-label="次の月">
          ›
        </a>
      </header>

      {entries === null ? (
        <p className="muted">読み込み中…</p>
      ) : entries.length === 0 ? (
        <p className="muted">この月の記録はまだありません。右下の「＋」から追加できます。</p>
      ) : (
        <ul className="entry-list">
          {entries.map((e) => (
            <li key={e.id}>
              <a href={paths.entryEdit(e.id)} className="entry-row">
                <span className="entry-date">{e.date.slice(5).replace('-', '/')}</span>
                <span className="entry-main">
                  <span className="entry-category">{categoryNames.get(e.categoryId) ?? '（不明）'}</span>
                  {e.memo && <span className="entry-memo">{e.memo}</span>}
                </span>
                <span className={e.type === 'income' ? 'entry-amount income' : 'entry-amount'}>
                  {e.type === 'income' ? '+' : '-'}
                  {formatYen(e.amount)}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}

      <a className="fab" href={paths.entryNew()} aria-label="記録を追加">
        ＋
      </a>
    </>
  )
}
