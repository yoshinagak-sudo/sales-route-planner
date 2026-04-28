# sales-route-planner - 引き継ぎ

最終更新: 2026-04-27

## 現在の状態
- **クライアント提案用デモアプリ。Next.js 16 + Tailwind v4 + shadcn/ui + Server Actions、mock データ完結（DB なし）**
- ✅ Phase 1 全機能実装済み（Home / 取引先マップ・一覧・詳細 / 訪問詳細・記録クイック / 今日のルート（地図ルート線つき） / 管理ダッシュボード）
- ✅ 概要書（OVERVIEW.md / OVERVIEW.pdf）GitHub Public 公開済み
- ✅ 訪問記録の AI 補完機能（メモ → 用件・次のアクション自動入力）。`src/lib/ai-stub.ts` のルールベース、Phase 2 で Gemini API 差し替え可
- ✅ 業種・地域は **産廃業者 / 久留米市拠点** に切替（建築・リフォーム・解体・工場・オフィスビル系の取引先10件）

## 直近の決定事項
- **アプリ名**: `営業管理アプリ`（layout / OVERVIEW / README 統一）
- **業態**: 産廃業者（久留米市）。営業先は建築/リフォーム/解体/工場/オフィスビル
- **AppSheet 不採用 → Web アプリ採用**: 画面自由度・人数による費用なし・スプレッドシート連携も後付け可能、を訴求点として概要書に明記
- **ランク (A/B/C) と停滞日数判定の表示は全 UI から削除**（混乱回避）。データ層 (types/mock-data/db) は維持して復活可能
- **音声入力なし**: フォーム入力＋ AI 補完で 1 分以内記録
- **概要書のスコープ**: 課題 / システムの全体像 / 概要画面 / 営業担当ができること / 管理者ができること の5要素のみ。技術構成・法令・コスト・触り方・デモURL注記は書かない
- **配布**: GitHub Public + raw URL で PDF 共有

## 次の一手
1. 産廃版での `npm run build` 通過確認
2. スクショ取り直し（久留米市の地図、産廃業界の取引先名・商談メモ）
3. OVERVIEW.pdf 再生成 → GitHub に push
4. クライアントへ概要書 URL 共有

## 未解決の課題・ハマりどころ
- **dev サーバが時々停止**（バックグラウンド起動だがセッション切替で落ちる）→ `pkill -f "next dev"` してから `npm run dev` 再起動
- **3001 が他プロジェクトと衝突**することあり → 3000 が空いていれば自動的に 3000 で起動。`SCREENSHOT_BASE_URL=http://localhost:3000 npm run overview:rebuild`
- **GitHub Web で md 編集すると PDF が古いまま**。完全自動化したいなら GitHub Actions で `npm run overview:pdf` を組み込む（未実装）
- **mock-data の今日の日付計算は実行時刻基準** → `daysAgo(n)` で経過日数が常に最新に追従

## 重要なコマンド・URL
```bash
cd /Users/butaifarm/Desktop/system-dev/sales-route-planner
npm run dev                                # http://localhost:3000
npm run build                              # ビルド確認
npm run overview:pdf                       # OVERVIEW.md → PDF
SCREENSHOT_BASE_URL=http://localhost:3000 npm run overview:rebuild
                                           # スクショ + PDF を一括再生成
git push origin main                       # 概要書を GitHub Public に反映
```

### 公開 URL
- 概要書 PDF: https://github.com/yoshinagak-sudo/sales-route-planner/raw/main/docs/OVERVIEW.pdf
- 概要書 Markdown: https://github.com/yoshinagak-sudo/sales-route-planner/blob/main/docs/OVERVIEW.md
- リポジトリ: https://github.com/yoshinagak-sudo/sales-route-planner

### 編集の流れ（軽微な文言修正）
1. `docs/OVERVIEW.md` を直接編集
2. `npm run overview:pdf`
3. `git add docs/ && git commit -m "..." && git push`
