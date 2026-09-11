import { useEffect, useState } from 'react'
import { parseRoute, type Route } from './logic/route'

/** 現在のハッシュに対応する画面。ハッシュが変わると再描画される */
export function useRoute(): Route {
  const [hash, setHash] = useState(() => window.location.hash)
  useEffect(() => {
    const onChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return parseRoute(hash)
}

/** 画面遷移。履歴に残るので「戻る」で前の画面に戻れる */
export function navigate(hash: string): void {
  window.location.hash = hash
}

/** 履歴を置き換えて遷移。保存後にホームへ戻るときなど、「戻る」で入力画面に戻したくない場合に使う */
export function replace(hash: string): void {
  window.history.replaceState(null, '', hash)
  window.dispatchEvent(new HashChangeEvent('hashchange'))
}
