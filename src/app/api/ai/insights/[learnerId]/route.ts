import { NextRequest, NextResponse } from "next/server";
import { handleApiError, requireAccount, requireOwnedLearner } from "@/lib/api-helpers";
import { getAnalytics } from "@/lib/ai";

export async function GET(req: NextRequest, { params }: { params: Promise<{ learnerId: string }> }) {
  try {
    const { learnerId } = await params;
    const account = await requireAccount();
    await requireOwnedLearner(learnerId, account.id);

    const { searchParams } = new URL(req.url);
    const forceRefresh = searchParams.get("refresh") === "1";

    const analytics = await getAnalytics(learnerId, { forceRefresh });
    return NextResponse.json({ analytics });
  } catch (error) {
    return handleApiError(error);
  }
}
