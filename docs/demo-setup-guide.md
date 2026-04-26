# AppSheet デモ セットアップ手順書

想定所要時間: 15〜25 分（Google Workspace アカウント・AppSheet 初回ログイン済みの場合）

このガイドは、`demo-data/` 配下のサンプルデータを使って、AppSheet 上で「営業訪問ルートプランナー」のデモアプリを立ち上げる手順です。本番（Supabase 接続）は別途。

---

## 前提条件

- Google アカウント（Google Workspace 加入アカウントを**強く推奨**。個人 @gmail.com でも最小デモは動くが、Apps Script のクォータが低く将来拡張時に詰まる）
- ブラウザ（Chrome 推奨）
- スマートフォン（iOS または Android）※ App Store / Google Play から **AppSheet** アプリをインストール

---

## ステップ 1: Google Sheets にサンプルデータを取り込む（5 分）

### 1-1. スプレッドシート作成
1. https://sheets.google.com を開く
2. 左上「＋ 新規作成」→ 空白のスプレッドシート
3. 名前を `SalesRoutePlanner_Demo` に変更

### 1-2. シート6つを作成
スプレッドシートの左下「＋」を押して、以下の名前のシートを順に作成（シート名は半角英字、大文字小文字一致）:

- `Account`
- `User`
- `Visit`
- `VisitNote`
- `RoutePlan`
- `Enum`

初期の「シート1」は削除して構いません。

### 1-3. CSV をインポート
以下を6回繰り返します:

1. `Account` シートをクリック（アクティブにする）
2. メニュー「ファイル → インポート」
3. タブ「アップロード」→ `demo-data/accounts.csv` をドラッグ
4. 設定:
   - **インポート場所**: 「現在のシートを置換する」
   - **区切りの種類**: カンマ
   - **テキストを数値、日付、数式に変換する**: はい
5. 「データをインポート」

残りのシートにも同じ手順で:

| シート名 | インポートする CSV |
|---|---|
| Account | `demo-data/accounts.csv` |
| User | `demo-data/users.csv` |
| Visit | `demo-data/visits.csv` |
| VisitNote | `demo-data/visit_notes.csv` |
| RoutePlan | `demo-data/route_plans.csv` |
| Enum | `demo-data/enums.csv` |

### 1-4. 動作確認
- 各シートの1行目がヘッダー、2行目以降がデータになっていればOK
- 日時列（scheduled_at 等）が「2026-04-24 10:00:00」のような形式で表示されているか確認
- geo_lat / geo_lng が数値（文字列ではなく）として右寄せ表示になっているか

---

## ステップ 2: AppSheet でアプリを作成（5 分）

### 2-1. AppSheet にログイン
1. https://appsheet.com を開く
2. 右上「Sign In」→ 「Sign in with Google」→ 上記の Google アカウントで認証

### 2-2. Sheets からアプリ自動生成
1. AppSheet のトップページで「Create → App → Start with existing data」
2. データソース選択で「Google Sheets」
3. `SalesRoutePlanner_Demo` を選択
4. プライマリテーブルとして **Account** を選択
5. アプリ名を `Sales Route Planner Demo` に変更
6. 「Customize with AppSheet」クリック
7. AppSheet Editor（ブラウザ左にメニュー、右にプレビュー）が開く

### 2-3. 他のテーブルを追加
AppSheet は最初の1テーブルだけ自動登録されるので、残りを追加します。

左メニュー「**Data**」→「**Tables**」→ 右上「**+ New Table**」

以下を順に追加（全て同じ `SalesRoutePlanner_Demo` スプレッドシート内のシートを指定）:

- User
- Visit
- VisitNote
- RoutePlan
- Enum（オプション、ドロップダウン値管理用）

各テーブル追加時、「Are updates allowed?」は:
- Account / User: **Updates only**（読み中心）
- Visit / VisitNote / RoutePlan: **Updates, Adds, and Deletes**（全権限）
- Enum: **Read-Only**

---

## ステップ 3: Column（列）型を整える（10 分）

AppSheet の Editor 左メニュー「**Data → Columns**」で各テーブルのカラムを開き、以下のように型を設定します。

### 3-1. Account テーブル

| 列名 | Type | KEY | Label | 追加設定 |
|---|---|---|---|---|
| account_id | Text | ✅ | - | - |
| name | Text | - | ✅ | - |
| name_kana | Text | - | - | - |
| rank | Enum | - | - | Values: A, B, C / Base Type: Text |
| category | Text | - | - | - |
| billing_address | Address | - | - | - |
| geo_lat | Decimal | - | - | - |
| geo_lng | Decimal | - | - | - |
| phone | Phone | - | - | - |
| main_contact_name | Text | - | - | - |
| main_contact_role | Text | - | - | - |
| last_visit_at | DateTime | - | - | - |
| owner_id | **Ref** | - | - | Source Table: **User** |
| note | LongText | - | - | - |

**仮想列（Virtual column）を追加**:
- 右上「＋ Add Virtual Column」
- 列名: `geo`
- App Formula: `CONCATENATE([geo_lat], ",", [geo_lng])`
- Type: **LatLong**
- これで地図ピン描画ができるようになる

**仮想列を追加**: `visits_of_account`
- App Formula: `REF_ROWS("Visit", "account_id")`
- Type: **List** of **Ref (Visit)**
- Account Detail View で訪問履歴を inline 表示するために使う

### 3-2. User テーブル

| 列名 | Type | KEY | Label |
|---|---|---|---|
| user_id | Text | ✅ | - |
| name | Text | - | ✅ |
| email | Email | - | - |
| department | Text | - | - |
| home_lat | Decimal | - | - |
| home_lng | Decimal | - | - |
| home_label | Text | - | - |

**仮想列**: `home_location`
- App Formula: `CONCATENATE([home_lat], ",", [home_lng])`
- Type: **LatLong**

### 3-3. Visit テーブル

| 列名 | Type | KEY | Label | Initial Value |
|---|---|---|---|---|
| visit_id | Text | ✅ | - | `UNIQUEID()` |
| account_id | Ref (Account) | - | - | - |
| owner_id | Ref (User) | - | - | `LOOKUP(USEREMAIL(), "User", "email", "user_id")` |
| status | Enum | - | - | Values: PLANNED/IN_PROGRESS/COMPLETED/CANCELLED/NO_SHOW、Initial: `"PLANNED"` |
| purpose | Enum | - | - | Values: NEW_PROPOSAL/FOLLOW_UP/COMPLAINT_CARE/RELATIONSHIP/CONTRACT/DELIVERY/OTHER |
| scheduled_at | DateTime | - | - | `NOW()` |
| arrived_at | DateTime | - | - | - |
| left_at | DateTime | - | - | - |
| arrived_lat | Decimal | - | - | - |
| arrived_lng | Decimal | - | - | - |
| opportunity_id | Text | - | - | - |
| route_plan_id | Ref (RoutePlan) | - | - | - |
| created_at | DateTime | - | - | `NOW()` |

**仮想列**:
- `arrived_location` = `CONCATENATE([arrived_lat], ",", [arrived_lng])` / Type: LatLong
- `duration_min` = `IF(ISBLANK([left_at]) + ISBLANK([arrived_at]) > 0, "", HOUR([left_at] - [arrived_at]) * 60 + MINUTE([left_at] - [arrived_at]))` / Type: Number
- `account_label` = `[account_id].[name]` / Type: Text（一覧表示用）

### 3-4. VisitNote テーブル

| 列名 | Type | KEY | Label | Initial Value |
|---|---|---|---|---|
| note_id | Text | ✅ | - | `UNIQUEID()` |
| visit_id | Ref (Visit) | - | - | **Is a part of? = ON**（親子関係） |
| kind | Enum | - | - | Values: TEXT_TYPED/VOICE_RAW/VOICE_CLEANED/AI_SUMMARY、Initial: `"TEXT_TYPED"` |
| body | LongText | - | ✅ | - |
| audio_url | File | - | - | - |
| transcribed_at | DateTime | - | - | - |
| extracted_next_action | Text | - | - | - |
| extracted_next_action_date | Date | - | - | - |
| promoted_to_opportunity | Yes/No | - | - | `FALSE` |
| created_at | DateTime | - | - | `NOW()` |

### 3-5. RoutePlan テーブル

| 列名 | Type | KEY | Label |
|---|---|---|---|
| route_plan_id | Text | ✅ | - |
| owner_id | Ref (User) | - | - |
| plan_date | Date | - | ✅ |
| status | Enum | - | - |
| start_lat / start_lng | Decimal | - | - |
| start_label | Text | - | - |
| end_lat / end_lng | Decimal | - | - |
| end_label | Text | - | - |
| ordered_visit_ids | LongText | - | - |
| total_distance_m / total_duration_s | Number | - | - |

**仮想列**:
- `visits_in_plan` = `REF_ROWS("Visit", "route_plan_id")` / Type: List of Ref (Visit)
- `start_location` = `CONCATENATE([start_lat], ",", [start_lng])` / Type: LatLong

---

## ステップ 4: 認証と担当者割当て（2 分）

### 4-1. デモ用に USEREMAIL() を固定化
サンプルデータの `usr-01` の email は `yamada@demo.local`。これを自分の Google アカウントのメールに書き換えるとデモが自然になります。

1. Google Sheets の `User` シートを開く
2. `usr-01` の `email` 列をあなたのGoogleアカウントメールに変更
3. AppSheet Editor に戻り、左メニュー「**Data**」→ 右上「**Regenerate schema**」で反映

これで「ログインユーザー = 山田太郎」としてアプリが動作し、`Visit.owner_id` の初期値が自動で `usr-01` になります。

---

## ステップ 5: View・Action・Branding の設定

**（このセクションは ui-designer の UX brief を元に、続きのガイドに記載）**

ui-designer の `docs/design/appsheet-ux-brief.md` を参照しながら、以下を設定します:

- Home Dashboard View
- Account Map View
- Account Detail View + 訪問履歴 inline
- Visit Record Quick フォーム
- Today's Route Deck View
- Slice 定義（My Today's Visits / Dormant Accounts）
- Action 定義（訪問開始・訪問終了・ナビ起動）
- Branding（色・アイコン・アプリ名）

→ **続きは `demo-setup-guide-part2.md`**（ui-designer 結果統合後）

---

## ステップ 6: スマホで試す（2 分）

1. スマートフォンで **AppSheet** アプリを開く
2. 上記 Google アカウントでログイン
3. アプリ一覧に `Sales Route Planner Demo` が表示される → タップ
4. 初回同期で数秒〜30 秒かかる
5. Home 画面から Account Map / Today's Route などを確認

---

## トラブルシューティング

| 症状 | 原因と対処 |
|---|---|
| 地図にピンが出ない | Account の `geo` 仮想列が正しく LatLong 型になっていない。型を確認し、式を `CONCATENATE([geo_lat], ",", [geo_lng])` に修正 |
| 「訪問開始」ボタンを押しても位置が入らない | HERE() はモバイル AppSheet アプリでのみ動作（ブラウザでは不可）。スマホで試す |
| Ref 列の選択肢が表示されない | テーブルの Label 列が設定されていない。各テーブルで `name` や `plan_date` に Label=ON を設定 |
| Visit の owner が自動で入らない | User シートの email が自分のログインメールと一致していない。User シートで修正後、AppSheet を Regenerate schema |
| 同期が遅い | Server Caching を有効化（Data > Tables > 各テーブルの設定）。Sheets は行数が増えると重くなるので本番は Postgres へ移行 |

---

## デモで見送っている機能（Phase 2 以降）

- ルート最適化（Google Routes API + Apps Script）
- 音声文字起こし（Gemini Speech + Apps Script）
- 名刺 OCR（Gemini Vision / Document AI）
- Slack 通知 Bot
- オフライン時の詳細な同期制御
- Supabase PostgreSQL への切替え
- 停滞 Account 自動抽出の通知
