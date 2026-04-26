# sales-route-planner - 引き継ぎ

最終更新: 2026-04-25

## 現在の状態
- **方針: 他クライアント向けのデモ提案アプリ。実 DB なし、mock データで完結**
- **Next.js 16 + Tailwind v4 + shadcn/ui + Server Actions** で実装中
- ✅ 土台と Home / Map はビルド成功、画面が表示できる状態
- ⏳ ui-designer がバックグラウンドで残り 6 画面実装中（accounts 一覧・詳細 / visits 詳細・記録 / today ルート / admin）
- ❌ 永続化なし（再起動でデータ初期化）。本番化したい時は Phase 2 で DB 接続を復活させる

## 直近の決定事項
- **Prisma / Supabase / API Route は除去**（switch-user 1 本だけ残置）
- **データソース**: `src/lib/mock-data.ts`（仙台10取引先・営業2名・訪問8件・ノート5件・ルート1件、実行時刻基準で相対日付生成 → acc-010 が常に 162 日前で停滞バッジ点灯）
- **データ取得**: Server Component から `src/lib/db.ts` のヘルパー関数を直呼び
- **データ更新**: `"use server"` の Server Action（`src/lib/actions.ts`）。`startVisitAtAccountAction / startVisitAction / finishVisitAction / addNoteAction`
- **認証**: cookie の `demo_user_id` または fallback で `usr-01`（山田太郎）
- **Google Maps API キー未設定でも動く**: `AccountMap` がフォールバックリスト UI を出す
- **Prisma v7 は破壊的変更で v6 に固定 → さらに撤去**（DB が必要になったら戻す）
- **デザイン**: Primary `#2F6B3D` / Accent `#E8A83A` を Tailwind v4 `@theme` で定義済み（既存）

## 次の一手
1. ui-designer 完了を待つ（残り 6 画面 + 既存 VisitActionButtons/VoiceRecorder の Server Action 化）
2. `npm run build` 通過確認
3. `npm run dev` → http://localhost:3000 でデモ動線（90秒シナリオ）通し確認
4. ユーザー提示・調整
5. 必要なら Vercel に1クリックデプロイ（DB 不要なので Hobby で動く）
6. Phase 2 で DB 復活を希望する場合: `src/lib/prisma.ts` 再生成 + API Route 戻し + `src/lib/db.ts` ヘルパーを Prisma 経由に切替

## 未解決の課題・ハマりどころ
- **永続化なし**: サーバー再起動 / Hot Reload でデータ初期化される。デモには十分だが、複数日のクライアント提示で同じ状態を保ちたい場合は要対策
- **Google Maps APIキー無し**: `/map` はフォールバックリスト UI で動く。実マップを見せたい時は `.env.local` に `NEXT_PUBLIC_GOOGLE_MAPS_CLIENT_KEY` を設定（GCP コンソールで発行手順は secretary 提示済）
- **Vercel multiple lockfiles 警告**: `/Users/butaifarm/package-lock.json` と本プロジェクトの両方が検出されている。気になれば `next.config.ts` で `turbopack.root` 設定
- Prisma init で生成された `prisma.config.ts` を削除済み（Prisma v7 用、v6 では不要）

## 重要なコマンド・URL
```bash
cd /Users/butaifarm/Desktop/system-dev/sales-route-planner

# 開発
npm run dev       # http://localhost:3000

# ビルド
npm run build

# クライアント別データ差し替え
# src/lib/mock-data.ts を直接編集（or 別ファイルにして import 切替）
```

### 主要ファイル
- データ: `src/lib/mock-data.ts`
- 取得: `src/lib/db.ts`
- 更新: `src/lib/actions.ts`
- 型: `src/lib/types.ts`
- 認証: `src/lib/auth.ts`
- フォーマッタ: `src/lib/format.ts`

### 設計書
- 採用版: `docs/design/sales-route-planner-webapp.md`
- 却下版: `docs/design/sales-route-planner.md`（CRM共有案）/ `docs/design/sales-route-planner-appsheet.md`（AppSheet案）
- UX brief: `docs/design/appsheet-ux-brief.md`
- 企画書 HTML（提案先共有用）: `docs/proposal.html`
- AppSheet デモ手順書: `docs/demo-setup-guide.md` / `docs/demo-setup-guide-part2.md`（過去案、参考用）

## デモシナリオ（90秒）
1. Home: 「停滞 1社」赤バッジ点灯
2. 取引先マップ: 焼肉 大吉（acc-010）が赤ピン or fallback で目立つ
3. acc-010 タップ → 詳細「162日前」赤強調
4. 「✓ 訪問を開始」→ Visit Record クイックフォーム
5. メモ入力 + 「✓ 訪問を終了する」→ Home に戻り件数更新
6. 今日のルート Deck で時刻順に並ぶ
