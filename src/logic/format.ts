/** 金額を「1,200」のように 3 桁区切りで表示する。マイナスは「-1,200」 */
export function formatYen(amount: number): string {
  const abs = Math.abs(amount).toLocaleString('ja-JP')
  return amount < 0 ? `-${abs}` : abs
}
