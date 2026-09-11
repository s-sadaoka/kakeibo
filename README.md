# 家計簿PWA

個人用の家計簿アプリ。iPhone Safari の「ホーム画面に追加」で、ネイティブアプリのように使えます。
サーバーもログインもなく、データは端末内（IndexedDB）にだけ保存されます。

公開 URL: https://s-sadaoka.github.io/kakeibo/

## できること

- **記録**：日付・種別（収入 / 支出）・金額・カテゴリ・メモを登録、編集、削除
- **ホーム**：当月のカテゴリ別「予算 / 実績 / 残額」と全体合計。残額が予算の 10% 未満で黄色、マイナスで赤の警告
- **カレンダー**：月表示に日別の支出合計。日をタップするとその日の記録一覧、記録をタップで編集へ
- **設定**：カテゴリの追加・名前変更・並び替え・非表示、カテゴリ別の月予算（未設定の月は前の月を引き継ぐ）、JSON エクスポート / インポート
- **オフライン**：一度開けば、通信がなくても全画面が動作します

第 1 段階でやらないこと（固定費の自動登録、支払方法、口座連携、レシート読み取り、通知、クラウド同期）は `docs/requirements.md` の 8 章を参照してください。

## iPhone での使い方

1. Safari で公開 URL を開く
2. 共有ボタン →「ホーム画面に追加」
3. ホーム画面のアイコンから起動する（全画面で動きます）

更新版が反映されないときは、アプリを一度完全に閉じて開き直してください。

### バックアップ

データは端末の中にしかありません。機種変更や Safari のサイトデータ削除で消えるため、設定画面の「JSON をエクスポート」でときどきファイルに保存してください（共有シートから「ファイルに保存」）。復元は「JSON をインポート」です。既存データはファイルの内容にすべて置き換わります。

## 開発

必要なもの：Node.js（LTS）

```
npm install        # 依存関係のインストール
npm run dev        # 開発サーバー（http://localhost:5173/kakeibo/）
npm test           # ロジックのユニットテスト（Vitest）
npm run build      # 本番ビルド（dist/）
npm run preview    # ビルド結果の確認。PWA の挙動はこちらで確認する
```

### 技術スタック

| 役割 | 選定 |
|---|---|
| ビルド | Vite |
| UI | React + TypeScript |
| ローカル DB | Dexie.js（IndexedDB） |
| PWA | vite-plugin-pwa（manifest と Service Worker を自動生成） |
| 画面遷移 | 自前実装（URL ハッシュ `#/calendar` など）。React Router は使わない |
| テスト | Vitest（`src/logic/` の純粋関数のみ） |
| デプロイ | GitHub Actions → GitHub Pages |

### ディレクトリ

```
src/
├── data/        # Dexie の定義とリポジトリ層。IndexedDB を触るのはここだけ
├── logic/       # 集計・予算の引き継ぎ・入力検証などの純粋関数（テスト対象）
├── pages/       # Home / Entry / Calendar / Settings
├── components/  # 共通部品（下部タブ）
├── router.ts    # ハッシュの監視と遷移
└── App.tsx      # 画面の切り替え
docs/
├── requirements.md  # 確定済みの要件（正本）
└── handoff.md       # 背景、技術選定、作業の進め方
```

### 設計上の約束

- 日付は `YYYY-MM-DD`、年月は `YYYY-MM` の文字列。金額は整数（円）
- ID は `crypto.randomUUID()`
- カテゴリは削除せず `isActive=false` で非表示にする（過去の記録との整合のため）
- 集計ルール（残額、予算の引き継ぎ、全体合計の定義）は `docs/requirements.md` の 5 章が正

## デプロイ

`main` に push すると GitHub Actions がテスト・ビルドを実行し、GitHub Pages に公開します（`.github/workflows/deploy.yml`）。
GitHub Pages はサブパス配信のため、`vite.config.ts` の `base` と PWA の `scope` / `start_url` を `/kakeibo/` で揃えています。
