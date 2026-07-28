import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAccountByEmail } from "@/lib/repo/accounts";
import { getLearnerByLoginId } from "@/lib/repo/learners";
import { setSessionCookie, signSession, verifyPassword } from "@/lib/auth";
import { handleApiError } from "@/lib/api-helpers";

// One shared login form for both principals: the account owner signs in
// with their email, and a learner signs in with the login_id the owner
// issued them (see POST /api/learners/[id]/credentials). `identifier` holds
// whichever of the two the person typed; we try an owner match first, then
// fall back to a learner match, so the same form works for both without the
// user having to declare which kind of account they have.
const LoginSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1),
});

// Fixed dummy hash so an "identifier not found at all" response takes about
// as long as a "found but wrong password" one — keeps login timing from
// hinting at which identifiers exist in either table.
const DUMMY_HASH = "$2a$10$CwTycUXWue0Thq9StjUM0uJ8Fx/rB5tGWU2WlNzqSbC0k24hOEEqW";

export async function POST(req: NextRequest) {
  try {
    const body = LoginSchema.parse(await req.json());
    const identifier = body.identifier.trim();

    const account = await getAccountByEmail(identifier);
    if (account) {
      if (await verifyPassword(body.password, account.password_hash)) {
        const token = signSession({ role: "owner", accountId: account.id, email: account.email });
        await setSessionCookie(token);
        return NextResponse.json({
          role: "owner",
          account: { id: account.id, email: account.email, plan: account.plan, maxLearners: account.max_learners },
        });
      }
      return NextResponse.json({ error: "IDまたはパスワードが違います。" }, { status: 401 });
    }

    const learner = await getLearnerByLoginId(identifier);
    if (learner && learner.password_hash) {
      if (await verifyPassword(body.password, learner.password_hash)) {
        const token = signSession({
          role: "learner",
          learnerId: learner.id,
          accountId: learner.account_id,
          loginId: learner.login_id as string,
        });
        await setSessionCookie(token);
        return NextResponse.json({
          role: "learner",
          learner: { id: learner.id, displayName: learner.display_name },
        });
      }
      return NextResponse.json({ error: "IDまたはパスワードが違います。" }, { status: 401 });
    }

    // Neither an account email nor a learner login_id matched — burn
    // roughly the same time as a real password check before responding.
    await verifyPassword(body.password, DUMMY_HASH);
    return NextResponse.json({ error: "IDまたはパスワードが違います。" }, { status: 401 });
  } catch (error) {
    return handleApiError(error);
  }
}
