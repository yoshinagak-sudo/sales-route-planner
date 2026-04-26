// Prisma 不要の Mock 版。enum を string union として再定義

export const AccountRank = { A: "A", B: "B", C: "C" } as const;
export type AccountRank = (typeof AccountRank)[keyof typeof AccountRank];

export const VisitStatus = {
  PLANNED: "PLANNED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  NO_SHOW: "NO_SHOW",
} as const;
export type VisitStatus = (typeof VisitStatus)[keyof typeof VisitStatus];

export const VisitPurpose = {
  NEW_PROPOSAL: "NEW_PROPOSAL",
  FOLLOW_UP: "FOLLOW_UP",
  COMPLAINT_CARE: "COMPLAINT_CARE",
  RELATIONSHIP: "RELATIONSHIP",
  CONTRACT: "CONTRACT",
  DELIVERY: "DELIVERY",
  OTHER: "OTHER",
} as const;
export type VisitPurpose = (typeof VisitPurpose)[keyof typeof VisitPurpose];

export const NoteKind = {
  TEXT_TYPED: "TEXT_TYPED",
  VOICE_RAW: "VOICE_RAW",
  VOICE_CLEANED: "VOICE_CLEANED",
  AI_SUMMARY: "AI_SUMMARY",
} as const;
export type NoteKind = (typeof NoteKind)[keyof typeof NoteKind];

export const OpportunityStatus = {
  OPEN: "OPEN",
  WON: "WON",
  LOST: "LOST",
} as const;
export type OpportunityStatus =
  (typeof OpportunityStatus)[keyof typeof OpportunityStatus];

export const RoutePlanStatus = {
  DRAFT: "DRAFT",
  OPTIMIZED: "OPTIMIZED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  ABANDONED: "ABANDONED",
} as const;
export type RoutePlanStatus =
  (typeof RoutePlanStatus)[keyof typeof RoutePlanStatus];

// ============= 表示用ラベル辞書 =============

export const VISIT_STATUS_LABEL: Record<string, string> = {
  PLANNED: "予定",
  IN_PROGRESS: "訪問中",
  COMPLETED: "完了",
  CANCELLED: "キャンセル",
  NO_SHOW: "不在",
};

export const VISIT_PURPOSE_LABEL: Record<string, string> = {
  NEW_PROPOSAL: "新規提案",
  FOLLOW_UP: "フォロー",
  COMPLAINT_CARE: "クレーム対応",
  RELATIONSHIP: "関係維持",
  CONTRACT: "契約交渉",
  DELIVERY: "納品同行",
  OTHER: "その他",
};

export const ACCOUNT_RANK_LABEL: Record<string, string> = {
  A: "A（大口）",
  B: "B（中規模）",
  C: "C（小口）",
};

export const DORMANT_DAYS_THRESHOLD = 30;

// ============= ドメインモデル =============

export type User = {
  id: string;
  email: string;
  name: string;
  department: string | null;
  homeLat: number | null;
  homeLng: number | null;
  homeLabel: string | null;
};

export type Contact = {
  id: string;
  accountId: string;
  name: string;
  nameKana: string | null;
  role: string | null;
  email: string | null;
  phone: string | null;
  isPrimary: boolean;
};

export type Account = {
  id: string;
  name: string;
  nameKana: string | null;
  rank: AccountRank;
  category: string | null;
  billingAddress: string;
  geoLat: number | null;
  geoLng: number | null;
  phone: string | null;
  note: string | null;
  lastVisitAt: Date | null;
  ownerId: string;
};

export type Opportunity = {
  id: string;
  accountId: string;
  title: string;
  status: OpportunityStatus;
  amount: number | null;
  dueDate: Date | null;
  nextAction: string | null;
  nextActionDate: Date | null;
};

export type Visit = {
  id: string;
  accountId: string;
  ownerId: string;
  status: VisitStatus;
  purpose: VisitPurpose | null;
  scheduledAt: Date;
  arrivedAt: Date | null;
  leftAt: Date | null;
  durationMin: number | null;
  arrivedLat: number | null;
  arrivedLng: number | null;
  routePlanId: string | null;
  opportunityId: string | null;
};

export type VisitNote = {
  id: string;
  visitId: string;
  kind: NoteKind;
  body: string;
  audioUrl: string | null;
  transcribedAt: Date | null;
  extractedNextAction: string | null;
  extractedNextActionDate: Date | null;
  promotedToOpportunity: boolean;
  createdAt: Date;
};

export type RoutePlan = {
  id: string;
  ownerId: string;
  planDate: Date;
  status: RoutePlanStatus;
  startLat: number;
  startLng: number;
  startLabel: string;
  endLat: number;
  endLng: number;
  endLabel: string;
  orderedVisitIds: string | null;
  totalDistanceM: number | null;
  totalDurationS: number | null;
};
