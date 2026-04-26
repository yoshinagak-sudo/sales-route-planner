import { NextResponse } from "next/server";

export type ApiOk<T> = { data: T; error: null };
export type ApiErr = { data: null; error: { message: string; code?: string } };
export type ApiResponse<T> = ApiOk<T> | ApiErr;

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiOk<T>>({ data, error: null }, init);
}

export function fail(message: string, status = 400, code?: string) {
  return NextResponse.json<ApiErr>(
    { data: null, error: { message, code } },
    { status }
  );
}

export function handleError(e: unknown) {
  console.error("[api error]", e);
  const message = e instanceof Error ? e.message : "Unknown error";
  if (message.startsWith("NO_USER")) return fail(message, 401, "NO_USER");
  return fail(message, 500);
}
