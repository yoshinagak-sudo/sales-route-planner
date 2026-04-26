# AppSheet デモ セットアップ手順書 Part 2

**前提**: `demo-setup-guide.md` の Step 1〜4（Sheets 取込み・テーブル登録・Column 型設定・認証）が完了していること。

このガイドでは、実際に画面を触れる状態にするための **Slice / Format Rule / Virtual Column / View / Action / Branding** の設定を行います。参照元: `docs/design/appsheet-ux-brief.md`。

想定所要時間: 30〜45 分

---

## Step 5: Slice を定義する（5 分）

Slice は「データの絞り込み条件を持つ仮想テーブル」。View の対象として使います。

AppSheet Editor 左メニュー「**Data → Slices**」→ 「**+ New Slice**」

以下5つを順に作成。

### 5-1. `myAccounts` — 自担当の取引先
- Source Table: **Account**
- Row filter condition:
  ```
  [owner_id] = LOOKUP(USEREMAIL(), "User", "email", "user_id")
  ```
- Slice Columns: All columns
- Update mode: Updates only

### 5-2. `myTodayVisits` — 今日・自分の訪問
- Source Table: **Visit**
- Row filter:
  ```
  AND(
    [owner_id] = LOOKUP(USEREMAIL(), "User", "email", "user_id"),
    DATE([scheduled_at]) = TODAY(),
    IN([status], LIST("PLANNED", "IN_PROGRESS", "COMPLETED"))
  )
  ```
- Sort: `[scheduled_at]` Ascending
- Update mode: Updates, Adds, and Deletes

### 5-3. `dormantAccounts` — 60日以上未訪問の A ランク
- Source Table: **Account**
- Row filter:
  ```
  AND(
    [owner_id] = LOOKUP(USEREMAIL(), "User", "email", "user_id"),
    [rank] = "A",
    OR(
      ISBLANK([last_visit_at]),
      [last_visit_at] < (TODAY() - 60)
    )
  )
  ```
- Sort: `[last_visit_at]` Ascending

### 5-4. `pendingNotes` — 自分の訪問で note が空の COMPLETED
- Source Table: **Visit**
- Row filter:
  ```
  AND(
    [owner_id] = LOOKUP(USEREMAIL(), "User", "email", "user_id"),
    [status] = "COMPLETED",
    COUNT(
      SELECT(VisitNote[note_id], AND(
        [visit_id] = [_THISROW].[visit_id],
        NOT(ISBLANK([body]))
      ))
    ) = 0
  )
  ```
- Sort: `[left_at]` Descending

### 5-5. `myRecentVisits` — 直近30日の自分の完了訪問
- Source Table: **Visit**
- Row filter:
  ```
  AND(
    [owner_id] = LOOKUP(USEREMAIL(), "User", "email", "user_id"),
    [status] = "COMPLETED",
    [left_at] >= (TODAY() - 30)
  )
  ```
- Sort: `[left_at]` Descending

---

## Step 6: Virtual Column を追加する（ピン色分けと表示用、7 分）

Part 1 で基本の Virtual Column は作成済み。ここでは **ピン色分け用と UI 表示用** を追加します。

### 6-1. Account テーブルに追加

Data → Columns → Account → 「**+ Add Virtual Column**」

| 列名 | Type | App Formula | 用途 |
|---|---|---|---|
| `pin_color` | Text | 下記 | Map View のピン色（Color Column として指定） |
| `days_since_last_visit` | Number | `IF(ISBLANK([last_visit_at]), 999, HOUR(NOW() - [last_visit_at]) / 24)` | 「○日前」表示・停滞判定 |
| `last_visit_label` | Text | `IF(ISBLANK([last_visit_at]), "未訪問", CONCATENATE(TEXT([days_since_last_visit]), "日前"))` | Detail 上部に表示 |
| `is_dormant` | Yes/No | `AND([rank] = "A", OR(ISBLANK([last_visit_at]), [last_visit_at] < (TODAY() - 60)))` | バッジ条件 |

**`pin_color` の式**:
```
IFS(
  AND([rank] = "A", OR(ISBLANK([last_visit_at]), [last_visit_at] < (TODAY() - 60))), "Red",
  AND([rank] = "A"), "Dark Green",
  AND([rank] = "B", [last_visit_at] < (TODAY() - 90)), "Orange",
  AND([rank] = "B"), "Green",
  [rank] = "C", "Gray",
  TRUE, "Gray"
)
```

### 6-2. Visit テーブルに追加

| 列名 | Type | App Formula | 用途 |
|---|---|---|---|
| `account_label` | Text | `[account_id].[name]` | Deck View の Primary 表示用 |
| `status_badge` | Text | `SWITCH([status], "PLANNED", "○未訪問", "IN_PROGRESS", "●訪問中", "COMPLETED", "●訪問済", "CANCELLED", "×中止", "NO_SHOW", "×不在", [status])` | 状態バッジ |
| `visit_title` | Text | `CONCATENATE([account_id].[name], " / ", TEXT([scheduled_at], "HH:MM"))` | Form View タイトル用 |

### 6-3. VisitNote テーブルに追加

| 列名 | Type | App Formula | 用途 |
|---|---|---|---|
| `body_preview` | Text | `IF(ISBLANK([body]), "(メモなし)", IF(LEN([body]) > 40, CONCATENATE(LEFT([body], 40), "…"), [body]))` | 履歴 Inline の短縮表示 |

### 6-4. User テーブルに追加（既に Part 1 で home_location 追加済）

追加不要。

---

## Step 7: Format Rules を設定する（色付けとバッジ、5 分）

左メニュー「**UX → Format Rules**」→ 「**+ New Format Rule**」

### 7-1. `fmt_rank_badge_a` — A ランクの緑色バッジ
- If this condition is true: `[rank] = "A"`
- Affected tables: Account
- Affected columns: `rank`
- Text color: White
- Background color: Green
- Icon: `star`

### 7-2. `fmt_rank_badge_b` — B ランクのアンバーバッジ
- Condition: `[rank] = "B"`
- Affected columns: `rank`
- Text color: White
- Background color: Orange

### 7-3. `fmt_rank_badge_c` — C ランクのグレー
- Condition: `[rank] = "C"`
- Affected columns: `rank`
- Text color: White
- Background color: Gray

### 7-4. `fmt_dormant_warning` — 停滞警告
- Condition: `[is_dormant] = TRUE`
- Affected tables: Account
- Affected columns: `last_visit_label`
- Text color: Red
- Icon: `alert-triangle`
- Bold: ON

### 7-5. `fmt_visit_status_completed` — 完了した訪問
- Condition: `[status] = "COMPLETED"`
- Affected tables: Visit
- Affected columns: `status_badge`
- Text color: Green
- Icon: `check-circle`

### 7-6. `fmt_visit_status_inprogress` — 訪問中
- Condition: `[status] = "IN_PROGRESS"`
- Affected columns: `status_badge`
- Text color: Blue
- Icon: `play-circle`
- Bold: ON

---

## Step 8: Action を作成する（8 分）

左メニュー「**Behavior → Actions**」→ 「**+ New Action**」

### 8-1. Action: `訪問を開始` — Account から Visit を新規生成

| 項目 | 値 |
|---|---|
| For a record of this table | **Account** |
| Do this | **Data: add a new row to another table using values from this row** |
| Table to add to | **Visit** |
| Set these columns |
| → `account_id` | `[account_id]` |
| → `owner_id` | `LOOKUP(USEREMAIL(), "User", "email", "user_id")` |
| → `status` | `"IN_PROGRESS"` |
| → `scheduled_at` | `NOW()` |
| → `arrived_at` | `NOW()` |
| → `arrived_lat` | `IFS(ISNOTBLANK(HERE()), NUMBER(INDEX(SPLIT(HERE(), ","), 1)))` |
| → `arrived_lng` | `IFS(ISNOTBLANK(HERE()), NUMBER(INDEX(SPLIT(HERE(), ","), 2)))` |
| → `created_at` | `NOW()` |
| Display name | `✓ 訪問を開始` |
| Prominence | **Display prominently** |
| Icon | `play-circle` |
| Only if this condition is true (Show_If) | `COUNT(SELECT(Visit[visit_id], AND([account_id] = [_THISROW].[account_id], [status] = "IN_PROGRESS"))) = 0` |
| Needs confirmation? | OFF |

### 8-2. Action: `訪問中 (メモ追加)` — Visit Record Quick へ遷移

| 項目 | 値 |
|---|---|
| For a record of this table | **Account** |
| Do this | **App: go to another view within this app** |
| Target | 下記 |
| Target expression | `LINKTOFORM("Visit Record Quick_Form", "visit_id", ANY(SELECT(Visit[visit_id], AND([account_id] = [_THISROW].[account_id], [status] = "IN_PROGRESS"))))` |
| Display name | `▶ 訪問中` |
| Prominence | **Display overlay** |
| Icon | `edit` |
| Show_If | `COUNT(SELECT(Visit[visit_id], AND([account_id] = [_THISROW].[account_id], [status] = "IN_PROGRESS"))) > 0` |

### 8-3. Action: `ナビ起動` — Google Maps へ

| 項目 | 値 |
|---|---|
| For a record of this table | **Account** |
| Do this | **External: go to a website** |
| Target | `CONCATENATE("https://www.google.com/maps/dir/?api=1&destination=", [geo_lat], ",", [geo_lng], "&travelmode=driving")` |
| Display name | `🧭 ナビ` |
| Prominence | **Display prominently** |
| Icon | `directions` |
| Show_If | `AND(NOT(ISBLANK([geo_lat])), NOT(ISBLANK([geo_lng])))` |

### 8-4. Action: `訪問を終了する` — Visit を COMPLETED に

| 項目 | 値 |
|---|---|
| For a record of this table | **Visit** |
| Do this | **Data: set the values of some columns in this row** |
| Set these columns |
| → `status` | `"COMPLETED"` |
| → `left_at` | `NOW()` |
| Display name | `✓ 訪問を終了する` |
| Prominence | **Display prominently** |
| Icon | `check-circle` |
| Show_If | `[status] = "IN_PROGRESS"` |
| Needs confirmation? | OFF |
| After action completes | Navigate to: `LINKTOVIEW("Home")` |

### 8-5. Action: `電話をかける`（Phone 型の自動生成で代替）

Account テーブルの `phone` 列は既に Phone 型に設定済。AppSheet はこれを自動的にタップ電話発信ボタンにします。Action の別定義不要。

---

## Step 9: View を作成する（15 分）

左メニュー「**UX → Views**」→ 「**+ New View**」

### 9-1. View: `Home` — ダッシュボード

**先に内包 View を3つ作ってから Dashboard に組み込む。**

#### 9-1-a. 子 View `_todayProgress`（Deck）
- View type: **Deck**
- For this data: `myTodayVisits`
- Position: **(hidden)** – Dashboard 内包用
- Sort by: `scheduled_at` Ascending
- Primary header: `account_label`
- Secondary header: `status_badge`
- Summary column: `TEXT([scheduled_at], "HH:MM")`
- Main image: なし

#### 9-1-b. 子 View `_dormantBadge`（Table）
- View type: **Table**
- For this data: `dormantAccounts`
- Position: (hidden)
- Columns: `name` / `last_visit_label`
- Show if: `COUNT(dormantAccounts[account_id]) > 0`

#### 9-1-c. 子 View `_pendingBadge`（Table）
- View type: **Table**
- For this data: `pendingNotes`
- Position: (hidden)
- Columns: `account_label` / `scheduled_at`
- Show if: `COUNT(pendingNotes[visit_id]) > 0`

#### 9-1-d. Dashboard 本体 `Home`
- View type: **Dashboard**
- Position: **First**（アプリ起動時のデフォルト View）
- View entries: 上記3つを縦積み（`_todayProgress` → `_dormantBadge` → `_pendingBadge`）
- Interactive mode: ON
- Display name: `ホーム`
- Icon: `home`

### 9-2. View: `取引先マップ` — Map View

- View type: **Map**
- For this data: **Account**（または myAccounts Slice）
- Position: **Menu**（上部メニューの2番目）
- Map type: **Road**
- Map color: `pin_color`（先ほど作った virtual column）
- Primary header: `name`
- Secondary header: `CONCATENATE([rank], " / 最終 ", IF(ISBLANK([last_visit_at]), "未訪問", TEXT([last_visit_at], "MM/DD")))`
- Summary column: `billing_address`
- Center latitude: `38.2682` (仙台駅)
- Center longitude: `140.8694`
- Display name: `取引先マップ`
- Icon: `map`

### 9-3. View: `取引先詳細` — Detail View（Account）

- View type: **Detail**
- For this data: **Account**
- Position: **Ref**（Map や一覧からのジャンプ先）
- Column order（上から）:
  1. `name` (xlarge, bold)
  2. `rank` + `last_visit_label`（2列で並べる）
  3. **Actions: 訪問を開始 / 訪問中 / ナビ起動**（Action bar として上部に出る）
  4. `billing_address`
  5. `phone`
  6. `main_contact_name` + `main_contact_role`
  7. `note`
- Inline Views:
  - **Visits inline**: Account の子 Visit を参照。Visits の Related view(Deck)で直近3件を表示
    - Settings: Sort `scheduled_at` Descending, Limit 3
- Display name: `取引先詳細`

### 9-4. View: `Visit Record Quick` — Form View（VisitNote 追加）

- View type: **Form**
- For this data: **VisitNote**
- Position: **Ref**（Action からしか開かれない）
- Column order（上から）:
  1. `visit_id`（Read-only、Hidden or Show_If=FALSE に）
  2. `kind`（Initial=TEXT_TYPED、Hidden にしてデフォルトで保存）
  3. `audio_url`（File 型、**最上部に大きく表示**、Label: `🎤 録音する`）
  4. `body`（LongText、Placeholder: `音声が使えない場合はここに打ち込んでOK`）
  5. `extracted_next_action`（Section 「次のアクション」、**Collapsible で閉じた状態**、Placeholder: `フォロー内容`）
  6. `extracted_next_action_date`（同セクション、Initial=`TODAY() + 7`）
- Form style: Sections - Collapsible
- Display name: `訪問メモ`
- Finish view: Home に戻る（After saving this form, go to → `LINKTOVIEW("Home")`）
- Auto-save: OFF（Save ボタン明示）

### 9-5. View: `今日のルート` — Deck View

- View type: **Deck**
- For this data: `myTodayVisits`
- Position: **Menu**（3番目）
- Sort: `scheduled_at` Ascending
- Primary header: `account_label`
- Secondary header: `CONCATENATE(TEXT([scheduled_at], "HH:MM"), " ", [status_badge])`
- Summary column: `purpose`
- Main image: なし
- Display name: `今日のルート`
- Icon: `map-pin`

### 9-6. View: `Visit Detail` — Detail View（Visit）

- View type: **Detail**
- For this data: **Visit**
- Position: **Ref**
- Column order:
  1. `visit_title`（header）
  2. `status_badge`
  3. **Action: 訪問を終了する**（Show_If で IN_PROGRESS 時のみ）
  4. `account_id`
  5. `purpose`
  6. `scheduled_at` / `arrived_at` / `left_at`
  7. `duration_min`
- Inline: `VisitNote` の related（Deck View, sort by created_at desc）
- Display name: `訪問詳細`

---

## Step 10: Branding を設定する（3 分）

左メニュー「**UX → Brand**」

| 項目 | 値 |
|---|---|
| **App name** | `営業訪問プランナー` |
| **Primary color** | `#2F6B3D`（深緑） |
| **Accent color** | `#E8A83A`（稲穂アンバー） |
| **Theme** | **Light**（日光下で見やすいため） |
| **Background image** | なし（白 or `#F7F6F1`） |
| **Header style** | Titles |
| **Launch image** | AppSheet 標準生成（Primary 色ベース）、後ほど visual-designer に差し替え依頼 |
| **App icon** | 標準ジェネレータで `営`（営業）1文字を Primary 背景に白文字。後日差し替え |

**Localization**: Data → Localize で 「Label for NEW action」などを日本語に調整（任意）

---

## Step 11: Save & Deploy（2 分）

1. AppSheet Editor 右上の **Save** をクリック（青いボタン）
2. 「Not Deployed」状態で十分（デモでは本番 Deploy 不要）
3. プレビュー（右側）で Home 画面を開いて挙動確認
4. Errors パネル（下部）に赤い警告が出ていないか確認。出ていたら式のスペルミス・大文字小文字を確認

---

## Step 12: スマホでデモシナリオを通す（5 分）

### 12-1. iPhone/iPad に AppSheet アプリをインストール
- App Store で `AppSheet` と検索 → インストール
- Google アカウントでサインイン（Editor と同じ）

### 12-2. アプリを開く
- 一覧に `営業訪問プランナー` が出る → タップ
- 初回同期 10〜30 秒
- Home 画面が出る

### 12-3. 位置情報・マイク・カメラの許可を事前に取る
デモで詰まらないように、事前に権限ダイアログを消化しておく:
1. 取引先マップを開く → 「現在地にアクセス」許可
2. 一度「訪問を開始」→「録音」を押して、マイク許可を与える
3. すぐに「訪問を終了」で戻す（ダミー Visit を削除するなら Editor 側で消す）

### 12-4. デモシナリオ（90秒）
1. **起動**: Home で「今日の訪問 2/5件」「停滞 1件（acc-010 焼肉 大吉）」が見える
2. **取引先マップ**: 10件のピン、acc-010（若林区荒町）が **赤ピン** で目立つ
3. **赤ピンをタップ** → acc-010 Detail: `最終訪問: 162日前`、ランクCだがデモ用に停滞を強調
4. **「✓ 訪問を開始」タップ** → 位置記録 + Visit Record Quick が開く
5. **🎤 録音** を10秒ほど押す → 停止
6. （任意で body に手書きでメモ）
7. **「✓ 訪問を終了する」タップ** → Home に戻る、件数が「3/5件」に更新
8. **今日のルート**: 今日の予定が3件見える（vis-006, vis-007, vis-008 のうち自分担当のもの）

合計 ~90 秒。ここが詰まらず流れれば「面白い」が伝わる。

### 12-5. 注意点
- `acc-010` は rank=A かつ 2025-11-14 以降未訪問（約162日前）。`pin_color` 式でランクA × 60日超 → **赤ピン**になり、`dormantAccounts` Slice にも入るので Home の「停滞」バッジも1件点灯する
- `acc-005` (ホテル松島ビュー) や `acc-009` (旅館 ゆのはま) は地図上の距離が離れているので、Map View のズームを確認（仙台駅 38.2682, 140.8694 を中心に置く）

---

## Step 13: デモ提示前チェックリスト

- [ ] Home で3バッジが意図通り表示される
- [ ] Account Map で10個のピンが出る、色分けされている
- [ ] Account Detail の上部に「訪問を開始」「ナビ」ボタンが大きく並ぶ
- [ ] 訪問を開始 → Visit Record Quick に自動遷移する
- [ ] Form 最上部に🎤録音ボタンが幅いっぱいで出る
- [ ] 「訪問を終了する」が画面下に緑で目立つ
- [ ] 終了後 Home に戻り、「今日の訪問」カウントが1増える
- [ ] 今日のルート Deck View で今日の3件が時刻順に並ぶ
- [ ] スマホで触って位置情報・マイク許可済
- [ ] デモシナリオ通し90秒で詰まらず流れる

---

## Phase 2 以降に残す実装

- ルート最適化（Apps Script + Google Routes API）
- 音声文字起こし（Gemini 2.0 Speech 連携 Bot）
- 次アクション自動抽出（Gemini 1.5 Pro）
- Slack 通知（訪問完了時・毎朝7:30 停滞アラート）
- オフライン同期の詳細調整
- 名刺 OCR
- Supabase PostgreSQL への本番データ切替え
- 訪問 KPI ダッシュボード
- Dev/Prod 2環境分離運用

---

## トラブルシューティング（Part 2 固有）

| 症状 | 対処 |
|---|---|
| ピンの色が全部同じ | Map View の Color Column 設定で `pin_color` を指定しているか確認。Virtual Column の型が **Text** になっているか |
| 「訪問を開始」ボタンが出ない | Show_If 式で IN_PROGRESS な Visit が既に存在していないか確認。Visit シートで該当行の status を PLANNED や COMPLETED に戻す |
| LINKTOFORM で Visit Record Quick に飛ばない | View 名の大文字小文字・スペースを厳密に確認。`"Visit Record Quick_Form"` ではなく実際に付けた View 名に合わせる |
| Slice の件数が 0 になる | User シートの email 列が自分のログインアカウントと一致しているか確認。LOOKUP が hit せず owner_id が NULL になっている可能性 |
| Deck View のバッジ色が出ない | Format Rule の「Affected columns」に `status_badge` を設定しているか確認 |
| AppSheet Editor で Save 時に赤いエラー | Errors パネルの「Expression errors」展開。多くはスペルミス（`visit_id` vs `id`）か括弧不整合 |

---

## 参考

- View/Action/Slice/Format Rule の UX 根拠: `docs/design/appsheet-ux-brief.md`
- 全体設計（Supabase 本番構成も含む）: `docs/design/sales-route-planner-appsheet.md`
- サンプルデータ詳細: `demo-data/README.md`
