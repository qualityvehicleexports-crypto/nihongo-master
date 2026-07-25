import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError, requireAccount, requireOwnedLearner } from "@/lib/api-helpers";
import { getQuestionById } from "@/lib/repo/content";
import { scoreMockExam, recordMockExamAttempt, MOCK_EXAM_EDITIONS } from "@/lib/repo/mockExam";

const SubmitSchema = z.object({
  learnerId: z.string(),
  levelId: z.string(),
  edition: z.number().int(),
  answers: z.array(
    z.object({
      questionId: z.string(),
      selectedIndex: z.number().int().min(0),
    }),
  ),
});

export async function POST(req: NextRequest) {
  try {
    const account = await requireAccount();
    const body = SubmitSchema.parse(await req.json());
    await requireOwnedLearner(body.learnerId, account.id);

    if (!MOCK_EXAM_EDITIONS.includes(body.edition)) {
      return NextResponse.json({ error: "edition must be one of 1-5" }, { status: 400 });
    }

    const results: {
      questionId: string;
      category: string;
      isCorrect: boolean;
      correctIndex: number;
      explanation: string;
    }[] = [];

    for (const answer of body.answers) {
      const question = await getQuestionById(answer.questionId);
      if (!question) continue;
      const isCorrect = answer.selectedIndex === question.correctIndex;
      results.push({
        questionId: question.id,
        category: question.category,
        isCorrect,
        correctIndex: question.correctIndex,
        explanation: question.explanation,
      });
    }

    // Deliberately NOT recordAttempt()/quiz_attempts here — mock exam results
    // stay fully separate from regular practice-quiz stats, weakItems, streak,
    // and the trend-based pace.passProbabilityPercent in src/lib/ai.ts. This
    // exam's pass-probability prediction is based only on this attempt's own
    // score, computed below.
    const score = scoreMockExam(
      body.levelId,
      results.map((r) => ({ category: r.category, isCorrect: r.isCorrect })),
    );

    await recordMockExamAttempt({
      learnerId: body.learnerId,
      levelId: body.levelId,
      edition: body.edition,
      score,
    });

    return NextResponse.json({
      results: results.map((r) => ({
        questionId: r.questionId,
        isCorrect: r.isCorrect,
        correctIndex: r.correctIndex,
        explanation: r.explanation,
      })),
      score,
    });
  } catch (error) {
    return handleApiError(error);
  }
}