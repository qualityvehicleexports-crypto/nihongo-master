import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listLearners, toPublicLearner } from "@/lib/repo/learners";
import { getAccountById } from "@/lib/repo/accounts";
import { getLearnerSummaryCards } from "@/lib/dashboardSummary";
import LearnerGrid from "@/components/LearnerGrid";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null; // layout already redirects

  // The roster grid below shows every learner's name, avatar, and stats side
  // by side — exactly the cross-learner visibility a learner session must
  // never get. A learner who signed in with their own login goes straight
  // to their own page instead.
  if (session.role === "learner") redirect(`/dashboard/learner/${session.learnerId}`);

  const account = await getAccountById(session.accountId);
  const learners = await listLearners(session.accountId);
  const summaries = await getLearnerSummaryCards(learners.map((l) => l.id));
  const publicLearners = learners.map(toPublicLearner);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          誰が学習しますか？
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          このアカウントでは最大{account?.max_learners ?? 20}人の学習者プロフィールを作成できます。
        </p>
      </div>
      <LearnerGrid initialLearners={publicLearners} maxLearners={account?.max_learners ?? 20} initialSummaries={summaries} />
    </div>
  );
}
