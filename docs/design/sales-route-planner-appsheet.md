> **【却下】AppSheet 版は方針変更により捨てられました。**
> - 2026-04-24: 発注者が**他クライアントへのデモ用途**として再定義。「Next.js 単独 Web アプリ」に統一することが決定
> - AppSheet 版の**要件・ユースケース・失敗モード・Google Maps コスト試算・UX brief**は webapp 版でも有効
> - **最新の採用設計は** [`sales-route-planner-webapp.md`](./sales-route-planner-webapp.md) **を参照**
>
> 本設計書は参考資料として残します。特に以下は webapp 版の設計で再利用されています:
> - 機能スコープ F1-F6 / 非機能 N1-N5
> - Google Maps Platform のコスト試算と IP/リファラ制限方針
> - Apps Script 連携機能の一覧（ただし webapp 版では Next.js API Route で置換）
> - デモシナリオ 90 秒（[`appsheet-ux-brief.md`](./appsheet-ux-brief.md) §9 に記載、webapp 版でも踏襲）
>
> ---

# 営業訪問ルートプランナー 詳細設計（AppSheet 版）

最終更新: 2026-04-24
設計者: architect
前提: 発注者指示により **Google AppSheet ベース**で再設計。初期案（Next.js 自作版）は [`sales-route-planner.md`](./sales-route-planner.md) を参照（却下済）。

---

## 背景と目的

要件・ユースケースは初期案と共通（F1-F6 / N1-N5）。実装手段のみが以下の理由で AppSheet に変わった。

- **発注者指示**: 社内で AppSheet を標準ノーコード基盤として導入したい（既存 Next.js 資産とは別の系譜）
- **自作の相対化**: Phase 1 を 1 週間以内に出したい、発注者自身が後から式を触って育てたい
- **属人化排除**: Next.js 自作は保守者が限定される。AppSheet なら非エンジニア（営業事務）でも View 追加・項目編集が可能

AppSheet を採用することで発生する論点を一次ソース（AppSheet 公式 / Google Workspace 価格ページ / Apps Script クォータドキュメント）を確認した上で整理し、**既存 Supabase CRM との連携戦略を最優先で決める**。

---

（以下の本文は webapp 版への入力として参照されたため省略。必要な場合は git log から取得可能）

## webapp 版に引き継がれた主要成果物

- **Google Maps Platform コスト試算**: Maps JS $7 / Geocoding $2.55 / Routes $1 / Places $0.85 = 月 $11.40
- **AI コスト試算**: Gemini Speech / 1.5 Pro / Vision で月 $23〜26（音声500件×5分想定）
- **Apps Script 連携機能一覧**: Routes / Geocoding / 音声文字起こし / 次アクション抽出 / 名刺 OCR / Slack 通知 → webapp 版では全て Next.js API Route へ移植
- **失敗モード A1-A12**: AppSheet 固有のもの（A1 Sync 遅延、A4 GAS 6分制限、A8 Editor 事故）は webapp 版では不要になるが、**A2 Expression 複雑化 → コード複雑化として読み替え**、**A5 コネクタダウン → Supabase/Prisma 接続ダウンとして読み替え**が有効
- **Supabase テーブル定義**: snake_case の visit / visit_note / visit_attachment / route_plan / geo_cache → webapp 版の Prisma schema のベース

## webapp 版で捨てたもの（AppSheet 固有）

- AppSheet Core ライセンス（$10/人/月）
- Cloud Database コネクタ経由の接続（webapp 版は Prisma または supabase-js で直接アクセス）
- Apps Script Webhook 連携層（webapp 版は Next.js サーバー側 API Route で完結）
- View / Slice / Action / Bot の抽象化（webapp 版は React コンポーネント + Route Handler で具体化）
- Google Workspace 加入前提の UrlFetch / Trigger クォータ制約
