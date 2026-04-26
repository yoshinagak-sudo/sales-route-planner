# 営業訪問ルートプランナー AppSheet UX Brief（デモ最小版）

最終更新: 2026-04-24
作成: ui-designer
対象: AppSheet デモ配布版（Phase 1, 取引先10件サンプル）
前提設計: [`sales-route-planner-appsheet.md`](./sales-route-planner-appsheet.md)

---

## 0. UX 方針（全体を貫く3原則）

1. **"入力できないものは存在しない" を肝に銘じる** — デモが面白く感じる唯一の指標は「訪問の合間に3〜10秒で記録が残る」こと。Visit Record Quick の体験が全てで、他の画面はそこへ導線を引くためにある
2. **屋外の日光下で見える色と大きさ** — iPhone 画面を車内や路上で見る前提。低コントラストの水色・薄グレー文字は禁じ手、タップ領域は 48×48px を下限に
3. **AppSheet の"定型を素直に使う"** — カスタム CSS は使えない。View タイプ選びとフィールド並び順、Format Rule、Show_If、Action の Prominence、この4つでだけ勝負する

発注者からの"驚き"のピークは **Account Map でピンをタップ → Account Detail で最終訪問日が見える → "訪問開始"ボタンをタップ → Visit Record Quick が開く → 3秒で記録完了** の一連の流れ。ここが詰まった瞬間、デモは「よくある CRM」に格落ちする。

---

## 1. View 一覧（デモ最小版、優先度順）

デモでは **6画面**に絞る。Route Planner / Business Card Scan / Dormant / Me は Phase 2 以降。

### 1.1 Home（Dashboard View）★優先度1（入り口）

- **View 種別**: Dashboard（内包 View: 3つの Table/Deck を縦積み）
- **View 名**: `Home`
- **ルート**: アプリ起動時の初期 View（Primary navigation の 1 番目）
- **対象テーブル**: なし（内包 View が各 Slice を参照）
- **目立たせる操作**: 「地図を開く」「今日のルート」へのナビゲーション
- **要素構成（上から縦並び）**:

```
┌─────────────────────────────────┐
│ こんにちは、田中さん             │  ← Format Rule で USEREMAIL() 由来の名前
│ 2026-04-24 (木)                 │
├─────────────────────────────────┤
│ 今日の訪問  2 / 5 件            │  ← My Today's Visits の COUNT
│ ▓▓░░░ 40%                        │  ← 進捗バー（Progress 型は無いので Format Rule で色付きテキスト）
├─────────────────────────────────┤
│ 未記録の訪問    ●1 件            │  ← Pending Notes の COUNT、赤バッジ
│ 60日未訪問      ●3 社            │  ← Dormant Accounts の COUNT、amber バッジ
├─────────────────────────────────┤
│ [  地図で取引先を見る  ]         │  ← 大型 Action ボタン (Primary)
│ [  今日のルート        ]         │  ← 大型 Action ボタン (Secondary)
└─────────────────────────────────┘
```

- **実装メモ**: Dashboard View に内包する子 View は3つ
  - `today_progress_card` — My Today's Visits を Summary View で件数表示
  - `alert_badges` — Pending Notes / Dormant の件数を2行で表示（Table View + Show_If で 0 件時は非表示）
  - `primary_actions` — Deck View に Navigate Action を2個並べる or Detail View にカスタム Action 配置
- **空状態**: 3バッジがすべて 0 の場合は「今日は訪問予定なし。地図から取引先を選びましょう」のメッセージテキスト（Show_If で切替）

### 1.2 Account Map（Map View）★優先度2（最も"おっ"となる画面）

- **View 種別**: Map
- **View 名**: `取引先マップ`
- **対象テーブル**: `account` テーブル（Slice `My Accounts` で絞る）
- **Primary column**: `name`（会社名）
- **Secondary column**: `rank` + `last_visit_at` の結合表示（virtual column で `[rank] & " / 最終 " & TEXT([last_visit_at], "MM/DD")`）
- **Summary column**: `address`（番地まで）
- **目立たせる操作**:
  - ピンタップで Detail View へ遷移（標準挙動）
  - 画面右下の FAB で「現在地を中心に」リセンター
- **ピン表現**: 後述 §3 で詳述

### 1.3 Account Detail（Detail View）★優先度3（営業的に最重要の情報画面）

- **View 種別**: Detail
- **View 名**: `取引先詳細`
- **対象テーブル**: `account`
- **Header（Main image / 上部）**: 
  - 会社名（xlarge, bold）
  - サブヘッダー: ランクバッジ + 最終訪問からの経過日数（`[rank]` と `TODAY() - [last_visit_at]`）
- **Subheading**: 住所 + 電話（タップで発信）
- **目立たせる操作（Detail View 上部固定 Action 3つ）**:
  - **訪問を開始** — Primary、緑、大きめ
  - **ナビ起動** — Secondary、外部リンクアイコン
  - **電話** — Tertiary、標準の Phone 型フィールドで十分
- **Inline View で下に並べる**:
  1. 進行中の商談（opportunity_id の RELATED、status=OPEN だけを Slice）— 最大2件
  2. 直近の訪問履歴（related_visits の Deck View、新しい順、3件）
  3. 主要 Contact（related_contacts、2件まで）
- レイアウト構成は §3.2 で詳述

### 1.4 Visit Record Quick（Form View）★★★ 最重要画面

- **View 種別**: Form
- **View 名**: `訪問メモ`（タイトルは短く。AppSheet の View 名は画面上部に出る）
- **対象テーブル**: `visit_note`（※ visit 自体の status 更新は "訪問終了" Action で行うので、Form は note 追加専用）
- **起動導線**: 
  - Account Detail の「訪問を開始」Action → visit を IN_PROGRESS で生成 → 自動的にこの Form を開く
  - 既に進行中の Visit がある場合は Home の「訪問中」バナーからも
- **項目順・条件表示**: §2 で詳述
- **目立たせる操作**: 
  - 音声録音ボタンは Form 最上部、**画面幅いっぱいの大ボタン**
  - 画面下部固定に「訪問終了」ボタン（Inline Action、緑 Primary）

### 1.5 Today's Route（Deck View）★優先度5

- **View 種別**: Deck
- **View 名**: `今日のルート`
- **対象テーブル**: `visit` の Slice `My Today's Visits`
- **Sort**: `scheduled_at` 昇順（デモでは手入力順でも OK、ordered_visit_ids で並び替える場合は route_plan の virtual column 経由）
- **Primary column（上段, 大きめ）**: `account_id` の deref で会社名
- **Secondary column（中段）**: 訪問予定時刻 `TEXT([scheduled_at], "HH:MM")` + 状態バッジ（PLANNED / IN_PROGRESS / COMPLETED）
- **Summary column（右端小）**: 訪問目的 `purpose`
- **Main image**: なし（アイコン列で十分。画像は地図描画が重くなる原因）
- **Deck カードの表現**:

```
┌────────────────────────────────┐
│ ① 09:30  ●訪問済  高倉町      │  ← 番号 + 時刻 + 状態バッジ + 会社
│    新規提案 / 田中部長          │
├────────────────────────────────┤
│ ② 11:00  ●訪問中  服部         │
│    フォロー / 鈴木課長          │
├────────────────────────────────┤
│ ③ 13:30  ○未訪問  ワイズマート │
│    関係維持                     │
└────────────────────────────────┘
```

- **タップ挙動**: Visit Detail へ遷移
- **Inline Action**: 「ナビ起動」を各カード右端に小さく
- **空状態**: 「今日の訪問予定はありません」+ Account Map への導線

### 1.6 Visit Detail（Detail View）★補助

- **View 種別**: Detail
- **対象テーブル**: `visit`
- **Header**: 訪問先 + 訪問日時 + 状態
- **Inline**: 関連 visit_note（Deck, 新しい順）
- **Actions**: 「訪問終了」（IN_PROGRESS 時のみ表示）、「ナビ起動」
- **補足**: デモでは Form → Visit Record Quick 経由で note を追加する動線が主。この View は「あとから履歴を見る」用途

---

## 2. Visit Record Quick フォームの項目順（★最重要）

### 2.1 設計原則

- **3秒体験**: 音声ボタン押して録音したら画面を閉じてもよい（他の項目は空のまま保存可）
- **10秒体験**: 音声 + 訪問相手のチップを1つタップ + 用件を1つタップで完了
- **30秒体験**: 上記 + 次アクションを1行入力
- それ以上は「Detail 画面で後から追加」に退避させる。Form に詰め込まない

### 2.2 項目順（上から下、実機での縦並び）

```
┌─────────────────────────────────────┐
│ 高倉町 / 田中部長との訪問             │  ← View Title。account + contact(推測) を virtual column で
│ 訪問開始 09:32                        │  ← 自動記録済みの時刻を非編集で表示（Read_Only）
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ │    🎤  録音を開始               │ │  ← 画面幅100%, 高さ80px の大ボタン
│ │                                 │ │  ← Audio 型フィールド (body 直接ではなく audio_url 用)
│ └─────────────────────────────────┘ │
│                                     │
│ メモ (任意)                          │  ← LongText 型、プレースホルダ「音声でもOK」
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 会った人 (任意)                      │  ← met_contact_ids、Ref List Dropdown（Account の Contact に絞る）
│ [ 田中部長 ] [ 鈴木課長 ] [+ 追加 ]  │  ← Chip 表現は AppSheet では Checkbox List で近似
│                                     │
│ 用件 (任意)                          │  ← purpose、Enum List Dropdown
│ ○新規提案  ○フォロー  ○クレーム    │  ← AppSheet の Enum は Horizontal Buttons Format が選べる
│ ○関係維持  ○契約     ○納品        │
│                                     │
│ ─────────────────────────────────   │
│ ▼ 次のアクション (任意)  [展開]       │  ← Show_If で折りたたみ、デフォルト閉
│                                     │
│   内容: [ ____________________ ]     │  ← extracted_next_action (手入力版)
│   期限: [  2026-05-01       ▼]      │  ← extracted_next_action_date
├─────────────────────────────────────┤
│ [ 保存 (バックグラウンド)  ]          │  ← Form 標準の Save、サイレント保存
│                                     │
│ ┌─────────────────────────────────┐ │
│ │   ✓ 訪問を終了する               │ │  ← 画面下部固定、緑 Primary、大きめ
│ └─────────────────────────────────┘ │  ← 押すと visit.status=COMPLETED + left_at + 位置
└─────────────────────────────────────┘
```

### 2.3 必須・任意・条件表示の切り分け

| 項目 | 必須 | Show_If | 備考 |
|---|---|---|---|
| タイトル（account/contact 表示） | - | 常時 | virtual column で合成、編集不可 |
| 訪問開始時刻 | - | 常時 | Read_Only、Action で既に記録済み |
| 音声録音 | 任意 | 常時 | Audio 型フィールド。未録音でも保存可 |
| メモ (body) | 任意 | 常時 | LongText、プレースホルダで「音声でもOK」明示 |
| 会った人 | 任意 | 常時（候補が0件なら非表示） | Ref List、候補は `SELECT(contact[id], [account_id] = [_THISROW].[account_id])` |
| 用件 (purpose) | 任意 | 常時 | Enum、Horizontal Buttons、6択 |
| 次のアクション内容 | 任意 | ユーザーが「展開」を押した時だけ | Show_If: `[_show_next_action] = TRUE`（UIフラグ用の非永続列 or Detail ペアで制御） |
| 次のアクション期限 | 任意 | 上と同じ | Date 型、初期値 `TODAY() + 7` |

**デモでの現実**: Show_If で展開制御するより、Form View の Section 機能で「次のアクション」を別セクションに分けて、デフォルトで折りたたむ（Form Style の Section を Collapsible に）のが AppSheet の流儀として素直。

### 2.4 音声録音ボタンの目立たせ方

- **サイズ**: 画面幅100%、高さ80px（iPhone の 390px 幅で十分にタップしやすい）
- **色**: Primary 色のソリッド（緑）+ 白文字・白アイコン。Hover/Press 時の色変化は AppSheet 標準に任せる
- **テキスト**: 「🎤 録音を開始」— アイコン + 動詞で迷わせない
- **録音中の表現**: AppSheet の Audio 型は録音中にインターフェースが自動で切り替わる。タイマー表示と停止ボタンが出る
- **配置優先度**: Form 最上部。Save ボタンより上に来ることが重要（「録音だけして閉じる」動線を物理的に最短にする）
- **代替案**: 録音が無理な環境（電波が弱い・騒音）向けに、直下の「メモ」LongText 欄にプレースホルダで「音声が使えない場合はここに打ち込んでOK」と明示

### 2.5 「訪問終了」ボタンの位置

- **位置**: Form 画面の**最下部に固定**（Form の Save とは別に、Inline Action として配置）
- **色**: Primary 緑、白文字、大きめ（幅90%・高さ64px）
- **テキスト**: 「✓ 訪問を終了する」
- **挙動**: タップで Form を保存（note 追加）+ visit.status=COMPLETED + left_at=NOW() + 現在位置記録 + Home に戻る
- **確認ダイアログ**: なし（1タップで終わらせる）。AppSheet の Action で `Needs_confirmation = false`
- **Show_If**: `[visit].[status] = "IN_PROGRESS"` のときだけ表示。COMPLETED 後は「✓ 訪問終了済み」のラベルに切り替え

---

## 3. Account Map / Account Detail のピン・情報設計

### 3.1 ピンの色分け基準

**採用案: ランク × 最終訪問日の2軸合成**

| 条件 | ピン色 | 意味 |
|---|---|---|
| rank=A かつ last_visit_at < 60日 | 濃緑（Primary Deep） | 最重要・管理良好 |
| rank=A かつ last_visit_at >= 60日 | 赤（Danger） | 最重要・停滞中 → 真っ先に訪問すべき |
| rank=B かつ last_visit_at < 90日 | 緑（Primary） | 中堅・管理良好 |
| rank=B かつ last_visit_at >= 90日 | アンバー（Warn） | 中堅・停滞気味 |
| rank=C | グレー | 低優先 |
| last_visit_at が NULL（未訪問） | 白 + 濃緑ボーダー | 新規、訪問候補 |

**AppSheet 実装**: Map View の Color Column を virtual column で定義し、上の条件式を ifs() で書く。AppSheet のピン色は内蔵のパレットから選ぶ形なので、完全な色合わせはできない。以下のパレットマッピング推奨:

```
濃緑   → AppSheet "Dark Green" or "Green"
赤     → "Red"
緑     → "Green" (上と同じなら上を "Dark Green" に)
アンバー → "Orange" or "Yellow"
グレー → "Gray"
白系   → "White" or "Light Gray"
```

**補足**: ピン数が10件のデモでは "ランクで色"だけでも十分わかる。2軸合成は Phase 2 で本番データが増えてからでも良い。ただしデモで「停滞=赤で目立つ」を見せるとインパクトが強いので**2軸合成を推奨**。

### 3.2 Account Detail 上部に出す情報

営業が訪問先に着いて Detail を開いた瞬間、**0.5 秒で見たい情報の優先順**:

1. **会社名 + ランクバッジ**（xlarge, bold / rank は色付きピル）
2. **最終訪問からの経過日数**（「最終訪問: 45日前 (田中)」のフォーマット。virtual column で `TODAY() - [last_visit_at] & "日前 (" & [last_visit_owner] & ")"`）
3. **進行中の商談**（OPEN な opportunity が1件あれば太字で"[商談] 新米5t 提案中"）
4. **電話番号**（タップで発信）

それ以下（住所・担当者一覧・過去訪問履歴）は Inline View で下にぶら下げる。

**レイアウト構成（AppSheet Detail View の Field Layout）**:

```
┌──────────────────────────────────────┐
│ 高倉町珈琲                             │  ← name (xlarge)
│ ●A ランク  最終訪問: 45日前 (田中)    │  ← rank バッジ + virtual column
├──────────────────────────────────────┤
│ 📋 進行中の商談                         │
│  新米5t 提案中 / 期限 2026-05-10       │  ← Inline View: OPEN な opportunity
├──────────────────────────────────────┤
│ [ ✓ 訪問を開始 ] [ 🧭 ナビ ] [ 📞 ]   │  ← Primary Actions (3つ横並び)
├──────────────────────────────────────┤
│ 📍 仙台市青葉区一番町1-2-3              │
│ 📞 022-xxx-xxxx                        │
├──────────────────────────────────────┤
│ 🕘 訪問履歴                            │  ← Inline View: related_visits Deck
│ ├ 2026-03-10 田中 / 新規提案          │
│ ├ 2026-02-15 鈴木 / フォロー          │
│ └ 2025-12-20 田中 / クレーム対応       │
├──────────────────────────────────────┤
│ 👥 主な担当者                          │  ← Inline View: related_contacts
│ ├ 田中部長 (営業責任者)                │
│ └ 鈴木課長                             │
└──────────────────────────────────────┘
```

### 3.3 「訪問を開始」ボタンの配置

- **位置**: Detail View の**上部3分の1以内**（Primary Actions として、Header 直下）
- **サイズ**: 画面幅の60%、高さ56px、3ボタン横並びの中で最も大きく
- **色**: Primary 緑のソリッド、白文字
- **テキスト**: 「✓ 訪問を開始」
- **Prominence**: AppSheet の Action 設定で `Prominence = Display prominently`
- **挙動**: タップ即座に
  1. visit レコードを新規作成（status=IN_PROGRESS, arrived_at=NOW(), 位置=HERE()）
  2. Visit Record Quick Form に自動遷移
  3. 確認ダイアログなし（Needs_confirmation = false）
- **Show_If**: 現在 IN_PROGRESS な visit がこの account に**存在しない**ときだけ表示。既に訪問中なら「▶ 訪問中 (メモ追加)」に差し替えて Visit Record Quick へ遷移

### 3.4 訪問履歴 Inline の並び順とカード表現

- **並び順**: `scheduled_at` 降順（新しい順）
- **件数**: Detail 画面では 3件まで、それ以上は「もっと見る」で Visit List へ
- **各カード**:
  - Primary: `TEXT([scheduled_at], "YYYY-MM-DD")` + 訪問者（owner）
  - Secondary: 用件 (purpose) + note の最初の40文字（virtual column で truncate）
- **状態アイコン**: 左端に小さく ● (COMPLETED=緑) / ◌ (CANCELLED=グレー) / ▶ (IN_PROGRESS=青)

---

## 4. Slice 定義（AppSheet Expression そのまま）

デモで使う Slice の一覧と式:

```yaml
# Slice 名: My Accounts (自担当の取引先のみ)
# Source Table: account
Row filter: [owner_id] = LOOKUP(USEREMAIL(), "user", "email", "id")
# 注: email から user.id を引く LOOKUP。AppSheet のユーザーテーブル連携設計次第で
# [owner_email] = USEREMAIL() のような直接比較に変えられる場合はそちらを優先
```

```yaml
# Slice 名: My Today's Visits (今日・自分・PLANNEDまたはIN_PROGRESS)
# Source Table: visit
Row filter: AND(
  [owner_id] = LOOKUP(USEREMAIL(), "user", "email", "id"),
  DATE([scheduled_at]) = TODAY(),
  IN([status], LIST("PLANNED", "IN_PROGRESS", "COMPLETED"))
)
Sort: [scheduled_at] ASC
```

```yaml
# Slice 名: Dormant Accounts (60日以上未訪問の A ランク)
# Source Table: account
Row filter: AND(
  [owner_id] = LOOKUP(USEREMAIL(), "user", "email", "id"),
  [rank] = "A",
  OR(
    ISBLANK([last_visit_at]),
    [last_visit_at] < (TODAY() - 60)
  )
)
Sort: [last_visit_at] ASC
```

```yaml
# Slice 名: Pending Notes (自分の訪問で note が空 or transcribed_at が NULL)
# Source Table: visit
Row filter: AND(
  [owner_id] = LOOKUP(USEREMAIL(), "user", "email", "id"),
  [status] = "COMPLETED",
  COUNT(
    SELECT(visit_note[id], AND(
      [visit_id] = [_THISROW].[id],
      NOT(ISBLANK([body]))
    ))
  ) = 0
)
Sort: [left_at] DESC
```

```yaml
# Slice 名: My Recent Visits (自分の直近30日の COMPLETED)
# Source Table: visit
Row filter: AND(
  [owner_id] = LOOKUP(USEREMAIL(), "user", "email", "id"),
  [status] = "COMPLETED",
  [left_at] >= (TODAY() - 30)
)
Sort: [left_at] DESC
```

**デモで必須**: `My Accounts` / `My Today's Visits` / `Dormant Accounts` / `Pending Notes` の4つ。`My Recent Visits` は Account Detail の Inline View 用でも使えるので入れておく。

---

## 5. Action 一覧（デモで動かす最小）

| Action 名 | 対象 Table | 種別 | Display Name | Prominence | Icon | 位置・表示条件 |
|---|---|---|---|---|---|---|
| **訪問を開始** | account | Data: add a new row (visit) | ✓ 訪問を開始 | **Display prominently** | `play-circle` | Account Detail 上部、Show_If: 現在進行中の visit が無い |
| **訪問中 (メモ追加)** | account | Navigate to another view (Visit Record Quick) | ▶ 訪問中 | Display overlay | `edit` | Account Detail 上部、Show_If: 現在進行中の visit が有る |
| **ナビ起動** | account | External: Go to website | 🧭 ナビ | Display prominently | `directions` | Account Detail 上部、URL: `https://www.google.com/maps/dir/?api=1&destination=<<ENCODEURL([geo_lat & "," & geo_lng])>>` |
| **電話** | account | - | - | - | - | Phone 型フィールドで自動、Action 別定義不要 |
| **訪問を終了** | visit | Data: set the values of some columns | ✓ 訪問を終了する | **Display prominently** | `check-circle` | Visit Record Quick / Visit Detail 下部、Show_If: `[status] = "IN_PROGRESS"` |
| **音声録音開始** | visit_note | - | 🎤 録音を開始 | - | (Audio 型の内蔵 UI) | Form 最上部、Audio 型フィールドとして配置 |
| **Home に戻る** | any | Navigate (Home View) | ← | Display inline | - | 各 Detail の左上、AppSheet 標準の戻るで十分 |

**色・アイコンの実装**:
- AppSheet は Action に色を自由に付けられない（テーマの Primary / Accent に限定）。**Primary 色を1色に絞り、そこに"やらせたい主操作"を集中**させる
- アイコンは Font Awesome 互換。上記の `play-circle` / `check-circle` / `directions` / `edit` はすべて存在する
- Prominence の段階は 4 つ（prominently / inline / overlay / menu）。「訪問を開始」と「訪問を終了」だけ prominently、ナビは prominently、その他は inline に

### 5.1 ナビ起動の URL 組み立て

iOS/Android で同じ URL が通る Web 版 Google Maps URL を使うのが確実:

```
https://www.google.com/maps/dir/?api=1&destination=<<[geo_lat]>>,<<[geo_lng]>>&travelmode=driving
```

AppSheet の Go to website Action で上記テンプレートを設定。`<<...>>` は AppSheet の Expression 展開構文。

**注意**: `geo_lat` / `geo_lng` が NULL の Account はナビ起動不可。Show_If で `AND(NOT(ISBLANK([geo_lat])), NOT(ISBLANK([geo_lng])))` を付ける。NULL の場合は「住所を登録してください」のメッセージを出す代替 View へ遷移。

---

## 6. デザイントークン方針（AppSheet Branding）

### 6.1 カラー

AppSheet の Branding 設定で指定できるのは **Primary color / Accent color / App icon / Background image** の4つのみ。

| トークン | 推奨値 | 理由 |
|---|---|---|
| **Primary color** | `#2F6B3D`（深緑 / deep forest green） | 舞台ファームの農業ブランドと整合。**屋外の日光下で白文字のコントラストが取れる濃さ**。純粋な森林緑 `#228B22` よりやや青寄り・暗めにして SaaS 文脈に馴染ませる |
| **Accent color** | `#E8A83A`（稲穂アンバー） | 警告・停滞バッジに使う。完熟稲穂のニュアンスで農業ブランドと整合、かつ日光下でも赤系より目に刺さらない |
| **Danger color (Format Rule)** | `#C23B22`（赤） | 60日超停滞 Account や未記録アラート専用。使用箇所を3個以下に絞る |
| **Background** | 白 or `#F7F6F1`（わずかにオフホワイト） | 屋外で画面が反射しにくい、かつ業務臭を消す。純白は眩しい |

**色選定の根拠（屋外最適化の観点）**:
- iPhone の自動輝度で日光下は最大輝度になる。このとき**彩度高めの色は白飛び**する → 深緑 + 濃いオレンジが正解
- 水色・薄グレー・パステルは屋外で完全に読めない → 使用禁止
- コントラスト比 4.5:1（WCAG AA）を最低ライン、アクション系ボタンは 7:1（AAA）を目指す
- 深緑 `#2F6B3D` + 白は **コントラスト比 6.5:1** で AA 合格

### 6.2 App Icon

- **推奨**: 舞台ファームの既存ロゴから「稲穂アイコン + ピン（📍）」の合成を visual-designer に発注
- **デモでは**: AppSheet 標準アイコンジェネレータで `SP`（Sales Planner の頭字）+ Primary 色背景で間に合わせる
- **サイズ**: 1024×1024 PNG、透過不要（iOS のアプリアイコンとして扱われる）

### 6.3 タイポグラフィ

- AppSheet はフォントカスタム不可。iOS/Android のシステムフォント（San Francisco / Roboto）任せ
- Format Rule で各項目の太さ・サイズを調整。ただし**ヒエラルキーは3段階まで**に抑える:
  - Heading (xlarge, bold) — 会社名・View Title
  - Body (medium, regular) — 通常項目
  - Caption (small, muted) — 補足情報・日時

### 6.4 アイコン体系

- 用件 (purpose) の選択肢にアイコンを1つずつ設定:
  - 新規提案 → `flag`
  - フォロー → `refresh`
  - クレーム対応 → `alert-circle`
  - 関係維持 → `heart`
  - 契約 → `file-text`
  - 納品 → `truck`
- アクション系アイコンは §5 の表に記載

---

## 7. モバイル UX の注意点（iPhone/iPad 屋外前提）

### 7.1 タップ領域

- 最小 **48×48px**（Apple HIG）を下限、主要アクションは **64×64px 以上**
- Form の入力欄の高さは 56px を下限、文字入力中にキーボードが出ても Save/訪問終了ボタンが見える設計
- Deck View のカード高さは 80px 以上（1タップで誤爆しない）

### 7.2 コントラスト・可読性

- 文字と背景のコントラスト比 **4.5:1 以上**（AA）
- 日光下で特に重要な要素（訪問終了ボタン、ピン色分け、アラートバッジ）は **7:1 以上**（AAA）目指す
- フォントサイズは本文 **15pt 以上**（Apple の推奨 17pt を目安）、キャプション 12pt を下限
- 色だけで情報を伝えない（色覚多様性配慮） — ピンは色 + アイコン形状、バッジは色 + ラベルテキスト

### 7.3 音声ボタンの大きさ

- §2.4 の通り、**画面幅100% × 高さ80px** の大型ボタン
- マイクアイコン + 動詞ラベル（「録音を開始」）で一目で分かる
- 片手の親指で届く位置（画面下 1/3 ではなく、Form 最上部に置く。これは「録音だけして閉じる」の最短動線優先のため）

### 7.4 片手操作の配慮

- 主要アクション（訪問開始 / 訪問終了 / ナビ起動）は**画面下半分**に配置、親指が届く範囲
- 「訪問を開始」は Detail 画面の上部 1/3 に配置しているが、AppSheet の Detail View は**スクロールすると Actions が追従しない**ため、最上部で即タップしてもらう前提。ここは AppSheet の制約上、現実解
- iPad 横向きでは Form が中央 60% 幅に縮まるため、左右両側にタップ可能な余白ができる（AppSheet 標準で対応）

### 7.5 オフライン・低帯域

- デモではオフライン対応は Phase 2 送り（§8 参照）
- 3G 環境でのロード時間考慮：Map View の初回ロードは取引先10件なら 3 秒以内
- AppSheet の Sync 設定は「Sync on start = ON」のままで、Automatic updates は 15分ごと

### 7.6 画面回転・ダークモード

- **Portrait 固定推奨**。Landscape は Form が崩れやすい
- ダークモード対応は AppSheet のテーマ設定で自動追従するが、デモでは Light mode に統一（日光下で見やすいのは Light）

### 7.7 位置情報の UX

- 「訪問を開始」時に AppSheet が位置情報取得許可を求める → **デモ前に1度練習タップ**して許可状態にしておく
- 位置精度が悪い（>100m）場合は arrival_accuracy に記録、将来「ほんとにここで訪問？」アラートを出せる
- 地下・屋内で HERE() が失敗するケースは arrival_lat/lng = NULL でも保存可能にしておく（バリデーションで落とさない）

---

## 8. デモでは見送る項目（Phase 2 以降に回すもの）

以下はデモの価値に寄与しない、もしくは AppSheet ネイティブで実装できないため見送り:

### Phase 2 に回す
- **ルート最適化**（Apps Script + Routes API）— デモでは scheduled_at 順の手入力で十分
- **音声文字起こし**（Gemini Speech）— 音声"録音"までで止める。本物の文字起こしは Phase 2
- **次アクション自動抽出**（Gemini Pro）— 手入力欄だけ用意して、自動化は後
- **Slack / メール通知**（訪問完了時、停滞アラート朝7:30）
- **オフライン対応の詳細調整**（Sync 戦略、競合解決、画像送信キュー）

### Phase 3 に回す
- **名刺 OCR**（Document AI or Gemini Vision）
- **訪問 KPI ダッシュボード**（月間件数、カバレッジ率、滞在時間）
- **Route Planner View**（訪問先ピック、順序並び替え UI）
- **Business Card Scan View**
- **Dormant Accounts 専用 View**（デモでは Home の 1 バッジで代替）
- **Me / Settings View**（home_lat/lng 設定、同期状態確認）

### 将来 (Phase 4+)
- **ダークモード最適化**
- **iPad 横向きレイアウト調整**
- **Account の自動レコメンド**（訪問頻度・ランクから次の訪問候補）
- **Voice only モード**（画面を見ずにすべて音声で操作）

---

## 9. デモシナリオ（発注者への提示動線）

**提示時間**: 3分〜5分。この動線を守れば「面白い」が伝わる。

1. **起動**: Home 画面「今日の訪問 2/5件」「未記録 1件」が見える（10秒）
2. **地図を開く**: 取引先10件がピンで表示、1件だけ赤（60日停滞・Aランク）が目立つ（15秒）
3. **赤ピンをタップ**: Account Detail で「最終訪問: 78日前」「進行中の商談: 新米5t提案中」が見える（20秒）
4. **「✓ 訪問を開始」タップ**: 位置記録 → Visit Record Quick が開く（5秒）
5. **🎤 録音を開始タップ**: 10秒ほど喋って録音停止（15秒）
6. **会った人のチップ「田中部長」をタップ、用件「フォロー」をタップ**（5秒）
7. **「✓ 訪問を終了」タップ**: Home に戻り、「今日の訪問 3/5件」に更新されている（5秒）
8. **今日のルート**を開いて、完了した訪問に ● マークが付いているのを確認（10秒）

**合計 ~90秒**。ここまで詰まらず動けば、発注者は残りの Phase 2/3 機能（音声文字起こし、ルート最適化、OCR）を**追加投資の価値がある**と認識する。

---

## 10. 実装チェックリスト（AppSheet Editor 上での作業順）

1. [ ] Supabase に新規テーブル migration（architect 側で対応済み前提）
2. [ ] AppSheet アプリ新規作成、Cloud Database コネクタで Supabase 接続
3. [ ] Tables インポート: account / contact / opportunity / user / visit / visit_note
4. [ ] Slice 定義 (§4 の5つ)
5. [ ] View 作成 (§1 の6つ、Home → Account Map → Account Detail → Visit Record Quick → Today's Route → Visit Detail の順)
6. [ ] Actions 作成 (§5 の主要4つ: 訪問開始 / 訪問終了 / ナビ起動 / 訪問中メモ追加)
7. [ ] Format Rules: ピン色分け (§3.1)、ランクバッジ色、状態バッジ色
8. [ ] Branding 設定 (§6: Primary #2F6B3D / Accent #E8A83A / Icon 仮)
9. [ ] サンプルデータ10件の取引先（仙台エリア: 高倉町 / 服部 / ワイズマート含む）を CRM から選定・geocoding
10. [ ] 実機（iPhone）でデモシナリオ通し、詰まり箇所を記録
11. [ ] Primary テスター（営業1名）に1週間使ってもらう

---

## 付録 A: AppSheet 制約との折り合い早見表

| やりたいこと | AppSheet で可能か | 代替案 |
|---|---|---|
| カスタム CSS | × | Format Rule + テーマ設定で対応 |
| 独自アニメーション | × | 標準の画面遷移のみ |
| ピン色を自由に指定 | × | 内蔵パレット (赤緑青等) から選ぶ |
| Action ボタンを好きな色に | × | Primary / Accent の2色のみ |
| Map View で複数地点を線で結ぶ | × | Phase 2 で HTML View + Apps Script 経由 |
| Form の項目を2列横並び | ×（基本1列） | Section 分けで視覚的にグループ化 |
| 条件付き項目表示 | ○ | Show_If |
| 仮想列（計算列） | ○ | Virtual Column + Expression |
| 音声録音 UI | ○ | Audio 型フィールド、標準UI |
| 画像撮影 UI | ○ | Image 型フィールド、カメラ直起動 |
| 位置情報取得 | ○ | HERE() 関数、モバイル専用 |
| 外部 URL 起動 | ○ | Action: Go to website |

---

## 付録 B: 命名規約（AppSheet Editor 内）

- View 名: 日本語可、スペース可（画面タイトルとしてそのまま出るため）
- Slice 名: 英語、camelCase（`myTodayVisits` / `dormantAccounts`）
- Action 名: 日本語可（画面ボタン Label として出るため）
- Virtual Column 名: 英語、snake_case、接頭辞 `_` なし（AppSheet 側で自動処理）
- Format Rule 名: 英語、`fmt_` 接頭辞で識別（`fmt_pin_color` / `fmt_rank_badge`）

---

## 付録 C: 次のステップ（ui-designer → architect / 発注者）

- [ ] 発注者に本 brief を共有、優先画面の妥当性を確認
- [ ] Visit Record Quick の項目順（§2）について実際の営業1名に "3秒で記録できそうか" ヒアリング
- [ ] Branding の Primary 色（#2F6B3D）を発注者の舞台ファームブランド担当者と合意（visual-designer 連携推奨）
- [ ] サンプル取引先10件の選定（既存 CRM から発注者が選ぶ / 仙台エリアで地図上に散らばるように）
- [ ] AppSheet Editor 操作者（発注者自身 or 情シス）を確定、Phase 1 実装着手
