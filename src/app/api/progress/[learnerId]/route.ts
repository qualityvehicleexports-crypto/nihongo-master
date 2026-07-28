import { NextRequest, NextResponse } from "next/server";
import { handleApiError, requireLearnerAccess } from "@/lib/api-helpers";
import { accuracyByCategory, accuracyByLevel, dailyActivity, overallStats } from "@/lib/repo/progress";

export async function GET(req: NextRequest, { params }: { params: Promise<{ learnerId: string }> }) {
  try {
    const { learnerId } = await params;
    await requireLearnerAccess(learnerId);

    const [overall, categoryStats, levelStats, dailyTrend] = await Promise.all([
      overallStats(learnerId),
      accuracyByCategory(learnerId),
      accuracyByLevel(learnerId),
      dailyActivity(learnerId, 30),
    ]);

    return NextResponse.json({ overall, categoryStats, levelStats, dailyTrend });
  } catch (error) {
    return handleApiError(error);
  }
}
