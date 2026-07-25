import { NextRequest, NextResponse } from "next/server";
import { handleApiError, requireAccount } from "@/lib/api-helpers";
import { getMockExamQuestions, MOCK_EXAM_CONFIG, MOCK_EXAM_EDITIONS } from "@/lib/repo/mockExam";

export async function GET(req: NextRequest) {
  try {
    await requireAccount();
    const { searchParams } = new URL(req.url);
    const levelId = searchParams.get("levelId");
    const editionRaw = searchParams.get("edition");
    const edition = Number(editionRaw);

    if (!levelId) {
      return NextResponse.json({ error: "levelId is required" }, { status: 400 });
    }
    if (!editionRaw || !MOCK_EXAM_EDITIONS.includes(edition)) {
      return NextResponse.json({ error: "edition must be one of 1-5" }, { status: 400 });
    }

    const config = MOCK_EXAM_CONFIG[levelId as keyof typeof MOCK_EXAM_CONFIG];
    if (!config) {
      return NextResponse.json({ error: "Unknown levelId" }, { status: 400 });
    }

    const questions = await getMockExamQuestions(levelId, edition);
    // Never leak the correct answer / explanation before submission.
    const sanitized = questions.map((q) => ({
      id: q.id,
      levelId: q.levelId,
      category: q.category,
      prompt: q.prompt,
      choices: q.choices,
    }));

    return NextResponse.json({
      questions: sanitized,
      structure: {
        sections: config.sections.map((s) => ({
          key: s.key,
          categories: s.categories,
          maxScore: s.maxScore,
          minPassScore: s.minPassScore,
        })),
        totalMax: config.totalMax,
        totalPassMark: config.totalPassMark,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}