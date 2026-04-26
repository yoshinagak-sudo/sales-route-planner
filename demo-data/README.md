# Demo Data

AppSheet デモ用のサンプルデータ（Google Sheets インポート用 CSV）。

## ファイル一覧

| ファイル | レコード数 | AppSheet 上の Table 名 | 用途 |
|---|---|---|---|
| `accounts.csv` | 10 | Account | 仙台エリアの架空取引先（居酒屋・給食・宿泊・小売等） |
| `users.csv` | 2 | User | 営業ユーザー（山田太郎・鈴木花子） |
| `visits.csv` | 8 | Visit | 過去訪問5件 + 今日の予定3件 |
| `visit_notes.csv` | 5 | VisitNote | 過去訪問の商談メモ |
| `route_plans.csv` | 1 | RoutePlan | 今日のルート計画（山田太郎の2件訪問） |
| `enums.csv` | 25 | Enum | ステータス・目的・ランク等のドロップダウン値 |

## Google Sheets への取込み方

### 方法 A: Google Sheets に1ブックで取り込む（推奨）
1. https://sheets.google.com で新規スプレッドシート作成、名前: `SalesRoutePlanner_Demo`
2. 左下の「+」でシートを追加し、上記テーブル名と同名のシートを6つ作成（Account / User / Visit / VisitNote / RoutePlan / Enum）
3. 各シートで「ファイル → インポート → アップロード」から対応する CSV を選択
4. 「インポート場所: 現在のシートを置換する」「区切り文字: カンマ」「テキストを数値・日付・数式に変換: はい」

### 方法 B: CSV ごとに個別の Sheets として取り込む
- 各 CSV を Google Drive に直接アップロード → 右クリック「Google スプレッドシートで開く」
- この場合、AppSheet からは複数の Sheets を**別々のデータソース**として登録する

## 取引先の配置（仙台エリア）

| # | 名称 | エリア | ランク | 担当 |
|---|---|---|---|---|
| acc-001 | 居酒屋 とまり木 | 青葉区国分町 | A | 山田 |
| acc-002 | 和食 瑞鳳 | 青葉区一番町 | A | 山田 |
| acc-003 | ビストロ ソレイユ | 青葉区木町通 | B | 山田 |
| acc-004 | 宮城野給食センター | 宮城野区鶴ケ谷 | A | 鈴木 |
| acc-005 | ホテル松島ビュー | 松島町 | A | 山田 |
| acc-006 | スーパーフレッシュ泉店 | 泉区泉中央 | B | 鈴木 |
| acc-007 | 道の駅 村田 | 村田町 | C | 鈴木 |
| acc-008 | パン工房 麦の香 | 太白区長町 | B | 山田 |
| acc-009 | 旅館 ゆのはま | 秋保温泉 | A | 鈴木 |
| acc-010 | 焼肉 大吉 | 若林区荒町 | A | 山田（※162日未訪問・停滞 Account、デモの赤ピン候補） |

## 列型マッピング（AppSheet の Column Type 設定）

取込み後、AppSheet の Data > Columns で以下を設定してください。

### Account テーブル
| 列名 | AppSheet Type | Key / ReadOnly | Initial Value / 備考 |
|---|---|---|---|
| account_id | Text | KEY | - |
| name | Text | - | Label = TRUE（Ref 表示の主表示） |
| name_kana | Text | - | 検索対象 |
| rank | Enum | - | Base Type=Text, Values=A/B/C |
| category | Text | - | - |
| billing_address | Address | - | - |
| geo_lat | Decimal | - | - |
| geo_lng | Decimal | - | - |
| phone | Phone | - | - |
| last_visit_at | DateTime | - | - |
| owner_id | Ref (User) | - | Source Table=User |
| note | LongText | - | - |
| **geo** (仮想列) | LatLong | Virtual | Expression: `CONCATENATE([geo_lat], ",", [geo_lng])` |

### User テーブル
| 列名 | Type | 備考 |
|---|---|---|
| user_id | Text | KEY |
| name | Text | Label=TRUE |
| email | Email | - |
| department | Text | - |
| home_lat | Decimal | - |
| home_lng | Decimal | - |
| home_label | Text | - |

### Visit テーブル
| 列名 | Type | 備考 |
|---|---|---|
| visit_id | Text | KEY, Initial Value = `UNIQUEID()` |
| account_id | Ref (Account) | Is a part of? = FALSE |
| owner_id | Ref (User) | Initial Value = `LOOKUP(USEREMAIL(), "User", "email", "user_id")` |
| status | Enum | Values = PLANNED/IN_PROGRESS/COMPLETED/CANCELLED/NO_SHOW, Initial=PLANNED |
| purpose | Enum | Values = NEW_PROPOSAL/FOLLOW_UP/COMPLAINT_CARE/RELATIONSHIP/CONTRACT/DELIVERY/OTHER |
| scheduled_at | DateTime | - |
| arrived_at | DateTime | - |
| left_at | DateTime | - |
| duration_min | Number | Virtual 推奨: `MINUTE([left_at] - [arrived_at])` |
| arrived_lat | Decimal | - |
| arrived_lng | Decimal | - |
| arrived_location (仮想列) | LatLong | `CONCATENATE([arrived_lat], ",", [arrived_lng])` |
| opportunity_id | Text | （デモでは空） |
| route_plan_id | Ref (RoutePlan) | - |
| created_at | DateTime | Initial = `NOW()` |

### VisitNote テーブル
| 列名 | Type | 備考 |
|---|---|---|
| note_id | Text | KEY |
| visit_id | Ref (Visit) | Is a part of? = TRUE（親 Visit に紐づく子） |
| kind | Enum | Values = TEXT_TYPED/VOICE_RAW/VOICE_CLEANED/AI_SUMMARY |
| body | LongText | - |
| audio_url | File | - |
| transcribed_at | DateTime | - |
| extracted_next_action | Text | - |
| extracted_next_action_date | Date | - |
| promoted_to_opportunity | Yes/No | - |
| created_at | DateTime | Initial=`NOW()` |

### RoutePlan テーブル
| 列名 | Type | 備考 |
|---|---|---|
| route_plan_id | Text | KEY |
| owner_id | Ref (User) | - |
| plan_date | Date | - |
| status | Enum | Values = DRAFT/OPTIMIZED/IN_PROGRESS/COMPLETED/ABANDONED |
| start_lat / start_lng | Decimal | - |
| start_label | Text | - |
| end_lat / end_lng | Decimal | - |
| end_label | Text | - |
| ordered_visit_ids | LongText | カンマ区切り（デモでは手動入力） |
| total_distance_m / total_duration_s | Number | - |

### Enum テーブル（参考用、ドロップダウン値の一元管理）
- AppSheet の Enum 型直接指定でも動くため、デモでは取込まなくてもよい
- 多言語化・表示順制御したい時に使う

## デモで期待する動作
1. AppSheet アプリを開くと Home に「今日の訪問: 3件」「未記録: 0件」「停滞Account: 1件（acc-010）」が出る
2. Account Map で仙台市内10箇所のピンが見える
3. acc-003 をタップ → 詳細で過去の訪問履歴が時系列で見える（vis-001, vis-002, vis-005 が山田担当分）
4. 「訪問を開始」タップ → status が IN_PROGRESS に変わり、現在地と時刻が記録される
5. Visit Record Quick で最速3タップで商談メモが追加できる
6. 「訪問を終了」タップ → 所要時間が自動計算されて表示
7. Today's Route で今日の2件（vis-006, vis-007）が順序表示される

## 本番移行時の扱い
- このサンプルは**デモのみ**。本番では Supabase PostgreSQL に同名のテーブルを作成し、AppSheet Cloud Database コネクタで接続
- Sheets 経由のデモで動作確認 → Cloud Database に切替えの順で進める
