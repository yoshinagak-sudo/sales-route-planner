> **【旧案・却下（二段階目の却下）】この設計書は Next.js + Prisma + PostgreSQL + PWA の「CRM DB 共有」前提の初期案である。**
> - 2026-04-24 (1回目): 発注者指示で AppSheet 版に差し替え → [`sales-route-planner-appsheet.md`](./sales-route-planner-appsheet.md)
> - 2026-04-24 (2回目): AppSheet 版も却下。**他クライアントへのデモ用途**として Next.js 単独 Web アプリに方針再確定
> - **最新の採用設計は** [`sales-route-planner-webapp.md`](./sales-route-planner-webapp.md) **を参照**
>
> ただし、本設計書の**データモデル・API境界・ルート最適化戦略・コスト試算・失敗モードは大部分が webapp 版で再利用されている**。流用元として参照価値あり。CRM DB 共有を前提にしている箇所（認証連携、既存Account参照 等）は webapp 版では外されている点に注意。
>
> ---

# 営業訪問ルートプランナー 詳細設計

最終更新: 2026-04-24
設計者: architect

---

## 背景と目的

舞台ファームの営業が、取引先を訪問しながら商談記録を残す業務を支援するモバイルファーストのアプリを作る。以下の3つが同時に欲しい:

1. **取引先リストの地図可視化**: Google Maps 上で顧客ピンを見ながら「今日どこを回るか」を決める
2. **訪問ルート最適化**: 複数訪問先を回る日に、移動時間を最小化する順序を提案する
3. **商談記録のひもづけ**: 訪問中・直後に、その取引先の商談履歴を閲覧・追記する

この3つは世の中にある既存ツール（Salesforce Maps、GeoPro、cyzen 等）でも提供されているが、**月額数千円／ユーザーで営業5名だと年間30万円超**になり、かつ既存社内CRMとのデータ連携が別工数。自作する前提で設計する。

---

## 要件

### 機能要件
- F1. 取引先（Account）を地図上にピン表示。色・アイコンでランク・最終訪問日を識別
- F2. 当日の訪問予定リストを作成し、**最短ルート順序を提案**、Google Mapsナビへ受け渡し
- F3. 訪問先で商談内容（日時・相手・内容・次アクション）を記録。写真・音声添付可
- F4. 取引先ごとの訪問履歴・商談履歴を時系列で閲覧
- F5. 圏外でも入力でき、オンライン復帰時に自動同期
- F6. iPhone/iPad から快適に使える（PWAでホーム画面に追加可能）

### 非機能要件
- N1. 営業5名前後 × 日5〜15件訪問 = **月間約1000訪問記録**
- N2. Google Maps Platform 月額コスト **$200無料枠内**に抑える
- N3. 既存社内CRM (`butaifarm-crm`) の Account/Contact/Activity/Opportunity と**データを二重管理しない**
- N4. レイテンシ: 地図表示 2秒以内、訪問記録保存 1秒以内（オンライン時）
- N5. セキュリティ: 取引先情報・商談内容は社外秘、認証必須、HTTPS

（以下、本文は webapp 版へ流用済み。詳細は [`sales-route-planner-webapp.md`](./sales-route-planner-webapp.md) を参照してください。オリジナルの詳細本文は git log から取得可能）

---

## この設計書が webapp 版へ受け継がせたもの

- データモデル (Visit / VisitNote / VisitAttachment / RoutePlan / GeoCache) — webapp 版でアプリ内独自テーブルとして流用
- API 境界の切り方（クライアント ↔ サーバー ↔ 外部API）
- Google Maps Platform の使い方とコスト試算
- ルート最適化の3案比較（Routes API / 自前TSP / クラスタリング）
- 失敗モード（Maps コスト爆発 / オフライン同期 / GPS 精度 / 名刺OCR汚染）

## この設計書で webapp 版では捨てたもの

- 既存 CRM DB 共有前提（認証サブドメイン共有、既存 Account 参照）
- オフライン Background Sync の詳細設計（webapp 版では Phase 2 送り）
- 本運用5名想定のフル機能スコープ（webapp 版ではデモ最小版 → Phase 分割）
