import { paths, type Route } from '../logic/route'

const tabs: { name: Route['name']; label: string; href: string }[] = [
  { name: 'home', label: 'ホーム', href: paths.home() },
  { name: 'calendar', label: 'カレンダー', href: paths.calendar() },
  { name: 'settings', label: '設定', href: paths.settings() },
]

/** 画面下部のタブ。入力画面ではホームを選択中として扱う */
export function TabBar({ current }: { current: Route['name'] }) {
  const active = current === 'entryNew' || current === 'entryEdit' ? 'home' : current
  return (
    <nav className="tabbar">
      {tabs.map((t) => (
        <a key={t.name} href={t.href} className={t.name === active ? 'tab active' : 'tab'}>
          {t.label}
        </a>
      ))}
    </nav>
  )
}
