import { NextResponse } from "next/server";
import { requireAccount, handleApiError } from "@/lib/api-helpers";
import { countLearners } from "@/lib/repo/learners";

export async function GET() {
  try {
    const account = await requireAccount();
    const learnerCount = await countLearners(account.id);
    return NextResponse.json({
      account: {
        id: account.id,
        email: account.email,
        plan: account.plan,
        maxLearners: account.max_learners,
        subscriptionStatus: account.subscription_status,
        trialEndsAt: account.trial_ends_at,
        learnerCount,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
