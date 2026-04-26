# 営業訪問ルートプランナー (sales-route-planner)

他クライアント向けデモ用の営業訪問管理 Web アプリ。取引先を地図で俯瞰、訪問記録を最速で残し、商談履歴を取引先ごとに時系列で閲覧できる。

## スタック
- Next.js 16 App Router + TypeScript
- Tailwind CSS v4 + shadcn/ui
- Prisma v6 + PostgreSQL (Supabase 想定)
- `@react-google-maps/api` で Google Maps
- Gemini API（Phase 2 で音声文字起こし）

## セットアップ

```bash
# 1. 依存インストール（初回のみ）
npm install

# 2. 環境変数を設定
cp .env.example .env.local
# .env.local を編集:
# - DATABASE_URL: Supabase の connection string
# - NEXT_PUBLIC_GOOGLE_MAPS_CLIENT_KEY: Maps JS API キー
# - GOOGLE_MAPS_SERVER_KEY: Geocoding / Routes API キー

# 3. DB migration
npm run db:migrate

# 4. サンプルデータ投入（仙台の架空取引先10件）
npm run seed

# 5. 開発サーバ起動
npm run dev
# http://localhost:3000
```

## 利用可能なスクリプト

| コマンド | 用途 |
|---|---|
| `npm run dev` | 開発サーバ（Turbopack） |
| `npm run build` | プロダクションビルド |
| `npm run start` | プロダクション起動 |
| `npm run lint` | ESLint |
| `npm run seed` | demo-data/*.csv を DB に投入 |
| `npm run db:migrate` | Prisma migration 実行 |
| `npm run db:push` | schema を DB に反映（migration 履歴なし） |
| `npm run db:reset` | DB を完全リセット（データ消える） |
| `npm run db:generate` | Prisma Client 再生成 |

## ディレクトリ構成

```
sales-route-planner/
├── prisma/
│   ├── schema.prisma          # Prisma データモデル
│   └── seed.ts                # demo-data/*.csv からの投入スクリプト
├── demo-data/                 # サンプル CSV（仙台10取引先）
│   ├── accounts.csv
│   ├── users.csv
│   ├── visits.csv
│   ├── visit_notes.csv
│   ├── route_plans.csv
│   └── enums.csv
├── src/
│   ├── app/
│   │   ├── layout.tsx         # 共通レイアウト・ヘッダ・ユーザースイッチャー
│   │   ├── page.tsx           # Home Dashboard
│   │   ├── map/page.tsx       # 取引先マップ
│   │   ├── accounts/          # 取引先一覧・詳細
│   │   ├── visits/[id]/       # 訪問詳細・記録クイック
│   │   ├── route-plans/       # 今日のルート
│   │   ├── admin/             # マスタ管理 + CSV Import
│   │   └── api/               # Route Handler 群
│   ├── components/            # UI コンポーネント
│   └── lib/
│       ├── prisma.ts
│       ├── auth.ts            # デモCookie認証
│       ├── types.ts
│       └── api.ts
├── docs/                      # 設計書・UX brief・企画書 HTML
├── HANDOFF.md                 # プロジェクト引き継ぎ
└── .env.example
```

## クライアント別デモへの差し替え

```bash
# 1. demo-data/ の CSV をクライアント用データに差し替え
# 2. DB リセット
npm run db:reset
# 3. 再投入
npm run seed
```

または `/admin/import` 画面から UI で CSV を取り込み。

## デモ動線（90秒）

1. Home に「今日の訪問 2/5件」「停滞 1件（焼肉 大吉 162日未訪問）」バッジ
2. 取引先マップで**赤ピン1個**（acc-010 焼肉 大吉、A ランク＋60日超停滞）が目立つ
3. 赤ピンをタップ → 取引先詳細で「最終訪問 162日前」
4. 「✓ 訪問を開始」→ 現在地と時刻を記録 → 訪問記録クイック画面へ
5. 🎤 録音ボタンで音声メモ or テキスト入力
6. 「✓ 訪問を終了する」→ Home に戻り「今日の訪問 3/5件」に更新
7. 今日のルート（Deck View）で3件が時刻順に並ぶ

## 本番化

- Vercel に Deploy（クライアント別プロジェクトで隔離推奨）
- Supabase プロジェクトも別物を作成
- `AUTH_MODE=production` + NextAuth Google OAuth は Phase 3 実装予定

詳細: `docs/design/sales-route-planner-webapp.md`
