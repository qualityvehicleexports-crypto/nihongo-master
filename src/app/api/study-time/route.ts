import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError, requireAccount, requireOwnedLearner } from "@/lib/api-helpers";
import { recordStudySession } from "@/lib/repo/studyTime";
import { invalidateAnalyticsCache } from "@/lib/ai";

// Reported by StudyTimeTracker (see src/components/StudyTimeTracker.tsx) via
// periodic fetch() heartbeats and a final navigator.sendBeacon() flush on
// page hide/unload. sendBeacon bodies arrive without a JSON content-type
// header, but NextRequest.json() parses the raw body regardless, so both
// paths land here the same way.
const StudyTimeSchema = z.object({
  learnerId: z.string(),
  activityType: z.enum(["quiz", "browse"]),
  levelId: z.string(),
  durationSeconds: z.number().nonnegative(),
});

export async function POST(req: NextRequest) {
  try {
    const account = await requireAccount();
    const body = StudyTimeSchema.parse(await req.json());
    await requireOwnedLearner(body.learnerId, account.id);

    await recordStudySession(body.learnerId, body.activityType, body.levelId, body.durationSeconds);
    // Study time feeds into the analytics narrative (pace/streak framing), so
    // invalidate the cache the same way a quiz submission does — cheap
    // single-row delete, and keeps the next dashboard view current.
    await invalidateAnalyticsCache(body.learnerId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}