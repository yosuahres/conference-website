"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import {
  attempt,
  fail,
  fieldErrorsOf,
  ok,
  type ActionResult,
} from "@/lib/action-result";
import { profileSchema } from "@/lib/validation/registration";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";

export async function updateProfile(
  input: unknown,
): Promise<ActionResult<void>> {
  return attempt(async () => {
    const user = await requireUser();

    const parsed = profileSchema.safeParse(input);
    if (!parsed.success) {
      return fail(
        "Please correct the highlighted fields.",
        fieldErrorsOf(parsed.error),
      );
    }
    const data = parsed.data;

    await db
      .update(users)
      .set({
        name: data.name,
        title: data.title || null,
        affiliation: data.affiliation || null,
        country: data.country || null,
        phone: data.phone || null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    revalidatePath("/dashboard/profile");
    return ok();
  });
}
