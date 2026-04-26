import {
  mockAccounts,
  mockContacts,
  mockOpportunities,
  mockUsers,
  mockVisits,
  mockVisitNotes,
  mockRoutePlans,
} from "./mock-data";
import type {
  Account,
  AccountRank,
  Contact,
  Opportunity,
  RoutePlan,
  User,
  Visit,
  VisitNote,
  VisitStatus,
} from "./types";
import { DORMANT_DAYS_THRESHOLD } from "./types";

// ============= Users =============
export function getUsers(): User[] {
  return mockUsers;
}

export function getUser(id: string): User | null {
  return mockUsers.find((u) => u.id === id) ?? null;
}

// ============= Accounts =============
export function getAccounts(opts?: {
  ownerId?: string | null;
  rank?: AccountRank | null;
  q?: string | null;
}): Account[] {
  return mockAccounts.filter((a) => {
    if (opts?.ownerId && a.ownerId !== opts.ownerId) return false;
    if (opts?.rank && a.rank !== opts.rank) return false;
    if (opts?.q) {
      const q = opts.q.toLowerCase();
      const hay = `${a.name} ${a.nameKana ?? ""} ${a.billingAddress}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function getAccount(id: string): Account | null {
  return mockAccounts.find((a) => a.id === id) ?? null;
}

export function getAccountWithRelations(id: string) {
  const account = getAccount(id);
  if (!account) return null;
  const owner = getUser(account.ownerId);
  const contacts = mockContacts.filter((c) => c.accountId === id);
  const opportunities = mockOpportunities.filter((o) => o.accountId === id);
  const visits = mockVisits
    .filter((v) => v.accountId === id)
    .sort((a, b) => b.scheduledAt.getTime() - a.scheduledAt.getTime());
  return { ...account, owner, contacts, opportunities, visits };
}

export function getDormantAccountsForUser(
  userId: string,
  rank: AccountRank = "A",
): Account[] {
  const threshold = Date.now() - DORMANT_DAYS_THRESHOLD * 24 * 60 * 60 * 1000;
  return mockAccounts
    .filter((a) => a.ownerId === userId && a.rank === rank)
    .filter((a) => !a.lastVisitAt || a.lastVisitAt.getTime() < threshold)
    .sort((a, b) => {
      const ta = a.lastVisitAt?.getTime() ?? 0;
      const tb = b.lastVisitAt?.getTime() ?? 0;
      return ta - tb;
    });
}

// ============= Contacts =============
export function getContactsForAccount(accountId: string): Contact[] {
  return mockContacts
    .filter((c) => c.accountId === accountId)
    .sort((a, b) =>
      a.isPrimary === b.isPrimary ? a.name.localeCompare(b.name) : a.isPrimary ? -1 : 1,
    );
}

export function getAllContacts(): Contact[] {
  return mockContacts;
}

// ============= Opportunities =============
export function getOpenOpportunitiesForAccount(accountId: string): Opportunity[] {
  return mockOpportunities.filter(
    (o) => o.accountId === accountId && o.status === "OPEN",
  );
}

// ============= Visits =============
export function getVisitsToday(userId: string): (Visit & { account: Account })[] {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return mockVisits
    .filter((v) => v.ownerId === userId)
    .filter(
      (v) =>
        v.scheduledAt >= start &&
        v.scheduledAt <= end &&
        ["PLANNED", "IN_PROGRESS", "COMPLETED"].includes(v.status),
    )
    .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())
    .map((v) => ({ ...v, account: getAccount(v.accountId)! }));
}

export function getInProgressVisitForUser(userId: string): Visit | null {
  return mockVisits.find((v) => v.ownerId === userId && v.status === "IN_PROGRESS") ?? null;
}

export function getInProgressVisitForAccount(accountId: string): Visit | null {
  return (
    mockVisits.find((v) => v.accountId === accountId && v.status === "IN_PROGRESS") ?? null
  );
}

export function getPendingNoteVisits(userId: string): Visit[] {
  return mockVisits
    .filter((v) => v.ownerId === userId && v.status === "COMPLETED")
    .filter((v) => !mockVisitNotes.some((n) => n.visitId === v.id));
}

export function getVisit(id: string) {
  const v = mockVisits.find((x) => x.id === id);
  if (!v) return null;
  const account = getAccount(v.accountId);
  const owner = getUser(v.ownerId);
  const notes = getNotesForVisit(id);
  return { ...v, account, owner, notes };
}

export function getVisitsForAccount(accountId: string, limit = 20): Visit[] {
  return mockVisits
    .filter((v) => v.accountId === accountId)
    .sort((a, b) => b.scheduledAt.getTime() - a.scheduledAt.getTime())
    .slice(0, limit);
}

export function getRecentVisitsForUser(userId: string, days = 30): Visit[] {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return mockVisits
    .filter((v) => v.ownerId === userId && v.status === "COMPLETED")
    .filter((v) => (v.leftAt ?? v.scheduledAt).getTime() >= cutoff)
    .sort(
      (a, b) =>
        (b.leftAt ?? b.scheduledAt).getTime() - (a.leftAt ?? a.scheduledAt).getTime(),
    );
}

export function countAccountsForUser(userId: string): number {
  return mockAccounts.filter((a) => a.ownerId === userId).length;
}

// ============= Notes =============
export function getNotesForVisit(visitId: string): VisitNote[] {
  return mockVisitNotes
    .filter((n) => n.visitId === visitId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

// ============= RoutePlans =============
export function getRoutePlanForToday(userId: string): RoutePlan | null {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return (
    mockRoutePlans.find(
      (r) => r.ownerId === userId && r.planDate >= start && r.planDate <= end,
    ) ?? null
  );
}

// ============= Mutations (in-memory) =============

export function startVisit(visitId: string): Visit | null {
  const v = mockVisits.find((x) => x.id === visitId);
  if (!v) return null;
  v.status = "IN_PROGRESS";
  v.arrivedAt = new Date();
  return v;
}

export function startVisitForAccount(accountId: string, ownerId: string): Visit {
  const existing = getInProgressVisitForAccount(accountId);
  if (existing) return existing;
  const id = `vis-${Date.now()}`;
  const visit: Visit = {
    id,
    accountId,
    ownerId,
    status: "IN_PROGRESS",
    purpose: null,
    scheduledAt: new Date(),
    arrivedAt: new Date(),
    leftAt: null,
    durationMin: null,
    arrivedLat: null,
    arrivedLng: null,
    routePlanId: null,
    opportunityId: null,
  };
  mockVisits.push(visit);
  return visit;
}

export function finishVisit(visitId: string): Visit | null {
  const v = mockVisits.find((x) => x.id === visitId);
  if (!v) return null;
  v.status = "COMPLETED";
  v.leftAt = new Date();
  if (v.arrivedAt) {
    v.durationMin = Math.round((v.leftAt.getTime() - v.arrivedAt.getTime()) / 60000);
  }
  // Account の lastVisitAt 更新
  const account = mockAccounts.find((a) => a.id === v.accountId);
  if (account) account.lastVisitAt = v.leftAt;
  return v;
}

export function setVisitStatus(visitId: string, status: VisitStatus): Visit | null {
  const v = mockVisits.find((x) => x.id === visitId);
  if (!v) return null;
  v.status = status;
  return v;
}

export function addVisitNote(input: {
  visitId: string;
  body: string;
  kind?: VisitNote["kind"];
  extractedNextAction?: string | null;
  extractedNextActionDate?: Date | null;
}): VisitNote {
  const note: VisitNote = {
    id: `note-${Date.now()}`,
    visitId: input.visitId,
    kind: input.kind ?? "TEXT_TYPED",
    body: input.body,
    audioUrl: null,
    transcribedAt: null,
    extractedNextAction: input.extractedNextAction ?? null,
    extractedNextActionDate: input.extractedNextActionDate ?? null,
    promotedToOpportunity: false,
    createdAt: new Date(),
  };
  mockVisitNotes.push(note);
  return note;
}
