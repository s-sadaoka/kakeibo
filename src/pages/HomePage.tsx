import { useEffect, useState } from 'react'
import { listAllBudgets, listAllCategories, listEntriesByMonth } from '../data'
import { buildMonthSummary, type BudgetStatus, type MonthSummary } from '../logic/budget'
import { addMonths, currentYearMonth, formatYearMonthLabel } from '../logic/date'
import { formatYen } from '../logic/format'
import { paths } from '../logic/route'

// ホーム（docs/requirements.md 3.1）
// - 上部：当月の支出合計 / 収入合計 / 予算合計 / 残額
// - 一覧：支出カテゴリごとの予算 / 実績 / 残額。残額が少ない・マイナスは色で警告
// 集計は src/logic/budget.ts の buildMonthSummary に任せ、ここは表示だけを担当する。

interface Props {
  yearMonth: string | null
}

const STATUS_LABEL: Record<BudgetStatus, string> = {
  none: '',
  ok: '',
  warning: '残りわずか',
  over: '予算超過',
}

export function HomePage({ yearMonth }: Props) {
  const ym = yearMonth ?? currentYearMonth()
  const [summary, setSummary] = useState<MonthSummary | null>(null)

  useEffect(() => {
    let cancelled = false
    // 予算は「未設定月は直近過去の値を引き継ぐ」ため、当月分だけでなく全件を渡す
    Promise.all([listAllCategories(), listEntriesByMonth(ym), listAllBudgets()]).then(
      ([categories, entries, budgets]) => {
        if (cancelled) return
        setSummary(buildMonthSummary(ym, categories, entries, budgets))
      },
    )
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

      {summary === null ? (
        <p className="muted">読み込み中…</p>
      ) : (
        <>
          <section className="summary-card" aria-label="当月の合計">
            <div className="summary-item">
              <span className="summary-label">支出合計</span>
              <span className="summary-value">{formatYen(summary.expense)}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">収入合計</span>
              <span className="summary-value income">{formatYen(summary.income)}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">予算合計</span>
              <span className="summary-value">{formatYen(summary.budgetTotal)}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">残額</span>
              <span className={summary.remainingTotal < 0 ? 'summary-value over' : 'summary-value'}>
                {formatYen(summary.remainingTotal)}
              </span>
            </div>
          </section>

          {summary.categories.length === 0 ? (
            <p className="muted">表示できる支出カテゴリがありません。設定でカテゴリを追加してください。</p>
          ) : (
            <table className="budget-table">
              <thead>
                <tr>
                  <th scope="col" className="col-name">
                    カテゴリ
                  </th>
                  <th scope="col">予算</th>
                  <th scope="col">実績</th>
                  <th scope="col">残額</th>
                </tr>
              </thead>
              <tbody>
                {summary.categories.map((row) => (
                  <tr key={row.category.id} className={`status-${row.status}`}>
                    <th scope="row" className="col-name">
                      {row.category.name}
                      {!row.category.isActive && <span className="muted">（非表示）</span>}
                      {STATUS_LABEL[row.status] && (
                        <span className="status-badge">{STATUS_LABEL[row.status]}</span>
                      )}
                    </th>
                    <td>{row.budget === null ? <span className="muted">未設定</span> : formatYen(row.budget)}</td>
                    <td>{formatYen(row.spent)}</td>
                    <td className="col-remaining">
                      {row.remaining === null ? <span className="muted">—</span> : formatYen(row.remaining)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      <a className="fab" href={paths.entryNew()} aria-label="記録を追加">
        ＋
      </a>
    </>
  )
}
