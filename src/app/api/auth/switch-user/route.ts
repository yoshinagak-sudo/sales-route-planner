import { NextRequest } from "next/server";
import { z } from "zod";
import { setCurrentUserId, clearCurrentUserId } from "@/lib/auth";
import { getUser } from "@/lib/db";
import { ok, fail, handleError } from "@/lib/api";

const Body = z.object({
  userId: z.string().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const { userId } = Body.parse(json);

    if (userId === null) {
      await clearCurrentUserId();
      return ok({ user: null });
    }

    const user = getUser(userId);
    if (!user) return fail("ユーザーが見つかりません", 404);

    await setCurrentUserId(userId);
    return ok({ user });
  } catch (e) {
    return handleError(e);
  }
}
