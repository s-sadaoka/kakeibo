import { describe, expect, it } from 'vitest'
import { parseRoute, paths } from './route'

describe('parseRoute', () => {
  it('空・#・#/ はホーム', () => {
    expect(parseRoute('')).toEqual({ name: 'home', yearMonth: null })
    expect(parseRoute('#')).toEqual({ name: 'home', yearMonth: null })
    expect(parseRoute('#/')).toEqual({ name: 'home', yearMonth: null })
  })

  it('ホームは ym で表示月を指定できる', () => {
    expect(parseRoute('#/?ym=2026-08')).toEqual({ name: 'home', yearMonth: '2026-08' })
  })

  it('新規入力は date を省略できる', () => {
    expect(parseRoute('#/entry/new')).toEqual({ name: 'entryNew', date: null })
    expect(parseRoute('#/entry/new?date=2026-09-11')).toEqual({ name: 'entryNew', date: '2026-09-11' })
  })

  it('id 付きは編集', () => {
    expect(parseRoute('#/entry/3f2a-abc')).toEqual({ name: 'entryEdit', id: '3f2a-abc' })
  })

  it('カレンダーと設定', () => {
    expect(parseRoute('#/calendar')).toEqual({ name: 'calendar', yearMonth: null, date: null })
    expect(parseRoute('#/calendar?ym=2026-09&date=2026-09-11')).toEqual({
      name: 'calendar',
      yearMonth: '2026-09',
      date: '2026-09-11',
    })
    expect(parseRoute('#/calendar?ym=2026-10')).toEqual({ name: 'calendar', yearMonth: '2026-10', date: null })
    expect(parseRoute('#/settings')).toEqual({ name: 'settings' })
  })

  it('不明なパスはホームに落とす', () => {
    expect(parseRoute('#/unknown')).toEqual({ name: 'home', yearMonth: null })
    expect(parseRoute('#/entry')).toEqual({ name: 'home', yearMonth: null })
    expect(parseRoute('#/entry/a/b')).toEqual({ name: 'home', yearMonth: null })
    expect(parseRoute('#/settings/extra')).toEqual({ name: 'home', yearMonth: null })
  })
})

describe('paths', () => {
  it('作ったハッシュを parseRoute で元に戻せる', () => {
    expect(parseRoute(paths.home())).toEqual({ name: 'home', yearMonth: null })
    expect(parseRoute(paths.home('2026-08'))).toEqual({ name: 'home', yearMonth: '2026-08' })
    expect(parseRoute(paths.entryNew())).toEqual({ name: 'entryNew', date: null })
    expect(parseRoute(paths.entryNew('2026-09-01'))).toEqual({ name: 'entryNew', date: '2026-09-01' })
    expect(parseRoute(paths.entryEdit('id-1'))).toEqual({ name: 'entryEdit', id: 'id-1' })
    expect(parseRoute(paths.calendar('2026-09'))).toEqual({ name: 'calendar', yearMonth: '2026-09', date: null })
    expect(paths.calendar()).toBe('#/calendar')
    expect(paths.calendar('2026-09', '2026-09-11')).toBe('#/calendar?ym=2026-09&date=2026-09-11')
    expect(parseRoute(paths.calendar('2026-09', '2026-09-11'))).toEqual({
      name: 'calendar',
      yearMonth: '2026-09',
      date: '2026-09-11',
    })
    expect(parseRoute(paths.settings())).toEqual({ name: 'settings' })
  })
})
