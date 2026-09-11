# 家計簿PWA

個人用の家計簿アプリ。iPhone Safari の「ホーム画面に追加」で使う PWA。
サーバーなし、認証なし、データは端末内（IndexedDB）のみ。

## 必ず先に読むもの
- docs/requirements.md — 確定済みの要件。ここに書かれていない機能は作らない
- docs/handoff.md — 背景、技術選定、作業の進め方、iPhone での確認方法

## 技術スタック
- Vite + React + TypeScript
- IndexedDB は Dexie.js 経由で使う
- PWA 化は vite-plugin-pwa
- デプロイは GitHub Actions → GitHub Pages
- 追加ライブラリは最小限にし、入れる前に理由をユーザーに説明する

## 開発コマンド
- `npm install` — 依存関係のインストール
- `npm run dev` — 開発サーバー起動
- `npm run build` — 本番ビルド
- `npm run preview` — ビルド結果の確認（PWA の挙動はこちらで確認する）
- `npm test` — テスト実行（ロジックのユニットテストのみ）

## 設計上の約束
- データの読み書きは `src/data/` 配下のリポジトリ層に集約する。画面から IndexedDB を直接触らない
- 集計ロジック（月別合計、残額、予算の引き継ぎ）は純粋関数として `src/logic/` に置き、テストを書く
- 画面はスマホ縦向き幅（375px 前後）を前提に作る。PC 向けレイアウトは不要
- 日付は YYYY-MM-DD の文字列で持つ。Date オブジェクトをそのまま保存しない
- 金額は整数（円）。小数は扱わない
- ID は crypto.randomUUID() で生成する
- カテゴリは削除せず isActive=false で非表示にする

## 作業の進め方
- docs/handoff.md の「作業ステップ」の順に進める。1 ステップごとに動作確認してからコミットする
- 要件に書かれていないことを判断する必要があるときは、実装前にユーザーに確認する
- ユーザーはスマホアプリ開発が初めて。変更内容と理由を短く日本語で説明する
- コミットメッセージは日本語で、何をしたかを 1 行で書く

## 注意点
- GitHub Pages はサブパス配信（`https://<user>.github.io/<repo>/`）になるため、Vite の `base` と PWA の scope を合わせること
- Service Worker を更新したときは iPhone 側で再読み込みが必要になる。確認手順は docs/handoff.md を参照
- localStorage は使わない。IndexedDB に統一する
