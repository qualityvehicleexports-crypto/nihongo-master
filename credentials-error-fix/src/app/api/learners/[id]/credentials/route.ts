import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError, requireAccount, requireOwnedLearner } from "@/lib/api-helpers";
import { issueLearnerCredentials, LoginIdTakenError, suggestLoginId } from "@/lib/repo/learners";
import { generatePassword, loginIdSlugFromEmail } from "@/lib/credentials";

// Owner-only: issues (or reissues) a learner's own sign-in ID/password, so
// they can log in directly instead of going through the owner's account.
// The plaintext password is returned exactly once in this response — only
// its bcrypt hash is ever stored, so if it's lost the owner must reissue
// (overwriting the old credentials) rather than "look it up" again.
const IssueSchema = z.object({
  loginId: z.string().trim().min(3).max(40).regex(/^[a-zA-Z0-9._-]+$/, "半角英数字・.・_・- のみ使用できます。").optional(),
  password: z.string().min(6).max(72).optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const account = await requireAccount();
    await requireOwnedLearner(id, account.id);

    const parsed = IssueSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      // Surface the actual validation problem (e.g. "パスワードは6文字以上に
      // してください") instead of the generic 500 handleApiError() falls back
      // to for anything that isn't an ApiError — a Zod error on owner-typed
      // input is a normal, expected case here, not a server fault.
      const issue = parsed.error.issues[0];
      const field = issue?.path?.[0];
      const message =
        field === "password"
          ? "パスワードは6文字以上にしてください。"
          : field === "loginId"
            ? issue?.message ?? "ログインIDの形式が正しくありません（3〜40文字）。"
            : "入力内容を確認してください。";
      return NextResponse.json({ error: message }, { status: 400 });
    }
    const body = parsed.data;

    const loginId = body.loginId ?? (await suggestLoginId(loginIdSlugFromEmail(account.email)));
    const password = body.password ?? generatePassword();

    await issueLearnerCredentials(id, loginId, password);

    return NextResponse.json({ loginId, password });
  } catch (error) {
    if (error instanceof LoginIdTakenError) {
      return NextResponse.json({ error: "このログインIDは既に使用されています。" }, { status: 409 });
    }
    return handleApiError(error);
  }
}
