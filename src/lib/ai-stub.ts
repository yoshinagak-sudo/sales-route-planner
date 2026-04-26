// メモ文から用件と次のアクションを推測する簡易ルールベース実装。
// Phase 2 で Gemini API に差し替える前提。同じインターフェースを維持する。

import type { VisitPurpose } from "./types";

type InferenceResult = {
  purpose: VisitPurpose | null;
  nextAction: string | null;
  matchedRules: string[];
};

const PURPOSE_RULES: { keys: RegExp; purpose: VisitPurpose; label: string }[] = [
  { keys: /(クレーム|不具合|問題発生|苦情|遅延|誤[配納])/, purpose: "COMPLAINT_CARE", label: "クレーム関連語" },
  { keys: /(契約|発注書|見積もり?|月次契約|年間契約)/, purpose: "CONTRACT", label: "契約関連語" },
  { keys: /(納品|配送|搬入|引き渡し|納入)/, purpose: "DELIVERY", label: "納品関連語" },
  { keys: /(新商品|新規(?:提案|品|商品)|サンプル(?:渡し|提示|送付)|試食|プレゼン|新メニュー)/, purpose: "NEW_PROPOSAL", label: "新規提案関連語" },
  { keys: /(月次|定例|挨拶|顔出し|関係維持|ご機嫌伺い)/, purpose: "RELATIONSHIP", label: "関係維持関連語" },
  { keys: /(フォロー|状況確認|進捗|追っかけ)/, purpose: "FOLLOW_UP", label: "フォロー関連語" },
];

const NEXT_ACTION_PATTERN =
  /([^\n。、,，「」『』]{2,30}?(?:を)?(?:送付|提示|提案|準備|提出|持参|発注|手配|調整|相談|報告|送る|連絡|架電|訪問|再訪|打診|フォロー|送信))/;

const DATE_HINT_PATTERN = /(来週|再来週|月末|来月|今月|月初|今週末|明日|明後日|\d{1,2}月\d{1,2}日?|\d{1,2}\/\d{1,2})/;

export function inferFromMemo(memo: string): InferenceResult {
  const trimmed = (memo ?? "").trim();
  if (!trimmed) {
    return { purpose: null, nextAction: null, matchedRules: [] };
  }

  const matchedRules: string[] = [];

  // 用件: 最初にヒットしたルールを採用
  let purpose: VisitPurpose | null = null;
  for (const r of PURPOSE_RULES) {
    if (r.keys.test(trimmed)) {
      purpose = r.purpose;
      matchedRules.push(r.label);
      break;
    }
  }

  // 次のアクション: 動詞末尾フレーズを抽出
  let nextAction: string | null = null;
  const m = trimmed.match(NEXT_ACTION_PATTERN);
  if (m) {
    let phrase = m[1].trim();
    // 日付ヒントを前置詞として追加
    const d = trimmed.match(DATE_HINT_PATTERN);
    if (d && !phrase.includes(d[1])) {
      phrase = `${d[1]}${phrase}`;
    }
    nextAction = phrase;
    matchedRules.push("動詞末尾フレーズ抽出");
  } else {
    // フォールバック: 日付ヒントだけでも拾う
    const d = trimmed.match(DATE_HINT_PATTERN);
    if (d) {
      nextAction = `${d[1]}対応`;
      matchedRules.push("日付ヒントのみ");
    }
  }

  return { purpose, nextAction, matchedRules };
}
