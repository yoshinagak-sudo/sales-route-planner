"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  startVisit,
  startVisitForAccount,
  finishVisit,
  addVisitNote,
} from "./db";
import { getCurrentUserId } from "./auth";

export async function startVisitAtAccountAction(accountId: string) {
  const userId = (await getCurrentUserId()) ?? "usr-01";
  const visit = startVisitForAccount(accountId, userId);
  revalidatePath("/");
  revalidatePath(`/accounts/${accountId}`);
  redirect(`/visits/${visit.id}/record`);
}

export async function startVisitAction(visitId: string) {
  const v = startVisit(visitId);
  if (!v) throw new Error("Visit not found");
  revalidatePath("/");
  revalidatePath(`/visits/${visitId}`);
  redirect(`/visits/${visitId}/record`);
}

export async function finishVisitAction(visitId: string, formData?: FormData) {
  const note = formData?.get("body");
  const action = formData?.get("nextAction");
  const v = finishVisit(visitId);
  if (!v) throw new Error("Visit not found");
  if (typeof note === "string" && note.trim().length > 0) {
    addVisitNote({
      visitId,
      body: note.trim(),
      extractedNextAction: typeof action === "string" && action.trim() ? action.trim() : null,
    });
  }
  revalidatePath("/");
  revalidatePath(`/accounts/${v.accountId}`);
  revalidatePath(`/visits/${visitId}`);
  redirect("/");
}

export async function addNoteAction(visitId: string, formData: FormData) {
  const body = formData.get("body");
  if (typeof body !== "string" || body.trim().length === 0) {
    throw new Error("メモが空です");
  }
  addVisitNote({ visitId, body: body.trim() });
  revalidatePath(`/visits/${visitId}`);
}
