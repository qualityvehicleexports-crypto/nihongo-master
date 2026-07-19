import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError, requireAccount, requireOwnedLearner } from "@/lib/api-helpers";
import { getQuestionById } from "@/lib/repo/content";
import { recordAttempt } from "@/lib/repo/quiz";

const SubmitSchema = z.object({
  learnerId: z.string(),
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

    const results = [];
    for (const answer of body.answers) {
      const question = await getQuestionById(answer.questionId);
      if (!question) continue;

      const isCorrect = answer.selectedIndex === question.correctIndex;
      await recordAttempt({
        learnerId: body.learnerId,
        questionId: question.id,
        levelId: question.levelId,
        category: question.category,
        isCorrect,
      });

      results.push({
        questionId: question.id,
        isCorrect,
        correctIndex: question.correctIndex,
        explanation: question.explanation,
      });
    }

    const correctCount = results.filter((r) => r.isCorrect).length;
    return NextResponse.json({ results, correctCount, total: results.length });
  } catch (error) {
    return handleApiError(error);
  }
}
