import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAccountByEmail } from "@/lib/repo/accounts";
import { setSessionCookie, signSession, verifyPassword } from "@/lib/auth";
import { handleApiError } from "@/lib/api-helpers";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = LoginSchema.parse(await req.json());
    const account = await getAccountByEmail(body.email);
    if (!account || !(await verifyPassword(body.password, account.password_hash))) {
      return NextResponse.json({ error: "メールアドレスまたはパスワードが違います。" }, { status: 401 });
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
