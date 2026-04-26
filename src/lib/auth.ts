import { cookies } from "next/headers";
import { mockUsers } from "./mock-data";
import { getUser } from "./db";
import type { User } from "./types";

const COOKIE_NAME = "demo_user_id";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export async function getCurrentUserId(): Promise<string | null> {
  const store = await cookies();
  const v = store.get(COOKIE_NAME)?.value;
  if (v) return v;
  // フォールバック: 最初のデモユーザー（usr-01）
  return mockUsers[0]?.id ?? null;
}

export async function getCurrentUser(): Promise<User | null> {
  const id = await getCurrentUserId();
  if (!id) return mockUsers[0] ?? null;
  return getUser(id) ?? mockUsers[0] ?? null;
}

export async function setCurrentUserId(userId: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, userId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function clearCurrentUserId(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
