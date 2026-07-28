import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError, requireAccount, requireOwnedLearner, requireLearnerAccess } from "@/lib/api-helpers";
import { deleteLearner, updateLearnerLevel, updateLearnerTarget, updateLearnerLanguage } from "@/lib/repo/learners";
import { LANGUAGE_CODES } from "@/lib/i18n/languages";
import { invalidateAnalyticsCache } from "@/lib/ai";

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
  uiLanguage: z.enum(LANGUAGE_CODES as [string, ...string[]]).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    // Owner-or-self: the owner can adjust any of their learners' settings,
    // and a learner may adjust their own (e.g. the UI language picker on
    // their own home page) — never a sibling learner's.
    const learner = await requireLearnerAccess(id);
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
    if (body.uiLanguage) {
      await updateLearnerLanguage(id, body.uiLanguage);
      // The cached AI narrative is written in whichever language was active
      // when it was generated — drop it so the next view regenerates in the
      // learner's newly chosen language instead of serving a stale one.
      await invalidateAnalyticsCache(id);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
