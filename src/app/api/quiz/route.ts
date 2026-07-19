import { NextRequest, NextResponse } from "next/server";
import { handleApiError, requireAccount } from "@/lib/api-helpers";
import { getQuizSet } from "@/lib/repo/content";

export async function GET(req: NextRequest) {
  try {
    await requireAccount();
    const { searchParams } = new URL(req.url);
    const levelId = searchParams.get("levelId");
    const category = searchParams.get("category") ?? undefined;
    const count = Number(searchParams.get("count") ?? "10");

    if (!levelId) {
      return NextResponse.json({ error: "levelId is required" }, { status: 400 });
    }

    const questions = await getQuizSet(levelId, category, count);
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
