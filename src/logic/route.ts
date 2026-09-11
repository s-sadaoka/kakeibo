// URL のハッシュ（#/entry/new など）を画面の種類に変換する。
// React Router は入れず、この純粋関数と src/router.ts の小さなフックで画面を切り替える。

export type Route =
  | { name: 'home'; yearMonth: string | null }
  | { name: 'entryNew'; date: string | null }
  | { name: 'entryEdit'; id: string }
  | { name: 'calendar'; yearMonth: string | null }
  | { name: 'settings' }

/** 各画面へのハッシュを作る。画面側はこの関数を通してリンクを組み立てる */
export const paths = {
  home: (yearMonth?: string) => (yearMonth ? `#/?ym=${yearMonth}` : '#/'),
  entryNew: (date?: string) => (date ? `#/entry/new?date=${date}` : '#/entry/new'),
  entryEdit: (id: string) => `#/entry/${id}`,
  calendar: (yearMonth?: string) => (yearMonth ? `#/calendar?ym=${yearMonth}` : '#/calendar'),
  settings: () => '#/settings',
}

/** 不明なハッシュはホーム扱いにする */
export function parseRoute(hash: string): Route {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash
  const [pathPart, queryPart = ''] = raw.split('?')
  const query = new URLSearchParams(queryPart)
  const segments = pathPart.split('/').filter((s) => s !== '')

  if (segments.length === 0) return { name: 'home', yearMonth: query.get('ym') }

  if (segments[0] === 'entry' && segments.length === 2) {
    if (segments[1] === 'new') return { name: 'entryNew', date: query.get('date') }
    return { name: 'entryEdit', id: segments[1] }
  }
  if (segments[0] === 'calendar' && segments.length === 1) {
    return { name: 'calendar', yearMonth: query.get('ym') }
  }
  if (segments[0] === 'settings' && segments.length === 1) return { name: 'settings' }

  return { name: 'home', yearMonth: null }
}
