import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError, requireAccount } from "@/lib/api-helpers";
import { createLearner, LearnerCapReachedError, listLearners } from "@/lib/repo/learners";

export async function GET() {
  try {
    const account = await requireAccount();
    const learners = await listLearners(account.id);
    return NextResponse.json({ learners, maxLearners: account.max_learners });
  } catch (error) {
    return handleApiError(error);
  }
}

const CreateLearnerSchema = z.object({
  displayName: z.string().min(1).max(40),
  targetLevelCode: z.enum(["N5", "N4", "N3", "N2", "N1"]).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const account = await requireAccount();
    const body = CreateLearnerSchema.parse(await req.json());
    const learner = await createLearner(account.id, body.displayName, body.targetLevelCode ?? "N1");
    return NextResponse.json({ learner });
  } catch (error) {
    if (error instanceof LearnerCapReachedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return handleApiError(error);
  }
}
