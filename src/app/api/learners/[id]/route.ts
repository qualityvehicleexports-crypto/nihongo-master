import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError, requireAccount, requireOwnedLearner } from "@/lib/api-helpers";
import { deleteLearner, updateLearnerLevel, updateLearnerTarget } from "@/lib/repo/learners";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const account = await requireAccount();
    await requireOwnedLearner(id, account.id);
    await deleteLearner(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}

const UpdateSchema = z.object({
  currentLevelCode: z.enum(["N5", "N4", "N3", "N2", "N1"]).optional(),
  targetLevelCode: z.enum(["N5", "N4", "N3", "N2", "N1"]).optional(),
  targetExamDate: z.string().nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const account = await requireAccount();
    const learner = await requireOwnedLearner(id, account.id);
    const body = UpdateSchema.parse(await req.json());

    if (body.currentLevelCode) {
      await updateLearnerLevel(id, body.currentLevelCode);
    }
    if (body.targetLevelCode || body.targetExamDate !== undefined) {
      await updateLearnerTarget(
        id,
        body.targetLevelCode ?? learner.target_level_code,
        body.targetExamDate ?? learner.target_exam_date,
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
