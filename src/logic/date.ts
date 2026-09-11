// 日付は YYYY-MM-DD、年月は YYYY-MM の文字列で扱う。Date オブジェクトは計算の途中でだけ使う。

function pad2(n: number): string {
  return n.toString().padStart(2, '0')
}

/** Date（端末のローカル時刻）を YYYY-MM-DD にする。toISOString() は UTC になるので使わない */
export function formatLocalDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

/** 今日の日付（端末のローカル時刻） */
export function today(): string {
  return formatLocalDate(new Date())
}

/** YYYY-MM-DD → YYYY-MM */
export function toYearMonth(date: string): string {
  return date.slice(0, 7)
}

/** 今月（端末のローカル時刻） */
export function currentYearMonth(): string {
  return toYearMonth(today())
}

/** YYYY-MM に月数を足す。負の数で前月へ。年またぎも扱う */
export function addMonths(yearMonth: string, delta: number): string {
  const [y, m] = yearMonth.split('-').map(Number)
  const total = y * 12 + (m - 1) + delta
  const year = Math.floor(total / 12)
  const month = (total % 12) + 1
  return `${year}-${pad2(month)}`
}

/** その月の日数（うるう年対応） */
export function daysInMonth(yearMonth: string): number {
  const [y, m] = yearMonth.split('-').map(Number)
  // 翌月 0 日 = 当月末日
  return new Date(y, m, 0).getDate()
}

/** その月の 1 日の曜日（0=日曜 〜 6=土曜）。カレンダーの先頭の空きセル数に使う */
export function firstWeekday(yearMonth: string): number {
  const [y, m] = yearMonth.split('-').map(Number)
  return new Date(y, m - 1, 1).getDay()
}

/** その月の全日付を YYYY-MM-DD で返す */
export function datesOfMonth(yearMonth: string): string[] {
  const n = daysInMonth(yearMonth)
  return Array.from({ length: n }, (_, i) => `${yearMonth}-${pad2(i + 1)}`)
}

/** 表示用「2026年9月」 */
export function formatYearMonthLabel(yearMonth: string): string {
  const [y, m] = yearMonth.split('-').map(Number)
  return `${y}年${m}月`
}
