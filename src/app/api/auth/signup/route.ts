import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAccount, getAccountByEmail } from "@/lib/repo/accounts";
import { createLearner } from "@/lib/repo/learners";
import { hashPassword, setSessionCookie, signSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api-helpers";

const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "パスワードは8文字以上にしてください。"),
  firstLearnerName: z.string().min(1).max(40).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = SignupSchema.parse(await req.json());

    const existing = await getAccountByEmail(body.email);
    if (existing) {
      return NextResponse.json({ error: "このメールアドレスは既に登録されています。" }, { status: 409 });
    }

    const passwordHash = await hashPassword(body.password);
    const account = await createAccount(body.email, passwordHash);

    if (body.firstLearnerName) {
      await createLearner(account.id, body.firstLearnerName);
    }

    const token = signSession({ accountId: account.id, email: account.email });
    await setSessionCookie(token);

    return NextResponse.json({
      account: { id: account.id, email: account.email, plan: account.plan, maxLearners: account.max_learners },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
