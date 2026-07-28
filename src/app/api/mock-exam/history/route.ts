import { NextRequest, NextResponse } from "next/server";
import { handleApiError, requireLearnerAccess } from "@/lib/api-helpers";
import { getLatestMockExamAttempts } from "@/lib/repo/mockExam";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const learnerId = searchParams.get("learnerId");
    const levelId = searchParams.get("levelId");

    if (!learnerId || !levelId) {
      return NextResponse.json({ error: "learnerId and levelId are required" }, { status: 400 });
    }
    await requireLearnerAccess(learnerId);

    const latest = await getLatestMockExamAttempts(learnerId, levelId);
    const attempts = [...latest.entries()].map(([edition, row]) => ({
      edition,
      totalScaled: row.total_scaled,
      totalMax: row.total_max,
      passed: row.passed === 1,
      passProbabilityPercent: row.pass_probability_percent,
      takenAt: row.taken_at,
    }));

    return NextResponse.json({ attempts });
  } catch (error) {
    return handleApiError(error);
  }
}
