import { useEffect, useState } from 'react'
import { listAllCategories, listEntriesByMonth, type Category, type Entry } from '../data'
import {
  addMonths,
  currentYearMonth,
  datesOfMonth,
  firstWeekday,
  formatDateLabel,
  formatYearMonthLabel,
  today,
  toYearMonth,
} from '../logic/date'
import { formatYen } from '../logic/format'
import { paths } from '../logic/route'
import { sumExpenseByDate } from '../logic/summary'
import { replace } from '../router'

// カレンダー（docs/requirements.md 3.3）
// - 月のカレンダーに日別の支出合計を出す
// - 日をタップするとその日の記録一覧。記録をタップで編集画面へ
// 選択中の日は URL（?date=）に持つので、編集画面から「戻る」でも同じ日が開いたままになる。

interface Props {
  yearMonth: string | null
  date: string | null
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

export function CalendarPage({ yearMonth, date }: Props) {
  const ym = yearMonth ?? currentYearMonth()
  const todayStr = today()
  // URL の date がこの月のものならそれを、なければ当月なら今日を選択。それ以外は未選択
  const selected =
    date && toYearMonth(date) === ym ? date : ym === toYearMonth(todayStr) ? todayStr : null

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

  const expenseByDate = sumExpenseByDate(entries ?? [])
  const dayEntries =
    selected === null
      ? []
      : (entries ?? [])
          .filter((e) => e.date === selected)
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt))

  // 日の選択は履歴に積まない（「戻る」で日を 1 つずつ辿らせない）
  const selectDate = (d: string) => replace(paths.calendar(ym, d))

  const cells: (string | null)[] = [...Array<null>(firstWeekday(ym)).fill(null), ...datesOfMonth(ym)]
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <>
      <header className="month-nav">
        <a className="month-arrow" href={paths.calendar(addMonths(ym, -1))} aria-label="前の月">
          ‹
        </a>
        <h1>{formatYearMonthLabel(ym)}</h1>
        <a className="month-arrow" href={paths.calendar(addMonths(ym, 1))} aria-label="次の月">
          ›
        </a>
      </header>

      <div className="calendar" role="grid" aria-label={formatYearMonthLabel(ym)}>
        {WEEKDAYS.map((w, i) => (
          <div key={w} className={`cal-weekday wd-${i}`} role="columnheader">
            {w}
          </div>
        ))}
        {cells.map((d, i) =>
          d === null ? (
            <div key={`blank-${i}`} className="cal-cell blank" />
          ) : (
            <button
              key={d}
              type="button"
              role="gridcell"
              className={[
                'cal-cell',
                `wd-${i % 7}`,
                d === todayStr ? 'today' : '',
                d === selected ? 'selected' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-pressed={d === selected}
              onClick={() => selectDate(d)}
            >
              <span className="cal-day">{Number(d.slice(8))}</span>
              {expenseByDate.has(d) && (
                <span className="cal-amount">{formatYen(expenseByDate.get(d)!)}</span>
              )}
            </button>
          ),
        )}
      </div>

      <section className="day-panel" aria-live="polite">
        {selected === null ? (
          <p className="muted">日をタップすると、その日の記録を表示します。</p>
        ) : (
          <>
            <h2 className="day-title">{formatDateLabel(selected)}の記録</h2>
            {entries === null ? (
              <p className="muted">読み込み中…</p>
            ) : dayEntries.length === 0 ? (
              <p className="muted">この日の記録はありません。</p>
            ) : (
              <ul className="entry-list">
                {dayEntries.map((e) => (
                  <li key={e.id}>
                    <a href={paths.entryEdit(e.id)} className="entry-row">
                      <span className="entry-main">
                        <span className="entry-category">
                          {categoryNames.get(e.categoryId) ?? '（不明）'}
                        </span>
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
          </>
        )}
      </section>

      <a className="fab" href={paths.entryNew(selected ?? undefined)} aria-label="記録を追加">
        ＋
      </a>
    </>
  )
}
