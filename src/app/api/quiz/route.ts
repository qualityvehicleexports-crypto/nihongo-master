import { NextRequest, NextResponse } from "next/server";
import { handleApiError, requireLearnerAccess, requireSession } from "@/lib/api-helpers";
import { getQuizSet } from "@/lib/repo/content";

export async function GET(req: NextRequest) {
  try {
    await requireSession();
    const { searchParams } = new URL(req.url);
    const levelId = searchParams.get("levelId");
    const category = searchParams.get("category") ?? undefined;
    const count = Number(searchParams.get("count") ?? "10");
    const learnerId = searchParams.get("learnerId");

    if (!levelId) {
      return NextResponse.json({ error: "levelId is required" }, { status: 400 });
    }

    // learnerId is used only to localize vocabulary/grammar answer choices
    // into that learner's ui_language — quiz access itself only requires a
    // valid session (checked above), so a missing/invalid learnerId falls
    // back to the default (Japanese) choice text rather than failing.
    const learner = learnerId ? await requireLearnerAccess(learnerId).catch(() => null) : null;

    const questions = await getQuizSet(levelId, category, count, learner?.ui_language);
    // Never leak the correct answer / explanation before submission.
    const sanitized = questions.map((q) => ({
      id: q.id,
      levelId: q.levelId,
      category: q.category,
      prompt: q.prompt,
      choices: q.choices,
    }));
    return NextResponse.json({ questions: sanitized });
  } catch (error) {
    return handleApiError(error);
  }
}
