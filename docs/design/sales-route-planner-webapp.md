# 営業訪問ルートプランナー 詳細設計（Next.js Webアプリ・デモ版）

最終更新: 2026-04-24
設計者: architect
前提: 発注者方針再確定により **Next.js 単独 Web アプリ**に統一。用途は**他クライアントへのデモ**（舞台ファーム社内運用ではない）。
捨てたもの: AppSheet 路線（[`sales-route-planner-appsheet.md`](./sales-route-planner-appsheet.md) 却下）、CRM DB 共有前提（[`sales-route-planner.md`](./sales-route-planner.md) 却下）。

関連資料:
- UX brief（AppSheet 向けに書かれたが**Next.js にそのまま転用する**）: [`appsheet-ux-brief.md`](./appsheet-ux-brief.md)
- 企画書 HTML（画面モック6枚、実装仕様の基盤）: [`../proposal.html`](../proposal.html)
- サンプルデータ CSV: [`../../demo-data/*.csv`](../../demo-data/)

---

## 背景と目的

### 目的
**他クライアントに「営業訪問の地図可視化 + 訪問記録 + ルート最適化」をデモで見せる**ためのサンプルアプリ。外部依存なく、このアプリ単体で一連の体験が完結する。デモで刺さったクライアント向けに、**データを差し替えて本番導入**できる構造にしておく。

### スコープ
- **内部運用ではない**: 舞台ファームの営業現場に入れるのではなく、クライアントへの提案ツールとして使う
- **独立して動く**: 既存 CRM (`butaifarm-crm`) との DB 共有は行わない。本アプリ単独で Account/Contact/User マスタを持つ
- **将来の本番移行**: 気に入ったクライアントに渡せるよう、デモでの手抜きが本番で致命傷にならない構造にする（特に認証、DB 選定、シークレット管理）

### 営業規模の想定
- **デモ表示用**: 取引先10件、営業2名、訪問8件（サンプルデータの通り）
- **本番運用想定**: 営業5名、月500訪問（従来の見積もりを踏襲）

---

## 要件

### 機能要件（初期案を踏襲、F6 の PWA を Phase 2 送り）
- F1. 取引先を地図上にピン表示、ランク・最終訪問日で色分け
- F2. 当日の訪問リストを作成、ルート最適化（Phase 2）、Google Mapsナビへ受け渡し
- F3. 訪問記録（日時・相手・内容・次アクション）、写真・音声添付
- F4. 取引先ごとの訪問履歴・商談履歴を時系列閲覧
- F5. オフライン入力 → オンライン復帰で自動同期（Phase 2）
- F6. iPhone Safari から快適に使える（Phase 1 はモバイル Web、Phase 2 で PWA化）
- F7. **マスタ管理画面**（Account / Contact / User の CRUD、CSV インポート・エクスポート） ※本アプリ独自の追加要件

### 非機能要件
- N1. **デモ配布容易性**: git clone → `npm install` → `npm run seed` → `npm run dev` で 5 分以内に立ち上がる
- N2. Google Maps $200 無料枠内に収まる設計（本番運用見込みでも）
- N3. Vercel Hobby 無料枠で配信可能
- N4. **クライアント別データ差し替え**: CSV 差し替えだけでデモ内容を更新できる
- N5. セキュリティ: API キーはサーバー専用で漏らさない、最低限の認証 or デモ用簡易認証

### スコープ外
- X1. 既存 CRM との統合（本アプリは独立アプリ）
- X2. 本番運用向けの本格的な権限管理・監査ログ
- X3. 複数テナント分離（クライアント別デプロイで対応、アプリ内マルチテナント化はしない）

---

## 採用アーキテクチャ

### スタック全体

| レイヤ | 採用 | 理由 |
|---|---|---|
| フレームワーク | **Next.js 15 App Router + TypeScript** | Vercel 無料デプロイ、API Route と UI の統合、既存資産流用 |
| UI | **Tailwind CSS + shadcn/ui** | UX brief のトークン (深緑 `#2F6B3D` 等) を変数化しやすい |
| DB | **Supabase (Postgres) 採用 / SQLite 却下** | 次項で詳述 |
| ORM | **Prisma** | 初期案の schema を流用、migration 履歴管理 |
| 認証 | **NextAuth Google OAuth + デモ用スキップモード併設** | 次項で詳述 |
| マップ (クライアント) | Google Maps JavaScript API | ピン表示・ドラッグ操作 |
| マップ (サーバー) | Google Geocoding API / Routes API | キャッシュ + キー秘匿 |
| AI (音声・OCR) | **Gemini 2.0 Flash** (統一) | 音声文字起こし・OCR・要約をすべてこれで通す。Phase 2 以降 |
| ストレージ | **Supabase Storage** | Phase 2 で導入。Phase 1 はブラウザ MediaRecorder の Blob を IndexedDB ローカル保持のみ |
| デプロイ | **Vercel** | Hobby $0、本番 Pro $20 |

### DB 選定: SQLite (Prisma) vs Supabase (Postgres)

| 観点 | SQLite | Supabase Postgres |
|---|---|---|
| デモ立ち上げ | ◎ DB構築不要、ファイル1個 | △ Supabase アカウント作成が必要 |
| Vercel での運用 | × Vercel は読み書きを永続化しない（サーバーレスで揮発） | ◎ 無料枠で十分 |
| 本番移行容易性 | × SQLite → Postgres の移行が面倒 | ◎ 最初から Postgres |
| 複数クライアントへ配布 | ◎ 各 fork で DB 独立 | △ 各環境で Supabase プロジェクト用意 |
| 認証連携 | × 自前実装 | ◎ Supabase Auth も併用可 |
| Storage (画像・音声) | × なし、自前 or 他サービス | ◎ 無料枠あり |
| 型安全性 (Prisma) | ◎ 完全対応 | ◎ 完全対応 |
| 無料枠コスト | $0 | $0 (Free tier) |

#### 推奨: **Supabase Postgres + Prisma**

**理由**:
1. Vercel + SQLite は**本番で事実上動かない**（サーバーレスでファイル永続化されない、Turso 等の代替が必要で結局外部依存が増える）
2. デモで気に入ったクライアント向けに本番運用を始めるとき、DB 移行不要
3. Phase 2 以降の画像・音声ストレージを Supabase Storage で統一できる
4. 「Supabase プロジェクト作成」は 3 分で終わる作業、デモ立ち上げのボトルネックにはならない

#### SQLite を選びたくなる罠
- 「ローカルで完結する方がデモぽい」は誤認。Vercel にデプロイした瞬間に動かなくなる
- Turso や Cloudflare D1 で SQLite 互換を使う選択肢もあるが、**無料枠運用で 2 種類のベンダーを跨ぐ**デメリットが大きい
- ローカル完結デモにしたいなら、`npm run dev` をローカルだけで回す運用に限定。それなら SQLite でも成立するが、**クライアントにデモ URL を渡す運用ができない**

#### フォールバック: ローカル完結デモ版のためだけに SQLite モードをフラグで残す（オプション）
`DATABASE_PROVIDER=sqlite|postgres` の env で切り替え、Prisma の `provider` を差し替え。ただし**公式運用は Postgres のみ**、SQLite は「オフラインで見せたい出張デモ」用に保険として持つ程度にとどめる。初期実装の工数増を考えると**Phase 3 以降で検討**で十分。

### 認証: NextAuth Google OAuth vs デモ認証スキップ

| 観点 | NextAuth Google OAuth | デモ認証スキップ（ユーザー選択式） |
|---|---|---|
| デモ立ち上げ | △ OAuth 設定・リダイレクト URL 登録必要 | ◎ ドロップダウンで営業選ぶだけ |
| 本番運用移行 | ◎ そのまま使える | × 本番で別途実装必要 |
| クライアントへのデモ印象 | ◎ 「ちゃんとしてる」 | △ 「デモだから」で通る |
| 複数ユーザーの切替デモ | × 毎回ログアウトが必要 | ◎ ドロップダウン切替で即 |

#### 推奨: **両方実装、環境変数で切替**

```env
# .env.local
AUTH_MODE=demo     # または production
# demo:      画面上部のドロップダウンで User を選ぶ、パスワード不要
# production: NextAuth Google OAuth で本物のログイン
```

**理由**:
- **デモ時**: 複数ロール切替を秒で見せたい（「営業Aの画面 → 営業Bの画面」で Slice の違いを示す）。スキップモードの方が demoability 高い
- **本番**: Google OAuth で実ユーザー認証、User テーブルに email でひも付け
- **実装コスト**: NextAuth は Google Provider 追加するだけ。スキップモードはクエリパラメータ or Cookie で user_id を保持するだけ。両方合わせても半日工数

#### 実装方針
- 全 API Route に `getCurrentUser()` ヘルパーを通す
- ヘルパー内で `AUTH_MODE` を読み、demo なら Cookie `demo_user_id` を返し、production なら NextAuth セッションを返す
- クライアントは useUser() フックで同一 API を使う（モード差を意識しない）

### マップ API キー管理

初期案・AppSheet 版で共通の最重要ポイント: **キー流出でコスト爆発**。

- **クライアント用キー** (`NEXT_PUBLIC_GOOGLE_MAPS_CLIENT_KEY`)
  - Maps JavaScript API だけ許可
  - HTTP リファラ制限: `localhost:*`, `*.vercel.app`, 本番ドメイン
- **サーバー用キー** (`GOOGLE_MAPS_SERVER_KEY`, secretary 経由で Keychain 管理)
  - Geocoding API / Routes API のみ許可
  - Vercel の static IP または Serverless Function IP レンジを API 制限
  - Vercel では static IP が取れないので、**キーを複雑化 + 使用上限設定**で補完
- **GCP Billing Alert**: $10 / $50 / $100 / $200 の4段階で設定
- **コード側の防衛**: Geocoding を直接呼ぶ箇所を1つの関数 (`geocodeWithCache`) に集約、ESLint で `fetch('*maps.googleapis.com*')` の他箇所記述を禁止

### AI API キー管理

- **Gemini API キー** (`GEMINI_API_KEY`, secretary 経由で Keychain 管理)
  - 音声文字起こし / 次アクション抽出 / 名刺 OCR を**すべて Gemini 2.0 Flash に統一**（AppSheet 版では Document AI も検討したが、webapp 版では 1 ベンダーに絞って運用単純化）
  - Phase 1 では未使用、Phase 2 導入
- **代替**: OpenAI Whisper を選ぶ場合の env (`OPENAI_API_KEY`) も用意しておく。ただし**デフォルトは Gemini 一本**

---

## データモデル（Prisma schema）

初期案 Next.js 版の schema をベースに、**CRM 共有前提を外してアプリ内独自モデル**にする。snake_case の Supabase テーブル命名と合わせて Prisma 側で `@@map` 指定。

### Account / Contact / User は本アプリ独自

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// =====================
// ユーザー（営業担当者）
// =====================
model User {
  id          String   @id @default(cuid())
  email       String   @unique
  name        String
  department  String?

  // 営業の拠点（ルート起点に使う）
  homeLat     Float?
  homeLng     Float?
  homeLabel   String?

  accounts      Account[]   @relation("AccountOwner")
  visits        Visit[]     @relation("VisitOwner")
  routePlans    RoutePlan[] @relation("RoutePlanOwner")

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("user")
}

// =====================
// 取引先
// =====================
enum AccountRank {
  A
  B
  C
}

model Account {
  id                String       @id @default(cuid())
  name              String
  nameKana          String?
  rank              AccountRank  @default(B)
  category          String?      // 居酒屋 / 給食 / 宿泊 etc.

  // 住所・ジオコーディング
  billingAddress    String
  geoLat            Float?
  geoLng            Float?
  geoUpdatedAt      DateTime?

  phone             String?
  note              String?      // フリーテキスト

  // 集計（Visit 書き込み時に更新）
  lastVisitAt       DateTime?

  // 担当営業
  ownerId           String
  owner             User         @relation("AccountOwner", fields: [ownerId], references: [id])

  contacts          Contact[]
  visits            Visit[]
  opportunities     Opportunity[]

  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt

  @@index([ownerId])
  @@index([rank])
  @@index([lastVisitAt])
  @@map("account")
}

// =====================
// 連絡先
// =====================
model Contact {
  id          String   @id @default(cuid())
  accountId   String
  account     Account  @relation(fields: [accountId], references: [id], onDelete: Cascade)

  name        String
  nameKana    String?
  role        String?   // 部長 / 店長 etc.
  email       String?
  phone       String?
  isPrimary   Boolean  @default(false)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([accountId])
  @@map("contact")
}

// =====================
// 商談（デモ用の簡略版。本格運用時は拡張）
// =====================
enum OpportunityStatus {
  OPEN
  WON
  LOST
}

model Opportunity {
  id              String             @id @default(cuid())
  accountId       String
  account         Account            @relation(fields: [accountId], references: [id], onDelete: Cascade)

  title           String
  status          OpportunityStatus  @default(OPEN)
  amount          Decimal?
  dueDate         DateTime?
  nextAction      String?
  nextActionDate  DateTime?

  visits          Visit[]

  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt

  @@index([accountId, status])
  @@map("opportunity")
}

// =====================
// 訪問
// =====================
enum VisitStatus {
  PLANNED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  NO_SHOW
}

enum VisitPurpose {
  NEW_PROPOSAL
  FOLLOW_UP
  COMPLAINT_CARE
  RELATIONSHIP
  CONTRACT
  DELIVERY
  OTHER
}

model Visit {
  id              String        @id @default(cuid())
  accountId       String
  account         Account       @relation(fields: [accountId], references: [id])
  ownerId         String
  owner           User          @relation("VisitOwner", fields: [ownerId], references: [id])

  status          VisitStatus   @default(PLANNED)
  purpose         VisitPurpose?

  scheduledAt     DateTime
  arrivedAt       DateTime?
  leftAt          DateTime?
  durationMin     Int?

  arrivedLat      Float?
  arrivedLng      Float?
  arrivalAccuracy Float?

  coVisitorIds    String?       // JSON: [userId, ...]
  metContactIds   String?       // JSON: [contactId, ...]

  opportunityId   String?
  opportunity     Opportunity?  @relation(fields: [opportunityId], references: [id])
  routePlanId     String?
  routePlan       RoutePlan?    @relation(fields: [routePlanId], references: [id])

  notes           VisitNote[]
  attachments     VisitAttachment[]

  // オフライン同期用（Phase 2）
  clientUuid      String?       @unique
  syncedAt        DateTime?

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([accountId])
  @@index([ownerId, scheduledAt])
  @@index([status])
  @@index([routePlanId])
  @@map("visit")
}

// =====================
// 訪問ノート
// =====================
enum NoteKind {
  TEXT_TYPED
  VOICE_RAW
  VOICE_CLEANED
  AI_SUMMARY
}

model VisitNote {
  id                       String     @id @default(cuid())
  visitId                  String
  visit                    Visit      @relation(fields: [visitId], references: [id], onDelete: Cascade)

  kind                     NoteKind
  body                     String
  audioUrl                 String?
  transcribedAt            DateTime?

  extractedNextAction      String?
  extractedNextActionDate  DateTime?
  promotedToOpportunity    Boolean    @default(false)

  createdAt                DateTime   @default(now())
  updatedAt                DateTime   @updatedAt

  @@index([visitId])
  @@map("visit_note")
}

// =====================
// 訪問添付（写真・名刺）
// =====================
enum AttachmentKind {
  PHOTO
  BUSINESS_CARD
  WHITEBOARD
  DOCUMENT
}

model VisitAttachment {
  id                 String         @id @default(cuid())
  visitId            String
  visit              Visit          @relation(fields: [visitId], references: [id], onDelete: Cascade)

  kind               AttachmentKind
  url                String         // Supabase Storage URL
  thumbnailUrl       String?
  fileName           String?
  fileSize           Int?

  ocrText            String?
  extractedContact   Json?

  createdAt          DateTime       @default(now())

  @@index([visitId])
  @@map("visit_attachment")
}

// =====================
// ルート計画
// =====================
enum RoutePlanStatus {
  DRAFT
  OPTIMIZED
  IN_PROGRESS
  COMPLETED
  ABANDONED
}

model RoutePlan {
  id              String           @id @default(cuid())
  ownerId         String
  owner           User             @relation("RoutePlanOwner", fields: [ownerId], references: [id])

  planDate        DateTime
  status          RoutePlanStatus  @default(DRAFT)

  startLat        Float
  startLng        Float
  startLabel      String
  endLat          Float
  endLng          Float
  endLabel        String

  orderedVisitIds String?          // JSON: [visitId, ...]
  totalDistanceM  Int?
  totalDurationS  Int?
  optimizedAt     DateTime?
  optimizerInput  Json?

  visits          Visit[]

  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  @@index([ownerId, planDate])
  @@map("route_plan")
}

// =====================
// ジオキャッシュ（Geocoding コスト削減）
// =====================
model GeoCache {
  id                String    @id @default(cuid())
  addressHash       String    @unique
  rawAddress        String
  formattedAddress  String?

  lat               Float
  lng               Float
  placeId           String?
  accuracy          String?

  hitCount          Int       @default(1)
  lastUsedAt        DateTime  @default(now())

  accountIds        String?   // JSON: [accountId, ...]

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@index([addressHash])
  @@map("geo_cache")
}
```

### 初期案との差分（重要）

| 変更点 | 初期案 | webapp 版 |
|---|---|---|
| User/Account/Contact | 既存 CRM の既存モデルを参照 | 本アプリ独自テーブル |
| Opportunity | CRM の既存 Opportunity を参照 | 本アプリ独自（簡略版）|
| Account に `geoLat/Lng` 追加 | CRM 側のマイグレーション | 本アプリの schema に最初から含む |
| 認証 | CRM の User テーブル共有 | 本アプリの User テーブル + NextAuth or デモスキップ |

### Prisma migration コマンド

```bash
# 初回セットアップ
npx prisma migrate dev --name init

# スキーマ変更後
npx prisma migrate dev --name <変更内容>

# 本番 (Vercel deploy 時に自動実行)
npx prisma migrate deploy

# Seed 投入
npx prisma db seed
```

`package.json` に:
```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

---

## API 境界（Next.js App Router の Route Handler）

### 内部 API（画面 ↔ サーバー）

| メソッド | パス | 用途 | Phase |
|---|---|---|---|
| GET | `/api/accounts` | 取引先一覧（フィルタ: ownerId, rank, nearby） | 1 |
| GET | `/api/accounts/[id]` | 取引先詳細（+ 訪問履歴・商談・Contact）| 1 |
| POST | `/api/accounts` | 取引先作成 | 1 (マスタ管理) |
| PATCH | `/api/accounts/[id]` | 取引先更新 | 1 (マスタ管理) |
| DELETE | `/api/accounts/[id]` | 取引先削除 | 1 (マスタ管理) |
| GET | `/api/accounts/[id]/history` | 時系列履歴 | 1 |
| GET | `/api/contacts` / POST / PATCH / DELETE | 連絡先 CRUD | 1 |
| GET | `/api/users` / POST / PATCH / DELETE | ユーザー CRUD | 1 |
| POST | `/api/visits` | 訪問作成（clientUuid で冪等） | 1 |
| PATCH | `/api/visits/[id]` | 訪問開始・終了・更新 | 1 |
| GET | `/api/visits` | 訪問一覧（ownerId, date, status でフィルタ）| 1 |
| POST | `/api/visits/[id]/notes` | ノート追加 | 1 |
| POST | `/api/visits/[id]/attachments` | 写真・音声アップロード（署名URL 経由）| 2 |
| POST | `/api/visits/sync` | オフライン蓄積一括同期 | 2 |
| GET | `/api/route-plans/[date]` | 指定日のルート | 2 |
| POST | `/api/route-plans` | ルート計画作成 | 2 |
| POST | `/api/route-plans/[id]/optimize` | ルート最適化（Routes API 呼び出し）| 2 |
| POST | `/api/geocode` | 住所 → 座標（キャッシュ経由）| 1 |
| POST | `/api/transcribe` | 音声 → テキスト（Gemini）| 2 |
| POST | `/api/ocr/business-card` | 名刺 → 構造化データ | 3 |
| POST | `/api/import/csv` | マスタ CSV インポート | 1 |
| GET | `/api/export/csv?table=account` | マスタ CSV エクスポート | 1 |

### 外部 API 境界

| 用途 | API | クライアント or サーバー | 理由 |
|---|---|---|---|
| 地図描画 | Maps JavaScript API | クライアント | クライアントキー + リファラ制限 |
| 住所 → 座標 | Geocoding API | **サーバー経由 (`/api/geocode`)** | キャッシュ、キー秘匿 |
| ルート最適化 | Routes API | **サーバー経由** | 同上 |
| ナビ起動 | Google Maps URL | クライアント（intent） | `https://www.google.com/maps/dir/?api=1&destination=...` |
| 場所検索補助 | Places API Autocomplete | クライアント（セッショントークン） | Phase 3 以降 |
| 音声文字起こし | Gemini 2.0 Flash | **サーバー経由** | API キー秘匿 |
| 名刺 OCR | Gemini 2.0 Flash (Vision) | **サーバー経由** | 同上 |

### API Route の実装規約

- すべて `zod` で入力検証
- レスポンスは `{ data, error }` 形式（error は null でなければメッセージ）
- 認証チェックは `withAuth` ラッパーで共通化
- エラーログは Vercel Logs に出力、Supabase には書かない（Phase 1）

---

## 画面構成（7画面）

UX brief の 6 画面 + マスタ管理画面 1 の構成。AppSheet 向けの brief をそのまま Next.js 実装の仕様として使う。**AppSheet の View タイプ → React コンポーネント** への読み替え表を付けておく。

### 画面一覧

| ルート | 画面名 | AppSheet View 相当 | Phase |
|---|---|---|---|
| `/` | Home（今日の概要） | Dashboard | 1 |
| `/map` | 取引先マップ | Map View | 1 |
| `/accounts` | 取引先一覧 | Table + Search | 1 |
| `/accounts/[id]` | 取引先詳細 | Detail + Inline | 1 |
| `/visits/[id]` | 訪問詳細 | Detail | 1 |
| `/visits/[id]/record` | 訪問記録クイック | Form | 1 (★最重要) |
| `/route-plans/today` | 今日のルート | Deck | 2 |
| `/admin` | マスタ管理 (tabs: Account/Contact/User) | — (本アプリ追加) | 1 |
| `/admin/import` | CSV インポート | — | 1 |
| `/me` | 設定 | Detail (current user) | 2 |

### AppSheet View → React コンポーネントの読み替え

| AppSheet | Next.js 実装 |
|---|---|
| Dashboard View | `components/Dashboard.tsx` — 複数カードの縦並び |
| Map View | `components/AccountMap.tsx` — `@react-google-maps/api` の `<GoogleMap>` + マーカー |
| Detail View | サーバーコンポーネントで `getAccount(id)` → 子コンポーネントに渡す |
| Form View | Client Component + `react-hook-form` + `zod` |
| Deck View | `components/VisitDeck.tsx` — カード型リスト |
| Slice | Prisma クエリの `where` + `orderBy` |
| Action (Navigate) | `<Link>` or `router.push()` |
| Action (Data update) | onClick → fetch('/api/...') |
| Format Rule (色分け) | Tailwind の条件付き className |

### モバイル最適化

- Tailwind の `sm:` `md:` で画面幅分岐、**320〜430px (iPhone SE 〜 Pro Max) を第一優先**
- shadcn/ui の Sheet / Drawer を活用、モバイルで下からスライドするシート UI
- タップ領域 48×48px 下限、主要 CTA は 64×64px
- UX brief §6 のデザイントークン (Primary `#2F6B3D`, Accent `#E8A83A`) を Tailwind config に変数化

### PWA 化（Phase 2）

- `next-pwa` or Next.js 15 組み込みの manifest 機能
- Service Worker で `/api/accounts`, `/api/visits` の GET をキャッシュ
- オフライン書き込みは IndexedDB (Dexie.js) + Background Sync API
- Phase 1 では**PWA化せず、モバイル Safari で普通に動く Web アプリ**として配信

---

## マスタ管理画面

本アプリ独自の追加要件。**クライアント別のデータ差し替え**がデモ運用の要になるため、以下を必ず用意する。

### `/admin` — Account / Contact / User タブ

- **テーブル形式の一覧**（shadcn/ui の DataTable）
- **インライン編集 or モーダル編集**（ダブルクリックで編集モード）
- **削除は確認ダイアログ必須**（Cascade 削除の影響範囲を表示）
- **新規作成ボタン**: モーダルフォーム

### `/admin/import` — CSV インポート

- **対応テーブル**: Account / Contact / User
- **列マッピング UI**: CSV ヘッダ ↔ テーブルカラムを画面で対応付け
- **プレビュー**: 最初の 10 行を表示して確認
- **エラー行の扱い**: 形式不正を検出、エラーのある行だけスキップして残りを投入
- **冪等性**: `external_id` カラム (CSV 側) + `@unique` で冪等にする、なければ上書きせず追加

実装方針:
- `papaparse` で CSV パース
- `zod` でバリデーション、エラーメッセージを行ごとに表示
- サーバー側 `/api/import/csv` で `prisma.account.createMany({ skipDuplicates: true })`

### Google Sheets API 連携: **採用しない（Phase 3 検討）**

| 案 | メリット | デメリット |
|---|---|---|
| Sheets API 連携 | Sheets で編集→即反映、クライアントと共同編集しやすい | OAuth 設定が重い、同期方向の設計が必要、デモのために有料アカウント必須 |
| CSV インポート/エクスポート | 設定ゼロ、どの環境でも動く、差し替え手順が明確 | Sheets のリアルタイム編集には対応しない |

**判定**: CSV で十分。Sheets 連携はクライアントが特別に要求した場合のみ Phase 3 で追加検討。

### CSV エクスポート

- `/api/export/csv?table=account` で全件エクスポート
- `Content-Type: text/csv; charset=UTF-8` + BOM 付き（Excel 日本語対応）
- クライアントで`<a download>`でダウンロード

---

## コスト試算

### デモ段階（開発・クライアント提示）

| 項目 | 月額 | 備考 |
|---|---|---|
| Vercel Hobby | **$0** | Bandwidth 100GB/月無料 |
| Supabase Free | **$0** | 500MB DB + 1GB Storage + 50K MAU |
| Google Maps (少量利用) | **$0〜5** | $200 無料クレジット内 |
| Gemini (デモでは未使用) | **$0** | Phase 2 から |
| **合計** | **$0〜5/月** | |

**初期費用 $0 で立ち上げ可能**。クライアント提示段階では基本 $0 に収まる。

### 本番運用想定（営業5名、月500訪問）

| 項目 | 月額 | 備考 |
|---|---|---|
| Vercel Pro | **$20** | 複数プロジェクト、カスタムドメイン |
| Supabase Pro | **$25** | 8GB DB + 100GB Storage + 100K MAU |
| Google Maps Platform | **$11.4** | Maps JS + Geocoding + Routes + Places |
| Gemini 2.0 Flash | **$20〜25** | 音声文字起こし (500件×5分) + 抽出 + OCR |
| ドメイン (任意) | **$1〜2** | .com を年12-15ドル換算 |
| **合計** | **約 $81/月** | 年 $972 ≒ 12万円 |

### AppSheet 版との比較

| プラン | デモ段階 | 本番運用 |
|---|---|---|
| **Next.js webapp (採用)** | $0〜5 | **$81** |
| AppSheet + Supabase | $0 (Workspace 加入時) / $50 | $35〜90 |
| Next.js + CRM 共有 (初期案) | — (本運用前提) | $40〜60 (CRM のインフラ相乗り) |

AppSheet 版 (Workspace 加入時) の方がデモコストは安いが、**クライアントへの配布容易性・カスタマイズ自由度で webapp 版が勝る**。Workspace 加入を前提にしないクライアントにはそもそも AppSheet を渡せない問題もある。

### コスト境界の監視

- GCP Billing Alert: $10 / $50 / $100 / $200
- Supabase Usage ダッシュボードを週次で確認
- Gemini の呼び出し回数を `/api/transcribe` 内でログに残す（Phase 2）

---

## 失敗モード

### 初期案・AppSheet 版からの継承（webapp 版でも有効）

| # | 失敗 | 影響 | 対策 |
|---|---|---|---|
| 1 | Maps API キー流出 | コスト爆発 | 2種類のキー分離、リファラ/IP 制限、Billing Alert |
| 2 | Geocoding 毎回呼び出し | $500+/月 | `geocodeWithCache` 必須経路、ESLint 禁止 |
| 3 | GPS 精度悪く誤記録 | データ品質低下 | `arrivalAccuracy` 保存、>100m で確認 |
| 4 | 音声録音長時間 | ストレージ逼迫 | 5分で自動分割、文字起こし後に削除 |
| 5 | 商談記録が入力されない | 最大のリスク | 音声ボタン最優先 UI、3秒体験を維持 |
| 6 | Route Optimization API タイムアウト | ルート計画不能 | Fallback: 距離順ソート、手動並べ替え |
| 7 | 名刺 OCR の Contact 汚染 | マスタ汚染 | `extractedContact` は JSON で保存、承認後のみ Contact 化 |
| 8 | 個人位置情報プライバシー | 社内クレーム | 訪問時のみ取得、連続トラッキングしない |

### webapp 版固有の新規失敗モード

| # | 失敗 | 影響 | 検知 | 対策 |
|---|---|---|---|---|
| W1 | **デモ用認証スキップが本番で残る** | セキュリティ事故 | `AUTH_MODE=demo` が本番 env に入ってる | Vercel デプロイ時に `AUTH_MODE` を必須 env 化、`production` 以外の値で本番ドメインは起動失敗させる |
| W2 | **Prisma migration を本番で手動実行し忘れ** | 本番 500 エラー | `/api/health` で schema 差分検知 | Vercel Build Hook に `prisma migrate deploy` を組み込む、**feedback_prod_migration の学びを踏襲** |
| W3 | **Prisma schema の enum 変更で本番マイグレ失敗** | 本番デプロイ不能 | 本番 CI 失敗ログ | enum 追加は `ALTER TYPE ADD VALUE` で後方互換、削除は絶対にしない |
| W4 | **Supabase Free tier の 500MB DB 超過** | 書き込み停止 | Supabase ダッシュボードの使用量 | Attachment の画像リサイズ徹底、古い Visit アーカイブ戦略（Phase 3）|
| W5 | **Vercel Serverless Function のコールドスタート遅延** | 初回 3-5 秒待ち | レスポンス時間監視 | Edge Runtime 使える API Route は移行、重い処理は Background Function (Phase 3) |
| W6 | **PWA オフライン同期のコンフリクト（Phase 2 導入時）** | データ喪失 | syncedAt=null が残る | IndexedDB の書き込みは clientUuid で冪等、Last-Write-Wins で十分（営業が同じ Visit を同時編集する想定なし）|
| W7 | **CSV インポート時の文字化け (Shift_JIS)** | デモ失敗 | 取り込み後のプレビューで？？ 表示 | UTF-8 BOM 必須、ユーザーに Excel 保存時「CSV UTF-8」を明示 |
| W8 | **Google OAuth のリダイレクト URL 未登録** | 本番ログイン不能 | 初回ログインで 400 エラー | Vercel preview URL も含めて事前登録、`*.vercel.app` は使えないので環境ごとに追加必要 |
| W9 | **クライアント別デプロイで env が混ざる** | 他社データが他社に見える | デプロイ時の env 突合 | デプロイ前に `DATABASE_URL` の host を画面表示で確認させる fail-safe スクリプト |
| W10 | **デモユーザーが他社データで "本番運用" を始める** | データ汚染・ロスト | — | 画面上部に「DEMO DATA」の永続バナー表示、`AUTH_MODE=demo` 時のみ表示 |

---

## Phase 分け

### Phase 1: デモ最小版（3〜5 日想定）

**目的**: クライアントに「面白い」と感じさせる 90 秒動線を成立させる。

- [ ] Next.js 15 + TypeScript + Tailwind + shadcn/ui プロジェクト初期化
- [ ] Prisma schema 作成、Supabase プロジェクト作成、migration
- [ ] Seed スクリプト（CSV → DB、`demo-data/*.csv` から投入）
- [ ] 認証: デモスキップモード（画面上部の User ドロップダウン）
- [ ] Home 画面（今日の訪問 / 未記録 / 停滞カウント）
- [ ] 取引先マップ（Google Maps JS API + マーカー色分け）
- [ ] 取引先一覧（テーブル、検索・フィルタ）
- [ ] 取引先詳細（基本情報 + 訪問履歴 + 商談 + Contact）
- [ ] 訪問詳細
- [ ] 訪問記録クイック（音声は MediaRecorder で Blob 保存のみ、文字起こしなし）
- [ ] マスタ管理画面（Account/Contact/User の CRUD）
- [ ] CSV インポート / エクスポート
- [ ] Vercel デプロイ、Supabase 接続確認
- [ ] 90 秒デモシナリオの実機検証

### Phase 2: ルート最適化・音声文字起こし・PWA（1〜2 週間）

- [ ] 今日のルート画面
- [ ] `/api/route-plans/[id]/optimize` + Google Routes API 連携
- [ ] 音声文字起こし `/api/transcribe` + Gemini 2.0 Flash
- [ ] 次アクション抽出 + Opportunity への反映承認フロー
- [ ] Supabase Storage で音声・写真保存
- [ ] PWA 化 (`next-pwa` + manifest)
- [ ] Service Worker でオフラインキャッシュ
- [ ] Background Sync で IndexedDB → サーバー同期

### Phase 3: 名刺 OCR・チーム共有・KPI・高度機能（1〜2 週間）

- [ ] `/api/ocr/business-card` + Gemini Vision
- [ ] Contact 承認フロー（OCR 結果を確認してから Contact 作成）
- [ ] KPI ダッシュボード（月間訪問数、カバレッジ率、滞在時間平均）
- [ ] チーム共有（他営業の訪問を閲覧）
- [ ] NextAuth Google OAuth 本番認証モード
- [ ] 停滞 Account 自動アラート（60日未訪問）
- [ ] Sheets API 連携（要求あれば）
- [ ] SQLite モード（オフラインデモ専用）

---

## デモ運用シナリオ

### ローカル起動

```bash
# 初回
git clone <repo>
cd sales-route-planner
cp .env.example .env.local
# .env.local 編集: DATABASE_URL, NEXT_PUBLIC_GOOGLE_MAPS_CLIENT_KEY, GOOGLE_MAPS_SERVER_KEY
npm install
npx prisma migrate dev
npm run seed      # demo-data/*.csv から投入
npm run dev       # http://localhost:3000
```

### サンプルデータ seed

```bash
# prisma/seed.ts が以下を実行:
# 1. demo-data/users.csv → User テーブル
# 2. demo-data/accounts.csv → Account テーブル (geoLat/Lng も CSV 記載のまま)
# 3. demo-data/visits.csv → Visit テーブル
# 4. 既存データは truncate してから投入（冪等）
```

### クライアント別データ差し替え

**方針 A: CSV 差し替え（推奨）**
```bash
# クライアントごとのデータを clients/<name>/*.csv に置く
npm run seed -- --source=clients/acme-corp
```

- 営業・取引先・訪問の CSV をクライアントフォルダに差し替え
- `prisma/seed.ts` に `--source` 引数対応を入れる
- クライアント固有データは別リポジトリ or 別ディレクトリで git 管理しない（.gitignore）

**方針 B: 管理画面の CSV インポート**
- Vercel にデプロイ済みのデモ環境で `/admin/import` から CSV アップロード
- デプロイ変更なしでデータ入れ替え可能
- **複数クライアントに同一 URL を共有する場合は注意**（ログインで User を分けてもデータは共有される）

**判定**:
- デモ URL を **クライアント別にデプロイ**（acme.vercel.app, beta.vercel.app など）して各々で seed を変える → **方針 A**
- 1 つのデモ URL で複数クライアントに同じアプリを見せる → **方針 B**、ただし架空データ1セットのみ

**推奨**: クライアント別 Vercel プロジェクト + 方針 A。セキュリティ上も**クライアント間のデータ混在を物理的に防ぐ**べき。

### デプロイ手順

```bash
# Vercel CLI 経由
vercel --prod

# 環境変数は Vercel Dashboard で:
# - DATABASE_URL (Supabase connection string)
# - NEXT_PUBLIC_GOOGLE_MAPS_CLIENT_KEY
# - GOOGLE_MAPS_SERVER_KEY
# - AUTH_MODE=demo (or production)
# - NEXTAUTH_URL / NEXTAUTH_SECRET / GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET (production 時)
# - GEMINI_API_KEY (Phase 2 以降)
```

---

## 発注者（ユーザー）への逆質問

### ★★★ 今すぐ決めたい

- **Q1. 認証**: デモスキップモード (User ドロップダウン) と Google OAuth、**Phase 1 でどちらを使うか**
  - 推奨: **両方実装、env 切替**。デモはスキップモード、本番運用想定の見せたいクライアントには OAuth モードで配布
  - 「OAuth は面倒だからスキップモードだけで OK」なら Phase 3 送り

- **Q2. ターゲットクライアントの業種**: 舞台ファーム文脈の仙台サンプルデータ (居酒屋・給食・宿泊) のままデモするか、業種別に差し替えるか
  - 推奨: **Phase 1 は仙台データで固定**。クライアント提案時に業種差し替えが必要になったら Phase 2 で CSV 差し替え機構を使う

- **Q3. デモ URL の配布方式**: 1 URL 複数クライアント共有 / クライアント別 URL どちらを想定
  - 推奨: **クライアント別 URL**（Vercel プロジェクト分離）。seed 手順がシンプル、セキュリティも明確

- **Q4. Phase 1 の範囲は妥当か**: マスタ管理画面を Phase 1 に含めると 3日 → 5日に伸びる。不要ならカット可
  - 推奨: **含める**。デモ後の「データ差し替え要望」への対応速度が 10 倍変わる

### ★★ 近いうちに決めたい

- **Q5. Phase 1 の音声**: Blob 保存のみでデモするか、Phase 2 の文字起こしまで含めるか
  - Phase 2 含めると追加 5〜7 日、Gemini API キー取得必要
- **Q6. デザイン方針**: UX brief の深緑 `#2F6B3D` + アンバー `#E8A83A` をそのまま使うか、クライアントごとにカラー差し替えを想定するか
  - 推奨: Tailwind config を変数化、クライアント別に上書き可能にしておく
- **Q7. ドメイン**: `<project>.vercel.app` で OK か、カスタムドメイン (`sales-demo.example.com`) が必要か
  - カスタムドメインは Vercel Pro ($20/月) 必要

### ★ Phase 2 以降で確認

- Q8. チーム共有機能の優先度（営業同士で訪問履歴を見る）
- Q9. KPI ダッシュボードで可視化したい指標
- Q10. Sheets 連携の必要性（CSV で足りるかの最終判断）
- Q11. 多言語対応（英語クライアントへのデモ需要があるか）

---

## 未解決事項

- U1. Vercel Hobby の Bandwidth 100GB/月で**クライアント複数社に配布してもこぼれないか**の実測が必要（Maps 初回ロードが 2MB 程度なのでおそらく余裕だが）
- U2. Supabase Free tier の connection pooler 制限（同時 60 接続）が**複数クライアントの Vercel デプロイから叩いて詰まらないか**。Pro プラン移行タイミングの見極め
- U3. NextAuth v5 (Auth.js) と Next.js 15 App Router の統合サンプルが発展途上、**Phase 3 実装時の詰まりリスク**
- U4. Gemini 2.0 Flash の音声入力 API が 2026-04 時点で GA か preview かの再確認（researcher 案件）
- U5. Google Maps JavaScript API の**新 Advanced Markers**（旧 Marker 非推奨）への移行、deprecated 警告への対応タイミング
- U6. クライアント別デプロイ時の**シークレット取り違え防止の仕組み**（W9 対策の具体実装）

---

## 次のアクション（architect として）

1. 上記 ★★★ Q1〜Q4 をユーザーに返してもらう
2. Q の回答を受けて Phase 1 スコープを確定
3. secretary に以下のキー取得・Keychain 登録を依頼:
   - Google Maps Platform (クライアント用 / サーバー用の2本)
   - Supabase プロジェクト作成 + DATABASE_URL
   - (Phase 2) Gemini API キー
4. ui-designer に Phase 1 の画面実装の着手を依頼（UX brief の転用可能性・Tailwind Token 化）
5. researcher に U4 (Gemini 2.0 Flash 音声 GA 状況) を Phase 2 着手前に確認
6. Phase 1 のタスクリストを TODO DB に登録、Notion プロジェクトページに次の一手として反映

---

## 採用案の全体サマリ

- **フレームワーク**: Next.js 15 App Router + TypeScript
- **UI**: Tailwind + shadcn/ui（UX brief のトークン準拠）
- **DB**: **Supabase Postgres + Prisma**（SQLite は却下、理由は Vercel での永続性）
- **認証**: **NextAuth + デモスキップモード併設**、env 切替
- **マップ**: Google Maps JS API + Geocoding + Routes + Places
- **AI**: Gemini 2.0 Flash 統一（Phase 2 以降）
- **ストレージ**: Supabase Storage（Phase 2）
- **デプロイ**: Vercel（Hobby → Pro）
- **マスタ管理**: Account / Contact / User の CRUD + CSV インポート/エクスポート（Phase 1 に含める）
- **Phase**: 1 デモ最小版 (3〜5日) / 2 ルート・音声・PWA (1〜2週) / 3 OCR・KPI・高度機能 (1〜2週)
- **月額**: デモ段階 $0〜5、本番運用想定 $81
- **デモ配布**: クライアント別 Vercel プロジェクト + CSV seed 差し替え
